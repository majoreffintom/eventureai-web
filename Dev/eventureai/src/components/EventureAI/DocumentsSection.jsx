import { FileText, X } from "lucide-react";
import { DocumentForm } from "./DocumentForm";
import { DocumentList } from "./DocumentList";

export function DocumentsSection({
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
  documentsQuery,
  upsertDocumentMutation,
  deleteDocumentMutation,
  exportDocumentMutation,
  uploadLoading,
  setDocId,
  setDocUrl,
  setDocMimeType,
  setDocError,
  setDocSuccess,
}) {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] p-6 mb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-purple-600" />
            <h2 className="text-lg font-semibold text-[#0F172A] dark:text-white">
              EventureAI Documents
            </h2>
          </div>
          <p className="text-sm text-[#667085] dark:text-[#A1A1AA] mt-1">
            Upload a file, fill out the key details, and we'll store it in a
            table so you can find it later.
          </p>
        </div>

        {docId ? (
          <button
            onClick={clearDocForm}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-[#0F172A] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <X size={16} />
            New
          </button>
        ) : null}
      </div>

      {documentsQuery.data?.unauthorized ? (
        <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-[#2A2A2A] border border-black/10 dark:border-[#404040] text-sm text-black/70 dark:text-[#E5E7EB]">
          You're not signed in. Please{" "}
          <a className="underline" href="/account/signin">
            sign in
          </a>{" "}
          to upload and save documents.
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <DocumentForm
          docId={docId}
          docTitle={docTitle}
          setDocTitle={setDocTitle}
          docNotes={docNotes}
          setDocNotes={setDocNotes}
          docUrl={docUrl}
          docMimeType={docMimeType}
          docFile={docFile}
          setDocFile={setDocFile}
          docFields={docFields}
          setDocFields={setDocFields}
          docError={docError}
          docSuccess={docSuccess}
          clearDocForm={clearDocForm}
          upsertDocumentMutation={upsertDocumentMutation}
          deleteDocumentMutation={deleteDocumentMutation}
          exportDocumentMutation={exportDocumentMutation}
          uploadLoading={uploadLoading}
          documentsQuery={documentsQuery}
          setDocSuccess={setDocSuccess}
          setDocError={setDocError}
        />

        <DocumentList
          documentsQuery={documentsQuery}
          docId={docId}
          setDocId={setDocId}
          setDocTitle={setDocTitle}
          setDocNotes={setDocNotes}
          setDocUrl={setDocUrl}
          setDocMimeType={setDocMimeType}
          setDocFile={setDocFile}
          setDocFields={setDocFields}
          setDocError={setDocError}
          setDocSuccess={setDocSuccess}
        />
      </div>
    </div>
  );
}
