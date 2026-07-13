import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent, ReactNode, RefObject } from "react";
import { ArrowRight, AudioLines, ChevronDown, Feather, Heart, Mail, Orbit, Volume2 } from "lucide-react";
import { animate, AnimatePresence, motion, useMotionTemplate, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { InlineCheckout } from "./InlineCheckout";
import { REVIEWS } from "./DossierCheckout";
import { CosmicBridge, HOUSE, GLYPH as ZODIAC_GLYPH } from "./CosmicBridge";

gsap.registerPlugin(ScrollTrigger);
import { supabase } from "@/integrations/supabase/client";
import { getUtm } from "@/lib/utm";
import { getCheckoutVariant, type CheckoutVariant } from "@/lib/checkoutVariant";
import { descendTo } from "@/lib/descend";
import { SIGN_LINES } from "./signLines";
import { useLocalizedPrice } from "@/hooks/useLocalizedPrice";
import { getIntent, setIntent, clearIntent, INTENT_EVENT, type Intent } from "@/lib/intent";

const C = {
  ink: "#141210",
  cream: "#ffffff",
  creamDim: "#ececf2",
  muted: "#c8c8d2",
  // COLOUR LAW (Danny): cosmic purple + white only on the readings path.
  // The old gold accents now resolve to the violet family.
  gold: "#b9a5f0",
  goldSoft: "#cfc0f4",
  goldDeep: "#5d47a0",
  violet: "#7c5cd6",
  violetSoft: "#9a7ee6",
  violetBright: "#b9a5f0",
  lineViolet: "rgba(154, 126, 230, 0.26)",
  cosmos: "#0d0a14",
  cosmos2: "#15101c",
  cosmos3: "#201722",
  line: "rgba(154, 126, 230, 0.22)",
  lineSoft: "rgba(237, 233, 247, 0.10)",
};

const PLACEHOLDERS = [
  {
    key: "hero-doberman-galaxy-eyes.png",
    title: "Doberman puppy",
    note: "Galaxy eyes hero",
  },
  {
    key: "hero-black-cat-galaxy-eyes.png",
    title: "Black cat",
    note: "Galaxy eyes hero",
  },
  {
    key: "hero-cockapoo-ipad-reading.png",
    title: "Cockapoo and iPad",
    note: "Reading in hand",
  },
  {
    key: "reading-on-phone-live-view.png",
    title: "Phone reading",
    note: "Private reveal",
  },
  {
    key: "birth-chart-tablet-pet-nearby.png",
    title: "Birth sky",
    note: "Chart and pet nearby",
  },
  {
    key: "quiet-keepsake-reading-moment.png",
    title: "Quiet keepsake",
    note: "At home with them",
  },
] as const;

const AUTHORITY_ITEMS = [
  {
    stat: "VSOP87",
    label: "Ephemeris model",
    body: "The semi-analytic planetary theory observatories run, resolved to the arcsecond.",
  },
  {
    stat: "13",
    label: "Celestial bodies",
    body: "Sun through Pluto, plus Chiron, the Lunar Node and Black Moon Lilith.",
  },
  {
    stat: "J2000",
    label: "Reference epoch",
    body: "Positions tied to the standard astronomical epoch, then carried to their date.",
  },
  {
    stat: "< 0.01°",
    label: "Geometric precision",
    body: "True longitudes computed, not rounded into twelve sun-sign buckets.",
  },
  {
    stat: "True",
    label: "Geocentric sky",
    body: "The real sky as it stood over Earth that moment, retrogrades and all.",
  },
  {
    stat: "0",
    label: "Templates used",
    body: "Every placement is computed from their own chart. No generic filler.",
  },
];

const PLANET_META: Record<string, { glyph: string; label: string; line: string; img?: string }> = {
  sun: { glyph: "☉", label: "Sun", line: "Who they are at their core.", img: "/readings/planets/sun.png" },
  moon: { glyph: "☽", label: "Moon", line: "How they feel, and what soothes them.", img: "/readings/planets/moon.png" },
  mercury: { glyph: "☿", label: "Mercury", line: "How they read you, and answer back.", img: "/readings/planets/mercury.png" },
  venus: { glyph: "♀", label: "Venus", line: "How they give, and ask for, love.", img: "/readings/planets/venus.png" },
  earth: { glyph: "⊕", label: "Earth", line: "This is where we are!" },
  mars: { glyph: "♂", label: "Mars", line: "Their drive, their courage, their play.", img: "/readings/planets/mars.png" },
  jupiter: { glyph: "♃", label: "Jupiter", line: "Where they trust enough to open.", img: "/readings/planets/jupiter.png" },
  saturn: { glyph: "♄", label: "Saturn", line: "What steadies them, and holds them.", img: "/readings/planets/saturn.png" },
  uranus: { glyph: "♅", label: "Uranus", line: "Where they break their own pattern.", img: "/readings/planets/uranus.png" },
  neptune: { glyph: "♆", label: "Neptune", line: "Their dreaming, their softness, their fog.", img: "/readings/planets/neptune.png" },
  pluto: { glyph: "♇", label: "Pluto", line: "What they carry deep, and rarely show.", img: "/readings/planets/pluto.png" },
  chiron: { glyph: "⚷", label: "Chiron", line: "The old hurt they are quietly healing." },
  northNode: { glyph: "☊", label: "North Node", line: "The direction their soul is growing." },
  lilith: { glyph: "⚸", label: "Lilith", line: "Their untamed, instinctive edge." },
};

// ── Bespoke astrological glyphs (crisp inline SVG, single consistent stroke
// weight, inherits colour via currentColor). Replaces the weight-inconsistent
// unicode planet symbols in the skim table so the whole set reads as one hand.
const ASTRO_PATHS: Record<string, ReactNode> = {
  sun: (<><circle cx="12" cy="12" r="7.4" /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" /></>),
  moon: (<path d="M14.6 3.6a9 9 0 1 0 0 16.8 7.2 7.2 0 0 1 0-16.8z" fill="currentColor" stroke="none" />),
  mercury: (<><path d="M8.7 3.2a4.2 4.2 0 0 0 6.6 0" /><circle cx="12" cy="10.4" r="3.6" /><line x1="12" y1="14" x2="12" y2="21" /><line x1="8.6" y1="17.6" x2="15.4" y2="17.6" /></>),
  venus: (<><circle cx="12" cy="8.4" r="4.4" /><line x1="12" y1="12.8" x2="12" y2="21" /><line x1="8.4" y1="17" x2="15.6" y2="17" /></>),
  mars: (<><circle cx="10.3" cy="13.7" r="4.5" /><line x1="13.6" y1="10.4" x2="19.4" y2="4.6" /><path d="M14.8 4.4h4.8v4.8" /></>),
  jupiter: (<><path d="M8.4 6.2C5.5 6.2 5.2 11 8.8 12.2c2 0.7 3.6-0.6 3.6-2.9V4.4" /><path d="M12.4 8.8v9.4" /><line x1="8.2" y1="18.2" x2="17.4" y2="18.2" /></>),
  saturn: (<><path d="M9 4.2v8" /><line x1="6" y1="7.2" x2="12" y2="7.2" /><path d="M9 12.2c0 4 6 3.4 6 6.4 0 1.6-1.4 2.4-2.8 1.8" /></>),
  uranus: (<><circle cx="12" cy="18.4" r="2.4" /><line x1="12" y1="16" x2="12" y2="3.6" /><line x1="7" y1="7.6" x2="17" y2="7.6" /><line x1="7" y1="4" x2="7" y2="11.2" /><line x1="17" y1="4" x2="17" y2="11.2" /></>),
  neptune: (<><path d="M6.8 6.2c0 6 3 8.4 5.2 8.4s5.2-2.4 5.2-8.4" /><line x1="6.8" y1="4.6" x2="6.8" y2="8" /><line x1="17.2" y1="4.6" x2="17.2" y2="8" /><line x1="12" y1="7" x2="12" y2="21" /><line x1="8.4" y1="17.4" x2="15.6" y2="17.4" /></>),
  pluto: (<><path d="M7.6 8.4a4.6 4.6 0 0 0 8.8 0" /><circle cx="12" cy="6" r="2.2" /><line x1="12" y1="10.6" x2="12" y2="21" /><line x1="8.4" y1="16.6" x2="15.6" y2="16.6" /></>),
  chiron: (<><circle cx="12" cy="17.4" r="3.6" /><line x1="9.4" y1="3.4" x2="9.4" y2="13.8" /><path d="M9.4 9.2 14.6 4M9.4 9.6 14 13.6" /></>),
  northNode: (<><path d="M7.6 19.6C6.4 11 8.4 5.4 12 5.4s5.6 5.6 4.4 14.2" /><circle cx="6.8" cy="19.8" r="1.7" /><circle cx="17.2" cy="19.8" r="1.7" /></>),
  lilith: (<><path d="M8.6 9.2a4 4 0 1 0 5.4-3.7 5.2 5.2 0 0 1 0 7.4 4 4 0 0 1-5.4-3.7z" fill="currentColor" stroke="none" /><line x1="12" y1="12.6" x2="12" y2="21" /><line x1="8.4" y1="17" x2="15.6" y2="17" /></>),
  // The Ascendant mark: the eastern horizon with the disc half-risen over it.
  rising: (<><line x1="3.2" y1="16" x2="20.8" y2="16" /><path d="M6.9 16a5.1 5.1 0 0 1 10.2 0" /><line x1="12" y1="7.2" x2="12" y2="4.6" /></>),
  // The synthesis mark: thirteen lights held in one ring, read from the centre.
  synthesis: (<><circle cx="12" cy="12" r="7.6" strokeDasharray="0.1 3.88" /><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" /></>),
};

function AstroGlyph({ name, className }: { name: string; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ASTRO_PATHS[name] ?? ASTRO_PATHS.sun}
    </svg>
  );
}

// Crisp journey transport icons (replace the thin unicode ▶ ❚❚ ↺ ‹ ›).
function CtrlPlay() {
  return (<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M8 5.2 19 12 8 18.8z" /></svg>);
}
function CtrlPause() {
  return (<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true"><rect x="7" y="5" width="3.4" height="14" rx="1.1" /><rect x="13.6" y="5" width="3.4" height="14" rx="1.1" /></svg>);
}
function CtrlReplay() {
  return (<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4.5 12a7.5 7.5 0 1 0 2.3-5.4" /><path d="M3.6 4.4v3.6h3.6" /></svg>);
}
function CtrlPrev() {
  return (<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14.5 6 8.5 12l6 6" /></svg>);
}
function CtrlNext() {
  return (<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9.5 6 15.5 12l-6 6" /></svg>);
}

const PLANET_ORDER = [
  "sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn",
  "uranus", "neptune", "pluto", "chiron", "northNode", "lilith",
] as const;

// Punchy per-body lines for the scroll journey (filled from the brand-locked
// copy workflow). Falls back to the PLANET_META line until populated.
const JOURNEY_LINES: Record<string, string> = {
  sun: "Their core self. Vitality, ego, and who they shine as.",
  moon: "Their emotions and instincts. What they need to feel safe.",
  mercury: "Their mind. How they think, signal, and read you.",
  venus: "Their heart. How they love, bond, and what they treasure.",
  earth: "This is where we are. Grounded, here, together.",
  mars: "Their drive. Courage, energy, desire, and play.",
  jupiter: "Their growth. Luck, trust, and where they expand.",
  saturn: "Their structure. Boundaries, discipline, and what keeps them secure.",
  uranus: "Their individuality. Freedom, surprise, and breaking the pattern.",
  neptune: "Their dream world. Intuition, sensitivity, and the unseen.",
  pluto: "Their depths. Instinct, intensity, and what they transform.",
  chiron: "Their tender wound. Where they hurt, and where they heal.",
  northNode: "Their soul's path. The direction they're growing toward.",
  lilith: "Their wild side. The untamed, primal self that won't be caged.",
};
const JOURNEY_HINT = "These fourteen lines only graze the surface of the chart their birth sky drew.";
const JOURNEY_CTA = "Open Their Reading";

// Relative scientific size of each body (compressed so the small ones stay
// visible). Gas giants large, rocky bodies small, abstract points symbolic.
// Relative diameters, compressed but Sun-dominant (real ratios are far more
// extreme; Sun stays clearly the biggest, gas giants ~1/3 Sun, rocky bodies small).
const REL_SIZE: Record<string, number> = {
  sun: 1,
  jupiter: 0.34,
  saturn: 0.42,
  uranus: 0.18,
  neptune: 0.17,
  earth: 0.18,
  venus: 0.125,
  mars: 0.08,
  mercury: 0.06,
  moon: 0.08,
  pluto: 0.06,
  chiron: 0.05,
  northNode: 0.06,
  lilith: 0.06,
};

// Real NASA full-disc images, black background keyed to transparent (kills the
// black box, keeps Saturn's rings). North Node renders as a glyph point; Lilith
// reuses the Moon image, shadowed (the dark Moon).
const NASA_IMG: Record<string, string> = {
  mercury: "/readings/planets-nasa/mercury.png",
  venus: "/readings/planets-nasa/venus.png",
  earth: "/readings/planets-nasa/earth.png",
  moon: "/readings/planets-nasa/moon.png",
  lilith: "/readings/planets-nasa/moon.png",
  mars: "/readings/planets-nasa/mars.png",
  jupiter: "/readings/planets-nasa/jupiter.png",
  // Square full-disc asset (512x512) so the rings sit whole inside the circular
  // frame; the wide planets-nasa crop (560x271) lost half the rings to object-fit.
  saturn: "/readings/planets/saturn.png",
  chiron: "/readings/planets-nasa/chiron.png",
  uranus: "/readings/planets-nasa/uranus.png",
  neptune: "/readings/planets-nasa/neptune.png",
  pluto: "/readings/planets-nasa/pluto.png",
};

// Scientifically-ish placed bodies (r = % of half-extent from centre, a = degrees).
// Earth is decorative; the lunar points (North Node, Lilith — the Moon's apogee)
// sit beside the Moon; Chiron rides between Saturn and Uranus.
// Perspective layout (x, y in % of the scene). Huge Sun anchored left; planets
// recede up-and-right in order along the sweeping orbit lines. Lunar points sit
// by the Moon; Chiron between Saturn and Uranus.
const BODY_POS: Record<string, { x: number; y: number }> = {
  sun: { x: 3, y: 52 },
  mercury: { x: 26, y: 64 },
  venus: { x: 33, y: 60 },
  earth: { x: 40, y: 56 },
  moon: { x: 45, y: 51 },
  northNode: { x: 45, y: 51 },
  lilith: { x: 45, y: 51 },
  mars: { x: 50, y: 53 },
  jupiter: { x: 60, y: 46 },
  saturn: { x: 71, y: 39 },
  chiron: { x: 77, y: 35 },
  uranus: { x: 83, y: 32 },
  neptune: { x: 92, y: 26 },
  pluto: { x: 98, y: 22 },
};
// On phones, flatten the steep diagonal so bodies read across the screen.
const flattenY = (y: number, mob: boolean) => (mob ? 50 + (y - 50) * 0.5 : y);
// Order the camera + cards visit (radial, with the Moon cluster grouped).
const JOURNEY_SEQ = ["sun", "mercury", "venus", "earth", "moon", "lilith", "northNode", "mars", "jupiter", "saturn", "chiron", "uranus", "neptune", "pluto"] as const;
// Everything drawn in the system (adds decorative Earth).
const RENDER_ORDER = ["sun", "mercury", "venus", "earth", "moon", "northNode", "mars", "jupiter", "saturn", "chiron", "uranus", "neptune", "pluto"] as const;
// Bodies that get a faint orbit ring (real planets only, not the lunar points / chiron).
const ORBIT_KEYS = ["mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"] as const;

// --- Side-view orrery diagram (the "Birth sky" section) ----------------------
// Coordinates are % of the diagram box. Sun anchored low-left, planets stepping
// up-and-right along concentric swept orbits — a real astronomy chart. Spacing +
// sizes tuned so nothing overlaps on phone or desktop.
const ORRERY_POS: Record<string, { x: number; y: number }> = {
  sun: { x: 1, y: 58 },
  mercury: { x: 30, y: 61 }, venus: { x: 38, y: 57 }, earth: { x: 45, y: 53 },
  moon: { x: 48, y: 52 }, lilith: { x: 48, y: 52 }, northNode: { x: 54, y: 50 },
  mars: { x: 58, y: 48 }, jupiter: { x: 67, y: 42 }, saturn: { x: 77, y: 37 },
  chiron: { x: 82, y: 34 }, uranus: { x: 87, y: 31 }, neptune: { x: 92, y: 26 },
  pluto: { x: 97, y: 22 },
};
// Every body (not the Sun) gets its own orbit ring.
const ORRERY_ORBIT_ALL = ["mercury", "venus", "earth", "moon", "northNode", "mars", "jupiter", "saturn", "chiron", "uranus", "neptune", "pluto"] as const;
// Diameter as % of the box width (gas giants big, rocky small — real-ish order).
const ORRERY_DIAM: Record<string, number> = {
  sun: 50, mercury: 3.6, venus: 5, earth: 5.2, moon: 2.8, mars: 4,
  jupiter: 11, saturn: 9.5, uranus: 7, neptune: 7, pluto: 3.2,
  chiron: 3, northNode: 3.6, lilith: 2.8,
};
const ORRERY_K = 0.4; // vertical squash of the orbit ellipses
// Bodies that always show a name label (the classic planets, like the reference).
const ORRERY_LABELLED = new Set(["mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"]);
// The orbit ellipses are drawn through each body then rotated this much about the
// sun for a swept look — so the bodies must be rotated by the SAME angle to land
// exactly on their ring.
const ORRERY_ROT = -7;
const ORRERY_RPOS: Record<string, { x: number; y: number }> = (() => {
  const cx = ORRERY_POS.sun.x;
  const cy = ORRERY_POS.sun.y;
  const a = (ORRERY_ROT * Math.PI) / 180;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const out: Record<string, { x: number; y: number }> = {};
  for (const k in ORRERY_POS) {
    const { x, y } = ORRERY_POS[k];
    out[k] = { x: cx + (x - cx) * ca - (y - cy) * sa, y: cy + (x - cx) * sa + (y - cy) * ca };
  }
  return out;
})();

const SIGN_GLYPHS: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋",
  Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏",
  Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

type ChartBody = {
  sign: string;
  degree?: number;
  element?: string;
  modality?: string;
  ruler?: string;
};

type PetBirthChart = {
  sun?: ChartBody;
  moon?: ChartBody;
  ascendant?: ChartBody | null;
  mercury?: ChartBody;
  venus?: ChartBody;
  mars?: ChartBody;
  jupiter?: ChartBody;
  saturn?: ChartBody;
  uranus?: ChartBody;
  neptune?: ChartBody;
  pluto?: ChartBody;
  chiron?: ChartBody;
  northNode?: ChartBody;
  lilith?: ChartBody;
  dominantElement?: string;
  ascendantNote?: string;
};

const BIRTH_CHART_ENDPOINT = "https://aduibsyrnenzobuyetmn.supabase.co/functions/v1/pet-birth-chart";

export function ReadingsLanding() {
  const pageRef = useRef<HTMLElement>(null);
  const checkoutRef = useRef<HTMLDivElement>(null);
  const [selectedPrice, setSelectedPrice] = useState(0);
  // The lower funnel (the rest of who they are + reviews + pricing) stays out of
  // the page entirely until the free reading is actually revealed. It unlocks
  // once the reader has been carried through the three free placements and
  // reaches the desire turn, at which point FreeReveal fires "ls-reading-revealed".
  // Before that a visitor cannot scroll past an unfilled form into reviews/pricing.
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const onRevealed = () => setRevealed(true);
    window.addEventListener("ls-reading-revealed", onRevealed);
    return () => window.removeEventListener("ls-reading-revealed", onRevealed);
  }, []);
  // When the gated sections mount, the page grows: re-measure so every
  // scroll-driven trigger (the moon spine, the dawn grade) stays aligned.
  useEffect(() => {
    if (!revealed) return;
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [revealed]);
  useCosmicParallax(pageRef);
  useScrollReveal(pageRef, revealed);
  const reduceMotion = useReducedMotion();

  // Lenis smooth scroll for the whole page (native touch momentum kept on mobile).
  useEffect(() => {
    if (reduceMotion || typeof window === "undefined") return;
    const lenis = new Lenis({ smoothWheel: true, syncTouch: false, lerp: 0.09 });
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [reduceMotion]);

  return (
    <main ref={pageRef} className="ls-cosmic-page min-h-screen" style={{ background: C.cosmos, color: C.cream, overflowX: "clip" }}>
      <CosmicStyles />
      <HeroSection />
      <IntentFork />
      <CosmicBridge />
      <BirthSkyJourney />
      {revealed && (
        <>
          <FullReadingOpens />
          <ValueMoments />
          <ReviewsWall />
          <CheckoutSection
            checkoutRef={checkoutRef}
            selectedPrice={selectedPrice}
            onSelectedPriceChange={setSelectedPrice}
          />
          <StickyBeginBar />
        </>
      )}
    </main>
  );
}

function useCosmicParallax(pageRef: RefObject<HTMLElement>) {
  useEffect(() => {
    const page = pageRef.current;
    if (!page || typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const setScroll = () => {
      frame = 0;
      if (reduced.matches) return;
      page.style.setProperty("--ls-scroll-y", `${window.scrollY.toFixed(0)}`);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(setScroll);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (reduced.matches || window.innerWidth < 900) return;
      const x = (event.clientX / window.innerWidth - 0.5).toFixed(3);
      const y = (event.clientY / window.innerHeight - 0.5).toFixed(3);
      page.style.setProperty("--ls-pointer-x", x);
      page.style.setProperty("--ls-pointer-y", y);
    };

    setScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [pageRef]);
}

// Scroll-reveal: wording rises + fades in as each band enters the viewport, so
// the copy "pops" instead of sitting flat. Transform/opacity only (GPU), fires
// once per node, and falls back to instantly-visible under reduced-motion.
// Re-runs when `revealed` flips true, because the gated lower funnel mounts a
// fresh batch of .ls-reveal nodes AFTER the first pass has already observed the
// page — without the second pass those sections would stay at opacity 0.
function useScrollReveal(pageRef: RefObject<HTMLElement>, revealed = false) {
  useEffect(() => {
    void revealed;
    const page = pageRef.current;
    if (!page || typeof window === "undefined") return;
    const nodes = Array.from(page.querySelectorAll<HTMLElement>(".ls-reveal")).filter(
      (node) => !node.classList.contains("is-in"),
    );
    if (!nodes.length) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("is-in"));
      return;
    }
    // The latch root extends far above the viewport: an instant anchor jump
    // can move a node from below the fold to above it in ONE frame, and an
    // IntersectionObserver bounded to the viewport never fires for that jump
    // (its ratio stays 0), stranding the node at opacity 0. With the sky-high
    // top margin, "already scrolled past" IS an intersection, so the latch
    // always lands no matter how the reader travels.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "20000px 0px -12% 0px", threshold: 0.12 },
    );
    nodes.forEach((node) => io.observe(node));
    return () => io.disconnect();
  }, [pageRef, revealed]);
}

function HeroSection() {
  return (
    <section className="ls-hero-section ls-parallax-band relative isolate min-h-[820px] px-5 pb-24 pt-28 sm:pt-34 lg:flex lg:min-h-[920px] lg:items-center">
      <HeroBackdropVideo />
      <div className="ls-hero-veil absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_72%_10%,rgba(154,126,230,0.08),transparent_34%),radial-gradient(ellipse_at_12%_18%,rgba(94,70,122,0.16),transparent_30%),linear-gradient(100deg,rgba(8,6,11,0.76)_0%,rgba(8,6,11,0.44)_34%,rgba(8,6,11,0.08)_68%,rgba(8,6,11,0.10)_100%)]" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center">
        <div className="ls-hero-copy max-w-2xl">
          <h1 className="ls-reveal mt-5 text-balance" style={{ ...heroTitleStyle, ...revealDelay(0.08) }}>
            Behind every soul, a cosmos.
          </h1>
        </div>
      </div>
    </section>
  );
}

/* ── The reading-path chooser ─────────────────────────────────────────
   The first real fork, made big and unmistakable: is this reading for a
   companion who is here, or one who has passed. A short heading names the
   choice; two large cards each carry a plain label plus a line saying who
   the path is for. DISCOVERY leads and reads as primary, and it is the
   default: ignoring or skipping the chooser leaves intent unset, which every
   downstream section treats as discovery. A memorial choice hushes the
   passage and the checkout. Neither answer changes price or tier, and either
   choice reopens via "change" — grief state, and discovery, are never fixed. */
// Path icons are intentionally plain Lucide marks. Danny specified Heart for the
// living companion path and Feather for memorial; keep these as recognizable
// library icons rather than bespoke celestial drawings.
function DiscoveryMark() {
  return <Heart strokeWidth={1.45} aria-hidden="true" />;
}

function MemorialMark() {
  return <Feather strokeWidth={1.45} aria-hidden="true" />;
}

function IntentFork() {
  const [intent, setIntentState] = useState<Intent | null>(() => getIntent());
  const rootRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const onIntent = () => setIntentState(getIntent());
    window.addEventListener(INTENT_EVENT, onIntent);
    return () => window.removeEventListener(INTENT_EVENT, onIntent);
  }, []);

  // Self-contained reveal, re-run whenever the state flips (chooser <-> banner),
  // so a returning visitor who taps "Change" always sees the chooser fade in.
  // The page-level observer only runs once, so this section owns its own.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === "undefined") return;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>(".ls-path-rv"));
    if (!nodes.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      nodes.forEach((n) => n.setAttribute("data-in", "1"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-in", "1");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.14 },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [intent]);

  // Already chosen: a dignified, clearly-visible path banner (never a tiny grey
  // line). The reader always sees which path their reading is on, carries the
  // same celestial mark from the chooser, and gets one clear control to change it.
  if (intent === "memorial" || intent === "discovery") {
    const isMemorial = intent === "memorial";
    return (
      <section
        ref={rootRef}
        id="passage-fork"
        className={`ls-path ls-path-held ls-parallax-band ${isMemorial ? "is-memorial" : "is-discovery"}`}
        aria-label="Your reading path"
      >
        <div className="ls-path-held-inner ls-path-rv">
          <span className="ls-path-mark" aria-hidden="true">
            {isMemorial ? <MemorialMark /> : <DiscoveryMark />}
          </span>
          <div className="ls-path-held-text">
            <p className="ls-path-held-label">
              {isMemorial ? "Reading in remembrance" : "Reading for the soul beside you"}
            </p>
            <p className="ls-path-held-desc">
              {isMemorial ? "A reading in their memory" : "Discover who they are"}
            </p>
          </div>
          <button
            type="button"
            className="ls-path-change"
            onClick={() => clearIntent()}
            aria-label="Change your reading path"
          >
            Change
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </section>
    );
  }

  // Not yet chosen: the full, unmissable chooser as its own journey moment.
  // Discovery is first and primary (gold); memorial is second (violet). Leaving
  // without choosing keeps the discovery path.
  return (
    <section ref={rootRef} id="passage-fork" className="ls-path ls-parallax-band" aria-labelledby="ls-path-title">
      <div className="ls-path-sky" aria-hidden="true" />
      <div className="ls-path-inner">
        <p className="ls-path-eyebrow ls-path-rv">Before their reading begins</p>
        <h2 id="ls-path-title" className="ls-path-title ls-path-rv" style={revealDelay(0.06)}>
          Who is this reading for?
        </h2>
        <div className="ls-path-cards">
          <button
            type="button"
            className="ls-path-card is-discovery ls-path-rv"
            style={revealDelay(0.16)}
            onClick={() => setIntent("discovery")}
          >
            <span className="ls-path-mark" aria-hidden="true">
              <DiscoveryMark />
            </span>
            <span className="ls-path-card-text">
              <span className="ls-path-card-label">My pet is here with me</span>
              <span className="ls-path-card-desc">Discover who they are</span>
            </span>
            <span className="ls-path-card-go" aria-hidden="true">
              <ArrowRight size={17} />
            </span>
          </button>
          <button
            type="button"
            className="ls-path-card is-memorial ls-path-rv"
            style={revealDelay(0.24)}
            onClick={() => setIntent("memorial")}
          >
            <span className="ls-path-mark" aria-hidden="true">
              <MemorialMark />
            </span>
            <span className="ls-path-card-text">
              <span className="ls-path-card-label">My pet has passed</span>
              <span className="ls-path-card-desc">A reading in their memory</span>
            </span>
            <span className="ls-path-card-go" aria-hidden="true">
              <ArrowRight size={17} />
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}

// The emotional bridge between the hero and the "Set the chart" form is now the
// Cinematic Cosmos scroll experience — see ./CosmicBridge.tsx (self-hosted GSAP +
// moon, the nine approved beats, and the real Monty natal wheel drawn on scroll).

// Scroll journey through the birth sky. A sticky stage holds the solar system;
// a tall transparent track of step-triggers drives an IntersectionObserver that
// lights the bodies one at a time (Sun outward). Next/Prev + dots also navigate.
// The final step is the existing free-calc form, then a value reveal + hint.
// The three placements revealed free, fully framed (the emotional core: who
// they are, what they need, how they love). Everything deeper is the full reading.
const FREE_KEYS = ["sun", "moon", "venus"] as const;
const FREE_FRAME: Record<string, string> = {
  sun: "The core of who they are",
  moon: "How they feel safe",
  venus: "How they show love",
};


// Short "what this placement governs" frame for each body, shown above its line
// in the full breakdown. Sun/Moon/Venus reuse the free-card frames.
const PLANET_FRAME: Record<string, string> = {
  sun: "The core of who they are",
  moon: "How they feel safe",
  mercury: "How they think and signal",
  venus: "How they show love",
  mars: "Their drive and temper",
  jupiter: "Where they open up",
  saturn: "What steadies them",
  uranus: "Where they break the pattern",
  neptune: "Their dreaming and softness",
  pluto: "What they keep hidden",
  chiron: "Their tender spot",
  northNode: "Where they are growing",
  lilith: "Their untamed side",
};
// Shown after the email gate, as the "rest of their sky" payoff (positions only).
const REST_KEYS = ["mercury", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "chiron", "northNode", "lilith"] as const;

// Locked premium teasers — what the FULL reading opens. Names transformation,
// not content inventory (GOLDTABLE council copy, 2026-06-16). Never unlocked free.
const PREMIUM_TEASERS = [
  { glyph: "✦", title: "The Bond Pattern", line: "The quiet rhythm between you. Where trust forms, where distance appears, and how they ask to be met." },
  { glyph: "☾", title: "Their Hidden Comfort Language", line: "The signs that tell you when they feel safe, chosen, and fully home with you." },
  { glyph: "♄", title: "The Lesson They Bring You", line: "The recurring friction that's really a curriculum. You'll recognise it the moment you read it." },
  { glyph: "⚷", title: "The Wound That Became Their Gift", line: "The sensitivity that looks like fear but is, in truth, their medicine." },
  { glyph: "☊", title: "The Karmic Contract", line: "Why their soul chose your path to cross, and what they came to teach you." },
  { glyph: "⚸", title: "The Part That's Only Theirs", line: "The mystery you'll never fully solve, and why that's the deepest trust of all." },
  { glyph: "✶", title: "Their Soul Archetype", line: "Guardian, mirror, healer, wanderer, witness. The ancient pattern behind their presence." },
  { glyph: "❂", title: "The Full Celestial Synthesis", line: "Where all thirteen placements become one clear portrait of who they are with you." },
] as const;

// The teasers whose glyph is a real astrological symbol tied to a real placement
// (Moon, Saturn, Chiron, North Node, Black Moon Lilith) render that glyph in the
// brand serif; the three syntheses render a bespoke unlit-star node instead of
// any decorative icon. No sparkles, no filler glyphs.
const REAL_GLYPHS = new Set(["☾", "♄", "⚷", "☊", "⚸"]);

// ── Real natal wheel ────────────────────────────────────────────────────────
// A bespoke gold-on-night zodiac wheel drawn straight from the VSOP87 placements.
// Date-only data gives true ecliptic longitudes (no invented rising sign), so the
// wheel and its aspect web are fully honest. Premium and restrained; it draws on
// cinematically and collapses to an instant render under prefers-reduced-motion.
const WHEEL_ZODIAC = [
  { name: "Aries", glyph: "♈", start: 0, element: "Fire" },
  { name: "Taurus", glyph: "♉", start: 30, element: "Earth" },
  { name: "Gemini", glyph: "♊", start: 60, element: "Air" },
  { name: "Cancer", glyph: "♋", start: 90, element: "Water" },
  { name: "Leo", glyph: "♌", start: 120, element: "Fire" },
  { name: "Virgo", glyph: "♍", start: 150, element: "Earth" },
  { name: "Libra", glyph: "♎", start: 180, element: "Air" },
  { name: "Scorpio", glyph: "♏", start: 210, element: "Water" },
  { name: "Sagittarius", glyph: "♐", start: 240, element: "Fire" },
  { name: "Capricorn", glyph: "♑", start: 270, element: "Earth" },
  { name: "Aquarius", glyph: "♒", start: 300, element: "Air" },
  { name: "Pisces", glyph: "♓", start: 330, element: "Water" },
] as const;
const WHEEL_SIGN_INDEX: Record<string, number> = Object.fromEntries(
  WHEEL_ZODIAC.map((z, i) => [z.name, i]),
);
const WHEEL_BODIES = [
  "sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn",
  "uranus", "neptune", "pluto", "chiron", "northNode", "lilith",
] as const;
// Restrained 3-tone palette: luminaries bright lavender, planets violet, points cream.
const WHEEL_TONE: Record<string, string> = {
  sun: "#dccdfa", moon: "#dccdfa",
  mercury: "#b9a4ee", venus: "#b9a4ee", mars: "#b9a4ee", jupiter: "#b9a4ee",
  saturn: "#b9a4ee", uranus: "#b9a4ee", neptune: "#b9a4ee", pluto: "#b9a4ee",
  chiron: "#e9e4f2", northNode: "#e9e4f2", lilith: "#e9e4f2",
};
// Major Ptolemaic aspects with conventional orbs. Harmonious = gold, hard = violet.
const WHEEL_ASPECTS = [
  { name: "conjunction", angle: 0, orb: 7, kind: "soft" },
  { name: "sextile", angle: 60, orb: 4, kind: "soft" },
  { name: "square", angle: 90, orb: 6, kind: "hard" },
  { name: "trine", angle: 120, orb: 6, kind: "soft" },
  { name: "opposition", angle: 180, orb: 7, kind: "hard" },
] as const;

function wheelLongitude(b?: ChartBody): number | null {
  if (!b?.sign) return null;
  const idx = WHEEL_SIGN_INDEX[b.sign];
  if (idx === undefined) return null;
  return idx * 30 + (typeof b.degree === "number" ? b.degree : 0);
}
function wheelPolar(cx: number, cy: number, r: number, deg: number) {
  // 0 deg Aries at 9 o'clock, counter-clockwise (standard chart orientation).
  const a = ((180 - deg) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
}
function wheelArc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const s = wheelPolar(cx, cy, r, a0);
  const e = wheelPolar(cx, cy, r, a1);
  const large = a1 - a0 <= 180 ? 0 : 1;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}
function computeWheelAspects(points: { key: string; lon: number }[]) {
  const out: { a: string; b: string; kind: string; lonA: number; lonB: number }[] = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      let d = Math.abs(points[i].lon - points[j].lon) % 360;
      if (d > 180) d = 360 - d;
      for (const asp of WHEEL_ASPECTS) {
        if (Math.abs(d - asp.angle) <= asp.orb) {
          out.push({ a: points[i].key, b: points[j].key, kind: asp.kind, lonA: points[i].lon, lonB: points[j].lon });
          break;
        }
      }
    }
  }
  return out;
}

function NatalWheel({
  chart,
  name,
  bornLabel,
  reduce,
  onInfo,
  infoBtnRef,
  focusKey = null,
  hideInfo = false,
}: {
  chart: PetBirthChart;
  name: string;
  bornLabel: string;
  reduce: boolean;
  onInfo: () => void;
  infoBtnRef?: RefObject<HTMLButtonElement>;
  focusKey?: string | null;
  hideInfo?: boolean;
}) {
  const SIZE = 440;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const rZodOuter = 202;
  const rZodInner = 168;
  const rTick = rZodInner;
  const rGlyph = 140;
  const rAspect = 118;
  const rHub = 60;

  const placed = WHEEL_BODIES
    .map((key) => {
      const lon = wheelLongitude(chart[key as keyof PetBirthChart] as ChartBody | undefined);
      return lon === null ? null : { key: key as string, lon };
    })
    .filter((p): p is { key: string; lon: number } => p !== null);

  // Collision spread for the glyph ring only (aspect anchors stay at true lon).
  const sorted = [...placed].sort((a, b) => a.lon - b.lon);
  const glyphLon: Record<string, number> = {};
  const minGap = 13;
  let prev = -Infinity;
  for (const p of sorted) {
    let g = p.lon;
    if (g - prev < minGap) g = prev + minGap;
    glyphLon[p.key] = g;
    prev = g;
  }

  const aspects = computeWheelAspects(placed);
  const dom = chart.sun?.element || chart.dominantElement;
  const sunSignIdx = chart.sun?.sign != null ? (WHEEL_SIGN_INDEX[chart.sun.sign] ?? -1) : -1;
  const beat = (i: number) => (reduce ? 0 : i);

  return (
    <div className="ls-wheel">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="ls-wheel-svg" role="img" aria-label={`${name || "Their"} birth chart`}>
        <defs>
          <radialGradient id="lsWheelHub" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(124,92,214,0.28)" />
            <stop offset="100%" stopColor="rgba(124,92,214,0)" />
          </radialGradient>
          <filter id="lsWheelGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Center wash */}
        <circle cx={cx} cy={cy} r={rAspect + 6} fill="url(#lsWheelHub)" />

        {/* Zodiac ring */}
        <motion.g
          initial={reduce ? false : { opacity: 0, scale: 0.92, rotate: -8 }}
          animate={reduce ? {} : { opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: beat(0.7), ease: [0.22, 0.7, 0.2, 1] }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        >
          <circle cx={cx} cy={cy} r={rZodOuter} fill="none" stroke="rgba(154,126,230,0.55)" strokeWidth={1} />
          <circle cx={cx} cy={cy} r={rZodInner} fill="none" stroke="rgba(154,126,230,0.36)" strokeWidth={1} />
          {WHEEL_ZODIAC.map((z, i) => {
            const a0 = z.start;
            const a1 = z.start + 30;
            const mid = z.start + 15;
            const gp = wheelPolar(cx, cy, (rZodOuter + rZodInner) / 2, mid);
            const d0 = wheelPolar(cx, cy, rZodInner, a0);
            const d1 = wheelPolar(cx, cy, rZodOuter, a0);
            const isSunSign = i === sunSignIdx;
            const fill = isSunSign
              ? "rgba(185,165,240,0.15)"
              : i % 2 === 0
              ? "rgba(154,126,230,0.05)"
              : "rgba(124,92,214,0.06)";
            return (
              <g key={z.name}>
                <path
                  d={`${wheelArc(cx, cy, rZodOuter, a0, a1)} L ${wheelPolar(cx, cy, rZodInner, a1).x.toFixed(2)} ${wheelPolar(cx, cy, rZodInner, a1).y.toFixed(2)} ${wheelArc(cx, cy, rZodInner, a1, a0).replace("M", "L").split("A")[0]} A ${rZodInner} ${rZodInner} 0 0 0 ${d0.x.toFixed(2)} ${d0.y.toFixed(2)} Z`}
                  fill={fill}
                />
                <line x1={d0.x} y1={d0.y} x2={d1.x} y2={d1.y} stroke="rgba(154,126,230,0.32)" strokeWidth={0.75} />
                <g
                  className={`ls-wheel-zsym${isSunSign ? " is-sun" : ""}`}
                  transform={`translate(${gp.x.toFixed(2)},${gp.y.toFixed(2)}) scale(1.12)`}
                  dangerouslySetInnerHTML={{ __html: ZODIAC_GLYPH[z.name.toLowerCase()] || "" }}
                />
              </g>
            );
          })}
        </motion.g>

        {/* Degree ticks */}
        <motion.g
          initial={reduce ? false : { opacity: 0 }}
          animate={reduce ? {} : { opacity: 1 }}
          transition={{ duration: beat(0.5), delay: beat(0.45) }}
        >
          {Array.from({ length: 72 }).map((_, i) => {
            const deg = i * 5;
            const major = i % 6 === 0;
            const len = major ? 8 : 4;
            const a = wheelPolar(cx, cy, rTick, deg);
            const b = wheelPolar(cx, cy, rTick - len, deg);
            return (
              <line key={deg} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(237,233,247,0.26)" strokeWidth={major ? 1.1 : 0.5} />
            );
          })}
        </motion.g>

        {/* Aspect web */}
        <g>
          {aspects.map((asp, i) => {
            const pa = wheelPolar(cx, cy, rAspect, asp.lonA);
            const pb = wheelPolar(cx, cy, rAspect, asp.lonB);
            const stroke = asp.kind === "hard" ? "rgba(154,126,230,0.5)" : "rgba(220,205,250,0.4)";
            return (
              <motion.line
                key={`${asp.a}-${asp.b}-${i}`}
                x1={pa.x}
                y1={pa.y}
                x2={pb.x}
                y2={pb.y}
                stroke={stroke}
                strokeWidth={0.9}
                strokeDasharray={asp.kind === "hard" ? "3 4" : undefined}
                initial={reduce ? false : { pathLength: 0, opacity: 0 }}
                animate={reduce ? {} : { pathLength: 1, opacity: 1 }}
                transition={{ duration: beat(0.5), delay: beat(1.15 + i * 0.03), ease: "easeOut" }}
              />
            );
          })}
          <circle cx={cx} cy={cy} r={rAspect} fill="none" stroke="rgba(237,233,247,0.12)" strokeWidth={0.6} />
        </g>

        {/* Planets */}
        {placed.map((p, i) => {
          const tone = WHEEL_TONE[p.key] ?? "#e9e4f2";
          const meta = PLANET_META[p.key];
          const gp = wheelPolar(cx, cy, rGlyph, glyphLon[p.key]);
          const tickEnd = wheelPolar(cx, cy, rZodInner - 3, p.lon);
          const isFocus = focusKey === p.key;
          const dimmed = focusKey != null && !isFocus;
          const drawDelay = focusKey == null ? beat(0.55 + i * 0.09) : 0;
          return (
            <motion.g
              key={p.key}
              initial={reduce ? false : { opacity: 0, scale: 0 }}
              animate={reduce ? {} : { opacity: dimmed ? 0.13 : 1, scale: isFocus ? 1.22 : 1 }}
              transition={{ duration: focusKey == null ? beat(0.42) : 0.9, delay: drawDelay, ease: focusKey == null ? [0.34, 1.3, 0.6, 1] : [0.22, 0.7, 0.2, 1] }}
              style={{ transformOrigin: `${gp.x}px ${gp.y}px` }}
            >
              {isFocus && <circle cx={gp.x} cy={gp.y} r={27} fill={tone} opacity={0.16} />}
              <line x1={gp.x} y1={gp.y} x2={tickEnd.x} y2={tickEnd.y} stroke={tone} strokeOpacity={0.4} strokeWidth={0.8} strokeDasharray="2 2" />
              <circle cx={gp.x} cy={gp.y} r={13} fill="#0a0712" stroke={tone} strokeWidth={isFocus ? 2 : 1.4} filter="url(#lsWheelGlow)" />
              <g
                transform={`translate(${(gp.x - 8.5).toFixed(2)},${(gp.y - 8.5).toFixed(2)}) scale(0.708)`}
                fill="none"
                stroke={tone}
                strokeWidth={2.3}
                strokeLinecap="round"
                strokeLinejoin="round"
                color={tone}
              >
                {ASTRO_PATHS[p.key] ?? null}
              </g>
            </motion.g>
          );
        })}

        {/* Center medallion */}
        <motion.g
          initial={reduce ? false : { opacity: 0 }}
          animate={reduce ? {} : { opacity: 1 }}
          transition={{ duration: beat(0.5), delay: beat(1.0) }}
        >
          <circle cx={cx} cy={cy} r={rHub} fill="rgba(8,6,14,0.82)" stroke="rgba(154,126,230,0.34)" strokeWidth={1} />
          <text x={cx} y={cy - 16} textAnchor="middle" fill="#dccdfa" fontSize={15} className="ls-wheel-centername">
            {name || dom || "Their sky"}
          </text>
          <line x1={cx - 19} y1={cy - 4} x2={cx + 19} y2={cy - 4} stroke="#9a7ee6" strokeWidth={1.4} />
          {bornLabel && (
            <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(237,233,247,0.66)" fontSize={9.5} className="ls-wheel-centerborn">
              BORN {bornLabel}
            </text>
          )}
          {dom && (
            <text x={cx} y={cy + 25} textAnchor="middle" fill="#9a7ee6" fontSize={9.5} className="ls-wheel-centerdom">
              {dom} element
            </text>
          )}
        </motion.g>
      </svg>

      {!hideInfo && (
        <button ref={infoBtnRef} type="button" className="ls-wheel-info" onClick={onInfo} aria-label="Explore the solar system">
          <span className="ls-wheel-info-mark" aria-hidden="true">i</span>
          Explore the solar system
        </button>
      )}
    </div>
  );
}

const COMPUTE_MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
function bornLabelFor(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return "";
  return `${Number(m[3])} ${COMPUTE_MON[Number(m[2]) - 1]} ${m[1]}`;
}

// A number that count-tweens up to its real value (motion value, not setState),
// so the compute readouts read like live measurement, not a printed label.
function DegCount({ value, reduce }: { value: number; reduce: boolean }) {
  const mv = useMotionValue(0);
  const out = useTransform(mv, (v) => Math.round(v));
  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration: 0.55, ease: "easeOut" });
    return () => controls.stop();
  }, [value, reduce, mv]);
  return <motion.span>{out}</motion.span>;
}

// The cinematic "measuring the sky" sequence. Every line names a real operation
// (locate, measure, thread the angles) and the numbers shown are the real values
// the engine returned, so a skeptic who knows their pet is a Leo sees it land and
// believes the rest. It holds on "measuring the angles" until the chart resolves,
// never inventing a value to fill time. Collapses to a single line on reduced motion.
function ComputeSequence({
  chart,
  name,
  date,
  reduce,
  onDone,
}: {
  chart: PetBirthChart | null;
  name: string;
  date: string;
  reduce: boolean;
  onDone: () => void;
}) {
  const [step, setStep] = useState(0);
  // Finish timers live in a ref, not an effect cleanup, so the setStep(4)
  // re-render does not cancel the pending onDone before it fires.
  const finishTimers = useRef<number[]>([]);
  const startedFinish = useRef(false);

  // Timed advance to the "measuring the angles" hold (step 3).
  useEffect(() => {
    if (reduce) return;
    const ids = [
      window.setTimeout(() => setStep(1), 600),
      window.setTimeout(() => setStep(2), 1300),
      window.setTimeout(() => setStep(3), 2000),
    ];
    return () => ids.forEach((id) => clearTimeout(id));
  }, [reduce]);

  // Finish only once the real chart has landed, so the wheel always has data.
  useEffect(() => {
    if (startedFinish.current) return;
    if (reduce) {
      if (!chart) return;
      startedFinish.current = true;
      finishTimers.current.push(window.setTimeout(onDone, 460));
      return;
    }
    if (!chart || step !== 3) return;
    startedFinish.current = true;
    finishTimers.current.push(window.setTimeout(() => setStep(4), 650));
    finishTimers.current.push(window.setTimeout(onDone, 1300));
  }, [chart, step, reduce, onDone]);

  useEffect(() => () => finishTimers.current.forEach((id) => clearTimeout(id)), []);

  const sun = chart?.sun;
  const moon = chart?.moon;
  const aspectCount = useMemo(() => {
    if (!chart) return 0;
    const pts = WHEEL_BODIES
      .map((k) => {
        const lon = wheelLongitude(chart[k as keyof PetBirthChart] as ChartBody | undefined);
        return lon === null ? null : { key: k as string, lon };
      })
      .filter((p): p is { key: string; lon: number } => p !== null);
    return computeWheelAspects(pts).length;
  }, [chart]);

  if (reduce) {
    return (
      <div className="ls-compute" role="status" aria-live="polite">
        <div className="ls-compute-dust" aria-hidden="true" />
        <span className="ls-compute-mote is-lit" aria-hidden="true" />
        <p className="ls-compute-line">Setting the chart for that date.</p>
      </div>
    );
  }

  const lines = [
    "Reading the date.",
    "Finding the Sun.",
    "Then the Moon.",
    "Measuring the angles between them.",
    name ? `The chart for ${name}.` : "The chart, from the date alone.",
  ];

  let readout: ReactNode = null;
  if (step === 1 && sun?.sign) {
    readout = (
      <>Sun · <DegCount value={Math.round(sun.degree ?? 0)} reduce={reduce} />° {sun.sign}</>
    );
  } else if (step === 2 && moon?.sign) {
    readout = (
      <>Moon · <DegCount value={Math.round(moon.degree ?? 0)} reduce={reduce} />° {moon.sign}</>
    );
  } else if (step === 3) {
    readout = (
      <><DegCount value={aspectCount} reduce={reduce} /> angles found</>
    );
  }

  return (
    <div className="ls-compute" role="status" aria-live="polite">
      <div className="ls-compute-dust" aria-hidden="true" />
      <div className="ls-compute-instrument" aria-hidden="true">
        <span className="ls-compute-ring ls-compute-ring-1"><i /></span>
        <span className="ls-compute-ring ls-compute-ring-2"><i /></span>
        <span className="ls-compute-ring ls-compute-ring-3" />
        <span className="ls-compute-sweep" />
        <span className={`ls-compute-mote ${step >= 1 ? "is-lit" : ""}`} />
      </div>
      <div className="ls-compute-readout">{readout}</div>
      <AnimatePresence mode="wait">
        <motion.p
          key={step}
          className="ls-compute-line"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.32, ease: [0.22, 0.7, 0.2, 1] }}
        >
          {lines[step]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

// The solar-system orrery, now a secondary explainer opened by the 'i' on the
// wheel. It keeps the guided camera, the per-body guide bubble and the pips, and
// adds dialog framing (Esc / back / backdrop close, body-scroll lock, focus to the
// back control). The wheel stays the proof; this is the footnote that explains it.
function OrreryInfoOverlay({
  chart,
  name,
  reduce,
  onClose,
}: {
  chart: PetBirthChart;
  name: string;
  reduce: boolean;
  onClose: () => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [active, setActive] = useState(0);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 760);

  const total = JOURNEY_SEQ.length;
  const activeRef = useRef(0);
  activeRef.current = active;

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 760);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Inline panel: close on Esc, move focus to the close control when it opens.
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const { POS, RPOS } = useMemo(() => {
    const ramp = isMobile ? 0.5 : 1;
    const cyBase = ORRERY_POS.sun.y;
    const POS: Record<string, { x: number; y: number }> = {};
    for (const k in ORRERY_POS) {
      const p = ORRERY_POS[k];
      POS[k] = { x: p.x, y: cyBase + (p.y - cyBase) * ramp };
    }
    const a = (ORRERY_ROT * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
    const cx = POS.sun.x, cy = POS.sun.y;
    const RPOS: Record<string, { x: number; y: number }> = {};
    for (const k in POS) {
      const p = POS[k];
      RPOS[k] = { x: cx + (p.x - cx) * ca - (p.y - cy) * sa, y: cy + (p.x - cx) * sa + (p.y - cy) * ca };
    }
    return { POS, RPOS };
  }, [isMobile]);

  const camX = useSpring(0, { stiffness: 80, damping: 22, mass: 0.6 });
  const camY = useSpring(0, { stiffness: 80, damping: 22, mass: 0.6 });
  const camS = useSpring(1, { stiffness: 80, damping: 22, mass: 0.6 });
  const camTransform = useMotionTemplate`translate3d(${camX}%, ${camY}%, 0) scale(${camS})`;

  useEffect(() => {
    const key = JOURNEY_SEQ[active];
    const p = RPOS[key] ?? RPOS.sun;
    if (reduce) { camX.set(0); camY.set(0); camS.set(1); return; }
    if (key === "sun") { camX.set(0); camY.set(0); camS.set(isMobile ? 1.04 : 0.96); return; }
    const zoom = isMobile ? 1.5 : 1.34;
    camX.set(-zoom * (p.x - 50));
    camY.set(-zoom * (p.y - 50));
    camS.set(zoom);
  }, [active, isMobile, reduce, camX, camY, camS, RPOS]);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    let accum = 0;
    let lastY = 0;
    const atEdge = (dir: number) =>
      (dir > 0 && activeRef.current >= total - 1) || (dir < 0 && activeRef.current <= 0);
    const stepBy = (d: number) => setActive((a) => Math.max(0, Math.min(total - 1, a + d)));
    const onWheel = (e: WheelEvent) => {
      const dir = e.deltaY > 0 ? 1 : -1;
      if (atEdge(dir)) { accum = 0; return; }
      e.preventDefault();
      accum += e.deltaY;
      if (Math.abs(accum) >= 60) { stepBy(accum > 0 ? 1 : -1); accum = 0; }
    };
    const onTouchStart = (e: TouchEvent) => { lastY = e.touches[0].clientY; accum = 0; };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      const dy = lastY - y;
      lastY = y;
      const dir = dy > 0 ? 1 : -1;
      if (atEdge(dir)) return;
      e.preventDefault();
      accum += dy;
      if (Math.abs(accum) >= 40) { stepBy(accum > 0 ? 1 : -1); accum = 0; }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [total]);

  const orbitFor = (px: number, py: number) => {
    const cx = POS.sun.x;
    const cy = POS.sun.y;
    const rx = Math.hypot(px - cx, (py - cy) / ORRERY_K);
    return { cx, cy, rx, ry: rx * ORRERY_K };
  };

  const ease = [0.22, 0.7, 0.2, 1] as const;
  const activeKey = JOURNEY_SEQ[active];
  const meta = PLANET_META[activeKey];
  const line = JOURNEY_LINES[activeKey] ?? meta.line;
  const activeBody = chart[activeKey as keyof PetBirthChart] as ChartBody | undefined;
  const activePlacement = activeBody?.sign
    ? `${activeBody.sign}${typeof activeBody.degree === "number" ? ` ${Math.round(activeBody.degree)}°` : ""}`.trim()
    : null;

  return (
    <motion.div
      className="ls-info-inline"
      aria-label="What each planet means"
      initial={reduce ? false : { height: 0, opacity: 0 }}
      animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
      exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.42, ease: [0.22, 0.7, 0.2, 1] }}
      style={{ overflow: "hidden" }}
    >
      <div className="ls-info-panel">
        <div className="ls-info-bar">
          <span className="ls-info-title">The solar system, planet by planet</span>
          <button ref={closeRef} type="button" className="ls-info-back" onClick={onClose}>
            Close
          </button>
        </div>

        <div ref={boxRef} className="ls-orrery" data-lenis-prevent role="group" aria-label="Solar system explainer">
          <div className="ls-orrery-stars" aria-hidden="true" />
          <div className="ls-orrery-nebula" aria-hidden="true" />
          <motion.div className="ls-orrery-camera" style={reduce ? undefined : { transform: camTransform }}>
            <svg className="ls-orrery-orbits" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {(ORRERY_ORBIT_ALL as readonly string[]).map((k) => {
                const o = orbitFor(POS[k].x, POS[k].y);
                return (
                  <ellipse
                    key={k}
                    cx={o.cx}
                    cy={o.cy}
                    rx={o.rx}
                    ry={o.ry}
                    transform={`rotate(-7 ${o.cx} ${o.cy})`}
                    className={activeKey === k ? "is-active" : ""}
                  />
                );
              })}
            </svg>
            {RENDER_ORDER.map((k) => {
              const isMoon = k === "moon";
              const moonDark = isMoon && activeKey === "lilith";
              const bodyActive = activeKey === k || moonDark;
              const jumpIndex = (JOURNEY_SEQ as readonly string[]).indexOf(k);
              return (
                <OrreryBody
                  key={k}
                  bodyKey={k}
                  pos={RPOS[k]}
                  diam={ORRERY_DIAM[k] ?? 4}
                  active={bodyActive}
                  dark={moonDark}
                  showLabel={ORRERY_LABELLED.has(k) || activeKey === k}
                  index={jumpIndex}
                  onPick={(i) => i >= 0 && setActive(i)}
                />
              );
            })}
          </motion.div>
          <span className="ls-orrery-hint" aria-hidden="true">
            {isMobile ? "swipe to explore" : "scroll to explore"}
          </span>
          <div className="ls-orrery-guide">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeKey}
                className="ls-orrery-bubble"
                initial={reduce ? false : { opacity: 0, y: 12, scale: 0.95 }}
                animate={reduce ? {} : { opacity: 1, y: 0, scale: 1 }}
                exit={reduce ? {} : { opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: reduce ? 0 : 0.32, ease }}
              >
                <span className="ls-orrery-bubble-head">
                  <span className="ls-orrery-bubble-glyph"><AstroGlyph name={activeKey} /></span>
                  <span className="ls-orrery-name">{meta.label}</span>
                </span>
                <p className="ls-orrery-line ls-orrery-line--info">{line}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="ls-orrery-pips" role="tablist" aria-label="Bodies">
          {JOURNEY_SEQ.map((k, i) => (
            <button
              key={k}
              type="button"
              className={`ls-orrery-pip ${i === active ? "is-active" : ""}`}
              aria-label={PLANET_META[k].label}
              onClick={() => setActive(i)}
            />
          ))}
        </div>

        <p className="ls-info-note">
          No rising sign here. That one needs the exact minute and place of birth. Everything on the
          wheel comes from the date alone, and all of it is real.
        </p>
      </div>
    </motion.div>
  );
}

// One honest line per dominant element, spoken on the element-stamp beat.
const ELEMENT_LINE: Record<string, string> = {
  Fire: "Fire runs hot and quick. They live out loud, and they warm whatever room they are in.",
  Earth: "Earth is steady and real. They trust what they can touch, and once they settle they stay.",
  Water: "Water feels everything. They read you through their heart, and they remember how it felt.",
  Air: "Air lives in the mind. Curious, social, always half a thought ahead of you.",
};

// Pick the most soothing FEMALE English voice available. Scores neural / "Natural"
// voices and known female names highest, hard-penalises male voices, prefers a soft
// en-GB accent. Falls back gracefully if nothing English is installed.
const VOICE_FEMALE = /(aria|jenny|libby|sonia|michelle|natasha|clara|samantha|karen|serena|moira|tessa|fiona|zira|hazel|susan|catherine|linda|joanna|salli|kimberly|amy|emma|nicole|olivia|ava|allison|victoria|kate|stephanie|female)/i;
const VOICE_MALE = /(david|mark|george|daniel|fred|alex|rishi|guy|james|ryan|thomas|paul|oliver|arthur|brian|male)/i;
const VOICE_NICE = /(natural|neural|online|premium|enhanced)/i;
function pickJourneyVoice(): SpeechSynthesisVoice | null {
  try {
    const vs = window.speechSynthesis.getVoices() || [];
    if (!vs.length) return null;
    const en = vs.filter((v) => /^en(-|_|$)/i.test(v.lang));
    const pool = en.length ? en : vs;
    const score = (v: SpeechSynthesisVoice) => {
      let s = 0;
      const n = v.name || "";
      if (VOICE_NICE.test(n)) s += 6;
      if (VOICE_FEMALE.test(n)) s += 5;
      if (VOICE_MALE.test(n)) s -= 12;
      if (/google uk english female/i.test(n)) s += 5;
      if (/en-GB/i.test(v.lang)) s += 2;
      else if (/en-US/i.test(v.lang)) s += 1;
      if (v.localService) s += 1;
      return s;
    };
    return [...pool].sort((a, b) => score(b) - score(a))[0] || null;
  } catch {
    return null;
  }
}

type Beat = { scene: number; text: string; focus?: string; rate?: number; font?: "caveat"; audio?: string };

function buildBeats(chart: PetBirthChart, name: string): Beat[] {
  const el = (chart.sun?.element || chart.dominantElement || "").trim();
  const elc = el.toLowerCase();
  const sline = (k: keyof typeof PLANET_META) => {
    const b = chart[k as keyof PetBirthChart] as ChartBody | undefined;
    return (b?.sign && SIGN_LINES[k]?.[b.sign]) || JOURNEY_LINES[k] || PLANET_META[k].line;
  };
  const sig = (k: keyof typeof PLANET_META) => {
    const b = chart[k as keyof PetBirthChart] as ChartBody | undefined;
    return (b?.sign || "").toLowerCase();
  };
  const nm = name.trim();
  return [
    { scene: 1, audio: "s1a", text: nm ? `This is the sky the night ${nm} arrived.` : "This is the sky the night they arrived." },
    { scene: 1, audio: "s1b", text: "The real positions. The actual sky, the night they came to you." },
    { scene: 2, audio: "s2a", text: "Thirteen places in the sky. Each one holds something true about who they are." },
    { scene: 2, audio: "s2b", text: "We will open three of them now, gently, one at a time. The full reading is where all thirteen come together." },
    { scene: 3, focus: "sun", audio: "s3a", text: nm ? `First, the Sun. This is who ${nm} is at the centre, before the world asks anything of them.` : "First, the Sun. This is who they are at the centre, before the world asks anything of them." },
    { scene: 3, focus: "sun", audio: `sun-${sig("sun")}`, text: sline("sun") },
    { scene: 3, focus: "sun", audio: "s3c", text: "You have watched this in them since the first day, even if you never had a word for it." },
    { scene: 4, focus: "moon", rate: 0.86, audio: "s4a", text: nm ? `Now the Moon. This is ${nm}'s inner weather. How they feel safe, and how they ask for comfort.` : "Now the Moon. This is their inner weather. How they feel safe, and how they ask for comfort." },
    { scene: 4, focus: "moon", rate: 0.86, audio: `moon-${sig("moon")}`, text: sline("moon") },
    { scene: 4, focus: "moon", rate: 0.86, font: "caveat", audio: "s4c", text: "When they come to you at night, this is the part of them doing the choosing." },
    { scene: 5, focus: "venus", audio: "s5a", text: nm ? `And Venus. This is how ${nm} loves, and the kind of love they reach for back.` : "And Venus. This is how they love, and the kind of love they reach for back." },
    { scene: 5, focus: "venus", audio: `venus-${sig("venus")}`, text: sline("venus") },
    { scene: 5, focus: "venus", audio: "s5c", text: "The way they love you was never random. It was written up there before you met." },
    { scene: 6, audio: "s6a", text: "Three placements in, and a pattern is already showing." },
    { scene: 6, audio: `s6b-${elc}`, text: nm ? `${nm} is a ${el}-led soul.` : `They are a ${el}-led soul.` },
    { scene: 6, audio: `el-${elc}`, text: ELEMENT_LINE[el] || "Their element runs all the way through them." },
    { scene: 7, audio: "s7a", text: "That is three. There are ten more." },
    { scene: 7, audio: "s7b", text: "Mars, the seat of their courage. Saturn, what they carry, and what steadies them." },
    { scene: 7, audio: "s7c", text: "Mercury, how they size up a room. Chiron, the tender place they came in carrying." },
    { scene: 7, audio: "s7d", text: "And the rest. The parts of them you feel every day and have never had named." },
    { scene: 7, audio: "s7e", text: nm ? `We measured all of ${nm}. Right now, you are seeing three.` : "We measured all of them. Right now, you are seeing three." },
    { scene: 8, audio: "s8a", text: "The lines between them are how all of it talks to each other." },
    { scene: 8, audio: "s8b", text: "The full reading is where they stop being thirteen facts and start being one whole creature." },
    { scene: 8, audio: "s8c", text: "And the deeper shape drawn beneath them, where it all comes together." },
    { scene: 9, audio: "s9a", text: nm ? `You came here to find out who ${nm} really is.` : "You came here to find out who they really are." },
    { scene: 9, audio: "s9b", text: "These three say it is real. The other ten say how deep it goes." },
    { scene: 9, audio: "s9c", text: "You have met three of them tonight. The full reading is where you meet all of who they are." },
  ];
}

// The animated, voice-narrated journey. A scene machine over the real wheel: the
// voice reads one beat, the wheel focuses that planet, and on voice-end it breathes
// then advances. Captions are the source of truth (works fully muted + reduced-motion).
function CosmicJourney({
  chart,
  name,
  bornLabel,
  reduce,
  onLead,
  onCheckout,
}: {
  chart: PetBirthChart;
  name: string;
  bornLabel: string;
  reduce: boolean;
  onLead: (email: string) => void;
  onCheckout: () => void;
}) {
  const BEATS = useMemo(() => buildBeats(chart, name), [chart, name]);
  const hasSpeech = typeof window !== "undefined" && "speechSynthesis" in window;

  const [started] = useState(true);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [ended, setEnded] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [infoOpen, setInfoOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [offerMsg, setOfferMsg] = useState("");
  const infoBtnRef = useRef<HTMLButtonElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);

  // Load the soothing female voice (voices arrive async) + stop speech on unmount.
  useEffect(() => {
    if (!hasSpeech) return;
    const load = () => setVoice(pickJourneyVoice());
    load();
    try { window.speechSynthesis.onvoiceschanged = load; } catch { /* ignore */ }
    return () => {
      try { window.speechSynthesis.onvoiceschanged = null; } catch { /* ignore */ }
      try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
    };
  }, [hasSpeech]);

  // The narration + auto-advance engine. Primary voice = pre-rendered Kokoro audio
  // clips (high quality, free, same on every device). Falls back to the browser
  // voice if a clip cannot play, and to a plain timer when muted or no audio.
  useEffect(() => {
    if (!started || !playing || ended || infoOpen) return;
    const b = BEATS[i];
    if (!b) return;
    let cancelled = false;
    let advanced = false;
    let t1 = 0;
    let t2 = 0;
    const advance = () => {
      if (cancelled || advanced) return;
      advanced = true;
      t2 = window.setTimeout(() => {
        if (cancelled) return;
        if (i >= BEATS.length - 1) setEnded(true);
        else setI(i + 1);
      }, 650);
    };
    const timerOnly = () => {
      const dur = Math.max(2600, Math.min(9000, (b.text.length / 12) * 1000));
      t1 = window.setTimeout(advance, dur);
    };
    const speakBrowser = () => {
      if (!hasSpeech) { timerOnly(); return; }
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(b.text);
        u.rate = b.rate ?? 0.9;
        u.pitch = 1.06;
        u.volume = 1.0;
        const v = voice ?? pickJourneyVoice();
        if (v) { u.voice = v; u.lang = v.lang; }
        u.onend = advance;
        u.onerror = advance;
        window.speechSynthesis.speak(u);
        t1 = window.setTimeout(advance, Math.max(7000, (b.text.length / 8) * 1000 + 3500));
      } catch {
        timerOnly();
      }
    };

    if (muted) {
      timerOnly();
    } else if (audioRef.current && b.audio) {
      const a = audioRef.current;
      try {
        a.pause();
        a.onended = advance;
        a.onerror = () => { if (!cancelled && !advanced) speakBrowser(); };
        a.src = `/readings/voice/k3/${b.audio}.mp3`;
        a.currentTime = 0;
        const pr = a.play();
        // Ignore the AbortError that pause/seek throws, so pausing never swaps to the browser voice.
        if (pr && typeof pr.catch === "function") pr.catch((err) => { if (!cancelled && !advanced && !(err && err.name === "AbortError")) speakBrowser(); });
        t1 = window.setTimeout(advance, 16000); // safety if 'ended' never fires
      } catch {
        speakBrowser();
      }
    } else {
      speakBrowser();
    }

    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
      const a = audioRef.current;
      if (a) { try { a.pause(); a.onended = null; a.onerror = null; } catch { /* ignore */ } }
      if (hasSpeech) { try { window.speechSynthesis.cancel(); } catch { /* ignore */ } }
    };
  }, [i, started, playing, muted, ended, infoOpen, nonce, BEATS, hasSpeech, voice]);

  // The journey auto-plays muted (captions + animation). This turns the voice on,
  // inside the user gesture so the browser allows audio playback.
  const enableSound = () => {
    try {
      const a = audioRef.current;
      if (a) { a.muted = false; const p = a.play(); if (p && typeof p.catch === "function") p.catch(() => {}); }
    } catch { /* ignore */ }
    if (hasSpeech) {
      try { const pr = new SpeechSynthesisUtterance(" "); pr.volume = 0; window.speechSynthesis.speak(pr); } catch { /* ignore */ }
    }
    setPlaying(true);
    setMuted(false);
    setNonce((n) => n + 1);
    try { localStorage.setItem("ls_journey_sound", "1"); } catch { /* ignore */ }
  };

  const goNext = () => {
    if (i >= BEATS.length - 1) setEnded(true);
    else setI(i + 1);
  };
  const goPrev = () => { setEnded(false); setI((x) => Math.max(0, x - 1)); };
  const replay = () => setNonce((n) => n + 1);
  const toggleSound = () => setMuted((m) => { const next = !m; try { localStorage.setItem("ls_journey_sound", next ? "0" : "1"); } catch { /* ignore */ } return next; });
  const jumpToScene = (scene: number) => {
    const idx = BEATS.findIndex((b) => b.scene === scene);
    if (idx >= 0) { setEnded(false); setI(idx); }
  };

  const submitOffer = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!/.+@.+\..+/.test(clean)) { setOfferMsg("Add your email to open the full reading."); return; }
    onLead(clean);
    onCheckout();
  };

  const beat = BEATS[i] || BEATS[0];
  const scene = ended ? 9 : beat.scene;
  const focusKey = ended ? null : beat.focus ?? null;
  const showOffer = ended;
  const SCENES = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="ls-journey" onClick={(e) => { if (e.target === e.currentTarget && !showOffer) goNext(); }}>
      <audio ref={audioRef} preload="auto" aria-hidden="true" />
      <div className={`ls-journey-stage ${showOffer ? "is-dim" : ""}`}>
        <NatalWheel
          chart={chart}
          name={name}
          bornLabel={bornLabel}
          reduce={reduce}
          focusKey={focusKey}
          onInfo={() => setInfoOpen(true)}
          infoBtnRef={infoBtnRef}
        />
      </div>
      {!showOffer && muted && (
        <button type="button" className="ls-sound-cta" onClick={enableSound}>
          <Volume2 size={17} /> Play with sound
        </button>
      )}

      {!showOffer && (
        <div className="ls-journey-cap" onClick={() => goNext()}>
          <AnimatePresence mode="wait">
            <motion.p
              key={i}
              className={`ls-cap-line ${beat.font === "caveat" ? "is-caveat" : ""}`}
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={reduce ? {} : { opacity: 1, y: 0 }}
              exit={reduce ? {} : { opacity: 0, y: -10 }}
              transition={{ duration: reduce ? 0 : 0.75, ease: [0.22, 0.7, 0.2, 1] }}
            >
              {beat.text}
            </motion.p>
          </AnimatePresence>
        </div>
      )}

      {showOffer && (
        <motion.div
          className="ls-offer"
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={reduce ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.5, ease: [0.22, 0.7, 0.2, 1] }}
        >
          <h3 className="ls-offer-title">{name ? `Meet all of ${name}.` : "Meet all of them."}</h3>
          <p className="ls-offer-stack">
            You have met three. The full reading opens the rest. What drives them, what they fear, what they have
            survived, what they dream. How it all connects, where their tension sits, the wild part of them, and the
            direction this life is moving them toward.
          </p>
          <form className="ls-offer-form" onSubmit={submitOffer}>
            <input type="email" value={email} autoComplete="email" placeholder="you@example.com" onChange={(e) => { setEmail(e.target.value); if (offerMsg) setOfferMsg(""); }} />
            <button type="submit" className="ls-gold-button ls-violet-button">
              {name ? `Read the rest of ${name}` : "Read the rest of them"} <ArrowRight size={17} />
            </button>
          </form>
          {offerMsg && <p className="ls-chart-message is-error">{offerMsg}</p>}
          <p className="ls-offer-trust">Built from the real sky on {bornLabel}. If it does not sound like them, that is on us.</p>
          <button type="button" className="ls-start-quiet" onClick={() => { setEnded(false); setI(0); }}>Play it again</button>
        </motion.div>
      )}

      {!showOffer && (
        <>
          <div className="ls-journey-dots" role="tablist" aria-label="Chapters">
            {SCENES.map((s) => (
              <button key={s} type="button" className={`ls-jdot ${scene === s ? "is-active" : ""} ${scene > s ? "is-done" : ""}`} aria-label={`Chapter ${s}`} onClick={() => jumpToScene(s)} />
            ))}
          </div>
          <div className="ls-journey-controls" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="ls-jbtn" onClick={goPrev} aria-label="Previous"><CtrlPrev /></button>
            <button type="button" className="ls-jbtn ls-jbtn--play" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause" : "Play"}>
              {playing ? <CtrlPause /> : <CtrlPlay />}
            </button>
            <button type="button" className="ls-jbtn" onClick={replay} aria-label="Replay line"><CtrlReplay /></button>
            <button type="button" className="ls-jbtn" onClick={goNext} aria-label="Next"><CtrlNext /></button>
            <button type="button" className="ls-jbtn ls-jbtn--sound" onClick={toggleSound} aria-label={muted ? "Turn sound on" : "Turn sound off"}>
              {muted ? "Sound off" : "Sound on"}
            </button>
          </div>
        </>
      )}

      <AnimatePresence initial={false}>
        {infoOpen && (
          <OrreryInfoOverlay
            chart={chart}
            name={name}
            reduce={reduce}
            onClose={() => { setInfoOpen(false); infoBtnRef.current?.focus(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// The guided one-way free reading, staged as a ceremony: one planet, one moment.
// After the chart settles the reader is only ever carried forward. An opening
// beat, then the three placements the date can give freely (Sun, Moon, Rising),
// each a full moment: a quiet progress mark (I of III), the astrological glyph
// beside the placement name, the real world arriving dim and lighting as you
// reach it, the reading as short single lines that land one at a time (never a
// paragraph), the sign chip turning over like a card, and the personal per-sign
// line sitting alone with space around it. A breath of dark between planets.
// Then the desire turn (ten dim glyphs, countable, still dark on the wheel),
// then the handoff into "the rest of who they are". Scroll is the only control.
// COLOUR LAW (Danny): this section is cosmic purple + white ONLY. No gold.
// CSP safe (IntersectionObserver plus CSS only), reduced motion safe (all shown,
// no sweeps, one clear order). Note: the compute returns no ascendant (a rising
// needs the exact minute and place), so the Rising slot never fabricates a sign.
type FreePlanetKey = "sun" | "moon" | "rising";
type FreePlanet = {
  key: FreePlanetKey;
  ord: string;
  eyebrow: string;
  frame: string;
  lines: string[];
  hook: string[];
  /* Memorial register: the same moments in remembered tense. Habits move to
     the past they lived in; essence stays present (continuing bonds). The
     discovery wording above is approved and never changes. */
  memFrame?: string;
  memLines?: string[];
  memHook?: string[];
  glow: string;
  photo: string;
  alt: string;
};

const FREE_PLANETS: FreePlanet[] = [
  {
    key: "sun",
    ord: "I of III",
    eyebrow: "The Sun",
    frame: "Who they are, all the way down.",
    lines: [
      "This is the part of them that was never taught and never trained.",
      "The one that shows up whether the day was good or bad.",
    ],
    hook: [
      "It is the thing they do the second the door opens,",
      "every single time, like you had been gone a year.",
    ],
    memFrame: "Who they were, all the way down.",
    memLines: [
      "This is the part of them that was never taught and never trained.",
      "The one that showed up whether the day was good or bad.",
    ],
    memHook: [
      "It was the first thing they did, every single time,",
      "like you had been gone a year.",
    ],
    glow: "#f0d9a6",
    photo: "/readings/sun/sun-amber.png?v=1",
    alt: "The real Sun",
  },
  {
    key: "moon",
    ord: "II of III",
    eyebrow: "The Moon",
    frame: "How they feel, and what settles them.",
    lines: [
      "This is the part that comes out when the house goes quiet.",
      "What they need to feel safe.",
      "What they reach for when the day has been too much.",
    ],
    hook: [
      "It is why, when it has all been too much,",
      "they end up in the one spot that still holds your warmth.",
    ],
    memFrame: "How they felt, and what settled them.",
    memLines: [
      "This is the part that came out when the house went quiet.",
      "What they needed to feel safe.",
      "What they reached for when the day had been too much.",
    ],
    memHook: [
      "It is why, when it had all been too much,",
      "they found the one spot that still held your warmth.",
    ],
    glow: "#d8d3ec",
    photo: NASA_IMG.moon,
    alt: "The real Moon",
  },
  {
    key: "rising",
    ord: "III of III",
    eyebrow: "The Rising",
    frame: "The first face they show the world.",
    lines: [
      "This is what a room meets before it meets the rest of them.",
      "The front door, not the whole house.",
      "How they meet a stranger, and how long it takes to see the real one.",
    ],
    hook: [
      "It is the version of them everyone else describes,",
      "and the version only you get to see underneath.",
    ],
    memFrame: "The first face they showed the world.",
    memLines: [
      "This is what a room met before it met the rest of them.",
      "The front door, not the whole house.",
      "How they met a stranger, and how long it took to see the real one.",
    ],
    memHook: [
      "It was the version of them everyone else described,",
      "and the one only you ever saw underneath.",
    ],
    glow: "#a78bfa",
    photo: NASA_IMG.earth,
    alt: "The horizon at first light",
  },
];

// The Rising placement is never fabricated: a date alone cannot draw a rising, it
// turns on the exact minute and place they arrived. So this slot tells the truth
// and pulls forward, while Sun and Moon carry their real computed signs.
const RISING_PLACE: string[] = [
  "Two of these stand on the day alone.",
  "A rising turns on the exact minute they arrived.",
  "So this is the one face only the full reading can draw.",
];

// The ten unread: nine bodies still dark on the wheel, plus the synthesis mark
// (what all of them do together). Rendered as dim, countable glyphs, never text.
const DARK_GLYPHS = [
  "mercury", "venus", "mars", "jupiter", "saturn",
  "uranus", "neptune", "pluto", "chiron", "synthesis",
] as const;

// The five named desires, each a single line that lights attention as it
// arrives and stirs a pair of the dark glyphs above it.
const FREE_DARK: string[] = [
  "What they are afraid of, and what steadies them when it comes.",
  "How they love you back, in the one language only they use.",
  "What they carry from before you, and what they let go once they were yours.",
  "Who they trust on sight, and who they never quite forgive.",
  "What they want that they cannot ask you for.",
];

// Split a multi-sentence line into single spoken beats so no rendered line is
// ever a paragraph. Sentence boundaries only; the approved wording is kept.
function splitBeats(text: string): string[] {
  if (!text) return [];
  const parts = text.match(/[^.!?]+[.!?]+(?:["')\]]+)?/g);
  return parts ? parts.map((s) => s.trim()).filter(Boolean) : [text.trim()];
}

// One dignified email moment inside the free reading: after The Moon, before
// The Rising. Framed as keeping their reading, wired to the existing
// track-subscriber plumbing, always skippable. Purple and white only.
function FreeKeepGate({ petName, memorial, onLead }: { petName?: string | null; memorial: boolean; onLead?: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "kept" | "skipped">("idle");
  const name = (petName || "").trim();
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!/.+@.+\..+/.test(clean)) return;
    onLead?.(clean);
    setState("kept");
  };
  if (state === "skipped") return null;
  return (
    <section className="ls-fr-keep" aria-label="Keep their reading">
      {state === "kept" ? (
        <>
          <p className="ls-fr-keep-eyebrow">{memorial ? "Kept safe" : "Their reading, kept"}</p>
          <p className="ls-fr-keep-done">Kept. It will be waiting for you.</p>
        </>
      ) : (
        <>
          <p className="ls-fr-keep-eyebrow ls-fr-rv">{memorial ? "Kept safe" : "Their reading, kept"}</p>
          <p className="ls-fr-keep-line ls-fr-rv" style={revealDelay(0.06)}>
            {memorial
              ? (name ? `We will hold ${name}'s reading for you.` : "We will hold their reading for you.")
              : "Save the two you have unlocked."}
          </p>
          <p className="ls-fr-keep-sub ls-fr-rv" style={revealDelay(0.12)}>
            {memorial
              ? "For whenever you are ready to come back to it."
              : (name
                  ? `The Rising is next. ${name}'s reading will be waiting, right where you left it.`
                  : "The Rising is next. Their reading will be waiting, right where you left it.")}
          </p>
          <form className="ls-fr-keep-form ls-fr-rv" style={revealDelay(0.18)} onSubmit={submit}>
            <label htmlFor="ls-keep-email" className="sr-only">Your email</label>
            <input
              id="ls-keep-email"
              className="ls-fr-keep-input"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="ls-fr-keep-btn">Keep it</button>
          </form>
          <button type="button" className="ls-fr-keep-skip ls-fr-rv" style={revealDelay(0.24)} onClick={() => setState("skipped")}>
            Continue without
          </button>
        </>
      )}
    </section>
  );
}

function FreeReveal({ chart, reduce, petName, onLead }: { chart: PetBirthChart; reduce: boolean; petName?: string; onLead?: (email: string) => void }) {
  const rootRef = useRef<HTMLDivElement>(null);

  // The memorial register keeps its hush: the ceremony itself is shared, but
  // the ten-glyph tease and the named-desire lines stay off that path.
  const [memorial, setMemorial] = useState<boolean>(() => getIntent() === "memorial");
  useEffect(() => {
    const onIntent = () => setMemorial(getIntent() === "memorial");
    window.addEventListener(INTENT_EVENT, onIntent);
    return () => window.removeEventListener(INTENT_EVENT, onIntent);
  }, []);

  // One observer: latches each line in once (data-in, permanent) and toggles the
  // ASMR play-state per world (is-live) so only the on-screen planet animates.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === "undefined") return;
    const revs = Array.from(root.querySelectorAll<HTMLElement>(".ls-fr-rv"));
    const worlds = Array.from(root.querySelectorAll<HTMLElement>(".ls-fr-planet"));
    const reduced = reduce || (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (reduced || !("IntersectionObserver" in window)) {
      revs.forEach((el) => el.setAttribute("data-in", "1"));
      worlds.forEach((el) => el.classList.add("is-live"));
      return;
    }
    // Two observers with different roots. The latch root extends far above
    // the viewport so a one-frame anchor jump past a line still fires it
    // (a viewport-bound observer's ratio stays 0 across such a jump and it
    // never calls back). The play-state observer stays viewport-bound so only
    // on-screen worlds actually animate.
    const ioLatch = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const el = e.target as HTMLElement;
          if (e.isIntersecting || e.boundingClientRect.top < 0) {
            el.setAttribute("data-in", "1");
            // A named desire line stirs its pair of dark glyphs as it lands.
            const dline = el.getAttribute("data-dline");
            if (dline !== null) {
              root
                .querySelectorAll<HTMLElement>(`.ls-fr-dk-g[data-grp="${dline}"]`)
                .forEach((g) => g.setAttribute("data-wake", "1"));
            }
            ioLatch.unobserve(el);
          }
        });
      },
      { rootMargin: "20000px 0px -12% 0px", threshold: 0.18 },
    );
    const ioLive = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          (e.target as HTMLElement).classList.toggle("is-live", e.isIntersecting);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.18 },
    );
    revs.forEach((el) => ioLatch.observe(el));
    worlds.forEach((el) => ioLive.observe(el));
    return () => {
      ioLatch.disconnect();
      ioLive.disconnect();
    };
  }, [reduce, memorial]);

  // Reading-revealed gate: the lower funnel (the rest + reviews + pricing) only
  // enters the page once the reader has been carried through the three free
  // placements and reaches the desire turn. Fire once when the turn scrolls in.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = rootRef.current;
    if (!root) return;
    let done = false;
    const fire = () => {
      if (done) return;
      done = true;
      window.dispatchEvent(new Event("ls-reading-revealed"));
    };
    const target = root.querySelector<HTMLElement>(".ls-fr-turn");
    if (!target || !("IntersectionObserver" in window)) {
      fire();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            fire();
            io.disconnect();
          }
        });
      },
      { rootMargin: "0px 0px -18% 0px", threshold: 0.1 },
    );
    io.observe(target);
    return () => io.disconnect();
  }, []);

  const bodyFor = (k: "sun" | "moon") => chart[k] as ChartBody | undefined;

  return (
    <div className="ls-fr" ref={rootRef}>
      {/* Opening: the chart settles, and we name the love they already feel.
          Every reveal is one short line. Never a paragraph. */}
      <div className="ls-fr-open">
        <span className="ls-fr-settle" aria-hidden="true"><i /><i /><i /></span>
        <p className="ls-fr-open-hero ls-fr-rv">Here they are.</p>
        <p className="ls-fr-open-sub ls-fr-rv" style={revealDelay(0.06)}>The whole of them, mapped to the sky the day they arrived.</p>
        <p className="ls-fr-open-body ls-fr-rv" style={revealDelay(0.12)}>You already know some of this.</p>
        <p className="ls-fr-open-body ls-fr-rv" style={revealDelay(0.18)}>
          {memorial
            ? "You knew the exact thing that made them lose their mind with joy."
            : "You know the exact thing that makes them lose their mind with joy."}
        </p>
        <p className="ls-fr-open-body ls-fr-rv" style={revealDelay(0.24)}>
          {memorial
            ? "You still know the weight of them when they finally fell asleep on you."
            : "You know the weight of them when they finally fall asleep on you."}
        </p>
        <p className="ls-fr-open-turn ls-fr-rv" style={revealDelay(0.3)}>You have felt who they are for a long time.</p>
        <p className="ls-fr-open-turn ls-fr-rv" style={revealDelay(0.36)}>This is where it gets its name.</p>
      </div>

      {/* Three real worlds. One planet, one moment, forward only. */}
      {FREE_PLANETS.map((p, pi) => {
        const body = p.key === "rising" ? undefined : bodyFor(p.key);
        const sign = body?.sign;
        const deg = typeof body?.degree === "number" ? `${Math.round(body.degree)}` : "";
        const signLine = p.key === "rising" ? "" : ((sign && SIGN_LINES[p.key]?.[sign]) || JOURNEY_LINES[p.key] || PLANET_META[p.key]?.line || "");
        const signBeats = splitBeats(signLine);
        // Memorial register: remembered tense for lived habits, essence stays
        // present. Discovery keeps the approved wording untouched.
        const frame = memorial && p.memFrame ? p.memFrame : p.frame;
        const lines = memorial && p.memLines ? p.memLines : p.lines;
        const hook = memorial && p.memHook ? p.memHook : p.hook;
        return (
          <div key={p.key} className="ls-fr-world">
            <section className={`ls-fr-planet is-${p.key}`} style={{ ["--glow" as string]: p.glow } as CSSProperties}>
              <p className="ls-fr-ord ls-fr-rv">{p.ord}</p>
              <div className="ls-fr-mark ls-fr-rv" style={revealDelay(0.05)}>
                <AstroGlyph name={p.key} className="ls-fr-glyph" />
                <span className="ls-fr-name">{p.eyebrow}</span>
              </div>
              <div className="ls-fr-stage ls-fr-rv" style={revealDelay(0.1)}>
                <span className="ls-fr-halo" aria-hidden="true" />
                {p.key === "sun" ? (
                  <span className="ls-fr-sun">
                    <img src={p.photo} alt={p.alt} />
                    <span className="ls-fr-sun-shine" aria-hidden="true" />
                  </span>
                ) : (
                  <span className="ls-fr-disc">
                    <img className="ls-fr-photo" src={p.photo} alt={p.alt} loading="lazy" decoding="async" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }} />
                    <span className="ls-fr-term" aria-hidden="true" />
                    <span className="ls-fr-spec" aria-hidden="true" />
                    <span className="ls-fr-rim" aria-hidden="true" />
                  </span>
                )}
              </div>
              <p className="ls-fr-frame ls-fr-rv" style={revealDelay(0.14)}>{frame}</p>
              <div className="ls-fr-lines">
                {lines.map((ln, i) => (
                  <p key={i} className="ls-fr-ln ls-fr-rv" style={revealDelay(0.16 + i * 0.09)}>{ln}</p>
                ))}
              </div>
              {p.key === "rising" ? (
                <div className="ls-fr-place is-sealed">
                  {RISING_PLACE.map((ln, i) => (
                    <p key={i} className="ls-fr-sealed ls-fr-rv" style={revealDelay(0.08 + i * 0.09)}>{ln}</p>
                  ))}
                </div>
              ) : (
                <div className="ls-fr-place">
                  {/* The payoff: the sign lands like a card turn... */}
                  {sign && (
                    <span className="ls-fr-chipturn ls-fr-rv" style={revealDelay(0.1)}>
                      <span className="ls-fr-chip">{deg ? `${sign} ${deg}°` : sign}</span>
                    </span>
                  )}
                  {/* ...then the personal line sits alone, slightly larger. */}
                  <div className="ls-fr-lineband">
                    {signBeats.map((b, i) => (
                      <p key={i} className="ls-fr-line ls-fr-rv" style={revealDelay(0.42 + i * 0.14)}>{b}</p>
                    ))}
                  </div>
                </div>
              )}
              <div className="ls-fr-hookband">
                {hook.map((h, i) => (
                  <p key={i} className="ls-fr-hook ls-fr-rv" style={revealDelay(0.1 + i * 0.09)}>{h}</p>
                ))}
              </div>
            </section>
            {/* A breath of dark between planets: one faint star in the quiet. */}
            {pi < FREE_PLANETS.length - 1 && (
              <div className="ls-fr-breath" aria-hidden="true"><i /></div>
            )}
            {/* The keep moment: after The Moon, before The Rising. */}
            {p.key === "moon" && (
              <FreeKeepGate petName={petName} memorial={memorial} onLead={onLead} />
            )}
          </div>
        );
      })}

      {/* The desire turn: the gap opens. On the discovery path the ten unread
          placements sit as dim, countable glyphs and the five named desires
          arrive one line at a time. The memorial path keeps its hush: the same
          held-breath copy, no tease row. */}
      <section className="ls-fr-turn">
        <p className="ls-fr-turn-lead ls-fr-rv">You have met three of them.</p>
        <p className="ls-fr-turn-lead2 ls-fr-rv" style={revealDelay(0.06)}>Who they are, how they feel, the face they show first.</p>
        <p className="ls-fr-turn-sub ls-fr-rv" style={revealDelay(0.1)}>
          {memorial ? "There are ten more, still dark on the wheel." : "There are ten more, still dark on the wheel:"}
        </p>
        {!memorial && (
          <>
            <div className="ls-fr-dk ls-fr-rv" style={revealDelay(0.14)} aria-hidden="true">
              {DARK_GLYPHS.map((g, i) => (
                <span key={g} className="ls-fr-dk-g" data-grp={Math.floor(i / 2)}>
                  <AstroGlyph name={g} />
                </span>
              ))}
            </div>
            <div className="ls-fr-dkl">
              {FREE_DARK.map((d, i) => (
                <p key={i} className="ls-fr-dk-line ls-fr-rv" data-dline={i} style={revealDelay(0.08 + i * 0.09)}>{d}</p>
              ))}
            </div>
          </>
        )}
        {!memorial && (
          <p className="ls-fr-turn-own ls-fr-rv" style={revealDelay(0.08)}>Three of thirteen, yours already.</p>
        )}
        <p className="ls-fr-turn-one ls-fr-rv" style={revealDelay(0.05)}>And there is one thing no single planet can show you.</p>
        <p className="ls-fr-turn-what ls-fr-rv" style={revealDelay(0.1)}>What all thirteen do together.</p>
        <p className="ls-fr-turn-what ls-fr-rv" style={revealDelay(0.15)}>The reason they pick the exact spot on you they always pick.</p>
        <p className="ls-fr-turn-what ls-fr-rv" style={revealDelay(0.2)}>The reason they watch you the way they watch you.</p>
        <p className="ls-fr-turn-whole ls-fr-rv" style={revealDelay(0.18)}>The whole of them, read in one place.</p>
      </section>

      {/* Handoff into the rest of who they are. */}
      <div className="ls-fr-handoff ls-fr-rv">
        <button type="button" className="ls-fr-handoff-cta" onClick={() => descendTo("#the-rest")}>
          Meet the rest of who they are
          <ChevronDown size={20} strokeWidth={1.6} />
        </button>
      </div>

      <style>{`
        .ls-fr { position: relative; z-index: 2; max-width: 760px; margin: 0 auto; padding: clamp(8px, 2.5vw, 22px) 6px 0; text-align: center; }
        .ls-fr-rv { opacity: 0; transform: translate3d(0, 24px, 0); transition: opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.95s cubic-bezier(0.16,1,0.3,1); transition-delay: var(--ls-delay, 0s); will-change: opacity, transform; }
        .ls-fr-rv[data-in] { opacity: 1; transform: translate3d(0,0,0); }

        /* Opening */
        .ls-fr-open { position: relative; display: flex; flex-direction: column; align-items: center; gap: clamp(12px, 2.4vw, 20px); padding: clamp(12px, 4vw, 40px) 0 clamp(40px, 9svh, 96px); }
        .ls-fr-settle { position: absolute; top: clamp(-8px, -1vw, 0px); left: 50%; width: min(78vw, 420px); aspect-ratio: 1; transform: translateX(-50%); pointer-events: none; z-index: -1; }
        .ls-fr-settle i { position: absolute; inset: 0; margin: auto; border-radius: 50%; border: 1px solid ${C.lineViolet}; animation: lsFrSettle 6.5s ease-in-out infinite; }
        .ls-fr-settle i:nth-child(1) { width: 40%; height: 40%; }
        .ls-fr-settle i:nth-child(2) { width: 66%; height: 66%; animation-delay: -1.6s; opacity: 0.6; }
        .ls-fr-settle i:nth-child(3) { width: 96%; height: 96%; animation-delay: -3.2s; opacity: 0.32; }
        @keyframes lsFrSettle { 0%, 100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.05); opacity: 0.82; } }
        .ls-fr-open-hero { margin: 0; color: ${C.cream}; font-family: "Fraunces", Georgia, serif; font-weight: 500; font-size: clamp(2.1rem, 7.2vw, 3.4rem); line-height: 1.02; letter-spacing: -0.02em; }
        .ls-fr-open-sub { margin: 0; max-width: 26ch; color: ${C.violetBright}; font-family: "Newsreader", Georgia, serif; font-size: clamp(1.1rem, 3vw, 1.5rem); line-height: 1.32; }
        .ls-fr-open-body { margin: 0; max-width: 34ch; color: ${C.creamDim}; font-family: "Newsreader", Georgia, serif; font-size: clamp(1rem, 2.5vw, 1.16rem); line-height: 1.5; }
        .ls-fr-open-turn { margin: 0; max-width: 32ch; color: ${C.cream}; font-family: "Newsreader", Georgia, serif; font-style: italic; font-size: clamp(1.04rem, 2.7vw, 1.24rem); line-height: 1.45; }
        .ls-fr-open-turn + .ls-fr-open-turn { margin-top: -6px; }

        /* One world: one planet, one moment */
        .ls-fr-planet { position: relative; display: flex; flex-direction: column; align-items: center; padding: clamp(30px, 7svh, 84px) 0; }
        .ls-fr-ord { margin: 0 0 clamp(12px, 2.2vw, 18px); color: rgba(185,165,240,0.72); font-family: "Newsreader", Georgia, serif; font-variant-caps: small-caps; letter-spacing: 0.34em; text-indent: 0.34em; font-size: clamp(0.82rem, 2.1vw, 0.94rem); }
        .ls-fr-mark { display: flex; align-items: center; gap: 14px; margin: 0 0 clamp(18px, 3.2vw, 28px); color: var(--glow); }
        .ls-fr-mark::before, .ls-fr-mark::after { content: ""; width: 26px; height: 1px; background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--glow) 72%, transparent)); }
        .ls-fr-mark::after { background: linear-gradient(90deg, color-mix(in srgb, var(--glow) 72%, transparent), transparent); }
        .ls-fr-glyph { display: block; font-size: clamp(22px, 5vw, 27px); filter: drop-shadow(0 0 9px color-mix(in srgb, var(--glow) 55%, transparent)); }
        .ls-fr-name { font-family: "Newsreader", Georgia, serif; font-size: 12.5px; font-weight: 600; letter-spacing: 0.36em; text-transform: uppercase; }
        .ls-fr-stage { position: relative; display: grid; place-items: center; width: clamp(200px, 60vw, 292px); height: clamp(200px, 60vw, 292px); margin: 0 0 clamp(22px, 4vw, 34px); }
        .ls-fr-halo { position: absolute; inset: -6%; border-radius: 50%; z-index: 1; pointer-events: none; background: radial-gradient(circle, color-mix(in srgb, var(--glow) 40%, transparent) 0%, color-mix(in srgb, var(--glow) 18%, transparent) 36%, color-mix(in srgb, var(--glow) 6%, transparent) 56%, transparent 72%); filter: blur(10px); opacity: 0.68; animation: lsFrBreathe 6s ease-in-out infinite; animation-play-state: paused; }
        @keyframes lsFrBreathe { 0%, 100% { transform: scale(1); opacity: 0.56; } 50% { transform: scale(1.08); opacity: 0.84; } }

        .ls-fr-disc { position: relative; z-index: 2; width: clamp(150px, 46vw, 218px); height: clamp(150px, 46vw, 218px); border-radius: 50%; overflow: hidden; isolation: isolate; box-shadow: 0 0 0 1px rgba(226,220,240,0.10), 0 22px 60px rgba(4,2,12,0.66); animation: lsFrBreatheDisc 7.6s ease-in-out infinite; animation-play-state: paused; }
        @keyframes lsFrBreatheDisc { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.018); } }
        .ls-fr-photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transform: scale(1.04); filter: brightness(0.86) contrast(1.05) saturate(1.03); background: #050310; }
        /* STILL day/night shading, light from the upper-left. No sweep. */
        .ls-fr-term { position: absolute; top: 0; left: 0; z-index: 3; width: 100%; height: 100%; border-radius: 50%; transform: none; pointer-events: none; background: radial-gradient(circle at 66% 40%, rgba(6,4,14,0) 40%, rgba(6,4,14,0.30) 74%, rgba(8,5,17,0.55) 100%); }
        /* the one moving light per world - distinct per key, low intensity. */
        .ls-fr-spec { position: absolute; top: 0; left: 0; z-index: 4; width: 100%; height: 100%; border-radius: 50%; transform: none; mix-blend-mode: screen; pointer-events: none; background: radial-gradient(circle at 34% 30%, color-mix(in srgb, var(--glow) 32%, white) 0%, color-mix(in srgb, var(--glow) 14%, transparent) 26%, transparent 50%); opacity: 0; will-change: opacity, transform; animation-timing-function: ease-in-out; animation-iteration-count: infinite; animation-play-state: paused; }
        /* Moon - a single gentle light-shift */
        .ls-fr-planet.is-moon .ls-fr-spec { animation-name: lsFrGlow; animation-duration: 9.5s; }
        /* Rising (the horizon) - a slow cool sheen */
        .ls-fr-planet.is-rising .ls-fr-spec { background: radial-gradient(ellipse 60% 116% at 40% 28%, color-mix(in srgb, var(--glow) 26%, white) 0%, color-mix(in srgb, var(--glow) 10%, transparent) 36%, transparent 62%); animation-name: lsFrSheen; animation-duration: 13s; }
        @keyframes lsFrGlow { 0%, 100% { opacity: 0.12; transform: translate(-6%, -3%); } 50% { opacity: 0.34; transform: translate(6%, 2%); } }
        @keyframes lsFrSheen { 0%, 100% { opacity: 0.10; transform: translate(-9%, -6%); } 50% { opacity: 0.28; transform: translate(7%, 6%); } }
        .ls-fr-disc::after { content: ""; position: absolute; inset: 0; border-radius: 50%; z-index: 5; pointer-events: none; box-shadow: inset 0 0 30px 9px rgba(4,2,12,0.50); }
        .ls-fr-rim { position: absolute; inset: 0; border-radius: 50%; z-index: 6; pointer-events: none; box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--glow) 60%, transparent), inset 0 0 10px 0 color-mix(in srgb, var(--glow) 32%, transparent); }
        .ls-fr-planet.is-rising .ls-fr-disc::after { box-shadow: inset 0 0 30px 9px rgba(4,2,12,0.42), inset 0 0 12px 2px color-mix(in srgb, var(--glow) 34%, transparent); }

        /* The Sun: a real star, no night side, alive by breath and a slow shine.
           Its corona reads as starlight (white/violet), never a gold UI tint. */
        .ls-fr-sun { position: relative; z-index: 2; display: grid; place-items: center; width: clamp(210px, 60vw, 300px); height: clamp(210px, 60vw, 300px); animation: lsFrBreatheDisc 8s ease-in-out infinite; animation-play-state: paused; }
        .ls-fr-sun img { position: relative; z-index: 2; width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 0 42px rgba(242,194,94,0.32)); }
        .ls-fr-sun-shine { position: absolute; inset: 13%; border-radius: 50%; z-index: 3; pointer-events: none; mix-blend-mode: screen; background: radial-gradient(circle at 38% 34%, rgba(255,255,255,0.46) 0%, rgba(250,220,150,0.16) 30%, transparent 56%); opacity: 0.55; animation: lsFrShine 9s ease-in-out infinite; animation-play-state: paused; }
        @keyframes lsFrShine { 0%, 100% { transform: translate(-4%, -3%) scale(1); opacity: 0.4; } 50% { transform: translate(5%, 4%) scale(1.08); opacity: 0.68; } }

        /* SUSPENSE: each world arrives dim, then lights as you reach it. */
        .ls-fr-disc, .ls-fr-sun { filter: brightness(0.52) saturate(0.6); transition: filter 1.5s cubic-bezier(0.16,1,0.3,1); }
        .ls-fr-halo { filter: opacity(0.24); transition: filter 1.5s cubic-bezier(0.16,1,0.3,1); }
        .ls-fr-planet.is-live .ls-fr-disc, .ls-fr-planet.is-live .ls-fr-sun { filter: brightness(1) saturate(1); }
        .ls-fr-planet.is-live .ls-fr-halo { filter: opacity(1); }

        .ls-fr-planet.is-live .ls-fr-halo,
        .ls-fr-planet.is-live .ls-fr-disc,
        .ls-fr-planet.is-live .ls-fr-term,
        .ls-fr-planet.is-live .ls-fr-spec,
        .ls-fr-planet.is-live .ls-fr-sun,
        .ls-fr-planet.is-live .ls-fr-sun-shine { animation-play-state: running; }

        /* The words for each world: short single lines, one at a time. */
        .ls-fr-frame { margin: 0 0 clamp(14px, 2.6vw, 20px); max-width: 18ch; color: ${C.cream}; font-family: "Fraunces", Georgia, serif; font-weight: 500; font-size: clamp(1.6rem, 5.8vw, 2.4rem); line-height: 1.06; letter-spacing: -0.018em; }
        .ls-fr-lines { display: flex; flex-direction: column; gap: clamp(9px, 1.8vw, 13px); max-width: 40ch; margin: 0 auto; }
        .ls-fr-ln { margin: 0; color: ${C.creamDim}; font-family: "Newsreader", Georgia, serif; font-size: clamp(1.04rem, 2.7vw, 1.22rem); line-height: 1.5; }

        /* The sign lands like a card turn, then the personal line sits alone. */
        .ls-fr-place { margin: clamp(22px, 4vw, 34px) auto clamp(4px, 1vw, 8px); max-width: 40ch; display: flex; flex-direction: column; align-items: center; gap: clamp(16px, 3vw, 24px); }
        .ls-fr-place.is-sealed { gap: clamp(8px, 1.6vw, 12px); }
        .ls-fr-sealed { margin: 0; color: ${C.creamDim}; font-style: italic; font-family: "Newsreader", Georgia, serif; font-size: clamp(1rem, 2.6vw, 1.18rem); line-height: 1.5; }
        .ls-fr-chipturn { display: inline-block; perspective: 640px; }
        .ls-fr-chip { display: inline-flex; align-items: center; gap: 8px; padding: 8px 18px; border-radius: 999px; border: 1px solid color-mix(in srgb, var(--glow) 48%, transparent); background: color-mix(in srgb, var(--glow) 11%, transparent); color: var(--glow); font-family: "Newsreader", Georgia, serif; font-size: 13.5px; font-weight: 600; letter-spacing: 0.13em; text-transform: uppercase; backface-visibility: hidden; }
        .ls-fr-chipturn .ls-fr-chip { transform: rotateX(-94deg); opacity: 0; transform-origin: 50% 120%; transition: transform 1s cubic-bezier(0.3,1.36,0.44,1) 0.15s, opacity 0.4s ease 0.15s, box-shadow 0.8s ease 0.4s; will-change: transform; }
        .ls-fr-chipturn[data-in] .ls-fr-chip { transform: rotateX(0deg); opacity: 1; box-shadow: 0 8px 30px color-mix(in srgb, var(--glow) 20%, transparent); }
        .ls-fr-lineband { display: flex; flex-direction: column; gap: clamp(8px, 1.6vw, 12px); max-width: 30ch; margin: clamp(6px, 1.4vw, 10px) auto 0; }
        .ls-fr-line { margin: 0; color: ${C.cream}; font-family: "Newsreader", Georgia, serif; font-size: clamp(1.24rem, 3.4vw, 1.56rem); line-height: 1.4; }
        .ls-fr-hookband { display: flex; flex-direction: column; gap: 7px; max-width: 38ch; margin: clamp(22px, 4vw, 32px) auto 0; }
        .ls-fr-hook { margin: 0; color: ${C.muted}; font-family: "Newsreader", Georgia, serif; font-style: italic; font-size: clamp(1rem, 2.6vw, 1.16rem); line-height: 1.5; }

        /* A breath of dark between planets: one faint star holds the quiet. */
        .ls-fr-breath { position: relative; height: clamp(56px, 12svh, 120px); }
        .ls-fr-breath i { position: absolute; left: 50%; top: 50%; width: 3px; height: 3px; margin: -1.5px 0 0 -1.5px; border-radius: 50%; background: rgba(185,165,240,0.55); box-shadow: 0 0 12px 3px rgba(154,126,230,0.28); animation: lsFrTwinkle 5.5s ease-in-out infinite; }
        @keyframes lsFrTwinkle { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.95; } }

        /* The desire turn */
        .ls-fr-turn { position: relative; max-width: 44ch; margin: 0 auto; padding: clamp(46px, 10svh, 118px) 0 clamp(28px, 6svh, 68px); display: flex; flex-direction: column; align-items: center; gap: clamp(14px, 2.6vw, 20px); }
        .ls-fr-turn::before { content: ""; position: absolute; top: 0; left: 50%; width: 1px; height: clamp(34px, 7svh, 78px); transform: translateX(-50%); background: linear-gradient(180deg, transparent, ${C.lineViolet}); }
        .ls-fr-turn-lead { margin: 0; color: ${C.cream}; font-family: "Fraunces", Georgia, serif; font-weight: 500; font-size: clamp(1.5rem, 5vw, 2.1rem); line-height: 1.12; letter-spacing: -0.015em; }
        .ls-fr-turn-lead2 { margin: -4px 0 0; color: ${C.creamDim}; font-family: "Fraunces", Georgia, serif; font-weight: 500; font-size: clamp(1.12rem, 3.2vw, 1.5rem); line-height: 1.2; letter-spacing: -0.01em; }
        .ls-fr-turn-sub { margin: 0; color: ${C.creamDim}; font-family: "Newsreader", Georgia, serif; font-size: clamp(1.04rem, 2.6vw, 1.2rem); line-height: 1.5; }

        /* Ten dim glyphs, countable. Still dark on the wheel. */
        .ls-fr-dk { display: flex; justify-content: center; align-items: center; gap: clamp(9px, 2.4vw, 17px); margin: clamp(8px, 1.6vw, 14px) 0 clamp(2px, 0.6vw, 6px); color: ${C.violetBright}; }
        .ls-fr-dk-g { display: inline-flex; font-size: clamp(19px, 4.6vw, 25px); opacity: 0.26; }
        .ls-fr-dk-g[data-wake] { animation: lsFrWake 2s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes lsFrWake { 0% { opacity: 0.26; transform: scale(1); } 32% { opacity: 0.9; transform: scale(1.16); } 100% { opacity: 0.5; transform: scale(1); } }
        .ls-fr-dkl { display: flex; flex-direction: column; gap: clamp(10px, 2vw, 14px); margin: clamp(8px, 1.6vw, 12px) 0 0; max-width: 40ch; }
        .ls-fr-dk-line { margin: 0; color: ${C.creamDim}; font-family: "Newsreader", Georgia, serif; font-size: clamp(1.02rem, 2.6vw, 1.2rem); line-height: 1.5; }
        .ls-fr-dk-line[data-in] { animation: lsFrAttend 1.9s ease 0.25s; }
        @keyframes lsFrAttend { 0% { color: ${C.creamDim}; text-shadow: none; } 30% { color: ${C.cream}; text-shadow: 0 0 18px rgba(167,139,250,0.4); } 100% { color: ${C.creamDim}; text-shadow: none; } }

        .ls-fr-turn-own { margin: clamp(10px, 2vw, 18px) 0 0; color: ${C.cream}; text-shadow: 0 0 24px rgba(167,139,250,0.35); font-family: "Fraunces", Georgia, serif; font-weight: 500; font-size: clamp(1.5rem, 5vw, 2.15rem); line-height: 1.08; letter-spacing: -0.015em; }
        .ls-fr-turn-one { margin: clamp(14px, 3vw, 24px) 0 0; color: ${C.creamDim}; font-family: "Newsreader", Georgia, serif; font-size: clamp(1.06rem, 2.7vw, 1.24rem); line-height: 1.45; }
        .ls-fr-turn-what { margin: 0; color: ${C.cream}; font-family: "Newsreader", Georgia, serif; font-size: clamp(1.08rem, 2.9vw, 1.3rem); line-height: 1.46; }
        .ls-fr-turn-whole { margin: clamp(6px, 1.4vw, 12px) 0 0; color: ${C.cream}; font-family: "Fraunces", Georgia, serif; font-style: italic; font-weight: 500; font-size: clamp(1.44rem, 4.8vw, 2rem); line-height: 1.1; letter-spacing: -0.01em; }

        /* Handoff */
        .ls-fr-handoff { display: flex; justify-content: center; padding: clamp(20px, 4svh, 44px) 0 clamp(6px, 2vw, 16px); }
        .ls-fr-handoff-cta { display: inline-flex; align-items: center; gap: 12px; padding: clamp(15px, 2.4vw, 19px) clamp(26px, 4vw, 38px); border-radius: 999px; border: 1px solid color-mix(in srgb, ${C.violetSoft} 55%, transparent); background: linear-gradient(180deg, rgba(124,92,214,0.24), rgba(124,92,214,0.12)); color: ${C.cream}; font-family: "Newsreader", Georgia, serif; font-size: clamp(1.06rem, 2.7vw, 1.24rem); font-weight: 600; letter-spacing: 0.01em; cursor: pointer; box-shadow: 0 10px 34px rgba(70,40,140,0.34); transition: transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease; }
        .ls-fr-handoff-cta:hover { transform: translateY(-2px); box-shadow: 0 16px 44px rgba(70,40,140,0.46); background: linear-gradient(180deg, rgba(124,92,214,0.32), rgba(124,92,214,0.16)); }
        .ls-fr-handoff-cta svg { animation: lsFrNudge 2.4s ease-in-out infinite; }
        @keyframes lsFrNudge { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(4px); } }

        /* The keep moment: dark violet, quiet, skippable */
        .ls-fr-keep { margin: clamp(8px, 2vw, 18px) auto clamp(30px, 7vw, 54px); padding: clamp(24px, 5vw, 36px) clamp(20px, 5vw, 34px); max-width: 430px; border-radius: 20px; border: 1px solid rgba(154,126,230,0.32); background: linear-gradient(180deg, #16111e 0%, #0d0a14 100%); box-shadow: 0 24px 60px -28px rgba(0,0,0,0.8), 0 0 90px -40px rgba(124,92,214,0.45), inset 0 1px 0 rgba(185,165,240,0.12); display: flex; flex-direction: column; gap: clamp(12px, 2.6vw, 16px); align-items: center; }
        .ls-fr-keep-eyebrow { margin: 0; color: ${C.violetBright}; font-family: "Newsreader", Georgia, serif; font-size: 11px; font-weight: 600; letter-spacing: 0.3em; text-transform: uppercase; }
        .ls-fr-keep-line { margin: 0; color: ${C.cream}; font-family: "Fraunces", Georgia, serif; font-weight: 500; font-size: clamp(1.3rem, 4.4vw, 1.7rem); line-height: 1.16; letter-spacing: -0.01em; max-width: 20ch; }
        .ls-fr-keep-sub { margin: 0; color: ${C.creamDim}; font-family: "Newsreader", Georgia, serif; font-style: italic; font-size: clamp(0.98rem, 2.5vw, 1.08rem); line-height: 1.5; max-width: 30ch; }
        .ls-fr-keep-form { display: flex; width: 100%; gap: 10px; margin-top: 4px; }
        .ls-fr-keep-input { flex: 1 1 auto; min-width: 0; min-height: 50px; padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(154,126,230,0.4); background: rgba(13,10,20,0.85); color: ${C.cream}; font-family: "Newsreader", Georgia, serif; font-size: 16px; }
        .ls-fr-keep-input::placeholder { color: rgba(200,200,210,0.55); }
        .ls-fr-keep-input:focus-visible { outline: 2px solid ${C.violetSoft}; outline-offset: 2px; }
        .ls-fr-keep-btn { flex: 0 0 auto; min-height: 50px; padding: 12px 24px; border-radius: 12px; border: 0; background: linear-gradient(180deg, #8f6de0 0%, #7452c8 48%, #5d47a0 100%); color: #ffffff; font-family: "Newsreader", Georgia, serif; font-size: 1.04rem; font-weight: 700; letter-spacing: 0.01em; cursor: pointer; box-shadow: 0 1px 0 rgba(255,255,255,0.32) inset, 0 -1px 0 rgba(0,0,0,0.25) inset, 0 8px 22px -8px rgba(124,92,214,0.6); transition: filter 0.2s ease, transform 0.3s ease, box-shadow 0.3s ease; }
        .ls-fr-keep-btn:hover { filter: brightness(1.08); transform: translateY(-1px); box-shadow: 0 1px 0 rgba(255,255,255,0.36) inset, 0 -1px 0 rgba(0,0,0,0.25) inset, 0 12px 28px -8px rgba(124,92,214,0.72); }
        .ls-fr-keep-btn:focus-visible { outline: 2px solid ${C.violetSoft}; outline-offset: 3px; }
        .ls-fr-keep-skip { margin-top: 2px; min-height: 44px; padding: 8px 14px; border: 0; background: transparent; color: ${C.muted}; font-family: "Newsreader", Georgia, serif; font-style: italic; font-size: 0.95rem; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
        .ls-fr-keep-skip:hover { color: ${C.creamDim}; }
        .ls-fr-keep-done { margin: 0; color: ${C.cream}; font-family: "Newsreader", Georgia, serif; font-size: clamp(1.05rem, 2.8vw, 1.2rem); line-height: 1.5; }
        @media (max-width: 480px) { .ls-fr-keep-form { flex-direction: column; } .ls-fr-keep-btn { width: 100%; } }

        @media (min-width: 768px) {
          .ls-fr { max-width: 820px; }
          .ls-fr-rv { filter: blur(7px); transition: opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.95s cubic-bezier(0.16,1,0.3,1), filter 0.9s cubic-bezier(0.16,1,0.3,1); }
          .ls-fr-rv[data-in] { filter: blur(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .ls-fr-halo, .ls-fr-disc, .ls-fr-term, .ls-fr-spec, .ls-fr-sun, .ls-fr-sun-shine, .ls-fr-settle i, .ls-fr-handoff-cta svg, .ls-fr-breath i, .ls-fr-dk-g, .ls-fr-dk-line { animation: none !important; }
          .ls-fr-term { display: none !important; }
          .ls-fr-spec { opacity: 0.24 !important; transform: none !important; }
          .ls-fr-photo { filter: brightness(0.96) contrast(1.04) saturate(1.02) !important; }
          .ls-fr-halo { opacity: 0.6 !important; filter: none !important; }
          .ls-fr-disc, .ls-fr-sun { filter: none !important; transition: none !important; }
          .ls-fr-rv { opacity: 1 !important; transform: none !important; filter: none !important; transition: none !important; }
          .ls-fr-keep-btn, .ls-fr-keep-btn:hover { transform: none !important; transition: none !important; }
          .ls-fr-chipturn .ls-fr-chip { transform: none !important; opacity: 1 !important; transition: none !important; }
          .ls-fr-dk-g { opacity: 0.5 !important; }
        }
      `}</style>
    </div>
  );
}

function BirthSkyJourney() {
  const reduce = useReducedMotion() ?? false;
  const infoBtnRef = useRef<HTMLButtonElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const growFromRef = useRef(0);

  const [petName, setPetName] = useState("");
  const [date, setDate] = useState("");
  const [chart, setChart] = useState<PetBirthChart | null>(null);
  const [status, setStatus] = useState<"idle" | "computing" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");
  const [whyOpen, setWhyOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const name = petName.trim();
  const ready = status === "ready";

  // SEAM 3 (the hardest engineering point on the page): when the form hands
  // into the reveal, this section grows from a one-card stage to the full
  // journey + skim stack in a single React swap. Without easing the growth and
  // re-measuring, every ScrollTrigger below (the moon spine, the dawn grade,
  // the checkout trigger) keeps stale positions and the moon derails. So:
  // height tween from the pre-swap height, then clear + ScrollTrigger.refresh()
  // (the spine uses invalidateOnRefresh, so refresh IS the re-measure).
  useLayoutEffect(() => {
    if (!(ready && chart)) return;
    const el = sectionRef.current;
    if (!el) return;
    const from = growFromRef.current;
    growFromRef.current = 0;
    const to = el.offsetHeight;
    if (reduce || !from || Math.abs(to - from) < 80) {
      requestAnimationFrame(() => ScrollTrigger.refresh());
      return;
    }
    const tween = gsap.fromTo(
      el,
      { height: from, overflow: "hidden" },
      {
        height: to,
        duration: 0.9,
        ease: HOUSE,
        onComplete: () => {
          gsap.set(el, { clearProps: "height,overflow" });
          ScrollTrigger.refresh();
        },
      },
    );
    return () => {
      tween.kill();
      gsap.set(el, { clearProps: "height,overflow" });
    };
  }, [ready, chart, reduce]);

  // Beat-by-beat scroll reveal for the skim rows (they mount after the async
  // chart resolves, so the page-level reveal observer has already run — this
  // dedicated observer paces them one-by-one). CSP-safe, reduced-motion safe.
  const skimRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!(ready && chart)) return;
    const root = skimRef.current;
    if (!root || typeof window === "undefined") return;
    const rows = Array.from(root.querySelectorAll<HTMLElement>(".ls-rvrow"));
    if (!rows.length) return;
    // Seated-state lives in a data attribute, NOT a class: React rewrites
    // className when a row flips is-locked -> is-open, which would wipe an
    // observer-added class and empty the row's shell. data-* survives.
    if (reduce || !("IntersectionObserver" in window)) {
      rows.forEach((r) => r.setAttribute("data-in", "1"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.setAttribute("data-in", "1");
            io.unobserve(e.target);
          }
        });
      },
      // Deeper bottom margin: the empty shell is SEEN for a beat before its
      // content seats into it — the visible wait is the telegraph.
      { rootMargin: "0px 0px -14% 0px", threshold: 0.2 },
    );
    rows.forEach((r) => io.observe(r));
    return () => io.disconnect();
  }, [ready, chart, reduce]);

  const bodyFor = (key: keyof typeof PLANET_META): ChartBody | undefined =>
    chart ? (chart[key as keyof PetBirthChart] as ChartBody | undefined) : undefined;

  // Gate 1 — name (optional) + date opens the chart. Fetch fires in parallel with
  // the compute animation; an 8s abort keeps us off a spinner-of-death. Email is
  // asked AFTER the first three placements (Gate 2).
  const handleOpen = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!date) {
      setStatus("error");
      setMessage("Choose their birth or adoption date first.");
      return;
    }
    setStatus("computing");
    setMessage("");
    setChart(null);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    try {
      const url = `${BIRTH_CHART_ENDPOINT}?date=${encodeURIComponent(date)}`;
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`status ${response.status}`);
      const data = (await response.json()) as PetBirthChart;
      if (!data?.sun) throw new Error("incomplete");
      setChart(data);
      // Hand the pet's identity to the checkout (dossier inscription +
      // eyebrow). sessionStorage covers later mounts; the event covers the
      // already-mounted checkout further down this same page.
      try {
        const petPayload = { name: petName.trim() || null, date };
        sessionStorage.setItem("ls_chart_pet", JSON.stringify(petPayload));
        window.dispatchEvent(new CustomEvent("ls-chart-pet", { detail: petPayload }));
      } catch { /* ignore */ }
      // Computed signs travel too, so the checkout's sample excerpt can quote a
      // line that is genuinely THIS pet's placement (never a generic tease).
      try {
        const signsPayload = {
          sun: data.sun?.sign || null,
          moon: data.moon?.sign || null,
          venus: data.venus?.sign || null,
          mercury: data.mercury?.sign || null,
          mars: data.mars?.sign || null,
        };
        sessionStorage.setItem("ls_chart_signs", JSON.stringify(signsPayload));
        window.dispatchEvent(new CustomEvent("ls-chart-signs", { detail: signsPayload }));
      } catch { /* ignore */ }
    } catch (error) {
      console.warn("[Little Souls] birth chart failed", error);
      setChart(null);
      setStatus("error");
      setMessage("The sky did not answer. Try the date again.");
    } finally {
      clearTimeout(timeout);
    }
  };

  // Lead capture for the journey's offer (Scene 9): store the email, then the
  // offer sends them on to the full reading. No on-page unlock, no inbox promise.
  const handleLead = (rawEmail: string, source = "cosmic_journey") => {
    const cleanEmail = rawEmail.trim().toLowerCase();
    if (!/.+@.+\..+/.test(cleanEmail)) return;
    supabase.functions
      .invoke("track-subscriber", {
        body: { email: cleanEmail, event: "birth_chart_lead", petName: petName.trim() || null, source, utm: getUtm() },
      })
      .catch((error) => console.warn("[Little Souls] lead capture failed", error));
    try {
      sessionStorage.setItem("ls_chart_email", cleanEmail);
      // Live handoff: the checkout lower on this page prefills its email field
      // the moment the keep gate is submitted (covers submits after it mounts).
      window.dispatchEvent(new CustomEvent("ls-chart-email", { detail: { email: cleanEmail } }));
    } catch { /* ignore */ }
  };

  const scrollToCheckout = () => descendTo("#begin");

  return (
    <section id="computed-sky" ref={sectionRef} className={`ls-orrery-section ls-parallax-band${ready && chart ? "" : " is-await"}`}>
      {ready && chart ? (
        <FreeReveal chart={chart} reduce={reduce} petName={petName} onLead={(em) => handleLead(em, "free_reading_keep")} />
      ) : (
        <>
          <div className="ls-stage">
            {status === "computing" ? (
              <ComputeSequence
                chart={chart}
                name={name}
                date={date}
                reduce={reduce}
                onDone={() => {
                  // capture the pre-swap height so the reveal growth can tween
                  growFromRef.current = sectionRef.current?.offsetHeight ?? 0;
                  setStatus("ready");
                }}
              />
            ) : (
              <form className="ls-seal-card ls-stage-card ls-reveal" onSubmit={handleOpen}>
                <span className="ls-seal-crest" aria-hidden="true">
                  <svg viewBox="0 0 64 64" width="46" height="46" fill="none">
                    <circle cx="32" cy="32" r="27" stroke="#9a7ee6" strokeOpacity="0.85" strokeWidth="1" />
                    <circle cx="32" cy="32" r="20.5" stroke="#9a7ee6" strokeOpacity="0.4" strokeWidth="1" />
                    <circle cx="32" cy="32" r="23.75" stroke="#9a7ee6" strokeOpacity="0.5" strokeWidth="6.5" strokeDasharray="1 11.44" />
                    <circle cx="32" cy="5" r="2.6" fill="#b9a5f0" className="ls-seal-crest-asc" />
                    <circle cx="32" cy="32" r="2" fill="#9a7ee6" fillOpacity="0.9" />
                  </svg>
                </span>
                <p className="ls-seal-sub">Name optional. The date does the rest.</p>
                <div className="ls-seal-field">
                  <label htmlFor="seal-name">Their name <span>(if they have one)</span></label>
                  <input id="seal-name" className={petName ? "is-filled" : undefined} type="text" value={petName} maxLength={40} onChange={(e) => setPetName(e.target.value)} placeholder="e.g. Bella" />
                </div>
                <div className="ls-seal-field">
                  <label htmlFor="seal-date">Birth date, or the day they came home</label>
                  <input
                    id="seal-date"
                    className={date ? "is-filled" : undefined}
                    type="date"
                    value={date}
                    max="2030-12-31"
                    onChange={(e) => { setDate(e.target.value); if (status === "error") { setStatus("idle"); setMessage(""); } }}
                  />
                </div>
                <button type="submit" className="ls-gold-button ls-violet-button ls-seal-cta">
                  Set the chart <ArrowRight size={17} />
                </button>
                {message && status === "error" && <p className="ls-chart-message is-error">{message}</p>}
                <button type="button" className="ls-seal-why" onClick={() => setWhyOpen((v) => !v)} aria-expanded={whyOpen}>
                  Why no time or place?
                </button>
                {whyOpen && (
                  <div className="ls-seal-help">
                    <p className="ls-seal-help-ln">Rising sign and houses need the exact minute and town.</p>
                    <p className="ls-seal-help-ln" style={{ animationDelay: "0.16s" }}>
                      Planet positions don't, so everything on this chart stands on the date alone.
                    </p>
                  </div>
                )}
              </form>
            )}
          </div>
        </>
      )}
    </section>
  );
}

// High-grade procedural Sun. A fiery radial gradient disc warped by animated
// fractal-noise (churning plasma + flare edge), a finer granulation overlay, and
// limb darkening — crisp at any size, no external asset. Pauses on reduced-motion.
// Genuine real-time WebGL sun. Domain-warped 3D fbm plasma on a faked sphere
// (churning surface + bright active regions), spherical limb darkening, plus a
// Fresnel corona with radiating solar flares. Adapted from the fbm-gas-surface
// technique (sangillee.com) + a polar-flare corona. Premultiplied alpha so it
// composites over deep space. Pauses offscreen / on reduced-motion. Falls back
// to the pre-rendered PNG if WebGL is unavailable, so it never breaks.
function SunGL({ className = "ls-orrery-sun-gl" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || typeof window === "undefined") return;
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: true });
    if (!gl) { setFailed(true); return; }

    const vs = "attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }";
    const fs = [
      "precision highp float;",
      "uniform float u_time; uniform vec2 u_res;",
      "float hash(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7)))*43758.5453123); }",
      "float vnoise(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);",
      "  return mix(mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x), mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),",
      "             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x), mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y), f.z); }",
      "float fbm(vec3 p){ float v=0.0, a=0.5; for(int i=0;i<6;i++){ v+=a*vnoise(p); p=p*2.03+vec3(1.7,9.2,3.3); a*=0.55; } return v; }",
      "void main(){",
      "  vec2 uv=(gl_FragCoord.xy-0.5*u_res)/(0.5*u_res.y);",
      "  float r=length(uv); float t=u_time*0.22;",
      "  float R=0.60;",
      "  vec3 col=vec3(0.0); float alpha=0.0;",
      "  if(r < R*1.02){",
      "    float z=sqrt(max(R*R-r*r,0.0))/R;",
      "    vec3 sp=vec3(uv*2.4, z*2.4);",
      "    vec3 q=vec3(fbm(sp+vec3(0.0,0.0,t)), fbm(sp+vec3(2.3,1.2,t)), fbm(sp+vec3(1.1,3.4,t)));",
      "    float n=fbm(sp+q*1.9+vec3(0.0,0.0,t));",
      "    n=pow(clamp(n,0.0,1.0),1.35);",
      "    vec3 deep=vec3(0.85,0.16,0.0), mid=vec3(1.0,0.52,0.07), hot=vec3(1.0,0.97,0.78);",
      "    col=mix(deep,mid,smoothstep(0.18,0.5,n));",
      "    col=mix(col,hot,smoothstep(0.52,0.92,n+q.x*0.34));",
      "    col+=hot*smoothstep(0.78,1.0,n)*0.9;",
      "    col+=hot*smoothstep(R*0.62,0.0,r)*0.55;",
      "    float limb=smoothstep(R,R*0.12,r);",
      "    col*=0.62+0.7*limb;",
      "    col*=1.55;",
      "    float disc=smoothstep(R+0.012,R-0.02,r);",
      "    col*=disc; alpha=disc;",
      "  }",
      "  float ang=atan(uv.y,uv.x);",
      "  float fl=fbm(vec3(cos(ang)*3.0, sin(ang)*3.0, t*1.6));",
      "  fl*=fbm(vec3(cos(ang)*6.0+t, sin(ang)*6.0, t*0.8));",
      "  float corona=smoothstep(R*1.55,R*0.98,r)*(0.32+1.15*fl);",
      "  corona*=smoothstep(R*0.92,R*1.04,r);",
      "  vec3 cor=mix(vec3(1.0,0.42,0.07), vec3(1.0,0.78,0.3), fl)*corona*1.7;",
      "  col+=cor; alpha=clamp(max(alpha,corona*1.3),0.0,1.0);",
      "  gl_FragColor=vec4(col*alpha, alpha);",
      "}",
    ].join("\n");

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };
    const vsh = compile(gl.VERTEX_SHADER, vs);
    const fsh = compile(gl.FRAGMENT_SHADER, fs);
    const prog = gl.createProgram();
    if (!prog || !vsh || !fsh) { setFailed(true); return; }
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { setFailed(true); return; }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uT = gl.getUniformLocation(prog, "u_time");
    const uR = gl.getUniformLocation(prog, "u_res");
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    let raf = 0;
    let visible = true;
    const render = (ms: number) => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(2, Math.round(rect.width * dpr));
      const h = Math.max(2, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(uT, ms * 0.001);
      gl.uniform2f(uR, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const loop = (ms: number) => {
      render(ms);
      raf = !reduce && visible ? requestAnimationFrame(loop) : 0;
    };
    const io = new IntersectionObserver((es) => {
      visible = es[0].isIntersecting;
      if (visible && !reduce && !raf) raf = requestAnimationFrame(loop);
    }, { threshold: 0.01 });
    io.observe(canvas);
    if (reduce) render(1500);
    else raf = requestAnimationFrame(loop);
    return () => { if (raf) cancelAnimationFrame(raf); io.disconnect(); };
  }, [reduce]);

  if (failed) return <img className="ls-orrery-sun-img" src="/readings/sun/sun-orrery.png" alt="" />;
  return <canvas ref={ref} className={className} aria-hidden="true" />;
}

// Option 1 sun (Danny-picked): real NASA SDO full disc with limb prominences and
// corona keyed into a transparent PNG, shown whole (no circle clip) so the flares
// bleed out into space.
function SunVid({ className = "" }: { className?: string }) {
  return (
    <span className={`ls-orrery-sunvid ${className}`} aria-hidden="true">
      <img src="/readings/sun/sun-opt1.png?v=3" alt="" />
    </span>
  );
}

// Cosmic penguin guide: a cute cartoon wizard penguin (gpt-image-1, transparent
// PNG) that gently bobs beside the speech bubble while it explains the active body.
function CosmicPenguin() {
  return <img className="ls-peng" src="/readings/penguin.png" alt="" aria-hidden="true" />;
}

// One body in the side-view orrery: positioned by its centre (% of box), sized
// by diameter (% of box width), with an optional name label beneath. The Sun is
// the procedural plasma disc; planets are the transparent NASA discs.
function OrreryBody({
  bodyKey,
  pos,
  diam,
  active,
  dark = false,
  showLabel,
  index,
  onPick,
}: {
  bodyKey: string;
  pos: { x: number; y: number };
  diam: number;
  active: boolean;
  dark?: boolean;
  showLabel: boolean;
  index: number;
  onPick: (i: number) => void;
}) {
  const meta = PLANET_META[bodyKey];
  const isSun = bodyKey === "sun";
  const clickable = index >= 0;
  return (
    <div
      className={`ls-orrery-body ${active ? "is-active" : ""} ${clickable ? "is-clickable" : ""} ${isSun ? "is-sun" : ""}`}
      style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: `${diam}%` }}
      onClick={clickable ? () => onPick(index) : undefined}
    >
      <span className="ls-orrery-orb">
        {isSun ? (
          <SunVid />
        ) : NASA_IMG[bodyKey] ? (
          <img src={NASA_IMG[bodyKey]} alt="" loading="lazy" className={dark ? "is-shadowed" : ""} />
        ) : (
          <span className="ls-orrery-pt"><AstroGlyph name={bodyKey} /></span>
        )}
      </span>
      {!isSun && showLabel && <span className="ls-orrery-label">{meta?.label}</span>}
    </div>
  );
}

// One body in the persistent system. Sits at its fixed orbit slot; its scale
// bumps 1 -> big -> 1 across its own scroll segment (grows as you reach it, then
// recedes as the next takes over). Glow fades in/out with it.
// Real NASA SDO solar-flare footage (171A, public domain), graded to deep orange
// with a pulsing aura. Falls back to the poster frame under reduced-motion.
function SunMedia() {
  const reduce = useReducedMotion();
  return (
    <span className="ls-sun-media">
      <span className="ls-sun-disc">
        {reduce ? (
          <img className="ls-sun-video" src="/readings/sun/sun-poster.jpg" alt="" />
        ) : (
          <video className="ls-sun-video" autoPlay muted loop playsInline preload="auto" poster="/readings/sun/sun-poster.jpg">
            <source src="/readings/sun/sun.webm" type="video/webm" />
            <source src="/readings/sun/sun.mp4" type="video/mp4" />
          </video>
        )}
      </span>
    </span>
  );
}

// Live WebGL Sun: domain-warped FBM plasma surface + flaring corona, animated by
// a time uniform. One full-screen-triangle fragment shader, capped DPR, paused
// under reduced-motion. No external library.
function SunCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || typeof window === "undefined") return;
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: true });
    if (!gl) return;
    const vs = "attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }";
    const fs = [
      "precision highp float;",
      "uniform float u_time; uniform vec2 u_res;",
      "float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453123); }",
      "float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);",
      "  return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x), mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x), u.y); }",
      "float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=0.5; } return v; }",
      "void main(){",
      "  vec2 uv=(gl_FragCoord.xy/u_res-0.5); uv.x*=u_res.x/u_res.y;",
      "  float d=length(uv); float t=u_time*0.05;",
      "  vec2 q=uv*3.2;",
      "  float w=fbm(q+t+fbm(q-t*1.3)*1.6);",
      "  float s=fbm(q*1.4+vec2(w*2.0,-t*2.2));",
      "  vec3 deep=vec3(0.66,0.10,0.0), mid=vec3(1.0,0.46,0.06), hot=vec3(1.0,0.93,0.55);",
      "  vec3 col=mix(deep,mid,smoothstep(0.18,0.58,s));",
      "  col=mix(col,hot,smoothstep(0.62,0.98,s+w*0.28));",
      "  float R=0.36;",
      "  float disc=smoothstep(R+0.006,R-0.006,d);",
      "  float ang=atan(uv.y,uv.x);",
      "  float fl=fbm(vec2(ang*2.6, t*4.0))*fbm(vec2(ang*5.0+t, t*2.0));",
      "  float corona=smoothstep(R+0.30,R,d)*(0.35+0.9*fl);",
      "  corona*=smoothstep(R-0.03,R+0.04,d);",
      "  vec3 cor=mix(vec3(1.0,0.4,0.06),vec3(1.0,0.72,0.22),fl)*corona*1.5;",
      "  vec3 final=col*disc+cor;",
      "  float alpha=clamp(max(disc, corona*1.3),0.0,1.0);",
      "  gl_FragColor=vec4(final*alpha, alpha);",
      "}",
    ].join("\n");
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };
    const vsh = compile(gl.VERTEX_SHADER, vs);
    const fsh = compile(gl.FRAGMENT_SHADER, fs);
    const prog = gl.createProgram();
    if (!prog || !vsh || !fsh) return;
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uT = gl.getUniformLocation(prog, "u_time");
    const uR = gl.getUniformLocation(prog, "u_res");
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    let raf = 0;
    const draw = (ms: number) => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = canvas.getBoundingClientRect();
      const w = Math.max(2, Math.round(r.width * dpr));
      const h = Math.max(2, Math.round(r.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(uT, ms * 0.001);
      gl.uniform2f(uR, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    if (reduce) draw(1200);
    else raf = requestAnimationFrame(draw);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduce]);
  return <canvas ref={ref} className="ls-sun-canvas" aria-hidden="true" />;
}

function SystemBody({ bodyKey, journeyIndex, active, onJump, isMobile }: { bodyKey: string; journeyIndex: number; active: number; onJump: (i: number) => void; isMobile: boolean }) {
  const pos = BODY_POS[bodyKey];
  const base = REL_SIZE[bodyKey] ?? 0.3;
  const isSun = bodyKey === "sun";
  const baseDiam = isSun ? 56 : (1 + base * 13) * (isMobile ? 1.6 : 1);
  const top = flattenY(pos.y, isMobile);
  const meta = PLANET_META[bodyKey];
  const isMoon = bodyKey === "moon";
  const activeKey = JOURNEY_SEQ[active];
  // The single Moon serves moon + the two lunar points: full when on Moon, marked
  // for the North Node, and shadowed (dark Moon) for Lilith.
  const moonDark = isMoon && activeKey === "lilith";
  const moonNode = isMoon && activeKey === "northNode";
  const clickable = journeyIndex >= 0 || isMoon;
  const isActive = isMoon
    ? activeKey === "moon" || activeKey === "northNode" || activeKey === "lilith"
    : clickable && journeyIndex === active;
  const jumpTo = isMoon ? (JOURNEY_SEQ as readonly string[]).indexOf("moon") : journeyIndex;
  return (
    <div
      className={`ls-sys-slot ${isActive ? "is-active" : ""} ${clickable ? "is-clickable" : ""}`}
      style={{ left: `${pos.x}%`, top: `${top}%`, width: `${baseDiam}%`, zIndex: isSun ? 0 : isActive ? 5 : 1 }}
      onClick={clickable ? () => onJump(jumpTo) : undefined}
    >
      {isSun ? (
        <span className="ls-sys-sun"><SunMedia /></span>
      ) : NASA_IMG[bodyKey] ? (
        <span className="ls-sys-orb2">
          <img src={NASA_IMG[bodyKey]} alt="" className={moonDark ? "is-shadowed" : ""} loading="lazy" />
          {moonNode && <span className="ls-sys-node ls-sys-node--mark">{PLANET_META.northNode.glyph}</span>}
        </span>
      ) : (
        <span className="ls-sys-glyph">{meta?.glyph}</span>
      )}
    </div>
  );
}

function JourneyReveal({ chart, name, onBegin }: { chart: PetBirthChart | null; name: string; onBegin: () => void }) {
  const sun = chart?.sun;
  const moon = chart?.moon;
  const dom = chart?.dominantElement;
  return (
    <div className="ls-journey-reveal">
      <span className="ls-journey-focus-label">{name ? `${name}'s sky` : "Their sky"}</span>
      <div className="ls-journey-reveal-grid">
        {sun?.sign && (
          <div className="ls-journey-reveal-item">
            <span>☉ Sun</span>
            <strong>{sun.sign}</strong>
            <small>{JOURNEY_LINES.sun}</small>
          </div>
        )}
        {moon?.sign && (
          <div className="ls-journey-reveal-item">
            <span>☽ Moon</span>
            <strong>{moon.sign}</strong>
            <small>{JOURNEY_LINES.moon}</small>
          </div>
        )}
        {dom && (
          <div className="ls-journey-reveal-item">
            <span>✦ Dominant</span>
            <strong>{dom}</strong>
            <small>The thread running through all of it.</small>
          </div>
        )}
      </div>
      <p className="ls-journey-hint">{JOURNEY_HINT}</p>
      <button type="button" className="ls-gold-button ls-violet-button ls-journey-cta" onClick={onBegin}>
        {JOURNEY_CTA} <ArrowRight size={17} />
      </button>
    </div>
  );
}

function PlanetCard({
  planet,
  body,
  locked = false,
  index = 0,
}: {
  planet: keyof typeof PLANET_META;
  body?: ChartBody;
  locked?: boolean;
  index?: number;
}) {
  const meta = PLANET_META[planet];
  const sign = body?.sign;
  const signGlyph = sign ? SIGN_GLYPHS[sign] ?? "" : "";
  const degree = typeof body?.degree === "number" ? `${Math.round(body.degree)}° ` : "";
  return (
    <article className={`ls-planet-card ${locked ? "is-locked" : ""}`} style={revealDelay(index * 0.045)}>
      {meta.img ? (
        <img className="ls-planet-orb" src={meta.img} alt={meta.label} loading="lazy" width={56} height={56} />
      ) : (
        <span className="ls-planet-orb ls-glyph-orb" aria-hidden="true">{meta.glyph}</span>
      )}
      <div className="ls-planet-body">
        <span className="ls-planet-head">
          <i className="ls-planet-glyph" aria-hidden="true">{meta.glyph}</i>
          {meta.label}
        </span>
        {sign && <strong className="ls-planet-sign">{`${signGlyph} ${degree}${sign}`}</strong>}
        <small>{meta.line}</small>
      </div>
    </article>
  );
}

// Real-ish relative orbital periods; start angles staggered so the planets
// never line up (classroom orrery, not a conjunction).
const SOLAR_ORBITS = [
  // Kepler's 3rd law: period proportional to orbit-radius^1.5 (inner fast,
  // outer slow). Sizes keep real relative order, compressed; Sun dwarfs all.
  { planet: "mercury", size: 7, dur: 96, ring: 30, start: 35 },
  { planet: "venus", size: 12, dur: 180, ring: 46, start: 160 },
  { planet: "mars", size: 9, dur: 290, ring: 62, start: 255 },
  { planet: "jupiter", size: 22, dur: 400, ring: 78, start: 100 },
  { planet: "saturn", size: 34, dur: 540, ring: 94, start: 300 },
] as const;

function SolarSystemBackdrop() {
  return (
    <div className="ls-solar" aria-hidden="true">
      <div className="ls-solar-stage">
        {SOLAR_ORBITS.map((o) => (
          <div
            key={o.planet}
            className="ls-solar-ring"
            style={{
              width: `${o.ring}%`,
              animationDuration: `${o.dur}s`,
              animationDelay: `${-(o.start / 360) * o.dur}s`,
            }}
          >
            <img
              src={PLANET_META[o.planet].img}
              alt=""
              loading="lazy"
              style={{ width: o.size, height: o.size }}
            />
          </div>
        ))}
        <img className="ls-solar-sun" src={PLANET_META.sun.img} alt="" loading="lazy" />
      </div>
    </div>
  );
}

function CalcDropdown({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <div className="ls-calc mt-6">
      <button
        type="button"
        className={`ls-calc-toggle ${open ? "is-open" : ""}`}
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="ls-calc-head">
          <span style={eyebrowStyle(C.gold)}>The calculation underneath</span>
          <span className="ls-calc-title">VSOP87 · 13 celestial bodies</span>
        </span>
        <span className="ls-calc-toggle-hint">
          {open ? "Less" : "More"}
          <ChevronDown className="ls-calc-chevron" size={20} strokeWidth={2.25} aria-hidden="true" />
        </span>
      </button>
      {open && (
        <div className="ls-calc-body">
          <figure className="ls-calc-figure">
            <img src="/readings/planets/star-chart.jpg" alt="Antique Copernican planisphere" loading="lazy" />
            <figcaption>Planisphærium Copernicanum. The geometry our engine computes, by hand four centuries ago.</figcaption>
          </figure>
          <p className="ls-calc-lead">
            The feeling is yours. The sky beneath it is measured. Every placement here is
            computed from their own chart with observatory-grade ephemeris, the same maths
            that lands probes on other worlds, pointed at the moment they arrived.
          </p>
          <div className="ls-calc-grid">
            {AUTHORITY_ITEMS.map(({ stat, label, body }) => (
              <article key={label} className="ls-calc-card">
                <span className="ls-calc-stat">{stat}</span>
                <span className="ls-calc-stat-label">{label}</span>
                <p className="ls-calc-stat-body">{body}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CheckoutSection({
  checkoutRef,
  selectedPrice,
  onSelectedPriceChange,
}: {
  checkoutRef: RefObject<HTMLDivElement>;
  selectedPrice: number;
  onSelectedPriceChange: (price: number) => void;
}) {
  // Phase 5 A/B: A = the cosmic two-card grid (control, untouched),
  // B = the Reading Dossier. Assignment is a persisted 50/50 draw
  // (localStorage `ls_checkout_variant`). Memorial-intent visitors are
  // always shown the control — the dossier's endowed-progress rung and
  // was-price have no place near grief — without their stored arm changing.
  // Intent now reads the shared module (URL OR storage OR the fork choice)
  // and stays live: choosing "In my memory" mid-session re-renders this
  // section onto the hushed memorial path.
  const [assignedVariant] = useState<CheckoutVariant>(() => getCheckoutVariant());
  const [memorialIntent, setMemorialIntent] = useState<boolean>(() => getIntent() === "memorial");
  useEffect(() => {
    const onIntent = () => setMemorialIntent(getIntent() === "memorial");
    window.addEventListener(INTENT_EVENT, onIntent);
    return () => window.removeEventListener(INTENT_EVENT, onIntent);
  }, []);
  const variant: CheckoutVariant = memorialIntent ? "A" : assignedVariant;

  // Expose the ACTIVE arm for QA + any downstream reader.
  useEffect(() => {
    try {
      document.body.dataset.checkoutVariant = variant;
    } catch { /* ignore */ }
  }, [variant]);

  return (
    <section
      id="begin"
      className="ls-parallax-band relative px-5 pb-16 sm:pb-28"
      style={{ paddingTop: "var(--funnel-gap, clamp(34px, 5svh, 64px))" }}
    >
      <div className="mx-auto max-w-6xl">
        {!memorialIntent && (
          <header className="ls-pricelead">
            <p className="ls-pricelead-eyebrow ls-reveal">The full soul reading</p>
            <h2 className="ls-pricelead-title ls-reveal" style={revealDelay(0.05)}>Open all of who they are.</h2>
          </header>
        )}
        <div className="ls-checkout-shell mx-auto max-w-6xl p-3 sm:p-5">
          <div className="ls-checkout-vars">
            <InlineCheckout
              ref={checkoutRef}
              ctaLabel="Begin Their Reading"
              charityId="ifaw"
              charityBonus={0}
              onSelectedPriceChange={onSelectedPriceChange}
              memorialDefaultExpanded={memorialIntent}
              memorialOnly={memorialIntent}
              path={memorialIntent ? "memorial" : "discover"}
              visualMode={variant === "B" ? "dossier" : "cosmic"}
            />
          </div>
        </div>
        <span className="sr-only">Selected price {selectedPrice}</span>
      </div>
      <style>{`
        .ls-pricelead { max-width: 640px; margin: 0 auto clamp(22px, 4vw, 40px); text-align: center; }
        .ls-pricelead-eyebrow { margin: 0 0 12px; color: ${C.gold}; font-family: "Newsreader", Georgia, serif; font-size: 13px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; }
        .ls-pricelead-title { margin: 0; color: ${C.cream}; font-family: "Fraunces", Georgia, serif; font-weight: 500; font-size: clamp(1.9rem, 5.6vw, 3rem); line-height: 1.05; letter-spacing: -0.018em; }
      `}</style>
    </section>
  );
}

// ── Sticky begin bar (mobile) ─────────────────────────────────────────────────
// A slim fixed CTA that appears once the reader passes the desire peak ("Break
// every seal.") and rides with them until the checkout section is on screen —
// no more CTA-less scroll between the peak and the price. Mobile only (CSS),
// discovery path only, never on memorial. Anchors to #begin via the shared
// descent so the dawn grade is still seen, not skipped.
function StickyBeginBar() {
  const [memorial, setMemorial] = useState<boolean>(() => getIntent() === "memorial");
  const [on, setOn] = useState(false);
  const { fmt, prices } = useLocalizedPrice();
  useEffect(() => {
    const onIntent = () => setMemorial(getIntent() === "memorial");
    window.addEventListener(INTENT_EVENT, onIntent);
    return () => window.removeEventListener(INTENT_EVENT, onIntent);
  }, []);
  useEffect(() => {
    if (memorial || typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setOn(false);
      return;
    }
    const peak = document.querySelector<HTMLElement>(".ls-rs-close");
    const checkout = document.getElementById("begin");
    if (!peak) return;
    let pastPeak = false;
    let overCheckout = false;
    const update = () => setOn(pastPeak && !overCheckout);
    const ioPeak = new IntersectionObserver(([en]) => {
      pastPeak = en.isIntersecting || en.boundingClientRect.top < 0;
      update();
    }, { threshold: 0.35 });
    ioPeak.observe(peak);
    let ioCheckout: IntersectionObserver | null = null;
    if (checkout) {
      ioCheckout = new IntersectionObserver(([en]) => {
        overCheckout = en.isIntersecting;
        update();
      }, { threshold: 0 });
      ioCheckout.observe(checkout);
    }
    return () => {
      ioPeak.disconnect();
      ioCheckout?.disconnect();
    };
  }, [memorial]);
  if (memorial) return null;
  return (
    <div className={`ls-stickybegin${on ? " show" : ""}`} aria-hidden={!on}>
      <button type="button" tabIndex={on ? 0 : -1} onClick={() => descendTo("#begin")}>
        Begin Their Reading &middot; {fmt(prices.basic)}
      </button>
      <style>{`
        .ls-stickybegin { position: fixed; left: 0; right: 0; bottom: 0; z-index: 39; padding: 9px 16px calc(9px + env(safe-area-inset-bottom)); background: rgba(11,8,18,0.88); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); box-shadow: 0 -6px 24px rgba(0,0,0,0.45); transform: translateY(110%); transition: transform 0.45s cubic-bezier(0.16,1,0.3,1); pointer-events: none; }
        .ls-stickybegin::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(139,123,216,0.35) 20% 80%, transparent); }
        .ls-stickybegin.show { transform: none; pointer-events: auto; }
        .ls-stickybegin button { display: block; width: 100%; max-width: 560px; margin: 0 auto; min-height: 52px; border: 0; border-radius: 12px; cursor: pointer; background: linear-gradient(180deg, #a78bfa 0%, #8266d9 45%, #6a4cc4 100%); color: #ffffff; font-family: "Newsreader", Georgia, serif; font-size: 16.5px; font-weight: 700; letter-spacing: 0.02em; box-shadow: 0 1px 0 rgba(255,255,255,0.4) inset, 0 -1px 0 rgba(0,0,0,0.28) inset, 0 6px 18px -6px rgba(124,92,214,0.45); }
        .ls-stickybegin button:focus-visible { outline: 2px solid #cfc0f4; outline-offset: 3px; }
        @media (min-width: 768px) { .ls-stickybegin { display: none; } }
        @media (prefers-reduced-motion: reduce) { .ls-stickybegin { transition: none; } }
      `}</style>
    </div>
  );
}

// ── The rest of their sky ─────────────────────────────────────────────────────
// The desire beat between the free reveal and the reviews. The free reading opened
// three worlds (Sun, Moon, Rising); here the nine planets that stay sealed are read
// one real world at a time. Each is a genuine NASA / observatory disc lit by a moving
// terminator + specular sweep, an atmospheric rim, a slow breath and a drift of
// foreground dust, exactly as the approved reading preview does. The photo never
// spins (a flat disc rotating reads as a sticker); life is implied only by light
// crossing the sphere. No price, no buy button here — those wait below the reviews.
// Discovery path only, and only once a chart has been computed.
type RestKind = "rocky" | "gas" | "ice";
interface RestBody {
  key: string;
  name: string;
  img: string;
  glow: string;
  kind: RestKind;
  place: { pre: string; em: string; post: string };
  hook: string;
  /* Memorial register: the same trait remembered, not presently performed. */
  memHook?: string;
}
const REST_SKY: RestBody[] = [
  {
    key: "mercury", name: "Mercury", img: NASA_IMG.mercury, glow: "#c3b39a", kind: "rocky",
    place: { pre: "How they read ", em: "you", post: "" },
    hook: "How they take you in. The signals they catch before words, and the way they answer back.",
    memHook: "How they took you in. The signals they caught before words, and the way they answered back.",
  },
  {
    key: "venus", name: "Venus", img: NASA_IMG.venus, glow: "#e6bd7a", kind: "gas",
    place: { pre: "How they ", em: "love", post: "" },
    hook: "Their language of affection. What they give once they trust you, and how they long for it returned.",
    memHook: "Their language of affection. What they gave once they trusted you, and how they longed for it returned.",
  },
  {
    key: "mars", name: "Mars", img: NASA_IMG.mars, glow: "#d1785a", kind: "rocky",
    place: { pre: "What they ", em: "chase", post: "" },
    hook: "The drive underneath the stillness. What they pursue, what they defend, what they will not drop.",
    memHook: "The drive underneath the stillness. What they pursued, what they defended, what they would not drop.",
  },
  {
    key: "jupiter", name: "Jupiter", img: NASA_IMG.jupiter, glow: "#e0a86a", kind: "gas",
    place: { pre: "Where their joy runs ", em: "biggest", post: "" },
    hook: "Where they overflow. The one place their delight has no ceiling and no shame.",
    memHook: "Where they overflowed. The one place their delight had no ceiling and no shame.",
  },
  {
    key: "saturn", name: "Saturn", img: NASA_IMG.saturn, glow: "#e6cf9a", kind: "gas",
    place: { pre: "What ", em: "steadies", post: " them" },
    hook: "Their quiet backbone. The structure that keeps them sure of themselves when everything else moves.",
    memHook: "Their quiet backbone. The structure that kept them sure of themselves when everything else moved.",
  },
  {
    key: "uranus", name: "Uranus", img: NASA_IMG.uranus, glow: "#9fd8e0", kind: "ice",
    place: { pre: "The streak nothing ", em: "tames", post: "" },
    hook: "The wild note in them. The part no routine will ever fully settle, and you would not want it to.",
    memHook: "The wild note in them. The part no routine ever fully settled, and you never wanted it to.",
  },
  {
    key: "neptune", name: "Neptune", img: NASA_IMG.neptune, glow: "#6f8fe8", kind: "ice",
    place: { pre: "What they sense ", em: "first", post: "" },
    hook: "Their sixth sense. What they feel move through a room long before it ever reaches you.",
    memHook: "Their sixth sense. What they felt move through a room long before it ever reached you.",
  },
  {
    key: "pluto", name: "Pluto", img: NASA_IMG.pluto, glow: "#c09080", kind: "rocky",
    place: { pre: "The deep ", em: "pull", post: "" },
    hook: "The undertow beneath it all. The bond so deep it quietly rewrote them, and rewrote you.",
  },
  {
    key: "chiron", name: "Chiron", img: NASA_IMG.chiron, glow: "#9bb8cc", kind: "ice",
    place: { pre: "The wound that became a ", em: "gift", post: "" },
    hook: "The old ache turned into tenderness. What they quietly heal in you, just by being near.",
    memHook: "The old ache turned into tenderness. What they quietly healed in you, just by being near.",
  },
];

function RestLock() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true">
      <path d="M17 9V7a5 5 0 0 0-10 0v2H5v13h14V9h-2zM9 7a3 3 0 0 1 6 0v2H9V7z" />
    </svg>
  );
}

function FullReadingOpens() {
  const [memorial, setMemorial] = useState<boolean>(() => getIntent() === "memorial");
  const [pet, setPet] = useState<{ name: string | null } | null>(() => {
    try {
      const raw = sessionStorage.getItem("ls_chart_pet");
      return raw ? (JSON.parse(raw) as { name: string | null }) : null;
    } catch {
      return null;
    }
  });
  const rootRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  // Keep the free-reveal handoff intact: intent (memorial vs discovery) and the
  // computed pet chart, read on mount and updated live when the chart is computed
  // lower on the page.
  useEffect(() => {
    const onIntent = () => setMemorial(getIntent() === "memorial");
    const onPet = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      setPet(detail && typeof detail === "object" ? (detail as { name: string | null }) : null);
    };
    window.addEventListener(INTENT_EVENT, onIntent);
    window.addEventListener("ls-chart-pet", onPet as EventListener);
    return () => {
      window.removeEventListener(INTENT_EVENT, onIntent);
      window.removeEventListener("ls-chart-pet", onPet as EventListener);
    };
  }, []);

  // One IntersectionObserver drives both the reveal latch (data-in, permanent) and
  // the per-planet ASMR play-state (is-live, toggles so only on-screen discs run).
  useEffect(() => {
    if (!pet) return;
    const root = rootRef.current;
    if (!root || typeof window === "undefined") return;
    const reveals = Array.from(root.querySelectorAll<HTMLElement>(".ls-rs-rv"));
    if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      reveals.forEach((el) => el.setAttribute("data-in", "1"));
      return;
    }
    if (!("IntersectionObserver" in window)) {
      reveals.forEach((el) => el.setAttribute("data-in", "1"));
      root.querySelectorAll<HTMLElement>(".ls-rs-row").forEach((el) => el.classList.add("is-live"));
      return;
    }
    // Latch and play-state need different roots: the latch root reaches far
    // above the viewport so a one-frame anchor jump past a row still reveals
    // it (a viewport-bound observer never fires when the ratio stays 0 across
    // the jump), while the ASMR play-state stays viewport-bound so only the
    // on-screen discs run.
    const ioLatch = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
            entry.target.setAttribute("data-in", "1");
            ioLatch.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "20000px 0px -8% 0px", threshold: 0.22 },
    );
    const ioLive = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          (entry.target as HTMLElement).classList.toggle("is-live", entry.isIntersecting);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.22 },
    );
    root.querySelectorAll<HTMLElement>(".ls-rs-rv").forEach((el) => ioLatch.observe(el));
    root.querySelectorAll<HTMLElement>(".ls-rs-row").forEach((el) => ioLive.observe(el));
    return () => {
      ioLatch.disconnect();
      ioLive.disconnect();
    };
  }, [memorial, pet]);

  // Foreground dust: a few drifting motes per disc, injected once so each planet
  // has its own cosmic dust. Skipped entirely under reduced motion.
  useEffect(() => {
    if (!pet || reduce) return;
    const root = rootRef.current;
    if (!root || typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    root.querySelectorAll<HTMLElement>(".ls-rs-dust").forEach((field) => {
      if (field.childElementCount) return;
      for (let i = 0; i < 6; i++) {
        const p = document.createElement("span");
        p.style.left = `${(12 + Math.random() * 76).toFixed(1)}%`;
        p.style.top = `${(20 + Math.random() * 66).toFixed(1)}%`;
        p.style.setProperty("--dx", `${(Math.random() * 30 - 15).toFixed(1)}px`);
        p.style.setProperty("--dy", `${(-14 - Math.random() * 26).toFixed(1)}px`);
        p.style.animationDelay = `${(Math.random() * 9).toFixed(1)}s`;
        p.style.animationDuration = `${(7 + Math.random() * 6).toFixed(1)}s`;
        field.appendChild(p);
      }
    });
  }, [memorial, pet, reduce]);

  if (!pet) return null;

  return (
    <section ref={rootRef} id="the-rest" className={`ls-rs ls-parallax-band${memorial ? " is-memorial" : ""}`} aria-labelledby="ls-rs-title">
      <div className="ls-rs-grain" aria-hidden="true" />
      <div className="ls-rs-wash" aria-hidden="true" />
      <div className="ls-rs-inner">
        <header className="ls-rs-head">
          {memorial ? (
            <>
              <h2 id="ls-rs-title" className="ls-rs-title ls-rs-rv" style={revealDelay(0.05)}>
                Who they were is still here.
              </h2>
              <p className="ls-rs-lead ls-rs-rv" style={revealDelay(0.1)}>
                Every part of them, still yours to read.
              </p>
            </>
          ) : (
            <>
              <p className="ls-rs-eyebrow ls-rs-rv">The rest of who they are</p>
              <h2 id="ls-rs-title" className="ls-rs-title ls-rs-rv" style={revealDelay(0.05)}>
                The sky did not stop at three.
              </h2>
              <p className="ls-rs-lead ls-rs-rv" style={revealDelay(0.1)}>
                These worlds stood over them the day they arrived. Each holds a part of them still waiting to be read.
              </p>
            </>
          )}
        </header>

        <div className="ls-rs-sky">
          {REST_SKY.map((body, i) => (
            <article
              key={body.key}
              className={`ls-rs-row ls-rs-rv${i % 2 === 1 ? " is-rev" : ""}`}
              style={{ ["--glow" as string]: body.glow, ["--rsi" as string]: i } as CSSProperties}
            >
              <div className="ls-rs-stage">
                <div className="ls-rs-halo" />
                <div className={`ls-rs-disc is-${body.kind} rs-${body.key}`}>
                  <img
                    className="ls-rs-photo"
                    src={body.img}
                    alt={`The real ${body.name}`}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                  <div className="ls-rs-term" />
                  <div className="ls-rs-spec" />
                  <div className="ls-rs-rim" />
                  <div className="ls-rs-dust" aria-hidden="true" />
                </div>
              </div>
              <div className="ls-rs-copy">
                <div className="ls-rs-name">{body.name}</div>
                <h3 className="ls-rs-placement">
                  {body.place.pre}<em>{body.place.em}</em>{body.place.post}
                </h3>
                <p className="ls-rs-hook">{memorial && body.memHook ? body.memHook : body.hook}</p>
                {!memorial && <div className="ls-rs-seal"><RestLock />Sealed in the full reading</div>}
              </div>
            </article>
          ))}
        </div>

        {!memorial && (
          <div className="ls-rs-close ls-rs-rv">
            <h2 className="ls-rs-close-title">Break every seal.</h2>
            <p className="ls-rs-close-line">
              The full reading opens them all, written for this soul alone and no other.
            </p>
            <button type="button" className="ls-rs-close-cta" onClick={() => descendTo("#begin")}>
              Open the full reading
              <ChevronDown size={20} strokeWidth={1.6} />
            </button>
          </div>
        )}
      </div>
      <style>{`
        /* The section paints its own opaque cosmos so nothing from an adjacent band
           ever bleeds through the sealed sky. Grain + wash + per-planet halos carry
           the premium atmosphere; the planets themselves carry the life. */
        .ls-rs { position: relative; z-index: 1; overflow: hidden; background: ${C.cosmos}; padding: clamp(34px, 5svh, 76px) 20px clamp(38px, 5vw, 84px); }
        .ls-rs-grain {
          position: absolute; inset: 0; z-index: 0; pointer-events: none; opacity: 0.05; mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
        }
        .ls-rs-wash {
          position: absolute; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(120% 84% at 50% -8%, rgba(124,92,214,0.18), transparent 58%),
            radial-gradient(120% 88% at 50% 116%, rgba(154,126,230,0.09), transparent 55%),
            radial-gradient(120% 100% at 50% 44%, transparent 56%, rgba(6,4,12,0.6) 100%);
        }
        .ls-rs-inner { position: relative; z-index: 1; max-width: 1040px; margin: 0 auto; }

        .ls-rs-head { text-align: center; max-width: 640px; margin: 0 auto clamp(22px, 3.5vw, 46px); }
        .ls-rs-eyebrow { margin: 0 0 14px; color: ${C.gold}; font-family: "Newsreader", Georgia, serif; font-size: 13px; font-weight: 600; letter-spacing: 0.26em; text-transform: uppercase; }
        .ls-rs-title { margin: 0 0 15px; color: ${C.cream}; font-family: "Fraunces", Georgia, serif; font-weight: 500; font-size: clamp(2rem, 6vw, 3.2rem); line-height: 1.04; letter-spacing: -0.018em; }
        .ls-rs-lead { margin: 0 auto; max-width: 44ch; color: ${C.creamDim}; font-family: "Newsreader", Georgia, serif; font-size: clamp(1.04rem, 2.5vw, 1.22rem); line-height: 1.55; }

        /* the sealed sky - a tight alternating column of real worlds */
        .ls-rs-sky { max-width: 940px; margin: 0 auto; display: flex; flex-direction: column; gap: clamp(30px, 6vw, 54px); }
        .ls-rs-row { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 16px; }

        /* the planet (shared ASMR machine - light crosses it, it never spins) */
        .ls-rs-stage {
          position: relative; flex: 0 0 auto; display: grid; place-items: center;
          width: clamp(150px, 44vw, 208px); height: clamp(150px, 44vw, 208px);
          transform: translate3d(calc(var(--ls-pointer-x, 0) * 7px), calc(var(--ls-pointer-y, 0) * 6px), 0);
          will-change: transform;
        }
        .ls-rs-halo {
          position: absolute; inset: 0; border-radius: 50%; z-index: 1; pointer-events: none;
          background: radial-gradient(circle,
            color-mix(in srgb, var(--glow) 42%, transparent) 0%,
            color-mix(in srgb, var(--glow) 20%, transparent) 34%,
            color-mix(in srgb, var(--glow) 7%, transparent) 54%,
            transparent 72%);
          filter: blur(8px); opacity: 0.72;
          animation: lsRsBreathe 5.8s ease-in-out infinite; animation-delay: calc(var(--rsi, 0) * -0.5s); animation-play-state: paused;
        }
        @keyframes lsRsBreathe { 0%, 100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.08); opacity: 0.86; } }

        .ls-rs-disc {
          position: relative; z-index: 2; width: clamp(120px, 34vw, 166px); height: clamp(120px, 34vw, 166px);
          border-radius: 50%; overflow: hidden; isolation: isolate;
          box-shadow: 0 0 0 1px rgba(226,220,240,0.10), 0 20px 56px rgba(4,2,12,0.66);
          animation: lsRsBreatheDisc 7.4s ease-in-out infinite; animation-delay: calc(var(--rsi, 0) * -0.6s); animation-play-state: paused;
        }
        @keyframes lsRsBreatheDisc { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.016); } }
        .ls-rs-photo {
          position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block;
          transform: scale(1.03); filter: brightness(0.82) contrast(1.04) saturate(1.02); background: #050310;
        }
        /* STILL day/night shading (no sweep) - light reads from the upper-left,
           a soft shadow settles on the lower-right. Static, so it never draws
           the eye; the only motion is the per-world light below, and it differs
           for every planet (no two share the same terminator sweep). */
        .ls-rs-term {
          position: absolute; top: 0; left: 0; z-index: 3; width: 100%; height: 100%; border-radius: 50%;
          transform: none; pointer-events: none;
          background: radial-gradient(circle at 66% 40%,
            rgba(6,4,14,0) 40%, rgba(6,4,14,0.30) 74%, rgba(8,5,17,0.55) 100%);
        }
        /* the one moving light per world - minimal, low intensity, distinct by
           kind. Base carries no animation-name (nothing runs) until a kind rule
           names one; play-state stays paused until the disc is on screen. */
        .ls-rs-spec {
          position: absolute; top: 0; left: 0; z-index: 4; width: 100%; height: 100%; border-radius: 50%;
          transform: none; mix-blend-mode: screen; pointer-events: none;
          background: radial-gradient(circle at 34% 30%,
            color-mix(in srgb, var(--glow) 30%, white) 0%,
            color-mix(in srgb, var(--glow) 12%, transparent) 26%, transparent 50%);
          opacity: 0; will-change: opacity, transform;
          animation-timing-function: ease-in-out; animation-iteration-count: infinite;
          animation-delay: calc(var(--rsi, 0) * -0.8s); animation-play-state: paused;
        }
        /* rocky worlds - a single, gentle light-shift */
        .ls-rs-disc.is-rocky .ls-rs-spec { animation-name: lsRsGlow; animation-duration: 9.5s; }
        /* gas giants - a slow band of light drifting across the disc */
        .ls-rs-disc.is-gas .ls-rs-spec {
          background: linear-gradient(96deg, transparent 14%, color-mix(in srgb, var(--glow) 14%, transparent) 34%,
            color-mix(in srgb, var(--glow) 30%, white) 50%, color-mix(in srgb, var(--glow) 14%, transparent) 66%, transparent 86%);
          animation-name: lsRsBands; animation-duration: 16s; animation-timing-function: linear;
        }
        /* ice giants - a cool diagonal sheen */
        .ls-rs-disc.is-ice .ls-rs-spec {
          background: radial-gradient(ellipse 58% 118% at 38% 28%,
            color-mix(in srgb, var(--glow) 26%, white) 0%, color-mix(in srgb, var(--glow) 10%, transparent) 36%, transparent 62%);
          animation-name: lsRsSheen; animation-duration: 13s;
        }
        /* Saturn - mostly still; a soft glint crosses the rings now and then */
        .ls-rs-disc.rs-saturn .ls-rs-spec {
          background: linear-gradient(74deg, transparent 42%, color-mix(in srgb, var(--glow) 34%, white) 50%, transparent 58%);
          animation-name: lsRsRing; animation-duration: 12s; animation-delay: -3s;
        }
        /* Saturn - hold the full rings inside the circular frame (square 512 asset) */
        .ls-rs-disc.rs-saturn .ls-rs-photo { transform: scale(0.98); filter: brightness(0.92) contrast(1.03) saturate(1.02); }
        @keyframes lsRsGlow {
          0%, 100% { opacity: 0.12; transform: translate(-6%, -3%); }
          50% { opacity: 0.34; transform: translate(6%, 2%); }
        }
        @keyframes lsRsBands {
          0% { opacity: 0.14; transform: translateX(-34%); }
          50% { opacity: 0.30; }
          100% { opacity: 0.14; transform: translateX(34%); }
        }
        @keyframes lsRsSheen {
          0%, 100% { opacity: 0.10; transform: translate(-9%, -6%); }
          50% { opacity: 0.28; transform: translate(7%, 6%); }
        }
        @keyframes lsRsRing {
          0%, 66%, 100% { opacity: 0; transform: translateX(-42%); }
          80% { opacity: 0.32; transform: translateX(0%); }
          90% { opacity: 0; transform: translateX(42%); }
        }
        /* limb darkening, rocky worlds read as spheres */
        .ls-rs-disc::after { content: ""; position: absolute; inset: 0; border-radius: 50%; z-index: 5; pointer-events: none; box-shadow: inset 0 0 26px 8px rgba(4,2,12,0.55); }
        /* limb brighten, gas giants + atmospheres get a warm rim */
        .ls-rs-disc.is-gas::after { box-shadow: inset 0 0 26px 8px rgba(4,2,12,0.36), inset 0 0 12px 2px color-mix(in srgb, var(--glow) 40%, transparent); }
        .ls-rs-disc.is-ice::after { box-shadow: inset 0 0 24px 7px rgba(4,2,12,0.42), inset 0 0 10px 1px color-mix(in srgb, var(--glow) 34%, transparent); }
        .ls-rs-rim { position: absolute; inset: 0; border-radius: 50%; z-index: 6; pointer-events: none; box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--glow) 55%, transparent); }
        .ls-rs-disc.is-gas .ls-rs-rim, .ls-rs-disc.is-ice .ls-rs-rim { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--glow) 70%, transparent), inset 0 0 8px 0 color-mix(in srgb, var(--glow) 40%, transparent); }
        /* foreground cosmic dust */
        .ls-rs-dust { position: absolute; inset: 0; z-index: 7; pointer-events: none; }
        .ls-rs-dust span { position: absolute; width: 2px; height: 2px; border-radius: 50%; background: #efe8ff; opacity: 0; box-shadow: 0 0 6px 1px rgba(224,214,250,0.7); animation: lsRsDust 9s linear infinite; animation-play-state: paused; }
        @keyframes lsRsDust {
          0% { opacity: 0; transform: translate3d(0,0,0) scale(0.6); }
          20% { opacity: 0.7; } 80% { opacity: 0.5; }
          100% { opacity: 0; transform: translate3d(var(--dx, 14px), var(--dy, -20px), 0) scale(1); }
        }
        /* only on-screen discs animate */
        .ls-rs-row.is-live .ls-rs-halo,
        .ls-rs-row.is-live .ls-rs-disc,
        .ls-rs-row.is-live .ls-rs-term,
        .ls-rs-row.is-live .ls-rs-spec,
        .ls-rs-row.is-live .ls-rs-dust span { animation-play-state: running; }

        /* the copy */
        .ls-rs-copy { flex: 1 1 auto; min-width: 0; }
        .ls-rs-name { display: flex; align-items: center; justify-content: center; gap: 12px; margin: 0 0 12px; color: var(--glow); font-family: "Newsreader", Georgia, serif; font-size: 12px; font-weight: 600; letter-spacing: 0.34em; text-transform: uppercase; }
        .ls-rs-name::before, .ls-rs-name::after { content: ""; width: 24px; height: 1px; background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--glow) 70%, transparent)); }
        .ls-rs-placement { margin: 0 0 10px; color: ${C.cream}; font-family: "Fraunces", Georgia, serif; font-weight: 500; font-size: clamp(1.5rem, 5.4vw, 2.05rem); line-height: 1.08; letter-spacing: -0.015em; }
        .ls-rs-placement em { font-style: italic; color: ${C.goldSoft}; }
        .ls-rs-hook { margin: 0 auto; max-width: 40ch; color: ${C.muted}; font-family: "Newsreader", Georgia, serif; font-size: clamp(1rem, 2.6vw, 1.14rem); line-height: 1.5; }
        .ls-rs-seal { display: inline-flex; align-items: center; gap: 8px; margin-top: 16px; color: ${C.gold}; opacity: 0.9; font-family: "Newsreader", Georgia, serif; font-size: 11px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; }
        .ls-rs-seal svg { width: 12px; height: 13px; }

        /* the close - ache only, no price, no button (pricing waits below reviews) */
        .ls-rs-close { text-align: center; max-width: 560px; margin: clamp(46px, 7vw, 84px) auto 0; }
        .ls-rs-close-cta { display: inline-flex; align-items: center; gap: 12px; margin-top: clamp(20px, 3.6vw, 30px); padding: clamp(15px, 2.4vw, 19px) clamp(26px, 4vw, 38px); border-radius: 999px; border: 1px solid color-mix(in srgb, ${C.violetSoft} 55%, transparent); background: linear-gradient(180deg, rgba(124,92,214,0.24), rgba(124,92,214,0.12)); color: ${C.cream}; font-family: "Newsreader", Georgia, serif; font-size: clamp(1.06rem, 2.7vw, 1.24rem); font-weight: 600; letter-spacing: 0.01em; cursor: pointer; box-shadow: 0 10px 34px rgba(70,40,140,0.34); transition: transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease; }
        .ls-rs-close-cta:hover { transform: translateY(-2px); box-shadow: 0 16px 44px rgba(70,40,140,0.46); background: linear-gradient(180deg, rgba(124,92,214,0.32), rgba(124,92,214,0.16)); }
        .ls-rs-close-cta:focus-visible { outline: 2px solid ${C.violetSoft}; outline-offset: 3px; }
        .ls-rs-close-cta svg { animation: lsRsNudge 2.4s ease-in-out infinite; }
        @keyframes lsRsNudge { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(4px); } }
        .ls-rs-close-title { margin: 0 0 14px; color: ${C.cream}; font-family: "Fraunces", Georgia, serif; font-weight: 500; font-size: clamp(1.7rem, 5vw, 2.6rem); line-height: 1.06; letter-spacing: -0.015em; }
        .ls-rs-close-line { margin: 0 auto; max-width: 42ch; color: ${C.creamDim}; font-family: "Newsreader", Georgia, serif; font-size: clamp(1.02rem, 2.5vw, 1.18rem); line-height: 1.55; }

        /* reveal - opacity + rise on mobile, blur added on desktop */
        .ls-rs-rv { opacity: 0; transform: translate3d(0, 22px, 0); transition: opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.95s cubic-bezier(0.16,1,0.3,1); transition-delay: var(--ls-delay, 0s); will-change: opacity, transform; }
        .ls-rs-rv[data-in] { opacity: 1; transform: translate3d(0,0,0); }

        @media (min-width: 768px) {
          .ls-rs { padding: clamp(48px, 6svh, 104px) 24px clamp(48px, 6vw, 104px); }
          .ls-rs-sky { gap: clamp(40px, 6vw, 66px); }
          .ls-rs-row { flex-direction: row; text-align: left; gap: clamp(30px, 5vw, 56px); }
          .ls-rs-row.is-rev { flex-direction: row-reverse; text-align: right; }
          .ls-rs-name { justify-content: flex-start; }
          .ls-rs-row.is-rev .ls-rs-name { justify-content: flex-end; }
          .ls-rs-hook { margin: 0; }
          .ls-rs-row.is-rev .ls-rs-hook { margin-left: auto; }
          .ls-rs-rv { filter: blur(6px); transition: opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.95s cubic-bezier(0.16,1,0.3,1), filter 0.9s cubic-bezier(0.16,1,0.3,1); }
          .ls-rs-rv[data-in] { filter: blur(0); }
        }

        /* memorial - the same real worlds, hushed: softer light + lower contrast,
           no seal and no pay-pressure. Still lit, still theirs. */
        .ls-rs.is-memorial .ls-rs-wash {
          background:
            radial-gradient(120% 84% at 50% -8%, rgba(120,108,150,0.12), transparent 58%),
            radial-gradient(120% 100% at 50% 46%, transparent 58%, rgba(6,4,12,0.6) 100%);
        }
        .ls-rs.is-memorial .ls-rs-photo { filter: brightness(0.72) contrast(0.99) saturate(0.9); }
        .ls-rs.is-memorial .ls-rs-halo { opacity: 0.52; }

        /* reduced motion: real planets static + lit, no sweeps, no drift, no dust */
        @media (prefers-reduced-motion: reduce) {
          .ls-rs-halo, .ls-rs-disc, .ls-rs-term, .ls-rs-spec, .ls-rs-dust span { animation: none !important; }
          .ls-rs-term { display: none !important; }
          .ls-rs-spec { opacity: 0.32 !important; transform: none !important; }
          .ls-rs-photo { filter: brightness(0.94) contrast(1.03) saturate(1.02) !important; }
          .ls-rs-halo { opacity: 0.58 !important; transform: none !important; }
          .ls-rs-stage { transform: none !important; }
          .ls-rs-rv { opacity: 1 !important; transform: none !important; filter: none !important; transition: none !important; }
          .ls-rs-close-cta, .ls-rs-close-cta svg { animation: none !important; transform: none !important; transition: none !important; }
        }
      `}</style>
    </section>
  );
}

// ── The one value screen ──────────────────────────────────────────────────────
// Everything the full reading holds, said once: the thirteen placements, the
// keepsake with their photo, SoulSpeak and the monthly horoscope. One concrete
// tile each, then straight to the reviews. This single screen replaced the old
// keepsake rung, the three value moments and the After-Their-Reading grid: the
// post-peak stretch was repeating its promise three screens in a row.
// Discovery path only — the memorial path keeps its hush.
const VALUE_MOMENTS: { key: string; label: string; name: string; line: string; Icon?: typeof AudioLines; photo?: string }[] = [
  {
    key: "placements",
    label: "Thirteen placements",
    name: "All thirteen, read in full.",
    line: "The ten still dark on the wheel, every one of them opened and read.",
    Icon: Orbit,
  },
  {
    key: "keepsake",
    label: "The keepsake",
    name: "Their face at the very centre.",
    line: "Made with their photo, kept for as long as you want to hold on to them.",
    photo: "/pets/pet-cockapoo.webp",
  },
  {
    key: "soulspeak",
    label: "SoulSpeak",
    name: "Hear them in their own voice.",
    line: "The words they never had a mouth for, spoken at last in a voice that is theirs.",
    Icon: AudioLines,
  },
  {
    key: "horoscope",
    label: "Monthly Horoscope",
    name: "Their year, as it turns.",
    line: "Each month a new horoscope arrives for the season of their soul, so there is always more of them to meet.",
    Icon: Mail,
  },
];

function ValueMoments() {
  const [memorialIntent, setMemorialIntent] = useState<boolean>(() => getIntent() === "memorial");
  useEffect(() => {
    const onIntent = () => setMemorialIntent(getIntent() === "memorial");
    window.addEventListener(INTENT_EVENT, onIntent);
    return () => window.removeEventListener(INTENT_EVENT, onIntent);
  }, []);
  if (memorialIntent) return null;

  return (
    <section className="ls-vm ls-parallax-band" aria-labelledby="ls-vm-title">
      <div className="ls-vm-inner">
        <header className="ls-vm-head ls-reveal">
          <p className="ls-vm-eyebrow">Inside the full reading</p>
          <h2 id="ls-vm-title" className="ls-vm-title">Everything that makes them who they are, kept in one place.</h2>
        </header>
        <div className="ls-vm-grid">
          {VALUE_MOMENTS.map(({ key, label, name, line, Icon, photo }, i) => (
            <article key={key} className="ls-vm-card ls-reveal" style={revealDelay(0.06 + i * 0.08)}>
              <span className="ls-vm-motif" aria-hidden="true">
                {photo ? (
                  <img className="ls-vm-photo" src={photo} alt="" width={64} height={64} loading="lazy" decoding="async" />
                ) : Icon ? (
                  <Icon size={30} strokeWidth={1.5} />
                ) : null}
              </span>
              <div className="ls-vm-copy">
                <span className="ls-vm-label">{label}</span>
                <h3 className="ls-vm-name">{name}</h3>
                <p className="ls-vm-line">{line}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="ls-vm-pull ls-reveal" style={revealDelay(0.38)}>The people below opened one. They say it best.</p>
      </div>
      <style>{`
        .ls-vm { position: relative; z-index: 1; background: ${C.cosmos}; padding: clamp(28px, 5svh, 66px) 20px clamp(32px, 5svh, 72px); }
        .ls-vm-inner { max-width: 660px; margin: 0 auto; }
        .ls-vm-head { text-align: center; margin: 0 auto clamp(26px, 5vw, 44px); }
        .ls-vm-eyebrow { margin: 0 0 14px; color: ${C.gold}; font-family: "Newsreader", Georgia, serif; font-size: 12px; font-weight: 600; letter-spacing: 0.3em; text-transform: uppercase; }
        .ls-vm-title { margin: 0 auto; max-width: 24ch; color: ${C.cream}; font-family: "Fraunces", Georgia, serif; font-weight: 500; font-size: clamp(1.7rem, 5.4vw, 2.5rem); line-height: 1.1; letter-spacing: -0.016em; }
        .ls-vm-grid { display: flex; flex-direction: column; gap: clamp(16px, 3vw, 24px); }
        .ls-vm-card { position: relative; display: flex; align-items: center; gap: clamp(18px, 4vw, 28px); padding: clamp(22px, 4.6vw, 30px) clamp(20px, 4.6vw, 32px); border-radius: 18px; background: radial-gradient(120% 90% at 0% 0%, rgba(154,126,230,0.07), transparent 60%), linear-gradient(180deg, ${C.cosmos2} 0%, ${C.cosmos} 100%); box-shadow: 0 1px 2px rgba(0,0,0,0.45), 0 20px 50px rgba(0,0,0,0.32); }
        .ls-vm-card::before { content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1px; pointer-events: none; background: linear-gradient(165deg, rgba(154,126,230,0.32) 0%, rgba(154,126,230,0.14) 46%, rgba(154,126,230,0.26) 100%); -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; }
        .ls-vm-motif { flex: 0 0 auto; display: grid; place-items: center; width: 64px; height: 64px; border-radius: 50%; overflow: hidden; color: ${C.goldSoft}; border: 1px solid rgba(154,126,230,0.38); background: radial-gradient(circle at 50% 36%, rgba(154,126,230,0.16), rgba(154,126,230,0.04) 70%); box-shadow: 0 10px 26px -12px rgba(154,126,230,0.4); }
        .ls-vm-motif svg { display: block; }
        .ls-vm-photo { width: 100%; height: 100%; object-fit: cover; display: block; }
        .ls-vm-copy { flex: 1 1 auto; min-width: 0; }
        .ls-vm-label { display: block; margin: 0 0 8px; color: ${C.gold}; font-family: "Newsreader", Georgia, serif; font-size: 11px; font-weight: 700; letter-spacing: 0.3em; text-transform: uppercase; }
        .ls-vm-name { margin: 0 0 8px; color: ${C.cream}; font-family: "Fraunces", Georgia, serif; font-weight: 500; font-size: clamp(1.28rem, 4.6vw, 1.6rem); line-height: 1.1; letter-spacing: -0.01em; }
        .ls-vm-line { margin: 0; color: ${C.muted}; font-family: "Newsreader", Georgia, serif; font-size: clamp(0.98rem, 2.6vw, 1.12rem); line-height: 1.55; }
        .ls-vm-pull { margin: clamp(22px, 4vw, 34px) auto 0; text-align: center; color: ${C.violetBright}; font-family: "Newsreader", Georgia, serif; font-style: italic; font-size: clamp(1rem, 2.6vw, 1.16rem); line-height: 1.5; }
        @media (max-width: 560px) {
          .ls-vm-card { flex-direction: column; text-align: center; gap: 14px; }
        }
      `}</style>
    </section>
  );
}

// The ONE reviews wall on the path, curated from the full approved set of
// seventeen. Nine quotes, verbatim, chosen for spread: a converted sceptic
// opens, a won-over partner and a quiet retrospective sit mid-wall, two
// four-star voices keep it believable, and a two-souls-compared line closes.
// Species run whippet to horse to guinea pig so every reader finds a shape
// like their own. None of these quotes render inside the dossier checkout
// (it carries grief / joy / gift / practical / returner), so no quote ever
// appears twice on one path.
// Mobile dose: a phone reads THREE reviews first (a sceptic won over, the horse
// for range, one for grief), each under a short bold label with the quote
// clamped to a few lines behind a "Read on". The other six wait behind one tap.
// Desktop keeps the full nine-card grid exactly as approved; labels, clamps and
// the tap live only inside the small-screen media query. Wording verbatim.
const WALL_REVIEWS: { img: string; alt: string; stars: number; quote: string; attr: string; mobLabel?: string; mobOrder?: number }[] = [
  { ...REVIEWS.skeptic, mobLabel: "For sceptics", mobOrder: 1 },
  {
    img: "/reviews/review-8.webp", alt: "Otis", stars: 5,
    quote: "otis spent his first three months under our bed in Cardiff, only coming out after midnight for biscuits. The reading described a guarded Moon placement and a creature who watches the room from a border before choosing anyone. I had not written anything about him being formerly feral, so that line stayed with me.",
    attr: "Grace O. · Otis, rescue shorthair cat",
  },
  {
    img: "/reviews/review-12.webp", alt: "Bracken", stars: 5,
    quote: "I was not sure a reading would make sense for a horse, especially Bracken, who has opinions about everything at the Devon yard. Then it mentioned a stubborn Saturn edge around thresholds and moving boxes, which is exactly his trailer-loading face on a wet Tuesday. The yard owner laughed because only the people here would know that.",
    attr: "Emily F. · Bracken, cob-type horse",
    mobLabel: "Felt exactly like them", mobOrder: 2,
  },
  {
    img: "/reviews/review-7.webp", alt: "Marmite", stars: 5,
    quote: "I ordered Marmite's reading for the anniversary of the day we brought him back to Leeds in a borrowed blanket. It picked up his restless little Mars rhythm by the front door at about 6pm, which is exactly the hour he still starts pacing every October as if the car is coming again. Too specific to brush off, really.",
    attr: "Freya H. · Marmite, cockapoo",
  },
  {
    img: "/reviews/review-16.webp", alt: "Loki", stars: 5,
    quote: "Sam was openly dismissive when I ordered Loki's reading, mainly because astrology is not their thing. Then the reading described a fixed, territorial streak around shared spaces, and Loki had spent that same week blocking our other cat from the Manchester flat's hallway rug. Sam went quiet, read that paragraph twice, and has mentioned Loki's Mars placement more than I have.",
    attr: "Ben H. · Loki, Maine Coon cat",
  },
  {
    img: "/reviews/review-13.webp", alt: "Willow", stars: 5,
    quote: "weeks after Willow died, I ordered her reading during a rough patch when the house in Nottingham felt very quiet. It gave me a way to talk with my kids about her little routines, the radiator spot, the paw on the newspaper, the way she chose one person at a time. Nothing overblown. Just enough shape around the missing.",
    attr: "Daniel K. · Willow, senior cat",
    mobLabel: "For grief", mobOrder: 3,
  },
  {
    img: "/reviews/review-14.webp", alt: "Nugget", stars: 4,
    quote: "I did roll my eyes at spending money on a guinea pig of all things, but Nugget's reading had his number. The bit about comfort-seeking Venus and always choosing the covered end of the run was bang on, right down to him ignoring the parsley until he has dragged it under the little red shelter. For less than we paid last month for bedding and hay, it was fair value. I would have liked a cheaper way to add our second guinea pig afterwards.",
    attr: "Colin B. · Nugget, guinea pig",
  },
  {
    img: "/reviews/review-9.webp", alt: "Meg", stars: 4,
    quote: "Meg is fourteen now, grey round the muzzle and slower on the lane behind our house near Sheffield. Her reading did not try to make her sound young again, it spoke about Saturn steadiness and the comfort of doing the same small jobs well. I was glad of that. Only niggle is that it took closer to a day to arrive, rather than the couple of hours I had expected.",
    attr: "Alan R. · Meg, border collie, fourteen",
  },
  {
    img: "/reviews/review-11.webp", alt: "Fig and Norm", stars: 5,
    quote: "We ordered Fig and Norm's readings together, assuming two dogs in the same Glasgow house would come out much the same. Fig's was all bright Mars, cupboard doors and sudden decisions, while Norm's had this older Beagle patience and a Moon that sounded exactly like him refusing the rain at the back step. Same sofa, same walks, totally different souls.",
    attr: "Isla M. · Fig and Norm, sprocker spaniel and beagle",
  },
];

function ReviewsWall() {
  const [memorialIntent, setMemorialIntent] = useState<boolean>(() => getIntent() === "memorial");
  // Mobile dose state: which quotes are unclamped, and whether the six
  // behind-the-tap cards are open. Desktop ignores both (CSS-scoped).
  const [showAll, setShowAll] = useState(false);
  const [opened, setOpened] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const onIntent = () => setMemorialIntent(getIntent() === "memorial");
    window.addEventListener(INTENT_EVENT, onIntent);
    return () => window.removeEventListener(INTENT_EVENT, onIntent);
  }, []);
  if (memorialIntent) return null;

  const reviews = WALL_REVIEWS;

  return (
    <section
      className="ls-reviews ls-parallax-band"
      aria-labelledby="ls-reviews-title"
    >
      <div className="ls-reviews-inner">
        <header className="ls-reviews-head ls-reveal">
          <p className="ls-reviews-eyebrow">From people who did this</p>
          <h2 id="ls-reviews-title" className="ls-reviews-title">What their people say</h2>
        </header>
        <ul className={`ls-reviews-grid is-dosed${showAll ? " show-all" : ""}`} role="list">
          {reviews.map((r, i) => {
            const front = typeof r.mobOrder === "number";
            const open = !!opened[r.img];
            return (
              <li
                key={r.img}
                className={`ls-rev ls-reveal${front ? " is-front" : " is-extra"}`}
                style={{ "--ls-delay": `${(i % 3) * 0.09}s`, ...(front ? { "--mord": r.mobOrder } : {}) } as CSSProperties}
              >
                <figure className="ls-rev-fig">
                  {r.mobLabel && <p className="ls-rev-label" aria-hidden="true">{r.mobLabel}</p>}
                  <div className="ls-rev-top">
                    <span className="ls-rev-ph">
                      <img src={r.img} alt={r.alt} width={128} height={128} loading="lazy" decoding="async" />
                    </span>
                    <div className="ls-rev-meta">
                      <div
                        className="ls-rev-stars"
                        role="img"
                        aria-label={r.stars === 5 ? "Five out of five stars" : `${r.stars} out of five stars`}
                      >
                        {[0, 1, 2, 3, 4].map((s) => (
                          <svg key={s} viewBox="0 0 24 24" aria-hidden="true" className={s < r.stars ? "" : "off"}>
                            <path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9z" />
                          </svg>
                        ))}
                      </div>
                      <figcaption className="ls-rev-attr">{r.attr}</figcaption>
                    </div>
                  </div>
                  <blockquote className={`ls-rev-quote${open ? "" : " is-clamp"}`}>{r.quote}</blockquote>
                  {!open && (
                    <button
                      type="button"
                      className="ls-rev-more"
                      aria-expanded="false"
                      onClick={() => setOpened((o) => ({ ...o, [r.img]: true }))}
                    >
                      Read on
                    </button>
                  )}
                </figure>
              </li>
            );
          })}
        </ul>
        {!showAll && (
          <button type="button" className="ls-reviews-more" onClick={() => setShowAll(true)}>
            Read the other six
          </button>
        )}
        <p className="ls-reviews-pull ls-reveal">Their chart has been waiting since the day they were born. Open it below.</p>
      </div>
      <style>{`
        .ls-reviews { position: relative; padding: clamp(30px, 5svh, 60px) 20px clamp(18px, 3svh, 32px); }
        .ls-reviews-inner { max-width: 1120px; margin: 0 auto; }
        .ls-reviews-head { text-align: center; max-width: 720px; margin: 0 auto clamp(30px, 5vw, 52px); }
        .ls-reviews-eyebrow {
          margin: 0 0 16px; color: ${C.gold}; font-family: "Newsreader", Georgia, serif;
          font-size: 13px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase;
        }
        .ls-reviews-title {
          margin: 0; color: ${C.cream}; font-family: "Fraunces", Georgia, serif; font-weight: 500;
          font-size: clamp(2.1rem, 6.4vw, 3.6rem); line-height: 1.02; letter-spacing: -0.018em;
        }
        .ls-reviews-grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr; gap: 16px; }
        .ls-rev { margin: 0; min-width: 0; }
        .ls-rev-fig {
          position: relative; height: 100%; margin: 0; display: flex; flex-direction: column;
          padding: 22px 20px 20px; border-radius: 16px;
          background:
            radial-gradient(130% 80% at 50% 0%, rgba(154,126,230,0.06), transparent 60%),
            linear-gradient(180deg, ${C.cosmos2} 0%, ${C.cosmos} 100%);
          box-shadow:
            0 1px 2px rgba(0,0,0,0.45), 0 6px 18px rgba(0,0,0,0.4),
            0 20px 50px rgba(0,0,0,0.32), 0 1px 0 rgba(185,165,240,0.05) inset;
        }
        .ls-rev-fig::before {
          content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1px; pointer-events: none;
          background: linear-gradient(165deg, rgba(154,126,230,0.32) 0%, rgba(154,126,230,0.16) 46%, rgba(154,126,230,0.28) 100%);
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
        }
        .ls-rev-top { display: flex; align-items: center; gap: 13px; margin-bottom: 14px; }
        .ls-rev-ph {
          position: relative; flex: none; width: 58px; height: 58px; border-radius: 14px; overflow: hidden;
          background: ${C.cosmos3};
          box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 4px 16px rgba(154,126,230,0.10);
        }
        .ls-rev-ph img { display: block; width: 100%; height: 100%; object-fit: cover; }
        .ls-rev-ph::after {
          content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1px; pointer-events: none;
          background: linear-gradient(165deg, rgba(154,126,230,0.40) 0%, rgba(154,126,230,0.14) 46%, rgba(154,126,230,0.32) 100%);
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
        }
        .ls-rev-meta { min-width: 0; }
        .ls-rev-stars { display: flex; gap: 4px; margin-bottom: 7px; }
        .ls-rev-stars svg { width: 15px; height: 15px; display: block; fill: ${C.gold}; }
        .ls-rev-stars svg.off { fill: rgba(200,195,216,0.26); }
        .ls-rev-attr {
          color: ${C.violetBright}; font-family: "Newsreader", Georgia, serif;
          font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; line-height: 1.35;
        }
        .ls-rev-quote {
          margin: 0; color: ${C.creamDim}; font-family: "Newsreader", Georgia, serif; font-style: italic;
          font-size: 1.02rem; line-height: 1.6;
        }
        .ls-rev-quote::before { content: "\\201C"; }
        .ls-rev-quote::after { content: "\\201D"; }
        .ls-reviews-pull { margin: clamp(26px, 4.6vw, 40px) auto 0; text-align: center; max-width: 38ch; color: ${C.violetBright}; font-family: "Newsreader", Georgia, serif; font-style: italic; font-size: clamp(1.02rem, 2.7vw, 1.2rem); line-height: 1.5; }

        /* ── mobile dose: three labelled, clamped cards; six behind one tap ── */
        .ls-rev-label { display: none; }
        .ls-rev-more { display: none; }
        .ls-reviews-more { display: none; }
        @media (max-width: 639px) {
          .ls-reviews-grid.is-dosed .ls-rev { order: 10; }
          .ls-reviews-grid.is-dosed .ls-rev.is-front { order: var(--mord, 1); }
          .ls-reviews-grid.is-dosed .ls-rev.is-extra { display: none; }
          .ls-reviews-grid.is-dosed.show-all .ls-rev.is-extra { display: block; order: 20; }
          .ls-rev-label {
            display: block; margin: 0 0 12px; color: ${C.cream};
            font-family: "Fraunces", Georgia, serif; font-weight: 600;
            font-size: 1.05rem; line-height: 1.2; letter-spacing: 0.005em;
          }
          .ls-rev-quote.is-clamp {
            display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 4;
            overflow: hidden;
          }
          .ls-rev-more {
            display: inline-flex; align-items: center; min-height: 44px; margin-top: 2px;
            padding: 0; border: 0; background: none; cursor: pointer;
            color: ${C.violetBright}; font-family: "Newsreader", Georgia, serif;
            font-style: italic; font-size: 0.98rem;
            text-decoration: underline; text-decoration-color: rgba(185,165,240,0.45);
            text-underline-offset: 4px;
          }
          .ls-reviews-more {
            display: flex; align-items: center; justify-content: center;
            margin: 20px auto 0; min-height: 48px; padding: 0 26px;
            border-radius: 999px; border: 1px solid rgba(154,126,230,0.44);
            background: linear-gradient(180deg, rgba(124,92,214,0.2), rgba(124,92,214,0.08));
            color: ${C.cream}; font-family: "Newsreader", Georgia, serif;
            font-size: 1rem; font-weight: 600; cursor: pointer;
          }
        }
        @media (min-width: 640px) {
          .ls-reviews-grid { grid-template-columns: 1fr 1fr; gap: 18px; }
        }
        @media (min-width: 768px) {
          .ls-rev-fig { padding: 26px 24px 24px; }
          .ls-rev-ph { width: 62px; height: 62px; }
          .ls-rev-quote { font-size: 1.06rem; }
        }
        @media (min-width: 1024px) {
          .ls-reviews-grid { grid-template-columns: repeat(3, 1fr); gap: 20px; }
        }
      `}</style>
    </section>
  );
}


function SectionIntro({
  eyebrow,
  title,
  body,
  centered = false,
}: {
  eyebrow: string;
  title: string;
  body: string;
  centered?: boolean;
}) {
  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p style={eyebrowStyle(C.gold)}>{eyebrow}</p>
      <h2 className="mt-5 text-balance" style={sectionTitleStyle}>{title}</h2>
      <p className={`${centered ? "mx-auto" : ""} mt-6 max-w-2xl text-pretty`} style={sectionBodyStyle}>
        {body}
      </p>
    </div>
  );
}

function PlaceholderFrame({
  item,
  className = "",
}: {
  item: (typeof PLACEHOLDERS)[number];
  className?: string;
}) {
  return (
    <figure className={`ls-placeholder relative overflow-hidden ${className}`} aria-label={`${item.title} image placeholder`}>
      <div className="ls-placeholder-core" aria-hidden="true" />
      <figcaption className="absolute bottom-4 left-4 right-4">
        <span className="block text-[11px] font-medium uppercase tracking-[0.16em]" style={{ color: C.gold }}>
          Image slot
        </span>
        <span className="mt-1 block text-sm" style={{ color: C.cream }}>{item.title}</span>
        <span className="block text-xs" style={{ color: C.muted }}>{item.note}</span>
      </figcaption>
    </figure>
  );
}

// Real hero/keepsake image. Loads /readings/hero/<key>; if the file isn't there
// yet (or fails), it falls back to the styled placeholder so the page never breaks.
function CosmicImage({
  item,
  className = "",
}: {
  item: (typeof PLACEHOLDERS)[number];
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return <PlaceholderFrame item={item} className={className} />;
  return (
    <figure className={`ls-hero-img relative overflow-hidden ${className}`}>
      <img
        src={`/readings/hero/${item.key}`}
        alt={item.title}
        loading="lazy"
        onError={() => setFailed(true)}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </figure>
  );
}

function HeroBackdropVideo() {
  return (
    <div className="ls-hero-backdrop" aria-hidden="true">
      <video
        className="ls-hero-backdrop-video"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/readings/hero/hero-motion-husky-shooting-star-poster.jpg"
      >
        <source src="/readings/hero/hero-motion-husky-shooting-star.webm" type="video/webm" />
        <source src="/readings/hero/hero-motion-husky-shooting-star.mp4" type="video/mp4" />
      </video>
    </div>
  );
}

// The old fixed page backdrop (faint radials + constellation dots) is gone:
// the ONE shared sky now lives in CosmicBridge's fixed stage, which stays lit
// from the passage through the reveal to checkout and is graded by scroll
// (deepest night -> violet at the reveal -> gold horizon behind checkout).

function CosmicStyles() {
  return (
    <style>{`
      .ls-cosmic-page > section {
        position: relative;
        z-index: 1;
      }
      .ls-cosmic-page {
        --ls-scroll-y: 0;
        --ls-pointer-x: 0;
        --ls-pointer-y: 0;
        /* one breath length for every seam below the passage */
        --funnel-gap: clamp(34px, 5svh, 64px);
      }
      .ls-parallax-band {
        isolation: isolate;
      }
      .ls-reveal {
        opacity: 0;
        transform: translate3d(0, 30px, 0);
        transition:
          opacity 0.85s cubic-bezier(0.22, 0.7, 0.2, 1),
          transform 0.85s cubic-bezier(0.22, 0.7, 0.2, 1);
        transition-delay: var(--ls-delay, 0s);
        will-change: opacity, transform;
      }
      .ls-reveal.is-in {
        opacity: 1;
        transform: translate3d(0, 0, 0);
      }
      /* Bridge passage - beat-by-beat scroll reveal. Reuses the .ls-reveal
         IntersectionObserver (each beat is its own node, so the scroll paces them);
         adds a soft blur-up so each thought resolves like a memory coming into focus. */
      .ls-bridge-passage {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: clamp(26px, 5.4vw, 52px);
      }
      .ls-bridge-beat {
        margin: 0;
        max-width: 40ch;
        opacity: 0;
        transform: translate3d(0, 20px, 0);
        filter: blur(8px);
        transition:
          opacity 0.9s cubic-bezier(0.22, 0.7, 0.2, 1),
          transform 0.9s cubic-bezier(0.22, 0.7, 0.2, 1),
          filter 0.9s cubic-bezier(0.22, 0.7, 0.2, 1);
        transition-delay: var(--ls-delay, 0s);
        will-change: opacity, transform, filter;
        color: ${C.creamDim};
        font-family: "Fraunces", Georgia, serif;
        font-weight: 400;
        font-size: clamp(1.2rem, 2.4vw, 1.55rem);
        line-height: 1.55;
        letter-spacing: -0.006em;
      }
      .ls-bridge-beat.is-in {
        opacity: 1;
        transform: translate3d(0, 0, 0);
        filter: blur(0);
      }
      .ls-bridge-beat--pivot { color: ${C.cream}; }
      .ls-bridge-beat--gold {
        margin-top: clamp(8px, 2vw, 20px);
        max-width: 34ch;
        color: ${C.goldSoft};
        font-weight: 500;
        font-size: clamp(1.32rem, 2.8vw, 1.74rem);
        line-height: 1.5;
      }
      @media (prefers-reduced-motion: reduce) {
        .ls-bridge-beat {
          opacity: 1;
          transform: none;
          filter: none;
          transition: none;
          transition-delay: 0s;
          will-change: auto;
        }
      }
      .ls-hero-eyebrow { margin-bottom: 4px; }
      .ls-sky-grid--live > .ls-planet-card,
      .ls-sky-grid--live > .ls-element-card {
        animation: ls-pop-in 0.62s both;
        animation-delay: var(--ls-delay, 0s);
      }
      @keyframes ls-pop-in {
        from { opacity: 0; transform: translate3d(0, 18px, 0) scale(0.985); }
        to { opacity: 1; transform: none; }
      }
      .ls-gallery {
        display: grid;
        grid-template-columns: repeat(12, minmax(0, 1fr));
        gap: clamp(18px, 2.2vw, 30px);
        align-items: start;
      }
      .ls-gallery-item {
        position: relative;
        margin: 0;
        overflow: hidden;
        border-radius: 14px;
        background: #030305;
        box-shadow: 0 30px 90px rgba(0,0,0,0.42);
        isolation: isolate;
        transform: translateZ(0);
      }
      .ls-gallery-item--lead {
        grid-column: 1 / -1;
        aspect-ratio: 16 / 8;
      }
      .ls-gallery-item--portrait {
        grid-column: 1 / span 5;
        margin-top: clamp(10px, 2vw, 28px);
        aspect-ratio: 4 / 5;
      }
      .ls-gallery-item--square {
        grid-column: 6 / span 7;
        margin-top: clamp(10px, 2vw, 28px);
        aspect-ratio: 1 / 1;
      }
      .ls-gallery-item--wide {
        grid-column: 1 / -1;
        margin-top: clamp(10px, 2vw, 28px);
        aspect-ratio: 16 / 7;
      }
      .ls-gallery-item--tall {
        grid-column: 3 / span 8;
        margin-top: clamp(10px, 2vw, 28px);
        aspect-ratio: 16 / 9;
      }
      .ls-gallery-item::after {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 1;
        pointer-events: none;
        background:
          radial-gradient(circle at 22% 18%, rgba(154,126,230,0.14), transparent 28%),
          linear-gradient(180deg, rgba(5,4,8,0) 34%, rgba(5,4,8,0.68) 100%);
      }
      .ls-gallery-item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        transform: scale(1.14);
        will-change: transform;
        animation: ls-gallery-drift linear both;
        animation-timeline: view();
        animation-range: cover 0% cover 100%;
      }
      .ls-gallery-item--lead img { object-position: 72% center; }
      .ls-gallery-item--portrait img { object-position: 48% center; }
      .ls-gallery-item--square img { object-position: 58% center; }
      .ls-gallery-item--wide img { object-position: center; }
      .ls-gallery-item--tall img { object-position: 68% center; }
      @keyframes ls-gallery-drift {
        from { transform: scale(1.14) translate3d(0, -3.4%, 0); }
        to { transform: scale(1.14) translate3d(0, 3.4%, 0); }
      }
      @supports not (animation-timeline: view()) {
        .ls-gallery-item img { transform: scale(1.06); animation: none; }
      }
      .ls-gallery-caption {
        position: absolute;
        left: clamp(18px, 4vw, 46px);
        right: clamp(18px, 4vw, 46px);
        bottom: clamp(18px, 4vw, 42px);
        z-index: 2;
        margin: 0;
        max-width: 16ch;
        text-shadow: 0 2px 22px rgba(0,0,0,0.82), 0 8px 50px rgba(0,0,0,0.6);
      }
      .ls-gallery-item--portrait .ls-gallery-caption {
        max-width: 13ch;
        left: clamp(16px, 3vw, 30px);
        right: clamp(16px, 3vw, 30px);
        bottom: clamp(16px, 3vw, 30px);
      }
      @media (max-width: 899px) {
        .ls-story-section {
          padding-left: 0;
          padding-right: 0;
        }
        .ls-gallery {
          display: flex;
          gap: 12px;
          max-width: none;
          width: 100vw;
          margin-left: calc(50% - 50vw);
          margin-right: calc(50% - 50vw);
          overflow-x: auto;
          overflow-y: hidden;
          padding: 0 16px 18px;
          scroll-padding-inline: 16px;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-x: contain;
        }
        .ls-gallery::-webkit-scrollbar { display: none; }
        .ls-gallery { scrollbar-width: none; }
        .ls-gallery-item {
          flex: 0 0 min(78vw, 340px);
          scroll-snap-align: center;
          margin-top: 0;
          border-radius: 12px;
          box-shadow: 0 24px 68px rgba(0,0,0,0.45);
        }
        .ls-gallery-item--lead,
        .ls-gallery-item--portrait,
        .ls-gallery-item--square,
        .ls-gallery-item--wide,
        .ls-gallery-item--tall {
          grid-column: auto;
          aspect-ratio: 4 / 5;
        }
        .ls-gallery-item--wide {
          flex-basis: min(84vw, 380px);
          aspect-ratio: 16 / 11;
        }
        .ls-gallery-caption {
          left: 18px;
          right: 18px;
          bottom: 18px;
          max-width: 13ch;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .ls-gallery-item img { animation: none; transform: scale(1.04); }
      }
      /* === Birth-sky orrery (contained, scroll-to-step diagram) ============ */
      .ls-orrery-section {
        position: relative;
        z-index: 1;
        padding: var(--funnel-gap, clamp(34px, 5svh, 64px)) 20px clamp(28px, 4vw, 56px);
        text-align: center;
      }
      /* Awaiting the date: the bridge's last line hands straight into the card -
         one continuous night, no dead scroll. */
      .ls-orrery-section.is-await { padding-top: clamp(8px, 2vw, 20px); }
      .ls-orrery-section.is-await .ls-stage { margin-top: 0; min-height: 0; }
      .ls-orrery-head { max-width: 62ch; margin-inline: auto; }
      .ls-orrery {
        position: relative;
        margin: clamp(22px, 4vw, 44px) auto 0;
        width: min(100%, 1060px);
        aspect-ratio: 16 / 8.4;
        border-radius: 20px;
        overflow: hidden;
        background:
          radial-gradient(130% 130% at 9% 62%, rgba(44,24,66,0.55), transparent 55%),
          radial-gradient(110% 110% at 82% 16%, rgba(22,17,38,0.7), transparent 60%),
          #06050c;
        border: 1px solid rgba(124,92,214,0.18);
        box-shadow: inset 0 1px 0 rgba(237,233,247,0.05), 0 44px 130px rgba(0,0,0,0.55);
        touch-action: none;
        cursor: grab;
        isolation: isolate;
        user-select: none;
        -webkit-user-select: none;
      }
      .ls-orrery:active { cursor: grabbing; }
      .ls-orrery-stars {
        position: absolute; inset: 0; z-index: 0; opacity: 0.5; pointer-events: none;
        background-image:
          radial-gradient(1px 1px at 22% 26%, #fff, transparent),
          radial-gradient(1px 1px at 68% 18%, rgba(255,255,255,0.8), transparent),
          radial-gradient(1.4px 1.4px at 44% 70%, #fff, transparent),
          radial-gradient(1px 1px at 84% 64%, rgba(255,255,255,0.7), transparent),
          radial-gradient(1px 1px at 14% 82%, rgba(255,255,255,0.66), transparent),
          radial-gradient(1.6px 1.6px at 58% 40%, #fff, transparent);
        background-size: 280px 280px;
        background-repeat: repeat;
      }
      .ls-orrery-nebula {
        position: absolute; inset: -12%; z-index: 0; pointer-events: none; opacity: 0.7;
        background:
          radial-gradient(36% 44% at 24% 60%, rgba(124,92,214,0.24), transparent 70%),
          radial-gradient(40% 40% at 80% 26%, rgba(94,70,122,0.28), transparent 72%);
      }
      .ls-orrery-camera {
        position: absolute; inset: 0; z-index: 1;
        transform-origin: center center; will-change: transform;
      }
      .ls-orrery-orbits {
        position: absolute; inset: 0; width: 100%; height: 100%;
        overflow: visible; pointer-events: none; z-index: 0;
      }
      .ls-orrery-orbits ellipse {
        fill: none; stroke: rgba(222,216,255,0.22); stroke-width: 1;
        vector-effect: non-scaling-stroke; transition: stroke 0.4s ease;
      }
      .ls-orrery-orbits ellipse.is-active { stroke: rgba(184,152,235,0.75); stroke-width: 1.6; }
      /* The orb itself is centred on the position (label is absolute below it),
         so the orbit line passes exactly through each planet's centre. */
      .ls-orrery-body {
        position: absolute;
        transform: translate(-50%, -50%);
        display: grid; place-items: center;
        z-index: 2;
      }
      .ls-orrery-body.is-sun { z-index: 1; }
      .ls-orrery-body.is-clickable { cursor: pointer; }
      .ls-orrery-orb {
        position: relative; width: 100%; aspect-ratio: 1;
        display: grid; place-items: center;
      }
      .ls-orrery-orb img {
        width: 100%; height: 100%; object-fit: contain;
        filter: drop-shadow(0 3px 10px rgba(0,0,0,0.55));
        transition: filter 0.5s ease;
      }
      /* Lilith = the dark Moon: same body, shadowed (smoothly transitions). */
      .ls-orrery-orb img.is-shadowed { filter: brightness(0.3) saturate(0.55) contrast(1.05); }
      .ls-orrery-body.is-active .ls-orrery-orb img.is-shadowed { filter: brightness(0.4) saturate(0.6) drop-shadow(0 0 12px rgba(124,92,214,0.85)); }
      /* (sun corona now lives on .ls-orrery-sunvid::before single soft aura) */
      /* Option 1 sun: real NASA SDO disc with prominences/corona baked into a
         transparent PNG. NO clip - the whole sun + flares show; sized larger than
         the orb so the flares bleed past it. Soft drop-shadow aura. */
      .ls-orrery-sunvid { position: absolute; inset: -16%; }
      .ls-orrery-sunvid--card { inset: -4%; }
      .ls-orrery-sunvid img {
        position: absolute; inset: 0; width: 100%; height: 100%;
        object-fit: contain;
        filter: drop-shadow(0 0 16px rgba(255,120,40,0.5)) drop-shadow(0 0 42px rgba(255,90,30,0.3));
      }
      /* PNG fallback (no WebGL path used now, kept harmless). */
      .ls-orrery-sun-img { width: 122%; height: 122%; object-fit: contain; display: block; }
      .ls-orrery-card-frame .ls-orrery-sun-img { width: 104%; height: 104%; }
      .ls-orrery-card-orb { position: relative; width: 100%; height: 100%; display: grid; place-items: center; }
      @media (prefers-reduced-motion: reduce) {
        .ls-orrery-body.is-sun .ls-orrery-orb::after { animation: none; }
      }
      /* Focus card: active body pops big in the left frame, symbol + line on the right. */
      .ls-orrery-card {
        display: flex; align-items: center; gap: clamp(16px, 4vw, 30px);
        width: min(94vw, 560px); margin: clamp(22px, 3.4vw, 36px) auto 0;
        padding: clamp(14px, 2.6vw, 22px) clamp(16px, 3vw, 26px);
        border: 1px solid rgba(124,92,214,0.3); border-radius: 20px;
        background: linear-gradient(135deg, rgba(40,26,66,0.86), rgba(10,8,16,0.82));
        box-shadow: 0 28px 84px rgba(0,0,0,0.5), inset 0 1px 0 rgba(237,233,247,0.05);
        backdrop-filter: blur(8px); text-align: left;
      }
      .ls-orrery-card-frame {
        flex: none; width: clamp(86px, 22vw, 138px); aspect-ratio: 1;
        border-radius: 16px; display: grid; place-items: center; overflow: visible;
        background: radial-gradient(circle at 50% 40%, rgba(124,92,214,0.2), rgba(6,5,12,0.62));
        border: 1px solid rgba(124,92,214,0.3);
        box-shadow: inset 0 0 26px rgba(0,0,0,0.55);
      }
      .ls-orrery-card-frame img {
        width: 86%; height: 86%; object-fit: contain;
        filter: drop-shadow(0 0 16px rgba(176,142,230,0.7));
      }
      .ls-orrery-card-frame img.is-shadowed { filter: brightness(0.42) drop-shadow(0 0 16px rgba(176,142,230,0.7)); }
      .ls-orrery-card-frame .ls-orrery-sun-svg { width: 100%; height: 100%; }
      .ls-orrery-card-glyph {
        width: 78%; aspect-ratio: 1; border-radius: 50%;
        display: grid; place-items: center;
        font-size: clamp(1.7rem, 6vw, 2.6rem); color: #f0e9ff; line-height: 1;
        background: radial-gradient(circle at 42% 38%, #c7a9f2 0%, #8a63d8 42%, #4a2f86 78%, #2a1a54 100%);
        box-shadow: inset -3px -4px 9px rgba(0,0,0,0.45), 0 0 20px rgba(157,122,214,0.7);
        text-shadow: 0 1px 2px rgba(0,0,0,0.6);
      }
      .ls-orrery-card-text { display: grid; gap: 8px; min-width: 0; }
      .ls-orrery-card-sym { font-size: clamp(1.5rem, 5vw, 2.1rem); color: ${C.violetSoft}; line-height: 1; }
      .ls-orrery-card .ls-orrery-name { text-align: left; }
      .ls-orrery-card .ls-orrery-line { text-align: left; font-size: clamp(1.25rem, 3.8vw, 1.95rem); }
      /* Lunar-point visual (North Node): a small glowing violet orb carrying its glyph. */
      /* North Node: an ethereal point of light (soft violet halo + glyph), not a
         solid ball, so it reads as an abstract astrological point. */
      .ls-orrery-pt {
        width: 120%; aspect-ratio: 1; border-radius: 50%;
        display: grid; place-items: center;
        color: #efe6ff; font-size: clamp(0.55rem, 1.3vw, 0.95rem); line-height: 1;
        background: radial-gradient(circle, rgba(206,180,250,0.6) 0%, rgba(150,110,228,0.34) 36%, rgba(124,92,214,0.12) 58%, rgba(124,92,214,0) 74%);
        text-shadow: 0 0 7px rgba(220,200,255,0.95), 0 0 2px rgba(0,0,0,0.5);
        animation: ls-node-pulse 3.4s ease-in-out infinite;
      }
      @keyframes ls-node-pulse { 0%,100% { filter: brightness(1); transform: scale(1); } 50% { filter: brightness(1.25); transform: scale(1.06); } }
      .ls-orrery-body.is-active .ls-orrery-pt { background: radial-gradient(circle, rgba(224,206,255,0.78) 0%, rgba(176,142,235,0.46) 38%, rgba(140,100,225,0.16) 60%, rgba(124,92,214,0) 76%); }
      /* Penguin guide + speech bubble (lives on the diagram). */
      .ls-orrery-guide {
        position: absolute; z-index: 6; right: 2.5%; bottom: 3.5%;
        display: flex; align-items: flex-end; gap: 8px; max-width: 66%;
        pointer-events: none;
      }
      .ls-orrery-bubble {
        position: relative; min-width: 0;
        max-width: clamp(190px, 27vw, 330px);
        padding: clamp(10px, 1.5vw, 15px) clamp(13px, 1.9vw, 20px);
        border: 1px solid rgba(124,92,214,0.38); border-radius: 16px;
        background: linear-gradient(135deg, rgba(48,31,78,0.94), rgba(13,10,22,0.9));
        box-shadow: 0 16px 46px rgba(0,0,0,0.55); backdrop-filter: blur(8px);
        display: grid; gap: 5px;
      }
      .ls-orrery-bubble::after {
        content: ""; position: absolute; right: -7px; bottom: 20px; width: 14px; height: 14px;
        background: linear-gradient(135deg, rgba(48,31,78,0.94), rgba(13,10,22,0.9));
        border-right: 1px solid rgba(124,92,214,0.38); border-bottom: 1px solid rgba(124,92,214,0.38);
        transform: rotate(-45deg);
      }
      .ls-orrery-bubble-head { display: flex; align-items: center; gap: 8px; }
      .ls-orrery-bubble-glyph { color: #b8a0ef; font-size: clamp(1rem, 2vw, 1.5rem); line-height: 1; display: inline-flex; }
      .ls-orrery-bubble-glyph svg { display: block; }
      .ls-orrery-pt svg { display: block; width: 72%; height: auto; }
      .ls-orrery-bubble .ls-orrery-name { text-align: left; }
      .ls-orrery-bubble .ls-orrery-line { text-align: left; margin: 0; font-size: clamp(1.02rem, 1.9vw, 1.45rem); line-height: 1.18; }
      .ls-peng { flex: none; width: clamp(92px, 15vw, 158px); height: auto; display: block; transform-origin: 50% 100%; filter: drop-shadow(0 8px 16px rgba(0,0,0,0.5)); animation: ls-peng-bob 3.4s ease-in-out infinite; }
      @keyframes ls-peng-bob { 0%,100% { transform: translateY(0) rotate(-1.5deg); } 50% { transform: translateY(-5px) rotate(1.5deg); } }
      .ls-peng-eyes { transform-origin: 60px 72px; animation: ls-peng-blink 4.6s infinite; }
      @keyframes ls-peng-blink { 0%,93%,100% { transform: scaleY(1); } 96.5% { transform: scaleY(0.12); } }
      .ls-peng.is-talking .ls-peng-beak { transform-origin: 60px 85px; animation: ls-peng-talk 0.5s ease-in-out infinite; }
      @keyframes ls-peng-talk { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(0.45) translateY(1px); } }
      .ls-peng-spark { animation: ls-peng-twinkle 2.6s ease-in-out infinite; }
      @keyframes ls-peng-twinkle { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
      @media (max-width: 759px) {
        .ls-orrery-guide { left: 3%; right: 3%; bottom: 3%; max-width: none; align-items: flex-end; }
        .ls-orrery-bubble { max-width: none; flex: 1; }
        .ls-peng { width: 78px; }
        .ls-orrery-hint { display: none; }
      }
      @media (prefers-reduced-motion: reduce) {
        .ls-peng, .ls-peng-eyes, .ls-peng .ls-peng-beak, .ls-peng-spark, .ls-orrery-pt { animation: none !important; }
      }
      .ls-orrery-label {
        position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
        margin-top: 5px;
        font-family: "Newsreader", Georgia, serif;
        font-size: clamp(7px, 1vw, 11px);
        letter-spacing: 0.14em; text-transform: uppercase;
        color: rgba(224,218,242,0.62); white-space: nowrap;
        transition: color 0.3s ease; pointer-events: none;
      }
      .ls-orrery-body.is-active .ls-orrery-orb img { filter: drop-shadow(0 0 14px rgba(176,142,230,0.85)); }
      .ls-orrery-body.is-active .ls-orrery-label { color: #d8c5f5; }
      .ls-orrery-hint { display: none; }
      .ls-orrery-dock {
        margin: clamp(20px, 3vw, 32px) auto 0;
        max-width: 32ch; display: grid; gap: 6px; justify-items: center;
      }
      .ls-orrery-glyph { color: ${C.violetSoft}; font-size: clamp(1.6rem, 5vw, 2.4rem); line-height: 1; }
      .ls-orrery-name {
        color: #d8c5f5; font-family: "Newsreader", Georgia, serif;
        font-size: 0.78rem; font-weight: 800; letter-spacing: 0.22em; text-transform: uppercase;
      }
      .ls-orrery-line {
        margin: 0; color: ${C.cream}; font-family: "Fraunces", Georgia, serif;
        font-size: clamp(1.4rem, 4.4vw, 2.3rem); line-height: 1.1;
      }
      .ls-orrery-pips {
        display: flex; flex-wrap: wrap; gap: 7px; justify-content: center;
        margin: clamp(14px, 2.4vw, 22px) auto 0; max-width: 320px;
      }
      .ls-orrery-pip {
        width: 9px; height: 9px; padding: 0; border: 0; border-radius: 50%;
        background: rgba(224,218,242,0.22); cursor: pointer;
        transition: transform 0.25s ease, background 0.25s ease;
      }
      .ls-orrery-pip.is-active { background: ${C.violetSoft}; transform: scale(1.5); }
      .ls-orrery-formwrap { margin: clamp(30px, 5vw, 54px) auto 0; width: min(94vw, 460px); }
      @media (max-width: 759px) {
        .ls-orrery { aspect-ratio: 4 / 4.3; }
        .ls-orrery-label { display: none; }
        .ls-orrery-body.is-active .ls-orrery-label { display: block; }
      }
      @media (prefers-reduced-motion: reduce) {
        .ls-orrery-camera { transform: none !important; }
      }
      /* === end orrery ====================================================== */
      .ls-journey { position: relative; }
      .ls-journey-eyebrow { margin: 0; }
      .ls-journey-eyebrow { position: relative; z-index: 3; margin: 0; }
      .ls-journey-stars {
        position: absolute;
        inset: -30% 0;
        z-index: 0;
        opacity: 0.55;
        pointer-events: none;
        background-image:
          radial-gradient(1px 1px at 25% 18%, #fff, transparent),
          radial-gradient(1px 1px at 72% 28%, rgba(255,255,255,0.82), transparent),
          radial-gradient(1.6px 1.6px at 48% 62%, #fff, transparent),
          radial-gradient(1px 1px at 16% 78%, rgba(255,255,255,0.7), transparent),
          radial-gradient(1px 1px at 86% 72%, rgba(255,255,255,0.72), transparent),
          radial-gradient(1px 1px at 38% 40%, rgba(255,255,255,0.6), transparent),
          radial-gradient(2px 2px at 62% 88%, #fff, transparent);
        background-size: 340px 340px;
        background-repeat: repeat;
        will-change: transform;
      }
      .ls-journey-nebula {
        position: absolute;
        inset: -20% -12%;
        z-index: 0;
        pointer-events: none;
        opacity: 0.85;
        background:
          radial-gradient(38% 46% at 28% 32%, rgba(124,92,214,0.26), transparent 70%),
          radial-gradient(44% 44% at 76% 66%, rgba(94,70,122,0.3), transparent 72%);
        will-change: transform;
      }
      .ls-journey-rings {
        position: absolute;
        inset: 0;
        margin: auto;
        width: min(120vw, 900px);
        aspect-ratio: 1;
        display: grid;
        place-items: center;
        z-index: 0;
        pointer-events: none;
        will-change: transform;
      }
      .ls-journey-rings span {
        position: absolute;
        border: 1px solid rgba(124,92,214,0.18);
        border-radius: 50%;
      }
      .ls-journey-rings span:nth-child(1) { width: 38%; height: 38%; }
      .ls-journey-rings span:nth-child(2) { width: 66%; height: 66%; }
      .ls-journey-rings span:nth-child(3) { width: 96%; height: 96%; }
      .ls-journey-viewport {
        position: relative;
        z-index: 2;
        width: 100%;
        min-height: clamp(220px, 46vh, 380px);
        display: grid;
        place-items: center;
        align-self: center;
      }
      .ls-journey-planet-wrap {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
      }
      .ls-journey-planet {
        width: clamp(168px, 44vw, 320px);
        aspect-ratio: 1;
        display: grid;
        place-items: center;
        will-change: transform;
      }
      .ls-journey-planet img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: drop-shadow(0 0 42px rgba(124,92,214,0.5)) drop-shadow(0 0 16px rgba(255,255,255,0.16));
      }
      .ls-journey-bigglyph {
        font-family: "Fraunces", Georgia, serif;
        font-size: clamp(5rem, 22vw, 11rem);
        line-height: 1;
        color: ${C.violetSoft};
        filter: drop-shadow(0 0 28px rgba(154,126,230,0.55));
      }
      .ls-journey-copy {
        position: relative;
        z-index: 3;
        display: grid;
        gap: 10px;
        justify-items: center;
        max-width: 20ch;
      }
      .ls-journey-name {
        color: ${C.violetSoft};
        font-family: "Newsreader", Georgia, serif;
        font-size: 0.8rem;
        font-weight: 800;
        letter-spacing: 0.22em;
        text-transform: uppercase;
      }
      .ls-journey-line {
        margin: 0;
        color: ${C.cream};
        font-family: "Fraunces", Georgia, serif;
        font-size: clamp(1.55rem, 5.2vw, 2.8rem);
        line-height: 1.08;
      }
      .ls-journey-rail {
        position: relative;
        z-index: 3;
        display: flex;
        gap: 5px;
        align-items: center;
        flex-wrap: wrap;
        justify-content: center;
        max-width: 320px;
      }
      .ls-journey-tick {
        width: 16px;
        height: 3px;
        padding: 0;
        border: 0;
        border-radius: 2px;
        background: rgba(237,233,247,0.2);
        cursor: pointer;
        transition: background 0.3s ease, width 0.3s ease;
      }
      .ls-journey-tick.is-past { background: rgba(124,92,214,0.55); }
      .ls-journey-tick.is-active { background: ${C.violet}; width: 30px; }
      .ls-journey-count {
        color: ${C.muted};
        font-family: "Newsreader", Georgia, serif;
        font-size: 0.74rem;
        letter-spacing: 0.16em;
        min-width: 64px;
      }
      .ls-journey-formstage {
        position: relative;
        z-index: 3;
        width: min(94vw, 460px);
      }
      .ls-journey-formstage .ls-lead-form { width: 100%; gap: 12px; }
      .ls-journey-formstage .ls-lead-row { grid-template-columns: 1fr; }
      .ls-journey-card {
        position: relative;
        z-index: 3;
        display: flex;
        align-items: center;
        gap: clamp(16px, 4vw, 38px);
        width: min(94vw, 600px);
        padding: clamp(16px, 3vw, 26px) clamp(18px, 3.6vw, 32px);
        border: 1px solid rgba(124,92,214,0.28);
        border-radius: 18px;
        background: linear-gradient(135deg, rgba(124,92,214,0.12), rgba(5,4,8,0.5));
        box-shadow: 0 30px 90px rgba(0,0,0,0.45), inset 0 1px 0 rgba(237,233,247,0.05);
        backdrop-filter: blur(6px);
        text-align: left;
      }
      .ls-journey-orb {
        flex: none;
        width: clamp(96px, 26vw, 180px);
        aspect-ratio: 1;
        display: grid;
        place-items: center;
      }
      .ls-journey-orb-inner {
        aspect-ratio: 1;
        display: grid;
        place-items: center;
        will-change: transform;
      }
      .ls-journey-orb-inner img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: drop-shadow(0 0 26px rgba(124,92,214,0.5)) drop-shadow(0 0 10px rgba(255,255,255,0.16));
      }
      .ls-journey-orb .ls-journey-bigglyph {
        font-size: clamp(1.8rem, 9vw, 3.4rem);
        filter: drop-shadow(0 0 16px rgba(154,126,230,0.55));
      }
      .ls-journey-card-text { display: grid; gap: 8px; min-width: 0; }
      .ls-journey-card .ls-journey-name { text-align: left; }
      .ls-journey-card .ls-journey-line { text-align: left; font-size: clamp(1.3rem, 4.6vw, 2.1rem); }
      .ls-journey-progress {
        position: absolute;
        right: clamp(10px, 2vw, 22px);
        top: 24%;
        bottom: 24%;
        width: 3px;
        border-radius: 3px;
        overflow: hidden;
        background: rgba(237,233,247,0.12);
        z-index: 3;
      }
      .ls-journey-progress span {
        display: block;
        width: 100%;
        height: 100%;
        background: ${C.violet};
        transform-origin: top center;
      }
      @media (max-width: 899px) {
        .ls-journey-orb { width: clamp(74px, 30vw, 128px); }
        .ls-journey-card { gap: 16px; padding: 16px 18px; }
      }
      .ls-journey-system {
        position: absolute;
        inset: 0;
        z-index: 1;
        overflow: hidden;
        opacity: 0.95;
        pointer-events: none;
      }
      .ls-journey-camera {
        position: absolute;
        inset: 0;
        transform-origin: center center;
        will-change: transform;
      }
      .ls-journey-orbits {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        overflow: visible;
        pointer-events: none;
        z-index: 0;
      }
      .ls-journey-orbits ellipse {
        fill: none;
        stroke: rgba(255,255,255,0.14);
        stroke-width: 0.22;
      }
      .ls-sys-sun {
        position: relative;
        display: block;
        width: 100%;
        aspect-ratio: 1;
        overflow: visible;
      }
      .ls-sun-media { position: relative; display: block; width: 100%; aspect-ratio: 1; }
      .ls-sun-media::before {
        content: "";
        position: absolute;
        left: 50%;
        top: 50%;
        width: 160%;
        aspect-ratio: 1;
        transform: translate(-50%, -50%);
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255,150,50,0) 22%, rgba(255,140,40,0.6) 29%, rgba(255,95,18,0.34) 40%, transparent 64%);
        animation: ls-sun-aura 6s ease-in-out infinite;
        z-index: 0;
        pointer-events: none;
      }
      .ls-sun-disc {
        position: relative;
        z-index: 1;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        overflow: hidden;
      }
      .ls-sun-video {
        width: 100%;
        height: 100%;
        object-fit: cover;
        -webkit-clip-path: circle(48%);
        clip-path: circle(48%);
        filter: sepia(0.5) saturate(2.05) hue-rotate(-14deg) brightness(1.08) contrast(1.06);
      }
      @keyframes ls-sun-aura {
        0%, 100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1); }
        50% { opacity: 1; transform: translate(-50%, -50%) scale(1.06); }
      }
      @keyframes ls-sun-spin { to { transform: rotate(360deg); } }
      @keyframes ls-sun-pulse {
        0%, 100% { opacity: 0.55; transform: scale(1); }
        50% { opacity: 0.95; transform: scale(1.07); }
      }
      @media (prefers-reduced-motion: reduce) {
        .ls-sys-sun img { animation: none; }
        .ls-sys-sun::after { animation: none; }
      }
      .ls-sys-slot.is-clickable { pointer-events: auto; cursor: pointer; }
      .ls-sys-orb {
        width: 100%;
        aspect-ratio: 1;
        border-radius: 50%;
        overflow: hidden;
        transition: box-shadow 0.4s ease;
      }
      .ls-sys-orb img { width: 100%; height: 100%; object-fit: cover; opacity: 0.92; display: block; }
      .ls-sys-orb--free { border-radius: 0; overflow: visible; }
      .ls-sys-orb--free img { object-fit: contain; }
      .ls-sys-earth {
        display: block;
        width: 100%;
        aspect-ratio: 1;
        border-radius: 50%;
        background:
          radial-gradient(circle at 62% 58%, rgba(74,178,104,0.85) 0 12%, transparent 20%),
          radial-gradient(circle at 34% 42%, rgba(86,196,122,0.7) 0 9%, transparent 16%),
          radial-gradient(circle at 36% 30%, #9fccff 0 16%, #4a90e0 48%, #16498c 82%);
        box-shadow: inset -3px -5px 10px rgba(0,0,0,0.4), 0 0 12px rgba(110,180,255,0.65);
        opacity: 1;
      }
      .ls-sys-slot.is-active { z-index: 5; }
      .ls-sys-slot.is-active .ls-sys-orb {
        box-shadow: 0 0 0 2px rgba(124,92,214,0.6), 0 0 22px rgba(124,92,214,0.85);
      }
      .ls-sys-slot.is-active .ls-sys-orb img { opacity: 1; }
      .ls-sys-slot.is-active .ls-sys-glyph { color: ${C.violet}; text-shadow: 0 0 12px rgba(124,92,214,0.9); }
      .ls-sys-orb2 { position: relative; width: 100%; aspect-ratio: 1; display: grid; place-items: center; }
      .ls-sys-orb2 img { width: 100%; height: 100%; object-fit: contain; transition: filter 0.6s ease, opacity 0.6s ease; }
      .ls-sys-node--mark { position: absolute; inset: 0; display: grid; place-items: center; color: ${C.violetSoft}; font-size: clamp(0.9rem, 3.5vw, 1.8rem); text-shadow: 0 0 8px rgba(0,0,0,0.85); }
      .ls-sys-orb2 img.is-shadowed { filter: brightness(0.32) saturate(0.5) contrast(1.05); }
      .ls-sys-node { color: ${C.violetSoft}; font-size: clamp(0.7rem, 2.6vw, 1.5rem); line-height: 1; }
      .ls-sys-slot.is-active .ls-sys-orb2 img { filter: drop-shadow(0 0 14px rgba(124,92,214,0.85)); }
      .ls-sys-slot.is-active .ls-sys-orb2 img.is-shadowed { filter: brightness(0.42) drop-shadow(0 0 14px rgba(124,92,214,0.9)); }
      .ls-sys-slot.is-active .ls-sys-node { color: ${C.violet}; text-shadow: 0 0 12px rgba(124,92,214,0.9); }
      .ls-journey-dock {
        position: relative;
        z-index: 4;
        display: flex;
        align-items: center;
        gap: clamp(14px, 3.5vw, 30px);
        width: min(92vw, 520px);
        padding: clamp(14px, 2.6vw, 22px) clamp(16px, 3vw, 26px);
        border: 1px solid rgba(124,92,214,0.32);
        border-radius: 18px;
        background: linear-gradient(135deg, rgba(38,25,64,0.88), rgba(10,8,16,0.84));
        box-shadow: 0 26px 80px rgba(0,0,0,0.5);
        backdrop-filter: blur(8px);
        text-align: left;
      }
      .ls-dock-orb {
        flex: none;
        width: clamp(60px, 15vw, 104px);
        aspect-ratio: 1;
        display: grid;
        place-items: center;
        border-radius: 50%;
        overflow: hidden;
        box-shadow: 0 0 26px rgba(124,92,214,0.5);
      }
      .ls-dock-orb img { width: 100%; height: 100%; object-fit: cover; }
      .ls-dock-orb .ls-sys-glyph { font-size: clamp(2rem, 7vw, 3.2rem); color: ${C.violetSoft}; }
      .ls-dock-text { display: grid; gap: 6px; justify-items: center; min-width: 0; }
      .ls-dock-glyph { color: ${C.violetSoft}; font-size: clamp(1.8rem, 6vw, 2.8rem); line-height: 1; }
      .ls-journey-overview {
        position: absolute;
        top: clamp(74px, 9vh, 92px);
        right: clamp(14px, 3vw, 24px);
        z-index: 5;
        border: 1px solid rgba(124,92,214,0.5);
        background: rgba(124,92,214,0.16);
        color: ${C.cream};
        padding: 8px 14px;
        border-radius: 999px;
        font-family: "Newsreader", Georgia, serif;
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        cursor: pointer;
        backdrop-filter: blur(6px);
        transition: background 0.2s ease, border-color 0.2s ease;
      }
      .ls-journey-overview:hover { background: rgba(124,92,214,0.3); border-color: rgba(124,92,214,0.8); }
      .ls-dock-text .ls-journey-name { text-align: center; font-size: 0.82rem; }
      .ls-dock-text .ls-journey-line { text-align: center; font-size: clamp(1.3rem, 4.4vw, 2rem); }
      .ls-journey-orbit {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        border: 1px solid rgba(124,92,214,0.13);
        border-radius: 50%;
        pointer-events: none;
      }
      .ls-sys-slot {
        position: absolute;
        transform: translate(-50%, -50%);
        aspect-ratio: 1;
        display: grid;
        place-items: center;
      }
      .ls-sys-body {
        position: relative;
        width: 100%;
        aspect-ratio: 1;
        display: grid;
        place-items: center;
        will-change: transform;
      }
      .ls-sys-body img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: drop-shadow(0 0 8px rgba(124,92,214,0.4));
      }
      .ls-sys-glyph {
        color: ${C.violetSoft};
        font-size: clamp(0.7rem, 2.6vw, 1.4rem);
        line-height: 1;
      }
      .ls-sys-glow {
        position: absolute;
        inset: -50%;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(124,92,214,0.55), transparent 62%);
        pointer-events: none;
        z-index: -1;
      }
      .ls-journey-readout {
        position: relative;
        z-index: 3;
        display: grid;
        gap: 8px;
        justify-items: center;
        max-width: 24ch;
      }
      .ls-readout-glyph { color: ${C.violetSoft}; font-style: normal; margin-right: 7px; }
      @media (max-width: 899px) {
        .ls-journey-tick { width: 12px; }
        .ls-journey-tick.is-active { width: 22px; }
        .ls-journey-rail { max-width: 240px; }
      }
      @media (prefers-reduced-motion: reduce) {
        .ls-journey-stars, .ls-journey-nebula, .ls-journey-rings, .ls-journey-planet { transform: none !important; }
      }
      .ls-journey-orrery {
        position: relative;
        width: min(78vw, 440px);
        aspect-ratio: 1;
        display: grid;
        place-items: center;
        align-self: center;
        transition: opacity 0.6s ease;
      }
      .ls-journey-orrery.is-complete { opacity: 0.5; }
      .ls-journey-core {
        position: absolute;
        width: 15%;
        aspect-ratio: 1;
        display: grid;
        place-items: center;
        z-index: 2;
      }
      .ls-journey-core img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: drop-shadow(0 0 26px rgba(255,178,88,0.6));
      }
      .ls-journey-ring {
        position: absolute;
        border: 1px solid rgba(237,233,247,0.08);
        border-radius: 50%;
        opacity: 0.16;
        transition: opacity 0.6s ease, border-color 0.6s ease, box-shadow 0.6s ease;
      }
      .ls-journey-ring.is-reached { opacity: 0.4; }
      .ls-journey-ring.is-active {
        opacity: 1;
        border-color: rgba(124,92,214,0.7);
        box-shadow: 0 0 32px rgba(124,92,214,0.28);
      }
      .ls-journey-dot { position: absolute; inset: 0; }
      .ls-journey-dot em {
        position: absolute;
        top: 0;
        left: 50%;
        width: 26px;
        height: 26px;
        margin: -13px 0 0 -13px;
        display: grid;
        place-items: center;
        transition: transform 0.5s ease, filter 0.5s ease;
      }
      .ls-journey-dot img { width: 100%; height: 100%; object-fit: contain; opacity: 0.5; transition: opacity 0.5s ease; }
      .ls-journey-glyph { color: rgba(154,126,230,0.9); font-size: 1rem; }
      .ls-journey-ring.is-active .ls-journey-dot img { opacity: 1; }
      .ls-journey-ring.is-active .ls-journey-dot em {
        transform: scale(1.7);
        filter: drop-shadow(0 0 10px rgba(124,92,214,0.85));
      }
      .ls-journey-focus {
        display: grid;
        gap: 8px;
        justify-items: center;
        max-width: 32ch;
        animation: ls-pop-in 0.5s both;
      }
      .ls-journey-focus-glyph { color: ${C.violetSoft}; font-size: clamp(2rem, 6vw, 2.8rem); line-height: 1; }
      .ls-journey-focus-label {
        color: ${C.violetSoft};
        font-family: "Newsreader", Georgia, serif;
        font-size: 0.76rem;
        font-weight: 800;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }
      .ls-journey-focus-line {
        color: ${C.cream};
        font-family: "Fraunces", Georgia, serif;
        font-size: clamp(1.55rem, 5vw, 2.7rem);
        line-height: 1.08;
        margin: 0;
      }
      .ls-journey-step-count { color: ${C.muted}; font-family: "Newsreader", Georgia, serif; font-size: 0.72rem; letter-spacing: 0.16em; }
      .ls-journey-nav { display: flex; align-items: center; gap: 14px; }
      .ls-journey-arrow {
        flex: none;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 1px solid rgba(124,92,214,0.55);
        background: rgba(124,92,214,0.14);
        color: ${C.cream};
        font-size: 1.5rem;
        line-height: 1;
        display: grid;
        place-items: center;
        cursor: pointer;
        transition: background 0.2s ease, border-color 0.2s ease;
      }
      .ls-journey-arrow:hover:not(:disabled) { background: rgba(124,92,214,0.28); }
      .ls-journey-arrow:disabled { opacity: 0.3; cursor: default; }
      .ls-journey-dots { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; max-width: 300px; }
      .ls-journey-pip {
        width: 8px;
        height: 8px;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: rgba(237,233,247,0.22);
        cursor: pointer;
        transition: transform 0.2s ease, background 0.2s ease;
      }
      .ls-journey-pip.is-active { background: ${C.violet}; transform: scale(1.5); }
      .ls-journey-reveal { display: grid; gap: 14px; justify-items: center; max-width: 36ch; width: min(92vw, 460px); }
      .ls-journey-reveal-grid { display: grid; gap: 10px; width: 100%; }
      .ls-journey-reveal-item {
        display: grid;
        gap: 2px;
        border: 1px solid rgba(124,92,214,0.3);
        border-radius: 10px;
        padding: 12px 14px;
        background: rgba(5,4,8,0.42);
        text-align: left;
      }
      .ls-journey-reveal-item span { color: ${C.violetSoft}; font-family: "Newsreader", Georgia, serif; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; }
      .ls-journey-reveal-item strong { color: ${C.cream}; font-family: "Fraunces", Georgia, serif; font-size: 1.3rem; font-weight: 500; }
      .ls-journey-reveal-item small { color: ${C.creamDim}; font-family: "Newsreader", Georgia, serif; font-size: 0.82rem; }
      .ls-journey-hint { color: ${C.creamDim}; font-family: "Fraunces", Georgia, serif; font-style: italic; font-size: 1.22rem; line-height: 1.4; margin: 0; }
      .ls-journey-cta { width: 100%; justify-content: center; }
      .ls-journey-form-wrap .ls-lead-form { width: min(92vw, 460px); gap: 12px; }
      .ls-journey-form-wrap .ls-lead-row { grid-template-columns: 1fr; }
      @media (prefers-reduced-motion: reduce) {
        .ls-journey-ring, .ls-journey-dot em, .ls-journey-dot img, .ls-journey-orrery { transition: none; }
        .ls-journey-focus { animation: none; }
      }
      .ls-parallax-band::before {
        content: "";
        position: absolute;
        z-index: -1;
        inset: -18% -10%;
        pointer-events: none;
        background:
          radial-gradient(circle at 22% 28%, rgba(154,126,230,0.055), transparent 18%),
          radial-gradient(circle at 78% 62%, rgba(94,70,122,0.12), transparent 22%);
        opacity: 0.72;
        transform:
          translate3d(
            calc(var(--ls-pointer-x) * 18px),
            calc((var(--ls-scroll-y) * -0.018px) + (var(--ls-pointer-y) * 16px)),
            0
          );
        will-change: transform;
      }
      .ls-panel,
      .ls-process-card,
      .ls-detail-card,
      .ls-authority-stage,
      .ls-authority-card,
      .ls-checkout-shell {
        background: linear-gradient(180deg, rgba(237,233,247,0.055), rgba(237,233,247,0.025));
        border: 1px solid ${C.line};
        border-radius: 8px;
        box-shadow: inset 0 1px 0 rgba(237,233,247,0.05);
      }
      .ls-process-card {
        min-height: 360px;
        padding: 32px;
      }
      .ls-process-number {
        color: ${C.gold};
        font-family: "Fraunces", Georgia, serif;
        font-size: 4.6rem;
        line-height: 1;
        opacity: 0.86;
      }
      .ls-detail-card,
      .ls-authority-card {
        padding: 22px;
      }
      .ls-authority-stage {
        padding: clamp(28px, 5vw, 56px);
        background:
          radial-gradient(ellipse at 18% 0%, rgba(154,126,230,0.14), transparent 34%),
          linear-gradient(180deg, rgba(237,233,247,0.06), rgba(237,233,247,0.025));
      }
      .ls-calc-toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        width: 100%;
        text-align: left;
        border: 1px solid rgba(154,126,230,0.26);
        border-radius: 10px;
        background: rgba(5,4,7,0.4);
        padding: 16px 18px;
        cursor: pointer;
        transition: border-color 0.2s ease;
      }
      .ls-calc-toggle:hover { border-color: rgba(154,126,230,0.5); }
      .ls-calc-toggle.is-open {
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
        border-bottom-color: transparent;
      }
      .ls-calc-head { display: grid; gap: 4px; }
      .ls-calc-title {
        color: ${C.cream};
        font-family: "Fraunces", Georgia, serif;
        font-size: clamp(1.15rem, 2.4vw, 1.5rem);
        line-height: 1.1;
      }
      .ls-calc-chevron {
        flex: none;
        color: ${C.gold};
        transition: transform 0.28s ease;
      }
      .ls-calc-toggle.is-open .ls-calc-chevron { transform: rotate(180deg); }
      .ls-calc-body {
        border: 1px solid rgba(154,126,230,0.26);
        border-top: none;
        border-radius: 0 0 10px 10px;
        padding: clamp(18px, 3vw, 28px);
        background:
          radial-gradient(ellipse at 0% 0%, rgba(154,126,230,0.10), transparent 46%),
          linear-gradient(180deg, rgba(5,4,7,0.32), rgba(5,4,7,0.12));
      }
      .ls-calc-lead {
        color: ${C.cream};
        font-family: "Fraunces", Georgia, serif;
        font-size: clamp(1.05rem, 2.2vw, 1.3rem);
        line-height: 1.45;
        max-width: 640px;
      }
      .ls-calc-grid {
        margin-top: 22px;
        display: grid;
        gap: 1px;
        background: rgba(154,126,230,0.16);
        border: 1px solid rgba(154,126,230,0.16);
        border-radius: 10px;
        overflow: hidden;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .ls-calc-card {
        display: grid;
        gap: 6px;
        padding: clamp(18px, 2.6vw, 26px);
        background: ${C.cosmos};
      }
      .ls-calc-stat {
        color: ${C.gold};
        font-family: "Fraunces", Georgia, serif;
        font-size: clamp(2.2rem, 5vw, 3.1rem);
        line-height: 0.95;
        letter-spacing: -0.01em;
      }
      .ls-calc-stat-label {
        color: ${C.cream};
        font-family: "Newsreader", Georgia, serif;
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }
      .ls-calc-stat-body {
        margin-top: 4px;
        color: ${C.muted};
        font-family: "Newsreader", Georgia, serif;
        font-size: 0.84rem;
        line-height: 1.5;
      }
      .ls-birth-intro {
        position: relative;
        z-index: 1;
      }
      .ls-birth-copy {
        max-width: 520px;
      }
      .ls-chart-shell {
        position: relative;
        z-index: 1;
        overflow: hidden;
        min-height: 560px;
        border: 1px solid rgba(124,92,214,0.5);
        border-top-color: rgba(124,92,214,0.8);
        border-radius: 8px;
        padding: clamp(24px, 4vw, 42px);
        background:
          radial-gradient(ellipse at 50% -12%, rgba(124,92,214,0.16), transparent 42%),
          radial-gradient(ellipse at 18% 82%, rgba(94,70,122,0.28), transparent 34%),
          linear-gradient(180deg, rgba(237,233,247,0.07), rgba(237,233,247,0.025));
        box-shadow: inset 0 1px 0 rgba(237,233,247,0.06), 0 28px 90px rgba(0,0,0,0.28);
      }
      .ls-solar {
        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
        opacity: 0.4;
      }
      .ls-solar-stage {
        position: absolute;
        top: 50%;
        left: 50%;
        width: min(128%, 560px);
        aspect-ratio: 1;
        transform: translate(-50%, -50%);
      }
      .ls-solar-sun {
        position: absolute;
        inset: 0;
        margin: auto;
        width: 118px;
        height: 118px;
        object-fit: contain;
        filter: drop-shadow(0 0 32px rgba(255,178,88,0.62));
      }
      .ls-solar-ring {
        position: absolute;
        inset: 0;
        margin: auto;
        aspect-ratio: 1;
        border: 1px solid rgba(154,126,230,0.10);
        border-radius: 50%;
        animation: ls-orbit linear infinite;
        will-change: transform;
      }
      .ls-solar-ring > img {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translate(-50%, -50%);
        object-fit: contain;
        filter: drop-shadow(0 0 6px rgba(154,126,230,0.4));
      }
      @keyframes ls-orbit {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .ls-chart-pill {
        position: relative;
        display: grid;
        gap: 6px;
        min-height: 82px;
        border: 1px solid rgba(237,233,247,0.10);
        border-radius: 8px;
        background: rgba(5,4,7,0.46);
        padding: 16px;
      }
      .ls-chart-pill span {
        color: ${C.cream};
        font-family: "Fraunces", Georgia, serif;
        font-size: 1.16rem;
        line-height: 1.1;
      }
      .ls-chart-pill small {
        color: ${C.muted};
        font-family: "Newsreader", Georgia, serif;
        font-size: 0.78rem;
        line-height: 1.35;
      }
      .ls-chart-form {
        display: grid;
        gap: 10px;
      }
      .ls-chart-form label,
      .ls-lead-form label {
        color: ${C.cream};
        font-family: "Newsreader", Georgia, serif;
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .ls-chart-form > div {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 10px;
        align-items: center;
      }
      .ls-chart-form input,
      .ls-lead-form input {
        min-height: 48px;
        width: 100%;
        border: 1px solid rgba(154,126,230,0.34);
        border-radius: 8px;
        background: rgba(5,4,7,0.62);
        color: ${C.cream};
        padding: 0 14px;
        font-family: "Newsreader", Georgia, serif;
        color-scheme: dark;
      }
      .ls-lead-form { display: grid; gap: 16px; max-width: 460px; }
      .ls-lead-form--wide { max-width: 560px; margin-left: auto; margin-right: auto; }
      .ls-lead-form--card { max-width: none; }
      .ls-lead-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
      .ls-calc-toggle-hint {
        display: flex;
        align-items: center;
        gap: 6px;
        flex: none;
        color: ${C.gold};
        font-family: "Newsreader", Georgia, serif;
        font-size: 0.74rem;
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      .ls-lead-field { display: grid; gap: 6px; }
      .ls-lead-form .ls-gold-button { justify-content: center; }

      .ls-sky-teaser { margin-top: 30px; }
      .ls-sky-preview { opacity: 0.72; margin-bottom: 16px; }
      .ls-sky-grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .ls-planet-card {
        display: flex;
        align-items: center;
        gap: 14px;
        min-height: 86px;
        border: 1px solid rgba(237,233,247,0.10);
        border-radius: 10px;
        background: rgba(5,4,7,0.46);
        padding: 14px;
      }
      .ls-planet-orb {
        width: 54px;
        height: 54px;
        flex: none;
        object-fit: contain;
        filter: drop-shadow(0 0 10px rgba(154,126,230,0.26));
      }
      .ls-element-orb,
      .ls-glyph-orb {
        display: grid;
        place-items: center;
        color: ${C.gold};
        font-size: 1.7rem;
        border: 1px solid rgba(154,126,230,0.42);
        border-radius: 50%;
        filter: none;
      }
      .ls-glyph-orb {
        font-size: 1.5rem;
        background: rgba(154,126,230,0.06);
      }
      .ls-calc-figure {
        margin: 0 0 18px;
        border: 1px solid rgba(154,126,230,0.2);
        border-radius: 10px;
        overflow: hidden;
        background: #0d0a14;
      }
      .ls-calc-figure img {
        display: block;
        width: 100%;
        height: auto;
        max-height: 300px;
        object-fit: cover;
        object-position: center 42%;
        opacity: 0.92;
      }
      .ls-calc-figure figcaption {
        padding: 10px 14px;
        color: ${C.muted};
        font-family: "Newsreader", Georgia, serif;
        font-size: 0.72rem;
        line-height: 1.4;
        letter-spacing: 0.03em;
        border-top: 1px solid rgba(154,126,230,0.14);
      }
      .ls-planet-body { display: grid; gap: 3px; min-width: 0; }
      .ls-planet-head {
        display: flex;
        align-items: baseline;
        gap: 8px;
        color: ${C.creamDim};
        font-family: "Newsreader", Georgia, serif;
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      .ls-planet-glyph { color: ${C.gold}; font-size: 1.15rem; font-style: normal; }
      .ls-planet-sign {
        color: ${C.cream};
        font-family: "Fraunces", Georgia, serif;
        font-size: 1.18rem;
        font-weight: 500;
        line-height: 1.05;
      }
      .ls-planet-card small {
        color: ${C.muted};
        font-family: "Newsreader", Georgia, serif;
        font-size: 0.76rem;
        line-height: 1.35;
      }
      .ls-sky-locked { position: relative; margin-top: 12px; }
      .ls-planet-card.is-locked .ls-planet-body {
        filter: blur(7px);
        opacity: 0.55;
        user-select: none;
      }
      .ls-sky-gate {
        position: absolute;
        inset: 0;
        display: grid;
        place-content: center;
        justify-items: center;
        gap: 10px;
        padding: 22px;
        text-align: center;
        border-radius: 10px;
        background: linear-gradient(180deg, rgba(13,10,20,0.60), rgba(13,10,20,0.88));
        backdrop-filter: blur(2px);
      }
      .ls-sky-gate p {
        color: ${C.cream};
        font-family: "Fraunces", Georgia, serif;
        font-size: clamp(1.4rem, 3.6vw, 1.9rem);
        line-height: 1.1;
      }
      .ls-sky-gate small {
        color: ${C.creamDim};
        font-family: "Newsreader", Georgia, serif;
        font-size: 0.86rem;
        line-height: 1.4;
        max-width: 360px;
      }
      .ls-sky-gate form {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 10px;
        width: 100%;
        max-width: 420px;
        margin-top: 4px;
      }
      .ls-sky-gate input {
        min-height: 48px;
        width: 100%;
        border: 1px solid rgba(154,126,230,0.34);
        border-radius: 8px;
        background: rgba(5,4,7,0.72);
        color: ${C.cream};
        padding: 0 14px;
        font-family: "Newsreader", Georgia, serif;
      }
      .ls-sky-bridge { margin-top: 22px; text-align: center; }
      .ls-sky-bridge-lead {
        color: ${C.cream};
        font-family: "Fraunces", Georgia, serif;
        font-size: clamp(1.1rem, 2.4vw, 1.45rem);
        line-height: 1.45;
        max-width: 560px;
        margin: 0 auto;
      }
      .ls-sky-cta { margin-top: 18px; width: 100%; justify-content: center; }

      /* --- Cosmic reveal funnel: sealed gate -> unseal -> 3 free -> email -> locked -> upsell --- */
      .ls-orrery-wrap { position: relative; transition: filter 900ms ease, transform 900ms ease; }
      .ls-orrery-wrap.is-sealed .ls-orrery { filter: brightness(0.42) saturate(0.7) blur(2px); transform: scale(0.985); }
      .ls-orrery-wrap.is-open .ls-orrery { animation: ls-unseal 1100ms cubic-bezier(0.22,0.7,0.2,1) both; }
      @keyframes ls-unseal {
        0% { filter: brightness(0.4) blur(3px); transform: scale(0.985); }
        100% { filter: none; transform: none; }
      }
      .ls-seal-veil {
        position: absolute; inset: 0; z-index: 5;
        display: grid; place-items: center; padding: 16px;
        background: radial-gradient(ellipse at 50% 40%, rgba(13,10,20,0.55), rgba(8,6,11,0.86) 72%);
        backdrop-filter: blur(2px);
      }
      /* === "Set the chart" card - a violet-lit celestial surface. The passage's
         destination: same night, same stars, the chart waiting to be set. ==== */
      .ls-seal-card {
        position: relative;
        width: 100%; max-width: 440px;
        display: grid; gap: 13px; justify-items: center; text-align: center;
        padding: clamp(24px, 5vw, 36px) clamp(22px, 4vw, 34px) clamp(22px, 4vw, 32px);
        border: 1px solid rgba(124,92,214,0.46); border-radius: 22px;
        background:
          radial-gradient(1.1px 1.1px at 21% 24%, rgba(236,232,255,0.8), transparent),
          radial-gradient(1.4px 1.4px at 71% 62%, rgba(214,204,255,0.6), transparent),
          radial-gradient(1px 1px at 46% 86%, rgba(236,232,255,0.5), transparent),
          radial-gradient(1px 1px at 86% 14%, rgba(236,232,255,0.55), transparent),
          radial-gradient(120% 90% at 50% -10%, rgba(124,92,214,0.28), transparent 56%),
          radial-gradient(90% 70% at 86% 112%, rgba(94,70,150,0.22), transparent 62%),
          linear-gradient(180deg, rgba(30,22,48,0.95), rgba(13,10,20,0.98));
        background-repeat: repeat, repeat, repeat, repeat, no-repeat, no-repeat, no-repeat;
        background-size: 230px 230px, 230px 230px, 230px 230px, 230px 230px, 100% 100%, 100% 100%, 100% 100%;
        box-shadow:
          0 34px 90px rgba(0,0,0,0.6),
          0 0 70px rgba(124,92,214,0.16),
          inset 0 1px 0 rgba(185,165,240,0.2),
          inset 0 0 44px rgba(124,92,214,0.09);
      }
      .ls-seal-card::before {
        content: ""; position: absolute; top: -1px; left: 9%; right: 9%; height: 1px;
        background: linear-gradient(90deg, transparent, rgba(185,165,240,0.85), transparent);
        pointer-events: none;
      }
      .ls-seal-crest { line-height: 0; margin-bottom: 2px; position: relative; }
      .ls-seal-crest svg { display: block; filter: drop-shadow(0 0 9px rgba(154,126,230,0.45)); }
      .ls-seal-crest-asc { filter: drop-shadow(0 0 5px rgba(185,165,240,0.9)); }
      /* the seal docks: one flare when the passage's traveling ring
         match-cuts onto the crest (class added once by CosmicBridge) */
      .ls-seal-crest::after {
        content: ""; position: absolute; inset: -16px; border-radius: 50%;
        opacity: 0; pointer-events: none;
        background: radial-gradient(circle, rgba(185,165,240,0.55) 0%, rgba(154,126,230,0.22) 46%, transparent 72%);
      }
      .ls-seal-crest.lcb-docked::after { animation: lsCrestFlare 1.3s cubic-bezier(.16,1,.3,1) 1; }
      @keyframes lsCrestFlare { 0% { opacity: 0; } 24% { opacity: 1; } 100% { opacity: 0; } }
      @media (prefers-reduced-motion: reduce) { .ls-seal-crest.lcb-docked::after { animation: none; } }
      .ls-seal-glyph { font-size: 1.6rem; color: ${C.gold}; line-height: 1; }
      .ls-seal-title {
        color: ${C.cream}; font-family: "Fraunces", Georgia, serif;
        font-size: clamp(1.5rem, 4vw, 2.05rem); font-weight: 500; line-height: 1.1;
      }
      .ls-seal-sub { color: rgba(222,214,244,0.85); font-family: "Newsreader", Georgia, serif; font-size: 0.95rem; letter-spacing: 0.01em; }
      .ls-seal-field { width: 100%; display: grid; gap: 6px; text-align: left; }
      .ls-seal-field label {
        color: ${C.violetSoft}; font-family: "Newsreader", Georgia, serif;
        font-size: 0.72rem; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase;
      }
      .ls-seal-field label span { color: rgba(200,192,226,0.6); font-weight: 500; text-transform: none; letter-spacing: 0; }
      .ls-seal-field input {
        min-height: 52px; width: 100%;
        border: 1px solid rgba(124,92,214,0.42); border-radius: 12px;
        background: linear-gradient(180deg, rgba(8,6,15,0.85), rgba(13,10,22,0.72));
        color: ${C.cream}; padding: 0 16px;
        font-family: "Newsreader", Georgia, serif; font-size: 1rem;
        caret-color: ${C.violetBright}; color-scheme: dark;
        box-shadow: inset 0 1px 3px rgba(0,0,0,0.5);
        transition: border-color 220ms ease, background 220ms ease, box-shadow 320ms ease;
      }
      .ls-seal-field input::placeholder { color: rgba(200,192,226,0.42); }
      .ls-seal-field input:focus {
        outline: none; border-color: ${C.violetBright};
        box-shadow: inset 0 1px 3px rgba(0,0,0,0.4), 0 0 0 4px rgba(154,126,230,0.16), 0 0 26px rgba(124,92,214,0.3);
        animation: ls-seal-breathe 3s ease-in-out infinite;
      }
      @keyframes ls-seal-breathe {
        0%, 100% { box-shadow: inset 0 1px 3px rgba(0,0,0,0.4), 0 0 0 4px rgba(154,126,230,0.13), 0 0 20px rgba(124,92,214,0.22); }
        50% { box-shadow: inset 0 1px 3px rgba(0,0,0,0.4), 0 0 0 4px rgba(154,126,230,0.24), 0 0 34px rgba(124,92,214,0.42); }
      }
      .ls-seal-field input.is-filled {
        border-color: rgba(185,165,240,0.66);
        background: linear-gradient(180deg, rgba(16,12,30,0.9), rgba(20,15,36,0.8));
      }
      .ls-seal-field input.is-filled:not(:focus) {
        box-shadow: inset 0 1px 3px rgba(0,0,0,0.45), 0 0 14px rgba(124,92,214,0.18);
        animation: ls-seal-seat 460ms cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes ls-seal-seat {
        0% { box-shadow: inset 0 1px 3px rgba(0,0,0,0.45), 0 0 0 0 rgba(154,126,230,0); }
        35% { box-shadow: inset 0 1px 3px rgba(0,0,0,0.45), 0 0 0 5px rgba(154,126,230,0.26), 0 0 30px rgba(124,92,214,0.46); }
        100% { box-shadow: inset 0 1px 3px rgba(0,0,0,0.45), 0 0 14px rgba(124,92,214,0.18); }
      }
      .ls-seal-help { color: ${C.muted}; font-family: "Newsreader", Georgia, serif; font-size: 0.74rem; line-height: 1.4; max-width: 340px; display: flex; flex-direction: column; gap: 6px; }
      .ls-seal-help-ln { margin: 0; opacity: 0; animation: lsSealHelpIn 0.7s cubic-bezier(0.16,1,0.3,1) both; }
      @keyframes lsSealHelpIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      @media (prefers-reduced-motion: reduce) { .ls-seal-help-ln { animation: none; opacity: 1; } }
      /* The form CTA rides a metal-VIOLET ramp: the free-reading section is
         cosmic purple + white only (no gold), so the buy-moment gold material
         is re-cut in the section's own light. Only its halo breathes. */
      .ls-seal-card .ls-seal-cta {
        width: 100%; justify-content: center; margin-top: 6px;
        min-height: 54px; border-radius: 14px; font-size: 16.5px;
        background: linear-gradient(180deg,#ece4fb 0%,#cfc0f4 18%,#ab90e6 40%,#9a7ee6 56%,#7b5fc7 80%,#5d47a0 100%);
        color: #170f2b;
        box-shadow: 0 1px 0 rgba(255,255,255,.42) inset, 0 -1px 0 rgba(0,0,0,.3) inset,
          0 6px 18px -6px rgba(124,92,214,.55);
      }
      .ls-seal-card .ls-seal-cta:hover {
        filter: brightness(1.07) saturate(1.05);
        box-shadow: 0 1px 0 rgba(255,255,255,.46) inset, 0 -1px 0 rgba(0,0,0,.3) inset,
          0 10px 26px -6px rgba(124,92,214,.68);
      }
      .ls-seal-card .ls-seal-cta:active {
        background: linear-gradient(165deg,#ab90e6,#7b5fc7);
        box-shadow: inset 0 2px 6px rgba(0,0,0,.35);
      }
      .ls-seal-card .ls-seal-cta:focus-visible { outline: 2px solid #ece4fb; outline-offset: 3px; }
      .ls-seal-card .ls-seal-cta::after {
        content: ""; position: absolute; inset: -3px; border-radius: 17px; pointer-events: none;
        background: none; mix-blend-mode: normal; transform: none;
        box-shadow: 0 0 26px 5px rgba(154,126,230,0.4);
        opacity: 0.3; animation: ls-seal-cta-glow 4.2s ease-in-out infinite;
      }
      @keyframes ls-seal-cta-glow { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.85; } }
      @media (prefers-reduced-motion: reduce) {
        .ls-seal-field input:focus, .ls-seal-field input.is-filled:not(:focus) { animation: none; }
        .ls-seal-card .ls-seal-cta::after { animation: none; opacity: 0.45; }
      }

      /* loading animation between gate submit and the reveal */
      .ls-seal-loading { display: grid; gap: 16px; justify-items: center; text-align: center; padding: 30px 22px; }
      .ls-seal-orbit { position: relative; width: 136px; height: 136px; }
      .ls-seal-core {
        position: absolute; top: 50%; left: 50%; width: 22px; height: 22px; margin: -11px 0 0 -11px;
        border-radius: 50%; background: radial-gradient(circle at 40% 35%, ${C.goldSoft}, ${C.gold} 60%, ${C.goldDeep});
        box-shadow: 0 0 24px rgba(154,126,230,0.7); animation: ls-corepulse 2.2s ease-in-out infinite;
      }
      .ls-seal-ring { position: absolute; border: 1px solid rgba(154,126,230,0.22); border-radius: 50%; }
      .ls-seal-ring i {
        position: absolute; top: -4px; left: 50%; width: 8px; height: 8px; margin-left: -4px;
        border-radius: 50%; background: ${C.violetSoft}; box-shadow: 0 0 10px rgba(154,126,230,0.9);
      }
      .ls-seal-ring-1 { inset: 8px; animation: ls-spin 2.6s linear infinite; }
      .ls-seal-ring-2 { inset: 34px; animation: ls-spin 3.8s linear infinite reverse; }
      .ls-seal-ring-2 i { background: ${C.goldSoft}; box-shadow: 0 0 10px rgba(185,165,240,0.9); }
      .ls-seal-ring-3 { inset: 56px; animation: ls-spin 5.4s linear infinite; }
      .ls-seal-ring-3 i { width: 6px; height: 6px; background: ${C.cream}; }
      @keyframes ls-spin { to { transform: rotate(360deg); } }
      @keyframes ls-corepulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.18); } }
      .ls-seal-loading-text { color: ${C.cream}; font-family: "Fraunces", Georgia, serif; font-size: clamp(1.4rem, 3.4vw, 1.95rem); line-height: 1.1; }
      .ls-seal-loading-sub { color: ${C.muted}; font-family: "Newsreader", Georgia, serif; font-size: 0.85rem; }

      /* the REAL placement shown on the solar-system bubble; generic meaning sits under it */
      .ls-orrery-placement {
        display: block; color: ${C.goldSoft};
        font-family: "Fraunces", Georgia, serif;
        font-size: clamp(1.35rem, 3.2vw, 2rem); font-weight: 600; line-height: 1.04; margin: 3px 0 1px;
      }
      .ls-orrery-line--info { color: ${C.muted} !important; font-size: clamp(0.88rem, 1.6vw, 1.08rem) !important; }

      @media (prefers-reduced-motion: reduce) {
        .ls-seal-ring, .ls-seal-core { animation: none !important; }
      }

      .ls-reveal-stack { max-width: 980px; margin: 22px auto 0; padding: 0 4px; display: grid; gap: 22px; }
      .ls-reveal-eyebrow {
        text-align: center; color: ${C.creamDim};
        font-family: "Newsreader", Georgia, serif; font-size: 0.72rem; font-weight: 800;
        letter-spacing: 0.16em; text-transform: uppercase;
      }
      .ls-reveal-eyebrow--rest { margin-top: 6px; color: ${C.violetSoft}; }
      .ls-free-grid { display: grid; gap: 12px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
      @media (max-width: 720px) { .ls-free-grid { grid-template-columns: 1fr; } }
      .ls-free-card {
        display: grid; gap: 6px; justify-items: center; text-align: center;
        padding: 20px 16px;
        border: 1px solid ${C.lineViolet}; border-radius: 14px;
        background: linear-gradient(180deg, rgba(21,16,28,0.7), rgba(13,10,20,0.85));
      }
      .ls-free-glyph { font-size: 1.5rem; color: ${C.violetSoft}; line-height: 1; }
      .ls-free-frame {
        color: ${C.creamDim}; font-family: "Newsreader", Georgia, serif;
        font-size: 0.68rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase;
      }
      .ls-free-sign { color: ${C.cream}; font-family: "Fraunces", Georgia, serif; font-size: 1.22rem; font-weight: 500; line-height: 1.1; }
      .ls-free-card small { color: ${C.muted}; font-family: "Newsreader", Georgia, serif; font-size: 0.8rem; line-height: 1.4; }

      .ls-locked-block { display: grid; gap: 14px; }
      .ls-locked-eyebrow {
        text-align: center; color: ${C.violetSoft};
        font-family: "Newsreader", Georgia, serif; font-size: 0.72rem; font-weight: 800;
        letter-spacing: 0.16em; text-transform: uppercase;
      }
      .ls-teaser-grid { display: grid; gap: 12px; grid-template-columns: repeat(4, minmax(0, 1fr)); }
      @media (max-width: 900px) { .ls-teaser-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      @media (max-width: 520px) { .ls-teaser-grid { grid-template-columns: 1fr; } }
      .ls-teaser-card {
        position: relative; overflow: hidden;
        display: grid; gap: 6px; padding: 18px 16px;
        border: 1px solid ${C.line}; border-radius: 14px;
        background: linear-gradient(180deg, rgba(21,16,28,0.6), rgba(13,10,20,0.82));
      }
      .ls-teaser-card::after {
        content: ""; position: absolute; inset: 0; pointer-events: none;
        background: linear-gradient(180deg, transparent 40%, rgba(13,10,20,0.5));
      }
      .ls-teaser-lock { position: absolute; top: 12px; right: 12px; z-index: 1; color: ${C.gold}; font-size: 0.8rem; opacity: 0.8; }
      .ls-teaser-glyph { color: ${C.gold}; font-size: 1.3rem; line-height: 1; }
      .ls-teaser-title { color: ${C.cream}; font-family: "Fraunces", Georgia, serif; font-size: 1.02rem; font-weight: 500; line-height: 1.15; }
      .ls-teaser-line { color: ${C.muted}; font-family: "Newsreader", Georgia, serif; font-size: 0.78rem; line-height: 1.4; filter: blur(2.6px); user-select: none; }

      .ls-upsell {
        display: grid; gap: 14px; justify-items: center; text-align: center;
        max-width: 640px; margin: 8px auto 0; padding: clamp(26px, 4vw, 38px);
        border: 1px solid rgba(154,126,230,0.34); border-radius: 18px;
        background: radial-gradient(ellipse at 50% 0%, rgba(124,92,214,0.18), transparent 60%), linear-gradient(180deg, rgba(24,18,32,0.92), rgba(13,10,20,0.96));
      }
      .ls-upsell-title { color: ${C.cream}; font-family: "Fraunces", Georgia, serif; font-size: clamp(1.5rem, 3.6vw, 2.1rem); font-weight: 500; line-height: 1.12; }
      .ls-upsell-pitch { color: ${C.creamDim}; font-family: "Newsreader", Georgia, serif; font-size: 0.96rem; line-height: 1.55; max-width: 540px; }
      .ls-upsell-cta { margin-top: 4px; }
      @media (prefers-reduced-motion: reduce) {
        .ls-orrery-wrap.is-open .ls-orrery { animation: none !important; }
        .ls-orrery-wrap { transition: none !important; }
      }
      .ls-story-section {
        background:
          radial-gradient(ellipse at 78% 18%, rgba(94,70,122,0.22), transparent 34%),
          radial-gradient(ellipse at 10% 62%, rgba(154,126,230,0.08), transparent 28%);
      }
      .ls-story-inner,
      .ls-story-hero,
      .ls-story-moments,
      .ls-receive-panel {
        position: relative;
        z-index: 1;
      }
      .ls-story-hero {
        display: grid;
        grid-template-columns: minmax(0, 0.9fr) minmax(360px, 0.82fr);
        align-items: center;
        gap: clamp(34px, 5vw, 82px);
      }
      .ls-story-copy {
        max-width: 620px;
      }
      .ls-story-cat {
        position: relative;
        overflow: hidden;
        aspect-ratio: 4 / 5;
        margin: 0;
        border-radius: 8px;
        background: #030305;
        box-shadow: 0 32px 110px rgba(0,0,0,0.42);
      }
      .ls-story-cat::before {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 1;
        background:
          linear-gradient(90deg, rgba(3,3,5,0.54), transparent 40%),
          radial-gradient(circle at 76% 46%, rgba(106,156,255,0.14), transparent 24%);
        pointer-events: none;
      }
      .ls-story-cat img,
      .ls-story-moment img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .ls-story-cat img {
        object-position: 82% center;
        transform: scale(1.18);
        transform-origin: 82% center;
      }
      .ls-story-moments {
        display: grid;
        grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
        gap: clamp(22px, 3vw, 38px);
        align-items: stretch;
        margin-top: clamp(54px, 7vw, 92px);
      }
      .ls-story-moment {
        display: grid;
        grid-template-rows: auto 1fr;
        gap: 18px;
      }
      .ls-story-moment figure {
        overflow: hidden;
        margin: 0;
        border-radius: 8px;
        background: #030305;
        box-shadow: 0 24px 80px rgba(0,0,0,0.32);
      }
      .ls-story-moment--wide figure {
        aspect-ratio: 16 / 9;
      }
      .ls-story-moment:not(.ls-story-moment--wide) figure {
        aspect-ratio: 4 / 5;
      }
      .ls-story-moment--wide img {
        object-position: 38% center;
      }
      .ls-story-moment:not(.ls-story-moment--wide) img {
        object-position: 67% center;
      }
      .ls-story-moment h3,
      .ls-receive-item strong {
        color: ${C.cream};
        font-family: "Fraunces", Georgia, serif;
        font-size: clamp(1.35rem, 2.5vw, 1.85rem);
        font-weight: 500;
        line-height: 1.08;
      }
      .ls-story-moment p:not(:first-child),
      .ls-receive-item p {
        margin-top: 10px;
        color: ${C.creamDim};
        font-family: "Newsreader", Georgia, serif;
        font-size: 0.98rem;
        line-height: 1.65;
      }
      .ls-receive-panel {
        display: grid;
        grid-template-columns: minmax(0, 0.82fr) minmax(0, 1.18fr);
        gap: clamp(28px, 5vw, 68px);
        align-items: start;
        margin-top: clamp(62px, 8vw, 106px);
        padding-top: clamp(34px, 5vw, 58px);
        border-top: 1px solid rgba(154,126,230,0.22);
      }
      .ls-receive-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 18px;
      }
      .ls-receive-item {
        min-height: 168px;
        border: 1px solid rgba(154,126,230,0.24);
        border-radius: 8px;
        background: linear-gradient(180deg, rgba(237,233,247,0.055), rgba(237,233,247,0.018));
        padding: clamp(18px, 2.5vw, 24px);
      }

      .ls-disclosure {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        width: 100%;
        text-align: left;
        border: 1px solid rgba(154,126,230,0.30);
        border-radius: 12px;
        background: linear-gradient(180deg, rgba(237,233,247,0.06), rgba(237,233,247,0.02));
        padding: 20px 22px;
        cursor: pointer;
        transition: border-color 0.2s ease, background 0.2s ease;
      }
      .ls-disclosure:hover { border-color: rgba(154,126,230,0.52); }
      .ls-disclosure.is-open {
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
        border-bottom-color: transparent;
      }
      .ls-disclosure-text { display: grid; gap: 6px; }
      .ls-disclosure-title {
        color: ${C.cream};
        font-family: "Fraunces", Georgia, serif;
        font-size: clamp(1.5rem, 3vw, 2.1rem);
        line-height: 1.05;
      }
      .ls-disclosure-icon {
        flex: none;
        display: grid;
        place-items: center;
        width: 42px;
        height: 42px;
        border-radius: 50%;
        border: 1px solid rgba(154,126,230,0.4);
        color: ${C.gold};
        font-size: 1.6rem;
        line-height: 1;
      }
      .ls-disclosure-body {
        border: 1px solid rgba(154,126,230,0.30);
        border-top: none;
        border-bottom-left-radius: 12px;
        border-bottom-right-radius: 12px;
        overflow: hidden;
      }
      .ls-disclosure-body > section {
        padding-top: 22px !important;
        padding-bottom: 22px !important;
        min-height: 0;
      }
      .ls-chart-form .ls-gold-button {
        white-space: nowrap;
      }
      .ls-chart-message {
        margin: 12px 0 0;
        color: ${C.creamDim};
        font-family: "Newsreader", Georgia, serif;
        font-size: 0.84rem;
        line-height: 1.45;
      }
      .ls-chart-message.is-error {
        color: ${C.goldSoft};
      }

      /* === Free reading: stage + cinematic compute + natal wheel + info ===== */
      .ls-stage {
        position: relative;
        display: grid;
        place-items: center;
        width: min(100%, 1060px);
        min-height: clamp(420px, 64vw, 540px);
        margin: clamp(22px, 4vw, 44px) auto 0;
      }
      .ls-stage-card { margin-inline: auto; }
      .ls-seal-why {
        background: none; border: 0; padding: 2px 0; cursor: pointer;
        color: ${C.violetSoft}; font-family: "Newsreader", Georgia, serif; font-size: 0.8rem;
        text-decoration: underline; text-underline-offset: 3px;
        transition: color 180ms ease;
      }
      .ls-seal-why:hover { color: ${C.violetBright}; }

      .ls-compute {
        position: relative;
        width: min(92vw, 460px);
        aspect-ratio: 1;
        max-height: 520px;
        border-radius: 20px;
        overflow: hidden;
        border: 1px solid ${C.line};
        background: radial-gradient(ellipse at 50% 42%, ${C.cosmos2}, ${C.cosmos} 72%);
      }
      .ls-compute-dust {
        position: absolute; inset: 0; opacity: 0.5;
        background-image:
          radial-gradient(1px 1px at 20% 24%, rgba(237,233,247,0.7), transparent),
          radial-gradient(1px 1px at 70% 30%, rgba(237,233,247,0.5), transparent),
          radial-gradient(1.4px 1.4px at 44% 66%, #fff, transparent),
          radial-gradient(1px 1px at 82% 62%, rgba(237,233,247,0.5), transparent),
          radial-gradient(1px 1px at 16% 78%, rgba(237,233,247,0.6), transparent),
          radial-gradient(1.2px 1.2px at 58% 18%, #fff, transparent);
        background-size: 260px 260px;
        animation: ls-twinkle 3.6s ease-in-out infinite;
      }
      @keyframes ls-twinkle { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.7; } }
      .ls-compute-instrument { position: absolute; top: 41%; left: 50%; width: 176px; height: 176px; transform: translate(-50%, -50%); }
      .ls-compute-ring { position: absolute; border-radius: 50%; border: 1px solid rgba(154,126,230,0.28); }
      .ls-compute-ring i { position: absolute; top: -3px; left: 50%; width: 6px; height: 6px; margin-left: -3px; border-radius: 50%; background: ${C.violetSoft}; box-shadow: 0 0 10px rgba(154,126,230,0.9); }
      .ls-compute-ring-1 { inset: 0; animation: ls-spin 7s linear infinite; }
      .ls-compute-ring-2 { inset: 28px; border-color: rgba(154,126,230,0.18); animation: ls-spin 11s linear infinite reverse; }
      .ls-compute-ring-2 i { background: ${C.violetBright}; box-shadow: 0 0 10px rgba(185,165,240,0.9); }
      .ls-compute-ring-3 { inset: 56px; border-style: dashed; border-color: rgba(237,233,247,0.12); }
      .ls-compute-sweep { position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(from 0deg, rgba(154,126,230,0.34), rgba(154,126,230,0) 30%); -webkit-mask: radial-gradient(circle, transparent 30%, #000 31%); mask: radial-gradient(circle, transparent 30%, #000 31%); animation: ls-spin 4.5s linear infinite; }
      .ls-compute-mote {
        position: absolute; top: 50%; left: 50%; width: 16px; height: 16px; margin: -8px 0 0 -8px;
        border-radius: 50%;
        background: radial-gradient(circle at 40% 35%, ${C.violetBright}, ${C.violetSoft} 60%, #55428f);
        box-shadow: 0 0 30px rgba(154,126,230,0.85);
        opacity: 0.55; transform: scale(0.7);
        transition: opacity 400ms ease, transform 400ms ease;
        animation: ls-corepulse 3s ease-in-out infinite;
      }
      .ls-compute-mote.is-lit { opacity: 1; transform: scale(1); }
      .ls-compute-readout {
        position: absolute; top: 60%; left: 0; right: 0; min-height: 1.2em; text-align: center;
        color: ${C.violetBright}; font-family: "Newsreader", Georgia, serif; font-size: 0.92rem;
        letter-spacing: 0.04em; font-variant-numeric: tabular-nums;
      }
      .ls-compute-line {
        position: absolute; bottom: 13%; left: 0; right: 0; margin: 0; padding: 0 24px; text-align: center;
        color: ${C.cream}; font-family: "Fraunces", Georgia, serif; font-size: clamp(1.15rem, 3.4vw, 1.5rem); line-height: 1.35;
      }
      .ls-sound-cta {
        display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 18px; border-radius: 999px;
        border: 1px solid rgba(154,126,230,0.55); background: rgba(124,92,214,0.18); color: ${C.violetBright};
        font-family: "Newsreader", Georgia, serif; font-size: 0.92rem; cursor: pointer;
        animation: ls-soundpulse 2.6s ease-in-out infinite;
      }
      .ls-sound-cta:hover { background: rgba(124,92,214,0.34); color: ${C.cream}; border-color: ${C.violetSoft}; }
      @keyframes ls-soundpulse { 0%,100% { box-shadow: 0 0 0 0 rgba(154,126,230,0); } 50% { box-shadow: 0 0 0 7px rgba(154,126,230,0.1); } }

      .ls-wheel { display: grid; justify-items: center; gap: 16px; }
      .ls-wheel-svg { width: min(92vw, 460px); height: auto; aspect-ratio: 1; display: block; }
      /* Drawn zodiac + planet glyphs (one hand, no font-character fallbacks). */
      .ls-wheel-zsym .gl-s { fill: none; stroke: #9a7ee6; stroke-width: 1.15; stroke-linecap: round; stroke-linejoin: round; }
      .ls-wheel-zsym .gl-f { fill: #9a7ee6; stroke: none; }
      .ls-wheel-zsym.is-sun .gl-s { stroke: #dccdfa; }
      .ls-wheel-zsym.is-sun .gl-f { fill: #dccdfa; }
      .ls-wheel-centername { font-family: "Fraunces", Georgia, serif; letter-spacing: 0.01em; }
      .ls-wheel-centerborn, .ls-wheel-centerdom {
        font-family: "Newsreader", Georgia, serif; letter-spacing: 0.2em; font-weight: 700; text-transform: uppercase;
      }
      .ls-wheel-info {
        display: inline-flex; align-items: center; gap: 9px; min-height: 44px; padding: 0 16px;
        border-radius: 999px; border: 1px solid rgba(154,126,230,0.45); background: rgba(13,10,20,0.6);
        color: ${C.violetBright}; font-family: "Newsreader", Georgia, serif; font-size: 0.86rem; cursor: pointer;
        transition: border-color 200ms ease, color 200ms ease;
      }
      .ls-wheel-info:hover { border-color: ${C.violetSoft}; color: ${C.violetSoft}; }
      .ls-wheel-info-mark {
        display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%;
        border: 1px solid rgba(154,126,230,0.65); font-family: "Fraunces", Georgia, serif;
        font-size: 0.8rem; line-height: 1; font-style: italic;
      }
      .ls-free-head {
        display: inline-flex; align-items: center; gap: 8px; color: ${C.creamDim};
        font-family: "Newsreader", Georgia, serif; font-size: 0.68rem; font-weight: 800;
        letter-spacing: 0.12em; text-transform: uppercase;
      }
      .ls-free-glyph { font-size: 1.05rem; color: ${C.violetSoft}; line-height: 1; }
      .ls-free-sign { font-size: clamp(1.15rem, 3.4vw, 1.45rem); font-variant-numeric: tabular-nums; }

      .ls-info-inline { width: min(100%, 1000px); margin: 10px auto 0; }
      .ls-info-panel {
        position: relative; width: 100%;
        display: grid; gap: 14px; padding: clamp(14px, 3vw, 22px);
        border: 1px solid rgba(124,92,214,0.24); border-radius: 20px;
        background: linear-gradient(180deg, rgba(21,16,28,0.96), rgba(10,8,16,0.98));
        box-shadow: inset 0 1px 0 rgba(237,233,247,0.05), 0 24px 70px rgba(0,0,0,0.45);
      }
      .ls-breakdown-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr)); }
      .ls-breakdown-card { justify-items: start; text-align: left; }
      .ls-breakdown-card .ls-free-sign { text-align: left; }
      .ls-breakdown-card small { text-align: left; }
      /* Authored hand-off from the wheel into the skim breakdown. */
      /* Wheel -> table handoff. The seam lines draw outward from the star mark as
         the reader crosses into the chapter: the threshold completes under them. */
      .ls-skim-seam { display: flex; align-items: center; justify-content: center; gap: 14px; width: min(100%, 420px); margin: 0 auto 4px; color: ${C.violetBright}; }
      .ls-skim-seam-line { height: 2px; flex: 1; border-radius: 1px; background: linear-gradient(90deg, transparent, rgba(185,165,240,0.75), transparent); box-shadow: 0 0 10px rgba(185,165,240,0.4); }
      .ls-skim-seam-mark { opacity: 0.95; transition: opacity 480ms ease 120ms; filter: drop-shadow(0 0 6px rgba(185,165,240,0.65)); }
      .ls-skim-seam.ls-rvrow .ls-skim-seam-line {
        transform: scaleX(0);
        transition: transform 560ms cubic-bezier(0.22,0.61,0.28,1) 60ms;
      }
      .ls-skim-seam.ls-rvrow .ls-skim-seam-line:first-child { transform-origin: right center; }
      .ls-skim-seam.ls-rvrow .ls-skim-seam-line:last-child { transform-origin: left center; }
      .ls-skim-seam.ls-rvrow:not([data-in]) .ls-skim-seam-mark { opacity: 0; }
      .ls-skim-seam.ls-rvrow[data-in] .ls-skim-seam-line { transform: scaleX(1); }

      /* The chapter title is a real scroll station, not a whispered label. Same
         words, set large in the journey's serif so the eye has a place to land. */
      .ls-skim-title {
        text-align: center; color: ${C.cream};
        font-family: "Fraunces", Georgia, serif;
        font-size: clamp(2rem, 6.4vw, 2.75rem);
        font-weight: 500; line-height: 1.16; letter-spacing: 0.004em;
        text-wrap: balance;
        text-shadow: 0 2px 34px rgba(124,92,214,0.4);
      }
      .ls-skim-title.ls-rvrow {
        opacity: 0; transform: translate3d(0, 28px, 0); filter: blur(8px);
        transition: opacity 560ms cubic-bezier(0.22,0.61,0.28,1), transform 560ms cubic-bezier(0.22,0.61,0.28,1), filter 560ms cubic-bezier(0.22,0.61,0.28,1);
      }
      .ls-skim-title.ls-rvrow[data-in] { opacity: 1; transform: translate3d(0,0,0); filter: blur(0); }

      .ls-chart-table { display: grid; gap: 10px; width: 100%; max-width: 760px; margin: 0 auto; }
      /* The tease lattice sits tighter and quieter so ten named rows read as one
         calm set, not a stack of ten paywall stamps. */
      .ls-chart-table--rest { gap: 7px; margin-top: 14px; }

      .ls-trow {
        position: relative; display: grid; grid-template-columns: auto 1fr; gap: 15px; align-items: start;
        padding: 16px 18px; border: 1px solid ${C.lineViolet}; border-radius: 14px; text-align: left;
        background: linear-gradient(180deg, rgba(21,16,28,0.7), rgba(13,10,20,0.85));
        overflow: hidden;
        filter: saturate(1) brightness(1);
        transition:
          border-color 560ms ease var(--ls-unseal, 0s),
          box-shadow 560ms ease var(--ls-unseal, 0s),
          background 560ms ease var(--ls-unseal, 0s),
          padding 560ms cubic-bezier(0.22,0.61,0.28,1) var(--ls-unseal, 0s),
          filter 640ms cubic-bezier(0.22,0.61,0.28,1) var(--ls-unseal, 0s);
      }
      /* One overlay layer per row. It plays three parts, one state at a time:
         the waiting pulse of an empty shell, the gold bloom when a free row
         lands, and the light-wash as a sealed row unseals. */
      .ls-trow::after {
        content: ""; position: absolute; inset: 0; pointer-events: none;
        border-radius: inherit; opacity: 0;
      }
      /* Outline-then-fill. The row's shell (its slot in the lattice) is CLEARLY
         visible before the content arrives (a lit, breathing empty slot) and
         the reader's own scroll seats the words into it. Glyph lands first, the
         text settles 90ms behind it, then stillness. */
      .ls-trow.ls-rvrow .ls-trow-glyph,
      .ls-trow.ls-rvrow .ls-trow-main {
        transition:
          opacity 560ms cubic-bezier(0.22,0.61,0.28,1) var(--ls-delay, 0s),
          transform 560ms cubic-bezier(0.22,0.61,0.28,1) var(--ls-delay, 0s),
          filter 560ms cubic-bezier(0.22,0.61,0.28,1) var(--ls-delay, 0s);
      }
      .ls-trow.ls-rvrow .ls-trow-main {
        transition-delay: calc(var(--ls-delay, 0s) + 90ms), calc(var(--ls-delay, 0s) + 90ms), calc(var(--ls-delay, 0s) + 90ms);
      }
      .ls-trow.ls-rvrow:not([data-in]) .ls-trow-glyph { opacity: 0; transform: translate3d(0, 26px, 0) scale(0.7); }
      .ls-trow.ls-rvrow:not([data-in]) .ls-trow-main { opacity: 0; transform: translate3d(0, 34px, 0); filter: blur(10px); }
      /* The tease lattice resolves chaos -> order: named rows drift in from
         alternating sides and settle into the one aligned column. */
      .ls-chart-table--rest .ls-trow.ls-rvrow:not([data-in]) .ls-trow-main { transform: translate3d(-30px, 22px, 0); }
      .ls-chart-table--rest .ls-trow.ls-rvrow:nth-child(even):not([data-in]) .ls-trow-main { transform: translate3d(30px, 22px, 0); }
      /* The waiting shell: bright violet outline, hollow interior, one slow
         synchronized breath. It must read as "a slot is held for this". */
      .ls-trow.ls-rvrow:not([data-in]) {
        box-shadow: none;
        border-color: rgba(154,126,230,0.48);
        background: linear-gradient(180deg, rgba(15,11,21,0.42), rgba(10,8,16,0.5));
      }
      .ls-trow.ls-rvrow:not([data-in])::after {
        opacity: 1;
        background: radial-gradient(ellipse at 50% 60%, rgba(154,126,230,0.1), transparent 72%);
        animation: ls-shell-wait 2.4s ease-in-out infinite;
      }
      @keyframes ls-shell-wait { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
      .ls-trow.ls-rvrow[data-in] .ls-trow-glyph,
      .ls-trow.ls-rvrow[data-in] .ls-trow-main { opacity: 1; transform: translate3d(0,0,0); filter: blur(0); }

      .ls-trow-glyph {
        display: grid; place-items: center; width: 42px; height: 42px; border-radius: 50%;
        font-size: 1.34rem; line-height: 1; color: ${C.violetSoft};
        border: 1px solid rgba(154,126,230,0.32);
        background: radial-gradient(circle at 50% 35%, rgba(154,126,230,0.15), rgba(154,126,230,0.04) 70%);
      }
      .ls-trow-main { min-width: 0; display: grid; gap: 4px; }
      .ls-trow-top { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
      .ls-trow-name { color: ${C.cream}; font-family: "Fraunces", Georgia, serif; font-size: 1.08rem; font-weight: 500; letter-spacing: 0.002em; }
      .ls-trow-sign { color: ${C.violetBright}; font-family: "Newsreader", Georgia, serif; font-size: 0.74rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; font-variant-numeric: tabular-nums; }
      /* Frame sits ABOVE the name (eyebrow -> name -> line), so every row reads
         with the same landing-strip texture instead of one uniform block. */
      .ls-trow-frame { order: -1; color: ${C.creamDim}; font-family: "Newsreader", Georgia, serif; font-size: 0.62rem; font-weight: 800; letter-spacing: 0.13em; text-transform: uppercase; opacity: 0.82; }
      .ls-trow-line {
        margin: 5px 0 0; color: ${C.muted}; font-family: "Newsreader", Georgia, serif;
        font-size: 0.92rem; line-height: 1.55; max-width: 58ch;
        transition: filter 560ms cubic-bezier(0.22,0.61,0.28,1) var(--ls-unseal, 0s), opacity 560ms ease var(--ls-unseal, 0s);
      }

      /* FREE rows - the three that are given. These are the show: a lit
         medallion, a warmer surface, and a reading set a full tier larger. */
      .ls-trow.is-free {
        border-color: rgba(185,165,240,0.6);
        background:
          radial-gradient(ellipse at 0% 0%, rgba(154,126,230,0.15), transparent 46%),
          linear-gradient(180deg, rgba(30,23,41,0.85), rgba(15,11,22,0.9));
        box-shadow: 0 14px 34px rgba(0,0,0,0.28), 0 0 30px rgba(154,126,230,0.14);
      }
      /* The violet seam down the leading edge draws in AFTER the words have seated:
         the row lands, then clicks shut. That closing stroke is the payoff. */
      .ls-trow.is-free::before {
        content: ""; position: absolute; left: 0; top: 10px; bottom: 10px; width: 5px;
        border-radius: 0 3px 3px 0;
        background: linear-gradient(180deg, #e6dcff, rgba(154,126,230,0.6));
        box-shadow: 0 0 14px rgba(185,165,240,0.6);
        transform: scaleY(0); transform-origin: center top;
        transition: transform 460ms cubic-bezier(0.22,0.61,0.28,1) calc(var(--ls-delay, 0s) + 460ms);
      }
      .ls-trow.is-free[data-in]::before { transform: scaleY(1); }
      /* A free row's waiting shell holds a slightly brighter outline - the three
         given slots are marked as special before they even fill. */
      .ls-trow.is-free:not([data-in]) { border-color: rgba(185,165,240,0.52); }
      /* One soft bloom as the free row lands - the light swells off the seam
         edge, then dies. Once, then stillness. */
      .ls-trow.is-free[data-in]::after {
        background: radial-gradient(ellipse at 8% 50%, rgba(185,165,240,0.4), transparent 62%);
        animation: ls-free-bloom 1000ms cubic-bezier(0.22,0.61,0.28,1) calc(var(--ls-delay, 0s) + 500ms) both;
      }
      @keyframes ls-free-bloom { 0% { opacity: 0; } 30% { opacity: 1; } 100% { opacity: 0; } }
      .ls-trow.is-free .ls-trow-glyph {
        width: 50px; height: 50px; color: ${C.violetBright}; font-size: 1.56rem;
        border-color: rgba(185,165,240,0.62);
        background: radial-gradient(circle at 50% 32%, rgba(185,165,240,0.28), rgba(154,126,230,0.07) 72%);
        box-shadow: 0 0 26px rgba(185,165,240,0.32);
      }
      .ls-trow.is-free .ls-trow-name { font-size: 1.3rem; }
      .ls-trow.is-free .ls-trow-frame { color: ${C.violetSoft}; opacity: 1; }
      .ls-trow.is-free .ls-trow-line { font-size: 1.08rem; line-height: 1.6; color: ${C.creamDim}; }

      /* TEASE rows - the ten unread placements. Named, never blurred; the same
         quiet register as the dossier's locked rows so the skim table visibly
         feeds the card below. Whole row is a 48px+ tap target to the sale. */
      .ls-trow.is-tease {
        grid-template-columns: auto 1fr auto;
        align-items: center;
        min-height: 56px;
        padding: 12px 14px 12px 18px;
        border-color: rgba(154,126,230,0.18);
        background: linear-gradient(180deg, rgba(17,13,24,0.6), rgba(11,8,17,0.72));
        cursor: pointer; -webkit-tap-highlight-color: transparent;
        font: inherit; color: inherit;
        transition: border-color 300ms ease, background 300ms ease, transform 180ms cubic-bezier(0.22,0.61,0.28,1);
      }
      .ls-trow.is-tease:hover { border-color: rgba(154,126,230,0.38); }
      .ls-trow.is-tease:active { transform: translateY(1px); background: linear-gradient(180deg, rgba(24,18,38,0.7), rgba(14,10,22,0.8)); }
      .ls-trow.is-tease:focus-visible { outline: 2px solid ${C.violetBright}; outline-offset: 2px; }
      .ls-trow.is-tease .ls-trow-glyph {
        width: 38px; height: 38px; font-size: 1.18rem;
        color: rgba(139,123,216,0.78); border-color: rgba(154,126,230,0.2);
        background: rgba(154,126,230,0.05);
      }
      .ls-trow.is-tease .ls-trow-main { gap: 2px; }
      .ls-trow.is-tease .ls-trow-name { color: #b3a7e0; font-size: 1.02rem; }
      .ls-trow.is-tease .ls-trow-frame {
        order: 0; text-transform: none; letter-spacing: 0.004em;
        font-family: "Newsreader", Georgia, serif; font-style: italic; font-weight: 400;
        font-size: 0.95rem; color: #9b8fd0; opacity: 1;
      }
      .ls-trow-chev { width: 18px; height: 18px; flex: none; opacity: 0.55; }

      /* Tactile press on the reveal surface: fast in (60ms), soft out. */
      .ls-skim .ls-gold-button,
      .ls-seal-cta {
        transition: filter 180ms ease, box-shadow 180ms ease, background 180ms ease,
          border-color 180ms ease, color 180ms ease,
          transform 180ms cubic-bezier(0.22,0.61,0.28,1);
        touch-action: manipulation;
      }
      .ls-skim .ls-gold-button:hover, .ls-seal-cta:hover { transform: translateY(-1px); }
      .ls-skim .ls-gold-button:active, .ls-seal-cta:active {
        transform: translateY(1px) scale(0.97);
      }

      @media (prefers-reduced-motion: reduce) {
        .ls-trow.ls-rvrow, .ls-trow.ls-rvrow .ls-trow-glyph, .ls-trow.ls-rvrow .ls-trow-main,
        .ls-trow-line, .ls-skim-title.ls-rvrow, .ls-skim-seam.ls-rvrow .ls-skim-seam-line,
        .ls-skim-seam-mark {
          opacity: 1 !important; transform: none !important; filter: none !important; transition: none !important;
        }
        .ls-trow::after { animation: none !important; opacity: 0 !important; }
        .ls-trow.is-free::before { transform: none !important; transition: none !important; }
        .ls-skim .ls-gold-button, .ls-seal-cta,
        .ls-skim .ls-gold-button:hover, .ls-seal-cta:hover,
        .ls-skim .ls-gold-button:active, .ls-seal-cta:active { transform: none !important; transition: none !important; }
      }

      /* === The narrated journey (cinematic) =============================== */
      /* ONE SKY: the journey's private radial card sky + drifting star layer are
         gone. The reveal sits directly in the shared graded night (violet lift
         arrives from the page backdrop, not a boxed panel). */
      .ls-journey { position: relative; width: 100%; max-width: 880px; margin: clamp(16px,4vw,40px) auto 0; display: grid; justify-items: center; gap: clamp(20px,3.4vw,34px); padding: clamp(26px,5vw,54px) 16px clamp(20px,3vw,34px); border-radius: 28px; isolation: isolate; }
      .ls-journey > * { position: relative; z-index: 2; }
      .ls-journey-stage { position: relative; height: auto; overflow: visible; padding: 0; width: 100%; display: grid; justify-items: center; pointer-events: none; transition: opacity 700ms ease, filter 700ms ease; }
      .ls-journey-stage.is-dim { opacity: 0.14; filter: blur(3px); }
      .ls-journey-stage .ls-wheel { position: relative; }
      .ls-journey-stage .ls-wheel::before { content: ""; position: absolute; inset: -6%; z-index: 0; border-radius: 50%; pointer-events: none; background: radial-gradient(circle, rgba(124,92,214,0.22), rgba(154,126,230,0.08) 46%, transparent 70%); animation: ls-jglow 7s ease-in-out infinite; }
      .ls-journey-stage .ls-wheel-svg { position: relative; z-index: 1; animation: ls-jbreath 9s ease-in-out infinite; }
      @keyframes ls-jglow { 0%,100% { opacity: 0.55; } 50% { opacity: 1; } }
      @keyframes ls-jbreath { 0%,100% { transform: scale(1); } 50% { transform: scale(1.014); } }
      .ls-journey-cap { min-height: clamp(150px,22vh,210px); display: grid; place-items: center; padding: 4px 10px; cursor: pointer; width: 100%; }
      .ls-cap-line { margin: 0; max-width: 21ch; text-align: center; color: ${C.cream}; font-family: "Fraunces", Georgia, serif; font-size: clamp(1.75rem, 5.9vw, 2.85rem); line-height: 1.32; font-weight: 500; letter-spacing: 0.004em; text-shadow: 0 2px 34px rgba(124,92,214,0.35); }
      .ls-cap-line.is-caveat { font-family: "Caveat", cursive; color: ${C.violetBright}; font-size: clamp(2.1rem, 7vw, 3.1rem); line-height: 1.2; }
      .ls-journey-dots { display: flex; gap: 7px; flex-wrap: wrap; justify-content: center; max-width: 280px; }
      .ls-jdot { width: 6px; height: 6px; padding: 0; border: 0; border-radius: 50%; background: rgba(224,218,242,0.16); cursor: pointer; transition: transform .3s ease, background .3s ease; }
      .ls-jdot.is-done { background: rgba(154,126,230,0.5); }
      .ls-jdot.is-active { background: ${C.violetBright}; transform: scale(1.7); }
      .ls-journey-controls { display: flex; align-items: center; gap: 14px; opacity: 0.55; transition: opacity 250ms ease; }
      .ls-journey-controls:hover, .ls-journey-controls:focus-within { opacity: 1; }
      .ls-jbtn { display: inline-flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; padding: 0 6px; border: 0; background: transparent; color: ${C.creamDim}; font-family: "Newsreader", Georgia, serif; font-size: 1.18rem; cursor: pointer; transition: color 200ms ease; }
      .ls-jbtn:hover { color: ${C.violetSoft}; }
      .ls-jbtn--play {
        color: ${C.violetBright}; font-size: 1.02rem; width: 46px; height: 46px; border-radius: 50%;
        border: 1px solid rgba(185,165,240,0.38);
        background: radial-gradient(circle at 50% 40%, rgba(185,165,240,0.16), rgba(154,126,230,0.04) 72%);
      }
      .ls-jbtn--play:hover { color: ${C.violetBright}; border-color: rgba(185,165,240,0.65); }
      .ls-jbtn--sound { font-size: 0.66rem; letter-spacing: 0.1em; text-transform: uppercase; }
      .ls-start { position: absolute; inset: 0; z-index: 4; display: grid; place-content: center; justify-items: center; gap: 6px; text-align: center; border-radius: 28px; padding: 24px; background: radial-gradient(ellipse at 50% 45%, rgba(11,8,18,0.55), rgba(6,5,11,0.92) 72%); }
      .ls-journey--start .ls-wheel-svg { filter: blur(3px) brightness(0.85); opacity: 0.5; animation: none; }
      .ls-journey--start .ls-wheel-centername, .ls-journey--start .ls-wheel-centerborn, .ls-journey--start .ls-wheel-centerdom { display: none; }
      .ls-start-eyebrow { color: ${C.violetSoft}; font-family: "Newsreader", Georgia, serif; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; }
      .ls-start-name { margin: 6px 0 0; color: ${C.violetBright}; font-family: "DM Serif Display", "Fraunces", Georgia, serif; font-size: clamp(2.6rem, 9.5vw, 4.4rem); line-height: 1; text-shadow: 0 2px 40px rgba(154,126,230,0.35); }
      .ls-start-sub { color: ${C.muted}; font-family: "Fraunces", Georgia, serif; font-size: 1.1rem; }
      .ls-start-cta { margin-top: 16px; }
      .ls-start-quiet { background: none; border: 0; color: ${C.muted}; font-family: "Newsreader", Georgia, serif; font-size: 0.82rem; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; margin-top: 4px; }
      .ls-start-quiet:hover { color: ${C.creamDim}; }
      .ls-offer { width: 100%; max-width: 560px; display: grid; justify-items: center; text-align: center; gap: 13px; padding: clamp(24px,4vw,38px); border: 1px solid rgba(154,126,230,0.34); border-radius: 20px; background: radial-gradient(ellipse at 50% 0%, rgba(124,92,214,0.2), transparent 60%), linear-gradient(180deg, rgba(24,18,32,0.95), rgba(13,10,20,0.98)); box-shadow: 0 30px 90px rgba(0,0,0,0.5); }
      .ls-offer-title { color: ${C.cream}; font-family: "DM Serif Display", "Fraunces", Georgia, serif; font-size: clamp(2rem, 5.6vw, 2.9rem); line-height: 1.05; }
      .ls-offer-stack { color: ${C.creamDim}; font-family: "Fraunces", Georgia, serif; font-size: clamp(1.1rem, 3.1vw, 1.35rem); line-height: 1.5; max-width: 46ch; }
      .ls-offer-form { display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 10px; width: 100%; max-width: 460px; margin-top: 6px; }
      .ls-offer-form input { min-height: 48px; width: 100%; border: 1px solid rgba(154,126,230,0.38); border-radius: 8px; background: rgba(5,4,7,0.72); color: ${C.cream}; padding: 0 14px; font-family: "Newsreader", Georgia, serif; }
      .ls-offer-form input:focus { outline: none; border-color: ${C.violetSoft}; }
      .ls-offer-trust { color: ${C.muted}; font-family: "Fraunces", Georgia, serif; font-style: italic; font-size: 1.04rem; max-width: 44ch; }
      @media (max-width: 520px) { .ls-offer-form { grid-template-columns: 1fr; } }
      @media (prefers-reduced-motion: reduce) {
        .ls-journey-stage { transition: none !important; }
        .ls-journey-stage .ls-wheel::before, .ls-journey-stage .ls-wheel-svg { animation: none !important; }
      }
      .ls-info-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      .ls-info-back {
        display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 12px;
        border-radius: 8px; border: 1px solid ${C.lineViolet}; background: transparent; cursor: pointer;
        color: ${C.violetSoft}; font-family: "Newsreader", Georgia, serif; font-size: 0.86rem;
      }
      .ls-info-back:hover { border-color: rgba(154,126,230,0.6); }
      .ls-info-title { color: ${C.creamDim}; font-family: "Newsreader", Georgia, serif; font-size: 0.8rem; letter-spacing: 0.04em; }
      .ls-info-note { margin: 0 auto; max-width: 60ch; text-align: center; color: ${C.muted}; font-family: "Newsreader", Georgia, serif; font-size: 0.78rem; line-height: 1.5; }
      .ls-skim { width: min(100%, 760px); margin: clamp(20px,4.5vw,40px) auto 0; padding-top: clamp(18px,3.5vw,30px); border-top: 1px solid rgba(154,126,230,0.18); }
      @media (prefers-reduced-motion: reduce) {
        .ls-compute-dust, .ls-compute-mote, .ls-compute-ring, .ls-compute-sweep, .ls-sound-cta { animation: none !important; }
      }

      /* Seamless reveal -> pricing junction: no boxed shell, no private wash -
         the dawn behind checkout now rises from the ONE shared sky. */
      .ls-checkout-shell {
        background: transparent;
        border: 0;
        border-radius: 0;
        box-shadow: none;
      }
      .ls-checkout-vars {
        --black: ${C.cream};
        --ink: ${C.cream};
        --earth: ${C.creamDim};
        --muted: ${C.muted};
        --cream: transparent;
        --cream2: rgba(237,233,247,0.06);
        --cream3: rgba(154,126,230,0.26);
        --sand: rgba(154,126,230,0.34);
        --rose: ${C.violetSoft};
        --rose-hover: ${C.violetBright};
        --gold: ${C.violetSoft};
        --charity-glow: rgba(154,126,230,0.28);
      }
      .ls-gold-button,
      .ls-ghost-button {
        min-height: 52px;
        align-items: center;
        justify-content: center;
        display: inline-flex;
        gap: 10px;
        border-radius: 12px;
        padding: 14px 28px;
        font-family: "Newsreader", Georgia, serif;
        font-size: 16.5px;
        font-weight: 600;
        letter-spacing: 0.02em;
        line-height: 1;
        transition: filter 180ms ease, box-shadow 180ms ease, border-color 180ms ease,
          background 180ms ease, color 180ms ease, transform 60ms ease;
      }
      /* Every buy-moment button carries the house metal-violet ramp (colour
         law: purple + white): graded metal, white ink, inset bevel, violet throw. */
      .ls-gold-button,
      .ls-violet-button {
        position: relative;
        overflow: hidden;
        border: 0;
        background: linear-gradient(180deg,#a78bfa 0%,#9a7ee6 18%,#8266d9 40%,#7452c8 56%,#6243b0 80%,#47307f 100%);
        color: #ffffff;
        box-shadow: 0 1px 0 rgba(255,255,255,.28) inset, 0 -1px 0 rgba(0,0,0,.3) inset,
          0 6px 18px -6px rgba(124,92,214,.55);
      }
      .ls-gold-button::after,
      .ls-violet-button::after {
        content: ""; position: absolute; inset: 0; pointer-events: none;
        background: linear-gradient(105deg,transparent 42%,rgba(255,255,255,.35) 50%,transparent 58%);
        mix-blend-mode: overlay; transform: translateX(-120%); transition: transform .5s ease;
      }
      .ls-gold-button:hover,
      .ls-violet-button:hover {
        filter: brightness(1.07) saturate(1.05);
        box-shadow: 0 1px 0 rgba(255,255,255,.45) inset, 0 -1px 0 rgba(0,0,0,.28) inset,
          0 10px 26px -6px rgba(124,92,214,.6);
      }
      .ls-gold-button:hover::after,
      .ls-violet-button:hover::after { transform: translateX(120%); }
      .ls-gold-button:active,
      .ls-violet-button:active {
        background: linear-gradient(165deg,#8f6de0,#6a4cc4);
        box-shadow: inset 0 2px 6px rgba(0,0,0,.35); transform: translateY(1px); filter: none;
      }
      .ls-gold-button:focus-visible,
      .ls-violet-button:focus-visible { outline: 2px solid #cbb8f5; outline-offset: 3px; }
      .ls-gold-button:disabled {
        cursor: default;
        filter: saturate(.7) brightness(.9);
      }
      .ls-ghost-button {
        color: #cfc7ec;
        border: 1px solid rgba(139,123,216,0.4);
        font-weight: 400;
      }
      .ls-ghost-button:hover {
        border-color: rgba(139,123,216,0.64);
        background: rgba(139,123,216,0.07);
      }
      @media (prefers-reduced-motion: reduce) {
        .ls-gold-button::after, .ls-violet-button::after { display: none; }
      }
      /* hero memorial escape hatch: one quiet line under the CTAs */
      .ls-hero-memorial {
        appearance: none;
        -webkit-appearance: none;
        background: none;
        border: 0;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        min-height: 44px;
        margin-top: 10px;
        padding: 8px 2px;
        color: rgba(222,214,232,0.72);
        font-family: "Newsreader", Georgia, serif;
        font-size: 0.95rem;
        letter-spacing: 0.012em;
        text-decoration: underline;
        text-decoration-color: rgba(222,214,232,0.32);
        text-underline-offset: 4px;
        transition: color .3s ease, text-decoration-color .3s ease;
      }
      .ls-hero-memorial:hover { color: #efe9dd; text-decoration-color: rgba(185,165,240,0.55); }
      .ls-hero-memorial:focus-visible { outline: 1px solid rgba(185,165,240,0.7); outline-offset: 4px; border-radius: 4px; }
      /* ── the reading-path chooser (intent capture) ───────────────────────
         Its own journey-moment section directly after the hero. First visit:
         a tall, unmissable chooser (discovery / gold first, memorial / violet
         second). Returning: a dignified, clearly-visible path banner, never a
         tiny grey line. Heart and feather marks stay recognizable; the
         choice itself reads as two quiet doorways. */
      .ls-path {
        position: relative;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: min(88svh, 780px);
        padding: clamp(56px, 11svh, 128px) 20px;
        text-align: center;
        overflow: hidden;
      }
      .ls-path-sky {
        position: absolute;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        background-image:
          radial-gradient(1.5px 1.5px at 12% 22%, rgba(255,255,255,0.7), transparent 60%),
          radial-gradient(1.3px 1.3px at 82% 16%, rgba(185,165,240,0.6), transparent 60%),
          radial-gradient(1.7px 1.7px at 68% 76%, rgba(185,165,240,0.6), transparent 60%),
          radial-gradient(1.2px 1.2px at 26% 70%, rgba(255,255,255,0.55), transparent 60%),
          radial-gradient(1.3px 1.3px at 46% 32%, rgba(255,255,255,0.5), transparent 60%),
          radial-gradient(1.1px 1.1px at 91% 54%, rgba(255,255,255,0.45), transparent 60%),
          radial-gradient(1.2px 1.2px at 8% 52%, rgba(185,165,240,0.5), transparent 60%);
        opacity: 0.7;
        transform: translate3d(calc(var(--ls-pointer-x, 0) * 14px), calc((var(--ls-scroll-y, 0) * -0.01px) + (var(--ls-pointer-y, 0) * 12px)), 0);
        will-change: transform;
      }
      .ls-path-inner {
        position: relative;
        z-index: 2;
        width: 100%;
        max-width: 940px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .ls-path-rv {
        opacity: 0;
        transform: translate3d(0, 26px, 0);
        filter: blur(8px);
        transition: opacity .8s cubic-bezier(.22,.7,.2,1), transform .8s cubic-bezier(.22,.7,.2,1), filter .8s cubic-bezier(.22,.7,.2,1);
        transition-delay: var(--ls-delay, 0s);
        will-change: opacity, transform;
      }
      .ls-path-rv[data-in] { opacity: 1; transform: translate3d(0, 0, 0); filter: blur(0); }
      .ls-path-eyebrow {
        margin: 0;
        font-family: "Newsreader", Georgia, serif;
        font-size: 0.75rem;
        font-weight: 500;
        letter-spacing: 0.28em;
        text-transform: uppercase;
        color: #b9a5f0;
      }
      .ls-path-title {
        margin: 15px 0 0;
        font-family: "Fraunces", Georgia, serif;
        font-weight: 500;
        font-size: clamp(2.15rem, 1.42rem + 3.2vw, 3.75rem);
        line-height: 1.02;
        letter-spacing: -0.018em;
        color: #ffffff;
      }
      .ls-path-sub {
        margin: 16px 0 0;
        max-width: 34rem;
        font-family: "Newsreader", Georgia, serif;
        font-size: clamp(1rem, 0.94rem + 0.5vw, 1.18rem);
        line-height: 1.55;
        color: #c8c8d2;
      }
      .ls-path-cards {
        margin-top: clamp(34px, 5.5vw, 56px);
        display: grid;
        grid-template-columns: 1fr;
        gap: 18px;
        width: 100%;
        max-width: 54rem;
      }
      .ls-path-card {
        appearance: none;
        -webkit-appearance: none;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        flex-direction: column;
        gap: 24px;
        width: 100%;
        min-height: 248px;
        padding: clamp(24px, 6vw, 34px);
        text-align: left;
        border-radius: 8px;
        border: 1px solid rgba(237,233,247,0.12);
        background:
          linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.012)),
          rgba(9,7,13,0.62);
        color: #efe9dd;
        isolation: isolate;
        transition: transform .42s cubic-bezier(.22,.7,.2,1), border-color .4s ease, box-shadow .4s ease, background .4s ease;
      }
      .ls-path-card::before {
        content: "";
        position: absolute;
        inset: 12px;
        z-index: -1;
        border-radius: 6px;
        border: 1px solid rgba(255,255,255,0.075);
        background:
          linear-gradient(90deg, transparent calc(50% - 0.5px), rgba(255,255,255,0.08) calc(50% - 0.5px), rgba(255,255,255,0.08) calc(50% + 0.5px), transparent calc(50% + 0.5px)),
          radial-gradient(120% 72% at 50% 0%, rgba(255,255,255,0.045), transparent 60%);
        opacity: 0.94;
        transition: border-color .4s ease, background .4s ease, opacity .4s ease;
      }
      .ls-path-card::after {
        content: "";
        position: absolute;
        left: 12px;
        right: 12px;
        bottom: 12px;
        height: 34%;
        z-index: -1;
        border-radius: 0 0 6px 6px;
        opacity: 0.42;
        transform: translateY(12%);
        transition: opacity .4s ease, transform .42s cubic-bezier(.22,.7,.2,1);
        pointer-events: none;
      }
      .ls-path-card.is-discovery {
        border-color: rgba(154,126,230,0.42);
        background:
          linear-gradient(180deg, rgba(185,165,240,0.09), rgba(255,255,255,0.015)),
          rgba(9,7,13,0.64);
        box-shadow: 0 0 0 1px rgba(154,126,230,0.10) inset, 0 24px 58px -34px rgba(154,126,230,0.68);
      }
      .ls-path-card.is-discovery::after {
        background: radial-gradient(80% 100% at 50% 100%, rgba(185,165,240,0.32), transparent 72%);
      }
      .ls-path-card.is-memorial {
        border-color: rgba(154,126,230,0.34);
        background:
          linear-gradient(180deg, rgba(154,126,230,0.10), rgba(255,255,255,0.012)),
          rgba(9,7,13,0.64);
        box-shadow: 0 24px 58px -36px rgba(124,92,214,0.64);
      }
      .ls-path-card.is-memorial::after {
        background: radial-gradient(80% 100% at 50% 100%, rgba(185,165,240,0.30), transparent 72%);
      }
      .ls-path-card:hover { transform: translateY(-4px); }
      .ls-path-card:hover::after { opacity: 0.72; transform: translateY(0); }
      .ls-path-card.is-discovery:hover {
        border-color: rgba(185,165,240,0.78);
        box-shadow: 0 0 0 1px rgba(185,165,240,0.2) inset, 0 28px 64px -26px rgba(154,126,230,0.74);
      }
      .ls-path-card.is-memorial:hover {
        border-color: rgba(185,165,240,0.62);
        box-shadow: 0 28px 64px -28px rgba(124,92,214,0.72);
      }
      .ls-path-card:focus-visible { outline: 2px solid rgba(185,165,240,0.85); outline-offset: 3px; }
      .ls-path-card.is-memorial:focus-visible { outline-color: rgba(185,165,240,0.9); }
      .ls-path-card-text {
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .ls-path-card-label {
        font-family: "Fraunces", Georgia, serif;
        font-weight: 500;
        font-size: clamp(1.32rem, 1.05rem + 1.2vw, 1.8rem);
        line-height: 1.05;
        letter-spacing: -0.008em;
        color: #ffffff;
      }
      .ls-path-card-desc {
        font-family: "Newsreader", Georgia, serif;
        font-size: 0.96rem;
        line-height: 1.35;
        color: #c8c8d2;
      }
      .is-discovery .ls-path-card-desc { color: #e7dcc2; }
      .ls-path-card-go {
        flex: none;
        display: grid;
        place-items: center;
        width: 42px;
        height: 42px;
        border-radius: 50%;
        border: 1px solid rgba(237,233,247,0.16);
        color: #8f8798;
        transition: transform .35s cubic-bezier(.22,.7,.2,1), color .3s ease, border-color .3s ease, background .3s ease;
      }
      .ls-path-card:hover .ls-path-card-go { transform: translateX(3px); }
      .is-discovery:hover .ls-path-card-go { color: #0d0a14; background: #cfc0f4; border-color: #cfc0f4; }
      .is-memorial:hover .ls-path-card-go { color: #0d0a14; background: #b9a5f0; border-color: #b9a5f0; }
      /* bespoke celestial marks - dots of light, crescent, horizon. No sparkles. */
      .ls-path-mark {
        flex: none;
        display: grid;
        place-items: center;
        width: 72px;
        height: 72px;
      }
      .ls-path-mark svg { width: 100%; height: 100%; display: block; overflow: visible; }
      .is-discovery .ls-path-mark { color: #cfc0f4; }
      .is-memorial .ls-path-mark { color: #b9a5f0; }
      .ls-pm-line { stroke: currentColor; opacity: 0.55; }
      .ls-pm-thread { stroke: currentColor; opacity: 0.4; }
      .ls-pm-core { fill: currentColor; opacity: 0.16; animation: ls-pm-core 6s ease-in-out infinite; }
      .ls-pm-crescent { fill: currentColor; opacity: 0.9; }
      .ls-pm-star { fill: currentColor; animation: ls-pm-twinkle 3.8s ease-in-out infinite; }
      .ls-pm-star.s2 { animation-duration: 4.6s; animation-delay: .7s; }
      .ls-pm-star.s3 { animation-duration: 5.4s; animation-delay: 1.5s; }
      @keyframes ls-pm-twinkle { 0%, 100% { opacity: .4; } 50% { opacity: 1; } }
      @keyframes ls-pm-core { 0%, 100% { opacity: .12; } 50% { opacity: .26; } }
      /* returning-visitor path banner - dignified, always visible, easy change */
      .ls-path-held {
        min-height: clamp(210px, 32svh, 280px);
        padding: clamp(30px, 6svh, 56px) 20px;
      }
      .ls-path-held-inner {
        position: relative;
        z-index: 2;
        width: 100%;
        max-width: 580px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        gap: 20px;
        padding: 22px 24px;
        border-radius: 20px;
        border: 1px solid rgba(237,233,247,0.12);
        background:
          linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.012)),
          rgba(9,7,13,0.55);
        text-align: left;
      }
      .ls-path-held.is-discovery .ls-path-held-inner {
        border-color: rgba(154,126,230,0.42);
        box-shadow: 0 0 0 1px rgba(154,126,230,0.09) inset, 0 20px 48px -32px rgba(154,126,230,0.55);
      }
      .ls-path-held.is-memorial .ls-path-held-inner {
        border-color: rgba(154,126,230,0.38);
        box-shadow: 0 20px 48px -32px rgba(124,92,214,0.55);
      }
      .ls-path-held .ls-path-mark { width: 58px; height: 58px; }
      .ls-path-held-text { flex: 1 1 auto; min-width: 0; }
      .ls-path-held-label {
        margin: 0;
        font-family: "Fraunces", Georgia, serif;
        font-weight: 500;
        font-size: clamp(1.18rem, 1.04rem + 0.65vw, 1.46rem);
        line-height: 1.12;
        letter-spacing: -0.006em;
        color: #ffffff;
      }
      .ls-path-held-desc {
        margin: 6px 0 0;
        font-family: "Newsreader", Georgia, serif;
        font-size: 0.96rem;
        line-height: 1.35;
        color: #c8c8d2;
      }
      .ls-path-held.is-discovery .ls-path-held-desc { color: #e7dcc2; }
      .ls-path-change {
        flex: none;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 44px;
        padding: 10px 16px;
        border-radius: 999px;
        border: 1px solid rgba(237,233,247,0.24);
        background: rgba(255,255,255,0.03);
        cursor: pointer;
        color: #d8d0c1;
        font-family: "Newsreader", Georgia, serif;
        font-size: 0.92rem;
        letter-spacing: 0.01em;
        transition: color .3s ease, border-color .3s ease, background .3s ease;
      }
      .ls-path-change svg { transition: transform .3s ease; }
      .ls-path-change:hover { color: #ffffff; border-color: rgba(185,165,240,0.6); background: rgba(255,255,255,0.06); }
      .ls-path-held.is-memorial .ls-path-change:hover { border-color: rgba(185,165,240,0.66); }
      .ls-path-change:hover svg { transform: translateX(2px); }
      .ls-path-change:focus-visible { outline: 2px solid rgba(185,165,240,0.85); outline-offset: 3px; }
      @media (min-width: 760px) {
        .ls-path-cards {
          grid-template-columns: 1fr 1fr;
          gap: 22px;
          max-width: 720px;
        }
        .ls-path-card {
          min-height: 356px;
          padding: 38px 34px 32px;
        }
        .ls-path-card .ls-path-mark { width: 92px; height: 92px; }
        .ls-path-card-go { position: absolute; right: 26px; bottom: 28px; }
        .ls-path-card-text { gap: 7px; }
      }
      @media (prefers-reduced-motion: reduce) {
        .ls-path-card, .ls-path-card-go { transition: border-color .3s ease, box-shadow .3s ease, color .3s ease; }
        .ls-path-card:hover { transform: none; }
        .ls-path-card:hover .ls-path-card-go { transform: none; }
        .ls-path-sky { transform: none; }
        .ls-pm-core, .ls-pm-star { animation: none; opacity: 1; }
        .ls-pm-core { opacity: .2; }
        .ls-path-rv { opacity: 1 !important; transform: none !important; filter: none !important; transition: none !important; }
      }
      .ls-hero-section {
        background:
          linear-gradient(100deg, rgba(8,6,11,0.74), rgba(8,6,11,0.16)),
          url("/readings/hero/hero-motion-husky-shooting-star-poster.jpg") 68% center / cover no-repeat;
      }
      .ls-hero-backdrop {
        position: absolute;
        inset: 0;
        z-index: -30;
        overflow: hidden;
        background: url("/readings/hero/hero-motion-husky-shooting-star-poster.jpg") 68% center / cover no-repeat;
      }
      .ls-hero-backdrop::after {
        content: "";
        position: absolute;
        inset: 0;
        background:
          linear-gradient(90deg, rgba(8,6,11,0.74) 0%, rgba(8,6,11,0.42) 32%, rgba(8,6,11,0.04) 66%, rgba(8,6,11,0.08) 100%),
          linear-gradient(180deg, rgba(8,6,11,0.30) 0%, rgba(8,6,11,0.00) 42%, rgba(8,6,11,0.64) 100%);
        pointer-events: none;
      }
      .ls-hero-backdrop-video {
        position: absolute;
        left: 0;
        top: -96px;
        width: 100%;
        height: calc(100% + 192px);
        object-fit: cover;
        object-position: 68% center;
        opacity: 1;
        filter: saturate(1.12) contrast(1.08) brightness(1.08);
        transform: translateY(74px);
      }
      .ls-hero-copy {
        text-shadow: 0 2px 18px rgba(0,0,0,0.72), 0 8px 46px rgba(0,0,0,0.62);
      }
      .ls-hero-orbit {
        position: relative;
        min-height: 610px;
        transform: translate3d(
          calc(var(--ls-pointer-x) * -18px),
          calc(var(--ls-scroll-y) * -0.012px),
          0
        );
        will-change: transform;
      }
      .ls-orbit-card {
        position: absolute;
      }
      .ls-orbit-a {
        left: 0;
        top: 110px;
        width: 37%;
      }
      .ls-orbit-b {
        right: 0;
        top: 0;
        width: 45%;
      }
      .ls-orbit-c {
        bottom: 38px;
        left: 22%;
        width: 72%;
      }
      .ls-video-seed {
        position: absolute;
        left: 9%;
        top: 0;
        width: 33%;
        min-height: 92px;
        border-left: 1px solid rgba(154,126,230,0.34);
        padding-left: 16px;
        color: ${C.muted};
        font-family: "Newsreader", Georgia, serif;
        font-size: 12px;
      }
      .ls-video-seed strong {
        display: block;
        color: ${C.cream};
        font-family: "Fraunces", Georgia, serif;
        font-size: 1.25rem;
        font-weight: 400;
        font-style: italic;
        line-height: 1.18;
        margin-top: 6px;
      }
      .ls-hero-img {
        border: 1px solid rgba(154,126,230,0.34);
        border-radius: 8px;
        background: #050407;
        box-shadow: inset 0 1px 0 rgba(237,233,247,0.05), 0 20px 60px rgba(0,0,0,0.32);
      }
      .ls-hero-img img { display: block; }
      .ls-video-slot {
        border-left: none;
        padding-left: 0;
        min-height: 0;
        aspect-ratio: 1 / 1;
        border: 1px solid rgba(154,126,230,0.34);
        border-radius: 8px;
        overflow: hidden;
        background: #050407;
      }
      .ls-hero-video {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: opacity 320ms ease;
      }
      .ls-video-fallback {
        position: absolute;
        inset: 0;
        display: grid;
        align-content: center;
        gap: 6px;
        padding: 16px;
        color: ${C.muted};
        font-family: "Newsreader", Georgia, serif;
        font-size: 12px;
      }
      .ls-video-fallback strong {
        display: block;
        color: ${C.cream};
        font-family: "Fraunces", Georgia, serif;
        font-size: 1.25rem;
        font-weight: 400;
        font-style: italic;
        line-height: 1.18;
        margin-top: 6px;
      }
      .ls-placeholder {
        background: #050407;
        border: 1px solid rgba(154,126,230,0.34);
        border-radius: 8px;
      }
      .ls-placeholder::before {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(237,233,247,0.045), transparent 38%);
      }
      .ls-placeholder-core {
        position: absolute;
        inset: 0;
        background:
          radial-gradient(circle at 50% 42%, rgba(154,126,230,0.20), transparent 22%),
          radial-gradient(circle at 50% 42%, rgba(94,70,122,0.14), transparent 34%);
        opacity: 0.72;
        transform: translate3d(
          calc(var(--ls-pointer-x) * 10px),
          calc(var(--ls-pointer-y) * 10px),
          0
        );
      }
      .ls-device-caption {
        position: absolute;
        bottom: 18px;
        right: -18px;
        max-width: 210px;
        border: 1px solid ${C.line};
        border-radius: 8px;
        background: rgba(13,10,20,0.86);
        color: ${C.cream};
        font-family: "Fraunces", Georgia, serif;
        font-style: italic;
        font-size: 1.15rem;
        line-height: 1.28;
        padding: 16px 18px;
      }
      .ls-shooting-star {
        position: absolute;
        top: 18%;
        right: 22%;
        z-index: 0;
        width: 180px;
        height: 1px;
        background: linear-gradient(90deg, rgba(237,233,247,0), rgba(237,233,247,0.86), rgba(154,126,230,0));
        transform: rotate(-28deg);
        opacity: 0.7;
      }
      @media (min-width: 900px) {
        .ls-placeholder {
          transform: translate3d(0, 0, 0);
        }
        .ls-orbit-a { animation: lsFloatA 9s ease-in-out infinite; }
        .ls-orbit-b { animation: lsFloatB 10s ease-in-out infinite; }
        .ls-orbit-c { animation: lsFloatC 11s ease-in-out infinite; }
      }
      @keyframes lsFloatA { 0%,100%{ transform: translateY(0); } 50%{ transform: translateY(-14px); } }
      @keyframes lsFloatB { 0%,100%{ transform: translateY(0); } 50%{ transform: translateY(12px); } }
      @keyframes lsFloatC { 0%,100%{ transform: translateY(0); } 50%{ transform: translateY(-10px); } }
      @media (max-width: 899px) {
        /* Full-bleed video BEHIND the whole hero (title + buttons sit over it).
           16:9 video covers full width so the shooting-star sweep still reads
           side to side; only top/bottom crop. Copy overlaid low with a gradient. */
        .ls-hero-section {
          min-height: 82svh;
          display: flex;
          align-items: flex-end;
          padding-top: 92px;
          padding-bottom: 44px;
          background: #0a0810;
        }
        .ls-hero-backdrop {
          inset: 0;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          bottom: auto;
          overflow: hidden;
          background: url("/readings/hero/hero-motion-husky-shooting-star-poster.jpg") center center / cover no-repeat;
        }
        .ls-hero-backdrop::after {
          background: linear-gradient(180deg, rgba(10,8,16,0.30) 0%, rgba(10,8,16,0) 30%, rgba(10,8,16,0.34) 62%, rgba(10,8,16,0.88) 100%);
        }
        .ls-hero-backdrop-video {
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center center;
          opacity: 1;
          transform: none;
        }
        .ls-hero-veil {
          display: none;
        }
        .ls-hero-copy .ls-gold-button,
        .ls-hero-copy .ls-ghost-button {
          width: 100%;
        }
        .ls-parallax-band::before {
          opacity: 0.42;
          transform: translate3d(0, calc(var(--ls-scroll-y) * -0.004px), 0);
        }
        .ls-birth-intro {
          max-width: 36rem;
        }
        .ls-birth-copy {
          max-width: none;
          text-align: center;
        }
        .ls-story-hero,
        .ls-story-moments,
        .ls-receive-panel {
          grid-template-columns: 1fr;
        }
        .ls-story-copy {
          max-width: none;
        }
        .ls-story-cat {
          aspect-ratio: 4 / 3;
        }
        .ls-story-cat img {
          object-position: 80% center;
          transform: scale(1.1);
        }
        .ls-story-moments {
          margin-top: 42px;
        }
        .ls-story-moment--wide figure,
        .ls-story-moment:not(.ls-story-moment--wide) figure {
          aspect-ratio: 4 / 3;
        }
        .ls-story-moment--wide img {
          object-position: 34% center;
        }
        .ls-story-moment:not(.ls-story-moment--wide) img {
          object-position: 68% center;
        }
        .ls-receive-panel {
          margin-top: 46px;
          padding-top: 34px;
        }
        .ls-receive-grid {
          grid-template-columns: 1fr;
        }
        .ls-receive-item {
          min-height: 0;
        }
        .ls-hero-orbit {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          min-height: 0;
          transform: none;
        }
        .ls-orbit-card {
          position: relative;
          width: auto;
          inset: auto;
        }
        .ls-orbit-c {
          grid-column: 1 / -1;
        }
        .ls-video-seed {
          position: relative;
          grid-column: 1 / -1;
          width: auto;
          min-height: 0;
          top: auto;
          left: auto;
          order: -1;
        }
        .ls-device-caption {
          bottom: 12px;
          right: 12px;
          max-width: 180px;
        }
        .ls-chart-form > div {
          grid-template-columns: 1fr;
        }
        .ls-chart-form .ls-gold-button {
          width: 100%;
        }
        .ls-chart-shell {
          min-height: 0;
          padding: clamp(18px, 5vw, 28px);
        }
        .ls-lead-form { max-width: none; }
        .ls-sky-grid { grid-template-columns: 1fr; gap: 10px; }
        .ls-calc-grid { grid-template-columns: 1fr; }
        .ls-lead-row { grid-template-columns: 1fr; }
        .ls-planet-card { min-height: 0; padding: 11px; gap: 12px; }
        .ls-planet-orb { width: 42px; height: 42px; }
        .ls-planet-sign { font-size: 1.05rem; }
        .ls-planet-card small { font-size: 0.74rem; }
        .ls-sky-gate { padding: 18px 14px; }
        .ls-sky-gate form { grid-template-columns: 1fr; }
        .ls-sky-gate .ls-gold-button { width: 100%; }
      }
      @media (prefers-reduced-motion: reduce) {
        .ls-hero-backdrop-video {
          display: none;
        }
        .ls-parallax-band::before,
        .ls-hero-orbit,
        .ls-placeholder-core {
          transform: none !important;
        }
        .ls-orbit-a,
        .ls-orbit-b,
        .ls-orbit-c,
        .ls-solar-ring {
          animation: none !important;
        }
        .ls-reveal {
          opacity: 1 !important;
          transform: none !important;
          transition: none !important;
        }
        .ls-sky-grid--live > .ls-planet-card,
        .ls-sky-grid--live > .ls-element-card {
          animation: none !important;
        }
      }
    `}</style>
  );
}

function revealDelay(seconds: number): CSSProperties {
  return { ["--ls-delay" as string]: `${seconds}s` } as CSSProperties;
}

const heroLeadStyle = {
  color: C.cream,
  fontFamily: '"Newsreader", Georgia, serif',
  fontSize: "clamp(1.05rem, 2.1vw, 1.3rem)",
  fontWeight: 400,
  lineHeight: 1.5,
} as const;

const galleryCaptionStyle = {
  color: C.cream,
  fontFamily: '"Fraunces", Georgia, serif',
  fontSize: "clamp(1.65rem, 4.2vw, 3.2rem)",
  fontWeight: 500,
  lineHeight: 1.04,
  letterSpacing: 0,
} as const;

const heroTitleStyle = {
  color: C.cream,
  fontFamily: '"Fraunces", Georgia, serif',
  fontSize: "clamp(2.7rem, 8vw, 6.35rem)",
  fontWeight: 500,
  lineHeight: 0.92,
  letterSpacing: "-0.018em",
} as const;

const sectionTitleStyle = {
  color: C.cream,
  fontFamily: '"Fraunces", Georgia, serif',
  fontSize: "clamp(2.55rem, 6vw, 4.9rem)",
  fontWeight: 500,
  lineHeight: 0.98,
  letterSpacing: "-0.018em",
} as const;

const sectionBodyStyle = {
  color: C.creamDim,
  fontFamily: '"Newsreader", Georgia, serif',
  fontSize: "1.08rem",
  lineHeight: 1.74,
} as const;

const bodyStyle = {
  color: C.creamDim,
  fontFamily: '"Newsreader", Georgia, serif',
  fontSize: "0.98rem",
  lineHeight: 1.68,
} as const;

const smallBodyStyle = {
  color: C.muted,
  fontFamily: '"Newsreader", Georgia, serif',
  fontSize: "0.92rem",
  lineHeight: 1.62,
} as const;

const panelLeadStyle = {
  color: C.cream,
  fontFamily: '"Fraunces", Georgia, serif',
  fontSize: "1.42rem",
  fontWeight: 500,
  lineHeight: 1.18,
} as const;

const cardTitleStyle = {
  color: C.cream,
  fontFamily: '"Fraunces", Georgia, serif',
  fontSize: "1.92rem",
  fontWeight: 500,
  lineHeight: 1.06,
} as const;

const chartTitleStyle = {
  color: C.cream,
  fontFamily: '"Fraunces", Georgia, serif',
  fontSize: "clamp(2rem, 4vw, 3.2rem)",
  fontWeight: 500,
  lineHeight: 1,
} as const;

const smallTitleStyle = {
  color: C.cream,
  fontFamily: '"Fraunces", Georgia, serif',
  fontSize: "1.25rem",
  fontWeight: 500,
  lineHeight: 1.12,
} as const;

const faqTitleStyle = {
  color: C.cream,
  fontFamily: '"Fraunces", Georgia, serif',
  fontSize: "1.55rem",
  fontWeight: 500,
  lineHeight: 1.18,
} as const;

const whisperStyle = {
  color: C.creamDim,
  fontFamily: '"Fraunces", Georgia, serif',
  fontSize: "1.48rem",
  fontStyle: "italic",
  lineHeight: 1.42,
} as const;

const quoteStyle = {
  color: C.cream,
  fontFamily: '"Fraunces", Georgia, serif',
  fontSize: "1.65rem",
  fontStyle: "italic",
  lineHeight: 1.42,
} as const;

function eyebrowStyle(color: string) {
  return {
    color,
    fontFamily: '"Newsreader", Georgia, serif',
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
  };
}

export default ReadingsLanding;
