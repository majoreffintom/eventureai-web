import { NextRequest, NextResponse } from 'next/server';
import sql from '@/src/lib/db';
import { createMoriGateway } from '@/lib/gateway';

interface TournamentRequest {
  prompt: string;
  models: string[];
  debateMode?: boolean;
  rounds?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: TournamentRequest = await request.json();
    const { prompt, models, debateMode = false, rounds = 1 } = body;

    if (!prompt || !models || models.length === 0) {
      return NextResponse.json(
        { error: 'Prompt and at least one model are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.MORI_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
    }

    const gateway = createMoriGateway({
      apiKey,
      baseUrl: process.env.MORI_GATEWAY_URL,
    });

    // Run models in parallel
    const responses = await Promise.all(
      models.map(async (model) => {
        try {
          const startTime = Date.now();
          // For the tournament, we'll use a standard non-streaming call if available, 
          // but since MoriGatewayClient only has chatStream, we'll collect the result.
          let content = "";
          await gateway.chatStream(
            {
              messages: [{ role: 'user', content: prompt }],
              model: model,
            },
            {
              onDelta: (text) => { content += text; }
            }
          );
          
          return {
            model,
            content,
            duration: Date.now() - startTime,
            status: 'success'
          };
        } catch (err: any) {
          return {
            model,
            content: `Error: ${err.message}`,
            duration: 0,
            status: 'error'
          };
        }
      })
    );

    // Try to save to DB if tables exist, but don't fail if they don't
    try {
      const [tournament] = await sql`
        INSERT INTO llm_tournaments (prompt, models_used, debate_mode, status)
        VALUES (${prompt}, ${models}, ${debateMode}, 'completed')
        RETURNING id
      `;
      
      // Save responses
      for (const resp of responses) {
        await sql`
          INSERT INTO llm_responses (tournament_id, model_name, content, metadata)
          VALUES (${tournament.id}, ${resp.model}, ${resp.content}, ${JSON.stringify({ duration: resp.duration, status: resp.status })})
        `;
      }
      
      return NextResponse.json({ tournamentId: tournament.id, responses });
    } catch (dbErr) {
      console.warn("DB Save failed (tables might be missing):", dbErr);
      return NextResponse.json({ responses, warning: "Results not saved to persistent storage." });
    }
  } catch (error: any) {
    console.error('Tournament execution error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute tournament' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('id');

    if (tournamentId) {
      const tournaments = await sql`SELECT * FROM llm_tournaments WHERE id = ${tournamentId}`;
      if (tournaments.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      
      const responses = await sql`SELECT * FROM llm_responses WHERE tournament_id = ${tournamentId}`;
      return NextResponse.json({ tournament: tournaments[0], responses });
    }

    const tournaments = await sql`SELECT * FROM llm_tournaments ORDER BY created_at DESC LIMIT 20`;
    return NextResponse.json({ tournaments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
