import { useEffect, useRef, useState, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

// ─── Color palette as inline styles (CSS custom props) ───
const COLORS = {
  black: "#141210",
  ink: "#1f1c18",
  deep: "#2e2a24",
  warm: "#4d443b",
  earth: "#6e6259",
  muted: "#958779",
  faded: "#bfb2a3",
  sand: "#d6c8b6",
  cream: "#FFFDF5",
  cream2: "#faf4e8",
  cream3: "#f3eadb",
  rose: "#bf524a",
  roseLight: "#d4857e",
  gold: "#c4a265",
  pawColor: "rgba(181,104,94,0.2)",
};

// ─── Scroll-triggered animation hook ───
function useScrollReveal(options?: { threshold?: number; rootMargin?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: options?.threshold ?? 0.25, rootMargin: options?.rootMargin ?? "0px 0px -60px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

// ─── Paw print SVG component ───
const PawPrint = ({ style }: { style: React.CSSProperties }) => (
  <svg
    width="28"
    height="34"
    viewBox="0 0 28 34"
    fill="none"
    style={{ position: "absolute", pointerEvents: "none", ...style }}
  >
    <ellipse cx="14" cy="22" rx="7" ry="9" fill={COLORS.pawColor} />
    <ellipse cx="7" cy="10" rx="4" ry="5" fill={COLORS.pawColor} transform="rotate(-10 7 10)" />
    <ellipse cx="14" cy="6" rx="4" ry="5" fill={COLORS.pawColor} />
    <ellipse cx="21" cy="10" rx="4" ry="5" fill={COLORS.pawColor} transform="rotate(10 21 10)" />
  </svg>
);

// ─── Paw decorations for a section ───
const SectionPaws = ({ visible }: { visible: boolean }) => {
  return null;
};

// ─── Subtle paw traces between beats ───
const SubtlePaws = ({ variant = 0 }: { variant?: number }) => {
  const patterns = [
    [
      { left: "12%", top: -22, size: 18, opacity: 0.07, rotate: 175, flip: false },
      { right: "18%", top: -8, size: 14, opacity: 0.05, rotate: -170, flip: true },
    ],
    [
      { right: "14%", top: -25, size: 16, opacity: 0.06, rotate: 185, flip: true },
      { left: "22%", top: -6, size: 13, opacity: 0.05, rotate: 170, flip: false },
    ],
    [
      { left: "8%", top: -18, size: 15, opacity: 0.06, rotate: -175, flip: false },
      { right: "25%", top: -28, size: 18, opacity: 0.05, rotate: 180, flip: true },
    ],
    [
      { right: "10%", top: -15, size: 14, opacity: 0.07, rotate: 172, flip: true },
      { left: "30%", top: -24, size: 16, opacity: 0.05, rotate: -185, flip: false },
    ],
  ];
  const paws = patterns[variant % patterns.length];
  return (
    <div style={{ position: "relative", height: 0, overflow: "visible", pointerEvents: "none", zIndex: 1 }}>
      {paws.map((p, i) => (
        <svg key={i} width={p.size} height={p.size * 1.2} viewBox="0 0 28 34" fill="none"
          style={{
            position: "absolute",
            ...(p.left ? { left: p.left } : {}),
            ...(p.right ? { right: p.right } : {}),
            top: p.top, opacity: p.opacity,
            transform: `rotate(${p.rotate}deg)${p.flip ? " scaleX(-1)" : ""}`,
          }}
        >
          <ellipse cx="14" cy="22" rx="7" ry="9" fill={COLORS.pawColor} />
          <ellipse cx="7" cy="10" rx="4" ry="5" fill={COLORS.pawColor} transform="rotate(-10 7 10)" />
          <ellipse cx="14" cy="6" rx="4" ry="5" fill={COLORS.pawColor} />
          <ellipse cx="21" cy="10" rx="4" ry="5" fill={COLORS.pawColor} transform="rotate(10 21 10)" />
        </svg>
      ))}
    </div>
  );
};

// ─── Grain texture overlay ───
const GrainOverlay = () => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      pointerEvents: "none",
      opacity: 0.03,
      mixBlendMode: "multiply",
    }}
  >
    <svg width="100%" height="100%">
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  </div>
);

