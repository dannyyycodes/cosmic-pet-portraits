import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold, rootMargin: "0px 0px -30px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

const CURATED_REVIEWS = [
  {
    name: "Sarah M.",
    pet: "Buddy the Labrador",
    text: "It described things about Buddy that I've never been able to put into words. My partner and I both teared up reading it together.",
    initial: "S",
  },
  {
    name: "James T.",
    pet: "Luna the Golden Retriever",
    text: "Bought it as a joke honestly. Then I read it and got genuinely emotional. The emotional blueprint nailed Luna's personality.",
    initial: "J",
  },
  {
    name: "Mark D.",
    pet: "Charlie the Beagle",
    text: "Best gift I've ever given my wife. She read it three times and kept reading quotes out loud to me.",
    initial: "M",
  },
  {
    name: "Emily R.",
    pet: "Mochi the Persian",
    text: "This is the most personal thing I've ever bought online. It perfectly captured who Mochi is — every quirk, every comfort habit.",
    initial: "E",
  },
  {
    name: "Sophie L.",
    pet: "Bella the Cavalier",
    text: "I cried at the 'what your pet wants you to know' section. It felt like Bella was speaking directly to me.",
    initial: "S",
  },
  {
    name: "Anna K.",
    pet: "Oliver the Tabby Cat",
    text: "Ordered for three of my pets. Each one was completely unique and spot-on accurate. Worth every penny.",
    initial: "A",
  },
];

export const CompactReviews = () => {
  const { ref, visible } = useScrollReveal(0.1);
  const isMobile = useIsMobile();

  return (
    <section
      ref={ref}
      className="relative py-16 md:py-20 px-5 overflow-hidden"
      style={{
        background: "linear-gradient(to bottom, var(--cream, #FFFDF5), var(--cream2, #faf4e8))",
      }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div
          className="text-center mb-10 transition-all duration-1000"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
          }}
        >
          <p
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontWeight: 600,
              fontSize: "0.78rem",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "var(--earth, #6e6259)",
              marginBottom: 8,
            }}
          >
            Loved by Pet Parents
          </p>
          <h2
            style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: "clamp(1.4rem, 5vw, 2rem)",
              fontWeight: 400,
              color: "var(--black, #141210)",
              marginBottom: 8,
            }}
          >
            "It's Like They Wrote It Themselves"
          </h2>
          <div className="flex items-center justify-center gap-2">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} className="w-4 h-4 text-[var(--gold,#c4a265)]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span
              style={{
                fontFamily: "Cormorant, Georgia, serif",
                fontSize: "0.9rem",
                color: "var(--muted, #958779)",
              }}
            >
              <strong style={{ color: "var(--ink, #1f1c18)" }}>4.9</strong> from 2,400+ reviews
            </span>
          </div>
        </div>

        {/* Review grid */}
        <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-2"} gap-3`}>
          {CURATED_REVIEWS.map((review, i) => (
            <div
              key={i}
              className="rounded-xl p-4 transition-all duration-[1000ms] ease-out"
              style={{
                background: "#fff",
                border: "1px solid rgba(0,0,0,0.05)",
                boxShadow: "0 1px 8px rgba(0,0,0,0.03)",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(15px)",
                transitionDelay: `${0.1 + i * 0.07}s`,
              }}
            >
              {/* Header: avatar + name + stars */}
              <div className="flex items-center gap-2.5 mb-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, var(--cream3, #f3eadb), var(--sand, #d6c8b6))",
                    fontFamily: "Caveat, cursive",
                    fontSize: "0.9rem",
                    color: "var(--earth, #6e6259)",
                  }}
                >
                  {review.initial}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: "0.82rem",
                        color: "var(--ink, #1f1c18)",
                      }}
                    >
                      {review.name}
                    </span>
                    <span
                      className="px-1.5 py-0.5 rounded text-white"
                      style={{
                        fontSize: "0.55rem",
                        fontWeight: 700,
                        background: "var(--green, #4a8c5c)",
                      }}
                    >
                      verified
                    </span>
                  </div>
                  <p style={{ fontSize: "0.72rem", color: "var(--muted, #958779)" }}>
                    {review.pet}
                  </p>
                </div>
                {/* Stars */}
                <div className="flex gap-0.5 flex-shrink-0">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg key={s} className="w-3 h-3 text-[var(--gold,#c4a265)]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>

              {/* Review text */}
              <p
                style={{
                  fontFamily: "Cormorant, Georgia, serif",
                  fontStyle: "italic",
                  fontSize: "0.88rem",
                  color: "var(--earth, #6e6259)",
                  lineHeight: 1.5,
                }}
              >
                "{review.text}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
