export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const type = body.type || "all";
    const limit = Math.max(1, Math.min(100, body.limit || 10));

    // Verify CRON secret
    const authHeader = request.headers.get("authorization");
    const providedSecret = authHeader?.replace("Bearer ", "");
    if (!providedSecret || providedSecret !== process.env.CRON_SECRET) {
      return Response.json(
        { error: "Invalid or missing CRON secret" },
        { status: 401 },
      );
    }

    const baseUrl = process.env.APP_URL || "";
    const resp = await fetch(`${baseUrl}/api/cancellations/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, limit }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return Response.json(
        { error: `Process call failed: [${resp.status}] ${text}` },
        { status: 500 },
      );
    }

    const data = await resp.json();
    return Response.json({ success: true, ...data });
  } catch (error) {
    console.error("cancellations/cron error", error);
    return Response.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try {
    // Verify CRON secret
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
      default_limit: 10,
      supported_types: ["subscriptions", "invoices", "pattern_requests", "all"],
      last_check: new Date().toISOString(),
    });
  } catch (error) {
    console.error("cancellations/cron status error", error);
    return Response.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
