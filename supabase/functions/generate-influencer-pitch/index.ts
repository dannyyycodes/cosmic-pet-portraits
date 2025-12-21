import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prospect } = await req.json();
    
    if (!prospect) {
      return new Response(
        JSON.stringify({ success: false, error: "Prospect data is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "AI not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generating pitch for:", prospect.name);

    const systemPrompt = `You are an expert at writing personalized, friendly outreach emails to pet influencers. 
Your goal is to invite them to join the Cosmic Pet affiliate program where they can earn 50% commission promoting pet astrology reports.

Key selling points:
- 50% commission on every sale ($4.50-$10+ per sale)
- Unique, viral product - pet astrology birth charts
- Their followers will love it
- Easy to share with their audience
- Perfect for pet content creators

Write in a warm, personal tone. Reference their specific content/niche when possible.
Keep emails concise (150-200 words max).
Include a clear call to action to sign up as an affiliate.`;

    const userPrompt = `Write a personalized outreach email for this pet influencer:

Name: ${prospect.name}
Website: ${prospect.website || "Not available"}
Instagram: ${prospect.instagram ? `@${prospect.instagram}` : "Not available"}
TikTok: ${prospect.tiktok ? `@${prospect.tiktok}` : "Not available"}
Niche: ${prospect.niche || "pets"}
Content Summary: ${prospect.content_summary || "Pet content creator"}

Write a compelling, personalized email inviting them to become a Cosmic Pet affiliate. Reference something specific about their content if possible.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "AI credits exhausted, please add funds" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to generate pitch" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const pitch = data.choices?.[0]?.message?.content;

    if (!pitch) {
      return new Response(
        JSON.stringify({ success: false, error: "No pitch generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Pitch generated successfully");

    return new Response(
      JSON.stringify({ success: true, pitch }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in generate-influencer-pitch:", error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
