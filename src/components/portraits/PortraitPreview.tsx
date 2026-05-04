/**
 * PortraitPreview — cinematic reveal sequence.
 *
 * Choreography (the brand-promise moment — fires when status changes):
 *
 *   IDLE        → minimal placeholder ("Pick a character to see the preview")
 *
 *   GENERATING  → A. BlackDrop slides down from top to cover preview (180ms)
 *                 B. 14-point star burst radiates from centre with stagger
 *                    (each star travels ~140px outward, fades as it reaches edge)
 *                 C. Cormorant whisper "Stepping them into the world…" pulses
 *                 D. Soft gold halo pulse hints the reveal is coming
 *
 *   READY       → A. Portrait fades up from scale 1.06 → 1 (1.1s, quint-out)
 *                 B. Gold halo bloom expands from 0 → 1.4 → 1 (haloIn)
 *                 C. Micro camera-shake settle (140ms, 4 frames)
 *                 D. Halo eases into ambient breathing loop
 *
 *   ERROR       → clean message, no theatrics
 *
 * Reduced-motion: all transforms disabled, opacity-only fade. Stars + shake
 * removed entirely. The cinematic moment becomes a quiet cross-fade.
 */
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { PALETTE, cormorantItalic, EASE } from "./tokens";

interface PortraitPreviewProps {
  status: "idle" | "generating" | "ready" | "error";
  previewUrl: string | null;
  errorMsg?: string | null;
  /** Optional CTA shown in the error state (e.g. "Try Templates instead"). */
  errorCta?: { label: string; href: string } | null;
}

export function PortraitPreview({ status, previewUrl, errorMsg, errorCta }: PortraitPreviewProps) {
  return (
    <div
      className="relative rounded-sm overflow-hidden mx-auto aspect-[4/5]"
      style={{
        maxWidth: "320px",
        background: `radial-gradient(ellipse at center, ${PALETTE.cosmosMid} 0%, ${PALETTE.cosmos} 72%)`,
        border: `1px solid ${PALETTE.sand}`,
        boxShadow: "inset 0 0 60px rgba(0, 0, 0, 0.45)",
      }}
    >
      <AnimatePresence mode="wait">
        {status === "idle" && <IdleState key="idle" />}
        {status === "generating" && <GeneratingState key="generating" />}
        {status === "ready" && previewUrl && <ReadyState key="ready" url={previewUrl} />}
        {status === "error" && <ErrorState key="error" errorMsg={errorMsg} cta={errorCta} />}
      </AnimatePresence>
    </div>
  );
}

/* ─── IDLE ──────────────────────────────────────────────────────────── */
function IdleState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 flex items-center justify-center text-center px-6"
    >
      <p
        style={{
          ...cormorantItalic("17px"),
          color: "#7a6e62",
          textWrap: "pretty",
        }}
      >
        Pick a character to see the preview
      </p>
    </motion.div>
  );
}

