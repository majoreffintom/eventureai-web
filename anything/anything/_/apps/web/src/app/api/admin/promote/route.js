import sql from "@/app/api/utils/sql";
import requireAdmin from "@/app/api/utils/requireAdmin";

function normalizeEmail(email) {
  const trimmed = String(email || "").trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.toLowerCase();
}

export async function POST(request) {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) {
      return guard.response;
    }

    const body = await request.json().catch(() => ({}));
    const email = normalizeEmail(body?.email);
    const roleRaw = body?.role ? String(body.role) : "owner";

    const allowedRoles = new Set(["owner", "admin", "technician", "customer"]);
    const role = allowedRoles.has(roleRaw) ? roleRaw : "owner";

    // Only owners can grant owner.
    if (role === "owner" && guard.role !== "owner") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    // Normalize stored email to lowercase so future sign-ins are consistent.
    // (Auth currently looks up users by exact email match.)
    const rows = await sql(
      "UPDATE auth_users SET role = $1, email = LOWER($2) WHERE LOWER(email) = LOWER($2) RETURNING id, email, role",
      [role, email],
    );

    const user = rows?.[0] || null;

    if (!user) {
      return Response.json(
        {
          error:
            "No user found for that email. Create the account first, then promote it.",
        },
        { status: 404 },
      );
    }

    return Response.json({ user });
  } catch (error) {
    console.error("POST /api/admin/promote error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
