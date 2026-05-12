/**
 * Digital fulfilment pipeline.
 *
 *   line-item printMasterUrl  →  download to buffer  →  rehost to durable Supabase storage
 *                              →  sign 30-day URL    →  Resend email with download CTA
 *
 * Triggered by the orders/paid webhook for any line item whose variant_id
 * matches DIGITAL_VARIANT.variantId. Bypasses Gelato entirely — there's no
 * physical product, no shipping address, no print pipeline.
 *
 * Critical path: every digital order goes through here. If the rehost or
 * email fails, the print_orders row stays at status='pending' for the cron
 * worker to retry. Telegram alert fires on repeated failure so ops can
 * manually email the customer.
 *
 * Cost per fulfilment: ~£0.10 (fal.ai render was already paid when the cart
 * was built) + Supabase storage (free tier) + Resend (free under 100/day) ≈ £0.10.
 * Margin at £19 retail: ~97%.
 */

import { getSupabaseAdmin } from "./supabaseAdmin.js";
import { renderDigitalReadyEmail } from "./email/digitalReadyEmail.js";

const FETCH_TIMEOUT_DOWNLOAD_MS = 30_000;
const FETCH_TIMEOUT_EMAIL_MS = 10_000;
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface RunDigitalFulfillmentArgs {
  /** Shopify order id (numeric). */
  shopifyOrderId: number;
  /** Shopify line item id (used to ensure unique storage path per item). */
  shopifyLineItemId: number;
  /** Customer email to deliver to. */
  customerEmail: string;
  /** PRIVATE storage path for the print master (post-2026-05-12 secure flow).
   *  When present, fetched via admin client from pet-photos-private bucket. */
  printMasterPath: string | null;
  /** LEGACY: print master URL (pre-2026-05-12 carts only). Used as fallback if
   *  printMasterPath is null. */
  printMasterUrl: string | null;
  /** Pet name for the email subject + body. Falls back to "your pet". */
  petName: string | null;
  /** Preview-size image (web res, optional) — used as the email hero thumbnail. */
  previewUrl: string | null;
}

export type DigitalFulfillmentResult =
  | {
      ok: true;
      downloadUrl: string;
      durableStoragePath: string;
      emailMessageId: string | null;
    }
  | {
      ok: false;
      stage: "download" | "upload" | "sign" | "email";
      reason: string;
      details?: unknown;
    };

function log(stage: string, ctx: Record<string, unknown>) {
  // eslint-disable-next-line no-console
  console.log(`[digitalFulfill] ${stage}`, JSON.stringify(ctx));
}

function logError(stage: string, ctx: Record<string, unknown>) {
  // eslint-disable-next-line no-console
  console.error(`[digitalFulfill] ${stage}`, JSON.stringify(ctx));
}

export async function runDigitalFulfillment(
  args: RunDigitalFulfillmentArgs,
): Promise<DigitalFulfillmentResult> {
  const orderRef = `ls-${args.shopifyOrderId}-${args.shopifyLineItemId}`;
  log("start", {
    orderRef,
    customerEmail: args.customerEmail,
    petName: args.petName,
    source: args.printMasterPath ? `path:${args.printMasterPath}` : `url:${(args.printMasterUrl ?? "").slice(0, 120)}`,
  });

  const supabase = getSupabaseAdmin();

  // 1. Get the print master into a buffer.
  //    Preferred path (post-2026-05-12): private bucket via admin client.
  //    Fallback: legacy URL (in-flight carts created before the security fix).
  let buffer: Buffer;
  if (args.printMasterPath) {
    const { data, error } = await supabase.storage
      .from("pet-photos-private")
      .download(args.printMasterPath);
    if (error || !data) {
      return { ok: false, stage: "download", reason: error?.message ?? "private_download_returned_no_data" };
    }
    buffer = Buffer.from(await data.arrayBuffer());
  } else if (args.printMasterUrl) {
    const dl = await downloadToBuffer(args.printMasterUrl);
    if (dl.ok === false) {
      return { ok: false, stage: "download", reason: dl.error };
    }
    buffer = dl.buffer;
  } else {
    return { ok: false, stage: "download", reason: "no_print_master_path_or_url" };
  }
  log("downloaded", { orderRef, bytes: buffer.length, source: args.printMasterPath ? "private" : "legacy_url" });

  // 2. Upload to durable Supabase storage. Path: digital-deliveries/<orderRef>.png
  //    Bucket: pet-photos (same bucket used for canvas print masters; lifecycle
  //    rules handle long-term retention separately).
  const storagePath = `digital-deliveries/${orderRef}.png`;
  const { error: upErr } = await supabase.storage
    .from("pet-photos")
    .upload(storagePath, buffer, {
      contentType: "image/png",
      cacheControl: "31536000",
      upsert: true, // orderRef unique per (shopifyOrderId, lineItemId)
    });
  if (upErr) {
    logError("upload_failed", { orderRef, error: upErr.message });
    return { ok: false, stage: "upload", reason: upErr.message };
  }
  log("uploaded", { orderRef, path: storagePath });

  // 3. Generate a 30-day signed URL so the email link expires gracefully.
  //    Customer should download and save the file within 30 days — beyond that
  //    they can email support and we re-issue.
  const { data: signed, error: signErr } = await supabase.storage
    .from("pet-photos")
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
  if (signErr || !signed?.signedUrl) {
    logError("sign_failed", { orderRef, error: signErr?.message ?? "no signedUrl" });
    return { ok: false, stage: "sign", reason: signErr?.message ?? "no signedUrl returned" };
  }
  const downloadUrl = signed.signedUrl;
  log("signed", { orderRef, signedUrlPrefix: downloadUrl.slice(0, 80) });

  // 4. Render + send the email via Resend
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    logError("resend_key_missing", { orderRef });
    return { ok: false, stage: "email", reason: "RESEND_API_KEY env var not configured" };
  }

  const email = renderDigitalReadyEmail({
    petName: args.petName ?? "your pet",
    downloadUrl,
    previewUrl: args.previewUrl ?? undefined,
    orderRef: String(args.shopifyOrderId).slice(-6),
  });

  let emailMessageId: string | null = null;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: email.from,
        to: args.customerEmail,
        reply_to: email.replyTo,
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_EMAIL_MS),
    });
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      logError("email_non_2xx", { orderRef, status: r.status, snippet: body.slice(0, 200) });
      return { ok: false, stage: "email", reason: `Resend ${r.status}: ${body.slice(0, 200)}` };
    }
    const parsed = (await r.json().catch(() => null)) as { id?: string } | null;
    emailMessageId = parsed?.id ?? null;
    log("email_sent", { orderRef, messageId: emailMessageId });
  } catch (err) {
    logError("email_threw", { orderRef, error: (err as Error).message });
    return { ok: false, stage: "email", reason: (err as Error).message };
  }

  return {
    ok: true,
    downloadUrl,
    durableStoragePath: storagePath,
    emailMessageId,
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────

async function downloadToBuffer(
  url: string,
): Promise<{ ok: true; buffer: Buffer } | { ok: false; error: string }> {
  try {
    const r = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_DOWNLOAD_MS),
    });
    if (!r.ok) {
      return { ok: false, error: `download ${r.status}` };
    }
    const ab = await r.arrayBuffer();
    return { ok: true, buffer: Buffer.from(ab) };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
