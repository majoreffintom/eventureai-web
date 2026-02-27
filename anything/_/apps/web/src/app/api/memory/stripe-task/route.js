import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const {
      task,
      priority = "medium",
      category = "stripe_configuration",
    } = await request.json();

    // Find or create a cluster for Stripe/billing tasks
    let [cluster] = await sql`
      SELECT * FROM sub_index_clusters 
      WHERE cluster_name = 'Stripe Configuration Tasks'
    `;

    if (!cluster) {
      // First, ensure we have a category for business/billing tasks
      let [bizCategory] = await sql`
        SELECT * FROM index_categories 
        WHERE name = 'Business Operations' AND intent_type = 'task_management'
      `;

      if (!bizCategory) {
        [bizCategory] = await sql`
          INSERT INTO index_categories (name, intent_type, complexity_level, description)
          VALUES ('Business Operations', 'task_management', 'medium', 'Tasks related to business setup, billing, and operations')
          RETURNING *
        `;
      }

      [cluster] = await sql`
        INSERT INTO sub_index_clusters (
          index_category_id, cluster_name, relationship_type, confidence_level, 
          context_layer, semantic_keywords
        ) VALUES (
          ${bizCategory.id}, 
          'Stripe Configuration Tasks', 
          'operational_todo', 
          8, 
          'implementation', 
          ARRAY['stripe', 'billing', 'invoicing', 'payments', 'webhooks', 'configuration']
        )
        RETURNING *
      `;
    }

    // Create the memory entry
    const [memoryEntry] = await sql`
      INSERT INTO memory_entries (
        sub_index_cluster_id, 
        content, 
        reasoning_chain,
        user_intent_analysis,
        cross_domain_connections,
        session_context
      ) VALUES (
        ${cluster.id},
        ${task},
        'User identified incomplete Stripe webhook configuration that needs attention before production invoicing',
        'Task management - user wants to remember specific Stripe configuration steps for future completion',
        ARRAY['stripe_webhooks', 'payment_processing', 'invoice_automation', 'business_operations'],
        'STRIPE configuration planning session - webhook setup phase'
      )
      RETURNING *
    `;

    return Response.json({
      success: true,
      memory_id: memoryEntry.id,
      message: "Stripe configuration task saved to memory",
      task_summary:
        "Reminder to configure Stripe webhook event checkboxes for payments/payouts when setting up invoicing",
    });
  } catch (error) {
    console.error("Error saving Stripe task to memory:", error);
    return Response.json(
      { error: "Failed to save task to memory" },
      { status: 500 },
    );
  }
}
