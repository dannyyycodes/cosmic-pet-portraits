/**
 * POST /api/shopify — single Shopify webhook router for orders/paid +
 * refunds/create. Hobby-plan consolidation of the previous order-paid.ts +
 * refunds-create.ts files.
 *
 *   Shopify -> HMAC-verify raw body
 *           -> dispatch on X-Shopify-Topic header
 *               topic == orders/paid     -> handleOrderPaid
 *               topic == refunds/create  -> handleRefundsCreate
 *               other                    -> 200 + skip
 *
 * Both branches respond 200 within 5s. orders/paid fires async n8n triggers
 * with a 4.5s deadline; refunds/create is fully synchronous.
 *
 * Spec sources:
 *   - research-2026-05-04-soul-reading-fulfilment §2 (HMAC, retry, 4.5s)
 *   - research-2026-05-04-soul-reading-fulfilment §7 (refund logic)
 *   - launch-plan-2026-05-05 Phase 4 + Phase 8
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readRawBody, verifyShopifyHmac } from "./shopify/_lib/verifyHmac.js";
import {
  classifyLineItems,
  type ShopifyOrderLike,
  type SoulReadingItem,
} from "./shopify/_lib/extractReadings.js";
import {
  insertJob,
  getJobByOrderAndLineItem,
  cancelPreRender,
  appendRefundEvent,
  type SoulReadingJobRow,
} from "./shopify/_lib/jobsRepo.js";
import { triggerN8nForJob } from "./shopify/_lib/triggerN8n.js";
import {
  extractCanvasFulfillmentLines,
  shopifyAddressToGelato,
  type ShopifyOrderWithShipping,
} from "./shopify/_lib/extractCanvas.js";
import {
  upsertPrintOrder,
  updatePrintOrder,
  recordHighSeverityFailure,
  insertPrintOrderAlert,
  type PrintOrderRow,
} from "./_lib/printOrdersRepo.js";
import { runPrintPipeline } from "./_lib/printPipeline.js";

export const config = {
  api: { bodyParser: false },
};

const ASYNC_TRIGGER_DEADLINE_MS = 4_500;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Shared: read raw body
  let rawBody: Buffer;
  try {
    rawBody = await readRawBody(req);
  } catch (err) {
    console.error(
      "[shopify] raw_body_read_failed",
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
    );
    return res.status(500).json({ error: "raw body read failed" });
  }

  // Shared: HMAC verify (BEFORE JSON.parse). 401 silently on fail.
  const hmacHeader = (req.headers["x-shopify-hmac-sha256"] as string | undefined) ?? undefined;
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[shopify] SHOPIFY_WEBHOOK_SECRET not configured");
    return res.status(500).json({ error: "webhook secret not configured" });
  }
  if (!verifyShopifyHmac(rawBody, hmacHeader, secret)) {
    console.warn(
      "[shopify] hmac_invalid",
      JSON.stringify({ hadHeader: Boolean(hmacHeader), bodyLen: rawBody.length }),
    );
    return res.status(401).end();
  }

  // Shared: extract topic + event id
  const topic = (req.headers["x-shopify-topic"] as string | undefined) ?? "";
  const eventId =
    (req.headers["x-shopify-webhook-id"] as string | undefined) ??
    (req.headers["x-shopify-event-id"] as string | undefined);
  const shopDomain = (req.headers["x-shopify-shop-domain"] as string | undefined) ?? "";

  if (!eventId) {
    console.warn("[shopify] missing_event_id", JSON.stringify({ shopDomain, topic }));
    return res.status(200).json({ ok: true, skipped: "missing_event_id" });
  }

  // Dispatch on topic
  if (topic === "orders/paid") {
    return handleOrderPaid(req, res, rawBody, eventId);
  }
  if (topic === "refunds/create") {
    return handleRefundsCreate(req, res, rawBody, eventId);
  }

  console.warn("[shopify] unexpected_topic", JSON.stringify({ topic, eventId, shopDomain }));
  return res.status(200).json({ ok: true, skipped: "unexpected_topic", topic });
}

// ─── orders/paid branch ────────────────────────────────────────────────────

async function handleOrderPaid(
  _req: VercelRequest,
  res: VercelResponse,
  rawBody: Buffer,
  eventId: string,
) {
  let order: ShopifyOrderLike;
  try {
    order = JSON.parse(rawBody.toString("utf8")) as ShopifyOrderLike;
  } catch (err) {
    console.error(
      "[orders/paid] json_parse_failed",
      JSON.stringify({ error: err instanceof Error ? err.message : String(err), eventId }),
    );
    return res.status(400).json({ error: "invalid json" });
  }

  const dryRun = order.test === true;
  const orderId = toNum(order.id);
  if (orderId === null) {
    console.error("[orders/paid] missing_order_id", JSON.stringify({ eventId }));
    return res.status(200).json({ ok: true, skipped: "missing_order_id" });
  }

  const classified = classifyLineItems(order);
  const soulReadings = classified.filter((c): c is SoulReadingItem => c.kind === "soul_reading");
  const canvasCount = classified.filter((c) => c.kind === "canvas").length;
  const customisationPending = classified.filter((c) => c.kind === "needs_customisation");

  console.log(
    "[orders/paid] classified",
    JSON.stringify({
      eventId,
      orderId,
      dryRun,
      lineItems: classified.length,
      soulReadings: soulReadings.length,
      canvas: canvasCount,
      needsCustomisation: customisationPending.length,
    }),
  );

  // ── Canvas line-item fulfillment ────────────────────────────────────────
  // Phase 9 reliability fix (2026-05-08): we EXPLICITLY persist + submit every
  // canvas line ourselves rather than relying on Shopify's Gelato app. The
  // app silently fails on TikTok-Shop orders + offers no audit trail, which
  // means a customer can be charged today and have nothing print.
  //
  // For each canvas line:
  //   1. Insert/upsert a print_orders row (idempotent on order+line).
  //   2. If we have a print master URL + a complete shipping address, kick
  //      off runPrintPipeline asynchronously (subject to the 4.5s deadline).
  //   3. On any failure → row stays 'pending'/'failed', high-severity alert
  //      + Telegram via recordHighSeverityFailure.
  //
  // Lines awaiting post-purchase customisation (TikTok Shop Flow B) are still
  // persisted as 'pending' but NOT submitted — Phase 7's email captures the
  // photo, then a follow-up handler re-submits.
  const orderForCanvas = order as ShopifyOrderWithShipping;
  const canvasLines = extractCanvasFulfillmentLines(orderForCanvas);
  const canvasJobs: Array<{ row: PrintOrderRow; readyToSubmit: boolean }> = [];

  for (const c of canvasLines) {
    let row: PrintOrderRow;
    try {
      const upsert = await upsertPrintOrder({
        shopifyOrderId: String(orderId),
        shopifyLineItemId: String(c.lineItemId),
        sku: c.sku,
        sizeKey: c.sizeKey,
        frameColor: c.frameColor,
        sourceImageUrl: c.sourceImageUrl,
        printMasterUrl: c.printMasterUrl,
        metadata: {
          shopifyEventId: eventId,
          shopifyVariantId: c.variantId,
          sizeLabel: c.sizeLabel,
          petName: c.petName,
          previewUrl: c.previewUrl,
          sourcePhotoUrl: c.sourcePhotoUrl,
          dryRun,
          needsCustomisation: c.needsCustomisation,
        },
      });
      row = upsert.row;
      console.log(
        "[orders/paid] canvas_persisted",
        JSON.stringify({
          eventId,
          orderId,
          lineItemId: c.lineItemId,
          printOrderId: row.id,
          inserted: upsert.inserted,
          status: row.status,
          needsCustomisation: c.needsCustomisation,
        }),
      );
    } catch (err) {
      // DB write failure is severe — return 500 so Shopify retries the
      // webhook (and we get another shot at persisting + alerting).
      console.error(
        "[orders/paid] canvas_persist_failed",
        JSON.stringify({
          eventId,
          orderId,
          lineItemId: c.lineItemId,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
      return res.status(500).json({ error: "print_orders_persist_failed" });
    }

    // Don't submit if:
    //   - this is a TikTok Shop Flow B line awaiting photo upload
    //   - the row is already past pending (idempotent replay of a webhook
    //     where we already submitted to Gelato)
    //   - we have no source image URL to feed AuraSR
    //   - it's a dry-run order
    if (c.needsCustomisation) {
      canvasJobs.push({ row, readyToSubmit: false });
      continue;
    }
    if (dryRun) {
      canvasJobs.push({ row, readyToSubmit: false });
      continue;
    }
    if (row.status !== "pending" && row.status !== "failed") {
      canvasJobs.push({ row, readyToSubmit: false });
      continue;
    }
    if (!c.sourceImageUrl) {
      // High-severity: we have no image to print. Don't submit, alert ops.
      try {
        await updatePrintOrder({
          printOrderId: row.id,
          status: "manual_review",
          lastError: "no_source_image_url_on_line_item",
        });
      } catch (err) {
        console.error(
          "[orders/paid] update_no_image_failed",
          JSON.stringify({ printOrderId: row.id, error: err instanceof Error ? err.message : String(err) }),
        );
      }
      await recordHighSeverityFailure({
        printOrderId: row.id,
        shopifyOrderId: String(orderId),
        shopifyLineItemId: String(c.lineItemId),
        sku: c.sku,
        stage: "intake",
        message:
          "Canvas line item has no source image URL — the cart did not attach 'Source photo' or 'Print master (Gelato)'. Manual review required.",
        details: { variantId: c.variantId },
      });
      canvasJobs.push({ row, readyToSubmit: false });
      continue;
    }

    canvasJobs.push({ row, readyToSubmit: true });
  }
  void canvasJobs;

  if (customisationPending.length > 0) {
    console.log(
      "[orders/paid] customisation_pending_lines",
      JSON.stringify({
        eventId,
        orderId,
        lineItemIds: customisationPending.map((c) => c.lineItemId),
      }),
    );
    // TODO Phase 7: tag order + set order metafield + trigger Klaviyo flow.
  }

  const customerEmail = (order.email ?? "").trim() || "unknown@littlesouls.app";
  const freshRows: SoulReadingJobRow[] = [];
  let duplicates = 0;
  let incompleteSkipped = 0;

  for (const sr of soulReadings) {
    if (sr.hasIncompleteInputs) {
      console.warn(
        "[orders/paid] soul_reading_incomplete_inputs",
        JSON.stringify({
          eventId,
          orderId,
          lineItemId: sr.lineItemId,
          hasName: Boolean(sr.petName),
          hasDob: Boolean(sr.petDob),
          hasLocation: Boolean(sr.petBirthLocation),
        }),
      );
      incompleteSkipped++;
      continue;
    }

    try {
      const result = await insertJob({
        shopifyEventId: eventId,
        shopifyOrderId: orderId,
        shopifyLineItemId: sr.lineItemId,
        customerEmail,
        petName: sr.petName,
        petDob: sr.petDob,
        petBirthLocation: sr.petBirthLocation,
        dryRun,
      });
      if (result.duplicate) {
        duplicates++;
        continue;
      }
      if (result.row) {
        freshRows.push(result.row);
      }
    } catch (err) {
      console.error(
        "[orders/paid] insert_job_failed",
        JSON.stringify({
          eventId,
          orderId,
          lineItemId: sr.lineItemId,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
      return res.status(500).json({ error: "db_insert_failed" });
    }
  }

  const triggerableRows = dryRun ? [] : freshRows;

  console.log(
    "[orders/paid] persisted",
    JSON.stringify({
      eventId,
      orderId,
      dryRun,
      fresh: freshRows.length,
      duplicates,
      incompleteSkipped,
      triggerable: triggerableRows.length,
    }),
  );

  // ── Submit ready canvas lines to Gelato (subject to deadline) ──────────
  const canvasReady = canvasJobs.filter((j) => j.readyToSubmit);
  const canvasSubmitWork: Array<Promise<unknown>> = [];
  if (canvasReady.length > 0) {
    const canvasByLine = new Map<number, (typeof canvasLines)[number]>();
    for (const c of canvasLines) canvasByLine.set(c.lineItemId, c);
    for (const job of canvasReady) {
      const lineId = Number(job.row.shopify_line_item_id);
      const canvas = Number.isFinite(lineId) ? canvasByLine.get(lineId) : undefined;
      if (!canvas || !canvas.sourceImageUrl) continue;
      canvasSubmitWork.push(
        runCanvasFulfillment({
          row: job.row,
          orderId,
          eventId,
          shippingAddress: orderForCanvas.shipping_address ?? null,
          customerEmail,
          sourceImageUrl: canvas.sourceImageUrl,
          sizeKey: canvas.sizeKey,
          frameColor: canvas.frameColor,
          sku: canvas.sku,
          petName: canvas.petName,
        }),
      );
    }
  }

  const allBackgroundWork: Promise<unknown> = Promise.allSettled([
    ...(triggerableRows.length > 0 ? [Promise.allSettled(triggerableRows.map((r) => triggerN8nForJob(r)))] : []),
    ...canvasSubmitWork,
  ]);
  if (triggerableRows.length > 0 || canvasSubmitWork.length > 0) {
    const deadline = new Promise<"deadline">((resolve) =>
      setTimeout(() => resolve("deadline"), ASYNC_TRIGGER_DEADLINE_MS),
    );
    await Promise.race([allBackgroundWork, deadline]);
  }

  console.log(
    "[orders/paid] done",
    JSON.stringify({
      eventId,
      orderId,
      accepted: freshRows.length,
      duplicates,
      canvasFulfilled: canvasReady.length,
      canvasPending: canvasJobs.length - canvasReady.length,
    }),
  );

  return res.status(200).json({
    ok: true,
    accepted: freshRows.length,
    duplicates,
    dryRun,
    canvas: canvasCount,
    canvasFulfilled: canvasReady.length,
    customisationPending: customisationPending.length,
  });
}

// ─── Canvas fulfillment helper ─────────────────────────────────────────────

interface RunCanvasFulfillmentArgs {
  row: PrintOrderRow;
  orderId: number;
  eventId: string;
  shippingAddress: import("./shopify/_lib/extractCanvas.js").ShopifyShippingAddress | null;
  customerEmail: string;
  sourceImageUrl: string;
  sizeKey: string;
  frameColor: "black" | "natural-wood" | "dark-wood";
  sku: string;
  petName: string | null;
}

async function runCanvasFulfillment(args: RunCanvasFulfillmentArgs): Promise<void> {
  const { row, orderId, shippingAddress, customerEmail, sourceImageUrl, sizeKey, frameColor, sku, petName } = args;
  const lineItemIdStr = row.shopify_line_item_id ?? String(orderId);
  const lineItemNum = Number(lineItemIdStr);

  const addr = shopifyAddressToGelato({ address: shippingAddress, email: customerEmail });
  if ("ok" in addr && addr.ok === false) {
    try {
      await updatePrintOrder({
        printOrderId: row.id,
        status: "manual_review",
        lastError: `incomplete_shipping_address: ${addr.missing.join(",")}`,
        bumpAttempts: true,
      });
    } catch (err) {
      console.error(
        "[orders/paid] canvas_addr_update_failed",
        JSON.stringify({ printOrderId: row.id, error: err instanceof Error ? err.message : String(err) }),
      );
    }
    await recordHighSeverityFailure({
      printOrderId: row.id,
      shopifyOrderId: String(orderId),
      shopifyLineItemId: lineItemIdStr,
      sku,
      stage: "intake",
      message: `Cannot submit canvas to Gelato — shipping address missing fields: ${addr.missing.join(", ")}`,
      details: { missing: addr.missing },
    });
    return;
  }

  // Run the pipeline. Don't await indefinitely — the webhook deadline race
  // outside this fn caps total time. Pipeline itself has internal timeouts.
  let result: Awaited<ReturnType<typeof runPrintPipeline>> | null = null;
  try {
    result = await runPrintPipeline({
      sourceImageUrl,
      sizeKey,
      frameColor,
      shippingAddress: addr as Exclude<typeof addr, { ok: false }>,
      customerEmail,
      shopifyOrderId: orderId,
      shopifyLineItemId: Number.isFinite(lineItemNum) ? lineItemNum : 0,
      petName: petName ?? undefined,
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error(
      "[orders/paid] canvas_pipeline_threw",
      JSON.stringify({ printOrderId: row.id, error: reason }),
    );
    try {
      await updatePrintOrder({
        printOrderId: row.id,
        status: "failed",
        lastError: `pipeline_exception: ${reason}`,
        bumpAttempts: true,
      });
    } catch {
      /* swallow — alert is more important */
    }
    await recordHighSeverityFailure({
      printOrderId: row.id,
      shopifyOrderId: String(orderId),
      shopifyLineItemId: lineItemIdStr,
      sku,
      stage: "pipeline_exception",
      message: `runPrintPipeline threw: ${reason}`,
    });
    return;
  }

  if (result.ok === true && "gelatoOrderId" in result) {
    try {
      await updatePrintOrder({
        printOrderId: row.id,
        status: "submitted",
        gelatoOrderId: result.gelatoOrderId,
        gelatoOrderReference: result.gelatoOrderRef,
        printMasterUrl: result.upscaledImageUrl,
        bumpAttempts: true,
        metadataMerge: { preflight: result.preflightMetrics },
      });
    } catch (err) {
      console.error(
        "[orders/paid] canvas_submitted_update_failed",
        JSON.stringify({ printOrderId: row.id, error: err instanceof Error ? err.message : String(err) }),
      );
      // Even if the row update failed, the Gelato submission succeeded — log
      // a low-severity alert so ops knows to reconcile manually.
      try {
        await insertPrintOrderAlert({
          printOrderId: row.id,
          severity: "medium",
          message: "Gelato submission succeeded but DB update failed — reconcile manually",
          details: {
            gelatoOrderId: result.gelatoOrderId,
            gelatoOrderRef: result.gelatoOrderRef,
            error: err instanceof Error ? err.message : String(err),
          },
        });
      } catch {
        /* swallow */
      }
    }
    return;
  }

  // Failure path: pipeline returned ok:false (or dry-run). Map stage → status.
  if (result.ok === true) {
    // Dry-run shouldn't happen here (we don't pass dryRun:true), but defend.
    return;
  }
  const stage = result.stage;
  const reason = result.reason;
  const nextStatus: "manual_review" | "failed" =
    stage === "manual_review" ? "manual_review" : "failed";
  try {
    await updatePrintOrder({
      printOrderId: row.id,
      status: nextStatus,
      lastError: `${stage}: ${reason}`,
      bumpAttempts: true,
      printMasterUrl: result.upscaledImageUrl ?? undefined,
      metadataMerge: result.preflightMetrics ? { preflight: result.preflightMetrics } : undefined,
    });
  } catch (err) {
    console.error(
      "[orders/paid] canvas_failure_update_failed",
      JSON.stringify({ printOrderId: row.id, error: err instanceof Error ? err.message : String(err) }),
    );
  }
  await recordHighSeverityFailure({
    printOrderId: row.id,
    shopifyOrderId: String(orderId),
    shopifyLineItemId: lineItemIdStr,
    sku,
    stage,
    message: reason,
    details: result.details ? { details: safeStringify(result.details) } : undefined,
  });
}

