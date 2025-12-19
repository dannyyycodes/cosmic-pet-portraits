import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    console.log("[WEEKLY-HOROSCOPE] Starting weekly horoscope generation...");

    // Get all active subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("horoscope_subscriptions")
      .select("*, pet_reports(*)")
      .eq("status", "active");

    if (subError) throw subError;

    console.log(`[WEEKLY-HOROSCOPE] Found ${subscriptions?.length || 0} active subscriptions`);

    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    const weekStartStr = weekStart.toISOString().split("T")[0];

    const results = [];

    for (const sub of subscriptions || []) {
      try {
        console.log(`[WEEKLY-HOROSCOPE] Processing ${sub.pet_name}...`);

        // Check if horoscope already generated for this week
        const { data: existing } = await supabase
          .from("weekly_horoscopes")
          .select("id")
          .eq("subscription_id", sub.id)
          .eq("week_start", weekStartStr)
          .single();

        if (existing) {
          console.log(`[WEEKLY-HOROSCOPE] Already generated for ${sub.pet_name} this week`);
          continue;
        }

        const petReport = sub.pet_reports;
        if (!petReport?.report_content) {
          console.log(`[WEEKLY-HOROSCOPE] No report content for ${sub.pet_name}`);
          continue;
        }

        const reportContent = petReport.report_content;
        const sunSign = reportContent.chartPlacements?.sun?.sign || "Aries";
        const moonSign = reportContent.chartPlacements?.moon?.sign || "Cancer";
        const element = reportContent.dominantElement || "Fire";

        // Generate horoscope using Lovable AI
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: `You are a mystical pet astrologer creating personalized weekly horoscopes. Write in a warm, engaging, magical tone. The horoscope should feel personal to this specific pet.`
              },
              {
                role: "user",
                content: `Create a weekly horoscope for a pet named "${sub.pet_name}" (${petReport.species || "pet"}).

Astrological Profile:
- Sun Sign: ${sunSign}
- Moon Sign: ${moonSign}  
- Dominant Element: ${element}
- Archetype: ${reportContent.archetype?.name || "Cosmic Soul"}

Generate a JSON response with:
{
  "theme": "One word theme for the week",
  "overview": "2-3 sentence overview of the week's energies (max 100 words)",
  "luckyDay": "Day of the week",
  "luckyActivity": "Best activity for this pet this week",
  "cosmicAdvice": "Specific personalized advice for the pet owner (max 50 words)",
  "energyForecast": {
    "monday": "Brief energy note",
    "tuesday": "Brief energy note",
    "wednesday": "Brief energy note",
    "thursday": "Brief energy note",
    "friday": "Brief energy note",
    "saturday": "Brief energy note",
    "sunday": "Brief energy note"
  },
  "affirmation": "A pet-themed affirmation for the week"
}

Make it feel magical, personal, and actionable!`
              }
            ],
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error(`[WEEKLY-HOROSCOPE] AI error for ${sub.pet_name}:`, errorText);
          continue;
        }

        const aiData = await aiResponse.json();
        let horoscopeContent;
        
        try {
          const content = aiData.choices[0].message.content;
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          horoscopeContent = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
        } catch (parseError) {
          console.error(`[WEEKLY-HOROSCOPE] Parse error for ${sub.pet_name}:`, parseError);
          continue;
        }

        // Save horoscope to database
        const { error: insertError } = await supabase
          .from("weekly_horoscopes")
          .insert({
            subscription_id: sub.id,
            week_start: weekStartStr,
            content: horoscopeContent,
          });

        if (insertError) throw insertError;

        // Send email
        const emailHtml = generateHoroscopeEmail(sub.pet_name, horoscopeContent, sunSign, element);
        
        const { error: emailError } = await resend.emails.send({
          from: "AstroPets <hello@astropets.cloud>",
          to: [sub.email],
          subject: `✨ ${sub.pet_name}'s Weekly Cosmic Forecast`,
          html: emailHtml,
        });

        if (emailError) {
          console.error(`[WEEKLY-HOROSCOPE] Email error for ${sub.pet_name}:`, emailError);
        } else {
          // Mark as sent
          await supabase
            .from("weekly_horoscopes")
            .update({ sent_at: new Date().toISOString() })
            .eq("subscription_id", sub.id)
            .eq("week_start", weekStartStr);
        }

        results.push({ pet: sub.pet_name, status: "success" });
        console.log(`[WEEKLY-HOROSCOPE] Completed ${sub.pet_name}`);
        
      } catch (petError: any) {
        console.error(`[WEEKLY-HOROSCOPE] Error for ${sub.pet_name}:`, petError);
        results.push({ pet: sub.pet_name, status: "error", error: petError?.message || "Unknown error" });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[WEEKLY-HOROSCOPE] Fatal error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function generateHoroscopeEmail(petName: string, content: any, sunSign: string, element: string): string {
  const elementColors: Record<string, string> = {
    Fire: "#ef4444",
    Earth: "#22c55e",
    Air: "#3b82f6",
    Water: "#8b5cf6",
  };
  const accentColor = elementColors[element] || "#8b5cf6";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f0a1f; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #1a1030 0%, #2d1f4a 100%); border-radius: 20px 20px 0 0;">
      <div style="font-size: 48px; margin-bottom: 10px;">✨🐾✨</div>
      <h1 style="color: white; margin: 0; font-size: 28px;">${petName}'s Weekly Forecast</h1>
      <p style="color: ${accentColor}; margin: 10px 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">${sunSign} • ${element} Energy</p>
    </div>
    
    <!-- Theme Badge -->
    <div style="background: linear-gradient(135deg, ${accentColor}22 0%, ${accentColor}11 100%); padding: 20px; text-align: center; border-left: 4px solid ${accentColor};">
      <p style="color: #a0a0a0; margin: 0 0 5px; font-size: 12px; text-transform: uppercase;">This Week's Theme</p>
      <h2 style="color: ${accentColor}; margin: 0; font-size: 32px; font-weight: bold;">${content.theme}</h2>
    </div>
    
    <!-- Overview -->
    <div style="background-color: #1a1030; padding: 30px;">
      <p style="color: #e0e0e0; line-height: 1.8; font-size: 16px; margin: 0;">${content.overview}</p>
    </div>
    
    <!-- Lucky Day & Activity -->
    <div style="display: flex; background-color: #150d25;">
      <div style="flex: 1; padding: 20px; text-align: center; border-right: 1px solid #2d1f4a;">
        <p style="color: #a0a0a0; margin: 0 0 5px; font-size: 11px; text-transform: uppercase;">Lucky Day</p>
        <p style="color: white; margin: 0; font-size: 18px; font-weight: bold;">🌟 ${content.luckyDay}</p>
      </div>
      <div style="flex: 1; padding: 20px; text-align: center;">
        <p style="color: #a0a0a0; margin: 0 0 5px; font-size: 11px; text-transform: uppercase;">Lucky Activity</p>
        <p style="color: white; margin: 0; font-size: 18px; font-weight: bold;">🎯 ${content.luckyActivity}</p>
      </div>
    </div>
    
    <!-- Daily Energy -->
    <div style="background-color: #1a1030; padding: 25px;">
      <h3 style="color: white; margin: 0 0 15px; font-size: 16px;">📅 Daily Energy Guide</h3>
      ${Object.entries(content.energyForecast || {}).map(([day, energy]) => `
        <div style="display: flex; padding: 8px 0; border-bottom: 1px solid #2d1f4a;">
          <span style="color: ${accentColor}; width: 100px; font-size: 14px; text-transform: capitalize;">${day}</span>
          <span style="color: #c0c0c0; font-size: 14px;">${energy}</span>
        </div>
      `).join('')}
    </div>
    
    <!-- Cosmic Advice -->
    <div style="background: linear-gradient(135deg, ${accentColor}33 0%, ${accentColor}11 100%); padding: 25px; margin-top: 2px;">
      <h3 style="color: white; margin: 0 0 10px; font-size: 14px;">💫 Cosmic Advice for ${petName}'s Human</h3>
      <p style="color: #e0e0e0; margin: 0; font-size: 15px; line-height: 1.6;">${content.cosmicAdvice}</p>
    </div>
    
    <!-- Affirmation -->
    <div style="background-color: #0f0a1f; padding: 30px; text-align: center; border-radius: 0 0 20px 20px;">
      <p style="color: #a0a0a0; margin: 0 0 10px; font-size: 12px; text-transform: uppercase;">Weekly Affirmation</p>
      <p style="color: white; margin: 0; font-size: 18px; font-style: italic;">"${content.affirmation}"</p>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; padding: 30px 20px;">
      <p style="color: #666; font-size: 12px; margin: 0;">Sent with cosmic love from Cosmic Paws ✨</p>
      <p style="color: #444; font-size: 11px; margin: 10px 0 0;">
        <a href="{{{unsubscribe_url}}}" style="color: #666;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}
