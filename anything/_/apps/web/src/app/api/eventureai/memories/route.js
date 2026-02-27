import { requireMemoriaAdmin } from "@/app/api/utils/memoriaAdmin";

export async function GET(request) {
  try {
    await requireMemoriaAdmin(request);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "app"; // app, business, or enterprise

    // Select the appropriate memory key based on type
    let memoryKey;
    switch (type) {
      case "enterprise":
        memoryKey = process.env.ENTERPRISE_MEMORY_KEY;
        break;
      case "business":
        memoryKey = process.env.BUSINESS_MEMORY_KEY;
        break;
      case "app":
      default:
        memoryKey = process.env.APP_MEMORY_KEY;
        break;
    }

    if (!memoryKey || !process.env.EVENTUREAI_API_KEY) {
      return Response.json(
        { error: "EventureAI credentials not configured" },
        { status: 500 },
      );
    }

    // Fetch memories from EventureAI
    const response = await fetch("https://api.eventureai.com/v1/memories", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.EVENTUREAI_API_KEY}`,
        "X-Memory-Key": memoryKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json(
        {
          error: "Failed to fetch memories from EventureAI",
          details: errorText,
        },
        { status: response.status },
      );
    }

    const memories = await response.json();

    return Response.json({
      success: true,
      type,
      memories,
      count: memories?.length || 0,
    });
  } catch (error) {
    const status = error?.status || 500;
    if (status === 401 || status === 403) {
      return Response.json({ error: error.message }, { status });
    }

    console.error("EventureAI memories fetch error:", error);
    return Response.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    await requireMemoriaAdmin(request);

    const body = await request.json();
    const { type = "app", memory, context } = body;

    // Select the appropriate memory key based on type
    let memoryKey;
    switch (type) {
      case "enterprise":
        memoryKey = process.env.ENTERPRISE_MEMORY_KEY;
        break;
      case "business":
        memoryKey = process.env.BUSINESS_MEMORY_KEY;
        break;
      case "app":
      default:
        memoryKey = process.env.APP_MEMORY_KEY;
        break;
    }

    if (!memoryKey || !process.env.EVENTUREAI_API_KEY) {
      return Response.json(
        { error: "EventureAI credentials not configured" },
        { status: 500 },
      );
    }

    if (!memory) {
      return Response.json(
        { error: "Memory content is required" },
        { status: 400 },
      );
    }

    // Store memory to EventureAI
    const response = await fetch("https://api.eventureai.com/v1/memories", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.EVENTUREAI_API_KEY}`,
        "X-Memory-Key": memoryKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: memory,
        context: context || {},
        timestamp: new Date().toISOString(),
        source: "anything-platform",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json(
        { error: "Failed to store memory to EventureAI", details: errorText },
        { status: response.status },
      );
    }

    const result = await response.json();

    return Response.json({
      success: true,
      type,
      memory_id: result.id,
      message: "Memory stored successfully",
    });
  } catch (error) {
    const status = error?.status || 500;
    if (status === 401 || status === 403) {
      return Response.json({ error: error.message }, { status });
    }

    console.error("EventureAI memory storage error:", error);
    return Response.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
