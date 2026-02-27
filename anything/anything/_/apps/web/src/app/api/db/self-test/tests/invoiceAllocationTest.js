import sql from "@/app/api/utils/sql";

export async function invoiceAllocationTest(paymentId, invoiceId) {
  // Invoice total is $106 with tax (100 + 6%).
  await sql`
    INSERT INTO payment_allocations (payment_id, invoice_id, amount)
    VALUES (${paymentId}, ${invoiceId}, 106.00);
  `;

  let failed = false;
  try {
    await sql`
      INSERT INTO payment_allocations (payment_id, invoice_id, amount)
      VALUES (${paymentId}, ${invoiceId}, 1.00);
    `;
  } catch {
    failed = true;
  }
  if (!failed) {
    throw new Error("Expected allocation failure, but insert succeeded");
  }

  const [inv] =
    await sql`SELECT payment_status FROM invoices WHERE id = ${invoiceId}`;
  if (inv.payment_status !== "paid") {
    throw new Error(
      `Expected invoice.payment_status to be 'paid', got '${inv.payment_status}'`,
    );
  }

  return "Trigger blocked over-allocation; invoice marked paid";
}
