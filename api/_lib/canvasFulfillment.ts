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
import { runDigitalFulfillment } from "./digitalFulfillment.js";
import { getSupabaseAdmin } from "./supabaseAdmin.js";

export interface RunCanvasFulfillmentArgs {
  row: PrintOrderRow;
  orderId: number;
  eventId: string;
  shippingAddress: ShopifyShippingAddress | null;
  customerEmail: string;
  sourceImageUrl: string;
  sizeKey: string;
  /** null = unframed slim canvas. */
  frameColor: "black" | "natural-wood" | "dark-wood" | null;
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

  // C7 idempotency guard: a row-deadline timeout in the cron does NOT abort an
  // in-flight pipeline, so a later tick can re-enter here for a row whose
  // Gelato order was already (or is being) created. Re-read the row; if it
  // already has a gelato_order_id or is already at/after 'submitted', do NOT
  // submit again — just make sure the status reflects reality and return.
  // This is what prevents a customer receiving two physical canvases.
  try {
    const sb0 = getSupabaseAdmin();
    const { data: fresh } = await sb0
      .from("print_orders")
      .select("status,gelato_order_id")
      .eq("id", row.id)
      .maybeSingle();
    const freshStatus = (fresh?.status ?? null) as string | null;
    const freshGelatoId = (fresh?.gelato_order_id ?? null) as string | null;
    const ALREADY = new Set(["submitted", "printed", "shipped", "delivered", "canceled"]);
    if (freshGelatoId || (freshStatus && ALREADY.has(freshStatus))) {
      console.warn(
        "[canvas-fulfill] skip_duplicate_submit",
        JSON.stringify({ printOrderId: row.id, freshStatus, hasGelatoId: !!freshGelatoId }),
      );
      // Reconcile: if a Gelato order exists but status is still pre-submit,
      // advance it so the queue stops re-picking the row.
      if (freshGelatoId && freshStatus && !ALREADY.has(freshStatus)) {
        try {
          await updatePrintOrder({ printOrderId: row.id, status: "submitted", gelatoOrderId: freshGelatoId });
        } catch { /* best-effort */ }
      }
      return;
    }
  } catch (err) {
    // If the guard read fails, fall through — the downstream pipeline /
    // Gelato reference-id dedupe is the backstop. Don't block fulfilment on
    // a transient read error.
    console.warn(
      "[canvas-fulfill] idempotency_check_failed",
      JSON.stringify({ printOrderId: row.id, error: err instanceof Error ? err.message : String(err) }),
    );
  }

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
    // Email the customer too — the previous behaviour was Telegram-to-ops
    // only, which meant the customer had no idea why their canvas wasn't
    // shipping. Best-effort; failure to send is logged but doesn't block.
    if (customerEmail) {
      await sendAddressConfirmationEmail({
        to: customerEmail,
        orderId: String(orderId),
        missingFields: addr.missing,
      }).catch((err) =>
        console.error(
          "[canvas-fulfill] addr_email_failed",
          JSON.stringify({ printOrderId: row.id, error: err instanceof Error ? err.message : String(err) }),
        ),
      );
    }
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

