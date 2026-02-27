import { useQuery } from "@tanstack/react-query";

export function useApps() {
  const { data: appsData, isLoading } = useQuery({
    queryKey: ["apps"],
    queryFn: async () => {
      const response = await fetch("/api/apps");
      if (!response.ok) throw new Error("Failed to fetch apps");
      return response.json();
    },
  });

  const apps = appsData?.apps || [];

  return { apps, isLoading };
}
