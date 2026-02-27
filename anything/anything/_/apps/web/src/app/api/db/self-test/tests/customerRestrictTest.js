import sql from "@/app/api/utils/sql";

export async function customerRestrictTest(customerId) {
  let failed = false;
  try {
    await sql`DELETE FROM customers WHERE id = ${customerId}`;
  } catch {
    failed = true;
  }
  if (!failed) {
    throw new Error("Expected RESTRICT failure, but delete succeeded");
  }
  return "RESTRICT blocked delete";
}
