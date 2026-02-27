import { describe, it, expect, beforeAll, afterAll } from "vitest";
import sql from "@/app/api/utils/sql";

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

function uniqueSuffix() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

async function createBaseRecords() {
  const suffix = uniqueSuffix();

  const [customer] = await sql`
    INSERT INTO customers (name, phone, email, customer_source)
    VALUES (
      ${`Test Customer ${suffix}`},
      ${`test-${suffix}`},
      ${`test-${suffix}@example.com`},
      'web_form'
    )
    RETURNING id;
  `;

  const [employee] = await sql`
    INSERT INTO employees (name, email, phone, role, pay_type, hourly_rate)
    VALUES (
      ${`Test Tech ${suffix}`},
      ${`tech-${suffix}@example.com`},
      ${`555-${suffix}`.slice(0, 20)},
      'technician',
      'hourly',
      25.00
    )
    RETURNING id;
  `;

  const [job] = await sql`
    INSERT INTO jobs (customer_id, job_type, priority, status, description, created_by_employee_id)
    VALUES (
      ${customer.id},
      'repair',
      'normal',
      'scheduled',
      'DB constraint test job',
      ${employee.id}
    )
    RETURNING id;
  `;

  // Create invoice as draft then send it, so GL trigger behavior matches real usage.
  const [invoice] = await sql`
    INSERT INTO invoices (
      customer_id,
      job_id,
      workflow_status,
      payment_status,
      invoice_date,
      due_date,
      tax_rate,
      created_by_employee_id
    )
    VALUES (
      ${customer.id},
      ${job.id},
      'draft',
      'unpaid',
      CURRENT_DATE,
      CURRENT_DATE,
      0.06,
      ${employee.id}
    )
    RETURNING id;
  `;

  await sql`
    INSERT INTO invoice_line_items (
      invoice_id,
      description,
      quantity,
      unit_price,
      is_taxable
    )
    VALUES (
      ${invoice.id},
      'Diagnostic fee',
      1,
      100.00,
      true
    );
  `;

  await sql`
    UPDATE invoices
    SET workflow_status = 'sent', sent_at = now()
    WHERE id = ${invoice.id};
  `;

  const [payment] = await sql`
    INSERT INTO payments (
      customer_id,
      payment_method,
      status,
      amount,
      stripe_payment_intent_id
    )
    VALUES (
      ${customer.id},
      'stripe_card',
      'completed',
      100.00,
      ${`pi_${suffix}`}
    )
    RETURNING id;
  `;

  return {
    customerId: customer.id,
    employeeId: employee.id,
    jobId: job.id,
    invoiceId: invoice.id,
    paymentId: payment.id,
  };
}

async function cleanup({
  customerId,
  employeeId,
  jobId,
  invoiceId,
  paymentId,
}) {
  // --- GL cleanup first (needs ids before deletes) ---
  const allocationRows = await sql`
    SELECT id
    FROM payment_allocations
    WHERE payment_id = ${paymentId};
  `.catch(() => []);

  const allocationIds = (allocationRows || []).map((r) => r.id);

  if (allocationIds.length > 0) {
    await sql`
      DELETE FROM journal_entry_lines
      WHERE journal_entry_id IN (
        SELECT id FROM journal_entries
        WHERE source_type = 'payment_allocation'
          AND source_id = ANY(${allocationIds})
      );
    `.catch(() => {});

    await sql`
      DELETE FROM journal_entries
      WHERE source_type = 'payment_allocation'
        AND source_id = ANY(${allocationIds});
    `.catch(() => {});
  }

  await sql`
    DELETE FROM journal_entry_lines
    WHERE journal_entry_id IN (
      SELECT id FROM journal_entries
      WHERE source_type = 'invoice' AND source_id = ${invoiceId}
    );
  `.catch(() => {});

  await sql`
    DELETE FROM journal_entries
    WHERE source_type = 'invoice' AND source_id = ${invoiceId};
  `.catch(() => {});

  // Order matters due to FK restrictions.
  await sql`DELETE FROM bank_transaction_payment_links WHERE payment_id = ${paymentId}`.catch(
    () => {},
  );
  await sql`DELETE FROM payment_allocations WHERE payment_id = ${paymentId}`.catch(
    () => {},
  );
  await sql`DELETE FROM payments WHERE id = ${paymentId}`.catch(() => {});
  await sql`DELETE FROM invoice_line_items WHERE invoice_id = ${invoiceId}`.catch(
    () => {},
  );
  await sql`DELETE FROM invoices WHERE id = ${invoiceId}`.catch(() => {});
  await sql`DELETE FROM job_assignments WHERE job_id = ${jobId}`.catch(
    () => {},
  );
  await sql`DELETE FROM job_photos WHERE job_id = ${jobId}`.catch(() => {});
  await sql`DELETE FROM jobs WHERE id = ${jobId}`.catch(() => {});
  await sql`DELETE FROM employees WHERE id = ${employeeId}`.catch(() => {});
  await sql`DELETE FROM customers WHERE id = ${customerId}`.catch(() => {});
}

