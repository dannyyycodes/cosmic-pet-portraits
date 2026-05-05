/**
 * POST /api/shopify/refunds-create — Shopify refunds/create webhook handler.
 *
 *   Shopify -> HMAC-verified raw body
 *           -> for each refund_line_item, look up matching soul_reading_jobs row
 *           -> if status in ('pending','triggered'): mark cancelled_pre_render
 *           -> if status in ('generated','delivered'): append audit log only
 *           -> if status terminal: skip
 *           -> reply 200
 *
 * Spec sources:
 *   - research-2026-05-04-soul-reading-fulfilment §7 (refund logic)
 *   - launch-plan-2026-05-05 Phase 8
 *
 * Critical rule: never auto-cancel a reading after OpenRouter spend. Once the
 * worker has called OpenRouter the £40 of compute is gone — the refund
 * decision is between Danny and the customer. We log only.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readRawBody, verifyShopifyHmac } from "./_lib/verifyHmac.js";
import {
  getJobByOrderAndLineItem,
  cancelPreRender,
  appendRefundEvent,
} from "./_lib/jobsRepo.js";

export const config = {
  api: { bodyParser: false },
};

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  let rawBody: Buffer;
  try {
    rawBody = await readRawBody(req);
  } catch (err) {
    console.error(
      "[refunds/create] raw_body_read_failed",
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
    );
    return res.status(500).json({ error: "raw body read failed" });
  }

  const hmacHeader = (req.headers["x-shopify-hmac-sha256"] as string | undefined) ?? undefined;
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[refunds/create] SHOPIFY_WEBHOOK_SECRET not configured");
    return res.status(500).json({ error: "webhook secret not configured" });
  }
  if (!verifyShopifyHmac(rawBody, hmacHeader, secret)) {
    console.warn(
      "[refunds/create] hmac_invalid",
      JSON.stringify({ hadHeader: Boolean(hmacHeader), bodyLen: rawBody.length }),
    );
    return res.status(401).end();
  }

  const topic = (req.headers["x-shopify-topic"] as string | undefined) ?? "";
  const eventId =
    (req.headers["x-shopify-webhook-id"] as string | undefined) ??
    (req.headers["x-shopify-event-id"] as string | undefined);
  const shopDomain = (req.headers["x-shopify-shop-domain"] as string | undefined) ?? "";

  if (topic && topic !== "refunds/create") {
    console.warn("[refunds/create] unexpected_topic", JSON.stringify({ topic, eventId, shopDomain }));
    return res.status(200).json({ ok: true, skipped: "unexpected_topic", topic });
  }

  if (!eventId) {
    console.warn("[refunds/create] missing_event_id", JSON.stringify({ shopDomain }));
    return res.status(200).json({ ok: true, skipped: "missing_event_id" });
  }

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
      // Row lookup failure → 500 so Shopify retries.
      return res.status(500).json({ error: "db_lookup_failed" });
    }

    if (!row) {
      // Not a Soul Reading line — probably a canvas refund. Gelato handles
      // its side. Nothing for us to do.
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

      // status in ('cancelled_pre_render', 'failed', 'dry_run')
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
