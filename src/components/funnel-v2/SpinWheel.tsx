import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Cosmic Wheel — email-gated lead-magnet popup.
 *
 * Animation is purely cosmetic: the winning sector is decided by the
 * `spin-wheel` edge function before the wheel even starts turning, then
 * we ease the rotation to land on that sector. Visitors can't tamper
 * with the prize by inspecting JS.
 *
 * Once revealed, the prize is also written to sessionStorage so
 * InlineCheckout can autofill the email + apply the coupon code on the
 * very next page interaction — zero re-typing for the visitor.
 */

// Two-line sector labels — top line is the headline number/word, bottom
// line is the qualifier. Short so they fit comfortably inside a 60°
// sector (six prizes total) without overflowing the arc.
const PRIZE_LABELS: Record<number, { top: string; bottom: string }> = {
  1: { top: "10%",   bottom: "OFF" },
  2: { top: "500",   bottom: "CREDITS" },
  3: { top: "15%",   bottom: "OFF" },
  4: { top: "25%",   bottom: "FRIEND" },
  5: { top: "30%",   bottom: "OFF" },
  6: { top: "EXTRA", bottom: "MONTH" },
};

// Sector colour rotation across all six wedges — picked so adjacent
// sectors (and slice 6 ↔ slice 1 wrap) always read as distinct.
// Slice 5 (30% off) overrides with rose-fill + white text so it pops
// as the marquee prize.
const SECTOR_FILLS: Record<number, string> = {
  1: "#FFFDF5", // cream
  2: "#fbeedd", // gold-tint
  3: "#fbe8e0", // rose-blush
  4: "#fff8ed", // ivory
  5: "#bf524a", // jackpot — rose primary
  6: "#fbeedd", // gold-tint (different from neighbour 1 cream + neighbour 5 rose)
};

const SECTOR_COUNT = 6;
const SECTOR_DEG = 360 / SECTOR_COUNT;
const SPIN_DURATION_MS = 5200;
const EXTRA_FULL_TURNS = 6;

type ApiResponse = {
  slice?: number;
  prizeLabel?: string;
  code?: string;
  expiresAt?: string;
  repeat?: boolean;
  error?: string;
};

export interface SpinWheelProps {
  open: boolean;
  onClose: () => void;
  /** Fires once the prize is revealed and the visitor clicks "Use my code". */
  onClaim?: (prize: { code: string; prizeLabel: string }) => void;
}

