export async function POST(request) {
  try {
    const body = await request.json();
    const { action, schedule, memory_type } = body;

    // Verify CRON secret for security
    const authHeader = request.headers.get("authorization");
    const providedSecret = authHeader?.replace("Bearer ", "");

    if (!providedSecret || providedSecret !== process.env.CRON_SECRET) {
      return Response.json(
        { error: "Invalid or missing CRON secret" },
        { status: 401 },
      );
    }

    if (!process.env.EVENTUREAI_API_KEY) {
      return Response.json(
        { error: "EventureAI API key not configured" },
        { status: 500 },
      );
    }

    // Handle different cron actions
    switch (action) {
      case "sync_memories":
        return await handleMemorySync(memory_type);

      case "backup_memories":
        return await handleMemoryBackup(memory_type);

      case "cleanup_old_memories":
        return await handleMemoryCleanup(memory_type);

      default:
        return Response.json({ error: "Unknown cron action" }, { status: 400 });
    }
  } catch (error) {
    console.error("EventureAI cron error:", error);
    return Response.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}

async function handleMemorySync(memoryType) {
  try {
    // Get the appropriate memory key
    let memoryKey;
    switch (memoryType) {
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

    if (!memoryKey) {
      throw new Error(`No memory key configured for type: ${memoryType}`);
    }

    // Fetch latest memories from EventureAI
    const response = await fetch(
      "https://api.eventureai.com/v1/memories/sync",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.EVENTUREAI_API_KEY}`,
          "X-Memory-Key": memoryKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          last_sync: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`EventureAI sync failed: ${response.statusText}`);
    }

    const syncResult = await response.json();

    return Response.json({
      success: true,
      action: "sync_memories",
      memory_type: memoryType,
      synced_count: syncResult.count,
      message: `Successfully synced ${syncResult.count} memories`,
    });
  } catch (error) {
    throw new Error(`Memory sync failed: ${error.message}`);
  }
}

async function handleMemoryBackup(memoryType) {
  try {
    // Get the appropriate memory key
    let memoryKey;
    switch (memoryType) {
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

    if (!memoryKey) {
      throw new Error(`No memory key configured for type: ${memoryType}`);
    }

    // Trigger backup in EventureAI
    const response = await fetch(
      "https://api.eventureai.com/v1/memories/backup",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.EVENTUREAI_API_KEY}`,
          "X-Memory-Key": memoryKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          backup_type: "full",
          timestamp: new Date().toISOString(),
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`EventureAI backup failed: ${response.statusText}`);
    }

    const backupResult = await response.json();

    return Response.json({
      success: true,
      action: "backup_memories",
      memory_type: memoryType,
      backup_id: backupResult.backup_id,
      message: `Memory backup created successfully`,
    });
  } catch (error) {
    throw new Error(`Memory backup failed: ${error.message}`);
  }
}

async function handleMemoryCleanup(memoryType) {
  try {
    // Get the appropriate memory key
    let memoryKey;
    switch (memoryType) {
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

    if (!memoryKey) {
      throw new Error(`No memory key configured for type: ${memoryType}`);
    }

    // Clean up old memories in EventureAI
    const response = await fetch(
      "https://api.eventureai.com/v1/memories/cleanup",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.EVENTUREAI_API_KEY}`,
          "X-Memory-Key": memoryKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          older_than: new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000,
          ).toISOString(), // 30 days
          keep_count: 1000, // Keep at least 1000 recent memories
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`EventureAI cleanup failed: ${response.statusText}`);
    }

    const cleanupResult = await response.json();

    return Response.json({
      success: true,
      action: "cleanup_old_memories",
      memory_type: memoryType,
      cleaned_count: cleanupResult.cleaned_count,
      message: `Cleaned up ${cleanupResult.cleaned_count} old memories`,
    });
  } catch (error) {
    throw new Error(`Memory cleanup failed: ${error.message}`);
  }
}

// GET endpoint to check cron status
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // Verify CRON secret for security
    const authHeader = request.headers.get("authorization");
    const providedSecret = authHeader?.replace("Bearer ", "");

    if (!providedSecret || providedSecret !== process.env.CRON_SECRET) {
      return Response.json(
        { error: "Invalid or missing CRON secret" },
        { status: 401 },
      );
    }

    // Return cron status
    return Response.json({
      success: true,
      cron_status: "active",
      available_actions: [
        "sync_memories",
        "backup_memories",
        "cleanup_old_memories",
      ],
      memory_types: ["app", "business", "enterprise"],
      last_check: new Date().toISOString(),
    });
  } catch (error) {
    console.error("EventureAI cron status error:", error);
    return Response.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
