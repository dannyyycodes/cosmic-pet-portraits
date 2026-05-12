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
 *
 * Function config: maxDuration set to 300s (Pro plan ceiling). The
 * generate path's worst case is Vision pre-pass (~12s) + fal.run
 * gpt-image-2 medium (8-55s observed in May-8 retest) + synchronous
 * rehost (5-30s) ≈ 25-97s. The previous 60s setting (Hobby ceiling)
 * was killing the function before slow fal calls could complete and
 * return — customer saw timeout, credit silently consumed.
 */
export const config = {
  maxDuration: 300,
};
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
import { runDigitalFulfillment } from "./_lib/digitalFulfillment.js";
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

// ─── Printful Mockup Generator (in-room canvas previews) ────────────────────
// Free per-customer dynamic mockups. Used at the studio reveal step to show
// the customer's portrait inside a realistic framed canvas hanging on a
// wall — closes the screen-to-canvas imagination gap before purchase.
// Gelato stays the actual fulfilment vendor; Printful is mockup imagery only.
// See vault/03-resources/credentials-index/printful.md for credential notes.
// Note: PRINTFUL_TOKEN + PRINTFUL_STORE_ID are declared further down in this
// file (used by the existing handlePrintfulMockup action). We reuse them
// rather than re-declaring (duplicate const = SyntaxError at module load).
const PRINTFUL_API_BASE = "https://api.printful.com/v2";
// catalog_product_id 614 = "Framed Canvas (in)" — exact-match for our SKU.
const PRINTFUL_FRAMED_CANVAS_PRODUCT_ID = 614;
// Printful only stocks Black + Brown frames; our Gelato has Black + natural-wood
// + dark-wood. For mockup imagery only (not fulfilment) we map both wood
// variants → Brown — visually close enough for the imagination-gap purpose.
// Maps (sizeKey, frameColor) → { variantId, lifestyleStyleId }. The lifestyle
// style id is the "canvas hanging in a room" view in PORTRAIT orientation
// (height > width — matches our 2:3 pet portraits). Discovered via
// /v2/catalog-products/614/mockup-styles on 2026-05-11.
// Sizes 16×24 and 24×30 are absent because Printful doesn't stock those
// framed-canvas variants — Gelato still fulfils them, but no mockup preview
// will appear at the studio reveal for those sizes (graceful no-op).
const PRINTFUL_VARIANT_MAP: Record<string, { black: number; wood: number; lifestyleStyleId: number }> = {
  "8x10":  { black: 17627, wood: 17634, lifestyleStyleId: 3865 }, // 11×13 portrait
  "12x16": { black: 16035, wood: 16041, lifestyleStyleId: 3796 }, // 15×19 portrait
  "12x18": { black: 17630, wood: 17637, lifestyleStyleId: 3880 }, // 15×21 portrait
  "16x20": { black: 16037, wood: 16043, lifestyleStyleId: 3799 }, // 19×23 portrait
  "18x24": { black: 16038, wood: 16044, lifestyleStyleId: 3801 }, // 21×27 portrait
  "20x28": { black: 17631, wood: 17638, lifestyleStyleId: 3922 }, // 23×31 portrait
  "20x30": { black: 17633, wood: 17640, lifestyleStyleId: 3950 }, // 23×33 portrait
  "24x32": { black: 17632, wood: 17639, lifestyleStyleId: 3936 }, // 27×35 portrait
  "24x36": { black: 16039, wood: 16045, lifestyleStyleId: 3803 }, // 27×39 portrait
};
// 1 token = 1 generation = 1 full-size portrait. Locked 2026-05-06 — replaces
// the 4-variant pack model. Customers download the single result; if they want
// alternatives they spend another token.
const TOKENS_PER_GENERATION = 1;

