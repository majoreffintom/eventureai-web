export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { limit = 50, data_type = "overview" } = body || {};

    // Verify CRON secret for security
    const authHeader = request.headers.get("authorization");
    const providedSecret = authHeader?.replace("Bearer ", "");

    if (!providedSecret || providedSecret !== process.env.CRON_SECRET) {
      return Response.json(
        { error: "Invalid or missing CRON secret" },
        { status: 401 },
      );
    }

    // Delegate to sync-and-capture
    const resp = await fetch(
      `${process.env.APP_URL}/api/apps/sync-and-capture`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit, data_type, auto_capture: true }),
      },
    );

    const resultText = await resp.text();
    const result = (() => {
      try {
        return JSON.parse(resultText);
      } catch {
        return { raw: resultText };
      }
    })();

    return Response.json({ success: resp.ok, status: resp.status, result });
  } catch (error) {
    console.error("Apps cron error:", error);
    return Response.json(
      { error: "Apps cron failed", details: error.message },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try {
    // Verify CRON secret for security
    const authHeader = request.headers.get("authorization");
    const providedSecret = authHeader?.replace("Bearer ", "");

    if (!providedSecret || providedSecret !== process.env.CRON_SECRET) {
      return Response.json(
        { error: "Invalid or missing CRON secret" },
        { status: 401 },
      );
    }

    return Response.json({
      success: true,
      cron_status: "active",
      action: "apps_sync_and_capture",
      options: {
        params: ["limit", "data_type"],
        defaults: { limit: 50, data_type: "overview" },
      },
      last_check: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
