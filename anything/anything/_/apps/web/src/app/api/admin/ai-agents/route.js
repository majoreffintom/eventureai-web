import sql from "@/app/api/utils/sql";
import requireAdmin from "@/app/api/utils/requireAdmin.js";

export async function GET(request) {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) {
      return guard.response;
    }

    const agents = await sql(
      `SELECT id, agent_name, agent_type, agent_location, base44_url, home_app_name, profile_image_url, ethics_code_id,
              is_active, can_post_to_lumina, created_at, updated_at
       FROM ai_agents
       ORDER BY LOWER(agent_name) ASC`,
    );

    return Response.json({ agents: agents || [] });
  } catch (error) {
    console.error("GET /api/admin/ai-agents error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
