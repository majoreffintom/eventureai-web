import { defineTool } from "../base.js";
import { z } from "zod";

/**
 * Tool for adding a component to the visual builder
 */
export const addComponentTool = defineTool({
  name: "add_component",
  description: "Add a new UI component to the canvas. Types: hero_section, card, text, button, container, navbar, footer, grid, heading, image, flex, section, divider, badge.",
  inputSchema: z.object({
    type: z.enum(['hero_section', 'card', 'text', 'button', 'container', 'navbar', 'footer', 'grid', 'heading', 'image', 'flex', 'section', 'divider', 'badge']),
    props: z.record(z.any()).optional(),
    parentId: z.string().optional(),
    id: z.string().optional(),
  }),
  execute: async ({ type, props, parentId, id }) => {
    return {
      action: "add_component",
      data: { 
        id: id || `${type}-${Date.now()}`,
        type, 
        props, 
        parentId 
      }
    };
  }
});

/**
 * Tool for updating a component
 */
export const updateComponentTool = defineTool({
  name: "update_component",
  description: "Update properties of an existing component.",
  inputSchema: z.object({
    id: z.string(),
    props: z.record(z.any()),
  }),
  execute: async ({ id, props }) => {
    return {
      action: "update_component",
      data: { id, props }
    };
  }
});

/**
 * Tool for querying the database
 */
export const queryDatabaseTool = defineTool({
  name: "query_database",
  description: "Run a read-only SQL query against the application database.",
  inputSchema: z.object({
    query: z.string(),
  }),
  execute: async ({ query }, options) => {
    const sql = options?.context?.sql;
    if (!sql) return { error: "Database context not available." };
    try {
      const results = await sql.query(query);
      return { results: results.rows };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }
});

/**
 * Tool for publishing the app
 */
export const publishAppTool = defineTool({
  name: "publish_app",
  description: "Publish the current state of the app to a specific environment (dev or live).",
  inputSchema: z.object({
    env: z.enum(["dev", "live"]),
  }),
  execute: async ({ env }) => {
    return {
      action: "publish",
      data: { env }
    };
  }
});

/**
 * Tool for diagnosing system health
 */
export const diagnoseSystemTool = defineTool({
  name: "diagnose_system",
  description: "Get a diagnostic report of the system including database and LLM status.",
  inputSchema: z.object({}),
  execute: async (_, options) => {
    const sql = options?.context?.sql;
    let dbStatus = "Unknown";
    if (sql) {
      try {
        await sql`SELECT 1`;
        dbStatus = "Connected";
      } catch (e) {
        dbStatus = "Error: " + (e as Error).message;
      }
    }

    return {
      action: "diagnose_report",
      data: {
        database: dbStatus,
        llm_keys: {
          anthropic: !!process.env.ANTHROPIC_API_KEY,
          openai: !!process.env.OPENAI_API_KEY,
          google: !!process.env.GOOGLE_API_KEY,
        }
      }
    };
  }
});

/**
 * Tool for web research (Uses Jina Reader for high-quality Markdown scraping)
 */
export const webResearchTool = defineTool({
  name: "web_research",
  description: "Fetch clean Markdown content from an external URL to gather information for app building (e.g., analyzing existing sites). Uses Jina Reader for high quality AI-ready content.",
  inputSchema: z.object({
    url: z.string().url(),
    purpose: z.string().optional(),
  }),
  execute: async ({ url }) => {
    try {
      const jinaUrl = `https://r.jina.ai/${url}`;
      const response = await fetch(jinaUrl, {
        headers: {
          "Accept": "text/event-stream",
          "X-No-Cache": "true"
        }
      });
      
      const text = await response.text();
      return { 
        url,
        content: text.slice(0, 15000),
        status: response.status,
        provider: "jina-reader"
      };
    } catch (error) {
      try {
        const response = await fetch(url);
        const text = await response.text();
        return { 
          url,
          content: text.slice(0, 5000),
          status: response.status,
          provider: "direct-fetch"
        };
      } catch (e) {
        return { error: `Failed to fetch ${url}: ${(e as Error).message}` };
      }
    }
  }
});

/**
 * Tool for searching Google
 */
export const googleSearchTool = defineTool({
  name: "google_search",
  description: "Search Google for websites, brand assets, competitors, or technical information.",
  inputSchema: z.object({
    query: z.string(),
    num: z.number().optional().default(5),
  }),
  execute: async ({ query, num }) => {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY || process.env.GOOGLE_API_KEY;
    const cx = process.env.GOOGLE_SEARCH_ID;

    if (!apiKey || !cx) {
      return { 
        error: "Google Search API key or Engine ID (CX) not configured.",
        instructions: "Set GOOGLE_SEARCH_API_KEY (or GOOGLE_API_KEY) and GOOGLE_SEARCH_ID environment variables."
      };
    }

    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=${num}`;
      const response = await fetch(url);
      const data = await response.json();

      const results = (data.items || []).map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet
      }));

      return { query, results };
    } catch (error) {
      return { error: `Search failed: ${(error as Error).message}` };
    }
  }
});

/**
 * Tool for auditing live component errors
 */
export const getLiveErrorsTool = defineTool({
  name: "get_live_errors",
  description: "Check for recent component render crashes or system errors. Use this to verify if your built components actually work in the live environment.",
  inputSchema: z.object({
    limit: z.number().optional().default(5),
  }),
  execute: async ({ limit }, options) => {
    const sql = options?.context?.sql;
    if (!sql) return { error: "Database context not available." };

    try {
      const errors = await sql`
        SELECT id, title, description, severity, created_at, context
        FROM mori_error_chains
        WHERE status = 'open'
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
      return { errors };
    } catch (error) {
      return { error: `Audit failed: ${(error as Error).message}` };
    }
  }
});

/**
 * Tool for capturing a screenshot of a rendered URL
 */
export const captureScreenshotTool = defineTool({
  name: "capture_screenshot",
  description: "Capture a screenshot of a URL (e.g., http://localhost:3000/preview?env=dev) to 'see' the rendered output. This enables Imperative Live feedback.",
  inputSchema: z.object({
    url: z.string().url(),
    width: z.number().optional().default(1280),
    height: z.number().optional().default(800),
  }),
  execute: async ({ url, width, height }) => {
    // Dynamic import to keep this server-side only and prevent bundler crashes
    const { default: puppeteer } = await import("puppeteer");
    
    console.log(`📸 Capturing screenshot of ${url}...`);
    let browser;
    try {
      browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      
      const w = Math.floor(Number(width) || 1280);
      const h = Math.floor(Number(height) || 800);
      await page.setViewport({ width: w, height: h });
      
      // Wait for network to be idle to ensure components are loaded
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
      
      // Wait an extra second for any animations or client-side rendering to finish
      await new Promise(r => setTimeout(r, 1000));
      
      const screenshot = await page.screenshot({ encoding: 'base64' });
      await browser.close();
      
      return { 
        url, 
        screenshot: `data:image/png;base64,${screenshot}`,
        message: "Screenshot captured successfully. You can now 'see' the rendered output."
      };
    } catch (error) {
      if (browser) await (browser as any).close();
      return { error: `Failed to capture screenshot: ${(error as Error).message}` };
    }
  }
});

export const mcpTools = {
  addComponent: addComponentTool,
  updateComponent: updateComponentTool,
  queryDatabase: queryDatabaseTool,
  publishApp: publishAppTool,
  diagnoseSystem: diagnoseSystemTool,
  webResearch: webResearchTool,
  googleSearch: googleSearchTool,
  getLiveErrors: getLiveErrorsTool,
  captureScreenshot: captureScreenshotTool,
};
