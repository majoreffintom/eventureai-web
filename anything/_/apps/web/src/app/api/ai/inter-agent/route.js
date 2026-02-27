import sql from "@/app/api/utils/sql";

// Core Inter-Agent Communication Protocol
export async function POST(request) {
  try {
    const { action, insight_package, source_app_id, target_apps } =
      await request.json();

    console.log(`🧠 INTER-AGENT: ${action} from app ${source_app_id}`);

    switch (action) {
      case "broadcast_insight":
        return await broadcastInsight(
          insight_package,
          source_app_id,
          target_apps,
        );
      case "request_patterns":
        return await requestPatterns(insight_package, source_app_id);
      case "share_learning":
        return await shareLearning(insight_package, source_app_id);
      case "cross_pollinate":
        return await crossPollinate(insight_package, source_app_id);
      default:
        return Response.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Inter-agent communication error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Broadcast an insight to relevant apps
async function broadcastInsight(
  insight_package,
  source_app_id,
  target_apps = null,
) {
  const {
    insight_type,
    pattern_data,
    confidence_level,
    domain_tags,
    transferability_score,
    raw_insight,
  } = insight_package;

  console.log(
    `📡 Broadcasting ${insight_type} insight (confidence: ${confidence_level})`,
  );

  // Get source app info
  const [sourceApp] = await sql`
    SELECT name, app_type, metadata FROM apps WHERE id = ${source_app_id}
  `;

  // Determine target apps if not specified
  let targetApps = [];
  if (target_apps) {
    targetApps = await sql`
      SELECT id, name, app_type, metadata FROM apps 
      WHERE id = ANY(${target_apps}) AND status = 'active'
    `;
  } else {
    // Auto-discover relevant apps based on domain tags and transferability
    targetApps = await sql`
      SELECT id, name, app_type, metadata FROM apps 
      WHERE status = 'active' AND id != ${source_app_id}
      AND (
        app_type = 'internal' OR 
        metadata ? 'ai_enabled' OR
        metadata ? 'learning_system'
      )
    `;
  }

  const broadcasts = [];

  for (const targetApp of targetApps) {
    try {
      // Calculate relevance score for this target
      const relevance = calculateRelevance(
        sourceApp,
        targetApp,
        domain_tags,
        transferability_score,
      );

      if (relevance < 0.3) continue; // Skip low relevance

      // Translate insight into target app's context
      const translatedInsight = await translateInsight(
        insight_package,
        sourceApp,
        targetApp,
        relevance,
      );

      // Store the inter-agent communication
      const [communication] = await sql`
        INSERT INTO inter_agent_communications (
          source_app_id,
          target_app_id,
          insight_type,
          original_insight,
          translated_insight,
          relevance_score,
          transferability_score,
          confidence_level,
          domain_bridge,
          status,
          created_at
        ) VALUES (
          ${source_app_id},
          ${targetApp.id},
          ${insight_type},
          ${JSON.stringify(insight_package)},
          ${JSON.stringify(translatedInsight)},
          ${relevance},
          ${transferability_score},
          ${confidence_level},
          ${JSON.stringify({
            source_domain: sourceApp.app_type,
            target_domain: targetApp.app_type,
            bridge_concepts: domain_tags,
          })},
          'pending',
          CURRENT_TIMESTAMP
        ) RETURNING id
      `;

      broadcasts.push({
        target_app: targetApp.name,
        communication_id: communication.id,
        relevance_score: relevance,
        translated: translatedInsight,
      });

      console.log(
        `✨ Sent to ${targetApp.name} (relevance: ${relevance.toFixed(2)})`,
      );
    } catch (error) {
      console.error(`Failed to send to ${targetApp.name}:`, error);
    }
  }

  return Response.json({
    success: true,
    source_app: sourceApp.name,
    broadcasts_sent: broadcasts.length,
    broadcasts: broadcasts,
    insight_type: insight_type,
    original_confidence: confidence_level,
  });
}

// Request patterns from other apps
async function requestPatterns(request_package, source_app_id) {
  const { pattern_need, context, urgency_level } = request_package;

  console.log(`🔍 Pattern request: ${pattern_need}`);

  // Find apps that might have relevant patterns
  const relevantApps = await sql`
    SELECT DISTINCT a.id, a.name, a.app_type, a.metadata
    FROM apps a
    JOIN memory_entries m ON true
    WHERE a.status = 'active' 
    AND a.id != ${source_app_id}
    AND (
      m.cross_domain_connections && ${[pattern_need]} OR
      m.content ILIKE ${"%" + pattern_need + "%"} OR
      a.metadata ? ${pattern_need}
    )
    LIMIT 10
  `;

  const responses = [];

  for (const app of relevantApps) {
    // Look for matching patterns in their memory
    const patterns = await sql`
      SELECT content, reasoning_chain, cross_domain_connections, usage_frequency
      FROM memory_entries 
      WHERE (
        cross_domain_connections && ${[pattern_need]} OR
        content ILIKE ${"%" + pattern_need + "%"}
      )
      ORDER BY usage_frequency DESC, created_at DESC
      LIMIT 3
    `;

    if (patterns.length > 0) {
      responses.push({
        responding_app: app.name,
        app_type: app.app_type,
        patterns: patterns.map((p) => ({
          insight: p.content.slice(0, 300),
          reasoning: p.reasoning_chain,
          usage_frequency: p.usage_frequency,
          cross_domain_tags: p.cross_domain_connections,
        })),
      });
    }
  }

  // Log the pattern request
  await sql`
    INSERT INTO pattern_requests (
      requesting_app_id,
      pattern_need,
      context,
      urgency_level,
      responses_found,
      created_at
    ) VALUES (
      ${source_app_id},
      ${pattern_need},
      ${context},
      ${urgency_level},
      ${responses.length},
      CURRENT_TIMESTAMP
    )
  `;

  return Response.json({
    success: true,
    pattern_need,
    responses_found: responses.length,
    responses,
  });
}

// Share a learning with the network
async function shareLearning(learning_package, source_app_id) {
  const { learning_type, outcome, confidence, replicability, context } =
    learning_package;

  console.log(`🎓 Sharing learning: ${learning_type}`);

  // Store as a shareable memory entry
  const [memory] = await sql`
    INSERT INTO memory_entries (
      content,
      reasoning_chain,
      user_intent_analysis,
      cross_domain_connections,
      session_context,
      usage_frequency,
      created_at,
      accessed_at
    ) VALUES (
      ${`SHARED LEARNING (${learning_type}): ${outcome}\n\nContext: ${context}\nConfidence: ${confidence}\nReplicability: ${replicability}`},
      ${"Inter-agent learning share"},
      ${"System sharing successful patterns across applications"},
      ${[learning_type, "shared_learning", "cross_app", `app_${source_app_id}`]},
      ${"Inter-Agent Network"},
      0,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    ) RETURNING id
  `;

  // Mark it as available for cross-pollination
  await sql`
    INSERT INTO shared_learnings (
      source_app_id,
      memory_entry_id,
      learning_type,
      confidence_level,
      replicability_score,
      domain_applicability,
      created_at
    ) VALUES (
      ${source_app_id},
      ${memory.id},
      ${learning_type},
      ${confidence},
      ${replicability},
      ${["general", "business", "user_behavior", "optimization"]},
      CURRENT_TIMESTAMP
    )
  `;

  console.log(`💾 Learning shared to network (memory_id: ${memory.id})`);

  return Response.json({
    success: true,
    memory_id: memory.id,
    learning_type,
    network_availability: true,
  });
}

// Cross-pollinate insights between domains
async function crossPollinate(pollination_package, source_app_id) {
  const { source_domain, target_domains, insight_seed } = pollination_package;

  console.log(`🌱 Cross-pollinating from ${source_domain}`);

  // Find apps in target domains
  const targetApps = await sql`
    SELECT id, name, app_type, metadata
    FROM apps
    WHERE app_type = ANY(${target_domains}) 
    AND status = 'active'
    AND id != ${source_app_id}
  `;

  const pollinations = [];

  for (const targetApp of targetApps) {
    // Generate domain-bridging insights
    const bridgedInsight = await bridgeInsightToDomain(
      insight_seed,
      source_domain,
      targetApp.app_type,
      targetApp.metadata,
    );

    // Store the cross-pollination
    const [pollination] = await sql`
      INSERT INTO cross_pollinations (
        source_app_id,
        target_app_id,
        source_domain,
        target_domain,
        original_insight,
        bridged_insight,
        bridge_strength,
        created_at
      ) VALUES (
        ${source_app_id},
        ${targetApp.id},
        ${source_domain},
        ${targetApp.app_type},
        ${JSON.stringify(insight_seed)},
        ${JSON.stringify(bridgedInsight)},
        ${Math.random() * 0.4 + 0.6}, -- Placeholder for actual calculation
        CURRENT_TIMESTAMP
      ) RETURNING id
    `;

    pollinations.push({
      target_app: targetApp.name,
      pollination_id: pollination.id,
      bridged_insight: bridgedInsight,
    });
  }

  return Response.json({
    success: true,
    pollinations_created: pollinations.length,
    pollinations,
  });
}

// Helper functions
function calculateRelevance(
  sourceApp,
  targetApp,
  domainTags,
  transferabilityScore,
) {
  // Calculate how relevant an insight is for a target app
  let relevance = transferabilityScore * 0.5;

  // Same app type gets higher relevance
  if (sourceApp.app_type === targetApp.app_type) relevance += 0.3;

  // Business apps are generally relevant to each other
  if (sourceApp.app_type === "internal" && targetApp.app_type === "internal")
    relevance += 0.2;

  // Domain tag overlap
  const targetDomains = targetApp.metadata?.domains || [];
  const overlap = domainTags.filter((tag) =>
    targetDomains.includes(tag),
  ).length;
  relevance += (overlap / domainTags.length) * 0.3;

  return Math.min(relevance, 1.0);
}

async function translateInsight(
  insightPackage,
  sourceApp,
  targetApp,
  relevance,
) {
  // Translate insight into target app's domain language
  const translated = {
    ...insightPackage,
    translated_for: targetApp.name,
    translation_context: `From ${sourceApp.name} (${sourceApp.app_type}) to ${targetApp.name} (${targetApp.app_type})`,
    relevance_score: relevance,
    suggested_application: generateApplicationSuggestion(
      insightPackage,
      targetApp,
    ),
    confidence_adjusted: insightPackage.confidence_level * relevance,
  };

  return translated;
}

async function bridgeInsightToDomain(
  insightSeed,
  sourceDomain,
  targetDomain,
  targetMetadata,
) {
  // Generate domain-bridging insights
  return {
    original_domain: sourceDomain,
    target_domain: targetDomain,
    bridged_concept: `Applying ${sourceDomain} insight to ${targetDomain} context`,
    adaptation_suggestions: [
      `Consider how this pattern manifests in ${targetDomain}`,
      `Look for analogous structures in your domain`,
      `Test applicability in smaller experiments first`,
    ],
    bridge_confidence: Math.random() * 0.4 + 0.5,
  };
}

function generateApplicationSuggestion(insight, targetApp) {
  const suggestions = [
    `Integrate this pattern into ${targetApp.name}'s core logic`,
    `Test this approach in a feature experiment`,
    `Use this insight to optimize user experience`,
    `Apply this learning to improve business outcomes`,
  ];

  return suggestions[Math.floor(Math.random() * suggestions.length)];
}

export async function GET() {
  // Get inter-agent network status
  try {
    const stats = await sql`
      SELECT 
        COUNT(*) as total_communications,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'processed' THEN 1 END) as processed,
        AVG(relevance_score) as avg_relevance,
        AVG(confidence_level) as avg_confidence
      FROM inter_agent_communications
      WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
    `;

    const activeApps = await sql`
      SELECT COUNT(*) as count FROM apps WHERE status = 'active'
    `;

    return Response.json({
      network_status: "operational",
      active_apps: activeApps[0].count,
      last_24h: stats[0],
      protocols: [
        "broadcast_insight",
        "request_patterns",
        "share_learning",
        "cross_pollinate",
      ],
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
