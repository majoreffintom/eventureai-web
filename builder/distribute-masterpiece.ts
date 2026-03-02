import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function distributeMasterpiece() {
  const sql = getSQL();
  console.log("🛠️ Force-distributing masterpiece content to all tenants...");

  const rosebud = [
    { id: "navbar-rosebud", type: "navbar", props: { logo: "Rosebud Veneer", links: ["Catalogue", "Plywood", "Projects"] } },
    { id: "hero-rosebud", type: "hero_section", props: { heading: "Rosebud Veneer", subheading: "Architectural Veneer Plywood & 2-Ply Specialist", buttonText: "Get a Quote" } },
    { id: "species-grid", type: "grid", props: { columns: "repeat(3, 1fr)" }, children: [
      { id: "card-oak", type: "card", props: { title: "Rift White Oak", description: "Premium sequence-matched panels." } },
      { id: "card-walnut", type: "card", props: { title: "Quartered Walnut", description: "Stunning architectural plywood." } },
      { id: "card-euc", type: "card", props: { title: "Fumed Eucalyptus", description: "Exotic high-end texture." } }
    ]}
  ];

  const ditzl = [
    { id: "navbar-ditzl", type: "navbar", props: { logo: "DITZL", links: ["Events", "Tickets", "Dashboard"] } },
    { id: "hero-ditzl", type: "hero_section", props: { heading: "Welcome to Ditzl", subheading: "Decentralized event ticketing and wallet ecosystem.", buttonText: "Connect Wallet" } }
  ];

  const generic = (name: string) => [
    { id: `navbar-${name}`, type: "navbar", props: { logo: name.toUpperCase(), links: ["Home", "About", "Contact"] } },
    { id: `hero-${name}`, type: "hero_section", props: { heading: `Welcome to ${name}`, subheading: "Built by the Swarm.", buttonText: "Get Started" } }
  ];

  try {
    const targets = [
      { id: 1, name: 'EventureAI' },
      { id: 2, name: 'Mori' },
      { id: 3, name: 'Ditzl', content: ditzl },
      { id: 4, name: 'Lumina' },
      { id: 5, name: 'Goldey' },
      { id: 6, name: 'Peggy' },
      { id: 7, name: 'StreetEats' },
      { id: 8, name: 'Lightchain' },
      { id: 9, name: 'Rosebud', content: rosebud },
      { id: 10, name: 'Nifty' },
      { id: 11, name: 'Ditzl Events' }
    ];

    for (const t of targets) {
      const content = t.content || generic(t.name);
      const json = JSON.stringify(content);
      
      const exists = await sql`SELECT 1 FROM app_pages WHERE app_id = ${t.id} AND slug = 'index'`;
      
      if (exists.length > 0) {
        await sql`UPDATE app_pages SET content = ${json} WHERE app_id = ${t.id} AND slug = 'index'`;
      } else {
        await sql`INSERT INTO app_pages (app_id, slug, content, title) VALUES (${t.id}, 'index', ${json}, ${t.name})`;
      }
      console.log(`✅ Tenant #${t.id} (${t.name}) Initialized.`);
    }

    console.log("🚀 ALL SYSTEMS READY.");
  } catch (e: any) {
    console.error("❌ Distribution failed:", e.message);
  }
}

distributeMasterpiece();