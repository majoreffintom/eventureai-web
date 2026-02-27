import sql from "@/app/api/utils/sql";

export async function timeclockTest(employeeId, jobId) {
  let failed = false;
  try {
    await sql`
      INSERT INTO timeclock_entries (employee_id, job_id, clock_in, clock_out, break_minutes, status)
      VALUES (
        ${employeeId},
        ${jobId},
        now(),
        now() - interval '1 hour',
        0,
        'completed'
      );
    `;
  } catch {
    failed = true;
  }
  if (!failed) {
    throw new Error("Expected constraint failure, but insert succeeded");
  }
  return "CHECK blocked bad time entry";
}
