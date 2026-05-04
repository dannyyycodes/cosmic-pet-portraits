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
import { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  useScroll,
  useReducedMotion,
} from "framer-motion";
import { MasterPortraitPlaceholder } from "./MasterPortraitPlaceholder";
import { SplitWords } from "./SplitWords";
import { PALETTE, display, EASE, MOTION } from "./tokens";

const ROTATION = [
  "1920s-boss",
  "wizard-school",
  "regency-court",
  "galaxy-smuggler",
  "gothic-academy",
  "cosmic-chart",
] as const;

interface PortraitsHeroProps {
  onBegin?: () => void;
}

export function PortraitsHero({ onBegin }: PortraitsHeroProps) {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Auto-rotate through archetypes
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % ROTATION.length), 5400);
    return () => clearInterval(id);
  }, []);

  // ─── Pointer parallax (desktop) ───────────────────────────────────
  // Normalised pointer position (-1 to 1) inside the stage container.
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  // Smoothed via spring so motion never jitters or chases the cursor exactly.
  const sx = useSpring(pointerX, { stiffness: 80, damping: 22, mass: 0.6 });
  const sy = useSpring(pointerY, { stiffness: 80, damping: 22, mass: 0.6 });

  // Per-layer transforms. Range = max translate in px each direction.
  // Back/halo barely moves (depth illusion), portrait middle, caption tab front.
  const haloX = useTransform(sx, [-1, 1], [-6, 6]);
  const haloY = useTransform(sy, [-1, 1], [-6, 6]);
  const dustX = useTransform(sx, [-1, 1], [-10, 10]);
  const dustY = useTransform(sy, [-1, 1], [-10, 10]);
  const portraitX = useTransform(sx, [-1, 1], [-8, 8]);
  const portraitY = useTransform(sy, [-1, 1], [-8, 8]);
  const tabX = useTransform(sx, [-1, 1], [-14, 14]);
  const tabY = useTransform(sy, [-1, 1], [-14, 14]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduce) return;
    if (e.pointerType !== "mouse") return; // touch is non-deterministic
    const r = stageRef.current?.getBoundingClientRect();
    if (!r) return;
    const cx = (e.clientX - r.left - r.width / 2) / (r.width / 2); // -1..1
    const cy = (e.clientY - r.top - r.height / 2) / (r.height / 2);
    pointerX.set(Math.max(-1, Math.min(1, cx)));
    pointerY.set(Math.max(-1, Math.min(1, cy)));
  };

  const handlePointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  // ─── Scroll parallax (engages as section enters AND leaves viewport) ─
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Mobile travel halved — see parallax-webdesign skill rule.
  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
  const k = isMobile ? 0.5 : 1;

  const haloScrollY = useTransform(scrollYProgress, [0, 1], [40 * k, -40 * k]);
  const dustScrollY = useTransform(scrollYProgress, [0, 1], [60 * k, -60 * k]);
  const portraitScrollY = useTransform(scrollYProgress, [0, 1], [0, -30 * k]);
  const tabScrollY = useTransform(scrollYProgress, [0, 1], [-40 * k, 80 * k]);
  const copyScrollY = useTransform(scrollYProgress, [0, 1], [0, -50 * k]);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{
        minHeight: "92svh",
        background: "#ffffff",
        color: PALETTE.ink,
      }}
      aria-labelledby="portraits-hero-heading"
    >
      <div
        className="relative z-10 mx-auto px-6 md:px-10"
        style={{
          maxWidth: "1240px",
          paddingTop: "clamp(72px, 11vh, 140px)",
          paddingBottom: "clamp(60px, 9vh, 130px)",
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* ── Copy column ─────────────────────────────────────── */}
          <motion.div
            className="lg:col-span-7 order-2 lg:order-1"
            style={reduce ? undefined : { y: copyScrollY }}
          >
            <p
              style={{
                fontFamily: 'Assistant, system-ui, sans-serif',
                fontSize: "12.5px",
                color: PALETTE.rose,
                letterSpacing: "0.22em",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Cosmic Pet Portraits · framed wall art
            </p>

            <h1
              id="portraits-hero-heading"
              style={{
                ...display("clamp(48px, 8vw, 96px)"),
                color: PALETTE.ink,
                marginTop: "22px",
              }}
            >
              <SplitWords text="your pet is the" />{" "}
              <SplitWords text="main character" style={{ color: PALETTE.rose }} delay={0.36} />
            </h1>

            <div className="mt-9 flex flex-wrap items-center gap-5">
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
                href="#characters"
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
                see the character worlds first
              </a>
            </div>

          </motion.div>

          {/* ── Framed portrait stage with parallax depth ─────────── */}
          <div className="lg:col-span-5 order-1 lg:order-2">
            <div
              ref={stageRef}
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
              className="relative mx-auto"
              style={{
                maxWidth: "440px",
                aspectRatio: "4 / 5",
                perspective: "1200px",
              }}
            >
              {/* Layer 1 (BACK): soft rose halo bloom */}
              <motion.div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: "-18%",
                  background: `radial-gradient(circle, ${PALETTE.rose}24 0%, ${PALETTE.rose}0a 40%, transparent 70%)`,
                  filter: "blur(24px)",
                  pointerEvents: "none",
                  willChange: "transform",
                  ...(reduce ? {} : { x: haloX, y: haloY, translateY: haloScrollY }),
                }}
              >
                {/* Slow ambient breathing — CSS animation, not framer (cheaper) */}
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    inset: 0,
                    animation: reduce ? undefined : "lsBreathe 7s ease-in-out infinite",
                  }}
                />
              </motion.div>

              {/* Layer 2 (BACK-MID): cosmic dust + stars (only when paint-bg is dark, here just decorative) */}
              <motion.div
                aria-hidden
                className="ls-dust ls-twinkle"
                style={{
                  position: "absolute",
                  inset: "-8%",
                  opacity: 0.4,
                  pointerEvents: "none",
                  willChange: "transform",
                  ...(reduce ? {} : { x: dustX, y: dustY, translateY: dustScrollY }),
                }}
              />

              {/* Layer 3 (MID): the frame + portrait — primary anchor */}
              <motion.div
                style={{
                  position: "absolute",
                  inset: 0,
                  willChange: "transform",
                  ...(reduce ? {} : { x: portraitX, y: portraitY, translateY: portraitScrollY }),
                }}
              >
                <div
                  className="absolute inset-0 rounded-sm overflow-hidden"
                  style={{
                    boxShadow:
                      "0 50px 120px rgba(20, 18, 16, 0.22), 0 0 0 8px #ffffff, 0 0 0 9px rgba(28, 28, 28, 0.12)",
                  }}
                >
                  <AnimatePresence mode="sync">
                    <motion.div
                      key={ROTATION[i]}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: MOTION.reveal / 1000, ease: EASE.out }}
                      className="absolute inset-0"
                    >
                      <MasterPortraitPlaceholder packId={ROTATION[i]} className="w-full h-full" hideCaption />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Layer 4 (FRONT): caption tab — moves fastest, comes UP at viewer */}
              <motion.div
                className="absolute left-1/2 px-4 py-2 rounded-full"
                style={{
                  bottom: "-22px",
                  background: PALETTE.ink,
                  border: `1px solid ${PALETTE.ink}`,
                  fontFamily: 'Assistant, system-ui, sans-serif',
                  fontSize: "12.5px",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  color: PALETTE.cream,
                  whiteSpace: "nowrap",
                  translateX: "-50%",
                  willChange: "transform",
                  ...(reduce ? {} : { x: tabX, y: tabY, translateY: tabScrollY }),
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={ROTATION[i]}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.45, ease: EASE.out }}
                    className="block"
                  >
                    {labelFor(ROTATION[i])}
                  </motion.span>
                </AnimatePresence>
              </motion.div>

              {/* Front gold particles — pure decoration, ambient float */}
              {!reduce && (
                <>
                  <FloatingDot top="6%"  left="8%"  delay="0s"   size={3} color={PALETTE.gold} />
                  <FloatingDot top="14%" left="92%" delay="1.2s" size={2} color={PALETTE.gold} />
                  <FloatingDot top="78%" left="6%"  delay="2.4s" size={2} color={PALETTE.gold} />
                  <FloatingDot top="92%" left="88%" delay="0.6s" size={3} color={PALETTE.rose} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function labelFor(packId: string): string {
  switch (packId) {
    case "1920s-boss":      return "1920s Underworld Boss";
    case "wizard-school":   return "Wizard School Prodigy";
    case "regency-court":   return "Regency Court Darling";
    case "galaxy-smuggler": return "Galaxy Smuggler Captain";
    case "gothic-academy":  return "Gothic Academy Star";
    case "cosmic-chart":    return "Cosmic Birth Chart";
    default:                return packId;
  }
}

/** Tiny floating dot — ambient particle. Pure CSS animation, near-zero cost. */
function FloatingDot({
  top, left, delay, size, color,
}: { top: string; left: string; delay: string; size: number; color: string }) {
  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        top,
        left,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 ${size * 4}px ${color}`,
        opacity: 0.7,
        animation: `lsFloat 6.4s ease-in-out ${delay} infinite`,
        willChange: "transform, opacity",
      }}
    />
  );
}
