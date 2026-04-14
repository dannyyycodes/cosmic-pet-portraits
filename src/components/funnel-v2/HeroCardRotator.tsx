import { useRef, useState } from "react";

type HeroCard = { eyebrow: string; headline: string; sub: string };

// Final 7-card deck — every card serves a distinct emotional arrival state
// and ties to a real product feature (quirk decoder, compatibility, memorial
// mode, cosmic portrait, etc.). Ordered as a journey:
// recognition → explanation → validation → mortality → unknown-past →
// identity-upgrade → reciprocity reveal.
const HERO_CARDS: HeroCard[] = [
  {
    eyebrow: "For the one who's been beside you every day",
    headline: "They have a look they save only for you. You still don't know what it means.",
    sub: "You've studied them longer than almost anyone in your life. You've never been able to put it into words. This finally does.",
  },
  {
    eyebrow: "For the pet with that weird thing",
    headline: "You've known what they do. Now know why.",
    sub: "The ritual. The obsession. The specific moment they always appear. You've been narrating their weirdness to friends for years. This tells you what you were actually watching.",
  },
  {
    eyebrow: "For the bond nobody else gets",
    headline: "Everyone thinks you're projecting. You're not.",
    sub: "The pull. The rightness. The way it felt like they were yours before they were yours. Every feeling you've had about your bond is in their chart. Written, not imagined.",
  },
  {
    eyebrow: "For the pet getting older — or already gone",
    headline: "Love doesn't stop at goodbye. Neither does this.",
    sub: "For the ones still here: don't leave them half-understood while there's still time. For the ones you've lost: a memorial reading reads them in past tense — their full chart, their bond with you, a letter in their voice. Not closure. Continuation.",
  },
  {
    eyebrow: "For the ones with a history you weren't there for",
    headline: "What they can't tell you, their chart remembers.",
    sub: "Rescued, rehomed, shelter, stray — their past is older than your bond, and every piece of it shaped who they are for you. This reads the part they can't say.",
  },
  {
    eyebrow: "For the ones who'd give them the world",
    headline: "Every gift you've bought has said \u201CI love you.\u201D This one says \u201CI see you.\u201D",
    sub: "The full chart. The cosmic portrait for your wall. The archetype, the aura, the letter. A gift that doesn't get chewed, outgrown, or lost — because it is them, not something for them.",
  },
  {
    eyebrow: "For the ones loved this fiercely",
    headline: "They've been reading you for years. Now read them back.",
    sub: "The hours they've spent watching you. The way they knew you were sad before you did. They've been learning your language without one of their own. This finally gives you theirs.",
  },
];

const FLIP_MS = 560;

export type TypographyVariant =
  | "editorial-italic"   // current: DM Serif italic headline, Cormorant italic eyebrow
  | "classical-upright"  // DM Serif upright + Lato caps eyebrow
  | "bold-modern"        // Playfair bold + Cormorant italic eyebrow
  | "handwritten-intimate"; // DM Serif italic + Caveat handwritten eyebrow

interface HeroCardRotatorProps {
  onFinishClick?: () => void;
  typography?: TypographyVariant;
}

const pad2 = (n: number) => n.toString().padStart(2, "0");

type TypoStyles = {
  eyebrow: React.CSSProperties;
  headline: React.CSSProperties;
  sub: React.CSSProperties;
  /** Optional star glyph around the eyebrow — hidden for some variants */
  showStars: boolean;
};

