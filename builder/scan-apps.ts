import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function listApps() {
  const sql = getSQL();
  try {
    console.log("🔍 Scanning database for existing apps/tenants...");
    
    let apps = [];
    try {
      apps = await sql`SELECT id, name, status FROM apps LIMIT 20`;
    } catch (e) {}

    let tenants = [];
    try {
      tenants = await sql`SELECT id, name FROM tenants LIMIT 20`;
    } catch (e) {}

    console.log("\n--- Apps ---");
    console.log(apps.length ? apps : "No 'apps' table or it's empty.");

    console.log("\n--- Tenants ---");
    console.log(tenants.length ? tenants : "No 'tenants' table or it's empty.");

  } catch (e: any) {
    console.error("❌ Scan failed:", e.message);
  }
}
listApps();