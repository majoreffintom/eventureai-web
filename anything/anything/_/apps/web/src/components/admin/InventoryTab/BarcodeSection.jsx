import { Button, Input, Text } from "@/components/ds.jsx";

export function BarcodeSection({
  barcodeValue,
  setBarcodeValue,
  onLookup,
  onClear,
  onStartScanner,
  onLinkBarcode,
  canCameraScanBarcode,
  barcodeNote,
  barcodeHelp,
  unlinkedBarcode,
  selectedItemId,
  isLookingUp,
  isLinking,
  // NEW: scan from photo
  canDetectBarcodes,
  barcodePhotoUrl,
  setBarcodePhotoUrl,
  onScanBarcodePhotoUrl,
  onUploadBarcodePhotoFile,
  uploadedBarcodePhotoUrl,
  onClearBarcodePhoto,
  isPhotoBusy,
}) {
  const barcodeActionsDisabled = !barcodeValue.trim();
  const canLinkBarcode =
    !!barcodeValue.trim() && !!selectedItemId && !isLinking;

  const scanPhotoDisabled = !canDetectBarcodes || isPhotoBusy;
  const scanPhotoUrlDisabled = scanPhotoDisabled || !barcodePhotoUrl.trim();

  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
      <Input
        label="Scan manufacturer barcode"
        value={barcodeValue}
        onChange={(e) => setBarcodeValue(e.target.value)}
        placeholder="Scan with a USB scanner, type, or use camera…"
      />

      <div className="flex items-end gap-2 flex-wrap">
        <Button
          size="sm"
          variant="secondary"
          onClick={onStartScanner}
          disabled={!canCameraScanBarcode}
        >
          Scan with camera
        </Button>
        <Button
          size="sm"
          variant="primary"
          onClick={onLookup}
          disabled={barcodeActionsDisabled || isLookingUp}
        >
          {isLookingUp ? "Looking…" : "Lookup"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClear}
          disabled={isLinking}
        >
          Clear
        </Button>
      </div>

      <div className="rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-bg-secondary)] p-4">
        <Text size="sm" tone="tertiary">
          Tip: first scan the manufacturer barcode to select the item fast. Then
          use "Quick movement → Receive" to put it into a shop/truck.
        </Text>
        {barcodeNote ? (
          <Text size="sm" className="mt-2" tone="primary">
            {barcodeNote}
          </Text>
        ) : null}
        {barcodeHelp ? (
          <Text size="sm" className="mt-2" tone="warning">
            {barcodeHelp}
          </Text>
        ) : null}
        {unlinkedBarcode && selectedItemId ? (
          <div className="mt-3">
            <Button
              size="sm"
              variant="secondary"
              disabled={!canLinkBarcode}
              onClick={onLinkBarcode}
            >
              {isLinking ? "Linking…" : "Link barcode"}
            </Button>
          </div>
        ) : null}
      </div>

      {/* NEW: scan from photo */}
      <div className="md:col-span-3 rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-bg-secondary)] p-4">
        <Text className="font-semibold" tone="primary">
          Scan from a photo
        </Text>
        <Text size="sm" tone="tertiary" className="mt-1">
          If someone texts you a picture of the barcode, upload it here (or
          paste the image URL) and we’ll try to read it.
        </Text>

        {!canDetectBarcodes ? (
          <Text size="sm" tone="warning" className="mt-2">
            Photo barcode scanning isn’t supported in this browser. Try Chrome
            or Edge.
          </Text>
        ) : null}

        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="md:col-span-2">
            <Input
              label="Image URL (optional)"
              value={barcodePhotoUrl}
              onChange={(e) => setBarcodePhotoUrl(e.target.value)}
              placeholder="Paste an image URL from the Anything media gallery…"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="secondary"
              onClick={onScanBarcodePhotoUrl}
              disabled={scanPhotoUrlDisabled}
            >
              {isPhotoBusy ? "Scanning…" : "Scan URL"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearBarcodePhoto}
              disabled={isPhotoBusy}
            >
              Clear photo
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-col sm:flex-row gap-3 sm:items-center">
          <div>
            <Text size="sm" tone="secondary">
              Upload a photo
            </Text>
            <input
              type="file"
              accept="image/*"
              onChange={onUploadBarcodePhotoFile}
              disabled={scanPhotoDisabled}
              className="mt-1 text-sm"
            />
          </div>

          {uploadedBarcodePhotoUrl ? (
            <div className="sm:ml-auto">
              <a
                href={uploadedBarcodePhotoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm underline"
              >
                Open image
              </a>
            </div>
          ) : null}
        </div>

        {uploadedBarcodePhotoUrl ? (
          <div className="mt-3">
            <img
              src={uploadedBarcodePhotoUrl}
              alt="Uploaded barcode photo"
              className="max-h-[320px] w-auto max-w-full rounded-xl border border-[var(--ds-border)] object-contain"
              loading="lazy"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
