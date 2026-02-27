"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle, AlertCircle, RefreshCw, Copy } from "lucide-react";

function safeStringify(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function MemoriaIntegration({ selectedApp, secretsData }) {
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const [since, setSince] = useState("");
  const [limit, setLimit] = useState("200");

  const secrets = secretsData?.secrets || [];

  const memoriaSecret = useMemo(() => {
    const found = secrets.find((s) => s.secret_key === "MEMORIA_EXPORT_KEY");
    return found || null;
  }, [secrets]);

  const hasMemoriaExportKey = useMemo(() => {
    const ok = Boolean(memoriaSecret?.has_value);
    return ok;
  }, [memoriaSecret]);

  const testPayload = useMemo(() => {
    const parsedLimit = Number(limit);
    const limitFinal = Number.isFinite(parsedLimit) ? parsedLimit : 200;

    const options = {};
    if (since.trim()) {
      options.since = since.trim();
    }
    if (limitFinal > 0) {
      options.limit = limitFinal;
    }

    return {
      app_id: selectedApp?.id,
      data_type: "conversations",
      auto_capture: false,
      options,
    };
  }, [limit, selectedApp?.id, since]);

  const syncPayload = useMemo(() => {
    return {
      ...testPayload,
      auto_capture: true,
    };
  }, [testPayload]);

  const testMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await fetch("/api/integrations/app-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `When calling /api/integrations/app-data, the response was [${response.status}] ${text}`,
        );
      }
      return response.json();
    },
    onMutate: () => {
      setError(null);
      setResult(null);
    },
    onSuccess: (data) => {
      setError(null);
      setResult(data);
    },
    onError: (e) => {
      console.error(e);
      setResult(null);
      setError(e?.message || "Could not test Memoria export");
    },
  });

  const onTest = useCallback(() => {
    if (!selectedApp?.id) {
      setError("No app selected");
      return;
    }
    testMutation.mutate(testPayload);
  }, [selectedApp?.id, testMutation, testPayload]);

  const onSyncNow = useCallback(() => {
    if (!selectedApp?.id) {
      setError("No app selected");
      return;
    }
    testMutation.mutate(syncPayload);
  }, [selectedApp?.id, syncPayload, testMutation]);

  const extractionMethod = result?.data?.extraction_method || null;
  const exportUrl = result?.data?.export_url || null;
  const remotePayload = result?.data?.data || null;
  const remoteConversations = remotePayload?.conversations || null;

  const conversationCount = Array.isArray(remoteConversations)
    ? remoteConversations.length
    : null;

  const statusRow = useMemo(() => {
    if (!hasMemoriaExportKey) {
      return {
        tone: "warn",
        title: "Missing MEMORIA_EXPORT_KEY in this hub",
        detail:
          "Add MEMORIA_EXPORT_KEY under this app → Secrets. The value must match what you set in the remote app.",
      };
    }

    return {
      tone: "ok",
      title: "Ready to test",
      detail:
        "This hub will call the remote app’s /api/memoria/export/conversations using Authorization: Bearer <MEMORIA_EXPORT_KEY>.",
    };
  }, [hasMemoriaExportKey]);

  const statusBg = statusRow.tone === "ok" ? "bg-green-50" : "bg-gray-50";
  const statusBorder =
    statusRow.tone === "ok" ? "border-green-200" : "border-black/10";
  const statusIcon = statusRow.tone === "ok";

  const sampleRouteSnippet = useMemo(() => {
    // This is intentionally minimal + universal. You’ll replace the SELECT with your app’s tables.
    return `// DITZL / Rosebud / any Anything app
// File: /apps/web/src/app/api/memoria/export/conversations/route.js
import sql from "@/app/api/utils/sql";

export async function GET(request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;

  if (!token || token !== process.env.MEMORIA_EXPORT_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const since = url.searchParams.get("since");
  const limit = Math.min(Number(url.searchParams.get("limit") || 200), 1000);

  // TODO: Replace this query with your app’s conversation storage.
  // Return normalized objects using external_id as the canonical thread id.
  const rows = await sql\`
    SELECT NOW() as fetched_at
    LIMIT \${limit}
  \`;

  return Response.json({
    ok: true,
    since,
    limit,
    conversations: [],
    debug: { rows_preview: rows },
  });
}`;
  }, []);

  const copySnippet = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(sampleRouteSnippet);
    } catch (e) {
      console.error(e);
    }
  }, [sampleRouteSnippet]);

  const isBusy = testMutation.isPending;

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-inter font-semibold text-xl text-[#0F172A] dark:text-white">
            Memoria Integration
          </h3>
          <p className="mt-1 text-sm text-[#667085] dark:text-[#A1A1AA]">
            Standard sync for conversations using canonical{" "}
            <span className="font-semibold">external_id</span>.
          </p>
        </div>
      </div>

      <div className={`mt-5 p-4 rounded-xl border ${statusBg} ${statusBorder}`}>
        <div className="flex items-start gap-3">
          {statusIcon ? (
            <CheckCircle size={18} className="text-green-700 mt-0.5" />
          ) : (
            <AlertCircle size={18} className="text-black/60 mt-0.5" />
          )}
          <div>
            <div className="text-sm font-semibold text-[#0F172A]">
              {statusRow.title}
            </div>
            <div className="text-sm text-[#334155] mt-1">
              {statusRow.detail}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
            since (optional)
          </label>
          <input
            value={since}
            onChange={(e) => setSince(e.target.value)}
            placeholder="2025-12-01T00:00:00Z"
            className="w-full h-[42px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
            limit
          </label>
          <input
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            placeholder="200"
            className="w-full h-[42px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none"
          />
        </div>
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={onTest}
            disabled={isBusy || !hasMemoriaExportKey}
            className="h-[42px] px-4 rounded-lg border border-[#E4E7EC] dark:border-[#404040] text-[#0F172A] dark:text-white hover:bg-[#F8F9FA] dark:hover:bg-[#262626] transition-colors disabled:opacity-60 inline-flex items-center gap-2"
          >
            <RefreshCw size={16} className={isBusy ? "animate-spin" : ""} />
            Test export
          </button>
          <button
            type="button"
            onClick={onSyncNow}
            disabled={isBusy || !hasMemoriaExportKey}
            className="h-[42px] px-4 rounded-lg bg-[#0F172A] hover:bg-[#17233A] text-white font-semibold disabled:opacity-60 transition-colors"
          >
            Sync + capture
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 text-sm text-red-600 dark:text-red-300">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6">
          <div className="text-sm font-semibold text-[#0F172A] dark:text-white">
            Latest result
          </div>

          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040]">
              <div className="text-xs text-[#667085] dark:text-[#A1A1AA]">
                extraction_method
              </div>
              <div className="text-sm text-[#0F172A] dark:text-white mt-1">
                {extractionMethod || "(none)"}
              </div>
            </div>
            <div className="p-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040]">
              <div className="text-xs text-[#667085] dark:text-[#A1A1AA]">
                export_url
              </div>
              <div className="text-sm text-[#0F172A] dark:text-white mt-1 break-all">
                {exportUrl || "(none)"}
              </div>
            </div>
            <div className="p-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040]">
              <div className="text-xs text-[#667085] dark:text-[#A1A1AA]">
                conversations
              </div>
              <div className="text-sm text-[#0F172A] dark:text-white mt-1">
                {conversationCount === null
                  ? "(unknown)"
                  : String(conversationCount)}
              </div>
            </div>
          </div>

          <pre className="mt-3 text-xs bg-[#0B1220] text-[#E5E7EB] p-4 rounded-xl overflow-auto border border-black/10">
            {safeStringify(result)}
          </pre>
        </div>
      )}

      <div className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-[#0F172A] dark:text-white">
              Drop-in export route (copy/paste)
            </div>
            <div className="text-sm text-[#667085] dark:text-[#A1A1AA] mt-1">
              Put this in each app (DITZL, Rosebud, BeTheFirstNFT) and replace
              the SELECT with your conversation tables.
            </div>
          </div>
          <button
            type="button"
            onClick={copySnippet}
            className="h-[38px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] text-[#0F172A] dark:text-white hover:bg-[#F8F9FA] dark:hover:bg-[#262626] transition-colors inline-flex items-center gap-2"
          >
            <Copy size={16} />
            Copy
          </button>
        </div>

        <pre className="mt-3 text-xs bg-[#0B1220] text-[#E5E7EB] p-4 rounded-xl overflow-auto border border-black/10">
          {sampleRouteSnippet}
        </pre>
      </div>
    </div>
  );
}
