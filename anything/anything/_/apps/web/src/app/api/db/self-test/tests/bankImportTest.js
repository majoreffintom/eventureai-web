import sql from "@/app/api/utils/sql";
import { uniqueSuffix } from "../utils/uniqueSuffix";

export async function bankImportTest(paymentId) {
  const suffix = uniqueSuffix();

  const [cash] = await sql`
    SELECT id
    FROM chart_of_accounts
    WHERE account_number = '1000' AND is_deleted = false
    ORDER BY created_at ASC
    LIMIT 1;
  `;
  if (!cash?.id) {
    throw new Error("Missing seeded cash account for bank test");
  }

  const [bankAccount] = await sql`
    INSERT INTO bank_accounts (name, account_type, chart_account_id, last4)
    VALUES (${`SelfTest Bank ${suffix}`}, 'checking', ${cash.id}, '1234')
    RETURNING id;
  `;

  const [bankImport] = await sql`
    INSERT INTO bank_imports (bank_account_id, total_transactions)
    VALUES (${bankAccount.id}, 2)
    RETURNING id;
  `;

  const fitId = `fit_${suffix}`;

  const [tx1] = await sql`
    INSERT INTO bank_transactions (bank_account_id, bank_import_id, posted_date, amount, fit_id, imported)
    VALUES (${bankAccount.id}, ${bankImport.id}, CURRENT_DATE, 12.34, ${fitId}, true)
    RETURNING id;
  `;

  let failedDupe = false;
  try {
    await sql`
      INSERT INTO bank_transactions (bank_account_id, bank_import_id, posted_date, amount, fit_id, imported)
      VALUES (${bankAccount.id}, ${bankImport.id}, CURRENT_DATE, 12.34, ${fitId}, true);
    `;
  } catch {
    failedDupe = true;
  }

  if (!failedDupe) {
    throw new Error(
      "Expected duplicate fit_id to be blocked, but insert succeeded",
    );
  }

  // Soft delete the first transaction, then allow re-import of same fit_id
  await sql`
    UPDATE bank_transactions
    SET is_deleted = true, deleted_at = now()
    WHERE id = ${tx1.id};
  `;

  const [tx2] = await sql`
    INSERT INTO bank_transactions (bank_account_id, bank_import_id, posted_date, amount, fit_id, imported)
    VALUES (${bankAccount.id}, ${bankImport.id}, CURRENT_DATE, 12.34, ${fitId}, true)
    RETURNING id;
  `;

  // Unique link test: same payment cannot be linked twice
  const [deposit1] = await sql`
    INSERT INTO bank_transactions (bank_account_id, posted_date, amount, description)
    VALUES (${bankAccount.id}, CURRENT_DATE, 10.00, 'Deposit 1')
    RETURNING id;
  `;

  await sql`
    INSERT INTO bank_transaction_payment_links (bank_transaction_id, payment_id)
    VALUES (${deposit1.id}, ${paymentId});
  `;

  const [deposit2] = await sql`
    INSERT INTO bank_transactions (bank_account_id, posted_date, amount, description)
    VALUES (${bankAccount.id}, CURRENT_DATE, 10.00, 'Deposit 2')
    RETURNING id;
  `;

  let failedLink = false;
  try {
    await sql`
      INSERT INTO bank_transaction_payment_links (bank_transaction_id, payment_id)
      VALUES (${deposit2.id}, ${paymentId});
    `;
  } catch {
    failedLink = true;
  }

  // Cleanup bank test artifacts
  await sql`DELETE FROM bank_transaction_payment_links WHERE payment_id = ${paymentId}`.catch(
    () => {},
  );
  await sql`DELETE FROM bank_transactions WHERE id IN (${tx2.id}, ${deposit1.id}, ${deposit2.id})`.catch(
    () => {},
  );
  // tx1 is soft-deleted; delete it too
  await sql`DELETE FROM bank_transactions WHERE id = ${tx1.id}`.catch(() => {});
  await sql`DELETE FROM bank_imports WHERE id = ${bankImport.id}`.catch(
    () => {},
  );
  await sql`DELETE FROM bank_accounts WHERE id = ${bankAccount.id}`.catch(
    () => {},
  );

  if (!failedLink) {
    throw new Error(
      "Expected duplicate payment->bank link to be blocked, but insert succeeded",
    );
  }

  return "Unique fit_id and unique payment link enforced";
}
