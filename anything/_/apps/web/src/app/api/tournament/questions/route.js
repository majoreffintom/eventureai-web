import sql from "@/app/api/utils/sql";
import { requireSession } from "../utils";

export async function GET() {
  try {
    const { userId } = await requireSession();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const questions = await sql`
      SELECT id, created_by_user_id, prompt, context, created_at
      FROM tournament_questions
      WHERE created_by_user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 100
    `;

    return Response.json({ questions });
  } catch (error) {
    console.error("Tournament questions GET error:", error);
    return Response.json(
      { error: "Failed to load questions" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const { userId } = await requireSession();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt) {
      return Response.json({ error: "prompt is required" }, { status: 400 });
    }

    const context =
      body?.context && typeof body.context === "object" ? body.context : {};

    const [question] = await sql`
      INSERT INTO tournament_questions (created_by_user_id, prompt, context, created_at)
      VALUES (${userId}, ${prompt}, ${JSON.stringify(context)}, CURRENT_TIMESTAMP)
      RETURNING id, created_by_user_id, prompt, context, created_at
    `;

    return Response.json({ question });
  } catch (error) {
    console.error("Tournament questions POST error:", error);
    return Response.json(
      { error: "Failed to create question" },
      { status: 500 },
    );
  }
}
