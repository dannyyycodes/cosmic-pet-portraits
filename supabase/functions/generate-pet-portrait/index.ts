import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to convert base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { petName, species, breed, sunSign, element, archetype, style, petImageUrl, reportId } = await req.json();
    
    console.log("[GENERATE-PORTRAIT] Creating portrait for:", petName, "with image:", !!petImageUrl);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // UPGRADED: Premium collectible card art style prompts
    // Key improvements: Less "AI look", more hand-painted/illustrated feel
    const styleDescriptions: Record<string, string> = {
      cosmic: `Transform this pet into a premium collectible trading card illustration. Art style: hand-painted digital art reminiscent of high-end fantasy card games (like Magic: The Gathering or premium Pokemon cards). 
        - Use rich, painterly brushstrokes with visible artistic texture
        - Apply dramatic cinematic lighting with rim lighting and depth
        - Add mystical cosmic background with subtle nebula clouds and soft starlight
        - Give the pet a majestic, regal presence while keeping their unique personality
        - Eyes should be expressive and soulful, slightly stylized but not cartoonish
        - Color palette should be rich jewel tones with luminous highlights
        - The overall feel should be "museum-quality pet portrait meets fantasy art"`,
      pokemon: `Transform this pet into a collectible creature card in the style of premium trading card game art. 
        - Style: Professional Japanese anime-influenced illustration, NOT cheap AI art
        - Dynamic heroic pose with confident energy
        - Vibrant but harmonious color palette
        - Magical sparkle and energy effects that feel intentional, not overdone
        - Keep the pet's actual likeness, markings, and unique features clearly recognizable
        - Background should have soft magical elements without overwhelming the subject`,
      fantasy: `Transform into a high-fantasy book cover illustration style.
        - Painterly realism with fantasy elements
        - Soft ethereal glow and magical atmosphere
        - Rich, warm lighting like a classical oil painting
        - Mystical particles and gentle magical effects`,
      portrait: `Transform into a fine art pet portrait worthy of gallery display.
        - Classical portrait painting style with modern digital precision
        - Soft, flattering studio lighting
        - Rich textures in fur/feathers rendered with artistic brushwork
        - Dignified, timeless composition`,
    };

    // Archetype-specific visual themes
    const archetypeVisuals: Record<string, string> = {
      "The Mystical Dreamer": "dreamy, ethereal atmosphere with soft purple and blue auroras, floating crystals, eyes half-closed in peaceful meditation, surrounded by gentle starlight",
      "The Noble Guardian": "heroic stance with warm golden light rays, protective energy aura, noble and alert expression, subtle shield or armor-like light effects",
      "The Chaos Gremlin": "playful mischievous energy, dynamic action pose, scattered magical sparks, wild but endearing expression, vibrant chaotic colors",
      "The Gentle Giant": "soft warm lighting, peaceful serene expression, earth tones with gentle green nature elements, protective gentle aura",
      "The Drama Queen": "theatrical dramatic lighting, regal confident pose, rich jewel tones, spotlight effect, crown or tiara light effects",
      "The Wise Elder": "soft sage greens and deep purples, ancient mystical symbols floating gently, knowing wise eyes, scroll or book elements",
      "The Eternal Optimist": "bright sunny golden lighting, joyful dynamic energy, rainbow prismatic effects, infectious happy expression",
      "The Shadow Walker": "mysterious dark elegance, moonlit atmosphere, silver and deep blue tones, mysterious but not scary, elegant shadows",
    };

    const elementEffects: Record<string, string> = {
      Fire: "warm amber and soft orange glow emanating from behind, subtle flame-like wisps (NOT cartoonish flames), warm color temperature throughout",
      Earth: "grounded energy with soft moss greens and warm browns, gentle floating leaves or petals, stable rooted presence, nature's embrace",
      Air: "light and ethereal with soft white and pale blue wisps, gentle breeze effect on fur, floating lightness, cloud-like softness",
      Water: "cool teal and aquamarine reflections, gentle water droplet effects, fluid graceful energy, oceanic depth in the eyes",
    };

    const chosenStyle = styleDescriptions[style] || styleDescriptions.cosmic;
    const archetypeVisual = archetypeVisuals[archetype] || "mystical magical presence with gentle cosmic energy";
    const elementEffect = elementEffects[element] || elementEffects.Fire;

    let imageUrl: string;
    let prompt: string;

    if (petImageUrl) {
      // IMAGE-TO-IMAGE: Transform the user's actual pet photo into collectible art
      console.log("[GENERATE-PORTRAIT] Using image-to-image transformation");
      
      prompt = `${chosenStyle}

SUBJECT: A ${breed || species} (${species}) embodying the ${sunSign} zodiac archetype "${archetype}".

ARCHETYPE VISUAL THEME: ${archetypeVisual}

ELEMENTAL ENERGY: ${elementEffect}

CRITICAL REQUIREMENTS:
1. PRESERVE THE PET'S UNIQUE IDENTITY - their exact face shape, ear shape, markings, colors, and distinctive features must be clearly recognizable as THIS specific pet
2. DO NOT make it look like generic AI art - it should look hand-illustrated by a professional fantasy artist
3. The transformation should enhance, not replace, what makes this pet unique
4. Quality level: Premium collectible trading card art, museum-worthy
5. NO TEXT, NO WORDS, NO WATERMARKS, NO LABELS anywhere in the image
6. Square composition, centered subject with artistic breathing room`;

      console.log("[GENERATE-PORTRAIT] Edit prompt:", prompt);

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
              content: [
                {
                  type: "text",
                  text: prompt
                },
                {
                  type: "image_url",
                  image_url: {
                    url: petImageUrl
                  }
                }
              ]
            }
          ],
          modalities: ["image", "text"]
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[GENERATE-PORTRAIT] AI edit error:", response.status, errorText);
        
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
      console.log("[GENERATE-PORTRAIT] Edit response received");

      imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      
    } else {
      // TEXT-TO-IMAGE: Generate from description only (fallback when no photo provided)
      console.log("[GENERATE-PORTRAIT] Using text-to-image generation (no pet photo provided)");
      
      prompt = `${chosenStyle}

Create a premium collectible trading card illustration of a ${breed || species} (${species}).

SUBJECT: This pet embodies the ${sunSign} zodiac archetype known as "${archetype}".

ARCHETYPE VISUAL THEME: ${archetypeVisual}

ELEMENTAL ENERGY: ${elementEffect}

REQUIREMENTS:
1. Professional fantasy card game art quality - hand-painted digital art look
2. NOT generic AI art - should look like a professional illustrator created it
3. Rich, painterly textures with intentional brushwork
4. Dramatic but beautiful lighting
5. Expressive, soulful eyes that capture personality
6. NO TEXT, NO WORDS, NO WATERMARKS, NO LABELS anywhere
7. Square composition, centered subject`;

      console.log("[GENERATE-PORTRAIT] Generate prompt:", prompt);

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
        console.error("[GENERATE-PORTRAIT] AI generate error:", response.status, errorText);
        
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
      console.log("[GENERATE-PORTRAIT] Generate response received");

      imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    }
    
    if (!imageUrl) {
      console.error("[GENERATE-PORTRAIT] No image in response");
      throw new Error("No image generated");
    }

    // If it's a base64 data URL, upload to Supabase Storage
    let finalImageUrl = imageUrl;
    if (imageUrl.startsWith('data:image/')) {
      console.log("[GENERATE-PORTRAIT] Uploading base64 image to storage");
      
      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );
        
        // Parse the data URL
        const matches = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
        if (matches) {
          const extension = matches[1];
          const base64Data = matches[2];
          const imageBytes = base64ToUint8Array(base64Data);
          
          // Generate unique filename
          const timestamp = Date.now();
          const randomId = crypto.randomUUID().slice(0, 8);
          const fileName = `portraits/${reportId || 'unknown'}/${timestamp}-${randomId}.${extension}`;
          
          // Upload to storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('pet-photos')
            .upload(fileName, imageBytes, {
              contentType: `image/${extension}`,
              upsert: true,
            });
          
          if (uploadError) {
            console.error("[GENERATE-PORTRAIT] Storage upload failed:", uploadError);
            // Fall back to returning base64 (may not work for large images)
          } else {
            // Get public URL
            const { data: publicUrlData } = supabase.storage
              .from('pet-photos')
              .getPublicUrl(fileName);
            
            finalImageUrl = publicUrlData.publicUrl;
            console.log("[GENERATE-PORTRAIT] Image uploaded to storage:", finalImageUrl);
          }
        }
      } catch (uploadErr) {
        console.error("[GENERATE-PORTRAIT] Failed to upload to storage:", uploadErr);
        // Fall back to base64 URL
      }
    }

    // Return the final image URL (either storage URL or original)
    return new Response(JSON.stringify({ 
      imageUrl: finalImageUrl,
      prompt,
      usedPetImage: !!petImageUrl
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