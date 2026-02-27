"use client";

import { useMemo, useState } from "react";
import Papa from "papaparse";
import SiteHeader from "@/components/SiteHeader";
import { Button, Page, Panel, Text } from "@/components/ds.jsx";
import { AdminAccessGuard } from "@/components/admin/AdminAccessGuard";
import { useAdminAuth } from "@/utils/admin/useAdminAuth";
import { useMutation } from "@tanstack/react-query";

function pickRow(raw) {
  const r = raw && typeof raw === "object" ? raw : {};

  return {
    date: r.date || "",
    project_id: r.project_id || "",
    subject: r.subject || "",
    summary: r.summary || "",
    conversation_type: r.conversation_type || "",
    technical_decisions: r.technical_decisions || "",
    entities_created: r.entities_created || "",
    functions_created: r.functions_created || "",
    pages_created: r.pages_created || "",
    api_keys_used: r.api_keys_used || "",
    bugs_fixed: r.bugs_fixed || "",
    action_items: r.action_items || "",
    participants: r.participants || "",
    tags: r.tags || "",
    status: r.status || "",
  };
}

export default function AdminImportConversationsPage() {
  const {
    isCheckingAccess,
    accessError,
    isAuthenticated,
    isAdmin,
    signedInEmail,
  } = useAdminAuth();

  const [csvText, setCsvText] = useState("");
  const [parseError, setParseError] = useState(null);
  const [parseMeta, setParseMeta] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);

  const importMutation = useMutation({
    mutationFn: async (rows) => {
      const response = await fetch("/api/admin/conversations/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const msg = data?.error || "Could not import conversations";
        throw new Error(msg);
      }

      return data;
    },
  });

  const preview = useMemo(() => {
    const safe = Array.isArray(parsedRows) ? parsedRows : [];
    return safe.slice(0, 5);
  }, [parsedRows]);

  const canParse = csvText.trim().length > 0;
  const canImport = parsedRows.length > 0 && !importMutation.isPending;

  return (
    <AdminAccessGuard
      isCheckingAccess={isCheckingAccess}
      accessError={accessError}
      isAuthenticated={isAuthenticated}
      isAdmin={isAdmin}
      signedInEmail={signedInEmail}
    >
      <Page header={<SiteHeader variant="admin" />} footer={null}>
        <Panel
          title="Import Conversations"
          subtitle="Paste CSV exported from your other system."
        >
          <Text tone="secondary">
            Tip: CSV works best when it has headers, and JSON-ish columns (like
            technical_decisions or tags) are kept as strings.
          </Text>

          <div className="mt-4 grid gap-3">
            <div>
              <Text tone="secondary" size="sm" as="label">
                CSV
              </Text>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={12}
                className="mt-2 w-full rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] p-3 text-sm"
                placeholder="Paste CSV here..."
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                disabled={!canParse}
                onClick={() => {
                  setParseError(null);
                  setParseMeta(null);
                  setParsedRows([]);

                  try {
                    const result = Papa.parse(csvText, {
                      header: true,
                      skipEmptyLines: "greedy",
                    });

                    if (result?.errors?.length) {
                      const first = result.errors[0];
                      const msg = first?.message || "CSV parse error";
                      setParseError(msg);
                    }

                    const data = Array.isArray(result?.data) ? result.data : [];
                    const cleaned = data.map(pickRow).filter((r) => {
                      const hasDate =
                        typeof r.date === "string" && r.date.trim();
                      const hasSubject =
                        typeof r.subject === "string" && r.subject.trim();
                      return hasDate && hasSubject;
                    });

                    setParsedRows(cleaned);
                    setParseMeta({
                      rows: data.length,
                      cleanedRows: cleaned.length,
                      fields: result?.meta?.fields || [],
                    });
                  } catch (e) {
                    console.error(e);
                    setParseError(e?.message || "CSV parse error");
                  }
                }}
              >
                Parse CSV
              </Button>

              <Button
                variant="secondary"
                disabled={parsedRows.length === 0 || importMutation.isPending}
                onClick={() => {
                  setCsvText("");
                  setParsedRows([]);
                  setParseError(null);
                  setParseMeta(null);
                  importMutation.reset();
                }}
              >
                Clear
              </Button>

              <Button
                disabled={!canImport}
                onClick={() => {
                  importMutation.mutate(parsedRows);
                }}
              >
                {importMutation.isPending ? "Importing…" : "Import"}
              </Button>
            </div>

            {parseError ? (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {parseError}
              </div>
            ) : null}

            {parseMeta ? (
              <div className="rounded-lg border border-[var(--ds-border)] bg-[var(--ds-bg-secondary)] p-3">
                <Text tone="primary" className="font-semibold">
                  Parse summary
                </Text>
                <Text tone="secondary" size="sm" className="mt-1">
                  Rows: {parseMeta.rows} • Ready to import:{" "}
                  {parseMeta.cleanedRows}
                </Text>
                <Text tone="tertiary" size="xs" className="mt-1">
                  Columns found: {(parseMeta.fields || []).join(", ")}
                </Text>
              </div>
            ) : null}

            {preview.length ? (
              <div className="rounded-lg border border-[var(--ds-border)] bg-[var(--ds-bg-secondary)] p-3">
                <Text tone="primary" className="font-semibold">
                  Preview
                </Text>
                <div className="mt-2 space-y-2">
                  {preview.map((r, idx) => {
                    const title =
                      typeof r.subject === "string" ? r.subject : "";
                    const date = typeof r.date === "string" ? r.date : "";
                    return (
                      <div key={idx} className="rounded-md bg-white p-2">
                        <Text className="font-medium">{title}</Text>
                        <Text tone="tertiary" size="xs">
                          {date}
                        </Text>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {importMutation.error ? (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {importMutation.error?.message || "Could not import"}
              </div>
            ) : null}

            {importMutation.data ? (
              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
                Imported: {importMutation.data.inserted} • Skipped (dupes):{" "}
                {importMutation.data.skipped} • Errors:{" "}
                {importMutation.data.errors?.length || 0}
              </div>
            ) : null}

            {importMutation.data?.errors?.length ? (
              <div className="rounded-lg border border-[var(--ds-border)] bg-[var(--ds-bg-secondary)] p-3">
                <Text tone="primary" className="font-semibold">
                  Import errors (first 10)
                </Text>
                <div className="mt-2 space-y-2">
                  {importMutation.data.errors.slice(0, 10).map((e, idx) => {
                    const line = `Row ${e.rowIndex}: ${e.error || "Unknown error"}`;
                    const subj = e.subject ? ` (${e.subject})` : "";
                    return (
                      <Text key={idx} tone="danger" size="sm">
                        {line}
                        {subj}
                      </Text>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </Panel>
      </Page>
    </AdminAccessGuard>
  );
}
