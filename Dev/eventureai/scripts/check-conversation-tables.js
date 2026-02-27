const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkTables() {
  const result = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND (table_name LIKE '%thread%' OR table_name LIKE '%conversation%' OR table_name LIKE '%message%')
    ORDER BY table_name
  `);
  console.log('Conversation-related tables:', result.rows.map(r => r.table_name).join(', ') || 'None found');

  // Check llm_threads structure
  const threads = await pool.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'llm_threads'
    ORDER BY ordinal_position
  `);
  console.log('\nllm_threads columns:');
  threads.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));

  // Check if there's a messages table or similar
  if (result.rows.find(r => r.table_name === 'llm_threads')) {
    const sample = await pool.query('SELECT * FROM llm_threads LIMIT 3');
    console.log('\nSample llm_threads:', JSON.stringify(sample.rows, null, 2));
  }

  await pool.end();
}

checkTables();
