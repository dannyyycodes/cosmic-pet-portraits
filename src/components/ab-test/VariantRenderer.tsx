import React, { ReactNode } from "react";
import { useABTest, ABVariant } from "@/hooks/useABTest";

interface VariantRendererProps {
  variants: {
    A: ReactNode;
    B: ReactNode;
    C: ReactNode;
  };
  fallback?: ReactNode;
}

export const VariantRenderer: React.FC<VariantRendererProps> = ({ 
  variants, 
  fallback = null 
}) => {
  const { variant, isLoading } = useABTest();

  if (isLoading) {
    return <>{fallback}</>;
  }

  return <>{variants[variant]}</>;
};

// Component for rendering only on specific variant(s)
interface VariantOnlyProps {
  variants: ABVariant | ABVariant[];
  children: ReactNode;
  fallback?: ReactNode;
}

export const VariantOnly: React.FC<VariantOnlyProps> = ({ 
  variants, 
  children, 
  fallback = null 
}) => {
  const { variant, isLoading } = useABTest();

  if (isLoading) {
    return <>{fallback}</>;
  }

  const allowedVariants = Array.isArray(variants) ? variants : [variants];
  
  if (allowedVariants.includes(variant)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};
