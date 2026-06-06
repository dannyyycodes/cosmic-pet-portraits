const puppeteer = require("puppeteer-core");
(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
    defaultViewport: { width: 1400, height: 900, deviceScaleFactor: 2 },
  });
  const page = await browser.newPage();
  await page.goto("https://www.littlesouls.app/pawtraits", { waitUntil: "domcontentloaded", timeout: 45000 });
  await new Promise(r => setTimeout(r, 4000));
  // Top nav screenshot (first 100px)
  await page.screenshot({
    path: "C:/Users/danie/Downloads/topup-preview/live-nav.png",
    clip: { x: 0, y: 0, width: 1400, height: 100 },
  });
  // Studio section (scroll to it then screenshot)
  await page.evaluate(() => {
    const el = document.getElementById("studio") || document.getElementById("studio-heading");
    if (el) el.scrollIntoView({ behavior: "instant", block: "start" });
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({
    path: "C:/Users/danie/Downloads/topup-preview/live-studio.png",
    clip: { x: 0, y: 0, width: 1400, height: 600 },
  });
  console.log("OK both shots");
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
