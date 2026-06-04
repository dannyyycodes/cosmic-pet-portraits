const { chromium } = require("playwright");
const fs = require("fs");
const OUT = "C:/Users/danie/cosmic-pet-portraits/public/readings/sun/sun-opt3.png";
const HTML = `<!doctype html><html><head><style>html,body{margin:0;background:transparent}</style></head>
<body><canvas id="c" width="760" height="760"></canvas>
<script>
window.__done=false;
const c=document.getElementById('c'), x=c.getContext('2d');
const S=760, cx=380, cy=380, R=176;
function rnd(s){ return (Math.sin(s*127.1+s*0.7)*43758.5453)%1*0.5+0.5; }
// ---- corona aura ----
let g=x.createRadialGradient(cx,cy,R*0.7,cx,cy,R*2.05);
g.addColorStop(0,'rgba(255,150,55,0.55)');
g.addColorStop(0.4,'rgba(255,110,35,0.28)');
g.addColorStop(0.72,'rgba(255,80,25,0.08)');
g.addColorStop(1,'rgba(255,70,20,0)');
x.fillStyle=g; x.fillRect(0,0,S,S);
// ---- radiating solar flares / prominence tongues ----
x.globalCompositeOperation='lighter';
const N=220;
for(let i=0;i<N;i++){
  const a=(i/N)*Math.PI*2;
  const seed=i*1.37;
  const len=R*(0.18 + 0.95*Math.pow(rnd(seed),2.0));   // mostly short, some long flares
  const wid=0.006 + 0.018*rnd(seed+9.1);
  const x0=cx+Math.cos(a)*R*0.96, y0=cy+Math.sin(a)*R*0.96;
  const x1=cx+Math.cos(a)*(R+len), y1=cy+Math.sin(a)*(R+len);
  const lg=x.createLinearGradient(x0,y0,x1,y1);
  const warm = rnd(seed+3.3)>0.7 ? '255,200,90' : '255,120,40';
  lg.addColorStop(0,'rgba('+warm+',0.85)');
  lg.addColorStop(1,'rgba('+warm+',0)');
  x.save(); x.translate(cx,cy); x.rotate(a); x.translate(-cx,-cy);
  x.beginPath();
  x.moveTo(cx+R*0.9, cy - wid*R*2.2);
  x.lineTo(cx+R+len, cy);
  x.lineTo(cx+R*0.9, cy + wid*R*2.2);
  x.closePath();
  x.fillStyle=lg; x.fill();
  x.restore();
}
x.globalCompositeOperation='source-over';
// ---- the disc ----
let d=x.createRadialGradient(cx-R*0.12,cy-R*0.16,R*0.05, cx,cy,R);
d.addColorStop(0,'#fff7e2');
d.addColorStop(0.18,'#ffe48c');
d.addColorStop(0.42,'#ffb43e');
d.addColorStop(0.66,'#ff7d1d');
d.addColorStop(0.86,'#ef4a0c');
d.addColorStop(1,'#b22f06');
x.beginPath(); x.arc(cx,cy,R,0,7); x.fillStyle=d; x.fill();
// granulation / mottled surface (clipped to disc)
x.save(); x.beginPath(); x.arc(cx,cy,R,0,7); x.clip();
for(let i=0;i<520;i++){
  const a=rnd(i*2.1)*Math.PI*2, rr=Math.sqrt(rnd(i*3.7))*R;
  const px=cx+Math.cos(a)*rr, py=cy+Math.sin(a)*rr;
  const s=2+rnd(i*5.3)*7;
  const dark=rnd(i*7.9)>0.5;
  x.fillStyle= dark ? 'rgba(150,38,0,'+(0.10+0.16*rnd(i*1.1))+')' : 'rgba(255,232,150,'+(0.10+0.20*rnd(i*1.7))+')';
  x.beginPath(); x.arc(px,py,s,0,7); x.fill();
}
x.restore();
// limb darkening + core glow
let limb=x.createRadialGradient(cx,cy,R*0.55,cx,cy,R);
limb.addColorStop(0,'rgba(0,0,0,0)'); limb.addColorStop(0.8,'rgba(120,30,0,0)'); limb.addColorStop(1,'rgba(80,16,0,0.5)');
x.beginPath(); x.arc(cx,cy,R,0,7); x.fillStyle=limb; x.fill();
let core=x.createRadialGradient(cx-R*0.1,cy-R*0.14,0, cx,cy,R*0.6);
core.addColorStop(0,'rgba(255,248,220,0.85)'); core.addColorStop(1,'rgba(255,210,120,0)');
x.beginPath(); x.arc(cx,cy,R,0,7); x.fillStyle=core; x.fill();
window.__PNG=c.toDataURL('image/png'); window.__done=true;
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
