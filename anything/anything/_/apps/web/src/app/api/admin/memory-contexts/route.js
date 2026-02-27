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

function normalizeLimit(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 50;
  }
  return Math.max(1, Math.min(200, Math.trunc(parsed)));
}

function normalizeImportance(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 5;
  }
  return Math.max(1, Math.min(10, Math.trunc(parsed)));
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

function safeUuidArray(value) {
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

export async function GET(request) {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) {
      return guard.response;
    }

    const url = new URL(request.url);
    const agent_name = normalizeText(url.searchParams.get("agent_name") || "");
    const q = normalizeText(url.searchParams.get("q") || "");
    const parent_index_id = normalizeText(
      url.searchParams.get("parent_index_id") || "",
    );
    const parent_subindex_id = normalizeText(
      url.searchParams.get("parent_subindex_id") || "",
    );
    const tag = normalizeText(url.searchParams.get("tag") || "");
    const limit = normalizeLimit(url.searchParams.get("limit") || "");

    const params = [];
    const whereParts = [];

    if (agent_name) {
      params.push(agent_name);
      whereParts.push(`LOWER(a.agent_name) = LOWER($${params.length}::text)`);
    }

    if (parent_index_id) {
      params.push(parent_index_id);
      whereParts.push(`mc.parent_index_id = $${params.length}::uuid`);
    }

    if (parent_subindex_id) {
      params.push(parent_subindex_id);
      whereParts.push(`mc.parent_subindex_id = $${params.length}::uuid`);
    }

    if (q) {
      params.push(`%${q}%`);
      const p = `$${params.length}`;
      whereParts.push(
        `(mc.title ILIKE ${p} OR COALESCE(mc.summary, '') ILIKE ${p} OR COALESCE(mc.content, '') ILIKE ${p})`,
      );
    }

    if (tag) {
      params.push(tag);
      whereParts.push(`$${params.length}::text = ANY(mc.tags)`);
    }

    params.push(limit);

    const where = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";

    const query = `SELECT
        mc.id,
        mc.context_name,
        mc.context_type,
        mc.parent_index_id,
        mc.parent_subindex_id,
        mc.title,
        mc.summary,
        mc.content,
        mc.metadata,
        mc.related_conversations,
        mc.related_contexts,
        mc.tags,
        mc.importance,
        mc.last_accessed,
        mc.access_count,
        mc.created_at,
        mc.updated_at,
        a.agent_name
      FROM memory_contexts mc
      JOIN ai_agents a ON a.id = mc.agent_id
      ${where}
      ORDER BY mc.importance DESC, mc.updated_at DESC
      LIMIT $${params.length}::integer;`;

    const contexts = await sql(query, params);

    return Response.json({ contexts: contexts || [] });
  } catch (error) {
    console.error("GET /api/admin/memory-contexts error", error);
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
    const agent_name = normalizeText(body?.agent_name);

    // We'll allow posting agent_id directly too, but agent_name is easiest for humans.
    const agent_id = normalizeNullableText(body?.agent_id);

    const context_name = normalizeText(body?.context_name);
    const context_type = normalizeText(body?.context_type) || "knowledge";
    const parent_index_id = normalizeNullableText(body?.parent_index_id);
    const parent_subindex_id = normalizeNullableText(body?.parent_subindex_id);

    const title = normalizeText(body?.title);
    const summary = normalizeNullableText(body?.summary);
    const content = normalizeNullableText(body?.content);

    const metadata =
      body?.metadata && typeof body.metadata === "object" ? body.metadata : {};
    const related_conversations = safeUuidArray(body?.related_conversations);
    const related_contexts = safeUuidArray(body?.related_contexts);
    const tags = safeTextArray(body?.tags);

    const importance = normalizeImportance(body?.importance);

    if (!title || !context_name) {
      return Response.json(
        { error: "title and context_name are required" },
        { status: 400 },
      );
    }

    if (!agent_name && !agent_id) {
      return Response.json(
        { error: "agent_name (or agent_id) is required" },
        { status: 400 },
      );
    }

    const query = `WITH agent AS (
        SELECT id
        FROM ai_agents
        WHERE ($1::text IS NOT NULL AND LOWER(agent_name) = LOWER($1::text))
           OR ($2::uuid IS NOT NULL AND id = $2::uuid)
        LIMIT 1
      )
      INSERT INTO memory_contexts (
        agent_id,
        context_name,
        context_type,
        parent_index_id,
        parent_subindex_id,
        title,
        summary,
        content,
        metadata,
        related_conversations,
        related_contexts,
        tags,
        importance
      )
      SELECT
        (SELECT id FROM agent),
        $3::text,
        $4::text,
        $5::uuid,
        $6::uuid,
        $7::text,
        $8::text,
        $9::text,
        $10::jsonb,
        $11::uuid[],
        $12::uuid[],
        $13::text[],
        $14::integer
      WHERE (SELECT id FROM agent) IS NOT NULL
      ON CONFLICT (agent_id, context_name)
      DO UPDATE SET
        context_type = EXCLUDED.context_type,
        parent_index_id = EXCLUDED.parent_index_id,
        parent_subindex_id = EXCLUDED.parent_subindex_id,
        title = EXCLUDED.title,
        summary = EXCLUDED.summary,
        content = EXCLUDED.content,
        metadata = EXCLUDED.metadata,
        related_conversations = EXCLUDED.related_conversations,
        related_contexts = EXCLUDED.related_contexts,
        tags = EXCLUDED.tags,
        importance = EXCLUDED.importance,
        updated_at = now()
      RETURNING id;`;

    const result = await sql(query, [
      agent_name || null,
      agent_id,
      context_name,
      context_type,
      parent_index_id,
      parent_subindex_id,
      title,
      summary,
      content,
      JSON.stringify(metadata),
      related_conversations,
      related_contexts,
      tags,
      importance,
    ]);

    if (!result?.length) {
      return Response.json(
        { error: "Agent not found (check agent_name)" },
        { status: 400 },
      );
    }

    return Response.json({ ok: true, id: result[0].id });
  } catch (error) {
    console.error("POST /api/admin/memory-contexts error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
