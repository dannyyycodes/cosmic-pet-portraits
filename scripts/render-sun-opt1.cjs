const { chromium } = require("playwright");
const fs = require("fs");
const SRC = "C:/Users/danie/cosmic-pet-portraits/public/readings/sun/sdo_0304.jpg";
const OUT = "C:/Users/danie/cosmic-pet-portraits/public/readings/sun/sun-opt1.png";
const b64 = fs.readFileSync(SRC).toString("base64");
const HTML = `<!doctype html><html><head><style>html,body{margin:0;background:transparent}</style></head>
<body><canvas id="c" width="760" height="760"></canvas><canvas id="t" width="800" height="800"></canvas>
<script>
const SRC="data:image/jpeg;base64,${b64}";
window.__done=false;
const img=new Image();
img.onload=()=>{
  const S=760, c=document.getElementById('c'), x=c.getContext('2d');
  const t=document.getElementById('t'), tx=t.getContext('2d');
  const W=img.width, H=img.height;
  t.width=W; t.height=H;
  tx.drawImage(img,0,0);
  const src=tx.getImageData(0,0,W,H).data;
  // bounding box of the bright sun (corona+disc), IGNORING the bottom 8% (label rows)
  const labelY=Math.floor(H*0.92);
  let minX=W,minY=H,maxX=0,maxY=0;
  for(let yy=0; yy<labelY; yy++){
    for(let xx=0; xx<W; xx++){
      const i=(yy*W+xx)*4;
      const lum=0.3*src[i]+0.59*src[i+1]+0.11*src[i+2];
      if(lum>34){ if(xx<minX)minX=xx; if(xx>maxX)maxX=xx; if(yy<minY)minY=yy; if(yy>maxY)maxY=yy; }
    }
  }
  const bw=maxX-minX, bh=maxY-minY, bcx=(minX+maxX)/2, bcy=(minY+maxY)/2;
  const span=Math.max(bw,bh);
  const target=S*0.78;                 // sun (incl flares) fills 78% of frame
  const scale=target/span;
  // draw source scaled+centred so the sun bbox lands at frame centre
  x.save();
  x.filter='saturate(1.2) brightness(1.16) contrast(1.04) hue-rotate(20deg)';
  x.translate(S/2 - bcx*scale, S/2 - bcy*scale);
  x.scale(scale,scale);
  x.drawImage(img,0,0);
  x.restore();
  // luminance -> alpha key: black space transparent, corona/prominences bleed
  const d=x.getImageData(0,0,S,S), p=d.data;
  for(let i=0;i<p.length;i+=4){
    const lum=0.3*p[i]+0.59*p[i+1]+0.11*p[i+2];
    let a=(lum-6)/(56-6); a=a<0?0:a>1?1:a; a=a*a*(3-2*a);
    p[i+1]=Math.min(255,p[i+1]*1.05+6);
    p[i+3]=Math.round(255*a);
  }
  x.putImageData(d,0,0);
  // belt-and-braces: wipe any stray label pixels that scaled into the bottom strip
  x.clearRect(0, S*0.93, S, S*0.07);
  window.__PNG=c.toDataURL('image/png');
  window.__done=true;
};
img.src=SRC;
</script></body></html>`;
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
  await page.setContent(HTML, { waitUntil: "load" });
  await page.waitForFunction("window.__done===true", { timeout: 20000 });
  const dataUrl = await page.evaluate("window.__PNG");
  fs.writeFileSync(OUT, Buffer.from(dataUrl.split(",")[1], "base64"));
  console.log("wrote", OUT, fs.statSync(OUT).size, "bytes");
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
