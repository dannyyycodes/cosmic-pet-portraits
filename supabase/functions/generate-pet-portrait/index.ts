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

    // Build style descriptions
    const styleDescriptions: Record<string, string> = {
      pokemon: "Transform into a Pokemon trading card art style character. Make it look like a real Pokemon creature with vibrant anime aesthetics, dynamic heroic pose, magical sparkles, energy aura effects, and elemental powers visible. The character should look like it belongs in the Pokemon universe as a collectible card creature.",
      fantasy: "Transform into a fantasy illustration style character with magical glowing aura, ethereal lighting, mystical atmosphere, floating magical particles",
      portrait: "Transform into a professional artistic pet portrait with soft lighting, warm colors, dignified pose, studio quality fine art style",
      cosmic: "Transform into a cosmic space-themed character surrounded by stars and nebulae, celestial glow, mystical energy, floating in space",
    };

    const elementEffects: Record<string, string> = {
      Fire: "Add warm orange and red magical flames, fire particles, glowing ember effects surrounding the character",
      Earth: "Add green nature energy, floating leaves, earthy brown and green tones, grounded magical energy around them",
      Air: "Add swirling wind effects, light blue and white wisps, floating cloud elements around the character",
      Water: "Add blue water droplets, ocean wave effects, teal and aqua magical glow surrounding them",
    };

    const chosenStyle = styleDescriptions[style] || styleDescriptions.pokemon;
    const elementEffect = elementEffects[element] || elementEffects.Fire;

    let imageUrl: string;
    let prompt: string;

    if (petImageUrl) {
      // IMAGE-TO-IMAGE: Transform the user's actual pet photo
      console.log("[GENERATE-PORTRAIT] Using image-to-image transformation");
      
      prompt = `${chosenStyle}. This is a ${breed || species} (${species}) with ${sunSign} zodiac energy, known as "${archetype}". ${elementEffect}. Keep the pet's unique features, markings, colors, and characteristics recognizable while transforming the style. Make it look magical, heroic, and powerful. High quality digital art, expressive eyes, clean stylized background with magical effects. The final image should be a beautiful, collectible card-worthy transformation of this specific pet. IMPORTANT: Do NOT include any text, words, letters, numbers, or writing anywhere in the image. No labels, no captions, no watermarks.`;

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
      // TEXT-TO-IMAGE: Generate from description only (fallback)
      console.log("[GENERATE-PORTRAIT] Using text-to-image generation (no pet photo provided)");
      
      prompt = `Create a stunning ${chosenStyle} portrait of a ${breed || species} (${species}). The pet should look majestic and magical, embodying the ${sunSign} zodiac energy. ${elementEffect}. The pet is known as "${archetype}". Make it look like a collectible trading card character - heroic, adorable, and powerful. High quality digital art, detailed fur/features, expressive eyes, centered composition, clean background with magical effects. IMPORTANT: Do NOT include any text, words, letters, numbers, or writing anywhere in the image. No labels, no captions, no watermarks.`;

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