import sql from "@/app/api/utils/sql";
import { uniqueSuffix } from "../utils/uniqueSuffix";

export async function vendorRestrictTest(jobId, employeeId) {
  const suffix = uniqueSuffix();

  // Create a vendor.
  const [vendor] = await sql`
    INSERT INTO vendors (name, category, payment_terms)
    VALUES (${`SelfTest Vendor ${suffix}`}, 'supplier', 'net_30')
    RETURNING id;
  `;

  // Create a job expense referencing that vendor.
  const [jobExpense] = await sql`
    INSERT INTO job_expenses (job_id, vendor_id, employee_id, expense_type, amount, tax_amount, status)
    VALUES (${jobId}, ${vendor.id}, ${employeeId}, 'materials', 10.00, 0, 'pending')
    RETURNING id;
  `;

  let failed = false;
  try {
    await sql`DELETE FROM vendors WHERE id = ${vendor.id}`;
  } catch {
    failed = true;
  }

  // Cleanup our test artifacts before asserting.
  await sql`DELETE FROM job_expenses WHERE id = ${jobExpense.id}`;
  await sql`DELETE FROM vendors WHERE id = ${vendor.id}`;

  if (!failed) {
    throw new Error(
      "Expected RESTRICT failure when deleting vendor with job_expenses, but delete succeeded",
    );
  }

  return "RESTRICT blocked vendor delete";
}
