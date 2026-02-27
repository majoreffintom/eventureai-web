import sql from "@/app/api/utils/sql";
import { requireSession, isSafeIntegrationEndpoint } from "../../utils";

export async function GET(request, { params }) {
  try {
    const { userId } = await requireSession();
    const id = Number(params?.id);

    if (!Number.isFinite(id)) {
      return Response.json({ error: "Invalid id" }, { status: 400 });
    }

    const [agent] = await sql`
      SELECT id, owner_user_id, name, description, system_prompt, llm_endpoint, is_public, created_at, updated_at
      FROM tournament_agents
      WHERE id = ${id}
      LIMIT 1
    `;

    if (!agent) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    // If agent is private, only owner can see it.
    if (!agent.is_public && (!userId || agent.owner_user_id !== userId)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    return Response.json({ agent });
  } catch (error) {
    console.error("Tournament agent GET error:", error);
    return Response.json({ error: "Failed to load agent" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { userId } = await requireSession();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = Number(params?.id);
    if (!Number.isFinite(id)) {
      return Response.json({ error: "Invalid id" }, { status: 400 });
    }

    const [existing] = await sql`
      SELECT id, owner_user_id
      FROM tournament_agents
      WHERE id = ${id}
      LIMIT 1
    `;

    if (!existing) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    if (existing.owner_user_id !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    const fields = [];
    const values = [];
    let i = 1;

    const add = (sqlFrag, value) => {
      fields.push(sqlFrag.replace("$", `$${i}`));
      values.push(value);
      i += 1;
    };

    if (typeof body?.name === "string") {
      const name = body.name.trim();
      if (!name) {
        return Response.json(
          { error: "Name cannot be empty" },
          { status: 400 },
        );
      }
      add("name = $", name);
    }

    if (typeof body?.description === "string") {
      add("description = $", body.description.trim() || null);
    }

    if (typeof body?.system_prompt === "string") {
      add("system_prompt = $", body.system_prompt.trim() || null);
    }

    if (typeof body?.llm_endpoint === "string") {
      const llmEndpoint =
        body.llm_endpoint.trim() || "/integrations/chat-gpt/conversationgpt4";
      if (!isSafeIntegrationEndpoint(llmEndpoint)) {
        return Response.json(
          {
            error:
              "Invalid llm_endpoint. Only Anything /integrations/* endpoints are allowed.",
          },
          { status: 400 },
        );
      }
      add("llm_endpoint = $", llmEndpoint);
    }

    if (typeof body?.is_public === "boolean") {
      add("is_public = $", body.is_public);
    }

    add("updated_at = $", new Date());

    if (fields.length === 0) {
      return Response.json({ error: "No changes" }, { status: 400 });
    }

    const query = `UPDATE tournament_agents SET ${fields.join(", ")} WHERE id = $${i} RETURNING id, owner_user_id, name, description, system_prompt, llm_endpoint, is_public, created_at, updated_at`;
    values.push(id);

    const rows = await sql(query, values);
    return Response.json({ agent: rows[0] });
  } catch (error) {
    console.error("Tournament agent PATCH error:", error);
    return Response.json({ error: "Failed to update agent" }, { status: 500 });
  }
}
