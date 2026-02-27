import sql from "@/app/api/utils/sql";
import { requireSession, isSafeIntegrationEndpoint } from "../utils";

export async function GET() {
  try {
    const { userId } = await requireSession();

    // If not signed in: show only public agents.
    if (!userId) {
      const agents = await sql`
        SELECT id, owner_user_id, name, description, system_prompt, llm_endpoint, is_public, created_at, updated_at
        FROM tournament_agents
        WHERE is_public = true
        ORDER BY updated_at DESC
        LIMIT 200
      `;

      return Response.json({ agents });
    }

    const agents = await sql`
      SELECT id, owner_user_id, name, description, system_prompt, llm_endpoint, is_public, created_at, updated_at
      FROM tournament_agents
      WHERE owner_user_id = ${userId} OR is_public = true
      ORDER BY updated_at DESC
      LIMIT 200
    `;

    return Response.json({ agents });
  } catch (error) {
    console.error("Tournament agents GET error:", error);
    return Response.json({ error: "Failed to load agents" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId } = await requireSession();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    const description =
      typeof body?.description === "string" ? body.description.trim() : null;

    const systemPrompt =
      typeof body?.system_prompt === "string"
        ? body.system_prompt.trim()
        : null;

    const llmEndpointRaw =
      typeof body?.llm_endpoint === "string" ? body.llm_endpoint.trim() : "";

    const llmEndpoint =
      llmEndpointRaw || "/integrations/chat-gpt/conversationgpt4";

    if (!isSafeIntegrationEndpoint(llmEndpoint)) {
      return Response.json(
        {
          error:
            "Invalid llm_endpoint. Only Anything /integrations/* endpoints are allowed.",
        },
        { status: 400 },
      );
    }

    const isPublic = Boolean(body?.is_public);

    const [agent] = await sql`
      INSERT INTO tournament_agents (
        owner_user_id,
        name,
        description,
        system_prompt,
        llm_endpoint,
        is_public,
        created_at,
        updated_at
      ) VALUES (
        ${userId},
        ${name},
        ${description},
        ${systemPrompt},
        ${llmEndpoint},
        ${isPublic},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING id, owner_user_id, name, description, system_prompt, llm_endpoint, is_public, created_at, updated_at
    `;

    return Response.json({ agent });
  } catch (error) {
    console.error("Tournament agents POST error:", error);
    return Response.json({ error: "Failed to create agent" }, { status: 500 });
  }
}
