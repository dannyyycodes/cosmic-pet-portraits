import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent, ReactNode, RefObject } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { animate, AnimatePresence, motion, useMotionTemplate, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import Lenis from "lenis";
import { InlineCheckout } from "./InlineCheckout";
import { supabase } from "@/integrations/supabase/client";

const C = {
  ink: "#141210",
  cream: "#ffffff",
  creamDim: "#ececf2",
  muted: "#c8c8d2",
  gold: "#d4b67a",
  goldSoft: "#f0d99f",
  goldDeep: "#8b6f3a",
  violet: "#7c5cd6",
  violetSoft: "#9a7ee6",
  cosmos: "#0d0a14",
  cosmos2: "#15101c",
  cosmos3: "#201722",
  line: "rgba(212, 182, 122, 0.22)",
  lineSoft: "rgba(245, 239, 230, 0.10)",
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
  saturn: "/readings/planets-nasa/saturn.png",
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

const FAQ = [
  {
    q: "What if I don't know their exact birthday?",
    a: "Use the closest date you have. Rescue and adopted little souls are welcome. The reading works with honest uncertainty, and keeps the astrology grounded.",
  },
  {
    q: "Is this only for dogs and cats?",
    a: "No. Dogs and cats are common, but any beloved soul can have a reading, once you can share their story.",
  },
  {
    q: "Is this separate from Pawtraits?",
    a: "Yes. Pawtraits is the portrait studio. This is the soul behind the picture.",
  },
];

export function ReadingsLanding() {
  const pageRef = useRef<HTMLElement>(null);
  const checkoutRef = useRef<HTMLDivElement>(null);
  const [selectedPrice, setSelectedPrice] = useState(0);
  useCosmicParallax(pageRef);
  useScrollReveal(pageRef);
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

  const scrollToCheckout = () => {
    checkoutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main ref={pageRef} className="ls-cosmic-page min-h-screen" style={{ background: C.cosmos, color: C.cream, overflowX: "clip" }}>
      <CosmicStyles />
      <CosmicBackdrop />
      <HeroSection onBegin={scrollToCheckout} />
      <BirthSkyJourney />
      <CheckoutSection
        checkoutRef={checkoutRef}
        selectedPrice={selectedPrice}
        onSelectedPriceChange={setSelectedPrice}
      />
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
function useScrollReveal(pageRef: RefObject<HTMLElement>) {
  useEffect(() => {
    const page = pageRef.current;
    if (!page || typeof window === "undefined") return;
    const nodes = Array.from(page.querySelectorAll<HTMLElement>(".ls-reveal"));
    if (!nodes.length) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );
    nodes.forEach((node) => io.observe(node));
    return () => io.disconnect();
  }, [pageRef]);
}

function HeroSection({ onBegin }: { onBegin: () => void }) {
  return (
    <section className="ls-hero-section ls-parallax-band relative isolate min-h-[820px] px-5 pb-24 pt-28 sm:pt-34 lg:flex lg:min-h-[920px] lg:items-center">
      <HeroBackdropVideo />
      <div className="ls-hero-veil absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_72%_10%,rgba(212,182,122,0.08),transparent_34%),radial-gradient(ellipse_at_12%_18%,rgba(94,70,122,0.16),transparent_30%),linear-gradient(100deg,rgba(8,6,11,0.76)_0%,rgba(8,6,11,0.44)_34%,rgba(8,6,11,0.08)_68%,rgba(8,6,11,0.10)_100%)]" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center">
        <div className="ls-hero-copy max-w-2xl">
          <h1 className="ls-reveal mt-5 text-balance" style={{ ...heroTitleStyle, ...revealDelay(0.08) }}>
            Behind every soul, a cosmos.
          </h1>
          <div className="ls-reveal mt-9 flex flex-col gap-3 sm:flex-row" style={revealDelay(0.24)}>
            <button onClick={onBegin} className="ls-gold-button ls-violet-button">
              Begin Their Reading <ArrowRight size={17} />
            </button>
            <a href="#computed-sky" className="ls-ghost-button">
              Compute their sky, free
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function BirthChartPreviewSection() {
  const [petName, setPetName] = useState("");
  const [date, setDate] = useState("");
  const [chart, setChart] = useState<PetBirthChart | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [calcOpen, setCalcOpen] = useState(false);

  const name = petName.trim();
  const bodyFor = (key: (typeof PLANET_ORDER)[number]): ChartBody | undefined =>
    chart ? (chart[key] as ChartBody | undefined) : undefined;

  const handlePreview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!date) {
      setStatus("error");
      setMessage("Choose their birth date or adoption date first.");
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!/.+@.+\..+/.test(cleanEmail)) {
      setStatus("error");
      setMessage("Enter your email to calculate their free chart.");
      return;
    }

    setStatus("loading");
    setMessage("");
    try {
      try {
        await supabase.functions.invoke("track-subscriber", {
          body: {
            email: cleanEmail,
            event: "birth_chart_lead",
            petName: name || null,
            source: "birth_chart_preview",
          },
        });
      } catch (error) {
        // Lead capture is best-effort; never block the chart on a hiccup.
        console.warn("[Little Souls] lead capture failed", error);
      }
      try {
        sessionStorage.setItem("ls_chart_email", cleanEmail);
      } catch {
        /* ignore */
      }

      const url = `${BIRTH_CHART_ENDPOINT}?date=${encodeURIComponent(date)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Birth chart request failed: ${response.status}`);
      const data = (await response.json()) as PetBirthChart;
      if (!data?.sun) throw new Error("Birth chart response was incomplete.");
      setChart(data);
      setStatus("ready");
      setMessage("");
    } catch (error) {
      console.warn("[Little Souls] birth chart preview failed", error);
      setChart(null);
      setStatus("error");
      setMessage("The chart did not open. Please try again in a moment.");
    }
  };

  const scrollToCheckout = () =>
    document.getElementById("begin")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <section id="computed-sky" className="ls-parallax-band relative px-5 pt-10 pb-18 sm:pt-14 sm:pb-28">
      <div className="ls-chart-shell mx-auto max-w-3xl">
        <SolarSystemBackdrop />
        <div className="relative z-10">
          <div className="ls-reveal">
            <p style={eyebrowStyle(C.cream)}>Computed sky · <span style={{ color: C.gold }}>free</span></p>
            <h3 className="mt-4 text-balance" style={chartTitleStyle}>
              Finally understand them
            </h3>
            <p className="mt-4 max-w-xl text-pretty" style={sectionBodyStyle}>
              The day they arrived, the sky was holding a chart. Their nature, their quirks, the odd little things, all written there. Enter their date. Meet who they really are.
            </p>
          </div>

          <form className="ls-lead-form ls-lead-form--card ls-reveal mt-7" style={revealDelay(0.08)} onSubmit={handlePreview}>
            <div className="ls-lead-row">
              <div className="ls-lead-field">
                <label htmlFor="chart-pet-name">Their name (optional)</label>
                <input
                  id="chart-pet-name"
                  type="text"
                  value={petName}
                  maxLength={40}
                  onChange={(event) => setPetName(event.target.value)}
                  placeholder="e.g. Bella"
                />
              </div>
              <div className="ls-lead-field">
                <label htmlFor="birth-chart-date">Birth or adoption date</label>
                <input
                  id="birth-chart-date"
                  type="date"
                  value={date}
                  onChange={(event) => {
                    setDate(event.target.value);
                    if (status === "error") {
                      setStatus("idle");
                      setMessage("");
                    }
                  }}
                  max="2030-12-31"
                />
              </div>
              <div className="ls-lead-field">
                <label htmlFor="birth-chart-email">Your email</label>
                <input
                  id="birth-chart-email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (status === "error") {
                      setStatus("idle");
                      setMessage("");
                    }
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>
            <button type="submit" className="ls-gold-button" disabled={status === "loading"}>
              {status === "loading"
                ? "Reading Their Sky..."
                : status === "ready"
                ? "Recalculate"
                : "Reveal their sky"}
              {status !== "loading" && <ArrowRight size={17} />}
            </button>
            {message && status === "error" && (
              <p className="ls-chart-message is-error">{message}</p>
            )}
          </form>

          {status === "ready" ? (
            <div className="mt-8">
              <div className="ls-sky-grid ls-sky-grid--live">
                {PLANET_ORDER.map((key, i) => (
                  <PlanetCard key={key} planet={key} body={bodyFor(key)} index={i} />
                ))}
                    <article className="ls-planet-card ls-element-card" style={revealDelay(0.585)}>
                      <span className="ls-planet-orb ls-element-orb" aria-hidden="true">✦</span>
                      <div className="ls-planet-body">
                        <span className="ls-planet-head">Dominant</span>
                        <strong className="ls-planet-sign">
                          {chart?.dominantElement ? `${chart.dominantElement} element` : "Calculated pattern"}
                        </strong>
                        <small>The thread running through all of it.</small>
                      </div>
                    </article>
                </div>

              <div className="ls-sky-bridge">
                <p className="ls-sky-bridge-lead">
                  That&apos;s their free sky. The full reading turns it into the story of how
                  {name ? ` ${name}` : " they"} love, what steadies them, and why they feel like home.
                </p>
                <button type="button" onClick={scrollToCheckout} className="ls-gold-button ls-sky-cta">
                  Read {name || "their"} full soul reading <ArrowRight size={17} />
                </button>
              </div>
            </div>
          ) : (
            <div className="ls-sky-teaser ls-reveal mt-8">
              <div className="ls-sky-grid ls-sky-preview" aria-hidden="true">
                {PLANET_ORDER.map((key) => (
                  <PlanetCard key={key} planet={key} />
                ))}
              </div>
              {status === "loading" && (
                <p className="ls-chart-message">Reading their sky...</p>
              )}
            </div>
          )}

          <CalcDropdown open={calcOpen} onToggle={() => setCalcOpen((v) => !v)} />
        </div>
      </div>
    </section>
  );
}

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

