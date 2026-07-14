import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getIntent, INTENT_EVENT } from "@/lib/intent";

gsap.registerPlugin(ScrollTrigger);

/* =====================================================================
   THE MAP EXISTS — the opening passage (littlesouls.app), C v2 momentum.
   Danny-approved design contract: opening-variants/variant-c-momentum.html
   (V2.1). Five beats between the intent toggle and the "Set the chart"
   form, carried by ONE violet thread that draws itself down the page:

     B1  the map          — whisper, then two huge peaks around the sealed
                            constellation frame
     B2  recognition      — "Except you. Almost." + three lived fragments
                            riding the thread as small nodes
     PIVOT                — personality / position
     B3  the birth sky    — a real natal wheel DRAWN on scroll, the real
                            moon arriving blur-to-sharp as a corner spine
                            presence beside it
     B4  the invitation   — "So the map waits." → "Set the chart."

   The thread is born under the chooser toggle, swings onto a left spine,
   ignites a station node at every claim, then leaves the passage, finds
   the form card and traces its border shut — the button ignites only
   when the border seals. Star dust drifts; a RARE violet-white shooting
   star crosses. Whisper-to-huge type scale. Purple/white only.

   The MEMORIAL register (ls_intent = memorial) speaks the same beats in
   remembered tense with hushed motion: softer node glow, dimmer dust,
   rarer meteors, slower reveals. Register change remounts the section.

   STRICT-CSP SAFE: GSAP core bundled by Vite (script-src 'self'), inline
   SVG + stroke-dashoffset, sanctioned canvas starfield, self-hosted moon
   photo. Reduced motion reads the finished passage at rest: thread fully
   drawn, nodes lit, wheel complete, moon sharp, form sealed, no drift.
===================================================================== */

