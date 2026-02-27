// Copy/paste friendly Memoria client for any app (Node.js / Next.js / server routes)
// Keep this file in sync across all apps to avoid "ad hoc memory" drift.

export function createMemoriaClient({ baseUrl, token }) {
  if (!baseUrl) {
    throw new Error("createMemoriaClient: baseUrl is required");
  }
  if (!token) {
    throw new Error("createMemoriaClient: token is required");
  }

  const normalizedBaseUrl = String(baseUrl).replace(/\/$/, "");

  async function requestJson(path, { method, body } = {}) {
    const url = `${normalizedBaseUrl}${path}`;

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    let payload = undefined;
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }

    const res = await fetch(url, {
      method: method || "GET",
      headers,
      body: payload,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Memoria request failed: [${res.status}] ${res.statusText} on ${path}${text ? ` — ${text}` : ""}`,
      );
    }

    return res.json();
  }

  return {
    /**
     * Capture a single turn into Memoria.
     * Server forces app_source from token; subindex is ignored if provided.
     */
    captureTurn: async ({ externalId, title, context, index, turn }) => {
      return requestJson("/api/memoria/external/capture", {
        method: "POST",
        body: {
          externalId,
          title,
          context,
          index,
          turn,
        },
      });
    },

    /**
     * Optional legacy transcript capture (messages array).
     */
    captureMessages: async ({
      externalId,
      title,
      context,
      index,
      messages,
    }) => {
      return requestJson("/api/memoria/external/capture", {
        method: "POST",
        body: {
          externalId,
          title,
          context,
          index,
          messages,
        },
      });
    },

    /**
     * Full-text search scoped to the token's app_source.
     */
    search: async ({ q, limit = 50 }) => {
      const params = new URLSearchParams();
      params.set("q", String(q || ""));
      params.set("limit", String(limit));

      return requestJson(`/api/memoria/external/search?${params.toString()}`);
    },
  };
}
