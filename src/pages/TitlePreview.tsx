import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

const TITLE_TOP = "As it was written above,";
const TITLE_BOTTOM = "so it lives in them.";
const KICKER = "Their nature, set by the sky of their first breath.";

/* ── Option 1 — Kinetic Reveal (editorial line-mask) ───────────────── */
function VariantA() {
  const reduce = useReducedMotion();
  const lineReveal = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { y: "115%" },
          whileInView: { y: "0%" },
          viewport: { once: true, margin: "-12%" },
          transition: { duration: 0.95, ease: [0.16, 1, 0.3, 1] as const, delay },
        };
  return (
    <section className="tp-sec">
      <span className="tp-chip">Option 1 · Kinetic Reveal</span>
      <div className="tp-a">
        <h2 className="tp-a-title">
          <span className="tp-line"><motion.span className="tp-line-in" {...lineReveal(0)}>{TITLE_TOP}</motion.span></span>
          <motion.span
            className="tp-a-rule"
            initial={reduce ? undefined : { scaleX: 0 }}
            whileInView={reduce ? undefined : { scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
            aria-hidden="true"
          />
          <span className="tp-line"><motion.span className="tp-line-in tp-italic" {...lineReveal(0.16)}>{TITLE_BOTTOM}</motion.span></span>
        </h2>
        <motion.p
          className="tp-kicker"
          initial={reduce ? undefined : { opacity: 0, y: 16 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          {KICKER}
        </motion.p>
      </div>
    </section>
  );
}

/* ── Option 2 — Celestial Depth (parallax ghost words + starfield) ─── */
function VariantB() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const yUp = useTransform(scrollYProgress, [0, 1], [90, -90]);
  const yDown = useTransform(scrollYProgress, [0, 1], [-90, 90]);
  const yStars = useTransform(scrollYProgress, [0, 1], [130, -130]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.92, 1, 1.05]);
  const yTitle = useTransform(scrollYProgress, [0, 1], [40, -40]);
  return (
    <section ref={ref} className="tp-sec">
      <span className="tp-chip">Option 2 · Celestial Depth</span>
      <motion.div className="tp-b-stars" aria-hidden="true" style={reduce ? undefined : { y: yStars }} />
      <motion.span className="tp-ghost tp-ghost-top" aria-hidden="true" style={reduce ? { x: "-50%" } : { x: "-50%", y: yUp }}>ABOVE</motion.span>
      <motion.span className="tp-ghost tp-ghost-bot" aria-hidden="true" style={reduce ? { x: "-50%" } : { x: "-50%", y: yDown }}>BELOW</motion.span>
      <motion.div className="tp-b-inner" style={reduce ? undefined : { scale, y: yTitle }}>
        <h2 className="tp-b-title">
          {TITLE_TOP}
          <br />
          <em>{TITLE_BOTTOM}</em>
        </h2>
        <p className="tp-kicker">{KICKER}</p>
      </motion.div>
    </section>
  );
}

/* ── Option 3 — Mirror Horizon (glowing rule + reflection) ─────────── */
function VariantC() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const ruleW = useTransform(scrollYProgress, [0, 0.6], ["0%", "100%"]);
  const topY = useTransform(scrollYProgress, [0, 1], [34, -12]);
  const botY = useTransform(scrollYProgress, [0, 1], [12, -34]);
  return (
    <section ref={ref} className="tp-sec">
      <span className="tp-chip">Option 3 · Mirror Horizon</span>
      <div className="tp-c">
        <motion.h2 className="tp-c-top" style={reduce ? undefined : { y: topY }}>{TITLE_TOP}</motion.h2>
        <motion.span className="tp-c-rule" aria-hidden="true" style={reduce ? undefined : { width: ruleW }} />
        <motion.h2 className="tp-c-bot" style={reduce ? undefined : { y: botY }}>{TITLE_BOTTOM}</motion.h2>
        <span className="tp-c-reflect" aria-hidden="true">{TITLE_BOTTOM}</span>
        <p className="tp-kicker">{KICKER}</p>
      </div>
    </section>
  );
}

