import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function distributeMasterpiece() {
  const sql = getSQL();
  console.log("🛠️ Correcting Tenant Content Distribution...");

  const rosebud = [
    { id: "navbar-rosebud", type: "navbar", props: { logo: "Rosebud Veneer", links: ["Catalogue", "Plywood", "Projects"] } },
    { id: "hero-rosebud", type: "hero_section", props: { heading: "Rosebud Veneer", subheading: "Architectural Veneer Plywood & 2-Ply Specialist", buttonText: "Get a Quote" } },
    { id: "grid-rosebud", type: "grid", props: { columns: "repeat(3, 1fr)" }, children: [
      { id: "card-oak", type: "card", props: { title: "Rift White Oak", description: "Premium sequence-matched panels." } },
      { id: "card-walnut", type: "card", props: { title: "Quartered Walnut", description: "Stunning architectural plywood." } },
      { id: "card-euc", type: "card", props: { title: "Fumed Eucalyptus", description: "Exotic high-end texture." } }
    ]}
  ];

  const ditzl = [
    { id: "navbar-ditzl", type: "navbar", props: { logo: "DITZL", links: ["Events", "Tickets", "Dashboard"] } },
    { id: "hero-ditzl", type: "hero_section", props: { heading: "Welcome to Ditzl", subheading: "Decentralized event ticketing and wallet ecosystem.", buttonText: "Connect Wallet" } }
  ];

  try {
    // 1. Clear app_id 1 (the default during dev)
    await sql`UPDATE app_pages SET content = '[]'::jsonb WHERE app_id = 1`;
    
    // 2. Set Rosebud (#9)
    await sql`UPDATE app_pages SET content = ${JSON.stringify(rosebud)} WHERE app_id = 9`;
    
    // 3. Set Ditzl (#3)
    await sql`UPDATE app_pages SET content = ${JSON.stringify(ditzl)} WHERE app_id = 3`;

    // 4. Initialize others with valid JSON placeholders
    const others = [2, 4, 5, 6, 7, 8, 10, 11];
    for (const id of others) {
      await sql`UPDATE app_pages SET content = '[{"id":"placeholder","type":"text","props":{"text":"Tenant Architecture Initialized"}}]'::jsonb WHERE app_id = ${id}`;
    }

    console.log("✅ Distribution Complete.");
  } catch (e: any) {
    console.error("❌ Fix failed:", e.message);
  }
}

distributeMasterpiece();