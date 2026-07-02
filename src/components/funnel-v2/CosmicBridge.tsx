import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

/* =====================================================================
   Cinematic Cosmos bridge (littlesouls.app)
   Sits between the hero and the "Set the chart" form. One story told in
   four beats where the MOTION carries the meaning:
     1 arrival  — words surface out of a rising pool of light
     2 naming   — scattered stars converge as the real natal wheel draws
                  itself into being, scrubbed to the scroll (you draw it)
     3 crossing — two comets on separate arcs meet, fuse into one gold
                  thread, and a soft flare blooms at the touch
     4 revealed — the night leans in, a constellation "map" sketches
                  behind the words, the light lifts, "Set the chart"
                  ink-bleeds on in gold
   Recurring element = points of light (stars): scattered -> named ->
   crossed -> a lit map. Light is knowing.

   STRICT-CSP SAFE: GSAP core + ScrollTrigger + MotionPathPlugin are all
   bundled by Vite (served from our own origin under script-src 'self'),
   never a CDN <script>. Moon self-hosted at /start/cosmos-moon.webp.
   Fonts (Fraunces + Newsreader) load via the site's already-permitted
   Google Fonts link. No blocked resources anywhere. Transform / opacity /
   filter / SVG-stroke only (GPU). Reduced-motion: every line shows solid
   and static, the chart shows fully drawn, the souls already met.
===================================================================== */

// ---- The real natal wheel (verbatim Monty placements, product geometry) ----
function buildWheel(): string {
  const R = { rimA: 200, rimB: 190, zGlyph: 175, zIn: 158, tickIn: 150, house: 94, plan: 126, asp: 94, hub: 7 };
  const SIGN: Record<string, number> = {
    Aries: 0, Taurus: 30, Gemini: 60, Cancer: 90, Leo: 120, Virgo: 150,
    Libra: 180, Scorpio: 210, Sagittarius: 240, Capricorn: 270, Aquarius: 300, Pisces: 330,
  };
  const ZODIAC = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];

  const PLAC = [
    { key: "sun", sign: "Pisces", deg: 24, lon: 0 },
    { key: "moon", sign: "Aries", deg: 16, lon: 0 },
    { key: "mercury", sign: "Sagittarius", deg: 20, lon: 0 },
    { key: "venus", sign: "Pisces", deg: 18, lon: 0 },
    { key: "mars", sign: "Cancer", deg: 12, lon: 0 },
    { key: "chiron", sign: "Capricorn", deg: 27, lon: 0 },
    { key: "lilith", sign: "Scorpio", deg: 16, lon: 0 },
    { key: "northNode", sign: "Gemini", deg: 14, lon: 0 },
    { key: "ascendant", sign: "Scorpio", deg: 29, lon: 0 },
  ];
  PLAC.forEach((p) => { p.lon = SIGN[p.sign] + p.deg; });

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

  let out = "";
  out += '<circle cx="0" cy="0" r="' + (R.rimA + 4) + '" fill="rgba(8,6,14,0.42)"/>';

  out += ring(R.rimA, "rim lcb-w-ring");
  out += ring(R.rimB, "rim2 lcb-w-ring");
  out += ring(R.zIn, "zin lcb-w-ring");
  out += ring(R.house, "hubline lcb-w-ring");
  out += ring(R.hub, "hubline lcb-w-ring");

  for (let i = 0; i < 12; i++) { out += lineAt(i * 30, R.zIn, R.rimB, "sign-div lcb-w-sign"); }

  for (let d = 0; d < 360; d += 5) { if (d % 30 === 0) continue; out += lineAt(d, R.tickIn, R.zIn, "tick" + (d % 10 === 0 ? " maj" : "") + " lcb-w-tick"); }

  const ascLon = 239;
  for (let h = 0; h < 12; h++) { out += lineAt(ascLon + h * 30, R.house, R.zIn, "house lcb-w-house"); }

  const axA = pt(ascLon, R.zIn), axB = pt(ascLon + 180, R.zIn);
  out += '<line class="stroke axis lcb-w-axis lcb-draw" x1="' + s(axA[0]) + '" y1="' + s(axA[1]) + '" x2="' + s(axB[0]) + '" y2="' + s(axB[1]) + '"/>';

  for (let z = 0; z < 12; z++) {
    const mid = z * 30 + 15, gp = pt(mid, R.zGlyph);
    out += glyphAt(ZODIAC[z], gp[0], gp[1], 1.0, "lcb-w-zsym zsym");
  }

  const ASP = [
    { a: 0, orb: 7, hard: 0, soft: 0 },
    { a: 60, orb: 5, hard: 0, soft: 1 },
    { a: 90, orb: 6, hard: 1, soft: 0 },
    { a: 120, orb: 6, hard: 0, soft: 1 },
    { a: 180, orb: 7, hard: 1, soft: 0 },
  ];
  let aspOut = "";
  for (let x = 0; x < PLAC.length; x++) {
    for (let y2 = x + 1; y2 < PLAC.length; y2++) {
      let diff = Math.abs(PLAC[x].lon - PLAC[y2].lon); if (diff > 180) diff = 360 - diff;
      for (let k = 0; k < ASP.length; k++) {
        if (Math.abs(diff - ASP[k].a) <= ASP[k].orb) {
          if (ASP[k].a === 0) break;
          const pa = pt(PLAC[x].lon, R.asp), pb = pt(PLAC[y2].lon, R.asp);
          aspOut += '<line class="stroke aspect ' + (ASP[k].hard ? "hard" : "soft") + ' lcb-w-aspect lcb-draw" x1="' + s(pa[0]) + '" y1="' + s(pa[1]) + '" x2="' + s(pb[0]) + '" y2="' + s(pb[1]) + '"/>';
          break;
        }
      }
    }
  }
  out += aspOut;

  const disp = PLAC.map((p) => ({ key: p.key, lon: p.lon })).sort((a, b) => a.lon - b.lon);
  const gap = 13;
  for (let q = 1; q < disp.length; q++) { if (disp[q].lon - disp[q - 1].lon < gap) { disp[q].lon = disp[q - 1].lon + gap; } }
  const dispMap: Record<string, number> = {}; disp.forEach((p) => { dispMap[p.key] = p.lon; });

  PLAC.forEach((p) => {
    const trueLon = p.lon, dl = dispMap[p.key];
    const legA = pt(trueLon, R.zIn - 3), legB = pt(dl, R.plan + 9);
    out += '<line class="stroke leg lcb-w-leg lcb-draw" x1="' + s(legA[0]) + '" y1="' + s(legA[1]) + '" x2="' + s(legB[0]) + '" y2="' + s(legB[1]) + '"/>';
    const gp = pt(dl, R.plan);
    let wrap = '<g class="lcb-w-planet">';
    wrap += '<circle class="p-halo" cx="' + s(gp[0]) + '" cy="' + s(gp[1]) + '" r="10.5"/>';
    if (p.key === "ascendant") {
      wrap += '<path class="gl-s" transform="translate(' + s(gp[0]) + ',' + s(gp[1]) + ') scale(0.7)" d="M0,-5 L4.4,0 L0,5 L-4.4,0 Z"/>';
      const lp = pt(dl, R.plan - 20);
      wrap += '<text class="asc-label" x="' + s(lp[0]) + '" y="' + s(lp[1] + 3) + '" text-anchor="middle">Asc</text>';
    } else {
      wrap += glyphAt(p.key, gp[0], gp[1], 0.92, "");
    }
    wrap += "</g>";
    out += wrap;
  });

  return out;
}

