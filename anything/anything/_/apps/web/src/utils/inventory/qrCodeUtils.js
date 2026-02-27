export function generateQRInfo(origin, selectedItemId, itemById) {
  if (!origin || !selectedItemId) {
    return null;
  }

  const item = itemById.get(selectedItemId);
  if (!item) {
    return null;
  }

  const url = `${origin}/admin?tab=inventory&itemId=${encodeURIComponent(selectedItemId)}`;
  const img = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`;

  return {
    item,
    url,
    img,
  };
}

export function printQRCode(qrInfo) {
  if (!qrInfo) {
    return;
  }

  if (typeof window === "undefined") {
    return;
  }

  const title = qrInfo.item?.name || "Inventory Item";

  const w = window.open(
    "",
    "_blank",
    "noopener,noreferrer,width=480,height=640",
  );
  if (!w) {
    return;
  }

  const skuLine = qrInfo.item?.sku ? `SKU: ${qrInfo.item.sku}` : "";

  w.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${title} QR</title>
</head>
<body style="font-family: Arial, sans-serif; padding: 18px;">
  <div style="display:flex; flex-direction:column; align-items:center; gap:12px;">
    <div style="font-size:18px; font-weight:700; text-align:center;">${title}</div>
    ${skuLine ? `<div style="font-size:12px; color:#555;">${skuLine}</div>` : ""}
    <img src="${qrInfo.img}" alt="QR" style="width:220px; height:220px;" />
    <div style="font-size:10px; color:#777; word-break:break-all; text-align:center;">${qrInfo.url}</div>
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`);

  w.document.close();
}
