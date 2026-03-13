import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// Runs weekly via cron — adds credits to active chat membership subscribers
serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const now = new Date().toISOString();

    // Find all active memberships due for a credit refresh
    const { data: dueMembers, error: fetchError } = await supabase
      .from("chat_credits")
      .select("order_id, weekly_credits")
      .gt("weekly_credits", 0)
      .not("next_credit_refresh", "is", null)
      .lte("next_credit_refresh", now);

    if (fetchError) {
      console.error("[REFRESH-CREDITS] Fetch error:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 });
    }

    console.log(`[REFRESH-CREDITS] Found ${dueMembers?.length || 0} memberships due for refresh`);

    let refreshed = 0;
    for (const member of dueMembers || []) {
      // Add weekly credits
      const { error: rpcError } = await supabase.rpc("increment_chat_credits", {
        p_order_id: member.order_id,
        p_amount: member.weekly_credits,
      });

      if (rpcError) {
        console.error("[REFRESH-CREDITS] RPC error for", member.order_id, rpcError);
        continue;
      }

      // Set next refresh to 7 days from now
      const nextRefresh = new Date();
      nextRefresh.setDate(nextRefresh.getDate() + 7);

      await supabase
        .from("chat_credits")
        .update({
          next_credit_refresh: nextRefresh.toISOString(),
          updated_at: now,
        })
        .eq("order_id", member.order_id);

      refreshed++;
      console.log("[REFRESH-CREDITS] Refreshed", member.weekly_credits, "credits for", member.order_id);
    }

    return new Response(JSON.stringify({ refreshed, total: dueMembers?.length || 0 }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[REFRESH-CREDITS] Error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 });
  }
});
