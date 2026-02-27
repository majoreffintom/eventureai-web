import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

// Keep HTML safe
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slugifyFilename(value) {
  const base = String(value || "document")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);

  return base || "document";
}

function buildSummaryHtml({ title, notes, fields, createdAt }) {
  const fieldEntries =
    fields && typeof fields === "object" ? Object.entries(fields) : [];

  const rowsHtml = fieldEntries
    .filter(([k]) => String(k || "").trim())
    .map(([k, v]) => {
      const key = escapeHtml(k);
      const val = escapeHtml(v == null ? "" : String(v));
      return `
        <tr>
          <td class="k">${key}</td>
          <td class="v">${val || "&nbsp;"}</td>
        </tr>
      `;
    })
    .join("\n");

  const safeTitle = escapeHtml(title || "EventureAI Document");
  const safeNotes = notes ? escapeHtml(notes) : "";
  const safeCreated = createdAt ? escapeHtml(createdAt) : "";

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${safeTitle}</title>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div class="brand">EventureAI</div>
          <div class="docTitle">${safeTitle}</div>
          <div class="meta">Generated ${safeCreated ? `from record created at ${safeCreated}` : ""}</div>
        </div>

        ${safeNotes ? `<div class="notes"><div class="notesTitle">Notes</div><div class="notesBody">${safeNotes}</div></div>` : ""}

        <div class="sectionTitle">Fields</div>
        <table class="table">
          <thead>
            <tr><th>Field</th><th>Value</th></tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td class="k">(none)</td><td class="v">No fields saved.</td></tr>`}
          </tbody>
        </table>

        <div class="footer">
          Generated on ${escapeHtml(new Date().toISOString())}
        </div>
      </div>
    </body>
  </html>`;
}

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = params?.id;
    if (!id) {
      return Response.json({ error: "Missing id" }, { status: 400 });
    }

    const rows = await sql(
      "SELECT id, title, notes, fields, created_at FROM public.eventureai_documents WHERE id = $1 AND user_id = $2 LIMIT 1",
      [id, session.user.id],
    );

    const doc = rows?.[0];
    if (!doc) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const createdAt = doc.created_at
      ? new Date(doc.created_at).toLocaleString()
      : "";

    const html = buildSummaryHtml({
      title: doc.title,
      notes: doc.notes,
      fields: doc.fields,
      createdAt,
    });

    const pdfStyles = `
      @page { margin: 32px; }
      body { font-family: Arial, Helvetica, sans-serif; color: #0F172A; }
      .page { width: 100%; }
      .header { margin-bottom: 18px; }
      .brand { font-size: 12px; color: #111827; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 700; }
      .docTitle { font-size: 20px; font-weight: 700; margin-top: 6px; }
      .meta { font-size: 11px; color: #667085; margin-top: 6px; }
      .notes { margin: 12px 0 18px; }
      .notesTitle { font-size: 12px; font-weight: 700; margin-bottom: 4px; }
      .notesBody { font-size: 11px; color: #475467; white-space: pre-wrap; }
      .sectionTitle { font-size: 13px; font-weight: 700; margin: 14px 0 8px; }
      .table { width: 100%; border-collapse: collapse; }
      .table th { text-align: left; font-size: 11px; padding: 8px; border-bottom: 1px solid #EAECF0; color: #667085; }
      .table td { vertical-align: top; font-size: 11px; padding: 8px; border-bottom: 1px solid #F2F4F7; }
      .table td.k { width: 38%; font-weight: 700; }
      .table td.v { width: 62%; white-space: pre-wrap; }
      .footer { margin-top: 18px; font-size: 10px; color: #98A2B3; }
    `;

    const pdfResponse = await fetch("/integrations/pdf-generation/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: { html },
        styles: [{ content: pdfStyles }],
      }),
    });

    if (!pdfResponse.ok) {
      const text = await pdfResponse.text().catch(() => "");
      console.error("PDF generation failed:", pdfResponse.status, text);
      return Response.json(
        {
          error: `Could not generate PDF (status ${pdfResponse.status})`,
        },
        { status: 500 },
      );
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    const filename = `${slugifyFilename(doc.title)}-export.pdf`;

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=\"${filename}\"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/eventureai/documents/[id]/export error:", error);
    return Response.json(
      { error: "Failed to export PDF", details: error.message },
      { status: 500 },
    );
  }
}
