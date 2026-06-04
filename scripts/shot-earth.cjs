const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1320, height: 980 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto("https://www.littlesouls.app/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2200);
  await page.evaluate(() => document.getElementById("computed-sky")?.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(1200);
  const b = await (await page.$(".ls-orrery")).boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  for (let i = 0; i < 3; i++) { await page.mouse.wheel(0, 120); await page.waitForTimeout(420); } // -> earth
  await page.waitForTimeout(700);
  const dock = (await page.$eval(".ls-orrery-line", (e) => e.textContent)).trim();
  const name = (await page.$eval(".ls-orrery-card-text .ls-orrery-name", (e) => e.textContent)).trim();
  console.log("card:", name, "|", dock);
  const sec = await page.$("#computed-sky");
  const sb = await sec.boundingBox();
  await page.screenshot({ path: "C:/Users/danie/shots/earth-card.png", clip: { x: sb.x, y: Math.max(0, sb.y), width: sb.width, height: Math.min(sb.height, 760) } });
  console.log("shot earth-card");
  await browser.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