  // ── Digital download branch — skip canvas pipeline entirely ───────────
  // Rows with sku='digital' have no shipping, no Gelato submit, no AuraSR.
  // Just rehost the print master + email the customer via Resend.
  if (row.sku === "digital" || row.size_key === "digital") {
    const lineItemNum = Number(row.shopify_line_item_id ?? "0");
    const meta2 = (row.metadata ?? {}) as {
      previewUrl?: string | null;
      printMasterPath?: string | null;
    };
    const result = await runDigitalFulfillment({
      shopifyOrderId: Number.isFinite(orderId) ? orderId : 0,
      shopifyLineItemId: Number.isFinite(lineItemNum) ? lineItemNum : 0,
      customerEmail: cron.customerEmail,
      // Prefer secure private path (post-2026-05-12). Fall back to URL for legacy.
      printMasterPath: meta2.printMasterPath ?? null,
      printMasterUrl: row.source_image_url ?? null,
      petName: (meta.petName ?? null) as string | null,
      previewUrl: meta2.previewUrl ?? null,
    });
    if (result.ok === false) {
      const stage = result.stage;
      const reason = result.reason;
      // H5 fix: digital failures used to be set terminal 'failed'. The cron
      // only drains 'pending', so a transient Resend/network blip after
      // payment meant the customer NEVER got their download and it was never
      // retried. Keep it retryable: stay 'pending' (+bump attempts) until the
      // attempt cap, THEN escalate to manual_review with an ops page.
      const DIGITAL_MAX_ATTEMPTS = 3;
      const nextAttempt = (row.attempts ?? 0) + 1;
      const exhausted = nextAttempt >= DIGITAL_MAX_ATTEMPTS;
      await updatePrintOrder({
        printOrderId: row.id,
        status: exhausted ? "manual_review" : "pending",
        lastError: `digital_${stage}: ${reason} (attempt ${nextAttempt}/${DIGITAL_MAX_ATTEMPTS})`,
        bumpAttempts: true,
      });
      if (exhausted) {
        await recordHighSeverityFailure({
          printOrderId: row.id,
          shopifyOrderId: row.shopify_order_id,
          shopifyLineItemId: row.shopify_line_item_id ?? "",
          sku: row.sku ?? "digital",
          stage: `digital_${stage}`,
          message: `Digital fulfilment failed ${DIGITAL_MAX_ATTEMPTS}× at ${stage}: ${reason} — customer paid, no download delivered. Manual send needed.`,
        });
      } else {
        console.warn(
          "[canvas-fulfill] digital_retry",
          JSON.stringify({ printOrderId: row.id, stage, attempt: nextAttempt, reason: reason.slice(0, 200) }),
        );
      }
      return;
    }
    // success path — narrowed: result.ok === true → has downloadUrl + emailMessageId
    await updatePrintOrder({
      printOrderId: row.id,
      status: "submitted",
      printMasterUrl: row.source_image_url ?? null,
      bumpAttempts: true,
      metadataMerge: { digital: { downloadUrl: result.downloadUrl, emailMessageId: result.emailMessageId } },
    });
    return;
  }

  // SECURITY: if the print master lives in the private bucket (post-2026-05-12),
  // sign a short-TTL URL so AuraSR (fal.ai) can fetch it once. The signed URL
  // expires before any practical scraping is feasible (10 min). Legacy carts
  // come through as plain public URLs — pass through unchanged.
  let sourceImageUrl = row.source_image_url ?? "";
  const metaWithPath = (row.metadata ?? {}) as { printMasterPath?: string | null };
  if (metaWithPath.printMasterPath) {
    const supabase = getSupabaseAdmin();
    const { data: signed, error: signErr } = await supabase.storage
      .from("pet-photos-private")
      .createSignedUrl(metaWithPath.printMasterPath, 60 * 10); // 10 minutes
    if (signErr || !signed?.signedUrl) {
      await updatePrintOrder({
        printOrderId: row.id,
        status: "failed",
        lastError: `private_signurl_failed: ${signErr?.message ?? "no_signed_url"}`,
        bumpAttempts: true,
      });
      await recordHighSeverityFailure({
        printOrderId: row.id,
        shopifyOrderId: row.shopify_order_id,
        shopifyLineItemId: row.shopify_line_item_id ?? "",
        sku: row.sku ?? "",
        stage: "intake",
        message: `Cannot sign private print master URL: ${signErr?.message ?? "no_signed_url"}`,
      });
      return;
    }
    sourceImageUrl = signed.signedUrl;
  }

