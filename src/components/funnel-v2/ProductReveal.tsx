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

/* ── Chart Wheel SVG — warm palette ── */
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
    <svg viewBox="0 0 300 300" className="w-44 h-44 sm:w-52 sm:h-52 mx-auto" aria-hidden="true">
      <circle cx="150" cy="150" r="130" fill="none" stroke="var(--gold, #c4a265)" strokeOpacity={0.2} strokeWidth="0.8" />
      <circle cx="150" cy="150" r="100" fill="none" stroke="var(--gold, #c4a265)" strokeOpacity={0.14} strokeWidth="0.5" />
      <circle cx="150" cy="150" r="40" fill="none" stroke="var(--gold, #c4a265)" strokeOpacity={0.1} strokeWidth="0.4" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = r(i * 30);
        return <line key={`h${i}`} x1={150 + 100 * Math.cos(a)} y1={150 + 100 * Math.sin(a)} x2={150 + 130 * Math.cos(a)} y2={150 + 130 * Math.sin(a)} stroke="var(--gold, #c4a265)" strokeOpacity={0.1} strokeWidth="0.3" />;
      })}
      {zodiac.map((sym, i) => {
        const a = r(i * 30 + 15);
        return <text key={`z${i}`} x={150 + 115 * Math.cos(a)} y={150 + 115 * Math.sin(a) + 3} textAnchor="middle" fill="var(--gold, #c4a265)" fillOpacity={0.2} fontSize="9" fontFamily="system-ui">{sym}</text>;
      })}
      {aspects.map(([a, b], i) => {
        const aa = r(planets[a].deg), ab = r(planets[b].deg);
        return <line key={`a${i}`} x1={150 + 36 * Math.cos(aa)} y1={150 + 36 * Math.sin(aa)} x2={150 + 36 * Math.cos(ab)} y2={150 + 36 * Math.sin(ab)} stroke="var(--rose, #bf524a)" strokeOpacity={0.08} strokeWidth="0.3" />;
      })}
      {planets.map((p, i) => {
        const a = r(p.deg);
        return <text key={`p${i}`} x={150 + 78 * Math.cos(a)} y={150 + 78 * Math.sin(a) + 3} textAnchor="middle" fill="var(--gold, #c4a265)" fillOpacity={0.35} fontSize="8" fontFamily="system-ui">{p.sym}</text>;
      })}
    </svg>
  );
};

/* ── VSOP Credibility — warm authority ── */
const VsopCredibility = () => (
  <div className="mt-10 text-center">
    {/* Gold rule */}
    <div className="mx-auto mb-6" style={{ width: 50, height: 1, background: "var(--gold, #c4a265)", opacity: 0.35 }} />

    {/* Institutional mark */}
    <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--gold, #c4a265)", opacity: 0.55, marginBottom: 4 }}>
      V S O P 8 7
    </p>
    <p style={{ fontFamily: "Cormorant, Georgia, serif", fontStyle: "italic", fontSize: "0.72rem", color: "var(--muted, #958779)", marginBottom: 20 }}>
      Bureau des Longitudes, Paris
    </p>

    {/* Headline */}
    <h3 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "clamp(1.25rem, 5vw, 1.65rem)", fontWeight: 400, color: "var(--ink, #1f1c18)", lineHeight: 1.2, marginBottom: 4 }}>
      The Same Sky That Shaped You
    </h3>
    <h3 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "clamp(1.25rem, 5vw, 1.65rem)", fontWeight: 400, color: "var(--rose, #bf524a)", lineHeight: 1.2, marginBottom: 20 }}>
      Shaped Them Too
    </h3>

    {/* Chart wheel */}
    <div className="mb-8">
      <ChartWheel />
    </div>

    {/* Three pillars */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
      {[
        { h: "Not a personality quiz. Real coordinates.", d: "Every chart calculated from 13 celestial bodies at the exact moment they were born." },
        { h: "The same math NASA uses to track planets.", d: "VSOP87 — validated against NASA JPL Horizons ephemeris data to arc-second precision." },
        { h: "No two birth charts are the same. Ever.", d: "Their sky existed once. Their reading is built from that sky alone." },
      ].map((item, i) => (
        <div
          key={i}
          className="rounded-xl py-5 px-4"
          style={{
            background: "var(--cream, #FFFDF5)",
            border: "1px solid rgba(196,162,101,0.2)",
          }}
        >
          <p style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "0.88rem", color: "var(--ink, #1f1c18)", lineHeight: 1.25, marginBottom: 8 }}>
            {item.h}
          </p>
          <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.82rem", color: "var(--earth, #6e6259)", lineHeight: 1.5 }}>
            {item.d}
          </p>
        </div>
      ))}
    </div>

    {/* Authority strip */}
    <p className="mb-5" style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted, #958779)", opacity: 0.6 }}>
      VSOP87 &nbsp;&middot;&nbsp; JPL HORIZONS &nbsp;&middot;&nbsp; IAU STANDARDS &nbsp;&middot;&nbsp; ASTRONOMIA ENGINE
    </p>

    {/* Planet row */}
    <div className="flex flex-wrap justify-center gap-1.5">
      {[
        ["Sun","\u2609\uFE0E"],["Moon","\u263D\uFE0E"],["Mercury","\u263F\uFE0E"],["Venus","\u2640\uFE0E"],
        ["Mars","\u2642\uFE0E"],["Jupiter","\u2643\uFE0E"],["Saturn","\u2644\uFE0E"],["Uranus","\u2645\uFE0E"],
        ["Neptune","\u2646\uFE0E"],["Pluto","\u2647\uFE0E"],["Chiron","\u26B7\uFE0E"],["Node","\u260A\uFE0E"],["Lilith","\u26B8\uFE0E"],
      ].map(([name, sym]) => (
        <span
          key={name}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full"
          style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.72rem", fontWeight: 600, color: "var(--earth, #6e6259)", background: "var(--cream, #FFFDF5)", border: "1px solid var(--cream3, #f3eadb)" }}
        >
          <span style={{ fontFamily: '"DejaVu Sans", "Noto Sans Symbols", system-ui', fontSize: "0.85rem", color: "var(--gold, #c4a265)", fontVariantEmoji: "text" as never }}>{sym}</span>
          {name}
        </span>
      ))}
    </div>

    {/* Gold rule */}
    <div className="mx-auto mt-8" style={{ width: 50, height: 1, background: "var(--gold, #c4a265)", opacity: 0.35 }} />
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
