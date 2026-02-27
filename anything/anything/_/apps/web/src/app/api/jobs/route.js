import sql from "@/app/api/utils/sql";

export async function GET() {
  const jobs = await sql`
    SELECT
      j.id,
      j.job_number,
      j.job_type,
      j.priority,
      j.status,
      j.description,
      j.created_at,
      c.name AS customer_name,
      c.phone AS customer_phone
    FROM jobs j
    JOIN customers c ON c.id = j.customer_id
    WHERE j.is_deleted = false
      AND c.is_deleted = false
    ORDER BY j.created_at DESC
    LIMIT 200;
  `;

  return Response.json({ jobs });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));

  const customerId = body?.customer_id;
  const jobType = body?.job_type;
  const priority = body?.priority;
  const description = body?.description ? String(body.description) : null;

  if (!customerId || !jobType || !priority) {
    return new Response("customer_id, job_type, and priority are required", {
      status: 400,
    });
  }

  // No auth enabled yet. We allow created_by_employee_id to be null.
  const [row] = await sql`
    INSERT INTO jobs (customer_id, job_type, priority, status, description, created_by_employee_id)
    VALUES (${customerId}, ${jobType}, ${priority}, 'scheduled', ${description}, NULL)
    RETURNING id;
  `;

  return Response.json({ job: row });
}
