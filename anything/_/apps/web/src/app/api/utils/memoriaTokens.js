import argon2 from "argon2";
import crypto from "node:crypto";
import sql from "@/app/api/utils/sql";

function getConfiguredAdminKeys() {
  return [
    process.env.ENTERPRISE_MEMORY_KEY,
    process.env.BUSINESS_MEMORY_KEY,
    process.env.APP_MEMORY_KEY,
  ].filter(Boolean);
}

export function requireAdminKey(request) {
  const configured = getConfiguredAdminKeys();
  if (configured.length === 0) {
    // If no admin keys are configured, we do not allow admin actions.
    // This prevents "open admin" by accident.
    const err = new Error(
      "Admin keys are not configured. Set ENTERPRISE_MEMORY_KEY (recommended) to manage tokens.",
    );
    err.status = 500;
    throw err;
  }

  const headerKey = request.headers.get("x-admin-key");
  if (!headerKey || !configured.includes(headerKey)) {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
}

function randomTokenPart(lengthBytes) {
  try {
    return crypto.randomBytes(lengthBytes).toString("base64url");
  } catch {
    const text = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return text.replace(/[^a-zA-Z0-9]/g, "").slice(0, lengthBytes * 2);
  }
}

export async function createMemoriaBearerToken({
  label,
  appSource,
  canRead,
  canWrite,
  expiresAt,
  rateLimitPerMinute,
}) {
  const tokenId = `${randomTokenPart(12)}${randomTokenPart(6)}`;
  const tokenSecret = randomTokenPart(32);

  const token = `memoria.${tokenId}.${tokenSecret}`;
  const tokenHash = await argon2.hash(tokenSecret);

  const labelFinal = label ? String(label).slice(0, 200) : null;
  const appSourceFinal = appSource
    ? String(appSource).slice(0, 200)
    : "unknown";

  const canReadFinal = canRead !== false;
  const canWriteFinal = canWrite !== false;

  let expiresAtFinal = null;
  if (expiresAt) {
    const d = new Date(expiresAt);
    if (!Number.isNaN(d.getTime())) {
      expiresAtFinal = d.toISOString();
    }
  }

  const rlRaw = Number(rateLimitPerMinute);
  const rateLimitFinal = Number.isFinite(rlRaw)
    ? Math.max(1, Math.min(rlRaw, 10_000))
    : 120;

  await sql(
    "INSERT INTO public.memoria_api_tokens (token_id, token_hash, label, scope, app_source, can_read, can_write, expires_at, rate_limit_per_minute) VALUES ($1, $2, $3, 'memoria', $4, $5, $6, $7, $8)",
    [
      tokenId,
      tokenHash,
      labelFinal,
      appSourceFinal,
      canReadFinal,
      canWriteFinal,
      expiresAtFinal,
      rateLimitFinal,
    ],
  );

  return {
    token,
    tokenId,
    label: labelFinal,
    appSource: appSourceFinal,
    canRead: canReadFinal,
    canWrite: canWriteFinal,
    expiresAt: expiresAtFinal,
    rateLimitPerMinute: rateLimitFinal,
  };
}

function parseBearerToken(raw) {
  if (!raw || typeof raw !== "string") {
    return null;
  }
  const trimmed = raw.trim();
  if (!trimmed.startsWith("memoria.")) {
    return null;
  }
  const parts = trimmed.split(".");
  if (parts.length !== 3) {
    return null;
  }
  const tokenId = parts[1];
  const secret = parts[2];
  if (!tokenId || !secret) {
    return null;
  }
  return { tokenId, secret };
}

export async function authenticateMemoriaBearerToken(
  request,
  { requireRead, requireWrite },
) {
  const authHeader = request.headers.get("authorization") || "";
  const tokenString = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  const parsed = parseBearerToken(tokenString);
  if (!parsed) {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }

  const [row] = await sql(
    "SELECT token_id, token_hash, label, scope, app_source, can_read, can_write, is_active, expires_at, rate_limit_per_minute FROM public.memoria_api_tokens WHERE token_id = $1 LIMIT 1",
    [parsed.tokenId],
  );

  if (!row || !row.is_active || row.scope !== "memoria") {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }

  if (row.expires_at) {
    const exp = new Date(row.expires_at);
    if (!Number.isNaN(exp.getTime())) {
      const now = Date.now();
      if (exp.getTime() <= now) {
        const err = new Error("Token expired");
        err.status = 401;
        throw err;
      }
    }
  }

  const ok = await argon2.verify(row.token_hash, parsed.secret);
  if (!ok) {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }

  if (requireRead && !row.can_read) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }

  if (requireWrite && !row.can_write) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }

  // ---- Enterprise rate limiting (per token, per minute) ----
  // Default: 120 requests/minute. (Per-token override via rate_limit_per_minute)
  const rlRaw = Number(row.rate_limit_per_minute);
  const rateLimit = Number.isFinite(rlRaw) ? rlRaw : 120;

  if (rateLimit > 0) {
    try {
      const [usage] = await sql(
        "INSERT INTO public.memoria_api_token_usage (token_id, window_start, request_count) VALUES ($1, date_trunc('minute', CURRENT_TIMESTAMP), 1) ON CONFLICT (token_id, window_start) DO UPDATE SET request_count = public.memoria_api_token_usage.request_count + 1 RETURNING request_count",
        [row.token_id],
      );

      const count = Number(usage?.request_count || 0);
      if (count > rateLimit) {
        const err = new Error("Too many requests");
        err.status = 429;
        throw err;
      }
    } catch (e) {
      // If the rate limiter fails, we don't want to accidentally open the API.
      // Prefer failing closed.
      if (e?.status) {
        throw e;
      }
      console.error("Rate limit check failed:", e);
      const err = new Error("Rate limiting error");
      err.status = 500;
      throw err;
    }
  }

  try {
    await sql(
      "UPDATE public.memoria_api_tokens SET last_used_at = CURRENT_TIMESTAMP WHERE token_id = $1",
      [row.token_id],
    );
  } catch (e) {
    console.error("Could not update last_used_at:", e);
  }

  return {
    tokenId: row.token_id,
    label: row.label,
    appSource: row.app_source,
    canRead: row.can_read,
    canWrite: row.can_write,
    rateLimitPerMinute: row.rate_limit_per_minute ?? 120,
  };
}
