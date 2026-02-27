import sql from "@/app/api/utils/sql";

export async function GET() {
  const customers = await sql`
    SELECT id, name, phone, email
    FROM customers
    WHERE is_deleted = false
    ORDER BY created_at DESC
    LIMIT 200;
  `;

  return Response.json({ customers });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));

  const name = body?.name?.trim();
  const phone = body?.phone?.trim();
  const email = body?.email ? String(body.email).trim() : null;

  if (!name || !phone) {
    return new Response("name and phone are required", { status: 400 });
  }

  try {
    const [row] = await sql`
      INSERT INTO customers (name, phone, email, customer_source)
      VALUES (${name}, ${phone}, ${email}, 'web_form')
      RETURNING id, name, phone, email;
    `;

    return Response.json({ customer: row });
  } catch (e) {
    // likely unique phone constraint
    console.error(e);
    return new Response("Could not create customer", { status: 400 });
  }
}
