import sql from "@/app/api/utils/sql";
import requireAdmin from "@/app/api/utils/requireAdmin.js";

function safeJsonArray(value, fallback = []) {
  if (Array.isArray(value)) {
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
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return fallback;
  } catch (_e) {
    return fallback;
  }
}

function safeJson(value, fallback = []) {
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

  // map common legacy/export statuses
  if (safe === "pending") {
    return "active";
  }

  return "completed";
}

function normalizeText(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

function normalizeNullableText(value) {
  const text = normalizeText(value);
  return text ? text : null;
}

export async function POST(request) {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) {
      return guard.response;
    }

    const body = await request.json().catch(() => null);
    const rows = Array.isArray(body?.rows) ? body.rows : null;

    if (!rows) {
      return Response.json(
        { error: "Expected JSON: { rows: [...] }" },
        { status: 400 },
      );
    }

    if (rows.length > 2000) {
      return Response.json(
        { error: "Too many rows (max 2000 per import)" },
        { status: 400 },
      );
    }

    let inserted = 0;
    let skipped = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i += 1) {
      const r = rows[i] || {};

      const date = normalizeText(r.date);
      const subject = normalizeText(r.subject);
      if (!date || !subject) {
        errors.push({
          rowIndex: i,
          error: "date and subject are required",
        });
        continue;
      }

      const project_id = normalizeNullableText(r.project_id);
      const summary = normalizeNullableText(r.summary);
      const conversation_type = normalizeConversationType(r.conversation_type);
      const status = normalizeStatus(r.status);

      const technical_decisions = safeJson(r.technical_decisions, []);
      const entities_created = safeJsonArray(r.entities_created, []);
      const functions_created = safeJsonArray(r.functions_created, []);
      const pages_created = safeJsonArray(r.pages_created, []);
      const api_keys_used = safeJsonArray(r.api_keys_used, []);
      const bugs_fixed = safeJsonArray(r.bugs_fixed, []);
      const action_items = safeJsonArray(r.action_items, []);
      const participants = safeJsonArray(r.participants, []);
      const tags = safeJsonArray(r.tags, []);

      // Avoid duplicates without needing a unique index.
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
        SELECT
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
        WHERE NOT EXISTS (
          SELECT 1
          FROM conversations c
          WHERE c.date = $1::timestamptz
            AND COALESCE(c.project_id, '') = COALESCE($2::text, '')
            AND c.subject = $3::text
        )
        RETURNING id;`;

      try {
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

        if (result?.length) {
          inserted += 1;
        } else {
          skipped += 1;
        }
      } catch (e) {
        console.error("Import conversations row failed", e);
        errors.push({
          rowIndex: i,
          subject,
          error: e?.message || "Insert failed",
        });
      }
    }

    return Response.json({ inserted, skipped, errors });
  } catch (error) {
    console.error("POST /api/admin/conversations/import error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
