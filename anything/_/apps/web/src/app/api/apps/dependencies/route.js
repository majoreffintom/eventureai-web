import sql from "@/app/api/utils/sql";
import { requireMemoriaAdmin } from "@/app/api/utils/memoriaAdmin";

// GET - List app dependencies
export async function GET(request) {
  try {
    await requireMemoriaAdmin(request);

    const { searchParams } = new URL(request.url);
    const app_id = searchParams.get("app_id");

    if (!app_id) {
      return Response.json({ error: "app_id is required" }, { status: 400 });
    }

    // Get dependencies for this app
    const dependencies = await sql`
      SELECT 
        d.*,
        a1.name as app_name,
        a1.app_type as app_type,
        a2.name as dependency_name,
        a2.app_type as dependency_type,
        a2.status as dependency_status,
        a2.api_base_url,
        a2.provider_name
      FROM app_dependencies d
      JOIN apps a1 ON d.app_id = a1.id
      JOIN apps a2 ON d.depends_on_app_id = a2.id
      WHERE d.app_id = ${app_id}
      ORDER BY d.is_critical DESC, d.dependency_type
    `;

    // Get apps that depend on this app
    const dependents = await sql`
      SELECT 
        d.*,
        a1.name as dependent_name,
        a1.app_type as dependent_type,
        a2.name as app_name
      FROM app_dependencies d
      JOIN apps a1 ON d.app_id = a1.id
      JOIN apps a2 ON d.depends_on_app_id = a2.id
      WHERE d.depends_on_app_id = ${app_id}
      ORDER BY d.is_critical DESC, d.dependency_type
    `;

    // Get available apps to create dependencies with
    const available_apps = await sql`
      SELECT id, name, app_type, status, provider_name
      FROM apps 
      WHERE id != ${app_id} AND status = 'active'
      ORDER BY app_type, name
    `;

    return Response.json({
      dependencies,
      dependents,
      available_apps,
      summary: {
        total_dependencies: dependencies.length,
        critical_dependencies: dependencies.filter((d) => d.is_critical).length,
        external_dependencies: dependencies.filter(
          (d) => d.dependency_type === "external_api",
        ).length,
        total_dependents: dependents.length,
      },
    });
  } catch (error) {
    const status = error?.status || 500;
    if (status === 401 || status === 403) {
      return Response.json({ error: error.message }, { status });
    }

    console.error("Error fetching dependencies:", error);
    return Response.json(
      { error: "Failed to fetch dependencies", details: error.message },
      { status: 500 },
    );
  }
}

// POST - Create new dependency relationship
export async function POST(request) {
  try {
    await requireMemoriaAdmin(request);

    const data = await request.json();
    const {
      app_id,
      depends_on_app_id,
      dependency_type,
      is_critical = true,
      notes,
    } = data;

    // Validate required fields
    if (!app_id || !depends_on_app_id || !dependency_type) {
      return Response.json(
        {
          error: "app_id, depends_on_app_id, and dependency_type are required",
        },
        { status: 400 },
      );
    }

    // Check if apps exist
    const apps = await sql`
      SELECT id, name, app_type FROM apps 
      WHERE id = ${app_id} OR id = ${depends_on_app_id}
    `;

    if (apps.length !== 2) {
      return Response.json(
        { error: "One or both apps not found" },
        { status: 404 },
      );
    }

    const [dependency] = await sql`
      INSERT INTO app_dependencies (
        app_id, depends_on_app_id, dependency_type, is_critical, notes
      ) VALUES (
        ${app_id}, ${depends_on_app_id}, ${dependency_type}, ${is_critical}, ${notes}
      )
      RETURNING *
    `;

    const app_names = {
      [app_id]: apps.find((a) => a.id == app_id)?.name,
      [depends_on_app_id]: apps.find((a) => a.id == depends_on_app_id)?.name,
    };

    return Response.json(
      {
        success: true,
        dependency,
        message: `Dependency created: ${app_names[app_id]} depends on ${app_names[depends_on_app_id]}`,
      },
      { status: 201 },
    );
  } catch (error) {
    const status = error?.status || 500;
    if (status === 401 || status === 403) {
      return Response.json({ error: error.message }, { status });
    }

    console.error("Error creating dependency:", error);

    // Handle unique constraint violation
    if (error.message.includes("duplicate key")) {
      return Response.json(
        { error: "This dependency relationship already exists" },
        { status: 409 },
      );
    }

    return Response.json(
      { error: "Failed to create dependency", details: error.message },
      { status: 500 },
    );
  }
}

// DELETE - Remove dependency relationship
export async function DELETE(request) {
  try {
    await requireMemoriaAdmin(request);

    const { searchParams } = new URL(request.url);
    const dependency_id = searchParams.get("id");

    if (!dependency_id) {
      return Response.json(
        { error: "dependency id is required" },
        { status: 400 },
      );
    }

    const [deleted] = await sql`
      DELETE FROM app_dependencies 
      WHERE id = ${dependency_id}
      RETURNING *
    `;

    if (!deleted) {
      return Response.json({ error: "Dependency not found" }, { status: 404 });
    }

    return Response.json({
      success: true,
      message: "Dependency relationship removed",
    });
  } catch (error) {
    const status = error?.status || 500;
    if (status === 401 || status === 403) {
      return Response.json({ error: error.message }, { status });
    }

    console.error("Error deleting dependency:", error);
    return Response.json(
      { error: "Failed to delete dependency", details: error.message },
      { status: 500 },
    );
  }
}
