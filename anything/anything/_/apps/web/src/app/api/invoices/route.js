import sql from "@/app/api/utils/sql";

export async function GET() {
  const invoices = await sql`
    SELECT
      i.id,
      i.invoice_number,
      i.payment_status,
      ia.total,
      ia.balance_due,
      c.name AS customer_name,
      j.job_number
    FROM invoices i
    JOIN invoice_amounts ia ON ia.invoice_id = i.id
    JOIN customers c ON c.id = i.customer_id
    JOIN jobs j ON j.id = i.job_id
    WHERE i.is_deleted = false
      AND c.is_deleted = false
      AND j.is_deleted = false
    ORDER BY i.created_at DESC
    LIMIT 200;
  `;

  return Response.json({ invoices });
}
