// Memoria Universal Client (mobile / Expo)
// ----------------------------------------
// Safe default: use saveToMemoriaViaProxy() so you never bundle tokens in the app.

// Copy/paste friendly client (same shape as the web version).
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

    let payload;
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
    captureTurn: async ({ externalId, title, context, index, turn }) => {
      return requestJson("/api/memoria/external/capture", {
        method: "POST",
        body: { externalId, title, context, index, turn },
      });
    },

    search: async ({ q, limit = 50 }) => {
      const params = new URLSearchParams();
      params.set("q", String(q || ""));
      params.set("limit", String(limit));

      return requestJson(`/api/memoria/external/search?${params.toString()}`);
    },
  };
}

export async function saveToMemoriaViaProxy(
  conversationId,
  turn,
  options = {},
) {
  const res = await fetch("/api/memoria/proxy/capture", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversationId,
      turn,
      options,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `When calling /api/memoria/proxy/capture, the response was [${res.status}] ${text}`,
    );
  }

  return res.json();
}

export async function saveToMemoria(conversationId, turn, options = {}) {
  console.warn(
    "memoriaUniversalClient.saveToMemoria(): Avoid passing bearer tokens in a mobile app. Prefer saveToMemoriaViaProxy().",
  );

  const baseUrl = String(
    options.memoriaHubUrl || options.baseUrl || "",
  ).replace(/\/$/, "");
  const token = options.bearerToken || options.token;

  if (!baseUrl) {
    throw new Error(
      "saveToMemoria (mobile): baseUrl is required when using bearer-token mode",
    );
  }
  if (!token) {
    throw new Error(
      "saveToMemoria (mobile): bearerToken is required. Prefer saveToMemoriaViaProxy instead.",
    );
  }

  const client = createMemoriaClient({ baseUrl, token });

  const appSource = options.appSource || "unknown";
  const externalId = options.externalId || `${appSource}:${conversationId}`;
  const index = options.index || "Cross_App_Conversations";

  return client.captureTurn({
    externalId,
    title: options.title || turn?.title || "Conversation",
    context: options.context || turn?.context || null,
    index,
    turn,
  });
}

export async function searchMemoria(query, limit = 50, options = {}) {
  console.warn(
    "memoriaUniversalClient.searchMemoria(): Avoid passing bearer tokens in a mobile app. Prefer a server proxy route.",
  );

  const baseUrl = String(
    options.memoriaHubUrl || options.baseUrl || "",
  ).replace(/\/$/, "");
  const token = options.bearerToken || options.token;

  if (!baseUrl) {
    throw new Error(
      "searchMemoria (mobile): baseUrl is required when using bearer-token mode",
    );
  }
  if (!token) {
    throw new Error(
      "searchMemoria (mobile): bearerToken is required. Prefer a server proxy route instead.",
    );
  }

  const client = createMemoriaClient({ baseUrl, token });
  return client.search({ q: query, limit });
}
