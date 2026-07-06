/* ── Checkout variant — Reading Dossier is now the default (Commit 3) ──
 *
 * A = the old cosmic two-card grid (kept for measurement / rollback).
 * B = the Reading Dossier (one door, one bump, the six reviews, colour
 *     payment marks, inscription). This is now the DEFAULT for every
 *     non-memorial visitor — reviews visible for everyone.
 *
 * Resolution order:
 *   1. URL override — `?variant=a` or `?variant=b`. A manual arm select
 *      that also persists, so the choice sticks for that browser and stays
 *      consistent across analytics + the memorial fork.
 *   2. Stored arm — a value already written to `ls_checkout_variant`
 *      (the override kept for measurement / any historical assignment).
 *   3. Default — B, the Reading Dossier. The old grid is opt-in only,
 *      via `?variant=a`.
 *
 * Memorial-path visitors are always SHOWN variant A (the dossier's endowed
 * progress + was-price theatrics have no place near grief), but their
 * stored arm is never overwritten by that forcing.
 *
 * The active arm is exposed on <body data-checkout-variant> and enriched
 * into every page_analytics event (usePageAnalytics + trackFunnelEvent),
 * so conversion, Soul Bond attach, and revenue per visitor stay measurable
 * per arm in the existing admin analytics.
 */

export type CheckoutVariant = "A" | "B";

export const CHECKOUT_VARIANT_KEY = "ls_checkout_variant";

/** The default arm shown when nothing overrides it. */
export const DEFAULT_CHECKOUT_VARIANT: CheckoutVariant = "B";

/** Read the stored arm without assigning one. Null when unassigned. */
export function getStoredCheckoutVariant(): CheckoutVariant | null {
  try {
    const v = localStorage.getItem(CHECKOUT_VARIANT_KEY);
    return v === "A" || v === "B" ? v : null;
  } catch {
    return null;
  }
}

/** Read a `?variant=a|b` URL override. Null when absent or unrecognised. */
export function getUrlCheckoutVariant(): CheckoutVariant | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = new URLSearchParams(window.location.search).get("variant");
    if (!raw) return null;
    const v = raw.trim().toUpperCase();
    return v === "A" || v === "B" ? (v as CheckoutVariant) : null;
  } catch {
    return null;
  }
}

/**
 * Get the visitor's arm. URL override wins (and persists); otherwise the
 * stored arm; otherwise the default (B, the Reading Dossier). The resolved
 * arm is always written back to localStorage so downstream analytics read
 * the same value.
 */
export function getCheckoutVariant(): CheckoutVariant {
  const url = getUrlCheckoutVariant();
  const arm: CheckoutVariant = url ?? getStoredCheckoutVariant() ?? DEFAULT_CHECKOUT_VARIANT;
  try {
    localStorage.setItem(CHECKOUT_VARIANT_KEY, arm);
  } catch {
    /* storage unavailable — session-scoped arm, analytics still tagged */
  }
  return arm;
}
