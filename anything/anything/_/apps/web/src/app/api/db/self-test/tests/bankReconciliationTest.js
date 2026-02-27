import sql from "@/app/api/utils/sql";

export async function bankReconciliationTest() {
  const results = [];

  try {
    // Test 1: Get or create bank account
    let [bankAccount] = await sql`
      SELECT id FROM bank_accounts WHERE is_active = true LIMIT 1
    `;

    if (!bankAccount) {
      const [chartAccount] = await sql`
        SELECT id FROM chart_of_accounts WHERE account_number = '1000' LIMIT 1
      `;

      [bankAccount] = await sql`
        INSERT INTO bank_accounts (name, account_type, chart_account_id, opening_balance)
        VALUES ('Test Checking', 'checking', ${chartAccount.id}, 10000.00)
        RETURNING id
      `;
    }

    results.push({
      test: "Bank account available",
      passed: !!bankAccount.id,
      details: `Using bank account ${bankAccount.id}`,
    });

    // Test 2: Create bank reconciliation
    const [reconciliation] = await sql`
      INSERT INTO bank_reconciliations (
        bank_account_id,
        statement_date,
        statement_ending_balance,
        status
      )
      VALUES (
        ${bankAccount.id},
        CURRENT_DATE,
        15000.00,
        'in_progress'
      )
      RETURNING id, status
    `;

    results.push({
      test: "Create bank reconciliation",
      passed: !!reconciliation.id && reconciliation.status === "in_progress",
      details: `Created reconciliation ${reconciliation.id}`,
    });

    // Test 3: Add bank transactions
    const [tx1] = await sql`
      INSERT INTO bank_transactions (
        bank_account_id,
        posted_date,
        amount,
        description,
        counterparty
      )
      VALUES (
        ${bankAccount.id},
        CURRENT_DATE - INTERVAL '5 days',
        2500.00,
        'Customer payment',
        'ABC Company'
      )
      RETURNING id
    `;

    const [tx2] = await sql`
      INSERT INTO bank_transactions (
        bank_account_id,
        posted_date,
        amount,
        description,
        counterparty
      )
      VALUES (
        ${bankAccount.id},
        CURRENT_DATE - INTERVAL '3 days',
        -500.00,
        'Vendor payment',
        'XYZ Supplier'
      )
      RETURNING id
    `;

    results.push({
      test: "Create bank transactions",
      passed: !!tx1.id && !!tx2.id,
      details: "Created 2 bank transactions",
    });

    // Test 4: Add reconciliation items
    await sql`
      INSERT INTO bank_reconciliation_items (
        bank_reconciliation_id,
        bank_transaction_id,
        is_cleared
      )
      VALUES 
        (${reconciliation.id}, ${tx1.id}, true),
        (${reconciliation.id}, ${tx2.id}, false)
    `;

    const items = await sql`
      SELECT COUNT(*) as count
      FROM bank_reconciliation_items
      WHERE bank_reconciliation_id = ${reconciliation.id}
    `;

    results.push({
      test: "Add reconciliation items",
      passed: parseInt(items[0].count) === 2,
      details: `Added ${items[0].count} reconciliation items`,
    });

    // Test 5: Complete reconciliation
    const [employee] = await sql`
      SELECT id FROM employees WHERE is_active = true LIMIT 1
    `;

    if (employee) {
      await sql`
        UPDATE bank_reconciliations
        SET status = 'completed', 
            reconciled_at = now(),
            reconciled_by_employee_id = ${employee.id}
        WHERE id = ${reconciliation.id}
      `;

      const [completed] = await sql`
        SELECT status, reconciled_at
        FROM bank_reconciliations
        WHERE id = ${reconciliation.id}
      `;

      results.push({
        test: "Complete reconciliation",
        passed:
          completed.status === "completed" && completed.reconciled_at !== null,
        details: "Reconciliation completed successfully",
      });
    } else {
      results.push({
        test: "Complete reconciliation",
        passed: false,
        error: "No active employee found",
      });
    }
  } catch (err) {
    results.push({
      test: "Bank reconciliation workflow",
      passed: false,
      error: err.message,
    });
  }

  // Test 6: Verify cleared items constraint
  try {
    const [reconciliation] = await sql`
      SELECT id FROM bank_reconciliations WHERE status = 'in_progress' LIMIT 1
    `;

    if (!reconciliation) {
      const [bankAccount] = await sql`
        SELECT id FROM bank_accounts LIMIT 1
      `;

      const [newRec] = await sql`
        INSERT INTO bank_reconciliations (bank_account_id, statement_date, statement_ending_balance)
        VALUES (${bankAccount.id}, CURRENT_DATE, 10000.00)
        RETURNING id
      `;

      await sql`
        INSERT INTO bank_reconciliation_items (
          bank_reconciliation_id,
          is_cleared,
          cleared_at
        )
        VALUES (${newRec.id}, false, now())
      `;

      results.push({
        test: "Reject cleared_at without is_cleared",
        passed: false,
        details: "Should have rejected cleared_at when is_cleared is false",
      });
    }
  } catch (err) {
    results.push({
      test: "Reject cleared_at without is_cleared",
      passed: true,
      details: "Correctly enforced cleared constraint",
    });
  }

  return results;
}
