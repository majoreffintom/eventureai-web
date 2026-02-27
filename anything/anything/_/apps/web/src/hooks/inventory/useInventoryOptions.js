import { useMemo } from "react";

export function useInventoryOptions(locations, items) {
  const locationOptions = useMemo(() => {
    const list = Array.isArray(locations) ? locations : [];
    const mapped = list.map((l) => ({ value: l.id, label: l.name }));
    return [{ value: "", label: "Select…" }, ...mapped];
  }, [locations]);

  const itemOptions = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    const mapped = list.map((i) => ({ value: i.id, label: i.name }));
    return [{ value: "", label: "Select…" }, ...mapped];
  }, [items]);

  const movementTypeOptions = useMemo(
    () => [
      { value: "receive", label: "Receive" },
      { value: "transfer", label: "Transfer" },
      { value: "use", label: "Use" },
    ],
    [],
  );

  const refTypeOptions = useMemo(
    () => [
      { value: "manual", label: "Manual" },
      { value: "order_received", label: "Order received" },
      { value: "invoice", label: "Invoice" },
      { value: "job", label: "Job" },
    ],
    [],
  );

  return {
    locationOptions,
    itemOptions,
    movementTypeOptions,
    refTypeOptions,
  };
}
