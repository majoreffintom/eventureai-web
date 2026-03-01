import { getSQL } from "@eventureai/builder-llm";
import { PreviewClient } from "./PreviewClient";

export const dynamic = 'force-dynamic';

export default async function PreviewPage({ searchParams }: { searchParams: { env?: string } }) {
  const env = searchParams.env === 'live' ? 'live' : 'dev';
  const sql = getSQL(env as 'dev' | 'live');
  
  let elements: any[] = [];
  
  try {
    // Fetch from app_pages
    const result = await sql`
      SELECT content 
      FROM app_pages 
      WHERE app_id = 1 AND slug = 'index'
      LIMIT 1
    `;

    if (result.length > 0) {
      elements = (result[0] as any).content as any[];
    }
  } catch (error) {
    console.error("Failed to fetch initial elements", error);
  }

  return <PreviewClient initialElements={elements} env={env} />;
}
