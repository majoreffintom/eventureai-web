import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/utils/getErrorMessage";

export function useUpdateMemoriaToken(isAdmin, setPageError) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch) => {
      if (!isAdmin) {
        throw new Error("You must be a Memoria admin to update tokens.");
      }
      const response = await fetch("/api/memoria/keys", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patch),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `When calling /api/memoria/keys (PATCH), the response was [${response.status}] ${text}`,
        );
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memoria-api-tokens"] });
    },
    onError: (e) => {
      console.error(e);
      setPageError(getErrorMessage(e));
    },
  });
}
