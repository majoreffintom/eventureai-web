export function getErrorMessage(e) {
  if (!e) return "Something went wrong";
  if (typeof e === "string") return e;
  return e?.message || "Something went wrong";
}
