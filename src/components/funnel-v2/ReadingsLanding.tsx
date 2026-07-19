import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent, ReactNode, RefObject } from "react";
import { ArrowRight, Aperture, BookOpen, ChevronDown, MessageCircle, Mic, Moon, Volume2 } from "lucide-react";
import { animate, AnimatePresence, motion, useMotionTemplate, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import Lenis from "lenis";
import imageCompression from "browser-image-compression";
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
import { readResume, saveResume, patchResume, saveResumeIndex } from "@/lib/deckResume";
import { SIGN_LINES } from "./signLines";
import {
  DECK_PLANETS,
  DECK_L1,
  DECK_SEALED,
  DECK_READS,
  elementL1,
  ELEMENT_READS,
  SYNTH_LEAD,
  SUN_WANTS,
  MOON_NEEDS,
  SYNTH_CLOSE,
  signArticle,
  TEASE,
  counterLabel,
  makeSubject,
  capName,
  fill,
} from "./freeDeck";
import type { DeckPlanet, DeckElement, TeaseCopy } from "./freeDeck";
import { composeDeck } from "./deckCompose";
import { useLocalizedPrice } from "@/hooks/useLocalizedPrice";
import { getIntent, setIntent, INTENT_EVENT, type Intent } from "@/lib/intent";
import { trackSpine, trackSpineOnce, registerSetVia } from "@/lib/funnelSpine";
import { useNarration, prewarmNarration } from "@/components/narration/useNarration";
import { NarrationControl } from "@/components/narration/NarrationControl";
import { NarratedWords, narratedLineClass } from "@/components/narration/NarratedWords";
import type { NarrationBlock, NarrationHandle } from "@/components/narration/types";

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
  // STAR GOLD — Danny's ONE gold exception (approved 2026-07-16).
  // Scope: review-star FILLS and their drop-shadow ONLY. Never borders,
  // never text, never CTAs, never engraving chrome. Anchored on the
  // already-approved email gold #c4a265. Off/empty stars stay muted violet.
  starGoldHi: "#e8cf8f",
  starGoldMid: "#c4a265",
  starGoldLo: "#9a7b4f",
  starGoldGlow: "rgba(196, 162, 101, 0.28)",
};

/* ── SHARED SYSTEM (funnel-wide law, synth 2026-07-16) ─────────────────────
 * EASINGS — exactly three tokens, nothing else (linear only for ambient
 * drift/orbit):
 *   --ease-stage  cubic-bezier(0.22, 0.7, 0.2, 1)   staggers / pops / hovers
 *   --ease-settle cubic-bezier(0.16, 1, 0.3, 1)     arrivals / reveals / price-settle
 *   --ease-draw   cubic-bezier(0.4, 0, 0.2, 1)      stroke-dash + scaleX/Y draws
 *
 * HAIRLINE — the only divider language. 1px gradient:
 *   linear-gradient(90deg, transparent, rgba(154,126,230,0.22) 20%,
 *     rgba(154,126,230,0.22) 80%, transparent)
 *   bright variant rgba(185,165,240,0.35) for lit moments only
 *   (horizon, spotlight divider, seal bars).
 *
 * SMALLCAPS — two tiers only, all other tracking values normalize into them:
 *   LABEL  12.5-15px  Newsreader 600  letter-spacing 0.18em
 *   TAG    10-11.5px                  letter-spacing 0.22em
 *
 * SURFACES — three levels only, no fourth skin may be invented:
 *   sky    raw #0d0a14 with grain/wash (deck cards, sealed doors,
 *          spotlight review, rising, close)
 *   glass  linear-gradient(rgba(124,92,214,0.13), rgba(124,92,214,0.05))
 *          over #15101c + gradient border (drift review cards, Soul Bond bump)
 *   panel  linear-gradient(180deg, #181226, #140f1e) + mask-composite
 *          gradient hairline border (ledger card, checkout seal panel,
 *          memorial order panel)
 *
 * MOTION VERBS — four only: DRAW, SEAT, BREATHE, GLINT.
 * REDUCED-MOTION LAW — rest state IS the finished composition; every
 * animated class ships .is-static + prefers-reduced-motion overrides
 * in the same edit.
 * ─────────────────────────────────────────────────────────────────────── */

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
  // when the deck's synthesis card takes the stage and FreeDeck fires
  // "ls-reading-revealed", so #the-rest exists before the tease CTA is tapped.
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

  // Measurement spine: how this visit's register was decided. "url_param"
  // when a memorial-targeted link carried ?r=memorial; otherwise "default"
  // (organic arrival or a stored prior choice). User taps on the form's
  // here/memory field fire their own register_set. Analytics only.
  useEffect(() => {
    trackSpineOnce("register_set_load", "register_set", {
      value: getIntent() === "memorial" ? "memorial" : "discovery",
      via: registerSetVia(),
    });
  }, []);

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
      <ResumeStrip />
      <HeroSection />
      <CosmicBridge />
      <BirthSkyJourney />
      {revealed && (
        <>
          <FullReadingOpens />
          <ValueMoments />
          <CheckoutSection
            checkoutRef={checkoutRef}
            selectedPrice={selectedPrice}
            onSelectedPriceChange={setSelectedPrice}
          />
          <ReviewsWall />
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
    // Bottom margin is POSITIVE (pre-warm): a node starts fading in ~10% of
    // a viewport before it enters, so even a fast flick-scroller meets copy
    // that is already visible, never an empty screen (NN/g scroll-triggered
    // text finding). threshold 0 = the first pixel is enough.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "20000px 0px 10% 0px", threshold: 0 },
    );
    nodes.forEach((node) => io.observe(node));
    return () => io.disconnect();
  }, [pageRef, revealed]);
}

/* ── Resume strip ─────────────────────────────────────────────────────
   A quiet inline way back into an open reading. Shows only when a recovery
   snapshot exists (a chart was computed on a past visit or before a reload)
   and no deck is open yet. The tap asks BirthSkyJourney to restore
   ("ls-resume-request"); the strip steps aside the moment any deck opens
   ("ls-deck-open") or the restore lands/fails ("ls-resume-status"). On an
   error the form below is already prefilled and carries the message, so the
   strip simply retires. Not a modal, never blocks the page. */
