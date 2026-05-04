/**
 * /api/portraits — single router for the portrait actions.
 *
 *   POST /api/portraits?action=preview     legacy 6-pack one-shot
 *   POST /api/portraits?action=generate    Tier 1 Style×Theme 4-variant + auth + credits
 *   POST /api/portraits?action=cutout      Photoroom cutout
 *   POST /api/portraits?action=composite   sharp 3000×3000 print master for Gelato
 *   POST /api/portraits?action=mockup      Dynamic Mockups realistic product preview
 *
 * Single Serverless Function on Vercel — Hobby plan caps at 12. We previously
 * had 4 separate files; consolidated 2026-05-04.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import {
  buildPrompt,
  sanitiseAddDetails,
  COMPOSITIONS,
  type BuildPromptInput,
} from "../src/components/portraits/styles/styleTheme.js";
import {
  TEMPLATES,
  type TemplateDef,
  type PetTransform,
} from "../src/components/portraits/templates/data.js";
import { getSupabaseAdmin } from "./_lib/supabaseAdmin.js";

// ─── Shared config ──────────────────────────────────────────────────────────
const FAL_KEY = process.env.FAL_KEY;
const KONTEXT_ENDPOINT = "https://fal.run/fal-ai/flux-pro/kontext";
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const VISION_MODEL = "google/gemini-2.0-flash-001";
const PHOTOROOM_KEY = process.env.PHOTOROOM_API_KEY;
const PHOTOROOM_ENDPOINT = "https://image-api.photoroom.com/v2/edit";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PRINT_SIZE = 3000;
const TOKENS_PER_GENERATION = 4;

type ProductType = "framed-canvas" | "mug" | "tote" | "tee" | "hoodie";

// Mockup endpoint removed 2026-05-04 — we display the clean cutout + product
// label, no compositing dance. Customer understands the product. Pawcaso does
// the same thing. Less code, $0, ships fast.

// Removed: parametric SVG mockup builders. Customer sees clean cutout + product
// label/price; that's enough for v1. Old block kept commented below for ref.
/*
const _UNUSED_MOCKUPS: Record<ProductType, { svg: (designDataUri: string) => string }> = {
  mug: {
    svg: (designDataUri) => {
      const S = MOCKUP_SIZE;
      // Mug body: rounded rect on left + handle on right.
      // Design area: front face of mug (cx 470, cy S/2, radius 280).
      const cx = 480, cy = S / 2, r = 280;
      return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs>
    <linearGradient id="bg" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="#FFFDF5"/>
      <stop offset="100%" stop-color="#faf4e8"/>
    </linearGradient>
    <linearGradient id="mug" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0%" stop-color="#fafaf7"/>
      <stop offset="35%" stop-color="#ffffff"/>
      <stop offset="65%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#e8e3d8"/>
    </linearGradient>
    <radialGradient id="mugInside" cx="0.5" cy="0.5" r="0.6">
      <stop offset="0%" stop-color="#3a322a"/>
      <stop offset="100%" stop-color="#1a1612"/>
    </radialGradient>
    <clipPath id="mugDesign"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
    <filter id="mugShadow"><feGaussianBlur in="SourceAlpha" stdDeviation="14"/><feOffset dx="0" dy="20"/><feComponentTransfer><feFuncA type="linear" slope="0.18"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="${S}" height="${S}" fill="url(#bg)"/>
  <g filter="url(#mugShadow)">
    <!-- handle -->
    <path d="M 760 ${cy - 130} Q 920 ${cy - 130} 920 ${cy} Q 920 ${cy + 130} 760 ${cy + 130}" stroke="#d8d0c2" stroke-width="34" fill="none" stroke-linecap="round"/>
    <path d="M 760 ${cy - 100} Q 870 ${cy - 100} 870 ${cy} Q 870 ${cy + 100} 760 ${cy + 100}" stroke="#FFFDF5" stroke-width="34" fill="none" stroke-linecap="round"/>
    <!-- mug body -->
    <rect x="180" y="${cy - 320}" width="600" height="640" rx="28" fill="url(#mug)" stroke="#d8d0c2" stroke-width="2"/>
    <!-- mug top opening -->
    <ellipse cx="${cx}" cy="${cy - 320}" rx="300" ry="38" fill="url(#mugInside)"/>
    <ellipse cx="${cx}" cy="${cy - 320}" rx="300" ry="38" fill="none" stroke="#d8d0c2" stroke-width="2"/>
    <!-- design clipped to circular print area on front face -->
    <g clip-path="url(#mugDesign)">
      <image href="${designDataUri}" x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" preserveAspectRatio="xMidYMid slice"/>
    </g>
  </g>
</svg>`;
    },
  },
  "framed-canvas": {
    svg: (designDataUri) => {
      const S = MOCKUP_SIZE;
      // Wall scene + framed canvas in centre. Design area inside the frame.
      const fw = 760, fh = 920, fx = (S - fw) / 2, fy = (S - fh) / 2;
      const bezel = 36;
      return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f6efe2"/>
      <stop offset="100%" stop-color="#e8ddc8"/>
    </linearGradient>
    <linearGradient id="frame" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3a2a1a"/>
      <stop offset="50%" stop-color="#2a1d12"/>
      <stop offset="100%" stop-color="#1f140a"/>
    </linearGradient>
    <filter id="canShadow"><feGaussianBlur in="SourceAlpha" stdDeviation="22"/><feOffset dx="0" dy="36"/><feComponentTransfer><feFuncA type="linear" slope="0.25"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <clipPath id="canvasInner"><rect x="${fx + bezel}" y="${fy + bezel}" width="${fw - bezel * 2}" height="${fh - bezel * 2}"/></clipPath>
  </defs>
  <rect width="${S}" height="${S}" fill="url(#wall)"/>
  <!-- wall plant silhouette, decorative -->
  <ellipse cx="120" cy="${S - 80}" rx="160" ry="40" fill="#d4c5a8" opacity="0.4"/>
  <ellipse cx="${S - 100}" cy="${S - 60}" rx="140" ry="30" fill="#d4c5a8" opacity="0.35"/>
  <g filter="url(#canShadow)">
    <!-- frame -->
    <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="url(#frame)" rx="4"/>
    <!-- canvas image area (white margin then design) -->
    <rect x="${fx + bezel}" y="${fy + bezel}" width="${fw - bezel * 2}" height="${fh - bezel * 2}" fill="#FFFDF5"/>
    <g clip-path="url(#canvasInner)">
      <image href="${designDataUri}" x="${fx + bezel}" y="${fy + bezel}" width="${fw - bezel * 2}" height="${fh - bezel * 2}" preserveAspectRatio="xMidYMid slice"/>
    </g>
    <!-- subtle inner bevel -->
    <rect x="${fx + bezel}" y="${fy + bezel}" width="${fw - bezel * 2}" height="${fh - bezel * 2}" fill="none" stroke="rgba(20,18,16,0.25)" stroke-width="2"/>
  </g>
</svg>`;
    },
  },
  tote: {
    svg: (designDataUri) => {
      const S = MOCKUP_SIZE;
      // Tote bag silhouette with handles.
      const bx = 280, by = 280, bw = 640, bh = 700;
      const designSize = 360;
      const dx = bx + bw / 2 - designSize / 2;
      const dy = by + 200;
      return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs>
    <linearGradient id="bg2" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="#FFFDF5"/>
      <stop offset="100%" stop-color="#faf4e8"/>
    </linearGradient>
    <linearGradient id="tote" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fafaf7"/>
      <stop offset="40%" stop-color="#f0ebe0"/>
      <stop offset="100%" stop-color="#e0d8c8"/>
    </linearGradient>
    <filter id="toteShadow"><feGaussianBlur in="SourceAlpha" stdDeviation="16"/><feOffset dx="0" dy="22"/><feComponentTransfer><feFuncA type="linear" slope="0.2"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <clipPath id="toteDesign"><rect x="${dx}" y="${dy}" width="${designSize}" height="${designSize}" rx="8"/></clipPath>
  </defs>
  <rect width="${S}" height="${S}" fill="url(#bg2)"/>
  <g filter="url(#toteShadow)">
    <!-- handles -->
    <path d="M ${bx + 130} ${by} Q ${bx + 130} ${by - 180} ${bx + 280} ${by - 180} Q ${bx + 320} ${by - 180} ${bx + 320} ${by}" stroke="#c9bfa8" stroke-width="22" fill="none" stroke-linecap="round"/>
    <path d="M ${bx + bw - 320} ${by} Q ${bx + bw - 320} ${by - 180} ${bx + bw - 280} ${by - 180} Q ${bx + bw - 130} ${by - 180} ${bx + bw - 130} ${by}" stroke="#c9bfa8" stroke-width="22" fill="none" stroke-linecap="round"/>
    <!-- bag body -->
    <path d="M ${bx} ${by} L ${bx + bw} ${by} L ${bx + bw - 30} ${by + bh} L ${bx + 30} ${by + bh} Z" fill="url(#tote)" stroke="#bfb59f" stroke-width="2"/>
    <!-- design -->
    <g clip-path="url(#toteDesign)">
      <image href="${designDataUri}" x="${dx}" y="${dy}" width="${designSize}" height="${designSize}" preserveAspectRatio="xMidYMid slice"/>
    </g>
  </g>
</svg>`;
    },
  },
  tee: {
    svg: (designDataUri) => {
      const S = MOCKUP_SIZE;
      const designSize = 280;
      const dx = S / 2 - designSize / 2;
      const dy = 410;
      return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs>
    <linearGradient id="bg3" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="#FFFDF5"/>
      <stop offset="100%" stop-color="#faf4e8"/>
    </linearGradient>
    <linearGradient id="tee" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fafaf7"/>
      <stop offset="60%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#e8e3d8"/>
    </linearGradient>
    <filter id="teeShadow"><feGaussianBlur in="SourceAlpha" stdDeviation="14"/><feOffset dx="0" dy="20"/><feComponentTransfer><feFuncA type="linear" slope="0.18"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <clipPath id="teeDesign"><rect x="${dx}" y="${dy}" width="${designSize}" height="${designSize}" rx="6"/></clipPath>
  </defs>
  <rect width="${S}" height="${S}" fill="url(#bg3)"/>
  <g filter="url(#teeShadow)">
    <!-- t-shirt silhouette: shoulders, sleeves, body -->
    <path d="M 350 280 L 460 220 Q 520 200 600 200 Q 680 200 740 220 L 850 280
             L 980 380 L 920 480 L 800 420
             L 800 980 Q 800 1000 780 1000 L 420 1000 Q 400 1000 400 980
             L 400 420 L 280 480 L 220 380 Z"
          fill="url(#tee)" stroke="#cfc5af" stroke-width="2" stroke-linejoin="round"/>
    <!-- collar -->
    <path d="M 540 200 Q 600 230 660 200" stroke="#cfc5af" stroke-width="3" fill="none"/>
    <!-- design -->
    <g clip-path="url(#teeDesign)">
      <image href="${designDataUri}" x="${dx}" y="${dy}" width="${designSize}" height="${designSize}" preserveAspectRatio="xMidYMid slice"/>
    </g>
  </g>
</svg>`;
    },
  },
  hoodie: {
    svg: (designDataUri) => {
      const S = MOCKUP_SIZE;
      const designSize = 260;
      const dx = S / 2 - designSize / 2;
      const dy = 480;
      return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs>
    <linearGradient id="bg4" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="#FFFDF5"/>
      <stop offset="100%" stop-color="#faf4e8"/>
    </linearGradient>
    <linearGradient id="hoodie" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3a352c"/>
      <stop offset="60%" stop-color="#22201b"/>
      <stop offset="100%" stop-color="#15130f"/>
    </linearGradient>
    <filter id="hoodShadow"><feGaussianBlur in="SourceAlpha" stdDeviation="16"/><feOffset dx="0" dy="22"/><feComponentTransfer><feFuncA type="linear" slope="0.25"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <clipPath id="hoodDesign"><rect x="${dx}" y="${dy}" width="${designSize}" height="${designSize}" rx="6"/></clipPath>
  </defs>
  <rect width="${S}" height="${S}" fill="url(#bg4)"/>
  <g filter="url(#hoodShadow)">
    <!-- hood (inverted U above shoulders) -->
    <path d="M 480 220 Q 600 140 720 220 L 700 320 Q 600 280 500 320 Z" fill="url(#hoodie)"/>
    <!-- body -->
    <path d="M 320 320 L 460 280 Q 520 270 600 270 Q 680 270 740 280 L 880 320
             L 1000 420 L 940 520 L 820 460
             L 820 1010 Q 820 1030 800 1030 L 400 1030 Q 380 1030 380 1010
             L 380 460 L 260 520 L 200 420 Z"
          fill="url(#hoodie)" stroke-linejoin="round"/>
    <!-- pocket -->
    <path d="M 460 720 L 740 720 L 720 870 L 480 870 Z" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>
    <!-- drawstrings -->
    <line x1="555" y1="290" x2="555" y2="430" stroke="#d8d0c2" stroke-width="4"/>
    <line x1="645" y1="290" x2="645" y2="430" stroke="#d8d0c2" stroke-width="4"/>
    <!-- design -->
    <g clip-path="url(#hoodDesign)">
      <image href="${designDataUri}" x="${dx}" y="${dy}" width="${designSize}" height="${designSize}" preserveAspectRatio="xMidYMid slice"/>
    </g>
  </g>
</svg>`;
    },
  },
};
*/

