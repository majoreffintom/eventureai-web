// Initialize the automated memory system
async function initializeMemorySystem() {
  try {
    console.log("🧠 Initializing AI Memory System...");

    const response = await fetch("/api/demo-auto-capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();

    if (result.success) {
      console.log("✅ Memory system initialized successfully!");
      console.log(
        `📊 Demo entries: ${result.demo_populated.summary.total_entries}`,
      );
      console.log(
        `🎯 Current conversation captured in: ${result.current_conversation_captured.category} > ${result.current_conversation_captured.cluster}`,
      );
      console.log(
        `🔥 Confidence: ${result.current_conversation_captured.confidence}/10`,
      );

      return {
        status: "active",
        total_memories: result.demo_populated.summary.total_entries + 1,
        auto_capture_enabled: true,
        current_session_captured: true,
      };
    } else {
      console.error("❌ Memory system initialization failed:", result.error);
      return { status: "failed", error: result.error };
    }
  } catch (error) {
    console.error("❌ Memory system initialization error:", error);
    return { status: "error", error: error.message };
  }
}

// Run the initialization
initializeMemorySystem().then((status) => {
  console.log("🚀 Memory System Status:", status);
});
