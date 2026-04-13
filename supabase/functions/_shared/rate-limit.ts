// Shared rate-limit helper for edge functions.
// Uses the public.rate_limits table (service role only) as the source of truth.
//
// Typical usage inside a function:
//   const ip = getClientIp(req);
//   const rl = await checkRateLimit(supabase, "elevenlabs-tts", ip, 10, 60);
//   if (!rl.ok) return new Response(JSON.stringify({ error: "Too many requests" }),
//                                   { status: 429, headers: corsJson });

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip")
      || req.headers.get("x-real-ip")
      || "unknown";
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Check-and-increment: returns ok=false if the caller has already made
 * `limit` requests within the last `windowSeconds` for this (endpoint,
 * identifier) pair. A successful check records the attempt.
 *
 * The table is service-role-only; callers must pass a supabase client
 * created with SUPABASE_SERVICE_ROLE_KEY.
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  endpoint: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString();

  const { count, error } = await supabase
    .from("rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("endpoint", endpoint)
    .eq("identifier", identifier)
    .gte("created_at", windowStart);

  if (error) {
    // Fail open on infrastructure error — but log so it's visible.
    console.error(`[rate-limit] lookup failed for ${endpoint}:`, error.message);
    return { ok: true, remaining: limit, retryAfterSeconds: 0 };
  }

  const used = count ?? 0;
  if (used >= limit) {
    return { ok: false, remaining: 0, retryAfterSeconds: windowSeconds };
  }

  const { error: insertError } = await supabase
    .from("rate_limits")
    .insert({ endpoint, identifier });
  if (insertError) {
    console.error(`[rate-limit] insert failed for ${endpoint}:`, insertError.message);
  }

  return { ok: true, remaining: limit - used - 1, retryAfterSeconds: 0 };
}
