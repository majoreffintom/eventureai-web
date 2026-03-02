import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function checkSchema() {
  const sql = getSQL();
  try {
    const res = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'apps'`;
    console.log(JSON.stringify(res, null, 2));
  } catch (e: any) {
    console.error(e.message);
  }
}
checkSchema();