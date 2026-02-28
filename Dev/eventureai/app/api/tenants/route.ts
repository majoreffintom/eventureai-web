import { NextResponse } from 'next/server';
import sql from '@/src/lib/db';

export async function GET() {
  try {
    const result = await sql`SELECT * FROM tenants ORDER BY created_at ASC`;
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
