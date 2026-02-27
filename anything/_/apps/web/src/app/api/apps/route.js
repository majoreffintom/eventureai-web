import sql from "@/app/api/utils/sql";
import { requireMemoriaAdmin } from "@/app/api/utils/memoriaAdmin";

// GET - List all apps with optional filtering
export async function GET(request) {
  try {
    await requireMemoriaAdmin(request);

    const { searchParams } = new URL(request.url);
    const app_type = searchParams.get("type");
    const status = searchParams.get("status");
    const environment = searchParams.get("environment");

    let query = `
      SELECT 
        a.*,
        COUNT(s.id) as secret_count,
        COUNT(d.id) as dependency_count
      FROM apps a
      LEFT JOIN app_secrets s ON a.id = s.app_id
      LEFT JOIN app_dependencies d ON a.id = d.app_id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 0;

    if (app_type) {
      paramCount++;
      query += ` AND a.app_type = $${paramCount}`;
      values.push(app_type);
    }

    if (status) {
      paramCount++;
      query += ` AND a.status = $${paramCount}`;
      values.push(status);
    }

    if (environment) {
      paramCount++;
      query += ` AND a.environment = $${paramCount}`;
      values.push(environment);
    }

    query += ` 
      GROUP BY a.id 
      ORDER BY a.created_at DESC
    `;

    const apps = await sql(query, values);

    // Get summary stats
    const stats = await sql`
      SELECT 
        app_type,
        status,
        COUNT(*) as count
      FROM apps 
      GROUP BY app_type, status
      ORDER BY app_type, status
    `;

    return Response.json({
      apps,
      stats: {
        summary: stats,
        total: apps.length,
        by_type: {
          internal: apps.filter((a) => a.app_type === "internal").length,
          external_api: apps.filter((a) => a.app_type === "external_api")
            .length,
          saas_tool: apps.filter((a) => a.app_type === "saas_tool").length,
        },
      },
    });
  } catch (error) {
    const status = error?.status || 500;
    if (status === 401 || status === 403) {
      return Response.json({ error: error.message }, { status });
    }

    console.error("Error fetching apps:", error);
    return Response.json(
      { error: "Failed to fetch apps", details: error.message },
      { status: 500 },
    );
  }
}

// POST - Create new app
export async function POST(request) {
  try {
    await requireMemoriaAdmin(request);

    const data = await request.json();
    const {
      name,
      app_type,
      status = "active",
      domain,
      repository_url,
      deployment_status,
      api_base_url,
      documentation_url,
      provider_name,
      description,
      version,
      environment = "production",
      metadata = {},
    } = data;

    // Validate required fields
    if (!name || !app_type) {
      return Response.json(
        { error: "Name and app_type are required" },
        { status: 400 },
      );
    }

    // Validate app_type specific requirements
    if (app_type === "external_api" && !provider_name) {
      return Response.json(
        { error: "provider_name is required for external APIs" },
        { status: 400 },
      );
    }

    const [app] = await sql`
      INSERT INTO apps (
        name, app_type, status, domain, repository_url, deployment_status,
        api_base_url, documentation_url, provider_name, description, 
        version, environment, metadata
      ) VALUES (
        ${name}, ${app_type}, ${status}, ${domain}, ${repository_url}, 
        ${deployment_status}, ${api_base_url}, ${documentation_url}, 
        ${provider_name}, ${description}, ${version}, ${environment}, 
        ${JSON.stringify(metadata)}
      )
      RETURNING *
    `;

    return Response.json(
      {
        success: true,
        app,
        message: `${app_type} app "${name}" created successfully`,
      },
      { status: 201 },
    );
  } catch (error) {
    const status = error?.status || 500;
    if (status === 401 || status === 403) {
      return Response.json({ error: error.message }, { status });
    }

    console.error("Error creating app:", error);
    return Response.json(
      { error: "Failed to create app", details: error.message },
      { status: 500 },
    );
  }
}