type Style = "photographic" | "illustrated";

// ─── Router ─────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const action = req.query.action;
  switch (action) {
    case "preview":
      return handlePreview(req, res);
    case "generate":
      return handleGenerate(req, res);
    case "cutout":
      return handleCutout(req, res);
    case "composite":
      return handleComposite(req, res);
    case "mockup":
      return handleMockup(req, res);
    case "printful-mockup":
      return handlePrintfulMockup(req, res);
    default:
      return res.status(400).json({ error: `Unknown action: ${action}. Valid: preview|generate|cutout|composite|mockup|printful-mockup` });
  }
}

// ─── handlePrintfulMockup — photoreal mockup via Printful Mockup Generator ──
// Two-phase: POST without taskId → submits and returns { taskId }.
//            POST with taskId   → polls task, returns { status, mockupUrl? }.
// Client polls every 3s. Typical e2e: 10–30s.
//
// Requires env: PRINTFUL_API_TOKEN, PRINTFUL_STORE_ID
const PRINTFUL_TOKEN = process.env.PRINTFUL_API_TOKEN;
const PRINTFUL_STORE_ID = process.env.PRINTFUL_STORE_ID;

interface PrintfulProductConfig {
  catalog_product_id: number;
  catalog_variant_id: number;
  mockup_style_id: number;
  placement: string;
  technique: string;
}

