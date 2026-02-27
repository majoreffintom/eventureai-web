import sql from "@/app/api/utils/sql";

export async function cleanup({
  customerId,
  employeeId,
  jobId,
  invoiceId,
  paymentId,
}) {
  // --- GL cleanup first (needs ids that may be deleted later) ---
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
      WHERE (source_type = 'invoice' AND source_id = ${invoiceId})
         OR (source_type = 'payment' AND source_id = ${paymentId})
         OR (source_type = 'opening_balance_batch')
    );
  `.catch(() => {});

  await sql`
    DELETE FROM journal_entries
    WHERE (source_type = 'invoice' AND source_id = ${invoiceId})
       OR (source_type = 'payment' AND source_id = ${paymentId});
  `.catch(() => {});

  // Order matters due to FK restrictions.
  await sql`DELETE FROM bank_transaction_payment_links WHERE payment_id = ${paymentId}`.catch(
    () => {},
  );
  await sql`DELETE FROM payment_allocations WHERE payment_id = ${paymentId}`.catch(
    () => {},
  );

  // --- credits cleanup (credits reference customers via RESTRICT) ---
  await sql`
    DELETE FROM credit_memo_applications
    WHERE invoice_id = ${invoiceId};
  `.catch(() => {});
  await sql`
    DELETE FROM credit_memo_applications
    WHERE credit_memo_id IN (SELECT id FROM credit_memos WHERE customer_id = ${customerId});
  `.catch(() => {});
  await sql`DELETE FROM credit_memos WHERE customer_id = ${customerId}`.catch(
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
