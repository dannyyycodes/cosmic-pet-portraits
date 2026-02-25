import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const lineFade = (delay: number) => ({
  ...fadeIn,
  transition: { duration: 0.5, delay, ease: "easeOut" as const },
});

interface EmotionalJourneyProps {
  trackCTAClick: (cta: string, location: string) => void;
}

export const EmotionalJourney = ({ trackCTAClick }: EmotionalJourneyProps) => {
  return (
    <div className="relative z-10">
      {/* Section 1 — They Love You Without Conditions */}
      <section className="px-4 py-20 sm:py-28">
        <div className="max-w-2xl mx-auto text-center">
          <motion.h2
            {...fadeIn}
            className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-foreground mb-10 sm:mb-14 leading-tight"
          >
            They Love You Without Conditions.
          </motion.h2>

          <div className="space-y-4 sm:space-y-5">
            {[
              "On your best days.",
              "On your worst days.",
            ].map((line, i) => (
              <motion.p
                key={i}
                {...lineFade(i * 0.12)}
                className="text-lg sm:text-xl text-muted-foreground font-serif"
              >
                {line}
              </motion.p>
            ))}

            <motion.div {...lineFade(0.3)} className="py-3" />

            {[
              "No judgement.",
              "No expectations.",
            ].map((line, i) => (
              <motion.p
                key={line}
                {...lineFade(0.3 + i * 0.12)}
                className="text-lg sm:text-xl text-muted-foreground font-serif"
              >
                {line}
              </motion.p>
            ))}

            <motion.p
              {...lineFade(0.6)}
              className="text-xl sm:text-2xl text-foreground font-serif font-semibold pt-4"
            >
              Just loyalty. Just presence. Just love.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Subtle divider */}
      <div className="flex justify-center py-4">
        <motion.span {...fadeIn} className="text-primary/30 text-2xl tracking-widest select-none">
          · · ·
        </motion.span>
      </div>

      {/* Section 2 — They're Not "Just a Pet." */}
      <section className="px-4 py-20 sm:py-28">
        <div className="max-w-2xl mx-auto text-center">
          <motion.h2
            {...fadeIn}
            className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-foreground mb-10 sm:mb-14 leading-tight"
          >
            They're Not "Just a Pet."
          </motion.h2>

          <motion.p
            {...lineFade(0.1)}
            className="text-lg sm:text-xl text-muted-foreground font-serif leading-relaxed mb-10"
          >
            They are a living, feeling soul with their own personality,
            their own quirks, their own inner world.
          </motion.p>

          <div className="space-y-4 sm:space-y-5">
            {[
              "The way they comfort you.",
              "The way they protect you.",
              "The way they choose you — every single day.",
            ].map((line, i) => (
              <motion.p
                key={i}
                {...lineFade(0.2 + i * 0.12)}
                className="text-lg sm:text-xl text-muted-foreground font-serif"
              >
                {line}
              </motion.p>
            ))}
          </div>

          <motion.p
            {...lineFade(0.6)}
            className="text-xl sm:text-2xl text-foreground font-serif font-bold mt-10"
          >
            That means something.
          </motion.p>
        </div>
      </section>

      {/* Subtle divider */}
      <div className="flex justify-center py-4">
        <motion.span {...fadeIn} className="text-primary/30 text-2xl tracking-widest select-none">
          · · ·
        </motion.span>
      </div>

      {/* Section 3 — This Is an Act of Love */}
      <section className="px-4 py-20 sm:py-28">
        <div className="max-w-2xl mx-auto text-center">
          <motion.h2
            {...fadeIn}
            className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-foreground mb-10 sm:mb-14 leading-tight"
          >
            This Is an Act of Love.
          </motion.h2>

          <div className="space-y-4 sm:space-y-5 mb-12">
            {[
              "Taking the time to understand them more deeply.",
              "To see who they are as an individual soul.",
              "To honour the bond you share.",
            ].map((line, i) => (
              <motion.p
                key={i}
                {...lineFade(0.1 + i * 0.12)}
                className="text-lg sm:text-xl text-muted-foreground font-serif"
              >
                {line}
              </motion.p>
            ))}
          </div>

          <motion.p
            {...lineFade(0.5)}
            className="text-base sm:text-lg text-muted-foreground font-serif mb-8"
          >
            It's a small way of saying:
          </motion.p>

          {/* Quoted block */}
          <motion.div
            {...lineFade(0.6)}
            className="border-l-4 border-primary/30 pl-6 sm:pl-8 py-4 my-10 text-left max-w-md mx-auto"
          >
            <p className="text-lg sm:text-xl text-foreground font-serif italic leading-relaxed">
              "I see you.
            </p>
            <p className="text-lg sm:text-xl text-foreground font-serif italic leading-relaxed mt-2">
              I appreciate you.
            </p>
            <p className="text-lg sm:text-xl text-foreground font-serif italic leading-relaxed mt-2">
              I'm grateful you're in my life."
            </p>
          </motion.div>

          <motion.div {...lineFade(0.7)} className="mt-12 space-y-2">
            <p className="text-base sm:text-lg text-muted-foreground font-serif leading-relaxed">
              Because when someone loves you unconditionally…
            </p>
            <p className="text-xl sm:text-2xl text-foreground font-serif font-semibold leading-relaxed mt-4">
              the most beautiful thing you can do
            </p>
            <p className="text-xl sm:text-2xl text-foreground font-serif font-semibold leading-relaxed">
              is try to understand them in return.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA after emotional journey */}
      <section className="px-4 py-12 sm:py-16">
        <div className="max-w-sm mx-auto text-center">
          <motion.div {...fadeIn}>
            <Link
              to="/checkout?tier=premium"
              onClick={() => trackCTAClick("get_reading", "emotional_journey")}
            >
              <Button
                size="lg"
                className="w-full text-base sm:text-lg px-6 py-7 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold group transition-all"
              >
                Discover Who They Really Are
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground mt-3">
              Instant delivery · 100% money-back guarantee
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
