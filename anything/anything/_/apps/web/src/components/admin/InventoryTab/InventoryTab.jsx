import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Input, Panel, Select, Text } from "@/components/ds.jsx";
import { parseScannedCodeToItemId } from "@/utils/inventory/barcodeUtils";
import { generateQRInfo, printQRCode } from "@/utils/inventory/qrCodeUtils";
import { useInventoryQueries } from "@/hooks/inventory/useInventoryQueries";
import { useInventoryMutations } from "@/hooks/inventory/useInventoryMutations";
import { useBarcodeMutations } from "@/hooks/inventory/useBarcodeMutations";
import { useBarcodeScanner } from "@/hooks/inventory/useBarcodeScanner";
import { useInventoryState } from "@/hooks/inventory/useInventoryState";
import { useInventoryOptions } from "@/hooks/inventory/useInventoryOptions";
import { useInventoryData } from "@/hooks/inventory/useInventoryData";
import useUpload from "@/utils/useUpload";
import { QRCodeSection } from "./QRCodeSection";
import { BarcodeSection } from "./BarcodeSection";
import { BarcodeScannerOverlay } from "./BarcodeScannerOverlay";
import { QuickMovementForm } from "./QuickMovementForm";
import { InventoryItemsTable } from "./InventoryItemsTable";
import { MovementsTable } from "./MovementsTable";
import { LocationsList } from "./LocationsList";

