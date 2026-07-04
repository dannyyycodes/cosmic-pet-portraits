import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* =====================================================================
   The bridge passage (littlesouls.app) — the emotional hero moment
   between <HeroSection/> and the "Set the chart" form. One story, four
   beats. The MOON is the constant light and "home" in every beat. Across
   all four the SAME gesture repeats: something out-of-focus / drifting /
   un-named resolves into something sharp, still, fixed — exactly as the
   words finish reading.

     1 ARRIVAL  — a pre-blurred moon racks into focus; three stars ignite
                  (joy / trust / gaze), one per line, and a whisper-thin
                  gold line draws them into one small constellation home.
     2 NAMING   — ~11 loose points hang out of focus, then lock one at a
                  time to their true ecliptic longitude; the zodiac ring
                  assembles FROM the soul's own points outward; a second
                  rack pulls the degree ring crisp and the readouts count
                  up; the Sun-Moon line draws last, a diameter through the
                  moon, and one soft pulse travels its length.
     3 CROSSING — two field-stars detach into two arcs. The gold pet-head
                  reaches the crossing and WAITS while the ivory human-head
                  decelerates in and rests on it exactly as line 3 lands.
                  One quiet ripple, a light-echo outward, then the two arcs
                  rise on as ONE softly braided strand toward the moon.
     4 REVEALED — the complete natal wheel is already present at ~7%. It
                  leans in; three bodies breathe up one per phrase; a load-
                  bearing silence; then the aspect chords draw in and the
                  whole wheel lifts to legibility, and "Set the chart" lights
                  as the chart's Ascendant node — the only warm thing in frame.

   ONE house ease everywhere something settles: expo-out (.16,1,.3,1).
   Palette on warm near-black #0d0a14: desaturated gold #f0d99f, ivory
   #efe9dd, body #d8d0c1. ~80% stillness — one focal thing moving at a time.

   STRICT-CSP SAFE: GSAP core + ScrollTrigger are bundled by Vite (served
   from our own origin under script-src 'self'), never a CDN <script>.
   Inline SVG + stroke-dashoffset (no paid DrawSVG). getPointAtLength is
   sampled ONCE at setup into a lookup (no paid MotionPath, nothing read in
   the scroll loop). ONE canvas-2D starfield. Moon self-hosted; the sole new
   asset is a baked-blur moon at /start/cosmos-moon-blur.webp. Reduced-motion
   renders the honest FINAL state of every beat.
===================================================================== */

/* ---- The placeholder natal chart --------------------------------------
   DECISION 1 (locked): every position AND every degree readout derives
   from ONE `lon` (ecliptic longitude). deg/min are the source; lon is
   computed from them, and the point is placed at lon. They can never
   disagree — no fake-precise arcminutes on a decorative point. Sun and
   Moon sit in exact opposition (a full-moon chart) so the Sun-Moon line
   is a true diameter through the moon at centre. Wiring a real per-pet
   chart later is a pure swap of this one array. */
const SIGN_LON: Record<string, number> = {
  Aries: 0, Taurus: 30, Gemini: 60, Cancer: 90, Leo: 120, Virgo: 150,
  Libra: 180, Scorpio: 210, Sagittarius: 240, Capricorn: 270, Aquarius: 300, Pisces: 330,
};
const ZODIAC = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];

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

