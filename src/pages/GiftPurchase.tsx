import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift, ArrowLeft, Send, LinkIcon, CheckCircle, Plus, Trash2,
  ChevronRight, Users, User, Sparkles, Star, Shield, Clock,
  Cat, Dog, Fish, Rabbit, Bird, Turtle, PawPrint, Bone, Feather,
  Orbit, Lock, CalendarDays, CalendarHeart, ScrollText, BookOpen, PenLine,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLocalizedPrice } from '@/hooks/useLocalizedPrice';
import gsap from 'gsap';

type DeliveryMethod = 'email' | 'link';
type GiftTier = 'essential' | 'portrait';

type GiftOccasion = 'discover' | 'new' | 'memorial' | 'birthday';

interface GiftRecipient {
  id: string;
  name: string;
  email: string;
  // Gifter can pre-specify what kind of reading this recipient gets.
  // Defaults to 'discover' so legacy behaviour is unchanged; buyer changes
  // it per recipient if they're gifting a new-pet or memorial reading.
  occasion?: GiftOccasion;
}

const GIFT_OCCASION_OPTIONS: Array<{ value: GiftOccasion; emoji: string; label: string; hint: string }> = [
  { value: 'discover', emoji: '🔮', label: 'Discover', hint: 'For a pet they already have' },
  { value: 'new', emoji: '🌱', label: 'New Pet', hint: 'They just got a new pet' },
  { value: 'memorial', emoji: '🕊️', label: 'Memorial', hint: 'They lost a beloved pet' },
  { value: 'birthday', emoji: '🎂', label: 'Birthday', hint: 'Celebrating their pet' },
];

const C = {
  cream: '#0d0a14', cream2: 'rgba(245,239,230,0.05)', cream3: 'rgba(212,182,122,0.22)',
  ink: '#f5efe6', deep: '#f5efe6', warm: '#cfc1b1', earth: '#cfc1b1', muted: '#9d8d7f',
  rose: '#d4b67a', roseGlow: 'rgba(212,182,122,0.20)',
  gold: '#d4b67a', goldSoft: 'rgba(212,182,122,0.15)',
  green: '#4a8c5c',
};

// Prices come from useLocalizedPrice() at render time — this const only
// holds static copy. Price mapping: essential → prices.basic/wasBasic,
// portrait → prices.premium/wasPremium.
const TIERS = {
  essential: {
    label: 'Soul Reading',
    tagline: 'The reading they\'ll keep coming back to.',
    badge: null as string | null,
    badgeColor: C.rose,
    features: [
      'A 30-section reading written for their pet',
      'Their pet\'s photo, woven into the reveal',
      'Theirs forever — on any device',
    ],
  },
  portrait: {
    label: 'Soul Bond',
    tagline: 'Them and their pet, read side by side.',
    badge: 'MOST CHOSEN' as string | null,
    badgeColor: C.rose,
    popular: true,
    features: [
      'Everything in Soul Reading, plus:',
      'Their chart against their pet\'s — why the universe paired them',
      'The soul-reasons they found each other',
    ],
  },
} as const;

// ─── Occasion-specific tier overrides ─────────────────────────────────
//
// Different occasions call for different tier framing — Memorial isn't
// about "bonding" language, a gift for a new pet leans into "welcome
// them into the family", birthday leans celebratory, etc. This table
// overrides the default TIERS copy at render time so each occasion
// presents its own version of the same underlying product.
//
// Memorial intentionally has NO `essential` entry — the memorial product
// is one single offering at the Soul Bond price (£49), matching the
// main funnel which never shows a tier choice for memorial either.
type TierContent = {
  label: string;
  tagline: string;
  badge: string | null;
  features: readonly string[];
};
type OccasionTiers = Partial<Record<TierKey, TierContent>>;

const OCCASION_TIERS: Record<GiftOccasion, OccasionTiers> = {
  new: {
    essential: {
      label: 'The Welcome Reading',
      tagline: 'For the new soul they just brought home.',
      badge: null,
      features: [
        'Who this pet actually is — before they even know themselves',
        'Why this pet landed in their life now',
        'Theirs forever — on any device',
      ],
    },
    portrait: {
      label: 'The Welcome Bond',
      tagline: 'The pairing the universe just made — written in full.',
      badge: 'MOST GIFTED',
      features: [
        'Everything in the Welcome Reading, plus:',
        'Their chart × their pet\'s — why the stars paired them now',
        'The first-chapter bond, written in full',
      ],
    },
  },
  discover: {
    essential: {
      label: 'The Discover Reading',
      tagline: 'The pet they\'ve loved for years, finally written down.',
      badge: null,
      features: [
        'The quirks they\'ve always sensed — finally named',
        'Their pet\'s photo, woven into the reveal',
        'Theirs forever — on any device',
      ],
    },
    portrait: {
      label: 'The Discover Bond',
      tagline: 'Them and their pet, read side by side. The proof it was meant to be.',
      badge: 'MOST GIFTED',
      features: [
        'Everything in the Discover Reading, plus:',
        'Their chart × their pet\'s — the cosmic reason this bond exists',
        'The answer to the question they\'ve always wondered',
      ],
    },
  },
  memorial: {
    portrait: {
      label: 'The Memorial Reading',
      tagline: 'For the pet who\'s gone — and the person still talking to them.',
      badge: 'A TRIBUTE',
      features: [
        'Honours the pet they lost. Not the loss.',
        'Their chart × their pet\'s — the bond that didn\'t end',
        'Theirs forever — a keepsake for the hard days',
      ],
    },
  },
  birthday: {
    essential: {
      label: 'The Birthday Reading',
      tagline: 'For the pet whose birthday matters more than their own.',
      badge: null,
      features: [
        'A reading written for who their pet actually is',
        'The year ahead — written by the stars',
        'Theirs forever — on any device',
      ],
    },
    portrait: {
      label: 'The Birthday Bond',
      tagline: 'Birthday gift + soulmate proof. Them and their pet, side by side.',
      badge: 'MOST GIFTED',
      features: [
        'Everything in the Birthday Reading, plus:',
        'Their chart × their pet\'s — how their souls celebrate together',
        'The cosmic reason this bond began',
      ],
    },
  },
};

// Desire-framed kicker above tier cards. Tells the gifter what the
// recipient will DO with it — not what it is.
const OCCASION_TIER_KICKER: Record<GiftOccasion, string> = {
  new:      'What they\'ll open first',
  discover: "What they'll read twice",
  memorial: 'What they\'ll return to on the hard days',
  birthday: 'What makes this birthday the one',
};

// Subtle visual accent per occasion — a soft coloured hairline that
// frames the tier cards so they don't feel like carbon copies across
// occasions. Kept minimal so the cream/rose/gold brand palette still
// dominates.
const OCCASION_ACCENT: Record<GiftOccasion, { ring: string; badge: string }> = {
  new:      { ring: 'rgba(74,140,92,0.28)',   badge: '#4a8c5c' }, // green (fresh beginning)
  discover: { ring: 'rgba(139,92,172,0.28)',  badge: '#8b5cac' }, // violet (mystery/reveal)
  memorial: { ring: 'rgba(212,182,122,0.42)', badge: '#d4b67a' }, // gold (sacred, honouring)
  birthday: { ring: 'rgba(217,119,60,0.30)',  badge: '#d9773c' }, // amber (celebration)
};

type TierKey = keyof typeof TIERS;

const getVolumeDiscount = (count: number): number => {
  if (count >= 5) return 0.30;
  if (count >= 4) return 0.25;
  if (count >= 3) return 0.20;
  if (count >= 2) return 0.15;
  return 0;
};

function StarRow({ n = 5 }: { n?: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[...Array(n)].map((_, i) => <Star key={i} style={{ width: 13, height: 13, fill: C.gold, color: C.gold }} />)}
    </div>
  );
}

/* ── Wallpaper — scattered Lucide pet icons matching the landing page ── */
type PetItem = { x: number; y: number; size: number; rot: number; op: number; Icon: typeof Cat };
const WALLPAPER_PETS: PetItem[] = [
  { x: 4,  y: 6,  size: 30, rot: -12, op: 0.16, Icon: Cat },
  { x: 18, y: 4,  size: 22, rot: 10,  op: 0.13, Icon: PawPrint },
  { x: 32, y: 9,  size: 28, rot: 6,   op: 0.15, Icon: Rabbit },
  { x: 46, y: 3,  size: 26, rot: -8,  op: 0.14, Icon: Bird },
  { x: 60, y: 8,  size: 32, rot: 14,  op: 0.17, Icon: Dog },
  { x: 74, y: 4,  size: 24, rot: -14, op: 0.13, Icon: Feather },
  { x: 88, y: 9,  size: 28, rot: 8,   op: 0.15, Icon: Fish },
  { x: 10, y: 22, size: 34, rot: 6,   op: 0.17, Icon: Turtle },
  { x: 26, y: 28, size: 22, rot: -10, op: 0.13, Icon: Bone },
  { x: 42, y: 22, size: 30, rot: 16,  op: 0.16, Icon: Cat },
  { x: 58, y: 26, size: 26, rot: -6,  op: 0.14, Icon: Bird },
  { x: 74, y: 22, size: 28, rot: 12,  op: 0.15, Icon: PawPrint },
  { x: 92, y: 28, size: 24, rot: -16, op: 0.13, Icon: Rabbit },
  { x: 6,  y: 44, size: 26, rot: -10, op: 0.14, Icon: Dog },
  { x: 22, y: 48, size: 32, rot: 14,  op: 0.17, Icon: PawPrint },
  { x: 38, y: 42, size: 24, rot: -8,  op: 0.13, Icon: Fish },
  { x: 54, y: 48, size: 30, rot: 10,  op: 0.16, Icon: Cat },
  { x: 70, y: 44, size: 28, rot: -14, op: 0.15, Icon: Feather },
  { x: 86, y: 48, size: 26, rot: 6,   op: 0.14, Icon: Rabbit },
  { x: 4,  y: 64, size: 22, rot: 12,  op: 0.13, Icon: Bone },
  { x: 18, y: 68, size: 28, rot: -8,  op: 0.15, Icon: Bird },
  { x: 32, y: 64, size: 24, rot: 14,  op: 0.13, Icon: Turtle },
  { x: 48, y: 70, size: 30, rot: -12, op: 0.16, Icon: Dog },
  { x: 64, y: 64, size: 26, rot: 8,   op: 0.14, Icon: PawPrint },
  { x: 78, y: 68, size: 28, rot: -6,  op: 0.15, Icon: Cat },
  { x: 94, y: 64, size: 22, rot: 10,  op: 0.12, Icon: Fish },
  { x: 8,  y: 86, size: 28, rot: 10,  op: 0.15, Icon: Rabbit },
  { x: 24, y: 90, size: 22, rot: -12, op: 0.13, Icon: PawPrint },
  { x: 42, y: 86, size: 30, rot: 6,   op: 0.16, Icon: Bird },
  { x: 60, y: 92, size: 26, rot: -8,  op: 0.14, Icon: Dog },
  { x: 78, y: 88, size: 32, rot: 14,  op: 0.17, Icon: Cat },
  { x: 92, y: 92, size: 24, rot: -6,  op: 0.13, Icon: Bone },
];

