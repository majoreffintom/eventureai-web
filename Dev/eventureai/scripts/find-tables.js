const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function findTables() {
  console.log('Searching for tables across all schemas...');
  try {
    const res = await pool.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('tenant_sites', 'organizations', 'tenants')
    `);
    console.table(res.rows);
  } catch (err) {
    console.error(err.message);
  } finally {
    await pool.end();
  }
}

findTables();
