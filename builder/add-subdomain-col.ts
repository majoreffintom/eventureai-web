import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function addSubdomain() {
  const sql = getSQL();
  try {
    await sql`ALTER TABLE apps ADD COLUMN subdomain TEXT UNIQUE`;
    console.log('Added subdomain column');
  } catch (e: any) {
    console.error(e.message);
  }
}
addSubdomain();