// ─── SVG Heart that draws itself ───
const DrawHeart = ({ visible }: { visible: boolean }) => (
  <svg viewBox="0 0 100 100" className="w-[55px] h-[55px] md:w-[80px] md:h-[80px] mt-[24px] md:mt-[50px] mx-auto block">
    <path
      d="M49.998,90.544c0,0,0,0,0.002,0c5.304-14.531,32.88-27.047,41.474-44.23C108.081,13.092,61.244-5.023,50,23.933C38.753-5.023-8.083,13.092,8.525,46.313C17.116,63.497,44.691,76.013,49.998,90.544z"
      fill="none"
      stroke={COLORS.rose}
      strokeOpacity={0.7}
      strokeWidth={4}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={visible ? 0 : 1}
      style={{ transition: "stroke-dashoffset 2.5s ease 0.6s" }}
    />
  </svg>
);

// ─── Wavy underline SVG ───
const WavyUnderline = ({ visible }: { visible: boolean }) => (
  <svg width="220" height="12" viewBox="0 0 220 12" style={{ display: "block", margin: "12px auto 0", maxWidth: "100%" }}>
    <path
      d="M2 8 Q 20 2, 40 8 Q 60 14, 80 8 Q 100 2, 120 8 Q 140 14, 160 8 Q 180 2, 200 8 Q 210 11, 218 8"
      fill="none"
      stroke={COLORS.rose}
      strokeOpacity={0.4}
      strokeWidth={2}
      strokeLinecap="round"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={visible ? 0 : 1}
      style={{ transition: "stroke-dashoffset 1.2s ease 0.5s" }}
    />
  </svg>
);

// ─── Animation helpers ───
const fadeUpStyle = (visible: boolean, delay = 0): React.CSSProperties => ({
  opacity: visible ? 1 : 0,
  transform: visible ? "translateY(0)" : "translateY(45px)",
  transition: `opacity 1.2s cubic-bezier(0.19,1,0.22,1) ${delay}s, transform 1.2s cubic-bezier(0.19,1,0.22,1) ${delay}s`,
});

const fadeOnlyStyle = (visible: boolean, delay = 0): React.CSSProperties => ({
  opacity: visible ? 1 : 0,
  transition: `opacity 1.4s ease ${delay}s`,
});

const scaleInStyle = (visible: boolean, delay = 0): React.CSSProperties => ({
  opacity: visible ? 1 : 0,
  transform: visible ? "scale(1)" : "scale(0.85)",
  transition: `opacity 1s ease ${delay}s, transform 1s ease ${delay}s`,
});

// ─── Section wrapper ───
const Beat = ({
  children,
  minHeight = "100vh",
  mobileMinHeight,
  background,
  className = "",
}: {
  children: (visible: boolean) => React.ReactNode;
  minHeight?: string;
  mobileMinHeight?: string;
  background?: string;
  className?: string;
}) => {
  const { ref, visible } = useScrollReveal();
  const mobile = useIsMobile();
  const resolvedMin = mobile && mobileMinHeight ? mobileMinHeight : minHeight;
  return (
    <section
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      style={{
        minHeight: resolvedMin,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: mobile
          ? "clamp(24px, 6vw, 80px) clamp(16px, 4vw, 28px)"
          : "clamp(40px, 8vw, 80px) clamp(16px, 4vw, 28px)",
        background: background ?? COLORS.cream,
      }}
    >
      <SectionPaws visible={visible} />
      <div style={{ maxWidth: 750, width: "100%", textAlign: "center" }}>
        {children(visible)}
      </div>
    </section>
  );
};