function WallpaperBackdrop() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(ellipse 90% 80% at 50% 0%, ${C.cream2} 0%, ${C.cream} 60%)`,
      }}
    >
      {WALLPAPER_PETS.map((p, i) => (
        <p.Icon
          key={i}
          style={{
            position: 'absolute',
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size,
            color: C.muted,
            opacity: p.op,
            transform: `rotate(${p.rot}deg)`,
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   GIFT PAGE v7 — approved moonlit presentation.
   These components render the marketing shell (moonlit sky, hero,
   trust, three steps, wax-envelope reveal, gift experience, proof,
   reassurance, closing, footer). The interactive purchase funnel
   (occasion picker + selectable tier cards + 3-step flow) is preserved
   below and rendered INSIDE this shell. Fonts: Playfair Display +
   Newsreader. Navy #0d0a14 / gold #d4b67a / ivory #f4ece0.
   ═══════════════════════════════════════════════════════════════════ */

const GIFT7 = {
  moon: 'https://content.littlesouls.app/viral-pet-media/giftart/moon-full.webp',
  seal: 'https://content.littlesouls.app/viral-pet-media/giftart/wax-seal-blank.webp',
  foil: 'https://content.littlesouls.app/viral-pet-media/giftart/gold-foil-tile.webp',
  // Same-origin breed assets (ship in public/breeds → dist/breeds). Relative
  // so they always resolve against whatever origin serves the app, with no
  // cross-subdomain DNS dependency on a revenue page.
  bella: '/breeds/cockapoo.jpg',
  review: {
    golden: '/breeds/golden-retriever.jpg',
    collie: '/breeds/border-collie.jpg',
    aussie: '/breeds/australian-shepherd.jpg',
    siamese: '/breeds/siamese.jpg',
  },
};

function MoonlitSky() {
  return (
    <div className="sky" aria-hidden="true">
      <span className="moon-wrap">
        <img className="moon" src={GIFT7.moon} alt="" decoding="async" loading="lazy" />
      </span>
    </div>
  );
}

/* ── hero device: the pet's natal-chart wheel, drawn glyph-free ── */
const SVGNS = 'http://www.w3.org/2000/svg';
function svgEl(name: string, attrs: Record<string, string | number>) {
  const n = document.createElementNS(SVGNS, name);
  for (const k in attrs) n.setAttribute(k, String(attrs[k]));
  return n;
}
function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
}
function buildChart(svg: SVGSVGElement) {
  svg.innerHTML = '';
  const GOLD = '#d4b67a';
  const cx = 150, cy = 150, rOut = 140, rBand = 120, rInner = 92, rHub = 20;
  svg.appendChild(svgEl('circle', { cx, cy, r: rOut, fill: '#0d0a14' }));
  [rOut, rBand, rInner].forEach((r, i) => {
    svg.appendChild(svgEl('circle', { cx, cy, r, fill: 'none', stroke: GOLD, 'stroke-width': i === 0 ? 1.2 : 0.8, 'stroke-opacity': i === 0 ? 0.55 : 0.32 }));
  });
  for (let s = 0; s < 12; s++) {
    const deg = s * 30;
    const a = polar(cx, cy, rBand, deg), b = polar(cx, cy, rOut, deg);
    svg.appendChild(svgEl('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: GOLD, 'stroke-width': 0.8, 'stroke-opacity': 0.45 }));
    const mid = deg + 15;
    const seeds: [number, number][] = [[mid - 7, 130], [mid + 4, 134], [mid + 9, 127]];
    let path = '';
    seeds.forEach((sd, j) => {
      const p = polar(cx, cy, sd[1], sd[0]);
      svg.appendChild(svgEl('circle', { cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: 0.9, fill: GOLD, 'fill-opacity': 0.7 }));
      path += (j === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ' ';
    });
    svg.appendChild(svgEl('path', { d: path, fill: 'none', stroke: GOLD, 'stroke-width': 0.5, 'stroke-opacity': 0.28 }));
  }
  for (let t = 0; t < 12; t++) {
    const d2 = t * 30 + 15;
    const ia = polar(cx, cy, rInner, d2), ib = polar(cx, cy, rBand, d2);
    svg.appendChild(svgEl('line', { x1: ia[0], y1: ia[1], x2: ib[0], y2: ib[1], stroke: GOLD, 'stroke-width': 0.5, 'stroke-opacity': 0.16 }));
  }
  const planets = [22, 74, 130, 168, 214, 262, 310, 344];
  const radii = [70, 84, 62, 88, 66, 80, 58, 86];
  const pts: [number, number][] = planets.map((deg, i) => polar(cx, cy, radii[i], deg));
  const aspects = [[0, 3], [1, 5], [2, 6], [4, 7], [0, 5], [3, 6]];
  aspects.forEach((pair) => {
    const u = pts[pair[0]], v = pts[pair[1]];
    svg.appendChild(svgEl('line', { x1: u[0].toFixed(1), y1: u[1].toFixed(1), x2: v[0].toFixed(1), y2: v[1].toFixed(1), stroke: GOLD, 'stroke-width': 0.5, 'stroke-opacity': 0.22 }));
  });
  pts.forEach((pp) => {
    svg.appendChild(svgEl('circle', { cx: pp[0].toFixed(1), cy: pp[1].toFixed(1), r: 4.6, fill: '#0d0a14', stroke: GOLD, 'stroke-width': 0.9, 'stroke-opacity': 0.8 }));
    svg.appendChild(svgEl('circle', { cx: pp[0].toFixed(1), cy: pp[1].toFixed(1), r: 1.7, fill: GOLD, 'fill-opacity': 0.9 }));
  });
  svg.appendChild(svgEl('circle', { cx, cy, r: rHub, fill: 'none', stroke: GOLD, 'stroke-width': 0.7, 'stroke-opacity': 0.4 }));
  svg.appendChild(svgEl('circle', { cx, cy, r: 4.5, fill: GOLD, 'fill-opacity': 0.92 }));
  for (let ray = 0; ray < 12; ray++) {
    const rd = ray * 30;
    const ra = polar(cx, cy, 8, rd), rb = polar(cx, cy, 14, rd);
    svg.appendChild(svgEl('line', { x1: ra[0].toFixed(1), y1: ra[1].toFixed(1), x2: rb[0].toFixed(1), y2: rb[1].toFixed(1), stroke: GOLD, 'stroke-width': 0.7, 'stroke-opacity': 0.5 }));
  }
}

function Stars({ n = 5 }: { n?: number }) {
  return (
    <span className="stars" aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => <Star key={i} className="lucide" />)}
    </span>
  );
}

function HeroDevice() {
  const chartRef = useRef<SVGSVGElement>(null);
  useEffect(() => { if (chartRef.current) buildChart(chartRef.current); }, []);
  return (
    <div className="device-stage">
      <div className="device">
        <div className="screen">
          <div className="notch" />
          <p className="cover-kicker">A Soul Reading</p>
          <div className="cover-av-wrap">
            <img className="cover-av" src={GIFT7.bella} alt="Bella the cockapoo" width={72} height={72} loading="eager" decoding="async" />
          </div>
          <h3 className="cover-name">Bella</h3>
          <p className="cover-sign">Sun in Leo</p>
          <div className="chartwrap">
            <svg ref={chartRef} className="chart" viewBox="0 0 300 300" role="img" aria-label="A pet's natal birth chart wheel" />
          </div>
          <div className="screen-foot">
            <div className="sf-row"><span className="sf-label">Dominant element</span><span className="sf-val">Fire</span></div>
            <div className="sf-row"><span className="sf-label">Soul archetype</span><span className="sf-val">The Companion</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

type CtaFonts = { fmt: (c: number) => string; prices: { basic: number; wasBasic: number }; onCta: () => void };

function Hero({ fmt, prices, onCta }: CtaFonts) {
  return (
    <header className="hero band wrap">
      <div className="hero-grid">
        <div className="hero-copy">
          <p className="eyebrow reveal">A gift for someone who loves their dog or cat</p>
          <h1 className="reveal">Finally, a gift as deep as their <em>devotion</em>.</h1>
          <p className="define reveal">A soul reading built from their pet's <b>real birth chart</b>, opened as a private reveal they keep forever.</p>
          <div className="cta-row reveal">
            <button type="button" className="btn" onClick={onCta}>Gift a Soul Reading</button>
            <p className="price-note">from <span className="price">{fmt(prices.basic)}</span><span className="was">{fmt(prices.wasBasic)}</span></p>
          </div>
          <div className="rating reveal" style={{ marginTop: 18 }}>
            <Stars />
            <span>Loved by people who gift it</span>
          </div>
        </div>
        <HeroDevice />
      </div>
    </header>
  );
}

function TrustStrip() {
  return (
    <section className="trust" data-section>
      <div className="wrap trust-in">
        <div className="badges sreveal">
          <span className="badge"><span className="ic" aria-hidden="true"><Orbit className="lucide" /></span>Built on their pet's real chart</span>
          <span className="badge"><span className="ic" aria-hidden="true"><Lock className="lucide" /></span>A private reveal, not an inbox</span>
          <span className="badge"><span className="ic" aria-hidden="true"><CalendarDays className="lucide" /></span>Valid for a full year</span>
        </div>
      </div>
    </section>
  );
}

function StepsSection() {
  return (
    <section className="band wrap" data-section>
      <div className="shead sreveal">
        <h2>Three quiet steps</h2>
        <p>From your sofa to theirs. <strong>No parcels, no postage.</strong></p>
      </div>
      <div className="steps">
        <div className="step sreveal">
          <span className="ic" aria-hidden="true"><BookOpen className="lucide" /></span>
          <div><p className="n">One</p><h3>Choose their reading</h3></div>
        </div>
        <div className="step sreveal">
          <span className="ic" aria-hidden="true"><PenLine className="lucide" /></span>
          <div><p className="n">Two</p><h3>Write your note</h3></div>
        </div>
        <div className="step sreveal">
          <span className="ic" aria-hidden="true"><Send className="lucide" /></span>
          <div><p className="n">Three</p><h3>Give it your way: link, card, or in person</h3></div>
        </div>
      </div>
    </section>
  );
}

function GiftExperience() {
  return (
    <section className="band wrap" data-section>
      <div className="shead sreveal">
        <h2>A gift that arrives like a moment</h2>
        <p>The part <strong>no card or parcel</strong> can do.</p>
      </div>
      <div className="cues">
        <div className="cue sreveal">
          <span className="ic" aria-hidden="true"><Gift className="lucide" /></span>
          <div><h3>Give it your way</h3><p>A private link to text, slip in a card, or hand over. Or emailed to them.</p></div>
        </div>
        <div className="cue sreveal">
          <span className="ic" aria-hidden="true"><CalendarHeart className="lucide" /></span>
          <div><h3>Valid a full year</h3><p>Give it whenever you like. No postage, no cutoff.</p></div>
        </div>
        <div className="cue sreveal">
          <span className="ic" aria-hidden="true"><ScrollText className="lucide" /></span>
          <div><h3>They open it like a reveal</h3><p>They add their pet, and the reading unfolds as a private page.</p></div>
        </div>
      </div>
    </section>
  );
}

function Proof() {
  const reviews = [
    { img: GIFT7.review.golden, alt: "Ryan's golden retriever", quote: "I said 'that's her' on the first line. Then it told me why she follows me room to room. I'd never worked that out.", name: 'Ryan', city: 'Austin' },
    { img: GIFT7.review.collie, alt: "Anna's border collie", quote: 'Nine years with this dog, and it still told me something about her I never knew.', name: 'Anna', city: 'Portland' },
    { img: GIFT7.review.aussie, alt: "Liam's Australian shepherd", quote: "It put words to what I'd always felt about him but could never explain.", name: 'Liam', city: 'Cork' },
    { img: GIFT7.review.siamese, alt: "Emily's Siamese cat", quote: "I know her by heart. It knew the parts even I'd missed.", name: 'Emily', city: 'Toronto' },
  ];
  return (
    <section className="band wrap" data-section>
      <div className="shead sreveal"><h2>What people say after they give it</h2></div>
      <div className="proof">
        {reviews.map((r, i) => (
          <figure className="quote sreveal" key={i}>
            <span className="mark" aria-hidden="true">&#8220;</span>
            <blockquote>{r.quote}</blockquote>
            <figcaption className="who">
              <img className="who-av" src={r.img} alt={r.alt} width={46} height={46} loading="lazy" decoding="async" />
              <span className="who-meta"><span className="nm">{r.name}</span><span className="ct">{r.city}</span></span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function Reassurance() {
  return (
    <section className="band wrap" data-section>
      <div className="reassure sreveal">
        <p className="guarantee">Read from their pet's real chart. If it does not feel like them, we make it right.</p>
        <dl className="faq">
          <dt>Do I need their pet's details?</dt>
          <dd>No. They add their pet's name, birth date and photo when they open it.</dd>
        </dl>
      </div>
    </section>
  );
}

function Closing({ fmt, prices, onCta }: CtaFonts) {
  return (
    <section className="band wrap closing" data-section>
      <h2 className="sreveal">Give the reading written in their stars.</h2>
      <div className="cta-row sreveal">
        <button type="button" className="btn" onClick={onCta}>Gift a Soul Reading</button>
        <p className="price-note">from <span className="price">{fmt(prices.basic)}</span><span className="was">{fmt(prices.wasBasic)}</span></p>
      </div>
      <div className="rating sreveal" style={{ justifyContent: 'center', marginTop: 20 }}>
        <Stars />
        <span>Loved by people who gift it</span>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="foot wrap">
      <span>Little Souls</span>
      <span className="foot-hair" aria-hidden="true" />
      <span>read from the day their soul arrived</span>
    </footer>
  );
}

/* ── The wax-envelope reveal. Tap the seal, the flap unfolds, the letter
   slides out and the sample reading settles in. Self-contained GSAP
   timeline built on refs. Honours reduced-motion (opens instantly) and
   degrades to a visible reading if GSAP is unavailable. ── */
function EnvelopeReveal() {
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const readingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const btn = btnRef.current;
    const reading = readingRef.current;
    if (!root || !btn || !reading) return;

    const seal = btn.querySelector<HTMLElement>('.seal');
    const glow = btn.querySelector<HTMLElement>('.seal-glow');
    const flap = root.querySelector<HTMLElement>('.flap');
    const paper = root.querySelector<HTMLElement>('.paper');
    const envWrap = root.querySelector<HTMLElement>('.env-wrap');
    const invite = root.querySelector<HTMLElement>('.invite');
    const kicker = root.querySelector<HTMLElement>('.gift-kicker');

    // Missing a core piece? Degrade gracefully: show the reading.
    if (!seal || !glow || !flap || !paper || !envWrap) {
      reading.style.display = 'block';
      return;
    }

    const DECEL = 'cubic-bezier(0.05,0.7,0.1,1)';
    let opened = false;
    let idleTween: gsap.core.Timeline | null = null;
    let master: gsap.core.Timeline | null = null;

    const buildSealed = () => {
      gsap.set(flap, { rotateX: 0, transformOrigin: '50% 0%' });
      gsap.set(seal, { yPercent: 0, scale: 1, opacity: 1, transformOrigin: '50% 50%' });
      gsap.set(paper, { yPercent: 0, scale: 0.96, opacity: 0 });
      reading.style.display = 'none';
      gsap.set(reading, { opacity: 0 });
    };
    const startIdle = () => {
      idleTween = gsap.timeline({ repeat: -1, yoyo: true });
      idleTween.to(seal, { scale: 1.018, duration: 1.9, ease: 'sine.inOut' }, 0)
               .to(glow, { opacity: 0.85, duration: 1.9, ease: 'sine.inOut' }, 0);
    };
    const revealReading = () => {
      reading.style.display = 'block';
      void reading.offsetHeight;
      root.classList.add('is-open');
      const tlr = gsap.timeline();
      tlr.fromTo(reading, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, ease: DECEL }, 0);
      tlr.fromTo(reading.querySelectorAll('.rv'), { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.62, stagger: 0.12, ease: DECEL }, 0.1);
      tlr.fromTo(reading.querySelectorAll('.loop'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: DECEL }, 0.72);
      tlr.add(() => { try { kicker?.focus({ preventScroll: true }); } catch { kicker?.focus(); } }, 0.7);
    };
    const buildMaster = () => {
      master = gsap.timeline({ paused: true });
      master.to(seal, { scale: 1.03, duration: 0.16, ease: DECEL }, 0)
            .to(seal, { yPercent: -10, scale: 1.12, opacity: 0, duration: 0.42, ease: DECEL }, '>-0.02')
            .to(glow, { opacity: 0, duration: 0.46, ease: DECEL }, '<');
      master.addLabel('flap', 0.24);
      master.to(flap, { rotateX: -165, duration: 0.74, ease: DECEL }, 'flap');
      master.add(() => { flap.style.zIndex = '0'; }, 'flap+=0.34');
      master.addLabel('letter', 'flap+=0.56');
      master.fromTo(paper, { yPercent: 0, scale: 0.96, opacity: 0 }, { yPercent: -46, scale: 1, opacity: 1, duration: 0.5, ease: DECEL }, 'letter');
      master.to(paper, { yPercent: -94, opacity: 0, duration: 0.5, ease: DECEL }, 'letter+=0.5');
      master.to(envWrap, { scale: 0.9, opacity: 0.32, y: -10, duration: 0.7, ease: DECEL }, 'letter+=0.08');
      master.to(invite, { opacity: 0, y: -8, duration: 0.4, ease: DECEL }, 'letter');
      master.add(revealReading, 'letter+=0.42');
    };
    const openInstant = () => {
      opened = true;
      btn.setAttribute('aria-expanded', 'true');
      reading.style.display = 'block';
      gsap.set(reading, { opacity: 1 });
      root.classList.add('is-open');
    };
    const haptic = () => { try { if (navigator.vibrate) navigator.vibrate([10, 40, 16]); } catch { /* noop */ } };
    const onActivate = () => {
      if (opened || !master) return;
      opened = true;
      if (idleTween) idleTween.kill();
      gsap.set(seal, { scale: 1 });
      haptic();
      btn.setAttribute('aria-expanded', 'true');
      master.play();
    };
    const onDown = () => { if (!opened) gsap.to(seal, { scale: 0.97, duration: 0.14, ease: DECEL }); };
    const onUp = () => { if (!opened) gsap.to(seal, { scale: 1, duration: 0.2, ease: DECEL }); };
    const onCtx = (e: Event) => e.preventDefault();

    btn.addEventListener('click', onActivate);
    btn.addEventListener('pointerdown', onDown);
    btn.addEventListener('pointerup', onUp);
    btn.addEventListener('contextmenu', onCtx);

    let mm: ReturnType<typeof gsap.matchMedia> | null = null;
    try {
      mm = gsap.matchMedia();
      mm.add({ reduce: '(prefers-reduced-motion: reduce)', full: '(prefers-reduced-motion: no-preference)' }, (ctx) => {
        if (ctx.conditions && ctx.conditions.reduce) { openInstant(); }
        else { buildSealed(); buildMaster(); startIdle(); }
      });
    } catch {
      reading.style.display = 'block';
    }

    return () => {
      btn.removeEventListener('click', onActivate);
      btn.removeEventListener('pointerdown', onDown);
      btn.removeEventListener('pointerup', onUp);
      btn.removeEventListener('contextmenu', onCtx);
      if (idleTween) idleTween.kill();
      if (master) master.kill();
      if (mm) mm.revert();
    };
  }, []);

  return (
    <section className="band wrap env-section" data-section>
      <div className="shead sreveal">
        <h2>See what they'll open</h2>
      </div>

      {/* gold-recolourable glyph sprite for the seal stamp (never a Unicode zodiac char) */}
      <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
        <symbol id="gl-leo" viewBox="0 0 64 64">
          <path d="M26 47 a9.5 9.5 0 1 1 9.5 -9.5 c0 -10.5 -2 -18.5 8 -20.5 c9.5 -2 16.5 6.5 14 16 c-1.6 6 -6.6 9.6 -12.4 8.4" fill="none" stroke="currentColor" strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" />
        </symbol>
        <symbol id="gl-paw" viewBox="0 0 64 64">
          <g fill="currentColor">
            <ellipse cx="32" cy="42" rx="13" ry="10.5" />
            <ellipse cx="16" cy="28" rx="5" ry="6.5" />
            <ellipse cx="27" cy="20" rx="5" ry="7" />
            <ellipse cx="38" cy="20" rx="5" ry="7" />
            <ellipse cx="49" cy="28" rx="5" ry="6.5" />
          </g>
        </symbol>
      </svg>

      <div className="scene" ref={rootRef}>
        <div className="env-wrap">
          <div className="env">
            <div className="env-body" aria-hidden="true" />
            <div className="paper" aria-hidden="true" />

            <button
              type="button"
              className="seal-btn"
              ref={btnRef}
              aria-expanded="false"
              aria-controls="gift-reading"
              aria-label="Break the seal to open Bella's reading"
            >
              <span className="seal-glow" aria-hidden="true" />
              <span className="seal" aria-hidden="true">
                <img className="seal-img" alt="" src={GIFT7.seal} />
                <span className="stamp">
                  <svg className="glyph" viewBox="0 0 64 64" aria-hidden="true"><use href="#gl-leo" /></svg>
                  <svg className="paw" viewBox="0 0 64 64" aria-hidden="true"><use href="#gl-paw" /></svg>
                </span>
              </span>
            </button>

            <div className="flap" aria-hidden="true">
              <div className="flap-face front" />
              <div className="flap-face back">
                <img className="foil" alt="" src={GIFT7.foil} />
              </div>
            </div>
          </div>
        </div>

        <div className="invite">
          <p className="hint">Made for Bella. Press the seal.</p>
          <span className="env-cue">Break the seal to open Bella&rsquo;s reading</span>
        </div>

        <div className="reading" id="gift-reading" ref={readingRef} role="region" aria-label="A sample reading">
          <div className="keepsake">
            <p className="gift-kicker rv" tabIndex={-1}>The moment they open it, for their own dog or cat.</p>

            <div className="portrait rv">
              <span className="glowfield" aria-hidden="true">
                <span className="halo" />
                <svg viewBox="0 0 100 100" aria-hidden="true">
                  <circle className="star" cx="18" cy="20" r="0.9" opacity="0.8" />
                  <circle className="star" cx="40" cy="8" r="0.6" opacity="0.5" />
                  <circle className="star" cx="63" cy="11" r="0.8" opacity="0.65" />
                  <circle className="star" cx="85" cy="24" r="0.7" opacity="0.6" />
                  <circle className="star" cx="90" cy="48" r="0.85" opacity="0.7" />
                  <circle className="star" cx="84" cy="73" r="0.6" opacity="0.5" />
                  <circle className="star" cx="60" cy="88" r="0.75" opacity="0.6" />
                  <circle className="star" cx="33" cy="86" r="0.9" opacity="0.72" />
                  <circle className="star" cx="12" cy="38" r="0.6" opacity="0.5" />
                </svg>
              </span>
              <span className="ring">
                <img src={GIFT7.bella} alt="Bella, a cockapoo, looking up" decoding="async" loading="lazy" />
              </span>
            </div>
            <p className="sample-cap rv">a sample reading</p>

            <div className="env-who rv">
              <h2 className="petname">Bella</h2>
              <span className="petsign">a Leo</span>
            </div>

            <p className="held rv">She came to be your witness.</p>

            <div className="loops rv" role="list" aria-label="What the full reading reveals">
              <div className="loop" role="listitem"><span className="t">Why she picked you</span><span className="lock" aria-hidden="true"><Lock className="lucide" /></span></div>
              <div className="loop" role="listitem"><span className="t">How she loves you</span><span className="lock" aria-hidden="true"><Lock className="lucide" /></span></div>
              <div className="loop" role="listitem"><span className="t">What she needs</span><span className="lock" aria-hidden="true"><Lock className="lucide" /></span></div>
              <div className="loop" role="listitem"><span className="t">When she&rsquo;s scared</span><span className="lock" aria-hidden="true"><Lock className="lucide" /></span></div>
              <div className="loop" role="listitem"><span className="t">The thing no one sees</span><span className="lock" aria-hidden="true"><Lock className="lucide" /></span></div>
            </div>

            <p className="cta-cue rv">Their full reading opens the moment you give it.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

const GIFT7_CSS = `
.g7{
  --navy:#0d0a14;--navy2:#100b18;--card:#17121f;--gold:#d4b67a;--ivory:#f4ece0;
  --muted:#9a938b;--hair:rgba(212,182,122,.20);--hair2:rgba(212,182,122,.34);
  --paper-hi:#fbf5e8;--paper-lo:#eee4cf;--max:1080px;
  color:var(--ivory);
  font-family:"Newsreader",Georgia,serif;font-weight:500;font-size:1.16rem;line-height:1.62;
  -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;
}
.g7 *{box-sizing:border-box}
.g7 main,.g7 header,.g7 footer{position:relative;z-index:1}
.g7 .wrap{max-width:var(--max);margin:0 auto;padding-left:22px;padding-right:22px}
.g7 .band{padding-top:80px;padding-bottom:80px}
.g7 .rule{height:1px;background:linear-gradient(90deg,transparent,var(--hair),transparent);max-width:var(--max);margin:0 auto}
.g7 h1,.g7 h2,.g7 h3,.g7 .disp{font-family:"Playfair Display",Georgia,serif;font-weight:600;letter-spacing:-.01em;line-height:1.08;margin:0}
.g7 .eyebrow{font-family:"Newsreader",serif;font-weight:600;font-size:.96rem;letter-spacing:.22em;text-transform:uppercase;color:var(--muted);margin:0 0 18px}
.g7 .muted{color:var(--muted)}
.g7 .gold{color:var(--gold)}
.g7 strong{font-weight:600;color:var(--ivory)}