/* ─── GENERATING — black drop + star burst + whisper ───────────────── */
function GeneratingState() {
  const reduce = useReducedMotion();

  // 14 stars with stable random angles + distances (memoised so they
  // don't reshuffle every render).
  const stars = useMemo(() => {
    return Array.from({ length: 14 }).map((_, idx) => {
      const angle = (idx / 14) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 110 + Math.random() * 60;
      return {
        idx,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        delay: Math.random() * 0.35,
        size: 2 + Math.random() * 2,
      };
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="absolute inset-0"
    >
      {/* Black drop — slides from top, covers everything */}
      {!reduce && (
        <motion.div
          initial={{ y: "-100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.45, ease: EASE.inOut }}
          className="absolute inset-0"
          style={{ background: PALETTE.cosmos }}
        />
      )}

      {/* Star burst — radiates from center */}
      {!reduce && (
        <div
          className="absolute"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
          aria-hidden
        >
          {stars.map((s) => (
            <motion.span
              key={s.idx}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
              animate={{
                x: [0, s.dx],
                y: [0, s.dy],
                opacity: [0, 1, 0],
                scale: [0, 1, 0.4],
              }}
              transition={{
                duration: 1.6,
                delay: 0.18 + s.delay,
                repeat: Infinity,
                repeatDelay: 0.8,
                ease: EASE.out,
              }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: `${s.size}px`,
                height: `${s.size}px`,
                borderRadius: "50%",
                background: PALETTE.goldSoft,
                boxShadow: `0 0 ${s.size * 5}px ${PALETTE.goldSoft}`,
                willChange: "transform, opacity",
              }}
            />
          ))}
        </div>
      )}

      {/* Soft gold halo pulse hint */}
      {!reduce && (
        <motion.div
          aria-hidden
          className="absolute"
          style={{
            top: "50%",
            left: "50%",
            width: "65%",
            height: "65%",
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(circle, ${PALETTE.goldSoft}33 0%, transparent 60%)`,
            filter: "blur(12px)",
            pointerEvents: "none",
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Cormorant whisper, centered */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: [0.55, 1, 0.55], y: 0 }}
          transition={{
            opacity: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
            y: { duration: 0.6, ease: EASE.out },
          }}
          style={{
            ...cormorantItalic("18px"),
            color: PALETTE.cream,
            textWrap: "pretty",
            maxWidth: "220px",
          }}
        >
          Stepping them into the world…
        </motion.p>
      </div>
    </motion.div>
  );
}

/* ─── READY — portrait fades up + gold halo bloom + micro-shake ─────── */
function ReadyState({ url }: { url: string }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0"
    >
      {/* Gold halo bloom — expands then settles, then breathes */}
      {!reduce && (
        <motion.div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: "50%",
            left: "50%",
            width: "110%",
            height: "110%",
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(circle, ${PALETTE.goldSoft}66 0%, ${PALETTE.goldSoft}1a 35%, transparent 65%)`,
            filter: "blur(18px)",
            mixBlendMode: "screen",
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.4, 1], opacity: [0, 0.95, 0.4] }}
          transition={{ duration: 1.4, ease: EASE.out }}
        />
      )}

      {/* Portrait — fades up + scale settle + micro-shake on settle */}
      <motion.img
        src={url}
        alt="Your pet — preview portrait"
        initial={{ opacity: 0, scale: 1.06 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, ease: EASE.out, delay: 0.15 }}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          boxShadow: "inset 0 0 80px rgba(212, 182, 122, 0.25)",
          animation: reduce ? undefined : "lsSettleShake 140ms ease-in-out 1.18s 1",
        }}
      />

      {/* Inner border glow that pulses once on land */}
      {!reduce && (
        <motion.div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.7, 0] }}
          transition={{ duration: 1.6, delay: 1.2, ease: "easeOut" }}
          style={{ boxShadow: `inset 0 0 0 1px ${PALETTE.goldSoft}` }}
        />
      )}
    </motion.div>
  );
}

/* ─── ERROR ─────────────────────────────────────────────────────────── */
function ErrorState({ errorMsg, cta }: { errorMsg?: string | null; cta?: { label: string; href: string } | null }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
    >
      <p
        style={{ ...cormorantItalic("17px"), color: "#e8c8b0", textWrap: "pretty" }}
      >
        {cta
          ? "AI portrait service is paused for a moment."
          : "Preview didn't take. Try a different photo or character?"}
      </p>
      {errorMsg && !cta && (
        <p className="mt-3 text-xs" style={{ color: "#9a8a7a" }}>
          {errorMsg}
        </p>
      )}
      {cta && (
        <a
          href={cta.href}
          className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-full transition-opacity hover:opacity-90"
          style={{
            background: "#e8c8b0",
            color: "#2a1c14",
            fontFamily: "Assistant, system-ui, sans-serif",
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.04em",
          }}
        >
          {cta.label} →
        </a>
      )}
    </motion.div>
  );
}
