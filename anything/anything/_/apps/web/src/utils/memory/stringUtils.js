export function slugify(value) {
  const raw = typeof value === "string" ? value : "";
  const lower = raw.trim().toLowerCase();
  const cleaned = lower.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return cleaned || "context";
}

export function makeContextName(title) {
  const base = slugify(title);
  const stamp = new Date().toISOString().replace(/[^0-9]+/g, "");
  return `${base}_${stamp}`;
}

export function parseTags(raw) {
  if (typeof raw !== "string") {
    return [];
  }
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function safeArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  return [];
}
