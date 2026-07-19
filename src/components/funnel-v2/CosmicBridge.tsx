import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* =====================================================================
   THE OPENING PASSAGE — littlesouls.app universal passage (2026-07-18).
   Danny-approved verbatim copy, ONE voice for every visitor: there is no
   discovery/memorial branch in the passage anymore (the here/memory
   choice now lives on the "Set the chart" form). A calm staged reveal
   that flows read aloud, beat by beat:

     B1  the love         — "We love animals just as much as each other.
                            If not more."
     B2  the daily proof  — the small, daily things, each a short line
                            that rises in on its own, into the turn:
                            "so much of them stays a mystery."
     B3  the question     — "what would they say if they could speak?"
     B4  the answer       — "They can." the universe is always speaking;
                            we just need to listen
     B5  the birth sky    — a real natal wheel draws while the thread
                            passes plumb on its left; the real moon
                            arrives beside the sky line; ONE meteor
     B6  release          — "Type their birthday, and hear the rest."

   Carried by ONE violet thread: a dead-straight plumb line down a left
   spine, born at the TOP of the passage, igniting one station node per
   beat (only the latest pulses), then finding the form card and tracing
   its border shut — the button ignites only AFTER the border seals.
   Whisper-to-huge type scale. Purple/white only (gold never appears).

   STRICT-CSP SAFE: GSAP core bundled by Vite (script-src 'self'), inline
   SVG + stroke-dashoffset, sanctioned canvas starfield, self-hosted moon
   photo. Reduced motion reads the finished passage at rest: thread fully
   drawn, nodes lit, wheel complete, moon sharp, form sealed, no drift.
===================================================================== */

/* bespoke zodiac + planet glyph paths (consumed by ReadingsLanding's wheel).
   Drawn to astrology-software letterforms on a ±7.5 grid, y down, every
   stroke round-capped at one weight - each symbol must read at a glance:
   Aries ram horns, Taurus head+horns, Gemini twins, Cancer 69, Leo mane+tail,
   Virgo arches+loop, Libra omega over line, Scorpio arches+arrow tail,
   Sagittarius arrow+crossbar, Capricorn horn+loop tail, Aquarius twin waves,
   Pisces two fishes bound, then the ten classical planet sigils. */
export const GLYPH: Record<string, string> = {
  aries: '<path class="gl-s" d="M0,7 L0,-1.8 M0,-1.8 C0,-5.4 -1.7,-7.1 -3.7,-7.1 C-5.9,-7.1 -7.1,-5.3 -7.1,-3.1 M0,-1.8 C0,-5.4 1.7,-7.1 3.7,-7.1 C5.9,-7.1 7.1,-5.3 7.1,-3.1"/>',
  taurus: '<circle class="gl-s" cx="0" cy="2.9" r="4.1"/><path class="gl-s" d="M-5.2,-7 A5.23,5.23 0 1 0 5.2,-7"/>',
  gemini: '<path class="gl-s" d="M-3.3,-4.9 L-3.3,4.9 M3.3,-4.9 L3.3,4.9 M-6,-6.5 C-2.5,-4.7 2.5,-4.7 6,-6.5 M-6,6.5 C-2.5,4.7 2.5,4.7 6,6.5"/>',
  cancer: '<path class="gl-s" d="M-1.4,-3.6 C0.7,-6.1 4.1,-6.5 6.4,-5.1 M1.4,3.6 C-0.7,6.1 -4.1,6.5 -6.4,5.1"/><circle class="gl-s" cx="-3.7" cy="-2.9" r="2.4"/><circle class="gl-s" cx="3.7" cy="2.9" r="2.4"/>',
  leo: '<circle class="gl-s" cx="-4.2" cy="4.3" r="2.3"/><path class="gl-s" d="M-2.3,3 C-0.9,1.1 -2.7,-1.9 -3.1,-4 C-3.5,-6.1 -1.7,-7.4 0,-7.4 C1.9,-7.4 3.3,-5.9 3.3,-4 C3.3,-1.6 1.7,1.1 1.7,3.5 C1.7,5.5 3.5,6.5 5.3,5.3"/>',
  virgo: '<path class="gl-s" d="M-7.3,-4.7 C-6.7,-5.9 -4.5,-5.9 -4.5,-3.8 L-4.5,5.6 M-4.5,-3.8 C-4.5,-5.9 -1.7,-5.9 -1.7,-3.8 L-1.7,5.6 M-1.7,-3.8 C-1.7,-5.9 1.1,-5.9 1.1,-3.8 L1.1,2.8 C1.1,5.2 2.7,6.4 4.5,6.4 C6.3,6.4 7.3,5.1 6.9,3.8 C6.5,2.5 4.9,2.2 4,3.3 C3,4.5 3.6,6.6 4.9,7.9"/>',
  libra: '<path class="gl-s" d="M-7,0.4 L-3.2,0.4 A3.35,3.35 0 1 1 3.2,0.4 L7,0.4 M-7,4.2 L7,4.2"/>',
  scorpio: '<path class="gl-s" d="M-7.3,-4.7 C-6.7,-5.9 -4.5,-5.9 -4.5,-3.8 L-4.5,5.6 M-4.5,-3.8 C-4.5,-5.9 -1.7,-5.9 -1.7,-3.8 L-1.7,5.6 M-1.7,-3.8 C-1.7,-5.9 1.1,-5.9 1.1,-3.8 L1.1,3.2 C1.1,5.3 2.3,6.3 4.3,6.3 L6.9,6.3 M6.9,6.3 L5.2,4.8 M6.9,6.3 L5.2,7.8"/>',
  sagittarius: '<path class="gl-s" d="M-6.3,6.3 L6.3,-6.3 M6.3,-6.3 L1.6,-6.3 M6.3,-6.3 L6.3,-1.6 M-4.7,0.5 L-0.5,4.7"/>',
  capricorn: '<path class="gl-s" d="M-7.2,-5.6 L-4.6,1.8 M-4.6,1.8 C-4.8,-2.6 -3.6,-5.9 -1.9,-5.9 C-0.4,-5.9 0.1,-3.9 0.1,-1.5 L0.1,3.4 C0.1,6.1 2.2,7.5 4.2,6.9 C6,6.4 6.6,4.4 5.5,3.3 C4.5,2.3 2.9,2.7 2.6,4.1"/>',
  aquarius: '<path class="gl-s" d="M-6.6,-1.5 L-3.3,-4.3 L0,-1.5 L3.3,-4.3 L6.6,-1.5 M-6.6,4.3 L-3.3,1.5 L0,4.3 L3.3,1.5 L6.6,4.3"/>',
  pisces: '<path class="gl-s" d="M-3.2,-6.7 C-6.1,-4.3 -6.1,4.3 -3.2,6.7 M3.2,-6.7 C6.1,-4.3 6.1,4.3 3.2,6.7 M-5.3,0 L5.3,0"/>',
  sun: '<circle class="gl-s" cx="0" cy="0" r="5.9"/><circle class="gl-f" cx="0" cy="0" r="1.5"/>',
  moon: '<path class="gl-s" d="M0,-6 A6,6 0 0 0 0,6 A9.3,9.3 0 0 1 0,-6 Z"/>',
  mercury: '<circle class="gl-s" cx="0" cy="-0.6" r="3.1"/><path class="gl-s" d="M-3.2,-6.6 A3.3,3.3 0 0 0 3.2,-6.6 M0,2.5 L0,7 M-2.3,4.7 L2.3,4.7"/>',
  venus: '<circle class="gl-s" cx="0" cy="-2.3" r="3.6"/><path class="gl-s" d="M0,1.3 L0,7 M-2.6,4.2 L2.6,4.2"/>',
  mars: '<circle class="gl-s" cx="-1.3" cy="1.9" r="3.9"/><path class="gl-s" d="M1.5,-0.9 L6.2,-5.6 M6.2,-5.6 L2.5,-5.6 M6.2,-5.6 L6.2,-1.9"/>',
  jupiter: '<path class="gl-s" d="M-6.5,-2.8 C-6.3,-5.3 -3.6,-6.7 -1.8,-5.2 C0.1,-3.6 -1,-0.7 -5.9,2.3 L5,2.3 M2.4,-6.5 L2.4,7"/>',
  saturn: '<path class="gl-s" d="M-2.9,-6.9 L-2.9,3 M-4.9,-4.4 L-0.9,-4.4 M-2.9,-0.9 C-1.1,-2.9 2,-2.5 2.8,-0.3 C3.6,1.8 2.2,3.7 0.8,4.9 C-0.1,5.7 -0.1,6.7 0.8,7.1"/>',
  uranus: '<circle class="gl-s" cx="0" cy="4.7" r="2"/><path class="gl-s" d="M0,2.7 L0,-2.9 M-4.4,-6.7 L-4.4,0.9 M4.4,-6.7 L4.4,0.9 M-4.4,-2.9 L4.4,-2.9"/>',
  neptune: '<path class="gl-s" d="M-4.7,-6 L-4.7,-2.9 C-4.7,-0.3 -2.5,1.2 0,1.2 C2.5,1.2 4.7,-0.3 4.7,-2.9 L4.7,-6 M0,-6.7 L0,7 M-2.4,4.5 L2.4,4.5 M-1.3,-5.3 L0,-6.7 L1.3,-5.3 M-6,-4.6 L-4.7,-6 L-3.4,-4.6 M3.4,-4.6 L4.7,-6 L6,-4.6"/>',
  pluto: '<circle class="gl-s" cx="0" cy="-4.6" r="1.9"/><path class="gl-s" d="M-4,-4.4 A4,4 0 0 0 4,-4.4 M0,-0.4 L0,7 M-2.4,3.3 L2.4,3.3"/>',
  northNode: '<path class="gl-s" d="M-3.7,4.6 C-6.7,-3.4 6.7,-3.4 3.7,4.6"/><circle class="gl-f" cx="-3.9" cy="4.8" r="1.5"/><circle class="gl-f" cx="3.9" cy="4.8" r="1.5"/>',
  chiron: '<circle class="gl-s" cx="0" cy="4.2" r="2.2"/><path class="gl-s" d="M-1.6,-6.3 L-1.6,2 M-1.6,-1.7 L2.4,-6.3 M-1.6,-1.7 L2.4,2"/>',
  lilith: '<path class="gl-f" d="M1,-6.4 A3,3 0 1 0 1,-0.4 A4,4 0 0 1 1,-6.4 Z"/><path class="gl-s" d="M0,-0.4 L0,6.6 M-2.4,3.4 L2.4,3.4"/>',
};

// exponential-falloff cubic-bezier(.16,1,.3,1) - the ONE house ease, solved
// the same way a browser does (Newton then bisection). Used on every settle.
function makeCubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) { const e = sx(t) - x; if (Math.abs(e) < 1e-5) return sy(t); const d = dx(t); if (Math.abs(d) < 1e-6) break; t -= e / d; }
    let lo = 0, hi = 1; t = x;
    while (lo < hi) { const e = sx(t); if (Math.abs(e - x) < 1e-5) break; if (x > e) lo = t; else hi = t; t = (lo + hi) / 2; }
    return sy(t);
  };
}
export const HOUSE = makeCubicBezier(0.16, 1, 0.3, 1);

/* ---- the natal wheel geometry (module scope, deterministic) ----
   A REAL natal chart: Monty, born 15 June 2019 - the same example chart the
   free reading demonstrates. Longitudes come from the production VSOP87
   engine (pet-birth-chart edge function, ephemeris-v2), so every glyph sits
   at its true zodiacal position and every aspect chord is computed from the
   real separations. Date-only chart, so the wheel reads 0° Aries at the
   left with whole-sign cusps (the standard presentation when no birth time
   is known). Drawn on scroll via stroke-dashoffset + staggered opacity. */
const W_C = 160;
const wpt = (deg: number, r: number) => ({
  x: +(W_C + r * Math.cos((deg * Math.PI) / 180)).toFixed(1),
  y: +(W_C + r * Math.sin((deg * Math.PI) / 180)).toFixed(1),
});
/* ecliptic longitude -> point: 0° Aries at 9 o'clock, zodiac counterclockwise */
const wP = (lon: number, r: number) => wpt(180 - lon, r);

