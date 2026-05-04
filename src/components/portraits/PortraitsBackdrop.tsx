/**
 * PortraitsBackdrop — soft gradient-orb wallpaper.
 *
 * Premium ambient atmosphere via 5 large blurred radial orbs (rose, gold,
 * cream, blush) drifting at different rates as the user scrolls.
 *
 * This is the high-end aesthetic move (Awwwards-grade landing pages):
 * fewer, bigger, softer shapes — not scattered noise dots.
 *
 * Performance: every orb is a fixed-size div with `filter: blur()` set ONCE
 * at mount. We only animate `transform` (translate3d via framer's `y`).
 * Reduced-motion: orbs static (still visible, just no drift).
 *
 * Mobile: blur radius halved + 1 fewer orb to keep paint cost down.
 */
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

interface OrbDef {
  /** css color or rgba */
  color: string;
  /** position keyed off viewport */
  top: string;
  left: string;
  size: string;
  /** how far the orb drifts over the entire scroll length, in px */
  drift: number;
  /** mobile: drop this orb if true */
  desktopOnly?: boolean;
}

const ORBS: OrbDef[] = [
  // Rose top-right — anchor brand colour, slow drift
  { color: "#bf524a", top: "-10%", left: "60%", size: "min(720px, 80vw)", drift: -180 },
  // Gold left-mid — warm balance, fastest drift
  { color: "#c4a265", top: "30%",  left: "-10%", size: "min(640px, 75vw)", drift: -560 },
  // Blush bottom-right — secondary rose echo, mid drift
  { color: "#e8a59f", top: "55%",  left: "55%",  size: "min(580px, 70vw)", drift: -360 },
  // Cool ink bottom-left — quiet anchor, slow drift
  { color: "#1c1c1c", top: "85%",  left: "-5%",  size: "min(420px, 60vw)", drift: -120, desktopOnly: true },
  // Cream-gold top accent — hero halo echo, fast drift
  { color: "#d4b67a", top: "-20%", left: "10%",  size: "min(360px, 55vw)", drift: -640, desktopOnly: true },
];

export function PortraitsBackdrop() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();

  const isMobile =
    typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;

  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0, background: "#ffffff" }}
    >
      {ORBS.map((orb, idx) => {
        if (orb.desktopOnly && isMobile) return null;
        return <Orb key={idx} orb={orb} reduce={!!reduce} scrollY={scrollY} isMobile={isMobile} />;
      })}
    </div>
  );
}

function Orb({
  orb,
  reduce,
  scrollY,
  isMobile,
}: {
  orb: OrbDef;
  reduce: boolean;
  scrollY: ReturnType<typeof useScroll>["scrollY"];
  isMobile: boolean;
}) {
  const k = isMobile ? 0.5 : 1;
  const y = useTransform(scrollY, [0, 6000], [0, orb.drift * k]);

  return (
    <motion.div
      style={{
        position: "absolute",
        top: orb.top,
        left: orb.left,
        width: orb.size,
        height: orb.size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${orb.color} 0%, ${orb.color}00 65%)`,
        opacity: isMobile ? 0.18 : 0.28,
        filter: `blur(${isMobile ? 60 : 110}px)`,
        willChange: "transform",
        ...(reduce ? {} : { y }),
      }}
    />
  );
}
