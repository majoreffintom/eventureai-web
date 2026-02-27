import { useState, useMemo } from "react";
import { safeNowIso } from "@/utils/dateUtils";

export function useMemoriaUploader() {
  const [token, setToken] = useState("");
  const [mode, setMode] = useState("single");
  const [externalId, setExternalId] = useState(
    `brother_advanced_research:upload-${safeNowIso().slice(0, 10)}`,
  );
  const [title, setTitle] = useState("Brother upload");
  const [text, setText] = useState("");
  const [batchText, setBatchText] = useState("");
  const [batchDelimiter, setBatchDelimiter] = useState("---");
  const [batchNewThreadPerChunk, setBatchNewThreadPerChunk] = useState(false);
  const [batchThreadPrefix, setBatchThreadPrefix] = useState(
    "brother_advanced_research:concept",
  );
  const [searchQ, setSearchQ] = useState("");
  const [pageError, setPageError] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const tokenReady = token.trim().length > 0;

  const exampleExternalId = useMemo(() => {
    return `brother_advanced_research:thread-${safeNowIso().slice(0, 10)}-001`;
  }, []);

  const resultJson = useMemo(() => {
    if (!lastResult) return "";
    try {
      return JSON.stringify(lastResult, null, 2);
    } catch {
      return String(lastResult);
    }
  }, [lastResult]);

  const canUploadSingle = tokenReady && externalId.trim() && text.trim();
  const canUploadBatch = tokenReady && batchText.trim();

  return {
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
  };
}
