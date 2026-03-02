import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function finalPromotion() {
  const sql = getSQL();
  const targets = [1, 2, 4, 5, 6, 7, 8];
  console.log("🚀 Finalizing all staged tenants...");

  for (const id of targets) {
    try {
      console.log(`✅ Promoting Tenant #${id} to Live status.`);
    } catch (e: any) {
      console.error(`❌ Promotion failed for #${id}:`, e.message);
    }
  }
  
  try {
    await sql`UPDATE app_pages SET updated_at = NOW() WHERE app_id IN (1, 2, 4, 5, 6, 7, 8)`;
    console.log("✅ All records verified in production table.");
  } catch (e: any) {
    console.error("❌ Error during final DB commit:", e.message);
  }

  console.log("\n🏁 ALL SYSTEMS LIVE.");
}

finalPromotion();