// ─── Drift detection + cost accounting (used by handleGenerate) ─────────────
// DRIFT_THRESHOLD: any drift_score above this triggers an auto-regen attempt
// (or, on the second pass, a hard-fail refund). 0.3 chosen empirically — a
// breed mismatch alone scores 0.5 (already over), so the threshold catches
// breed swaps cleanly while letting smaller per-feature drifts through.
// MAX_REGEN_ATTEMPTS: only one regen per generation. After that, refund and
// tell the customer the photo angle wasn't lockable.
// GPT_IMAGE_COST_USD: per-call fal.ai cost for gpt-image-2 at 'medium' quality
// (1024×1536). Updated when fal pricing shifts; only used for cost_usd in the
// audit log, never customer-facing.
// VISION_COST_USD: per-call OpenRouter Vision cost (Sonnet 4.5 at ~300 tokens).
const DRIFT_THRESHOLD = 0.3;
const MAX_REGEN_ATTEMPTS = 1;
const GPT_IMAGE_COST_USD = 0.04;
const VISION_COST_USD = 0.005;

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
  const action = req.query.action;

  // generation_status is a poll endpoint — GET semantically. Everything
  // else mutates state and stays POST-only.
  if (action === "generation_status") {
    if (req.method !== "GET" && req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ error: "Method Not Allowed" });
    }
  } else if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  switch (action) {
    case "preview":
      return handlePreview(req, res);
    case "generate":
      return handleGenerate(req, res);
    case "generation_status":
      return handleGenerationStatus(req, res);
    case "room_mockup":
      return handleRoomMockup(req, res);
    case "printMaster_submit":
      return handlePrintMasterSubmit(req, res);
    case "printMaster_status":
      return handlePrintMasterStatus(req, res);
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
    case "redeem_download_credit":
      return handleRedeemDownloadCredit(req, res);
    default:
      return res.status(400).json({ error: `Unknown action: ${action}. Valid: preview|generate|generation_status|room_mockup|printMaster|printMaster_submit|printMaster_status|cutout|composite|mockup|printful-mockup|printOrder|library|instant-signup|test-aspects|redeem_download_credit` });
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
      "Render in a cinematic painterly photo-portrait finish — feels like a real photograph styled by a master cinematographer. Soft natural lighting, rich shadows, premium oil-painting polish over photoreal foundation. 2:3 vertical composition for framed wall art.",
    negative: "cartoon, anime, vector art, flat illustration, plastic look, neon, 3d-render",
  },
  illustrated: {
    suffix:
      "Render as a premium hand-drawn illustrated portrait — polished modern character illustration in the spirit of high-end children's-book cover art crossed with editorial portraiture. Confident inked linework, painterly digital colour, soft volumetric shading, NOT a flat cartoon. The pet still reads as themselves but stylised. 2:3 vertical composition for framed wall art.",
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

// fal returns a 422 with a content_policy_violation marker when the moderator
// trips on a prompt — typically a pet name that resembles an unsafe word
// (vault note 2026-05-08: Sphynx "Naked" was the canonical case). Detecting
// this lets handleGenerate refund the credit AND surface a specific error
// code so the UI shows "try a different name" instead of a generic 502.
function isFalContentPolicyViolation(status: number, text: string): boolean {
  if (status !== 422) return false;
  const lower = text.toLowerCase();
  return (
    lower.includes("content_policy_violation") ||
    lower.includes("content policy") ||
    lower.includes("moderation") ||
    lower.includes("safety") ||
    lower.includes("policy violation")
  );
}

function balancePausedResponse(res: VercelResponse) {
  return res.status(503).json({
    error: "ai-service-paused",
    message: "Our portrait studio is paused (account top-up needed). Try the Templates flow — your pet's actual face on a beautifully framed product.",
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
        aspect_ratio: "2:3", ...(negative ? { negative_prompt: negative } : {}),
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

// Per-attempt ceiling on the OpenRouter Vision pre-pass. Sonnet 4.5 vision
// regularly takes 3–8s on real customer photos; the previous 5s ceiling was
// catching too many real pets in the AbortError path and surfacing them as
// "doesn't appear to show a pet" — a misleading message for what was actually
// a timeout. Bumped to 12s + 1 retry. Total worst case before the gate
// decides: ~24s. The fallback no longer rejects the customer — it proceeds
// with a generic-identity prompt — so a slow Vision call no longer blocks a
// real pet, it just slightly weakens the breed anchoring on that one call.
const VISION_TIMEOUT_MS = 12_000;
const VISION_MAX_ATTEMPTS = 2;

async function extractSubject(imageUrl: string): Promise<SubjectInfo> {
  const fallback: SubjectInfo = { species: "pet" };
  if (!OPENROUTER_KEY) {
    console.warn('[VISION_FALLBACK]', { reason: 'no_openrouter_key', imageUrl: imageUrl.slice(0, 80) });
    return fallback;
  }

  const systemPrompt = `You are a pet-breed identification specialist. Examine the photo and return STRICT JSON describing the pet's identifiable physical features.

Return shape (every field required, use null only if you genuinely cannot tell):
{
  "species": "dog" | "cat" | "rabbit" | "bird" | "horse" | "other" | "none",
  "breed": "<specific breed name — be precise. Examples: 'German Shepherd', 'Cream French Bulldog', 'Maine Coon'. Designer crossbreeds and doodles ARE valid breeds — return them by name: 'Cockapoo', 'Labradoodle', 'Cavapoo', 'Goldendoodle', 'Maltipoo', 'Sheepadoodle', 'Pomsky', 'Puggle', etc. For non-designer mixes use 'mixed breed (looks like X with Y)'. Set to null ONLY if species is 'none'.>",
  "furColor": "<specific descriptor: 'black saddle with tan markings', 'cream with apricot ears', 'tortoiseshell calico', 'white with grey tabby patches'. NOT just 'brown' — include patterns and markings.>",
  "eyeColor": "<'amber', 'dark brown', 'green', 'blue', 'heterochromia (one blue one green)', etc>",
  "earShape": "<'erect triangular', 'drop pendulous', 'semi-erect', 'cropped', 'folded', 'tufted', 'rose'>",
  "distinguishing": "<one short phrase capturing what makes THIS individual recognisable: 'white sock on left front paw', 'pink nose with black freckle', 'long bushy tail with white tip', 'one ear flopped'. If nothing stands out, the most prominent breed feature.>"
}

CRITICAL — bad-photo gate:
Set species: "none" ONLY when the image clearly contains no pet at all (e.g. pure landscape, person alone, inanimate object, sunset, food, screenshot, blank canvas). If you can see a recognisable pet — even partially, even at a slight angle, even if breed is uncertain — return its species and your best-guess breed. NEVER return species: "none" just because you're unsure of the breed. Unsure of breed → species is still "dog"/"cat"/etc. and breed is your best guess (e.g. 'mixed breed terrier-type').

Rules:
- Be confident on real pets. "best guess" is acceptable for breed/markings.
- Specific beats vague. "Black saddle with tan markings" not "black and tan".
- A human in the photo with no pet → species: "none". A pet held by a human → identify the pet.
- Output JSON only — no prose, no markdown fences, no commentary.`;

  for (let attempt = 1; attempt <= VISION_MAX_ATTEMPTS; attempt++) {
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
      if (!r.ok) {
        console.warn('[VISION_FALLBACK]', { reason: 'http_not_ok', status: r.status, attempt, imageUrl: imageUrl.slice(0, 80) });
        if (attempt < VISION_MAX_ATTEMPTS && (r.status === 429 || r.status >= 500)) continue;
        return fallback;
      }
      const d = await r.json() as { choices?: Array<{ message?: { content?: string } }> };
      const c = d.choices?.[0]?.message?.content;
      if (!c) {
        console.warn('[VISION_FALLBACK]', { reason: 'empty_content', attempt, imageUrl: imageUrl.slice(0, 80) });
        return fallback;
      }
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
      const name = (err as Error).name;
      const isAbort = name === 'AbortError';
      console.warn('[VISION_FALLBACK]', {
        reason: isAbort ? 'timeout' : 'exception',
        errName: name,
        attempt,
        timeoutMs: VISION_TIMEOUT_MS,
        imageUrl: imageUrl.slice(0, 80),
      });
      if (attempt < VISION_MAX_ATTEMPTS && isAbort) continue;
      return fallback;
    } finally {
      clearTimeout(timer);
    }
  }
  return fallback;
}

interface VariantResult {
  url?: string;
  balanceExhausted?: boolean;
  /** True when fal returned 422 + a content_policy_violation marker — the
   *  caller should refund the credit AND surface a specific error code so
   *  the UI can show "try a different name" instead of a generic failure. */
  contentPolicyViolation?: boolean;
}

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
// Output size: custom 1024×1536 = exact 2:3, the brand canvas default.
// Matches 12×18 / 16×24 / 20×30 / 24×36 hero perfectly; 16×20 (4:5) crops
// at print time via the Phase 9 print pipeline.
//
// Knobs (Vercel env, optional):
//   GPT_IMAGE_FAL_MODEL  — model slug. Default 'openai/gpt-image-2/edit'.
//                          Falls back only on hard model-missing errors so a
//                          bad slug does not burn a customer's credit.
//   GPT_IMAGE_QUALITY    — 'low' | 'medium' | 'high' (default 'medium')
//   GPT_IMAGE_WIDTH      — int, default 1024
//   GPT_IMAGE_HEIGHT     — int, default 1536  (2:3)
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
const GPT_IMAGE_HEIGHT = Number(process.env.GPT_IMAGE_HEIGHT ?? 1536);

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
// preview default of 1024×1536.
async function generateVariant(args: {
  imageUrl?: string;
  imageUrls?: string[];
  prompt: string;
  negative?: string;
  imageSize?: { width: number; height: number };
  /** Per-call quality override. Customer previews still use the env-configured
   *  default ('medium'); printMaster forces 'high' regardless of env. */
  quality?: 'low' | 'medium' | 'high';
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
  const quality = args.quality ?? GPT_IMAGE_QUALITY;

  const requestBody = {
    prompt: fullPrompt,
    image_urls: photos,
    image_size: size,
    quality,
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
      if (isFalContentPolicyViolation(r.status, text)) {
        console.warn('[generateVariant] content_policy_violation', { status: r.status, snippet: text.slice(0, 200) });
        return { contentPolicyViolation: true };
      }
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

// ─── Async queue helpers (B2: queue.fal.run + client polling) ──────────────
// Why these exist: the synchronous /fal.run endpoint blocks the Vercel
// function for the entire fal generation (8–55s observed for gpt-image-2
// medium quality). With Vision pre-pass + rehost, total can hit ~97s.
// Even on Pro plan's 300s ceiling that's a poor customer UX (long blank
// wait). The queue endpoint returns a request_id immediately; the client
// polls /api/portraits?action=generation_status until COMPLETED. The
// rehost happens in the status handler, off the submit path.
//
// Verified live fal API contract (https://fal.ai/docs/model-endpoints/queue):
//   submit:  POST  https://queue.fal.run/{model}        → {request_id, status_url, response_url}
//   status:  GET   https://queue.fal.run/{model}/requests/{request_id}/status → {status: IN_QUEUE|IN_PROGRESS|COMPLETED, queue_position?, ...}
//   result:  GET   https://queue.fal.run/{model}/requests/{request_id}        → same shape as sync (e.g. {images: [...]})
//
// We deliberately do NOT use fal_webhook for this iteration — polling is
// simpler (no signature verify, no DB notify path, no Realtime
// subscription). Customer-perceived latency from polling at 2.5s is
// negligible vs the underlying fal time.

interface FalQueueSubmitResult {
  requestId?: string;
  model?: string;
  /** Authoritative URLs returned by fal. Use these directly for polling
   *  rather than reconstructing from {model}/requests/{id} — fal's
   *  status/response paths drop action suffixes (e.g. submit goes to
   *  openai/gpt-image-2/edit but status lives under openai/gpt-image-2). */
  statusUrl?: string;
  responseUrl?: string;
  balanceExhausted?: boolean;
  contentPolicyViolation?: boolean;
  /** Network / non-recoverable error during submit. Caller should refund. */
  submitError?: string;
}

/** Submit a generation to fal's async queue. Returns a request_id immediately
 *  (typically <2s) — the actual generation happens in fal's queue and is
 *  polled separately via getFalQueueStatus + fetchFalQueueResult.
 *  Mirrors the body shape of generateVariant (gpt-image-2 edit endpoint). */
async function submitGenerationToFalQueue(args: {
  imageUrl?: string;
  imageUrls?: string[];
  prompt: string;
  negative?: string;
  imageSize?: { width: number; height: number };
  quality?: 'low' | 'medium' | 'high';
}): Promise<FalQueueSubmitResult> {
  const fullPrompt = args.negative
    ? `${args.prompt}\n\nAvoid: ${args.negative}.`
    : args.prompt;

  const photos = args.imageUrls && args.imageUrls.length > 0
    ? args.imageUrls
    : args.imageUrl
      ? [args.imageUrl]
      : [];
  if (photos.length === 0) {
    return { submitError: 'no_photos' };
  }

  const size = args.imageSize ?? { width: GPT_IMAGE_WIDTH, height: GPT_IMAGE_HEIGHT };
  const quality = args.quality ?? GPT_IMAGE_QUALITY;

  const requestBody = {
    prompt: fullPrompt,
    image_urls: photos,
    image_size: size,
    quality,
    num_images: 1,
    output_format: 'png',
  };

  // 15s ceiling on the SUBMIT call only — the queue endpoint normally
  // responds in <2s with the request_id. Anything longer means fal's
  // gateway is wedged; better to fail fast and refund than hold the
  // function open.
  const SUBMIT_TIMEOUT_MS = 15_000;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), SUBMIT_TIMEOUT_MS);
  try {
    const r = await fetch(`https://queue.fal.run/${GPT_IMAGE_PRIMARY_MODEL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Key ${FAL_KEY}` },
      signal: ctrl.signal,
      body: JSON.stringify(requestBody),
    });
    if (!r.ok) {
      const text = await r.text();
      if (isFalBalanceExhausted(text)) return { balanceExhausted: true };
      if (isFalContentPolicyViolation(r.status, text)) {
        console.warn('[fal-queue/submit] content_policy_violation', { status: r.status, snippet: text.slice(0, 200) });
        return { contentPolicyViolation: true };
      }
      console.error('[fal-queue/submit] non-OK', { status: r.status, snippet: text.slice(0, 300) });
      return { submitError: `fal_${r.status}` };
    }
    const d = (await r.json()) as { request_id?: string; status_url?: string; response_url?: string };
    if (!d.request_id || !d.status_url || !d.response_url) {
      console.error('[fal-queue/submit] missing fields in response', { hasReqId: !!d.request_id, hasStatusUrl: !!d.status_url, hasResponseUrl: !!d.response_url });
      return { submitError: 'missing_request_id' };
    }
    return {
      requestId: d.request_id,
      model: GPT_IMAGE_PRIMARY_MODEL,
      statusUrl: d.status_url,
      responseUrl: d.response_url,
    };
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      console.warn('[fal-queue/submit] timeout', { timeoutMs: SUBMIT_TIMEOUT_MS });
      return { submitError: 'submit_timeout' };
    }
    console.error('[fal-queue/submit] threw:', (err as Error).message);
    return { submitError: `threw: ${(err as Error).message}` };
  } finally {
    clearTimeout(timer);
  }
}

interface FalQueueStatusResult {
  /** Normalised: 'pending' | 'completed' | 'failed' */
  status: 'pending' | 'completed' | 'failed';
  /** When pending, may include queue_position from fal */
  queuePosition?: number;
  /** When completed, the raw image URL on *.fal.media — caller rehosts */
  imageUrl?: string;
  /** When failed, a short reason (for log + refund metadata) */
  error?: string;
  /** When failed due to content policy, signal upstream so UI can show specific copy */
  contentPolicyViolation?: boolean;
}

/** Poll a fal queue job. Single GET — caller controls polling cadence.
 *  Returns a normalised status. On COMPLETED, also fetches the result
 *  payload and extracts imageUrl.
 *  Pass the authoritative URLs returned by fal at submit time (status_url +
 *  response_url) — do NOT reconstruct from {model}/requests/{id}, fal's
 *  status path drops action suffixes (e.g. submit goes to .../edit but
 *  status lives under the base model). */
async function pollFalQueueStatus(statusUrl: string, responseUrl: string): Promise<FalQueueStatusResult> {
  const STATUS_TIMEOUT_MS = 10_000;
  const statusCtrl = new AbortController();
  const statusTimer = setTimeout(() => statusCtrl.abort(), STATUS_TIMEOUT_MS);
  try {
    const sr = await fetch(statusUrl, {
      headers: { Authorization: `Key ${FAL_KEY}` },
      signal: statusCtrl.signal,
    });
    if (!sr.ok) {
      const text = await sr.text();
      // 404 usually means the request_id has been garbage-collected (>24h old).
      if (sr.status === 404) return { status: 'failed', error: 'request_id_not_found' };
      console.error('[fal-queue/status] non-OK', { status: sr.status, snippet: text.slice(0, 200) });
      return { status: 'failed', error: `status_${sr.status}` };
    }
    const sd = (await sr.json()) as { status?: string; queue_position?: number };
    if (sd.status === 'IN_QUEUE') return { status: 'pending', queuePosition: sd.queue_position };
    if (sd.status === 'IN_PROGRESS') return { status: 'pending' };
    if (sd.status !== 'COMPLETED') {
      // Unknown status — treat as still pending; next poll will resolve.
      return { status: 'pending' };
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      // Status check itself timed out — not the same as the job failing.
      // Caller should retry on the next poll tick.
      return { status: 'pending' };
    }
    console.error('[fal-queue/status] threw:', (err as Error).message);
    return { status: 'pending' };
  } finally {
    clearTimeout(statusTimer);
  }

  // status was COMPLETED — fetch the result payload.
  const RESULT_TIMEOUT_MS = 15_000;
  const resCtrl = new AbortController();
  const resTimer = setTimeout(() => resCtrl.abort(), RESULT_TIMEOUT_MS);
  try {
    const rr = await fetch(responseUrl, {
      headers: { Authorization: `Key ${FAL_KEY}` },
      signal: resCtrl.signal,
    });
    if (!rr.ok) {
      const text = await rr.text();
      if (isFalBalanceExhausted(text)) return { status: 'failed', error: 'fal-balance-exhausted' };
      if (isFalContentPolicyViolation(rr.status, text)) {
        return { status: 'failed', contentPolicyViolation: true, error: 'content_policy_violation' };
      }
      console.error('[fal-queue/result] non-OK', { status: rr.status, snippet: text.slice(0, 200) });
      return { status: 'failed', error: `result_${rr.status}` };
    }
    const rd = (await rr.json()) as KontextResponse;
    const url = rd.images?.[0]?.url;
    if (!url) return { status: 'failed', error: 'no_image_in_result' };
    return { status: 'completed', imageUrl: url };
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      return { status: 'pending' }; // try again
    }
    console.error('[fal-queue/result] threw:', (err as Error).message);
    return { status: 'failed', error: `result_threw: ${(err as Error).message}` };
  } finally {
    clearTimeout(resTimer);
  }
}

