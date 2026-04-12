import { useEffect, useRef, useState } from "react";

function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold, rootMargin: "0px 0px -30px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ── Pet wallpaper — repeating silhouettes behind the hero quote ──
 * Simple original SVG silhouettes (dog, cat, rabbit, bird, fish, horse,
 * hamster, turtle, paw prints) tiled as a low-opacity pattern. Inline
 * SVG so it's a single paint, no extra network request, GPU-friendly. */
const PetWallpaper = () => (
  <div
    aria-hidden="true"
    className="absolute inset-0 pointer-events-none"
    style={{
      backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(PET_PATTERN_SVG)}")`,
      backgroundRepeat: "repeat",
      backgroundSize: "280px 280px",
      opacity: 0.14,
    }}
  />
);

const PET_PATTERN_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='280' height='280' viewBox='0 0 280 280'>
<g fill='none' stroke='%23c4a265' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'>
<g transform='translate(30 40)'>
<circle cx='6' cy='6' r='4'/><circle cx='16' cy='4' r='3.2'/><circle cx='4' cy='14' r='3'/><circle cx='18' cy='14' r='3'/><ellipse cx='11' cy='22' rx='6' ry='5'/>
</g>
<g transform='translate(110 30)'>
<path d='M0 14c0-7 5-12 12-12s12 5 12 12c0 4-3 6-6 6H6c-3 0-6-2-6-6z'/>
<path d='M4 2l3 6M20 2l-3 6'/>
<circle cx='9' cy='13' r='0.8' fill='%23c4a265'/><circle cx='15' cy='13' r='0.8' fill='%23c4a265'/>
<path d='M10 17l2 2 2-2'/>
</g>
<g transform='translate(200 50)'>
<ellipse cx='12' cy='18' rx='8' ry='6'/>
<path d='M8 13V4c0-1 .8-1.6 1.6-1.2l1.4.7c.6.3 1.4.3 2 0l1.4-.7c.8-.4 1.6.2 1.6 1.2v9'/>
<circle cx='10' cy='17' r='0.7' fill='%23c4a265'/><circle cx='14' cy='17' r='0.7' fill='%23c4a265'/>
</g>
<g transform='translate(50 130)'>
<path d='M0 8c0-4 4-7 9-7s9 3 9 7-4 7-9 7c-2 0-4-.5-5.5-1.3L0 16z'/>
<circle cx='7' cy='8' r='0.8' fill='%23c4a265'/><circle cx='12' cy='8' r='0.8' fill='%23c4a265'/>
<path d='M13 2l4-1'/>
</g>
<g transform='translate(160 120)'>
<path d='M0 10c4-8 14-8 18 0-4 8-14 8-18 0z'/>
<path d='M18 10l6-3v6z' fill='%23c4a265' stroke='none' opacity='0.9'/>
<circle cx='5' cy='9' r='0.8' fill='%23c4a265'/>
</g>
<g transform='translate(230 140)'>
<path d='M8 20c-4-1-6-5-6-9 0-6 4-11 10-11s10 5 10 11'/>
<path d='M14 4c-2-3-2-4 0-4s2 1 0 4'/>
<path d='M6 14h12'/>
</g>
<g transform='translate(30 210)'>
<ellipse cx='5' cy='5' rx='2.5' ry='3.2'/><ellipse cx='13' cy='3' rx='2.5' ry='3.2'/><ellipse cx='2' cy='11' rx='2.2' ry='2.8'/><ellipse cx='16' cy='11' rx='2.2' ry='2.8'/><ellipse cx='9' cy='17' rx='5' ry='4'/>
</g>
<g transform='translate(120 200)'>
<ellipse cx='10' cy='12' rx='10' ry='6'/>
<circle cx='10' cy='10' r='4'/>
<path d='M10 6c0-2 2-3 4-3'/>
<circle cx='8' cy='10' r='0.6' fill='%23c4a265'/>
</g>
<g transform='translate(210 220)'>
<path d='M2 6c6-5 14-5 18 0-2 4-6 6-9 6s-7-2-9-6z'/>
<path d='M3 7c-3 0-3 4 0 4'/>
<circle cx='15' cy='7' r='0.7' fill='%23c4a265'/>
</g>
</g>
</svg>`;

/* ── VSOP Credibility — warm authority ── */
const VsopCredibility = () => (
  <div className="relative text-center overflow-hidden vsop-section">
    {/* Decorative orbit backdrop — pure SVG, very low opacity, gently rotating */}
    <svg
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none vsop-orbit"
      width="640" height="640" viewBox="0 0 640 640"
      aria-hidden="true"
      style={{ maxWidth: "110%", height: "auto", opacity: 0.35 }}
    >
      <defs>
        <radialGradient id="vsop-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c4a265" stopOpacity="0.12" />
          <stop offset="70%" stopColor="#c4a265" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="320" cy="320" r="280" fill="url(#vsop-glow)" />
      <circle cx="320" cy="320" r="140" stroke="#c4a265" strokeWidth="0.6" strokeDasharray="2 6" fill="none" opacity="0.5" />
      <circle cx="320" cy="320" r="200" stroke="#c4a265" strokeWidth="0.6" strokeDasharray="3 9" fill="none" opacity="0.4" />
      <circle cx="320" cy="320" r="260" stroke="#c4a265" strokeWidth="0.5" strokeDasharray="2 12" fill="none" opacity="0.3" />
      {/* Traveling planet dots */}
      <circle cx="460" cy="320" r="3" fill="#c4a265" opacity="0.8" />
      <circle cx="320" cy="120" r="2.5" fill="#bf524a" opacity="0.7" />
      <circle cx="180" cy="420" r="2.5" fill="#c4a265" opacity="0.6" />
    </svg>

    <div className="relative">
      {/* Section title — bold black */}
      <p
        style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: "clamp(1.25rem, 5vw, 1.6rem)",
          fontWeight: 400,
          color: "var(--black, #141210)",
          letterSpacing: "-0.01em",
          marginBottom: 16,
        }}
      >
        Real Astronomy. Not Guesswork.
      </p>
      <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "clamp(0.92rem, 3.2vw, 1rem)", color: "var(--earth, #6e6259)", lineHeight: 1.55, maxWidth: 440, margin: "0 auto 28px" }}>
        Using{" "}
        <span style={{ color: "var(--gold, #c4a265)", fontWeight: 700, letterSpacing: "0.03em" }}>VSOP87</span>
        {" — the same planetary model used by "}
        <span style={{ color: "var(--ink, #1f1c18)", fontWeight: 700 }}>NASA</span>
        {" and professional observatories worldwide."}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
        {[
          {
            h: "Not a personality quiz. Real coordinates.",
            d: "13 celestial bodies, rising sign, elemental balance, and house placements — all calculated to the exact minute.",
          },
          {
            h: "Accurate to a fraction of a degree.",
            d: "Their reading comes from real planetary math, not generic horoscope predictions.",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="relative rounded-xl py-5 px-5 text-left"
            style={{
              background: "linear-gradient(180deg, #FFFDF5 0%, #faf4e8 100%)",
              border: "1px solid rgba(196,162,101,0.28)",
              boxShadow: "0 2px 16px rgba(196,162,101,0.08), inset 0 1px 0 rgba(255,255,255,0.6)",
            }}
          >
            <p style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "0.95rem", color: "var(--ink, #1f1c18)", lineHeight: 1.3, marginBottom: 8 }}>
              {item.h}
            </p>
            <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.82rem", color: "var(--earth, #6e6259)", lineHeight: 1.55 }}>
              {item.d}
            </p>
          </div>
        ))}
      </div>

      {/* Eyebrow above glyph row */}
      <p
        className="mb-3"
        style={{
          fontFamily: "Cormorant, Georgia, serif",
          fontSize: "0.62rem",
          fontWeight: 700,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "var(--gold, #c4a265)",
          opacity: 0.85,
        }}
      >
        The thirteen bodies we read
      </p>

      {/* Planet row — gold gradient glyphs on rich pills */}
      <div className="flex flex-wrap justify-center gap-1.5 mb-8">
        {[
          ["Sun","\u2609\uFE0E"],["Moon","\u263D\uFE0E"],["Mercury","\u263F\uFE0E"],["Venus","\u2640\uFE0E"],
          ["Mars","\u2642\uFE0E"],["Jupiter","\u2643\uFE0E"],["Saturn","\u2644\uFE0E"],["Uranus","\u2645\uFE0E"],
          ["Neptune","\u2646\uFE0E"],["Pluto","\u2647\uFE0E"],["Chiron","\u26B7\uFE0E"],["Node","\u260A\uFE0E"],["Lilith","\u26B8\uFE0E"],
        ].map(([name, sym], i) => (
          <span
            key={name}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full vsop-glyph-pill"
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "var(--ink, #1f1c18)",
              background: "linear-gradient(180deg, #FFFDF5 0%, #faf4e8 100%)",
              border: "1px solid rgba(196,162,101,0.32)",
              boxShadow: "0 1px 4px rgba(196,162,101,0.1)",
              animationDelay: `${i * 120}ms`,
            }}
          >
            <span
              style={{
                fontFamily: '"DejaVu Sans", "Noto Sans Symbols", system-ui',
                fontSize: "0.95rem",
                fontVariantEmoji: "text" as never,
                background: "linear-gradient(135deg, #d4b26b, #c4a265 50%, #bf524a)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                lineHeight: 1,
              }}
            >
              {sym}
            </span>
            {name}
          </span>
        ))}
      </div>

      {/* Standards row with gold diamond separators */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        {["VSOP87", "JPL HORIZONS", "IAU STANDARDS", "ASTRONOMIA ENGINE"].map((label, i) => (
          <span key={label} className="inline-flex items-center gap-2">
            {i > 0 && (
              <svg width="4" height="4" viewBox="0 0 4 4" aria-hidden="true">
                <path d="M2 0l1 2-1 2-1-2z" fill="#c4a265" opacity="0.65" />
              </svg>
            )}
            <span
              style={{
                fontFamily: "Cormorant, Georgia, serif",
                fontSize: "0.64rem",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--earth, #6e6259)",
              }}
            >
              {label}
            </span>
          </span>
        ))}
      </div>

    </div>

    <style>{`
      @keyframes vsopOrbitSpin { to { transform: translate(-50%, -50%) rotate(360deg); } }
      @keyframes vsopDiamondPulse {
        0%, 100% { opacity: 0.85; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.12); }
      }
      @keyframes vsopGlyphTwinkle {
        0%, 92%, 100% { transform: translateY(0); }
        95% { transform: translateY(-1.5px); }
      }
      .vsop-orbit { animation: vsopOrbitSpin 180s linear infinite; will-change: transform; }
      .vsop-diamond { animation: vsopDiamondPulse 3.5s ease-in-out infinite; transform-origin: center; }
      .vsop-glyph-pill {
        animation: vsopGlyphTwinkle 4.5s ease-in-out infinite;
        animation-delay: inherit;
        will-change: transform;
      }
      @media (prefers-reduced-motion: reduce) {
        .vsop-orbit, .vsop-diamond, .vsop-glyph-pill { animation: none !important; }
      }
    `}</style>
  </div>
);

interface ProductRevealProps {
  onCtaClick: () => void;
  ctaLabel: string;
}

export const ProductReveal = ({ onCtaClick, ctaLabel }: ProductRevealProps) => {
  const { ref, visible } = useScrollReveal(0.08);
  const [chatStep, setChatStep] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          obs.disconnect();
          setChatStep(1);
          setTimeout(() => setChatStep(2), 600);
          setTimeout(() => setChatStep(3), 1400);
          setTimeout(() => setChatStep(4), 2100);
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative overflow-hidden">

      {/* ── Quote band — grey with pet-silhouette wallpaper ── */}
      <div
        className="relative overflow-hidden px-5 py-16 sm:py-20 transition-all duration-[1200ms] ease-out"
        style={{
          background: "#f0ece3",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transitionDelay: "0.1s",
        }}
      >
        <PetWallpaper />
        <div className="relative max-w-[620px] mx-auto">
          <h2
            className="text-center"
            style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: "clamp(1.55rem, 6.2vw, 2.2rem)",
              fontWeight: 400,
              color: "var(--black, #141210)",
              lineHeight: 1.18,
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            They Give Us Everything.
            <br />
            <em style={{ fontWeight: 400 }}>
              It&apos;s Time We Understood Them in Return.
            </em>
          </h2>
        </div>
      </div>

      {/* ── Authority band — cream, matches review section ── */}
      <div
        className="px-5 py-14 sm:py-20 transition-all duration-[1200ms] ease-out"
        style={{
          background: "var(--cream, #FFFDF5)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transitionDelay: "0.15s",
        }}
      >
        <div className="max-w-[560px] mx-auto">
          <VsopCredibility />
        </div>
      </div>

      {/* ── Block 2: The Benefits ── grey band, alternates with cream neighbours ── */}
      <div
        className="relative px-5 py-12 sm:py-16 md:py-20"
        style={{
          background: "#f0ece3",
        }}
      >
        <div className="relative max-w-[560px] mx-auto">
          {/* Title only — no eyebrow, no subline, no flourish */}
          <div className={`text-center mb-10 sm:mb-12 benefit-eyebrow ${visible ? "is-in" : ""}`}>
            <h2
              style={{
                fontFamily: '"DM Serif Display", Georgia, serif',
                fontSize: "clamp(1.6rem, 5.6vw, 2rem)",
                fontWeight: 400,
                color: "var(--black, #141210)",
                lineHeight: 1.18,
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              After <em style={{ color: "var(--rose, #bf524a)", fontWeight: 400 }}>Their</em> Reading
            </h2>
          </div>

          {/* Four benefit rows — left-aligned list, gold hairlines between */}
          <ol
            className="flex flex-col"
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              borderTop: "1px solid rgba(196,162,101,0.25)",
            }}
          >
            {[
              { roman: "I", text: "You'll understand why they chose you." },
              { roman: "II", text: "Speak their love language — fluently." },
              { roman: "III", text: "Finally put into words the bond you've always felt." },
              { roman: "IV", text: "Read their needs before they show them." },
            ].map((item, i) => (
              <li
                key={i}
                className={`benefit-row ${visible ? "is-in" : ""}`}
                style={{
                  animationDelay: `${0.15 + i * 0.1}s`,
                  display: "flex",
                  alignItems: "baseline",
                  gap: "14px",
                  padding: "18px 0",
                  borderBottom: "1px solid rgba(196,162,101,0.25)",
                }}
              >
                {/* Roman numeral — gold italic, fixed width for alignment */}
                <span
                  aria-hidden="true"
                  style={{
                    fontFamily: '"DM Serif Display", Georgia, serif',
                    fontStyle: "italic",
                    fontSize: "clamp(0.95rem, 3vw, 1.1rem)",
                    letterSpacing: "0.08em",
                    width: 28,
                    flexShrink: 0,
                    background: "linear-gradient(135deg, #d4b26b, #c4a265)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    textAlign: "left",
                  }}
                >
                  {item.roman}.
                </span>

                {/* Statement */}
                <p
                  style={{
                    fontFamily: '"DM Serif Display", Georgia, serif',
                    fontSize: "clamp(1.02rem, 3.8vw, 1.2rem)",
                    color: "var(--ink, #1f1c18)",
                    lineHeight: 1.35,
                    letterSpacing: "-0.01em",
                    margin: 0,
                    flex: 1,
                  }}
                >
                  {item.text}
                </p>
              </li>
            ))}
          </ol>
        </div>

        {/* CSS-only reveals */}
        <style>{`
          .benefit-eyebrow, .benefit-row {
            opacity: 0;
            transform: translateY(10px);
            will-change: opacity, transform;
          }
          .benefit-eyebrow.is-in {
            animation: benefitReveal 800ms cubic-bezier(0.22, 1, 0.36, 1) 0.05s forwards;
          }
          .benefit-row.is-in {
            animation: benefitReveal 800ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }

          @keyframes benefitReveal {
            to { opacity: 1; transform: translateY(0); }
          }

          @media (prefers-reduced-motion: reduce) {
            .benefit-eyebrow, .benefit-row {
              animation: none !important;
              opacity: 1 !important;
              transform: none !important;
            }
          }
        `}</style>
      </div>

      {/* ── SoulSpeak section removed — moved into pricing card tap-to-expand preview ── */}
      {false && (
      <div
        className="px-5 py-14 sm:py-18 transition-all duration-[1200ms] ease-out"
        style={{
          background: "linear-gradient(180deg, #f0e8da 0%, #ede4d4 50%, #f0e8da 100%)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transitionDelay: "0.25s",
        }}
      >
        <div className="max-w-[520px] mx-auto">
          <div className="text-center mb-6">
            {/* SoulSpeak badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
              style={{
                background: "rgba(191,82,74,0.06)",
                border: "1px solid rgba(191,82,74,0.12)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--rose, #bf524a)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6.5A2.5 2.5 0 016.5 4h11A2.5 2.5 0 0120 6.5v7A2.5 2.5 0 0117.5 16H13l-3.8 3.4V16H6.5A2.5 2.5 0 014 13.5v-7z" />
              </svg>
              <span style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--rose, #bf524a)" }}>
                SoulSpeak — Included
              </span>
            </div>

            <h3
              style={{
                fontFamily: '"DM Serif Display", Georgia, serif',
                fontSize: "clamp(1.3rem, 5.5vw, 1.7rem)",
                color: "var(--ink, #1f1c18)",
                lineHeight: 1.2,
                marginBottom: 10,
              }}
            >
              Have the conversation you've
              <br />
              <em style={{ color: "var(--rose, #bf524a)" }}>always wished you could have</em>
            </h3>
            <p
              style={{
                fontFamily: "Cormorant, Georgia, serif",
                fontSize: "clamp(0.95rem, 3.3vw, 1.05rem)",
                color: "var(--earth, #6e6259)",
                lineHeight: 1.6,
                maxWidth: 400,
                margin: "0 auto",
              }}
            >
              Ask them anything — why they do
              the weird things they do, how they feel about you, what they
              need.
            </p>
          </div>

          {/* Chat demo */}
          <div
            ref={chatRef}
            className="rounded-2xl overflow-hidden"
            style={{
              background: "#fff",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            }}
          >
            <div className="px-5 py-5 sm:px-6 space-y-3">
              <div
                className="flex justify-end transition-all duration-500"
                style={{ opacity: chatStep >= 1 ? 1 : 0, transform: chatStep >= 1 ? "translateY(0)" : "translateY(6px)" }}
              >
                <div className="px-4 py-2.5 rounded-2xl rounded-br-sm" style={{ background: "var(--rose, #bf524a)", color: "#fff", maxWidth: "80%" }}>
                  <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.9rem" }}>
                    Why do you always steal my socks?
                  </p>
                </div>
              </div>
              <div
                className="flex justify-start transition-all duration-500"
                style={{ opacity: chatStep >= 2 ? 1 : 0, transform: chatStep >= 2 ? "translateY(0)" : "translateY(6px)" }}
              >
                <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm" style={{ background: "var(--cream3, #f3eadb)", maxWidth: "85%" }}>
                  <p style={{ fontFamily: "Cormorant, Georgia, serif", fontStyle: "italic", fontSize: "0.9rem", color: "var(--earth, #6e6259)", lineHeight: 1.5 }}>
                    Because they smell like you. And when you leave,
                    that's the closest thing I have to you being here.
                  </p>
                </div>
              </div>
              <div
                className="flex justify-end transition-all duration-500"
                style={{ opacity: chatStep >= 3 ? 1 : 0, transform: chatStep >= 3 ? "translateY(0)" : "translateY(6px)" }}
              >
                <div className="px-4 py-2.5 rounded-2xl rounded-br-sm" style={{ background: "var(--rose, #bf524a)", color: "#fff", maxWidth: "80%" }}>
                  <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.9rem" }}>
                    Do you know how much I love you?
                  </p>
                </div>
              </div>
              <div
                className="flex justify-start transition-all duration-500"
                style={{ opacity: chatStep >= 4 ? 1 : 0, transform: chatStep >= 4 ? "translateY(0)" : "translateY(6px)" }}
              >
                <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm" style={{ background: "var(--cream3, #f3eadb)", maxWidth: "85%" }}>
                  <p style={{ fontFamily: "Cormorant, Georgia, serif", fontStyle: "italic", fontSize: "0.9rem", color: "var(--earth, #6e6259)", lineHeight: 1.5 }}>
                    I knew before you did.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ProductReveal CTA removed — the main checkout CTA lives in InlineCheckout below. */}
    </section>
  );
};
