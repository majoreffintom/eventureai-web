import sql from "@/app/api/utils/sql";

export async function generalLedgerTest() {
  const results = [];

  // Test 1: Create journal entry
  try {
    const [je] = await sql`
      INSERT INTO journal_entries (entry_date, entry_type, description)
      VALUES (CURRENT_DATE, 'manual', 'Test journal entry')
      RETURNING id, entry_number, entry_type, posted
    `;

    results.push({
      test: "Create journal entry",
      passed: !!je.id && je.posted === false,
      details: `Created JE #${je.entry_number}`,
    });

    // Test 2: Add balanced journal entry lines
    const [arAccount] = await sql`
      SELECT id FROM chart_of_accounts WHERE account_number = '1200' LIMIT 1
    `;
    const [revenueAccount] = await sql`
      SELECT id FROM chart_of_accounts WHERE account_number = '4000' LIMIT 1
    `;

    if (!arAccount || !revenueAccount) {
      results.push({
        test: "Add journal entry lines",
        passed: false,
        error: "Required accounts not found",
      });
    } else {
      await sql`
        INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, memo)
        VALUES 
          (${je.id}, ${arAccount.id}, 1000.00, 0, 'Debit AR'),
          (${je.id}, ${revenueAccount.id}, 0, 1000.00, 'Credit Revenue')
      `;

      const lines = await sql`
        SELECT 
          SUM(debit) as total_debit,
          SUM(credit) as total_credit
        FROM journal_entry_lines
        WHERE journal_entry_id = ${je.id}
      `;

      results.push({
        test: "Add balanced journal entry lines",
        passed: lines[0].total_debit === lines[0].total_credit,
        details: `Debits: ${lines[0].total_debit}, Credits: ${lines[0].total_credit}`,
      });
    }

    // Test 3: Post journal entry
    await sql`
      UPDATE journal_entries
      SET posted = true, posted_at = now()
      WHERE id = ${je.id}
    `;

    const [posted] = await sql`
      SELECT posted, posted_at FROM journal_entries WHERE id = ${je.id}
    `;

    results.push({
      test: "Post journal entry",
      passed: posted.posted === true && posted.posted_at !== null,
      details: "Journal entry posted successfully",
    });
  } catch (err) {
    results.push({
      test: "General ledger operations",
      passed: false,
      error: err.message,
    });
  }

  // Test 4: Reject unbalanced entry lines
  try {
    const [je] = await sql`
      INSERT INTO journal_entries (entry_date, entry_type, description)
      VALUES (CURRENT_DATE, 'manual', 'Unbalanced test')
      RETURNING id
    `;

    const [account1] = await sql`
      SELECT id FROM chart_of_accounts LIMIT 1
    `;

    await sql`
      INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit)
      VALUES (${je.id}, ${account1.id}, 500.00, 500.00)
    `;

    results.push({
      test: "Reject both debit and credit",
      passed: false,
      details: "Should have rejected line with both debit and credit",
    });
  } catch (err) {
    results.push({
      test: "Reject both debit and credit",
      passed: true,
      details: "Correctly rejected invalid line",
    });
  }

  // Test 5: Reject negative amounts
  try {
    const [je] = await sql`
      INSERT INTO journal_entries (entry_date, entry_type, description)
      VALUES (CURRENT_DATE, 'manual', 'Negative test')
      RETURNING id
    `;

    const [account1] = await sql`
      SELECT id FROM chart_of_accounts LIMIT 1
    `;

    await sql`
      INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit)
      VALUES (${je.id}, ${account1.id}, -100.00, 0)
    `;

    results.push({
      test: "Reject negative amounts",
      passed: false,
      details: "Should have rejected negative debit",
    });
  } catch (err) {
    results.push({
      test: "Reject negative amounts",
      passed: true,
      details: "Correctly rejected negative amount",
    });
  }

  return results;
}