/* Monty's real sky, 2019-06-15 (VSOP87 engine output, degree within sign) */
const CHART_BODIES = [
  { id: "sun", lon: 83 },      // Gemini 23
  { id: "moon", lon: 241 },    // Sagittarius 1
  { id: "mercury", lon: 107 }, // Cancer 17
  { id: "venus", lon: 67 },    // Gemini 7
  { id: "mars", lon: 109 },    // Cancer 19
  { id: "jupiter", lon: 258 }, // Sagittarius 18
  { id: "saturn", lon: 288 },  // Capricorn 18
  { id: "uranus", lon: 35 },   // Taurus 5
  { id: "neptune", lon: 348 }, // Pisces 18
  { id: "pluto", lon: 292 },   // Capricorn 22
];

/* radii: 154 outer ring · 123 zodiac-band inner edge · 38 aspect circle */
const WHEEL_SEG_FILLS = Array.from({ length: 12 }, (_, k) => {
  const a0 = k * 30, a1 = a0 + 30;
  const o0 = wP(a0, 154), o1 = wP(a1, 154), i1 = wP(a1, 123), i0 = wP(a0, 123);
  return {
    d: `M${o0.x},${o0.y} A154,154 0 0 0 ${o1.x},${o1.y} L${i1.x},${i1.y} A123,123 0 0 1 ${i0.x},${i0.y} Z`,
    dim: k % 2 === 0,
  };
});
const WHEEL_SIGNBOUNDS = Array.from({ length: 12 }, (_, k) => {
  const a = k * 30;
  return { p1: wP(a, 123), p2: wP(a, 154) };
});
const WHEEL_TICKS = (() => {
  const out: { p1: { x: number; y: number }; p2: { x: number; y: number }; mj: boolean }[] = [];
  for (let deg = 0; deg < 360; deg++) {
    if (deg % 30 === 0) continue;
    const len = deg % 10 === 0 ? 6.5 : deg % 5 === 0 ? 4.8 : 2.6;
    out.push({ p1: wP(deg, 123), p2: wP(deg, 123 + len), mj: deg % 5 === 0 });
  }
  return out;
})();
const SIGN_ORDER = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];
const WHEEL_SIGNS = SIGN_ORDER.map((name, k) => ({
  name, p: wP(k * 30 + 15, 142), d: 1.0 + k * 0.045,
}));
/* whole-sign house cusps: hairline spokes, aspect circle to the band */
const WHEEL_SPOKES = Array.from({ length: 12 }, (_, k) => {
  const a = k * 30;
  return { p1: wP(a, 38), p2: wP(a, 123), d: 0.75 + k * 0.05 };
});
/* planets: glyph + degree label travel as one unit at its true longitude.
   Crowded placements relax apart in angle AND, inside a stellium (true
   separations within ~8°), drop to a second radial shelf - the standard
   pro-chart solution - while every unit keeps a thin pointer tick to its
   exact degree on the band. Each degree label then slides inward until its
   text box measurably clears its glyph box (text is wide, not tall, so the
   clearance a label needs depends on where it sits around the circle). */
const WHEEL_PLANETS = (() => {
  const SAME = 20;                   // slot between units sharing a shelf
  const CROSS = 10;                  // slot between units on different shelves
  const CLUSTER = 8;                 // true-longitude gap that makes a stellium
  const R_GLYPH = [106, 71];         // outer / inner shelf, glyph centre
  const GH = 9.3;                    // glyph half-extent
  const LH = 6;                      // label half-height (16px Newsreader)
  const PAD = 1.5;
  const halfW = (t: string) => ((t.length - 1) * 0.52 + 0.4) * 8;
  const s = CHART_BODIES.map((b) => ({ ...b, adj: b.lon, level: 0 })).sort((a, b) => a.lon - b.lon);
  let run = 0;
  for (let i = 1; i < s.length; i++) {
    if (s[i].lon - s[i - 1].lon <= CLUSTER) { run++; s[i].level = run % 2; }
    else run = 0;
  }
  if (s.length > 1 && s[0].lon + 360 - s[s.length - 1].lon <= CLUSTER && s[s.length - 1].level === 0) s[0].level = 1;
  for (let pass = 0; pass < 48; pass++) {
    let moved = false;
    for (let i = 0; i < s.length; i++) {
      const a = s[i], b = s[(i + 1) % s.length];
      const req = a.level === b.level ? SAME : CROSS;
      const gap = (((b.adj - a.adj) % 360) + 360) % 360;
      if (gap < req - 0.01) {
        const push = (req - gap) / 2;
        a.adj -= push; b.adj += push; moved = true;
      }
    }
    if (!moved) break;
  }
  return s.map((p, k) => {
    const deg = `${p.lon % 30}°`;
    const rg = R_GLYPH[p.level];
    const g = wP(p.adj, rg);
    const hw = halfW(deg);
    let rl = rg - 14;
    for (let i = 0; i < 60; i++) {
      const l = wP(p.adj, rl);
      if (Math.abs(l.x - g.x) >= hw + GH + PAD || Math.abs(l.y - g.y) >= LH + GH + PAD) break;
      rl -= 0.5;
    }
    return {
      id: p.id,
      deg,
      glyph: g,
      label: wP(p.adj, rl),
      c1: wP(p.adj, rg + 10.5),
      c2: wP(p.lon, 118),
      t1: wP(p.lon, 123),
      t2: wP(p.lon, 118),
      d: 1.5 + k * 0.09,
    };
  });
})();
/* real aspects computed from the real longitudes (conjunction, square,
   trine, opposition, within orb). Conjunctions read as adjacent glyphs -
   the professional rendering - so only the other three draw chords. */
const WHEEL_ASPECTS = (() => {
  const types = [
    { angle: 0, orb: 8 },
    { angle: 90, orb: 7 },
    { angle: 120, orb: 8 },
    { angle: 180, orb: 8 },
  ];
  const out: { p1: { x: number; y: number }; p2: { x: number; y: number }; len: number; soft: boolean; d: number }[] = [];
  for (let i = 0; i < CHART_BODIES.length; i++) {
    for (let j = i + 1; j < CHART_BODIES.length; j++) {
      const raw = Math.abs(CHART_BODIES[i].lon - CHART_BODIES[j].lon);
      const sep = Math.min(raw, 360 - raw);
      for (const t of types) {
        if (Math.abs(sep - t.angle) <= t.orb) {
          if (t.angle > 0) {
            const p1 = wP(CHART_BODIES[i].lon, 38);
            const p2 = wP(CHART_BODIES[j].lon, 38);
            const len = Math.ceil(Math.hypot(p2.x - p1.x, p2.y - p1.y)) + 2;
            out.push({ p1, p2, len, soft: t.angle === 120, d: 2.05 + out.length * 0.1 });
          }
          break;
        }
      }
    }
  }
  return out;
})();

/* the pivot's three annotated stars carry the REAL Venus/Sun/Moon degrees
   from CHART_BODIES; the same three labels later glide into the wheel */
const ANNOT_PLANETS = ["venus", "sun", "moon"] as const;
const ANNOT_DEGS = ANNOT_PLANETS.map(
  (id) => `${(CHART_BODIES.find((b) => b.id === id)?.lon ?? 0) % 30}°`,
);
/* a chooser flip pends a birth spark on the remounted passage */
let INTENT_FLIP_PENDING = false;

