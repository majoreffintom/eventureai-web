export function UploadModeSelector({
  mode,
  setMode,
  externalId,
  setExternalId,
  title,
  setTitle,
  exampleExternalId,
}) {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-[#0F172A] dark:text-white">
          Upload mode
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode("single")}
            className={`h-[36px] px-3 rounded-lg border ${
              mode === "single"
                ? "bg-[#0F172A] text-white border-[#0F172A]"
                : "bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white border-[#E4E7EC] dark:border-[#404040]"
            }`}
          >
            Single
          </button>
          <button
            type="button"
            onClick={() => setMode("batch")}
            className={`h-[36px] px-3 rounded-lg border ${
              mode === "batch"
                ? "bg-[#0F172A] text-white border-[#0F172A]"
                : "bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white border-[#E4E7EC] dark:border-[#404040]"
            }`}
          >
            Batch
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
            external_id (thread)
          </label>
          <input
            value={externalId}
            onChange={(e) => setExternalId(e.target.value)}
            placeholder={exampleExternalId}
            className="w-full h-[44px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none font-mono"
          />
          <div className="mt-1 text-xs text-[#667085] dark:text-[#A1A1AA]">
            Recommended: <span className="font-mono">app_source:thing-id</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
            title (optional)
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-[44px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none"
          />
        </div>
      </div>
    </div>
  );
}
