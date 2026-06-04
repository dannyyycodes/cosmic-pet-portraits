const { chromium } = require("playwright");
const OUT = "C:/Users/danie/shots";
const URL = process.env.SHOT_URL || "http://localhost:4174/";
(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  });
  for (const v of [
    { name: "desktop", width: 1440, height: 1000, mobile: false },
    { name: "mobile", width: 390, height: 844, mobile: true },
  ]) {
    const ctx = await browser.newContext({
      viewport: { width: v.width, height: v.height },
      deviceScaleFactor: 2,
      isMobile: v.mobile,
      hasTouch: v.mobile,
    });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(2200);
    // jump to the orrery section
    await page.evaluate(() => {
      const el = document.getElementById("computed-sky");
      if (el) el.scrollIntoView({ behavior: "instant", block: "start" });
    });
    await page.waitForTimeout(1800);
    const el = await page.$("#computed-sky");
    const box = el ? await el.boundingBox() : null;
    if (box) {
      await page.screenshot({
        path: `${OUT}/orrery-${v.name}.png`,
        clip: { x: box.x, y: Math.max(0, box.y), width: box.width, height: Math.min(box.height, v.height) },
      });
    } else {
      await page.screenshot({ path: `${OUT}/orrery-${v.name}-FULL.png` });
    }
    console.log("shot", v.name);
    await ctx.close();
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
