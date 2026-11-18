"use client";

import { useState } from "react";

export function PaymentCopyButton({
  value,
  label,
  copiedLabel,
}: {
  value: string;
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="min-h-11 rounded-full border border-forest/15 bg-white px-4 text-sm text-forest transition hover:border-citrus/40"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
