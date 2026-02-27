import sql from "@/app/api/utils/sql";
import { requireMemoriaAdmin } from "@/app/api/utils/memoriaAdmin";

function normalizeDomain(input) {
  if (!input) {
    return null;
  }

  const raw = String(input).trim();
  if (!raw) {
    return null;
  }

  try {
    // Allow passing full URLs like https://ditzl.com/
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      const u = new URL(raw);
      return u.host;
    }
  } catch {
    // fall through
  }

  // Strip common prefixes and paths if someone pastes "ditzl.com/" etc.
  const withoutProto = raw.replace(/^www\./i, "");
  const withoutPath = withoutProto.split("/")[0];
  return withoutPath;
}

export async function GET(request) {
  try {
    await requireMemoriaAdmin(request);

    // Provide a friendly JSON "help" response when someone visits this route in a browser.
    // (The route is still POST-only for actually writing to the database.)
    const exampleBody = {
      domains: [
        {
          name: "DITZL",
          domain_url: "https://ditzl.com",
          description: "DITZL - source app for cross-app conversations",
          app_type: "internal",
          environment: "production",
          status: "active",
        },
      ],
    };

    return Response.json({
      ok: true,
      route: "/api/apps/add-domains",
      method: "POST",
      note: "This endpoint writes to the database, so you must call it with POST + a JSON body. Visiting in the browser will show this help message.",
      example_fetch: {
        js:
          "fetch('/api/apps/add-domains', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(" +
          JSON.stringify(exampleBody).replace(/"/g, '\\"') +
          ") })",
      },
      example_body: exampleBody,
      presets: [
        "https://ditzl.com",
        "https://rosebudveneer.com",
        "https://bethefirstnft.com",
      ],
    });
  } catch (error) {
    const status = error?.status || 500;
    if (status === 401 || status === 403) {
      return Response.json({ error: error.message }, { status });
    }

    console.error("Error in add-domains GET:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await requireMemoriaAdmin(request);

    const { domains } = await request.json();

    if (!domains || !Array.isArray(domains)) {
      return Response.json(
        { error: "Domains array is required" },
        { status: 400 },
      );
    }

    const results = [];

    for (const domain of domains) {
      const {
        name,
        domain_url,
        description,
        app_type = "internal",
        environment = "production",
        status = "active",
      } = domain;

      const normalizedDomain = normalizeDomain(domain_url);
      if (!normalizedDomain) {
        results.push({
          error: `Invalid domain_url: ${domain_url}`,
          input: domain_url,
        });
        continue;
      }

      // If it already exists, return it instead of creating duplicates.
      const [existing] = await sql`
        SELECT * FROM apps WHERE domain = ${normalizedDomain} LIMIT 1
      `;

      if (existing) {
        results.push({
          app: existing,
          message: `${existing.name} already exists (${normalizedDomain})`,
          already_exists: true,
        });
        continue;
      }

      const appName = name || normalizedDomain;

      // Insert the domain/app
      const [newApp] = await sql`
        INSERT INTO apps (name, domain, description, app_type, environment, status, metadata, created_at, updated_at)
        VALUES (${appName}, ${normalizedDomain}, ${description || null}, ${app_type}, ${environment}, ${status}, '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;

      // Create revenue category for this app
      await sql`
        INSERT INTO revenue_categories (name, app_id, category_type, description, created_at)
        VALUES (${`${appName} Revenue`}, ${newApp.id}, 'subscription', ${`Revenue generated from ${normalizedDomain}`}, CURRENT_TIMESTAMP)
      `;

      // Create expense category for this app
      await sql`
        INSERT INTO expense_categories (name, app_id, category_type, description, budget_monthly, created_at)
        VALUES (${`${appName} Expenses`}, ${newApp.id}, 'operational', ${`Operational costs for ${normalizedDomain}`}, 500.00, CURRENT_TIMESTAMP)
      `;

      results.push({
        app: newApp,
        message: `${appName} added successfully with financial tracking setup`,
      });
    }

    return Response.json({
      success: true,
      message: `${results.length} domain(s) processed`,
      results,
    });
  } catch (error) {
    const status = error?.status || 500;
    if (status === 401 || status === 403) {
      return Response.json({ error: error.message }, { status });
    }

    console.error("Error adding domains:", error);
    return Response.json(
      {
        error: "Failed to add domains",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
