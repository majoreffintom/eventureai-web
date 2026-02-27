import { useMutation } from "@tanstack/react-query";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { escapeRegExp } from "@/utils/textFormatUtils";

export function useFileImportMutation(
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
) {
  return useMutation({
    mutationFn: async () => {
      if (!tokenReady) {
        throw new Error("Paste a bearer token first.");
      }

      if (!fileRawText.trim() && fileItems.length === 0) {
        throw new Error("Pick a file and load it first.");
      }

      // If we parsed JSON/NDJSON into items, upload those.
      if (fileItems.length > 0) {
        const results = [];
        setBulkProgress({ total: fileItems.length, done: 0, current: null });

        for (let idx = 0; idx < fileItems.length; idx += 1) {
          const item = fileItems[idx];

          const threadExternalId =
            item.externalId ||
            (batchNewThreadPerChunk
              ? `${batchThreadPrefix.trim() || "brother_advanced_research:concept"}-${idx + 1}`
              : externalId.trim() || exampleExternalId);

          const payload = {
            externalId: threadExternalId,
            title: item.title || title.trim() || null,
            index: "Cross_App_Conversations",
            metadata: {
              source: "uploader_ui_file",
              fileUrl: uploadedFileUrl,
              fileMime: uploadedFileMime,
              ...(item.metadata || {}),
            },
          };

          if (item.turn) {
            payload.turn = item.turn;
          } else if (item.messages) {
            payload.messages = item.messages;
          } else {
            payload.turn = {
              userText: item.text || "(empty)",
              metadata: {
                source: "uploader_ui_file_item_text",
                itemIndex: idx,
                itemCount: fileItems.length,
              },
            };
          }

          setBulkProgress({
            total: fileItems.length,
            done: idx,
            current: threadExternalId,
          });

          // eslint-disable-next-line no-await-in-loop
          const res = await api.capture(payload);
          results.push(res);

          setBulkProgress({
            total: fileItems.length,
            done: idx + 1,
            current: threadExternalId,
          });
        }

        return { ok: true, mode: "file_items", count: results.length, results };
      }

      // Otherwise treat file as text and use delimiter splitting (same as batch).
      const delimiter = batchDelimiter.trim() || "---";
      const raw = fileRawText.trim();

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
      setBulkProgress({ total: parts.length, done: 0, current: null });

      for (let idx = 0; idx < parts.length; idx += 1) {
        const chunk = parts[idx];
        const threadExternalId = batchNewThreadPerChunk
          ? `${batchThreadPrefix.trim() || "brother_advanced_research:concept"}-${idx + 1}`
          : externalId.trim() || exampleExternalId;

        const payload = {
          externalId: threadExternalId,
          title: title.trim() || null,
          index: "Cross_App_Conversations",
          metadata: {
            source: "uploader_ui_file_text",
            fileUrl: uploadedFileUrl,
            fileMime: uploadedFileMime,
            chunkIndex: idx,
            chunkCount: parts.length,
          },
          turn: {
            userText: chunk,
          },
        };

        setBulkProgress({
          total: parts.length,
          done: idx,
          current: threadExternalId,
        });
        // eslint-disable-next-line no-await-in-loop
        const res = await api.capture(payload);
        results.push(res);
        setBulkProgress({
          total: parts.length,
          done: idx + 1,
          current: threadExternalId,
        });
      }

      return { ok: true, mode: "file_text", count: results.length, results };
    },
    onMutate: () => {
      setPageError(null);
      setLastResult(null);
    },
    onSuccess: (data) => {
      setLastResult(data);
      setBulkProgress(null);
    },
    onError: (e) => {
      console.error(e);
      setBulkProgress(null);
      setPageError(getErrorMessage(e));
    },
  });
}
