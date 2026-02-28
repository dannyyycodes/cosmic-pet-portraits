import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

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
};

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

const PawSvg = ({ size, opacity, rotate, flip }: { size: number; opacity: number; rotate: number; flip?: boolean }) => (
  <svg width={size} height={size * 1.2} viewBox="0 0 28 34" fill="none" style={{ opacity, transform: `rotate(${rotate}deg)${flip ? " scaleX(-1)" : ""}` }}>
    <ellipse cx="14" cy="22" rx="7" ry="9" fill="#9a8e84" /><ellipse cx="7" cy="10" rx="4" ry="5" fill="#9a8e84" transform="rotate(-10 7 10)" /><ellipse cx="14" cy="6" rx="4" ry="5" fill="#9a8e84" /><ellipse cx="21" cy="10" rx="4" ry="5" fill="#9a8e84" transform="rotate(10 21 10)" />
  </svg>
);

const HeartSvg = ({ size, opacity, rotate }: { size: number; opacity: number; rotate: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ opacity, transform: `rotate(${rotate}deg)` }}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill={COLORS.rose} />
  </svg>
);

const PawPair = ({ opacity = 0.14 }: { opacity?: number }) => (
  <div style={{ position: "relative", height: 0, overflow: "visible", pointerEvents: "none", zIndex: 1 }}>
    <div style={{ display: "flex", justifyContent: "center", gap: 6, position: "absolute", left: "50%", transform: "translateX(-50%)", top: -24 }}>
      <PawSvg size={13} opacity={opacity} rotate={175} />
      <PawSvg size={13} opacity={opacity * 0.85} rotate={185} flip />
    </div>
  </div>
);

const HeartPair = ({ opacity = 0.18 }: { opacity?: number }) => (
  <div style={{ position: "relative", height: 0, overflow: "visible", pointerEvents: "none", zIndex: 1 }}>
    <div style={{ display: "flex", justifyContent: "center", gap: 14, position: "absolute", left: "50%", transform: "translateX(-50%)", top: -20 }}>
      <HeartSvg size={11} opacity={opacity} rotate={-8} />
      <HeartSvg size={11} opacity={opacity * 0.85} rotate={8} />
    </div>
  </div>
);

