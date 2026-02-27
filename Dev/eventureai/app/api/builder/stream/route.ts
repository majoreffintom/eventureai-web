import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

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

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const client = new Anthropic({ apiKey });

    const systemPrompt = AGENT_PROMPTS[agent] || AGENT_PROMPTS.build;

    // Build messages for Claude
    const messages: Anthropic.Messages.MessageParam[] = [
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

        const response = await client.messages.stream({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: systemPrompt,
          messages,
        });

        for await (const event of response) {
          if (event.type === 'content_block_delta' && 'delta' in event) {
            const delta = event.delta as { type?: string; text?: string };
            if (delta.type === 'text_delta' && delta.text) {
              await writer.write(
                encoder.encode(`data: ${JSON.stringify({ type: 'delta', text: delta.text })}\n\n`)
              );
            }
          } else if (event.type === 'message_start') {
            await writer.write(
              encoder.encode(`data: ${JSON.stringify({ type: 'message_start' })}\n\n`)
            );
          } else if (event.type === 'message_stop') {
            await writer.write(
              encoder.encode(`data: ${JSON.stringify({ type: 'message_stop' })}\n\n`)
            );
          }
        }

        const finalMessage = await response.finalMessage();

        await writer.write(
          encoder.encode(
            JSON.stringify({
              data: JSON.stringify({
                type: 'done',
                usage: finalMessage.usage,
                stopReason: finalMessage.stop_reason,
              }),
            }) + '\n\n'
          )
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
