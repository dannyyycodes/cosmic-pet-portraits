import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app"];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  // Auth check
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  const bridgeSecret = Deno.env.get("N8N_BRIDGE_SECRET");

  if (!bridgeSecret || token !== bridgeSecret) {
    console.error("[N8N-BRIDGE] Unauthorized request");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  // Service role client for DB access
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    if (req.method === "POST") {
      const { reportId } = await req.json();
      if (!reportId || !UUID_RE.test(reportId)) {
        return new Response(JSON.stringify({ error: "Invalid reportId" }), {
          status: 400,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      console.log("[N8N-BRIDGE] Reading report:", reportId);
      const { data, error } = await supabase
        .from("pet_reports")
        .select("id, pet_name, species, breed, gender, birth_date, birth_time, birth_location, soul_type, superpower, stranger_reaction, occasion_mode, language, owner_name, owner_birth_date, owner_birth_time, owner_birth_location, email, pet_photo_url, includes_portrait, includes_book, report_content, payment_status")
        .eq("id", reportId)
        .single();

      if (error || !data) {
        console.error("[N8N-BRIDGE] Report not found:", error?.message);
        return new Response(JSON.stringify({ error: "Report not found" }), {
          status: 404,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(data), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    if (req.method === "PATCH") {
      const { reportId, reportContent } = await req.json();
      if (!reportId || !UUID_RE.test(reportId)) {
        return new Response(JSON.stringify({ error: "Invalid reportId" }), {
          status: 400,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      if (!reportContent || typeof reportContent !== "object") {
        return new Response(JSON.stringify({ error: "Invalid reportContent" }), {
          status: 400,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      console.log("[N8N-BRIDGE] Updating report:", reportId);
      const { error } = await supabase
        .from("pet_reports")
        .update({ report_content: reportContent, updated_at: new Date().toISOString() })
        .eq("id", reportId);

      if (error) {
        console.error("[N8N-BRIDGE] Update failed:", error.message);
        return new Response(JSON.stringify({ error: "Update failed" }), {
          status: 500,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[N8N-BRIDGE] Error:", (err as Error).message);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
