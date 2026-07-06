import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getIntent, INTENT_EVENT } from "@/lib/intent";

gsap.registerPlugin(ScrollTrigger);

/* =====================================================================
   The bridge passage (littlesouls.app) - the emotional hero moment
   between <HeroSection/> and the "Set the chart" form. One story, four
   beats, and ONE continuing actor: the MOON. Beat 1 the moon ANSWERS
   (earthshine - the part you could not see was facing you). Beat 2 the
   moon ACTS: a sextant takes its measurement, overshoot then settle,
   "to the degree" made physical. Beat 3 the moon PRESIDES over the apex:
   the only camera plunge on the page, a populated sky of near-misses,
   contact inside the moonbeam, the fused light ascending INTO the moon.
   Beat 4 the moon GIVES: a ring of its own rim light becomes the unset
   chart frame that descends and match-cuts onto the form's violet crest.

     1 THE SKY REPLIES - blur-to-sharp arrival; one meteor; a twinkle
       wave; the whole sky takes the weight and comes to REST; then
       earthshine lights the dark limb and the moon blinks ONCE.
     2 THE SEXTANT    - a loose star wanders; a dashed sight-line draws
       from the moon's limb; a 70-degree graduated limb deals out; the
       index arm sweeps 4 degrees PAST the star and settles back exact;
       the readout counts to the real chart Moon degree. Lock.
     3 OUT OF EVERYTHING - a mote sky of near-misses; camera push one;
       the gold soul parks at the meeting point and WAITS; the moonbeam
       finds the spot; camera push two; the ivory soul decelerates in;
       contact; iris; the fused light ascends the beam into the moon.
     4 THE SEAL IS CAST - a 40-degree arc detaches from the moon's lower
       limb, closes to a ring at stage centre, assembles the UNSET chart
       (rim pair, degree ring, twelve house spokes - the map before the
       planets), tilts like a seal lifted to be pressed, then descends
       and match-cuts onto the form's crest as "Set the chart." lights.

   ONE house ease everywhere something settles: expo-out (.16,1,.3,1).
   Palette on warm near-black #0d0a14: desaturated gold #f0d99f, ivory
   #efe9dd, body #d8d0c1. ~80% stillness - one focal thing moving at a time.

   STRICT-CSP SAFE: GSAP core + ScrollTrigger are bundled by Vite (served
   from our own origin under script-src 'self'), never a CDN <script>.
   Inline SVG + stroke-dashoffset (no paid DrawSVG). getPointAtLength is
   sampled ONCE at setup into a lookup (no paid MotionPath, nothing read in
   the scroll loop). TWO sanctioned canvas windows (beat-1 starfield, beat-3
   mote sky). Moon self-hosted. NO live filter animation anywhere. Reduced-
   motion renders the honest FINAL state of every beat.
===================================================================== */

/* ---- The placeholder natal chart --------------------------------------
   Every degree readout derives from ONE source array. The sextant readout
   counts to the REAL chart Moon degree - never an invented number. Wiring
   a real per-pet chart later is a pure swap of this one array. */
const SIGN_LON: Record<string, number> = {
  Aries: 0, Taurus: 30, Gemini: 60, Cancer: 90, Leo: 120, Virgo: 150,
  Libra: 180, Scorpio: 210, Sagittarius: 240, Capricorn: 270, Aquarius: 300, Pisces: 330,
};

type Placement = { key: string; sign: string; deg: number; min: number; lon: number };
const CHART: Placement[] = ([
  { key: "sun", sign: "Pisces", deg: 24, min: 37 },
  { key: "moon", sign: "Virgo", deg: 24, min: 37 },      // exact opposition to Sun
  { key: "mercury", sign: "Pisces", deg: 8, min: 14 },
  { key: "venus", sign: "Taurus", deg: 3, min: 51 },
  { key: "mars", sign: "Cancer", deg: 12, min: 29 },
  { key: "chiron", sign: "Aries", deg: 19, min: 6 },
  { key: "lilith", sign: "Scorpio", deg: 27, min: 40 },
  { key: "northNode", sign: "Leo", deg: 5, min: 18 },
  { key: "ascendant", sign: "Sagittarius", deg: 2, min: 55 },
] as Omit<Placement, "lon">[]).map((p) => ({ ...p, lon: SIGN_LON[p.sign] + p.deg + p.min / 60 }));

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
  northNode: '<path class="gl-s" d="M-3.7,4.6 C-6.7,-3.4 6.7,-3.4 3.7,4.6"/><circle class="gl-f" cx="-3.9" cy="4.8" r="1.5"/><circle class="gl-f" cx="3.9" cy="4.8" r="1.5"/>',
  chiron: '<circle class="gl-s" cx="0" cy="4.2" r="2.2"/><path class="gl-s" d="M-1.6,-6.3 L-1.6,2 M-1.6,-1.7 L2.4,-6.3 M-1.6,-1.7 L2.4,2"/>',
  lilith: '<path class="gl-f" d="M1,-6.4 A3,3 0 1 0 1,-0.4 A4,4 0 0 1 1,-6.4 Z"/><path class="gl-s" d="M0,-0.4 L0,6.6 M-2.4,3.4 L2.4,3.4"/>',
};

/* ---- BEAT 2: the sextant geometry ------------------------------------
   Pivot, loose star, a 70-degree graduated limb of radius 150 and the
   index arm. The whole instrument is authored in its LOCKED final state
   (arm at the star's exact bearing, ticks lit up to it, real readout) so
   reduced-motion gets the honest end-state with zero JS motion. Motion
   mode resets to hidden and performs the measurement. */
const SXT = (() => {
  const P = { x: 238, y: 320 };
  const S = { x: 128, y: 150 };
  const R = 150;
  const BEAR = (Math.atan2(S.y - P.y, S.x - P.x) * 180) / Math.PI; // ~ -122.93deg
  return { P, S, R, BEAR, A0: -158, A1: -88, STEP: 2 };
})();

function buildSextant(): string {
  const { P, S, R, BEAR, A0, A1, STEP } = SXT;
  const pad2 = (n: number) => (n < 10 ? "0" : "") + n;
  const rad = (d: number) => (d * Math.PI) / 180;
  const pt = (aDeg: number, r: number): [number, number] => [P.x + Math.cos(rad(aDeg)) * r, P.y + Math.sin(rad(aDeg)) * r];
  const s = (v: number) => Math.round(v * 100) / 100;
  const MOON = CHART.find((p) => p.key === "moon")!;

  let out = "";
  out += '<defs><radialGradient id="lcbSxtHalo"><stop offset="0%" stop-color="rgba(246,235,207,0.85)"/><stop offset="38%" stop-color="rgba(240,217,159,0.32)"/><stop offset="100%" stop-color="rgba(240,217,159,0)"/></radialGradient></defs>';
  // sight lines: dashed (the searching line) + solid twin (the lock).
  // Authored endpoints = static approximation of the moon's home (upper
  // right); in motion mode the follow driver rewrites both ends per frame.
  out += '<line class="lcb-sxt-sight" x1="352" y1="-26" x2="' + S.x + '" y2="' + S.y + '" opacity="0"/>';
  out += '<line class="lcb-sxt-solid" x1="352" y1="-26" x2="' + S.x + '" y2="' + S.y + '" opacity="0.6"/>';
  // the instrument (limb arc + 36 ticks + index arm + pivot)
  out += '<g class="lcb-sxt-inst">';
  const a = pt(A0, R), b = pt(A1, R);
  out += '<path class="lcb-sxt-arc" d="M' + s(a[0]) + "," + s(a[1]) + " A" + R + "," + R + ' 0 0 1 ' + s(b[0]) + "," + s(b[1]) + '" opacity="0.6"/>';
  for (let i = 0; i <= 35; i++) {
    const ang = A0 + i * STEP;
    const maj = ang % 10 === 0;
    const o = pt(ang, R), q2 = pt(ang, maj ? R - 14 : R - 9);
    const lit = ang >= BEAR - 0.01; // authored locked state: lit up to the bearing
    const op = lit ? 0.95 : maj ? 0.6 : 0.35;
    out += '<line class="lcb-sxt-tick' + (maj ? " maj" : "") + '" data-a="' + ang + '" x1="' + s(o[0]) + '" y1="' + s(o[1]) + '" x2="' + s(q2[0]) + '" y2="' + s(q2[1]) + '" opacity="' + op + '"/>';
  }
  const armEnd = pt(BEAR, R);
  out += '<line class="lcb-sxt-arm" x1="' + P.x + '" y1="' + P.y + '" x2="' + s(armEnd[0]) + '" y2="' + s(armEnd[1]) + '" opacity="0.9"/>';
  out += '<circle class="lcb-sxt-pivot" cx="' + P.x + '" cy="' + P.y + '" r="3.2" opacity="0.9"/>';
  out += "</g>";
  // the readout: counts to the REAL chart Moon degree (never invented)
  out += '<text class="lcb-sxt-read" x="168" y="174" opacity="0.95">' + MOON.deg + "° " + pad2(MOON.min) + "'</text>";
  // the fixed star, last: it persists above the instrument's grace exit
  out += '<g class="lcb-sxt-star">';
  out += '<circle class="lcb-sxt-halo" cx="' + S.x + '" cy="' + S.y + '" r="17" fill="url(#lcbSxtHalo)" opacity="0.3"/>';
  out += '<path class="lcb-sxt-diamond" d="M128,140.5 L130.6,147.4 L137.5,150 L130.6,152.6 L128,159.5 L125.4,152.6 L118.5,150 L125.4,147.4 Z"/>';
  out += "</g>";
  return out;
}

