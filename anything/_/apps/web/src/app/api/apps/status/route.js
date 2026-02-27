import sql from "@/app/api/utils/sql";
import { requireMemoriaAdmin } from "@/app/api/utils/memoriaAdmin";

export async function GET(request) {
  try {
    await requireMemoriaAdmin(request);

    // Get all registered business applications and their status
    const apps = await sql`
      SELECT 
        id,
        name,
        url,
        app_type,
        status,
        last_health_check,
        created_at,
        updated_at,
        metadata
      FROM business_applications 
      ORDER BY name ASC
    `;

    // Check health of each app
    const appStatuses = await Promise.allSettled(
      apps.map(async (app) => {
        try {
          if (app.url) {
            const healthResponse = await fetch(`${app.url}/health`, {
              method: "GET",
              timeout: 5000,
            });

            return {
              ...app,
              health: healthResponse.ok ? "healthy" : "unhealthy",
              response_time: Date.now() - healthResponse.startTime || 0,
              last_checked: new Date().toISOString(),
            };
          } else {
            return {
              ...app,
              health: "no-url",
              response_time: 0,
              last_checked: new Date().toISOString(),
            };
          }
        } catch (error) {
          return {
            ...app,
            health: "error",
            error_message: error.message,
            response_time: 0,
            last_checked: new Date().toISOString(),
          };
        }
      }),
    );

    const results = appStatuses.map((result) =>
      result.status === "fulfilled" ? result.value : result.reason,
    );

    // Update health check timestamps
    for (const app of results) {
      await sql`
        UPDATE business_applications 
        SET 
          status = ${app.health},
          last_health_check = CURRENT_TIMESTAMP,
          metadata = ${JSON.stringify({
            ...app.metadata,
            last_response_time: app.response_time,
            last_error: app.error_message || null,
          })}
        WHERE id = ${app.id}
      `;
    }

    // Generate summary statistics
    const summary = {
      total_apps: results.length,
      healthy: results.filter((app) => app.health === "healthy").length,
      unhealthy: results.filter((app) => app.health === "unhealthy").length,
      errors: results.filter((app) => app.health === "error").length,
      avg_response_time:
        results.reduce((sum, app) => sum + (app.response_time || 0), 0) /
          results.length || 0,
    };

    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
      applications: results,
    });
  } catch (error) {
    const status = error?.status || 500;
    if (status === 401 || status === 403) {
      return Response.json({ error: error.message }, { status });
    }

    console.error("App status check failed:", error);

    return Response.json(
      {
        success: false,
        error: "Failed to check application status",
        timestamp: new Date().toISOString(),
        applications: [],
      },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    await requireMemoriaAdmin(request);

    const { name, url, app_type, description } = await request.json();

    if (!name || !app_type) {
      return Response.json(
        {
          error: "Name and app_type are required",
        },
        { status: 400 },
      );
    }

    // Register a new business application
    const result = await sql`
      INSERT INTO business_applications (
        name,
        url,
        app_type,
        description,
        status,
        created_at,
        updated_at
      ) VALUES (
        ${name},
        ${url || null},
        ${app_type},
        ${description || null},
        'registered',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      ) RETURNING *
    `;

    return Response.json({
      success: true,
      application: result[0],
      message: `Application ${name} registered successfully`,
    });
  } catch (error) {
    const status = error?.status || 500;
    if (status === 401 || status === 403) {
      return Response.json({ error: error.message }, { status });
    }

    console.error("App registration failed:", error);

    return Response.json(
      {
        success: false,
        error: "Failed to register application",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