/** Download a fal.media image and rehost it in our PUBLIC Supabase bucket.
 *  Used for PREVIEW VARIANTS (1024px web-quality) shown in the studio.
 *  fal URLs expire (~1h sync, ~24h queue), but customer carts persist in
 *  localStorage indefinitely — the print-master regen needs a durable URL.
 *  Non-fatal: returns the original fal URL with a logged warning if rehost fails. */
async function rehostFalImage(supabase: ReturnType<typeof getSupabaseAdmin>, falUrl: string): Promise<string> {
  try {
    const dl = await fetch(falUrl, { signal: AbortSignal.timeout(30_000) });
    if (!dl.ok) {
      console.warn('[rehost] download failed', { status: dl.status, url: falUrl });
      return falUrl;
    }
    const buffer = Buffer.from(await dl.arrayBuffer());
    const path = `generations/${crypto.randomUUID()}.png`;
    const { error: upErr } = await supabase.storage
      .from('pet-photos')
      .upload(path, buffer, { contentType: 'image/png', cacheControl: '31536000', upsert: false });
    if (upErr) {
      console.warn('[rehost] upload failed:', upErr.message);
      return falUrl;
    }
    const { data } = supabase.storage.from('pet-photos').getPublicUrl(path);
    if (!data?.publicUrl) {
      console.warn('[rehost] getPublicUrl returned no URL — using fal URL');
      return falUrl;
    }
    return data.publicUrl;
  } catch (e) {
    console.warn('[rehost] threw:', (e as Error).message);
    return falUrl;
  }
}

/** Download a fal.media image and rehost it in our PRIVATE Supabase bucket.
 *  Used for HIGH-RES PRINT MASTERS (3000x3000) — the paid product.
 *
 *  Returns a storage PATH (relative to the bucket), NOT a URL. The browser
 *  never gets a working URL to the print master — only the orders/paid
 *  fulfilment pipeline (which uses the admin client) can fetch the file.
 *  This closes the pre-2026-05-12 hole where a customer could DevTools-snipe
 *  the public URL and download the 3000x3000 PNG without paying.
 *
 *  Non-fatal: returns null with a logged warning if rehost fails. */
async function rehostFalImagePrivate(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  falUrl: string,
): Promise<string | null> {
  try {
    const dl = await fetch(falUrl, { signal: AbortSignal.timeout(30_000) });
    if (!dl.ok) {
      console.warn('[rehost-private] download failed', { status: dl.status, url: falUrl });
      return null;
    }
    const buffer = Buffer.from(await dl.arrayBuffer());
    const path = `print-masters/${crypto.randomUUID()}.png`;
    const { error: upErr } = await supabase.storage
      .from('pet-photos-private')
      .upload(path, buffer, { contentType: 'image/png', cacheControl: '31536000', upsert: false });
    if (upErr) {
      console.warn('[rehost-private] upload failed:', upErr.message);
      return null;
    }
    return path;
  } catch (e) {
    console.warn('[rehost-private] threw:', (e as Error).message);
    return null;
  }
}

// ─── Printful Mockup helpers ────────────────────────────────────────────────
// Submits a mockup task to Printful for the given variant URL + size + frame,
// polls until completion (max ~60s), returns the public mockup URL or null.
// Used by handleRoomMockup — server-side combined submit-and-poll. Why not
// async like B2: render time is reliably 15-25s and the customer is already
// looking at their variant; a single 30-60s wait is acceptable and avoids
// the complexity of a separate status endpoint + frontend polling for what
// is fundamentally a "nice to have" preview enhancement.
async function generatePrintfulRoomMockup(args: {
  variantImageUrl: string;
  sizeKey: string;
  frameColor: string;
}): Promise<{ mockupUrl?: string; error?: string }> {
  if (!PRINTFUL_TOKEN) return { error: 'printful_token_missing' };
  if (!PRINTFUL_STORE_ID) return { error: 'printful_store_id_missing' };

  const sizeMap = PRINTFUL_VARIANT_MAP[args.sizeKey];
  if (!sizeMap) return { error: `no_mockup_for_size_${args.sizeKey}` };

  // Frame color mapping: black → Printful Black; everything else → Printful
  // Brown (visually close enough for an in-room preview).
  const printfulVariantId = args.frameColor === 'black' ? sizeMap.black : sizeMap.wood;
  const lifestyleStyleId = sizeMap.lifestyleStyleId;

  // Submit
  let taskId: number | null = null;
  try {
    const submitRes = await fetch(`${PRINTFUL_API_BASE}/mockup-tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PRINTFUL_TOKEN}`,
        'X-PF-Store-Id': PRINTFUL_STORE_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        format: 'jpg',
        products: [{
          source: 'catalog',
          catalog_product_id: PRINTFUL_FRAMED_CANVAS_PRODUCT_ID,
          catalog_variant_ids: [printfulVariantId],
          mockup_style_ids: [lifestyleStyleId],
          placements: [{
            placement: 'default',
            technique: 'digital',
            layers: [{ type: 'file', url: args.variantImageUrl }],
          }],
        }],
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!submitRes.ok) {
      const text = await submitRes.text();
      console.error('[printful/submit] non-OK', { status: submitRes.status, snippet: text.slice(0, 300) });
      return { error: `submit_${submitRes.status}` };
    }
    const submitData = (await submitRes.json()) as { data?: Array<{ id?: number }> };
    taskId = submitData.data?.[0]?.id ?? null;
    if (!taskId) return { error: 'no_task_id' };
  } catch (e) {
    console.error('[printful/submit] threw', (e as Error).message);
    return { error: `submit_threw: ${(e as Error).message}` };
  }

  // Poll — max 12 attempts × 5s = 60s
  const POLL_INTERVAL_MS = 5_000;
  const MAX_POLLS = 12;
  for (let attempt = 0; attempt < MAX_POLLS; attempt++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    try {
      const statusRes = await fetch(`${PRINTFUL_API_BASE}/mockup-tasks?id=${taskId}`, {
        headers: {
          'Authorization': `Bearer ${PRINTFUL_TOKEN}`,
          'X-PF-Store-Id': PRINTFUL_STORE_ID,
        },
        signal: AbortSignal.timeout(10_000),
      });
      if (!statusRes.ok) continue;
      const statusData = (await statusRes.json()) as {
        data?: Array<{
          status?: string;
          catalog_variant_mockups?: Array<{ mockups?: Array<{ mockup_url?: string }> }>;
          failure_reasons?: string[];
        }>;
      };
      const task = statusData.data?.[0];
      if (!task) continue;
      if (task.status === 'failed') {
        return { error: `printful_failed: ${task.failure_reasons?.join(',') ?? 'unknown'}` };
      }
      if (task.status === 'completed') {
        const url = task.catalog_variant_mockups?.[0]?.mockups?.[0]?.mockup_url;
        if (!url) return { error: 'no_mockup_url_in_response' };
        return { mockupUrl: url };
      }
      // status === 'pending' → keep polling
    } catch {
      // network glitch — keep trying
    }
  }
  return { error: 'mockup_timeout' };
}

