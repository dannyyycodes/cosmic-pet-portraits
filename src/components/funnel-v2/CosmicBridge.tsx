import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getIntent, INTENT_EVENT } from "@/lib/intent";

gsap.registerPlugin(ScrollTrigger);

/* =====================================================================
   The bridge passage (littlesouls.app) V6 - the emotional hero moment
   between <HeroSection/> and the "Set the chart" form. One story, four
   beats, ONE continuing actor (the MOON), and ONE BINDING LAW: every
   line's KEY word is a split unit whose reveal position stamps a
   timeline label, and the line's bound visual COMPLETES exactly at that
   label. Labels are the authority; no decimal is hand-typed twice.

   V6 PRESENTATION LAW (Danny, 2026-07-11): the visuals live WITH the
   words, in flow, not on a backdrop. Four crafted scenes, each with its
   own composition and motion signature; tight vertical rhythm (auto
   height scenes + ONE consistent breath between beats).

     1 THE RAIL OF KNOWING - headline centred under the arriving moon
       (blur crossfade completes at "knows"); the three support lines
       form a left rail, each carrying its own INLINE star that ignites
       warm exactly on its key word; a gold hairline grows down the rail
       to each star as it lights.
     2 THE OPEN QUESTIONS - the lead sits flush left; the body lines
       answer from the right, each trailing a COOL star that pulses on
       its key but never ignites. Faint motes drift in the diagonal
       silence between them. The moonlight withholds.
     3 THE MAP, THREADED - the constellation lives BETWEEN the lines:
       line 1, line 2 (with a real degree readout that counts up in the
       text baseline and locks beside "exact place."), the star map
       drawing itself, then line 3. The web completes at "read."
     4 THE CLOSE - the promise lines arrive word by word, then the plain
       closing words "Set the chart." light in luminous white with a
       violet breath and hand straight into the form. No ring, no seal.

   ONE house ease everywhere something settles: expo-out (.16,1,.3,1).
   Palette on warm near-black #0d0a14: desaturated gold #f0d99f, ivory
   #efe9dd, body #d8d0c1. ~80% stillness - one focal thing at a time.

   STRICT-CSP SAFE: GSAP core + ScrollTrigger bundled by Vite (script-src
   'self'), never a CDN tag. Inline SVG + stroke-dashoffset (no paid
   DrawSVG). One sanctioned canvas (the ambient starfield). Moon photos
   self-hosted. NO live filter animation. CSS authors the honest FINAL
   state of every visual; motion mode primes to hidden and performs.
   Reduced motion therefore reads the finished passage at rest.
===================================================================== */

/* ---- The placeholder natal chart --------------------------------------
   The inline degree readout derives from ONE source array and counts to
   the REAL chart Moon degree - never an invented number. */
const SIGN_LON: Record<string, number> = {
  Aries: 0, Taurus: 30, Gemini: 60, Cancer: 90, Leo: 120, Virgo: 150,
  Libra: 180, Scorpio: 210, Sagittarius: 240, Capricorn: 270, Aquarius: 300, Pisces: 330,
};

type Placement = { key: string; sign: string; deg: number; min: number; lon: number };
const CHART: Placement[] = ([
  { key: "sun", sign: "Pisces", deg: 24, min: 37 },
  { key: "moon", sign: "Virgo", deg: 24, min: 37 },
  { key: "mercury", sign: "Pisces", deg: 8, min: 14 },
  { key: "venus", sign: "Taurus", deg: 3, min: 51 },
] as Omit<Placement, "lon">[]).map((p) => ({ ...p, lon: SIGN_LON[p.sign] + p.deg + p.min / 60 }));

const pad2 = (n: number) => (n < 10 ? "0" : "") + n;
const MOONP = CHART.find((p) => p.key === "moon")!;
const MOON_READOUT = MOONP.deg + "° " + pad2(MOONP.min) + "′";

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
  northNode: '<path class="gl-s" d="M-3.7,4.6 C-6.7,-3.4 6.7,-3.4 3.7,4.6"/><circle class="gl-f" cx="-3.9" cy="4.8" r="1.5"/><circle class="gl-f" cx="3.9" cy="4.8" r="1.5"/>',
  chiron: '<circle class="gl-s" cx="0" cy="4.2" r="2.2"/><path class="gl-s" d="M-1.6,-6.3 L-1.6,2 M-1.6,-1.7 L2.4,-6.3 M-1.6,-1.7 L2.4,2"/>',
  lilith: '<path class="gl-f" d="M1,-6.4 A3,3 0 1 0 1,-0.4 A4,4 0 0 1 1,-6.4 Z"/><path class="gl-s" d="M0,-0.4 L0,6.6 M-2.4,3.4 L2.4,3.4"/>',
};

/* ---- BEAT 3: constellation band geometry ------------------------------
   ONE source for the builder (stars + web) AND the timeline (each event
   bound to a key-word label). Wide band 460x240, in flow between the
   lines: the pet star centred, three known stars in a tight cluster,
   four unknown stars on the outer reach, the web connecting them. */
const CONSTEL = {
  pet: { x: 230, y: 122 },
  known: [
    { id: "k1", x: 168, y: 86 },
    { id: "k2", x: 298, y: 102 },
    { id: "k3", x: 240, y: 170 },
  ],
  unknown: [
    { id: "u1", x: 64, y: 50 },
    { id: "u2", x: 400, y: 58 },
    { id: "u3", x: 90, y: 198 },
    { id: "u4", x: 394, y: 190 },
  ],
  lines: [
    ["pet", "k1"], ["pet", "k2"], ["pet", "k3"],
    ["k1", "k2"], ["k2", "k3"], ["k1", "k3"],
    ["k1", "u1"], ["k2", "u2"], ["k3", "u3"], ["k2", "u4"],
  ] as [string, string][],
};
// which web line reaches which unknown star (line index -> star id)
const UNK_BY_LINE: Record<number, string> = { 6: "u1", 7: "u2", 8: "u3", 9: "u4" };

// luminous layers for one band star (fills reference the shared JSX defs)
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

  let out = '<g class="lcb-cst">';
  C.lines.forEach(([a, b], i) => {
    const p = pos(a), q2 = pos(b);
    out += `<line class="lcb-cst-line" data-i="${i}" x1="${p.x}" y1="${p.y}" x2="${q2.x}" y2="${q2.y}"/>`;
  });
  out += "</g>";
  C.unknown.forEach((u, i) => { out += starGroup(u.id, u.x, u.y, 1.1 + i * 0.7, 2.4); });
  C.known.forEach((k, i) => { out += starGroup(k.id, k.x, k.y, 0.4 + i * 0.5, 2.7); });
  out += starGroup("lcb-pet", C.pet.x, C.pet.y, 0, 3.6);
  return out;
}

