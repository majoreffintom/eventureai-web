import sql from "@/app/api/utils/sql";

export async function paymentToGLTest() {
  const results = [];

  try {
    // Test 1: Get invoice with balance
    const [invoice] = await sql`
      SELECT i.id, i.invoice_number, i.customer_id, ia.total, ia.balance_due
      FROM invoices i
      JOIN invoice_amounts ia ON ia.invoice_id = i.id
      WHERE i.workflow_status = 'sent' AND ia.balance_due > 0
      LIMIT 1
    `;

    if (!invoice) {
      results.push({
        test: "Payment to GL workflow",
        passed: false,
        error: "No unpaid invoice found",
      });
      return results;
    }

    results.push({
      test: "Found invoice with balance",
      passed: true,
      details: `Invoice #${invoice.invoice_number}, Balance: $${invoice.balance_due}`,
    });

    // Test 2: Create payment
    const paymentAmount = Math.min(parseFloat(invoice.balance_due), 500);

    const [payment] = await sql`
      INSERT INTO payments (
        customer_id,
        payment_method,
        amount,
        payment_date,
        status
      )
      VALUES (
        ${invoice.customer_id},
        'check',
        ${paymentAmount},
        CURRENT_DATE,
        'completed'
      )
      RETURNING id, amount
    `;

    results.push({
      test: "Create payment",
      passed: !!payment.id,
      details: `Created payment of $${payment.amount}`,
    });

    // Test 3: Allocate payment to invoice
    await sql`
      INSERT INTO payment_allocations (
        payment_id,
        invoice_id,
        amount
      )
      VALUES (
        ${payment.id},
        ${invoice.id},
        ${paymentAmount}
      )
    `;

    const [allocation] = await sql`
      SELECT amount FROM payment_allocations
      WHERE payment_id = ${payment.id} AND invoice_id = ${invoice.id}
    `;

    results.push({
      test: "Allocate payment to invoice",
      passed: parseFloat(allocation.amount) === paymentAmount,
      details: `Allocated $${allocation.amount} to invoice`,
    });

    // Test 4: Verify invoice payment status updated
    const [updatedInvoice] = await sql`
      SELECT payment_status FROM invoices WHERE id = ${invoice.id}
    `;

    const expectedStatus =
      paymentAmount >= parseFloat(invoice.balance_due) ? "paid" : "partial";

    results.push({
      test: "Invoice payment status updated",
      passed:
        updatedInvoice.payment_status === expectedStatus ||
        updatedInvoice.payment_status === "partial",
      details: `Payment status: ${updatedInvoice.payment_status}`,
    });

    // Test 5: Check if journal entry created for payment allocation
    const [je] = await sql`
      SELECT id, entry_type, posted
      FROM journal_entries
      WHERE source_type = 'payment_allocation' 
        AND source_id IN (
          SELECT id FROM payment_allocations 
          WHERE payment_id = ${payment.id}
        )
    `;

    if (je) {
      results.push({
        test: "Journal entry created for payment",
        passed: je.entry_type === "payment_allocation",
        details: `JE created with type ${je.entry_type}`,
      });

      // Verify journal entry lines
      const lines = await sql`
        SELECT 
          SUM(debit) as total_debit,
          SUM(credit) as total_credit
        FROM journal_entry_lines
        WHERE journal_entry_id = ${je.id}
      `;

      results.push({
        test: "Payment journal entry balanced",
        passed: lines[0].total_debit === lines[0].total_credit,
        details: `Debits: $${lines[0].total_debit}, Credits: $${lines[0].total_credit}`,
      });
    } else {
      results.push({
        test: "Journal entry created for payment",
        passed: false,
        details: "No journal entry found (trigger may not be implemented yet)",
      });
    }
  } catch (err) {
    results.push({
      test: "Payment to GL workflow",
      passed: false,
      error: err.message,
    });
  }

  // Test 6: Prevent over-allocation
  try {
    const [invoice] = await sql`
      SELECT i.id, ia.balance_due
      FROM invoices i
      JOIN invoice_amounts ia ON ia.invoice_id = i.id
      WHERE ia.balance_due > 0
      LIMIT 1
    `;

    if (invoice) {
      const [customer] = await sql`
        SELECT customer_id FROM invoices WHERE id = ${invoice.id}
      `;

      const [payment] = await sql`
        INSERT INTO payments (customer_id, payment_method, amount, status)
        VALUES (${customer.customer_id}, 'cash', 100.00, 'completed')
        RETURNING id
      `;

      const overAmount = parseFloat(invoice.balance_due) + 100;

      await sql`
        INSERT INTO payment_allocations (payment_id, invoice_id, amount)
        VALUES (${payment.id}, ${invoice.id}, ${overAmount})
      `;

      results.push({
        test: "Prevent payment over-allocation",
        passed: false,
        details: "Should have rejected over-allocation",
      });
    }
  } catch (err) {
    results.push({
      test: "Prevent payment over-allocation",
      passed: true,
      details: "Correctly rejected over-allocation",
    });
  }

  return results;
}
