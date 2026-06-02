import { useEffect, useRef, useState } from "react";
import type { FormEvent, RefObject } from "react";
import { ArrowRight, ChevronDown, Stars } from "lucide-react";
import { InlineCheckout } from "./InlineCheckout";
import { supabase } from "@/integrations/supabase/client";

const C = {
  ink: "#141210",
  cream: "#f5efe6",
  creamDim: "#cfc1b1",
  muted: "#9d8d7f",
  gold: "#d4b67a",
  goldSoft: "#f0d99f",
  goldDeep: "#8b6f3a",
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
  mercury: { glyph: "☿", label: "Mercury", line: "How they read you and answer back.", img: "/readings/planets/mercury.png" },
  venus: { glyph: "♀", label: "Venus", line: "How they give, and ask for, love.", img: "/readings/planets/venus.png" },
  mars: { glyph: "♂", label: "Mars", line: "Their drive, courage and play.", img: "/readings/planets/mars.png" },
  jupiter: { glyph: "♃", label: "Jupiter", line: "Where they trust enough to open up.", img: "/readings/planets/jupiter.png" },
  saturn: { glyph: "♄", label: "Saturn", line: "What steadies them and holds them.", img: "/readings/planets/saturn.png" },
  uranus: { glyph: "♅", label: "Uranus", line: "Where they break their own pattern.", img: "/readings/planets/uranus.png" },
  neptune: { glyph: "♆", label: "Neptune", line: "Their dreaming, their softness, their fog.", img: "/readings/planets/neptune.png" },
  pluto: { glyph: "♇", label: "Pluto", line: "What they carry deep and rarely show.", img: "/readings/planets/pluto.png" },
  chiron: { glyph: "⚷", label: "Chiron", line: "The old hurt they are quietly healing." },
  northNode: { glyph: "☊", label: "North Node", line: "The direction their soul is growing." },
  lilith: { glyph: "⚸", label: "Lilith", line: "Their untamed, instinctive edge." },
};

const PLANET_ORDER = [
  "sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn",
  "uranus", "neptune", "pluto", "chiron", "northNode", "lilith",
] as const;

// Sun + Moon revealed free; the rest unlock behind the email gate.
const FREE_BODIES = 2;

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
    q: "What if I do not know their exact birthday?",
    a: "Use the closest date you have. Rescue and adopted pets are welcome. The reading works with honest uncertainty and keeps the astrology grounded.",
  },
  {
    q: "Is this only for dogs and cats?",
    a: "No. Dogs and cats are common, but any beloved pet can have a reading when you can share their story and the details you know.",
  },
  {
    q: "Is this separate from Pawtraits?",
    a: "Yes. Pawtraits are the portrait studio. This page is for the soul reading: the emotional, astrological story behind who they are.",
  },
];

