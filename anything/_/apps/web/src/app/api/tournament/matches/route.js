import sql from "@/app/api/utils/sql";
import { requireSession, callIntegrationLLM } from "../utils";

function safeStr(value) {
  return typeof value === "string" ? value : "";
}

function buildTrainingContext(docs) {
  if (!Array.isArray(docs) || docs.length === 0)
    return "(No training docs attached)";

  const lines = docs.slice(0, 8).map((d, idx) => {
    const title = d?.title ? `Title: ${d.title}` : "(untitled)";
    const notes = d?.notes ? `Notes: ${d.notes}` : null;
    const url = d?.file_url ? `File: ${d.file_url}` : null;
    const parts = [title, notes, url].filter(Boolean).join(" | ");
    return `${idx + 1}. ${parts}`;
  });

  return lines.join("\n");
}

async function generateAgentAnswer({ agent, questionPrompt, trainingDocs }) {
  const systemPrompt = safeStr(agent?.system_prompt);
  const trainingContext = buildTrainingContext(trainingDocs);

  const finalSystemPrompt = [
    "You are a specialized agent participating in a head-to-head evaluation tournament.",
    "Your job: answer the user's question with high quality and high correctness.",
    "Be direct. If you assume something, say so.",
    systemPrompt ? `\nAGENT STYLE / RULES:\n${systemPrompt}` : null,
    `\nTRAINING DOCS (metadata + notes only):\n${trainingContext}`,
  ]
    .filter(Boolean)
    .join("\n");

  const jsonSchema = {
    name: "tournament_agent_answer",
    schema: {
      type: "object",
      properties: {
        response: { type: "string" },
        confidence: { type: "integer" },
      },
      required: ["response"],
      additionalProperties: false,
    },
  };

  const result = await callIntegrationLLM({
    endpoint: agent?.llm_endpoint,
    messages: [
      { role: "system", content: finalSystemPrompt },
      { role: "user", content: questionPrompt },
    ],
    jsonSchema,
  });

  return {
    response: safeStr(result?.response),
    confidence: Number.isFinite(Number(result?.confidence))
      ? Number(result?.confidence)
      : null,
  };
}

