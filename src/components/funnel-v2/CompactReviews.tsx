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

function useAnimatedCounter(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration, start]);
  return count;
}

// Best reviews from the live site — curated for variety and emotional impact
const CURATED_REVIEWS = [
  {
    name: "Ava P.",
    pet: "Butterbean, Corgi, 2",
    breed: "corgi",
    text: "SoulSpeak alone is worth the price. I asked Butterbean what she thinks about the cat and the response was pure comedy gold.",
    tag: "verified",
    time: "3 days ago",
  },
  {
    name: "Tom H.",
    pet: "Bear, German Shepherd, 5",
    breed: "german-shepherd",
    text: "The compatibility chart between me and Bear made my wife cry. It knew things we never told it.",
    tag: "verified",
    time: "3 days ago",
  },
  {
    name: "Brooke T.",
    pet: "Theo, Golden Retriever, 3",
    breed: "golden-retriever",
    text: "I asked Theo why he steals socks and the answer was 'because they smell like you and that makes me feel safe.' DESTROYED.",
    tag: "verified",
    time: "4 days ago",
  },
  {
    name: "Lisa K.",
    pet: "Cooper, Border Collie, 2",
    breed: "border-collie",
    text: "The cosmic profile was so specific to Cooper. It mentioned his herding behaviour before I even said anything.",
    tag: "verified",
    time: "4 days ago",
  },
  {
    name: "Rachel S.",
    pet: "Daisy, Cavalier King Charles, 3",
    breed: "cavalier-kcs",
    text: "How did it know she sits by the door 20 minutes before I get home? The emotional blueprint was scarily accurate.",
    tag: "verified",
    time: "5 days ago",
  },
  {
    name: "James Wilson",
    pet: "Biscuit the Holland Lop",
    breed: "holland-lop",
    text: "It said he's a grounded earth soul which is why he hates being held. We stopped forcing cuddles and he actually comes to us on his own now.",
    tag: "verified",
    time: "2 weeks ago",
  },
  {
    name: "Steve L.",
    pet: "Hank, Bulldog, 5",
    breed: "bulldog",
    text: "My wife bought this and I rolled my eyes. Then I read it. Then I tried SoulSpeak. Then I ordered one for my mom's dog.",
    time: "2 weeks ago",
  },
  {
    name: "Sam N.",
    pet: "Nugget, Guinea Pig, 2",
    breed: "guinea-pig",
    text: "A full soul reading for a guinea pig! And the cosmic portrait was the cutest thing I've ever seen.",
    tag: "verified",
    time: "1 week ago",
  },
];

export const CompactReviews = () => {
  const { ref, visible } = useScrollReveal(0.1);
  const isMobile = useIsMobile();
  const counter = useAnimatedCounter(12847, 2500, visible);
  const [expanded, setExpanded] = useState(false);

  // Mobile: show 4 by default to limit scroll fatigue; desktop shows all.
  const visibleReviews =
    isMobile && !expanded ? CURATED_REVIEWS.slice(0, 4) : CURATED_REVIEWS;

  return (
    <section
      ref={ref}
      className="relative py-12 sm:py-16 md:py-20 px-5 overflow-hidden"
      style={{
        background: "linear-gradient(to bottom, var(--cream, #FFFDF5), var(--cream2, #faf4e8))",
      }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Live counter */}
        <div
          className="text-center mb-4 transition-all duration-1000"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(15px)" }}
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
            style={{ background: "rgba(74,140,92,0.06)", border: "1px solid rgba(74,140,92,0.12)" }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--green,#4a8c5c)] opacity-50" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--green,#4a8c5c)]" />
            </span>
            <span style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.85rem", fontWeight: 600, color: "var(--earth, #6e6259)" }}>
              <strong style={{ color: "var(--ink, #1f1c18)" }}>{counter.toLocaleString()}</strong> readings created
            </span>
          </div>
        </div>

        {/* Header */}
        <div
          className="text-center mb-10 transition-all duration-1000"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transitionDelay: "0.1s" }}
        >
          <h2
            style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: "clamp(1.4rem, 5vw, 2rem)",
              fontWeight: 400,
              color: "var(--black, #141210)",
              lineHeight: 1.2,
              marginBottom: 8,
            }}
          >
            12,000+ Pet Parents.
            <br />
            <span style={{ color: "var(--rose, #bf524a)" }}>Under 1% Asked for a Refund.</span>
          </h2>
          <div className="flex items-center justify-center gap-2">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} className="w-4 h-4 text-[var(--gold,#c4a265)]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.9rem", color: "var(--muted, #958779)" }}>
              Rated <strong style={{ color: "var(--ink, #1f1c18)" }}>4.9</strong> across all readings
            </span>
          </div>
        </div>

        {/* Review grid */}
        <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-2"} gap-3`}>
          {visibleReviews.map((review, i) => (
            <div
              key={i}
              className="rounded-xl p-4 transition-all duration-[1000ms] ease-out"
              style={{
                background: "#fff",
                border: "1px solid rgba(0,0,0,0.05)",
                boxShadow: "0 1px 8px rgba(0,0,0,0.03)",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(15px)",
                transitionDelay: `${0.15 + i * 0.06}s`,
              }}
            >
              {/* Header: breed photo + name + badge */}
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
                    {review.tag && (
                      <span
                        className="px-1.5 py-0.5 rounded text-white"
                        style={{ fontSize: "0.55rem", fontWeight: 700, background: "var(--green, #4a8c5c)" }}
                      >
                        {review.tag.toUpperCase()}
                      </span>
                    )}
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

              {/* Review text */}
              <p
                style={{
                  fontFamily: "Cormorant, Georgia, serif",
                  fontStyle: "italic",
                  fontSize: "0.88rem",
                  color: "var(--earth, #6e6259)",
                  lineHeight: 1.5,
                  marginBottom: 4,
                }}
              >
                "{review.text}"
              </p>
              <p style={{ fontSize: "0.68rem", color: "var(--faded, #bfb2a3)" }}>{review.time}</p>
            </div>
          ))}
        </div>

        {/* Mobile expand button */}
        {isMobile && !expanded && CURATED_REVIEWS.length > visibleReviews.length && (
          <div className="text-center mt-5">
            <button
              onClick={() => setExpanded(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full transition-opacity hover:opacity-80"
              style={{
                fontFamily: "Cormorant, Georgia, serif",
                fontSize: "0.88rem",
                fontWeight: 600,
                color: "var(--rose, #bf524a)",
                background: "rgba(191,82,74,0.06)",
                border: "1px solid rgba(191,82,74,0.18)",
              }}
            >
              Read {CURATED_REVIEWS.length - visibleReviews.length} more reviews
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
