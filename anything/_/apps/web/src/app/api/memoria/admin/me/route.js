import { getMemoriaAdminStatus } from "@/app/api/utils/memoriaAdmin";

export async function GET() {
  try {
    const status = await getMemoriaAdminStatus();
    return Response.json({ ok: true, ...status });
  } catch (e) {
    console.error("/api/memoria/admin/me error:", e);
    return Response.json(
      { ok: false, error: e?.message || "Error" },
      { status: 500 },
    );
  }
}
