import sql from "@/app/api/utils/sql";
import { uniqueSuffix } from "./uniqueSuffix";

export async function createBaseRecords({ paymentAmount }) {
  const suffix = uniqueSuffix();

  const [customer] = await sql`
    INSERT INTO customers (name, phone, email, customer_source)
    VALUES (
      ${`SelfTest Customer ${suffix}`},
      ${`selftest-${suffix}`},
      ${`selftest-${suffix}@example.com`},
      'web_form'
    )
    RETURNING id;
  `;

  const [employee] = await sql`
    INSERT INTO employees (name, email, phone, role, pay_type, hourly_rate)
    VALUES (
      ${`SelfTest Tech ${suffix}`},
      ${`selftest-tech-${suffix}@example.com`},
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
      'DB self-test job',
      ${employee.id}
    )
    RETURNING id;
  `;

  // Create invoice as draft first, then flip to sent so GL posting trigger fires.
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
      ${paymentAmount},
      ${`pi_selftest_${suffix}`}
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
