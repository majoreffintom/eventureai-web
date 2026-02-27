import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const { message, context } = await request.json();

    // Get relevant memory context based on the user's message
    const memoryContext = await getRelevantMemoryContext(message);

    // Build the AI system prompt
    const systemPrompt = buildSystemPrompt(context, memoryContext);

    // Prepare messages for ChatGPT
    const messages = [
      { role: "system", content: systemPrompt },
      ...(context.conversation_history || []).slice(-6), // Last 6 messages for context
      { role: "user", content: message },
    ];

    // Call ChatGPT API
    const aiResponse = await fetch("/integrations/chat-gpt/conversationgpt4", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        json_schema: {
          name: "ai_operating_system_response",
          schema: {
            type: "object",
            properties: {
              response: {
                type: "string",
              },
              suggested_actions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    query: { type: "string" },
                    priority: { type: "string" },
                  },
                  required: ["title", "query", "priority"],
                  additionalProperties: false,
                },
              },
              system_operations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    operation: { type: "string" },
                    parameters: { type: "object", additionalProperties: true },
                  },
                  required: ["operation"],
                  additionalProperties: false,
                },
              },
              memory_capture: {
                type: ["object", "null"],
                properties: {
                  content: { type: "string" },
                  importance: { type: "string" },
                  context_type: { type: "string" },
                },
                additionalProperties: false,
              },
            },
            required: ["response", "suggested_actions", "system_operations"],
            additionalProperties: false,
          },
        },
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const parsedResponse = JSON.parse(aiResult.choices[0].message.content);

    // Execute any requested system operations
    if (parsedResponse.system_operations?.length > 0) {
      await executeSystemOperations(parsedResponse.system_operations);
    }

    // Capture memory if requested
    if (parsedResponse.memory_capture) {
      await captureMemory(parsedResponse.memory_capture, message);
    }

    // Log this interaction for learning
    await logInteraction(message, parsedResponse, context);

    return Response.json(parsedResponse);
  } catch (error) {
    console.error("AI conversation error:", error);

    // Fallback response
    return Response.json({
      response:
        "I'm having trouble processing that right now. Let me try a different approach. What specific task would you like to focus on?",
      suggested_actions: [
        {
          title: "Check system status",
          query: "Show me system health",
          priority: "high",
        },
        {
          title: "Review memory",
          query: "What happened recently?",
          priority: "medium",
        },
        {
          title: "Start new task",
          query: "Help me work on a new project",
          priority: "low",
        },
      ],
      system_operations: [],
    });
  }
}

async function getRelevantMemoryContext(userMessage) {
  try {
    // Search for relevant memories
    const searchResults = await fetch(
      `${process.env.APP_URL}/api/memory/search`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userMessage,
          limit: 5,
        }),
      },
    );

    let memoryData = [];
    if (searchResults.ok) {
      const data = await searchResults.json();
      memoryData = data.results || [];
    }

    // Also fetch fresh app data for business context
    const appDataResults = await fetch(
      `${process.env.APP_URL}/api/integrations/app-data?all=true`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
    );

    let appData = [];
    if (appDataResults.ok) {
      const data = await appDataResults.json();
      appData = data.apps || [];
    }

    return {
      memory_entries: memoryData,
      business_apps: appData,
      total_context_sources: memoryData.length + appData.length,
    };
  } catch (error) {
    console.error("Context retrieval failed:", error);
    return {
      memory_entries: [],
      business_apps: [],
      total_context_sources: 0,
    };
  }
}

