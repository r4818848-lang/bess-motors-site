"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CrmPriceMode = "net" | "gross";

const STORAGE_KEY = "bess-crm-price-mode";

type CrmDisplayContextValue = {
  priceMode: CrmPriceMode;
  setPriceMode: (mode: CrmPriceMode) => void;
  togglePriceMode: () => void;
};

const CrmDisplayContext = createContext<CrmDisplayContextValue | null>(null);

export function CrmDisplayProvider({ children }: { children: React.ReactNode }) {
  const [priceMode, setPriceModeState] = useState<CrmPriceMode>("gross");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "net" || stored === "gross") setPriceModeState(stored);
    } catch {
      /* ignore */
    }
  }, []);

  const setPriceMode = useCallback((mode: CrmPriceMode) => {
    setPriceModeState(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, []);

  const togglePriceMode = useCallback(() => {
    setPriceModeState((prev) => {
      const next = prev === "gross" ? "net" : "gross";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ priceMode, setPriceMode, togglePriceMode }),
    [priceMode, setPriceMode, togglePriceMode]
  );

  return (
    <CrmDisplayContext.Provider value={value}>{children}</CrmDisplayContext.Provider>
  );
}

export function useCrmDisplay() {
  const ctx = useContext(CrmDisplayContext);
  if (!ctx) {
    return {
      priceMode: "gross" as CrmPriceMode,
      setPriceMode: () => {},
      togglePriceMode: () => {},
    };
  }
  return ctx;
}
