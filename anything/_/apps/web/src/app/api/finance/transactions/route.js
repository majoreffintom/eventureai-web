import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const data = await request.json();

    const [transaction] = await sql`
      INSERT INTO transactions (
        transaction_id, app_id, customer_id, invoice_id, transaction_type,
        amount, currency, net_amount, fees, revenue_category_id, expense_category_id,
        payment_method, payment_source, status, description, receipt_url,
        metadata, transaction_date, processed_date
      ) VALUES (
        ${data.transaction_id || null},
        ${data.app_id || null},
        ${data.customer_id || null},
        ${data.invoice_id || null},
        ${data.transaction_type},
        ${data.amount},
        ${data.currency || "USD"},
        ${data.net_amount || data.amount},
        ${data.fees || 0},
        ${data.revenue_category_id || null},
        ${data.expense_category_id || null},
        ${data.payment_method || "stripe"},
        ${data.payment_source || null},
        ${data.status || "completed"},
        ${data.description || null},
        ${data.receipt_url || null},
        ${JSON.stringify(data.metadata || {})},
        ${data.transaction_date || new Date().toISOString().split("T")[0]},
        ${data.processed_date || new Date().toISOString()}
      )
      RETURNING *
    `;

    return Response.json({ success: true, transaction });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return Response.json(
      { error: "Failed to create transaction", details: error.message },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const app_id = searchParams.get("app_id");
    const transaction_type = searchParams.get("transaction_type");
    const status = searchParams.get("status");
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");
    const customer_id = searchParams.get("customer_id");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let baseQuery = `
      SELECT 
        t.*,
        c.business_name as customer_name,
        c.contact_name,
        a.name as app_name,
        rc.name as revenue_category_name,
        ec.name as expense_category_name
      FROM transactions t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN apps a ON t.app_id = a.id
      LEFT JOIN revenue_categories rc ON t.revenue_category_id = rc.id
      LEFT JOIN expense_categories ec ON t.expense_category_id = ec.id
      WHERE 1=1
    `;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (app_id) {
      conditions.push(`t.app_id = $${paramCount}`);
      values.push(app_id);
      paramCount++;
    }

    if (transaction_type) {
      conditions.push(`t.transaction_type = $${paramCount}`);
      values.push(transaction_type);
      paramCount++;
    }

    if (status) {
      conditions.push(`t.status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (customer_id) {
      conditions.push(`t.customer_id = $${paramCount}`);
      values.push(customer_id);
      paramCount++;
    }

    if (start_date) {
      conditions.push(`t.transaction_date >= $${paramCount}`);
      values.push(start_date);
      paramCount++;
    }

    if (end_date) {
      conditions.push(`t.transaction_date <= $${paramCount}`);
      values.push(end_date);
      paramCount++;
    }

    if (conditions.length > 0) {
      baseQuery += " AND " + conditions.join(" AND ");
    }

    baseQuery += ` ORDER BY t.transaction_date DESC, t.created_at DESC`;
    baseQuery += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const transactions = await sql(baseQuery, values);

    // Get totals for summary
    let summaryQuery = `
      SELECT 
        transaction_type,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        SUM(net_amount) as total_net_amount,
        SUM(fees) as total_fees
      FROM transactions t
      WHERE 1=1
    `;

    const summaryConditions = [];
    const summaryValues = [];
    let summaryParamCount = 1;

    if (app_id) {
      summaryConditions.push(`t.app_id = $${summaryParamCount}`);
      summaryValues.push(app_id);
      summaryParamCount++;
    }

    if (start_date) {
      summaryConditions.push(`t.transaction_date >= $${summaryParamCount}`);
      summaryValues.push(start_date);
      summaryParamCount++;
    }

    if (end_date) {
      summaryConditions.push(`t.transaction_date <= $${summaryParamCount}`);
      summaryValues.push(end_date);
      summaryParamCount++;
    }

    if (summaryConditions.length > 0) {
      summaryQuery += " AND " + summaryConditions.join(" AND ");
    }

    summaryQuery += ` GROUP BY transaction_type`;

    const summary = await sql(summaryQuery, summaryValues);

    return Response.json({
      success: true,
      transactions,
      summary,
      pagination: {
        limit,
        offset,
        returned: transactions.length,
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return Response.json(
      { error: "Failed to fetch transactions", details: error.message },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;

    if (!id) {
      return Response.json(
        { error: "Transaction ID is required" },
        { status: 400 },
      );
    }

    // Build dynamic update query
    const setFields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(updateData).forEach(([key, value]) => {
      if (key === "metadata") {
        setFields.push(`${key} = $${paramCount}`);
        values.push(JSON.stringify(value));
      } else {
        setFields.push(`${key} = $${paramCount}`);
        values.push(value);
      }
      paramCount++;
    });

    if (setFields.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    setFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const [transaction] = await sql(
      `UPDATE transactions SET ${setFields.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      values,
    );

    if (!transaction) {
      return Response.json({ error: "Transaction not found" }, { status: 404 });
    }

    return Response.json({ success: true, transaction });
  } catch (error) {
    console.error("Error updating transaction:", error);
    return Response.json(
      { error: "Failed to update transaction", details: error.message },
      { status: 500 },
    );
  }
}
