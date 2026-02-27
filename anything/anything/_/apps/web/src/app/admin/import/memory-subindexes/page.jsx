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
    agent_name: r.agent_name || "",
    parent_index_name: r.parent_index_name || r.index_name || "",
    subindex_name: r.subindex_name || "",
    display_name: r.display_name || "",
    description: r.description || "",
    context_count: r.context_count ?? "",
  };
}

export default function AdminImportMemorySubindexesPage() {
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
      const response = await fetch("/api/admin/memory-subindexes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const msg = data?.error || "Could not import memory subindexes";
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
          title="Import Memory Subindexes"
          subtitle="Paste CSV. This will upsert (create or update) by agent_name + parent_index_name + subindex_name."
        >
          <Text tone="secondary">
            Required columns: agent_name, parent_index_name, subindex_name,
            display_name. Optional: description, context_count.
          </Text>

          <div className="mt-4 grid gap-3">
            <div>
              <Text tone="secondary" size="sm" as="label">
                CSV
              </Text>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={10}
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
                      const hasAgent =
                        typeof r.agent_name === "string" && r.agent_name.trim();
                      const hasParent =
                        typeof r.parent_index_name === "string" &&
                        r.parent_index_name.trim();
                      const hasSlug =
                        typeof r.subindex_name === "string" &&
                        r.subindex_name.trim();
                      return hasAgent && hasParent && hasSlug;
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
                    const agent =
                      typeof r.agent_name === "string" ? r.agent_name : "";
                    const parent =
                      typeof r.parent_index_name === "string"
                        ? r.parent_index_name
                        : "";
                    const slug =
                      typeof r.subindex_name === "string"
                        ? r.subindex_name
                        : "";
                    const display =
                      typeof r.display_name === "string" ? r.display_name : "";
                    const title = display || slug;
                    return (
                      <div key={idx} className="rounded-md bg-white p-2">
                        <Text className="font-medium">{title}</Text>
                        <Text tone="tertiary" size="xs">
                          {agent} • {parent} • {slug}
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
                Upserted: {importMutation.data.upserted} • Skipped:{" "}
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
                    const who = e.agent_name ? ` (${e.agent_name})` : "";
                    const parent = e.parent_index_name
                      ? `/${e.parent_index_name}`
                      : "";
                    const slug = e.subindex_name ? `/${e.subindex_name}` : "";
                    return (
                      <Text key={idx} tone="danger" size="sm">
                        {line}
                        {who}
                        {parent}
                        {slug}
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
