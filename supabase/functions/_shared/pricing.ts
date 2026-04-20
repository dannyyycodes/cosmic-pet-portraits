/* ── Multi-currency pricing — single source of truth (server) ──
   All prices in minor units (cents / pence). Keep in sync with
   src/lib/pricing.ts on the client. Both must match exactly — the
   client passes `currency` + displays the matching amount, and the
   server charges the matching amount in that currency via Stripe.
*/

export type SupportedCurrency = "gbp" | "usd" | "eur" | "aud" | "cad" | "nzd";

export const SUPPORTED_CURRENCIES: readonly SupportedCurrency[] = [
  "gbp", "usd", "eur", "aud", "cad", "nzd",
] as const;

export function isSupportedCurrency(c: string | undefined | null): c is SupportedCurrency {
  return !!c && (SUPPORTED_CURRENCIES as readonly string[]).includes(c);
}

export interface CurrencyPricing {
  basic: number;
  premium: number;
  hardcover: number;
  /** @deprecated Photo upload is included for all tiers. Field retained for legacy type compatibility; do not read at runtime. */
  portrait: number;
  wasBasic: number;
  wasPremium: number;
  horoscopeMonthly: number;
  horoscopeYearly: number;
  giftBasic: number;
  giftPremium: number;
  giftUpsell: number;
  giftCertValue: number;
  compatTier1: number;
  compatTier2: number;
  compatTier3: number;
}

export const PRICING: Record<SupportedCurrency, CurrencyPricing> = {
  gbp: {
    basic: 2900, premium: 4900, hardcover: 9900, portrait: 800,
    wasBasic: 4900, wasPremium: 7900,
    horoscopeMonthly: 499, horoscopeYearly: 3999,
    giftBasic: 1450, giftPremium: 2450, giftUpsell: 1990, giftCertValue: 2900,
    compatTier1: 1200, compatTier2: 1000, compatTier3: 800,
  },
  usd: {
    basic: 3900, premium: 5900, hardcover: 11900, portrait: 1000,
    wasBasic: 6500, wasPremium: 9900,
    horoscopeMonthly: 599, horoscopeYearly: 4999,
    giftBasic: 1950, giftPremium: 2950, giftUpsell: 2690, giftCertValue: 3900,
    compatTier1: 1599, compatTier2: 1299, compatTier3: 999,
  },
  eur: {
    basic: 3500, premium: 5500, hardcover: 11500, portrait: 900,
    wasBasic: 5900, wasPremium: 8900,
    horoscopeMonthly: 599, horoscopeYearly: 4799,
    giftBasic: 1750, giftPremium: 2750, giftUpsell: 2390, giftCertValue: 3500,
    compatTier1: 1399, compatTier2: 1199, compatTier3: 899,
  },
  aud: {
    basic: 5500, premium: 9500, hardcover: 18900, portrait: 1500,
    wasBasic: 8900, wasPremium: 14900,
    horoscopeMonthly: 899, horoscopeYearly: 7999,
    giftBasic: 2750, giftPremium: 4750, giftUpsell: 3790, giftCertValue: 5500,
    compatTier1: 2299, compatTier2: 1899, compatTier3: 1499,
  },
  cad: {
    basic: 4900, premium: 8500, hardcover: 16900, portrait: 1400,
    wasBasic: 7900, wasPremium: 13900,
    horoscopeMonthly: 799, horoscopeYearly: 6999,
    giftBasic: 2450, giftPremium: 4250, giftUpsell: 3390, giftCertValue: 4900,
    compatTier1: 1999, compatTier2: 1699, compatTier3: 1399,
  },
  nzd: {
    basic: 5900, premium: 9900, hardcover: 19900, portrait: 1600,
    wasBasic: 9900, wasPremium: 15900,
    horoscopeMonthly: 999, horoscopeYearly: 7999,
    giftBasic: 2950, giftPremium: 4950, giftUpsell: 3990, giftCertValue: 5900,
    compatTier1: 2499, compatTier2: 1999, compatTier3: 1599,
  },
};

export const DEFAULT_CURRENCY: SupportedCurrency = "usd";

export function getPricing(currency: SupportedCurrency): CurrencyPricing {
  return PRICING[currency];
}

export function normalizeCurrency(raw: unknown): SupportedCurrency {
  if (typeof raw === "string" && isSupportedCurrency(raw.toLowerCase())) {
    return raw.toLowerCase() as SupportedCurrency;
  }
  return DEFAULT_CURRENCY;
}
