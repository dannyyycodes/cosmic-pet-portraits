/**
 * Webhook-side reconstruction of fulfilment rows from a completed Stripe
 * Checkout Session (the Stripe-checkout-switch path).
 *
 * Mirrors what api/shopify.ts handleOrderPaid does for a Shopify order, but
 * sourced from Stripe session line items + product metadata (set in
 * api/_lib/stripeCartCheckout.ts):
 *   • canvas / framed-canvas / digital → upsertPrintOrder (cron + Gelato/digital
 *     pipeline drains it UNCHANGED).
 *   • soul-reading → insertJob (+ intake email OR triggerN8nForJob).
 *   • soul-edition → billed only; no print row, no job.
 *
 * Idempotency:
 *   • upsertPrintOrder UNIQUE (shopify_order_id, shopify_line_item_id) keyed on
 *     (session.id, li.id).
 *   • insertJob UNIQUE (shopify_event_id, shopify_line_item_id) keyed on
 *     (event.id, numLine). event.id is stable across Stripe delivery retries.
 *
 * The address is synthesised into the Shopify shape so shopifyAddressToGelato
 * (used by the cron pipeline) works UNCHANGED. The cron reads ONLY
 * metadata.cron.{customerEmail,shippingAddress,currency}.
 */
import type Stripe from "stripe";
import { getStripe } from "../../_lib/stripe.js";
import { upsertPrintOrder } from "../../_lib/printOrdersRepo.js";
import { insertJob } from "../../shopify/_lib/jobsRepo.js";
import { triggerN8nForJob } from "../../shopify/_lib/triggerN8n.js";

// ─── Deterministic stable int (for soul_reading_jobs numeric columns) ──────
// Stripe ids are strings (cs_..., li_...). soul_reading_jobs.shopify_order_id /
// shopify_line_item_id are numeric. Map a string id to a stable positive int
// (< 2^53) that is identical across webhook delivery retries (idempotency).
export function hashToSafeInt(s: string): number {
  // FNV-1a 32-bit → unsigned. Bounded to a safe positive integer.
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) || 1; // never 0
}

interface LineMeta {
  line_kind?: string;
  product_type?: string;
  size_key?: string;
  frame_color?: string;
  sku?: string;
  pet_name?: string;
  pet_dob?: string;
  pet_birth_location?: string;
  canvas_order_ref?: string;
  intake_pending?: string;
  preview_url?: string;
  source_photo_url?: string;
  print_master_path?: string;
  print_master_url_legacy?: string;
  ls_line_index?: string;
}

function metaOf(li: Stripe.LineItem): LineMeta {
  const product = (li.price?.product ?? null) as Stripe.Product | null;
  return ((product?.metadata ?? {}) as unknown) as LineMeta;
}

