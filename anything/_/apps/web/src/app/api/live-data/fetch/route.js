import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const appId = url.searchParams.get("app_id");
    const endpoint = url.searchParams.get("endpoint");
    const autoCapture = url.searchParams.get("auto_capture") === "true";

    console.log(`🚀 LIVE DATA FETCH - App: ${appId}, Endpoint: ${endpoint}`);

    if (!appId) {
      return Response.json({ error: "app_id required" }, { status: 400 });
    }

    // Get the app from database
    const [app] = await sql`
      SELECT id, name, domain, api_base_url, app_type, metadata
      FROM apps
      WHERE id = ${appId} AND status = 'active'
    `;

    if (!app) {
      return Response.json({ error: "App not found" }, { status: 404 });
    }

    console.log(`🎯 Fetching from: ${app.name} (${app.api_base_url})`);

    // Build the full URL
    let fetchUrl = app.api_base_url;
    if (endpoint && endpoint !== "/") {
      fetchUrl += endpoint.startsWith("/") ? endpoint : "/" + endpoint;
    }

    console.log(`📡 Making request to: ${fetchUrl}`);

    // Make the actual HTTP request
    const response = await fetch(fetchUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "EventureAI-LiveDataFetch/1.0",
      },
      timeout: 10000,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const textData = await response.text();
      data = { raw_response: textData, content_type: contentType };
    }

    const result = {
      success: true,
      app: {
        id: app.id,
        name: app.name,
        domain: app.domain,
        type: app.app_type,
      },
      request: {
        url: fetchUrl,
        method: "GET",
        timestamp: new Date().toISOString(),
      },
      response: {
        status: response.status,
        content_type: contentType,
        data: data,
      },
      captured_to_memory: false,
    };

    // Auto-capture to memory system if requested
    if (autoCapture) {
      try {
        const memoryContent = `LIVE DATA FETCH from ${app.name}:\n\nURL: ${fetchUrl}\nData: ${JSON.stringify(data, null, 2).slice(0, 1500)}${JSON.stringify(data, null, 2).length > 1500 ? "...[truncated]" : ""}`;

        await sql`
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
            ${memoryContent},
            ${"Automatic live data capture from external API"},
            ${"System autonomously fetched and stored live external data"},
            ${[app.domain, app.app_type, "live_data", "external_api", "auto_capture"]},
            ${"Live Data Integration"},
            1,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          )
        `;

        result.captured_to_memory = true;
        console.log(`💾 Data captured to memory system`);
      } catch (memoryError) {
        console.error("Memory capture failed:", memoryError);
        result.memory_error = memoryError.message;
      }
    }

    console.log(`✅ Successfully fetched data from ${app.name}`);
    return Response.json(result);
  } catch (error) {
    console.error("Live data fetch error:", error);
    return Response.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const {
      app_id,
      endpoint,
      method = "GET",
      headers = {},
      body = null,
      auto_capture = true,
    } = await request.json();

    console.log(
      `🚀 LIVE DATA POST - App: ${app_id}, Method: ${method}, Endpoint: ${endpoint}`,
    );

    // Get the app
    const [app] = await sql`
      SELECT id, name, domain, api_base_url, app_type, metadata
      FROM apps  
      WHERE id = ${app_id} AND status = 'active'
    `;

    if (!app) {
      return Response.json({ error: "App not found" }, { status: 404 });
    }

    // Build the URL
    let fetchUrl = app.api_base_url;
    if (endpoint && endpoint !== "/") {
      fetchUrl += endpoint.startsWith("/") ? endpoint : "/" + endpoint;
    }

    console.log(`📡 ${method} request to: ${fetchUrl}`);

    // Make the request
    const requestOptions = {
      method: method,
      headers: {
        Accept: "application/json",
        "User-Agent": "EventureAI-LiveDataFetch/1.0",
        ...headers,
      },
      timeout: 15000,
    };

    if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
      requestOptions.body =
        typeof body === "string" ? body : JSON.stringify(body);
      if (!headers["Content-Type"]) {
        requestOptions.headers["Content-Type"] = "application/json";
      }
    }

    const response = await fetch(fetchUrl, requestOptions);

    const contentType = response.headers.get("content-type");
    let data;

    try {
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const textData = await response.text();
        data = { raw_response: textData, content_type: contentType };
      }
    } catch (parseError) {
      data = {
        parse_error: "Could not parse response",
        raw_status: response.status,
      };
    }

    const result = {
      success: response.ok,
      app: {
        id: app.id,
        name: app.name,
        domain: app.domain,
      },
      request: {
        url: fetchUrl,
        method: method,
        headers: requestOptions.headers,
        body: requestOptions.body,
        timestamp: new Date().toISOString(),
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        content_type: contentType,
        data: data,
      },
      captured_to_memory: false,
    };

    // Auto-capture successful requests
    if (auto_capture && response.ok) {
      try {
        const memoryContent = `LIVE ${method} REQUEST to ${app.name}:\n\nURL: ${fetchUrl}\nResponse Status: ${response.status}\nData: ${JSON.stringify(data, null, 2).slice(0, 1500)}${JSON.stringify(data, null, 2).length > 1500 ? "...[truncated]" : ""}`;

        await sql`
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
            ${memoryContent},
            ${"Live API request with auto-capture"},
            ${"System executed live API call and captured results"},
            ${[app.domain, method.toLowerCase(), "live_api", "external_request"]},
            ${"Live API Integration"},
            1,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          )
        `;

        result.captured_to_memory = true;
      } catch (memoryError) {
        result.memory_error = memoryError.message;
      }
    }

    console.log(`✅ ${method} request completed - Status: ${response.status}`);
    return Response.json(result);
  } catch (error) {
    console.error("Live API request error:", error);
    return Response.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

// Quick endpoint to test all apps
export async function PUT(request) {
  try {
    console.log("🧪 Testing ALL registered apps...");

    const apps = await sql`
      SELECT id, name, domain, api_base_url, metadata
      FROM apps
      WHERE status = 'active' AND app_type = 'external_api'
      ORDER BY name
    `;

    const results = [];

    for (const app of apps) {
      try {
        // Try the base URL or a simple endpoint
        let testUrl = app.api_base_url;

        // Add test endpoints based on metadata
        if (app.metadata?.endpoints?.length > 0) {
          testUrl += app.metadata.endpoints[0];
        }

        console.log(`Testing ${app.name}: ${testUrl}`);

        const response = await fetch(testUrl, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "User-Agent": "EventureAI-LiveDataFetch/1.0",
          },
          timeout: 8000,
        });

        const contentType = response.headers.get("content-type");
        let data;

        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          const text = await response.text();
          data = { preview: text.slice(0, 200) };
        }

        results.push({
          app: app.name,
          domain: app.domain,
          test_url: testUrl,
          status: response.status,
          success: response.ok,
          response_preview: JSON.stringify(data).slice(0, 300),
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        results.push({
          app: app.name,
          domain: app.domain,
          test_url: app.api_base_url,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    }

    const summary = {
      total_tested: results.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      success_rate: `${Math.round((results.filter((r) => r.success).length / results.length) * 100)}%`,
    };

    console.log(
      `🎯 Test complete: ${summary.successful}/${summary.total_tested} apps working`,
    );

    return Response.json({
      success: true,
      summary,
      results,
      next_action:
        "Use GET /api/live-data/fetch?app_id=X&endpoint=/path to fetch specific data",
    });
  } catch (error) {
    console.error("App testing error:", error);
    return Response.json(
      {
        error: "Failed to test apps",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
