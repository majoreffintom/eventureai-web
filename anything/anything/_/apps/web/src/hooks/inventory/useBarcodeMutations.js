import { useMutation } from "@tanstack/react-query";

export function useBarcodeMutations() {
  const barcodeLookupMutation = useMutation({
    mutationFn: async (barcode) => {
      const response = await fetch(
        `/api/admin/inventory/barcodes?barcode=${encodeURIComponent(barcode)}`,
        { method: "GET" },
      );
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        const msg = json?.error || "Could not look up barcode";
        throw new Error(msg);
      }
      return json;
    },
  });

  const barcodeLinkMutation = useMutation({
    mutationFn: async ({ barcode, item_id }) => {
      const response = await fetch("/api/admin/inventory/barcodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode, item_id }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        const msg = json?.error || "Could not link barcode";
        throw new Error(msg);
      }
      return json;
    },
  });

  return {
    barcodeLookupMutation,
    barcodeLinkMutation,
  };
}
