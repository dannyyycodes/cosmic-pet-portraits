const { chromium } = require("playwright");
const fs = require("fs");
const OUT = "C:/Users/danie/cosmic-pet-portraits/public/readings/sun/sun-orrery.png";
const SVG = `
<svg viewBox="0 0 100 100" width="700" height="700" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g" cx="47%" cy="43%" r="60%">
      <stop offset="0%" stop-color="#fff8e8"/>
      <stop offset="15%" stop-color="#ffe487"/>
      <stop offset="36%" stop-color="#ffb53f"/>
      <stop offset="58%" stop-color="#ff831f"/>
      <stop offset="80%" stop-color="#ef4d0b"/>
      <stop offset="100%" stop-color="#9c2408"/>
    </radialGradient>
    <radialGradient id="limb" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="72%" stop-color="rgba(90,14,0,0)"/>
      <stop offset="100%" stop-color="rgba(74,10,0,0.6)"/>
    </radialGradient>
    <radialGradient id="core" cx="47%" cy="43%" r="34%">
      <stop offset="0%" stop-color="#fff7df"/>
      <stop offset="45%" stop-color="rgba(255,225,150,0.55)"/>
      <stop offset="100%" stop-color="rgba(255,180,80,0)"/>
    </radialGradient>
    <filter id="plasma" x="-25%" y="-25%" width="150%" height="150%">
      <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="5" seed="4" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="6" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="gran" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.09 0.11" numOctaves="5" seed="11" result="t"/>
      <feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.4 0 0 0 -0.25" result="d"/>
      <feComposite in="d" in2="SourceGraphic" operator="in"/>
    </filter>
    <filter id="bright" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.07 0.09" numOctaves="4" seed="23" result="t2"/>
      <feColorMatrix in="t2" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.3 0 0 0 -0.35" result="d2"/>
      <feComposite in="d2" in2="SourceGraphic" operator="in"/>
    </filter>
  </defs>
  <circle cx="50" cy="50" r="45" fill="url(#g)" filter="url(#plasma)"/>
  <circle cx="50" cy="50" r="45" fill="#7a1400" filter="url(#gran)" opacity="0.34" style="mix-blend-mode:multiply"/>
  <circle cx="50" cy="50" r="45" fill="#ffe9b0" filter="url(#bright)" opacity="0.55" style="mix-blend-mode:screen"/>
  <circle cx="50" cy="50" r="45" fill="url(#core)"/>
  <circle cx="50" cy="50" r="45" fill="url(#limb)"/>
</svg>`;
const HTML = `<!doctype html><html><head><style>html,body{margin:0;background:transparent}#w{width:700px;height:700px}</style></head><body><div id="w">${SVG}</div></body></html>`;
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 700, height: 700 }, deviceScaleFactor: 1 });
  await page.setContent(HTML, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  const el = await page.$("#w");
  await el.screenshot({ path: OUT, omitBackground: true });
  console.log("wrote", OUT, fs.statSync(OUT).size, "bytes");
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
