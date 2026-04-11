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

/* ── Chart Wheel SVG — the hero visual ── */
const ChartWheel = () => {
  const planets = [
    { sym: "\u2609", deg: 45 }, { sym: "\u263D", deg: 125 }, { sym: "\u263F", deg: 60 },
    { sym: "\u2640", deg: 200 }, { sym: "\u2642", deg: 310 }, { sym: "\u2643", deg: 170 },
    { sym: "\u2644", deg: 250 }, { sym: "\u2645", deg: 340 }, { sym: "\u2646", deg: 15 },
    { sym: "\u2647", deg: 275 }, { sym: "\u26B7", deg: 90 }, { sym: "\u260A", deg: 150 },
    { sym: "\u26B8", deg: 330 },
  ];
  const zodiac = ["\u2648","\u2649","\u264A","\u264B","\u264C","\u264D","\u264E","\u264F","\u2650","\u2651","\u2652","\u2653"];
  const aspects = [[0,3],[1,5],[2,7],[4,9],[6,11],[0,8],[3,10]];
  const r = (deg: number) => (deg * Math.PI) / 180;

  return (
    <svg viewBox="0 0 300 300" className="w-48 h-48 sm:w-56 sm:h-56 mx-auto" aria-hidden="true">
      {/* Outer ring */}
      <circle cx="150" cy="150" r="130" fill="none" stroke="rgba(196,162,101,0.2)" strokeWidth="0.8" />
      <circle cx="150" cy="150" r="100" fill="none" stroke="rgba(196,162,101,0.15)" strokeWidth="0.5" />
      <circle cx="150" cy="150" r="40" fill="none" stroke="rgba(196,162,101,0.1)" strokeWidth="0.4" />
      {/* House lines */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = r(i * 30);
        return <line key={`h${i}`} x1={150 + 100 * Math.cos(a)} y1={150 + 100 * Math.sin(a)} x2={150 + 130 * Math.cos(a)} y2={150 + 130 * Math.sin(a)} stroke="rgba(196,162,101,0.12)" strokeWidth="0.3" />;
      })}
      {/* Zodiac glyphs */}
      {zodiac.map((sym, i) => {
        const a = r(i * 30 + 15);
        return <text key={`z${i}`} x={150 + 115 * Math.cos(a)} y={150 + 115 * Math.sin(a) + 3} textAnchor="middle" fill="rgba(196,162,101,0.25)" fontSize="9" fontFamily="system-ui">{sym}</text>;
      })}
      {/* Aspect lines */}
      {aspects.map(([a, b], i) => {
        const aa = r(planets[a].deg), ab = r(planets[b].deg);
        return <line key={`a${i}`} x1={150 + 36 * Math.cos(aa)} y1={150 + 36 * Math.sin(aa)} x2={150 + 36 * Math.cos(ab)} y2={150 + 36 * Math.sin(ab)} stroke="rgba(191,82,74,0.1)" strokeWidth="0.3" />;
      })}
      {/* Planet dots */}
      {planets.map((p, i) => {
        const a = r(p.deg);
        return <text key={`p${i}`} x={150 + 78 * Math.cos(a)} y={150 + 78 * Math.sin(a) + 3} textAnchor="middle" fill="rgba(196,162,101,0.4)" fontSize="8" fontFamily="system-ui">{p.sym}</text>;
      })}
    </svg>
  );
};

