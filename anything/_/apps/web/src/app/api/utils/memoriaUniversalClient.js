// Canonical Memoria Universal Client (server-safe)
// -------------------------------------------------
// This file is meant to be copy/paste-able across your apps.
// It supports two modes:
// 1) Bearer-token mode (Memoria External API): /api/memoria/external/*
// 2) Key mode (Anything internal memory API): /api/memory/*
//
// We intentionally DO NOT reference new env vars that may not exist in this repo.
// Instead, pass tokens/urls via options.

const DEFAULT_BASE_URL = process.env.APP_URL || "";

function pickServerMemoryKey() {
  return (
    process.env.ENTERPRISE_MEMORY_KEY ||
    process.env.BUSINESS_MEMORY_KEY ||
    process.env.APP_MEMORY_KEY ||
    process.env.MEMEORIA_EXPORT_KEY ||
    null
  );
}

function normalizeBaseUrl(baseUrl) {
  return String(baseUrl || "").replace(/\/$/, "");
}

function buildExternalId({ appSource, conversationId, externalId }) {
  if (externalId) return String(externalId);
  const source = String(appSource || "unknown");
  const convo = String(conversationId || "");
  return `${source}:${convo || Date.now()}`;
}

export function createMemoriaClient({ baseUrl, bearerToken, token }) {
  const base = normalizeBaseUrl(baseUrl || DEFAULT_BASE_URL);
  const authToken = bearerToken || token;

  return {
    async captureTurn(payload) {
      if (!authToken) {
        throw new Error(
          "createMemoriaClient.captureTurn requires bearerToken (Memoria external API)",
        );
      }

      const res = await fetch(`${base}/api/memoria/external/capture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `When calling /api/memoria/external/capture, the response was [${res.status}] ${text}`,
        );
      }

      return res.json();
    },

    async search({ q, limit = 50 }) {
      if (!authToken) {
        throw new Error(
          "createMemoriaClient.search requires bearerToken (Memoria external API)",
        );
      }

      const qs = new URLSearchParams();
      qs.set("q", String(q || "").trim());
      qs.set("limit", String(limit));

      const res = await fetch(
        `${base}/api/memoria/external/search?${qs.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `When calling /api/memoria/external/search, the response was [${res.status}] ${text}`,
        );
      }

      return res.json();
    },
  };
}

/**
 * Canonical call signature: saveToMemoria(conversationId, turn, options)
 *
 * - If options.bearerToken is provided: uses Memoria External API (bearer token)
 * - Otherwise: uses /api/memory/capture (key-based) on the target baseUrl
 */
export async function saveToMemoria(conversationId, turn, options = {}) {
  const baseUrl = normalizeBaseUrl(
    options.memoriaHubUrl || options.baseUrl || DEFAULT_BASE_URL,
  );
  if (!baseUrl) {
    throw new Error(
      "saveToMemoria: baseUrl is required (pass options.baseUrl or set APP_URL)",
    );
  }

  const appSource = options.appSource || "unknown";
  const index = options.index || options.indexKey || "Cross_App_Conversations";
  const title = options.title || turn?.title || "Conversation";
  const context = options.context || turn?.context || null;

  const externalId = buildExternalId({
    appSource,
    conversationId,
    externalId: options.externalId || turn?.externalId,
  });

  // ---- Mode 1: bearer token -> Memoria external API ----
  if (options.bearerToken || options.token) {
    const client = createMemoriaClient({
      baseUrl,
      bearerToken: options.bearerToken,
      token: options.token,
    });

    return client.captureTurn({
      externalId,
      title,
      context,
      index,
      turn,
    });
  }

  // ---- Mode 2: key-based internal memory API (Anything) ----
  const memoryKey = pickServerMemoryKey();

  const headers = {
    "Content-Type": "application/json",
    "X-App-Source": String(appSource || "unknown"),
  };

  if (memoryKey) {
    headers["X-API-Key"] = memoryKey;
  }

  const res = await fetch(`${baseUrl}/api/memory/capture`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      externalId,
      title,
      context,
      index,
      subindex: String(appSource || "unknown"),
      turn,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `When calling /api/memory/capture, the response was [${res.status}] ${text}`,
    );
  }

  return res.json();
}

export async function searchMemoria(query, limit = 50, options = {}) {
  // NOTE: For enterprise scoping + safety, searching is only supported via bearer tokens.
  // If you want UI search without tokens, expose a proxy route (like /api/memoria/proxy/search).
  const baseUrl = normalizeBaseUrl(
    options.memoriaHubUrl || options.baseUrl || DEFAULT_BASE_URL,
  );
  const bearerToken = options.bearerToken || options.token;

  if (!baseUrl) {
    throw new Error(
      "searchMemoria: baseUrl is required (pass options.baseUrl or set APP_URL)",
    );
  }

  if (!bearerToken) {
    throw new Error(
      "searchMemoria: bearerToken is required (use Memoria External API search)",
    );
  }

  const client = createMemoriaClient({ baseUrl, bearerToken });
  return client.search({ q: query, limit });
}