// Sign-true free-card lines for the three placements owners care about most.
// Honest to each sign's real archetype (Sun = identity, Moon = what soothes them,
// Venus = how they show love), present tense, ungendered for unnamed pets. Falls
// back to the planet-meaning line in JOURNEY_LINES if a sign is ever missing.
const SIGN_LINES: Record<string, Record<string, string>> = {
  sun: {
    Aries: "First through every door, last to back down. The want is loud and immediate, and they expect you to keep up.",
    Taurus: "Slow to move, impossible to rush. Comfort is a need, not a treat, and the loyalty settles in like weight on the bed.",
    Gemini: "Two moods before breakfast, curious about everything. They read the room, then change it.",
    Cancer: "Tender at the core, ruled by whoever feels like home. Their whole world is the people in it.",
    Leo: "Built for the best seat in the house, and they let you know when it is taken. The warmth is real, and it wants an audience of one. You.",
    Virgo: "Watchful and particular, quietly in charge of the routine. They notice the thing you moved.",
    Libra: "Happiest when the room is calm and the bond is even. They mirror your mood back, softer.",
    Scorpio: "All or nothing, and they decide which. What they give, they give completely, and they remember everything.",
    Sagittarius: "Born mid-adventure, nose to the wind. Fences are suggestions and the world is theirs to sniff.",
    Capricorn: "Serious for their age, steady under pressure. They earn their place, then hold it.",
    Aquarius: "Their own creature on their own clock. Affection on their terms, and odd, better terms than yours.",
    Pisces: "Soft-edged and tuned to feeling, yours before they are their own. They wait at the door and mean it.",
  },
  moon: {
    Aries: "Settles by doing, not sitting. Burn the energy off and the calm follows.",
    Taurus: "Safe means warm, fed, and exactly where they always sleep. Move the bed and you will hear about it.",
    Gemini: "Needs something to watch and someone to chatter at. Boredom is their only real fear.",
    Cancer: "Wants you close and the routine kept. A small sulk over a skipped cuddle is not unusual.",
    Leo: "Feels safest when seen. A little praise resets their whole day.",
    Virgo: "Calms when the order is right. A clean bowl in the same spot, and the world is fine.",
    Libra: "Settles in pairs, unsettles alone. They borrow their calm from yours.",
    Scorpio: "Watches from somewhere high, then decides you are safe. Once it decides, it does not change its mind.",
    Sagittarius: "Needs room and a horizon. A long walk does more than any blanket.",
    Capricorn: "Steadies on a schedule they can trust. Surprises are not a gift to them.",
    Aquarius: "Comforted by space, not smothering. They come to you, and that is the rule.",
    Pisces: "Soothed by quiet and your nearness. Loud days send them under the bed.",
  },
  venus: {
    Aries: "Loves head-on. Crashes into you, then waits, tail going, for the same back.",
    Taurus: "Shows love by leaning their whole weight on you and refusing to move.",
    Gemini: "Brings you things and talks the whole time. Attention is the love language.",
    Cancer: "Loves by guarding. Follows you room to room and frets when you leave.",
    Leo: "Loves out loud and expects it back with interest. Generous, and a little theatrical.",
    Virgo: "Shows love by staying close while you work. Missing nothing, asking for nothing.",
    Libra: "Loves to be near and in tune. Gives back the softness it wants.",
    Scorpio: "Picks one person and keeps picking them. That is you, and it is for life.",
    Sagittarius: "Loves by including you in the fun. The door is open, come on, keep up.",
    Capricorn: "Undemonstrative and completely dependable. The love is in the showing up.",
    Aquarius: "Loves on a slant. Sits one cushion away, which from them is devotion.",
    Pisces: "Loves by melting into you. No edge between their mood and yours.",
  },
  mercury: {
    Aries: "They want it now and they tell you fast. A bark, a paw, a stare, and you are already moving for them.",
    Taurus: "This one thinks slow and means it. Ask twice and you get the same calm answer, usually a look toward the food bowl.",
    Gemini: "A chatterbox brain, always two thoughts ahead. They read your tone before your words and answer with their whole body.",
    Cancer: "They speak in moods. A soft whine, a lean against your leg, and you know exactly how their day went.",
    Leo: "Everything they want comes with flair. The dramatic sigh, the head turned just so, an audience expected and usually granted.",
    Virgo: "A noticer. This one clocks the new bag, the rearranged shoes, the half-second you paused, and lets you know they saw.",
    Libra: "They negotiate. A look at you, a look at the door, a polite pause until you both agree on the plan.",
    Scorpio: "Quiet and watchful, this one says little and means all of it. When they finally ask, you do not say no.",
    Sagittarius: "Big loud opinions about everything outside. They tell you the squirrel is back, the mail came, the neighbor exists.",
    Capricorn: "A serious communicator. One firm look that means business, and they hold your eye until the message lands.",
    Aquarius: "This one invents their own signals. An odd tap, a specific yowl, a routine only the two of you understand.",
    Pisces: "They read the room before you do. A change in your voice and they are already at your feet, asking nothing, offering everything.",
  },
  mars: {
    Aries: "First out the door, last to quit. This one plays rough, forgives fast, and treats every squirrel like a personal challenge.",
    Taurus: "Slow to rile, impossible to budge once they are. They want what they want and will lean their whole weight into getting it.",
    Gemini: "Energy comes in quick bursts and changes targets mid-pounce. This one would rather outsmart you than out-muscle you.",
    Cancer: "Defends their people before themselves. Gentle until something they love is threatened, then suddenly very brave.",
    Leo: "Plays to an audience and fights for the spotlight. Bold, a little dramatic, and genuinely proud of the prize they bring you.",
    Virgo: "Goes after what they want with quiet precision, not noise. This one studies the problem, then solves it on the third try.",
    Libra: "Hates a real fight, loves a fair game. They will charm their way to the treat long before they wrestle for it.",
    Scorpio: "All or nothing, and they remember. This one locks onto a goal with a focus that is honestly a little intense.",
    Sagittarius: "Runs first, thinks later, and the whole world is the playing field. Restless, fearless, happiest in full sprint.",
    Capricorn: "Patient and relentless. This one paces themselves, never wastes a move, and quietly wins the long game.",
    Aquarius: "Picks their own fights for their own reasons. Stubborn in odd moments, unbothered in the ones you expect to spook them.",
    Pisces: "Goes soft and sideways rather than head-on. Their drive runs on feeling, so a sulk hits harder than any growl.",
  },
  jupiter: {
    Aries: "This one trusts fast and barrels into the new dog at the park like it is a personal invitation. Lucky when bold, sore when reckless.",
    Taurus: "They open up over food and a warm lap, and they open up a lot. Good fortune smells like a full bowl, twice.",
    Gemini: "This one expands by sniffing everything and trusting whoever talks to them. Curiosity pays off, until it leads them three gardens over.",
    Cancer: "They trust the ones who feel like home, then love them past all reason. Their luck lives indoors, near you.",
    Leo: "This one believes the whole room exists to admire them, and somehow it usually does. They give affection like a standing ovation.",
    Virgo: "They trust slowly, watch you first, then quietly devote themselves to one good routine. Their luck hides in small, useful habits.",
    Libra: "This one opens up to make peace and charms everyone into liking them. They overdo the sweetness, hoping nobody ever leaves.",
    Scorpio: "They trust deep or not at all, and once they pick you it is total. Fortune favors them when they finally let go.",
    Sagittarius: "This one believes every open door leads somewhere good and bolts through it grinning. Born lucky, terrible at staying in the yard.",
    Capricorn: "They trust what is earned and expand on their own slow schedule. Their good fortune comes late, then stays for good.",
    Aquarius: "This one trusts oddly, warming to the one stranger nobody expected. Their luck arrives sideways and never how you planned.",
    Pisces: "They open up to everyone and feel the whole room at once, sometimes too much. Their luck flows in on a gentle, dreamy tide.",
  },
  saturn: {
    Aries: "Saturn keeps a short leash on this one. Caution comes in late and grudgingly, usually after they have already charged at the thing.",
    Taurus: "This one holds the line by simply not moving. Routine is their fortress, and they will wait out any change you try to introduce.",
    Gemini: "Their caution is mental, not physical. They will watch a new object from three angles before deciding it is allowed to exist.",
    Cancer: "This one guards what feels like home and gets stern about it. Trust is slow, but once given it does not waver.",
    Leo: "Pride is their discipline. They hold back to keep their dignity intact, and they hate being caught making a mistake.",
    Virgo: "This one polices the small stuff. A bowl out of place, a strange smell, and they go quietly, watchfully serious about it.",
    Libra: "Their boundaries are about fairness. They hold back until they have weighed both sides, then commit with surprising steadiness.",
    Scorpio: "This one trusts almost nothing at first. The walls are thick and deliberate, and earning a way past them takes real time.",
    Sagittarius: "Discipline sits uneasy on this one. They accept limits only when they understand the reason, and they test every fence twice.",
    Capricorn: "Saturn is right at home here. This one is self-governed, patient, and oddly responsible, the old soul who waits its turn.",
    Aquarius: "Their boundaries are on their own terms. They keep a cool distance, then choose exactly when and whom to let close.",
    Pisces: "Caution dissolves and reforms in this one. They retreat softly when overwhelmed, needing quiet to rebuild their edges.",
  },
  uranus: {
    Aries: "This one bolts off mid-walk for no reason they will share, then acts like it was your idea all along.",
    Taurus: "Stubbornly the same for years, then one day they decide the sofa is theirs now and that is simply the new law.",
    Gemini: "Their attention snaps to a new game every few minutes. You never quite predict which sound sets them off next.",
    Cancer: "Cuddly and steady until a tiny change in the room, a moved chair, a new smell, flips them into a different mood entirely.",
    Leo: "Right when all eyes are on them, they ditch the trick they know and freestyle something stranger and louder.",
    Virgo: "They keep a tidy routine, then rearrange one small ritual overnight and expect you to have noticed already.",
    Libra: "Easygoing about most things, then out of nowhere they refuse a friend they have always liked, and will not be talked round.",
    Scorpio: "Their surprises run deep and quiet. One day they show a hiding spot or a trust you had no idea was being weighed.",
    Sagittarius: "Fences are suggestions. This one finds the one gap you missed and treats the whole neighbourhood as fair territory.",
    Capricorn: "Predictable to a fault, then they break a rule they built themselves, calmly, like they have simply outgrown it.",
    Aquarius: "The genuine odd one. They invent private rituals, ignore the usual pet script, and seem to run on their own logic.",
    Pisces: "Their moods arrive like weather, no warning, no clear cause. One minute dreamy, the next darting somewhere only they understand.",
  },
  neptune: {
    Aries: "Dreams in fast-forward, then forgets them. This one zones out mid-zoomie, snaps back like they meant to do that.",
    Taurus: "Naps with the dedication of a professional. This one drifts off in any patch of sun and takes their sweet time waking.",
    Gemini: "A short attention span for the real world, endless for whatever they imagine. This one chases shadows that are not there.",
    Cancer: "Feels your mood before you say a word, then goes quiet and clingy to match it. A little sponge for the room.",
    Leo: "Stares into the middle distance like they are in a film about themselves. This one daydreams in the spotlight, even an empty one.",
    Virgo: "Worries and wanders at once. This one fusses over a corner of the rug, then forgets why and stares at the wall.",
    Libra: "Soft on everyone, hard to read. This one floats between laps, half here, dissolving into whoever is gentlest.",
    Scorpio: "Senses things you cannot and will not explain. This one fixes on a closed door, ears back, lost in something only they hear.",
    Sagittarius: "Wanders off mid-thought, nose in the clouds. This one forgets where they buried the toy and looks delighted anyway.",
    Capricorn: "Quietly tender under the serious face. This one keeps a routine, then melts into a long, faraway stare at nothing.",
    Aquarius: "Off in their own orbit. This one ignores the obvious, then fixates on a speck of dust like it holds answers.",
    Pisces: "Made of feelings and fog. This one slips into sleep mid-cuddle, dreams loudly, and wakes unsure which world they are in.",
  },
  pluto: {
    Aries: "Their intensity comes out fast and physical. Push them and they push back, then forget the whole thing by dinner.",
    Taurus: "They hold on hard and quietly. A favorite spot, a routine, one person. Try to move any of it and you meet the wall.",
    Gemini: "Their deep stuff hides behind chatter and games. Watch closely and you catch a sharper, watchful mind under the goofing.",
    Cancer: "They feel everything and bury most of it. A closed door or a packed bag can shake this one for days.",
    Leo: "Their need for control runs through pride. They want to be seen, and being ignored cuts deeper than they let on.",
    Virgo: "Their tension lives in the details. One thing out of place and this one fixates, grooming or pacing until it feels right.",
    Libra: "They keep the peace by hiding what bothers them. The unrest leaks out sideways, in sulks and pointed silences.",
    Scorpio: "All in, all the time. This one bonds to the bone, reads your moods, and never quite forgets a betrayal.",
    Sagittarius: "Their intensity needs somewhere to run. Pen them in and the pressure turns to chewing, digging, or a sudden bolt for the door.",
    Capricorn: "They carry their guard like a job. Slow to trust, steady once they do, and quietly stubborn about who runs the house.",
    Aquarius: "Their depths stay private and a little odd. They watch the room from the edge and decide, on their own terms, when to come close.",
    Pisces: "They soak up the mood of the whole house and rarely show where it lands. The quiet ones often feel the most.",
  },
  chiron: {
    Aries: "This one bruises when overlooked or told to wait their turn. They mend by being the first one greeted, the one you reach for.",
    Taurus: "A quiet fear of going without sits in this one, leftover from leaner days. A full bowl and a warm spot, kept steady, settles it.",
    Gemini: "This one was hushed once, maybe ignored when they tried to say something. They heal when you answer their little sounds like real talk.",
    Cancer: "The old ache here is being left. They flinch at closed doors and packed bags, and soften when you come back and mean it.",
    Leo: "Somewhere this one learned they were too much. They steady when the attention they crave is given freely, not earned by performing.",
    Virgo: "This one frets over getting it wrong, bracing for a scold that may never come. Gentle routine and praise for small things loosen the worry.",
    Libra: "A tension between people unsettles this one deeply. Raised voices land as their fault, and they mend in a calm, even-keeled home.",
    Scorpio: "This one guards an old betrayal and trusts slowly. They heal in increments, each kept promise loosening the grip a little more.",
    Sagittarius: "A clipped life or a small cage once shrank this one's world. They knit back together with open space and the freedom to wander it.",
    Capricorn: "This one carries themself like they must earn their keep, never quite resting. Being loved for nothing in particular is the slow cure.",
    Aquarius: "A sense of not fitting follows this one, the odd one in any group. They settle once they find their one person and stop reaching for the rest.",
    Pisces: "This one soaks up the mood of the house and aches when it sours. Quiet, a soft blanket, and your steady calm draw the heaviness back out.",
  },
  northNode: {
    Aries: "Life with you is teaching this one to act first and ask later, to want something and just go get it.",
    Taurus: "This one is settling into steadiness, learning that the same warm spot and the same routine are their own reward.",
    Gemini: "Your pet is growing curious, learning to take an interest in everything, every sound, every new face at the door.",
    Cancer: "This one is softening into a home creature, learning to need you back and to let themselves be looked after.",
    Leo: "Life with you is coaxing out the show-off, the one who learns it is fine to want the spotlight and take it.",
    Virgo: "Your pet is growing into small daily habits, finding calm in being useful, tidy, and quietly on top of things.",
    Libra: "This one is learning the give and take of company, how to read your mood and meet you halfway.",
    Scorpio: "This one is growing toward deep, all-in attachment, the kind that bonds to one person and means it.",
    Sagittarius: "Life with you is opening this one up, teaching them to trust the next walk, the next car, the next adventure.",
    Capricorn: "Your pet is steadily learning patience and self-control, growing into the calm, dependable one of the house.",
    Aquarius: "This one is becoming their own odd self, learning it is fine to like things on their own terms.",
    Pisces: "This one is growing gentler and more tuned in, learning to feel what you feel and curl close when you need it.",
  },
  lilith: {
    Aries: "The thing in them that bolts the second a leash goes slack. Their wildness has no patience and no off switch.",
    Taurus: "Will not be moved when they have decided otherwise. The untamed part of them is just a body planted like a boulder.",
    Gemini: "Their feral streak talks back. It darts, dodges, and pretends not to hear you, always one trick ahead.",
    Cancer: "Guards something private that nobody gets to touch. Push too close and the soft one shows teeth.",
    Leo: "Refuses to be a pet on anyone's terms. Their wild side wants the room, the spotlight, and the last word.",
    Virgo: "Their untamed part hides in the details, the secret stash, the spot they will not let you clean. Quietly ungovernable.",
    Libra: "Charming until you cross a line they never named. Then the sweet one simply stops cooperating, all grace, zero compliance.",
    Scorpio: "Keeps a wildness it never shows you. What this one wants, it stalks in total silence until the moment comes.",
    Sagittarius: "The part that treats a fence as a suggestion. Their freedom is non-negotiable and the door is always a dare.",
    Capricorn: "Submits to nothing, just waits you out. The untamed thing in them is patient, cold, and absolutely in charge.",
    Aquarius: "Cannot be trained into anyone's idea of normal. Their wildness is the rule they broke on purpose.",
    Pisces: "Slips your grip like water and goes somewhere you cannot follow. The wild one here is half here, half elsewhere.",
  },
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
// Restrained 3-tone palette: luminaries gold, planets violet, points cream.
const WHEEL_TONE: Record<string, string> = {
  sun: "#f0d99f", moon: "#f0d99f",
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
}: {
  chart: PetBirthChart;
  name: string;
  bornLabel: string;
  reduce: boolean;
  onInfo: () => void;
  infoBtnRef?: RefObject<HTMLButtonElement>;
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
  const dom = chart.dominantElement;
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
          <circle cx={cx} cy={cy} r={rZodOuter} fill="none" stroke="rgba(212,182,122,0.5)" strokeWidth={1} />
          <circle cx={cx} cy={cy} r={rZodInner} fill="none" stroke="rgba(212,182,122,0.32)" strokeWidth={1} />
          {WHEEL_ZODIAC.map((z, i) => {
            const a0 = z.start;
            const a1 = z.start + 30;
            const mid = z.start + 15;
            const gp = wheelPolar(cx, cy, (rZodOuter + rZodInner) / 2, mid);
            const d0 = wheelPolar(cx, cy, rZodInner, a0);
            const d1 = wheelPolar(cx, cy, rZodOuter, a0);
            const isSunSign = i === sunSignIdx;
            const fill = isSunSign
              ? "rgba(212,182,122,0.14)"
              : i % 2 === 0
              ? "rgba(212,182,122,0.05)"
              : "rgba(124,92,214,0.06)";
            return (
              <g key={z.name}>
                <path
                  d={`${wheelArc(cx, cy, rZodOuter, a0, a1)} L ${wheelPolar(cx, cy, rZodInner, a1).x.toFixed(2)} ${wheelPolar(cx, cy, rZodInner, a1).y.toFixed(2)} ${wheelArc(cx, cy, rZodInner, a1, a0).replace("M", "L").split("A")[0]} A ${rZodInner} ${rZodInner} 0 0 0 ${d0.x.toFixed(2)} ${d0.y.toFixed(2)} Z`}
                  fill={fill}
                />
                <line x1={d0.x} y1={d0.y} x2={d1.x} y2={d1.y} stroke="rgba(212,182,122,0.28)" strokeWidth={0.75} />
                <text x={gp.x} y={gp.y} textAnchor="middle" dominantBaseline="central" fill={isSunSign ? "#f0d99f" : "#d4b67a"} fontSize={16} className="ls-wheel-signglyph">
                  {z.glyph}
                </text>
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
              <line key={deg} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(245,239,230,0.26)" strokeWidth={major ? 1.1 : 0.5} />
            );
          })}
        </motion.g>

        {/* Aspect web */}
        <g>
          {aspects.map((asp, i) => {
            const pa = wheelPolar(cx, cy, rAspect, asp.lonA);
            const pb = wheelPolar(cx, cy, rAspect, asp.lonB);
            const stroke = asp.kind === "hard" ? "rgba(154,126,230,0.5)" : "rgba(212,182,122,0.42)";
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
          <circle cx={cx} cy={cy} r={rAspect} fill="none" stroke="rgba(245,239,230,0.12)" strokeWidth={0.6} />
        </g>

        {/* Planets */}
        {placed.map((p, i) => {
          const tone = WHEEL_TONE[p.key] ?? "#e9e4f2";
          const meta = PLANET_META[p.key];
          const gp = wheelPolar(cx, cy, rGlyph, glyphLon[p.key]);
          const tickEnd = wheelPolar(cx, cy, rZodInner - 3, p.lon);
          return (
            <motion.g
              key={p.key}
              initial={reduce ? false : { opacity: 0, scale: 0 }}
              animate={reduce ? {} : { opacity: 1, scale: 1 }}
              transition={{ duration: beat(0.42), delay: beat(0.55 + i * 0.09), ease: [0.34, 1.3, 0.6, 1] }}
              style={{ transformOrigin: `${gp.x}px ${gp.y}px` }}
            >
              <line x1={gp.x} y1={gp.y} x2={tickEnd.x} y2={tickEnd.y} stroke={tone} strokeOpacity={0.4} strokeWidth={0.8} strokeDasharray="2 2" />
              <circle cx={gp.x} cy={gp.y} r={13} fill="#0a0712" stroke={tone} strokeWidth={1.4} filter="url(#lsWheelGlow)" />
              <text x={gp.x} y={gp.y} textAnchor="middle" dominantBaseline="central" fill={tone} fontSize={13} className="ls-wheel-planetglyph">
                {meta?.glyph}
              </text>
            </motion.g>
          );
        })}

        {/* Center medallion */}
        <motion.g
          initial={reduce ? false : { opacity: 0 }}
          animate={reduce ? {} : { opacity: 1 }}
          transition={{ duration: beat(0.5), delay: beat(1.0) }}
        >
          <circle cx={cx} cy={cy} r={rHub} fill="rgba(8,6,14,0.82)" stroke="rgba(212,182,122,0.3)" strokeWidth={1} />
          <text x={cx} y={cy - 16} textAnchor="middle" fill="#f0d99f" fontSize={15} className="ls-wheel-centername">
            {name || dom || "Their sky"}
          </text>
          <line x1={cx - 19} y1={cy - 4} x2={cx + 19} y2={cy - 4} stroke="#d4b67a" strokeWidth={1.4} />
          {bornLabel && (
            <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(245,239,230,0.66)" fontSize={9.5} className="ls-wheel-centerborn">
              BORN {bornLabel}
            </text>
          )}
          {dom && (
            <text x={cx} y={cy + 25} textAnchor="middle" fill="#d4b67a" fontSize={9.5} className="ls-wheel-centerdom">
              {dom} element
            </text>
          )}
        </motion.g>
      </svg>

      <button ref={infoBtnRef} type="button" className="ls-wheel-info" onClick={onInfo} aria-label="What each planet means">
        <span className="ls-wheel-info-mark" aria-hidden="true">i</span>
        What each planet means
      </button>
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
    name ? `The chart for ${name}.` : "The chart, honest from the date alone.",
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
      <span className={`ls-compute-mote ${step >= 1 ? "is-lit" : ""}`} aria-hidden="true" />
      <div className="ls-compute-readout">{readout}</div>
      <AnimatePresence mode="wait">
        <motion.p
          key={step}
          className="ls-compute-line"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25, ease: [0.22, 0.7, 0.2, 1] }}
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
    ? `${SIGN_GLYPHS[activeBody.sign] ?? ""} ${activeBody.sign}${typeof activeBody.degree === "number" ? ` ${Math.round(activeBody.degree)}°` : ""}`.trim()
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
          <span className="ls-info-title">What each planet means</span>
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
                  <span className="ls-orrery-bubble-glyph">{meta.glyph}</span>
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
          No rising sign here. That one honestly needs the exact minute and place of birth. Everything on the
          wheel comes from the date alone, and all of it is real.
        </p>
      </div>
    </motion.div>
  );
}

function BirthSkyJourney() {
  const reduce = useReducedMotion() ?? false;
  const infoBtnRef = useRef<HTMLButtonElement>(null);

  const [petName, setPetName] = useState("");
  const [date, setDate] = useState("");
  const [email, setEmail] = useState("");
  const [chart, setChart] = useState<PetBirthChart | null>(null);
  const [status, setStatus] = useState<"idle" | "computing" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");
  const [whyOpen, setWhyOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const name = petName.trim();
  const ready = status === "ready";
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
    setUnlocked(false);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    try {
      const url = `${BIRTH_CHART_ENDPOINT}?date=${encodeURIComponent(date)}`;
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`status ${response.status}`);
      const data = (await response.json()) as PetBirthChart;
      if (!data?.sun) throw new Error("incomplete");
      setChart(data);
    } catch (error) {
      console.warn("[Little Souls] birth chart failed", error);
      setChart(null);
      setStatus("error");
      setMessage("The sky did not answer. Try the date again.");
    } finally {
      clearTimeout(timeout);
    }
  };

  // Gate 2 — after the first three placements, email to keep reading the rest.
  // It captures the lead and shows the rest on screen now. No inbox promise: the
  // free reading is the chart on this page.
  const handleSaveEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!/.+@.+\..+/.test(cleanEmail)) {
      setEmailMsg("Add your email to read the rest.");
      return;
    }
    setEmailBusy(true);
    setEmailMsg("");
    try {
      await supabase.functions.invoke("track-subscriber", {
        body: {
          email: cleanEmail,
          event: "birth_chart_lead",
          petName: petName.trim() || null,
          source: "cosmic_reveal",
        },
      });
    } catch (error) {
      console.warn("[Little Souls] lead capture failed", error);
    }
    try {
      sessionStorage.setItem("ls_chart_email", cleanEmail);
    } catch {
      /* ignore */
    }
    setUnlocked(true);
    setEmailBusy(false);
  };

  const scrollToCheckout = () =>
    document.getElementById("begin")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <section id="computed-sky" className="ls-orrery-section ls-parallax-band">
      <div className="ls-orrery-head ls-reveal">
        {ready ? (
          <h3 className="text-balance" style={chartTitleStyle}>Drawn from the day they arrived.</h3>
        ) : (
          <h3 className="text-balance" style={chartTitleStyle}>
            The sky the day they were <span style={{ color: C.gold }}>born</span> is still up there.
          </h3>
        )}
      </div>

      <div className="ls-stage">
        {status === "computing" ? (
          <ComputeSequence
            chart={chart}
            name={name}
            date={date}
            reduce={reduce}
            onDone={() => setStatus("ready")}
          />
        ) : ready && chart ? (
          <NatalWheel
            chart={chart}
            name={name}
            bornLabel={bornLabelFor(date)}
            reduce={reduce}
            onInfo={() => setInfoOpen(true)}
            infoBtnRef={infoBtnRef}
          />
        ) : (
          <form className="ls-seal-card ls-stage-card ls-reveal" onSubmit={handleOpen}>
            <p className="ls-seal-sub">Name optional. The date does the rest.</p>
            <div className="ls-seal-field">
              <label htmlFor="seal-name">Their name <span>(if they have one)</span></label>
              <input id="seal-name" type="text" value={petName} maxLength={40} onChange={(e) => setPetName(e.target.value)} placeholder="e.g. Bella" />
            </div>
            <div className="ls-seal-field">
              <label htmlFor="seal-date">Birth date, or the day they came home</label>
              <input
                id="seal-date"
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
              <p className="ls-seal-help">
                Rising sign and houses need the exact minute and town. Planet positions only need the date, so
                everything on this chart is honest from that alone.
              </p>
            )}
          </form>
        )}
      </div>

      {ready && chart && (
        <AnimatePresence initial={false}>
          {infoOpen && (
            <OrreryInfoOverlay
              chart={chart}
              name={name}
              reduce={reduce}
              onClose={() => {
                setInfoOpen(false);
                infoBtnRef.current?.focus();
              }}
            />
          )}
        </AnimatePresence>
      )}

      {ready && (
        <div className="ls-reveal-stack">
          <p className="ls-wheel-honesty">
            Every planet sits at its true position for that date. No rising sign here, that one needs the exact
            minute and place. Everything on this chart is honest from the date alone.
          </p>

          <div className="ls-chart-table">
            {FREE_KEYS.map((key) => {
              const b = bodyFor(key);
              const m = PLANET_META[key];
              const deg = typeof b?.degree === "number" ? `${Math.round(b.degree)}°` : "";
              const text = (b?.sign && SIGN_LINES[key]?.[b.sign]) || JOURNEY_LINES[key] || m.line;
              return (
                <article key={key} className="ls-trow is-open">
                  <span className="ls-trow-glyph" aria-hidden="true">{m.glyph}</span>
                  <div className="ls-trow-main">
                    <span className="ls-trow-top">
                      <strong className="ls-trow-name">{m.label}</strong>
                      {b?.sign && <span className="ls-trow-sign">{b.sign} {deg}</span>}
                    </span>
                    <span className="ls-trow-frame">{PLANET_FRAME[key]}</span>
                    <p className="ls-trow-line">{text}</p>
                  </div>
                </article>
              );
            })}
          </div>

          {!unlocked && (
            <form className="ls-gate2" onSubmit={handleSaveEmail}>
              <h4 className="ls-gate2-title">Three placements free. The rest of the chart is one step away.</h4>
              <p className="ls-gate2-sub">
                Add your email and the other ten placements open right here, in full.
              </p>
              <div className="ls-gate2-row">
                <input type="email" value={email} autoComplete="email" placeholder="you@example.com" onChange={(e) => { setEmail(e.target.value); if (emailMsg) setEmailMsg(""); }} />
                <button type="submit" className="ls-gold-button ls-violet-button" disabled={emailBusy}>
                  {emailBusy ? "Opening…" : "Read the rest"}
                  {!emailBusy && <ArrowRight size={16} />}
                </button>
              </div>
              {emailMsg && <p className="ls-chart-message is-error">{emailMsg}</p>}
              <p className="ls-gate2-trust">No noise. Just their chart, and the odd note when there is more.</p>
            </form>
          )}

          <div className="ls-chart-table">
            {REST_KEYS.map((key) => {
              const b = bodyFor(key);
              const m = PLANET_META[key];
              const deg = typeof b?.degree === "number" ? `${Math.round(b.degree)}°` : "";
              const text = (b?.sign && SIGN_LINES[key]?.[b.sign]) || JOURNEY_LINES[key] || m.line;
              return (
                <article key={key} className={`ls-trow ${unlocked ? "is-open" : "is-locked"}`}>
                  <span className="ls-trow-glyph" aria-hidden="true">{m.glyph}</span>
                  <div className="ls-trow-main">
                    <span className="ls-trow-top">
                      <strong className="ls-trow-name">{m.label}</strong>
                      {b?.sign && <span className="ls-trow-sign">{b.sign} {deg}</span>}
                    </span>
                    <span className="ls-trow-frame">{PLANET_FRAME[key]}</span>
                    <p className="ls-trow-line">{text}</p>
                  </div>
                  {!unlocked && <span className="ls-trow-lock">Email to read</span>}
                </article>
              );
            })}
          </div>

          <div className="ls-locked-block">
            <p className="ls-locked-eyebrow">What the full reading opens</p>
            <div className="ls-teaser-grid">
              {PREMIUM_TEASERS.map((t, i) => (
                <article key={t.title} className="ls-teaser-card" style={revealDelay(i * 0.04)}>
                  <strong className="ls-teaser-title">{t.title}</strong>
                  <small className="ls-teaser-line">{t.line}</small>
                </article>
              ))}
            </div>
          </div>

          <div className="ls-upsell">
            <h4 className="ls-upsell-title">You&apos;ve seen their sky. Now understand what it means between you.</h4>
            <p className="ls-upsell-pitch">
              The free chart opens every placement they were born under. The full reading turns the whole celestial
              pattern into a portrait of their nature, their needs, and the bond only the two of you share. It
              doesn&apos;t just describe them. It changes how you meet them.
            </p>
            <button type="button" className="ls-gold-button ls-violet-button ls-upsell-cta" onClick={scrollToCheckout}>
              Read {name || "their"} full reading <ArrowRight size={17} />
            </button>
          </div>
        </div>
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
          <span className="ls-orrery-pt">{meta?.glyph}</span>
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
  return (
    <section id="begin" className="ls-parallax-band relative px-5 py-18 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="ls-checkout-shell mx-auto max-w-6xl p-3 sm:p-5">
          <div className="ls-checkout-vars">
            <InlineCheckout
              ref={checkoutRef}
              ctaLabel="Begin Their Reading"
              charityId="ifaw"
              charityBonus={0}
              onSelectedPriceChange={onSelectedPriceChange}
              memorialDefaultExpanded={false}
              memorialOnly={false}
              path="discover"
              visualMode="cosmic"
            />
          </div>
        </div>
        <span className="sr-only">Selected price {selectedPrice}</span>
      </div>
    </section>
  );
}

// Image-led gallery. Each shot drifts within its frame on scroll (native
// scroll-driven parallax via animation-timeline: view(), GPU, mobile + desktop,
// with a static fallback and a reduced-motion guard). Words stay minimal — the
// cat opens the series; the rest let the images talk. Captions added per-shot.
const GALLERY_SHOTS = [
  {
    src: "/readings/hero/black-cat-galaxy-eye.webp",
    alt: "Black cat with a faint galaxy reflected in one eye",
    caption: "Discover the soul behind those eyes.",
    width: 1672,
    height: 941,
  },
  {
    src: "/readings/hero/cockapoo-reading-tablet.webp",
    alt: "Cockapoo beside a human holding a glowing celestial reading",
    caption: "Made for reading with them close.",
    width: 1672,
    height: 942,
  },
  {
    src: "/readings/hero/birth-chart-tablet-pet-nearby.png",
    alt: "Tabby cat resting beside a tablet glowing with a gold celestial chart",
    width: 1586,
    height: 992,
  },
  {
    src: "/readings/hero/quiet-keepsake-reading-moment.png",
    alt: "Dog resting beside a person holding a tablet filled with a quiet star map",
    width: 1896,
    height: 830,
  },
  {
    src: "/readings/hero/doberman-puppy-star-map.webp",
    alt: "Doberman puppy touching a softly glowing star map",
    width: 1672,
    height: 942,
  },
] as const;

const GALLERY_SHOT_LAYOUTS = ["lead", "portrait", "square", "wide", "tall"] as const;

function QuietMomentSection() {
  return (
    <section className="ls-story-section ls-parallax-band relative isolate overflow-hidden px-5 py-18 sm:py-28">
      <div className="ls-gallery mx-auto max-w-6xl">
        {GALLERY_SHOTS.map((shot, i) => (
          <figure
            key={shot.src}
            className={`ls-gallery-item ls-gallery-item--${GALLERY_SHOT_LAYOUTS[i] ?? "wide"} ls-reveal`}
            style={revealDelay(i * 0.05)}
          >
            <img src={shot.src} alt={shot.alt} loading="lazy" width={shot.width} height={shot.height} />
            {"caption" in shot && shot.caption && (
              <figcaption className="ls-gallery-caption" style={galleryCaptionStyle}>
                {shot.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section id="faq" className="ls-parallax-band relative px-5 py-18 sm:py-28">
      <div className="mx-auto max-w-4xl">
        <SectionIntro
          eyebrow="Questions"
          title="Before you begin."
          body="A few honest answers first."
          centered
        />
        <div className="mt-12 divide-y" style={{ borderColor: C.line }}>
          {FAQ.map((item, i) => (
            <article key={item.q} className="py-8 ls-reveal" style={revealDelay(i * 0.06)}>
              <h3 style={faqTitleStyle}>{item.q}</h3>
              <p className="mt-4 text-pretty" style={bodyStyle}>{item.a}</p>
            </article>
          ))}
        </div>
      </div>
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

function CosmicBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-10%,rgba(65,47,88,0.55),transparent_42%),radial-gradient(ellipse_at_88%_18%,rgba(212,182,122,0.12),transparent_26%),radial-gradient(ellipse_at_10%_70%,rgba(94,70,122,0.16),transparent_32%)]" />
      <svg className="absolute inset-0 h-full w-full opacity-50" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice">
        <g stroke="rgba(212,182,122,0.15)" strokeWidth="1" fill="none">
          <path d="M110 220 188 174 275 238 360 188" />
          <path d="M810 126 902 196 1010 156 1078 245" />
          <path d="M704 662 780 602 856 678 942 624" />
          <path d="M130 720 236 650 304 742" />
        </g>
        {[
          [110, 220, 2], [188, 174, 2.8], [275, 238, 2.2], [360, 188, 2],
          [810, 126, 2.4], [902, 196, 3], [1010, 156, 2], [1078, 245, 2.2],
          [704, 662, 2], [780, 602, 2.6], [856, 678, 2.1], [942, 624, 2.5],
          [510, 118, 1.4], [592, 322, 1.6], [110, 620, 1.5], [1090, 712, 1.4],
          [130, 720, 1.8], [236, 650, 2.2], [304, 742, 1.8],
        ].map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="rgba(245,239,230,0.72)" />
        ))}
      </svg>
    </div>
  );
}

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
          radial-gradient(circle at 22% 18%, rgba(212,182,122,0.14), transparent 28%),
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
        padding: clamp(44px, 7vw, 104px) 20px clamp(48px, 8vw, 112px);
        text-align: center;
      }
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
        box-shadow: inset 0 1px 0 rgba(245,239,230,0.05), 0 44px 130px rgba(0,0,0,0.55);
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
         transparent PNG. NO clip — the whole sun + flares show; sized larger than
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
        box-shadow: 0 28px 84px rgba(0,0,0,0.5), inset 0 1px 0 rgba(245,239,230,0.05);
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
      .ls-orrery-bubble-glyph { color: #b8a0ef; font-size: clamp(1rem, 2vw, 1.5rem); line-height: 1; }
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
        font-family: Lato, system-ui, sans-serif;
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
        color: #d8c5f5; font-family: Lato, system-ui, sans-serif;
        font-size: 0.78rem; font-weight: 800; letter-spacing: 0.22em; text-transform: uppercase;
      }
      .ls-orrery-line {
        margin: 0; color: ${C.cream}; font-family: "Playfair Display", Georgia, serif;
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
      .ls-journey-stage {
        position: sticky;
        top: 0;
        height: 100svh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        gap: clamp(10px, 2vh, 20px);
        padding: clamp(18px, 5vh, 46px) 20px clamp(22px, 5vh, 48px);
        text-align: center;
        z-index: 2;
      }
      .ls-journey-eyebrow { margin: 0; }
      .ls-journey-track { position: relative; z-index: 1; pointer-events: none; }
      .ls-journey-step { height: 24svh; }
      .ls-journey-step--final { height: 64svh; }
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
        font-family: "Playfair Display", Georgia, serif;
        font-size: clamp(5rem, 22vw, 11rem);
        line-height: 1;
        color: ${C.gold};
        filter: drop-shadow(0 0 28px rgba(212,182,122,0.5));
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
        color: ${C.gold};
        font-family: Lato, system-ui, sans-serif;
        font-size: 0.8rem;
        font-weight: 800;
        letter-spacing: 0.22em;
        text-transform: uppercase;
      }
      .ls-journey-line {
        margin: 0;
        color: ${C.cream};
        font-family: "Playfair Display", Georgia, serif;
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
        background: rgba(245,239,230,0.2);
        cursor: pointer;
        transition: background 0.3s ease, width 0.3s ease;
      }
      .ls-journey-tick.is-past { background: rgba(124,92,214,0.55); }
      .ls-journey-tick.is-active { background: ${C.violet}; width: 30px; }
      .ls-journey-count {
        color: ${C.muted};
        font-family: Lato, system-ui, sans-serif;
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
        box-shadow: 0 30px 90px rgba(0,0,0,0.45), inset 0 1px 0 rgba(245,239,230,0.05);
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
        filter: drop-shadow(0 0 16px rgba(212,182,122,0.5));
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
        background: rgba(245,239,230,0.12);
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
      .ls-sys-node--mark { position: absolute; inset: 0; display: grid; place-items: center; color: ${C.gold}; font-size: clamp(0.9rem, 3.5vw, 1.8rem); text-shadow: 0 0 8px rgba(0,0,0,0.85); }
      .ls-sys-orb2 img.is-shadowed { filter: brightness(0.32) saturate(0.5) contrast(1.05); }
      .ls-sys-node { color: ${C.gold}; font-size: clamp(0.7rem, 2.6vw, 1.5rem); line-height: 1; }
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
      .ls-dock-orb .ls-sys-glyph { font-size: clamp(2rem, 7vw, 3.2rem); color: ${C.gold}; }
      .ls-dock-text { display: grid; gap: 6px; justify-items: center; min-width: 0; }
      .ls-dock-glyph { color: ${C.gold}; font-size: clamp(1.8rem, 6vw, 2.8rem); line-height: 1; }
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
        font-family: Lato, system-ui, sans-serif;
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
        color: ${C.gold};
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
      .ls-readout-glyph { color: ${C.gold}; font-style: normal; margin-right: 7px; }
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
        border: 1px solid rgba(245,239,230,0.08);
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
      .ls-journey-glyph { color: rgba(212,182,122,0.85); font-size: 1rem; }
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
      .ls-journey-focus-glyph { color: ${C.gold}; font-size: clamp(2rem, 6vw, 2.8rem); line-height: 1; }
      .ls-journey-focus-label {
        color: ${C.gold};
        font-family: Lato, system-ui, sans-serif;
        font-size: 0.76rem;
        font-weight: 800;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }
      .ls-journey-focus-line {
        color: ${C.cream};
        font-family: "Playfair Display", Georgia, serif;
        font-size: clamp(1.55rem, 5vw, 2.7rem);
        line-height: 1.08;
        margin: 0;
      }
      .ls-journey-step-count { color: ${C.muted}; font-family: Lato, system-ui, sans-serif; font-size: 0.72rem; letter-spacing: 0.16em; }
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
        background: rgba(245,239,230,0.22);
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
      .ls-journey-reveal-item span { color: ${C.gold}; font-family: Lato, system-ui, sans-serif; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; }
      .ls-journey-reveal-item strong { color: ${C.cream}; font-family: "Playfair Display", Georgia, serif; font-size: 1.3rem; font-weight: 500; }
      .ls-journey-reveal-item small { color: ${C.creamDim}; font-family: Lato, system-ui, sans-serif; font-size: 0.82rem; }
      .ls-journey-hint { color: ${C.creamDim}; font-family: "Cormorant", Georgia, serif; font-style: italic; font-size: 1.22rem; line-height: 1.4; margin: 0; }
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
          radial-gradient(circle at 22% 28%, rgba(212,182,122,0.055), transparent 18%),
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
        background: linear-gradient(180deg, rgba(245,239,230,0.055), rgba(245,239,230,0.025));
        border: 1px solid ${C.line};
        border-radius: 8px;
        box-shadow: inset 0 1px 0 rgba(245,239,230,0.05);
      }
      .ls-process-card {
        min-height: 360px;
        padding: 32px;
      }
      .ls-process-number {
        color: ${C.gold};
        font-family: "Playfair Display", Georgia, serif;
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
          radial-gradient(ellipse at 18% 0%, rgba(212,182,122,0.14), transparent 34%),
          linear-gradient(180deg, rgba(245,239,230,0.06), rgba(245,239,230,0.025));
      }
      .ls-calc-toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        width: 100%;
        text-align: left;
        border: 1px solid rgba(212,182,122,0.26);
        border-radius: 10px;
        background: rgba(5,4,7,0.4);
        padding: 16px 18px;
        cursor: pointer;
        transition: border-color 0.2s ease;
      }
      .ls-calc-toggle:hover { border-color: rgba(212,182,122,0.5); }
      .ls-calc-toggle.is-open {
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
        border-bottom-color: transparent;
      }
      .ls-calc-head { display: grid; gap: 4px; }
      .ls-calc-title {
        color: ${C.cream};
        font-family: "Playfair Display", Georgia, serif;
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
        border: 1px solid rgba(212,182,122,0.26);
        border-top: none;
        border-radius: 0 0 10px 10px;
        padding: clamp(18px, 3vw, 28px);
        background:
          radial-gradient(ellipse at 0% 0%, rgba(212,182,122,0.10), transparent 46%),
          linear-gradient(180deg, rgba(5,4,7,0.32), rgba(5,4,7,0.12));
      }
      .ls-calc-lead {
        color: ${C.cream};
        font-family: "Playfair Display", Georgia, serif;
        font-size: clamp(1.05rem, 2.2vw, 1.3rem);
        line-height: 1.45;
        max-width: 640px;
      }
      .ls-calc-grid {
        margin-top: 22px;
        display: grid;
        gap: 1px;
        background: rgba(212,182,122,0.16);
        border: 1px solid rgba(212,182,122,0.16);
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
        font-family: "Playfair Display", Georgia, serif;
        font-size: clamp(2.2rem, 5vw, 3.1rem);
        line-height: 0.95;
        letter-spacing: -0.01em;
      }
      .ls-calc-stat-label {
        color: ${C.cream};
        font-family: Lato, system-ui, sans-serif;
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }
      .ls-calc-stat-body {
        margin-top: 4px;
        color: ${C.muted};
        font-family: Lato, system-ui, sans-serif;
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
          linear-gradient(180deg, rgba(245,239,230,0.07), rgba(245,239,230,0.025));
        box-shadow: inset 0 1px 0 rgba(245,239,230,0.06), 0 28px 90px rgba(0,0,0,0.28);
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
        border: 1px solid rgba(212,182,122,0.10);
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
        filter: drop-shadow(0 0 6px rgba(212,182,122,0.4));
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
        border: 1px solid rgba(245,239,230,0.10);
        border-radius: 8px;
        background: rgba(5,4,7,0.46);
        padding: 16px;
      }
      .ls-chart-pill span {
        color: ${C.cream};
        font-family: "Playfair Display", Georgia, serif;
        font-size: 1.16rem;
        line-height: 1.1;
      }
      .ls-chart-pill small {
        color: ${C.muted};
        font-family: Lato, system-ui, sans-serif;
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
        font-family: Lato, system-ui, sans-serif;
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
        border: 1px solid rgba(212,182,122,0.34);
        border-radius: 8px;
        background: rgba(5,4,7,0.62);
        color: ${C.cream};
        padding: 0 14px;
        font-family: Lato, system-ui, sans-serif;
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
        font-family: Lato, system-ui, sans-serif;
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
        border: 1px solid rgba(245,239,230,0.10);
        border-radius: 10px;
        background: rgba(5,4,7,0.46);
        padding: 14px;
      }
      .ls-planet-orb {
        width: 54px;
        height: 54px;
        flex: none;
        object-fit: contain;
        filter: drop-shadow(0 0 10px rgba(212,182,122,0.26));
      }
      .ls-element-orb,
      .ls-glyph-orb {
        display: grid;
        place-items: center;
        color: ${C.gold};
        font-size: 1.7rem;
        border: 1px solid rgba(212,182,122,0.42);
        border-radius: 50%;
        filter: none;
      }
      .ls-glyph-orb {
        font-size: 1.5rem;
        background: rgba(212,182,122,0.06);
      }
      .ls-calc-figure {
        margin: 0 0 18px;
        border: 1px solid rgba(212,182,122,0.2);
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
        font-family: Lato, system-ui, sans-serif;
        font-size: 0.72rem;
        line-height: 1.4;
        letter-spacing: 0.03em;
        border-top: 1px solid rgba(212,182,122,0.14);
      }
      .ls-planet-body { display: grid; gap: 3px; min-width: 0; }
      .ls-planet-head {
        display: flex;
        align-items: baseline;
        gap: 8px;
        color: ${C.creamDim};
        font-family: Lato, system-ui, sans-serif;
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      .ls-planet-glyph { color: ${C.gold}; font-size: 1.15rem; font-style: normal; }
      .ls-planet-sign {
        color: ${C.cream};
        font-family: "Playfair Display", Georgia, serif;
        font-size: 1.18rem;
        font-weight: 500;
        line-height: 1.05;
      }
      .ls-planet-card small {
        color: ${C.muted};
        font-family: Lato, system-ui, sans-serif;
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
        font-family: "Playfair Display", Georgia, serif;
        font-size: clamp(1.4rem, 3.6vw, 1.9rem);
        line-height: 1.1;
      }
      .ls-sky-gate small {
        color: ${C.creamDim};
        font-family: Lato, system-ui, sans-serif;
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
        border: 1px solid rgba(212,182,122,0.34);
        border-radius: 8px;
        background: rgba(5,4,7,0.72);
        color: ${C.cream};
        padding: 0 14px;
        font-family: Lato, system-ui, sans-serif;
      }
      .ls-sky-bridge { margin-top: 22px; text-align: center; }
      .ls-sky-bridge-lead {
        color: ${C.cream};
        font-family: "Playfair Display", Georgia, serif;
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
      .ls-seal-card {
        width: 100%; max-width: 440px;
        display: grid; gap: 12px; justify-items: center; text-align: center;
        padding: clamp(22px, 4vw, 34px);
        border: 1px solid ${C.line}; border-radius: 16px;
        background: linear-gradient(180deg, rgba(21,16,28,0.92), rgba(13,10,20,0.96));
        box-shadow: 0 30px 90px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(212,182,122,0.06);
      }
      .ls-seal-glyph { font-size: 1.6rem; color: ${C.gold}; line-height: 1; }
      .ls-seal-title {
        color: ${C.cream}; font-family: "Playfair Display", Georgia, serif;
        font-size: clamp(1.5rem, 4vw, 2.05rem); font-weight: 500; line-height: 1.1;
      }
      .ls-seal-sub { color: ${C.muted}; font-family: Lato, system-ui, sans-serif; font-size: 0.92rem; }
      .ls-seal-field { width: 100%; display: grid; gap: 5px; text-align: left; }
      .ls-seal-field label {
        color: ${C.creamDim}; font-family: Lato, system-ui, sans-serif;
        font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
      }
      .ls-seal-field label span { color: ${C.muted}; font-weight: 500; text-transform: none; letter-spacing: 0; }
      .ls-seal-field input {
        min-height: 48px; width: 100%;
        border: 1px solid rgba(212,182,122,0.34); border-radius: 8px;
        background: rgba(5,4,7,0.72); color: ${C.cream}; padding: 0 14px;
        font-family: Lato, system-ui, sans-serif; font-size: 0.95rem;
      }
      .ls-seal-field input:focus { outline: none; border-color: ${C.violetSoft}; }
      .ls-seal-help { color: ${C.muted}; font-family: Lato, system-ui, sans-serif; font-size: 0.74rem; line-height: 1.4; max-width: 340px; }
      .ls-seal-cta { width: 100%; justify-content: center; margin-top: 4px; }

      /* loading animation between gate submit and the reveal */
      .ls-seal-loading { display: grid; gap: 16px; justify-items: center; text-align: center; padding: 30px 22px; }
      .ls-seal-orbit { position: relative; width: 136px; height: 136px; }
      .ls-seal-core {
        position: absolute; top: 50%; left: 50%; width: 22px; height: 22px; margin: -11px 0 0 -11px;
        border-radius: 50%; background: radial-gradient(circle at 40% 35%, ${C.goldSoft}, ${C.gold} 60%, ${C.goldDeep});
        box-shadow: 0 0 24px rgba(212,182,122,0.7); animation: ls-corepulse 2.2s ease-in-out infinite;
      }
      .ls-seal-ring { position: absolute; border: 1px solid rgba(212,182,122,0.22); border-radius: 50%; }
      .ls-seal-ring i {
        position: absolute; top: -4px; left: 50%; width: 8px; height: 8px; margin-left: -4px;
        border-radius: 50%; background: ${C.violetSoft}; box-shadow: 0 0 10px rgba(154,126,230,0.9);
      }
      .ls-seal-ring-1 { inset: 8px; animation: ls-spin 2.6s linear infinite; }
      .ls-seal-ring-2 { inset: 34px; animation: ls-spin 3.8s linear infinite reverse; }
      .ls-seal-ring-2 i { background: ${C.goldSoft}; box-shadow: 0 0 10px rgba(240,217,159,0.9); }
      .ls-seal-ring-3 { inset: 56px; animation: ls-spin 5.4s linear infinite; }
      .ls-seal-ring-3 i { width: 6px; height: 6px; background: ${C.cream}; }
      @keyframes ls-spin { to { transform: rotate(360deg); } }
      @keyframes ls-corepulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.18); } }
      .ls-seal-loading-text { color: ${C.cream}; font-family: "Playfair Display", Georgia, serif; font-size: clamp(1.4rem, 3.4vw, 1.95rem); line-height: 1.1; }
      .ls-seal-loading-sub { color: ${C.muted}; font-family: Lato, system-ui, sans-serif; font-size: 0.85rem; }

      /* the REAL placement shown on the solar-system bubble; generic meaning sits under it */
      .ls-orrery-placement {
        display: block; color: ${C.goldSoft};
        font-family: "Playfair Display", Georgia, serif;
        font-size: clamp(1.35rem, 3.2vw, 2rem); font-weight: 600; line-height: 1.04; margin: 3px 0 1px;
      }
      .ls-orrery-line--info { color: ${C.muted} !important; font-size: clamp(0.88rem, 1.6vw, 1.08rem) !important; }

      @media (prefers-reduced-motion: reduce) {
        .ls-seal-ring, .ls-seal-core { animation: none !important; }
      }

      .ls-reveal-stack { max-width: 980px; margin: 22px auto 0; padding: 0 4px; display: grid; gap: 22px; }
      .ls-reveal-eyebrow {
        text-align: center; color: ${C.creamDim};
        font-family: Lato, system-ui, sans-serif; font-size: 0.72rem; font-weight: 800;
        letter-spacing: 0.16em; text-transform: uppercase;
      }
      .ls-reveal-eyebrow--rest { margin-top: 6px; color: ${C.gold}; }
      .ls-free-grid { display: grid; gap: 12px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
      @media (max-width: 720px) { .ls-free-grid { grid-template-columns: 1fr; } }
      .ls-free-card {
        display: grid; gap: 6px; justify-items: center; text-align: center;
        padding: 20px 16px;
        border: 1px solid ${C.line}; border-radius: 14px;
        background: linear-gradient(180deg, rgba(21,16,28,0.7), rgba(13,10,20,0.85));
      }
      .ls-free-glyph { font-size: 1.5rem; color: ${C.gold}; line-height: 1; }
      .ls-free-frame {
        color: ${C.creamDim}; font-family: Lato, system-ui, sans-serif;
        font-size: 0.68rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase;
      }
      .ls-free-sign { color: ${C.cream}; font-family: "Playfair Display", Georgia, serif; font-size: 1.22rem; font-weight: 500; line-height: 1.1; }
      .ls-free-card small { color: ${C.muted}; font-family: Lato, system-ui, sans-serif; font-size: 0.8rem; line-height: 1.4; }

      .ls-gate2 {
        display: grid; gap: 10px; justify-items: center; text-align: center;
        max-width: 520px; margin: 4px auto 0; padding: clamp(22px, 4vw, 30px);
        border: 1px solid ${C.line}; border-radius: 16px;
        background: radial-gradient(ellipse at 50% 0%, rgba(124,92,214,0.16), transparent 60%), linear-gradient(180deg, rgba(21,16,28,0.9), rgba(13,10,20,0.95));
      }
      .ls-gate2-glyph { font-size: 1.4rem; color: ${C.gold}; }
      .ls-gate2-title { color: ${C.cream}; font-family: "Playfair Display", Georgia, serif; font-size: clamp(1.4rem, 3.4vw, 1.85rem); font-weight: 500; }
      .ls-gate2-sub { color: ${C.muted}; font-family: Lato, system-ui, sans-serif; font-size: 0.9rem; line-height: 1.45; max-width: 380px; }
      .ls-gate2-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; width: 100%; max-width: 440px; margin-top: 4px; }
      @media (max-width: 520px) { .ls-gate2-row { grid-template-columns: 1fr; } }
      .ls-gate2-row input {
        min-height: 48px; width: 100%;
        border: 1px solid rgba(212,182,122,0.34); border-radius: 8px;
        background: rgba(5,4,7,0.72); color: ${C.cream}; padding: 0 14px;
        font-family: Lato, system-ui, sans-serif;
      }
      .ls-gate2-row input:focus { outline: none; border-color: ${C.violetSoft}; }
      .ls-gate2-trust { color: ${C.muted}; font-family: Lato, system-ui, sans-serif; font-size: 0.74rem; letter-spacing: 0.02em; }

      .ls-locked-block { display: grid; gap: 14px; }
      .ls-locked-eyebrow {
        text-align: center; color: ${C.gold};
        font-family: Lato, system-ui, sans-serif; font-size: 0.72rem; font-weight: 800;
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
      .ls-teaser-title { color: ${C.cream}; font-family: "Playfair Display", Georgia, serif; font-size: 1.02rem; font-weight: 500; line-height: 1.15; }
      .ls-teaser-line { color: ${C.muted}; font-family: Lato, system-ui, sans-serif; font-size: 0.78rem; line-height: 1.4; filter: blur(2.6px); user-select: none; }

      .ls-upsell {
        display: grid; gap: 14px; justify-items: center; text-align: center;
        max-width: 640px; margin: 8px auto 0; padding: clamp(26px, 4vw, 38px);
        border: 1px solid rgba(212,182,122,0.3); border-radius: 18px;
        background: radial-gradient(ellipse at 50% 0%, rgba(124,92,214,0.18), transparent 60%), linear-gradient(180deg, rgba(24,18,32,0.92), rgba(13,10,20,0.96));
      }
      .ls-upsell-title { color: ${C.cream}; font-family: "Playfair Display", Georgia, serif; font-size: clamp(1.5rem, 3.6vw, 2.1rem); font-weight: 500; line-height: 1.12; }
      .ls-upsell-pitch { color: ${C.creamDim}; font-family: Lato, system-ui, sans-serif; font-size: 0.96rem; line-height: 1.55; max-width: 540px; }
      .ls-upsell-cta { margin-top: 4px; }
      @media (prefers-reduced-motion: reduce) {
        .ls-orrery-wrap.is-open .ls-orrery { animation: none !important; }
        .ls-orrery-wrap { transition: none !important; }
      }
      .ls-story-section {
        background:
          radial-gradient(ellipse at 78% 18%, rgba(94,70,122,0.22), transparent 34%),
          radial-gradient(ellipse at 10% 62%, rgba(212,182,122,0.08), transparent 28%);
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
        font-family: "Playfair Display", Georgia, serif;
        font-size: clamp(1.35rem, 2.5vw, 1.85rem);
        font-weight: 500;
        line-height: 1.08;
      }
      .ls-story-moment p:not(:first-child),
      .ls-receive-item p {
        margin-top: 10px;
        color: ${C.creamDim};
        font-family: Lato, system-ui, sans-serif;
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
        border-top: 1px solid rgba(212,182,122,0.22);
      }
      .ls-receive-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 18px;
      }
      .ls-receive-item {
        min-height: 168px;
        border: 1px solid rgba(212,182,122,0.24);
        border-radius: 8px;
        background: linear-gradient(180deg, rgba(245,239,230,0.055), rgba(245,239,230,0.018));
        padding: clamp(18px, 2.5vw, 24px);
      }

      .ls-disclosure {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        width: 100%;
        text-align: left;
        border: 1px solid rgba(212,182,122,0.30);
        border-radius: 12px;
        background: linear-gradient(180deg, rgba(245,239,230,0.06), rgba(245,239,230,0.02));
        padding: 20px 22px;
        cursor: pointer;
        transition: border-color 0.2s ease, background 0.2s ease;
      }
      .ls-disclosure:hover { border-color: rgba(212,182,122,0.52); }
      .ls-disclosure.is-open {
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
        border-bottom-color: transparent;
      }
      .ls-disclosure-text { display: grid; gap: 6px; }
      .ls-disclosure-title {
        color: ${C.cream};
        font-family: "Playfair Display", Georgia, serif;
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
        border: 1px solid rgba(212,182,122,0.4);
        color: ${C.gold};
        font-size: 1.6rem;
        line-height: 1;
      }
      .ls-disclosure-body {
        border: 1px solid rgba(212,182,122,0.30);
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
        font-family: Lato, system-ui, sans-serif;
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
        color: ${C.gold}; font-family: Lato, system-ui, sans-serif; font-size: 0.8rem;
        text-decoration: underline; text-underline-offset: 3px;
      }
      .ls-seal-why:hover { color: ${C.goldSoft}; }

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
          radial-gradient(1px 1px at 20% 24%, rgba(245,239,230,0.7), transparent),
          radial-gradient(1px 1px at 70% 30%, rgba(245,239,230,0.5), transparent),
          radial-gradient(1.4px 1.4px at 44% 66%, #fff, transparent),
          radial-gradient(1px 1px at 82% 62%, rgba(245,239,230,0.5), transparent),
          radial-gradient(1px 1px at 16% 78%, rgba(245,239,230,0.6), transparent),
          radial-gradient(1.2px 1.2px at 58% 18%, #fff, transparent);
        background-size: 260px 260px;
        animation: ls-twinkle 3.6s ease-in-out infinite;
      }
      @keyframes ls-twinkle { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.7; } }
      .ls-compute-mote {
        position: absolute; top: 42%; left: 50%; width: 14px; height: 14px; margin: -7px 0 0 -7px;
        border-radius: 50%;
        background: radial-gradient(circle at 40% 35%, ${C.goldSoft}, ${C.gold} 60%, ${C.goldDeep});
        box-shadow: 0 0 26px rgba(212,182,122,0.75);
        opacity: 0.5; transform: scale(0.7);
        transition: opacity 400ms ease, transform 400ms ease;
        animation: ls-corepulse 3s ease-in-out infinite;
      }
      .ls-compute-mote.is-lit { opacity: 1; transform: scale(1); }
      .ls-compute-readout {
        position: absolute; top: 57%; left: 0; right: 0; min-height: 1.2em; text-align: center;
        color: ${C.goldSoft}; font-family: Lato, system-ui, sans-serif; font-size: 0.92rem;
        letter-spacing: 0.04em; font-variant-numeric: tabular-nums;
      }
      .ls-compute-line {
        position: absolute; bottom: 14%; left: 0; right: 0; margin: 0; padding: 0 24px; text-align: center;
        color: ${C.muted}; font-family: Lato, system-ui, sans-serif; font-size: 0.98rem; line-height: 1.4;
      }

      .ls-wheel { display: grid; justify-items: center; gap: 16px; }
      .ls-wheel-svg { width: min(92vw, 460px); height: auto; aspect-ratio: 1; display: block; }
      .ls-wheel-signglyph, .ls-wheel-planetglyph {
        font-family: "Noto Sans Symbols2", "Segoe UI Symbol", "Apple Symbols", system-ui, sans-serif;
      }
      .ls-wheel-centername { font-family: "Playfair Display", Georgia, serif; letter-spacing: 0.01em; }
      .ls-wheel-centerborn, .ls-wheel-centerdom {
        font-family: Lato, system-ui, sans-serif; letter-spacing: 0.12em; text-transform: uppercase;
      }
      .ls-wheel-info {
        display: inline-flex; align-items: center; gap: 9px; min-height: 44px; padding: 0 16px;
        border-radius: 999px; border: 1px solid rgba(212,182,122,0.4); background: rgba(13,10,20,0.6);
        color: ${C.goldSoft}; font-family: Lato, system-ui, sans-serif; font-size: 0.86rem; cursor: pointer;
        transition: border-color 200ms ease, color 200ms ease;
      }
      .ls-wheel-info:hover { border-color: ${C.gold}; color: ${C.gold}; }
      .ls-wheel-info-mark {
        display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%;
        border: 1px solid rgba(212,182,122,0.6); font-family: "Playfair Display", Georgia, serif;
        font-size: 0.8rem; line-height: 1; font-style: italic;
      }
      .ls-wheel-honesty {
        max-width: 50ch; margin: 0 auto; text-align: center; color: ${C.muted};
        font-family: Lato, system-ui, sans-serif; font-size: 0.82rem; line-height: 1.5;
      }

      .ls-free-head {
        display: inline-flex; align-items: center; gap: 8px; color: ${C.creamDim};
        font-family: Lato, system-ui, sans-serif; font-size: 0.68rem; font-weight: 800;
        letter-spacing: 0.12em; text-transform: uppercase;
      }
      .ls-free-glyph { font-size: 1.05rem; color: ${C.gold}; line-height: 1; }
      .ls-free-sign { font-size: clamp(1.15rem, 3.4vw, 1.45rem); font-variant-numeric: tabular-nums; }

      .ls-info-inline { width: min(100%, 1000px); margin: 10px auto 0; }
      .ls-info-panel {
        position: relative; width: 100%;
        display: grid; gap: 14px; padding: clamp(14px, 3vw, 22px);
        border: 1px solid rgba(124,92,214,0.24); border-radius: 20px;
        background: linear-gradient(180deg, rgba(21,16,28,0.96), rgba(10,8,16,0.98));
        box-shadow: inset 0 1px 0 rgba(245,239,230,0.05), 0 24px 70px rgba(0,0,0,0.45);
      }
      .ls-breakdown-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr)); }
      .ls-breakdown-card { justify-items: start; text-align: left; }
      .ls-breakdown-card .ls-free-sign { text-align: left; }
      .ls-breakdown-card small { text-align: left; }
      .ls-chart-table { display: grid; gap: 10px; width: 100%; max-width: 760px; margin: 0 auto; }
      .ls-trow {
        position: relative; display: grid; grid-template-columns: auto 1fr; gap: 13px; align-items: start;
        padding: 14px 16px; border: 1px solid ${C.line}; border-radius: 14px; text-align: left;
        background: linear-gradient(180deg, rgba(21,16,28,0.7), rgba(13,10,20,0.85));
      }
      .ls-trow-glyph { font-family: "Noto Sans Symbols2", "Segoe UI Symbol", "Apple Symbols", system-ui, sans-serif; font-size: 1.4rem; line-height: 1; color: ${C.gold}; padding-top: 3px; }
      .ls-trow-main { min-width: 0; display: grid; gap: 4px; }
      .ls-trow-top { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
      .ls-trow-name { color: ${C.cream}; font-family: "Playfair Display", Georgia, serif; font-size: 1.06rem; font-weight: 500; }
      .ls-trow-sign { color: ${C.goldSoft}; font-family: Lato, system-ui, sans-serif; font-size: 0.92rem; font-variant-numeric: tabular-nums; }
      .ls-trow-frame { color: ${C.creamDim}; font-family: Lato, system-ui, sans-serif; font-size: 0.64rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; }
      .ls-trow-line { margin: 3px 0 0; color: ${C.muted}; font-family: Lato, system-ui, sans-serif; font-size: 0.9rem; line-height: 1.5; transition: filter 300ms ease; }
      .ls-trow.is-locked .ls-trow-line { filter: blur(4.5px); user-select: none; }
      .ls-trow-lock { position: absolute; top: 14px; right: 16px; color: ${C.gold}; font-family: Lato, system-ui, sans-serif; font-size: 0.62rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.85; }
      .ls-info-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      .ls-info-back {
        display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 12px;
        border-radius: 8px; border: 1px solid ${C.line}; background: transparent; cursor: pointer;
        color: ${C.gold}; font-family: Lato, system-ui, sans-serif; font-size: 0.86rem;
      }
      .ls-info-back:hover { border-color: rgba(212,182,122,0.56); }
      .ls-info-title { color: ${C.creamDim}; font-family: Lato, system-ui, sans-serif; font-size: 0.8rem; letter-spacing: 0.04em; }
      .ls-info-note { margin: 0 auto; max-width: 60ch; text-align: center; color: ${C.muted}; font-family: Lato, system-ui, sans-serif; font-size: 0.78rem; line-height: 1.5; }
      @media (prefers-reduced-motion: reduce) {
        .ls-compute-dust, .ls-compute-mote { animation: none !important; }
      }

      .ls-checkout-shell {
        background:
          radial-gradient(ellipse at 50% 0%, rgba(212,182,122,0.13), transparent 40%),
          linear-gradient(180deg, rgba(245,239,230,0.07), rgba(245,239,230,0.025));
        border-top: 1px solid rgba(212,182,122,0.46);
      }
      .ls-checkout-vars {
        --black: ${C.cream};
        --ink: ${C.cream};
        --earth: ${C.creamDim};
        --muted: ${C.muted};
        --cream: transparent;
        --cream2: rgba(245,239,230,0.06);
        --cream3: rgba(212,182,122,0.22);
        --sand: rgba(212,182,122,0.30);
        --rose: ${C.gold};
        --rose-hover: ${C.goldSoft};
        --gold: ${C.gold};
      }
      .ls-gold-button,
      .ls-ghost-button {
        min-height: 48px;
        align-items: center;
        justify-content: center;
        display: inline-flex;
        gap: 10px;
        border-radius: 8px;
        padding: 0 24px;
        font-family: Lato, system-ui, sans-serif;
        font-size: 14px;
        font-weight: 600;
        transition: background 180ms ease, border-color 180ms ease, color 180ms ease;
      }
      .ls-gold-button {
        background: ${C.violet};
        color: ${C.cream};
        border: 1px solid ${C.violetSoft};
      }
      .ls-gold-button:hover {
        background: ${C.violetSoft};
      }
      .ls-gold-button:disabled {
        cursor: default;
        opacity: 0.74;
      }
      .ls-ghost-button {
        color: ${C.cream};
        border: 1px solid ${C.line};
      }
      .ls-ghost-button:hover {
        border-color: rgba(212,182,122,0.56);
        background: rgba(245,239,230,0.04);
      }
      .ls-violet-button {
        background: ${C.violet};
        color: ${C.cream};
        border-color: ${C.violetSoft};
      }
      .ls-violet-button:hover {
        background: ${C.violetSoft};
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
        border-left: 1px solid rgba(212,182,122,0.34);
        padding-left: 16px;
        color: ${C.muted};
        font-family: Lato, system-ui, sans-serif;
        font-size: 12px;
      }
      .ls-video-seed strong {
        display: block;
        color: ${C.cream};
        font-family: "Cormorant", Georgia, serif;
        font-size: 1.25rem;
        font-weight: 400;
        font-style: italic;
        line-height: 1.18;
        margin-top: 6px;
      }
      .ls-hero-img {
        border: 1px solid rgba(212,182,122,0.34);
        border-radius: 8px;
        background: #050407;
        box-shadow: inset 0 1px 0 rgba(245,239,230,0.05), 0 20px 60px rgba(0,0,0,0.32);
      }
      .ls-hero-img img { display: block; }
      .ls-video-slot {
        border-left: none;
        padding-left: 0;
        min-height: 0;
        aspect-ratio: 1 / 1;
        border: 1px solid rgba(212,182,122,0.34);
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
        font-family: Lato, system-ui, sans-serif;
        font-size: 12px;
      }
      .ls-video-fallback strong {
        display: block;
        color: ${C.cream};
        font-family: "Cormorant", Georgia, serif;
        font-size: 1.25rem;
        font-weight: 400;
        font-style: italic;
        line-height: 1.18;
        margin-top: 6px;
      }
      .ls-placeholder {
        background: #050407;
        border: 1px solid rgba(212,182,122,0.34);
        border-radius: 8px;
      }
      .ls-placeholder::before {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(245,239,230,0.045), transparent 38%);
      }
      .ls-placeholder-core {
        position: absolute;
        inset: 0;
        background:
          radial-gradient(circle at 50% 42%, rgba(212,182,122,0.20), transparent 22%),
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
        font-family: "Cormorant", Georgia, serif;
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
        background: linear-gradient(90deg, rgba(245,239,230,0), rgba(245,239,230,0.86), rgba(212,182,122,0));
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
  fontFamily: "Lato, system-ui, sans-serif",
  fontSize: "clamp(1.05rem, 2.1vw, 1.3rem)",
  fontWeight: 400,
  lineHeight: 1.5,
} as const;

