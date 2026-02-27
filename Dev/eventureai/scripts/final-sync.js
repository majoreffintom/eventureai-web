const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function finalSync() {
  console.log('Final MORI Database Sync...');
  
  try {
    // 1. Add design_id to tenants if missing
    await pool.query("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS design_id text");
    console.log("Verified 'design_id' column in 'tenants'.");

    // 2. Register EventureAI in 'apps' (using title instead of slug, and manual ID)
    const checkApp = await pool.query("SELECT * FROM apps WHERE title = 'EventureAI'");
    if (checkApp.rowCount === 0) {
      console.log("Registering EventureAI in MORI Apps...");
      const maxIdRes = await pool.query("SELECT MAX(id) FROM apps");
      const nextId = (BigInt(maxIdRes.rows[0].max || 0) + 1n).toString();
      
      await pool.query(
        "INSERT INTO apps (id, title, summary, status) VALUES ($1, $2, $3, $4)",
        [nextId, 'EventureAI', 'App Builder Main', 'active']
      );
      console.log(`Registered with ID: ${nextId}`);
    }

    const apps = await pool.query("SELECT id, title FROM apps");
    console.log("Current Apps in MORI:");
    console.table(apps.rows);

    const tenants = await pool.query("SELECT id, name, slug FROM tenants");
    console.log("Current Tenants in MORI:");
    console.table(tenants.rows);

  } catch (err) {
    console.error('Sync Error:', err.message);
  } finally {
    await pool.end();
  }
}

finalSync();
