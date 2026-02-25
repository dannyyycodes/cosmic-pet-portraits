import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroVariantCProps {
  trackCTAClick: (cta: string, location: string) => void;
}

export const HeroVariantC = ({ trackCTAClick }: HeroVariantCProps) => {
  return (
    <section className="relative flex flex-col items-center justify-center px-4 pt-14 sm:pt-20 pb-4 z-10">
      <div className="max-w-sm mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col items-center gap-3"
        >
          <Link to="/checkout?tier=premium" onClick={() => trackCTAClick('get_reading', 'hero')} className="w-full">
            <Button size="lg" className="w-full text-base sm:text-lg px-6 py-7 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold group transition-all">
              Discover Who They Really Are
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          <p className="text-xs text-muted-foreground">
            Instant delivery · 100% money-back guarantee
          </p>
        </motion.div>
      </div>
    </section>
  );
};