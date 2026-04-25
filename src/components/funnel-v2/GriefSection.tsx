import { useEffect, useRef, useState } from "react";
import { HeartsBackdrop } from "./HeartsBackdrop";

/**
 * GriefSection — memorial prelude.
 *
 * Stripped to stillness. Three beats stacked with generous breathing
 * room, one quiet fade-up on scroll-in (no per-word cascade, no
 * orrery, no starlight). Heart wallpaper sits behind the cream so the
 * background ties to the benefits/checkout band. Copy is unchanged.
 */

interface GriefSectionProps {
  onCtaClick?: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GriefSection = ({ onCtaClick: _onCtaClick }: GriefSectionProps) => {
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

  return (
    <div
      ref={ref}
      className={`grief-section relative overflow-hidden ${visible ? "is-in" : ""}`}
      style={{
        background: "var(--cream, #FFFDF5)",
        padding: "clamp(96px, 13vw, 144px) 24px clamp(88px, 11vw, 128px)",
      }}
    >
      <HeartsBackdrop />

      <div
        className="grief-stack relative max-w-[600px] mx-auto text-center"
        style={{ zIndex: 1 }}
      >
        {/* Beat 1 — acknowledgment */}
        <h2
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: "clamp(2rem, 6.4vw, 2.8rem)",
            fontWeight: 400,
            fontStyle: "italic",
            color: "var(--black, #141210)",
            lineHeight: 1.18,
            letterSpacing: "-0.018em",
            margin: 0,
            textWrap: "balance",
            maxWidth: 560,
            marginInline: "auto",
          }}
        >
          For the ones you still carry
          <br />
          in your heart.
        </h2>

        {/* Beat 2 — validation */}
        <p
          style={{
            fontFamily: '"Cormorant", Georgia, serif',
            fontSize: "clamp(1.18rem, 3.6vw, 1.4rem)",
            fontStyle: "italic",
            color: "var(--warm, #5a4a42)",
            lineHeight: 1.55,
            margin: "clamp(56px, 7vw, 72px) auto 0",
            maxWidth: 480,
            textWrap: "balance",
          }}
        >
          Even if they&rsquo;re no longer by your side.
        </p>

        {/* Beat 3 — offer */}
        <p
          style={{
            fontFamily: '"Cormorant", Georgia, serif',
            fontSize: "clamp(1.28rem, 3.8vw, 1.5rem)",
            fontStyle: "italic",
            color: "var(--ink, #3d2f2a)",
            lineHeight: 1.55,
            margin: "clamp(56px, 7vw, 72px) auto 0",
            maxWidth: 540,
            textWrap: "balance",
          }}
        >
          A reading for the space they left &mdash;{" "}
          <em
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontStyle: "italic",
              color: "var(--gold, #c4a265)",
              letterSpacing: "0.005em",
              fontWeight: 500,
            }}
          >
            a keepsake
          </em>{" "}
          for the days you need them.
        </p>

        {/* Single gold hairline rule */}
        <span aria-hidden="true" className="grief-rule" />
      </div>

      <style>{`
        /* ── Single fade-up on scroll-in ── */
        .grief-stack {
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 800ms cubic-bezier(0.22, 1, 0.36, 1),
                      transform 800ms cubic-bezier(0.22, 1, 0.36, 1);
          will-change: opacity, transform;
        }
        .grief-section.is-in .grief-stack {
          opacity: 1;
          transform: translateY(0);
        }

        .grief-rule {
          display: block;
          width: 32px;
          height: 1px;
          background: var(--gold, #c4a265);
          opacity: 0.55;
          margin: clamp(56px, 7vw, 72px) auto 0;
        }

        @media (prefers-reduced-motion: reduce) {
          .grief-stack,
          .grief-section.is-in .grief-stack {
            transition: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
};