const LCB_CSS = `
.lcb-root{
  --lcb-bg:#0d0a14; --lcb-deep:#070510; --lcb-lift:#100c1a;
  --lcb-gold:#f0d99f; --lcb-gold-soft:#d9be86;
  --lcb-violet:#a78bfa; --lcb-violet-soft:#8b7bd8;
  --lcb-ivory:#efe9dd; --lcb-body:#d8d0c1; --lcb-label:#b7af9f;
  --lcb-ease:cubic-bezier(.16,1,.3,1);
  position:relative;
  /* pull the passage up under the hero: the hero's dead band after the CTAs
     becomes the shared handoff window (hero copy scrubs out, beat 1 rises in) */
  margin-top:-18svh;
  /* the whole passage is narrative - nothing interactive lives in it. It
     overlaps the hero's tail, so it must NEVER intercept a tap. */
  pointer-events:none;
  font-family:"Newsreader",Georgia,serif;font-weight:400;
  -webkit-font-smoothing:antialiased;
}
.lcb-defs{position:absolute;width:0;height:0;overflow:hidden}

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

/* the moon: real photo, feathered, one cool bloom. Three transform wrappers so
   travel / pointer / settle never fight. */
.lcb-moon-travel{position:absolute;inset:0;will-change:transform}
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
/* the SAME real moon photo, warmed: cold grey crossfades toward gold as the
   passage seals. Static filter, opacity-only tween. */
.lcb-moon-img.gold{opacity:0;filter:sepia(0.55) saturate(1.45) hue-rotate(-12deg) brightness(1.06) contrast(0.95)}
/* BEAT 1 earthshine: pre-baked radial gradient on the dark limb - the part
   you cannot see is still facing you. Opacity-only, no live filters.
   Authored FINAL (lit); motion primes it dark and raises it on arrival. */
.lcb-earthshine{position:absolute;inset:0;border-radius:50%;pointer-events:none;mix-blend-mode:screen;opacity:.35;
  background:radial-gradient(circle at 70% 76%, rgba(172,182,218,0.22) 0%, rgba(152,162,205,0.11) 36%, rgba(152,162,205,0) 64%)}
.lcb-moon-grade{position:absolute;inset:0;border-radius:50%;pointer-events:none;mix-blend-mode:multiply;
  background:radial-gradient(circle at 50% 54%, rgba(13,10,20,0) 56%, rgba(13,10,20,0.55) 100%),
    linear-gradient(180deg, rgba(120,132,180,0.05), rgba(13,10,20,0.12))}
.lcb-moon-term{position:absolute;inset:0;border-radius:50%;pointer-events:none;mix-blend-mode:soft-light;
  background:radial-gradient(circle at 33% 28%, rgba(214,222,255,0.12) 0%, rgba(0,0,0,0) 44%),
    radial-gradient(circle at 72% 78%, rgba(6,6,16,0.44) 0%, rgba(0,0,0,0) 64%)}
.lcb-moon-rim{position:absolute;inset:0;border-radius:50%;pointer-events:none;mix-blend-mode:screen;
  background:radial-gradient(circle, rgba(0,0,0,0) 84%, rgba(168,180,224,0.22) 91%, rgba(0,0,0,0) 99%)}

.lcb-grade{position:absolute;inset:0;pointer-events:none;mix-blend-mode:soft-light;
  background:linear-gradient(158deg, rgba(20,18,46,0.5) 0%, rgba(120,126,180,0.08) 55%, rgba(201,199,252,0.10) 100%)}

/* framing overlays (above the beats) - kept LIGHT so the in-flow visuals read */
.lcb-veil{position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(180deg, rgba(7,5,14,0.5) 0%, rgba(7,5,14,0) 22%, rgba(7,5,14,0) 76%, rgba(7,5,14,0.5) 100%)}
.lcb-vignette{position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(ellipse at 50% 44%, transparent 46%, rgba(5,4,12,0.48) 100%)}
.lcb-grain{position:absolute;inset:0;pointer-events:none;opacity:.034;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}

/* ---- beats layer: TIGHT RHYTHM ----
   Scenes size to their content. ONE consistent breath separates beats.
   perspective feeds the camera-tilt handoffs. pointer-events stays off. */
.lcb-beats{position:relative;z-index:2;perspective:1100px;pointer-events:none}
.lcb-scene{position:relative;display:flex;flex-direction:column;align-items:center;
  padding-inline:clamp(24px,7vw,80px);text-align:center;gap:clamp(13px,2.4vw,20px)}
.lcb-scene + .lcb-scene{margin-top:clamp(52px,11svh,120px)}
.lcb-open{min-height:50svh;justify-content:center;overflow:hidden;
  padding-top:clamp(30px,8svh,90px);padding-bottom:clamp(10px,2svh,24px)}
.lcb-scene.lcb-payoff{padding-bottom:clamp(44px,8svh,76px)}
/* memorial: the same passage in a lower, slower voice - longer breaths */
.lcb-memorial{margin-top:-2svh}
.lcb-memorial .lcb-open{min-height:58svh}
.lcb-memorial .lcb-scene + .lcb-scene{margin-top:clamp(68px,15svh,160px)}

/* type: Fraunces display + Newsreader body. Every line rises out of an
   overflow:hidden mask. Body stays solid #d8d0c1 weight 400 - no blur. */
.lcb-beat{position:relative;margin:0;max-width:19ch;
  font-family:"Fraunces",Georgia,serif;font-weight:400;font-optical-sizing:auto;
  font-size:clamp(2.05rem,1.5rem + 2.5vw,3.5rem);line-height:1.1;
  letter-spacing:-0.021em;color:var(--lcb-ivory);text-wrap:balance;
  text-shadow:0 1px 26px rgba(4,3,10,0.5)}
.lcb-beat.lcb-support{font-family:"Newsreader",Georgia,serif;font-weight:400;font-optical-sizing:auto;
  font-size:clamp(1.24rem,1.02rem + 1.7vw,1.7rem);line-height:1.55;max-width:30ch;
  color:var(--lcb-body);letter-spacing:.004em;text-wrap:pretty;text-shadow:0 1px 18px rgba(4,3,10,0.42)}
.lcb-open .lcb-beat:not(.lcb-support){font-weight:400;font-size:clamp(2.35rem,1.6rem + 3.4vw,4rem);
  max-width:15ch;letter-spacing:-0.026em;line-height:1.05;text-shadow:0 2px 34px rgba(4,3,10,0.55)}
.lcb-emph{color:var(--lcb-ivory)}
.lcb-it{font-style:italic;font-weight:400}

/* the mask line: word units live inside overflow:hidden so they rise out.
   Tight line-to-line rhythm; small padding so descenders never clip. */
.lcb-ln{display:block;overflow:hidden;padding-block:0.09em;margin-block:-0.09em}
.lcb-ln + .lcb-ln{margin-top:.34em}
.lcb-support .lcb-ln + .lcb-ln{margin-top:.2em}
.lcb-wd{display:inline-block;will-change:transform}

/* THE BINDING LAW: the key word of each line is its own split unit, gold
   pre-authored on the span. Its mask-rise IS the emphasis. */
.lcb-key{color:var(--lcb-gold)}

/* ---- the INLINE star: a real crafted glyph living beside its line.
   Authored LIT (the honest final state); motion primes it dark. ---- */
.lcb-instar{width:24px;height:24px;flex:0 0 24px;overflow:visible;display:block}
.lcb-in-halo{fill:url(#lcbHaloWarm);opacity:.9}
.lcb-in-core{fill:url(#lcbCoreWarm);opacity:1}
.lcb-in-gl{fill:rgba(255,248,228,0.9);opacity:.6}
.lcb-instar.lcb-cool .lcb-in-halo{fill:url(#lcbHaloCool);opacity:.35}
.lcb-instar.lcb-cool .lcb-in-core{fill:url(#lcbCoreCool);opacity:.7}
.lcb-instar.lcb-cool .lcb-in-gl{opacity:0}
.lcb-instar{mix-blend-mode:screen}

/* BEAT 1 - the rail of knowing: three lines, three stars, one hairline */
.lcb-rail{position:relative;display:flex;flex-direction:column;gap:clamp(13px,2.6svh,22px);
  text-align:left;margin-top:clamp(8px,1.6svh,16px)}
.lcb-rail-line{position:absolute;left:11.5px;top:14px;bottom:14px;width:1px;transform:scaleY(1);transform-origin:top;
  background:linear-gradient(180deg, rgba(240,217,159,0) 0%, rgba(240,217,159,0.45) 14%, rgba(240,217,159,0.45) 86%, rgba(240,217,159,0) 100%)}
.lcb-row{position:relative;display:flex;align-items:flex-start;gap:clamp(12px,2vw,18px)}
.lcb-row .lcb-beat{margin:0;max-width:24ch}
.lcb-row .lcb-instar{margin-top:.24em}

/* BEAT 1 dawn pool: authored final (risen); motion primes it low */
.lcb-dawn{position:absolute;left:50%;bottom:12%;width:min(120vw,940px);height:56vh;z-index:0;
  transform:translate(-50%,4%);opacity:.85;pointer-events:none;
  background:radial-gradient(ellipse 52% 40% at 50% 66%, rgba(126,116,158,0.17) 0%, rgba(72,66,112,0.07) 38%, rgba(72,66,112,0) 76%)}

/* BEAT 2 - the open questions: lead flush left, answers offset right,
   cool stars trailing the lines, motes in the diagonal silence */
.lcb-gap-block{position:relative;width:100%;max-width:660px;display:flex;flex-direction:column;text-align:left}
.lcb-gap-block .lcb-pivot-lead{margin:0;text-align:left;max-width:20ch}
.lcb-qrows{align-self:flex-end;display:flex;flex-direction:column;align-items:flex-end;
  gap:clamp(10px,1.8svh,18px);margin-top:clamp(30px,7svh,64px);text-align:right}
.lcb-qrow{display:flex;align-items:center;gap:clamp(10px,1.6vw,14px)}
.lcb-qrow .lcb-beat{margin:0;max-width:26ch}
.lcb-voidstar{position:absolute;width:8px;height:8px;border-radius:50%;pointer-events:none;opacity:.5;
  background:radial-gradient(circle, rgba(196,206,232,0.9) 0%, rgba(176,188,222,0.35) 40%, rgba(176,188,222,0) 70%)}
.lcb-voidstar.v1{left:16%;top:54%}
.lcb-voidstar.v2{left:36%;top:70%}
.lcb-voidstar.v3{left:7%;top:82%}

.lcb-pivot-lead{margin:0 auto;font-family:"Fraunces",Georgia,serif;font-weight:400;font-optical-sizing:auto;
  color:var(--lcb-ivory);font-size:clamp(1.78rem,1.25rem + 2.5vw,2.7rem);line-height:1.14;
  letter-spacing:-0.018em;max-width:21ch;text-wrap:balance;text-shadow:0 1px 26px rgba(4,3,10,0.5)}

/* BEAT 3 - the map, threaded between the lines */
.lcb-band{position:relative;width:min(88vw,440px);margin-block:clamp(6px,1.4svh,14px)}
.lcb-stars{display:block;width:100%;height:auto;aspect-ratio:460/240;overflow:visible;isolation:isolate}
.lcb-star .lcb-glow,.lcb-cst-line,.lcb-star .lcb-glint{mix-blend-mode:screen}
.lcb-star{transform-box:view-box}
.lcb-star-breathe{transform-box:fill-box;transform-origin:center;will-change:transform,opacity}
/* band state layers: authored FINAL = the completed map. Known cluster warm,
   unknown reach present but dim (a real map no one has read). */
.lcb-glow-cool{opacity:.55}
.lcb-glow-warm{opacity:0}
.lcb-glow-gold{opacity:0}
.lcb-glint{opacity:0}
.lcb-glint-v,.lcb-glint-h{fill:rgba(255,248,228,0.9)}
.lcb-star.lcb-pet .lcb-glow-cool{opacity:.12}
.lcb-star.lcb-pet .lcb-glow-warm{opacity:1}
.lcb-star.lcb-pet .lcb-glint{opacity:.55}
.lcb-star.k1 .lcb-glow-warm,.lcb-star.k2 .lcb-glow-warm,.lcb-star.k3 .lcb-glow-warm{opacity:1}
.lcb-star.k1 .lcb-glow-cool,.lcb-star.k2 .lcb-glow-cool,.lcb-star.k3 .lcb-glow-cool{opacity:.22}
.lcb-star.k1 .lcb-glint,.lcb-star.k2 .lcb-glint,.lcb-star.k3 .lcb-glint{opacity:.4}
@keyframes lcbStarBreath{
  0%,100%{transform:scale(1);opacity:.94}
  50%    {transform:scale(1.05);opacity:1}
}
.lcb-motion .lcb-star-breathe{animation:lcbStarBreath 6.6s var(--lcb-ease) infinite;animation-delay:var(--bd,0s)}
.lcb-cst{overflow:visible}
.lcb-cst-line{fill:none;stroke:var(--lcb-gold-soft);stroke-width:0.9;stroke-linecap:round;
  vector-effect:non-scaling-stroke;opacity:.72}

/* the inline degree readout: an instrument annotation in the text baseline.
   The tick is a small DIAGONAL survey mark pointing into the figure - it
   must never read as a dash. */
.lcb-degline{display:inline-block;white-space:nowrap;margin-left:12px;vertical-align:baseline}
.lcb-deg-tickline{display:inline-block;width:11px;height:1px;vertical-align:middle;margin:0 7px 5px 2px;
  background:linear-gradient(90deg, rgba(240,217,159,0), var(--lcb-gold));
  transform:rotate(-38deg);transform-origin:100% 50%;opacity:1}
.lcb-deg-n{font-family:"Newsreader",Georgia,serif;font-weight:400;font-size:.72em;letter-spacing:.05em;
  color:var(--lcb-gold);font-variant-numeric:tabular-nums}

/* BEAT 4 - the plain close: "Set the chart." in luminous white/violet */
.lcb-payoff-line{position:relative;z-index:1;margin:0;font-family:"Fraunces",Georgia,serif;font-weight:400;font-optical-sizing:auto;
  color:var(--lcb-ivory);font-size:clamp(2.05rem,1.4rem + 3.1vw,3.5rem);line-height:1.16;
  letter-spacing:-0.02em;max-width:17ch;text-wrap:balance;text-shadow:0 1px 26px rgba(4,3,10,0.5)}
.lcb-promises{max-width:26ch}
.lcb-payoff-line.lcb-close{margin-top:clamp(18px,3.4svh,36px);font-size:clamp(1.9rem,1.3rem + 2.6vw,3.1rem)}
.lcb-asc{display:inline-block;font-weight:500;letter-spacing:-0.008em;color:#f7f4ff;
  text-shadow:0 0 0 rgba(167,139,250,0)}
.lcb-asc.lit{animation:lcbAscBreath 7.5s var(--lcb-ease) 1.1s infinite}
@keyframes lcbAscBreath{
  0%{text-shadow:0 0 8px rgba(167,139,250,0.30), 0 0 20px rgba(167,139,250,0.16), 0 0 44px rgba(139,123,216,0.10)}
  38%{text-shadow:0 0 10px rgba(167,139,250,0.38), 0 0 26px rgba(167,139,250,0.20), 0 0 54px rgba(139,123,216,0.12)}
  63%{text-shadow:0 0 9px rgba(167,139,250,0.33), 0 0 22px rgba(167,139,250,0.17), 0 0 48px rgba(139,123,216,0.11)}
  100%{text-shadow:0 0 8px rgba(167,139,250,0.30), 0 0 20px rgba(167,139,250,0.16), 0 0 44px rgba(139,123,216,0.10)}
}
.lcb-rule{display:block;width:min(46vw,220px);height:1px;margin:clamp(12px,2.2vw,20px) auto 0;
  background:linear-gradient(90deg,transparent,var(--lcb-violet),transparent);
  transform:scaleX(1);transform-origin:center;opacity:.9}

@media (max-width:768px){
  .lcb-beat:not(.lcb-support){font-size:clamp(1.72rem,1.2rem + 4.4vw,2.4rem)}
  .lcb-open .lcb-beat:not(.lcb-support){font-size:clamp(2.05rem,1.35rem + 6vw,2.8rem)}
  .lcb-pivot-lead{font-size:clamp(1.55rem,1.15rem + 3.6vw,2.2rem)}
  .lcb-payoff-line{font-size:clamp(1.85rem,1.3rem + 4.6vw,2.7rem)}
  .lcb-payoff-line.lcb-close{font-size:clamp(1.6rem,1.1rem + 4vw,2.2rem)}
  .lcb-moon{top:-3%;right:-7%;width:min(46vw,214px)}
  .lcb-band{width:min(92vw,400px)}
  .lcb-instar{width:18px;height:18px;flex-basis:18px}
  .lcb-rail-line{left:8.5px}
}
@media (prefers-reduced-motion:reduce){
  .lcb-asc.lit{animation:none}
}
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

/* word-cascade parameter sets: keyLabel = lineStart + keyIdx*each + dur */
const HEADP = { dur: 0.9, each: 0.12 };   // short display heads
const LEADP = { dur: 0.55, each: 0.05 };  // long display lines
const SUPP = { dur: 0.45, each: 0.038 };  // support / body lines

/* the inline star glyph - bespoke SVG, authored LIT (fills come from the
   shared defs). cool variant = the unanswered question star. */
function InStar({ cool = false }: { cool?: boolean }) {
  return (
    <svg className={cool ? "lcb-instar lcb-cool" : "lcb-instar"} viewBox="0 0 36 36" aria-hidden="true" focusable="false">
      <circle className="lcb-in-halo" cx="18" cy="18" r="17" />
      <circle className="lcb-in-core" cx="18" cy="18" r="2.7" />
      <path className="lcb-in-gl" d="M18,5 L19.05,18 L18,31 L16.95,18 Z" />
      <path className="lcb-in-gl" d="M5,18 L18,16.95 L31,18 L18,19.05 Z" />
    </svg>
  );
}

export function CosmicBridge() {
  const rootRef = useRef<HTMLElement>(null);

  // The register: discovery (default) or memorial. The fork / URL intent
  // drives it live via the ls-intent event; a register change remounts the
  // whole section (key below) and rebuilds every timeline from scratch.
  const [register, setRegister] = useState<"discovery" | "memorial">(() =>
    getIntent() === "memorial" ? "memorial" : "discovery");
  useEffect(() => {
    const onIntent = () => {
      setRegister(getIntent() === "memorial" ? "memorial" : "discovery");
      // Choosing a path collapses the tall chooser into its slim banner, which
      // reflows everything below WITHOUT a register change (discovery is the
      // default). Every scroll timeline's start/end is stale after that shift,
      // so re-measure once the collapse has painted.
      requestAnimationFrame(() => requestAnimationFrame(() => ScrollTrigger.refresh()));
    };
    window.addEventListener(INTENT_EVENT, onIntent);
    return () => window.removeEventListener(INTENT_EVENT, onIntent);
  }, []);
  const memorial = register === "memorial";

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === "undefined") return;

    const q = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = root) => scope.querySelector<T>(sel);
    const qa = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = root) => Array.from(scope.querySelectorAll<T>(sel));
    // memorial register: every glow opacity cap multiplied by 0.7; the loud
    // transients (glint flares, shared breaths, the gold bloom flash) soften
    // or never exist. The same four scenes in a lower voice.
    const hush = register === "memorial";
    const glow = (v: number) => (hush ? Math.round(v * 0.7 * 1000) / 1000 : v);

    // ---------- build the constellation band ----------
    const starsSvg = q<SVGSVGElement>(".lcb-stars");
    if (starsSvg) starsSvg.innerHTML = buildConstellation();

    // ---------- prep the mask reveals (wrap once, never per breakpoint) ----------
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
    const allWords = qa(".lcb-split .lcb-wd");

    // ---------- honest magnitude-scaled canvas starfield (ambient) ----------
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
        for (const st of stars) {
          ctxc.beginPath();
          ctxc.fillStyle = `rgba(${st.c[0]},${st.c[1]},${st.c[2]},${st.a})`;
          ctxc.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctxc.fill();
        }
      };
      drawStars();
    }

    // ---------- stage refs ----------
    const back = q(".lcb-back");
    const front = q(".lcb-front");
    const moonPt = q(".lcb-moon-pt");
    const travel = q(".lcb-moon-travel");
    const moonEl = q(".lcb-moon");

    // ---------- band star helpers ----------
    const starLayer = (id: string, layer: string) =>
      starsSvg ? starsSvg.querySelector<SVGGElement>(`.lcb-star.${id} .${layer}`) : null;
    const cstLines = starsSvg ? qa<SVGLineElement>(".lcb-cst-line", starsSvg) : [];
    // KNOWN ignition: cool damps, warm rises, glint appears - completes at the
    // absolute time `end` (= the key word's label time), so it lands on the word
    const igniteKnown = (tl: gsap.core.Timeline, id: string, end: number, dur = 0.6) => {
      const warm = starLayer(id, "lcb-glow-warm");
      const cool = starLayer(id, "lcb-glow-cool");
      const glint = starLayer(id, "lcb-glint");
      const at = Math.max(0, end - dur);
      if (warm) tl.to(warm, { opacity: glow(1), ease: HOUSE, duration: dur }, at);
      if (cool) tl.to(cool, { opacity: 0.22, ease: HOUSE, duration: dur }, at);
      if (glint) tl.to(glint, { opacity: glow(0.4), ease: HOUSE, duration: dur }, at);
    };

    // ---------- helpers ----------
    const primeDraw = (els: SVGGeometryElement[]) => els.forEach((el) => {
      const len = el.getTotalLength ? el.getTotalLength() : 300;
      el.style.strokeDasharray = String(len); el.style.strokeDashoffset = String(len);
    });

    // the inline degree readout: counts to the REAL chart Moon figure
    const degN = q(".lcb-deg-n");
    const totalMin = MOONP.deg * 60 + MOONP.min;
    const cnt = { v: totalMin };
    const applyRead = () => {
      if (!degN) return;
      const c = Math.round(cnt.v);
      degN.textContent = Math.floor(c / 60) + "° " + pad2(c % 60) + "′";
    };

    // canvas rebuilds ride ScrollTrigger's own refresh cycle
    const onSTRefresh = () => { drawStars(); };
    ScrollTrigger.addEventListener("refresh", onSTRefresh);

    // ================= ONE CLOCK =================
    const mm = gsap.matchMedia();

    const buildStory = (mobile: boolean, scrub: number) => {
      const amp = mobile ? 0.55 : 1;

      // ---------- THE BINDING LAW: one reveal engine, every line ----------
      // revealLine places the word cascade and stamps TWO labels: `label`
      // at the exact tick the key word's rise completes, and `label+"End"`
      // when the line's last unit lands. Labels are the authority.
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
        tl.addLabel(label + "End", at + (units.length - 1) * p.each + p.dur);
      };
      const endAt = (label: string, dur: number) => `${label}-=${dur}`;
      const labelTime = (tl: gsap.core.Timeline, name: string) =>
        (tl.labels as Record<string, number>)[name] ?? 0;

      // inline star ignition: the star wakes BESIDE its line, completing at
      // the key label. Warm pop + glint - the visual lands ON the word.
      const igniteInline = (tl: gsap.core.Timeline, row: Element, end: number, dur: number) => {
        const star = q<SVGElement>(".lcb-instar", row);
        const halo = q<SVGElement>(".lcb-in-halo", row);
        const core = q<SVGElement>(".lcb-in-core", row);
        const gls = qa<SVGElement>(".lcb-in-gl", row);
        const at = Math.max(0, end - dur);
        if (star) tl.to(star, { scale: 1, opacity: 1, duration: dur, ease: HOUSE }, at);
        if (halo) tl.to(halo, { opacity: glow(1), duration: dur, ease: HOUSE }, at);
        if (core) tl.to(core, { opacity: 1, duration: dur, ease: HOUSE }, at);
        if (gls.length) tl.to(gls, { opacity: glow(0.7), duration: dur, ease: HOUSE }, at);
      };

      // ---- SPINE: the moon travels between beat homes (transform only) ----
      const W = window.innerWidth, H = window.innerHeight;
      if (travel) {
        gsap.timeline({ scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub } })
          .to(travel, { x: -0.15 * W * amp, y: 0.10 * H * amp, ease: HOUSE, duration: 1 })
          .to(travel, { x: -0.02 * W * amp, y: 0.02 * H * amp, ease: HOUSE, duration: 1 })
          .to(travel, { x: 0.05 * W * amp, y: -0.11 * H * amp, ease: HOUSE, duration: 1 });
      }

      // ---- SEAM 1: the hero hands into the passage ----
      const heroCopy = document.querySelector<HTMLElement>(".ls-hero-copy");
      if (heroCopy && document.querySelector(".ls-hero-section")) {
        gsap.to(heroCopy, {
          opacity: 0, y: -34 * amp, ease: "none",
          scrollTrigger: { trigger: ".ls-hero-section", start: "bottom 86%", end: "bottom 38%", scrub },
        });
      }

      // =============== BEAT 1 - THE RAIL OF KNOWING ===============
      // The moon (their companion) arrives out of focus and settles sharp as
      // "knows"/"knew" lands. Then three lines, three inline stars: each
      // ignites warm beside its own words, and the gold rail grows down to
      // meet it. What you already know, set alight one truth at a time.
      const open = q(".lcb-open");
      if (open) {
        const dawn = q(".lcb-dawn", open);
        const earthshine = q(".lcb-earthshine");
        const rim = q(".lcb-moon-rim");
        const bloom = q(".lcb-moon-bloom");
        const goldImg = q(".lcb-moon-img.gold");
        const headLn = q(".lcb-beat:not(.lcb-support) .lcb-ln", open);
        const rows = qa(".lcb-row", open);
        const railLine = q(".lcb-rail-line", open);

        // prime to the un-lit state (CSS authors the final)
        gsap.set(dawn, { opacity: 0, yPercent: 16 });
        if (railLine) gsap.set(railLine, { scaleY: 0 });
        rows.forEach((row) => {
          gsap.set(q(".lcb-instar", row), { scale: 0.55, transformOrigin: "50% 50%" });
          gsap.set(q(".lcb-in-halo", row), { opacity: 0 });
          gsap.set(q(".lcb-in-core", row), { opacity: 0.3 });
          gsap.set(qa(".lcb-in-gl", row), { opacity: 0 });
        });
        if (rim) gsap.set(rim, { opacity: 0.6 });
        if (earthshine) gsap.set(earthshine, { opacity: 0 });

        const t1 = gsap.timeline({ scrollTrigger: { trigger: open, start: "top 82%", end: "bottom 38%", scrub } });
        const T = hush
          ? { head: 0.45, rows: [1.5, 2.7, 3.9], ig: 0.85, rail: 0.7 }
          : { head: 0.35, rows: [1.05, 1.8, 2.55], ig: 0.5, rail: 0.5 };

        // L1 "No one KNOWS/KNEW your pet the way you do/did." - the moon
        // crossfades sharp over the arrival, completing at the key.
        revealLine(t1, headLn, T.head, "b1know", HEADP);
        const arrive = labelTime(t1, "b1know");
        t1.to(q(".lcb-moon-img.blur"), { opacity: 0, ease: "none", duration: arrive }, 0)
          .to(q(".lcb-moon-img.sharp"), { opacity: 1, ease: "none", duration: arrive }, 0)
          .fromTo(q(".lcb-moon"), { y: 14, scale: 1.04 }, { y: 0, scale: 1.0, ease: HOUSE, duration: hush ? 1.8 : 1.3 }, 0.05);
        t1.to(dawn, { opacity: glow(0.85), yPercent: 4, ease: HOUSE, duration: 1.25 }, 0.45);
        if (earthshine) t1.to(earthshine, { opacity: glow(0.35), duration: arrive, ease: "none" }, 0);
        if (rim) t1.to(rim, { opacity: glow(1), duration: arrive, ease: "none" }, 0);
        if (hush && goldImg) t1.to(goldImg, { opacity: glow(0.18), duration: arrive, ease: "none" }, 0);

        // L2-L4: each line's inline star ignites ON its key word; the rail
        // hairline grows down to the star as it lights.
        rows.forEach((row, i) => {
          const label = `b1r${i}`;
          revealLine(t1, q(".lcb-ln", row), T.rows[i], label, SUPP);
          const end = labelTime(t1, label);
          igniteInline(t1, row, end, T.ig);
          if (railLine) t1.to(railLine, { scaleY: (i + 1) / rows.length, duration: T.rail, ease: HOUSE }, endAt(label, T.rail));
        });
        // the moon's bloom answers the completed rail with one soft breath
        const lastLbl = `b1r${rows.length - 1}`;
        if (bloom) t1.to(bloom, { opacity: glow(0.85), duration: 0.4, ease: HOUSE }, endAt(lastLbl, 0.4));
      }

      // =============== BEAT 2 - THE OPEN QUESTIONS ===============
      // The lead sits flush left; the body lines answer from the right, each
      // trailing a COOL star that pulses on its key but never ignites - the
      // question asked, not answered. Motes drift in the diagonal silence.
      // The moonlight withholds.
      const gapScene = q(".lcb-gap-scene");
      if (gapScene) {
        const leadLn = q(".lcb-pivot-lead .lcb-ln", gapScene);
        const qrows = qa(".lcb-qrow", gapScene);
        const voids = qa(".lcb-voidstar", gapScene);
        const bloom = q(".lcb-moon-bloom");

        // prime: cool stars and motes are not yet visible
        qrows.forEach((row) => {
          gsap.set(q(".lcb-instar", row), { opacity: 0, scale: 0.6, transformOrigin: "50% 50%" });
        });
        gsap.set(voids, { opacity: 0 });

        const tg = gsap.timeline({ scrollTrigger: { trigger: gapScene, start: "top 84%", end: "bottom 42%", scrub } });
        const qT = hush ? [1.7] : [1.4, 2.2];

        revealLine(tg, leadLn, hush ? 0.35 : 0.25, "b2lead", LEADP);
        // AMBIENT: the motes surface slowly under the lead - never faster
        // than the key events around them.
        voids.forEach((v, i) => {
          tg.to(v, { opacity: glow(0.5), duration: 1.3, ease: "none" }, Math.max(0, labelTime(tg, "b2lead") - 0.6 + i * 0.35));
        });
        // the moonlight withholds while the questions stand open
        if (bloom) tg.to(bloom, { opacity: glow(0.5), duration: 1.2, ease: "none" }, hush ? 0.5 : 0.4);

        qrows.forEach((row, i) => {
          const label = `b2q${i}`;
          revealLine(tg, q(".lcb-ln", row), qT[i], label, SUPP);
          const star = q<SVGElement>(".lcb-instar", row);
          const halo = q<SVGElement>(".lcb-in-halo", row);
          const end = labelTime(tg, label);
          // the cool star surfaces WITH its line...
          if (star) tg.to(star, { opacity: 1, scale: 1, duration: 0.5, ease: HOUSE }, end - 0.5);
          // ...brightens once on the key word, then settles dim. Unanswered.
          if (halo) {
            tg.to(halo, { opacity: glow(0.75), duration: 0.3, ease: "sine.inOut" }, end)
              .to(halo, { opacity: glow(0.32), duration: 0.6, ease: HOUSE }, end + 0.34);
          }
        });
      }

      // =============== BEAT 3 - THE MAP, THREADED ===============
      // The constellation lives BETWEEN the lines. The band surfaces with
      // "born.", the known cluster remembers its warmth, the web draws from
      // "born." and completes at "read.", the unknown stars surfacing as the
      // web reaches them. The degree readout counts up IN the text baseline
      // and locks beside "exact place." - a real figure, never invented.
      const ans = q(".lcb-answer-scene");
      const band = q(".lcb-band");
      if (ans && band && starsSvg && cstLines.length) {
        const lns = qa(".lcb-souls-text .lcb-ln", ans);
        const bloom = q(".lcb-moon-bloom");
        const degTick = q(".lcb-deg-tickline");

        // prime the band to its unread state
        gsap.set(band, { opacity: 0, y: 18 });
        qa<SVGGElement>(".lcb-star", starsSvg).forEach((g) => {
          if (g.classList.contains("lcb-pet")) return;
          const known = CONSTEL.known.some((k) => g.classList.contains(k.id));
          gsap.set(g.querySelector(".lcb-glow-cool"), { opacity: 0.55 });
          gsap.set(g.querySelector(".lcb-glow-warm"), { opacity: 0 });
          gsap.set(g.querySelector(".lcb-glint"), { opacity: 0 });
          gsap.set(g, { opacity: known ? 1 : 0 });
        });
        cstLines.forEach((ln) => {
          const len = ln.getTotalLength ? ln.getTotalLength() : 200;
          ln.style.strokeDasharray = String(len);
          ln.style.strokeDashoffset = String(len);
          ln.style.opacity = "0";
        });
        cnt.v = 0; applyRead();
        if (degTick) gsap.set(degTick, { opacity: 0.3 });

        const ta = gsap.timeline({ scrollTrigger: { trigger: ans, start: "top 84%", end: "bottom 30%", scrub } });
        const T3 = hush ? [0.3, 1.8, 3.5] : [0.2, 1.4, 2.9];

        // place the three lines first so their labels exist
        revealLine(ta, lns[0], T3[0], "b3born", SUPP);
        revealLine(ta, lns[1], T3[1], "b3exact", SUPP);
        revealLine(ta, lns[2], T3[2], "b3read", SUPP);

        // the band surfaces WITH "born."
        ta.to(band, { opacity: 1, y: 0, duration: 0.7, ease: HOUSE }, endAt("b3born", 0.7));
        // the known cluster remembers beat 1's warmth
        CONSTEL.known.forEach((k, i) => {
          igniteKnown(ta, k.id, labelTime(ta, "b3born") + 0.35 + i * 0.15, 0.5);
        });
        // the sky answers: the moonlight returns
        if (bloom) ta.to(bloom, { opacity: glow(0.85), duration: 0.9, ease: "none" }, labelTime(ta, "b3born"));

        // the web draws from "born." and completes at "read."; each unknown
        // star surfaces as the web reaches it
        const drawStart = labelTime(ta, "b3born") + 0.15;
        const drawEnd = labelTime(ta, "b3read");
        const n = cstLines.length;
        const drawDur = Math.max(0.4, Math.min(hush ? 1.0 : 0.8, (drawEnd - drawStart) * 0.4));
        const spread = Math.max(0.001, drawEnd - drawDur - drawStart);
        cstLines.forEach((ln, i) => {
          const at = drawStart + spread * (i / Math.max(1, n - 1));
          ta.to(ln, { opacity: glow(0.72), duration: 0.12, ease: "none" }, at);
          ta.to(ln, { strokeDashoffset: 0, duration: drawDur, ease: HOUSE }, at);
          const uid = UNK_BY_LINE[i];
          if (uid) {
            const g = starsSvg.querySelector<SVGGElement>(`.lcb-star.${uid}`);
            if (g) ta.to(g, { opacity: glow(1), duration: 0.5, ease: HOUSE }, at + drawDur * 0.55);
          }
        });

        // the readout counts up in the baseline and LOCKS as its line lands
        ta.to(cnt, { v: totalMin, duration: 0.6, ease: HOUSE, onUpdate: applyRead }, endAt("b3exactEnd", 0.6));
        if (degTick) ta.to(degTick, { opacity: 1, duration: 0.18, ease: "none" }, endAt("b3exactEnd", 0.18));

        // on "read." the finished map gives one soft lift, then rests dim -
        // real, complete, and still unread
        ta.to(cstLines, { opacity: glow(0.82), duration: 0.4, ease: "none" }, labelTime(ta, "b3read"))
          .to(cstLines, { opacity: glow(0.66), duration: 0.6, ease: HOUSE }, labelTime(ta, "b3read") + 0.45);
      }

      // =============== BEAT 4 - THE CLOSE ===============
      // The promise lines arrive word by word, then the plain closing words
      // "Set the chart." land, light in white/violet, and hand into the form.
      const payoff = q(".lcb-payoff-scene");
      if (payoff) {
        const headLn = q(".lcb-payoff-line:not(.lcb-close) .lcb-ln", payoff);
        const pLns = qa(".lcb-promises .lcb-ln", payoff);
        const closeLn = q(".lcb-close .lcb-ln", payoff);
        const rule = q(".lcb-rule", payoff);
        const asc = q(".lcb-asc", payoff);
        const crestEl = document.querySelector<HTMLElement>(".ls-seal-crest");

        if (rule) gsap.set(rule, { scaleX: 0 });

        const t4 = gsap.timeline({ scrollTrigger: { trigger: payoff, start: "top 76%", end: "bottom 42%", scrub } });
        const T4 = hush
          ? { head: 0.3, p: [1.8, 3.2], close: 5.0 }
          : { head: 0.3, p: [1.45, 2.35, 3.3], close: 4.7 };

        revealLine(t4, headLn, T4.head, "b4opens", LEADP);
        pLns.forEach((ln, i) => {
          revealLine(t4, ln, T4.p[i], `b4p${i}`, SUPP);
        });

        // "Set the chart." arrives word by word; as "chart" lands the words
        // light (white with a violet breath) and the rule draws underneath.
        revealLine(t4, closeLn, T4.close, "b4chart", LEADP);
        t4.call(() => { if (asc) asc.classList.add("lit"); }, [], "b4chart+=0.1");
        if (rule) t4.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.55, ease: HOUSE }, "b4chart+=0.18");
        // keep the form crest reaching its docked final state (page-side)
        if (crestEl) {
          t4.call(() => {
            if (!crestEl || crestEl.classList.contains("lcb-docked")) return;
            if (t4.scrollTrigger && t4.scrollTrigger.direction < 0) return;
            crestEl.classList.add("lcb-docked");
          }, [], "b4chart");
        }
      }

      // ========== SPINE 2 - THE MOON RETIRES AT THE REVEAL ==========
      // After the passage the moon hangs above the seal card, waiting. Then
      // it RETIRES: it slips upward and dims out entirely before the
      // reveal's top edge. Below the reveal the sky belongs to the chart.
      const orrery2 = document.querySelector("#computed-sky");
      if (travel && orrery2) {
        const W2 = () => window.innerWidth, H2 = () => window.innerHeight;
        const spine = gsap.timeline({
          scrollTrigger: { trigger: orrery2, start: "top bottom", end: "top 35%", scrub, invalidateOnRefresh: true },
        });
        spine.fromTo(travel,
          { x: () => 0.05 * W2() * amp, y: () => -0.11 * H2() * amp },
          { x: () => (mobile ? -0.36 : -0.44) * W2(), y: () => 0.18 * H2(), ease: HOUSE, duration: 1, immediateRender: false }, 0.001)
          .to(travel, { y: () => 0.04 * H2(), ease: "none", duration: 0.8 }, 1.001)
          .to(moonEl, { scale: 0.86, ease: "none", duration: 0.8 }, 1.001)
          .to(moonEl, { opacity: 0, ease: "none", duration: 0.8 }, 1.001);

        // the dossier CTA still takes up the thread once it arrives
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
      // reads as tilting your head to the next patch of sky.
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

        // ---- ONE SKY: the stage lights as the hero sets and then STAYS ON.
        // Ramps stay LINEAR (an eased coverage fade lights the night too
        // early over the hero). Held OFF until the chooser clears the top
        // quarter so its cards stay clean + tappable.
        const stageOp = { enter: 0, frontExit: 1 };
        const applyStage = () => {
          if (back) (back as HTMLElement).style.opacity = String(stageOp.enter);
          if (front) (front as HTMLElement).style.opacity = String(Math.min(stageOp.enter, stageOp.frontExit));
        };
        applyStage();
        gsap.fromTo(stageOp, { enter: 0 }, {
          enter: 1, ease: "none", onUpdate: applyStage,
          scrollTrigger: { trigger: root, start: "top 25%", end: "top -30%", scrub: noMotion ? true : scrub },
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
        // CSS already authors every visual's FINISHED state (lit rail stars,
        // drawn web, locked readout, risen dawn). Only the few values
        // whose finals are JS-owned get set here.
        if (noMotion) {
          gsap.set(q(".lcb-moon-img.blur"), { opacity: 0 });
          gsap.set(q(".lcb-moon-img.sharp"), { opacity: 1 });
          if (hush) {
            gsap.set(q(".lcb-earthshine"), { opacity: glow(0.35) });
            gsap.set(q(".lcb-moon-img.gold"), { opacity: glow(0.18) });
            gsap.set(q(".lcb-dawn"), { opacity: glow(0.85) });
            qa(".lcb-open .lcb-in-halo").forEach((el) => gsap.set(el, { opacity: glow(0.9) }));
            qa(".lcb-open .lcb-in-gl").forEach((el) => gsap.set(el, { opacity: glow(0.6) }));
          }
          const asc = q(".lcb-asc"); if (asc) asc.classList.add("lit");
          return;
        }

        // ================= MOTION =================
        root.classList.add("lcb-motion");
        gsap.set(allWords, { yPercent: 118, opacity: 0 });
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
        };
      },
    );

    requestAnimationFrame(() => ScrollTrigger.refresh());
    // Webfonts (Fraunces/Newsreader) land after the load event and reflow every
    // beat's height; without this the word-cascade triggers keep pre-font
    // positions and the closing words can fire hundreds of pixels late.
    let fontsAlive = true;
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (fontsAlive) ScrollTrigger.refresh();
      }).catch(() => { /* ignore */ });
    }

    return () => {
      fontsAlive = false;
      ScrollTrigger.removeEventListener("refresh", onSTRefresh);
      mm.revert();
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

      {/* shared paint servers for every star on the page (band, rail) */}
      <svg className="lcb-defs" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id="lcbHaloCool">
            <stop offset="0%" stopColor="rgba(176,188,222,0.55)" />
            <stop offset="28%" stopColor="rgba(150,160,210,0.20)" />
            <stop offset="60%" stopColor="rgba(150,160,210,0.06)" />
            <stop offset="100%" stopColor="rgba(150,160,210,0)" />
          </radialGradient>
          <radialGradient id="lcbCoreCool">
            <stop offset="0%" stopColor="rgba(226,232,248,0.95)" />
            <stop offset="42%" stopColor="rgba(196,206,232,0.55)" />
            <stop offset="78%" stopColor="rgba(176,188,222,0.10)" />
            <stop offset="100%" stopColor="rgba(176,188,222,0)" />
          </radialGradient>
          <radialGradient id="lcbHaloWarm">
            <stop offset="0%" stopColor="rgba(246,235,207,0.72)" />
            <stop offset="26%" stopColor="rgba(240,222,180,0.26)" />
            <stop offset="58%" stopColor="rgba(240,217,159,0.07)" />
            <stop offset="100%" stopColor="rgba(240,217,159,0)" />
          </radialGradient>
          <radialGradient id="lcbCoreWarm">
            <stop offset="0%" stopColor="rgba(255,251,240,0.98)" />
            <stop offset="40%" stopColor="rgba(248,238,214,0.6)" />
            <stop offset="80%" stopColor="rgba(246,235,207,0.10)" />
            <stop offset="100%" stopColor="rgba(246,235,207,0)" />
          </radialGradient>
          <radialGradient id="lcbChroma">
            <stop offset="0%" stopColor="rgba(255,214,150,0)" />
            <stop offset="55%" stopColor="rgba(255,206,140,0.10)" />
            <stop offset="82%" stopColor="rgba(214,190,134,0.05)" />
            <stop offset="100%" stopColor="rgba(214,190,134,0)" />
          </radialGradient>
        </defs>
      </svg>

      {/* fixed graded night stage - the ONE sky for the whole page */}
      <div className="lcb-back" aria-hidden="true">
        <div className="lcb-sky" />
        <div className="lcb-sky-violet" />
        <div className="lcb-canvas-wrap"><canvas className="lcb-canvas" /></div>
        <div className="lcb-moon-travel">
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
            </div>
          </div>
        </div>
        <div className="lcb-dawn-horizon" />
        <div className="lcb-grade" />
      </div>

      <div className="lcb-beats">
        {memorial ? (
          <>
            {/* MEMORIAL BEAT 1 - THE RAIL OF KNOWING (past tense): three
                inline stars ignite softly beside what you knew. */}
            <div className="lcb-scene lcb-open">
              <div className="lcb-dawn" aria-hidden="true" />
              <p className="lcb-beat lcb-split"><span className="lcb-ln">No one <span className="lcb-key">knew</span> your pet the way you did.</span></p>
              <div className="lcb-rail">
                <span className="lcb-rail-line" aria-hidden="true" />
                <div className="lcb-row">
                  <InStar />
                  <p className="lcb-beat lcb-support lcb-split"><span className="lcb-ln">You knew what they <span className="lcb-key">loved.</span></span></p>
                </div>
                <div className="lcb-row">
                  <InStar />
                  <p className="lcb-beat lcb-support lcb-split"><span className="lcb-ln">You knew what <span className="lcb-key">settled</span> them.</span></p>
                </div>
                <div className="lcb-row">
                  <InStar />
                  <p className="lcb-beat lcb-support lcb-split"><span className="lcb-ln">You knew the look they <span className="lcb-key">saved</span> only for you.</span></p>
                </div>
              </div>
            </div>

            {/* MEMORIAL BEAT 2 - THE OPEN QUESTIONS: one cool star that
                pulses but never ignites. The moonlight withholds. */}
            <div className="lcb-scene lcb-gap-scene">
              <div className="lcb-gap-block">
                <p className="lcb-pivot-lead lcb-split">
                  <span className="lcb-ln">And there is still more of them to <span className="lcb-key">know.</span></span>
                </p>
                <span className="lcb-voidstar v1" aria-hidden="true" />
                <span className="lcb-voidstar v2" aria-hidden="true" />
                <span className="lcb-voidstar v3" aria-hidden="true" />
                <div className="lcb-qrows">
                  <div className="lcb-qrow">
                    <p className="lcb-beat lcb-support lcb-split"><span className="lcb-ln">Parts you felt but never had <span className="lcb-key">words</span> for.</span></p>
                    <InStar cool />
                  </div>
                </div>
              </div>
            </div>

            {/* MEMORIAL BEAT 3 - THE MAP, THREADED: the constellation draws
                between the lines; the degree readout locks beside "exact". */}
            <div className="lcb-scene lcb-answer-scene">
              <p className="lcb-beat lcb-support lcb-souls-text lcb-split">
                <span className="lcb-ln">It all began the day they were <span className="lcb-key">born.</span></span>
                <span className="lcb-ln">The sky that day was set just for them, every planet in an <span className="lcb-key">exact</span> place.<span className="lcb-degline" aria-hidden="true"><span className="lcb-deg-tickline" /><span className="lcb-deg-n">{MOON_READOUT}</span></span></span>
              </p>
              <div className="lcb-band" aria-hidden="true">
                <svg className="lcb-stars" viewBox="0 0 460 240" preserveAspectRatio="xMidYMid meet" />
              </div>
              <p className="lcb-beat lcb-support lcb-souls-text lcb-split">
                <span className="lcb-ln lcb-emph">Nothing after can touch it. It is still there to be <span className="lcb-key">read.</span></span>
              </p>
            </div>

            {/* MEMORIAL BEAT 4 - THE CLOSE: two promises, then the plain
                closing words hand gently into the form. Held, not merged. */}
            <div className="lcb-scene lcb-payoff lcb-payoff-scene">
              <p className="lcb-payoff-line lcb-split"><span className="lcb-ln">A soul reading <span className="lcb-key">opens</span> who they were.</span></p>
              <p className="lcb-beat lcb-support lcb-promises lcb-split">
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
            {/* BEAT 1 - THE RAIL OF KNOWING: three inline stars ignite warm
                beside what you already know. */}
            <div className="lcb-scene lcb-open">
              <div className="lcb-dawn" aria-hidden="true" />
              <p className="lcb-beat lcb-split"><span className="lcb-ln">No one <span className="lcb-key">knows</span> your pet the way you do.</span></p>
              <div className="lcb-rail">
                <span className="lcb-rail-line" aria-hidden="true" />
                <div className="lcb-row">
                  <InStar />
                  <p className="lcb-beat lcb-support lcb-split"><span className="lcb-ln">You know what they <span className="lcb-key">love.</span></span></p>
                </div>
                <div className="lcb-row">
                  <InStar />
                  <p className="lcb-beat lcb-support lcb-split"><span className="lcb-ln">You know what <span className="lcb-key">settles</span> them.</span></p>
                </div>
                <div className="lcb-row">
                  <InStar />
                  <p className="lcb-beat lcb-support lcb-split"><span className="lcb-ln">You know the look they save only for <span className="lcb-key">you.</span></span></p>
                </div>
              </div>
            </div>

            {/* BEAT 2 - THE OPEN QUESTIONS: cool stars pulse on the parts
                you cannot explain, and never ignite. */}
            <div className="lcb-scene lcb-gap-scene">
              <div className="lcb-gap-block">
                <p className="lcb-pivot-lead lcb-split">
                  <span className="lcb-ln">But there are parts of them you have never quite <span className="lcb-key">understood.</span></span>
                </p>
                <span className="lcb-voidstar v1" aria-hidden="true" />
                <span className="lcb-voidstar v2" aria-hidden="true" />
                <span className="lcb-voidstar v3" aria-hidden="true" />
                <div className="lcb-qrows">
                  <div className="lcb-qrow">
                    <p className="lcb-beat lcb-support lcb-split"><span className="lcb-ln">Why they are the way they <span className="lcb-key">are.</span></span></p>
                    <InStar cool />
                  </div>
                  <div className="lcb-qrow">
                    <p className="lcb-beat lcb-support lcb-split"><span className="lcb-ln">What they would say if they <span className="lcb-key">could.</span></span></p>
                    <InStar cool />
                  </div>
                </div>
              </div>
            </div>

            {/* BEAT 3 - THE MAP, THREADED: the constellation draws between
                the lines; the degree readout locks beside "exact place." */}
            <div className="lcb-scene lcb-answer-scene">
              <p className="lcb-beat lcb-support lcb-souls-text lcb-split">
                <span className="lcb-ln">All of it began the day they were <span className="lcb-key">born.</span></span>
                <span className="lcb-ln">The sky that day was set just for them, every planet in an <span className="lcb-key">exact</span> place.<span className="lcb-degline" aria-hidden="true"><span className="lcb-deg-tickline" /><span className="lcb-deg-n">{MOON_READOUT}</span></span></span>
              </p>
              <div className="lcb-band" aria-hidden="true">
                <svg className="lcb-stars" viewBox="0 0 460 240" preserveAspectRatio="xMidYMid meet" />
              </div>
              <p className="lcb-beat lcb-support lcb-souls-text lcb-split">
                <span className="lcb-ln lcb-emph">A map of who they are, that no one has ever <span className="lcb-key">read.</span></span>
              </p>
            </div>

            {/* BEAT 4 - THE CLOSE: three promises arrive word by word, then
                the plain closing words hand straight into the form. */}
            <div className="lcb-scene lcb-payoff lcb-payoff-scene">
              <p className="lcb-payoff-line lcb-split"><span className="lcb-ln">A soul reading <span className="lcb-key">opens</span> it, piece by piece.</span></p>
              <p className="lcb-beat lcb-support lcb-promises lcb-split">
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
        <div className="lcb-grain" />
      </div>
    </section>
  );
}
