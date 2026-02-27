import sql from "@/app/api/utils/sql";
import { verify } from "argon2";

export async function POST(request) {
  try {
    if (process.env.NODE_ENV === "production") {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const email = body?.email ? String(body.email).trim() : null;
    const password = body?.password ? String(body.password) : null;

    if (!email || !password) {
      return Response.json(
        { error: "Missing email or password" },
        { status: 400 },
      );
    }

    const rows = await sql(
      `SELECT a.password
         FROM auth_users u
         JOIN auth_accounts a ON a."userId" = u.id
        WHERE LOWER(u.email) = LOWER($1)
          AND a.provider = 'credentials'
        ORDER BY a.id DESC
        LIMIT 1`,
      [email],
    );

    const hash = rows?.[0]?.password || null;
    if (!hash) {
      return Response.json({ ok: false, reason: "no_hash" }, { status: 200 });
    }

    const isValid = await verify(hash, password);

    return Response.json({ ok: true, isValid }, { status: 200 });
  } catch (error) {
    console.error("POST /api/debug/password-verify error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