export const SpinWheel = ({ open, onClose, onClaim }: SpinWheelProps) => {
  type Stage = "form" | "spinning" | "revealed" | "error";
  const [stage, setStage] = useState<Stage>("form");
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [prize, setPrize] = useState<{ code: string; prizeLabel: string; slice: number; expiresAt: string; repeat: boolean } | null>(null);
  const [copied, setCopied] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Older browsers / insecure contexts. Fall back to a hidden input + execCommand.
      try {
        const ta = document.createElement("textarea");
        ta.value = code;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      } catch { /* give up silently — code is still on screen */ }
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && stage !== "spinning") onClose(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, stage]);

  if (!open) return null;

  const spin = async () => {
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
      setError("Please enter a valid email.");
      return;
    }

    setStage("spinning");

    let res: ApiResponse | null = null;
    try {
      const { data, error: invokeError } = await supabase.functions.invoke<ApiResponse>("spin-wheel", {
        body: { email: trimmed, honeypot },
      });
      if (invokeError) throw invokeError;
      res = data;
    } catch (e) {
      const msg = (e as Error)?.message || "";
      if (/429|too many|already spun/i.test(msg)) {
        setError("Looks like this device already spun. One spin per visitor.");
      } else {
        setError("Couldn't reach the wheel. Try again in a moment.");
      }
      setStage("form");
      return;
    }

    if (!res?.code || !res.slice || !res.prizeLabel || !res.expiresAt) {
      setError(res?.error || "Something went wrong. Try again.");
      setStage("form");
      return;
    }

    // Pointer sits at the top (12 o'clock = 0°). Sector N's centre lives
    // at angle (N-1)*45 + 22.5 measured clockwise from 0°. Rotating the
    // WHEEL clockwise by `360 - centre` brings that sector under the
    // pointer. Add a few full turns for drama and a small jitter inside
    // the sector so it doesn't always rest dead-centre.
    const sliceCentre = (res.slice - 1) * SECTOR_DEG + SECTOR_DEG / 2;
    const jitter = (Math.random() - 0.5) * (SECTOR_DEG * 0.55);
    const targetRotation = EXTRA_FULL_TURNS * 360 + (360 - sliceCentre + jitter);
    setRotation(targetRotation);

    const winningPrize = {
      code: res.code,
      prizeLabel: res.prizeLabel,
      slice: res.slice,
      expiresAt: res.expiresAt,
      repeat: !!res.repeat,
    };

    window.setTimeout(() => {
      setPrize(winningPrize);
      try {
        sessionStorage.setItem("ls_wheel_prize", JSON.stringify({
          email: trimmed,
          code: winningPrize.code,
          prizeLabel: winningPrize.prizeLabel,
          slice: winningPrize.slice,
          expiresAt: winningPrize.expiresAt,
          ts: Date.now(),
        }));
      } catch { /* ignore */ }
      try { localStorage.setItem("ls_wheel_shown", "1"); } catch { /* ignore */ }
      setStage("revealed");
    }, SPIN_DURATION_MS);
  };

  const handleClaim = () => {
    if (!prize) return;
    onClaim?.({ code: prize.code, prizeLabel: prize.prizeLabel });
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && stage !== "spinning") {
      try { localStorage.setItem("ls_wheel_shown", "1"); } catch { /* ignore */ }
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 10001, background: "rgba(20,18,16,0.55)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Cosmic Wheel"
    >
      <div
        className="relative w-full max-w-sm rounded-2xl"
        style={{
          background: "var(--cream, #FFFDF5)",
          border: "1px solid rgba(196,162,101,0.25)",
          boxShadow: "0 30px 80px rgba(20,15,8,0.35), 0 0 0 1px rgba(196,162,101,0.12)",
          padding: "clamp(16px, 4vw, 24px)",
          animation: "lsWheelIn 480ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {stage !== "spinning" && (
          <button
            type="button"
            onClick={() => { try { localStorage.setItem("ls_wheel_shown", "1"); } catch {} onClose(); }}
            aria-label="Close"
            className="absolute top-3 right-3 p-1.5 rounded-full transition-opacity hover:opacity-70"
            style={{ color: "var(--muted, #958779)" }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* ── Header ───────────────────────────────────────── */}
        <div className="text-center mb-4">
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold, #c4a265)", margin: 0, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
            The Cosmic Wheel
          </p>
          <h2
            style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: "clamp(1.4rem, 5vw, 1.75rem)",
              color: "var(--ink, #1f1c18)",
              margin: "10px 0 4px 0",
              lineHeight: 1.2,
            }}
          >
            {stage === "revealed" ? (prize?.repeat ? "Your gift is still here" : "The stars chose for you") : "Your Cosmic Gift Awaits"}
          </h2>
        </div>

        {/* ── Wheel ────────────────────────────────────────── */}
        <div
          className="relative mx-auto"
          style={{ width: "min(300px, 76vw)", aspectRatio: "1 / 1", marginBottom: 14 }}
        >
          {/* Pointer — chunky rose triangle with a tiny gold star inset.
              Sits ABOVE the wheel so the wheel's overflow can't clip it. */}
          <svg
            aria-hidden="true"
            viewBox="0 0 40 44"
            width="30"
            height="34"
            style={{
              position: "absolute", top: -6, left: "50%", transform: "translateX(-50%)",
              filter: "drop-shadow(0 4px 6px rgba(191,82,74,0.4))",
              zIndex: 3,
            }}
          >
            {/* Outer gold trim */}
            <path d="M20 42 L2 8 Q2 2 8 2 L32 2 Q38 2 38 8 Z" fill="#c4a265" />
            {/* Inner rose fill */}
            <path d="M20 38 L6 9 Q6 5 10 5 L30 5 Q34 5 34 9 Z" fill="#bf524a" />
            {/* Tiny cream star */}
            <path d="M20 13 L21.5 17 L26 17.7 L22.6 20.6 L23.7 25 L20 22.6 L16.3 25 L17.4 20.6 L14 17.7 L18.5 17 Z" fill="#FFFDF5" />
          </svg>

          {/* Hub — bigger, glassier, with a small rose star core */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
              width: 52, height: 52, borderRadius: "50%",
              background: "radial-gradient(circle at 30% 28%, #fff 0%, #fbeedd 45%, #d4b26b 90%, #b9954c 100%)",
              border: "3px solid var(--cream, #FFFDF5)",
              boxShadow: "0 5px 14px rgba(20,15,8,0.26), 0 0 0 1px rgba(196,162,101,0.55), inset 0 -2px 5px rgba(0,0,0,0.12), inset 0 2px 5px rgba(255,255,255,0.6)",
              zIndex: 2,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 22 22" aria-hidden="true">
              <path d="M11 1 L13.2 8.8 L21 11 L13.2 13.2 L11 21 L8.8 13.2 L1 11 L8.8 8.8 Z" fill="#bf524a" opacity="0.92" />
            </svg>
          </div>

          {/* Wheel */}
          <div
            ref={wheelRef}
            style={{
              width: "100%", height: "100%", borderRadius: "50%",
              transform: `rotate(${rotation}deg)`,
              transition: stage === "spinning"
                ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.17, 0.67, 0.21, 1)`
                : "none",
              boxShadow: "0 18px 56px rgba(20,15,8,0.32), 0 0 0 4px #c4a265, 0 0 0 6px rgba(196,162,101,0.25), 0 0 0 9px rgba(255,253,245,0.85), 0 0 0 11px rgba(196,162,101,0.35)",
              willChange: "transform",
            }}
          >
            <svg viewBox="-110 -110 220 220" width="100%" height="100%" aria-hidden="true">
              {Array.from({ length: SECTOR_COUNT }, (_, i) => {
                // SVG arc — start angle measured from -90° (12 o'clock)
                // so sector 1 sits in the top-right slice and we wind
                // CW from there. Matches the rotation maths in spin().
                const startAngle = -90 + i * SECTOR_DEG;
                const endAngle = startAngle + SECTOR_DEG;
                const r = 100;
                const toXY = (deg: number, rad_ = r) => {
                  const rad = (deg * Math.PI) / 180;
                  return [Math.cos(rad) * rad_, Math.sin(rad) * rad_] as const;
                };
                const [x1, y1] = toXY(startAngle);
                const [x2, y2] = toXY(endAngle);

                const sliceNum = i + 1;
                const isJackpot = sliceNum === 5;
                const fill = SECTOR_FILLS[sliceNum];
                const textFill = isJackpot ? "#FFFDF5" : "#1f1c18";
                const subFill = isJackpot ? "#fbeedd" : "#7a6a60";

                const labelAngle = startAngle + SECTOR_DEG / 2;
                const [lx, ly] = toXY(labelAngle, 60);
                // Rotate text so it reads outward (radially), but keep
                // the baseline horizontal-to-the-radius so two lines
                // stack correctly. +90 puts the baseline tangent → rotate
                // by labelAngle+90 so the text reads from inside out.
                const labelRotation = labelAngle + 90;
                const labels = PRIZE_LABELS[sliceNum];

                // Stars at sector boundaries — tiny constellation dots
                // sitting just inside the gold rim so the wheel reads as
                // cosmic, not just generic. Drawn for HALF the sectors
                // (every other boundary) so the pattern feels rhythmic
                // rather than busy.
                const [sx, sy] = toXY(startAngle, 92);
                const drawBoundaryStar = i % 2 === 0;

                return (
                  <g key={i}>
                    <path
                      d={`M 0 0 L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
                      fill={fill}
                      stroke="#FFFDF5"
                      strokeWidth={1.5}
                    />
                    {/* Subtle inner shadow ring on jackpot for depth */}
                    {isJackpot && (
                      <path
                        d={`M 0 0 L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
                        fill="url(#jackpotGlow)"
                        opacity={0.6}
                      />
                    )}
                    <text
                      x={lx}
                      y={ly}
                      transform={`rotate(${labelRotation}, ${lx}, ${ly})`}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{ pointerEvents: "none" }}
                    >
                      <tspan
                        x={lx}
                        dy={-5}
                        style={{
                          fontFamily: '"DM Serif Display", Georgia, serif',
                          fontSize: 14,
                          fontWeight: 400,
                          fill: textFill,
                          letterSpacing: 0.4,
                        }}
                      >
                        {labels.top}
                      </tspan>
                      <tspan
                        x={lx}
                        dy={13}
                        style={{
                          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                          fontSize: 6.4,
                          fontWeight: 700,
                          fill: subFill,
                          letterSpacing: 1.6,
                        }}
                      >
                        {labels.bottom}
                      </tspan>
                    </text>
                    {drawBoundaryStar && (
                      <path
                        d={`M ${sx} ${sy - 2.6} L ${sx + 0.7} ${sy - 0.7} L ${sx + 2.6} ${sy} L ${sx + 0.7} ${sy + 0.7} L ${sx} ${sy + 2.6} L ${sx - 0.7} ${sy + 0.7} L ${sx - 2.6} ${sy} L ${sx - 0.7} ${sy - 0.7} Z`}
                        fill="#c4a265"
                        opacity={0.9}
                      />
                    )}
                  </g>
                );
              })}

              <defs>
                <radialGradient id="jackpotGlow" cx="0.5" cy="0.5" r="0.6">
                  <stop offset="0%" stopColor="#FFFDF5" stopOpacity="0" />
                  <stop offset="100%" stopColor="#000" stopOpacity="0.35" />
                </radialGradient>
              </defs>

              {/* Inner gold ring — sits just inside the sector arc to
                  define the wheel's edge cleanly even before the outer
                  box-shadow band kicks in. */}
              <circle cx="0" cy="0" r="100" fill="none" stroke="#c4a265" strokeWidth="2" />
              <circle cx="0" cy="0" r="98" fill="none" stroke="rgba(196,162,101,0.4)" strokeWidth="1" />
            </svg>
          </div>
        </div>

        {/* ── Body — varies by stage ──────────────────────── */}
        {stage !== "revealed" ? (
          <>
            {/* Honeypot — invisible to humans, bots fill it */}
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              style={{ position: "absolute", left: -9999, opacity: 0, pointerEvents: "none", height: 0 }}
              aria-hidden="true"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                const v = e.target.value;
                setEmail(v);
                // Persist as the visitor types so InlineCheckout can
                // prefill on /checkout even if they close the wheel
                // without spinning. Only saved when format looks valid
                // to avoid junk like "a" landing in the field later.
                if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())) {
                  try { sessionStorage.setItem("ls_wheel_email", v.trim().toLowerCase()); } catch { /* ignore */ }
                }
              }}
              onKeyDown={(e) => { if (e.key === "Enter" && stage === "form") spin(); }}
              placeholder="your@email.com"
              disabled={stage === "spinning"}
              autoFocus
              className="w-full px-4 py-3.5 rounded-xl outline-none mb-3"
              style={{
                fontFamily: "Cormorant, Georgia, serif",
                fontSize: "1.05rem",
                textAlign: "center",
                border: "1.5px solid var(--cream3, #f3eadb)",
                color: "var(--ink, #1f1c18)",
                background: stage === "spinning" ? "rgba(0,0,0,0.03)" : "#fff",
                minHeight: 52,
              }}
            />
            {error && (
              <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.88rem", color: "var(--rose, #bf524a)", margin: "0 0 10px 0", textAlign: "center" }}>
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={spin}
              disabled={stage === "spinning"}
              className="w-full py-3.5 rounded-full text-white font-bold transition-all duration-200 active:scale-[0.98]"
              style={{
                fontFamily: "Cormorant, Georgia, serif",
                fontSize: "1rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                background: stage === "spinning" ? "var(--muted, #958779)" : "var(--rose, #bf524a)",
                boxShadow: "0 4px 16px rgba(191,82,74,0.25)",
                minHeight: 52,
                cursor: stage === "spinning" ? "wait" : "pointer",
              }}
            >
              {stage === "spinning" ? "Spinning…" : "Reveal My Gift ✨"}
            </button>
            <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.74rem", color: "var(--faded, #bfb2a3)", textAlign: "center", margin: "10px 0 0 0", lineHeight: 1.5 }}>
              One spin per soul · 48-hour gift · No spam, unsubscribe anytime
            </p>
          </>
        ) : (
          <div className="text-center" style={{ animation: "lsRevealIn 520ms cubic-bezier(0.22,1,0.36,1)" }}>
            <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "1.05rem", color: "var(--earth, #6e6259)", margin: "0 0 8px 0", lineHeight: 1.55 }}>
              You won
            </p>
            <h3 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "clamp(1.4rem, 4.5vw, 1.75rem)", color: "var(--rose, #bf524a)", margin: "0 0 16px 0", lineHeight: 1.2 }}>
              {prize?.prizeLabel}
            </h3>
            <div
              style={{
                background: "#faf4e8",
                border: "1px dashed var(--gold, #c4a265)",
                borderRadius: 12,
                padding: "16px 14px 14px",
                margin: "0 0 14px 0",
              }}
            >
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold, #c4a265)", margin: "0 0 6px 0", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
                Your code
              </p>
              <p style={{ fontFamily: '"Courier New", monospace', fontSize: "1.45rem", fontWeight: 700, letterSpacing: "0.18em", color: "var(--ink, #1f1c18)", margin: "0 0 10px 0" }}>
                {prize?.code}
              </p>
              <button
                type="button"
                onClick={() => prize && copyCode(prize.code)}
                aria-live="polite"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 active:scale-[0.97]"
                style={{
                  fontFamily: "Cormorant, Georgia, serif",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: copied ? "#fff" : "var(--gold, #c4a265)",
                  background: copied ? "var(--gold, #c4a265)" : "transparent",
                  border: "1.5px solid var(--gold, #c4a265)",
                  cursor: "pointer",
                  minHeight: 32,
                }}
              >
                {copied ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <rect x="9" y="9" width="11" height="11" rx="2" />
                      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                    </svg>
                    Copy code
                  </>
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={handleClaim}
              className="w-full py-3.5 rounded-full text-white font-bold transition-all duration-200 active:scale-[0.98] hover:-translate-y-0.5"
              style={{
                fontFamily: "Cormorant, Georgia, serif",
                fontSize: "1rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                background: "var(--rose, #bf524a)",
                boxShadow: "0 4px 18px rgba(191,82,74,0.28)",
                minHeight: 52,
              }}
            >
              Apply at Checkout →
            </button>
            <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.78rem", color: "var(--muted, #958779)", margin: "10px 0 0 0", lineHeight: 1.5 }}>
              Code shown above ↑ · Also emailed as backup · Expires in 48 hours
            </p>
          </div>
        )}

        <style>{`
          @keyframes lsWheelIn {
            from { opacity: 0; transform: scale(0.92) translateY(10px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes lsRevealIn {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @media (prefers-reduced-motion: reduce) {
            .ls-wheel-anim, [data-ls-wheel] { animation: none !important; transition: none !important; }
          }
        `}</style>
      </div>
    </div>
  );
};

/* ───────────────────────────────────────────────────────────────────────
   FloatingPrizeChip — corner reminder of the won prize
   ─────────────────────────────────────────────────────────────────────── */

export interface FloatingPrizeChipProps {
  /** Called when the visitor taps "Use" — parent should scroll to checkout. */
  onUse: () => void;
  /** Called when the visitor explicitly dismisses the chip. */
  onDismiss: () => void;
}

/**
 * After the wheel modal closes, this small chip pins itself to the bottom
 * of the viewport so the code is always visible while the visitor reads
 * the rest of the page. Reads the same `ls_wheel_prize` sessionStorage
 * key SpinWheel writes — renders nothing if no prize was won, expired,
 * or sessionStorage is empty.
 */
export const FloatingPrizeChip = ({ onUse, onDismiss }: FloatingPrizeChipProps) => {
  const [prize, setPrize] = useState<{ code: string; prizeLabel: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let raw: string | null = null;
    try { raw = sessionStorage.getItem("ls_wheel_prize"); } catch { return; }
    if (!raw) return;
    let parsed: { code?: string; prizeLabel?: string; expiresAt?: string } | null = null;
    try { parsed = JSON.parse(raw); } catch { return; }
    if (!parsed?.code || !parsed?.prizeLabel) return;
    if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() < Date.now()) return;
    setPrize({ code: parsed.code, prizeLabel: parsed.prizeLabel });
  }, []);

  if (!prize) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prize.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { /* silently noop */ }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        // Sits ABOVE the mobile sticky CTA (which uses bottom: 0 + padding).
        // 92px gives clearance for the sticky bar's height + safe-area inset.
        bottom: "max(20px, env(safe-area-inset-bottom, 0px))",
        right: 16,
        left: "auto",
        maxWidth: "min(340px, calc(100vw - 32px))",
        zIndex: 50,
        background: "var(--cream, #FFFDF5)",
        border: "1px solid rgba(196,162,101,0.4)",
        borderRadius: 14,
        boxShadow: "0 12px 36px rgba(20,15,8,0.18), 0 0 0 1px rgba(196,162,101,0.08)",
        padding: "12px 14px",
        animation: "lsChipIn 460ms cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss cosmic gift reminder"
        style={{
          position: "absolute",
          top: 6,
          right: 6,
          width: 22,
          height: 22,
          padding: 0,
          background: "transparent",
          border: "none",
          color: "var(--muted, #958779)",
          cursor: "pointer",
          fontSize: 14,
          lineHeight: 1,
          opacity: 0.7,
        }}
      >
        ✕
      </button>
      <p style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: "var(--gold, #c4a265)",
        margin: 0,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>
        Your Cosmic Gift
      </p>
      <p style={{
        fontFamily: '"DM Serif Display", Georgia, serif',
        fontSize: "0.95rem",
        color: "var(--ink, #1f1c18)",
        margin: "2px 0 8px 0",
        lineHeight: 1.25,
        paddingRight: 16,
      }}>
        {prize.prizeLabel}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          style={{
            flex: 1,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "8px 10px",
            borderRadius: 8,
            background: copied ? "var(--gold, #c4a265)" : "#faf4e8",
            color: copied ? "#fff" : "var(--ink, #1f1c18)",
            border: "1px dashed var(--gold, #c4a265)",
            fontFamily: '"Courier New", monospace',
            fontSize: "0.82rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            cursor: "pointer",
            minHeight: 36,
            transition: "background 200ms ease, color 200ms ease",
          }}
        >
          {copied ? "Copied ✓" : prize.code}
        </button>
        <button
          type="button"
          onClick={onUse}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            background: "var(--rose, #bf524a)",
            color: "#fff",
            border: "none",
            fontFamily: "Cormorant, Georgia, serif",
            fontSize: "0.85rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            cursor: "pointer",
            minHeight: 36,
          }}
        >
          Use →
        </button>
      </div>
      <style>{`
        @keyframes lsChipIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          [role="status"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
};
