"use client";

import { useState } from "react";

type Props = {
  qrImageUrl: string;
  fileName: string;
  label: string;
  savingLabel: string;
  errorLabel: string;
};

export function SaveQrButton({
  qrImageUrl,
  fileName,
  label,
  savingLabel,
  errorLabel,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function onSave() {
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      const proxy = `/api/qr-image?url=${encodeURIComponent(qrImageUrl)}`;
      const res = await fetch(proxy);
      if (!res.ok) throw new Error("fetch_failed");
      const blob = await res.blob();
      const safeName = fileName.replace(/[^\w.-]+/g, "_") || "sf-vietqr.png";
      const file = new File([blob], safeName.endsWith(".png") ? safeName : `${safeName}.png`, {
        type: blob.type || "image/png",
      });

      const nav = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean;
      };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        try {
          await nav.share({
            files: [file],
            title: "VietQR",
            text: "Sisters Flowers payment QR",
          });
          return;
        } catch (shareErr) {
          // User cancelled the share sheet — not a failure.
          if (
            shareErr instanceof DOMException &&
            (shareErr.name === "AbortError" || shareErr.name === "NotAllowedError")
          ) {
            return;
          }
          // Fall through to download / open.
        }
      }

      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = file.name;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 60_000);

      // iOS Safari ignores cross-origin/download; open same-origin PNG so long-press Save works.
      if (/iP(hone|ad|od)/i.test(navigator.userAgent)) {
        window.open(proxy, "_blank", "noopener,noreferrer");
      }
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <button
        type="button"
        onClick={onSave}
        disabled={busy}
        className="inline-flex min-h-11 w-full max-w-xs items-center justify-center rounded-full bg-citrus px-5 text-sm text-white disabled:opacity-60"
      >
        {busy ? savingLabel : label}
      </button>
      {error ? (
        <p className="text-center text-xs text-rose">{errorLabel}</p>
      ) : null}
    </div>
  );
}
