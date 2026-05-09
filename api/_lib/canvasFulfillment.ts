/**
 * Canvas fulfillment orchestrator.
 *
 * Wraps runPrintPipeline with the print_orders state machine + alerting:
 *   - validate shipping address (manual_review on miss)
 *   - call runPrintPipeline (AuraSR + preflight + Gelato submit)
 *   - update print_orders.status (submitted | failed | manual_review)
 *   - emit medium/high severity alerts on failure paths
 *
 * Originally lived inside api/shopify.ts and was fired off as a
 * fire-and-forget Promise from the orders/paid webhook against a 4.5s
 * deadline. Extracted 2026-05-09 so the cron worker (api/cron/gelato-worker)
 * can call it from outside the webhook with a proper await.
 *
 * Two entrypoints:
 *   - runCanvasFulfillment(args)            — args reconstructed by caller
 *   - runCanvasFulfillmentForRow(row)       — reads cron args from row.metadata.cron
 *                                             (the orders/paid handler stashes
 *                                              customerEmail + shippingAddress +
 *                                              currency there at upsert time).
 */
import {
  insertPrintOrderAlert,
  recordHighSeverityFailure,
  updatePrintOrder,
  type PrintOrderRow,
} from "./printOrdersRepo.js";
import { runPrintPipeline } from "./printPipeline.js";
import {
  shopifyAddressToGelato,
  type ShopifyShippingAddress,
} from "../shopify/_lib/extractCanvas.js";

export interface RunCanvasFulfillmentArgs {
  row: PrintOrderRow;
  orderId: number;
  eventId: string;
  shippingAddress: ShopifyShippingAddress | null;
  customerEmail: string;
  sourceImageUrl: string;
  sizeKey: string;
  frameColor: "black" | "natural-wood" | "dark-wood";
  sku: string;
  petName: string | null;
  /** Settlement currency to send to Gelato. Defaults to GBP. */
  currency?: string;
}

export async function runCanvasFulfillment(args: RunCanvasFulfillmentArgs): Promise<void> {
  const {
    row,
    orderId,
    shippingAddress,
    customerEmail,
    sourceImageUrl,
    sizeKey,
    frameColor,
    sku,
    petName,
    currency,
  } = args;
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
        "[canvas-fulfill] addr_update_failed",
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
      currency,
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error(
      "[canvas-fulfill] pipeline_threw",
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
        "[canvas-fulfill] submitted_update_failed",
        JSON.stringify({ printOrderId: row.id, error: err instanceof Error ? err.message : String(err) }),
      );
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

  // result.ok === true && dryRun branch — shouldn't happen in production.
  if (result.ok === true) return;

  // Failure path: pipeline returned ok:false. Map stage → status.
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
      "[canvas-fulfill] failure_update_failed",
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

/**
 * Reconstruct fulfillment args from a print_orders row + metadata.cron and
 * delegate to runCanvasFulfillment. Used by the cron worker — the orders/paid
 * webhook stashes customerEmail + shippingAddress + currency in metadata.cron
 * specifically so the cron can run independently of Shopify.
 */
export async function runCanvasFulfillmentForRow(row: PrintOrderRow): Promise<void> {
  const meta = (row.metadata ?? {}) as {
    cron?: {
      customerEmail?: string;
      shippingAddress?: ShopifyShippingAddress | null;
      currency?: string;
    };
    petName?: string | null;
  };
  const cron = meta.cron;
  if (!cron || typeof cron.customerEmail !== "string" || cron.shippingAddress === undefined) {
    // Row was upserted by older webhook before cron-args stashing landed.
    // Mark for manual review — ops can re-fetch from Shopify.
    await updatePrintOrder({
      printOrderId: row.id,
      status: "manual_review",
      lastError: "missing_cron_metadata: row predates cron-worker stashing — manual fetch needed",
      bumpAttempts: true,
    });
    await recordHighSeverityFailure({
      printOrderId: row.id,
      shopifyOrderId: row.shopify_order_id,
      shopifyLineItemId: row.shopify_line_item_id ?? "",
      sku: row.sku ?? "",
      stage: "intake",
      message: "Pending row missing metadata.cron — cron worker cannot reconstruct args",
    });
    return;
  }

  const orderId = Number(row.shopify_order_id);
  await runCanvasFulfillment({
    row,
    orderId: Number.isFinite(orderId) ? orderId : 0,
    eventId: "cron",
    shippingAddress: cron.shippingAddress ?? null,
    customerEmail: cron.customerEmail,
    sourceImageUrl: row.source_image_url ?? "",
    sizeKey: row.size_key ?? "",
    frameColor: (row.frame_color ?? "black") as "black" | "natural-wood" | "dark-wood",
    sku: row.sku ?? "",
    petName: (meta.petName ?? null) as string | null,
    currency: cron.currency,
  });
}

function safeStringify(v: unknown): string {
  try {
    return JSON.stringify(v).slice(0, 1500);
  } catch {
    return String(v).slice(0, 1500);
  }
}
