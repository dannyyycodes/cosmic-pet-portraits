import { useEffect, useRef, useState } from "react";

type HeroCard = { eyebrow: string; headline: string; sub: string };

const HERO_CARDS: HeroCard[] = [
  {
    eyebrow: "They give us everything",
    headline: "It's time we understood them in return.",
    sub: "The one relationship in your life that's asked nothing back. Here's how you give something back.",
  },
  {
    eyebrow: "After every walk, every stare, every quiet sigh",
    headline: "You know their habits. Do you know their soul?",
    sub: "You've memorised every look. There's a whole story behind the eyes you thought you'd read.",
  },
  {
    eyebrow: "For the ones with a past you'll never know",
    headline: "They came to you with a story. Read it.",
    sub: "Rescue, stray, surrender. Their chart remembers what their history can't tell you.",
  },
  {
    eyebrow: "You've always felt it",
    headline: "Something told you this one was different. Something was right.",
    sub: "The bond you can't explain to anyone else. This is the part that explains it.",
  },
  {
    eyebrow: "The habits no one else understands",
    headline: "Every strange thing they do has a reason.",
    sub: "The 3am zoomies. The one person they won't leave. The toy they guard. It isn't random. It's written.",
  },
  {
    eyebrow: "For the soul who won't be here forever",
    headline: "Capture who they are, before time does.",
    sub: "A record of the soul you've shared your life with. Theirs to be understood. Yours to keep.",
  },
  {
    eyebrow: "You watch them more than you watch TV",
    headline: "You've been studying them for years. Here's the cheat sheet.",
    sub: "Every tilt of the head, every ritual, every quirk, decoded the way only their own sky can.",
  },
  {
    eyebrow: "Week one, or week five hundred",
    headline: "Skip the years of guessing. Meet who they actually are.",
    sub: "The personality. The triggers. The love language. All of it, from day one.",
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
    eyebrow: "Honour the one who got you through",
    headline: "They held you up. It's your turn.",
    sub: "A portrait of the soul that's been carrying yours. Not what they do for you. Who they are.",
  },
  {
    eyebrow: "Not your usual horoscope",
    headline: "Not a guess. Their exact sky, on their exact day.",
    sub: "Built from real astronomical data for their birth moment, translated into who they are today.",
  },
];

const ROTATE_MS = 5500;

export const HeroCardRotator = () => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (paused) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % HERO_CARDS.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const go = (dir: 1 | -1) => {
    setIndex((i) => (i + dir + HERO_CARDS.length) % HERO_CARDS.length);
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

  return (
    <div>
      <div
        role="region"
        aria-label="Why Little Souls"
        aria-roledescription="carousel"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="relative outline-none select-none"
        style={{ minHeight: "clamp(220px, 34vw, 250px)" }}
      >
        <div
          key={index}
          aria-live="polite"
          className="hero-card-rot absolute inset-0 flex flex-col items-center justify-center gap-3 px-1 text-center"
        >
          <div
            style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontStyle: "italic",
              fontSize: "clamp(0.82rem, 2.2vw, 0.98rem)",
              letterSpacing: "0.01em",
              color: "var(--gold, #c4a265)",
              opacity: 0.95,
            }}
          >
            {card.eyebrow}
          </div>
          <h2
            style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: "clamp(1.55rem, 6.2vw, 2.2rem)",
              fontWeight: 400,
              color: "var(--black, #141210)",
              lineHeight: 1.18,
              letterSpacing: "-0.02em",
              margin: 0,
              maxWidth: "34rem",
            }}
          >
            {card.headline}
          </h2>
          <p
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "clamp(0.98rem, 2.4vw, 1.08rem)",
              color: "var(--warm, #5a4a42)",
              lineHeight: 1.55,
              margin: 0,
              maxWidth: "32rem",
            }}
          >
            {card.sub}
          </p>
        </div>
      </div>

      <div
        className="flex items-center justify-center flex-wrap gap-1.5 mt-5"
        role="tablist"
        aria-label="Select angle"
      >
        {HERO_CARDS.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === index}
            aria-label={`Angle ${i + 1} of ${HERO_CARDS.length}`}
            onClick={() => setIndex(i)}
            style={{
              width: i === index ? 22 : 6,
              height: 6,
              borderRadius: 9999,
              background: i === index ? "var(--rose, #bf524a)" : "var(--sand, #e8ddd0)",
              border: "none",
              cursor: "pointer",
              padding: 0,
              transition: "width 320ms ease, background 320ms ease",
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes heroCardRotIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-card-rot { animation: heroCardRotIn 700ms ease-out; }
        @media (prefers-reduced-motion: reduce) {
          .hero-card-rot { animation: none; }
        }
      `}</style>
    </div>
  );
};