function ResumeStrip() {
  const [snap] = useState(() => readResume());
  const [state, setState] = useState<"idle" | "busy" | "gone">("idle");
  useEffect(() => {
    const onStatus = (e: Event) => {
      const s = (e as CustomEvent).detail?.state;
      if (s === "busy") setState("busy");
      else if (s === "done" || s === "error") setState("gone");
    };
    const onOpen = () => setState("gone");
    window.addEventListener("ls-resume-status", onStatus);
    window.addEventListener("ls-deck-open", onOpen);
    return () => {
      window.removeEventListener("ls-resume-status", onStatus);
      window.removeEventListener("ls-deck-open", onOpen);
    };
  }, []);
  if (!snap || state === "gone") return null;
  return (
    <div className="ls-resume-wrap">
      <div className="ls-resume-strip" role="status">
        <p className="ls-resume-line">{snap.name ? `${capName(snap.name)}'s reading is still open.` : "Their reading is still open."}</p>
        <button
          type="button"
          className="ls-resume-btn"
          disabled={state === "busy"}
          aria-busy={state === "busy"}
          onClick={() => window.dispatchEvent(new Event("ls-resume-request"))}
        >
          {state === "busy" ? "Opening it now" : "Pick up where you left off"}
        </button>
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="ls-hero-section ls-parallax-band relative isolate min-h-[100svh] px-5 pb-24 pt-28 sm:pt-34 lg:flex lg:min-h-[920px] lg:items-center">
      <HeroBackdropVideo />
      <div className="ls-hero-veil absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_72%_10%,rgba(154,126,230,0.08),transparent_34%),radial-gradient(ellipse_at_12%_18%,rgba(94,70,122,0.16),transparent_30%),linear-gradient(100deg,rgba(8,6,11,0.76)_0%,rgba(8,6,11,0.44)_34%,rgba(8,6,11,0.08)_68%,rgba(8,6,11,0.10)_100%)]" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center">
        <div className="ls-hero-copy max-w-2xl">
          <h1 className="ls-reveal mt-5 text-balance" style={{ ...heroTitleStyle, ...revealDelay(0.08) }}>
            Until one has loved an animal, a part of one&rsquo;s soul remains asleep.
          </h1>
          {/* The birthday field is several screens down, so the hero needs a
              plain "there is more below" affordance. Quiet violet cue sits under
              the sub; its chevron drifts on a slow loop, and reduced motion
              stills it so it reads finished at rest. */}
          <button
            type="button"
            className="ls-hero-cue ls-reveal"
            style={revealDelay(0.28)}
            onClick={() => descendTo("#passage")}
            aria-label="Begin their reading"
          >
            <span className="ls-hero-cue-label">Begin</span>
            <ChevronDown className="ls-hero-cue-arrow" size={18} strokeWidth={1.7} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

/* The reading-path chooser used to sit here as its own top-of-page toggle,
   but a cold visitor missed it. The here/memory choice now lives ON the
   "Set the chart" form (the RegisterField in BirthSkyJourney), captured
   explicitly beside name / date / species and wired to the SAME ls_intent
   plumbing (setIntent), so the deck / sell / checkout register is unchanged
   downstream — only WHERE the choice is made moved. */

// The opening passage between the chooser and the "Set the chart" form is the
// C v2 momentum experience — see ./CosmicBridge.tsx (THE MAP EXISTS: violet
// thread + station nodes, whisper-to-huge peaks, real natal wheel drawn on
// scroll, the real moon arriving at the birth-sky beat).

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

// The compute holds ONLY as long as the real fetch (typically 1.5-2.5s). One
// line plus a live micro-ticker that ticks as the data lands, then it hands
// straight to the first card. No staged theatre, no artificial minimum: the
// real latency is the only suspense, and the readouts persist as the deck's
// chips instead of vanishing. The 8s abort + error line live upstream in the
// form handler, unchanged.
// Soft typo-catch for the compute moment: saying "31 years ago" out loud is
// the gentlest way to surface a year typo (1995 for 2015) without a form error.
function skyAgePhrase(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "";
  const then = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const now = new Date();
  let years = now.getFullYear() - then.getFullYear();
  const anniversary = new Date(now.getFullYear(), then.getMonth(), then.getDate());
  if (now < anniversary) years -= 1;
  if (years < 1) return "less than a year ago";
  if (years === 1) return "a year ago";
  return `${years} years ago`;
}

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
  // The compute moment is a real MOMENT: a staged "reading the sky" sequence
  // that always holds to a premium minimum before it hands into the deck, even
  // when the fetch returns in a blink. The reveal is gated on BOTH the minimum
  // having elapsed AND the real chart being present, so the deck is NEVER shown
  // before the data exists; a slow fetch simply extends the calm holding state
  // until it lands.
  const MIN_MS = reduce ? 620 : 4000;   // the floor the animation holds to
  const SETTLE_MS = reduce ? 220 : 660; // the closing "sky is set" beat

  // Wall-clock start, set once on first render.
  const startRef = useRef(0);
  if (startRef.current === 0) {
    startRef.current = typeof performance !== "undefined" ? performance.now() : Date.now();
  }
  const nowMs = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

  const chartReady = !!chart;
  const [stage, setStage] = useState(0);                      // staged copy 0..3
  const [phase, setPhase] = useState<"run" | "settle">("run");

  // Staged-copy ticker: advances the headline through its beats on a timer,
  // independent of the fetch, so the sequence reads one line at a time. Held
  // still under reduced motion (one calm line, no churn).
  useEffect(() => {
    if (reduce) return;
    const marks = [1150, 2100, 2950, 3650];
    const timers = marks.map((m, i) => window.setTimeout(() => setStage(i + 1), m));
    return () => timers.forEach((t) => clearTimeout(t));
  }, [reduce]);

  // Enter the closing settle ONLY once the chart is here AND the minimum has
  // elapsed. If the chart is slower than the floor, this waits for it (the
  // holding state keeps running); if faster, it holds to the floor.
  useEffect(() => {
    if (!chartReady || phase !== "run") return;
    const wait = Math.max(0, MIN_MS - (nowMs() - startRef.current));
    const t = window.setTimeout(() => setPhase("settle"), wait);
    return () => clearTimeout(t);
  }, [chartReady, phase, MIN_MS]);

  // The settle beat plays, then the deck is revealed.
  useEffect(() => {
    if (phase !== "settle") return;
    const t = window.setTimeout(onDone, SETTLE_MS);
    return () => clearTimeout(t);
  }, [phase, onDone, SETTLE_MS]);

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

  const dateLabel = useMemo(() => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (!m) return "that date";
    const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${Number(m[3])} ${MON[Number(m[2]) - 1]} ${m[1]}`;
  }, [date]);

  // Echo the chosen date AND how long ago it was, so a year typo is caught
  // here, before it silently sets the wrong sky.
  const agePhrase = useMemo(() => skyAgePhrase(date), [date]);
  const dateEcho = agePhrase ? `${dateLabel}, ${agePhrase}` : dateLabel;

  const who = name ? `${capName(name)}'s` : "Their";
  const LINES = [
    `Reading the sky over ${dateEcho}.`,
    "Placing the Sun, then the Moon.",
    "Measuring the angles between them.",
    "Letting the planets settle.",
  ];
  const line = phase === "settle" ? `${who} sky is set.` : LINES[Math.min(stage, LINES.length - 1)];
  // Key so React remounts the line on each beat, replaying its blur/rise reveal.
  const lineKey = phase === "settle" ? "set" : String(Math.min(stage, LINES.length - 1));

  // The zodiac wheel's 12 house ticks, drawn once and shared by both paths.
  const wheelTicks = Array.from({ length: 12 }).map((_, i) => {
    const a = (i * 30 - 90) * (Math.PI / 180);
    const x1 = +(100 + 78 * Math.cos(a)).toFixed(2);
    const y1 = +(100 + 78 * Math.sin(a)).toFixed(2);
    const x2 = +(100 + 88 * Math.cos(a)).toFixed(2);
    const y2 = +(100 + 88 * Math.sin(a)).toFixed(2);
    return (
      <line key={i} className="ls-cw-tick" x1={x1} y1={y1} x2={x2} y2={y2} style={{ animationDelay: `${0.55 + i * 0.05}s` }} />
    );
  });

  // Reduced motion: a calm, quick, non-animated version. The wheel is drawn
  // whole (no draw-in), nothing spins, the copy simply reads the two states.
  if (reduce) {
    return (
      <div className="ls-compute" role="status" aria-live="polite" data-phase={phase}>
        <div className="ls-compute-dust" aria-hidden="true" />
        <div className="ls-compute-aura" aria-hidden="true" />
        <div className="ls-compute-instrument is-static" aria-hidden="true">
          <svg className="ls-compute-wheel" viewBox="0 0 200 200">
            <circle className="ls-cw-draw" cx="100" cy="100" r="86" />
            {wheelTicks}
            <circle className="ls-cw-inner" cx="100" cy="100" r="52" />
          </svg>
          <span className="ls-compute-core is-lit" />
        </div>
        <div className="ls-compute-copy">
          <p className="ls-compute-line">{line}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ls-compute" role="status" aria-live="polite" data-phase={phase}>
      <div className="ls-compute-dust" aria-hidden="true" />
      <div className="ls-compute-aura" aria-hidden="true" />
      <div className={`ls-compute-instrument${phase === "settle" ? " is-settle" : ""}`} aria-hidden="true">
        {/* The zodiac wheel drawing itself in. */}
        <svg className="ls-compute-wheel" viewBox="0 0 200 200">
          <circle className="ls-cw-draw" cx="100" cy="100" r="86" />
          {wheelTicks}
          <circle className="ls-cw-inner" cx="100" cy="100" r="52" />
        </svg>
        {/* Orbits, each carrying a planet that settles onto its ring. */}
        <span className="ls-compute-ring ls-compute-ring-1"><span className="ls-cr-orbit"><i /></span></span>
        <span className="ls-compute-ring ls-compute-ring-2"><span className="ls-cr-orbit"><i /></span></span>
        <span className="ls-compute-ring ls-compute-ring-3"><span className="ls-cr-orbit"><i /></span></span>
        <span className="ls-compute-sweep" />
        <span className="ls-compute-core" />
      </div>
      <div className="ls-compute-copy">
        <p className="ls-compute-line" key={lineKey}>{line}</p>
      </div>
      <div className="ls-compute-chips" aria-hidden="true">
        <span className={`ls-cchip${stage >= 1 ? " is-on" : ""}`}>Sun</span>
        <span className={`ls-cchip${stage >= 2 ? " is-on" : ""}`}>Moon</span>
        <span className={`ls-cchip${stage >= 3 ? " is-on" : ""}`}>{chartReady ? `${aspectCount} angles` : "angles"}</span>
      </div>
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

// ---------------------------------------------------------------------------
// THE FREE READING DECK (Danny-approved redesign, 2026-07-14): a full-viewport
// tap-advance card deck replaces the scroll ceremony. Eight cards after the
// compute: Sun, Moon, Venus, Mercury, Mars, the element balance, the
// synthesis, then the tease + handoff. Every card leads with the fact at
// frame 0 (sign chip + degree count-up), then the three-line law: NAME IT
// (fixed planet frame), MEAN IT (the sign-true read), USE IT (the takeaway),
// with the sealed-depth footer beneath. The reader sets the tempo: tap,
// swipe, wheel, or arrow keys; the left edge and a quiet chevron go back.
// Copy lives in ./freeDeck.ts, approved verbatim in both voices.
// COLOUR LAW (Danny): cosmic purple + white only. No gold.
// Reduced motion renders all eight cards as a static column, in order.
// "ls-reading-revealed" fires when the synthesis card takes the stage, so
// the lower funnel is mounted before the tease CTA is tapped.
// ---------------------------------------------------------------------------

const SIGN_ELEMENT: Record<string, DeckElement> = {
  Aries: "Fire", Leo: "Fire", Sagittarius: "Fire",
  Taurus: "Earth", Virgo: "Earth", Capricorn: "Earth",
  Gemini: "Air", Libra: "Air", Aquarius: "Air",
  Cancer: "Water", Scorpio: "Water", Pisces: "Water",
};

const DECK_LABEL: Record<DeckPlanet, string> = {
  sun: "The Sun", moon: "The Moon", venus: "Venus", mercury: "Mercury", mars: "Mars",
};

// Real full-disc photos only, and only on their own cards. The Sun's real
// SDO disc lives under /readings/sun (there is no planets-nasa sun asset).
const DECK_PHOTO: Record<DeckPlanet, string> = {
  sun: "/readings/sun/sun-amber.png?v=1",
  moon: "/readings/planets-nasa/moon.png",
  venus: "/readings/planets-nasa/venus.png",
  mercury: "/readings/planets-nasa/mercury.png",
  mars: "/readings/planets-nasa/mars.png",
};

const TEASE_GLYPH: Record<string, string> = {
  Saturn: "saturn", Chiron: "chiron", Jupiter: "jupiter", Pluto: "pluto",
  "North Node": "northNode", Uranus: "uranus", Neptune: "neptune", Lilith: "lilith",
};

type DeckCard =
  | { kind: "keepsake"; photoUrl: string; name: string | null }
  /* A planet card carries EITHER the engine anatomy (fact + teaching + beats
     + law, composed from the real chart by deckCompose) OR the legacy static
     anatomy (beats + tell) as the always-safe fallback. beats holds the hero
     line in both shapes; sealed holds the drawer line in both shapes. */
  | { kind: "planet"; key: DeckPlanet; sign: string; deg: number | null; essence: string; l1?: string; teach?: string; sky?: string; love?: string; beats?: string; tell?: string; sealed: string; count: number }
  | { kind: "element"; counts: Record<DeckElement, number>; byElement: Record<DeckElement, DeckPlanet[]>; dominant: DeckElement; teach?: string; sky?: string; love?: string; sealed?: string; l1?: string; beats?: string; tell?: string }
  | { kind: "synthesis"; lead: string; wants: string; needs: string; close: string }
  /* The chart-signature revelation card: the engine's top storyline that no
     planet card has already told, rendered from the signature templates. */
  | { kind: "signature"; teach: string; fact: string; meaning: string; behaviour: string; law: string; sealed: string }
  | { kind: "tease"; copy: TeaseCopy };

// The planet-in-sign hook is one sentence: "Monty's Sun sits in Cancer, the
// self under everything." The card also shows the sign as a graphic chip, so we
// split the essence clause off to sit as a small caption under the chip and
// keep the full sentence as the reading's opening line.
const PLANET_ESSENCE: Record<DeckPlanet, string> = {
  sun: "The self under everything",
  moon: "What settles them",
  venus: "How they love you back",
  mercury: "How they reach for you",
  mars: "Where the energy goes",
};

function buildDeck(
  chart: PetBirthChart,
  memorial: boolean,
  subject: { name?: string | null; species?: string | null; gender?: string | null },
  keepsake?: { photoUrl: string; name: string | null } | null,
  birthDate?: string | null,
): DeckCard[] {
  const voice = memorial ? ("m" as const) : ("d" as const);
  const S = makeSubject(subject.name, subject.species, subject.gender);
  const cards: DeckCard[] = [];
  let count = 0;

  // The real astrology engine + the gated pools. Every composed card is
  // guard-checked inside composeDeck (no placeholder ever renders); any
  // planet it cannot compose stays undefined and that card falls back to
  // the legacy static entry below. The seed keeps pool picks stable per
  // pet and different across pets.
  const composed = composeDeck({
    raw: chart,
    voice,
    species: subject.species,
    subject: S,
    seed: `${(subject.name || "").trim().toLowerCase()}|${birthDate || ""}`,
  });

  // A photo NEVER pushes the Sun off the opening card. The reading always opens
  // on the Sun (the self under everything); if they added a photo, their own
  // face rides in as the warm held-image beat right before the keep bridge (see
  // the keepsake push below the synthesis). No photo = that card is never built,
  // so the deck degrades to the chart-only close with nothing missing.
  for (const key of DECK_PLANETS) {
    const body = chart[key] as ChartBody | undefined;
    const sign = body?.sign;
    const entry = sign ? DECK_READS[key][sign] : undefined;
    if (!sign || !entry) continue;
    count += 1;
    const deg = typeof body?.degree === "number" ? Math.round(body.degree) : null;
    const engine = composed.planets[key];
    if (engine && deg != null) {
      // THE FOUR BEATS (approved draft): teach (the canonical planet line),
      // sky (the real chart fact, numbers injected), love (the recognition),
      // seal (the locked-door device, keyed to a real sealed body).
      cards.push({
        kind: "planet",
        key,
        sign,
        deg,
        essence: PLANET_ESSENCE[key],
        teach: engine.teach,
        sky: engine.sky,
        love: engine.love,
        sealed: engine.seal,
        count,
      });
      continue;
    }
    // LEGACY ANATOMY: the static freeDeck entry, unchanged.
    cards.push({
      kind: "planet",
      key,
      sign,
      deg,
      essence: PLANET_ESSENCE[key],
      l1: fill(DECK_L1[key](sign), S),
      beats: fill(entry.beats[voice], S),
      tell: fill(entry.tell[voice], S),
      sealed: fill(DECK_SEALED[key][voice], S),
      count,
    });
  }

  // Element balance, counted over the five personal planets (the honest
  // date-only set). The dominant element is the card.
  const counts: Record<DeckElement, number> = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
  const byElement: Record<DeckElement, DeckPlanet[]> = { Fire: [], Earth: [], Air: [], Water: [] };
  for (const key of DECK_PLANETS) {
    const sign = (chart[key] as ChartBody | undefined)?.sign;
    const el = sign ? SIGN_ELEMENT[sign] : undefined;
    if (el) {
      counts[el] += 1;
      byElement[el].push(key);
    }
  }
  const dominant = (Object.keys(counts) as DeckElement[]).reduce((a, b) => (counts[b] > counts[a] ? b : a));
  if (counts[dominant] > 0) {
    if (composed.element) {
      // THE FOUR BEATS: teach / their sky (the real lean + scarcest element)
      // / the love / the locked door, composed from the true counts.
      cards.push({
        kind: "element",
        counts,
        byElement,
        dominant,
        teach: composed.element.teach,
        sky: composed.element.sky,
        love: composed.element.love,
        sealed: composed.element.seal,
      });
    } else {
      // LEGACY ANATOMY: the static freeDeck entry, unchanged.
      cards.push({
        kind: "element",
        counts,
        byElement,
        dominant,
        l1: fill(elementL1(counts[dominant], dominant), S),
        beats: fill(ELEMENT_READS[dominant].beats[voice], S),
        tell: fill(ELEMENT_READS[dominant].tell[voice], S),
      });
    }
  }

  // The revelation card: the chart signature (the engine's strongest
  // storyline not already told by a planet card). When the engine cannot
  // compose one (missing degrees, pool gap), the legacy Sun-wants /
  // Moon-needs synthesis holds the slot so the deck never loses its turn.
  if (composed.signature) {
    cards.push({
      kind: "signature",
      teach: composed.signature.teach,
      fact: composed.signature.fact,
      meaning: composed.signature.meaning,
      behaviour: composed.signature.behaviour,
      law: composed.signature.law,
      sealed: composed.signature.seal,
    });
  } else {
    const sunSign = chart.sun?.sign;
    const moonSign = chart.moon?.sign;
    if (sunSign && moonSign && SUN_WANTS[sunSign] && MOON_NEEDS[moonSign]) {
      cards.push({
        kind: "synthesis",
        lead: SYNTH_LEAD,
        wants: `${signArticle(sunSign)} ${sunSign} Sun wants ${SUN_WANTS[sunSign]}.`,
        needs: `${signArticle(moonSign)} ${moonSign} Moon needs ${MOON_NEEDS[moonSign]}.`,
        close: fill(SYNTH_CLOSE[voice], S),
      });
    }
  }

  // Their own face, framed in violet, as the reading's warm held-image close,
  // right before the keep bridge. Only built when a photo was added; the Sun
  // still owns the opening card either way.
  if (keepsake?.photoUrl) {
    cards.push({ kind: "keepsake", photoUrl: keepsake.photoUrl, name: keepsake.name });
  }

  const teaseCopy = TEASE[voice];
  cards.push({ kind: "tease", copy: { ...teaseCopy, keep: fill(teaseCopy.keep, S), bridge: fill(teaseCopy.bridge, S) } });
  return cards;
}

// The engraved chart wheel behind each planet card (spec-0, 2026-07-16): a
// 1px violet ring with 30 degree ticks (one per degree of the sign, every
// 5th longer), and ONE lit tick at the body's true degree. The NASA disc
// rides the rim at that same angle via .ls-dk-orbit (natural colour: the
// violet instrument chrome frames the photo as data). deg null = no lit
// tick, disc seated at 12 o'clock. Angles run clockwise from 12.
const WHEEL_VB = 220;
const WHEEL_R = 104; // rim radius; orb top inset = (110-104)/220 = 2.727%
const WHEEL_C = 2 * Math.PI * WHEEL_R; // ring circumference for the draw
function DeckWheel({ deg }: { deg: number | null }) {
  const c = WHEEL_VB / 2;
  const ticks: JSX.Element[] = [];
  for (let i = 0; i < 30; i++) {
    const a = ((i * 12 - 90) * Math.PI) / 180;
    const len = i % 5 === 0 ? 7 : 4;
    ticks.push(
      <line
        key={i}
        x1={(c + Math.cos(a) * (WHEEL_R - 2)).toFixed(2)}
        y1={(c + Math.sin(a) * (WHEEL_R - 2)).toFixed(2)}
        x2={(c + Math.cos(a) * (WHEEL_R - 2 - len)).toFixed(2)}
        y2={(c + Math.sin(a) * (WHEEL_R - 2 - len)).toFixed(2)}
        opacity={i % 5 === 0 ? 0.3 : 0.18}
      />,
    );
  }
  let lit: JSX.Element | null = null;
  if (deg != null) {
    const a = (((deg / 30) * 360 - 90) * Math.PI) / 180;
    lit = (
      <line
        className="ls-dk-wheel-lit"
        x1={(c + Math.cos(a) * (WHEEL_R - 1)).toFixed(2)}
        y1={(c + Math.sin(a) * (WHEEL_R - 1)).toFixed(2)}
        x2={(c + Math.cos(a) * (WHEEL_R - 11)).toFixed(2)}
        y2={(c + Math.sin(a) * (WHEEL_R - 11)).toFixed(2)}
      />
    );
  }
  return (
    <svg className="ls-dk-wheel" viewBox={`0 0 ${WHEEL_VB} ${WHEEL_VB}`} aria-hidden="true">
      <circle className="ls-dk-wheel-ring" cx={c} cy={c} r={WHEEL_R} style={{ strokeDasharray: WHEEL_C.toFixed(1) }} />
      <g className="ls-dk-wheel-ticks" stroke="#b9a5f0" strokeWidth="1">{ticks}</g>
      {lit}
    </svg>
  );
}

// A tiny bespoke seal mark for the sealed-depth footers: same stroke language
// as the astro glyph set, no stock icon.
function SealMark() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5.6" y="10.6" width="12.8" height="8.8" rx="2.4" />
      <path d="M8.6 10.6V8.2a3.4 3.4 0 0 1 6.8 0v2.4" />
    </svg>
  );
}

// One-tap species picks for the free reading. Dog and cat carry their own
// reading voice; "other" keeps every fish, bird and rabbit welcome. Breed and
// gender stay in the paid intake, where the friction is earned.
const SPECIES_PICKS: { value: string; label: string }[] = [
  { value: "dog", label: "Dog" },
  { value: "cat", label: "Cat" },
  { value: "other", label: "Other" },
];

// Bespoke "add a photo" mark in the same stroke language as SealMark and the
// astro glyphs, so the upload never leans on a stock/clip-art icon.
function PhotoMark() {
  return (
    <svg className="ls-photo-mark" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.2" y="5" width="17.6" height="14" rx="2.6" />
      <circle cx="8.5" cy="10.2" r="1.7" />
      <path d="M3.8 17.4l4.6-4.3a2 2 0 0 1 2.7 0l2.9 2.7m-1.1-1l2-1.9a2 2 0 0 1 2.7 0l1.6 1.5" />
    </svg>
  );
}

// The reading, as ordered voice blocks. Each id matches the paragraph it reads,
// so the highlight lands on the right line. Empty fields drop out cleanly.
function deckCardBlocks(card: DeckCard): NarrationBlock[] {
  const mk = (id: string, text?: string | null): NarrationBlock[] =>
    text && text.trim() ? [{ id, text }] : [];
  switch (card.kind) {
    case "planet":
      // The four beats read teach -> sky -> love -> seal; the legacy anatomy
      // (l1/beats/tell, no teach/sky/love) keeps its original order.
      return [
        ...mk("teach", card.teach),
        ...mk("l1", card.l1),
        ...mk("sky", card.sky),
        ...mk("beats", card.beats),
        ...mk("tell", card.tell),
        ...mk("love", card.love),
        ...mk("sealed", card.sealed),
      ];
    case "element":
      return [
        ...mk("teach", card.teach),
        ...mk("l1", card.l1),
        ...mk("sky", card.sky),
        ...mk("beats", card.beats),
        ...mk("tell", card.tell),
        ...mk("love", card.love),
        ...mk("sealed", card.sealed),
      ];
    case "synthesis":
      return [...mk("lead", card.lead), ...mk("wants", card.wants), ...mk("needs", card.needs), ...mk("close", card.close)];
    case "signature":
      // Beat 3 is meaning + behaviour; the law line stays composed but off
      // the card so the seal bar always fits a phone viewport.
      return [...mk("teach", card.teach), ...mk("fact", card.fact), ...mk("meaning", card.meaning), ...mk("behaviour", card.behaviour), ...mk("sealed", card.sealed)];
    case "tease":
      return [...mk("keep", card.copy.keep), ...mk("deeper", card.copy.deeper), ...mk("rising", card.copy.rising), ...mk("love", card.copy.love), ...mk("bridge", card.copy.bridge)];
    default:
      return [];
  }
}

type PlanetDeckCard = Extract<DeckCard, { kind: "planet" }>;

// The staged planet card: the reading arrives ONE MOMENT AT A TIME, and a quiet
// camera pans down to keep the moment that just landed centred. So the reader
// always sees the placement land first, then the discovery, then the behaviour,
// then the seal — never a wall of six blocks, and nothing ever clipped off the
// bottom however long the copy runs. The deck's own advance paths (tap, swipe,
// wheel, keys, Next/Back) are untouched: they still turn cards. Narration is
// untouched too — when the voice plays, every moment is shown and the camera
// follows the line being read. Reduced motion shows all four at rest, no pan.
function StagedPlanet({ card, nar, reduce }: { card: PlanetDeckCard; nar: NarrationHandle; reduce: boolean }) {
  const lc = (id: string, base: string) => narratedLineClass(id, nar, base);
  const angle = card.deg != null ? (card.deg / 30) * 360 : 0;
  const engine = !!card.sky;

  const innerRef = useRef<HTMLDivElement>(null);
  const momentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const userTookRef = useRef(false); // once the reader scrolls, the auto-follow stands down
  const doneRef = useRef(reduce);

  // Which moments exist, in reveal order (the discovery only when there is a fact).
  const order = useMemo(() => (engine ? [1, 2, 3, 4] : [1, 3, 4]), [engine]);
  const total = order.length;
  const [shown, setShown] = useState(reduce ? total : 0);

  const blockMoment = (id: string | null | undefined): number => {
    if (id === "teach" || id === "l1") return 1;
    if (id === "sky") return 2;
    if (id === "love" || id === "beats" || id === "tell") return 3;
    return 4; // sealed
  };

  // The card is its own native scroll frame. The reveal follows each new moment
  // by SCROLLING it (never a transform), so at any point the reader can grab the
  // card and read every beat, up or down, with real momentum. Once they take
  // hold (userTook), the auto-follow steps back and leaves the scroll to them.
  const scrollToMoment = useCallback((moment: number, behavior: ScrollBehavior, force = false) => {
    if (userTookRef.current && !force) return;
    const inner = innerRef.current;
    const el = momentRefs.current[moment];
    if (!inner || !el) return;
    if (inner.scrollHeight <= inner.clientHeight + 2) return; // fits: nothing to follow
    const ir = inner.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    const center = er.top - ir.top + inner.scrollTop + er.height / 2;
    const top = Math.max(0, center - inner.clientHeight * 0.42);
    inner.scrollTo({ top, behavior });
  }, []);

  // The settle: once the last moment has landed, bring the closing law + seal
  // fully to rest at the base (earlier, already-read moments ride up off the
  // top). If the whole stack fits the card it stays centred by layout, so there
  // is never a void beneath it.
  const settleColumn = useCallback((behavior: ScrollBehavior) => {
    if (userTookRef.current) return;
    const inner = innerRef.current;
    if (!inner) return;
    if (inner.scrollHeight <= inner.clientHeight + 2) return; // fits: centred by layout
    const kids = Array.from(inner.children) as HTMLElement[];
    const lastEl = kids[kids.length - 1];
    if (!lastEl) return;
    const ir = inner.getBoundingClientRect();
    const lr = lastEl.getBoundingClientRect();
    const lastBottom = lr.bottom - ir.top + inner.scrollTop;
    const top = Math.max(0, lastBottom - inner.clientHeight + 6);
    inner.scrollTo({ top, behavior });
  }, []);

  // Auto-play the moments; once the last has landed (or the voice takes over),
  // everything stays shown so a tap can move on to the next card at any time.
  useEffect(() => {
    if (reduce || nar.isActive || doneRef.current) {
      setShown(total);
      doneRef.current = doneRef.current || reduce || nar.isActive;
      return;
    }
    userTookRef.current = false;
    if (innerRef.current) innerRef.current.scrollTop = 0;
    setShown(0);
    const times = [140, 1500, 3050, 4550];
    const timers = order.map((_, i) =>
      window.setTimeout(() => {
        setShown(i + 1);
        if (i === order.length - 1) doneRef.current = true;
      }, times[Math.min(i, times.length - 1)]),
    );
    return () => timers.forEach((t) => clearTimeout(t));
  }, [card, reduce, order, total, nar.isActive]);

  // The reader taking hold of the scroll stands the auto-follow down. Only a
  // real input gesture counts (wheel / touch); the reveal's own smooth scroll
  // fires no such event, so it never trips this.
  useEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;
    const mark = () => { userTookRef.current = true; };
    inner.addEventListener("wheel", mark, { passive: true });
    inner.addEventListener("touchmove", mark, { passive: true });
    return () => {
      inner.removeEventListener("wheel", mark);
      inner.removeEventListener("touchmove", mark);
    };
  }, []);

  // After each auto reveal, follow the newest moment; on the last, settle the
  // whole column to rest so the seal seats fully in view (kills the dead void).
  useLayoutEffect(() => {
    if (reduce || nar.isActive || shown < 1) return;
    const isFinal = shown >= total;
    const moment = order[shown - 1];
    const id = requestAnimationFrame(() => { if (isFinal) settleColumn("smooth"); else scrollToMoment(moment, "smooth"); });
    return () => cancelAnimationFrame(id);
  }, [shown, total, reduce, order, scrollToMoment, settleColumn, nar.isActive]);

  // Voice playing: it re-takes the scroll and follows the line being read.
  useLayoutEffect(() => {
    if (reduce || !nar.isActive) return;
    userTookRef.current = false;
    const moment = blockMoment(nar.activeBlockId);
    const id = requestAnimationFrame(() => scrollToMoment(moment, "smooth", true));
    return () => cancelAnimationFrame(id);
  }, [nar.isActive, nar.activeBlockId, reduce, scrollToMoment]);

  const setRef = (n: number) => (el: HTMLDivElement | null) => { momentRefs.current[n] = el; };
  const on = (moment: number) => (shown >= order.indexOf(moment) + 1 ? " is-shown" : "");

  return (
    <div ref={innerRef} className={`ls-dk-inner ls-dk-pl ls-dk-staged${engine ? " is-engine" : ""}`}>
      {/* MOMENT 1 — the placement lands alone */}
      <div ref={setRef(1)} className={`ls-dk-m ls-dk-m1${on(1)}`}>
        <div className="ls-dk-plate">
          <DeckWheel deg={card.deg} />
          <div className="ls-dk-orbit" style={{ "--dk-angle": `${angle.toFixed(2)}deg` } as React.CSSProperties} aria-hidden="true">
            <div className="ls-dk-orb">
              <span className="ls-dk-halo" />
              <img src={DECK_PHOTO[card.key]} alt="" draggable={false} />
            </div>
          </div>
          <div className="ls-dk-lockup">
            <p className="ls-dk-eyebrow">
              <span className="ls-dk-eyelabel">
                <AstroGlyph name={card.key} className="ls-dk-glyphmark" />
                {DECK_LABEL[card.key]}
              </span>
              <span className="ls-dk-count">{counterLabel(card.count)}</span>
            </p>
            <div className="ls-dk-chipwrap">
              <p className="ls-dk-chip">
                {card.sign}
                {card.deg != null && (
                  <span className="ls-dk-deg"> <DegCount value={card.deg} reduce={reduce} />°</span>
                )}
              </p>
            </div>
          </div>
        </div>
        {engine ? (
          <p className={lc("teach", "ls-dk-l1")}><NarratedWords blockId="teach" text={card.teach} nar={nar} /></p>
        ) : (
          <p className={lc("l1", "ls-dk-l1")}><NarratedWords blockId="l1" text={card.l1} nar={nar} /></p>
        )}
      </div>

      {/* MOMENT 2 — THEIR SKY: the real chart fact, numbers injected */}
      {engine && (
        <div ref={setRef(2)} className={`ls-dk-m ls-dk-m2${on(2)}`}>
          <p className="ls-dk-mlabel">Their sky</p>
          <p className={lc("sky", "ls-dk-fact")}><NarratedWords blockId="sky" text={card.sky} nar={nar} /></p>
        </div>
      )}

      {/* MOMENT 3 — THE LOVE: the recognition beat, the card's warm heart */}
      <div ref={setRef(3)} className={`ls-dk-m ls-dk-m3${on(3)}`}>
        {engine ? (
          <>
            <p className="ls-dk-mlabel">The love</p>
            <p className={lc("love", "ls-dk-beats")}><NarratedWords blockId="love" text={card.love} nar={nar} /></p>
          </>
        ) : (
          <>
            <p className={lc("beats", "ls-dk-beats")}><NarratedWords blockId="beats" text={card.beats} nar={nar} /></p>
            {card.tell && (
              <p className={lc("tell", "ls-dk-tell")}><span className="ls-dk-tell-mark" aria-hidden="true" /><NarratedWords blockId="tell" text={card.tell} nar={nar} /></p>
            )}
          </>
        )}
      </div>

      {/* MOMENT 4 — THE LOCKED DOOR */}
      <div ref={setRef(4)} className={`ls-dk-m ls-dk-m4${on(4)}`}>
        <div className="ls-dk-sealbar">
          <SealMark />
          <p className={lc("sealed", "ls-dk-sealtext")}><NarratedWords blockId="sealed" text={card.sealed} nar={nar} /></p>
          <span className="ls-dk-sealtag">In the full reading</span>
        </div>
      </div>
    </div>
  );
}

function DeckCardBody({ card, reduce, floating = false, showNext = false, showBack = false, nudge = false, onNext, onBack }: { card: DeckCard; reduce: boolean; floating?: boolean; showNext?: boolean; showBack?: boolean; nudge?: boolean; onNext?: () => void; onBack?: () => void }) {
  const blocks = useMemo(() => deckCardBlocks(card), [card]);
  const nar = useNarration(blocks);
  const lc = (id: string, base: string) => narratedLineClass(id, nar, base);
  const control = blocks.length > 0 ? (
    <NarrationControl nar={nar} idleLabel="Hear it read to you" playingLabel="Reading aloud" failedLabel="Try the voice again" />
  ) : null;

  // The card-anchored control row: one grouped cluster under the reading, in a
  // reserved band so it never lands on the sealed footer the way the old
  // floating chrome did. Reading left to right: a quiet ghost Back, the hear
  // affordance, then the obvious violet Next pill (the primary action, gently
  // breathing when idle). It rides WITH the card, never pinned to the far
  // viewport edge. The tease is its own terminal card, so it keeps its own CTA.
  const footer =
    floating && card.kind !== "tease" ? (
      <div className="ls-dk-footer">
        {showBack && onBack && (
          <button
            type="button"
            className="ls-dk-nav ls-dk-nav-back"
            onClick={(e) => { e.stopPropagation(); onBack(); }}
            aria-label="Back one card"
          >
            <CtrlPrev />
          </button>
        )}
        {control && <div className="ls-dk-hear-foot">{control}</div>}
        {showNext && onNext && (
          <button
            type="button"
            className={`ls-dk-nav ls-dk-nav-next${nudge ? " is-nudge" : ""}`}
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            aria-label="Next card"
          >
            <span className="ls-dk-nav-label">Next</span>
            <CtrlNext />
          </button>
        )}
      </div>
    ) : null;

  const wrap = (inner: JSX.Element) => {
    if (floating) {
      return (
        <>
          {inner}
          {footer}
        </>
      );
    }
    if (!control) return inner;
    return (
      <>
        {inner}
        <div className="ls-dk-hear-static">{control}</div>
      </>
    );
  };

  if (card.kind === "keepsake") {
    return (
      <>
        <div className="ls-dk-inner ls-dk-keep-inner">
          <div className="ls-dk-frame">
            <span className="ls-dk-frame-glow" aria-hidden="true" />
            <span className="ls-dk-frame-mask">
              <img src={card.photoUrl} alt={card.name ? capName(card.name) : "Their photo"} draggable={false} />
            </span>
            <span className="ls-dk-frame-ring" aria-hidden="true" />
          </div>
          {card.name && <p className="ls-dk-keepname">{capName(card.name)}</p>}
        </div>
        {footer}
      </>
    );
  }

  if (card.kind === "planet") {
    // The staged plate is its own component so the camera-follow reveal can own
    // its refs and timers without disturbing the deck. See StagedPlanet.
    return wrap(<StagedPlanet card={card} nar={nar} reduce={reduce} />);
  }

  if (card.kind === "element") {
    // THE FOUR HOUSES (spec-0): the five personal planets physically sorted
    // into four element columns. Sun and Mercury STANDING in Air is the chart;
    // no widget bars. Dominant column lit, empty column dimmed to a dot.
    const order: DeckElement[] = ["Fire", "Earth", "Air", "Water"];
    const domCount = card.counts[card.dominant];
    const tied = order.filter((e) => e !== card.dominant && card.counts[e] === domCount);
    const domLabel =
      tied.length > 0 ? `${card.dominant} and ${tied[0]}` : domCount >= 3 ? `Mostly ${card.dominant}` : `Led by ${card.dominant}`;
    let chipIdx = 0;
    const elEngine = !!card.sky;
    return wrap(
      <div className="ls-dk-inner ls-dk-el">
        <p className="ls-dk-eyebrow ls-dk-el-eyebrow">The balance of them</p>
        {elEngine && (
          <p className={lc("teach", "ls-dk-l1 ls-dk-el-teach")}><NarratedWords blockId="teach" text={card.teach} nar={nar} /></p>
        )}
        {/* Engine decks: the columns show the FIVE met planets while the
            composed sentence weighs all ten, so the header scopes the visual
            instead of making a second, possibly clashing lean claim. */}
        <p className="ls-dk-el-dom">{elEngine ? "The five you have met, by element" : domLabel}</p>
        <div className="ls-dk-houses">
          {order.map((el) => {
            const planets = card.byElement[el];
            const isDom = card.counts[el] === domCount && card.counts[el] > 0;
            const cls = `ls-dk-house${isDom ? " is-dom" : ""}${planets.length === 0 ? " is-empty" : ""}${planets.length >= 4 ? " is-many" : ""}`;
            return (
              <div key={el} className={cls}>
                <span className="ls-dk-house-name">{el}</span>
                <span className="ls-dk-house-chips">
                  {planets.length === 0 ? (
                    <i className="ls-dk-house-dot" aria-hidden="true" />
                  ) : (
                    planets.map((p) => (
                      <i key={p} className="ls-dk-house-chip" style={{ "--pop-delay": `${(0.3 + chipIdx++ * 0.06).toFixed(2)}s` } as React.CSSProperties}>
                        <AstroGlyph name={p} />
                      </i>
                    ))
                  )}
                </span>
                <span className="ls-dk-house-n">{card.counts[el]}</span>
              </div>
            );
          })}
        </div>
        {elEngine ? (
          <>
            <p className={lc("sky", "ls-dk-l1 ls-dk-el-meaning")}><NarratedWords blockId="sky" text={card.sky} nar={nar} /></p>
            <div className="ls-dk-read">
              <p className={lc("love", "ls-dk-beats")}><NarratedWords blockId="love" text={card.love} nar={nar} /></p>
            </div>
            <div className="ls-dk-sealbar">
              <SealMark />
              <p className={lc("sealed", "ls-dk-sealtext")}><NarratedWords blockId="sealed" text={card.sealed} nar={nar} /></p>
              <span className="ls-dk-sealtag">In the full reading</span>
            </div>
          </>
        ) : (
          <>
            <p className={lc("l1", "ls-dk-l1 ls-dk-el-meaning")}><NarratedWords blockId="l1" text={card.l1} nar={nar} /></p>
            <div className="ls-dk-read">
              <p className={lc("beats", "ls-dk-beats")}><NarratedWords blockId="beats" text={card.beats} nar={nar} /></p>
              <p className={lc("tell", "ls-dk-tell")}><span className="ls-dk-tell-mark" aria-hidden="true" /><NarratedWords blockId="tell" text={card.tell} nar={nar} /></p>
            </div>
          </>
        )}
      </div>,
    );
  }

  if (card.kind === "synthesis") {
    // The conjunction mark (spec-0): two circles overlapping, a hairline stem.
    // Static geometry, never a spinner. Wants and needs stage as call and
    // response: sun-anchored left, moon-anchored right (both left on mobile).
    return wrap(
      <div className="ls-dk-inner ls-dk-sy">
        <span className="ls-dk-conj" aria-hidden="true">
          <svg viewBox="0 0 64 48" width="64" height="48" fill="none" stroke="#b9a5f0" strokeWidth="1.4">
            <circle className="ls-dk-conj-a" cx="26" cy="16" r="10" />
            <circle className="ls-dk-conj-b" cx="38" cy="16" r="10" fill="rgba(185,165,240,0.22)" />
            <line className="ls-dk-conj-stem" x1="32" y1="29" x2="32" y2="47" strokeWidth="1" stroke="rgba(154,126,230,0.5)" />
          </svg>
        </span>
        <p className={lc("lead", "ls-dk-lead")}><NarratedWords blockId="lead" text={card.lead} nar={nar} /></p>
        <div className="ls-dk-synpair">
          <p className={lc("wants", "ls-dk-syn")}><AstroGlyph name="sun" className="ls-dk-syn-g" /><NarratedWords blockId="wants" text={card.wants} nar={nar} /></p>
          <p className={lc("needs", "ls-dk-syn ls-dk-syn2")}><AstroGlyph name="moon" className="ls-dk-syn-g" /><NarratedWords blockId="needs" text={card.needs} nar={nar} /></p>
        </div>
        <p className={lc("close", "ls-dk-close")}><NarratedWords blockId="close" text={card.close} nar={nar} /></p>
      </div>,
    );
  }

  if (card.kind === "signature") {
    // THE CHART SIGNATURE (the revelation card): the engine's strongest
    // storyline, told in the same reading grammar as the planet plates:
    // the numbers-led fact, the plain teaching of the mechanism, the
    // behaviour hero beat off the inset rule, the quotable law as the
    // indented italic note. The conjunction mark keeps the slot's geometry.
    return wrap(
      <div className="ls-dk-inner ls-dk-sy ls-dk-sig">
        <span className="ls-dk-conj" aria-hidden="true">
          <svg viewBox="0 0 64 48" width="64" height="48" fill="none" stroke="#b9a5f0" strokeWidth="1.4">
            <circle className="ls-dk-conj-a" cx="26" cy="16" r="10" />
            <circle className="ls-dk-conj-b" cx="38" cy="16" r="10" fill="rgba(185,165,240,0.22)" />
            <line className="ls-dk-conj-stem" x1="32" y1="29" x2="32" y2="47" strokeWidth="1" stroke="rgba(154,126,230,0.5)" />
          </svg>
        </span>
        <p className="ls-dk-eyebrow ls-dk-sig-eyebrow">The chart signature</p>
        <div className="ls-dk-read is-engine">
          <p className={lc("teach", "ls-dk-l1")}><NarratedWords blockId="teach" text={card.teach} nar={nar} /></p>
          <p className={lc("fact", "ls-dk-fact")}><NarratedWords blockId="fact" text={card.fact} nar={nar} /></p>
          <p className={lc("meaning", "ls-dk-teach")}><NarratedWords blockId="meaning" text={card.meaning} nar={nar} /></p>
          <p className={lc("behaviour", "ls-dk-beats")}><NarratedWords blockId="behaviour" text={card.behaviour} nar={nar} /></p>
        </div>
        <div className="ls-dk-sealbar">
          <SealMark />
          <p className={lc("sealed", "ls-dk-sealtext")}><NarratedWords blockId="sealed" text={card.sealed} nar={nar} /></p>
          <span className="ls-dk-sealtag">In the full reading</span>
        </div>
      </div>,
    );
  }

  const t = card.copy;
  return (
    <>
      {floating && showBack && onBack && (
        <button
          type="button"
          className="ls-dk-nav ls-dk-nav-back ls-dk-teaseback"
          onClick={(e) => { e.stopPropagation(); onBack(); }}
          aria-label="Back one card"
        >
          <CtrlPrev />
        </button>
      )}
      <div className="ls-dk-inner ls-dk-tease">
        {control && <div className="ls-dk-hear-tease">{control}</div>}
      <p className={lc("keep", "ls-dk-keep")}><NarratedWords blockId="keep" text={t.keep} nar={nar} /></p>
      <p className={lc("deeper", "ls-dk-deeper")}><NarratedWords blockId="deeper" text={t.deeper} nar={nar} /></p>
      <ul className="ls-dk-ledger">
        {t.ledger.map((row, i) => (
          <li key={row.body} style={{ animationDelay: `${0.35 + i * 0.05}s` }}>
            <AstroGlyph name={TEASE_GLYPH[row.body] ?? "synthesis"} className="ls-dk-ledger-g" />
            <span><strong>{row.body}.</strong> {row.line}</span>
          </li>
        ))}
      </ul>
      <p className={lc("rising", "ls-dk-rising")}><AstroGlyph name="rising" className="ls-dk-rising-g" /><NarratedWords blockId="rising" text={t.rising} nar={nar} /></p>
      <p className={lc("love", "ls-dk-deeper ls-dk-tease-love")}><NarratedWords blockId="love" text={t.love} nar={nar} /></p>
      <p className={lc("bridge", "ls-dk-bridge")}><NarratedWords blockId="bridge" text={t.bridge} nar={nar} /></p>
        <button type="button" className="ls-dk-cta" onClick={() => descendTo("#the-rest")}>
          {t.cta} <ChevronDown size={19} strokeWidth={1.7} />
        </button>
      </div>
    </>
  );
}

const DECK_CSS = `
  .ls-dk { position: relative; z-index: 2; margin: 0 -20px; height: 100vh; height: 100svh; touch-action: pan-y; user-select: none; -webkit-user-select: none; cursor: pointer; overflow: hidden; }
  .ls-dk-stage { position: absolute; inset: 0; }
  /* Bottom padding reserves the single control-row band, so the reading never
     reaches down into the [back · hear · Next] cluster (what made the hear
     button land on the sealed footer before). */
  .ls-dk-card { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: clamp(46px, 7svh, 72px) 22px clamp(108px, 15svh, 124px); }
  .ls-dk-inner { display: flex; flex-direction: column; align-items: center; text-align: center; gap: clamp(9px, 1.6svh, 15px); width: min(100%, 660px); max-height: 100%; }
  .ls-dk-inner > * { opacity: 0; animation: lsDkIn 0.55s cubic-bezier(0.22,0.7,0.2,1) forwards; }
  @keyframes lsDkIn { from { opacity: 0; transform: translateY(14px); filter: blur(3px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }

  /* The keepsake: their own photo, framed in violet, the reading's warm close. */
  .ls-dk-keep-inner { gap: clamp(16px, 3svh, 30px); }
  .ls-dk-frame { position: relative; width: clamp(178px, 34svh, 268px); aspect-ratio: 1; display: grid; place-items: center; animation: lsDkFrameRise 1.1s cubic-bezier(0.22,0.7,0.2,1) both; }
  @keyframes lsDkFrameRise { from { opacity: 0; transform: scale(0.9); filter: blur(6px); } to { opacity: 1; transform: scale(1); filter: blur(0); } }
  .ls-dk-frame-glow { position: absolute; inset: -20%; border-radius: 50%; background: radial-gradient(circle, rgba(154,126,230,0.42) 0%, rgba(154,126,230,0.16) 46%, transparent 72%); filter: blur(18px); animation: lsDkFrameBreath 6.5s ease-in-out infinite alternate; }
  .ls-dk-frame-mask { position: relative; width: 100%; height: 100%; border-radius: 50%; overflow: hidden; border: 2px solid rgba(185,165,240,0.55); box-shadow: 0 0 0 7px rgba(124,92,214,0.13), 0 0 0 8px rgba(185,165,240,0.16), 0 22px 60px rgba(4,2,12,0.62); }
  .ls-dk-frame-mask img { width: 100%; height: 100%; object-fit: cover; animation: lsDkFrameZoom 9s ease-in-out infinite alternate; }
  @keyframes lsDkFrameZoom { from { transform: scale(1); } to { transform: scale(1.05); } }
  @keyframes lsDkFrameBreath { from { opacity: 0.7; transform: scale(0.98); } to { opacity: 1; transform: scale(1.03); } }
  .ls-dk-frame-ring { position: absolute; inset: -7%; border-radius: 50%; border: 1px solid rgba(154,126,230,0.32); pointer-events: none; animation: lsDkFrameSpin 34s linear infinite; }
  @keyframes lsDkFrameSpin { to { transform: rotate(360deg); } }
  .ls-dk-keepname { margin: 0; max-width: 20ch; color: #ffffff; font-family: "Fraunces", Georgia, serif; font-weight: 500; font-size: clamp(1.9rem, 8vw, 2.9rem); line-height: 1.08; letter-spacing: -0.016em; text-shadow: 0 0 32px rgba(154,126,230,0.42); animation-delay: 0.42s; }

  /* The corner portrait window: their pet's face, kept gently present on every
     card. Same violet frame vocabulary as the keepsake, shrunk to a quiet
     token. Decorative and non-interactive so it never blocks a tap or scroll. */
  .ls-dk-pip { position: absolute; top: max(52px, calc(env(safe-area-inset-top) + 12px)); right: max(14px, calc(env(safe-area-inset-right) + 8px)); z-index: 6; width: clamp(46px, 12.5vw, 58px); aspect-ratio: 1; pointer-events: none; animation: lsDkPipIn 0.7s cubic-bezier(0.22,0.7,0.2,1) 0.32s both; }
  .ls-dk-pip-glow { position: absolute; inset: -28%; border-radius: 50%; background: radial-gradient(circle, rgba(154,126,230,0.42) 0%, rgba(154,126,230,0.15) 48%, transparent 72%); filter: blur(9px); animation: lsDkFrameBreath 6.5s ease-in-out infinite alternate; }
  .ls-dk-pip-mask { position: absolute; inset: 0; border-radius: 50%; overflow: hidden; border: 1.5px solid rgba(185,165,240,0.6); box-shadow: 0 0 0 4px rgba(124,92,214,0.14), 0 8px 22px rgba(4,2,12,0.5); }
  .ls-dk-pip-mask img { width: 100%; height: 100%; object-fit: cover; }
  .ls-dk-pip-ring { position: absolute; inset: -13%; border-radius: 50%; border: 1px solid rgba(154,126,230,0.34); animation: lsDkFrameSpin 34s linear infinite; }
  @keyframes lsDkPipIn { from { opacity: 0; transform: scale(0.68); } to { opacity: 1; transform: scale(1); } }
  @media (min-width: 1024px) { .ls-dk-pip { top: 66px; right: 26px; width: 62px; } }
  /* Narrow phones read near full width, so a scrolling body line can pass under
     the corner portrait. Reserve a top band there: the card's scroll frame now
     starts below the portrait, so text can never slip beneath it. Wide screens
     keep the reading column centred, clear of the corner, so no band is needed. */
  @media (max-width: 820px) {
    .ls-dk.has-pip .ls-dk-card { padding-top: clamp(100px, 14svh, 112px); }
  }

  /* THE PLANET PLATE (spec-0): fact stratum = engraved wheel with the disc
     seated at its true degree; reading stratum = beats + tell as two staged
     voices; seal stratum = the labelled sealed-drawer bar. Every animated
     piece's BASE state is the finished composition; animations only stage
     the arrival (reduced-motion law). */
  .ls-dk-pl { gap: clamp(16px, 2.6svh, 24px); }
  .ls-dk-plate { position: relative; width: clamp(190px, 30svh, 236px); aspect-ratio: 1; display: grid; place-items: center; animation: none; opacity: 1; }
  .ls-dk-wheel { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
  .ls-dk-wheel-ring { fill: none; stroke: rgba(185,165,240,0.30); stroke-width: 1; stroke-dashoffset: 0; transform: rotate(-90deg); transform-origin: 50% 50%; animation: lsDkRingDraw 0.7s cubic-bezier(0.4,0,0.2,1) both; }
  @keyframes lsDkRingDraw { from { stroke-dashoffset: 653.5; } to { stroke-dashoffset: 0; } }
  .ls-dk-wheel-ticks { animation: lsDkFadeIn 0.4s ease 0.25s both; }
  @keyframes lsDkFadeIn { from { opacity: 0; } to { opacity: 1; } }
  .ls-dk-wheel-lit { stroke: #b9a5f0; stroke-width: 2; filter: drop-shadow(0 0 8px rgba(185,165,240,0.8)); animation: lsDkFadeIn 0.3s ease 0.85s both; }
  /* the orbit wrapper rotates the disc to its degree; the orb counter-rotates
     in exact lockstep so the photo never tilts mid-travel */
  .ls-dk-orbit { position: absolute; inset: 0; pointer-events: none; transform: rotate(var(--dk-angle, 0deg)); animation: lsDkOrbit 0.9s cubic-bezier(0.22,0.7,0.2,1) 0.15s both; }
  @keyframes lsDkOrbit { from { transform: rotate(calc(var(--dk-angle, 0deg) - 28deg)); } to { transform: rotate(var(--dk-angle, 0deg)); } }
  .ls-dk-orb { position: absolute; left: 50%; top: 2.727%; width: clamp(56px, 8.5svh, 72px); aspect-ratio: 1; display: grid; place-items: center; transform: translate(-50%, -50%) rotate(calc(-1 * var(--dk-angle, 0deg))); animation: lsDkOrbCounter 0.9s cubic-bezier(0.22,0.7,0.2,1) 0.15s both; }
  @keyframes lsDkOrbCounter { from { transform: translate(-50%, -50%) rotate(calc(28deg - var(--dk-angle, 0deg))); } to { transform: translate(-50%, -50%) rotate(calc(-1 * var(--dk-angle, 0deg))); } }
  .ls-dk-halo { position: absolute; inset: -22%; border-radius: 50%; background: radial-gradient(circle, rgba(154,126,230,0.22) 0%, rgba(154,126,230,0.09) 44%, transparent 70%); filter: blur(12px); }
  .ls-dk-orb img { position: relative; width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 10px 26px rgba(4,2,12,0.6)); animation: lsDkKen 7s ease-in-out infinite alternate; }
  @keyframes lsDkKen { from { transform: scale(1) translate3d(0, 1.4%, 0); } to { transform: scale(1.075) translate3d(0, -1.4%, 0); } }
  /* the lockup: label, sign word and caption INSIDE the ring, so the sign
     lives in its own chart wheel with the planet placed at its degree */
  .ls-dk-lockup { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; max-width: 78%; }
  .ls-dk-lockup > * { opacity: 0; animation: lsDkIn 0.55s cubic-bezier(0.22,0.7,0.2,1) forwards; }
  .ls-dk-lockup .ls-dk-eyebrow { animation-delay: 0.2s; }
  .ls-dk-eyebrow { margin: 0; display: inline-flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 9px; row-gap: 4px; color: #b9a5f0; font-family: "Newsreader", Georgia, serif; font-size: 12.5px; font-weight: 600; letter-spacing: 0.18em; text-indent: 0.18em; text-transform: uppercase; }
  /* label and counter wrap as whole units, never mid-word */
  .ls-dk-eyelabel { display: inline-flex; align-items: center; gap: 9px; white-space: nowrap; }
  .ls-dk-count { white-space: nowrap; }
  .ls-dk-glyphmark { font-size: 15px; filter: drop-shadow(0 0 8px rgba(154,126,230,0.5)); }
  .ls-dk-count { display: inline-flex; align-items: center; padding-left: 10px; margin-left: 1px; color: rgba(200,200,210,0.62); font-size: 10.5px; letter-spacing: 0.22em; text-indent: 0.22em; border-left: 1px solid rgba(154,126,230,0.32); }
  .ls-dk-chipwrap { perspective: 680px; animation: none !important; opacity: 1 !important; }
  .ls-dk-chip { margin: 0; white-space: nowrap; font-family: "Fraunces", Georgia, serif; font-weight: 500; letter-spacing: -0.015em; font-size: clamp(1.5rem, 6vw, 2rem); line-height: 1; color: #ffffff; text-shadow: 0 0 34px rgba(154,126,230,0.35); transform-origin: 50% 115%; animation: lsDkFlip 0.7s cubic-bezier(0.3,1.26,0.44,1) 0.25s both; }
  @keyframes lsDkFlip { from { transform: rotateX(-92deg); opacity: 0; } to { transform: rotateX(0deg); opacity: 1; } }
  .ls-dk-deg { color: #b9a5f0; font-size: 0.52em; font-weight: 500; letter-spacing: 0.02em; vertical-align: 0.35em; }
  /* the identity line: the card's plain caption, pulled BELOW the plate so it
     reads big and clear (no longer cramped inside the ring). */
  .ls-dk-l1 { margin: 4px auto 0; max-width: 30ch; color: #f2eefc; font-family: "Newsreader", Georgia, serif; font-size: clamp(1.08rem, 4.6vw, 1.24rem); line-height: 1.44; text-align: center; }
  /* READING stratum: two left-aligned voices at two indents. The block itself
     centers on the card axis; inside it the words stage as spoken lines. */
  .ls-dk-read { display: flex; flex-direction: column; align-items: flex-start; gap: 16px; text-align: left; width: fit-content; max-width: min(100%, 36ch); margin-inline: auto; animation: none; opacity: 1; }
  /* the uncanny beats: the hero voice, quoted off an inset rule */
  .ls-dk-beats { position: relative; margin: 0; max-width: 32ch; padding-left: 18px; text-align: left; color: #ffffff; font-family: "Newsreader", Georgia, serif; font-size: clamp(1.22rem, 5vw, 1.46rem); line-height: 1.45; letter-spacing: -0.004em; text-shadow: 0 0 30px rgba(154,126,230,0.22); opacity: 0; animation: lsDkIn 0.55s cubic-bezier(0.22,0.7,0.2,1) 0.48s forwards; }
  .ls-dk-beats::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: linear-gradient(180deg, transparent, #b9a5f0 30%, #b9a5f0 70%, transparent); transform-origin: top; animation: lsDkRuleY 0.4s cubic-bezier(0.4,0,0.2,1) 0.5s both; }
  @keyframes lsDkRuleY { from { transform: scaleY(0); } to { transform: scaleY(1); } }
  /* the warm tell: the indented italic margin note, dash-anchored */
  .ls-dk-tell { position: relative; margin: 0; max-width: 30ch; padding-left: 36px; text-align: left; color: #cfc0f4; font-family: "Newsreader", Georgia, serif; font-style: italic; font-size: clamp(1.02rem, 4.2vw, 1.16rem); line-height: 1.5; opacity: 0; animation: lsDkIn 0.55s cubic-bezier(0.22,0.7,0.2,1) 0.68s forwards; }
  .ls-dk-tell-mark { position: absolute; left: 6px; top: 0.66em; width: 22px; height: 2px; border-radius: 2px; background: linear-gradient(90deg, transparent, #b9a5f0, transparent); }

  /* ── STAGED REVEAL (spec-1): the planet card in four moments, with a camera ─
     Each moment fades + rises + unblurs as ONE unit as it is revealed (by the
     StagedPlanet component, in order), and the inner column translates so the
     moment that just landed sits centred — the reader feels the placement land,
     then the discovery, then the behaviour, then the seal, and nothing is ever
     clipped however long the copy runs. Reduced motion / the static column show
     all four at rest with no camera (handled in the reduced blocks below). */
  .ls-dk-staged { gap: clamp(14px, 2.3svh, 20px); }
  /* The staged planet is a native scroll frame: the reveal follows each moment
     by scrolling, and the reader can grab it and read every beat freely. The
     top padding is headroom so the plate's orbiting planet never clips against
     the scroll edge; a short stack stays centred by the card's own flex. */
  .ls-dk-inner.ls-dk-staged { overflow-y: auto; overscroll-behavior: contain; touch-action: pan-y; -webkit-overflow-scrolling: touch; max-height: 100%; padding-top: clamp(30px, 6svh, 48px); padding-bottom: 10px; }
  .ls-dk-staged > .ls-dk-m { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 9px; width: 100%; opacity: 0; transform: translateY(14px); filter: blur(5px); animation: none !important; transition: opacity 0.6s cubic-bezier(0.22,0.7,0.2,1), transform 0.6s cubic-bezier(0.22,0.7,0.2,1), filter 0.6s cubic-bezier(0.22,0.7,0.2,1); }
  .ls-dk-staged > .ls-dk-m.is-shown { opacity: 1; transform: none; filter: blur(0); }
  .ls-dk-m1 { gap: 6px; }
  /* inside a moment the pieces are already settled — the moment IS the reveal */
  .ls-dk-staged .ls-dk-eyebrow, .ls-dk-staged .ls-dk-l1, .ls-dk-staged .ls-dk-mlabel,
  .ls-dk-staged .ls-dk-fact, .ls-dk-staged .ls-dk-teach, .ls-dk-staged .ls-dk-beats,
  .ls-dk-staged .ls-dk-tell, .ls-dk-staged .ls-dk-sealbar > svg,
  .ls-dk-staged .ls-dk-sealtext, .ls-dk-staged .ls-dk-sealtag { opacity: 1; animation: none; }
  .ls-dk-staged .ls-dk-beats::before, .ls-dk-staged .ls-dk-sealbar::before { animation: none; transform: none; }
  /* the discovery marker: a quiet violet index over the computed fact */
  .ls-dk-mlabel { margin: 0; color: #b9a5f0; font-family: "Newsreader", Georgia, serif; font-size: 12px; font-weight: 600; letter-spacing: 0.2em; text-indent: 0.2em; text-transform: uppercase; }
  /* moment bodies — big and readable (>=17px at 390); each text block is left-set
     but centres on the card axis so the moments still stack down the middle */
  .ls-dk-staged .ls-dk-fact { max-width: 33ch; text-align: left; color: #ececf2; font-size: clamp(1.06rem, 4.4vw, 1.17rem); line-height: 1.46; }
  .ls-dk-staged .ls-dk-teach { max-width: 33ch; text-align: left; font-size: clamp(1.07rem, 4.4vw, 1.13rem); line-height: 1.44; }
  .ls-dk-staged .ls-dk-beats { max-width: 31ch; font-size: clamp(1.2rem, 5vw, 1.48rem); line-height: 1.42; }
  .ls-dk-staged .ls-dk-tell { max-width: 31ch; font-size: clamp(1.06rem, 4.4vw, 1.2rem); }
  /* ENGINE ANATOMY (the real astrology read) — three staged tiers so the card
     reads with air, not as one grey column. TIER 1, the chart note: the
     numbers-led fact + one-line teaching, quiet and compact, one unit. TIER 2,
     the behaviour beat: the unmistakable hero, brightest and largest, off its
     inset rule, air on both sides. TIER 3, the quotable law: the indented
     italic close. Air lives in the margins BETWEEN tiers, never inside them, so
     the eye lands on the hero first. The plate gives back a little height. */
  .ls-dk-fact { margin: 0; max-width: 38ch; text-align: left; color: #ececf2; font-family: "Newsreader", Georgia, serif; font-size: clamp(0.91rem, 3.55vw, 1.08rem); line-height: 1.42; opacity: 0; animation: lsDkIn 0.55s cubic-bezier(0.22,0.7,0.2,1) 0.44s forwards; }
  .ls-dk-teach { margin: 0; max-width: 38ch; text-align: left; color: rgba(185,165,240,0.85); font-family: "Newsreader", Georgia, serif; font-style: italic; font-size: clamp(0.83rem, 3.25vw, 0.97rem); line-height: 1.4; opacity: 0; animation: lsDkIn 0.55s cubic-bezier(0.22,0.7,0.2,1) 0.56s forwards; }
  .ls-dk-read.is-engine { gap: 0; max-width: min(100%, 42ch); }
  /* tier 1 — the chart note, quieted so it never competes with the hero */
  .ls-dk-read.is-engine .ls-dk-fact { color: rgba(236,236,242,0.74); font-size: clamp(0.88rem, 3.4vw, 1.04rem); line-height: 1.44; margin-bottom: 5px; }
  .ls-dk-read.is-engine .ls-dk-teach { font-size: clamp(0.8rem, 3.05vw, 0.94rem); line-height: 1.42; margin-bottom: clamp(13px, 2.1svh, 22px); }
  /* tier 2 — the behaviour hero: brighter + set apart, air held after it */
  .ls-dk-read.is-engine .ls-dk-beats { max-width: 38ch; font-size: clamp(1.0rem, 3.95vw, 1.32rem); line-height: 1.44; margin-bottom: clamp(12px, 1.9svh, 20px); animation-delay: 0.68s; }
  .ls-dk-read.is-engine .ls-dk-beats::before { animation-delay: 0.7s; }
  /* tier 3 — the quotable law */
  .ls-dk-read.is-engine .ls-dk-tell { max-width: 36ch; font-size: clamp(0.88rem, 3.4vw, 1.06rem); animation-delay: 0.84s; }
  .ls-dk-pl.is-engine { gap: clamp(14px, 2.3svh, 20px); }
  .ls-dk-pl.is-engine .ls-dk-plate { width: clamp(140px, 19svh, 178px); }
  .ls-dk-pl.is-engine .ls-dk-orb { width: clamp(42px, 6svh, 54px); }
  .ls-dk-pl.is-engine .ls-dk-eyebrow { font-size: 11.5px; }
  .ls-dk-pl.is-engine .ls-dk-chip { font-size: clamp(1.4rem, 5.6vw, 1.82rem); }
  /* the chart-signature revelation card shares the engine read grammar */
  .ls-dk-sig { gap: clamp(8px, 1.4svh, 13px); }
  /* Non-staged engine cards (signature + element) carry four beats + the seal
     bar. On small phones a long template used to overflow the reserved band
     and seat the seal bar under the floating controls; containing the column
     lets it scroll inside its own frame instead. No overflow = no change. */
  .ls-dk-inner.ls-dk-sig, .ls-dk-inner.ls-dk-el { overflow-y: auto; overscroll-behavior: contain; touch-action: pan-y; max-height: 100%; padding: 4px 4px 8px; }
  .ls-dk.is-static .ls-dk-sig, .ls-dk.is-static .ls-dk-el { overflow: visible; max-height: none; }
  .ls-dk.is-static .ls-dk-staged, .ls-dk.is-static .ls-dk-inner.ls-dk-sy { overflow: visible; max-height: none; padding-top: 0; padding-bottom: 0; }
  .ls-dk-sig-eyebrow { animation-delay: 0.1s; }
  /* The signature card carries four beats + the seal bar: its teach line runs
     a step smaller so the whole card seats above the control band on phones. */
  .ls-dk-sig .ls-dk-l1 { font-size: clamp(16px, 2.3svh, 19px); }
  /* SEAL stratum: the labelled sealed drawer. Hairline top, lock left, the
     sealed line, the destination tag right. A drawer with a destination. */
  @keyframes lsDkRuleX { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  /* the sealed drawer: a quiet locked panel that tells the reader this glance is
     only a teaser — the tag "In the full reading" is the teaser message, set as
     a small violet pill so it registers. */
  .ls-dk-sealbar { position: relative; display: flex; flex-wrap: wrap; align-items: center; gap: 8px 11px; width: min(100%, 460px); margin-inline: auto; padding: 11px 14px; border: 1px solid rgba(154,126,230,0.26); border-radius: 13px; background: linear-gradient(180deg, rgba(124,92,214,0.11), rgba(124,92,214,0.04)); text-align: left; animation: none; opacity: 1; }
  .ls-dk-sealbar > svg { flex: 0 0 auto; align-self: flex-start; margin-top: 2px; font-size: 14px; color: rgba(185,165,240,0.85); }
  .ls-dk-sealtext { margin: 0; flex: 1 1 190px; min-width: 0; color: rgba(214,210,228,0.82); font-family: "Newsreader", Georgia, serif; font-size: 17.5px; line-height: 1.42; }
  .ls-dk-sealtag { flex: 0 0 auto; margin-left: auto; padding: 4px 11px; border-radius: 999px; border: 1px solid rgba(185,165,240,0.45); background: rgba(124,92,214,0.2); color: #cfc0f4; font-family: "Newsreader", Georgia, serif; font-size: 10.5px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; white-space: nowrap; }

  /* THE FOUR HOUSES (element card): his five planets standing in four
     hairline-divided element columns. The dominant column lit, the empty
     column a dimmed dot. Astronomy, not a settings widget. */
  .ls-dk-el { gap: clamp(7px, 1.2svh, 12px); }
  .ls-dk-el-eyebrow { animation-delay: 0.05s; }
  /* Four beats + the seal bar share this card: the teach line runs a step
     smaller and the lean word a step tighter so the bar seats above the
     control band on phones. */
  .ls-dk-el-teach { font-size: clamp(15px, 2.2svh, 18px); }
  .ls-dk-el-dom { margin: 0; color: #ffffff; font-family: "Fraunces", Georgia, serif; font-weight: 500; font-size: clamp(1.55rem, 6.4vw, 2.4rem); line-height: 1; letter-spacing: -0.014em; text-shadow: 0 0 32px rgba(154,126,230,0.32); animation-delay: 0.12s; }
  .ls-dk-houses { position: relative; display: grid; grid-template-columns: repeat(4, 1fr); width: min(88vw, 460px); margin: clamp(2px, 0.7svh, 8px) 0; padding: clamp(10px, 1.6svh, 16px) 0 clamp(8px, 1.3svh, 13px); animation: none; opacity: 1; }
  .ls-dk-houses::before, .ls-dk-houses::after { content: ""; position: absolute; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(154,126,230,0.22) 20%, rgba(154,126,230,0.22) 80%, transparent); transform-origin: left; animation: lsDkRuleX 0.45s cubic-bezier(0.4,0,0.2,1) 0.22s both; }
  .ls-dk-houses::before { top: 0; }
  .ls-dk-houses::after { bottom: 0; }
  .ls-dk-house { display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .ls-dk-house + .ls-dk-house { border-left: 1px solid rgba(154,126,230,0.22); }
  .ls-dk-house.is-empty { opacity: 0.45; }
  .ls-dk-house-name { color: #ececf2; font-family: "Newsreader", Georgia, serif; font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-indent: 0.18em; text-transform: uppercase; }
  .ls-dk-house.is-dom .ls-dk-house-name { color: #cfc0f4; }
  .ls-dk-house-chips { display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: clamp(5px, 0.9svh, 8px); min-height: clamp(78px, 10svh, 112px); padding-top: 2px; }
  .ls-dk-house-chip { width: clamp(28px, 4svh, 34px); height: clamp(28px, 4svh, 34px); border-radius: 50%; border: 1px solid rgba(185,165,240,0.22); background: rgba(154,126,230,0.04); display: grid; place-items: center; font-style: normal; font-size: 15px; color: rgba(217,210,234,0.6); animation: lsDkChipPop 0.35s cubic-bezier(0.22,0.7,0.2,1) var(--pop-delay, 0.3s) both; }
  .ls-dk-house.is-many .ls-dk-house-chip { width: 30px; height: 30px; font-size: 14px; }
  @keyframes lsDkChipPop { from { opacity: 0; transform: scale(0.6); } to { opacity: 1; transform: scale(1); } }
  .ls-dk-house.is-dom .ls-dk-house-chip { color: #cfc0f4; border-color: rgba(185,165,240,0.55); background: rgba(154,126,230,0.08); box-shadow: 0 0 14px rgba(185,165,240,0.35); animation: lsDkChipPop 0.35s cubic-bezier(0.22,0.7,0.2,1) var(--pop-delay, 0.3s) both, lsDkDomBreath 1.4s ease-in-out 0.7s both; }
  /* the one-time dominant breath: swells once, then rests lit */
  @keyframes lsDkDomBreath { 0% { box-shadow: 0 0 0 rgba(185,165,240,0); } 55% { box-shadow: 0 0 20px rgba(185,165,240,0.5); } 100% { box-shadow: 0 0 14px rgba(185,165,240,0.35); } }
  .ls-dk-house-dot { width: 4px; height: 4px; border-radius: 50%; background: rgba(185,165,240,0.25); margin-top: 8px; }
  .ls-dk-house-n { color: rgba(200,200,210,0.7); font-family: "Newsreader", Georgia, serif; font-size: 12.5px; }
  .ls-dk-house.is-dom .ls-dk-house-n { color: #cfc0f4; }
  .ls-dk-house.is-empty .ls-dk-house-n { opacity: 0.4; }
  .ls-dk-el-meaning { max-width: 34ch; color: #d9d2ea; font-style: italic; font-size: clamp(0.92rem, 3.6vw, 1.02rem); animation-delay: 0.5s; }
  .ls-dk-el .ls-dk-beats { animation-delay: 0.66s; font-size: clamp(16px, 2.4svh, 19px); }
  .ls-dk-el .ls-dk-sealtext { font-size: clamp(14.5px, 2svh, 16.5px); }
  .ls-dk-el .ls-dk-beats::before { animation-delay: 0.68s; }
  .ls-dk-el .ls-dk-tell { animation-delay: 0.85s; }

  /* The synthesis: the conjunction mark (two bodies overlapping, one stem),
     then wants and needs as call and response, then the close. */
  .ls-dk-sy { gap: clamp(10px, 1.8svh, 16px); }
  /* Synthesis scrolls too when its call-and-response runs long on a small phone
     (the signature twin already carries its own scroll frame). */
  .ls-dk-inner.ls-dk-sy:not(.ls-dk-sig) { overflow-y: auto; overscroll-behavior: contain; touch-action: pan-y; -webkit-overflow-scrolling: touch; max-height: 100%; padding: 8px 4px; }
  .ls-dk-conj { display: inline-flex; filter: drop-shadow(0 0 12px rgba(154,126,230,0.4)); }
  .ls-dk-conj-a { animation: lsDkConjA 0.6s cubic-bezier(0.22,0.7,0.2,1) 0.1s both; }
  .ls-dk-conj-b { animation: lsDkConjB 0.6s cubic-bezier(0.22,0.7,0.2,1) 0.1s both; }
  @keyframes lsDkConjA { from { transform: translateX(-6px); } to { transform: translateX(0); } }
  @keyframes lsDkConjB { from { transform: translateX(6px); fill-opacity: 0; } to { transform: translateX(0); fill-opacity: 1; } }
  .ls-dk-conj-stem { animation: lsDkFadeIn 0.4s ease 0.5s both; }
  .ls-dk-lead { margin: 0; color: #b9a5f0; font-family: "Newsreader", Georgia, serif; font-style: italic; font-size: clamp(1.05rem, 4.2vw, 1.2rem); animation-delay: 0.15s; }
  .ls-dk-synpair { display: flex; flex-direction: column; gap: clamp(14px, 2.4svh, 22px); width: min(100%, 560px); animation: none; opacity: 1; }
  .ls-dk-syn { position: relative; margin: 0; max-width: 26ch; padding-left: 30px; align-self: flex-start; text-align: left; color: #ffffff; font-family: "Fraunces", Georgia, serif; font-weight: 500; font-size: clamp(1.5rem, 6.4vw, 2.05rem); line-height: 1.18; letter-spacing: -0.014em; opacity: 0; animation: lsDkIn 0.55s cubic-bezier(0.22,0.7,0.2,1) 0.3s forwards; }
  .ls-dk-syn2 { align-self: flex-end; text-align: right; padding-left: 0; padding-right: 30px; animation-delay: 0.6s; }
  .ls-dk-syn-g { position: absolute; left: 0; top: 0.3em; font-size: 15px; color: rgba(185,165,240,0.7); }
  .ls-dk-syn2 .ls-dk-syn-g { left: auto; right: 0; }
  @media (max-width: 639px) {
    .ls-dk-syn2 { align-self: flex-start; text-align: left; margin-left: 24px; padding-left: 30px; padding-right: 0; }
    .ls-dk-syn2 .ls-dk-syn-g { right: auto; left: 0; }
  }
  .ls-dk-close { position: relative; margin: clamp(6px, 1.6svh, 16px) 0 0; padding-top: 21px; max-width: 24ch; color: #ffffff; font-family: "Fraunces", Georgia, serif; font-style: italic; font-weight: 500; font-size: clamp(1.3rem, 5.4vw, 1.8rem); line-height: 1.24; text-shadow: 0 0 26px rgba(167,139,250,0.4); animation-delay: 0.9s; }
  .ls-dk-close::before { content: ""; position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 46px; height: 1px; background: linear-gradient(90deg, transparent, rgba(185,165,240,0.35), transparent); }

  /* The tease + handoff (terminal card, ledger of the eight still dark). */
  .ls-dk-tease { gap: clamp(8px, 1.4svh, 13px); overflow-y: auto; overscroll-behavior: contain; touch-action: pan-y; max-height: 100%; padding: 4px; cursor: default; }
  .ls-dk-keep { margin: 0; max-width: 28ch; color: #ffffff; font-family: "Fraunces", Georgia, serif; font-weight: 500; font-size: clamp(1.38rem, 5.6vw, 1.95rem); line-height: 1.22; letter-spacing: -0.012em; }
  .ls-dk-deeper { margin: 0; max-width: 36ch; color: #ececf2; font-family: "Newsreader", Georgia, serif; font-size: clamp(1.1rem, 4.5vw, 1.3rem); line-height: 1.42; animation-delay: 0.22s; }
  .ls-dk-ledger { list-style: none; margin: clamp(2px, 1svh, 8px) 0; padding: 0; display: flex; flex-direction: column; gap: 7px; text-align: left; animation: none; opacity: 1; }
  .ls-dk-ledger li { display: flex; align-items: flex-start; gap: 10px; color: rgba(236,236,242,0.78); font-family: "Newsreader", Georgia, serif; font-size: clamp(0.95rem, 3.9vw, 1.05rem); line-height: 1.4; opacity: 0; animation: lsDkIn 0.5s cubic-bezier(0.22,0.7,0.2,1) forwards; }
  .ls-dk-ledger li strong { color: #b9a5f0; font-weight: 600; }
  .ls-dk-ledger-g { flex: 0 0 auto; margin-top: 3px; font-size: 15px; color: rgba(185,165,240,0.6); }
  .ls-dk-rising { margin: 0; display: inline-flex; align-items: center; gap: 9px; max-width: 34ch; color: #ececf2; font-family: "Newsreader", Georgia, serif; font-style: italic; font-size: clamp(1.02rem, 4.2vw, 1.18rem); animation-delay: 0.8s; }
  .ls-dk-rising-g { font-size: 17px; color: rgba(185,165,240,0.7); }
  .ls-dk-bridge { margin: 0; max-width: 34ch; color: #ffffff; font-family: "Newsreader", Georgia, serif; font-size: clamp(1.12rem, 4.6vw, 1.32rem); line-height: 1.44; animation-delay: 0.95s; }
  .ls-dk-cta { margin-top: clamp(6px, 1.4svh, 14px); display: inline-flex; align-items: center; gap: 11px; padding: clamp(15px, 2.2vw, 18px) clamp(28px, 5vw, 40px); border-radius: 999px; border: 1px solid rgba(154,126,230,0.55); background: linear-gradient(180deg, rgba(124,92,214,0.28), rgba(124,92,214,0.13)); color: #ffffff; font-family: "Newsreader", Georgia, serif; font-size: clamp(1.08rem, 4.4vw, 1.22rem); font-weight: 600; cursor: pointer; box-shadow: 0 10px 34px rgba(70,40,140,0.36); transition: transform 0.3s ease, box-shadow 0.3s ease; animation-delay: 1.05s; }
  .ls-dk-cta:hover { transform: translateY(-2px); box-shadow: 0 16px 44px rgba(70,40,140,0.48); }

  /* Chrome: the segmented progress lives at BOTTOM CENTER (it used to sit
     16px under the fixed site header, interleaving with the nav). It rides
     beneath the control row and hides on the terminal tease card. */
  .ls-dk-progress { position: absolute; bottom: max(12px, env(safe-area-inset-bottom)); left: 50%; transform: translateX(-50%); z-index: 6; display: flex; gap: 6px; width: min(52%, 300px); }
  .ls-dk-progress span { flex: 1; height: 3px; border-radius: 99px; background: rgba(236,236,242,0.16); transition: background 0.35s ease, box-shadow 0.35s ease; }
  .ls-dk-progress span.is-done { background: rgba(236,236,242,0.82); }
  .ls-dk-progress span.is-now { background: #b9a5f0; box-shadow: 0 0 10px rgba(185,165,240,0.55); }
  /* The control row: one grouped cluster, anchored under the card (never the
     viewport edge), centered in the reserved band above the progress bar.
     Fades up with the card. */
  .ls-dk-footer { position: absolute; left: 0; right: 0; bottom: calc(max(12px, env(safe-area-inset-bottom)) + 27px); z-index: 7; display: flex; align-items: center; justify-content: center; gap: clamp(9px, 2.4vw, 15px); padding: 0 14px; opacity: 0; animation: lsDkFootIn 0.5s cubic-bezier(0.22,0.7,0.2,1) 0.24s forwards; }
  @keyframes lsDkFootIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .ls-dk-hear-foot { display: inline-flex; }
  .ls-dk-nav { display: inline-flex; align-items: center; cursor: pointer; font-family: "Newsreader", Georgia, serif; -webkit-tap-highlight-color: transparent; flex: 0 0 auto; }
  .ls-dk-nav:focus-visible { outline: 2px solid rgba(185,165,240,0.9); outline-offset: 3px; }
  /* Primary: the obvious violet Next pill. Breathes when idle so a first-time
     reader can never miss where to go next. */
  .ls-dk-nav-next { gap: 8px; padding: 14px 22px 14px 25px; border-radius: 999px; border: 1px solid rgba(185,165,240,0.62); background: linear-gradient(180deg, rgba(124,92,214,0.62), rgba(124,92,214,0.34)); color: #ffffff; font-size: 16px; font-weight: 600; letter-spacing: 0.008em; box-shadow: 0 12px 32px rgba(70,40,140,0.46), inset 0 1px 0 rgba(255,255,255,0.12); transition: transform 0.25s ease, box-shadow 0.3s ease, background 0.3s ease; }
  .ls-dk-nav-next:hover { transform: translateY(-2px); box-shadow: 0 18px 42px rgba(70,40,140,0.56), inset 0 1px 0 rgba(255,255,255,0.14); background: linear-gradient(180deg, rgba(138,104,230,0.7), rgba(124,92,214,0.4)); }
  .ls-dk-nav-next .ls-dk-nav-label { line-height: 1; }
  .ls-dk-nav-next svg { width: 18px; height: 18px; flex: 0 0 auto; }
  .ls-dk-nav-next.is-nudge { animation: lsDkNextPulse 2s ease-in-out 0.9s infinite; }
  @keyframes lsDkNextPulse {
    0%, 100% { box-shadow: 0 12px 32px rgba(70,40,140,0.46), inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 0 rgba(185,165,240,0); }
    50% { box-shadow: 0 14px 36px rgba(70,40,140,0.5), inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 7px rgba(185,165,240,0.16); }
  }
  /* Secondary: a quiet ghost chevron, clearly lower billing than Next. */
  .ls-dk-nav-back { width: 46px; height: 46px; justify-content: center; border-radius: 50%; border: 1px solid rgba(154,126,230,0.3); background: rgba(154,126,230,0.06); color: rgba(236,236,242,0.6); transition: color 0.25s ease, border-color 0.25s ease, background 0.25s ease; }
  .ls-dk-nav-back:hover { color: rgba(236,236,242,0.92); border-color: rgba(185,165,240,0.55); background: rgba(154,126,230,0.13); }
  .ls-dk-nav-back svg { width: 22px; height: 22px; }
  /* The tease is its own terminal card (its CTA is the forward action), so its
     quiet Back sits top-left, clear of the centered hear pill and the CTA. */
  .ls-dk-teaseback { position: absolute; top: clamp(44px, 7svh, 70px); left: max(10px, calc(env(safe-area-inset-left) + 6px)); z-index: 8; }
  /* Narrow phones: drop the hear label to icon-only so the row never overflows. */
  @media (max-width: 384px) {
    .ls-dk-hear-foot .ls-nar-ctrl { padding: 6px; gap: 0; }
    .ls-dk-hear-foot .ls-nar-label { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  }

  /* The voice affordance sits in the control row on the swipe deck (see
     .ls-dk-hear-foot), inline in the static column, and at the top of the
     tease card. */
  .ls-dk-hear-static { display: flex; justify-content: center; margin-top: clamp(16px, 3svh, 24px); }
  .ls-dk-hear-tease { display: flex; justify-content: center; opacity: 0; animation: lsDkIn 0.55s cubic-bezier(0.22,0.7,0.2,1) forwards; }
  /* Short viewports: drop the hear pill from the row and reclaim its space for
     the reading. Back and the obvious Next stay — the controls that must never
     disappear. */
  @media (max-height: 620px) {
    .ls-dk-hear-foot { display: none; }
    .ls-dk-card { padding-bottom: clamp(96px, 15svh, 108px); }
  }

  /* Desktop >=1024px: the SAME staged single column, centred, just given more
     width and a larger plate. The staged reveal reads identically to the phone
     so the placement always lands alone first (no side-by-side spread that used
     to split the identity from its reading). */
  @media (min-width: 1024px) {
    .ls-dk-pl { width: min(100%, 640px); }
    .ls-dk-plate { width: clamp(206px, 30svh, 252px); }
    .ls-dk-pl .ls-dk-sealbar { width: min(100%, 520px); }
    .ls-dk-staged .ls-dk-fact, .ls-dk-staged .ls-dk-teach { max-width: 42ch; }
    .ls-dk-staged .ls-dk-beats, .ls-dk-staged .ls-dk-tell { max-width: 38ch; }
  }

  /* Static column: reduced motion, every card visible in reading order.
     REDUCED-MOTION LAW: the rest state IS the finished composition: ring
     drawn, disc seated at its final angle, lit tick on, chips seated,
     drawers labelled, lines full. */
  .ls-dk.is-static { height: auto; margin: 0; touch-action: auto; cursor: default; overflow: visible; display: flex; flex-direction: column; padding: clamp(10px, 2svh, 24px) 0; }
  .ls-dk-static-card { padding: clamp(22px, 4svh, 38px) 0; border-bottom: 1px solid rgba(154,126,230,0.14); }
  .ls-dk-static-card:last-child { border-bottom: 0; }
  .ls-dk.is-static .ls-dk-inner { margin: 0 auto; }
  .ls-dk.is-static .ls-dk-inner > *, .ls-dk.is-static .ls-dk-ledger li, .ls-dk.is-static .ls-dk-lockup > *,
  .ls-dk.is-static .ls-dk-beats, .ls-dk.is-static .ls-dk-tell,
  .ls-dk.is-static .ls-dk-fact, .ls-dk.is-static .ls-dk-teach,
  .ls-dk.is-static .ls-dk-sealbar > svg, .ls-dk.is-static .ls-dk-sealtext, .ls-dk.is-static .ls-dk-sealtag,
  .ls-dk.is-static .ls-dk-syn, .ls-dk.is-static .ls-dk-syn2 { opacity: 1 !important; animation: none !important; }
  .ls-dk.is-static .ls-dk-chip, .ls-dk.is-static .ls-dk-orb img,
  .ls-dk.is-static .ls-dk-wheel-ring, .ls-dk.is-static .ls-dk-wheel-ticks, .ls-dk.is-static .ls-dk-wheel-lit,
  .ls-dk.is-static .ls-dk-orbit, .ls-dk.is-static .ls-dk-orb,
  .ls-dk.is-static .ls-dk-beats::before, .ls-dk.is-static .ls-dk-sealbar::before,
  .ls-dk.is-static .ls-dk-houses::before, .ls-dk.is-static .ls-dk-houses::after, .ls-dk.is-static .ls-dk-house-chip,
  .ls-dk.is-static .ls-dk-conj-a, .ls-dk.is-static .ls-dk-conj-b, .ls-dk.is-static .ls-dk-conj-stem { animation: none !important; }
  .ls-dk.is-static .ls-dk-tease { overflow: visible; max-height: none; }
  /* staged planet: no camera, every moment shown at rest in reading order */
  .ls-dk.is-static .ls-dk-staged { transform: none !important; transition: none !important; }
  .ls-dk.is-static .ls-dk-staged > .ls-dk-m { opacity: 1 !important; transform: none !important; filter: none !important; transition: none !important; }
  /* parity with the reduced-motion block below: the static column never mounts
     the floating chrome, but the law is every animated class carries BOTH
     overrides, so the frame / footer / Next pulse are stilled here too. */
  .ls-dk.is-static .ls-dk-frame, .ls-dk.is-static .ls-dk-frame-glow, .ls-dk.is-static .ls-dk-frame-mask img, .ls-dk.is-static .ls-dk-frame-ring { animation: none !important; opacity: 1 !important; }
  .ls-dk.is-static .ls-dk-footer, .ls-dk.is-static .ls-dk-nav-next, .ls-dk.is-static .ls-dk-nav-next.is-nudge { animation: none !important; opacity: 1 !important; }
  .ls-dk.is-static .ls-dk-hear-tease { animation: none !important; opacity: 1 !important; }

  @media (prefers-reduced-motion: reduce) {
    .ls-dk-inner > *, .ls-dk-ledger li, .ls-dk-lockup > *,
    .ls-dk-beats, .ls-dk-tell,
    .ls-dk-fact, .ls-dk-teach,
    .ls-dk-sealbar > svg, .ls-dk-sealtext, .ls-dk-sealtag,
    .ls-dk-syn, .ls-dk-syn2 { opacity: 1 !important; animation: none !important; }
    .ls-dk-chip, .ls-dk-orb img,
    .ls-dk-wheel-ring, .ls-dk-wheel-ticks, .ls-dk-wheel-lit,
    .ls-dk-orbit, .ls-dk-orb,
    .ls-dk-beats::before, .ls-dk-sealbar::before,
    .ls-dk-houses::before, .ls-dk-houses::after, .ls-dk-house-chip,
    .ls-dk-conj-a, .ls-dk-conj-b, .ls-dk-conj-stem { animation: none !important; }
    .ls-dk-nav-next, .ls-dk-nav-next.is-nudge { animation: none !important; opacity: 1 !important; }
    .ls-dk-frame, .ls-dk-frame-glow, .ls-dk-frame-mask img, .ls-dk-frame-ring { animation: none !important; opacity: 1 !important; }
    .ls-dk-pip, .ls-dk-pip-glow, .ls-dk-pip-ring { animation: none !important; opacity: 1 !important; }
    .ls-dk-footer { animation: none !important; opacity: 1 !important; }
    .ls-dk-staged { transform: none !important; transition: none !important; }
    .ls-dk-staged > .ls-dk-m { opacity: 1 !important; transform: none !important; filter: none !important; transition: none !important; }
  }

  @media (max-height: 640px) {
    .ls-dk-plate { width: clamp(132px, 22svh, 170px); }
    .ls-dk-orb { width: clamp(42px, 6svh, 52px); }
    .ls-dk-inner { gap: 8px; }
    .ls-dk-pl { gap: 12px; }
    .ls-dk-staged { gap: 12px; }
    .ls-dk-staged > .ls-dk-m { gap: 7px; }
    .ls-dk-chip { font-size: clamp(1.3rem, 5.4vw, 1.7rem); }
    .ls-dk-l1 { font-size: 1rem; }
  }

  /* ==== TYPE FLOORS - tuned per viewport ==== */
  @media (min-width: 1024px) {
    .ls-dk-l1 { font-size: 1.22rem; }
    .ls-dk-beats { font-size: 1.5rem; }
    .ls-dk-tell { font-size: 1.26rem; }
    .ls-dk-sealtext { font-size: 17.5px; }
    .ls-dk-eyebrow { font-size: 13px; }
    .ls-dk-fact { font-size: 1.12rem; }
    .ls-dk-teach { font-size: 1rem; }
    /* the signature card keeps its own facing-spread reading grammar */
    .ls-dk-read.is-engine .ls-dk-fact { font-size: 1.06rem; }
    .ls-dk-read.is-engine .ls-dk-teach { font-size: 0.98rem; }
    .ls-dk-read.is-engine .ls-dk-beats { font-size: 1.46rem; }
    .ls-dk-read.is-engine .ls-dk-tell { font-size: 1.2rem; }
    /* the staged planet card stays one centred column; just a larger plate */
    .ls-dk-pl.is-engine .ls-dk-plate { width: clamp(190px, 27svh, 226px); }
  }

  /* Discovery tease is the longest terminal card (8-row ledger + bridge + CTA).
     On phones its closing bridge line and CTA clipped below the fold; tighten
     the vertical rhythm so both clear the fold. overflow-y:auto stays as the
     safety net for the very shortest viewports. Memorial tease is shorter and
     already fits, so this only bites where the copy actually overruns. */
  @media (max-width: 639px) {
    .ls-dk-tease { gap: clamp(6px, 1svh, 10px); padding-bottom: 6px; }
    .ls-dk-tease .ls-dk-keep { font-size: clamp(1.26rem, 5.1vw, 1.56rem); line-height: 1.17; }
    .ls-dk-tease .ls-dk-deeper { font-size: clamp(1rem, 4vw, 1.14rem); line-height: 1.33; }
    .ls-dk-tease .ls-dk-ledger { gap: 5px; margin: clamp(1px, 0.5svh, 4px) 0; }
    .ls-dk-tease .ls-dk-ledger li { font-size: clamp(0.9rem, 3.7vw, 1rem); line-height: 1.3; }
    .ls-dk-tease .ls-dk-rising { font-size: clamp(0.98rem, 4vw, 1.1rem); }
    .ls-dk-tease .ls-dk-bridge { font-size: clamp(1.05rem, 4.3vw, 1.22rem); line-height: 1.33; }
    .ls-dk-tease .ls-dk-cta { margin-top: clamp(4px, 1svh, 10px); padding: 13px 30px; }
  }
`;

function FreeDeck({ chart, reduce, photoUrl, name, species, gender, birthDate, initialIndex = 0 }: { chart: PetBirthChart; reduce: boolean; photoUrl?: string | null; name?: string | null; species?: string | null; gender?: string | null; birthDate?: string | null; initialIndex?: number }) {
  const rootRef = useRef<HTMLDivElement>(null);

  // The memorial register swaps every card to its remembered-tense twin.
  const [memorial, setMemorial] = useState<boolean>(() => getIntent() === "memorial");
  useEffect(() => {
    const onIntent = () => setMemorial(getIntent() === "memorial");
    window.addEventListener(INTENT_EVENT, onIntent);
    return () => window.removeEventListener(INTENT_EVENT, onIntent);
  }, []);

  const reduced = reduce || (typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const keepsake = useMemo(() => (photoUrl ? { photoUrl, name: name ?? null } : null), [photoUrl, name]);
  const cards = useMemo(() => buildDeck(chart, memorial, { name, species, gender }, keepsake, birthDate), [chart, memorial, name, species, gender, keepsake, birthDate]);
  const last = cards.length - 1;
  // A resumed reading reopens at the stored card, clamped to the deck.
  const [active, setActive] = useState(() => Math.max(0, Math.min(last, Math.floor(initialIndex) || 0)));
  const activeRef = useRef(0);
  activeRef.current = active;
  const [nudge, setNudge] = useState(false);

  // Persist the open card on every advance so a reload (or an emailed deep
  // link) can reopen the deck exactly where the reader left it. Patches the
  // snapshot the chart compute wrote; never creates one on its own.
  useEffect(() => {
    saveResumeIndex(active);
  }, [active]);

  // Spine: card_advance — the highest-value missing instrument in the synth.
  // index is the 1-based card arrived at, dwell_ms is the time spent on the
  // card just left, direction is forward or back. Powers the per-card
  // drop-off funnels the testFirst experiments need. Analytics only.
  const dwellRef = useRef<{ t: number; idx: number }>({ t: Date.now(), idx: active });
  useEffect(() => {
    const prev = dwellRef.current;
    if (active === prev.idx) return;
    trackSpine("card_advance", {
      index: active + 1,
      dwell_ms: Date.now() - prev.t,
      direction: active > prev.idx ? "forward" : "back",
    });
    dwellRef.current = { t: Date.now(), idx: active };
  }, [active]);

  // Reading-revealed gate: fire once when the synthesis card takes the stage
  // (or immediately in the static column), so the lower funnel is mounted
  // and #the-rest exists before the tease CTA is tapped.
  const synthIndex = useMemo(() => cards.findIndex((c) => c.kind === "synthesis" || c.kind === "signature"), [cards]);
  const firedReveal = useRef(false);
  useEffect(() => {
    if (firedReveal.current) return;
    if (reduced || synthIndex < 0 || active >= synthIndex) {
      firedReveal.current = true;
      window.dispatchEvent(new Event("ls-reading-revealed"));
    }
  }, [active, reduced, synthIndex]);

  // Seat the stage flush with the viewport once the section's growth tween
  // has settled, so tap one starts from a clean full-frame card.
  useEffect(() => {
    if (reduced) return;
    const id = window.setTimeout(() => {
      const el = rootRef.current;
      if (el && Math.abs(el.getBoundingClientRect().top) > 24) descendTo(el, 0.7);
    }, 980);
    return () => window.clearTimeout(id);
  }, [reduced]);

  const step = useCallback(
    (d: number) => {
      setNudge(false);
      setActive((a) => Math.max(0, Math.min(last, a + d)));
      const el = rootRef.current;
      if (el && Math.abs(el.getBoundingClientRect().top) > 60) descendTo(el, 0.5);
    },
    [last],
  );

  // Warm the voice ahead of the tap: card 1's narration as soon as the deck
  // mounts, then each next card's as the current one opens. The server
  // content-hashes and caches every segment, so this costs one cheap request
  // per card and lets play start almost instantly instead of after a long
  // generation wait.
  useEffect(() => {
    const now = cards[active];
    if (now) prewarmNarration(deckCardBlocks(now));
    const next = cards[active + 1];
    if (next) prewarmNarration(deckCardBlocks(next));
  }, [cards, active]);

  // Idle nudge: after 4s without input, one quiet word invites the next card.
  useEffect(() => {
    if (reduced || active >= last) {
      setNudge(false);
      return;
    }
    setNudge(false);
    const id = window.setTimeout(() => setNudge(true), 4000);
    return () => window.clearTimeout(id);
  }, [active, reduced, last]);

  // Advancing is deliberate: a tap (the left fifth goes back) or a clear
  // horizontal swipe. Vertical is NEVER an advance — it belongs to the card's
  // own native scroll, so a tall card reads top to bottom without ever turning.
  // A vertical drag that scrolls fires pointercancel (the browser claims the
  // gesture), so a mid-scroll lift can never land as a tap.
  const gesture = useRef<{ x: number; y: number; t: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    setNudge(false);
    gesture.current = { x: e.clientX, y: e.clientY, t: Date.now() };
  };
  const endGesture = () => { gesture.current = null; };
  const onPointerUp = (e: React.PointerEvent) => {
    const g = gesture.current;
    gesture.current = null;
    if (!g) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input")) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    const dt = Date.now() - g.t;
    // A still, quick press is a tap: advance (the left fifth goes back).
    if (Math.hypot(dx, dy) < 14 && dt < 700) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      step(e.clientX - rect.left < rect.width * 0.22 ? -1 : 1);
      return;
    }
    // A decisively sideways swipe advances (left = next, right = back). The
    // strong horizontal bias keeps it from ever firing on a reading-scroll.
    if (Math.abs(dx) >= 56 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 800) {
      step(dx < 0 ? 1 : -1);
    }
    // Anything vertical: ignored here. The card scrolled; it did not turn.
  };

  // Desktop wheel: a tall card scrolls first, and only once it is against the
  // edge in that direction does one more notch turn the card (450ms debounce).
  // At the deck's own ends the wheel is handed back to the page so the reader
  // can leave naturally.
  useEffect(() => {
    if (reduced) return;
    const el = rootRef.current;
    if (!el) return;
    let lastTurn = 0;
    const onWheel = (e: WheelEvent) => {
      const dir = e.deltaY > 0 ? 1 : -1;
      const a = activeRef.current;
      // Let the card read itself first: if its scroll frame can still move in
      // this direction, leave the wheel to it (native, momentum) and don't turn.
      const scroller = (e.target as HTMLElement | null)?.closest(
        ".ls-dk-staged, .ls-dk-sig, .ls-dk-el, .ls-dk-tease, .ls-dk-sy",
      ) as HTMLElement | null;
      if (scroller) {
        const canDown = scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 1;
        const canUp = scroller.scrollTop > 1;
        if ((dir > 0 && canDown) || (dir < 0 && canUp)) return;
      }
      if ((dir > 0 && a >= last) || (dir < 0 && a <= 0)) return;
      e.preventDefault();
      const now = Date.now();
      if (now - lastTurn < 450 || Math.abs(e.deltaY) < 8) return;
      lastTurn = now;
      step(dir);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [reduced, last, step]);

  // Space / right arrow advance, left arrow goes back, while the deck holds
  // the viewport.
  useEffect(() => {
    if (reduced) return;
    const onKey = (e: KeyboardEvent) => {
      const el = rootRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      if (r.top > vh * 0.4 || r.bottom < vh * 0.6) return;
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reduced, step]);

  if (reduced) {
    return (
      <div className="ls-dk is-static" id="free-deck" ref={rootRef}>
        {cards.map((c, i) => (
          <div key={i} className="ls-dk-static-card">
            <DeckCardBody card={c} reduce />
          </div>
        ))}
        <style>{DECK_CSS}</style>
      </div>
    );
  }

  return (
    <div
      className={`ls-dk${photoUrl ? " has-pip" : ""}`}
      id="free-deck"
      ref={rootRef}
      data-lenis-prevent
      role="group"
      aria-roledescription="card deck"
      aria-label={`Their free reading, card ${active + 1} of ${cards.length}`}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={endGesture}
    >
      {active < last && (
        <div className="ls-dk-progress" aria-hidden="true">
          {cards.map((_, i) => (
            <span key={i} className={i < active ? "is-done" : i === active ? "is-now" : ""} />
          ))}
        </div>
      )}
      {/* Their face, gently present: a small framed portrait in the corner on
          every card. Only when a photo was added, and never on the keepsake
          card (its own full portrait is already the whole frame). Decorative,
          so it never intercepts a tap or a scroll. */}
      {photoUrl && cards[active]?.kind !== "keepsake" && (
        <div className="ls-dk-pip" aria-hidden="true">
          <span className="ls-dk-pip-glow" />
          <span className="ls-dk-pip-mask"><img src={photoUrl} alt="" draggable={false} /></span>
          <span className="ls-dk-pip-ring" />
        </div>
      )}
      <div className="ls-dk-stage">
        <AnimatePresence initial={false}>
          <motion.div
            key={active}
            className="ls-dk-card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            aria-live="polite"
          >
            <DeckCardBody
              card={cards[active]}
              reduce={false}
              floating
              showNext={active < last}
              showBack={active > 0}
              nudge={nudge}
              onNext={() => step(1)}
              onBack={() => step(-1)}
            />
          </motion.div>
        </AnimatePresence>
      </div>
      <style>{DECK_CSS}</style>
    </div>
  );
}

const EMAIL_RE = /.+@.+\..+/;

// Local-time today in ISO shape, for the date field's max and the
// future-date check (a year typo like 2027 used to compute a wrong chart
// silently: the old max was 2030-12-31).
function todayIso(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function BirthSkyJourney() {
  const reduce = useReducedMotion() ?? false;
  const infoBtnRef = useRef<HTMLButtonElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const growFromRef = useRef(0);

  const [petName, setPetName] = useState("");
  const [date, setDate] = useState("");
  // One-tap species (dog / cat / other). Required, but a single tap so it does
  // not cost capture. Species sets the whole voice of the reading, so we take it
  // here on the free reading instead of waiting for the paid intake. Prefills
  // from a prior visit.
  const [species, setSpecies] = useState<string>(() => {
    try { const s = sessionStorage.getItem("ls_chart_species") || ""; return ["dog", "cat", "other"].includes(s) ? s : ""; } catch { return ""; }
  });
  // Optional he/she. One quiet tap, never required, tap again to unset. It
  // genders the whole reading ("his Sun", "she stretches out") and carries
  // through to the full reading so the paid intake arrives pre-answered.
  // Stored as male/female to match the intake's own gender values.
  const [gender, setGender] = useState<string>(() => {
    try { const g = sessionStorage.getItem("ls_chart_gender") || ""; return g === "male" || g === "female" ? g : ""; } catch { return ""; }
  });
  const pickGender = (v: "male" | "female") => {
    const next = gender === v ? "" : v;
    setGender(next);
    try {
      if (next) sessionStorage.setItem("ls_chart_gender", next);
      else sessionStorage.removeItem("ls_chart_gender");
    } catch { /* ignore */ }
    patchResume({ gender: next || null });
    trackSpine("gender_set", { value: next || "unset", via: "user_tap" });
  };
  // Email lives at the START of the free reading (Danny, 2026-07): the seal
  // card carries it, so the reading is theirs before the sky opens. A prior
  // visit's address prefills quietly.
  const [email, setEmail] = useState<string>(() => {
    try { return sessionStorage.getItem("ls_chart_email") || ""; } catch { return ""; }
  });
  const [chart, setChart] = useState<PetBirthChart | null>(null);
  const [status, setStatus] = useState<"idle" | "computing" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);
  // Per-field errors, all surfaced at once on submit (adjacent to their
  // fields), instead of the old serial one-at-a-time bottom message.
  const [fieldErrs, setFieldErrs] = useState<{ date?: string; species?: string; email?: string }>({});
  // Quiet success mark on the email field, set on blur when the address parses.
  const [emailOk, setEmailOk] = useState(false);

  // Optional pet photo. Uploaded to the same pet-photos bucket the post-purchase
  // intake uses, so ONE photo carries the whole journey. Prefills from a prior
  // visit. Never a gate: the reading opens with or without it.
  const [photo, setPhoto] = useState<string | null>(() => {
    try { return sessionStorage.getItem("ls_chart_photo") || null; } catch { return null; }
  });
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoErr, setPhotoErr] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);

  // The memorial register softens the email ask into the "held for you" voice.
  const [memorial, setMemorial] = useState<boolean>(() => getIntent() === "memorial");
  useEffect(() => {
    const onIntent = () => setMemorial(getIntent() === "memorial");
    window.addEventListener(INTENT_EVENT, onIntent);
    return () => window.removeEventListener(INTENT_EVENT, onIntent);
  }, []);

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
      // A shallow bottom margin keeps one short beat of the empty-shell
      // telegraph without holding the copy hostage (near-instant reveals).
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 },
    );
    rows.forEach((r) => io.observe(r));
    return () => io.disconnect();
  }, [ready, chart, reduce]);

  const bodyFor = (key: keyof typeof PLANET_META): ChartBody | undefined =>
    chart ? (chart[key as keyof PetBirthChart] as ChartBody | undefined) : undefined;

  // The seal form re-mounts with FRESH .ls-reveal nodes when a compute attempt
  // fails (form -> ComputeSequence -> form). The page-level reveal observer has
  // already run by then, so without this pass the returning fields would sit at
  // opacity 0 forever. Seat them immediately - the visitor is already here.
  const prevStatus = useRef(status);
  useEffect(() => {
    const was = prevStatus.current;
    prevStatus.current = status;
    if (was !== "computing" || status === "computing" || status === "ready") return;
    const id = requestAnimationFrame(() => {
      sectionRef.current
        ?.querySelectorAll<HTMLElement>(".ls-reveal:not(.is-in)")
        .forEach((n) => n.classList.add("is-in"));
    });
    return () => cancelAnimationFrame(id);
  }, [status]);

  // Hand the pet's identity + computed signs to the checkout (dossier
  // inscription, eyebrow, sample excerpt). sessionStorage covers later
  // mounts; the events cover the checkout already mounted further down this
  // same page. Shared by the form submit and the resume restore.
  const publishChart = (data: PetBirthChart, pet: { name: string | null; date: string; species: string | null; gender?: string | null }) => {
    try {
      sessionStorage.setItem("ls_chart_pet", JSON.stringify(pet));
      if (pet.species) sessionStorage.setItem("ls_chart_species", pet.species);
      if (pet.gender) sessionStorage.setItem("ls_chart_gender", pet.gender);
      window.dispatchEvent(new CustomEvent("ls-chart-pet", { detail: pet }));
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
        // Sealed placements: the dossier's sample excerpt quotes Saturn
        // (Chiron as fallback) so the tease never quotes a placement the
        // free deck already gave.
        saturn: data.saturn?.sign || null,
        chiron: data.chiron?.sign || null,
      };
      sessionStorage.setItem("ls_chart_signs", JSON.stringify(signsPayload));
      window.dispatchEvent(new CustomEvent("ls-chart-signs", { detail: signsPayload }));
    } catch { /* ignore */ }
  };

  // ── Deck recovery ────────────────────────────────────────────────────
  // A reload (or a deep link from an email) used to dump a mid-deck reader
  // back to the landing top with the reading gone, even though the snapshot
  // held everything needed to rebuild it. The chart is a pure function of
  // the date, so restore = refetch for the stored date, recompose the deck,
  // reopen at the stored card. Triggered by the quiet strip near the top of
  // the page ("ls-resume-request") or by ?resume=1 on load.
  const [resumeAt, setResumeAt] = useState(0);
  const restoreReading = async () => {
    const snap = readResume();
    if (!snap || status === "computing" || (status === "ready" && chart)) return;
    window.dispatchEvent(new CustomEvent("ls-resume-status", { detail: { state: "busy" } }));
    setPetName(snap.name || "");
    setDate(snap.date);
    if (snap.species) setSpecies(snap.species);
    if (snap.gender) {
      setGender(snap.gender);
      try { sessionStorage.setItem("ls_chart_gender", snap.gender); } catch { /* ignore */ }
    }
    if (snap.email) {
      setEmail(snap.email);
      try {
        sessionStorage.setItem("ls_chart_email", snap.email);
        window.dispatchEvent(new CustomEvent("ls-chart-email", { detail: { email: snap.email } }));
      } catch { /* ignore */ }
    }
    if (snap.photo) {
      setPhoto(snap.photo);
      try {
        sessionStorage.setItem("ls_chart_photo", snap.photo);
        window.dispatchEvent(new CustomEvent("ls-chart-photo", { detail: { url: snap.photo } }));
      } catch { /* ignore */ }
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    try {
      const url = `${BIRTH_CHART_ENDPOINT}?date=${encodeURIComponent(snap.date)}`;
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`status ${response.status}`);
      const data = (await response.json()) as PetBirthChart;
      if (!data?.sun) throw new Error("incomplete");
      publishChart(data, { name: snap.name, date: snap.date, species: snap.species, gender: snap.gender });
      setResumeAt(snap.index);
      growFromRef.current = sectionRef.current?.offsetHeight ?? 0;
      setChart(data);
      setStatus("ready");
      window.dispatchEvent(new CustomEvent("ls-resume-status", { detail: { state: "done" } }));
      requestAnimationFrame(() => descendTo("#computed-sky", 0.9));
    } catch (error) {
      console.warn("[Little Souls] resume failed", error);
      setChart(null);
      setStatus("error");
      setMessage("The sky could not place that date. Try it again.");
      window.dispatchEvent(new CustomEvent("ls-resume-status", { detail: { state: "error" } }));
      // The form below is prefilled from the snapshot; take the reader to it.
      requestAnimationFrame(() => descendTo("#computed-sky", 0.9));
    } finally {
      clearTimeout(timeout);
    }
  };
  const restoreRef = useRef(restoreReading);
  restoreRef.current = restoreReading;
  useEffect(() => {
    const onResume = () => { void restoreRef.current(); };
    window.addEventListener("ls-resume-request", onResume);
    // Deep link: /v2?resume=1 restores without a tap. Opened from a fresh
    // tab (an email link) it works off the localStorage snapshot; with no
    // snapshot present the page simply loads as normal.
    try {
      if (new URLSearchParams(window.location.search).get("resume") === "1") void restoreRef.current();
    } catch { /* ignore */ }
    return () => window.removeEventListener("ls-resume-request", onResume);
  }, []);
  // Whichever path opened the deck (fresh compute or restore), tell the
  // resume strip it is no longer needed.
  useEffect(() => {
    if (ready && chart) window.dispatchEvent(new Event("ls-deck-open"));
  }, [ready, chart]);

  // ONE gate, at the start: name (optional) + date + email open the chart.
  // The lead fires the moment they start the free reading (source
  // "free_reading_start"), then the fetch runs in parallel with the compute
  // animation; an 8s abort keeps us off a spinner-of-death.
  // The email error keeps its register-aware wording (copy is locked; only the
  // delivery system changed: adjacent, persistent, never the browser bubble).
  const emailErrCopy = () =>
    memorial ? "Add your email to begin their reading." : "Add your email to get their free reading.";

  // Validate the whole form at once so a two-miss visitor sees both messages
  // beside their fields on the first failed submit, not one per attempt.
  const validateAll = (): { date?: string; species?: string; email?: string } => {
    const errs: { date?: string; species?: string; email?: string } = {};
    if (!date) errs.date = "Choose their birth or adoption date first.";
    else if (date > todayIso()) errs.date = "That day has not happened yet. Choose the day they were born, or the day they came home.";
    if (!species) errs.species = "One tap: are they a dog, a cat, or other?";
    if (!EMAIL_RE.test(email.trim().toLowerCase())) errs.email = emailErrCopy();
    return errs;
  };

  // Bring the first failing field into view and hand it focus.
  const focusFirstError = (errs: { date?: string; species?: string; email?: string }) => {
    const order: Array<["date" | "species" | "email", string]> = [
      ["date", "seal-date"],
      ["species", "seal-species-group"],
      ["email", "seal-email"],
    ];
    const first = order.find(([k]) => errs[k]);
    if (!first) return;
    const el = document.getElementById(first[1]);
    if (!el) return;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    const target = el instanceof HTMLInputElement ? el : el.querySelector<HTMLElement>("button");
    window.setTimeout(() => target?.focus({ preventScroll: true }), reduce ? 0 : 380);
  };

  const handleOpen = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errs = validateAll();
    if (errs.date || errs.species || errs.email) {
      setFieldErrs(errs);
      setStatus("idle");
      setMessage("");
      focusFirstError(errs);
      // Spine: one form_error per failing field so per-field failure rates
      // read straight out of the table. Analytics only.
      (["date", "species", "email"] as const).forEach((field) => {
        if (!errs[field]) return;
        const errorType =
          field === "date" && date && date > todayIso() ? "future_date"
          : field === "email" && email.trim() ? "invalid_format"
          : "missing";
        trackSpine("form_error", { field, error_type: errorType });
      });
      return;
    }
    setFieldErrs({});
    trackSpine("form_submit", {});
    const cleanEmail = email.trim().toLowerCase();
    handleLead(cleanEmail, "free_reading_start");
    setStatus("computing");
    // Mobile fresh-submit lands the compute animation + photo step ~59% below
    // the fold with the primary button clipped at the top. Descend the moment
    // we switch to computing, mirroring the restore path, so the sequence
    // opens centred instead of on a dead screen.
    requestAnimationFrame(() => descendTo("#computed-sky", 0.9));
    setMessage("");
    setChart(null);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    const computeStart = Date.now();
    try {
      const url = `${BIRTH_CHART_ENDPOINT}?date=${encodeURIComponent(date)}`;
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`status ${response.status}`);
      const data = (await response.json()) as PetBirthChart;
      if (!data?.sun) throw new Error("incomplete");
      trackSpine("chart_computed", { latency_ms: Date.now() - computeStart, ok: true });
      setChart(data);
      const petPayload = { name: petName.trim() || null, date, species: species || null, gender: gender || null };
      publishChart(data, petPayload);
      // The recovery snapshot: everything needed to rebuild this deck after a
      // reload or from an emailed deep link. Card index starts at 0 and is
      // patched by the deck on every advance.
      saveResume({ ...petPayload, email: cleanEmail, photo, index: 0 });
    } catch (error) {
      console.warn("[Little Souls] birth chart failed", error);
      // Spine: the silent-failure log the synth called for — every compute
      // failure that used to vanish now leaves a row.
      trackSpine("chart_computed", {
        latency_ms: Date.now() - computeStart,
        ok: false,
        reason: error instanceof Error ? error.message : String(error),
      });
      setChart(null);
      setStatus("error");
      setMessage("The sky could not place that date. Try it again.");
    } finally {
      clearTimeout(timeout);
    }
  };

  // Lead capture: fires at the START of the free reading (the seal card) with
  // source "free_reading_start". Stores the email for the checkout prefill.
  // No on-page unlock, no inbox promise.
  const handleLead = (rawEmail: string, source = "cosmic_journey") => {
    const cleanEmail = rawEmail.trim().toLowerCase();
    if (!/.+@.+\..+/.test(cleanEmail)) return;
    supabase.functions
      .invoke("track-subscriber", {
        // Species rides in so the drip can speak dog vs cat; the photo rides in
        // (when a returning visitor already has one) so the drip can greet them
        // with their own dog before they have opened the full reading.
        body: { email: cleanEmail, event: "birth_chart_lead", petName: petName.trim() || null, species: species || undefined, gender: gender || undefined, birthDate: date || undefined, petPhotoUrl: photo || undefined, source, register: getIntent() === "memorial" ? "memorial" : "discovery", utm: getUtm() },
      })
      .catch((error) => console.warn("[Little Souls] lead capture failed", error));
    try {
      sessionStorage.setItem("ls_chart_email", cleanEmail);
      // Live handoff: the checkout lower on this page prefills its email field
      // the moment the keep gate is submitted (covers submits after it mounts).
      window.dispatchEvent(new CustomEvent("ls-chart-email", { detail: { email: cleanEmail } }));
    } catch { /* ignore */ }
  };

  // Optional photo upload. Compress to JPEG (handles HEIC / huge files), push to
  // the shared pet-photos bucket, keep the public URL. Every failure is soft:
  // the reading never waits on it and never breaks if it fails.
  const handlePhoto = async (file: File) => {
    const isImage = file.type.startsWith("image/") || /\.(heic|heif|webp|avif|jfif|bmp|tiff?)$/i.test(file.name);
    if (!isImage) { setPhotoErr("That file is not an image. Try a photo."); return; }
    if (file.size > 50 * 1024 * 1024) { setPhotoErr("That image is very large. Try one under 50MB."); return; }
    setPhotoErr("");
    setPhotoBusy(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: "image/jpeg",
        initialQuality: 0.85,
      });
      const filename = `${crypto.randomUUID()}.jpg`;
      const { error } = await supabase.storage.from("pet-photos").upload(filename, compressed, {
        cacheControl: "31536000",
        upsert: false,
        contentType: "image/jpeg",
      });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("pet-photos").getPublicUrl(filename);
      const url = urlData.publicUrl;
      setPhoto(url);
      try {
        sessionStorage.setItem("ls_chart_photo", url);
        // Live handoff to the checkout + intake mounted lower on this page.
        window.dispatchEvent(new CustomEvent("ls-chart-photo", { detail: { url } }));
      } catch { /* ignore */ }
      patchResume({ photo: url });
      // If they have already typed a valid email, enrich the lead now so the
      // drip can greet them with their own dog. If the email is not in yet (the
      // photo can be added before it on the form), this simply skips: the submit
      // handler still carries petPhotoUrl into the lead. Fire-and-forget; the
      // reading never waits on it.
      const em = email.trim().toLowerCase();
      if (/.+@.+\..+/.test(em)) {
        supabase.functions
          .invoke("track-subscriber", {
            body: { email: em, event: "birth_chart_lead", petName: petName.trim() || null, species: species || undefined, gender: gender || undefined, birthDate: date || undefined, petPhotoUrl: url, source: "free_reading_start", register: getIntent() === "memorial" ? "memorial" : "discovery", utm: getUtm() },
          })
          .catch((e) => console.warn("[Little Souls] photo enrich failed", e));
      }
    } catch (err) {
      console.warn("[Little Souls] photo upload failed", err);
      setPhotoErr("That did not upload. You can try again, or carry on without it.");
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoErr("");
    try {
      sessionStorage.removeItem("ls_chart_photo");
      window.dispatchEvent(new CustomEvent("ls-chart-photo", { detail: { url: null } }));
    } catch { /* ignore */ }
    patchResume({ photo: null });
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const scrollToCheckout = () => descendTo("#begin");

  return (
    <section id="computed-sky" ref={sectionRef} className={`ls-orrery-section ls-parallax-band${ready && chart ? "" : " is-await"}`}>
      {ready && chart ? (
        <FreeDeck chart={chart} reduce={reduce} photoUrl={photo} name={name} species={species} gender={gender} birthDate={date} initialIndex={resumeAt} />
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
                  // Photo (if any) was captured up front on the form, so there is
                  // no photo interrupt here: the compute animation hands STRAIGHT
                  // into the reading, which always opens on the Sun. Capture the
                  // pre-swap height so the reveal growth tween (SEAM 3) measures
                  // from the compute screen exactly as before.
                  growFromRef.current = sectionRef.current?.offsetHeight ?? 0;
                  setStatus("ready");
                }}
              />
            ) : (
              <form
                className="ls-seal-card ls-stage-card"
                onSubmit={handleOpen}
                noValidate
                // Spine: form_start fires once, on the first focus of any
                // field, carrying which field opened the form. Analytics only.
                onFocusCapture={(e) => {
                  const t = e.target as HTMLElement;
                  const field =
                    t.id === "seal-name" ? "name"
                    : t.id === "seal-date" ? "date"
                    : t.id === "seal-email" ? "email"
                    : t.closest("#seal-species-group") ? "species"
                    : null;
                  if (field) trackSpineOnce("form_start", "form_start", { first_field: field });
                }}
              >
                <p className="ls-seal-lead ls-reveal">Just what you already know about them.</p>
                <p className="ls-seal-deliv ls-reveal" style={revealDelay(0.04)}>Press the button and their chart is drawn from that day's sky. The first part of their reading opens right here, moments later.</p>
                <div className="ls-seal-field ls-reveal" style={revealDelay(0.06)}>
                  <label htmlFor="seal-name">Their name <span>optional</span></label>
                  <input id="seal-name" type="text" autoComplete="off" autoCapitalize="words" value={petName} maxLength={40} onChange={(e) => setPetName(e.target.value)} />
                </div>
                {/* Error state rides in data-err, NOT className: the page reveal
                    observer adds is-in to these .ls-reveal nodes, and a dynamic
                    className would wipe it on re-render (fields vanish). */}
                <div className="ls-seal-field ls-reveal" data-err={fieldErrs.date ? "1" : undefined} style={revealDelay(0.12)}>
                  <label htmlFor="seal-date">The day they were born</label>
                  <input
                    id="seal-date"
                    type="date"
                    value={date}
                    max={todayIso()}
                    aria-invalid={fieldErrs.date ? true : undefined}
                    aria-describedby={fieldErrs.date ? "seal-date-err seal-date-hint" : "seal-date-hint"}
                    onChange={(e) => { setDate(e.target.value); setFieldErrs((p) => ({ ...p, date: undefined })); if (status === "error") { setStatus("idle"); setMessage(""); } }}
                  />
                  {fieldErrs.date && <p id="seal-date-err" className="ls-field-err" role="alert">{fieldErrs.date}</p>}
                  <p id="seal-date-hint" className="ls-seal-hint">Or the day they came home. That chart is just as true.</p>
                </div>
                <div id="seal-species-group" className="ls-seal-field ls-reveal" data-err={fieldErrs.species ? "1" : undefined} style={revealDelay(0.18)}>
                  <label id="seal-species-label">Are they…</label>
                  <div
                    className="ls-seal-species"
                    role="group"
                    aria-labelledby="seal-species-label"
                    aria-describedby={fieldErrs.species ? "seal-species-err" : undefined}
                  >
                    {SPECIES_PICKS.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        className={`ls-species-btn${species === s.value ? " is-sel" : ""}`}
                        aria-pressed={species === s.value}
                        onClick={() => { setSpecies(s.value); setFieldErrs((p) => ({ ...p, species: undefined })); if (status === "error") { setStatus("idle"); setMessage(""); } }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  {fieldErrs.species && <p id="seal-species-err" className="ls-field-err" role="alert">{fieldErrs.species}</p>}
                </div>
                {/* Optional he/she, styled like the species row. Never required,
                    never an error; tapping the selected pill again unsets it.
                    Skipping keeps the reading in its graceful they voice. */}
                <div id="seal-gender-group" className="ls-seal-field ls-reveal" style={revealDelay(0.195)}>
                  <label id="seal-gender-label">He or she? <span>optional</span></label>
                  <div
                    className="ls-seal-species ls-seal-gender"
                    role="group"
                    aria-labelledby="seal-gender-label"
                  >
                    <button
                      type="button"
                      className={`ls-species-btn${gender === "male" ? " is-sel" : ""}`}
                      aria-pressed={gender === "male"}
                      onClick={() => pickGender("male")}
                    >
                      He
                    </button>
                    <button
                      type="button"
                      className={`ls-species-btn${gender === "female" ? " is-sel" : ""}`}
                      aria-pressed={gender === "female"}
                      onClick={() => pickGender("female")}
                    >
                      She
                    </button>
                  </div>
                </div>
                {/* The here/memory choice, captured explicitly ON the form (it
                    used to be a top-of-page toggle a cold visitor missed). Wired
                    to the SAME ls_intent plumbing via setIntent, so it flows to
                    the deck / sell / checkout register exactly as before and is
                    re-read from getIntent() on submit. Defaults to "Here with
                    you" (discovery) — the lower-friction, always-answered choice;
                    a ?r=memorial link preselects "Held in memory". */}
                <div id="seal-register-group" className="ls-seal-field ls-reveal" style={revealDelay(0.21)}>
                  <label id="seal-register-label">Is {name || "your pet"} here with you?</label>
                  <div
                    className="ls-seal-species ls-seal-register"
                    role="group"
                    aria-labelledby="seal-register-label"
                  >
                    <button
                      type="button"
                      className={`ls-species-btn${!memorial ? " is-sel" : ""}`}
                      aria-pressed={!memorial}
                      onClick={() => { setIntent("discovery"); trackSpine("register_set", { value: "discovery", via: "user_tap" }); }}
                    >
                      Here with you
                    </button>
                    <button
                      type="button"
                      className={`ls-species-btn${memorial ? " is-sel" : ""}`}
                      aria-pressed={memorial}
                      onClick={() => { setIntent("memorial"); trackSpine("register_set", { value: "memorial", via: "user_tap" }); }}
                    >
                      Held in memory
                    </button>
                  </div>
                </div>
                <div className="ls-seal-field ls-reveal" data-err={fieldErrs.email ? "1" : undefined} style={revealDelay(0.24)}>
                  <label htmlFor="seal-email">Your email</label>
                  <div className="ls-email-wrap">
                    <input
                      id="seal-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={email}
                      required
                      aria-invalid={fieldErrs.email ? true : undefined}
                      aria-describedby={fieldErrs.email ? "seal-email-err seal-email-hint" : "seal-email-hint"}
                      onChange={(e) => { setEmail(e.target.value); setEmailOk(false); setFieldErrs((p) => ({ ...p, email: undefined })); if (status === "error") { setStatus("idle"); setMessage(""); } }}
                      onBlur={() => {
                        const clean = email.trim().toLowerCase();
                        if (!clean) { setEmailOk(false); return; }
                        if (EMAIL_RE.test(clean)) {
                          setEmailOk(true);
                          setFieldErrs((p) => ({ ...p, email: undefined }));
                        } else {
                          setEmailOk(false);
                          setFieldErrs((p) => ({ ...p, email: emailErrCopy() }));
                        }
                      }}
                    />
                    <span className={`ls-email-ok${emailOk ? " is-on" : ""}`} aria-hidden="true">
                      <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 8.5l3.5 3.5 7.5-8" /></svg>
                    </span>
                  </div>
                  {fieldErrs.email && <p id="seal-email-err" className="ls-field-err" role="alert">{fieldErrs.email}</p>}
                  <p id="seal-email-hint" className="ls-seal-hint">No account needed. Only so their reading can find its way back to you if you step away.</p>
                </div>
                {/* Optional photo, captured up front WITH everything else. Never a
                    gate: skipping it is the effortless default and the chart opens
                    with or without it. Reuses the whole photo plumbing (state,
                    handler, bucket) the old post-submit step used - only the
                    trigger moved onto the form. */}
                <div className="ls-seal-field ls-reveal" style={revealDelay(0.27)}>
                  <label htmlFor="seal-photo">Their photo <span>optional</span></label>
                  <input
                    ref={photoInputRef}
                    id="seal-photo"
                    type="file"
                    accept="image/*,.heic,.heif"
                    className="ls-photo-input"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhoto(f); }}
                  />
                  {photo ? (
                    <div className="ls-photo-preview">
                      <span className="ls-photo-thumb">
                        <span className="ls-photo-thumb-glow" aria-hidden="true" />
                        <img src={photo} alt={name || "Their photo"} draggable={false} />
                      </span>
                      <div className="ls-photo-preview-side">
                        <p className="ls-photo-ready">Added. It becomes part of the reveal.</p>
                        <div className="ls-photo-actions">
                          <button type="button" className="ls-photo-link" onClick={() => photoInputRef.current?.click()}>Change</button>
                          <span aria-hidden="true">·</span>
                          <button type="button" className="ls-photo-link" onClick={removePhoto}>Remove</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={`ls-photo-drop${photoBusy ? " is-busy" : ""}`}
                      onClick={() => photoInputRef.current?.click()}
                      disabled={photoBusy}
                    >
                      {photoBusy ? <span className="ls-photo-spin" aria-hidden="true" /> : <PhotoMark />}
                      <span>{photoBusy ? "Adding their photo" : "Add a photo"}</span>
                    </button>
                  )}
                  <p className="ls-seal-hint">Yours only. It becomes part of the reveal, something to hold on to.</p>
                  {photoErr && <p className="ls-field-err" role="alert">{photoErr}</p>}
                </div>
                <button type="submit" className="ls-seal-cta ls-reveal" style={revealDelay(0.31)}>
                  Set the chart <ArrowRight size={18} />
                </button>
                <p className="ls-seal-free ls-reveal" style={revealDelay(0.34)}>Free. No card, nothing to cancel.</p>
                {message && status === "error" && <p className="ls-chart-message is-error" role="alert">{message}</p>}
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
      <span className="ls-journey-focus-label">{name ? `${capName(name)}'s sky` : "Their sky"}</span>
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

  // Spine: checkout_view — fires once when the checkout section (#begin)
  // first enters the viewport. Analytics only.
  const sectionSpineRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const root = sectionSpineRef.current;
    if (!root || typeof window === "undefined") return;
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          trackSpineOnce("checkout_view", "checkout_view", {});
          io.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={sectionSpineRef}
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

        /* ==== TYPE FLOORS - tuned per viewport (2026-07-14) ==== */
        .ls-pricelead-eyebrow { font-size: 14px; }
        @media (min-width: 768px) { .ls-pricelead-eyebrow { font-size: 14.5px; } }
        @media (min-width: 1280px) { .ls-pricelead-eyebrow { font-size: 15px; } }
      `}</style>
    </section>
  );
}

// ── Sticky begin bar (mobile + desktop) ───────────────────────────────────────
// A slim fixed CTA that appears once the reader passes the desire peak ("Break
// every seal.") and rides with them until the checkout section is on screen —
// no more CTA-less scroll between the peak and the price. Shows on phones
// (<768px) and desktop (>=1024px, enabled 2026-07-17: the long sell run had no
// reachable purchase action on desktop); the 768-1023 tablet band stays clear
// of the shorter layout there. Discovery path only, never on memorial. Anchors
// to #begin via the shared descent so the dawn grade is still seen, not skipped.
function StickyBeginBar() {
  const [memorial, setMemorial] = useState<boolean>(() => getIntent() === "memorial");
  const [on, setOn] = useState(false);
  const { fmt, prices } = useLocalizedPrice();
  useEffect(() => {
    const onIntent = () => setMemorial(getIntent() === "memorial");
    window.addEventListener(INTENT_EVENT, onIntent);
    return () => window.removeEventListener(INTENT_EVENT, onIntent);
  }, []);
  // The peak (.ls-rs-close) only exists once the gated lower funnel mounts,
  // which happens on "ls-reading-revealed" (synthesis card takes the stage) —
  // AFTER the chart computes. Re-run the observer effect on BOTH beats:
  // chart-pet alone fired too early (the peak was not in the DOM yet), so the
  // bar never attached on a first visit (regression QA 2026-07-17).
  const [chartTick, setChartTick] = useState(0);
  useEffect(() => {
    const bump = () => setChartTick((t) => t + 1);
    window.addEventListener("ls-chart-pet", bump);
    window.addEventListener("ls-reading-revealed", bump);
    return () => {
      window.removeEventListener("ls-chart-pet", bump);
      window.removeEventListener("ls-reading-revealed", bump);
    };
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
  }, [memorial, chartTick]);
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
        @media (min-width: 768px) and (max-width: 1023.98px) { .ls-stickybegin { display: none; } }
        @media (prefers-reduced-motion: reduce) { .ls-stickybegin { transition: none; } }

        /* ==== TYPE FLOORS - tuned per viewport (2026-07-14) ==== */
        .ls-stickybegin button { font-size: 18px; }
        @media (min-width: 1280px) { .ls-stickybegin button { font-size: 19px; } }
      `}</style>
    </div>
  );
}

