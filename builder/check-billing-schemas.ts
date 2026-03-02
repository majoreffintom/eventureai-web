import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function checkBillingSchemas() {
  const sql = getSQL();
  const tables = ['llm_billing_rules', 'llm_usage_records', 'llm_cost_calculations'];
  
  for (const table of tables) {
    try {
      console.log(`
--- Schema for ${table} ---`);
      const res = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = ${table}
      `;
      console.log(JSON.stringify(res, null, 2));
    } catch (e: any) {
      console.error(`Error checking ${table}:`, e.message);
    }
  }
}
checkBillingSchemas();