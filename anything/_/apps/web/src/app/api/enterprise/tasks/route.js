import sql from "@/app/api/utils/sql";
import { requireSession } from "@/app/api/tournament/utils";

function safeStr(v) {
  return typeof v === "string" ? v : "";
}

function clampEnum(value, allowed, fallback) {
  if (!value) return fallback;
  return allowed.includes(value) ? value : fallback;
}

export async function GET(request) {
  try {
    const { userId } = await requireSession();
    if (!userId) {
      return Response.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const url = new URL(request.url);
    const appKey = safeStr(url.searchParams.get("app_key") || "").toLowerCase();
    const status = safeStr(url.searchParams.get("status") || "").toLowerCase();
    const limitRaw = Number(url.searchParams.get("limit") || 200);

    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(limitRaw, 500))
      : 200;

    const conditions = [];
    const values = [];

    if (appKey) {
      values.push(appKey);
      conditions.push(`t.app_key = $${values.length}`);
    }

    if (status) {
      values.push(status);
      conditions.push(`t.status = $${values.length}`);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const query = `
      SELECT
        t.id,
        t.app_key,
        a.name AS app_name,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.tags,
        t.metadata,
        t.created_at,
        t.updated_at,
        t.source_thread_id,
        t.source_turn_id
      FROM enterprise_app_tasks t
      JOIN enterprise_apps a ON a.key = t.app_key
      ${whereClause}
      ORDER BY
        CASE t.status
          WHEN 'blocked' THEN 0
          WHEN 'in_progress' THEN 1
          WHEN 'todo' THEN 2
          WHEN 'done' THEN 3
          ELSE 9
        END,
        CASE t.priority
          WHEN 'critical' THEN 0
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
          ELSE 9
        END,
        t.created_at DESC
      LIMIT $${values.length + 1}
    `;

    values.push(limit);

    const tasks = await sql(query, values);

    return Response.json({ ok: true, tasks });
  } catch (e) {
    console.error("/api/enterprise/tasks GET error:", e);
    return Response.json(
      { ok: false, error: e?.message || "Failed to list tasks" },
      { status: 500 },
    );
  }
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

    const appKey = safeStr(body?.app_key || body?.appKey || "").toLowerCase();
    const title = safeStr(body?.title || "");
    const description = safeStr(body?.description || "");
    const status = clampEnum(
      safeStr(body?.status || "").toLowerCase(),
      ["todo", "in_progress", "blocked", "done"],
      "todo",
    );
    const priority = clampEnum(
      safeStr(body?.priority || "").toLowerCase(),
      ["low", "medium", "high", "critical"],
      "medium",
    );

    if (!appKey) {
      return Response.json(
        { ok: false, error: "Missing app_key" },
        { status: 400 },
      );
    }

    if (!title.trim()) {
      return Response.json(
        { ok: false, error: "Missing title" },
        { status: 400 },
      );
    }

    const [row] = await sql`
      INSERT INTO enterprise_app_tasks (
        app_key,
        title,
        description,
        status,
        priority,
        created_by_user_id
      ) VALUES (
        ${appKey},
        ${title.trim()},
        ${description || null},
        ${status},
        ${priority},
        ${userId}
      )
      RETURNING id
    `;

    return Response.json({ ok: true, id: row?.id || null });
  } catch (e) {
    console.error("/api/enterprise/tasks POST error:", e);
    return Response.json(
      { ok: false, error: e?.message || "Failed to create task" },
      { status: 500 },
    );
  }
}
