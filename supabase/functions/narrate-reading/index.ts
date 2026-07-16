import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { checkRateLimit, getClientIp } from "../_shared/rate-limit.ts";

// Free warm-voice narration for the readings (Kokoro af_heart on the Hetzner box),
// with precise per-word timestamps for karaoke-style highlight sync.
// This function is a thin, key-holding proxy: browser -> here -> box /narrate.
// The box content-hash caches every segment, so repeats are instant + free.

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app"];

const NARRATE_URL = "https://content.littlesouls.app/narrate";
const MAX_SEGMENTS = 60;
const MAX_TOTAL_CHARS = 24000;   // whole free reading is well under this
const RATE_LIMIT_COUNT = 40;
const RATE_LIMIT_WINDOW_SECONDS = 60;

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

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const ip = getClientIp(req);
    const rl = await checkRateLimit(supabase, "narrate-reading", ip, RATE_LIMIT_COUNT, RATE_LIMIT_WINDOW_SECONDS);
    if (!rl.ok) {
      return new Response(
        JSON.stringify({ error: "Too many requests, please slow down." }),
        { status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json", "Retry-After": String(rl.retryAfterSeconds) } },
      );
    }

    const NARRATE_KEY = Deno.env.get("VOICE_NARRATE_KEY");
    if (!NARRATE_KEY) throw new Error("VOICE_NARRATE_KEY is not configured");

    const body = await req.json().catch(() => ({}));
    const rawSegments = Array.isArray(body?.segments) ? body.segments : [];
    const voice = typeof body?.voice === "string" ? body.voice : "af_heart";

    // sanitize + validate
    const segments = rawSegments
      .filter((s: unknown) => s && typeof (s as { text?: unknown }).text === "string")
      .slice(0, MAX_SEGMENTS)
      .map((s: { id?: unknown; text: string }, i: number) => ({
        id: typeof s.id === "string" || typeof s.id === "number" ? String(s.id) : `seg${i}`,
        text: String(s.text).slice(0, 4000),
      }));

    if (segments.length === 0) {
      return new Response(
        JSON.stringify({ error: "No segments provided" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    const totalChars = segments.reduce((n: number, s: { text: string }) => n + s.text.length, 0);
    if (totalChars > MAX_TOTAL_CHARS) {
      return new Response(
        JSON.stringify({ error: "Reading too long to narrate" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    const boxRes = await fetch(NARRATE_URL, {
      method: "POST",
      headers: { "Authorization": `Bearer ${NARRATE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ segments, voice }),
    });

    if (!boxRes.ok) {
      const t = await boxRes.text();
      console.error("narrate box error:", boxRes.status, t.slice(0, 300));
      return new Response(
        JSON.stringify({ error: "Narration engine unavailable", results: [] }),
        { status: 502, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    const data = await boxRes.json();
    return new Response(
      JSON.stringify({ results: data.results ?? [] }),
      { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("narrate-reading error:", msg);
    return new Response(
      JSON.stringify({ error: msg, results: [] }),
      { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } },
    );
  }
});
