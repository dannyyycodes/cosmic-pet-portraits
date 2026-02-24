import { useABTest } from "@/hooks/useABTest";
import { StarfieldBackground } from "@/components/cosmic/StarfieldBackground";

interface VariantBackgroundProps {
  intensity?: "calm" | "normal" | "excited";
  interactive?: boolean;
}

/**
 * Drop-in replacement for StarfieldBackground that is variant-aware.
 * Variant C: warm cream gradient. A/B: cosmic starfield.
 */
export const VariantBackground = ({ intensity, interactive }: VariantBackgroundProps) => {
  const { isVariantC } = useABTest();

  if (isVariantC) {
    return (
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, hsl(35 33% 98%) 0%, hsl(30 30% 96%) 50%, hsl(35 33% 98%) 100%)',
          }}
        />
      </div>
    );
  }

  return <StarfieldBackground intensity={intensity} interactive={interactive} />;
};
