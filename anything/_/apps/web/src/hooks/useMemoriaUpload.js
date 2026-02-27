import { useMutation } from "@tanstack/react-query";
import { getErrorMessage } from "@/utils/getErrorMessage";

export function useMemoriaUpload(
  generatedToken,
  uploadText,
  uploadExternalId,
  uploadAppSource,
  setUploadText,
  setPageError,
) {
  return useMutation({
    mutationFn: async () => {
      if (!generatedToken?.token) {
        throw new Error(
          "Generate a token first (or paste one into a script). ",
        );
      }
      if (!uploadText.trim()) {
        throw new Error("Paste something to upload first.");
      }

      const payload = {
        externalId: uploadExternalId,
        title: "Brother upload",
        index: "Cross_App_Conversations",
        subindex: uploadAppSource,
        turn: {
          userText: uploadText.trim(),
          assistantThinkingSummary: null,
          assistantSynthesis: null,
          codeSummary: null,
          assistantResponse: null,
          metadata: {
            source: "manual_upload",
          },
        },
      };

      const response = await fetch("/api/memoria/external/capture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${generatedToken.token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `When calling /api/memoria/external/capture, the response was [${response.status}] ${text}`,
        );
      }

      return response.json();
    },
    onSuccess: () => {
      setUploadText("");
    },
    onError: (e) => {
      console.error(e);
      setPageError(getErrorMessage(e));
    },
  });
}
