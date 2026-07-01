import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/* =====================================================================
   Cinematic Cosmos bridge (littlesouls.app)
   Ported from the approved preview
   (content.littlesouls.app/viral-pet-media/bridge-reveal-cosmos.html).
   Sits between the hero and the "Set the chart" form. One moon hung in
   real graded night, a restrained 3-layer starfield, the nine approved
   beats surfacing line-by-line, the quiet two-souls thread, and the real
   Monty natal wheel drawn into being (accurate to the product chart:
   Sun Pisces 24, Moon Aries 16, Asc Scorpio 29 ...).

   STRICT-CSP SAFE: GSAP is imported (bundled by Vite -> served from our
   own origin under script-src 'self'), never a CDN <script>. The moon is
   self-hosted at /start/cosmos-moon.webp. Fonts (Fraunces + Newsreader)
   load via the site's already-permitted Google Fonts link. No blocked
   resources anywhere.

   The fixed night stage is scoped to this section by a coverage-based
   opacity fade, so it emerges from the hero and settles into the form.
   Reduced-motion: all nine beats + the full static chart are visible with
   no motion (opacity fade only). Transform/opacity only, phone-buttery.
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
  --lcb-body:rgba(239,233,221,0.62); --lcb-label:rgba(239,233,221,0.40);
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
.lcb-moon{position:absolute;top:-6%;right:-3%;width:min(34vw,270px);aspect-ratio:1;will-change:transform}
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

/* ---- beats layer ---- */
.lcb-beats{position:relative;z-index:2}
.lcb-scene{min-height:100svh;display:flex;flex-direction:column;justify-content:center;align-items:center;
  padding:14svh clamp(24px,7vw,80px);text-align:center;gap:clamp(18px,3.4vw,32px)}

.lcb-beat{position:relative;margin:0;max-width:20ch;font-family:"Fraunces",Georgia,serif;font-weight:400;
  font-optical-sizing:auto;font-size:clamp(1.9rem,1.4rem + 2.2vw,3.3rem);line-height:1.14;
  letter-spacing:-0.015em;color:var(--lcb-ivory)}
.lcb-beat.lcb-support{font-family:"Newsreader",Georgia,serif;font-weight:300;
  font-size:clamp(1.24rem,1.02rem + 1.8vw,1.72rem);line-height:1.46;max-width:33ch;color:var(--lcb-body);letter-spacing:0}
.lcb-open .lcb-beat{font-size:clamp(2.05rem,1.5rem + 2.9vw,3.7rem);max-width:17ch}
.lcb-emph{color:var(--lcb-ivory)}

.lcb-ln{display:block}
.lcb-ln + .lcb-ln{margin-top:.5em}

/* text scrim (velvet behind the words) */
.lcb-rv{position:relative}
.lcb-rv::before{content:"";position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  width:158%;height:220%;pointer-events:none;z-index:-1;
  background:radial-gradient(ellipse at center, rgba(6,5,14,0.55) 0%, rgba(6,5,14,0) 70%)}

/* two-souls whisper */
.lcb-souls-scene{position:relative;overflow:hidden}
.lcb-souls-hold{position:relative;width:100%;height:30svh;margin-bottom:clamp(6px,3vw,26px)}
.lcb-soul{position:absolute;left:50%;top:50%;translate:-50% -50%;width:88px;height:88px;border-radius:50%;
  filter:blur(1.5px);opacity:0;will-change:transform,opacity}
.lcb-soul-a{background:radial-gradient(circle, rgba(219,224,255,0.95), rgba(150,160,210,0.4) 44%, transparent 72%)}
.lcb-soul-b{background:radial-gradient(circle, rgba(239,233,221,0.95), rgba(196,202,232,0.4) 44%, transparent 72%)}
.lcb-thread{position:absolute;left:50%;top:50%;translate:-50% -50%;height:1px;opacity:0;
  background:linear-gradient(90deg, transparent, var(--lcb-gold), transparent);transform-origin:center;will-change:transform,opacity}

