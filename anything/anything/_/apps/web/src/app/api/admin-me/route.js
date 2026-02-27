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

    let email = sessionEmail ? String(sessionEmail).trim().toLowerCase() : null;

    // Fallback: read JWT cookie (try both secure + insecure cookie variants).
    if (!userId && !email) {
      const jwt = await getJwt(request);

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
      // IMPORTANT: Response.json(body, init) is unreliable in production on Anything.
      // Use the standard Response constructor instead.
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
      rows = await sql(
        "SELECT role, email FROM auth_users WHERE LOWER(email) = LOWER($1) LIMIT 1",
        [email],
      );
    }

    // IMPORTANT: if the session exists but the user row does not,
    // treat this as unauthenticated. This prevents confusing loops
    // when auth tables are reset but old cookies remain.
    const found = rows?.[0] || null;
    if (!found) {
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

    const role = found.role || "customer";
    const resolvedEmail = found.email || email || null;
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
    console.error("GET /api/admin-me error", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
