import { useState, useCallback } from "react";
import {
  sniffTextFormat,
  normalizeBulkItems,
  fetchTextFromUrl,
  escapeRegExp,
} from "@/utils/textFormatUtils";
import { getErrorMessage } from "@/utils/getErrorMessage";

export function useFileUpload(upload, batchDelimiter) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [uploadedFileMime, setUploadedFileMime] = useState(null);
  const [fileRawText, setFileRawText] = useState("");
  const [fileItems, setFileItems] = useState([]);
  const [filePreviewCount, setFilePreviewCount] = useState(0);
  const [bulkProgress, setBulkProgress] = useState(null);

  const onPickFile = useCallback(
    async (file, setPageError, setLastResult) => {
      try {
        setPageError(null);
        setLastResult(null);
        setSelectedFile(file || null);
        setUploadedFileUrl(null);
        setUploadedFileMime(null);
        setFileRawText("");
        setFileItems([]);
        setFilePreviewCount(0);

        if (!file) return;

        const { url, mimeType, error } = await upload({ file });
        if (error) {
          throw new Error(error);
        }

        setUploadedFileUrl(url);
        setUploadedFileMime(mimeType || null);

        const raw = await fetchTextFromUrl(url);
        setFileRawText(raw);

        const sniffed = sniffTextFormat(raw);
        if (sniffed.kind === "json" || sniffed.kind === "ndjson") {
          const items = normalizeBulkItems(sniffed.parsed);
          setFileItems(items);
          setFilePreviewCount(items.length);
        } else {
          // preview count for delimiter split
          const delimiter = batchDelimiter.trim() || "---";
          const splitRe = new RegExp(
            `\\n\\s*${escapeRegExp(delimiter)}\\s*\\n`,
            "g",
          );
          const parts = raw
            .trim()
            .split(splitRe)
            .map((p) => p.trim())
            .filter(Boolean);
          setFilePreviewCount(parts.length);
        }
      } catch (e) {
        console.error(e);
        setPageError(getErrorMessage(e));
      }
    },
    [upload, batchDelimiter],
  );

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setUploadedFileUrl(null);
    setUploadedFileMime(null);
    setFileRawText("");
    setFileItems([]);
    setFilePreviewCount(0);
    setBulkProgress(null);
  }, []);

  const canUploadFile =
    (fileItems.length > 0 && fileItems.length <= 1000) ||
    (fileRawText.trim() && filePreviewCount > 0);

  const fileKindLabel = fileItems.length > 0 ? "JSON/NDJSON items" : "Text";

  return {
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
  };
}
