import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { requireAdminKey } from "@/app/api/utils/memoriaTokens";

export async function POST(request) {
  try {
    // Requires a configured Admin Key (ENTERPRISE_MEMORY_KEY recommended)
    requireAdminKey(request);

    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
      return Response.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    await sql(
      "INSERT INTO public.memoria_admins (email, created_by_email) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING",
      [email, email],
    );

    return Response.json({ ok: true, email });
  } catch (e) {
    console.error("/api/memoria/admin/bootstrap error:", e);
    const status = e?.status || 500;
    return Response.json(
      { ok: false, error: e?.message || "Error" },
      { status },
    );
  }
}
