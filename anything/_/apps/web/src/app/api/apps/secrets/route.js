import sql from "@/app/api/utils/sql";
import { requireMemoriaAdmin } from "@/app/api/utils/memoriaAdmin";

// GET - List secrets for an app (values masked for security)
export async function GET(request) {
  try {
    await requireMemoriaAdmin(request);

    const { searchParams } = new URL(request.url);
    const app_id = searchParams.get("app_id");
    const environment = searchParams.get("environment");

    if (!app_id) {
      return Response.json({ error: "app_id is required" }, { status: 400 });
    }

    let query = `
      SELECT 
        s.id,
        s.app_id,
        s.secret_key,
        CASE 
          WHEN s.secret_value IS NOT NULL THEN '***HIDDEN***'
          ELSE NULL 
        END as secret_value_masked,
        s.environment,
        s.is_required,
        s.description,
        s.last_rotated,
        s.expires_at,
        s.created_at,
        s.updated_at,
        a.name as app_name,
        a.app_type
      FROM app_secrets s
      JOIN apps a ON s.app_id = a.id
      WHERE s.app_id = $1
    `;
    const values = [app_id];
    let paramCount = 1;

    if (environment) {
      paramCount++;
      query += ` AND s.environment = $${paramCount}`;
      values.push(environment);
    }

    query += ` ORDER BY s.secret_key, s.environment`;

    const secrets = await sql(query, values);

    // Check for expiring secrets (within 30 days)
    const expiring = secrets.filter(
      (s) =>
        s.expires_at &&
        new Date(s.expires_at) <=
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    );

    return Response.json({
      secrets,
      summary: {
        total: secrets.length,
        by_environment: secrets.reduce((acc, s) => {
          acc[s.environment] = (acc[s.environment] || 0) + 1;
          return acc;
        }, {}),
        expiring_soon: expiring.length,
        missing_required: secrets.filter(
          (s) => s.is_required && !s.secret_value_masked,
        ).length,
      },
    });
  } catch (error) {
    const status = error?.status || 500;
    if (status === 401 || status === 403) {
      return Response.json({ error: error.message }, { status });
    }

    console.error("Error fetching secrets:", error);
    return Response.json(
      { error: "Failed to fetch secrets", details: error.message },
      { status: 500 },
    );
  }
}

// POST - Add new secret for an app
export async function POST(request) {
  try {
    await requireMemoriaAdmin(request);

    const data = await request.json();
    const {
      app_id,
      secret_key,
      secret_value,
      environment = "production",
      is_required = true,
      description,
      expires_at,
    } = data;

    // Validate required fields
    if (!app_id || !secret_key) {
      return Response.json(
        { error: "app_id and secret_key are required" },
        { status: 400 },
      );
    }

    // Check if app exists
    const [app] = await sql`
      SELECT id, name, app_type FROM apps WHERE id = ${app_id}
    `;

    if (!app) {
      return Response.json({ error: "App not found" }, { status: 404 });
    }

    // NOTE: In production, you'd want to encrypt secret_value
    // For now, storing as plain text but this should be encrypted
    const [secret] = await sql`
      INSERT INTO app_secrets (
        app_id, secret_key, secret_value, environment, 
        is_required, description, expires_at
      ) VALUES (
        ${app_id}, ${secret_key}, ${secret_value}, ${environment},
        ${is_required}, ${description}, ${expires_at}
      )
      RETURNING id, app_id, secret_key, environment, is_required, description, expires_at, created_at
    `;

    return Response.json(
      {
        success: true,
        secret: {
          ...secret,
          secret_value: "***HIDDEN***", // Never return the actual value
        },
        message: `Secret "${secret_key}" added for ${app.name}`,
      },
      { status: 201 },
    );
  } catch (error) {
    const status = error?.status || 500;
    if (status === 401 || status === 403) {
      return Response.json({ error: error.message }, { status });
    }

    console.error("Error creating secret:", error);

    // Handle unique constraint violation
    if (error.message.includes("duplicate key")) {
      return Response.json(
        { error: "Secret key already exists for this app and environment" },
        { status: 409 },
      );
    }

    return Response.json(
      { error: "Failed to create secret", details: error.message },
      { status: 500 },
    );
  }
}

// PUT - Update existing secret
export async function PUT(request) {
  try {
    await requireMemoriaAdmin(request);

    const data = await request.json();
    const { id, secret_value, description, expires_at, is_required } = data;

    if (!id) {
      return Response.json({ error: "Secret id is required" }, { status: 400 });
    }

    const [secret] = await sql`
      UPDATE app_secrets SET
        secret_value = COALESCE(${secret_value}, secret_value),
        description = COALESCE(${description}, description),
        expires_at = COALESCE(${expires_at}, expires_at),
        is_required = COALESCE(${is_required}, is_required),
        last_rotated = CASE 
          WHEN ${secret_value} IS NOT NULL THEN CURRENT_TIMESTAMP 
          ELSE last_rotated 
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, app_id, secret_key, environment, is_required, description, expires_at, last_rotated, updated_at
    `;

    if (!secret) {
      return Response.json({ error: "Secret not found" }, { status: 404 });
    }

    return Response.json({
      success: true,
      secret: {
        ...secret,
        secret_value: secret_value ? "***UPDATED***" : "***HIDDEN***",
      },
      message: "Secret updated successfully",
    });
  } catch (error) {
    const status = error?.status || 500;
    if (status === 401 || status === 403) {
      return Response.json({ error: error.message }, { status });
    }

    console.error("Error updating secret:", error);
    return Response.json(
      { error: "Failed to update secret", details: error.message },
      { status: 500 },
    );
  }
}
