#!/usr/bin/env bun
/**
 * Generate a manual-posting paste-sheet from today's approved Type A rows.
 *
 * Reads the latest approved portraits from pawtrait_library, generates an HTML
 * page with copy-buttons for title / description / alt-text / destination URL /
 * board, and opens it in the default browser.
 *
 * Usage:
 *   bun scripts/library/paste-sheet.ts             # today's batch
 *   bun scripts/library/paste-sheet.ts 2026-05-09  # specific date
 *
 * Output: C:\Users\danie\Downloads\pawtraits-paste-sheet-<date>.html
 */
import { createClient } from '@supabase/supabase-js';

// Node < 22 lacks a global WebSocket which @supabase/realtime-js requires.
if (typeof (globalThis as { WebSocket?: unknown }).WebSocket === 'undefined') {
  const { WebSocket } = await import('ws');
  (globalThis as { WebSocket?: unknown }).WebSocket = WebSocket;
}
import { writeFileSync, readFileSync, existsSync } from 'node:fs';

// Manually load .env.local (Bun auto-loads but tsx doesn't)
for (const fname of ['.env.local', '.env']) {
  if (!existsSync(fname)) continue;
  for (const line of readFileSync(fname, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) { console.error('Missing Supabase env vars'); process.exit(1); }

const date = process.argv[2] || new Date().toISOString().slice(0, 10);
const supabase = createClient(URL, KEY);

const { data, error } = await supabase
  .from('pawtrait_library')
  .select('id, pet_name, breed, art_style, image_url, captions, backstory')
  .eq('image_style', 'portrait')
  .eq('approved', true)
  .gte('created_at', `${date}T00:00:00`)
  .lt('created_at', `${date}T23:59:59`)
  .order('pet_name', { ascending: true });

if (error) { console.error(error); process.exit(1); }
if (!data || data.length === 0) { console.error(`No approved Type A rows found for ${date}`); process.exit(1); }

const escape = (s: string) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

// Override per-row destination_url with the polished /pawtraits funnel landing page.
// Per-pin attribution is preserved via utm_content (library_id + variation index).
// Decision: 2026-05-09 — breed-specific pSEO pages will be revisited when they're
// SSR-rendered and have richer galleries. Until then, all Pinterest traffic goes
// to the parallax /pawtraits page that's actually built for conversion.
const overrideLink = (libraryId: string, variantIdx: number) =>
  `https://www.littlesouls.app/pawtraits?utm_source=pinterest&utm_medium=organic&utm_campaign=library&utm_content=${libraryId}-v${variantIdx + 1}`;

const cards = data.map((r, i) => {
  const v1 = r.captions?.pinterest?.variations?.[0] ?? {};
  const board = r.captions?.pinterest?.board ?? 'pawtraits';
  v1.destination_url = overrideLink(r.id, 0);
  return `
  <article class="pin">
    <div class="hdr">
      <span class="num">${i + 1}/${data.length}</span>
      <h2>${escape(r.pet_name)} — ${escape(r.breed)}</h2>
      <span class="style">${escape(r.art_style)}</span>
    </div>
    <div class="body">
      <a class="img-link" href="${escape(r.image_url)}" target="_blank">
        <img src="${escape(r.image_url)}" alt="${escape(v1.alt_text || '')}" />
        <span class="dl">↓ Open / right-click save</span>
      </a>
      <div class="fields">
        <div class="field">
          <label>Title <span class="len" data-target="t${i}"></span></label>
          <textarea id="t${i}" rows="2" readonly>${escape(v1.title || '')}</textarea>
          <button data-copy="t${i}">Copy</button>
        </div>
        <div class="field">
          <label>Description <span class="len" data-target="d${i}"></span></label>
          <textarea id="d${i}" rows="4" readonly>${escape(v1.description || '')}</textarea>
          <button data-copy="d${i}">Copy</button>
        </div>
        <div class="field">
          <label>Alt text <span class="len" data-target="a${i}"></span></label>
          <textarea id="a${i}" rows="2" readonly>${escape(v1.alt_text || '')}</textarea>
          <button data-copy="a${i}">Copy</button>
        </div>
        <div class="field">
          <label>Destination link</label>
          <textarea id="l${i}" rows="2" readonly>${escape(v1.destination_url || '')}</textarea>
          <button data-copy="l${i}">Copy</button>
        </div>
        <div class="field board">
          <label>Board</label>
          <code>${escape(board)}</code>
          <small>${r.captions?.pinterest?.board ? '' : '(default — no board specified)'}</small>
        </div>
        <div class="field meta">
          <small>${escape(r.backstory || '')}</small>
        </div>
      </div>
    </div>
    <details>
      <summary>V2 + V3 (alternate angles for spaced reposts)</summary>
      ${(r.captions?.pinterest?.variations?.slice(1) ?? []).map((v: any, j: number) => `
        <div class="alt">
          <strong>V${j + 2}</strong>
          <textarea readonly rows="2">${escape(v.title || '')}</textarea>
          <textarea readonly rows="3">${escape(v.description || '')}</textarea>
          <textarea readonly rows="2">${escape(v.alt_text || '')}</textarea>
          <textarea readonly rows="1">${escape(overrideLink(r.id, j + 1))}</textarea>
        </div>`).join('')}
    </details>
  </article>`;
}).join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Pawtraits paste-sheet — ${date}</title>
<style>
  :root { --rose:#bf524a; --cream:#FFFDF5; --ink:#141210; --warm:#5a4a42; --sand:#e8ddd0; --gold:#c4a265; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, system-ui, sans-serif; background: var(--cream); color: var(--ink); margin: 0; padding: 24px 32px 64px; line-height: 1.45; }
  h1 { font-family: Georgia, serif; font-size: 32px; margin: 0 0 8px; }
  .lead { color: var(--warm); margin: 0 0 24px; max-width: 720px; }
  .lead a { color: var(--rose); }
  .toolbar { position: sticky; top: 0; background: var(--cream); padding: 12px 0; border-bottom: 1px solid var(--sand); z-index: 10; margin-bottom: 24px; }
  .toolbar a { display: inline-block; padding: 8px 16px; background: var(--rose); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin-right: 8px; }
  .toolbar a.secondary { background: white; color: var(--ink); border: 1px solid var(--sand); }
  .pin { background: white; border: 1px solid var(--sand); border-radius: 12px; padding: 20px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
  .hdr { display: flex; align-items: baseline; gap: 12px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--sand); }
  .num { font-weight: 700; color: var(--rose); font-size: 14px; min-width: 38px; }
  .hdr h2 { margin: 0; font-family: Georgia, serif; font-size: 22px; flex: 1; }
  .style { color: var(--warm); font-size: 13px; font-family: monospace; background: var(--cream); padding: 2px 8px; border-radius: 4px; }
  .body { display: grid; grid-template-columns: 280px 1fr; gap: 20px; }
  .img-link { display: block; text-decoration: none; color: var(--warm); }
  .img-link img { width: 100%; border-radius: 8px; display: block; box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
  .img-link .dl { display: block; text-align: center; font-size: 12px; margin-top: 6px; }
  .fields { display: flex; flex-direction: column; gap: 14px; }
  .field { display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: start; }
  .field label { grid-column: 1 / 3; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--warm); }
  .field .len { font-weight: 400; text-transform: none; letter-spacing: 0; color: var(--gold); margin-left: 8px; }
  .field textarea { font-family: inherit; font-size: 14px; line-height: 1.4; padding: 8px 10px; border: 1px solid var(--sand); border-radius: 6px; resize: vertical; background: var(--cream); color: var(--ink); }
  .field button { background: var(--ink); color: white; border: 0; padding: 0 14px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; height: 100%; min-height: 36px; align-self: stretch; }
  .field button:hover { background: var(--rose); }
  .field button.copied { background: var(--gold); }
  .field.board code { font-family: monospace; padding: 4px 8px; background: var(--cream); border-radius: 4px; font-size: 13px; }
  .field.board small { color: var(--warm); }
  .field.meta small { color: var(--warm); font-style: italic; font-family: Georgia, serif; font-size: 14px; }
  details { margin-top: 16px; padding-top: 12px; border-top: 1px dashed var(--sand); }
  details summary { cursor: pointer; font-size: 13px; color: var(--warm); }
  details .alt { margin: 12px 0; padding: 12px; background: var(--cream); border-radius: 6px; }
  details .alt strong { color: var(--rose); display: block; margin-bottom: 6px; }
  details .alt textarea { width: 100%; margin-bottom: 6px; font-size: 12px; padding: 6px; border: 1px solid var(--sand); border-radius: 4px; font-family: inherit; resize: none; }
  @media (max-width: 720px) { .body { grid-template-columns: 1fr; } }
</style>
</head>
<body>
  <h1>Pawtraits paste-sheet — ${date}</h1>
  <p class="lead">${data.length} portraits ready for manual posting. Open <a href="https://www.pinterest.com/pin-builder/" target="_blank">Pinterest pin builder</a> in another tab. For each card: open the image, save it, then drag/upload + paste each field. Use the scheduler to spread across 14 days.</p>

  <div class="toolbar">
    <a href="https://www.pinterest.com/pin-builder/" target="_blank">Open Pinterest pin builder ↗</a>
    <a class="secondary" href="https://uk.pinterest.com/littlesoulsapp/_created/" target="_blank">Your created pins ↗</a>
    <a class="secondary" href="https://uk.pinterest.com/littlesoulsapp/" target="_blank">Your boards ↗</a>
  </div>

  ${cards}

<script>
  // Copy buttons
  document.querySelectorAll('button[data-copy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-copy');
      const ta = document.getElementById(id);
      try {
        await navigator.clipboard.writeText(ta.value);
        const orig = btn.textContent;
        btn.textContent = '✓ Copied';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 1200);
      } catch (e) {
        ta.select();
        document.execCommand('copy');
        btn.textContent = '✓';
      }
    });
  });
  // Live char counters
  document.querySelectorAll('.len[data-target]').forEach(span => {
    const id = span.getAttribute('data-target');
    const ta = document.getElementById(id);
    if (ta) span.textContent = ta.value.length + ' chars';
  });
<\/script>
</body>
</html>`;

const outPath = `C:/Users/danie/Downloads/pawtraits-paste-sheet-${date}.html`;
writeFileSync(outPath, html);
console.log(`✓ Wrote ${data.length} pin cards → ${outPath}`);
console.log(`  Open in your browser, then go batch them through https://www.pinterest.com/pin-builder/`);
