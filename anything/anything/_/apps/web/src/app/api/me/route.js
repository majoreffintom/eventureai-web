import sql from "@/app/api/utils/sql";
import getJwt from "@/app/api/utils/getJwt";

// Returns basic info about the signed-in user, including role.
// This is intentionally NOT admin-gated.
export async function GET(request) {
  try {
    const noStoreHeaders = {
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": "application/json",
    };

    const jwt = await getJwt(request);

    const email = jwt?.email ? String(jwt.email).trim() : null;
    if (!email) {
      return new Response(
        JSON.stringify({ isAuthenticated: false, role: null, email: null }),
        { status: 401, headers: noStoreHeaders },
      );
    }

    const rows = await sql(
      "SELECT role FROM auth_users WHERE LOWER(email) = LOWER($1) LIMIT 1",
      [email],
    );
    const role = rows?.[0]?.role || "customer";

    return new Response(
      JSON.stringify({ isAuthenticated: true, role, email }),
      { status: 200, headers: noStoreHeaders },
    );
  } catch (error) {
    console.error("GET /api/me error", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
