import sql from "@/app/api/utils/sql";

function getBearer(headers) {
  const auth = headers.get("authorization") || "";
  const parts = auth.split(" ");
  if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
    return parts[1];
  }
  return null;
}

export async function GET(request) {
  try {
    const headers = request.headers;
    const url = new URL(request.url);
    const since = url.searchParams.get("since");
    const limitParam = url.searchParams.get("limit");

    const limit = Math.max(1, Math.min(200, Number(limitParam || 50)));
    const sinceDate = since ? new Date(since) : null;

    // Auth: require an export key (or any server memory key), but allow same-origin calls
    const configuredKeys = [
      process.env.MEMORIA_EXPORT_KEY,
      process.env.MEMEORIA_EXPORT_KEY, // support historical typo
      process.env.ENTERPRISE_MEMORY_KEY,
      process.env.BUSINESS_MEMORY_KEY,
      process.env.APP_MEMORY_KEY,
    ].filter(Boolean);

    if (configuredKeys.length > 0) {
      const bearer = getBearer(headers);
      const apiKeyHeader =
        headers.get("x-api-key") || headers.get("x-memory-key") || bearer;

      let sameOrigin = false;
      try {
        const appUrl = process.env.APP_URL
          ? new URL(process.env.APP_URL)
          : null;
        const host = headers.get("host");
        if (appUrl && host && appUrl.host === host) {
          sameOrigin = true;
        }
      } catch {}

      if (!apiKeyHeader && !sameOrigin) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (apiKeyHeader && !configuredKeys.includes(apiKeyHeader)) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const threads = sinceDate
      ? await sql`
          SELECT 
            t.id,
            t.external_id,
            t.app_source,
            t.title,
            t.context,
            mi.key as index,
            ms.key as subindex,
            t.created_at,
            t.updated_at,
            t.last_turn_at,
            t.metadata
          FROM memoria_threads t
          LEFT JOIN memoria_indexes mi ON t.memoria_index_id = mi.id
          LEFT JOIN memoria_subindexes ms ON t.memoria_subindex_id = ms.id
          WHERE t.updated_at > ${sinceDate}
          ORDER BY t.updated_at ASC
          LIMIT ${limit}
        `
      : await sql`
          SELECT 
            t.id,
            t.external_id,
            t.app_source,
            t.title,
            t.context,
            mi.key as index,
            ms.key as subindex,
            t.created_at,
            t.updated_at,
            t.last_turn_at,
            t.metadata
          FROM memoria_threads t
          LEFT JOIN memoria_indexes mi ON t.memoria_index_id = mi.id
          LEFT JOIN memoria_subindexes ms ON t.memoria_subindex_id = ms.id
          ORDER BY t.updated_at DESC
          LIMIT ${limit}
        `;

    const threadIds = threads.map((t) => t.id);

    const turns =
      threadIds.length > 0
        ? await sql`
            SELECT 
              id,
              thread_id,
              external_turn_id,
              turn_index,
              user_text,
              assistant_thinking_summary,
              assistant_synthesis,
              code_summary,
              assistant_response,
              raw_messages,
              metadata,
              created_at
            FROM memoria_turns
            WHERE thread_id = ANY(${threadIds})
            ORDER BY thread_id ASC, turn_index ASC
          `
        : [];

    const turnsByThread = new Map();
    for (const trn of turns) {
      const arr = turnsByThread.get(trn.thread_id) || [];
      arr.push({
        externalTurnId: trn.external_turn_id,
        turnIndex: trn.turn_index,
        userText: trn.user_text,
        assistantThinkingSummary: trn.assistant_thinking_summary,
        assistantSynthesis: trn.assistant_synthesis,
        codeSummary: trn.code_summary,
        assistantResponse: trn.assistant_response,
        rawMessages: trn.raw_messages,
        metadata: trn.metadata,
        createdAt: trn.created_at,
      });
      turnsByThread.set(trn.thread_id, arr);
    }

    const conversations = threads.map((t) => ({
      externalId: t.external_id,
      appSource: t.app_source,
      title: t.title,
      context: t.context,
      index: t.index,
      subindex: t.subindex,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      lastTurnAt: t.last_turn_at,
      metadata: t.metadata,
      turns: turnsByThread.get(t.id) || [],
    }));

    const nextSince =
      conversations.length > 0
        ? conversations
            .map((c) => new Date(c.updatedAt).getTime())
            .reduce((a, b) => Math.max(a, b), 0)
        : null;

    return Response.json({
      success: true,
      version: "1.0",
      count: conversations.length,
      conversations,
      nextSince: nextSince ? new Date(nextSince).toISOString() : null,
    });
  } catch (error) {
    console.error("/api/memoria/export/conversations error:", error);
    return Response.json(
      { error: "Failed to export conversations", details: error.message },
      { status: 500 },
    );
  }
}
