/**
 * /api/portraits — single router for the portrait actions.
 *
 *   POST /api/portraits?action=preview     legacy 6-pack one-shot
 *   POST /api/portraits?action=generate    Tier 1 Style×Theme single full-size portrait + auth + credits
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
import { checkBotId } from "botid/server";
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
import {
  runPrintPipeline,
  type PrintPipelineInput,
} from "./_lib/printPipeline.js";

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
// 1 token = 1 generation = 1 full-size portrait. Locked 2026-05-06 — replaces
// the 4-variant pack model. Customers download the single result; if they want
// alternatives they spend another token.
const TOKENS_PER_GENERATION = 1;

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
    case "printOrder":
      return handlePrintOrder(req, res);
    case "library":
      return handleLibrary(req, res);
    case "instant-signup":
      return handleInstantSignup(req, res);
    case "test-aspects":
      return handleTestAspects(req, res);
    case "printMaster":
      return handlePrintMaster(req, res);
    default:
      return res.status(400).json({ error: `Unknown action: ${action}. Valid: preview|generate|cutout|composite|mockup|printful-mockup|printOrder|library|instant-signup|test-aspects|printMaster` });
  }
}

// ─── handlePrintOrder — Phase 9 print pipeline (AuraSR + preflight + Gelato) ──
// Called by the orders/paid webhook handler (Phase 4) once the customer has
// picked a variant + size SKU. Body matches PrintPipelineInput.
async function handlePrintOrder(req: VercelRequest, res: VercelResponse) {
  const body = (req.body ?? {}) as Partial<PrintPipelineInput>;

  // Validate the required fields up-front so we surface a clear 400 instead of
  // burning AuraSR cycles on a malformed call.
  const missing: string[] = [];
  if (!body.sourceImageUrl || typeof body.sourceImageUrl !== "string") missing.push("sourceImageUrl");
  if (!body.sizeKey || typeof body.sizeKey !== "string") missing.push("sizeKey");
  if (!body.frameColor || !["black", "natural-wood", "dark-wood"].includes(body.frameColor)) missing.push("frameColor");
  if (!body.shippingAddress || typeof body.shippingAddress !== "object") missing.push("shippingAddress");
  if (!body.customerEmail || typeof body.customerEmail !== "string") missing.push("customerEmail");
  if (typeof body.shopifyOrderId !== "number") missing.push("shopifyOrderId");
  if (typeof body.shopifyLineItemId !== "number") missing.push("shopifyLineItemId");
  if (missing.length > 0) {
    return res.status(400).json({ error: "missing_or_invalid_fields", fields: missing });
  }

  try {
    const result = await runPrintPipeline(body as PrintPipelineInput);
    // Always 200 — the result itself encodes ok/!ok and the caller (webhook)
    // decides what to do (queue for manual review, retry, etc.).
    return res.status(200).json(result);
  } catch (err) {
    // The orchestrator should already have caught everything internally and
    // returned a typed result, but defend the perimeter just in case.
    return res.status(500).json({
      ok: false,
      stage: "manual_review",
      reason: `unexpected exception in pipeline: ${(err as Error).message}`,
    });
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
    cta: { label: "Try Templates instead", href: "/pawtraits/templates" },
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

// ─── handleGenerate — Tier 1 single full-size Style×Theme portrait ───────────
// Returns one image, full-size, downloadable. Customer spends 1 credit. If
// they want a different composition or re-roll, they spend another credit.
// Response shape kept as { variants: [single] } for back-compat with existing
// frontend (StudioFlow + PortraitsStudio + PortraitsTemplates) — UI cleanup
// to drop the picker is a follow-up.
interface SubjectInfo {
  species: string;
  breed?: string;
  furColor?: string;
  eyeColor?: string;
  earShape?: string;
  distinguishing?: string;
}

// Vision pre-pass — extracts the physical descriptors that get slotted LITERALLY
// into the gpt-image-2 prompt's KEEP block. Identity preservation is only as
// strong as this extraction: if breed comes back null, gpt-image-2 has nothing
// to anchor against and drifts to "generic dog matching style training data."
//
// Model: Claude Sonnet 4.5 via OpenRouter — better at structured JSON +
// specific breed identification than Gemini Flash (which the original German
// Shepherd test failed silently on, returning species:"pet"). Sonnet sees the
// image natively and is held to a strict JSON shape via response_format.
//
// VISION_MODEL env override kept for cost-sensitive A/B (e.g. swap to Gemini
// Flash if Sonnet is too expensive at scale — ~$0.003/image vs ~$0.001).
const SUBJECT_VISION_MODEL = process.env.SUBJECT_VISION_MODEL ?? 'anthropic/claude-sonnet-4.5';

// Hard ceiling on the OpenRouter Vision pre-pass. The pre-pass blocks the
// generate request — every second the model takes is a second the customer
// stares at a spinner. 5s is generous for a small JSON identification call;
// anything past that we bail to the same {species:'pet'} fallback the catch
// block returns. The bad-photo gate (isNoPetDetected) then rejects with a
// 400 BEFORE we charge a credit, so a Vision timeout is safe-by-default.
const VISION_TIMEOUT_MS = 5000;

async function extractSubject(imageUrl: string): Promise<SubjectInfo> {
  const fallback: SubjectInfo = { species: "pet" };
  if (!OPENROUTER_KEY) return fallback;

  const systemPrompt = `You are a pet-breed identification specialist. Examine the photo and return STRICT JSON describing the pet's identifiable physical features.

Return shape (every field required, use null only if you genuinely cannot tell):
{
  "species": "dog" | "cat" | "rabbit" | "bird" | "horse" | "other" | "none",
  "breed": "<specific breed name — be precise, e.g. 'German Shepherd', 'Cream French Bulldog', 'Maine Coon'. Use 'mixed breed (looks like X with Y)' if a clear cross. Set to null ONLY if species is 'none'.>",
  "furColor": "<specific descriptor: 'black saddle with tan markings', 'cream with apricot ears', 'tortoiseshell calico', 'white with grey tabby patches'. NOT just 'brown' — include patterns and markings.>",
  "eyeColor": "<'amber', 'dark brown', 'green', 'blue', 'heterochromia (one blue one green)', etc>",
  "earShape": "<'erect triangular', 'drop pendulous', 'semi-erect', 'cropped', 'folded', 'tufted', 'rose'>",
  "distinguishing": "<one short phrase capturing what makes THIS individual recognisable: 'white sock on left front paw', 'pink nose with black freckle', 'long bushy tail with white tip', 'one ear flopped'. If nothing stands out, the most prominent breed feature.>"
}

CRITICAL — bad-photo gate:
If the image does NOT show a pet (e.g. landscape, person, object, sunset, food, screenshot, blank canvas, blurred unidentifiable mass), set species: "none" and ALL other fields to null. Do NOT hallucinate a pet that isn't there. This protects the customer from being charged for a portrait of nothing.

Rules:
- Be confident on real pets. "best guess" is acceptable for breed/markings.
- Specific beats vague. "Black saddle with tan markings" not "black and tan".
- A human in the photo with no pet → species: "none". A pet held by a human → identify the pet.
- Output JSON only — no prose, no markdown fences, no commentary.`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), VISION_TIMEOUT_MS);
  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENROUTER_KEY}` },
      signal: ctrl.signal,
      body: JSON.stringify({
        model: SUBJECT_VISION_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: [
            { type: "text", text: "Identify this pet. Return the JSON shape exactly." },
            { type: "image_url", image_url: { url: imageUrl } },
          ] },
        ],
        response_format: { type: "json_object" },
        max_tokens: 300,
        temperature: 0.1,  // low temp = more consistent identification
      }),
    });
    if (!r.ok) return fallback;
    const d = await r.json() as { choices?: Array<{ message?: { content?: string } }> };
    const c = d.choices?.[0]?.message?.content;
    if (!c) return fallback;
    const cleaned = c.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
    const p = JSON.parse(cleaned) as Partial<SubjectInfo>;
    const stringOrUndef = (v: unknown): string | undefined =>
      (typeof v === 'string' && v.trim() && v.trim().toLowerCase() !== 'null') ? v.trim() : undefined;
    return {
      species: stringOrUndef(p.species) ?? "pet",
      breed: stringOrUndef(p.breed),
      furColor: stringOrUndef(p.furColor),
      eyeColor: stringOrUndef(p.eyeColor),
      earShape: stringOrUndef(p.earShape),
      distinguishing: stringOrUndef(p.distinguishing),
    };
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      console.warn('[VISION_TIMEOUT]', { imageUrl: imageUrl.slice(0, 80), timeoutMs: VISION_TIMEOUT_MS });
    }
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}

interface VariantResult { url?: string; balanceExhausted?: boolean }

// gpt-image-2 via fal.ai — image-to-image edit endpoint.
// Same FAL_KEY, no new env var, no base64 upload dance.
//
// Confirmed fal API shape (https://fal.ai/models/openai/gpt-image-2/edit/api):
//   POST https://fal.run/openai/gpt-image-2/edit
//   body:
//     prompt:      string
//     image_urls:  string[]                    (image-to-image source)
//     image_size:  preset | {width,height}     (custom must be multiples of 16, max 3840)
//     quality:     'low' | 'medium' | 'high'   (default 'high')
//     num_images:  int
//     output_format: 'png' | 'jpeg' | 'webp'   (default 'png')
//   response: { images: [{ url, width, height, content_type, file_name }] }
//
// Text rendering: gpt-image-2 renders text from the prompt natively — no
// separate parameter needed. The pet-name directive ('Render the name "Rosie"
// in serif typography along the lower margin…') goes through the same prompt
// channel and gpt-image-2 handles it ~95% reliably.
//
// Output size: custom 1024×1280 = exact 4:5, the brand canvas default.
// Matches 16×20 hero perfectly; 24×36 (2:3) crops at print time via the
// Phase 9 print pipeline.
//
// Knobs (Vercel env, optional):
//   GPT_IMAGE_FAL_MODEL  — model slug. Default 'openai/gpt-image-2/edit'.
//                          Falls back only on hard model-missing errors so a
//                          bad slug does not burn a customer's credit.
//   GPT_IMAGE_QUALITY    — 'low' | 'medium' | 'high' (default 'medium')
//   GPT_IMAGE_WIDTH      — int, default 1024
//   GPT_IMAGE_HEIGHT     — int, default 1280  (4:5)
// fal API model_id, in full. URL builder uses the model_id literally — no
// prefix games. Pass the full slug including any vendor prefix.
//
// CUSTOMER PIPELINE LOCKED ON gpt-image-2 (2026-05-07 v2 — un-rolled-back).
// Danny has empirical evidence from manual ChatGPT use that gpt-image-2 holds
// pet identity well WHEN the prompt follows OpenAI's documented Keep/Add/
// Don't-redesign structure WITH the literal breed name slotted in. The earlier
// German-Shepherd test that 60%-missed was because:
//   1. Vision pre-pass returned species:"pet" (no breed) → prompt said
//      "transform this pet" not "transform this German Shepherd"
//   2. Source was a Getty stock with watermark — degraded signal to Vision
//   3. Prompt structure was free-form, not the documented preserve-list pattern
// All three are now fixed: stronger Vision (Sonnet 4.5), Keep/Add/Don't-redesign
// prompt with breed slotted in literally, separate handling for low-signal sources.
// Brand consistency: same model used for marketing content (Codex) → customer
// canvases. fal.ai is just the rails — the model is gpt-image-2.
const GPT_IMAGE_PRIMARY_MODEL = process.env.GPT_IMAGE_FAL_MODEL ?? 'openai/gpt-image-2/edit';
const GPT_IMAGE_FALLBACK_MODEL = 'fal-ai/flux-pro/kontext'; // soft fallback only on hard 404 / model-missing
const GPT_IMAGE_QUALITY = (process.env.GPT_IMAGE_QUALITY ?? 'medium') as 'low' | 'medium' | 'high';
const GPT_IMAGE_WIDTH = Number(process.env.GPT_IMAGE_WIDTH ?? 1024);
const GPT_IMAGE_HEIGHT = Number(process.env.GPT_IMAGE_HEIGHT ?? 1280);

// 90s ceiling on the fal.run gpt-image-2 call. fal usually returns a 1024×1280
// image in 8–25s; a hung request past 90s means the upstream worker died and
// our credit will burn while the customer sees a spinner forever. On abort we
// surface a non-OK Response-like via a thrown sentinel so generateVariant
// can map it to {} → handleGenerate refunds via the standard path.
const FAL_TIMEOUT_MS = 90_000;

async function callGptImage(model: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<{ res: Response; bodyText: string | null }> {
  const r = await fetch(`https://fal.run/${model}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Key ${FAL_KEY}` },
    signal,
    body: JSON.stringify(body),
  });
  if (r.ok) return { res: r, bodyText: null };
  const text = await r.text();
  return { res: r, bodyText: text };
}

// generateVariant now accepts EITHER a single imageUrl (legacy single-pet
// path) OR an array of imageUrls (multi-pet path — gpt-image-2 blends across
// up to 16 reference images per call). Callers pass exactly one of the two.
// The optional `imageSize` override lets the printMaster endpoint hand in
// print-grade dims (e.g. 2048×2560) without polluting the customer-facing
// preview default of 1024×1280.
async function generateVariant(args: {
  imageUrl?: string;
  imageUrls?: string[];
  prompt: string;
  negative?: string;
  imageSize?: { width: number; height: number };
}): Promise<VariantResult> {
  // Negatives fold into the prompt — gpt-image has no separate negative slot.
  const fullPrompt = args.negative
    ? `${args.prompt}\n\nAvoid: ${args.negative}.`
    : args.prompt;

  const photos = args.imageUrls && args.imageUrls.length > 0
    ? args.imageUrls
    : args.imageUrl
      ? [args.imageUrl]
      : [];
  if (photos.length === 0) {
    return {};
  }

  const size = args.imageSize ?? { width: GPT_IMAGE_WIDTH, height: GPT_IMAGE_HEIGHT };

  const requestBody = {
    prompt: fullPrompt,
    image_urls: photos,
    image_size: size,
    quality: GPT_IMAGE_QUALITY,
    num_images: 1,
    output_format: 'png',
  };

  // 90s AbortController — see FAL_TIMEOUT_MS. On timeout we return {} so
  // handleGenerate's existing failure path refunds the credit (now wrapped in
  // safeRefund from #8.1, so a refund-RPC failure also gets logged).
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FAL_TIMEOUT_MS);
  try {
    // Try the primary model first. If fal returns 404 (model not found / slug
    // wrong) OR 400 with an unknown-model signal, soft-fallback so a bad slug
    // does not burn the customer's credit.
    let { res: r, bodyText } = await callGptImage(GPT_IMAGE_PRIMARY_MODEL, requestBody, ctrl.signal);

    if (!r.ok) {
      const looksLikeModelMissing = r.status === 404 ||
        (r.status === 400 && /model|not.*found|unknown/i.test(bodyText ?? ''));
      if (looksLikeModelMissing && GPT_IMAGE_PRIMARY_MODEL !== GPT_IMAGE_FALLBACK_MODEL) {
        console.warn(`[generate] primary model ${GPT_IMAGE_PRIMARY_MODEL} unavailable (${r.status}), falling back to ${GPT_IMAGE_FALLBACK_MODEL}`);
        ({ res: r, bodyText } = await callGptImage(GPT_IMAGE_FALLBACK_MODEL, requestBody, ctrl.signal));
      }
    }

    if (!r.ok) {
      // bodyText was already consumed inside callGptImage on non-OK; reuse it.
      const text = bodyText ?? '';
      if (isFalBalanceExhausted(text)) return { balanceExhausted: true };
      return {};
    }
    const d = (await r.json()) as KontextResponse;
    return { url: d.images?.[0]?.url };
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      console.warn('[FAL_TIMEOUT]', { timeoutMs: FAL_TIMEOUT_MS, model: GPT_IMAGE_PRIMARY_MODEL });
    } else {
      console.error('[generateVariant] threw:', (err as Error).message);
    }
    return {};
  } finally {
    clearTimeout(timer);
  }
}

// Sanitise a single pet name → on-canvas typography. Letters / numbers / space
// / hyphen / apostrophe only (covers "O'Connor", "Mary Jane"; drops "Mr.").
// Cap at 24 chars — anything longer doesn't render legibly along a canvas margin.
function sanitisePetName(raw: string): string {
  return raw.replace(/[^\p{L}\p{N} '-]/gu, "").trim().slice(0, 24);
}

// Build the per-pet KEEP block — the line that gets slotted into the prompt
// for one specific pet. Same shape used by single-pet, multi-pet, and the
// printMaster endpoint, so we extract it here to keep them in lock-step.
function buildPetKeepLine(args: {
  index: number;       // 0-based; only used for "Pet N" prefix when totalPets > 1
  totalPets: number;   // 1 = single-pet path, omits the "Pet N" prefix
  name?: string;       // sanitised pet name, optional
  subject: SubjectInfo;
}): string {
  const { index, totalPets, name, subject } = args;

  if (totalPets === 1) {
    // Single-pet path keeps the LEGACY phrasing exactly — empirically tuned,
    // verified against the German Shepherd test on 2026-05-07. Do NOT change
    // the wording without re-running the breed-retention smoke test.
    const keeps: string[] = [];
    if (subject.breed) keeps.push(`the ${subject.breed} silhouette and breed characteristics`);
    if (subject.furColor) keeps.push(`${subject.furColor} fur pattern`);
    if (subject.eyeColor) keeps.push(`${subject.eyeColor} eyes`);
    if (subject.earShape) keeps.push(`${subject.earShape} ear shape`);
    if (subject.distinguishing) keeps.push(subject.distinguishing);
    const keepLine = keeps.length > 0
      ? `Specifically preserve: ${keeps.join(', ')}.`
      : '';
    return [
      `Use the exact pet shown in the source image. Preserve their breed, markings, fur pattern, eye colour, ear shape, and all unique features exactly as they appear in the photo. Do not change the breed. Do not invent new features. Do not redesign the pet.`,
      `The source image is the ground truth: if any listed descriptor conflicts with the visible pet, follow the source image.`,
      keepLine,
    ].filter(Boolean).join('\n');
  }

  // Multi-pet — one labelled block per pet so the model can map text → image.
  // The "Pet N" prefix is the bridge: it tells gpt-image-2 which source image
  // each KEEP block describes (image_urls[0] = Pet 1, image_urls[1] = Pet 2, …).
  const keeps: string[] = [];
  if (subject.breed) keeps.push(`a ${subject.breed}`);
  if (subject.furColor) keeps.push(`${subject.furColor} fur`);
  if (subject.eyeColor) keeps.push(`${subject.eyeColor} eyes`);
  if (subject.earShape) keeps.push(`${subject.earShape} ears`);
  if (subject.distinguishing) keeps.push(subject.distinguishing);
  const preserve = keeps.length > 0
    ? `Specifically preserve: ${keeps.join(', ')}.`
    : '';
  const breedClause = subject.breed ? `a ${subject.breed}` : 'this pet';
  const namedClause = name ? ` (named "${name}")` : '';
  return `Pet ${index + 1}${namedClause}: ${breedClause}. ${preserve}`.trim();
}

// Build the full multi-pet prompt — one KEEP block per pet, shared by both
// handleGenerate(multi) and handlePrintMaster.
function buildMultiPetCustomPrompt(args: {
  subjects: SubjectInfo[];
  names: string[];
  customPrompt: string;
  aspectInstruction?: string;  // override the "vertical 4:5" line for non-4:5 print masters
}): string {
  const { subjects, names, customPrompt, aspectInstruction } = args;
  const N = subjects.length;
  const keepBlocks = subjects.map((subject, i) =>
    buildPetKeepLine({ index: i, totalPets: N, name: names[i], subject })
  );

  // Name typography line — only render names that were actually supplied.
  const namedNames = names.map((n, i) => ({ name: n, index: i })).filter(x => x.name.length > 0);
  let nameLine = '';
  if (namedNames.length === N && N > 1) {
    const joined = namedNames.map(x => `"${x.name}"`).join(' and ');
    nameLine = `Render the names ${joined} in elegant clean serif typography along the lower margin of the canvas, each name beneath its respective pet, readable, no spelling errors, no other text on the canvas.`;
  } else if (namedNames.length === 1 && N === 1) {
    nameLine = `Render the name "${namedNames[0].name}" in elegant clean serif typography along the lower margin of the canvas, centered, readable, no spelling errors, no other text on the canvas.`;
  } else if (namedNames.length > 0 && N > 1) {
    // Partial naming — render only the supplied names against their pets.
    const joined = namedNames.map(x => `"${x.name}" beneath Pet ${x.index + 1}`).join(', ');
    nameLine = `Render ${joined} in elegant clean serif typography along the lower margin of the canvas, readable, no spelling errors, no other text on the canvas.`;
  }

  const togetherLine = N > 1
    ? `Use the exact pets shown across the source images. Create a single canvas portrait featuring all ${N} pets together in one cohesive composition. Preserve each pet's breed, markings, fur pattern, eye colour, ear shape, and all unique features exactly as they appear in their respective source photo. The source images are the ground truth: if any listed descriptor conflicts with the visible pet, follow the source image. Do not swap features between pets. Do not invent new features. Do not redesign any pet.`
    : '';  // single-pet path uses the keep block's preamble instead

  const aspect = aspectInstruction
    ?? `Output: vertical 4:5 canvas composition, painterly cinematic finish, premium polish for framed wall art.`;

  const parts = [
    togetherLine,
    ...keepBlocks,
    ``,
    `Apply this artistic transformation: ${customPrompt}.`,
    ``,
    `For transformations that include headwear (hat, helmet, hood, crown, costume covering the head), render the headwear naturally OVER the head — ears should be tucked under or hidden by the headwear if it covers that area. Do NOT draw ears poking through fabric, helmet metal, or costume material.`,
    ``,
    nameLine,
    ``,
    aspect,
  ];
  return parts.filter(p => p !== '').join('\n');
}

// Wraps a grant_credits refund call. The customer paid for a generation that
// failed; if the refund itself drops on the floor (RPC error, transient DB
// hiccup) we log to credit_refund_failures so a sweeper can retry. Never
// throws — the caller already has a customer-facing failure to return.
async function safeRefund(args: {
  supabase: ReturnType<typeof getSupabaseAdmin>;
  accountId: string;
  tokens: number;
  reason: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { supabase, accountId, tokens, reason, metadata } = args;
  try {
    const { error } = await supabase.rpc("grant_credits", {
      p_account_id: accountId,
      p_tokens: tokens,
      p_reason: "refund",
      p_metadata: { detail: reason, ...(metadata ?? {}) },
    });
    if (error) {
      console.error('[REFUND_FAILED]', { accountId, tokens, reason, error: error.message });
      const { error: logErr } = await supabase
        .from('credit_refund_failures')
        .insert({ account_id: accountId, tokens, reason, error_detail: error.message });
      if (logErr) {
        // Last-ditch: even the audit insert failed. Surface in logs so a human
        // can manually reconcile from request logs.
        console.error('[REFUND_LOG_FAILED]', { accountId, tokens, reason, originalError: error.message, logError: logErr.message });
      }
    }
  } catch (err) {
    const msg = (err as Error).message;
    console.error('[REFUND_THREW]', { accountId, tokens, reason, error: msg });
    try {
      await supabase
        .from('credit_refund_failures')
        .insert({ account_id: accountId, tokens, reason, error_detail: `threw: ${msg}` });
    } catch (logErr) {
      console.error('[REFUND_LOG_THREW]', { accountId, tokens, reason, error: (logErr as Error).message });
    }
  }
}

// A photo's vision result counts as "no pet detected" if either the model
// flagged species: 'none' OR fell back to the bare {species:'pet'} default
// (i.e. the call failed / got no signal). We treat both as "do not charge."
// LIMITATION: the default fallback also fires when OPENROUTER_KEY is absent
// or the call hit a transient error. That's fine — we'd rather refuse than
// burn a credit on a blind generation.
function isNoPetDetected(subject: SubjectInfo): boolean {
  if (subject.species === 'none') return true;
  // species === 'pet' with no breed = the fallback shape; vision didn't
  // confidently identify anything pet-shaped. Don't proceed without a breed
  // anchor — gpt-image-2 drifts to "generic dog matching style training data".
  if (subject.species === 'pet' && !subject.breed) return true;
  return false;
}

async function handleGenerate(req: VercelRequest, res: VercelResponse) {
  if (!FAL_KEY) return res.status(500).json({ error: "FAL_KEY not configured" });
  // Body now accepts EITHER:
  //   - legacy single-pet shape: { imageUrl, petName?, ... }
  //   - new multi-pet shape:     { imageUrls[], petNames?[], ... }
  // We normalise to internal photos[] / names[] arrays. Single-pet path stays
  // 100% back-compat — existing customers calling with imageUrl + petName get
  // identical behaviour and identical response shape.
  const body = (req.body ?? {}) as {
    imageUrl?: string;
    imageUrls?: string[];
    styleId?: string;
    themeId?: string;
    addDetails?: string;
    customPrompt?: string;
    petName?: string;
    petNames?: string[];
  };
  const { styleId, themeId } = body;
  const addDetails = sanitiseAddDetails(body.addDetails ?? "");
  // sanitiseAddDetails already caps at 200 chars — the legacy .slice(0, 400)
  // here was dead code (200 < 400). Removed 2026-05-08.
  const customPrompt = sanitiseAddDetails(body.customPrompt ?? "");

  // ── Normalise to photos[] / names[] ─────────────────────────────────────
  // Multi-pet path activates if imageUrls is a non-empty array. Otherwise we
  // fall back to legacy imageUrl. We never mix the two — caller picks one.
  const isMultiPet = Array.isArray(body.imageUrls) && body.imageUrls.length > 0;
  const photos: string[] = isMultiPet
    ? body.imageUrls!.filter((u): u is string => typeof u === 'string' && u.length > 0)
    : (body.imageUrl ? [body.imageUrl] : []);
  if (photos.length === 0) {
    return res.status(400).json({ error: "imageUrl or imageUrls required" });
  }
  if (photos.length > 4) {
    return res.status(400).json({ error: "max_pets_exceeded", message: "Pawtraits supports up to 4 pets per portrait. Please remove some photos." });
  }
  // Names array — same length as photos[]; missing entries become empty string.
  const rawNames: string[] = isMultiPet
    ? (Array.isArray(body.petNames) ? body.petNames.map(n => typeof n === 'string' ? n : '') : [])
    : (body.petName ? [body.petName] : []);
  const names: string[] = photos.map((_, i) => sanitisePetName(rawNames[i] ?? ''));

  // Either freeform customPrompt OR (styleId + themeId) is required.
  // NOTE: multi-pet path REQUIRES customPrompt — the Style×Theme builder is
  // single-pet only. That's fine for now; multi-pet is the freeform path only.
  const usingCustomPrompt = customPrompt.length > 0;
  if (!usingCustomPrompt) {
    if (isMultiPet) {
      return res.status(400).json({ error: "customPrompt required for multi-pet portraits" });
    }
    if (!styleId) return res.status(400).json({ error: "styleId required (or send customPrompt)" });
    if (!themeId) return res.status(400).json({ error: "themeId required (or send customPrompt)" });
  }

  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Sign in to generate", cta: { label: "Sign in or sign up", href: "/auth?next=/pawtraits/studio" } });
  }
  const token = auth.slice("Bearer ".length);
  const supabase = getSupabaseAdmin();
  const { data: userRes, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userRes.user) return res.status(401).json({ error: "Invalid token" });
  const userId = userRes.user.id;

  // ── Vision pre-pass — BEFORE consuming credits ──────────────────────────
  // Empirical proof (2026-05-07):
  //   With Vision    → 5/5 correct breed on German Shepherd test
  //   Without Vision → 0/4 correct breed on same German Shepherd
  // gpt-image-2 via fal.ai needs the breed named explicitly in text — the
  // ChatGPT app does this with an invisible Vision pre-pass; we replicate it.
  // We now ALSO run vision before the credit consume so that a non-pet upload
  // (landscape, sunset, blank canvas) NEVER gets charged. See task B in
  // research-2026-05-07-identity-preservation.md.
  // Env knob USE_SUBJECT_VISION=false disables for A/B — NOT recommended.
  const useVision = process.env.USE_SUBJECT_VISION !== 'false';
  const subjects: SubjectInfo[] = useVision
    ? await Promise.all(photos.map((url) => extractSubject(url)))
    : photos.map(() => ({ species: 'pet' } as SubjectInfo));

  // Bad-photo gate — if ANY photo isn't a pet, refuse before charging.
  for (let i = 0; i < subjects.length; i++) {
    if (isNoPetDetected(subjects[i])) {
      return res.status(400).json({
        error: 'no_pet_detected',
        petIndex: i,
        message: photos.length === 1
          ? `That photo doesn't appear to show a pet — please re-upload a clear shot of your pet's face.`
          : `Photo ${i + 1} doesn't appear to show a pet — please re-upload that one.`,
      });
    }
  }

  // ── Credit consume — only after vision passes ──────────────────────────
  // Multi-pet portraits cost the same as single-pet (1 credit). We're charging
  // for the FINISHED PORTRAIT, not the per-pet identification work. If we ever
  // want per-pet pricing it'd live as TOKENS_PER_PET * photos.length here.
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

  const baseNegative = "low quality, distorted, deformed, plastic, cartoon glitches, blurry, weird anatomy, watermark";
  const anyName = names.some(n => n.length > 0);
  const negativeWithName = anyName
    ? `${baseNegative}, misspelled text, garbled letters, illegible typography, gibberish text, multiple names${photos.length > 1 ? ', merged pets, blended pets, hybrid pet, fused features' : ''}`
    : `${baseNegative}, text overlay${photos.length > 1 ? ', merged pets, blended pets, hybrid pet, fused features' : ''}`;

  let promptDef: { prompt: string; negative: string; compositionId: string };

  if (usingCustomPrompt) {
    // Photo-anchored AND text-reinforced. The photo(s) are ground truth;
    // Vision-extracted descriptors slot into a Keep-list to give the model
    // explicit text anchors that match what's in each image.
    const prompt = buildMultiPetCustomPrompt({
      subjects,
      names,
      customPrompt,
    });
    promptDef = { prompt, negative: negativeWithName, compositionId: COMPOSITIONS[0].id };
  } else {
    // Style×Theme path — single-pet only (guarded above). subjects[0] is the
    // only pet and its descriptors fold into the canonical buildPrompt.
    const subject = subjects[0];
    const built = buildPrompt({
      species: subject.species,
      breed: subject.breed,
      furColor: subject.furColor,
      eyeColor: subject.eyeColor,
      earShape: subject.earShape,
      distinguishing: subject.distinguishing,
      styleId: styleId!, themeId: themeId!, addDetails, petName: names[0] ?? '', compositionIdx: 0,
    } satisfies BuildPromptInput);
    if (!built) return res.status(400).json({ error: "Unknown styleId or themeId" });
    promptDef = { ...built, compositionId: COMPOSITIONS[0].id };
  }

  try {
    // Send ALL photos to gpt-image-2 in a single call. Multi-image input is
    // a documented gpt-image-2 capability (image_urls accepts up to 16);
    // verified for our use case in research-2026-05-07-identity-preservation.md.
    const result = await generateVariant({
      imageUrls: photos,
      prompt: promptDef.prompt,
      negative: promptDef.negative,
    });

    if (result.balanceExhausted) {
      await safeRefund({ supabase, accountId: userId, tokens: TOKENS_PER_GENERATION, reason: "fal-balance-exhausted" });
      return balancePausedResponse(res);
    }

    if (!result.url) {
      await safeRefund({ supabase, accountId: userId, tokens: TOKENS_PER_GENERATION, reason: "generation-failed" });
      return res.status(502).json({ error: "Generation failed (credit refunded)" });
    }

    const variants = [{ url: result.url, composition: promptDef.compositionId }];
    // Response shape:
    //   variants:  [{ url, composition }]            — same as before
    //   subject:   first pet's SubjectInfo            — back-compat with single-pet UI
    //   subjects:  [SubjectInfo, ...]                 — NEW: full per-pet array
    //   prompts:   [fullPrompt]                       — same as before
    return res.status(200).json({
      variants,
      subject: subjects[0],
      subjects,
      prompts: [promptDef.prompt],
    });
  } catch (err) {
    await safeRefund({
      supabase,
      accountId: userId,
      tokens: TOKENS_PER_GENERATION,
      reason: "exception",
      metadata: { error: (err as Error).message },
    });
    return res.status(500).json({ error: "Generation failed (credit refunded)", detail: (err as Error).message });
  }
}

// ─── handleCutout — Photoroom primary, HuggingFace BRIA RMBG fallback ──────
// Photoroom is best quality ($0.02/call) but the trial plan can exhaust.
// HuggingFace Inference API for `briaai/RMBG-1.4` is free (rate-limited)
// and ships an image-in/image-out endpoint that takes raw bytes.
const HF_TOKEN = process.env.HUGGINGFACE_API_KEY ?? process.env.HF_TOKEN ?? "";
const HF_RMBG_ENDPOINT = "https://api-inference.huggingface.co/models/briaai/RMBG-1.4";

async function tryPhotoroom(imageUrl: string): Promise<Buffer | null> {
  if (!PHOTOROOM_KEY) return null;
  try {
    const url = new URL(PHOTOROOM_ENDPOINT);
    url.searchParams.set("imageUrl", imageUrl);
    url.searchParams.set("background.color", "transparent");
    url.searchParams.set("outputSize", "1500x1500");
    url.searchParams.set("padding", "0.05");
    const r = await fetch(url.toString(), { method: "GET", headers: { "x-api-key": PHOTOROOM_KEY, Accept: "image/png" } });
    if (!r.ok) return null;
    return Buffer.from(await r.arrayBuffer());
  } catch { return null; }
}

async function tryHfRmbg(imageUrl: string): Promise<Buffer | null> {
  try {
    // Fetch the source image bytes
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return null;
    const imgBuf = Buffer.from(await imgRes.arrayBuffer());

    // POST raw bytes to HF Inference API. Free anonymous tier works at low volume;
    // adding HUGGINGFACE_API_KEY gives generous limits.
    const headers: Record<string, string> = { "Content-Type": "application/octet-stream", Accept: "image/png" };
    if (HF_TOKEN) headers["Authorization"] = `Bearer ${HF_TOKEN}`;

    // Cold-start retry: HF returns 503 with `estimated_time` while warming.
    for (let attempt = 0; attempt < 3; attempt++) {
      const r = await fetch(HF_RMBG_ENDPOINT, { method: "POST", headers, body: imgBuf });
      if (r.ok) return Buffer.from(await r.arrayBuffer());
      if (r.status === 503) {
        const waitMs = 4000;
        await new Promise(rs => setTimeout(rs, waitMs));
        continue;
      }
      return null;
    }
    return null;
  } catch { return null; }
}

async function handleCutout(req: VercelRequest, res: VercelResponse) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return res.status(500).json({ error: "Supabase service env not configured" });

  const { imageUrl } = (req.body ?? {}) as { imageUrl?: string };
  if (!imageUrl) return res.status(400).json({ error: "imageUrl required" });

  try {
    // Try Photoroom first (highest quality), then HuggingFace BRIA RMBG (free).
    let buffer = await tryPhotoroom(imageUrl);
    let provider = "photoroom";
    if (!buffer) {
      buffer = await tryHfRmbg(imageUrl);
      provider = "huggingface";
    }
    if (!buffer) {
      return res.status(502).json({ error: "All cutout providers failed (photoroom + huggingface)" });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const path = `cutouts/${crypto.randomUUID()}.png`;
    const { error: upErr } = await supabase.storage.from("pet-photos").upload(path, buffer, { contentType: "image/png", cacheControl: "31536000", upsert: false });
    if (upErr) return res.status(500).json({ error: "Cutout upload failed", detail: upErr.message });
    const { data } = supabase.storage.from("pet-photos").getPublicUrl(path);
    return res.status(200).json({ cutoutUrl: data.publicUrl, mime: "image/png", provider });
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

// ─── handleLibrary — Pawtraits content library router ───────────────────────
// Single endpoint, body-dispatched on `op` so the Hobby-plan 12-function cap
// stays intact. Used by:
//   - Maker (Codex CLI / n8n / scripts/library/maker.ts) → op:"insert"
//   - Filer (manual / cron QA pass)                       → op:"approve" | "reject"
//   - Poster (n8n per-platform crons)                     → op:"list" → op:"logPost"
//   - Public gallery page (later)                         → op:"gallery"
//
// Auth: requires `x-library-secret` header matching env LIBRARY_API_SECRET for
// any write op. Reads (list/gallery/get) are open so the gallery page works
// without leaking the secret to the browser.
type LibraryRow = {
  id?: string;
  pet_kind: 'dog' | 'cat' | 'small-pet' | 'other';
  breed: string;
  pet_name?: string | null;
  image_style: 'portrait' | 'scene';
  art_style: string;
  home_setting?: string | null;
  pet_action?: string | null;
  canvas_format?: string | null;
  aspect_ratio: string;
  prompt: string;
  negative_prompt?: string | null;
  backstory?: string | null;
  story_long?: string | null;
  captions?: Record<string, unknown>;
  image_path: string;
  image_url: string;
  thumbnail_path?: string | null;
  thumbnail_url?: string | null;
  width: number;
  height: number;
  quality_score?: number | null;
  quality_notes?: string | null;
  approved?: boolean;
  generated_by?: string | null;
  generation_model?: string | null;
  generation_cost_usd?: number | null;
};

const LIBRARY_API_SECRET = process.env.LIBRARY_API_SECRET;

function libraryAuthOk(req: VercelRequest): boolean {
  if (!LIBRARY_API_SECRET) return false;
  const got = req.headers['x-library-secret'];
  return typeof got === 'string' && got === LIBRARY_API_SECRET;
}

async function handleLibrary(req: VercelRequest, res: VercelResponse) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(503).json({ error: 'supabase-not-configured' });
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const body = (req.body ?? {}) as { op?: string; [k: string]: unknown };
  const op = String(body.op ?? '');

  // ── reads (no auth) ──
  if (op === 'list') {
    // List approved rows that have NOT been successfully posted to {platform}.
    // Optional filters: pet_kind, image_style, breed, art_style, limit.
    const platform = String(body.platform ?? '').trim();
    if (!platform) return res.status(400).json({ error: 'platform required' });
    const limit = Math.min(Number(body.limit ?? 1) || 1, 50);

    // Filter shape
    const filters: Record<string, string> = {};
    if (body.pet_kind) filters.pet_kind = String(body.pet_kind);
    if (body.image_style) filters.image_style = String(body.image_style);
    if (body.breed) filters.breed = String(body.breed);
    if (body.art_style) filters.art_style = String(body.art_style);

    // Get the approved candidates, then exclude the ones already posted
    // successfully on this platform. Two queries — small data set, simpler than
    // a single LEFT JOIN with PostgREST.
    const { data: posted, error: pErr } = await supabase
      .from('pawtrait_post_log')
      .select('library_id')
      .eq('platform', platform)
      .eq('status', 'success');
    if (pErr) return res.status(500).json({ error: 'post_log_query_failed', detail: pErr.message });
    const postedIds = new Set((posted ?? []).map((r: { library_id: string }) => r.library_id));

    let q = supabase
      .from('pawtrait_library')
      .select('*')
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(limit + postedIds.size + 10);
    for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);

    const { data: rows, error } = await q;
    if (error) return res.status(500).json({ error: 'list_failed', detail: error.message });
    const filtered = (rows ?? []).filter((r: { id: string }) => !postedIds.has(r.id)).slice(0, limit);
    return res.status(200).json({ rows: filtered, count: filtered.length });
  }

  if (op === 'get') {
    const id = String(body.id ?? '');
    if (!id) return res.status(400).json({ error: 'id required' });
    const { data, error } = await supabase
      .from('pawtrait_library')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) return res.status(500).json({ error: 'get_failed', detail: error.message });
    if (!data) return res.status(404).json({ error: 'not_found' });
    return res.status(200).json({ row: data });
  }

  if (op === 'gallery') {
    // Public gallery feed. Strips prompts, returns thumbs + captions.
    // Optional filters: image_style ('portrait' / 'scene'), pet_kind, breed, art_style.
    const limit = Math.min(Number(body.limit ?? 24) || 24, 60);
    const offset = Math.max(Number(body.offset ?? 0) || 0, 0);
    let q = supabase
      .from('pawtrait_library')
      .select('id,pet_kind,breed,pet_name,image_style,art_style,aspect_ratio,backstory,image_url,thumbnail_url,width,height,created_at')
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    for (const k of ['image_style', 'pet_kind', 'breed', 'art_style'] as const) {
      const v = body[k];
      if (typeof v === 'string' && v) q = q.eq(k, v);
    }
    const { data, error } = await q;
    if (error) return res.status(500).json({ error: 'gallery_failed', detail: error.message });
    return res.status(200).json({ rows: data ?? [] });
  }

  // ── writes (auth required) ──
  if (!libraryAuthOk(req)) return res.status(401).json({ error: 'unauthorised' });

  if (op === 'insert') {
    const row = body.row as Partial<LibraryRow> | undefined;
    if (!row) return res.status(400).json({ error: 'row required' });
    const required: (keyof LibraryRow)[] = [
      'pet_kind','breed','image_style','art_style','aspect_ratio',
      'prompt','image_path','image_url','width','height',
    ];
    for (const k of required) {
      if (row[k] === undefined || row[k] === null || row[k] === '') {
        return res.status(400).json({ error: `field required: ${k}` });
      }
    }
    const { data, error } = await supabase
      .from('pawtrait_library')
      .insert(row)
      .select('*')
      .single();
    if (error) return res.status(500).json({ error: 'insert_failed', detail: error.message });
    return res.status(200).json({ row: data });
  }

  if (op === 'approve') {
    const id = String(body.id ?? '');
    if (!id) return res.status(400).json({ error: 'id required' });
    const updates: Record<string, unknown> = {
      approved: true,
      approved_at: new Date().toISOString(),
    };
    if (body.quality_score !== undefined) updates.quality_score = Number(body.quality_score);
    if (body.quality_notes !== undefined) updates.quality_notes = String(body.quality_notes);
    const { data, error } = await supabase
      .from('pawtrait_library')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();
    if (error) return res.status(500).json({ error: 'approve_failed', detail: error.message });
    return res.status(200).json({ row: data });
  }

  if (op === 'reject') {
    const id = String(body.id ?? '');
    if (!id) return res.status(400).json({ error: 'id required' });
    const updates: Record<string, unknown> = {
      approved: false,
      quality_notes: body.quality_notes ?? 'rejected by Filer',
    };
    if (body.quality_score !== undefined) updates.quality_score = Number(body.quality_score);
    const { data, error } = await supabase
      .from('pawtrait_library')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();
    if (error) return res.status(500).json({ error: 'reject_failed', detail: error.message });
    return res.status(200).json({ row: data });
  }

  if (op === 'logPost') {
    // Poster calls this immediately after a Blotato (or other platform) post
    // attempt. status:'success' makes the row count as "used" on that platform.
    const library_id = String(body.library_id ?? '');
    const platform = String(body.platform ?? '');
    const status = String(body.status ?? '');
    if (!library_id || !platform || !['queued','success','failed'].includes(status)) {
      return res.status(400).json({ error: 'library_id, platform, status (queued|success|failed) required' });
    }
    const insert: Record<string, unknown> = { library_id, platform, status };
    if (body.account) insert.account = String(body.account);
    if (body.post_url) insert.post_url = String(body.post_url);
    if (body.post_id) insert.post_id = String(body.post_id);
    if (body.error_text) insert.error_text = String(body.error_text);
    if (body.metadata) insert.metadata = body.metadata;
    const { data, error } = await supabase
      .from('pawtrait_post_log')
      .insert(insert)
      .select('*')
      .single();
    if (error) return res.status(500).json({ error: 'log_failed', detail: error.message });
    return res.status(200).json({ row: data });
  }

  return res.status(400).json({ error: `unknown op: ${op}. Valid: list|get|gallery|insert|approve|reject|logPost` });
}

// ─── handleInstantSignup — passwordless, no-OTP signup ──────────────────────
// Body: { email, visitorId?, honeypot? }
//
// Defense stack — all silent, none ever block a real human:
//   1. Vercel BotID (Kasada-powered). Invisible client challenge, no CAPTCHA,
//      no IP-reputation heuristics — so VPN / iCloud Private Relay / Brave /
//      mobile CGNAT users are NOT punished. Recommended by OWASP OAT-019.
//   2. Honeypot field. Real browsers don't fill hidden inputs; bots do.
//   3. Per-IP rate limit (paranoid backstop only — set high enough that no
//      legitimate shared-network spike could trip it).
//   4. Server-side email format check + client-side disposable-domain check.
//   5. Existing DB triggers handle email-alias dedup (Gmail dot/plus, etc.)
//      and device-fingerprint dedup via the visitor_id we forward to
//      raw_user_meta_data — same browser can't farm unlimited free trials.
//
// Flow:
//   - New email → admin createUser with email_confirm:true + visitor_id, then
//     issue a single-use magic-link OTP and return it. Client calls
//     supabase.auth.verifyOtp() locally to establish the session. User is
//     signed in immediately, no email click.
//   - Existing email → return { status: 'exists' } so the client routes to
//     /auth and requests an OTP code (proves account ownership; we never
//     auto-sign-in someone else's email).
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Generous backstop. iCloud Private Relay / NordVPN / mobile CGNAT can put
// 50+ unrelated real users on one egress IP. BotID is the primary defense;
// this just stops a single IP from making 1000 accounts in an hour if BotID
// has a lapse. Per-hour, not per-minute, on purpose.
const SIGNUP_RATE_LIMIT_PER_HOUR = 60;

async function checkSignupRateLimit(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  identifier: string,
): Promise<{ ok: boolean }> {
  // Window: last hour. Fail-open on infra errors so a flaky DB doesn't
  // block real users — the other defense layers still apply.
  const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  try {
    const { count, error } = await supabaseAdmin
      .from('rate_limits')
      .select('id', { count: 'exact', head: true })
      .eq('endpoint', 'instant-signup')
      .eq('identifier', identifier)
      .gte('created_at', windowStart);
    if (error) {
      console.error('[instant-signup] rate-limit lookup failed:', error.message);
      return { ok: true };
    }
    if ((count ?? 0) >= SIGNUP_RATE_LIMIT_PER_HOUR) return { ok: false };
    await supabaseAdmin
      .from('rate_limits')
      .insert({ endpoint: 'instant-signup', identifier });
    return { ok: true };
  } catch (err) {
    console.error('[instant-signup] rate-limit threw:', (err as Error).message);
    return { ok: true };
  }
}

async function handleInstantSignup(req: VercelRequest, res: VercelResponse) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(503).json({ error: 'supabase-not-configured' });
  }

  // Vercel BotID — invisible Kasada-powered bot detection. Free Basic tier
  // returns isBot:true only on confirmed bot signatures (challenge missing /
  // tampered / known automation patterns). Real users — including those on
  // VPN, iCloud Private Relay, Brave, Tor, ad-blockers — pass without ever
  // seeing a challenge.
  //
  // LOG-ONLY (not a hard gate): in production we observed checkBotId()
  // returning isBot:true for real customers (Gmail, Proton). Most likely
  // cause is the silent challenge hasn't completed before form submit —
  // fast typers, slow networks, privacy extensions, or users who arrive
  // directly at the modal before the BotID script finished initialising
  // all fail the integrity check even though they're human.
  //
  // We still capture the signal for log analysis. The real moat is the
  // other layers: honeypot, email-alias + device-fingerprint dedup in the
  // DB trigger, and the lenient IP rate-limit backstop. May tighten back
  // to a hard gate once we have real-world false-positive data.
  try {
    const verification = await checkBotId();
    if (verification.isBot) {
      console.warn('[instant-signup] BotID flagged isBot=true (logging only, not blocking)');
    }
  } catch (err) {
    console.error('[instant-signup] checkBotId failed:', (err as Error).message);
  }

  const body = (req.body ?? {}) as {
    email?: string;
    visitorId?: string;
    honeypot?: string;
  };
  const email = String(body.email ?? '').trim().toLowerCase();
  const visitorId = String(body.visitorId ?? '').trim().slice(0, 128) || null;
  const honeypot = String(body.honeypot ?? '');

  // Honeypot: bots auto-fill hidden inputs; humans never see them.
  // Generic error so a bot can't tell it was caught.
  if (honeypot.length > 0) {
    return res.status(400).json({ error: 'invalid_request' });
  }

  if (!email || !EMAIL_RX.test(email)) {
    return res.status(400).json({ error: 'invalid_email' });
  }

  const supabaseAdmin = getSupabaseAdmin();

  // Per-IP rate limit. Vercel forwards the real client IP in x-forwarded-for.
  const fwd = req.headers['x-forwarded-for'];
  const remoteIp = typeof fwd === 'string'
    ? fwd.split(',')[0].trim()
    : Array.isArray(fwd) ? fwd[0] : 'unknown';
  const rl = await checkSignupRateLimit(supabaseAdmin, remoteIp);
  if (!rl.ok) {
    return res.status(429).json({
      error: 'rate_limited',
      message: 'A lot of signups from your network — try again in a few minutes.',
    });
  }

  // Attempt to create the user with email_confirm:true so they don't need to
  // click a confirmation link. visitor_id is forwarded to the DB trigger which
  // uses it (alongside email) to decide whether to grant free signup credits.
  // If the email already exists, fall through to the 'exists' branch — caller
  // routes that user to /auth to enter an OTP.
  const { data: createData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: visitorId ? { visitor_id: visitorId } : undefined,
  });

  // Detect "already exists" — Supabase returns 422 / "already been registered" etc.
  // Match defensively because the message string has changed across versions.
  const alreadyExists = createErr && (
    /already.*registered/i.test(createErr.message) ||
    /already.*exists/i.test(createErr.message) ||
    /duplicate/i.test(createErr.message) ||
    createErr.status === 422
  );

  if (alreadyExists) {
    console.log('[instant-signup] existing user — falling back to OTP:', { email, supabaseStatus: createErr?.status, supabaseMessage: createErr?.message });
    // Don't leak whether the address is registered for non-Turnstile-passing
    // requests, but Turnstile passed so this is a real user — they need to
    // verify ownership via OTP on /auth instead. Send the OTP for them so
    // their next step is just typing the code.
    const { error: otpErr } = await supabaseAdmin.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (otpErr) {
      return res.status(500).json({ error: 'otp_send_failed', detail: otpErr.message });
    }
    // otpLength is read from env (mirrors Supabase dashboard "Email OTP Length").
    // Default 6 — bump if you change the dashboard value to 7 or 8.
    const otpLength = Number(process.env.SUPABASE_EMAIL_OTP_LENGTH ?? '6') || 6;
    return res.status(200).json({ status: 'exists', email, otpLength, message: 'OTP sent — verify on /auth' });
  }

  if (createErr) {
    console.error('[instant-signup] createUser failed (not the exists branch):', { email, status: createErr.status, message: createErr.message });
    return res.status(500).json({ error: 'create_failed', detail: createErr.message });
  }
  if (!createData?.user) {
    console.error('[instant-signup] createUser returned no user:', { email });
    return res.status(500).json({ error: 'create_returned_no_user' });
  }
  console.log('[instant-signup] new user created:', { email, userId: createData.user.id });

  // Generate a single-use magic-link OTP. Client calls supabase.auth.verifyOtp
  // locally with this token to establish a real session — equivalent to the
  // user clicking a magic link, but we hand them the token directly so they
  // never need to leave the page.
  const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });
  if (linkErr || !linkData?.properties?.email_otp) {
    return res.status(500).json({ error: 'link_gen_failed', detail: linkErr?.message ?? 'no email_otp returned' });
  }

  return res.status(200).json({
    status: 'created',
    email,
    otp: linkData.properties.email_otp,
  });
}

// ─── SKU → aspect map ────────────────────────────────────────────────────────
// Maps every Gelato canvas SKU to a gpt-image-2 image_size that fits without
// cropping. Used by both the test-aspects admin tool and (next commit) the
// printMaster checkout-time regen.
//
// Sizes are { width, height } in px. Multiples of 16, max edge ≤3840 (fal limit).
// "Preview" sizes are small/cheap for browsing/testing; "Print" sizes are
// large enough to skip AuraSR for most SKUs.
type AspectKey = '4:5' | '3:4' | '5:7' | '2:3' | '1:1';

interface AspectSpec {
  key: AspectKey;
  label: string;
  preview: { width: number; height: number };
  print: { width: number; height: number };
  skuExamples: string[];
}

const ASPECTS: AspectSpec[] = [
  { key: '4:5', label: '4:5 — 8×10 / 16×20',
    preview: { width: 1024, height: 1280 },
    print:   { width: 2048, height: 2560 },
    skuExamples: ['8x10', '16x20'] },
  { key: '3:4', label: '3:4 — 12×16 / 18×24 / 24×32',
    preview: { width: 1024, height: 1360 },
    print:   { width: 2048, height: 2720 },
    skuExamples: ['12x16', '18x24', '24x32'] },
  { key: '5:7', label: '5:7 — 20×28',
    preview: { width: 1024, height: 1424 },
    print:   { width: 2048, height: 2864 },
    skuExamples: ['20x28'] },
  { key: '2:3', label: '2:3 — 12×18 / 16×24 / 20×30 / 24×36',
    preview: { width: 1024, height: 1536 },
    print:   { width: 2048, height: 3072 },
    skuExamples: ['12x18', '16x24', '20x30', '24x36'] },
  { key: '1:1', label: '1:1 — 24×24',
    preview: { width: 1024, height: 1024 },
    print:   { width: 2048, height: 2048 },
    skuExamples: ['24x24'] },
];

const SKU_TO_ASPECT: Record<string, AspectKey> = {
  '8x10': '4:5',  '16x20': '4:5',
  '12x16': '3:4', '18x24': '3:4', '24x32': '3:4',
  '20x28': '5:7',
  '12x18': '2:3', '16x24': '2:3', '20x30': '2:3', '24x36': '2:3',
  '24x24': '1:1',
};

// ─── handleTestAspects — admin smoke test for all 5 canvas aspects ──────────
// Body: { imageUrl, prompt, petName?, mode? = 'preview' | 'print' }
// Header: x-admin-test-secret = ADMIN_TEST_SECRET (set on Vercel)
//
// Generates one image per aspect group in parallel (5 fal calls, ~10s total).
// Returns { aspects: [{ key, label, width, height, url, costEstimate }] }.
//
// Bypasses customer credit checks — admin only. Cost lands on FAL_KEY balance.
const ADMIN_TEST_SECRET = process.env.ADMIN_TEST_SECRET;

async function handleTestAspects(req: VercelRequest, res: VercelResponse) {
  const got = req.headers['x-admin-test-secret'];
  if (!ADMIN_TEST_SECRET || got !== ADMIN_TEST_SECRET) {
    return res.status(401).json({ error: 'unauthorised' });
  }
  const body = (req.body ?? {}) as { imageUrl?: string; prompt?: string; petName?: string; mode?: 'preview' | 'print'; useVision?: boolean };
  if (!body.imageUrl || !body.prompt) {
    return res.status(400).json({ error: 'imageUrl + prompt required' });
  }
  const mode = body.mode === 'print' ? 'print' : 'preview';

  // Same photo-anchored + Vision-reinforced prompt as live handleGenerate.
  // Vision ON by default; body.useVision can flip OFF for explicit A/B tests.
  const useVision = body.useVision === false
    ? false
    : (process.env.USE_SUBJECT_VISION !== 'false');
  const subject = useVision
    ? await extractSubject(body.imageUrl)
    : { species: 'pet' } as SubjectInfo;
  const petName = (body.petName ?? '').replace(/[^\p{L}\p{N} '-]/gu, '').trim().slice(0, 24);

  const keeps: string[] = [];
  if (subject.breed) keeps.push(`the ${subject.breed} silhouette and breed characteristics`);
  if (subject.furColor) keeps.push(`${subject.furColor} fur pattern`);
  if (subject.eyeColor) keeps.push(`${subject.eyeColor} eyes`);
  if (subject.earShape) keeps.push(`${subject.earShape} ear shape`);
  if (subject.distinguishing) keeps.push(subject.distinguishing);
  const keepLine = keeps.length > 0
    ? `Specifically preserve: ${keeps.join(', ')}.`
    : '';

  const fullPromptParts = [
    `Use the exact pet shown in the source image. Preserve their breed, markings, fur pattern, eye colour, ear shape, and all unique features exactly as they appear in the photo. Do not change the breed. Do not invent new features. Do not redesign the pet.`,
    `The source image is the ground truth: if any listed descriptor conflicts with the visible pet, follow the source image.`,
    keepLine,
    ``,
    `Apply this artistic transformation: ${body.prompt}.`,
    ``,
    `For transformations that include headwear (hat, helmet, hood, crown, costume covering the head), render the headwear naturally OVER the head — ears should be tucked under or hidden by the headwear if it covers that area. Do NOT draw ears poking through fabric, helmet metal, or costume material.`,
    ``,
    petName
      ? `Render the name "${petName}" in elegant clean serif typography along the lower margin of the canvas, centered, readable, no spelling errors, no other text on the canvas.`
      : '',
    ``,
    `Output: canvas composition, painterly cinematic finish, premium polish for framed wall art.`,
  ];
  const fullPrompt = fullPromptParts.filter(p => p !== '').join('\n');

  // Run all 5 aspects in parallel.
  const results = await Promise.all(ASPECTS.map(async (aspect) => {
    const dims = mode === 'print' ? aspect.print : aspect.preview;
    const requestBody = {
      prompt: fullPrompt,
      image_urls: [body.imageUrl],
      image_size: { width: dims.width, height: dims.height },
      quality: GPT_IMAGE_QUALITY,
      num_images: 1,
      output_format: 'png',
    };
    const { res: r, bodyText } = await callGptImage(GPT_IMAGE_PRIMARY_MODEL, requestBody);
    if (!r.ok) {
      return {
        key: aspect.key,
        label: aspect.label,
        width: dims.width,
        height: dims.height,
        skuExamples: aspect.skuExamples,
        url: null,
        error: `${r.status}: ${(bodyText ?? '').slice(0, 200)}`,
      };
    }
    const d = (await r.json()) as KontextResponse;
    return {
      key: aspect.key,
      label: aspect.label,
      width: dims.width,
      height: dims.height,
      skuExamples: aspect.skuExamples,
      url: d.images?.[0]?.url ?? null,
      error: d.images?.[0]?.url ? null : 'no image returned',
    };
  }));

  return res.status(200).json({ mode, subject, prompt: fullPrompt, aspects: results });
}

// ─── handlePrintMaster — server-side print-grade regen at order-fulfillment ──
// Called from the orders/paid webhook (Phase 9 print pipeline) once the
// customer has chosen a sizeKey + frame + shipping. Re-runs the same multi-pet
// gpt-image-2 generation as handleGenerate but at PRINT dimensions
// (2048×N for the chosen aspect) so the resulting file can feed AuraSR + Gelato
// directly without an upscale-from-preview step.
//
// Body:
//   {
//     imageUrls:    string[],   // 1–4 source pet photos (same as handleGenerate multi)
//     petNames?:    string[],   // optional, one per imageUrls index
//     customPrompt: string,     // freeform prompt — same shape customer used at preview time
//     sizeKey:      string,     // e.g. '16x20', '24x36'; must be in SKU_TO_ASPECT
//   }
// Headers:
//   Authorization: Bearer <supabase-jwt>
//
// Returns:
//   { printMasterUrl, width, height, aspect, costEstimate, subjects, prompt }
//
// IMPORTANT — does NOT consume customer credits. The print-master regen is
// paid out of canvas margin at fulfillment time, NOT from the customer's
// portrait token balance. Auth is still required (Bearer JWT) so only
// authenticated users — i.e. people who actually placed an order — can call
// this. The order-paid webhook is the expected caller.
async function handlePrintMaster(req: VercelRequest, res: VercelResponse) {
  if (!FAL_KEY) return res.status(500).json({ error: "FAL_KEY not configured" });

  const body = (req.body ?? {}) as {
    imageUrls?: string[];
    petNames?: string[];
    customPrompt?: string;
    sizeKey?: string;
  };

  // ── Validate required fields ────────────────────────────────────────────
  const customPrompt = sanitiseAddDetails(body.customPrompt ?? "").slice(0, 400);
  if (!customPrompt) {
    return res.status(400).json({ error: "customPrompt required" });
  }
  const sizeKey = typeof body.sizeKey === 'string' ? body.sizeKey : '';
  if (!sizeKey) {
    return res.status(400).json({ error: "sizeKey required" });
  }
  const aspectKey = SKU_TO_ASPECT[sizeKey];
  if (!aspectKey) {
    return res.status(400).json({
      error: "unknown_size_key",
      message: `sizeKey '${sizeKey}' not recognised. Valid: ${Object.keys(SKU_TO_ASPECT).join(', ')}`,
    });
  }
  const aspect = ASPECTS.find((a) => a.key === aspectKey);
  if (!aspect) {
    // Defensive — SKU_TO_ASPECT and ASPECTS should always agree, but bail
    // cleanly if a future edit drifts the two out of sync.
    return res.status(500).json({ error: "aspect_lookup_failed", aspectKey });
  }

  const photos: string[] = Array.isArray(body.imageUrls)
    ? body.imageUrls.filter((u): u is string => typeof u === 'string' && u.length > 0)
    : [];
  if (photos.length === 0) {
    return res.status(400).json({ error: "imageUrls required (1–4 source pet photos)" });
  }
  if (photos.length > 4) {
    return res.status(400).json({ error: "max_pets_exceeded", message: "printMaster supports up to 4 pets per portrait." });
  }
  const rawNames: string[] = Array.isArray(body.petNames)
    ? body.petNames.map((n) => typeof n === 'string' ? n : '')
    : [];
  const names: string[] = photos.map((_, i) => sanitisePetName(rawNames[i] ?? ''));

  // ── Auth — Bearer JWT required even though we don't consume credits ─────
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Sign in to generate print master" });
  }
  const token = auth.slice("Bearer ".length);
  const supabase = getSupabaseAdmin();
  const { data: userRes, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userRes.user) return res.status(401).json({ error: "Invalid token" });

  // ── Vision pre-pass — same bad-photo gate as handleGenerate ─────────────
  // Vision is REQUIRED here too (see feedback_pawtraits_vision_required_for_
  // fal_gpt_image_2.md). USE_SUBJECT_VISION env knob honoured for parity with
  // handleGenerate, but disabling is not recommended — print masters are even
  // more sensitive to identity drift than previews.
  const useVision = process.env.USE_SUBJECT_VISION !== 'false';
  const subjects: SubjectInfo[] = useVision
    ? await Promise.all(photos.map((url) => extractSubject(url)))
    : photos.map(() => ({ species: 'pet' } as SubjectInfo));

  for (let i = 0; i < subjects.length; i++) {
    if (isNoPetDetected(subjects[i])) {
      return res.status(400).json({
        error: 'no_pet_detected',
        petIndex: i,
        message: `Photo ${i + 1} does not appear to show a pet — print master cannot proceed.`,
      });
    }
  }

  // ── Build the same multi-pet prompt as handleGenerate, but with a
  // print-grade aspect line tuned to the chosen canvas SKU ────────────────
  const aspectLabel = aspect.label;
  const aspectInstruction = `Output: ${aspectLabel} canvas composition at print resolution, painterly cinematic finish, premium polish for framed wall art, edge-to-edge composition with no visible margins, no whitespace borders.`;

  const fullPrompt = buildMultiPetCustomPrompt({
    subjects,
    names,
    customPrompt,
    aspectInstruction,
  });

  // ── Fire gpt-image-2 at PRINT dimensions ────────────────────────────────
  // Print dims live on aspect.print — typically 2048×N. AuraSR upscales 4×
  // downstream in the print pipeline (runPrintPipeline) for the final 8K
  // Gelato submission.
  const baseNegative = "low quality, distorted, deformed, plastic, cartoon glitches, blurry, weird anatomy, watermark";
  const anyName = names.some(n => n.length > 0);
  const negative = anyName
    ? `${baseNegative}, misspelled text, garbled letters, illegible typography, gibberish text, multiple names${photos.length > 1 ? ', merged pets, blended pets, hybrid pet, fused features' : ''}`
    : `${baseNegative}, text overlay${photos.length > 1 ? ', merged pets, blended pets, hybrid pet, fused features' : ''}`;

  try {
    const result = await generateVariant({
      imageUrls: photos,
      prompt: fullPrompt,
      negative,
      imageSize: aspect.print,
    });

    if (result.balanceExhausted) {
      return balancePausedResponse(res);
    }
    if (!result.url) {
      return res.status(502).json({ error: "print_master_generation_failed" });
    }

    // Cost estimate — gpt-image-2 high quality at 2048×N is roughly $0.10–
    // $0.20 per image depending on aspect (per fal pricing 2026-05-07).
    // This is a rough number for the order log, not the actual fal bill.
    const QUALITY_COST: Record<'low' | 'medium' | 'high', number> = { low: 0.04, medium: 0.08, high: 0.16 };
    const costEstimate = QUALITY_COST[GPT_IMAGE_QUALITY] ?? 0.10;

    return res.status(200).json({
      printMasterUrl: result.url,
      width: aspect.print.width,
      height: aspect.print.height,
      aspect: aspect.key,
      sizeKey,
      costEstimate,
      subjects,
      prompt: fullPrompt,
    });
  } catch (err) {
    return res.status(500).json({
      error: "print_master_exception",
      detail: (err as Error).message,
    });
  }
}
