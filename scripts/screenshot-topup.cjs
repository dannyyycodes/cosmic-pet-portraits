const puppeteer = require("puppeteer-core");

const URL = process.argv[2] || "http://localhost:8080/pawtraits";
const OUT = process.argv[3] || "C:/Users/danie/Downloads/topup-preview/local-topup.png";

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
    defaultViewport: { width: 1400, height: 900, deviceScaleFactor: 2 },
  });
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 45000 });
  await new Promise(r => setTimeout(r, 4000));
  await page.evaluate(() => {
    const el = document.getElementById("topup");
    if (el) el.scrollIntoView({ behavior: "instant", block: "start" });
  });
  await new Promise(r => setTimeout(r, 2000));
  const el = await page.$("#topup");
  if (!el) {
    console.error("FAIL: #topup not found");
    await browser.close();
    process.exit(1);
  }
  await el.screenshot({ path: OUT });
  console.log("OK", OUT);
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