/* chart turn */
.lcb-chart-scene{position:relative;overflow:hidden}
.lcb-wheel-wrap{position:relative;width:min(86vw,438px);aspect-ratio:1;margin-bottom:clamp(28px,6vw,50px)}
.lcb-wheel{position:absolute;inset:0;width:100%;height:100%;overflow:visible;transform-origin:50% 50%}
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
.lcb-pivot-lead{margin:0 auto;font-family:"Fraunces",serif;font-weight:400;color:var(--lcb-ivory);
  font-size:clamp(1.7rem,1.2rem + 2.4vw,2.5rem);line-height:1.16;letter-spacing:-0.012em;max-width:24ch}
.lcb-pivot-body{margin:clamp(18px,4vw,28px) auto 0;font-family:"Newsreader",serif;font-weight:300;color:var(--lcb-body);
  font-size:clamp(1.14rem,1rem + 1.4vw,1.5rem);line-height:1.5;max-width:34ch}

/* payoff */
.lcb-payoff-line{margin:0;font-family:"Fraunces",serif;font-weight:400;color:var(--lcb-ivory);
  font-size:clamp(2rem,1.4rem + 3vw,3.4rem);line-height:1.18;letter-spacing:-0.014em;max-width:18ch}
.lcb-gold-line{color:var(--lcb-gold);margin-top:.4em}

/* ---- reveal engine (only when JS adds .lcb-motion) ---- */
.lcb-root.lcb-motion .lcb-rv .lcb-ln{opacity:0;transform:translate3d(0,12px,0);filter:blur(6px);
  transition:opacity .55s var(--lcb-ease), transform .55s var(--lcb-ease), filter .55s var(--lcb-ease);
  will-change:opacity,transform,filter}
.lcb-root.lcb-motion .lcb-rv.lcb-in .lcb-ln{opacity:1;transform:none;filter:blur(0)}
.lcb-root.lcb-motion .lcb-rv.lcb-in .lcb-ln:nth-child(2){transition-delay:.09s}
.lcb-root.lcb-motion .lcb-rv.lcb-in .lcb-ln:nth-child(3){transition-delay:.18s}
.lcb-root.lcb-motion .lcb-rv.lcb-in .lcb-ln:nth-child(4){transition-delay:.27s}
.lcb-root.lcb-motion .lcb-rv.lcb-in .lcb-ln:nth-child(5){transition-delay:.36s}

