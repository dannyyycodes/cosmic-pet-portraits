import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getIntent, INTENT_EVENT } from "@/lib/intent";

gsap.registerPlugin(ScrollTrigger);

/* =====================================================================
   The bridge passage (littlesouls.app) - the emotional hero moment
   between <HeroSection/> and the "Set the chart" form. One story, four
   beats, ONE continuing actor (the MOON), and ONE BINDING LAW: every
   line's KEY word is a split unit whose reveal position stamps a
   timeline label, and the line's bound visual COMPLETES (or, for
   arrivals, finishes APPEARING) exactly at that label. Labels are the
   authority; no decimal is ever hand-typed twice.

     1 RECOGNITION - the blur crossfade completes at "know"; the meteor's
       splash detonates the twinkle-wave at "joy"; the sky takes the
       weight at "weight" and damps flat at "asleep"; earthshine
       completes at "watching" and the moon blinks ONCE on "you".
     2 THE UNNAMED PART, MEASURED - the halo star drifts and returns to
       its exact point at "every time"; the sight-line's tip lands on
       the star at "that"; the instrument's final tick lands at
       "address"; the readout counts and LOCKS at the real chart figure
       exactly at "degree" (star snaps sharp, dashed yields to solid).
     3 THE IMPROBABLE CROSSING - the u-proxy conducts; the copy is
       retimed to the shared B3 anchors: the gold light completes at
       "box", the ivory light departs at "Keys", the moonbeam completes
       at "waits", and "meet" IS the contact frame. The ascension after
       is total silence.
     4 THE SEAL IS CAST - the moon's arc closes to a ring at "still";
       the frame assembles on "are" / "steadies" / "love"; it breathes
       at "map", lifts at "see", and docks onto the form's violet crest
       exactly at "chart" as "Set the chart." lights.

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

/* ---- STAR CONSTELLATION geometry (v5) --------------------------------
   ONE source for the builder (draws the stars + lines) AND the timeline
   (binds each star event to its key-word label). viewBox 400x460, the
   pet star centred; three known stars form a tight cluster around it;
   four unknown stars ride an outer ring; the constellation web connects
   them; the degree mark rides one known node. All scale-invariant. */
const CONSTEL = {
  pet: { x: 200, y: 236 },
  known: [
    { id: "k1", x: 150, y: 198 },
    { id: "k2", x: 258, y: 208 },
    { id: "k3", x: 206, y: 300 },
  ],
  unknown: [
    { id: "u1", x: 70, y: 104 },
    { id: "u2", x: 332, y: 128 },
    { id: "u3", x: 92, y: 372 },
    { id: "u4", x: 330, y: 356 },
  ],
  // the web: pet to each known, the cluster triangle, then each known
  // reaches its nearest unknown - a coherent constellation, not a mesh
  lines: [
    ["pet", "k1"], ["pet", "k2"], ["pet", "k3"],
    ["k1", "k2"], ["k2", "k3"], ["k1", "k3"],
    ["k1", "u1"], ["k2", "u2"], ["k3", "u3"], ["k2", "u4"],
  ] as [string, string][],
  degNode: "k2",              // the degree mark snaps onto this node
  apex: { x: 196, y: 224 },   // where the two lights become one
};

// warm-known light layers (ivory family) for a star group
const STAR_LAYERS = (r = 2.6) => `
  <g class="lcb-glow lcb-glow-cool">
    <circle class="lcb-halo" r="30" fill="url(#lcbHaloCool)"/>
    <circle class="lcb-core" r="${r}" fill="url(#lcbCoreCool)"/>
  </g>
  <g class="lcb-glow lcb-glow-warm">
    <circle class="lcb-chroma" r="15" fill="url(#lcbChroma)"/>
    <circle class="lcb-halo" r="30" fill="url(#lcbHaloWarm)"/>
    <circle class="lcb-core" r="${r}" fill="url(#lcbCoreWarm)"/>
  </g>
  <g class="lcb-glow lcb-glow-gold">
    <circle class="lcb-halo" r="40" fill="url(#lcbHaloGold)"/>
    <circle class="lcb-core" r="${r + 0.4}" fill="url(#lcbCoreGold)"/>
  </g>
  <g class="lcb-glint">
    <path class="lcb-glint-v" d="M0,-14 L1.15,0 L0,14 L-1.15,0 Z"/>
    <path class="lcb-glint-h" d="M-14,0 L0,-1.15 L14,0 L0,1.15 Z"/>
  </g>`;

function starGroup(cls: string, x: number, y: number, seedDelay: number, r = 2.6): string {
  return `<g class="lcb-star ${cls}" style="transform:translate(${x}px,${y}px);--bd:${seedDelay}s">`
    + `<g class="lcb-star-breathe">${STAR_LAYERS(r)}</g></g>`;
}

