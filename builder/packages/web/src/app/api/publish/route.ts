import { NextRequest } from "next/server";
import { getSQL } from "@eventureai/builder-llm";

export async function POST(req: NextRequest) {
  try {
    const { elements, appId, env, subdomain } = await req.json();
    
    // Choose connection based on environment
    const sql = getSQL(env === 'live' ? 'live' : 'dev');
    
    // Update subdomain if provided and env is live
    if (env === 'live' && subdomain) {
      await sql`
        UPDATE apps 
        SET subdomain = ${subdomain}, updated_at = NOW() 
        WHERE id = ${appId || 1}
      `;
    }

    // Save to app_pages
    const result = await sql`
      UPDATE app_pages 
      SET 
        content = ${JSON.stringify(elements)}::jsonb,
        is_published = ${env === 'live'},
        published_at = ${env === 'live' ? new Date().toISOString() : null},
        updated_at = NOW()
      WHERE app_id = ${appId || 1} AND slug = 'index'
      RETURNING id
    `;

    // If no row was updated, create a new one
    if (result.length === 0) {
      await sql`
        INSERT INTO app_pages (app_id, slug, title, content, is_published, published_at)
        VALUES (
          ${appId || 1}, 
          'index', 
          'Home', 
          ${JSON.stringify(elements)}::jsonb, 
          ${env === 'live'}, 
          ${env === 'live' ? new Date().toISOString() : null}
        )
      `;
    }

    return new Response(JSON.stringify({ success: true, env }), { status: 200 });
  } catch (error) {
    console.error("Publish error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