const TYPO: Record<TypographyVariant, TypoStyles> = {
  "editorial-italic": {
    showStars: true,
    eyebrow: {
      fontFamily: '"Cormorant", Georgia, serif',
      fontStyle: "italic",
      fontSize: "clamp(0.94rem, 2.3vw, 1.08rem)",
      letterSpacing: "0.04em",
      color: "var(--gold, #c4a265)",
      opacity: 0.95,
    },
    headline: {
      fontFamily: '"DM Serif Display", Georgia, serif',
      fontSize: "clamp(1.65rem, 6.2vw, 2.35rem)",
      fontWeight: 400,
      fontStyle: "italic",
      color: "var(--black, #141210)",
      lineHeight: 1.12,
      letterSpacing: "-0.015em",
    },
    sub: {
      fontFamily: '"Cormorant", Georgia, serif',
      fontSize: "clamp(1.05rem, 2.6vw, 1.22rem)",
      fontWeight: 400,
      color: "var(--warm, #5a4a42)",
      lineHeight: 1.55,
    },
  },
  "classical-upright": {
    showStars: false,
    eyebrow: {
      fontFamily: '"Lato", system-ui, sans-serif',
      fontWeight: 600,
      textTransform: "uppercase",
      fontSize: "clamp(0.7rem, 1.7vw, 0.82rem)",
      letterSpacing: "0.24em",
      color: "var(--gold, #c4a265)",
    },
    headline: {
      fontFamily: '"DM Serif Display", Georgia, serif',
      fontSize: "clamp(1.75rem, 6.4vw, 2.5rem)",
      fontWeight: 400,
      fontStyle: "normal",
      color: "var(--black, #141210)",
      lineHeight: 1.14,
      letterSpacing: "-0.02em",
    },
    sub: {
      fontFamily: '"Cormorant", Georgia, serif',
      fontSize: "clamp(1.05rem, 2.6vw, 1.2rem)",
      fontStyle: "italic",
      fontWeight: 400,
      color: "var(--warm, #5a4a42)",
      lineHeight: 1.55,
    },
  },
  "bold-modern": {
    showStars: false,
    eyebrow: {
      fontFamily: '"Cormorant", Georgia, serif',
      fontStyle: "italic",
      fontWeight: 500,
      fontSize: "clamp(0.95rem, 2.3vw, 1.1rem)",
      letterSpacing: "0.02em",
      color: "var(--rose, #bf524a)",
    },
    headline: {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontSize: "clamp(1.7rem, 6.4vw, 2.4rem)",
      fontWeight: 700,
      fontStyle: "normal",
      color: "var(--black, #141210)",
      lineHeight: 1.1,
      letterSpacing: "-0.025em",
    },
    sub: {
      fontFamily: '"Lato", system-ui, sans-serif',
      fontSize: "clamp(0.98rem, 2.3vw, 1.08rem)",
      fontWeight: 400,
      color: "var(--warm, #5a4a42)",
      lineHeight: 1.6,
    },
  },
  "handwritten-intimate": {
    showStars: false,
    eyebrow: {
      fontFamily: '"Caveat", cursive',
      fontWeight: 500,
      fontSize: "clamp(1.15rem, 2.7vw, 1.4rem)",
      letterSpacing: "0.01em",
      color: "var(--gold, #c4a265)",
      opacity: 0.95,
    },
    headline: {
      fontFamily: '"DM Serif Display", Georgia, serif',
      fontSize: "clamp(1.65rem, 6.2vw, 2.35rem)",
      fontWeight: 400,
      fontStyle: "italic",
      color: "var(--black, #141210)",
      lineHeight: 1.12,
      letterSpacing: "-0.015em",
    },
    sub: {
      fontFamily: '"Lato", system-ui, sans-serif',
      fontSize: "clamp(0.98rem, 2.3vw, 1.08rem)",
      fontWeight: 300,
      fontStyle: "italic",
      color: "var(--warm, #5a4a42)",
      lineHeight: 1.6,
    },
  },
};

const CardFace = ({
  card,
  chapterLabel,
  animateStars,
  typo,
}: {
  card: HeroCard;
  chapterLabel: string;
  animateStars: boolean;
  typo: TypoStyles;
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
      style={{ minHeight: "clamp(260px, 38vw, 300px)" }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 12,
          maxWidth: "34rem",
          lineHeight: 1.3,
          ...typo.eyebrow,
        }}
      >
        {typo.showStars && <span style={{ opacity: 0.8, fontSize: "0.85em" }}>✦</span>}
        <span>{card.eyebrow}</span>
        {typo.showStars && <span style={{ opacity: 0.8, fontSize: "0.85em" }}>✦</span>}
      </div>

      <h2 style={{ margin: 0, maxWidth: "32rem", ...typo.headline }}>
        {card.headline}
      </h2>

      <p style={{ margin: 0, maxWidth: "32rem", ...typo.sub }}>{card.sub}</p>
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

export const HeroCardRotator = ({
  typography = "editorial-italic",
}: HeroCardRotatorProps) => {
  const [index, setIndex] = useState(0);
  const lockRef = useRef(false);
  const touchStartX = useRef<number | null>(null);

  const typo = TYPO[typography];

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
      aria-label="Your pet's story"
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
          minHeight: "clamp(380px, 54vw, 440px)",
          perspective: "1600px",
        }}
      >
        {HERO_CARDS.map((card, i) => {
          const offset = i - index;
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
                typo={typo}
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
