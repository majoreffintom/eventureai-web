import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const body = await request.json();

    const [entry] = await sql`
      INSERT INTO memory_entries (
        sub_index_cluster_id, content, reasoning_chain, user_intent_analysis, 
        cross_domain_connections, session_context
      ) VALUES (
        1, ${body.content}, ${body.reasoning_chain}, ${body.user_intent_analysis},
        ${body.cross_domain_connections || []}, ${body.session_context}
      )
      RETURNING *
    `;

    return Response.json({
      success: true,
      entry: entry,
    });
  } catch (error) {
    console.error("Error capturing memory:", error);
    return Response.json(
      { error: "Failed to capture memory", details: error.message },
      { status: 500 },
    );
  }
}
