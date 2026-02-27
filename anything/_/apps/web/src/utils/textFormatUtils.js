export function escapeRegExp(text) {
  return String(text || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function sniffTextFormat(rawText) {
  const t = String(rawText || "").trim();
  if (!t) return { kind: "text" };

  // JSON array/object
  if (t.startsWith("[") || t.startsWith("{")) {
    try {
      const parsed = JSON.parse(t);
      return { kind: "json", parsed };
    } catch {
      // fall through
    }
  }

  // NDJSON
  const lines = t
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length > 1 && lines[0].startsWith("{") && lines[0].endsWith("}")) {
    try {
      const items = lines.map((l) => JSON.parse(l));
      return { kind: "ndjson", parsed: items };
    } catch {
      // fall through
    }
  }

  return { kind: "text" };
}

export function normalizeBulkItems(parsed) {
  // Accept shapes:
  // - [{ title, externalId, text }]
  // - { items: [...] }
  // - { entries: [...] }
  // - NDJSON array
  if (!parsed) return [];

  const arr = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.items)
      ? parsed.items
      : Array.isArray(parsed.entries)
        ? parsed.entries
        : [];

  return arr
    .map((it) => {
      if (!it || typeof it !== "object") return null;

      const externalId =
        it.externalId || it.external_id || it.threadExternalId || it.thread_id;
      const title = it.title || it.name || null;

      // prefer explicit turn/messages
      const turn = it.turn || null;
      const messages = Array.isArray(it.messages) ? it.messages : null;

      const text =
        it.text || it.content || it.body || it.userText || it.user_text || null;

      const metadata =
        it.metadata && typeof it.metadata === "object" ? it.metadata : null;

      return {
        externalId: externalId ? String(externalId) : null,
        title: title ? String(title) : null,
        turn,
        messages,
        text: text ? String(text) : null,
        metadata,
      };
    })
    .filter(Boolean);
}

export async function fetchTextFromUrl(url) {
  const response = await fetch(url);
  if (!response.ok) {
    const txt = await response.text().catch(() => "");
    throw new Error(
      `Could not fetch uploaded file content. Response was [${response.status}] ${txt}`,
    );
  }

  // Note: this is best-effort; we currently support text/markdown/json/ndjson.
  return response.text();
}
