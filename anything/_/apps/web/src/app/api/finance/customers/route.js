import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const data = await request.json();

    const [customer] = await sql`
      INSERT INTO customers (
        stripe_customer_id, business_name, contact_name, email, phone,
        billing_address, tax_id, customer_type, status, metadata
      ) VALUES (
        ${data.stripe_customer_id || null},
        ${data.business_name || null},
        ${data.contact_name || null},
        ${data.email},
        ${data.phone || null},
        ${JSON.stringify(data.billing_address || {})},
        ${data.tax_id || null},
        ${data.customer_type || "individual"},
        ${data.status || "active"},
        ${JSON.stringify(data.metadata || {})}
      )
      RETURNING *
    `;

    return Response.json({ success: true, customer });
  } catch (error) {
    console.error("Error creating customer:", error);
    return Response.json(
      { error: "Failed to create customer", details: error.message },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const customer_type = searchParams.get("customer_type");
    const search = searchParams.get("search");

    let query = sql`SELECT * FROM customers WHERE 1=1`;

    if (status) {
      query = sql`${query} AND status = ${status}`;
    }

    if (customer_type) {
      query = sql`${query} AND customer_type = ${customer_type}`;
    }

    if (search) {
      query = sql`${query} AND (
        LOWER(business_name) LIKE LOWER(${"%" + search + "%"}) OR
        LOWER(contact_name) LIKE LOWER(${"%" + search + "%"}) OR
        LOWER(email) LIKE LOWER(${"%" + search + "%"})
      )`;
    }

    query = sql`${query} ORDER BY created_at DESC`;

    const customers = await query;

    return Response.json({ success: true, customers });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return Response.json(
      { error: "Failed to fetch customers", details: error.message },
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
        { error: "Customer ID is required" },
        { status: 400 },
      );
    }

    // Build dynamic update query
    const setFields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(updateData).forEach(([key, value]) => {
      if (key === "billing_address" || key === "metadata") {
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

    const [customer] = await sql(
      `UPDATE customers SET ${setFields.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      values,
    );

    if (!customer) {
      return Response.json({ error: "Customer not found" }, { status: 404 });
    }

    return Response.json({ success: true, customer });
  } catch (error) {
    console.error("Error updating customer:", error);
    return Response.json(
      { error: "Failed to update customer", details: error.message },
      { status: 500 },
    );
  }
}
