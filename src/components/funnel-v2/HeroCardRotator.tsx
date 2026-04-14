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

const FLIP_MS = 640;

interface HeroCardRotatorProps {
  onFinishClick?: () => void;
}

const pad2 = (n: number) => n.toString().padStart(2, "0");

const CardFace = ({ card, chapterLabel }: { card: HeroCard; chapterLabel: string }) => (
  <div
    className="relative w-full h-full overflow-hidden"
    style={{
      background: "linear-gradient(180deg, rgba(255,253,245,0.97) 0%, rgba(250,244,232,0.95) 100%)",
      border: "1px solid rgba(196, 162, 101, 0.28)",
      borderRadius: 24,
      padding: "clamp(30px, 5.5vw, 46px) clamp(22px, 5vw, 44px)",
      boxShadow: "0 14px 46px rgba(31, 28, 24, 0.09), inset 0 1px 0 rgba(255,255,255,0.75)",
      backfaceVisibility: "hidden",
      WebkitBackfaceVisibility: "hidden",
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
          style={{ animation: `heroStarPulse ${3.5 + (i % 3) * 0.7}s ease-in-out ${i * 0.3}s infinite` }}
        />
      ))}
    </svg>

    {/* Chapter marker top right */}
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

    {/* Content */}
    <div
      className="relative h-full flex flex-col items-center justify-center gap-3 text-center"
      style={{ minHeight: "clamp(230px, 34vw, 270px)" }}
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
    aria-label={direction === "left" ? "Previous chapter" : "Next chapter"}
    className="flex items-center justify-center shrink-0"
    style={{
      width: "clamp(40px, 6vw, 52px)",
      height: "clamp(40px, 6vw, 52px)",
      borderRadius: 9999,
      border: "1px solid rgba(196, 162, 101, 0.35)",
      background: "rgba(255, 253, 245, 0.75)",
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
      e.currentTarget.style.background = "rgba(255,253,245,0.75)";
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = disabled ? "none" : "0 4px 14px rgba(31,28,24,0.06)";
    }}
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {direction === "left" ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
    </svg>
  </button>
);

export const HeroCardRotator = (_props: HeroCardRotatorProps) => {
  const [index, setIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const lockRef = useRef(false);
  const touchStartX = useRef<number | null>(null);

  const go = (dir: 1 | -1) => {
    if (lockRef.current) return;
    const next = index + dir;
    if (next < 0 || next >= HERO_CARDS.length) return;
    lockRef.current = true;
    setDirection(dir);
    setPrevIndex(index);
    setIndex(next);
    window.setTimeout(() => {
      setPrevIndex(null);
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
  const current = HERO_CARDS[index];
  const prev = prevIndex !== null ? HERO_CARDS[prevIndex] : null;
  const isFirst = index === 0;
  const isLast = index === total - 1;

  // flip in = incoming card animation, flip out = outgoing card animation
  // Next (dir=1): outgoing rotates 0→-180, incoming rotates 180→0
  // Prev (dir=-1): outgoing rotates 0→180, incoming rotates -180→0
  const outAnim = direction === 1 ? "heroFlipOutNext" : "heroFlipOutPrev";
  const inAnim = direction === 1 ? "heroFlipInNext" : "heroFlipInPrev";

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
          perspective: "1600px",
          transformStyle: "preserve-3d",
          minHeight: "clamp(340px, 50vw, 400px)",
        }}
      >
        {/* Outgoing card */}
        {prev !== null && (
          <div
            key={`prev-${prevIndex}`}
            className="absolute inset-0"
            style={{
              transformStyle: "preserve-3d",
              transformOrigin: "center center",
              animation: `${outAnim} ${FLIP_MS}ms cubic-bezier(0.45, 0, 0.55, 1) forwards`,
              willChange: "transform",
            }}
            aria-hidden="true"
          >
            <CardFace card={prev} chapterLabel={`${pad2((prevIndex ?? 0) + 1)} / ${pad2(total)}`} />
          </div>
        )}

        {/* Incoming card */}
        <div
          key={`curr-${index}`}
          aria-live="polite"
          className="absolute inset-0"
          style={{
            transformStyle: "preserve-3d",
            transformOrigin: "center center",
            animation: prev !== null
              ? `${inAnim} ${FLIP_MS}ms cubic-bezier(0.45, 0, 0.55, 1) forwards`
              : undefined,
            willChange: "transform",
          }}
        >
          <CardFace card={current} chapterLabel={`${pad2(index + 1)} / ${pad2(total)}`} />
        </div>
      </div>

      <ArrowButton direction="right" disabled={isLast} onClick={() => go(1)} />

      <style>{`
        @keyframes heroStarPulse {
          0%, 100% { opacity: 0.22; }
          50%      { opacity: 0.62; }
        }
        /* Next direction: outgoing flips away to the left (rotateY -180), incoming comes from right (180 → 0) */
        @keyframes heroFlipOutNext {
          0%   { transform: rotateY(0deg); }
          100% { transform: rotateY(-180deg); }
        }
        @keyframes heroFlipInNext {
          0%   { transform: rotateY(180deg); }
          100% { transform: rotateY(0deg); }
        }
        /* Prev direction: outgoing flips away to the right (rotateY 180), incoming comes from left (-180 → 0) */
        @keyframes heroFlipOutPrev {
          0%   { transform: rotateY(0deg); }
          100% { transform: rotateY(180deg); }
        }
        @keyframes heroFlipInPrev {
          0%   { transform: rotateY(-180deg); }
          100% { transform: rotateY(0deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-journey * { animation: none !important; }
        }
      `}</style>
    </div>
  );
};
