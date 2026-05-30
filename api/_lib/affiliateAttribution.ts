/**
 * Affiliate attribution for the SHOPIFY order path (pawtraits canvas, digital,
 * mug/tote/tee/hoodie, gift cards, and the Soul-Reading-via-Shopify line).
 *
 * The Stripe report funnel attributes via supabase/functions/track-referral
 * (flat commission_rate on the whole Stripe session). That function cannot be
 * reused here: it retrieves a *Stripe* session and applies a single rate to the
 * whole order. The Shopify path needs PER-LINE rates because a single cart can
 * mix a physical canvas (low margin → 15%) with a digital Soul Reading
 * (~95% margin → full affiliate rate).
 *
 * Margin rule (Danny, 2026-05-28):
 *   • PHYSICAL lines (canvas / framed / mug / tote / tee / hoodie): 15% of net.
 *     Canvas runs ~50% gross margin; paying the digital 50% rate would sell at
 *     a loss. 15% leaves ~35% net on an entry canvas.
 *   • DIGITAL lines (Soul Reading, digital download, Soul Edition add-on):
 *     the affiliate's stored commission_rate (default ~50%, tier-aware) — these
 *     are ~95-97% margin so they carry the full rate.
 *   • GIFT CARDS are excluded — they're stored value, commission pays on the
 *     redemption order, never on the card purchase (double-pay guard).
 *
 * One affiliate_referrals row per Shopify order (idempotent on the synthetic
 * stripe_session_id = `shopify_<orderId>`), summing commission across lines.
 * Best-effort: never throws into the webhook — a tracking failure must not 500
 * a paid order.
 */
import { getSupabaseAdmin } from "./supabaseAdmin.js";

// Variant IDs mirror api/cart/checkout.ts / gelatoFramedCanvas.ts.
const SOUL_READING_VARIANT_ID = 64601427640669;
const DIGITAL_DOWNLOAD_VARIANT_ID = 64669378511197;
const GIFT_CARD_VARIANT_IDS = new Set<number>([
  64670403428701, 64670403461469, 64670403494237, 64670403527005,
]);
const DIGITAL_VARIANT_IDS = new Set<number>([
  SOUL_READING_VARIANT_ID,
  DIGITAL_DOWNLOAD_VARIANT_ID,
]);

const PHYSICAL_RATE = 0.15; // margin-locked for print-on-demand physical goods
const REFERRAL_CODE_RE = /^[a-zA-Z0-9_-]{3,50}$/;

interface ShopifyLineItemLike {
  variant_id?: number | string | null;
  price?: string | number | null;
  quantity?: number | null;
  total_discount?: string | number | null;
  title?: string | null;
  name?: string | null;
}
interface ShopifyNoteAttribute {
  name?: string | null;
  value?: string | null;
}
export interface ShopifyOrderForAttribution {
  id?: number | string;
  email?: string | null;
  currency?: string | null;
  note_attributes?: ShopifyNoteAttribute[] | null;
  line_items?: ShopifyLineItemLike[] | null;
  test?: boolean;
}

