/**
 * A/B variant hook for the V2 funnel — retired.
 * 100% of traffic now sees the single unified variant.
 *
 * Hook kept as a no-op stub so any still-mounted consumer doesn't
 * break; it always resolves to "A". Feel free to remove once callers
 * are migrated.
 */

export type FunnelV2Variant = "A";

export const useFunnelV2Variant = () => {
  const variant: FunnelV2Variant = "A";
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const pick = <T,>(options: { A: T; B?: T }): T => options.A;

  return {
    variant,
    ready: true,
    isA: true,
    isB: false,
    pick,
  };
};
