import { FileUp } from "lucide-react";

export function QuickUploadForm({
  uploadExternalId,
  setUploadExternalId,
  uploadText,
  setUploadText,
  onUpload,
  hasGeneratedToken,
  uploadBusy,
}) {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] p-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#111827] text-white flex items-center justify-center">
          <FileUp size={18} />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-[#0F172A] dark:text-white font-inter">
            Quick upload (uses the token above)
          </h2>
          <p className="mt-1 text-sm text-[#667085] dark:text-[#A1A1AA]">
            This is just a convenience tool. Your brother can also use
            curl/Postman.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
          external_id
        </label>
        <input
          value={uploadExternalId}
          onChange={(e) => setUploadExternalId(e.target.value)}
          className="w-full h-[44px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none font-mono"
        />
      </div>

      <div className="mt-3">
        <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
          Paste content
        </label>
        <textarea
          value={uploadText}
          onChange={(e) => setUploadText(e.target.value)}
          rows={5}
          placeholder="Paste a concept, doc snippet, or notes…"
          className="w-full p-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none"
        />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onUpload}
          disabled={!hasGeneratedToken || uploadBusy}
          className="h-[44px] px-4 rounded-lg bg-[#0F172A] hover:bg-[#17233A] text-white font-semibold disabled:opacity-60"
        >
          {uploadBusy ? "Uploading..." : "Upload to Memoria"}
        </button>
        {!hasGeneratedToken && (
          <div className="text-sm text-[#667085] dark:text-[#A1A1AA]">
            Create a token first.
          </div>
        )}
      </div>
    </div>
  );
}
