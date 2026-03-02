import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function checkAllTables() {
  const sql = getSQL();
  console.log("📊 Checking record counts for all system tables...");

  const tables = [
    'memories', 
    'llm_tournaments', 
    'llm_responses', 
    'mori_error_chains', 
    'mori_solutions',
    'builder_conversations',
    'builder_messages',
    'app_pages',
    'tenants',
    'rosebud_media_assets'
  ];

  for (const table of tables) {
    try {
      // Use dynamic table name safely with sql() helper if available or just raw template
      // Since I can't use sql(table) easily in this version without checking, I'll do individual queries
      let count = 0;
      if (table === 'memories') {
        const res = await sql`SELECT COUNT(*) as count FROM memories`;
        count = res[0].count;
      } else if (table === 'llm_tournaments') {
        const res = await sql`SELECT COUNT(*) as count FROM llm_tournaments`;
        count = res[0].count;
      } else if (table === 'llm_responses') {
        const res = await sql`SELECT COUNT(*) as count FROM llm_responses`;
        count = res[0].count;
      } else if (table === 'mori_error_chains') {
        const res = await sql`SELECT COUNT(*) as count FROM mori_error_chains`;
        count = res[0].count;
      } else if (table === 'mori_solutions') {
        const res = await sql`SELECT COUNT(*) as count FROM mori_solutions`;
        count = res[0].count;
      } else if (table === 'builder_conversations') {
        const res = await sql`SELECT COUNT(*) as count FROM builder_conversations`;
        count = res[0].count;
      } else if (table === 'builder_messages') {
        const res = await sql`SELECT COUNT(*) as count FROM builder_messages`;
        count = res[0].count;
      } else if (table === 'app_pages') {
        const res = await sql`SELECT COUNT(*) as count FROM app_pages`;
        count = res[0].count;
      } else if (table === 'tenants') {
        const res = await sql`SELECT COUNT(*) as count FROM tenants`;
        count = res[0].count;
      } else if (table === 'rosebud_media_assets') {
        const res = await sql`SELECT COUNT(*) as count FROM rosebud_media_assets`;
        count = res[0].count;
      }

      console.log(`${table.padEnd(25)} : ${count}`);
    } catch (e: any) {
      console.log(`${table.padEnd(25)} : ERROR - ${e.message}`);
    }
  }
}

checkAllTables();