import { useQuery } from "@tanstack/react-query";

export function useMemoriaAdminStatus(userLoading) {
  return useQuery({
    queryKey: ["memoria-admin-status"],
    enabled: !userLoading,
    queryFn: async () => {
      const response = await fetch("/api/memoria/admin/me");
      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `When calling /api/memoria/admin/me, the response was [${response.status}] ${text}`,
        );
      }
      return response.json();
    },
  });
}
