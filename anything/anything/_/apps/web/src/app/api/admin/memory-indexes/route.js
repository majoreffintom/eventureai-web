import sql from "@/app/api/utils/sql";
import requireAdmin from "@/app/api/utils/requireAdmin.js";

function normalizeText(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

export async function GET(request) {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) {
      return guard.response;
    }

    const url = new URL(request.url);
    const agent_name = normalizeText(url.searchParams.get("agent_name") || "");

    const params = [];
    let where = "";

    if (agent_name) {
      params.push(agent_name);
      where = `WHERE LOWER(a.agent_name) = LOWER($${params.length}::text)`;
    }

    const query = `SELECT
        mi.id,
        mi.index_name,
        mi.display_name,
        mi.index_type,
        mi.description,
        mi.context_count,
        mi.subindex_count,
        mi.created_at,
        mi.updated_at,
        a.agent_name
      FROM memory_indexes mi
      JOIN ai_agents a ON a.id = mi.agent_id
      ${where}
      ORDER BY a.agent_name ASC, mi.display_name ASC;`;

    const indexes = await sql(query, params);

    return Response.json({ indexes: indexes || [] });
  } catch (error) {
    console.error("GET /api/admin/memory-indexes error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
