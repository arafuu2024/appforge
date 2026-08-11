import React from "react";
import { useCurrency, CURRENCIES } from "@/lib/currency";

export default function CurrencySelector({ className = "" }) {
  const { code, setCode } = useCurrency();
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm font-medium text-muted-foreground">Currency</span>
      <div className="relative">
        <select
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="h-10 pl-3 pr-9 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm font-semibold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/30"
        >
          {Object.values(CURRENCIES).map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.code}
            </option>
          ))}
        </select>
        <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  );
}