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
  type ShopifyOrderWithShipping,
} from "./shopify/_lib/extractCanvas.js";
import {
  upsertPrintOrder,
  updatePrintOrder,
  recordHighSeverityFailure,
  type PrintOrderRow,
} from "./_lib/printOrdersRepo.js";

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
  // Phase 9 reliability fix (2026-05-08, revised 2026-05-09):
  //   • PERSIST every canvas line as `print_orders.status='pending'` plus
  //     enough metadata for an out-of-band worker to reconstruct the
  //     fulfillment args (customer email, shipping address, pet name).
  //   • RETURN 200 to Shopify immediately. The original design ran AuraSR +
  //     Gelato submit fire-and-forget against a 4.5s webhook deadline. The
  //     pipeline takes 30-180s end-to-end so the Promise was always orphaned
  //     mid-flight on a torn-down lambda — paid orders silently stuck pending
  //     with no Telegram alert and no retry.
  //   • CRON WORKER (api/cron/gelato-worker.ts, fired by pg_cron every 1 min)
  //     drains `print_orders WHERE status='pending'`, runs the pipeline with
  //     a proper await, updates status, alerts on failure.
  //
  // Lines awaiting post-purchase customisation (TikTok Shop Flow B) are still
  // persisted as 'pending' but NOT submitted — Phase 7's email captures the
  // photo, then a follow-up handler re-submits.
  const orderForCanvas = order as ShopifyOrderWithShipping;
  const canvasLines = extractCanvasFulfillmentLines(orderForCanvas);
  const canvasJobs: Array<{ row: PrintOrderRow; readyToSubmit: boolean }> = [];

  // Cron worker reads these out of metadata to reconstruct the fulfillment
  // args. Store enough that the cron NEVER has to round-trip Shopify to
  // refetch the order — that would be slow + add a failure mode.
  const earlyCustomerEmail = (order.email ?? "").trim() || "unknown@littlesouls.app";
  const cronArgsForOrder = {
    customerEmail: earlyCustomerEmail,
    shippingAddress: orderForCanvas.shipping_address ?? null,
    presentmentCurrency:
      (order as { presentment_currency?: string; currency?: string }).presentment_currency ??
      (order as { currency?: string }).currency ??
      "GBP",
  };

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
          // ── Cron worker reads from here ───────────────────────────────
          cron: {
            customerEmail: cronArgsForOrder.customerEmail,
            shippingAddress: cronArgsForOrder.shippingAddress,
            currency: cronArgsForOrder.presentmentCurrency,
          },
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

  // ── Canvas lines are left as 'pending' for the cron worker ────────────
  // Previously this block fire-and-forget-ran runCanvasFulfillment against a
  // 4.5s webhook deadline. The pipeline takes 30-180s so that always orphaned
  // mid-flight on a torn-down lambda — paid orders silently stuck pending
  // with no Telegram alert and no retry. Now persisted only; api/cron/
  // gelato-worker.ts (pg_cron every 1 min) drains pending rows and runs the
  // pipeline with a proper await + Telegram alert + bounded retries.
  const canvasReady = canvasJobs.filter((j) => j.readyToSubmit);
  const canvasPendingForCron = canvasReady.length;

  // Soul-reading n8n triggers stay fire-and-forget — they're cheap and the
  // n8n side is itself idempotent on the workflow ID.
  if (triggerableRows.length > 0) {
    const n8nWork = Promise.allSettled(triggerableRows.map((r) => triggerN8nForJob(r)));
    const deadline = new Promise<"deadline">((resolve) =>
      setTimeout(() => resolve("deadline"), ASYNC_TRIGGER_DEADLINE_MS),
    );
    await Promise.race([n8nWork, deadline]);
  }

  console.log(
    "[orders/paid] done",
    JSON.stringify({
      eventId,
      orderId,
      accepted: freshRows.length,
      duplicates,
      canvasPendingForCron,
      canvasAwaitingCustomisation: canvasJobs.length - canvasReady.length,
    }),
  );

  return res.status(200).json({
    ok: true,
    accepted: freshRows.length,
    duplicates,
    dryRun,
    canvas: canvasCount,
    canvasPendingForCron,
    customisationPending: customisationPending.length,
  });
}

// Canvas fulfillment moved to api/_lib/canvasFulfillment.ts on 2026-05-09.
// Cron worker (api/cron/gelato-worker.ts) reads pending print_orders rows
// and calls runCanvasFulfillmentForRow() instead of running synchronously
// from this webhook handler.

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
