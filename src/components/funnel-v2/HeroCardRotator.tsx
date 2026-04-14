import { useRef, useState } from "react";

type HeroCard = { eyebrow: string; headline: string; sub: string };

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

const FLIP_MS = 560;

interface HeroCardRotatorProps {
  onFinishClick?: () => void;
}

const pad2 = (n: number) => n.toString().padStart(2, "0");

const CardFace = ({
  card,
  chapterLabel,
  animateStars,
}: {
  card: HeroCard;
  chapterLabel: string;
  animateStars: boolean;
}) => (
  <div
    className="relative w-full h-full overflow-hidden"
    style={{
      background: "linear-gradient(180deg, rgba(255,253,245,0.97) 0%, rgba(250,244,232,0.95) 100%)",
      border: "1px solid rgba(196, 162, 101, 0.28)",
      borderRadius: 24,
      padding: "clamp(30px, 5.5vw, 46px) clamp(22px, 5vw, 44px)",
      boxShadow:
        "0 14px 46px rgba(31, 28, 24, 0.09), inset 0 1px 0 rgba(255,255,255,0.75)",
    }}
  >
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
          style={
            animateStars
              ? { animation: `heroStarPulse ${3.5 + (i % 3) * 0.7}s ease-in-out ${i * 0.3}s infinite` }
              : undefined
          }
        />
      ))}
    </svg>

    <div
      aria-hidden="true"
      className="absolute"
      style={{
        top: 14,
        right: 18,
        fontFamily: '"Lato", system-ui, sans-serif',
        fontSize: "0.68rem",
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: "var(--muted, #958779)",
        opacity: 0.7,
      }}
    >
      {chapterLabel}
    </div>

    <div
      className="relative h-full flex flex-col items-center justify-center gap-3 text-center"
      style={{ minHeight: "clamp(240px, 36vw, 280px)" }}
    >
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
);

const ArrowButton = ({
  direction,
  disabled,
  onClick,
}: {
  direction: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={direction === "left" ? "Previous card" : "Next card"}
    className="flex items-center justify-center shrink-0 relative z-20"
    style={{
      width: "clamp(40px, 6vw, 52px)",
      height: "clamp(40px, 6vw, 52px)",
      borderRadius: 9999,
      border: "1px solid rgba(196, 162, 101, 0.35)",
      background: "rgba(255, 253, 245, 0.85)",
      color: "var(--earth, #6e6259)",
      cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.3 : 1,
      transition: "background 220ms ease, transform 220ms ease, box-shadow 220ms ease, opacity 220ms ease",
      boxShadow: disabled ? "none" : "0 4px 14px rgba(31,28,24,0.06)",
    }}
    onMouseEnter={(e) => {
      if (disabled) return;
      e.currentTarget.style.background = "rgba(255,253,245,1)";
      e.currentTarget.style.transform = "translateY(-1px)";
      e.currentTarget.style.boxShadow = "0 8px 22px rgba(31,28,24,0.12)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "rgba(255,253,245,0.85)";
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = disabled ? "none" : "0 4px 14px rgba(31,28,24,0.06)";
    }}
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {direction === "left" ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
    </svg>
  </button>
);

// Compute transform for each card relative to the current top index.
// offset < 0  → already-dealt cards sitting off-screen to the right
// offset 0    → the top card (fully interactive)
// offset 1..3 → the visible stack, progressively smaller + nudged up
// offset > 3  → hidden in the deck (invisible, sits behind the stack)
const stackStyleFor = (offset: number): React.CSSProperties => {
  if (offset < 0) {
    const depth = Math.min(-offset, 3);
    return {
      transform: `translateX(${130 + depth * 6}%) translateY(${-8 * depth}px) rotate(${6 + depth * 2}deg) scale(${0.9 - depth * 0.02})`,
      opacity: 0,
      zIndex: 5 - depth,
      pointerEvents: "none",
    };
  }
  if (offset === 0) {
    return {
      transform: "translateX(0) translateY(0) rotate(0deg) scale(1)",
      opacity: 1,
      zIndex: 30,
    };
  }
  if (offset === 1) {
    return {
      transform: "translateX(0) translateY(-10px) rotate(-0.8deg) scale(0.965)",
      opacity: 0.82,
      zIndex: 29,
      pointerEvents: "none",
    };
  }
  if (offset === 2) {
    return {
      transform: "translateX(0) translateY(-20px) rotate(0.8deg) scale(0.93)",
      opacity: 0.55,
      zIndex: 28,
      pointerEvents: "none",
    };
  }
  if (offset === 3) {
    return {
      transform: "translateX(0) translateY(-30px) rotate(-0.6deg) scale(0.895)",
      opacity: 0.28,
      zIndex: 27,
      pointerEvents: "none",
    };
  }
  return {
    transform: "translateX(0) translateY(-36px) rotate(0deg) scale(0.88)",
    opacity: 0,
    zIndex: 10,
    pointerEvents: "none",
  };
};

export const HeroCardRotator = (_props: HeroCardRotatorProps) => {
  const [index, setIndex] = useState(0);
  const lockRef = useRef(false);
  const touchStartX = useRef<number | null>(null);

  const go = (dir: 1 | -1) => {
    if (lockRef.current) return;
    const next = index + dir;
    if (next < 0 || next >= HERO_CARDS.length) return;
    lockRef.current = true;
    setIndex(next);
    window.setTimeout(() => {
      lockRef.current = false;
    }, FLIP_MS);
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

  const total = HERO_CARDS.length;
  const isFirst = index === 0;
  const isLast = index === total - 1;

  return (
    <div
      role="region"
      aria-label="Your pet's story — twelve angles"
      aria-roledescription="carousel"
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="hero-journey outline-none select-none flex items-center gap-2 sm:gap-4"
    >
      <ArrowButton direction="left" disabled={isFirst} onClick={() => go(-1)} />

      <div
        className="relative flex-1"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          minHeight: "clamp(360px, 52vw, 420px)",
          perspective: "1600px",
        }}
      >
        {HERO_CARDS.map((card, i) => {
          const offset = i - index;
          // Only keep neighbouring cards mounted so the rest don't
          // hammer the GPU with offscreen twinkles.
          if (offset < -2 || offset > 4) return null;
          const style = stackStyleFor(offset);
          const isTop = offset === 0;
          return (
            <div
              key={i}
              aria-hidden={!isTop}
              className="deck-card absolute inset-0"
              style={{
                ...style,
                transition: "transform 560ms cubic-bezier(0.22,1,0.36,1), opacity 460ms ease",
                willChange: "transform, opacity",
              }}
            >
              <CardFace
                card={card}
                chapterLabel={`${pad2(i + 1)} / ${pad2(total)}`}
                animateStars={isTop}
              />
            </div>
          );
        })}
      </div>

      <ArrowButton direction="right" disabled={isLast} onClick={() => go(1)} />

      <style>{`
        @keyframes heroStarPulse {
          0%, 100% { opacity: 0.22; }
          50%      { opacity: 0.62; }
        }
        @media (prefers-reduced-motion: reduce) {
          .deck-card { transition: opacity 250ms ease !important; }
        }
      `}</style>
    </div>
  );
};