function buildConstellation(): string {
  const C = CONSTEL;
  const pos = (id: string) =>
    id === "pet" ? C.pet
    : C.known.find((k) => k.id === id) || C.unknown.find((u) => u.id === id) || C.pet;

  let out = `
<defs>
  <radialGradient id="lcbHaloCool">
    <stop offset="0%" stop-color="rgba(176,188,222,0.55)"/>
    <stop offset="28%" stop-color="rgba(150,160,210,0.20)"/>
    <stop offset="60%" stop-color="rgba(150,160,210,0.06)"/>
    <stop offset="100%" stop-color="rgba(150,160,210,0)"/>
  </radialGradient>
  <radialGradient id="lcbCoreCool">
    <stop offset="0%" stop-color="rgba(226,232,248,0.95)"/>
    <stop offset="42%" stop-color="rgba(196,206,232,0.55)"/>
    <stop offset="78%" stop-color="rgba(176,188,222,0.10)"/>
    <stop offset="100%" stop-color="rgba(176,188,222,0)"/>
  </radialGradient>
  <radialGradient id="lcbHaloWarm">
    <stop offset="0%" stop-color="rgba(246,235,207,0.72)"/>
    <stop offset="26%" stop-color="rgba(240,222,180,0.26)"/>
    <stop offset="58%" stop-color="rgba(240,217,159,0.07)"/>
    <stop offset="100%" stop-color="rgba(240,217,159,0)"/>
  </radialGradient>
  <radialGradient id="lcbCoreWarm">
    <stop offset="0%" stop-color="rgba(255,251,240,0.98)"/>
    <stop offset="40%" stop-color="rgba(248,238,214,0.6)"/>
    <stop offset="80%" stop-color="rgba(246,235,207,0.10)"/>
    <stop offset="100%" stop-color="rgba(246,235,207,0)"/>
  </radialGradient>
  <radialGradient id="lcbChroma">
    <stop offset="0%" stop-color="rgba(255,214,150,0)"/>
    <stop offset="55%" stop-color="rgba(255,206,140,0.10)"/>
    <stop offset="82%" stop-color="rgba(214,190,134,0.05)"/>
    <stop offset="100%" stop-color="rgba(214,190,134,0)"/>
  </radialGradient>
  <radialGradient id="lcbHaloGold">
    <stop offset="0%" stop-color="rgba(255,236,180,0.85)"/>
    <stop offset="24%" stop-color="rgba(240,217,159,0.34)"/>
    <stop offset="55%" stop-color="rgba(214,190,134,0.09)"/>
    <stop offset="100%" stop-color="rgba(214,190,134,0)"/>
  </radialGradient>
  <radialGradient id="lcbCoreGold">
    <stop offset="0%" stop-color="rgba(255,252,244,1)"/>
    <stop offset="38%" stop-color="rgba(255,236,184,0.7)"/>
    <stop offset="78%" stop-color="rgba(240,217,159,0.12)"/>
    <stop offset="100%" stop-color="rgba(240,217,159,0)"/>
  </radialGradient>
  <radialGradient id="lcbApexBloom">
    <stop offset="0%" stop-color="rgba(255,252,246,0.95)"/>
    <stop offset="22%" stop-color="rgba(255,238,196,0.62)"/>
    <stop offset="48%" stop-color="rgba(240,217,159,0.26)"/>
    <stop offset="74%" stop-color="rgba(214,190,134,0.08)"/>
    <stop offset="100%" stop-color="rgba(214,190,134,0)"/>
  </radialGradient>
</defs>`;

  // constellation web first (behind the stars)
  out += '<g class="lcb-cst">';
  C.lines.forEach(([a, b], i) => {
    const p = pos(a), q2 = pos(b);
    out += `<line class="lcb-cst-line" data-i="${i}" x1="${p.x}" y1="${p.y}" x2="${q2.x}" y2="${q2.y}"/>`;
  });
  out += "</g>";

  // unknown stars (outer ring), known cluster, pet last (brightest on top)
  C.unknown.forEach((u, i) => { out += starGroup(u.id, u.x, u.y, 1.1 + i * 0.7, 2.4); });
  C.known.forEach((k, i) => { out += starGroup(k.id, k.x, k.y, 0.4 + i * 0.5, 2.7); });
  out += starGroup("lcb-pet", C.pet.x, C.pet.y, 0, 3.8);

  // degree mark on the chosen node (real chart Moon figure, never invented)
  const MOON = CHART.find((p) => p.key === "moon")!;
  const dn = pos(C.degNode);
  const pad2 = (n: number) => (n < 10 ? "0" : "") + n;
  out += `<g class="lcb-degmark" data-node="${C.degNode}">`
    + `<line class="lcb-deg-tick" x1="${dn.x + 12}" y1="${dn.y - 12}" x2="${dn.x + 22}" y2="${dn.y - 22}"/>`
    + `<text class="lcb-deg-read" x="${dn.x + 26}" y="${dn.y - 22}">${MOON.deg}° ${pad2(MOON.min)}'</text>`
    + "</g>";

  // THE APEX: two converging lights + the merged bloom + a soft ray burst
  out += '<g class="lcb-apex">';
  out += `<g class="lcb-apex-ray" style="transform:translate(${C.apex.x}px,${C.apex.y}px)">`
    + '<path d="M0,-46 L3.4,0 L0,46 L-3.4,0 Z" fill="url(#lcbCoreGold)"/>'
    + '<path d="M-46,0 L0,-3.4 L46,0 L0,3.4 Z" fill="url(#lcbCoreGold)"/>'
    + '<path d="M-32,-32 L1.6,-1.6 L32,32 L-1.6,1.6 Z" fill="url(#lcbCoreGold)" opacity="0.6"/>'
    + '<path d="M32,-32 L1.6,1.6 L-32,32 L-1.6,-1.6 Z" fill="url(#lcbCoreGold)" opacity="0.6"/></g>';
  out += `<circle class="lcb-apex-bloom" cx="${C.apex.x}" cy="${C.apex.y}" r="72" fill="url(#lcbApexBloom)"/>`;
  out += `<g class="lcb-apex-light lcb-apex-you"><circle r="20" fill="url(#lcbHaloWarm)"/><circle r="3" fill="url(#lcbCoreWarm)"/></g>`;
  out += `<g class="lcb-apex-light lcb-apex-petlight"><circle r="22" fill="url(#lcbHaloGold)"/><circle r="3.2" fill="url(#lcbCoreGold)"/></g>`;
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

/* THE BINDING LAW: the key word of each line is its own split unit, gold
   pre-authored on the span. Its mask-rise IS the emphasis - nothing paints
   per-frame on scroll. Reduced motion renders every key pre-lit. */
.lcb-key{color:var(--lcb-gold)}

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
/* v5 discovery: the ANSWER + INVITATION beats need real scroll room so each
   line lands with stillness between events, and the apex holds until "love"
   (no bunching, no beat-3/beat-4 bleed). */
.lcb-root:not(.lcb-memorial) .lcb-answer-scene{min-height:98svh}
.lcb-root:not(.lcb-memorial) .lcb-scene.lcb-payoff{min-height:104svh;padding-bottom:clamp(48px,10svh,120px)}
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

/* ==================================================================
   STAR CONSTELLATION STAGE (v5) - the ONE metaphor behind the passage.
   Matched to the moon's law: layered radial gradients, static filters,
   mix-blend-mode:screen over near-black, feathered edges, opacity /
   transform / stroke tweens only, HOUSE ease on every settle. Inherits
   the moon's grain + vignette + grade (it lives on the same graded sky).
   ================================================================== */
.lcb-stars-wrap{position:absolute;inset:0;z-index:1;pointer-events:none;
  display:flex;align-items:center;justify-content:center;opacity:1;will-change:opacity}
.lcb-stars{width:min(84vw,430px);height:auto;aspect-ratio:400/460;overflow:visible;isolation:isolate}
@media (max-width:768px){ .lcb-stars{width:min(90vw,356px)} }

/* every luminous layer composites like the moon's blooms */
.lcb-star .lcb-glow,.lcb-cst-line,.lcb-star .lcb-glint,.lcb-apex-light,.lcb-apex-bloom,.lcb-apex-ray{mix-blend-mode:screen}
.lcb-star{transform-box:view-box}
.lcb-star-breathe{transform-box:fill-box;transform-origin:center;will-change:transform,opacity}

/* state layers - default DIM (cool base only). GSAP drives the crossfade
   up in motion; these are the honest reduced-motion resting values. */
.lcb-glow-cool{opacity:.55}
.lcb-glow-warm{opacity:0}
.lcb-glow-gold{opacity:0}
.lcb-glint{opacity:0}
.lcb-glint-v,.lcb-glint-h{fill:rgba(255,248,228,0.9)}

/* PET star: warm-constant, alive from beat 1 (never extinguished) - the
   warmest, brightest anchor of the whole sky (their pet) */
.lcb-star.lcb-pet .lcb-glow-cool{opacity:.12}
.lcb-star.lcb-pet .lcb-glow-warm{opacity:1}
.lcb-star.lcb-pet .lcb-glint{opacity:.55}

/* breathing: transform + opacity only, staggered per star via --bd */
@keyframes lcbStarBreath{
  0%,100%{transform:scale(1);opacity:.94}
  50%    {transform:scale(1.05);opacity:1}
}
.lcb-motion .lcb-star-breathe{animation:lcbStarBreath 6.6s var(--lcb-ease) infinite;animation-delay:var(--bd,0s)}

/* constellation strokes: thin, tapered by soft glow, drawn via dashoffset */
.lcb-cst{overflow:visible}
.lcb-cst-line{fill:none;stroke:var(--lcb-gold-soft);stroke-width:0.9;stroke-linecap:round;
  vector-effect:non-scaling-stroke;opacity:0}

/* DEGREE MARK: precise tick + tiny readout on one node */
.lcb-degmark{opacity:0}
.lcb-deg-tick{stroke:var(--lcb-gold);stroke-width:1;stroke-linecap:round;vector-effect:non-scaling-stroke}
.lcb-deg-read{fill:var(--lcb-label);font-family:"Newsreader",Georgia,serif;font-weight:400;font-size:12px;letter-spacing:.05em}

/* THE APEX: two lights converge into one bloom on the word "love" */
.lcb-apex{opacity:1}
.lcb-apex-light{opacity:0}
.lcb-apex-bloom{opacity:0}
.lcb-apex-ray{opacity:0}
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

/* ---- BEAT 3 shared anchor table (discovery) --------------------------
   ONE source for the copy labels AND the seg() physics windows: the
   u-proxy is the conductor, the copy is retimed to the physics, never
   the reverse. box = the gold soul's light completes; keys = the ivory
   soul departs; waits = the moonbeam completes; meet = the contact
   frame; ascEnd = the fused light reaches the moon. */
const B3 = { box: 0.15, keys: 0.37, waits: 0.46, meet: 0.59, ascEnd: 0.95 };
// MEMORIAL beat-3 shared anchors: the crossing becomes a holding. time = the
// gold soul's light completes; weight = the ivory soul departs; room = the
// moonbeam completes; completely = the contact frame (no ascension after).
const M3 = { time: 0.20, weight: 0.36, room: 0.52, completely: 0.59 };
const UCLK = 6.8;

/* word-cascade parameter sets: keyLabel = lineStart + keyIdx*each + dur */
const HEADP = { dur: 0.9, each: 0.12 };   // short display heads
const LEADP = { dur: 0.55, each: 0.05 };  // long display lines
const SUPP = { dur: 0.45, each: 0.038 };  // support / body lines

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

    // ---------- build the star constellation stage (v5 discovery) ----------
    const starsSvg = q<SVGSVGElement>(".lcb-stars");
    if (starsSvg) starsSvg.innerHTML = buildConstellation();

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
    const starsWrap = q(".lcb-stars-wrap");

    // ---------- star-stage helpers (v5) ----------
    // one star group -> its three luminous layers + glint, addressed by class.
    // events tween these layer opacities so the visual COMPLETES as the bound
    // key word lands. warm = the "known" state; gold = "ignited"/apex.
    const starLayer = (id: string, layer: string) =>
      starsSvg ? starsSvg.querySelector<SVGGElement>(`.lcb-star.${id} .${layer}`) : null;
    const cstLines = starsSvg ? qa<SVGLineElement>(".lcb-cst-line", starsSvg) : [];
    const degMark = starsSvg ? q<SVGGElement>(".lcb-degmark", starsSvg) : null;
    // prime every star to its DIM base (cool only) - the honest starting sky
    const primeStars = () => {
      if (!starsSvg) return;
      qa<SVGGElement>(".lcb-star", starsSvg).forEach((g) => {
        if (g.classList.contains("lcb-pet")) return; // pet is warm-constant
        gsap.set(g.querySelector(".lcb-glow-cool"), { opacity: 0.55 });
        gsap.set(g.querySelector(".lcb-glow-warm"), { opacity: 0 });
        gsap.set(g.querySelector(".lcb-glow-gold"), { opacity: 0 });
        gsap.set(g.querySelector(".lcb-glint"), { opacity: 0 });
        gsap.set(g, { opacity: 0 }); // unknown stars are not yet visible
      });
      // known stars ARE visible from the start (dim, waiting to warm)
      CONSTEL.known.forEach((k) => gsap.set(q(`.lcb-star.${k.id}`, starsSvg), { opacity: 1 }));
      qa<SVGLineElement>(".lcb-cst-line", starsSvg).forEach((ln) => {
        const len = ln.getTotalLength ? ln.getTotalLength() : 200;
        ln.style.strokeDasharray = String(len);
        ln.style.strokeDashoffset = String(len);
        ln.style.opacity = "0";
      });
      if (degMark) gsap.set(degMark, { opacity: 0 });
      gsap.set(q(".lcb-apex-light", starsSvg), { opacity: 0 });
      gsap.set(q(".lcb-apex-bloom", starsSvg), { opacity: 0, scale: 0.6, transformOrigin: "center" });
      gsap.set(q(".lcb-apex-ray", starsSvg), { opacity: 0, scale: 0.4, transformOrigin: "center" });
    };
    // KNOWN ignition: cool damps, warm rises, glint appears - completes at the
    // absolute time `end` (= the key word's label time), so it lands on the word
    const igniteKnown = (tl: gsap.core.Timeline, id: string, end: number, dur = 0.6) => {
      const warm = starLayer(id, "lcb-glow-warm");
      const cool = starLayer(id, "lcb-glow-cool");
      const glint = starLayer(id, "lcb-glint");
      const at = Math.max(0, end - dur);
      if (warm) tl.to(warm, { opacity: glow(1), ease: HOUSE, duration: dur }, at);
      if (cool) tl.to(cool, { opacity: 0.22, ease: HOUSE, duration: dur }, at);
      if (glint) tl.to(glint, { opacity: glow(0.45), ease: HOUSE, duration: dur }, at);
    };
    // GOLD ignition (beat 4): gold layer + full glint flare - completes at `end`
    const igniteGold = (tl: gsap.core.Timeline, id: string, end: number, dur = 0.55) => {
      const warm = starLayer(id, "lcb-glow-warm");
      const gold = starLayer(id, "lcb-glow-gold");
      const cool = starLayer(id, "lcb-glow-cool");
      const glint = starLayer(id, "lcb-glint");
      const star = starsSvg ? starsSvg.querySelector<SVGGElement>(`.lcb-star.${id}`) : null;
      const at = Math.max(0, end - dur);
      if (star) tl.to(star, { opacity: 1, ease: HOUSE, duration: Math.min(0.3, dur) }, at);
      if (warm) tl.to(warm, { opacity: glow(1), ease: HOUSE, duration: dur }, at);
      if (cool) tl.to(cool, { opacity: 0.12, ease: HOUSE, duration: dur }, at);
      if (gold) tl.to(gold, { opacity: glow(1), ease: HOUSE, duration: dur }, at);
      if (glint) tl.to(glint, { opacity: glow(0.85), ease: HOUSE, duration: dur }, at);
    };

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
    type Mote = { sx: number; sy: number; vx: number; vy: number; r: number; a: number; c: string; cap?: number };
    const cross = {
      w: 0, h: 0, dpr: 1, mp: { x: 0, y: 0 }, dir: { x: 0, y: -1 },
      motes: [] as Mote[], lift: 0, lastU: 0,
    };
    // memorial: no camera plunge - one gentle push (1.0 -> 1.06) across the
    // whole holding, HOUSE eased. Discovery keeps the two-stage plunge;
    // push two rides beneath the ivory soul's approach (B3.keys -> B3.meet).
    const zOf = (u: number) => hush
      ? 1 + 0.06 * HOUSE(seg(u, 0.13, 0.95))
      : 1 + 0.35 * HOUSE(seg(u, B3.box, 0.30)) + 0.35 * HOUSE(seg(u, B3.keys, B3.meet)) - 0.2 * HOUSE(seg(u, B3.ascEnd, 1));
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
        crossCtx.fillStyle = "rgba(" + m.c + "," + Math.min(m.cap ?? 1, ga * m.a).toFixed(3) + ")";
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
        // AMBIENT (caged): the near-miss pair crosses the meeting point at
        // u=0.42 (inside the .39-.45 silence between the beam and the
        // contact) and keeps going. Opacity-capped at 0.35 - atmosphere,
        // never an event, always below the key events on either side.
        const mkPass = (ang: number, spd: number, perp: number): Mote => {
          const dx = Math.cos(ang), dy = Math.sin(ang);
          const px = -dy * perp, py = dx * perp;
          return {
            sx: mp.x + px - dx * spd * 0.42, sy: mp.y + py - dy * spd * 0.42,
            vx: dx * spd, vy: dy * spd, r: 1.5, a: 0.9, c: "246,240,226", cap: 0.35,
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

      // ---------- THE BINDING LAW: one reveal engine, every line ----------
      // A line is a .lcb-ln of .lcb-wd units; the key word is ONE unit,
      // wrapped at authoring time. revealLine places the word cascade and
      // stamps the key label at the exact tick the key word's rise
      // completes: lineStart + keyIdx*each + dur. Labels are the authority;
      // every bound visual is positioned relative to its label, so no
      // decimal is ever hand-typed twice.
      type Cascade = { dur: number; each: number };
      const revealLine = (
        tl: gsap.core.Timeline, ln: Element | null, at: number, label: string, p: Cascade,
      ) => {
        if (!ln) return;
        const units = qa(".lcb-wd", ln);
        if (!units.length) return;
        let keyIdx = units.findIndex((u) => u.classList.contains("lcb-key"));
        if (keyIdx < 0) keyIdx = units.length - 1;
        tl.to(units, { yPercent: 0, opacity: 1, ease: HOUSE, duration: p.dur, stagger: p.each }, at);
        tl.addLabel(label, at + keyIdx * p.each + p.dur);
      };
      // anchor mode: the line is retimed so its key completes at keyTime
      // (beat 3: the u-proxy physics conduct, the copy follows)
      const revealKey = (
        tl: gsap.core.Timeline, ln: Element | null, keyTime: number, label: string, p: Cascade,
      ) => {
        if (!ln) return;
        const units = qa(".lcb-wd", ln);
        if (!units.length) return;
        let keyIdx = units.findIndex((u) => u.classList.contains("lcb-key"));
        if (keyIdx < 0) keyIdx = units.length - 1;
        tl.to(units, { yPercent: 0, opacity: 1, ease: HOUSE, duration: p.dur, stagger: p.each },
          keyTime - keyIdx * p.each - p.dur);
        tl.addLabel(label, keyTime);
      };
      // COMPLETION mode: the visual ENDS at the label. APPEARANCE mode: the
      // fade-in completes at the label. Both = "place so it ends there".
      const endAt = (label: string, dur: number) => `${label}-=${dur}`;
      const labelTime = (tl: gsap.core.Timeline, name: string) =>
        (tl.labels as Record<string, number>)[name] ?? 0;

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
        if (hush) {
          // ---- MEMORIAL BEAT 1: RECOGNITION (past tense) ----
          // The pet star already burns warm and CONSTANT at centre (continuing
          // bonds - never extinguished). Three KNOWN stars sit dim around it
          // and ignite with a soft warm glow (glint hushed, no flare) as you
          // recall what you knew. The moon arrives sharp, slowly, carrying
          // earthshine as a persistent state. No meteor, no twinkle, no blink.
          const headLn = q(".lcb-beat:not(.lcb-support) .lcb-ln", open);
          const supLns = qa(".lcb-support .lcb-ln", open);

          // M1-L1 "No one KNEW your pet the way you did." - the moon crossfades
          // sharp over the slow arrival, completing at "knew"; earthshine + rim
          // + a faint gold warmth ride the same ramp as a persistent state.
          revealLine(t1, headLn, 0.45, "m1knew", HEADP);
          const arrive = labelTime(t1, "m1knew");
          t1.to(q(".lcb-moon-img.blur"), { opacity: 0, ease: "none", duration: arrive }, 0)
            .to(q(".lcb-moon-img.sharp"), { opacity: 1, ease: "none", duration: arrive }, 0)
            .fromTo(q(".lcb-moon"), { y: 14, scale: 1.04 }, { y: 0, scale: 1.0, ease: HOUSE, duration: 1.8 }, 0);
          t1.to(dawn, { opacity: glow(0.9), yPercent: 0, ease: HOUSE, duration: 1.5 }, 0.45);
          if (earthshine) t1.to(earthshine, { opacity: glow(0.35), duration: arrive, ease: "none" }, 0);
          if (rim) t1.to(rim, { opacity: glow(1), duration: arrive, ease: "none" }, 0);
          if (goldImg) t1.to(goldImg, { opacity: glow(0.18), duration: arrive, ease: "none" }, 0);

          // M1-L2 "You knew what they LOVED." - known star 1 ignites, a soft
          // warm glow, slower than discovery (the lower voice).
          revealLine(t1, supLns[0], 1.4, "m1loved", SUPP);
          igniteKnown(t1, "k1", labelTime(t1, "m1loved"), 0.9);

          // M1-L3 "You knew what SETTLED them." - known star 2 ignites soft warm.
          revealLine(t1, supLns[1], 2.5, "m1settled", SUPP);
          igniteKnown(t1, "k2", labelTime(t1, "m1settled"), 0.9);

          // M1-L4 "...the look they SAVED only for you." - known star 3 ignites;
          // the small warm cluster is formed around the constant pet star, and
          // the pet-star bloom gives one gentle breath.
          revealLine(t1, supLns[2], 3.7, "m1saved", SUPP);
          igniteKnown(t1, "k3", labelTime(t1, "m1saved"), 0.9);
          t1.to(bloom, { opacity: glow(0.8), duration: 0.6, ease: HOUSE }, endAt("m1saved", 0.6));
        } else {
          // ---- DISCOVERY BEAT 1: RECOGNITION ----
          // The pet star already burns warm at centre. Three KNOWN stars sit
          // dim in a tight cluster around it. As the reader is told what they
          // already know (love / settles / you), each known star ignites warm
          // beside the pet star, and the little bright cluster forms.
          const headLn = q(".lcb-beat:not(.lcb-support) .lcb-ln", open);
          const supLns = qa(".lcb-support .lcb-ln", open);

          // D1-L1 "No one KNOWS your pet the way you do." - the moon (their
          // companion) arrives sharp; the crossfade COMPLETES at "knows".
          revealLine(t1, headLn, 0.35, "b1know", HEADP);
          const arrive = labelTime(t1, "b1know");
          t1.to(q(".lcb-moon-img.blur"), { opacity: 0, ease: "none", duration: arrive }, 0)
            .to(q(".lcb-moon-img.sharp"), { opacity: 1, ease: "none", duration: arrive }, 0)
            .fromTo(q(".lcb-moon"), { y: 14, scale: 1.04 }, { y: 0, scale: 1.0, ease: HOUSE, duration: 1.3 }, 0.05);
          // AMBIENT: the dawn pool rises under everything; the moon's own
          // finish (earthshine + rim + faint warmth) settles as it arrives.
          t1.to(dawn, { opacity: 0.9, yPercent: 0, ease: HOUSE, duration: 1.25 }, 0.45);
          if (earthshine) t1.to(earthshine, { opacity: 0.35, duration: arrive, ease: "none" }, 0);
          if (rim) t1.to(rim, { opacity: 1, duration: arrive, ease: "none" }, 0);

          // D1-L2 "You know what they LOVE." - known star 1 ignites warm.
          revealLine(t1, supLns[0], 1.15, "b1love", SUPP);
          igniteKnown(t1, "k1", labelTime(t1, "b1love"));

          // D1-L3 "You know what SETTLES them." - known star 2 ignites warm.
          revealLine(t1, supLns[1], 1.95, "b1settles", SUPP);
          igniteKnown(t1, "k2", labelTime(t1, "b1settles"));

          // D1-L4 "...save only for YOU." - known star 3 ignites; the small
          // bright cluster is now formed, and the pet-star bloom breathes once.
          revealLine(t1, supLns[2], 2.75, "b1you2", SUPP);
          igniteKnown(t1, "k3", labelTime(t1, "b1you2"));
          t1.to(bloom, { opacity: 0.85, duration: 0.4, ease: HOUSE }, endAt("b1you2", 0.4));
        }
      }

      // =============== BEAT 2 - THE SEXTANT (memorial only) ===============
      const chart = q(".lcb-chart-scene");
      if (chart && sxt && hush) {
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
        // discovery carries one more body line: the clock's end is extended
        const t2 = gsap.timeline({ scrollTrigger: { trigger: lead0 || chart, start: "top 74%", endTrigger: body0 || chart, end: hush ? "bottom 56%" : "bottom 50%", scrub } });
        // the arm sweep driver (shared): ticks light via a deterministic
        // boundary walk - scrub-reversible.
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
        const MOONP = CHART.find((p) => p.key === "moon")!;
        const totalMin = MOONP.deg * 60 + MOONP.min;
        const cnt = { v: 0 };
        const applyRead = () => {
          if (!read) return;
          const c = Math.round(cnt.v);
          read.textContent = Math.floor(c / 60) + "° " + pad2(c % 60) + "'";
        };

        if (hush) {
          // ---- MEMORIAL BEAT 2: BEFORE THE LAST DAY ----
          // What was true at their beginning is still true. The instrument
          // measures gently; the number arriving on "fixed" is that fact.
          const leadLn = q(".lcb-pivot-lead .lcb-ln", chart);
          const bodyLns = qa(".lcb-pivot-body .lcb-ln", chart);

          // M2-L1 "...a first one." - the halo star arrives out of focus at
          // "first"; ONE slow half-amplitude drift-and-return in the silence.
          revealLine(t2, leadLn, 0, "m2first", LEADP);
          if (halo) t2.to(halo, { opacity: glow(0.85), duration: 0.5, ease: HOUSE }, endAt("m2first", 0.5));
          if (starG) {
            t2.to(starG, { x: 4, y: -3, duration: 0.45, ease: "sine.inOut" }, "m2first+=0.3")
              .to(starG, { x: 0, y: 0, duration: 0.4, ease: HOUSE }, "m2first+=0.75");
          }

          // M2-L2 "...of its own." - the dashed sight-line draws from the
          // moon's limb, its tip arriving on the star exactly at "own".
          revealLine(t2, bodyLns[0], 2.2, "m2own", SUPP);
          if (dashed) t2.to(dashed, { opacity: 0.55, duration: 0.1, ease: "none" }, endAt("m2own", 0.9));
          t2.to(sight, { draw: 1, duration: 0.9, ease: HOUSE, onUpdate: updateSight }, endAt("m2own", 0.9));
          t2.to({ k: 0 }, { k: 1, duration: 2.6, ease: "none", onUpdate: updateSight }, endAt("m2own", 0.9));

          // M2-L3 "...all fixed." - the compressed deploy (windup), a gentle
          // 2-degree sweep-and-settle, and the readout counts and LOCKS at
          // the real chart figure exactly at "fixed"; star snaps sharp, dashed
          // yields to solid, one glow-capped gold pulse.
          revealLine(t2, bodyLns[1], 3.2, "m2fixed", SUPP);
          if (pivot) t2.to(pivot, { opacity: 0.9, duration: 0.2, ease: HOUSE }, endAt("m2fixed", 0.75));
          if (arcEl) t2.to(arcEl, { strokeDashoffset: 0, duration: 0.4, ease: HOUSE }, endAt("m2fixed", 0.7));
          if (arm) t2.to(arm, { opacity: 0.9, duration: 0.25, ease: HOUSE }, endAt("m2fixed", 0.6));
          const tickSpanM = 0.22 + 35 * 0.011;
          t2.fromTo(ticks,
            { rotation: -8, svgOrigin: PIV, opacity: 0 },
            {
              rotation: 0, svgOrigin: PIV, duration: 0.22, ease: HOUSE,
              opacity: (i: number, el: Element) => (el as SVGLineElement).classList.contains("maj") ? 0.6 : 0.35,
              stagger: { each: 0.011, from: "end" },
            }, endAt("m2fixed", tickSpanM + 0.15));
          t2.to(armObj, { a: BEAR - 2, duration: 0.28, ease: "power2.inOut", onUpdate: applyArm }, endAt("m2fixed", 0.5));
          t2.to(armObj, { a: BEAR, duration: 0.16, ease: HOUSE, onUpdate: applyArm }, endAt("m2fixed", 0.2));
          if (read) {
            t2.to(cnt, { v: totalMin, duration: 0.35, ease: HOUSE, onUpdate: applyRead }, endAt("m2fixed", 0.35))
              .to(read, { opacity: 0.95, duration: 0.3, ease: "none" }, endAt("m2fixed", 0.35));
          }
          if (halo) t2.to(halo, { opacity: glow(0.3), duration: 0.3, ease: "none" }, "m2fixed");
          if (diamond) t2.to(diamond, { opacity: 1, duration: 0.3, ease: HOUSE }, "m2fixed");
          if (starG) {
            t2.to(starG, { scale: 1.16, duration: 0.15, ease: "none", svgOrigin: S.x + " " + S.y }, "m2fixed")
              .to(starG, { scale: 1, duration: 0.2, ease: HOUSE }, "m2fixed+=0.15");
          }
          t2.to(sight, { solid: 1, duration: 0.3, ease: HOUSE, onUpdate: updateSight }, "m2fixed");
          if (solid) t2.to(solid, { opacity: 0.65, duration: 0.05, ease: "none" }, "m2fixed");
          if (dashed) t2.to(dashed, { opacity: 0, duration: 0.35, ease: "none" }, "m2fixed");
          if (bloomGold) {
            t2.to(bloomGold, { opacity: glow(0.5), duration: 0.2, ease: "none" }, "m2fixed")
              .to(bloomGold, { opacity: 0, duration: 0.35, ease: "none" }, "m2fixed+=0.2");
          }

          // M2-L4 "...that beginning." - the instrument grace-recedes,
          // completing at "beginning", while the fixed star and the solid
          // line PERSIST untouched. The scaffolding leaves; what it measured
          // stays. That is the sentence, drawn.
          revealLine(t2, bodyLns[2], 4.2, "m2begin", SUPP);
          if (inst) t2.to(inst, { opacity: 0.28, y: 8, duration: 0.6, ease: HOUSE }, endAt("m2begin", 0.6));
        } else {
          // ---- DISCOVERY BEAT 2: THE UNNAMED PART, MEASURED ----
          const leadLn = q(".lcb-pivot-lead .lcb-ln", chart);
          const bodyLns = qa(".lcb-pivot-body .lcb-ln", chart);

          // D2-L1 "Their chin finds the same corner of the sofa. EVERY
          // TIME." - the halo star fades up out of focus, drifts off its
          // mark, and returns to the exact same point, arriving at "every
          // time". One more quiet drift-and-return in the silence after.
          revealLine(t2, leadLn, 0, "b2every", LEADP);
          if (halo) t2.to(halo, { opacity: glow(0.85), duration: 0.3, ease: HOUSE }, 0);
          if (starG) {
            t2.to(starG, { x: 7, y: -5, duration: 0.3, ease: "sine.inOut" }, endAt("b2every", 0.66))
              .to(starG, { x: 0, y: 0, duration: 0.36, ease: HOUSE }, endAt("b2every", 0.36))
              .to(starG, { x: -4, y: 3, duration: 0.3, ease: "sine.inOut" }, "b2every+=0.15")
              .to(starG, { x: 0, y: 0, duration: 0.3, ease: HOUSE }, "b2every+=0.45");
          }

          // D2-L2 "...Nobody taught them THAT." - the dashed sight-line
          // draws from the moon's limb, its tip arriving on the star (the
          // unexplained thing, singled out) exactly at "that".
          revealLine(t2, bodyLns[0], 1.3, "b2that", SUPP);
          if (dashed) t2.to(dashed, { opacity: 0.55, duration: 0.1, ease: "none" }, endAt("b2that", 0.9));
          t2.to(sight, { draw: 1, duration: 0.8, ease: HOUSE, onUpdate: updateSight }, endAt("b2that", 0.8));
          // keep the moon end tracking through the whole measurement
          t2.to({ k: 0 }, { k: 1, duration: 3.2, ease: "none", onUpdate: updateSight }, endAt("b2that", 0.8));

          // D2-L3 "...stood at an exact ADDRESS." - the instrument deploys:
          // pivot dot, graduated limb arc, all 36 ticks deal out, the FINAL
          // tick landing exactly at "address" (the numbered street of the
          // sky, built as the word names it).
          revealLine(t2, bodyLns[1], 2.3, "b2addr", SUPP);
          if (pivot) t2.to(pivot, { opacity: 0.9, duration: 0.2, ease: HOUSE }, endAt("b2addr", 1.05));
          if (arcEl) t2.to(arcEl, { strokeDashoffset: 0, duration: 0.4, ease: HOUSE }, endAt("b2addr", 1.0));
          if (arm) t2.to(arm, { opacity: 0.9, duration: 0.25, ease: HOUSE }, endAt("b2addr", 0.85));
          const tickSpan = 0.22 + 35 * 0.011;
          t2.fromTo(ticks,
            { rotation: -8, svgOrigin: PIV, opacity: 0 },
            {
              rotation: 0, svgOrigin: PIV, duration: 0.22, ease: HOUSE,
              opacity: (i: number, el: Element) => (el as SVGLineElement).classList.contains("maj") ? 0.6 : 0.35,
              stagger: { each: 0.011, from: "end" },
            }, endAt("b2addr", tickSpan));

          // D2-L4 "Measured to the DEGREE." - the windup rides the silence
          // after L3: the index arm sweeps 4 degrees PAST the bearing,
          // settles back true, and the readout counts up and LOCKS at the
          // real chart figure exactly at "degree". Completion suite on the
          // same label: star snaps sharp, dashed yields to solid, one
          // capped gold bloom pulse. The rest of the line reveals over the
          // locked, still instrument.
          revealLine(t2, bodyLns[2], 3.5, "b2deg", SUPP);
          t2.to(armObj, { a: BEAR - 4, duration: 0.3, ease: "power2.inOut", onUpdate: applyArm }, endAt("b2deg", 0.5));
          t2.to(armObj, { a: BEAR, duration: 0.16, ease: HOUSE, onUpdate: applyArm }, endAt("b2deg", 0.2));
          if (read) {
            t2.to(cnt, { v: totalMin, duration: 0.35, ease: HOUSE, onUpdate: applyRead }, endAt("b2deg", 0.35))
              .to(read, { opacity: 0.95, duration: 0.3, ease: "none" }, endAt("b2deg", 0.35));
          }
          if (halo) t2.to(halo, { opacity: glow(0.3), duration: 0.3, ease: "none" }, "b2deg");
          if (diamond) t2.to(diamond, { opacity: 1, duration: 0.3, ease: HOUSE }, "b2deg");
          if (starG) {
            t2.to(starG, { scale: 1.16, duration: 0.15, ease: "none", svgOrigin: S.x + " " + S.y }, "b2deg")
              .to(starG, { scale: 1, duration: 0.2, ease: HOUSE }, "b2deg+=0.15");
          }
          t2.to(sight, { solid: 1, duration: 0.3, ease: HOUSE, onUpdate: updateSight }, "b2deg");
          if (solid) t2.to(solid, { opacity: 0.65, duration: 0.05, ease: "none" }, "b2deg");
          if (dashed) t2.to(dashed, { opacity: 0, duration: 0.35, ease: "none" }, "b2deg");
          if (bloomGold) {
            t2.to(bloomGold, { opacity: glow(0.5), duration: 0.2, ease: "none" }, "b2deg")
              .to(bloomGold, { opacity: 0, duration: 0.35, ease: "none" }, "b2deg+=0.2");
          }
          // grace exit in the tail silence: the instrument recedes; the
          // fixed star and the solid line PERSIST.
          if (inst) t2.to(inst, { opacity: 0.28, y: 8, duration: 0.6, ease: HOUSE }, "b2deg+=0.55");
        }
      }

      // =============== BEAT 2 - THE GAP (discovery star stage) ===============
      // The parts they cannot explain. The dim UNKNOWN stars fade in around
      // the bright cluster (visible, still unlit), then pulse faintly - named
      // by no one. This is the curiosity gap made visible.
      const gapScene = q(".lcb-gap-scene");
      if (gapScene && starsSvg) {
        const leadLn = q(".lcb-pivot-lead .lcb-ln", gapScene);
        const bodyLns = qa(".lcb-pivot-body .lcb-ln", gapScene);
        const unknownG = CONSTEL.unknown.map((u) => q<SVGGElement>(`.lcb-star.${u.id}`, starsSvg));
        const unknownCool = CONSTEL.unknown.map((u) => starLayer(u.id, "lcb-glow-cool"));
        const tg = gsap.timeline({
          scrollTrigger: { trigger: gapScene, start: "top 74%", end: hush ? "bottom 50%" : "bottom 52%", scrub },
        });
        const appDur = hush ? 0.8 : 0.6;
        const step = hush ? 0.09 : 0.06;

        // G2-L1 "...never quite UNDERSTOOD." / "...still more of them to KNOW."
        // - the 4 dim UNKNOWN stars appear around the cluster (visible, still
        // unlit), completing (faded in) exactly at the lead key.
        const leadKey = hush ? "m2know" : "b2understood";
        revealLine(tg, leadLn, 0, leadKey, LEADP);
        const uT = labelTime(tg, leadKey);
        unknownG.forEach((g, i) => {
          if (g) tg.to(g, { opacity: glow(1), ease: HOUSE, duration: appDur }, Math.max(0, uT - appDur) + i * step);
        });

        // a soft faint pulse across the dim stars on each body key - no new
        // element, just a glimmer. The gap opens; nothing answers it yet.
        const pulse = (ln: Element | null, at: number, label: string) => {
          revealLine(tg, ln, at, label, SUPP);
          const t = labelTime(tg, label);
          unknownCool.forEach((c, i) => {
            if (!c) return;
            tg.to(c, { opacity: glow(0.85), duration: 0.3, ease: "sine.inOut" }, Math.max(0, t - 0.3) + i * 0.03)
              .to(c, { opacity: 0.55, duration: 0.45, ease: HOUSE }, t + 0.05 + i * 0.03);
          });
        };
        if (hush) {
          // M2-L2 "Parts you felt but never had WORDS for."
          pulse(bodyLns[0], 1.5, "m2words");
        } else {
          // G2-L2 "...the way they ARE."   G2-L3 "...if they COULD."
          pulse(bodyLns[0], 1.3, "b2are");
          pulse(bodyLns[1], 2.2, "b2could");
        }
      }

      // =============== BEAT 3 - OUT OF EVERYTHING (memorial only) ===============
      // One proxy clock drives draw(u); every position is a pure function of
      // u, so the scrub reverses for free. Discovery line anchors read the
      // shared B3 table: box .15 / keys .37 / waits .46 / meet .59.
      const soulsScene = q(".lcb-souls-scene");
      const souls = q(".lcb-souls-hold");
      if (souls && soulsScene && hush) {
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

          // the seg() physics windows read the shared anchor table on the
          // discovery path (the u-proxy conducts; the copy is retimed to
          // the physics). Memorial keeps its own windows until commit 2.
          const AN = hush
            ? { pop: [M3.time - 0.04, M3.time], petDraw: [M3.time, 0.34], petTravel: [M3.time, 0.35], breathe: [0.35, 0.58], hPop: [M3.weight - 0.04, M3.weight], hMove: [M3.weight, M3.completely], hDraw: [0.20, M3.weight], beam: [0.31, M3.room], meet: M3.completely }
            : { pop: [B3.box - 0.04, B3.box], petDraw: [B3.box, 0.30], petTravel: [B3.box, 0.33], breathe: [0.33, 0.56], hPop: [B3.keys - 0.04, B3.keys], hMove: [B3.keys, B3.meet], hDraw: [0.35, 0.55], beam: [0.31, B3.waits], meet: B3.meet };

          let contactFired = false;
          const draw3 = (u: number) => {
            crossDraw(u);
            // the only camera plunge on the page: canvas + SVG lock to one z
            if (zoom) gsap.set(zoom, { scale: zOf(u) });
            // hero trails draw in, visibly bending toward one point
            gsap.set(petPath, { strokeDashoffset: pLen * (1 - HOUSE(seg(u, AN.petDraw[0], AN.petDraw[1]))) });
            gsap.set(humanPath, { strokeDashoffset: hLen * (1 - HOUSE(seg(u, AN.hDraw[0], AN.hDraw[1]))) });
            // the gold soul arrives and PARKS at the meeting point, waiting
            // and breathing while the ivory light is still travelling
            const fadeOut = 1 - seg(u, AN.meet, 0.62);
            const pp = atT(pPts, HOUSE(seg(u, AN.petTravel[0], AN.petTravel[1])));
            const b = seg(u, AN.breathe[0], AN.breathe[1]);
            const pScale = 1 + 0.05 * (1 - Math.cos(4 * Math.PI * b)) / 2;
            gsap.set(headP, { x: pp.x, y: pp.y, scale: pScale, transformOrigin: "center", opacity: seg(u, AN.pop[0], AN.pop[1]) * fadeOut });
            // the ivory soul departs as the keys land, then decelerates in
            const s2 = seg(u, AN.hMove[0], AN.hMove[1]);
            const hp = atT(hPts, 1 - (1 - s2) * (1 - s2));
            gsap.set(headH, { x: hp.x, y: hp.y, opacity: seg(u, AN.hPop[0], AN.hPop[1]) * fadeOut });
            // the moonbeam finds the spot (memorial: glow cap 0.7 - a holding)
            if (beam) gsap.set(beam, { opacity: glow(0.35) * HOUSE(seg(u, AN.beam[0], AN.beam[1])), scaleY: 0.6 + 0.4 * HOUSE(seg(u, AN.beam[0], AN.beam[1])) });
            // CONTACT at u = B3.meet - the exact frame "meet" lands.
            // Memorial: no ascension - the fused light STAYS at the meeting
            // point inside the beam, held. That happened, completely.
            const asc2 = hush ? 0 : HOUSE(seg(u, 0.62, B3.ascEnd));
            gsap.set(headOne, {
              x: 200 + cross.dir.x * 260 * asc2 - 200, y: 178 + cross.dir.y * 260 * asc2 - 178,
              scale: 0.7 + 0.3 * HOUSE(seg(u, AN.meet, 0.63)), transformOrigin: "center",
              opacity: seg(u, AN.meet, 0.63) * (hush ? 1 : 1 - seg(u, B3.ascEnd, 0.995)),
            });
            if (threadE) gsap.set(threadE, { strokeDashoffset: 260 * (1 - asc2), opacity: hush ? 0 : 0.85 * seg(u, 0.62, 0.66) });
            // the moon receives: one breath as the light reaches its rim
            if (bloom && !hush) gsap.set(bloom, { scale: 1 + 0.06 * Math.sin(Math.PI * seg(u, B3.ascEnd, 1)) });
            // the one play-once accent: iris + mote lift, guarded, fired on
            // the contact frame itself (u IS the label on this clock).
            // Memorial: never - no iris, no lift. Stillness holds.
            if (!hush && u >= AN.meet && !contactFired) {
              contactFired = true;
              if (irisE) gsap.fromTo(irisE, { opacity: 0.8, scale: 0.2 }, { opacity: 0, scale: 1, duration: 0.9, ease: HOUSE, transformOrigin: "center" });
              gsap.timeline()
                .to(cross, { lift: 0.3, duration: 0.18, ease: "power2.out", onUpdate: () => crossDraw(cross.lastU) }, 0)
                .to(cross, { lift: 0, duration: 0.4, ease: HOUSE, onUpdate: () => crossDraw(cross.lastU) }, 0.2);
            }
          };

          const t3 = gsap.timeline({ scrollTrigger: { trigger: soulsScene, start: "top 80%", end: "bottom 40%", scrub } });
          const uP = { u: 0 };
          t3.to(uP, { u: 1, ease: "none", duration: UCLK, onUpdate: () => draw3(uP.u) }, 0);
          if (hush) {
            // ---- MEMORIAL BEAT 3: THE HOLDING ----
            // The u-proxy conducts; each key completes on its M3 physics
            // anchor. "time" = the gold soul's light completes; "weight" =
            // the ivory soul departs; "room" = the moonbeam completes; and
            // "completely" IS the contact frame. No ascension - the fused
            // light STAYS at the meeting point, held. Continuing Bonds.
            revealKey(t3, lines[0], UCLK * M3.time, "m3time", SUPP);
            revealKey(t3, lines[1], UCLK * M3.weight, "m3weight", SUPP);
            revealKey(t3, lines[2], UCLK * M3.room, "m3room", SUPP);
            revealKey(t3, lines[3], UCLK * M3.completely, "m3done", SUPP);
          } else {
            // ---- DISCOVERY BEAT 3: THE IMPROBABLE CROSSING ----
            // Every line is retimed so its key word completes on the
            // physics anchor: "box" = the gold light's fade completes far
            // out; "Keys" = the ivory light's fade completes and the
            // approach begins; "waits" = the moonbeam completes over the
            // parked, breathing gold soul; "meet" = the contact frame.
            // The ascension after "meet" is total silence.
            revealKey(t3, lines[0], UCLK * B3.box, "b3box", SUPP);
            revealKey(t3, lines[1], UCLK * B3.keys, "b3keys", SUPP);
            revealKey(t3, lines[2], UCLK * B3.waits, "b3waits", SUPP);
            revealKey(t3, lines[3], UCLK * B3.meet, "b3meet", SUPP);
          }
        }
      }

      // =============== BEAT 3 - THE ANSWER (discovery star stage) ===============
      // It all began the day they were born. The constellation web draws
      // between every star (born -> read), a degree mark snaps onto one node
      // (exact), and it completes - still DIM, a real map no one has read.
      const answerScene = q(".lcb-answer-scene");
      if (answerScene && starsSvg && cstLines.length) {
        const aLns = qa(".lcb-souls-text .lcb-ln", answerScene);
        const ta = gsap.timeline({
          scrollTrigger: { trigger: answerScene, start: "top 82%", end: hush ? "bottom 52%" : "bottom 54%", scrub },
        });

        // place the three lines first so their key labels exist. Memorial
        // draws gently - the same web, a slower hand, fainter strokes.
        revealLine(ta, aLns[0], 0.2, "b3born", SUPP);
        revealLine(ta, aLns[1], hush ? 1.7 : 1.5, "b3exact", SUPP);
        revealLine(ta, aLns[2], hush ? 3.0 : 2.7, "b3read", SUPP);

        // A3-L1..L3 the web draws from "born" and completes at "read"
        const drawStart = labelTime(ta, "b3born");
        const drawEnd = labelTime(ta, "b3read");
        const n = cstLines.length;
        const drawDur = Math.max(0.4, Math.min(hush ? 1.1 : 0.9, (drawEnd - drawStart) * 0.42));
        const spread = Math.max(0.001, drawEnd - drawDur - drawStart);
        cstLines.forEach((ln, i) => {
          const at = drawStart + spread * (i / Math.max(1, n - 1));
          ta.to(ln, { opacity: glow(0.7), duration: 0.14, ease: "none" }, at);
          ta.to(ln, { strokeDashoffset: 0, duration: drawDur, ease: HOUSE }, at);
        });

        // A3-L2 "...an EXACT place." - the degree mark snaps onto its node
        if (degMark) {
          const dn = CONSTEL.known.find((k) => k.id === CONSTEL.degNode) || CONSTEL.pet;
          gsap.set(degMark, { transformOrigin: `${dn.x}px ${dn.y}px` });
          ta.fromTo(degMark, { opacity: 0, scale: 0.68 },
            { opacity: 1, scale: 1, ease: HOUSE, duration: hush ? 0.5 : 0.42 }, endAt("b3exact", hush ? 0.5 : 0.42));
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
        // both registers split "Set the chart." as a single word unit (the
        // .lcb-asc span), so the global word preset already hides it

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

        if (hush) {
          // ---- MEMORIAL BEAT 4: INVITATION - THE RESTING ----
          // The reading opens who they were. The dim UNKNOWN stars ignite a
          // soft gold, one by one; then on "loved", the two lights (you +
          // their pet) draw close and REST side by side - held, not merged.
          // Continuing bonds: they remain two, together. Then the eye hands
          // into the form. Its own payoff-scoped clock so each line lands with
          // real stillness and the resting holds until "loved".
          const headLn = q(".lcb-payoff-line:not(.lcb-close) .lcb-ln", payoff);
          const supLns = qa(".lcb-support .lcb-ln", payoff);
          const closeLns = qa(".lcb-close .lcb-ln", payoff);
          const t4m = gsap.timeline({
            scrollTrigger: { trigger: payoff, start: "top 60%", end: "bottom 38%", scrub },
          });

          revealLine(t4m, headLn, 0.3, "m4opens", LEADP);     // "...OPENS who they were."
          revealLine(t4m, supLns[0], 2.2, "m4made", SUPP);     // "What made them, THEM."
          revealLine(t4m, supLns[1], 4.1, "m4loved", SUPP);    // "Why they LOVED you..."
          revealLine(t4m, closeLns[0], 6.4, "m4chart", LEADP); // "Set the chart."

          // "OPENS" - the dim stars begin a soft gold ignition, one by one
          igniteGold(t4m, "u1", labelTime(t4m, "m4opens"), 0.7);
          igniteGold(t4m, "u4", labelTime(t4m, "m4opens") + 0.5, 0.7);
          // "made them, THEM." - the next dim star warms to gold, gently
          igniteGold(t4m, "u2", labelTime(t4m, "m4made"), 0.7);
          // "LOVED" - the last dim star warms as the two lights come to rest
          igniteGold(t4m, "u3", labelTime(t4m, "m4loved") - 0.3, 0.7);

          // THE RESTING on "LOVED": the two lights glide close and settle side
          // by side (offset, not one point) - no merge, no ray burst, no flash.
          // A faint shared warmth rises softly between them and holds.
          const apexYou = starsSvg.querySelector<SVGGElement>(".lcb-apex-you");
          const apexPet = starsSvg.querySelector<SVGGElement>(".lcb-apex-petlight");
          const apexBloom = starsSvg.querySelector<SVGCircleElement>(".lcb-apex-bloom");
          const AX = CONSTEL.apex;
          const lovedT = labelTime(t4m, "m4loved");
          if (apexYou && apexPet) {
            gsap.set(apexYou, { x: 72, y: 302, opacity: 0 });
            gsap.set(apexPet, { x: 212, y: 250, opacity: 0 });
            gsap.set(apexBloom, { opacity: 0, scale: 0.7, transformOrigin: "center" });
            // they appear, unhurried, then drift toward each other
            t4m.to(apexYou, { opacity: glow(1), duration: 0.7, ease: HOUSE }, lovedT - 1.9);
            t4m.to(apexPet, { opacity: glow(1), duration: 0.7, ease: HOUSE }, lovedT - 1.9);
            const glide = 1.7;
            t4m.to(apexYou, { x: AX.x - 15, y: AX.y + 2, ease: HOUSE, duration: glide }, lovedT - glide);
            t4m.to(apexPet, { x: AX.x + 15, y: AX.y - 2, ease: HOUSE, duration: glide }, lovedT - glide);
            // a faint shared warmth rises and HOLDS (no yoyo flash on arrival)
            if (apexBloom) t4m.to(apexBloom, { opacity: glow(0.5), scale: 1.0, duration: 1.1, ease: HOUSE }, lovedT - 0.5);
          }

          // "Set the chart." lights gold; the rule draws underneath; the
          // resting pair gives one last gentle breath as the eye hands in.
          t4m.call(() => { if (asc) asc.classList.add("lit"); }, [], "m4chart+=0.15");
          if (rule) t4m.fromTo(rule, { scaleX: 0 }, { scaleX: 1, ease: HOUSE, duration: 1.0 }, "m4chart+=0.2");
          if (apexBloom) t4m.to(apexBloom, { opacity: glow(0.42), duration: 1.1, ease: "sine.inOut", yoyo: true, repeat: 1 }, "m4chart");

          // keep the form crest reaching its docked final state (page-side)
          if (crestEl) {
            t4m.call(() => {
              if (!crestEl || crestEl.classList.contains("lcb-docked")) return;
              if (t4m.scrollTrigger && t4m.scrollTrigger.direction < 0) return;
              crestEl.classList.add("lcb-docked");
            }, [], "m4chart");
          }
        } else {
          // ---- DISCOVERY BEAT 4: THE INVITATION - THE APEX ----
          // The reading opens it. The dim UNKNOWN stars ignite gold one by
          // one; then, on "love", two lights (you + their pet) glide together
          // and MERGE into one bloom - the emotional peak - and hand into form.
          // Its OWN payoff-scoped clock (not the far crest) so each line lands
          // with real stillness and the apex holds until "love".
          const headLn = q(".lcb-payoff-line:not(.lcb-close) .lcb-ln", payoff);
          const supLns = qa(".lcb-support .lcb-ln", payoff);
          const closeLns = qa(".lcb-close .lcb-ln", payoff);
          const t4d = gsap.timeline({
            scrollTrigger: { trigger: payoff, start: "top 60%", end: "bottom 38%", scrub },
          });

          revealLine(t4d, headLn, 0.3, "b4opens", LEADP);     // "...OPENS it..."
          revealLine(t4d, supLns[0], 1.9, "b4are", SUPP);      // "Who they ARE."
          revealLine(t4d, supLns[1], 3.4, "b4need", SUPP);     // "What they NEED."
          revealLine(t4d, supLns[2], 5.1, "b4love", SUPP);     // "Why they LOVE you..."
          revealLine(t4d, closeLns[0], 7.2, "b4chart", LEADP); // "Set the chart."

          // "OPENS" - the dim stars begin igniting gold, one by one
          igniteGold(t4d, "u1", labelTime(t4d, "b4opens"));
          igniteGold(t4d, "u4", labelTime(t4d, "b4opens") + 0.4);
          // "ARE" - one flares gold. "NEED" - the next flares gold.
          igniteGold(t4d, "u2", labelTime(t4d, "b4are"));
          igniteGold(t4d, "u3", labelTime(t4d, "b4need"));

          // THE APEX on "LOVE": two lights become one bloom of light.
          if (starsSvg) {
            const apexYou = q(".lcb-apex-you", starsSvg);
            const apexPet = q(".lcb-apex-petlight", starsSvg);
            const apexBloom = q(".lcb-apex-bloom", starsSvg);
            const apexRay = q(".lcb-apex-ray", starsSvg);
            const AX = CONSTEL.apex;
            const loveT = labelTime(t4d, "b4love");
            gsap.set(apexYou, { x: 72, y: 302, opacity: 0 });
            gsap.set(apexPet, { x: 212, y: 250, opacity: 0 });
            gsap.set(apexBloom, { opacity: 0, scale: 0.6, transformOrigin: "center" });
            gsap.set(apexRay, { opacity: 0, scale: 0.4, transformOrigin: "center" });
            // stillness after "need", THEN the two lights appear and rush in
            if (apexYou) t4d.to(apexYou, { opacity: 1, duration: 0.5, ease: HOUSE }, loveT - 1.5);
            if (apexPet) t4d.to(apexPet, { opacity: 1, duration: 0.5, ease: HOUSE }, loveT - 1.5);
            // they GLIDE toward each other, arriving together exactly at "love"
            const glide = 1.2;
            if (apexYou) t4d.to(apexYou, { x: AX.x, y: AX.y, ease: HOUSE, duration: glide }, loveT - glide);
            if (apexPet) t4d.to(apexPet, { x: AX.x, y: AX.y, ease: HOUSE, duration: glide }, loveT - glide);
            // MERGE: the bloom rises as they meet, a soft ray burst flashes,
            // the two lights fade into the single light. Lens-quality, eased.
            if (apexBloom) {
              t4d.to(apexBloom, { opacity: 1, scale: 1.28, duration: 0.42, ease: HOUSE }, loveT - 0.42)
                .to(apexBloom, { scale: 1.04, duration: 0.5, ease: HOUSE }, loveT);
            }
            if (apexRay) {
              t4d.to(apexRay, { opacity: 0.9, scale: 1.0, duration: 0.28, ease: "power2.out" }, loveT - 0.28)
                .to(apexRay, { opacity: 0, scale: 1.25, duration: 0.55, ease: HOUSE }, loveT);
            }
            if (apexYou) t4d.to(apexYou, { opacity: 0, duration: 0.3, ease: "none" }, loveT);
            if (apexPet) t4d.to(apexPet, { opacity: 0, duration: 0.3, ease: "none" }, loveT);
            // the moon receives the light: one breath as the bloom crests
            const bloomM = q(".lcb-moon-bloom");
            if (bloomM) t4d.to(bloomM, { opacity: 1, duration: 0.3, ease: "power2.in" }, loveT)
              .to(bloomM, { opacity: 0.7, duration: 0.5, ease: HOUSE }, loveT + 0.3);
            // "Set the chart." - the merged light settles and glows; the line
            // lights gold and the rule draws underneath, handing into the form
            if (apexBloom) t4d.to(apexBloom, { opacity: 0.82, duration: 0.9, ease: "sine.inOut", yoyo: true, repeat: 1 }, "b4chart");
          }

          // "Set the chart." lights gold, then the rule draws underneath
          t4d.call(() => { if (asc) asc.classList.add("lit"); }, [], "b4chart+=0.15");
          if (rule) t4d.fromTo(rule, { scaleX: 0 }, { scaleX: 1, ease: HOUSE, duration: 0.5 }, "b4chart+=0.2");
          // the moon's old seal-arc stays retired in discovery v5 (the apex is
          // the payoff). Keep the form crest reaching its docked final state.
          if (crestEl) {
            t4d.call(() => {
              if (!crestEl || crestEl.classList.contains("lcb-docked")) return;
              if (t4d.scrollTrigger && t4d.scrollTrigger.direction < 0) return;
              crestEl.classList.add("lcb-docked");
            }, [], "b4chart");
          }
        }
      }

      // ========== SPINE 2 - THE MOON RETIRES AT THE REVEAL ==========
      // After the passage the moon hangs above the seal card, waiting. Then
      // it RETIRES: it slips upward and dims out entirely before the
      // reveal's top edge, and it never appears below that line on any
      // breakpoint. Below the reveal the sky belongs to the chart; checkout
      // keeps only the dawn horizon glow (the fixed-stage gradient).
      // Functional values + invalidateOnRefresh so the post-submit reveal
      // growth only needs ScrollTrigger.refresh() to re-measure the spine.
      const orrery2 = document.querySelector("#computed-sky");
      if (travel && orrery2) {
        const W2 = () => window.innerWidth, H2 = () => window.innerHeight;
        const spine = gsap.timeline({
          scrollTrigger: { trigger: orrery2, start: "top bottom", end: "top 35%", scrub, invalidateOnRefresh: true },
        });
        // leg 4 - hang above the form, waiting. Explicit "from" = leg 3's end so
        // the two scrubbed timelines hand the moon over without a seam.
        spine.fromTo(travel,
          { x: () => 0.05 * W2() * amp, y: () => -0.11 * H2() * amp },
          { x: () => (mobile ? -0.36 : -0.44) * W2(), y: () => 0.18 * H2(), ease: HOUSE, duration: 1, immediateRender: false }, 0.001)
          // leg 5 - retire: drift up, shrink a breath, dim to nothing. The
          // star constellation retires WITH the moon (it never wanders below
          // the passage, especially on mobile - the v5 retirement law).
          .to(travel, { y: () => 0.04 * H2(), ease: "none", duration: 0.8 }, 1.001)
          .to(moonEl, { scale: 0.86, ease: "none", duration: 0.8 }, 1.001)
          .to(moonEl, { opacity: 0, ease: "none", duration: 0.8 }, 1.001);
        if (starsWrap) spine.to(starsWrap, { opacity: 0, ease: "none", duration: 0.7 }, 0.4);

        // the dossier CTA still takes up the thread once it arrives (a
        // page-side breath, not a moon effect)
        const threadCta = document.querySelector<HTMLElement>("#begin .dsr-card .dsr-cta");
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
          // v5 star stage: the honest FINAL frame - every known star warm, the
          // unknown stars ignited, constellation drawn, degree mark set.
          // Discovery merges the two lights into one bloom; memorial rests them
          // side by side (held, not merged). No ignition sequence, no glide.
          if (starsSvg) {
            CONSTEL.known.forEach((k) => {
              const g = starsSvg.querySelector<SVGGElement>(`.lcb-star.${k.id}`);
              if (!g) return;
              gsap.set(g, { opacity: 1 });
              gsap.set(g.querySelector(".lcb-glow-cool"), { opacity: 0.22 });
              gsap.set(g.querySelector(".lcb-glow-warm"), { opacity: glow(1) });
              gsap.set(g.querySelector(".lcb-glint"), { opacity: glow(0.45) });
            });
            CONSTEL.unknown.forEach((u) => {
              const g = starsSvg.querySelector<SVGGElement>(`.lcb-star.${u.id}`);
              if (!g) return;
              gsap.set(g, { opacity: 1 });
              gsap.set(g.querySelector(".lcb-glow-cool"), { opacity: 0.12 });
              gsap.set(g.querySelector(".lcb-glow-warm"), { opacity: glow(1) });
              gsap.set(g.querySelector(".lcb-glow-gold"), { opacity: glow(1) });
              gsap.set(g.querySelector(".lcb-glint"), { opacity: glow(0.85) });
            });
            cstLines.forEach((ln) => { ln.style.strokeDashoffset = "0"; ln.style.opacity = String(glow(0.7)); });
            if (degMark) gsap.set(degMark, { opacity: 1 });
            const apexYou = starsSvg.querySelector<SVGGElement>(".lcb-apex-you");
            const apexPet = starsSvg.querySelector<SVGGElement>(".lcb-apex-petlight");
            const apexBloom = starsSvg.querySelector<SVGCircleElement>(".lcb-apex-bloom");
            const apexRay = starsSvg.querySelector<SVGGElement>(".lcb-apex-ray");
            const AX = CONSTEL.apex;
            if (apexRay) gsap.set(apexRay, { opacity: 0 });
            if (hush) {
              // memorial: the two lights rest side by side, held (not merged)
              if (apexYou) gsap.set(apexYou, { x: AX.x - 15, y: AX.y + 2, opacity: glow(1) });
              if (apexPet) gsap.set(apexPet, { x: AX.x + 15, y: AX.y - 2, opacity: glow(1) });
              if (apexBloom) gsap.set(apexBloom, { opacity: glow(0.42), scale: 1, transformOrigin: "center" });
            } else {
              // discovery: the two lights have merged into one bloom
              if (apexYou) gsap.set(apexYou, { opacity: 0 });
              if (apexPet) gsap.set(apexPet, { opacity: 0 });
              if (apexBloom) gsap.set(apexBloom, { opacity: 0.82, scale: 1, transformOrigin: "center" });
            }
          }
          if (hush) {
            const rimEl = q(".lcb-moon-rim"); if (rimEl) gsap.set(rimEl, { opacity: glow(1) });
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
        // prime the star constellation to its dim starting sky (discovery)
        primeStars();

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
        {/* v5 STAR CONSTELLATION STAGE - one graded sky behind the passage,
            built at setup, every event bound to a key word. Both registers:
            discovery ignites and merges; memorial rests the two lights. */}
        <div className="lcb-stars-wrap" aria-hidden="true">
          <svg className="lcb-stars" viewBox="0 0 400 460" preserveAspectRatio="xMidYMid meet" />
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
            {/* MEMORIAL BEAT 1 - RECOGNITION (past tense): the pet star burns
                warm and constant; three known stars ignite softly as you
                recall what you knew (loved / settled / saved). */}
            <div className="lcb-scene lcb-open">
              <div className="lcb-dawn" aria-hidden="true" />
              <p className="lcb-beat lcb-split"><span className="lcb-ln">No one <span className="lcb-key">knew</span> your pet the way you did.</span></p>
              <p className="lcb-beat lcb-support lcb-split">
                <span className="lcb-ln">You knew what they <span className="lcb-key">loved.</span></span>
                <span className="lcb-ln">You knew what <span className="lcb-key">settled</span> them.</span>
                <span className="lcb-ln">You knew the look they <span className="lcb-key">saved</span> only for you.</span>
              </p>
            </div>

            {/* MEMORIAL BEAT 2 - GAP: there is still more of them to know. The
                dim unknown stars fade in around the cluster, then pulse. */}
            <div className="lcb-scene lcb-chart-scene lcb-gap-scene">
              <p className="lcb-pivot-lead lcb-split">
                <span className="lcb-ln">And there is still more of them to <span className="lcb-key">know.</span></span>
              </p>
              <div className="lcb-chart-copy">
                <p className="lcb-pivot-body lcb-split">
                  <span className="lcb-ln">Parts you felt but never had <span className="lcb-key">words</span> for.</span>
                </p>
              </div>
            </div>

            {/* MEMORIAL BEAT 3 - ANSWER: it all began the day they were born.
                The constellation draws gently between every star, a degree
                mark snaps on one node, then it completes, still there. */}
            <div className="lcb-scene lcb-souls-scene lcb-answer-scene">
              <p className="lcb-beat lcb-support lcb-souls-text lcb-split">
                <span className="lcb-ln">It all began the day they were <span className="lcb-key">born.</span></span>
                <span className="lcb-ln">The sky that day was set just for them, every planet in an <span className="lcb-key">exact</span> place.</span>
                <span className="lcb-ln lcb-emph">Nothing after can touch it. It is still there to be <span className="lcb-key">read.</span></span>
              </p>
            </div>

            {/* MEMORIAL BEAT 4 - INVITATION: the reading opens who they were.
                The dim stars ignite soft gold; then the two lights (you +
                their pet) draw close and REST side by side on "loved" -
                continuing bonds, not a merge - and hand into the form. */}
            <div className="lcb-scene lcb-payoff lcb-payoff-scene">
              <p className="lcb-payoff-line lcb-split"><span className="lcb-ln">A soul reading <span className="lcb-key">opens</span> who they were.</span></p>
              <p className="lcb-beat lcb-support lcb-split">
                <span className="lcb-ln">What made them, <span className="lcb-key">them.</span></span>
                <span className="lcb-ln lcb-emph">Why they <span className="lcb-key">loved</span> you the way they did.</span>
              </p>
              <p className="lcb-payoff-line lcb-close lcb-split">
                <span className="lcb-ln"><span className="lcb-asc">Set the chart.</span></span>
              </p>
              <span className="lcb-rule" aria-hidden="true" />
            </div>
          </>
        ) : (
          <>
            {/* BEAT 1 - RECOGNITION: you already know them. Three known stars
                ignite warm beside the pet star as the reader is told what they
                know (love / settles / you). */}
            <div className="lcb-scene lcb-open">
              <div className="lcb-dawn" aria-hidden="true" />
              <p className="lcb-beat lcb-split"><span className="lcb-ln">No one <span className="lcb-key">knows</span> your pet the way you do.</span></p>
              <p className="lcb-beat lcb-support lcb-split">
                <span className="lcb-ln">You know what they <span className="lcb-key">love.</span></span>
                <span className="lcb-ln">You know what <span className="lcb-key">settles</span> them.</span>
                <span className="lcb-ln">You know the look they save only for <span className="lcb-key">you.</span></span>
              </p>
            </div>

            {/* BEAT 2 - GAP: the parts you cannot explain. The dim unknown
                stars fade in around the cluster (visible, unlit), then pulse. */}
            <div className="lcb-scene lcb-chart-scene lcb-gap-scene">
              <p className="lcb-pivot-lead lcb-split">
                <span className="lcb-ln">But there are parts of them you have never quite <span className="lcb-key">understood.</span></span>
              </p>
              <div className="lcb-chart-copy">
                <p className="lcb-pivot-body lcb-split">
                  <span className="lcb-ln">Why they are the way they <span className="lcb-key">are.</span></span>
                  <span className="lcb-ln">What they would say if they <span className="lcb-key">could.</span></span>
                </p>
              </div>
            </div>

            {/* BEAT 3 - ANSWER: it began the day they were born. The
                constellation draws between every star, a degree mark snaps on
                one node, then it completes, still dim, waiting to be read. */}
            <div className="lcb-scene lcb-souls-scene lcb-answer-scene">
              <p className="lcb-beat lcb-support lcb-souls-text lcb-split">
                <span className="lcb-ln">All of it began the day they were <span className="lcb-key">born.</span></span>
                <span className="lcb-ln">The sky that day was set just for them, every planet in an <span className="lcb-key">exact</span> place.</span>
                <span className="lcb-ln lcb-emph">A map of who they are, that no one has ever <span className="lcb-key">read.</span></span>
              </p>
            </div>

            {/* BEAT 4 - INVITATION: the reading opens it. The dim stars ignite
                gold one by one, then the two lights (you + their pet) become
                one bloom exactly on "love" - the apex - and hand into the form. */}
            <div className="lcb-scene lcb-payoff lcb-payoff-scene">
              <p className="lcb-payoff-line lcb-split"><span className="lcb-ln">A soul reading <span className="lcb-key">opens</span> it, piece by piece.</span></p>
              <p className="lcb-beat lcb-support lcb-split">
                <span className="lcb-ln">Who they <span className="lcb-key">are.</span></span>
                <span className="lcb-ln">What they <span className="lcb-key">need.</span></span>
                <span className="lcb-ln lcb-emph">Why they <span className="lcb-key">love</span> you the way they do.</span>
              </p>
              <p className="lcb-payoff-line lcb-close lcb-split">
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
