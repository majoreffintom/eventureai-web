import { useMutation } from "@tanstack/react-query";
import { getErrorMessage } from "@/utils/getErrorMessage";

export function useSearchMutation(
  api,
  tokenReady,
  searchQ,
  setPageError,
  setLastResult,
) {
  return useMutation({
    mutationFn: async () => {
      if (!tokenReady) {
        throw new Error("Paste a bearer token first.");
      }
      const qFinal = searchQ.trim();
      if (!qFinal) {
        throw new Error("Search query is required.");
      }
      return api.search({ q: qFinal, limit: 50 });
    },
    onMutate: () => {
      setPageError(null);
      setLastResult(null);
    },
    onSuccess: (data) => {
      setLastResult(data);
    },
    onError: (e) => {
      console.error(e);
      setPageError(getErrorMessage(e));
    },
  });
}