const galleryCaptionStyle = {
  color: C.cream,
  fontFamily: '"Playfair Display", Georgia, serif',
  fontSize: "clamp(1.65rem, 4.2vw, 3.2rem)",
  fontWeight: 500,
  lineHeight: 1.04,
  letterSpacing: 0,
} as const;

const heroTitleStyle = {
  color: C.cream,
  fontFamily: '"Playfair Display", Georgia, serif',
  fontSize: "clamp(2.7rem, 8vw, 6.35rem)",
  fontWeight: 500,
  lineHeight: 0.92,
  letterSpacing: "-0.018em",
} as const;

const sectionTitleStyle = {
  color: C.cream,
  fontFamily: '"Playfair Display", Georgia, serif',
  fontSize: "clamp(2.55rem, 6vw, 4.9rem)",
  fontWeight: 500,
  lineHeight: 0.98,
  letterSpacing: "-0.018em",
} as const;

const sectionBodyStyle = {
  color: C.creamDim,
  fontFamily: "Lato, system-ui, sans-serif",
  fontSize: "1.08rem",
  lineHeight: 1.74,
} as const;

const bodyStyle = {
  color: C.creamDim,
  fontFamily: "Lato, system-ui, sans-serif",
  fontSize: "0.98rem",
  lineHeight: 1.68,
} as const;

