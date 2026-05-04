/**
 * useCredits — fetch current credit balance + subscription tier for the
 * authenticated user. Refetched after generate / purchase events.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CreditsState {
  balance: number | null;
  tier: "pass" | "elite" | null;
  loading: boolean;
  refresh: () => void;
}

export function useCredits(): CreditsState {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [tier, setTier] = useState<"pass" | "elite" | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setBalance(null);
      setTier(null);
      return;
    }
    setLoading(true);
    try {
      const [creditsRes, subRes] = await Promise.all([
        supabase.from("portraits_credits").select("tokens").eq("account_id", user.id).maybeSingle(),
        supabase
          .from("portraits_subscriptions")
          .select("tier, status")
          .eq("account_id", user.id)
          .eq("status", "active")
          .maybeSingle(),
      ]);
      setBalance(creditsRes.data?.tokens ?? 0);
      setTier((subRes.data?.tier as "pass" | "elite" | null) ?? null);
    } catch {
      setBalance(null);
      setTier(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  return { balance, tier, loading, refresh };
}
