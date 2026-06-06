const { chromium } = require("playwright");
const URL = (process.env.SHOT_URL || "http://localhost:4300/") + "sun-preview.html";
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "C:/Users/danie/shots/sun-options.png", clip: { x: 0, y: 0, width: 1200, height: 760 } });
  console.log("shot sun-options");
  await browser.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
