/**
 * Meta Conversion API (CAPI) helper.
 *
 * Sends server-side events to Meta's Graph API so Facebook gets purchase
 * data even when browser Pixel is blocked (iOS, ad blockers, intelligent
 * tracking prevention).
 *
 * No-op when META_PIXEL_ID or META_CAPI_TOKEN env vars are unset — safe
 * to call unconditionally.
 *
 * Docs: https://developers.facebook.com/docs/marketing-api/conversions-api
 */
import crypto from "node:crypto";

interface CapiUserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: string;
  externalId?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbp?: string; // _fbp cookie
  fbc?: string; // _fbc cookie
}

interface CapiPurchaseInput {
  eventId: string; // for browser+server dedup; use Stripe session id
  eventTimeUnix?: number; // seconds; defaults to now
  eventSourceUrl?: string;
  value: number;
  currency: string; // ISO 4217, e.g. "GBP"
  contentIds?: string[];
  contentType?: "product" | "product_group";
  contentName?: string;
  numItems?: number;
  user: CapiUserData;
}

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input.trim().toLowerCase(), "utf8").digest("hex");
}

function hashUser(u: CapiUserData): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  if (u.email) out.em = [sha256(u.email)];
  if (u.phone) out.ph = [sha256(u.phone.replace(/\D/g, ""))];
  if (u.firstName) out.fn = [sha256(u.firstName)];
  if (u.lastName) out.ln = [sha256(u.lastName)];
  if (u.city) out.ct = [sha256(u.city)];
  if (u.country) out.country = [sha256(u.country)];
  if (u.externalId) out.external_id = [sha256(u.externalId)];
  if (u.clientIpAddress) out.client_ip_address = u.clientIpAddress;
  if (u.clientUserAgent) out.client_user_agent = u.clientUserAgent;
  if (u.fbp) out.fbp = u.fbp;
  if (u.fbc) out.fbc = u.fbc;
  return out;
}

export async function capiPurchase(input: CapiPurchaseInput): Promise<{ ok: boolean; status?: number; error?: string }> {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_TOKEN;
  if (!pixelId || !accessToken) {
    return { ok: false, error: "META_PIXEL_ID or META_CAPI_TOKEN not set (no-op)" };
  }

  const event = {
    event_name: "Purchase",
    event_time: input.eventTimeUnix ?? Math.floor(Date.now() / 1000),
    event_id: input.eventId,
    event_source_url: input.eventSourceUrl,
    action_source: "website",
    user_data: hashUser(input.user),
    custom_data: {
      currency: input.currency.toUpperCase(),
      value: input.value,
      content_ids: input.contentIds,
      content_type: input.contentType,
      content_name: input.contentName,
      num_items: input.numItems,
    },
  };

  const body: Record<string, unknown> = { data: [event] };
  if (process.env.META_CAPI_TEST_EVENT_CODE) {
    body.test_event_code = process.env.META_CAPI_TEST_EVENT_CODE;
  }

  try {
    const r = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return { ok: false, status: r.status, error: text };
    }
    return { ok: true, status: r.status };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
