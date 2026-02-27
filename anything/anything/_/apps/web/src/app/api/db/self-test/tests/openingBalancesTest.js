import sql from "@/app/api/utils/sql";

export async function openingBalancesTest() {
  const [cash] = await sql`
    SELECT id FROM chart_of_accounts
    WHERE account_number = '1000' AND is_deleted = false
    ORDER BY created_at ASC
    LIMIT 1;
  `;
  const [equity] = await sql`
    SELECT id FROM chart_of_accounts
    WHERE account_number = '3000' AND is_deleted = false
    ORDER BY created_at ASC
    LIMIT 1;
  `;

  if (!cash?.id || !equity?.id) {
    throw new Error("Missing seeded COA accounts required for test");
  }

  const [batch] = await sql`
    INSERT INTO opening_balance_batches (as_of_date, memo)
    VALUES (CURRENT_DATE, 'Self-test opening balances')
    RETURNING id;
  `;

  try {
    await sql`
      INSERT INTO opening_balance_lines (batch_id, account_id, debit)
      VALUES (${batch.id}, ${cash.id}, 100.00);
    `;

    let failed = false;
    try {
      await sql`
        UPDATE opening_balance_batches
        SET status = 'finalized'
        WHERE id = ${batch.id};
      `;
    } catch {
      failed = true;
    }
    if (!failed) {
      throw new Error(
        "Expected finalize to fail when debits/credits do not balance",
      );
    }

    await sql`
      INSERT INTO opening_balance_lines (batch_id, account_id, credit)
      VALUES (${batch.id}, ${equity.id}, 100.00);
    `;

    await sql`
      UPDATE opening_balance_batches
      SET status = 'finalized'
      WHERE id = ${batch.id};
    `;

    const [finalBatch] = await sql`
      SELECT status, journal_entry_id
      FROM opening_balance_batches
      WHERE id = ${batch.id};
    `;

    if (finalBatch?.status !== "finalized") {
      throw new Error(
        `Expected batch status 'finalized', got '${finalBatch?.status}'`,
      );
    }

    if (!finalBatch?.journal_entry_id) {
      throw new Error(
        "Expected opening balance finalize to create a journal entry, but journal_entry_id is null",
      );
    }

    const sums = await sql`
      SELECT
        round(COALESCE(SUM(debit), 0), 2) AS debits,
        round(COALESCE(SUM(credit), 0), 2) AS credits
      FROM journal_entry_lines
      WHERE journal_entry_id = ${finalBatch.journal_entry_id};
    `;

    const debits = Number(sums?.[0]?.debits ?? 0);
    const credits = Number(sums?.[0]?.credits ?? 0);
    if (debits !== credits) {
      throw new Error(
        `Opening balance JE out of balance: debits=${debits}, credits=${credits}`,
      );
    }

    // Cleanup: remove JE + batch
    await sql`
      DELETE FROM journal_entry_lines
      WHERE journal_entry_id = ${finalBatch.journal_entry_id};
    `;
    await sql`
      DELETE FROM journal_entries
      WHERE id = ${finalBatch.journal_entry_id};
    `;

    return "Finalize blocked until balanced, then posted balanced GL entry";
  } finally {
    // Cleanup (CASCADE removes lines)
    await sql`DELETE FROM opening_balance_batches WHERE id = ${batch.id}`.catch(
      () => {},
    );
  }
}
