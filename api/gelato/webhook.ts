/**
 * POST /api/gelato/webhook — inbound Gelato status webhook listener.
 *
 * Gelato fires webhooks for order + item lifecycle events. We care about:
 *   - order_status_updated      — overall order status (printed, shipped, ...)
 *   - order_item_status_updated — per-item status (sometimes the only signal
 *                                  on multi-item orders)
 *   - order_delivery_estimate_updated (logged, no state change)
 *
 * Reference: https://dashboard.gelato.com/docs/webhooks/
 *
 * Auth verification:
 *   Gelato's webhook UI does NOT do HMAC signing — instead it lets each
 *   store configure a custom HTTP header sent on every webhook call. We
 *   configured Header Name `x-gelato-secret` with a Gelato-generated key,
 *   stored as GELATO_WEBHOOK_SECRET env. Constant-time string compare.
 *   (`Authorization: Bearer <token>` also accepted for forward compat.)
 *   If GELATO_WEBHOOK_SECRET is unset we 500 (config error) so Gelato
 *   retries until ops fixes the env.
 *
 * Idempotency:
 *   Every event has an `id` field (the dedupe key). We INSERT into
 *   gelato_webhook_events keyed on event_id; if the upsert returns no rows
 *   we know it's a replay and 200 immediately.
 *
 * Side effects on first delivery:
 *   - Update print_orders.status (printed/shipped/delivered/canceled/failed).
 *   - For shipped + delivered → INSERT pawtrait_touchpoints with
 *     scheduled_for=now() and the appropriate touchpoint_type.
 *
 * Response codes:
 *   200 — accepted (processed OR known replay)
 *   400 — invalid JSON
 *   401 — bad signature
 *   500 — config or DB error (Gelato retries)
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { timingSafeEqual } from "node:crypto";
import {
  recordGelatoWebhookEvent,
  deleteGelatoWebhookEvent,
  getPrintOrderByGelatoId,
  getPrintOrderByGelatoReference,
  updatePrintOrder,
  insertPawtraitTouchpoint,
  insertPrintOrderAlert,
  type PrintOrderStatus,
  type PrintOrderRow,
} from "../_lib/printOrdersRepo.js";

export const config = {
  api: { bodyParser: false },
};

const AUTH_HEADER_NAMES = ["x-gelato-secret", "authorization"] as const;

// Gelato event names we handle. The exact set differs slightly per docs
// version — keep this list narrow and let everything else fall through to
// "logged, ignored" rather than guess.
const HANDLED_EVENTS = new Set<string>([
  "order_status_updated",
  "order_item_status_updated",
  "order_delivery_estimate_updated",
]);

// Gelato order/item statuses → our print_orders.status
//   passed: pending → submitted → printed → shipped → delivered
//   failure: canceled, failed
function mapGelatoStatus(s: string | undefined | null): PrintOrderStatus | null {
  if (typeof s !== "string") return null;
  const v = s.toLowerCase();
  // Exact docs vocab — "printed" is a valid intermediate, "in_production",
  // "in_transit", "fulfilled" are common variants.
  if (v === "created" || v === "passed" || v === "pending_approval") return "submitted";
  if (v === "printed" || v === "in_production" || v === "production") return "printed";
  if (v === "shipped" || v === "in_transit" || v === "dispatched") return "shipped";
  if (v === "delivered" || v === "fulfilled") return "delivered";
  if (v === "canceled" || v === "cancelled") return "canceled";
  if (v === "failed" || v === "rejected" || v === "error") return "failed";
  return null;
}

interface GelatoWebhookPayload {
  id?: string;
  event?: string;
  // Gelato historically nests under `data`, but newer payloads put fields at
  // the top level. Tolerate both.
  data?: Record<string, unknown>;
  // Order-level fields (order_status_updated)
  orderId?: string;
  orderReferenceId?: string;
  fulfillmentStatus?: string;
  // Item-level fields (order_item_status_updated)
  itemReferenceId?: string;
  status?: string;
  // shipped fields
  trackingCode?: string;
  trackingUrl?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const secret = process.env.GELATO_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[gelato] GELATO_WEBHOOK_SECRET not configured");
    res.status(500).json({ error: "webhook secret not configured" });
    return;
  }

  // 1. Verify header token. Gelato's webhook UI lets us configure a custom
  // HTTP header (we use `x-gelato-secret`) sent on every webhook call.
  // Constant-time compare against GELATO_WEBHOOK_SECRET. (Note: the original
  // implementation expected HMAC-SHA256 of the body, but Gelato's actual
  // mechanism is a static header — see commit message for context.)
  const headerToken = readHeaderToken(req.headers);
  if (!headerToken) {
    console.warn("[gelato] missing_auth_header");
    res.status(401).end();
    return;
  }
  if (!constantTimeEqualString(headerToken, secret)) {
    console.warn(
      "[gelato] auth_token_mismatch",
      JSON.stringify({ tokenLen: headerToken.length }),
    );
    res.status(401).end();
    return;
  }

  // 2. Read raw body (still need raw → JSON.parse, body parser is disabled).
  let rawBody: Buffer;
  try {
    rawBody = await readRawBody(req);
  } catch (err) {
    console.error(
      "[gelato] raw_body_read_failed",
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
    );
    res.status(500).json({ error: "raw body read failed" });
    return;
  }

  // 3. Parse JSON.
  let payload: GelatoWebhookPayload;
  try {
    payload = JSON.parse(rawBody.toString("utf8")) as GelatoWebhookPayload;
  } catch (err) {
    console.error(
      "[gelato] json_parse_failed",
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
    );
    res.status(400).json({ error: "invalid json" });
    return;
  }

  const eventId = payload.id;
  const eventName = (payload.event ?? "").toLowerCase();
  if (!eventId) {
    console.warn("[gelato] missing_event_id", JSON.stringify({ eventName }));
    res.status(200).json({ ok: true, skipped: "missing_event_id" });
    return;
  }

  // 4. Idempotent dedupe.
  let firstTime = false;
  try {
    const r = await recordGelatoWebhookEvent({ eventId, eventName, payload });
    firstTime = r.firstTime;
  } catch (err) {
    console.error(
      "[gelato] dedupe_insert_failed",
      JSON.stringify({ eventId, eventName, error: err instanceof Error ? err.message : String(err) }),
    );
    // Surface 500 so Gelato retries — we don't want to silently drop events.
    res.status(500).json({ error: "dedupe_failed" });
    return;
  }

  if (!firstTime) {
    console.log("[gelato] replay", JSON.stringify({ eventId, eventName }));
    res.status(200).json({ ok: true, replayed: true });
    return;
  }

  if (!HANDLED_EVENTS.has(eventName)) {
    console.log("[gelato] event_not_handled", JSON.stringify({ eventId, eventName }));
    res.status(200).json({ ok: true, skipped: "event_not_handled", eventName });
    return;
  }

  // 5. Update state.
  try {
    await processGelatoEvent({ eventId, eventName, payload });
  } catch (err) {
    console.error(
      "[gelato] process_failed",
      JSON.stringify({
        eventId,
        eventName,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
    // C4 fix: the dedupe row was inserted in step 4 BEFORE processing. If we
    // 500 now without removing it, Gelato's retry hits the replay branch and
    // 200s — the status update / shipped-delivered touchpoint is lost
    // forever. So delete the dedupe row (best-effort) so the retry is treated
    // as a fresh first delivery and actually reprocesses. (Mirrors the Stripe
    // webhook's delete-on-failure behaviour.)
    try {
      await deleteGelatoWebhookEvent(eventId);
    } catch (delErr) {
      console.error(
        "[gelato] dedupe_rollback_failed",
        JSON.stringify({
          eventId,
          eventName,
          error: delErr instanceof Error ? delErr.message : String(delErr),
        }),
      );
      // Last-resort audit so ops can see a permanently-stuck event.
      try {
        await insertPrintOrderAlert({
          printOrderId: null,
          severity: "high",
          message: `Gelato webhook process failed AND dedupe rollback failed — event may be permanently lost (event=${eventName})`,
          details: { eventId, eventName },
        });
      } catch {
        /* alerts table is best-effort */
      }
    }
    // 500 so Gelato retries; the retry will now reprocess from scratch.
    res.status(500).json({ error: "process_failed" });
    return;
  }

  res.status(200).json({ ok: true, eventId, eventName });
}

