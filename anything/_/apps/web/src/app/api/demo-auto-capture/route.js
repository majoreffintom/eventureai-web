import sql from "@/app/api/utils/sql";

export async function POST() {
  try {
    // First populate with demo data to create the structure
    const demoResponse = await fetch(
      `${process.env.APP_URL}/api/memory/populate-demo`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
    );

    if (!demoResponse.ok) {
      throw new Error("Failed to populate demo data");
    }

    const demoResult = await demoResponse.json();

    // Now auto-capture the current conversation moment
    const captureResponse = await fetch(
      `${process.env.APP_URL}/api/memory/auto-capture`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content:
            "User expressed preference for automated memory capture over manual interface interaction. They trust the AI's structural judgment and want the memory system to work behind the scenes automatically. Key insight: they've invested their last funds in this project and want seamless automation rather than manual categorization through the /memory interface. User is upgrading to Max soon and wants the system to just work without manual intervention.",
          user_query:
            "I want you to start automatically writing to memory and automate the process",
          session_context:
            "Memory system automation preferences and budget constraints discussion",
          conversation_turn: 2,
        }),
      },
    );

    if (!captureResponse.ok) {
      throw new Error("Failed to auto-capture current conversation");
    }

    const captureResult = await captureResponse.json();

    return Response.json({
      success: true,
      demo_populated: demoResult,
      current_conversation_captured: captureResult,
      message: "Memory system is now active and auto-capturing conversations",
    });
  } catch (error) {
    console.error("Demo auto-capture error:", error);
    return Response.json(
      { error: "Demo auto-capture failed", details: error.message },
      { status: 500 },
    );
  }
}
