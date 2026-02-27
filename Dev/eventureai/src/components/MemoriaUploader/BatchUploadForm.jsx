export function BatchUploadForm({
  batchText,
  setBatchText,
  batchDelimiter,
  setBatchDelimiter,
  batchNewThreadPerChunk,
  setBatchNewThreadPerChunk,
  batchThreadPrefix,
  setBatchThreadPrefix,
  canUploadBatch,
  busy,
  modeLabel,
  onUpload,
}) {
  return (
    <div className="mt-4">
      <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
        Batch content
      </label>
      <textarea
        value={batchText}
        onChange={(e) => setBatchText(e.target.value)}
        rows={10}
        placeholder={`Paste multiple concepts.\n\nUse a separator line like:\n${batchDelimiter}\n\nConcept 1...\n${batchDelimiter}\nConcept 2...`}
        className="w-full p-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none"
      />

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
            Separator
          </label>
          <input
            value={batchDelimiter}
            onChange={(e) => setBatchDelimiter(e.target.value)}
            className="w-full h-[44px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none font-mono"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
            Thread strategy
          </label>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-[#0F172A] dark:text-white">
              <input
                type="checkbox"
                checked={batchNewThreadPerChunk}
                onChange={(e) => setBatchNewThreadPerChunk(e.target.checked)}
              />
              New thread per chunk
            </label>
          </div>
          {batchNewThreadPerChunk && (
            <div className="mt-2">
              <input
                value={batchThreadPrefix}
                onChange={(e) => setBatchThreadPrefix(e.target.value)}
                placeholder="brother_advanced_research:concept"
                className="w-full h-[44px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none font-mono"
              />
              <div className="mt-1 text-xs text-[#667085] dark:text-[#A1A1AA]">
                Creates threads like <span className="font-mono">prefix-1</span>
                , <span className="font-mono">prefix-2</span>…
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onUpload}
          disabled={!canUploadBatch || busy}
          className="h-[44px] px-4 rounded-lg bg-[#0F172A] hover:bg-[#17233A] text-white font-semibold disabled:opacity-60"
        >
          {busy ? `Working… (${modeLabel})` : "Upload batch"}
        </button>
      </div>
    </div>
  );
}
