const { chromium } = require("playwright");
const OUT = "C:/Users/danie/shots";
const URL = process.env.SHOT_URL || "http://localhost:4308/";
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1320, height: 980 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1800);
  await page.evaluate(() => document.getElementById("computed-sky")?.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(1200);
  const box = await (await page.$(".ls-orrery")).boundingBox();
  const shot = async (name) => {
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/sunclip-${name}.png`, clip: { x: box.x, y: box.y, width: box.width, height: box.height } });
  };
  await shot("sun");                       // active = sun (overview)
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, 120); await page.waitForTimeout(700);   // -> mercury
  await shot("mercury");
  // dump computed styles + rects of the sun chain
  const info = await page.evaluate(() => {
    const img = document.querySelector(".ls-orrery-sunvid img");
    if (!img) return "no sun img";
    const out = [];
    let el = img;
    for (let i = 0; i < 5 && el; i++) {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      out.push(`${el.className||el.tagName} | overflow:${cs.overflow} clip:${cs.clipPath} objfit:${cs.objectFit} | rect ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}`);
      el = el.parentElement;
    }
    return out.join("\n");
  });
  console.log(info);
  await browser.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
