/**
 * Gelato print pipeline — Phase 9 of the launch plan.
 *
 *   chosen variant URL  →  AuraSR 4× upscale  →  pre-flight gate  →  Gelato Order API v4
 *
 * This is the most critical path in the system: every canvas order goes
 * through here. Without the upscale + pre-flight, every print would land
 * below Gelato's 150 DPI floor and arrive visibly soft.
 *
 * Spec sources:
 *   - research-2026-05-05-gelato-print-quality.md TL;DR + §3 + §6 + §7
 *   - launch-plan-2026-05-05.md Phase 9
 *
 * Defensive design:
 *   - every fetch has a timeout
 *   - every error path returns a typed PrintPipelineResult, not a thrown
 *     exception
 *   - 4xx from Gelato: do NOT retry (we sent something wrong)
 *   - 5xx / network from Gelato: retry once after 2s
 *   - upscale + pre-flight failure: re-run AuraSR ONCE, then escalate to
 *     manual_review — never auto-submit a soft print to Gelato
 */

import { gelatoProductUid, gelatoUnframedProductUid, CANVAS_SIZES, type FrameColor } from "../../src/components/portraits/gelatoFramedCanvas.js";
import { preflightImage, type PreflightMetrics, type PreflightResult } from "./preflight.js";
import { getSupabaseAdmin } from "./supabaseAdmin.js";

// ─── Public types ───────────────────────────────────────────────────────────

export type GelatoAddress = {
  firstName: string;
  lastName: string;
  companyName?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postCode: string;
  state?: string;
  country: string; // ISO 3166-1 alpha-2 (e.g. "GB")
  email: string;
  phone?: string;
};

export type PrintPipelineInput = {
  sourceImageUrl: string;
  sizeKey: string;
  /** null = unframed slim canvas; one of the 3 wood tones = framed canvas. */
  frameColor: FrameColor | null;
  shippingAddress: GelatoAddress;
  customerEmail: string;
  shopifyOrderId: number;
  shopifyLineItemId: number;
  petName?: string;
  /**
   * Settlement currency to send to Gelato. Defaults to 'GBP' (Shopify shop's
   * home currency). Must match Gelato's price-list currency for the SKU or
   * the order is 4xx-rejected.
   */
  currency?: string;
  /**
   * Gelato shipping method (e.g. 'normal', 'express'). Defaults to 'normal'.
   * Without this set, Gelato may reject the order or default to express.
   */
  shipmentMethodUid?: string;
  /**
   * If true, skip the actual Gelato POST. Returns the assembled body so a
   * caller can inspect it. Used by scripts/test-print-pipeline.ts.
   */
  dryRun?: boolean;
};

export type PrintPipelineStage =
  | "upscale"
  | "preflight"
  | "gelato_submit"
  | "manual_review";

export type PrintPipelineResult =
  | {
      ok: true;
      gelatoOrderId: string;
      gelatoOrderRef: string;
      preflightMetrics: PreflightMetrics;
      upscaledImageUrl: string;
    }
  | {
      ok: true;
      dryRun: true;
      preflightMetrics: PreflightMetrics;
      upscaledImageUrl: string;
      gelatoRequestBody: GelatoOrderRequest;
    }
  | {
      ok: false;
      stage: PrintPipelineStage;
      reason: string;
      details?: unknown;
      preflightMetrics?: PreflightMetrics;
      upscaledImageUrl?: string;
    };

// ─── Internal config ────────────────────────────────────────────────────────
// NOTE: read env vars at call time, not module-init time, so test scripts that
// load .env after imports still work (Vercel runtime reads them eagerly anyway).
const getFalKey = () => process.env.FAL_KEY;
const getGelatoKey = () => process.env.GELATO_API_KEY;

const FAL_AURA_SUBMIT = "https://queue.fal.run/fal-ai/aura-sr";
const FAL_QUEUE_BASE = "https://queue.fal.run/fal-ai/aura-sr"; // status + result endpoints
const GELATO_ORDER_ENDPOINT = "https://order.gelatoapis.com/v4/orders";

