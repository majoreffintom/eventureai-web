import sql from "@/app/api/utils/sql";

export async function uniqueJobAssignmentsTest(jobId, employeeId) {
  await sql`
    INSERT INTO job_assignments (job_id, employee_id, assignment_role)
    VALUES (${jobId}, ${employeeId}, 'lead');
  `;

  let failed = false;
  try {
    await sql`
      INSERT INTO job_assignments (job_id, employee_id, assignment_role)
      VALUES (${jobId}, ${employeeId}, 'assistant');
    `;
  } catch {
    failed = true;
  }
  if (!failed) {
    throw new Error(
      "Expected UNIQUE(job_id, employee_id) failure, but insert succeeded",
    );
  }
  return "Unique constraint blocked duplicate assignment";
}
