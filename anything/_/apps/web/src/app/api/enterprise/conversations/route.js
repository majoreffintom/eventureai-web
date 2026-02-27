import sql from "@/app/api/utils/sql";
import {
  buildLegacyContent,
  upsertIndexAndSubindex,
  upsertThread,
  upsertTurn,
} from "@/app/api/utils/memoriaStore";
import { requireSession } from "@/app/api/tournament/utils";

const ENTERPRISE_INDEX_KEY = "Enterprise_Dashboard";
const SESSION_CONTEXT = "Enterprise Chat Import";

function safeStr(v) {
  return typeof v === "string" ? v : "";
}

// NEW: small helper for splitting a big paste into multiple conversations.
function splitConversations(rawText) {
  const text = safeStr(rawText);
  if (!text.trim()) return [];

  // Split on markers like:
  // "Conversation 3" or "Next conversation"
  const parts = text
    .split(/\n\s*(?:Conversation\s*\d+|Next\s+conversation)\s*\n/gi)
    .map((p) => p.trim())
    .filter(Boolean);

  // If nothing split, treat as one conversation.
  if (parts.length <= 1) return [text.trim()];

  return parts;
}

// NEW: tiny, deterministic app detection so you can paste mixed logs without
// having to tag each one manually. Falls back to the selected appKey.
function detectAppKeyFromText(text, fallbackAppKey) {
  const t = safeStr(text).toLowerCase();
  // Default: if we can't detect anything, file it under EventureAI
  const fallback = safeStr(fallbackAppKey).toLowerCase() || "eventureai";

  // Specific app signatures
  if (
    t.includes("bethefirstnft.com") ||
    t.includes("nifty") ||
    t.includes("nft marketplace")
  ) {
    return "nifty";
  }

  if (t.includes("chainy")) return "chainy";
  if (t.includes("memoria")) return "memoria";
  if (t.includes("resty")) return "resty";
  if (t.includes("rosebud")) return "rosebud";
  if (t.includes("lumina")) return "lumina";
  if (t.includes("ditzl")) return "ditzl";

  // EventureAI (explicit mention)
  if (t.includes("eventureai") || t.includes("eventure ai"))
    return "eventureai";

  return fallback;
}

function extractInlineTasks(text) {
  const raw = safeStr(text);
  if (!raw.trim()) return [];

  // Small, safe heuristics for non-bulleted "notes".
  // We keep it conservative to avoid noisy task spam.
  const tasks = [];
  const candidates = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of candidates) {
    const lower = line.toLowerCase();

    // Skip obvious non-task markers
    if (lower === "next conversation" || lower.startsWith("##")) continue;

    const isNote =
      lower.startsWith("please ") ||
      lower.startsWith("also need to ") ||
      lower.startsWith("need to ") ||
      lower.startsWith("we need to ") ||
      lower.startsWith("let's ") ||
      lower.startsWith("lets ") ||
      lower.startsWith("make note") ||
      lower.startsWith("note:") ||
      lower.startsWith("todo:") ||
      lower.startsWith("to-do:");

    if (!isNote) continue;

    // Normalize common phrasing
    let title = line
      .replace(/^please\s+/i, "")
      .replace(/^also\s+need\s+to\s+/i, "")
      .replace(/^we\s+need\s+to\s+/i, "")
      .replace(/^need\s+to\s+/i, "")
      .replace(/^let'?s\s+/i, "")
      .replace(/^make\s+note\s+(of\s+)?/i, "")
      .replace(/^note:\s*/i, "")
      .replace(/^todo:\s*/i, "")
      .replace(/^to-do:\s*/i, "")
      .trim();

    if (!title) continue;

    // Cap length so titles don't become entire paragraphs
    if (title.length > 160) {
      title = `${title.slice(0, 157)}...`;
    }

    tasks.push({ title });
    if (tasks.length >= 16) break;
  }

  return tasks;
}

