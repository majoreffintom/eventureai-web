import sql from "@/app/api/utils/sql";
import {
  buildLegacyContent,
  getNextTurnIndex,
  normalizeAppSource,
  normalizeIndexKeys,
  normalizeTurn,
  upsertIndexAndSubindex,
  upsertThread,
  upsertTurn,
} from "@/app/api/utils/memoriaStore";

export async function POST(request) {
  try {
    const headers = request.headers;
    const body = await request.json();

    const { externalId, title, context, index, subindex, messages, turn } =
      body || {};

    const appSource = normalizeAppSource(headers, body);

    const hasTurn = !!turn;
    const hasMessages = Array.isArray(messages) && messages.length > 0;

    if (!hasTurn && !hasMessages) {
      return Response.json(
        { error: "Either turn or messages is required" },
        { status: 400 },
      );
    }

    // If any server keys are configured, require a matching key header,
    // but allow same-origin calls without a key to reduce friction.
    const configuredKeys = [
      process.env.ENTERPRISE_MEMORY_KEY,
      process.env.BUSINESS_MEMORY_KEY,
      process.env.APP_MEMORY_KEY,
      process.env.MEMORIA_EXPORT_KEY,
      process.env.MEMEORIA_EXPORT_KEY, // support historical typo
    ].filter(Boolean);

    if (configuredKeys.length > 0) {
      const apiKeyHeader =
        headers.get("x-api-key") || headers.get("x-memory-key");

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

    const externalIdFinal =
      externalId || body?.external_id || `${appSource}:${Date.now()}`;

    const { indexKey, subindexKey } = normalizeIndexKeys(
      { ...body, index, subindex },
      appSource,
    );

    const { memoriaIndexId, memoriaSubindexId } = await upsertIndexAndSubindex({
      indexKey,
      subindexKey,
    });

    const threadId = await upsertThread({
      externalId: externalIdFinal,
      appSource,
      title,
      context,
      memoriaIndexId,
      memoriaSubindexId,
      metadata: body?.metadata || {},
    });

    const derivedTurnIndex = await getNextTurnIndex(threadId);
    const normalizedTurn = normalizeTurn({
      turn,
      messages,
      externalId: externalIdFinal,
      defaultTurnIndex: derivedTurnIndex,
    });

    const turnId = await upsertTurn({
      threadId,
      ...normalizedTurn,
    });

    // ---- Legacy memory_entries capture (kept for existing UI/search) ----
    let transcript = null;
    if (hasMessages) {
      transcript = messages
        .map(
          (m) =>
            `${m.role === "assistant" ? "Assistant" : "User"}${m.author ? `(${m.author})` : ""}: ${m.content}`,
        )
        .join("\n");
    } else {
      const u = normalizedTurn.userText
        ? `User: ${normalizedTurn.userText}`
        : "";
      const a = normalizedTurn.assistantResponse
        ? `Assistant: ${normalizedTurn.assistantResponse}`
        : "";
      transcript = [u, a].filter(Boolean).join("\n");
    }

    const session_context =
      context ||
      [indexKey, subindexKey].filter(Boolean).join(" > ") ||
      "Cross-app conversation capture";

    const content = buildLegacyContent({
      title,
      externalId: externalIdFinal,
      indexKey,
      subindexKey,
      transcript,
      turnIndex: normalizedTurn.turnIndex,
      userText: normalizedTurn.userText,
      assistantThinkingSummary: normalizedTurn.assistantThinkingSummary,
      assistantSynthesis: normalizedTurn.assistantSynthesis,
      codeSummary: normalizedTurn.codeSummary,
      assistantResponse: normalizedTurn.assistantResponse,
      includeFiveLayer: hasTurn,
    });

    const [entry] = await sql`
      INSERT INTO memory_entries (
        sub_index_cluster_id,
        content,
        reasoning_chain,
        user_intent_analysis,
        cross_domain_connections,
        session_context,
        usage_frequency
      ) VALUES (
        ${null},
        ${content},
        ${title || null},
        ${externalIdFinal || null},
        ${[indexKey, subindexKey].filter(Boolean)},
        ${session_context},
        ${1}
      )
      RETURNING id
    `;

    return Response.json({
      success: true,
      memory_id: entry.id,
      thread_id: threadId,
      turn_id: turnId,
      external_id: externalIdFinal,
      external_turn_id: normalizedTurn.externalTurnId,
      index: indexKey,
      subindex: subindexKey,
    });
  } catch (error) {
    console.error("/api/memory/capture error:", error);
    return Response.json(
      { error: "Failed to capture memory", details: error.message },
      { status: 500 },
    );
  }
}
