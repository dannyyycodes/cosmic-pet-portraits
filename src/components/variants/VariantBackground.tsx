import { useABTest } from "@/hooks/useABTest";
import { StarfieldBackground } from "@/components/cosmic/StarfieldBackground";

interface VariantBackgroundProps {
  intensity?: "calm" | "normal" | "excited";
  interactive?: boolean;
}

/**
 * Drop-in replacement for StarfieldBackground that is variant-aware.
 * Variant C: buttery yellow gradient. A/B: cosmic starfield.
 */
export const VariantBackground = ({ intensity, interactive }: VariantBackgroundProps) => {
  const { isVariantC } = useABTest();

  if (isVariantC) {
    return (
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, hsl(45 100% 91%) 0%, hsl(40 60% 87%) 50%, hsl(45 100% 91%) 100%)',
          }}
        />
      </div>
    );
  }

  return <StarfieldBackground intensity={intensity} interactive={interactive} />;
};
