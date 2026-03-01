import { NextRequest } from "next/server";
import { createSwarm } from "@eventureai/builder-llm";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  console.log("📨 Received chat request");
  try {
    const { messages, context } = await req.json();
    const swarm = createSwarm();
    
    const encoder = new TextEncoder();
    
    // We create a promise that resolves when the stream is finished
    let streamDone: (value: void | PromiseLike<void>) => void;
    const streamFinished = new Promise<void>((resolve) => {
      streamDone = resolve;
    });

    const stream = new ReadableStream({
      async start(controller) {
        console.log("🟢 Starting SSE stream");
        
        try {
          await swarm.chatStream(messages, {
            context,
            eventHandler: (event) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            },
            callbacks: {
              onContentBlockDelta: (index, text) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "delta", text })}\n\n`));
              },
              onToolUse: (name, id, input) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "tool_call", toolName: name, toolUseId: id, input })}\n\n`));
              },
              onToolResult: (toolUseId, result) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "tool_result", toolUseId, result })}\n\n`));
              },
              onMessageStop: () => {
                console.log("🏁 Stream complete");
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
                streamDone();
              },
              onError: (error) => {
                console.error("❌ Swarm callback error:", error);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: error.message })}\n\n`));
                controller.close();
                streamDone();
              }
            }
          });
        } catch (error) {
          console.error("❌ Swarm execution error:", error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: (error as Error).message })}\n\n`));
          controller.close();
          streamDone();
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
