export function safeNowIso() {
  try {
    return new Date().toISOString();
  } catch {
    return String(Date.now());
  }
}
