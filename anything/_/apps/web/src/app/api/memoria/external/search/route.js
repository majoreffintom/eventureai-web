import sql from "@/app/api/utils/sql";
import { authenticateMemoriaBearerToken } from "@/app/api/utils/memoriaTokens";

export async function GET(request) {
  try {
    const auth = await authenticateMemoriaBearerToken(request, {
      requireRead: true,
      requireWrite: false,
    });

    const url = new URL(request.url);
    const q = (url.searchParams.get("q") || "").trim();
    const limitRaw = Number(url.searchParams.get("limit") || 50);
    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(limitRaw, 200))
      : 50;

    if (!q) {
      return Response.json(
        { ok: false, error: "q is required" },
        { status: 400 },
      );
    }

    // Scope reads to the token's app_source. This ensures your brother can read/write Memoria
    // without gaining access to your other apps' captured data.
    const rows = await sql(
      `SELECT
        th.external_id,
        th.title,
        th.app_source,
        th.memoria_index_id,
        th.memoria_subindex_id,
        tr.turn_index,
        tr.user_text,
        tr.assistant_synthesis,
        tr.code_summary,
        tr.assistant_response,
        tr.created_at
      FROM public.memoria_turns tr
      JOIN public.memoria_threads th ON th.id = tr.thread_id
      WHERE th.app_source = $1
        AND to_tsvector('english',
          (COALESCE(tr.user_text,'') || ' ' ||
           COALESCE(tr.assistant_response,'') || ' ' ||
           COALESCE(tr.assistant_synthesis,'') || ' ' ||
           COALESCE(tr.code_summary,''))
        ) @@ plainto_tsquery('english', $2)
      ORDER BY tr.created_at DESC
      LIMIT $3`,
      [auth.appSource || "unknown", q, limit],
    );

    return Response.json({ ok: true, results: rows });
  } catch (e) {
    console.error("/api/memoria/external/search error:", e);
    const status = e?.status || 500;
    return Response.json(
      { ok: false, error: e?.message || "Error" },
      { status },
    );
  }
}
