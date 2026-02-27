import { useMutation } from "@tanstack/react-query";
import { getErrorMessage } from "@/utils/getErrorMessage";

export function useCaptureMutation(
  api,
  tokenReady,
  externalId,
  title,
  text,
  setPageError,
  setLastResult,
  setText,
) {
  return useMutation({
    mutationFn: async () => {
      if (!tokenReady) {
        throw new Error("Paste a bearer token first.");
      }
      if (!externalId.trim()) {
        throw new Error("external_id is required.");
      }
      if (!text.trim()) {
        throw new Error("Paste content to upload.");
      }

      const payload = {
        externalId: externalId.trim(),
        title: title.trim() || null,
        index: "Cross_App_Conversations",
        // subindex is locked by token app_source on the server
        turn: {
          userText: text.trim(),
          metadata: {
            source: "uploader_ui",
          },
        },
      };

      return api.capture(payload);
    },
    onMutate: () => {
      setPageError(null);
      setLastResult(null);
    },
    onSuccess: (data) => {
      setLastResult(data);
      setText("");
    },
    onError: (e) => {
      console.error(e);
      setPageError(getErrorMessage(e));
    },
  });
}