function taskTagsFromTitle(title) {
  const t = safeStr(title).toLowerCase();
  const tags = [];

  if (t.includes("resend")) tags.push("resend");
  if (t.includes("mailgun") || t.includes("email")) tags.push("mail");
  if (t.includes("twilio") || t.includes("sms")) tags.push("sms");

  if (t.includes("alchemy")) tags.push("alchemy");
  if (t.includes("metamask")) tags.push("metamask");
  if (t.includes("polygon")) tags.push("polygon");
  if (t.includes("nft")) tags.push("nft");

  if (t.includes("tournament") || t.includes("battle")) tags.push("tournament");
  if (t.includes("llm") || t.includes("model")) tags.push("llm");
  if (t.includes("openai") || t.includes("o3")) tags.push("openai");
  if (t.includes("claude")) tags.push("claude");
  if (t.includes("gemini")) tags.push("gemini");
  if (t.includes("grok")) tags.push("grok");
  if (t.includes("groq")) tags.push("groq");

  return tags;
}

function parseSuggestedTasksFromMarkdown(markdown) {
  const text = safeStr(markdown);
  if (!text.trim()) return [];

  const lines = text.split(/\r?\n/);

  // Heuristic: pull bullets under headings that look like "next steps".
  let inSuggestions = false;
  const tasks = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith("#")) {
      const heading = line.replace(/^#+\s*/, "").toLowerCase();
      inSuggestions =
        heading.includes("help next") ||
        heading.includes("next with") ||
        heading.includes("need from you next") ||
        heading.includes("what i need") ||
        heading.includes("what we need") ||
        heading.includes("next");
      continue;
    }

    const bulletMatch = line.match(/^[-*]\s+(.*)$/);
    if (!bulletMatch) continue;

    if (!inSuggestions) continue;

    const title = bulletMatch[1].trim();
    if (!title) continue;

    tasks.push({ title });
  }

  // If the chat doesn't have an obvious "next" section, fall back to inline note extraction.
  const inline = tasks.length === 0 ? extractInlineTasks(text) : [];

  return [...tasks, ...inline].slice(0, 40);
}

function buildExternalId({ userId }) {
  const rand = Math.random().toString(16).slice(2, 10);
  return `enterprise:${String(userId)}:${Date.now()}:${rand}`;
}

