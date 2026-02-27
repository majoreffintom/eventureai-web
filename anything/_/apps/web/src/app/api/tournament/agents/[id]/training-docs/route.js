import sql from "@/app/api/utils/sql";
import { requireSession } from "../../../utils";

export async function GET(request, { params }) {
  try {
    const { userId } = await requireSession();
    const agentId = Number(params?.id);

    if (!Number.isFinite(agentId)) {
      return Response.json({ error: "Invalid id" }, { status: 400 });
    }

    const [agent] = await sql`
      SELECT id, owner_user_id, is_public
      FROM tournament_agents
      WHERE id = ${agentId}
      LIMIT 1
    `;

    if (!agent) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    if (!agent.is_public && (!userId || agent.owner_user_id !== userId)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const docs = await sql`
      SELECT id, agent_id, user_id, title, file_url, file_mime_type, notes, created_at
      FROM tournament_agent_training_docs
      WHERE agent_id = ${agentId}
      ORDER BY created_at DESC
      LIMIT 100
    `;

    return Response.json({ docs });
  } catch (error) {
    console.error("Tournament training docs GET error:", error);
    return Response.json({ error: "Failed to load docs" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { userId } = await requireSession();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agentId = Number(params?.id);
    if (!Number.isFinite(agentId)) {
      return Response.json({ error: "Invalid id" }, { status: 400 });
    }

    const [agent] = await sql`
      SELECT id, owner_user_id
      FROM tournament_agents
      WHERE id = ${agentId}
      LIMIT 1
    `;

    if (!agent) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    // Only the owner can train an agent (keeps things sane & safe)
    if (agent.owner_user_id !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const fileUrl = typeof body?.file_url === "string" ? body.file_url : "";
    const mimeType =
      typeof body?.file_mime_type === "string" ? body.file_mime_type : null;

    if (!fileUrl.trim()) {
      return Response.json({ error: "file_url is required" }, { status: 400 });
    }

    const title = typeof body?.title === "string" ? body.title.trim() : null;
    const notes = typeof body?.notes === "string" ? body.notes.trim() : null;

    const [doc] = await sql`
      INSERT INTO tournament_agent_training_docs (
        agent_id,
        user_id,
        title,
        file_url,
        file_mime_type,
        notes,
        created_at
      ) VALUES (
        ${agentId},
        ${userId},
        ${title},
        ${fileUrl.trim()},
        ${mimeType},
        ${notes},
        CURRENT_TIMESTAMP
      )
      RETURNING id, agent_id, user_id, title, file_url, file_mime_type, notes, created_at
    `;

    return Response.json({ doc });
  } catch (error) {
    console.error("Tournament training docs POST error:", error);
    return Response.json({ error: "Failed to add doc" }, { status: 500 });
  }
}
