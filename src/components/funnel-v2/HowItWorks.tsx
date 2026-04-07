import { useEffect, useRef, useState } from "react";

function useScrollReveal(threshold = 0.2) {
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

const STEPS = [
  {
    num: "1",
    title: "Tell Us About Them",
    desc: "Their name, birthday, and species. Takes 60 seconds.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    num: "2",
    title: "We Calculate Their Chart",
    desc: "Real planetary positions at the moment they were born.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
  },
  {
    num: "3",
    title: "Watch It Unfold",
    desc: "Your pet's soul is revealed in a private cinematic ceremony.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
  },
];

export const HowItWorks = () => {
  const { ref, visible } = useScrollReveal(0.2);

  return (
    <section
      ref={ref}
      className="py-14 md:py-18 px-5"
      style={{ background: "var(--cream, #FFFDF5)" }}
    >
      <div className="max-w-2xl mx-auto">
        <h2
          className="text-center mb-10 transition-all duration-[1200ms] ease-out"
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: "clamp(1.3rem, 5vw, 1.8rem)",
            fontWeight: 400,
            color: "var(--black, #141210)",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "0.1s",
          }}
        >
          How It Works
        </h2>

        <div className="grid grid-cols-3 gap-4 md:gap-8">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className="text-center transition-all duration-[1000ms] ease-out"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(20px)",
                transitionDelay: `${0.15 + i * 0.12}s`,
              }}
            >
              {/* Icon circle */}
              <div
                className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, var(--cream2, #faf4e8), var(--cream3, #f3eadb))",
                  color: "var(--rose, #bf524a)",
                }}
              >
                {step.icon}
              </div>

              {/* Step number */}
              <span
                className="inline-block mb-1"
                style={{
                  fontFamily: "Caveat, cursive",
                  fontSize: "0.75rem",
                  color: "var(--rose, #bf524a)",
                  fontWeight: 600,
                }}
              >
                Step {step.num}
              </span>

              {/* Title */}
              <h3
                style={{
                  fontFamily: '"DM Serif Display", Georgia, serif',
                  fontSize: "clamp(0.85rem, 3vw, 1rem)",
                  color: "var(--ink, #1f1c18)",
                  marginBottom: 4,
                }}
              >
                {step.title}
              </h3>

              {/* Description */}
              <p
                style={{
                  fontFamily: "Cormorant, Georgia, serif",
                  fontSize: "clamp(0.78rem, 2.5vw, 0.88rem)",
                  color: "var(--muted, #958779)",
                  lineHeight: 1.45,
                }}
              >
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Connecting dots between steps (desktop) */}
        <div className="hidden md:flex justify-center items-center gap-0 -mt-[88px] mb-[88px] pointer-events-none" style={{ position: "relative", zIndex: 0 }}>
          <div className="w-[30%]" />
          <div style={{ width: 60, height: 2, background: "var(--cream3, #f3eadb)" }} />
          <div className="w-[12%]" />
          <div style={{ width: 60, height: 2, background: "var(--cream3, #f3eadb)" }} />
          <div className="w-[30%]" />
        </div>
      </div>
    </section>
  );
};
