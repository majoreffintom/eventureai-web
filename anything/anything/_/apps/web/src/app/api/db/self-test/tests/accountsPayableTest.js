import sql from "@/app/api/utils/sql";
import { uniqueSuffix } from "../utils/uniqueSuffix";

export async function accountsPayableTest() {
  const suffix = uniqueSuffix();

  const [vendor] = await sql`
    INSERT INTO vendors (name, category, payment_terms)
    VALUES (${`SelfTest AP Vendor ${suffix}`}, 'supplier', 'net_30')
    RETURNING id;
  `;

  const [defaultExpense] = await sql`
    SELECT id
    FROM chart_of_accounts
    WHERE account_number = '7000' AND is_deleted = false
    ORDER BY created_at ASC
    LIMIT 1;
  `;

  if (!defaultExpense?.id) {
    throw new Error("Missing COA account 7000 required for AP test");
  }

  const [ap] = await sql`
    INSERT INTO accounts_payable (
      vendor_id,
      bill_number,
      bill_date,
      due_date,
      amount,
      account_id
    )
    VALUES (
      ${vendor.id},
      ${`BILL-${suffix}`},
      CURRENT_DATE,
      CURRENT_DATE,
      100.00,
      ${defaultExpense.id}
    )
    RETURNING id;
  `;

  const [p1] = await sql`
    INSERT INTO ap_payments (accounts_payable_id, amount, payment_method)
    VALUES (${ap.id}, 60.00, 'ach')
    RETURNING id;
  `;

  const [apAfter60] = await sql`
    SELECT payment_status
    FROM accounts_payable
    WHERE id = ${ap.id};
  `;

  if (apAfter60?.payment_status !== "partial") {
    throw new Error(
      `Expected accounts_payable.payment_status='partial' after $60 payment, got '${apAfter60?.payment_status}'`,
    );
  }

  let failed = false;
  try {
    await sql`
      INSERT INTO ap_payments (accounts_payable_id, amount, payment_method)
      VALUES (${ap.id}, 50.00, 'ach');
    `;
  } catch {
    failed = true;
  }
  if (!failed) {
    throw new Error(
      "Expected A/P overpayment to be blocked, but insert succeeded",
    );
  }

  const [p2] = await sql`
    INSERT INTO ap_payments (accounts_payable_id, amount, payment_method)
    VALUES (${ap.id}, 40.00, 'ach')
    RETURNING id;
  `;

  const [apAfter100] = await sql`
    SELECT payment_status
    FROM accounts_payable
    WHERE id = ${ap.id};
  `;
  if (apAfter100?.payment_status !== "paid") {
    throw new Error(
      `Expected accounts_payable.payment_status='paid' after fully paying bill, got '${apAfter100?.payment_status}'`,
    );
  }

  // Cleanup just for this test (including GL postings)
  await sql`
    DELETE FROM journal_entry_lines
    WHERE journal_entry_id IN (
      SELECT id FROM journal_entries
      WHERE (source_type = 'accounts_payable' AND source_id = ${ap.id})
         OR (source_type = 'ap_payment' AND source_id IN (${p1.id}, ${p2.id}))
    );
  `.catch(() => {});

  await sql`
    DELETE FROM journal_entries
    WHERE (source_type = 'accounts_payable' AND source_id = ${ap.id})
       OR (source_type = 'ap_payment' AND source_id IN (${p1.id}, ${p2.id}));
  `.catch(() => {});

  await sql`DELETE FROM ap_payments WHERE accounts_payable_id = ${ap.id}`;
  await sql`DELETE FROM accounts_payable WHERE id = ${ap.id}`;
  await sql`DELETE FROM vendors WHERE id = ${vendor.id}`;

  return "A/P triggers enforced limits and kept status in sync";
}
