import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function checkColumnDetails() {
  const sql = getSQL();
  try {
    const res = await sql`
      SELECT column_name, numeric_precision, numeric_scale 
      FROM information_schema.columns 
      WHERE table_name = 'llm_billing_rules' AND data_type = 'numeric'
    `;
    console.log(JSON.stringify(res, null, 2));
  } catch (e: any) {
    console.error(e.message);
  }
}
checkColumnDetails();