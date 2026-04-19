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

const PRIZE_LABELS: Record<number, string> = {
  1: "10% Off",
  2: "+500 SoulSpeak Credits",
  3: "30% Off Gift",
  4: "15% Off",
  5: "Free Bond Upgrade",
  6: "20% Off",
  7: "30% Off Jackpot",
  8: "Free Horoscope Month",
};

const SECTOR_COUNT = 8;
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
  const [petName, setPetName] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [prize, setPrize] = useState<{ code: string; prizeLabel: string; slice: number; expiresAt: string; repeat: boolean } | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

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
        body: { email: trimmed, honeypot, petName: petName.trim() || undefined },
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
        className="relative w-full max-w-md rounded-2xl"
        style={{
          background: "var(--cream, #FFFDF5)",
          border: "1px solid rgba(196,162,101,0.25)",
          boxShadow: "0 30px 80px rgba(20,15,8,0.35), 0 0 0 1px rgba(196,162,101,0.12)",
          padding: "clamp(20px, 5vw, 32px)",
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
            {stage === "revealed" ? (prize?.repeat ? "Welcome back" : "The stars liked you") : "Spin for a Cosmic Gift"}
          </h2>
          {stage !== "revealed" && (
            <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.95rem", color: "var(--earth, #6e6259)", margin: 0, lineHeight: 1.55 }}>
              One spin, one gift, one soul. Enter your email and turn the wheel.
            </p>
          )}
        </div>

        {/* ── Wheel ────────────────────────────────────────── */}
        <div
          className="relative mx-auto"
          style={{ width: "min(320px, 80vw)", aspectRatio: "1 / 1", marginBottom: 16 }}
        >
          {/* Pointer */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute", top: -6, left: "50%", transform: "translateX(-50%)",
              width: 0, height: 0,
              borderLeft: "12px solid transparent",
              borderRight: "12px solid transparent",
              borderTop: "20px solid var(--rose, #bf524a)",
              filter: "drop-shadow(0 4px 6px rgba(191,82,74,0.35))",
              zIndex: 3,
            }}
          />
          {/* Hub */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
              width: 38, height: 38, borderRadius: "50%",
              background: "radial-gradient(circle at 35% 30%, #fff 0%, #f6e9c8 60%, #c4a265 100%)",
              border: "3px solid var(--cream, #FFFDF5)",
              boxShadow: "0 4px 14px rgba(0,0,0,0.18), inset 0 0 6px rgba(0,0,0,0.08)",
              zIndex: 2,
            }}
          />
          {/* Wheel */}
          <div
            ref={wheelRef}
            style={{
              width: "100%", height: "100%", borderRadius: "50%",
              transform: `rotate(${rotation}deg)`,
              transition: stage === "spinning"
                ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.17, 0.67, 0.21, 1)`
                : "none",
              boxShadow: "0 12px 40px rgba(20,15,8,0.18), 0 0 0 4px rgba(196,162,101,0.18), 0 0 0 5px rgba(196,162,101,0.4)",
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
                const toXY = (deg: number) => {
                  const rad = (deg * Math.PI) / 180;
                  return [Math.cos(rad) * r, Math.sin(rad) * r] as const;
                };
                const [x1, y1] = toXY(startAngle);
                const [x2, y2] = toXY(endAngle);
                const isAlt = i % 2 === 0;
                const fill = isAlt ? "#FFFDF5" : "#fbeedd";
                const stroke = "rgba(196,162,101,0.55)";

                const labelAngle = startAngle + SECTOR_DEG / 2;
                const [lx, ly] = (() => {
                  const rad = (labelAngle * Math.PI) / 180;
                  const lr = 62;
                  return [Math.cos(rad) * lr, Math.sin(rad) * lr] as const;
                })();
                const labelRotation = labelAngle + 90;
                const sliceNum = i + 1;
                const isJackpot = sliceNum === 7 || sliceNum === 8;

                return (
                  <g key={i}>
                    <path
                      d={`M 0 0 L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={1}
                    />
                    <text
                      x={lx}
                      y={ly}
                      transform={`rotate(${labelRotation}, ${lx}, ${ly})`}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{
                        fontFamily: '"DM Serif Display", Georgia, serif',
                        fontSize: 8.5,
                        fill: isJackpot ? "#bf524a" : "#1f1c18",
                        fontWeight: isJackpot ? 700 : 400,
                        letterSpacing: 0.2,
                      }}
                    >
                      {PRIZE_LABELS[sliceNum]}
                    </text>
                  </g>
                );
              })}
              {/* Inner gold ring */}
              <circle cx="0" cy="0" r="100" fill="none" stroke="#c4a265" strokeWidth="1.5" opacity="0.6" />
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
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && stage === "form") spin(); }}
              placeholder="your@email.com"
              disabled={stage === "spinning"}
              className="w-full px-4 py-3 rounded-xl outline-none mb-2"
              style={{
                fontFamily: "Cormorant, Georgia, serif",
                fontSize: "1rem",
                border: "1.5px solid var(--cream3, #f3eadb)",
                color: "var(--ink, #1f1c18)",
                background: stage === "spinning" ? "rgba(0,0,0,0.03)" : "#fff",
                minHeight: 48,
              }}
            />
            <input
              type="text"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              placeholder="Pet's name (optional)"
              disabled={stage === "spinning"}
              className="w-full px-4 py-3 rounded-xl outline-none mb-3"
              style={{
                fontFamily: "Cormorant, Georgia, serif",
                fontSize: "0.95rem",
                border: "1.5px solid var(--cream3, #f3eadb)",
                color: "var(--ink, #1f1c18)",
                background: stage === "spinning" ? "rgba(0,0,0,0.03)" : "#fff",
                minHeight: 44,
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
              {stage === "spinning" ? "Spinning…" : "Spin the Wheel ✨"}
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
                padding: "16px 14px",
                margin: "0 0 16px 0",
              }}
            >
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold, #c4a265)", margin: "0 0 6px 0", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
                Your code
              </p>
              <p style={{ fontFamily: '"Courier New", monospace', fontSize: "1.45rem", fontWeight: 700, letterSpacing: "0.18em", color: "var(--ink, #1f1c18)", margin: 0 }}>
                {prize?.code}
              </p>
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
              Use My Code →
            </button>
            <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.78rem", color: "var(--muted, #958779)", margin: "10px 0 0 0", lineHeight: 1.5 }}>
              Also sent to your inbox · Expires in 48 hours
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
