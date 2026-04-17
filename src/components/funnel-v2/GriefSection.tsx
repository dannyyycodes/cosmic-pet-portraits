import { useEffect, useRef, useState } from "react";
import { Flame } from "@phosphor-icons/react";

interface GriefSectionProps {
  onCtaClick: () => void;
}

export const GriefSection = ({ onCtaClick }: GriefSectionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const BEATS = [
    "For when you need to feel them close again.",
    "Always there, for when you need them.",
  ];

  return (
    <div
      ref={ref}
      className={`grief-section relative overflow-hidden ${visible ? "is-in" : ""}`}
      style={{
        background:
          "linear-gradient(180deg, #f4ebd9 0%, #ede4d4 55%, #f4ebd9 100%)",
        padding: "clamp(52px, 10vw, 90px) 20px",
      }}
    >
      {/* Soft radial candle glow behind the content */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "12%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 360,
          height: 360,
          background:
            "radial-gradient(circle, rgba(191,82,74,0.09) 0%, rgba(196,162,101,0.04) 40%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="relative max-w-[520px] mx-auto text-center"
        style={{ zIndex: 1 }}
      >
        {/* Flickering candle glyph */}
        <div className="grief-candle" style={{ marginBottom: 18 }}>
          <Flame
            size={38}
            weight="thin"
            color="var(--rose, #bf524a)"
            style={{ opacity: 0.85, margin: "0 auto", display: "block" }}
          />
        </div>

        {/* Title */}
        <h2
          className="grief-title"
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: "clamp(1.65rem, 5.4vw, 2.15rem)",
            fontWeight: 400,
            fontStyle: "italic",
            color: "var(--black, #141210)",
            lineHeight: 1.18,
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}
        >
          Grieving a love this big?
        </h2>

        {/* Sub */}
        <p
          className="grief-sub"
          style={{
            fontFamily: '"Cormorant", Georgia, serif',
            fontSize: "clamp(1rem, 3.2vw, 1.15rem)",
            fontStyle: "italic",
            color: "var(--earth, #6e6259)",
            lineHeight: 1.55,
            marginBottom: "clamp(28px, 5vw, 38px)",
            maxWidth: 440,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Their reading becomes something to keep close. Something to return
          to, every time you need them.
        </p>

        {/* Two poetic benefit beats */}
        <div
          className="grief-beats"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "clamp(16px, 2.6vw, 22px)",
            marginBottom: "clamp(30px, 5vw, 40px)",
          }}
        >
          {BEATS.map((line, i) => (
            <div
              key={i}
              className="grief-beat"
              style={{
                padding: "clamp(18px, 3.2vw, 24px) clamp(20px, 4vw, 28px)",
                background: "rgba(255, 253, 245, 0.7)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1px solid rgba(191,82,74,0.18)",
                borderRadius: 14,
                boxShadow:
                  "0 4px 18px rgba(20,15,8,0.04), inset 0 1px 0 rgba(255,255,255,0.6)",
                position: "relative",
              }}
            >
              <p
                style={{
                  fontFamily: '"DM Serif Display", Georgia, serif',
                  fontSize: "clamp(1.1rem, 3.6vw, 1.3rem)",
                  fontStyle: "italic",
                  color: "var(--ink, #1f1c18)",
                  lineHeight: 1.35,
                  letterSpacing: "-0.01em",
                  margin: 0,
                }}
              >
                {line}
              </p>
            </div>
          ))}
        </div>

        {/* Memorial mode reassurance badge */}
        <div
          className="grief-badge"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            borderRadius: 9999,
            background: "rgba(255, 253, 245, 0.85)",
            border: "1px solid rgba(191,82,74,0.22)",
            marginBottom: 22,
          }}
        >
          <Flame
            size={13}
            weight="fill"
            color="var(--rose, #bf524a)"
            style={{ opacity: 0.85 }}
          />
          <span
            style={{
              fontFamily: '"Cormorant", Georgia, serif',
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--rose, #bf524a)",
            }}
          >
            Memorial mode — in every reading
          </span>
        </div>

        {/* Soft text-link CTA — tender, not aggressive */}
        <div>
          <button
            onClick={onCtaClick}
            className="grief-cta group inline-flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
            style={{
              fontFamily: '"Cormorant", Georgia, serif',
              fontSize: "clamp(0.92rem, 3vw, 1.02rem)",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--rose, #bf524a)",
              background: "transparent",
              border: "none",
              padding: "10px 4px",
              cursor: "pointer",
              borderBottom: "1px solid rgba(191,82,74,0.4)",
            }}
          >
            Write their reading
            <svg
              className="transition-transform duration-300 group-hover:translate-x-1"
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.6}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        .grief-candle,
        .grief-title,
        .grief-sub,
        .grief-beat,
        .grief-badge,
        .grief-cta {
          opacity: 0;
          transform: translateY(10px);
          will-change: opacity, transform;
        }
        .grief-section.is-in .grief-candle {
          animation: griefReveal 720ms cubic-bezier(0.22,1,0.36,1) forwards;
        }
        .grief-section.is-in .grief-title {
          animation: griefReveal 720ms cubic-bezier(0.22,1,0.36,1) 120ms forwards;
        }
        .grief-section.is-in .grief-sub {
          animation: griefReveal 720ms cubic-bezier(0.22,1,0.36,1) 230ms forwards;
        }
        .grief-section.is-in .grief-beat:nth-child(1) {
          animation: griefReveal 720ms cubic-bezier(0.22,1,0.36,1) 340ms forwards;
        }
        .grief-section.is-in .grief-beat:nth-child(2) {
          animation: griefReveal 720ms cubic-bezier(0.22,1,0.36,1) 480ms forwards;
        }
        .grief-section.is-in .grief-badge {
          animation: griefReveal 720ms cubic-bezier(0.22,1,0.36,1) 640ms forwards;
        }
        .grief-section.is-in .grief-cta {
          animation: griefReveal 720ms cubic-bezier(0.22,1,0.36,1) 760ms forwards;
        }
        @keyframes griefReveal {
          to { opacity: 1; transform: translateY(0); }
        }
        .grief-section .grief-candle svg {
          animation: griefFlicker 3s ease-in-out infinite;
          transform-origin: center;
        }
        @keyframes griefFlicker {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          35%      { opacity: 0.92; transform: scale(1.05); }
          60%      { opacity: 0.82; transform: scale(0.98); }
        }
        @media (prefers-reduced-motion: reduce) {
          .grief-candle,
          .grief-title,
          .grief-sub,
          .grief-beat,
          .grief-badge,
          .grief-cta {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .grief-section .grief-candle svg {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};
