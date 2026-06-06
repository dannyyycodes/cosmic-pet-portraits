const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 1320, height: 1000 }, deviceScaleFactor: 1 });
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("console", (m) => { if (m.type() === "error") errs.push("console:" + m.text()); });
  await p.goto("http://localhost:4320/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await p.waitForTimeout(4000);
  const has = await p.$(".ls-orrery");
  console.log("ls-orrery in DOM:", !!has);
  console.log("pageerrors:", errs.slice(0, 4).join(" || ") || "none");
  await p.screenshot({ path: "C:/Users/danie/shots/wt-full.png", clip: { x: 0, y: 0, width: 1320, height: 1000 } });
  await b.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
