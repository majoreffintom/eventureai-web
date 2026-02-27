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
    return null;
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
    return null;
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

function normalizeImportance(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return Math.max(1, Math.min(10, Math.trunc(parsed)));
}

export async function PATCH(request, { params }) {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) {
      return guard.response;
    }

    const id = params?.id;
    if (!id) {
      return Response.json({ error: "Missing id" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);

    const allowed = {
      context_name: normalizeNullableText(body?.context_name),
      context_type: normalizeNullableText(body?.context_type),
      parent_index_id: normalizeNullableText(body?.parent_index_id),
      parent_subindex_id: normalizeNullableText(body?.parent_subindex_id),
      title: normalizeNullableText(body?.title),
      summary: normalizeNullableText(body?.summary),
      content: normalizeNullableText(body?.content),
      tags: safeTextArray(body?.tags),
      related_conversations: safeUuidArray(body?.related_conversations),
      related_contexts: safeUuidArray(body?.related_contexts),
      importance: normalizeImportance(body?.importance),
      metadata:
        body?.metadata && typeof body.metadata === "object"
          ? body.metadata
          : null,
    };

    const sets = [];
    const values = [];

    const pushSet = (sqlFragment, value) => {
      values.push(value);
      sets.push(sqlFragment.replace("$?", `$${values.length}`));
    };

    if (allowed.context_name !== null) {
      pushSet("context_name = $?::text", allowed.context_name);
    }
    if (allowed.context_type !== null) {
      pushSet("context_type = $?::text", allowed.context_type);
    }
    if (allowed.parent_index_id !== null) {
      pushSet("parent_index_id = $?::uuid", allowed.parent_index_id);
    }
    if (allowed.parent_subindex_id !== null) {
      pushSet("parent_subindex_id = $?::uuid", allowed.parent_subindex_id);
    }
    if (allowed.title !== null) {
      pushSet("title = $?::text", allowed.title);
    }
    if (allowed.summary !== null) {
      pushSet("summary = $?::text", allowed.summary);
    }
    if (allowed.content !== null) {
      pushSet("content = $?::text", allowed.content);
    }
    if (allowed.tags !== null) {
      pushSet("tags = $?::text[]", allowed.tags);
    }
    if (allowed.related_conversations !== null) {
      pushSet(
        "related_conversations = $?::uuid[]",
        allowed.related_conversations,
      );
    }
    if (allowed.related_contexts !== null) {
      pushSet("related_contexts = $?::uuid[]", allowed.related_contexts);
    }
    if (allowed.importance !== null) {
      pushSet("importance = $?::integer", allowed.importance);
    }
    if (allowed.metadata !== null) {
      pushSet("metadata = $?::jsonb", JSON.stringify(allowed.metadata));
    }

    if (!sets.length) {
      return Response.json(
        { error: "No updatable fields provided" },
        { status: 400 },
      );
    }

    values.push(id);
    const idPos = `$${values.length}`;

    const query = `UPDATE memory_contexts
      SET ${sets.join(", ")}, updated_at = now()
      WHERE id = ${idPos}::uuid
      RETURNING id;`;

    const updated = await sql(query, values);

    if (!updated?.length) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json({ ok: true, id: updated[0].id });
  } catch (error) {
    console.error("PATCH /api/admin/memory-contexts/[id] error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) {
      return guard.response;
    }

    const id = params?.id;
    if (!id) {
      return Response.json({ error: "Missing id" }, { status: 400 });
    }

    const deleted = await sql(
      "DELETE FROM memory_contexts WHERE id = $1::uuid RETURNING id",
      [id],
    );

    if (!deleted?.length) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json({ ok: true, id: deleted[0].id });
  } catch (error) {
    console.error("DELETE /api/admin/memory-contexts/[id] error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
