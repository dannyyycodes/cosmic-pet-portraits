import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // SECURITY: Require service role authorization
  const authHeader = req.headers.get("Authorization");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!authHeader || !serviceRoleKey || !authHeader.includes(serviceRoleKey)) {
    console.error("[VIP-EMAIL] Unauthorized request");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { reportId, email, petName, sunSign, portraitUrl, referralCode } = await req.json();
    
    console.log("[VIP-EMAIL] Sending VIP welcome for:", petName);

    if (!email || !reportId || !petName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const origin = "https://astropets.cloud";
    const reportUrl = `${origin}/report?id=${reportId}`;
    const accountUrl = `${origin}/account`;
    
    // Generate a unique referral code for the customer if they don't have one
    let customerReferralCode = referralCode;
    if (!customerReferralCode) {
      customerReferralCode = `VIP-${petName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      // Save to email_subscribers for tracking
      await supabaseClient
        .from("email_subscribers")
        .upsert({
          email,
          referral_code: customerReferralCode,
          tier_purchased: 'vip',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' });
    }

    const emailResponse = await resend.emails.send({
      from: "AstroPets VIP <vip@astropets.cloud>",
      to: [email],
      subject: `🌟 Welcome to the VIP Experience, ${petName}'s Human!`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f0a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 48px 24px;">
    
    <!-- VIP Badge -->
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="display: inline-block; background: linear-gradient(135deg, #ffd700 0%, #ffb300 100%); color: #1a1a2e; padding: 8px 24px; border-radius: 20px; font-weight: 700; font-size: 12px; letter-spacing: 0.1em;">
        ⭐ VIP MEMBER ⭐
      </span>
    </div>

    <h1 style="color: #ffffff; font-size: 28px; font-weight: 600; margin: 0 0 16px 0; text-align: center; line-height: 1.3;">
      Welcome to the Cosmic VIP Experience! 🌟
    </h1>
    
    <p style="color: #a0a0b0; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0; text-align: center;">
      You're now part of an exclusive group of pet parents who go above and beyond. Here's what you've unlocked:
    </p>

    <!-- VIP Benefits -->
    <div style="background: linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(139,92,246,0.1) 100%); border: 1px solid rgba(255,215,0,0.3); border-radius: 16px; padding: 28px; margin: 32px 0;">
      <h2 style="color: #ffd700; font-size: 18px; margin: 0 0 20px 0; text-align: center;">Your VIP Benefits</h2>
      <ul style="color: #e0e0e0; font-size: 14px; line-height: 2; margin: 0; padding-left: 20px;">
        <li>✨ <strong>Full Cosmic Report</strong> - ${petName}'s complete personality profile</li>
        <li>🎨 <strong>AI-Generated Portrait</strong> - A unique cosmic artwork of ${petName}</li>
        <li>📧 <strong>Weekly Horoscopes</strong> - Personalized cosmic guidance delivered weekly</li>
        <li>📥 <strong>PDF Download</strong> - Keep ${petName}'s reading forever</li>
        <li>🎁 <strong>Exclusive Referral Rewards</strong> - Share the magic, earn rewards</li>
      </ul>
    </div>

    ${portraitUrl ? `
    <!-- Portrait Preview -->
    <div style="text-align: center; margin: 32px 0;">
      <p style="color: #a0a0b0; font-size: 14px; margin-bottom: 16px;">Your AI Portrait is Ready!</p>
      <img src="${portraitUrl}" alt="${petName}'s Cosmic Portrait" style="max-width: 280px; border-radius: 16px; border: 3px solid rgba(255,215,0,0.5);">
    </div>
    ` : ''}

    <!-- View Report CTA -->
    <div style="text-align: center; margin: 40px 0;">
      <a href="${reportUrl}" style="display: inline-block; background: linear-gradient(135deg, #ffd700 0%, #ffb300 100%); color: #1a1a2e; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-weight: 700; font-size: 16px;">
        View ${petName}'s Full Report →
      </a>
    </div>

    <!-- Referral Section -->
    <div style="background: rgba(139,92,246,0.15); border-radius: 12px; padding: 24px; margin: 32px 0; text-align: center;">
      <h3 style="color: #c084fc; font-size: 16px; margin: 0 0 12px 0;">🎁 Your VIP Referral Code</h3>
      <p style="color: #a0a0b0; font-size: 13px; margin: 0 0 16px 0;">
        Share this code with friends. When they use it, you'll both get rewards!
      </p>
      <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 12px 20px; display: inline-block;">
        <span style="color: #ffd700; font-size: 18px; font-weight: 700; letter-spacing: 0.1em;">${customerReferralCode}</span>
      </div>
      <p style="color: #707080; font-size: 11px; margin: 12px 0 0 0;">
        Share link: ${origin}/ref/${customerReferralCode}
      </p>
    </div>

    <!-- Weekly Horoscopes Info -->
    <div style="background: rgba(255,255,255,0.04); border-radius: 12px; padding: 20px; margin: 24px 0;">
      <p style="color: #e0e0e0; font-size: 14px; margin: 0; line-height: 1.6;">
        <strong>📅 Weekly Horoscopes:</strong> Starting next week, you'll receive personalized cosmic guidance for ${petName} every Monday. Watch your inbox!
      </p>
    </div>

    <!-- Account Link -->
    <p style="color: #707080; font-size: 13px; margin: 32px 0; text-align: center; line-height: 1.6;">
      Manage your VIP benefits, view all reports, and track referrals in your <a href="${accountUrl}" style="color: #c084fc;">account dashboard</a>.
    </p>

    <div style="border-top: 1px solid rgba(255,255,255,0.08); margin-top: 40px; padding-top: 24px; text-align: center;">
      <p style="color: #505060; font-size: 12px; margin: 0;">
        AstroPets VIP • Questions? Reply to this email
      </p>
    </div>

  </div>
</body>
</html>
      `,
    });

    console.log("[VIP-EMAIL] VIP welcome email sent successfully");

    return new Response(JSON.stringify({ success: true, referralCode: customerReferralCode }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[VIP-EMAIL] Error:", error);
    return new Response(JSON.stringify({ error: "Service unavailable" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
