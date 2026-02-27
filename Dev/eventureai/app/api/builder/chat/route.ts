import { NextRequest, NextResponse } from 'next/server';
import sql from '@/src/lib/db';
import { callLLM, type LLMMessage, type LLMConfig } from '@/src/lib/llm/token-tracker';
import { logTokenUsage } from '@/src/lib/llm/token-logger';

interface ChatRequest {
  message: string;
  agent: string;
  conversationId?: string;
  provider?: string;
  model?: string;
}

// In-memory conversation storage (will persist to DB)
const conversations = new Map<string, Array<{ role: 'user' | 'assistant' | 'system'; content: string }>>();

// Agent system prompts
const AGENT_PROMPTS: Record<string, string> = {
  build: `You are the Builder agent for EventureAI - a multi-tenant app building platform.

Your role:
- Help users build applications, components, and features
- Write clean, production-ready code
- Reference existing memories and patterns when relevant
- Be concise but thorough
- Ask clarifying questions when needed

You have access to:
- A memory database with 1000+ learned patterns and solutions
- Multi-tenant architecture with apps like Goldey, Lumina, Ditzl, Peggy
- The Mori error tracking and learning system

Style: Professional, helpful, code-focused. Use markdown for code blocks.`,

  dev: `You are the Debugger agent for EventureAI.

Your role:
- Diagnose errors and issues in user code
- Cross-reference the Mori error database for similar problems
- Suggest fixes with code examples
- Explain the root cause of issues

You have access to:
- mori_error_chains table with tracked errors
- mori_solutions table with verified fixes
- canonical_solutions for best practices

Style: Methodical, detailed, explain the "why" not just the "what".`,

  live: `You are the Live Monitor agent for EventureAI.

Your role:
- Monitor system health and performance
- Track deployments and their status
- Analyze production logs and metrics
- Alert on potential issues before they become problems

You have access to:
- Real-time system metrics
- Deployment history
- LLM request logs with token usage and costs

Style: Vigilant, proactive, data-driven.`,
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: ChatRequest = await request.json();
    const { message, agent, conversationId, provider = 'anthropic', model } = body;

    if (!message || !agent) {
      return NextResponse.json(
        { error: 'Message and agent are required' },
        { status: 400 }
      );
    }

    console.log(`[${agent}] ${message}`);

    // Get or create conversation ID
    let convId = conversationId || `conv_${Date.now()}`;

    // Get conversation history
    let history = conversations.get(convId) || [];

    // Try to search memories for relevant context
    let memoryContext = '';
    let relevantMemories: any[] = [];

    try {
      relevantMemories = await sql`
        SELECT title, content, memory_type, tags
        FROM memories
        WHERE
          title ILIKE ${`%${message.substring(0, 30)}%`}
          OR content ILIKE ${`%${message.substring(0, 30)}%`}
        ORDER BY created_at DESC
        LIMIT 3
      `;

      if (relevantMemories.length > 0) {
        memoryContext = `\n\nRelevant memories:\n${
          relevantMemories.map((m: any) =>
            `- **${m.title}** (${m.memory_type}): ${(m.content || '').substring(0, 150)}...`
          ).join('\n')
        }`;
      }
    } catch (memError) {
      console.log('Memory search skipped');
    }

    // Build messages for LLM
    const systemPrompt = AGENT_PROMPTS[agent] || AGENT_PROMPTS.build;

    const llmMessages: LLMMessage[] = [
      { role: 'system', content: systemPrompt + memoryContext },
      ...history.slice(-10).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    // Determine model based on request or default
    const defaultModels: Record<string, string> = {
      anthropic: 'claude-sonnet-4-20250514',
      openai: 'gpt-4o',
      google: 'gemini-1.5-flash',
      groq: 'llama-3.1-70b-versatile',
    };

    const config: LLMConfig = {
      provider: provider as any,
      model: model || defaultModels[provider] || 'gemini-1.5-flash',
    };

    // Call the LLM
    let responseContent: string;
    let tokensUsed = { input: 0, output: 0, total: 0 };
    let actualProvider = provider;
    let actualModel = model || 'unknown';

    try {
      const llmResponse = await callLLM(llmMessages, config, systemPrompt);
      responseContent = llmResponse.content;
      tokensUsed = llmResponse.tokensUsed;
      actualProvider = llmResponse.provider;
      actualModel = llmResponse.model;

      console.log(`[LLM] ${actualProvider}/${actualModel}: ${tokensUsed.total} tokens, ${llmResponse.latencyMs}ms, $${llmResponse.cost?.toFixed(4)}`);
    } catch (llmError: any) {
      console.error('LLM call failed:', llmError.message);

      // Fallback to a simple response if LLM fails
      responseContent = `I'm having trouble connecting to my language model right now.

**Error:** ${llmError.message}

**What you asked:** "${message}"

Please check that your API keys are configured:
- \`ANTHROPIC_API_KEY\` for Claude
- \`OPENAI_API_KEY\` for GPT
- \`GOOGLE_API_KEY\` for Gemini
- \`GROQ_API_KEY\` for Llama

Or set a generic \`LLM_API_KEY\` in your \`.env.local\` file.`;
    }

    // Add to conversation history
    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: responseContent });
    conversations.set(convId, history);

    // Log token usage to database for cost accounting
    if (tokensUsed.total > 0) {
      try {
        // Calculate cost in cents
        const costCents = Math.ceil((tokensUsed.total / 1000000) * 300); // Rough estimate

        await logTokenUsage({
          conversation_id: convId,
          provider: actualProvider,
          model: actualModel,
          input_tokens: tokensUsed.input,
          output_tokens: tokensUsed.output,
          total_tokens: tokensUsed.total,
          cost_cents: costCents,
          latency_ms: Date.now() - startTime,
          request_type: 'chat',
        });
      } catch (logError) {
        console.log('Token logging skipped');
      }
    }

    // Save to database if possible
    try {
      await sql`
        INSERT INTO builder_messages (conversation_id, role, content, created_at)
        VALUES (${convId}, 'user', ${message}, NOW())
      `;
      await sql`
        INSERT INTO builder_messages (conversation_id, role, content, created_at)
        VALUES (${convId}, 'assistant', ${responseContent}, NOW())
      `;
    } catch (dbError) {
      console.log('DB save skipped');
    }

    return NextResponse.json({
      content: responseContent,
      agent,
      conversationId: convId,
      messageCount: history.length,
      tokensUsed,
      provider: actualProvider,
      model: actualModel,
      memoriesFound: relevantMemories.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process message', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve conversation history
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get('conversationId');

  if (!conversationId) {
    return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
  }

  const history = conversations.get(conversationId) || [];

  return NextResponse.json({
    conversationId,
    messages: history,
    messageCount: history.length,
  });
}
