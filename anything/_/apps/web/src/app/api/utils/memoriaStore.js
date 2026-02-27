import sql from "@/app/api/utils/sql";

export const DEFAULT_INDEX_KEY = "Cross_App_Conversations";

export function normalizeAppSource(headers, body) {
  return (
    headers.get("x-app-source") ||
    body?.appSource ||
    body?.app_source ||
    body?.source ||
    "unknown"
  );
}

export function normalizeIndexKeys(body, appSource) {
  const indexKeyRaw =
    body?.indexKey ||
    body?.index_key ||
    body?.index ||
    body?.memoriaIndex ||
    null;

  const subindexKeyRaw =
    body?.subindexKey ||
    body?.subindex_key ||
    body?.subindex ||
    body?.memoriaSubindex ||
    null;

  const indexKey = indexKeyRaw || DEFAULT_INDEX_KEY;
  const subindexKey = subindexKeyRaw || appSource;

  return { indexKey, subindexKey };
}

export async function upsertIndexAndSubindex({ indexKey, subindexKey }) {
  let memoriaIndexId = null;
  let memoriaSubindexId = null;

  if (indexKey) {
    const [idxRow] = await sql`
      INSERT INTO memoria_indexes (key, name)
      VALUES (${indexKey}, ${indexKey})
      ON CONFLICT (key) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `;
    memoriaIndexId = idxRow?.id || null;

    if (subindexKey && memoriaIndexId) {
      const [subRow] = await sql`
        INSERT INTO memoria_subindexes (memoria_index_id, key, name)
        VALUES (${memoriaIndexId}, ${subindexKey}, ${subindexKey})
        ON CONFLICT (memoria_index_id, key) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
      `;
      memoriaSubindexId = subRow?.id || null;
    }
  }

  return { memoriaIndexId, memoriaSubindexId };
}

export async function upsertThread({
  externalId,
  appSource,
  title,
  context,
  memoriaIndexId,
  memoriaSubindexId,
  metadata,
}) {
  const metadataJson = metadata ? JSON.stringify(metadata) : JSON.stringify({});

  const [threadRow] = await sql`
    INSERT INTO memoria_threads (
      external_id,
      app_source,
      title,
      context,
      memoria_index_id,
      memoria_subindex_id,
      metadata,
      last_turn_at,
      updated_at
    ) VALUES (
      ${externalId},
      ${appSource},
      ${title || null},
      ${context || null},
      ${memoriaIndexId || null},
      ${memoriaSubindexId || null},
      ${metadataJson}::jsonb,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (external_id) DO UPDATE SET
      app_source = EXCLUDED.app_source,
      title = COALESCE(EXCLUDED.title, memoria_threads.title),
      context = COALESCE(EXCLUDED.context, memoria_threads.context),
      memoria_index_id = COALESCE(EXCLUDED.memoria_index_id, memoria_threads.memoria_index_id),
      memoria_subindex_id = COALESCE(EXCLUDED.memoria_subindex_id, memoria_threads.memoria_subindex_id),
      metadata = memoria_threads.metadata || EXCLUDED.metadata,
      updated_at = CURRENT_TIMESTAMP,
      last_turn_at = CURRENT_TIMESTAMP
    RETURNING id
  `;

  return threadRow?.id || null;
}

export async function getNextTurnIndex(threadId) {
  const [{ next_turn_index }] = await sql`
    SELECT COALESCE(MAX(turn_index), -1) + 1 AS next_turn_index
    FROM memoria_turns
    WHERE thread_id = ${threadId}
  `;
  return Number(next_turn_index || 0);
}

