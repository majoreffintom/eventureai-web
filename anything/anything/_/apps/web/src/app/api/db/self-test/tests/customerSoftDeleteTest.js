import sql from "@/app/api/utils/sql";

export async function customerSoftDeleteTest(customerId) {
  await sql`
    UPDATE customers
    SET is_deleted = true, deleted_at = now()
    WHERE id = ${customerId};
  `;
  const rows =
    await sql`SELECT is_deleted FROM customers WHERE id = ${customerId}`;
  if (rows.length !== 1 || rows[0].is_deleted !== true) {
    throw new Error("Soft delete update did not persist");
  }
  return "Customer soft-deleted";
}
