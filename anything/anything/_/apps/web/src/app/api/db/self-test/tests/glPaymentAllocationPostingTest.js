import sql from "@/app/api/utils/sql";
import { createBaseRecords } from "../utils/createBaseRecords";
import { cleanup } from "../utils/cleanup";

export async function glPaymentAllocationPostingTest() {
  const rec = await createBaseRecords({ paymentAmount: 200.0 });
  try {
    // Allocate full amount (invoice total is $106 with tax)
    const [alloc] = await sql`
      INSERT INTO payment_allocations (payment_id, invoice_id, amount)
      VALUES (${rec.paymentId}, ${rec.invoiceId}, 106.00)
      RETURNING id;
    `;

    const rows = await sql`
      SELECT id
      FROM journal_entries
      WHERE source_type = 'payment_allocation'
        AND source_id = ${alloc.id}
        AND posted = true
      ORDER BY created_at ASC
      LIMIT 1;
    `;

    if (rows.length !== 1) {
      throw new Error(
        "Expected a posted journal entry for payment allocation, but none found",
      );
    }

    const jeId = rows[0].id;

    const sums = await sql`
      SELECT
        round(COALESCE(SUM(debit), 0), 2) AS debits,
        round(COALESCE(SUM(credit), 0), 2) AS credits
      FROM journal_entry_lines
      WHERE journal_entry_id = ${jeId};
    `;

    const debits = Number(sums?.[0]?.debits ?? 0);
    const credits = Number(sums?.[0]?.credits ?? 0);

    if (debits !== credits) {
      throw new Error(
        `Payment allocation JE out of balance: debits=${debits}, credits=${credits}`,
      );
    }

    return `Payment allocation JE balanced (${debits})`;
  } finally {
    await cleanup(rec);
  }
}