const FETCH_TIMEOUT_DOWNLOAD_MS = 30_000;
const FETCH_TIMEOUT_GELATO_MS = 30_000;
const FAL_QUEUE_POLL_INTERVAL_MS = 1_500;
const FAL_QUEUE_TIMEOUT_MS = 180_000; // 3 min — AuraSR typically 3-8s, be generous
const GELATO_5XX_RETRY_DELAY_MS = 2_000;

// ─── Logging ────────────────────────────────────────────────────────────────

type LogContext = Record<string, unknown>;
function log(stage: string, ctx: LogContext) {
  // Structured single-line console logs so Vercel's log viewer + Sentry can
  // index them. Pipeline is critical, prefer too-much over too-little.
  // eslint-disable-next-line no-console
  console.log(`[printPipeline] ${stage}`, JSON.stringify(ctx));
}
function logError(stage: string, ctx: LogContext) {
  // eslint-disable-next-line no-console
  console.error(`[printPipeline] ${stage}`, JSON.stringify(ctx));
}

// ─── Public entrypoint ──────────────────────────────────────────────────────

export async function runPrintPipeline(
  input: PrintPipelineInput,
): Promise<PrintPipelineResult> {
  // 0. Sanity: env vars
  if (!getFalKey()) {
    return errResult("upscale", "FAL_KEY env var is not configured");
  }
  if (!getGelatoKey() && !input.dryRun) {
    return errResult("gelato_submit", "GELATO_API_KEY env var is not configured");
  }

  // 1. Resolve productUid from catalog. null frameColor = unframed slim canvas.
  const productUid = input.frameColor === null
    ? gelatoUnframedProductUid(input.sizeKey)
    : gelatoProductUid(input.sizeKey, input.frameColor);
  if (!productUid) {
    return errResult(
      "gelato_submit",
      `unknown (size, frame) pair: sizeKey=${input.sizeKey} frameColor=${input.frameColor}`,
    );
  }

  log("start", {
    sizeKey: input.sizeKey,
    frameColor: input.frameColor,
    productUid,
    shopifyOrderId: input.shopifyOrderId,
    shopifyLineItemId: input.shopifyLineItemId,
    dryRun: input.dryRun ?? false,
  });

  // 2. Upscale + pre-flight loop (max 2 attempts)
  let upscaledImageUrl: string | null = null;
  let preflightResult: PreflightResult | null = null;
  let lastUpscaleError: string | null = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    log("upscale_attempt", { attempt, sourceImageUrl: input.sourceImageUrl });

    const upscale = await runAuraSR(input.sourceImageUrl);
    if (upscale.ok === true) {
      upscaledImageUrl = upscale.url;
      log("upscale_done", { attempt, upscaledImageUrl });
    } else {
      lastUpscaleError = upscale.error;
      logError("upscale_failed", { attempt, error: upscale.error });
      if (attempt === 2) {
        return errResult("upscale", `AuraSR failed twice: ${upscale.error}`);
      }
      continue;
    }

    // Download the upscaled buffer for pre-flight
    const dl = await downloadBuffer(upscaledImageUrl);
    if (dl.ok !== true) {
      lastUpscaleError = dl.error;
      logError("upscaled_download_failed", { attempt, error: dl.error });
      if (attempt === 2) {
        return errResult("upscale", `download of upscaled image failed: ${dl.error}`);
      }
      continue;
    }

    preflightResult = await preflightImage(dl.buffer);
    const pfReason = preflightResult.ok === true ? null : preflightResult.reason;
    log("preflight_result", {
      attempt,
      ok: preflightResult.ok,
      reason: pfReason,
      metrics: preflightResult.metrics,
    });

    if (preflightResult.ok === true) {
      break;
    }

    // Pre-flight failed. On attempt 1, the loop continues and re-rolls AuraSR.
    // On attempt 2, escalate to manual review. Note: we do NOT submit to Gelato.
    if (attempt === 2) {
      return {
        ok: false,
        stage: "manual_review",
        reason: `pre-flight failed twice: ${preflightResult.reason}`,
        preflightMetrics: preflightResult.metrics,
        upscaledImageUrl,
      };
    }
  }

  // Type-narrowing — by here both must be set on the success path.
  if (!preflightResult || preflightResult.ok !== true || !upscaledImageUrl) {
    return errResult(
      "preflight",
      `unexpected: pre-flight loop exited without success (lastUpscaleError=${lastUpscaleError ?? "none"})`,
    );
  }

  // Aspect assertion (Codex 2026-05-28): the final image MUST match the SKU's
  // physical aspect or Gelato silently crops/borders. preflight already measured
  // the upscaled dims — compare to the canvas inch ratio. 2% epsilon is generous
  // (exact masters pass; only genuinely off-ratio files route to manual review,
  // never auto-submitted wrong).
  {
    const sizeMeta = CANVAS_SIZES.find((s) => s.uid === input.sizeKey);
    if (sizeMeta) {
      const expected = sizeMeta.inches.w / sizeMeta.inches.h;
      const m = preflightResult.metrics;
      const actual = m.height > 0 ? m.width / m.height : 0;
      const offByRatio = expected > 0 ? Math.abs(actual / expected - 1) : 1;
      if (offByRatio > 0.02) {
        logError("aspect_mismatch", { sizeKey: input.sizeKey, expected, actual, offByRatio, width: m.width, height: m.height });
        return {
          ok: false,
          stage: "manual_review",
          reason: `aspect mismatch for ${input.sizeKey}: expected ${expected.toFixed(4)}, got ${actual.toFixed(4)} (${(offByRatio * 100).toFixed(2)}%)`,
          preflightMetrics: m,
          upscaledImageUrl,
        };
      }
    }
  }

  // 2.5 Rehost the upscaled buffer to durable storage so Gelato can fetch it
  // even if the fal.media URL has expired by the time their pull runs.
  // Re-download here (preflight already discarded the buffer) — small cost
  // for a guarantee that print never fails on expired-URL.
  const orderRef = `ls-${input.shopifyOrderId}-${input.shopifyLineItemId}`;
  let durableImageUrl = upscaledImageUrl;
  if (!input.dryRun) {
    const dlForUpload = await downloadBuffer(upscaledImageUrl);
    if (dlForUpload.ok === true) {
      const rehost = await rehostPrintMaster({ buffer: dlForUpload.buffer, orderRef });
      if (rehost.ok === true) {
        durableImageUrl = rehost.url;
        log("rehost_done", { orderRef, durableImageUrl });
      } else {
        // Non-fatal — fall back to fal URL if rehost fails. Most prints will
        // still go through; we just lose the expiry guarantee. Surface the
        // miss in logs so ops can investigate.
        logError("rehost_failed", { orderRef, error: rehost.error });
      }
    } else {
      logError("rehost_download_failed", { orderRef, error: dlForUpload.error });
    }
  }

  // 3. Build Gelato request body using the durable URL.
  const gelatoBody = buildGelatoOrderBody({
    input,
    productUid,
    upscaledImageUrl: durableImageUrl,
  });

  // Dry-run mode: return the assembled body without POST.
  if (input.dryRun) {
    log("dry_run_done", {
      upscaledImageUrl,
      preflightMetrics: preflightResult.metrics,
    });
    return {
      ok: true,
      dryRun: true,
      preflightMetrics: preflightResult.metrics,
      upscaledImageUrl,
      gelatoRequestBody: gelatoBody,
    };
  }

  // 4. Submit to Gelato (with single 5xx retry)
  const submit = await submitToGelato(gelatoBody);
  if (submit.ok !== true) {
    logError("gelato_submit_failed", {
      reason: submit.reason,
      status: submit.status,
      detail: submit.detail,
    });
    return {
      ok: false,
      stage: "gelato_submit",
      reason: submit.reason,
      details: submit.detail,
      preflightMetrics: preflightResult.metrics,
      upscaledImageUrl,
    };
  }

  log("gelato_submit_done", {
    gelatoOrderId: submit.gelatoOrderId,
    gelatoOrderRef: submit.gelatoOrderRef,
  });

  return {
    ok: true,
    gelatoOrderId: submit.gelatoOrderId,
    gelatoOrderRef: submit.gelatoOrderRef,
    preflightMetrics: preflightResult.metrics,
    upscaledImageUrl,
  };
}

