import { NextRequest, NextResponse } from 'next/server';
import sql from '@/src/lib/db';

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

    // Create tournament record
    const [tournament] = await sql`
      INSERT INTO llm_tournaments (
        prompt,
        models_used,
        debate_mode,
        rounds,
        status,
        created_at
      ) VALUES (
        ${prompt},
        ${models},
        ${debateMode},
        ${rounds},
        'pending',
        NOW()
      )
      RETURNING id, prompt, models_used, debate_mode, rounds, status, created_at
    `;

    // TODO: Trigger actual LLM calls via tournament service
    // For now, return the tournament with pending status
    return NextResponse.json({
      tournament,
      message: 'Tournament created. LLM integration pending.',
    });
  } catch (error) {
    console.error('Tournament creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create tournament' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('id');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (tournamentId) {
      const [tournament] = await sql`
        SELECT * FROM llm_tournaments WHERE id = ${tournamentId}
      `;

      if (!tournament) {
        return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
      }

      const responses = await sql`
        SELECT * FROM llm_responses WHERE tournament_id = ${tournamentId}
      `;

      return NextResponse.json({ tournament, responses });
    }

    // List recent tournaments
    const tournaments = await sql`
      SELECT * FROM llm_tournaments
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return NextResponse.json({ tournaments });
  } catch (error) {
    console.error('Tournament fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournaments' },
      { status: 500 }
    );
  }
}
