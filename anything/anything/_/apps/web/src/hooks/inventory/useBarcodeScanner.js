import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function useBarcodeScanner({ onBarcodeDetected }) {
  const [barcodeScanOpen, setBarcodeScanOpen] = useState(false);
  const barcodeVideoRef = useRef(null);
  const barcodeStreamRef = useRef(null);
  const barcodeIntervalRef = useRef(null);

  // NEW: Some browsers can detect barcodes from images even if they can't access a camera.
  const canDetectBarcodes = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return typeof window.BarcodeDetector !== "undefined";
  }, []);

  const stopBarcodeScanner = useCallback(() => {
    if (barcodeIntervalRef.current) {
      clearInterval(barcodeIntervalRef.current);
      barcodeIntervalRef.current = null;
    }

    const stream = barcodeStreamRef.current;
    if (stream && typeof stream.getTracks === "function") {
      for (const t of stream.getTracks()) {
        try {
          t.stop();
        } catch (e) {
          // ignore
        }
      }
    }
    barcodeStreamRef.current = null;

    const video = barcodeVideoRef.current;
    if (video) {
      try {
        video.pause();
        // eslint-disable-next-line no-param-reassign
        video.srcObject = null;
      } catch (e) {
        // ignore
      }
    }

    setBarcodeScanOpen(false);
  }, []);

  useEffect(() => {
    return () => {
      // cleanup on unmount
      if (barcodeIntervalRef.current) {
        clearInterval(barcodeIntervalRef.current);
      }
      const stream = barcodeStreamRef.current;
      if (stream && typeof stream.getTracks === "function") {
        for (const t of stream.getTracks()) {
          try {
            t.stop();
          } catch (e) {
            // ignore
          }
        }
      }
    };
  }, []);

  const canCameraScanBarcode = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }

    const hasDetector = typeof window.BarcodeDetector !== "undefined";
    const hasCamera =
      !!navigator?.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function";

    return hasDetector && hasCamera;
  }, []);

  // NEW: detect a barcode from an image URL (no camera needed)
  const detectBarcodeFromImageUrl = useCallback(
    async (imageUrl) => {
      if (!canDetectBarcodes) {
        throw new Error(
          "Barcode detection is not supported in this browser. Try Chrome/Edge, or type/paste the barcode.",
        );
      }

      const url = String(imageUrl || "").trim();
      if (!url) {
        throw new Error("Paste an image URL first.");
      }

      const detector = new window.BarcodeDetector({
        formats: [
          "code_128",
          "code_39",
          "ean_13",
          "ean_8",
          "upc_a",
          "upc_e",
          "itf",
          "qr_code",
        ],
      });

      let bitmap = null;
      try {
        if (typeof createImageBitmap === "function") {
          const response = await fetch(url, { method: "GET" });
          if (!response.ok) {
            throw new Error(
              `When fetching the image, the response was [${response.status}] ${response.statusText}`,
            );
          }

          const blob = await response.blob();
          bitmap = await createImageBitmap(blob);

          const results = await detector.detect(bitmap);
          const first = Array.isArray(results) ? results[0] : null;
          const raw = first?.rawValue ? String(first.rawValue) : "";
          const cleaned = raw.trim();

          if (!cleaned) {
            throw new Error(
              "No barcode found in that photo. Try a closer, sharper shot with the barcode filling most of the frame.",
            );
          }

          return cleaned;
        }

        // Fallback: HTMLImageElement
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = url;

        await new Promise((resolve, reject) => {
          img.onload = () => resolve(true);
          img.onerror = () => reject(new Error("Could not load that image."));
        });

        const results = await detector.detect(img);
        const first = Array.isArray(results) ? results[0] : null;
        const raw = first?.rawValue ? String(first.rawValue) : "";
        const cleaned = raw.trim();

        if (!cleaned) {
          throw new Error(
            "No barcode found in that photo. Try a closer, sharper shot with the barcode filling most of the frame.",
          );
        }

        return cleaned;
      } finally {
        if (bitmap && typeof bitmap.close === "function") {
          try {
            bitmap.close();
          } catch (e) {
            // ignore
          }
        }
      }
    },
    [canDetectBarcodes],
  );

  const startBarcodeScanner = useCallback(async () => {
    if (!canCameraScanBarcode) {
      throw new Error(
        "Camera barcode scanning is not supported in this browser. Plug in a USB barcode scanner (or type/paste the barcode).",
      );
    }

    try {
      setBarcodeScanOpen(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      barcodeStreamRef.current = stream;

      const video = barcodeVideoRef.current;
      if (!video) {
        throw new Error("Could not start camera preview");
      }

      // eslint-disable-next-line no-param-reassign
      video.srcObject = stream;
      await video.play();

      const detector = new window.BarcodeDetector({
        formats: [
          "code_128",
          "code_39",
          "ean_13",
          "ean_8",
          "upc_a",
          "upc_e",
          "itf",
          "qr_code",
        ],
      });

      barcodeIntervalRef.current = setInterval(async () => {
        try {
          const v = barcodeVideoRef.current;
          if (!v) {
            return;
          }

          const results = await detector.detect(v);
          const first = Array.isArray(results) ? results[0] : null;
          const raw = first?.rawValue ? String(first.rawValue) : "";
          const cleaned = raw.trim();

          if (cleaned) {
            stopBarcodeScanner();
            onBarcodeDetected(cleaned);
          }
        } catch (e) {
          // ignore per frame; camera permissions / detector quirks can throw
        }
      }, 250);
    } catch (e) {
      stopBarcodeScanner();
      throw e;
    }
  }, [canCameraScanBarcode, onBarcodeDetected, stopBarcodeScanner]);

  return {
    barcodeScanOpen,
    barcodeVideoRef,
    canCameraScanBarcode,
    canDetectBarcodes,
    detectBarcodeFromImageUrl,
    startBarcodeScanner,
    stopBarcodeScanner,
  };
}
