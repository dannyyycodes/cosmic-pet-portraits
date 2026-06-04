const { chromium } = require("playwright");
const fs = require("fs");
const SRC = "C:/Users/danie/cosmic-pet-portraits/public/readings/sun/sun-poster.jpg";
const OUT = "C:/Users/danie/cosmic-pet-portraits/public/readings/sun/sun-orrery.png";
const b64 = fs.readFileSync(SRC).toString("base64");
const HTML = `<!doctype html><html><head><style>html,body{margin:0;background:transparent}</style></head>
<body><canvas id="c" width="760" height="760"></canvas>
<script>
const SRC="data:image/jpeg;base64,${b64}";
window.__done=false;
const img=new Image();
img.onload=()=>{
  const c=document.getElementById('c'), x=c.getContext('2d');
  const S=760, R=372, cx=380, cy=380;
  // real SDO plasma, warm-graded toward fiery orange
  x.save();
  x.filter='saturate(1.4) brightness(1.16) contrast(1.08) hue-rotate(-16deg)';
  const z=Math.max(S/img.width,S/img.height); const w=img.width*z,h=img.height*z;
  x.drawImage(img,(S-w)/2,(S-h)/2,w,h);
  x.restore();
  // limb darkening -> spherical
  let g=x.createRadialGradient(cx,cy*0.9,R*0.08,cx,cy,R);
  g.addColorStop(0,'rgba(255,255,255,1)');
  g.addColorStop(0.55,'rgba(255,238,205,0.98)');
  g.addColorStop(0.82,'rgba(180,70,10,0.6)');
  g.addColorStop(0.95,'rgba(95,26,0,0.82)');
  g.addColorStop(1,'rgba(35,7,0,0.95)');
  x.globalCompositeOperation='multiply';
  x.fillStyle=g; x.beginPath(); x.arc(cx,cy,R,0,7); x.fill();
  // hot core glow
  let g2=x.createRadialGradient(cx,cy*0.86,0,cx,cy*0.86,R*0.52);
  g2.addColorStop(0,'rgba(255,247,214,0.9)');
  g2.addColorStop(0.6,'rgba(255,206,120,0.32)');
  g2.addColorStop(1,'rgba(255,190,100,0)');
  x.globalCompositeOperation='screen';
  x.fillStyle=g2; x.beginPath(); x.arc(cx,cy,R,0,7); x.fill();
  // fiery rim
  let g3=x.createRadialGradient(cx,cy,R*0.7,cx,cy,R);
  g3.addColorStop(0,'rgba(255,90,20,0)');
  g3.addColorStop(0.86,'rgba(255,96,22,0.0)');
  g3.addColorStop(1,'rgba(255,120,30,0.5)');
  x.globalCompositeOperation='overlay';
  x.fillStyle=g3; x.beginPath(); x.arc(cx,cy,R,0,7); x.fill();
  // soft circular alpha mask
  x.globalCompositeOperation='destination-in';
  let gm=x.createRadialGradient(cx,cy,R*0.92,cx,cy,R);
  gm.addColorStop(0,'rgba(0,0,0,1)');
  gm.addColorStop(0.94,'rgba(0,0,0,1)');
  gm.addColorStop(1,'rgba(0,0,0,0)');
  x.fillStyle=gm; x.fillRect(0,0,S,S);
  x.globalCompositeOperation='source-over';
  window.__PNG=c.toDataURL('image/png');
  window.__done=true;
};
img.src=SRC;
</script></body></html>`;
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 760, height: 760 } });
  await page.setContent(HTML, { waitUntil: "load" });
  await page.waitForFunction("window.__done===true", { timeout: 20000 });
  const dataUrl = await page.evaluate("window.__PNG");
  fs.writeFileSync(OUT, Buffer.from(dataUrl.split(",")[1], "base64"));
  console.log("wrote", OUT, fs.statSync(OUT).size, "bytes");
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
