import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function checkOpenErrors() {
  const sql = getSQL();
  try {
    const res = await sql`SELECT * FROM mori_error_chains WHERE status = 'open' ORDER BY created_at DESC LIMIT 5`;
    console.log(JSON.stringify(res, null, 2));
  } catch (e: any) {
    console.error(e.message);
  }
}
checkOpenErrors();