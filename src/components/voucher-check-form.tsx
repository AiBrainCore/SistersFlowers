"use client";

import { useState, type FormEvent } from "react";
import { formatVnd } from "@/data/products";
import {
  checkVoucherAction,
  redeemVoucherAction,
} from "@/app/actions/vouchers";
import type { VoucherPublic } from "@/lib/vouchers";

function statusLabel(status: string) {
  if (status === "redeemed") return "Already used";
  if (status === "expired") return "Expired";
  return "Valid — ready to use";
}

function statusColor(status: string) {
  if (status === "redeemed") return "#8b3a3a";
  if (status === "expired") return "#8a6a2b";
  return "#5c6b52";
}

export function VoucherCheckForm() {
  const [code, setCode] = useState("");
  const [voucher, setVoucher] = useState<VoucherPublic | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function onCheck(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    setVoucher(null);
    const result = await checkVoucherAction(code);
    setBusy(false);
    if (!result.ok) {
      setError(
        result.error === "empty"
          ? "Enter a voucher code."
          : "Code not found. Check spelling (e.g. SF-V-A1B2C3).",
      );
      return;
    }
    setVoucher(result.voucher);
  }

  async function onRedeem() {
    if (!voucher) return;
    setBusy(true);
    setError("");
    setMessage("");
    const result = await redeemVoucherAction(voucher.code);
    setBusy(false);
    if (!result.ok) {
      setError(
        result.error === "already_redeemed"
          ? "This voucher was already used."
          : result.error === "expired"
            ? "This voucher has expired."
            : "Code not found.",
      );
      return;
    }
    setVoucher(result.voucher);
    setMessage(
      "Marked as used. Sisters will settle with the partner (face value minus commission).",
    );
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <form onSubmit={onCheck} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6, fontSize: 13 }}>
          <span style={{ letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.7 }}>
            Voucher code
          </span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="SF-V-XXXXXX"
            autoComplete="off"
            spellCheck={false}
            style={{
              fontSize: 20,
              letterSpacing: "0.08em",
              padding: "14px 16px",
              borderRadius: 12,
              border: "1px solid rgba(45,58,40,0.2)",
              fontFamily: "ui-monospace, monospace",
            }}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          style={{
            justifySelf: "start",
            padding: "12px 22px",
            borderRadius: 999,
            background: "#2d3a28",
            color: "#f6f1e8",
            border: "none",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          {busy ? "Checking…" : "Check code"}
        </button>
      </form>

      {error ? (
        <p style={{ color: "#8b3a3a", margin: 0 }}>{error}</p>
      ) : null}
      {message ? (
        <p style={{ color: "#5c6b52", margin: 0 }}>{message}</p>
      ) : null}

      {voucher ? (
        <div
          style={{
            border: "1px solid rgba(45,58,40,0.15)",
            borderRadius: 16,
            padding: 20,
            background: "rgba(255,255,255,0.65)",
            display: "grid",
            gap: 10,
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: "ui-monospace, monospace",
              fontSize: 22,
              letterSpacing: "0.06em",
            }}
          >
            {voucher.code}
          </p>
          <p style={{ margin: 0, fontSize: 18 }}>{voucher.name}</p>
          {voucher.partnerName ? (
            <p style={{ margin: 0, opacity: 0.75 }}>Partner: {voucher.partnerName}</p>
          ) : null}
          <p style={{ margin: 0, fontSize: 20 }}>
            Face value: <strong>{formatVnd(voucher.faceValue, "en")}</strong>
          </p>
          <p style={{ margin: 0, color: statusColor(voucher.status), fontWeight: 600 }}>
            {statusLabel(voucher.status)}
          </p>
          {voucher.expiresAt ? (
            <p style={{ margin: 0, fontSize: 13, opacity: 0.7 }}>
              Valid until {voucher.expiresAt.toISOString().slice(0, 10)}
            </p>
          ) : null}
          <p style={{ margin: 0, fontSize: 13, opacity: 0.75, lineHeight: 1.6 }}>
            If the service costs more than the face value, the guest pays the
            difference. Unused balance is not refunded.
          </p>

          {voucher.status === "issued" ? (
            <button
              type="button"
              disabled={busy}
              onClick={onRedeem}
              style={{
                marginTop: 8,
                justifySelf: "start",
                padding: "12px 22px",
                borderRadius: 999,
                background: "#8b4a4a",
                color: "#f6f1e8",
                border: "none",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {busy ? "Saving…" : "Mark as used"}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
