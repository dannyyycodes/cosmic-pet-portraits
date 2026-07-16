import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SIGN_LINES } from "./signLines";
import { THIRTEEN_ORDER } from "./ReadingsLanding";

gsap.registerPlugin(ScrollTrigger);

/* ── The Reading Dossier — checkout variant B (Phase 5) ──
 *
 * One door, one bump. Ported faithfully from the approved mockup
 * mockups/pricing-winner-v2.html: gold ramp tokens + metal-gold CTA,
 * gold rationed to CTA / price / lit placements / inscription / review
 * stars / card hairline bright stops; violet text scale (300/400 minimum
 * for text); drawn SVG astrology glyph sprite; gradient hairline borders
 * (mask-composite); layered shadows; real-colour payment marks.
 *
 * This component is PRESENTATIONAL. All checkout state (email, coupon,
 * charity, Stripe handoff) stays in InlineCheckout, which renders this
 * in visualMode="dossier". Soul Bond is a +bump checkbox that maps to
 * the EXISTING premium Stripe price — no new SKU, the parent swaps
 * basicQty/premiumQty wholesale.
 *
 * Memorial path never reaches this component (CheckoutSection forces
 * the control variant for memorial-intent visitors).
 */

export type DossierCharity = "ifaw" | "world-land-trust" | "eden-reforestation";

export interface DossierCheckoutProps {
  ctaLabel: string;
  /* pricing (all minor units, user's local currency) */
  fmt: (cents: number) => string;
  horoscopeMonthly: number; // recurring /mo after the free first month
  unitNow: number;       // bond ? premium : basic
  unitWas: number;       // bond ? wasPremium : wasBasic
  bondDelta: number;     // premium - basic
  finalPrice: number;    // charged total after volume discount + coupon
  discountRate: number;  // volume discount 0–0.30
  isLocalized: boolean;
  currencyCode: string;
  /* tier state */
  bond: boolean;
  qty: number;
  onBondChange: (on: boolean) => void;
  onQtyChange: (qty: number) => void;
  /* email + checkout */
  email: string;
  onEmailChange: (v: string) => void;
  error: string;
  isLoading: boolean;
  onCheckout: () => void;
  /* promo code (demoted below the CTA) */
  codeOpen: boolean;
  onCodeOpen: () => void;
  codeInput: string;
  onCodeInput: (v: string) => void;
  codeStatus: "idle" | "checking" | "applied";
  codeError: string;
  appliedCoupon: { code: string } | null;
  onApplyCode: () => void;
  onRemoveCoupon: () => void;
  couponDiscountAmount: number;
  /* charity */
  selectedCharity: DossierCharity;
  onCharityChange: (id: DossierCharity) => void;
  /* analytics hook (existing first-party plumbing) */
  onTrack: (eventType: string, eventData: Record<string, unknown>) => void;
}

/* ── one data source drives the wheel AND the locked rows ──
 * Ring order + angles consume THIRTEEN_ORDER (ReadingsLanding — the single
 * canonical thirteen-body order, synth 2026-07-16): free five in chart
 * order, then the eight in door-descent order. Angle step 360/13 =
 * 27.6923deg clockwise from 12 o'clock, same as the rest-close ring and
 * the keepsake wheel. Metadata below is keyed by those keys.
 * The ledger is the free deck's (freeDeck.ts TEASE): five placements given,
 * eight still dark in the deck's exact words. The rising is NOT one of the
 * thirteen — it renders as the honest italic line below the rows, same as
 * FullReadingOpens. */
type PlacementMeta = { ico: string; name: string; frame: string; lit: boolean };
const PLACEMENT_META: Record<string, PlacementMeta> = {
  sun: { ico: "g-sun", name: "Sun", frame: "Who they are at the centre.", lit: true },
  moon: { ico: "g-moon", name: "Moon", frame: "How they feel, and what soothes them.", lit: true },
  mercury: { ico: "g-mercury", name: "Mercury", frame: "How they read you.", lit: true },
  venus: { ico: "g-venus", name: "Venus", frame: "How they love.", lit: true },
  mars: { ico: "g-mars", name: "Mars", frame: "What they chase, and why.", lit: true },
  saturn: { ico: "g-saturn", name: "Saturn", frame: "What they fear, and what steadies them.", lit: false },
  chiron: { ico: "g-chiron", name: "Chiron", frame: "What they carry from before you.", lit: false },
  jupiter: { ico: "g-jupiter", name: "Jupiter", frame: "Where their joy lives.", lit: false },
  pluto: { ico: "g-pluto", name: "Pluto", frame: "Who they never quite forgive.", lit: false },
  northNode: { ico: "g-node", name: "North Node", frame: "The job they came to do.", lit: false },
  uranus: { ico: "g-uranus", name: "Uranus", frame: "The strange streak.", lit: false },
  neptune: { ico: "g-neptune", name: "Neptune", frame: "The dreaming.", lit: false },
  lilith: { ico: "g-lilith", name: "Lilith", frame: "The wild streak.", lit: false },
};
const THIRTEEN_STEP = 360 / 13;
type Placement = PlacementMeta & { a: number };
let placementsCache: Placement[] | null = null;
/** Lazy on purpose: DossierCheckout sits inside the ReadingsLanding →
 * InlineCheckout → DossierCheckout import cycle, so THIRTEEN_ORDER must
 * never be dereferenced at module-eval time (TDZ). First render is fine. */
function getPlacements(): Placement[] {
  if (!placementsCache) {
    placementsCache = THIRTEEN_ORDER.map((k, i) => ({ ...PLACEMENT_META[k], a: i * THIRTEEN_STEP }));
  }
  return placementsCache;
}

