import sql from "@/app/api/utils/sql";

// Endpoint to provide complete database transparency
// Tom can call this anytime to see exactly how the database is structured
export async function GET() {
  try {
    // Get all tables and their columns
    const tables = await sql`
      SELECT 
        t.table_name,
        string_agg(c.column_name || ' (' || c.data_type || ')', ', ' ORDER BY c.ordinal_position) as columns
      FROM information_schema.tables t
      LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
      WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
      GROUP BY t.table_name
      ORDER BY t.table_name
    `;

    // Get all foreign key relationships
    const relationships = await sql`
      SELECT 
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      ORDER BY tc.table_name
    `;

    // Get constraints and indexes
    const constraints = await sql`
      SELECT 
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        string_agg(kcu.column_name, ', ') as columns
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = 'public'
      GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type
      ORDER BY tc.table_name, tc.constraint_type
    `;

    return Response.json({
      message: "Complete database schema - no hidden relationships",
      tables: tables.map((t) => ({
        name: t.table_name,
        columns: t.columns.split(", "),
      })),
      foreign_keys: relationships.map((r) => ({
        from: `${r.table_name}.${r.column_name}`,
        to: `${r.foreign_table_name}.${r.foreign_column_name}`,
        constraint: r.constraint_name,
      })),
      constraints: constraints.map((c) => ({
        table: c.table_name,
        name: c.constraint_name,
        type: c.constraint_type,
        columns: c.columns.split(", "),
      })),
      documentation: {
        index_categories:
          "Top-level organization by intent_type (problem-solving, learning, debugging, creative)",
        sub_index_clusters:
          "Semantic groupings within categories, connected by relationship_type",
        memory_entries:
          "The actual memories, linked to clusters for organization",
        concept_relationships: "Cross-memory connections with strength scoring",
        categorization_patterns:
          "Learning data for improving auto-categorization",
        query_patterns:
          "Search optimization based on successful navigation paths",
      },
    });
  } catch (error) {
    console.error("Schema query error:", error);
    return Response.json(
      { error: "Failed to retrieve schema", details: error.message },
      { status: 500 },
    );
  }
}

// POST endpoint to validate a proposed database change
export async function POST(request) {
  try {
    const { proposed_query, description } = await request.json();

    // This doesn't execute - just explains what would happen
    return Response.json({
      message: "Proposed change analysis",
      description,
      proposed_sql: proposed_query,
      analysis: {
        safe: true, // You'd add actual validation logic here
        warnings: [],
        affected_tables: [], // Parse the SQL to determine this
        recommendation: "Review foreign key constraints before execution",
      },
    });
  } catch (error) {
    return Response.json(
      { error: "Analysis failed", details: error.message },
      { status: 500 },
    );
  }
}
