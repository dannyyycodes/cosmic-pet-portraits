import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app"];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

const logStep = (step: string, details?: unknown) => {
  console.log(`[AFFILIATE-DASHBOARD] ${step}`, details ? JSON.stringify(details) : '');
};

// Input validation schemas
const loginSchema = z.object({
  action: z.literal('login'),
  email: z.string().email().max(255),
});

const verifySchema = z.object({
  action: z.literal('verify'),
  email: z.string().email().max(255),
  token: z.string().min(6).max(6),
});

const dashboardSchema = z.object({
  action: z.literal('dashboard'),
  sessionToken: z.string().uuid(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    logStep("Function started");

    const rawInput = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Determine action (default to legacy email-only for backward compatibility during migration)
    const action = rawInput.action || (rawInput.sessionToken ? 'dashboard' : 'login');

    // ─── ACTION: LOGIN — Send verification code ───
    if (action === 'login') {
      const input = loginSchema.parse({ ...rawInput, action: 'login' });
      logStep("Login requested", { email: input.email });

      // Check affiliate exists
      const { data: affiliate, error: affError } = await supabaseClient
        .from('affiliates')
        .select('id, name, email')
        .eq('email', input.email)
        .single();

      if (affError || !affiliate) {
        logStep("Affiliate not found", { email: input.email });
        // Return generic message to prevent email enumeration
        return new Response(JSON.stringify({
          success: true,
          message: 'If an affiliate account exists with this email, a verification code has been sent.'
        }), {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Generate 6-digit code
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store code (upsert to handle rapid re-requests)
      await supabaseClient
        .from('affiliate_sessions')
        .delete()
        .eq('affiliate_id', affiliate.id);

      await supabaseClient
        .from('affiliate_sessions')
        .insert({
          affiliate_id: affiliate.id,
          verification_code: code,
          expires_at: expiresAt.toISOString(),
          verified: false,
        });

      // Send email with code
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey) {
        try {
          const resend = new Resend(resendApiKey);
          await resend.emails.send({
            from: "Little Souls <hello@littlesouls.app>",
            to: [input.email],
            subject: `Your Little Souls verification code: ${code}`,
            html: `
              <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px 20px;">
                <h2 style="color: #3d2f2a; margin-bottom: 24px;">Affiliate Dashboard Login</h2>
                <p style="color: #5a4a42; font-size: 16px; line-height: 1.6;">
                  Hi ${affiliate.name}, here's your verification code:
                </p>
                <div style="background: #faf6ef; border: 2px solid #c4a265; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                  <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #3d2f2a; font-family: monospace;">
                    ${code}
                  </span>
                </div>
                <p style="color: #9a8578; font-size: 14px;">
                  This code expires in 10 minutes. If you didn't request this, you can ignore this email.
                </p>
              </div>
            `,
          });
          logStep("Verification email sent", { email: input.email });
        } catch (emailError) {
          logStep("Failed to send verification email", emailError);
          return new Response(JSON.stringify({ error: "Failed to send verification email" }), {
            headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
            status: 500,
          });
        }
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'If an affiliate account exists with this email, a verification code has been sent.'
      }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ─── ACTION: VERIFY — Check code and return session token ───
    if (action === 'verify') {
      const input = verifySchema.parse({ ...rawInput, action: 'verify' });
      logStep("Verification attempt", { email: input.email });

      // Find affiliate
      const { data: affiliate } = await supabaseClient
        .from('affiliates')
        .select('id')
        .eq('email', input.email)
        .single();

      if (!affiliate) {
        return new Response(JSON.stringify({ error: "Invalid code" }), {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          status: 401,
        });
      }

      // Check code
      const { data: session } = await supabaseClient
        .from('affiliate_sessions')
        .select('*')
        .eq('affiliate_id', affiliate.id)
        .eq('verification_code', input.token)
        .eq('verified', false)
        .single();

      if (!session) {
        logStep("Invalid verification code");
        return new Response(JSON.stringify({ error: "Invalid or expired code" }), {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          status: 401,
        });
      }

      // Check expiry
      if (new Date(session.expires_at) < new Date()) {
        logStep("Verification code expired");
        await supabaseClient.from('affiliate_sessions').delete().eq('id', session.id);
        return new Response(JSON.stringify({ error: "Code expired. Please request a new one." }), {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          status: 401,
        });
      }

      // Mark verified and create session token
      const sessionToken = crypto.randomUUID();
      const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await supabaseClient
        .from('affiliate_sessions')
        .update({
          verified: true,
          session_token: sessionToken,
          expires_at: sessionExpiry.toISOString(),
        })
        .eq('id', session.id);

      logStep("Verification successful, session created");

      return new Response(JSON.stringify({
        success: true,
        sessionToken,
      }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ─── ACTION: DASHBOARD — Fetch data with valid session ───
    if (action === 'dashboard') {
      const input = dashboardSchema.parse({ ...rawInput, action: 'dashboard' });
      logStep("Dashboard requested");

      // Validate session token
      const { data: session } = await supabaseClient
        .from('affiliate_sessions')
        .select('affiliate_id, expires_at, verified')
        .eq('session_token', input.sessionToken)
        .eq('verified', true)
        .single();

      if (!session) {
        logStep("Invalid session token");
        return new Response(JSON.stringify({ error: "Session expired. Please log in again." }), {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          status: 401,
        });
      }

      if (new Date(session.expires_at) < new Date()) {
        logStep("Session expired");
        await supabaseClient.from('affiliate_sessions').delete().eq('session_token', input.sessionToken);
        return new Response(JSON.stringify({ error: "Session expired. Please log in again." }), {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          status: 401,
        });
      }

      // Fetch affiliate data
      const { data: affiliate, error: affError } = await supabaseClient
        .from('affiliates')
        .select('*')
        .eq('id', session.affiliate_id)
        .single();

      if (affError || !affiliate) {
        return new Response(JSON.stringify({ error: "Affiliate not found" }), {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          status: 404,
        });
      }

      // Get recent referrals
      const { data: referrals } = await supabaseClient
        .from('affiliate_referrals')
        .select('*')
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false })
        .limit(50);

      const pendingReferrals = referrals?.filter(r => r.status === 'pending') || [];
      const paidReferrals = referrals?.filter(r => r.status === 'paid') || [];

      const stats = {
        totalReferrals: affiliate.total_referrals,
        totalEarnings: affiliate.total_earnings_cents / 100,
        pendingBalance: affiliate.pending_balance_cents / 100,
        commissionRate: affiliate.commission_rate * 100,
        status: affiliate.status,
        referralCode: affiliate.referral_code,
        pendingCount: pendingReferrals.length,
        paidCount: paidReferrals.length,
      };

      const formattedReferrals = (referrals || []).map(r => ({
        id: r.id,
        date: r.created_at,
        amount: r.amount_cents / 100,
        commission: r.commission_cents / 100,
        status: r.status,
        paidAt: r.paid_at,
      }));

      logStep("Dashboard data prepared");

      return new Response(JSON.stringify({
        success: true,
        affiliate: {
          name: affiliate.name,
          email: affiliate.email,
          createdAt: affiliate.created_at,
          stripeOnboarded: !!affiliate.stripe_account_id,
        },
        stats,
        referrals: formattedReferrals,
      }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ─── LEGACY: Email-only access (backward compat, returns generic error) ───
    return new Response(JSON.stringify({ error: "Invalid action" }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 400,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      logStep("Validation error", error.errors);
      return new Response(JSON.stringify({
        error: "Invalid input",
        details: error.errors.map(e => e.message).join(", ")
      }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 400,
      });
    }

    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: "Service unavailable" }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});
