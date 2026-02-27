import sql from "@/app/api/utils/sql";
import { uniqueSuffix } from "../utils/uniqueSuffix";

export async function creditMemoMultiInvoiceTest(
  customerId,
  invoiceId,
  employeeId,
) {
  const suffix = uniqueSuffix();

  const [cm] = await sql`
    INSERT INTO credit_memos (customer_id, invoice_id, amount, reason_type, status, stripe_refund_id)
    VALUES (${customerId}, ${invoiceId}, 50.00, 'adjustment', 'issued', ${`re_multi_${suffix}`})
    RETURNING id;
  `;

  // Apply 30 to invoice 1 (should succeed)
  await sql`
    INSERT INTO credit_memo_applications (credit_memo_id, invoice_id, amount)
    VALUES (${cm.id}, ${invoiceId}, 30.00);
  `;

  const [invAmounts] = await sql`
    SELECT balance_due, credit_applied
    FROM invoice_amounts
    WHERE invoice_id = ${invoiceId};
  `;

  if (Number(invAmounts?.credit_applied ?? 0) !== 30) {
    throw new Error(
      `Expected invoice_amounts.credit_applied=30, got '${invAmounts?.credit_applied}'`,
    );
  }

  // Create invoice 2 (draft -> add items -> sent) so GL posting works
  const [job2] = await sql`
    INSERT INTO jobs (customer_id, job_type, priority, status, description, created_by_employee_id)
    VALUES (${customerId}, 'repair', 'normal', 'scheduled', 'DB self-test job 2', ${employeeId})
    RETURNING id;
  `;

  const [invoice2] = await sql`
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
      ${customerId},
      ${job2.id},
      'draft',
      'unpaid',
      CURRENT_DATE,
      CURRENT_DATE,
      0.06,
      ${employeeId}
    )
    RETURNING id;
  `;

  await sql`
    INSERT INTO invoice_line_items (invoice_id, description, quantity, unit_price, is_taxable)
    VALUES (${invoice2.id}, 'Second diagnostic fee', 1, 100.00, true);
  `;

  await sql`
    UPDATE invoices
    SET workflow_status = 'sent', sent_at = now()
    WHERE id = ${invoice2.id};
  `;

  // Try to apply 25 more (should fail because only 20 remaining)
  let failed = false;
  try {
    await sql`
      INSERT INTO credit_memo_applications (credit_memo_id, invoice_id, amount)
      VALUES (${cm.id}, ${invoice2.id}, 25.00);
    `;
  } catch {
    failed = true;
  }

  const [cmAfter] = await sql`
    SELECT status
    FROM credit_memos
    WHERE id = ${cm.id};
  `;

  // Cleanup invoice2 GL artifacts first
  await sql`
    DELETE FROM journal_entry_lines
    WHERE journal_entry_id IN (
      SELECT id FROM journal_entries
      WHERE source_type = 'invoice' AND source_id = ${invoice2.id}
    );
  `.catch(() => {});
  await sql`
    DELETE FROM journal_entries
    WHERE source_type = 'invoice' AND source_id = ${invoice2.id};
  `.catch(() => {});

  // Cleanup invoice2 artifacts
  await sql`DELETE FROM credit_memo_applications WHERE invoice_id = ${invoice2.id}`.catch(
    () => {},
  );
  await sql`DELETE FROM invoice_line_items WHERE invoice_id = ${invoice2.id}`.catch(
    () => {},
  );
  await sql`DELETE FROM invoices WHERE id = ${invoice2.id}`.catch(() => {});
  await sql`DELETE FROM jobs WHERE id = ${job2.id}`.catch(() => {});

  // Cleanup credit memo artifacts
  await sql`DELETE FROM credit_memo_applications WHERE credit_memo_id = ${cm.id}`.catch(
    () => {},
  );
  await sql`DELETE FROM credit_memos WHERE id = ${cm.id}`.catch(() => {});

  if (!failed) {
    throw new Error(
      "Expected credit memo remaining constraint failure, but insert succeeded",
    );
  }
  if (cmAfter?.status !== "applied") {
    throw new Error(
      `Expected credit memo status to flip to 'applied', got '${cmAfter?.status}'`,
    );
  }

  return "Credit memo remaining enforced; invoice_amounts updated";
}