const LCB_CSS = `
/* ==== THE COLUMN CONTRACT - ONE rail, ONE text edge, chooser + passage ====
   The chooser (.ls-tgl-col, in ReadingsLanding) and the passage (.c2-col) are
   ONE composition sharing ONE left spine, so they MUST resolve to the same
   box. They are separate sections, so the geometry is declared here once and
   both consume it. Never hard-code these numbers at either consumer.

   Before 2026-07-16 they drifted: .ls-tgl-section carried 20px of side padding
   .lcb-root did not, and the two padding-lefts were 84 vs 104. Result: the
   chooser's text edge landed at x=344 and the passage's at x=365 on desktop,
   and the offset changed again between 768-899. Nothing lined up, and the
   whole section read as stacked beats instead of one column. The contract is
   the fix: identical max-width, identical margin, identical padding-left, no
   section side padding on either. Change a number here and BOTH move together.

     --c2-spine  x of the violet thread, from the column's left edge
     --c2-padl   x of every text edge (chooser + passage), same edge
     --c2-padr   passage's right padding (the chooser keeps its own: the
                 toggle is a wide object and the right edge is ragged anyway) */
.lcb-root, .ls-tgl-col{
  --c2-spine:24px; --c2-padl:60px; --c2-padr:22px;
}
@media (min-width:900px){
  .lcb-root, .ls-tgl-col{ --c2-spine:44px; --c2-padl:104px; --c2-padr:40px; }
}

.lcb-root{
  --lcb-bg:#0d0a14; --lcb-deep:#070510; --lcb-lift:#100c1a;
  --lcb-violet:#8b7bd8; --lcb-violet-br:#a78bfa; --lcb-violet-soft:#b3a7e0;
  --lcb-white:#f5f2ff;
  /* Legibility floor (raised 2026-07-16). The passage reads on a #0d0a14
     stage, so "quiet" is carried by SIZE and ITALIC, never by dimness: a
     dimmed serif italic on a dark field reads faint however good its contrast
     ratio is, which is exactly what it was doing. */
  --lcb-body:rgba(245,242,255,.92);
  --lcb-dim:rgba(245,242,255,.55);
  --lcb-mute:rgba(245,242,255,.92);
  --lcb-frag:rgba(245,242,255,.97);
  position:relative;
  overflow-x:clip;
  pointer-events:none;
  font-family:"Newsreader",Georgia,serif;font-weight:400;
  -webkit-font-smoothing:antialiased;
}

/* ---- fixed graded night stage (the ONE sky for the whole page) ---- */
.lcb-back{position:fixed;inset:0;z-index:1;overflow:hidden;pointer-events:none;opacity:0;will-change:opacity}
.lcb-front{position:fixed;inset:0;z-index:3;pointer-events:none;opacity:0;will-change:opacity}
.lcb-sky{position:absolute;inset:0;background:linear-gradient(180deg,var(--lcb-deep) 0%,var(--lcb-bg) 48%,var(--lcb-lift) 100%)}
.lcb-sky-violet{position:absolute;inset:0;opacity:0;will-change:opacity;
  background:linear-gradient(180deg,#0b0813 0%,#16111e 56%,#1b1526 100%)}
.lcb-dawn-horizon{position:absolute;inset:0;opacity:0;will-change:opacity;mix-blend-mode:screen;
  background:radial-gradient(ellipse 130% 48% at 50% 108%, rgba(139,123,216,0.20) 0%, rgba(139,123,216,0.10) 36%, rgba(139,123,216,0.035) 58%, rgba(139,123,216,0) 76%)}
.lcb-canvas-wrap{position:absolute;inset:-8% -6%;will-change:transform}
.lcb-canvas{position:absolute;inset:0;width:100%;height:100%;will-change:transform}
.lcb-grade{position:absolute;inset:0;pointer-events:none;mix-blend-mode:soft-light;
  background:linear-gradient(158deg, rgba(20,18,46,0.5) 0%, rgba(120,126,180,0.08) 55%, rgba(201,199,252,0.10) 100%)}
.lcb-veil{position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(180deg, rgba(7,5,14,0.5) 0%, rgba(7,5,14,0) 22%, rgba(7,5,14,0) 76%, rgba(7,5,14,0.5) 100%)}
.lcb-vignette{position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(ellipse at 50% 44%, transparent 46%, rgba(5,4,12,0.48) 100%)}
.lcb-grain{position:absolute;inset:0;pointer-events:none;opacity:.034;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  -webkit-mask-image:linear-gradient(90deg,#000 0,#000 calc(50% - 410px),transparent calc(50% - 330px),transparent calc(50% + 330px),#000 calc(50% + 410px),#000 100%);
  mask-image:linear-gradient(90deg,#000 0,#000 calc(50% - 410px),transparent calc(50% - 330px),transparent calc(50% + 330px),#000 calc(50% + 410px),#000 100%)}

/* ---- the column: one narrative rail, left-spined like the contract ---- */
.c2-col{
  position:relative; z-index:2;
  max-width:760px; margin:0 auto;
  padding-left:var(--c2-padl); padding-right:var(--c2-padr);
}
.c2-threadwrap{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0}
.c2-threadwrap svg{position:absolute;top:0;left:0;overflow:visible;display:block}
.c2-thread-glow{fill:none;stroke:rgba(167,139,250,.14);stroke-width:6;stroke-linecap:round}
.c2-thread{fill:none;stroke:var(--lcb-violet-br);stroke-width:1.6;stroke-linecap:round}
.c2-spark{fill:#f5f2ff;opacity:0;filter:drop-shadow(0 0 6px rgba(167,139,250,.9))}
.c2-runner{fill:none;stroke:#f5f2ff;stroke-width:2.4;stroke-linecap:round;opacity:0;
  filter:drop-shadow(0 0 5px rgba(167,139,250,.8))}
.c2-beat{position:relative;z-index:1;display:block}

/* ---- reveal motion ----
   Near-instant: fast opacity so the words read immediately, transform runs
   a touch longer for the composed rise (NN/g: scroll-triggered text
   animations delay readers — the wait is the enemy, not the motion). */
.c2-rv{ opacity:0; transform:translate3d(0,14px,0); }
.c2-rv.is-in{
  opacity:1; transform:translate3d(0,0,0);
  transition:transform .48s cubic-bezier(.2,.9,.25,1.06), opacity .3s ease-out;
  transition-delay:var(--d,0s);
}
.c2-rv-x{ transform:translate3d(-18px,12px,0); }
/* S8: the fragment triple varies — 0/60/120ms stagger, -18/-14/-22px slide */
.c2-frags .c2-rv-x:nth-child(1){transform:translate3d(-18px,12px,0);--d:0s}
.c2-frags .c2-rv-x:nth-child(2){transform:translate3d(-14px,12px,0);--d:.06s}
.c2-frags .c2-rv-x:nth-child(3){transform:translate3d(-22px,12px,0);--d:.12s}
.c2-frags .c2-rv-x.is-in{transform:translate3d(0,0,0)}
.lcb-memorial .c2-rv.is-in{
  transition-duration:.62s,.42s;
}
/* pattern break 1: the pivot lines land opacity-only, no vertical motion —
   the crosshair/degree geometry arriving IS the break */
.c2-pivot .c2-rv{transform:none}
.c2-pivot .c2-rv.is-in{transform:none}
/* S4: the verdict waits for the proof — the XL line reveals only after
   the wheel finishes drawing (is-drawn set on the last planet's pop) */
.c2-b3:not(.is-drawn) .c2-lxl.c2-rv{opacity:0;transform:translate3d(0,14px,0)}

/* ---- type scale: whisper to huge. Fraunces peaks, Newsreader voice. ---- */
/* The quiet lines had NO text-wrap and were dropping orphans: the first
   fragment broke as "...from everyone" / "else's." - a 65px last line that
   reads as a mistake, not a line break. Body register takes text-wrap:pretty
   (kills the orphan, keeps the natural long-then-short rag, so the fragment
   triple stays one block); the display lines below keep text-wrap:balance.
   Measured, not assumed: balance here would break "How they know your" /
   "footsteps from everyone else's.", splitting "your footsteps" and stepping
   the left block. NB: this whole block is a JS template literal - no backticks. */
.c2-whisper{font-family:"Newsreader",Georgia,serif;font-style:italic;font-size:22px;color:var(--lcb-mute);max-width:35ch;line-height:1.62;margin:0;text-wrap:pretty}
.c2-lm{font-family:"Fraunces",Georgia,serif;font-weight:400;font-size:clamp(1.3rem,2.4vw + .6rem,1.8rem);line-height:1.38;color:var(--lcb-body);margin:0;letter-spacing:-0.008em}
.c2-ll{font-family:"Fraunces",Georgia,serif;font-weight:400;font-size:clamp(1.7rem,3.4vw + .7rem,2.5rem);line-height:1.24;color:var(--lcb-white);letter-spacing:-0.014em;margin:0;text-wrap:balance}
.c2-lxl{font-family:"Fraunces",Georgia,serif;font-weight:400;font-size:clamp(2.05rem,4.6vw + .8rem,3.15rem);line-height:1.18;color:var(--lcb-white);letter-spacing:-0.016em;margin:0;text-wrap:balance}
.c2-peak{
  font-family:"Fraunces",Georgia,serif;font-weight:400;
  font-size:clamp(2.35rem,6.4vw + 1rem,4.4rem);line-height:1.12;
  color:var(--lcb-white);letter-spacing:-0.02em;max-width:14ch;margin:0;
  text-shadow:0 1px 30px rgba(4,3,10,.5);text-wrap:balance;
}
.c2-peak-v{color:var(--lcb-violet-br)}
.c2-frag{font-family:"Newsreader",Georgia,serif;font-size:25px;line-height:1.52;color:var(--lcb-frag);position:relative;max-width:34ch;margin:0;text-wrap:pretty}
.c2-peak em,.c2-ll em{font-style:italic}

/* ---- station nodes riding the thread ---- */
.c2-node{
  position:absolute; left:calc(var(--c2-spine) - var(--c2-padl) - 5.5px); width:11px; height:11px;
  border-radius:50%; background:var(--lcb-bg); border:1.5px solid rgba(167,139,250,.45);
  z-index:2; transition:background .45s ease, box-shadow .45s ease, border-color .45s ease;
}
.c2-node::before{
  content:""; position:absolute; left:100%; top:50%; height:1px; width:0;
  background:linear-gradient(90deg, var(--lcb-violet-br), transparent);
  transition:width .5s ease .12s;
}
.c2-node::after{
  content:""; position:absolute; inset:-5px; border-radius:50%;
  border:1px solid rgba(167,139,250,.55); opacity:0;
}
.c2-node.lit{background:var(--lcb-violet-br);border-color:var(--lcb-violet-br);box-shadow:0 0 14px rgba(167,139,250,.65)}
.c2-node.lit::before{width:20px}
/* S1 node diet: only the MOST RECENTLY lit station pulses, ever */
.c2-node.lit.pulse::after{animation:c2npulse 2.4s ease-out infinite}
.lcb-memorial .c2-node.lit{box-shadow:0 0 9px rgba(167,139,250,.45)}
.lcb-memorial .c2-node.lit.pulse::after{animation-duration:3.6s}
@keyframes c2npulse{0%{transform:scale(.55);opacity:.85}70%{transform:scale(2);opacity:0}100%{transform:scale(2);opacity:0}}
/* fragment micro-nodes: 4px ticks on the spine, never a pulse */
.c2-node-sm{width:4px;height:4px;left:calc(var(--c2-spine) - var(--c2-padl) - 2px);border-width:1px}
.c2-node-sm::before{display:none}
.c2-node-sm::after{display:none}
.c2-node-sm.lit{box-shadow:0 0 8px rgba(167,139,250,.5)}

/* THE BIRTH STATION - the thread's origin, level with the toggle.
   The thread used to be born in mid-air below the chooser and hook left onto
   the spine over 90px. With nothing at either end it read as a stray squiggle,
   not a birth. Now the choice IS the first station: the thread begins here, on
   the spine, dead level with the toggle's centre, and runs plumb from it. Same
   11px dot + 20px hairline tick as every other stop, so the chooser reads as
   part of the passage rather than a separate block sat above it.
   It lives in .c2-threadwrap (no column padding), hence the plain spine calc;
   buildThread() then pins x and y exactly. */
.c2-birth{left:calc(var(--c2-spine) - 5.5px);top:-9999px}

/* ---- beats: momentum timeline, ~2.6 viewports toggle → form. B1 opens
   on the chooser's heels (seam kill kept); pivot air halved; post-climax
   padding cut so the CTA rides the wheel's momentum; memorial keeps its
   slower/dimmer grammar but NO extra scroll distance ---- */
.c2-b1{padding:3svh 0 7svh}
@media (min-width:900px){ .c2-b1{padding-top:2svh} }
.c2-b1 .c2-whisper{margin-bottom:3.2svh}
.c2-b1 .c2-peak{margin-top:5svh}
.c2-b2{padding:6svh 0 8svh}
.c2-b2 .c2-whisper{margin-top:2.8svh}
.c2-frags{margin-top:4.6svh;display:flex;flex-direction:column;gap:2.8svh}
.c2-pivot{padding:8svh 0 6svh}
.c2-pivot .c2-ll{max-width:16ch}
.c2-pivot .c2-ll + .c2-ll{margin-top:3.2svh}
.c2-b3{padding:10svh 0 4svh}
.c2-b3 .c2-lxl{max-width:16ch;margin-top:4.6svh}
.c2-b4{padding:5svh 0 5svh}
.c2-b4 .c2-peak{margin-top:3.6svh}

/* universal-passage line rhythm (2026-07-18): the rebuilt beats stack plain
   reveal lines, so give consecutive lines an even breath between them. */
.c2-b1 .c2-lxl + .c2-ll{margin-top:2.4svh}
/* a drawn violet heart to the right of "If not more.", moon-sized, glowing.
   Positioned in the open right of the b1 column, level with the love line. */
.c2-love-heart{
  position:absolute; pointer-events:none; z-index:0; height:auto;
  width:clamp(104px, 24vw, 178px);
  right:clamp(6px, 6vw, 78px);
  top:clamp(104px, 20svh, 172px);
  overflow:visible;
  filter:drop-shadow(0 0 12px rgba(167,139,250,0.35));
}
.c2-love-heart .c2-heart-line{
  stroke:var(--lcb-violet-br); stroke-linecap:round; stroke-linejoin:round;
  stroke-width:3;
}
@media (min-width:900px){ .c2-love-heart{ top:clamp(96px, 15svh, 156px); } }
@media (max-width:520px){
  .c2-love-heart{ width:clamp(84px, 26vw, 118px); right:-4px; top:clamp(92px, 17svh, 138px); }
}
.c2-b2 .c2-frags + .c2-ll{margin-top:5svh}
.c2-b2 .c2-ll + .c2-ll{margin-top:3svh}
.c2-answer{padding:8svh 0 6svh}
.c2-answer .c2-rv + .c2-rv{margin-top:3.2svh}
.c2-b3 .c2-ll + .c2-ll{margin-top:3svh}
.c2-b3 .c2-wheel + .c2-frag{margin-top:1.5svh}

/* the pivot's astronomical annotations: hairline crosshairs + real degree
   labels on the three brightened stars (fixed layer, canvas-tracked) */
.c2-annot{position:absolute;inset:0}
.c2-annot-star{position:absolute;left:0;top:0;width:0;height:0;opacity:0;transition:opacity .5s ease}
.c2-annot.is-on .c2-annot-star{opacity:1}
.c2-annot.is-glide .c2-annot-star{opacity:0;transition:opacity .4s ease}
.c2-annot-x,.c2-annot-y{position:absolute;background:rgba(245,242,255,.4)}
.c2-annot-x{left:-7px;top:-0.25px;width:14px;height:0.5px}
.c2-annot-y{top:-7px;left:-0.25px;width:0.5px;height:14px}
.c2-annot-deg{position:absolute;left:11px;top:-7px;white-space:nowrap;
  font-family:"Newsreader",Georgia,serif;font-size:11px;
  color:rgba(245,242,255,.78);letter-spacing:.04em}
.c2-annot-fly{position:absolute;left:0;top:0;white-space:nowrap;opacity:0;
  font-family:"Newsreader",Georgia,serif;font-size:11px;
  color:rgba(245,242,255,.85);letter-spacing:.04em}

/* beat 3: the natal wheel - Monty's real sky, professionally drawn.
   Line-weight law: hairline ticks/spokes, medium rings, fine aspect web. */
.c2-wheel{
  position:relative;width:clamp(272px,78vw,400px);aspect-ratio:1;
  margin:4.5svh auto 0;
}
.c2-wheel::before{
  content:"";position:absolute;inset:-18%;border-radius:50%;pointer-events:none;
  background:radial-gradient(circle, rgba(167,139,250,.13) 0%, transparent 62%);
}
.c2-wheel svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.c2-wheel .wfill{opacity:0;transition:opacity 1.1s ease .7s}
.c2-wheel .wfill.a{fill:rgba(167,139,250,.055)}
.c2-wheel .wfill.b{fill:rgba(139,123,216,.028)}
.c2-wheel .wring-a{stroke:rgba(167,139,250,.62);fill:none;stroke-width:1.4}
.c2-wheel .wring-b{stroke:rgba(167,139,250,.5);fill:none;stroke-width:1.1}
.c2-wheel .wring-c{stroke:rgba(139,123,216,.44);fill:none;stroke-width:1.1}
.c2-wheel .wcusp{stroke:rgba(167,139,250,.4);stroke-width:1}
.c2-wheel .wtick{stroke:rgba(179,167,224,.42);stroke-width:.5}
.c2-wheel .wtick.mj{stroke:rgba(179,167,224,.58);stroke-width:.8}
.c2-wheel .wspoke{stroke:rgba(139,123,216,.24);stroke-width:.7}
.c2-wheel .waspect{fill:none;stroke:rgba(167,139,250,.46);stroke-width:1}
.c2-wheel .waspect.soft{stroke:rgba(179,167,224,.34);stroke-width:.8}
.c2-wheel .wptick{stroke:var(--lcb-violet-br);stroke-width:1.5}
.c2-wheel .wconn{stroke:rgba(167,139,250,.38);stroke-width:.6}
.c2-wheel .wdeg{
  font-family:"Newsreader",Georgia,serif;font-size:16px;
  fill:rgba(245,242,255,.82);letter-spacing:.02em;
}
.c2-wheel .wz .gl-s{fill:none;stroke:rgba(205,192,244,.88);stroke-width:1.15;stroke-linecap:round;stroke-linejoin:round}
.c2-wheel .wz .gl-f{fill:rgba(205,192,244,.88);stroke:none}
.c2-wheel .wp .gl-s{fill:none;stroke:var(--lcb-violet-br);stroke-width:1.05;stroke-linecap:round;stroke-linejoin:round}
.c2-wheel .wp .gl-f{fill:var(--lcb-violet-br);stroke:none}
/* drawn on scroll */
.c2-wheel .wring-a{stroke-dasharray:968;stroke-dashoffset:968;transition:stroke-dashoffset 1.5s ease-out .1s}
.c2-wheel .wring-b{stroke-dasharray:774;stroke-dashoffset:774;transition:stroke-dashoffset 1.4s ease-out .35s}
.c2-wheel .wring-c{stroke-dasharray:239;stroke-dashoffset:239;transition:stroke-dashoffset 1s ease-out .6s}
.c2-wheel .wcusps{opacity:0;transition:opacity .9s ease .8s}
.c2-wheel .wticks{opacity:0;transition:opacity 1s ease 1s}
.c2-wheel .wspoke{stroke-dasharray:86;stroke-dashoffset:86;transition:stroke-dashoffset .8s ease-out}
.c2-wheel .waspect{stroke-dasharray:var(--wl);stroke-dashoffset:var(--wl);transition:stroke-dashoffset .9s ease-out}
.c2-wheel .wzg{opacity:0;transition:opacity .7s ease}
.c2-wheel .wpg{
  opacity:0;transform:scale(.4);transform-box:fill-box;transform-origin:center;
  transition:opacity .5s ease, transform .55s cubic-bezier(.34,1.56,.64,1);
  filter:drop-shadow(0 0 5px rgba(167,139,250,.5));
}
.c2-wheel .wptick,.c2-wheel .wconn,.c2-wheel .wdeg{opacity:0;transition:opacity .55s ease}
.c2-b3.is-inview .c2-wheel .wring-a,
.c2-b3.is-inview .c2-wheel .wring-b,
.c2-b3.is-inview .c2-wheel .wring-c{stroke-dashoffset:0}
.c2-b3.is-inview .c2-wheel .wfill{opacity:1}
.c2-b3.is-inview .c2-wheel .wcusps,
.c2-b3.is-inview .c2-wheel .wticks{opacity:1}
.c2-b3.is-inview .c2-wheel .wspoke{stroke-dashoffset:0}
.c2-b3.is-inview .c2-wheel .waspect{stroke-dashoffset:0}
.c2-b3.is-inview .c2-wheel .wzg{opacity:1}
.c2-b3.is-inview .c2-wheel .wpg{opacity:1;transform:scale(1)}
.c2-b3.is-inview .c2-wheel .wptick,
.c2-b3.is-inview .c2-wheel .wconn,
.c2-b3.is-inview .c2-wheel .wdeg{opacity:1}

/* the real moon: corner spine presence, blur-to-sharp arrival TIMED TO
   the wheel Moon's pop (S5). The blur placeholder sits beneath the photo
   (S7) so the arrival never depends on network timing. */
.c2-moonspine{
  position:absolute;z-index:-1;pointer-events:none;
  top:clamp(130px, 21svh, 200px);
  right:calc(-1 * clamp(14px, 6vw, 84px));
  width:clamp(116px, 28vw, 208px);height:auto;border-radius:50%;
  -webkit-mask-image:radial-gradient(circle, #000 93%, rgba(0,0,0,0) 100%);
  mask-image:radial-gradient(circle, #000 93%, rgba(0,0,0,0) 100%);
  background:url("/start/cosmos-moon-blur.webp") center/cover no-repeat;
  opacity:0;filter:blur(16px);
  transition:opacity 1.2s ease .5s, filter 1.6s ease .5s;
  will-change:transform;
}
.c2-b3.is-inview .c2-moonspine{opacity:.95;filter:blur(0)}
.c2-moonglow{
  position:absolute;z-index:-2;pointer-events:none;border-radius:50%;
  top:clamp(104px, 18svh, 174px);
  right:calc(-1 * clamp(30px, 8vw, 108px));
  width:clamp(150px, 36vw, 260px);aspect-ratio:1;
  background:radial-gradient(circle, rgba(167,139,250,.22) 0%, rgba(167,139,250,.08) 45%, transparent 70%);
  opacity:0;transition:opacity 1.6s ease .6s;mix-blend-mode:screen;
}
.c2-b3.is-inview .c2-moonglow{opacity:1}
/* phones: the sky line wraps wide on a narrow column, so the moon seats in
   the sky beat's top-right, above the sky-line text (clearing it), rather than
   beside it where it would cross the wrapped lines. */
@media (max-width:520px){
  .c2-moonspine{width:clamp(92px, 23vw, 128px);top:calc(-1 * clamp(4px, 1svh, 12px));right:-30px}
  .c2-moonglow{width:clamp(120px, 30vw, 170px);top:calc(-1 * clamp(20px, 3svh, 30px));right:-46px}
}

/* ---- reduced motion: the finished passage at rest ---- */
@media (prefers-reduced-motion: reduce){
  .lcb-root *, .lcb-root *::before, .lcb-root *::after{
    animation:none !important;
    transition:none !important;
  }
  .c2-rv{opacity:1 !important;transform:none !important}
  .c2-annot-star,.c2-annot-fly{opacity:0 !important}
  .c2-wheel .wring-a,.c2-wheel .wring-b,.c2-wheel .wring-c,
  .c2-wheel .wspoke,.c2-wheel .waspect{stroke-dashoffset:0 !important}
  .c2-wheel .wcusps,.c2-wheel .wticks,.c2-wheel .wfill,.c2-wheel .wzg,
  .c2-wheel .wpg,.c2-wheel .wptick,.c2-wheel .wconn,.c2-wheel .wdeg{opacity:1 !important}
  .c2-wheel .wpg{transform:scale(1) !important}
  .c2-moonspine{opacity:.95 !important;filter:blur(0) !important}
  .c2-moonglow{opacity:1 !important}
  .c2-node.lit::before{width:20px !important}
}

/* ---- TYPE FLOORS: tuned per viewport (raised 2026-07-15 for legibility).
   Base above = mobile 390-767 (whisper 21 / frag 24 / wdeg 16 SVG units,
   >=15px rendered at the 304px mobile wheel and 20px at the 400px desktop
   wheel). Fragments carry a lifted contrast token (--lcb-frag) so the
   recognition beats read cleanly on the dark stage. ---- */
@media (min-width:768px){
  .c2-whisper{font-size:24px}
  .c2-frag{font-size:27px}
}
@media (min-width:1280px){
  .c2-whisper{font-size:26px}
  .c2-frag{font-size:29px}
}
`;

