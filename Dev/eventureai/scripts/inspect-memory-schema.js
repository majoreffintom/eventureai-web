const { neon } = require('@neondatabase/serverless');

const sql = neon('postgresql://neondb_owner:npg_FJhTH75DVCUt@ep-morning-hall-ajubusyy-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require');

async function inspect() {
  console.log('🔍 Inspecting database schema...\n');

  // Get all tables
  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;
  console.log('=== EXISTING TABLES ===');
  console.log(tables.map(t => t.table_name).join('\n'));

  // Check for memory-related tables
  const memoryTables = [
    'memories',
    'memoria_indexes',
    'memoria_subindexes',
    'memoria_threads',
    'memoria_turns',
    'project_states',
    'swarm_tasks',
    'swarm_agents',
    'swarm_communications',
    'webmcp_complaints',
    'webmcp_threads'
  ];

  console.log('\n=== MEMORY SYSTEM STATUS ===');
  for (const table of memoryTables) {
    const exists = tables.some(t => t.table_name === table);
    if (exists) {
      const cols = await sql`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = ${table}
        ORDER BY ordinal_position
      `;
      try {
        const countResult = await sql`SELECT COUNT(*) as count FROM ${sql(table)}`;
        console.log(`\n✅ ${table} (${countResult[0].count} rows)`);
        console.log(`   Columns: ${cols.map(c => `${c.column_name}:${c.data_type}`).join(', ')}`);
      } catch (e) {
        console.log(`\n✅ ${table} (error counting: ${e.message})`);
        console.log(`   Columns: ${cols.map(c => `${c.column_name}:${c.data_type}`).join(', ')}`);
      }
    } else {
      console.log(`\n❌ ${table} - NOT CREATED`);
    }
  }

  // Check for search_tsv column in memories
  console.log('\n=== SEARCH INDEXES ===');
  try {
    const indexes = await sql`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename IN ('memories', 'memoria_turns')
      ORDER BY tablename, indexname
    `;
    indexes.forEach(idx => {
      console.log(`${idx.indexname}: ${idx.indexdef}`);
    });
  } catch (e) {
    console.log('Error checking indexes:', e.message);
  }
}

inspect().then(() => {
  console.log('\n✅ Inspection complete');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
