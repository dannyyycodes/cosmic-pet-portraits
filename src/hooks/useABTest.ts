import { useABTestContext, ABVariant } from "@/contexts/ABTestContext";

interface ABTestHook {
  variant: ABVariant;
  isLoading: boolean;
  isVariantA: boolean;
  isVariantB: boolean;
  isVariantC: boolean;
  setVariantOverride: (variant: ABVariant) => void;
  getVariantValue: <T>(values: { A: T; B: T; C: T }) => T;
}

export const useABTest = (): ABTestHook => {
  const { variant, isLoading, setVariantOverride } = useABTestContext();

  const getVariantValue = <T,>(values: { A: T; B: T; C: T }): T => {
    return values[variant];
  };

  return {
    variant,
    isLoading,
    isVariantA: variant === "A",
    isVariantB: variant === "B",
    isVariantC: variant === "C",
    setVariantOverride,
    getVariantValue,
  };
};

export type { ABVariant };