export function InventoryTab() {
  const {
    origin,
    selectedItemId,
    setSelectedItemId,
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
  } = useInventoryState();

  // NEW: barcode photo scan state
  const [barcodePhotoUrl, setBarcodePhotoUrl] = useState("");
  const [uploadedBarcodePhotoUrl, setUploadedBarcodePhotoUrl] = useState(null);
  const [isPhotoBusy, setIsPhotoBusy] = useState(false);
  const [upload, { loading: isUploadingPhoto }] = useUpload();

  // NEW: local form state (keeps the inventory page usable)
  const [newLocation, setNewLocation] = useState({
    name: "",
    location_type: "truck",
  });
  const [newItem, setNewItem] = useState({ name: "", sku: "", unit: "each" });

  const { locationsQuery, itemsQuery, movementsQuery } = useInventoryQueries();

  const {
    createLocationMutation,
    createItemMutation,
    receiveMutation,
    useItemMutation,
    transferMutation,
  } = useInventoryMutations();

  const { barcodeLookupMutation, barcodeLinkMutation } = useBarcodeMutations();

  const onBarcodeDetected = useCallback(
    (barcode) => {
      setBarcodeValue(barcode);
      barcodeLookupMutation.mutate(barcode);
    },
    [barcodeLookupMutation, setBarcodeValue],
  );

  const {
    barcodeScanOpen,
    barcodeVideoRef,
    canCameraScanBarcode,
    canDetectBarcodes,
    detectBarcodeFromImageUrl,
    startBarcodeScanner,
    stopBarcodeScanner,
  } = useBarcodeScanner({ onBarcodeDetected });

  // Move data derivation BEFORE side-effect handlers so itemById is in scope.
  const locations = locationsQuery.data?.locations || [];
  const stockRows = itemsQuery.data?.stock || [];
  const movements = movementsQuery.data?.movements || [];

  const { items, itemById, stockByItemId } = useInventoryData(
    itemsQuery,
    stockRows,
  );

  const { locationOptions, itemOptions, movementTypeOptions, refTypeOptions } =
    useInventoryOptions(locations, items);

  const onScanSubmit = useCallback(() => {
    setError(null);
    const itemId = parseScannedCodeToItemId(scanValue);
    if (!itemId) {
      setError(
        "Could not read that code. Try scanning again (or paste the UUID).",
      );
      return;
    }

    setSelectedItemId(itemId);
  }, [scanValue, setSelectedItemId, setError]);

  const qrInfo = useMemo(() => {
    return generateQRInfo(origin, selectedItemId, itemById);
  }, [itemById, origin, selectedItemId]);

  const printQr = useCallback(() => {
    printQRCode(qrInfo);
  }, [qrInfo]);

  const canSubmitMovement = useMemo(() => {
    const qty = Number(movement.quantity);
    if (!movement.item_id || !Number.isFinite(qty) || qty <= 0) {
      return false;
    }

    if (movement.movement_type === "receive") {
      return !!movement.to_location_id;
    }

    if (movement.movement_type === "use") {
      return !!movement.from_location_id;
    }

    if (movement.movement_type === "transfer") {
      return (
        !!movement.from_location_id &&
        !!movement.to_location_id &&
        movement.from_location_id !== movement.to_location_id
      );
    }

    return false;
  }, [movement]);

  const submitMovement = useCallback(() => {
    setError(null);

    if (!canSubmitMovement) {
      setError("Fill out the movement form first.");
      return;
    }

    const qty = Number(movement.quantity);

    const payload = {
      item_id: movement.item_id,
      quantity: qty,
      reference_type: movement.reference_type,
      reference_id: movement.reference_id || null,
      notes: movement.notes || null,
    };

    if (movement.movement_type === "receive") {
      receiveMutation.mutate({
        ...payload,
        to_location_id: movement.to_location_id,
      });
      return;
    }

    if (movement.movement_type === "use") {
      useItemMutation.mutate({
        ...payload,
        from_location_id: movement.from_location_id,
      });
      return;
    }

    if (movement.movement_type === "transfer") {
      transferMutation.mutate({
        ...payload,
        from_location_id: movement.from_location_id,
        to_location_id: movement.to_location_id,
      });
    }
  }, [
    canSubmitMovement,
    movement,
    receiveMutation,
    transferMutation,
    useItemMutation,
    setError,
  ]);

  // Handle movement mutations errors
  useEffect(() => {
    if (!receiveMutation.isError) {
      return;
    }
    console.error(receiveMutation.error);
    setError(receiveMutation.error?.message || "Could not receive inventory");
  }, [receiveMutation.isError, receiveMutation.error, setError]);

  useEffect(() => {
    if (!useItemMutation.isError) {
      return;
    }
    console.error(useItemMutation.error);
    setError(useItemMutation.error?.message || "Could not mark used");
  }, [useItemMutation.isError, useItemMutation.error, setError]);

  useEffect(() => {
    if (!transferMutation.isError) {
      return;
    }
    console.error(transferMutation.error);
    setError(transferMutation.error?.message || "Could not transfer");
  }, [transferMutation.isError, transferMutation.error, setError]);

  const movementIsPending =
    receiveMutation.isPending ||
    useItemMutation.isPending ||
    transferMutation.isPending;

  const handleStartBarcodeScanner = useCallback(async () => {
    setError(null);
    setBarcodeNote(null);

    try {
      await startBarcodeScanner();
    } catch (e) {
      console.error(e);
      setError(e?.message || "Could not start barcode scanner");
    }
  }, [startBarcodeScanner, setError, setBarcodeNote]);

  const handleBarcodeLookup = useCallback(() => {
    setError(null);
    const code = barcodeValue.trim();
    if (!code) {
      return;
    }
    barcodeLookupMutation.mutate(code);
  }, [barcodeValue, barcodeLookupMutation, setError]);

  const handleBarcodeLink = useCallback(() => {
    setError(null);
    const code = barcodeValue.trim();
    if (!code || !selectedItemId) {
      return;
    }
    barcodeLinkMutation.mutate({
      barcode: code,
      item_id: selectedItemId,
    });
  }, [barcodeValue, selectedItemId, barcodeLinkMutation, setError]);

  const handleClearBarcode = useCallback(() => {
    clearBarcode();
  }, [clearBarcode]);

  const handleBarcodeValueChange = useCallback(
    (value) => {
      setBarcodeValue(value);
      setBarcodeNote(null);
      setUnlinkedBarcode(null);
    },
    [setBarcodeValue, setBarcodeNote, setUnlinkedBarcode],
  );

  useEffect(() => {
    if (!barcodeLookupMutation.isSuccess) {
      return;
    }

    const item = barcodeLookupMutation.data?.item || null;
    if (item?.id) {
      setError(null);
      setBarcodeNote(`Linked item found: ${item.name}`);
      setUnlinkedBarcode(null);
      setSelectedItemId(item.id);
      setMovement((prev) => ({
        ...prev,
        movement_type: "receive",
        item_id: item.id,
      }));
      return;
    }

    setBarcodeNote(null);
    setUnlinkedBarcode(barcodeValue.trim() || null);
  }, [
    barcodeLookupMutation.isSuccess,
    barcodeLookupMutation.data,
    barcodeValue,
    setBarcodeNote,
    setUnlinkedBarcode,
    setSelectedItemId,
    setMovement,
    setError,
  ]);

  useEffect(() => {
    if (!barcodeLookupMutation.isError) {
      return;
    }

    console.error(barcodeLookupMutation.error);
    setBarcodeNote(null);
    setUnlinkedBarcode(null);
    setError(
      barcodeLookupMutation.error?.message || "Could not look up barcode",
    );
  }, [
    barcodeLookupMutation.isError,
    barcodeLookupMutation.error,
    setBarcodeNote,
    setUnlinkedBarcode,
    setError,
  ]);

  useEffect(() => {
    if (!barcodeLinkMutation.isSuccess) {
      return;
    }

    setError(null);
    setUnlinkedBarcode(null);

    const item = selectedItemId ? itemById.get(selectedItemId) : null;
    const itemName = item?.name || "item";
    setBarcodeNote(`Saved barcode link for ${itemName}.`);
  }, [
    barcodeLinkMutation.isSuccess,
    itemById,
    selectedItemId,
    setBarcodeNote,
    setUnlinkedBarcode,
    setError,
  ]);

  useEffect(() => {
    if (!barcodeLinkMutation.isError) {
      return;
    }

    console.error(barcodeLinkMutation.error);
    setBarcodeNote(null);
    setError(barcodeLinkMutation.error?.message || "Could not link barcode");
  }, [
    barcodeLinkMutation.isError,
    barcodeLinkMutation.error,
    setBarcodeNote,
    setError,
  ]);

  // NEW: scan a barcode from an image URL (including uploaded images)
  const runBarcodePhotoScan = useCallback(
    async (url) => {
      setError(null);
      setBarcodeNote(null);

      setIsPhotoBusy(true);
      try {
        const detected = await detectBarcodeFromImageUrl(url);
        onBarcodeDetected(detected);
        setBarcodeNote("Barcode read from photo.");
      } catch (e) {
        console.error(e);
        setError(e?.message || "Could not scan barcode from photo");
      } finally {
        setIsPhotoBusy(false);
      }
    },
    [detectBarcodeFromImageUrl, onBarcodeDetected, setBarcodeNote, setError],
  );

  const handleScanBarcodePhotoUrl = useCallback(() => {
    const url = barcodePhotoUrl.trim();
    if (!url) {
      setError("Paste an image URL first.");
      return;
    }

    setUploadedBarcodePhotoUrl(url);
    runBarcodePhotoScan(url);
  }, [barcodePhotoUrl, runBarcodePhotoScan, setError]);

  const handleUploadBarcodePhotoFile = useCallback(
    async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) {
        return;
      }

      setError(null);
      setBarcodeNote(null);

      try {
        const result = await upload({ file });
        if (result?.error) {
          throw new Error(result.error);
        }

        const url = result?.url ? String(result.url) : "";
        if (!url) {
          throw new Error("Upload failed");
        }

        setBarcodePhotoUrl(url);
        setUploadedBarcodePhotoUrl(url);

        await runBarcodePhotoScan(url);
      } catch (err) {
        console.error(err);
        setError(err?.message || "Could not upload/scan that photo");
      } finally {
        // allow choosing the same file twice
        // eslint-disable-next-line no-param-reassign
        e.target.value = "";
      }
    },
    [barcodeNote, runBarcodePhotoScan, setBarcodeNote, setError, upload],
  );

  const handleClearBarcodePhoto = useCallback(() => {
    setBarcodePhotoUrl("");
    setUploadedBarcodePhotoUrl(null);
  }, []);

  const handleCreateItem = useCallback(() => {
    setError(null);

    const payload = {
      name: newItem.name,
      sku: newItem.sku,
      unit: newItem.unit,
    };

    createItemMutation.mutate(payload, {
      onSuccess: (data) => {
        const created = data?.item;
        if (created?.id) {
          setSelectedItemId(created.id);
          setMovement((prev) => ({ ...prev, item_id: created.id }));
        }
        setNewItem({ name: "", sku: "", unit: "each" });
      },
      onError: (e) => {
        console.error(e);
        setError(e?.message || "Could not create item");
      },
    });
  }, [createItemMutation, newItem, setError, setMovement, setSelectedItemId]);

  const handleCreateLocation = useCallback(() => {
    setError(null);

    const payload = {
      name: newLocation.name,
      location_type: newLocation.location_type,
    };

    createLocationMutation.mutate(payload, {
      onSuccess: () => {
        setNewLocation({ name: "", location_type: "truck" });
      },
      onError: (e) => {
        console.error(e);
        setError(e?.message || "Could not create location");
      },
    });
  }, [createLocationMutation, newLocation, setError]);

  const headerAction = qrInfo ? (
    <Button size="sm" variant="secondary" onClick={printQr}>
      Print QR
    </Button>
  ) : null;

  return (
    <div className="space-y-6">
      <BarcodeScannerOverlay
        isOpen={barcodeScanOpen}
        videoRef={barcodeVideoRef}
        onClose={stopBarcodeScanner}
      />

      <Panel
        title="Inventory"
        subtitle="Track stock by location (shop + trucks). QR stickers make this fast in the field."
        right={headerAction}
      >
        {error ? <Text tone="danger">{error}</Text> : null}

        <QRCodeSection
          scanValue={scanValue}
          setScanValue={setScanValue}
          onScanSubmit={onScanSubmit}
          onClear={clearScan}
          qrInfo={qrInfo}
        />

        <BarcodeSection
          barcodeValue={barcodeValue}
          setBarcodeValue={handleBarcodeValueChange}
          onLookup={handleBarcodeLookup}
          onClear={handleClearBarcode}
          onStartScanner={handleStartBarcodeScanner}
          onLinkBarcode={handleBarcodeLink}
          canCameraScanBarcode={canCameraScanBarcode}
          barcodeNote={barcodeNote}
          barcodeHelp={barcodeHelp}
          unlinkedBarcode={unlinkedBarcode}
          selectedItemId={selectedItemId}
          isLookingUp={barcodeLookupMutation.isPending}
          isLinking={barcodeLinkMutation.isPending}
          // NEW: scan from photo
          canDetectBarcodes={canDetectBarcodes}
          barcodePhotoUrl={barcodePhotoUrl}
          setBarcodePhotoUrl={setBarcodePhotoUrl}
          onScanBarcodePhotoUrl={handleScanBarcodePhotoUrl}
          onUploadBarcodePhotoFile={handleUploadBarcodePhotoFile}
          uploadedBarcodePhotoUrl={uploadedBarcodePhotoUrl}
          onClearBarcodePhoto={handleClearBarcodePhoto}
          isPhotoBusy={isPhotoBusy || isUploadingPhoto}
        />

        {/* RESTORED: Add item + Add location */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-bg-secondary)] p-4">
            <Text className="font-semibold" tone="primary">
              Add item
            </Text>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                label="Name"
                value={newItem.name}
                onChange={(e) =>
                  setNewItem((p) => ({ ...p, name: e.target.value }))
                }
                placeholder='e.g. 16" refrigerant drier'
              />
              <Input
                label="SKU (optional)"
                value={newItem.sku}
                onChange={(e) =>
                  setNewItem((p) => ({ ...p, sku: e.target.value }))
                }
                placeholder="e.g. S1-LFD163S"
              />
              <Input
                label="Unit"
                value={newItem.unit}
                onChange={(e) =>
                  setNewItem((p) => ({ ...p, unit: e.target.value }))
                }
                placeholder="each / box / gal"
              />
            </div>
            <div className="mt-3">
              <Button
                size="sm"
                variant="primary"
                onClick={handleCreateItem}
                disabled={!newItem.name.trim() || createItemMutation.isPending}
              >
                {createItemMutation.isPending ? "Adding…" : "Add item"}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-bg-secondary)] p-4">
            <Text className="font-semibold" tone="primary">
              Add location
            </Text>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Name"
                value={newLocation.name}
                onChange={(e) =>
                  setNewLocation((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. Goldey Shop"
              />
              <Select
                label="Type"
                value={newLocation.location_type}
                onChange={(e) =>
                  setNewLocation((p) => ({
                    ...p,
                    location_type: e.target.value,
                  }))
                }
                options={[
                  { value: "shop", label: "Shop" },
                  { value: "truck", label: "Truck" },
                  { value: "other", label: "Other" },
                ]}
              />
            </div>
            <div className="mt-3">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleCreateLocation}
                disabled={
                  !newLocation.name.trim() || createLocationMutation.isPending
                }
              >
                {createLocationMutation.isPending ? "Adding…" : "Add location"}
              </Button>
            </div>
          </div>
        </div>

        <QuickMovementForm
          movement={movement}
          setMovement={setMovement}
          movementTypeOptions={movementTypeOptions}
          itemOptions={itemOptions}
          locationOptions={locationOptions}
          refTypeOptions={refTypeOptions}
          canSubmit={canSubmitMovement}
          isPending={movementIsPending}
          onSubmit={submitMovement}
          onReset={resetMovement}
          onItemSelected={(id) => {
            setSelectedItemId(id || null);
          }}
        />

        <div className="mt-6">
          <InventoryItemsTable
            items={items}
            stockByItemId={stockByItemId}
            selectedItemId={selectedItemId}
            onSelectItem={setSelectedItemId}
            isLoading={itemsQuery.isLoading}
            error={itemsQuery.error}
          />
        </div>

        <div className="mt-6">
          <LocationsList
            locations={locations}
            isLoading={locationsQuery.isLoading}
            error={locationsQuery.error}
          />
        </div>
      </Panel>

      <Panel title="Recent inventory activity" subtitle="Last 50 movements">
        <MovementsTable
          movements={movements}
          isLoading={movementsQuery.isLoading}
          error={movementsQuery.error}
        />
      </Panel>
    </div>
  );
}
