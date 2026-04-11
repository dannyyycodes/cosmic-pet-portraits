import { useEffect, useRef, useState } from "react";

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

// Reviews use <b>…</b> around the punchy power phrase so skimmers
// reading only the bold bits still catch the emotional hit.
const ROW_1 = [
  {
    name: "Ava P.",
    pet: "Butterbean, Corgi",
    breed: "corgi",
    text: "SoulSpeak alone is worth the price. I asked Butterbean what she thinks about the cat and <b>the response was pure comedy gold</b>.",
  },
  {
    name: "Tom H.",
    pet: "Bear, German Shepherd",
    breed: "german-shepherd",
    text: "The compatibility chart between me and Bear <b>made my wife cry</b>. It knew things we never told it.",
  },
  {
    name: "Brooke T.",
    pet: "Theo, Golden Retriever",
    breed: "golden-retriever",
    text: "I asked Theo why he steals socks and the answer was <b>'because they smell like you and that makes me feel safe.'</b> DESTROYED.",
  },
  {
    name: "Lisa K.",
    pet: "Cooper, Border Collie",
    breed: "border-collie",
    text: "The cosmic profile was so specific to Cooper. <b>It mentioned his herding behaviour before I even said anything.</b>",
  },
];

const ROW_2 = [
  {
    name: "Rachel S.",
    pet: "Daisy, Cavalier King Charles",
    breed: "cavalier-kcs",
    text: "How did it know she sits by the door 20 minutes before I get home? <b>The emotional blueprint was scarily accurate.</b>",
  },
  {
    name: "James Wilson",
    pet: "Biscuit, Holland Lop",
    breed: "holland-lop",
    text: "It said he's a grounded earth soul which is why he hates being held. We stopped forcing cuddles and <b>he actually comes to us on his own now</b>.",
  },
  {
    name: "Steve L.",
    pet: "Hank, Bulldog",
    breed: "bulldog",
    text: "My wife bought this and I rolled my eyes. Then I read it. Then I tried SoulSpeak. <b>Then I ordered one for my mom's dog.</b>",
  },
  {
    name: "Sam N.",
    pet: "Nugget, Guinea Pig",
    breed: "guinea-pig",
    text: "A full soul reading for a guinea pig! And <b>the cosmic portrait was the cutest thing I've ever seen</b>.",
  },
];

type Review = { name: string; pet: string; breed: string; text: string };

