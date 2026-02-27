import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const network = searchParams.get("network");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit")) || 50;
    const offset = parseInt(searchParams.get("offset")) || 0;

    // Build dynamic query based on filters
    let whereConditions = [];
    let values = [];
    let paramCount = 1;

    if (network) {
      whereConditions.push(`blockchain_network = $${paramCount}`);
      values.push(network);
      paramCount++;
    }

    if (status) {
      whereConditions.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (type) {
      whereConditions.push(`transaction_type = $${paramCount}`);
      values.push(type);
      paramCount++;
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    const query = `
      SELECT 
        id,
        transaction_hash,
        blockchain_network,
        transaction_type,
        amount,
        currency,
        from_address,
        to_address,
        block_number,
        gas_used,
        gas_price,
        status,
        metadata,
        created_at,
        updated_at
      FROM blockchain_ledger 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    values.push(limit, offset);
    const transactions = await sql(query, values);

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM blockchain_ledger ${whereClause}`;
    const countResult = await sql(countQuery, values.slice(0, -2)); // Remove limit and offset
    const total = parseInt(countResult[0].total);

    // Get summary statistics
    const statsQuery = `
      SELECT 
        blockchain_network,
        transaction_type,
        status,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM blockchain_ledger 
      ${whereClause}
      GROUP BY blockchain_network, transaction_type, status
      ORDER BY count DESC
    `;
    const stats = await sql(statsQuery, values.slice(0, -2));

    return Response.json({
      success: true,
      transactions,
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
    console.error("Blockchain ledger query failed:", error);

    return Response.json(
      {
        success: false,
        error: "Failed to retrieve blockchain transactions",
        transactions: [],
        pagination: { total: 0, limit: 0, offset: 0, has_more: false },
      },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const {
      transaction_hash,
      blockchain_network,
      transaction_type,
      amount,
      currency,
      from_address,
      to_address,
      block_number,
      gas_used,
      gas_price,
      status = "pending",
      metadata = {},
    } = await request.json();

    if (!transaction_hash || !blockchain_network || !transaction_type) {
      return Response.json(
        {
          error:
            "transaction_hash, blockchain_network, and transaction_type are required",
        },
        { status: 400 },
      );
    }

    // Check if transaction already exists
    const existing = await sql`
      SELECT id FROM blockchain_ledger 
      WHERE transaction_hash = ${transaction_hash}
    `;

    if (existing.length > 0) {
      return Response.json(
        {
          error: "Transaction hash already exists in ledger",
          transaction_id: existing[0].id,
        },
        { status: 409 },
      );
    }

    // Insert new transaction
    const result = await sql`
      INSERT INTO blockchain_ledger (
        transaction_hash,
        blockchain_network,
        transaction_type,
        amount,
        currency,
        from_address,
        to_address,
        block_number,
        gas_used,
        gas_price,
        status,
        metadata,
        created_at,
        updated_at
      ) VALUES (
        ${transaction_hash},
        ${blockchain_network},
        ${transaction_type},
        ${amount || null},
        ${currency || null},
        ${from_address || null},
        ${to_address || null},
        ${block_number || null},
        ${gas_used || null},
        ${gas_price || null},
        ${status},
        ${JSON.stringify(metadata)},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      ) RETURNING *
    `;

    return Response.json({
      success: true,
      transaction: result[0],
      message: "Transaction added to blockchain ledger",
    });
  } catch (error) {
    console.error("Blockchain ledger insert failed:", error);

    return Response.json(
      {
        success: false,
        error: "Failed to add transaction to ledger",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const {
      id,
      transaction_hash,
      status,
      block_number,
      gas_used,
      gas_price,
      metadata,
    } = await request.json();

    if (!id && !transaction_hash) {
      return Response.json(
        {
          error: "Either id or transaction_hash is required",
        },
        { status: 400 },
      );
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (status) {
      updates.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (block_number) {
      updates.push(`block_number = $${paramCount}`);
      values.push(block_number);
      paramCount++;
    }

    if (gas_used) {
      updates.push(`gas_used = $${paramCount}`);
      values.push(gas_used);
      paramCount++;
    }

    if (gas_price) {
      updates.push(`gas_price = $${paramCount}`);
      values.push(gas_price);
      paramCount++;
    }

    if (metadata) {
      updates.push(`metadata = $${paramCount}`);
      values.push(JSON.stringify(metadata));
      paramCount++;
    }

    if (updates.length === 0) {
      return Response.json(
        {
          error: "No updates provided",
        },
        { status: 400 },
      );
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const whereClause = id
      ? `id = $${paramCount}`
      : `transaction_hash = $${paramCount}`;
    values.push(id || transaction_hash);

    const query = `
      UPDATE blockchain_ledger 
      SET ${updates.join(", ")} 
      WHERE ${whereClause} 
      RETURNING *
    `;

    const result = await sql(query, values);

    if (result.length === 0) {
      return Response.json(
        {
          error: "Transaction not found",
        },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      transaction: result[0],
      message: "Transaction updated successfully",
    });
  } catch (error) {
    console.error("Blockchain ledger update failed:", error);

    return Response.json(
      {
        success: false,
        error: "Failed to update transaction",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
