import { RefreshCw, Pencil } from "lucide-react";

export function DocumentList({
  documentsQuery,
  docId,
  setDocId,
  setDocTitle,
  setDocNotes,
  setDocUrl,
  setDocMimeType,
  setDocFile,
  setDocFields,
  setDocError,
  setDocSuccess,
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-[#0F172A] dark:text-white">
          Saved entries
        </h3>
        <button
          onClick={() => documentsQuery.refetch()}
          disabled={documentsQuery.isRefetching}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          aria-label="Refresh documents"
        >
          <RefreshCw
            size={16}
            className={documentsQuery.isRefetching ? "animate-spin" : ""}
          />
        </button>
      </div>

      {documentsQuery.isLoading ? (
        <div className="flex items-center justify-center py-10">
          <RefreshCw size={20} className="animate-spin text-gray-400" />
        </div>
      ) : documentsQuery.error ? (
        <div className="text-sm text-red-600 dark:text-red-300">
          Could not load documents.
        </div>
      ) : (documentsQuery.data?.documents || []).length ? (
        <div className="space-y-2 max-h-[420px] overflow-y-auto">
          {(documentsQuery.data?.documents || []).map((d) => {
            const isActive = String(d.id) === String(docId);
            const createdText = d?.created_at
              ? new Date(d.created_at).toLocaleString()
              : "";
            const fieldsCount =
              d?.fields && typeof d.fields === "object"
                ? Object.keys(d.fields).length
                : 0;

            return (
              <button
                key={d.id}
                onClick={() => {
                  setDocError(null);
                  setDocSuccess(null);
                  setDocId(d.id);
                  setDocTitle(d.title || "");
                  setDocNotes(d.notes || "");
                  setDocUrl(d.doc_url || null);
                  setDocMimeType(d.doc_mime_type || null);
                  setDocFile(null);

                  const entries =
                    d?.fields && typeof d.fields === "object"
                      ? Object.entries(d.fields)
                      : [];
                  const nextRows = entries.map(([key, value]) => ({
                    key: String(key),
                    value: value == null ? "" : String(value),
                  }));
                  setDocFields(
                    nextRows.length ? nextRows : [{ key: "", value: "" }],
                  );
                }}
                className={`w-full text-left p-3 rounded-lg border transition-all duration-150 ${
                  isActive
                    ? "border-purple-300 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800"
                    : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-[#0F172A] dark:text-white truncate">
                      {d.title}
                    </div>
                    <div className="text-xs text-[#667085] dark:text-[#A1A1AA] mt-1">
                      {createdText}
                      {fieldsCount ? ` • ${fieldsCount} fields` : ""}
                    </div>
                    {d.doc_url ? (
                      <div className="text-xs mt-1">
                        <a
                          href={d.doc_url}
                          target="_blank"
                          rel="noreferrer"
                          className="underline text-purple-700 dark:text-purple-300"
                          onClick={(e) => e.stopPropagation()}
                        >
                          open file
                        </a>
                      </div>
                    ) : null}
                  </div>
                  <Pencil size={16} className="text-gray-400 flex-shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-[#667085] dark:text-[#A1A1AA] py-6">
          No saved entries yet.
        </div>
      )}
    </div>
  );
}