export async function reconstructFromSession(
  session: Stripe.Checkout.Session,
  event: Stripe.Event,
): Promise<void> {
  // The webhook payload carries neither line items nor expanded products.
  const full = await getStripe().checkout.sessions.retrieve(session.id, {
    expand: ["line_items", "line_items.data.price.product"],
  });

  // ── Synthesise the Shopify-shaped shipping address ──────────────────────
  // On 2026-04-22.dahlia the collected address lives at
  // collected_information.shipping_details (NOT session.shipping_details).
  const sd =
    (full as unknown as {
      collected_information?: {
        shipping_details?: {
          name?: string | null;
          address?: {
            line1?: string | null;
            line2?: string | null;
            city?: string | null;
            state?: string | null;
            country?: string | null;
            postal_code?: string | null;
          } | null;
        } | null;
      };
    }).collected_information?.shipping_details ?? null;
  const addr = sd?.address ?? {};
  const fullName = (sd?.name ?? full.customer_details?.name ?? "").trim();
  const [first, ...rest] = fullName.split(/\s+/).filter(Boolean);
  const synthShopifyAddress = {
    first_name: first || null,
    last_name: rest.join(" ") || null,
    company: null,
    address1: addr.line1 ?? null,
    address2: addr.line2 ?? null,
    city: addr.city ?? null,
    province: addr.state ?? null,
    province_code: addr.state ?? null,
    country: addr.country ?? null,
    country_code: addr.country ?? null,
    zip: addr.postal_code ?? null,
    phone: full.customer_details?.phone ?? null,
  };

  const customerEmail =
    full.customer_details?.email ?? full.customer_email ?? "";
  const currency = (full.currency ?? "gbp").toUpperCase();
  const paymentIntentId =
    typeof full.payment_intent === "string"
      ? full.payment_intent
      : full.payment_intent?.id ?? null;

  const consentCanvas =
    (full.metadata?.consent_canvas_personalised_at as string | undefined) ?? null;

  const lines = full.line_items?.data ?? [];

  for (const li of lines) {
    const m = metaOf(li);
    const kind = m.line_kind ?? "";

    if (kind === "canvas") {
      await upsertPrintOrder({
        shopifyOrderId: full.id,
        shopifyLineItemId: li.id,
        sku: m.sku ?? null,
        sizeKey: m.size_key ?? null,
        frameColor: m.frame_color || null,
        sourceImageUrl: m.print_master_url_legacy || null,
        printMasterUrl: m.print_master_url_legacy || null,
        metadata: {
          stripeSessionId: full.id,
          stripeEventId: event.id,
          stripe: { sessionId: full.id, paymentIntentId },
          sizeLabel: li.description ?? m.size_key,
          petName: m.pet_name,
          previewUrl: m.preview_url,
          sourcePhotoUrl: m.source_photo_url,
          ...(m.print_master_path ? { printMasterPath: m.print_master_path } : {}),
          dryRun: false,
          needsCustomisation: false,
          ...(consentCanvas ? { consentCanvasPersonalisedAt: consentCanvas } : {}),
          // Cron reads ONLY here.
          cron: { customerEmail, shippingAddress: synthShopifyAddress, currency },
        },
      });
      continue;
    }

    if (kind === "digital") {
      await upsertPrintOrder({
        shopifyOrderId: full.id,
        shopifyLineItemId: li.id,
        sku: "digital",
        sizeKey: "digital",
        frameColor: null,
        sourceImageUrl: m.print_master_url_legacy || null,
        printMasterUrl: m.print_master_url_legacy || null,
        metadata: {
          stripeSessionId: full.id,
          stripeEventId: event.id,
          stripe: { sessionId: full.id, paymentIntentId },
          sizeLabel: "Digital download",
          petName: m.pet_name,
          previewUrl: m.preview_url,
          sourcePhotoUrl: m.source_photo_url,
          ...(m.print_master_path ? { printMasterPath: m.print_master_path } : {}),
          // ls_line_index used by the cron digital branch to derive a stable
          // numeric storage path (avoids the ls-0-0.png collision on cs_/li_).
          lsLineIndex: m.ls_line_index ?? "",
          dryRun: false,
          cron: { customerEmail, shippingAddress: null, currency },
        },
      });
      continue;
    }

    if (kind === "soul-reading") {
      const intakePending = m.intake_pending === "true";
      const numOrder = hashToSafeInt(full.id);
      const numLine =
        Number(m.ls_line_index) >= 0 && m.ls_line_index !== undefined && m.ls_line_index !== ""
          ? Number(m.ls_line_index)
          : hashToSafeInt(li.id);
      const result = await insertJob({
        shopifyEventId: event.id,
        shopifyOrderId: numOrder,
        shopifyLineItemId: numLine,
        customerEmail,
        petName: m.pet_name ?? "",
        petDob: m.pet_dob ?? "",
        petBirthLocation: m.pet_birth_location ?? "",
        dryRun: false,
        intakePending,
      });
      if (result.duplicate || !result.row) continue;
      if (intakePending) {
        await sendIntakeRequestEmail({
          to: customerEmail,
          orderId: full.id,
          token: result.row.viewer_token ?? "",
        }).catch((err) =>
          console.error(
            "[reconstructFromSession] intake_email_failed",
            JSON.stringify({ sessionId: full.id, error: (err as Error).message }),
          ),
        );
      } else {
        await triggerN8nForJob(result.row).catch((err) =>
          console.error(
            "[reconstructFromSession] n8n_trigger_failed",
            JSON.stringify({ sessionId: full.id, error: (err as Error).message }),
          ),
        );
      }
      continue;
    }

    // soul-edition (billed only) and any unknown kind → skip. No row, no job.
  }
}

/**
 * Send the intake-request magic-link email (mirrors api/shopify.ts
 * sendIntakeRequestEmail). RESEND_API_KEY env required.
 */
async function sendIntakeRequestEmail(args: {
  to: string;
  orderId: string;
  token: string;
}): Promise<void> {
  const { renderIntakeRequestEmail } = await import(
    "../../_lib/email/intakeRequestEmail.js"
  );
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn("[reconstructFromSession] RESEND_API_KEY missing — cannot send intake email");
    return;
  }
  if (!args.token) {
    console.warn("[reconstructFromSession] intake email missing token — cannot build magic link");
    return;
  }
  const siteBase = process.env.PUBLIC_SITE_URL ?? "https://www.littlesouls.app";
  const intakeUrl = `${siteBase.replace(/\/$/, "")}/reading/intake/${encodeURIComponent(args.token)}`;
  const email = renderIntakeRequestEmail({
    intakeUrl,
    orderRef: args.orderId.slice(-6),
    siteBaseUrl: siteBase,
  });
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendKey}`,
    },
    body: JSON.stringify({
      from: email.from,
      to: args.to,
      reply_to: email.replyTo,
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    console.error("[reconstructFromSession] intake_email_non_2xx", {
      status: r.status,
      snippet: t.slice(0, 200),
    });
  }
}
