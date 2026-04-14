import { useEffect, useState } from "react";

/* ── Currency localisation ──
   Maps the user's browser locale country code to a display currency, then
   pulls a live USD→X rate from open.er-api.com (no API key, free tier).
   Checkout still charges in USD; this only affects what's shown on the
   page. Falls back to USD on any failure.

   Single source of truth — used by the landing page (InlineCheckout,
   FunnelV2 sticky + final CTAs) and the gift page (GiftPurchase).
*/
const LOCALE_COUNTRY_TO_CURRENCY: Record<string, string> = {
  GB: "GBP", AU: "AUD", CA: "CAD", NZ: "NZD",
  IE: "EUR", FR: "EUR", DE: "EUR", ES: "EUR", IT: "EUR", NL: "EUR",
  AT: "EUR", BE: "EUR", PT: "EUR", FI: "EUR", GR: "EUR", LU: "EUR",
  CY: "EUR", MT: "EUR", SK: "EUR", SI: "EUR", EE: "EUR", LV: "EUR",
  LT: "EUR", HR: "EUR",
  JP: "JPY", IN: "INR", MX: "MXN", BR: "BRL", ZA: "ZAR",
  CH: "CHF", SE: "SEK", NO: "NOK", DK: "DKK", PL: "PLN",
  SG: "SGD", HK: "HKD", AE: "AED", IL: "ILS",
};

/* Timezone fallback for cases where navigator.language has no region
   (e.g. plain "en"). Covers the largest non-USD audiences. */
function inferCountryFromTimezone(): string | undefined {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz === "Europe/London") return "GB";
    if (tz === "Europe/Dublin") return "IE";
    if (tz.startsWith("Australia/")) return "AU";
    if (tz === "Pacific/Auckland") return "NZ";
    if (tz.startsWith("America/Toronto") || tz.startsWith("America/Vancouver") ||
        tz.startsWith("America/Halifax") || tz.startsWith("America/Montreal") ||
        tz.startsWith("America/Edmonton") || tz.startsWith("America/Winnipeg")) return "CA";
    if (tz.startsWith("Europe/")) return "DE"; // → EUR
    if (tz === "Asia/Tokyo") return "JP";
    if (tz === "Asia/Singapore") return "SG";
    if (tz === "Asia/Hong_Kong") return "HK";
  } catch { /* noop */ }
  return undefined;
}

export function useLocalizedPrice() {
  const [state, setState] = useState<{ code: string; rate: number }>({ code: "USD", rate: 1 });

  useEffect(() => {
    try {
      const lang = (typeof navigator !== "undefined" ? navigator.language : "en-US") || "en-US";
      const country = lang.split("-")[1]?.toUpperCase() || inferCountryFromTimezone();
      const code = country ? LOCALE_COUNTRY_TO_CURRENCY[country] : undefined;
      if (!code || code === "USD") return;

      fetch("https://open.er-api.com/v6/latest/USD")
        .then((r) => r.json())
        .then((j) => {
          const rate = j?.rates?.[code];
          if (typeof rate === "number" && rate > 0) {
            setState({ code, rate });
          }
        })
        .catch(() => { /* stay on USD */ });
    } catch { /* stay on USD */ }
  }, []);

  const locale = (typeof navigator !== "undefined" ? navigator.language : "en-US") || "en-US";

  /** Format a USD cents amount in the display currency (Intl-aware). */
  const fmt = (cents: number) => {
    const amount = (cents / 100) * state.rate;
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: state.code,
        maximumFractionDigits: state.code === "JPY" ? 0 : 2,
        minimumFractionDigits: state.code === "JPY" ? 0 : 0,
      }).format(amount);
    } catch {
      return `$${amount.toFixed(2)}`;
    }
  };

  /** Format a USD whole-dollar amount in the display currency, rounded to
   *  whole units for clean CTA copy (e.g. "£22" not "£21.33"). */
  const fmtUsd = (usd: number) => {
    const amount = usd * state.rate;
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: state.code,
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      }).format(amount);
    } catch {
      return `$${Math.round(amount)}`;
    }
  };

  return { code: state.code, rate: state.rate, fmt, fmtUsd, isLocalized: state.code !== "USD" };
}
