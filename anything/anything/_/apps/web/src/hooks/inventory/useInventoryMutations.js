import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useInventoryMutations() {
  const queryClient = useQueryClient();

  const createLocationMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await fetch("/api/admin/inventory/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        const msg = json?.error || "Could not create location";
        throw new Error(msg);
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "inventory", "locations"],
      });
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await fetch("/api/admin/inventory/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        const msg = json?.error || "Could not create item";
        throw new Error(msg);
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "inventory", "items"],
      });
    },
  });

  const receiveMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await fetch("/api/admin/inventory/movements/receive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        const msg = json?.error || "Could not receive inventory";
        throw new Error(msg);
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "inventory", "items"],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "inventory", "movements", "recent"],
      });
    },
  });

  const useItemMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await fetch("/api/admin/inventory/movements/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        const msg = json?.error || "Could not mark used";
        throw new Error(msg);
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "inventory", "items"],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "inventory", "movements", "recent"],
      });
    },
  });

  const transferMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await fetch("/api/admin/inventory/movements/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        const msg = json?.error || "Could not transfer";
        throw new Error(msg);
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "inventory", "items"],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "inventory", "movements", "recent"],
      });
    },
  });

  return {
    createLocationMutation,
    createItemMutation,
    receiveMutation,
    useItemMutation,
    transferMutation,
  };
}
