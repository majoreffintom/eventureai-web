import sql from "@/app/api/utils/sql";
import { uniqueSuffix } from "../utils/uniqueSuffix";

export async function jobExpenseSoftDeleteTest(jobId, employeeId) {
  const suffix = uniqueSuffix();

  const [vendor] = await sql`
    INSERT INTO vendors (name, category, payment_terms)
    VALUES (${`SelfTest Vendor SD ${suffix}`}, 'supplier', 'net_30')
    RETURNING id;
  `;

  const [jobExpense] = await sql`
    INSERT INTO job_expenses (job_id, vendor_id, employee_id, expense_type, amount, tax_amount, status)
    VALUES (${jobId}, ${vendor.id}, ${employeeId}, 'materials', 11.00, 0, 'pending')
    RETURNING id;
  `;

  let failed = false;
  try {
    // This should fail because deleted_at must be set when is_deleted=true.
    await sql`
      UPDATE job_expenses
      SET is_deleted = true
      WHERE id = ${jobExpense.id};
    `;
  } catch {
    failed = true;
  }

  // Cleanup
  await sql`DELETE FROM job_expenses WHERE id = ${jobExpense.id}`;
  await sql`DELETE FROM vendors WHERE id = ${vendor.id}`;

  if (!failed) {
    throw new Error(
      "Expected CHECK failure when setting is_deleted=true without deleted_at, but update succeeded",
    );
  }

  return "CHECK blocked invalid soft-delete update";
}
