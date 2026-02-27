import sql from "@/app/api/utils/sql";

export async function expenseToGLTest() {
  const results = [];

  try {
    // Test 1: Create job expense
    const [job] = await sql`
      SELECT id FROM jobs WHERE is_deleted = false LIMIT 1
    `;

    const [vendor] = await sql`
      SELECT id FROM vendors WHERE is_active = true LIMIT 1
    `;

    if (!job || !vendor) {
      results.push({
        test: "Expense to GL workflow",
        passed: false,
        error: "Required job or vendor not found",
      });
      return results;
    }

    const [jobExpense] = await sql`
      INSERT INTO job_expenses (
        job_id,
        vendor_id,
        expense_type,
        amount,
        tax_amount,
        expense_date,
        description,
        status
      )
      VALUES (
        ${job.id},
        ${vendor.id},
        'materials',
        250.00,
        15.00,
        CURRENT_DATE,
        'HVAC parts for job',
        'pending'
      )
      RETURNING id, total_amount
    `;

    results.push({
      test: "Create job expense",
      passed: !!jobExpense.id && parseFloat(jobExpense.total_amount) === 265.0,
      details: `Created job expense, total: $${jobExpense.total_amount}`,
    });

    // Test 2: Approve job expense
    const [employee] = await sql`
      SELECT id FROM employees WHERE is_active = true LIMIT 1
    `;

    if (employee) {
      await sql`
        UPDATE job_expenses
        SET status = 'approved', 
            approved_by_employee_id = ${employee.id},
            approved_at = now()
        WHERE id = ${jobExpense.id}
      `;

      const [approved] = await sql`
        SELECT status, approved_at FROM job_expenses WHERE id = ${jobExpense.id}
      `;

      results.push({
        test: "Approve job expense",
        passed: approved.status === "approved" && approved.approved_at !== null,
        details: "Job expense approved",
      });
    }

    // Test 3: Create general expense
    const [expenseAccount] = await sql`
      SELECT id FROM chart_of_accounts 
      WHERE account_type = 'expense' AND is_active = true
      LIMIT 1
    `;

    if (!expenseAccount) {
      results.push({
        test: "Create general expense",
        passed: false,
        error: "No expense account found",
      });
    } else {
      const [generalExpense] = await sql`
        INSERT INTO general_expenses (
          vendor_id,
          account_id,
          expense_type,
          amount,
          tax_amount,
          expense_date,
          description,
          status
        )
        VALUES (
          ${vendor.id},
          ${expenseAccount.id},
          'other',
          100.00,
          6.00,
          CURRENT_DATE,
          'Office supplies',
          'pending'
        )
        RETURNING id, total_amount
      `;

      results.push({
        test: "Create general expense",
        passed:
          !!generalExpense.id &&
          parseFloat(generalExpense.total_amount) === 106.0,
        details: `Created general expense, total: $${generalExpense.total_amount}`,
      });

      // Test 4: Approve general expense
      if (employee) {
        await sql`
          UPDATE general_expenses
          SET status = 'approved',
              approved_by_employee_id = ${employee.id},
              approved_at = now()
          WHERE id = ${generalExpense.id}
        `;

        const [approved] = await sql`
          SELECT status FROM general_expenses WHERE id = ${generalExpense.id}
        `;

        results.push({
          test: "Approve general expense",
          passed: approved.status === "approved",
          details: "General expense approved",
        });
      }
    }

    // Test 5: Check for journal entries
    const [jobExpenseJE] = await sql`
      SELECT id FROM journal_entries
      WHERE source_type = 'job_expense' AND source_id = ${jobExpense.id}
    `;

    results.push({
      test: "Journal entry for job expense",
      passed: !!jobExpenseJE,
      details: jobExpenseJE
        ? "JE created"
        : "No JE found (trigger may not be implemented)",
    });
  } catch (err) {
    results.push({
      test: "Expense to GL workflow",
      passed: false,
      error: err.message,
    });
  }

  // Test 6: Reject negative expense amounts
  try {
    const [vendor] = await sql`SELECT id FROM vendors LIMIT 1`;
    const [account] =
      await sql`SELECT id FROM chart_of_accounts WHERE account_type = 'expense' LIMIT 1`;

    await sql`
      INSERT INTO general_expenses (vendor_id, account_id, amount)
      VALUES (${vendor.id}, ${account.id}, -50.00)
    `;

    results.push({
      test: "Reject negative expense amount",
      passed: false,
      details: "Should have rejected negative amount",
    });
  } catch (err) {
    results.push({
      test: "Reject negative expense amount",
      passed: true,
      details: "Correctly rejected negative amount",
    });
  }

  return results;
}
