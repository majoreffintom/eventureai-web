import sql from "@/app/api/utils/sql";
import requireAdmin from "@/app/api/utils/requireAdmin.js";

const ALLOWED_ROLES = ["owner", "admin", "technician", "install", "apprentice"];

export async function PATCH(request, { params }) {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) {
      return guard.response;
    }

    const employeeId = params?.id;
    if (!employeeId) {
      return Response.json({ error: "Missing employee id" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const {
      name,
      email,
      phone,
      role, // backwards compat
      roles, // preferred
      pay_type,
      hourly_rate,
      salary_annual,
      is_active,
    } = body || {};

    const setClauses = [];
    const values = [];

    if (typeof name === "string") {
      const v = name.trim();
      if (v) {
        setClauses.push(`name = $${values.length + 1}`);
        values.push(v);
      }
    }

    if (typeof email === "string") {
      const v = email.trim();
      setClauses.push(`email = $${values.length + 1}`);
      values.push(v || null);
    }

    if (typeof phone === "string") {
      const v = phone.trim();
      setClauses.push(`phone = $${values.length + 1}`);
      values.push(v || null);
    }

    if (typeof is_active === "boolean") {
      setClauses.push(`is_active = $${values.length + 1}`);
      values.push(is_active);
    }

    // roles (multi)
    const rolesArr = Array.isArray(roles) ? roles : role ? [role] : null;
    const safeRoles = Array.isArray(rolesArr)
      ? Array.from(
          new Set(
            rolesArr
              .map((r) => (typeof r === "string" ? r.trim() : ""))
              .filter((r) => ALLOWED_ROLES.includes(r)),
          ),
        )
      : null;

    // Keep employees.role as a "primary" role for backwards compatibility.
    if (Array.isArray(safeRoles) && safeRoles.length) {
      setClauses.push(`role = $${values.length + 1}`);
      values.push(safeRoles[0]);
    }

    const allowedPayTypes = ["hourly", "salary"];
    let nextPayType = null;
    if (allowedPayTypes.includes(pay_type)) {
      nextPayType = pay_type;
      setClauses.push(`pay_type = $${values.length + 1}`);
      values.push(pay_type);
    }

    if (nextPayType === "hourly") {
      const hr = Number(hourly_rate);
      const safe = Number.isFinite(hr) ? hr : 0;
      setClauses.push(`hourly_rate = $${values.length + 1}`);
      values.push(safe);
      setClauses.push(`salary_annual = $${values.length + 1}`);
      values.push(null);
    } else if (nextPayType === "salary") {
      const sa = Number(salary_annual);
      const safe = Number.isFinite(sa) ? sa : 0;
      setClauses.push(`salary_annual = $${values.length + 1}`);
      values.push(safe);
      setClauses.push(`hourly_rate = $${values.length + 1}`);
      values.push(null);
    }

    const shouldUpdateEmployeeRow = setClauses.length > 0;
    if (shouldUpdateEmployeeRow) {
      setClauses.push(`updated_at = now()`);
    }

    const updateQuery = shouldUpdateEmployeeRow
      ? `UPDATE employees
           SET ${setClauses.join(", ")}
         WHERE id = $${values.length + 1}
           AND is_deleted = false
         RETURNING id`
      : null;

    const selectQuery = `SELECT e.id,
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
                          WHERE e.id = $1
                            AND e.is_deleted = false
                          GROUP BY e.id
                          LIMIT 1`;

    const txnResults = await sql.transaction((txn) => {
      const queries = [];

      if (updateQuery) {
        queries.push(txn(updateQuery, [...values, employeeId]));
      }

      if (Array.isArray(safeRoles)) {
        // Replace roles for this employee
        queries.push(
          txn("DELETE FROM employee_roles WHERE employee_id = $1", [
            employeeId,
          ]),
        );
        if (safeRoles.length) {
          queries.push(
            txn(
              `INSERT INTO employee_roles (employee_id, role)
               SELECT $1, r
               FROM unnest($2::text[]) AS r
               ON CONFLICT (employee_id, role) DO NOTHING`,
              [employeeId, safeRoles],
            ),
          );
        }
      }

      queries.push(txn(selectQuery, [employeeId]));
      return queries;
    });

    const selected = txnResults?.[txnResults.length - 1];
    const updated = selected?.[0] || null;

    if (!updated) {
      return Response.json({ error: "Employee not found" }, { status: 404 });
    }

    return Response.json({ employee: updated });
  } catch (error) {
    console.error("PATCH /api/admin/employees/[id] error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
