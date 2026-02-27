import sql from "@/app/api/utils/sql";

// Automatically capture and categorize conversation memories
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      content,
      user_query,
      session_context,
      conversation_turn,
      auto_capture = true,
    } = body;

    if (!content) {
      return Response.json({ error: "Content is required" }, { status: 400 });
    }

    // Step 1: Auto-categorize the content
    const categorizeResponse = await fetch(
      `${process.env.APP_URL}/api/memory/categorize`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          user_query,
          session_context: session_context || "Automated conversation capture",
        }),
      },
    );

    if (!categorizeResponse.ok) {
      throw new Error("Auto-categorization failed");
    }

    const categorization = await categorizeResponse.json();

    // Step 2: Store the memory with automatic metadata
    const [entry] = await sql`
      INSERT INTO memory_entries (
        sub_index_cluster_id,
        content,
        reasoning_chain,
        user_intent_analysis,
        cross_domain_connections,
        session_context,
        usage_frequency
      ) VALUES (
        ${categorization.recommended_cluster.id},
        ${content},
        ${categorization.analysis.reasoning},
        ${user_query || "Automated capture"},
        ${categorization.analysis.semantic_keywords},
        ${session_context || "Auto-captured from conversation"},
        1
      )
      RETURNING *
    `;

    // Step 3: Log the auto-capture for debugging
    await sql`
      INSERT INTO query_patterns (
        query_intent,
        navigation_path,
        success_metric,
        optimization_notes
      ) VALUES (
        ${"auto-capture: " + (user_query || "conversation memory")},
        ${[categorization.recommended_category.id, categorization.recommended_cluster.id]},
        ${categorization.analysis.confidence_level},
        ${"Automatically captured during conversation turn " + (conversation_turn || "unknown")}
      )
    `;

    return Response.json({
      success: true,
      memory_id: entry.id,
      category: categorization.recommended_category.name,
      cluster: categorization.recommended_cluster.cluster_name,
      confidence: categorization.analysis.confidence_level,
      created_new_cluster: categorization.created_new_cluster,
      semantic_keywords: categorization.analysis.semantic_keywords,
      auto_capture: true,
    });
  } catch (error) {
    console.error("Auto-capture error:", error);
    return Response.json(
      {
        error: "Auto-capture failed",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
