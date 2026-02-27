import { useMutation } from "@tanstack/react-query";

export function useEventureAICron() {
  const testCronMutation = useMutation({
    mutationFn: async ({ action, selectedMemoryType }) => {
      const response = await fetch("/api/eventureai/cron", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer demo-secret",
        },
        body: JSON.stringify({
          action,
          memory_type: selectedMemoryType,
        }),
      });

      const result = await response.json();
      return result;
    },
  });

  return {
    testCronMutation,
  };
}
