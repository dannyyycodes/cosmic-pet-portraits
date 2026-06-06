// One-off: render the Gelato insert/thank-you card to a print-ready PNG.
const fs = require("fs");
const { chromium } = require("playwright");

const QR = fs.readFileSync("C:/Users/danie/.tmp_etsy/qr.b64", "utf8").trim();

// A6 landscape @ ~300dpi (148x105mm) = 1748 x 1240, +~3mm bleed handled by Gelato.
const W = 1748, H = 1240;

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
*{margin:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px}
.card{width:${W}px;height:${H}px;position:relative;overflow:hidden;
  background:radial-gradient(120% 100% at 20% 0%, #fffef9 0%, #FFFDF5 55%, #f7f0e2 100%);
  font-family:Georgia,'Times New Roman',serif;color:#3d2f2a}
.frame{position:absolute;inset:34px;border:2px solid #d9c39a;border-radius:10px}
.frame:after{content:"";position:absolute;inset:8px;border:1px solid #ecdfc4;border-radius:6px}
.wrap{position:absolute;inset:96px 110px;display:flex;flex-direction:column}
.brand{font-size:30px;letter-spacing:.42em;text-transform:uppercase;color:#9d7ad6;font-weight:700;font-family:Georgia,serif}
.brand .paw{color:#c4a265;margin-left:14px}
.h{font-size:62px;line-height:1.12;color:#141210;margin-top:46px;max-width:1050px;font-style:italic;letter-spacing:-.01em}
.h b{font-style:normal;color:#bf524a;font-weight:700}
.sub{font-size:27px;line-height:1.55;color:#5a4a42;margin-top:30px;max-width:1000px;font-family:Georgia,serif}
.review{margin-top:auto;font-size:30px;color:#141210}
.review .stars{color:#c4a265;letter-spacing:3px;font-size:30px}
.qrbox{position:absolute;right:120px;bottom:100px;text-align:center;width:300px}
.qrbox img{width:230px;height:230px;display:block;margin:0 auto;background:#fff;padding:14px;border-radius:14px;border:1px solid #e8ddd0}
.qrbox .cap{font-size:21px;color:#5a4a42;margin-top:14px;line-height:1.35;font-family:Georgia,serif}
.qrbox .cap b{color:#9d7ad6}
</style></head><body>
<div class="card">
  <div class="frame"></div>
  <div class="wrap">
    <div class="brand">Little Souls<span class="paw">🐾</span></div>
    <div class="h">Thank you for giving them a <b>place on your wall.</b></div>
    <div class="sub">A tiny studio, made with a lot of love. Your little soul now lives in gallery canvas — we're so grateful they found their way to you.</div>
    <div class="review">Loved it? A <span class="stars">★★★★★</span> review means the world to us.</div>
  </div>
  <div class="qrbox">
    <img src="data:image/png;base64,${QR}"/>
    <div class="cap">Scan to discover your pet's<br><b>Soul Reading</b> · littlesouls.app</div>
  </div>
</div>
</body></html>`;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await p.setContent(html, { waitUntil: "networkidle" });
  await p.screenshot({ path: "C:/Users/danie/.tmp_etsy/insert-card.png" });
  await b.close();
  console.log("card -> C:/Users/danie/.tmp_etsy/insert-card.png");
})();
