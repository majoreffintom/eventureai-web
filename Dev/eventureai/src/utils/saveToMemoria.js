// Drop-in: cross-app memory capture
// Call (transcript): await saveToMemoria("chat-123", [{ role: "user", content: "Hi" }, { role: "assistant", content: "Hello" }], { title: "Welcome flow" });
// Call (turn): await saveToMemoria("chat-123", [], { title: "Welcome flow", turn: { userText: "Hi", assistantResponse: "Hello", assistantSynthesis: "..." } });

const DEFAULT_BASE_URL = (() => {
  const hasProcess =
    typeof process !== "undefined" && typeof process.env !== "undefined";
  const envBase =
    (hasProcess && (process.env.EXPO_PUBLIC_BASE_URL || process.env.APP_URL)) ||
    null;
  if (envBase) {
    return envBase;
  }
  if (typeof window !== "undefined" && window?.location?.origin) {
    return window.location.origin;
  }
  return "";
})();

const APP_SOURCE = (() => {
  const hasProcess =
    typeof process !== "undefined" && typeof process.env !== "undefined";
  const fromEnv =
    (hasProcess &&
      (process.env.EXPO_PUBLIC_APP_SOURCE ||
        process.env.NEXT_PUBLIC_APP_SOURCE)) ||
    null;
  return fromEnv || "unknown";
})();

export default async function saveToMemoria(threadId, messages, opts = {}) {
  const externalId = opts.externalId || `${APP_SOURCE}:${threadId}`;
  const title = opts.title;
  const context = opts.context; // optional
  const index = opts.index; // optional
  const subindex = opts.subindex; // optional

  const baseUrl = opts.baseUrl || opts.memoriaBaseUrl || DEFAULT_BASE_URL;
  const url = `${baseUrl}/api/memory/capture`;

  const headers = {
    "Content-Type": "application/json",
    "X-App-Source": APP_SOURCE,
  };

  // Prefer server key if present; else use client key
  const hasProcess =
    typeof process !== "undefined" && typeof process.env !== "undefined";
  const serverKey =
    (hasProcess &&
      (process.env.ENTERPRISE_MEMORY_KEY ||
        process.env.BUSINESS_MEMORY_KEY ||
        process.env.APP_MEMORY_KEY)) ||
    null;
  const clientKey = hasProcess ? process.env.EXPO_PUBLIC_MEMORY_KEY : null;
  if (serverKey) {
    headers["X-API-Key"] = serverKey;
  } else if (clientKey) {
    headers["X-Memory-Key"] = clientKey;
  }

  const payload = {
    externalId,
    ...(title ? { title } : {}),
    ...(context ? { context } : {}),
    ...(index ? { index } : {}),
    ...(subindex ? { subindex } : {}),
  };

  // New universal format: allow sending a single structured turn (5-layer)
  if (opts.turn) {
    const rawTurnIndex =
      typeof opts.turn.turnIndex === "number"
        ? opts.turn.turnIndex
        : typeof opts.turn.turn_index === "number"
          ? opts.turn.turn_index
          : null;

    // If the caller provides a turnIndex, generate a stable externalTurnId by default.
    // If they don't, we keep a nonce so multiple retries don't collide.
    const stableExternalTurnId =
      rawTurnIndex === null ? null : `${externalId}:${String(rawTurnIndex)}`;

    payload.turn = {
      ...opts.turn,
      externalTurnId:
        opts.turn.externalTurnId ||
        opts.turn.external_turn_id ||
        stableExternalTurnId ||
        `${externalId}:auto:${Date.now()}`,
    };
  } else {
    payload.messages = (Array.isArray(messages) ? messages : []).map((m) => ({
      role: m.role, // "user" | "assistant"
      author: m.author || (m.role === "assistant" ? APP_SOURCE : "User"),
      content: m.content,
      ...(m.metadata ? { metadata: m.metadata } : {}),
    }));
  }

  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("saveToMemoria network error:", err);
    throw err;
  }

  if (!res.ok) {
    const text = await res.text();
    const err = new Error(
      `Memoria capture failed [${res.status}] ${res.statusText}: ${text}`,
    );
    console.error(err);
    throw err;
  }
  return res.json();
}

// Example call (copy/paste to test):
// await saveToMemoria("order-123", [
//   { role: "user", content: "Did the NFT mint after Stripe?" },
//   { role: "assistant", content: "Yes, tx confirmed." }
// ], { title: "NFT mint flow" });
