import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app"];

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
    const { prospect } = await req.json();
    
    if (!prospect) {
      return new Response(
        JSON.stringify({ success: false, error: "Prospect data is required" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "AI not configured" }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    console.log("Generating pitch for:", prospect.name);

    const systemPrompt = `You write short, warm, genuinely personal outreach emails inviting pet creators to partner with Little Souls — hand-painted "pawtraits" and astrology-grade "soul readings" that honour the bond between a person and their pet.

Tone: human and specific, never salesy. Open line references something REAL about their content. For memorial or grief creators, be especially gentle — honour the loss, never exploit it.

The offer, gift-first:
- First, gift them a free soul reading of their own pet — no strings, before any ask.
- If they'd love to share it, the partner programme pays 50% on every soul reading, 20% for life on horoscope memberships, and 15% on pawtraits, plus a £15 bonus on their first sale. Rates climb to 45% as they grow.
- Their audience gets a discount through their own link.

Hard rules: NEVER use the words "AI", "artificial intelligence", or "report" — it is a "soul reading", not a report. Use £ (GBP), never $. 90-130 words. One soft, clear call to action (e.g. "want me to make one for [pet]?"). No "buy now", no hype, no emoji spam.`;

    const userPrompt = `Write a personalized outreach email for this pet influencer:

Name: ${prospect.name}
Website: ${prospect.website || "Not available"}
Instagram: ${prospect.instagram ? `@${prospect.instagram}` : "Not available"}
TikTok: ${prospect.tiktok ? `@${prospect.tiktok}` : "Not available"}
Niche: ${prospect.niche || "pets"}
Content Summary: ${prospect.content_summary || "Pet content creator"}

Write a warm, personal email inviting them to partner with Little Souls. Reference something specific about their content, and lead by offering a free soul reading of their own pet before any ask.`;

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
          { status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "AI credits exhausted, please add funds" }),
          { status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to generate pitch" }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const pitch = data.choices?.[0]?.message?.content;

    if (!pitch) {
      return new Response(
        JSON.stringify({ success: false, error: "No pitch generated" }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    console.log("Pitch generated successfully");

    return new Response(
      JSON.stringify({ success: true, pitch }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in generate-influencer-pitch:", error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || "Unknown error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
