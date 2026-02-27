import sql from "@/app/api/utils/sql";
import requireAdmin from "@/app/api/utils/requireAdmin.js";

function normalizeText(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

function normalizeNullableText(value) {
  const t = normalizeText(value);
  return t ? t : null;
}

function safeTextArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter(Boolean);
  }

  if (typeof value !== "string") {
    return [];
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed
        .map((v) => (typeof v === "string" ? v.trim() : ""))
        .filter(Boolean);
    }
  } catch (_e) {
    // ignore
  }

  return trimmed
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function safeJson(value, fallback) {
  if (value && typeof value === "object") {
    return value;
  }

  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(trimmed);
    return parsed ?? fallback;
  } catch (_e) {
    return fallback;
  }
}

function normalizeConversationType(value) {
  const allowed = new Set([
    "technical",
    "brainstorm",
    "casual",
    "efiver-contact",
  ]);
  const safe = typeof value === "string" ? value.trim() : "";
  if (allowed.has(safe)) {
    return safe;
  }
  return "technical";
}

function normalizeStatus(value) {
  const allowed = new Set(["active", "completed", "blocked"]);
  const safe = typeof value === "string" ? value.trim() : "";
  if (allowed.has(safe)) {
    return safe;
  }
  return "completed";
}

export async function POST(request) {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) {
      return guard.response;
    }

    const body = await request.json().catch(() => null);

    const date = normalizeNullableText(body?.date) || new Date().toISOString();
    const subject = normalizeText(body?.subject);
    const project_id = normalizeNullableText(body?.project_id);
    const summary = normalizeNullableText(body?.summary);
    const conversation_type = normalizeConversationType(
      body?.conversation_type,
    );
    const status = normalizeStatus(body?.status);

    const technical_decisions = safeJson(body?.technical_decisions, []);

    const entities_created = safeTextArray(body?.entities_created);
    const functions_created = safeTextArray(body?.functions_created);
    const pages_created = safeTextArray(body?.pages_created);
    const api_keys_used = safeTextArray(body?.api_keys_used);
    const bugs_fixed = safeTextArray(body?.bugs_fixed);
    const action_items = safeTextArray(body?.action_items);
    const participants = safeTextArray(body?.participants);
    const tags = safeTextArray(body?.tags);

    if (!subject) {
      return Response.json({ error: "subject is required" }, { status: 400 });
    }

    const query = `INSERT INTO conversations (
        date,
        project_id,
        subject,
        summary,
        conversation_type,
        technical_decisions,
        entities_created,
        functions_created,
        pages_created,
        api_keys_used,
        bugs_fixed,
        action_items,
        participants,
        tags,
        status
      )
      VALUES (
        $1::timestamptz,
        $2::text,
        $3::text,
        $4::text,
        $5::text,
        $6::jsonb,
        $7::text[],
        $8::text[],
        $9::text[],
        $10::text[],
        $11::text[],
        $12::text[],
        $13::text[],
        $14::text[],
        $15::text
      )
      RETURNING id;`;

    const result = await sql(query, [
      date,
      project_id,
      subject,
      summary,
      conversation_type,
      JSON.stringify(technical_decisions),
      entities_created,
      functions_created,
      pages_created,
      api_keys_used,
      bugs_fixed,
      action_items,
      participants,
      tags,
      status,
    ]);

    const id = result?.[0]?.id;
    if (!id) {
      return Response.json(
        { error: "Could not create conversation" },
        { status: 500 },
      );
    }

    return Response.json({ ok: true, id });
  } catch (error) {
    console.error("POST /api/admin/conversations error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