// ── The rest of their sky ─────────────────────────────────────────────────────
// The desire beat between the free reveal and the reviews. The free deck gives
// five worlds (Sun, Moon, Venus, Mercury, Mars); here the eight still dark are
// read one at a time, matching the tease card ledger in freeDeck.ts exactly
// (Saturn, Chiron, Jupiter, Pluto, North Node, Uranus, Neptune, Lilith), with
// the rising named as an honest fact and the synthesis carried by the close.
// Each world is a genuine NASA / observatory disc lit by a moving
// terminator + specular sweep, an atmospheric rim, a slow breath and a drift of
// foreground dust, exactly as the approved reading preview does. The photo never
// spins (a flat disc rotating reads as a sticker); life is implied only by light
// crossing the sphere. No price, no buy button here — those wait below the reviews.
// Discovery path only, and only once a chart has been computed.
type RestKind = "rocky" | "gas" | "ice";
interface RestBody {
  key: string;
  name: string;
  /** Real full-disc photo. Absent for calculated points (North Node renders its bespoke glyph). */
  img?: string;
  /** Override for bodies whose photo is not literally them (Lilith shows the shadowed Moon). */
  imgAlt?: string;
  glow: string;
  kind: RestKind;
  place: { pre: string; em: string; post: string };
  hook: string;
  /* Memorial register: the same trait remembered, not presently performed. */
  memHook?: string;
}
const REST_SKY: RestBody[] = [
  {
    key: "saturn", name: "Saturn", img: NASA_IMG.saturn, glow: "#e6cf9a", kind: "gas",
    place: { pre: "Their quiet ", em: "backbone", post: "" },
    hook: "What they fear, and what steadies them against it. The structure that keeps them sure when everything else moves.",
    memHook: "What they feared, and what steadied them against it. The structure that kept them sure when everything else moved.",
  },
  {
    key: "chiron", name: "Chiron", img: NASA_IMG.chiron, glow: "#9bb8cc", kind: "ice",
    place: { pre: "The old ", em: "hurt", post: "" },
    hook: "What they carry from before you. The tender place that was already there when you met them.",
    memHook: "What they carried from before you. The tender place that was already there when you met.",
  },
  {
    key: "jupiter", name: "Jupiter", img: NASA_IMG.jupiter, glow: "#e0a86a", kind: "gas",
    place: { pre: "Where their joy runs ", em: "biggest", post: "" },
    hook: "Where they overflow. The one place their delight has no ceiling and no shame.",
    memHook: "Where they overflowed. The one place their delight had no ceiling and no shame.",
  },
  {
    key: "pluto", name: "Pluto", img: NASA_IMG.pluto, glow: "#c09080", kind: "rocky",
    place: { pre: "The deep ", em: "pull", post: "" },
    hook: "Who they never quite forgive, and who they claim for good. The undertow that decides both.",
    memHook: "Who they never quite forgave, and who they claimed for good. The undertow that decided both.",
  },
  {
    key: "northNode", name: "North Node", glow: "#cfc0f4", kind: "ice",
    place: { pre: "The ", em: "job", post: " they came to do" },
    hook: "Not what they do. What they are for. The one task their whole life keeps circling.",
    memHook: "Not what they did. What they were for. The one task their whole life kept circling.",
  },
  {
    key: "uranus", name: "Uranus", img: NASA_IMG.uranus, glow: "#9fd8e0", kind: "ice",
    place: { pre: "The ", em: "strange", post: " streak" },
    hook: "The habit no one can explain. The odd little ritual that makes no sense and never has to.",
    memHook: "The habit no one could explain. The odd little ritual that made no sense and never had to.",
  },
  {
    key: "neptune", name: "Neptune", img: NASA_IMG.neptune, glow: "#6f8fe8", kind: "ice",
    place: { pre: "The ", em: "dreaming", post: "" },
    hook: "Where they go when they stare at nothing. The soft fog they drift into, and what finds them there.",
    memHook: "Where they went when they stared at nothing. The soft fog they drifted into, and what found them there.",
  },
  {
    key: "lilith", name: "Lilith", img: NASA_IMG.lilith, imgAlt: "The real Moon in shadow", glow: "#b9b3c9", kind: "rocky",
    place: { pre: "The ", em: "wild", post: " streak" },
    hook: "The note in them nothing tames. The part no routine will ever fully settle, and you would not want it to.",
    memHook: "The note in them nothing tamed. The part no routine ever fully settled, and you never wanted it to.",
  },
];

