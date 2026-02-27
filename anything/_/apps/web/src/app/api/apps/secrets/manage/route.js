import sql from "@/app/api/utils/sql";
import { requireMemoriaAdmin } from "@/app/api/utils/memoriaAdmin";

// Get all secrets for an app
export async function GET(request) {
  try {
    await requireMemoriaAdmin(request);

    const { searchParams } = new URL(request.url);
    const appId = searchParams.get("app_id");
    const environment = searchParams.get("environment") || "production";

    if (!appId) {
      return Response.json({ error: "app_id required" }, { status: 400 });
    }

    // Get app info first
    const [app] = await sql`SELECT * FROM apps WHERE id = ${appId}`;
    if (!app) {
      return Response.json({ error: "App not found" }, { status: 404 });
    }

    // Get secrets for this app
    const secrets = await sql`
      SELECT id, secret_key, description, is_required, environment, 
             last_rotated, expires_at, created_at,
             CASE 
               WHEN secret_value IS NOT NULL THEN true 
               ELSE false 
             END as has_value
      FROM app_secrets 
      WHERE app_id = ${appId} AND environment = ${environment}
      ORDER BY is_required DESC, secret_key ASC
    `;

    return Response.json({
      success: true,
      app: {
        id: app.id,
        name: app.name,
        app_type: app.app_type,
      },
      environment: environment,
      secrets: secrets,
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

// Add or update a secret
export async function POST(request) {
  try {
    await requireMemoriaAdmin(request);

    const body = await request.json();
    const {
      app_id,
      secret_key,
      secret_value,
      description,
      is_required = true,
      environment = "production",
      expires_at,
    } = body;

    if (!app_id || !secret_key) {
      return Response.json(
        { error: "app_id and secret_key are required" },
        { status: 400 },
      );
    }

    // Verify app exists
    const [app] = await sql`SELECT id, name FROM apps WHERE id = ${app_id}`;
    if (!app) {
      return Response.json({ error: "App not found" }, { status: 404 });
    }

    // Check if secret already exists
    const [existingSecret] = await sql`
      SELECT id FROM app_secrets 
      WHERE app_id = ${app_id} AND secret_key = ${secret_key} AND environment = ${environment}
    `;

    let result;

    if (existingSecret) {
      // Update existing secret
      [result] = await sql`
        UPDATE app_secrets 
        SET secret_value = ${secret_value},
            description = ${description},
            is_required = ${is_required},
            expires_at = ${expires_at},
            last_rotated = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${existingSecret.id}
        RETURNING id, secret_key, description, is_required, environment, last_rotated, expires_at
      `;
    } else {
      // Create new secret
      [result] = await sql`
        INSERT INTO app_secrets (app_id, secret_key, secret_value, description, is_required, environment, expires_at)
        VALUES (${app_id}, ${secret_key}, ${secret_value}, ${description}, ${is_required}, ${environment}, ${expires_at})
        RETURNING id, secret_key, description, is_required, environment, last_rotated, expires_at
      `;
    }

    return Response.json({
      success: true,
      secret: result,
      app_name: app.name,
      action: existingSecret ? "updated" : "created",
    });
  } catch (error) {
    const status = error?.status || 500;
    if (status === 401 || status === 403) {
      return Response.json({ error: error.message }, { status });
    }

    console.error("Error managing secret:", error);
    return Response.json(
      { error: "Failed to manage secret", details: error.message },
      { status: 500 },
    );
  }
}

// Delete a secret
export async function DELETE(request) {
  try {
    await requireMemoriaAdmin(request);

    const { searchParams } = new URL(request.url);
    const secretId = searchParams.get("secret_id");

    if (!secretId) {
      return Response.json({ error: "secret_id required" }, { status: 400 });
    }

    // Get secret info before deletion
    const [secret] = await sql`
      SELECT s.*, a.name as app_name 
      FROM app_secrets s 
      JOIN apps a ON s.app_id = a.id 
      WHERE s.id = ${secretId}
    `;

    if (!secret) {
      return Response.json({ error: "Secret not found" }, { status: 404 });
    }

    // Delete the secret
    await sql`DELETE FROM app_secrets WHERE id = ${secretId}`;

    return Response.json({
      success: true,
      message: `Secret '${secret.secret_key}' deleted from ${secret.app_name}`,
    });
  } catch (error) {
    const status = error?.status || 500;
    if (status === 401 || status === 403) {
      return Response.json({ error: error.message }, { status });
    }

    console.error("Error deleting secret:", error);
    return Response.json(
      { error: "Failed to delete secret", details: error.message },
      { status: 500 },
    );
  }
}
