import { useCallback, useEffect, useMemo, useState } from "react";
import { isUuidLike } from "@/utils/inventory/barcodeUtils";

export function useInventoryState() {
  const [origin, setOrigin] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [scanValue, setScanValue] = useState("");
  const [barcodeValue, setBarcodeValue] = useState("");
  const [unlinkedBarcode, setUnlinkedBarcode] = useState(null);
  const [barcodeNote, setBarcodeNote] = useState(null);
  const [error, setError] = useState(null);

  const [movement, setMovement] = useState({
    movement_type: "receive",
    item_id: "",
    from_location_id: "",
    to_location_id: "",
    quantity: "1",
    reference_type: "manual",
    reference_id: "",
    notes: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setOrigin(window.location.origin);

    const params = new URLSearchParams(window.location.search);
    const itemFromUrl = params.get("itemId");
    if (itemFromUrl && isUuidLike(itemFromUrl)) {
      setSelectedItemId(itemFromUrl);
      setMovement((prev) => ({ ...prev, item_id: itemFromUrl }));
    }
  }, []);

  const updateSelectedItem = useCallback((itemId) => {
    setSelectedItemId(itemId);
    setMovement((prev) => ({ ...prev, item_id: itemId }));

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (itemId) {
        params.set("itemId", itemId);
      } else {
        params.delete("itemId");
      }
      const next = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, "", next);
    }
  }, []);

  const clearScan = useCallback(() => {
    setScanValue("");
    updateSelectedItem(null);
  }, [updateSelectedItem]);

  const clearBarcode = useCallback(() => {
    setBarcodeValue("");
    setBarcodeNote(null);
    setUnlinkedBarcode(null);
  }, []);

  const resetMovement = useCallback(() => {
    setMovement((p) => ({
      ...p,
      from_location_id: "",
      to_location_id: "",
      quantity: "1",
      reference_type: "manual",
      reference_id: "",
      notes: "",
    }));
  }, []);

  const barcodeHelp = useMemo(() => {
    if (unlinkedBarcode) {
      return `Barcode not linked yet. Select an item below, then click "Link barcode". (Barcode: ${unlinkedBarcode})`;
    }
    return null;
  }, [unlinkedBarcode]);

  return {
    origin,
    selectedItemId,
    setSelectedItemId: updateSelectedItem,
    scanValue,
    setScanValue,
    barcodeValue,
    setBarcodeValue,
    unlinkedBarcode,
    setUnlinkedBarcode,
    barcodeNote,
    setBarcodeNote,
    barcodeHelp,
    error,
    setError,
    movement,
    setMovement,
    clearScan,
    clearBarcode,
    resetMovement,
  };
}
