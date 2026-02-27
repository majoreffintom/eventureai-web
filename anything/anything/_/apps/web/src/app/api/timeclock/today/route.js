import sql from "@/app/api/utils/sql";
import getJwt from "@/app/api/utils/getJwt";

const DEFAULT_TIMEZONE = "America/New_York";

async function getJwtEmail(request) {
  const jwt = await getJwt(request);
  const email = jwt?.email ? String(jwt.email).trim() : null;
  return email;
}

async function getEmployeeForEmail(email) {
  const rows = await sql(
    "SELECT id, name, role, is_active FROM employees WHERE LOWER(email) = LOWER($1) AND is_deleted = false LIMIT 1",
    [email],
  );
  return rows?.[0] || null;
}

function dayStartExpr(timezone) {
  // midnight in the provided timezone, returned as timestamptz
  return `date_trunc('day', now() AT TIME ZONE '${timezone}') AT TIME ZONE '${timezone}'`;
}

export async function GET(request) {
  try {
    const email = await getJwtEmail(request);
    if (!email) {
      return Response.json({ isAuthenticated: false }, { status: 401 });
    }

    const employee = await getEmployeeForEmail(email);
    if (!employee) {
      return Response.json(
        {
          error:
            "No employee record found for this login. Ask an admin to add you as an employee (matching email).",
        },
        { status: 403 },
      );
    }

    const tz = DEFAULT_TIMEZONE;
    const start = dayStartExpr(tz);

    const rows = await sql(
      `SELECT id, employee_id, clock_in, clock_out, status
         FROM timeclock_entries
        WHERE employee_id = $1
          AND is_deleted = false
          AND clock_in >= ${start}
          AND clock_in < (${start} + interval '1 day')
        ORDER BY clock_in DESC
        LIMIT 1`,
      [employee.id],
    );

    const entry = rows?.[0] || null;
    const isClockedIn = Boolean(entry && !entry.clock_out);

    return Response.json({
      isAuthenticated: true,
      employee: { id: employee.id, name: employee.name },
      timezone: tz,
      entry,
      isClockedIn,
    });
  } catch (error) {
    console.error("GET /api/timeclock/today error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
