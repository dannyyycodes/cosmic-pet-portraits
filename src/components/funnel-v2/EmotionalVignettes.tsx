import { useEffect, useRef, useState } from "react";
import {
  Flame,
  Sparkle,
  Infinity as InfinityIcon,
  HouseLine,
  Gift,
  Eye,
} from "@phosphor-icons/react";

type Vignette = {
  icon: React.ElementType;
  accent: string;
  eyebrow: string;
  headline: string;
  body: string;
};

// Six entry-point vignettes. Each is a sensory first line + a product
// promise that meets the reader in that exact emotional state. No review
// attachments — the quotes section already lives above this one.
const VIGNETTES: Vignette[] = [
  {
    icon: Flame,
    accent: "#5a4a42",
    eyebrow: "If you're missing them",
    headline: "Love doesn't stop at goodbye.",
    body: "Every reading can be written in their memory — a soft goodbye in their voice, for when you're ready to hear it.",
  },
  {
    icon: Sparkle,
    accent: "#c4a265",
    eyebrow: "If they've just arrived",
    headline: "Welcome them in — and really meet them.",
    body: "Know who they came here to be from day one, so your bond grows on purpose.",
  },
  {
    icon: InfinityIcon,
    accent: "#8a6f8c",
    eyebrow: "If you've felt it was more",
    headline: "You've been reading each other for years.",
    body: "Now see the bond you already live — finally put into words, in their chart, on the page.",
  },
  {
    icon: HouseLine,
    accent: "#7a8670",
    eyebrow: "If they came to you with a past",
    headline: "They're safe with you now.",
    body: "What they can't tell you, their chart remembers — so you can love them even more knowingly.",
  },
  {
    icon: Gift,
    accent: "#b0773f",
    eyebrow: "If this is a gift",
    headline: "For the person whose pet is their whole world.",
    body: "Something they'll read slowly, keep close, and come back to on the hard days.",
  },
  {
    icon: Eye,
    accent: "#bf524a",
    eyebrow: "If you're here out of curiosity",
    headline: "The midnight patrols. The long stares. The little rituals.",
    body: "Every quirk has a reason written in the stars. Come meet the soul behind yours.",
  },
];

