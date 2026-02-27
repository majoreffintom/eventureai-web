import sql from "@/app/api/utils/sql";
import { requireMemoriaAdmin } from "@/app/api/utils/memoriaAdmin";

function normalizeEmail(value) {
  if (!value) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;
  return trimmed;
}

export async function GET(request) {
  try {
    await requireMemoriaAdmin(request);

    const rows = await sql(
      "SELECT email, created_at, created_by_email FROM public.memoria_admins ORDER BY created_at DESC",
      [],
    );

    return Response.json({ ok: true, admins: rows });
  } catch (e) {
    console.error("/api/memoria/admins GET error:", e);
    const status = e?.status || 500;
    return Response.json(
      { ok: false, error: e?.message || "Error" },
      { status },
    );
  }
}

export async function POST(request) {
  try {
    const gate = await requireMemoriaAdmin(request);

    const body = await request.json().catch(() => ({}));
    const email = normalizeEmail(body?.email);

    if (!email) {
      return Response.json(
        { ok: false, error: "Missing email" },
        { status: 400 },
      );
    }

    const createdByEmail = gate?.email || "adminKey";

    await sql(
      "INSERT INTO public.memoria_admins (email, created_by_email) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING",
      [email, createdByEmail],
    );

    return Response.json({ ok: true, email });
  } catch (e) {
    console.error("/api/memoria/admins POST error:", e);
    const status = e?.status || 500;
    return Response.json(
      { ok: false, error: e?.message || "Error" },
      { status },
    );
  }
}

export async function DELETE(request) {
  try {
    const gate = await requireMemoriaAdmin(request);

    const body = await request.json().catch(() => ({}));
    const email = normalizeEmail(body?.email);

    if (!email) {
      return Response.json(
        { ok: false, error: "Missing email" },
        { status: 400 },
      );
    }

    // Prevent locking the org out: do not allow deleting the last admin.
    const countRows = await sql(
      "SELECT COUNT(*)::int AS count FROM public.memoria_admins",
      [],
    );
    const adminCount = countRows?.[0]?.count || 0;

    if (adminCount <= 1) {
      return Response.json(
        {
          ok: false,
          error:
            "Cannot remove the last Memoria admin. Add another admin first.",
        },
        { status: 400 },
      );
    }

    // Optional: prevent self-removal via session (if they got in by session)
    const selfEmail = gate?.email;
    if (selfEmail && email === selfEmail) {
      return Response.json(
        {
          ok: false,
          error:
            "You cannot remove yourself via the UI. Add another admin and have them remove you (prevents lockouts).",
        },
        { status: 400 },
      );
    }

    await sql("DELETE FROM public.memoria_admins WHERE email = $1", [email]);

    return Response.json({ ok: true, email });
  } catch (e) {
    console.error("/api/memoria/admins DELETE error:", e);
    const status = e?.status || 500;
    return Response.json(
      { ok: false, error: e?.message || "Error" },
      { status },
    );
  }
}