.g7 .sky{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;
  background:
    radial-gradient(1.4px 1.4px at 18% 14%, rgba(244,236,224,.55), transparent 60%),
    radial-gradient(1.2px 1.2px at 72% 9%, rgba(212,182,122,.45), transparent 60%),
    radial-gradient(1px 1px at 41% 22%, rgba(244,236,224,.40), transparent 60%),
    radial-gradient(1.3px 1.3px at 88% 30%, rgba(244,236,224,.35), transparent 60%),
    radial-gradient(1px 1px at 9% 44%, rgba(212,182,122,.35), transparent 60%),
    radial-gradient(1.1px 1.1px at 60% 52%, rgba(244,236,224,.30), transparent 60%),
    radial-gradient(1px 1px at 30% 70%, rgba(244,236,224,.28), transparent 60%),
    radial-gradient(1.2px 1.2px at 82% 78%, rgba(212,182,122,.30), transparent 60%),
    radial-gradient(1px 1px at 50% 92%, rgba(244,236,224,.26), transparent 60%),
    radial-gradient(900px 620px at 82% 2%, rgba(212,182,122,.10), transparent 70%),
    radial-gradient(760px 560px at 6% 4%, rgba(74,56,108,.13), transparent 72%),
    linear-gradient(180deg,#16122e 0%,#120e22 22%,#0d0a14 46%,#0d0a14 100%);
}
.g7 .moon-wrap{position:absolute;top:5.5%;right:7%;width:clamp(172px,45vw,214px);aspect-ratio:1/1;pointer-events:none}
.g7 .moon-wrap::after{content:"";position:absolute;inset:-52%;z-index:-1;border-radius:50%;pointer-events:none;
  background:radial-gradient(circle, rgba(212,182,122,.24) 0%, rgba(212,182,122,.08) 38%, transparent 64%)}
.g7 .moon{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:block;opacity:.94;
  -webkit-mask-image:radial-gradient(circle closest-side,#000 68%,rgba(0,0,0,.45) 84%,transparent 100%);
  mask-image:radial-gradient(circle closest-side,#000 68%,rgba(0,0,0,.45) 84%,transparent 100%);
  mix-blend-mode:screen;animation:g7moon 9s ease-in-out infinite}
@keyframes g7moon{0%,100%{opacity:.9}50%{opacity:1}}

.g7 .hero-copy{position:relative}
.g7 .hero-copy::before{content:"";position:absolute;z-index:-1;pointer-events:none;
  inset:-34px -12px -20px -12px;border-radius:30px;
  background:radial-gradient(125% 122% at 50% 20%, rgba(13,10,20,.94) 0%, rgba(13,10,20,.82) 44%, rgba(13,10,20,.36) 74%, rgba(13,10,20,0) 100%)}

.g7 svg.lucide{stroke:var(--gold);stroke-width:1.6;width:24px;height:24px;display:block;fill:none}

.g7 .hero{padding-top:44px;padding-bottom:40px}
.g7 .hero-grid{display:flex;flex-direction:column;gap:40px;align-items:center}
.g7 .hero-copy{width:100%;max-width:560px}
.g7 .hero h1{font-size:clamp(2.55rem,8.6vw,4.15rem);line-height:1.06}
.g7 .hero h1 em{font-style:normal;color:var(--gold)}
.g7 .hero .define{font-size:1.28rem;line-height:1.55;color:var(--ivory);font-weight:500;margin:24px 0 0;max-width:40ch}
.g7 .hero .define b{font-weight:600;color:var(--ivory)}
.g7 .cta-row{margin-top:32px;display:flex;flex-wrap:wrap;align-items:center;gap:14px 20px}
.g7 .btn{display:inline-flex;align-items:center;justify-content:center;gap:.55em;min-height:56px;padding:0 32px;border:none;border-radius:999px;cursor:pointer;
  background:linear-gradient(180deg,#e2c994,#d4b67a);color:#1a130a;
  font-family:"Playfair Display",serif;font-weight:600;font-size:1.18rem;letter-spacing:.005em;text-decoration:none;white-space:nowrap;
  box-shadow:0 14px 38px -14px rgba(212,182,122,.65),0 2px 0 rgba(255,255,255,.25) inset;transition:transform .25s ease,box-shadow .25s ease}
.g7 .btn:hover{transform:translateY(-2px);box-shadow:0 20px 46px -14px rgba(212,182,122,.8)}
.g7 .price-note{margin:0;font-family:"Newsreader",serif;font-weight:600;font-size:1.08rem;color:var(--muted);letter-spacing:.01em;white-space:nowrap}
.g7 .price-note .price{font-family:"Playfair Display",serif;font-weight:700;color:var(--gold);font-size:1.22rem;letter-spacing:0}
.g7 .price-note .was{text-decoration:line-through;color:var(--muted);opacity:.8;margin-left:.34em}
.g7 .rating{display:flex;align-items:center;gap:12px;color:var(--ivory);font-size:1.06rem}
.g7 .stars{display:inline-flex;align-items:center;gap:4px;line-height:0}
.g7 .stars svg.lucide{width:18px;height:18px;display:block;fill:var(--gold);stroke:var(--gold);stroke-width:1.4}

.g7 .device-stage{position:relative;display:flex;justify-content:center;width:100%}
.g7 .device-stage::before{content:"";position:absolute;width:78%;height:78%;left:11%;top:8%;border-radius:50%;
  background:radial-gradient(closest-side,rgba(212,182,122,.28),rgba(212,182,122,.07) 55%,transparent 72%);filter:blur(8px);z-index:0}
.g7 .device{position:relative;z-index:1;width:min(338px,86vw);border-radius:40px;padding:11px;
  background:linear-gradient(160deg,#241c30,#140f1d);border:1px solid var(--hair2);
  box-shadow:0 40px 90px -40px rgba(0,0,0,.85),0 0 0 1px rgba(0,0,0,.4),inset 0 1px 0 rgba(244,236,224,.06)}
.g7 .screen{border-radius:30px;overflow:hidden;background:linear-gradient(180deg,#140f1d,#0e0a16);border:1px solid rgba(244,236,224,.06);padding:22px 20px 20px}
.g7 .notch{width:46%;height:5px;border-radius:99px;background:rgba(244,236,224,.14);margin:0 auto 16px}
.g7 .cover-kicker{font-family:"Newsreader",serif;font-weight:600;font-size:.86rem;letter-spacing:.32em;text-transform:uppercase;color:var(--muted);text-align:center;margin:0 0 12px}
.g7 .cover-av-wrap{display:flex;justify-content:center;margin:0 0 10px}
.g7 .cover-av{width:72px;height:72px;border-radius:50%;object-fit:cover;display:block;border:1px solid rgba(13,10,20,.6);box-shadow:0 0 0 2px var(--gold),0 8px 20px -8px rgba(0,0,0,.7)}
.g7 .cover-name{font-family:"Playfair Display",serif;font-weight:600;font-size:2rem;text-align:center;margin:0;line-height:1}
.g7 .cover-sign{font-family:"Newsreader",serif;font-style:italic;font-weight:500;font-size:1.1rem;color:var(--gold);text-align:center;margin:5px 0 0;letter-spacing:.02em}
.g7 .chartwrap{margin:14px auto 12px;width:100%;max-width:230px}
.g7 .chart{display:block;width:100%;height:auto}
.g7 .screen-foot{border-top:1px solid var(--hair);padding-top:13px;margin-top:4px}
.g7 .sf-row{display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding:3px 0}
.g7 .sf-label{font-family:"Newsreader",serif;font-size:.92rem;color:var(--muted);letter-spacing:.04em;text-transform:uppercase}
.g7 .sf-val{font-family:"Playfair Display",serif;font-weight:500;font-size:1.04rem;color:var(--ivory)}

.g7 .trust{border-top:1px solid var(--hair);border-bottom:1px solid var(--hair);background:rgba(244,236,224,.012)}
.g7 .trust-in{padding:30px 0;display:flex;flex-direction:column;gap:22px;align-items:center;text-align:center}
.g7 .badges{display:flex;flex-wrap:wrap;justify-content:center;gap:16px 34px}
.g7 .badge{display:inline-flex;align-items:center;gap:11px;color:var(--ivory);font-size:1.08rem;font-weight:500}
.g7 .badge .ic{width:26px;height:26px;flex:none;display:flex;align-items:center;justify-content:center}
.g7 .badge .ic svg{width:24px;height:24px}

.g7 .shead{text-align:center;max-width:30ch;margin:0 auto 48px}
.g7 .shead h2{font-size:clamp(2.05rem,1.4rem + 3.1vw,3.05rem)}
.g7 .shead p{margin:20px auto 0;color:var(--ivory);font-size:1.2rem;line-height:1.55;max-width:38ch;font-weight:500}

.g7 .steps{display:grid;grid-template-columns:1fr;gap:30px}
.g7 .step{display:flex;gap:18px;align-items:center}
.g7 .step .ic{width:54px;height:54px;flex:none;border:1px solid var(--hair2);border-radius:14px;display:flex;align-items:center;justify-content:center;background:rgba(212,182,122,.05)}
.g7 .step .ic svg{width:28px;height:28px}
.g7 .step .n{font-family:"Newsreader",serif;font-weight:600;font-size:.86rem;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);margin:0 0 5px}
.g7 .step h3{font-size:1.5rem;font-weight:600;margin:0;line-height:1.15}

.g7 .cues{display:grid;grid-template-columns:1fr;gap:18px;max-width:760px;margin:0 auto}
.g7 .cue{display:flex;gap:16px;align-items:center;padding:24px;border:1px solid var(--hair);border-radius:18px;background:rgba(244,236,224,.012)}
.g7 .cue .ic{width:34px;height:34px;flex:none;display:flex;align-items:center;justify-content:center}
.g7 .cue .ic svg{width:30px;height:30px}
.g7 .cue h3{font-size:1.42rem;font-weight:600;margin:0;line-height:1.15}
.g7 .cue p{margin:10px 0 0;color:var(--ivory);font-size:1.04rem;line-height:1.46;font-weight:500}

.g7 .proof{display:grid;grid-template-columns:1fr;gap:22px;max-width:980px;margin:0 auto}
.g7 .quote{background:rgba(244,236,224,.018);border:1px solid var(--hair);border-radius:18px;padding:30px 28px}
.g7 .quote .mark{color:var(--gold);font-family:"Playfair Display",serif;font-size:2.4rem;line-height:.6;opacity:.7;display:block;height:.5em}
.g7 .quote blockquote{font-family:"Playfair Display",serif;font-style:italic;font-weight:500;font-size:1.5rem;line-height:1.3;margin:14px 0 20px;color:var(--ivory)}
.g7 .quote .who{display:flex;align-items:center;gap:13px;font-family:"Newsreader",serif;font-size:1.04rem;font-weight:500;letter-spacing:.01em;color:var(--ivory)}
.g7 .who-av{width:46px;height:46px;border-radius:50%;object-fit:cover;display:block;flex:none;border:1px solid rgba(13,10,20,.5);box-shadow:0 0 0 1px var(--hair2),0 6px 16px -8px rgba(0,0,0,.7)}
.g7 .who-meta{display:flex;flex-direction:column;gap:1px}
.g7 .who-meta .nm{color:var(--ivory)}
.g7 .who-meta .ct{color:var(--muted);font-size:.94rem}

.g7 .reassure{text-align:center;max-width:640px;margin:0 auto}
.g7 .guarantee{font-family:"Playfair Display",serif;font-style:italic;font-weight:500;font-size:1.6rem;line-height:1.4;color:var(--gold);margin:0}
.g7 .faq{margin:36px auto 0;text-align:left;border-top:1px solid var(--hair);padding-top:28px}
.g7 .faq dt{font-family:"Playfair Display",serif;font-weight:600;font-size:1.3rem;margin:0 0 8px;color:var(--ivory)}
.g7 .faq dd{margin:0;color:var(--ivory);font-size:1.2rem;line-height:1.55;font-weight:500}

.g7 .closing{text-align:center}
.g7 .closing h2{font-size:clamp(2.1rem,1.45rem + 2.8vw,3.15rem);max-width:18ch;margin:0 auto;color:var(--ivory)}
.g7 .closing .cta-row{justify-content:center;margin-top:30px}
.g7 .foot{padding:44px 0 64px;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:14px;color:var(--muted);font-size:.98rem;letter-spacing:.04em}
.g7 .foot-hair{display:inline-block;width:24px;height:1px;background:var(--hair2)}

.g7 .g7-back{display:inline-flex;align-items:center;gap:6px;color:var(--muted);text-decoration:none;font-family:"Newsreader",serif;font-size:.95rem}
.g7 .g7-back:hover{color:var(--gold)}
.g7 .g7-back svg{width:16px;height:16px}
.g7 .g7-col{max-width:560px;margin:0 auto;width:100%}

.g7 .env-section{overflow-x:clip}
.g7 .scene{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;padding:8px 6px 12px;text-align:center}
.g7 .env-wrap{perspective:1200px;width:min(78vw,320px);filter:drop-shadow(0 30px 50px rgba(0,0,0,0.55))}
.g7 .env{position:relative;width:100%;aspect-ratio:1.5 / 1;border-radius:10px;transform-style:preserve-3d}
.g7 .env-body{position:absolute;inset:0;z-index:1;border-radius:10px;background:linear-gradient(160deg,#171120 0%,#0e0a16 70%),var(--navy);border:1px solid rgba(212,182,122,0.30);box-shadow:inset 0 1px 0 rgba(212,182,122,0.10), inset 0 0 40px rgba(0,0,0,0.55);overflow:hidden}
.g7 .env-body::before,.g7 .env-body::after{content:"";position:absolute;left:0;right:0;bottom:0;top:0;pointer-events:none}
.g7 .env-body::before{background:linear-gradient(to top right, transparent calc(50% - 0.7px), rgba(212,182,122,0.22) 50%, transparent calc(50% + 0.7px)) no-repeat,linear-gradient(to top left, transparent calc(50% - 0.7px), rgba(212,182,122,0.22) 50%, transparent calc(50% + 0.7px)) no-repeat;background-size:50% 100%,50% 100%;background-position:left bottom,right bottom}
.g7 .env-body::after{background:linear-gradient(to bottom, rgba(212,182,122,0.10), transparent 60%);mix-blend-mode:screen;opacity:0.5}
.g7 .paper{position:absolute;z-index:2;left:7%;right:7%;top:14%;height:86%;border-radius:6px 6px 3px 3px;background:repeating-linear-gradient(180deg, rgba(122,96,60,0.06) 0 1px, transparent 1px 16px),linear-gradient(180deg,var(--paper-hi),var(--paper-lo));box-shadow:0 6px 18px rgba(0,0,0,0.4);transform-origin:50% 100%;opacity:0}
.g7 .flap{position:absolute;z-index:5;left:0;top:0;width:100%;height:58%;transform-origin:50% 0%;transform-style:preserve-3d;will-change:transform}
.g7 .flap-face{position:absolute;inset:0;clip-path:polygon(0 0,100% 0,50% 100%);backface-visibility:hidden;border-radius:10px 10px 0 0}
.g7 .flap-face.front{background:linear-gradient(165deg,#191320,#0d0a14 78%);box-shadow:inset 0 1px 0 rgba(212,182,122,0.16)}
.g7 .flap-face.back{transform:rotateX(180deg) translateZ(0.5px);background:linear-gradient(180deg,#3a2c14,#241a0c);overflow:hidden}
.g7 .flap-face.back .foil{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.92;clip-path:polygon(0 0,100% 0,50% 100%)}
.g7 .flap-face.back::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg, rgba(255,240,200,0.18), rgba(0,0,0,0.35));clip-path:polygon(0 0,100% 0,50% 100%)}
.g7 .seal-btn{position:absolute;z-index:6;left:50%;top:58%;width:38%;aspect-ratio:1/1;transform:translate(-50%,-50%) translateZ(6px);display:grid;place-items:center;padding:0;margin:0;border:0;background:transparent;cursor:pointer;-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none;user-select:none;-webkit-user-select:none;touch-action:manipulation}
.g7 .seal-btn:focus{outline:none}
.g7 .seal-btn:focus-visible{outline:none}
.g7 .seal-btn:focus-visible .seal{box-shadow:0 0 0 3px rgba(240,217,160,0.9),0 0 0 8px rgba(212,182,122,0.35)}
.g7 .seal-glow{position:absolute;inset:-46%;border-radius:50%;pointer-events:none;background:radial-gradient(circle, rgba(212,182,122,0.42) 0%, rgba(212,182,122,0.10) 38%, transparent 66%);opacity:0.55}
.g7 .seal{position:relative;width:100%;height:100%;border-radius:50%;display:grid;place-items:center;will-change:transform}
.g7 .seal-img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;transform:scale(1.12);clip-path:circle(46% at 50% 50%);filter:drop-shadow(0 3px 6px rgba(0,0,0,0.55));pointer-events:none}
.g7 .stamp{position:relative;z-index:2;width:54%;height:54%;color:#b8995f;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;filter:drop-shadow(0 1.2px 0.4px rgba(247,236,205,0.5)) drop-shadow(0 -1.2px 1.1px rgba(43,27,8,0.62));pointer-events:none}
.g7 .stamp .glyph{width:74%;height:auto}
.g7 .stamp .paw{width:30%;height:auto;opacity:0.85;margin-top:1px}
.g7 .invite{display:flex;flex-direction:column;gap:7px;max-width:30ch}
.g7 .hint{font-family:"Playfair Display",Georgia,serif;font-size:1.15rem;font-style:italic;color:var(--gold);letter-spacing:0.2px;margin:0}
.g7 .env-cue{font-size:0.82rem;letter-spacing:0.14em;text-transform:uppercase;color:var(--muted);display:inline-flex;align-items:center;gap:7px;justify-content:center}

.g7 .reading{position:relative;z-index:1;width:min(90vw,432px);margin:0 auto;padding:14px 0 16px}
.g7 .reading::before{content:"";position:absolute;z-index:-1;inset:-6% -14%;pointer-events:none;background:radial-gradient(58% 42% at 50% 18%, rgba(212,182,122,0.16), transparent 70%)}
.g7 .keepsake{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;background:radial-gradient(120% 72% at 50% 0%, #1c1632 0%, rgba(28,22,50,0) 58%),linear-gradient(180deg,#15101f 0%,#0e0a17 100%);border:1px solid rgba(212,182,122,0.32);border-radius:16px;box-shadow:0 36px 72px rgba(0,0,0,0.55),0 4px 14px rgba(0,0,0,0.35),inset 0 1px 0 rgba(212,182,122,0.12);padding:clamp(30px,7vw,46px) clamp(22px,6vw,40px) clamp(34px,7vw,48px)}
.g7 .keepsake::before{content:"";position:absolute;inset:9px;pointer-events:none;border:1px solid rgba(184,146,63,0.30);border-radius:9px}
.g7 .gift-kicker{margin:0 0 clamp(22px,6vw,32px);max-width:24ch;font-family:"Newsreader",Georgia,serif;font-size:0.72rem;font-weight:600;line-height:1.7;letter-spacing:0.2em;text-transform:uppercase;color:var(--muted);outline:none}
.g7 .portrait{position:relative;width:min(72vw,270px);height:min(72vw,270px);margin:0 auto;display:grid;place-items:center}
.g7 .glowfield{position:absolute;inset:0;z-index:0;pointer-events:none}
.g7 .glowfield .halo{position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at 50% 50%, rgba(212,182,122,0.26) 0%, rgba(212,182,122,0.10) 38%, rgba(212,182,122,0) 66%)}
.g7 .glowfield svg{position:absolute;inset:0;width:100%;height:100%}
.g7 .glowfield .star{fill:#f0d9a0}
.g7 .ring{position:relative;z-index:1;width:68%;height:68%;border-radius:50%;padding:5px;background:conic-gradient(#9a7a3a, #ecd296, #c4a265, #f3deab, #9a7a3a, #ecd296, #c4a265, #f3deab, #9a7a3a);box-shadow:0 0 0 1px rgba(240,217,160,0.40),0 16px 34px rgba(0,0,0,0.55),0 0 40px rgba(212,182,122,0.20)}
.g7 .ring img{display:block;width:100%;height:100%;border-radius:50%;object-fit:cover;object-position:50% 42%;box-shadow:inset 0 0 0 2px rgba(13,10,20,0.85)}
.g7 .sample-cap{margin:clamp(16px,4.2vw,21px) 0 0;font-size:0.66rem;letter-spacing:0.26em;text-transform:uppercase;color:var(--gold);opacity:0.94}
.g7 .env-who{margin:clamp(20px,5vw,28px) 0 0}
.g7 .petname{margin:0;font-family:"Playfair Display",Georgia,serif;font-size:clamp(1.72rem,7vw,2.1rem);font-weight:600;line-height:1.1;color:var(--ivory);letter-spacing:0.4px}
.g7 .petsign{display:block;margin:7px 0 0;font-size:0.72rem;letter-spacing:0.24em;text-transform:uppercase;color:var(--muted)}
.g7 .held{margin:clamp(30px,8vw,46px) auto;max-width:13ch;font-family:"Playfair Display",Georgia,serif;font-size:clamp(1.82rem,8.6vw,2.6rem);font-weight:500;line-height:1.22;color:var(--ivory);letter-spacing:0.2px}
.g7 .loops{width:100%;max-width:336px;margin:0 auto;border-bottom:1px solid rgba(184,146,63,0.30);text-align:left}
.g7 .loop{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:clamp(13px,3.6vw,17px) 2px;border-top:1px solid rgba(184,146,63,0.30)}
.g7 .loop .t{font-family:"Playfair Display",Georgia,serif;font-size:clamp(1.05rem,4.4vw,1.2rem);font-weight:500;line-height:1.2;color:var(--ivory)}
.g7 .loop .lock{display:inline-flex;flex:0 0 auto}
.g7 .loop .lock svg{width:15px;height:15px;stroke:var(--gold);stroke-width:1.7;opacity:0.5}
.g7 .cta-cue{margin:clamp(26px,7vw,38px) 0 0;max-width:26ch;font-family:"Newsreader",Georgia,serif;font-style:italic;font-size:clamp(0.94rem,3.6vw,1.04rem);line-height:1.5;color:var(--gold)}
.g7 .scene.is-open{padding-bottom:6px}

.g7 .reveal,.g7 .sreveal,.g7 .device{opacity:1}
@keyframes g7rise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
@keyframes spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:no-preference){
  .g7 .reveal{animation:g7rise .9s both cubic-bezier(.2,.7,.2,1)}
  .g7 .device{animation:g7rise 1.1s .18s both cubic-bezier(.2,.7,.2,1)}
  .g7 .sreveal{animation:g7rise .9s both cubic-bezier(.2,.7,.2,1)}
}

@media (min-width:760px){
  .g7{font-size:1.22rem}
  .g7 .shead p{font-size:1.26rem}
  .g7 .hero .define{font-size:1.38rem}
  .g7 .faq dd{font-size:1.26rem}
  .g7 .band{padding-top:110px;padding-bottom:110px}
  .g7 .hero{padding-top:64px}
  .g7 .moon-wrap{width:clamp(232px,25vw,318px);top:4%;right:8%}
  .g7 .hero-grid{flex-direction:row;justify-content:space-between;align-items:center;gap:48px}
  .g7 .hero-copy{flex:1 1 52%}
  .g7 .device-stage{flex:0 0 352px}
  .g7 .steps{grid-template-columns:repeat(3,1fr);gap:36px}
  .g7 .step{flex-direction:column;align-items:flex-start;text-align:left}
  .g7 .cues{grid-template-columns:repeat(3,1fr)}
  .g7 .cue{flex-direction:column;align-items:flex-start}
  .g7 .proof{grid-template-columns:repeat(2,1fr)}
  .g7 .quote blockquote{font-size:1.4rem}
}

@media (prefers-reduced-motion:reduce){
  .g7 .moon{animation:none}
  .g7 .reveal,.g7 .sreveal,.g7 .device{opacity:1 !important;transform:none !important;animation:none !important}
  .g7 .btn:hover{transform:none}
  .g7 .seal-glow{opacity:0.4}
}
`;

function TierCard({
  tierKey, selected, onClick, fmt, cents, wasCents, override, accent: occAccent,
}: {
  tierKey: TierKey; selected: boolean; onClick: () => void;
  fmt: (cents: number) => string;
  cents: number;
  wasCents?: number;
  override?: TierContent;
  accent?: { ring: string; badge: string };
}) {
  const base = TIERS[tierKey];
  const tier = override ?? base;
  const accent = C.rose;
  const accentGlow = C.roseGlow;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -2, boxShadow: `0 8px 28px ${accentGlow}` }}
      transition={{ duration: 0.15 }}
      style={{
        width: '100%', textAlign: 'left', padding: '24px 22px', borderRadius: 20, cursor: 'pointer',
        border: `2px solid ${selected ? accent : C.cream3}`,
        background: selected ? 'rgba(245,239,230,0.08)' : 'rgba(245,239,230,0.05)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        boxShadow: selected
          ? `0 6px 24px ${accentGlow}${occAccent ? `, 0 0 0 5px ${occAccent.ring}` : ''}`
          : `0 2px 12px rgba(0,0,0,0.3)${occAccent ? `, inset 0 0 0 1px ${occAccent.ring}` : ''}`,
        transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
        position: 'relative',
      }}
    >
      {/* Badge — occasion overrides provide their own label; when an
          override is in play, use the occasion's badge accent colour
          so it reads as part of that occasion's visual language. */}
      {tier.badge && (
        <span style={{
          position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)',
          background: occAccent?.badge ?? base.badgeColor,
          color: '#141210',
          fontSize: '0.58rem', fontWeight: 800, padding: '3px 14px', borderRadius: 20, letterSpacing: '0.1em',
          whiteSpace: 'nowrap',
        }}>
          {tier.badge}
        </span>
      )}

      {/* Header row — landing-page style: name + price baseline-aligned */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontWeight: 400, fontSize: '1.3rem', color: C.ink, marginBottom: 4, lineHeight: 1.15,
          }}>
            {tier.label}
          </p>
          <p style={{
            fontFamily: '"Newsreader", Georgia, serif', fontStyle: 'italic',
            fontSize: '0.92rem', color: C.earth, lineHeight: 1.4,
          }}>
            {tier.tagline}
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {wasCents && (
            <p style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: '1rem', lineHeight: 1,
              color: C.muted,
              textDecoration: 'line-through',
              textDecorationColor: 'rgba(212,182,122,0.55)',
              textDecorationThickness: '1.5px',
              marginBottom: 3,
            }}>
              {fmt(wasCents)}
            </p>
          )}
          <p style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontWeight: 700,
            fontSize: '2rem', lineHeight: 1,
            color: C.gold,
            transition: 'color 0.2s',
          }}>
            {fmt(cents)}
          </p>
          <p style={{ fontSize: '0.65rem', color: C.muted, marginTop: 2 }}>one-time</p>
        </div>
      </div>

      {/* Features */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {tier.features.map((f, idx) => {
          const isDivider = f.endsWith(':');
          return (
            <p key={idx} style={{
              fontSize: '0.85rem',
              color: isDivider ? C.gold : C.warm,
              fontStyle: isDivider ? 'italic' : 'normal',
              fontWeight: isDivider ? 600 : 400,
              display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.4,
            }}>
              {!isDivider && (
                <CheckCircle style={{ width: 13, height: 13, color: C.green, flexShrink: 0, marginTop: 2 }} />
              )}
              <span style={{ flex: 1 }}>{f}</span>
            </p>
          );
        })}
      </div>

      {/* Selected indicator */}
      {selected && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.cream3}`, textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 700, color: accent }}>Selected. Continue below</p>
        </div>
      )}
    </motion.button>
  );
}

/* ── Gift-specific reviews — written in a human voice. Avatar images
   are fetched live from dog.ceo + thecatapi.com on mount so every
   visitor sees a fresh pet. ── */
type GiftReview = {
  name: string; location: string;
  /** Avatar source. If `src` is set we skip the API and use that image
   *  directly (stable across reloads). Otherwise we pull a random photo
   *  from dog.ceo / thecatapi.com. Omit avatar for a text-only card. */
  avatar?: { src?: string; pet?: 'dog' | 'cat'; breed?: string };
  quote: string;
};

const GIFT_REVIEWS: GiftReview[] = [
  {
    name: 'Dave',
    location: 'Manchester',
    quote: 'Got this for the wife\'s birthday — her cat does the 3am keyboard walk and the reading called it out. She just nodded and carried on reading.',
  },
  {
    name: 'Emily',
    location: 'Toronto',
    avatar: { src: 'https://images.pexels.com/photos/35130989/pexels-photo-35130989.jpeg?auto=compress&cs=tinysrgb&w=160&h=160&fit=crop' },
    quote: 'Gave it to my sister for her golden retriever puppy. The reading described how he bonds by pressing against your leg on walks. She mentioned it the next morning over coffee.',
  },
  {
    name: 'Liam',
    location: 'Cork',
    quote: 'Wasn\'t expecting much when I got it for my da\'s sheepdog. He read the personality section and said how do they know that. First time he\'s been impressed by a gift.',
  },
  {
    name: 'Sophie',
    location: 'Brisbane',
    quote: 'Bought a few for the family do — one each for mum\'s poodle, dad\'s kelpie and my brother\'s staffy. Now the group chat\'s full of them quoting bits about their pets.',
  },
  {
    name: 'Anna',
    location: 'Portland',
    avatar: { src: 'https://images.pexels.com/photos/7176277/pexels-photo-7176277.jpeg?auto=compress&cs=tinysrgb&w=160&h=160&fit=crop' },
    quote: 'Sent this to my sister after her collie passed. It caught how he always did a final check of the room before bed. She said it felt like someone remembered him too.',
  },
  {
    name: 'Finn',
    location: 'Glasgow',
    quote: 'Got one for my mate\'s parrot — the one that copies the doorbell. The love-language bit said something about attention seeking and the bird started ringing right then. Had us in stitches.',
  },
  {
    name: 'Ryan',
    location: 'Austin',
    quote: 'I bought this for my wife and her siamese cat. The part about their bond through quiet evening sits has her showing me the phone every time the cat curls up.',
  },
  {
    name: 'Claire',
    location: 'Dublin',
    quote: 'Went with this instead of flowers or a gift card for my best mate and her new puppy. She loved how it got the zoomies after dinner thing. Reckon it\'s a winner.',
  },
];

async function fetchPetImage(pet: 'dog' | 'cat', breed?: string): Promise<string | null> {
  try {
    if (pet === 'dog') {
      const url = breed
        ? `https://dog.ceo/api/breed/${breed}/images/random`
        : 'https://dog.ceo/api/breeds/image/random';
      const r = await fetch(url);
      const j = await r.json();
      return j?.message ?? null;
    }
    const r = await fetch('https://api.thecatapi.com/v1/images/search');
    const j = await r.json();
    return Array.isArray(j) ? (j[0]?.url ?? null) : null;
  } catch {
    return null;
  }
}

function GiftReviewCard({ r, image }: { r: GiftReview; image?: string }) {
  const showAvatar = Boolean(r.avatar);
  return (
    <div
      style={{
        padding: '14px 16px 16px',
        borderRadius: 14,
        background: 'rgba(245,239,230,0.05)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        border: '1px solid rgba(212,182,122,0.22)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
        {showAvatar && (
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            flexShrink: 0,
            background: C.cream2,
            border: `2px solid ${C.cream3}`,
            overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {image && (
              <img
                src={image}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            )}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <StarRow />
          <p style={{
            fontSize: '0.68rem', color: C.muted, fontWeight: 600,
            letterSpacing: '0.04em', margin: '3px 0 0',
          }}>
            {r.name}, {r.location}
          </p>
        </div>
      </div>
      <p style={{
        margin: 0,
        fontFamily: 'Lato, system-ui, sans-serif',
        fontStyle: 'italic',
        fontSize: '0.88rem',
        color: C.warm,
        lineHeight: 1.5,
      }}>
        &ldquo;{r.quote}&rdquo;
      </p>
    </div>
  );
}

function GiftReviewStrip() {
  const [images, setImages] = useState<Record<number, string>>({});

  useEffect(() => {
    let cancelled = false;
    const initial: Record<number, string> = {};
    GIFT_REVIEWS.forEach((r, i) => {
      if (r.avatar?.src) initial[i] = r.avatar.src;
    });
    if (Object.keys(initial).length) setImages(initial);

    GIFT_REVIEWS.forEach(async (r, i) => {
      if (!r.avatar || r.avatar.src || !r.avatar.pet) return;
      const url = await fetchPetImage(r.avatar.pet, r.avatar.breed);
      if (!cancelled && url) {
        setImages(prev => ({ ...prev, [i]: url }));
      }
    });
    return () => { cancelled = true; };
  }, []);

  // Duplicate the list so the translateX(-50%) loop is seamless.
  const loop = [...GIFT_REVIEWS, ...GIFT_REVIEWS];

  return (
    <div style={{ margin: '4px 0' }}>
      <p style={{
        textAlign: 'center',
        fontFamily: 'Lato, system-ui, sans-serif',
        fontStyle: 'italic',
        fontSize: '0.82rem',
        color: C.earth,
        letterSpacing: '0.04em',
        margin: '0 0 14px',
      }}>
        from people who've gifted it
      </p>

      <div
        className="gift-review-marquee-viewport"
        style={{
          overflow: 'hidden',
          // Break out of the narrow 540px parent column on desktop so the
          // marquee spans the full viewport width — looks generous and
          // shows several cards at once. On mobile this reduces to the
          // viewport width too, which is what we want.
          position: 'relative',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw',
          width: '100vw',
          maxWidth: '100vw',
          maskImage: 'linear-gradient(to right, transparent 0, #000 48px, #000 calc(100% - 48px), transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0, #000 48px, #000 calc(100% - 48px), transparent 100%)',
        }}
      >
        <div
          className="gift-review-marquee-track"
          style={{
            display: 'flex',
            gap: 12,
            width: 'max-content',
            animation: 'gift-review-scroll 55s linear infinite',
            paddingLeft: 16,
          }}
        >
          {loop.map((r, i) => (
            <div
              key={i}
              style={{ flex: '0 0 auto', width: 300 }}
              aria-hidden={i >= GIFT_REVIEWS.length}
            >
              <GiftReviewCard r={r} image={images[i % GIFT_REVIEWS.length]} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function GiftPurchase() {
  const [searchParams] = useSearchParams();
  const { fmt, code: currencyCode, currency, isLocalized, prices } = useLocalizedPrice();
  // Map tier key → current-currency cents (mirrors the backend pricing table)
  const TIER_CENTS: Record<TierKey, { cents: number; wasCents: number }> = {
    essential: { cents: prices.basic, wasCents: prices.wasBasic },
    portrait:  { cents: prices.premium, wasCents: prices.wasPremium },
  };
  const [selectedTier, setSelectedTier] = useState<TierKey | null>(null);
  // Top-level gift occasion — memorial/new/discover/birthday. This is the
  // PRIMARY product choice on the page (the real products we ship), with
  // Soul Reading / Soul Bond as depth-of-reading picks underneath it.
  // Null on first render — the occasion picker above the tier cards
  // forces the visitor to frame what kind of gift this is first.
  const [selectedOccasion, setSelectedOccasion] = useState<GiftOccasion | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('link');
  const [giftType, setGiftType] = useState<'single' | 'multiple' | null>(null);
  const [purchaserEmail, setPurchaserEmail] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ id: string; code: string; discount_value: number } | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [singleRecipient, setSingleRecipient] = useState<GiftRecipient>({ id: crypto.randomUUID(), name: '', email: '', occasion: 'discover' });
  const [recipients, setRecipients] = useState<GiftRecipient[]>([{ id: crypto.randomUUID(), name: '', email: '', occasion: 'discover' }]);

  // When the primary occasion is picked, propagate it to all recipient
  // rows as the default so downstream steps start in the right tone.
  // Per-recipient picker stays editable afterwards for mixed gifts.
  // Also clear the tier selection if switching to Memorial (which only
  // has portrait) or away from a tier that isn't offered on the new
  // occasion — keeps the flow from getting into impossible states.
  const handleOccasionSelect = useCallback((occ: GiftOccasion) => {
    setSelectedOccasion(occ);
    setSingleRecipient(r => ({ ...r, occasion: occ }));
    setRecipients(rs => rs.map(r => ({ ...r, occasion: occ })));
    setSelectedTier((prev) => {
      if (prev === null) return null;
      if (occ === 'memorial' && prev !== 'portrait') return null;
      return prev;
    });
  }, []);

  // Auto-apply promo from URL
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode && !appliedCoupon) {
      setPromoCode(urlCode.toUpperCase());
      (async () => {
        try {
          const { data } = await supabase.from('coupons').select('id,code,discount_type,discount_value,expires_at,max_uses,current_uses').eq('code', urlCode.toUpperCase()).eq('is_active', true).single();
          if (data && (!data.expires_at || new Date(data.expires_at) >= new Date()) && (!data.max_uses || data.current_uses < data.max_uses)) {
            setAppliedCoupon({ id: data.id, code: data.code, discount_value: data.discount_value });
            setPromoCode('');
          }
        } catch { /* ignore */ }
      })();
    }
  }, [searchParams]);

  const handleTierSelect = (tier: TierKey) => {
    setSelectedTier(tier);
    setStep(1);
    setGiftType(null);
    // Small delay then scroll to flow section
    setTimeout(() => {
      document.getElementById('gift-flow')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Hero / closing CTAs drop the visitor onto the first real choice:
  // the occasion picker (which then gates the tier cards + flow).
  const scrollToPicker = useCallback(() => {
    const el = document.querySelector('[role="radiogroup"][aria-label="Gift occasion"]');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const activeRecipients = giftType === 'single' ? [singleRecipient] : recipients;
  const giftCount = activeRecipients.length;
  const discount = getVolumeDiscount(giftCount);

  const pricing = useMemo(() => {
    if (!selectedTier) return { baseTotal: 0, discountAmount: 0, promoAmount: 0, finalTotal: 0 };
    const tierCents = TIER_CENTS[selectedTier].cents;
    const baseTotal = activeRecipients.reduce((sum) => sum + tierCents, 0);
    const discountAmount = Math.round(baseTotal * discount);
    const afterVolume = baseTotal - discountAmount;
    const promoAmount = appliedCoupon ? Math.round(afterVolume * (appliedCoupon.discount_value / 100)) : 0;
    return { baseTotal, discountAmount, promoAmount, finalTotal: afterVolume - promoAmount };
  }, [selectedTier, activeRecipients, discount, appliedCoupon]);

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    setIsValidatingPromo(true);
    setPromoError('');
    try {
      const { data } = await supabase.from('coupons').select('id,code,discount_type,discount_value,expires_at,max_uses,current_uses').eq('code', promoCode.trim().toUpperCase()).eq('is_active', true).single();
      if (!data) { setPromoError('Invalid promo code'); return; }
      if (data.expires_at && new Date(data.expires_at) < new Date()) { setPromoError('This code has expired'); return; }
      if (data.max_uses && data.current_uses >= data.max_uses) { setPromoError('This code has reached its limit'); return; }
      setAppliedCoupon({ id: data.id, code: data.code, discount_value: data.discount_value });
      setPromoCode('');
    } catch { setPromoError('Something went wrong'); }
    finally { setIsValidatingPromo(false); }
  };

  const updateSingleRecipient = (field: keyof GiftRecipient, value: string) => {
    setSingleRecipient(r => ({ ...r, [field]: value }));
  };
  const updateRecipient = (id: string, field: keyof GiftRecipient, value: string) => {
    setRecipients(rs => rs.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const canProceedStep2 = () => {
    if (deliveryMethod === 'link') return true;
    if (giftType === 'single') return singleRecipient.email.includes('@');
    return recipients.every(r => r.email.includes('@'));
  };

  const handlePurchase = async () => {
    if (!purchaserEmail.includes('@')) { toast.error('Please enter your email address'); return; }
    if (!selectedTier) return;
    setIsLoading(true);
    try {
      const body = {
        purchaserEmail,
        recipientEmail: giftType === 'single' && deliveryMethod === 'email' ? singleRecipient.email : '',
        recipientName: giftType === 'single' ? (singleRecipient.name || '') : '',
        giftMessage: giftMessage || '',
        giftPets: activeRecipients.map(r => ({
          id: r.id, tier: selectedTier,
          recipientName: r.name || '',
          recipientEmail: deliveryMethod === 'email' ? r.email : null,
          horoscopeAddon: 'none',
          occasion: r.occasion ?? 'discover',
        })),
        deliveryMethod,
        multiRecipient: giftType === 'multiple',
        couponId: appliedCoupon?.id || null,
        currency,
      };

      const { data, error } = await supabase.functions.invoke('purchase-gift-certificate', { body });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err) {
      console.error('Gift purchase error:', err);
      toast.error('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', borderRadius: 14,
    border: `1px solid ${C.cream3}`, background: C.cream2,
    fontSize: '0.95rem', color: C.ink, fontFamily: 'Lato, system-ui, sans-serif', outline: 'none',
    boxSizing: 'border-box',
  };

  const stepCount = 3;

  return (
    <div className="g7" style={{ position: 'relative', minHeight: '100vh', background: '#0d0a14', overflowX: 'hidden' }}>
      <MoonlitSky />

      <main>

        {/* Back */}
        <div className="wrap" style={{ paddingTop: 20 }}>
          <Link to="/" className="g7-back">
            <ArrowLeft /> Back
          </Link>
        </div>

        {/* Moonlit marketing shell (approved gift-preview7 design). */}
        <Hero fmt={fmt} prices={prices} onCta={scrollToPicker} />
        <TrustStrip />
        <StepsSection />
        <EnvelopeReveal />
        <GiftExperience />

        <div className="rule" />

        {/* ── CHOOSE THEIR READING — the interactive purchase funnel.
             The occasion picker gates the selectable tier cards, which
             drive handleTierSelect and the preserved 3-step flow below.
             All logic/state/handlers below are unchanged; only the
             surrounding presentation is new. ── */}
        <section className="band wrap g7-funnel" id="tiers" data-section>
          <div className="shead">
            <h2>Choose their reading</h2>
            <p>One <strong>private reveal</strong>, read from their pet's real chart.</p>
          </div>

          <div className="g7-col">

          {/* Old "gph" hero styles kept only so any stray class is inert. */}
          <style>{`
            .gph-hero {
              position: relative; text-align: center; margin-bottom: 40px;
              padding: clamp(40px,6vw,56px) clamp(20px,4vw,36px) clamp(32px,4vw,40px);
              border-radius: 18px; background: rgba(245,239,230,0.05);
              backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px);
              border: 1px solid rgba(212,182,122,0.22); box-shadow: 0 6px 32px rgba(0,0,0,0.4);
            }
            .gph-kicker {
              font-family: Lato, system-ui, sans-serif; font-size: 0.72rem; font-weight: 600;
              color: #d4b67a; letter-spacing: 0.2em; text-transform: uppercase; margin: 0 0 16px;
            }
            .gph-h1 {
              font-family: "Playfair Display", Georgia, serif; font-weight: 500;
              font-size: clamp(2.1rem,6.6vw,2.85rem); color: #f5efe6; line-height: 1.08;
              letter-spacing: -0.02em; margin: 0; text-wrap: balance;
            }
            .gph-h1 .it { font-style: italic; color: #f0d99f; }
            .gph-stage { position: relative; display: flex; justify-content: center; margin: 30px 0 4px; }
            .gph-stage::before {
              content: ""; position: absolute; width: 74%; height: 74%; top: 12%; left: 13%;
              border-radius: 50%; background: radial-gradient(circle, rgba(124,92,214,0.32), transparent 66%);
              filter: blur(26px); z-index: 0;
            }
            .gph-phone {
              position: relative; z-index: 1; width: clamp(240px,70vw,280px); aspect-ratio: 300/620;
              border-radius: 44px; padding: 12px;
              background: linear-gradient(160deg,#2a2238,#15101c 60%,#241a30);
              box-shadow: 0 40px 90px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,182,122,0.2), inset 0 0 0 2px rgba(0,0,0,0.5);
              animation: gph-float 6s ease-in-out infinite;
            }
            @keyframes gph-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
            .gph-screen {
              position: relative; width: 100%; height: 100%; border-radius: 32px; overflow: hidden;
              background: linear-gradient(180deg,#120d1a,#1a1228 70%,#0f0b16);
            }
            .gph-notch { position: absolute; top: 9px; left: 50%; transform: translateX(-50%); width: 92px; height: 19px; border-radius: 12px; background: #0a0810; z-index: 5; }
            .gph-glow { position: absolute; inset: 0; background: radial-gradient(ellipse 70% 40% at 50% 22%, rgba(124,92,214,0.28), transparent 60%); pointer-events: none; }
            .gph-stars {
              position: absolute; inset: 0; opacity: 0.6; background-image:
                radial-gradient(1.1px 1.1px at 20% 30%, #fff, transparent),
                radial-gradient(1px 1px at 70% 22%, #f0d99f, transparent),
                radial-gradient(1px 1px at 44% 60%, #fff, transparent),
                radial-gradient(1px 1px at 82% 54%, #fff, transparent),
                radial-gradient(1px 1px at 30% 80%, #fff, transparent);
            }
            .gph-scr { position: relative; z-index: 3; padding: 40px 20px 22px; display: flex; flex-direction: column; align-items: center; text-align: center; height: 100%; }
            .gph-badge { font-family: Lato, system-ui, sans-serif; text-transform: uppercase; letter-spacing: 0.24em; font-size: 0.58rem; color: #d4b67a; }
            .gph-avatar { width: 84px; height: 84px; border-radius: 50%; margin: 14px 0 0; overflow: hidden; border: 2px solid #d4b67a; box-shadow: 0 0 24px rgba(212,182,122,0.3); }
            .gph-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
            .gph-name { font-family: "Playfair Display", Georgia, serif; font-size: 1.5rem; color: #f5efe6; margin-top: 12px; line-height: 1; }
            .gph-sub { font-family: Lato, system-ui, sans-serif; text-transform: uppercase; letter-spacing: 0.22em; font-size: 0.56rem; color: #c8c8d2; margin-top: 6px; }
            .gph-note { margin-top: 16px; padding: 12px 13px; border-radius: 13px; background: rgba(212,182,122,0.07); border: 1px solid rgba(212,182,122,0.22); }
            .gph-note .nl { font-family: Lato, system-ui, sans-serif; text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.52rem; color: #d4b67a; }
            .gph-note .nt { font-family: "Playfair Display", Georgia, serif; font-style: italic; font-size: 0.9rem; color: #ececf2; line-height: 1.34; margin: 5px 0 0; }
            .gph-line { display: flex; gap: 9px; align-items: flex-start; text-align: left; margin-top: 16px; width: 100%; }
            .gph-line svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 2px; }
            .gph-line .sx { font-size: 0.8rem; line-height: 1.3; color: #c8c8d2; }
            .gph-line .sx b { font-family: "Playfair Display", Georgia, serif; font-style: normal; color: #f5efe6; display: block; font-size: 0.84rem; }
            .gph-chip { margin-top: auto; width: 100%; padding: 11px 0; border-radius: 30px; background: linear-gradient(180deg,#f0d99f,#d4b67a); color: #1a1410; font-family: Lato, system-ui, sans-serif; font-weight: 600; font-size: 0.82rem; letter-spacing: 0.04em; }
            .gph-testi { margin: 26px auto 0; max-width: 30ch; }
            .gph-testi .stars { color: #d4b67a; letter-spacing: 0.14em; font-size: 0.8rem; }
            .gph-testi .q { font-family: "Playfair Display", Georgia, serif; font-style: italic; font-size: clamp(1.25rem,4.4vw,1.5rem); line-height: 1.3; color: #ececf2; margin: 8px 0 0; }
            .gph-testi .who { display: block; margin-top: 8px; font-size: 0.74rem; letter-spacing: 0.1em; text-transform: uppercase; color: #c8c8d2; }
            .gph-cta {
              display: inline-flex; align-items: center; gap: 10px; margin-top: 26px; cursor: pointer; border: none;
              font-family: Lato, system-ui, sans-serif; font-weight: 600; letter-spacing: 0.02em; color: #1a1410;
              background: linear-gradient(180deg,#f0d99f,#d4b67a); border-radius: 50px; min-height: 56px;
              padding: 0 32px; font-size: 1.02rem; box-shadow: 0 10px 30px rgba(124,92,214,0.3); transition: transform .18s ease;
            }
            .gph-cta:hover { transform: translateY(-2px); }
            .gph-scr > * { opacity: 0; transform: translateY(10px); animation: gph-rise .6s cubic-bezier(.34,1.4,.64,1) forwards; }
            .gph-scr > *:nth-child(1) { animation-delay: .25s; }
            .gph-scr > *:nth-child(2) { animation-delay: .4s; }
            .gph-scr > *:nth-child(3) { animation-delay: .52s; }
            .gph-scr > *:nth-child(4) { animation-delay: .62s; }
            .gph-scr > *:nth-child(5) { animation-delay: .74s; }
            .gph-scr > *:nth-child(6) { animation-delay: .86s; }
            .gph-scr > *:nth-child(7) { animation-delay: .98s; }
            @keyframes gph-rise { to { opacity: 1; transform: none; } }
            @media (max-width: 380px) { .gph-phone { width: clamp(220px,72vw,260px); } }
            @media (prefers-reduced-motion: reduce) {
              .gph-phone { animation: none !important; }
              .gph-scr > * { opacity: 1 !important; transform: none !important; animation: none !important; }
              .gph-cta { transition: none !important; }
            }
          `}</style>

        {/* ── OCCASION PICKER ── */}
        {/* First-class product choice: what kind of gift is this? Mirrors
            the main funnel's PathPicker pill design (italic Cormorant
            labels, gold-on-cream gradient, rose active halo) but adds a
            fourth slot for Birthday and uses gift-framed copy. Tier
            selection below is gated on this. */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          style={{ marginBottom: 40 }}
        >
          {/* Magazine TOC pattern in a translucent cream card on the
              wallpaper. Matches the main PathPicker visual language —
              hairline rows, no pill chrome. Small muted left glyph
              keeps occasion-scanning fast. */}
          <div className="gift-toc-card">
            <p style={{ fontFamily: 'Lato, system-ui, sans-serif', fontSize: '0.72rem', fontWeight: 600, color: C.gold, textAlign: 'center', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10 }}>
              Start here — who's it for?
            </p>
            <p style={{ fontFamily: 'Lato, system-ui, sans-serif', fontStyle: 'italic', color: C.earth, fontSize: 'clamp(1rem, 3vw, 1.15rem)', textAlign: 'center', margin: '0 auto', maxWidth: 420 }}>
              Four readings, four different voices. Pick the one that fits their moment.
            </p>

            <span aria-hidden="true" className="gift-toc-rule" />

            <div
              role="radiogroup"
              aria-label="Gift occasion"
              className="gift-toc-list"
            >
              {([
                { value: 'new',      emoji: '🌱', label: 'They just got a new pet' },
                { value: 'discover', emoji: '🔮', label: "They've had their pet for years" },
                { value: 'memorial', emoji: '🕊️', label: 'Their pet has passed' },
                { value: 'birthday', emoji: '🎂', label: "It's their pet's birthday" },
              ] as Array<{ value: GiftOccasion; emoji: string; label: string }>).map(({ value, emoji, label }) => {
                const active = selectedOccasion === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => handleOccasionSelect(value)}
                    className={`gift-toc-row ${active ? 'is-active' : ''}`}
                  >
                    <span className="gift-toc-glyph" aria-hidden="true">{emoji}</span>
                    <span className="gift-toc-label">{label}</span>
                    <span aria-hidden="true" className="gift-toc-arrow">&rarr;</span>
                  </button>
                );
              })}
            </div>
          </div>

          <style>{`
            .gift-toc-card {
              background: rgba(245, 239, 230, 0.05);
              backdrop-filter: blur(3px);
              -webkit-backdrop-filter: blur(3px);
              border: 1px solid rgba(212, 182, 122, 0.22);
              border-radius: 18px;
              box-shadow: 0 4px 28px rgba(0, 0, 0, 0.4);
              padding: clamp(28px, 4.4vw, 40px) clamp(20px, 3.6vw, 32px);
            }
            .gift-toc-rule {
              display: block;
              width: 32px;
              height: 1px;
              background: ${C.gold};
              opacity: 0.55;
              margin: clamp(20px, 3vw, 28px) auto clamp(28px, 4vw, 36px);
            }
            .gift-toc-list {
              display: flex;
              flex-direction: column;
              max-width: 460px;
              margin: 0 auto;
              border-top: 1px solid ${C.cream3};
            }
            .gift-toc-row {
              appearance: none;
              -webkit-appearance: none;
              background: transparent;
              border: 0;
              border-bottom: 1px solid ${C.cream3};
              border-left: 4px solid transparent;
              cursor: pointer;
              width: 100%;
              display: flex;
              align-items: center;
              gap: 14px;
              padding: clamp(18px, 3vw, 22px) clamp(14px, 2.6vw, 20px);
              color: ${C.ink};
              font-family: Lato, system-ui, sans-serif;
              font-style: italic;
              line-height: 1.25;
              text-align: left;
              transition: background-color 200ms ease, color 200ms ease, border-color 200ms ease;
              -webkit-tap-highlight-color: transparent;
              outline: none;
              font-size: clamp(1.04rem, 3.4vw, 1.2rem);
            }
            .gift-toc-glyph {
              font-size: 1.05em;
              line-height: 1;
              opacity: 0.78;
              flex-shrink: 0;
              width: 24px;
              text-align: center;
            }
            .gift-toc-label { flex: 1; }
            .gift-toc-arrow {
              font-family: Lato, system-ui, sans-serif;
              font-style: normal;
              font-size: 1.18em;
              color: ${C.muted};
              margin-left: 12px;
              transition: transform 220ms ease, color 200ms ease;
              line-height: 1;
            }
            .gift-toc-row:focus-visible {
              outline: 2px solid ${C.rose};
              outline-offset: -2px;
            }
            @media (hover: hover) {
              .gift-toc-row:hover { background-color: ${C.cream2}; }
              .gift-toc-row:hover .gift-toc-arrow {
                transform: translateX(4px);
                color: ${C.rose};
              }
            }
            .gift-toc-row.is-active {
              color: ${C.rose};
              border-left-color: ${C.rose};
              background-color: ${C.cream2};
            }
            .gift-toc-row.is-active .gift-toc-arrow {
              color: ${C.rose};
              transform: translateX(4px);
            }
            .gift-toc-row.is-active .gift-toc-glyph { opacity: 1; }
            @media (prefers-reduced-motion: reduce) {
              .gift-toc-row, .gift-toc-arrow {
                transition: none !important;
                transform: none !important;
              }
            }
          `}</style>
        </motion.div>

        {/* ── TIER CARDS — gated on occasion pick. They MOUNT after
            the visitor selects an occasion (no greyed-out preview).
            Hidden state = nothing renders; selection triggers a fade-
            and-slide-in. Memorial is portrait-only (single product at
            Soul Bond price); other occasions render both tiers. ── */}
        <AnimatePresence>
          {selectedOccasion && (
            <motion.div
              key={`tiers-${selectedOccasion}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
          <p style={{ fontFamily: 'Lato, system-ui, sans-serif', fontSize: '0.72rem', fontWeight: 600, color: C.gold, textAlign: 'center', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 22 }}>
            {OCCASION_TIER_KICKER[selectedOccasion]}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {(() => {
              const occTiers = OCCASION_TIERS[selectedOccasion];
              const accent = OCCASION_ACCENT[selectedOccasion];
              // Memorial = single-product (portrait only at £49). Others
              // render both tiers with their occasion-specific copy.
              const visibleKeys: TierKey[] = selectedOccasion === 'memorial'
                ? ['portrait']
                : ['essential', 'portrait'];

              return visibleKeys.map((key) => (
                <TierCard
                  key={key}
                  tierKey={key}
                  selected={selectedTier === key}
                  onClick={() => handleTierSelect(key)}
                  fmt={fmt}
                  cents={TIER_CENTS[key].cents}
                  wasCents={TIER_CENTS[key].wasCents}
                  override={occTiers?.[key]}
                  accent={accent}
                />
              ));
            })()}
          </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── FLOW (appears after tier selection) ── */}
        <div id="gift-flow">
          <AnimatePresence>
            {selectedTier && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                style={{ marginTop: 36, paddingTop: 32, borderTop: `2px solid ${C.cream3}` }}
              >
                {/* Selected tier reminder */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
                  <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1rem', color: C.ink }}>{TIERS[selectedTier].label}</span>
                  <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1rem', color: C.ink }}>{fmt(TIER_CENTS[selectedTier].cents)}</span>
                  <button
                    onClick={() => { setSelectedTier(null); setStep(1); }}
                    style={{ marginLeft: 4, fontSize: '0.72rem', color: C.muted, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    change
                  </button>
                </div>

                {/* Step indicator */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
                  {[...Array(stepCount)].map((_, idx) => {
                    const s = idx + 1;
                    return (
                      <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.78rem', fontWeight: 700,
                          background: step >= s ? C.rose : C.cream3,
                          color: step >= s ? '#141210' : C.muted,
                          transition: 'all 0.3s',
                        }}>
                          {step > s ? <CheckCircle style={{ width: 14, height: 14 }} /> : s}
                        </div>
                        {s < stepCount && (
                          <div style={{ width: 28, height: 2, background: step > s ? C.rose : C.cream3, borderRadius: 2, transition: 'background 0.3s' }} />
                        )}
                      </div>
                    );
                  })}
                </div>

                <AnimatePresence mode="wait">

                  {/* ── STEP 1: Who? ── */}
                  {step === 1 && (
                    <motion.div key="ds1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                      <p style={{ textAlign: 'center', fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 400, fontSize: '1.3rem', color: C.ink }}>Who's it for?</p>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        {[
                          { key: 'single' as const, icon: User, title: 'One Soul', sub: 'For one cherished pet parent' },
                          { key: 'multiple' as const, icon: Users, title: 'A Few Souls', sub: 'For several gifts at once' },
                        ].map(opt => (
                          <button key={opt.key} onClick={() => setGiftType(opt.key)} style={{
                            padding: '22px 16px', borderRadius: 18,
                            border: `2px solid ${giftType === opt.key ? C.rose : C.cream3}`,
                            background: giftType === opt.key ? C.roseGlow : C.cream2,
                            cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', position: 'relative',
                          }}>
                            {opt.key === 'multiple' && (
                              <span style={{ position: 'absolute', top: 8, right: 8, fontSize: '0.6rem', fontWeight: 700, background: C.green, color: '#fff', padding: '2px 8px', borderRadius: 20 }}>
                                SAVE UP TO 30%
                              </span>
                            )}
                            <opt.icon style={{ width: 34, height: 34, margin: '0 auto 10px', color: giftType === opt.key ? C.rose : C.muted }} />
                            <p style={{ fontWeight: 700, fontSize: '0.95rem', color: C.ink }}>{opt.title}</p>
                            <p style={{ fontSize: '0.8rem', color: C.muted, marginTop: 4 }}>{opt.sub}</p>
                          </button>
                        ))}
                      </div>

                      {giftType && (
                        <motion.button
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          onClick={() => setStep(2)}
                          style={{
                            width: '100%', padding: '16px 0', borderRadius: 50, background: C.rose, color: '#141210',
                            fontFamily: 'Lato, system-ui, sans-serif', fontWeight: 600, fontSize: '0.96rem', letterSpacing: '0.02em', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            boxShadow: `0 4px 16px ${C.roseGlow}`,
                          }}
                        >
                          Continue <ChevronRight style={{ width: 18, height: 18 }} />
                        </motion.button>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontSize: '0.75rem', color: C.muted }}>
                        {[{ i: Shield, t: 'Secure checkout' }, { i: Clock, t: 'Instant delivery' }, { i: Gift, t: 'Valid 1 year' }].map((b, i) => (
                          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <b.i style={{ width: 13, height: 13 }} />{b.t}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* ── STEP 2: Delivery + recipient details ── */}
                  {step === 2 && (
                    <motion.div key="ds2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' }}>
                          <ArrowLeft style={{ width: 14, height: 14 }} /> Back
                        </button>
                        <p style={{ fontWeight: 700, fontSize: '1rem', color: C.ink }}>
                          {giftType === 'single' ? 'Their Details' : 'Add Recipients'}
                        </p>
                        <div style={{ width: 48 }} />
                      </div>

                      {/* Delivery method */}
                      <div style={{ padding: 20, background: C.cream2, borderRadius: 18, border: `1px solid ${C.cream3}` }}>
                        <p style={{ fontWeight: 600, color: C.ink, fontSize: '0.92rem', marginBottom: 12 }}>How should we deliver it?</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          {[
                            { key: 'link' as const, icon: LinkIcon, title: 'Magic link', sub: 'Share via text, card, or in person', badge: 'Most flexible', color: C.gold },
                            { key: 'email' as const, icon: Send, title: 'Email directly', sub: 'We send a beautiful gift email', badge: null, color: C.rose },
                          ].map(opt => (
                            <button key={opt.key} onClick={() => setDeliveryMethod(opt.key)} style={{
                              padding: 16, borderRadius: 14,
                              border: `2px solid ${deliveryMethod === opt.key ? opt.color : C.cream3}`,
                              background: deliveryMethod === opt.key ? (opt.key === 'link' ? C.goldSoft : C.roseGlow) : 'transparent',
                              cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', position: 'relative',
                            }}>
                              {opt.badge && (
                                <span style={{ position: 'absolute', top: -8, left: 12, fontSize: '0.58rem', fontWeight: 700, background: C.gold, color: '#141210', padding: '2px 8px', borderRadius: 20 }}>
                                  {opt.badge}
                                </span>
                              )}
                              <opt.icon style={{ width: 20, height: 20, color: deliveryMethod === opt.key ? opt.color : C.muted, marginBottom: 8 }} />
                              <p style={{ fontWeight: 700, fontSize: '0.88rem', color: C.ink }}>{opt.title}</p>
                              <p style={{ fontSize: '0.75rem', color: C.muted, marginTop: 2, lineHeight: 1.3 }}>{opt.sub}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Single recipient */}
                      {giftType === 'single' && (
                        <div style={{ padding: 20, background: C.cream2, borderRadius: 18, border: `1px solid ${C.cream3}` }}>
                          <p style={{ fontWeight: 600, color: C.ink, fontSize: '0.92rem', marginBottom: 12 }}>Who's the lucky pet parent?</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <input type="text" value={singleRecipient.name} onChange={e => updateSingleRecipient('name', e.target.value)} placeholder="Their name (optional)" style={inputStyle} />
                            {deliveryMethod === 'email' && (
                              <input type="email" value={singleRecipient.email} onChange={e => updateSingleRecipient('email', e.target.value)} placeholder="Their email address" style={inputStyle} />
                            )}
                            <div>
                              <p style={{ fontWeight: 600, color: C.ink, fontSize: '0.82rem', marginBottom: 6 }}>What's this reading for?</p>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                                {GIFT_OCCASION_OPTIONS.map((opt) => {
                                  const selected = (singleRecipient.occasion ?? 'discover') === opt.value;
                                  const isMem = opt.value === 'memorial';
                                  return (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => setSingleRecipient(r => ({ ...r, occasion: opt.value }))}
                                      style={{
                                        padding: '8px 10px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                                        border: selected
                                          ? `1.5px solid ${isMem ? '#788280' : C.gold}`
                                          : `1px solid ${C.cream3}`,
                                        background: selected
                                          ? (isMem ? 'rgba(120,130,125,0.18)' : C.goldSoft)
                                          : C.cream2,
                                        fontFamily: 'Lato, system-ui, sans-serif',
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: C.ink }}>
                                        <span>{opt.emoji}</span>{opt.label}
                                      </div>
                                      <div style={{ fontSize: '0.7rem', color: C.muted, marginTop: 2 }}>{opt.hint}</div>
                                    </button>
                                  );
                                })}
                              </div>
                              <p style={{ fontSize: '0.72rem', color: C.muted, marginTop: 6 }}>
                                Don't know? Leave as Discover — they can change it when they redeem.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Multiple recipients */}
                      {giftType === 'multiple' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {recipients.map((r, idx) => (
                            <div key={r.id} style={{ padding: 16, background: C.cream2, borderRadius: 16, border: `1px solid ${C.cream3}` }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ width: 24, height: 24, borderRadius: '50%', background: C.rose, color: '#141210', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>{idx + 1}</span>
                                  <span style={{ fontWeight: 600, fontSize: '0.88rem', color: C.ink }}>{r.name || `Recipient ${idx + 1}`}</span>
                                </div>
                                {recipients.length > 1 && (
                                  <button onClick={() => setRecipients(rs => rs.filter(x => x.id !== r.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4 }}>
                                    <Trash2 style={{ width: 16, height: 16 }} />
                                  </button>
                                )}
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: deliveryMethod === 'email' ? '1fr 1fr' : '1fr', gap: 8 }}>
                                <input type="text" value={r.name} onChange={e => updateRecipient(r.id, 'name', e.target.value)} placeholder="Name" style={{ ...inputStyle, padding: '10px 14px', fontSize: '0.88rem' }} />
                                {deliveryMethod === 'email' && (
                                  <input type="email" value={r.email} onChange={e => updateRecipient(r.id, 'email', e.target.value)} placeholder="Email" style={{ ...inputStyle, padding: '10px 14px', fontSize: '0.88rem' }} />
                                )}
                              </div>
                              <div style={{ marginTop: 10 }}>
                                <p style={{ fontWeight: 600, color: C.ink, fontSize: '0.78rem', marginBottom: 6 }}>What's their reading for?</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                  {GIFT_OCCASION_OPTIONS.map((opt) => {
                                    const selected = (r.occasion ?? 'discover') === opt.value;
                                    const isMem = opt.value === 'memorial';
                                    return (
                                      <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setRecipients(rs => rs.map(x => x.id === r.id ? { ...x, occasion: opt.value } : x))}
                                        style={{
                                          padding: '6px 10px', borderRadius: 14, cursor: 'pointer',
                                          border: selected
                                            ? `1.5px solid ${isMem ? '#788280' : C.gold}`
                                            : `1px solid ${C.cream3}`,
                                          background: selected
                                            ? (isMem ? 'rgba(120,130,125,0.18)' : C.goldSoft)
                                            : C.cream2,
                                          fontFamily: 'Lato, system-ui, sans-serif',
                                          fontSize: '0.78rem', fontWeight: 600, color: C.ink,
                                        }}
                                      >
                                        {opt.emoji} {opt.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          ))}
                          {recipients.length < 10 && (
                            <button
                              onClick={() => setRecipients(rs => [...rs, { id: crypto.randomUUID(), name: '', email: '', occasion: selectedOccasion ?? 'discover' }])}
                              style={{
                                padding: 14, borderRadius: 14, border: `2px dashed ${C.rose}40`, background: C.roseGlow, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: C.rose, fontWeight: 600, fontSize: '0.88rem', fontFamily: 'Lato, system-ui, sans-serif',
                              }}
                            >
                              <Plus style={{ width: 18, height: 18 }} /> Add another person
                              {discount < 0.30 && (
                                <span style={{ fontSize: '0.72rem', color: C.green, marginLeft: 4 }}>
                                  +{Math.round((getVolumeDiscount(recipients.length + 1) - discount) * 100)}% off
                                </span>
                              )}
                            </button>
                          )}
                        </div>
                      )}

                      <button onClick={() => setStep(3)} disabled={!canProceedStep2()} style={{
                        width: '100%', padding: '16px 0', borderRadius: 50,
                        background: canProceedStep2() ? C.rose : C.cream3,
                        color: canProceedStep2() ? '#141210' : C.muted,
                        fontFamily: 'Lato, system-ui, sans-serif', fontWeight: 600, fontSize: '0.96rem', letterSpacing: '0.02em',
                        border: 'none', cursor: canProceedStep2() ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        boxShadow: canProceedStep2() ? `0 4px 16px ${C.roseGlow}` : 'none',
                      }}>
                        Continue to Checkout <ChevronRight style={{ width: 18, height: 18 }} />
                      </button>
                    </motion.div>
                  )}

                  {/* ── STEP 3: Checkout ── */}
                  {step === 3 && (
                    <motion.div key="ds3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' }}>
                          <ArrowLeft style={{ width: 14, height: 14 }} /> Back
                        </button>
                        <p style={{ fontWeight: 700, fontSize: '1rem', color: C.ink }}>Almost Done</p>
                        <div style={{ width: 48 }} />
                      </div>

                      {/* Gift message first — emotional anchor */}
                      <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: C.ink, display: 'block', marginBottom: 4 }}>
                          Write them a message
                        </label>
                        <p style={{ fontSize: '0.78rem', color: C.muted, marginBottom: 8 }}>They'll see this the moment they open their gift.</p>
                        <textarea
                          value={giftMessage}
                          onChange={e => setGiftMessage(e.target.value)}
                          placeholder={`From the moment I saw you with your pet, I knew you two were meant to be...`}
                          rows={3}
                          maxLength={500}
                          style={{ ...inputStyle, resize: 'none' as const }}
                        />
                      </div>

                      {/* Purchaser email */}
                      <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: C.ink, display: 'block', marginBottom: 6 }}>
                          Your email
                          <span style={{ fontWeight: 400, color: C.muted }}> (for your receipt & gift link)</span>
                        </label>
                        <input type="email" value={purchaserEmail} onChange={e => setPurchaserEmail(e.target.value)} placeholder="your@email.com" style={inputStyle} />
                      </div>

                      {/* Order summary */}
                      <div style={{ padding: 20, background: C.cream2, borderRadius: 18, border: `1px solid ${C.cream3}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 12, borderBottom: `1px solid ${C.cream3}`, marginBottom: 12 }}>
                          <Gift style={{ width: 16, height: 16, color: C.rose }} />
                          <p style={{ fontWeight: 700, color: C.ink, fontSize: '0.88rem' }}>Order Summary</p>
                        </div>
                        {activeRecipients.map((r, idx) => (
                          <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: idx < activeRecipients.length - 1 ? `1px solid ${C.cream3}` : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <PawPrint style={{ width: 14, height: 14, color: C.gold, flexShrink: 0 }} />
                              <div>
                                <p style={{ fontWeight: 600, fontSize: '0.85rem', color: C.ink }}>{TIERS[selectedTier!].label}</p>
                                {r.name && <p style={{ fontSize: '0.72rem', color: C.rose }}>for {r.name}</p>}
                              </div>
                            </div>
                            <span style={{ fontSize: '0.88rem', color: C.muted }}>{fmt(TIER_CENTS[selectedTier!].cents)}</span>
                          </div>
                        ))}
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.cream3}` }}>
                          {discount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
                              <span style={{ color: C.green, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Sparkles style={{ width: 12, height: 12 }} />{Math.round(discount * 100)}% volume discount
                              </span>
                              <span style={{ color: C.green }}>−{fmt(pricing.discountAmount)}</span>
                            </div>
                          )}
                          {pricing.promoAmount > 0 && appliedCoupon && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
                              <span style={{ color: C.green, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Sparkles style={{ width: 12, height: 12 }} />{appliedCoupon.code} ({appliedCoupon.discount_value}% off)
                              </span>
                              <span style={{ color: C.green }}>−{fmt(pricing.promoAmount)}</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700 }}>
                            <span style={{ color: C.ink }}>Total</span>
                            <span style={{ color: C.ink, fontFamily: '"Playfair Display", Georgia, serif' }}>
                              {fmt(pricing.finalTotal)}
                            </span>
                          </div>
                          {isLocalized && (
                            <p style={{ fontSize: '0.7rem', color: C.muted, marginTop: 6, textAlign: 'right' }}>
                              Shown in {currencyCode} — billed in USD at checkout.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Promo code */}
                      {appliedCoupon ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: 'rgba(74,140,92,0.1)', border: '1px solid rgba(74,140,92,0.3)' }}>
                          <span style={{ fontSize: '0.85rem', color: C.green, fontWeight: 600 }}>{appliedCoupon.code} — {appliedCoupon.discount_value}% off applied!</span>
                          <button onClick={() => setAppliedCoupon(null)} style={{ background: 'none', border: 'none', color: C.green, cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}>&times;</button>
                        </div>
                      ) : (
                        <div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input
                              value={promoCode}
                              onChange={e => setPromoCode(e.target.value.toUpperCase())}
                              placeholder="PROMO CODE"
                              onKeyDown={e => e.key === 'Enter' && applyPromo()}
                              style={{ ...inputStyle, flex: 1, textTransform: 'uppercase' as const }}
                            />
                            <button
                              onClick={applyPromo}
                              disabled={!promoCode.trim() || isValidatingPromo}
                              style={{ padding: '14px 20px', borderRadius: 14, background: C.rose, color: '#141210', border: 'none', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', opacity: (!promoCode.trim() || isValidatingPromo) ? 0.5 : 1, whiteSpace: 'nowrap' }}
                            >
                              {isValidatingPromo ? '...' : 'Apply'}
                            </button>
                          </div>
                          {promoError && <p style={{ color: '#f0d99f', fontSize: '0.75rem', marginTop: 4 }}>{promoError}</p>}
                        </div>
                      )}

                      {/* Guarantee */}
                      <div style={{ padding: 16, borderRadius: 16, background: 'rgba(74,140,92,0.06)', border: '1px solid rgba(74,140,92,0.15)', display: 'flex', alignItems: 'start', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(74,140,92,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Shield style={{ width: 18, height: 18, color: C.green }} />
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '0.85rem', color: C.green, marginBottom: 2 }}>100% happiness guarantee</p>
                          <p style={{ fontSize: '0.78rem', color: C.warm, lineHeight: 1.4 }}>If they don't absolutely love it, full refund — no questions asked.</p>
                        </div>
                      </div>

                      {/* Pay button */}
                      <button
                        onClick={handlePurchase}
                        disabled={isLoading || !purchaserEmail.includes('@')}
                        style={{
                          width: '100%', padding: '18px 0', borderRadius: 50,
                          background: (isLoading || !purchaserEmail.includes('@')) ? C.cream3 : C.rose,
                          color: (isLoading || !purchaserEmail.includes('@')) ? C.muted : '#141210',
                          fontFamily: 'Lato, system-ui, sans-serif', fontWeight: 600, fontSize: '1.04rem', letterSpacing: '0.02em', border: 'none',
                          cursor: (isLoading || !purchaserEmail.includes('@')) ? 'default' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          boxShadow: `0 6px 20px ${C.roseGlow}`,
                          transition: 'all 0.2s',
                        }}
                      >
                        {isLoading
                          ? <><SpinnerInline />Processing...</>
                          : <><Gift style={{ width: 20, height: 20 }} />Send This Gift — {fmt(pricing.finalTotal)}</>
                        }
                      </button>

                      <TrustRow items={['Secure checkout', 'Instant delivery', 'Valid 1 year']} icons={[Shield, Clock, Gift]} />
                    </motion.div>
                  )}

                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

          </div>{/* /.g7-col */}
        </section>

        <div className="rule" />

        {/* PROOF — what people say after they give it (4 gift-giver quotes). */}
        <Proof />

        <div className="rule" />

        {/* REASSURANCE + FAQ */}
        <Reassurance />

        {/* CLOSING */}
        <Closing fmt={fmt} prices={prices} onCta={scrollToPicker} />

        <SiteFooter />

      </main>

      <style>{GIFT7_CSS}</style>
    </div>
  );
}

function SpinnerInline() {
  return (
    <div style={{ width: 18, height: 18, border: '2px solid rgba(20,18,16,0.3)', borderTopColor: '#141210', borderRadius: '50%', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
  );
}

function TrustRow({ items, icons }: { items: string[]; icons: React.ElementType[] }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', fontSize: '0.72rem', color: '#9d8d7f' }}>
      {items.map((t, i) => {
        const Icon = icons[i];
        return (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon style={{ width: 12, height: 12 }} />{t}
          </span>
        );
      })}
    </div>
  );
}
