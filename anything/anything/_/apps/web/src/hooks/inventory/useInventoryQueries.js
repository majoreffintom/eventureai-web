import { useQuery } from "@tanstack/react-query";

export function useInventoryQueries() {
  const locationsQuery = useQuery({
    queryKey: ["admin", "inventory", "locations"],
    queryFn: async () => {
      const response = await fetch("/api/admin/inventory/locations", {
        method: "GET",
      });
      if (!response.ok) {
        throw new Error(
          `When fetching /api/admin/inventory/locations, the response was [${response.status}] ${response.statusText}`,
        );
      }
      return response.json();
    },
  });

  const itemsQuery = useQuery({
    queryKey: ["admin", "inventory", "items"],
    queryFn: async () => {
      const response = await fetch("/api/admin/inventory/items", {
        method: "GET",
      });
      if (!response.ok) {
        throw new Error(
          `When fetching /api/admin/inventory/items, the response was [${response.status}] ${response.statusText}`,
        );
      }
      return response.json();
    },
  });

  const movementsQuery = useQuery({
    queryKey: ["admin", "inventory", "movements", "recent"],
    queryFn: async () => {
      const response = await fetch("/api/admin/inventory/movements/recent", {
        method: "GET",
      });
      if (!response.ok) {
        throw new Error(
          `When fetching /api/admin/inventory/movements/recent, the response was [${response.status}] ${response.statusText}`,
        );
      }
      return response.json();
    },
  });

  return {
    locationsQuery,
    itemsQuery,
    movementsQuery,
  };
}
