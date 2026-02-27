import sql from "@/app/api/utils/sql";
import requireAdmin from "@/app/api/utils/requireAdmin.js";

function normalizeText(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

async function getAssistantReply(rawText) {
  try {
    const systemPrompt =
      "You are Josh's back-office AI assistant. Your job is to help Josh build a great phone-answering agent by asking one sharp follow-up question, or by pointing out a contradiction, or by confirming what you heard. Keep it short (1-2 sentences). Never mention AI or tokens.";

    const userPrompt = [
      "Josh dictated:",
      rawText,
      "",
      "Reply as the assistant. Ask ONE follow-up question.",
    ].join("\n");

    const response = await fetch(
      `${process.env.APP_URL}/integrations/chat-gpt/conversationgpt4`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `When fetching ChatGPT, the response was [${response.status}] ${response.statusText}`,
      );
    }

    const data = await response.json();
    const assistantText = data?.choices?.[0]?.message?.content?.trim();
    return assistantText || null;
  } catch (error) {
    console.error("getAssistantReply error", error);
    return null;
  }
}

async function safeListRawContext(limit) {
  try {
    const rows = await sql(
      `SELECT id, raw_text, created_at
       FROM raw_context
       ORDER BY created_at DESC, id DESC
       LIMIT $1::integer;`,
      [limit],
    );
    return rows || [];
  } catch (error) {
    // Backwards-compatible fallback if created_at hasn't been added yet.
    const message = String(error?.message || "");
    if (message.toLowerCase().includes("created_at")) {
      const rows = await sql(
        `SELECT id, raw_text
         FROM raw_context
         ORDER BY id DESC
         LIMIT $1::integer;`,
        [limit],
      );
      return rows || [];
    }

    throw error;
  }
}

async function safeInsertRawContext(rawText) {
  try {
    const inserted = await sql(
      "INSERT INTO raw_context (raw_text) VALUES ($1::text) RETURNING id, raw_text, created_at;",
      [rawText],
    );
    return inserted?.[0] || null;
  } catch (error) {
    // Backwards-compatible fallback if created_at hasn't been added yet.
    const message = String(error?.message || "");
    if (message.toLowerCase().includes("created_at")) {
      const inserted = await sql(
        "INSERT INTO raw_context (raw_text) VALUES ($1::text) RETURNING id, raw_text;",
        [rawText],
      );
      return inserted?.[0] || null;
    }

    throw error;
  }
}

export async function GET(request) {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) {
      return guard.response;
    }

    const url = new URL(request.url);
    const limitRaw = normalizeText(url.searchParams.get("limit") || "50");
    const parsed = Number(limitRaw);
    const limit = Number.isFinite(parsed)
      ? Math.max(1, Math.min(200, Math.trunc(parsed)))
      : 50;

    const rows = await safeListRawContext(limit);
    return Response.json({ rows });
  } catch (error) {
    console.error("GET /api/admin/raw-context error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) {
      return guard.response;
    }

    const body = await request.json().catch(() => null);
    const raw_text = normalizeText(body?.raw_text);

    if (!raw_text) {
      return Response.json({ error: "raw_text is required" }, { status: 400 });
    }

    const row = await safeInsertRawContext(raw_text);
    if (!row?.id) {
      return Response.json(
        { error: "Could not insert raw context" },
        { status: 500 },
      );
    }

    const startChat = body?.start_chat === true;
    const assistantText = startChat ? await getAssistantReply(raw_text) : null;

    return Response.json({ ok: true, row, assistantText });
  } catch (error) {
    console.error("POST /api/admin/raw-context error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
