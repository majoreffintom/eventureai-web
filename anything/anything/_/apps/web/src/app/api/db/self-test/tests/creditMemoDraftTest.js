import sql from "@/app/api/utils/sql";
import { uniqueSuffix } from "../utils/uniqueSuffix";

export async function creditMemoDraftTest(customerId, invoiceId) {
  const suffix = uniqueSuffix();

  const [cmDraft] = await sql`
    INSERT INTO credit_memos (customer_id, invoice_id, amount, reason_type, status, stripe_refund_id)
    VALUES (${customerId}, ${invoiceId}, 10.00, 'adjustment', 'draft', ${`re_${suffix}`})
    RETURNING id;
  `;

  let failed = false;
  try {
    await sql`
      INSERT INTO credit_memo_applications (credit_memo_id, invoice_id, amount)
      VALUES (${cmDraft.id}, ${invoiceId}, 1.00);
    `;
  } catch {
    failed = true;
  }

  // Cleanup
  await sql`DELETE FROM credit_memo_applications WHERE credit_memo_id = ${cmDraft.id}`.catch(
    () => {},
  );
  await sql`DELETE FROM credit_memos WHERE id = ${cmDraft.id}`.catch(() => {});

  if (!failed) {
    throw new Error(
      "Expected applying a draft credit memo to fail, but it succeeded",
    );
  }

  return "Draft credit memo application blocked";
}
