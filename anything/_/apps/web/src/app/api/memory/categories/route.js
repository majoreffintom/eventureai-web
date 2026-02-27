import sql from "@/app/api/utils/sql";

export async function GET() {
  try {
    const categories = await sql`
      SELECT 
        ic.*,
        COUNT(sic.id) as cluster_count
      FROM index_categories ic
      LEFT JOIN sub_index_clusters sic ON ic.id = sic.index_category_id
      GROUP BY ic.id
      ORDER BY ic.created_at DESC
    `;

    return Response.json({ categories });
  } catch (error) {
    console.error("Error fetching index categories:", error);
    return Response.json(
      { error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, intent_type, complexity_level, description } = body;

    if (!name || !intent_type || !complexity_level) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const [category] = await sql`
      INSERT INTO index_categories (name, intent_type, complexity_level, description)
      VALUES (${name}, ${intent_type}, ${complexity_level}, ${description})
      RETURNING *
    `;

    return Response.json({ category });
  } catch (error) {
    console.error("Error creating index category:", error);
    return Response.json(
      { error: "Failed to create category" },
      { status: 500 },
    );
  }
}
