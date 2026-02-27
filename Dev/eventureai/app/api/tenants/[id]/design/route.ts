import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { designId } = await request.json();
    const { id } = params;

    const result = await pool.query(
      'UPDATE tenants SET design_id = $1 WHERE id = $2 RETURNING *',
      [designId, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
