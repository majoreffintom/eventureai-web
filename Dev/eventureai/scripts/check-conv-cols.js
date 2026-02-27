const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  // Check peggy_conversation_history
  const cols = await pool.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'peggy_conversation_history'
    ORDER BY ordinal_position
  `);
  console.log('peggy_conversation_history columns:');
  cols.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));

  // Check for any generic message/conversation tables
  const tables = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name LIKE '%message%'
    ORDER BY table_name
  `);
  console.log('\nMessage tables:', tables.rows.map(r => r.table_name).join(', ') || 'None');

  // Sample peggy_conversation_history
  const sample = await pool.query('SELECT * FROM peggy_conversation_history LIMIT 2');
  console.log('\nSample peggy_conversation_history:', JSON.stringify(sample.rows, null, 2));

  await pool.end();
}
check();
