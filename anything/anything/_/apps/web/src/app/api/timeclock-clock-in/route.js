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

async function getTimeclockColumnInfo() {
  const rows = await sql(
    `SELECT column_name, is_nullable, column_default
       FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'timeclock_entries'`,
  );

  const map = {};
  for (const r of rows || []) {
    map[r.column_name] = {
      isNullable: r.is_nullable === "YES",
      hasDefault: r.column_default !== null && r.column_default !== undefined,
    };
  }
  return map;
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
    if (openEntry) {
      return Response.json({
        ok: true,
        alreadyClockedIn: true,
        entry: openEntry,
      });
    }

    const cols = await getTimeclockColumnInfo();

    const insertColumns = ["employee_id", "clock_in"];
    const insertValues = [employee.id];
    const insertPlaceholders = ["$1", "now()"];

    // Add required columns if they exist and do not have defaults.
    if (
      cols.break_minutes &&
      !cols.break_minutes.hasDefault &&
      !cols.break_minutes.isNullable
    ) {
      insertColumns.push("break_minutes");
      insertValues.push(0);
      insertPlaceholders.push(`$${insertValues.length}`);
    }

    if (
      cols.entry_type &&
      !cols.entry_type.hasDefault &&
      !cols.entry_type.isNullable
    ) {
      insertColumns.push("entry_type");
      insertValues.push("shift");
      insertPlaceholders.push(`$${insertValues.length}`);
    }

    if (cols.status && !cols.status.hasDefault && !cols.status.isNullable) {
      insertColumns.push("status");
      insertValues.push("in_progress");
      insertPlaceholders.push(`$${insertValues.length}`);
    }

    const query = `INSERT INTO timeclock_entries (${insertColumns.join(", ")})
      VALUES (${insertPlaceholders.join(", ")})
      RETURNING id, employee_id, clock_in, clock_out, status`;

    const created = await sql(query, insertValues);

    return Response.json({ ok: true, entry: created?.[0] || null });
  } catch (error) {
    console.error("POST /api/timeclock-clock-in error", error);
    return Response.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