describe("database constraints", () => {
  if (!hasDatabaseUrl) {
    it.skip("skipping: DATABASE_URL is not available in the test runner environment", () => {
      // no-op
    });
    return;
  }

  const created = [];

  beforeAll(async () => {
    // sanity check database connectivity
    const rows = await sql`SELECT 1 AS ok`;
    expect(rows?.[0]?.ok).toBe(1);
  });

  afterAll(async () => {
    for (const rec of created.reverse()) {
      await cleanup(rec);
    }
  });

  it("prevents orphan jobs (job.customer_id must exist)", async () => {
    await expect(
      sql`
        INSERT INTO jobs (customer_id, job_type, priority, status)
        VALUES (
          ${"00000000-0000-0000-0000-000000000000"},
          'repair',
          'normal',
          'scheduled'
        );
      `,
    ).rejects.toThrow();
  });

  it("prevents deleting a customer that still has jobs (RESTRICT)", async () => {
    const rec = await createBaseRecords();
    created.push(rec);

    await expect(
      sql`DELETE FROM customers WHERE id = ${rec.customerId}`,
    ).rejects.toThrow();
  });

  it("supports soft delete (customer can be marked deleted without breaking child records)", async () => {
    const rec = await createBaseRecords();
    created.push(rec);

    await sql`
      UPDATE customers
      SET is_deleted = true, deleted_at = now()
      WHERE id = ${rec.customerId};
    `;

    const jobRows = await sql`SELECT id FROM jobs WHERE id = ${rec.jobId}`;
    expect(jobRows.length).toBe(1);
  });

  it("prevents allocating more than the invoice balance", async () => {
    const rec = await createBaseRecords();
    created.push(rec);

    // First allocate the full $100 (valid)
    await sql`
      INSERT INTO payment_allocations (payment_id, invoice_id, amount)
      VALUES (${rec.paymentId}, ${rec.invoiceId}, 100.00);
    `;

    // Second allocation should fail because invoice balance is now $0
    await expect(
      sql`
        INSERT INTO payment_allocations (payment_id, invoice_id, amount)
        VALUES (${rec.paymentId}, ${rec.invoiceId}, 1.00);
      `,
    ).rejects.toThrow();

    const [inv] =
      await sql`SELECT payment_status FROM invoices WHERE id = ${rec.invoiceId}`;
    expect(inv.payment_status).toBe("paid");
  });

  it("prevents allocating more than the payment amount", async () => {
    const rec = await createBaseRecords();
    created.push(rec);

    // Invoice total is $106 with tax (100 + 6%); payment is $100.
    // Allocation of $101 must fail due to payment remaining.
    await expect(
      sql`
        INSERT INTO payment_allocations (payment_id, invoice_id, amount)
        VALUES (${rec.paymentId}, ${rec.invoiceId}, 101.00);
      `,
    ).rejects.toThrow();
  });

  it("prevents duplicate job assignments for the same tech", async () => {
    const rec = await createBaseRecords();
    created.push(rec);

    await sql`
      INSERT INTO job_assignments (job_id, employee_id, assignment_role)
      VALUES (${rec.jobId}, ${rec.employeeId}, 'lead');
    `;

    await expect(
      sql`
        INSERT INTO job_assignments (job_id, employee_id, assignment_role)
        VALUES (${rec.jobId}, ${rec.employeeId}, 'assistant');
      `,
    ).rejects.toThrow();
  });

  it("prevents timeclock clock_out before clock_in", async () => {
    const rec = await createBaseRecords();
    created.push(rec);

    await expect(
      sql`
        INSERT INTO timeclock_entries (employee_id, job_id, clock_in, clock_out, break_minutes, status)
        VALUES (
          ${rec.employeeId},
          ${rec.jobId},
          now(),
          now() - interval '1 hour',
          0,
          'completed'
        );
      `,
    ).rejects.toThrow();
  });
});