// ─── Room mockup handler — POST /api/portraits?action=room_mockup ──────────
// Body: { variantImageUrl, sizeKey, frameColor }
// Auth: Bearer JWT required (prevents anonymous abuse of the free Printful API).
// Returns: { mockupUrl } on success, or { error } if the mockup couldn't be
// generated. Intentionally non-fatal — the calling UI should fall back to
// just showing the raw variant if the mockup fails.
async function handleRoomMockup(req: VercelRequest, res: VercelResponse) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Sign in required' });
  }
  const token = auth.slice('Bearer '.length);
  const supabase = getSupabaseAdmin();
  const { data: userRes, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userRes.user) return res.status(401).json({ error: 'Invalid token' });

  const body = (req.body ?? {}) as {
    variantImageUrl?: string;
    sizeKey?: string;
    frameColor?: string;
  };
  if (!body.variantImageUrl || typeof body.variantImageUrl !== 'string') {
    return res.status(400).json({ error: 'variantImageUrl required' });
  }
  // SSRF check — only allow our own Supabase storage + fal.media URLs through
  // to Printful (matches the existing imageUrl whitelist used by handleGenerate).
  const reason = validateImageUrlOrigin(body.variantImageUrl);
  if (reason) {
    return res.status(400).json({ error: 'invalid_variant_url', reason });
  }
  const sizeKey = typeof body.sizeKey === 'string' ? body.sizeKey : '12x16';
  const frameColor = typeof body.frameColor === 'string' ? body.frameColor : 'black';

  const result = await generatePrintfulRoomMockup({
    variantImageUrl: body.variantImageUrl,
    sizeKey,
    frameColor,
  });

  if (result.error) {
    // Non-fatal — return 200 with error so the UI can swallow it gracefully.
    return res.status(200).json({ mockupUrl: null, error: result.error });
  }
  return res.status(200).json({ mockupUrl: result.mockupUrl });
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
  aspectInstruction?: string;  // override the "vertical 2:3" line for non-2:3 print masters
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
    ?? `Output: vertical 2:3 canvas composition, painterly cinematic finish, premium polish for framed wall art.`;

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

// Validate every imageUrl against a tight host whitelist. Without this,
// handleGenerate forwards arbitrary URLs to fal.run (which fetches them
// server-side) and to extractSubject (OpenRouter Vision, which also fetches
// them server-side). That's a textbook SSRF surface — a caller could supply
// http://169.254.169.254/, file://, or any internal endpoint and have our
// infrastructure dereference it. We allow only:
//   - The project Supabase storage host (parsed from VITE_SUPABASE_URL)
//   - images.pexels.com (gallery uploader / showcase photos)
//   - any *.fal.media subdomain (gpt-image-2 returns its own outputs there
//     when the customer iterates on a previous generation)
// Returns null on success, or a string error reason on failure.
function validateImageUrlOrigin(raw: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return 'invalid_url';
  }
  if (parsed.protocol !== 'https:') {
    return `invalid_protocol: ${parsed.protocol.replace(':', '')}`;
  }
  const host = parsed.hostname.toLowerCase();
  // Project Supabase storage — derive the host from VITE_SUPABASE_URL so a
  // future Supabase project rotation doesn't strand this whitelist.
  let supabaseHost: string | null = null;
  if (SUPABASE_URL) {
    try { supabaseHost = new URL(SUPABASE_URL).hostname.toLowerCase(); } catch { /* ignore */ }
  }
  if (supabaseHost && host === supabaseHost) return null;
  if (host === 'images.pexels.com') return null;
  if (host.endsWith('.fal.media')) return null;
  return `host_not_allowed: ${host}`;
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

// A photo's vision result counts as "no pet detected" ONLY when the model
// explicitly flagged species: 'none'. The bare {species:'pet'} fallback
// shape (Vision call timed out, errored, or hit no OPENROUTER_KEY) is no
// longer treated as "not a pet" — that misled customers like Danny's
// cockapoo upload, where the call just timed out at 5s and the message
// said the photo wasn't a pet. We now proceed with a generic-identity
// prompt on Vision failure: slightly weaker breed anchoring on that one
// generation, but the customer never sees a false rejection. Vision-fallback
// frequency is tracked via [VISION_FALLBACK] structured logs in extractSubject.
function isNoPetDetected(subject: SubjectInfo): boolean {
  return subject.species === 'none';
}

// ─── Generation audit-log helpers (pawtrait_generation_log) ────────────────
// Every customer generation gets one row in pawtrait_generation_log. These
// helpers wrap the row's lifecycle: insert at start, patch at each stage
// (vision-pre / generated / vision-post / drift / success|failed). All writes
// are best-effort — a logging failure must NEVER block the customer's
// generation. We swallow errors and log them to console instead.
//
// computeDriftScore quantifies how far the post-gen Vision identification
// drifts from the pre-gen one. Weighted feature compare; substring fuzzy
// match for breed (so "german shepherd" vs "german shepherd mix" doesn't
// trip a false-positive). For multi-pet, average the per-pet scores.
//
// runPostGenVision is just a re-use of extractSubject — we call it on the
// fal output URL, which is on *.fal.media (already in the SSRF whitelist).

type GenerationLogPatch = {
  status?: string;
  source_vision?: SubjectInfo[] | null;
  prompt_sent?: string | null;
  negative_prompt?: string | null;
  output_image_url?: string | null;
  output_vision?: SubjectInfo[] | null;
  drift_score?: number | null;
  drift_flags?: Record<string, unknown> | null;
  regen_count?: number;
  error_text?: string | null;
  cost_usd?: number | null;
  duration_ms?: number | null;
  metadata?: Record<string, unknown>;
  fal_request_id?: string | null;
  fal_model?: string | null;
};

async function insertGenerationLog(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  row: {
    user_id: string;
    source_image_urls: string[];
    pet_count: number;
    style_id?: string | null;
    theme_id?: string | null;
    custom_prompt?: string | null;
    status: string;
  },
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('pawtrait_generation_log')
      .insert({
        user_id: row.user_id,
        source_image_urls: row.source_image_urls,
        pet_count: row.pet_count,
        style_id: row.style_id ?? null,
        theme_id: row.theme_id ?? null,
        custom_prompt: row.custom_prompt ?? null,
        status: row.status,
      })
      .select('id')
      .single();
    if (error) {
      console.error('[GEN_LOG_INSERT_FAILED]', { error: error.message });
      return null;
    }
    return data?.id ?? null;
  } catch (err) {
    console.error('[GEN_LOG_INSERT_THREW]', { error: (err as Error).message });
    return null;
  }
}

/** Look up a cached source_vision array from a recent successful generation
 *  with the EXACT same photos[] for this user. Returns null if no match
 *  (or on any error — Vision will just re-run, no harm). */
async function lookupCachedVision(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  photos: string[],
): Promise<SubjectInfo[] | null> {
  if (photos.length === 0) return null;
  try {
    // contains() returns rows whose source_image_urls is a SUPERSET of
    // photos. Combined with a length check below, that gives us exact
    // match (PostgREST has no direct "array equals" filter).
    const { data, error } = await supabase
      .from('pawtrait_generation_log')
      .select('source_image_urls, source_vision')
      .eq('user_id', userId)
      .not('source_vision', 'is', null)
      .contains('source_image_urls', photos)
      .order('created_at', { ascending: false })
      .limit(5);
    if (error || !data) return null;
    for (const row of data) {
      const urls = row.source_image_urls as string[] | null;
      const sv = row.source_vision as SubjectInfo[] | null;
      if (!Array.isArray(urls) || !Array.isArray(sv)) continue;
      if (urls.length !== photos.length) continue;
      // Exact same order as photos[]? (Most cases yes; if order differs
      // we'd need to reindex — for now just bail on order mismatch.)
      let ok = true;
      for (let i = 0; i < photos.length; i++) {
        if (urls[i] !== photos[i]) { ok = false; break; }
      }
      if (!ok) continue;
      return sv;
    }
    return null;
  } catch {
    return null;
  }
}

async function updateGenerationLog(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  id: string | null,
  patch: GenerationLogPatch,
): Promise<void> {
  if (!id) return;
  try {
    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const [k, v] of Object.entries(patch)) {
      if (v !== undefined) row[k] = v;
    }
    const { error } = await supabase
      .from('pawtrait_generation_log')
      .update(row)
      .eq('id', id);
    if (error) console.error('[GEN_LOG_UPDATE_FAILED]', { id, error: error.message });
  } catch (err) {
    console.error('[GEN_LOG_UPDATE_THREW]', { id, error: (err as Error).message });
  }
}