export function ReadingsLanding() {
  const pageRef = useRef<HTMLElement>(null);
  const checkoutRef = useRef<HTMLDivElement>(null);
  const [selectedPrice, setSelectedPrice] = useState(0);
  useCosmicParallax(pageRef);

  const scrollToCheckout = () => {
    checkoutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main ref={pageRef} className="ls-cosmic-page min-h-screen overflow-hidden" style={{ background: C.cosmos, color: C.cream }}>
      <CosmicStyles />
      <CosmicBackdrop />
      <HeroSection onBegin={scrollToCheckout} />
      <BirthChartPreviewSection />
      <QuietMomentSection />
      <CheckoutSection
        checkoutRef={checkoutRef}
        selectedPrice={selectedPrice}
        onSelectedPriceChange={setSelectedPrice}
      />
      <FaqSection />
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

function HeroSection({ onBegin }: { onBegin: () => void }) {
  return (
    <section className="ls-hero-section ls-parallax-band relative isolate min-h-[820px] px-5 pb-24 pt-28 sm:pt-34 lg:flex lg:min-h-[920px] lg:items-center">
      <HeroBackdropVideo />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_72%_10%,rgba(212,182,122,0.08),transparent_34%),radial-gradient(ellipse_at_12%_18%,rgba(94,70,122,0.16),transparent_30%),linear-gradient(100deg,rgba(8,6,11,0.76)_0%,rgba(8,6,11,0.44)_34%,rgba(8,6,11,0.08)_68%,rgba(8,6,11,0.10)_100%)]" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center">
        <div className="ls-hero-copy max-w-2xl">
          <h1 className="mt-6 text-balance" style={heroTitleStyle}>
            Read the soul behind those eyes.
          </h1>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button onClick={onBegin} className="ls-gold-button">
              Begin Their Reading <ArrowRight size={17} />
            </button>
            <a href="#how-it-works" className="ls-ghost-button">
              See how it works
            </a>
          </div>
          <p className="mt-8 max-w-lg text-pretty" style={whisperStyle}>
            For the look you never needed translated until now.
          </p>
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
  const [unlocked, setUnlocked] = useState(false);
  const [gateStatus, setGateStatus] = useState<"idle" | "loading">("idle");
  const [gateError, setGateError] = useState("");
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

    setStatus("loading");
    setMessage("");
    setUnlocked(false);
    try {
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

  const handleUnlock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!/.+@.+\..+/.test(clean)) {
      setGateError("Enter a valid email.");
      return;
    }
    setGateError("");
    setGateStatus("loading");
    try {
      await supabase.functions.invoke("track-subscriber", {
        body: {
          email: clean,
          event: "birth_chart_lead",
          petName: name || null,
          source: "birth_chart_preview",
        },
      });
    } catch (error) {
      // Lead capture is best-effort — never block the reveal on a hiccup.
      console.warn("[Little Souls] lead capture failed", error);
    }
    try {
      sessionStorage.setItem("ls_chart_email", clean);
    } catch {
      /* ignore */
    }
    setGateStatus("idle");
    setUnlocked(true);
  };

  const themName = name || "their";

  const scrollToCheckout = () =>
    document.getElementById("begin")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <section className="ls-parallax-band relative px-5 py-18 sm:py-28">
      <div className="ls-birth-intro mx-auto max-w-6xl">
        <div className="ls-birth-copy">
          <h2 className="text-balance" style={sectionTitleStyle}>
            Free mini reading calculations.
          </h2>
        </div>
      </div>

      <div className="ls-chart-shell mx-auto mt-10 max-w-3xl">
        <SolarSystemBackdrop />
        <div className="relative z-10">
          <div>
            <p style={eyebrowStyle(C.gold)}>Computed sky</p>
            <h3 className="mt-4 text-balance" style={chartTitleStyle}>
              {status === "ready" ? `${name || "Their"} birth sky` : "Free mini reading"}
            </h3>
          </div>

          <form className="ls-lead-form ls-lead-form--card mt-7" onSubmit={handlePreview}>
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
            </div>
            <button type="submit" className="ls-gold-button" disabled={status === "loading"}>
              {status === "loading"
                ? "Reading Their Sky..."
                : status === "ready"
                ? "Recalculate"
                : "Reveal Their Birth Sky"}
              {status !== "loading" && <ArrowRight size={17} />}
            </button>
            {message && status === "error" && (
              <p className="ls-chart-message is-error">{message}</p>
            )}
          </form>

          {status === "ready" ? (
            <div className="mt-8">
              <div className="ls-sky-grid">
                {PLANET_ORDER.slice(0, FREE_BODIES).map((key) => (
                  <PlanetCard key={key} planet={key} body={bodyFor(key)} />
                ))}
              </div>

              <div className={`ls-sky-locked ${unlocked ? "is-open" : ""}`}>
                <div className="ls-sky-grid ls-sky-rest">
                  {PLANET_ORDER.slice(FREE_BODIES).map((key) => (
                    <PlanetCard key={key} planet={key} body={bodyFor(key)} locked={!unlocked} />
                  ))}
                  {unlocked && (
                    <article className="ls-planet-card ls-element-card">
                      <span className="ls-planet-orb ls-element-orb" aria-hidden="true">✦</span>
                      <div className="ls-planet-body">
                        <span className="ls-planet-head">Dominant</span>
                        <strong className="ls-planet-sign">
                          {chart?.dominantElement ? `${chart.dominantElement} element` : "Calculated pattern"}
                        </strong>
                        <small>The thread running through all of it.</small>
                      </div>
                    </article>
                  )}
                </div>

                {!unlocked && (
                  <div className="ls-sky-gate">
                    <Stars size={22} style={{ color: C.gold }} />
                    <p>See {themName} whole sky.</p>
                    <small>The rest of their placements now, and we&apos;ll send their chart to your inbox.</small>
                    <form onSubmit={handleUnlock}>
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          if (gateError) setGateError("");
                        }}
                        placeholder="your@email.com"
                        aria-label="Your email"
                        autoComplete="email"
                      />
                      <button type="submit" className="ls-gold-button" disabled={gateStatus === "loading"}>
                        {gateStatus === "loading" ? "Opening..." : "Reveal the full sky"}
                      </button>
                    </form>
                    {gateError && <p className="ls-chart-message is-error">{gateError}</p>}
                  </div>
                )}
              </div>

              {unlocked && (
                <div className="ls-sky-bridge">
                  <p className="ls-sky-bridge-lead">
                    That&apos;s the surface of {themName} sky. The full reading walks every
                    placement: how {name || "they"} love, what steadies them, why they chose
                    you, in their own voice.
                  </p>
                  <button type="button" onClick={scrollToCheckout} className="ls-gold-button ls-sky-cta">
                    Read {name || "their"} full soul reading <ArrowRight size={17} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="ls-sky-teaser mt-8">
              <div className="ls-sky-grid ls-sky-preview" aria-hidden="true">
                {PLANET_ORDER.map((key) => (
                  <PlanetCard key={key} planet={key} />
                ))}
              </div>
              <p className="ls-chart-message">
                {status === "loading"
                  ? "Reading their sky..."
                  : "Enter their date to light up their real planets. Sun, Moon and the placements that make them, them."}
              </p>
            </div>
          )}

          <CalcDropdown open={calcOpen} onToggle={() => setCalcOpen((v) => !v)} />
        </div>
      </div>
    </section>
  );
}

