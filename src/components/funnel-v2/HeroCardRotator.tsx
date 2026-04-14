import { useRef, useState } from "react";
import {
  MoonStars,
  PawPrint,
  Infinity as InfinityIcon,
  Flame,
  Scroll as ScrollIcon,
  Gift,
  Eye,
} from "@phosphor-icons/react";

type Glyph = "moon" | "paw" | "bond" | "candle" | "scroll" | "gift" | "mirror";
type HeroCard = { eyebrow: string; headline: string; sub: string; accent: string; glyph: Glyph };

// Final 7-card deck — every card serves a distinct emotional arrival state
// and ties to a real product feature (quirk decoder, compatibility, memorial
// mode, cosmic portrait, etc.). Ordered as a journey:
// recognition → explanation → validation → mortality → unknown-past →
// identity-upgrade → reciprocity reveal.
const HERO_CARDS: HeroCard[] = [
  {
    accent: "#c4a265", glyph: "moon",
    eyebrow: "For the one who's been beside you every day",
    headline: "They have a look they save only for you. You still don't know what it means.",
    sub: "You've studied them longer than almost anyone in your life. You've never been able to put it into words. This finally does.",
  },
  {
    accent: "#bf524a", glyph: "paw",
    eyebrow: "For the pet with that weird thing",
    headline: "You've known what they do. Now know why.",
    sub: "The ritual. The obsession. The specific moment they always appear. You've been narrating their weirdness to friends for years. This tells you what you were actually watching.",
  },
  {
    accent: "#8a6f8c", glyph: "bond",
    eyebrow: "For the bond nobody else gets",
    headline: "Everyone thinks you're projecting. You're not.",
    sub: "The pull. The rightness. The way it felt like they were yours before they were yours. Every feeling you've had about your bond is in their chart. Written, not imagined.",
  },
  {
    accent: "#5a4a42", glyph: "candle",
    eyebrow: "For the pet getting older — or already gone",
    headline: "Love doesn't stop at goodbye. Neither does this.",
    sub: "For the ones still here: don't leave them half-understood while there's still time. For the ones you've lost: a memorial reading reads them in past tense — their full chart, their bond with you, a letter in their voice. Not closure. Continuation.",
  },
  {
    accent: "#7a8670", glyph: "scroll",
    eyebrow: "For the ones with a history you weren't there for",
    headline: "What they can't tell you, their chart remembers.",
    sub: "Rescued, rehomed, shelter, stray — their past is older than your bond, and every piece of it shaped who they are for you. This reads the part they can't say.",
  },
  {
    accent: "#b0773f", glyph: "gift",
    eyebrow: "For the ones who'd give them the world",
    headline: "Every gift you've bought has said \u201CI love you.\u201D This one says \u201CI see you.\u201D",
    sub: "The full chart. The cosmic portrait for your wall. The archetype, the aura, the letter. A gift that doesn't get chewed, outgrown, or lost — because it is them, not something for them.",
  },
  {
    accent: "#9d4038", glyph: "mirror",
    eyebrow: "For the ones loved this fiercely",
    headline: "They've been reading you for years. Now read them back.",
    sub: "The hours they've spent watching you. The way they knew you were sad before you did. They've been learning your language without one of their own. This finally gives you theirs.",
  },
];

// Phosphor thin-weight icons — designed as a coherent pack, not hand-hacked.
// Rendered in the card's accent colour and dropped to a low opacity so they
// sit behind the text as a themed watermark.
const GLYPH_ICON: Record<Glyph, typeof MoonStars> = {
  moon: MoonStars,
  paw: PawPrint,
  bond: InfinityIcon,
  candle: Flame,
  scroll: ScrollIcon,
  gift: Gift,
  mirror: Eye,
};

const GlyphMark = ({ type, color, opacity = 0.12 }: { type: Glyph; color: string; opacity?: number }) => {
  const Icon = GLYPH_ICON[type];
  return (
    <div style={{ width: "100%", height: "100%", opacity, color }} aria-hidden="true">
      <Icon size="100%" weight="thin" />
    </div>
  );
};

// Per-card constellation — 3 connected stars whose pattern differs by seed.
// Keeps the starfield themed rather than wallpapery.
const CONSTELLATIONS: Array<Array<[number, number]>> = [
  [[70, 80], [140, 60], [210, 110]],
  [[80, 320], [160, 280], [230, 330]],
  [[290, 70], [340, 130], [280, 180]],
  [[60, 180], [120, 220], [180, 190]],
  [[310, 270], [350, 320], [270, 330]],
  [[200, 50], [250, 90], [210, 140]],
  [[90, 250], [150, 290], [210, 240]],
];

