import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import getJwt from "@/app/api/utils/getJwt";

export async function GET(request) {
  try {
    // Prefer the platform's session helper.
    const session = await auth();

    const sessionUserIdRaw = session?.user?.id ?? null;
    const sessionEmail = session?.user?.email ?? null;

    let userId = null;
    if (sessionUserIdRaw !== null && sessionUserIdRaw !== undefined) {
      const parsed = Number(sessionUserIdRaw);
      userId = Number.isFinite(parsed) ? parsed : null;
    }

    // Normalize email so role lookups work even if auth provider returns mixed-case.
    let email = sessionEmail ? String(sessionEmail).trim().toLowerCase() : null;

    // Fallback: read JWT cookie (try both secure + insecure cookie variants).
    if (!userId && !email) {
      const jwt = await getJwt(request);

      // Depending on environment, user id can be in different fields.
      const jwtUserIdRaw = jwt?.id ?? jwt?.sub ?? null;
      if (jwtUserIdRaw !== null && jwtUserIdRaw !== undefined) {
        const parsed = Number(jwtUserIdRaw);
        userId = Number.isFinite(parsed) ? parsed : null;
      }

      email = jwt?.email ? String(jwt.email).trim().toLowerCase() : null;
    }

    const noStoreHeaders = {
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": "application/json",
    };

    if (!userId && !email) {
      return new Response(
        JSON.stringify({
          isAuthenticated: false,
          isAdmin: false,
          role: null,
          email: null,
        }),
        { status: 401, headers: noStoreHeaders },
      );
    }

    let rows = [];
    if (userId) {
      rows = await sql(
        "SELECT role, email FROM auth_users WHERE id = $1 LIMIT 1",
        [userId],
      );
    } else {
      // Case-insensitive lookup, since emails are often stored normalized.
      rows = await sql(
        "SELECT role, email FROM auth_users WHERE LOWER(email) = LOWER($1) LIMIT 1",
        [email],
      );
    }

    // IMPORTANT: if the session exists but the user row does not,
    // treat this as unauthenticated. This prevents confusing loops
    // when auth tables are reset but old cookies remain.
    if (!rows || rows.length === 0) {
      return new Response(
        JSON.stringify({
          isAuthenticated: false,
          isAdmin: false,
          role: null,
          email: null,
        }),
        { status: 401, headers: noStoreHeaders },
      );
    }

    const role = rows?.[0]?.role || "customer";
    const resolvedEmail = rows?.[0]?.email || email || null;
    const isAdmin = role === "admin" || role === "owner";

    return new Response(
      JSON.stringify({
        isAuthenticated: true,
        isAdmin,
        role,
        email: resolvedEmail,
      }),
      { status: 200, headers: noStoreHeaders },
    );
  } catch (error) {
    console.error("GET /api/admin/me error", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