const ReviewCard = ({ review }: { review: Review }) => (
  <div
    className="review-marquee-card flex-shrink-0 rounded-xl p-4"
    style={{
      width: 320,
      background: "#fff",
      border: "1px solid rgba(0,0,0,0.05)",
      boxShadow: "0 1px 8px rgba(0,0,0,0.03)",
    }}
  >
    <div className="flex items-center gap-2.5 mb-2.5">
      <img
        src={`/breeds/${review.breed}-1.jpg`}
        alt=""
        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
        style={{ border: "2px solid var(--cream3, #f3eadb)" }}
        onError={(e) => {
          const el = e.currentTarget;
          el.style.display = "none";
          const fallback = el.nextElementSibling as HTMLElement;
          if (fallback) fallback.style.display = "flex";
        }}
      />
      <div
        className="w-9 h-9 rounded-full items-center justify-center flex-shrink-0 hidden"
        style={{
          background: "linear-gradient(135deg, var(--cream3, #f3eadb), var(--sand, #d6c8b6))",
          fontFamily: "Caveat, cursive",
          fontSize: "0.9rem",
          color: "var(--earth, #6e6259)",
        }}
      >
        {review.name.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span style={{ fontWeight: 600, fontSize: "0.82rem", color: "var(--ink, #1f1c18)" }}>
            {review.name}
          </span>
          <span
            className="px-1.5 py-0.5 rounded text-white"
            style={{ fontSize: "0.55rem", fontWeight: 700, background: "var(--green, #4a8c5c)" }}
          >
            VERIFIED
          </span>
        </div>
        <p style={{ fontSize: "0.72rem", color: "var(--muted, #958779)" }}>{review.pet}</p>
      </div>
      <div className="flex gap-0.5 flex-shrink-0">
        {[1, 2, 3, 4, 5].map((s) => (
          <svg key={s} className="w-3 h-3 text-[var(--gold,#c4a265)]" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    </div>
    <p
      className="review-marquee-body"
      style={{
        fontFamily: "Cormorant, Georgia, serif",
        fontStyle: "italic",
        fontSize: "0.92rem",
        color: "var(--earth, #6e6259)",
        lineHeight: 1.55,
      }}
      dangerouslySetInnerHTML={{ __html: `&ldquo;${review.text}&rdquo;` }}
    />
  </div>
);

const MarqueeRow = ({
  reviews,
  direction = "left",
  speed = 40,
}: {
  reviews: Review[];
  direction?: "left" | "right";
  speed?: number;
}) => (
  <div
    className="marquee-row flex overflow-hidden w-full"
    style={{
      ["--marquee-duration" as string]: `${speed}s`,
      ["--marquee-direction" as string]: direction === "left" ? "normal" : "reverse",
    }}
  >
    <div className="marquee-track flex gap-5" style={{ width: "max-content" }}>
      {/* Two copies for seamless infinite scroll */}
      {reviews.map((r, i) => (
        <ReviewCard key={`a-${i}`} review={r} />
      ))}
      {reviews.map((r, i) => (
        <ReviewCard key={`b-${i}`} review={r} />
      ))}
    </div>
  </div>
);

export const CompactReviews = () => {
  const { ref, visible } = useScrollReveal(0.1);

  return (
    <section
      ref={ref}
      className="relative py-12 sm:py-16 md:py-20 px-0 overflow-hidden"
      style={{
        background: "linear-gradient(to bottom, var(--cream, #FFFDF5), var(--cream2, #faf4e8))",
      }}
    >
      {/* Header */}
      <div className="max-w-3xl mx-auto px-5">
        {/* Badge */}
        <div
          className="text-center mb-6 transition-all duration-1000"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(15px)" }}
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
            style={{ background: "rgba(196,162,101,0.08)", border: "1px solid rgba(196,162,101,0.18)" }}
          >
            <span style={{ fontSize: "0.85rem" }}>&#9733;&#9733;&#9733;&#9733;&#9733;</span>
            <span style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.85rem", fontWeight: 600, color: "var(--earth, #6e6259)" }}>
              Rated <strong style={{ color: "var(--ink, #1f1c18)" }}>4.9/5</strong> by pet parents
            </span>
          </div>
        </div>

        {/* Stats band */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-0 mb-10 md:mb-12 transition-all duration-[1200ms] ease-out"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "0.18s",
          }}
        >
          {[
            { value: "30+", label: "Soul Sections" },
            { value: "4.9", label: "Average Rating", sup: "\u2605" },
            { value: "100%", label: "Money-Back Guarantee" },
            { value: "~3min", label: "To Begin" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="text-center px-2 md:px-4"
              style={{
                borderRight:
                  i < 3 && typeof window !== "undefined" && window.innerWidth >= 768
                    ? "1px solid rgba(196,162,101,0.25)"
                    : "none",
              }}
            >
              <p
                style={{
                  fontFamily: '"DM Serif Display", Georgia, serif',
                  fontSize: "clamp(1.9rem, 6.5vw, 2.8rem)",
                  fontWeight: 400,
                  color: "var(--black, #141210)",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  marginBottom: 6,
                }}
              >
                {stat.value}
                {stat.sup && (
                  <span
                    style={{
                      fontSize: "0.5em",
                      color: "var(--gold, #c4a265)",
                      marginLeft: 3,
                      verticalAlign: "super",
                    }}
                  >
                    {stat.sup}
                  </span>
                )}
              </p>
              <p
                style={{
                  fontFamily: "Cormorant, Georgia, serif",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--muted, #958779)",
                }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Section title */}
        <div
          className="text-center mb-10 transition-all duration-1000"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transitionDelay: "0.1s" }}
        >
          <h2
            style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: "clamp(1.5rem, 5.5vw, 2.1rem)",
              fontWeight: 400,
              color: "var(--black, #141210)",
              lineHeight: 1.15,
              marginBottom: 10,
              letterSpacing: "-0.02em",
            }}
          >
            What Pet Parents Are Saying.
            <br />
            <em style={{ color: "var(--rose, #bf524a)" }}>In Their Own Words.</em>
          </h2>
        </div>
      </div>

      {/* Double-layered marquee */}
      <div
        className="marquee-container flex flex-col gap-5 transition-all duration-[1400ms]"
        style={{
          opacity: visible ? 1 : 0,
          transitionDelay: "0.3s",
        }}
      >
        <MarqueeRow reviews={ROW_1} direction="left" speed={38} />
        <MarqueeRow reviews={ROW_2} direction="right" speed={44} />
      </div>

      <style>{`
        .review-marquee-body b {
          font-weight: 600;
          font-style: italic;
          color: var(--ink, #1f1c18);
        }

        .marquee-container {
          -webkit-mask-image: linear-gradient(
            to right,
            transparent 0%,
            black 6%,
            black 94%,
            transparent 100%
          );
          mask-image: linear-gradient(
            to right,
            transparent 0%,
            black 6%,
            black 94%,
            transparent 100%
          );
        }

        .marquee-track {
          will-change: transform;
          animation-name: marqueeScroll;
          animation-duration: var(--marquee-duration, 40s);
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          animation-direction: var(--marquee-direction, normal);
        }

        .marquee-row:hover .marquee-track {
          animation-play-state: paused;
        }

        @keyframes marqueeScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @media (max-width: 768px) {
          .review-marquee-card {
            width: 275px !important;
          }
          .marquee-container {
            gap: 16px;
            -webkit-mask-image: linear-gradient(
              to right,
              transparent 0%,
              black 3%,
              black 97%,
              transparent 100%
            );
            mask-image: linear-gradient(
              to right,
              transparent 0%,
              black 3%,
              black 97%,
              transparent 100%
            );
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .marquee-track {
            animation-play-state: paused;
          }
        }
      `}</style>
    </section>
  );
};
