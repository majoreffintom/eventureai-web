const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function inspectSchema() {
  const tables = ['apps', 'tenant_sites', 'organizations'];
  for (const table of tables) {
    console.log(`
Inspecting table: ${table}`);
    try {
      const res = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '${table}'
      `);
      console.table(res.rows);
    } catch (err) {
      console.log(`Table ${table} error: ${err.message}`);
    }
  }
  await pool.end();
}

inspectSchema();