const GrainOverlay = () => (<div style={{ position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none", opacity: 0.03, mixBlendMode: "multiply" as const }}><svg width="100%" height="100%"><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" /></filter><rect width="100%" height="100%" filter="url(#grain)" /></svg></div>);

const DrawHeart = ({ visible }: { visible: boolean }) => (<svg viewBox="0 0 100 100" className="w-[55px] h-[55px] md:w-[80px] md:h-[80px] mt-[24px] md:mt-[50px] mx-auto block"><path d="M49.998,90.544c0,0,0,0,0.002,0c5.304-14.531,32.88-27.047,41.474-44.23C108.081,13.092,61.244-5.023,50,23.933C38.753-5.023-8.083,13.092,8.525,46.313C17.116,63.497,44.691,76.013,49.998,90.544z" fill="none" stroke={COLORS.rose} strokeOpacity={0.7} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={visible ? 0 : 1} style={{ transition: "stroke-dashoffset 2.5s ease 0.6s" }} /></svg>);

const WavyUnderline = ({ visible }: { visible: boolean }) => (<svg width="220" height="12" viewBox="0 0 220 12" style={{ display: "block", margin: "12px auto 0", maxWidth: "100%" }}><path d="M2 8 Q 20 2, 40 8 Q 60 14, 80 8 Q 100 2, 120 8 Q 140 14, 160 8 Q 180 2, 200 8 Q 210 11, 218 8" fill="none" stroke={COLORS.rose} strokeOpacity={0.4} strokeWidth={2} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={visible ? 0 : 1} style={{ transition: "stroke-dashoffset 1.2s ease 0.5s" }} /></svg>);

const GoldStars = ({ visible }: { visible: boolean }) => (<div style={{ marginTop: 28, display: "flex", justifyContent: "center", gap: 18, opacity: visible ? 0.3 : 0, transition: "opacity 1s ease 0.8s" }}>{[14, 18, 14].map((s, i) => (<svg key={i} width={s} height={s} viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={COLORS.gold} /></svg>))}</div>);

const fadeUpStyle = (visible: boolean, delay = 0): React.CSSProperties => ({ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(45px)", transition: `opacity 1.2s cubic-bezier(0.19,1,0.22,1) ${delay}s, transform 1.2s cubic-bezier(0.19,1,0.22,1) ${delay}s` });
const fadeOnlyStyle = (visible: boolean, delay = 0): React.CSSProperties => ({ opacity: visible ? 1 : 0, transition: `opacity 1.4s ease ${delay}s` });
const scaleInStyle = (visible: boolean, delay = 0): React.CSSProperties => ({ opacity: visible ? 1 : 0, transform: visible ? "scale(1)" : "scale(0.85)", transition: `opacity 1s ease ${delay}s, transform 1s ease ${delay}s` });

const Beat = ({ children, minHeight = "100vh", mobileMinHeight, background }: { children: (visible: boolean) => React.ReactNode; minHeight?: string; mobileMinHeight?: string; background?: string; }) => {
  const { ref, visible } = useScrollReveal();
  const mobile = useIsMobile();
  const resolvedMin = mobile && mobileMinHeight ? mobileMinHeight : minHeight;
  return (<section ref={ref} className="relative overflow-hidden" style={{ minHeight: resolvedMin, display: "flex", alignItems: "center", justifyContent: "center", padding: mobile ? "clamp(24px, 6vw, 80px) clamp(16px, 4vw, 28px)" : "clamp(40px, 8vw, 80px) clamp(16px, 4vw, 28px)", background: background ?? COLORS.cream }}><div style={{ maxWidth: 750, width: "100%", textAlign: "center" }}>{children(visible)}</div></section>);
};

const UGCTestimonials = () => {
  const mobile = useIsMobile();
  const cardW = mobile ? 140 : 180;
  const people = [{ name: "Sarah M.", pet: "Buddy the Lab" }, { name: "James T.", pet: "Luna the Persian" }, { name: "Priya K.", pet: "Cinnamon" }, { name: "Mark D.", pet: "Charlie the Beagle" }];
  return (
    <section style={{ background: COLORS.cream, padding: mobile ? "clamp(24px, 6vw, 80px) clamp(16px, 4vw, 28px) clamp(20px, 4vw, 60px)" : "clamp(40px, 8vw, 80px) clamp(16px, 4vw, 28px) clamp(30px, 6vw, 60px)", textAlign: "center" }}>
      <p style={{ fontFamily: "Cormorant, Georgia, serif", fontWeight: 600, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.3em", color: COLORS.earth, marginBottom: 45 }}>WHAT PET PARENTS ARE SAYING</p>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: mobile ? 12 : 20 }}>
        {people.map((person, i) => { const { ref, visible } = useScrollReveal({ threshold: 0.15 }); return (
          <div key={i} ref={ref} style={{ ...fadeUpStyle(visible, 0.3 + i * 0.3), width: cardW, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: "100%", aspectRatio: "9/16", borderRadius: 16, background: `linear-gradient(135deg, ${COLORS.cream3}, ${COLORS.sand})`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: COLORS.cream, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", fontSize: 40 }}>▶</div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)", padding: "28px 8px 8px" }}>
                <p style={{ color: "white", fontSize: "0.7rem", fontWeight: 600, margin: 0 }}>{person.name}</p>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.6rem", margin: 0 }}>{person.pet}</p>
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: "0.85rem", color: COLORS.gold, letterSpacing: "0.08em" }}>★★★★★</div>
          </div>); })}
      </div>
    </section>
  );
};

interface EmotionalJourneyProps { trackCTAClick: (cta: string, location: string) => void; }

export const EmotionalJourney = ({ trackCTAClick }: EmotionalJourneyProps) => {
  return (
    <div style={{ background: COLORS.cream, position: "relative" }}>
      <GrainOverlay />

      <Beat mobileMinHeight="55vh" background={`radial-gradient(circle at 50% 50%, ${COLORS.cream2}, ${COLORS.cream})`}>
        {(v) => (<h2 style={{ ...fadeUpStyle(v), fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "clamp(1.6rem, 12vw, 6rem)", fontWeight: 400, color: COLORS.black, lineHeight: 0.98, letterSpacing: "-0.04em" }}>They Love You<br /><em>Without Conditions.</em></h2>)}
      </Beat>

      <Beat minHeight="60vh" mobileMinHeight="35vh">
        {(v) => (<p style={{ ...fadeUpStyle(v), fontFamily: "Cormorant, Georgia, serif", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(1.5rem, 5.5vw, 2.2rem)", color: COLORS.earth, lineHeight: 1.75 }}>On your best days.<br />On your worst days.<br />No judgement.<br />No expectations.</p>)}
      </Beat>

      <PawPair opacity={0.14} />

      <Beat minHeight="70vh" mobileMinHeight="45vh" background={`linear-gradient(to bottom, ${COLORS.cream}, ${COLORS.cream2})`}>
        {(v) => (<div><p style={{ ...fadeOnlyStyle(v), fontFamily: "Cormorant, Georgia, serif", fontStyle: "italic", fontWeight: 300, fontSize: "clamp(2rem, 10vw, 5rem)", color: COLORS.sand, letterSpacing: "0.04em", marginBottom: 16 }}>Just</p>{["loyalty.", "presence.", "& love."].map((word, i) => (<span key={i} style={{ ...fadeUpStyle(v, 0.2 + i * 0.35), display: "block", fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "clamp(1.6rem, 8vw, 3.8rem)", color: COLORS.ink, lineHeight: 1.25, letterSpacing: "-0.025em" }}>{word}</span>))}<DrawHeart visible={v} /></div>)}
      </Beat>

      <HeartPair opacity={0.18} />

      <Beat mobileMinHeight="auto" background={`linear-gradient(to bottom, ${COLORS.cream2}, ${COLORS.cream3}, ${COLORS.cream2})`}>
        {(v) => (<div><h2 style={{ ...fadeUpStyle(v), fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "clamp(1.6rem, 11vw, 5.5rem)", color: COLORS.black, marginBottom: 40, lineHeight: 0.98, letterSpacing: "-0.04em" }}>They're Not "Just a Pet."</h2><p style={{ ...fadeUpStyle(v, 0.2), fontFamily: "Cormorant, Georgia, serif", fontWeight: 400, fontSize: "clamp(1.15rem, 4vw, 1.4rem)", color: COLORS.earth, lineHeight: 1.9, maxWidth: 480, margin: "0 auto" }}>They are a living, feeling soul with their own personality, their own quirks, their own inner world.</p></div>)}
      </Beat>

      <PawPair opacity={0.12} />

      <Beat minHeight="80vh" mobileMinHeight="50vh" background={COLORS.cream2}>
        {(v) => (<div>{[{ text: "The way they comfort you.", size: "clamp(1.4rem, 5vw, 2rem)", color: COLORS.muted }, { text: "The way they protect you.", size: "clamp(1.65rem, 6vw, 2.4rem)", color: COLORS.warm }, { text: "The way they choose you — every single day.", size: "clamp(1.95rem, 7vw, 2.9rem)", color: COLORS.ink }].map((line, i) => (<p key={i} style={{ ...fadeUpStyle(v, 0.2 + i * 0.35), fontFamily: '"DM Serif Display", Georgia, serif', fontStyle: "italic", fontSize: line.size, color: line.color, lineHeight: 1.4, marginBottom: i < 2 ? 20 : 0 }}>{line.text}</p>))}</div>)}
      </Beat>

      <HeartPair opacity={0.16} />

      <Beat minHeight="60vh" mobileMinHeight="35vh" background={`linear-gradient(to bottom, ${COLORS.cream2}, ${COLORS.cream})`}>
        {(v) => (<div><h2 style={{ ...scaleInStyle(v), fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "clamp(1.6rem, 10vw, 5rem)", color: COLORS.black }}>That means something.</h2><div style={{ width: 50, height: 2, background: COLORS.gold, opacity: v ? 0.5 : 0, margin: "30px auto 0", transition: "opacity 1s ease 0.5s" }} /></div>)}
      </Beat>

      <Beat mobileMinHeight="auto" background={`radial-gradient(circle at 50% 50%, ${COLORS.cream2}, ${COLORS.cream})`}>
        {(v) => (<div><h2 style={{ ...fadeUpStyle(v), fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "clamp(1.6rem, 11vw, 5.5rem)", color: COLORS.black, lineHeight: 1, marginBottom: 40 }}>This Is an<br /><em>Act of Love.</em></h2>{["Taking the time to understand them more deeply.", "To see who they are as an individual soul.", "To honour the bond you share."].map((line, i) => (<p key={i} style={{ ...fadeUpStyle(v, 0.3 + i * 0.15), fontFamily: "Cormorant, Georgia, serif", fontStyle: "italic", fontSize: "clamp(1.25rem, 4.5vw, 1.6rem)", color: COLORS.earth, lineHeight: 1.75, marginBottom: 8 }}>{line}</p>))}</div>)}
      </Beat>

      <PawPair opacity={0.14} />

      <Beat minHeight="75vh" mobileMinHeight="50vh">
        {(v) => (<div><p style={{ ...fadeUpStyle(v), fontFamily: "Cormorant, Georgia, serif", fontWeight: 600, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.25em", color: COLORS.earth, marginBottom: 30 }}>It's a small way of saying:</p><div style={{ position: "relative", display: "inline-block", textAlign: "left", paddingLeft: 30 }}><div style={{ position: "absolute", left: 0, top: 0, width: 3, height: v ? "100%" : "0%", background: `linear-gradient(to bottom, ${COLORS.gold}, ${COLORS.rose})`, transition: "height 1.5s ease 0.3s" }} />{['"I see you.', '"I appreciate you.', '"I\'m grateful you\'re in my life."'].map((line, i) => (<p key={i} style={{ ...fadeUpStyle(v, 0.3 + i * 0.35), fontFamily: '"DM Serif Display", Georgia, serif', fontStyle: "italic", fontSize: "clamp(1.8rem, 7vw, 3.2rem)", color: COLORS.deep, marginBottom: 12, lineHeight: 1.2 }}>{line}</p>))}</div><GoldStars visible={v} /></div>)}
      </Beat>

      <Beat mobileMinHeight="auto">
        {(v) => (<div><p style={{ ...fadeUpStyle(v), fontFamily: "Cormorant, Georgia, serif", fontStyle: "italic", fontSize: "clamp(1.2rem, 4.2vw, 1.5rem)", color: COLORS.muted, marginBottom: 30 }}>Because when someone loves you unconditionally…</p><p style={{ ...fadeUpStyle(v, 0.25), fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "clamp(1.6rem, 6vw, 2.6rem)", color: COLORS.deep, marginBottom: 24 }}>the most beautiful thing you can do</p><p style={{ opacity: v ? 1 : 0, filter: v ? "blur(0px)" : "blur(10px)", transition: "opacity 0.8s ease 0.5s, filter 0.8s ease 0.5s", fontFamily: "Caveat, cursive", fontSize: "clamp(1.6rem, 10vw, 6rem)", color: COLORS.ink }}>is try to understand them<br />in return.</p><WavyUnderline visible={v} /></div>)}
      </Beat>

      <HeartPair opacity={0.18} />

      <UGCTestimonials />

      <Beat mobileMinHeight="auto" background={`linear-gradient(to bottom, ${COLORS.cream}, ${COLORS.cream2}, ${COLORS.cream})`}>
        {(v) => (<div><p style={{ ...fadeUpStyle(v), fontFamily: "Cormorant, Georgia, serif", fontStyle: "italic", fontSize: "clamp(1.2rem, 4.5vw, 1.6rem)", color: COLORS.earth, marginBottom: 35 }}>Your pet loves you with everything they have.</p><h2 style={{ ...fadeUpStyle(v, 0.2), fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "clamp(1.6rem, 10vw, 4.8rem)", color: COLORS.black, lineHeight: 1, marginBottom: 50 }}>Now it's your turn<br />to understand them.</h2><a href="/checkout" onClick={() => trackCTAClick("Get Their Reading", "emotional-journey-cta")} style={{ ...fadeUpStyle(v, 0.4), display: "inline-block", background: COLORS.rose, color: "#fff", fontFamily: "Cormorant, Georgia, serif", fontWeight: 600, fontSize: "1.1rem", letterSpacing: "0.15em", textTransform: "uppercase" as const, textDecoration: "none", padding: "20px 52px", borderRadius: 50, border: "none", cursor: "pointer", transition: "all 0.35s ease" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(191,82,74,0.25)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>Get Their Reading</a></div>)}
      </Beat>
    </div>
  );
};
