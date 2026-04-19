import { useEffect, useState } from "react";
import {
  type SupportedCurrency,
  type CurrencyPricing,
  PRICING,
  DEFAULT_CURRENCY,
  COUNTRY_TO_CURRENCY,
} from "@/lib/pricing";

/* ── Regional pricing ──
   Detects the user's country from navigator.language (falling back to
   timezone), maps it to one of our 6 supported currencies, and exposes
   the matching psychological-pricing amounts so UI and Stripe checkout
   agree on the number. Long-tail locales (JP, IN, BR, MX, etc.) fall
   back to USD — we'll add native pricing tables for those once volume
   justifies it.
*/

function inferCountryFromTimezone(): string | undefined {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz === "Europe/London") return "GB";
    if (tz === "Europe/Dublin") return "IE";
    if (tz.startsWith("Australia/")) return "AU";
    if (tz === "Pacific/Auckland") return "NZ";
    if (
      tz.startsWith("America/Toronto") ||
      tz.startsWith("America/Vancouver") ||
      tz.startsWith("America/Halifax") ||
      tz.startsWith("America/Montreal") ||
      tz.startsWith("America/Edmonton") ||
      tz.startsWith("America/Winnipeg")
    ) return "CA";
    if (tz.startsWith("Europe/")) return "DE"; // → EUR
  } catch { /* noop */ }
  return undefined;
}

function detectCurrency(): SupportedCurrency {
  try {
    const lang = (typeof navigator !== "undefined" ? navigator.language : "en-US") || "en-US";
    const country = lang.split("-")[1]?.toUpperCase() || inferCountryFromTimezone();
    const code = country ? COUNTRY_TO_CURRENCY[country] : undefined;
    return code || DEFAULT_CURRENCY;
  } catch {
    return DEFAULT_CURRENCY;
  }
}

export function useLocalizedPrice() {
  const [currency, setCurrency] = useState<SupportedCurrency>(DEFAULT_CURRENCY);

  useEffect(() => {
    setCurrency(detectCurrency());
  }, []);

  const prices: CurrencyPricing = PRICING[currency];
  const locale = (typeof navigator !== "undefined" ? navigator.language : "en-US") || "en-US";
  const intlCurrency = currency.toUpperCase();

  /** Format a minor-unit (cents/pence) amount in the user's local currency. */
  const fmt = (cents: number) => {
    const amount = cents / 100;
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: intlCurrency,
        maximumFractionDigits: 2,
        minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
      }).format(amount);
    } catch {
      return `${intlCurrency} ${amount.toFixed(2)}`;
    }
  };

  /** Format a whole-unit amount (convenience for e.g. charity donation dollars). */
  const fmtWhole = (major: number) => {
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: intlCurrency,
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      }).format(major);
    } catch {
      return `${intlCurrency} ${Math.round(major)}`;
    }
  };

  /** Back-compat wrapper — callers still pass semantic GBP-style whole numbers
   *  (29, 49, 99) and we route them to the matching product price. Prefer
   *  `fmt(prices.basic)` etc. in new code. */
  const fmtUsd = (legacy: number): string => {
    if (legacy === 29) return fmt(prices.basic);
    if (legacy === 49) return fmt(prices.premium);
    if (legacy === 79) return fmt(prices.wasPremium);
    if (legacy === 99) return fmt(prices.hardcover);
    return fmtWhole(legacy);
  };

  return {
    code: intlCurrency,           // e.g. "GBP"
    currency,                     // lower-case: e.g. "gbp"
    prices,
    fmt,
    fmtWhole,
    fmtUsd,
    isLocalized: currency !== "usd",
  };
}
