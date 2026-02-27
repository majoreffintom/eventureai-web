// Memoria Universal Client (web)
// --------------------------------
// Safe default: use saveToMemoriaViaProxy() so you never put tokens in the browser.
//
// You *can* use the external bearer-token API from the browser, but it is not recommended.

import { createMemoriaClient } from "./memoriaClient";

export { createMemoriaClient };

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
    "memoriaUniversalClient.saveToMemoria(): This is unsafe in the browser if you pass a bearer token. Prefer saveToMemoriaViaProxy().",
  );

  const baseUrl = String(
    options.memoriaHubUrl || options.baseUrl || "",
  ).replace(/\/$/, "");
  const token = options.bearerToken || options.token;

  if (!baseUrl) {
    throw new Error(
      "saveToMemoria (web): baseUrl is required when using bearer-token mode",
    );
  }
  if (!token) {
    throw new Error(
      "saveToMemoria (web): bearerToken is required. Prefer saveToMemoriaViaProxy instead.",
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
    "memoriaUniversalClient.searchMemoria(): This is unsafe in the browser if you pass a bearer token. Prefer a server proxy route.",
  );

  const baseUrl = String(
    options.memoriaHubUrl || options.baseUrl || "",
  ).replace(/\/$/, "");
  const token = options.bearerToken || options.token;

  if (!baseUrl) {
    throw new Error(
      "searchMemoria (web): baseUrl is required when using bearer-token mode",
    );
  }
  if (!token) {
    throw new Error(
      "searchMemoria (web): bearerToken is required. Prefer a server proxy route instead.",
    );
  }

  const client = createMemoriaClient({ baseUrl, token });
  return client.search({ q: query, limit });
}
