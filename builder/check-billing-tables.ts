import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function checkBillingTables() {
  const sql = getSQL();
  try {
    const rules = await sql`SELECT COUNT(*) as count FROM llm_billing_rules`;
    const pricing = await sql`SELECT COUNT(*) as count FROM llm_pricing_rules`;
    console.log(`llm_billing_rules: ${rules[0].count}`);
    console.log(`llm_pricing_rules: ${pricing[0].count}`);
  } catch (e: any) {
    console.error(e.message);
  }
}
checkBillingTables();