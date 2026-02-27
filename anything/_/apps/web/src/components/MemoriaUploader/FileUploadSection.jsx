import { FileUp } from "lucide-react";

export function FileUploadSection({
  selectedFile,
  uploadedFileUrl,
  fileKindLabel,
  filePreviewCount,
  batchDelimiter,
  setBatchDelimiter,
  batchNewThreadPerChunk,
  setBatchNewThreadPerChunk,
  batchThreadPrefix,
  setBatchThreadPrefix,
  bulkProgress,
  canUploadFile,
  busy,
  fileItems,
  onPickFile,
  onUpload,
  onClear,
}) {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] p-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center">
          <FileUp size={18} />
        </div>
        <div className="flex-1">
          <div className="text-lg font-semibold text-[#0F172A] dark:text-white font-inter">
            Boss bulk upload (file)
          </div>
          <div className="text-sm text-[#667085] dark:text-[#A1A1AA]">
            Upload a .txt / .md / .json / .ndjson file. We'll parse it and push
            into Memoria using your token.
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
            File
          </label>
          <input
            type="file"
            accept=".txt,.md,.markdown,.json,.ndjson,text/plain,application/json"
            onChange={(e) => {
              const f =
                e.target.files && e.target.files[0] ? e.target.files[0] : null;
              onPickFile(f);
            }}
            className="w-full h-[44px] px-3 py-2 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none"
          />
          <div className="mt-1 text-xs text-[#667085] dark:text-[#A1A1AA]">
            PDFs aren't supported yet — if he has PDFs, we can add a "convert to
            text" flow next.
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
            Preview
          </label>
          <div className="h-[44px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-[#F8FAFC] dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white flex items-center justify-between">
            <div className="text-sm">
              {selectedFile ? (
                <span>
                  {fileKindLabel}:{" "}
                  <span className="font-semibold">{filePreviewCount || 0}</span>
                </span>
              ) : (
                <span className="text-[#667085] dark:text-[#A1A1AA]">
                  No file loaded
                </span>
              )}
            </div>
            {uploadedFileUrl && (
              <a
                href={uploadedFileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm underline"
              >
                Open
              </a>
            )}
          </div>
          <div className="mt-1 text-xs text-[#667085] dark:text-[#A1A1AA]">
            For text files, it splits using the same delimiter below.
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
            Split delimiter (text files)
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
          <div className="flex items-center gap-3 h-[44px]">
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
            </div>
          )}
        </div>
      </div>

      {bulkProgress && (
        <div className="mt-4 p-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F]">
          <div className="text-sm text-[#0F172A] dark:text-white">
            Uploading:{" "}
            <span className="font-semibold">{bulkProgress.done}</span> /{" "}
            {bulkProgress.total}
          </div>
          {bulkProgress.current && (
            <div className="mt-1 text-xs text-[#667085] dark:text-[#A1A1AA] font-mono">
              {bulkProgress.current}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onUpload}
          disabled={!canUploadFile || busy}
          className="h-[44px] px-4 rounded-lg bg-[#0F172A] hover:bg-[#17233A] text-white font-semibold disabled:opacity-60"
        >
          {busy ? "Working…" : "Upload file"}
        </button>

        {selectedFile && (
          <button
            type="button"
            onClick={onClear}
            disabled={busy}
            className="h-[44px] px-4 rounded-lg border border-[#E4E7EC] dark:border-[#404040] text-[#0F172A] dark:text-white hover:bg-[#F8F9FA] dark:hover:bg-[#262626] transition-colors disabled:opacity-60"
          >
            Clear
          </button>
        )}
      </div>

      {selectedFile && fileItems.length > 0 && (
        <div className="mt-4 text-xs text-[#667085] dark:text-[#A1A1AA]">
          Detected structured JSON items. Tip: you can include fields like{" "}
          <span className="font-mono">title</span>,{" "}
          <span className="font-mono">externalId</span>,{" "}
          <span className="font-mono">text</span>, or{" "}
          <span className="font-mono">turn</span>.
        </div>
      )}
    </div>
  );
}