/* bespoke zodiac + planet glyph paths (consumed by ReadingsLanding's wheel) */
export const GLYPH: Record<string, string> = {
  aries: '<path class="gl-s" d="M-6,-1 C-6,-6 -1,-7 0,-1 C1,-7 6,-6 6,-1"/>',
  taurus: '<circle class="gl-s" cx="0" cy="2.7" r="4"/><path class="gl-s" d="M-5.6,-3.4 A5.4,4.8 0 0 1 5.6,-3.4"/>',
  gemini: '<path class="gl-s" d="M-4,-5.4 L-4,5.4 M4,-5.4 L4,5.4"/><path class="gl-s" d="M-5.7,-5.4 A3.2,2 0 0 1 5.7,-5.4 M-5.7,5.4 A3.2,2 0 0 0 5.7,5.4"/>',
  cancer: '<path class="gl-s" d="M0.9,-3.7 C-3,-5.2 -6,-3 -6,-0.4"/><path class="gl-s" d="M-0.9,3.7 C3,5.2 6,3 6,0.4"/><circle class="gl-f" cx="2.7" cy="-2.5" r="1.7"/><circle class="gl-f" cx="-2.7" cy="2.5" r="1.7"/>',
  leo: '<circle class="gl-s" cx="-3" cy="3.3" r="2.5"/><path class="gl-s" d="M-1.1,1.7 C0.4,-1 -1.2,-6 -4,-6 C-6.6,-6 -6,-1.4 -3.3,0.6 M-1,1.8 C1.6,3.6 3.8,3 4.6,0.6"/>',
  virgo: '<path class="gl-s" d="M-6,5 L-6,-4 C-6,-6 -3.4,-6 -3.4,-4 L-3.4,5 M-3.4,-4 C-3.4,-6 -0.8,-6 -0.8,-4 L-0.8,5 M-0.8,-4 C-0.8,-6 1.9,-6 1.9,-4 L1.9,3 C1.9,6 5.2,5 4,1.3"/>',
  libra: '<path class="gl-s" d="M-6,4 L6,4"/><path class="gl-s" d="M-6,-0.4 L-2.8,-0.4 A3.4,3.4 0 0 1 2.8,-0.4 L6,-0.4"/>',
  scorpio: '<path class="gl-s" d="M-6,5 L-6,-4 C-6,-6 -3.4,-6 -3.4,-4 L-3.4,5 M-3.4,-4 C-3.4,-6 -0.8,-6 -0.8,-4 L-0.8,5 M-0.8,-4 C-0.8,-6 1.9,-6 1.9,-4 L1.9,4.6 L4.9,4.6"/><path class="gl-s" d="M4.9,4.6 L3.2,3 M4.9,4.6 L3.2,6.2"/>',
  sagittarius: '<path class="gl-s" d="M-5.6,5.6 L4.6,-4.6 M4.6,-4.6 L0.3,-4.6 M4.6,-4.6 L4.6,-0.3 M-3.7,-0.7 L0.7,3.7"/>',
  capricorn: '<path class="gl-s" d="M-6,-3.4 C-4.3,-5.6 -2.3,-4 -1.5,-1.4 L0.6,3.4 C0.7,-2.6 2.9,-4.2 4.1,-2"/><circle class="gl-s" cx="3.4" cy="2.6" r="2.4"/>',
  aquarius: '<path class="gl-s" d="M-6.2,-1.6 L-3.7,-3.8 L-1.2,-1.6 L1.3,-3.8 L3.8,-1.6 L6.2,-3.4"/><path class="gl-s" d="M-6.2,3 L-3.7,0.8 L-1.2,3 L1.3,0.8 L3.8,3 L6.2,1.2"/>',
  pisces: '<path class="gl-s" d="M-5.4,-5.8 A5.2,6.2 0 0 1 -5.4,5.8 M5.4,-5.8 A5.2,6.2 0 0 0 5.4,5.8 M-5.4,0 L5.4,0"/>',
  sun: '<circle class="gl-s" cx="0" cy="0" r="5.4"/><circle class="gl-f" cx="0" cy="0" r="1.3"/>',
  moon: '<path class="gl-f" d="M1.4,-5.6 A5.6,5.6 0 1 0 1.4,5.6 A7.2,7.2 0 0 1 1.4,-5.6 Z"/>',
  mercury: '<circle class="gl-s" cx="0" cy="0.2" r="3.1"/><path class="gl-s" d="M-3.1,-5.6 A3.3,3.1 0 0 0 3.1,-5.6"/><path class="gl-s" d="M0,3.3 L0,7 M-2.6,5.3 L2.6,5.3"/>',
  venus: '<circle class="gl-s" cx="0" cy="-1.6" r="3.1"/><path class="gl-s" d="M0,1.5 L0,6.8 M-2.6,4.1 L2.6,4.1"/>',
  mars: '<circle class="gl-s" cx="-1" cy="1.6" r="3.3"/><path class="gl-s" d="M1.4,-0.8 L5.7,-5.1 M5.7,-5.1 L2.2,-5.1 M5.7,-5.1 L5.7,-1.6"/>',
  jupiter: '<path class="gl-s" d="M-5.6,-3 C-5.4,-5.8 -1.8,-6.6 -0.7,-4 C0.2,-1.9 -1.6,0.8 -5.9,1.8 L4.9,1.8 M2.5,-5.6 L2.5,6.2"/>',
  saturn: '<path class="gl-s" d="M-3,-6.4 L-3,5 M-5,-4.2 L-1,-4.2 M-3,-0.8 C-1.4,-2.6 1.8,-2.4 2.6,-0.3 C3.4,1.8 2,3.6 0.6,4.8 C-0.3,5.6 -0.2,6.5 0.6,6.8"/>',
  uranus: '<circle class="gl-s" cx="0" cy="4.7" r="1.9"/><path class="gl-s" d="M0,2.8 L0,-1.7 M-4.3,-6.3 L-4.3,1 M4.3,-6.3 L4.3,1 M-4.3,-2.65 L4.3,-2.65"/>',
  neptune: '<path class="gl-s" d="M-4.7,-6.2 L-4.7,-3.2 C-4.7,-0.4 -1.9,1 0,1 C1.9,1 4.7,-0.4 4.7,-3.2 L4.7,-6.2 M0,-6.4 L0,6.6 M-2.6,3.8 L2.6,3.8 M-1.3,-5.1 L0,-6.5 L1.3,-5.1"/>',
  pluto: '<circle class="gl-s" cx="0" cy="-4.1" r="1.8"/><path class="gl-s" d="M-3.8,-4.4 A3.8,3.8 0 0 0 3.8,-4.4 M0,-0.6 L0,6.4 M-2.5,3 L2.5,3"/>',
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

/* radii: 154 outer ring · 122 zodiac-band inner edge · 74 aspect circle */
const WHEEL_SEG_FILLS = Array.from({ length: 12 }, (_, k) => {
  const a0 = k * 30, a1 = a0 + 30;
  const o0 = wP(a0, 154), o1 = wP(a1, 154), i1 = wP(a1, 122), i0 = wP(a0, 122);
  return {
    d: `M${o0.x},${o0.y} A154,154 0 0 0 ${o1.x},${o1.y} L${i1.x},${i1.y} A122,122 0 0 1 ${i0.x},${i0.y} Z`,
    dim: k % 2 === 0,
  };
});
const WHEEL_SIGNBOUNDS = Array.from({ length: 12 }, (_, k) => {
  const a = k * 30;
  return { p1: wP(a, 122), p2: wP(a, 154) };
});
const WHEEL_TICKS = (() => {
  const out: { p1: { x: number; y: number }; p2: { x: number; y: number }; mj: boolean }[] = [];
  for (let deg = 0; deg < 360; deg++) {
    if (deg % 30 === 0) continue;
    const len = deg % 10 === 0 ? 7 : deg % 5 === 0 ? 4.8 : 2.6;
    out.push({ p1: wP(deg, 122), p2: wP(deg, 122 + len), mj: deg % 5 === 0 });
  }
  return out;
})();
const SIGN_ORDER = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];
const WHEEL_SIGNS = SIGN_ORDER.map((name, k) => ({
  name, p: wP(k * 30 + 15, 141.5), d: 1.0 + k * 0.045,
}));
/* whole-sign house cusps: hairline spokes, aspect circle to the band */
const WHEEL_SPOKES = Array.from({ length: 12 }, (_, k) => {
  const a = k * 30;
  return { p1: wP(a, 74), p2: wP(a, 122), d: 0.75 + k * 0.05 };
});
/* planets at their true longitudes; crowded glyphs relax apart while their
   degree ticks + pointer lines stay exactly on the true degree */
