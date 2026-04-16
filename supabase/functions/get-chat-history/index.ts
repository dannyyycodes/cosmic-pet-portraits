// Ownership-verified chat history loader.
//
// Returns the most recent chat_messages for an order, ONLY to a caller who
// proves ownership via (a) a matching email on pet_reports, or (b) a valid
// share_token. Direct REST reads against chat_messages are now locked down
// by RLS so the frontend must go through this function.
//
// Request body:  { orderId, email?, shareToken?, limit?, before? }
//   before: ISO timestamp — if provided, returns messages strictly OLDER than this
//           (for "load earlier" pagination).
// Response 200:  { messages: [...], totalCount, firstMessageAt, hasMore }

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
    const { orderId, email, shareToken, limit, before } = await req.json();

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

    let q = supabase
      .from("chat_messages")
      .select("role, content, created_at")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(capped);

    if (typeof before === "string" && before) {
      q = q.lt("created_at", before);
    }

    const { data: rows, error: msgErr } = await q;

    if (msgErr) {
      console.error("[GET-CHAT-HISTORY] Fetch error:", msgErr);
      return new Response(JSON.stringify({ error: "Could not load history" }), {
        status: 500, headers: corsJson,
      });
    }

    // Return in chronological order (oldest first) for rendering
    const messages = (rows || []).slice().reverse();

    // Lightweight stats for the sidebar: total count + first-ever timestamp.
    // Only computed on the initial load (no `before` cursor) to avoid doing
    // an extra count query on every pagination request.
    let totalCount: number | null = null;
    let firstMessageAt: string | null = null;
    if (!before) {
      const { count } = await supabase
        .from("chat_messages")
        .select("*", { count: "exact", head: true })
        .eq("order_id", orderId);
      if (typeof count === "number") totalCount = count;

      const { data: firstRow } = await supabase
        .from("chat_messages")
        .select("created_at")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      firstMessageAt = firstRow?.created_at ?? null;
    }

    const hasMore = (rows?.length || 0) === capped;

    return new Response(JSON.stringify({
      messages,
      totalCount,
      firstMessageAt,
      hasMore,
    }), { headers: corsJson });

  } catch (e) {
    console.error("[GET-CHAT-HISTORY] Error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: corsJson,
    });
  }
});