const VignetteCard = ({ v, index }: { v: Vignette; index: number }) => {
  const Icon = v.icon;
  return (
    <div
      className="vignette-card group"
      style={{
        animationDelay: `${index * 90}ms`,
        position: "relative",
        overflow: "hidden",
        background: "rgba(255, 253, 245, 0.82)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: `1px solid ${v.accent}2e`,
        borderRadius: 18,
        padding: "clamp(24px, 4.5vw, 34px) clamp(22px, 4vw, 30px)",
        boxShadow:
          "0 6px 28px rgba(20,15,8,0.05), inset 0 1px 0 rgba(255,255,255,0.7)",
        transition:
          "transform 380ms cubic-bezier(0.22,1,0.36,1), box-shadow 380ms ease, border-color 380ms ease",
        // Custom CSS vars consumed by the hover block below
        // @ts-expect-error — CSS custom property is fine at runtime
        "--accent": v.accent,
      }}
    >
      {/* Accent sheen across the top edge */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent 0%, ${v.accent}7f 50%, transparent 100%)`,
          opacity: 0.7,
        }}
      />

      {/* Watermark glyph — sits behind the text at low opacity */}
      <div
        aria-hidden="true"
        className="vignette-glyph"
        style={{
          position: "absolute",
          top: -6,
          right: -6,
          width: 84,
          height: 84,
          opacity: 0.085,
          color: v.accent,
          pointerEvents: "none",
          transition: "opacity 380ms ease, transform 500ms ease",
        }}
      >
        <Icon size="100%" weight="thin" />
      </div>

      {/* Eyebrow — handwritten invitation */}
      <p
        style={{
          fontFamily: '"Caveat", cursive',
          fontSize: "clamp(1.02rem, 2.8vw, 1.18rem)",
          fontWeight: 500,
          letterSpacing: "0.005em",
          color: v.accent,
          opacity: 0.95,
          marginBottom: 10,
          position: "relative",
          lineHeight: 1.2,
        }}
      >
        {v.eyebrow}
      </p>

      {/* Vignette line */}
      <h3
        style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: "clamp(1.2rem, 3.8vw, 1.45rem)",
          fontWeight: 400,
          fontStyle: "italic",
          color: "var(--black, #141210)",
          lineHeight: 1.22,
          letterSpacing: "-0.01em",
          marginBottom: 14,
          position: "relative",
        }}
      >
        {v.headline}
      </h3>

      {/* Hand-drawn squiggle separator */}
      <svg
        aria-hidden="true"
        width="46"
        height="6"
        viewBox="0 0 46 6"
        fill="none"
        style={{ opacity: 0.7, marginBottom: 14, display: "block" }}
      >
        <path
          d="M 1 3 Q 8 0.5 15 2.5 T 29 2.5 T 44 2.5"
          stroke={v.accent}
          strokeWidth="1.3"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {/* Body */}
      <p
        style={{
          fontFamily: '"Cormorant", Georgia, serif',
          fontSize: "clamp(0.94rem, 2.7vw, 1.02rem)",
          fontStyle: "italic",
          color: "var(--earth, #6e6259)",
          lineHeight: 1.6,
          position: "relative",
        }}
      >
        {v.body}
      </p>
    </div>
  );
};

export const EmotionalVignettes = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={sectionRef}
      className={`emotional-vignettes ${visible ? "is-in" : ""}`}
    >
      {/* Section headline */}
      <div className="text-center mb-9 sm:mb-12 px-2 vignettes-headline">
        <h2
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: "clamp(1.7rem, 6vw, 2.35rem)",
            fontWeight: 400,
            color: "var(--black, #141210)",
            lineHeight: 1.14,
            letterSpacing: "-0.02em",
            marginBottom: 14,
          }}
        >
          <em style={{ color: "var(--rose, #bf524a)", fontStyle: "italic" }}>
            Wherever
          </em>{" "}
          you are with them, start here.
        </h2>
        <p
          style={{
            fontFamily: '"Cormorant", Georgia, serif',
            fontSize: "clamp(1rem, 3.2vw, 1.15rem)",
            fontStyle: "italic",
            color: "var(--earth, #6e6259)",
            lineHeight: 1.55,
            maxWidth: 540,
            margin: "0 auto",
          }}
        >
          A soul reading for every chapter of your life with them.
        </p>
      </div>

      {/* Grid — stacked on mobile, 2 cols on sm+, capped at 720 to match the band */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 max-w-[720px] mx-auto">
        {VIGNETTES.map((v, i) => (
          <VignetteCard key={i} v={v} index={i} />
        ))}
      </div>

      <style>{`
        .vignettes-headline {
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 800ms cubic-bezier(0.22,1,0.36,1),
                      transform 800ms cubic-bezier(0.22,1,0.36,1);
          will-change: opacity, transform;
        }
        .emotional-vignettes.is-in .vignettes-headline {
          opacity: 1;
          transform: translateY(0);
        }

        .vignette-card {
          opacity: 0;
          transform: translateY(18px);
          will-change: opacity, transform;
        }
        .emotional-vignettes.is-in .vignette-card {
          animation: vignetteReveal 820ms cubic-bezier(0.22,1,0.36,1) forwards;
        }
        @keyframes vignetteReveal {
          to { opacity: 1; transform: translateY(0); }
        }

        /* Hover lift — desktop only, won't fire on touch devices */
        @media (hover: hover) {
          .vignette-card:hover {
            transform: translateY(-4px);
            box-shadow:
              0 18px 44px color-mix(in srgb, var(--accent, #c4a265) 22%, transparent),
              inset 0 1px 0 rgba(255,255,255,0.75);
            border-color: color-mix(in srgb, var(--accent, #c4a265) 50%, transparent);
          }
          .vignette-card:hover .vignette-glyph {
            opacity: 0.18;
            transform: rotate(-4deg) scale(1.06);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .vignettes-headline,
          .vignette-card {
            animation: none !important;
            transition: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
};
