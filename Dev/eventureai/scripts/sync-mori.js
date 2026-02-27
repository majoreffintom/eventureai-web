const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function syncMori() {
  console.log('Checking MORI Database Schema...');
  
  try {
    // 1. Check for 'apps' table
    const appsTable = await pool.query("SELECT * FROM information_schema.tables WHERE table_name = 'apps'");
    if (appsTable.rowCount > 0) {
      const apps = await pool.query("SELECT * FROM apps");
      console.log(`Found ${apps.rowCount} Apps in 'apps' table.`);
    } else {
      console.log("Table 'apps' does not exist. Creating it...");
      await pool.query(`
        CREATE TABLE IF NOT EXISTS apps (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          name text NOT NULL,
          slug text UNIQUE NOT NULL,
          created_at timestamptz DEFAULT now()
        )
      `);
    }

    // 2. Register EventureAI if not present
    const checkApp = await pool.query("SELECT * FROM apps WHERE slug = 'eventureai'");
    if (checkApp.rowCount === 0) {
      console.log("Registering EventureAI in MORI...");
      await pool.query("INSERT INTO apps (name, slug) VALUES ('EventureAI', 'eventureai')");
    }

    // 3. Check for 'tenant_sites' table
    const sitesTable = await pool.query("SELECT * FROM information_schema.tables WHERE table_name = 'tenant_sites'");
    if (sitesTable.rowCount === 0) {
      console.log("Creating 'tenant_sites' table...");
      await pool.query(`
        CREATE TABLE IF NOT EXISTS tenant_sites (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          domain text UNIQUE NOT NULL,
          app_id uuid REFERENCES apps(id),
          organization_id uuid,
          design_id text,
          created_at timestamptz DEFAULT now()
        )
      `);
    }

    console.log("MORI Sync Complete. Refresh your dashboard!");
  } catch (err) {
    console.error('Sync Error:', err.message);
  } finally {
    await pool.end();
  }
}

syncMori();
