import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get("operation");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const from_date = searchParams.get("from_date");
    const to_date = searchParams.get("to_date");
    const limit = parseInt(searchParams.get("limit")) || 100;
    const offset = parseInt(searchParams.get("offset")) || 0;

    // Build dynamic query
    let whereConditions = [];
    let values = [];
    let paramCount = 1;

    if (operation) {
      whereConditions.push(`operation_type = $${paramCount}`);
      values.push(operation);
      paramCount++;
    }

    if (status) {
      whereConditions.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (priority) {
      whereConditions.push(`priority = $${paramCount}`);
      values.push(priority);
      paramCount++;
    }

    if (from_date) {
      whereConditions.push(`created_at >= $${paramCount}`);
      values.push(from_date);
      paramCount++;
    }

    if (to_date) {
      whereConditions.push(`created_at <= $${paramCount}`);
      values.push(to_date);
      paramCount++;
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    const query = `
      SELECT 
        id,
        message_id,
        operation_type,
        from_address,
        to_address,
        cc_address,
        bcc_address,
        subject,
        body_preview,
        attachments,
        status,
        priority,
        metadata,
        created_at,
        updated_at
      FROM mail_server_logs 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    values.push(limit, offset);
    const mailLogs = await sql(query, values);

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM mail_server_logs ${whereClause}`;
    const countResult = await sql(countQuery, values.slice(0, -2));
    const total = parseInt(countResult[0].total);

    // Get mail statistics for the last 24 hours
    const statsQuery = `
      SELECT 
        operation_type,
        status,
        priority,
        COUNT(*) as count
      FROM mail_server_logs 
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY operation_type, status, priority
      ORDER BY count DESC
    `;
    const stats = await sql(statsQuery);

    // Get current system status
    const systemStatus = await getMailSystemStatus();

    return Response.json({
      success: true,
      mail_logs: mailLogs,
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + limit < total,
      },
      statistics: stats,
      system_status: systemStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Mail server query failed:", error);

    return Response.json(
      {
        success: false,
        error: "Failed to retrieve mail logs",
        mail_logs: [],
        pagination: { total: 0, limit: 0, offset: 0, has_more: false },
      },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const {
      operation_type,
      from_address,
      to_address,
      cc_address,
      bcc_address,
      subject,
      body_preview,
      attachments = 0,
      priority = "normal",
      metadata = {},
    } = await request.json();

    if (!operation_type) {
      return Response.json(
        {
          error: "operation_type is required",
        },
        { status: 400 },
      );
    }

    // Generate unique message ID
    const message_id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Insert mail log entry
    const result = await sql`
      INSERT INTO mail_server_logs (
        message_id,
        operation_type,
        from_address,
        to_address,
        cc_address,
        bcc_address,
        subject,
        body_preview,
        attachments,
        status,
        priority,
        metadata,
        created_at,
        updated_at
      ) VALUES (
        ${message_id},
        ${operation_type},
        ${from_address || null},
        ${Array.isArray(to_address) ? to_address : to_address ? [to_address] : null},
        ${Array.isArray(cc_address) ? cc_address : cc_address ? [cc_address] : null},
        ${Array.isArray(bcc_address) ? bcc_address : bcc_address ? [bcc_address] : null},
        ${subject || null},
        ${body_preview || null},
        ${attachments},
        'processing',
        ${priority},
        ${JSON.stringify(metadata)},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      ) RETURNING *
    `;

    // Process the mail operation asynchronously
    processMailOperation(result[0]);

    return Response.json({
      success: true,
      message_id: message_id,
      mail_log: result[0],
      message: "Mail operation initiated",
    });
  } catch (error) {
    console.error("Mail server operation failed:", error);

    return Response.json(
      {
        success: false,
        error: "Failed to initiate mail operation",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const { message_id, id, status, metadata } = await request.json();

    if (!message_id && !id) {
      return Response.json(
        {
          error: "Either message_id or id is required",
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

    if (metadata) {
      updates.push(`metadata = $${paramCount}`);
      values.push(JSON.stringify(metadata));
      paramCount++;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const whereClause = id
      ? `id = $${paramCount}`
      : `message_id = $${paramCount}`;
    values.push(id || message_id);

    const query = `
      UPDATE mail_server_logs 
      SET ${updates.join(", ")} 
      WHERE ${whereClause} 
      RETURNING *
    `;

    const result = await sql(query, values);

    if (result.length === 0) {
      return Response.json(
        {
          error: "Mail log entry not found",
        },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      mail_log: result[0],
      message: "Mail log updated successfully",
    });
  } catch (error) {
    console.error("Mail log update failed:", error);

    return Response.json(
      {
        success: false,
        error: "Failed to update mail log",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

async function getMailSystemStatus() {
  try {
    const stats = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'processing') as processing,
        COUNT(*) FILTER (WHERE status = 'sent') as sent,
        COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
        COUNT(*) FILTER (WHERE status = 'bounced') as bounced,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') as last_hour,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24_hours
      FROM mail_server_logs
    `;

    const current = stats[0];

    return {
      queue_status: current.processing > 0 ? "active" : "idle",
      pending_operations: parseInt(current.processing),
      success_rate_24h: calculateSuccessRate(current),
      volume_last_hour: parseInt(current.last_hour),
      volume_last_24h: parseInt(current.last_24_hours),
      health: determineMailHealth(current),
    };
  } catch (error) {
    console.error("Mail system status check failed:", error);
    return {
      queue_status: "unknown",
      health: "error",
    };
  }
}

function calculateSuccessRate(stats) {
  const total =
    parseInt(stats.sent) +
    parseInt(stats.delivered) +
    parseInt(stats.bounced) +
    parseInt(stats.failed);
  const successful = parseInt(stats.sent) + parseInt(stats.delivered);

  if (total === 0) return 100;
  return Math.round((successful / total) * 100);
}

function determineMailHealth(stats) {
  const failureRate = parseInt(stats.failed) + parseInt(stats.bounced);
  const total =
    parseInt(stats.sent) +
    parseInt(stats.delivered) +
    parseInt(stats.bounced) +
    parseInt(stats.failed);

  if (total === 0) return "healthy";

  const failurePercentage = (failureRate / total) * 100;

  if (failurePercentage > 20) return "unhealthy";
  if (failurePercentage > 10) return "degraded";
  return "healthy";
}

async function processMailOperation(mailLog) {
  // This would integrate with actual mail server APIs
  // For now, we'll simulate processing
  setTimeout(
    async () => {
      try {
        const success = Math.random() > 0.1; // 90% success rate

        await sql`
        UPDATE mail_server_logs 
        SET 
          status = ${success ? "sent" : "failed"},
          updated_at = CURRENT_TIMESTAMP,
          metadata = ${JSON.stringify({
            ...JSON.parse(mailLog.metadata || "{}"),
            processed_at: new Date().toISOString(),
            processing_duration_ms: Math.floor(Math.random() * 5000),
          })}
        WHERE id = ${mailLog.id}
      `;
      } catch (error) {
        console.error("Mail processing update failed:", error);
      }
    },
    Math.floor(Math.random() * 3000) + 1000,
  ); // 1-4 second delay
}
