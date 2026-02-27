import sql from "@/app/api/utils/sql";

export async function orphanJobsTest() {
  let failed = false;
  try {
    await sql`
      INSERT INTO jobs (customer_id, job_type, priority, status)
      VALUES (
        ${"00000000-0000-0000-0000-000000000000"},
        'repair',
        'normal',
        'scheduled'
      );
    `;
  } catch {
    failed = true;
  }
  if (!failed) {
    throw new Error("Expected FK failure, but insert succeeded");
  }
  return "FK blocked insert";
}