/* THIRTEEN_ORDER — the single canonical ring order for every thirteen-body
 * motif (rest-close ring, keepsake wheel, checkout wheel). Free five in
 * chart order, then the eight in REST_SKY door-descent order. Angle step
 * is 360/13 = 27.6923deg clockwise from 12 o'clock, everywhere. Never
 * define a second order. (synth 2026-07-16) Exported for DossierCheckout's
 * wheel — consumers inside the ReadingsLanding→InlineCheckout→DossierCheckout
 * import cycle must dereference it lazily (after module eval), never at
 * module top level. */
export const THIRTEEN_ORDER = [
  "sun", "moon", "mercury", "venus", "mars",
  ...REST_SKY.map((b) => b.key),
] as const;

function RestLock() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true">
      <path d="M17 9V7a5 5 0 0 0-10 0v2H5v13h14V9h-2zM9 7a3 3 0 0 1 6 0v2H9V7z" />
    </svg>
  );
}

/* The lit five of the ledger strip — chart order, matching THIRTEEN_ORDER's
 * first five. Discs come from DECK_PHOTO (already cached by the deck). */
const LIT_FIVE: { key: DeckPlanet; label: string }[] = [
  { key: "sun", label: "Sun" },
  { key: "moon", label: "Moon" },
  { key: "mercury", label: "Mercury" },
  { key: "venus", label: "Venus" },
  { key: "mars", label: "Mars" },
];

