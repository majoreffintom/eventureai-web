import { useMutation } from "@tanstack/react-query";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { escapeRegExp } from "@/utils/textFormatUtils";

export function useBatchCaptureMutation(
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
) {
  return useMutation({
    mutationFn: async () => {
      if (!tokenReady) {
        throw new Error("Paste a bearer token first.");
      }
      const delimiter = batchDelimiter.trim() || "---";
      const raw = batchText.trim();
      if (!raw) {
        throw new Error("Paste content to upload.");
      }

      const splitRe = new RegExp(
        `\\n\\s*${escapeRegExp(delimiter)}\\s*\\n`,
        "g",
      );

      const parts = raw
        .split(splitRe)
        .map((p) => p.trim())
        .filter(Boolean);

      if (parts.length === 0) {
        throw new Error("Nothing to upload after splitting.");
      }

      const results = [];

      for (let idx = 0; idx < parts.length; idx += 1) {
        const chunk = parts[idx];
        const threadExternalId = batchNewThreadPerChunk
          ? `${batchThreadPrefix.trim() || "brother_advanced_research:concept"}-${idx + 1}`
          : externalId.trim() || exampleExternalId;

        const payload = {
          externalId: threadExternalId,
          title: title.trim() || null,
          index: "Cross_App_Conversations",
          turn: {
            userText: chunk,
            metadata: {
              source: "uploader_ui_batch",
              chunkIndex: idx,
              chunkCount: parts.length,
            },
          },
        };

        // eslint-disable-next-line no-await-in-loop
        const res = await api.capture(payload);
        results.push(res);
      }

      return { count: results.length, results };
    },
    onMutate: () => {
      setPageError(null);
      setLastResult(null);
    },
    onSuccess: (data) => {
      setLastResult(data);
      setBatchText("");
    },
    onError: (e) => {
      console.error(e);
      setPageError(getErrorMessage(e));
    },
  });
}
