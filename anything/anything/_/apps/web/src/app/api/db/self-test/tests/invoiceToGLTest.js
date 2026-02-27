import sql from "@/app/api/utils/sql";

export async function invoiceToGLTest() {
  const results = [];

  try {
    // Test 1: Create complete invoice workflow
    const [customer] = await sql`
      SELECT id FROM customers WHERE is_deleted = false LIMIT 1
    `;

    const [job] = await sql`
      SELECT id FROM jobs WHERE customer_id = ${customer.id} LIMIT 1
    `;

    if (!customer || !job) {
      results.push({
        test: "Invoice to GL workflow",
        passed: false,
        error: "Required customer or job not found",
      });
      return results;
    }

    // Create invoice
    const [invoice] = await sql`
      INSERT INTO invoices (
        customer_id,
        job_id,
        invoice_date,
        workflow_status,
        tax_rate
      )
      VALUES (
        ${customer.id},
        ${job.id},
        CURRENT_DATE,
        'draft',
        0.06
      )
      RETURNING id, invoice_number
    `;

    results.push({
      test: "Create invoice",
      passed: !!invoice.id,
      details: `Created invoice #${invoice.invoice_number}`,
    });

    // Test 2: Add invoice line items
    const [serviceItem] = await sql`
      SELECT id, category FROM service_catalog WHERE is_active = true LIMIT 1
    `;

    if (serviceItem) {
      await sql`
        INSERT INTO invoice_line_items (
          invoice_id,
          service_catalog_item_id,
          description,
          quantity,
          unit_price,
          is_taxable
        )
        VALUES 
          (${invoice.id}, ${serviceItem.id}, 'HVAC Repair Service', 1, 500.00, true),
          (${invoice.id}, ${serviceItem.id}, 'Parts', 1, 150.00, true)
      `;

      const amounts = await sql`
        SELECT subtotal, tax_amount, total
        FROM invoice_amounts
        WHERE invoice_id = ${invoice.id}
      `;

      results.push({
        test: "Add invoice line items and calculate totals",
        passed: amounts[0].total > 0,
        details: `Subtotal: $${amounts[0].subtotal}, Tax: $${amounts[0].tax_amount}, Total: $${amounts[0].total}`,
      });
    }

    // Test 3: Send invoice (workflow status change)
    await sql`
      UPDATE invoices
      SET workflow_status = 'sent', sent_at = now()
      WHERE id = ${invoice.id}
    `;

    const [sent] = await sql`
      SELECT workflow_status, sent_at FROM invoices WHERE id = ${invoice.id}
    `;

    results.push({
      test: "Send invoice",
      passed: sent.workflow_status === "sent" && sent.sent_at !== null,
      details: "Invoice sent successfully",
    });

    // Test 4: Check if journal entry created
    const [je] = await sql`
      SELECT id, entry_type, posted
      FROM journal_entries
      WHERE source_type = 'invoice' AND source_id = ${invoice.id}
    `;

    if (je) {
      results.push({
        test: "Journal entry created for invoice",
        passed: je.entry_type === "invoice",
        details: `JE created with type ${je.entry_type}`,
      });

      // Test 5: Verify journal entry lines
      const lines = await sql`
        SELECT 
          COUNT(*) as line_count,
          SUM(debit) as total_debit,
          SUM(credit) as total_credit
        FROM journal_entry_lines
        WHERE journal_entry_id = ${je.id}
      `;

      const isBalanced = lines[0].total_debit === lines[0].total_credit;

      results.push({
        test: "Journal entry lines balanced",
        passed: isBalanced && parseInt(lines[0].line_count) >= 2,
        details: `${lines[0].line_count} lines, Debits: $${lines[0].total_debit}, Credits: $${lines[0].total_credit}`,
      });
    } else {
      results.push({
        test: "Journal entry created for invoice",
        passed: false,
        details: "No journal entry found (trigger may not be implemented yet)",
      });
    }
  } catch (err) {
    results.push({
      test: "Invoice to GL workflow",
      passed: false,
      error: err.message,
    });
  }

  return results;
}
