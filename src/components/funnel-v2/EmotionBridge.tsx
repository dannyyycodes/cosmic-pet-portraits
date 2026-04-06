import { useEffect, useRef, useState } from "react";

function useScrollReveal(threshold = 0.3) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

export const EmotionBridge = () => {
  const { ref, visible } = useScrollReveal(0.2);

  return (
    <section
      ref={ref}
      className="relative py-20 md:py-28 px-5 overflow-hidden"
      style={{
        background: "linear-gradient(to bottom, var(--cream, #FFFDF5), var(--cream2, #faf4e8), var(--cream, #FFFDF5))",
      }}
    >
      <div className="max-w-[620px] mx-auto text-center">
        {/* Opening line */}
        <h2
          className="transition-all duration-[1200ms] ease-out"
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: "clamp(1.5rem, 8vw, 3rem)",
            fontWeight: 400,
            color: "var(--black, #141210)",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            marginBottom: 24,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(30px)",
          }}
        >
          They're Not "Just a Pet."
        </h2>

        {/* Body text */}
        <p
          className="transition-all duration-[1200ms] ease-out"
          style={{
            fontFamily: "Cormorant, Georgia, serif",
            fontWeight: 400,
            fontSize: "clamp(1.1rem, 4vw, 1.35rem)",
            color: "var(--earth, #6e6259)",
            lineHeight: 1.85,
            marginBottom: 32,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(25px)",
            transitionDelay: "0.15s",
          }}
        >
          They are a living, feeling soul — with their own personality, their own emotional world,
          and a bond with you that runs deeper than words.
        </p>

        {/* Gold divider */}
        <div
          className="mx-auto transition-all duration-1000"
          style={{
            width: visible ? 60 : 0,
            height: 2,
            background: "var(--gold, #c4a265)",
            opacity: 0.5,
            transitionDelay: "0.3s",
            marginBottom: 32,
          }}
        />

        {/* Emotional close — the bridge to product */}
        <p
          className="transition-all duration-[1200ms] ease-out"
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: "italic",
            fontSize: "clamp(1.2rem, 5vw, 1.8rem)",
            color: "var(--deep, #2e2a24)",
            lineHeight: 1.35,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "0.4s",
          }}
        >
          What if you could truly
          <br />
          understand them?
        </p>

        {/* Heart drawing */}
        <svg
          viewBox="0 0 100 100"
          className="w-12 h-12 md:w-16 md:h-16 mt-6 mx-auto"
        >
          <path
            d="M49.998,90.544c0,0,0,0,0.002,0c5.304-14.531,32.88-27.047,41.474-44.23C108.081,13.092,61.244-5.023,50,23.933C38.753-5.023-8.083,13.092,8.525,46.313C17.116,63.497,44.691,76.013,49.998,90.544z"
            fill="none"
            stroke="var(--rose, #bf524a)"
            strokeOpacity={0.6}
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={visible ? 0 : 1}
            style={{ transition: "stroke-dashoffset 2s ease 0.6s" }}
          />
        </svg>
      </div>
    </section>
  );
};
