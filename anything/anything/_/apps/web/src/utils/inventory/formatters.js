export function formatMovementType(t) {
  if (t === "receive") return "Receive";
  if (t === "use") return "Use";
  if (t === "transfer") return "Transfer";
  return t || "";
}

export function formatRefType(t) {
  if (t === "order_received") return "Order received";
  if (t === "invoice") return "Invoice";
  if (t === "job") return "Job";
  if (t === "manual") return "Manual";
  return t || "";
}
