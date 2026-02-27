import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM organizations ORDER BY created_at ASC');
    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, slug } = await request.json();
    const result = await pool.query(
      'INSERT INTO organizations (name, slug, is_public) VALUES ($1, $2, $3) RETURNING *',
      [name, slug, false]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
