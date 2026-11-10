"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [city, setCityState] = useState(activeCity);

  // Stay in sync when the server tree refreshes after a city change.
  useEffect(() => {
    setCityState(activeCity);
  }, [activeCity]);

  const setCity = useCallback(
    async (slug: string) => {
      if (slug === city.slug) return;
      const next = cities.find((item) => item.slug === slug);
      if (!next) return;

      const previous = city;
      const hadCartItems = cart.count > 0;

      // Optimistic UI — switcher updates immediately.
      setCityState(next);

      const result = await setActiveCityAction(slug, { hadCartItems });
      if (!result.ok) {
        setCityState(previous);
        return;
      }

      if (hadCartItems) {
        cart.clear();
      }

      // Soft RSC refresh (no full document reload).
      startTransition(() => {
        router.refresh();
      });
    },
    [cart, cities, city, router],
  );

  const value = useMemo(
    () => ({
      cities,
      activeCity: city,
      acceptsOrders: city.acceptsOrders,
      pending,
      setCity,
    }),
    [cities, city, pending, setCity],
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