  await runCanvasFulfillment({
    row,
    orderId: Number.isFinite(orderId) ? orderId : 0,
    eventId: "cron",
    shippingAddress: cron.shippingAddress ?? null,
    customerEmail: cron.customerEmail,
    sourceImageUrl,
    sizeKey: row.size_key ?? "",
    // null in the DB = unframed slim canvas. Anything else is one of the 3 wood tones.
    frameColor: (row.frame_color ?? null) as "black" | "natural-wood" | "dark-wood" | null,
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

// Email the customer when their order is held due to a missing shipping
// address field. Resend via direct fetch — same pattern as
// api/soul-reading.ts:275. Best-effort: any failure is logged but doesn't
// block the manual-review flow (Telegram alert still fires).
async function sendAddressConfirmationEmail(args: {
  to: string;
  orderId: string;
  missingFields: string[];
}): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn("[canvas-fulfill] RESEND_API_KEY missing — cannot email customer about address");
    return;
  }
  // Friendly labels for the technical field names from
  // shopifyAddressToGelato. If a field isn't here we just show it raw.
  const FRIENDLY: Record<string, string> = {
    address1: "street address (line 1)",
    address2: "apartment / unit (line 2)",
    city: "city",
    province: "state / county / region",
    province_code: "state / county / region",
    zip: "postcode / ZIP",
    country: "country",
    country_code: "country",
    name: "recipient name",
    first_name: "recipient first name",
    last_name: "recipient last name",
    phone: "phone number",
  };
  const missingHuman = args.missingFields.map((f) => FRIENDLY[f] ?? f).join(", ");
  const subject = `One detail missing for your Little Souls order #${args.orderId.slice(-6)}`;
  const html = `<!DOCTYPE html><html><body style="font-family:Georgia,serif;color:#141210;background:#FFFDF5;padding:40px 24px;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e8ddd0;border-radius:12px;padding:32px;">
    <p style="font-size:14px;letter-spacing:0.14em;color:#958779;text-transform:uppercase;margin:0 0 18px;">Little Souls</p>
    <h1 style="font-family:Georgia,serif;font-size:24px;font-weight:400;color:#141210;margin:0 0 16px;line-height:1.3;">We need one more thing to ship your canvas</h1>
    <p style="font-size:15px;line-height:1.6;color:#5a4a42;margin:0 0 16px;">Thank you for your order. Your portrait is ready to print, but the shipping address you gave us is missing the following:</p>
    <p style="font-size:15px;line-height:1.6;color:#bf524a;font-weight:600;margin:0 0 16px;">${missingHuman}</p>
    <p style="font-size:15px;line-height:1.6;color:#5a4a42;margin:0 0 16px;">Could you reply to this email with the missing detail(s)? We'll update your order and ship it within 24 hours of receiving your reply.</p>
    <p style="font-size:15px;line-height:1.6;color:#5a4a42;margin:0 0 24px;">If anything else looks off about your address on file, mention that too — easier to fix it now than after it ships.</p>
    <p style="font-size:13px;color:#958779;margin:0;">Order reference: <code style="font-family:Menlo,monospace;background:#faf4e8;padding:2px 6px;border-radius:4px;">${args.orderId}</code></p>
    <p style="font-size:13px;color:#958779;margin:18px 0 0;">— The Little Souls team</p>
  </div>
</body></html>`;
  const text = `Little Souls\n\nWe need one more thing to ship your canvas\n\nThank you for your order. Your portrait is ready to print, but the shipping address you gave us is missing the following:\n\n  ${missingHuman}\n\nCould you reply to this email with the missing detail(s)? We'll update your order and ship it within 24 hours of receiving your reply.\n\nOrder reference: ${args.orderId}\n\n— The Little Souls team`;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "Little Souls <hello@littlesouls.app>",
        to: args.to,
        reply_to: "hello@littlesouls.app",
        subject,
        html,
        text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) {
      const t = await r.text();
      console.error("[canvas-fulfill] address_email_non_2xx", {
        status: r.status,
        snippet: t.slice(0, 200),
      });
    }
  } catch (err) {
    console.error("[canvas-fulfill] address_email_threw", (err as Error).message);
  }
}