// Verified live against Printful API on 2026-05-04 — variant IDs are real,
// mockup style IDs match the placement+technique pair returned by /v2/catalog-products/{id}/mockup-styles.
const PRINTFUL_PRODUCTS: Record<ProductType, PrintfulProductConfig> = {
  // White Glossy Mug 11oz · Default Front view (style 10423)
  "mug":           { catalog_product_id: 19,  catalog_variant_id: 1320,  mockup_style_id: 10423, placement: "default", technique: "sublimation" },
  // Framed Canvas Black 12″×16″ · Lifestyle Front (style 3795 — Black-variant of 3794)
  "framed-canvas": { catalog_product_id: 614, catalog_variant_id: 16035, mockup_style_id: 3795,  placement: "default", technique: "digital" },
  // Eco Tote Oyster (cream, on-brand) · Flat Lifestyle Front (style 19430)
  // Switched from product 84 (All-Over Print, cut-sew) → 367 (Eco Tote, DTG) to
  // avoid the cut-sew stitch_color required-option dance.
  "tote":          { catalog_product_id: 367, catalog_variant_id: 10458, mockup_style_id: 19430, placement: "front",   technique: "dtg" },
  // Bella+Canvas 3001 White / M · Men's Lifestyle Front (style 744)
  "tee":           { catalog_product_id: 71,  catalog_variant_id: 4012,  mockup_style_id: 744,   placement: "front",   technique: "dtg" },
  // Gildan 18500 White / M · Flat Lifestyle Front (style 1405)
  "hoodie":        { catalog_product_id: 146, catalog_variant_id: 5523,  mockup_style_id: 1405,  placement: "front",   technique: "dtg" },
};