function toCents(v: string | number | null | undefined): number {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

/** digital | physical | skip (gift cards). */
function classifyLine(li: ShopifyLineItemLike): "digital" | "physical" | "skip" {
  const vid = li.variant_id == null ? null : Number(li.variant_id);
  if (vid !== null && GIFT_CARD_VARIANT_IDS.has(vid)) return "skip";
  if (vid !== null && DIGITAL_VARIANT_IDS.has(vid)) return "digital";
  // Custom-priced Soul Edition add-on has no variant_id — match on title.
  const label = `${li.title ?? ""} ${li.name ?? ""}`.toLowerCase();
  if (vid === null && label.includes("soul edition")) return "digital";
  if (vid === null && label.includes("soul reading")) return "digital";
  return "physical";
}

function readAffiliateRef(order: ShopifyOrderForAttribution): string | null {
  for (const a of order.note_attributes ?? []) {
    if (a?.name === "_affiliate_ref" && typeof a.value === "string") {
      const code = a.value.trim();
      return REFERRAL_CODE_RE.test(code) ? code : null;
    }
  }
  return null;
}

export interface AttributionResult {
  tracked: boolean;
  reason?: string;
  affiliateId?: string;
  commissionCents?: number;
  amountCents?: number;
}

/**
 * Attribute a paid Shopify order to an affiliate. HMAC verification of the
 * webhook is the caller's responsibility (api/shopify.ts) — by the time we get
 * here the order is trusted + paid, so we don't re-verify payment.
 */
export async function attributeShopifyOrder(
  order: ShopifyOrderForAttribution,
): Promise<AttributionResult> {
  const code = readAffiliateRef(order);
  if (!code) return { tracked: false, reason: "no_referral_code" };
  if (order.test === true) return { tracked: false, reason: "test_order" };

  const orderId = order.id == null ? null : String(order.id);
  if (!orderId) return { tracked: false, reason: "no_order_id" };
  const sessionKey = `shopify_${orderId}`;

  const supa = getSupabaseAdmin();

  // Idempotency — one referral row per order.
  const { data: existing } = await supa
    .from("affiliate_referrals")
    .select("id")
    .eq("stripe_session_id", sessionKey)
    .maybeSingle();
  if (existing) return { tracked: false, reason: "already_tracked" };

  // Resolve affiliate (active only).
  const { data: affiliate, error: affErr } = await supa
    .from("affiliates")
    .select("id, commission_rate, email")
    .eq("referral_code", code)
    .eq("status", "active")
    .maybeSingle();
  if (affErr || !affiliate) return { tracked: false, reason: "affiliate_not_found" };

  // Self-referral guard.
  const buyerEmail = (order.email ?? "").toLowerCase().trim();
  if (buyerEmail && affiliate.email && affiliate.email.toLowerCase() === buyerEmail) {
    return { tracked: false, reason: "self_referral" };
  }

  const digitalRate = Number(affiliate.commission_rate) || 0;
  let amountCents = 0;
  let commissionCents = 0;
  for (const li of order.line_items ?? []) {
    const kind = classifyLine(li);
    if (kind === "skip") continue;
    const qty = Math.max(1, Number(li.quantity) || 1);
    const gross = toCents(li.price) * qty;
    const discount = toCents(li.total_discount);
    const net = Math.max(0, gross - discount);
    if (net <= 0) continue;
    const rate = kind === "digital" ? digitalRate : PHYSICAL_RATE;
    amountCents += net;
    commissionCents += Math.round(net * rate);
  }

  if (commissionCents <= 0) return { tracked: false, reason: "no_commissionable_lines" };

  const { error: insErr } = await supa.from("affiliate_referrals").insert({
    affiliate_id: affiliate.id,
    stripe_session_id: sessionKey,
    amount_cents: amountCents,
    commission_cents: commissionCents,
    currency: (order.currency || "GBP").toUpperCase(),
    status: "pending",
  });
  if (insErr) {
    // 23505 = unique violation = a concurrent webhook replay already tracked it.
    if ((insErr as { code?: string }).code === "23505") {
      return { tracked: false, reason: "already_tracked_race" };
    }
    return { tracked: false, reason: `insert_failed:${insErr.message}` };
  }

  // Atomic stats bump (same RPC the Stripe path uses).
  const { error: rpcErr } = await supa.rpc("increment_affiliate_stats", {
    p_affiliate_id: affiliate.id,
    p_commission_cents: commissionCents,
  });
  if (rpcErr) {
    // Row is recorded; stats bump is best-effort (matches track-referral).
    console.error(
      "[affiliateAttribution] stats_bump_failed",
      JSON.stringify({ orderId, affiliateId: affiliate.id, error: rpcErr.message }),
    );
  }

  return {
    tracked: true,
    affiliateId: affiliate.id,
    commissionCents,
    amountCents,
  };
}