export default function TitlePreview() {
  return (
    <main className="tp-page">
      <header className="tp-head">
        <p>Title concepts — white text, scroll-animated. Tell me 1, 2 or 3.</p>
      </header>
      <VariantA />
      <VariantB />
      <VariantC />
      <style>{`
        .tp-page {
          background:
            radial-gradient(120% 90% at 50% -10%, rgba(60,44,86,0.5), transparent 55%),
            radial-gradient(90% 70% at 85% 20%, rgba(40,32,66,0.5), transparent 60%),
            #0a0810;
          color: #fff;
          min-height: 100svh;
        }
        .tp-head {
          position: sticky; top: 0; z-index: 20;
          padding: 12px 18px; text-align: center;
          background: rgba(10,8,16,0.7); backdrop-filter: blur(8px);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          font: 600 12px/1.4 Lato, system-ui, sans-serif;
          letter-spacing: 0.04em; color: rgba(255,255,255,0.7);
        }
        .tp-sec {
          position: relative; min-height: 100svh;
          display: grid; place-items: center;
          padding: 14vh 6vw; overflow: hidden;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .tp-chip {
          position: absolute; top: clamp(16px,3vw,30px); left: clamp(16px,3vw,30px);
          z-index: 5; font: 700 11px/1 Lato, system-ui, sans-serif;
          letter-spacing: 0.2em; text-transform: uppercase; color: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.2); padding: 6px 11px; border-radius: 999px;
        }
        .tp-kicker {
          margin-top: clamp(20px,3vw,32px); text-align: center;
          font: 400 clamp(0.95rem,1.7vw,1.2rem)/1.5 Lato, system-ui, sans-serif;
          letter-spacing: 0.03em; color: rgba(255,255,255,0.66);
        }
        .tp-italic { font-style: italic; }

        /* Option 1 */
        .tp-a { position: relative; z-index: 2; text-align: center; max-width: 20ch; margin-inline: auto; }
        .tp-a-title {
          display: grid; gap: clamp(4px,0.8vw,12px);
          font-family: "Playfair Display", Georgia, serif; font-weight: 500;
          color: #fff; line-height: 1.0;
        }
        .tp-line { display: block; overflow: hidden; padding: 0.06em 0; }
        .tp-line-in { display: block; font-size: clamp(2.1rem,7vw,4.5rem); will-change: transform; }
        .tp-a-rule {
          display: block; height: 1px; width: min(56%,300px); margin: clamp(8px,1.4vw,16px) auto;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent);
          transform-origin: center; will-change: transform;
        }

        /* Option 2 */
        .tp-b-inner { position: relative; z-index: 2; text-align: center; will-change: transform; }
        .tp-b-title {
          font-family: "Playfair Display", Georgia, serif; font-weight: 500; color: #fff;
          font-size: clamp(2.1rem,7vw,4.5rem); line-height: 1.06;
          text-shadow: 0 0 34px rgba(255,255,255,0.16);
        }
        .tp-b-title em { font-style: italic; color: #fff; }
        .tp-ghost {
          position: absolute; left: 50%; z-index: 0; pointer-events: none; white-space: nowrap;
          font-family: "Playfair Display", Georgia, serif; font-weight: 700;
          color: rgba(255,255,255,0.045); font-size: clamp(5rem,26vw,19rem); letter-spacing: 0.04em;
          will-change: transform;
        }
        .tp-ghost-top { top: 8%; }
        .tp-ghost-bot { bottom: 8%; }
        .tp-b-stars {
          position: absolute; inset: -16%; z-index: 0; opacity: 0.5; pointer-events: none;
          background-image:
            radial-gradient(1.5px 1.5px at 18% 26%, rgba(255,255,255,0.9), transparent),
            radial-gradient(1px 1px at 72% 20%, rgba(255,255,255,0.7), transparent),
            radial-gradient(1.4px 1.4px at 44% 70%, #fff, transparent),
            radial-gradient(1px 1px at 86% 62%, rgba(255,255,255,0.6), transparent),
            radial-gradient(1px 1px at 10% 80%, rgba(255,255,255,0.6), transparent);
          background-size: 320px 320px; will-change: transform;
        }

        /* Option 3 */
        .tp-c { position: relative; z-index: 2; text-align: center; }
        .tp-c-top, .tp-c-bot {
          font-family: "Playfair Display", Georgia, serif; font-weight: 500; color: #fff;
          font-size: clamp(2rem,6.6vw,4.3rem); line-height: 1.1; will-change: transform;
        }
        .tp-c-bot { font-style: italic; }
        .tp-c-rule {
          display: block; height: 1px; max-width: 420px; margin: clamp(10px,1.6vw,18px) auto;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
          box-shadow: 0 0 18px rgba(255,255,255,0.55); will-change: width;
        }
        .tp-c-reflect {
          display: block; font-family: "Playfair Display", Georgia, serif; font-style: italic;
          font-size: clamp(2rem,6.6vw,4.3rem); line-height: 1.1; color: #fff;
          transform: scaleY(-1); opacity: 0.13; margin-top: 3px; pointer-events: none;
          -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0.55), transparent 72%);
          mask-image: linear-gradient(to bottom, rgba(0,0,0,0.55), transparent 72%);
        }

        @media (max-width: 768px) {
          .tp-ghost { font-size: clamp(4rem,30vw,9rem); color: rgba(255,255,255,0.05); }
        }
        @media (prefers-reduced-motion: reduce) {
          .tp-line-in, .tp-a-rule, .tp-ghost, .tp-b-stars, .tp-b-inner,
          .tp-c-top, .tp-c-bot { transform: none !important; }
          .tp-c-rule { width: 100% !important; }
        }
      `}</style>
    </main>
  );
}
