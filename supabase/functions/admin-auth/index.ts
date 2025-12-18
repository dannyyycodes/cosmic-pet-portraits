import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple password hashing using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(100),
});

const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(100),
  setupKey: z.string(),
});

const validateSchema = z.object({
  token: z.string().min(1),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const body = await req.json();

    // Validate session token
    if (action === "validate") {
      const input = validateSchema.parse(body);
      
      const { data: session, error } = await supabaseClient
        .from("admin_sessions")
        .select("id, admin_id, expires_at")
        .eq("token", input.token)
        .single();

      if (error || !session) {
        return new Response(JSON.stringify({ valid: false }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check expiry
      if (new Date(session.expires_at) < new Date()) {
        // Delete expired session
        await supabaseClient
          .from("admin_sessions")
          .delete()
          .eq("id", session.id);
        
        return new Response(JSON.stringify({ valid: false, reason: "expired" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ valid: true, admin_id: session.admin_id }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Logout - delete session
    if (action === "logout") {
      const input = validateSchema.parse(body);
      
      await supabaseClient
        .from("admin_sessions")
        .delete()
        .eq("token", input.token);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "register") {
      const input = registerSchema.parse(body);
      
      const setupKey = Deno.env.get("ADMIN_SETUP_KEY") || "cosmic-admin-setup-2024";
      if (input.setupKey !== setupKey) {
        return new Response(JSON.stringify({ error: "Invalid setup key" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: existing } = await supabaseClient
        .from("admin_users")
        .select("id")
        .eq("email", input.email)
        .single();

      if (existing) {
        return new Response(JSON.stringify({ error: "Admin already exists" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const passwordHash = await hashPassword(input.password);

      const { error: insertError } = await supabaseClient
        .from("admin_users")
        .insert({
          email: input.email,
          password_hash: passwordHash,
        });

      if (insertError) {
        console.error("[ADMIN-AUTH] Insert error:", insertError);
        return new Response(JSON.stringify({ error: "Failed to create admin" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default: Login
    const input = loginSchema.parse(body);
    const passwordHash = await hashPassword(input.password);

    const { data: admin, error: fetchError } = await supabaseClient
      .from("admin_users")
      .select("id, email")
      .eq("email", input.email)
      .eq("password_hash", passwordHash)
      .single();

    if (fetchError || !admin) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate secure session token
    const sessionToken = crypto.randomUUID() + "-" + crypto.randomUUID();
    
    // Store session in database with 24-hour expiry
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { error: sessionError } = await supabaseClient
      .from("admin_sessions")
      .insert({
        token: sessionToken,
        admin_id: admin.id,
        expires_at: expiresAt.toISOString(),
      });

    if (sessionError) {
      console.error("[ADMIN-AUTH] Session creation error:", sessionError);
      return new Response(JSON.stringify({ error: "Failed to create session" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[ADMIN-AUTH] Login successful for:", admin.email);
    
    return new Response(JSON.stringify({ 
      success: true, 
      admin: { id: admin.id, email: admin.email },
      token: sessionToken
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.error("[ADMIN-AUTH] Error:", error);
    return new Response(JSON.stringify({ error: "Service unavailable" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});