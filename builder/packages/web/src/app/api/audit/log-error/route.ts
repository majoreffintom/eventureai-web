import { NextRequest } from "next/server";
import { getSQL, createErrorChain } from "@eventureai/builder-llm";

export async function POST(req: NextRequest) {
  try {
    const { elementId, error, stack, componentStack } = await req.json();
    const sql = getSQL();

    console.error(`🚨 IMPERATIVE LIVE AUDIT: Component ${elementId} crashed!`);
    console.error(`Error: ${error}`);

    // Log the error chain to the database
    const chain = await createErrorChain(sql, {
      title: `Render Crash: ${elementId}`,
      description: error,
      errorCode: "RENDER_CRASH",
      severity: "critical",
      context: { elementId, stack, componentStack },
      tags: ["imperative-live", "audit", elementId]
    });

    return new Response(JSON.stringify({ success: true, chainId: chain.id }), { status: 200 });
  } catch (err) {
    console.error("Audit logging failed:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
