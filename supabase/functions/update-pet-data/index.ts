import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reportId, petName, species, breed, gender, birthDate, birthTime, location, soulType, superpower, strangerReaction, petPhotoUrl } = await req.json();

    if (!reportId || !petName || !species) {
      return new Response(JSON.stringify({ error: "Missing required fields: reportId, petName, species" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify report exists and is paid
    const { data: report, error: fetchError } = await supabaseClient
      .from("pet_reports")
      .select("id, payment_status, email")
      .eq("id", reportId)
      .single();

    if (fetchError || !report) {
      return new Response(JSON.stringify({ error: "Report not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    if (report.payment_status !== "paid") {
      return new Response(JSON.stringify({ error: "Payment not confirmed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Update pet data
    const updateData: Record<string, unknown> = {
      pet_name: petName,
      species,
      updated_at: new Date().toISOString(),
    };
    if (breed) updateData.breed = breed;
    if (gender) updateData.gender = gender;
    if (birthDate) updateData.birth_date = birthDate;
    if (birthTime) updateData.birth_time = birthTime;
    if (location) updateData.birth_location = location;
    if (soulType) updateData.soul_type = soulType;
    if (superpower) updateData.superpower = superpower;
    if (strangerReaction) updateData.stranger_reaction = strangerReaction;
    if (petPhotoUrl) updateData.pet_photo_url = petPhotoUrl;

    const { error: updateError } = await supabaseClient
      .from("pet_reports")
      .update(updateData)
      .eq("id", reportId);

    if (updateError) {
      console.error("[UPDATE-PET-DATA] Update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update pet data" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    console.log("[UPDATE-PET-DATA] Updated report:", reportId, "pet:", petName, "species:", species);

    return new Response(JSON.stringify({ success: true, reportId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[UPDATE-PET-DATA] Error:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
