import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { requireAdminKey } from "@/app/api/utils/memoriaTokens";

export async function getMemoriaAdminStatus() {
  const session = await auth();
  const email = session?.user?.email || null;

  if (!email) {
    return {
      isAuthenticated: false,
      isAdmin: false,
      user: null,
    };
  }

  const rows = await sql(
    "SELECT email FROM public.memoria_admins WHERE email = $1 LIMIT 1",
    [email],
  );

  return {
    isAuthenticated: true,
    isAdmin: rows.length > 0,
    user: session.user,
  };
}

/**
 * Enterprise admin gate for Memoria management.
 *
 * Allows either:
 *  - Signed-in user whose email exists in public.memoria_admins
 *  - Break-glass X-Admin-Key header matching configured admin keys
 */
export async function requireMemoriaAdmin(request) {
  const session = await auth();
  const email = session?.user?.email || null;

  if (email) {
    const rows = await sql(
      "SELECT email FROM public.memoria_admins WHERE email = $1 LIMIT 1",
      [email],
    );

    if (rows.length > 0) {
      return { session, email, by: "session" };
    }
  }

  // Break-glass fallback (keeps you from getting locked out)
  try {
    requireAdminKey(request);
    return { session: null, email: null, by: "adminKey" };
  } catch (e) {
    const err = new Error(email ? "Forbidden" : "Unauthorized");
    err.status = email ? 403 : 401;
    throw err;
  }
}
