import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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
 * angle: degrees clockwise from the top of the wheel */
const PLACEMENTS = [
  { ico: "g-sun", name: "Sun", frame: "Who they are at the centre.", lit: true, a: 25 },
  { ico: "g-moon", name: "Moon", frame: "How they feel, and what soothes them.", lit: true, a: 232 },
  { ico: "g-venus", name: "Venus", frame: "How they love.", lit: true, a: 68 },
  { ico: "g-mercury", name: "Mercury", frame: "How they read you.", lit: false, a: 47 },
  { ico: "g-mars", name: "Mars", frame: "What they chase, and why.", lit: false, a: 301 },
  { ico: "g-jupiter", name: "Jupiter", frame: "Where their joy runs biggest.", lit: false, a: 198 },
  { ico: "g-saturn", name: "Saturn", frame: "What steadies them.", lit: false, a: 160 },
  { ico: "g-uranus", name: "Uranus", frame: "The streak nothing tames.", lit: false, a: 95 },
  { ico: "g-neptune", name: "Neptune", frame: "What they sense before you do.", lit: false, a: 116 },
  { ico: "g-pluto", name: "Pluto", frame: "The deep pull beneath it all.", lit: false, a: 137 },
  { ico: "g-chiron", name: "Chiron", frame: "The old tender place.", lit: false, a: 251 },
  { ico: "g-node", name: "North Node", frame: "What they came here to learn.", lit: false, a: 330 },
  { ico: "g-asc", name: "Rising", frame: "The first face they show the world.", lit: false, a: 270 },
] as const;