// ─── UGC Testimonials section ───
const UGCTestimonials = () => {
  const mobile = useIsMobile();
  const cardW = mobile ? 140 : 180;
  return (
    <section style={{ background: COLORS.cream, padding: mobile ? "clamp(24px, 6vw, 80px) clamp(16px, 4vw, 28px) clamp(20px, 4vw, 60px)" : "clamp(40px, 8vw, 80px) clamp(16px, 4vw, 28px) clamp(30px, 6vw, 60px)", textAlign: "center" }}>
      <p style={{ fontFamily: "Cormorant, Georgia, serif", fontWeight: 600, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.3em", color: COLORS.earth, marginBottom: 45 }}>
        WHAT PET PARENTS ARE SAYING
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: mobile ? 12 : 20 }}>
        {[0, 1, 2, 3].map((i) => {
          const { ref, visible } = useScrollReveal({ threshold: 0.15 });
          return (
            <div key={i} ref={ref} style={{ ...fadeUpStyle(visible, 0.3 + i * 0.3), width: cardW, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: "100%", aspectRatio: "9/16", borderRadius: 16, background: `linear-gradient(135deg, ${COLORS.cream3}, ${COLORS.sand})`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: COLORS.cream, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", fontSize: 40 }}>▶</div>
              </div>
              <div style={{ marginTop: 8, fontSize: "0.85rem", color: COLORS.gold, letterSpacing: "0.08em" }}>★★★★★</div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

// ─── Main component ───
interface EmotionalJourneyProps {
  trackCTAClick: (cta: string, location: string) => void;
}

export const EmotionalJourney = ({ trackCTAClick }: EmotionalJourneyProps) => {
  return (
    <div style={{ background: COLORS.cream, position: "relative" }}>
      <GrainOverlay />

      {/* ═══ BEAT 1 — "They Love You Without Conditions" ═══ */}
      <Beat mobileMinHeight="auto" background={`radial-gradient(circle at 50% 50%, ${COLORS.cream2}, ${COLORS.cream})`}>
        {(v) => (
          <h2
            style={{
              ...fadeUpStyle(v),
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: "clamp(1.6rem, 12vw, 6rem)",
              fontWeight: 400,
              color: COLORS.black,
              lineHeight: 0.98,
              letterSpacing: "-0.04em",
            }}
          >
            They Love You
            <br />
            <em>Without Conditions.</em>
          </h2>
        )}
      </Beat>

      {/* ═══ BEAT 2 — "On your best days…" ═══ */}
      <Beat minHeight="60vh" mobileMinHeight="35vh">
        {(v) => (
          <p
            style={{
              ...fadeUpStyle(v),
              fontFamily: "Cormorant, Georgia, serif",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: "clamp(1.5rem, 5.5vw, 2.2rem)",
              color: COLORS.earth,
              lineHeight: 1.75,
            }}
          >
            On your best days. On your worst days.
            <br />
            No judgement. No expectations.
          </p>
        )}
      </Beat>

      <SubtlePaws variant={0} />

      {/* ═══ BEAT 3 — "just" ═══ */}
      <Beat minHeight="65vh" mobileMinHeight="30vh">
        {(v) => (
          <p
            style={{
              ...fadeOnlyStyle(v),
              fontFamily: "Cormorant, Georgia, serif",
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: "clamp(1.6rem, 10vw, 5rem)",
              color: COLORS.sand,
              letterSpacing: "0.04em",
            }}
          >
            just
          </p>
        )}
      </Beat>

      {/* ═══ BEAT 4 — "loyalty, presence, and a heart…" ═══ */}
      <Beat minHeight="70vh" mobileMinHeight="45vh" background={`linear-gradient(to bottom, ${COLORS.cream}, ${COLORS.cream2})`}>
        {(v) => (
          <div>
            {["loyalty,", "presence,", "and a heart that doesn't leave."].map((line, i) => (
              <span
                key={i}
                style={{
                  ...fadeUpStyle(v, 0.2 + i * 0.35),
                  display: "block",
                  fontFamily: '"DM Serif Display", Georgia, serif',
                  fontSize: "clamp(1.6rem, 8vw, 3.8rem)",
                  color: COLORS.ink,
                  lineHeight: 1.2,
                  letterSpacing: "-0.025em",
                }}
              >
                {line}
              </span>
            ))}
            <DrawHeart visible={v} />
          </div>
        )}
      </Beat>

      <SubtlePaws variant={1} />

      {/* ═══ BEAT 5 — "They're Not 'Just a Pet'" ═══ */}
      <Beat mobileMinHeight="auto" background={`linear-gradient(to bottom, ${COLORS.cream2}, ${COLORS.cream3}, ${COLORS.cream2})`}>
        {(v) => (
          <div>
            <h2
              style={{
                ...fadeUpStyle(v),
                fontFamily: '"DM Serif Display", Georgia, serif',
                fontSize: "clamp(1.6rem, 11vw, 5.5rem)",
                color: COLORS.black,
                marginBottom: 40,
                lineHeight: 0.98,
                letterSpacing: "-0.04em",
              }}
            >
              They're Not "Just a Pet."
            </h2>
            <p
              style={{
                ...fadeUpStyle(v, 0.2),
                fontFamily: "Cormorant, Georgia, serif",
                fontWeight: 400,
                fontSize: "clamp(1.15rem, 4vw, 1.4rem)",
                color: COLORS.earth,
                lineHeight: 1.9,
                maxWidth: 480,
                margin: "0 auto",
              }}
            >
              They're a companion. A quiet protector. A soul that chose you — and stays,
              every single day, without ever being asked.
            </p>
          </div>
        )}
      </Beat>

      <SubtlePaws variant={2} />

      {/* ═══ BEAT 6 — The Incantation ═══ */}
      <Beat minHeight="80vh" mobileMinHeight="50vh" background={COLORS.cream2}>
        {(v) => (
          <div>
            {[
              { text: "The way they comfort you when you're hurting", size: "clamp(1.4rem, 5vw, 2rem)", color: COLORS.muted },
              { text: "The way they protect you when you're scared", size: "clamp(1.65rem, 6vw, 2.4rem)", color: COLORS.warm },
              { text: "The way they choose you, every single day", size: "clamp(1.95rem, 7vw, 2.9rem)", color: COLORS.ink },
            ].map((line, i) => (
              <p
                key={i}
                style={{
                  ...fadeUpStyle(v, 0.2 + i * 0.35),
                  fontFamily: '"DM Serif Display", Georgia, serif',
                  fontStyle: "italic",
                  fontSize: line.size,
                  color: line.color,
                  lineHeight: 1.4,
                  marginBottom: i < 2 ? 20 : 0,
                }}
              >
                {line.text}
              </p>
            ))}
          </div>
        )}
      </Beat>

      <SubtlePaws variant={3} />

      {/* ═══ BEAT 7 — "That means something." ═══ */}
      <Beat minHeight="60vh" mobileMinHeight="35vh" background={`linear-gradient(to bottom, ${COLORS.cream2}, ${COLORS.cream})`}>
        {(v) => (
          <div>
            <h2
              style={{
                ...scaleInStyle(v),
                fontFamily: '"DM Serif Display", Georgia, serif',
                fontSize: "clamp(1.6rem, 10vw, 5rem)",
                color: COLORS.black,
              }}
            >
              That means something.
            </h2>
            <div
              style={{
                width: 50,
                height: 2,
                background: COLORS.gold,
                opacity: v ? 0.5 : 0,
                margin: "30px auto 0",
                transition: "opacity 1s ease 0.5s",
              }}
            />
          </div>
        )}
      </Beat>

      {/* ═══ BEAT 8 — "This Is an Act of Love." ═══ */}
      <Beat mobileMinHeight="auto" background={`radial-gradient(circle at 50% 50%, ${COLORS.cream2}, ${COLORS.cream})`}>
        {(v) => (
          <div>
            <h2
              style={{
                ...fadeUpStyle(v),
                fontFamily: '"DM Serif Display", Georgia, serif',
                fontSize: "clamp(1.6rem, 11vw, 5.5rem)",
                color: COLORS.black,
                lineHeight: 1,
                marginBottom: 40,
              }}
            >
              This Is an
              <br />
              <em>Act of Love.</em>
            </h2>
            {[
              "Taking the time to understand them more deeply.",
              "To see who they are as an individual soul.",
              "To honour the bond you share.",
            ].map((line, i) => (
              <p
                key={i}
                style={{
                  ...fadeUpStyle(v, 0.3 + i * 0.15),
                  fontFamily: "Cormorant, Georgia, serif",
                  fontStyle: "italic",
                  fontSize: "clamp(1.25rem, 4.5vw, 1.6rem)",
                  color: COLORS.earth,
                  lineHeight: 1.75,
                  marginBottom: 8,
                }}
              >
                {line}
              </p>
            ))}
          </div>
        )}
      </Beat>

      <SubtlePaws variant={0} />

      {/* ═══ BEAT 9 — "I see you…" ═══ */}
      <Beat minHeight="75vh" mobileMinHeight="50vh">
        {(v) => {
          const lines = ["I see you.", "I appreciate you.", "I'm grateful you're in my life."];
          return (
            <div>
              <p
                style={{
                  ...fadeUpStyle(v),
                  fontFamily: "Cormorant, Georgia, serif",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.25em",
                  color: COLORS.earth,
                  marginBottom: 30,
                }}
              >
                It's a small way of saying:
              </p>
              <div style={{ position: "relative", display: "inline-block", textAlign: "left", paddingLeft: 30 }}>
                {/* Growing left border */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: 3,
                    height: v ? "100%" : "0%",
                    background: `linear-gradient(to bottom, ${COLORS.gold}, ${COLORS.rose})`,
                    transition: "height 1.5s ease 0.3s",
                  }}
                />
                {lines.map((line, i) => (
                  <p
                    key={i}
                    style={{
                      ...fadeUpStyle(v, 0.3 + i * 0.35),
                      fontFamily: '"DM Serif Display", Georgia, serif',
                      fontStyle: "italic",
                      fontSize: "clamp(1.8rem, 7vw, 3.2rem)",
                      color: COLORS.deep,
                      marginBottom: 12,
                      lineHeight: 1.2,
                    }}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          );
        }}
      </Beat>

      {/* ═══ BEAT 10 — Closing + Signature ═══ */}
      <Beat mobileMinHeight="auto">
        {(v) => (
          <div>
            <p
              style={{
                ...fadeUpStyle(v),
                fontFamily: "Cormorant, Georgia, serif",
                fontStyle: "italic",
                fontSize: "clamp(1.2rem, 4.2vw, 1.5rem)",
                color: COLORS.muted,
                marginBottom: 30,
              }}
            >
              Because when someone loves you unconditionally…
            </p>
            <p
              style={{
                ...fadeUpStyle(v, 0.25),
                fontFamily: '"DM Serif Display", Georgia, serif',
                fontSize: "clamp(1.8rem, 6.5vw, 2.6rem)",
                color: COLORS.deep,
                marginBottom: 24,
              }}
            >
              the most beautiful thing you can do
            </p>
            <p
              style={{
                opacity: v ? 1 : 0,
                filter: v ? "blur(0px)" : "blur(10px)",
                transition: "opacity 0.8s ease 0.5s, filter 0.8s ease 0.5s",
                fontFamily: "Caveat, cursive",
                fontSize: "clamp(1.6rem, 12vw, 6rem)",
                color: COLORS.ink,
              }}
            >
              is try to understand them in return.
            </p>
            <WavyUnderline visible={v} />
          </div>
        )}
      </Beat>

      <SubtlePaws variant={1} />

      <UGCTestimonials />

      {/* ═══ CTA SECTION ═══ */}
      <Beat mobileMinHeight="auto" background={`linear-gradient(to bottom, ${COLORS.cream}, ${COLORS.cream2}, ${COLORS.cream})`}>
        {(v) => (
          <div>
            <p
              style={{
                ...fadeUpStyle(v),
                fontFamily: "Cormorant, Georgia, serif",
                fontStyle: "italic",
                fontSize: "clamp(1.2rem, 4.5vw, 1.6rem)",
                color: COLORS.earth,
                marginBottom: 35,
              }}
            >
              Your pet loves you with everything they have.
            </p>
            <h2
              style={{
                ...fadeUpStyle(v, 0.2),
                fontFamily: '"DM Serif Display", Georgia, serif',
                fontSize: "clamp(1.6rem, 10vw, 4.8rem)",
                color: COLORS.black,
                lineHeight: 1,
                marginBottom: 50,
              }}
            >
              Now it's your turn
              <br />
              to understand them.
            </h2>
            <a
              href="/checkout"
              onClick={() => trackCTAClick("Get Their Reading", "emotional-journey-cta")}
              style={{
                ...fadeUpStyle(v, 0.4),
                display: "inline-block",
                background: COLORS.rose,
                color: "#fff",
                fontFamily: "Cormorant, Georgia, serif",
                fontWeight: 600,
                fontSize: "1.1rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                textDecoration: "none",
                padding: "20px 52px",
                borderRadius: 50,
                border: "none",
                cursor: "pointer",
                transition: "all 0.35s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 30px rgba(191,82,74,0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Get Their Reading
            </a>
            <p
              style={{
                ...fadeUpStyle(v, 0.55),
                fontFamily: "Cormorant, Georgia, serif",
                fontSize: "0.95rem",
                color: COLORS.muted,
                marginTop: 24,
                letterSpacing: "0.05em",
              }}
            >
              Personalised soul & astrology reading for your pet
            </p>
          </div>
        )}
      </Beat>
    </div>
  );
};
