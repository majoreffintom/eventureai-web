import sql from "@/app/api/utils/sql";
import { requireSession } from "@/app/api/tournament/utils";

function safeStr(v) {
  return typeof v === "string" ? v : "";
}

function clampEnum(value, allowed, fallback) {
  if (!value) return fallback;
  return allowed.includes(value) ? value : fallback;
}

export async function PATCH(request, { params: { id } }) {
  try {
    const { userId } = await requireSession();
    if (!userId) {
      return Response.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const taskId = Number(id);
    if (!Number.isFinite(taskId)) {
      return Response.json(
        { ok: false, error: "Invalid task id" },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => ({}));

    const title = safeStr(body?.title || "");
    const description = safeStr(body?.description || "");

    const statusRaw = safeStr(body?.status || "").toLowerCase();
    const priorityRaw = safeStr(body?.priority || "").toLowerCase();

    const status = statusRaw
      ? clampEnum(statusRaw, ["todo", "in_progress", "blocked", "done"], null)
      : null;

    const priority = priorityRaw
      ? clampEnum(priorityRaw, ["low", "medium", "high", "critical"], null)
      : null;

    const setParts = [];
    const values = [];

    if (title.trim()) {
      values.push(title.trim());
      setParts.push(`title = $${values.length}`);
    }

    if (description) {
      values.push(description);
      setParts.push(`description = $${values.length}`);
    }

    if (status) {
      values.push(status);
      setParts.push(`status = $${values.length}`);
    }

    if (priority) {
      values.push(priority);
      setParts.push(`priority = $${values.length}`);
    }

    if (setParts.length === 0) {
      return Response.json(
        { ok: false, error: "No fields to update" },
        { status: 400 },
      );
    }

    values.push(taskId);

    const query = `
      UPDATE enterprise_app_tasks
      SET ${setParts.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${values.length}
      RETURNING id
    `;

    const rows = await sql(query, values);

    if (!rows?.length) {
      return Response.json(
        { ok: false, error: "Task not found" },
        { status: 404 },
      );
    }

    return Response.json({ ok: true });
  } catch (e) {
    console.error("/api/enterprise/tasks/[id] PATCH error:", e);
    return Response.json(
      { ok: false, error: e?.message || "Failed to update task" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params: { id } }) {
  try {
    const { userId } = await requireSession();
    if (!userId) {
      return Response.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const taskId = Number(id);
    if (!Number.isFinite(taskId)) {
      return Response.json(
        { ok: false, error: "Invalid task id" },
        { status: 400 },
      );
    }

    const rows =
      await sql`DELETE FROM enterprise_app_tasks WHERE id = ${taskId} RETURNING id`;

    if (!rows?.length) {
      return Response.json(
        { ok: false, error: "Task not found" },
        { status: 404 },
      );
    }

    return Response.json({ ok: true });
  } catch (e) {
    console.error("/api/enterprise/tasks/[id] DELETE error:", e);
    return Response.json(
      { ok: false, error: e?.message || "Failed to delete task" },
      { status: 500 },
    );
  }
}