// ─── Event processor ───────────────────────────────────────────────────────

async function processGelatoEvent(args: {
  eventId: string;
  eventName: string;
  payload: GelatoWebhookPayload;
}): Promise<void> {
  const { payload } = args;
  const root = (payload.data && typeof payload.data === "object" ? (payload.data as Record<string, unknown>) : {}) ?? {};

  // Gelato is inconsistent about where fields land. Look in both spots.
  const orderId = readString(root, "orderId") ?? payload.orderId ?? null;
  const orderReferenceId = readString(root, "orderReferenceId") ?? payload.orderReferenceId ?? null;
  const itemReferenceId = readString(root, "itemReferenceId") ?? payload.itemReferenceId ?? null;
  const orderStatus =
    readString(root, "fulfillmentStatus") ??
    readString(root, "status") ??
    payload.fulfillmentStatus ??
    payload.status ??
    null;
  const trackingCode = readString(root, "trackingCode") ?? payload.trackingCode ?? null;
  const trackingUrl = readString(root, "trackingUrl") ?? payload.trackingUrl ?? null;

  // Resolve the print_orders row. Prefer gelato_order_id, fall back to ref.
  let row: PrintOrderRow | null = null;
  if (orderId) row = await getPrintOrderByGelatoId(orderId);
  if (!row && orderReferenceId) row = await getPrintOrderByGelatoReference(orderReferenceId);

  if (!row) {
    // Most common reason: a Gelato webhook arrived for an order placed via
    // the legacy Shopify-Gelato connector (before this fix). We can't
    // attribute it to a print_orders row but we still want the audit trail —
    // log + insert an unattributed alert so ops can correlate.
    console.warn(
      "[gelato] no_matching_print_order",
      JSON.stringify({ eventId: args.eventId, eventName: args.eventName, orderId, orderReferenceId, itemReferenceId }),
    );
    try {
      await insertPrintOrderAlert({
        printOrderId: null,
        severity: "low",
        message: `Gelato webhook for unknown order (event=${args.eventName})`,
        details: {
          eventId: args.eventId,
          eventName: args.eventName,
          orderId,
          orderReferenceId,
          itemReferenceId,
          status: orderStatus,
        },
      });
    } catch {
      /* swallow — alerts table is best-effort */
    }
    return;
  }

  if (args.eventName === "order_delivery_estimate_updated") {
    // Just log + persist on metadata, no status change.
    await updatePrintOrder({
      printOrderId: row.id,
      metadataMerge: { lastDeliveryEstimate: root, deliveryEstimateAt: new Date().toISOString() },
    });
    return;
  }

  const next = mapGelatoStatus(orderStatus);
  if (!next) {
    console.log(
      "[gelato] unknown_status",
      JSON.stringify({ eventId: args.eventId, eventName: args.eventName, status: orderStatus, printOrderId: row.id }),
    );
    await updatePrintOrder({
      printOrderId: row.id,
      metadataMerge: { lastUnmappedStatus: orderStatus, lastUnmappedAt: new Date().toISOString() },
    });
    return;
  }

  await updatePrintOrder({
    printOrderId: row.id,
    status: next,
    gelatoOrderId: orderId ?? row.gelato_order_id,
    metadataMerge: {
      lastEvent: { id: args.eventId, name: args.eventName, status: orderStatus, at: new Date().toISOString() },
      ...(trackingCode ? { trackingCode } : {}),
      ...(trackingUrl ? { trackingUrl } : {}),
    },
  });

  // Touchpoint side-effects on shipped + delivered.
  if (next === "shipped" || next === "delivered") {
    const meta = (row.metadata && typeof row.metadata === "object" ? row.metadata : {}) as Record<string, unknown>;
    // H2 fix: the customer email + pet name are written by the Shopify
    // orders/paid handler under metadata.cron.* — NOT at the top level. The
    // old code read meta.customerEmail (always undefined) so every
    // shipped/delivered touchpoint was created with email=null and the
    // customer never got their "shipped"/"arrived" email. Read from
    // metadata.cron first, fall back to top-level for any legacy rows.
    const cronMeta = (meta.cron && typeof meta.cron === "object" ? (meta.cron as Record<string, unknown>) : {}) as Record<string, unknown>;
    const pickStr = (k: string): string | null => {
      const a = cronMeta[k];
      if (typeof a === "string" && a.length > 0) return a;
      const b = meta[k];
      return typeof b === "string" && b.length > 0 ? b : null;
    };
    const email = pickStr("customerEmail");
    const petName = pickStr("petName");
    if (!email) {
      console.warn(
        "[gelato] touchpoint_missing_email",
        JSON.stringify({ printOrderId: row.id, type: next }),
      );
    }
    try {
      const r = await insertPawtraitTouchpoint({
        printOrderId: row.id,
        userId: row.user_id,
        touchpointType: next,
        scheduledFor: new Date(),
        email,
        petName,
        metadata: {
          gelatoEventId: args.eventId,
          trackingCode,
          trackingUrl,
          sku: row.sku,
        },
      });
      console.log(
        "[gelato] touchpoint_inserted",
        JSON.stringify({ printOrderId: row.id, type: next, inserted: r.inserted }),
      );
    } catch (err) {
      console.error(
        "[gelato] touchpoint_insert_failed",
        JSON.stringify({
          printOrderId: row.id,
          type: next,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
      // Don't rethrow — the status update succeeded, touchpoint is a follow-up.
    }
  }
}

// ─── Header-token auth ─────────────────────────────────────────────────────
//
// Gelato's webhook UI lets each store configure a custom HTTP header sent on
// every webhook call. We use `x-gelato-secret`. Also accept `Authorization:
// Bearer <token>` for forward compat in case the UI changes later.

function readHeaderToken(headers: VercelRequest["headers"]): string | null {
  for (const h of AUTH_HEADER_NAMES) {
    const raw = headers[h];
    const v = typeof raw === "string" ? raw : Array.isArray(raw) && raw.length > 0 ? raw[0] : null;
    if (typeof v !== "string" || v.length === 0) continue;
    // Strip optional "Bearer " prefix.
    const trimmed = v.replace(/^Bearer\s+/i, "").trim();
    if (trimmed.length > 0) return trimmed;
  }
  return null;
}

function constantTimeEqualString(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

// ─── Raw body reader ───────────────────────────────────────────────────────

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  return await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", (err: Error) => reject(err));
  });
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function readString(o: Record<string, unknown>, k: string): string | null {
  const v = o[k];
  return typeof v === "string" && v.length > 0 ? v : null;
}
