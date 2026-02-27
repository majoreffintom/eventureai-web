"use client";

import useMemoriaExternal from "@/utils/useMemoriaExternal";
import useUpload from "@/utils/useUpload";
import { useMemoriaUploader } from "@/hooks/useMemoriaUploader";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useCaptureMutation } from "@/hooks/useCaptureMutation";
import { useBatchCaptureMutation } from "@/hooks/useBatchCaptureMutation";
import { useSearchMutation } from "@/hooks/useSearchMutation";
import { useFileImportMutation } from "@/hooks/useFileImportMutation";
import { PageHeader } from "@/components/MemoriaUploader/PageHeader";
import { TokenInput } from "@/components/MemoriaUploader/TokenInput";
import { ErrorDisplay } from "@/components/MemoriaUploader/ErrorDisplay";
import { UploadModeSelector } from "@/components/MemoriaUploader/UploadModeSelector";
import { SingleUploadForm } from "@/components/MemoriaUploader/SingleUploadForm";
import { BatchUploadForm } from "@/components/MemoriaUploader/BatchUploadForm";
import { FileUploadSection } from "@/components/MemoriaUploader/FileUploadSection";
import { SearchSection } from "@/components/MemoriaUploader/SearchSection";
import { ResultDisplay } from "@/components/MemoriaUploader/ResultDisplay";

export default function MemoriaUploaderPage() {
  const {
    token,
    setToken,
    mode,
    setMode,
    externalId,
    setExternalId,
    title,
    setTitle,
    text,
    setText,
    batchText,
    setBatchText,
    batchDelimiter,
    setBatchDelimiter,
    batchNewThreadPerChunk,
    setBatchNewThreadPerChunk,
    batchThreadPrefix,
    setBatchThreadPrefix,
    searchQ,
    setSearchQ,
    pageError,
    setPageError,
    lastResult,
    setLastResult,
    tokenReady,
    exampleExternalId,
    resultJson,
    canUploadSingle,
    canUploadBatch,
  } = useMemoriaUploader();

  const [upload, { loading: uploadLoading }] = useUpload();

  const {
    selectedFile,
    uploadedFileUrl,
    uploadedFileMime,
    fileRawText,
    fileItems,
    filePreviewCount,
    bulkProgress,
    setBulkProgress,
    onPickFile,
    clearFile,
    canUploadFile,
    fileKindLabel,
  } = useFileUpload(upload, batchDelimiter);

  const api = useMemoriaExternal(token.trim());

  const captureMutation = useCaptureMutation(
    api,
    tokenReady,
    externalId,
    title,
    text,
    setPageError,
    setLastResult,
    setText,
  );

  const batchCaptureMutation = useBatchCaptureMutation(
    api,
    tokenReady,
    batchText,
    batchDelimiter,
    batchNewThreadPerChunk,
    batchThreadPrefix,
    externalId,
    exampleExternalId,
    title,
    setPageError,
    setLastResult,
    setBatchText,
  );

  const searchMutation = useSearchMutation(
    api,
    tokenReady,
    searchQ,
    setPageError,
    setLastResult,
  );

  const fileImportMutation = useFileImportMutation(
    api,
    tokenReady,
    fileRawText,
    fileItems,
    uploadedFileUrl,
    uploadedFileMime,
    batchDelimiter,
    batchNewThreadPerChunk,
    batchThreadPrefix,
    externalId,
    exampleExternalId,
    title,
    setBulkProgress,
    setPageError,
    setLastResult,
  );

  const busy =
    captureMutation.isPending ||
    batchCaptureMutation.isPending ||
    searchMutation.isPending ||
    fileImportMutation.isPending ||
    uploadLoading;

  const modeLabel = mode === "batch" ? "Batch" : "Single";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212]">
      <PageHeader />

      <TokenInput token={token} setToken={setToken} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-8 space-y-6">
        <ErrorDisplay error={pageError} />

        <UploadModeSelector
          mode={mode}
          setMode={setMode}
          externalId={externalId}
          setExternalId={setExternalId}
          title={title}
          setTitle={setTitle}
          exampleExternalId={exampleExternalId}
        />

        {mode === "single" && (
          <SingleUploadForm
            text={text}
            setText={setText}
            canUploadSingle={canUploadSingle}
            busy={busy}
            modeLabel={modeLabel}
            onUpload={() => captureMutation.mutate()}
          />
        )}

        {mode === "batch" && (
          <BatchUploadForm
            batchText={batchText}
            setBatchText={setBatchText}
            batchDelimiter={batchDelimiter}
            setBatchDelimiter={setBatchDelimiter}
            batchNewThreadPerChunk={batchNewThreadPerChunk}
            setBatchNewThreadPerChunk={setBatchNewThreadPerChunk}
            batchThreadPrefix={batchThreadPrefix}
            setBatchThreadPrefix={setBatchThreadPrefix}
            canUploadBatch={canUploadBatch}
            busy={busy}
            modeLabel={modeLabel}
            onUpload={() => batchCaptureMutation.mutate()}
          />
        )}

        <FileUploadSection
          selectedFile={selectedFile}
          uploadedFileUrl={uploadedFileUrl}
          fileKindLabel={fileKindLabel}
          filePreviewCount={filePreviewCount}
          batchDelimiter={batchDelimiter}
          setBatchDelimiter={setBatchDelimiter}
          batchNewThreadPerChunk={batchNewThreadPerChunk}
          setBatchNewThreadPerChunk={setBatchNewThreadPerChunk}
          batchThreadPrefix={batchThreadPrefix}
          setBatchThreadPrefix={setBatchThreadPrefix}
          bulkProgress={bulkProgress}
          canUploadFile={canUploadFile}
          busy={busy}
          fileItems={fileItems}
          onPickFile={(f) => onPickFile(f, setPageError, setLastResult)}
          onUpload={() => fileImportMutation.mutate()}
          onClear={clearFile}
        />

        <SearchSection
          searchQ={searchQ}
          setSearchQ={setSearchQ}
          tokenReady={tokenReady}
          busy={busy}
          onSearch={() => searchMutation.mutate()}
        />

        <ResultDisplay resultJson={resultJson} />
      </div>
    </div>
  );
}
