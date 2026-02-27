import { Upload, Trash2, RefreshCw, Download } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";

// NOTE: Template presets were removed.

export function DocumentForm({
  docId,
  docTitle,
  setDocTitle,
  docNotes,
  setDocNotes,
  docUrl,
  docMimeType,
  docFile,
  setDocFile,
  docFields,
  setDocFields,
  docError,
  docSuccess,
  clearDocForm,
  upsertDocumentMutation,
  deleteDocumentMutation,
  exportDocumentMutation,
  uploadLoading,
  documentsQuery,
  setDocSuccess,
  setDocError,
}) {
  const photoInputRef = useRef(null);
  const docInputRef = useRef(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState(null);

  const [exportError, setExportError] = useState(null);

  const canExport = !!docId && !documentsQuery.data?.unauthorized;
  const isExporting = exportDocumentMutation?.isPending;
  const exportDisabled = !canExport || isExporting;

  const exportTitleText = canExport
    ? "Download a PDF"
    : "Save and sign in to export";

  const downloadPdf = useCallback(async () => {
    setExportError(null);
    setDocSuccess(null);
    setDocError(null);

    if (!docId) {
      setExportError("Save this entry first, then export.");
      return;
    }

    try {
      const result = await exportDocumentMutation.mutateAsync({ id: docId });
      const blob = result?.blob;
      const filename = result?.filename || "eventureai-export.pdf";

      if (!blob) {
        throw new Error("Export failed: missing PDF data");
      }

      // browser-only download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setDocSuccess("PDF downloaded");
    } catch (error) {
      console.error(error);
      setExportError(error?.message || "Could not export PDF");
    }
  }, [docId, exportDocumentMutation, setDocError, setDocSuccess]);

  const isImageFile = useMemo(() => {
    if (!docFile) return false;
    const type = (docFile.type || "").toLowerCase();
    if (type.startsWith("image/")) return true;
    const name = (docFile.name || "").toLowerCase();
    return (
      name.endsWith(".png") ||
      name.endsWith(".jpg") ||
      name.endsWith(".jpeg") ||
      name.endsWith(".webp") ||
      name.endsWith(".heic") ||
      name.endsWith(".heif")
    );
  }, [docFile]);

  useEffect(() => {
    // only build previews in the browser
    if (!docFile) {
      setLocalPreviewUrl(null);
      return;
    }
    if (!isImageFile) {
      setLocalPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(docFile);
    setLocalPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [docFile, isImageFile]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-1">
          Title
        </label>
        <input
          value={docTitle}
          onChange={(e) => setDocTitle(e.target.value)}
          placeholder="e.g. EventureAI - DNS + Integration Notes"
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#333333] text-[#0F172A] dark:text-white"
        />
      </div>

      {/* Templates section removed */}

      <div>
        <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-1">
          Add a file (optional)
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-[#333333] text-[#0F172A] dark:text-white"
          >
            Choose screenshot / photo
          </button>
          <button
            type="button"
            onClick={() => docInputRef.current?.click()}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-[#333333] text-[#0F172A] dark:text-white"
          >
            Choose document
          </button>
          {docFile ? (
            <button
              type="button"
              onClick={() => setDocFile(null)}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-[#333333] text-[#0F172A] dark:text-white"
            >
              Clear file
            </button>
          ) : null}
        </div>

        {/* Hidden inputs so mobile can show the right picker (photos vs files) */}
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*,.heic,.HEIC,.heif,.HEIF,image/heic,image/heif"
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            setDocFile(file);
            setDocSuccess(null);
            setDocError(null);
            if (file && !docTitle.trim()) {
              setDocTitle(file.name);
            }
          }}
          className="hidden"
        />
        <input
          ref={docInputRef}
          type="file"
          accept=".pdf,.doc,.DOC,.docx,.DOCX,.txt,.rtf,.md,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            setDocFile(file);
            setDocSuccess(null);
            setDocError(null);
            if (file && !docTitle.trim()) {
              setDocTitle(file.name);
            }
          }}
          className="hidden"
        />

        <div className="mt-2 text-xs text-[#667085] dark:text-[#A1A1AA]">
          You can attach a screenshot/photo (PNG/JPG/WEBP/HEIC) or a document
          (PDF/DOC/DOCX/TXT/RTF/MD).
        </div>

        {localPreviewUrl ? (
          <div className="mt-3">
            <div className="text-xs text-[#667085] dark:text-[#A1A1AA] mb-2">
              Preview
            </div>
            <img
              src={localPreviewUrl}
              alt="Selected upload preview"
              className="w-full max-h-[280px] object-contain rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#111111]"
            />
          </div>
        ) : null}

        {docUrl ? (
          <div className="mt-2 text-sm text-[#667085] dark:text-[#A1A1AA]">
            Current file:{" "}
            <a
              className="underline"
              href={docUrl}
              target="_blank"
              rel="noreferrer"
            >
              open
            </a>
          </div>
        ) : null}
        {docFile ? (
          <div className="mt-2 text-xs text-[#667085] dark:text-[#A1A1AA]">
            Selected: {docFile.name}
          </div>
        ) : null}
      </div>

      <div>
        <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-1">
          Notes
        </label>
        <textarea
          value={docNotes}
          onChange={(e) => setDocNotes(e.target.value)}
          rows={3}
          placeholder="Any quick context about this document"
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#333333] text-[#0F172A] dark:text-white"
        />
      </div>

      <div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <label className="block text-sm font-medium text-[#0F172A] dark:text-white">
            Key fields
          </label>
          <button
            onClick={() =>
              setDocFields((prev) => [...prev, { key: "", value: "" }])
            }
            className="text-sm text-purple-700 dark:text-purple-300 hover:underline"
            type="button"
          >
            + Add row
          </button>
        </div>

        <div className="space-y-2">
          {docFields.map((row, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                value={row.key}
                onChange={(e) => {
                  const next = [...docFields];
                  next[idx] = { ...next[idx], key: e.target.value };
                  setDocFields(next);
                }}
                placeholder="Field name (e.g. CNAME www)"
                className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#333333] text-[#0F172A] dark:text-white"
              />
              <div className="flex gap-2">
                <input
                  value={row.value}
                  onChange={(e) => {
                    const next = [...docFields];
                    next[idx] = { ...next[idx], value: e.target.value };
                    setDocFields(next);
                  }}
                  placeholder="Value"
                  className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#333333] text-[#0F172A] dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = docFields.filter((_, i) => i !== idx);
                    setDocFields(next.length ? next : [{ key: "", value: "" }]);
                  }}
                  className="px-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  aria-label="Remove row"
                >
                  <Trash2 size={16} className="text-gray-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              const fieldsObject = {};
              for (const row of docFields) {
                const k = (row?.key || "").trim();
                const v = (row?.value || "").trim();
                if (!k) continue;
                fieldsObject[k] = v;
              }
              upsertDocumentMutation.mutate({
                docId,
                docTitle,
                docNotes,
                docFile,
                docUrl,
                docMimeType,
                fieldsObject,
              });
            }}
            disabled={
              upsertDocumentMutation.isPending ||
              uploadLoading ||
              documentsQuery.data?.unauthorized
            }
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-150"
          >
            {upsertDocumentMutation.isPending || uploadLoading ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            {docId ? "Save" : "Upload & Save"}
          </button>

          {docId ? (
            <button
              type="button"
              onClick={downloadPdf}
              disabled={exportDisabled}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-[#0F172A] dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
              title={exportTitleText}
            >
              {isExporting ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              Download PDF
            </button>
          ) : null}
        </div>

        {docId ? (
          <button
            onClick={() => {
              const ok = window.confirm("Delete this document entry?");
              if (!ok) return;
              deleteDocumentMutation.mutate(docId);
            }}
            disabled={deleteDocumentMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 size={16} />
            Delete
          </button>
        ) : (
          <button
            onClick={clearDocForm}
            className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-[#0F172A] dark:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {docError ? (
        <div className="text-sm text-red-600 dark:text-red-300">{docError}</div>
      ) : null}
      {exportError ? (
        <div className="text-sm text-red-600 dark:text-red-300">
          {exportError}
        </div>
      ) : null}
      {docSuccess ? (
        <div className="text-sm text-green-700 dark:text-green-300">
          {docSuccess}
        </div>
      ) : null}
    </div>
  );
}
