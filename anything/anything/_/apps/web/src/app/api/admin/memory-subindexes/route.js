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
    const parent_index_id = normalizeText(
      url.searchParams.get("parent_index_id") || "",
    );

    const params = [];
    const whereParts = [];

    if (agent_name) {
      params.push(agent_name);
      whereParts.push(`LOWER(a.agent_name) = LOWER($${params.length}::text)`);
    }

    if (parent_index_id) {
      params.push(parent_index_id);
      whereParts.push(`ms.parent_index_id = $${params.length}::uuid`);
    }

    const where = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";

    const query = `SELECT
        ms.id,
        ms.subindex_name,
        ms.display_name,
        ms.description,
        ms.context_count,
        ms.parent_index_id,
        ms.created_at,
        ms.updated_at,
        a.agent_name
      FROM memory_subindexes ms
      JOIN ai_agents a ON a.id = ms.agent_id
      ${where}
      ORDER BY a.agent_name ASC, ms.display_name ASC;`;

    const subindexes = await sql(query, params);

    return Response.json({ subindexes: subindexes || [] });
  } catch (error) {
    console.error("GET /api/admin/memory-subindexes error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
