import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { petName, species, breed, sunSign, element, archetype, style } = await req.json();
    
    console.log("[GENERATE-PORTRAIT] Creating portrait for:", petName);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build a detailed prompt for the pet portrait
    const styleDescriptions: Record<string, string> = {
      pokemon: "Pokemon trading card art style, vibrant anime style, dynamic pose, magical sparkles and energy effects",
      fantasy: "Fantasy illustration style, magical glowing aura, ethereal lighting, mystical atmosphere",
      portrait: "Professional pet portrait, soft lighting, warm colors, dignified pose, studio quality",
      cosmic: "Cosmic space theme, surrounded by stars and nebulae, celestial glow, mystical energy",
    };

    const elementEffects: Record<string, string> = {
      Fire: "with warm orange and red magical flames, fire particles, glowing ember effects",
      Earth: "with green nature energy, floating leaves, earthy brown and green tones, grounded energy",
      Air: "with swirling wind effects, light blue and white wisps, floating cloud elements",
      Water: "with blue water droplets, ocean wave effects, teal and aqua magical glow",
    };

    const chosenStyle = styleDescriptions[style] || styleDescriptions.pokemon;
    const elementEffect = elementEffects[element] || elementEffects.Fire;

    const prompt = `Create a stunning ${chosenStyle} portrait of a ${breed || species} (${species}). The pet should look majestic and magical, embodying the ${sunSign} zodiac energy. ${elementEffect}. The pet is known as "${archetype}". Make it look like a collectible trading card character - heroic, adorable, and powerful. High quality digital art, detailed fur/features, expressive eyes, centered composition, clean background with magical effects.`;

    console.log("[GENERATE-PORTRAIT] Prompt:", prompt);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[GENERATE-PORTRAIT] AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "We're experiencing high demand. Please try again in a moment." 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "Service temporarily unavailable. Please try again later." 
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("[GENERATE-PORTRAIT] Response received");

    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      console.error("[GENERATE-PORTRAIT] No image in response:", JSON.stringify(data).slice(0, 500));
      throw new Error("No image generated");
    }

    // Return the base64 image URL directly
    return new Response(JSON.stringify({ 
      imageUrl,
      prompt 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("[GENERATE-PORTRAIT] Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Failed to generate portrait" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
