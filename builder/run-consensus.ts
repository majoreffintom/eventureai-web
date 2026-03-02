import 'dotenv/config';
import { createSwarm } from './packages/llm/dist/index.js';

async function runConsensus() {
  const swarm = createSwarm();
  console.log("🧬 Swarm Consensus Session: Rosebud Veneer");

  const p_designer = "Audit the visual build of Rosebud Veneer. Dark Zinc-950 theme, #CD853F wood accents. Is it high-end enough? Are the components spaced professionally?";
  const p_researcher = "Compare the built site content with the original rosebudveneer.com. Did we miss any critical species? Is the branding accurate?";
  const p_copywriter = "Review the headings and subheadings. Are they engaging? Does the tone match a premium architectural supplier?";
  const p_database = "Verify the current app_pages structure. Are components being nested correctly in the content JSON? Is the state efficient?";

  try {
    console.log("\n🤖 [DESIGNER]");
    const r1 = await (swarm as any).agents.get("designer").execute({ messages: [{ role: "user", content: p_designer }], stream: false });
    console.log(r1.message.content[0].text);

    console.log("\n🤖 [RESEARCHER]");
    const r2 = await (swarm as any).agents.get("researcher").execute({ messages: [{ role: "user", content: p_researcher }], stream: false });
    console.log(r2.message.content[0].text);

    console.log("\n🤖 [COPYWRITER]");
    const r3 = await (swarm as any).agents.get("copywriter").execute({ messages: [{ role: "user", content: p_copywriter }], stream: false });
    console.log(r3.message.content[0].text);

    console.log("\n🤖 [DB SPECIALIST]");
    const r4 = await (swarm as any).agents.get("database").execute({ messages: [{ role: "user", content: p_database }], stream: false });
    console.log(r4.message.content[0].text);

    console.log("\n🤖 [LEAD ARCHITECT FINAL VERDICT]");
    const final = await (swarm as any).agents.get("architect").execute({ 
      messages: [{ role: "user", content: `Review the Swarm feedback:\nDesigner: ${r1.message.content[0].text}\nResearcher: ${r2.message.content[0].text}\nCopywriter: ${r3.message.content[0].text}\nDB: ${r4.message.content[0].text}\n\nFinal decision: Is Rosebud build complete or do we iterate?` }], 
      stream: false 
    });
    console.log(final.message.content[0].text);

  } catch (e: any) {
    console.error("Consensus failed:", e.message);
  }
}

runConsensus();