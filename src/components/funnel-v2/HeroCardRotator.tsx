import { useRef, useState } from "react";

type HeroCard = { eyebrow: string; headline: string; sub: string };

// Ordered as a narrative journey: universal hook → curiosity → confirmation →
// empathy → urgency → devotion → reciprocity → credibility closer.
const HERO_CARDS: HeroCard[] = [
  {
    eyebrow: "After every walk, every stare, every quiet sigh",
    headline: "You know their habits. Do you know their soul?",
    sub: "You've memorised every look. There's a whole story behind the eyes you thought you'd read.",
  },
  {
    eyebrow: "The habits no one else understands",
    headline: "Every strange thing they do has a reason.",
    sub: "The 3am zoomies. The one person they won't leave. The toy they guard. It isn't random. It's written.",
  },
  {
    eyebrow: "You watch them more than you watch TV",
    headline: "You've been studying them for years. Here's the cheat sheet.",
    sub: "Every tilt of the head, every ritual, every quirk — decoded the way only their own sky can.",
  },
  {
    eyebrow: "You've always felt it",
    headline: "Something told you this one was different. Something was right.",
    sub: "The bond you can't explain to anyone else — this is the part that explains it.",
  },
  {
    eyebrow: "For the ones with a past you'll never know",
    headline: "They came to you with a story. Read it.",
    sub: "Rescue, stray, surrender — their chart remembers what their history can't tell you.",
  },
  {
    eyebrow: "For the one who flinches, hides, or clings",
    headline: "Their fear has a shape. And a map out.",
    sub: "Understand what shaped them, what soothes them, and how their soul learned to love anyway.",
  },
  {
    eyebrow: "Same house, different worlds",
    headline: "Why one is clingy and the other disappears for days.",
    sub: "Two pets, two charts, two entirely different souls sharing your sofa. See each of them, clearly.",
  },
  {
    eyebrow: "Week one, or week five hundred",
    headline: "Skip the years of guessing. Meet who they actually are.",
    sub: "The personality. The triggers. The love language. All of it — from day one.",
  },
  {
    eyebrow: "For the soul who won't be here forever",
    headline: "Capture who they are, before time does.",
    sub: "A record of the soul you've shared your life with. Theirs to be understood. Yours to keep.",
  },
  {
    eyebrow: "Honour the one who got you through",
    headline: "They held you up. It's your turn.",
    sub: "A portrait of the soul that's been carrying yours. Not what they do for you — who they are.",
  },
  {
    eyebrow: "They give us everything",
    headline: "It's time we understood them in return.",
    sub: "The one relationship in your life that's asked nothing back. This is how you give something back.",
  },
  {
    eyebrow: "Not your usual horoscope",
    headline: "Not a guess. Their exact sky, on their exact day.",
    sub: "Built from real astronomical data for their birth moment, translated into who they are today.",
  },
];

interface HeroCardRotatorProps {
  onFinishClick?: () => void;
}