const FLIP_MS = 560;

export type TypographyVariant =
  | "hw-soft-diary"      // Caveat eyebrow, DM Serif italic headline (bigger), Lato light italic body
  | "hw-love-letter"     // Caveat eyebrow (large), Playfair italic headline (huge), Cormorant body
  | "hw-big-quote"       // Small Caveat eyebrow, DM Serif italic headline (massive)
  | "hw-full-cursive"    // Caveat eyebrow, Caveat bold cursive headline (XL), Cormorant body
  | "hw-whisper";        // Caveat eyebrow rose, Cormorant italic headline, Cormorant light italic body

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
  "hw-soft-diary": {
    showStars: false,
    eyebrow: {
      fontFamily: '"Caveat", cursive',
      fontWeight: 500,
      fontSize: "clamp(1.3rem, 3.1vw, 1.6rem)",
      letterSpacing: "0.005em",
      color: "var(--gold, #c4a265)",
    },
    headline: {
      fontFamily: '"DM Serif Display", Georgia, serif',
      fontSize: "clamp(1.55rem, 5.3vw, 2.05rem)",
      fontWeight: 400,
      fontStyle: "italic",
      color: "var(--black, #141210)",
      lineHeight: 1.2,
      letterSpacing: "-0.01em",
    },
    sub: {
      fontFamily: '"Cormorant", Georgia, serif',
      fontSize: "clamp(1.08rem, 2.6vw, 1.22rem)",
      fontWeight: 400,
      fontStyle: "italic",
      color: "var(--warm, #5a4a42)",
      lineHeight: 1.6,
    },
  },
  "hw-love-letter": {
    showStars: false,
    eyebrow: {
      fontFamily: '"Caveat", cursive',
      fontWeight: 500,
      fontSize: "clamp(1.35rem, 3.2vw, 1.7rem)",
      letterSpacing: "0.005em",
      color: "var(--gold, #c4a265)",
    },
    headline: {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontSize: "clamp(2.05rem, 7.6vw, 3rem)",
      fontWeight: 500,
      fontStyle: "italic",
      color: "var(--black, #141210)",
      lineHeight: 1.1,
      letterSpacing: "-0.02em",
    },
    sub: {
      fontFamily: '"Cormorant", Georgia, serif',
      fontSize: "clamp(1.12rem, 2.7vw, 1.28rem)",
      fontWeight: 400,
      color: "var(--warm, #5a4a42)",
      lineHeight: 1.55,
    },
  },
  "hw-big-quote": {
    showStars: false,
    eyebrow: {
      fontFamily: '"Caveat", cursive',
      fontWeight: 400,
      fontSize: "clamp(1.05rem, 2.4vw, 1.25rem)",
      letterSpacing: "0.005em",
      color: "var(--muted, #958779)",
      opacity: 0.9,
    },
    headline: {
      fontFamily: '"DM Serif Display", Georgia, serif',
      fontSize: "clamp(2.15rem, 8vw, 3.2rem)",
      fontWeight: 400,
      fontStyle: "italic",
      color: "var(--black, #141210)",
      lineHeight: 1.08,
      letterSpacing: "-0.02em",
    },
    sub: {
      fontFamily: '"Cormorant", Georgia, serif',
      fontSize: "clamp(1.1rem, 2.6vw, 1.24rem)",
      fontWeight: 400,
      fontStyle: "italic",
      color: "var(--warm, #5a4a42)",
      lineHeight: 1.55,
    },
  },
  "hw-full-cursive": {
    showStars: false,
    eyebrow: {
      fontFamily: '"Caveat", cursive',
      fontWeight: 400,
      fontSize: "clamp(1.05rem, 2.4vw, 1.22rem)",
      letterSpacing: "0.005em",
      color: "var(--gold, #c4a265)",
    },
    headline: {
      fontFamily: '"Caveat", cursive',
      fontSize: "clamp(2.65rem, 10vw, 4rem)",
      fontWeight: 700,
      color: "var(--black, #141210)",
      lineHeight: 1.02,
      letterSpacing: "-0.005em",
    },
    sub: {
      fontFamily: '"Cormorant", Georgia, serif',
      fontSize: "clamp(1.1rem, 2.6vw, 1.24rem)",
      fontWeight: 400,
      color: "var(--warm, #5a4a42)",
      lineHeight: 1.55,
    },
  },
  "hw-whisper": {
    showStars: false,
    eyebrow: {
      fontFamily: '"Caveat", cursive',
      fontWeight: 500,
      fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
      letterSpacing: "0.005em",
      color: "var(--rose, #bf524a)",
      opacity: 0.95,
    },
    headline: {
      fontFamily: '"Cormorant", Georgia, serif',
      fontSize: "clamp(2rem, 7.4vw, 2.95rem)",
      fontWeight: 500,
      fontStyle: "italic",
      color: "var(--black, #141210)",
      lineHeight: 1.14,
      letterSpacing: "-0.015em",
    },
    sub: {
      fontFamily: '"Cormorant", Georgia, serif',
      fontSize: "clamp(1.1rem, 2.6vw, 1.24rem)",
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
  depth = 0,
  constellationIndex = 0,
}: {
  card: HeroCard;
  chapterLabel: string;
  animateStars: boolean;
  typo: TypoStyles;
  depth?: number;
  constellationIndex?: number;
}) => {
  // Back-deck tinting — each layer behind reads as its own page, not a ghost.
  const bgTop = depth === 0 ? "#FFFDF5" : depth === 1 ? "#f8f0df" : "#f0e6d0";
  const bgBot = depth === 0 ? "#faf4e8" : depth === 1 ? "#f0e6d0" : "#e6d8bd";
  const borderCol = depth === 0
    ? `${card.accent}47` // ~28% alpha of accent
    : "rgba(180, 150, 95, 0.30)";
  const stars = [
    [50, 70, 1.2], [120, 40, 0.9], [280, 60, 1.1], [350, 100, 1],
    [30, 200, 1], [370, 220, 1.2], [180, 340, 0.9], [320, 360, 1.1],
    [90, 320, 1], [250, 120, 0.8], [70, 380, 0.9], [220, 50, 1],
    [150, 180, 0.8], [300, 250, 0.9], [200, 280, 0.7],
  ];
  const constellation = CONSTELLATIONS[constellationIndex % CONSTELLATIONS.length];
  const constellationPath =
    "M " + constellation.map(([x, y]) => `${x} ${y}`).join(" L ");

  return (
  <div
    className="relative w-full h-full overflow-hidden"
    style={{
      background: `linear-gradient(180deg, ${bgTop} 0%, ${bgBot} 100%)`,
      border: `1px solid ${borderCol}`,
      borderRadius: 24,
      padding: "clamp(38px, 6.5vw, 60px) clamp(26px, 5.5vw, 52px)",
      boxShadow:
        "0 14px 46px rgba(31, 28, 24, 0.09), inset 0 1px 0 rgba(255,255,255,0.75)",
    }}
  >
    {/* Soft radial glow in the accent colour — subtle lift behind the text */}
    {depth === 0 && (
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 42%, ${card.accent}1a 0%, transparent 58%)`,
        }}
      />
    )}

    <svg
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Per-card constellation line — drawn only on the active card */}
      {depth === 0 && (
        <path
          d={constellationPath}
          stroke={card.accent}
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeOpacity="0.45"
          fill="none"
        />
      )}
      {stars.map(([cx, cy, r], i) => {
        // Stars nearest the constellation burn brighter
        const onConstellation = depth === 0 && constellation.some(
          ([x, y]) => Math.abs(cx - x) < 20 && Math.abs(cy - y) < 20
        );
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={onConstellation ? r * 1.6 : r}
            fill={onConstellation ? card.accent : "var(--gold, #c4a265)"}
            opacity={onConstellation ? 0.75 : 0.28}
            style={
              animateStars
                ? { animation: `heroStarPulse ${3.5 + (i % 3) * 0.7}s ease-in-out ${i * 0.3}s infinite` }
                : undefined
            }
          />
        );
      })}
    </svg>

    {/* Themed glyph watermark — sits behind the headline, gives each card its own mark */}
    {depth === 0 && (
      <div
        aria-hidden="true"
        className="absolute pointer-events-none"
        style={{
          top: "clamp(44px, 8vw, 74px)",
          left: "50%",
          transform: "translateX(-50%)",
          width: "clamp(120px, 22vw, 180px)",
          height: "clamp(120px, 22vw, 180px)",
        }}
      >
        <GlyphMark type={card.glyph} color={card.accent} opacity={0.11} />
      </div>
    )}

    <div
      aria-hidden="true"
      className="absolute"
      style={{
        top: 14,
        right: 18,
        fontFamily: '"Lato", system-ui, sans-serif',
        fontSize: "0.72rem",
        fontWeight: 600,
        letterSpacing: "0.24em",
        textTransform: "uppercase",
        color: card.accent,
        opacity: depth === 0 ? 0.85 : 0,
      }}
    >
      {chapterLabel}
    </div>

    <div
      className="relative h-full flex flex-col items-center justify-center text-center"
      style={{
        minHeight: "clamp(300px, 42vw, 360px)",
        gap: "clamp(14px, 2vw, 22px)",
      }}
    >
      <div className="flex flex-col items-center" style={{ gap: 4 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            maxWidth: "34rem",
            lineHeight: 1.3,
            ...typo.eyebrow,
            color: card.accent,
          }}
        >
          {typo.showStars && <span style={{ opacity: 0.8, fontSize: "0.85em" }}>✦</span>}
          <span>{card.eyebrow}</span>
          {typo.showStars && <span style={{ opacity: 0.8, fontSize: "0.85em" }}>✦</span>}
        </div>
        {/* Hand-drawn squiggle underline — picks up the card's accent colour */}
        <svg
          aria-hidden="true"
          width="84"
          height="8"
          viewBox="0 0 84 8"
          fill="none"
          style={{ opacity: 0.8, marginTop: 2 }}
        >
          <path
            d="M 2 5 Q 10 0.5 18 4.5 T 34 4.5 T 50 4.5 T 66 4.5 T 82 4.5"
            stroke={card.accent}
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      <h2 style={{ margin: 0, maxWidth: "32rem", ...typo.headline }}>
        {card.headline}
      </h2>

      <p style={{ margin: 0, maxWidth: "32rem", ...typo.sub }}>{card.sub}</p>
    </div>
  </div>
  );
};

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
      transform: "translateX(0) translateY(-22px) rotate(-1.2deg) scale(0.955)",
      opacity: 1,
      zIndex: 29,
      pointerEvents: "none",
    };
  }
  if (offset === 2) {
    return {
      transform: "translateX(0) translateY(-42px) rotate(1.4deg) scale(0.91)",
      opacity: 1,
      zIndex: 28,
      pointerEvents: "none",
    };
  }
  if (offset === 3) {
    return {
      transform: "translateX(0) translateY(-60px) rotate(-1deg) scale(0.87)",
      opacity: 0.7,
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
  typography = "hw-soft-diary",
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
  const activeAccent = HERO_CARDS[index].accent;

  const goTo = (target: number) => {
    if (lockRef.current || target === index) return;
    if (target < 0 || target >= HERO_CARDS.length) return;
    lockRef.current = true;
    setIndex(target);
    window.setTimeout(() => {
      lockRef.current = false;
    }, FLIP_MS);
  };

  return (
    <div
      role="region"
      aria-label="Your pet's story"
      aria-roledescription="carousel"
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="hero-journey outline-none select-none flex flex-col gap-3 sm:gap-4"
    >
    <div className="flex items-center gap-2 sm:gap-4">
      <ArrowButton direction="left" disabled={isFirst} onClick={() => go(-1)} />

      <div
        className="relative flex-1"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          minHeight: "clamp(480px, 66vw, 560px)",
          perspective: "1600px",
          paddingTop: 40,
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
                chapterLabel={`Chapter ${pad2(i + 1)} / ${pad2(total)}`}
                animateStars={isTop}
                typo={typo}
                depth={Math.max(0, offset)}
                constellationIndex={i}
              />
            </div>
          );
        })}
      </div>

      <ArrowButton direction="right" disabled={isLast} onClick={() => go(1)} />
    </div>

    {/* Progress rail — 7 dots, the active one expands + picks up the card's accent */}
    <div
      className="flex items-center justify-center gap-2"
      role="tablist"
      aria-label="Card progress"
      style={{ paddingTop: 4 }}
    >
      {HERO_CARDS.map((c, i) => {
        const active = i === index;
        return (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={`Go to card ${i + 1} of ${total}`}
            onClick={() => goTo(i)}
            className="progress-dot"
            style={{
              width: active ? 28 : 8,
              height: 8,
              borderRadius: 9999,
              padding: 0,
              border: "none",
              cursor: "pointer",
              background: active ? activeAccent : "rgba(149, 135, 121, 0.28)",
              transition: "width 320ms ease, background 320ms ease, transform 180ms ease",
            }}
          />
        );
      })}
    </div>

    <style>{`
        @keyframes heroStarPulse {
          0%, 100% { opacity: 0.22; }
          50%      { opacity: 0.62; }
        }
        @media (prefers-reduced-motion: reduce) {
          .deck-card { transition: opacity 250ms ease !important; }
        }
        .progress-dot:hover { transform: translateY(-1px); }
        .progress-dot:focus-visible {
          outline: 2px solid var(--gold, #c4a265);
          outline-offset: 3px;
        }
      `}</style>
    </div>
  );
};
