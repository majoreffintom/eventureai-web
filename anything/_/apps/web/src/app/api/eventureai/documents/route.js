import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await sql(
      "SELECT id, title, doc_url, doc_mime_type, notes, fields, created_at, updated_at FROM public.eventureai_documents WHERE user_id = $1 ORDER BY created_at DESC LIMIT 200",
      [session.user.id],
    );

    return Response.json({ success: true, documents: rows });
  } catch (error) {
    console.error("GET /api/eventureai/documents error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { title, docUrl, docMimeType, notes = null, fields = {} } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return Response.json({ error: "Title is required" }, { status: 400 });
    }

    const inserted = await sql(
      "INSERT INTO public.eventureai_documents (user_id, title, doc_url, doc_mime_type, notes, fields) VALUES ($1, $2, $3, $4, $5, $6::jsonb) RETURNING id, title, doc_url, doc_mime_type, notes, fields, created_at, updated_at",
      [
        session.user.id,
        title.trim(),
        docUrl || null,
        docMimeType || null,
        notes,
        JSON.stringify(fields || {}),
      ],
    );

    return Response.json({ success: true, document: inserted?.[0] || null });
  } catch (error) {
    console.error("POST /api/eventureai/documents error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
