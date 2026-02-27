import sql from "@/app/api/utils/sql";
import getJwt from "@/app/api/utils/getJwt";

const DEFAULT_TIMEZONE = "America/New_York";

async function getJwtEmail(request) {
  const jwt = await getJwt(request);
  return jwt?.email ? String(jwt.email).trim() : null;
}

async function getEmployeeForEmail(email) {
  const rows = await sql(
    "SELECT id, name, role, is_active FROM employees WHERE LOWER(email) = LOWER($1) AND is_deleted = false LIMIT 1",
    [email],
  );
  return rows?.[0] || null;
}

function dayStartExpr(timezone) {
  return `date_trunc('day', now() AT TIME ZONE '${timezone}') AT TIME ZONE '${timezone}'`;
}

async function hasColumn(columnName) {
  const rows = await sql(
    `SELECT 1 AS ok
       FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'timeclock_entries'
        AND column_name = $1
      LIMIT 1`,
    [columnName],
  );
  return Boolean(rows?.[0]?.ok);
}

export async function POST(request) {
  try {
    const email = await getJwtEmail(request);
    if (!email) {
      return Response.json({ error: "Not signed in" }, { status: 401 });
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

    const openRows = await sql(
      `SELECT id, clock_in
         FROM timeclock_entries
        WHERE employee_id = $1
          AND is_deleted = false
          AND clock_in >= ${start}
          AND clock_in < (${start} + interval '1 day')
          AND clock_out IS NULL
        ORDER BY clock_in DESC
        LIMIT 1`,
      [employee.id],
    );

    const openEntry = openRows?.[0] || null;
    if (!openEntry) {
      return Response.json(
        { error: "No active shift found for today." },
        { status: 400 },
      );
    }

    const statusExists = await hasColumn("status");

    const values = [openEntry.id];
    const setParts = ["clock_out = now()"];

    if (statusExists) {
      setParts.push(`status = $${values.length + 1}`);
      values.push("completed");
    }

    const query = `UPDATE timeclock_entries
        SET ${setParts.join(", ")}
      WHERE id = $1
      RETURNING id, employee_id, clock_in, clock_out, status`;

    const updated = await sql(query, values);

    return Response.json({ ok: true, entry: updated?.[0] || null });
  } catch (error) {
    console.error("POST /api/timeclock-clock-out error", error);
    return Response.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