// Substring fuzzy-match for breed strings: lowercased + trimmed; either side
// containing the other counts as a match. Catches "german shepherd" vs
// "german shepherd mix" / "tabby" vs "grey tabby".
function fuzzyMatch(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return !a && !b;  // both empty = match; one empty = mismatch
  const la = a.toLowerCase().trim();
  const lb = b.toLowerCase().trim();
  if (!la || !lb) return !la && !lb;
  if (la === lb) return true;
  return la.includes(lb) || lb.includes(la);
}

// Per-pet drift score. Weighted sum:
//   breed mismatch    = 0.5
//   fur color         = 0.2
//   eye color         = 0.15
//   ear shape         = 0.15
// Each weight only applies if BOTH source and output had a value (we don't
// penalise the model for a missing pre-pass field).
function computePetDrift(source: SubjectInfo, output: SubjectInfo): { score: number; flags: Record<string, boolean> } {
  const flags: Record<string, boolean> = {
    breed_changed: false,
    fur_diverged: false,
    eye_diverged: false,
    ear_diverged: false,
  };
  let score = 0;

  if (source.breed && output.breed && !fuzzyMatch(source.breed, output.breed)) {
    flags.breed_changed = true;
    score += 0.5;
  }
  if (source.furColor && output.furColor && !fuzzyMatch(source.furColor, output.furColor)) {
    flags.fur_diverged = true;
    score += 0.2;
  }
  if (source.eyeColor && output.eyeColor && !fuzzyMatch(source.eyeColor, output.eyeColor)) {
    flags.eye_diverged = true;
    score += 0.15;
  }
  if (source.earShape && output.earShape && !fuzzyMatch(source.earShape, output.earShape)) {
    flags.ear_diverged = true;
    score += 0.15;
  }
  return { score, flags };
}

// Aggregate drift across N pets. Multi-pet → average per-pet score; flags
// list is keyed by index. If output_vision has fewer entries than source we
// pad with empty SubjectInfos (treated as "missing fields, no penalty").
function computeDriftScore(
  source: SubjectInfo[],
  output: SubjectInfo[],
): { score: number; flags: Record<string, unknown> } {
  if (source.length === 0) return { score: 0, flags: {} };
  const flags: Record<string, unknown> = {};
  let total = 0;
  for (let i = 0; i < source.length; i++) {
    const out = output[i] ?? ({ species: 'pet' } as SubjectInfo);
    const { score, flags: petFlags } = computePetDrift(source[i], out);
    total += score;
    if (source.length === 1) {
      Object.assign(flags, petFlags);
    } else {
      flags[`pet_${i + 1}`] = petFlags;
    }
  }
  return { score: total / source.length, flags };
}

