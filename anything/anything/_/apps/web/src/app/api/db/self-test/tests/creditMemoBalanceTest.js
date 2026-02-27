import sql from "@/app/api/utils/sql";
import { uniqueSuffix } from "../utils/uniqueSuffix";

export async function creditMemoBalanceTest(customerId, invoiceId) {
  const suffix = uniqueSuffix();

  const [cm] = await sql`
    INSERT INTO credit_memos (customer_id, invoice_id, amount, reason_type, status, stripe_refund_id)
    VALUES (${customerId}, ${invoiceId}, 500.00, 'adjustment', 'issued', ${`re_big_${suffix}`})
    RETURNING id;
  `;

  let failed = false;
  try {
    await sql`
      INSERT INTO credit_memo_applications (credit_memo_id, invoice_id, amount)
      VALUES (${cm.id}, ${invoiceId}, 500.00);
    `;
  } catch {
    failed = true;
  }

  // Cleanup
  await sql`DELETE FROM credit_memo_applications WHERE credit_memo_id = ${cm.id}`.catch(
    () => {},
  );
  await sql`DELETE FROM credit_memos WHERE id = ${cm.id}`.catch(() => {});

  if (!failed) {
    throw new Error(
      "Expected applying credit beyond invoice balance to fail, but it succeeded",
    );
  }

  return "Credit application limited by invoice balance";
}