export function CosmicBridge() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === "undefined") return;

    const q = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = root) => scope.querySelector<T>(sel);
    const qa = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = root) => Array.from(scope.querySelectorAll<T>(sel));
    const hush = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- canvas: magnitude-scaled starfield + star dust + a RARE
       violet-white shooting star. Painted only while the stage is lit. ---- */
    const canvas = q<HTMLCanvasElement>(".lcb-canvas");
    const canvasWrap = q(".lcb-canvas-wrap");
    const back = q(".lcb-back");
    const front = q(".lcb-front");
    let drawStars = () => {};
    let paintFrame: (t: number, dt: number) => void = () => {};
    let heroScreen: (k: number) => { x: number; y: number } | null = () => null;
    let fxDispose = () => {};
    if (canvas) {
      const ctxc = canvas.getContext("2d");
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const hushAmb = hush ? 0.65 : 1;
      const tints = [
        [255, 252, 250], [245, 242, 255], [240, 238, 252], [232, 227, 248],
        [214, 204, 250], [178, 160, 244], [178, 160, 244],
      ];
      type Tw = { x: number; y: number; r: number; a: number; c: number[]; ph: number; sp: number; tw: number };
      type Mote = { x: number; y: number; r: number; vx: number; vy: number; ph: number; sp: number; v: boolean };
      let stars: Tw[] = [];
      let dust: Mote[] = [];
      /* Direction A hero stars: three real stars in the right half. B1's
         first big line flares them; each fragment brightens one for good
         (with a photographic diffraction glint, never a sparkle); the
         pivot annotates them. Memorial: 2s swell, no glint. */
      type HeroFx = { from: number; to: number; t0: number; dur: number; glint0: number };
      const heroFx: HeroFx[] = [0, 1, 2].map(() => ({ from: 1, to: 1, t0: 0, dur: 1, glint0: -1 }));
      let heroIdx: number[] = [];
      const heroHeld = [false, false, false];
      const buildField = (w: number, h: number) => {
        const mobile = w < 768;
        const n = Math.min(160, mobile ? 62 : 132);
        const bx = 0.62 * w, by = 0.16 * h, ang = -0.62, dirx = Math.cos(ang), diry = Math.sin(ang);
        const arr: Tw[] = [];
        for (let i = 0; i < n; i++) {
          let x: number, y: number;
          if (Math.random() < 0.46) {
            const along = (Math.random() - 0.5) * Math.hypot(w, h) * 1.2;
            const across = (Math.random() - 0.5) * h * 0.34 + (Math.random() - 0.5) * h * 0.16;
            x = bx + dirx * along - diry * across; y = by + diry * along + dirx * across;
          } else { x = Math.random() * w; y = Math.random() * h; }
          if (x < -20 || x > w + 20 || y < -20 || y > h + 20) { i--; continue; }
          const m = 1.4 + Math.pow(Math.random(), 0.6) * 4.6;
          const bright = Math.pow(2.512, -(m - 1.4));
          const r = (0.5 + bright * 1.5) * dpr;
          const a = Math.min(0.95, 0.14 + bright * 0.82);
          const c = tints[(Math.random() * tints.length) | 0];
          arr.push({ x: x * dpr, y: y * dpr, r, a, c,
            ph: Math.random() * Math.PI * 2, sp: 0.25 + Math.random() * 0.7,
            tw: 0.18 + Math.random() * 0.4 });
        }
        stars = arr;
        // pick the three hero stars: brightest per vertical band, right half,
        // working top to bottom so the eye tracks downward with the scroll
        heroIdx = [];
        const bands: [number, number][] = [[0.14, 0.4], [0.36, 0.62], [0.58, 0.82]];
        bands.forEach(([y0, y1]) => {
          let best = -1, bestA = 0;
          arr.forEach((st, i) => {
            const xr = st.x / dpr / w, yr = st.y / dpr / h;
            if (xr > 0.6 && xr < 0.86 && yr > y0 && yr < y1 && !heroIdx.includes(i) && st.a > bestA) { best = i; bestA = st.a; }
          });
          if (best < 0) {
            arr.forEach((st, i) => {
              const xr = st.x / dpr / w, yr = st.y / dpr / h;
              if (xr > 0.55 && xr < 0.86 && yr > 0.1 && yr < 0.86 && !heroIdx.includes(i) && st.a > bestA) { best = i; bestA = st.a; }
            });
          }
          if (best >= 0) heroIdx.push(best);
        });
        // boosts already earned survive a field rebuild (resize)
        heroHeld.forEach((held, k) => { if (held && heroFx[k]) { heroFx[k].from = heroFx[k].to = 2.2; heroFx[k].glint0 = -1; } });
        // drifting star dust: small motes rising slowly up-left
        const nd = Math.min(44, Math.round((w * h) / 26000));
        const darr: Mote[] = [];
        for (let i = 0; i < nd; i++) {
          darr.push({
            x: Math.random() * w * dpr, y: Math.random() * h * dpr,
            r: (0.4 + Math.random() * 0.8) * dpr,
            vx: -(0.02 + Math.random() * 0.06) * dpr,
            vy: -(0.03 + Math.random() * 0.09) * dpr,
            ph: Math.random() * 6.28, sp: 0.4 + Math.random() * 0.8,
            v: Math.random() < 0.35,
          });
        }
        dust = darr;
      };
      type Meteor = { x: number; y: number; vx: number; vy: number; life: number; max: number };
      let shooter: Meteor | null = null;
      const heroMult = (k: number, t: number, dt: number) => {
        const fx = heroFx[k];
        if (dt <= 0 || t >= fx.t0 + fx.dur * 1000) return fx.to;
        const p = HOUSE(Math.max(0, (t - fx.t0) / (fx.dur * 1000)));
        return fx.from + (fx.to - fx.from) * p;
      };
      const paint = (t: number, dt: number) => {
        if (!ctxc) return;
        const cw = canvas.width, ch = canvas.height;
        ctxc.clearRect(0, 0, cw, ch);
        const bx = 0.62 * cw, by = 0.16 * ch;
        const g = ctxc.createRadialGradient(bx, by, 0, bx, by, Math.hypot(cw, ch) * 0.7);
        g.addColorStop(0, "rgba(120,126,180,0.05)");
        g.addColorStop(0.4, "rgba(90,96,150,0.03)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctxc.fillStyle = g; ctxc.fillRect(0, 0, cw, ch);
        for (let i = 0; i < stars.length; i++) {
          const st = stars[i];
          let base = st.a, rr = st.r;
          const hk = heroIdx.indexOf(i);
          if (hk >= 0) {
            const m = heroMult(hk, t, dt);
            base = Math.min(1, st.a * m);
            rr = st.r * (1 + (m - 1) * 0.35);
          }
          const a = dt > 0
            ? base * (1 - st.tw * 0.5 + st.tw * 0.5 * Math.sin(t * 0.001 * st.sp + st.ph))
            : base;
          ctxc.beginPath();
          ctxc.fillStyle = `rgba(${st.c[0]},${st.c[1]},${st.c[2]},${Math.max(0, a)})`;
          ctxc.arc(st.x, st.y, rr, 0, Math.PI * 2); ctxc.fill();
          // photographic diffraction glint: two crossed 1px lines at star
          // colour, 30% opacity, 0.6s in/out - a lens artifact, not a sparkle
          if (hk >= 0 && dt > 0) {
            const fx = heroFx[hk];
            if (fx.glint0 >= 0 && t >= fx.glint0 && t < fx.glint0 + 600) {
              const gp = (t - fx.glint0) / 600;
              const ga = 0.3 * Math.sin(Math.PI * gp) * hushAmb;
              const gl = 7 * dpr;
              ctxc.strokeStyle = `rgba(${st.c[0]},${st.c[1]},${st.c[2]},${ga})`;
              ctxc.lineWidth = 1;
              ctxc.beginPath();
              ctxc.moveTo(st.x - gl, st.y); ctxc.lineTo(st.x + gl, st.y);
              ctxc.moveTo(st.x, st.y - gl); ctxc.lineTo(st.x, st.y + gl);
              ctxc.stroke();
            }
          }
        }
        // star dust drift (rests still under reduced motion: dt = 0)
        const step = dt > 0 ? dt * 60 : 0;
        for (const p of dust) {
          p.x += p.vx * step; p.y += p.vy * step;
          if (p.x < -4) p.x = cw + 4;
          if (p.y < -4) p.y = ch + 4;
          const a = (0.10 + 0.18 * (0.5 + 0.5 * Math.sin(t * 0.001 * p.sp + p.ph))) * hushAmb;
          ctxc.beginPath();
          ctxc.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctxc.fillStyle = p.v ? `rgba(179,167,224,${a})` : `rgba(245,242,255,${a})`;
          ctxc.fill();
        }
        if (dt <= 0) return;
        // the ONE scripted meteor (S3): spawned by the verdict line's
        // reveal, never by a timer - rendered here with its soft trail
        if (shooter) {
          shooter.life += dt; shooter.x += shooter.vx * dt; shooter.y += shooter.vy * dt;
          const k = 1 - shooter.life / shooter.max;
          if (k <= 0 || shooter.x < -140 * dpr || shooter.x > cw + 140 * dpr || shooter.y > ch + 140 * dpr) {
            shooter = null;
          } else {
            const mag = Math.hypot(shooter.vx, shooter.vy) || 1;
            const tlen = 130 * dpr;
            const tx = shooter.x - (shooter.vx / mag) * tlen, ty = shooter.y - (shooter.vy / mag) * tlen;
            const tg2 = ctxc.createLinearGradient(shooter.x, shooter.y, tx, ty);
            tg2.addColorStop(0, `rgba(255,255,255,${0.9 * k * hushAmb})`);
            tg2.addColorStop(0.25, `rgba(178,160,244,${0.55 * k * hushAmb})`);
            tg2.addColorStop(1, "rgba(139,123,216,0)");
            ctxc.strokeStyle = tg2; ctxc.lineWidth = 1.6 * dpr; ctxc.lineCap = "round";
            ctxc.beginPath(); ctxc.moveTo(shooter.x, shooter.y); ctxc.lineTo(tx, ty); ctxc.stroke();
            const hg = ctxc.createRadialGradient(shooter.x, shooter.y, 0, shooter.x, shooter.y, 5.5 * dpr);
            hg.addColorStop(0, `rgba(255,255,255,${0.9 * k * hushAmb})`);
            hg.addColorStop(1, "rgba(167,139,250,0)");
            ctxc.fillStyle = hg;
            ctxc.beginPath(); ctxc.arc(shooter.x, shooter.y, 5.5 * dpr, 0, Math.PI * 2); ctxc.fill();
          }
        }
      };
      drawStars = () => {
        const rect = canvas.getBoundingClientRect();
        const w = Math.max(1, Math.round(rect.width)), h = Math.max(1, Math.round(rect.height));
        if (canvas.width !== w * dpr || canvas.height !== h * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; buildField(w, h); }
        paint(0, 0);
      };
      paintFrame = (t, dt) => {
        const bo = back ? parseFloat((back as HTMLElement).style.opacity || "1") : 1;
        if (bo > 0.02) paint(t, dt);
      };
      /* S3: exactly ONE meteor, event-driven, crossing the top third away
         from the wheel: 1.2s (memorial 1.8s, dimmer via the hush grade) */
      const spawnMeteor = () => {
        if (shooter) return;
        const cw = canvas.width, ch = canvas.height;
        const max = hush ? 1.8 : 1.2;
        const fromLeft = Math.random() < 0.5;
        shooter = {
          x: fromLeft ? -40 * dpr : cw + 40 * dpr,
          y: ch * (0.07 + Math.random() * 0.09),
          vx: ((cw + 260 * dpr) / max) * (fromLeft ? 1 : -1),
          vy: (ch * 0.14) / max,
          life: 0, max,
        };
      };
      /* hero-star event answers: B1 flare, one star per fragment */
      let flareT = 0;
      const onFlare = () => {
        const now2 = performance.now();
        const dur = hush ? 2 : 0.9;
        heroFx.forEach((fx, k) => {
          if (heroHeld[k]) return;
          fx.from = 1; fx.to = 1.9; fx.t0 = now2; fx.dur = dur;
          if (!hush) fx.glint0 = now2 + dur * 500;
        });
        flareT = window.setTimeout(() => {
          const n3 = performance.now();
          heroFx.forEach((fx, k) => {
            if (heroHeld[k]) return;
            fx.from = 1.9; fx.to = 1.15; fx.t0 = n3; fx.dur = dur * 0.8;
          });
        }, dur * 1000 + 250);
      };
      const onStar = (e: Event) => {
        const det = (e as CustomEvent).detail || {};
        const k = Number(det.i);
        if (!(k >= 0 && k < 3) || heroHeld[k]) return;
        heroHeld[k] = true;
        const fx = heroFx[k];
        if (det.instant) { fx.from = fx.to = 2.2; fx.glint0 = -1; return; }
        const now2 = performance.now();
        fx.from = fx.to; fx.to = 2.2; fx.t0 = now2; fx.dur = hush ? 2 : 0.9;
        if (!hush) fx.glint0 = now2 + 150;
      };
      const onMeteor = () => spawnMeteor();
      window.addEventListener("lcb-flare", onFlare);
      window.addEventListener("lcb-star", onStar);
      window.addEventListener("lcb-meteor", onMeteor);
      fxDispose = () => {
        clearTimeout(flareT);
        window.removeEventListener("lcb-flare", onFlare);
        window.removeEventListener("lcb-star", onStar);
        window.removeEventListener("lcb-meteor", onMeteor);
      };
      /* the pivot overlay tracks the hero stars through the parallaxed canvas */
      heroScreen = (k: number) => {
        const i = heroIdx[k];
        if (i === undefined || !stars[i] || !canvas.width || !canvas.height) return null;
        const cr = canvas.getBoundingClientRect();
        return {
          x: cr.left + (stars[i].x / canvas.width) * cr.width,
          y: cr.top + (stars[i].y / canvas.height) * cr.height,
        };
      };
      drawStars();
    }

    /* ---------- reveals: one observer for lines (600px pre-warm), one for
       the beat that draws itself (the wheel - trigger raised ~40% of a
       viewport earlier so a fast scroller catches the planet pops mid-
       viewport), and one TIGHT sync observer that fires the word-precise
       visual events only when their line is actually on screen ---------- */
    const rvNodes = qa(".c2-rv");
    const b3El = q(".c2-b3"); // the birth-sky beat: wheel draws + moon rises here
    const xlEl = q("#c2-xl-once");
    const annotLayer = q(".c2-annot");
    const annotEls = annotLayer ? qa(".c2-annot-star", annotLayer) : [];

    /* S3 + S4: the verdict line waits for the wheel; the ONE meteor fires
       on the verdict's actual reveal (proof, then the sky answers) */
    let metFired = false;
    const tryMeteor = () => {
      if (metFired || reduced) return;
      if (b3El?.classList.contains("is-drawn") && xlEl?.classList.contains("is-in")) {
        metFired = true;
        window.dispatchEvent(new CustomEvent("lcb-meteor"));
      }
    };
    let drawnT = 0;
    let glideStarted = false;
    let glideArmed = false;
    let glideWaitT = 0;
    let annotOnT0 = 0;
    let glideIO: IntersectionObserver | null = null;
    const markDrawn = () => {
      if (!b3El || b3El.classList.contains("is-drawn")) return;
      b3El.classList.add("is-drawn");
      tryMeteor();
    };
    const armWheelGate = () => {
      if (!b3El) return;
      let last: HTMLElement | null = null, lastD = -1;
      qa(".c2-wheel .wpg").forEach((el) => {
        const dl = parseFloat((el as HTMLElement).style.transitionDelay || "0");
        if (dl > lastD) { lastD = dl; last = el as HTMLElement; }
      });
      const lastEl = last as HTMLElement | null;
      if (lastEl) {
        const onEnd = (ev: Event) => {
          if ((ev as TransitionEvent).propertyName !== "transform") return;
          lastEl.removeEventListener("transitionend", onEnd);
          markDrawn();
        };
        lastEl.addEventListener("transitionend", onEnd);
      }
      drawnT = window.setTimeout(markDrawn, 2600); // fallback: proof declared drawn
      // the labels take their seats only when the wheel is really on screen
      // (the wheel's draw trigger is raised ~40% early for fast scrollers,
      // so it must NOT start the glide - the crosshairs would die unseen)
      const wheelEl2 = q(".c2-wheel");
      if (!wheelEl2) { startGlide(); return; }
      const ioGlide = new IntersectionObserver((ents) => {
        ents.forEach((en) => {
          if (en.isIntersecting || en.boundingClientRect.top < 0) {
            ioGlide.disconnect();
            startGlide();
          }
        });
      }, { threshold: 0.3 });
      ioGlide.observe(wheelEl2);
      glideIO = ioGlide;
    };

    let io: IntersectionObserver | null = null;
    let ioSec: IntersectionObserver | null = null;
    let ioSync: IntersectionObserver | null = null;
    if (reduced || !("IntersectionObserver" in window)) {
      rvNodes.forEach((el) => el.classList.add("is-in"));
      b3El?.classList.add("is-inview", "is-drawn");
    } else {
      io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting || e.boundingClientRect.top < 0) {
            e.target.classList.add("is-in");
            io?.unobserve(e.target);
            if (e.target === xlEl) tryMeteor();
          }
        });
      // threshold 0 + positive bottom margin: lines start fading in ~8% of a
      // viewport BEFORE entry, so fast scrollers never meet an empty screen.
      }, { threshold: 0, rootMargin: "600px 0px 8% 0px" });
      rvNodes.forEach((el) => io?.observe(el));
      ioSec = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting || e.boundingClientRect.top < 0) {
            e.target.classList.add("is-inview");
            ioSec?.unobserve(e.target);
            armWheelGate();
          }
        });
      }, { threshold: 0.08, rootMargin: "600px 0px 42% 0px" });
      // The birth-sky beat drives BOTH the wheel draw (armWheelGate) and the
      // moon reveal (.c2-b3.is-inview .c2-moonspine), so one ioSec covers both.
      if (b3El) ioSec.observe(b3El);
      // The only word-precise sync left: the CTA line launches the traveling
      // highlight into the form node. (The retired copy's star flare / degree
      // crosshairs went with the beats they annotated.)
      const syncMap: [string, (passed: boolean) => void][] = [
        ["#c2-st-set", () => startRunner()],
      ];
      const syncFns = new Map<Element, (passed: boolean) => void>();
      ioSync = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          const passed = !e.isIntersecting && e.boundingClientRect.top < 0;
          if (e.isIntersecting || passed) {
            syncFns.get(e.target)?.(passed);
            ioSync?.unobserve(e.target);
          }
        });
      }, { threshold: 0.55, rootMargin: "0px 0px -6% 0px" });
      syncMap.forEach(([sel, fn]) => {
        const el = q(sel);
        if (el) { syncFns.set(el, fn); ioSync?.observe(el); }
      });
    }

    /* ---------- THE THREAD: born at the top of the passage, runs plumb down
       the spine, ignites every station node, then finds the form card and
       seals its border shut. The button ignites only when sealed. ---------- */
    const col = q(".c2-col");
    const svg = q<SVGSVGElement>(".c2-threadsvg");
    const path = q<SVGPathElement>(".c2-thread");
    const glowP = q<SVGPathElement>(".c2-thread-glow");
    const runnerEl = q<SVGPathElement>(".c2-runner");
    const sparkEl = q<SVGCircleElement>(".c2-spark");
    const nodes = qa("[data-node]");
    // the origin station. Deliberately NOT [data-node]: every other station is
    // placed from an element's offsetTop, but the birth is pinned a short lead
    // above the FIRST station so the thread has an intentional top-of-passage
    // origin (the chooser it used to hang under has moved onto the form).
    const birthEl = q<HTMLElement>(".c2-birth");
    const moonImg = q<HTMLImageElement>(".c2-moonspine");
    const getCard = () => document.querySelector<HTMLElement>(".ls-seal-card");

    let totalLen = 0, spineLen = 0, hasCard = false;
    let nodeLens: number[] = [];
    let colTopAbs = 0;
    let lastStructure = "";

    /* Direction A pivot payoff: the three degree labels glide from their
       stars into the wheel, landing as the REAL Venus/Sun/Moon degree
       texts (shallow curve, 1.1s, staggered 150ms, opacity-swap) */
    const glideTweens: gsap.core.Tween[] = [];
    const startGlide = () => {
      if (glideArmed || reduced) return;
      glideArmed = true;
      // the crosshairs get a guaranteed dwell before their labels fly -
      // on a phone the pivot and the wheel share a viewport, so without
      // this floor the pattern break could die the frame it was born
      const wait = annotLayer?.classList.contains("is-on") && annotOnT0
        ? Math.max(0, (hush ? 2000 : 1400) - (performance.now() - annotOnT0))
        : 0;
      glideWaitT = window.setTimeout(runGlide, wait);
    };
    const runGlide = () => {
      if (glideStarted) return;
      glideStarted = true;
      if (!annotLayer || !annotLayer.classList.contains("is-on")) return;
      annotLayer.classList.add("is-glide");
      ANNOT_PLANETS.forEach((pid, k) => {
        const degEl = q<SVGTextElement>(`.c2-wheel .wdeg[data-planet="${pid}"]`);
        const from = heroScreen(k);
        if (!degEl || !from) return;
        const fly = document.createElement("span");
        fly.className = "c2-annot-fly";
        fly.textContent = ANNOT_DEGS[k];
        annotLayer.appendChild(fly);
        const st = { t: 0 };
        const x0 = from.x + 11, y0 = from.y - 7;
        glideTweens.push(gsap.to(st, {
          t: 1, duration: 1.1, delay: 0.12 + k * 0.15, ease: "power2.inOut",
          onStart: () => { fly.style.opacity = "1"; },
          onUpdate: () => {
            const r = degEl.getBoundingClientRect();
            const x1 = r.left + r.width / 2, y1 = r.top + r.height / 2;
            const cx2 = (x0 + x1) / 2 - 46, cy2 = (y0 + y1) / 2 - 24;
            const u = st.t, v = 1 - u;
            const x = v * v * x0 + 2 * v * u * cx2 + u * u * x1;
            const y = v * v * y0 + 2 * v * u * cy2 + u * u * y1;
            fly.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
            if (u > 0.78) fly.style.opacity = String(Math.max(0, (1 - u) / 0.22));
          },
          onComplete: () => { fly.remove(); },
        }));
      });
    };

    /* Direction A B4: a 12px traveling highlight runs the last stretch of
       spine into the CTA node over 0.8s - then it lights */
    let runnerT0 = 0, runFrom = 0, runTo = 0, ctaLit = false, runnerFired = false;
    const startRunner = () => {
      if (runnerFired) return;
      runnerFired = true;
      if (reduced || !runnerEl || !totalLen || !nodeLens.length) { ctaLit = true; return; }
      const target = nodeLens[nodeLens.length - 1];
      runFrom = Math.max(0, target - 420);
      runTo = Math.max(runFrom, target - 12);
      runnerEl.style.strokeDasharray = `12 ${Math.ceil(totalLen) + 20}`;
      runnerT0 = performance.now();
    };

    /* S6: the ignition - a violet-white spark leaves the birth station and
       runs the first SPARK_PX of the rail when the chooser is flipped / first
       scrolled past. It used to travel 90px because that was exactly the old
       birth bezier; now that the birth is a station on a plumb rail, it runs
       further and a touch longer so the read is "the choice lit the thread",
       carrying the eye down out of the chooser rather than just tracing a curve. */
    const SPARK_PX = 150, SPARK_MS = 380;
    let sparkT0 = 0, sparkScrollSeen = false, prevDrawn = -1;
    const fireSpark = () => {
      if (!reduced && sparkEl && path) sparkT0 = performance.now();
    };
    if (INTENT_FLIP_PENDING) {
      INTENT_FLIP_PENDING = false;
      if (!reduced) window.setTimeout(fireSpark, 380);
    }

    const spineX = () => parseFloat(getComputedStyle(root).getPropertyValue("--c2-spine")) || 24;

    const placeNodes = () => {
      nodes.forEach((nd) => {
        const t = document.getElementById(nd.getAttribute("data-for") || "");
        if (!t) return;
        const cs = getComputedStyle(t);
        let lh = parseFloat(cs.lineHeight);
        if (!lh || isNaN(lh)) lh = parseFloat(cs.fontSize) * 1.2;
        // offsetTop ignores the reveal transforms, so the dot lands on the
        // line's final resting position, centred to its first line
        (nd as HTMLElement).style.top = `${(t as HTMLElement).offsetTop + lh / 2 - (nd as HTMLElement).offsetHeight / 2}px`;
      });
    };

    type Pt = { x: number; y: number };
    const buildThread = () => {
      if (!col || !svg || !path || !glowP) return;
      placeNodes();
      const colR = col.getBoundingClientRect();
      colTopAbs = colR.top + window.scrollY;
      const colLeft = colR.left;
      const W = colR.width;
      const card = getCard();
      hasCard = !!card;
      const cardR = card ? card.getBoundingClientRect() : null;
      const H = cardR
        ? Math.max(col.scrollHeight, cardR.bottom + window.scrollY - colTopAbs + 40)
        : col.scrollHeight;
      svg.setAttribute("width", String(W));
      svg.setAttribute("height", String(H));
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

      const sx = spineX();
      // pin every station dot's centre exactly onto the plumb line (x = sx),
      // measured through the offsetParent chain (layout, not rects) so reveal
      // transforms never corrupt it and no node can drift off the thread,
      // whatever its parent - self-heals on every resize/refresh rebuild
      const offLeftInCol = (el: HTMLElement) => {
        let x = 0; let n: HTMLElement | null = el;
        while (n && n !== col) { x += n.offsetLeft; n = n.offsetParent as HTMLElement | null; }
        return x;
      };
      nodes.forEach((nd) => {
        const el = nd as HTMLElement;
        const parentLeft = offLeftInCol(el) - el.offsetLeft;
        el.style.left = `${(sx - el.offsetWidth / 2 - parentLeft).toFixed(2)}px`;
      });
      const rel = (r: DOMRect) => ({ x: r.left - colLeft, y: r.top - colR.top, w: r.width, h: r.height });

      /* THE BIRTH (re-anchored 2026-07-18). The chooser toggle the thread used
         to hang under has moved onto the form, so the thread is now born at the
         TOP of the passage: on the spine, a short lead above the first station
         node, running plumb down through every beat. Anchoring to a real node
         (self-heals on resize) keeps an intentional origin and destination
         instead of a stray squiggle in the margin. The spine sits a full
         text-gutter left of every text edge, so the stroke never touches copy. */
      const firstNode = nodes[0] as HTMLElement | undefined;
      let d: string;
      let startY: number;
      if (firstNode) {
        const fr = rel(firstNode.getBoundingClientRect());
        startY = Math.max(8, fr.y + fr.h / 2 - 44);
        d = `M ${sx} ${startY}`;
      } else {
        startY = -40;
        d = `M ${sx} ${startY}`;
      }
      // pin the birth station onto the origin (threadwrap is unpadded, so the
      // spine x needs no column correction here)
      if (birthEl) {
        birthEl.style.left = `${(sx - birthEl.offsetWidth / 2).toFixed(2)}px`;
        birthEl.style.top = `${(startY - birthEl.offsetHeight / 2).toFixed(2)}px`;
      }

      const pts: Pt[] = [{ x: sx, y: startY }];
      const nodeYs: number[] = [];
      nodes.forEach((nd) => {
        const r = rel(nd.getBoundingClientRect());
        const p = { x: sx, y: r.y + r.h / 2 };
        pts.push(p);
        nodeYs.push(p.y);
      });

      /* The thread stays a dead-straight plumb line the whole way down (S2).
         It used to swing right and hand off to the wheel's outer ring at 12
         o'clock, but the wheel sits ~370px off the spine, so a tangent
         arrival ran the thread near-parallel to the ring for ~120px at BOTH
         junctions: it read as a stray line skimming the chart rather than
         becoming it. The wheel now stands as its own object and draws its
         own ring; the thread simply passes it on the left. */
      let prev = pts[0];
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i];
        d += ` L ${p.x} ${p.y}`;
        prev = p;
      }

      if (cardR) {
        const c = rel(cardR);
        const r0 = 18;
        // approach the card
        d += ` C ${sx} ${prev.y + (c.y - prev.y) * 0.5}, ${c.x - 6} ${c.y - 52}, ${c.x + r0} ${c.y}`;
        // measure spine length before the border loop
        const probe = document.createElementNS("http://www.w3.org/2000/svg", "path");
        probe.setAttribute("d", d);
        spineLen = probe.getTotalLength();
        // trace the card border clockwise, sealing the form shut
        d += ` L ${c.x + c.w - r0} ${c.y}` +
          ` Q ${c.x + c.w} ${c.y} ${c.x + c.w} ${c.y + r0}` +
          ` L ${c.x + c.w} ${c.y + c.h - r0}` +
          ` Q ${c.x + c.w} ${c.y + c.h} ${c.x + c.w - r0} ${c.y + c.h}` +
          ` L ${c.x + r0} ${c.y + c.h}` +
          ` Q ${c.x} ${c.y + c.h} ${c.x} ${c.y + c.h - r0}` +
          ` L ${c.x} ${c.y + r0}` +
          ` Q ${c.x} ${c.y} ${c.x + r0} ${c.y}`;
      } else {
        // no card on stage (computing / revealed): the thread rests after
        // its last claim
        const probe = document.createElementNS("http://www.w3.org/2000/svg", "path");
        probe.setAttribute("d", d);
        spineLen = probe.getTotalLength();
      }

      path.setAttribute("d", d);
      glowP.setAttribute("d", d);
      runnerEl?.setAttribute("d", d);
      totalLen = path.getTotalLength();
      path.style.strokeDasharray = String(totalLen);
      glowP.style.strokeDasharray = String(totalLen);

      // node positions along the path (the spine is monotonic in y)
      nodeLens = nodeYs.map((ny) => {
        let lo = 0, hi = spineLen;
        for (let k = 0; k < 22; k++) {
          const mid = (lo + hi) / 2;
          const pt = path.getPointAtLength(mid);
          if (pt.y < ny) lo = mid; else hi = mid;
        }
        return (lo + hi) / 2;
      });

      watchCard();
      lastStructure = structureKey();
    };

    const structureKey = () => {
      const card = getCard();
      const cTop = card ? Math.round(card.getBoundingClientRect().top + window.scrollY) : -1;
      return `${col ? col.scrollHeight : 0}:${card ? 1 : 0}:${cTop}:${window.innerWidth}`;
    };

    // The visitor reaching for the form IS the arrival: the moment any field
    // takes focus, the thread finishes the border and the button ignites.
    let engaged = false;
    const onFocusIn = (e: FocusEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && t.closest && t.closest(".ls-seal-card")) engaged = true;
    };
    document.addEventListener("focusin", onFocusIn);

    /* THE SEAL IS LATCHED, ONE-WAY (2026-07-14). The border draw is no
       longer scroll-scrubbed: when the card is meaningfully on screen
       (~55% visible, or most of a short viewport), the border plays shut
       ONCE over ~1.2s with the house ease-out, then stays whole forever -
       it never reverses and never re-scrubs, whichever way you scroll. */
    const SEAL_MS = 1200;
    let latched = false;
    let latchT0 = 0;
    let cardIO: IntersectionObserver | null = null;
    let observedCard: HTMLElement | null = null;
    const latch = () => {
      if (latched) return;
      latched = true;
      latchT0 = performance.now();
      cardIO?.disconnect();
      cardIO = null;
    };
    const watchCard = () => {
      if (latched) return;
      const card = getCard();
      if (!card || card === observedCard) return;
      cardIO?.disconnect();
      observedCard = card;
      if (!("IntersectionObserver" in window)) { latch(); return; }
      cardIO = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          // "meaningfully on screen": 55% of the card, or 60% of a viewport
          // too short to ever hold 55% of it
          const need = Math.min(
            en.boundingClientRect.height * 0.55,
            window.innerHeight * 0.6,
          );
          if (en.intersectionRect.height >= need) latch();
        });
      }, { threshold: [0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75] });
      cardIO.observe(card);
    };

    const targetLen = () => {
      if (!path || !spineLen) return 0;
      const sy = window.scrollY;
      const vh = window.innerHeight;
      const tipY = sy + vh * 0.76 - colTopAbs;
      let lo = 0, hi = spineLen;
      for (let k = 0; k < 20; k++) {
        const mid = (lo + hi) / 2;
        if (path.getPointAtLength(mid).y < tipY) lo = mid; else hi = mid;
      }
      return Math.max(0, Math.min(spineLen, (lo + hi) / 2));
    };

    const sealCard = () => {
      const card = getCard();
      if (card && !card.hasAttribute("data-sealed")) card.setAttribute("data-sealed", "1");
    };
    const armCard = () => {
      const card = getCard();
      if (card) card.setAttribute("data-thread-arm", "1");
    };

    let drawn = 0;
    let sealed = false;
    let raf = 0;
    let frameCount = 0;
    let lastT = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = lastT ? Math.min((now - lastT) / 1000, 0.05) : 0.016;
      lastT = now;
      frameCount++;
      // structure watch: the form swaps to the compute stage / the reveal
      // mounts / fonts land - rebuild the thread when the page changes shape
      if (frameCount % 30 === 0 && lastStructure !== structureKey()) {
        buildThread();
        drawn = Math.min(drawn, totalLen);
        sealed = false;
      }
      if (engaged) latch();
      if (latched && hasCard && totalLen > 0) {
        // one-way seal: spine completes, border draws shut over SEAL_MS with
        // the house ease-out, and the whole thread never retracts again
        const p = Math.min(1, (now - latchT0) / SEAL_MS);
        const env = spineLen + HOUSE(p) * (totalLen - spineLen);
        drawn = Math.max(drawn, Math.min(env, totalLen));
      } else {
        const t = targetLen();
        // frame-rate-independent exponential smoothing (dt-based): the thread
        // tracks Lenis buttery-smooth and identically at 60/120Hz, so no
        // rubber-band and no scroll-speed jitter
        drawn += (t - drawn) * (1 - Math.exp(-dt * 8));
        if (Math.abs(t - drawn) < 0.4) drawn = t;
      }
      if (path && glowP && totalLen > 0) {
        const off = totalLen - drawn;
        path.style.strokeDashoffset = String(off);
        glowP.style.strokeDashoffset = String(off);
      }
      // S1: stations light as the thread passes; only the LATEST pulses.
      // The CTA node waits for the traveling highlight (or the seal).
      let lastLit = -1;
      nodes.forEach((nd, i) => {
        let on = nodeLens[i] !== undefined && drawn >= nodeLens[i] - 4;
        if (i === nodes.length - 1 && !ctaLit && !latched) on = false;
        nd.classList.toggle("lit", on);
        if (on && !nd.classList.contains("c2-node-sm")) lastLit = i;
      });
      nodes.forEach((nd, i) => nd.classList.toggle("pulse", i === lastLit));
      // the origin lights the instant the rail exists, and never pulses: it is
      // where the thread comes from, not a stop along it
      birthEl?.classList.toggle("lit", drawn > 2);
      // S6: the birth spark (chooser flip / first scroll past the birth)
      if (!sparkScrollSeen && prevDrawn >= 0 && prevDrawn <= 24 && drawn > 24) {
        sparkScrollSeen = true;
        fireSpark();
      }
      prevDrawn = drawn;
      if (sparkT0 && sparkEl && path) {
        const sp = (now - sparkT0) / SPARK_MS;
        if (sp >= 1) { sparkT0 = 0; sparkEl.style.opacity = "0"; }
        else if (sp >= 0) {
          const pt = path.getPointAtLength(Math.max(0, Math.min(SPARK_PX, sp * SPARK_PX)));
          sparkEl.setAttribute("cx", pt.x.toFixed(1));
          sparkEl.setAttribute("cy", pt.y.toFixed(1));
          sparkEl.style.opacity = Math.sin(Math.PI * Math.min(1, sp)).toFixed(2);
        }
      }
      // B4: the traveling highlight dash pulls the eye to the CTA node
      if (runnerT0 && runnerEl) {
        const rp = Math.min(1, (now - runnerT0) / 800);
        const len = runFrom + (runTo - runFrom) * HOUSE(rp);
        runnerEl.style.strokeDashoffset = String(-len);
        runnerEl.style.opacity = String(rp < 0.12 ? rp / 0.12 : rp > 0.85 ? Math.max(0, (1 - rp) / 0.15) : 1);
        if (rp >= 1) { runnerT0 = 0; runnerEl.style.opacity = "0"; ctaLit = true; }
      }
      // the pivot's crosshair annotations ride their stars through parallax
      if (annotLayer && !glideStarted && annotLayer.classList.contains("is-on")) {
        for (let k = 0; k < annotEls.length; k++) {
          const pos = heroScreen(k);
          if (pos) annotEls[k].style.transform = `translate3d(${pos.x.toFixed(1)}px,${pos.y.toFixed(1)}px,0)`;
        }
      }
      // pattern break 2: thread completes, the border seals, THEN ignition -
      // sequenced a beat AFTER the 1.2s border draw, never simultaneous
      if (!sealed && hasCard && totalLen > 0 && drawn >= totalLen - 1.5 &&
        (!latched || now - latchT0 >= SEAL_MS + 140)) {
        sealed = true;
        ctaLit = true;
        sealCard();
      }
      // the moon drifts gently in its corner as the birth-sky beat passes
      if (b3El && moonImg) {
        const mr = b3El.getBoundingClientRect();
        let offm = ((window.innerHeight / 2) - (mr.top + mr.height / 2)) * 0.04;
        offm = Math.max(-14, Math.min(14, offm));
        moonImg.style.transform = `translate3d(0,${offm.toFixed(1)}px,0)`;
      }
      paintFrame(now, dt);
    };

    /* ---------- stage lighting + dawn grade (GSAP scrubs, opacity only,
       shared with reduced motion) ---------- */
    const stageOp = { enter: 0, frontExit: 1 };
    const applyStage = () => {
      if (back) (back as HTMLElement).style.opacity = String(stageOp.enter);
      if (front) (front as HTMLElement).style.opacity = String(Math.min(stageOp.enter, stageOp.frontExit));
    };
    applyStage();
    const triggers: ScrollTrigger[] = [];
    const tw1 = gsap.fromTo(stageOp, { enter: 0 }, {
      enter: 1, ease: "none", onUpdate: applyStage,
      scrollTrigger: { trigger: root, start: "top 60%", end: "top 5%", scrub: reduced ? true : 1 },
    });
    const tw2 = gsap.fromTo(stageOp, { frontExit: 1 }, {
      frontExit: 0, ease: "none", onUpdate: applyStage,
      scrollTrigger: { trigger: root, start: "bottom 60%", end: "bottom 5%", scrub: reduced ? true : 1 },
    });
    const violetSky = q(".lcb-sky-violet");
    const dawnSky = q(".lcb-dawn-horizon");
    const orrerySec = document.querySelector("#computed-sky");
    const checkoutSec = document.querySelector("#begin");
    let tw3: gsap.core.Tween | null = null, tw4: gsap.core.Tween | null = null, tw5: gsap.core.Tween | null = null;
    if (violetSky && orrerySec) {
      tw3 = gsap.fromTo(violetSky, { opacity: 0 }, {
        opacity: 1, ease: "none",
        scrollTrigger: { trigger: orrerySec, start: "top 70%", end: "top 12%", scrub: reduced ? true : 1 },
      });
    }
    if (dawnSky && checkoutSec) {
      tw4 = gsap.fromTo(dawnSky, { opacity: 0 }, {
        opacity: 1, ease: "none",
        scrollTrigger: { trigger: checkoutSec, start: "top 92%", end: "top 30%", scrub: reduced ? true : 1 },
      });
    }
    // SEAM: the hero's copy hands off into the chooser + passage
    const heroCopy = document.querySelector<HTMLElement>(".ls-hero-copy");
    if (!reduced && heroCopy && document.querySelector(".ls-hero-section")) {
      tw5 = gsap.to(heroCopy, {
        opacity: 0, y: -34, ease: "none",
        scrollTrigger: { trigger: ".ls-hero-section", start: "bottom 86%", end: "bottom 38%", scrub: 1 },
      });
    }

    // starfield parallax on the same clock
    let tw6: gsap.core.Tween | null = null;
    if (!reduced && canvasWrap) {
      tw6 = gsap.fromTo(canvasWrap, { y: 0 }, {
        y: -70, ease: "none",
        scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: 1 },
      });
    }

    /* ---------- boot ---------- */
    const init = () => {
      buildThread();
      if (reduced) {
        // the finished passage at rest: border already complete, latched
        latched = true;
        cardIO?.disconnect(); cardIO = null;
        if (path && glowP) {
          path.style.strokeDashoffset = "0";
          glowP.style.strokeDashoffset = "0";
        }
        nodes.forEach((nd) => nd.classList.add("lit"));
        // the origin lights too: this branch never starts the frame loop, and a
        // finished thread hanging off an unlit station reads as a broken end
        birthEl?.classList.add("lit");
        armCard(); sealCard();
        paintFrame(0, 0);
        return;
      }
      armCard();
      drawn = targetLen();
      raf = requestAnimationFrame(frame);
    };

    let rT = 0;
    const onResize = () => {
      clearTimeout(rT);
      rT = window.setTimeout(() => { drawStars(); buildThread(); }, 200);
    };
    window.addEventListener("resize", onResize);

    const onSTRefresh = () => { drawStars(); buildThread(); };
    ScrollTrigger.addEventListener("refresh", onSTRefresh);

    // fonts land after load and reflow every beat: rebuild once they settle
    let fontsAlive = true;
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => { if (fontsAlive) { buildThread(); ScrollTrigger.refresh(); } }).catch(() => { /* ignore */ });
    }

    if (document.readyState === "complete") init();
    else window.addEventListener("load", init, { once: true });
    buildThread(); // provisional build so the thread exists pre-load

    requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      fontsAlive = false;
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(rT);
      clearTimeout(drawnT);
      clearTimeout(glideWaitT);
      fxDispose();
      glideTweens.forEach((tw) => tw.kill());
      document.removeEventListener("focusin", onFocusIn);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", init);
      ScrollTrigger.removeEventListener("refresh", onSTRefresh);
      io?.disconnect();
      ioSec?.disconnect();
      ioSync?.disconnect();
      glideIO?.disconnect();
      cardIO?.disconnect();
      [tw1, tw2, tw3, tw4, tw5, tw6].forEach((tw) => {
        if (!tw) return;
        tw.scrollTrigger?.kill();
        tw.kill();
      });
    };
  }, []);

  return (
    <section
      ref={rootRef}
      id="passage"
      className="lcb-root"
      aria-label="Why a birth chart"
    >
      <style>{LCB_CSS}</style>

      {/* fixed graded night stage - the ONE sky for the whole page */}
      <div className="lcb-back" aria-hidden="true">
        <div className="lcb-sky" />
        <div className="lcb-sky-violet" />
        <div className="lcb-canvas-wrap"><canvas className="lcb-canvas" /></div>
        <div className="lcb-dawn-horizon" />
        <div className="lcb-grade" />
      </div>

      <div className="c2-col">
        <div className="c2-threadwrap" aria-hidden="true">
          <svg className="c2-threadsvg" xmlns="http://www.w3.org/2000/svg">
            <path className="c2-thread-glow" d="" />
            <path className="c2-thread" d="" />
            <path className="c2-runner" d="" />
            <circle className="c2-spark" r="2.6" />
          </svg>
          {/* the origin: pinned a short lead above the first station by buildThread */}
          <span className="c2-node c2-birth" />
        </div>

        {/* ── Beat 1 · the love ── */}
        <section className="c2-beat c2-b1">
          <span className="c2-node" data-node data-for="c2-open" aria-hidden="true" />
          <p className="c2-lxl c2-rv" id="c2-open">We love animals just as much as each other.</p>
          <p className="c2-ll c2-rv"><em>If not more.</em></p>
          <svg className="c2-love-heart c2-rv" viewBox="0 0 124 116" aria-hidden="true">
            {/* one clean, symmetric line heart, evenly stroked, no fill */}
            <path
              className="c2-heart-line"
              d="M62 100 C 30 72 16 55 16 39 C 16 27 26 18 37 18 C 47 18 56 24 62 34 C 68 24 77 18 87 18 C 98 18 108 27 108 39 C 108 55 94 72 62 100 Z"
              fill="none"
            />
          </svg>
        </section>

        {/* ── Beat 2 · the daily proof, into the turn ── */}
        <section className="c2-beat c2-b2">
          <span className="c2-node c2-node-sm" data-node data-for="c2-f1" aria-hidden="true" />
          <span className="c2-node c2-node-sm" data-node data-for="c2-f2" aria-hidden="true" />
          <span className="c2-node c2-node-sm" data-node data-for="c2-f3" aria-hidden="true" />
          <span className="c2-node c2-node-sm" data-node data-for="c2-f4" aria-hidden="true" />
          <span className="c2-node c2-node-sm" data-node data-for="c2-f5" aria-hidden="true" />
          <span className="c2-node" data-node data-for="c2-turn" aria-hidden="true" />
          <div className="c2-frags">
            <p className="c2-frag c2-rv c2-rv-x" id="c2-f1">We talk to them.</p>
            <p className="c2-frag c2-rv c2-rv-x" id="c2-f2">We spoil them rotten.</p>
            <p className="c2-frag c2-rv c2-rv-x" id="c2-f3">We buy the good bed they ignore for the box it came in.</p>
            <p className="c2-frag c2-rv c2-rv-x" id="c2-f4">We keep a phone full of photos of them doing absolutely nothing.</p>
            <p className="c2-frag c2-rv c2-rv-x" id="c2-f5">They ask for so little and get everything.</p>
          </div>
          <p className="c2-ll c2-rv" id="c2-turn">They are the best thing we have, and they have no idea.</p>
          <p className="c2-ll c2-peak-v c2-rv"><em>And yet, so much of them stays a mystery.</em></p>
        </section>

        {/* ── Beat 3 · the question ── */}
        <section className="c2-beat c2-pivot">
          <span className="c2-node" data-node data-for="c2-q" aria-hidden="true" />
          <p className="c2-lxl c2-rv" id="c2-q">Have you ever wondered what they would say if they could speak?</p>
        </section>

        {/* ── Beat 4 · the answer ── */}
        <section className="c2-beat c2-answer">
          <span className="c2-node" data-node data-for="c2-listen" aria-hidden="true" />
          <p className="c2-ll c2-rv">They can.</p>
          <p className="c2-ll c2-rv">Just not in the way we would expect.</p>
          <p className="c2-lm c2-rv">The universe and nature are always communicating with us.</p>
          <p className="c2-ll c2-rv" id="c2-listen"><em>We just need to listen.</em></p>
        </section>

        {/* ── Beat 5 · the birth sky: a real natal wheel, the real moon
              arriving beside the sky line as a corner presence ── */}
        <section className="c2-beat c2-b3">
          <span className="c2-node" data-node data-for="c2-sky" aria-hidden="true" />
          <div className="c2-moonglow" aria-hidden="true" />
          <img
            className="c2-moonspine"
            src="/start/cosmos-moon.webp"
            alt=""
            width={520}
            height={520}
            decoding="async"
            loading="lazy"
          />
          <p className="c2-ll c2-rv">A birth chart is a way of listening to them.</p>
          <p className="c2-ll c2-rv" id="c2-sky">The sky the moment they were born is one language they are still speaking.</p>
          <div className="c2-wheel c2-rv" aria-hidden="true">
            <svg viewBox="0 0 320 320">
              <g className="wfills">
                {WHEEL_SEG_FILLS.map((s, i) => (
                  <path key={i} className={s.dim ? "wfill b" : "wfill a"} d={s.d} />
                ))}
              </g>
              {/* outer ring drawn as a path from 12 o'clock, clockwise */}
              <path className="wring-a" d="M160,6 A154,154 0 1 1 160,314 A154,154 0 1 1 160,6" />
              <circle className="wring-b" cx="160" cy="160" r="123" />
              <circle className="wring-c" cx="160" cy="160" r="38" />
              <g className="wticks">
                {WHEEL_TICKS.map((t, i) => (
                  <line key={i} className={t.mj ? "wtick mj" : "wtick"} x1={t.p1.x} y1={t.p1.y} x2={t.p2.x} y2={t.p2.y} />
                ))}
              </g>
              <g className="wcusps">
                {WHEEL_SIGNBOUNDS.map((c, i) => (
                  <line key={i} className="wcusp" x1={c.p1.x} y1={c.p1.y} x2={c.p2.x} y2={c.p2.y} />
                ))}
              </g>
              <g className="wspokes">
                {WHEEL_SPOKES.map((s, i) => (
                  <line key={i} className="wspoke" x1={s.p1.x} y1={s.p1.y} x2={s.p2.x} y2={s.p2.y} style={{ transitionDelay: `${s.d}s` }} />
                ))}
              </g>
              <g className="wglyphs">
                {WHEEL_SIGNS.map((s) => (
                  <g key={s.name} className="wz" transform={`translate(${s.p.x},${s.p.y}) scale(1.18)`}>
                    <g
                      className="wzg"
                      style={{ transitionDelay: `${s.d}s` }}
                      dangerouslySetInnerHTML={{ __html: GLYPH[s.name] || "" }}
                    />
                  </g>
                ))}
              </g>
              <g className="waspects">
                {WHEEL_ASPECTS.map((a, i) => (
                  <line
                    key={i}
                    className={a.soft ? "waspect soft" : "waspect"}
                    x1={a.p1.x} y1={a.p1.y} x2={a.p2.x} y2={a.p2.y}
                    style={{ ["--wl" as string]: `${a.len}`, transitionDelay: `${a.d}s` }}
                  />
                ))}
              </g>
              <g className="wplanets">
                {WHEEL_PLANETS.map((p) => (
                  <g key={p.id}>
                    <line className="wptick" x1={p.t1.x} y1={p.t1.y} x2={p.t2.x} y2={p.t2.y} style={{ transitionDelay: `${p.d}s` }} />
                    <line className="wconn" x1={p.c1.x} y1={p.c1.y} x2={p.c2.x} y2={p.c2.y} style={{ transitionDelay: `${p.d + 0.08}s` }} />
                    <g className="wp" transform={`translate(${p.glyph.x},${p.glyph.y}) scale(1.3)`}>
                      <g
                        className="wpg"
                        style={{ transitionDelay: `${p.d}s` }}
                        dangerouslySetInnerHTML={{ __html: GLYPH[p.id] || "" }}
                      />
                    </g>
                    <text
                      className="wdeg"
                      data-planet={p.id}
                      x={p.label.x} y={p.label.y}
                      textAnchor="middle" dominantBaseline="central"
                      style={{ transitionDelay: `${p.d + 0.14}s` }}
                    >{p.deg}</text>
                  </g>
                ))}
              </g>
            </svg>
          </div>
          <p className="c2-frag c2-rv" id="c2-xl-once">It tells you who they really are, why they do the things they do, the parts of them you have always felt but never had words for.</p>
        </section>

        {/* ── Beat 6 · release: straight into the form ── */}
        <section className="c2-beat c2-b4">
          <span className="c2-node" data-node data-for="c2-st-set" aria-hidden="true" />
          <p className="c2-peak c2-peak-v c2-rv" id="c2-st-set">Type their birthday, and hear the rest.</p>
        </section>
      </div>

      {/* framing overlays (above the beats) */}
      <div className="lcb-front" aria-hidden="true">
        <div className="lcb-veil" />
        <div className="lcb-vignette" />
        <div className="lcb-grain" />
      </div>
    </section>
  );
}
