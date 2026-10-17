"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useTransition,
  type ReactNode,
} from "react";
import type { CityPublic } from "@/lib/locations";
import { setActiveCityAction } from "@/app/actions/location";
import { useCart } from "@/context/cart-context";

type LocationContextValue = {
  cities: CityPublic[];
  activeCity: CityPublic;
  acceptsOrders: boolean;
  pending: boolean;
  setCity: (slug: string) => Promise<void>;
};

const LocationContext = createContext<LocationContextValue | null>(null);

export function LocationProvider({
  cities,
  activeCity,
  children,
}: {
  cities: CityPublic[];
  activeCity: CityPublic;
  children: ReactNode;
}) {
  const cart = useCart();
  const [pending, startTransition] = useTransition();

  const setCity = useCallback(
    async (slug: string) => {
      if (slug === activeCity.slug) return;
      const hadCartItems = cart.count > 0;
      const result = await setActiveCityAction(slug, { hadCartItems });
      if (!result.ok) return;

      // Switching commercial context: clear tray so mixed-city orders cannot linger
      if (hadCartItems) {
        cart.clear();
      }

      startTransition(() => {
        // Server cookie updated; refresh client tree via soft navigation
        window.location.reload();
      });
    },
    [activeCity.slug, cart],
  );

  const value = useMemo(
    () => ({
      cities,
      activeCity,
      acceptsOrders: activeCity.acceptsOrders,
      pending,
      setCity,
    }),
    [activeCity, cities, pending, setCity],
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error("useLocation must be used within LocationProvider");
  }
  return ctx;
}
