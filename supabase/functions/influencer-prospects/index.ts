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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "list";

    // GET - List all prospects
    if (req.method === "GET") {
      const status = url.searchParams.get("status");
      
      let query = supabase
        .from("influencer_prospects")
        .select("*")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, prospects: data }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // POST - Create or update prospect
    if (req.method === "POST") {
      const body = await req.json();
      const { action: bodyAction, prospect, prospects } = body;

      // Bulk add prospects
      if (bodyAction === "bulk-add" && prospects) {
        // Filter out duplicates by email or website
        const existingEmails = await supabase
          .from("influencer_prospects")
          .select("email, website");

        const existingSet = new Set([
          ...(existingEmails.data || []).map((p: any) => p.email?.toLowerCase()),
          ...(existingEmails.data || []).map((p: any) => p.website?.toLowerCase()),
        ].filter(Boolean));

        const newProspects = prospects.filter((p: any) => {
          const emailExists = p.email && existingSet.has(p.email.toLowerCase());
          const websiteExists = p.website && existingSet.has(p.website.toLowerCase());
          return !emailExists && !websiteExists;
        });

        if (newProspects.length === 0) {
          return new Response(
            JSON.stringify({ success: true, added: 0, message: "All prospects already exist" }),
            { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("influencer_prospects")
          .insert(newProspects)
          .select();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, added: data.length, prospects: data }),
          { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      // Single add
      if (bodyAction === "add" && prospect) {
        const { data, error } = await supabase
          .from("influencer_prospects")
          .insert(prospect)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, prospect: data }),
          { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      // Update prospect
      if (bodyAction === "update" && prospect?.id) {
        const { data, error } = await supabase
          .from("influencer_prospects")
          .update(prospect)
          .eq("id", prospect.id)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, prospect: data }),
          { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: "Invalid action" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // DELETE - Remove prospect
    if (req.method === "DELETE") {
      const { id } = await req.json();
      
      const { error } = await supabase
        .from("influencer_prospects")
        .delete()
        .eq("id", id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in influencer-prospects:", error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || "Unknown error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
