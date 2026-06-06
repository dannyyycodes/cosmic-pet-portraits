const { chromium } = require("playwright");
const OUT = "C:/Users/danie/shots";
const URL = process.env.SHOT_URL || "http://localhost:4320/";
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1320, height: 1300 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector(".ls-orrery", { timeout: 25000 });
  await page.waitForTimeout(2500);
  await page.evaluate(() => document.getElementById("computed-sky")?.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(1200);
  const b = await (await page.$(".ls-orrery")).boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  const sec = await page.$("#computed-sky");
  const grab = async (label) => {
    await page.waitForTimeout(700);
    const name = (await page.$eval(".ls-orrery-bubble .ls-orrery-name", (e) => e.textContent)).trim();
    const line = (await page.$eval(".ls-orrery-bubble .ls-orrery-line", (e) => e.textContent)).trim();
    console.log(`${label}: ${name} | ${line}`);
    const sb = await sec.boundingBox();
    await page.screenshot({ path: `${OUT}/lunar-${label}.png`, clip: { x: sb.x, y: Math.max(0, sb.y), width: sb.width, height: Math.min(sb.height, 1180) } });
  };
  // sun(0) -> step: mercury1 venus2 earth3 moon4 lilith5 northNode6
  for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, 120); await page.waitForTimeout(360); }
  await grab("moon");
  await page.mouse.wheel(0, 120); await grab("lilith");
  await page.mouse.wheel(0, 120); await grab("northnode");
  await browser.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
