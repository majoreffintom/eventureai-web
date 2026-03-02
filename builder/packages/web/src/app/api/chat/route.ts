import { NextRequest } from "next/server";
import { createAnthropicClient } from "@eventureai/builder-llm";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  console.log("📨 Received chat request");
  try {
    const { messages, context } = await req.json();
    const client = createAnthropicClient();

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        console.log("🟢 Starting SSE stream");

        try {
          // Simple streaming response
          const response = await client.createMessage(messages, {
            systemPrompt: "You are a helpful AI assistant.",
          });

          // Send the response
          const content = response.content
            .filter((block: any) => block.type === "text")
            .map((block: any) => block.text)
            .join("");

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "delta", text: content })}\n\n`));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("❌ Chat error:", error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: (error as Error).message })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("💥 Critical error in chat route:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
