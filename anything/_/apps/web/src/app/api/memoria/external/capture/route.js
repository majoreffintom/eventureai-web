import sql from "@/app/api/utils/sql";
import {
  buildLegacyContent,
  getNextTurnIndex,
  normalizeIndexKeys,
  normalizeTurn,
  upsertIndexAndSubindex,
  upsertThread,
  upsertTurn,
} from "@/app/api/utils/memoriaStore";
import { authenticateMemoriaBearerToken } from "@/app/api/utils/memoriaTokens";

export async function POST(request) {
  try {
    const auth = await authenticateMemoriaBearerToken(request, {
      requireRead: false,
      requireWrite: true,
    });

    const body = await request.json();

    const { externalId, title, context, index, messages, turn } = body || {};

    const hasTurn = !!turn;
    const hasMessages = Array.isArray(messages) && messages.length > 0;

    if (!hasTurn && !hasMessages) {
      return Response.json(
        { error: "Either turn or messages is required" },
        { status: 400 },
      );
    }

    // Force app_source based on token (prevents impersonation)
    const appSource = auth.appSource || "unknown";

    const externalIdFinal =
      externalId || body?.external_id || `${appSource}:${Date.now()}`;

    // Lock subindex to token appSource. (Index can be provided, but subindex cannot.)
    const { indexKey, subindexKey } = normalizeIndexKeys(
      { ...body, index, subindex: appSource },
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

    // Safety: if the caller didn't provide an externalTurnId, normalizeTurn will generate one.
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
      "External API capture";

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
      ok: true,
      memory_id: entry.id,
      thread_id: threadId,
      turn_id: turnId,
      external_id: externalIdFinal,
      external_turn_id: normalizedTurn.externalTurnId,
      index: indexKey,
      subindex: subindexKey,
    });
  } catch (e) {
    console.error("/api/memoria/external/capture error:", e);
    const status = e?.status || 500;
    return Response.json(
      { ok: false, error: e?.message || "Failed to capture" },
      { status },
    );
  }
}
