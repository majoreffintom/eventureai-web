import sql from "@/app/api/utils/sql";
import requireAdmin from "@/app/api/utils/requireAdmin.js";

const ALLOWED_ROLES = ["owner", "admin", "technician", "install", "apprentice"];

export async function GET(request) {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) {
      return guard.response;
    }

    const rows = await sql(
      `SELECT e.id,
              e.name,
              e.email,
              e.phone,
              e.role,
              e.pay_type,
              e.hourly_rate,
              e.salary_annual,
              e.is_active,
              e.created_at,
              e.updated_at,
              COALESCE(
                array_agg(er.role ORDER BY er.role) FILTER (WHERE er.role IS NOT NULL),
                '{}'::text[]
              ) AS roles
         FROM employees e
         LEFT JOIN employee_roles er ON er.employee_id = e.id
        WHERE e.is_deleted = false
        GROUP BY e.id
        ORDER BY e.created_at DESC
        LIMIT 250`,
    );

    return Response.json({ employees: rows || [] });
  } catch (error) {
    console.error("GET /api/admin/employees error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) {
      return guard.response;
    }

    const body = await request.json().catch(() => null);
    const {
      name,
      email,
      phone,
      role, // backwards compat (single)
      roles, // preferred (array)
      pay_type,
      hourly_rate,
      salary_annual,
      is_active,
    } = body || {};

    const safeName = typeof name === "string" ? name.trim() : "";
    if (!safeName) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    const rolesArr = Array.isArray(roles) ? roles : role ? [role] : [];
    const safeRoles = rolesArr
      .map((r) => (typeof r === "string" ? r.trim() : ""))
      .filter((r) => ALLOWED_ROLES.includes(r));

    const dedupedRoles = Array.from(new Set(safeRoles));
    const primaryRole = dedupedRoles[0] || "technician";

    const allowedPayTypes = ["hourly", "salary"];
    const safePayType = allowedPayTypes.includes(pay_type)
      ? pay_type
      : "hourly";

    const safeIsActive = typeof is_active === "boolean" ? is_active : true;

    let safeHourlyRate = null;
    let safeSalaryAnnual = null;

    if (safePayType === "hourly") {
      const asNum = Number(hourly_rate);
      safeHourlyRate = Number.isFinite(asNum) ? asNum : 0;
      safeSalaryAnnual = null;
    } else {
      const asNum = Number(salary_annual);
      safeSalaryAnnual = Number.isFinite(asNum) ? asNum : 0;
      safeHourlyRate = null;
    }

    const safeEmail =
      typeof email === "string" && email.trim() ? email.trim() : null;
    const safePhone =
      typeof phone === "string" && phone.trim() ? phone.trim() : null;

    const rolesToInsert = dedupedRoles.length ? dedupedRoles : [primaryRole];

    const query = `WITH new_emp AS (
        INSERT INTO employees (name, email, phone, role, pay_type, hourly_rate, salary_annual, is_active)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING id, name, email, phone, role, pay_type, hourly_rate, salary_annual, is_active, created_at, updated_at
      ),
      ins_roles AS (
        INSERT INTO employee_roles (employee_id, role)
        SELECT new_emp.id, r
        FROM new_emp, unnest($9::text[]) AS r
        ON CONFLICT (employee_id, role) DO NOTHING
        RETURNING role
      )
      SELECT new_emp.*,
             (SELECT COALESCE(array_agg(role ORDER BY role), '{}'::text[]) FROM employee_roles WHERE employee_id = new_emp.id) AS roles
      FROM new_emp;`;

    const rows = await sql(query, [
      safeName,
      safeEmail,
      safePhone,
      primaryRole,
      safePayType,
      safeHourlyRate,
      safeSalaryAnnual,
      safeIsActive,
      rolesToInsert,
    ]);

    return Response.json({ employee: rows?.[0] || null });
  } catch (error) {
    console.error("POST /api/admin/employees error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
