"use client";

import { useState, type CSSProperties } from "react";

function norm(value: string | number | null | undefined) {
  if (value == null || value === "") return "";
  return String(value);
}

function initialRegular(
  saleDefault: string | number | null | undefined,
  regularDefault: string | number | null | undefined,
) {
  const saleInit = norm(saleDefault);
  const raw = norm(regularDefault);
  if (raw !== "" && Number(raw) > 0) return raw;
  return saleInit;
}

function isPaired(sale: string, regular: string) {
  return (
    regular === "" ||
    regular === sale ||
    !Number.isFinite(Number(regular)) ||
    Number(regular) <= 0
  );
}

/**
 * Sale = what the customer pays (edit this for normal price changes).
 * Regular = baseline / “was” price.
 *
 * When they currently match:
 * - Raise Sale → Regular follows (new list price, keep baseline in sync)
 * - Lower Sale → Regular stays (starts a discount; you still know the old Regular)
 * Editing Regular never auto-changes Sale.
 *
 * When they already differ (discount/markup), fields stay independent.
 */
export function useSaleRegularPair(
  saleDefault?: string | number | null,
  regularDefault?: string | number | null,
) {
  const saleInit = norm(saleDefault);
  const [sale, setSale] = useState(saleInit);
  const [regular, setRegular] = useState(
    initialRegular(saleDefault, regularDefault),
  );

  function onSaleChange(next: string) {
    const prevSale = sale;
    setSale(next);
    setRegular((prevRegular) => {
      if (!isPaired(prevSale, prevRegular)) return prevRegular;

      const prevNum = Number(prevSale);
      const nextNum = Number(next);
      // Lowering Sale while paired → keep Regular as the discount baseline.
      if (
        next !== "" &&
        prevSale !== "" &&
        Number.isFinite(nextNum) &&
        Number.isFinite(prevNum) &&
        nextNum < prevNum
      ) {
        return prevRegular === "" ? prevSale : prevRegular;
      }
      // Raise / rewrite Sale → Regular follows.
      return next;
    });
  }

  function onRegularChange(next: string) {
    // Regular is the baseline — never drag Sale along with it.
    setRegular(next);
  }

  return {
    sale,
    regular,
    onSaleChange,
    onRegularChange,
  };
}

export function AdminSaleRegularPair({
  saleName,
  regularName,
  saleLabel,
  regularLabel,
  saleDefault,
  regularDefault,
  saleClassName,
  regularClassName,
  saleStyle,
  regularStyle,
  saleRequired,
}: {
  saleName: string;
  regularName: string;
  saleLabel: string;
  regularLabel: string;
  saleDefault?: string | number | null;
  regularDefault?: string | number | null;
  saleClassName?: string;
  regularClassName?: string;
  saleStyle?: CSSProperties;
  regularStyle?: CSSProperties;
  saleRequired?: boolean;
}) {
  const { sale, regular, onSaleChange, onRegularChange } = useSaleRegularPair(
    saleDefault,
    regularDefault,
  );

  return (
    <>
      <label>
        <span>{saleLabel}</span>
        <input
          name={saleName}
          type="number"
          min={0}
          step={1000}
          placeholder="—"
          value={sale}
          required={saleRequired}
          className={saleClassName}
          style={saleStyle}
          onChange={(e) => onSaleChange(e.target.value)}
        />
      </label>
      <label>
        <span>{regularLabel}</span>
        <input
          name={regularName}
          type="number"
          min={0}
          step={1000}
          placeholder="—"
          value={regular}
          className={regularClassName ?? "admin-input-was"}
          style={regularStyle}
          onChange={(e) => onRegularChange(e.target.value)}
        />
      </label>
    </>
  );
}