/* Spelled index words for the eight sealed doors ("one of eight" … ). */
const REST_IDX = ["one", "two", "three", "four", "five", "six", "seven", "eight"];

/* Signs computed for this pet — the ledger strip reads them live. */
type RestSigns = {
  sun?: string | null; moon?: string | null; venus?: string | null;
  mercury?: string | null; mars?: string | null;
};

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
  // The eight still-sealed doors fold behind one seal the reader chooses to
  // break: collapsed by default (the ledger above already named them), a
  // violet gate teasing "eight still sealed" until tapped open.
  const [sealedOpen, setSealedOpen] = useState(false);

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

  // Computed signs feed the ledger strip's lit five ("Sun · Gemini"). Same
  // storage + event pattern as the checkout (DossierCheckout reads it too);
  // degrades to body-name-only labels when signs are absent, never empty.
  const [signs, setSigns] = useState<RestSigns | null>(() => {
    try {
      const raw = sessionStorage.getItem("ls_chart_signs");
      return raw ? (JSON.parse(raw) as RestSigns) : null;
    } catch {
      return null;
    }
  });
  useEffect(() => {
    const onSigns = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail && typeof detail === "object") {
        setSigns(detail as RestSigns);
        return;
      }
      try {
        const raw = sessionStorage.getItem("ls_chart_signs");
        setSigns(raw ? (JSON.parse(raw) as RestSigns) : null);
      } catch {
        setSigns(null);
      }
    };
    window.addEventListener("ls-chart-signs", onSigns as EventListener);
    return () => window.removeEventListener("ls-chart-signs", onSigns as EventListener);
  }, []);

  // The rebuilt section is ~30% shorter and only mounts once a chart exists;
  // re-measure every GSAP ScrollTrigger after the new height lands so
  // downstream triggers (and the sticky Begin bar's peak logic) stay true.
  useEffect(() => {
    if (!pet) return;
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [pet, memorial]);

  // Spine: sell_view — fires once when the sell section (#the-rest) first
  // enters the viewport. Analytics only.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === "undefined") return;
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          trackSpineOnce("sell_view", "sell_view", {});
          io.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    io.observe(root);
    return () => io.disconnect();
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
  const nmRaw = (pet.name || "").trim();
  const nm = capName(nmRaw) || "them";
  const nmPoss = nmRaw ? `${capName(nmRaw)}'s` : "their";

  // One door, one compact tile — all eight at a single consistent scale so the
  // section is a quick, even grid to move through (not a flagship + pairs +
  // wall crescendo, which re-listed the same eight the ledger strip already
  // named). Each tile is the DEPTH moment: a visible sealed world, its title,
  // its hook. The strip stays the quick name ledger; the tiles carry the
  // substance. Both registers honoured (memorial drops seals).
  const door = (body: RestBody, i: number) => (
    <article
      key={body.key}
      className={`ls-rs-row ls-rs-door ls-rs-rv`}
      style={{ ["--glow" as string]: body.glow, ["--rsi" as string]: i } as CSSProperties}
      onPointerDown={(e) => {
        const el = e.currentTarget;
        el.classList.add("is-tried");
        window.setTimeout(() => el.classList.remove("is-tried"), 700);
      }}
    >
      <div className="ls-rs-stage">
        <div className="ls-rs-halo" />
        <div className={`ls-rs-disc is-${body.kind} rs-${body.key}`}>
          {body.img ? (
            <img
              className="ls-rs-photo"
              src={body.img}
              alt={body.imgAlt ?? `The real ${body.name}`}
              loading="lazy"
              decoding="async"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="ls-rs-glyphdisc" aria-hidden="true">
              <AstroGlyph name={body.key} />
            </div>
          )}
          <div className="ls-rs-term" />
          <div className="ls-rs-eclipse" />
          <div className="ls-rs-spec" />
          <div className="ls-rs-rim" />
          <div className="ls-rs-dust" aria-hidden="true" />
        </div>
        {!memorial && (
          <div className="ls-rs-sealring" aria-hidden="true">
            <span className="ls-rs-sealmark"><RestLock /></span>
          </div>
        )}
      </div>
      <div className="ls-rs-copy">
        <div className="ls-rs-name">{body.name}</div>
        <h3 className="ls-rs-placement">
          {body.place.pre}<em>{body.place.em}</em>{body.place.post}
        </h3>
        <p className="ls-rs-hook">{memorial && body.memHook ? body.memHook : body.hook}</p>
      </div>
    </article>
  );

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
                What you just read was the glance.
              </h2>
              <p className="ls-rs-lead ls-rs-rv" style={revealDelay(0.1)}>
                Those five placements were one line each. The full reading takes every one of them all the way down, and opens the eight still sealed below.
              </p>
            </>
          )}
        </header>

        {/* BEAT 1 — the ledger strip. Five burning, eight extinguished: the
            section's sole lit-vs-dark contrast moment, felt in one glance. */}
        <div
          className="ls-rs-ledger ls-rs-rv"
          role="list"
          aria-label={`${nmPoss} thirteen placements: five read, eight sealed`}
        >
          <div className="ls-rs-led-grp is-lit">
            <span className="ls-rs-led-cap">Read. Yours to keep.</span>
            <div className="ls-rs-led-orbs">
              {LIT_FIVE.map((b, i) => (
                <span key={b.key} role="listitem" className="ls-rs-led-orb" style={{ ["--gi" as string]: i } as CSSProperties}>
                  <span className="ls-rs-led-disc">
                    <img src={DECK_PHOTO[b.key]} alt="" loading="lazy" decoding="async" />
                  </span>
                  <small className="ls-rs-led-sign">
                    <span className="ls-rs-led-body">{b.label}</span>
                    {signs?.[b.key] ? <span className="ls-rs-led-sg">{signs[b.key]}</span> : null}
                  </small>
                </span>
              ))}
            </div>
          </div>
          <span className="ls-rs-led-vr" aria-hidden="true" />
          <div className="ls-rs-led-grp is-dark">
            <span className="ls-rs-led-cap">{memorial ? "Their eight, still to read." : "Still sealed."}</span>
            <div className="ls-rs-led-orbs">
              {REST_SKY.map((b, i) => (
                <span key={b.key} role="listitem" className="ls-rs-led-orb" style={{ ["--gi" as string]: 5 + i } as CSSProperties}>
                  <span className="ls-rs-led-disc">
                    {b.img ? (
                      <img src={b.img} alt="" loading="lazy" decoding="async" />
                    ) : (
                      <span className="ls-rs-led-glyph" aria-hidden="true"><AstroGlyph name={b.key} /></span>
                    )}
                  </span>
                  <small className="ls-rs-led-sign">{b.name}</small>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* BEAT 2 — the eight still sealed, folded behind one seal the reader
            chooses to break. Collapsed by default so the section teases (the
            lock, "eight still sealed") without dumping all eight; the ledger
            strip above already named them. Discovery keeps the wax + lock;
            memorial hides seals per the register logic and reads "their eight,
            still to read". Every world is a real sealed disc, dimmed and
            locked, not blacked out. Every hook verbatim, both registers.
            Smooth grid-rows expand; reduced motion just shows/hides. */}
        <div className={`ls-rs-sealed ls-rs-rv${sealedOpen ? " is-open" : ""}`}>
          <button
            type="button"
            className="ls-rs-sealtoggle"
            aria-expanded={sealedOpen}
            aria-controls="ls-rs-sealed-panel"
            onClick={() => setSealedOpen((v) => !v)}
          >
            {!memorial && (
              <span className="ls-rs-st-wax" aria-hidden="true"><RestLock /></span>
            )}
            <span className="ls-rs-st-text">
              <span className="ls-rs-st-label">
                {memorial ? "Their eight, still to read" : "Sealed in the full reading"}
              </span>
              {!memorial && (
                <span className="ls-rs-st-sub">{sealedOpen ? "The eight, unsealed" : "Eight still sealed"}</span>
              )}
            </span>
            <span className="ls-rs-st-chev" aria-hidden="true">
              <ChevronDown size={20} strokeWidth={1.6} />
            </span>
          </button>
          <div id="ls-rs-sealed-panel" className="ls-rs-sealpanel" role="region" aria-hidden={!sealedOpen}>
            <div className="ls-rs-sealpanel-in">
              <div className="ls-rs-sky">
                <div className="ls-rs-grid">
                  {REST_SKY.map((b, i) => door(b, i))}
                </div>
                {/* the rising, folded in as the quiet ninth — one honest line,
                    not its own text block. It needs the exact birth minute,
                    which a date-only chart cannot fix, so it lives here with
                    the still-sealed rather than among the read. */}
                <p className="ls-rs-rising ls-rs-seal-rising">
                  {!memorial && <RestLock />}
                  {memorial
                    ? "And the rising, the first face they showed, set by the exact minute they arrived."
                    : "And the rising, the first face they show, set by the exact minute they arrived."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* BEAT 4 — the close: the thirteen assembled into one chart ring
            (THIRTEEN_ORDER, 360/13 steps) above the filled primary CTA. */}
        {!memorial && (
          <div className="ls-rs-close ls-rs-rv">
            <p className="sr-only">Five placements read, eight sealed in the full reading.</p>
            <h2 className="ls-rs-close-title">All thirteen, read as one.</h2>
            <p className="ls-rs-close-line">
              The full reading opens every seal and reads them together, written for {nm} alone and no other soul.
            </p>
            <button type="button" className="ls-rs-close-cta" onClick={() => descendTo("#the-more")}>
              See everything it holds
              <ChevronDown size={20} strokeWidth={1.6} />
            </button>
          </div>
        )}
      </div>
      <style>{`
        /* The section paints its own opaque cosmos so nothing from an adjacent band
           ever bleeds through the sealed sky. Grain + wash + per-planet halos carry
           the premium atmosphere; the planets themselves carry the life. */
        .ls-rs { position: relative; z-index: 1; overflow: hidden; background: ${C.cosmos}; padding: clamp(84px, 11svh, 128px) 20px clamp(38px, 5vw, 84px); scroll-margin-top: 80px; --e-stage: cubic-bezier(0.22, 0.7, 0.2, 1); --e-settle: cubic-bezier(0.16, 1, 0.3, 1); --e-draw: cubic-bezier(0.4, 0, 0.2, 1); }
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

        /* BEAT 1 - the ledger strip: five burning, eight extinguished */
        .ls-rs-ledger { display: flex; flex-direction: column; align-items: center; gap: 18px; max-width: 1000px; margin: 0 auto clamp(40px, 6vw, 64px); }
        .ls-rs-led-grp { display: flex; flex-direction: column; align-items: center; gap: 12px; min-width: 0; }
        .ls-rs-led-orbs { display: flex; align-items: flex-start; justify-content: center; flex-wrap: wrap; gap: 12px 6px; }
        .ls-rs-led-orb { flex: 0 0 auto; }
        @media (min-width: 480px) { .ls-rs-led-orbs { gap: 12px 14px; } }
        .ls-rs-led-cap { font-family: "Newsreader", Georgia, serif; font-size: 13px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; }
        .ls-rs-led-grp.is-lit .ls-rs-led-cap { color: ${C.goldSoft}; }
        .ls-rs-led-grp.is-dark .ls-rs-led-cap { color: rgba(200,200,210,0.6); }
        .ls-rs-led-orb { display: flex; flex-direction: column; align-items: center; gap: 7px; max-width: 76px; min-width: 0; }
        .ls-rs-led-disc { position: relative; display: block; border-radius: 50%; }
        .ls-rs-led-disc img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block; background: #050310; }
        .ls-rs-led-grp.is-lit .ls-rs-led-disc { width: 44px; height: 44px; box-shadow: 0 0 0 1px rgba(207,192,244,0.35); }
        .ls-rs-led-grp.is-lit .ls-rs-led-disc img { filter: brightness(1.02); }
        .ls-rs-led-grp.is-lit .ls-rs-led-disc::after { content: ""; position: absolute; inset: -30%; border-radius: 50%; background: radial-gradient(circle, rgba(154,126,230,0.35), transparent 70%); filter: blur(6px); z-index: -1; opacity: 0; }
        .ls-rs-led-grp.is-dark .ls-rs-led-disc { width: 32px; height: 32px; box-shadow: 0 0 0 1px rgba(154,126,230,0.18); }
        .ls-rs-led-grp.is-dark .ls-rs-led-disc img { filter: brightness(0.5) saturate(0.72); }
        .ls-rs-led-glyph { position: absolute; inset: 0; display: grid; place-items: center; border-radius: 50%; background: radial-gradient(circle at 38% 32%, #120c24 0%, #090618 62%, #050310 100%); }
        .ls-rs-led-glyph svg { width: 55%; height: 55%; color: rgba(154,126,230,0.4); }
        .ls-rs-led-sign { font-family: "Newsreader", Georgia, serif; font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; text-align: center; line-height: 1.35; }
        .ls-rs-led-body, .ls-rs-led-sg { display: block; }
        .ls-rs-led-grp.is-lit .ls-rs-led-sign { color: ${C.goldSoft}; }
        .ls-rs-led-grp.is-lit .ls-rs-led-sg { opacity: 0.78; }
        .ls-rs-led-grp.is-dark .ls-rs-led-sign { color: rgba(200,200,210,0.55); }
        .ls-rs-led-vr { display: none; }
        /* ledger entry - lit five seat first, then the dark eight */
        .ls-rs-led-orb { opacity: 0; }
        .ls-rs-ledger[data-in] .ls-rs-led-orb { animation: lsRsLedIn 0.5s var(--e-stage) forwards; animation-delay: calc(0.05s + var(--gi, 0) * 0.04s); }
        @keyframes lsRsLedIn { from { opacity: 0; transform: translateY(10px) scale(0.92); } to { opacity: 1; transform: none; } }
        .ls-rs-ledger[data-in] .ls-rs-led-grp.is-lit .ls-rs-led-disc::after { animation: lsRsLedHalo 0.5s ease-out forwards; animation-delay: 1.05s; }
        @keyframes lsRsLedHalo { to { opacity: 1; } }

        /* the seal gate — the approved phrase becomes the control that opens the
           eight; collapsed by default, a violet wax-seal the reader breaks */
        .ls-rs-sealed { max-width: 720px; margin: 0 auto; }
        .ls-rs-sealtoggle {
          display: flex; align-items: center; gap: clamp(13px, 2.4vw, 18px); width: 100%;
          padding: clamp(14px, 2.4vw, 18px) clamp(16px, 3vw, 24px);
          border-radius: 16px; cursor: pointer; text-align: left; -webkit-tap-highlight-color: transparent;
          border: 1px solid rgba(154,126,230,0.30);
          background:
            radial-gradient(130% 180% at 10% 0%, rgba(124,92,214,0.20), transparent 60%),
            linear-gradient(180deg, rgba(32,23,34,0.72), rgba(21,16,28,0.74));
          box-shadow: inset 0 1px 0 rgba(226,220,240,0.06), 0 16px 42px -18px rgba(6,4,12,0.85);
          transition: border-color 0.35s var(--e-stage), box-shadow 0.35s var(--e-stage), transform 0.35s var(--e-stage);
        }
        .ls-rs-sealtoggle:hover { border-color: rgba(185,165,240,0.5); box-shadow: inset 0 1px 0 rgba(226,220,240,0.09), 0 20px 48px -18px rgba(124,92,214,0.5); }
        .ls-rs-sealtoggle:active { transform: translateY(1px); }
        .ls-rs-sealtoggle:focus-visible { outline: 2px solid ${C.goldSoft}; outline-offset: 3px; }
        .ls-rs-st-wax {
          flex: 0 0 auto; display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%;
          color: ${C.goldSoft};
          background: radial-gradient(circle at 38% 30%, #26192f 0%, #15101c 72%);
          border: 1px solid rgba(185,165,240,0.45); box-shadow: 0 0 0 4px rgba(124,92,214,0.10);
        }
        .ls-rs-st-wax svg { width: 15px; height: 16px; }
        .ls-rs-st-text { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
        .ls-rs-st-label { color: ${C.gold}; font-family: "Newsreader", Georgia, serif; font-size: 14px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; }
        .ls-rs-st-sub { color: ${C.muted}; font-family: "Newsreader", Georgia, serif; font-style: italic; font-size: 15px; opacity: 0.85; }
        .ls-rs-st-chev {
          flex: 0 0 auto; display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%;
          color: ${C.violetBright}; border: 1px solid rgba(154,126,230,0.30);
          transition: transform 0.42s var(--e-stage), background 0.35s var(--e-stage), border-color 0.35s var(--e-stage);
        }
        .ls-rs-sealtoggle:hover .ls-rs-st-chev { border-color: rgba(185,165,240,0.55); }
        .ls-rs-sealed.is-open .ls-rs-st-chev { transform: rotate(180deg); background: rgba(124,92,214,0.18); }
        /* smooth grid-rows reveal, no height measuring */
        .ls-rs-sealpanel { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.55s var(--e-settle); }
        .ls-rs-sealed.is-open .ls-rs-sealpanel { grid-template-rows: 1fr; }
        .ls-rs-sealpanel-in { overflow: hidden; min-height: 0; padding-top: clamp(26px, 4.4vw, 42px); }

        /* BEAT 2 - the sealed sky: eclipsed worlds staged as ONE crescendo.
           Three scales (flagship / pair / wall) replace the eight equal rows so
           the section reads as a descent into the still-sealed dark, not a
           copy-paste. The disc machinery is scale-driven by --rs-disc, so each
           tier just resizes the same world. */
        .ls-rs-sky { position: relative; max-width: 1000px; margin: 0 auto; }
        .ls-rs-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: clamp(28px, 6.5vw, 40px) clamp(14px, 4vw, 26px); }
        .ls-rs-spine { display: none; }
        .ls-rs-row { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; text-align: center; gap: clamp(11px, 2.6vw, 15px); }

        /* one even scale for all eight compact tiles (Saturn first). The disc
           stays large enough to read the world at a glance on a phone. */
        .ls-rs-door .ls-rs-stage { --rs-disc: clamp(98px, 28vw, 128px); width: clamp(114px, 32vw, 150px); height: clamp(114px, 32vw, 150px); }
        .ls-rs-door .ls-rs-placement { font-size: clamp(1.26rem, 5vw, 1.52rem); }
        @media (min-width: 560px) {
          .ls-rs-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); column-gap: clamp(16px, 2.4vw, 30px); row-gap: clamp(32px, 4vw, 48px); }
        }
        @media (min-width: 900px) {
          .ls-rs-door .ls-rs-stage { --rs-disc: clamp(112px, 11vw, 132px); width: clamp(132px, 13vw, 156px); height: clamp(132px, 13vw, 156px); }
          .ls-rs-door .ls-rs-placement { font-size: clamp(1.36rem, 1.7vw, 1.58rem); }
        }

        /* the eclipsed world - dark behind its seal, one thin crescent of life */
        .ls-rs-stage {
          position: relative; flex: 0 0 auto; display: grid; place-items: center;
          --rs-disc: clamp(112px, 32vw, 132px);
          width: clamp(132px, 36vw, 156px); height: clamp(132px, 36vw, 156px);
          transform: translate3d(calc(var(--ls-pointer-x, 0) * 7px), calc(var(--ls-pointer-y, 0) * 6px), 0);
          will-change: transform;
        }
        .ls-rs-halo {
          position: absolute; inset: 0; border-radius: 50%; z-index: 1; pointer-events: none;
          background: radial-gradient(circle,
            color-mix(in srgb, var(--glow) 34%, transparent) 0%,
            color-mix(in srgb, var(--glow) 14%, transparent) 30%,
            transparent 58%);
          filter: blur(10px); opacity: 0.28;
          transition: opacity 0.45s var(--e-stage);
          animation: lsRsBreathe 5.8s ease-in-out infinite; animation-delay: calc(var(--rsi, 0) * -0.5s); animation-play-state: paused;
        }
        @keyframes lsRsBreathe { 0%, 100% { opacity: 0.22; } 50% { opacity: 0.36; } }

        .ls-rs-disc {
          position: relative; z-index: 2; width: var(--rs-disc); height: var(--rs-disc);
          border-radius: 50%; overflow: hidden; isolation: isolate;
          box-shadow: 0 0 0 1px rgba(226,220,240,0.10), 0 20px 56px rgba(4,2,12,0.66);
          animation: lsRsBreatheDisc 7.4s ease-in-out infinite; animation-delay: calc(var(--rsi, 0) * -0.6s); animation-play-state: paused;
        }
        @keyframes lsRsBreatheDisc { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.016); } }
        .ls-rs-photo {
          position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block;
          transform: scale(1.03); filter: brightness(0.66) contrast(1.02) saturate(0.85); background: #050310;
        }
        /* STILL day/night shading - light reads from the upper-left. */
        .ls-rs-term {
          position: absolute; top: 0; left: 0; z-index: 3; width: 100%; height: 100%; border-radius: 50%;
          transform: none; pointer-events: none;
          background: radial-gradient(circle at 66% 40%,
            rgba(6,4,14,0) 44%, rgba(6,4,14,0.20) 76%, rgba(8,5,17,0.40) 100%);
        }
        /* the seal shadow - a soft terminator across the lower-right so the world
           reads sealed and dimmed, while the lit upper-left keeps every disc's
           real features visible (never crushed to black). */
        .ls-rs-eclipse {
          position: absolute; inset: 0; z-index: 3; border-radius: 50%; pointer-events: none;
          background: radial-gradient(circle at 74% 64%,
            rgba(6,4,14,0.60) 0%, rgba(6,4,14,0.38) 44%, rgba(6,4,14,0.14) 76%, transparent 100%);
        }
        /* the limb crescent - one language for all eight; alive, never lit.
           Amber survives ONLY here (Saturn/Jupiter limb light on the photo). */
        .ls-rs-spec {
          position: absolute; top: 0; left: 0; z-index: 4; width: 100%; height: 100%; border-radius: 50%;
          transform-origin: 50% 50%; mix-blend-mode: screen; pointer-events: none;
          background: radial-gradient(circle at 30% 26%,
            color-mix(in srgb, var(--glow) 34%, white) 0%,
            color-mix(in srgb, var(--glow) 14%, transparent) 18%, transparent 34%);
          opacity: 0.22; will-change: opacity, transform;
          transition: opacity 0.45s var(--e-stage), transform 0.45s var(--e-stage);
          animation: lsRsCrescent 7s ease-in-out infinite;
          animation-delay: calc(var(--rsi, 0) * -0.9s); animation-play-state: paused;
        }
        @keyframes lsRsCrescent { 0%, 100% { opacity: 0.18; } 50% { opacity: 0.34; } }
        /* Saturn - hold the full rings inside the circular frame (square 512 asset) */
        .ls-rs-disc.rs-saturn .ls-rs-photo { transform: scale(0.98); }
        /* Lilith is already the shadowed Moon - ease her eclipse so she never goes fully black */
        .ls-rs-disc.rs-lilith .ls-rs-eclipse { opacity: 0.5; }

        /* the seal - a ring held shut by a wax mark (discovery only) */
        .ls-rs-sealring {
          position: absolute; inset: 0; margin: auto; z-index: 3; pointer-events: none;
          width: calc(var(--rs-disc) * 1.18); height: calc(var(--rs-disc) * 1.18);
          border-radius: 50%; border: 1px solid rgba(185,165,240,0.34);
        }
        .ls-rs-sealmark {
          position: absolute; left: 50%; bottom: -13px; transform: translateX(-50%);
          width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center;
          background: #15101c; border: 1px solid rgba(185,165,240,0.5); color: ${C.goldSoft};
          transition: box-shadow 0.45s var(--e-stage);
        }
        .ls-rs-sealmark svg { width: 12px; height: 12px; }

        /* the key almost turns - the door answers, and holds */
        .ls-rs-row:hover .ls-rs-spec, .ls-rs-row.is-tried .ls-rs-spec { animation: none; opacity: 0.42; transform: rotate(8deg); }
        .ls-rs-row:hover .ls-rs-halo, .ls-rs-row.is-tried .ls-rs-halo { animation: none; opacity: 0.5; }
        .ls-rs-row:hover .ls-rs-sealmark, .ls-rs-row.is-tried .ls-rs-sealmark { box-shadow: 0 0 0 4px rgba(185,165,240,0.18); }
        /* limb darkening, rocky worlds read as spheres (softened so the disc
           stays legible, not a black ball) */
        .ls-rs-disc::after { content: ""; position: absolute; inset: 0; border-radius: 50%; z-index: 5; pointer-events: none; box-shadow: inset 0 0 22px 6px rgba(4,2,12,0.36); }
        /* limb brighten, gas giants + atmospheres get a warm rim */
        .ls-rs-disc.is-gas::after { box-shadow: inset 0 0 22px 6px rgba(4,2,12,0.24), inset 0 0 12px 2px color-mix(in srgb, var(--glow) 40%, transparent); }
        .ls-rs-disc.is-ice::after { box-shadow: inset 0 0 20px 6px rgba(4,2,12,0.28), inset 0 0 10px 1px color-mix(in srgb, var(--glow) 34%, transparent); }
        .ls-rs-rim { position: absolute; inset: 0; border-radius: 50%; z-index: 6; pointer-events: none; box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--glow) 55%, transparent); }
        .ls-rs-disc.is-gas .ls-rs-rim, .ls-rs-disc.is-ice .ls-rs-rim { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--glow) 70%, transparent), inset 0 0 8px 0 color-mix(in srgb, var(--glow) 40%, transparent); }
        /* calculated points (North Node) - no photograph exists, so the bespoke
           glyph sits on a dark sphere and the same light machine plays over it */
        .ls-rs-glyphdisc { position: absolute; inset: 0; display: grid; place-items: center; background: radial-gradient(circle at 38% 32%, #191231 0%, #0b0720 62%, #060412 100%); }
        .ls-rs-glyphdisc svg { width: 44%; height: 44%; color: color-mix(in srgb, var(--glow) 85%, white); opacity: 0.92; filter: drop-shadow(0 0 16px color-mix(in srgb, var(--glow) 50%, transparent)); }
        /* Lilith - the real Moon held in shadow (the dark Moon). Important so the
           memorial and reduced-motion photo filters never lift the dark. */
        .ls-rs-disc.rs-lilith .ls-rs-photo { filter: brightness(0.62) contrast(1.05) saturate(0.75) !important; }
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

        /* the copy — compact tile: a small planet name, the evocative title as
           the star, one hook line beneath. Tight vertical rhythm so the eight
           read quickly and never as a second name-list. */
        .ls-rs-copy { width: 100%; min-width: 0; }
        .ls-rs-idx { display: none; }
        .ls-rs-name { display: flex; align-items: center; justify-content: center; gap: 8px; margin: 0 0 6px; color: ${C.violetBright}; font-family: "Newsreader", Georgia, serif; font-size: 12.5px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; }
        .ls-rs-name::before, .ls-rs-name::after { content: ""; width: 14px; height: 1px; background: linear-gradient(90deg, transparent, rgba(185,165,240,0.5)); }
        .ls-rs-placement { margin: 0 0 7px; color: ${C.cream}; font-family: "Fraunces", Georgia, serif; font-weight: 500; font-size: clamp(1.5rem, 5.4vw, 2.05rem); line-height: 1.1; letter-spacing: -0.015em; }
        .ls-rs-placement em { font-style: italic; color: ${C.goldSoft}; }
        .ls-rs-hook { margin: 0 auto; max-width: 25ch; color: ${C.muted}; font-family: "Newsreader", Georgia, serif; font-size: clamp(0.95rem, 3.7vw, 1.02rem); line-height: 1.46; }
        .ls-rs-door .ls-rs-hook { font-size: 15.5px; }
        @media (min-width: 900px) { .ls-rs-door .ls-rs-hook { font-size: 16px; max-width: 24ch; } }

        /* the rising, folded into the sealed panel as a quiet ninth line —
           the drawn horizon block was retired (2026-07-19: badly placed, too
           text-heavy); the honest exact-minute point now lives here, with the
           still-sealed, in one line instead of its own beat. */
        .ls-rs-rising { margin: 0 auto; max-width: 46ch; text-align: center; color: ${C.muted}; font-family: "Newsreader", Georgia, serif; font-style: italic; font-size: clamp(1rem, 2.5vw, 1.14rem); line-height: 1.55; }
        .ls-rs-seal-rising { display: flex; align-items: center; justify-content: center; gap: 10px; margin: clamp(30px, 5vw, 46px) auto 0; padding-top: clamp(22px, 3.4vw, 30px); max-width: 42ch; border-top: 1px solid rgba(185,165,240,0.15); opacity: 0.92; }
        .ls-rs-seal-rising svg { flex: 0 0 auto; width: 13px; height: 14px; color: ${C.violetBright}; opacity: 0.75; }

        /* BEAT 4 - the close: the one real door, straight to the CTA */
        .ls-rs-close { text-align: center; max-width: 560px; margin: clamp(46px, 7vw, 84px) auto 0; }
        /* the CTA - the section's one job, a real filled primary (StickyBeginBar recipe) */
        .ls-rs-close-cta { display: inline-flex; align-items: center; gap: 12px; margin-top: clamp(20px, 3.6vw, 30px); padding: clamp(16px, 2.6vw, 20px) clamp(34px, 5vw, 46px); border-radius: 999px; border: 0; background: linear-gradient(180deg, #a78bfa 0%, #8266d9 45%, #6a4cc4 100%); color: #ffffff; font-family: "Newsreader", Georgia, serif; font-size: 19px; font-weight: 700; letter-spacing: 0.01em; cursor: pointer; box-shadow: 0 1px 0 rgba(255,255,255,0.4) inset, 0 -1px 0 rgba(0,0,0,0.28) inset, 0 14px 40px -8px rgba(124,92,214,0.55); transition: transform 0.3s var(--e-stage), box-shadow 0.3s var(--e-stage); }
        .ls-rs-close-cta:hover { transform: translateY(-2px); box-shadow: 0 1px 0 rgba(255,255,255,0.4) inset, 0 -1px 0 rgba(0,0,0,0.28) inset, 0 18px 48px -8px rgba(124,92,214,0.65); }
        .ls-rs-close-cta:focus-visible { outline: 2px solid ${C.goldSoft}; outline-offset: 3px; }
        .ls-rs-close-cta svg { animation: lsRsNudge 2.4s ease-in-out infinite; }
        @keyframes lsRsNudge { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(4px); } }
        .ls-rs-close-title { margin: 0 0 14px; color: ${C.cream}; font-family: "Fraunces", Georgia, serif; font-weight: 500; font-size: clamp(1.7rem, 5vw, 2.6rem); line-height: 1.06; letter-spacing: -0.015em; }
        .ls-rs-close-line { margin: 0 auto; max-width: 42ch; color: ${C.creamDim}; font-family: "Newsreader", Georgia, serif; font-size: clamp(1.02rem, 2.5vw, 1.18rem); line-height: 1.55; }

        /* reveal - opacity + rise on mobile, blur added on desktop */
        .ls-rs-rv { opacity: 0; transform: translate3d(0, 22px, 0); transition: opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.95s cubic-bezier(0.16,1,0.3,1); transition-delay: var(--ls-delay, 0s); will-change: opacity, transform; }
        .ls-rs-rv[data-in] { opacity: 1; transform: translate3d(0,0,0); }

        @media (min-width: 768px) {
          .ls-rs { padding: clamp(96px, 13svh, 140px) 24px clamp(48px, 6vw, 104px); }
          .ls-rs-hook { margin: 0 auto; }
          .ls-rs-led-grp.is-lit .ls-rs-led-disc { width: 56px; height: 56px; }
          .ls-rs-led-grp.is-dark .ls-rs-led-disc { width: 44px; height: 44px; }
          .ls-rs-rv { filter: blur(6px); transition: opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.95s cubic-bezier(0.16,1,0.3,1), filter 0.9s cubic-bezier(0.16,1,0.3,1); }
          .ls-rs-rv[data-in] { filter: blur(0); }
        }
        @media (min-width: 1100px) {
          .ls-rs-ledger { flex-direction: row; align-items: flex-start; justify-content: center; flex-wrap: wrap; gap: 18px 0; max-width: none; }
          .ls-rs-led-vr { display: block; width: 1px; height: 44px; background: rgba(154,126,230,0.28); margin: 34px 20px 0; flex: 0 0 auto; }
          .ls-rs-led-orbs { flex-wrap: nowrap; gap: 12px 8px; }
        }

        /* memorial - the same eclipsed worlds, hushed: no seals, no locks, no
           counts, warmer crescent. Still alive, still theirs. */
        .ls-rs.is-memorial .ls-rs-wash {
          background:
            radial-gradient(120% 84% at 50% -8%, rgba(120,108,150,0.12), transparent 58%),
            radial-gradient(120% 100% at 50% 46%, transparent 58%, rgba(6,4,12,0.6) 100%);
        }
        .ls-rs.is-memorial .ls-rs-spec { opacity: 0.28; }
        .ls-rs.is-memorial .ls-rs-sealring, .ls-rs.is-memorial .ls-rs-idx { display: none; }

        /* reduced motion: the rest state IS the finished composition - worlds
           eclipsed, crescents lit and still, ledger placed, ring assembled,
           horizon risen. No sweeps, no drift, no dust, no glint. */
        @media (prefers-reduced-motion: reduce) {
          .ls-rs-halo, .ls-rs-disc, .ls-rs-term, .ls-rs-spec, .ls-rs-dust span,
          .ls-rs-led-orb, .ls-rs-led-disc::after,
          .ls-rs-close-cta, .ls-rs-close-cta svg { animation: none !important; }
          .ls-rs-spec { opacity: 0.30 !important; transform: none !important; transition: none !important; }
          .ls-rs-halo { opacity: 0.28 !important; transform: none !important; transition: none !important; }
          .ls-rs-stage { transform: none !important; }
          .ls-rs-led-orb { opacity: 1 !important; transform: none !important; }
          .ls-rs-led-disc::after { opacity: 1 !important; }
          .ls-rs-hz-line { transform: none !important; transition: none !important; }
          .ls-rs-hz-disc, .ls-rs-hz-glow { opacity: 1 !important; transform: none !important; transition: none !important; }
          .ls-rs-sealmark { transition: none !important; box-shadow: none !important; }
          .ls-rs-sealpanel, .ls-rs-st-chev, .ls-rs-sealtoggle { transition: none !important; }
          .ls-rs-row:hover .ls-rs-spec, .ls-rs-row.is-tried .ls-rs-spec { opacity: 0.30 !important; transform: none !important; }
          .ls-rs-row:hover .ls-rs-halo, .ls-rs-row.is-tried .ls-rs-halo { opacity: 0.28 !important; }
          .ls-rs-rv { opacity: 1 !important; transform: none !important; filter: none !important; transition: none !important; }
          .ls-rs-close-cta { transform: none !important; transition: none !important; }
        }
        /* .is-static mirror (same finished-composition rest state, class-driven) */
        .ls-rs.is-static .ls-rs-halo, .ls-rs.is-static .ls-rs-disc, .ls-rs.is-static .ls-rs-term, .ls-rs.is-static .ls-rs-spec, .ls-rs.is-static .ls-rs-dust span,
        .ls-rs.is-static .ls-rs-led-orb, .ls-rs.is-static .ls-rs-led-disc::after,
        .ls-rs.is-static .ls-rs-close-cta, .ls-rs.is-static .ls-rs-close-cta svg { animation: none !important; }
        .ls-rs.is-static .ls-rs-spec { opacity: 0.30 !important; transform: none !important; transition: none !important; }
        .ls-rs.is-static .ls-rs-halo { opacity: 0.28 !important; transform: none !important; transition: none !important; }
        .ls-rs.is-static .ls-rs-stage { transform: none !important; }
        .ls-rs.is-static .ls-rs-led-orb { opacity: 1 !important; transform: none !important; }
        .ls-rs.is-static .ls-rs-led-disc::after { opacity: 1 !important; }
        .ls-rs.is-static .ls-rs-sealpanel { transition: none !important; }
        .ls-rs.is-static .ls-rs-hz-line { transform: none !important; transition: none !important; }
        .ls-rs.is-static .ls-rs-hz-disc, .ls-rs.is-static .ls-rs-hz-glow { opacity: 1 !important; transform: none !important; transition: none !important; }
        .ls-rs.is-static .ls-rs-sealmark { transition: none !important; box-shadow: none !important; }
        .ls-rs.is-static .ls-rs-rv { opacity: 1 !important; transform: none !important; filter: none !important; transition: none !important; }
        .ls-rs.is-static .ls-rs-close-cta { transform: none !important; transition: none !important; }

        /* ==== TYPE FLOORS - tuned per viewport (2026-07-14; rest rebuild 2026-07-16) ==== */
        .ls-rs-eyebrow, .ls-rs-sealline, .ls-rs-hz-label { font-size: 14px; }
        .ls-rs-lead { font-size: 18px; }
        .ls-rs-hook { font-size: 18px; }
        .ls-rs-rising { font-size: 18px; }
        .ls-rs-close-line { font-size: 18px; }
        .ls-rs-close-cta { font-size: 19px; }
        .ls-rs-led-cap { font-size: 13px; }
        .ls-rs-idx { font-size: 12.5px; }
        @media (min-width: 768px) {
          .ls-rs-eyebrow, .ls-rs-sealline, .ls-rs-hz-label { font-size: 14.5px; }
          .ls-rs-lead, .ls-rs-hook, .ls-rs-rising, .ls-rs-close-line { font-size: 18.5px; }
          .ls-rs-close-cta { font-size: 19px; }
          .ls-rs-led-cap { font-size: 14px; }
          .ls-rs-idx, .ls-rs-led-sign { font-size: 12.5px; }
        }
        @media (min-width: 1280px) {
          .ls-rs-eyebrow, .ls-rs-sealline, .ls-rs-hz-label { font-size: 15px; }
          .ls-rs-lead { font-size: 19.5px; }
          .ls-rs-hook, .ls-rs-rising, .ls-rs-close-line { font-size: 19px; }
          .ls-rs-close-cta { font-size: 20px; }
          .ls-rs-idx { font-size: 13px; }
          /* led-sign stays 12.5px at 1280: 13px overflows the one-row ledger
             (measured 1078px vs the 1000px rail) - flagged for Danny */
          .ls-rs-led-sign { font-size: 12.5px; }
        }
      `}</style>
    </section>
  );
}

