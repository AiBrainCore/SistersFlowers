"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "@/data/products";
import type { Locale } from "@/i18n/config";
import type { AddonPublic } from "@/lib/addons";

export type CartItem = {
  /** Unique line key */
  key: string;
  type: "product" | "addon";
  slug: string;
  qty: number;
  image: string;
  price: number;
  name: string;
  note?: string;
  addonKind?: "extra" | "partner";
  partnerName?: string;
  commissionPercent?: number;
  validityDays?: number;
};

export type SelectedAddon = {
  addon: AddonPublic;
  note?: string;
};

type CartContextValue = {
  items: CartItem[];
  open: boolean;
  hydrated: boolean;
  setOpen: (open: boolean) => void;
  addProduct: (
    product: Product,
    locale: Locale,
    addons?: SelectedAddon[],
  ) => void;
  addAddon: (addon: AddonPublic, locale: Locale, note?: string) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const STORAGE_KEY = "sf-cart-v2";
const CartContext = createContext<CartContextValue | null>(null);

function readStorage(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        typeof item.key === "string" &&
        typeof item.slug === "string" &&
        typeof item.qty === "number" &&
        item.qty > 0,
    );
  } catch {
    return [];
  }
}

function lineKey(type: "product" | "addon", slug: string, note?: string) {
  return `${type}:${slug}:${note?.trim() || ""}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const bumpOrInsert = useCallback((line: CartItem) => {
    setItems((current) => {
      const existing = current.find((item) => item.key === line.key);
      if (existing) {
        return current.map((item) =>
          item.key === line.key ? { ...item, qty: item.qty + line.qty } : item,
        );
      }
      return [...current, line];
    });
  }, []);

  const addProduct = useCallback(
    (product: Product, locale: Locale, addons: SelectedAddon[] = []) => {
      bumpOrInsert({
        key: lineKey("product", product.slug),
        type: "product",
        slug: product.slug,
        qty: 1,
        image: product.image,
        price: product.price,
        name: product.names[locale],
      });

      for (const selected of addons) {
        const note = selected.note?.trim() || undefined;
        bumpOrInsert({
          key: lineKey("addon", selected.addon.slug, note),
          type: "addon",
          slug: selected.addon.slug,
          qty: 1,
          image: selected.addon.image || product.image,
          price: selected.addon.price,
          name: locale === "vi" ? selected.addon.nameVi : selected.addon.nameEn,
          note,
          addonKind: selected.addon.kind,
          partnerName: selected.addon.partnerName || undefined,
          commissionPercent: selected.addon.commissionPercent || undefined,
          validityDays:
            selected.addon.kind === "partner"
              ? selected.addon.validityDays || 90
              : undefined,
        });
      }
      setOpen(true);
    },
    [bumpOrInsert],
  );

  const addAddon = useCallback(
    (addon: AddonPublic, locale: Locale, note?: string) => {
      const clean = note?.trim() || undefined;
      bumpOrInsert({
        key: lineKey("addon", addon.slug, clean),
        type: "addon",
        slug: addon.slug,
        qty: 1,
        image: addon.image || "/bouquets/shown/w-01.jpg",
        price: addon.price,
        name: locale === "vi" ? addon.nameVi : addon.nameEn,
        note: clean,
        addonKind: addon.kind,
        partnerName: addon.partnerName || undefined,
        commissionPercent: addon.commissionPercent || undefined,
        validityDays:
          addon.kind === "partner" ? addon.validityDays || 90 : undefined,
      });
      setOpen(true);
    },
    [bumpOrInsert],
  );

  const remove = useCallback((key: string) => {
    setItems((current) => current.filter((item) => item.key !== key));
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setItems((current) => {
      if (qty <= 0) return current.filter((item) => item.key !== key);
      return current.map((item) =>
        item.key === key ? { ...item, qty } : item,
      );
    });
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => {
    const count = items.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    return {
      items,
      open,
      hydrated,
      setOpen,
      addProduct,
      addAddon,
      remove,
      setQty,
      clear,
      count,
      subtotal,
    };
  }, [items, open, hydrated, addProduct, addAddon, remove, setQty, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
