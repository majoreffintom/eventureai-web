import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const count = Number(body?.count || 25);
    const topic = body?.topic || "Finishing app setup and automation";

    const now = new Date();
    const inserts = [];

    for (let i = 0; i < count; i++) {
      const userMsg = `User: Focus on ${topic}. Step ${i + 1} of ${count}.`;
      const aiMsg = `AI: Acknowledged. Executing step ${i + 1}. Capturing progress and syncing apps.`;
      const content = `${userMsg}\n${aiMsg}`;

      inserts.push(sql`
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
          ${content},
          ${"AI Operating System conversation log"},
          ${`Intent: ${topic}`},
          ${"AI OS Interaction"},
          1,
          ${now},
          ${now}
        )
      `);
    }

    await sql.transaction(inserts);

    const [{ total }] = await sql`
      SELECT COUNT(*)::int as total
      FROM memory_entries 
      WHERE session_context ILIKE '%AI OS Interaction%'
         OR reasoning_chain = 'AI Operating System conversation log'
    `;

    return Response.json({
      success: true,
      inserted: count,
      total_conversation_memories: total,
      message: `Seeded ${count} conversation memories`,
    });
  } catch (error) {
    console.error("Conversation seed error:", error);
    return Response.json(
      { error: "Failed to seed conversations", details: error.message },
      { status: 500 },
    );
  }
}
