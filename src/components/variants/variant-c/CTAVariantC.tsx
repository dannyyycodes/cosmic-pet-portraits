import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import lunaImg from "@/assets/samples/luna-persian.jpg";
import maxImg from "@/assets/samples/max-golden.jpg";
import cinnamonImg from "@/assets/samples/cinnamon-rabbit.jpg";
import peanutImg from "@/assets/samples/peanut-hamster.jpg";

interface CTAVariantCProps {
  variant: "mid" | "final";
  trackCTAClick?: (cta: string, location: string) => void;
}

const petPhotos = [lunaImg, maxImg, cinnamonImg, peanutImg];

export const CTAVariantC = ({ variant, trackCTAClick }: CTAVariantCProps) => {
  return (
    <section className="relative py-16 px-4 z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-xl mx-auto text-center"
      >
        <div className="bg-card rounded-2xl p-8 border border-border shadow-[var(--shadow-card)]">
          {/* Pet photo strip */}
          <div className="flex items-center justify-center gap-[-8px] mb-6">
            {petPhotos.map((photo, i) => (
              <img 
                key={i} 
                src={photo} 
                alt="Pet" 
                className="w-12 h-12 rounded-full object-cover border-2 border-card -ml-2 first:ml-0" 
              />
            ))}
          </div>

          <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-3">
            {variant === "mid"
              ? "The bond you share is deeper than you know."
              : "Give them the love letter they deserve."}
          </h2>

          <p className="text-muted-foreground mb-6">
            {variant === "mid"
              ? "Uncover the beautiful, hidden layers of your relationship in a keepsake you'll treasure forever."
              : "A beautiful keepsake that captures everything you love about them. 100% money-back guarantee."}
          </p>

          <Link
            to="/intake?mode=discover"
            onClick={() => trackCTAClick?.('get_reading', `cta_${variant}`)}
            className="block"
          >
            <Button size="lg" className="w-full max-w-sm mx-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base rounded-xl group">
              {variant === "mid" ? "Discover Our Bond" : "Create Their Story Now"}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          {variant === "mid" && (
            <p className="text-xs text-muted-foreground mt-3">
              100% money-back guarantee
            </p>
          )}

          {variant === "final" && (
            <div className="mt-4">
              <Link
                to="/gift"
                onClick={() => trackCTAClick?.('gift', `cta_${variant}`)}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Gift className="w-4 h-4" />
                Or send as a gift for someone special
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
};