async function handlePrintfulMockup(req: VercelRequest, res: VercelResponse) {
  if (!PRINTFUL_TOKEN) {
    return res.status(503).json({ error: "printful-not-configured", message: "PRINTFUL_API_TOKEN env var not set" });
  }
  if (!PRINTFUL_STORE_ID) {
    return res.status(503).json({ error: "printful-store-missing", message: "PRINTFUL_STORE_ID env var not set. Create a free 'Manual order platform / API' store at printful.com/dashboard/store, then set PRINTFUL_STORE_ID env on Vercel." });
  }

  const headers = {
    "Authorization": `Bearer ${PRINTFUL_TOKEN}`,
    "X-PF-Store-Id": PRINTFUL_STORE_ID,
    "Content-Type": "application/json",
  };

  const body = (req.body ?? {}) as { taskId?: string; designUrl?: string; productType?: ProductType };

  // Printful v2 returns `data` as an array of mockup-tasks, even for a single task.
  type PfMockupTask = {
    id?: string | number;
    status?: string;
    catalog_variant_mockups?: Array<{ mockups?: Array<{ mockup_url?: string }> }>;
  };
  const firstTask = (j: { data?: PfMockupTask | PfMockupTask[] }): PfMockupTask | undefined => {
    if (Array.isArray(j.data)) return j.data[0];
    return j.data;
  };

  // ── Poll mode ─────────────────────────────────────────────────────────────
  if (body.taskId) {
    try {
      const r = await fetch(`https://api.printful.com/v2/mockup-tasks?id=${encodeURIComponent(body.taskId)}`, { headers });
      const j = await r.json() as { data?: PfMockupTask | PfMockupTask[]; error?: unknown };
      if (!r.ok) return res.status(r.status).json({ error: "printful-poll-failed", detail: j });
      const task = firstTask(j);
      const status = task?.status ?? "unknown";
      let mockupUrl: string | undefined;
      const cvm = task?.catalog_variant_mockups;
      if (status === "completed" && cvm && cvm.length > 0) {
        mockupUrl = cvm[0]?.mockups?.[0]?.mockup_url;
      }
      return res.status(200).json({ status, mockupUrl, taskId: body.taskId });
    } catch (err) {
      return res.status(500).json({ error: "printful-poll-error", detail: (err as Error).message });
    }
  }

  // ── Submit mode ───────────────────────────────────────────────────────────
  const { designUrl, productType } = body;
  if (!designUrl) return res.status(400).json({ error: "designUrl required" });
  if (!productType || !(productType in PRINTFUL_PRODUCTS)) {
    return res.status(400).json({ error: `Unknown productType: ${productType}` });
  }
  const cfg = PRINTFUL_PRODUCTS[productType];

  try {
    const submitBody = {
      format: "jpg",
      products: [{
        source: "catalog",
        catalog_product_id: cfg.catalog_product_id,
        catalog_variant_ids: [cfg.catalog_variant_id],
        mockup_style_ids: [cfg.mockup_style_id],
        placements: [{
          placement: cfg.placement,
          technique: cfg.technique,
          layers: [{ type: "file", url: designUrl }],
        }],
      }],
    };
    const r = await fetch("https://api.printful.com/v2/mockup-tasks", {
      method: "POST",
      headers,
      body: JSON.stringify(submitBody),
    });
    const j = await r.json() as { data?: PfMockupTask | PfMockupTask[]; error?: unknown };
    if (!r.ok) return res.status(r.status).json({ error: "printful-submit-failed", detail: j });
    const taskId = String(firstTask(j)?.id ?? "");
    if (!taskId) return res.status(502).json({ error: "printful-no-task-id", detail: j });
    return res.status(202).json({ taskId, status: "pending", productType });
  } catch (err) {
    return res.status(500).json({ error: "printful-submit-error", detail: (err as Error).message });
  }
}