// ─── AuraSR via fal queue ───────────────────────────────────────────────────
// Endpoint pattern (https://fal.ai/docs/clients/javascript/queue/):
//   POST https://queue.fal.run/{model}              → { request_id, status_url, response_url }
//   GET  {status_url}                               → { status: IN_QUEUE | IN_PROGRESS | COMPLETED | ... }
//   GET  {response_url}                             → final payload with .image / .images
// AuraSR returns: { image: { url, content_type, ... }, timings, ... }

type AuraSRSubmitResponse = {
  request_id: string;
  status_url?: string;
  response_url?: string;
};

type AuraSRStatusResponse = {
  status?: string;
  queue_position?: number;
  logs?: unknown;
};

type AuraSRResultResponse = {
  image?: { url: string };
  images?: Array<{ url: string }>;
};

type UpscaleResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

async function runAuraSR(sourceImageUrl: string): Promise<UpscaleResult> {
  // 1. Submit job
  let submitJson: AuraSRSubmitResponse;
  try {
    const r = await fetchWithTimeout(FAL_AURA_SUBMIT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${getFalKey()}`,
      },
      body: JSON.stringify({
        image_url: sourceImageUrl,
        upscaling_factor: 4,
        overlapping_tiles: true,
        checkpoint: "v2",
      }),
      timeoutMs: 30_000,
    });
    if (!r.ok) {
      const text = await safeText(r);
      return { ok: false, error: `submit ${r.status}: ${text.slice(0, 300)}` };
    }
    submitJson = (await r.json()) as AuraSRSubmitResponse;
  } catch (err) {
    return { ok: false, error: `submit network: ${(err as Error).message}` };
  }

  const requestId = submitJson.request_id;
  if (!requestId) {
    return { ok: false, error: "submit returned no request_id" };
  }
  const statusUrl = submitJson.status_url ?? `${FAL_QUEUE_BASE}/requests/${requestId}/status`;
  const responseUrl = submitJson.response_url ?? `${FAL_QUEUE_BASE}/requests/${requestId}`;

  // 2. Poll status until COMPLETED (or FAILED / timeout)
  const start = Date.now();
  while (true) {
    if (Date.now() - start > FAL_QUEUE_TIMEOUT_MS) {
      return { ok: false, error: `queue timeout after ${FAL_QUEUE_TIMEOUT_MS}ms (request_id=${requestId})` };
    }
    await sleep(FAL_QUEUE_POLL_INTERVAL_MS);

    let statusJson: AuraSRStatusResponse;
    try {
      const sr = await fetchWithTimeout(statusUrl, {
        method: "GET",
        headers: { Authorization: `Key ${getFalKey()}` },
        timeoutMs: 15_000,
      });
      if (!sr.ok) {
        // Transient 5xx during polling — keep polling, not fatal.
        if (sr.status >= 500) continue;
        const text = await safeText(sr);
        return { ok: false, error: `status ${sr.status}: ${text.slice(0, 300)}` };
      }
      statusJson = (await sr.json()) as AuraSRStatusResponse;
    } catch (err) {
      // Transient network — keep trying within the timeout budget.
      logError("fal_status_network_blip", { error: (err as Error).message, requestId });
      continue;
    }

    const status = (statusJson.status ?? "").toUpperCase();
    if (status === "COMPLETED") break;
    if (status === "FAILED" || status === "ERROR" || status === "CANCELLED") {
      return { ok: false, error: `queue status=${status} (request_id=${requestId})` };
    }
    // IN_QUEUE / IN_PROGRESS / unknown → keep polling
  }

  // 3. Fetch result payload
  let resultJson: AuraSRResultResponse;
  try {
    const rr = await fetchWithTimeout(responseUrl, {
      method: "GET",
      headers: { Authorization: `Key ${getFalKey()}` },
      timeoutMs: 30_000,
    });
    if (!rr.ok) {
      const text = await safeText(rr);
      return { ok: false, error: `result ${rr.status}: ${text.slice(0, 300)}` };
    }
    resultJson = (await rr.json()) as AuraSRResultResponse;
  } catch (err) {
    return { ok: false, error: `result network: ${(err as Error).message}` };
  }

  const url = resultJson.image?.url ?? resultJson.images?.[0]?.url;
  if (!url) {
    return { ok: false, error: "result payload had no image url" };
  }
  return { ok: true, url };
}

// ─── Buffer download with timeout ───────────────────────────────────────────

type DownloadResult =
  | { ok: true; buffer: Buffer }
  | { ok: false; error: string };

async function downloadBuffer(url: string): Promise<DownloadResult> {
  try {
    const r = await fetchWithTimeout(url, { timeoutMs: FETCH_TIMEOUT_DOWNLOAD_MS });
    if (!r.ok) {
      return { ok: false, error: `download ${r.status} from ${url}` };
    }
    const ab = await r.arrayBuffer();
    return { ok: true, buffer: Buffer.from(ab) };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

// ─── Gelato Order v4 body builder + submit ──────────────────────────────────

export type GelatoOrderRequest = {
  orderType: "order";
  orderReferenceId: string;
  customerReferenceId: string;
  currency: string;
  shipmentMethodUid: string;
  items: Array<{
    itemReferenceId: string;
    productUid: string;
    quantity: number;
    files: Array<{ type: "default"; url: string }>;
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    companyName?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postCode: string;
    state?: string;
    country: string;
    email: string;
    phone?: string;
  };
  metadata: Array<{ key: string; value: string }>;
};

function buildGelatoOrderBody(args: {
  input: PrintPipelineInput;
  productUid: string;
  upscaledImageUrl: string;
}): GelatoOrderRequest {
  const { input, productUid, upscaledImageUrl } = args;
  const orderRef = `ls-${input.shopifyOrderId}-${input.shopifyLineItemId}`;
  return {
    orderType: "order",
    orderReferenceId: orderRef,
    customerReferenceId: input.customerEmail,
    currency: input.currency ?? "GBP",
    shipmentMethodUid: input.shipmentMethodUid ?? "normal",
    items: [
      {
        itemReferenceId: `${orderRef}-canvas`,
        productUid,
        quantity: 1,
        files: [{ type: "default", url: upscaledImageUrl }],
      },
    ],
    shippingAddress: {
      firstName: input.shippingAddress.firstName,
      lastName: input.shippingAddress.lastName,
      ...(input.shippingAddress.companyName ? { companyName: input.shippingAddress.companyName } : {}),
      addressLine1: input.shippingAddress.addressLine1,
      ...(input.shippingAddress.addressLine2 ? { addressLine2: input.shippingAddress.addressLine2 } : {}),
      city: input.shippingAddress.city,
      postCode: input.shippingAddress.postCode,
      ...(input.shippingAddress.state ? { state: input.shippingAddress.state } : {}),
      country: input.shippingAddress.country,
      email: input.shippingAddress.email,
      ...(input.shippingAddress.phone ? { phone: input.shippingAddress.phone } : {}),
    },
    metadata: [
      { key: "shopifyOrderId", value: String(input.shopifyOrderId) },
      { key: "shopifyLineItemId", value: String(input.shopifyLineItemId) },
      { key: "petName", value: input.petName ?? "" },
      { key: "sizeKey", value: input.sizeKey },
      { key: "frameColor", value: input.frameColor },
    ],
  };
}

// ─── Rehost upscaled PNG to public Supabase storage ────────────────────────
// fal.media URLs returned by AuraSR expire (~24h-7d). If Gelato fetches the
// asset asynchronously after expiry the print fails and we have nothing to
// re-submit. Upload the buffer to pet-photos/print-masters/<orderRef>.png
// (a public bucket per migration 20251219130013_e88a6886) and hand Gelato
// the durable URL instead.
async function rehostPrintMaster(args: {
  buffer: Buffer;
  orderRef: string;
}): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    const supabase = getSupabaseAdmin();
    const path = `print-masters/${args.orderRef}.png`;
    const { error: upErr } = await supabase.storage
      .from("pet-photos")
      .upload(path, args.buffer, {
        contentType: "image/png",
        cacheControl: "31536000",
        upsert: true, // safe — orderRef is unique per (shopifyOrderId, lineItemId)
      });
    if (upErr) {
      return { ok: false, error: `supabase upload failed: ${upErr.message}` };
    }
    const { data } = supabase.storage.from("pet-photos").getPublicUrl(path);
    if (!data?.publicUrl) {
      return { ok: false, error: "supabase getPublicUrl returned no URL" };
    }
    return { ok: true, url: data.publicUrl };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

type GelatoSubmitResult =
  | { ok: true; gelatoOrderId: string; gelatoOrderRef: string }
  | { ok: false; reason: string; status?: number; detail?: unknown };

async function submitToGelato(body: GelatoOrderRequest): Promise<GelatoSubmitResult> {
  // Single retry on 5xx / network. 4xx returns immediately — we sent something
  // wrong, retry won't help.
  for (let attempt = 1; attempt <= 2; attempt++) {
    let r: Response;
    try {
      r = await fetchWithTimeout(GELATO_ORDER_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": getGelatoKey() ?? "",
        },
        body: JSON.stringify(body),
        timeoutMs: FETCH_TIMEOUT_GELATO_MS,
      });
    } catch (err) {
      if (attempt === 1) {
        await sleep(GELATO_5XX_RETRY_DELAY_MS);
        continue;
      }
      return { ok: false, reason: `network: ${(err as Error).message}` };
    }

    if (r.ok) {
      let json: unknown;
      try {
        json = await r.json();
      } catch (err) {
        return { ok: false, reason: `2xx but invalid JSON: ${(err as Error).message}`, status: r.status };
      }
      const parsed = parseGelatoSuccess(json);
      if (!parsed) {
        return {
          ok: false,
          reason: "2xx but missing id/orderReferenceId in response",
          status: r.status,
          detail: json,
        };
      }
      return { ok: true, ...parsed };
    }

    // Non-2xx
    const detail = await safeJson(r);
    if (r.status >= 400 && r.status < 500) {
      // 4xx — our request is bad, do not retry
      return {
        ok: false,
        reason: `gelato ${r.status}: ${gelatoSummariseError(detail)}`,
        status: r.status,
        detail,
      };
    }
    // 5xx
    if (attempt === 1) {
      await sleep(GELATO_5XX_RETRY_DELAY_MS);
      continue;
    }
    return {
      ok: false,
      reason: `gelato ${r.status} (after retry): ${gelatoSummariseError(detail)}`,
      status: r.status,
      detail,
    };
  }
  // unreachable
  return { ok: false, reason: "submit loop exited without verdict" };
}

function parseGelatoSuccess(json: unknown): { gelatoOrderId: string; gelatoOrderRef: string } | null {
  if (!json || typeof json !== "object") return null;
  const j = json as Record<string, unknown>;
  const id = typeof j.id === "string" ? j.id : null;
  const ref = typeof j.orderReferenceId === "string" ? j.orderReferenceId : null;
  if (!id || !ref) return null;
  return { gelatoOrderId: id, gelatoOrderRef: ref };
}

function gelatoSummariseError(detail: unknown): string {
  if (!detail || typeof detail !== "object") return String(detail).slice(0, 300);
  const d = detail as Record<string, unknown>;
  if (typeof d.message === "string") return d.message;
  if (typeof d.error === "string") return d.error;
  return JSON.stringify(detail).slice(0, 300);
}

// ─── fetch with timeout helper ──────────────────────────────────────────────

type FetchOpts = RequestInit & { timeoutMs: number };

async function fetchWithTimeout(url: string, opts: FetchOpts): Promise<Response> {
  const { timeoutMs, ...rest } = opts;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(new Error(`fetch timeout after ${timeoutMs}ms`)), timeoutMs);
  try {
    return await fetch(url, { ...rest, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function safeText(r: Response): Promise<string> {
  try {
    return await r.text();
  } catch {
    return "";
  }
}

async function safeJson(r: Response): Promise<unknown> {
  const text = await safeText(r);
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

// ─── error result helper ────────────────────────────────────────────────────

function errResult(stage: PrintPipelineStage, reason: string): PrintPipelineResult {
  logError("error_result", { stage, reason });
  return { ok: false, stage, reason };
}
