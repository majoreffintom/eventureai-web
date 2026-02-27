import sql from "@/app/api/utils/sql";
import requireAdmin from "@/app/api/utils/requireAdmin.js";

export async function GET(request) {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) {
      return guard.response;
    }

    const rows = await sql(
      `SELECT t.id,
              t.employee_id,
              e.name AS employee_name,
              t.job_id,
              j.job_number,
              j.status AS job_status,
              t.clock_in,
              t.clock_out,
              t.entry_type,
              t.status,
              t.total_minutes,
              t.billable_minutes
         FROM timeclock_entries t
         JOIN employees e ON e.id = t.employee_id
         LEFT JOIN jobs j ON j.id = t.job_id
        WHERE t.is_deleted = false
        ORDER BY t.clock_in DESC
        LIMIT 25`,
    );

    return Response.json({ entries: rows || [] });
  } catch (error) {
    console.error("GET /api/admin/timeclock/recent error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