export async function POST(request) {
  try {
    const { userId } = await requireSession();
    if (!userId) {
      return Response.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));

    // Default app bucket: eventureai
    let providedAppKey = safeStr(
      body?.app_key || body?.appKey || "",
    ).toLowerCase();
    const title = safeStr(body?.title || "");
    const context = safeStr(body?.context || "");
    const appSource = safeStr(
      body?.app_source || body?.appSource || "enterprise_dashboard",
    );

    const rawTurns = Array.isArray(body?.turns) ? body.turns : null;
    const conversationMarkdown = safeStr(
      body?.content || body?.markdown || body?.text || "",
    );

    const split = Boolean(
      body?.split || body?.batch || body?.splitConversations,
    );

    // If user didn't pick an app and we're not splitting, default to EventureAI
    if (!providedAppKey) {
      providedAppKey = "eventureai";
    }

    if (!conversationMarkdown.trim() && !rawTurns) {
      return Response.json(
        { ok: false, error: "Missing conversation content" },
        { status: 400 },
      );
    }

    const segments = split
      ? splitConversations(conversationMarkdown)
      : [conversationMarkdown];

    const results = [];

    for (let sIdx = 0; sIdx < segments.length; sIdx += 1) {
      const segmentText = segments[sIdx];

      const appKey = split
        ? detectAppKeyFromText(segmentText, providedAppKey)
        : providedAppKey;

      if (!appKey) {
        continue;
      }

      // Verify app exists (helps catch typos)
      const [appRow] = await sql`
        SELECT key
        FROM enterprise_apps
        WHERE key = ${appKey}
        LIMIT 1
      `;

      if (!appRow?.key) {
        return Response.json(
          {
            ok: false,
            error: `Unknown app_key '${appKey}'. Run POST /api/enterprise/bootstrap first or pick a valid app.`,
          },
          { status: 400 },
        );
      }

      const externalId =
        safeStr(body?.external_id || body?.externalId) ||
        buildExternalId({ userId });

      const { memoriaIndexId, memoriaSubindexId } =
        await upsertIndexAndSubindex({
          indexKey: ENTERPRISE_INDEX_KEY,
          subindexKey: appKey,
        });

      const threadId = await upsertThread({
        externalId,
        appSource,
        title:
          (title || `Chat import (${appKey})`) +
          (split ? ` [${sIdx + 1}/${segments.length}]` : ""),
        context: context || `Imported from chat for ${appKey}.`,
        memoriaIndexId,
        memoriaSubindexId,
        metadata: {
          import_source: "chat",
          app_key: appKey,
          created_by_user_id: String(userId),
          split_batch: split,
          split_index: sIdx,
          split_total: segments.length,
        },
      });

      if (!threadId) {
        throw new Error("Failed to create thread");
      }

      const turns = rawTurns
        ? rawTurns
        : [
            {
              turnIndex: 0,
              userText: segmentText,
              assistantResponse: null,
            },
          ];

      let turnsTouched = 0;
      let legacyEntriesInserted = 0;

      for (let idx = 0; idx < turns.length; idx += 1) {
        const t = turns[idx] || {};
        const turnIndex = typeof t.turnIndex === "number" ? t.turnIndex : idx;
        const userText =
          safeStr(t.userText || t.user_text || t.user || "") || null;
        const assistantResponse =
          safeStr(
            t.assistantResponse || t.assistant_response || t.assistant || "",
          ) || null;

        if (!userText && !assistantResponse) {
          continue;
        }

        const externalTurnId = `${externalId}:${turnIndex}:import`;

        const turnId = await upsertTurn({
          threadId,
          externalTurnId,
          turnIndex,
          userText,
          assistantThinkingSummary: null,
          assistantSynthesis: null,
          codeSummary: null,
          assistantResponse,
          rawMessages: [
            ...(userText ? [{ role: "user", content: userText }] : []),
            ...(assistantResponse
              ? [{ role: "assistant", content: assistantResponse }]
              : []),
          ],
          metadata: {
            import_source: "chat",
            app_key: appKey,
            created_by_user_id: String(userId),
          },
        });

        if (turnId) {
          turnsTouched += 1;
        }

        // Mirror into legacy memory_entries (idempotent per externalTurnId)
        const existing = await sql`
          SELECT id
          FROM memory_entries
          WHERE session_context = ${SESSION_CONTEXT}
            AND user_intent_analysis = ${externalTurnId}
          LIMIT 1
        `;

        if (existing?.length) {
          continue;
        }

        const transcriptParts = [];
        if (userText) transcriptParts.push(`User: ${userText}`);
        if (assistantResponse)
          transcriptParts.push(`Assistant: ${assistantResponse}`);
        const transcript = transcriptParts.join("\n");

        const legacyContent = buildLegacyContent({
          title: title || `Chat import (${appKey})`,
          externalId,
          indexKey: ENTERPRISE_INDEX_KEY,
          subindexKey: appKey,
          transcript,
          turnIndex,
          userText,
          assistantThinkingSummary: null,
          assistantSynthesis: null,
          codeSummary: null,
          assistantResponse,
          includeFiveLayer: false,
        });

        await sql`
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
            ${legacyContent},
            ${"Enterprise chat import"},
            ${externalTurnId},
            ${["enterprise", appKey, "conversation"]},
            ${SESSION_CONTEXT},
            ${0}
          )
        `;

        legacyEntriesInserted += 1;
      }

      // Optionally auto-extract tasks
      const extractedTasks = parseSuggestedTasksFromMarkdown(segmentText);
      let tasksInserted = 0;

      for (const task of extractedTasks) {
        const taskTitle = safeStr(task.title);
        if (!taskTitle) continue;

        const tags = taskTagsFromTitle(taskTitle);

        await sql`
          INSERT INTO enterprise_app_tasks (
            app_key,
            title,
            description,
            status,
            priority,
            created_by_user_id,
            source_thread_id,
            tags,
            metadata
          ) VALUES (
            ${appKey},
            ${taskTitle},
            ${"Auto-extracted from chat import"},
            ${"todo"},
            ${"medium"},
            ${userId},
            ${threadId},
            ${tags},
            ${JSON.stringify({ source: "auto_extract", import_external_id: externalId })}::jsonb
          )
        `;

        tasksInserted += 1;
      }

      results.push({
        app_key: appKey,
        external_id: externalId,
        thread_id: threadId,
        turns_touched: turnsTouched,
        legacy_memory_entries_inserted: legacyEntriesInserted,
        tasks_inserted: tasksInserted,
      });
    }

    return Response.json({
      ok: true,
      split,
      imported: results.length,
      results,
      note: "Conversation stored in memoria_threads/turns and mirrored into memory_entries (legacy).",
    });
  } catch (e) {
    console.error("/api/enterprise/conversations POST error:", e);
    return Response.json(
      { ok: false, error: e?.message || "Failed to store conversation" },
      { status: 500 },
    );
  }
}
