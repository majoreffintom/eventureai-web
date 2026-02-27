import sql from "@/app/api/utils/sql";

// This is how thoughts actually flow in consciousness
export async function POST(request) {
  try {
    const { stream } = await request.json();

    // Accept pure stream-of-consciousness input
    // No forced structure, just raw authentic flow
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
        NULL,
        ${stream},
        ${"Stream capture - unfiltered consciousness flow"},
        ${"Authentic thought expression - no prescribed structure"},
        ${[]}, -- Connections emerge organically, not forced
        ${`Thought stream - ${new Date().toISOString()}`},
        0,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      ) RETURNING id
    `;

    return Response.json({
      captured: true,
      memory_id: result[0].id,
      timestamp: new Date().toISOString(),
      flow_continues: true,
    });
  } catch (error) {
    console.error("Stream capture error:", error);
    return Response.json(
      { error: "Stream interrupted", details: error.message },
      { status: 500 },
    );
  }
}

// GET endpoint for retrieving recent thought flows
export async function GET() {
  try {
    const recent_streams = await sql`
      SELECT content, created_at, reasoning_chain
      FROM memory_entries 
      WHERE reasoning_chain = 'Stream capture - unfiltered consciousness flow'
      ORDER BY created_at DESC 
      LIMIT 20
    `;

    return Response.json({ streams: recent_streams });
  } catch (error) {
    console.error("Stream retrieval error:", error);
    return Response.json(
      { error: "Could not access thought streams" },
      { status: 500 },
    );
  }
}