// ─── handleMockup — composite design onto real product photo ───────────────
// Uses Sharp + the real product photos at public/portraits/products/*.webp
// (the same shots used by ExploreRange tile rail — generated 2026-05-03).
// Free forever. No third-party API.
//
// Design area coords (cx, cy, w/h as fractions) — tuned for the clean
// Printful blank base images (1000×1000) pulled from /v2/catalog-variants/{id}/images:
//   mug    → 03_whitemug_11oz_front_base_whitebg.png
//   canvas → 05_12x16_black_base.png
//   tote   → 05_ec8000_flat_front_base_whitebg.png
//   tee    → 05_bc3001_flat_front_base_whitebg.png
//   hoodie → 05_gildan18500_flat_front_base_whitebg.png
const MOCKUP_COORDS: Record<ProductType, { cx: number; cy: number; w: number; h: number }> = {
  "mug":           { cx: 0.5,  cy: 0.55, w: 0.34, h: 0.40 },
  "framed-canvas": { cx: 0.5,  cy: 0.5,  w: 0.62, h: 0.62 },
  "tote":          { cx: 0.5,  cy: 0.55, w: 0.38, h: 0.46 },
  "tee":           { cx: 0.5,  cy: 0.43, w: 0.30, h: 0.40 },
  "hoodie":        { cx: 0.5,  cy: 0.45, w: 0.28, h: 0.36 },
};

