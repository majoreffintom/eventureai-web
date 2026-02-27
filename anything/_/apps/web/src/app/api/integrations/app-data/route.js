import sql from "@/app/api/utils/sql";
import {
  DEFAULT_INDEX_KEY,
  getNextTurnIndex,
  normalizeIndexKeys,
  upsertIndexAndSubindex,
  upsertThread,
  upsertTurn,
} from "@/app/api/utils/memoriaStore";

export async function POST(request) {
  try {
    const {
      app_id,
      data_type,
      auto_capture = false,
      options,
    } = await request.json();

    // Get app details from database
    const [app] = await sql`
      SELECT id, name, domain, api_base_url, app_type, description
      FROM apps
      WHERE id = ${app_id} AND status = 'active'
    `;

    if (!app) {
      return Response.json({ error: "App not found" }, { status: 404 });
    }

    const appData = await fetchAppData(app, data_type, options || {});

    let capture_result = null;
    if (auto_capture) {
      // Automatically capture this data in memory system
      capture_result = await captureAppDataToMemory(appData, app, data_type);
    }

    return Response.json({
      success: true,
      app: app.name,
      domain: app.domain,
      data_type,
      options: options || {},
      data: appData,
      captured_to_memory: auto_capture,
      capture_result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("App data integration error:", error);
    return Response.json(
      { error: "Failed to fetch app data" },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const domain = url.searchParams.get("domain");
    const all_apps = url.searchParams.get("all") === "true";

    if (all_apps) {
      // Fetch data from all active apps
      const apps = await sql`
        SELECT id, name, domain, api_base_url, app_type, description
        FROM apps
        WHERE status = 'active'
        ORDER BY name
      `;

      const results = [];
      for (const app of apps) {
        try {
          const data = await fetchAppData(app, "overview", {});
          results.push({
            app: app.name,
            domain: app.domain,
            type: app.app_type,
            description: app.description,
            data,
            last_updated: new Date().toISOString(),
          });
        } catch (error) {
          results.push({
            app: app.name,
            domain: app.domain,
            type: app.app_type,
            description: app.description,
            error: error.message,
            last_updated: new Date().toISOString(),
          });
        }
      }

      return Response.json({
        success: true,
        total_apps: results.length,
        apps: results,
      });
    }

    if (domain) {
      // Fetch data from specific domain
      const [app] = await sql`
        SELECT id, name, domain, api_base_url, app_type, description
        FROM apps
        WHERE domain = ${domain} AND status = 'active'
      `;

      if (!app) {
        return Response.json({ error: "Domain not found" }, { status: 404 });
      }

      const data = await fetchAppData(app, "full", {});

      return Response.json({
        success: true,
        app: app.name,
        domain: app.domain,
        type: app.app_type,
        description: app.description,
        data,
        timestamp: new Date().toISOString(),
      });
    }

    return Response.json(
      { error: "Specify domain or use all=true" },
      { status: 400 },
    );
  } catch (error) {
    console.error("App data fetch error:", error);
    return Response.json(
      { error: "Failed to fetch app data" },
      { status: 500 },
    );
  }
}

async function fetchAppData(app, dataType = "overview", options = {}) {
  const domain = app.domain;
  const baseUrl = app.api_base_url || `https://${domain}`;

  // Try different data extraction methods
  // NOTE: we try Memoria export first (best for Anything apps, consistent, and supports auth)
  const extractors = [
    () => fetchFromMemoriaExport(baseUrl, app, dataType, options),
    () => fetchFromAPI(baseUrl, app),
    () => scrapeWebsiteData(baseUrl, app),
    () => extractMetadata(baseUrl, app),
    () => checkCommonEndpoints(baseUrl, app),
  ];

  let lastError = null;
  for (const extractor of extractors) {
    try {
      const data = await extractor();
      if (data && Object.keys(data).length > 0) {
        return {
          extraction_method: extractor.name || "unknown",
          ...data,
        };
      }
    } catch (error) {
      lastError = error;
      continue;
    }
  }

  // Return basic info if all extractors fail
  return {
    extraction_method: "basic_info",
    app_name: app.name,
    domain: app.domain,
    type: app.app_type,
    description: app.description,
    status: "data_extraction_limited",
    error: lastError?.message || "No data extraction method succeeded",
  };
}

async function getAppSecret(appId, secretKey) {
  const [row] = await sql`
    SELECT secret_value
    FROM app_secrets
    WHERE app_id = ${appId} AND secret_key = ${secretKey}
    ORDER BY updated_at DESC NULLS LAST, created_at DESC
    LIMIT 1
  `;
  return row?.secret_value || null;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

async function fetchFromMemoriaExport(baseUrl, app, dataType, options = {}) {
  // This is the "SQL sharing" path for Anything apps: DITZL exposes a safe export endpoint,
  // and this hub pulls from it using a per-app secret.
  //
  // Expected endpoints on the remote app:
  // - GET /api/memoria/export/overview
  // - GET /api/memoria/export/full
  // - GET /api/memoria/export/conversations
  // Auth:
  // - Authorization: Bearer <MEMORIA_EXPORT_KEY>

  const exportKey =
    (await getAppSecret(app.id, "MEMORIA_EXPORT_KEY")) ||
    (await getAppSecret(app.id, "EXPORT_KEY"));

  if (!exportKey) {
    throw new Error("No Memoria export key configured for this app");
  }

  const path =
    dataType === "full"
      ? "/api/memoria/export/full"
      : dataType === "conversations"
        ? "/api/memoria/export/conversations"
        : "/api/memoria/export/overview";

  const urlObj = new URL(`${baseUrl}${path}`);

  // If the remote app supports paging/incremental sync, pass through options.
  if (dataType === "conversations") {
    if (options?.since) {
      urlObj.searchParams.set("since", String(options.since));
    }
    if (options?.limit) {
      urlObj.searchParams.set("limit", String(options.limit));
    }
  }

  const response = await fetchWithTimeout(
    urlObj.toString(),
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${exportKey}`,
        "User-Agent": "EventureAI-MemoriaHub/1.0",
      },
    },
    15000,
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Memoria export failed from ${app.domain} [${response.status}] ${response.statusText}: ${text}`,
    );
  }

  const data = await response.json();
  return {
    export_endpoint: path,
    export_url: urlObj.toString(),
    data,
    response_status: response.status,
  };
}

async function fetchFromAPI(baseUrl, app) {
  const apiPaths = [
    "/api/data",
    "/api/v1",
    "/api",
    "/data",
    "/api/status",
    "/api/health",
    "/api/info",
  ];

  for (const path of apiPaths) {
    try {
      const response = await fetchWithTimeout(
        `${baseUrl}${path}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "User-Agent": "EventureAI-DataIntegration/1.0",
          },
        },
        10000,
      );

      if (response.ok) {
        const data = await response.json();
        return {
          api_endpoint: path,
          data,
          response_status: response.status,
        };
      }
    } catch (error) {
      continue;
    }
  }

  throw new Error("No API endpoints found");
}

async function scrapeWebsiteData(baseUrl, app) {
  try {
    const response = await fetchWithTimeout(
      baseUrl,
      {
        headers: {
          "User-Agent": "EventureAI-DataIntegration/1.0",
        },
      },
      10000,
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // Extract useful data from HTML
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const metaDescription = html.match(
      /<meta[^>]*name="description"[^>]*content="([^"]+)"/i,
    );
    const scripts = html.match(/<script[^>]*src="([^"]+)"/gi) || [];
    const links = html.match(/<link[^>]*href="([^"]+)"/gi) || [];

    // Look for React app data
    const reactAppData = extractReactAppData(html);

    return {
      page_title: titleMatch ? titleMatch[1] : "Unknown",
      meta_description: metaDescription ? metaDescription[1] : null,
      is_react_app: html.includes('id="root"') || html.includes("react"),
      script_count: scripts.length,
      link_count: links.length,
      react_data: reactAppData,
      content_analysis: analyzeContent(html, app.description),
    };
  } catch (error) {
    throw new Error(`Website scraping failed: ${error.message}`);
  }
}

async function extractMetadata(baseUrl, app) {
  try {
    const response = await fetchWithTimeout(
      baseUrl,
      {
        method: "HEAD",
      },
      5000,
    );

    return {
      status_code: response.status,
      headers: Object.fromEntries(response.headers),
      server: response.headers.get("server"),
      content_type: response.headers.get("content-type"),
      last_modified: response.headers.get("last-modified"),
      cache_control: response.headers.get("cache-control"),
    };
  } catch (error) {
    throw new Error(`Metadata extraction failed: ${error.message}`);
  }
}

async function checkCommonEndpoints(baseUrl, app) {
  const endpoints = [
    "/robots.txt",
    "/sitemap.xml",
    "/manifest.json",
    "/.well-known/security.txt",
    "/health",
    "/status",
    "/ping",
  ];

  const results = {};

  for (const endpoint of endpoints) {
    try {
      const response = await fetchWithTimeout(
        `${baseUrl}${endpoint}`,
        {},
        5000,
      );

      if (response.ok) {
        const content = await response.text();
        results[endpoint] = {
          status: response.status,
          content_preview: content.slice(0, 200),
          content_type: response.headers.get("content-type"),
        };
      }
    } catch (error) {
      // Ignore errors for individual endpoints
    }
  }

  if (Object.keys(results).length === 0) {
    throw new Error("No common endpoints accessible");
  }

  return {
    accessible_endpoints: results,
    endpoint_count: Object.keys(results).length,
  };
}

function extractReactAppData(html) {
  // Look for common React patterns and data
  const patterns = {
    has_react_root: html.includes('id="root"'),
    has_react_scripts: html.includes("react"),
    has_webpack: html.includes("webpack"),
    has_vite: html.includes("vite"),
    has_next: html.includes("_next"),
    asset_imports: (html.match(/src="[^"]*\.(js|css|png|jpg|svg)"/g) || [])
      .length,
  };

  // Try to extract any JSON data embedded in the HTML
  const jsonMatches = html.match(/<script[^>]*>\s*(\{[^<]+\})\s*<\/script>/gi);
  const embeddedData = [];

  if (jsonMatches) {
    jsonMatches.forEach((match) => {
      try {
        const jsonStr = match.replace(/<\/?script[^>]*>/g, "").trim();
        const parsed = JSON.parse(jsonStr);
        embeddedData.push(parsed);
      } catch (error) {
        // Ignore invalid JSON
      }
    });
  }

  return {
    patterns,
    embedded_data: embeddedData,
    estimated_bundle_size: patterns.asset_imports * 50, // Rough estimate in KB
  };
}

function analyzeContent(html, appDescription) {
  const textContent = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const wordCount = textContent.split(" ").length;

  // Check if content matches app description
  const descriptionWords = appDescription.toLowerCase().split(" ");
  const contentLower = textContent.toLowerCase();
  const matchingWords = descriptionWords.filter(
    (word) => word.length > 3 && contentLower.includes(word),
  );

  return {
    word_count: wordCount,
    description_match_score: matchingWords.length / descriptionWords.length,
    matching_keywords: matchingWords,
    content_preview: textContent.slice(0, 300),
  };
}

async function captureAppDataToMemory(appData, app, dataType) {
  try {
    // If we successfully fetched Memoria export conversations, normalize them into the hub's canonical tables.
    const exportEndpoint = appData?.export_endpoint;
    const exportedPayload = appData?.data;
    const exportedConversations = exportedPayload?.conversations;

    const isConversationExport =
      dataType === "conversations" &&
      typeof exportEndpoint === "string" &&
      exportEndpoint.includes("/api/memoria/export/conversations") &&
      Array.isArray(exportedConversations);

    if (isConversationExport) {
      const imported = await captureExportedConversationsToMemoria({
        app,
        conversations: exportedConversations,
      });

      const memoryContent = `Imported conversations from ${app.name} (${app.domain}) via ${exportEndpoint}. Imported threads: ${imported.threads}, turns: ${imported.turns}.`;

      await sql`
        INSERT INTO memory_entries (
          sub_index_cluster_id,
          content,
          reasoning_chain,
          user_intent_analysis,
          cross_domain_connections,
          usage_frequency,
          session_context,
          created_at,
          accessed_at
        ) VALUES (
          NULL,
          ${memoryContent},
          ${"Automated Memoria conversation import"},
          ${"System imported normalized conversations from a connected app"},
          ${[app.domain, app.app_type, "memoria_export", "conversations"]},
          1,
          ${"Memoria Export Import"},
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `;

      console.log(
        `Imported Memoria conversations from ${app.name}: threads=${imported.threads}, turns=${imported.turns}`,
      );

      return { type: "memoria_conversations_import", imported };
    }

    const memoryContent = `App Data Capture - ${app.name} (${app.domain}): ${JSON.stringify(appData, null, 2)}`;

    await sql`
      INSERT INTO memory_entries (
        sub_index_cluster_id,
        content,
        reasoning_chain,
        user_intent_analysis,
        cross_domain_connections,
        usage_frequency,
        session_context,
        created_at,
        accessed_at
      ) VALUES (
        NULL,
        ${memoryContent},
        ${"Automated app data integration and capture"},
        ${"System automatically captured data from business application"},
        ${[app.domain, app.app_type, "business_app", "data_integration"]},
        1,
        ${"App Data Integration"},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `;

    console.log(`Captured data from ${app.name} to memory system`);
    return { type: "app_data_capture" };
  } catch (error) {
    console.error(`Failed to capture ${app.name} data to memory:`, error);
    return { type: "error", error: error.message };
  }
}

async function captureExportedConversationsToMemoria({ app, conversations }) {
  // This writes directly into the canonical Memoria tables of the hub.
  // It is safe because we only accept data from the remote app's Memoria export endpoint.
  let threads = 0;
  let turns = 0;

  for (const convo of conversations) {
    const appSource = convo?.appSource || app.domain || app.name || "unknown";
    const externalId = convo?.externalId;
    if (!externalId) {
      continue;
    }

    const { indexKey, subindexKey } = normalizeIndexKeys(
      {
        index: convo?.index || DEFAULT_INDEX_KEY,
        subindex: convo?.subindex || appSource,
      },
      appSource,
    );

    const { memoriaIndexId, memoriaSubindexId } = await upsertIndexAndSubindex({
      indexKey,
      subindexKey,
    });

    const threadId = await upsertThread({
      externalId,
      appSource,
      title: convo?.title || null,
      context: convo?.context || null,
      memoriaIndexId,
      memoriaSubindexId,
      metadata: convo?.metadata || {},
    });

    if (!threadId) {
      continue;
    }
    threads += 1;

    const turnsArr = Array.isArray(convo?.turns) ? convo.turns : [];
    for (const t of turnsArr) {
      const idx =
        typeof t?.turnIndex === "number"
          ? t.turnIndex
          : typeof t?.turn_index === "number"
            ? t.turn_index
            : await getNextTurnIndex(threadId);

      const externalTurnId =
        t?.externalTurnId ||
        t?.external_turn_id ||
        `${externalId}:${String(idx)}`;

      const turnId = await upsertTurn({
        threadId,
        externalTurnId,
        turnIndex: idx,
        userText: t?.userText || t?.user_text || null,
        assistantThinkingSummary:
          t?.assistantThinkingSummary || t?.assistant_thinking_summary || null,
        assistantSynthesis:
          t?.assistantSynthesis || t?.assistant_synthesis || null,
        codeSummary: t?.codeSummary || t?.code_summary || null,
        assistantResponse:
          t?.assistantResponse || t?.assistant_response || null,
        rawMessages: t?.rawMessages || t?.raw_messages || null,
        metadata: t?.metadata || {},
      });

      if (turnId) {
        turns += 1;
      }
    }
  }

  return { threads, turns };
}
