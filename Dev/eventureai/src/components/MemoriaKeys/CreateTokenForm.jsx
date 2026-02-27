import { Shield, Plus } from "lucide-react";

export function CreateTokenForm({
  newLabel,
  setNewLabel,
  newAppSource,
  setNewAppSource,
  newCanRead,
  setNewCanRead,
  newCanWrite,
  setNewCanWrite,
  newExpiresAt,
  setNewExpiresAt,
  newRateLimit,
  setNewRateLimit,
  onCreate,
  isAdmin,
  createBusy,
}) {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] p-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#0F172A] text-white flex items-center justify-center">
          <Shield size={18} />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-[#0F172A] dark:text-white font-inter">
            Create a token
          </h2>
          <p className="mt-1 text-sm text-[#667085] dark:text-[#A1A1AA]">
            Tokens are scoped to Memoria only, and reads are limited to the
            token's app_source.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
            Label
          </label>
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="w-full h-[44px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
            app_source
          </label>
          <input
            value={newAppSource}
            onChange={(e) => setNewAppSource(e.target.value)}
            className="w-full h-[44px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none font-mono"
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="inline-flex items-center gap-2 text-sm text-[#0F172A] dark:text-white">
            <input
              type="checkbox"
              checked={newCanRead}
              onChange={(e) => setNewCanRead(e.target.checked)}
            />
            Read
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-[#0F172A] dark:text-white">
            <input
              type="checkbox"
              checked={newCanWrite}
              onChange={(e) => setNewCanWrite(e.target.checked)}
            />
            Write
          </label>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
            Expires at (optional)
          </label>
          <input
            value={newExpiresAt}
            onChange={(e) => setNewExpiresAt(e.target.value)}
            placeholder="2026-01-01T00:00:00Z"
            className="w-full h-[44px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none font-mono"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
            Rate limit (requests/min)
          </label>
          <input
            value={newRateLimit}
            onChange={(e) => setNewRateLimit(e.target.value)}
            placeholder="120"
            className="w-full h-[44px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none font-mono"
          />
          <div className="mt-1 text-xs text-[#667085] dark:text-[#A1A1AA]">
            Default is 120. If you exceed this, the API returns HTTP 429.
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <button
          type="button"
          onClick={onCreate}
          disabled={!isAdmin || createBusy}
          className="h-[44px] px-4 rounded-lg bg-[#0F172A] hover:bg-[#17233A] text-white font-semibold disabled:opacity-60 inline-flex items-center gap-2"
        >
          <Plus size={16} />
          {createBusy ? "Creating..." : "Create token"}
        </button>

        <div className="text-sm text-[#667085] dark:text-[#A1A1AA]">
          The secret is shown once.
        </div>
      </div>
    </div>
  );
}