const CX = 170;
const CY = 170;
function pt(angle: number, r: number): [number, number] {
  const rad = ((angle - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

/* Reviews — verbatim from the approved set; images live first-party at /reviews/.
   Exported as the single source of truth: the landing's social-proof wall
   (ReviewsWall in ReadingsLanding) reads the SAME object, so the two never drift. */
export const REVIEWS = {
  skeptic: {
    img: "/reviews/review-1.webp", alt: "Nell", stars: 5,
    quote: "I thought it was money-for-grief nonsense, if I am honest. Then it mentioned Nell guarding the stairs whenever Saturn feelings show up, and that is exactly where she plants herself when anyone raises a voice, one white sock hanging over the top step. I read that bit twice before I showed my husband.",
    attr: "Hannah P. · Nell, whippet-lurcher",
  },
  grief: {
    img: "/reviews/review-2.webp", alt: "Jasper", stars: 5,
    quote: "I opened Jasper's reading at 11pm, four days after we lost him, sitting on the kitchen floor because the house felt wrong. When it spoke about his Moon needing the highest warm place, I had to put the phone down and breathe through my sleeve. His blanket was still on the window seat.",
    attr: "Priya S. · Jasper, ginger cat",
  },
  joy: {
    img: "/reviews/review-3.webp", alt: "Alfie", stars: 5,
    quote: "alfie has a habit of dropping one toy on your foot and then pretending he has nothing to do with it. The reading called out his Venus charm and the little performance before asking to play, which made me laugh in the queue at Tesco. Sent it straight to the family chat.",
    attr: "Tom W. · Alfie, cocker spaniel",
  },
  gift: {
    img: "/reviews/review-4.webp", alt: "Mo", stars: 5,
    quote: "I bought Mo's reading for my mum's birthday because she talks to him like he is a small retired man. She went completely quiet at the dining table, then put both hands round his chest and said, 'That is him being brave, isn't it?' I could see her face change before she said anything else.",
    attr: "Eleanor M. · Mo, rescue terrier",
  },
  practical: {
    img: "/reviews/review-5.webp", alt: "Beryl", stars: 4,
    quote: "I am not usually one for this kind of thing, especially at £29. Beryl's reading gave us a better way to understand why she sulks under the desk after visitors, and the Saturn section was oddly useful. I wished one part had gone a bit longer, but it still cost less than a vet taxi and was worth it.",
    attr: "Martin C. · Beryl, British shorthair cat",
  },
  returner: {
    img: "/reviews/review-6.webp", alt: "Tilly", stars: 5,
    quote: "We came back for Tilly six months after doing our first reading for Pip. Pip's is framed in the hallway and I still notice new lines in it when I am putting my shoes on, especially the bit about his Moon softening with age. Tilly's felt different in exactly the way she is different: steadier, slower, still checking every room for us...",
    attr: "Sarah K. · Tilly, chocolate Labrador",
  },
} as const;

const CHARITY_LABELS: Record<DossierCharity, string> = {
  "ifaw": "IFAW",
  "world-land-trust": "World Land Trust",
  "eden-reforestation": "Eden Reforestation",
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function longBornLabel(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return "";
  const month = MONTHS[Number(m[2]) - 1];
  if (!month) return "";
  return `${Number(m[3])} ${month} ${m[1]}`;
}

/** Pet identity persisted by BirthSkyJourney when the free chart computes. */
function readChartPet(): { name: string; date: string } | null {
  try {
    const raw = sessionStorage.getItem("ls_chart_pet");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { name?: string | null; date?: string | null };
    return { name: (parsed.name || "").trim(), date: parsed.date || "" };
  } catch {
    return null;
  }
}

/** Computed signs persisted by BirthSkyJourney — feeds the lit five + the sample excerpt. */
type ChartSigns = {
  sun?: string | null; moon?: string | null; venus?: string | null;
  mercury?: string | null; mars?: string | null;
  saturn?: string | null; chiron?: string | null;
};
function readChartSigns(): ChartSigns | null {
  try {
    const raw = sessionStorage.getItem("ls_chart_signs");
    return raw ? (JSON.parse(raw) as ChartSigns) : null;
  } catch {
    return null;
  }
}

/** First sentence stays readable; the rest is what the seal holds. */
function splitExcerpt(line: string): { open: string; sealed: string } {
  const m = /^(.*?[.!?])\s+(.+)$/.exec(line);
  return m ? { open: m[1], sealed: m[2] } : { open: line, sealed: "" };
}

/** The email the visitor already kept at the free-reading gate (or wheel). */
function readKeptEmail(): string {
  try {
    return sessionStorage.getItem("ls_wheel_email") || sessionStorage.getItem("ls_chart_email") || "";
  } catch {
    return "";
  }
}

function Stars({ count, label }: { count: number; label: string }) {
  return (
    <div className="dsr-stars" role="img" aria-label={label}>
      {[0, 1, 2, 3, 4].map((i) =>
        i < count ? (
          <svg key={i} aria-hidden="true"><use href="#dsr-star" /></svg>
        ) : (
          <svg key={i} className="off" aria-hidden="true"><use href="#dsr-star-o" /></svg>
        )
      )}
    </div>
  );
}

function Review({
  kind,
  variant,
}: {
  kind: keyof typeof REVIEWS;
  variant: "compact" | "room" | "mini";
}) {
  const r = REVIEWS[kind];
  const cls = variant === "room" ? "dsr-review dsr-review--room" : variant === "mini" ? "dsr-review dsr-review--p dsr-review--mini" : "dsr-review dsr-review--p";
  return (
    <figure className={cls}>
      <span className="dsr-rev-ph">
        <img src={r.img} alt={r.alt} width={640} height={640} loading="lazy" decoding="async" />
      </span>
      <Stars count={r.stars} label={r.stars === 5 ? "Five stars" : "Four stars out of five"} />
      <q>{r.quote}</q>
      <figcaption className="dsr-attr">{r.attr}</figcaption>
    </figure>
  );
}

function Chevron() {
  return (
    <svg className="dsr-arrow" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 8l5 5 5-5" stroke="#9b8fd0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DossierCheckout(props: DossierCheckoutProps) {
  const {
    ctaLabel, fmt, horoscopeMonthly, unitNow, unitWas, finalPrice, discountRate,
    isLocalized, currencyCode, bond, qty, onBondChange, onQtyChange,
    email, onEmailChange, error, isLoading, onCheckout,
    codeOpen, onCodeOpen, codeInput, onCodeInput, codeStatus, codeError,
    appliedCoupon, onApplyCode, onRemoveCoupon, couponDiscountAmount,
    selectedCharity, onCharityChange, onTrack,
  } = props;

  const reduce = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  /* pet identity from the free reading (name optional, date required) */
  const [pet, setPet] = useState<{ name: string; date: string } | null>(() => readChartPet());
  useEffect(() => {
    const onPet = () => setPet(readChartPet());
    window.addEventListener("ls-chart-pet", onPet);
    return () => window.removeEventListener("ls-chart-pet", onPet);
  }, []);
  const petName = pet?.name || "";
  const bornLabel = pet?.date ? longBornLabel(pet.date) : "";
  const hasChart = !!pet?.date;

  /* computed signs → sign leads on the lit five, plus one honest sample line
     from a placement still sealed. Saturn first (top locked row), Chiron as
     the fallback — never a placement the free deck already gave. Nothing
     renders when no chart has been computed — the excerpt is never generic. */
  const [signs, setSigns] = useState<ChartSigns | null>(() => readChartSigns());
  useEffect(() => {
    const onSigns = () => setSigns(readChartSigns());
    window.addEventListener("ls-chart-signs", onSigns);
    return () => window.removeEventListener("ls-chart-signs", onSigns);
  }, []);
  const excerpt = useMemo(() => {
    if (!signs) return null;
    if (signs.saturn && SIGN_LINES.saturn?.[signs.saturn]) {
      return { ico: "g-saturn", name: "Saturn", frame: "What they fear, and what steadies them.", ...splitExcerpt(SIGN_LINES.saturn[signs.saturn]) };
    }
    if (signs.chiron && SIGN_LINES.chiron?.[signs.chiron]) {
      return { ico: "g-chiron", name: "Chiron", frame: "What they carry from before you.", ...splitExcerpt(SIGN_LINES.chiron[signs.chiron]) };
    }
    return null;
  }, [signs]);

  /* email already kept at the free-reading gate → confirmation row with a
     Change affordance instead of an empty field to re-type. */
  const [keptEmail, setKeptEmail] = useState<string>(() => readKeptEmail());
  const [emailEditing, setEmailEditing] = useState(false);
  useEffect(() => {
    const onKept = () => setKeptEmail(readKeptEmail());
    window.addEventListener("ls-chart-email", onKept);
    return () => window.removeEventListener("ls-chart-email", onKept);
  }, []);
  const emailKept =
    !emailEditing &&
    !!email.trim() &&
    !!keptEmail &&
    email.trim().toLowerCase() === keptEmail.trim().toLowerCase() &&
    /.+@.+\..+/.test(email.trim());

  /* daybreak: light the wheel + rung when the holder enters the viewport */
  const [lit, setLit] = useState(false);
  const wheelHolderRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = wheelHolderRef.current;
    if (!el) return;
    if (reduce || !("IntersectionObserver" in window)) { setLit(true); return; }
    const io = new IntersectionObserver(
      ([en]) => { if (en.isIntersecting) { setLit(true); io.disconnect(); } },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  /* SEAM — wheel travel into the dossier. A true shared element across a
     ~2500px seam is too invasive, so the wheel ARRIVES here in the exact
     entrance grammar of the reveal wheel above (scale .92, -8deg, settling
     to rest): a matched-position crossfade. Scroll-scrubbed, so it holds
     both for the animated descent and for a manual scroll. */
  useEffect(() => {
    const el = wheelHolderRef.current;
    if (!el || reduce || typeof window === "undefined") return;
    const tween = gsap.fromTo(
      el,
      { y: 52, scale: 0.92, rotate: -8, opacity: 0.2 },
      {
        y: 0, scale: 1, rotate: 0, opacity: 1, ease: "none",
        scrollTrigger: { trigger: el, start: "top 98%", end: "top 52%", scrub: 1 },
      }
    );
    /* the evidence/seal grid changes this section's height on desktop —
       re-measure every trigger on the page against the final layout */
    const refreshT = window.setTimeout(() => ScrollTrigger.refresh(), 150);
    return () => {
      window.clearTimeout(refreshT);
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reduce]);

  /* kicker flash when a locked row is tapped.
     Desktop (>=1024px): the seal panel's price is already on screen, so the
     tap never scrolls — the price moment takes one soft pulse instead.
     Mobile keeps the smooth scroll to the price. Both echo the tap on the
     wheel: the matching dim glyph pulses once (600ms). Reduced motion:
     kicker text change only (aria-live announces). */
  const kickerHome = petName
    ? `How deeply do you want to know ${petName}?`
    : "How deeply do you want to know them?";
  const [kicker, setKicker] = useState<string | null>(null);
  const kickerTimer = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const priceRowRef = useRef<HTMLDivElement>(null);
  const flashPlacement = useCallback((name: string) => {
    setKicker(petName ? `${petName}. ${name} still unread.` : `${name}. Still unread.`);
    if (kickerTimer.current) window.clearTimeout(kickerTimer.current);
    kickerTimer.current = window.setTimeout(() => setKicker(null), 1800);
    if (!reduce) {
      const glyph = rootRef.current?.querySelector(`[data-glyph="${name}"]`);
      if (glyph) {
        glyph.classList.remove("echo");
        // restart the one-shot animation on repeat taps
        window.requestAnimationFrame(() => glyph.classList.add("echo"));
        window.setTimeout(() => glyph.classList.remove("echo"), 700);
      }
    }
    const desktop = typeof window !== "undefined" && window.matchMedia("(min-width:1024px)").matches;
    if (desktop) {
      const row = priceRowRef.current;
      if (row && !reduce) {
        row.classList.remove("pulse");
        window.requestAnimationFrame(() => row.classList.add("pulse"));
        window.setTimeout(() => row.classList.remove("pulse"), 700);
      }
    } else {
      priceRowRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    }
    onTrack("v2_dossier_row_tapped", { placement: name });
  }, [petName, reduce, onTrack]);
  useEffect(() => () => { if (kickerTimer.current) window.clearTimeout(kickerTimer.current); }, []);

  /* PRICE SETTLE — once, when the price moment is 60% on screen: the
     was-price strike draws left→right, then the price blooms in. Latched
     via data-settled so it never replays. The CTA's gold-thread swell only
     begins AFTER the settle completes: the page's last moving light follows
     the number, never precedes it. Reduced motion: settled at rest. */
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (settled) return;
    const el = priceRowRef.current;
    if (!el) return;
    if (reduce || !("IntersectionObserver" in window)) { setSettled(true); return; }
    const io = new IntersectionObserver(
      ([en]) => { if (en.isIntersecting) { setSettled(true); io.disconnect(); } },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce, settled]);
  const [thread, setThread] = useState(false);
  useEffect(() => {
    if (!settled) return;
    if (reduce) { setThread(true); return; }
    const t = window.setTimeout(() => setThread(true), 900); // strike 420ms + bloom 480ms
    return () => window.clearTimeout(t);
  }, [settled, reduce]);

  /* seal panel entrance (desktop, once): rises 18px as the section enters */
  const sealRef = useRef<HTMLElement>(null);
  const [sealIn, setSealIn] = useState(false);
  useEffect(() => {
    const el = sealRef.current;
    if (!el) return;
    if (reduce || !("IntersectionObserver" in window)) { setSealIn(true); return; }
    const io = new IntersectionObserver(
      ([en]) => { if (en.isIntersecting) { setSealIn(true); io.disconnect(); } },
      { rootMargin: "0px 0px -15% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  /* price roll (29 → 49) when Soul Bond toggles */
  const [nowShown, setNowShown] = useState(unitNow);
  const [wasShown, setWasShown] = useState(unitWas);
  const rollRaf = useRef<number>(0);
  useEffect(() => {
    if (reduce) { setNowShown(unitNow); setWasShown(unitWas); return; }
    const fromNow = nowShown, fromWas = wasShown;
    if (fromNow === unitNow && fromWas === unitWas) return;
    const t0 = performance.now();
    const DUR = 500;
    const step = (ts: number) => {
      const k = Math.min(1, (ts - t0) / DUR);
      const e = 1 - Math.pow(1 - k, 3);
      setNowShown(Math.round((fromNow + (unitNow - fromNow) * e) / 100) * 100);
      setWasShown(Math.round((fromWas + (unitWas - fromWas) * e) / 100) * 100);
      if (k < 1) rollRaf.current = requestAnimationFrame(step);
    };
    cancelAnimationFrame(rollRaf.current);
    rollRaf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rollRaf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitNow, unitWas, reduce]);

  /* sticky bottom bar (mobile only, <1024px — desktop's sticky seal panel
     already keeps price + button on screen): shows WHILE INSIDE the section
     with the real CTA out of view — dossier card scrolled past the top,
     section bottom still below the fold — and hides the moment the real
     CTA enters. */
  const ctaRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (emailEditing) emailRef.current?.focus({ preventScroll: true });
  }, [emailEditing]);
  const [stickyOn, setStickyOn] = useState(false);
  useEffect(() => {
    const cta = ctaRef.current;
    const card = cardRef.current;
    const root = rootRef.current;
    if (!cta || !card || !root) return;
    let ctaVis = false;
    const update = () => {
      if (!window.matchMedia("(max-width:1023px)").matches) { setStickyOn(false); return; }
      const cardTop = card.getBoundingClientRect().top;
      const rootBottom = root.getBoundingClientRect().bottom;
      setStickyOn(!ctaVis && cardTop < 0 && rootBottom > window.innerHeight);
    };
    let io: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(([en]) => { ctaVis = en.isIntersecting; update(); }, { threshold: 0 });
      io.observe(cta);
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => {
      io?.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  const stickyCheckout = () => {
    if (!email.trim() || !email.includes("@")) {
      emailRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      window.setTimeout(() => emailRef.current?.focus({ preventScroll: true }), reduce ? 0 : 450);
      return;
    }
    onCheckout();
  };

  const toggleBond = (checked: boolean) => {
    onBondChange(checked);
    onTrack("v2_dossier_bond_toggled", { bond: checked, qty });
  };

  /* wheel geometry (memoised — pure trig, THIRTEEN_ORDER angles) */
  const placements = getPlacements();
  const wheel = useMemo(() => {
    const ticks: { x1: number; y1: number; x2: number; y2: number; cusp: boolean }[] = [];
    for (let d = 0; d < 360; d += 5) {
      const cusp = d % 30 === 0;
      const p1 = pt(d, 128), p2 = pt(d, cusp ? 120 : 124);
      ticks.push({ x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1], cusp });
    }
    const litPts = placements.filter((p) => p.lit).map((p) => pt(p.a, 90));
    const chords = litPts.map((a, i) => {
      const b = litPts[(i + 1) % litPts.length];
      return { x1: a[0], y1: a[1], x2: b[0], y2: b[1] };
    });
    const glyphs = placements.map((p, idx) => {
      const g = pt(p.a, 111);
      const l = pt(p.a, 143);
      const lrad = ((p.a - 90) * Math.PI) / 180;
      const cosA = Math.cos(lrad), sinA = Math.sin(lrad);
      const anchor = cosA > 0.2 ? "start" : cosA < -0.2 ? "end" : "middle";
      const dy = sinA > 0.6 ? 9 : sinA < -0.6 ? -1 : 3;
      return { ...p, gx: g[0], gy: g[1], lx: l[0], ly: l[1] + dy, anchor, delay: 0.45 + idx * 0.06 };
    });
    return { ticks, chords, glyphs };
  }, [placements]);

  const totalLabel = fmt(finalPrice);
  const ctaText = `${ctaLabel} · ${totalLabel}`;
  const savingPct = Math.round(discountRate * 100);
  const wheelAria = petName
    ? `${petName}'s natal wheel. Sun, Moon, Venus, Mercury and Mars are lit. Eight placements are still unread.`
    : "A natal wheel. Sun, Moon, Venus, Mercury and Mars are lit. Eight placements are still unread.";

  return (
    <div className={`dsr-root${lit ? " is-lit" : ""}${bond ? " is-bond" : ""}`} ref={rootRef}>
      <DossierStyles />

      {/* glyph sprite: violet gradient + thirteen drawn placements + review star */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          <linearGradient id="dsr-mgold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#cfc0f4" /><stop offset=".5" stopColor="#8f6de0" /><stop offset="1" stopColor="#6a4cc4" />
          </linearGradient>
          {/* STAR GOLD — Danny's ONE gold exception (2026-07-16). Review-star
              FILLS + their drop-shadow only; never borders, text, CTAs, or
              engraving. ~177deg. Same recipe as ls-star-gold. */}
          <linearGradient id="dsr-stargold" x1="0" y1="0" x2="0.052" y2="1">
            <stop offset="0" stopColor="#e8cf8f" /><stop offset=".55" stopColor="#c4a265" /><stop offset="1" stopColor="#9a7b4f" />
          </linearGradient>
          <symbol id="g-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.2" /><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" /></symbol>
          <symbol id="g-moon" viewBox="0 0 24 24"><path d="M14.8 3.5A8.5 8.5 0 1 0 14.8 20.5 10.5 10.5 0 0 1 14.8 3.5Z" /></symbol>
          <symbol id="g-mercury" viewBox="0 0 24 24"><path d="M8.5 2.2a3.5 3.5 0 0 0 7 0" /><circle cx="12" cy="9.5" r="3.8" /><path d="M12 13.3v7.2M8.8 17.2h6.4" /></symbol>
          <symbol id="g-venus" viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="5" /><path d="M12 13.5V21M9 17.5h6" /></symbol>
          <symbol id="g-mars" viewBox="0 0 24 24"><circle cx="10" cy="14" r="5.5" /><path d="m13.9 10.1 5.6-5.6M14.8 4.5h4.7v4.7" /></symbol>
          <symbol id="g-jupiter" viewBox="0 0 24 24"><path d="M5 7.5c0-3 4.5-4.5 6.5-1.8 1.8 2.5-1 5.4-6.8 9.8M4.5 15.5h15M14.5 10v11" /></symbol>
          <symbol id="g-saturn" viewBox="0 0 24 24"><path d="M8.5 3v13.5M5.5 6.8h6M8.5 11.5c2-2.5 6-2 6.5 1 .4 2.7-2 4.6-3.3 6.5-.7 1.1.1 2.4 1.6 2" /></symbol>
          <symbol id="g-uranus" viewBox="0 0 24 24"><path d="M7.5 3.5v9M16.5 3.5v9M7.5 8h9M12 8v7" /><circle cx="12" cy="18" r="2.7" /><circle cx="12" cy="18" r=".9" fill="currentColor" stroke="none" /></symbol>
          <symbol id="g-neptune" viewBox="0 0 24 24"><path d="M6.5 4.5v4a5.5 5.5 0 0 0 11 0v-4M12 4v16.5M8.8 17.5h6.4" /></symbol>
          <symbol id="g-pluto" viewBox="0 0 24 24"><circle cx="12" cy="7.2" r="2.4" /><path d="M6.5 5v2.2a5.5 5.5 0 0 0 11 0V5M12 12.7V20.5M9 17h6" /></symbol>
          <symbol id="g-chiron" viewBox="0 0 24 24"><circle cx="12" cy="17.5" r="3.5" /><path d="M12 14V4M12 8.5l4.5-4.2M12 8.5l4.5 4" /></symbol>
          <symbol id="g-node" viewBox="0 0 24 24"><circle cx="6.8" cy="17.6" r="2.4" /><circle cx="17.2" cy="17.6" r="2.4" /><path d="M5.6 15.6C4.5 8.8 7.6 4.5 12 4.5s7.5 4.3 6.4 11.1" /></symbol>
          <symbol id="g-lilith" viewBox="0 0 24 24"><path d="M14.4 3.6A5.4 5.4 0 1 0 14.4 13.4 6.6 6.6 0 0 1 14.4 3.6Z" /><path d="M12 13.5V21M9 17.5h6" /></symbol>
          <symbol id="dsr-check" viewBox="0 0 24 24"><path d="M4.5 12.6l5.2 5.2L19.5 6.6" /></symbol>
          <symbol id="dsr-star" viewBox="0 0 24 24"><path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9z" fill="url(#dsr-stargold)" stroke="none" /></symbol>
          <symbol id="dsr-star-o" viewBox="0 0 24 24"><path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></symbol>
        </defs>
      </svg>

      {/* ── EVIDENCE — their chart, the ledger, one voice, the bump ── */}
      <div className="dsr-evidence">

      {/* ── their chart, half-lit ── */}
      <div className="dsr-wheel-holder" ref={wheelHolderRef}>
        <svg className="dsr-wheel" viewBox="0 0 340 340" role="img" aria-label={wheelAria}>
          {/* Soul Bond second orbit — draws on check */}
          <circle className="dsr-bond-ring" cx={CX} cy={CY} r={150} pathLength={1} transform={`rotate(-90 ${CX} ${CY})`} />
          <circle className="dsr-ring" cx={CX} cy={CY} r={128} pathLength={1} transform={`rotate(-90 ${CX} ${CY})`} />
          <circle className="dsr-ring inner" cx={CX} cy={CY} r={94} pathLength={1} transform={`rotate(-90 ${CX} ${CY})`} />
          <g>
            {wheel.ticks.map((t, i) => (
              <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} className={t.cusp ? "dsr-tick cusp" : "dsr-tick"} />
            ))}
          </g>
          <g>
            {wheel.chords.map((c, i) => (
              <line key={i} x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} className="dsr-chord" pathLength={1} />
            ))}
          </g>
          <g>
            {wheel.glyphs.map((g) => (
              <g key={g.name}>
                {g.lit && <circle cx={g.gx} cy={g.gy} r={12} className="dsr-glyph-halo" />}
                <g className={`dsr-wglyph ${g.lit ? "lit" : "dim"}`} data-glyph={g.name} style={{ transitionDelay: `${g.delay}s` }}>
                  <use href={`#${g.ico}`} x={g.gx - (g.lit ? 8.5 : 7.5)} y={g.gy - (g.lit ? 8.5 : 7.5)} width={g.lit ? 17 : 15} height={g.lit ? 17 : 15} />
                </g>
                <text x={g.lx} y={g.ly} className={`dsr-wlabel ${g.lit ? "lit" : "dim"}`} style={{ textAnchor: g.anchor as "start" | "end" | "middle" }}>
                  {g.name}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>

      {/* ── handoff (free-reading cohort only) ── */}
      {hasChart && (
        <p className="dsr-handoff">You have met five placements. Eight are still unread. Then what all thirteen mean between you.</p>
      )}

      {/* ── the ledger card ── */}
      <section className="dsr-card" aria-label="Soul Reading" ref={cardRef}>
        <p className="dsr-eyebrow dsr-kicker" aria-live="polite" data-flash={kicker ? "" : undefined}>
          {kicker ?? kickerHome}
        </p>

        {hasChart && (
          <p className="dsr-headline">
            {petName ? `${petName}. ` : ""}Born under <strong>thirteen</strong> placements. You have met <strong>five</strong>.
          </p>
        )}

        <h3 className="dsr-tier">Soul Reading</h3>
        <p className="dsr-tier-line"><em>For the little soul in front of you.</em></p>

        <ul className="dsr-bullets">
          <li>
            <svg className="dsr-gico lit" aria-hidden="true"><use href="#g-sun" /></svg>
            <span>
              {signs?.sun && <span className="dsr-bsign">Sun in {signs.sun}. </span>}
              <strong>What lights them up</strong>, and why it looks nothing like what lights you up.
            </span>
          </li>
          <li>
            <svg className="dsr-gico lit" aria-hidden="true"><use href="#g-moon" /></svg>
            <span>
              {signs?.moon && <span className="dsr-bsign">Moon in {signs.moon}. </span>}
              <strong>What they need when the world gets loud</strong>, and how to give it without asking.
            </span>
          </li>
          <li>
            <svg className="dsr-gico lit" aria-hidden="true"><use href="#g-venus" /></svg>
            <span>
              {signs?.venus && <span className="dsr-bsign">Venus in {signs.venus}. </span>}
              <strong>How they&rsquo;ve already chosen you back</strong>, in a way you&rsquo;d never think to look for.
            </span>
          </li>
          <li>
            <svg className="dsr-gico lit" aria-hidden="true"><use href="#g-mercury" /></svg>
            <span>
              {signs?.mercury && <span className="dsr-bsign">Mercury in {signs.mercury}. </span>}
              <strong>How they read you.</strong>
            </span>
          </li>
          <li>
            <svg className="dsr-gico lit" aria-hidden="true"><use href="#g-mars" /></svg>
            <span>
              {signs?.mars && <span className="dsr-bsign">Mars in {signs.mars}. </span>}
              <strong>What they chase, and why.</strong>
            </span>
          </li>
        </ul>

        {/* endowed rung — free-reading cohort only, never on memorial */}
        {hasChart && (
          <>
            <div className="dsr-rung" aria-hidden="true">
              {placements.map((p, i) => (
                <i key={p.name} className={i < 5 ? "on" : undefined} style={{ transitionDelay: `${0.5 + i * 0.05}s` }} />
              ))}
            </div>
            <p className="dsr-rung-line">Five of thirteen, yours already.</p>
          </>
        )}

        {/* eight locked rows — the deck's tease ledger, named, never blurred */}
        <ul className="dsr-rows">
          {placements.filter((p) => !p.lit).map((p) => (
            <li key={p.name}>
              <button
                type="button"
                className="dsr-lrow"
                aria-label={`${p.name}. ${p.frame} Still unread. Go to the price.`}
                onClick={() => flashPlacement(p.name)}
              >
                <svg className="dsr-gico" aria-hidden="true"><use href={`#${p.ico}`} /></svg>
                <span><span className="nm">{p.name}.</span> <span className="fr">{p.frame}</span></span>
                <svg className="dsr-chev" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M8 5l5 5-5 5" stroke="#9b8fd0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>

        {/* the rising, honest — not one of the thirteen. Same line as
            FullReadingOpens: it turns on the exact minute, which a date-only
            chart cannot fix. */}
        <p className="dsr-rising">And the rising, the first face they show. It turns on the exact minute they arrived.</p>

        {/* one honest sample from a sealed placement — built from THIS pet's
            computed chart (Saturn sign via ls_chart_signs), first sentence
            readable, the rest visibly held back under the seal. */}
        {hasChart && excerpt && (
          <figure className="dsr-excerpt">
            <figcaption className="dsr-eyebrow dsr-excerpt-eb">
              {petName ? `A line from ${petName}'s full reading` : "A line from their full reading"}
            </figcaption>
            <p className="dsr-excerpt-place">
              <svg className="dsr-gico" aria-hidden="true"><use href={`#${excerpt.ico}`} /></svg>
              <span><span className="nm">{excerpt.name}.</span> <span className="fr">{excerpt.frame}</span></span>
            </p>
            <blockquote className="dsr-excerpt-quote">
              <span className="open">{excerpt.open}</span>
              {excerpt.sealed && <span className="sealed" aria-hidden="true"> {excerpt.sealed}</span>}
            </blockquote>
            <p className="dsr-excerpt-note">The rest stays sealed until their reading opens.</p>
          </figure>
        )}

      </section>

      {/* ── ACT 2, THE COMPANY — one voice only. The full six-voice wall
          already ran 1,000px earlier (ReviewsWall); joy, gift and the
          returner live there, not at the register. ── */}
      <div className="dsr-act-hr" aria-hidden="true" />
      <Review kind="grief" variant="room" />

      {/* ── Soul Bond bump — second orbit, not a rival card ── */}
      <div className="dsr-act-hr" aria-hidden="true" />
      <label className="dsr-bond" htmlFor="dsr-bond-check">
        <input
          type="checkbox"
          id="dsr-bond-check"
          checked={bond}
          onChange={(e) => toggleBond(e.target.checked)}
        />
        <span className="box" aria-hidden="true">
          <svg viewBox="0 0 16 16" fill="none"><path d="M2.5 8.5l3.5 3.5L13.5 4" stroke="#14101e" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
        <span className="bt">
          <span className="dsr-bond-title">
            <svg className="dsr-bond-orbits" viewBox="0 0 28 16" aria-hidden="true">
              <circle cx="9" cy="8" r="5.6" /><circle cx="18" cy="8" r="5.6" />
            </svg>
            <b>Soul Bond.</b>
            <span className="dsr-bond-pill plus">+{fmt(props.bondDelta)}</span>
          </span>
          <span className="dsr-bond-body">Your chart beside theirs. Where you align, where you challenge each other, and why you found each other.</span>
          <span className="dsr-bond-badge">What most families add</span>
        </span>
      </label>

      </div>

      {/* ── THE SEAL — price, email, button: always within reach ── */}
      <aside className={`dsr-seal${sealIn ? " is-in" : ""}`} aria-label="Complete their reading" ref={sealRef}>
        <div className="dsr-seal-scroll">
        <p className="dsr-inscription dsr-gold-text">
          {petName && bornLabel ? `For ${petName}, born ${bornLabel}.` : "Inscribed with their name at checkout."}
        </p>

        {/* the price moment — the single largest numeral on the page */}
        <div className="dsr-price-moment">
          <div className="dsr-price-row" ref={priceRowRef} aria-live="polite" data-settled={settled ? "" : undefined}>
            <span className="dsr-was"><span>{fmt(wasShown)}</span><span className="strike" aria-hidden="true" /></span>
            <span className="dsr-now dsr-gold-text">{fmt(nowShown)}</span>
          </div>
          <p className="dsr-price-mod">One time. Yours forever.</p>
          {(qty > 1 || !!appliedCoupon) && (
            <p className="dsr-total-line">
              {qty > 1 ? `${qty} readings · ${savingPct}% off every one · ` : ""}
              {appliedCoupon ? `Code ${appliedCoupon.code} applied · ` : ""}
              <b>{totalLabel} total.</b>
            </p>
          )}
        </div>

        {/* the practical one, glued to the number it names */}
        <Review kind="practical" variant="mini" />

        {/* the open value stack — always visible at the price, never folded */}
        <ul className="dsr-stack" aria-label="What opens with their reading">
          <li>
            <svg className="dsr-stack-ck" aria-hidden="true"><use href="#dsr-check" /></svg>
            <span>All <strong>thirteen placements</strong>, opened and read in full</span>
          </li>
          <li>
            <svg className="dsr-stack-ck" aria-hidden="true"><use href="#dsr-check" /></svg>
            <span>The <strong>keepsake</strong>, made with their photo, yours forever</span>
          </li>
          <li>
            <svg className="dsr-stack-ck" aria-hidden="true"><use href="#dsr-check" /></svg>
            <span><strong>SoulSpeak</strong><span className="dsr-tag">New</span></span>
          </li>
          <li>
            <svg className="dsr-stack-ck" aria-hidden="true"><use href="#dsr-check" /></svg>
            <span>
              A month of <strong>weekly horoscopes</strong><span className="dsr-tag">Free</span>
              <span style={{ display: "block", fontSize: 13, opacity: 0.72, marginTop: 2, fontWeight: 400, lineHeight: 1.4 }}>
                First month free, then {fmt(horoscopeMonthly)}/mo, cancel anytime.
              </span>
            </span>
          </li>
          <li>
            <svg className="dsr-stack-ck" aria-hidden="true"><use href="#dsr-check" /></svg>
            <span><strong>Full refund</strong> if it does not feel like them</span>
          </li>
        </ul>

        {/* bond echo — only when Soul Bond is checked */}
        <p className="dsr-bond-echo" aria-hidden={!bond}>
          <span>Soul Bond added · +{fmt(props.bondDelta)}</span>
        </p>

        <div className="dsr-email-block">
          {emailKept ? (
            <>
              <p className="dsr-eyebrow">Where their reading opens</p>
              <div className="dsr-email-kept">
                <span className="addr">{email.trim()}</span>
                <button type="button" className="dsr-email-change" onClick={() => setEmailEditing(true)}>
                  Change
                </button>
              </div>
            </>
          ) : (
            <>
              <label className="dsr-eyebrow" htmlFor="dsr-email">Where their reading opens</label>
              <div className="dsr-field">
                <input
                  id="dsr-email"
                  ref={emailRef}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <button className={`dsr-cta${thread ? " is-thread" : ""}`} type="button" ref={ctaRef} onClick={onCheckout} disabled={isLoading}>
          {isLoading ? "Opening secure checkout..." : ctaText}
        </button>
        {error && <p className="dsr-error" role="alert">{error}</p>}

        <p className="dsr-guarantee">If the reading does not feel like them, we refund every cent.</p>

        {/* quiet footer — 70% presence, everything administrative */}
        <div className="dsr-quiet">

        {/* promo code, demoted below the CTA */}
        <div className="dsr-code">
          {!codeOpen && !appliedCoupon && (
            <button type="button" className="dsr-code-link" onClick={onCodeOpen}>Have a promo or gift code?</button>
          )}
          {codeOpen && !appliedCoupon && (
            <div className="dsr-code-row">
              <div className="dsr-field">
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => onCodeInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onApplyCode(); } }}
                  placeholder="Enter code"
                  aria-label="Promo or gift code"
                />
              </div>
              <button type="button" className="dsr-code-apply" onClick={onApplyCode} disabled={codeStatus === "checking" || !codeInput.trim()}>
                {codeStatus === "checking" ? "Checking" : "Apply"}
              </button>
            </div>
          )}
          {appliedCoupon && (
            <p className="dsr-code-applied">
              Code <b>{appliedCoupon.code}</b> applied, saving {fmt(couponDiscountAmount)}.
              <button type="button" className="dsr-code-link" onClick={onRemoveCoupon}>Remove</button>
            </p>
          )}
          {codeError && <p className="dsr-error">{codeError}</p>}
        </div>

        <details className="dsr-details last">
          <summary>More than one little soul?<Chevron /></summary>
          <div className="dsr-disc-body">
            <div className="dsr-stepper">
              <button type="button" aria-label="One fewer reading" onClick={() => { if (qty > 1) onQtyChange(qty - 1); }}>&#8722;</button>
              <span className="qty">{qty} {qty === 1 ? "reading" : "readings"}</span>
              <button type="button" aria-label="One more reading" onClick={() => { if (qty < 10) onQtyChange(qty + 1); }}>+</button>
            </div>
            <p className="dsr-saving-line">
              {qty === 1 ? (
                <>Add their siblings here. Two readings save <b>15%</b>, three save <b>20%</b>, four save <b>25%</b>, five or more save <b>30%</b>.</>
              ) : (
                <>{qty} readings · <b>{savingPct}% off</b> every one · {totalLabel} total.</>
              )}
            </p>
          </div>
        </details>

        {/* refund lives in exactly two places (stack item + guarantee line) —
            never a third repeat here */}
        <div className="dsr-trust-line">
          <span>Secure checkout</span>
          <span>Ready in minutes</span>
        </div>

        {isLocalized && (
          <p className="dsr-fx-note">Billed in {currencyCode}. Exactly the price shown.</p>
        )}

        <div className="dsr-pay-row" aria-label="Payment methods">
          <span className="dsr-pay-chip">
            <svg viewBox="0 0 72 32" role="img" aria-label="Visa" xmlns="http://www.w3.org/2000/svg">
              <g transform="skewX(-10) translate(9,0)" fill="#1434CB" fillRule="evenodd">
                <path d="M0 6H5.2L8 18.6 10.8 6H16L10 26H6Z" />
                <path d="M19 6h5v20h-5z" />
                <path d="M42 26 48.6 6h5L60 26h-5.4l-1-3.4h-6.4l-1 3.4Zm6.5-7.6 1.9-6.4 2 6.4Z" />
              </g>
              <g transform="skewX(-10) translate(9,0)">
                <path d="M38 9.2C35.5 6.8 29.5 6.6 28.6 10.4 27.7 14.2 38.3 14 37.4 19.6 36.7 23.9 30 24.6 27.2 22" fill="none" stroke="#1434CB" strokeWidth="4.6" />
              </g>
            </svg>
          </span>
          <span className="dsr-pay-chip">
            <svg viewBox="0 0 48 30" role="img" aria-label="Mastercard" xmlns="http://www.w3.org/2000/svg">
              <circle cx="17" cy="15" r="14" fill="#EB001B" />
              <circle cx="31" cy="15" r="14" fill="#F79E1B" />
              <path d="M24 2.88A14 14 0 0 1 24 27.12 14 14 0 0 1 24 2.88Z" fill="#FF5F00" />
            </svg>
          </span>
          <span className="dsr-pay-chip">
            <svg viewBox="0 0 48 32" role="img" aria-label="American Express" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="32" rx="5" fill="#006FCF" />
              <g stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="butt">
                <path d="M5.5 22 9.5 10l4 12M6.9 17.6h5.2" />
                <path d="M17 22V10l4 7 4-7v12" />
                <path d="M34 10h-6v12h6M28 16h5" />
                <path d="m37.5 10 7 12m0-12-7 12" />
              </g>
            </svg>
          </span>
          <span className="dsr-pay-chip dsr-pay-chip--dark">
            <svg viewBox="0 0 58 26" role="img" aria-label="Apple Pay" xmlns="http://www.w3.org/2000/svg">
              <g fill="#fff">
                <path d="M14.6 7.7c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.5.6-1 1.6-.9 2.6 1 .1 2.1-.5 2.6-1.2z" />
                <path d="M17.3 14.4c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.7-3.1.7-.6 0-1.6-.7-2.7-.7-1.4 0-2.7.8-3.4 2-1.5 2.5-.4 6.3 1 8.4.7 1 1.5 2.1 2.6 2.1 1 0 1.4-.7 2.7-.7s1.6.7 2.7.7c1.1 0 1.8-1 2.5-2 .8-1.2 1.1-2.3 1.1-2.4 0 0-2.2-.8-2.2-3.3z" />
              </g>
              <g fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M27 20.5V6.5h4.2a4.1 4.1 0 0 1 0 8.2H27" />
                <circle cx="39" cy="15.4" r="4" /><path d="M43 11.4v9.1" />
                <path d="m47 11.4 3.4 8.6M54 11.4l-4.6 11.6c-.5 1.3-1.4 2-2.7 2" />
              </g>
            </svg>
          </span>
          <span className="dsr-pay-chip">
            <svg viewBox="0 0 62 26" role="img" aria-label="Google Pay" xmlns="http://www.w3.org/2000/svg">
              <g transform="translate(1,1)">
                <path fill="#4285F4" d="M23.06 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h6.2a5.3 5.3 0 0 1-2.3 3.48v2.88h3.72c2.18-2 3.44-4.96 3.44-8.37z" />
                <path fill="#34A853" d="M12 24c3.11 0 5.72-1.03 7.62-2.79l-3.72-2.88c-1.03.69-2.35 1.1-3.9 1.1-3 0-5.54-2.03-6.45-4.75H1.7v2.97A11.5 11.5 0 0 0 12 24z" />
                <path fill="#FBBC05" d="M5.55 14.68a6.9 6.9 0 0 1 0-4.36V7.35H1.7a11.5 11.5 0 0 0 0 10.3l3.85-2.97z" />
                <path fill="#EA4335" d="M12 4.77c1.69 0 3.21.58 4.4 1.72l3.3-3.3C17.71 1.19 15.1 0 12 0 7.5 0 3.6 2.58 1.7 6.35l3.85 2.97C6.46 6.8 9 4.77 12 4.77z" />
              </g>
              <g fill="none" stroke="#5F6368" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M31 20.5V6.5h4.2a4.1 4.1 0 0 1 0 8.2H31" />
                <circle cx="43" cy="15.4" r="4" /><path d="M47 11.4v9.1" />
                <path d="m51 11.4 3.4 8.6M58 11.4l-4.6 11.6c-.5 1.3-1.4 2-2.7 2" />
              </g>
            </svg>
          </span>
        </div>

        <details className="dsr-details dsr-charity">
          <summary>
            <span>10% of your reading goes to <span className="cname">{CHARITY_LABELS[selectedCharity]}</span></span>
            <Chevron />
          </summary>
          <div className="dsr-charity-opts" role="radiogroup" aria-label="Choose a charity">
            {(Object.keys(CHARITY_LABELS) as DossierCharity[]).map((id) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={selectedCharity === id}
                aria-pressed={selectedCharity === id}
                onClick={() => onCharityChange(id)}
              >
                {CHARITY_LABELS[id]}
              </button>
            ))}
          </div>
        </details>

        </div>
        </div>
      </aside>

      {/* sticky CTA — mobile only: inside the section, real CTA out of view */}
      <div className={`dsr-sticky${stickyOn ? " show" : ""}`} aria-hidden={!stickyOn}>
        <button className="dsr-cta" type="button" tabIndex={stickyOn ? 0 : -1} onClick={stickyCheckout} disabled={isLoading}>
          {isLoading ? "Opening secure checkout..." : ctaText}
        </button>
      </div>
    </div>
  );
}

/* ── styles — ported from mockups/pricing-winner-v2.html, scoped under .dsr- ── */
function DossierStyles(): ReactNode {
  return (
    <style>{`
      .dsr-root{
        --dsr-gold-100:#cbb8f5; --dsr-gold-200:#bfadf0; --dsr-gold-300:#ab90e6;
        --dsr-gold-400:#9a7ee6; --dsr-gold-500:#8266d9; --dsr-gold-600:#6a4cc4; --dsr-gold-700:#4d3694;
        --dsr-gold-ink:#ffffff;
        --dsr-gold-metal:linear-gradient(180deg,#a78bfa 0%,#9a7ee6 18%,#8266d9 40%,#7452c8 56%,#6243b0 80%,#47307f 100%);
        --dsr-gold-metal-text:linear-gradient(177deg,#cfc0f4 0%,#b9a5f0 24%,#9a7ee6 48%,#8266d9 74%,#b9a5f0 100%);
        --dsr-gold-sheen:linear-gradient(105deg,transparent 42%,rgba(255,255,255,.35) 50%,transparent 58%);
        --dsr-violet-100:#e8e4f6; --dsr-violet-200:#cfc7ec; --dsr-violet-300:#b3a7e0;
        --dsr-violet-400:#9b8fd0; --dsr-violet-500:#8b7bd8; --dsr-violet-600:#6f62a8;
        /* STAR GOLD — Danny's ONE gold exception (approved 2026-07-16).
           Scope: review-star FILLS + their drop-shadow ONLY. Never borders,
           text, CTAs, or engraving. Anchored on approved email gold #c4a265.
           Off/empty stars stay muted violet. Mirrors C.starGold* in
           ReadingsLanding.tsx. */
        --dsr-star-gold-hi:#e8cf8f;
        --dsr-star-gold-mid:#c4a265;
        --dsr-star-gold-lo:#9a7b4f;
        --dsr-star-gold-glow:rgba(196,162,101,0.28);
        --dsr-cream:#ffffff; --dsr-cream-dim:#c6c0d8;
        --dsr-surface-1:#140f1e; --dsr-surface-2:#181226; --dsr-surface-3:#1f1830;
        --dsr-hairline:linear-gradient(90deg,transparent,rgba(139,123,216,.22) 20% 80%,transparent);
        --dsr-ease:cubic-bezier(.16,1,.3,1);
        --dsr-display:'Fraunces',Georgia,serif;
        --dsr-body:'Newsreader',Georgia,serif;
        position:relative;
        max-width:560px;margin:0 auto;
        padding:0 0 24px;
        color:var(--dsr-cream);
        font-family:var(--dsr-body);
        font-size:16.5px;line-height:1.55;
        font-variation-settings:'opsz' 16;
      }
      @media (min-width:768px){ .dsr-root{max-width:600px} }

      /* ---------- EVIDENCE / SEAL desktop grid ---------- */
      @media (min-width:1024px){
        .dsr-root{max-width:1080px;display:grid;
          grid-template-columns:minmax(0,1fr) 400px;column-gap:48px;align-items:start}
        .dsr-evidence{width:100%;max-width:600px;margin:0 auto;min-width:0}
      }
      /* act separators — mobile only; on desktop the columns chapter the page */
      .dsr-act-hr{height:1px;border:0;margin:40px 0;background:var(--dsr-hairline)}
      @media (min-width:1024px){ .dsr-act-hr{margin:24px 0;background:none} }

      .dsr-gold-text{
        color:#8f6de0;
        background:var(--dsr-gold-metal-text);
        -webkit-background-clip:text;background-clip:text;
        -webkit-text-fill-color:transparent;color:transparent;
        filter:drop-shadow(0 1px 6px rgba(154,126,230,.18));
      }

      /* ---------- natal wheel ---------- */
      .dsr-wheel-holder{display:flex;flex-direction:column;align-items:center;margin-bottom:8px}
      .dsr-wheel{width:min(64vw,210px);height:auto;display:block;overflow:visible;
        filter:drop-shadow(0 0 28px rgba(139,123,216,.14))}
      @media (min-width:768px){ .dsr-wheel{width:300px} }
      .dsr-ring{fill:none;stroke:rgba(139,123,216,.42);stroke-width:1;
        stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset 1.6s var(--dsr-ease)}
      .dsr-ring.inner{stroke:rgba(139,123,216,.28);transition-delay:.25s}
      .is-lit .dsr-ring{stroke-dashoffset:0}
      .dsr-tick{stroke:rgba(139,123,216,.30);stroke-width:1}
      .dsr-tick.cusp{stroke:rgba(139,123,216,.45);stroke-width:1.2}
      .dsr-chord{stroke:url(#dsr-mgold);stroke-opacity:.4;stroke-width:1;fill:none;
        stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset 1.4s var(--dsr-ease) .9s}
      .is-lit .dsr-chord{stroke-dashoffset:0}
      /* lit five at full presence, dim eight dropped to .34 — the half-lit
         story must read at a glance (the whole reason to buy) */
      .dsr-wglyph{fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;
        opacity:0;transition:opacity 1s var(--dsr-ease)}
      .dsr-wglyph.lit{stroke:#cfc0f4;color:#cfc0f4}
      .dsr-wglyph.dim{color:var(--dsr-violet-600)}
      .is-lit .dsr-wglyph.lit{opacity:1}
      .is-lit .dsr-wglyph.dim{opacity:.34}
      .dsr-wlabel{font-family:var(--dsr-body);font-weight:500;font-size:22px;letter-spacing:.07em;
        text-transform:uppercase;opacity:0;transition:opacity 1.1s var(--dsr-ease) .5s}
      .dsr-wlabel.lit{fill:#cfc0f4}
      .dsr-wlabel.dim{fill:var(--dsr-violet-400);font-size:17.5px;display:none}
      @media (min-width:768px){ .dsr-wlabel.dim{display:block} }
      .is-lit .dsr-wlabel{opacity:1}
      .is-lit .dsr-wlabel.dim{opacity:.5}
      /* row tap → wheel echo: the matching dim glyph answers once */
      .dsr-wglyph.dim.echo{animation:dsrGlyphEcho .6s var(--dsr-ease)}
      @keyframes dsrGlyphEcho{0%,100%{opacity:.34}45%{opacity:.9}}
      .dsr-glyph-halo{fill:none;stroke:url(#dsr-mgold);stroke-opacity:.4;stroke-width:1;
        opacity:0;transition:opacity 1.2s var(--dsr-ease) .7s}
      .is-lit .dsr-glyph-halo{opacity:1}
      .dsr-bond-ring{fill:none;stroke:url(#dsr-mgold);stroke-width:1.4;
        stroke-dasharray:1;stroke-dashoffset:1;opacity:.9;transition:stroke-dashoffset .6s var(--dsr-ease)}
      .is-bond .dsr-bond-ring{stroke-dashoffset:0}

      /* ---------- handoff ---------- */
      .dsr-handoff{font-size:19px;line-height:1.5;color:var(--dsr-cream);text-align:center;
        margin:30px auto 34px;max-width:30ch}

      /* ---------- the dossier card ---------- */
      .dsr-card{
        position:relative;border:0;border-radius:18px;
        padding:30px 22px 26px;
        background:
          radial-gradient(120% 60% at 50% 0%, rgba(139,123,216,.06), transparent 60%),
          linear-gradient(180deg,#181226 0%,#140f1e 100%);
        box-shadow:
          0 1px 2px rgba(0,0,0,.5),
          0 8px 24px rgba(0,0,0,.45),
          0 32px 80px rgba(0,0,0,.55),
          0 -14px 50px rgba(154,126,230,.05) inset,
          0 1px 0 rgba(185,165,240,.10) inset;
      }
      @media (min-width:768px){ .dsr-card{padding:38px 36px 32px} }
      .dsr-card::before{
        content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;
        background:linear-gradient(165deg, rgba(185,165,240,.55) 0%, rgba(154,126,230,.18) 30%, rgba(139,123,216,.14) 55%, rgba(154,126,230,.60) 100%);
        -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
        -webkit-mask-composite:xor;mask-composite:exclude;
      }

      .dsr-eyebrow{font-family:var(--dsr-body);font-size:13px;font-weight:500;
        letter-spacing:.18em;text-transform:uppercase;color:var(--dsr-violet-300)}
      .dsr-kicker{text-align:center;margin-bottom:12px;transition:color .4s var(--dsr-ease)}
      .dsr-kicker[data-flash]{color:var(--dsr-violet-100)}

      .dsr-inscription{font-family:var(--dsr-display);font-style:italic;
        font-variation-settings:'opsz' 40;font-weight:500;
        font-size:17px;text-align:center;margin-bottom:20px}

      .dsr-headline{font-family:var(--dsr-display);font-variation-settings:'opsz' 40;
        font-weight:500;font-size:26px;line-height:1.2;letter-spacing:-.01em;
        text-align:center;color:var(--dsr-cream);margin:0 auto 26px;max-width:17ch}
      .dsr-headline strong{font-weight:600}

      .dsr-tier{font-family:var(--dsr-display);font-variation-settings:'opsz' 72;
        font-size:40px;font-weight:500;line-height:1.05;text-align:center;
        color:var(--dsr-cream);letter-spacing:-.02em;margin:0 0 8px}
      @media (min-width:768px){ .dsr-tier{font-size:48px} }
      .dsr-tier-line{text-align:center;font-style:italic;font-size:17px;color:var(--dsr-cream);margin-bottom:26px}
      /* desktop: the ledger reads as a page, not a centered stack —
         only the kicker stays centered */
      @media (min-width:1024px){
        .dsr-headline{text-align:left;margin:0 0 26px;max-width:24ch}
        .dsr-tier{text-align:left}
        .dsr-tier-line{text-align:left}
      }

      /* ---------- outcome bullets ---------- */
      .dsr-bullets{list-style:none;margin:0 0 8px;padding:0 2px}
      .dsr-bullets li{display:flex;gap:13px;align-items:flex-start;padding:9px 0;
        font-size:16.5px;color:var(--dsr-cream)}
      .dsr-bullets .dsr-gico{flex:none;width:20px;height:20px;margin-top:3px}
      .dsr-bullets strong{font-weight:600}
      .dsr-bullets .dsr-bsign{font-weight:600;letter-spacing:.01em;color:var(--dsr-violet-300)}
      .dsr-gico{display:block;fill:none;stroke:currentColor;stroke-width:1.6;
        stroke-linecap:round;stroke-linejoin:round;color:var(--dsr-violet-500)}
      .dsr-gico.lit{stroke:url(#dsr-mgold);color:#8f6de0}

      /* ---------- endowed rung ---------- */
      .dsr-rung{display:flex;gap:9px;justify-content:center;align-items:center;margin:16px 0 8px}
      .dsr-rung i{width:7px;height:7px;border-radius:50%;background:var(--dsr-violet-600);display:block;
        transform:scale(.4);opacity:0;
        transition:transform .6s var(--dsr-ease),opacity .6s var(--dsr-ease)}
      .dsr-rung i.on{background:#cfc0f4;box-shadow:0 0 8px rgba(154,126,230,.6)}
      .is-lit .dsr-rung i{transform:scale(1);opacity:1}
      .dsr-rung-line{text-align:center;font-family:var(--dsr-display);font-style:italic;
        font-variation-settings:'opsz' 20;font-size:16px;color:var(--dsr-cream-dim);margin-bottom:22px}

      /* ---------- locked tease rows ---------- */
      .dsr-rows{list-style:none;margin:0 0 10px;padding:0}
      .dsr-rows li{position:relative;content-visibility:auto;contain-intrinsic-size:auto 64px}
      .dsr-rows li::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;border:0;
        background:linear-gradient(90deg,transparent,rgba(139,123,216,.22) 20% 80%,transparent)}
      .dsr-rows li:last-child::after{display:none}
      .dsr-lrow{display:flex;align-items:center;gap:14px;width:100%;text-align:left;
        background:none;border:0;padding:12px 4px;min-height:48px;
        font-family:var(--dsr-body);cursor:pointer;border-radius:8px;
        transition:background .3s var(--dsr-ease)}
      .dsr-lrow .dsr-gico{flex:none;width:20px;height:20px;opacity:.5}
      .dsr-lrow .nm{font-size:16px;font-weight:600;letter-spacing:.01em;color:var(--dsr-violet-300)}
      .dsr-lrow .fr{font-size:16px;color:var(--dsr-violet-400);font-style:italic}
      .dsr-chev{margin-left:auto;flex:none;width:18px;height:18px;opacity:.55}
      .dsr-lrow:active{background:var(--dsr-surface-3)}
      .dsr-rising{margin:0 0 26px;padding:0 4px;text-align:center;
        font-style:italic;font-size:16px;color:var(--dsr-violet-300)}

      /* ---------- reviews ---------- */
      .dsr-review{position:relative;border-radius:14px;padding:20px 18px 18px;margin-bottom:24px;
        background:linear-gradient(180deg,var(--dsr-surface-2) 0%,var(--dsr-surface-1) 100%);
        box-shadow:0 1px 2px rgba(0,0,0,.45),0 6px 18px rgba(0,0,0,.4),
          0 20px 50px rgba(0,0,0,.35),0 1px 0 rgba(185,165,240,.06) inset}
      .dsr-review::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;
        background:linear-gradient(165deg, rgba(139,123,216,.35) 0%, rgba(139,123,216,.10) 45%, rgba(139,123,216,.28) 100%);
        -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
        -webkit-mask-composite:xor;mask-composite:exclude}
      /* gold star fills (the one gold exception) — off star stays neutral */
      .dsr-stars{display:flex;gap:4px;margin-bottom:12px}
      .dsr-stars svg{width:15px;height:15px;display:block;
        filter:drop-shadow(0 0 4px var(--dsr-star-gold-glow))}
      .dsr-stars .off{color:rgba(201,192,174,.45);filter:none}
      .dsr-review q{display:block;font-style:italic;font-size:17px;line-height:1.5;color:var(--dsr-cream);
        quotes:"\\201C" "\\201D";margin-bottom:12px}
      .dsr-attr{font-family:var(--dsr-body);font-size:16px;font-weight:500;
        letter-spacing:.08em;text-transform:uppercase;color:var(--dsr-violet-300)}
      .dsr-rev-ph{position:relative;display:block;flex:none;width:64px;height:64px;border-radius:14px;
        background:var(--dsr-surface-3);
        box-shadow:0 2px 8px rgba(0,0,0,.4), 0 4px 16px rgba(154,126,230,.10)}
      .dsr-rev-ph img{display:block;width:100%;height:100%;object-fit:cover;border-radius:inherit}
      .dsr-rev-ph::after{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;
        background:linear-gradient(165deg, rgba(139,123,216,.40) 0%, rgba(139,123,216,.12) 45%, rgba(139,123,216,.32) 100%);
        -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
        -webkit-mask-composite:xor;mask-composite:exclude}
      .dsr-review--p{display:grid;grid-template-columns:64px 1fr;
        grid-template-areas:"photo stars" "photo attr" "quote quote";column-gap:14px}
      .dsr-review--p .dsr-rev-ph{grid-area:photo}
      .dsr-review--p .dsr-stars{grid-area:stars;align-self:end;margin:6px 0 5px}
      .dsr-review--p .dsr-attr{grid-area:attr;align-self:start}
      .dsr-review--p q{grid-area:quote;margin:14px 0 0}
      .dsr-review--room{padding:26px 20px 22px}
      .dsr-review--room .dsr-rev-ph{width:min(100%,200px);height:auto;aspect-ratio:1/1;border-radius:18px;margin:2px auto 16px}
      .dsr-review--room .dsr-stars{justify-content:center;margin-bottom:14px}
      .dsr-review--room q{margin-bottom:14px}
      .dsr-review--room .dsr-attr{display:block;text-align:center}
      .dsr-review--mini{grid-template-columns:56px 1fr;padding:14px 14px 13px;margin-bottom:20px}
      .dsr-review--mini .dsr-rev-ph{width:56px;height:56px;border-radius:12px}
      .dsr-review--mini .dsr-stars{margin:3px 0 4px}
      .dsr-review--mini q{font-size:16.5px;margin-top:12px}
      .dsr-review--mini .dsr-attr{font-size:16px}

      /* ---------- sample excerpt (sealed line) ---------- */
      .dsr-excerpt{position:relative;border-radius:14px;padding:18px 18px 16px;margin:0 0 24px;
        background:linear-gradient(180deg,var(--dsr-surface-3) 0%,var(--dsr-surface-2) 100%);
        box-shadow:0 1px 2px rgba(0,0,0,.45),0 6px 18px rgba(0,0,0,.4),0 1px 0 rgba(185,165,240,.06) inset}
      .dsr-excerpt::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;
        background:linear-gradient(165deg, rgba(154,126,230,.45) 0%, rgba(139,123,216,.12) 45%, rgba(154,126,230,.35) 100%);
        -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
        -webkit-mask-composite:xor;mask-composite:exclude}
      .dsr-excerpt-eb{display:block;margin-bottom:12px}
      .dsr-excerpt-place{display:flex;align-items:center;gap:12px;margin:0 0 10px}
      .dsr-excerpt-place .dsr-gico{flex:none;width:18px;height:18px;opacity:.85}
      .dsr-excerpt-place .nm{font-size:16.5px;font-weight:600;letter-spacing:.01em;color:var(--dsr-violet-300)}
      .dsr-excerpt-place .fr{font-size:16px;color:var(--dsr-violet-400);font-style:italic}
      .dsr-excerpt-quote{margin:0 0 12px;font-family:var(--dsr-display);font-style:italic;
        font-variation-settings:'opsz' 24;font-weight:500;font-size:18.5px;line-height:1.5;color:var(--dsr-cream)}
      .dsr-excerpt-quote .sealed{filter:blur(4px);opacity:.5;user-select:none;
        -webkit-mask-image:linear-gradient(90deg,#000 0%,transparent 96%);
        mask-image:linear-gradient(90deg,#000 0%,transparent 96%)}
      .dsr-excerpt-note{margin:0;font-size:16px;color:var(--dsr-violet-300);
        letter-spacing:.04em}

      /* ---------- the open value stack ---------- */
      .dsr-stack{list-style:none;margin:0 0 14px;padding:16px 2px 4px;position:relative}
      .dsr-stack::before{content:"";position:absolute;left:0;right:0;top:0;height:1px;
        background:linear-gradient(90deg,transparent,rgba(139,123,216,.22) 20% 80%,transparent)}
      .dsr-stack li{display:flex;gap:12px;align-items:flex-start;padding:6px 0;
        font-size:16px;line-height:1.45;color:var(--dsr-cream)}
      .dsr-stack strong{font-weight:600}
      .dsr-stack-ck{flex:none;width:17px;height:17px;margin-top:4px;display:block;
        fill:none;stroke:url(#dsr-mgold);stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;
        filter:drop-shadow(0 0 6px rgba(154,126,230,.35))}

      /* ---------- kept email row ---------- */
      .dsr-email-kept{display:flex;align-items:center;gap:10px;min-height:48px;
        padding:10px 6px 10px 14px;border-radius:10px;background:rgba(11,8,18,.55);position:relative}
      .dsr-email-kept::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;
        background:linear-gradient(165deg, rgba(139,123,216,.45), rgba(139,123,216,.15) 50%, rgba(139,123,216,.35));
        -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
        -webkit-mask-composite:xor;mask-composite:exclude}
      .dsr-email-kept .addr{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
        font-size:16px;color:var(--dsr-cream)}
      .dsr-email-change{flex:none;min-height:44px;padding:0 14px;background:none;border:0;cursor:pointer;
        font-family:var(--dsr-body);font-size:16px;font-weight:600;color:var(--dsr-violet-200);
        text-decoration:underline;text-underline-offset:3px;text-decoration-color:rgba(139,123,216,.5)}
      .dsr-email-change:focus-visible{outline:2px solid var(--dsr-violet-300);outline-offset:2px;border-radius:6px}

      /* ---------- Soul Bond bump — [22px checkbox][content w/ price pill] ---------- */
      .dsr-bond{position:relative;display:grid;grid-template-columns:22px minmax(0,1fr);
        align-items:start;column-gap:14px;
        min-height:48px;width:100%;padding:15px 16px;
        background:var(--dsr-surface-3);border:0;border-radius:12px;
        cursor:pointer;user-select:none;margin-bottom:26px;
        box-shadow:0 1px 2px rgba(0,0,0,.4),0 5px 14px rgba(0,0,0,.35),
          0 16px 40px rgba(0,0,0,.3),0 1px 0 rgba(185,165,240,.05) inset}
      .dsr-bond::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;
        background:linear-gradient(165deg, rgba(139,123,216,.45) 0%, rgba(139,123,216,.12) 50%, rgba(139,123,216,.38) 100%);
        -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
        -webkit-mask-composite:xor;mask-composite:exclude;
        transition:opacity .4s var(--dsr-ease)}
      .is-bond .dsr-bond::before{
        background:linear-gradient(165deg, rgba(179,167,224,.7) 0%, rgba(139,123,216,.25) 50%, rgba(179,167,224,.6) 100%)}
      .dsr-bond input{position:absolute;opacity:0;width:1px;height:1px}
      .dsr-bond .box{position:relative;flex:none;width:22px;height:22px;border-radius:6px;margin-top:2px;
        display:grid;place-items:center;background:transparent;transition:background .3s var(--dsr-ease)}
      .dsr-bond .box::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1.5px;pointer-events:none;
        background:linear-gradient(165deg, rgba(179,167,224,.75), rgba(139,123,216,.35));
        -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
        -webkit-mask-composite:xor;mask-composite:exclude}
      .is-bond .dsr-bond .box{background:var(--dsr-violet-500)}
      .dsr-bond .box svg{width:13px;height:13px;opacity:0;transition:opacity .2s}
      .is-bond .dsr-bond .box svg{opacity:1}
      .dsr-bond .bt{font-size:16px;line-height:1.45;color:var(--dsr-cream);min-width:0}
      .dsr-bond .bt b{font-weight:600}
      .dsr-bond-title{display:flex;align-items:center;gap:9px;margin-bottom:4px}
      .dsr-bond-orbits{flex:none;width:26px;height:15px;display:block;
        fill:none;stroke:var(--dsr-violet-300);stroke-width:1.3;opacity:.85}
      .dsr-bond-body{display:block}
      /* the price, out of the sentence and into its own right-aligned pill */
      .dsr-bond-pill{margin-left:auto;flex:none;
        font-size:13px;font-weight:600;white-space:nowrap;color:var(--dsr-violet-200);
        box-shadow:0 0 0 1px rgba(139,123,216,.55) inset;
        border-radius:99px;padding:4px 10px}
      .dsr-bond input:focus-visible ~ .box{outline:2px solid var(--dsr-violet-300);outline-offset:3px}
      /* the badge gets its own line — never wrapping mid-sentence */
      .dsr-bond-badge{display:inline-block;margin-top:9px;
        font-size:11.5px;font-weight:500;letter-spacing:.18em;text-transform:uppercase;
        color:var(--dsr-violet-300);
        box-shadow:0 0 0 1px rgba(139,123,216,.4) inset;
        border-radius:99px;padding:2px 9px 3px;white-space:nowrap;max-width:100%}

      /* ---------- the price moment ---------- */
      .dsr-price-moment{position:relative;padding-top:18px;margin-bottom:18px}
      .dsr-price-moment::before{content:"";position:absolute;left:0;right:0;top:0;height:1px;
        background:var(--dsr-hairline)}
      .dsr-price-row{display:flex;align-items:baseline;justify-content:center;gap:14px;
        margin-bottom:6px;border-radius:12px}
      .dsr-was{position:relative;font-family:var(--dsr-display);font-weight:500;
        font-size:16px;color:var(--dsr-cream-dim);font-variant-numeric:lining-nums tabular-nums}
      .dsr-was .strike{position:absolute;left:-3px;right:-3px;top:50%;height:1px;
        background:linear-gradient(90deg,transparent,rgba(201,192,174,.85) 18% 82%,transparent);pointer-events:none;
        transform:scaleX(0);transform-origin:left;
        transition:transform .42s cubic-bezier(.16,1,.3,1)}
      /* the single largest numeral on the page — 48px mobile, 56px desktop */
      .dsr-now{display:inline-block;font-family:var(--dsr-display);font-size:48px;font-weight:600;line-height:1;
        font-variant-numeric:lining-nums tabular-nums;
        opacity:0;transform:scale(.96);
        transition:opacity .48s cubic-bezier(.16,1,.3,1) .34s,transform .48s cubic-bezier(.16,1,.3,1) .34s}
      @media (min-width:1024px){ .dsr-now{font-size:56px} }
      /* PRICE SETTLE — strike draws, then the price blooms; latched, never replays */
      .dsr-price-row[data-settled] .dsr-was .strike{transform:scaleX(1)}
      .dsr-price-row[data-settled] .dsr-now{opacity:1;transform:none}
      /* desktop row tap → one soft pulse at the number (no scroll) */
      .dsr-price-row.pulse{animation:dsrPricePulse .6s var(--dsr-ease)}
      @keyframes dsrPricePulse{
        0%,100%{box-shadow:0 0 0 0 rgba(154,126,230,0)}
        45%{box-shadow:0 0 28px rgba(154,126,230,.35)}
      }
      .dsr-price-mod{text-align:center;font-size:16px;color:var(--dsr-cream-dim);margin:0}
      .dsr-total-line{text-align:center;font-size:16px;color:var(--dsr-cream-dim);margin:8px 0 0}
      .dsr-total-line b{color:var(--dsr-cream);font-weight:600}

      /* ---------- THE SEAL — the buy panel ---------- */
      .dsr-seal{position:relative;border-radius:18px;
        margin-top:24px;
        background:linear-gradient(180deg,#181226 0%,#140f1e 100%);
        box-shadow:0 1px 2px rgba(0,0,0,.5),0 24px 70px rgba(0,0,0,.5)}
      .dsr-seal::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;
        z-index:1;
        background:linear-gradient(165deg, rgba(185,165,240,.55) 0%, rgba(154,126,230,.18) 30%, rgba(139,123,216,.14) 55%, rgba(154,126,230,.60) 100%);
        -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
        -webkit-mask-composite:xor;mask-composite:exclude}
      .dsr-seal-scroll{padding:28px 24px 22px}
      .dsr-seal .dsr-inscription{margin-bottom:18px}
      .dsr-seal .dsr-review--mini{margin-bottom:18px}
      @media (min-width:1024px){
        .dsr-seal{position:sticky;top:84px;align-self:start;margin-top:0;
          overflow:hidden;
          opacity:0;transform:translateY(18px);
          transition:opacity .6s var(--dsr-ease),transform .6s var(--dsr-ease)}
        .dsr-seal.is-in{opacity:1;transform:none}
        /* the panel never exceeds the viewport: the critical run (price →
           email → button) stays on screen; the quiet footer rides a thin
           in-panel rail below the fold */
        .dsr-seal-scroll{max-height:calc(100vh - 96px);overflow-y:auto;
          overscroll-behavior:contain;scrollbar-width:thin;
          scrollbar-color:rgba(139,123,216,.35) transparent;
          padding:18px 20px 16px}
        /* compact register type, seal only (never below 16px body) — the
           560px-column floors would push the buy panel past the fold */
        .dsr-seal .dsr-inscription{font-size:16px;margin-bottom:10px}
        .dsr-seal .dsr-price-moment{padding-top:12px;margin-bottom:12px}
        .dsr-seal .dsr-price-mod{font-size:16px}
        .dsr-seal .dsr-total-line{font-size:16px}
        .dsr-seal .dsr-review--mini{margin-bottom:12px;padding:12px 12px 11px;grid-template-columns:44px 1fr}
        .dsr-seal .dsr-review--mini .dsr-rev-ph{width:44px;height:44px;border-radius:10px}
        .dsr-seal .dsr-review--mini .dsr-stars{margin:1px 0 3px}
        .dsr-seal .dsr-review--mini q{font-size:16px;line-height:1.45;margin-top:9px}
        .dsr-seal .dsr-review--mini .dsr-attr{font-size:12.5px}
        .dsr-seal .dsr-stack{margin:0 0 10px;padding:10px 2px 2px}
        .dsr-seal .dsr-stack li{font-size:16px;line-height:1.4;padding:4px 0}
        .dsr-seal .dsr-stack-ck{width:15px;height:15px;margin-top:3px}
        .dsr-seal .dsr-bond-echo>span{font-size:14px}
        .dsr-seal .dsr-email-block{margin-bottom:10px}
        .dsr-seal .dsr-email-block .dsr-eyebrow{font-size:12.5px;margin-bottom:6px}
        .dsr-seal .dsr-field input{min-height:44px;font-size:16px}
        .dsr-seal .dsr-email-kept{min-height:44px;padding:6px 4px 6px 12px}
        .dsr-seal .dsr-email-kept .addr,.dsr-seal .dsr-email-change{font-size:16px}
        .dsr-seal .dsr-guarantee{font-size:16px;line-height:1.45;margin:14px 4px 0}
        .dsr-seal .dsr-quiet{margin-top:14px}
        .dsr-seal .dsr-quiet .dsr-code{margin-bottom:12px}
        .dsr-seal .dsr-code-link,.dsr-seal .dsr-code-applied{font-size:16px}
        .dsr-seal .dsr-details summary{min-height:42px;padding:9px 2px;font-size:16px}
        .dsr-seal .dsr-disc-body,.dsr-seal .dsr-saving-line{font-size:16px}
        .dsr-seal .dsr-quiet .dsr-trust-line{margin:12px 0 10px;font-size:16px}
        .dsr-seal .dsr-fx-note{font-size:16px;margin:0 0 10px}
        .dsr-seal .dsr-pay-row{margin-bottom:12px}
        .dsr-seal .dsr-charity,.dsr-seal .dsr-charity summary,
        .dsr-seal .dsr-charity-opts button{font-size:16px}
      }

      /* bond echo — fades + grows in when Soul Bond is checked */
      .dsr-bond-echo{display:grid;grid-template-rows:0fr;opacity:0;margin:0;
        transition:grid-template-rows .24s var(--dsr-ease),opacity .24s var(--dsr-ease),margin .24s var(--dsr-ease)}
      .dsr-bond-echo>span{overflow:hidden;display:block;text-align:center;
        font-size:15px;color:var(--dsr-violet-200)}
      .is-bond .dsr-bond-echo{grid-template-rows:1fr;opacity:1;margin:0 0 18px}

      /* quiet footer — administrative, 70% presence */
      .dsr-quiet{opacity:.7;margin-top:18px}
      .dsr-quiet .dsr-code{margin-bottom:18px}
      .dsr-quiet .dsr-trust-line{margin:18px 0 14px}

      /* ---------- email + CTA ---------- */
      .dsr-email-block{margin-bottom:14px}
      .dsr-email-block label{display:block;margin-bottom:8px;text-align:left}
      .dsr-field{position:relative;border-radius:10px;background:rgba(11,8,18,.55)}
      .dsr-field::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;
        background:linear-gradient(165deg, rgba(139,123,216,.45), rgba(139,123,216,.15) 50%, rgba(139,123,216,.35));
        -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
        -webkit-mask-composite:xor;mask-composite:exclude;
        transition:background .3s var(--dsr-ease)}
      .dsr-field:focus-within::before{
        background:linear-gradient(165deg, rgba(207,199,236,.8), rgba(139,123,216,.3) 50%, rgba(207,199,236,.65))}
      .dsr-field input{width:100%;min-height:48px;background:transparent;border:0;outline:none;
        color:var(--dsr-cream);font-family:var(--dsr-body);font-size:16px;padding:12px 14px}
      .dsr-field input::placeholder{color:rgba(201,192,174,.55)}

      .dsr-cta{position:relative;overflow:hidden;border:0;cursor:pointer;
        display:block;width:100%;min-height:56px;
        background:var(--dsr-gold-metal);color:var(--dsr-gold-ink);
        border-radius:12px;padding:16px 12px;white-space:nowrap;
        font:600 clamp(15.5px,4.3vw,17px)/1 'Newsreader',Georgia,serif;letter-spacing:.02em;
        box-shadow:0 1px 0 rgba(255,255,255,.4) inset, 0 -1px 0 rgba(0,0,0,.28) inset,
                   0 6px 18px -6px rgba(124,92,214,.45);
        transition:filter .18s ease, box-shadow .18s ease, transform .06s ease}
      .dsr-cta::after{content:"";position:absolute;inset:0;background:var(--dsr-gold-sheen);
        mix-blend-mode:overlay;transform:translateX(-120%);transition:transform .5s ease}
      .dsr-cta:hover{filter:brightness(1.07) saturate(1.05);
        box-shadow:0 1px 0 rgba(255,255,255,.45) inset, 0 -1px 0 rgba(0,0,0,.28) inset,
                   0 10px 26px -6px rgba(124,92,214,.6)}
      .dsr-cta:hover::after{transform:translateX(120%)}
      .dsr-cta:active{background:linear-gradient(165deg,var(--dsr-gold-400),var(--dsr-gold-600));
        box-shadow:inset 0 2px 6px rgba(0,0,0,.35);transform:translateY(1px);filter:none}
      .dsr-cta:focus-visible{outline:2px solid var(--dsr-gold-100);outline-offset:3px}
      .dsr-cta:disabled{cursor:wait;filter:saturate(.7) brightness(.9)}

      /* GOLD THREAD — once the moon's glow has settled, the CTA carries the
         breath: one slow gold swell, the only moving light left on the page. */
      .dsr-cta.is-thread{animation:dsrThread 7.5s var(--dsr-ease) 1.1s infinite}
      @keyframes dsrThread{
        0%,100%{box-shadow:0 1px 0 rgba(255,255,255,.4) inset, 0 -1px 0 rgba(0,0,0,.28) inset,
          0 6px 18px -6px rgba(124,92,214,.45), 0 0 22px rgba(154,126,230,.16)}
        38%{box-shadow:0 1px 0 rgba(255,255,255,.45) inset, 0 -1px 0 rgba(0,0,0,.28) inset,
          0 9px 26px -6px rgba(124,92,214,.58), 0 0 38px rgba(154,126,230,.30)}
        63%{box-shadow:0 1px 0 rgba(255,255,255,.42) inset, 0 -1px 0 rgba(0,0,0,.28) inset,
          0 7px 22px -6px rgba(124,92,214,.5), 0 0 28px rgba(154,126,230,.22)}
      }

      .dsr-error{margin:10px 0 0;text-align:center;font-size:16px;color:#e8b4b4}

      .dsr-guarantee{font-family:var(--dsr-display);font-style:italic;
        font-variation-settings:'opsz' 20;font-size:17.5px;line-height:1.5;
        color:var(--dsr-cream);text-align:center;margin:20px 6px 24px}

      /* ---------- promo code (demoted) ---------- */
      .dsr-code{text-align:center;margin-bottom:22px}
      .dsr-code-link{background:none;border:0;cursor:pointer;padding:6px 8px;
        font-family:var(--dsr-body);font-size:16px;color:var(--dsr-violet-300);
        text-decoration:underline;text-underline-offset:3px;text-decoration-color:rgba(139,123,216,.5)}
      .dsr-code-row{display:flex;gap:8px;align-items:stretch}
      .dsr-code-row .dsr-field{flex:1}
      .dsr-code-row .dsr-field input{text-transform:uppercase;min-height:44px}
      .dsr-code-apply{flex:none;min-height:44px;padding:0 18px;border:0;border-radius:10px;cursor:pointer;
        background:var(--dsr-surface-3);color:var(--dsr-violet-100);
        font-family:var(--dsr-body);font-weight:600;font-size:16px;
        box-shadow:0 0 0 1px rgba(139,123,216,.4) inset}
      .dsr-code-apply:disabled{opacity:.55;cursor:default}
      .dsr-code-applied{font-size:16px;color:var(--dsr-cream-dim)}
      .dsr-code-applied b{color:var(--dsr-cream)}
      .dsr-code-applied .dsr-code-link{margin-left:8px}

      /* ---------- disclosures ---------- */
      .dsr-details{position:relative}
      .dsr-details::before{content:"";position:absolute;left:0;right:0;top:0;height:1px;
        background:linear-gradient(90deg,transparent,rgba(139,123,216,.22) 20% 80%,transparent)}
      .dsr-details.last::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;
        background:linear-gradient(90deg,transparent,rgba(139,123,216,.22) 20% 80%,transparent)}
      .dsr-details summary{list-style:none;cursor:pointer;
        display:flex;align-items:center;justify-content:space-between;
        min-height:48px;padding:13px 2px;font-size:16px;color:var(--dsr-cream)}
      .dsr-details summary::-webkit-details-marker{display:none}
      .dsr-arrow{flex:none;width:18px;height:18px;opacity:.7;transition:transform .35s var(--dsr-ease)}
      .dsr-details[open] summary .dsr-arrow{transform:rotate(180deg)}
      .dsr-disc-body{padding:2px 2px 18px;font-size:16px;color:var(--dsr-cream-dim)}
      .dsr-disc-body ul{list-style:none;margin:0;padding:0}
      .dsr-disc-body li{position:relative;padding:5px 0 5px 22px}
      .dsr-disc-body li::before{content:"";position:absolute;left:2px;top:13px;
        width:5px;height:5px;border-radius:50%;background:var(--dsr-violet-500)}
      .dsr-tag{display:inline-block;margin-left:8px;
        font-size:13px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;
        color:var(--dsr-violet-300);
        box-shadow:0 0 0 1px rgba(139,123,216,.4) inset;
        border-radius:99px;padding:1px 8px 2px;vertical-align:2px}

      /* steppers */
      .dsr-stepper{display:flex;align-items:center;gap:16px;margin:6px 0 12px}
      .dsr-stepper button{position:relative;width:44px;height:44px;flex:none;
        background:var(--dsr-surface-3);border:0;border-radius:10px;color:var(--dsr-cream);
        font-size:22px;font-family:var(--dsr-body);line-height:1;cursor:pointer;
        box-shadow:0 1px 0 rgba(185,165,240,.05) inset, 0 2px 8px rgba(0,0,0,.35)}
      .dsr-stepper button::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;
        background:linear-gradient(165deg, rgba(139,123,216,.45), rgba(139,123,216,.15));
        -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
        -webkit-mask-composite:xor;mask-composite:exclude}
      .dsr-stepper button:active{background:#322b52}
      .dsr-stepper .qty{font-size:17px;color:var(--dsr-cream);min-width:110px;text-align:center}
      .dsr-saving-line{font-size:16px;color:var(--dsr-cream-dim)}
      .dsr-saving-line b{color:var(--dsr-cream);font-weight:600}

      /* ---------- trust — one row, never wrapping ---------- */
      .dsr-trust-line{display:flex;justify-content:center;gap:8px;flex-wrap:nowrap;white-space:nowrap;
        font-size:16px;color:var(--dsr-cream-dim);margin:22px 0 14px;text-align:center}
      .dsr-trust-line span::after{content:"·";margin-left:8px;color:rgba(139,123,216,.5)}
      .dsr-trust-line span:last-child::after{content:""}
      .dsr-fx-note{text-align:center;font-size:16px;color:var(--dsr-cream-dim);margin:0 0 14px}

      /* payment marks — 26px chips, one centered row at 390px */
      .dsr-pay-row{display:flex;gap:6px;align-items:center;justify-content:center;flex-wrap:wrap;margin-bottom:18px}
      .dsr-pay-chip{display:inline-flex;align-items:center;justify-content:center;
        height:26px;padding:0 7px;border-radius:7px;
        background:linear-gradient(180deg,rgba(255,255,255,.97),rgba(243,243,246,.92));
        border:1px solid rgba(255,255,255,.16);
        box-shadow:0 1px 0 rgba(255,255,255,.25) inset, 0 2px 6px rgba(0,0,0,.35)}
      .dsr-pay-chip--dark{
        background:linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.05));
        backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
        border:1px solid rgba(255,255,255,.14);
        box-shadow:0 1px 0 rgba(255,255,255,.10) inset}
      .dsr-pay-chip svg{height:12px;width:auto;display:block}
      .dsr-pay-chip--dark svg{height:13px}

      /* charity */
      .dsr-charity{text-align:center;font-size:16px;color:var(--dsr-cream-dim)}
      .dsr-charity::before{display:none}
      .dsr-charity summary{justify-content:center;gap:8px;min-height:44px;
        font-size:16px;color:var(--dsr-cream-dim)}
      .dsr-charity summary .cname{color:var(--dsr-violet-200)}
      .dsr-charity-opts{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;padding-bottom:14px}
      .dsr-charity-opts button{position:relative;min-height:44px;padding:8px 14px;
        background:var(--dsr-surface-2);border:0;border-radius:99px;color:var(--dsr-cream-dim);
        font-family:var(--dsr-body);font-size:16px;cursor:pointer}
      .dsr-charity-opts button::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;
        background:linear-gradient(165deg, rgba(139,123,216,.35), rgba(139,123,216,.12));
        -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
        -webkit-mask-composite:xor;mask-composite:exclude}
      .dsr-charity-opts button[aria-pressed="true"]{color:var(--dsr-violet-100);background:var(--dsr-surface-3)}
      .dsr-charity-opts button[aria-pressed="true"]::before{
        background:linear-gradient(165deg, rgba(207,199,236,.7), rgba(139,123,216,.3))}

      /* ---------- sticky bar ---------- */
      .dsr-sticky{position:fixed;left:0;right:0;bottom:0;z-index:40;
        padding:9px 16px calc(9px + env(safe-area-inset-bottom));
        background:rgba(11,8,18,.88);
        -webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);
        box-shadow:0 -6px 24px rgba(0,0,0,.45), 0 -22px 60px rgba(0,0,0,.3);
        transform:translateY(110%);
        transition:transform .5s var(--dsr-ease);
        pointer-events:none}
      .dsr-sticky::before{content:"";position:absolute;left:0;right:0;top:0;height:1px;
        background:linear-gradient(90deg,transparent,rgba(139,123,216,.35) 20% 80%,transparent)}
      .dsr-sticky.show{transform:none;pointer-events:auto}
      .dsr-sticky .dsr-cta{min-height:56px;margin:0;max-width:560px;margin-inline:auto}
      /* desktop never shows the bar — the sticky seal panel covers it */
      @media (min-width:1024px){ .dsr-sticky{display:none} }

      /* ---------- reduced motion — rest state IS the finished composition ---------- */
      @media (prefers-reduced-motion: reduce){
        .dsr-root *, .dsr-root *::before, .dsr-root *::after{transition-duration:.01ms!important;animation:none!important}
        .dsr-cta.is-thread{box-shadow:0 1px 0 rgba(255,255,255,.4) inset, 0 -1px 0 rgba(0,0,0,.28) inset,
          0 6px 18px -6px rgba(124,92,214,.5), 0 0 26px rgba(154,126,230,.2)}
        .dsr-ring,.dsr-chord{stroke-dashoffset:0}
        .dsr-wglyph.lit,.dsr-wlabel,.dsr-glyph-halo{opacity:1}
        .dsr-wglyph.dim{opacity:.34}
        .dsr-wlabel.dim{opacity:.5}
        .dsr-rung i{transform:scale(1);opacity:1}
        .dsr-cta::after{display:none}
        .is-bond .dsr-bond-ring{stroke-dashoffset:0}
        .dsr-bond-ring{stroke-dashoffset:1}
        .dsr-was .strike{transform:scaleX(1)}
        .dsr-now{opacity:1;transform:none}
        .dsr-seal{opacity:1;transform:none}
        .dsr-bond-echo{transition:none}
      }
      /* .is-static — same finished composition, class-driven (QA / no-JS parity) */
      .dsr-root.is-static .dsr-ring,.dsr-root.is-static .dsr-chord{stroke-dashoffset:0}
      .dsr-root.is-static .dsr-wglyph.lit,.dsr-root.is-static .dsr-wlabel,
      .dsr-root.is-static .dsr-glyph-halo{opacity:1}
      .dsr-root.is-static .dsr-wglyph.dim{opacity:.34}
      .dsr-root.is-static .dsr-wlabel.dim{opacity:.5}
      .dsr-root.is-static .dsr-rung i{transform:scale(1);opacity:1}
      .dsr-root.is-static .dsr-was .strike{transform:scaleX(1)}
      .dsr-root.is-static .dsr-now{opacity:1;transform:none}
      .dsr-root.is-static .dsr-seal{opacity:1;transform:none}
      .dsr-root.is-static .dsr-cta{animation:none}
      .dsr-root.is-static .dsr-wglyph.dim.echo,
      .dsr-root.is-static .dsr-price-row.pulse{animation:none}

      /* ==== TYPE FLOORS - tuned per viewport (2026-07-14) ==== */
      .dsr-root{font-size:18px}
      .dsr-eyebrow{font-size:14px}
      .dsr-inscription{font-size:18px}
      .dsr-tier-line{font-size:18px}
      .dsr-bullets li{font-size:18px}
      .dsr-rung-line{font-size:17px}
      .dsr-lrow .nm{font-size:18px}
      .dsr-lrow .fr{font-size:17px}
      .dsr-rising{font-size:17px}
      .dsr-review q{font-size:18px}
      .dsr-review--mini q{font-size:18px}
      .dsr-excerpt-place .nm{font-size:18px}
      .dsr-excerpt-place .fr{font-size:17px}
      .dsr-excerpt-note{font-size:17px}
      .dsr-stack li{font-size:18px}
      .dsr-email-kept .addr{font-size:17px}
      .dsr-email-change{font-size:17px}
      .dsr-bond .bt{font-size:18px}
      .dsr-bond-badge{font-size:12px}
      .dsr-was{font-size:17px}
      .dsr-price-mod{font-size:17px}
      .dsr-total-line{font-size:17px}
      .dsr-field input{font-size:17px}
      .dsr-cta{font-size:18px}
      .dsr-error{font-size:17px}
      .dsr-guarantee{font-size:18px}
      .dsr-code-link{font-size:17px}
      .dsr-code-apply{font-size:17px}
      .dsr-code-applied{font-size:17px}
      .dsr-details summary{font-size:18px}
      .dsr-disc-body{font-size:17px}
      .dsr-tag{font-size:14px}
      .dsr-stepper .qty{font-size:18px}
      .dsr-saving-line{font-size:17px}
      .dsr-trust-line{font-size:17px}
      .dsr-fx-note{font-size:17px}
      .dsr-charity{font-size:17px}
      .dsr-charity summary{font-size:17px}
      .dsr-charity-opts button{font-size:17px}
      @media (min-width:768px){
        .dsr-root{font-size:18.5px}
        .dsr-eyebrow{font-size:14.5px}
        .dsr-bullets li,.dsr-review q,.dsr-review--mini q,.dsr-stack li{font-size:18.5px}
        .dsr-rung-line,.dsr-disc-body,.dsr-trust-line,.dsr-rising{font-size:17.5px}
      }
      @media (min-width:1280px){
        .dsr-root{font-size:19px}
        .dsr-eyebrow{font-size:15px}
        .dsr-inscription{font-size:19px}
        .dsr-tier-line{font-size:19px}
        .dsr-bullets li{font-size:19px}
        .dsr-rung-line{font-size:18px}
        .dsr-lrow .nm{font-size:18.5px}
        .dsr-lrow .fr{font-size:17.5px}
        .dsr-rising{font-size:18px}
        .dsr-review q,.dsr-review--mini q{font-size:19px}
        .dsr-excerpt-place .nm{font-size:18.5px}
        .dsr-excerpt-place .fr,.dsr-excerpt-note{font-size:17.5px}
        .dsr-stack li{font-size:19px}
        .dsr-email-kept .addr,.dsr-email-change{font-size:17.5px}
        .dsr-bond .bt{font-size:18.5px}
        .dsr-bond-badge{font-size:12.5px}
        .dsr-tag{font-size:15px}
        .dsr-was,.dsr-price-mod,.dsr-total-line{font-size:17.5px}
        .dsr-field input{font-size:17.5px}
        .dsr-cta{font-size:19px}
        .dsr-error{font-size:17.5px}
        .dsr-guarantee{font-size:19px}
        .dsr-code-link,.dsr-code-apply,.dsr-code-applied{font-size:17.5px}
        .dsr-details summary{font-size:18.5px}
        .dsr-disc-body{font-size:18px}
        .dsr-stepper .qty{font-size:18px}
        .dsr-saving-line,.dsr-fx-note,.dsr-charity,.dsr-charity summary,.dsr-charity-opts button{font-size:17.5px}
      }
    `}</style>
  );
}
