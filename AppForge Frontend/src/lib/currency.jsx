import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export const CURRENCIES = {
  BDT: { code: "BDT", symbol: "৳", flag: "🇧🇩", rate: 1, label: "Bangladeshi Taka" },
  USD: { code: "USD", symbol: "$", flag: "🇺🇸", rate: 1 / 110, label: "US Dollar" },
  EUR: { code: "EUR", symbol: "€", flag: "🇪🇺", rate: 1 / 120, label: "Euro" },
  INR: { code: "INR", symbol: "₹", flag: "🇮🇳", rate: 1 / 1.3, label: "Indian Rupee" },
  GBP: { code: "GBP", symbol: "£", flag: "🇬🇧", rate: 1 / 140, label: "British Pound" },
};

const CurrencyContext = createContext(null);
const STORAGE_KEY = "appforge-currency";

const detectCurrency = () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const lang = (navigator.language || "").toLowerCase();
    if (tz === "Asia/Dhaka" || lang.startsWith("bn") || lang.includes("-bd")) return "BDT";
    if (tz.startsWith("Asia/Kolkata") || lang.startsWith("hi") || lang.includes("-in")) return "INR";
    if (tz.startsWith("Europe/")) return "EUR";
    if (tz.startsWith("America/") || lang.includes("en-us")) return "USD";
    if (tz.startsWith("Asia/")) return "BDT";
  } catch {}
  return "BDT";
};

export function CurrencyProvider({ children }) {
  const [code, setCode] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && CURRENCIES[stored]) return stored;
    const detected = detectCurrency();
    localStorage.setItem(STORAGE_KEY, detected);
    return detected;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, code);
  }, [code]);

  const currency = CURRENCIES[code] || CURRENCIES.BDT;

  const formatPrice = useCallback(
    (priceBDT) => {
      const converted = Math.round((priceBDT || 0) * currency.rate);
      return `${currency.symbol}${converted.toLocaleString()}`;
    },
    [currency]
  );

  return (
    <CurrencyContext.Provider value={{ code, setCode, currency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    return {
      code: "BDT",
      setCode: () => {},
      currency: CURRENCIES.BDT,
      formatPrice: (p) => `৳${Math.round(p || 0).toLocaleString()}`,
    };
  }
  return ctx;
}