import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function findBillingTables() {
  const sql = getSQL();
  try {
    const res = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name ILIKE '%billing%'
    `;
    console.log(JSON.stringify(res, null, 2));
  } catch (e: any) {
    console.error(e.message);
  }
}
findBillingTables();