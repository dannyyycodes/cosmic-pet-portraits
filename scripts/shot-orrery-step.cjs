const { chromium } = require("playwright");
const OUT = "C:/Users/danie/shots";
const URL = process.env.SHOT_URL || "http://localhost:4174/";
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1000);
  await page.evaluate(() => document.getElementById("computed-sky")?.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(1000);
  const box = await (await page.$(".ls-orrery")).boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  const dockText = async () => (await page.$eval(".ls-orrery-line", (e) => e.textContent)).trim();
  console.log("start dock:", await dockText());
  // wheel over the diagram at human pace — should step planets, NOT scroll the page
  const scrollYBefore = await page.evaluate(() => window.scrollY);
  for (let i = 0; i < 7; i++) { await page.mouse.wheel(0, 120); await page.waitForTimeout(320); }
  await page.waitForTimeout(700);
  const scrollYAfter = await page.evaluate(() => window.scrollY);
  console.log("after 7 wheel-steps dock:", await dockText());
  console.log("page scrollY before/after:", scrollYBefore, scrollYAfter, "(should be ~equal = page held)");
  await (await page.$("#computed-sky")).screenshot({ path: `${OUT}/orrery-step-mid.png` });
  // now wheel a lot more to reach the end, then one more should release to page scroll
  for (let i = 0; i < 12; i++) { await page.mouse.wheel(0, 120); await page.waitForTimeout(90); }
  await page.waitForTimeout(700);
  console.log("near-end dock:", await dockText());
  const yEnd1 = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 240); await page.waitForTimeout(300);
  await page.mouse.wheel(0, 240); await page.waitForTimeout(300);
  const yEnd2 = await page.evaluate(() => window.scrollY);
  console.log("at-end page scrollY before/after extra wheel:", yEnd1, yEnd2, "(should INCREASE = passes through)");
  await (await page.$("#computed-sky")).screenshot({ path: `${OUT}/orrery-step-end.png` });
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
