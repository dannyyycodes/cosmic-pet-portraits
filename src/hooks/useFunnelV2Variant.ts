import { useEffect, useState } from "react";

/**
 * Lightweight A/B variant hook for the V2 funnel.
 * - 50/50 split between "A" (control) and "B" (test)
 * - Persists via localStorage (key: funnel_v2_variant)
 * - URL override: ?v2=A or ?v2=B (useful for QA / sharing)
 * - Exposes the active variant for analytics enrichment
 *
 * Separate from the existing useABTest hook (which is locked
 * to variant C for the legacy landing page). Do not merge.
 */

export type FunnelV2Variant = "A" | "B";

const STORAGE_KEY = "funnel_v2_variant";
const URL_PARAM = "v2";

const pickRandom = (): FunnelV2Variant => (Math.random() < 0.5 ? "A" : "B");

const readOverride = (): FunnelV2Variant | null => {
  try {
    const params = new URLSearchParams(window.location.search);
    const urlVariant = params.get(URL_PARAM)?.toUpperCase();
    if (urlVariant === "A" || urlVariant === "B") return urlVariant;
  } catch {}
  return null;
};

const readStored = (): FunnelV2Variant | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "A" || stored === "B") return stored;
  } catch {}
  return null;
};

const persist = (variant: FunnelV2Variant) => {
  try {
    localStorage.setItem(STORAGE_KEY, variant);
    sessionStorage.setItem("funnel_v2_variant_session", variant);
  } catch {}
};

export const useFunnelV2Variant = () => {
  // SSR-safe default: "A". Client hydrates the real value below.
  const [variant, setVariant] = useState<FunnelV2Variant>("A");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const override = readOverride();
    if (override) {
      setVariant(override);
      persist(override);
      setReady(true);
      return;
    }

    const stored = readStored();
    if (stored) {
      setVariant(stored);
      setReady(true);
      return;
    }

    const fresh = pickRandom();
    setVariant(fresh);
    persist(fresh);
    setReady(true);
  }, []);

  const pick = <T,>(options: { A: T; B: T }): T => options[variant];

  return {
    variant,
    ready,
    isA: variant === "A",
    isB: variant === "B",
    pick,
  };
};
