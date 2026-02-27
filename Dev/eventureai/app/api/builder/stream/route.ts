import { NextRequest } from 'next/server';
import { createMoriGateway } from '@/lib/gateway';

// Agent system prompts
const AGENT_PROMPTS: Record<string, string> = {
  build: `You are the Builder agent for EventureAI - a multi-tenant app building platform.

Your role:
- Help users build applications, components, and features
- Write clean, production-ready code
- Reference existing memories and patterns when relevant
- Be concise but thorough
- Ask clarifying questions when needed

Style: Professional, helpful, code-focused. Use markdown for code blocks.`,

  dev: `You are the Debugger agent for EventureAI.

Your role:
- Diagnose errors and issues in user code
- Suggest fixes with code examples
- Explain the root cause of issues

Style: Methodical, detailed, explain the "why" not just the "what".`,

  live: `You are the Live Monitor agent for EventureAI.

Your role:
- Monitor system health and performance
- Track deployments and their status
- Analyze production logs and metrics
- Alert on potential issues before they become problems

Style: Vigilant, proactive, data-driven.`,
};

interface StreamRequest {
  message: string;
  agent: string;
  conversationId?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: StreamRequest = await request.json();
    const { message, agent, conversationHistory = [] } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Support both Mori API keys and direct Anthropic keys
    const apiKey = process.env.MORI_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'MORI_API_KEY or ANTHROPIC_API_KEY not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const gateway = createMoriGateway({
      apiKey,
      baseUrl: process.env.MORI_GATEWAY_URL,
      defaultModel: 'claude-sonnet-4-20250514',
    });

    const systemPrompt = AGENT_PROMPTS[agent] || AGENT_PROMPTS.build;

    // Build messages
    const messages = [
      ...conversationHistory.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ];

    // Create a TransformStream for SSE
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start streaming in background
    (async () => {
      try {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'start', agent })}\n\n`));

        const response = await gateway.chatStream(
          {
            messages,
            system: systemPrompt,
            max_tokens: 4096,
          },
          {
            onStart: (messageId, model) => {
              writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'message_start', messageId, model })}\n\n`));
            },
            onDelta: (text) => {
              writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'delta', text })}\n\n`));
            },
            onComplete: (finalResponse) => {
              writer.write(encoder.encode(`data: ${JSON.stringify({
                type: 'done',
                usage: finalResponse.usage,
              })}\n\n`));
            },
            onError: (error) => {
              writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`));
            },
          }
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`));
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