async function handleMockup(req: VercelRequest, res: VercelResponse) {
  const { designUrl, productType } = (req.body ?? {}) as {
    designUrl?: string;
    productType?: ProductType;
  };
  if (!designUrl) return res.status(400).json({ error: "designUrl required" });
  if (!productType || !(productType in MOCKUP_COORDS)) {
    return res.status(400).json({ error: `Unknown productType: ${productType}` });
  }

  try {
    const proto = (req.headers["x-forwarded-proto"] as string) || "https";
    const host = req.headers.host || "littlesouls.app";
    const baseUrl = `${proto}://${host}/portraits/products/${productType}.webp`;

    const [baseBuf, designBuf] = await Promise.all([
      fetch(baseUrl).then((r) => r.arrayBuffer()).then(Buffer.from),
      fetch(designUrl).then((r) => r.arrayBuffer()).then(Buffer.from),
    ]);

    const baseMeta = await sharp(baseBuf).metadata();
    const W = baseMeta.width ?? 1200;
    const H = baseMeta.height ?? 1200;

    const coord = MOCKUP_COORDS[productType];
    const targetW = Math.round(W * coord.w);
    const targetH = Math.round(H * coord.h);
    const left = Math.round(W * coord.cx - targetW / 2);
    const top = Math.round(H * coord.cy - targetH / 2);

    const designResized = await sharp(designBuf)
      .resize(targetW, targetH, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    const composed = await sharp(baseBuf)
      .composite([{ input: designResized, top, left, blend: "over" }])
      .png()
      .toBuffer();

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=600");
    return res.status(200).send(composed);
  } catch (err) {
    return res.status(500).json({ error: "Mockup composite failed", detail: (err as Error).message });
  }
}

// ─── handlePreview — legacy 6-pack one-shot ─────────────────────────────────
const IDENTITY_LOCK =
  "Preserve the exact breed, fur colour, fur length, markings, eye colour, ear shape, and face structure of the source pet. Do not change species. The pet's identity is the anchor — wardrobe and world wrap around the SAME animal.";

const STYLE_TREATMENT: Record<Style, { suffix: string; negative: string }> = {
  photographic: {
    suffix:
      "Render in a cinematic painterly photo-portrait finish — feels like a real photograph styled by a master cinematographer. Soft natural lighting, rich shadows, premium oil-painting polish over photoreal foundation. 4:5 vertical composition for framed wall art.",
    negative: "cartoon, anime, vector art, flat illustration, plastic look, neon, 3d-render",
  },
  illustrated: {
    suffix:
      "Render as a premium hand-drawn illustrated portrait — polished modern character illustration in the spirit of high-end children's-book cover art crossed with editorial portraiture. Confident inked linework, painterly digital colour, soft volumetric shading, NOT a flat cartoon. The pet still reads as themselves but stylised. 4:5 vertical composition for framed wall art.",
    negative: "photorealistic, harsh photo finish, snapshot, low-effort cartoon, plastic 3d, anime cliche",
  },
};

interface SceneDef { scene: string; packNegatives?: string }
const SCENES: Record<string, SceneDef> = {
  "1920s-boss":      { scene: "Place the pet as a 1920s prohibition-era underworld boss in a smoky private back room. Tailored pinstripe waistcoat, silk tie, gold pocket-watch chain, brilliantined fur, dramatic chiaroscuro from a single brass desk lamp. Sepia-toned, rain on a window in soft background.", packNegatives: "modern clothing, neon" },
  "wizard-school":   { scene: "Place the pet as a young wizard student in a candlelit ancient library. Velvet robe with gold trim, leather-bound spell book floating beside them, soft warm magical glow on fur, tall stained-glass window in background.", packNegatives: "harry-potter logos, hogwarts crest, sci-fi" },
  "gothic-academy":  { scene: "Place the pet as a gothic academy star — moody deadpan expression, dark academic uniform with ribbon collar, rain on stained glass behind them, candle-lit study, deep shadows. Muted plum and charcoal palette.", packNegatives: "bright colours, cheerful" },
  "galaxy-smuggler": { scene: "Place the pet as a galaxy smuggler captain in a worn leather flight jacket, charming roguish expression, hyperspace-blur cockpit window in background, console lights reflecting on fur. Warm amber and deep navy palette.", packNegatives: "star-wars logos, lightsaber, exact franchise costumes" },
  "regency-court":   { scene: "Place the pet at a regency-era ballroom — ivory silk cravat or ribbon, soft candlelight, gilded mirror behind them, witty graceful posture. Cream, gold, and rose palette.", packNegatives: "modern clothing, harsh light" },
  "cosmic-chart":    { scene: "Place the pet at the centre of a luminous astrological birth-chart wheel — zodiac glyphs and constellation lines glowing in fine gold around them, deep cosmic indigo background flecked with soft stars, the pet rendered as the soul at the chart's centre.", packNegatives: "harsh contrast, plastic" },
};

interface KontextResponse { images?: Array<{ url: string }>; request_id?: string }

function isFalBalanceExhausted(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes("exhausted balance") || lower.includes("user is locked") || lower.includes("top up your balance");
}

function balancePausedResponse(res: VercelResponse) {
  return res.status(503).json({
    error: "ai-service-paused",
    message: "Our AI portrait service is paused (account top-up needed). Try the Templates flow — your pet's actual face on a beautifully framed product, no AI required.",
    cta: { label: "Try Templates instead", href: "/portraits/templates" },
  });
}

async function handlePreview(req: VercelRequest, res: VercelResponse) {
  if (!FAL_KEY) return res.status(500).json({ error: "FAL_KEY not configured" });
  const body = (req.body ?? {}) as { imageUrl?: string; packId?: string; style?: string };
  const { imageUrl, packId } = body;
  const style: Style = body.style === "illustrated" ? "illustrated" : "photographic";

  if (!imageUrl) return res.status(400).json({ error: "imageUrl required" });
  if (!packId || !SCENES[packId]) return res.status(400).json({ error: `Unknown pack: ${packId}` });

  const sceneDef = SCENES[packId];
  const styleDef = STYLE_TREATMENT[style];
  const prompt = `${IDENTITY_LOCK} ${sceneDef.scene} ${styleDef.suffix}`;
  const negative = [styleDef.negative, sceneDef.packNegatives].filter(Boolean).join(", ");

  try {
    const falRes = await fetch(KONTEXT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Key ${FAL_KEY}` },
      body: JSON.stringify({
        prompt, image_url: imageUrl, guidance_scale: 3.5, num_inference_steps: 28,
        aspect_ratio: "4:5", ...(negative ? { negative_prompt: negative } : {}),
      }),
    });
    if (!falRes.ok) {
      const text = await falRes.text();
      if (isFalBalanceExhausted(text)) return balancePausedResponse(res);
      return res.status(falRes.status).json({ error: "fal request failed", detail: text.slice(0, 500) });
    }
    const data = (await falRes.json()) as KontextResponse;
    const previewUrl = data.images?.[0]?.url;
    if (!previewUrl) return res.status(502).json({ error: "fal returned no image" });
    return res.status(200).json({ previewUrl, requestId: data.request_id, style });
  } catch (err) {
    return res.status(500).json({ error: "Preview failed", detail: (err as Error).message });
  }
}

// ─── handleGenerate — Tier 1 4-variant Style×Theme ───────────────────────────
interface SubjectInfo { species: string; breed?: string; furColor?: string }

async function extractSubject(imageUrl: string): Promise<SubjectInfo> {
  const fallback: SubjectInfo = { species: "pet" };
  if (!OPENROUTER_KEY) return fallback;
  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENROUTER_KEY}` },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [
          { role: "system", content: 'You analyse pet photos. Return STRICT JSON: {"species":"dog|cat|rabbit|bird|other","breed":"<best guess or null>","furColor":"<short description or null>"}. No prose. No markdown.' },
          { role: "user", content: [{ type: "text", text: "What pet is this? Return JSON only." }, { type: "image_url", image_url: { url: imageUrl } }] },
        ],
        response_format: { type: "json_object" }, max_tokens: 120,
      }),
    });
    if (!r.ok) return fallback;
    const d = await r.json() as { choices?: Array<{ message?: { content?: string } }> };
    const c = d.choices?.[0]?.message?.content;
    if (!c) return fallback;
    const p = JSON.parse(c) as Partial<SubjectInfo>;
    return {
      species: p.species && typeof p.species === "string" ? p.species : "pet",
      breed: typeof p.breed === "string" && p.breed !== "null" ? p.breed : undefined,
      furColor: typeof p.furColor === "string" && p.furColor !== "null" ? p.furColor : undefined,
    };
  } catch { return fallback; }
}

