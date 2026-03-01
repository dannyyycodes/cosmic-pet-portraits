import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const getVipEmailTemplate = (petName: string, reportUrl: string, accountUrl: string, customerReferralCode: string, portraitUrl?: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #030014; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  
  <!-- Outer container with premium gold gradient border -->
  <div style="max-width: 600px; margin: 0 auto; padding: 3px; background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 25%, #f59e0b 50%, #d97706 75%, #f59e0b 100%); border-radius: 20px;">
    
    <!-- Inner container -->
    <div style="background: linear-gradient(180deg, #0a0a1a 0%, #111827 100%); border-radius: 17px; padding: 48px 32px;">
      
      <!-- VIP Badge -->
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; padding: 10px 28px; background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%); border-radius: 50px; box-shadow: 0 8px 32px rgba(245, 158, 11, 0.4);">
          <span style="color: #1a1a2e; font-size: 12px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">⭐ VIP MEMBER ⭐</span>
        </div>
      </div>

      <!-- Main Title -->
      <h1 style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 0 0 16px 0; text-align: center; line-height: 1.2;">
        Welcome to the <span style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">VIP Experience</span>
      </h1>
      
      <p style="color: #9ca3af; font-size: 16px; line-height: 1.7; margin: 0 0 36px 0; text-align: center;">
        You're now part of an exclusive group of pet parents who go above and beyond for their companions.
      </p>

      <!-- VIP Benefits Card -->
      <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%); border-radius: 16px; padding: 28px; margin: 0 0 32px 0; border: 1px solid rgba(245, 158, 11, 0.3);">
        <p style="color: #fbbf24; font-size: 14px; font-weight: 700; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 1px; text-align: center;">
          Your VIP Benefits
        </p>
        <div style="display: block;">
          <div style="display: flex; align-items: center; margin-bottom: 14px;">
            <span style="width: 36px; height: 36px; background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); border-radius: 10px; display: inline-block; text-align: center; line-height: 36px; font-size: 16px; margin-right: 14px;">✨</span>
            <div>
              <span style="color: #ffffff; font-size: 14px; font-weight: 600;">Full Cosmic Report</span>
              <span style="color: #9ca3af; font-size: 13px; display: block;">${petName}'s complete personality profile</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 14px;">
            <span style="width: 36px; height: 36px; background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%); border-radius: 10px; display: inline-block; text-align: center; line-height: 36px; font-size: 16px; margin-right: 14px;">🎨</span>
            <div>
              <span style="color: #ffffff; font-size: 14px; font-weight: 600;">AI-Generated Portrait</span>
              <span style="color: #9ca3af; font-size: 13px; display: block;">Unique cosmic artwork of ${petName}</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 14px;">
            <span style="width: 36px; height: 36px; background: linear-gradient(135deg, #d946ef 0%, #f472b6 100%); border-radius: 10px; display: inline-block; text-align: center; line-height: 36px; font-size: 16px; margin-right: 14px;">📧</span>
            <div>
              <span style="color: #ffffff; font-size: 14px; font-weight: 600;">Weekly Horoscopes</span>
              <span style="color: #9ca3af; font-size: 13px; display: block;">Personalized guidance every Monday</span>
            </div>
          </div>
          <div style="display: flex; align-items: center;">
            <span style="width: 36px; height: 36px; background: linear-gradient(135deg, #10b981 0%, #34d399 100%); border-radius: 10px; display: inline-block; text-align: center; line-height: 36px; font-size: 16px; margin-right: 14px;">🎁</span>
            <div>
              <span style="color: #ffffff; font-size: 14px; font-weight: 600;">Referral Rewards</span>
              <span style="color: #9ca3af; font-size: 13px; display: block;">Share the magic, earn rewards</span>
            </div>
          </div>
        </div>
      </div>

      ${portraitUrl ? `
      <!-- Portrait Preview -->
      <div style="text-align: center; margin: 32px 0;">
        <p style="color: #9ca3af; font-size: 13px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px;">Your AI Portrait is Ready</p>
        <div style="display: inline-block; padding: 4px; background: linear-gradient(135deg, #f59e0b 0%, #8b5cf6 50%, #d946ef 100%); border-radius: 20px;">
          <img src="${portraitUrl}" alt="${petName}'s Cosmic Portrait" style="max-width: 260px; border-radius: 16px; display: block;">
        </div>
      </div>
      ` : ''}

      <!-- CTA Button -->
      <div style="text-align: center; margin: 36px 0;">
        <a href="${reportUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); color: #1a1a2e; text-decoration: none; padding: 18px 48px; border-radius: 12px; font-weight: 800; font-size: 16px; box-shadow: 0 8px 32px rgba(245, 158, 11, 0.4), 0 0 0 1px rgba(255,255,255,0.2) inset;">
          View ${petName}'s Full Report →
        </a>
      </div>

      <!-- Referral Section -->
      <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(217, 70, 239, 0.15) 100%); border-radius: 16px; padding: 24px; margin: 32px 0; text-align: center; border: 1px solid rgba(139, 92, 246, 0.2);">
        <p style="color: #a78bfa; font-size: 13px; font-weight: 600; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">🎁 Your VIP Referral Code</p>
        <p style="color: #9ca3af; font-size: 13px; margin: 0 0 16px 0;">
          Share with friends — you'll both get rewards!
        </p>
        <div style="display: inline-block; background: rgba(0,0,0,0.4); border-radius: 10px; padding: 14px 28px; border: 1px solid rgba(245, 158, 11, 0.3);">
          <span style="color: #fbbf24; font-size: 20px; font-weight: 800; letter-spacing: 2px; font-family: monospace;">${customerReferralCode}</span>
        </div>
        <p style="color: #6b7280; font-size: 11px; margin: 14px 0 0 0;">
          littlesouls.co/ref/${customerReferralCode}
        </p>
      </div>

      <!-- Divider -->
      <div style="height: 1px; background: linear-gradient(90deg, transparent 0%, rgba(245, 158, 11, 0.3) 50%, transparent 100%); margin: 32px 0;"></div>

      <!-- Footer -->
      <p style="color: #6b7280; font-size: 13px; margin: 0; text-align: center; line-height: 1.6;">
        Manage your benefits in your <a href="${accountUrl}" style="color: #a78bfa; text-decoration: none;">account dashboard</a>.
      </p>

      <!-- Brand Footer -->
      <div style="text-align: center; margin-top: 32px;">
        <p style="color: #4b5563; font-size: 11px; margin: 0; letter-spacing: 1px; text-transform: uppercase;">
          Little Souls VIP
        </p>
      </div>

    </div>
  </div>
  
  <div style="height: 20px;"></div>
  
</body>
</html>
`;

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

    const origin = "https://littlesouls.co";
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
      from: "Little Souls <hello@littlesouls.co>",
      to: [email],
      subject: `🌟 Welcome to the VIP Experience, ${petName}'s Human!`,
      html: getVipEmailTemplate(petName, reportUrl, accountUrl, customerReferralCode, portraitUrl),
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
