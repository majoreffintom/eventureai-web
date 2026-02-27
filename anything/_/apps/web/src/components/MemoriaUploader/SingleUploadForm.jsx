export function SingleUploadForm({
  text,
  setText,
  canUploadSingle,
  busy,
  modeLabel,
  onUpload,
}) {
  return (
    <div className="mt-4">
      <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
        Content
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        placeholder="Paste a concept, design doc, research notes…"
        className="w-full p-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none"
      />

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onUpload}
          disabled={!canUploadSingle || busy}
          className="h-[44px] px-4 rounded-lg bg-[#0F172A] hover:bg-[#17233A] text-white font-semibold disabled:opacity-60"
        >
          {busy ? `Working… (${modeLabel})` : "Upload"}
        </button>
      </div>
    </div>
  );
}
