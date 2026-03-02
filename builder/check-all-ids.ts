import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function checkTableIds() {
  const sql = getSQL();
  
  console.log('--- Current Last IDs ---');
  
  try {
    const res1 = await sql`SELECT id FROM memories ORDER BY id DESC LIMIT 1`;
    console.log(`memories            : ${res1.length > 0 ? (res1[0] as any).id : 'Empty'}`);
  } catch (e: any) { console.log(`memories: ${e.message}`); }

  try {
    const res2 = await sql`SELECT id FROM media_assets ORDER BY id DESC LIMIT 1`;
    console.log(`media_assets        : ${res2.length > 0 ? (res2[0] as any).id : 'Empty'}`);
  } catch (e: any) { console.log(`media_assets: ${e.message}`); }

  try {
    const res3 = await sql`SELECT id FROM app_pages ORDER BY id DESC LIMIT 1`;
    console.log(`app_pages           : ${res3.length > 0 ? (res3[0] as any).id : 'Empty'}`);
  } catch (e: any) { console.log(`app_pages: ${e.message}`); }
}

checkTableIds();