const GLYPH: Record<string, string> = {
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

// Build one natal wheel as SVG innerHTML. moonImage=true renders the Moon
// body as the real moon webp (Beat 4 "what steadies them"). Both beats share
// CHART, so the two wheels are the same chart.
function buildWheel(moonImage: boolean): string {
  const R = { rimA: 200, rimB: 190, zGlyph: 175, zIn: 158, tickIn: 150, house: 94, plan: 126, asp: 94, hub: 7, read: 110 };
  const pt = (lon: number, r: number): [number, number] => {
    const a = ((180 - lon) * Math.PI) / 180;
    return [Math.cos(a) * r, -Math.sin(a) * r];
  };
  const s = (v: number) => Math.round(v * 100) / 100;
  const ring = (r: number, cls: string) => '<circle class="stroke ' + cls + ' lcb-draw" cx="0" cy="0" r="' + r + '"/>';
  const lineAt = (lon: number, r1: number, r2: number, cls: string) => {
    const a = pt(lon, r1), b = pt(lon, r2);
    return '<line class="stroke ' + cls + ' lcb-draw" x1="' + s(a[0]) + '" y1="' + s(a[1]) + '" x2="' + s(b[0]) + '" y2="' + s(b[1]) + '"/>';
  };
  const glyphAt = (name: string, x: number, y: number, scale: number, wrapCls: string) =>
    '<g class="' + wrapCls + '" transform="translate(' + s(x) + ',' + s(y) + ') scale(' + scale + ')">' + (GLYPH[name] || "") + "</g>";

  const moonClip = "lcb-moonclip-" + (moonImage ? "p" : "n");
  let out = '<g class="lcb-w-tickgroup">';
  out += '<circle cx="0" cy="0" r="' + (R.rimA + 4) + '" fill="rgba(9,7,16,0.42)"/>';
  out += ring(R.rimA, "rim lcb-w-ring");
  out += ring(R.rimB, "rim2 lcb-w-ring");
  out += ring(R.zIn, "zin lcb-w-ring");
  out += ring(R.house, "hubline lcb-w-ring");
  out += ring(R.hub, "hubline lcb-w-ring");
  for (let i = 0; i < 12; i++) out += lineAt(i * 30, R.zIn, R.rimB, "sign-div lcb-w-sign");
  // 360-degree tick ring (the second rack-focus target)
  for (let d = 0; d < 360; d += 5) { if (d % 30 === 0) continue; out += lineAt(d, R.tickIn, R.zIn, "tick" + (d % 10 === 0 ? " maj" : "") + " lcb-w-tick"); }
  out += "</g>";

  const ascLon = CHART.find((p) => p.key === "ascendant")!.lon;
  for (let h = 0; h < 12; h++) out += lineAt(ascLon + h * 30, R.house, R.zIn, "house lcb-w-house");
  const axA = pt(ascLon, R.zIn), axB = pt(ascLon + 180, R.zIn);
  out += '<line class="stroke axis lcb-w-axis lcb-draw" x1="' + s(axA[0]) + '" y1="' + s(axA[1]) + '" x2="' + s(axB[0]) + '" y2="' + s(axB[1]) + '"/>';

  for (let z = 0; z < 12; z++) {
    const mid = z * 30 + 15, gp = pt(mid, R.zGlyph);
    out += glyphAt(ZODIAC[z], gp[0], gp[1], 1.0, "lcb-w-zsym zsym");
  }

  // aspect chords — tag the Sun-Moon opposition as the luminaries diameter
  const ASP = [{ a: 60, orb: 5 }, { a: 90, orb: 6 }, { a: 120, orb: 6 }, { a: 180, orb: 7 }];
  for (let x = 0; x < CHART.length; x++) {
    for (let y2 = x + 1; y2 < CHART.length; y2++) {
      let diff = Math.abs(CHART[x].lon - CHART[y2].lon); if (diff > 180) diff = 360 - diff;
      for (let k = 0; k < ASP.length; k++) {
        if (Math.abs(diff - ASP[k].a) <= ASP[k].orb) {
          const pa = pt(CHART[x].lon, R.asp), pb = pt(CHART[y2].lon, R.asp);
          const keys = [CHART[x].key, CHART[y2].key];
          const lumin = keys.includes("sun") && keys.includes("moon");
          const soft = ASP[k].a === 60 || ASP[k].a === 120;
          out += '<line class="stroke aspect ' + (lumin ? "lumin lcb-w-lumin" : (soft ? "soft lcb-w-aspect" : "hard lcb-w-aspect")) +
            ' lcb-draw" data-a="' + keys[0] + '" data-b="' + keys[1] + '" x1="' + s(pa[0]) + '" y1="' + s(pa[1]) + '" x2="' + s(pb[0]) + '" y2="' + s(pb[1]) + '"/>';
          break;
        }
      }
    }
  }

  // planets: anti-collision display longitude, leg line to true point,
  // per-body longitude tick on the ring, glyph (or moon webp) + degree readout
  const disp = CHART.map((p) => ({ key: p.key, lon: p.lon })).sort((a, b) => a.lon - b.lon);
  const gap = 13;
  for (let qi = 1; qi < disp.length; qi++) if (disp[qi].lon - disp[qi - 1].lon < gap) disp[qi].lon = disp[qi - 1].lon + gap;
  const dispMap: Record<string, number> = {}; disp.forEach((p) => { dispMap[p.key] = p.lon; });
  const pad2 = (n: number) => (n < 10 ? "0" : "") + n;

  CHART.forEach((p) => {
    const dl = dispMap[p.key];
    const tA = pt(p.lon, R.zIn), tB = pt(p.lon, R.rimB);
    out += '<line class="stroke lontick lcb-w-lontick" data-key="' + p.key + '" x1="' + s(tA[0]) + '" y1="' + s(tA[1]) + '" x2="' + s(tB[0]) + '" y2="' + s(tB[1]) + '"/>';
    const legA = pt(p.lon, R.zIn - 3), legB = pt(dl, R.plan + 9);
    out += '<line class="stroke leg lcb-w-leg lcb-draw" x1="' + s(legA[0]) + '" y1="' + s(legA[1]) + '" x2="' + s(legB[0]) + '" y2="' + s(legB[1]) + '"/>';
    const gp = pt(dl, R.plan);
    let wrap = '<g class="lcb-w-planet" data-key="' + p.key + '">';
    wrap += '<circle class="p-halo" cx="' + s(gp[0]) + '" cy="' + s(gp[1]) + '" r="10.5"/>';
    if (p.key === "ascendant") {
      wrap += '<path class="gl-s" transform="translate(' + s(gp[0]) + ',' + s(gp[1]) + ') scale(0.7)" d="M0,-5 L4.4,0 L0,5 L-4.4,0 Z"/>';
      const lp = pt(dl, R.plan - 20);
      wrap += '<text class="asc-label" x="' + s(lp[0]) + '" y="' + s(lp[1] + 3) + '" text-anchor="middle">Asc</text>';
    } else if (p.key === "moon" && moonImage) {
      wrap += '<clipPath id="' + moonClip + '"><circle cx="' + s(gp[0]) + '" cy="' + s(gp[1]) + '" r="7.6"/></clipPath>';
      wrap += '<image href="/start/cosmos-moon.webp" x="' + s(gp[0] - 7.6) + '" y="' + s(gp[1] - 7.6) + '" width="15.2" height="15.2" clip-path="url(#' + moonClip + ')" preserveAspectRatio="xMidYMid slice"/>';
      wrap += '<circle class="p-moonring" cx="' + s(gp[0]) + '" cy="' + s(gp[1]) + '" r="7.6"/>';
    } else {
      wrap += glyphAt(p.key, gp[0], gp[1], 0.92, "");
    }
    const rp = pt(dl, R.read);
    wrap += '<text class="lcb-w-read" data-deg="' + p.deg + '" data-min="' + p.min + '" x="' + s(rp[0]) + '" y="' + s(rp[1] + 2.4) + '" text-anchor="middle">' + p.deg + "° " + pad2(p.min) + "'</text>";
    wrap += "</g>";
    out += wrap;
  });

  return out;
}

const LCB_CSS = `
.lcb-root{
  --lcb-bg:#0d0a14; --lcb-deep:#070510; --lcb-lift:#100c1a;
  --lcb-gold:#f0d99f; --lcb-gold-soft:#d9be86;
  --lcb-ivory:#efe9dd; --lcb-body:#d8d0c1; --lcb-label:#b7af9f;
  --lcb-ease:cubic-bezier(.16,1,.3,1);
  position:relative;
  font-family:"Newsreader",Georgia,serif;font-weight:400;
  -webkit-font-smoothing:antialiased;
}

/* ---- fixed graded night stage (behind the beats) ---- */
.lcb-back{position:fixed;inset:0;z-index:1;overflow:hidden;pointer-events:none;opacity:0;will-change:opacity}
.lcb-front{position:fixed;inset:0;z-index:3;pointer-events:none;opacity:0;will-change:opacity}

.lcb-sky{position:absolute;inset:0;background:linear-gradient(180deg,var(--lcb-deep) 0%,var(--lcb-bg) 48%,var(--lcb-lift) 100%)}
.lcb-canvas-wrap{position:absolute;inset:-8% -6%;will-change:transform}
.lcb-canvas{position:absolute;inset:0;width:100%;height:100%}

/* the moon: real photo, feathered, one cool bloom. Four transform wrappers so
   travel / beat-4 counter-parallax / pointer / arrival never fight. */
.lcb-moon-travel{position:absolute;inset:0;will-change:transform}
.lcb-moon-b4{position:absolute;inset:0;will-change:transform}
.lcb-moon-pt{position:absolute;inset:0;will-change:transform}
.lcb-moon{position:absolute;top:-6%;right:-8%;width:min(32vw,258px);aspect-ratio:1;will-change:transform}
.lcb-moon-bloom{position:absolute;inset:-62%;border-radius:50%;pointer-events:none;mix-blend-mode:screen;
  background:radial-gradient(circle, rgba(150,160,210,0.20) 0%, rgba(150,160,210,0.09) 20%, rgba(150,160,210,0.03) 45%, rgba(150,160,210,0) 72%)}
.lcb-moon-disc{position:absolute;inset:0;border-radius:50%;
  -webkit-mask-image:radial-gradient(circle, #000 93%, rgba(0,0,0,0) 100%);
  mask-image:radial-gradient(circle, #000 93%, rgba(0,0,0,0) 100%)}
.lcb-moon-img{position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:cover;transform:scale(1.06);
  filter:saturate(0.82) contrast(0.94) brightness(0.98)}
.lcb-moon-img.blur{filter:saturate(0.8) contrast(0.92) brightness(0.98)}
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
.lcb-beats{position:relative;z-index:2}
.lcb-scene{position:relative;min-height:100svh;display:flex;flex-direction:column;justify-content:center;align-items:center;
  padding:14svh clamp(24px,7vw,80px);text-align:center;gap:clamp(20px,3.6vw,34px);overflow:hidden}

/* type: Fraunces display + Newsreader body. Every line rises out of an
   overflow:hidden mask. Body stays solid #d8d0c1 weight 400 — no blur. */
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

/* BEAT 1 — arrival: a low pool of light + the three-star constellation */
.lcb-dawn{position:absolute;left:50%;bottom:15%;width:min(120vw,940px);height:60vh;z-index:0;
  transform:translate(-50%,18%);opacity:0;pointer-events:none;
  background:radial-gradient(ellipse 52% 40% at 50% 66%, rgba(126,116,158,0.17) 0%, rgba(72,66,112,0.07) 38%, rgba(72,66,112,0) 76%)}
.lcb-b1{position:absolute;top:3%;right:2%;width:min(64vw,380px);height:min(64vw,380px);z-index:0;pointer-events:none;overflow:visible}
.lcb-b1 .lcb-con{fill:none;stroke:var(--lcb-gold-soft);stroke-width:1;vector-effect:non-scaling-stroke;opacity:.72;
  filter:drop-shadow(0 0 3px rgba(240,217,159,0.3))}
.lcb-b1-star{transform-box:fill-box;transform-origin:center;
  filter:drop-shadow(0 0 3px rgba(240,217,159,0.85)) drop-shadow(0 0 8px rgba(240,217,159,0.4)) drop-shadow(0 0 18px rgba(214,190,134,0.2))}

/* BEAT 2 — naming: the wheel + the loose "nameless" points */
.lcb-wheel-wrap{position:relative;width:min(86vw,438px);aspect-ratio:1;margin-bottom:clamp(26px,5vw,46px)}
.lcb-wheel{position:absolute;inset:0;width:100%;height:100%;overflow:visible;transform-origin:50% 50%}
.lcb-seeds{position:absolute;inset:0;pointer-events:none;z-index:2}
.lcb-seed{position:absolute;left:50%;top:50%;width:3px;height:3px;margin:-1.5px 0 0 -1.5px;border-radius:50%;
  opacity:0;background:radial-gradient(circle, rgba(240,242,255,0.95), rgba(200,208,240,0.3) 60%, transparent 76%);
  will-change:transform,opacity}
.lcb-wheel .stroke{fill:none;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}
.lcb-wheel .rim{stroke:var(--lcb-gold-soft);stroke-width:1;opacity:.9}
.lcb-wheel .rim2{stroke:var(--lcb-gold-soft);stroke-width:1;opacity:.55}
.lcb-wheel .zin{stroke:var(--lcb-gold-soft);stroke-width:1;opacity:.55}
.lcb-wheel .hubline{stroke:var(--lcb-gold-soft);stroke-width:1;opacity:.42}
.lcb-wheel .sign-div{stroke:var(--lcb-gold-soft);stroke-width:1;opacity:.5}
.lcb-wheel .tick{stroke:var(--lcb-gold-soft);stroke-width:1;opacity:.34}
.lcb-wheel .tick.maj{opacity:.5}
.lcb-wheel .house{stroke:var(--lcb-gold-soft);stroke-width:1;opacity:.28}
.lcb-wheel .lontick{stroke:var(--lcb-gold);stroke-width:1.4;opacity:0}
.lcb-wheel .axis{stroke:var(--lcb-gold);stroke-width:1.5;opacity:.85;filter:drop-shadow(0 0 6px rgba(240,217,159,0.35))}
.lcb-wheel .leg{stroke:var(--lcb-gold);stroke-width:1;opacity:.42}
.lcb-wheel .aspect{stroke:var(--lcb-gold);stroke-width:1}
.lcb-wheel .aspect.hard{opacity:.32}
.lcb-wheel .aspect.soft{opacity:.22}
.lcb-wheel .lumin{stroke:var(--lcb-gold);stroke-width:1.6;opacity:.9;filter:drop-shadow(0 0 5px rgba(240,217,159,0.4))}
.lcb-wheel .gl-s{fill:none;stroke:var(--lcb-gold);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}
.lcb-wheel .gl-f{fill:var(--lcb-gold);stroke:none}
.lcb-wheel .zsym .gl-s{stroke:var(--lcb-gold-soft);stroke-width:1;opacity:.9}
.lcb-wheel .zsym .gl-f{fill:var(--lcb-gold-soft);opacity:.9}
.lcb-wheel .p-halo{fill:rgba(11,9,18,0.7);stroke:var(--lcb-gold);stroke-width:1;opacity:.82}
.lcb-wheel .p-moonring{fill:none;stroke:var(--lcb-gold);stroke-width:1;opacity:.7}
.lcb-wheel .asc-label{fill:var(--lcb-gold);font-family:"Newsreader",serif;font-weight:400;font-size:11px;letter-spacing:.06em}
.lcb-wheel .lcb-w-read{fill:var(--lcb-label);font-family:"Newsreader",serif;font-weight:400;font-size:9px;letter-spacing:.02em;opacity:0}
.lcb-w-planet{transform-box:fill-box;transform-origin:center}

.lcb-pivot-lead{margin:0 auto;font-family:"Fraunces",Georgia,serif;font-weight:400;font-optical-sizing:auto;
  color:var(--lcb-ivory);font-size:clamp(1.78rem,1.25rem + 2.5vw,2.7rem);line-height:1.14;
  letter-spacing:-0.018em;max-width:21ch;text-wrap:balance;text-shadow:0 1px 26px rgba(4,3,10,0.5)}
.lcb-chart-scene .lcb-pivot-lead{margin-bottom:clamp(24px,5vw,44px)}
.lcb-pivot-body{margin:clamp(20px,4vw,30px) auto 0;font-family:"Newsreader",Georgia,serif;font-weight:400;
  font-optical-sizing:auto;color:var(--lcb-body);font-size:clamp(1.16rem,1rem + 1.4vw,1.48rem);
  line-height:1.58;max-width:32ch;text-wrap:pretty;text-shadow:0 1px 18px rgba(4,3,10,0.42)}

/* BEAT 3 — crossing: two arcs, two heads, a braid */
.lcb-souls-hold{position:relative;width:min(96vw,520px);height:34svh;max-height:320px;margin-bottom:clamp(8px,3vw,26px)}
.lcb-souls-svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.lcb-arc{fill:none;stroke:var(--lcb-gold-soft);stroke-width:1.1;vector-effect:non-scaling-stroke;stroke-linecap:round;opacity:.5}
.lcb-arc-human{stroke:var(--lcb-ivory);opacity:.42}
.lcb-braid{fill:none;stroke-width:1.2;vector-effect:non-scaling-stroke;stroke-linecap:round;opacity:0;
  stroke:var(--lcb-gold);filter:drop-shadow(0 0 4px rgba(240,217,159,0.4))}
.lcb-head{opacity:0}
.lcb-head-pet{fill:#f6ebcf;filter:drop-shadow(0 0 3px rgba(240,217,159,0.9)) drop-shadow(0 0 9px rgba(240,217,159,0.45)) drop-shadow(0 0 20px rgba(214,190,134,0.22))}
.lcb-head-human{fill:#f4f0e6;filter:drop-shadow(0 0 3px rgba(239,233,221,0.9)) drop-shadow(0 0 9px rgba(206,214,242,0.45)) drop-shadow(0 0 20px rgba(150,160,210,0.22))}
.lcb-head-one{fill:#f4ecdb;filter:drop-shadow(0 0 4px rgba(244,236,219,0.95)) drop-shadow(0 0 12px rgba(240,217,159,0.5)) drop-shadow(0 0 26px rgba(214,190,134,0.24))}
.lcb-echo{opacity:0;fill:#fff6de;filter:drop-shadow(0 0 4px rgba(255,246,222,0.9)) drop-shadow(0 0 10px rgba(240,217,159,0.4))}
.lcb-ripple{fill:none;stroke:var(--lcb-gold);stroke-width:1.2;vector-effect:non-scaling-stroke;opacity:0;transform-box:fill-box;transform-origin:center}
.lcb-souls-text .lcb-ln{will-change:transform,opacity}

/* BEAT 4 — revealed: the ghost wheel + the Ascendant CTA.
   LEGIBILITY LAW (2026-07-04): the wheel never fights the words. Two guards:
   (1) a radial mask keeps the wheel's centre — the zone the copy lives in —
   at a permanent ghost, so only the outer rim/glyph ring lifts to full light
   in the clear sky around the text column; (2) each text band carries its own
   soft night scrim, so the map visibly dims beneath the words and re-brightens
   between them. */
.lcb-payoff-wheel-wrap{position:absolute;left:50%;top:43%;transform:translate(-50%,-50%);width:min(94vw,560px);aspect-ratio:1;
  z-index:0;pointer-events:none;opacity:0;
  -webkit-mask-image:radial-gradient(circle closest-side at 50% 50%, rgba(0,0,0,0.26) 0%, rgba(0,0,0,0.3) 46%, #000 84%);
  mask-image:radial-gradient(circle closest-side at 50% 50%, rgba(0,0,0,0.26) 0%, rgba(0,0,0,0.3) 46%, #000 84%)}
.lcb-payoff-scene .lcb-payoff-line,
.lcb-payoff-scene .lcb-beat.lcb-support{position:relative;z-index:1}
.lcb-payoff-scene .lcb-payoff-line::before,
.lcb-payoff-scene .lcb-beat.lcb-support::before{
  content:"";position:absolute;z-index:-1;pointer-events:none;
  inset:-16px -26px;border-radius:26px;
  background:rgba(10,8,17,0.9);
  filter:blur(15px)}
/* the passage ends where the form begins: no dead sky after the gold rule */
.lcb-scene.lcb-payoff{min-height:auto;padding-bottom:clamp(40px,7svh,68px)}
.lcb-payoff-wheel{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.lcb-b4-core{position:absolute;left:50%;top:43%;width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:50%;
  background:radial-gradient(circle, rgba(244,236,219,0.95), rgba(214,190,134,0.4) 55%, transparent 76%);
  filter:blur(4px);opacity:0;z-index:0}
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
  .lcb-wheel-wrap{width:min(90vw,404px)}
  .lcb-b1{top:5%;right:-2%;width:min(74vw,320px);height:min(74vw,320px)}
}
@media (prefers-reduced-motion:reduce){
  .lcb-asc.lit{animation:none}
  .lcb-pivot-body.igniting .lcb-ignite{animation:none}
}
`;

// exponential-falloff cubic-bezier(.16,1,.3,1) — the ONE house ease, solved
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
const HOUSE = makeCubicBezier(0.16, 1, 0.3, 1);

export function CosmicBridge() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === "undefined") return;

    const q = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = root) => scope.querySelector<T>(sel);
    const qa = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = root) => Array.from(scope.querySelectorAll<T>(sel));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pad2 = (n: number) => (n < 10 ? "0" : "") + n;

    // ---------- build both natal wheels from the shared CHART ----------
    const wheel2 = q<SVGSVGElement>(".lcb-chart-scene .lcb-wheel");
    if (wheel2) wheel2.innerHTML = buildWheel(false);
    const wheel4 = q<SVGSVGElement>(".lcb-payoff-wheel");
    if (wheel4) wheel4.innerHTML = buildWheel(true);

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
    const canvas = q<HTMLCanvasElement>(".lcb-canvas");
    const canvasWrap = q(".lcb-canvas-wrap");
    let drawStars = () => {};
    let canvasVisible = true;
    let starCio: IntersectionObserver | undefined;
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
        const n = mobile ? 62 : 132;
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
      starCio = new IntersectionObserver((e) => { canvasVisible = e[0].isIntersecting; }, { threshold: 0 });
      starCio.observe(root);
    }

    // ---------- stage coverage-opacity + slow starfield parallax ----------
    const back = q(".lcb-back");
    const front = q(".lcb-front");
    let ticking = false;
    const update = () => {
      ticking = false;
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const visT = Math.max(0, rect.top), visB = Math.min(vh, rect.bottom);
      const covered = Math.max(0, visB - visT) / vh;
      // Hold the night longer at both ends so the passage hands into the form
      // inside one continuous sky (no seam as the fixed stage releases).
      const op = Math.max(0, Math.min(1, (covered - 0.05) / 0.55));
      if (back) (back as HTMLElement).style.opacity = String(op);
      if (front) (front as HTMLElement).style.opacity = String(op);
      if (!reduced && canvasVisible && canvasWrap) {
        const denom = root.offsetHeight - vh || 1;
        const prog = Math.max(0, Math.min(1, -rect.top / denom));
        (canvasWrap as HTMLElement).style.transform = `translate3d(0,${(prog * -70).toFixed(1)}px,0)`;
      }
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    const onResize = () => { drawStars(); onScroll(); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    update();

    // ---------- damped pointer parallax (desktop, transform only) ----------
    let pointerRAF = 0; let pointerOn = false;
    let mx = 0, my = 0, tx = 0, ty = 0;
    const moonPt = q(".lcb-moon-pt");
    const isMobileNow = window.innerWidth < 768;
    const onPointer = (e: PointerEvent) => { tx = e.clientX / window.innerWidth - 0.5; ty = e.clientY / window.innerHeight - 0.5; };
    if (!reduced && !isMobileNow) {
      pointerOn = true;
      window.addEventListener("pointermove", onPointer, { passive: true });
      const loop = () => {
        mx += (tx - mx) * 0.06; my += (ty - my) * 0.06;
        if (moonPt) (moonPt as HTMLElement).style.transform = `translate3d(${(mx * 10).toFixed(2)}px,${(my * 8).toFixed(2)}px,0)`;
        pointerRAF = requestAnimationFrame(loop);
      };
      pointerRAF = requestAnimationFrame(loop);
    }

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

    // ================= REDUCED MOTION: honest final state =================
    if (reduced) {
      gsap.set(q(".lcb-moon-img.blur"), { opacity: 0 });
      gsap.set(q(".lcb-moon-img.sharp"), { opacity: 1 });
      gsap.set([...allWords, ...allInners, ...qa(".lcb-souls-text .lcb-ln")], { opacity: 1, yPercent: 0, y: 0 });
      gsap.set(qa(".lcb-b1-star"), { opacity: 1, scale: 1 });
      gsap.set(".lcb-wheel", { opacity: 1 });
      gsap.set(".lcb-payoff-wheel-wrap", { opacity: 0.9 });
      gsap.set([...qa(".lcb-w-planet"), ...qa(".lcb-w-zsym"), ...qa(".lcb-w-read"), ...qa(".lcb-w-lontick")], { opacity: 1, scale: 1 });
      gsap.set(qa(".lcb-braid"), { opacity: 0.9 });
      gsap.set(q(".lcb-head-one"), { opacity: 1 });
      gsap.set(q(".lcb-b4-core"), { opacity: 0.5, filter: "blur(0px)" });
      gsap.set(q(".lcb-rule"), { scaleX: 1 });
      const asc = q(".lcb-asc"); if (asc) asc.classList.add("lit");
      if (back) (back as HTMLElement).style.opacity = "1";
      if (front) (front as HTMLElement).style.opacity = "1";
      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onResize);
        if (starCio) starCio.disconnect();
      };
    }

    // ================= MOTION =================
    root.classList.add("lcb-motion");
    gsap.set(allWords, { yPercent: 118, opacity: 0 });
    gsap.set(allInners, { yPercent: 118, opacity: 0 });
    gsap.set(q(".lcb-moon-img.sharp"), { opacity: 0 });
    gsap.set(q(".lcb-moon-img.blur"), { opacity: 1 });

    const mm = gsap.matchMedia();
    const ios: IntersectionObserver[] = [];

    const buildStory = (mobile: boolean) => {
      const amp = mobile ? 0.55 : 1;
      const scrub = mobile ? 1.2 : 1;

      // ---- SPINE: the moon travels between beat homes (transform only) ----
      const W = window.innerWidth, H = window.innerHeight;
      const travel = q(".lcb-moon-travel");
      if (travel) {
        gsap.timeline({ scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub } })
          .to(travel, { x: -0.15 * W * amp, y: 0.10 * H * amp, ease: HOUSE, duration: 1 })
          .to(travel, { x: -0.02 * W * amp, y: 0.02 * H * amp, ease: HOUSE, duration: 1 })
          .to(travel, { x: 0.05 * W * amp, y: -0.11 * H * amp, ease: HOUSE, duration: 1 });
      }

      // =============== BEAT 1 — ARRIVAL (scroll = playhead) ===============
      const open = q(".lcb-open");
      if (open) {
        const words = qa(".lcb-wd", open);
        const support = qa(".lcb-support .lcb-i", open);
        const stars = qa(".lcb-b1-star", open);       // [joy, trust, gaze]
        const cons = qa<SVGGeometryElement>(".lcb-b1 .lcb-con", open);
        primeDraw(cons);
        gsap.set(stars, { opacity: 0, scale: 0.6 });
        gsap.set(q(".lcb-dawn", open), { opacity: 0, yPercent: 18 });

        const t1 = gsap.timeline({ scrollTrigger: { trigger: open, start: "top 82%", end: "bottom 42%", scrub } });
        t1.to(q(".lcb-moon-img.blur"), { opacity: 0, ease: "none", duration: 1.1 }, 0)
          .to(q(".lcb-moon-img.sharp"), { opacity: 1, ease: "none", duration: 1.1 }, 0)
          .fromTo(q(".lcb-moon"), { y: 14, scale: 1.04 }, { y: 0, scale: 1.0, ease: HOUSE, duration: 1.3 }, 0)
          .to(q(".lcb-dawn", open), { opacity: 1, yPercent: 0, ease: HOUSE, duration: 1.6 }, 0.1)
          .to(words, { yPercent: 0, opacity: 1, ease: HOUSE, duration: 0.9, stagger: 0.12 }, 0.35);
        const igniteAt = [1.15, 1.95, 2.75];
        support.forEach((ln, i) => {
          t1.to(ln, { yPercent: 0, opacity: 1, ease: HOUSE, duration: 0.8 }, igniteAt[i]);
          const star = stars[i];
          if (star) {
            const dur = i === 1 ? 1.0 : 0.7;   // TRUST heavier / slower
            const sink = i === 1 ? 6 : 0;      // TRUST sinks as it lands
            t1.fromTo(star, { opacity: 0, scale: 0.6, y: i === 1 ? -4 : 0 }, { opacity: 1, scale: 1, y: sink, ease: HOUSE, duration: dur }, igniteAt[i]);
          }
          if (cons[i]) t1.to(cons[i], { strokeDashoffset: 0, ease: HOUSE, duration: 0.9 }, igniteAt[i] + 0.15);
        });
        // GAZE lands -> the moon answers with ONE slow breath (once)
        t1.to(q(".lcb-moon-bloom"), { scale: 1.06, ease: HOUSE, duration: 0.8, yoyo: true, repeat: 1 }, 2.95);
      }

      // =============== BEAT 2 — NAMING (scroll = playhead) ===============
      const chart = q(".lcb-chart-scene");
      if (chart && wheel2) {
        const lead = qa(".lcb-pivot-lead .lcb-wd", chart);
        const body = qa(".lcb-pivot-body .lcb-i", chart);
        const rings = qa<SVGGeometryElement>(".lcb-w-ring, .lcb-w-sign", chart);
        const ticks = qa<SVGGeometryElement>(".lcb-w-tick", chart);
        const houses = qa<SVGGeometryElement>(".lcb-w-house", chart);
        const axis = qa<SVGGeometryElement>(".lcb-w-axis", chart);
        const legs = qa<SVGGeometryElement>(".lcb-w-leg", chart);
        const aspects = qa<SVGGeometryElement>(".lcb-w-aspect", chart);
        const lumin = qa<SVGGeometryElement>(".lcb-w-lumin", chart);
        const zsyms = qa(".lcb-w-zsym", chart);
        const planets = qa(".lcb-w-planet", chart);
        const lonticks = qa(".lcb-w-lontick", chart);
        const reads = qa<SVGTextElement>(".lcb-w-read", chart);
        primeDraw([...rings, ...ticks, ...houses, ...axis, ...legs, ...aspects, ...lumin]);
        gsap.set(wheel2, { opacity: 0 });
        gsap.set(planets, { opacity: 0 });
        gsap.set(zsyms, { opacity: 0, scale: 0.9, rotation: -6, transformOrigin: "center" });
        gsap.set(reads, { opacity: 0 });
        gsap.set(lonticks, { opacity: 0 });

        const seedLayer = q(".lcb-seeds", chart);
        const seeds: HTMLElement[] = [];
        if (seedLayer) {
          seedLayer.innerHTML = "";
          const sn = mobile ? 7 : 11;
          for (let i = 0; i < sn; i++) {
            const sd = document.createElement("span"); sd.className = "lcb-seed"; seedLayer.appendChild(sd); seeds.push(sd);
            const ang = Math.random() * Math.PI * 2, rad = 60 + Math.random() * (mobile ? 116 : 148);
            gsap.set(sd, { x: Math.cos(ang) * rad, y: Math.sin(ang) * rad, opacity: 0, scale: 0.6 + Math.random() * 0.7 });
          }
        }
        const pScatter = planets.map(() => { const a = Math.random() * Math.PI * 2, r = 40 + Math.random() * 70; return { x: Math.cos(a) * r, y: Math.sin(a) * r }; });
        planets.forEach((p, i) => gsap.set(p, { x: pScatter[i].x, y: pScatter[i].y, filter: "blur(5px)" }));

        const lead0 = q(".lcb-pivot-lead", chart);
        const body0 = q(".lcb-pivot-body", chart);
        const t2 = gsap.timeline({ scrollTrigger: { trigger: lead0 || chart, start: "top 74%", endTrigger: body0 || chart, end: "bottom 56%", scrub } });
        t2.to(lead, { yPercent: 0, opacity: 1, ease: HOUSE, duration: 0.9, stagger: 0.1 }, 0);
        if (seeds.length) t2.to(seeds, { opacity: 0.72, ease: "none", duration: 0.5, stagger: 0.03 }, 0.2);
        t2.to(wheel2, { opacity: 1, ease: "none", duration: 0.5 }, 0.4)
          .to(rings, { strokeDashoffset: 0, ease: "none", duration: 1.4, stagger: 0.05 }, 0.5);
        // the fixing: each body locks one at a time; its longitude tick ignites
        planets.forEach((p, i) => {
          const at = 0.7 + i * 0.16;
          t2.to(p, { x: 0, y: 0, opacity: 1, filter: "blur(0px)", ease: HOUSE, duration: 0.55 }, at);
          const key = (p as HTMLElement).dataset.key;
          const tick = lonticks.find((l) => (l as HTMLElement).dataset.key === key);
          if (tick) t2.fromTo(tick, { opacity: 0 }, { opacity: 0.9, ease: HOUSE, duration: 0.4 }, at + 0.1);
          if (legs[i]) t2.to(legs[i], { strokeDashoffset: 0, ease: "none", duration: 0.4 }, at + 0.12);
        });
        if (seeds.length) t2.to(seeds, { opacity: 0, scale: 0.4, ease: "power2.in", duration: 0.8, stagger: 0.02 }, 0.9);
        t2.to(body, { yPercent: 0, opacity: 1, ease: HOUSE, duration: 0.85, stagger: 0.14 }, 2.1);
        // SECOND rack focus: degree ring sharpens, readouts count up, glyphs upright
        const tickGroup = q(".lcb-w-tickgroup", chart) || wheel2;
        gsap.set(tickGroup, { filter: "blur(5px)" });
        t2.to(ticks, { strokeDashoffset: 0, ease: "none", duration: 1.0, stagger: 0.003 }, 2.2)
          .to(tickGroup, { filter: "blur(0px)", ease: HOUSE, duration: 0.9 }, 2.5)
          .to(houses, { strokeDashoffset: 0, ease: "none", duration: 0.9, stagger: 0.02 }, 2.5)
          .to(axis, { strokeDashoffset: 0, ease: "none", duration: 0.9 }, 2.5)
          .to(zsyms, { opacity: 0.9, scale: 1, rotation: 0, ease: HOUSE, duration: 0.6, stagger: 0.03 }, 2.6);
        reads.forEach((txt, i) => {
          const deg = +(txt.dataset.deg || 0), min = +(txt.dataset.min || 0), total = deg * 60 + min;
          const proxy = { v: 0 };
          t2.to(proxy, { v: total, ease: HOUSE, duration: 0.7, onUpdate: () => { const cur = Math.round(proxy.v); txt.textContent = Math.floor(cur / 60) + "° " + pad2(cur % 60) + "'"; } }, 2.7 + i * 0.03)
            .to(txt, { opacity: 1, ease: HOUSE, duration: 0.5 }, 2.7 + i * 0.03);
        });
        // eclipse: aspect chords one at a time; Sun-Moon diameter LAST + slowest
        t2.to(aspects, { strokeDashoffset: 0, ease: "none", duration: 1.0, stagger: 0.12 }, 3.0);
        if (lumin[0]) {
          t2.to(lumin, { strokeDashoffset: 0, ease: HOUSE, duration: 1.4 }, 3.9);
          const pulse = q(".lcb-lumin-pulse", chart);
          if (pulse) {
            const lp = samplePath(lumin[0], 60);
            const px = { t: 0 };
            gsap.set(pulse, { opacity: 0 });
            t2.to(pulse, { opacity: 0.9, ease: HOUSE, duration: 0.3 }, 4.4)
              .to(px, { t: 1, ease: HOUSE, duration: 1.0, onUpdate: () => { const p = atT(lp, px.t); gsap.set(pulse, { x: p.x, y: p.y }); } }, 4.4)
              .to(pulse, { opacity: 0, ease: HOUSE, duration: 0.4 }, 5.2)
              .to(q(".lcb-moon-img.sharp"), { filter: "saturate(0.82) contrast(0.94) brightness(0.9)", ease: HOUSE, duration: 0.8 }, 5.0);
          }
        }
        // "names" ignites gold as the eclipse line comes into reading range
        const bodyEl = q(".lcb-pivot-body", chart);
        if (bodyEl) {
          const ioIg = new IntersectionObserver((e) => { if (e[0].isIntersecting) { bodyEl.classList.add("igniting"); ioIg.disconnect(); } }, { rootMargin: "0px 0px -30% 0px", threshold: 0.01 });
          ioIg.observe(bodyEl); ios.push(ioIg);
        }
      }

      // =============== BEAT 3 — CROSSING (played on enter) ===============
      const souls = q(".lcb-souls-hold");
      if (souls) {
        const humanPath = q<SVGGeometryElement>(".lcb-arc-human", souls);
        const petPath = q<SVGGeometryElement>(".lcb-arc-pet", souls);
        const braids = qa<SVGGeometryElement>(".lcb-braid", souls);
        const headH = q(".lcb-head-human", souls);
        const headP = q(".lcb-head-pet", souls);
        const headOne = q(".lcb-head-one", souls);
        const ripple = q(".lcb-ripple", souls);
        const echoH = q(".lcb-echo-h", souls);
        const echoP = q(".lcb-echo-p", souls);
        const lines = qa(".lcb-souls-text .lcb-ln");

        if (humanPath && petPath && headH && headP) {
          const hPts = samplePath(humanPath), pPts = samplePath(petPath);
          const setHead = (el: Element | null, pts: { x: number; y: number }[], t: number) => { if (el) { const p = atT(pts, t); gsap.set(el, { x: p.x, y: p.y }); } };
          setHead(headH, hPts, 0); setHead(headP, pPts, 0);
          primeDraw([humanPath, petPath, ...braids]);
          gsap.set([headH, headP, headOne, ripple, echoH, echoP], { opacity: 0 });
          gsap.set(lines, { opacity: 0, y: 16 });
          const hProxy = { t: 0 }, pProxy = { t: 0 };

          const t3 = gsap.timeline({ paused: true });
          t3.to([headH, headP], { opacity: 1, ease: HOUSE, duration: 0.5 }, 0.1);
          // LINE 1 — both arcs draw from opposite depths, bending toward the moon
          t3.to(petPath, { strokeDashoffset: 0, ease: "none", duration: 1.5 }, 0.2)
            .to(pProxy, { t: 1, ease: HOUSE, duration: 1.5, onUpdate: () => setHead(headP, pPts, pProxy.t) }, 0.2)
            .to(humanPath, { strokeDashoffset: 0, ease: "none", duration: 2.7 }, 0.2)
            .to(hProxy, { t: 0.62, ease: "none", duration: 1.7, onUpdate: () => setHead(headH, hPts, hProxy.t) }, 0.2);
          if (lines[0]) t3.to(lines[0], { opacity: 1, y: 0, ease: HOUSE, duration: 0.7 }, 0.9);
          // LINE 2 — the gold pet-head PARKS and waits (only breath); human decelerates in
          t3.to(headP, { scale: 1.03, ease: "sine.inOut", duration: 0.9, yoyo: true, repeat: 2, transformOrigin: "center" }, 1.7)
            .to(hProxy, { t: 1, ease: HOUSE, duration: 2.4, onUpdate: () => setHead(headH, hPts, hProxy.t) }, 2.0);
          if (lines[1]) t3.to(lines[1], { opacity: 1, y: 0, ease: HOUSE, duration: 0.8 }, 2.1);
          // LINE 3 — PEAK: ivory rests on the waiting gold, exactly as line 3 lands
          if (lines[2]) t3.to(lines[2], { opacity: 1, y: 0, ease: HOUSE, duration: 0.9 }, 4.0);
          // contact: heads crossfade into ONE point
          t3.to([headH, headP], { opacity: 0, ease: HOUSE, duration: 0.5 }, 4.4)
            .fromTo(headOne, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, ease: HOUSE, duration: 0.6, transformOrigin: "center" }, 4.4);
          // ONE quiet ripple — a single ring expands, thins, fades once
          if (ripple) t3.fromTo(ripple, { opacity: 0.7, scale: 0.2, strokeWidth: 1.4 }, { opacity: 0, scale: 3.2, strokeWidth: 0.4, ease: HOUSE, duration: 1.5, transformOrigin: "center" }, 4.5);
          // finite-speed light-echo brightens back OUTWARD along both arcs
          if (echoH && echoP) {
            const eh = { t: 1 }, ep = { t: 1 };
            setHead(echoH, hPts, 1); setHead(echoP, pPts, 1);
            t3.to([echoH, echoP], { opacity: 0.85, ease: HOUSE, duration: 0.3 }, 4.7)
              .to(eh, { t: 0, ease: HOUSE, duration: 1.1, onUpdate: () => setHead(echoH, hPts, eh.t) }, 4.7)
              .to(ep, { t: 0, ease: HOUSE, duration: 1.1, onUpdate: () => setHead(echoP, pPts, ep.t) }, 4.7)
              .to([echoH, echoP], { opacity: 0, ease: HOUSE, duration: 0.4 }, 5.6);
          }
          // FINALE — the two arcs rise on as ONE softly braided strand toward the moon
          t3.to(braids, { opacity: 0.9, ease: HOUSE, duration: 0.4 }, 5.2)
            .to(braids, { strokeDashoffset: 0, ease: HOUSE, duration: 1.6, stagger: 0.08 }, 5.2)
            .to(headOne, { y: "-=8", ease: HOUSE, duration: 1.6 }, 5.2);

          const io3 = new IntersectionObserver((e) => { if (e[0].isIntersecting) { t3.play(); io3.disconnect(); } }, { rootMargin: "0px 0px -28% 0px", threshold: 0.01 });
          io3.observe(souls); ios.push(io3);
        }
      }

      // =============== BEAT 4 — REVEALED (played on enter) ===============
      const payoff = q(".lcb-payoff-scene");
      if (payoff && wheel4) {
        const wheelWrap = q(".lcb-payoff-wheel-wrap", payoff);
        const head = qa(".lcb-payoff-line .lcb-wd", payoff);
        const support = qa(".lcb-support .lcb-i", payoff);
        const closing = qa(".lcb-close .lcb-i", payoff);
        const core = q(".lcb-b4-core", payoff);
        const asc = q(".lcb-asc", payoff);
        const rule = q(".lcb-rule", payoff);
        const aspects = qa<SVGGeometryElement>(".lcb-w-aspect, .lcb-w-lumin", wheel4);
        const planets = qa(".lcb-w-planet", wheel4);
        const sunB = planets.find((p) => (p as HTMLElement).dataset.key === "sun");
        const moonB = planets.find((p) => (p as HTMLElement).dataset.key === "moon");
        const venusB = planets.find((p) => (p as HTMLElement).dataset.key === "venus");
        const b4moon = q(".lcb-moon-b4");
        const bodies = [sunB, moonB, venusB];

        gsap.set(wheelWrap, { opacity: 0.12, scale: 1.0, transformOrigin: "center" });
        primeDraw(aspects);           // chords present but not drawn until release
        gsap.set(core, { opacity: 0 });
        if (asc) gsap.set(asc, { opacity: 0, y: 10 });

        const t4 = gsap.timeline({ paused: true });
        // LINE 1 — copy masks up; a continuous slow lean-in across the whole beat
        t4.to(head, { yPercent: 0, opacity: 1, ease: HOUSE, duration: 0.9, stagger: 0.12 }, 0)
          .to(wheelWrap, { scale: 1.06, ease: "none", duration: 9 }, 0)
          .fromTo(core, { opacity: 0, filter: "blur(6px)" }, { opacity: 0.5, filter: "blur(0px)", ease: HOUSE, duration: 1.4 }, 0.3);
        // LINE 2 — three bodies breathe up, one per phrase (Sun / Moon / Venus)
        support.forEach((ln, i) => {
          t4.to(ln, { yPercent: 0, opacity: 1, ease: HOUSE, duration: 0.7 }, 1.2 + i * 0.9);
          if (bodies[i]) t4.fromTo(bodies[i]!, { scale: 1 }, { scale: 1.16, ease: HOUSE, duration: 0.8, transformOrigin: "center" }, 1.2 + i * 0.9);
        });
        // LINE 3 — load-bearing silence: the 7% map just sits (~2s), only faint breath
        if (closing[0]) t4.to(closing[0], { yPercent: 0, opacity: 1, ease: HOUSE, duration: 0.8 }, 4.2);
        t4.to(wheelWrap, { opacity: 0.17, ease: "sine.inOut", duration: 1.0, yoyo: true, repeat: 1 }, 4.6);
        // LINE 4 — release: chords draw in, each ignites the glyphs it joins; the RIM
        // lifts to legibility (the masked centre stays a ghost so no line fights a word)
        if (closing[1]) t4.to(closing[1], { yPercent: 0, opacity: 1, ease: HOUSE, duration: 0.8 }, 6.7);
        t4.to(wheelWrap, { opacity: 0.9, ease: HOUSE, duration: 1.6 }, 6.7);
        // each chord draws on its own dashoffset; its completion ignites the two glyphs it joins
        aspects.forEach((el, i) => {
          t4.to(el, {
            strokeDashoffset: 0, ease: HOUSE, duration: 0.7,
            onComplete: () => {
              const a = el.getAttribute("data-a"), b = el.getAttribute("data-b");
              [a, b].forEach((k) => { const pl = planets.find((p) => (p as HTMLElement).dataset.key === k); if (pl) gsap.fromTo(pl, { filter: "brightness(1)" }, { filter: "brightness(1.9)", ease: HOUSE, duration: 0.5, yoyo: true, repeat: 1 }); });
            },
          }, 6.9 + i * 0.16);
        });
        if (b4moon) t4.to(b4moon, { y: 22 * amp, ease: HOUSE, duration: 2.2 }, 6.9);
        // LINE 5 — the button IS the Ascendant node: its glow ramps up once, then breathes
        if (closing[2]) t4.to(closing[2], { yPercent: 0, opacity: 1, ease: HOUSE, duration: 0.8 }, 8.6);
        if (asc) t4.to(asc, { opacity: 1, y: 0, ease: HOUSE, duration: 1.0, onComplete: () => asc.classList.add("lit") }, 8.8);
        if (rule) t4.fromTo(rule, { scaleX: 0 }, { scaleX: 1, ease: HOUSE, duration: 1.1 }, 8.9);

        const io4 = new IntersectionObserver((e) => { if (e[0].isIntersecting) { t4.play(); io4.disconnect(); } }, { rootMargin: "0px 0px -22% 0px", threshold: 0.01 });
        io4.observe(payoff); ios.push(io4);
      }
    };

    mm.add("(min-width: 769px)", () => { buildStory(false); });
    mm.add("(max-width: 768px)", () => { buildStory(true); });

    requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (pointerOn) window.removeEventListener("pointermove", onPointer);
      if (pointerRAF) cancelAnimationFrame(pointerRAF);
      if (starCio) starCio.disconnect();
      ios.forEach((io) => io.disconnect());
      mm.revert();
      root.classList.remove("lcb-motion");
    };
  }, []);

  return (
    <section ref={rootRef} className="lcb-root" aria-label="Why a birth chart">
      <style>{LCB_CSS}</style>

      {/* fixed graded night stage (behind the beats) */}
      <div className="lcb-back" aria-hidden="true">
        <div className="lcb-sky" />
        <div className="lcb-canvas-wrap"><canvas className="lcb-canvas" /></div>
        <div className="lcb-moon-travel">
          <div className="lcb-moon-b4">
            <div className="lcb-moon-pt">
              <div className="lcb-moon">
                <div className="lcb-moon-bloom" />
                <div className="lcb-moon-disc">
                  <img className="lcb-moon-img blur" src="/start/cosmos-moon-blur.webp" width={520} height={520} alt="" decoding="async" loading="lazy" />
                  <img className="lcb-moon-img sharp" src="/start/cosmos-moon.webp" width={520} height={520} alt="" decoding="async" loading="lazy" />
                  <div className="lcb-moon-grade" />
                  <div className="lcb-moon-term" />
                  <div className="lcb-moon-rim" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="lcb-grade" />
      </div>

      <div className="lcb-beats">
        {/* BEAT 1 — arrival */}
        <div className="lcb-scene lcb-open">
          <div className="lcb-dawn" aria-hidden="true" />
          <svg className="lcb-b1" viewBox="0 0 200 200" aria-hidden="true">
            <polyline className="lcb-con" points="150,54 96,150" />
            <polyline className="lcb-con" points="96,150 58,96" />
            <polyline className="lcb-con" points="58,96 188,22" />
            <circle className="lcb-b1-star" cx="150" cy="54" r="3.4" fill="#f6ebcf" />
            <circle className="lcb-b1-star" cx="96" cy="150" r="3.8" fill="#efe9dd" />
            <circle className="lcb-b1-star" cx="58" cy="96" r="3.2" fill="#f6ebcf" />
          </svg>
          <p className="lcb-beat lcb-split"><span className="lcb-ln">You know them by heart.</span></p>
          <p className="lcb-beat lcb-support lcb-linemask">
            <span className="lcb-ln">The exact thing that makes them lose their mind with joy.</span>
            <span className="lcb-ln">The weight of them when they finally fall asleep on you.</span>
            <span className="lcb-ln">The way you catch them watching you.</span>
          </p>
        </div>

        {/* BEAT 2 — naming: the natal wheel draws itself into being */}
        <div className="lcb-scene lcb-chart-scene">
          <p className="lcb-pivot-lead lcb-split">
            <span className="lcb-ln">And still, one part of who they are has never had a name.</span>
          </p>
          <div className="lcb-wheel-wrap">
            <svg className="lcb-wheel" viewBox="-210 -210 420 420" aria-hidden="true" />
            <div className="lcb-seeds" aria-hidden="true" />
            <svg viewBox="-210 -210 420 420" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none" }}>
              <circle className="lcb-lumin-pulse" cx="0" cy="0" r="3.2" fill="#fff6de" style={{ filter: "drop-shadow(0 0 5px rgba(240,217,159,0.9))", opacity: 0 }} />
            </svg>
          </div>
          <div className="lcb-chart-copy">
            <p className="lcb-pivot-body lcb-linemask">
              <span className="lcb-ln">At the moment they arrived, every planet stood in an exact place.</span>
              <span className="lcb-ln">Measured to the degree, the same order that <span className="lcb-ignite">names</span> an eclipse years before it happens.</span>
            </p>
          </div>
        </div>

        {/* BEAT 3 — crossing: two lives, timed to meet */}
        <div className="lcb-scene lcb-souls-scene">
          <div className="lcb-souls-hold" aria-hidden="true">
            <svg className="lcb-souls-svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet">
              <path className="lcb-arc lcb-arc-human" d="M44,46 C120,150 150,120 200,178" />
              <path className="lcb-arc lcb-arc-pet" d="M356,242 C300,150 250,206 200,178" />
              <path className="lcb-braid" d="M200,178 C214,124 186,84 200,26" />
              <path className="lcb-braid" d="M200,178 C186,124 214,84 200,26" />
              <circle className="lcb-ripple" cx="200" cy="178" r="10" />
              <circle className="lcb-echo lcb-echo-h" cx="0" cy="0" r="2.4" />
              <circle className="lcb-echo lcb-echo-p" cx="0" cy="0" r="2.4" />
              <circle className="lcb-head lcb-head-human" cx="0" cy="0" r="4.6" />
              <circle className="lcb-head lcb-head-pet" cx="0" cy="0" r="4.6" />
              <circle className="lcb-head lcb-head-one" cx="200" cy="178" r="5.2" />
            </svg>
          </div>
          <p className="lcb-beat lcb-support lcb-souls-text">
            <span className="lcb-ln">And somehow, their small life crossed yours.</span>
            <span className="lcb-ln">The one who waits at the door before your car has turned in.</span>
            <span className="lcb-ln lcb-emph">Two lives, out of everything, timed to meet.</span>
          </p>
        </div>

        {/* BEAT 4 — revealed: read closely, then set the chart */}
        <div className="lcb-scene lcb-payoff lcb-payoff-scene">
          <div className="lcb-payoff-wheel-wrap" aria-hidden="true">
            <svg className="lcb-payoff-wheel lcb-wheel" viewBox="-210 -210 420 420" />
          </div>
          <div className="lcb-b4-core" aria-hidden="true" />
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
