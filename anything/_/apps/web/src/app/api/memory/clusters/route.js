import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const categoryId = url.searchParams.get("category_id");

    let clusters;
    if (categoryId) {
      clusters = await sql`
        SELECT 
          sic.*,
          ic.name as category_name,
          COUNT(me.id) as memory_count
        FROM sub_index_clusters sic
        LEFT JOIN index_categories ic ON sic.index_category_id = ic.id
        LEFT JOIN memory_entries me ON sic.id = me.sub_index_cluster_id
        WHERE sic.index_category_id = ${categoryId}
        GROUP BY sic.id, ic.name
        ORDER BY sic.confidence_level DESC, sic.updated_at DESC
      `;
    } else {
      clusters = await sql`
        SELECT 
          sic.*,
          ic.name as category_name,
          COUNT(me.id) as memory_count
        FROM sub_index_clusters sic
        LEFT JOIN index_categories ic ON sic.index_category_id = ic.id
        LEFT JOIN memory_entries me ON sic.id = me.sub_index_cluster_id
        GROUP BY sic.id, ic.name
        ORDER BY sic.updated_at DESC
      `;
    }

    return Response.json({ clusters });
  } catch (error) {
    console.error("Error fetching sub-index clusters:", error);
    return Response.json(
      { error: "Failed to fetch clusters" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      index_category_id,
      cluster_name,
      relationship_type,
      confidence_level,
      context_layer,
      semantic_keywords,
    } = body;

    if (
      !index_category_id ||
      !cluster_name ||
      !relationship_type ||
      !context_layer
    ) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const [cluster] = await sql`
      INSERT INTO sub_index_clusters (
        index_category_id, 
        cluster_name, 
        relationship_type, 
        confidence_level, 
        context_layer, 
        semantic_keywords
      )
      VALUES (
        ${index_category_id}, 
        ${cluster_name}, 
        ${relationship_type}, 
        ${confidence_level || 5}, 
        ${context_layer}, 
        ${semantic_keywords || []}
      )
      RETURNING *
    `;

    return Response.json({ cluster });
  } catch (error) {
    console.error("Error creating sub-index cluster:", error);
    return Response.json(
      { error: "Failed to create cluster" },
      { status: 500 },
    );
  }
}
