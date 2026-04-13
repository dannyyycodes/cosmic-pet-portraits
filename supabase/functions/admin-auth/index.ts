import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { checkRateLimit, getClientIp } from "../_shared/rate-limit.ts";

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app"];

// Per-IP login throttle. The previous 1-second sleep on a wrong password
// was not enough to stop a slow brute-force from a single attacker IP.
const LOGIN_RATE_LIMIT_COUNT = 10;
const LOGIN_RATE_LIMIT_WINDOW_SECONDS = 600;

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

// Secure password hashing using PBKDF2 (Web Crypto API - works in Edge Functions)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  
  const hashArray = new Uint8Array(derivedBits);
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("");
  const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, "0")).join("");
  
  return `pbkdf2:${saltHex}:${hashHex}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // Handle PBKDF2 format
  if (storedHash.startsWith('pbkdf2:')) {
    const parts = storedHash.split(':');
    if (parts.length !== 3) return false;
    
    const saltHex = parts[1];
    const expectedHashHex = parts[2];
    
    // Convert salt from hex to Uint8Array
    const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      256
    );
    
    const hashArray = new Uint8Array(derivedBits);
    const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, "0")).join("");
    
    return hashHex === expectedHashHex;
  }
  
  // Legacy SHA-256 hash (for migration)
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const legacyHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  
  return legacyHash === storedHash;
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
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const url = new URL(req.url);
    const body = await req.json();
    // Support action from query string or body
    const action = url.searchParams.get("action") || body.action;

    // Per-IP throttle on the credential-checking actions. Validate/logout are
    // cheap and not brute-force targets, so they bypass the limit.
    if (action !== "validate" && action !== "logout") {
      const ip = getClientIp(req);
      const rl = await checkRateLimit(supabaseClient, "admin-auth", ip, LOGIN_RATE_LIMIT_COUNT, LOGIN_RATE_LIMIT_WINDOW_SECONDS);
      if (!rl.ok) {
        return new Response(JSON.stringify({ error: "Too many attempts, please wait" }), {
          status: 429,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json", "Retry-After": String(rl.retryAfterSeconds) },
        });
      }
    }

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
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
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
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ valid: true, admin_id: session.admin_id }), {
        status: 200,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
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
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    if (action === "register") {
      const input = registerSchema.parse(body);
      
      // Trim setup key to handle whitespace
      const setupKey = Deno.env.get("ADMIN_SETUP_KEY")?.trim();
      if (!setupKey) {
        console.error("[ADMIN-AUTH] ADMIN_SETUP_KEY environment variable is not configured");
        return new Response(JSON.stringify({ error: "Registration is not available" }), {
          status: 503,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      if (input.setupKey.trim() !== setupKey) {
        console.log("[ADMIN-AUTH] Setup key mismatch");
        return new Response(JSON.stringify({ error: "Invalid setup key" }), {
          status: 403,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
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
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      // Use PBKDF2 for password hashing
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
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      console.log("[ADMIN-AUTH] Admin registered:", input.email);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Default: Login
    const input = loginSchema.parse(body);

    // Fetch admin by email
    const { data: admin, error: fetchError } = await supabaseClient
      .from("admin_users")
      .select("id, email, password_hash")
      .eq("email", input.email)
      .single();

    if (fetchError || !admin) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Verify password
    const isValid = await verifyPassword(input.password, admin.password_hash);
    
    // If using legacy hash and valid, upgrade to PBKDF2
    if (isValid && !admin.password_hash.startsWith('pbkdf2:')) {
      const newHash = await hashPassword(input.password);
      await supabaseClient
        .from("admin_users")
        .update({ password_hash: newHash })
        .eq("id", admin.id);
      
      console.log("[ADMIN-AUTH] Upgraded password hash to PBKDF2 for:", admin.email);
    }

    if (!isValid) {
      // Add small delay to slow down brute-force attempts
      await new Promise(r => setTimeout(r, 1000));
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
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
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    console.log("[ADMIN-AUTH] Login successful for:", admin.email);
    
    return new Response(JSON.stringify({ 
      success: true, 
      admin: { id: admin.id, email: admin.email },
      token: sessionToken
    }), {
      status: 200,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    console.error("[ADMIN-AUTH] Error:", error);
    return new Response(JSON.stringify({ error: "Service unavailable" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
