import sql from "@/app/api/utils/sql";

export async function paymentAllocationTest(paymentId, invoiceId) {
  let failed = false;
  try {
    await sql`
      INSERT INTO payment_allocations (payment_id, invoice_id, amount)
      VALUES (${paymentId}, ${invoiceId}, 101.00);
    `;
  } catch {
    failed = true;
  }
  if (!failed) {
    throw new Error("Expected payment limit failure, but insert succeeded");
  }
  return "Trigger blocked allocation beyond payment amount";
}
