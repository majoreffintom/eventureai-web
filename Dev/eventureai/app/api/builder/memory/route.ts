import { NextRequest, NextResponse } from 'next/server';
import sql from '@/src/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (query) {
      // Search memories using full-text search
      const memories = await sql`
        SELECT
          id,
          title,
          content,
          memory_type,
          tags,
          domain,
          summary,
          created_at
        FROM memories
        WHERE
          search_tsv @@ plainto_tsquery('english', ${query})
          OR title ILIKE ${`%${query}%`}
          OR content ILIKE ${`%${query}%`}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;

      return NextResponse.json({ memories, query });
    }

    // List recent memories
    const memories = await sql`
      SELECT
        id,
        title,
        content,
        memory_type,
        tags,
        domain,
        summary,
        created_at
      FROM memories
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    // Get total count
    const [{ count }] = await sql`
      SELECT COUNT(*) as count FROM memories
    `;

    return NextResponse.json({ memories, total: count });
  } catch (error) {
    console.error('Memory search error:', error);
    return NextResponse.json(
      { error: 'Failed to search memories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      content,
      memory_type = 'note',
      tags = [],
      domain,
      summary,
      user_id,
      workspace_id,
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const [memory] = await sql`
      INSERT INTO memories (
        title,
        content,
        memory_type,
        tags,
        domain,
        summary,
        user_id,
        workspace_id,
        created_at,
        updated_at
      ) VALUES (
        ${title},
        ${content},
        ${memory_type},
        ${tags},
        ${domain},
        ${summary},
        ${user_id || null},
        ${workspace_id || null},
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    return NextResponse.json({ memory });
  } catch (error) {
    console.error('Memory creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create memory' },
      { status: 500 }
    );
  }
}
