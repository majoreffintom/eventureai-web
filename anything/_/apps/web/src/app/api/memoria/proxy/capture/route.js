import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { saveToMemoria as saveToMemoriaHub } from "@/app/api/utils/memoriaUniversalClient";
import {
  DEFAULT_INDEX_KEY,
  normalizeIndexKeys,
  upsertIndexAndSubindex,
  upsertThread,
  getNextTurnIndex,
  normalizeTurn,
  upsertTurn,
  buildLegacyContent,
} from "@/app/api/utils/memoriaStore";

function safeString(v, fallback) {
  if (typeof v === "string" && v.trim()) {
    return v.trim();
  }
  return fallback;
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const conversationId = safeString(body?.conversationId, null);
    const turn = body?.turn || null;
    const options = body?.options || {};

    if (!conversationId) {
      return Response.json(
        { ok: false, error: "conversationId is required" },
        { status: 400 },
      );
    }

    if (!turn || typeof turn !== "object") {
      return Response.json(
        { ok: false, error: "turn is required" },
        { status: 400 },
      );
    }

    const appSource = safeString(options?.appSource, "web");

    const externalId = safeString(
      options?.externalId || turn?.externalId,
      `${appSource}:${conversationId}`,
    );

    const title = safeString(options?.title || turn?.title, "Conversation");
    const context = safeString(options?.context || turn?.context, null);

    const index = safeString(
      options?.index || options?.indexKey,
      DEFAULT_INDEX_KEY,
    );

    const { indexKey, subindexKey } = normalizeIndexKeys(
      { index, subindex: appSource },
      appSource,
    );

    const { memoriaIndexId, memoriaSubindexId } = await upsertIndexAndSubindex({
      indexKey,
      subindexKey,
    });

    const threadId = await upsertThread({
      externalId,
      appSource,
      title,
      context,
      memoriaIndexId,
      memoriaSubindexId,
      metadata: options?.metadata || {},
    });

    const derivedTurnIndex = await getNextTurnIndex(threadId);

    const normalized = normalizeTurn({
      turn,
      messages: null,
      externalId,
      defaultTurnIndex: derivedTurnIndex,
    });

    const mergedMetadata = {
      ...(normalized?.metadata || {}),
      ...(turn?.metadata || {}),
      userId: session.user.id,
      capturedFrom: "memoria-proxy",
    };

    const mergedTurn = {
      ...(turn || {}),
      metadata: mergedMetadata,
    };

    const turnId = await upsertTurn({
      threadId,
      externalTurnId: normalized.externalTurnId,
      turnIndex: normalized.turnIndex,
      userText: normalized.userText,
      assistantThinkingSummary: normalized.assistantThinkingSummary,
      assistantSynthesis: normalized.assistantSynthesis,
      codeSummary: normalized.codeSummary,
      assistantResponse: normalized.assistantResponse,
      rawMessages: normalized.rawMessages,
      metadata: mergedMetadata,
    });

    // Keep legacy memory_entries in sync (so existing Memory UI keeps working).
    const u = normalized.userText ? `User: ${normalized.userText}` : "";
    const a = normalized.assistantResponse
      ? `Assistant: ${normalized.assistantResponse}`
      : "";
    const transcript = [u, a].filter(Boolean).join("\n");

    const session_context =
      context ||
      [indexKey, subindexKey].filter(Boolean).join(" > ") ||
      "Memoria proxy capture";

    const content = buildLegacyContent({
      title,
      externalId,
      indexKey,
      subindexKey,
      transcript,
      turnIndex: normalized.turnIndex,
      userText: normalized.userText,
      assistantThinkingSummary: normalized.assistantThinkingSummary,
      assistantSynthesis: normalized.assistantSynthesis,
      codeSummary: normalized.codeSummary,
      assistantResponse: normalized.assistantResponse,
      includeFiveLayer: true,
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
        ${externalId || null},
        ${[indexKey, subindexKey].filter(Boolean)},
        ${session_context},
        ${1}
      )
      RETURNING id
    `;

    // Secondary goal: forward to hub (best-effort; do not fail UI logging if hub is down).
    // To keep tokens out of UI, forwarding is ONLY attempted if options.forwardHub provides
    // a hub URL + bearer token. Otherwise this remains local-only.
    let hub = null;
    let hubError = null;
    try {
      const forwardHub = options?.forwardHub || null;
      const hubUrl = safeString(
        forwardHub?.memoriaHubUrl || forwardHub?.baseUrl,
        null,
      );
      const hubToken = safeString(
        forwardHub?.bearerToken || forwardHub?.token,
        null,
      );

      if (hubUrl && hubToken) {
        const hubRes = await saveToMemoriaHub(conversationId, mergedTurn, {
          ...forwardHub,
          appSource,
          memoriaHubUrl: hubUrl,
          bearerToken: hubToken,
        });
        hub = hubRes?.hub ?? hubRes;
      }
    } catch (e) {
      console.error("Memoria hub forward failed", e);
      hubError = e?.message || "Hub forward failed";
    }

    return Response.json({
      ok: true,
      memory_id: entry?.id || null,
      thread_id: threadId,
      turn_id: turnId,
      external_id: externalId,
      external_turn_id: normalized.externalTurnId,
      index: indexKey,
      subindex: subindexKey,
      // New fields (non-breaking):
      local: {
        memory_id: entry?.id || null,
        thread_id: threadId,
        turn_id: turnId,
        external_id: externalId,
        external_turn_id: normalized.externalTurnId,
        index: indexKey,
        subindex: subindexKey,
      },
      hub,
      ...(hubError ? { hubError } : {}),
    });
  } catch (e) {
    console.error("/api/memoria/proxy/capture error:", e);
    const status = e?.status || 500;
    return Response.json(
      { ok: false, error: e?.message || "Failed to capture" },
      { status },
    );
  }
}
