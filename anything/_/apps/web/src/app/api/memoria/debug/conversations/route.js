import sql from "@/app/api/utils/sql";
import { requireSession } from "@/app/api/tournament/utils";

const SEED_TAG = "memoria_seed_14_v1";

function safeJson(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export async function GET(request) {
  try {
    const { userId } = await requireSession();
    if (!userId) {
      return Response.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const url = new URL(request.url);
    const limitThreadsRaw = Number(url.searchParams.get("limit_threads") || 14);
    const limitTurnsRaw = Number(url.searchParams.get("limit_turns") || 10);

    const limitThreads = Number.isFinite(limitThreadsRaw)
      ? Math.max(1, Math.min(limitThreadsRaw, 50))
      : 14;

    const limitTurns = Number.isFinite(limitTurnsRaw)
      ? Math.max(1, Math.min(limitTurnsRaw, 50))
      : 10;

    const seedTag = url.searchParams.get("seed_tag") || SEED_TAG;

    const threads = await sql(
      `SELECT id, external_id, title, context, app_source, metadata, created_at, updated_at
       FROM public.memoria_threads
       WHERE metadata->>'seed_tag' = $1
         AND metadata->>'created_by_user_id' = $2
       ORDER BY created_at DESC
       LIMIT $3`,
      [seedTag, String(userId), limitThreads],
    );

    const threadIds = threads.map((t) => t.id);

    let turns = [];
    if (threadIds.length > 0) {
      turns = await sql(
        `SELECT thread_id, external_turn_id, turn_index, user_text, assistant_thinking_summary, assistant_synthesis, code_summary, assistant_response, created_at
         FROM public.memoria_turns
         WHERE thread_id = ANY($1::bigint[])
         ORDER BY thread_id ASC, turn_index ASC`,
        [threadIds],
      );
    }

    // Group turns by thread_id (with a per-thread limit)
    const byThread = new Map();
    for (const tr of turns) {
      const arr = byThread.get(tr.thread_id) || [];
      if (arr.length < limitTurns) {
        arr.push(tr);
        byThread.set(tr.thread_id, arr);
      }
    }

    const conversations = threads.map((th) => {
      const metadata = safeJson(th.metadata) || th.metadata || {};
      const threadTurns = byThread.get(th.id) || [];
      return {
        id: th.id,
        external_id: th.external_id,
        title: th.title,
        context: th.context,
        app_source: th.app_source,
        metadata,
        created_at: th.created_at,
        updated_at: th.updated_at,
        turns: threadTurns,
      };
    });

    const [{ legacy_count }] = await sql`
      SELECT COUNT(*)::int AS legacy_count
      FROM memory_entries
      WHERE session_context = ${"Memoria Debug Seed"}
        AND cross_domain_connections @> ${["seed"]}
    `;

    return Response.json({
      ok: true,
      seed_tag: seedTag,
      limit_threads: limitThreads,
      limit_turns: limitTurns,
      threads: conversations,
      legacy_memory_entries_count: Number(legacy_count || 0),
    });
  } catch (e) {
    console.error("/api/memoria/debug/conversations error:", e);
    return Response.json(
      { ok: false, error: e?.message || "Failed to read conversations" },
      { status: 500 },
    );
  }
}
