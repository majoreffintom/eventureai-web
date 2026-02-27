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
    const touchedParentIds = new Set();

    for (let i = 0; i < rows.length; i += 1) {
      const r = rows[i] || {};

      const agent_name = normalizeText(r.agent_name);
      const parent_index_name =
        normalizeText(r.parent_index_name) || normalizeText(r.index_name);
      const subindex_name = normalizeText(r.subindex_name);

      if (!agent_name || !parent_index_name || !subindex_name) {
        errors.push({
          rowIndex: i,
          error:
            "agent_name, parent_index_name, and subindex_name are required",
          agent_name,
          parent_index_name,
          subindex_name,
        });
        continue;
      }

      const display_name = normalizeText(r.display_name) || subindex_name;
      const description = normalizeNullableText(r.description);
      const context_count = normalizeCount(r.context_count);

      const query = `WITH agent AS (
          SELECT id
          FROM ai_agents
          WHERE LOWER(agent_name) = LOWER($1::text)
          LIMIT 1
        ), parent AS (
          SELECT mi.id
          FROM memory_indexes mi
          JOIN agent a ON a.id = mi.agent_id
          WHERE mi.index_name = $2::text
          LIMIT 1
        )
        INSERT INTO memory_subindexes (
          agent_id,
          parent_index_id,
          subindex_name,
          display_name,
          description,
          context_count
        )
        SELECT
          (SELECT id FROM agent),
          (SELECT id FROM parent),
          $3::text,
          $4::text,
          $5::text,
          $6::integer
        WHERE (SELECT id FROM agent) IS NOT NULL
          AND (SELECT id FROM parent) IS NOT NULL
        ON CONFLICT (parent_index_id, subindex_name)
        DO UPDATE SET
          display_name = EXCLUDED.display_name,
          description = EXCLUDED.description,
          context_count = EXCLUDED.context_count,
          updated_at = now()
        RETURNING parent_index_id;`;

      try {
        const result = await sql(query, [
          agent_name,
          parent_index_name,
          subindex_name,
          display_name,
          description,
          context_count,
        ]);

        if (result?.length) {
          upserted += 1;
          const parentId = result?.[0]?.parent_index_id;
          if (parentId) {
            touchedParentIds.add(parentId);
          }
        } else {
          skipped += 1;
          errors.push({
            rowIndex: i,
            error: "Agent or parent index not found",
            agent_name,
            parent_index_name,
            subindex_name,
          });
        }
      } catch (e) {
        console.error("Import memory_subindexes row failed", e);
        errors.push({
          rowIndex: i,
          error: e?.message || "Upsert failed",
          agent_name,
          parent_index_name,
          subindex_name,
        });
      }
    }

    // Keep parent index subindex_count in sync for the parents we touched.
    const touched = Array.from(touchedParentIds);
    if (touched.length) {
      try {
        await sql(
          `UPDATE memory_indexes mi
           SET subindex_count = counts.cnt,
               updated_at = now()
           FROM (
             SELECT parent_index_id, COUNT(*)::integer AS cnt
             FROM memory_subindexes
             WHERE parent_index_id = ANY($1::uuid[])
             GROUP BY parent_index_id
           ) counts
           WHERE mi.id = counts.parent_index_id;`,
          [touched],
        );
      } catch (e) {
        console.error("Failed to recompute subindex_count", e);
      }
    }

    return Response.json({ upserted, skipped, errors });
  } catch (error) {
    console.error("POST /api/admin/memory-subindexes/import error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