export const HeroCardRotator = ({ onFinishClick }: HeroCardRotatorProps) => {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const touchStartX = useRef<number | null>(null);

  const go = (dir: 1 | -1) => {
    setDirection(dir);
    setIndex((i) => {
      const next = i + dir;
      if (next < 0) return 0;
      if (next >= HERO_CARDS.length) return HERO_CARDS.length - 1;
      return next;
    });
  };

  const goTo = (i: number) => {
    setDirection(i > index ? 1 : -1);
    setIndex(i);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  const card = HERO_CARDS[index];
  const total = HERO_CARDS.length;
  const isLast = index === total - 1;
  const isFirst = index === 0;

  const handleNext = () => {
    if (isLast && onFinishClick) {
      onFinishClick();
      return;
    }
    go(1);
  };

  return (
    <div
      role="region"
      aria-label="Your pet's story — twelve angles"
      aria-roledescription="carousel"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="hero-journey relative outline-none select-none overflow-hidden"
      style={{
        background: "linear-gradient(180deg, rgba(255,253,245,0.96) 0%, rgba(250,244,232,0.94) 100%)",
        border: "1px solid rgba(196, 162, 101, 0.28)",
        borderRadius: 24,
        padding: "clamp(30px, 5.5vw, 46px) clamp(22px, 5vw, 44px) clamp(24px, 4.5vw, 36px)",
        boxShadow: "0 12px 48px rgba(31, 28, 24, 0.08), inset 0 1px 0 rgba(255,255,255,0.7)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      {/* Inner starfield */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid slice"
      >
        {[
          [50, 70, 1.2], [120, 40, 0.9], [280, 60, 1.1], [350, 100, 1],
          [30, 200, 1], [370, 220, 1.2], [180, 340, 0.9], [320, 360, 1.1],
          [90, 320, 1], [250, 120, 0.8], [70, 380, 0.9], [220, 50, 1],
          [150, 180, 0.8], [300, 250, 0.9], [200, 280, 0.7],
        ].map(([cx, cy, r], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="var(--gold, #c4a265)"
            opacity={0.35}
            style={{
              animation: `heroStarPulse ${3.5 + (i % 3) * 0.7}s ease-in-out ${i * 0.3}s infinite`,
            }}
          />
        ))}
      </svg>

      {/* Progress row */}
      <div className="relative flex flex-col items-center gap-3 mb-6">
        <div
          className="flex items-center justify-center flex-wrap gap-1.5"
          role="tablist"
          aria-label="Chapter navigation"
        >
          {HERO_CARDS.map((_, i) => {
            const state: "past" | "active" | "future" =
              i < index ? "past" : i === index ? "active" : "future";
            return (
              <button
                key={i}
                role="tab"
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to chapter ${i + 1} of ${total}`}
                aria-selected={state === "active"}
                style={{
                  width: state === "active" ? 22 : 6,
                  height: 6,
                  borderRadius: 9999,
                  background:
                    state === "active"
                      ? "var(--rose, #bf524a)"
                      : state === "past"
                      ? "rgba(196, 162, 101, 0.8)"
                      : "rgba(196, 162, 101, 0.28)",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  transition: "width 360ms cubic-bezier(0.22,1,0.36,1), background 360ms ease",
                  boxShadow: state === "active" ? "0 0 10px rgba(191,82,74,0.45)" : "none",
                }}
              />
            );
          })}
        </div>
        <div
          style={{
            fontFamily: '"Lato", system-ui, sans-serif',
            fontSize: "0.7rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--muted, #958779)",
            opacity: 0.85,
          }}
        >
          Chapter {index + 1} of {total}
        </div>
      </div>

      {/* Card content — slide/fade per direction */}
      <div
        className="relative mx-auto"
        style={{ minHeight: "clamp(240px, 36vw, 280px)" }}
      >
        <div
          key={index}
          aria-live="polite"
          className={direction === 1 ? "hero-slide-in-right" : "hero-slide-in-left"}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.9rem",
            padding: "0 0.25rem",
            textAlign: "center",
          }}
        >
          {/* Eyebrow with star markers */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              fontFamily: '"Cormorant", Georgia, serif',
              fontStyle: "italic",
              fontSize: "clamp(0.94rem, 2.3vw, 1.08rem)",
              letterSpacing: "0.04em",
              color: "var(--gold, #c4a265)",
              opacity: 0.95,
              maxWidth: "32rem",
              lineHeight: 1.3,
            }}
          >
            <span style={{ opacity: 0.8, fontSize: "0.85em" }}>✦</span>
            <span>{card.eyebrow}</span>
            <span style={{ opacity: 0.8, fontSize: "0.85em" }}>✦</span>
          </div>

          {/* Headline */}
          <h2
            style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: "clamp(1.65rem, 6.2vw, 2.35rem)",
              fontWeight: 400,
              fontStyle: "italic",
              color: "var(--black, #141210)",
              lineHeight: 1.12,
              letterSpacing: "-0.015em",
              margin: 0,
              maxWidth: "32rem",
            }}
          >
            {card.headline}
          </h2>

          {/* Sub */}
          <p
            style={{
              fontFamily: '"Cormorant", Georgia, serif',
              fontSize: "clamp(1.05rem, 2.6vw, 1.22rem)",
              fontWeight: 400,
              color: "var(--warm, #5a4a42)",
              lineHeight: 1.55,
              margin: 0,
              maxWidth: "30rem",
            }}
          >
            {card.sub}
          </p>
        </div>
      </div>

      {/* Nav row */}
      <div className="relative flex items-center justify-between gap-3 mt-7">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={isFirst}
          aria-label="Previous chapter"
          style={{
            width: 44,
            height: 44,
            borderRadius: 9999,
            border: "1px solid rgba(196, 162, 101, 0.35)",
            background: "rgba(255, 253, 245, 0.7)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--earth, #6e6259)",
            cursor: isFirst ? "default" : "pointer",
            opacity: isFirst ? 0.3 : 1,
            transition: "opacity 220ms ease, background 220ms ease, transform 220ms ease",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { if (!isFirst) e.currentTarget.style.background = "rgba(255,253,245,0.95)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,253,245,0.7)"; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <button
          type="button"
          onClick={handleNext}
          style={{
            flex: 1,
            maxWidth: 340,
            height: 50,
            borderRadius: 9999,
            border: "none",
            background: isLast ? "var(--rose, #bf524a)" : "var(--black, #141210)",
            color: "#FFFDF5",
            fontFamily: '"Lato", system-ui, sans-serif',
            fontSize: "0.95rem",
            fontWeight: 600,
            letterSpacing: "0.02em",
            cursor: "pointer",
            transition: "transform 200ms ease, background 200ms ease, box-shadow 200ms ease",
            boxShadow: isLast
              ? "0 10px 32px rgba(191,82,74,0.42)"
              : "0 8px 26px rgba(20,18,16,0.24)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          {isLast ? "Read their chart  →" : "Continue  →"}
        </button>

        <button
          type="button"
          onClick={() => go(1)}
          disabled={isLast}
          aria-label="Next chapter"
          style={{
            width: 44,
            height: 44,
            borderRadius: 9999,
            border: "1px solid rgba(196, 162, 101, 0.35)",
            background: "rgba(255, 253, 245, 0.7)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--earth, #6e6259)",
            cursor: isLast ? "default" : "pointer",
            opacity: isLast ? 0.3 : 1,
            transition: "opacity 220ms ease, background 220ms ease, transform 220ms ease",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { if (!isLast) e.currentTarget.style.background = "rgba(255,253,245,0.95)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,253,245,0.7)"; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <style>{`
        @keyframes heroStarPulse {
          0%, 100% { opacity: 0.22; }
          50%      { opacity: 0.62; }
        }
        @keyframes heroSlideInRight {
          from { opacity: 0; transform: translateX(22px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes heroSlideInLeft {
          from { opacity: 0; transform: translateX(-22px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .hero-slide-in-right { animation: heroSlideInRight 540ms cubic-bezier(0.22,1,0.36,1); }
        .hero-slide-in-left  { animation: heroSlideInLeft 540ms cubic-bezier(0.22,1,0.36,1); }
        @media (prefers-reduced-motion: reduce) {
          .hero-slide-in-right, .hero-slide-in-left { animation: none; }
        }
      `}</style>
    </div>
  );
};
