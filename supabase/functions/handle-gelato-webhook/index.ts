// handle-gelato-webhook
//
// Minimum viable stub for Gelato print/ship event ingestion. Receives a
// Gelato webhook event and INSERTs an appropriate pawtrait_touchpoint row
// (pawtrait_shipped or pawtrait_delivered) so process-email-nurture picks
// it up on the next cron tick and sends the customer the right email.
//
// TODO(post-A-merge): real HMAC signature verification + full Gelato event
// status mapping (pending → printing → printed → shipped → delivered →
// delivery_problem) lives in api/gelato/webhook.ts (Agent A). Once that
// merges, this stub becomes the canonical handler for the email side and
// Agent A's webhook either calls into this or invokes the same insert
// directly. Until then this stub is intentionally permissive — it accepts
// any caller that hits it with a service-role bearer.
//
// Expected event shape (best-effort match to Gelato v3 webhook):
//   {
//     "event": "order.shipped" | "order.delivered" | ...
//     "orderReferenceId": "<your order ref>",
//     "customer": { "email": "..." },
//     "items": [{ "metadata": { "pet_name": "...", "portrait_image_url": "..." } }],
//     "tracking": { "url": "...", "code": "..." }
//   }
//
// We map "order.shipped" → pawtrait_shipped, "order.delivered" →
// pawtrait_delivered, and ignore everything else for now. Either event
// schedules immediately (scheduled_for=now()).

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const ALLOWED_ORIGINS = [
  "https://littlesouls.app",
  "https://www.littlesouls.app",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin)
      ? origin
      : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-gelato-signature",
  };
}

interface GelatoEvent {
  event?: string;
  orderReferenceId?: string;
  orderId?: string;
  customer?: { email?: string };
  items?: Array<{ metadata?: Record<string, unknown> }>;
  tracking?: { url?: string; code?: string };
  fulfillments?: Array<{ trackingUrl?: string; trackingCode?: string }>;
}

function pickTouchpointType(eventName: string): "pawtrait_shipped" | "pawtrait_delivered" | null {
  const e = eventName.toLowerCase();
  if (e.includes("delivered")) return "pawtrait_delivered";
  if (e.includes("shipped") || e.includes("dispatch") || e.includes("in_transit")) {
    return "pawtrait_shipped";
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[handle-gelato-webhook] missing env");
    return new Response(JSON.stringify({ error: "Service misconfigured" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  // TODO(post-A-merge): real HMAC verification. Agent A's api/gelato/webhook.ts
  // verifies x-gelato-signature against GELATO_WEBHOOK_SECRET. This stub
  // checks for a service-role bearer or the bridge secret as a permissive
  // fallback so the email side stays unblocked while the real verifier
  // lands. DO NOT ship this stub to prod without rotating to the HMAC path.
  const authHeader = req.headers.get("Authorization") || "";
  const bridgeSecret = Deno.env.get("N8N_BRIDGE_SECRET") || "";
  const gelatoBridgeSecret = Deno.env.get("GELATO_BRIDGE_SECRET") || "";
  const isAuthed =
    (serviceRoleKey.length > 0 && authHeader.includes(serviceRoleKey)) ||
    (bridgeSecret.length > 0 && authHeader.includes(bridgeSecret)) ||
    (gelatoBridgeSecret.length > 0 && authHeader.includes(gelatoBridgeSecret));

  if (!isAuthed) {
    console.warn("[handle-gelato-webhook] unauthorized");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  let body: GelatoEvent;
  try {
    body = (await req.json()) as GelatoEvent;
  } catch (e) {
    console.error("[handle-gelato-webhook] invalid JSON:", (e as Error).message);
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  const eventName = body.event ?? "";
  const touchpointType = pickTouchpointType(eventName);
  if (!touchpointType) {
    // Not a shipping event we care about — ack so Gelato stops retrying.
    console.log(`[handle-gelato-webhook] ignoring event=${eventName}`);
    return new Response(JSON.stringify({ received: true, ignored: true }), {
      status: 200,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  const email = body.customer?.email?.trim().toLowerCase() ?? "";
  if (!email) {
    console.error("[handle-gelato-webhook] event missing customer email");
    return new Response(JSON.stringify({ error: "Missing customer email" }), {
      status: 400,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  const firstItemMeta = body.items?.[0]?.metadata ?? {};
  const petName =
    (firstItemMeta.pet_name as string | undefined) ?? null;
  const portraitImageUrl =
    (firstItemMeta.portrait_image_url as string | undefined) ?? null;

  const trackingUrl =
    body.tracking?.url ?? body.fulfillments?.[0]?.trackingUrl ?? null;
  const trackingCode =
    body.tracking?.code ?? body.fulfillments?.[0]?.trackingCode ?? null;

  const orderId =
    body.orderReferenceId ?? body.orderId ?? null;

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: inserted, error: insertErr } = await supabase
    .from("pawtrait_touchpoints")
    .insert({
      email,
      pet_name: petName,
      touchpoint_type: touchpointType,
      status: "pending",
      scheduled_for: new Date().toISOString(),
      metadata: {
        source: "gelato_webhook_stub",
        gelato_event: eventName,
        order_id: orderId,
        portrait_image_url: portraitImageUrl,
        tracking_url: trackingUrl,
        tracking_code: trackingCode,
      },
    })
    .select("id")
    .single();

  if (insertErr) {
    console.error("[handle-gelato-webhook] insert failed:", insertErr.message);
    return new Response(
      JSON.stringify({ error: "Insert failed", detail: insertErr.message }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      },
    );
  }

  console.log(
    `[handle-gelato-webhook] queued ${touchpointType} id=${(inserted as { id?: string } | null)?.id} email=${email} order=${orderId}`,
  );

  return new Response(
    JSON.stringify({
      received: true,
      touchpoint_id: (inserted as { id?: string } | null)?.id,
      touchpoint_type: touchpointType,
    }),
    {
      status: 200,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    },
  );
});