const LCB_CSS = `
.lcb-root{
  --lcb-cosmos:#0b0812; --lcb-deep:#050409; --lcb-lift:#0e0b16;
  --lcb-gold:#f0d99f; --lcb-gold-soft:#d9be86; --lcb-ivory:#efe9dd;
  --lcb-body:#d8d0c1; --lcb-label:#c3bbac;
  --lcb-ease:cubic-bezier(.22,1,.36,1);
  position:relative;
  font-family:"Newsreader",Georgia,serif;font-weight:300;
  -webkit-font-smoothing:antialiased;
}

/* ---- fixed graded night stage (behind the beats) ---- */
.lcb-back{position:fixed;inset:0;z-index:1;overflow:hidden;pointer-events:none;opacity:0;will-change:opacity}
.lcb-front{position:fixed;inset:0;z-index:3;pointer-events:none;opacity:0;will-change:opacity}
.lcb-layer{position:absolute;inset:-18% -8%;will-change:transform}

.lcb-sky{position:absolute;inset:0;background:linear-gradient(180deg,var(--lcb-deep) 0%,var(--lcb-cosmos) 46%,var(--lcb-lift) 100%)}
.lcb-haze{position:absolute;top:-34%;right:-22%;width:140vw;height:140vw;pointer-events:none;
  background:radial-gradient(circle, rgba(40,44,90,0.11) 0%, rgba(40,44,90,0.05) 30%, rgba(40,44,90,0) 60%);
  filter:blur(34px);animation:lcbHaze 120s ease-in-out infinite alternate}
@keyframes lcbHaze{from{transform:translate3d(0,0,0)}to{transform:translate3d(-2.4%,1.6%,0)}}

.lcb-starbg{position:absolute;inset:0;background-repeat:no-repeat;will-change:transform}
.lcb-drift-far{animation:lcbDrift 380s linear infinite alternate}
.lcb-drift-mid{animation:lcbDrift 240s linear infinite alternate}
@keyframes lcbDrift{from{transform:translate3d(-1.2%,0,0)}to{transform:translate3d(1.2%,0,0)}}

.lcb-near-inner{position:absolute;inset:0;will-change:transform}
.lcb-twinkle{position:absolute;border-radius:50%;
  background:radial-gradient(circle, rgba(240,242,255,1) 0%, rgba(206,214,242,0.5) 42%, rgba(0,0,0,0) 72%)}
.lcb-twinkle.lcb-tw{animation:lcbTw var(--lcb-dur,4.5s) ease-in-out infinite}
@keyframes lcbTw{0%,100%{opacity:var(--lcb-lo,.55);transform:scale(.86)}50%{opacity:var(--lcb-hi,1);transform:scale(1.08)}}

/* the moon: real photo, feathered, graded into the night, one cool bloom */
.lcb-moon-layer{inset:0}
.lcb-moon{position:absolute;top:-7%;right:-9%;width:min(32vw,258px);aspect-ratio:1;will-change:transform}
.lcb-moon-bloom{position:absolute;inset:-62%;border-radius:50%;pointer-events:none;mix-blend-mode:screen;
  background:radial-gradient(circle, rgba(150,160,210,0.20) 0%, rgba(150,160,210,0.09) 20%, rgba(150,160,210,0.03) 45%, rgba(150,160,210,0) 72%);
  animation:lcbBloom 12s ease-in-out infinite alternate}
@keyframes lcbBloom{from{opacity:.82;transform:scale(1)}to{opacity:1;transform:scale(1.04)}}
.lcb-moon-disc{position:absolute;inset:0;border-radius:50%;
  -webkit-mask-image:radial-gradient(circle, #000 93%, rgba(0,0,0,0) 100%);
  mask-image:radial-gradient(circle, #000 93%, rgba(0,0,0,0) 100%)}
.lcb-moon-img{display:block;width:100%;height:100%;object-fit:cover;transform:scale(1.06);
  filter:saturate(0.82) contrast(0.94) brightness(0.98)}
.lcb-moon-grade{position:absolute;inset:0;border-radius:50%;pointer-events:none;mix-blend-mode:multiply;
  background:radial-gradient(circle at 50% 54%, rgba(11,8,18,0) 56%, rgba(11,8,18,0.55) 100%),
    linear-gradient(180deg, rgba(120,132,180,0.05), rgba(11,8,18,0.12))}
.lcb-moon-term{position:absolute;inset:0;border-radius:50%;pointer-events:none;mix-blend-mode:soft-light;
  background:radial-gradient(circle at 33% 28%, rgba(214,222,255,0.12) 0%, rgba(0,0,0,0) 44%),
    radial-gradient(circle at 72% 78%, rgba(6,6,16,0.44) 0%, rgba(0,0,0,0) 64%)}
.lcb-moon-wrap{position:absolute;inset:0;border-radius:50%;pointer-events:none;mix-blend-mode:screen;
  background:radial-gradient(circle, rgba(0,0,0,0) 84%, rgba(168,180,224,0.24) 91%, rgba(0,0,0,0) 99%)}

/* one grade pass over the composition */
.lcb-grade{position:absolute;inset:0;pointer-events:none;mix-blend-mode:soft-light;
  background:linear-gradient(158deg, rgba(22,20,52,0.55) 0%, rgba(120,126,180,0.10) 55%, rgba(201,199,252,0.12) 100%)}

/* framing overlays (above the beats) */
.lcb-veil{position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(180deg, rgba(5,4,12,0.5) 0%, rgba(5,4,12,0) 22%, rgba(5,4,12,0) 74%, rgba(5,4,12,0.55) 100%)}
.lcb-vignette{position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(ellipse at 50% 42%, transparent 38%, rgba(4,4,12,0.6) 100%)}
.lcb-grain{position:absolute;inset:0;pointer-events:none;opacity:.038;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
/* beat 4 atmosphere: night leans in (focus), then the light lifts */
.lcb-focus{position:absolute;inset:0;pointer-events:none;opacity:0;
  background:radial-gradient(ellipse at 50% 46%, transparent 28%, rgba(3,2,9,0.6) 82%)}
.lcb-lift{position:absolute;inset:0;pointer-events:none;opacity:0;mix-blend-mode:screen;
  background:radial-gradient(ellipse at 50% 44%, rgba(150,152,205,0.16) 0%, rgba(120,124,180,0.05) 42%, transparent 66%)}

/* ---- beats layer ---- */
.lcb-beats{position:relative;z-index:2}
.lcb-scene{min-height:100svh;display:flex;flex-direction:column;justify-content:center;align-items:center;
  padding:14svh clamp(24px,7vw,80px);text-align:center;gap:clamp(20px,3.6vw,34px)}

/* display beats: Fraunces, high optical contrast, airy negative tracking, crisp */
.lcb-beat{position:relative;margin:0;max-width:19ch;
  font-family:"Fraunces",Georgia,serif;font-weight:400;font-optical-sizing:auto;
  font-size:clamp(2.05rem,1.5rem + 2.5vw,3.5rem);line-height:1.1;
  letter-spacing:-0.021em;color:var(--lcb-ivory);text-wrap:balance;
  text-shadow:0 1px 26px rgba(4,3,10,0.5)}
.lcb-beat.lcb-support{font-family:"Newsreader",Georgia,serif;font-weight:400;font-optical-sizing:auto;
  font-size:clamp(1.24rem,1.02rem + 1.7vw,1.7rem);line-height:1.6;max-width:30ch;
  color:var(--lcb-body);letter-spacing:.004em;text-wrap:pretty;text-shadow:0 1px 18px rgba(4,3,10,0.42)}
.lcb-open .lcb-beat:not(.lcb-support){font-weight:300;font-size:clamp(2.35rem,1.6rem + 3.4vw,4rem);
  max-width:15ch;letter-spacing:-0.028em;line-height:1.05;text-shadow:0 2px 34px rgba(4,3,10,0.55)}
.lcb-emph{color:var(--lcb-ivory)}
.lcb-it{font-style:italic;font-weight:400}

.lcb-ln{display:block}
.lcb-ln + .lcb-ln{margin-top:.46em}
.lcb-support .lcb-ln + .lcb-ln{margin-top:.26em}

/* word unit: JS wraps each word of a .lcb-split beat for per-word reveal */
.lcb-wd{display:inline-block}
/* one word ignites gold when the chart names it */
.lcb-ignite{background:linear-gradient(100deg,var(--lcb-ivory) 0%,var(--lcb-ivory) 38%,var(--lcb-gold) 50%,var(--lcb-ivory) 62%,var(--lcb-ivory) 100%);
  background-size:250% 100%;background-position:120% 0;
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent}

/* beat 1: rising pool of light the words surface out of */
.lcb-open{position:relative;overflow:hidden}
.lcb-dawn{position:absolute;left:50%;bottom:16%;width:min(120vw,940px);height:64vh;z-index:-1;
  transform:translate(-50%,22%);opacity:0;pointer-events:none;
  background:radial-gradient(ellipse at 50% 100%, rgba(126,116,158,0.18) 0%, rgba(72,66,112,0.07) 34%, transparent 66%)}
.lcb-motion .lcb-dawn{transition:opacity 1.7s var(--lcb-ease), transform 1.9s var(--lcb-ease)}
.lcb-motion .lcb-open.lcb-lit .lcb-dawn{opacity:1;transform:translate(-50%,0)}

/* hairline that draws in above the closing line */
.lcb-rule{display:block;width:min(46vw,220px);height:1px;margin:clamp(12px,2.6vw,22px) auto 0;
  background:linear-gradient(90deg,transparent,var(--lcb-gold-soft),transparent);
  transform:scaleX(0);transform-origin:center;opacity:.9}

/* text scrim (a soft velvet, wide + light so it deepens legibility, never a shadow smear) */
.lcb-rv{position:relative}
.lcb-rv::before{content:"";position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  width:172%;height:250%;pointer-events:none;z-index:-1;
  background:radial-gradient(ellipse at center, rgba(6,5,14,0.35) 0%, rgba(6,5,14,0) 78%)}

/* two-souls crossing: two comets on separate arcs meet + fuse */
.lcb-souls-scene{position:relative;overflow:hidden}
.lcb-souls-hold{position:relative;width:100%;height:32svh;margin-bottom:clamp(6px,3vw,26px)}
.lcb-comet{position:absolute;left:50%;top:50%;width:15px;height:15px;margin:-7.5px 0 0 -7.5px;border-radius:50%;
  opacity:0;will-change:transform,opacity}
.lcb-comet::before{content:"";position:absolute;right:100%;top:50%;transform:translateY(-50%);
  width:clamp(66px,17vw,140px);height:2px;border-radius:2px}
.lcb-comet-a{background:radial-gradient(circle, rgba(255,246,220,1) 0%, rgba(240,217,159,0.6) 44%, transparent 72%)}
.lcb-comet-a::before{background:linear-gradient(90deg, transparent, rgba(240,217,159,0.6))}
.lcb-comet-b{background:radial-gradient(circle, rgba(226,234,255,1) 0%, rgba(170,190,255,0.6) 44%, transparent 72%)}
.lcb-comet-b::before{background:linear-gradient(90deg, transparent, rgba(192,206,255,0.6))}
.lcb-bloom{position:absolute;left:50%;top:50%;width:220px;height:220px;margin:-110px 0 0 -110px;border-radius:50%;
  opacity:0;pointer-events:none;mix-blend-mode:screen;
  background:radial-gradient(circle, rgba(255,247,222,0.6) 0%, rgba(240,217,159,0.2) 30%, transparent 64%)}
.lcb-core{position:absolute;left:50%;top:50%;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;
  opacity:0;background:radial-gradient(circle, rgba(255,249,230,1) 0%, rgba(240,224,182,0.5) 50%, transparent 74%)}
.lcb-spark{position:absolute;left:50%;top:50%;width:3px;height:3px;margin:-1.5px 0 0 -1.5px;border-radius:50%;
  opacity:0;background:radial-gradient(circle, rgba(255,250,236,0.95), transparent 70%)}
.lcb-thread{position:absolute;left:50%;top:50%;width:min(56vw,320px);height:1px;margin-top:-0.5px;translate:-50% 0;opacity:0;
  background:linear-gradient(90deg, transparent, var(--lcb-gold), transparent);transform:scaleX(0);transform-origin:center;
  will-change:transform,opacity;filter:drop-shadow(0 0 5px rgba(240,217,159,0.4))}
.lcb-souls-text .lcb-ln{will-change:transform,opacity}

/* chart turn */
.lcb-chart-scene{position:relative;overflow:hidden}
.lcb-wheel-wrap{position:relative;width:min(86vw,438px);aspect-ratio:1;margin-bottom:clamp(28px,6vw,50px)}
.lcb-wheel{position:absolute;inset:0;width:100%;height:100%;overflow:visible;transform-origin:50% 50%}
.lcb-seeds{position:absolute;inset:0;pointer-events:none;z-index:2}
.lcb-seed{position:absolute;left:50%;top:50%;width:3px;height:3px;margin:-1.5px 0 0 -1.5px;border-radius:50%;
  opacity:0;background:radial-gradient(circle, rgba(240,242,255,0.95), rgba(200,208,240,0.3) 60%, transparent 76%);
  will-change:transform,opacity}
.lcb-wheel-sheen{position:absolute;inset:-3%;border-radius:50%;pointer-events:none;opacity:0;mix-blend-mode:screen;
  background:linear-gradient(105deg, transparent 42%, rgba(240,217,159,0.42) 50%, transparent 58%)}
.lcb-wheel .stroke{fill:none;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}
.lcb-wheel .rim{stroke:var(--lcb-gold-soft);stroke-width:1;opacity:.9}
.lcb-wheel .rim2{stroke:var(--lcb-gold-soft);stroke-width:1;opacity:.55}
.lcb-wheel .zin{stroke:var(--lcb-gold-soft);stroke-width:1;opacity:.55}
.lcb-wheel .hubline{stroke:var(--lcb-gold-soft);stroke-width:1;opacity:.42}
.lcb-wheel .sign-div{stroke:var(--lcb-gold-soft);stroke-width:1;opacity:.5}
.lcb-wheel .tick{stroke:var(--lcb-gold-soft);stroke-width:1;opacity:.34}
.lcb-wheel .tick.maj{opacity:.5}
.lcb-wheel .house{stroke:var(--lcb-gold-soft);stroke-width:1;opacity:.28}
.lcb-wheel .axis{stroke:var(--lcb-gold);stroke-width:1.5;opacity:.85;filter:drop-shadow(0 0 6px rgba(240,217,159,0.35))}
.lcb-wheel .leg{stroke:var(--lcb-gold);stroke-width:1;opacity:.42}
.lcb-wheel .aspect{stroke:var(--lcb-gold);stroke-width:1}
.lcb-wheel .aspect.hard{opacity:.32}
.lcb-wheel .aspect.soft{opacity:.22}
.lcb-wheel .gl-s{fill:none;stroke:var(--lcb-gold);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}
.lcb-wheel .gl-f{fill:var(--lcb-gold);stroke:none}
.lcb-wheel .zsym .gl-s{stroke:var(--lcb-gold-soft);stroke-width:1;opacity:.9}
.lcb-wheel .zsym .gl-f{fill:var(--lcb-gold-soft);opacity:.9}
.lcb-wheel .p-halo{fill:rgba(9,7,16,0.7);stroke:var(--lcb-gold);stroke-width:1;opacity:.82}
.lcb-wheel .asc-label{fill:var(--lcb-gold);font-family:"Newsreader",serif;font-weight:400;font-size:11px;letter-spacing:.06em}
.lcb-w-planet{transform-box:fill-box;transform-origin:center}

.lcb-chart-copy{position:relative}
.lcb-pivot-lead{margin:0 auto;font-family:"Fraunces",Georgia,serif;font-weight:400;font-optical-sizing:auto;
  color:var(--lcb-ivory);font-size:clamp(1.78rem,1.25rem + 2.5vw,2.7rem);line-height:1.14;
  letter-spacing:-0.018em;max-width:21ch;text-wrap:balance;text-shadow:0 1px 26px rgba(4,3,10,0.5)}
.lcb-chart-scene .lcb-pivot-lead{margin-bottom:clamp(24px,5vw,44px)}
.lcb-pivot-body{margin:clamp(22px,4vw,32px) auto 0;font-family:"Newsreader",Georgia,serif;font-weight:400;
  font-optical-sizing:auto;color:var(--lcb-body);font-size:clamp(1.16rem,1rem + 1.4vw,1.48rem);
  line-height:1.58;max-width:32ch;text-wrap:pretty;text-shadow:0 1px 18px rgba(4,3,10,0.42)}

/* payoff */
.lcb-payoff-scene{position:relative}
.lcb-mapgrid{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);width:min(80vw,560px);height:auto;
  pointer-events:none;opacity:0;z-index:-1;overflow:visible}
.lcb-mapgrid .lcb-mg-draw{stroke:var(--lcb-gold);stroke-width:1;fill:none;vector-effect:non-scaling-stroke;
  stroke-linecap:round;stroke-linejoin:round;opacity:.55}
.lcb-mapgrid circle{fill:var(--lcb-gold);opacity:.7}
.lcb-payoff-line{margin:0;font-family:"Fraunces",Georgia,serif;font-weight:400;font-optical-sizing:auto;
  color:var(--lcb-ivory);font-size:clamp(2.05rem,1.4rem + 3.1vw,3.5rem);line-height:1.14;
  letter-spacing:-0.02em;max-width:17ch;text-wrap:balance;text-shadow:0 1px 26px rgba(4,3,10,0.5)}
.lcb-gold-line{display:block;margin-top:.52em;font-weight:500;letter-spacing:-0.012em;
  background:linear-gradient(100deg,var(--lcb-gold-soft) 0%,#fff3d2 34%,var(--lcb-gold) 50%,#fff3d2 66%,var(--lcb-gold-soft) 100%);
  background-size:230% 100%;background-position:118% 0;
  -webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent}

/* ---- reveal engine (only when JS adds .lcb-motion) ---- */
/* line-level reveal for support lists + the payoff (crisp: no blur on small text) */
.lcb-root.lcb-motion .lcb-rv:not(.lcb-split) .lcb-ln{opacity:0;transform:translate3d(0,16px,0);
  transition:opacity .7s var(--lcb-ease), transform .8s var(--lcb-ease);will-change:opacity,transform}
.lcb-root.lcb-motion .lcb-rv:not(.lcb-split).lcb-in .lcb-ln{opacity:1;transform:none}
.lcb-root.lcb-motion .lcb-rv:not(.lcb-split).lcb-in .lcb-ln:nth-child(2){transition-delay:.14s}
.lcb-root.lcb-motion .lcb-rv:not(.lcb-split).lcb-in .lcb-ln:nth-child(3){transition-delay:.28s}
.lcb-root.lcb-motion .lcb-rv:not(.lcb-split).lcb-in .lcb-ln:nth-child(4){transition-delay:.42s}
.lcb-root.lcb-motion .lcb-rv:not(.lcb-split).lcb-in .lcb-ln:nth-child(5){transition-delay:.56s}

/* word-level reveal for the display beats: words surface upward (light blur) */
.lcb-root.lcb-motion .lcb-split .lcb-wd{opacity:0;transform:translate3d(0,0.9em,0);filter:blur(3px);
  transition:opacity .55s var(--lcb-ease), transform .8s var(--lcb-ease), filter .5s var(--lcb-ease);
  transition-delay:calc(var(--i,0) * 0.05s);will-change:opacity,transform,filter}
.lcb-root.lcb-motion .lcb-split.lcb-in .lcb-wd{opacity:1;transform:none;filter:blur(0)}

/* two-souls text is driven by the GSAP crossing timeline (hidden until then) */
.lcb-root.lcb-motion .lcb-souls-text .lcb-ln{opacity:0}

/* the word the chart names ignites gold once */
.lcb-root.lcb-motion .lcb-pivot-body.lcb-in .lcb-ignite{animation:lcbIgnite 1.9s var(--lcb-ease) .9s 1 forwards}
@keyframes lcbIgnite{0%{background-position:120% 0}55%{background-position:0 0}100%{background-position:-40% 0}}

/* closing flourish: hairline draws, "Set the chart" ink-bleeds L->R then sheens */
.lcb-root.lcb-motion .lcb-rule{transition:transform 1.1s var(--lcb-ease) .12s}
.lcb-root.lcb-motion .lcb-rule.lcb-in{transform:scaleX(1)}
.lcb-root.lcb-motion .lcb-gold-line{clip-path:inset(0 100% 0 0);transition:clip-path 1.15s var(--lcb-ease) .55s}
.lcb-root.lcb-motion .lcb-payoff-line.lcb-in .lcb-gold-line{clip-path:inset(0 0 0 0);
  animation:lcbSheen 2.6s var(--lcb-ease) 1.7s 1 forwards}
@keyframes lcbSheen{0%{background-position:118% 0}100%{background-position:-24% 0}}

@media (max-width:768px){
  .lcb-beat{font-size:clamp(1.72rem,1.2rem + 4.4vw,2.4rem)}
  .lcb-open .lcb-beat{font-size:clamp(2.05rem,1.35rem + 6vw,2.8rem)}
  .lcb-pivot-lead{font-size:clamp(1.55rem,1.15rem + 3.6vw,2.2rem)}
  .lcb-payoff-line{font-size:clamp(1.85rem,1.3rem + 4.6vw,2.7rem)}
  .lcb-moon{top:-4%;right:-8%;width:min(46vw,220px)}
  .lcb-wheel-wrap{width:min(90vw,410px)}
}
@media (prefers-reduced-motion:reduce){
  .lcb-root .lcb-rv .lcb-ln,
  .lcb-root .lcb-split .lcb-wd,
  .lcb-root .lcb-souls-text .lcb-ln{opacity:1 !important;transform:none !important;filter:none !important;transition:none !important}
  .lcb-root .lcb-rule{transform:scaleX(1) !important;transition:none !important}
  .lcb-root .lcb-gold-line{animation:none !important;clip-path:none !important}
  .lcb-root .lcb-ignite{animation:none !important;-webkit-text-fill-color:var(--lcb-ivory) !important;color:var(--lcb-ivory) !important}
  .lcb-root .lcb-dawn{opacity:1 !important;transform:translate(-50%,0) !important}
  .lcb-twinkle,.lcb-haze,.lcb-drift-far,.lcb-drift-mid,.lcb-moon-bloom{animation:none !important}
  .lcb-layer{transform:none !important}
  .lcb-souls-hold,.lcb-seeds,.lcb-mapgrid,.lcb-focus,.lcb-lift{display:none !important}
}
`;

