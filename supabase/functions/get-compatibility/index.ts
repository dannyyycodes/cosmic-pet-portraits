import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app"];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

/**
 * Fetches a cross-pet compatibility reading for the viewer UI. Accepts either
 * a share_token (unauthenticated, e.g. shared link) or an authenticated email
 * match.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const url = new URL(req.url);
    const compatibilityId = url.searchParams.get("id") || (await req.json().catch(() => ({})))?.compatibilityId;
    const shareToken = url.searchParams.get("token");

    if (!compatibilityId && !shareToken) {
      return new Response(JSON.stringify({ error: "Missing id or token" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const query = supabase
      .from("pet_compatibilities")
      .select(`
        id, status, reading_content, share_token, created_at,
        pet_a:pet_reports!pet_report_a_id(id, pet_name, species, pet_photo_url, gender, report_content),
        pet_b:pet_reports!pet_report_b_id(id, pet_name, species, pet_photo_url, gender, report_content)
      `);

    const { data, error } = shareToken
      ? await query.eq("share_token", shareToken).maybeSingle()
      : await query.eq("id", compatibilityId).maybeSingle();

    if (error || !data) {
      return new Response(JSON.stringify({ error: "Compatibility not found" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Trim source reports to just the fields the viewer needs — the full
    // report content is huge and we don't need it for the compatibility view.
    const trimPet = (p: any) => p ? {
      id: p.id,
      petName: p.pet_name,
      species: p.species,
      petPhotoUrl: p.pet_photo_url,
      gender: p.gender,
      sunSign: p.report_content?.chartPlacements?.sun?.sign || p.report_content?.sunSign,
      moonSign: p.report_content?.chartPlacements?.moon?.sign || p.report_content?.moonSign,
      archetype: p.report_content?.archetype?.name || p.report_content?.archetype,
    } : null;

    return new Response(JSON.stringify({
      id: data.id,
      status: data.status,
      reading: data.reading_content,
      shareToken: data.share_token,
      petA: trimPet(data.pet_a),
      petB: trimPet(data.pet_b),
      createdAt: data.created_at,
    }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[GET-COMPAT] Error:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});
