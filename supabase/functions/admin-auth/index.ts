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
  setupKey: z.string(), // Required setup key to create first admin
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

    if (action === "register") {
      // First admin setup - requires setup key
      const input = registerSchema.parse(body);
      
      // Check setup key (use a secret from env)
      const setupKey = Deno.env.get("ADMIN_SETUP_KEY") || "cosmic-admin-setup-2024";
      if (input.setupKey !== setupKey) {
        return new Response(JSON.stringify({ error: "Invalid setup key" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if admin already exists
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

    // Generate a simple session token
    const sessionToken = crypto.randomUUID() + "-" + Date.now();
    
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
