const { chromium } = require("playwright");
const OUT = "C:/Users/danie/shots";
const URL = process.env.SHOT_URL || "http://localhost:4310/";
(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const w of [680, 768, 860, 960, 1100]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1.5, isMobile: w < 760, hasTouch: w < 760 });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(1500);
    await page.evaluate(() => document.getElementById("computed-sky")?.scrollIntoView({ block: "start" }));
    await page.waitForTimeout(1000);
    // step to mercury so the camera zooms in (matches Danny's view)
    const b = await (await page.$(".ls-orrery")).boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.wheel(0, 120);
    await page.waitForTimeout(900);
    const b2 = await (await page.$(".ls-orrery")).boundingBox();
    await page.screenshot({ path: `${OUT}/sunw-${w}.png`, clip: { x: b2.x, y: Math.max(0, b2.y), width: b2.width, height: b2.height } });
    console.log("shot", w);
    await ctx.close();
  }
  await browser.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
