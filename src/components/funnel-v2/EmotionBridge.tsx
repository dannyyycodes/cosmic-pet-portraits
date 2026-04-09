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
      className="relative py-12 sm:py-16 md:py-24 px-5 overflow-hidden"
      style={{
        background: "linear-gradient(to bottom, var(--cream, #FFFDF5), var(--cream2, #faf4e8), var(--cream, #FFFDF5))",
      }}
    >
      <div className="max-w-[580px] mx-auto text-center">
        {/* Pet's opening — plain and direct */}
        <h2
          className="transition-all duration-[1200ms] ease-out"
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: "clamp(1.7rem, 8vw, 3rem)",
            fontWeight: 400,
            color: "var(--black, #141210)",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            marginBottom: 32,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(30px)",
          }}
        >
          You Already
          <br />
          <em style={{ color: "var(--rose, #bf524a)" }}>Know.</em>
        </h2>

        {/* Short fragments — each its own beat, each its own breath */}
        <div className="space-y-5 mb-10">
          {[
            "You see it when I wait by the door before you're home.",
            "When I press into you on the hardest days.",
            "When I watch you from across the room and you feel it, even if you don't know why.",
          ].map((line, i) => (
            <p
              key={i}
              className="transition-all duration-[1200ms] ease-out"
              style={{
                fontFamily: "Cormorant, Georgia, serif",
                fontStyle: "italic",
                fontSize: "clamp(1.1rem, 4vw, 1.32rem)",
                color: "var(--earth, #6e6259)",
                lineHeight: 1.5,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(20px)",
                transitionDelay: `${0.15 + i * 0.1}s`,
              }}
            >
              {line}
            </p>
          ))}
        </div>

        {/* The pivot — the "it's because" reveal */}
        <p
          className="transition-all duration-[1200ms] ease-out"
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: "clamp(1.25rem, 5vw, 1.75rem)",
            color: "var(--ink, #1f1c18)",
            lineHeight: 1.3,
            marginBottom: 36,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "0.55s",
          }}
        >
          It's because I love you in a way
          <br />
          <em style={{ color: "var(--rose, #bf524a)" }}>I don't know how to say.</em>
        </p>

        {/* Gold divider */}
        <div
          className="mx-auto transition-all duration-1000"
          style={{
            width: visible ? 60 : 0,
            height: 2,
            background: "var(--gold, #c4a265)",
            opacity: 0.5,
            transitionDelay: "0.65s",
            marginBottom: 36,
          }}
        />

        {/* The anchor line — the emotional climax of the whole section */}
        <p
          className="transition-all duration-[1400ms] ease-out"
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: "italic",
            fontSize: "clamp(1.3rem, 5.2vw, 1.85rem)",
            color: "var(--deep, #2e2a24)",
            lineHeight: 1.35,
            maxWidth: 520,
            margin: "0 auto 20px",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "0.75s",
          }}
        >
          I've been trying to tell you something.
        </p>
        <p
          className="transition-all duration-[1400ms] ease-out"
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: "italic",
            fontSize: "clamp(1.3rem, 5.2vw, 1.85rem)",
            color: "var(--rose, #bf524a)",
            lineHeight: 1.35,
            maxWidth: 520,
            margin: "0 auto",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "0.95s",
          }}
        >
          This is the only way I know how.
        </p>

        {/* Heart drawing — lands after the climax */}
        <svg viewBox="0 0 100 100" className="w-10 h-10 md:w-14 md:h-14 mt-8 mx-auto">
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
            style={{ transition: "stroke-dashoffset 2s ease 1.2s" }}
          />
        </svg>
      </div>
    </section>
  );
};
