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

function hasBaseline(value: string) {
  return value !== "" && Number(value) > 0;
}

/**
 * Regular = stable base (undo baseline). Sale = what customers pay now.
 * Sale never overwrites a set Regular; empty Regular seeds once from Sale.
 * No confirm dialog — edit any/all of the six fields, then Save once.
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
    setSale(next);
    setRegular((prevRegular) => {
      if (!hasBaseline(prevRegular)) return next;
      return prevRegular;
    });
  }

  return {
    sale,
    regular,
    onSaleChange,
    onRegularChange: setRegular,
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
  /** @deprecated confirm removed — kept optional so call sites stay type-safe */
  regularConfirmMessage?: string;
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
