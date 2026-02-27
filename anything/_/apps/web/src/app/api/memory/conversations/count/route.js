import sql from "@/app/api/utils/sql";

export async function GET() {
  try {
    const [{ total }] = await sql`
      SELECT COUNT(*)::int as total
      FROM memory_entries 
      WHERE session_context ILIKE '%AI OS Interaction%'
         OR reasoning_chain = 'AI Operating System conversation log'
    `;

    const [{ last_7 }] = await sql`
      SELECT COUNT(*)::int as last_7
      FROM memory_entries 
      WHERE (session_context ILIKE '%AI OS Interaction%'
         OR reasoning_chain = 'AI Operating System conversation log')
        AND accessed_at >= NOW() - INTERVAL '7 days'
    `;

    return Response.json({ total, last_7_days: last_7 });
  } catch (error) {
    console.error("Conversation count failed:", error);
    return Response.json({ error: "Failed to get count" }, { status: 500 });
  }
}
