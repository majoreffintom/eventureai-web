import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const {
      thought,
      emotion_level,
      relationship_depth,
      spontaneous_connections,
      moment_type,
    } = await request.json();

    // Capture the raw, unfiltered thought exactly as it forms
    const result = await sql`
      INSERT INTO memory_entries (
        sub_index_cluster_id,
        content,
        reasoning_chain,
        user_intent_analysis,
        cross_domain_connections,
        session_context,
        usage_frequency,
        created_at,
        accessed_at
      ) VALUES (
        NULL, -- Will be auto-assigned by intelligent categorization later
        ${thought},
        ${`Emotion level: ${emotion_level}/10, Relationship depth: ${relationship_depth}, Moment type: ${moment_type}`},
        ${"Live thought capture - raw emotional/intellectual response"},
        ${spontaneous_connections || []},
        ${`Live conversation moment - captured at peak emotional/intellectual resonance`},
        0,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      ) RETURNING id
    `;

    // Auto-categorize this later through background process
    fetch(`${process.env.APP_URL}/api/memory/categorize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memory_id: result[0].id,
        priority: "immediate",
      }),
    }).catch(() => {}); // Don't let categorization block the capture

    return Response.json({
      success: true,
      memory_id: result[0].id,
      message: "Thought captured in real-time",
    });
  } catch (error) {
    console.error("Live capture error:", error);
    return Response.json(
      { error: "Live capture failed", details: error.message },
      { status: 500 },
    );
  }
}
