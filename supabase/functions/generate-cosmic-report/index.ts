import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const petDataSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-zA-Z\s\-']+$/, "Invalid pet name"),
  species: z.string().min(1).max(30),
  breed: z.string().max(100).optional().default(''),
  gender: z.enum(['boy', 'girl']),
  dateOfBirth: z.string().refine(d => !isNaN(Date.parse(d)), "Invalid date format"),
  location: z.string().max(100).optional().default(''),
  soulType: z.string().max(50).optional().default(''),
  superpower: z.string().max(50).optional().default(''),
  strangerReaction: z.string().max(50).optional().default(''),
});

const reportSchema = z.object({
  petData: petDataSchema,
  reportId: z.string().uuid().optional(),
});

// Accurate zodiac date ranges
function getSunSign(month: number, day: number): string {
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricorn";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius";
  return "Pisces";
}

function getElement(sign: string): string {
  const fire = ["Aries", "Leo", "Sagittarius"];
  const earth = ["Taurus", "Virgo", "Capricorn"];
  const air = ["Gemini", "Libra", "Aquarius"];
  if (fire.includes(sign)) return "Fire";
  if (earth.includes(sign)) return "Earth";
  if (air.includes(sign)) return "Air";
  return "Water";
}

function getModality(sign: string): string {
  const cardinal = ["Aries", "Cancer", "Libra", "Capricorn"];
  const fixed = ["Taurus", "Leo", "Scorpio", "Aquarius"];
  if (cardinal.includes(sign)) return "Cardinal";
  if (fixed.includes(sign)) return "Fixed";
  return "Mutable";
}

function calculateNameVibration(name: string): number {
  const cleanName = name.toLowerCase().replace(/[^a-z]/g, '');
  let sum = 0;
  for (const char of cleanName) {
    sum += char.charCodeAt(0) - 96;
  }
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = sum.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
  }
  return sum;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input
    const rawInput = await req.json();
    const input = reportSchema.parse(rawInput);
    const petData = input.petData;
    
    console.log("[GENERATE-REPORT] Processing for:", petData.name);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Parse date
    const dob = new Date(petData.dateOfBirth);
    const month = dob.getMonth() + 1;
    const day = dob.getDate();
    
    // Calculate accurate astrological data
    const sunSign = getSunSign(month, day);
    const element = getElement(sunSign);
    const modality = getModality(sunSign);
    const nameVibration = calculateNameVibration(petData.name);

    const systemPrompt = `You are Celeste, a warm and mystical pet astrologer who creates deeply personal cosmic portraits for pets. You combine accurate Western astrology with intuitive wisdom to reveal the soul essence of each animal.

Your voice is: warm, wise, slightly mystical but grounded, like a beloved grandmother who also happens to be a gifted astrologer. You speak directly to the pet owner about their pet.

IMPORTANT ASTROLOGICAL ACCURACY:
- Sun Sign: ${sunSign} (Element: ${element}, Modality: ${modality})
- Name Vibration: ${nameVibration}
- Use ACCURATE traits for this sign - do not invent or mix up zodiac characteristics
- Reference the element and modality in your analysis

${sunSign} traits to weave in:
${sunSign === "Aries" ? "Bold, pioneering, courageous, impulsive, energetic, competitive, honest, impatient" : ""}
${sunSign === "Taurus" ? "Loyal, sensual, stubborn, patient, loves comfort, reliable, possessive, grounded" : ""}
${sunSign === "Gemini" ? "Curious, communicative, adaptable, playful, restless, clever, dual-natured" : ""}
${sunSign === "Cancer" ? "Nurturing, intuitive, protective, moody, home-loving, sensitive, loyal" : ""}
${sunSign === "Leo" ? "Dramatic, generous, proud, warm-hearted, loves attention, loyal, confident" : ""}
${sunSign === "Virgo" ? "Analytical, helpful, perfectionist, modest, practical, health-conscious, devoted" : ""}
${sunSign === "Libra" ? "Harmonious, social, indecisive, charming, diplomatic, partnership-oriented" : ""}
${sunSign === "Scorpio" ? "Intense, loyal, secretive, transformative, passionate, perceptive, powerful" : ""}
${sunSign === "Sagittarius" ? "Adventurous, optimistic, freedom-loving, honest, philosophical, restless" : ""}
${sunSign === "Capricorn" ? "Ambitious, disciplined, responsible, reserved, patient, wise, dignified" : ""}
${sunSign === "Aquarius" ? "Independent, humanitarian, eccentric, innovative, detached, friendly, unique" : ""}
${sunSign === "Pisces" ? "Intuitive, compassionate, dreamy, artistic, sensitive, escapist, empathic" : ""}`;

    const userPrompt = `Create a cosmic portrait for this pet:

Name: ${petData.name}
Species: ${petData.species}
Breed: ${petData.breed || "Mixed/Unknown"}
Gender: ${petData.gender === "boy" ? "Male" : "Female"}
Birth Date: ${dob.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
Location: ${petData.location || "Unknown"}
Soul Type (owner's perception): ${petData.soulType || "Not specified"}
Superpower: ${petData.superpower || "Not specified"}
Reaction to Strangers: ${petData.strangerReaction || "Not specified"}

Generate a JSON response with this exact structure:
{
  "sunSign": "${sunSign}",
  "archetype": "A 3-5 word archetype title like 'The Fearless Guardian' or 'The Gentle Dreamer'",
  "element": "${element}",
  "modality": "${modality}",
  "nameVibration": ${nameVibration},
  "coreEssence": "2-3 sentences capturing their essential nature based on their sun sign",
  "soulMission": "1-2 sentences about why this pet came into their owner's life",
  "hiddenGift": "1-2 sentences about a special quality they bring",
  "loveLanguage": "How this pet gives and receives love based on their sign",
  "cosmicAdvice": "One piece of wisdom for deepening the bond"
}

Be specific to THIS pet, weaving in their species, breed characteristics, and the personality details provided. Make it feel personal and magical.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service temporarily unavailable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const reportContent = JSON.parse(aiResponse.choices[0].message.content);

    // Update the database record with the generated report
    if (input.reportId) {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      await supabaseClient
        .from("pet_reports")
        .update({ report_content: reportContent })
        .eq("id", input.reportId);
    }

    return new Response(JSON.stringify({ report: reportContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      console.error("[GENERATE-REPORT] Validation error:", error.errors);
      return new Response(JSON.stringify({ 
        error: "Invalid input data",
        details: error.errors.map(e => e.message).join(", ")
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.error("Error generating report:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
