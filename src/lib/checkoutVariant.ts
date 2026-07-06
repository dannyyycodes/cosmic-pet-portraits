/* ── Checkout A/B variant — Phase 5 of the funnel redesign ──
 *
 * A = the current cosmic two-card grid (control, untouched).
 * B = the Reading Dossier (one door, one bump).
 *
 * Assignment is a persisted 50/50 coin flip: the first visit draws once,
 * writes it to localStorage under `ls_checkout_variant`, and every later
 * visit reads the stored arm — deterministic per browser from then on.
 * Memorial-path visitors are always SHOWN variant A (the dossier's endowed
 * progress + was-price theatrics have no place near grief), but their
 * stored assignment is never overwritten, so a later non-memorial visit
 * still lands in their true arm.
 *
 * The active arm is exposed on <body data-checkout-variant> and enriched
 * into every page_analytics event (usePageAnalytics + trackFunnelEvent),
 * so conversion, Soul Bond attach, and revenue per visitor are measurable
 * per arm in the existing admin analytics.
 */

export type CheckoutVariant = "A" | "B";

export const CHECKOUT_VARIANT_KEY = "ls_checkout_variant";

/** Read the stored arm without assigning one. Null when unassigned. */
export function getStoredCheckoutVariant(): CheckoutVariant | null {
  try {
    const v = localStorage.getItem(CHECKOUT_VARIANT_KEY);
    return v === "A" || v === "B" ? v : null;
  } catch {
    return null;
  }
}

/** Get the visitor's arm, assigning + persisting a 50/50 draw on first call. */
export function getCheckoutVariant(): CheckoutVariant {
  const stored = getStoredCheckoutVariant();
  if (stored) return stored;
  const assigned: CheckoutVariant = Math.random() < 0.5 ? "A" : "B";
  try {
    localStorage.setItem(CHECKOUT_VARIANT_KEY, assigned);
  } catch {
    /* storage unavailable — session-scoped arm, analytics still tagged */
  }
  return assigned;
}
