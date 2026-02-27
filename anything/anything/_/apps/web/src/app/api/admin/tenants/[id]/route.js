import sql from "@/app/api/utils/sql";
import requireAdmin from "@/app/api/utils/requireAdmin.js";

export async function GET(request, { params }) {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) {
      return guard.response;
    }

    const { id } = params;
    const tenantId = parseInt(id, 10);

    if (isNaN(tenantId)) {
      return Response.json({ error: "Invalid tenant ID" }, { status: 400 });
    }

    const rows = await sql(
      `SELECT id, name, slug, description, domain, is_active, config, created_at, updated_at
         FROM tenants
        WHERE id = $1`,
      [tenantId]
    );

    if (!rows || rows.length === 0) {
      return Response.json({ error: "Tenant not found" }, { status: 404 });
    }

    return Response.json({ tenant: rows[0] });
  } catch (error) {
    console.error("GET /api/admin/tenants/[id] error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) {
      return guard.response;
    }

    const { id } = params;
    const tenantId = parseInt(id, 10);

    if (isNaN(tenantId)) {
      return Response.json({ error: "Invalid tenant ID" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const { name, slug, description, domain, is_active, config } = body || {};

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (typeof name === "string") {
      updates.push(`name = $${paramIndex++}`);
      values.push(name.trim());
    }

    if (typeof slug === "string") {
      updates.push(`slug = $${paramIndex++}`);
      values.push(slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'));
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(typeof description === "string" ? description.trim() : null);
    }

    if (domain !== undefined) {
      updates.push(`domain = $${paramIndex++}`);
      values.push(typeof domain === "string" ? domain.trim() : null);
    }

    if (typeof is_active === "boolean") {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }

    if (config !== undefined) {
      updates.push(`config = $${paramIndex++}`);
      values.push(JSON.stringify(config));
    }

    if (updates.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.push(`updated_at = NOW()`);
    values.push(tenantId);

    const query = `
      UPDATE tenants
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name, slug, description, domain, is_active, config, created_at, updated_at
    `;

    const rows = await sql(query, values);

    if (!rows || rows.length === 0) {
      return Response.json({ error: "Tenant not found" }, { status: 404 });
    }

    return Response.json({ tenant: rows[0] });
  } catch (error) {
    console.error("PUT /api/admin/tenants/[id] error", error);

    if (error.code === '23505') {
      return Response.json({ error: "Slug or domain already exists" }, { status: 409 });
    }

    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) {
      return guard.response;
    }

    const { id } = params;
    const tenantId = parseInt(id, 10);

    if (isNaN(tenantId)) {
      return Response.json({ error: "Invalid tenant ID" }, { status: 400 });
    }

    const rows = await sql(
      `DELETE FROM tenants WHERE id = $1 RETURNING id`,
      [tenantId]
    );

    if (!rows || rows.length === 0) {
      return Response.json({ error: "Tenant not found" }, { status: 404 });
    }

    return Response.json({ success: true, id: tenantId });
  } catch (error) {
    console.error("DELETE /api/admin/tenants/[id] error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
