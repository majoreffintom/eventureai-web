import sql from "@/app/api/utils/sql";
import getJwt from "@/app/api/utils/getJwt";
import { auth } from "@/auth";

/**
 * Ensures the requester is signed in AND is an admin/owner.
 *
 * Usage:
 *   const guard = await requireAdmin(request);
 *
 * Returns:
 *  - { ok: true, email, role } when allowed
 *  - { ok: false, response } when not allowed (send `response` back)
 */
export default async function requireAdmin(request) {
  // Prefer the platform session helper first (more reliable on web)
  const session = await auth();
  const sessionEmailRaw = session?.user?.email ?? null;

  let email = sessionEmailRaw ? String(sessionEmailRaw).trim() : null;

  // Fallback to JWT cookie parsing
  if (!email) {
    const jwt = await getJwt(request);
    email = jwt?.email ? String(jwt.email).trim() : null;
  }

  if (!email) {
    return {
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const rows = await sql(
    "SELECT role FROM auth_users WHERE LOWER(email) = LOWER($1) LIMIT 1",
    [email],
  );
  const role = rows?.[0]?.role || "customer";
  const isAdmin = role === "admin" || role === "owner";

  if (!isAdmin) {
    return {
      ok: false,
      response: Response.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, email, role };
}