// deterministic seeded prng for the beat-3 mote sky (positions are pure
// functions of u, so the scrub reverses for free)
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LCB_CSS = `
.lcb-root{
  --lcb-bg:#0d0a14; --lcb-deep:#070510; --lcb-lift:#100c1a;
  --lcb-gold:#f0d99f; --lcb-gold-soft:#d9be86;
  --lcb-ivory:#efe9dd; --lcb-body:#d8d0c1; --lcb-label:#b7af9f;
  --lcb-ease:cubic-bezier(.16,1,.3,1);
  position:relative;
  /* pull the passage up under the hero: the hero's dead band after the CTAs
     becomes the shared handoff window (hero copy scrubs out, beat 1 rises in) */
  margin-top:-18svh;
  /* the whole passage is narrative - nothing interactive lives in it. It
     overlaps the hero's tail (and on short heroes, the hero CTAs), so it
     must NEVER intercept a tap. */
  pointer-events:none;
  font-family:"Newsreader",Georgia,serif;font-weight:400;
  -webkit-font-smoothing:antialiased;
}

/* ---- fixed graded night stage (behind the beats) ---- */
.lcb-back{position:fixed;inset:0;z-index:1;overflow:hidden;pointer-events:none;opacity:0;will-change:opacity}
.lcb-front{position:fixed;inset:0;z-index:3;pointer-events:none;opacity:0;will-change:opacity}

.lcb-sky{position:absolute;inset:0;background:linear-gradient(180deg,var(--lcb-deep) 0%,var(--lcb-bg) 48%,var(--lcb-lift) 100%)}
/* ONE SKY, DAWN GRADE - the same night, graded by scroll. Violet lifts at the
   reveal; a bottom-anchored gold horizon (never above 25% alpha) rises behind
   checkout. Both are composited opacity layers, never repainted gradients. */
.lcb-sky-violet{position:absolute;inset:0;opacity:0;will-change:opacity;
  background:linear-gradient(180deg,#0b0813 0%,#16111e 56%,#1b1526 100%)}
.lcb-dawn-horizon{position:absolute;inset:0;opacity:0;will-change:opacity;mix-blend-mode:screen;
  background:radial-gradient(ellipse 130% 48% at 50% 108%, rgba(196,162,101,0.21) 0%, rgba(196,162,101,0.10) 36%, rgba(196,162,101,0.035) 58%, rgba(196,162,101,0) 76%)}
.lcb-canvas-wrap{position:absolute;inset:-8% -6%;will-change:transform}
.lcb-canvas{position:absolute;inset:0;width:100%;height:100%;will-change:transform}

/* the moon: real photo, feathered, one cool bloom. Four transform wrappers so
   travel / pointer / arrival never fight. */
.lcb-moon-travel{position:absolute;inset:0;will-change:transform}
.lcb-moon-b4{position:absolute;inset:0;will-change:transform}
.lcb-moon-pt{position:absolute;inset:0;will-change:transform}
.lcb-moon{position:absolute;top:-6%;right:-8%;width:min(32vw,258px);aspect-ratio:1;will-change:transform}
.lcb-moon-bloom{position:absolute;inset:-62%;border-radius:50%;pointer-events:none;mix-blend-mode:screen;
  background:radial-gradient(circle, rgba(150,160,210,0.20) 0%, rgba(150,160,210,0.09) 20%, rgba(150,160,210,0.03) 45%, rgba(150,160,210,0) 72%)}
.lcb-moon-bloom-gold{position:absolute;inset:-62%;border-radius:50%;pointer-events:none;mix-blend-mode:screen;opacity:0;
  background:radial-gradient(circle, rgba(214,178,107,0.22) 0%, rgba(214,178,107,0.10) 22%, rgba(214,178,107,0.035) 46%, rgba(214,178,107,0) 72%)}
.lcb-moon-disc{position:absolute;inset:0;border-radius:50%;
  -webkit-mask-image:radial-gradient(circle, #000 93%, rgba(0,0,0,0) 100%);
  mask-image:radial-gradient(circle, #000 93%, rgba(0,0,0,0) 100%)}
.lcb-moon-img{position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:cover;transform:scale(1.06);
  filter:saturate(0.82) contrast(0.94) brightness(0.98)}
.lcb-moon-img.blur{filter:saturate(0.8) contrast(0.92) brightness(0.98)}
/* the SAME real moon photo, warmed: cold grey crossfades to gold as it becomes
   their Sun descending behind checkout. Static filter, opacity-only tween. */
.lcb-moon-img.gold{opacity:0;filter:sepia(0.55) saturate(1.45) hue-rotate(-12deg) brightness(1.06) contrast(0.95)}
/* BEAT 1 earthshine: pre-baked radial gradient on the dark limb - the part
   you cannot see is still facing you. Opacity-only, no live filters. */
.lcb-earthshine{position:absolute;inset:0;border-radius:50%;pointer-events:none;mix-blend-mode:screen;opacity:0;
  background:radial-gradient(circle at 70% 76%, rgba(172,182,218,0.22) 0%, rgba(152,162,205,0.11) 36%, rgba(152,162,205,0) 64%)}
.lcb-moon-grade{position:absolute;inset:0;border-radius:50%;pointer-events:none;mix-blend-mode:multiply;
  background:radial-gradient(circle at 50% 54%, rgba(13,10,20,0) 56%, rgba(13,10,20,0.55) 100%),
    linear-gradient(180deg, rgba(120,132,180,0.05), rgba(13,10,20,0.12))}
.lcb-moon-term{position:absolute;inset:0;border-radius:50%;pointer-events:none;mix-blend-mode:soft-light;
  background:radial-gradient(circle at 33% 28%, rgba(214,222,255,0.12) 0%, rgba(0,0,0,0) 44%),
    radial-gradient(circle at 72% 78%, rgba(6,6,16,0.44) 0%, rgba(0,0,0,0) 64%)}
.lcb-moon-rim{position:absolute;inset:0;border-radius:50%;pointer-events:none;mix-blend-mode:screen;
  background:radial-gradient(circle, rgba(0,0,0,0) 84%, rgba(168,180,224,0.22) 91%, rgba(0,0,0,0) 99%)}
/* BEAT 4: the 40-degree arc that draws on the moon's lower limb, then
   detaches as the traveling ring */
.lcb-moonarc{position:absolute;inset:0;overflow:visible;pointer-events:none}
.lcb-moonarc circle{fill:none;stroke:var(--lcb-gold);stroke-width:1.4;opacity:0}

/* BEAT 4: the traveling seal ring - lives on the fixed stage (z1) so it can
   cross the beat/form seam and dock onto the form's crest */
.lcb-seal-travel{position:absolute;left:0;top:0;width:min(88vw,470px);aspect-ratio:1;opacity:0;
  pointer-events:none;will-change:transform}
.lcb-seal-svg{display:block;width:100%;height:100%;overflow:visible}
.lcb-seal-arc{fill:none;stroke:var(--lcb-gold);stroke-width:1.3;opacity:.9}
.lcb-seal-rim{fill:none;stroke:var(--lcb-gold-soft);stroke-width:1}
.lcb-seal-rimA{opacity:.85}
.lcb-seal-rimB{opacity:.45}
.lcb-seal-deg{fill:none;stroke:var(--lcb-gold-soft);stroke-width:5;stroke-dasharray:1 10.5;opacity:.55}
.lcb-seal-spoke{stroke:var(--lcb-gold-soft);stroke-width:1;opacity:.4}
.lcb-seal-hub{fill:var(--lcb-gold);opacity:0}
.lcb-seal-ascdot{fill:#f6ebcf;opacity:0;filter:drop-shadow(0 0 5px rgba(240,217,159,0.85))}

.lcb-grade{position:absolute;inset:0;pointer-events:none;mix-blend-mode:soft-light;
  background:linear-gradient(158deg, rgba(20,18,46,0.5) 0%, rgba(120,126,180,0.08) 55%, rgba(201,199,252,0.10) 100%)}

/* framing overlays (above the beats) */
.lcb-veil{position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(180deg, rgba(7,5,14,0.5) 0%, rgba(7,5,14,0) 22%, rgba(7,5,14,0) 74%, rgba(7,5,14,0.55) 100%)}
.lcb-vignette{position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(ellipse at 50% 42%, transparent 38%, rgba(5,4,12,0.6) 100%)}
.lcb-grain{position:absolute;inset:0;pointer-events:none;opacity:.036;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.lcb-focus{position:absolute;inset:0;pointer-events:none;opacity:0;
  background:radial-gradient(ellipse at 50% 46%, transparent 28%, rgba(4,3,10,0.6) 82%)}
.lcb-lift{position:absolute;inset:0;pointer-events:none;opacity:0;mix-blend-mode:screen;
  background:radial-gradient(ellipse at 50% 44%, rgba(150,152,205,0.16) 0%, rgba(120,124,180,0.05) 42%, transparent 66%)}

/* ---- beats layer ---- */
/* perspective for the camera-tilt handoffs: leaving a beat reads as tilting
   your head to the next patch of sky (transform-only, scrubbed) */
/* pointer-events none: the beats are pure narrative (no interactive element
   lives in them), and beat 1 overlaps the hero's tail - it must never eat a
   tap meant for the hero CTAs. */
.lcb-beats{position:relative;z-index:2;perspective:1100px;pointer-events:none}
/* 88svh + px-capped padding: tall phones stop inflating dead air */
.lcb-scene{position:relative;min-height:88svh;display:flex;flex-direction:column;justify-content:center;align-items:center;
  padding:clamp(56px,10svh,112px) clamp(24px,7vw,80px);text-align:center;gap:clamp(20px,3.6vw,34px);overflow:hidden}
/* per-beat heights: the sextant keeps a full stage; the crossing holds only what it needs */
.lcb-chart-scene{min-height:100svh}
.lcb-souls-scene{min-height:64svh}
/* overlap zones: each beat's exit shares 14svh with the next beat's entrance */
.lcb-chart-scene,.lcb-souls-scene,.lcb-payoff{margin-top:-14svh}

/* type: Fraunces display + Newsreader body. Every line rises out of an
   overflow:hidden mask. Body stays solid #d8d0c1 weight 400 - no blur. */
.lcb-beat{position:relative;margin:0;max-width:19ch;
  font-family:"Fraunces",Georgia,serif;font-weight:400;font-optical-sizing:auto;
  font-size:clamp(2.05rem,1.5rem + 2.5vw,3.5rem);line-height:1.1;
  letter-spacing:-0.021em;color:var(--lcb-ivory);text-wrap:balance;
  text-shadow:0 1px 26px rgba(4,3,10,0.5)}
.lcb-beat.lcb-support{font-family:"Newsreader",Georgia,serif;font-weight:400;font-optical-sizing:auto;
  font-size:clamp(1.24rem,1.02rem + 1.7vw,1.7rem);line-height:1.6;max-width:30ch;
  color:var(--lcb-body);letter-spacing:.004em;text-wrap:pretty;text-shadow:0 1px 18px rgba(4,3,10,0.42)}
.lcb-open .lcb-beat:not(.lcb-support){font-weight:400;font-size:clamp(2.35rem,1.6rem + 3.4vw,4rem);
  max-width:15ch;letter-spacing:-0.026em;line-height:1.05;text-shadow:0 2px 34px rgba(4,3,10,0.55)}
.lcb-emph{color:var(--lcb-ivory)}
.lcb-it{font-style:italic;font-weight:400}

/* the mask line: word / line units live inside overflow:hidden so they rise
   out of it. Small vertical breathing room so descenders never clip at rest. */
.lcb-ln{display:block;overflow:hidden;padding-block:0.09em;margin-block:-0.09em}
.lcb-ln + .lcb-ln{margin-top:.42em}
.lcb-support .lcb-ln + .lcb-ln{margin-top:.24em}
.lcb-wd{display:inline-block;will-change:transform}
.lcb-i{display:block;will-change:transform}

/* one word ignites gold when the chart names it */
.lcb-ignite{background:linear-gradient(100deg,var(--lcb-ivory) 0%,var(--lcb-ivory) 38%,var(--lcb-gold) 50%,var(--lcb-ivory) 62%,var(--lcb-ivory) 100%);
  background-size:250% 100%;background-position:120% 0;
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent}
.lcb-pivot-body.igniting .lcb-ignite{animation:lcbIgnite 2s var(--lcb-ease) forwards}
@keyframes lcbIgnite{0%{background-position:120% 0}60%{background-position:0 0}100%{background-position:-42% 0}}
.lcb-motion .lcb-souls-text .lcb-ln{opacity:0}

/* BEAT 1 - the sky replies: a low pool of light, one meteor, stillness */
.lcb-dawn{position:absolute;left:50%;bottom:15%;width:min(120vw,940px);height:60vh;z-index:0;
  transform:translate(-50%,18%);opacity:0;pointer-events:none;
  background:radial-gradient(ellipse 52% 40% at 50% 66%, rgba(126,116,158,0.17) 0%, rgba(72,66,112,0.07) 38%, rgba(72,66,112,0) 76%)}
/* the meteor: head dot + gradient streak, glow baked into the gradients
   (no drop-shadow, no live filters). One wrapper, transform-only. */
.lcb-meteor{position:absolute;top:24%;left:4%;width:0;height:0;z-index:0;opacity:0;pointer-events:none;will-change:transform}
.lcb-meteor-streak{position:absolute;left:-120px;top:-1px;width:120px;height:2px;border-radius:2px;will-change:transform;
  background:linear-gradient(90deg, rgba(246,235,207,0) 0%, rgba(246,235,207,0.10) 34%, rgba(246,235,207,0.4) 72%, rgba(255,250,240,0.9) 96%, rgba(255,253,247,0.95) 100%)}
.lcb-meteor-head{position:absolute;left:-3.5px;top:-3.5px;width:7px;height:7px;border-radius:50%;
  background:radial-gradient(circle, rgba(255,252,244,0.95) 0%, rgba(246,235,207,0.5) 42%, rgba(246,235,207,0) 72%)}

/* BEAT 2 - the sextant: thin hairlines, one instrument, one star */
.lcb-sxt{position:relative;display:block;width:min(86vw,438px);aspect-ratio:390/480;height:auto;
  margin-bottom:clamp(26px,5vw,46px);overflow:visible}
.lcb-sxt line,.lcb-sxt path{vector-effect:non-scaling-stroke}
.lcb-sxt-sight{stroke:rgba(239,233,221,0.55);stroke-width:1;stroke-dasharray:4 7;stroke-linecap:round}
.lcb-sxt-solid{stroke:rgba(240,217,159,0.65);stroke-width:1;stroke-linecap:round}
.lcb-sxt-arc{fill:none;stroke:var(--lcb-gold-soft);stroke-width:1;stroke-linecap:round}
.lcb-sxt-tick{stroke:var(--lcb-gold-soft);stroke-width:1;stroke-linecap:round}
.lcb-sxt-arm{stroke:var(--lcb-gold);stroke-width:1.2;stroke-linecap:round}
.lcb-sxt-pivot{fill:var(--lcb-gold)}
.lcb-sxt-diamond{fill:#f6ebcf}
.lcb-sxt-read{fill:var(--lcb-label);font-family:"Newsreader",Georgia,serif;font-weight:400;font-size:13px;letter-spacing:.04em}

.lcb-pivot-lead{margin:0 auto;font-family:"Fraunces",Georgia,serif;font-weight:400;font-optical-sizing:auto;
  color:var(--lcb-ivory);font-size:clamp(1.78rem,1.25rem + 2.5vw,2.7rem);line-height:1.14;
  letter-spacing:-0.018em;max-width:21ch;text-wrap:balance;text-shadow:0 1px 26px rgba(4,3,10,0.5)}
.lcb-chart-scene .lcb-pivot-lead{margin-bottom:clamp(24px,5vw,44px)}
.lcb-pivot-body{margin:clamp(20px,4vw,30px) auto 0;font-family:"Newsreader",Georgia,serif;font-weight:400;
  font-optical-sizing:auto;color:var(--lcb-body);font-size:clamp(1.16rem,1rem + 1.4vw,1.48rem);
  line-height:1.58;max-width:32ch;text-wrap:pretty;text-shadow:0 1px 18px rgba(4,3,10,0.42)}

/* BEAT 3 - out of everything: mote sky, two souls, the moonbeam */
.lcb-souls-hold{position:relative;width:min(96vw,520px);height:34svh;max-height:320px;margin-bottom:clamp(8px,3vw,26px)}
.lcb-cross-sky{position:absolute;inset:0;width:100%;height:100%}
.lcb-cross-zoom{position:absolute;inset:0;will-change:transform}
.lcb-souls-svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.lcb-arc{fill:none;stroke:var(--lcb-gold-soft);stroke-width:1.1;vector-effect:non-scaling-stroke;stroke-linecap:round;opacity:.5}
.lcb-arc-human{stroke:var(--lcb-ivory);opacity:.42}
.lcb-thread{fill:none;stroke:var(--lcb-gold);stroke-width:1.5;vector-effect:non-scaling-stroke;stroke-linecap:round;opacity:.85;
  filter:drop-shadow(0 0 4px rgba(240,217,159,0.4))}
.lcb-head{opacity:0}
.lcb-head-pet{fill:#f6ebcf;filter:drop-shadow(0 0 3px rgba(240,217,159,0.9)) drop-shadow(0 0 9px rgba(240,217,159,0.45)) drop-shadow(0 0 20px rgba(214,190,134,0.22))}
.lcb-head-human{fill:#f4f0e6;filter:drop-shadow(0 0 3px rgba(239,233,221,0.9)) drop-shadow(0 0 9px rgba(206,214,242,0.45)) drop-shadow(0 0 20px rgba(150,160,210,0.22))}
.lcb-head-one{fill:#f4ecdb;filter:drop-shadow(0 0 4px rgba(244,236,219,0.95)) drop-shadow(0 0 12px rgba(240,217,159,0.5)) drop-shadow(0 0 26px rgba(214,190,134,0.24))}
/* the moonbeam: one static linear-gradient shaft, bright at the meeting
   point, near-transparent toward the moon (so the scene edge never shows
   a hard cut). Rotation computed once per refresh. Transform/opacity only. */
.lcb-beam{position:absolute;left:0;top:0;width:74px;height:400px;opacity:0;pointer-events:none;mix-blend-mode:screen;
  transform-origin:50% 0;will-change:transform;
  background:linear-gradient(180deg, rgba(240,217,159,0) 0%, rgba(240,217,159,0.02) 44%, rgba(240,217,159,0.10) 72%, rgba(240,217,159,0.22) 92%, rgba(240,217,159,0.30) 100%);
  -webkit-mask-image:linear-gradient(90deg, transparent 0%, #000 30%, #000 70%, transparent 100%);
  mask-image:linear-gradient(90deg, transparent 0%, #000 30%, #000 70%, transparent 100%)}
/* the iris: the one play-once accent of the crossing */
.lcb-iris{position:absolute;left:0;top:0;width:120px;height:120px;margin:-60px 0 0 -60px;border-radius:50%;opacity:0;
  pointer-events:none;mix-blend-mode:screen;will-change:transform;
  background:radial-gradient(circle, rgba(255,246,222,0.55) 0%, rgba(240,217,159,0.28) 36%, rgba(240,217,159,0) 70%)}
.lcb-souls-text .lcb-ln{will-change:transform,opacity}

/* BEAT 4 - the seal is cast: text over open sky; the unset chart rides the
   fixed stage behind it. Each text band carries its own soft night scrim so
   the ring visibly dims beneath the words and re-brightens between them. */
.lcb-payoff-scene .lcb-payoff-line,
.lcb-payoff-scene .lcb-beat.lcb-support{position:relative;z-index:1}
.lcb-payoff-scene .lcb-payoff-line::before,
.lcb-payoff-scene .lcb-beat.lcb-support::before{
  content:"";position:absolute;z-index:-1;pointer-events:none;
  inset:-16px -26px;border-radius:26px;
  background:rgba(10,8,17,0.55);
  filter:blur(15px)}
/* the passage ends where the form begins: no dead sky after the gold rule */
.lcb-scene.lcb-payoff{min-height:auto;padding-bottom:clamp(40px,7svh,68px)}
.lcb-payoff-line{position:relative;z-index:1;margin:0;font-family:"Fraunces",Georgia,serif;font-weight:400;font-optical-sizing:auto;
  color:var(--lcb-ivory);font-size:clamp(2.05rem,1.4rem + 3.1vw,3.5rem);line-height:1.16;
  letter-spacing:-0.02em;max-width:17ch;text-wrap:balance;text-shadow:0 1px 26px rgba(4,3,10,0.5)}
.lcb-asc{display:inline-block;font-weight:500;letter-spacing:-0.008em;color:var(--lcb-gold);
  text-shadow:0 0 0 rgba(240,217,159,0)}
.lcb-asc.lit{animation:lcbAscBreath 7.5s var(--lcb-ease) 1.1s infinite}
@keyframes lcbAscBreath{
  0%{text-shadow:0 0 8px rgba(240,217,159,0.30), 0 0 20px rgba(240,217,159,0.16), 0 0 44px rgba(214,190,134,0.09)}
  38%{text-shadow:0 0 10px rgba(240,217,159,0.36), 0 0 26px rgba(240,217,159,0.19), 0 0 54px rgba(214,190,134,0.11)}
  63%{text-shadow:0 0 9px rgba(240,217,159,0.32), 0 0 22px rgba(240,217,159,0.17), 0 0 48px rgba(214,190,134,0.10)}
  100%{text-shadow:0 0 8px rgba(240,217,159,0.30), 0 0 20px rgba(240,217,159,0.16), 0 0 44px rgba(214,190,134,0.09)}
}
.lcb-rule{display:block;width:min(46vw,220px);height:1px;margin:clamp(14px,2.6vw,24px) auto 0;
  background:linear-gradient(90deg,transparent,var(--lcb-gold-soft),transparent);
  transform:scaleX(0);transform-origin:center;opacity:.9}

@media (max-width:768px){
  .lcb-beat{font-size:clamp(1.72rem,1.2rem + 4.4vw,2.4rem)}
  .lcb-open .lcb-beat{font-size:clamp(2.05rem,1.35rem + 6vw,2.8rem)}
  .lcb-pivot-lead{font-size:clamp(1.55rem,1.15rem + 3.6vw,2.2rem)}
  .lcb-payoff-line{font-size:clamp(1.85rem,1.3rem + 4.6vw,2.7rem)}
  .lcb-moon{top:-3%;right:-7%;width:min(46vw,214px)}
  .lcb-sxt{width:min(88vw,360px)}
}
@media (prefers-reduced-motion:reduce){
  .lcb-asc.lit{animation:none}
  .lcb-pivot-body.igniting .lcb-ignite{animation:none}
}

/* ---- MEMORIAL REGISTER ----
   Same four movements in a lower voice. Scenes grow ~35% so every scrub
   span lengthens; every glow cap is multiplied by 0.7 in JS; the loud
   transients (meteor, twinkle-wave, blink, near-miss, camera plunge,
   iris, ascension, seal tilt, crest flare) never exist. */
/* the memorial passage does not dive under the section above it: the
   collapsed "Reading in remembrance" line sits there, and the headline
   must never rise into it. The seam breathes instead. */
.lcb-memorial{margin-top:-2svh}
.lcb-memorial .lcb-scene{min-height:118svh}
.lcb-memorial .lcb-chart-scene{min-height:135svh}
.lcb-memorial .lcb-souls-scene{min-height:86svh}
/* beat 1, memorial: ONE star low in frame that fades up and HOLDS -
   a state, never a burst. Pre-baked gradients, transform/opacity only. */
.lcb-memstar{position:absolute;left:20%;bottom:24%;width:44px;height:44px;z-index:0;opacity:0;pointer-events:none;
  background:radial-gradient(circle, rgba(246,235,207,0.85) 0%, rgba(246,235,207,0.4) 10%, rgba(240,217,159,0.16) 30%, rgba(240,217,159,0) 62%)}
`;

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

