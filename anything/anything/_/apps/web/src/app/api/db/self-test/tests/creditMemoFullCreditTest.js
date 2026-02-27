import sql from "@/app/api/utils/sql";
import { uniqueSuffix } from "../utils/uniqueSuffix";

export async function creditMemoFullCreditTest(customerId, invoiceId) {
  const suffix = uniqueSuffix();

  const [cm] = await sql`
    INSERT INTO credit_memos (customer_id, invoice_id, amount, reason_type, status, stripe_refund_id)
    VALUES (${customerId}, ${invoiceId}, 106.00, 'adjustment', 'issued', ${`re_full_${suffix}`})
    RETURNING id;
  `;

  await sql`
    INSERT INTO credit_memo_applications (credit_memo_id, invoice_id, amount)
    VALUES (${cm.id}, ${invoiceId}, 106.00);
  `;

  const [inv] = await sql`
    SELECT payment_status
    FROM invoices
    WHERE id = ${invoiceId};
  `;

  // Cleanup
  await sql`DELETE FROM credit_memo_applications WHERE credit_memo_id = ${cm.id}`.catch(
    () => {},
  );
  await sql`DELETE FROM credit_memos WHERE id = ${cm.id}`.catch(() => {});

  if (inv?.payment_status !== "paid") {
    throw new Error(
      `Expected invoice.payment_status='paid' after full credit, got '${inv?.payment_status}'`,
    );
  }

  return "Invoice marked paid via credits";
}
