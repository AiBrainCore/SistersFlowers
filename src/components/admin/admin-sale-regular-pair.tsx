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

/**
 * When Sale and Regular match (normal list price), editing either keeps both
 * equal — staff cannot leave Sale behind after changing Regular.
 * When they already differ (discount or markup), fields edit independently;
 * use bulk Discount / Markup / Reset for those campaigns.
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
      const paired =
        prevRegular === "" ||
        prevRegular === prevSale ||
        Number(prevRegular) <= 0;
      return paired ? next : prevRegular;
    });
  }

  function onRegularChange(next: string) {
    const prevRegular = regular;
    setRegular(next);
    setSale((prevSale) => {
      const paired =
        prevSale === "" ||
        prevSale === prevRegular ||
        Number(prevSale) <= 0;
      return paired ? next : prevSale;
    });
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
