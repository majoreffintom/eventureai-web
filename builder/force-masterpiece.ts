import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function forceMasterpiece() {
  const sql = getSQL();
  console.log("🛠️ Force-writing Rosebud Masterpiece Content...");

  const content = [
    {
      id: "navbar-1",
      type: "navbar",
      props: {
        logo: "Rosebud Veneer",
        links: ["Catalogue", "Plywood", "Projects", "About"]
      }
    },
    {
      id: "hero-1",
      type: "hero_section",
      props: {
        heading: "Architectural Veneer Plywood & 2-Ply",
        subheading: "33 Years of Boutique AA Quality Veneer Supply.",
        buttonText: "Get a Quote",
        style: {
          backgroundColor: "#09090b",
          color: "#ffffff"
        }
      }
    },
    {
      id: "species-grid",
      type: "grid",
      props: {
        columns: "repeat(3, 1fr)"
      },
      children: [
        {
          id: "card-oak",
          type: "card",
          props: {
            title: "Rift White Oak",
            description: "Premium sequence-matched panels.",
            imageUrl: "https://base44.app/api/apps/68e02e281afc0908849d5beb/files/public/68e02e281afc0908849d5beb/8792e668f_IMG_0584.jpeg"
          }
        },
        {
          id: "card-walnut",
          type: "card",
          props: {
            title: "Quartered Walnut",
            description: "Stunning architectural plywood.",
            imageUrl: "https://base44.app/api/apps/68e02e281afc0908849d5beb/files/public/68e02e281afc0908849d5beb/f0ab2f6e4_IMG_0610.jpeg"
          }
        },
        {
          id: "card-eucalyptus",
          type: "card",
          props: {
            title: "Fumed Eucalyptus",
            description: "Exotic high-end texture.",
            imageUrl: "https://base44.app/api/apps/68e02e281afc0908849d5beb/files/public/68e02e281afc0908849d5beb/2b0ed4664_5216498674391108867.png"
          }
        }
      ]
    }
  ];

  try {
    const json = JSON.stringify(content);
    
    // Update both Rosebud ID and the current active ID (1)
    await sql`UPDATE app_pages SET content = ${json} WHERE app_id = 9 AND slug = 'index'`;
    await sql`UPDATE app_pages SET content = ${json} WHERE app_id = 1 AND slug = 'index'`;
    
    console.log("✅ Database Updated Successfully.");
  } catch (e: any) {
    console.error("❌ DB Update failed:", e.message);
  }
}

forceMasterpiece();