const WHEEL_PLANETS = (() => {
  const MINSEP = 17;
  const s = CHART_BODIES.map((b) => ({ ...b, adj: b.lon })).sort((a, b) => a.lon - b.lon);
  for (let pass = 0; pass < 32; pass++) {
    let moved = false;
    for (let i = 0; i < s.length; i++) {
      const a = s[i], b = s[(i + 1) % s.length];
      const gap = (((b.adj - a.adj) % 360) + 360) % 360;
      if (gap < MINSEP - 0.01) {
        const push = (MINSEP - gap) / 2;
        a.adj -= push; b.adj += push; moved = true;
      }
    }
    if (!moved) break;
  }
  return s.map((p, k) => ({
    id: p.id,
    deg: `${p.lon % 30}°`,
    glyph: wP(p.adj, 103),
    label: wP(p.adj, 88),
    c1: wP(p.adj, 111.5),
    c2: wP(p.lon, 116.5),
    t1: wP(p.lon, 122),
    t2: wP(p.lon, 116.5),
    d: 1.5 + k * 0.09,
  }));
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
            const p1 = wP(CHART_BODIES[i].lon, 74);
            const p2 = wP(CHART_BODIES[j].lon, 74);
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

const LCB_CSS = `
.lcb-root{
  --lcb-bg:#0d0a14; --lcb-deep:#070510; --lcb-lift:#100c1a;
  --lcb-violet:#8b7bd8; --lcb-violet-br:#a78bfa; --lcb-violet-soft:#b3a7e0;
  --lcb-white:#f5f2ff;
  --lcb-body:rgba(245,242,255,.78);
  --lcb-dim:rgba(245,242,255,.55);
  --c2-spine:24px; --c2-padl:60px; --c2-padr:22px;
  position:relative;
  overflow-x:clip;
  pointer-events:none;
  font-family:"Newsreader",Georgia,serif;font-weight:400;
  -webkit-font-smoothing:antialiased;
}
@media (min-width:900px){
  .lcb-root{ --c2-spine:44px; --c2-padl:104px; --c2-padr:40px; }
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
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}

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
.c2-beat{position:relative;z-index:1;display:block}

/* ---- reveal motion ---- */
.c2-rv{ opacity:0; transform:translate3d(0,34px,0); }
.c2-rv.is-in{
  opacity:1; transform:translate3d(0,0,0);
  transition:transform .62s cubic-bezier(.2,.9,.25,1.06), opacity .48s ease-out;
  transition-delay:var(--d,0s);
}
.c2-rv-x{ transform:translate3d(-18px,22px,0); }
.lcb-memorial .c2-rv.is-in{
  transition-duration:.95s,.78s;
}

/* ---- type scale: whisper to huge. Fraunces peaks, Newsreader voice. ---- */
.c2-whisper{font-family:"Newsreader",Georgia,serif;font-style:italic;font-size:17px;color:var(--lcb-dim);max-width:34ch;line-height:1.6;margin:0}
.c2-lm{font-family:"Fraunces",Georgia,serif;font-weight:400;font-size:clamp(1.3rem,2.4vw + .6rem,1.8rem);line-height:1.3;color:var(--lcb-body);margin:0;letter-spacing:-0.008em}
.c2-ll{font-family:"Fraunces",Georgia,serif;font-weight:400;font-size:clamp(1.7rem,3.4vw + .7rem,2.5rem);line-height:1.2;color:var(--lcb-white);letter-spacing:-0.014em;margin:0;text-wrap:balance}
.c2-lxl{font-family:"Fraunces",Georgia,serif;font-weight:400;font-size:clamp(2.05rem,4.6vw + .8rem,3.15rem);line-height:1.14;color:var(--lcb-white);letter-spacing:-0.016em;margin:0;text-wrap:balance}
.c2-peak{
  font-family:"Fraunces",Georgia,serif;font-weight:400;
  font-size:clamp(2.35rem,6.4vw + 1rem,4.4rem);line-height:1.07;
  color:var(--lcb-white);letter-spacing:-0.02em;max-width:14ch;margin:0;
  text-shadow:0 1px 30px rgba(4,3,10,.5);text-wrap:balance;
}
.c2-peak-v{color:var(--lcb-violet-br)}
.c2-frag{font-family:"Newsreader",Georgia,serif;font-size:17.5px;line-height:1.5;color:var(--lcb-dim);position:relative;max-width:34ch;margin:0}
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
.c2-node.lit::after{animation:c2npulse 2.4s ease-out infinite}
.lcb-memorial .c2-node.lit{box-shadow:0 0 9px rgba(167,139,250,.45)}
.lcb-memorial .c2-node.lit::after{animation-duration:3.6s}
@keyframes c2npulse{0%{transform:scale(.55);opacity:.85}70%{transform:scale(2);opacity:0}100%{transform:scale(2);opacity:0}}
.c2-node-sm{width:7px;height:7px;left:calc(var(--c2-spine) - var(--c2-padl) - 3.5px);border-width:1px}
.c2-node-sm::before{display:none}
.c2-node-sm::after{inset:-4px}
.c2-node-sm.lit{box-shadow:0 0 10px rgba(167,139,250,.55)}

/* ---- beats: compressed, always an event in view ---- */
.c2-b1{padding:7svh 0 7svh}
.c2-b1 .c2-whisper{margin-bottom:3.2svh}
.c2-b2{padding:9svh 0 8svh}
.c2-b2 .c2-whisper{margin-top:2.8svh}
.c2-frags{margin-top:4.6svh;display:flex;flex-direction:column;gap:2.8svh}
.c2-pivot{padding:12svh 0 11svh}
.c2-pivot .c2-ll{max-width:16ch}
.c2-pivot .c2-ll + .c2-ll{margin-top:3.2svh}
.c2-b3{padding:10svh 0 7svh}
.c2-b3 .c2-lxl{max-width:16ch;margin-top:4.6svh}
.c2-b4{padding:11svh 0 10svh}
.c2-b4 .c2-lm{margin-top:3svh}
.c2-b4 .c2-peak{margin-top:3.6svh}
.lcb-memorial .c2-b2{padding-top:11svh}
.lcb-memorial .c2-pivot{padding:13svh 0 12svh}

/* beat 1: the sealed map, in flow between the two peaks */
.c2-constellation{
  display:block;width:clamp(112px,30vw,170px);opacity:.6;
  margin:7svh clamp(4px,6vw,80px) 7svh auto;pointer-events:none;
}
.c2-constellation .cframe{stroke:rgba(167,139,250,.3);fill:none;stroke-width:1}
.c2-constellation .cline{
  stroke:rgba(167,139,250,.55);stroke-width:1;fill:none;
  stroke-dasharray:400;stroke-dashoffset:400;
  transition:stroke-dashoffset 1.6s ease-out .3s;
}
.c2-b1.is-inview .c2-constellation .cline{stroke-dashoffset:0}
.c2-constellation .cstar{fill:var(--lcb-violet-soft)}

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
.c2-wheel .wring-a{stroke:rgba(167,139,250,.62);fill:none;stroke-width:1.3}
.c2-wheel .wring-b{stroke:rgba(167,139,250,.46);fill:none;stroke-width:1}
.c2-wheel .wring-c{stroke:rgba(139,123,216,.42);fill:none;stroke-width:.8}
.c2-wheel .wcusp{stroke:rgba(167,139,250,.4);stroke-width:1}
.c2-wheel .wtick{stroke:rgba(179,167,224,.42);stroke-width:.5}
.c2-wheel .wtick.mj{stroke:rgba(179,167,224,.58);stroke-width:.8}
.c2-wheel .wspoke{stroke:rgba(139,123,216,.28);stroke-width:.7}
.c2-wheel .waspect{fill:none;stroke:rgba(167,139,250,.46);stroke-width:1}
.c2-wheel .waspect.soft{stroke:rgba(179,167,224,.34);stroke-width:.8}
.c2-wheel .wptick{stroke:var(--lcb-violet-br);stroke-width:1.5}
.c2-wheel .wconn{stroke:rgba(167,139,250,.38);stroke-width:.6}
.c2-wheel .wdeg{
  font-family:"Newsreader",Georgia,serif;font-size:15px;
  fill:rgba(245,242,255,.78);letter-spacing:.02em;
}
.c2-wheel .wz .gl-s{fill:none;stroke:rgba(205,192,244,.85);stroke-width:1.05;stroke-linecap:round;stroke-linejoin:round}
.c2-wheel .wz .gl-f{fill:rgba(205,192,244,.85);stroke:none}
.c2-wheel .wp .gl-s{fill:none;stroke:var(--lcb-violet-br);stroke-width:1.15;stroke-linecap:round;stroke-linejoin:round}
.c2-wheel .wp .gl-f{fill:var(--lcb-violet-br);stroke:none}
/* drawn on scroll */
.c2-wheel .wring-a{stroke-dasharray:968;stroke-dashoffset:968;transition:stroke-dashoffset 1.5s ease-out .1s}
.c2-wheel .wring-b{stroke-dasharray:767;stroke-dashoffset:767;transition:stroke-dashoffset 1.4s ease-out .35s}
.c2-wheel .wring-c{stroke-dasharray:465;stroke-dashoffset:465;transition:stroke-dashoffset 1s ease-out .6s}
.c2-wheel .wcusps{opacity:0;transition:opacity .9s ease .8s}
.c2-wheel .wticks{opacity:0;transition:opacity 1s ease 1s}
.c2-wheel .wspoke{stroke-dasharray:48;stroke-dashoffset:48;transition:stroke-dashoffset .8s ease-out}
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

/* the real moon: corner spine presence, blur-to-sharp arrival. It lives
   with the birth-sky beat and retires with it - never below the opening. */
.c2-moonspine{
  position:absolute;z-index:-1;pointer-events:none;
  top:calc(-1 * clamp(44px, 9svh, 96px));
  right:calc(-1 * clamp(14px, 6vw, 84px));
  width:clamp(116px, 28vw, 208px);height:auto;border-radius:50%;
  -webkit-mask-image:radial-gradient(circle, #000 93%, rgba(0,0,0,0) 100%);
  mask-image:radial-gradient(circle, #000 93%, rgba(0,0,0,0) 100%);
  opacity:0;filter:blur(16px);
  transition:opacity 1.2s ease .15s, filter 1.6s ease .15s;
  will-change:transform;
}
.c2-b3.is-inview .c2-moonspine{opacity:.95;filter:blur(0)}
.c2-moonglow{
  position:absolute;z-index:-2;pointer-events:none;border-radius:50%;
  top:calc(-1 * clamp(60px, 11svh, 120px));
  right:calc(-1 * clamp(30px, 8vw, 108px));
  width:clamp(150px, 36vw, 260px);aspect-ratio:1;
  background:radial-gradient(circle, rgba(167,139,250,.22) 0%, rgba(167,139,250,.08) 45%, transparent 70%);
  opacity:0;transition:opacity 1.6s ease .3s;mix-blend-mode:screen;
}
.c2-b3.is-inview .c2-moonglow{opacity:1}
.lcb-memorial .c2-b3.is-inview .c2-moonglow{opacity:.7}

/* ---- reduced motion: the finished passage at rest ---- */
@media (prefers-reduced-motion: reduce){
  .lcb-root *, .lcb-root *::before, .lcb-root *::after{
    animation:none !important;
    transition:none !important;
  }
  .c2-rv{opacity:1 !important;transform:none !important}
  .c2-constellation .cline{stroke-dashoffset:0 !important}
  .c2-wheel .wring-a,.c2-wheel .wring-b,.c2-wheel .wring-c,
  .c2-wheel .wspoke,.c2-wheel .waspect{stroke-dashoffset:0 !important}
  .c2-wheel .wcusps,.c2-wheel .wticks,.c2-wheel .wfill,.c2-wheel .wzg,
  .c2-wheel .wpg,.c2-wheel .wptick,.c2-wheel .wconn,.c2-wheel .wdeg{opacity:1 !important}
  .c2-wheel .wpg{transform:scale(1) !important}
  .c2-moonspine{opacity:.95 !important;filter:blur(0) !important}
  .c2-moonglow{opacity:1 !important}
  .c2-node.lit::before{width:20px !important}
}
`;

/* ---- the passage copy: discovery + memorial registers ----
   Discovery lines are Danny-approved C v2 verbatim. Memorial lines are the
   remembered-tense variant of each beat: same shape, lower voice. */
const COPY = {
  discovery: {
    b1whisper: "There is a map of exactly who your pet is.",
    b2whisper: "You have been reading it for years without knowing.",
    frags: [
      "The waiting at the door before your key turns.",
      "The exact spot they claim, every time.",
      "The look they save for you alone.",
    ],
    pivot1: "You call that personality.",
    b4whisper: "So the map waits.",
  },
  memorial: {
    b1whisper: "There is a map of exactly who they were.",
    b2whisper: "You were reading it for years without knowing.",
    frags: [
      "The waiting at the door before your key turned.",
      "The exact spot they claimed, every time.",
      "The look they saved for you alone.",
    ],
    pivot1: "You called that personality.",
    b4whisper: "So the map remains.",
  },
};

export function CosmicBridge() {
  const rootRef = useRef<HTMLElement>(null);

  // The register: discovery (default) or memorial. The chooser toggle / URL
  // intent drives it live via the ls-intent event; a register change remounts
  // the whole section (key below) and rebuilds the thread from scratch.
  const [register, setRegister] = useState<"discovery" | "memorial">(() =>
    getIntent() === "memorial" ? "memorial" : "discovery");
  useEffect(() => {
    const onIntent = () => {
      setRegister(getIntent() === "memorial" ? "memorial" : "discovery");
      requestAnimationFrame(() => requestAnimationFrame(() => ScrollTrigger.refresh()));
    };
    window.addEventListener(INTENT_EVENT, onIntent);
    return () => window.removeEventListener(INTENT_EVENT, onIntent);
  }, []);
  const memorial = register === "memorial";
  const T = memorial ? COPY.memorial : COPY.discovery;

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === "undefined") return;

    const q = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = root) => scope.querySelector<T>(sel);
    const qa = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = root) => Array.from(scope.querySelectorAll<T>(sel));
    const hush = register === "memorial";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- canvas: magnitude-scaled starfield + star dust + a RARE
       violet-white shooting star. Painted only while the stage is lit. ---- */
    const canvas = q<HTMLCanvasElement>(".lcb-canvas");
    const canvasWrap = q(".lcb-canvas-wrap");
    const back = q(".lcb-back");
    const front = q(".lcb-front");
    let drawStars = () => {};
    let paintFrame: (t: number, dt: number) => void = () => {};
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
      let nextShoot = 0;
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
        for (const st of stars) {
          const a = dt > 0
            ? st.a * (1 - st.tw * 0.5 + st.tw * 0.5 * Math.sin(t * 0.001 * st.sp + st.ph))
            : st.a;
          ctxc.beginPath();
          ctxc.fillStyle = `rgba(${st.c[0]},${st.c[1]},${st.c[2]},${Math.max(0, a)})`;
          ctxc.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctxc.fill();
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
        // RARE violet-white shooting star with a soft trail
        if (t > nextShoot && !shooter) {
          const fromLeft = Math.random() < 0.5;
          const ang2 = (Math.random() * 0.16 + 0.12) * (fromLeft ? 1 : -1);
          const speed = (cw + ch) * 0.55;
          shooter = {
            x: fromLeft ? -40 * dpr : cw + 40 * dpr,
            y: (Math.random() * 0.35 + 0.06) * ch,
            vx: (fromLeft ? 1 : -1) * Math.cos(ang2) * speed,
            vy: Math.abs(Math.sin(ang2)) * speed * 0.7 + ch * 0.12,
            life: 0, max: 1.2,
          };
          nextShoot = t + (hush ? 26000 : 16000) + Math.random() * 14000;
        }
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
      drawStars();
      nextShoot = performance.now() + 9000;
    }

    /* ---------- reveals: one observer for lines, one for the two beats
       that draw themselves (constellation, wheel + moon) ---------- */
    const rvNodes = qa(".c2-rv");
    const secNodes = qa(".c2-b1, .c2-b3");
    let io: IntersectionObserver | null = null;
    let ioSec: IntersectionObserver | null = null;
    if (reduced || !("IntersectionObserver" in window)) {
      rvNodes.forEach((el) => el.classList.add("is-in"));
      secNodes.forEach((el) => el.classList.add("is-inview"));
    } else {
      io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting || e.boundingClientRect.top < 0) { e.target.classList.add("is-in"); io?.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: "600px 0px -9% 0px" });
      rvNodes.forEach((el) => io?.observe(el));
      ioSec = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting || e.boundingClientRect.top < 0) { e.target.classList.add("is-inview"); ioSec?.unobserve(e.target); }
        });
      }, { threshold: 0.2, rootMargin: "600px 0px 0px 0px" });
      secNodes.forEach((el) => ioSec?.observe(el));
    }

    /* ---------- THE THREAD: born under the chooser toggle, swings onto
       the spine, ignites every station node, then finds the form card and
       seals its border shut. The button ignites only when sealed. ---------- */
    const col = q(".c2-col");
    const svg = q<SVGSVGElement>(".c2-threadsvg");
    const path = q<SVGPathElement>(".c2-thread");
    const glowP = q<SVGPathElement>(".c2-thread-glow");
    const nodes = qa("[data-node]");
    const moonSec = q(".c2-b3");
    const moonImg = q<HTMLImageElement>(".c2-moonspine");
    const getCard = () => document.querySelector<HTMLElement>(".ls-seal-card");

    let totalLen = 0, spineLen = 0, hasCard = false;
    let nodeLens: number[] = [];
    let cardTopAbs = 0, cardH = 0, colTopAbs = 0;
    let lastStructure = "";

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
      const rel = (r: DOMRect) => ({ x: r.left - colLeft, y: r.top - colR.top, w: r.width, h: r.height });

      // born under the chosen path (the chooser toggle), then swings onto the spine
      const toggle = document.querySelector<HTMLElement>(".ls-tgl-track");
      let d: string;
      let startY: number;
      if (toggle) {
        const t = rel(toggle.getBoundingClientRect());
        const startX = t.x + 28;
        startY = t.y + t.h + 18;
        const joinY = startY + 90;
        d = `M ${startX} ${startY} C ${startX - 26} ${startY + 48}, ${sx} ${startY + 48}, ${sx} ${joinY}`;
        startY = joinY;
      } else {
        startY = -40;
        d = `M ${sx} ${startY}`;
      }

      const pts: Pt[] = [{ x: sx, y: startY }];
      const nodeYs: number[] = [];
      nodes.forEach((nd) => {
        const r = rel(nd.getBoundingClientRect());
        const p = { x: sx, y: r.y + r.h / 2 };
        pts.push(p);
        nodeYs.push(p.y);
      });

      let side = 1;
      let prev = pts[0];
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i];
        const dx = p.x - prev.x;
        const dy = p.y - prev.y;
        if (Math.abs(dx) < 30) {
          const amp = Math.min(1, Math.abs(dy) / 170);
          d += ` C ${sx + 18 * side * amp} ${prev.y + dy * 0.35}, ${sx - 14 * side * amp} ${prev.y + dy * 0.7}, ${p.x} ${p.y}`;
          side *= -1;
        } else {
          d += ` C ${prev.x} ${prev.y + dy * 0.5}, ${p.x} ${p.y - dy * 0.5}, ${p.x} ${p.y}`;
        }
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
        cardTopAbs = c.y + colTopAbs;
        cardH = c.h;
      } else {
        // no card on stage (computing / revealed): the thread rests after
        // its last claim
        const probe = document.createElementNS("http://www.w3.org/2000/svg", "path");
        probe.setAttribute("d", d);
        spineLen = probe.getTotalLength();
        cardTopAbs = 0; cardH = 0;
      }

      path.setAttribute("d", d);
      glowP.setAttribute("d", d);
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

    const targetLen = () => {
      if (!path || !spineLen) return 0;
      if (engaged && hasCard) return totalLen;
      const sy = window.scrollY;
      const vh = window.innerHeight;
      const tipY = sy + vh * 0.76 - colTopAbs;
      let lo = 0, hi = spineLen;
      for (let k = 0; k < 20; k++) {
        const mid = (lo + hi) / 2;
        if (path.getPointAtLength(mid).y < tipY) lo = mid; else hi = mid;
      }
      let len = (lo + hi) / 2;
      if (hasCard && len > spineLen - 2) {
        let bp = ((sy + vh) - (cardTopAbs + 30)) / (cardH + 60);
        bp = Math.max(0, Math.min(1, bp));
        len = spineLen + bp * (totalLen - spineLen);
      }
      return Math.max(0, Math.min(hasCard ? totalLen : spineLen, len));
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
      const t = targetLen();
      drawn += (t - drawn) * 0.09;
      if (Math.abs(t - drawn) < 0.5) drawn = t;
      if (path && glowP && totalLen > 0) {
        const off = totalLen - drawn;
        path.style.strokeDashoffset = String(off);
        glowP.style.strokeDashoffset = String(off);
      }
      nodes.forEach((nd, i) => {
        if (nodeLens[i] !== undefined) nd.classList.toggle("lit", drawn >= nodeLens[i] - 4);
      });
      if (!sealed && hasCard && totalLen > 0 && drawn >= totalLen - 1.5) {
        sealed = true;
        sealCard();
      }
      // the moon drifts gently in its corner as the birth-sky beat passes
      if (moonSec && moonImg) {
        const mr = moonSec.getBoundingClientRect();
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
        // the finished passage at rest
        if (path && glowP) {
          path.style.strokeDashoffset = "0";
          glowP.style.strokeDashoffset = "0";
        }
        nodes.forEach((nd) => nd.classList.add("lit"));
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
      document.removeEventListener("focusin", onFocusIn);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", init);
      ScrollTrigger.removeEventListener("refresh", onSTRefresh);
      io?.disconnect();
      ioSec?.disconnect();
      [tw1, tw2, tw3, tw4, tw5, tw6].forEach((tw) => {
        if (!tw) return;
        tw.scrollTrigger?.kill();
        tw.kill();
      });
    };
  }, [register]);

  return (
    <section
      ref={rootRef}
      key={register}
      className={memorial ? "lcb-root lcb-memorial" : "lcb-root"}
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
          </svg>
        </div>

        {/* ── Beat 1 · the map ── */}
        <section className="c2-beat c2-b1">
          <span className="c2-node" data-node data-for="c2-pk-drawn" aria-hidden="true" />
          <span className="c2-node" data-node data-for="c2-pk-read" aria-hidden="true" />
          <p className="c2-whisper c2-rv">{T.b1whisper}</p>
          <p className="c2-peak c2-rv" id="c2-pk-drawn">It was drawn the day they were born.</p>
          <svg className="c2-constellation" viewBox="0 0 190 230" aria-hidden="true">
            <rect className="cframe" x="8" y="8" width="174" height="214" rx="10" />
            <path className="cline" d="M44 52 L92 78 L74 128 L118 150 L146 108 L92 78 M74 128 L48 176 M118 150 L142 190" />
            <circle className="cstar" cx="44" cy="52" r="2.4" />
            <circle className="cstar" cx="92" cy="78" r="3" />
            <circle className="cstar" cx="74" cy="128" r="2.2" />
            <circle className="cstar" cx="118" cy="150" r="2.8" />
            <circle className="cstar" cx="146" cy="108" r="2" />
            <circle className="cstar" cx="48" cy="176" r="1.8" />
            <circle className="cstar" cx="142" cy="190" r="2.1" />
            <circle className="cstar" cx="150" cy="40" r="1.4" />
            <circle className="cstar" cx="30" cy="102" r="1.3" />
          </svg>
          <p className="c2-peak c2-rv" id="c2-pk-read">No one has ever <em>read</em> it.</p>
        </section>

        {/* ── Beat 2 · recognition ── */}
        <section className="c2-beat c2-b2">
          <span className="c2-node" data-node data-for="c2-st-you" aria-hidden="true" />
          <span className="c2-node c2-node-sm" data-node data-for="c2-frag-1" aria-hidden="true" />
          <span className="c2-node c2-node-sm" data-node data-for="c2-frag-2" aria-hidden="true" />
          <span className="c2-node c2-node-sm" data-node data-for="c2-frag-3" aria-hidden="true" />
          <p className="c2-ll c2-rv" id="c2-st-you">Except you. Almost.</p>
          <p className="c2-whisper c2-rv">{T.b2whisper}</p>
          <div className="c2-frags">
            <p className="c2-frag c2-rv c2-rv-x" id="c2-frag-1">{T.frags[0]}</p>
            <p className="c2-frag c2-rv c2-rv-x" id="c2-frag-2">{T.frags[1]}</p>
            <p className="c2-frag c2-rv c2-rv-x" id="c2-frag-3">{T.frags[2]}</p>
          </div>
        </section>

        {/* ── Beat 2/3 pivot ── */}
        <section className="c2-beat c2-pivot">
          <span className="c2-node" data-node data-for="c2-st-pos" aria-hidden="true" />
          <p className="c2-ll c2-rv">{T.pivot1}</p>
          <p className="c2-ll c2-rv" id="c2-st-pos"><em>The sky calls it position.</em></p>
        </section>

        {/* ── Beat 3 · the birth sky: a real natal wheel, the real moon
              arriving beside it as a corner presence ── */}
        <section className="c2-beat c2-b3">
          <span className="c2-node" data-node data-for="c2-st-sky" aria-hidden="true" />
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
          <p className="c2-whisper c2-rv" id="c2-st-sky">The minute they arrived, every planet held its place around them.</p>
          <div className="c2-wheel c2-rv" aria-hidden="true">
            <svg viewBox="0 0 320 320">
              <g className="wfills">
                {WHEEL_SEG_FILLS.map((s, i) => (
                  <path key={i} className={s.dim ? "wfill b" : "wfill a"} d={s.d} />
                ))}
              </g>
              <circle className="wring-a" cx="160" cy="160" r="154" />
              <circle className="wring-b" cx="160" cy="160" r="122" />
              <circle className="wring-c" cx="160" cy="160" r="74" />
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
                  <g key={s.name} className="wz" transform={`translate(${s.p.x},${s.p.y}) scale(1.22)`}>
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
                    <g className="wp" transform={`translate(${p.glyph.x},${p.glyph.y}) scale(1.32)`}>
                      <g
                        className="wpg"
                        style={{ transitionDelay: `${p.d}s` }}
                        dangerouslySetInnerHTML={{ __html: GLYPH[p.id] || "" }}
                      />
                    </g>
                    <text
                      className="wdeg"
                      x={p.label.x} y={p.label.y}
                      textAnchor="middle" dominantBaseline="central"
                      style={{ transitionDelay: `${p.d + 0.14}s` }}
                    >{p.deg}</text>
                  </g>
                ))}
              </g>
            </svg>
          </div>
          <p className="c2-lxl c2-rv">That sky has never happened again. It never will.</p>
        </section>

        {/* ── Beat 4 · invitation ── */}
        <section className="c2-beat c2-b4">
          <span className="c2-node" data-node data-for="c2-st-set" aria-hidden="true" />
          <p className="c2-whisper c2-rv">{T.b4whisper}</p>
          <p className="c2-lm c2-rv">Be the first to read it.</p>
          <p className="c2-peak c2-peak-v c2-rv" id="c2-st-set">Set the chart.</p>
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
