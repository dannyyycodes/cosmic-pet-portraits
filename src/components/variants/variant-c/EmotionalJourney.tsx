import { motion } from "framer-motion";

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-30px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

const lineFade = (delay: number) => ({
  ...fadeIn,
  transition: { duration: 0.4, delay, ease: "easeOut" as const },
});

// Tiny paw SVG
const PawIcon = () => (
  <svg width="18" height="18" viewBox="0 0 100 100" fill="currentColor" className="text-blue-400/40">
    <ellipse cx="50" cy="68" rx="18" ry="16" />
    <ellipse cx="30" cy="42" rx="9" ry="11" />
    <ellipse cx="50" cy="32" rx="9" ry="11" />
    <ellipse cx="70" cy="42" rx="9" ry="11" />
  </svg>
);

// Tiny heart SVG
const HeartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-red-400/40">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const PawHeartDivider = () => (
  <div className="flex items-center justify-center gap-2 py-6 sm:py-8 select-none">
    <PawIcon />
    <HeartIcon />
    <PawIcon />
  </div>
);

interface EmotionalJourneyProps {
  trackCTAClick: (cta: string, location: string) => void;
}

export const EmotionalJourney = ({ trackCTAClick }: EmotionalJourneyProps) => {
  return (
    <div className="relative z-10">
      {/* Section 1 — They Love You Without Conditions */}
      <section className="px-4 py-10 sm:py-14">
        <div className="max-w-xl mx-auto text-center">
          <motion.h2
            {...fadeIn}
            className="text-3xl sm:text-4xl font-caveat font-bold text-foreground mb-5 sm:mb-7 leading-tight"
          >
            They Love You Without Conditions.
          </motion.h2>

          <div className="space-y-2 sm:space-y-3">
            {["On your best days.", "On your worst days."].map((line, i) => (
              <motion.p
                key={i}
                {...lineFade(i * 0.1)}
                className="text-base sm:text-lg text-muted-foreground font-serif"
              >
                {line}
              </motion.p>
            ))}

            <motion.div {...lineFade(0.25)} className="py-2" />

            {["No judgement.", "No expectations."].map((line, i) => (
              <motion.p
                key={line}
                {...lineFade(0.25 + i * 0.1)}
                className="text-base sm:text-lg text-muted-foreground font-serif"
              >
                {line}
              </motion.p>
            ))}

            <motion.p
              {...lineFade(0.5)}
              className="text-lg sm:text-xl text-primary font-serif font-semibold pt-3"
            >
              Just loyalty. Just presence. Just love.
            </motion.p>
          </div>
        </div>
      </section>

      <PawHeartDivider />

      {/* Section 2 — They're Not "Just a Pet." */}
      <section className="px-4 py-10 sm:py-14">
        <div className="max-w-xl mx-auto text-center">
          <motion.h2
            {...fadeIn}
            className="text-3xl sm:text-4xl font-caveat font-bold text-foreground mb-5 sm:mb-7 leading-tight"
          >
            They're Not "Just a Pet."
          </motion.h2>

          <motion.p
            {...lineFade(0.1)}
            className="text-base sm:text-lg text-muted-foreground font-serif leading-relaxed mb-6"
          >
            They are a living, feeling soul with their own personality,
            their own quirks, their own inner world.
          </motion.p>

          <div className="space-y-2 sm:space-y-3">
            {[
              "The way they comfort you.",
              "The way they protect you.",
              "The way they choose you — every single day.",
            ].map((line, i) => (
              <motion.p
                key={i}
                {...lineFade(0.2 + i * 0.1)}
                className="text-base sm:text-lg text-muted-foreground font-serif"
              >
                {line}
              </motion.p>
            ))}
          </div>

          <motion.p
            {...lineFade(0.55)}
            className="text-lg sm:text-xl text-primary font-serif font-bold mt-6"
          >
            That means something.
          </motion.p>
        </div>
      </section>

      <PawHeartDivider />

      {/* Section 3 — This Is an Act of Love */}
      <section className="px-4 py-10 sm:py-14">
        <div className="max-w-xl mx-auto text-center">
          <motion.h2
            {...fadeIn}
            className="text-3xl sm:text-4xl font-caveat font-bold text-foreground mb-5 sm:mb-7 leading-tight"
          >
            This Is an Act of Love.
          </motion.h2>

          <div className="space-y-2 sm:space-y-3 mb-8">
            {[
              "Taking the time to understand them more deeply.",
              "To see who they are as an individual soul.",
              "To honour the bond you share.",
            ].map((line, i) => (
              <motion.p
                key={i}
                {...lineFade(0.1 + i * 0.1)}
                className="text-base sm:text-lg text-muted-foreground font-serif"
              >
                {line}
              </motion.p>
            ))}
          </div>

          <motion.p
            {...lineFade(0.4)}
            className="text-sm sm:text-base text-muted-foreground font-serif mb-5"
          >
            It's a small way of saying:
          </motion.p>

          {/* Quoted block — warm card */}
          <motion.div
            {...lineFade(0.5)}
            className="rounded-2xl bg-primary/5 border border-primary/10 px-6 py-5 sm:px-8 sm:py-6 my-6 max-w-sm mx-auto"
          >
            <p className="text-base sm:text-lg text-foreground font-serif italic leading-relaxed">
              "I see you.
            </p>
            <p className="text-base sm:text-lg text-foreground font-serif italic leading-relaxed mt-1">
              I appreciate you.
            </p>
            <p className="text-base sm:text-lg text-foreground font-serif italic leading-relaxed mt-1">
              I'm grateful you're in my life."
            </p>
          </motion.div>

          <motion.div {...lineFade(0.6)} className="mt-8 space-y-1">
            <p className="text-sm sm:text-base text-muted-foreground font-serif leading-relaxed">
              Because when someone loves you unconditionally…
            </p>
            <p className="text-2xl sm:text-3xl text-foreground font-caveat font-bold leading-snug mt-3">
              the most beautiful thing you can do
            </p>
            <p className="text-2xl sm:text-3xl text-foreground font-caveat font-bold leading-snug">
              is try to understand them in return.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