const CX = 170;
const CY = 170;
function pt(angle: number, r: number): [number, number] {
  const rad = ((angle - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

/* Reviews — verbatim from the approved set; images live first-party at /reviews/. */
const REVIEWS = {
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
    ctaLabel, fmt, unitNow, unitWas, finalPrice, discountRate,
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
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reduce]);

  /* kicker flash when a locked row is tapped */
  const kickerHome = petName
    ? `How deeply do you want to know ${petName}?`
    : "How deeply do you want to know them?";
  const [kicker, setKicker] = useState<string | null>(null);
  const kickerTimer = useRef<number | null>(null);
  const priceRowRef = useRef<HTMLDivElement>(null);
  const flashPlacement = useCallback((name: string) => {
    setKicker(petName ? `${petName}. ${name} still unread.` : `${name}. Still unread.`);
    if (kickerTimer.current) window.clearTimeout(kickerTimer.current);
    kickerTimer.current = window.setTimeout(() => setKicker(null), 1800);
    priceRowRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    onTrack("v2_dossier_row_tapped", { placement: name });
  }, [petName, reduce, onTrack]);
  useEffect(() => () => { if (kickerTimer.current) window.clearTimeout(kickerTimer.current); }, []);

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

  /* sticky bottom bar: shows once the main CTA has scrolled OFF THE TOP —
     never earlier, so no price bar hovers over the reveal above. */
  const ctaRef = useRef<HTMLButtonElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [stickyOn, setStickyOn] = useState(false);
  useEffect(() => {
    const el = ctaRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([en]) => {
      setStickyOn(!en.isIntersecting && en.boundingClientRect.top < 0);
    }, { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
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

  /* wheel geometry (memoised — pure trig) */
  const wheel = useMemo(() => {
    const ticks: { x1: number; y1: number; x2: number; y2: number; cusp: boolean }[] = [];
    for (let d = 0; d < 360; d += 5) {
      const cusp = d % 30 === 0;
      const p1 = pt(d, 128), p2 = pt(d, cusp ? 120 : 124);
      ticks.push({ x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1], cusp });
    }
    const litPts = PLACEMENTS.filter((p) => p.lit).map((p) => pt(p.a, 90));
    const chords = litPts.map((a, i) => {
      const b = litPts[(i + 1) % litPts.length];
      return { x1: a[0], y1: a[1], x2: b[0], y2: b[1] };
    });
    const glyphs = PLACEMENTS.map((p, idx) => {
      const g = pt(p.a, 111);
      const l = pt(p.a, 143);
      const lrad = ((p.a - 90) * Math.PI) / 180;
      const cosA = Math.cos(lrad), sinA = Math.sin(lrad);
      const anchor = cosA > 0.35 ? "start" : cosA < -0.35 ? "end" : "middle";
      const dy = sinA > 0.6 ? 9 : sinA < -0.6 ? -1 : 3;
      return { ...p, gx: g[0], gy: g[1], lx: l[0], ly: l[1] + dy, anchor, delay: 0.45 + idx * 0.06 };
    });
    return { ticks, chords, glyphs };
  }, []);

  const totalLabel = fmt(finalPrice);
  const ctaText = `${ctaLabel} · ${totalLabel}`;
  const savingPct = Math.round(discountRate * 100);
  const wheelAria = petName
    ? `${petName}'s natal wheel. Sun, Moon and Venus are lit. Ten placements are still unread.`
    : "A natal wheel. Sun, Moon and Venus are lit. Ten placements are still unread.";

  return (
    <div className={`dsr-root${lit ? " is-lit" : ""}${bond ? " is-bond" : ""}`}>
      <DossierStyles />

      {/* glyph sprite: gold gradient + thirteen drawn placements + review star */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          <linearGradient id="dsr-mgold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f0d99f" /><stop offset=".5" stopColor="#d4b26b" /><stop offset="1" stopColor="#a9884f" />
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
          <symbol id="g-asc" viewBox="0 0 24 24"><path d="M3.5 19 8 5l4.5 14M5.4 14.2h5.2M21 8.4a6.4 6.4 0 1 0 0 7.2" /></symbol>
          <symbol id="dsr-star" viewBox="0 0 24 24"><path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9z" fill="url(#dsr-mgold)" stroke="none" /></symbol>
          <symbol id="dsr-star-o" viewBox="0 0 24 24"><path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></symbol>
        </defs>
      </svg>

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
                <g className={`dsr-wglyph ${g.lit ? "lit" : "dim"}`} style={{ transitionDelay: `${g.delay}s` }}>
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
        <p className="dsr-handoff">You have met three placements. Ten are still unread. Then what all thirteen mean between you.</p>
      )}

      {/* ── the dossier ── */}
      <section className="dsr-card" aria-label="Soul Reading">
        <p className="dsr-eyebrow dsr-kicker" aria-live="polite" data-flash={kicker ? "" : undefined}>
          {kicker ?? kickerHome}
        </p>

        <p className="dsr-inscription dsr-gold-text">
          {petName && bornLabel ? `For ${petName}, born ${bornLabel}.` : "Inscribed with their name at checkout."}
        </p>

        {hasChart && (
          <p className="dsr-headline">
            {petName ? `${petName}. ` : ""}Born under <strong>thirteen</strong> placements. You have met <strong>three</strong>.
          </p>
        )}

        <h3 className="dsr-tier">Soul Reading</h3>
        <p className="dsr-tier-line"><em>For the little soul in front of you.</em></p>

        <ul className="dsr-bullets">
          <li>
            <svg className="dsr-gico lit" aria-hidden="true"><use href="#g-sun" /></svg>
            <span><strong>What lights them up</strong>, and why it looks nothing like what lights you up.</span>
          </li>
          <li>
            <svg className="dsr-gico lit" aria-hidden="true"><use href="#g-moon" /></svg>
            <span><strong>What they need when the world gets loud</strong>, and how to give it without asking.</span>
          </li>
          <li>
            <svg className="dsr-gico lit" aria-hidden="true"><use href="#g-venus" /></svg>
            <span><strong>How they&rsquo;ve already chosen you back</strong>, in a way you&rsquo;d never think to look for.</span>
          </li>
        </ul>

        {/* endowed rung — free-reading cohort only, never on memorial */}
        {hasChart && (
          <>
            <div className="dsr-rung" aria-hidden="true">
              {PLACEMENTS.map((p, i) => (
                <i key={p.name} className={i < 3 ? "on" : undefined} style={{ transitionDelay: `${0.5 + i * 0.05}s` }} />
              ))}
            </div>
            <p className="dsr-rung-line">Three of thirteen, yours already.</p>
          </>
        )}

        {/* ten locked rows — named, never blurred */}
        <ul className="dsr-rows">
          {PLACEMENTS.filter((p) => !p.lit).map((p) => (
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

        {/* reviews: grief given room, joy, gift. The skeptic now opens
            earlier, on the journey itself, at the post-reveal doubt beat
            (SkepticWhisper) — one voice, one place, no duplicate here. */}
        <div className="dsr-rev-block">
          <Review kind="grief" variant="room" />
          <Review kind="joy" variant="compact" />
          <Review kind="gift" variant="compact" />
        </div>

        {/* Soul Bond bump — second orbit, not a rival card */}
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
            <b>Soul Bond.</b> Your chart beside theirs. Where you align, where you challenge each other, and why you found each other. <span className="plus">+{fmt(props.bondDelta)}</span>
            <span className="dsr-bond-badge">What most families add</span>
          </span>
        </label>

        {/* the practical one, beside the price */}
        <Review kind="practical" variant="mini" />

        {/* price row LAST and small */}
        <div className="dsr-price-row" ref={priceRowRef} aria-live="polite">
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

        {/* the returner — last social proof before the buy button */}
        <Review kind="returner" variant="compact" />

        <div className="dsr-email-block">
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
        </div>

        <button className="dsr-cta" type="button" ref={ctaRef} onClick={onCheckout} disabled={isLoading}>
          {isLoading ? "Opening secure checkout..." : ctaText}
        </button>
        {error && <p className="dsr-error" role="alert">{error}</p>}

        <p className="dsr-guarantee">If the reading does not feel like them, we refund every cent.</p>

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

        <details className="dsr-details">
          <summary>What opens<Chevron /></summary>
          <div className="dsr-disc-body">
            <ul>
              <li>Full astrological breakdown, 30+ sections</li>
              <li>How they love, how they learn, how they heal, what they hope for, what they fear, and what makes them feel most themselves</li>
              <li>Their photo becomes part of the reveal</li>
              <li>Yours forever. Revisit anytime, from any device</li>
              <li>Bonus sections, little surprises written just for them<span className="dsr-tag">Bonus</span></li>
              <li>SoulSpeak<span className="dsr-tag">New</span></li>
              <li>1 month of weekly horoscopes<span className="dsr-tag">Free</span></li>
            </ul>
          </div>
        </details>

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

        <div className="dsr-trust-line">
          <span>Secure checkout</span>
          <span>Ready in minutes</span>
          <span>Full refund</span>
        </div>

        {isLocalized && (
          <p className="dsr-fx-note">Shown in {currencyCode}. Billed in USD at today&rsquo;s rate.</p>
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
      </section>

      {/* sticky CTA — appears only after the main CTA scrolls off the top */}
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
        --dsr-gold-100:#f7e7b6; --dsr-gold-200:#efd9a0; --dsr-gold-300:#e9cd8b;
        --dsr-gold-400:#d4b26b; --dsr-gold-500:#c4a265; --dsr-gold-600:#a9884f; --dsr-gold-700:#8a6d3b;
        --dsr-gold-ink:#2a1f0a;
        --dsr-gold-metal:linear-gradient(180deg,#f7e7b6 0%,#e9cd8b 18%,#d4b26b 40%,#c4a265 56%,#a9884f 80%,#8a6d3b 100%);
        --dsr-gold-metal-text:linear-gradient(177deg,#f7e7b6 0%,#e9cd8b 24%,#d4b26b 48%,#a9884f 74%,#d4b26b 100%);
        --dsr-gold-sheen:linear-gradient(105deg,transparent 42%,rgba(255,255,255,.35) 50%,transparent 58%);
        --dsr-violet-100:#e8e4f6; --dsr-violet-200:#cfc7ec; --dsr-violet-300:#b3a7e0;
        --dsr-violet-400:#9b8fd0; --dsr-violet-500:#8b7bd8; --dsr-violet-600:#6f62a8;
        --dsr-cream:#f4eee1; --dsr-cream-dim:#c9c0ae;
        --dsr-surface-1:#140f1e; --dsr-surface-2:#181226; --dsr-surface-3:#1f1830;
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

      .dsr-gold-text{
        color:#d4b26b;
        background:var(--dsr-gold-metal-text);
        -webkit-background-clip:text;background-clip:text;
        -webkit-text-fill-color:transparent;color:transparent;
        filter:drop-shadow(0 1px 6px rgba(212,178,107,.18));
      }

      /* ---------- natal wheel ---------- */
      .dsr-wheel-holder{display:flex;flex-direction:column;align-items:center;margin-bottom:8px}
      .dsr-wheel{width:min(64vw,260px);height:auto;display:block;overflow:visible;
        filter:drop-shadow(0 0 28px rgba(139,123,216,.14))}
      @media (min-width:768px){ .dsr-wheel{width:320px} }
      .dsr-ring{fill:none;stroke:rgba(139,123,216,.42);stroke-width:1;
        stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset 1.6s var(--dsr-ease)}
      .dsr-ring.inner{stroke:rgba(139,123,216,.28);transition-delay:.25s}
      .is-lit .dsr-ring{stroke-dashoffset:0}
      .dsr-tick{stroke:rgba(139,123,216,.30);stroke-width:1}
      .dsr-tick.cusp{stroke:rgba(139,123,216,.45);stroke-width:1.2}
      .dsr-chord{stroke:url(#dsr-mgold);stroke-opacity:.4;stroke-width:1;fill:none;
        stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset 1.4s var(--dsr-ease) .9s}
      .is-lit .dsr-chord{stroke-dashoffset:0}
      .dsr-wglyph{fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;
        opacity:0;transition:opacity 1s var(--dsr-ease)}
      .dsr-wglyph.lit{stroke:url(#dsr-mgold);color:#d4b26b}
      .dsr-wglyph.dim{color:var(--dsr-violet-500)}
      .is-lit .dsr-wglyph.lit{opacity:1}
      .is-lit .dsr-wglyph.dim{opacity:.7}
      .dsr-wlabel{font-family:var(--dsr-body);font-weight:500;font-size:12.5px;letter-spacing:.12em;
        text-transform:uppercase;opacity:0;transition:opacity 1.1s var(--dsr-ease) .5s}
      .dsr-wlabel.lit{fill:#d4b26b}
      .dsr-wlabel.dim{fill:var(--dsr-violet-400);font-size:10.5px;display:none}
      @media (min-width:768px){ .dsr-wlabel.dim{display:block} }
      .is-lit .dsr-wlabel{opacity:1}
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
          0 -14px 50px rgba(212,178,107,.05) inset,
          0 1px 0 rgba(247,231,182,.10) inset;
      }
      @media (min-width:768px){ .dsr-card{padding:38px 36px 32px} }
      .dsr-card::before{
        content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;
        background:linear-gradient(165deg, rgba(247,231,182,.55) 0%, rgba(196,162,101,.18) 30%, rgba(139,123,216,.14) 55%, rgba(212,178,107,.60) 100%);
        -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
        -webkit-mask-composite:xor;mask-composite:exclude;
      }

      .dsr-eyebrow{font-family:var(--dsr-body);font-size:12.5px;font-weight:500;
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

      /* ---------- outcome bullets ---------- */
      .dsr-bullets{list-style:none;margin:0 0 8px;padding:0 2px}
      .dsr-bullets li{display:flex;gap:13px;align-items:flex-start;padding:9px 0;
        font-size:16.5px;color:var(--dsr-cream)}
      .dsr-bullets .dsr-gico{flex:none;width:20px;height:20px;margin-top:3px}
      .dsr-bullets strong{font-weight:600}
      .dsr-gico{display:block;fill:none;stroke:currentColor;stroke-width:1.6;
        stroke-linecap:round;stroke-linejoin:round;color:var(--dsr-violet-500)}
      .dsr-gico.lit{stroke:url(#dsr-mgold);color:#d4b26b}

      /* ---------- endowed rung ---------- */
      .dsr-rung{display:flex;gap:9px;justify-content:center;align-items:center;margin:16px 0 8px}
      .dsr-rung i{width:7px;height:7px;border-radius:50%;background:var(--dsr-violet-600);display:block;
        transform:scale(.4);opacity:0;
        transition:transform .6s var(--dsr-ease),opacity .6s var(--dsr-ease)}
      .dsr-rung i.on{background:var(--dsr-gold-metal);box-shadow:0 0 8px rgba(212,178,107,.6)}
      .is-lit .dsr-rung i{transform:scale(1);opacity:1}
      .dsr-rung-line{text-align:center;font-family:var(--dsr-display);font-style:italic;
        font-variation-settings:'opsz' 20;font-size:15.5px;color:var(--dsr-cream-dim);margin-bottom:22px}

      /* ---------- locked tease rows ---------- */
      .dsr-rows{list-style:none;margin:0 0 26px;padding:0}
      .dsr-rows li{position:relative;content-visibility:auto;contain-intrinsic-size:auto 64px}
      .dsr-rows li::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;border:0;
        background:linear-gradient(90deg,transparent,rgba(139,123,216,.22) 20% 80%,transparent)}
      .dsr-rows li:last-child::after{display:none}
      .dsr-lrow{display:flex;align-items:center;gap:14px;width:100%;text-align:left;
        background:none;border:0;padding:12px 4px;min-height:48px;
        font-family:var(--dsr-body);cursor:pointer;border-radius:8px;
        transition:background .3s var(--dsr-ease)}
      .dsr-lrow .dsr-gico{flex:none;width:20px;height:20px;opacity:.7}
      .dsr-lrow .nm{font-size:16px;font-weight:600;letter-spacing:.01em;color:var(--dsr-violet-300)}
      .dsr-lrow .fr{font-size:15px;color:var(--dsr-violet-400);font-style:italic}
      .dsr-chev{margin-left:auto;flex:none;width:18px;height:18px;opacity:.55}
      .dsr-lrow:active{background:var(--dsr-surface-3)}

      /* ---------- reviews ---------- */
      .dsr-review{position:relative;border-radius:14px;padding:20px 18px 18px;margin-bottom:24px;
        background:linear-gradient(180deg,var(--dsr-surface-2) 0%,var(--dsr-surface-1) 100%);
        box-shadow:0 1px 2px rgba(0,0,0,.45),0 6px 18px rgba(0,0,0,.4),
          0 20px 50px rgba(0,0,0,.35),0 1px 0 rgba(247,231,182,.06) inset}
      .dsr-review::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;
        background:linear-gradient(165deg, rgba(139,123,216,.35) 0%, rgba(139,123,216,.10) 45%, rgba(139,123,216,.28) 100%);
        -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
        -webkit-mask-composite:xor;mask-composite:exclude}
      .dsr-stars{display:flex;gap:4px;margin-bottom:12px}
      .dsr-stars svg{width:15px;height:15px;display:block}
      .dsr-stars .off{color:rgba(201,192,174,.45)}
      .dsr-review q{display:block;font-style:italic;font-size:17px;line-height:1.5;color:var(--dsr-cream);
        quotes:"\\201C" "\\201D";margin-bottom:12px}
      .dsr-attr{font-family:var(--dsr-body);font-size:12.5px;font-weight:500;
        letter-spacing:.18em;text-transform:uppercase;color:var(--dsr-violet-300)}
      .dsr-rev-ph{position:relative;display:block;flex:none;width:64px;height:64px;border-radius:14px;
        background:var(--dsr-surface-3);
        box-shadow:0 2px 8px rgba(0,0,0,.4), 0 4px 16px rgba(212,178,107,.10)}
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
      .dsr-review--room .dsr-rev-ph{width:min(100%,280px);height:auto;aspect-ratio:1/1;border-radius:18px;margin:2px auto 16px}
      .dsr-review--room .dsr-stars{justify-content:center;margin-bottom:14px}
      .dsr-review--room q{margin-bottom:14px}
      .dsr-review--room .dsr-attr{display:block;text-align:center}
      .dsr-review--mini{grid-template-columns:56px 1fr;padding:14px 14px 13px;margin-bottom:20px}
      .dsr-review--mini .dsr-rev-ph{width:56px;height:56px;border-radius:12px}
      .dsr-review--mini .dsr-stars{margin:3px 0 4px}
      .dsr-review--mini q{font-size:15px;margin-top:12px}
      .dsr-review--mini .dsr-attr{font-size:11.5px}
      .dsr-rev-block{margin-bottom:24px}
      .dsr-rev-block .dsr-review{margin-bottom:12px}
      .dsr-rev-block .dsr-review:last-child{margin-bottom:0}

      /* ---------- Soul Bond bump ---------- */
      .dsr-bond{position:relative;display:flex;align-items:flex-start;gap:14px;
        min-height:48px;width:100%;padding:15px 16px;
        background:var(--dsr-surface-3);border:0;border-radius:12px;
        cursor:pointer;user-select:none;margin-bottom:26px;
        box-shadow:0 1px 2px rgba(0,0,0,.4),0 5px 14px rgba(0,0,0,.35),
          0 16px 40px rgba(0,0,0,.3),0 1px 0 rgba(247,231,182,.05) inset}
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
      .dsr-bond .bt{font-size:16px;line-height:1.45;color:var(--dsr-cream)}
      .dsr-bond .bt b{font-weight:600}
      .dsr-bond .bt .plus{font-weight:600;white-space:nowrap;color:var(--dsr-violet-200)}
      .dsr-bond input:focus-visible ~ .box{outline:2px solid var(--dsr-violet-300);outline-offset:3px}
      .dsr-bond-badge{display:inline-block;margin-left:8px;
        font-size:10.5px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;
        color:var(--dsr-violet-300);
        box-shadow:0 0 0 1px rgba(139,123,216,.4) inset;
        border-radius:99px;padding:1px 8px 2px;vertical-align:2px;white-space:nowrap}

      /* ---------- price row ---------- */
      .dsr-price-row{display:flex;align-items:baseline;justify-content:center;gap:14px;margin-bottom:6px}
      .dsr-was{position:relative;font-family:var(--dsr-display);font-weight:500;
        font-size:15px;color:var(--dsr-cream-dim);font-variant-numeric:lining-nums tabular-nums}
      .dsr-was .strike{position:absolute;left:-3px;right:-3px;top:50%;height:1px;
        background:linear-gradient(90deg,transparent,rgba(201,192,174,.85) 18% 82%,transparent);pointer-events:none}
      .dsr-now{font-family:var(--dsr-display);font-size:42px;font-weight:600;line-height:1;
        font-variant-numeric:lining-nums tabular-nums}
      .dsr-price-mod{text-align:center;font-size:14.5px;color:var(--dsr-cream-dim);margin-bottom:24px}
      .dsr-total-line{text-align:center;font-size:15px;color:var(--dsr-cream-dim);margin:-14px 0 22px}
      .dsr-total-line b{color:var(--dsr-cream);font-weight:600}

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
        display:block;width:100%;min-height:54px;
        background:var(--dsr-gold-metal);color:var(--dsr-gold-ink);
        border-radius:12px;padding:16px 12px;white-space:nowrap;
        font:600 clamp(15.5px,4.3vw,17px)/1 'Newsreader',Georgia,serif;letter-spacing:.02em;
        box-shadow:0 1px 0 rgba(255,255,255,.4) inset, 0 -1px 0 rgba(0,0,0,.28) inset,
                   0 6px 18px -6px rgba(208,169,82,.45);
        transition:filter .18s ease, box-shadow .18s ease, transform .06s ease}
      .dsr-cta::after{content:"";position:absolute;inset:0;background:var(--dsr-gold-sheen);
        mix-blend-mode:overlay;transform:translateX(-120%);transition:transform .5s ease}
      .dsr-cta:hover{filter:brightness(1.07) saturate(1.05);
        box-shadow:0 1px 0 rgba(255,255,255,.45) inset, 0 -1px 0 rgba(0,0,0,.28) inset,
                   0 10px 26px -6px rgba(208,169,82,.6)}
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
          0 6px 18px -6px rgba(208,169,82,.45), 0 0 22px rgba(212,178,107,.16)}
        38%{box-shadow:0 1px 0 rgba(255,255,255,.45) inset, 0 -1px 0 rgba(0,0,0,.28) inset,
          0 9px 26px -6px rgba(208,169,82,.58), 0 0 38px rgba(212,178,107,.30)}
        63%{box-shadow:0 1px 0 rgba(255,255,255,.42) inset, 0 -1px 0 rgba(0,0,0,.28) inset,
          0 7px 22px -6px rgba(208,169,82,.5), 0 0 28px rgba(212,178,107,.22)}
      }

      .dsr-error{margin:10px 0 0;text-align:center;font-size:14.5px;color:#e8b4b4}

      .dsr-guarantee{font-family:var(--dsr-display);font-style:italic;
        font-variation-settings:'opsz' 20;font-size:17.5px;line-height:1.5;
        color:var(--dsr-cream);text-align:center;margin:20px 6px 24px}

      /* ---------- promo code (demoted) ---------- */
      .dsr-code{text-align:center;margin-bottom:22px}
      .dsr-code-link{background:none;border:0;cursor:pointer;padding:6px 8px;
        font-family:var(--dsr-body);font-size:14px;color:var(--dsr-violet-300);
        text-decoration:underline;text-underline-offset:3px;text-decoration-color:rgba(139,123,216,.5)}
      .dsr-code-row{display:flex;gap:8px;align-items:stretch}
      .dsr-code-row .dsr-field{flex:1}
      .dsr-code-row .dsr-field input{text-transform:uppercase;min-height:44px}
      .dsr-code-apply{flex:none;min-height:44px;padding:0 18px;border:0;border-radius:10px;cursor:pointer;
        background:var(--dsr-surface-3);color:var(--dsr-violet-100);
        font-family:var(--dsr-body);font-weight:600;font-size:15px;
        box-shadow:0 0 0 1px rgba(139,123,216,.4) inset}
      .dsr-code-apply:disabled{opacity:.55;cursor:default}
      .dsr-code-applied{font-size:14.5px;color:var(--dsr-cream-dim)}
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
      .dsr-disc-body{padding:2px 2px 18px;font-size:15.5px;color:var(--dsr-cream-dim)}
      .dsr-disc-body ul{list-style:none;margin:0;padding:0}
      .dsr-disc-body li{position:relative;padding:5px 0 5px 22px}
      .dsr-disc-body li::before{content:"";position:absolute;left:2px;top:13px;
        width:5px;height:5px;border-radius:50%;background:var(--dsr-violet-500)}
      .dsr-tag{display:inline-block;margin-left:8px;
        font-size:10.5px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;
        color:var(--dsr-violet-300);
        box-shadow:0 0 0 1px rgba(139,123,216,.4) inset;
        border-radius:99px;padding:1px 8px 2px;vertical-align:2px}

      /* steppers */
      .dsr-stepper{display:flex;align-items:center;gap:16px;margin:6px 0 12px}
      .dsr-stepper button{position:relative;width:44px;height:44px;flex:none;
        background:var(--dsr-surface-3);border:0;border-radius:10px;color:var(--dsr-cream);
        font-size:22px;font-family:var(--dsr-body);line-height:1;cursor:pointer;
        box-shadow:0 1px 0 rgba(247,231,182,.05) inset, 0 2px 8px rgba(0,0,0,.35)}
      .dsr-stepper button::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;
        background:linear-gradient(165deg, rgba(139,123,216,.45), rgba(139,123,216,.15));
        -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
        -webkit-mask-composite:xor;mask-composite:exclude}
      .dsr-stepper button:active{background:#322b52}
      .dsr-stepper .qty{font-size:17px;color:var(--dsr-cream);min-width:110px;text-align:center}
      .dsr-saving-line{font-size:15.5px;color:var(--dsr-cream-dim)}
      .dsr-saving-line b{color:var(--dsr-cream);font-weight:600}

      /* ---------- trust ---------- */
      .dsr-trust-line{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;
        font-size:13.5px;color:var(--dsr-cream-dim);margin:22px 0 14px;text-align:center}
      .dsr-trust-line span::after{content:"·";margin-left:8px;color:rgba(139,123,216,.5)}
      .dsr-trust-line span:last-child::after{content:""}
      .dsr-fx-note{text-align:center;font-size:12.5px;color:var(--dsr-cream-dim);margin:0 0 14px}

      .dsr-pay-row{display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap;margin-bottom:18px}
      .dsr-pay-chip{display:inline-flex;align-items:center;justify-content:center;
        height:30px;padding:0 10px;border-radius:8px;
        background:linear-gradient(180deg,rgba(255,255,255,.97),rgba(243,243,246,.92));
        border:1px solid rgba(255,255,255,.16);
        box-shadow:0 1px 0 rgba(255,255,255,.25) inset, 0 2px 6px rgba(0,0,0,.35)}
      .dsr-pay-chip--dark{
        background:linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.05));
        backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
        border:1px solid rgba(255,255,255,.14);
        box-shadow:0 1px 0 rgba(255,255,255,.10) inset}
      .dsr-pay-chip svg{height:14px;width:auto;display:block}
      .dsr-pay-chip--dark svg{height:15px}

      /* charity */
      .dsr-charity{text-align:center;font-size:13.5px;color:var(--dsr-cream-dim)}
      .dsr-charity::before{display:none}
      .dsr-charity summary{justify-content:center;gap:8px;min-height:44px;
        font-size:13.5px;color:var(--dsr-cream-dim)}
      .dsr-charity summary .cname{color:var(--dsr-violet-200)}
      .dsr-charity-opts{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;padding-bottom:14px}
      .dsr-charity-opts button{position:relative;min-height:44px;padding:8px 14px;
        background:var(--dsr-surface-2);border:0;border-radius:99px;color:var(--dsr-cream-dim);
        font-family:var(--dsr-body);font-size:13.5px;cursor:pointer}
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

      /* ---------- reduced motion ---------- */
      @media (prefers-reduced-motion: reduce){
        .dsr-root *, .dsr-root *::before, .dsr-root *::after{transition-duration:.01ms!important;animation:none!important}
        .dsr-cta.is-thread{box-shadow:0 1px 0 rgba(255,255,255,.4) inset, 0 -1px 0 rgba(0,0,0,.28) inset,
          0 6px 18px -6px rgba(208,169,82,.5), 0 0 26px rgba(212,178,107,.2)}
        .dsr-ring,.dsr-chord{stroke-dashoffset:0}
        .dsr-wglyph.lit,.dsr-wlabel,.dsr-glyph-halo{opacity:1}
        .dsr-wglyph.dim{opacity:.7}
        .dsr-rung i{transform:scale(1);opacity:1}
        .dsr-cta::after{display:none}
        .is-bond .dsr-bond-ring{stroke-dashoffset:0}
        .dsr-bond-ring{stroke-dashoffset:1}
      }
    `}</style>
  );
}
