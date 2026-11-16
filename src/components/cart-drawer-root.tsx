"use client";

import dynamic from "next/dynamic";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { useCart } from "@/context/cart-context";

/** Cart UI JS only downloads after the drawer is opened. */
const CartDrawer = dynamic(
  () => import("./cart-drawer").then((m) => m.CartDrawer),
  { ssr: false },
);

export function CartDrawerRoot({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const { open } = useCart();
  if (!open) return null;
  return <CartDrawer locale={locale} dictionary={dictionary} />;
}
