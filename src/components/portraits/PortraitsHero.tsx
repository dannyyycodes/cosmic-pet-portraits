/**
 * PortraitsHero — bright commercial hero with cinematic parallax depth.
 *
 * Three depth dimensions stacked:
 *   1. POINTER parallax — desktop only. Mouse over the framed stage tilts
 *      the layers at different rates (back slow, front fast). Smooth via
 *      useSpring so it never jitters. ~6-12px translate range.
 *   2. SCROLL parallax — useScroll mapped per-layer. Halo drifts up slowest,
 *      portrait at 1:1, caption tab + corner glints faster. Engaged on
 *      scroll-into-AND-out-of-view via offset: ["start end", "end start"].
 *   3. AMBIENT motion — soft halo breathing + star twinkles, 6s loop.
 *
 * Mobile: pointer tracking disabled (no mouse). Scroll parallax travel halved.
 * Reduced-motion: all transforms disabled, opacity-only fade-in only.
 *
 * Performance: every layer uses translate3d (GPU). will-change hinted on
 * the transformed elements only. No filter:blur during scroll.
 */
/**
 * Hero stripped to text-only on 2026-05-04. The previous framed portrait
 * stage (rotating archetypes + parallax layers) was removed at Danny's
 * request — the new "wall of love" review section now carries the visual
 * weight directly above the trust strip.
 */
import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { SplitWords } from "./SplitWords";
import { PALETTE, display, cormorantItalic } from "./tokens";

interface PortraitsHeroProps {
  onBegin?: () => void;
}

export function PortraitsHero({ onBegin }: PortraitsHeroProps) {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  // Subtle scroll parallax on the copy block — same offset window as before.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const isMobile =
    typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
  const k = isMobile ? 0.5 : 1;
  const copyScrollY = useTransform(scrollYProgress, [0, 1], [0, -50 * k]);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{
        background: "#ffffff",
        color: PALETTE.ink,
      }}
      aria-labelledby="portraits-hero-heading"
    >
      <div
        className="relative z-10 mx-auto px-6 md:px-10 flex flex-col items-center justify-center text-center"
        style={{
          maxWidth: "960px",
          paddingTop: "clamp(40px, 6vh, 84px)",
          paddingBottom: "clamp(20px, 3vh, 40px)",
        }}
      >
        <motion.div style={reduce ? undefined : { y: copyScrollY }}>
          <p
            style={{
              fontFamily: 'Assistant, system-ui, sans-serif',
              fontSize: "12.5px",
              color: PALETTE.rose,
              letterSpacing: "0.24em",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            Pet Portraits · framed wall art
          </p>

          <h1
            id="portraits-hero-heading"
            style={{
              ...display("clamp(40px, 6.4vw, 84px)"),
              color: PALETTE.ink,
              marginTop: "16px",
              maxWidth: "16ch",
              marginInline: "auto",
            }}
          >
            <SplitWords text="your pet is the" />{" "}
            <SplitWords
              text="main character"
              style={{ ...cormorantItalic("clamp(42px, 6.6vw, 88px)"), color: PALETTE.rose }}
              delay={0.36}
            />
          </h1>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-5">
            <button
              type="button"
              onClick={onBegin}
              className="inline-flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.99]"
              style={{
                background: PALETTE.rose,
                color: PALETTE.cream,
                fontFamily: 'Assistant, system-ui, sans-serif',
                fontSize: "16px",
                fontWeight: 700,
                letterSpacing: "0.01em",
                padding: "16px 34px",
                borderRadius: "999px",
                boxShadow: "0 18px 48px rgba(191, 82, 74, 0.28)",
              }}
            >
              Begin their portrait
              <span aria-hidden style={{ fontSize: "18px" }}>↓</span>
            </button>
            <a
              href="#wall-of-love"
              style={{
                fontFamily: 'Assistant, system-ui, sans-serif',
                fontSize: "14.5px",
                color: PALETTE.earth,
                textDecoration: "underline",
                textDecorationColor: "rgba(58, 58, 58, 0.4)",
                textUnderlineOffset: "5px",
                fontWeight: 500,
              }}
            >
              see what other pet parents got first
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
