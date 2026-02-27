import { Button, Input, Text } from "@/components/ds.jsx";

export function QRCodeSection({
  scanValue,
  setScanValue,
  onScanSubmit,
  onClear,
  qrInfo,
}) {
  const selectedQrBlock = qrInfo ? (
    <div className="rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-bg-secondary)] p-4">
      <div className="text-xs font-semibold text-[var(--ds-text-tertiary)]">
        Selected QR
      </div>
      <div className="mt-2 flex items-center gap-3">
        <img
          src={qrInfo.img}
          alt="QR"
          className="h-[72px] w-[72px] rounded-xl border border-[var(--ds-border)]"
        />
        <div>
          <div className="font-semibold text-[var(--ds-text-primary)]">
            {qrInfo.item.name}
          </div>
          <div className="text-xs text-[var(--ds-text-tertiary)]">
            {qrInfo.item.sku ? `SKU: ${qrInfo.item.sku}` : ""}
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-bg-secondary)] p-4">
      <Text size="sm" tone="tertiary">
        Select an item to preview + print its QR sticker.
      </Text>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Input
        label="Scan QR / paste code"
        value={scanValue}
        onChange={(e) => setScanValue(e.target.value)}
        placeholder="Paste scanned value here…"
      />

      <div className="flex items-end gap-2">
        <Button
          variant="primary"
          onClick={onScanSubmit}
          disabled={!scanValue.trim()}
        >
          Use scan
        </Button>
        <Button variant="ghost" onClick={onClear}>
          Clear
        </Button>
      </div>

      {selectedQrBlock}
    </div>
  );
}
