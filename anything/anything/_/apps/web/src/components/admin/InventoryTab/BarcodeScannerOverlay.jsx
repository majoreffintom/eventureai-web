import { Button, Text } from "@/components/ds.jsx";

export function BarcodeScannerOverlay({ isOpen, videoRef, onClose }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-[520px] rounded-2xl bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="font-semibold text-[var(--ds-text-primary)]">
            Scan barcode
          </div>
          <Button size="sm" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="mt-3 overflow-hidden rounded-xl border border-[var(--ds-border)] bg-black">
          <video
            ref={videoRef}
            className="w-full h-[320px] object-cover"
            playsInline
            muted
          />
        </div>
        <Text size="sm" tone="tertiary" className="mt-3">
          Point your camera at the manufacturer barcode on the box.
        </Text>
      </div>
    </div>
  );
}