const smallBodyStyle = {
  color: C.muted,
  fontFamily: "Lato, system-ui, sans-serif",
  fontSize: "0.92rem",
  lineHeight: 1.62,
} as const;

const panelLeadStyle = {
  color: C.cream,
  fontFamily: '"Playfair Display", Georgia, serif',
  fontSize: "1.42rem",
  fontWeight: 500,
  lineHeight: 1.18,
} as const;

const cardTitleStyle = {
  color: C.cream,
  fontFamily: '"Playfair Display", Georgia, serif',
  fontSize: "1.92rem",
  fontWeight: 500,
  lineHeight: 1.06,
} as const;

const chartTitleStyle = {
  color: C.cream,
  fontFamily: '"Playfair Display", Georgia, serif',
  fontSize: "clamp(2rem, 4vw, 3.2rem)",
  fontWeight: 500,
  lineHeight: 1,
} as const;

const smallTitleStyle = {
  color: C.cream,
  fontFamily: '"Playfair Display", Georgia, serif',
  fontSize: "1.25rem",
  fontWeight: 500,
  lineHeight: 1.12,
} as const;

const faqTitleStyle = {
  color: C.cream,
  fontFamily: '"Playfair Display", Georgia, serif',
  fontSize: "1.55rem",
  fontWeight: 500,
  lineHeight: 1.18,
} as const;

const whisperStyle = {
  color: C.creamDim,
  fontFamily: '"Cormorant", Georgia, serif',
  fontSize: "1.48rem",
  fontStyle: "italic",
  lineHeight: 1.42,
} as const;

const quoteStyle = {
  color: C.cream,
  fontFamily: '"Cormorant", Georgia, serif',
  fontSize: "1.65rem",
  fontStyle: "italic",
  lineHeight: 1.42,
} as const;

function eyebrowStyle(color: string) {
  return {
    color,
    fontFamily: "Lato, system-ui, sans-serif",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
  };
}

export default ReadingsLanding;