function safeStringify(v: unknown): string {
  try {
    return JSON.stringify(v).slice(0, 1500);
  } catch {
    return String(v).slice(0, 1500);
  }
}

// ─── refunds/create branch ─────────────────────────────────────────────────

interface ShopifyRefundLineItem {
  id?: number;
  line_item_id?: number;
  quantity?: number;
  restock_type?: string;
}

interface ShopifyRefundPayload {
  id?: number | string;
  order_id?: number | string;
  refund_line_items?: ShopifyRefundLineItem[];
  note?: string;
  test?: boolean;
}

const PRE_RENDER_STATUSES = new Set(["pending", "triggered"]);
const POST_RENDER_STATUSES = new Set(["generated", "delivered"]);

async function handleRefundsCreate(
  _req: VercelRequest,
  res: VercelResponse,
  rawBody: Buffer,
  eventId: string,
) {
  let refund: ShopifyRefundPayload;
  try {
    refund = JSON.parse(rawBody.toString("utf8")) as ShopifyRefundPayload;
  } catch (err) {
    console.error(
      "[refunds/create] json_parse_failed",
      JSON.stringify({ error: err instanceof Error ? err.message : String(err), eventId }),
    );
    return res.status(400).json({ error: "invalid json" });
  }

  const orderId = toNum(refund.order_id);
  const refundId = toNum(refund.id);
  const lineItems = refund.refund_line_items ?? [];

  if (orderId === null) {
    console.warn("[refunds/create] missing_order_id", JSON.stringify({ eventId, refundId }));
    return res.status(200).json({ ok: true, skipped: "missing_order_id" });
  }

  if (lineItems.length === 0) {
    console.log("[refunds/create] no_line_items", JSON.stringify({ eventId, orderId, refundId }));
    return res.status(200).json({ ok: true, skipped: "no_line_items" });
  }

  let cancelled = 0;
  let auditLogged = 0;
  let alreadyTerminal = 0;
  let nonReadingSkipped = 0;
  let duplicates = 0;

  for (const li of lineItems) {
    const lineItemId = toNum(li.line_item_id);
    if (lineItemId === null) {
      console.warn(
        "[refunds/create] missing_line_item_id",
        JSON.stringify({ eventId, orderId, refundId }),
      );
      continue;
    }

    let row;
    try {
      row = await getJobByOrderAndLineItem({ orderId, lineItemId });
    } catch (err) {
      console.error(
        "[refunds/create] db_lookup_failed",
        JSON.stringify({
          eventId,
          orderId,
          lineItemId,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
      return res.status(500).json({ error: "db_lookup_failed" });
    }

    if (!row) {
      nonReadingSkipped++;
      continue;
    }

    try {
      if (PRE_RENDER_STATUSES.has(row.status)) {
        await cancelPreRender({
          jobId: row.id,
          reason: `Cancelled via refund webhook ${eventId} (refund ${refundId ?? "n/a"})`,
        });
        cancelled++;
        console.log(
          "[refunds/create] cancelled_pre_render",
          JSON.stringify({ eventId, orderId, lineItemId, jobId: row.id, prevStatus: row.status }),
        );
        continue;
      }

      if (POST_RENDER_STATUSES.has(row.status)) {
        const result = await appendRefundEvent({
          jobId: row.id,
          eventId,
          refundId,
          payload: refund,
        });
        if (result.appended) {
          auditLogged++;
          console.log(
            "[refunds/create] post_generation_logged",
            JSON.stringify({ eventId, orderId, lineItemId, jobId: row.id, status: row.status }),
          );
        } else {
          duplicates++;
        }
        continue;
      }

      alreadyTerminal++;
      console.log(
        "[refunds/create] already_terminal",
        JSON.stringify({ eventId, orderId, lineItemId, jobId: row.id, status: row.status }),
      );
    } catch (err) {
      console.error(
        "[refunds/create] mutation_failed",
        JSON.stringify({
          eventId,
          orderId,
          lineItemId,
          jobId: row.id,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
      return res.status(500).json({ error: "mutation_failed" });
    }
  }

  console.log(
    "[refunds/create] done",
    JSON.stringify({
      eventId,
      orderId,
      refundId,
      cancelled,
      auditLogged,
      alreadyTerminal,
      nonReadingSkipped,
      duplicates,
    }),
  );

  return res.status(200).json({
    ok: true,
    cancelled,
    auditLogged,
    alreadyTerminal,
    nonReadingSkipped,
    duplicates,
  });
}

function toNum(v: number | string | undefined): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}
