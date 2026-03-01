import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prospectId, email, pitch, subject } = await req.json();
    
    if (!email || !pitch) {
      return new Response(
        JSON.stringify({ success: false, error: "Email and pitch are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Sending outreach email to:", email);

    const htmlPitch = pitch.split("\n\n").map((p: string) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Little Souls <hello@littlesouls.co>",
        to: [email],
        subject: subject || "Partner with Little Souls - Earn 50% Commission 🐾✨",
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">${htmlPitch}</div>`,
      }),
    });

    const emailData = await emailResponse.json();
    if (!emailResponse.ok) throw new Error(emailData.message || "Failed to send email");

    if (prospectId) {
      const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
      await supabase.from("influencer_prospects").update({ status: "contacted", pitch_content: pitch, pitch_sent_at: new Date().toISOString() }).eq("id", prospectId);
    }

    return new Response(JSON.stringify({ success: true, messageId: emailData.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ success: false, error: error?.message || "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
