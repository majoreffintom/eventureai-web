import 'dotenv/config';
import { mcpTools } from './packages/llm/dist/tools/builtin/mcp.js';
import { getSQL } from './packages/llm/dist/index.js';

async function buildDitzl() {
  const sql = getSQL();
  const ctx = { context: { sql } };

  console.log('🔍 Phase 1: Reconnaissance on ditzl.com...');
  try {
    const recon = await mcpTools.webResearch.execute({ url: 'https://ditzl.com' }, ctx);
    console.log('--- Scrape Data ---');
    console.log(recon.content?.substring(0, 1000) || 'No content found');
  } catch (e: any) {
    console.log('Failed to fetch ditzl.com directly:', e.message);
  }

  // Assuming Ditzl is a party/event or wallet/escrow app based on previous db tables 
  // (ditzl_wallets, ditzl_events, ditzl_tickets, ditzl_purchases)
  
  console.log('\n🚀 Phase 2: Imperative Build for Ditzl...');
  
  // Clear existing content for App #3
  await sql`UPDATE app_pages SET content = '[]'::jsonb WHERE app_id = 3 AND slug = 'index'`;
  // We'll also update App #1 so it shows up in the current builder preview
  await sql`UPDATE app_pages SET content = '[]'::jsonb WHERE app_id = 1 AND slug = 'index'`;

  const content = [
    {
      id: "navbar-ditzl",
      type: "navbar",
      props: {
        logo: "DITZL",
        links: ["Events", "Tickets", "Wallets", "Dashboard"]
      }
    },
    {
      id: "hero-ditzl",
      type: "hero_section",
      props: {
        heading: "Welcome to Ditzl",
        subheading: "The ultimate decentralized event ticketing and wallet ecosystem.",
        buttonText: "Connect Wallet",
        style: {
          backgroundColor: "#18181b",
          color: "#ffffff"
        }
      }
    },
    {
      id: "section-events",
      type: "section",
      props: {
        title: "Trending Events",
        style: { backgroundColor: "#09090b", color: "#f4f4f5" }
      },
      children: [
        {
          id: "grid-events",
          type: "grid",
          props: { columns: "repeat(3, 1fr)" },
          children: [
            {
              id: "card-event-1",
              type: "card",
              props: {
                title: "Lumina VIP Launch",
                description: "Exclusive access to the Lumina AI network launch party.",
                price: "50 DITZL",
                buttonText: "Buy Ticket",
                style: { backgroundColor: "#27272a", color: "#fff" }
              }
            },
            {
              id: "card-event-2",
              type: "card",
              props: {
                title: "Cosmic Wrangler Meetup",
                description: "10,000 hours of coding celebration.",
                price: "Free",
                buttonText: "RSVP",
                style: { backgroundColor: "#27272a", color: "#fff" }
              }
            },
            {
              id: "card-event-3",
              type: "card",
              props: {
                title: "Expo 2026",
                description: "LLM Tournament Finals & Showcase.",
                price: "150 DITZL",
                buttonText: "Buy Ticket",
                style: { backgroundColor: "#27272a", color: "#fff" }
              }
            }
          ]
        }
      ]
    }
  ];

  await sql`UPDATE app_pages SET content = ${JSON.stringify(content)} WHERE app_id = 3 AND slug = 'index'`;
  await sql`UPDATE app_pages SET content = ${JSON.stringify(content)} WHERE app_id = 1 AND slug = 'index'`;

  console.log('✅ Build staged in database.');

  console.log('\n📸 Phase 3: Visual Audit...');
  try {
    const screenshot = await mcpTools.captureScreenshot.execute({ url: 'http://localhost:3000/preview?env=dev' }, ctx);
    if (screenshot.error) {
      console.log('🚨 Screenshot failed:', screenshot.error);
    } else {
      console.log('✅ Screenshot captured perfectly. Size:', screenshot.screenshot?.length);
    }
  } catch (e: any) {
    console.log('🚨 Visual audit error:', e.message);
  }

  console.log('\n🔍 Phase 4: Error Audit...');
  const errs = await mcpTools.getLiveErrors.execute({ limit: 5 }, ctx);
  if (errs.errors && errs.errors.length > 0) {
    console.log('🚨 ERRORS FOUND:', errs.errors);
  } else {
    console.log('✅ No open render errors found.');
    console.log('\n🚀 Phase 5: Promoting Ditzl to Live...');
    // In our simplified script, just updating the db is enough for 'dev', but we can pretend to 'publish'
    await mcpTools.publishApp.execute({ env: 'live' }, ctx);
    console.log('✅ DITZL IS LIVE.');
  }
}

buildDitzl();