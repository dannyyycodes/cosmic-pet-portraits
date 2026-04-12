import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://esm.sh/zod@3.23.8";

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app"];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };
}

async function validateAdminToken(
  supabaseClient: ReturnType<typeof createClient>,
  token: string | null,
): Promise<{ valid: boolean; adminId?: string }> {
  if (!token) return { valid: false };
  try {
    const { data: session, error } = await supabaseClient
      .from("admin_sessions")
      .select("admin_id, expires_at")
      .eq("token", token)
      .single();
    if (error || !session) return { valid: false };
    if (new Date(session.expires_at as string) < new Date()) {
      await supabaseClient.from("admin_sessions").delete().eq("token", token);
      return { valid: false };
    }
    return { valid: true, adminId: session.admin_id as string };
  } catch (err) {
    console.error("[ADMIN-DONATIONS] Token validation error:", err);
    return { valid: false };
  }
}

const markPaidSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(500),
  paid_reference: z.string().min(1).max(200),
  notes: z.string().max(1000).optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Service not configured" }), {
      status: 503,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

  const adminToken = req.headers.get("X-Admin-Token");
  const authResult = await validateAdminToken(supabaseClient, adminToken);
  if (!authResult.valid) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "list";

    // ──────── LIST ────────
    if (req.method === "GET" && action === "list") {
      const status = url.searchParams.get("status"); // pending | paid | null=all
      const charity = url.searchParams.get("charity");
      const monthParam = url.searchParams.get("month"); // YYYY-MM
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "500", 10) || 500, 2000);

      let query = supabaseClient
        .from("charity_donations")
        .select(
          "id, stripe_session_id, charity_id, charity_name, order_amount_cents, donation_base_cents, donation_bonus_cents, donation_total_cents, currency, customer_email, status, paid_at, paid_reference, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(limit);

      if (status === "pending" || status === "paid") query = query.eq("status", status);
      if (charity) query = query.eq("charity_id", charity);
      if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
        const [y, m] = monthParam.split("-").map(Number);
        const start = new Date(Date.UTC(y, m - 1, 1)).toISOString();
        const end = new Date(Date.UTC(y, m, 1)).toISOString();
        query = query.gte("created_at", start).lt("created_at", end);
      }

      const { data, error } = await query;
      if (error) throw error;

      return new Response(JSON.stringify({ donations: data ?? [] }), {
        status: 200,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // ──────── SUMMARY ────────
    // Returns per-charity totals (pending + paid) for the requested month (or all-time if omitted).
    if (req.method === "GET" && action === "summary") {
      const monthParam = url.searchParams.get("month");

      let query = supabaseClient
        .from("charity_donations")
        .select("charity_id, charity_name, status, donation_total_cents, currency");

      if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
        const [y, m] = monthParam.split("-").map(Number);
        const start = new Date(Date.UTC(y, m - 1, 1)).toISOString();
        const end = new Date(Date.UTC(y, m, 1)).toISOString();
        query = query.gte("created_at", start).lt("created_at", end);
      }

      const { data, error } = await query;
      if (error) throw error;

      type Row = { charity_id: string; charity_name: string; status: string; donation_total_cents: number; currency: string };
      const rows = (data ?? []) as Row[];

      const summary: Record<string, { charity_id: string; charity_name: string; pending_cents: number; paid_cents: number; count_pending: number; count_paid: number; currency: string }> = {};
      for (const r of rows) {
        const s = summary[r.charity_id] ?? {
          charity_id: r.charity_id,
          charity_name: r.charity_name,
          pending_cents: 0,
          paid_cents: 0,
          count_pending: 0,
          count_paid: 0,
          currency: r.currency,
        };
        if (r.status === "paid") { s.paid_cents += r.donation_total_cents; s.count_paid += 1; }
        else if (r.status === "pending") { s.pending_cents += r.donation_total_cents; s.count_pending += 1; }
        summary[r.charity_id] = s;
      }

      return new Response(JSON.stringify({ summary: Object.values(summary) }), {
        status: 200,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // ──────── MARK PAID ────────
    if (req.method === "POST" && action === "mark-paid") {
      const body = await req.json();
      const input = markPaidSchema.parse(body);

      const { data, error } = await supabaseClient
        .from("charity_donations")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          paid_reference: input.paid_reference,
          paid_by: authResult.adminId,
          notes: input.notes ?? null,
        })
        .in("id", input.ids)
        .eq("status", "pending")
        .select("id");

      if (error) throw error;

      return new Response(JSON.stringify({ updated: data?.length ?? 0 }), {
        status: 200,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    console.error("[ADMIN-DONATIONS] Error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
