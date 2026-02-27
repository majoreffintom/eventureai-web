import sql from "@/app/api/utils/sql";
import { createBaseRecords } from "../utils/createBaseRecords";
import { cleanup } from "../utils/cleanup";

export async function glInvoicePostingTest() {
  const rec = await createBaseRecords({ paymentAmount: 10.0 });
  try {
    const rows = await sql`
      SELECT id
      FROM journal_entries
      WHERE source_type = 'invoice'
        AND source_id = ${rec.invoiceId}
        AND posted = true
      ORDER BY created_at ASC
      LIMIT 1;
    `;

    if (rows.length !== 1) {
      throw new Error(
        "Expected a posted journal entry for invoice, but none found",
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
        `Invoice JE out of balance: debits=${debits}, credits=${credits}`,
      );
    }

    return `Invoice JE balanced (${debits})`;
  } finally {
    await cleanup(rec);
  }
}