@media (max-width:768px){
  .lcb-beat{font-size:clamp(1.72rem,1.2rem + 4.4vw,2.4rem)}
  .lcb-open .lcb-beat{font-size:clamp(2rem,1.3rem + 6vw,2.7rem)}
  .lcb-moon{top:-4%;right:-5%;width:min(50vw,232px)}
  .lcb-wheel-wrap{width:min(90vw,410px)}
}
@media (prefers-reduced-motion:reduce){
  .lcb-root .lcb-rv .lcb-ln{opacity:1 !important;transform:none !important;filter:none !important;transition:none !important}
  .lcb-twinkle,.lcb-bloom,.lcb-haze,.lcb-drift-far,.lcb-drift-mid,.lcb-moon-bloom{animation:none !important}
  .lcb-layer{transform:none !important}
  .lcb-souls-hold{display:none !important}
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

    // ---- reveals + GSAP timelines (motion only) ----
    const ios: IntersectionObserver[] = [];
    let ctx: gsap.Context | undefined;
    if (!reduced) {
      const rvIO = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("lcb-in"); rvIO.unobserve(en.target); } });
      }, { rootMargin: "0px 0px -20% 0px", threshold: 0.01 });
      qa(".lcb-rv").forEach((n) => rvIO.observe(n));
      ios.push(rvIO);

      ctx = gsap.context(() => {
        // two-souls whisper: drift together, gold thread draws between them
        const soulsHold = root.querySelector<HTMLElement>(".lcb-souls-hold");
        if (soulsHold) {
          const spread = Math.min(window.innerWidth * 0.30, 260), near = spread * 0.30;
          const stl = gsap.timeline({ paused: true });
          stl.set(".lcb-thread", { width: near * 2 })
            .set(".lcb-soul-a", { opacity: 0, x: -spread, scale: 0.7 })
            .set(".lcb-soul-b", { opacity: 0, x: spread, scale: 0.7 })
            .set(".lcb-thread", { opacity: 0, scaleX: 0 });
          stl.to([".lcb-soul-a", ".lcb-soul-b"], { opacity: 0.95, duration: 0.6, ease: "expo.out" }, 0.1)
            .to(".lcb-soul-a", { x: -near, scale: 1, duration: 1.4, ease: "power2.inOut" }, 0.2)
            .to(".lcb-soul-b", { x: near, scale: 1, duration: 1.4, ease: "power2.inOut" }, 0.2)
            .to(".lcb-thread", { opacity: 1, scaleX: 1, duration: 1.0, ease: "expo.out" }, 1.1);
          const sIO = new IntersectionObserver((e) => {
            e.forEach((en) => { if (en.isIntersecting) { stl.play(); sIO.disconnect(); } });
          }, { rootMargin: "0px 0px -35% 0px", threshold: 0.01 });
          sIO.observe(soulsHold); ios.push(sIO);
        }

        // chart draws itself into being, aspect web last, one light-sweep
        const chartScene = root.querySelector<HTMLElement>(".lcb-chart-scene");
        if (chartScene && svg) {
          const draws = Array.from(root.querySelectorAll<SVGGeometryElement>(".lcb-wheel .lcb-draw"));
          draws.forEach((el) => {
            const len = el.getTotalLength ? el.getTotalLength() : 300;
            el.style.strokeDasharray = String(len);
            el.style.strokeDashoffset = String(len);
          });
          // immediate hidden state (so nothing flashes before the trigger)
          gsap.set(".lcb-wheel", { opacity: 0 });
          gsap.set(".lcb-w-planet", { opacity: 0, scale: 0, transformOrigin: "center" });
          gsap.set(".lcb-w-zsym", { opacity: 0, scale: 0.92, transformOrigin: "center" });
          gsap.set(".lcb-w-axis", { opacity: 0 });
          gsap.set(".lcb-wheel-sheen", { opacity: 0, x: "-60%" });

          const ctl = gsap.timeline({ paused: true });
          ctl.to(".lcb-wheel", { opacity: 1, duration: 0.3, ease: "power1.out" }, 0)
            .to([".lcb-w-ring", ".lcb-w-sign"], { strokeDashoffset: 0, duration: 1.6, ease: "expo.out", stagger: 0.05 }, 0)
            .to(".lcb-w-tick", { strokeDashoffset: 0, duration: 1.1, ease: "expo.out", stagger: 0.004 }, 0.3)
            .to(".lcb-w-house", { strokeDashoffset: 0, duration: 1.2, ease: "expo.out", stagger: 0.02 }, 0.6)
            .to(".lcb-w-axis", { opacity: 1, strokeDashoffset: 0, duration: 1.2, ease: "expo.out" }, 0.6)
            .to(".lcb-w-zsym", { opacity: 1, scale: 1, duration: 0.6, ease: "expo.out", stagger: 0.04 }, 0.9)
            .to(".lcb-w-leg", { strokeDashoffset: 0, duration: 0.6, ease: "expo.out", stagger: 0.03 }, 1.1)
            .to(".lcb-w-planet", { opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.6)", stagger: 0.05 }, 1.2)
            .to(".lcb-w-aspect", { strokeDashoffset: 0, duration: 1.4, ease: "expo.out", stagger: 0.055 }, 1.55)
            .to(".lcb-wheel-sheen", { opacity: 1, duration: 0.2, ease: "none" }, 3.0)
            .to(".lcb-wheel-sheen", { x: "60%", duration: 1.5, ease: "power2.inOut" }, 3.0)
            .to(".lcb-wheel-sheen", { opacity: 0, duration: 0.5, ease: "power1.in" }, 4.2);
          ctl.timeScale(mobile ? 1.9 : 1.15);

          const cIO = new IntersectionObserver((e) => {
            e.forEach((en) => { if (en.isIntersecting) { ctl.play(); cIO.disconnect(); } });
          }, { rootMargin: "0px 0px -30% 0px", threshold: 0.01 });
          cIO.observe(chartScene); ios.push(cIO);
        }
      }, root);
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
        {/* Beat 1 */}
        <div className="lcb-scene lcb-open">
          <p className="lcb-beat lcb-rv"><span className="lcb-ln">We think we know our pets completely.</span></p>
          <p className="lcb-beat lcb-support lcb-rv">
            <span className="lcb-ln">Their favourite treat.</span>
            <span className="lcb-ln">The walk they pull toward.</span>
            <span className="lcb-ln">The face they make at dinnertime.</span>
          </p>
        </div>

        {/* Beat 2 */}
        <div className="lcb-scene">
          <p className="lcb-beat lcb-rv"><span className="lcb-ln">But there is a part of who they are we have never really understood.</span></p>
          <p className="lcb-beat lcb-support lcb-rv">
            <span className="lcb-ln">Their temperament.</span>
            <span className="lcb-ln">Their quirks.</span>
            <span className="lcb-ln">The reason behind the odd little things they do.</span>
          </p>
        </div>

        {/* Beat 3 */}
        <div className="lcb-scene">
          <p className="lcb-beat lcb-rv"><span className="lcb-ln">A birth chart lays it out plainly.</span></p>
          <p className="lcb-beat lcb-support lcb-rv">
            <span className="lcb-ln">Why they get anxious the second you reach for your keys.</span>
            <span className="lcb-ln">Why they choose your lap over everyone else&rsquo;s.</span>
            <span className="lcb-ln">Why some days they need space, and what brings them back to calm.</span>
          </p>
        </div>

        {/* Beat 4 (leads into the wheel) */}
        <div className="lcb-scene">
          <p className="lcb-beat lcb-rv">
            <span className="lcb-ln">At the moment your pet arrived, every planet stood in an exact place.</span>
            <span className="lcb-ln">Not a guess.</span>
            <span className="lcb-ln">A measured arrangement, calculated to the degree.</span>
          </p>
        </div>

        {/* Beats 5 + 6 — the chart draws into being */}
        <div className="lcb-scene lcb-chart-scene">
          <div className="lcb-wheel-wrap">
            <svg className="lcb-wheel" viewBox="-210 -210 420 420" aria-hidden="true" />
            <div className="lcb-wheel-sheen" aria-hidden="true" />
          </div>
          <div className="lcb-chart-copy">
            <p className="lcb-pivot-lead lcb-rv"><span className="lcb-ln">The same order that lets an eclipse be named years ahead, and a planet&rsquo;s path traced long before it gets there.</span></p>
            <p className="lcb-pivot-body lcb-rv">
              <span className="lcb-ln">Nothing in it moves at random.</span>
              <span className="lcb-ln">Everything holds a position, a moment, a place of its own.</span>
              <span className="lcb-ln">Your pet arrived inside that order, at one exact point in time that will never come again.</span>
            </p>
          </div>
        </div>

        {/* Beat 7 — two lives, timed to meet */}
        <div className="lcb-scene lcb-souls-scene">
          <div className="lcb-souls-hold" aria-hidden="true">
            <span className="lcb-soul lcb-soul-a" />
            <span className="lcb-thread" />
            <span className="lcb-soul lcb-soul-b" />
          </div>
          <p className="lcb-beat lcb-support lcb-rv">
            <span className="lcb-ln">And somehow, their small life crossed yours.</span>
            <span className="lcb-ln">The one who waits by the door before your car has turned in.</span>
            <span className="lcb-ln">The one who knows the second your voice changes.</span>
            <span className="lcb-ln">The one who made the whole house feel different just by being here.</span>
            <span className="lcb-ln lcb-emph">Two lives, out of everything, timed to meet.</span>
          </p>
        </div>

        {/* Beat 8 */}
        <div className="lcb-scene">
          <p className="lcb-beat lcb-rv"><span className="lcb-ln">A birth chart is only that moment, read closely.</span></p>
          <p className="lcb-beat lcb-support lcb-rv">
            <span className="lcb-ln">Who they are.</span>
            <span className="lcb-ln">What steadies them.</span>
            <span className="lcb-ln">Why they love the way they do.</span>
          </p>
        </div>

        {/* Beat 9 — payoff into the form */}
        <div className="lcb-scene lcb-payoff">
          <p className="lcb-payoff-line lcb-rv">
            <span className="lcb-ln">You have loved them without the map.</span>
            <span className="lcb-ln">Now you can see it.</span>
            <span className="lcb-ln lcb-gold-line">Set the chart.</span>
          </p>
        </div>
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
