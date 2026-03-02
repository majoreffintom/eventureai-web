import { getSQL } from "@eventureai/builder-llm";
import { PreviewClient } from "../PreviewClient";
import { notFound } from "next/navigation";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function SubdomainPage({ params }: { params: { subdomain: string } }) {
  const { subdomain } = params;
  
  const sql = getSQL('live'); // Always use live for subdomains
  
  let elements: any[] = [];
  
  try {
    // Fetch from app_pages JOINed with apps to match subdomain
    const result = await sql`
      SELECT ap.content 
      FROM app_pages ap
      JOIN apps a ON ap.app_id = a.id
      WHERE a.subdomain = ${subdomain} AND ap.slug = 'index'
      LIMIT 1
    `;

    if (result.length > 0) {
      elements = (result[0] as any).content as any[];
    } else {
      notFound();
    }
  } catch (error) {
    console.error("Failed to fetch subdomain elements", error);
    notFound();
  }

  return <PreviewClient initialElements={elements} env="live" />;
}
