import { useABTest } from "@/hooks/useABTest";

/**
 * Returns variant-aware class names for common UI patterns.
 * Variant C uses warm cream theme; A/B use dark cosmic theme.
 */
export const useVariantStyles = () => {
  const { isVariantC } = useABTest();

  return {
    isVariantC,
    // Page-level card styling
    card: isVariantC
      ? "bg-white border border-border rounded-2xl shadow-sm"
      : "bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl",
    // Primary CTA button variant
    buttonVariant: (isVariantC ? "default" : "cosmic") as "default" | "cosmic",
    // Secondary accent colors
    accentText: isVariantC ? "text-primary" : "text-cosmic-gold",
    accentBg: isVariantC ? "bg-primary/10" : "bg-cosmic-gold/20",
    // Icon accent
    iconColor: isVariantC ? "text-primary" : "text-cosmic-gold",
    // Link hover
    linkHover: isVariantC ? "hover:text-primary" : "hover:text-cosmic-gold",
  };
};
