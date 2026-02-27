import sql from "@/app/api/utils/sql";

export async function GET() {
  const schemas = await sql`
    SELECT schema_name
    FROM information_schema.schemata
    ORDER BY schema_name;
  `;

  const tables = await sql`
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_type = 'BASE TABLE'
    ORDER BY table_schema, table_name;
  `;

  return Response.json({
    schemas: schemas.map((s) => s.schema_name),
    tables,
  });
}