// ── The keepsake plate ────────────────────────────────────────────────────────
// "See everything it holds" lands HERE, so this section shows what the full
// reading gives you: one calm keepsake (their photo at the centre, the thirteen
// bodies orbiting once around it), and beside it the FOUR things you get, each
// an icon-sealed entry with a real title, a name and a line. The busy engraving
// and the leader lines were retired (2026-07-18) so the object reads elegant,
// not noisy, and the four holdings carry the desire. Copy is verbatim from the
// approved card version. Both registers show it (memorial un-gated 2026-07-17:
// the £49 path was selling with no value section at all); the memorial register
// flips only the title's tense, the four holdings already read true in both.
const VALUE_MOMENTS: { key: string; label: string; name: string; line: string; terms?: string; target: "ring" | "core" | "voice" | "phases" }[] = [
  {
    key: "placements",
    label: "The written reading",
    name: "Thirteen chapters, one soul.",
    line: "Every placement opened all the way down and written in full, the way you just saw begun.",
    target: "ring",
  },
  {
    key: "keepsake",
    label: "The keepsake",
    name: "Their face at the very centre.",
    line: "Made with their photo, kept for as long as you want to hold on to them.",
    target: "core",
  },
  {
    key: "soulspeak",
    label: "SoulSpeak",
    name: "Sit and talk with their soul.",
    line: "Ask them anything and hear it answered in their own voice. The things you always wondered, from their side at last.",
    target: "voice",
  },
  {
    key: "horoscope",
    label: "Weekly horoscopes",
    name: "The sky keeps moving. So do they.",
    line: "Every week the planets pass over their chart and stir something different: a restless Tuesday, a clingy weekend, a sudden burst at the door. The weekly horoscope tells you what is coming before you meet it.",
    terms: "One month free with the reading, then 4.99 a month. Cancel anytime.",
    target: "phases",
  },
];

/* Species sample photos for the core when no photo was uploaded. */
const VM_SAMPLE: Record<string, string> = {
  dog: "/pets/pet-cockapoo.webp",
  cat: "/pets/pet-tabby.webp",
  other: "/pets/pet-rabbit.webp",
};

/* One real (Lucide) icon per holding, sealed in a violet plaque — the marker
 * that gives the four entries their hierarchy now the leader lines are gone. */
const VM_ICON: Record<string, typeof BookOpen> = {
  placements: BookOpen,
  keepsake: Aperture,
  soulspeak: MessageCircle,
  horoscope: Moon,
};

/* Peek affordance per holding — each entry opens a small visual preview
 * (a page glimpse, the framed portrait, the SoulSpeak chat, a week ahead). */
const VM_PEEK: Record<string, string> = {
  placements: "Look inside a chapter",
  keepsake: "See the keepsake",
  soulspeak: "Open the conversation",
  horoscope: "See a week ahead",
};