export function normalizeTurn({
  turn,
  messages,
  externalId,
  defaultTurnIndex,
}) {
  const hasMessages = Array.isArray(messages) && messages.length > 0;

  const turnIndex =
    typeof turn?.turnIndex === "number"
      ? turn.turnIndex
      : typeof turn?.turn_index === "number"
        ? turn.turn_index
        : defaultTurnIndex;

  const userText =
    turn?.userText ||
    turn?.user_text ||
    (hasMessages
      ? [...messages].reverse().find((m) => m?.role === "user")?.content
      : null);

  const assistantResponse =
    turn?.assistantResponse ||
    turn?.assistant_response ||
    (hasMessages
      ? [...messages].reverse().find((m) => m?.role === "assistant")?.content
      : null);

  const assistantThinkingSummary =
    turn?.assistantThinkingSummary || turn?.assistant_thinking_summary || null;

  const assistantSynthesis =
    turn?.assistantSynthesis || turn?.assistant_synthesis || null;

  const codeSummary = turn?.codeSummary || turn?.code_summary || null;

  const rawMessages = hasMessages ? messages : turn?.rawMessages || null;

  const externalTurnId =
    turn?.externalTurnId ||
    turn?.external_turn_id ||
    `${externalId}:${String(turnIndex)}:${hasMessages ? `m${messages.length}` : "turn"}`;

  return {
    turnIndex,
    externalTurnId,
    userText: userText || null,
    assistantResponse: assistantResponse || null,
    assistantThinkingSummary: assistantThinkingSummary || null,
    assistantSynthesis: assistantSynthesis || null,
    codeSummary: codeSummary || null,
    rawMessages,
    metadata: turn?.metadata || {},
  };
}

export async function upsertTurn({
  threadId,
  externalTurnId,
  turnIndex,
  userText,
  assistantThinkingSummary,
  assistantSynthesis,
  codeSummary,
  assistantResponse,
  rawMessages,
  metadata,
}) {
  const rawMessagesJson = rawMessages ? JSON.stringify(rawMessages) : null;
  const metadataJson = metadata ? JSON.stringify(metadata) : JSON.stringify({});

  const [turnRow] = await sql`
    INSERT INTO memoria_turns (
      thread_id,
      external_turn_id,
      turn_index,
      user_text,
      assistant_thinking_summary,
      assistant_synthesis,
      code_summary,
      assistant_response,
      raw_messages,
      metadata
    ) VALUES (
      ${threadId},
      ${externalTurnId},
      ${turnIndex},
      ${userText || null},
      ${assistantThinkingSummary || null},
      ${assistantSynthesis || null},
      ${codeSummary || null},
      ${assistantResponse || null},
      ${rawMessagesJson}::jsonb,
      ${metadataJson}::jsonb
    )
    ON CONFLICT (thread_id, external_turn_id) DO UPDATE SET
      user_text = COALESCE(EXCLUDED.user_text, memoria_turns.user_text),
      assistant_thinking_summary = COALESCE(EXCLUDED.assistant_thinking_summary, memoria_turns.assistant_thinking_summary),
      assistant_synthesis = COALESCE(EXCLUDED.assistant_synthesis, memoria_turns.assistant_synthesis),
      code_summary = COALESCE(EXCLUDED.code_summary, memoria_turns.code_summary),
      assistant_response = COALESCE(EXCLUDED.assistant_response, memoria_turns.assistant_response),
      raw_messages = COALESCE(EXCLUDED.raw_messages, memoria_turns.raw_messages),
      metadata = memoria_turns.metadata || EXCLUDED.metadata
    RETURNING id
  `;

  return turnRow?.id || null;
}

export function buildLegacyContent({
  title,
  externalId,
  indexKey,
  subindexKey,
  transcript,
  turnIndex,
  userText,
  assistantThinkingSummary,
  assistantSynthesis,
  codeSummary,
  assistantResponse,
  includeFiveLayer,
}) {
  const titleLine = title ? `Title: ${title}\n` : "";
  const externalLine = externalId ? `External ID: ${externalId}\n` : "";
  const indexLine =
    [indexKey, subindexKey].filter(Boolean).length > 0
      ? `Index: ${[indexKey, subindexKey].filter(Boolean).join(" > ")}\n`
      : "";

  const fiveLayerBlock = includeFiveLayer
    ? `Turn Index: ${turnIndex}\n\n1) User\n${userText || ""}\n\n2) Thinking (safe summary)\n${assistantThinkingSummary || ""}\n\n3) Synthesis\n${assistantSynthesis || ""}\n\n4) Code\n${codeSummary || ""}\n\n5) Response\n${assistantResponse || ""}\n\n`
    : "";

  return `${titleLine}${externalLine}${indexLine}${fiveLayerBlock}Transcript:\n${transcript}`.trim();
}
