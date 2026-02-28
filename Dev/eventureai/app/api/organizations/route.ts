import { NextResponse } from 'next/server';
import sql from '@/src/lib/db';

export async function GET() {
  try {
    const result = await sql`SELECT * FROM organizations ORDER BY created_at ASC`;
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, slug } = await request.json();
    const result = await sql`
      INSERT INTO organizations (name, slug, is_public) VALUES (${name}, ${slug}, false) RETURNING *
    `;
    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
