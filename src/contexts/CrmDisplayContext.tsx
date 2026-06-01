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
export type CrmTheme = "dark" | "light";

const PRICE_STORAGE_KEY = "bess-crm-price-mode";
const THEME_STORAGE_KEY = "bess-crm-theme";

type CrmDisplayContextValue = {
  priceMode: CrmPriceMode;
  setPriceMode: (mode: CrmPriceMode) => void;
  togglePriceMode: () => void;
  theme: CrmTheme;
  setTheme: (theme: CrmTheme) => void;
  toggleTheme: () => void;
};

const CrmDisplayContext = createContext<CrmDisplayContextValue | null>(null);

export function CrmDisplayProvider({ children }: { children: React.ReactNode }) {
  const [priceMode, setPriceModeState] = useState<CrmPriceMode>("gross");
  const [theme, setThemeState] = useState<CrmTheme>("dark");

  useEffect(() => {
    try {
      const storedPrice = localStorage.getItem(PRICE_STORAGE_KEY);
      if (storedPrice === "net" || storedPrice === "gross") setPriceModeState(storedPrice);
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (storedTheme === "dark" || storedTheme === "light") setThemeState(storedTheme);
    } catch {
      /* ignore */
    }
  }, []);

  const setPriceMode = useCallback((mode: CrmPriceMode) => {
    setPriceModeState(mode);
    try {
      localStorage.setItem(PRICE_STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, []);

  const togglePriceMode = useCallback(() => {
    setPriceModeState((prev) => {
      const next = prev === "gross" ? "net" : "gross";
      try {
        localStorage.setItem(PRICE_STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const setTheme = useCallback((next: CrmTheme) => {
    setThemeState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: CrmTheme = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      priceMode,
      setPriceMode,
      togglePriceMode,
      theme,
      setTheme,
      toggleTheme,
    }),
    [priceMode, setPriceMode, togglePriceMode, theme, setTheme, toggleTheme]
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
      theme: "dark" as CrmTheme,
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  return ctx;
}