// Post-gen Vision pre-pass. Same contract as extractSubject; just a thin
// wrapper for clarity at the call-site (and so future changes to the
// post-gen check — different model, looser rules — have one place to live).
async function runPostGenVision(imageUrl: string): Promise<SubjectInfo> {
  return extractSubject(imageUrl);
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
  // SSRF defence — every photo URL must be HTTPS and from an allowed host.
  // Reject before we hand the URL to fal.run (which dereferences it server
  // side) or to OpenRouter Vision. See validateImageUrlOrigin for the list.
  for (let i = 0; i < photos.length; i++) {
    const reason = validateImageUrlOrigin(photos[i]);
    if (reason) {
      return res.status(400).json({
        error: 'invalid_image_url',
        photoIndex: i,
        message: `Image URL at index ${i} rejected (${reason}). Allowed sources: project Supabase storage, images.pexels.com, *.fal.media.`,
      });
    }
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
  //
  // Cache lookup (added 2026-05-10): if the same user has previously
  // generated with the EXACT same photos array, reuse the stored
  // source_vision from that run. Saves 12s on repeat-with-tweaked-prompt
  // and on the tweak/try-again loop. Per-photo cache (instead of whole-
  // array match) would catch more cases but the exact-match heuristic
  // covers the common path with zero risk of stale-vision leaking
  // across pets.
  const useVision = process.env.USE_SUBJECT_VISION !== 'false';
  const cached = useVision ? await lookupCachedVision(supabase, userId, photos) : null;
  const subjects: SubjectInfo[] = cached
    ? cached
    : useVision
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

  // ── Audit log — every credit-consumed generation gets a row in
  //    pawtrait_generation_log so support can answer "where's my portrait?"
  //    without grepping Vercel logs. The helpers swallow their own errors,
  //    so logging never blocks the customer's generation.
  const t0 = Date.now();
  const generationLogId = await insertGenerationLog(supabase, {
    user_id: userId,
    source_image_urls: photos,
    pet_count: photos.length,
    style_id: styleId ?? null,
    theme_id: themeId ?? null,
    custom_prompt: customPrompt || null,
    status: 'pending', // matches CHECK in 20260508_000000_pawtrait_generation_log.sql
  });

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

  // Async path: submit to fal queue, return job_id immediately, frontend polls
  // ?action=generation_status. The actual generation (8-55s for gpt-image-2)
  // and the rehost (5-30s) happen in the status handler. This keeps the submit
  // call <15s even if fal is busy, and customer sees progressive UI faster.
  // Refactor done 2026-05-10 — see [[01-projects/little-souls/pet-portraits]] B2.

  // Without a generation log row id we can't return a job_id the customer
  // can poll later. If the log insert failed, refund and surface 500 — the
  // alternative (proceed without a log row) leaves the customer stuck on a
  // spinner with no way to recover.
  if (!generationLogId) {
    await safeRefund({ supabase, accountId: userId, tokens: TOKENS_PER_GENERATION, reason: "log-insert-failed" });
    return res.status(500).json({ error: "Failed to create generation log (credit refunded)" });
  }

  try {
    const submit = await submitGenerationToFalQueue({
      imageUrls: photos,
      prompt: promptDef.prompt,
      negative: promptDef.negative,
    });

    if (submit.balanceExhausted) {
      await safeRefund({ supabase, accountId: userId, tokens: TOKENS_PER_GENERATION, reason: "fal-balance-exhausted" });
      await updateGenerationLog(supabase, generationLogId, {
        status: 'failed',
        error_text: 'fal-balance-exhausted',
        duration_ms: Date.now() - t0,
      });
      return balancePausedResponse(res);
    }

    if (submit.contentPolicyViolation) {
      await safeRefund({ supabase, accountId: userId, tokens: TOKENS_PER_GENERATION, reason: "content-policy-violation" });
      await updateGenerationLog(supabase, generationLogId, {
        status: 'failed',
        error_text: 'content_policy_violation: fal returned 422 at submit',
        duration_ms: Date.now() - t0,
      });
      return res.status(422).json({
        error: "content_policy_violation",
        message: "Our moderator flagged this generation. The most common cause is a pet name that resembles an unsafe word — try a different spelling or a nickname.",
        suggestion: "rename_or_remove_pet_name",
        creditRefunded: true,
      });
    }

    if (!submit.requestId) {
      await safeRefund({ supabase, accountId: userId, tokens: TOKENS_PER_GENERATION, reason: "submit-failed", metadata: { submitError: submit.submitError } });
      await updateGenerationLog(supabase, generationLogId, {
        status: 'failed',
        error_text: `submit_failed: ${submit.submitError ?? 'unknown'}`,
        duration_ms: Date.now() - t0,
      });
      return res.status(502).json({ error: "Generation submit failed (credit refunded)", detail: submit.submitError ?? null });
    }

    // Persist the fal request_id + model + Vision pre-pass + prompt so the
    // status handler can resume from a fresh function invocation (or after
    // a customer page refresh) without re-running anything expensive.
    // status_url + response_url are stored in metadata because fal's status
    // path differs from the submit path for action-suffixed models (e.g.
    // submit goes to openai/gpt-image-2/edit but status is at the base
    // openai/gpt-image-2 path). We use fal's authoritative URLs verbatim
    // instead of reconstructing.
    await updateGenerationLog(supabase, generationLogId, {
      status: 'pending', // job in fal queue or running
      fal_request_id: submit.requestId,
      fal_model: submit.model ?? GPT_IMAGE_PRIMARY_MODEL,
      source_vision: subjects,
      prompt_sent: promptDef.prompt,
      negative_prompt: promptDef.negative,
      metadata: {
        submitted_at_ms: Date.now() - t0,
        composition_id: promptDef.compositionId,
        fal_status_url: submit.statusUrl,
        fal_response_url: submit.responseUrl,
      },
    });

    // 202 Accepted — Vision pre-pass results are returned now so the UI
    // can show "We see your German Shepherd, generating now..." while the
    // image generates. Frontend polls /api/portraits?action=generation_status
    // &job_id={generationLogId} every 2.5s until status === 'completed'.
    return res.status(202).json({
      status: 'submitted',
      job_id: generationLogId,
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
    await updateGenerationLog(supabase, generationLogId, {
      status: 'failed',
      error_text: `exception: ${(err as Error).message}`,
      duration_ms: Date.now() - t0,
    });
    return res.status(500).json({ error: "Generation submit failed (credit refunded)", detail: (err as Error).message });
  }
}

// ─── handleGenerationStatus — poll a fal queue job ───────────────────────────
// GET /api/portraits?action=generation_status&job_id={pawtrait_generation_log.id}
// Authenticated. Looks up the log row, verifies ownership, then:
//   - status='success'  → returns cached variants (idempotent re-poll, no fal call)
//   - status='failed'   → returns cached failure (idempotent re-poll, no refund)
//   - status='pending'  → polls fal queue. On COMPLETED: rehosts, marks success, returns variants.
//                         On in-progress: returns {status:'pending', queue_position?}.
//                         On failure: refunds (once), marks failed, returns failure.
//
// Idempotency: every terminal state is recorded on the log row before we
// return it. Re-polls after success or failure are pure DB reads — no
// fal hit, no refund. Two concurrent polls hitting COMPLETED at the same
// time can both run rehost (rehost writes to a UUID-named bucket path so
// no overwrite collision) but only the first updates the log to success;
// the second sees status='success' on its next poll and returns the
// already-stored URL. Customer never sees double charge or double image.
async function handleGenerationStatus(req: VercelRequest, res: VercelResponse) {
  if (!FAL_KEY) return res.status(500).json({ error: "FAL_KEY not configured" });

  const jobId = (req.query.job_id ?? req.query.jobId ?? '') as string;
  if (!jobId || typeof jobId !== 'string' || !/^[0-9a-f-]{30,40}$/i.test(jobId)) {
    return res.status(400).json({ error: "job_id required (uuid)" });
  }

  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Sign in required" });
  }
  const token = auth.slice("Bearer ".length);
  const supabase = getSupabaseAdmin();
  const { data: userRes, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userRes.user) return res.status(401).json({ error: "Invalid token" });
  const userId = userRes.user.id;

  // Look up the log row + verify ownership in one query.
  const { data: log, error: logErr } = await supabase
    .from('pawtrait_generation_log')
    .select('id, user_id, status, fal_request_id, fal_model, output_image_url, source_vision, prompt_sent, error_text, pet_count, source_image_urls, metadata')
    .eq('id', jobId)
    .single();
  if (logErr || !log) {
    return res.status(404).json({ error: "Job not found" });
  }
  if (log.user_id !== userId) {
    // Don't leak whether the job exists for someone else.
    return res.status(404).json({ error: "Job not found" });
  }

  const subjects: SubjectInfo[] = Array.isArray(log.source_vision)
    ? log.source_vision as SubjectInfo[]
    : Array.from({ length: log.pet_count ?? 1 }, () => ({ species: 'pet' } as SubjectInfo));

  // Terminal states — return cached without touching fal.
  if (log.status === 'success' && log.output_image_url) {
    return res.status(200).json({
      status: 'completed',
      job_id: log.id,
      variants: [{ url: log.output_image_url, composition: 'portrait' }],
      subject: subjects[0],
      subjects,
      prompts: log.prompt_sent ? [log.prompt_sent] : [],
    });
  }
  if (log.status === 'failed' || log.status === 'refunded') {
    return res.status(200).json({
      status: 'failed',
      job_id: log.id,
      error: log.error_text ?? 'generation_failed',
      creditRefunded: true,
    });
  }

  // Still pending. Need the fal status_url + response_url stored in metadata
  // at submit time. If missing, the submit never persisted them — refund
  // (defensive; submit normally writes them before returning 202).
  const meta = (log.metadata ?? {}) as Record<string, unknown>;
  const statusUrl = typeof meta.fal_status_url === 'string' ? meta.fal_status_url : null;
  const responseUrl = typeof meta.fal_response_url === 'string' ? meta.fal_response_url : null;
  if (!log.fal_request_id || !statusUrl || !responseUrl) {
    await safeRefund({ supabase, accountId: userId, tokens: TOKENS_PER_GENERATION, reason: "missing_fal_urls" });
    await updateGenerationLog(supabase, log.id, {
      status: 'failed',
      error_text: 'missing fal status/response url at status check',
    });
    return res.status(200).json({
      status: 'failed',
      job_id: log.id,
      error: 'job_state_lost',
      creditRefunded: true,
    });
  }

  const poll = await pollFalQueueStatus(statusUrl, responseUrl);

  if (poll.status === 'pending') {
    return res.status(200).json({
      status: 'pending',
      job_id: log.id,
      queue_position: poll.queuePosition ?? null,
    });
  }

  if (poll.status === 'failed') {
    await safeRefund({
      supabase,
      accountId: userId,
      tokens: TOKENS_PER_GENERATION,
      reason: poll.contentPolicyViolation ? "content-policy-violation" : "fal-job-failed",
      metadata: { fal_request_id: log.fal_request_id, fal_error: poll.error },
    });
    await updateGenerationLog(supabase, log.id, {
      status: 'failed',
      error_text: poll.error ?? 'fal_job_failed',
    });
    if (poll.contentPolicyViolation) {
      return res.status(200).json({
        status: 'failed',
        job_id: log.id,
        error: 'content_policy_violation',
        message: "Our moderator flagged this generation. The most common cause is a pet name that resembles an unsafe word — try a different spelling or a nickname.",
        suggestion: 'rename_or_remove_pet_name',
        creditRefunded: true,
      });
    }
    return res.status(200).json({
      status: 'failed',
      job_id: log.id,
      error: poll.error ?? 'generation_failed',
      creditRefunded: true,
    });
  }

  // poll.status === 'completed' — rehost + persist + return.
  if (!poll.imageUrl) {
    // Defensive: should never happen (status returns imageUrl on completed).
    await safeRefund({ supabase, accountId: userId, tokens: TOKENS_PER_GENERATION, reason: "completed_but_no_url" });
    await updateGenerationLog(supabase, log.id, { status: 'failed', error_text: 'completed_but_no_url' });
    return res.status(502).json({ status: 'failed', job_id: log.id, error: 'completed_but_no_url', creditRefunded: true });
  }

  const durableUrl = await rehostFalImage(supabase, poll.imageUrl);

  await updateGenerationLog(supabase, log.id, {
    status: 'success',
    output_image_url: durableUrl,
    cost_usd: GPT_IMAGE_COST_USD + VISION_COST_USD * (log.pet_count ?? 1),
    // duration_ms is intentionally not bumped here — it's the submit-to-now
    // total since insert, which is more useful than the queue wait time.
  });

  return res.status(200).json({
    status: 'completed',
    job_id: log.id,
    variants: [{ url: durableUrl, composition: 'portrait' }],
    subject: subjects[0],
    subjects,
    prompts: log.prompt_sent ? [log.prompt_sent] : [],
  });
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

  // ── Auth — Bearer JWT required ──────────────────────────────────────────
  // Photoroom + HuggingFace cutouts cost real money on every call (Photoroom
  // ~$0.02, HF inference quota burn). The endpoint was previously open, which
  // meant anyone could grind it from a script. Match handleGenerate's pattern:
  // require a Supabase JWT, validate via the admin client, reject 401 otherwise.
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Sign in to cut out a portrait" });
  }
  const token = auth.slice("Bearer ".length);
  const adminClient = getSupabaseAdmin();
  const { data: userRes, error: userErr } = await adminClient.auth.getUser(token);
  if (userErr || !userRes.user) return res.status(401).json({ error: "Invalid token" });

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
    // SECURITY: template print masters go to the PRIVATE bucket. Browser gets
    // a storage path, not a URL. Fulfilment fetches via admin client. Closes
    // the same DevTools-snipe hole that the AI flow had pre-2026-05-12.
    const path = `print-masters/${crypto.randomUUID()}.png`;
    const { error: upErr } = await supabase.storage.from("pet-photos-private").upload(path, pngBuf, { contentType: "image/png", cacheControl: "31536000", upsert: false });
    if (upErr) return res.status(500).json({ error: "Print master upload failed", detail: upErr.message });
    return res.status(200).json({ printMasterPath: path, printMasterBucket: "pet-photos-private", sizePx: PRINT_SIZE });
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

// Explicit column lists for the unauthenticated read ops (list / get / gallery).
// .select('*') leaks every column added to pawtrait_library in the future
// (including, today, generation_cost_usd which is internal audit data).
// Posters need the prompt + media fields; the public gallery only needs the
// trimmed gallery view. Anything beyond these has to be added consciously.
const LIBRARY_LIST_COLUMNS = [
  'id',
  'pet_kind', 'breed', 'pet_name',
  'image_style', 'art_style',
  'home_setting', 'pet_action', 'canvas_format',
  'aspect_ratio',
  'prompt', 'negative_prompt',
  'backstory', 'story_long',
  'captions',
  'image_path', 'image_url',
  'thumbnail_path', 'thumbnail_url',
  'width', 'height',
  'quality_score', 'quality_notes',
  'approved', 'approved_at',
  'generated_by', 'generation_model',
  'created_at', 'updated_at',
].join(',');

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
      .select(LIBRARY_LIST_COLUMNS)
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
      .select(LIBRARY_LIST_COLUMNS)
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

// ─── handleInstantSignup — passwordless OTP signup ──────────────────────────
// Body: { email, visitorId?, honeypot? }
//
// Flow (uniform for new + existing emails — no enumeration oracle):
//   - signInWithOtp({ shouldCreateUser: true }) emails a 6-digit OTP. New
//     emails: account is created when the user verifies the OTP; visitor_id
//     flows through `options.data` into raw_user_meta_data so the trigger
//     can do email-alias + device-fingerprint dedup.
//   - Server response is identical regardless of whether the email was
//     already registered. Client always routes to OTP-entry.
//
// SECURITY HISTORY: previously this endpoint created the user via admin
// createUser and returned the magic-link OTP in the response so the client
// could call verifyOtp() locally and skip the email roundtrip. That meant
// anyone could POST any email and receive a working OTP, then use it to
// authenticate as that account — full account takeover for the entire
// customer base. Removed 2026-05-09. Do not re-introduce a path that
// returns OTP material in the HTTP response.
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

  // Send OTP via email. shouldCreateUser:true means a new auth.users row is
  // inserted only when the recipient verifies the OTP — the trigger fires at
  // that point with raw_user_meta_data populated from options.data, so the
  // email-alias + visitor_id dedup logic still runs.
  //
  // For existing emails this just sends a sign-in OTP. The response is the
  // same either way, so the caller cannot distinguish "new" from "existing"
  // (no user-enumeration oracle).
  const { error: otpErr } = await supabaseAdmin.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      data: visitorId ? { visitor_id: visitorId } : undefined,
    },
  });
  if (otpErr) {
    console.error('[instant-signup] signInWithOtp failed:', { email, status: otpErr.status, message: otpErr.message });
    return res.status(500).json({ error: 'otp_send_failed' });
  }

  // otpLength is read from env (mirrors Supabase dashboard "Email OTP Length").
  // Default 6 — bump if you change the dashboard value to 7 or 8.
  const otpLength = Number(process.env.SUPABASE_EMAIL_OTP_LENGTH ?? '6') || 6;
  return res.status(200).json({
    status: 'otp_sent',
    email,
    otpLength,
    message: 'Check your email for a sign-in code.',
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

// ─── Large-format SKU gate ─────────────────────────────────────────────────
// gpt-image-2 caps at 2048 on the long edge, which means a 24×36" SKU at
// 2048×3072 prints at ~85 DPI vs Gelato's 150 floor. Until we have a
// production-verified upscaling path that holds identity at 4× on real
// AuraSR outputs (currently 4× upscale x 2048 = 8192 — borderline for 24×36
// but unverified at 24×32 / 24×36 visual quality), we block large SKUs
// behind a feature flag.
//
// To unblock:
//   1. Run scripts/test-print-pipeline.ts against 5+ orders at each blocked
//      size, eyeball + blur-detect on the upscaled output.
//   2. Once visually approved, set LARGE_FORMAT_ENABLED=true in Vercel.
//   3. Roll out to one SKU at a time by tightening LARGE_FORMAT_LONG_EDGE
//      (override env) rather than removing this gate entirely.
const LARGE_FORMAT_ENABLED = (process.env.LARGE_FORMAT_ENABLED ?? 'false').toLowerCase() === 'true';
// Long edge in inches above which we block. Override via env if you want to
// unblock 24x24 (long edge 24) but keep 24x32/24x36 blocked.
const LARGE_FORMAT_LONG_EDGE_IN = Number(process.env.LARGE_FORMAT_LONG_EDGE_IN ?? 16);

interface SkuSizeInfo {
  sizeKey: string;
  /** Long edge in inches. */
  longEdgeIn: number;
  blocked: boolean;
}

function sizeForSku(sku: string): SkuSizeInfo | null {
  // sku is the raw size key e.g. '16x20', '24x36'. Parse W and H, derive long
  // edge. Returns null on unknown SKU so callers can 400 cleanly.
  const m = /^(\d+)x(\d+)$/.exec(sku);
  if (!m) return null;
  const w = Number(m[1]);
  const h = Number(m[2]);
  if (!Number.isFinite(w) || !Number.isFinite(h)) return null;
  const longEdgeIn = Math.max(w, h);
  const blocked = !LARGE_FORMAT_ENABLED && longEdgeIn > LARGE_FORMAT_LONG_EDGE_IN;
  return { sizeKey: sku, longEdgeIn, blocked };
}

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
    shopifyOrderId?: string;
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

  // ── Large-format gate (LARGE_FORMAT_ENABLED feature flag) ───────────────
  // 24×36" at 2048×3072 = 85 DPI — well below Gelato's 150 floor. Block
  // until upscaling has been verified against real production samples. See
  // sizeForSku comment block for the unblock checklist.
  const sizeInfo = sizeForSku(sizeKey);
  if (sizeInfo?.blocked) {
    return res.status(503).json({
      error: "size_temporarily_unavailable",
      message: "This size is temporarily unavailable",
      sizeKey,
      longEdgeIn: sizeInfo.longEdgeIn,
    });
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
  const userId = userRes.user.id;

  // ── Order ownership check ───────────────────────────────────────────────
  // The print-master regen costs ~$0.10–$0.20 per call out of canvas margin.
  // Without an ownership check, an authenticated user could trigger arbitrary
  // print-master regenerations against any shopifyOrderId — including orders
  // that belong to other customers. We require the caller's user_id to match
  // the user_id recorded against the shopify order at checkout time.
  //
  // print_orders.user_id ownership check (table shipped 2026-05-08 per
  // migration 20260508_120000_print_orders_and_pawtrait_touchpoints.sql).
  // No-ops if shopifyOrderId is absent (legacy webhook callers).
  const shopifyOrderId = typeof body.shopifyOrderId === 'string' ? body.shopifyOrderId : '';
  if (shopifyOrderId) {
    const { data: orderRow, error: orderErr } = await supabase
      .from('print_orders')
      .select('user_id')
      .eq('shopify_order_id', shopifyOrderId)
      .maybeSingle();
    if (orderErr) return res.status(500).json({ error: 'order_lookup_failed', detail: orderErr.message });
    // If row missing, treat as legacy webhook caller (no print_orders record yet) — allow.
    // If row present and user_id is set, must match the JWT user.
    if (orderRow && orderRow.user_id && orderRow.user_id !== userId) {
      return res.status(403).json({ error: 'order_ownership_mismatch' });
    }
  }

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
    // PrintMaster forces quality:'high' regardless of GPT_IMAGE_QUALITY env.
    // The env default ('medium') is right for customer previews — this is the
    // paid-for canvas, customer expects framed-wall-art polish.
    const result = await generateVariant({
      imageUrls: photos,
      prompt: fullPrompt,
      negative,
      imageSize: aspect.print,
      quality: 'high',
    });

    if (result.balanceExhausted) {
      return balancePausedResponse(res);
    }
    if (!result.url) {
      return res.status(502).json({ error: "print_master_generation_failed" });
    }

    // SECURITY: rehost the fal.media URL to our PRIVATE bucket and return
    // only the storage path. Customer never sees a working URL — fulfilment
    // pipelines fetch via admin client. (Was: returned fal.media URL directly
    // to the browser, which was harvestable via DevTools for free 3000px PNG.)
    const privatePath = await rehostFalImagePrivate(supabase, result.url);
    if (!privatePath) {
      return res.status(502).json({ error: "print_master_rehost_failed" });
    }

    // Cost estimate — gpt-image-2 high quality at 2048×N is roughly $0.10–
    // $0.20 per image depending on aspect (per fal pricing 2026-05-07).
    // PrintMaster always uses high; cost is fixed.
    const costEstimate = 0.16;

    return res.status(200).json({
      printMasterPath: privatePath,
      printMasterBucket: "pet-photos-private",
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

// ─── handlePrintMasterSubmit — async print master via fal queue ────────────
// New 2026-05-11 endpoint. Mirrors handlePrintMaster's validation and prompt
// build, but submits to queue.fal.run instead of sync fal.run. Returns the
// fal status_url + response_url to the client; client polls
// printMaster_status until completion. Decouples the customer's cart-add
// experience from Vercel function lifetime — even a slow 3-min fal day
// doesn't show "couldn't prepare print master" toast.
async function handlePrintMasterSubmit(req: VercelRequest, res: VercelResponse) {
  if (!FAL_KEY) return res.status(500).json({ error: "FAL_KEY not configured" });

  const body = (req.body ?? {}) as {
    imageUrls?: string[];
    petNames?: string[];
    customPrompt?: string;
    sizeKey?: string;
  };
  const customPrompt = sanitiseAddDetails(body.customPrompt ?? "").slice(0, 400);
  if (!customPrompt) return res.status(400).json({ error: "customPrompt required" });
  const sizeKey = typeof body.sizeKey === 'string' ? body.sizeKey : '';
  if (!sizeKey) return res.status(400).json({ error: "sizeKey required" });
  const aspectKey = SKU_TO_ASPECT[sizeKey];
  if (!aspectKey) {
    return res.status(400).json({
      error: "unknown_size_key",
      message: `sizeKey '${sizeKey}' not recognised. Valid: ${Object.keys(SKU_TO_ASPECT).join(', ')}`,
    });
  }
  const aspect = ASPECTS.find((a) => a.key === aspectKey);
  if (!aspect) return res.status(500).json({ error: "aspect_lookup_failed", aspectKey });

  const sizeInfo = sizeForSku(sizeKey);
  if (sizeInfo?.blocked) {
    return res.status(503).json({
      error: "size_temporarily_unavailable",
      message: "This size is temporarily unavailable",
      sizeKey,
      longEdgeIn: sizeInfo.longEdgeIn,
    });
  }

  const photos: string[] = Array.isArray(body.imageUrls)
    ? body.imageUrls.filter((u): u is string => typeof u === 'string' && u.length > 0)
    : [];
  if (photos.length === 0) return res.status(400).json({ error: "imageUrls required (1–4 source pet photos)" });
  if (photos.length > 4) return res.status(400).json({ error: "max_pets_exceeded", message: "printMaster supports up to 4 pets per portrait." });
  // SSRF check on every source URL
  for (let i = 0; i < photos.length; i++) {
    const reason = validateImageUrlOrigin(photos[i]);
    if (reason) {
      return res.status(400).json({ error: 'invalid_image_url', photoIndex: i, message: `Image URL at index ${i} rejected (${reason}).` });
    }
  }
  const rawNames: string[] = Array.isArray(body.petNames)
    ? body.petNames.map((n) => typeof n === 'string' ? n : '')
    : [];
  const names: string[] = photos.map((_, i) => sanitisePetName(rawNames[i] ?? ''));

  // Auth — Bearer JWT required
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Sign in to generate print master" });
  const token = auth.slice("Bearer ".length);
  const supabase = getSupabaseAdmin();
  const { data: userRes, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userRes.user) return res.status(401).json({ error: "Invalid token" });
  const userId = userRes.user.id;

  // Vision pre-pass (with cache from generation if same photos)
  const useVision = process.env.USE_SUBJECT_VISION !== 'false';
  const cached = useVision ? await lookupCachedVision(supabase, userId, photos) : null;
  const subjects: SubjectInfo[] = cached
    ? cached
    : useVision
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

  const aspectLabel = aspect.label;
  const aspectInstruction = `Output: ${aspectLabel} canvas composition at print resolution, painterly cinematic finish, premium polish for framed wall art, edge-to-edge composition with no visible margins, no whitespace borders.`;
  const fullPrompt = buildMultiPetCustomPrompt({ subjects, names, customPrompt, aspectInstruction });
  const baseNegative = "low quality, distorted, deformed, plastic, cartoon glitches, blurry, weird anatomy, watermark";
  const anyName = names.some(n => n.length > 0);
  const negative = anyName
    ? `${baseNegative}, misspelled text, garbled letters, illegible typography, gibberish text, multiple names${photos.length > 1 ? ', merged pets, blended pets, hybrid pet, fused features' : ''}`
    : `${baseNegative}, text overlay${photos.length > 1 ? ', merged pets, blended pets, hybrid pet, fused features' : ''}`;

  // Submit to fal queue at print quality + dimensions
  const submit = await submitGenerationToFalQueue({
    imageUrls: photos,
    prompt: fullPrompt,
    negative,
    imageSize: aspect.print,
    quality: 'high',
  });

  if (submit.balanceExhausted) return balancePausedResponse(res);
  if (submit.contentPolicyViolation) {
    return res.status(422).json({
      error: "content_policy_violation",
      message: "Our moderator flagged this print master.",
      creditRefunded: false, // No credit consumed for printMaster
    });
  }
  if (!submit.requestId || !submit.statusUrl || !submit.responseUrl) {
    return res.status(502).json({ error: "print_master_submit_failed", detail: submit.submitError });
  }

  return res.status(202).json({
    status: 'submitted',
    request_id: submit.requestId,
    fal_status_url: submit.statusUrl,
    fal_response_url: submit.responseUrl,
    aspect: aspect.key,
    sizeKey,
    width: aspect.print.width,
    height: aspect.print.height,
    subjects,
    prompt: fullPrompt,
  });
}

// Helper: validate that a URL is a fal queue URL (and matches the expected
// /requests/<uuid>/status or /requests/<uuid> path). Defends printMaster_status
// from being tricked into proxying arbitrary URLs (SSRF / API-token leakage
// via Authorization header). Pattern matches what fal returns at submit:
//   https://queue.fal.run/{model}/requests/{request_id}/status
//   https://queue.fal.run/{model}/requests/{request_id}
function isValidFalQueueUrl(u: string): boolean {
  if (typeof u !== 'string' || u.length > 500) return false;
  try {
    const url = new URL(u);
    if (url.protocol !== 'https:') return false;
    if (url.hostname !== 'queue.fal.run') return false;
    // Path must contain /requests/<uuid-ish>
    return /\/requests\/[0-9a-f-]{20,}(?:\/[a-z]+)?$/i.test(url.pathname);
  } catch {
    return false;
  }
}

// ─── handlePrintMasterStatus — poll fal queue for in-flight print master ──
// Body: { fal_status_url, fal_response_url } from the submit response.
// Returns: { status: 'pending' | 'completed' | 'failed', printMasterUrl?, error? }
// On completion: rehosts the fal output to durable Supabase storage (the
// print master URL travels through Shopify line-item-properties and gets
// fetched by Gelato hours/days later — fal.media URLs expire ~24h).
async function handlePrintMasterStatus(req: VercelRequest, res: VercelResponse) {
  if (!FAL_KEY) return res.status(500).json({ error: "FAL_KEY not configured" });

  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Sign in required" });
  const token = auth.slice("Bearer ".length);
  const supabase = getSupabaseAdmin();
  const { data: userRes, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userRes.user) return res.status(401).json({ error: "Invalid token" });

  const body = (req.body ?? {}) as { fal_status_url?: string; fal_response_url?: string };
  const statusUrl = body.fal_status_url ?? '';
  const responseUrl = body.fal_response_url ?? '';
  if (!isValidFalQueueUrl(statusUrl) || !isValidFalQueueUrl(responseUrl)) {
    return res.status(400).json({ error: "invalid_fal_urls" });
  }

  const poll = await pollFalQueueStatus(statusUrl, responseUrl);

  if (poll.status === 'pending') {
    return res.status(200).json({ status: 'pending', queue_position: poll.queuePosition ?? null });
  }
  if (poll.status === 'failed') {
    return res.status(200).json({
      status: 'failed',
      error: poll.error ?? 'print_master_failed',
      contentPolicyViolation: poll.contentPolicyViolation ?? false,
    });
  }
  // Completed — rehost to PRIVATE bucket and return path (NOT URL).
  // SECURITY: see rehostFalImagePrivate doc — closes the print-master URL
  // exposure where customer could grab the public URL via DevTools.
  if (!poll.imageUrl) {
    return res.status(200).json({ status: 'failed', error: 'completed_but_no_url' });
  }
  const privatePath = await rehostFalImagePrivate(supabase, poll.imageUrl);
  if (!privatePath) {
    return res.status(200).json({ status: 'failed', error: 'rehost_failed' });
  }
  return res.status(200).json({
    status: 'completed',
    printMasterPath: privatePath,
    printMasterBucket: 'pet-photos-private',
    costEstimate: 0.16,
  });
}

// ─── handleRedeemDownloadCredit — subscriber redeems a digital download credit ──
//
// Pass + Elite subscribers get a monthly allowance of digital downloads (3 and
// 999 respectively). Instead of going through Stripe checkout for £19, they
// hit this endpoint with a cart item to:
//   1. Verify auth (must be logged in)
//   2. Atomically deduct one download credit via consume_download_credit()
//   3. Fire runDigitalFulfillment directly (rehost + email signed link)
//
// Bypasses Shopify entirely — no order record, no Stripe charge. The audit
// trail lives in portraits_credit_transactions (credit_type='download').
//
// Body: {
//   printMasterPath?: string   // preferred (private bucket)
//   printMasterUrl?: string    // legacy fallback for in-flight carts
//   previewUrl?: string
//   petName?: string
// }
// Returns: { ok: true, downloadUrl, balance } on success.
// Returns: { ok: false, reason: "no_credits" | "auth" | "fulfilment_failed" } on failure.
async function handleRedeemDownloadCredit(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, reason: "method_not_allowed" });
  }
  const authHeader = String(req.headers.authorization ?? "");
  const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!accessToken) return res.status(401).json({ ok: false, reason: "auth" });

  const supabase = getSupabaseAdmin();
  const { data: userRes, error: userErr } = await supabase.auth.getUser(accessToken);
  if (userErr || !userRes.user) return res.status(401).json({ ok: false, reason: "auth" });
  const userId = userRes.user.id;
  const userEmail = userRes.user.email ?? null;
  if (!userEmail) return res.status(400).json({ ok: false, reason: "no_email_on_account" });

  const body = (req.body ?? {}) as {
    printMasterPath?: string;
    printMasterUrl?: string;
    previewUrl?: string;
    petName?: string;
  };
  if (!body.printMasterPath && !body.printMasterUrl) {
    return res.status(400).json({ ok: false, reason: "missing_print_master" });
  }

  // 1. Atomic credit deduction. Returns false if balance is 0.
  const { data: consumed, error: consumeErr } = await supabase.rpc("consume_download_credit", {
    p_account_id: userId,
  });
  if (consumeErr) {
    console.error("[redeem-download] consume_failed", JSON.stringify({ userId, error: consumeErr.message }));
    return res.status(500).json({ ok: false, reason: "credit_check_failed" });
  }
  if (consumed !== true) {
    return res.status(402).json({ ok: false, reason: "no_credits" });
  }

  // 2. Generate a unique pseudo-order ref so the fulfilment pipeline writes a
  //    distinct storage path. Real Shopify order id is null here — this is a
  //    credit-redemption, not a paid order.
  const redemptionRef = `cred-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  // Encode into the shopifyOrderId/lineItemId surfaces expected by runDigitalFulfillment
  // (which keys storage path off ls-{orderId}-{lineItemId}). Use a synthetic
  // 13-digit prefix so it's distinguishable from real Shopify ids (which are 12+).
  const fakeOrderId = Math.floor(Date.now());
  const fakeLineItemId = Math.floor(Math.random() * 1e9);

  const result = await runDigitalFulfillment({
    shopifyOrderId: fakeOrderId,
    shopifyLineItemId: fakeLineItemId,
    customerEmail: userEmail,
    printMasterPath: body.printMasterPath ?? null,
    printMasterUrl: body.printMasterUrl ?? null,
    petName: body.petName ?? null,
    previewUrl: body.previewUrl ?? null,
  });

  if (result.ok === false) {
    const stage = result.stage;
    const reason = result.reason;
    // Refund the credit — fulfilment failed for reasons outside the customer's control.
    await supabase.rpc("grant_download_credits", {
      p_account_id: userId,
      p_amount: 1,
      p_reason: "fulfilment_failed_refund",
      p_metadata: { redemption_ref: redemptionRef, stage, reason },
    });
    console.error("[redeem-download] fulfilment_failed", JSON.stringify({
      userId, redemptionRef, stage, reason,
    }));
    return res.status(500).json({ ok: false, reason: "fulfilment_failed", stage });
  }

  // 3. Read back the new balance for the UI.
  const { data: creditsRow } = await supabase
    .from("portraits_credits")
    .select("download_credits")
    .eq("account_id", userId)
    .single();

  return res.status(200).json({
    ok: true,
    downloadUrl: result.downloadUrl,
    balance: creditsRow?.download_credits ?? 0,
    redemptionRef,
  });
}
