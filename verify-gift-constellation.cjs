const { chromium } = require('playwright-core');
const path = require('path');

const FILE = 'file://' + path.resolve('public/gift-constellation.html').replace(/\\/g, '/');

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{26FF}]|\u{FE0F}/gu;
function countEmoji(s){
  let n = 0;
  for (const ch of s) {
    const cp = ch.codePointAt(0);
    if (cp === 0x2605 || cp === 0x2606) continue; // allowed stars
    if ((cp >= 0x1F300 && cp <= 0x1FAFF) || (cp >= 0x2600 && cp <= 0x26FF) || cp === 0xFE0F) n++;
  }
  return n;
}

(async () => {
  const browser = await chromium.launch();
  const results = {};
  for (const w of [390, 1280]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(FILE, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(2500);
    // scroll through the page in steps to trigger every lazy image (real-user test)
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.8;
      for (let y = 0; y <= document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    const data = await page.evaluate(() => {
      const de = document.documentElement;
      const overflow = de.scrollWidth - de.clientWidth;
      // per-element right-edge overflow probe
      let worst = 0, worstSel = '';
      document.querySelectorAll('*').forEach(el => {
        const r = el.getBoundingClientRect();
        const o = Math.round(r.right - de.clientWidth);
        if (o > worst) { worst = o; worstSel = el.className || el.tagName; }
      });
      const imgs = Array.from(document.images).map(i => ({
        ok: i.complete && i.naturalWidth > 0, w: i.naturalWidth,
        src: (i.getAttribute('src') || '').split('/').pop()
      }));
      const text = document.body.innerText;
      const fp = document.fonts.check('16px "Playfair Display"');
      const fc = document.fonts.check('16px "Cormorant"');
      return { overflow, worst, worstSel: String(worstSel).slice(0,40), imgs, text, fp, fc };
    });

    results[w] = {
      overflow: data.overflow,
      worstElOverflow: data.worst,
      worstSel: data.worstSel,
      imgsAllOk: data.imgs.every(i => i.ok),
      imgBad: data.imgs.filter(i => !i.ok).map(i => i.src),
      imgCount: data.imgs.length,
      emoji: countEmoji(data.text),
      emdash: (data.text.match(/—/g) || []).length,
      playfair: data.fp,
      cormorant: data.fc,
    };

    if (w === 412 || w === 390) { /* screenshot done separately */ }
    await ctx.close();
  }

  // dedicated 412 full-page screenshot
  const ctx = await browser.newContext({ viewport: { width: 412, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(FILE, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(2500);
  // force all reveals + thread drawn, and scroll-trigger every lazy image, so the static capture shows the real design
  await page.evaluate(async () => {
    document.querySelectorAll('.reveal').forEach(n => n.classList.add('in'));
    document.querySelectorAll('img[loading="lazy"]').forEach(i => i.setAttribute('loading','eager'));
    const p = document.getElementById('threadPath'); if (p) p.style.strokeDashoffset = '0';
    const step = window.innerHeight * 0.8;
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(700);
  const dir = String.raw`C:\Users\danie\AppData\Local\Temp\claude\C--Windows-System32\accb64f8-6bb2-4b8a-9ec4-378dadf8d6f0\scratchpad`;
  const out = dir + String.raw`\gift-constellation-build.png`;
  await page.screenshot({ path: out, fullPage: true });
  // focused proof crop to confirm the review quotes render (no tofu)
  const proof = await page.$('.proof');
  if (proof) await proof.scrollIntoViewIfNeeded(), await page.waitForTimeout(200), await proof.screenshot({ path: dir + String.raw`\gift-constellation-proof.png` });
  await ctx.close();

  // desktop occasions crop @1280 to confirm nodes sit ON the central thread
  const dctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1.5 });
  const dpage = await dctx.newPage();
  await dpage.goto(FILE, { waitUntil: 'networkidle' });
  await dpage.evaluate(() => document.fonts && document.fonts.ready);
  await dpage.waitForTimeout(2000);
  await dpage.evaluate(async () => {
    document.querySelectorAll('.reveal').forEach(n => n.classList.add('in'));
    document.querySelectorAll('img[loading="lazy"]').forEach(i => i.setAttribute('loading','eager'));
    const p = document.getElementById('threadPath'); if (p) p.style.strokeDashoffset = '0';
    const step = window.innerHeight * 0.8;
    for (let y = 0; y <= document.body.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 100)); }
    window.scrollTo(0, 0);
  });
  await dpage.waitForTimeout(600);
  const occ = await dpage.$('.occasions');
  if (occ) await occ.scrollIntoViewIfNeeded(), await dpage.waitForTimeout(200), await occ.screenshot({ path: dir + String.raw`\gift-constellation-desktop-occ.png` });
  await dctx.close();

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
  console.log('screenshot:', out);
})();
