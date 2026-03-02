import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function findGiggles() {
  const sql = getSQL();
  try {
    const res = await sql`
      SELECT id, content 
      FROM memories 
      WHERE id <= 1141 AND content ILIKE '%Giggles%'
    `;
    console.log(JSON.stringify(res, null, 2));
  } catch (e: any) {
    console.error(e.message);
  }
}
findGiggles();