interface VariantResult { url?: string; balanceExhausted?: boolean }
async function generateVariant(args: { imageUrl: string; prompt: string; negative?: string }): Promise<VariantResult> {
  const r = await fetch(KONTEXT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Key ${FAL_KEY}` },
    body: JSON.stringify({
      prompt: args.prompt, image_url: args.imageUrl, guidance_scale: 3.5,
      num_inference_steps: 28, aspect_ratio: "4:5",
      ...(args.negative ? { negative_prompt: args.negative } : {}),
    }),
  });
  if (!r.ok) {
    const text = await r.text();
    if (isFalBalanceExhausted(text)) return { balanceExhausted: true };
    return {};
  }
  const d = (await r.json()) as KontextResponse;
  return { url: d.images?.[0]?.url };
}

async function handleGenerate(req: VercelRequest, res: VercelResponse) {
  if (!FAL_KEY) return res.status(500).json({ error: "FAL_KEY not configured" });
  const body = (req.body ?? {}) as { imageUrl?: string; styleId?: string; themeId?: string; addDetails?: string };
  const { imageUrl, styleId, themeId } = body;
  const addDetails = sanitiseAddDetails(body.addDetails ?? "");
  if (!imageUrl) return res.status(400).json({ error: "imageUrl required" });
  if (!styleId) return res.status(400).json({ error: "styleId required" });
  if (!themeId) return res.status(400).json({ error: "themeId required" });

  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Sign in to generate", cta: { label: "Sign in or sign up", href: "/auth?next=/portraits/studio" } });
  }
  const token = auth.slice("Bearer ".length);
  const supabase = getSupabaseAdmin();
  const { data: userRes, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userRes.user) return res.status(401).json({ error: "Invalid token" });
  const userId = userRes.user.id;

  const { data: ok, error: rpcErr } = await supabase.rpc("consume_credits", { p_account_id: userId, p_tokens: TOKENS_PER_GENERATION });
  if (rpcErr) return res.status(500).json({ error: "Credit check failed", detail: rpcErr.message });
  if (!ok) {
    return res.status(402).json({
      error: "Out of credits",
      cta: {
        primary:   { label: "Subscribe — £8.99/mo", href: "/unlimited" },
        secondary: { label: "Buy 5-portrait pack — £4.99", href: "/unlimited?sku=pack" },
      },
    });
  }

  const subject = await extractSubject(imageUrl);
  const prompts: { prompt: string; negative: string; compositionId: string }[] = [];
  for (let i = 0; i < 4; i++) {
    const built = buildPrompt({
      species: subject.species, breed: subject.breed, furColor: subject.furColor,
      styleId, themeId, addDetails, compositionIdx: i as 0 | 1 | 2 | 3,
    } satisfies BuildPromptInput);
    if (!built) return res.status(400).json({ error: "Unknown styleId or themeId" });
    prompts.push({ ...built, compositionId: COMPOSITIONS[i].id });
  }

  try {
    const results = await Promise.all(prompts.map((p) => generateVariant({ imageUrl, prompt: p.prompt, negative: p.negative })));

    // If ANY result reports balance exhausted, full refund + service-paused response.
    if (results.some((r) => r.balanceExhausted)) {
      await supabase.rpc("grant_credits", { p_account_id: userId, p_tokens: TOKENS_PER_GENERATION, p_reason: "refund", p_metadata: { detail: "fal-balance-exhausted" } });
      return balancePausedResponse(res);
    }

    const variants = results.map((r, i) => (r.url ? { url: r.url, composition: prompts[i].compositionId } : null)).filter((v): v is { url: string; composition: string } => v !== null);

    if (variants.length === 0) {
      await supabase.rpc("grant_credits", { p_account_id: userId, p_tokens: TOKENS_PER_GENERATION, p_reason: "refund", p_metadata: { detail: "all-failed" } });
      return res.status(502).json({ error: "All variants failed (credits refunded)" });
    }
    if (variants.length < TOKENS_PER_GENERATION) {
      const refund = TOKENS_PER_GENERATION - variants.length;
      await supabase.rpc("grant_credits", { p_account_id: userId, p_tokens: refund, p_reason: "refund", p_metadata: { detail: "partial", returned: variants.length } });
    }
    return res.status(200).json({ variants, subject, prompts: prompts.map((p) => p.prompt) });
  } catch (err) {
    await supabase.rpc("grant_credits", { p_account_id: userId, p_tokens: TOKENS_PER_GENERATION, p_reason: "refund", p_metadata: { detail: "exception", error: (err as Error).message } });
    return res.status(500).json({ error: "Generation failed (credits refunded)", detail: (err as Error).message });
  }
}

// ─── handleCutout — Photoroom ───────────────────────────────────────────────
async function handleCutout(req: VercelRequest, res: VercelResponse) {
  if (!PHOTOROOM_KEY) return res.status(500).json({ error: "PHOTOROOM_API_KEY not configured" });
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return res.status(500).json({ error: "Supabase service env not configured" });

  const { imageUrl } = (req.body ?? {}) as { imageUrl?: string };
  if (!imageUrl) return res.status(400).json({ error: "imageUrl required" });

  try {
    const url = new URL(PHOTOROOM_ENDPOINT);
    url.searchParams.set("imageUrl", imageUrl);
    url.searchParams.set("background.color", "transparent");
    url.searchParams.set("outputSize", "1500x1500");
    url.searchParams.set("padding", "0.05");

    const prRes = await fetch(url.toString(), { method: "GET", headers: { "x-api-key": PHOTOROOM_KEY, Accept: "image/png" } });
    if (!prRes.ok) {
      const text = await prRes.text();
      return res.status(prRes.status).json({ error: "Photoroom failed", detail: text.slice(0, 500) });
    }
    const buffer = Buffer.from(await prRes.arrayBuffer());
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const path = `cutouts/${crypto.randomUUID()}.png`;
    const { error: upErr } = await supabase.storage.from("pet-photos").upload(path, buffer, { contentType: "image/png", cacheControl: "31536000", upsert: false });
    if (upErr) return res.status(500).json({ error: "Cutout upload failed", detail: upErr.message });
    const { data } = supabase.storage.from("pet-photos").getPublicUrl(path);
    return res.status(200).json({ cutoutUrl: data.publicUrl, mime: "image/png" });
  } catch (err) {
    return res.status(500).json({ error: "Cutout failed", detail: (err as Error).message });
  }
}

// ─── handleComposite — sharp print master ───────────────────────────────────
function buildSvg(template: TemplateDef, transform: PetTransform, cutoutB64: string): string {
  const S = PRINT_SIZE;
  const cx = template.maskCenter.x * S;
  const cy = template.maskCenter.y * S;
  const r = template.maskRadiusFrac * S;
  const stroke = template.frameWidthFrac * S;
  const petBase = r * 2.2;
  const petW = petBase * transform.scale;
  const petH = petBase * transform.scale;
  const petCx = transform.cx * S;
  const petCy = transform.cy * S;
  const petX = petCx - petW / 2;
  const petY = petCy - petH / 2;

  let clipShape = ""; let frameShape = "";
  if (template.maskShape === "circle") {
    clipShape = `<circle cx="${cx}" cy="${cy}" r="${r}" />`;
    frameShape = `<circle cx="${cx}" cy="${cy}" r="${r}" stroke="${template.frameColor}" stroke-width="${stroke}" fill="none" />`;
  } else if (template.maskShape === "oval") {
    const rx = r * 0.85;
    clipShape = `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${r}" />`;
    frameShape = `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${r}" stroke="${template.frameColor}" stroke-width="${stroke}" fill="none" />`;
  } else if (template.maskShape === "hex") {
    const pts: string[] = [];
    for (let i = 0; i < 6; i++) { const a = (Math.PI / 3) * i; pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`); }
    const polyPts = pts.join(" ");
    clipShape = `<polygon points="${polyPts}" />`;
    frameShape = `<polygon points="${polyPts}" stroke="${template.frameColor}" stroke-width="${stroke}" fill="none" />`;
  } else {
    const w = r; const h = r * 1.18;
    const path = `M ${cx - w} ${cy - h * 0.6} L ${cx + w} ${cy - h * 0.6} L ${cx + w} ${cy + h * 0.1} Q ${cx + w} ${cy + h * 0.7} ${cx} ${cy + h} Q ${cx - w} ${cy + h * 0.7} ${cx - w} ${cy + h * 0.1} Z`;
    clipShape = `<path d="${path}" />`;
    frameShape = `<path d="${path}" stroke="${template.frameColor}" stroke-width="${stroke}" fill="none" />`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs><clipPath id="petClip">${clipShape}</clipPath></defs>
  <rect width="${S}" height="${S}" fill="${template.bgColor}" />
  <g clip-path="url(#petClip)">
    <image href="data:image/png;base64,${cutoutB64}" x="${petX}" y="${petY}" width="${petW}" height="${petH}" preserveAspectRatio="xMidYMid meet" transform="rotate(${transform.rotation} ${petCx} ${petCy})" />
  </g>
  ${frameShape}
</svg>`;
}

async function handleComposite(req: VercelRequest, res: VercelResponse) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return res.status(500).json({ error: "Supabase service env not configured" });
  const { cutoutUrl, templateId, transform } = (req.body ?? {}) as { cutoutUrl?: string; templateId?: string; transform?: PetTransform };
  if (!cutoutUrl) return res.status(400).json({ error: "cutoutUrl required" });
  const template = TEMPLATES.find((t) => t.id === templateId);
  if (!template) return res.status(400).json({ error: `Unknown templateId: ${templateId}` });
  const tf: PetTransform = transform ?? { cx: 0.5, cy: 0.5, scale: 1, rotation: 0 };

  try {
    const cRes = await fetch(cutoutUrl);
    if (!cRes.ok) return res.status(502).json({ error: "Cutout fetch failed", detail: cRes.statusText });
    const cBuf = Buffer.from(await cRes.arrayBuffer());
    const cB64 = cBuf.toString("base64");
    const svg = buildSvg(template, tf, cB64);
    const pngBuf = await sharp(Buffer.from(svg), { density: 150 }).png({ compressionLevel: 9, quality: 95 }).toBuffer();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const path = `print-masters/${crypto.randomUUID()}.png`;
    const { error: upErr } = await supabase.storage.from("pet-photos").upload(path, pngBuf, { contentType: "image/png", cacheControl: "31536000", upsert: false });
    if (upErr) return res.status(500).json({ error: "Print master upload failed", detail: upErr.message });
    const { data } = supabase.storage.from("pet-photos").getPublicUrl(path);
    return res.status(200).json({ printMasterUrl: data.publicUrl, sizePx: PRINT_SIZE });
  } catch (err) {
    return res.status(500).json({ error: "Composite failed", detail: (err as Error).message });
  }
}
