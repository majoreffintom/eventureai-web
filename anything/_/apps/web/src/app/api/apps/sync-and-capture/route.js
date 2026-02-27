import sql from "@/app/api/utils/sql";
import { requireMemoriaAdmin } from "@/app/api/utils/memoriaAdmin";

export async function POST(request) {
  try {
    await requireMemoriaAdmin(request);

    const body = await request.json().catch(() => ({}));
    const appsLimit = Number(body?.limit || 50);
    const captureType = body?.data_type || "overview";

    // Optional: pass through paging/incremental sync options for Memoria export
    const options =
      typeof body?.options === "object" && body.options
        ? { ...body.options }
        : {};
    if (body?.since && !options.since) {
      options.since = body.since;
    }
    if (body?.conversation_limit && !options.limit) {
      options.limit = body.conversation_limit;
    }

    // Get active apps
    const apps = await sql`
      SELECT id, name, domain, app_type, description
      FROM apps
      WHERE status = 'active'
      ORDER BY created_at DESC
      LIMIT ${appsLimit}
    `;

    const results = [];
    for (const app of apps) {
      try {
        const resp = await fetch(
          `${process.env.APP_URL}/api/integrations/app-data`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              app_id: app.id,
              data_type: captureType,
              auto_capture: true,
              options,
            }),
          },
        );

        if (!resp.ok) {
          const text = await resp.text();
          results.push({ app: app.name, domain: app.domain, error: text });
          continue;
        }

        const data = await resp.json();
        results.push({
          app: app.name,
          domain: app.domain,
          captured: true,
          method: data?.data?.extraction_method || "unknown",
        });
      } catch (err) {
        results.push({ app: app.name, domain: app.domain, error: err.message });
      }
    }

    return Response.json({
      success: true,
      processed: apps.length,
      captured: results.filter((r) => r.captured).length,
      data_type: captureType,
      options,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const status = error?.status || 500;
    if (status === 401 || status === 403) {
      return Response.json({ error: error.message }, { status });
    }

    console.error("Apps sync-and-capture error:", error);
    return Response.json(
      { error: "Failed to sync and capture apps", details: error.message },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  // Simple status check
  try {
    await requireMemoriaAdmin(request);

    const [{ count }] =
      await sql`SELECT COUNT(*)::int as count FROM apps WHERE status = 'active'`;
    return Response.json({ success: true, active_apps: count });
  } catch (error) {
    const status = error?.status || 500;
    if (status === 401 || status === 403) {
      return Response.json({ error: error.message }, { status });
    }

    return Response.json({ error: error.message }, { status: 500 });
  }
}
