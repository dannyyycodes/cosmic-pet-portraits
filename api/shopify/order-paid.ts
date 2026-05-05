/**
 * POST /api/shopify/order-paid — Shopify orders/paid webhook handler.
 *
 *   Shopify -> HMAC-verified raw body
 *           -> classify line items (Soul Reading / canvas / needs-customisation)
 *           -> idempotent INSERT into soul_reading_jobs
 *           -> reply 200 within 5s
 *           -> async fire-and-forget POST to n8n for each fresh Soul Reading row
 *
 * Spec sources:
 *   - research-2026-05-04-soul-reading-fulfilment §2 (architecture, HMAC, retry)
 *   - research-2026-05-04-soul-reading-fulfilment §4 (test-mode guard, dry_run)
 *   - research-2026-05-04-post-purchase-customisation §1 (customisation_pending tag)
 *   - launch-plan-2026-05-05 Phase 4 (route shape, env vars, cron)
 *
 * Vercel runtime: default Node.js (NOT Edge — we need raw body Buffer for
 * crypto.timingSafeEqual + the @supabase/supabase-js client).
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readRawBody, verifyShopifyHmac } from "./_lib/verifyHmac.js";
import { classifyLineItems, type ShopifyOrderLike, type SoulReadingItem } from "./_lib/extractReadings.js";
import { insertJob } from "./_lib/jobsRepo.js";
import { triggerN8nForJob } from "./_lib/triggerN8n.js";

export const config = {
  api: { bodyParser: false },
};

/** Total budget the async n8n batch is given before we cut it loose. Must be
 *  comfortably under Shopify's 5s response window. */
const ASYNC_TRIGGER_DEADLINE_MS = 4_500;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // 1. Read raw body
  let rawBody: Buffer;
  try {
    rawBody = await readRawBody(req);
  } catch (err) {
    console.error(
      "[orders/paid] raw_body_read_failed",
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
    );
    return res.status(500).json({ error: "raw body read failed" });
  }

  // 2. HMAC verify (BEFORE JSON.parse). On failure, 401 silently — never echo
  //    payload back. Shopify will retry per its 8/4h policy.
  const hmacHeader = (req.headers["x-shopify-hmac-sha256"] as string | undefined) ?? undefined;
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[orders/paid] SHOPIFY_WEBHOOK_SECRET not configured");
    // Return 500 (NOT 401) so Shopify retries until env is set.
    return res.status(500).json({ error: "webhook secret not configured" });
  }
  if (!verifyShopifyHmac(rawBody, hmacHeader, secret)) {
    console.warn(
      "[orders/paid] hmac_invalid",
      JSON.stringify({
        hadHeader: Boolean(hmacHeader),
        bodyLen: rawBody.length,
      }),
    );
    return res.status(401).end();
  }

  // 3. Identify the topic + event id
  const topic = (req.headers["x-shopify-topic"] as string | undefined) ?? "";
  const eventId =
    (req.headers["x-shopify-webhook-id"] as string | undefined) ??
    (req.headers["x-shopify-event-id"] as string | undefined);
  const shopDomain = (req.headers["x-shopify-shop-domain"] as string | undefined) ?? "";

  if (topic && topic !== "orders/paid") {
    // We're subscribed to orders/paid only; if Shopify sends something else
    // (mis-configured subscription, mis-routed delivery), 200 + no-op.
    console.warn("[orders/paid] unexpected_topic", JSON.stringify({ topic, eventId, shopDomain }));
    return res.status(200).json({ ok: true, skipped: "unexpected_topic", topic });
  }

  if (!eventId) {
    console.warn("[orders/paid] missing_event_id", JSON.stringify({ shopDomain }));
    // Without an event id we cannot dedupe. Reply 200 to avoid retries that
    // would also lack the header; log so Danny can investigate.
    return res.status(200).json({ ok: true, skipped: "missing_event_id" });
  }

  // 4. Parse body — only AFTER HMAC verified.
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
    // Without an order id the row constraint blows up — 200 + skip so Shopify
    // doesn't hammer us; this is malformed rather than retriable.
    return res.status(200).json({ ok: true, skipped: "missing_order_id" });
  }

  // 5. Classify
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

  // Canvas lines: Gelato Shopify connector handles fulfilment automatically.
  // The Phase 9 printPipeline.ts (api/portraits.ts?action=printOrder) is
  // exposed but NOT called from this webhook — that's a Phase 13 future task.
  if (canvasCount > 0) {
    console.log(
      "[orders/paid] canvas_lines_skipped",
      JSON.stringify({ eventId, orderId, count: canvasCount, note: "Gelato Shopify connector handles" }),
    );
  }

  // Customisation-pending lines (TikTok Shop Flow B): Phase 7 will:
  //  - tag the order `customisation_pending`
  //  - set the `customisation.token` order metafield
  //  - trigger a Klaviyo flow with the upload-your-photo CTA
  // For now, log + TODO so the Phase 7 agent has a clear hook.
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

  // 6. Idempotent inserts for each Soul Reading line.
  const customerEmail = (order.email ?? "").trim() || "unknown@littlesouls.app";
  const freshRows: import("./_lib/jobsRepo.js").SoulReadingJobRow[] = [];
  let duplicates = 0;
  let incompleteSkipped = 0;

  for (const sr of soulReadings) {
    if (sr.hasIncompleteInputs) {
      // Defensive: don't insert garbage rows. Log so Danny can investigate.
      // The Phase 2 cart-drawer enforces these client-side; a hit here means
      // the customer somehow bypassed the form (Shopify draft order, etc).
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
      // DB error — let Shopify retry. Bail out of the whole handler with 500.
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

  // 7. On dry-run orders we INSERT (so Danny can see the row) but skip n8n.
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

  // 8. Async fire-and-forget — bounded so Shopify gets its 200 within 5s.
  //    We DO NOT await the full batch. Promise.race kicks the response out
  //    once the deadline hits or all triggers settle, whichever is first.
  if (triggerableRows.length > 0) {
    const triggerWork = Promise.allSettled(triggerableRows.map((r) => triggerN8nForJob(r)));
    const deadline = new Promise<"deadline">((resolve) =>
      setTimeout(() => resolve("deadline"), ASYNC_TRIGGER_DEADLINE_MS),
    );
    await Promise.race([triggerWork, deadline]);
    // Whatever didn't finish in time keeps running on the function instance
    // until Vercel reaps it; the reconciliation cron is the safety net.
  }

  console.log(
    "[orders/paid] done",
    JSON.stringify({ eventId, orderId, accepted: freshRows.length, duplicates }),
  );

  return res.status(200).json({
    ok: true,
    accepted: freshRows.length,
    duplicates,
    dryRun,
    canvas: canvasCount,
    customisationPending: customisationPending.length,
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
