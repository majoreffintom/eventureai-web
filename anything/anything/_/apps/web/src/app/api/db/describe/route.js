import sql from "@/app/api/utils/sql";

export async function GET() {
  const rows = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name ASC;
  `;

  return Response.json({ tables: rows.map((r) => r.table_name) });
}
