import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(_request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = params?.id;
    if (!id) {
      return Response.json({ error: "Missing id" }, { status: 400 });
    }

    const rows = await sql(
      "SELECT id, title, doc_url, doc_mime_type, notes, fields, created_at, updated_at FROM public.eventureai_documents WHERE id = $1 AND user_id = $2 LIMIT 1",
      [id, session.user.id],
    );

    const doc = rows?.[0];
    if (!doc) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json({ success: true, document: doc });
  } catch (error) {
    console.error("GET /api/eventureai/documents/[id] error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = params?.id;
    if (!id) {
      return Response.json({ error: "Missing id" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { title, docUrl, docMimeType, notes, fields } = body;

    const setClauses = [];
    const values = [];
    let i = 1;

    if (typeof title === "string") {
      setClauses.push(`title = $${i++}`);
      values.push(title.trim());
    }

    if (typeof docUrl === "string" || docUrl === null) {
      setClauses.push(`doc_url = $${i++}`);
      values.push(docUrl);
    }

    if (typeof docMimeType === "string" || docMimeType === null) {
      setClauses.push(`doc_mime_type = $${i++}`);
      values.push(docMimeType);
    }

    if (typeof notes === "string" || notes === null) {
      setClauses.push(`notes = $${i++}`);
      values.push(notes);
    }

    if (typeof fields === "object") {
      setClauses.push(`fields = $${i++}::jsonb`);
      values.push(JSON.stringify(fields || {}));
    }

    // always update updated_at
    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

    if (setClauses.length === 1) {
      return Response.json({ error: "No changes provided" }, { status: 400 });
    }

    values.push(id);
    values.push(session.user.id);

    const query = `UPDATE public.eventureai_documents SET ${setClauses.join(", ")} WHERE id = $${i++} AND user_id = $${i++} RETURNING id, title, doc_url, doc_mime_type, notes, fields, created_at, updated_at`;

    const rows = await sql(query, values);
    const doc = rows?.[0];
    if (!doc) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json({ success: true, document: doc });
  } catch (error) {
    console.error("PUT /api/eventureai/documents/[id] error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = params?.id;
    if (!id) {
      return Response.json({ error: "Missing id" }, { status: 400 });
    }

    const rows = await sql(
      "DELETE FROM public.eventureai_documents WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, session.user.id],
    );

    if (!rows?.[0]?.id) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/eventureai/documents/[id] error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
