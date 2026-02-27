import sql from "@/app/api/utils/sql";
import { createMemoriaBearerToken } from "@/app/api/utils/memoriaTokens";
import { requireMemoriaAdmin } from "@/app/api/utils/memoriaAdmin";

function safeBool(v, fallback) {
  if (typeof v === "boolean") return v;
  return fallback;
}

function parseExpiresAt(v) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function parseRateLimit(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.max(1, Math.min(n, 10_000));
}

export async function GET(request) {
  try {
    await requireMemoriaAdmin(request);

    const url = new URL(request.url);
    const includeInactive = url.searchParams.get("includeInactive") === "true";

    const where = includeInactive ? "" : "WHERE is_active = true";

    const rows = await sql(
      `SELECT token_id, label, scope, app_source, can_read, can_write, is_active, expires_at, last_used_at, created_at, rate_limit_per_minute
       FROM public.memoria_api_tokens
       ${where}
       ORDER BY created_at DESC
       LIMIT 500`,
      [],
    );

    return Response.json({ ok: true, tokens: rows });
  } catch (e) {
    const status = e?.status || 500;
    return Response.json(
      { ok: false, error: e?.message || "Error" },
      { status },
    );
  }
}

export async function POST(request) {
  try {
    await requireMemoriaAdmin(request);

    const body = await request.json();

    const label = body?.label || "";
    const appSource = body?.appSource || body?.app_source || "unknown";

    const canRead = safeBool(body?.canRead ?? body?.can_read, true);
    const canWrite = safeBool(body?.canWrite ?? body?.can_write, true);

    const rateLimitPerMinute =
      parseRateLimit(body?.rateLimitPerMinute ?? body?.rate_limit_per_minute) ??
      120;

    const created = await createMemoriaBearerToken({
      label,
      appSource,
      canRead,
      canWrite,
      expiresAt: body?.expiresAt || body?.expires_at || null,
      rateLimitPerMinute,
    });

    // Return token ONCE.
    return Response.json({ ok: true, token: created });
  } catch (e) {
    console.error("/api/memoria/keys POST error:", e);
    const status = e?.status || 500;
    return Response.json(
      { ok: false, error: e?.message || "Error" },
      { status },
    );
  }
}

export async function PATCH(request) {
  try {
    await requireMemoriaAdmin(request);

    const body = await request.json();
    const tokenId = body?.tokenId || body?.token_id;

    if (!tokenId) {
      return Response.json(
        { ok: false, error: "tokenId is required" },
        { status: 400 },
      );
    }

    const setClauses = [];
    const values = [];
    let i = 1;

    if (typeof body?.label === "string") {
      setClauses.push(`label = $${i++}`);
      values.push(body.label.slice(0, 200));
    }

    if (
      typeof body?.appSource === "string" ||
      typeof body?.app_source === "string"
    ) {
      const v = String(body?.appSource || body?.app_source).slice(0, 200);
      setClauses.push(`app_source = $${i++}`);
      values.push(v);
    }

    if (
      typeof body?.canRead === "boolean" ||
      typeof body?.can_read === "boolean"
    ) {
      const v = safeBool(body?.canRead ?? body?.can_read, true);
      setClauses.push(`can_read = $${i++}`);
      values.push(v);
    }

    if (
      typeof body?.canWrite === "boolean" ||
      typeof body?.can_write === "boolean"
    ) {
      const v = safeBool(body?.canWrite ?? body?.can_write, true);
      setClauses.push(`can_write = $${i++}`);
      values.push(v);
    }

    if (
      typeof body?.isActive === "boolean" ||
      typeof body?.is_active === "boolean"
    ) {
      const v = safeBool(body?.isActive ?? body?.is_active, true);
      setClauses.push(`is_active = $${i++}`);
      values.push(v);
    }

    if ("expiresAt" in (body || {}) || "expires_at" in (body || {})) {
      const exp = parseExpiresAt(body?.expiresAt ?? body?.expires_at);
      setClauses.push(`expires_at = $${i++}`);
      values.push(exp);
    }

    if (
      "rateLimitPerMinute" in (body || {}) ||
      "rate_limit_per_minute" in (body || {})
    ) {
      const rl = parseRateLimit(
        body?.rateLimitPerMinute ?? body?.rate_limit_per_minute,
      );
      if (rl === null) {
        return Response.json(
          { ok: false, error: "rateLimitPerMinute must be a number" },
          { status: 400 },
        );
      }
      setClauses.push(`rate_limit_per_minute = $${i++}`);
      values.push(rl);
    }

    if (setClauses.length === 0) {
      return Response.json(
        { ok: false, error: "No fields to update" },
        { status: 400 },
      );
    }

    values.push(tokenId);

    const query = `UPDATE public.memoria_api_tokens
      SET ${setClauses.join(", ")}
      WHERE token_id = $${i}
      RETURNING token_id, label, scope, app_source, can_read, can_write, is_active, expires_at, last_used_at, created_at, rate_limit_per_minute`;

    const rows = await sql(query, values);
    const updated = rows?.[0] || null;

    return Response.json({ ok: true, token: updated });
  } catch (e) {
    console.error("/api/memoria/keys PATCH error:", e);
    const status = e?.status || 500;
    return Response.json(
      { ok: false, error: e?.message || "Error" },
      { status },
    );
  }
}
