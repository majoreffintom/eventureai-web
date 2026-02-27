import sql from "@/app/api/utils/sql";

export async function chartOfAccountsTest() {
  const rows = await sql`
    SELECT count(*)::int AS count
    FROM chart_of_accounts
    WHERE account_number = '1000' AND is_deleted = false;
  `;
  const count = rows?.[0]?.count ?? 0;
  if (count < 1) {
    throw new Error(
      "Expected seeded chart_of_accounts row for account_number=1000, but none found",
    );
  }
  return `Found ${count} seeded cash account(s)`;
}
