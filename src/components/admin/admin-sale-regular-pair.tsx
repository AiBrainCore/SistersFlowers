"use client";

import { useRef, useState, type CSSProperties } from "react";

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
 * Regular = stable base (undo baseline for temporary markup / discount).
 * Sale = what customers pay now (can jump +15% for a few days without
 * moving Regular).
 *
 * - Sale never overwrites a set Regular.
 * - Empty Regular seeds once from Sale (first setup).
 * - Changing Regular asks Yes/No on blur (not every keystroke).
 */
export function useSaleRegularPair(
  saleDefault?: string | number | null,
  regularDefault?: string | number | null,
  regularConfirmMessage?: string,
) {
  const saleInit = norm(saleDefault);
  const regularInit = initialRegular(saleDefault, regularDefault);
  const [sale, setSale] = useState(saleInit);
  const [regular, setRegular] = useState(regularInit);
  const committedRegular = useRef(regularInit);

  function onSaleChange(next: string) {
    setSale(next);
    setRegular((prevRegular) => {
      // First-time seed only — never overwrite a real Regular baseline.
      if (!hasBaseline(prevRegular)) {
        committedRegular.current = next;
        return next;
      }
      return prevRegular;
    });
  }

  function onRegularChange(next: string) {
    setRegular(next);
  }

  function onRegularBlur() {
    if (regular === committedRegular.current) return;

    const changingExisting = hasBaseline(committedRegular.current);
    if (changingExisting) {
      const ok = window.confirm(
        regularConfirmMessage ||
          "Change Regular (base) price? Sale will not follow. Temporary markups/discounts use Regular as the undo baseline.",
      );
      if (!ok) {
        setRegular(committedRegular.current);
        return;
      }
    }
    committedRegular.current = regular;
  }

  return {
    sale,
    regular,
    onSaleChange,
    onRegularChange,
    onRegularBlur,
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
  regularConfirmMessage,
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
  regularConfirmMessage?: string;
}) {
  const { sale, regular, onSaleChange, onRegularChange, onRegularBlur } =
    useSaleRegularPair(saleDefault, regularDefault, regularConfirmMessage);

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
          onBlur={onRegularBlur}
        />
      </label>
    </>
  );
}
