import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function generateMasterLedger() {
  const sql = getSQL();
  console.log("📑 MASTER LEDGER GENERATION IN PROGRESS...");

  try {
    const tenants = await sql`SELECT id, name FROM tenants ORDER BY id ASC`;
    const pages = await sql`SELECT app_id, content FROM app_pages WHERE slug = 'index'`;

    // Map using string keys to handle bigint conversion
    const pageMap = new Map();
    pages.forEach(p => {
      pageMap.set(p.app_id.toString(), p.content);
    });

    console.log("\nID  | TENANT NAME       | COMPONENT COUNT | ROOT TYPES");
    console.log("-".repeat(70));

    for (const tenant of tenants) {
      const content = pageMap.get(tenant.id.toString()) || [];
      const count = Array.isArray(content) ? content.length : 0;
      const types = Array.isArray(content) 
        ? content.map((c: any) => c.type).join(", ") 
        : "Empty";

      console.log(
        `${tenant.id.toString().padEnd(3)} | ` +
        `${tenant.name.padEnd(17)} | ` +
        `${count.toString().padEnd(15)} | ` +
        `${types.substring(0, 30)}${types.length > 30 ? '...' : ''}`
      );
    }

    console.log("\n--- DEEP INDEX ---");
    for (const tenant of tenants) {
      const content = pageMap.get(tenant.id.toString());
      if (Array.isArray(content) && content.length > 0) {
        console.log(`\n[#${tenant.id}] ${tenant.name.toUpperCase()}`);
        content.forEach((c: any) => {
          console.log(`  - ${c.id} (${c.type})`);
          if (c.children) {
            c.children.forEach((child: any) => console.log(`    └─ ${child.id} (${child.type})`));
          }
        });
      }
    }

  } catch (e: any) {
    console.error("❌ Ledger Generation Failed:", e.message);
  }
}

generateMasterLedger();