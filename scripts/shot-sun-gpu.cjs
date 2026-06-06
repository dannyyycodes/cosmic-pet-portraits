const { chromium } = require("playwright");
const OUT = "C:/Users/danie/shots";
const URL = process.env.SHOT_URL || "http://localhost:4190/";
(async () => {
  // Use the user's REAL installed Chrome with GPU enabled (true preview of the
  // WebGL sun, not headless SwiftShader). headless:false renders on the GPU.
  const browser = await chromium.launch({
    channel: "chrome",
    headless: false,
    args: ["--ignore-gpu-blocklist", "--enable-gpu", "--use-angle=d3d11"],
  });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2500);
  await page.evaluate(() => document.getElementById("computed-sky")?.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(2200);
  const renderer = await page.evaluate(() => {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl");
    const dbg = gl && gl.getExtension("WEBGL_debug_renderer_info");
    return dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : "n/a";
  });
  console.log("GL renderer:", renderer);
  const el = await page.$("#computed-sky");
  const box = await el.boundingBox();
  await page.screenshot({
    path: `${OUT}/sun-gpu.png`,
    clip: { x: box.x, y: Math.max(0, box.y), width: box.width, height: Math.min(box.height, 760) },
  });
  console.log("shot sun-gpu");
  await browser.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
