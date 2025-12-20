import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const petReportSchema = z.object({
  email: z.string().email().max(255),
  pet_name: z.string().min(1).max(50),
  species: z.string().min(1).max(50),
  breed: z.string().max(100).nullable().optional(),
  gender: z.string().max(20).nullable().optional(),
  birth_date: z.string().nullable().optional(), // ISO date string
  birth_location: z.string().max(100).nullable().optional(),
  soul_type: z.string().max(50).nullable().optional(),
  superpower: z.string().max(50).nullable().optional(),
  stranger_reaction: z.string().max(50).nullable().optional(),
  occasion_mode: z.string().max(20).nullable().optional(),
  language: z.string().max(10).optional().default('en'),
});

const inputSchema = z.object({
  pets: z.array(petReportSchema).min(1).max(10),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if user is authenticated (optional - allows guest checkout)
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const anonClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? ""
      );
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await anonClient.auth.getUser(token);
      userId = userData.user?.id || null;
    }

    // Parse and validate input
    const rawInput = await req.json();
    const input = inputSchema.parse(rawInput);

    console.log("[CREATE-INTAKE-REPORT] Creating reports for", input.pets.length, "pets");

    const reportIds: string[] = [];

    for (const pet of input.pets) {
      // Generate UUID server-side
      const reportId = crypto.randomUUID();

      const { error: dbError } = await supabaseClient
        .from("pet_reports")
        .insert({
          id: reportId,
          email: pet.email.trim().toLowerCase(),
          pet_name: pet.pet_name.trim(),
          species: pet.species,
          breed: pet.breed?.trim() || null,
          gender: pet.gender || null,
          birth_date: pet.birth_date || null,
          birth_location: pet.birth_location?.trim() || null,
          soul_type: pet.soul_type?.trim() || null,
          superpower: pet.superpower?.trim() || null,
          stranger_reaction: pet.stranger_reaction?.trim() || null,
          occasion_mode: pet.occasion_mode || null,
          user_id: userId,
          language: pet.language || 'en',
          payment_status: 'pending',
        });

      if (dbError) {
        console.error("[CREATE-INTAKE-REPORT] DB error:", dbError);
        throw new Error("Failed to save pet data");
      }

      console.log("[CREATE-INTAKE-REPORT] Created report:", reportId, "for", pet.pet_name);
      reportIds.push(reportId);
    }

    return new Response(JSON.stringify({ reportIds }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("[CREATE-INTAKE-REPORT] Error:", error);
    
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: "Invalid input data" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    return new Response(JSON.stringify({ error: "Failed to create report" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
