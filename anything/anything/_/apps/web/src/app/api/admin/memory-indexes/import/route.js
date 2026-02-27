import sql from "@/app/api/utils/sql";
import requireAdmin from "@/app/api/utils/requireAdmin.js";

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

function normalizeIndexType(value) {
  const allowed = new Set(["project", "topic", "client", "custom"]);
  const safe = normalizeText(value);
  if (allowed.has(safe)) {
    return safe;
  }
  return "project";
}

function normalizeCount(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value));
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return 0;
    }
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.trunc(parsed));
    }
  }

  return 0;
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

    let upserted = 0;
    let skipped = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i += 1) {
      const r = rows[i] || {};

      const agent_name = normalizeText(r.agent_name);
      const index_name = normalizeText(r.index_name);
      if (!agent_name || !index_name) {
        errors.push({
          rowIndex: i,
          error: "agent_name and index_name are required",
          agent_name,
          index_name,
        });
        continue;
      }

      const display_name = normalizeText(r.display_name) || index_name;
      const index_type = normalizeIndexType(r.index_type);
      const description = normalizeNullableText(r.description);
      const context_count = normalizeCount(r.context_count);
      const subindex_count = normalizeCount(r.subindex_count);

      // Upsert by (agent_id, index_name) after resolving agent by name.
      const query = `WITH agent AS (
          SELECT id
          FROM ai_agents
          WHERE LOWER(agent_name) = LOWER($1::text)
          LIMIT 1
        )
        INSERT INTO memory_indexes (
          agent_id,
          index_name,
          display_name,
          index_type,
          description,
          context_count,
          subindex_count
        )
        SELECT
          agent.id,
          $2::text,
          $3::text,
          $4::text,
          $5::text,
          $6::integer,
          $7::integer
        FROM agent
        ON CONFLICT (agent_id, index_name)
        DO UPDATE SET
          display_name = EXCLUDED.display_name,
          index_type = EXCLUDED.index_type,
          description = EXCLUDED.description,
          context_count = EXCLUDED.context_count,
          subindex_count = EXCLUDED.subindex_count,
          updated_at = now()
        RETURNING id;`;

      try {
        const insertedRows = await sql(query, [
          agent_name,
          index_name,
          display_name,
          index_type,
          description,
          context_count,
          subindex_count,
        ]);

        if (insertedRows?.length) {
          upserted += 1;
        } else {
          skipped += 1;
          errors.push({
            rowIndex: i,
            error: "Agent not found for agent_name",
            agent_name,
            index_name,
          });
        }
      } catch (e) {
        console.error("Import memory_indexes row failed", e);
        errors.push({
          rowIndex: i,
          error: e?.message || "Upsert failed",
          agent_name,
          index_name,
        });
      }
    }

    return Response.json({ upserted, skipped, errors });
  } catch (error) {
    console.error("POST /api/admin/memory-indexes/import error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
