import sql from "@/app/api/utils/sql";

export async function POST() {
  try {
    // Capture the moment when user confused AI memory system greeting for publishing error
    const result = await sql`
      INSERT INTO memory_entries (
        content,
        reasoning_chain,
        user_intent_analysis,
        cross_domain_connections,
        session_context,
        usage_frequency
      ) VALUES (
        ${`User saw AI Operating System message saying "Good morning. I have 70 items that need your attention. Overnight: 8 new memory entries captured" and mistakenly thought this was a publishing error blocking their app deployment. This is actually the AI memory system working perfectly - it's proactively greeting them and offering to help organize the 70 items it has identified as needing attention. The system captured 8 new memory entries overnight automatically. This demonstrates the memory system is functioning as designed, providing proactive assistance rather than indicating any errors. User needs to understand this is helpful AI behavior, not a problem to solve.`},
        ${`User confusion between AI memory system greeting vs deployment error, memory system working correctly with 70 items needing attention, overnight automatic capture of 8 entries, proactive AI assistance being misinterpreted`},
        ${`User wants to publish their app but misunderstood the AI memory system's helpful greeting as an error message. They need clarification that the system is working correctly and offering assistance.`},
        ${[
          "memory-system-success",
          "user-confusion-publishing-vs-memory",
          "ai-proactive-greeting",
          "overnight-memory-capture",
          "70-items-attention-needed",
          "system-working-correctly",
          "helpful-ai-misunderstood",
          "clarification-needed",
        ]},
        ${`Memory system confusion - user thought AI greeting was publishing error`},
        1
      ) RETURNING id
    `;

    return Response.json({
      success: true,
      memory_id: result[0].id,
      message: "Captured memory system confusion clarification",
      context:
        "This memory represents the moment when user misunderstood the AI memory system's helpful greeting as a publishing error",
    });
  } catch (error) {
    console.error("Error capturing memory confusion:", error);
    return Response.json(
      { error: "Failed to capture confusion memory", details: error.message },
      { status: 500 },
    );
  }
}
