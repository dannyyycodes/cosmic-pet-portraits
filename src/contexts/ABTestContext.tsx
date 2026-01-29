import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ABVariant = "A" | "B" | "C";

interface ABTestContextType {
  variant: ABVariant;
  isLoading: boolean;
  setVariantOverride: (variant: ABVariant) => void;
}

const ABTestContext = createContext<ABTestContextType | undefined>(undefined);

const STORAGE_KEY = "ab_test_variant";
const URL_PARAM = "variant";

// Weighted random assignment (33% each)
const assignVariant = (): ABVariant => {
  const random = Math.random();
  if (random < 0.333) return "A";
  if (random < 0.666) return "B";
  return "C";
};

interface ABTestProviderProps {
  children: ReactNode;
}

export const ABTestProvider: React.FC<ABTestProviderProps> = ({ children }) => {
  const [variant, setVariant] = useState<ABVariant>("A");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check URL parameter first (for testing)
    const urlParams = new URLSearchParams(window.location.search);
    const urlVariant = urlParams.get(URL_PARAM)?.toUpperCase() as ABVariant;
    
    if (urlVariant && ["A", "B", "C"].includes(urlVariant)) {
      setVariant(urlVariant);
      localStorage.setItem(STORAGE_KEY, urlVariant);
      setIsLoading(false);
      return;
    }

    // Check localStorage for existing assignment
    const storedVariant = localStorage.getItem(STORAGE_KEY) as ABVariant;
    
    if (storedVariant && ["A", "B", "C"].includes(storedVariant)) {
      setVariant(storedVariant);
      setIsLoading(false);
      return;
    }

    // Assign new variant randomly
    const newVariant = assignVariant();
    setVariant(newVariant);
    localStorage.setItem(STORAGE_KEY, newVariant);
    setIsLoading(false);
  }, []);

  const setVariantOverride = (newVariant: ABVariant) => {
    setVariant(newVariant);
    localStorage.setItem(STORAGE_KEY, newVariant);
  };

  return (
    <ABTestContext.Provider value={{ variant, isLoading, setVariantOverride }}>
      {children}
    </ABTestContext.Provider>
  );
};

export const useABTestContext = () => {
  const context = useContext(ABTestContext);
  if (context === undefined) {
    throw new Error("useABTestContext must be used within an ABTestProvider");
  }
  return context;
};
