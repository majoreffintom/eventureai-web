import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    // Check database connectivity and get system metrics
    const [memoryStats, systemHealth] = await Promise.allSettled([
      // Get memory system statistics
      sql`
        SELECT 
          COUNT(*) as total_entries,
          COUNT(DISTINCT sub_index_cluster_id) as active_clusters,
          MAX(accessed_at) as last_activity,
          AVG(usage_frequency) as avg_usage
        FROM memory_entries 
        WHERE created_at > NOW() - INTERVAL '24 hours'
      `,

      // Check overall system health
      sql`
        SELECT 
          COUNT(*) as total_categories,
          COUNT(DISTINCT id) as total_clusters
        FROM index_categories ic
        LEFT JOIN sub_index_clusters sic ON ic.id = sic.index_category_id
      `,
    ]);

    const memoryData =
      memoryStats.status === "fulfilled" ? memoryStats.value[0] : null;
    const healthData =
      systemHealth.status === "fulfilled" ? systemHealth.value[0] : null;

    // Check for pending items that need attention
    const pendingChecks = await Promise.allSettled([
      // Check for recent unprocessed memory entries
      sql`
        SELECT COUNT(*) as count 
        FROM memory_entries 
        WHERE sub_index_cluster_id IS NULL 
        AND created_at > NOW() - INTERVAL '24 hours'
      `,

      // Check for system errors or anomalies
      sql`
        SELECT COUNT(*) as count
        FROM memory_entries 
        WHERE reasoning_chain LIKE '%error%' 
        OR reasoning_chain LIKE '%failed%'
        AND created_at > NOW() - INTERVAL '24 hours'
      `,
    ]);

    const unprocessedMemories =
      pendingChecks[0].status === "fulfilled"
        ? pendingChecks[0].value[0]?.count || 0
        : 0;
    const systemErrors =
      pendingChecks[1].status === "fulfilled"
        ? pendingChecks[1].value[0]?.count || 0
        : 0;

    // Generate overnight activity summary
    const overnightStart = new Date();
    overnightStart.setHours(0, 0, 0, 0); // Start of today

    const overnightEnd = new Date();
    overnightEnd.setHours(6, 0, 0, 0); // 6 AM today

    let overnightActivity = "";
    if (memoryData) {
      const newEntries = parseInt(memoryData.total_entries) || 0;
      if (newEntries > 0) {
        overnightActivity = `${newEntries} new memory entries captured`;
      } else {
        overnightActivity = "No significant activity";
      }
    }

    // Determine system health status
    let health = "healthy";
    if (systemErrors > 5) {
      health = "degraded";
    } else if (systemErrors > 10 || !memoryData || !healthData) {
      health = "unhealthy";
    }

    return Response.json({
      health,
      timestamp: new Date().toISOString(),
      memory_system: {
        entries_24h: parseInt(memoryData?.total_entries) || 0,
        active_clusters: parseInt(memoryData?.active_clusters) || 0,
        last_activity: memoryData?.last_activity,
        avg_usage: parseFloat(memoryData?.avg_usage) || 0,
      },
      system_metrics: {
        total_categories: parseInt(healthData?.total_categories) || 0,
        total_clusters: parseInt(healthData?.total_clusters) || 0,
        database_connected: true,
      },
      pending_items: unprocessedMemories + systemErrors,
      overnight_activity: overnightActivity,
      alerts:
        systemErrors > 0
          ? [`${systemErrors} system errors detected in last 24h`]
          : [],
      suggested_focus: generateSuggestedFocus(
        memoryData,
        unprocessedMemories,
        systemErrors,
      ),
    });
  } catch (error) {
    console.error("System status check failed:", error);

    return Response.json(
      {
        health: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "System status unavailable",
        database_connected: false,
        pending_items: 0,
        overnight_activity: "Status check failed",
        alerts: ["System health monitoring is offline"],
        suggested_focus: "System diagnostics required",
      },
      { status: 500 },
    );
  }
}

function generateSuggestedFocus(memoryData, unprocessed, errors) {
  if (errors > 5) {
    return "Address system errors";
  }

  if (unprocessed > 10) {
    return "Process pending memory entries";
  }

  if (memoryData && parseInt(memoryData.total_entries) > 20) {
    return "Review recent insights";
  }

  return "System ready for new tasks";
}
