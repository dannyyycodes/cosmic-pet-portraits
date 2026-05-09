/**
 * GET /api/currency-detect
 *
 * Reads Vercel's auto-injected geo headers and returns the currency the
 * visitor's country should pay in. No JWT required — public endpoint
 * because the answer drives display before sign-in.
 *
 * Response: { currency: "GBP" | "USD", country: "GB", source: "geo" | "fallback" }
 *
 * Currency rule (intentionally narrow until we audit Stripe coverage for
 * other markets):
 *   US           → USD
 *   everyone else → GBP (UK home market default)
 *
 * Future expansion (would need matching Stripe prices created first):
 *   - CA / AU / NZ → USD-equivalent or CAD/AUD-native
 *   - EU bloc      → EUR
 *
 * Headers used:
 *   x-vercel-ip-country  ISO 3166-1 alpha-2 (e.g. "US")
 *
 * Vercel docs: https://vercel.com/docs/edge-network/headers#x-vercel-ip-country
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

const USD_COUNTRIES = new Set(["US"]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const country = (req.headers["x-vercel-ip-country"] as string | undefined)?.toUpperCase() || "";
  const currency = USD_COUNTRIES.has(country) ? "USD" : "GBP";
  const source = country ? "geo" : "fallback";

  // Cache per-country at the edge for an hour. The visitor's country is
  // unlikely to change mid-session, and the response is identical for
  // everyone in the same country.
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.setHeader("Vary", "x-vercel-ip-country");
  return res.status(200).json({ currency, country, source });
}
