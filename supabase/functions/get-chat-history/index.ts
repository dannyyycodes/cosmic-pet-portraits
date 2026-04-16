// Ownership-verified chat history loader.
//
// Returns the most recent chat_messages for an order, ONLY to a caller who
// proves ownership via (a) a matching email on pet_reports, or (b) a valid
// share_token. Direct REST reads against chat_messages are now locked down
// by RLS so the frontend must go through this function.
//
// Request body:  { orderId, email?, shareToken?, limit? }
// Response 200:  { messages: [{ role, content, created_at }, ...] }
//          403:  { error: "Unauthorized" }
//          404:  { error: "Invalid order" }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app"];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHARE_TOKEN_PATTERN = /^[a-f0-9]{16,64}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  const corsJson = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  try {
    const { orderId, email, shareToken, limit } = await req.json();

    if (!orderId || !UUID_PATTERN.test(String(orderId))) {
      return new Response(JSON.stringify({ error: "Missing or invalid orderId" }), {
        status: 400, headers: corsJson,
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: owner, error: lookupErr } = await supabase
      .from("pet_reports")
      .select("email, share_token")
      .eq("id", orderId)
      .maybeSingle();

    if (lookupErr || !owner) {
      return new Response(JSON.stringify({ error: "Invalid order" }), {
        status: 404, headers: corsJson,
      });
    }

    const tokenMatches = typeof shareToken === "string"
      && SHARE_TOKEN_PATTERN.test(shareToken)
      && owner.share_token === shareToken;

    const emailMatches = typeof email === "string"
      && EMAIL_PATTERN.test(email)
      && typeof owner.email === "string"
      && email.trim().toLowerCase() === owner.email.trim().toLowerCase();

    if (!tokenMatches && !emailMatches) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403, headers: corsJson,
      });
    }

    const capped = Math.max(1, Math.min(100, typeof limit === "number" ? limit : 40));

    const { data: rows, error: msgErr } = await supabase
      .from("chat_messages")
      .select("role, content, created_at")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(capped);

    if (msgErr) {
      console.error("[GET-CHAT-HISTORY] Fetch error:", msgErr);
      return new Response(JSON.stringify({ error: "Could not load history" }), {
        status: 500, headers: corsJson,
      });
    }

    // Return in chronological order (oldest first) for rendering
    const messages = (rows || []).slice().reverse();

    return new Response(JSON.stringify({ messages }), { headers: corsJson });

  } catch (e) {
    console.error("[GET-CHAT-HISTORY] Error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: corsJson,
    });
  }
});
