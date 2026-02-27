import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/utils/getErrorMessage";

export function useCreateMemoriaToken(
  isAdmin,
  newLabel,
  newAppSource,
  newCanRead,
  newCanWrite,
  newExpiresAt,
  newRateLimit,
  setPageError,
  setGeneratedToken,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (overridePayload) => {
      if (!isAdmin) {
        throw new Error("You must be a Memoria admin to create tokens.");
      }
      const rlRaw = Number(
        overridePayload?.rateLimitPerMinute ?? newRateLimit.trim(),
      );
      const rateLimitPerMinute = Number.isFinite(rlRaw) ? rlRaw : 120;

      const payload = {
        label: overridePayload?.label ?? newLabel,
        appSource: overridePayload?.appSource ?? newAppSource,
        canRead: overridePayload?.canRead ?? newCanRead,
        canWrite: overridePayload?.canWrite ?? newCanWrite,
        expiresAt:
          (overridePayload?.expiresAt ?? newExpiresAt).trim?.() || null,
        rateLimitPerMinute,
      };

      const response = await fetch("/api/memoria/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `When calling /api/memoria/keys, the response was [${response.status}] ${text}`,
        );
      }

      return response.json();
    },
    onMutate: () => {
      setPageError(null);
      setGeneratedToken(null);
    },
    onSuccess: (data) => {
      const token = data?.token || null;
      setGeneratedToken(token);
      queryClient.invalidateQueries({ queryKey: ["memoria-api-tokens"] });
    },
    onError: (e) => {
      console.error(e);
      setPageError(getErrorMessage(e));
    },
  });
}