// 0..1 window helper: where is u inside [a,b]
const seg = (u: number, a: number, b: number) => Math.max(0, Math.min(1, (u - a) / (b - a)));

export function CosmicBridge() {
  const rootRef = useRef<HTMLElement>(null);

  // The register: discovery (default) or memorial. The fork / URL intent
  // drives it live via the ls-intent event; a register change remounts the
  // whole section (key below) and rebuilds every timeline from scratch.
  const [register, setRegister] = useState<"discovery" | "memorial">(() =>
    getIntent() === "memorial" ? "memorial" : "discovery");
  useEffect(() => {
    const onIntent = () => setRegister(getIntent() === "memorial" ? "memorial" : "discovery");
    window.addEventListener(INTENT_EVENT, onIntent);
    return () => window.removeEventListener(INTENT_EVENT, onIntent);
  }, []);
  const memorial = register === "memorial";

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === "undefined") return;

    const q = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = root) => scope.querySelector<T>(sel);
    const qa = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = root) => Array.from(scope.querySelectorAll<T>(sel));
    const pad2 = (n: number) => (n < 10 ? "0" : "") + n;
    const mode = { motion: false };
    // memorial register: every glow opacity cap multiplied by 0.7; the
    // loud transients are simply never built (flags per the build spec).
    const hush = register === "memorial";
    const glow = (v: number) => (hush ? Math.round(v * 0.7 * 1000) / 1000 : v);

    // ---------- build the sextant (authored in its locked final state) ----------
    const sxt = q<SVGSVGElement>(".lcb-sxt");
    if (sxt) sxt.innerHTML = buildSextant();

    // ---------- prep the mask reveals (wrap once, never per breakpoint) ----------
    // display beats -> per-word rise; support/body -> per-line rise.
    qa(".lcb-split .lcb-ln").forEach((ln) => {
      const frag = document.createDocumentFragment();
      Array.from(ln.childNodes).forEach((node) => {
        if (node.nodeType !== Node.TEXT_NODE) {
          if (node instanceof HTMLElement) node.classList.add("lcb-wd");
          frag.appendChild(node); return;
        }
        (node.textContent || "").split(/(\s+)/).forEach((tok) => {
          if (tok === "") return;
          if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); return; }
          const w = document.createElement("span"); w.className = "lcb-wd"; w.textContent = tok; frag.appendChild(w);
        });
      });
      ln.replaceChildren(frag);
    });
    qa(".lcb-linemask .lcb-ln").forEach((ln) => {
      const inner = document.createElement("span"); inner.className = "lcb-i";
      while (ln.firstChild) inner.appendChild(ln.firstChild);
      ln.appendChild(inner);
    });

    const allWords = qa(".lcb-split .lcb-wd");
    const allInners = qa(".lcb-linemask .lcb-i");

    // ---------- honest magnitude-scaled canvas starfield (banded) ----------
    // BEAT 1 extension: the twinkle-wave. tw.t sweeps a flare ring outward
    // from the meteor's splash point; tw.damp freezes the twinkle flat when
    // the sky takes the weight. Redraws happen ONLY inside those two scrub
    // windows plus ScrollTrigger refreshes.
    const tw = { t: -1, damp: 0, vx: 0, vy: 0 };
    const canvas = q<HTMLCanvasElement>(".lcb-canvas");
    const canvasWrap = q(".lcb-canvas-wrap");
    let drawStars = () => {};
    if (canvas) {
      const ctxc = canvas.getContext("2d");
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const tints = [
        [255, 250, 244], [255, 250, 244], [255, 250, 244], [248, 245, 255],
        [214, 224, 255], [255, 241, 214], [255, 232, 198],
      ];
      let stars: { x: number; y: number; r: number; a: number; c: number[] }[] = [];
      const buildField = (w: number, h: number) => {
        const mobile = w < 768;
        const n = Math.min(160, mobile ? 62 : 132);
        const bx = 0.62 * w, by = 0.16 * h, ang = -0.62, dirx = Math.cos(ang), diry = Math.sin(ang);
        const arr: typeof stars = [];
        for (let i = 0; i < n; i++) {
          let x: number, y: number;
          if (Math.random() < 0.46) {
            const along = (Math.random() - 0.5) * Math.hypot(w, h) * 1.2;
            const across = (Math.random() - 0.5) * h * 0.34 + (Math.random() - 0.5) * h * 0.16;
            x = bx + dirx * along - diry * across; y = by + diry * along + dirx * across;
          } else { x = Math.random() * w; y = Math.random() * h; }
          if (x < -20 || x > w + 20 || y < -20 || y > h + 20) { i--; continue; }
          const m = 1.4 + Math.pow(Math.random(), 0.6) * 4.6;         // magnitude
          const bright = Math.pow(2.512, -(m - 1.4));                 // Pogson
          const r = (0.5 + bright * 1.5) * dpr;
          const a = Math.min(0.95, 0.14 + bright * 0.82);
          const c = tints[(Math.random() * tints.length) | 0];
          arr.push({ x: x * dpr, y: y * dpr, r, a, c });
        }
        stars = arr;
      };
      drawStars = () => {
        if (!ctxc) return;
        const rect = canvas.getBoundingClientRect();
        const w = Math.max(1, Math.round(rect.width)), h = Math.max(1, Math.round(rect.height));
        if (canvas.width !== w * dpr || canvas.height !== h * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; buildField(w, h); }
        ctxc.clearRect(0, 0, canvas.width, canvas.height);
        const bx = 0.62 * w * dpr, by = 0.16 * h * dpr;
        const g = ctxc.createRadialGradient(bx, by, 0, bx, by, Math.hypot(w, h) * dpr * 0.7);
        g.addColorStop(0, "rgba(120,126,180,0.05)");
        g.addColorStop(0.4, "rgba(90,96,150,0.03)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctxc.fillStyle = g; ctxc.fillRect(0, 0, canvas.width, canvas.height);
        // twinkle-wave params (viewport -> bitmap coords)
        const waveOn = tw.t > 0 && tw.t < 1 && tw.damp < 1;
        const fx = (tw.vx - rect.left) * dpr, fy = (tw.vy - rect.top) * dpr;
        const maxR = Math.hypot(canvas.width, canvas.height) * 0.8;
        const sig = 90 * dpr;
        const amp = waveOn ? 0.5 * Math.min(1, tw.t * 5) * (1 - 0.5 * tw.t) * (1 - tw.damp) : 0;
        for (const st of stars) {
          let a = st.a, r = st.r;
          if (amp > 0.004) {
            const dd = Math.abs(Math.hypot(st.x - fx, st.y - fy) - tw.t * maxR);
            const fall = Math.exp(-(dd * dd) / (2 * sig * sig));
            a = Math.min(1, a * (1 + 2 * amp * fall));
            r = st.r * (1 + 0.6 * amp * fall);
          }
          if (tw.damp > 0) a *= 1 - 0.13 * tw.damp;
          ctxc.beginPath();
          ctxc.fillStyle = `rgba(${st.c[0]},${st.c[1]},${st.c[2]},${a})`;
          ctxc.arc(st.x, st.y, r, 0, Math.PI * 2); ctxc.fill();
        }
      };
      drawStars();
    }

    // ---------- stage refs (opacity driven from the one ScrollTrigger clock) ----------
    const back = q(".lcb-back");
    const front = q(".lcb-front");
    const moonPt = q(".lcb-moon-pt");
    const travel = q(".lcb-moon-travel");
    const moonEl = q(".lcb-moon");

    // ---------- helpers ----------
    const samplePath = (path: SVGGeometryElement, n = 140) => {
      const len = path.getTotalLength();
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i <= n; i++) { const p = path.getPointAtLength((len * i) / n); pts.push({ x: p.x, y: p.y }); }
      return pts;
    };
    const atT = (pts: { x: number; y: number }[], t: number) => {
      const f = Math.max(0, Math.min(1, t)) * (pts.length - 1);
      const i = Math.floor(f), fr = f - i, a = pts[i], b = pts[Math.min(pts.length - 1, i + 1)];
      return { x: a.x + (b.x - a.x) * fr, y: a.y + (b.y - a.y) * fr };
    };
    const primeDraw = (els: SVGGeometryElement[]) => els.forEach((el) => {
      const len = el.getTotalLength ? el.getTotalLength() : 300;
      el.style.strokeDasharray = String(len); el.style.strokeDashoffset = String(len);
    });
    const gp = (el: Element | null, prop: string) => (el ? Number(gsap.getProperty(el, prop)) || 0 : 0);

    // ---------- BEAT 2: sextant sight-line geometry (cached per refresh) ----------
    // The dashed sight-line tracks the LIVE moon: base rect cached at refresh,
    // travel transform added per frame (the moon lives on the fixed stage, so
    // its viewport position is base + travel, scroll-independent).
    const sxtGeom = { ready: false, svgLeft: 0, svgDocTop: 0, scale: 1, moonCx: 0, moonCy: 0, moonR: 0 };
    const cacheSxt = () => {
      if (!sxt || !moonEl || !travel) return;
      const r = sxt.getBoundingClientRect();
      if (!r.width) return;
      sxtGeom.svgLeft = r.left;
      sxtGeom.svgDocTop = r.top + window.scrollY;
      sxtGeom.scale = r.width / 390;
      const mr = moonEl.getBoundingClientRect();
      sxtGeom.moonCx = mr.left + mr.width / 2 - gp(travel, "x");
      sxtGeom.moonCy = mr.top + mr.height / 2 - gp(travel, "y");
      sxtGeom.moonR = mr.width / 2;
      sxtGeom.ready = true;
    };

    // ---------- BEAT 3: mote sky canvas + beam geometry (cached per refresh) ----------
    const crossCanvas = q<HTMLCanvasElement>(".lcb-cross-sky");
    const crossCtx = crossCanvas ? crossCanvas.getContext("2d") : null;
    type Mote = { sx: number; sy: number; vx: number; vy: number; r: number; a: number; c: string };
    const cross = {
      w: 0, h: 0, dpr: 1, mp: { x: 0, y: 0 }, dir: { x: 0, y: -1 },
      motes: [] as Mote[], lift: 0, lastU: 0,
    };
    // memorial: no camera plunge - one gentle push (1.0 -> 1.06) across the
    // whole holding, HOUSE eased. Discovery keeps the two-stage plunge.
    const zOf = (u: number) => hush
      ? 1 + 0.06 * HOUSE(seg(u, 0.13, 0.95))
      : 1 + 0.35 * HOUSE(seg(u, 0.13, 0.30)) + 0.35 * HOUSE(seg(u, 0.31, 0.55)) - 0.2 * HOUSE(seg(u, 0.95, 1));
    const crossDraw = (u: number) => {
      if (!crossCtx || !crossCanvas || !cross.w) return;
      cross.lastU = u;
      const { w, h, dpr, mp } = cross;
      crossCtx.setTransform(1, 0, 0, 1, 0, 0);
      crossCtx.clearRect(0, 0, crossCanvas.width, crossCanvas.height);
      const gaRaw = (u <= 0.10 ? 0.5 * (u / 0.10)
        : u <= 0.13 ? 0.5
        : u <= 0.30 ? 0.5 - 0.25 * ((u - 0.13) / 0.17)
        : u <= 0.31 ? 0.25
        : u <= 0.55 ? 0.25 - 0.13 * ((u - 0.31) / 0.24)
        : 0.12) + cross.lift;
      // memorial mote sky is capped at 0.3 alpha - faint by law
      const ga = hush ? Math.min(gaRaw, 0.3) : gaRaw;
      const z = zOf(u);
      crossCtx.setTransform(dpr * z, 0, 0, dpr * z, dpr * mp.x * (1 - z), dpr * mp.y * (1 - z));
      const ms = hush ? 1 : 1 + 0.5 * seg(u, 0.13, 0.30);
      for (const m of cross.motes) {
        const x = m.sx + m.vx * u, y = m.sy + m.vy * u;
        if (x < -40 || x > w + 40 || y < -40 || y > h + 40) continue;
        crossCtx.beginPath();
        crossCtx.fillStyle = "rgba(" + m.c + "," + Math.min(1, ga * m.a).toFixed(3) + ")";
        crossCtx.arc(x, y, m.r * ms, 0, Math.PI * 2);
        crossCtx.fill();
      }
    };
    const sizeCrossSky = () => {
      const hold = q(".lcb-souls-hold");
      const zoom = q(".lcb-cross-zoom");
      const beam = q(".lcb-beam");
      const irisE = q(".lcb-iris");
      const threadE = q<SVGLineElement>(".lcb-thread");
      if (!hold || !crossCanvas || !crossCtx) return;
      const rect = hold.getBoundingClientRect();
      if (!rect.width) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = rect.width, h = rect.height;
      const W = window.innerWidth, H = window.innerHeight;
      const mob = W < 769, amp = mob ? 0.55 : 1;
      // the meeting point: svg 400x300, preserveAspectRatio meet, point (200,178)
      const sc = Math.min(w / 400, h / 300);
      const mp = { x: (w - 400 * sc) / 2 + 200 * sc, y: (h - 300 * sc) / 2 + 178 * sc };
      cross.mp = mp;
      if (crossCanvas.width !== Math.round(w * dpr) || crossCanvas.height !== Math.round(h * dpr)) {
        crossCanvas.width = Math.round(w * dpr);
        crossCanvas.height = Math.round(h * dpr);
        // reseed: positions are pure functions of u (straight paths)
        const rng = mulberry32(16180);
        // memorial: half density, and the authored near-miss pair never exists
        const n = hush ? (mob ? 24 : 32) : mob ? 44 : 66;
        const motes: Mote[] = [];
        // the authored near-miss pair: both pass the centre at u=0.115, 8px apart
        const mkPass = (ang: number, spd: number, perp: number): Mote => {
          const dx = Math.cos(ang), dy = Math.sin(ang);
          const px = -dy * perp, py = dx * perp;
          return {
            sx: mp.x + px - dx * spd * 0.115, sy: mp.y + py - dy * spd * 0.115,
            vx: dx * spd, vy: dy * spd, r: 1.5, a: 0.9, c: "246,240,226",
          };
        };
        if (!hush) {
          motes.push(mkPass((-20 * Math.PI) / 180, 0.85 * w, 4));
          motes.push(mkPass((-115 * Math.PI) / 180, 0.8 * w, -4));
        }
        for (let i = motes.length; i < n; i++) {
          const x0 = rng() * w, y0 = rng() * h;
          const ang = rng() * Math.PI * 2;
          const spd = (0.3 + rng() * 0.5) * w;
          const cool = rng() < 0.3;
          motes.push({
            sx: x0 - Math.cos(ang) * spd * 0.5, sy: y0 - Math.sin(ang) * spd * 0.5,
            vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
            r: 0.5 + rng() * 0.9, a: 0.3 + rng() * 0.6,
            c: cool ? "216,224,250" : "246,240,226",
          });
        }
        cross.motes = motes;
      }
      cross.w = w; cross.h = h; cross.dpr = dpr;
      // beam + thread geometry: computed ONCE per refresh from the live moon
      // rect toward the meeting point, predicted at the beat's mid-frame.
      if (moonEl && travel) {
        const scrollY = window.scrollY;
        const holdDocTop = rect.top + scrollY;
        const beatMid = holdDocTop + mp.y - 0.45 * H;
        const mr2 = moonEl.getBoundingClientRect();
        const mAtBeat = {
          x: mr2.left + mr2.width / 2 - gp(travel, "x") + -0.02 * W * amp,
          y: mr2.top + mr2.height / 2 - gp(travel, "y") + 0.02 * H * amp,
        };
        const moonLocal = { x: mAtBeat.x - rect.left, y: mAtBeat.y - (holdDocTop - beatMid) };
        const dx = mp.x - moonLocal.x, dy = mp.y - moonLocal.y;
        const L = Math.hypot(dx, dy) || 1;
        if (beam) {
          beam.style.left = moonLocal.x - 37 + "px";
          beam.style.top = moonLocal.y + "px";
          beam.style.height = L * 1.12 + "px";
          gsap.set(beam, { rotation: (Math.atan2(-dx, dy) * 180) / Math.PI, transformOrigin: "50% 0%" });
        }
        const u = { x: -dx / L, y: -dy / L }; // from the meeting point toward the moon
        cross.dir = u;
        if (threadE) {
          threadE.setAttribute("x1", "200"); threadE.setAttribute("y1", "178");
          threadE.setAttribute("x2", String(Math.round((200 + u.x * 260) * 100) / 100));
          threadE.setAttribute("y2", String(Math.round((178 + u.y * 260) * 100) / 100));
        }
      }
      if (irisE) { irisE.style.left = mp.x + "px"; irisE.style.top = mp.y + "px"; }
      if (zoom) zoom.style.transformOrigin = mp.x + "px " + mp.y + "px";
      // reduced motion: one honest static frame of the mote sky
      if (!mode.motion) crossDraw(0.62);
    };

    // ---------- BEAT 4: post-submit guard ----------
    let sealKill: (() => void) | null = null;
    const sealGuard = () => {
      if (!sealKill) return;
      if (!document.querySelector(".ls-seal-crest")) { const k = sealKill; sealKill = null; k(); }
    };

    // canvas rebuilds + geometry caches ride ScrollTrigger's own refresh cycle
    const onSTRefresh = () => { drawStars(); cacheSxt(); sizeCrossSky(); sealGuard(); };
    ScrollTrigger.addEventListener("refresh", onSTRefresh);

    // ================= ONE CLOCK =================
    // Every scroll-driven value rides gsap.matchMedia + ScrollTrigger.
    // Reduced-motion renders the honest final state of every beat and keeps
    // only opacity-only stage fades.
    const mm = gsap.matchMedia();

    const buildStory = (mobile: boolean, scrub: number) => {
      const amp = mobile ? 0.55 : 1;

      // ---- SPINE: the moon travels between beat homes (transform only) ----
      const W = window.innerWidth, H = window.innerHeight;
      if (travel) {
        gsap.timeline({ scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub } })
          .to(travel, { x: -0.15 * W * amp, y: 0.10 * H * amp, ease: HOUSE, duration: 1 })
          .to(travel, { x: -0.02 * W * amp, y: 0.02 * H * amp, ease: HOUSE, duration: 1 })
          .to(travel, { x: 0.05 * W * amp, y: -0.11 * H * amp, ease: HOUSE, duration: 1 });
      }

      // ---- SEAM 1: the hero hands into the passage. Headline + CTAs scrub
      // OUT across the shared -18svh window while beat 1 rises in; the moon
      // glides down between them (the stage's enter ramp above). ----
      const heroCopy = document.querySelector<HTMLElement>(".ls-hero-copy");
      if (heroCopy && document.querySelector(".ls-hero-section")) {
        gsap.to(heroCopy, {
          opacity: 0, y: -34 * amp, ease: "none",
          scrollTrigger: { trigger: ".ls-hero-section", start: "bottom 86%", end: "bottom 38%", scrub },
        });
      }

      // =============== BEAT 1 - THE SKY REPLIES (scroll = playhead) ===============
      // Memorial register: THE DATE CHANGED. The moon arrives sharp slowly
      // and carries earthshine as a persistent STATE from the start (the
      // part you cannot see still faces you). No meteor, no twinkle-wave,
      // no blink. Line 1 = the dawn pool rises slower (the returning
      // light); line 2 = ONE star fades up low and HOLDS; line 3 = the
      // full settle event - everything comes to rest.
      const open = q(".lcb-open");
      if (open) {
        const words = qa(".lcb-wd", open);
        const support = qa(".lcb-support .lcb-i", open);
        const dawn = q(".lcb-dawn", open);
        const meteor = q(".lcb-meteor", open);
        const streak = q(".lcb-meteor-streak", open);
        const memstar = q(".lcb-memstar", open);
        const earthshine = q(".lcb-earthshine");
        const rim = q(".lcb-moon-rim");
        const bloom = q(".lcb-moon-bloom");
        const goldImg = q(".lcb-moon-img.gold");
        gsap.set(dawn, { opacity: 0, yPercent: 18 });
        if (streak) gsap.set(streak, { rotation: -18, scaleX: 0.4, transformOrigin: "100% 50%" });
        if (rim) gsap.set(rim, { opacity: 0.6 });
        // the splash point the twinkle-wave radiates from = the meteor's end
        tw.vx = 0.61 * W; tw.vy = 0.21 * H;

        const t1 = gsap.timeline({ scrollTrigger: { trigger: open, start: "top 82%", end: "bottom 42%", scrub } });
        // arrival spine: blur-to-sharp + settle + headline words. Memorial
        // arrives slower, earthshine + rim riding the same arrival ramp.
        const arriveDur = hush ? 1.5 : 1.1;
        t1.to(q(".lcb-moon-img.blur"), { opacity: 0, ease: "none", duration: arriveDur }, 0)
          .to(q(".lcb-moon-img.sharp"), { opacity: 1, ease: "none", duration: arriveDur }, 0)
          .fromTo(q(".lcb-moon"), { y: 14, scale: 1.04 }, { y: 0, scale: 1.0, ease: HOUSE, duration: hush ? 1.7 : 1.3 }, 0)
          .to(words, { yPercent: 0, opacity: 1, ease: HOUSE, duration: 0.9, stagger: 0.12 }, 0.35);
        if (hush) {
          if (earthshine) t1.to(earthshine, { opacity: glow(0.35), duration: arriveDur, ease: "none" }, 0);
          if (rim) t1.to(rim, { opacity: glow(1), duration: arriveDur, ease: "none" }, 0);
          if (goldImg) t1.to(goldImg, { opacity: glow(0.18), duration: arriveDur, ease: "none" }, 0);
        } else {
          t1.to(dawn, { opacity: 1, yPercent: 0, ease: HOUSE, duration: 1.6 }, 0.1);
        }
        // the three support lines keep their exact clock
        const igniteAt = [1.15, 1.95, 2.75];
        support.forEach((ln, i) => t1.to(ln, { yPercent: 0, opacity: 1, ease: HOUSE, duration: 0.8 }, igniteAt[i]));
        if (hush) {
          // "The light came through the window again." - the dawn pool
          // rises, slower (the returning light)
          t1.to(dawn, { opacity: glow(1), yPercent: 0, ease: HOUSE, duration: 1.9 }, 1.15);
          // "The place they slept still has a name in your mind." - ONE
          // star fades up low in frame and HOLDS. A state, never a burst.
          if (memstar) t1.to(memstar, { opacity: 0.8, duration: 0.9, ease: HOUSE }, 1.95);
          // "You notice the silence before you notice the room." - the full
          // settle event: twinkle damps to zero, everything comes to rest.
          t1.to(q(".lcb-canvas"), { y: 6, duration: 1.1, ease: HOUSE }, 2.85)
            .to(q(".lcb-moon"), { y: 6, duration: 1.1, ease: HOUSE }, 2.85)
            .to(bloom, { opacity: glow(0.7), duration: 1.1, ease: HOUSE }, 2.85)
            .to(dawn, { opacity: glow(0.85), yPercent: 4, duration: 1.1, ease: HOUSE }, 2.85)
            .to(tw, { damp: 1, duration: 1.05, ease: HOUSE, onUpdate: drawStars }, 2.85);
        } else {
          // JOY answered: ONE meteor crosses the upper third (1.25 - 1.80)
          if (meteor && streak) {
            const mdx = 0.55 * W;
            const mdy = -Math.tan((18 * Math.PI) / 180) * 0.55 * W;
            t1.to(meteor, { opacity: 1, duration: 0.08, ease: "none" }, 1.25)
              .fromTo(meteor, { x: 0, y: 0 }, { x: mdx, y: mdy, duration: 0.55, ease: "none" }, 1.25)
              .to(streak, { scaleX: 1, duration: 0.2, ease: "none" }, 1.25)
              .to(streak, { scaleX: 0.15, duration: 0.3, ease: "none" }, 1.5)
              .to(meteor, { opacity: 0, duration: 0.19, ease: "none" }, 1.61);
          }
          // its splash rolls a twinkle-wave through the field (1.45 - 2.35)
          t1.fromTo(tw, { t: 0 }, { t: 1, duration: 0.9, ease: "none", onUpdate: drawStars }, 1.45);
          // TRUST answered: the sky takes the weight (2.00 - 2.95). Nothing new
          // appears; everything settles 6px and the twinkle freezes flat.
          // Stillness IS the event.
          t1.to(q(".lcb-canvas"), { y: 6, duration: 0.95, ease: HOUSE }, 2.0)
            .to(q(".lcb-moon"), { y: 6, duration: 0.95, ease: HOUSE }, 2.0)
            .to(bloom, { opacity: 0.7, duration: 0.95, ease: HOUSE }, 2.0)
            .to(dawn, { opacity: 0.85, yPercent: 4, duration: 0.95, ease: HOUSE }, 2.0)
            .to(tw, { damp: 1, duration: 0.9, ease: HOUSE, onUpdate: drawStars }, 2.0);
          // GAZE answered: earthshine - the part you could not see was facing
          // you (2.85 - 3.55), then the moon blinks ONCE (3.30 - 3.90).
          if (earthshine) t1.to(earthshine, { opacity: 0.35, duration: 0.7, ease: HOUSE }, 2.85);
          if (rim) t1.to(rim, { opacity: 1, duration: 0.7, ease: HOUSE }, 2.85);
          if (goldImg) t1.to(goldImg, { opacity: 0.18, duration: 0.7, ease: "none" }, 2.85);
          t1.to(bloom, { opacity: 0.4, duration: 0.3, ease: "power2.in" }, 3.3)
            .to(bloom, { opacity: 1, duration: 0.3, ease: HOUSE }, 3.6);
        }
      }

      // =============== BEAT 2 - THE SEXTANT (scroll = playhead) ===============
      const chart = q(".lcb-chart-scene");
      if (chart && sxt) {
        const lead = qa(".lcb-pivot-lead .lcb-wd", chart);
        const body = qa(".lcb-pivot-body .lcb-i", chart);
        const inst = q(".lcb-sxt-inst", sxt);
        const arcEl = q<SVGPathElement>(".lcb-sxt-arc", sxt);
        const ticks = qa<SVGLineElement>(".lcb-sxt-tick", sxt);
        const arm = q<SVGLineElement>(".lcb-sxt-arm", sxt);
        const pivot = q<SVGCircleElement>(".lcb-sxt-pivot", sxt);
        const dashed = q<SVGLineElement>(".lcb-sxt-sight", sxt);
        const solid = q<SVGLineElement>(".lcb-sxt-solid", sxt);
        const starG = q<SVGGElement>(".lcb-sxt-star", sxt);
        const halo = q<SVGCircleElement>(".lcb-sxt-halo", sxt);
        const diamond = q<SVGPathElement>(".lcb-sxt-diamond", sxt);
        const read = q<SVGTextElement>(".lcb-sxt-read", sxt);
        const bloomGold = q(".lcb-moon-bloom-gold");
        const { P, S, BEAR, A0, A1, STEP } = SXT;
        const PIV = P.x + " " + P.y;

        // motion mode resets the authored locked state to hidden
        if (arcEl) primeDraw([arcEl]);
        gsap.set(ticks, { opacity: 0 });
        if (arm) gsap.set(arm, { opacity: 0, rotation: A1 - BEAR, svgOrigin: PIV });
        if (pivot) gsap.set(pivot, { opacity: 0 });
        gsap.set([halo, diamond, solid].filter(Boolean) as Element[], { opacity: 0 });
        if (read) gsap.set(read, { opacity: 0 });

        // the sight-line follow driver: both lines run moon-limb -> star,
        // the moon end recomputed per frame from the cached base + travel
        const sight = { draw: 0, solid: 0 };
        const updateSight = () => {
          if (!sxtGeom.ready || !dashed || !solid || !starG) return;
          const mx = sxtGeom.moonCx + gp(travel, "x");
          const my = sxtGeom.moonCy + gp(travel, "y");
          const sc2 = sxtGeom.scale;
          const msx = (mx - sxtGeom.svgLeft) / sc2;
          const msy = (my - (sxtGeom.svgDocTop - window.scrollY)) / sc2;
          const mr = sxtGeom.moonR / sc2;
          const wx = S.x + gp(starG, "x"), wy = S.y + gp(starG, "y");
          const ddx = wx - msx, ddy = wy - msy;
          const dl = Math.hypot(ddx, ddy) || 1;
          const ux = ddx / dl, uy = ddy / dl;
          const x1 = msx + ux * (mr - 12), y1 = msy + uy * (mr - 12);
          const set = (ln: SVGLineElement, f: number) => {
            ln.setAttribute("x1", String(x1)); ln.setAttribute("y1", String(y1));
            ln.setAttribute("x2", String(x1 + (wx - x1) * f)); ln.setAttribute("y2", String(y1 + (wy - y1) * f));
          };
          set(dashed, sight.draw); set(solid, sight.solid);
        };

        const lead0 = q(".lcb-pivot-lead", chart);
        const body0 = q(".lcb-pivot-body", chart);
        const t2 = gsap.timeline({ scrollTrigger: { trigger: lead0 || chart, start: "top 74%", endTrigger: body0 || chart, end: "bottom 56%", scrub } });
        // 0.00 the lead rises
        t2.to(lead, { yPercent: 0, opacity: 1, ease: HOUSE, duration: 0.9, stagger: 0.1 }, 0);
        // 0.30 the loose star arrives, out of focus, and wanders
        if (halo) t2.to(halo, { opacity: glow(0.85), duration: 0.5, ease: HOUSE }, 0.3);
        if (starG) {
          t2.to(starG, { x: 7, y: -5, duration: 0.55, ease: "sine.inOut" }, 0.35)
            .to(starG, { x: -6, y: 4, duration: 0.6, ease: "sine.inOut" }, 0.95)
            .to(starG, { x: 5, y: -3, duration: 0.55, ease: "sine.inOut" }, 1.6)
            .to(starG, { x: 0, y: 0, duration: 0.4, ease: HOUSE }, 2.2);
        }
        // 0.80 the dashed sight-line draws from the moon's limb to the star
        if (dashed) t2.to(dashed, { opacity: 0.55, duration: 0.1, ease: "none" }, 0.8);
        t2.to(sight, { draw: 1, duration: 0.9, ease: HOUSE, onUpdate: updateSight }, 0.8);
        // keep the moon end tracking through the whole measurement
        t2.to({ k: 0 }, { k: 1, duration: 2.8, ease: "none", onUpdate: updateSight }, 0.8);
        // 1.30 the limb deploys: pivot in, 36 ticks deal out from the arm side
        if (pivot) t2.to(pivot, { opacity: 0.9, duration: 0.2, ease: HOUSE }, 1.3);
        if (arcEl) t2.to(arcEl, { strokeDashoffset: 0, duration: 0.45, ease: HOUSE }, 1.3);
        if (arm) t2.to(arm, { opacity: 0.9, duration: 0.25, ease: HOUSE }, 1.42);
        t2.fromTo(ticks,
          { rotation: -8, svgOrigin: PIV, opacity: 0 },
          {
            rotation: 0, svgOrigin: PIV, duration: 0.22, ease: HOUSE,
            opacity: (i: number, el: Element) => (el as SVGLineElement).classList.contains("maj") ? 0.6 : 0.35,
            stagger: { each: 0.011, from: "end" },
          }, 1.3);
        // 1.70 THE SWEEP: the arm rotates 4 degrees PAST the star's bearing.
        // Ticks light via a deterministic boundary walk - scrub-reversible.
        const armObj = { a: A1 };
        let litPtr = 36;
        const applyArm = () => {
          if (arm) gsap.set(arm, { rotation: armObj.a - BEAR, svgOrigin: PIV });
          const bi = Math.max(0, Math.min(36, Math.ceil((armObj.a - A0) / STEP)));
          if (bi !== litPtr) {
            const lo = Math.min(bi, litPtr), hi = Math.max(bi, litPtr);
            for (let i = lo; i < hi; i++) {
              const el = ticks[i]; if (!el) continue;
              const on = i >= bi;
              gsap.set(el, { opacity: on ? 0.95 : el.classList.contains("maj") ? 0.6 : 0.35 });
            }
            litPtr = bi;
          }
        };
        t2.to(armObj, { a: BEAR - 4, duration: 0.65, ease: "power2.inOut", onUpdate: applyArm }, 1.7);
        // 2.35 THE SETTLE: back 4 degrees to the exact bearing. The money shot.
        t2.to(armObj, { a: BEAR, duration: 0.25, ease: HOUSE, onUpdate: applyArm }, 2.35);
        // 2.60 LOCK: the readout counts to the REAL chart Moon degree; the
        // star snaps sharp; the dashed line yields to its solid twin; the
        // moon answers with one gold pulse.
        const MOONP = CHART.find((p) => p.key === "moon")!;
        const totalMin = MOONP.deg * 60 + MOONP.min;
        const cnt = { v: 0 };
        if (read) {
          t2.to(cnt, {
            v: totalMin, duration: 0.6, ease: HOUSE,
            onUpdate: () => { const c = Math.round(cnt.v); read.textContent = Math.floor(c / 60) + "° " + pad2(c % 60) + "'"; },
          }, 2.6)
            .to(read, { opacity: 0.95, duration: 0.4, ease: "none" }, 2.6);
        }
        if (halo) t2.to(halo, { opacity: glow(0.3), duration: 0.5, ease: "none" }, 2.6);
        if (diamond) t2.to(diamond, { opacity: 1, duration: 0.45, ease: HOUSE }, 2.6);
        if (starG) {
          t2.to(starG, { scale: 1.16, duration: 0.25, ease: "none", svgOrigin: S.x + " " + S.y }, 2.6)
            .to(starG, { scale: 1, duration: 0.35, ease: HOUSE }, 2.85);
        }
        t2.to(sight, { solid: 1, duration: 0.5, ease: HOUSE, onUpdate: updateSight }, 2.6);
        if (solid) t2.to(solid, { opacity: 0.65, duration: 0.1, ease: "none" }, 2.6);
        if (dashed) t2.to(dashed, { opacity: 0, duration: 0.5, ease: "none" }, 2.65);
        if (bloomGold) {
          t2.to(bloomGold, { opacity: glow(0.5), duration: 0.4, ease: "none" }, 2.6)
            .to(bloomGold, { opacity: 0, duration: 0.5, ease: "none" }, 3.0);
        }
        // 2.80 the body rises
        t2.to(body, { yPercent: 0, opacity: 1, ease: HOUSE, duration: 0.85, stagger: 0.14 }, 2.8);
        // 3.60 grace exit: the instrument recedes; the fixed star persists
        if (inst) t2.to(inst, { opacity: 0.28, y: 8, duration: 0.6, ease: HOUSE }, 3.6);
        // "names" ignites gold as the body comes into reading range (once)
        const bodyEl = q(".lcb-pivot-body", chart);
        if (bodyEl) {
          ScrollTrigger.create({ trigger: bodyEl, start: "top 70%", once: true, onEnter: () => bodyEl.classList.add("igniting") });
        }
      }

      // =============== BEAT 3 - OUT OF EVERYTHING (scroll = playhead) ===============
      // One proxy clock drives draw(u); every position is a pure function of
      // u, so the scrub reverses for free. Line anchors: u 0.13 / 0.31 / 0.59.
      const soulsScene = q(".lcb-souls-scene");
      const souls = q(".lcb-souls-hold");
      if (souls && soulsScene) {
        const humanPath = q<SVGGeometryElement>(".lcb-arc-human", souls);
        const petPath = q<SVGGeometryElement>(".lcb-arc-pet", souls);
        const threadE = q<SVGGeometryElement>(".lcb-thread", souls);
        const headH = q(".lcb-head-human", souls);
        const headP = q(".lcb-head-pet", souls);
        const headOne = q(".lcb-head-one", souls);
        const irisE = q(".lcb-iris", souls);
        const beam = q(".lcb-beam", souls);
        const zoom = q(".lcb-cross-zoom", souls);
        const bloom = q(".lcb-moon-bloom");
        const lines = qa(".lcb-souls-text .lcb-ln", soulsScene);

        if (humanPath && petPath && headH && headP && headOne) {
          const hPts = samplePath(humanPath), pPts = samplePath(petPath);
          const hLen = humanPath.getTotalLength(), pLen = petPath.getTotalLength();
          primeDraw([humanPath, petPath]);
          if (threadE) { threadE.style.strokeDasharray = "260"; threadE.style.strokeDashoffset = "260"; }
          gsap.set([headH, headP, headOne], { opacity: 0 });
          gsap.set(lines, { opacity: 0, y: 16 });

          let contactFired = false;
          const draw3 = (u: number) => {
            crossDraw(u);
            // the only camera plunge on the page: canvas + SVG lock to one z
            if (zoom) gsap.set(zoom, { scale: zOf(u) });
            // hero trails draw in, visibly bending toward one point
            gsap.set(petPath, { strokeDashoffset: pLen * (1 - HOUSE(seg(u, 0.13, 0.30))) });
            gsap.set(humanPath, { strokeDashoffset: hLen * (1 - HOUSE(seg(u, 0.15, 0.32))) });
            // the gold soul arrives and PARKS at the meeting point (breathing)
            const fadeOut = 1 - seg(u, 0.59, 0.62);
            const pp = atT(pPts, HOUSE(seg(u, 0.13, 0.31)));
            const b = seg(u, 0.31, 0.56);
            const pScale = 1 + 0.05 * (1 - Math.cos(4 * Math.PI * b)) / 2;
            gsap.set(headP, { x: pp.x, y: pp.y, scale: pScale, transformOrigin: "center", opacity: seg(u, 0.10, 0.14) * fadeOut });
            // the ivory soul decelerates in: the wait made felt
            const s2 = seg(u, 0.31, 0.59);
            const hp = atT(hPts, 1 - (1 - s2) * (1 - s2));
            gsap.set(headH, { x: hp.x, y: hp.y, opacity: seg(u, 0.30, 0.34) * fadeOut });
            // the moonbeam finds the spot (memorial: glow cap 0.7 - a holding)
            if (beam) gsap.set(beam, { opacity: glow(0.35) * HOUSE(seg(u, 0.31, 0.55)), scaleY: 0.6 + 0.4 * HOUSE(seg(u, 0.31, 0.55)) });
            // CONTACT at u 0.59 - the exact frame the contact line lands.
            // Memorial: no ascension - the fused light STAYS at the meeting
            // point inside the beam, held. That happened, completely.
            const asc2 = hush ? 0 : HOUSE(seg(u, 0.62, 0.95));
            gsap.set(headOne, {
              x: 200 + cross.dir.x * 260 * asc2 - 200, y: 178 + cross.dir.y * 260 * asc2 - 178,
              scale: 0.7 + 0.3 * HOUSE(seg(u, 0.59, 0.63)), transformOrigin: "center",
              opacity: seg(u, 0.59, 0.63) * (hush ? 1 : 1 - seg(u, 0.95, 0.995)),
            });
            if (threadE) gsap.set(threadE, { strokeDashoffset: 260 * (1 - asc2), opacity: hush ? 0 : 0.85 * seg(u, 0.62, 0.66) });
            // the moon receives: one breath as the light reaches its rim
            if (bloom && !hush) gsap.set(bloom, { scale: 1 + 0.06 * Math.sin(Math.PI * seg(u, 0.95, 1)) });
            // the one play-once accent: iris + mote lift, guarded.
            // Memorial: never - no iris, no lift. Stillness holds.
            if (!hush && u >= 0.59 && !contactFired) {
              contactFired = true;
              if (irisE) gsap.fromTo(irisE, { opacity: 0.8, scale: 0.2 }, { opacity: 0, scale: 1, duration: 0.9, ease: HOUSE, transformOrigin: "center" });
              gsap.timeline()
                .to(cross, { lift: 0.3, duration: 0.18, ease: "power2.out", onUpdate: () => crossDraw(cross.lastU) }, 0)
                .to(cross, { lift: 0, duration: 0.4, ease: HOUSE, onUpdate: () => crossDraw(cross.lastU) }, 0.2);
            }
          };

          const t3 = gsap.timeline({ scrollTrigger: { trigger: soulsScene, start: "top 80%", end: "bottom 40%", scrub } });
          const uP = { u: 0 };
          t3.to(uP, { u: 1, ease: "none", duration: 6.8, onUpdate: () => draw3(uP.u) }, 0);
          if (hush) {
            // memorial carries four lines; the last ("That happened,
            // completely.") lands on the contact frame at u 0.59.
            if (lines[0]) t3.to(lines[0], { opacity: 1, y: 0, ease: HOUSE, duration: 0.7 }, 0.9);
            if (lines[1]) t3.to(lines[1], { opacity: 1, y: 0, ease: HOUSE, duration: 0.8 }, 2.1);
            if (lines[2]) t3.to(lines[2], { opacity: 1, y: 0, ease: HOUSE, duration: 0.8 }, 3.2);
            if (lines[3]) t3.to(lines[3], { opacity: 1, y: 0, ease: HOUSE, duration: 0.9 }, 4.0);
          } else {
            // the copy clock, untouched: u 0.13 / 0.31 / 0.59
            if (lines[0]) t3.to(lines[0], { opacity: 1, y: 0, ease: HOUSE, duration: 0.7 }, 0.9);
            if (lines[1]) t3.to(lines[1], { opacity: 1, y: 0, ease: HOUSE, duration: 0.8 }, 2.1);
            if (lines[2]) t3.to(lines[2], { opacity: 1, y: 0, ease: HOUSE, duration: 0.9 }, 4.0);
          }
        }
      }

      // =============== BEAT 4 - THE SEAL IS CAST (scroll = playhead) ===============
      // ONE clock from the payoff into the form's crest. The moon GIVES a
      // 40-degree arc of its own rim light; it closes to a ring at stage
      // centre, assembles the UNSET chart (the map before the planets),
      // tilts like a lifted seal, then descends and match-cuts onto the
      // form's violet crest as "Set the chart." lights.
      const payoff = q(".lcb-payoff-scene");
      if (payoff) {
        const head = qa(".lcb-payoff-line .lcb-wd", payoff);
        const support = qa(".lcb-support .lcb-i", payoff);
        const closing = qa(".lcb-close .lcb-i", payoff);
        const asc = q(".lcb-asc", payoff);
        const rule = q(".lcb-rule", payoff);
        const crestEl = document.querySelector<HTMLElement>(".ls-seal-crest");
        const moonArcC = q<SVGCircleElement>(".lcb-moonarc circle");
        const traveler = q(".lcb-seal-travel");
        const sealSvg = q<SVGSVGElement>(".lcb-seal-svg");
        const sealArc = q<SVGCircleElement>(".lcb-seal-arc");
        const rimA = q<SVGCircleElement>(".lcb-seal-rimA");
        const rimB = q<SVGCircleElement>(".lcb-seal-rimB");
        const degRing = q<SVGGElement>(".lcb-seal-degring");
        const spokes = qa<SVGLineElement>(".lcb-seal-spoke");
        const hub = q<SVGCircleElement>(".lcb-seal-hub");
        const ascDot = q<SVGCircleElement>(".lcb-seal-ascdot");
        if (asc) gsap.set(asc, { opacity: 0, y: 10 });

        // birth / dock geometry, read live at each refresh (functional values)
        const sealGeom = () => {
          const out = { bx: 0.5 * window.innerWidth, by: 0.4 * window.innerHeight, bs: 0.4, ds: 0.1 };
          const box = traveler ? traveler.getBoundingClientRect().width || 300 : 300;
          const ringD = box * (200 / 220);
          if (moonEl && travel) {
            const mr = moonEl.getBoundingClientRect();
            out.bx = mr.left + mr.width / 2 - gp(travel, "x") + 0.05 * window.innerWidth * amp;
            out.by = mr.top + mr.height / 2 - gp(travel, "y") + -0.11 * window.innerHeight * amp;
            out.bs = (mr.width * 0.92) / ringD;
          }
          const crest = document.querySelector<HTMLElement>(".ls-seal-crest svg");
          const cw = crest ? crest.getBoundingClientRect().width || 46 : 46;
          out.ds = (cw * (54 / 64)) / ringD;
          return out;
        };

        const t4 = gsap.timeline({
          scrollTrigger: {
            trigger: payoff, start: "top 75%",
            endTrigger: crestEl || payoff, end: crestEl ? "center 58%" : "bottom 40%",
            scrub, invalidateOnRefresh: true,
          },
        });
        // the copy clock, kept exactly: 0 / 1.2 / 2.1 / 3.0 / 4.2 / 6.7 / 8.6
        t4.to(head, { yPercent: 0, opacity: 1, ease: HOUSE, duration: 0.9, stagger: 0.12 }, 0);
        support.forEach((ln, i) => {
          t4.to(ln, { yPercent: 0, opacity: 1, ease: HOUSE, duration: 0.7 }, 1.2 + i * 0.9);
        });
        if (hush) {
          // memorial closes on the one line: "Set the chart." - after the
          // quiet hold, as the frame docks
          if (closing[0]) t4.to(closing[0], { yPercent: 0, opacity: 1, ease: HOUSE, duration: 0.8 }, 8.6);
        } else {
          if (closing[0]) t4.to(closing[0], { yPercent: 0, opacity: 1, ease: HOUSE, duration: 0.8 }, 4.2);
          if (closing[1]) t4.to(closing[1], { yPercent: 0, opacity: 1, ease: HOUSE, duration: 0.8 }, 6.7);
          if (closing[2]) t4.to(closing[2], { yPercent: 0, opacity: 1, ease: HOUSE, duration: 0.8 }, 8.6);
        }
        if (asc) t4.to(asc, { opacity: 1, y: 0, ease: HOUSE, duration: 1.0, onComplete: () => asc.classList.add("lit") }, 8.8);
        if (rule) t4.fromTo(rule, { scaleX: 0 }, { scaleX: 1, ease: HOUSE, duration: 1.1 }, 8.9);

        // the seal itself (writes ONLY the travelers + crest classes)
        if (moonArcC && traveler && sealArc && crestEl) {
          gsap.set(traveler, { opacity: 0, xPercent: -50, yPercent: -50 });
          gsap.set(moonArcC, { strokeDashoffset: 100 });
          gsap.set(sealArc, { strokeDashoffset: 88.89 });
          if (rimA && rimB) primeDraw([rimA, rimB]);
          if (degRing) gsap.set(degRing, { opacity: 0, rotation: 8, svgOrigin: "0 0" });
          if (spokes.length) primeDraw(spokes);
          // 0.0 - 0.9: a 40-degree gold arc draws on the moon's lower limb
          t4.to(moonArcC, { opacity: 0.9, duration: 0.12, ease: "none" }, 0)
            .to(moonArcC, { strokeDashoffset: 88.89, duration: 0.78, ease: HOUSE }, 0.06)
            // 0.9 - 1.2: the arc detaches, travels to stage centre, closes full
            .to(moonArcC, { opacity: 0, duration: 0.16, ease: "none" }, 0.9)
            .to(traveler, { opacity: 1, duration: 0.08, ease: "none" }, 0.9)
            .fromTo(traveler,
              { x: () => sealGeom().bx, y: () => sealGeom().by, scale: () => sealGeom().bs },
              { x: () => 0.5 * window.innerWidth, y: () => 0.46 * window.innerHeight, scale: 1, duration: 0.3, ease: HOUSE, immediateRender: false }, 0.9)
            .to(sealArc, { strokeDashoffset: 0, duration: 0.3, ease: HOUSE }, 0.9);
          // 1.2 "Who they are." - the rim pair draws
          if (rimA) t4.to(rimA, { strokeDashoffset: 0, duration: 0.7, ease: HOUSE }, 1.2);
          if (rimB) t4.to(rimB, { strokeDashoffset: 0, duration: 0.7, ease: HOUSE }, 1.35);
          // 2.1 "What steadies them." - the dashed degree ring settles in
          if (degRing) {
            t4.to(degRing, { opacity: 0.55, duration: 0.5, ease: "none" }, 2.1)
              .to(degRing, { rotation: 0, duration: 0.7, ease: HOUSE }, 2.1);
          }
          if (hub) t4.to(hub, { opacity: 0.9, duration: 0.4, ease: HOUSE }, 2.25);
          // 3.0 "Why they love the way they do." - twelve house spokes fan out
          if (spokes.length) t4.to(spokes, { strokeDashoffset: 0, duration: 0.45, ease: HOUSE, stagger: 0.055 }, 3.0);
          if (ascDot) t4.to(ascDot, { opacity: 1, duration: 0.4, ease: HOUSE }, 3.6);
          // 4.2 - 6.7: the frame complete. Quiet hold, faint breath only.
          if (sealSvg) t4.to(sealSvg, { opacity: 0.86, duration: 0.9, ease: "sine.inOut", yoyo: true, repeat: 1 }, 4.6);
          // 6.7 "Now you can see it." - the seal lifts to be pressed.
          // Memorial: no tilt - the frame is carried down flat, unhurried.
          if (!hush) t4.to(traveler, { rotationX: 56, transformPerspective: 900, duration: 0.55, ease: HOUSE }, 6.55);
          // 6.7 - 8.6: descent along the seam; match-cut onto the form's crest.
          // The dock point is constant: the trigger ends when the crest sits
          // at (0.50W, 0.58H), so the target never needs live tracking.
          t4.to(traveler, { x: () => 0.5 * window.innerWidth, y: () => 0.58 * window.innerHeight, scale: () => sealGeom().ds, duration: 1.9, ease: HOUSE, immediateRender: false }, 6.7)
            .to(traveler, { opacity: 0, duration: 0.3, ease: "none" }, 8.35);
          if (!hush) t4.to(traveler, { rotationX: 0, duration: 1.4, ease: HOUSE }, 7.2);
          // on dock: the crest flares ONCE (class toggle, threadCta precedent).
          // Memorial: no flare - the frame simply arrives.
          if (!hush) {
            ScrollTrigger.create({
              trigger: crestEl, start: "center 62%", once: true,
              onEnter: () => crestEl.classList.add("lcb-docked"),
            });
          }
          // post-submit guard: the form swaps to the journey and the crest
          // leaves the DOM - kill the handoff, hide the travelers
          sealKill = () => {
            t4.scrollTrigger?.kill();
            gsap.set(traveler, { opacity: 0 });
            gsap.set(moonArcC, { opacity: 0 });
          };
        }
      }

      // ========== SPINE 2 - MOON BECOMES THEIR SUN (page-spanning) ==========
      // After the passage the moon keeps travelling: it hangs above the seal
      // card waiting, swings around the reveal, then descends behind checkout
      // while its cold grey crossfades to gold. The sale is daybreak.
      // Functional values + invalidateOnRefresh so the post-submit reveal
      // growth only needs ScrollTrigger.refresh() to re-measure the spine.
      const orrery2 = document.querySelector("#computed-sky");
      const checkout2 = document.querySelector("#begin");
      const goldImg = q(".lcb-moon-img.gold");
      const bloomCold = q(".lcb-moon-bloom");
      const bloomGold = q(".lcb-moon-bloom-gold");
      if (travel && orrery2 && checkout2) {
        const W2 = () => window.innerWidth, H2 = () => window.innerHeight;
        const spine = gsap.timeline({
          scrollTrigger: { trigger: orrery2, start: "top bottom", endTrigger: checkout2, end: "top 28%", scrub, invalidateOnRefresh: true },
        });
        // leg 4 - hang above the form, waiting. Explicit "from" = leg 3's end so
        // the two scrubbed timelines hand the moon over without a seam.
        spine.fromTo(travel,
          { x: () => 0.05 * W2() * amp, y: () => -0.11 * H2() * amp },
          { x: () => (mobile ? -0.36 : -0.44) * W2(), y: () => 0.18 * H2(), ease: HOUSE, duration: 1, immediateRender: false }, 0.001)
          // leg 5 - orbit the reveal wheel: swing wide and small around the stage
          .to(travel, { x: () => (mobile ? -0.16 : -0.20) * W2(), y: () => 0.09 * H2(), ease: "sine.inOut", duration: 1.2 }, 1.001)
          .to(moonEl, { scale: 0.8, ease: "none", duration: 1.2 }, 1.001)
          // leg 6 - daybreak: descend into the horizon glow behind checkout
          .to(travel, { x: () => (mobile ? -0.26 : -0.30) * W2(), y: () => 0.64 * H2(), ease: "none", duration: 1.6 }, 2.201)
          .to(moonEl, { scale: 0.88, ease: "none", duration: 1.6 }, 2.201);
        if (goldImg) spine.to(goldImg, { opacity: 1, ease: "none", duration: 1.3 }, 2.4);
        if (bloomCold && bloomGold) {
          spine.to(bloomCold, { opacity: 0, ease: "none", duration: 1.3 }, 2.4)
            .to(bloomGold, { opacity: 1, ease: "none", duration: 1.3 }, 2.4);
        }

        // ---- GOLD THREAD TERMINUS: the moon's glow settles into the CTA,
        // the last moving pixel on the page. The gold bloom dims to an ember
        // as the buy button rises into view; on the dossier arm the button
        // then carries the breath (the .is-thread class). The window sits
        // well BELOW the spine's end (checkout top 28%), so the two never
        // write the same property on the same scroll tick.
        const threadCta = document.querySelector<HTMLElement>("#begin .dsr-card .dsr-cta");
        if (bloomGold && moonEl) {
          gsap.timeline({
            scrollTrigger: {
              trigger: threadCta || checkout2,
              start: threadCta ? "top 94%" : "top -25%",
              end: threadCta ? "top 60%" : "top -60%",
              scrub,
              invalidateOnRefresh: true,
            },
          })
            .to(bloomGold, { opacity: 0.32, ease: "none", duration: 1 }, 0)
            .to(moonEl, { scale: 0.8, ease: "none", duration: 1 }, 0);
        }
        if (threadCta) {
          ScrollTrigger.create({
            trigger: threadCta,
            start: "top 72%",
            once: true,
            onEnter: () => threadCta.classList.add("is-thread"),
          });
        }
      }

      // ========== CAMERA-TILT HANDOFFS ==========
      // A slight rotateX/translate scrub at each beat boundary: leaving a beat
      // reads as tilting your head to the next patch of sky. The payoff never
      // tilts out (it hands flat into the form), beat 1 never tilts in (it
      // rises under the hero).
      const scenes = qa(".lcb-scene");
      const tiltIn = mobile ? 1.6 : 2.6;
      const tiltOut = mobile ? 1.4 : 2.2;
      scenes.forEach((scene, i) => {
        gsap.set(scene, { transformOrigin: "50% 50%" });
        if (i > 0) {
          gsap.fromTo(scene, { rotationX: -tiltIn, y: 26 * amp }, {
            rotationX: 0, y: 0, ease: "none", immediateRender: false,
            scrollTrigger: { trigger: scene, start: "top 98%", end: "top 55%", scrub },
          });
        }
        if (i < scenes.length - 1) {
          gsap.to(scene, {
            rotationX: tiltOut, y: -20 * amp, ease: "none",
            scrollTrigger: { trigger: scene, start: "bottom 48%", end: "bottom 10%", scrub },
          });
        }
      });
    };

    mm.add(
      {
        mobile: "(max-width: 768px)",
        desktop: "(min-width: 769px)",
        reduce: "(prefers-reduced-motion: reduce)",
      },
      (ctx) => {
        const cond = (ctx.conditions || {}) as { mobile?: boolean; reduce?: boolean };
        const mobile = !!cond.mobile;
        const noMotion = !!cond.reduce;
        const scrub = mobile ? 1.2 : 1;

        // ---- ONE SKY: the stage lights as the hero sets and then STAYS ON for
        // the rest of the page (form, reveal, checkout all live under the same
        // night). Only the framing veils (.lcb-front) still exit at the form so
        // the reveal + checkout keep full text contrast. Ramps stay LINEAR: an
        // eased coverage fade lights the night too early over the hero
        // (HOUSE(0.29) ~= 0.78 at load). HOUSE lives on the beats.
        const stageOp = { enter: 0, frontExit: 1 };
        const applyStage = () => {
          if (back) (back as HTMLElement).style.opacity = String(stageOp.enter);
          if (front) (front as HTMLElement).style.opacity = String(Math.min(stageOp.enter, stageOp.frontExit));
        };
        applyStage();
        gsap.fromTo(stageOp, { enter: 0 }, {
          enter: 1, ease: "none", onUpdate: applyStage,
          scrollTrigger: { trigger: root, start: "top 80%", end: "top 25%", scrub: noMotion ? true : scrub },
        });
        gsap.fromTo(stageOp, { frontExit: 1 }, {
          frontExit: 0, ease: "none", onUpdate: applyStage,
          scrollTrigger: { trigger: root, start: "bottom 60%", end: "bottom 5%", scrub: noMotion ? true : scrub },
        });

        // ---- DAWN GRADE: violet lifts at the reveal, the gold horizon rises
        // behind checkout. Opacity-only, so it runs under reduced motion too.
        const violetSky = q(".lcb-sky-violet");
        const dawnSky = q(".lcb-dawn-horizon");
        const orrerySec = document.querySelector("#computed-sky");
        const checkoutSec = document.querySelector("#begin");
        if (violetSky && orrerySec) {
          gsap.fromTo(violetSky, { opacity: 0 }, {
            opacity: 1, ease: "none",
            scrollTrigger: { trigger: orrerySec, start: "top 70%", end: "top 12%", scrub: noMotion ? true : scrub },
          });
        }
        if (dawnSky && checkoutSec) {
          gsap.fromTo(dawnSky, { opacity: 0 }, {
            opacity: 1, ease: "none",
            scrollTrigger: { trigger: checkoutSec, start: "top 92%", end: "top 30%", scrub: noMotion ? true : scrub },
          });
        }

        // ================= REDUCED MOTION: honest final state =================
        // Every beat renders its END state. Transients (meteor, twinkle-wave,
        // blink, near-miss, camera plunge, iris, ascension, seal travel) never
        // existed. The sextant is authored locked; the trails and thread render
        // fully drawn; the beam stands lit on the fused single light.
        if (noMotion) {
          mode.motion = false;
          gsap.set(q(".lcb-moon-img.blur"), { opacity: 0 });
          gsap.set(q(".lcb-moon-img.sharp"), { opacity: 1 });
          gsap.set([...allWords, ...allInners, ...qa(".lcb-souls-text .lcb-ln")], { opacity: 1, yPercent: 0, y: 0 });
          gsap.set(q(".lcb-earthshine"), { opacity: glow(0.35) });
          gsap.set(q(".lcb-moon-img.gold"), { opacity: glow(0.18) });
          const dawnEl = q(".lcb-dawn");
          if (dawnEl) gsap.set(dawnEl, { opacity: glow(0.85), yPercent: 4 });
          gsap.set(q(".lcb-beam"), { opacity: glow(0.35) });
          gsap.set(q(".lcb-head-one"), { opacity: 1 });
          gsap.set(q(".lcb-rule"), { scaleX: 1 });
          if (hush) {
            // memorial statics: the held star burns low; the moon's rim is
            // hushed; the ascension thread never existed
            const star = q(".lcb-memstar"); if (star) gsap.set(star, { opacity: 0.8 });
            const rimEl = q(".lcb-moon-rim"); if (rimEl) gsap.set(rimEl, { opacity: glow(1) });
            const threadEl = q(".lcb-thread"); if (threadEl) gsap.set(threadEl, { opacity: 0 });
          }
          const asc = q(".lcb-asc"); if (asc) asc.classList.add("lit");
          return;
        }

        // ================= MOTION =================
        mode.motion = true;
        root.classList.add("lcb-motion");
        gsap.set(allWords, { yPercent: 118, opacity: 0 });
        gsap.set(allInners, { yPercent: 118, opacity: 0 });
        gsap.set(q(".lcb-moon-img.sharp"), { opacity: 0 });
        gsap.set(q(".lcb-moon-img.blur"), { opacity: 1 });

        // slow starfield parallax on the same clock
        if (canvasWrap) {
          gsap.fromTo(canvasWrap, { y: 0 }, { y: -70, ease: "none", scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub } });
        }

        // damped pointer parallax (desktop only) on the gsap ticker
        let onPointer: ((e: PointerEvent) => void) | undefined;
        if (!mobile && moonPt) {
          const qx = gsap.quickTo(moonPt, "x", { duration: 0.9, ease: "power3.out" });
          const qy = gsap.quickTo(moonPt, "y", { duration: 0.9, ease: "power3.out" });
          onPointer = (e: PointerEvent) => {
            qx((e.clientX / window.innerWidth - 0.5) * 10);
            qy((e.clientY / window.innerHeight - 0.5) * 8);
          };
          window.addEventListener("pointermove", onPointer, { passive: true });
        }

        buildStory(mobile, scrub);

        return () => {
          if (onPointer) window.removeEventListener("pointermove", onPointer);
          root.classList.remove("lcb-motion");
          sealKill = null;
        };
      },
    );

    requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      ScrollTrigger.removeEventListener("refresh", onSTRefresh);
      mm.revert();
    };
  }, [register]);

  // twelve house spokes for the beat-4 unset chart (r28 -> r72, every 30deg)
  const sealSpokes = Array.from({ length: 12 }, (_, i) => {
    const a = (i * 30 * Math.PI) / 180;
    return {
      x1: Math.round(Math.cos(a) * 28 * 100) / 100, y1: Math.round(Math.sin(a) * 28 * 100) / 100,
      x2: Math.round(Math.cos(a) * 72 * 100) / 100, y2: Math.round(Math.sin(a) * 72 * 100) / 100,
    };
  });

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
        <div className="lcb-moon-travel">
          <div className="lcb-moon-b4">
            <div className="lcb-moon-pt">
              <div className="lcb-moon">
                <div className="lcb-moon-bloom" />
                <div className="lcb-moon-bloom-gold" />
                <div className="lcb-moon-disc">
                  <img className="lcb-moon-img blur" src="/start/cosmos-moon-blur.webp" width={520} height={520} alt="" decoding="async" loading="lazy" />
                  <img className="lcb-moon-img sharp" src="/start/cosmos-moon.webp" width={520} height={520} alt="" decoding="async" loading="lazy" />
                  <img className="lcb-moon-img gold" src="/start/cosmos-moon.webp" width={520} height={520} alt="" decoding="async" loading="lazy" />
                  <div className="lcb-earthshine" />
                  <div className="lcb-moon-grade" />
                  <div className="lcb-moon-term" />
                  <div className="lcb-moon-rim" />
                </div>
                {/* BEAT 4: the 40-degree arc the moon gives away */}
                <svg className="lcb-moonarc" viewBox="0 0 100 100" aria-hidden="true">
                  <circle cx="50" cy="50" r="46" pathLength={100} strokeDasharray="100" transform="rotate(70 50 50)" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        {/* BEAT 4: the traveling seal ring (the unset chart) */}
        <div className="lcb-seal-travel" aria-hidden="true">
          <svg className="lcb-seal-svg" viewBox="-110 -110 220 220">
            <circle className="lcb-seal-arc" cx="0" cy="0" r="100" pathLength={100} strokeDasharray="100" transform="rotate(70)" />
            <circle className="lcb-seal-rim lcb-seal-rimA" cx="0" cy="0" r="100" />
            <circle className="lcb-seal-rim lcb-seal-rimB" cx="0" cy="0" r="76" />
            <g className="lcb-seal-degring">
              <circle className="lcb-seal-deg" cx="0" cy="0" r="88" />
            </g>
            {sealSpokes.map((sp, i) => (
              <line key={i} className="lcb-seal-spoke" x1={sp.x1} y1={sp.y1} x2={sp.x2} y2={sp.y2} />
            ))}
            <circle className="lcb-seal-hub" cx="0" cy="0" r="2.5" />
            <circle className="lcb-seal-ascdot" cx="0" cy="-100" r="3" />
          </svg>
        </div>
        <div className="lcb-dawn-horizon" />
        <div className="lcb-grade" />
      </div>

      <div className="lcb-beats">
        {memorial ? (
          <>
            {/* MEMORIAL BEAT 1 - the date changed */}
            <div className="lcb-scene lcb-open">
              <div className="lcb-dawn" aria-hidden="true" />
              <div className="lcb-memstar" aria-hidden="true" />
              <p className="lcb-beat lcb-split"><span className="lcb-ln">The date changed.</span></p>
              <p className="lcb-beat lcb-support lcb-linemask">
                <span className="lcb-ln">The light came through the window again.</span>
                <span className="lcb-ln">The place they slept still has a name in your mind.</span>
                <span className="lcb-ln">You notice the silence before you notice the room.</span>
              </p>
            </div>

            {/* MEMORIAL BEAT 2 - before the last day, a first one */}
            <div className="lcb-scene lcb-chart-scene">
              <p className="lcb-pivot-lead lcb-split">
                <span className="lcb-ln">Before the last day, there was a first one.</span>
              </p>
              <svg className="lcb-sxt" viewBox="0 0 390 480" aria-hidden="true" />
              <div className="lcb-chart-copy">
                <p className="lcb-pivot-body lcb-linemask">
                  <span className="lcb-ln">Their birth had a sky of its own.</span>
                  <span className="lcb-ln">Planets, degrees, houses, all <span className="lcb-ignite">fixed</span>.</span>
                  <span className="lcb-ln">Nothing after can touch that beginning.</span>
                </p>
              </div>
            </div>

            {/* MEMORIAL BEAT 3 - the crossing becomes a holding */}
            <div className="lcb-scene lcb-souls-scene">
              <div className="lcb-souls-hold" aria-hidden="true">
                <canvas className="lcb-cross-sky" />
                <div className="lcb-beam" />
                <div className="lcb-cross-zoom">
                  <svg className="lcb-souls-svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet">
                    <path className="lcb-arc lcb-arc-human" d="M-30,10 C90,140 150,120 200,178" />
                    <path className="lcb-arc lcb-arc-pet" d="M430,252 C310,150 250,206 200,178" />
                    <line className="lcb-thread" x1="200" y1="178" x2="200" y2="-82" />
                    <circle className="lcb-head lcb-head-human" cx="0" cy="0" r="4.6" />
                    <circle className="lcb-head lcb-head-pet" cx="0" cy="0" r="4.6" />
                    <circle className="lcb-head lcb-head-one" cx="200" cy="178" r="5.2" />
                  </svg>
                </div>
                <div className="lcb-iris" />
              </div>
              <p className="lcb-beat lcb-support lcb-souls-text">
                <span className="lcb-ln">They came into time, and into your life.</span>
                <span className="lcb-ln">You knew the weight of them.</span>
                <span className="lcb-ln">You learned the sound of them entering a room.</span>
                <span className="lcb-ln lcb-emph">That happened, completely.</span>
              </p>
            </div>

            {/* MEMORIAL BEAT 4 - who they were, held in the chart */}
            <div className="lcb-scene lcb-payoff lcb-payoff-scene">
              <p className="lcb-payoff-line lcb-split"><span className="lcb-ln">The reading starts where their life started.</span></p>
              <p className="lcb-beat lcb-support lcb-linemask">
                <span className="lcb-ln">At the hour they arrived.</span>
                <span className="lcb-ln">Who they were, held in the chart.</span>
              </p>
              <p className="lcb-payoff-line lcb-close lcb-linemask">
                <span className="lcb-ln"><span className="lcb-asc">Set the chart.</span></span>
              </p>
              <span className="lcb-rule" aria-hidden="true" />
            </div>
          </>
        ) : (
          <>
            {/* BEAT 1 - the sky replies */}
            <div className="lcb-scene lcb-open">
              <div className="lcb-dawn" aria-hidden="true" />
              <div className="lcb-meteor" aria-hidden="true">
                <div className="lcb-meteor-streak" />
                <div className="lcb-meteor-head" />
              </div>
              <p className="lcb-beat lcb-split"><span className="lcb-ln">You know them by heart.</span></p>
              <p className="lcb-beat lcb-support lcb-linemask">
                <span className="lcb-ln">The exact thing that makes them lose their mind with joy.</span>
                <span className="lcb-ln">The weight of them when they finally fall asleep on you.</span>
                <span className="lcb-ln">The way you catch them watching you.</span>
              </p>
            </div>

            {/* BEAT 2 - the sextant: the moon takes the measurement */}
            <div className="lcb-scene lcb-chart-scene">
              <p className="lcb-pivot-lead lcb-split">
                <span className="lcb-ln">And still, one part of who they are has never had a name.</span>
              </p>
              <svg className="lcb-sxt" viewBox="0 0 390 480" aria-hidden="true" />
              <div className="lcb-chart-copy">
                <p className="lcb-pivot-body lcb-linemask">
                  <span className="lcb-ln">At the moment they arrived, every planet stood in an exact place.</span>
                  <span className="lcb-ln">Measured to the degree, the same order that <span className="lcb-ignite">names</span> an eclipse years before it happens.</span>
                </p>
              </div>
            </div>

            {/* BEAT 3 - out of everything: two lives, timed to meet */}
            <div className="lcb-scene lcb-souls-scene">
              <div className="lcb-souls-hold" aria-hidden="true">
                <canvas className="lcb-cross-sky" />
                <div className="lcb-beam" />
                <div className="lcb-cross-zoom">
                  <svg className="lcb-souls-svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet">
                    <path className="lcb-arc lcb-arc-human" d="M-30,10 C90,140 150,120 200,178" />
                    <path className="lcb-arc lcb-arc-pet" d="M430,252 C310,150 250,206 200,178" />
                    <line className="lcb-thread" x1="200" y1="178" x2="200" y2="-82" />
                    <circle className="lcb-head lcb-head-human" cx="0" cy="0" r="4.6" />
                    <circle className="lcb-head lcb-head-pet" cx="0" cy="0" r="4.6" />
                    <circle className="lcb-head lcb-head-one" cx="200" cy="178" r="5.2" />
                  </svg>
                </div>
                <div className="lcb-iris" />
              </div>
              <p className="lcb-beat lcb-support lcb-souls-text">
                <span className="lcb-ln">And somehow, their small life crossed yours.</span>
                <span className="lcb-ln">The one who waits at the door before your car has turned in.</span>
                <span className="lcb-ln lcb-emph">Two lives, out of everything, timed to meet.</span>
              </p>
            </div>

            {/* BEAT 4 - the seal is cast: read closely, then set the chart */}
            <div className="lcb-scene lcb-payoff lcb-payoff-scene">
              <p className="lcb-payoff-line lcb-split"><span className="lcb-ln">A birth chart is that one moment, read closely.</span></p>
              <p className="lcb-beat lcb-support lcb-linemask">
                <span className="lcb-ln">Who they are.</span>
                <span className="lcb-ln">What steadies them.</span>
                <span className="lcb-ln">Why they love the way they do.</span>
              </p>
              <p className="lcb-payoff-line lcb-close lcb-linemask">
                <span className="lcb-ln">You have loved them without the map.</span>
                <span className="lcb-ln">Now you can see it.</span>
                <span className="lcb-ln"><span className="lcb-asc">Set the chart.</span></span>
              </p>
              <span className="lcb-rule" aria-hidden="true" />
            </div>
          </>
        )}
      </div>

      {/* framing overlays (above the beats) */}
      <div className="lcb-front" aria-hidden="true">
        <div className="lcb-veil" />
        <div className="lcb-vignette" />
        <div className="lcb-focus" />
        <div className="lcb-lift" />
        <div className="lcb-grain" />
      </div>
    </section>
  );
}
