import { NextResponse } from 'next/server';
import sql from '@/src/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { designId } = await request.json();
    const { id } = params;

    const result = await sql`
      UPDATE tenants SET design_id = ${designId} WHERE id = ${id} RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
