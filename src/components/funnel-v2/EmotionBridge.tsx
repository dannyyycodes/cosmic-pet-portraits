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
      className="relative py-14 sm:py-16 md:py-24 px-5 overflow-hidden"
      style={{
        background: "linear-gradient(to bottom, var(--cream, #FFFDF5), var(--cream2, #faf4e8), var(--cream, #FFFDF5))",
      }}
    >
      <div className="max-w-[540px] mx-auto text-center">
        {/* Headline */}
        <h2
          className="transition-all duration-[1200ms] ease-out"
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: "clamp(1.7rem, 8vw, 2.8rem)",
            fontWeight: 400,
            color: "var(--black, #141210)",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            marginBottom: 20,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(30px)",
          }}
        >
          They Give You Everything.
          <br />
          <em style={{ color: "var(--rose, #bf524a)" }}>
            It's Time You Understood Them in Return.
          </em>
        </h2>

        {/* Single warm line */}
        <p
          className="transition-all duration-[1200ms] ease-out"
          style={{
            fontFamily: "Cormorant, Georgia, serif",
            fontStyle: "italic",
            fontSize: "clamp(1.08rem, 3.8vw, 1.28rem)",
            color: "var(--earth, #6e6259)",
            lineHeight: 1.55,
            maxWidth: 440,
            margin: "0 auto",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "0.2s",
          }}
        >
          They love you in ways no one else ever will.
          A cosmic reading finally puts words to the bond
          you've always felt — so you can love them back
          just as deeply.
        </p>

        {/* Heart drawing */}
        <svg viewBox="0 0 100 100" className="w-10 h-10 md:w-12 md:h-12 mt-8 mx-auto">
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