function PlanetCard({
  planet,
  body,
  locked = false,
}: {
  planet: keyof typeof PLANET_META;
  body?: ChartBody;
  locked?: boolean;
}) {
  const meta = PLANET_META[planet];
  const sign = body?.sign;
  const signGlyph = sign ? SIGN_GLYPHS[sign] ?? "" : "";
  const degree = typeof body?.degree === "number" ? `${Math.round(body.degree)}° ` : "";
  return (
    <article className={`ls-planet-card ${locked ? "is-locked" : ""}`}>
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
  { planet: "mercury", size: 7, dur: 16, ring: 30, start: 35 },
  { planet: "venus", size: 12, dur: 30, ring: 46, start: 160 },
  { planet: "mars", size: 9, dur: 48, ring: 62, start: 255 },
  { planet: "jupiter", size: 22, dur: 67, ring: 78, start: 100 },
  { planet: "saturn", size: 34, dur: 89, ring: 94, start: 300 },
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
            <figcaption>Planisphærium Copernicanum — the geometry our engine computes, by hand four centuries ago.</figcaption>
          </figure>
          <p className="ls-calc-lead">
            The feeling is yours. The sky beneath it is measured. Every placement here is
            computed from their own chart with observatory-grade ephemeris — the same maths
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

function QuietMomentSection() {
  return (
    <section className="ls-story-section ls-parallax-band relative isolate overflow-hidden px-5 py-18 sm:py-28">
      <div className="ls-story-inner mx-auto max-w-6xl">
        <div className="ls-story-hero">
          <div className="ls-story-copy">
            <p style={eyebrowStyle(C.gold)}>The full reading</p>
            <h2 className="mt-5 text-balance" style={sectionTitleStyle}>
              Turn their birth sky into the story of who they are.
            </h2>
            <p className="mt-6 text-pretty" style={sectionBodyStyle}>
              The free mini reading opens the door. The full reading goes deeper:
              how they love, what steadies them, what they carry quietly, and why
              the bond between you feels the way it does.
            </p>
            <div className="ls-story-quote mt-9 border-l pl-6" style={{ borderColor: C.gold }}>
              <p style={quoteStyle}>
                "I knew that look meant something. I just never had words for it before."
              </p>
            </div>
          </div>

          <figure className="ls-story-cat">
            <img
              src="/readings/hero/black-cat-galaxy-eye.webp"
              alt="Black cat with a faint galaxy reflected in one eye"
              loading="lazy"
              width={1672}
              height={941}
            />
          </figure>
        </div>

        <div className="ls-story-moments">
          <article className="ls-story-moment ls-story-moment--wide">
            <figure>
              <img
                src="/readings/hero/cockapoo-reading-tablet.webp"
                alt="Cockapoo beside a human holding a glowing celestial reading"
                loading="lazy"
                width={1672}
                height={942}
              />
            </figure>
            <div>
              <p style={eyebrowStyle(C.gold)}>A reading you sit with</p>
              <h3>Made to be opened again.</h3>
              <p>
                Read it when they are beside you, when you miss them, or when you
                want to remember the small truths only you noticed.
              </p>
            </div>
          </article>

          <article className="ls-story-moment">
            <figure>
              <img
                src="/readings/hero/doberman-puppy-star-map.webp"
                alt="Doberman puppy touching a softly glowing star map"
                loading="lazy"
                width={1672}
                height={942}
              />
            </figure>
            <div>
              <p style={eyebrowStyle(C.gold)}>Their hidden pattern</p>
              <h3>Softness, courage, instinct.</h3>
              <p>
                The reading turns their placements into a portrait of their nature:
                what soothes them, what drives them, and how they ask for love.
              </p>
            </div>
          </article>
        </div>

        <div className="ls-receive-panel">
          <div>
            <p style={eyebrowStyle(C.gold)}>What you receive</p>
            <h2 className="mt-4 text-balance" style={sectionTitleStyle}>
              A keepsake with depth, not filler.
            </h2>
          </div>
          <div className="ls-receive-grid">
            {[
              ["Birth sky placements", "Sun, Moon and the chart patterns that make them, them."],
              ["Emotional blueprint", "How they bond, soften, protect, play and ask to be understood."],
              ["SoulSpeak included", "A gentler voice for the things you always felt from them."],
              ["Horoscope included", "A living follow-on for their current sky, not just the day they arrived."],
            ].map(([title, body]) => (
              <article key={title} className="ls-receive-item">
                <strong>{title}</strong>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
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
          body="A few honest answers before you open their reading."
          centered
        />
        <div className="mt-12 divide-y" style={{ borderColor: C.line }}>
          {FAQ.map((item) => (
            <article key={item.q} className="py-8">
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
        preload="auto"
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
        border: 1px solid rgba(212,182,122,0.34);
        border-top-color: rgba(212,182,122,0.62);
        border-radius: 8px;
        padding: clamp(24px, 4vw, 42px);
        background:
          radial-gradient(ellipse at 50% -12%, rgba(212,182,122,0.18), transparent 42%),
          radial-gradient(ellipse at 18% 82%, rgba(94,70,122,0.28), transparent 34%),
          linear-gradient(180deg, rgba(245,239,230,0.07), rgba(245,239,230,0.025));
        box-shadow: inset 0 1px 0 rgba(245,239,230,0.06), 0 28px 90px rgba(0,0,0,0.28);
      }
      .ls-solar {
        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
        opacity: 0.3;
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
        color: ${C.gold};
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
      .ls-lead-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
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
        background: ${C.gold};
        color: ${C.ink};
        border: 1px solid ${C.goldSoft};
      }
      .ls-gold-button:hover {
        background: ${C.goldSoft};
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
        .ls-hero-section {
          min-height: 790px;
          background-position: 72% center;
        }
        .ls-hero-backdrop {
          background-position: 72% center;
        }
        .ls-hero-backdrop::after {
          background:
            linear-gradient(180deg, rgba(8,6,11,0.66) 0%, rgba(8,6,11,0.18) 38%, rgba(8,6,11,0.68) 100%),
            linear-gradient(90deg, rgba(8,6,11,0.50), rgba(8,6,11,0.04));
        }
        .ls-hero-backdrop-video {
          object-position: 72% center;
          opacity: 0.94;
          top: -72px;
          height: calc(100% + 144px);
          transform: translateY(50px);
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
      }
    `}</style>
  );
}

const heroTitleStyle = {
  color: C.cream,
  fontFamily: '"Playfair Display", Georgia, serif',
  fontSize: "clamp(3.4rem, 8vw, 6.35rem)",
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
