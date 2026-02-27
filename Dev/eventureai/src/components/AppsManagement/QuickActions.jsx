"use client";

import { useMemo, useState } from "react";
import {
  Eye,
  Key,
  DollarSign,
  Edit,
  RefreshCw,
  CheckCircle,
  XCircle,
  MessagesSquare,
  Download,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";

export function QuickActions({ selectedApp, onSecretsClick }) {
  // state for showing last sync result
  const [lastResult, setLastResult] = useState(null);
  // state for showing last cancellations processing result
  const [lastCancelResult, setLastCancelResult] = useState(null);
  // state for showing last conversations import
  const [lastConvoResult, setLastConvoResult] = useState(null);

  const hasSelectedApp = useMemo(() => {
    return Boolean(selectedApp?.id);
  }, [selectedApp]);

  // mutation to sync all apps
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/apps/sync-and-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 50, data_type: "overview" }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Sync failed: [${response.status}] ${text}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      setLastResult({ ok: true, data });
    },
    onError: (error) => {
      console.error(error);
      setLastResult({ ok: false, error: error.message });
    },
  });

  // mutation to sync all conversations (Memoria export import)
  const syncConversationsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/apps/sync-and-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 50, data_type: "conversations" }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Conversation sync failed: [${response.status}] ${text}`,
        );
      }
      return response.json();
    },
    onSuccess: (data) => {
      setLastConvoResult({ ok: true, data });
    },
    onError: (error) => {
      console.error(error);
      setLastConvoResult({ ok: false, error: error.message });
    },
  });

  // mutation to import conversations for the selected app
  const importSelectedAppConversationsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedApp?.id) {
        throw new Error("No app selected");
      }

      const response = await fetch("/api/integrations/app-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_id: selectedApp.id,
          data_type: "conversations",
          auto_capture: true,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Import failed: [${response.status}] ${response.statusText}: ${text}`,
        );
      }

      return response.json();
    },
    onSuccess: (data) => {
      setLastConvoResult({ ok: true, data });
    },
    onError: (error) => {
      console.error(error);
      setLastConvoResult({ ok: false, error: error.message });
    },
  });

  // mutation to process cancelled items
  const processCancelledMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/cancellations/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "all", limit: 10 }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Process cancelled failed: [${response.status}] ${text}`,
        );
      }
      return response.json();
    },
    onSuccess: (data) => {
      setLastCancelResult({ ok: true, data });
    },
    onError: (error) => {
      console.error(error);
      setLastCancelResult({ ok: false, error: error.message });
    },
  });

  const importSelectedDisabled =
    !hasSelectedApp || importSelectedAppConversationsMutation.isPending;

  const importedThreads =
    lastConvoResult?.data?.capture_result?.imported?.threads || null;
  const importedTurns =
    lastConvoResult?.data?.capture_result?.imported?.turns || null;

  const hasImportCounts =
    typeof importedThreads === "number" && typeof importedTurns === "number";

  const convoSummary = hasImportCounts
    ? `Imported threads ${importedThreads} · turns ${importedTurns}`
    : null;

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] p-6">
      <h3 className="font-inter font-semibold text-lg text-[#0F172A] dark:text-white mb-4">
        Quick Actions
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button className="flex flex-col items-center gap-2 p-4 border border-[#E4E7EC] dark:border-[#404040] rounded-lg hover:bg-[#F8F9FA] dark:hover:bg-[#262626] transition-colors">
          <Eye size={20} className="text-[#667085] dark:text-[#A1A1AA]" />
          <span className="text-sm font-medium text-[#0F172A] dark:text-white">
            View Details
          </span>
        </button>

        <button
          onClick={onSecretsClick}
          className="flex flex-col items-center gap-2 p-4 border border-[#E4E7EC] dark:border-[#404040] rounded-lg hover:bg-[#F8F9FA] dark:hover:bg-[#262626] transition-colors"
        >
          <Key size={20} className="text-[#667085] dark:text-[#A1A1AA]" />
          <span className="text-sm font-medium text-[#0F172A] dark:text-white">
            Secrets
          </span>
        </button>

        <a
          href="/finance"
          className="flex flex-col items-center gap-2 p-4 border border-[#E4E7EC] dark:border-[#404040] rounded-lg hover:bg-[#F8F9FA] dark:hover:bg-[#262626] transition-colors"
        >
          <DollarSign
            size={20}
            className="text-[#667085] dark:text-[#A1A1AA]"
          />
          <span className="text-sm font-medium text-[#0F172A] dark:text-white">
            Finances
          </span>
        </a>

        <button className="flex flex-col items-center gap-2 p-4 border border-[#E4E7EC] dark:border-[#404040] rounded-lg hover:bg-[#F8F9FA] dark:hover:bg-[#262626] transition-colors">
          <Edit size={20} className="text-[#667085] dark:text-[#A1A1AA]" />
          <span className="text-sm font-medium text-[#0F172A] dark:text-white">
            Edit App
          </span>
        </button>

        {/* New: Import conversations for selected app */}
        <button
          onClick={() => importSelectedAppConversationsMutation.mutate()}
          disabled={importSelectedDisabled}
          className="col-span-2 md:col-span-2 flex items-center justify-center gap-2 p-4 border border-[#E4E7EC] dark:border-[#404040] rounded-lg hover:bg-[#F8F9FA] dark:hover:bg-[#262626] transition-colors disabled:opacity-60"
        >
          {importSelectedAppConversationsMutation.isPending ? (
            <RefreshCw
              size={18}
              className="animate-spin text-[#667085] dark:text-[#A1A1AA]"
            />
          ) : (
            <Download
              size={18}
              className="text-[#667085] dark:text-[#A1A1AA]"
            />
          )}
          <span className="text-sm font-medium text-[#0F172A] dark:text-white">
            {importSelectedAppConversationsMutation.isPending
              ? "Importing..."
              : "Import Conversations (this app)"}
          </span>
        </button>

        {/* New: Sync All Conversations */}
        <button
          onClick={() => syncConversationsMutation.mutate()}
          disabled={syncConversationsMutation.isPending}
          className="col-span-2 md:col-span-2 flex items-center justify-center gap-2 p-4 border border-[#E4E7EC] dark:border-[#404040] rounded-lg hover:bg-[#F8F9FA] dark:hover:bg-[#262626] transition-colors disabled:opacity-60"
        >
          {syncConversationsMutation.isPending ? (
            <RefreshCw
              size={18}
              className="animate-spin text-[#667085] dark:text-[#A1A1AA]"
            />
          ) : (
            <MessagesSquare
              size={18}
              className="text-[#667085] dark:text-[#A1A1AA]"
            />
          )}
          <span className="text-sm font-medium text-[#0F172A] dark:text-white">
            {syncConversationsMutation.isPending
              ? "Syncing Conversations..."
              : "Sync Conversations (all apps)"}
          </span>
        </button>

        {/* Existing: Sync All Apps */}
        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="col-span-2 md:col-span-4 flex items-center justify-center gap-2 p-4 border border-[#E4E7EC] dark:border-[#404040] rounded-lg hover:bg-[#F8F9FA] dark:hover:bg-[#262626] transition-colors disabled:opacity-60"
        >
          {syncMutation.isPending ? (
            <RefreshCw
              size={18}
              className="animate-spin text-[#667085] dark:text-[#A1A1AA]"
            />
          ) : (
            <CheckCircle
              size={18}
              className="text-[#667085] dark:text-[#A1A1AA]"
            />
          )}
          <span className="text-sm font-medium text-[#0F172A] dark:text-white">
            {syncMutation.isPending ? "Syncing All Apps..." : "Sync All Apps"}
          </span>
        </button>

        {/* Existing: Process 10 Cancelled */}
        <button
          onClick={() => processCancelledMutation.mutate()}
          disabled={processCancelledMutation.isPending}
          className="col-span-2 md:col-span-4 flex items-center justify-center gap-2 p-4 border border-[#E4E7EC] dark:border-[#404040] rounded-lg hover:bg-[#F8F9FA] dark:hover:bg-[#262626] transition-colors disabled:opacity-60"
        >
          {processCancelledMutation.isPending ? (
            <RefreshCw
              size={18}
              className="animate-spin text-[#667085] dark:text-[#A1A1AA]"
            />
          ) : (
            <XCircle size={18} className="text-[#667085] dark:text-[#A1A1AA]" />
          )}
          <span className="text-sm font-medium text-[#0F172A] dark:text-white">
            {processCancelledMutation.isPending
              ? "Processing Cancelled..."
              : "Process 10 Cancelled"}
          </span>
        </button>
      </div>

      {/* Last sync result */}
      {lastResult && (
        <div className="mt-4 text-sm">
          {lastResult.ok ? (
            <div className="text-[#0F172A] dark:text-white">
              Synced {lastResult.data?.processed || 0} apps · Captured{" "}
              {lastResult.data?.captured || 0}
            </div>
          ) : (
            <div className="text-red-600 dark:text-red-300">
              {lastResult.error}
            </div>
          )}
        </div>
      )}

      {/* Last conversation import result */}
      {lastConvoResult && (
        <div className="mt-2 text-sm">
          {lastConvoResult.ok ? (
            <div className="text-[#0F172A] dark:text-white">
              {convoSummary ||
                "Conversation sync ran. Check memory for imported turns."}
            </div>
          ) : (
            <div className="text-red-600 dark:text-red-300">
              {lastConvoResult.error}
            </div>
          )}
        </div>
      )}

      {/* Last cancelled processing result */}
      {lastCancelResult && (
        <div className="mt-2 text-sm">
          {lastCancelResult.ok ? (
            <div className="text-[#0F172A] dark:text-white">
              Processed {lastCancelResult.data?.processed || 0} cancelled items
            </div>
          ) : (
            <div className="text-red-600 dark:text-red-300">
              {lastCancelResult.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
