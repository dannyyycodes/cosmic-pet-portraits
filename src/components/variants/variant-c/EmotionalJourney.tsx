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
const PawIcon = ({ className = "text-blue-500/50" }: { className?: string }) => (
  <svg width="14" height="14" viewBox="0 0 100 100" fill="currentColor" className={className}>
    <ellipse cx="50" cy="68" rx="18" ry="16" />
    <ellipse cx="30" cy="42" rx="9" ry="11" />
    <ellipse cx="50" cy="32" rx="9" ry="11" />
    <ellipse cx="70" cy="42" rx="9" ry="11" />
  </svg>
);

// Tiny heart SVG
const HeartIcon = ({ className = "text-red-500/50" }: { className?: string }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

// Animated meandering trail divider
const TrailDivider = () => {
  const icons = [
    { Icon: PawIcon, x: -12, opacity: 0.6, delay: 0, className: "text-blue-500/50" },
    { Icon: HeartIcon, x: 12, opacity: 0.4, delay: 0.2, className: "text-red-500/50" },
    { Icon: PawIcon, x: 0, opacity: 0.2, delay: 0.4, className: "text-blue-500/50" },
  ];

  return (
    <div className="flex flex-col items-center gap-1 py-12 md:py-16 select-none">
      {icons.map(({ Icon, x, opacity, delay, className }, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 0 }}
          whileInView={{ opacity, x }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay, ease: "easeOut" }}
        >
          <Icon className={className} />
        </motion.div>
      ))}
    </div>
  );
};

interface EmotionalJourneyProps {
  trackCTAClick: (cta: string, location: string) => void;
}

export const EmotionalJourney = ({ trackCTAClick }: EmotionalJourneyProps) => {
  return (
    <div className="relative z-10">
      {/* Section 1 — They Love You Without Conditions */}
      <section className="px-6 py-24 md:py-32">
        <div className="max-w-3xl mx-auto text-center space-y-3 md:space-y-4">
          <motion.h2
            {...fadeIn}
            className="font-serif text-4xl md:text-6xl font-bold tracking-tighter text-slate-900"
            style={{ textWrap: "balance" } as React.CSSProperties}
          >
            They Love You Without Conditions.
          </motion.h2>

          <div className="space-y-3 md:space-y-4 pt-6">
            {["On your best days.", "On your worst days."].map((line, i) => (
              <motion.p
                key={i}
                {...lineFade(i * 0.15)}
                className="font-sans text-xs md:text-sm font-light uppercase tracking-[0.3em] text-slate-500"
              >
                {line}
              </motion.p>
            ))}

            <motion.div {...lineFade(0.25)} className="py-1" />

            {["No judgement.", "No expectations."].map((line, i) => (
              <motion.p
                key={line}
                {...lineFade(0.3 + i * 0.15)}
                className="font-sans text-xs md:text-sm font-light uppercase tracking-[0.3em] text-slate-500"
              >
                {line}
              </motion.p>
            ))}

            <motion.p
              {...lineFade(0.6)}
              className="font-serif text-2xl md:text-3xl italic font-medium text-slate-800 leading-relaxed pt-4"
            >
              Just loyalty · Just presence · Just love.
            </motion.p>
          </div>
        </div>
      </section>

      <TrailDivider />

      {/* Section 2 — They're Not "Just a Pet." */}
      <section className="px-6 py-24 md:py-32">
        <div className="max-w-3xl mx-auto text-center space-y-3 md:space-y-4">
          <motion.h2
            {...fadeIn}
            className="font-serif text-4xl md:text-6xl font-bold tracking-tighter text-slate-900"
            style={{ textWrap: "balance" } as React.CSSProperties}
          >
            They're Not "Just a Pet."
          </motion.h2>

          <motion.p
            {...lineFade(0.1)}
            className="font-serif text-lg md:text-xl text-slate-600 leading-relaxed pt-4"
          >
            They are a living, feeling soul with their own personality,
            their own quirks, their own inner world.
          </motion.p>

          <div className="space-y-3 md:space-y-4 pt-4">
            {[
              "The way they comfort you.",
              "The way they protect you.",
              "The way they choose you — every single day.",
            ].map((line, i) => (
              <motion.p
                key={i}
                {...lineFade(0.2 + i * 0.15)}
                className="font-serif italic text-slate-700 pl-4"
              >
                {line}
              </motion.p>
            ))}
          </div>

          <motion.p
            {...lineFade(0.65)}
            className="font-serif text-2xl md:text-3xl italic font-medium text-slate-800 leading-relaxed pt-6"
          >
            That means something.
          </motion.p>
        </div>
      </section>

      <TrailDivider />

      {/* Section 3 — This Is an Act of Love */}
      <section className="px-6 py-24 md:py-32">
        <div className="max-w-3xl mx-auto text-center space-y-3 md:space-y-4">
          <motion.h2
            {...fadeIn}
            className="font-serif text-4xl md:text-6xl font-bold tracking-tighter text-slate-900"
            style={{ textWrap: "balance" } as React.CSSProperties}
          >
            This Is an Act of Love.
          </motion.h2>

          <div className="space-y-3 md:space-y-4 pt-6">
            {[
              "Taking the time to understand them more deeply.",
              "To see who they are as an individual soul.",
              "To honour the bond you share.",
            ].map((line, i) => (
              <motion.p
                key={i}
                {...lineFade(0.1 + i * 0.12)}
                className="font-sans text-xs md:text-sm font-light uppercase tracking-[0.3em] text-slate-500"
              >
                {line}
              </motion.p>
            ))}
          </div>

          <motion.p
            {...lineFade(0.4)}
            className="font-sans text-xs md:text-sm font-light uppercase tracking-[0.3em] text-slate-500 pt-4"
          >
            It's a small way of saying:
          </motion.p>

          {/* Floating Quote */}
          <motion.div
            {...lineFade(0.5)}
            className="relative py-10 my-6 max-w-sm mx-auto"
          >
            <span
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 text-[160px] font-serif text-slate-900 opacity-5 select-none pointer-events-none leading-none"
              aria-hidden="true"
            >
              "
            </span>
            <div className="relative z-10 space-y-1">
              <p className="font-serif italic text-lg md:text-xl text-slate-800">
                "I see you.
              </p>
              <p className="font-serif italic text-lg md:text-xl text-slate-800">
                I appreciate you.
              </p>
              <p className="font-serif italic text-lg md:text-xl text-slate-800">
                I'm grateful you're in my life."
              </p>
            </div>
          </motion.div>

          <motion.div {...lineFade(0.6)} className="mt-4 space-y-3">
            <p className="font-sans text-xs md:text-sm font-light uppercase tracking-[0.3em] text-slate-500">
              Because when someone loves you unconditionally…
            </p>
            <p className="font-serif text-2xl md:text-3xl italic font-medium text-slate-800 leading-relaxed pt-3">
              the most beautiful thing you can do
            </p>
            <motion.p
              initial={{ filter: "blur(10px)", opacity: 0 }}
              whileInView={{ filter: "blur(0px)", opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="font-caveat text-3xl md:text-4xl text-slate-900"
            >
              is try to understand them in return.
            </motion.p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
