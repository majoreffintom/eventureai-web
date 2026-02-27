import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const application_id = searchParams.get("application_id");
    const status = searchParams.get("status");
    const deployment_type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit")) || 50;
    const offset = parseInt(searchParams.get("offset")) || 0;

    // Build dynamic query
    let whereConditions = [];
    let values = [];
    let paramCount = 1;

    if (application_id) {
      whereConditions.push(`dh.application_id = $${paramCount}`);
      values.push(parseInt(application_id));
      paramCount++;
    }

    if (status) {
      whereConditions.push(`dh.status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (deployment_type) {
      whereConditions.push(`dh.deployment_type = $${paramCount}`);
      values.push(deployment_type);
      paramCount++;
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    const query = `
      SELECT 
        dh.id,
        dh.application_id,
        ba.name as application_name,
        ba.url as application_url,
        dh.version,
        dh.deployment_type,
        dh.description,
        dh.changes_summary,
        dh.deployed_by,
        dh.status,
        dh.rollback_version,
        dh.deployment_duration_seconds,
        dh.metadata,
        dh.created_at,
        dh.updated_at
      FROM deployment_history dh
      LEFT JOIN business_applications ba ON dh.application_id = ba.id
      ${whereClause}
      ORDER BY dh.created_at DESC 
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    values.push(limit, offset);
    const deployments = await sql(query, values);

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM deployment_history dh ${whereClause}`;
    const countResult = await sql(countQuery, values.slice(0, -2));
    const total = parseInt(countResult[0].total);

    // Get deployment statistics
    const statsQuery = `
      SELECT 
        deployment_type,
        status,
        COUNT(*) as count,
        AVG(deployment_duration_seconds) as avg_duration
      FROM deployment_history 
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY deployment_type, status
      ORDER BY count DESC
    `;
    const stats = await sql(statsQuery);

    return Response.json({
      success: true,
      deployments,
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + limit < total,
      },
      statistics: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Deployment history query failed:", error);

    return Response.json(
      {
        success: false,
        error: "Failed to retrieve deployment history",
        deployments: [],
        pagination: { total: 0, limit: 0, offset: 0, has_more: false },
      },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const {
      application_id,
      version,
      deployment_type,
      description,
      changes_summary,
      deployed_by = "AI Operating System",
      metadata = {},
    } = await request.json();

    if (!application_id || !version || !deployment_type) {
      return Response.json(
        {
          error: "application_id, version, and deployment_type are required",
        },
        { status: 400 },
      );
    }

    // Verify application exists
    const app = await sql`
      SELECT id, name, url FROM business_applications 
      WHERE id = ${application_id}
    `;

    if (app.length === 0) {
      return Response.json(
        {
          error: "Application not found",
        },
        { status: 404 },
      );
    }

    // Create deployment record
    const result = await sql`
      INSERT INTO deployment_history (
        application_id,
        version,
        deployment_type,
        description,
        changes_summary,
        deployed_by,
        status,
        metadata,
        created_at,
        updated_at
      ) VALUES (
        ${application_id},
        ${version},
        ${deployment_type},
        ${description || null},
        ${changes_summary || null},
        ${deployed_by},
        'in_progress',
        ${JSON.stringify(metadata)},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      ) RETURNING *
    `;

    const deploymentId = result[0].id;

    // Start deployment process asynchronously
    processDeployment(deploymentId, app[0], result[0]);

    return Response.json({
      success: true,
      deployment_id: deploymentId,
      deployment: result[0],
      message: "Deployment initiated successfully",
    });
  } catch (error) {
    console.error("Deployment initiation failed:", error);

    return Response.json(
      {
        success: false,
        error: "Failed to initiate deployment",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const {
      deployment_id,
      status,
      rollback_version,
      deployment_duration_seconds,
      metadata,
    } = await request.json();

    if (!deployment_id) {
      return Response.json(
        {
          error: "deployment_id is required",
        },
        { status: 400 },
      );
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (status) {
      updates.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (rollback_version) {
      updates.push(`rollback_version = $${paramCount}`);
      values.push(rollback_version);
      paramCount++;
    }

    if (deployment_duration_seconds) {
      updates.push(`deployment_duration_seconds = $${paramCount}`);
      values.push(deployment_duration_seconds);
      paramCount++;
    }

    if (metadata) {
      updates.push(`metadata = $${paramCount}`);
      values.push(JSON.stringify(metadata));
      paramCount++;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE deployment_history 
      SET ${updates.join(", ")} 
      WHERE id = $${paramCount} 
      RETURNING *
    `;

    values.push(deployment_id);
    const result = await sql(query, values);

    if (result.length === 0) {
      return Response.json(
        {
          error: "Deployment not found",
        },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      deployment: result[0],
      message: "Deployment updated successfully",
    });
  } catch (error) {
    console.error("Deployment update failed:", error);

    return Response.json(
      {
        success: false,
        error: "Failed to update deployment",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

async function processDeployment(deploymentId, application, deployment) {
  const startTime = Date.now();

  try {
    // Simulate deployment steps
    const steps = [
      "Preparing deployment package",
      "Backing up current version",
      "Deploying new version",
      "Running health checks",
      "Finalizing deployment",
    ];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      // Update progress
      await sql`
        UPDATE deployment_history 
        SET 
          metadata = ${JSON.stringify({
            ...JSON.parse(deployment.metadata || "{}"),
            current_step: step,
            progress_percentage: Math.round(((i + 1) / steps.length) * 100),
            last_updated: new Date().toISOString(),
          })},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${deploymentId}
      `;

      // Simulate processing time
      await new Promise((resolve) =>
        setTimeout(resolve, Math.floor(Math.random() * 3000) + 1000),
      );
    }

    // Simulate success/failure (95% success rate)
    const success = Math.random() > 0.05;
    const endTime = Date.now();
    const durationSeconds = Math.floor((endTime - startTime) / 1000);

    if (success) {
      await sql`
        UPDATE deployment_history 
        SET 
          status = 'completed',
          deployment_duration_seconds = ${durationSeconds},
          metadata = ${JSON.stringify({
            ...JSON.parse(deployment.metadata || "{}"),
            completed_at: new Date().toISOString(),
            success: true,
            final_health_check: "passed",
          })},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${deploymentId}
      `;

      // Update application status if it has a URL
      if (application.url) {
        await sql`
          UPDATE business_applications 
          SET 
            status = 'healthy',
            metadata = ${JSON.stringify({
              last_deployment: new Date().toISOString(),
              current_version: deployment.version,
              deployment_id: deploymentId,
            })},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${application.id}
        `;
      }
    } else {
      await sql`
        UPDATE deployment_history 
        SET 
          status = 'failed',
          deployment_duration_seconds = ${durationSeconds},
          metadata = ${JSON.stringify({
            ...JSON.parse(deployment.metadata || "{}"),
            failed_at: new Date().toISOString(),
            error_reason: "Deployment verification failed",
            success: false,
          })},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${deploymentId}
      `;
    }
  } catch (error) {
    console.error(`Deployment ${deploymentId} failed:`, error);

    const endTime = Date.now();
    const durationSeconds = Math.floor((endTime - startTime) / 1000);

    await sql`
      UPDATE deployment_history 
      SET 
        status = 'failed',
        deployment_duration_seconds = ${durationSeconds},
        metadata = ${JSON.stringify({
          ...JSON.parse(deployment.metadata || "{}"),
          failed_at: new Date().toISOString(),
          error_reason: error.message,
          success: false,
        })},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${deploymentId}
    `;
  }
}
