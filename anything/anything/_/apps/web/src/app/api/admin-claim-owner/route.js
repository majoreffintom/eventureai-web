import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import getJwt from "@/app/api/utils/getJwt";

export async function POST(request) {
  try {
    const session = await auth();
    const emailFromSession = session?.user?.email ?? null;

    let emailRaw = emailFromSession;

    if (!emailRaw) {
      const jwt = await getJwt(request);
      emailRaw = jwt?.email ?? null;
    }

    if (!emailRaw) {
      return Response.json({ error: "Not signed in" }, { status: 401 });
    }

    const email = String(emailRaw).trim();

    const owners = await sql(
      "SELECT COUNT(*)::int AS count FROM auth_users WHERE role = 'owner'",
      [],
    );
    const ownerCount = owners?.[0]?.count ?? 0;

    if (ownerCount > 0) {
      return Response.json(
        {
          error:
            "An owner account already exists. Ask an existing owner/admin to change your role.",
        },
        { status: 409 },
      );
    }

    const updated = await sql(
      "UPDATE auth_users SET role = 'owner' WHERE LOWER(email) = LOWER($1) RETURNING id, email, role",
      [email],
    );

    const user = updated?.[0] ?? null;
    if (!user) {
      return Response.json(
        {
          error:
            "Could not find your user record. Make sure you've signed up with email/password first.",
        },
        { status: 404 },
      );
    }

    return Response.json({ ok: true, user });
  } catch (error) {
    console.error("POST /api/admin-claim-owner error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