/* ── VSOP Credibility Section — Celestial Empiricism ── */
const VsopCredibility = () => (
  <div
    className="mt-8 -mx-5 px-5 py-12 sm:py-16 relative overflow-hidden"
    style={{ background: "linear-gradient(175deg, #0B0E17 0%, #121828 50%, #0B0E17 100%)" }}
  >
    {/* Constellation lines — background texture */}
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 600 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g stroke="rgba(196,162,101,0.06)" strokeWidth="0.5" fill="none">
        <line x1="80" y1="60" x2="140" y2="90" /><line x1="140" y1="90" x2="190" y2="65" /><line x1="140" y1="90" x2="160" y2="140" />
        <line x1="430" y1="50" x2="480" y2="85" /><line x1="480" y1="85" x2="520" y2="60" /><line x1="480" y1="85" x2="500" y2="130" />
        <line x1="100" y1="380" x2="160" y2="410" /><line x1="160" y1="410" x2="210" y2="390" />
        <line x1="440" y1="400" x2="490" y2="420" /><line x1="490" y1="420" x2="530" y2="400" />
      </g>
      {[
        [80,60],[140,90],[190,65],[160,140],[430,50],[480,85],[520,60],[500,130],
        [100,380],[160,410],[210,390],[440,400],[490,420],[530,400],
        [50,200],[300,30],[550,250],[280,300],[60,320],[520,340],[350,450],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={1.2} fill="rgba(196,162,101,0.12)" />
      ))}
    </svg>

    <div className="relative z-10 max-w-[520px] mx-auto text-center">
      {/* Institutional mark */}
      <p className="mb-1" style={{ fontFamily: "Consolas, 'Courier New', monospace", fontSize: "0.65rem", fontWeight: 400, letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(196,162,101,0.5)" }}>
        V S O P 8 7
      </p>
      <div className="mx-auto mb-2" style={{ width: 100, height: 1, background: "rgba(196,162,101,0.2)" }} />
      <p className="mb-8" style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "0.72rem", color: "rgba(196,162,101,0.35)" }}>
        Bureau des Longitudes, Paris
      </p>

      {/* Headline */}
      <h3 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(1.3rem, 5.5vw, 1.75rem)", fontWeight: 400, color: "#E8E4DC", lineHeight: 1.2, marginBottom: 6 }}>
        The Same Sky That Shaped You
      </h3>
      <h3 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(1.3rem, 5.5vw, 1.75rem)", fontWeight: 400, color: "rgba(196,162,101,0.85)", lineHeight: 1.2, marginBottom: 24 }}>
        Shaped Them Too
      </h3>

      {/* Chart wheel */}
      <div className="mb-10">
        <ChartWheel />
      </div>

      {/* Three pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 text-center mb-10">
        {[
          { h: "Not a personality quiz.\nReal coordinates.", d: "Every chart calculated from\n13 celestial bodies at the\nexact moment they were born." },
          { h: "The same math NASA\nuses to track planets.", d: "VSOP87 \u2014 validated against\nNASA JPL Horizons ephemeris\ndata to arc-second precision." },
          { h: "No two birth charts\nare the same. Ever.", d: "Their sky existed once.\nTheir reading is built\nfrom that sky alone." },
        ].map((item, i) => (
          <div key={i} className="py-5 px-4">
            {/* Gold top rule */}
            <div className="mx-auto mb-4" style={{ width: "70%", height: 1, background: "rgba(196,162,101,0.2)" }} />
            {item.h.split("\n").map((line, j) => (
              <p key={j} style={{ fontFamily: "Georgia, serif", fontSize: "0.85rem", fontWeight: 700, color: "#E8E4DC", lineHeight: 1.3 }}>
                {line}
              </p>
            ))}
            <div className="mt-3">
              {item.d.split("\n").map((line, j) => (
                <p key={j} style={{ fontFamily: "Georgia, serif", fontSize: "0.72rem", color: "rgba(196,162,101,0.4)", lineHeight: 1.55 }}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Authority strip */}
      <p className="mb-5" style={{ fontFamily: "Consolas, 'Courier New', monospace", fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(196,162,101,0.3)" }}>
        VSOP87 &nbsp;&middot;&nbsp; JPL HORIZONS &nbsp;&middot;&nbsp; IAU COORDINATE STANDARDS &nbsp;&middot;&nbsp; ASTRONOMIA ENGINE
      </p>

      {/* Planet row */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {[
          ["Sun","\u2609"],["Moon","\u263D"],["Mercury","\u263F"],["Venus","\u2640"],
          ["Mars","\u2642"],["Jupiter","\u2643"],["Saturn","\u2644"],["Uranus","\u2645"],
          ["Neptune","\u2646"],["Pluto","\u2647"],["Chiron","\u26B7"],["Node","\u260A"],["Lilith","\u26B8"],
        ].map(([name, sym]) => (
          <span key={name} className="flex flex-col items-center" style={{ minWidth: 32 }}>
            <span style={{ fontFamily: '"DejaVu Sans", "Noto Sans Symbols", system-ui', fontSize: "0.82rem", color: "rgba(196,162,101,0.45)", lineHeight: 1.4, fontVariantEmoji: "text" as never }}>{sym}</span>
            <span style={{ fontFamily: "Georgia, serif", fontSize: "0.5rem", color: "rgba(196,162,101,0.22)", letterSpacing: "0.05em" }}>{name}</span>
          </span>
        ))}
      </div>
    </div>
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
          // Stagger the chat messages
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
    <section
      ref={ref}
      className="relative py-14 sm:py-20 md:py-24 px-5 overflow-hidden"
      style={{ background: "var(--cream2, #faf4e8)" }}
    >
      <div className="max-w-[520px] mx-auto">
        {/* ── Headline — names the ache ── */}
        <h2
          className="text-center transition-all duration-[1200ms] ease-out"
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: "clamp(1.55rem, 7vw, 2.3rem)",
            fontWeight: 400,
            color: "var(--black, #141210)",
            lineHeight: 1.12,
            letterSpacing: "-0.02em",
            marginBottom: 14,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(25px)",
          }}
        >
          You Love Them.
          <br />
          <em style={{ color: "var(--rose, #bf524a)" }}>
            But Do You Really Know Them?
          </em>
        </h2>
        <p
          className="text-center transition-all duration-1000"
          style={{
            fontFamily: "Cormorant, Georgia, serif",
            fontSize: "clamp(1rem, 3.5vw, 1.12rem)",
            color: "var(--earth, #6e6259)",
            lineHeight: 1.55,
            maxWidth: 420,
            margin: "0 auto 44px",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(15px)",
            transitionDelay: "0.08s",
          }}
        >
        </p>

        {/* ── Benefit 1: The Understanding ── */}
        <div
          className="mb-10 transition-all duration-[1200ms] ease-out"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "0.15s",
          }}
        >
          <h3
            style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: "clamp(1.15rem, 4.5vw, 1.35rem)",
              color: "var(--ink, #1f1c18)",
              lineHeight: 1.2,
              marginBottom: 10,
            }}
          >
            You'll read it and say
            <em style={{ color: "var(--rose, #bf524a)" }}> "that is so them."</em>
          </h3>
          <p
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontSize: "clamp(0.95rem, 3.3vw, 1.05rem)",
              color: "var(--earth, #6e6259)",
              lineHeight: 1.6,
            }}
          >
            Not a generic horoscope. A reading built from the exact moment
            they arrived in this world — their personality, their emotional
            needs, what makes them feel safe, what quietly stresses them out.
            The things you've always sensed but never had words for.
          </p>

          {/* Astronomy credibility — ?vsop=a|b|c to preview variants */}
          <VsopCredibility />
        </div>

        {/* ── Benefit 2: The Voice — experiential chat demo ── */}
        <div
          className="mb-10 transition-all duration-[1200ms] ease-out"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "0.25s",
          }}
        >
          <h3
            style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: "clamp(1.15rem, 4.5vw, 1.35rem)",
              color: "var(--ink, #1f1c18)",
              lineHeight: 1.2,
              marginBottom: 10,
            }}
          >
            Ever wondered what they'd say
            <em style={{ color: "var(--rose, #bf524a)" }}> if they could talk?</em>
          </h3>
          <p
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontSize: "clamp(0.95rem, 3.3vw, 1.05rem)",
              color: "var(--earth, #6e6259)",
              lineHeight: 1.6,
              marginBottom: 16,
            }}
          >
            Now you don't have to wonder. Ask them anything — why they do
            the weird things they do, how they feel about you, what they
            need.
          </p>

          {/* Chat demo — the experience, not a feature */}
          <div
            ref={chatRef}
            className="rounded-2xl overflow-hidden"
            style={{
              background: "#fff",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
            }}
          >
            <div className="px-5 py-4 sm:px-6 space-y-2.5">
              <div
                className="flex justify-end transition-all duration-500"
                style={{ opacity: chatStep >= 1 ? 1 : 0, transform: chatStep >= 1 ? "translateY(0)" : "translateY(6px)" }}
              >
                <div className="px-4 py-2 rounded-2xl rounded-br-sm" style={{ background: "var(--rose, #bf524a)", color: "#fff", maxWidth: "80%" }}>
                  <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.88rem" }}>
                    Why do you always steal my socks?
                  </p>
                </div>
              </div>
              <div
                className="flex justify-start transition-all duration-500"
                style={{ opacity: chatStep >= 2 ? 1 : 0, transform: chatStep >= 2 ? "translateY(0)" : "translateY(6px)" }}
              >
                <div className="px-4 py-2 rounded-2xl rounded-bl-sm" style={{ background: "var(--cream3, #f3eadb)", maxWidth: "85%" }}>
                  <p style={{ fontFamily: "Cormorant, Georgia, serif", fontStyle: "italic", fontSize: "0.88rem", color: "var(--earth, #6e6259)", lineHeight: 1.5 }}>
                    Because they smell like you. And when you leave,
                    that's the closest thing I have to you being here.
                  </p>
                </div>
              </div>
              <div
                className="flex justify-end transition-all duration-500"
                style={{ opacity: chatStep >= 3 ? 1 : 0, transform: chatStep >= 3 ? "translateY(0)" : "translateY(6px)" }}
              >
                <div className="px-4 py-2 rounded-2xl rounded-br-sm" style={{ background: "var(--rose, #bf524a)", color: "#fff", maxWidth: "80%" }}>
                  <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.88rem" }}>
                    Do you know how much I love you?
                  </p>
                </div>
              </div>
              <div
                className="flex justify-start transition-all duration-500"
                style={{ opacity: chatStep >= 4 ? 1 : 0, transform: chatStep >= 4 ? "translateY(0)" : "translateY(6px)" }}
              >
                <div className="px-4 py-2 rounded-2xl rounded-bl-sm" style={{ background: "var(--cream3, #f3eadb)", maxWidth: "85%" }}>
                  <p style={{ fontFamily: "Cormorant, Georgia, serif", fontStyle: "italic", fontSize: "0.88rem", color: "var(--earth, #6e6259)", lineHeight: 1.5 }}>
                    I knew before you did.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── CTA ── */}
        <div
          className="text-center transition-all duration-1000"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(15px)",
            transitionDelay: "0.5s",
          }}
        >
          <button
            onClick={onCtaClick}
            className="group inline-flex items-center gap-2 px-8 sm:px-10 py-4 rounded-full text-white font-semibold transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontSize: "1.05rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              background: "var(--rose, #bf524a)",
              boxShadow: "0 4px 24px rgba(191,82,74,0.25)",
              minHeight: 56,
            }}
          >
            {ctaLabel}
            <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};
