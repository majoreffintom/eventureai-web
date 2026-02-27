import { getToken } from "@auth/core/jwt";
import sql from "@/app/api/utils/sql";

async function readTokenPair(request) {
  const secret = process.env.AUTH_SECRET;

  // Try secure cookie first, then non-secure (dev/local).
  const secure = await Promise.all([
    getToken({ req: request, secret, secureCookie: true, raw: true }),
    getToken({ req: request, secret, secureCookie: true }),
  ]);

  const secureJwt = secure[1];
  if (secureJwt) {
    return { raw: secure[0], jwt: secure[1] };
  }

  const insecure = await Promise.all([
    getToken({ req: request, secret, secureCookie: false, raw: true }),
    getToken({ req: request, secret, secureCookie: false }),
  ]);

  return { raw: insecure[0], jwt: insecure[1] };
}

export async function GET(request) {
  const { raw: token, jwt } = await readTokenPair(request);

  if (!jwt) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // Add role so mobile can route users after login (customers vs tech vs admin)
  let role = "customer";
  try {
    const email = jwt.email || null;
    if (email) {
      const rows = await sql(
        "SELECT role FROM auth_users WHERE LOWER(email) = LOWER($1) LIMIT 1",
        [email],
      );
      role = rows?.[0]?.role || "customer";
    }
  } catch (error) {
    console.error("GET /api/auth/token role lookup error", error);
  }

  return new Response(
    JSON.stringify({
      jwt: token,
      user: {
        id: jwt.sub,
        email: jwt.email,
        name: jwt.name,
        role,
      },
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}
