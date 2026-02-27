import sql from "@/app/api/utils/sql";
import { requireSession } from "../../utils";

export async function GET(request, { params }) {
  try {
    const { userId } = await requireSession();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = Number(params?.id);
    if (!Number.isFinite(id)) {
      return Response.json({ error: "Invalid id" }, { status: 400 });
    }

    const [match] = await sql`
      SELECT m.id, m.question_id, m.created_by_user_id, m.agent_a_id, m.agent_b_id, m.status, m.winner_agent_id, m.verdict, m.memory_entry_id, m.created_at, m.completed_at,
        q.prompt as question_prompt,
        a.name as agent_a_name,
        b.name as agent_b_name,
        w.name as winner_name
      FROM tournament_matches m
      LEFT JOIN tournament_questions q ON q.id = m.question_id
      LEFT JOIN tournament_agents a ON a.id = m.agent_a_id
      LEFT JOIN tournament_agents b ON b.id = m.agent_b_id
      LEFT JOIN tournament_agents w ON w.id = m.winner_agent_id
      WHERE m.id = ${id}
      LIMIT 1
    `;

    if (!match) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    if (match.created_by_user_id !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const responses = await sql`
      SELECT agent_id, response_text, created_at
      FROM tournament_match_responses
      WHERE match_id = ${id}
      ORDER BY created_at ASC
    `;

    return Response.json({ match, responses });
  } catch (error) {
    console.error("Tournament match GET error:", error);
    return Response.json({ error: "Failed to load match" }, { status: 500 });
  }
}