function ValueMoments() {
  const [memorialIntent, setMemorialIntent] = useState<boolean>(() => getIntent() === "memorial");
  // The one personal asset the funnel has collected: their pet's name and photo,
  // read on mount and kept live via the same events the checkout listens to.
  const [pet, setPet] = useState<{ name: string | null } | null>(() => {
    try {
      const raw = sessionStorage.getItem("ls_chart_pet");
      return raw ? (JSON.parse(raw) as { name: string | null }) : null;
    } catch {
      return null;
    }
  });
  const [photo, setPhoto] = useState<string | null>(() => {
    try { return sessionStorage.getItem("ls_chart_photo") || null; } catch { return null; }
  });
  const [species, setSpecies] = useState<string>(() => {
    try { return sessionStorage.getItem("ls_chart_species") || ""; } catch { return ""; }
  });
  const [coreErr, setCoreErr] = useState(false);
  const [inView, setInView] = useState(false);
  const [live, setLive] = useState(false);
  // Which holding has its preview open. SoulSpeak leads open so its chat
  // teaser is seen without a tap; the other three peek on demand.
  const [openKey, setOpenKey] = useState<string | null>("soulspeak");
  const rootRef = useRef<HTMLElement>(null);
  const objRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const onIntent = () => setMemorialIntent(getIntent() === "memorial");
    window.addEventListener(INTENT_EVENT, onIntent);
    return () => window.removeEventListener(INTENT_EVENT, onIntent);
  }, []);

  useEffect(() => {
    const onPet = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      setPet(detail && typeof detail === "object" ? (detail as { name: string | null }) : null);
      try { setSpecies(sessionStorage.getItem("ls_chart_species") || ""); } catch { /* ignore */ }
      try { setPhoto(sessionStorage.getItem("ls_chart_photo") || null); } catch { /* ignore */ }
    };
    const onPhoto = (event: Event) => {
      const detail = (event as CustomEvent).detail as { url?: string | null } | undefined;
      setPhoto(detail && typeof detail.url === "string" && detail.url ? detail.url : null);
    };
    window.addEventListener("ls-chart-pet", onPet as EventListener);
    window.addEventListener("ls-chart-photo", onPhoto as EventListener);
    return () => {
      window.removeEventListener("ls-chart-pet", onPet as EventListener);
      window.removeEventListener("ls-chart-photo", onPhoto as EventListener);
    };
  }, []);

  const coreSrc = (!coreErr && photo) || VM_SAMPLE[species] || VM_SAMPLE.dog;

  // A fresh photo gets a fresh chance after a failed load.
  useEffect(() => { setCoreErr(false); }, [photo]);

  // One observer latches the reveal (data-in, permanent); a second gates the
  // ambient orbit + halo breath (is-live) so nothing runs off-screen.
  useEffect(() => {
    const obj = objRef.current;
    if (!obj || typeof window === "undefined") return;
    if (reduce || !("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }
    const ioLatch = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
            setInView(true);
            ioLatch.disconnect();
          }
        });
      },
      { threshold: 0.2 },
    );
    ioLatch.observe(obj);
    const ioLive = new IntersectionObserver(
      (entries) => entries.forEach((entry) => setLive(entry.isIntersecting)),
      { threshold: 0.25 },
    );
    ioLive.observe(obj);
    return () => {
      ioLatch.disconnect();
      ioLive.disconnect();
    };
  }, [reduce]);

  const petName = capName(pet?.name);
  const objLabel = `The full reading, kept as one keepsake with ${petName ? `${petName}'s` : "their"} photo at the centre`;

  // SoulSpeak teaser copy, register-aware. A tender owner question and the
  // little soul answering in first person — clearly a preview, not a live
  // channel. Voice is hinted, never a fresh claim (the holding already
  // promises "their own voice").
  const soulOwnerAsk = memorialIntent ? "Are you still with me?" : "Do you know you are safe with me?";
  const soulPetReply = memorialIntent
    ? "I never left the warm end of the sofa. Say my name and listen, I always answer."
    : "Every time you say my name, I know. Your voice is the warm part of my whole day.";
  const WEEK: { d: string; m?: boolean }[] = [
    { d: "Mon" }, { d: "Tue", m: true }, { d: "Wed" }, { d: "Thu" },
    { d: "Fri" }, { d: "Sat" }, { d: "Sun", m: true },
  ];
  const renderPreview = (key: string): ReactNode => {
    switch (key) {
      case "placements":
        return (
          <div className="ls-vm-prev vm-prev-page" aria-hidden="true">
            <span className="vm-page-chap">Chapter I</span>
            <span className="vm-page-h">The way they love</span>
            <span className="vm-page-l" />
            <span className="vm-page-l" />
            <span className="vm-page-l is-short" />
            <span className="vm-page-fade">
              <span className="vm-page-l" />
              <span className="vm-page-l is-short" />
            </span>
            <span className="vm-page-foot">Thirteen chapters, opened in full</span>
          </div>
        );
      case "keepsake":
        return (
          <div className="ls-vm-prev vm-prev-keep" aria-hidden="true">
            <span className="vm-keep-frame">
              <img src={coreSrc} alt="" loading="lazy" decoding="async" />
            </span>
            <span className="vm-keep-plate">{petName || "Their name"}</span>
          </div>
        );
      case "soulspeak":
        return (
          <div className="ls-vm-prev vm-prev-chat">
            <div className="vm-chat-head">
              <span className="vm-chat-av"><img src={coreSrc} alt="" loading="lazy" decoding="async" /></span>
              <span className="vm-chat-id">
                <span className="vm-chat-name">{petName || "Their soul"}</span>
                <span className="vm-chat-status"><i className="vm-chat-dot" aria-hidden="true" />Soul channel open</span>
              </span>
              <span className="vm-chat-badge">SoulSpeak</span>
            </div>
            <div className="vm-chat-body">
              <div className="vm-msg vm-msg-user"><span className="vm-bub">{soulOwnerAsk}</span></div>
              <div className="vm-msg vm-msg-pet">
                <span className="vm-msg-av"><img src={coreSrc} alt="" loading="lazy" decoding="async" /></span>
                <span className="vm-bub">{soulPetReply}</span>
              </div>
            </div>
            <div className="vm-chat-foot">
              <span className="vm-chat-input"><Mic size={15} strokeWidth={1.6} aria-hidden="true" />Ask them anything</span>
              <span className="vm-chat-voice"><Volume2 size={15} strokeWidth={1.7} aria-hidden="true" />Hear it in their voice</span>
            </div>
          </div>
        );
      case "horoscope":
        return (
          <div className="ls-vm-prev vm-prev-week" aria-hidden="true">
            <div className="vm-week-row">
              {WEEK.map((w, i) => (
                <span key={i} className={`vm-week-day${w.m ? " is-mark" : ""}`}>{w.d}</span>
              ))}
            </div>
            <p className="vm-week-line">This week: a restless Tuesday, a clingy Sunday.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section
      id="the-more"
      ref={rootRef}
      className="ls-vm ls-parallax-band"
      aria-labelledby="ls-vm-title"
      data-in={inView ? "1" : undefined}
    >
      <div className="ls-vm-grain" aria-hidden="true" />
      <div className="ls-vm-wash" aria-hidden="true" />
      <div className="ls-vm-inner">
        <header className="ls-vm-head ls-reveal">
          <p className="ls-vm-eyebrow">Inside the full reading</p>
          <h2 id="ls-vm-title" className="ls-vm-title">
            {memorialIntent
              ? "Everything that made them who they were, kept in one place."
              : "Everything that makes them who they are, kept in one place."}
          </h2>
        </header>
        <div className="ls-vm-plate">
          <div className="ls-vm-objcol">
            <div className={`ls-vm-object ${live ? "is-live" : ""}`} ref={objRef} role="img" aria-label={objLabel}>
              <div className="ls-vm-halo" aria-hidden="true" />
              <div className="ls-vm-wheel">
                {/* the orbiting thirteen were retired (2026-07-19: Danny — no
                    moving planets). Their face is the keepsake now: one framed
                    portrait, double-ringed and calm, held on a still orbit. */}
                <span className="ls-vm-orbit" aria-hidden="true" />
                <div className={`ls-vm-core ${coreErr && !VM_SAMPLE[species] ? "is-bare" : ""}`} aria-hidden="true">
                  <img
                    key={coreSrc}
                    src={coreSrc}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      if (photo && coreSrc === photo) {
                        setCoreErr(true);
                      } else {
                        e.currentTarget.style.display = "none";
                      }
                    }}
                  />
                </div>
              </div>
              {petName ? <span className="ls-vm-nameplate">{petName}</span> : null}
            </div>
          </div>
          <ol className="ls-vm-index" aria-label="What the full reading holds">
            {VALUE_MOMENTS.map(({ key, label, name: entryName, line, terms }, i) => {
              const Icon = VM_ICON[key];
              const open = openKey === key;
              return (
                <li key={key} className={`ls-vm-entry ls-reveal${open ? " is-open" : ""}`} data-k={key} style={{ ...revealDelay(0.3 + i * 0.1), ["--ni" as string]: i } as CSSProperties}>
                  <span className="ls-vm-seal" aria-hidden="true">
                    {Icon ? <Icon size={22} strokeWidth={1.5} /> : null}
                  </span>
                  <div className="ls-vm-etext">
                    <span className="ls-vm-label">
                      <span className="ls-vm-num">{["I", "II", "III", "IV"][i]}</span>
                      {label}
                    </span>
                    <h3 className="ls-vm-name">{entryName}</h3>
                    <p className="ls-vm-line">{line}</p>
                    {terms && <p className="ls-vm-terms">{terms}</p>}
                    <button
                      type="button"
                      className="ls-vm-peek"
                      aria-expanded={open}
                      aria-controls={`vm-prev-${key}`}
                      onClick={() => setOpenKey((k) => (k === key ? null : key))}
                    >
                      <span>{open ? "Close preview" : VM_PEEK[key]}</span>
                      <ChevronDown className="ls-vm-peek-chev" size={17} strokeWidth={1.7} aria-hidden="true" />
                    </button>
                    <div id={`vm-prev-${key}`} className={`ls-vm-prevwrap${open ? " is-open" : ""}`} role="region" aria-label={`${label} preview`}>
                      <div className="ls-vm-prevwrap-in">{renderPreview(key)}</div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
        <p className="ls-vm-pull ls-reveal" style={revealDelay(0.75)}>This is everything their reading holds. Open it below.</p>
      </div>
      <style>{`
        /* top padding + scroll-margin clear the fixed 64px site nav so the title
           never lands sliced under it when "See everything it holds" descends here */
        .ls-vm { position: relative; z-index: 1; overflow: hidden; background: ${C.cosmos}; padding: clamp(88px, 12svh, 132px) 20px clamp(40px, 6svh, 88px); scroll-margin-top: 80px; --e-stage: cubic-bezier(0.22, 0.7, 0.2, 1); --e-settle: cubic-bezier(0.16, 1, 0.3, 1); --e-draw: cubic-bezier(0.4, 0, 0.2, 1); }
        .ls-vm-grain {
          position: absolute; inset: 0; z-index: 0; pointer-events: none; opacity: 0.05; mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
        }
        .ls-vm-wash {
          position: absolute; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(120% 84% at 50% -8%, rgba(124,92,214,0.14), transparent 58%),
            radial-gradient(120% 100% at 50% 60%, transparent 56%, rgba(6,4,12,0.6) 100%);
        }
        .ls-vm-inner { position: relative; z-index: 1; max-width: 1080px; margin: 0 auto; }
        .ls-vm-head { text-align: center; margin: 0 auto clamp(34px, 5vw, 56px); }
        .ls-vm-eyebrow { margin: 0 0 14px; color: ${C.gold}; font-family: "Newsreader", Georgia, serif; font-size: 13px; font-weight: 600; letter-spacing: 0.26em; text-transform: uppercase; }
        .ls-vm-title { margin: 0 auto; max-width: 26ch; color: ${C.cream}; font-family: "Fraunces", Georgia, serif; font-weight: 500; font-size: clamp(1.85rem, 5.6vw, 2.7rem); line-height: 1.07; letter-spacing: -0.016em; }

        /* THE PLATE - object first on mobile, object + index side by side on desktop */
        .ls-vm-plate { position: relative; max-width: 1040px; margin: 0 auto; }

        /* THE OBJECT - the keepsake wheel, seated (SEAT verb) once in view */
        .ls-vm-objcol { position: relative; }
        .ls-vm-object {
          position: relative; width: fit-content; margin: 0 auto clamp(26px, 6vw, 36px);
          --vm-size: clamp(240px, 74vw, 320px);
          --vm-mini: calc(var(--vm-size) * 0.095);
          --vm-r: calc(var(--vm-size) / 2);
          padding: calc(var(--vm-mini) / 2 + 6px);
          opacity: 0; transform: scale(0.965); filter: blur(6px);
          transition: opacity 0.95s var(--e-settle) 0.05s, transform 0.95s var(--e-settle) 0.05s, filter 0.95s var(--e-settle) 0.05s;
        }
        .ls-vm[data-in] .ls-vm-object { opacity: 1; transform: none; filter: blur(0); }
        .ls-vm-halo {
          position: absolute; inset: -12%; z-index: 0; border-radius: 50%; pointer-events: none;
          background: radial-gradient(circle, rgba(154,126,230,0.32) 0%, rgba(154,126,230,0.12) 40%, transparent 70%);
          filter: blur(10px); opacity: 0.6;
        }
        .ls-vm-object.is-live .ls-vm-halo { animation: lsVmBreathe 5.8s ease-in-out infinite; }
        @keyframes lsVmBreathe { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 0.86; transform: scale(1.06); } }
        .ls-vm-wheel { position: relative; z-index: 1; width: var(--vm-size); height: var(--vm-size); display: grid; place-items: center; }
        /* two calm orbit hairlines the portrait rests inside — the thirteen
           orbiting minis were retired (2026-07-19, Danny: no moving planets),
           so their face is the whole visual now: one keepsake, held still. */
        .ls-vm-orbit { position: absolute; inset: 0; border-radius: 50%; pointer-events: none; border: 1px solid rgba(185,165,240,0.16); }
        .ls-vm-orbit::before { content: ""; position: absolute; inset: 9%; border-radius: 50%; border: 1px solid rgba(185,165,240,0.09); }

        /* the core - their photo, now the keepsake portrait, double-ringed */
        .ls-vm-core {
          position: relative; left: auto; top: auto; width: 74%; height: 74%; z-index: 2;
          transform: none; border-radius: 50%; overflow: hidden;
          background: radial-gradient(circle at 50% 36%, rgba(154,126,230,0.16), rgba(154,126,230,0.04) 70%);
          box-shadow: 0 0 0 1px rgba(185,165,240,0.5), 0 0 0 10px rgba(13,10,20,0.92), 0 0 0 11px rgba(185,165,240,0.2), 0 24px 70px rgba(4,2,12,0.72);
          transition: box-shadow 0.35s var(--e-stage);
        }
        .ls-vm-core img { width: 100%; height: 100%; object-fit: cover; display: block; filter: brightness(0.92) contrast(1.03); }
        .ls-vm-nameplate {
          display: flex; align-items: center; justify-content: center; gap: 14px; margin: 14px auto 0;
          color: ${C.violetBright}; font-family: "Newsreader", Georgia, serif; font-weight: 600;
          font-size: 12.5px; letter-spacing: 0.22em; text-transform: uppercase; text-align: center;
        }
        .ls-vm-nameplate::before, .ls-vm-nameplate::after { content: ""; flex: 0 0 auto; width: 18px; height: 1px; background: rgba(185,165,240,0.3); }

        /* THE FOUR HOLDINGS — each an icon-sealed entry: a violet plaque marks
           it, the numeral + gold label name it, then the desire line. Hairlines
           part them; no card, no leader lines. This is the "here is everything
           the reading gives you" moment, hierarchy carried by the seals. */
        .ls-vm-index { position: relative; list-style: none; margin: 0; padding: 0; }
        .ls-vm-entry {
          position: relative; display: grid; grid-template-columns: 46px 1fr;
          column-gap: clamp(14px, 2.4vw, 20px); align-items: start;
          padding: clamp(20px, 2.8vw, 28px) 0; text-align: left;
        }
        .ls-vm-entry + .ls-vm-entry { border-top: 1px solid rgba(185,165,240,0.14); }
        .ls-vm-seal {
          flex: 0 0 auto; display: grid; place-items: center; width: 46px; height: 46px; margin-top: 3px;
          border-radius: 13px; color: ${C.violetBright};
          background: radial-gradient(circle at 34% 28%, rgba(124,92,214,0.30), rgba(21,16,28,0.92) 78%);
          border: 1px solid rgba(154,126,230,0.32);
          box-shadow: inset 0 1px 0 rgba(226,220,240,0.09), 0 12px 28px -14px rgba(6,4,12,0.85);
          transition: color 0.35s var(--e-stage), border-color 0.35s var(--e-stage), box-shadow 0.35s var(--e-stage);
        }
        .ls-vm-seal svg { width: 22px; height: 22px; }
        .ls-vm-etext { min-width: 0; }
        .ls-vm-label { display: flex; align-items: baseline; gap: 11px; margin: 1px 0 7px; color: ${C.gold}; font-family: "Newsreader", Georgia, serif; font-size: 14px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; }
        .ls-vm-num { flex: 0 0 auto; color: ${C.violetBright}; font-family: "Fraunces", Georgia, serif; font-weight: 500; font-size: 1.05em; letter-spacing: 0.02em; opacity: 0.85; }
        .ls-vm-name { margin: 0 0 7px; color: ${C.cream}; font-family: "Fraunces", Georgia, serif; font-weight: 500; font-size: clamp(1.34rem, 4.6vw, 1.6rem); line-height: 1.12; letter-spacing: -0.01em; }
        .ls-vm-line { margin: 0; max-width: 46ch; color: ${C.muted}; font-family: "Newsreader", Georgia, serif; font-size: 18px; line-height: 1.55; }
        .ls-vm-terms { display: inline-block; margin: 13px 0 0; padding: 9px 15px; border-radius: 12px; border: 1px solid rgba(154,126,230,0.24); background: rgba(124,92,214,0.09); color: rgba(214,210,228,0.82); font-family: "Newsreader", Georgia, serif; font-size: 15.5px; line-height: 1.45; }

        /* ── each holding opens a small preview: a page glimpse, the framed
           keepsake, the SoulSpeak chat, a week ahead. The peek control, then a
           grid-rows panel that opens without measuring. ── */
        .ls-vm-peek {
          display: inline-flex; align-items: center; gap: 8px; margin: 15px 0 0; padding: 8px 14px 8px 17px;
          border-radius: 999px; cursor: pointer; -webkit-tap-highlight-color: transparent;
          border: 1px solid rgba(154,126,230,0.32); background: rgba(124,92,214,0.10);
          color: ${C.violetBright}; font-family: "Newsreader", Georgia, serif; font-size: 14px; font-weight: 600;
          letter-spacing: 0.02em; transition: border-color 0.3s var(--e-stage), background 0.3s var(--e-stage), color 0.3s var(--e-stage);
        }
        .ls-vm-peek:hover { border-color: rgba(185,165,240,0.55); background: rgba(124,92,214,0.16); color: ${C.cream}; }
        .ls-vm-peek:focus-visible { outline: 2px solid ${C.violetBright}; outline-offset: 3px; }
        .ls-vm-peek-chev { transition: transform 0.35s var(--e-stage); }
        .ls-vm-entry.is-open .ls-vm-peek-chev { transform: rotate(180deg); }
        .ls-vm-prevwrap { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.5s var(--e-settle); }
        .ls-vm-entry.is-open .ls-vm-prevwrap { grid-template-rows: 1fr; }
        .ls-vm-prevwrap-in { overflow: hidden; min-height: 0; }
        .ls-vm-prev { margin-top: 16px; }

        /* I — a page glimpse: heading, then lines that trail into the seal */
        .vm-prev-page { position: relative; max-width: 320px; padding: 20px 22px 18px; border-radius: 14px; border: 1px solid rgba(185,165,240,0.2); background: linear-gradient(180deg, rgba(30,24,44,0.92), rgba(18,13,28,0.92)); box-shadow: 0 18px 44px -22px rgba(6,4,12,0.85); overflow: hidden; }
        .vm-page-chap { display: block; color: ${C.violetBright}; font-family: "Newsreader", Georgia, serif; font-size: 12px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; }
        .vm-page-h { display: block; margin: 8px 0 14px; color: ${C.cream}; font-family: "Fraunces", Georgia, serif; font-weight: 500; font-size: 1.25rem; letter-spacing: -0.01em; }
        .vm-page-l { display: block; height: 8px; border-radius: 4px; margin: 0 0 10px; background: linear-gradient(90deg, rgba(207,192,244,0.34), rgba(207,192,244,0.12)); }
        .vm-page-l.is-short { width: 62%; }
        .vm-page-fade { display: block; -webkit-mask-image: linear-gradient(180deg, #000, transparent); mask-image: linear-gradient(180deg, #000, transparent); }
        .vm-page-foot { display: block; margin-top: 6px; color: ${C.violetBright}; font-family: "Newsreader", Georgia, serif; font-style: italic; font-size: 13.5px; opacity: 0.85; }

        /* II — the framed keepsake portrait, inscribed with their name */
        .vm-prev-keep { display: flex; align-items: center; gap: 16px; }
        .vm-keep-frame { flex: 0 0 auto; width: 92px; height: 92px; border-radius: 14px; overflow: hidden; box-shadow: 0 0 0 1px rgba(185,165,240,0.5), 0 0 0 6px rgba(13,10,20,0.92), 0 0 0 7px rgba(185,165,240,0.2), 0 18px 40px -18px rgba(6,4,12,0.85); }
        .vm-keep-frame img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .vm-keep-plate { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 999px; border: 1px solid rgba(185,165,240,0.28); background: rgba(124,92,214,0.1); color: ${C.violetSoft}; font-family: "Newsreader", Georgia, serif; font-size: 13px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; }

        /* III — the SoulSpeak conversation, opened as a teaser */
        .vm-prev-chat { max-width: 360px; border-radius: 18px; overflow: hidden; border: 1px solid rgba(185,165,240,0.24); background: linear-gradient(180deg, rgba(28,22,42,0.96), rgba(18,13,28,0.96)); box-shadow: 0 24px 60px -26px rgba(6,4,12,0.9); }
        .vm-chat-head { display: flex; align-items: center; gap: 11px; padding: 12px 14px; border-bottom: 1px solid rgba(185,165,240,0.16); background: rgba(124,92,214,0.12); }
        .vm-chat-av { flex: 0 0 auto; position: relative; width: 38px; height: 38px; border-radius: 50%; overflow: hidden; box-shadow: 0 0 0 2px #b9a5f0, 0 0 0 4px rgba(124,92,214,0.35); }
        .vm-chat-av img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .vm-chat-id { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .vm-chat-name { color: ${C.cream}; font-family: "Newsreader", Georgia, serif; font-weight: 600; font-size: 15px; }
        .vm-chat-status { display: flex; align-items: center; gap: 6px; color: ${C.violetBright}; font-size: 11.5px; letter-spacing: 0.04em; }
        .vm-chat-dot { width: 7px; height: 7px; border-radius: 50%; background: #cfc0f4; box-shadow: 0 0 7px rgba(207,192,244,0.9); }
        .vm-chat-badge { flex: 0 0 auto; padding: 4px 10px; border-radius: 999px; background: linear-gradient(180deg, #a78bfa, #7c5cd6); color: #fff; font-family: "Newsreader", Georgia, serif; font-size: 10.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
        .vm-chat-body { display: flex; flex-direction: column; gap: 10px; padding: 16px 14px; }
        .vm-msg { display: flex; align-items: flex-end; gap: 7px; max-width: 86%; }
        .vm-msg-user { align-self: flex-end; }
        .vm-msg-pet { align-self: flex-start; }
        .vm-msg-av { flex: 0 0 auto; width: 24px; height: 24px; border-radius: 50%; overflow: hidden; box-shadow: 0 0 0 1px rgba(185,165,240,0.5); }
        .vm-msg-av img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .vm-bub { padding: 9px 13px; border-radius: 15px; font-family: "Newsreader", Georgia, serif; font-size: 14.5px; line-height: 1.4; }
        .vm-msg-user .vm-bub { border-bottom-right-radius: 5px; background: linear-gradient(180deg, #8f6de0, #6a4cc4); color: #fff; }
        .vm-msg-pet .vm-bub { border-bottom-left-radius: 5px; background: rgba(236,232,248,0.96); color: #241a38; border: 1px solid rgba(185,165,240,0.3); }
        .vm-chat-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 11px 14px; border-top: 1px solid rgba(185,165,240,0.16); }
        .vm-chat-input { display: inline-flex; align-items: center; gap: 8px; flex: 1 1 auto; min-width: 0; padding: 7px 13px; border-radius: 999px; border: 1px solid rgba(185,165,240,0.24); background: rgba(10,7,18,0.5); color: ${C.muted}; font-family: "Newsreader", Georgia, serif; font-size: 13px; }
        .vm-chat-input svg { flex: 0 0 auto; color: ${C.violetBright}; }
        .vm-chat-voice { flex: 0 0 auto; display: inline-flex; align-items: center; gap: 7px; color: ${C.violetBright}; font-family: "Newsreader", Georgia, serif; font-style: italic; font-size: 12.5px; }
        .vm-chat-voice svg { flex: 0 0 auto; }

        /* IV — a week ahead: seven days, two stirred */
        .vm-prev-week { max-width: 340px; padding: 16px 18px; border-radius: 14px; border: 1px solid rgba(185,165,240,0.2); background: linear-gradient(180deg, rgba(30,24,44,0.9), rgba(18,13,28,0.9)); }
        .vm-week-row { display: flex; gap: 6px; }
        .vm-week-day { flex: 1 1 0; display: grid; place-items: center; height: 34px; border-radius: 9px; border: 1px solid rgba(185,165,240,0.16); color: ${C.muted}; font-family: "Newsreader", Georgia, serif; font-size: 12px; font-weight: 600; }
        .vm-week-day.is-mark { border-color: rgba(185,165,240,0.6); background: rgba(124,92,214,0.28); color: #fff; box-shadow: 0 0 0 1px rgba(185,165,240,0.3), 0 6px 16px -8px rgba(124,92,214,0.6); }
        .vm-week-line { margin: 13px 0 0; color: ${C.creamDim}; font-family: "Newsreader", Georgia, serif; font-style: italic; font-size: 15px; line-height: 1.45; }

        /* the bridge to the voices below, hairline-flanked */
        .ls-vm-pull { margin: clamp(30px, 5vw, 48px) auto 0; text-align: center; color: ${C.violetBright}; font-family: "Newsreader", Georgia, serif; font-style: italic; font-size: 18px; line-height: 1.5; }
        .ls-vm-pull::before, .ls-vm-pull::after { content: ""; display: inline-block; width: 56px; height: 1px; vertical-align: middle; }
        .ls-vm-pull::before { margin-right: 14px; background: linear-gradient(90deg, transparent, rgba(185,165,240,0.35)); }
        .ls-vm-pull::after { margin-left: 14px; background: linear-gradient(90deg, rgba(185,165,240,0.35), transparent); }
        @media (max-width: 479px) {
          /* the flanking hairlines wrap awkwardly at phone widths - the italic
             violet voice already sets the line apart, so they step aside */
          .ls-vm-pull::before, .ls-vm-pull::after { display: none; }
        }

        /* desktop: object left, the four holdings right */
        @media (min-width: 900px) {
          .ls-vm-plate { display: grid; grid-template-columns: minmax(280px, 0.42fr) minmax(0, 0.58fr); gap: clamp(40px, 6vw, 84px); align-items: center; }
          .ls-vm-object { --vm-size: clamp(280px, 34vw, 400px); margin: 0 auto; }
          .ls-vm-entry { grid-template-columns: 52px 1fr; column-gap: 22px; }
          .ls-vm-seal { width: 50px; height: 50px; }
        }

        /* hover — the entry answers (its seal brightens); hovering the first two
           also stirs the object they name. Desktop pointers only, degrades silently. */
        @media (hover: hover) {
          .ls-vm-entry:hover .ls-vm-seal { color: ${C.cream}; border-color: rgba(185,165,240,0.55); box-shadow: inset 0 1px 0 rgba(226,220,240,0.12), 0 0 0 4px rgba(124,92,214,0.12), 0 12px 28px -14px rgba(6,4,12,0.85); }
        }
        @media (hover: hover) and (min-width: 900px) {
          .ls-vm-plate:has(li[data-k="keepsake"]:hover) .ls-vm-core { box-shadow: 0 0 0 1px rgba(185,165,240,0.7), 0 0 0 10px rgba(13,10,20,0.9), 0 0 0 11px rgba(185,165,240,0.34), 0 24px 70px rgba(4,2,12,0.7); }
        }

        /* reduced motion: the rest state IS the finished composition - wheel
           assembled, index set. Nothing depends on the observer firing. */
        @media (prefers-reduced-motion: reduce) {
          .ls-vm-halo { animation: none !important; opacity: 0.58 !important; transform: none !important; }
          .ls-vm-object { opacity: 1 !important; transform: none !important; filter: none !important; transition: none !important; }
          .ls-vm .ls-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
          .ls-vm-prevwrap { transition: none !important; }
          .ls-vm-peek-chev { transition: none !important; }
        }
        /* .is-static mirror (same finished-composition rest state, class-driven) */
        .ls-vm.is-static .ls-vm-halo { animation: none !important; }
        .ls-vm.is-static .ls-vm-halo { opacity: 0.58 !important; transform: none !important; }
        .ls-vm.is-static .ls-vm-object { opacity: 1 !important; transform: none !important; filter: none !important; transition: none !important; }
        .ls-vm.is-static .ls-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }

        /* ==== TYPE FLOORS - tuned per viewport (2026-07-14; plate rebuild 2026-07-16) ==== */
        .ls-vm-eyebrow { font-size: 14px; }
        .ls-vm-label { font-size: 14px; }
        .ls-vm-line, .ls-vm-pull { font-size: 18px; }
        @media (min-width: 768px) {
          .ls-vm-eyebrow { font-size: 14.5px; }
          .ls-vm-label { font-size: 14.5px; }
          .ls-vm-line, .ls-vm-pull { font-size: 18.5px; }
        }
        @media (min-width: 1280px) {
          .ls-vm-eyebrow { font-size: 15px; }
          .ls-vm-label { font-size: 15px; }
          .ls-vm-line, .ls-vm-pull { font-size: 19px; }
        }
      `}</style>
    </section>
  );
}

// The ONE reviews wall on the path, curated from the full approved set of
// seventeen. Quotes verbatim. The converted sceptic is the SPOTLIGHT, set
// open on the sky above the rest: an editorial two-column read, not a card.
// The rest sit in a STATIC grid of violet-glass cards — no marquee, no
// auto-advance (NN/g: readers assume moving content is an ad and skip it;
// the old drift also clipped cards at both viewport edges). Phones keep the
// user-driven snap strip with decorative progress dots. The wall is
// register-aware (wall repair 2026-07-17):
//   discovery — seven voices; the two blemished four-star cards (Colin B.,
//     Alan R.) lead the grid OPEN so their honest niggles are readable
//     (Ein-Gar/Shiv/Tormala: a small negative after positives builds trust);
//     the death-mention grief voice never shows here.
//   memorial — the £49 path finally gets voices of its own: the For-grief
//     card leads, flanked by the steady senior-dog card and a converted
//     sceptic, under the same sceptic spotlight.
// Species run whippet to horse to guinea pig so every reader finds a shape
// like their own. None of these quotes render inside the dossier checkout
// (it carries grief / joy / gift / practical / returner), so no quote ever
// appears twice on one path. Wording verbatim.
type WallReview = {
  img: string; alt: string; stars: number; quote: string; attr: string;
  label?: string;
};
const WALL_HERO: WallReview = { ...REVIEWS.skeptic, label: "For sceptics" };
const WALL_CARDS: Record<string, WallReview> = {
  otis: {
    img: "/reviews/review-8.webp", alt: "Otis", stars: 5,
    quote: "otis spent his first three months under our bed in Cardiff, only coming out after midnight for biscuits. The reading described a guarded Moon placement and a creature who watches the room from a border before choosing anyone. I had not written anything about him being formerly feral, so that line stayed with me.",
    attr: "Grace O. · Otis, rescue shorthair cat",
  },
  bracken: {
    img: "/reviews/review-12.webp", alt: "Bracken", stars: 5,
    quote: "I was not sure a reading would make sense for a horse, especially Bracken, who has opinions about everything at the Devon yard. Then it mentioned a stubborn Saturn edge around thresholds and moving boxes, which is exactly his trailer-loading face on a wet Tuesday. The yard owner laughed because only the people here would know that.",
    attr: "Emily F. · Bracken, cob-type horse",
    label: "Felt exactly like them",
  },
  marmite: {
    img: "/reviews/review-7.webp", alt: "Marmite", stars: 5,
    quote: "I ordered Marmite's reading for the anniversary of the day we brought him back to Leeds in a borrowed blanket. It picked up his restless little Mars rhythm by the front door at about 6pm, which is exactly the hour he still starts pacing every October as if the car is coming again. Too specific to brush off, really.",
    attr: "Freya H. · Marmite, cockapoo",
  },
  loki: {
    img: "/reviews/review-16.webp", alt: "Loki", stars: 5,
    quote: "Sam was openly dismissive when I ordered Loki's reading, mainly because astrology is not their thing. Then the reading described a fixed, territorial streak around shared spaces, and Loki had spent that same week blocking our other cat from the Manchester flat's hallway rug. Sam went quiet, read that paragraph twice, and has mentioned Loki's Mars placement more than I have.",
    attr: "Ben H. · Loki, Maine Coon cat",
  },
  willow: {
    img: "/reviews/review-13.webp", alt: "Willow", stars: 5,
    quote: "weeks after Willow died, I ordered her reading during a rough patch when the house in Nottingham felt very quiet. It gave me a way to talk with my kids about her little routines, the radiator spot, the paw on the newspaper, the way she chose one person at a time. Nothing overblown. Just enough shape around the missing.",
    attr: "Daniel K. · Willow, senior cat",
    label: "For grief",
  },
  nugget: {
    img: "/reviews/review-14.webp", alt: "Nugget", stars: 4,
    quote: "I did roll my eyes at spending money on a guinea pig of all things, but Nugget's reading had his number. The bit about comfort-seeking Venus and always choosing the covered end of the run was bang on, right down to him ignoring the parsley until he has dragged it under the little red shelter. For less than we paid last month for bedding and hay, it was fair value. I would have liked a cheaper way to add our second guinea pig afterwards.",
    attr: "Colin B. · Nugget, guinea pig",
  },
  meg: {
    img: "/reviews/review-9.webp", alt: "Meg", stars: 4,
    quote: "Meg is fourteen now, grey round the muzzle and slower on the lane behind our house near Sheffield. Her reading did not try to make her sound young again, it spoke about Saturn steadiness and the comfort of doing the same small jobs well. I was glad of that. Only niggle is that it took closer to a day to arrive, rather than the couple of hours I had expected.",
    attr: "Alan R. · Meg, border collie, fourteen",
  },
  figAndNorm: {
    img: "/reviews/review-11.webp", alt: "Fig and Norm", stars: 5,
    quote: "We ordered Fig and Norm's readings together, assuming two dogs in the same Glasgow house would come out much the same. Fig's was all bright Mars, cupboard doors and sudden decisions, while Norm's had this older Beagle patience and a Moon that sounded exactly like him refusing the rain at the back step. Same sofa, same walks, totally different souls.",
    attr: "Isla M. · Fig and Norm, sprocker spaniel and beagle",
  },
};
/* Register sets. Discovery leads with the two blemished four-star voices
 * (readable, open by default); the grief voice belongs to memorial only. */
const DISCOVERY_WALL: WallReview[] = [
  WALL_CARDS.nugget, WALL_CARDS.meg, WALL_CARDS.otis, WALL_CARDS.bracken,
  WALL_CARDS.marmite, WALL_CARDS.loki, WALL_CARDS.figAndNorm,
];
const MEMORIAL_WALL: WallReview[] = [WALL_CARDS.willow, WALL_CARDS.meg, WALL_CARDS.loki];
const DISCOVERY_OPEN: Record<string, boolean> = {
  [WALL_CARDS.nugget.img]: true,
  [WALL_CARDS.meg.img]: true,
};

function ReviewsWall() {
  const [memorialIntent, setMemorialIntent] = useState<boolean>(() => getIntent() === "memorial");
  // Per-card expand. Discovery opens the two blemished cards so their honest
  // niggles read without a tap; memorial rests everything closed.
  const [opened, setOpened] = useState<Record<string, boolean>>(() =>
    getIntent() === "memorial" ? {} : { ...DISCOVERY_OPEN },
  );
  // Decorative progress dot for the mobile snap strip.
  const [activeDot, setActiveDot] = useState(0);
  const stripRef = useRef<HTMLUListElement | null>(null);
  useEffect(() => {
    const onIntent = () => {
      const memorial = getIntent() === "memorial";
      setMemorialIntent(memorial);
      setOpened(memorial ? {} : { ...DISCOVERY_OPEN });
    };
    window.addEventListener(INTENT_EVENT, onIntent);
    return () => window.removeEventListener(INTENT_EVENT, onIntent);
  }, []);
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip || typeof IntersectionObserver === "undefined") return;
    const cards = Array.from(strip.querySelectorAll<HTMLElement>("[data-strip-idx]"));
    if (!cards.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActiveDot(Number((e.target as HTMLElement).dataset.stripIdx || 0));
        }
      },
      { root: strip, threshold: 0.6 },
    );
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [memorialIntent]);

  const hero = WALL_HERO;
  const cards = memorialIntent ? MEMORIAL_WALL : DISCOVERY_WALL;
  const [heroWho, ...heroRest] = hero.attr.split(" · ");

  const starRow = (n: number, cls: string) => (
    <div
      className={`ls-rev-stars ${cls}`}
      role="img"
      aria-label={n === 5 ? "Five out of five stars" : `${n} out of five stars`}
    >
      {[0, 1, 2, 3, 4].map((s) => (
        <svg key={s} viewBox="0 0 24 24" aria-hidden="true" className={s < n ? "" : "off"}>
          <path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9z" />
        </svg>
      ))}
    </div>
  );

  // One card renderer for the desktop grid AND the mobile strip.
  const card = (r: WallReview, stripIdx?: number) => {
    const open = !!opened[r.img];
    const [who, ...rest] = r.attr.split(" · ");
    return (
      <li
        key={r.img}
        className={`ls-rev${open ? " is-open" : ""}`}
        {...(typeof stripIdx === "number" ? { "data-strip-idx": stripIdx } : {})}
      >
        <figure className="ls-rev-fig">
          {r.label && <p className="ls-rev-chip">{r.label}</p>}
          <div className="ls-rev-top">
            <span className="ls-rev-ph">
              <img src={r.img} alt={r.alt} width={128} height={128} loading="lazy" decoding="async" />
            </span>
            <div className="ls-rev-meta">
              {starRow(r.stars, "is-sm")}
              <figcaption className="ls-rev-attr">
                <span className="ls-rev-who">{who}</span>
                {rest.length > 0 && <span className="ls-rev-pet">{rest.join(" · ")}</span>}
              </figcaption>
            </div>
          </div>
          <div className={`ls-rev-body${open ? " is-open" : ""}`}>
            <blockquote className={`ls-rev-quote${open ? "" : " is-clamp"}`}>{r.quote}</blockquote>
          </div>
          <button
            type="button"
            className="ls-rev-more"
            aria-expanded={open}
            tabIndex={0}
            onClick={() => setOpened((o) => ({ ...o, [r.img]: !o[r.img] }))}
          >
            {open ? "Close" : "Read on"}
          </button>
        </figure>
      </li>
    );
  };

  return (
    <section
      className="ls-reviews ls-parallax-band"
      aria-labelledby="ls-reviews-title"
    >
      {/* STAR GOLD def — Danny's one gold exception (2026-07-16). Legal ONLY
          as review-star fill + drop-shadow. Never borders, text, or chrome. */}
      <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="ls-star-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.starGoldHi} />
            <stop offset="50%" stopColor={C.starGoldMid} />
            <stop offset="100%" stopColor={C.starGoldLo} />
          </linearGradient>
        </defs>
      </svg>
      <div className="ls-reviews-inner">
        <header className="ls-reviews-head ls-reveal">
          <p className="ls-reviews-eyebrow">From people who did this</p>
          <h2 id="ls-reviews-title" className="ls-reviews-title">What their people say</h2>
        </header>

        {/* 1. Spotlight: the converted sceptic, set open on the sky. */}
        <figure className="ls-spot ls-reveal" style={{ "--ls-delay": "0.05s" } as CSSProperties}>
          <div className="ls-spot-rail">
            {hero.label && <p className="ls-spot-chip">{hero.label}</p>}
            <span className="ls-rev-ph ls-spot-ph">
              <img src={hero.img} alt={hero.alt} width={192} height={192} loading="lazy" decoding="async" />
            </span>
            <span className="ls-spot-starwrap">
              {starRow(hero.stars, "is-lg")}
              <span className="ls-spot-sweep" aria-hidden="true" />
            </span>
            <figcaption className="ls-rev-attr ls-spot-attr">
              <span className="ls-rev-who">{heroWho}</span>
              {heroRest.length > 0 && <span className="ls-rev-pet">{heroRest.join(" · ")}</span>}
            </figcaption>
          </div>
          <span className="ls-spot-rule" aria-hidden="true" />
          <div className="ls-spot-qwrap">
            <blockquote className="ls-spot-quote">{hero.quote}</blockquote>
          </div>
        </figure>

        {/* 2. The grid (>=768px): every voice at rest, full cards, nothing moves. */}
        <ul className="ls-rev-grid ls-reveal" role="list" style={{ "--ls-delay": "0.15s" } as CSSProperties}>
          {cards.map((r) => card(r))}
        </ul>

        {/* 3. Mobile <768px: user-driven snap strip, same voices in the same order. */}
        <ul className="ls-strip" role="list" ref={stripRef}>
          {cards.map((r, i) => card(r, i))}
        </ul>
        <div className="ls-strip-dots" aria-hidden="true">
          {cards.map((r, i) => (
            <span key={r.img} className={`ls-strip-dot${i === activeDot ? " is-on" : ""}`} />
          ))}
        </div>

        <div className="ls-reviews-close ls-reveal">
          <p className="ls-reviews-pull">Their chart has been waiting since the day they were born.</p>
          {!memorialIntent && (
            <button type="button" className="ls-reviews-cta" onClick={() => descendTo("#begin")}>
              Begin their reading
              <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      <style>{`
        .ls-reviews { position: relative; padding: clamp(52px, 8svh, 92px) 20px clamp(34px, 5svh, 64px); }
        .ls-reviews-inner { max-width: 1120px; margin: 0 auto; }
        .ls-reviews-head { text-align: center; max-width: 720px; margin: 0 auto clamp(36px, 5vw, 56px); }
        .ls-reviews-eyebrow {
          margin: 0 0 16px; color: ${C.gold}; font-family: "Newsreader", Georgia, serif;
          font-size: 13px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase;
        }
        .ls-reviews-title {
          margin: 0; color: ${C.cream}; font-family: "Fraunces", Georgia, serif; font-weight: 500;
          font-size: clamp(1.85rem, 5.6vw, 2.7rem); line-height: 1.05; letter-spacing: -0.018em;
        }

        /* ── stars: the one gold on the page, fills + drop-shadow only ── */
        .ls-rev-stars { display: flex; gap: 4px; }
        .ls-rev-stars svg { width: 15px; height: 15px; display: block; fill: url(#ls-star-gold); filter: drop-shadow(0 0 5px ${C.starGoldGlow}); }
        .ls-rev-stars svg.off { fill: rgba(196,190,220,0.22); filter: none; }
        .ls-rev-stars.is-sm { margin-bottom: 6px; }
        .ls-rev-stars.is-lg { gap: 5px; }
        .ls-rev-stars.is-lg svg { width: 20px; height: 20px; }

        /* ── spotlight: not a card, an open editorial read on the sky ── */
        .ls-spot { position: relative; margin: 0 auto clamp(44px, 6vw, 72px); max-width: 960px; padding-left: 18px; }
        .ls-spot::before {
          content: ""; position: absolute; left: 0; top: 4px; bottom: 4px; width: 3px; border-radius: 2px;
          background: linear-gradient(180deg, rgba(185,165,240,0.5), transparent);
        }
        .ls-spot.ls-reveal {
          transform: translate3d(0, 12px, 0);
          transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          transition-delay: var(--ls-delay, 0s);
        }
        .ls-spot.ls-reveal.is-in { transform: translate3d(0, 0, 0); }
        .ls-spot-rail {
          display: grid; grid-template-columns: 72px 1fr; column-gap: 14px; row-gap: 4px;
          grid-template-areas: "chip chip" "ph stars" "ph attr"; align-items: center; margin-bottom: 16px;
        }
        .ls-spot-chip {
          grid-area: chip; margin: 0 0 10px; color: ${C.violetBright}; font-family: "Newsreader", Georgia, serif;
          font-size: 13px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase;
        }
        .ls-spot-ph { grid-area: ph; width: 72px; height: 72px; border-radius: 18px; }
        .ls-spot-starwrap { grid-area: stars; position: relative; display: inline-flex; align-self: end; }
        .ls-spot-attr { grid-area: attr; align-self: start; }
        .ls-spot-attr .ls-rev-who { font-size: 17px; }
        .ls-spot-attr .ls-rev-pet { font-size: 14px; }
        .ls-spot-rule { display: none; }
        .ls-spot-qwrap { position: relative; }
        .ls-spot-qwrap::before {
          content: "\\201C"; position: absolute; top: -14px; left: -6px; z-index: 0; pointer-events: none;
          font-family: "Fraunces", Georgia, serif; font-weight: 600; font-size: 64px; line-height: 1;
          color: rgba(154,126,230,0.18);
        }
        .ls-spot-quote {
          position: relative; z-index: 1; margin: 0; max-width: 58ch;
          color: ${C.creamDim}; font-family: "Fraunces", Georgia, serif; font-weight: 500; font-style: normal;
          font-size: clamp(1.12rem, 4.6vw, 1.3rem); line-height: 1.5; letter-spacing: -0.005em;
        }
        .ls-spot-quote::before { content: "\\201C"; }
        .ls-spot-quote::after { content: "\\201D"; }
        /* GLINT: one-time light pass over the spotlight stars, never loops. */
        .ls-spot-sweep {
          position: absolute; inset: -6px -10px; pointer-events: none; opacity: 0; mix-blend-mode: screen;
          background: linear-gradient(105deg, transparent 40%, rgba(232,207,143,0.5) 50%, transparent 60%);
          background-size: 250% 100%; background-repeat: no-repeat; background-position: 130% 0;
        }
        @keyframes lsStarGlint {
          0% { opacity: 1; background-position: 130% 0; }
          100% { opacity: 0; background-position: -80% 0; }
        }
        .ls-spot.is-in .ls-spot-sweep { animation: lsStarGlint 900ms cubic-bezier(0.22, 0.7, 0.2, 1) 0.5s forwards; }
        @media (min-width: 768px) {
          .ls-spot { padding-left: 0; display: grid; grid-template-columns: 264px 1px 1fr; column-gap: clamp(14px, 2vw, 24px); align-items: start; }
          .ls-spot::before { display: none; }
          .ls-spot-rail { display: block; margin-bottom: 0; }
          .ls-spot-chip { margin: 0 0 14px; }
          .ls-spot-ph { display: block; width: 96px; height: 96px; border-radius: 24px; margin-bottom: 12px; }
          .ls-spot-starwrap { margin-bottom: 10px; }
          .ls-spot-rule {
            display: block; width: 1px; align-self: stretch;
            background: linear-gradient(180deg, transparent, rgba(185,165,240,0.35), transparent);
          }
          .ls-spot-qwrap::before { top: -18px; left: -34px; font-size: 96px; }
          .ls-spot-quote { font-size: clamp(1.22rem, 2vw, 1.5rem); }
        }

        /* ── the shared card: violet glass, clearly lighter than the page ── */
        .ls-rev { margin: 0; min-width: 0; flex: none; }
        .ls-rev-fig {
          position: relative; height: 100%; margin: 0; display: flex; flex-direction: column;
          padding: 20px 20px 18px; border-radius: 18px;
          background: linear-gradient(180deg, rgba(124,92,214,0.13) 0%, rgba(124,92,214,0.05) 100%), ${C.cosmos2};
          box-shadow: 0 2px 6px rgba(0,0,0,0.4), 0 14px 34px rgba(0,0,0,0.35);
          transition: transform 220ms cubic-bezier(0.22, 0.7, 0.2, 1), box-shadow 220ms cubic-bezier(0.22, 0.7, 0.2, 1);
        }
        .ls-rev-fig::before {
          content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1px; pointer-events: none;
          background: linear-gradient(165deg, rgba(185,165,240,0.42) 0%, rgba(154,126,230,0.20) 46%, rgba(185,165,240,0.36) 100%);
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
          transition: filter 180ms cubic-bezier(0.22, 0.7, 0.2, 1);
        }
        /* an editorial quote-mark watermark, unmistakably a testimonial */
        .ls-rev-fig::after {
          content: "\\201C"; position: absolute; top: 2px; right: 16px; z-index: 0; pointer-events: none;
          font-family: "Fraunces", Georgia, serif; font-weight: 600; font-size: 78px; line-height: 1;
          color: rgba(154,126,230,0.16);
        }
        .ls-rev-top, .ls-rev-body, .ls-rev-chip, .ls-rev-more { position: relative; z-index: 1; }
        .ls-rev-chip {
          margin: 0 0 10px; color: ${C.violetBright}; font-family: "Newsreader", Georgia, serif;
          font-size: 11.5px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase;
        }
        .ls-rev-top { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .ls-rev-ph {
          position: relative; flex: none; width: 48px; height: 48px; border-radius: 12px; overflow: hidden;
          background: ${C.cosmos3};
          box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 4px 16px rgba(154,126,230,0.14);
        }
        /* Warm pet photos sit beside the planet discs: a gentler pull into the
           cosmic world than before, so faces stay faces. */
        .ls-rev-ph img { position: relative; z-index: 0; display: block; width: 100%; height: 100%; object-fit: cover; filter: saturate(0.88) brightness(0.98) contrast(1.03); }
        .ls-rev-ph::before {
          content: ""; position: absolute; inset: 0; z-index: 1; pointer-events: none;
          background: linear-gradient(155deg, rgba(124,92,214,0.24), rgba(20,12,44,0.08) 55%, rgba(124,92,214,0.17));
          mix-blend-mode: soft-light;
        }
        .ls-rev-ph::after {
          content: ""; position: absolute; inset: 0; z-index: 2; border-radius: inherit; padding: 1px; pointer-events: none;
          background: linear-gradient(165deg, rgba(185,165,240,0.55) 0%, rgba(154,126,230,0.16) 46%, rgba(185,165,240,0.42) 100%);
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
        }
        .ls-rev-meta { min-width: 0; }
        .ls-rev-attr { display: flex; flex-direction: column; gap: 2px; }
        .ls-rev-who { color: ${C.cream}; font-family: "Fraunces", Georgia, serif; font-weight: 600; font-size: 15.5px; line-height: 1.2; letter-spacing: -0.006em; }
        .ls-rev-pet { color: ${C.muted}; font-family: "Newsreader", Georgia, serif; font-size: 13px; line-height: 1.3; opacity: 0.86; }
        /* Expand-in-place: width never changes so the drift loop math holds;
           rows are top-aligned so growth is downward only. */
        .ls-rev-body { overflow: hidden; max-height: 116px; transition: max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
        .ls-rev-body.is-open { max-height: 560px; }
        .ls-rev-quote {
          margin: 0; color: ${C.creamDim}; font-family: "Newsreader", Georgia, serif; font-style: italic;
          font-size: 18px; line-height: 1.55;
        }
        .ls-rev-quote.is-clamp { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 4; overflow: hidden; }
        .ls-rev-quote::before { content: "\\201C"; }
        .ls-rev-quote::after { content: "\\201D"; }
        .ls-rev-more {
          display: inline-flex; align-items: center; min-height: 44px; margin-top: 2px;
          padding: 0; border: 0; background: none; cursor: pointer;
          color: ${C.violetBright}; font-family: "Newsreader", Georgia, serif;
          font-style: italic; font-size: 18px;
          text-decoration: underline; text-decoration-color: rgba(185,165,240,0.45);
          text-underline-offset: 4px;
        }
        .ls-rev-more:focus-visible { outline: 2px solid ${C.violetSoft}; outline-offset: 3px; border-radius: 4px; }
        @media (hover: hover) and (pointer: fine) {
          .ls-rev-grid .ls-rev-fig:hover {
            transform: translateY(-3px);
            box-shadow: 0 4px 10px rgba(0,0,0,0.45), 0 20px 44px rgba(0,0,0,0.42);
            transition-duration: 180ms;
          }
          .ls-rev-grid .ls-rev-fig:hover::before { filter: brightness(1.3); }
        }

        /* ── the grid (>=768px): every card whole, at rest, no motion to ignore ── */
        .ls-rev-grid { display: none; }

        /* ── mobile snap strip: user-driven, no auto-motion ── */
        .ls-strip {
          list-style: none; margin: 0; padding: 6px 20px 10px; display: flex; gap: 12px;
          width: 100vw; margin-inline: calc(50% - 50vw);
          overflow-x: auto; scroll-snap-type: x mandatory; scroll-padding-inline: 20px;
          overscroll-behavior-x: contain; scrollbar-width: none;
          -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 36px, #000 calc(100% - 36px), transparent 100%);
          mask-image: linear-gradient(90deg, transparent 0, #000 36px, #000 calc(100% - 36px), transparent 100%);
        }
        .ls-strip::-webkit-scrollbar { display: none; }
        .ls-strip .ls-rev { width: 82vw; max-width: 360px; scroll-snap-align: start; }
        .ls-strip-dots { display: flex; justify-content: center; gap: 8px; margin-top: 14px; }
        .ls-strip-dot {
          width: 6px; height: 6px; border-radius: 999px; background: rgba(196,190,220,0.28);
          transition: transform 200ms cubic-bezier(0.22, 0.7, 0.2, 1), background 200ms cubic-bezier(0.22, 0.7, 0.2, 1);
        }
        .ls-strip-dot.is-on { background: ${C.violetBright}; transform: scale(1.3); }
        @media (min-width: 768px) {
          .ls-rev-grid {
            list-style: none; margin: 0; padding: 6px 0 10px;
            display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px; align-items: start;
          }
          /* a lone last card sits centred, never stretched across the row */
          .ls-rev-grid > li:last-child:nth-child(odd) { grid-column: 1 / -1; justify-self: center; width: 100%; max-width: 480px; }
          .ls-strip, .ls-strip-dots { display: none; }
        }
        @media (min-width: 1024px) {
          .ls-rev-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .ls-rev-grid > li:last-child:nth-child(odd) { grid-column: auto; justify-self: stretch; max-width: none; }
          .ls-rev-grid > li:last-child:nth-child(3n + 1) { grid-column: 2; }
        }

        /* the clean close — reviews are the last band now (2026-07-19 reorder:
           sell → value → pricing → reviews), so the wall ends by pointing back
           up to the offer, no orphan section after it. */
        .ls-reviews-close { margin: clamp(36px, 5vw, 56px) auto 0; text-align: center; display: flex; flex-direction: column; align-items: center; gap: clamp(18px, 3vw, 26px); }
        .ls-reviews-pull { margin: 0 auto; text-align: center; max-width: 38ch; color: ${C.violetBright}; font-family: "Newsreader", Georgia, serif; font-style: italic; font-size: clamp(1.02rem, 2.7vw, 1.2rem); line-height: 1.5; }
        .ls-reviews-cta { display: inline-flex; align-items: center; gap: 11px; padding: clamp(15px, 2.4vw, 18px) clamp(30px, 4.6vw, 42px); border-radius: 999px; border: 0; cursor: pointer; background: linear-gradient(180deg, #a78bfa 0%, #8266d9 45%, #6a4cc4 100%); color: #ffffff; font-family: "Newsreader", Georgia, serif; font-size: 18px; font-weight: 700; letter-spacing: 0.01em; box-shadow: 0 1px 0 rgba(255,255,255,0.4) inset, 0 -1px 0 rgba(0,0,0,0.28) inset, 0 14px 40px -8px rgba(124,92,214,0.55); transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s cubic-bezier(0.16,1,0.3,1); }
        .ls-reviews-cta:hover { transform: translateY(-2px); box-shadow: 0 1px 0 rgba(255,255,255,0.4) inset, 0 -1px 0 rgba(0,0,0,0.28) inset, 0 18px 48px -8px rgba(124,92,214,0.65); }
        .ls-reviews-cta:focus-visible { outline: 2px solid ${C.goldSoft}; outline-offset: 3px; }
        .ls-reviews-cta svg { transition: transform 0.3s cubic-bezier(0.16,1,0.3,1); }
        .ls-reviews-cta:hover svg { transform: translateX(3px); }

        /* ── REDUCED MOTION: the grid is already at rest; only the glint and
             micro-transitions step aside. ── */
        @media (prefers-reduced-motion: reduce) {
          .ls-spot-sweep { animation: none !important; opacity: 0 !important; }
          .ls-rev-body, .ls-rev-fig, .ls-rev-fig::before, .ls-strip-dot { transition: none; }
          .ls-reviews-cta, .ls-reviews-cta svg { transition: none !important; }
        }
        /* .is-static mirror (same rest-state law, togglable in code) */
        .ls-reviews.is-static .ls-spot-sweep { animation: none !important; opacity: 0 !important; }
        .ls-reviews.is-static .ls-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
        .ls-reviews.is-static .ls-rev-body, .ls-reviews.is-static .ls-rev-fig, .ls-reviews.is-static .ls-rev-fig::before, .ls-reviews.is-static .ls-strip-dot { transition: none; }

        /* ==== TYPE FLOORS - tuned per viewport (2026-07-14; wall rebuild 2026-07-16) ====
           Grid/strip card quotes deliberately HOLD 18px at every width (no
           19px 1280 bump: the spotlight carries the large voice). */
        .ls-reviews-eyebrow { font-size: 14px; }
        .ls-rev-quote { font-size: 18px; }
        .ls-rev-more { font-size: 18px; }
        .ls-reviews-pull { font-size: 18px; }
        .ls-spot-quote { font-size: clamp(18.5px, 4.9vw, 20.8px); }
        @media (min-width: 768px) {
          .ls-reviews-eyebrow { font-size: 14.5px; }
          .ls-reviews-pull { font-size: 18.5px; }
          .ls-spot-quote { font-size: clamp(19.5px, 2vw, 24px); }
        }
        @media (min-width: 1280px) {
          .ls-reviews-eyebrow { font-size: 15px; }
          .ls-reviews-pull { font-size: 19.5px; }
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
        <span className="block text-[14px] font-medium uppercase tracking-[0.16em]" style={{ color: C.gold }}>
          Image slot
        </span>
        <span className="mt-1 block text-[15px]" style={{ color: C.cream }}>{item.title}</span>
        <span className="block text-[14px]" style={{ color: C.muted }}>{item.note}</span>
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
      /* Near-instant reveal (NN/g: scroll-triggered text animations delay
         readers). Fast fade so the words are legible almost immediately;
         the rise runs a touch longer than the fade to keep the composed
         feel without ever making anyone wait for copy. */
      .ls-reveal {
        opacity: 0;
        transform: translate3d(0, 12px, 0);
        transition:
          opacity 0.32s ease-out,
          transform 0.5s cubic-bezier(0.22, 0.7, 0.2, 1);
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
        transform: translate3d(0, 10px, 0);
        filter: blur(5px);
        transition:
          opacity 0.38s ease-out,
          transform 0.55s cubic-bezier(0.22, 0.7, 0.2, 1),
          filter 0.45s cubic-bezier(0.22, 0.7, 0.2, 1);
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
      /* === "Set the chart" card — C v2: a near-transparent surface whose
         real border is the passage's violet thread, drawn shut on arrival.
         The button waits at half light and IGNITES when the border seals
         (data attributes set by the CosmicBridge thread engine). ==== */
      .ls-seal-card {
        position: relative;
        width: 100%; max-width: 480px;
        display: block; text-align: left;
        padding: clamp(28px, 5vw, 44px) clamp(22px, 4.5vw, 40px);
        border: 1px solid rgba(167,139,250,0.13); border-radius: 18px;
        background: rgba(139,123,216,0.055);
      }
      .ls-seal-lead {
        margin: 0 0 10px;
        color: #f5f2ff; font-family: "Fraunces", Georgia, serif; font-weight: 400;
        font-size: clamp(1.25rem, 1.8vw + 0.7rem, 1.6rem); line-height: 1.3;
        letter-spacing: -0.008em;
      }
      .ls-seal-deliv {
        margin: 0 0 26px; max-width: 44ch;
        color: rgba(245,242,255,0.8); font-family: "Newsreader", Georgia, serif;
        font-size: 18px; line-height: 1.55;
      }
      .ls-seal-free {
        margin: 12px 0 0; text-align: center;
        color: rgba(245,242,255,0.82); font-family: "Newsreader", Georgia, serif;
        font-size: 17.5px; line-height: 1.4;
      }
      .ls-hero-sub {
        margin: 18px 0 0; max-width: 46ch;
        color: rgba(245,242,255,0.86); font-family: "Newsreader", Georgia, serif;
        font-size: clamp(1.1rem, 1.2vw + 0.85rem, 1.35rem); line-height: 1.55;
      }
      .ls-hero-attr {
        margin: 16px 0 0; font-family: "Newsreader", Georgia, serif;
        font-style: italic; font-size: 1.02rem; letter-spacing: 0.02em;
        color: rgba(245,242,255,0.62);
      }
      .ls-seal-field { display: block; width: 100%; margin-bottom: 26px; text-align: left; }
      .ls-seal-field label {
        display: block; margin-bottom: 8px;
        color: #b3a7e0; font-family: "Newsreader", Georgia, serif;
        font-size: 16px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase;
      }
      .ls-seal-field label span {
        color: rgba(245,242,255,0.55); font-weight: 400; font-style: italic;
        text-transform: none; letter-spacing: 0.04em;
      }
      .ls-seal-field input {
        width: 100%; min-height: 46px;
        background: transparent; border: 0; border-radius: 0;
        border-bottom: 1px solid rgba(167,139,250,0.32);
        padding: 10px 2px 12px; color: #f5f2ff;
        font-family: "Newsreader", Georgia, serif; font-size: 18px;
        caret-color: ${C.violetBright}; color-scheme: dark;
        transition: border-color 500ms ease;
      }
      .ls-seal-field input:focus { outline: none; border-bottom-color: #a78bfa; }
      .ls-seal-field input::-webkit-calendar-picker-indicator { filter: invert(0.8) sepia(1) saturate(3) hue-rotate(215deg); cursor: pointer; }
      .ls-seal-card[data-sealed] .ls-seal-field input { border-bottom-color: rgba(167,139,250,0.5); }
      .ls-seal-hint {
        margin: 9px 0 0; color: rgba(245,242,255,0.55);
        font-family: "Newsreader", Georgia, serif; font-style: italic; font-size: 16px; line-height: 1.5;
      }
      /* Per-field error: the message sits beside its field in the same voice
         and colour as the branded chart message, and the field's underline
         lifts to match, so eye lands on both together. */
      .ls-field-err {
        margin: 9px 0 0; color: ${C.goldSoft};
        font-family: "Newsreader", Georgia, serif; font-size: 15.5px; line-height: 1.5;
      }
      .ls-seal-field[data-err] input {
        border-bottom-color: ${C.goldSoft};
        box-shadow: 0 1px 0 0 rgba(207,192,244,0.35);
      }
      .ls-seal-field[data-err] label { color: ${C.goldSoft}; }
      /* Quiet success mark on the email field: a small check that fades in on
         blur when the address parses. Decorative only, announced by nothing. */
      .ls-email-wrap { position: relative; }
      .ls-email-ok {
        position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
        display: inline-flex; color: ${C.violetBright};
        opacity: 0; transition: opacity 400ms ease; pointer-events: none;
      }
      .ls-email-ok.is-on { opacity: 1; }
      @media (prefers-reduced-motion: reduce) {
        .ls-email-ok { transition: none; }
      }
      .ls-seal-card .ls-seal-cta {
        display: flex; align-items: center; justify-content: center; gap: 10px;
        width: 100%; min-height: 58px; margin-top: 6px;
        border: 0; border-radius: 13px; cursor: pointer;
        background: linear-gradient(135deg, #a78bfa, #8b7bd8);
        color: #0d0a14; font-family: "Fraunces", Georgia, serif; font-size: 19px; font-weight: 600;
        letter-spacing: 0.01em;
        transition: transform 250ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 800ms ease, filter 800ms ease;
        box-shadow: 0 4px 26px rgba(139,123,216,0.28);
      }
      /* half-light until the thread seals the border, then IGNITION */
      .ls-seal-card[data-thread-arm]:not([data-sealed]) .ls-seal-cta {
        filter: saturate(0.5) brightness(0.8);
        box-shadow: 0 2px 12px rgba(139,123,216,0.12);
      }
      .ls-seal-card[data-sealed] .ls-seal-cta {
        filter: none; box-shadow: 0 6px 34px rgba(167,139,250,0.48);
        animation: lsSealIgnite 850ms cubic-bezier(0.2,0.9,0.3,1.15) both;
      }
      @keyframes lsSealIgnite { 0% { transform: scale(0.985); } 55% { transform: scale(1.018); } 100% { transform: scale(1); } }
      .ls-seal-card .ls-seal-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(167,139,250,0.4); }
      .ls-seal-card .ls-seal-cta:active { transform: scale(0.985); }
      .ls-seal-card .ls-seal-cta:focus-visible { outline: 2px solid #f5f2ff; outline-offset: 3px; }
      .ls-seal-card .ls-chart-message { margin-top: 14px; text-align: left; }
      @media (prefers-reduced-motion: reduce) {
        .ls-seal-card[data-thread-arm]:not([data-sealed]) .ls-seal-cta { filter: none; box-shadow: 0 4px 26px rgba(139,123,216,0.28); }
        .ls-seal-card[data-sealed] .ls-seal-cta { animation: none; }
        .ls-seal-cta { transition: none; }
      }

      /* ── Resume strip: the quiet way back into an open reading ────────── */
      .ls-resume-wrap {
        display: flex; justify-content: center;
        padding: 88px 20px 0;
      }
      .ls-resume-strip {
        display: flex; align-items: center; justify-content: center; gap: 18px; flex-wrap: wrap;
        width: 100%; max-width: 640px;
        padding: 14px 20px;
        border: 1px solid rgba(167,139,250,0.18); border-radius: 14px;
        background: rgba(139,123,216,0.08);
      }
      .ls-resume-line {
        margin: 0; color: #f5f2ff;
        font-family: "Newsreader", Georgia, serif; font-size: 17px; line-height: 1.4;
      }
      .ls-resume-btn {
        flex: 0 0 auto; min-height: 42px; padding: 8px 18px;
        border: 1px solid rgba(167,139,250,0.45); border-radius: 11px; cursor: pointer;
        background: transparent; color: #d8ceff;
        font-family: "Newsreader", Georgia, serif; font-size: 16px;
        transition: background 300ms ease, color 300ms ease;
      }
      .ls-resume-btn:hover { background: rgba(167,139,250,0.16); color: #f5f2ff; }
      .ls-resume-btn:focus-visible { outline: 2px solid #f5f2ff; outline-offset: 3px; }
      .ls-resume-btn:disabled { opacity: 0.6; cursor: default; }
      @media (max-width: 560px) {
        .ls-resume-strip { flex-direction: column; gap: 10px; text-align: center; }
      }
      @media (prefers-reduced-motion: reduce) {
        .ls-resume-btn { transition: none; }
      }

      /* ── One-tap species (free reading) — cosmic violet, no gold ──────── */
      .ls-seal-species { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 4px; }
      /* The here/memory choice on the form reuses the species pills at two
         columns, so a cold visitor reads it as the same kind of one-tap choice. */
      .ls-seal-register { grid-template-columns: repeat(2, 1fr); }
      .ls-species-btn {
        min-height: 56px; display: flex; align-items: center; justify-content: center;
        border: 1px solid rgba(167,139,250,0.32); border-radius: 13px;
        background: rgba(139,123,216,0.05);
        color: #e9e3ff; font-family: "Newsreader", Georgia, serif; font-size: 18px;
        cursor: pointer; transition: border-color 220ms ease, background 220ms ease, color 220ms ease, transform 180ms ease;
        -webkit-tap-highlight-color: transparent;
      }
      .ls-species-btn:hover { border-color: rgba(167,139,250,0.62); background: rgba(139,123,216,0.11); }
      .ls-species-btn:active { transform: scale(0.98); }
      .ls-species-btn.is-sel {
        background: linear-gradient(135deg, #a78bfa, #8b7bd8);
        color: #0d0a14; border-color: #a78bfa; font-weight: 600;
        box-shadow: 0 4px 20px rgba(139,123,216,0.32);
      }
      .ls-species-btn:focus-visible { outline: 2px solid #f5f2ff; outline-offset: 3px; }
      @media (prefers-reduced-motion: reduce) { .ls-species-btn { transition: none; } }

      /* ── Optional pet photo (free reading) — cosmic violet, no gold ────── */
      .ls-seal-photo { position: relative; }
      .ls-photo-input { position: absolute; width: 1px; height: 1px; opacity: 0; overflow: hidden; pointer-events: none; }
      .ls-photo-drop {
        display: flex; align-items: center; justify-content: center; gap: 11px;
        width: 100%; min-height: 58px; padding: 15px 18px;
        border: 1px dashed rgba(167,139,250,0.42); border-radius: 14px;
        background: rgba(139,123,216,0.06);
        color: #e9e3ff; font-family: "Newsreader", Georgia, serif; font-size: 17px;
        cursor: pointer; transition: border-color 300ms ease, background 300ms ease, transform 200ms ease;
      }
      .ls-photo-drop:hover { border-color: rgba(167,139,250,0.72); background: rgba(139,123,216,0.11); }
      .ls-photo-drop:active { transform: scale(0.99); }
      .ls-photo-drop:focus-visible { outline: 2px solid #a78bfa; outline-offset: 3px; }
      .ls-photo-drop:disabled { cursor: wait; opacity: 0.85; }
      .ls-photo-drop .ls-photo-mark { font-size: 22px; color: #b9a5f0; flex: 0 0 auto; }
      .ls-photo-spin { flex: 0 0 auto; width: 18px; height: 18px; border-radius: 50%; border: 2px solid rgba(167,139,250,0.28); border-top-color: #b9a5f0; animation: lsPhotoSpin 0.8s linear infinite; }
      @keyframes lsPhotoSpin { to { transform: rotate(360deg); } }
      .ls-photo-info { margin-top: 12px; }
      .ls-photo-privacy { margin: 7px 0 0; color: rgba(245,242,255,0.42); font-family: "Newsreader", Georgia, serif; font-size: 14px; line-height: 1.5; letter-spacing: 0.01em; }
      .ls-photo-err { margin: 9px 0 0; color: #c9b8f0; font-family: "Newsreader", Georgia, serif; font-style: italic; font-size: 15px; line-height: 1.45; }
      .ls-photo-preview { display: flex; align-items: center; gap: 15px; padding: 6px 2px 2px; }
      .ls-photo-thumb { position: relative; flex: 0 0 auto; width: 62px; height: 62px; display: grid; place-items: center; }
      .ls-photo-thumb-glow { position: absolute; inset: -24%; border-radius: 50%; background: radial-gradient(circle, rgba(154,126,230,0.42), transparent 70%); filter: blur(9px); }
      .ls-photo-thumb img { position: relative; width: 62px; height: 62px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(185,165,240,0.6); box-shadow: 0 0 0 4px rgba(124,92,214,0.12), 0 6px 18px rgba(4,2,12,0.5); }
      .ls-photo-preview-side { flex: 1 1 auto; min-width: 0; }
      .ls-photo-ready { margin: 0; color: rgba(245,242,255,0.74); font-family: "Newsreader", Georgia, serif; font-style: italic; font-size: 15.5px; line-height: 1.45; }
      .ls-photo-actions { display: flex; align-items: center; gap: 10px; margin-top: 7px; color: rgba(245,242,255,0.3); font-size: 14px; }
      .ls-photo-link { border: 0; background: transparent; padding: 0; color: #b9a5f0; font-family: "Newsreader", Georgia, serif; font-size: 15px; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; text-decoration-color: rgba(185,165,240,0.4); transition: color 200ms ease; }
      .ls-photo-link:hover { color: #d9cffb; }
      .ls-photo-link:focus-visible { outline: 2px solid #a78bfa; outline-offset: 2px; border-radius: 3px; }
      @media (prefers-reduced-motion: reduce) {
        .ls-photo-spin { animation-duration: 1.4s; }
        .ls-photo-drop { transition: none; }
      }
      /* Results-screen optional photo card (post-email, non-blocking) */
      .ls-photo-card { text-align: center; }
      .ls-photo-card .ls-photo-info, .ls-photo-card .ls-photo-privacy { text-align: center; }
      .ls-photo-drop-lg { min-height: 128px; flex-direction: column; gap: 14px; padding: 26px 20px; border-radius: 18px; font-size: 18px; }
      .ls-photo-drop-lg .ls-photo-mark { font-size: 34px; }
      .ls-photo-card .ls-photo-preview { justify-content: center; padding: 8px 2px 4px; }
      .ls-photo-card .ls-photo-preview-side { flex: 0 1 auto; text-align: left; }
      .ls-photo-card .ls-photo-actions { justify-content: flex-start; }
      .ls-photo-card .ls-photo-thumb, .ls-photo-card .ls-photo-thumb img { width: 84px; height: 84px; }
      .ls-photo-proceed { margin-top: 22px; }

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
      .ls-seal-loading-sub { color: ${C.muted}; font-family: "Newsreader", Georgia, serif; font-size: 1rem; }

      /* the REAL placement shown on the solar-system bubble; generic meaning sits under it */
      .ls-orrery-placement {
        display: block; color: ${C.goldSoft};
        font-family: "Fraunces", Georgia, serif;
        font-size: clamp(1.35rem, 3.2vw, 2rem); font-weight: 600; line-height: 1.04; margin: 3px 0 1px;
      }
      .ls-orrery-line--info { color: ${C.muted} !important; font-size: clamp(1rem, 1.6vw, 1.08rem) !important; }

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
      /* ── The compute instrument: a breathing aura, a zodiac wheel that
         draws itself in, orbits whose planets settle onto their rings, a
         scanning sweep, and a core that flares as the sky is set. ── */
      .ls-compute-aura {
        position: absolute; top: 41%; left: 50%; width: 300px; height: 300px; margin: -150px 0 0 -150px;
        border-radius: 50%; pointer-events: none;
        background: radial-gradient(circle, rgba(154,126,230,0.24) 0%, rgba(124,92,214,0.10) 42%, transparent 70%);
        filter: blur(10px);
        animation: ls-aura-breath 5.5s ease-in-out infinite alternate;
      }
      @keyframes ls-aura-breath { from { opacity: 0.55; transform: scale(0.92); } to { opacity: 1; transform: scale(1.08); } }
      .ls-compute-instrument { position: absolute; top: 41%; left: 50%; width: 190px; height: 190px; transform: translate(-50%, -50%); }
      .ls-compute-wheel { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
      .ls-cw-draw {
        fill: none; stroke: rgba(185,165,240,0.42); stroke-width: 1;
        stroke-dasharray: 540.4; stroke-dashoffset: 540.4;
        transform: rotate(-90deg); transform-box: view-box; transform-origin: 100px 100px;
        animation: ls-cw-draw 1.2s cubic-bezier(0.4,0,0.2,1) 0.1s forwards;
      }
      @keyframes ls-cw-draw { to { stroke-dashoffset: 0; } }
      .ls-cw-inner { fill: none; stroke: rgba(154,126,230,0.16); stroke-width: 1; opacity: 0; animation: ls-cw-fade 0.7s ease 0.55s forwards; }
      .ls-cw-tick { stroke: rgba(185,165,240,0.5); stroke-width: 1.2; stroke-linecap: round; opacity: 0; animation: ls-cw-fade 0.5s ease forwards; }
      @keyframes ls-cw-fade { to { opacity: 1; } }
      .ls-compute-ring { position: absolute; border-radius: 50%; border: 1px solid rgba(154,126,230,0.28); opacity: 0; animation: ls-ring-in 0.9s cubic-bezier(0.22,0.7,0.2,1) forwards; }
      .ls-cr-orbit { position: absolute; inset: 0; border-radius: 50%; animation: ls-spin var(--sp, 9s) linear infinite; }
      .ls-cr-orbit i { position: absolute; top: -3px; left: 50%; width: 6px; height: 6px; margin-left: -3px; border-radius: 50%; background: ${C.violetSoft}; box-shadow: 0 0 10px rgba(154,126,230,0.9); }
      @keyframes ls-ring-in { from { opacity: 0; transform: scale(0.82); } to { opacity: 1; transform: scale(1); } }
      .ls-compute-ring-1 { inset: 4px; --sp: 8s; animation-delay: 0.7s; }
      .ls-compute-ring-2 { inset: 30px; --sp: 12s; border-color: rgba(154,126,230,0.18); animation-delay: 0.95s; }
      .ls-compute-ring-2 .ls-cr-orbit { animation-direction: reverse; }
      .ls-compute-ring-2 .ls-cr-orbit i { background: ${C.violetBright}; box-shadow: 0 0 10px rgba(185,165,240,0.9); }
      .ls-compute-ring-3 { inset: 56px; --sp: 17s; border-style: dashed; border-color: rgba(237,233,247,0.12); animation-delay: 1.2s; }
      .ls-compute-ring-3 .ls-cr-orbit i { width: 5px; height: 5px; margin-left: -2.5px; background: ${C.violetSoft}; box-shadow: 0 0 8px rgba(154,126,230,0.8); }
      .ls-compute-sweep { position: absolute; inset: 0; border-radius: 50%; opacity: 0; background: conic-gradient(from 0deg, rgba(154,126,230,0.34), rgba(154,126,230,0) 30%); -webkit-mask: radial-gradient(circle, transparent 30%, #000 31%); mask: radial-gradient(circle, transparent 30%, #000 31%); animation: ls-cw-fade 0.6s ease 0.5s forwards, ls-spin 4.5s linear infinite; }
      .ls-compute-core {
        position: absolute; top: 50%; left: 50%; width: 20px; height: 20px; margin: -10px 0 0 -10px;
        border-radius: 50%;
        background: radial-gradient(circle at 40% 35%, ${C.cream}, ${C.violetBright} 46%, ${C.violet} 78%);
        box-shadow: 0 0 28px rgba(185,165,240,0.78);
        animation: ls-corepulse 3s ease-in-out infinite;
      }
      .ls-compute-core.is-lit { animation: none; box-shadow: 0 0 40px rgba(185,165,240,0.85); }
      .ls-compute-instrument.is-settle .ls-compute-core { animation: ls-core-flare 0.66s cubic-bezier(0.22,0.7,0.2,1) forwards; }
      @keyframes ls-core-flare {
        0% { transform: scale(1); box-shadow: 0 0 28px rgba(185,165,240,0.78); }
        55% { transform: scale(1.75); box-shadow: 0 0 64px 14px rgba(185,165,240,0.92); }
        100% { transform: scale(1.28); box-shadow: 0 0 46px 6px rgba(185,165,240,0.82); }
      }
      .ls-compute-instrument.is-settle .ls-compute-sweep { animation: ls-spin 1.7s linear infinite; opacity: 1; }
      .ls-compute-instrument.is-settle::after {
        content: ""; position: absolute; top: 50%; left: 50%; width: 20px; height: 20px; margin: -10px 0 0 -10px;
        border-radius: 50%; border: 1px solid rgba(185,165,240,0.6); pointer-events: none;
        animation: ls-settle-ring 0.66s ease-out forwards;
      }
      @keyframes ls-settle-ring { from { opacity: 0.8; transform: scale(1); } to { opacity: 0; transform: scale(11); } }
      .ls-compute-copy { position: absolute; bottom: 15%; left: 0; right: 0; padding: 0 24px; text-align: center; }
      .ls-compute-line {
        margin: 0; color: ${C.cream}; font-family: "Fraunces", Georgia, serif;
        font-size: clamp(1.15rem, 3.4vw, 1.5rem); line-height: 1.35;
        animation: ls-line-in 0.6s cubic-bezier(0.22,0.7,0.2,1) both;
      }
      @keyframes ls-line-in { from { opacity: 0; transform: translateY(9px); filter: blur(4px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
      .ls-compute-chips { position: absolute; bottom: 7%; left: 0; right: 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 14px; padding: 0 20px; min-height: 20px; }
      .ls-cchip { display: inline-flex; align-items: center; gap: 6px; color: rgba(185,165,240,0.3); font-family: "Newsreader", Georgia, serif; font-size: 13.5px; letter-spacing: 0.14em; text-transform: uppercase; transition: color 550ms ease; }
      .ls-cchip::before { content: ""; width: 5px; height: 5px; border-radius: 50%; background: currentColor; transition: box-shadow 550ms ease; }
      .ls-cchip.is-on { color: ${C.violetBright}; }
      .ls-cchip.is-on::before { box-shadow: 0 0 8px rgba(185,165,240,0.9); }
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
        .ls-compute-dust, .ls-compute-aura, .ls-compute-core, .ls-cr-orbit, .ls-compute-sweep, .ls-compute-line, .ls-sound-cta { animation: none !important; }
        .ls-compute-ring, .ls-cw-inner, .ls-cw-tick, .ls-compute-sweep { opacity: 1 !important; transform: none !important; animation: none !important; }
        .ls-cw-draw { stroke-dashoffset: 0 !important; animation: none !important; }
        .ls-compute-instrument.is-settle::after { animation: none !important; display: none; }
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
         C v2: the question stands huge, the answer is one compact toggle.
         The section shares the passage column's geometry so the violet
         thread can be born directly under the chosen path. */
      .ls-tgl-section {
        position: relative;
        z-index: 2;
        display: flex;
        flex-direction: column;
        justify-content: center;
        /* 64svh (was 72, was 86). The section is centred, so its min-height
           sets the tail: every extra pixel of height became dead black band
           between the sub-line and the passage's first whisper (165px of it at
           900vh). Trimmed here, and .c2-b1's top padding trimmed to match, so
           what's left reads as the thread travelling out of the choice.
           NO horizontal padding: .lcb-root has none either, and any mismatch
           shifts this column off the passage's. See THE COLUMN CONTRACT in
           CosmicBridge.tsx - the padding lives on .ls-tgl-col, from the same
           --c2-padl the passage uses. */
        min-height: 58svh;
        padding: 9svh 0 3svh;
        overflow: visible;
      }
      .ls-tgl-section::before {
        content: "";
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
        opacity: 0.55;
      }
      /* Same box as the passage's .c2-col, to the pixel: same width, same
         max-width, same margin, same padding-left, so the eyebrow, the
         question, the toggle and the sub-line share ONE text edge with every
         line of the passage below them. --c2-padl is THE COLUMN CONTRACT,
         declared once in CosmicBridge.tsx. Never hard-code it here again:
         84px lived here against the passage's 104px and the two columns
         visibly staggered. The right padding stays local - the toggle is a
         wide object and the right edge is ragged by design. */
      .ls-tgl-col {
        position: relative;
        z-index: 1;
        width: 100%;
        max-width: 760px;
        margin: 0 auto;
        padding-left: var(--c2-padl, 60px);
        padding-right: 2px;
        text-align: left;
      }
      @media (min-width: 900px) { .ls-tgl-col { padding-right: 20px; } }
      .ls-tgl-arc { display: none; }
      @media (min-width: 900px) {
        .ls-tgl-arc {
          display: block;
          position: absolute;
          z-index: 0;
          pointer-events: none;
          top: -14svh;
          right: calc(-1 * clamp(140px, 19vw, 270px));
          width: clamp(400px, 44vw, 580px);
          opacity: 0.55;
        }
        .ls-tgl-arc .haring { stroke: rgba(167,139,250,0.16); fill: none; stroke-width: 1.1; }
        .ls-tgl-arc .haring2 { stroke: rgba(167,139,250,0.09); fill: none; stroke-width: 1; }
        .ls-tgl-arc .hatick { stroke: rgba(167,139,250,0.2); stroke-width: 1; }
        .ls-tgl-arc .haplanet { display: none; }
      }
      .ls-tgl-micro {
        margin: 0 0 2.2svh;
        font-family: "Newsreader", Georgia, serif;
        font-size: 13px;
        font-weight: 500;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: #9d8ce0;
      }
      .ls-tgl-q {
        margin: 0 0 4.4svh;
        font-family: "Fraunces", Georgia, serif;
        font-weight: 400;
        font-size: clamp(2rem, 5.2vw + 0.9rem, 3.4rem);
        line-height: 1.12;
        letter-spacing: -0.016em;
        color: #f5f2ff;
        max-width: 12ch;
        text-wrap: balance;
      }
      .ls-tgl { border: 0; margin: 0; padding: 0; position: relative; z-index: 1; }
      .ls-tgl-track {
        position: relative;
        display: inline-flex;
        gap: 0;
        border: 1px solid rgba(167,139,250,0.28);
        border-radius: 999px;
        padding: 4px;
        background: rgba(139,123,216,0.06);
      }
      .ls-tgl-slider {
        position: absolute;
        top: 4px;
        left: 4px;
        height: calc(100% - 8px);
        border-radius: 999px;
        background: linear-gradient(135deg, #a78bfa, #8b7bd8);
        transition: transform 450ms cubic-bezier(0.34,1.56,0.64,1), width 450ms cubic-bezier(0.34,1.56,0.64,1);
        will-change: transform;
      }
      .ls-tgl input { position: absolute; opacity: 0; width: 1px; height: 1px; }
      .ls-tgl label {
        position: relative;
        z-index: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 46px;
        padding: 10px 22px;
        border-radius: 999px;
        cursor: pointer;
        font-family: "Newsreader", Georgia, serif;
        font-size: 16px;
        color: rgba(245,242,255,0.78);
        transition: color 300ms ease;
        -webkit-tap-highlight-color: transparent;
        white-space: nowrap;
      }
      .ls-tgl input:checked + label { color: #0d0a14; }
      .ls-tgl input:focus-visible + label { outline: 2px solid #a78bfa; outline-offset: 3px; }
      /* NOTE: font-size here is overridden by the readability tier block
         below (base / 768 / 1280). Change the size THERE, not here. */
      .ls-tgl-sub {
        margin: 2.6svh 0 0;
        font-family: "Newsreader", Georgia, serif;
        font-style: italic;
        font-size: 19px;
        color: rgba(245,242,255,0.92);
        min-height: 1.6em;
        max-width: 38ch;
        text-wrap: pretty;
        transition: opacity 220ms ease, transform 220ms ease;
      }
      .ls-tgl-sub.is-swap { opacity: 0; transform: translateY(6px); }
      @media (max-width: 520px) {
        .ls-tgl label { padding: 10px 14px; font-size: 16px; }
      }
      @media (prefers-reduced-motion: reduce) {
        .ls-tgl-slider { transition: none; }
        .ls-tgl-sub { transition: none; }
      }
      .ls-hero-cue {
        margin-top: clamp(16px, 3svh, 30px);
        display: inline-flex;
        align-items: center;
        gap: 9px;
        padding: 8px 6px;
        background: none;
        border: 0;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .ls-hero-cue-label {
        font-family: "Newsreader", Georgia, serif;
        font-size: 12.5px;
        font-weight: 500;
        letter-spacing: 0.24em;
        text-transform: uppercase;
        color: #b6a6e6;
      }
      .ls-hero-cue-arrow {
        color: rgba(185,165,240,0.9);
        animation: lsHeroCueDrift 2.4s ease-in-out infinite;
      }
      .ls-hero-cue:hover .ls-hero-cue-label { color: #cbbdf3; }
      .ls-hero-cue:hover .ls-hero-cue-arrow { color: #cbbdf3; }
      .ls-hero-cue:focus-visible { outline: 1px solid rgba(185,165,240,0.75); outline-offset: 4px; border-radius: 8px; }
      @keyframes lsHeroCueDrift {
        0%, 100% { transform: translateY(0); opacity: 0.75; }
        50% { transform: translateY(4px); opacity: 1; }
      }
      @media (prefers-reduced-motion: reduce) {
        .ls-hero-cue-arrow { animation: none; opacity: 1; transform: none; }
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
          min-height: 100svh;
          display: flex;
          align-items: flex-end;
          padding-top: 92px;
          padding-bottom: 52px;
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

      /* ==== TYPE FLOORS - tuned per viewport (2026-07-14). Danny: whole
         funnel readable for older eyes. Base tier = mobile 390-767:
         body/support >=18, whisper/settled >=17, eyebrows/labels >=14
         (bold, letterspaced), form inputs/labels >=17, buttons >=18.
         768-1279 mid tier and 1280+ desktop tier tuned separately. ==== */
      .ls-gold-button, .ls-ghost-button { font-size: 18px; }
      .ls-hero-memorial { font-size: 17px; }
      .ls-tgl-micro { font-size: 14px; }
      .ls-tgl label { font-size: 18px; }
      /* the chooser sub-line sits directly above the passage's first whisper
         and is read as part of it - keep this ladder in step with .c2-whisper
         (22/24/26) in CosmicBridge.tsx, one step quieter */
      .ls-tgl-sub { font-size: 20px; }
      .ls-bridge-beat { font-size: clamp(1.25rem, 2.4vw, 1.55rem); }
      .ls-seal-field label { font-size: 17px; }
      .ls-seal-hint, .ls-seal-help, .ls-seal-why, .ls-seal-loading-sub { font-size: 17px; }
      .ls-chart-message { font-size: 17px; }
      .ls-chart-form label, .ls-lead-form label { font-size: 17px; letter-spacing: 0.05em; }
      .ls-chart-form input, .ls-lead-form input { font-size: 17px; }
      .ls-chart-pill small { font-size: 15px; }
      .ls-orrery-label { font-size: 14px; letter-spacing: 0.1em; }
      .ls-orrery-name { font-size: 14px; }
      .ls-orrery-pt { font-size: 14px; }
      .ls-orrery-bubble .ls-orrery-line { font-size: 18px; line-height: 1.36; }
      .ls-orrery-line--info { font-size: 17px !important; }
      .ls-sys-node { font-size: clamp(0.875rem, 2.6vw, 1.5rem); }
      .ls-sys-glyph { font-size: clamp(0.875rem, 2.6vw, 1.4rem); }
      .ls-journey-overview { font-size: 14px; }
      .ls-journey-name, .ls-dock-text .ls-journey-name { font-size: 14px; }
      .ls-journey-count, .ls-journey-step-count, .ls-journey-focus-label { font-size: 14px; }
      .ls-journey-reveal-item span { font-size: 14px; }
      .ls-journey-reveal-item small { font-size: 15px; }
      .ls-jbtn--sound { font-size: 14px; }
      .ls-sound-cta { font-size: 17px; }
      .ls-start-eyebrow { font-size: 14px; }
      .ls-start-sub { font-size: 18px; }
      .ls-start-quiet { font-size: 17px; }
      .ls-reveal-eyebrow, .ls-locked-eyebrow { font-size: 14px; }
      .ls-free-frame, .ls-free-head { font-size: 14px; }
      .ls-free-card small { font-size: 17px; line-height: 1.45; }
      .ls-teaser-lock { font-size: 14px; }
      .ls-teaser-title { font-size: 18px; }
      .ls-teaser-line { font-size: 14px; }
      .ls-upsell-pitch { font-size: 18px; }
      .ls-receive-item p { font-size: 18px; }
      .ls-trow-name { font-size: 18px; }
      .ls-trow-sign, .ls-trow-frame { font-size: 14px; }
      .ls-trow-line { font-size: 18px; }
      .ls-trow.is-free .ls-trow-line { font-size: 18px; }
      .ls-trow.is-tease .ls-trow-name { font-size: 17.5px; }
      .ls-planet-head { font-size: 14px; }
      .ls-planet-card small { font-size: 15px; }
      .ls-planet-sign { font-size: 18px; }
      .ls-calc-stat-label { font-size: 14px; }
      .ls-calc-stat-body { font-size: 17px; }
      .ls-calc-lead { font-size: 18px; }
      .ls-calc-figure figcaption { font-size: 15px; }
      .ls-calc-toggle-hint { font-size: 14px; }
      .ls-sky-gate p { line-height: 1.3; }
      .ls-sky-gate small { font-size: 17px; }
      .ls-sky-bridge-lead { font-size: 18px; }
      .ls-compute-readout { font-size: 15px; }
      .ls-wheel-info { font-size: 17px; }
      .ls-wheel-info-mark { font-size: 14px; }
      .ls-info-back { font-size: 15px; }
      .ls-info-title { font-size: 14px; }
      .ls-info-note { font-size: 17px; }
      .ls-offer-stack { font-size: 18px; }
      .ls-offer-trust { font-size: 18px; }
      .ls-video-seed, .ls-video-fallback { font-size: 14px; }
      .ls-video-seed strong, .ls-video-fallback strong { line-height: 1.3; }
      @media (min-width: 768px) {
        .ls-hero-memorial { font-size: 17.5px; }
        .ls-tgl-micro { font-size: 14.5px; }
        .ls-tgl-sub { font-size: 21px; }
        .ls-seal-hint, .ls-seal-help, .ls-seal-why, .ls-seal-loading-sub, .ls-chart-message { font-size: 17.5px; }
        .ls-orrery-bubble .ls-orrery-line { font-size: 19px; }
        .ls-orrery-line--info { font-size: 17.5px !important; }
        .ls-sound-cta, .ls-start-quiet { font-size: 17.5px; }
        .ls-start-sub { font-size: 18.5px; }
        .ls-free-card small { font-size: 17.5px; }
        .ls-teaser-title { font-size: 18.5px; }
        .ls-upsell-pitch, .ls-receive-item p, .ls-trow-line, .ls-trow-name { font-size: 18.5px; }
        .ls-calc-stat-body, .ls-sky-gate small, .ls-wheel-info, .ls-info-note { font-size: 17.5px; }
        .ls-calc-lead { font-size: 19px; }
        .ls-sky-bridge-lead { font-size: 19px; }
        .ls-offer-stack { font-size: 19px; }
        .ls-offer-trust { font-size: 18.5px; }
      }
      @media (min-width: 1280px) {
        .ls-gold-button, .ls-ghost-button { font-size: 19px; }
        .ls-hero-memorial { font-size: 18px; }
        .ls-tgl-micro { font-size: 15px; }
        .ls-tgl-sub { font-size: 22px; }
        .ls-seal-field label { font-size: 17.5px; }
        .ls-seal-hint, .ls-seal-help, .ls-seal-why, .ls-seal-loading-sub, .ls-chart-message { font-size: 18px; }
        .ls-chart-form input, .ls-lead-form input { font-size: 17.5px; }
        .ls-chart-pill small { font-size: 15.5px; }
        .ls-orrery-label, .ls-orrery-name, .ls-orrery-pt { font-size: 15px; }
        .ls-orrery-bubble .ls-orrery-line { font-size: 22px; }
        .ls-orrery-line--info { font-size: 18px !important; }
        .ls-journey-overview, .ls-journey-name, .ls-dock-text .ls-journey-name,
        .ls-journey-count, .ls-journey-step-count, .ls-journey-focus-label,
        .ls-journey-reveal-item span { font-size: 15px; }
        .ls-journey-reveal-item small { font-size: 15.5px; }
        .ls-jbtn--sound { font-size: 15px; }
        .ls-sound-cta, .ls-start-quiet { font-size: 18px; }
        .ls-start-eyebrow { font-size: 15px; }
        .ls-start-sub { font-size: 19px; }
        .ls-reveal-eyebrow, .ls-locked-eyebrow, .ls-free-frame, .ls-free-head,
        .ls-teaser-lock, .ls-teaser-line { font-size: 15px; }
        .ls-free-card small { font-size: 18px; }
        .ls-teaser-title { font-size: 19px; }
        .ls-upsell-pitch, .ls-receive-item p, .ls-trow-line, .ls-trow-name { font-size: 19px; }
        .ls-trow.is-free .ls-trow-line { font-size: 19.5px; }
        .ls-trow.is-tease .ls-trow-name { font-size: 18.5px; }
        .ls-trow-sign, .ls-trow-frame, .ls-planet-head, .ls-calc-stat-label,
        .ls-calc-toggle-hint, .ls-wheel-info-mark, .ls-info-title,
        .ls-video-seed, .ls-video-fallback { font-size: 15px; }
        .ls-planet-card small { font-size: 15.5px; }
        .ls-planet-sign { font-size: 19px; }
        .ls-calc-stat-body, .ls-sky-gate small, .ls-wheel-info, .ls-info-note { font-size: 18px; }
        .ls-calc-lead { font-size: 20.5px; }
        .ls-calc-figure figcaption { font-size: 15.5px; }
        .ls-sky-bridge-lead { font-size: 23px; }
        .ls-compute-readout { font-size: 16px; }
        .ls-info-back { font-size: 15.5px; }
        .ls-offer-stack { font-size: 21.5px; }
        .ls-offer-trust { font-size: 19.5px; }
      }

      /* ==== TYPE FLOORS - 2026-07-16 rebuild reconciliation ====
         Floors for the sections rebuilt in the funnel-ship pass (free deck,
         rest of their sky, keepsake plate, reviews wall, price lead, sticky
         begin bar). Each rebuilt section ALSO carries this same block at the
         tail of its own <style> tag (those tags render after this sheet, so
         they settle any tie); the values are mirrored here so this end-of-file
         block stays the single written authority. Keep BOTH copies in step. */
      .ls-stickybegin button { font-size: 18px; }
      .ls-pricelead-eyebrow { font-size: 14px; }
      .ls-rs-eyebrow, .ls-rs-sealline, .ls-rs-hz-label { font-size: 14px; }
      .ls-rs-lead, .ls-rs-hook, .ls-rs-rising, .ls-rs-close-line { font-size: 18px; }
      .ls-rs-close-cta { font-size: 19px; }
      .ls-rs-led-cap { font-size: 13px; }
      .ls-rs-idx { font-size: 12.5px; }
      .ls-vm-eyebrow, .ls-vm-label { font-size: 14px; }
      .ls-vm-line, .ls-vm-pull { font-size: 18px; }
      .ls-reviews-eyebrow { font-size: 14px; }
      .ls-rev-quote, .ls-rev-more, .ls-reviews-pull { font-size: 18px; }
      .ls-spot-quote { font-size: clamp(18.5px, 4.9vw, 20.8px); }
      @media (min-width: 768px) {
        .ls-pricelead-eyebrow { font-size: 14.5px; }
        .ls-rs-eyebrow, .ls-rs-sealline, .ls-rs-hz-label { font-size: 14.5px; }
        .ls-rs-lead, .ls-rs-hook, .ls-rs-rising, .ls-rs-close-line { font-size: 18.5px; }
        .ls-rs-close-cta { font-size: 19px; }
        .ls-rs-led-cap { font-size: 14px; }
        .ls-rs-idx, .ls-rs-led-sign { font-size: 12.5px; }
        .ls-vm-eyebrow, .ls-vm-label { font-size: 14.5px; }
        .ls-vm-line, .ls-vm-pull { font-size: 18.5px; }
        .ls-reviews-eyebrow { font-size: 14.5px; }
        .ls-reviews-pull { font-size: 18.5px; }
        .ls-spot-quote { font-size: clamp(19.5px, 2vw, 24px); }
      }
      @media (min-width: 1024px) {
        .ls-dk-l1 { font-size: 1.02rem; }
        .ls-dk-beats { font-size: 1.5rem; }
        .ls-dk-tell { font-size: 1.26rem; }
        .ls-dk-sealtext { font-size: 14.5px; }
        .ls-dk-eyebrow { font-size: 13px; }
      }
      @media (min-width: 1280px) {
        .ls-stickybegin button { font-size: 19px; }
        .ls-pricelead-eyebrow { font-size: 15px; }
        .ls-rs-eyebrow, .ls-rs-sealline, .ls-rs-hz-label { font-size: 15px; }
        .ls-rs-lead { font-size: 19.5px; }
        .ls-rs-hook, .ls-rs-rising, .ls-rs-close-line { font-size: 19px; }
        .ls-rs-close-cta { font-size: 20px; }
        .ls-rs-idx { font-size: 13px; }
        /* led-sign holds 12.5px at 1280: 13px overflows the one-row ledger */
        .ls-rs-led-sign { font-size: 12.5px; }
        .ls-vm-eyebrow, .ls-vm-label { font-size: 15px; }
        .ls-vm-line, .ls-vm-pull { font-size: 19px; }
        .ls-reviews-eyebrow { font-size: 15px; }
        .ls-reviews-pull { font-size: 19.5px; }
      }
    `}</style>
  );
}

function revealDelay(seconds: number): CSSProperties {
  // Stagger scaled down 40%: the relative choreography survives, the
  // absolute wait for copy does not (reveals must feel near-instant).
  return { ["--ls-delay" as string]: `${(seconds * 0.6).toFixed(3)}s` } as CSSProperties;
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
  // sized for the longer quote: elegant at both ends, wraps to a few lines
  fontSize: "clamp(1.85rem, 4.6vw + 0.5rem, 3.75rem)",
  fontWeight: 500,
  lineHeight: 1.08,
  letterSpacing: "-0.014em",
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
  fontSize: "clamp(18px, 1vw + 14px, 19px)",
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
    fontSize: "clamp(14px, 1.2vw + 9px, 15px)",
    fontWeight: 600,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
  };
}

export default ReadingsLanding;
