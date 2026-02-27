import sql from "@/app/api/utils/sql";
import { hash } from "argon2";

function isValidEmail(email) {
  if (typeof email !== "string") return false;
  const trimmed = email.trim();
  if (!trimmed) return false;
  // simple sanity check (we don't need perfect RFC validation here)
  return trimmed.includes("@") && trimmed.includes(".");
}

function normalizeRole(role) {
  const allowed = ["customer", "admin", "owner", "technician"];
  if (typeof role !== "string") return "owner";
  const value = role.trim().toLowerCase();
  return allowed.includes(value) ? value : "owner";
}

export async function POST(request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const role = normalizeRole(body?.role);

    if (!isValidEmail(email)) {
      return Response.json(
        { error: "Please provide a valid email" },
        { status: 400 },
      );
    }
    if (!password || password.length < 8) {
      return Response.json(
        { error: "Please provide a password with at least 8 characters" },
        { status: 400 },
      );
    }

    const existing = await sql(
      "SELECT COUNT(*)::int AS count FROM auth_users",
      [],
    );
    const count = existing?.[0]?.count ?? 0;

    if (count > 0) {
      return Response.json(
        {
          error:
            "Bootstrap is disabled because at least one user already exists. Create new users via /account/signup instead.",
        },
        { status: 409 },
      );
    }

    const passwordHash = await hash(password);

    const createdUserRows = await sql(
      "INSERT INTO auth_users (email, role) VALUES ($1, $2) RETURNING id, email, role",
      [email, role],
    );
    const user = createdUserRows?.[0];

    if (!user?.id) {
      return Response.json({ error: "Could not create user" }, { status: 500 });
    }

    await sql(
      `INSERT INTO auth_accounts (
        "userId",
        type,
        provider,
        "providerAccountId",
        password
      ) VALUES ($1, $2, $3, $4, $5)`,
      [user.id, "credentials", "credentials", String(user.id), passwordHash],
    );

    return Response.json({ ok: true, user });
  } catch (error) {
    console.error("POST /api/admin/bootstrap error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
