import sql from "@/app/api/utils/sql";

export async function openingBalancesFullTest() {
  const results = [];

  try {
    // Test 1: Create opening balance batch
    const [batch] = await sql`
      INSERT INTO opening_balance_batches (batch_date, description, status)
      VALUES (CURRENT_DATE, 'Initial opening balances', 'draft')
      RETURNING id, status
    `;

    results.push({
      test: "Create opening balance batch",
      passed: !!batch.id && batch.status === "draft",
      details: `Created batch ${batch.id}`,
    });

    // Test 2: Add opening balances
    const accounts = await sql`
      SELECT id, account_number, account_name, normal_balance
      FROM chart_of_accounts
      WHERE account_number IN ('1000', '1200', '2000', '3000')
      ORDER BY account_number
    `;

    if (accounts.length < 4) {
      results.push({
        test: "Add opening balances",
        passed: false,
        error: "Required accounts not found",
      });
    } else {
      // Cash (1000) - Asset - Debit $10,000
      // AR (1200) - Asset - Debit $5,000
      // AP (2000) - Liability - Credit $3,000
      // Equity (3000) - Equity - Credit $12,000

      await sql`
        INSERT INTO opening_balances (batch_id, account_id, debit, credit, memo)
        VALUES 
          (${batch.id}, ${accounts[0].id}, 10000.00, 0, 'Opening cash balance'),
          (${batch.id}, ${accounts[1].id}, 5000.00, 0, 'Opening AR balance'),
          (${batch.id}, ${accounts[2].id}, 0, 3000.00, 'Opening AP balance'),
          (${batch.id}, ${accounts[3].id}, 0, 12000.00, 'Opening equity balance')
      `;

      const balances = await sql`
        SELECT 
          SUM(debit) as total_debit,
          SUM(credit) as total_credit
        FROM opening_balances
        WHERE batch_id = ${batch.id}
      `;

      const isBalanced = balances[0].total_debit === balances[0].total_credit;

      results.push({
        test: "Add balanced opening balances",
        passed: isBalanced,
        details: `Debits: $${balances[0].total_debit}, Credits: $${balances[0].total_credit}`,
      });
    }

    // Test 3: Post opening balance batch
    const [employee] = await sql`
      SELECT id FROM employees WHERE is_active = true LIMIT 1
    `;

    if (employee) {
      await sql`
        UPDATE opening_balance_batches
        SET status = 'posted', posted_at = now(), posted_by_employee_id = ${employee.id}
        WHERE id = ${batch.id}
      `;

      const [posted] = await sql`
        SELECT status, posted_at, posted_by_employee_id
        FROM opening_balance_batches
        WHERE id = ${batch.id}
      `;

      results.push({
        test: "Post opening balance batch",
        passed: posted.status === "posted" && posted.posted_at !== null,
        details: "Batch posted successfully",
      });
    } else {
      results.push({
        test: "Post opening balance batch",
        passed: false,
        error: "No active employee found",
      });
    }

    // Test 4: Verify journal entry created
    const [je] = await sql`
      SELECT id, entry_type, posted
      FROM journal_entries
      WHERE source_type = 'opening_balance' AND source_id = ${batch.id}
    `;

    if (je) {
      results.push({
        test: "Journal entry created for opening balances",
        passed: je.entry_type === "opening_balance",
        details: `JE created with type ${je.entry_type}`,
      });
    } else {
      results.push({
        test: "Journal entry created for opening balances",
        passed: false,
        details: "No journal entry found (may need trigger)",
      });
    }
  } catch (err) {
    results.push({
      test: "Opening balances workflow",
      passed: false,
      error: err.message,
    });
  }

  // Test 5: Reject unbalanced opening balances
  try {
    const [batch] = await sql`
      INSERT INTO opening_balance_batches (batch_date, description)
      VALUES (CURRENT_DATE, 'Unbalanced test')
      RETURNING id
    `;

    const [account] = await sql`
      SELECT id FROM chart_of_accounts LIMIT 1
    `;

    await sql`
      INSERT INTO opening_balances (batch_id, account_id, debit, credit)
      VALUES (${batch.id}, ${account.id}, 1000.00, 500.00)
    `;

    results.push({
      test: "Reject both debit and credit in opening balance",
      passed: false,
      details:
        "Should have rejected opening balance with both debit and credit",
    });
  } catch (err) {
    results.push({
      test: "Reject both debit and credit in opening balance",
      passed: true,
      details: "Correctly rejected invalid opening balance",
    });
  }

  return results;
}
