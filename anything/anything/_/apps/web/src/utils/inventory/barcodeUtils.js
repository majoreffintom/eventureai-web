export function isUuidLike(value) {
  const v = typeof value === "string" ? value.trim() : "";
  if (!v) {
    return false;
  }
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v,
  );
}

export function parseScannedCodeToItemId(raw) {
  const text = typeof raw === "string" ? raw.trim() : "";
  if (!text) {
    return null;
  }

  if (isUuidLike(text)) {
    return text;
  }

  // Try URL format.
  try {
    const url = new URL(text);
    const fromQuery = url.searchParams.get("itemId");
    if (fromQuery && isUuidLike(fromQuery)) {
      return fromQuery;
    }

    const parts = url.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    if (last && isUuidLike(last)) {
      return last;
    }
  } catch (e) {
    // ignore
  }

  return null;
}