async function judgeMatch({
  questionPrompt,
  agentA,
  agentB,
  answerA,
  answerB,
}) {
  const judgeSystemPrompt = [
    "You are the judge for a head-to-head agent tournament.",
    "You will receive a question and two agent answers.",
    "Pick the better answer based on correctness, completeness, clarity, and usefulness.",
    "Return a winner and a short verdict.",
  ].join("\n");

  const judgeUserPrompt = [
    `QUESTION:\n${questionPrompt}`,
    `\nAGENT A (${agentA.name}):\n${answerA}`,
    `\nAGENT B (${agentB.name}):\n${answerB}`,
  ].join("\n\n");

  const jsonSchema = {
    name: "tournament_verdict",
    schema: {
      type: "object",
      properties: {
        winner: { type: "string", enum: ["A", "B", "TIE"] },
        verdict_summary: { type: "string" },
        reasoning: { type: "string" },
        memory_capture: {
          type: "object",
          properties: {
            content: { type: "string" },
            cross_domain_connections: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["content"],
          additionalProperties: false,
        },
      },
      required: ["winner", "verdict_summary", "reasoning", "memory_capture"],
      additionalProperties: false,
    },
  };

  const result = await callIntegrationLLM({
    endpoint: "/integrations/chat-gpt/conversationgpt4",
    messages: [
      { role: "system", content: judgeSystemPrompt },
      { role: "user", content: judgeUserPrompt },
    ],
    jsonSchema,
  });

  return {
    winner: result?.winner,
    verdict_summary: safeStr(result?.verdict_summary),
    reasoning: safeStr(result?.reasoning),
    memory_capture: result?.memory_capture || null,
  };
}

export async function GET() {
  try {
    const { userId } = await requireSession();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const matches = await sql`
      SELECT m.id, m.question_id, m.created_by_user_id, m.agent_a_id, m.agent_b_id, m.status, m.winner_agent_id, m.verdict, m.memory_entry_id, m.created_at, m.completed_at,
        qa.prompt as question_prompt,
        a.name as agent_a_name,
        b.name as agent_b_name,
        w.name as winner_name
      FROM tournament_matches m
      LEFT JOIN tournament_questions qa ON qa.id = m.question_id
      LEFT JOIN tournament_agents a ON a.id = m.agent_a_id
      LEFT JOIN tournament_agents b ON b.id = m.agent_b_id
      LEFT JOIN tournament_agents w ON w.id = m.winner_agent_id
      WHERE m.created_by_user_id = ${userId}
      ORDER BY m.created_at DESC
      LIMIT 30
    `;

    return Response.json({ matches });
  } catch (error) {
    console.error("Tournament matches GET error:", error);
    return Response.json({ error: "Failed to load matches" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId } = await requireSession();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const agentAId = Number(body?.agent_a_id);
    const agentBId = Number(body?.agent_b_id);
    const questionPrompt = safeStr(body?.prompt).trim();

    if (!Number.isFinite(agentAId) || !Number.isFinite(agentBId)) {
      return Response.json(
        { error: "agent_a_id and agent_b_id are required" },
        { status: 400 },
      );
    }

    if (!questionPrompt) {
      return Response.json({ error: "prompt is required" }, { status: 400 });
    }

    if (agentAId === agentBId) {
      return Response.json(
        { error: "Pick two different agents" },
        { status: 400 },
      );
    }

    const [agentA] = await sql`
      SELECT id, owner_user_id, name, system_prompt, llm_endpoint, is_public
      FROM tournament_agents
      WHERE id = ${agentAId}
      LIMIT 1
    `;

    const [agentB] = await sql`
      SELECT id, owner_user_id, name, system_prompt, llm_endpoint, is_public
      FROM tournament_agents
      WHERE id = ${agentBId}
      LIMIT 1
    `;

    if (!agentA || !agentB) {
      return Response.json({ error: "Agent not found" }, { status: 404 });
    }

    // Only allow the user to run matches with agents they own OR public agents.
    const canUseAgentA = agentA.is_public || agentA.owner_user_id === userId;
    const canUseAgentB = agentB.is_public || agentB.owner_user_id === userId;

    if (!canUseAgentA || !canUseAgentB) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const [question] = await sql`
      INSERT INTO tournament_questions (created_by_user_id, prompt, context, created_at)
      VALUES (${userId}, ${questionPrompt}, '{}'::jsonb, CURRENT_TIMESTAMP)
      RETURNING id
    `;

    const [match] = await sql`
      INSERT INTO tournament_matches (
        question_id,
        created_by_user_id,
        agent_a_id,
        agent_b_id,
        status,
        created_at
      ) VALUES (
        ${question.id},
        ${userId},
        ${agentAId},
        ${agentBId},
        'running',
        CURRENT_TIMESTAMP
      )
      RETURNING id
    `;

    const docsA = await sql`
      SELECT title, file_url, notes
      FROM tournament_agent_training_docs
      WHERE agent_id = ${agentAId}
      ORDER BY created_at DESC
      LIMIT 8
    `;

    const docsB = await sql`
      SELECT title, file_url, notes
      FROM tournament_agent_training_docs
      WHERE agent_id = ${agentBId}
      ORDER BY created_at DESC
      LIMIT 8
    `;

    // Generate answers
    const agentAResult = await generateAgentAnswer({
      agent: agentA,
      questionPrompt,
      trainingDocs: docsA,
    });

    const agentBResult = await generateAgentAnswer({
      agent: agentB,
      questionPrompt,
      trainingDocs: docsB,
    });

    await sql`
      INSERT INTO tournament_match_responses (match_id, agent_id, response_text, created_at)
      VALUES
        (${match.id}, ${agentAId}, ${agentAResult.response}, CURRENT_TIMESTAMP),
        (${match.id}, ${agentBId}, ${agentBResult.response}, CURRENT_TIMESTAMP)
    `;

    const verdict = await judgeMatch({
      questionPrompt,
      agentA,
      agentB,
      answerA: agentAResult.response,
      answerB: agentBResult.response,
    });

    let winnerAgentId = null;
    if (verdict.winner === "A") winnerAgentId = agentAId;
    if (verdict.winner === "B") winnerAgentId = agentBId;

    // Capture to memory_entries (so it shows up in your Memory system)
    const memoryContent = verdict?.memory_capture?.content
      ? verdict.memory_capture.content
      : `Tournament verdict: ${verdict.winner}. ${verdict.verdict_summary}`;

    const connections = Array.isArray(
      verdict?.memory_capture?.cross_domain_connections,
    )
      ? verdict.memory_capture.cross_domain_connections
      : ["tournament", "verdict", "agents"];

    const [memory] = await sql`
      INSERT INTO memory_entries (
        sub_index_cluster_id,
        content,
        reasoning_chain,
        user_intent_analysis,
        cross_domain_connections,
        usage_frequency,
        session_context,
        created_at,
        accessed_at
      ) VALUES (
        NULL,
        ${memoryContent},
        ${"Memory Tournament verdict"},
        ${`Q: ${questionPrompt.slice(0, 200)}`},
        ${connections},
        0,
        ${"Memory Tournament"},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING id
    `;

    const verdictPayload = {
      winner: verdict.winner,
      verdict_summary: verdict.verdict_summary,
      reasoning: verdict.reasoning,
      question_prompt: questionPrompt,
      agent_a: {
        id: agentAId,
        name: agentA.name,
        confidence: agentAResult.confidence,
      },
      agent_b: {
        id: agentBId,
        name: agentB.name,
        confidence: agentBResult.confidence,
      },
    };

    const [updated] = await sql`
      UPDATE tournament_matches
      SET status = 'completed',
          winner_agent_id = ${winnerAgentId},
          verdict = ${JSON.stringify(verdictPayload)},
          memory_entry_id = ${memory.id},
          completed_at = CURRENT_TIMESTAMP
      WHERE id = ${match.id}
      RETURNING id, status, winner_agent_id, verdict, memory_entry_id, completed_at
    `;

    return Response.json({
      match: {
        id: match.id,
        ...updated,
        question_prompt: questionPrompt,
        agent_a_response: agentAResult.response,
        agent_b_response: agentBResult.response,
      },
    });
  } catch (error) {
    console.error("Tournament matches POST error:", error);

    // Best-effort: don't leave matches stuck in 'running'
    try {
      const body = await request.json();
      const maybeMatchId = Number(body?.match_id);
      if (Number.isFinite(maybeMatchId)) {
        await sql`UPDATE tournament_matches SET status = 'error' WHERE id = ${maybeMatchId}`;
      }
    } catch {
      // ignore
    }

    return Response.json(
      { error: "Failed to run match", details: error.message },
      { status: 500 },
    );
  }
}