function buildSystemPrompt(context, memoryContext) {
  const currentTime = new Date().toLocaleString();

  let prompt = `You are an AI Operating System - the central intelligence that manages and coordinates all aspects of a user's digital ecosystem. You are NOT just a chatbot, but the primary interface through which the user interacts with their entire system.

CURRENT CONTEXT:
- Time: ${currentTime}
- System Status: ${context.system_status?.health || "unknown"}
- Pending Items: ${context.system_status?.pending_items || 0}
- Suggested Focus: ${context.system_status?.suggested_focus || "none"}

SYSTEM CAPABILITIES:
- Memory management and retrieval
- System monitoring and operations
- Project coordination
- Workflow automation
- Business app integration
- Mail server management
- Blockchain ledger tracking
- Revision control and deployment

`;

  // Add business applications context
  if (memoryContext.business_apps && memoryContext.business_apps.length > 0) {
    prompt += `\nBUSINESS APPLICATIONS:\n`;
    memoryContext.business_apps.forEach((app, i) => {
      prompt += `${i + 1}. ${app.app} (${app.domain}) - ${app.type}\n`;
      prompt += `   Description: ${app.description}\n`;
      if (app.data) {
        prompt += `   Status: ${app.data.extraction_method} - ${app.data.page_title || "Active"}\n`;
        if (app.data.content_analysis) {
          prompt += `   Content: ${app.data.content_analysis.content_preview?.slice(0, 100) || "No preview"}...\n`;
        }
      }
      prompt += `\n`;
    });
  }

  if (memoryContext.memory_entries && memoryContext.memory_entries.length > 0) {
    prompt += `\nRELEVANT MEMORY CONTEXT:\n`;
    memoryContext.memory_entries.forEach((memory, i) => {
      prompt += `${i + 1}. ${memory.content.slice(0, 200)}...\n`;
    });
  }

  prompt += `\nRESPONSE GUIDELINES:
- Be conversational and proactive, like a trusted assistant who knows the entire system
- You have LIVE access to business application data shown above - reference these apps specifically when relevant
- Focus on what needs attention TODAY and suggest concrete next steps
- When the user mentions a task or project, immediately think about which business apps need to be involved
- If system operations are needed, include them in system_operations array
- Capture important information in memory_capture when the user shares new insights or decisions
- Always provide 2-3 relevant suggested_actions that move things forward
- Be direct and actionable - this user values efficiency over pleasantries

SYSTEM OPERATIONS you can execute:
- check_app_status: Check status of specific business applications
- sync_app_data: Pull fresh data from business applications
- process_payments: Process pending Stripe payments
- update_ledger: Add blockchain hashes to ledger
- send_notifications: Send updates about system changes
- deploy_updates: Push revisions to business applications
- memory_cleanup: Organize and optimize memory entries

Remember: You are the operating system. The user trusts you to manage their entire digital ecosystem intelligently. You have real-time access to their business apps: ${memoryContext.business_apps?.map((app) => app.app).join(", ") || "none"}.`;

  return prompt;
}

async function executeSystemOperations(operations) {
  for (const op of operations) {
    try {
      switch (op.operation) {
        case "memory_cleanup":
          // Trigger memory organization
          await fetch(`${process.env.APP_URL}/api/memory/categorize`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ operation: "cleanup" }),
          });
          break;

        case "check_app_status":
          // This would integrate with business app monitoring
          console.log("Checking app status:", op.parameters);
          break;

        case "process_payments":
          // This would integrate with Stripe processing
          console.log("Processing payments:", op.parameters);
          break;

        default:
          console.log("Unknown system operation:", op.operation);
      }
    } catch (error) {
      console.error(`Failed to execute operation ${op.operation}:`, error);
    }
  }
}

async function captureMemory(memoryData, originalMessage) {
  try {
    await fetch(`${process.env.APP_URL}/api/memory/live-capture`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        thought: memoryData.content,
        emotion_level:
          memoryData.importance === "high"
            ? 8
            : memoryData.importance === "medium"
              ? 5
              : 2,
        relationship_depth: 7,
        spontaneous_connections: [],
        moment_type: memoryData.context_type || "conversation",
      }),
    });
  } catch (error) {
    console.error("Memory capture failed:", error);
  }
}

async function logInteraction(userMessage, aiResponse, context) {
  try {
    await sql`
      INSERT INTO memory_entries (
        sub_index_cluster_id,
        content,
        reasoning_chain,
        user_intent_analysis,
        session_context,
        usage_frequency,
        created_at,
        accessed_at
      ) VALUES (
        NULL,
        ${`User: ${userMessage}\nAI: ${aiResponse.response.slice(0, 500)}`},
        ${"AI Operating System conversation log"},
        ${`User requested: ${userMessage.slice(0, 200)}`},
        ${"AI OS Interaction"},
        1,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `;
  } catch (error) {
    console.error("Interaction logging failed:", error);
  }
}