export function CosmicBridge() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === "undefined") return;

    const qa = (sel: string) => Array.from(root.querySelectorAll<HTMLElement>(sel));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.innerWidth < 768;

    // ---- baked far/mid starfields (soft radial sprites, gently clustered) ----
    const bakeStars = (el: HTMLElement | null, count: number, sizeMin: number, sizeMax: number, aMin: number, aMax: number, r: number, g: number, b: number) => {
      if (!el) return;
      const parts: string[] = []; const clusters: [number, number][] = [];
      for (let c = 0; c < 5; c++) clusters.push([Math.random() * 100, Math.random() * 100]);
      for (let i = 0; i < count; i++) {
        let x: number, y: number;
        if (Math.random() < 0.55) {
          const cl = clusters[(Math.random() * clusters.length) | 0];
          x = Math.min(100, Math.max(0, cl[0] + (Math.random() - 0.5) * 26));
          y = Math.min(100, Math.max(0, cl[1] + (Math.random() - 0.5) * 26));
        } else { x = Math.random() * 100; y = Math.random() * 100; }
        const sz = (sizeMin + Math.random() * (sizeMax - sizeMin)).toFixed(2);
        const a = (aMin + Math.random() * (aMax - aMin)).toFixed(2);
        parts.push("radial-gradient(" + sz + "px " + sz + "px at " + x.toFixed(2) + "% " + y.toFixed(2) + "%, rgba(" + r + "," + g + "," + b + "," + a + ") 0%, rgba(0,0,0,0) 70%)");
      }
      el.style.backgroundImage = parts.join(",");
    };
    bakeStars(root.querySelector<HTMLElement>(".lcb-star-far"), mobile ? 55 : 110, 0.8, 1.6, 0.25, 0.45, 198, 206, 232);
    bakeStars(root.querySelector<HTMLElement>(".lcb-star-mid"), mobile ? 42 : 82, 1.2, 2.2, 0.5, 0.8, 240, 241, 250);

    // ---- near twinkle sprites (~22% twinkle, min brightness clamped) ----
    const nearInner = root.querySelector<HTMLElement>(".lcb-near-inner");
    if (nearInner) {
      nearInner.innerHTML = "";
      const n = mobile ? 18 : 34; const frag = document.createDocumentFragment();
      for (let i = 0; i < n; i++) {
        const sp = document.createElement("span"); sp.className = "lcb-twinkle";
        const size = (Math.random() * 1.1 + 2.0).toFixed(2);
        sp.style.width = size + "px"; sp.style.height = size + "px";
        sp.style.left = (Math.random() * 100).toFixed(2) + "%"; sp.style.top = (Math.random() * 100).toFixed(2) + "%";
        const hi = 0.82 + Math.random() * 0.18;
        if (!reduced && Math.random() < 0.24) {
          sp.classList.add("lcb-tw");
          const lo = Math.max(0.2, hi * (0.80 + Math.random() * 0.05));
          sp.style.setProperty("--lcb-hi", hi.toFixed(2));
          sp.style.setProperty("--lcb-lo", lo.toFixed(2));
          sp.style.setProperty("--lcb-dur", (Math.random() * 3 + 3).toFixed(2) + "s");
          sp.style.animationDelay = (Math.random() * 4).toFixed(2) + "s";
        } else { sp.style.opacity = hi.toFixed(2); }
        frag.appendChild(sp);
      }
      nearInner.appendChild(frag);
    }

    // ---- build the real natal wheel ----
    const svg = root.querySelector<SVGSVGElement>(".lcb-wheel");
    if (svg) svg.innerHTML = buildWheel();

    if (reduced) {
      qa(".lcb-rv").forEach((n) => n.classList.add("lcb-in"));
    } else {
      root.classList.add("lcb-motion");
    }

    // ---- stage coverage-opacity + damped scroll parallax ----
    const back = root.querySelector<HTMLElement>(".lcb-back");
    const front = root.querySelector<HTMLElement>(".lcb-front");
    const layers = qa(".lcb-layer");
    let ticking = false;
    const update = () => {
      ticking = false;
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const visT = Math.max(0, rect.top), visB = Math.min(vh, rect.bottom);
      const covered = Math.max(0, visB - visT) / vh;
      const op = Math.max(0, Math.min(1, (covered - 0.22) / 0.6));
      if (back) back.style.opacity = String(op);
      if (front) front.style.opacity = String(op);
      if (!reduced) {
        const denom = root.offsetHeight - vh || 1;
        const prog = Math.max(0, Math.min(1, -rect.top / denom));
        const f = mobile ? 0.42 : 1;
        layers.forEach((l) => {
          const d = parseFloat(l.dataset.depth || "0.3");
          l.style.transform = "translate3d(0," + (prog * d * -330 * f).toFixed(1) + "px,0)";
        });
      }
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();

    // ---- damped pointer parallax (desktop, transform only) ----
    let pointerRAF = 0; let pointerOn = false;
    let mx = 0, my = 0, tx = 0, ty = 0;
    const moonEl = root.querySelector<HTMLElement>(".lcb-moon");
    const onPointer = (e: PointerEvent) => {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
    };
    if (!reduced && !mobile) {
      pointerOn = true;
      window.addEventListener("pointermove", onPointer, { passive: true });
      const loop = () => {
        mx += (tx - mx) * 0.06; my += (ty - my) * 0.06;
        if (moonEl) moonEl.style.transform = "translate3d(" + (mx * 10).toFixed(2) + "px," + (my * 8).toFixed(2) + "px,0)";
        if (nearInner) nearInner.style.transform = "translate3d(" + (mx * 16).toFixed(2) + "px," + (my * 12).toFixed(2) + "px,0)";
        pointerRAF = requestAnimationFrame(loop);
      };
      pointerRAF = requestAnimationFrame(loop);
    }

    // ---- reveals + GSAP story timelines (motion only) ----
    const ios: IntersectionObserver[] = [];
    let ctx: gsap.Context | undefined;
    if (!reduced) {
      // split the display beats into words so each word surfaces on its own beat
      qa(".lcb-split").forEach((beat) => {
        let idx = 0;
        Array.from(beat.querySelectorAll<HTMLElement>(".lcb-ln")).forEach((ln) => {
          const nodes = Array.from(ln.childNodes);
          nodes.forEach((node) => {
            // keep any inline markup (e.g. the .lcb-ignite word) intact
            if (node.nodeType !== Node.TEXT_NODE) {
              if (node instanceof HTMLElement) {
                node.classList.add("lcb-wd");
                node.style.setProperty("--i", String(idx++));
              }
              return;
            }
            const text = node.textContent || "";
            const frag = document.createDocumentFragment();
            text.split(/(\s+)/).forEach((tok) => {
              if (tok === "") return;
              if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); return; }
              const w = document.createElement("span");
              w.className = "lcb-wd";
              w.textContent = tok;
              w.style.setProperty("--i", String(idx++));
              frag.appendChild(w);
            });
            ln.replaceChild(frag, node);
          });
        });
      });

      const rvIO = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("lcb-in"); rvIO.unobserve(en.target); } });
      }, { rootMargin: "0px 0px -20% 0px", threshold: 0.01 });
      qa(".lcb-rv").forEach((n) => rvIO.observe(n));
      ios.push(rvIO);

      ctx = gsap.context(() => {
        // BEAT 1 — arrival: the pool of light rises, words surface out of it
        const openScene = root.querySelector<HTMLElement>(".lcb-open");
        if (openScene) {
          const io1 = new IntersectionObserver((e) => {
            e.forEach((en) => { if (en.isIntersecting) { openScene.classList.add("lcb-lit"); io1.disconnect(); } });
          }, { rootMargin: "0px 0px -25% 0px", threshold: 0.01 });
          io1.observe(openScene); ios.push(io1);
        }

        // BEAT 2 — naming: scattered stars converge as the wheel draws, scrubbed to scroll
        const chartScene = root.querySelector<HTMLElement>(".lcb-chart-scene");
        if (chartScene && svg) {
          const draws = Array.from(root.querySelectorAll<SVGGeometryElement>(".lcb-wheel .lcb-draw"));
          draws.forEach((el) => {
            const len = el.getTotalLength ? el.getTotalLength() : 300;
            el.style.strokeDasharray = String(len);
            el.style.strokeDashoffset = String(len);
          });
          gsap.set(".lcb-wheel", { opacity: 0 });
          gsap.set(".lcb-w-planet", { opacity: 0, scale: 0, transformOrigin: "center" });
          gsap.set(".lcb-w-zsym", { opacity: 0, scale: 0.92, transformOrigin: "center" });
          gsap.set(".lcb-w-axis", { opacity: 0 });
          gsap.set(".lcb-wheel-sheen", { opacity: 0, x: "-60%" });

          // scatter seed stars around the wheel (the nameless part = loose points)
          const seedLayer = root.querySelector<HTMLElement>(".lcb-seeds");
          const seeds: HTMLElement[] = [];
          if (seedLayer) {
            const sn = mobile ? 9 : 12;
            for (let i = 0; i < sn; i++) {
              const sd = document.createElement("span"); sd.className = "lcb-seed";
              seedLayer.appendChild(sd); seeds.push(sd);
              const ang = Math.random() * Math.PI * 2, rad = 62 + Math.random() * (mobile ? 120 : 150);
              gsap.set(sd, { x: Math.cos(ang) * rad, y: Math.sin(ang) * rad, opacity: 0, scale: 0.7 + Math.random() * 0.7 });
            }
          }

          const wtl = gsap.timeline({
            scrollTrigger: {
              trigger: chartScene,
              start: mobile ? "top 76%" : "top 72%",
              end: mobile ? "center 34%" : "center 30%",
              scrub: 0.6,
            },
          });
          if (seeds.length) wtl.to(seeds, { opacity: 0.85, duration: 0.5, stagger: 0.03, ease: "none" }, 0);
          wtl.to(".lcb-wheel", { opacity: 1, duration: 0.4, ease: "none" }, 0.2)
            .to([".lcb-w-ring", ".lcb-w-sign"], { strokeDashoffset: 0, duration: 1.6, ease: "none", stagger: 0.05 }, 0.3);
          if (seeds.length) wtl.to(seeds, { x: 0, y: 0, opacity: 0, duration: 1.0, stagger: 0.03, ease: "power2.in" }, 0.4);
          wtl.to(".lcb-w-tick", { strokeDashoffset: 0, duration: 1.1, ease: "none", stagger: 0.004 }, 0.6)
            .to(".lcb-w-house", { strokeDashoffset: 0, duration: 1.2, ease: "none", stagger: 0.02 }, 0.9)
            .to(".lcb-w-axis", { opacity: 1, strokeDashoffset: 0, duration: 1.2, ease: "none" }, 0.9)
            .to(".lcb-w-zsym", { opacity: 1, scale: 1, duration: 0.6, ease: "none", stagger: 0.04 }, 1.3)
            .to(".lcb-w-leg", { strokeDashoffset: 0, duration: 0.6, ease: "none", stagger: 0.03 }, 1.5)
            .to(".lcb-w-planet", { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.5)", stagger: 0.05 }, 1.7)
            .to(".lcb-w-aspect", { strokeDashoffset: 0, duration: 1.4, ease: "none", stagger: 0.05 }, 2.1)
            .to(".lcb-wheel-sheen", { opacity: 1, duration: 0.2, ease: "none" }, 3.4)
            .to(".lcb-wheel-sheen", { x: "60%", duration: 1.4, ease: "power2.inOut" }, 3.4)
            .to(".lcb-wheel-sheen", { opacity: 0, duration: 0.5, ease: "none" }, 4.6);
        }

        // BEAT 3 — crossing: two comets on separate arcs meet, fuse into one thread
        const soulsHold = root.querySelector<HTMLElement>(".lcb-souls-hold");
        if (soulsHold) {
          const w = soulsHold.clientWidth || window.innerWidth;
          const h = soulsHold.clientHeight || 240;
          const spread = Math.min(w * 0.42, 320), amp = h * 0.26;
          const pathA = [{ x: -spread, y: -amp }, { x: -spread * 0.42, y: amp * 0.72 }, { x: 0, y: 0 }];
          const pathB = [{ x: spread, y: -amp }, { x: spread * 0.42, y: amp * 0.72 }, { x: 0, y: 0 }];
          const soulLines = Array.from(root.querySelectorAll<HTMLElement>(".lcb-souls-text .lcb-ln"));

          gsap.set(".lcb-comet-a", { opacity: 0, x: pathA[0].x, y: pathA[0].y });
          gsap.set(".lcb-comet-b", { opacity: 0, x: pathB[0].x, y: pathB[0].y });
          gsap.set(soulLines, { opacity: 0, y: 18 });

          const stl = gsap.timeline({ paused: true });
          stl.to(".lcb-comet-a", { opacity: 1, duration: 0.45, ease: "power1.out" }, 0.1)
            .to(".lcb-comet-b", { opacity: 1, duration: 0.45, ease: "power1.out" }, 0.1)
            .to(".lcb-comet-a", { motionPath: { path: pathA, curviness: 1.3, autoRotate: true }, duration: 1.7, ease: "power2.inOut" } as gsap.TweenVars, 0.2)
            .to(".lcb-comet-b", { motionPath: { path: pathB, curviness: 1.3, autoRotate: true }, duration: 1.7, ease: "power2.inOut" } as gsap.TweenVars, 0.2)
            // the touch: flare blooms, tails fade, a single core lights
            .to(".lcb-bloom", { opacity: 1, scale: 1.4, duration: 0.5, ease: "power2.out" }, 1.75)
            .to(".lcb-comet-a", { opacity: 0, duration: 0.4, ease: "power1.in" }, 1.8)
            .to(".lcb-comet-b", { opacity: 0, duration: 0.4, ease: "power1.in" }, 1.8)
            .fromTo(".lcb-core", { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }, 1.85)
            .to(".lcb-bloom", { opacity: 0, scale: 2.0, duration: 1.0, ease: "power2.in" }, 2.1)
            // the bond draws outward from the meeting
            .fromTo(".lcb-thread", { opacity: 0, scaleX: 0 }, { opacity: 1, scaleX: 1, duration: 1.1, ease: "expo.out" }, 2.0)
            .to(".lcb-core", { scale: 1.16, duration: 0.55, yoyo: true, repeat: 1, ease: "sine.inOut" }, 2.5)
            .to(".lcb-spark", { opacity: 0.9, scale: 1, duration: 0.6, stagger: 0.07, ease: "power1.out" }, 2.2);
          if (soulLines[0]) stl.to(soulLines[0], { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, 0.35);
          if (soulLines[1]) stl.to(soulLines[1], { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, 1.0);
          if (soulLines[2]) stl.to(soulLines[2], { opacity: 1, y: 0, duration: 0.85, ease: "power2.out" }, 1.85); // lands on the bloom

          const sIO = new IntersectionObserver((e) => {
            e.forEach((en) => { if (en.isIntersecting) { stl.play(); sIO.disconnect(); } });
          }, { rootMargin: "0px 0px -30% 0px", threshold: 0.01 });
          sIO.observe(soulsHold); ios.push(sIO);
        }

        // BEAT 4 — revealed: the night leans in, the map sketches, the light lifts
        const payoffScene = root.querySelector<HTMLElement>(".lcb-payoff-scene");
        if (payoffScene) {
          const mg = Array.from(root.querySelectorAll<SVGGeometryElement>(".lcb-mg-draw"));
          mg.forEach((el) => {
            const len = el.getTotalLength ? el.getTotalLength() : 200;
            el.style.strokeDasharray = String(len);
            el.style.strokeDashoffset = String(len);
          });
          const t4 = gsap.timeline({ paused: true });
          t4.to(".lcb-focus", { opacity: 1, duration: 1.3, ease: "power2.out" }, 0)
            .to(".lcb-mapgrid", { opacity: 1, duration: 0.5, ease: "power1.out" }, 0.85);
          if (mg.length) t4.to(mg, { strokeDashoffset: 0, duration: 1.3, ease: "power2.out", stagger: 0.09 }, 0.85);
          t4.to(".lcb-mapgrid", { opacity: 0, duration: 1.1, ease: "power1.in" }, 2.3)
            .to(".lcb-focus", { opacity: 0, duration: 1.3, ease: "power2.inOut" }, 2.1)
            .fromTo(".lcb-lift", { opacity: 0 }, { opacity: 1, duration: 1.2, ease: "power2.out" }, 2.1)
            .to(".lcb-lift", { opacity: 0.5, duration: 1.6, ease: "power1.inOut" }, 3.5);

          const io4 = new IntersectionObserver((e) => {
            e.forEach((en) => { if (en.isIntersecting) { t4.play(); io4.disconnect(); } });
          }, { rootMargin: "0px 0px -25% 0px", threshold: 0.01 });
          io4.observe(payoffScene); ios.push(io4);
        }
      }, root);

      requestAnimationFrame(() => ScrollTrigger.refresh());
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (pointerOn) window.removeEventListener("pointermove", onPointer);
      if (pointerRAF) cancelAnimationFrame(pointerRAF);
      ios.forEach((io) => io.disconnect());
      if (ctx) ctx.revert();
      root.classList.remove("lcb-motion");
    };
  }, []);

  return (
    <section ref={rootRef} className="lcb-root" aria-label="Why a birth chart">
      <style>{LCB_CSS}</style>

      {/* fixed graded night stage (behind the beats) */}
      <div className="lcb-back" aria-hidden="true">
        <div className="lcb-sky" />
        <div className="lcb-haze" />
        <div className="lcb-layer lcb-stars-far" data-depth="0.18"><div className="lcb-starbg lcb-star-far lcb-drift-far" /></div>
        <div className="lcb-layer lcb-stars-mid" data-depth="0.34"><div className="lcb-starbg lcb-star-mid lcb-drift-mid" /></div>
        <div className="lcb-layer lcb-moon-layer" data-depth="0.5">
          <div className="lcb-moon">
            <div className="lcb-moon-bloom" />
            <div className="lcb-moon-disc">
              <img className="lcb-moon-img" src="/start/cosmos-moon.webp" width={520} height={520} alt="" decoding="async" loading="lazy" />
              <div className="lcb-moon-grade" />
              <div className="lcb-moon-term" />
              <div className="lcb-moon-wrap" />
            </div>
          </div>
        </div>
        <div className="lcb-layer lcb-stars-near" data-depth="0.8"><div className="lcb-near-inner" /></div>
        <div className="lcb-grade" />
      </div>

      <div className="lcb-beats">
        {/* BEAT 1 — arrival */}
        <div className="lcb-scene lcb-open">
          <div className="lcb-dawn" aria-hidden="true" />
          <p className="lcb-beat lcb-rv lcb-split"><span className="lcb-ln">You know them by heart.</span></p>
          <p className="lcb-beat lcb-support lcb-rv">
            <span className="lcb-ln">The exact thing that makes them lose their mind with joy.</span>
            <span className="lcb-ln">The weight of them when they finally fall asleep on you.</span>
            <span className="lcb-ln">The way you catch them watching you.</span>
          </p>
        </div>

        {/* BEAT 2 — naming: the natal wheel draws itself into being */}
        <div className="lcb-scene lcb-chart-scene">
          <p className="lcb-pivot-lead lcb-rv lcb-split">
            <span className="lcb-ln">And still, one part of who they are has never had a name.</span>
          </p>
          <div className="lcb-wheel-wrap">
            <svg className="lcb-wheel" viewBox="-210 -210 420 420" aria-hidden="true" />
            <div className="lcb-seeds" aria-hidden="true" />
            <div className="lcb-wheel-sheen" aria-hidden="true" />
          </div>
          <div className="lcb-chart-copy">
            <p className="lcb-pivot-body lcb-rv">
              <span className="lcb-ln">At the moment they arrived, every planet stood in an exact place.</span>
              <span className="lcb-ln">Measured to the degree, the same order that <span className="lcb-ignite">names</span> an eclipse years before it happens.</span>
            </p>
          </div>
        </div>

        {/* BEAT 3 — crossing: two lives, timed to meet */}
        <div className="lcb-scene lcb-souls-scene">
          <div className="lcb-souls-hold" aria-hidden="true">
            <span className="lcb-comet lcb-comet-a" />
            <span className="lcb-comet lcb-comet-b" />
            <span className="lcb-bloom" />
            <span className="lcb-thread" />
            <span className="lcb-core" />
            <span className="lcb-spark" />
            <span className="lcb-spark" />
            <span className="lcb-spark" />
            <span className="lcb-spark" />
            <span className="lcb-spark" />
          </div>
          <p className="lcb-beat lcb-support lcb-souls-text">
            <span className="lcb-ln">And somehow, their small life crossed yours.</span>
            <span className="lcb-ln">The one who waits at the door before your car has turned in.</span>
            <span className="lcb-ln lcb-emph">Two lives, out of everything, timed to meet.</span>
          </p>
        </div>

        {/* BEAT 4 — revealed: read closely, then set the chart */}
        <div className="lcb-scene lcb-payoff lcb-payoff-scene">
          <svg className="lcb-mapgrid" viewBox="0 0 300 160" aria-hidden="true">
            <polyline className="lcb-mg-draw" points="18,124 66,74 118,98 162,46 210,82 256,40 288,92" />
            <line className="lcb-mg-draw" x1="118" y1="98" x2="138" y2="150" />
            <line className="lcb-mg-draw" x1="162" y1="46" x2="182" y2="14" />
            <line className="lcb-mg-draw" x1="210" y1="82" x2="232" y2="128" />
            <circle cx="18" cy="124" r="2.4" />
            <circle cx="66" cy="74" r="2.4" />
            <circle cx="118" cy="98" r="2.4" />
            <circle cx="162" cy="46" r="2.4" />
            <circle cx="210" cy="82" r="2.4" />
            <circle cx="256" cy="40" r="2.4" />
            <circle cx="288" cy="92" r="2.4" />
            <circle cx="138" cy="150" r="2.1" />
            <circle cx="182" cy="14" r="2.1" />
            <circle cx="232" cy="128" r="2.1" />
          </svg>
          <p className="lcb-beat lcb-rv lcb-split"><span className="lcb-ln">A birth chart is that one moment, read closely.</span></p>
          <p className="lcb-beat lcb-support lcb-rv">
            <span className="lcb-ln">Who they are.</span>
            <span className="lcb-ln">What steadies them.</span>
            <span className="lcb-ln">Why they love the way they do.</span>
          </p>
          <p className="lcb-payoff-line lcb-rv">
            <span className="lcb-ln">You have loved them without the map.</span>
            <span className="lcb-ln">Now you can see it.</span>
            <span className="lcb-ln lcb-gold-line">Set the chart.</span>
          </p>
          <span className="lcb-rule lcb-rv" aria-hidden="true" />
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
