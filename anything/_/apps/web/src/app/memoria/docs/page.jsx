"use client";

import { useCallback, useMemo } from "react";
import { Copy, BookOpen, KeyRound } from "lucide-react";

export default function MemoriaDocsPage() {
  const onCopy = useCallback(async (value) => {
    try {
      await navigator.clipboard.writeText(String(value || ""));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const authHeader = "Authorization: Bearer memoria.<tokenId>.<secret>";

  const captureExample = useMemo(() => {
    const payload = {
      externalId: "brother_advanced_research:concept-001",
      title: "A concept drop",
      index: "Cross_App_Conversations",
      turn: {
        // turnIndex is optional; if omitted, the server appends to the thread.
        userText: "Paste the concept here",
        assistantThinkingSummary: "(optional safe summary)",
        assistantSynthesis: "(optional)",
        codeSummary: null,
        assistantResponse: null,
        metadata: {
          source: "external_api",
        },
      },
    };

    return `curl -X POST ${baseUrl}/api/memoria/external/capture \\\n  -H "${authHeader}" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(payload, null, 2)}'`;
  }, [baseUrl]);

  const searchExample = useMemo(() => {
    return `curl -X GET "${baseUrl}/api/memoria/external/search?q=interaction&limit=20" \\\n  -H "${authHeader}"`;
  }, [baseUrl]);

  const idRules = useMemo(() => {
    return [
      "Thread identity is canonical via external_id (example: brother_advanced_research:concept-001).",
      "Token app_source is enforced server-side. You cannot impersonate other sources.",
      "Reads are scoped: a token only searches/reads its own app_source.",
      "Writes are scoped: all writes are tagged under the token’s app_source.",
    ].join("\n");
  }, []);

  const specUrl = `${baseUrl}/api/memoria/spec`;

  const schemaSqlSnippet = useMemo(() => {
    return `curl -X GET ${specUrl}`;
  }, [specUrl]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212]">
      <div className="bg-white dark:bg-[#1E1E1E] border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center">
              <BookOpen size={18} />
            </div>
            <div className="flex-1">
              <h1 className="font-bold text-[28px] leading-[1.2] text-[#0F172A] dark:text-white font-inter">
                Memoria External API
              </h1>
              <p className="mt-1 text-sm text-[#667085] dark:text-[#A1A1AA]">
                Enterprise bearer-token API for writing/reading Memoria without
                exposing your other business apps.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/memoria/keys"
                className="h-[40px] px-4 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white inline-flex items-center justify-center"
              >
                <span className="inline-flex items-center gap-2">
                  <KeyRound size={16} /> Keys
                </span>
              </a>
              <a
                href="/memoria/uploader"
                className="h-[40px] px-4 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white inline-flex items-center justify-center"
              >
                Uploader
              </a>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-xl border bg-green-50 border-green-200 text-sm text-[#0F172A]">
            <div className="font-semibold">
              Security model (what you asked for)
            </div>
            <pre className="mt-2 text-xs whitespace-pre-wrap">{idRules}</pre>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] p-6">
          <div className="text-lg font-semibold text-[#0F172A] dark:text-white font-inter">
            Endpoints
          </div>
          <div className="mt-3 text-sm text-[#0F172A] dark:text-white space-y-2">
            <div>
              <span className="font-mono">POST</span>{" "}
              <span className="font-mono">/api/memoria/external/capture</span> —
              write a turn/transcript
            </div>
            <div>
              <span className="font-mono">GET</span>{" "}
              <span className="font-mono">/api/memoria/external/search</span> —
              search (scoped to token app_source)
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="text-lg font-semibold text-[#0F172A] dark:text-white font-inter">
              Example: capture
            </div>
            <button
              type="button"
              onClick={() => onCopy(captureExample)}
              className="h-[38px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] text-[#0F172A] dark:text-white hover:bg-[#F8F9FA] dark:hover:bg-[#262626] transition-colors inline-flex items-center gap-2"
            >
              <Copy size={16} /> Copy
            </button>
          </div>
          <pre className="mt-3 text-xs bg-[#0B1220] text-[#E5E7EB] p-4 rounded-xl overflow-auto border border-black/10">
            {captureExample}
          </pre>
        </div>

        <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="text-lg font-semibold text-[#0F172A] dark:text-white font-inter">
              Example: search
            </div>
            <button
              type="button"
              onClick={() => onCopy(searchExample)}
              className="h-[38px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] text-[#0F172A] dark:text-white hover:bg-[#F8F9FA] dark:hover:bg-[#262626] transition-colors inline-flex items-center gap-2"
            >
              <Copy size={16} /> Copy
            </button>
          </div>
          <pre className="mt-3 text-xs bg-[#0B1220] text-[#E5E7EB] p-4 rounded-xl overflow-auto border border-black/10">
            {searchExample}
          </pre>
        </div>

        <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="text-lg font-semibold text-[#0F172A] dark:text-white font-inter">
              Canonical schema (copy/paste)
            </div>
            <button
              type="button"
              onClick={() => onCopy(specUrl)}
              className="h-[38px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] text-[#0F172A] dark:text-white hover:bg-[#F8F9FA] dark:hover:bg-[#262626] transition-colors inline-flex items-center gap-2"
            >
              <Copy size={16} /> Copy spec URL
            </button>
          </div>
          <div className="mt-2 text-sm text-[#0F172A] dark:text-white">
            The full Memoria universal contract (including the exact SQL) is
            served here:
            <div className="mt-2 font-mono text-xs">{specUrl}</div>
          </div>
          <pre className="mt-3 text-xs bg-[#0B1220] text-[#E5E7EB] p-4 rounded-xl overflow-auto border border-black/10">
            {schemaSqlSnippet}
          </pre>
          <div className="mt-2 text-xs text-[#667085] dark:text-[#A1A1AA]">
            Tip: GET /api/memoria/spec and copy the schema.sql field into your
            other apps’ database migrations.
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] p-6">
          <div className="text-lg font-semibold text-[#0F172A] dark:text-white font-inter">
            Rate limiting
          </div>
          <div className="mt-2 text-sm text-[#0F172A] dark:text-white">
            Each token has a per-minute request cap. When exceeded, the API
            responds with HTTP <span className="font-mono">429</span>. You can
            change the cap in <span className="font-mono">/memoria/keys</span>.
          </div>
        </div>
      </div>
    </div>
  );
}
