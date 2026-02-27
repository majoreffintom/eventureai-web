import sql from "@/app/api/utils/sql";
import requireAdmin from "@/app/api/utils/requireAdmin.js";

function normalizeText(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

function normalizeLimit(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 30;
  }
  return Math.max(1, Math.min(200, Math.trunc(parsed)));
}

export async function GET(request) {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) {
      return guard.response;
    }

    const url = new URL(request.url);
    const q = normalizeText(url.searchParams.get("q") || "");
    const project_id = normalizeText(url.searchParams.get("project_id") || "");
    const limit = normalizeLimit(url.searchParams.get("limit") || "");

    const params = [];
    const whereParts = [];

    // --- FIX: build the q filter as ONE grouped expression (no stray OR tokens) ---
    if (q) {
      params.push(`%${q}%`);
      const p = `$${params.length}`;
      whereParts.push(
        `(
          c.subject ILIKE ${p}
          OR COALESCE(c.summary, '') ILIKE ${p}
          OR EXISTS (SELECT 1 FROM unnest(c.tags) t WHERE t ILIKE ${p})
        )`,
      );
    }

    if (project_id) {
      params.push(project_id);
      whereParts.push(`c.project_id = $${params.length}::text`);
    }

    params.push(limit);

    const where = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";

    const query = `SELECT
        c.id,
        c.date,
        c.project_id,
        c.subject,
        c.summary,
        c.conversation_type,
        c.technical_decisions,
        c.entities_created,
        c.functions_created,
        c.pages_created,
        c.api_keys_used,
        c.bugs_fixed,
        c.action_items,
        c.participants,
        c.tags,
        c.status,
        c.created_at,
        c.updated_at
      FROM conversations c
      ${where}
      ORDER BY c.date DESC
      LIMIT $${params.length}::integer;`;

    const conversations = await sql(query, params);

    return Response.json({ conversations: conversations || [] });
  } catch (error) {
    console.error("GET /api/admin/conversations/search error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
