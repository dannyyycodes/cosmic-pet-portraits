/**
 * useCredits — fetch current credit balance + subscription tier for the
 * authenticated user. Refetched after generate / purchase events.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CreditsState {
  /** Generation credits (1 token = 1 generation = 1 prompt → 4 variants). */
  balance: number | null;
  /** Digital download credits (1 = free digital download instead of paying £19). */
  downloadCredits: number | null;
  tier: "pass" | "elite" | null;
  loading: boolean;
  refresh: () => void;
}

type CreditsRow = { tokens?: number; download_credits?: number };
type SubscriptionRow = { tier?: "pass" | "elite" | null; status?: string };
type QueryResult<T> = Promise<{ data: T | null; error?: unknown }>;
interface MinimalSupabaseQuery<T> {
  select(columns: string): MinimalSupabaseQuery<T>;
  eq(column: string, value: string): MinimalSupabaseQuery<T>;
  maybeSingle(): QueryResult<T>;
}
interface MinimalSupabaseClient {
  from<T>(table: string): MinimalSupabaseQuery<T>;
}

export function useCredits(): CreditsState {
  const { user } = useAuth();
  // Keying on `user?.id` (a primitive) rather than the `user` object means
  // `refresh` only re-creates when the actual signed-in identity changes —
  // not on every Supabase auth event that hands back a new object reference.
  const userId = user?.id ?? null;

  const [balance, setBalance] = useState<number | null>(null);
  const [downloadCredits, setDownloadCredits] = useState<number | null>(null);
  const [tier, setTier] = useState<"pass" | "elite" | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) {
      setBalance(null);
      setDownloadCredits(null);
      setTier(null);
      return;
    }
    setLoading(true);
    try {
      const [creditsRes, subRes] = await Promise.all([
        (supabase as unknown as MinimalSupabaseClient)
          .from<CreditsRow>("portraits_credits")
          .select("tokens, download_credits")
          .eq("account_id", userId)
          .maybeSingle(),
        (supabase as unknown as MinimalSupabaseClient)
          .from<SubscriptionRow>("portraits_subscriptions")
          .select("tier, status")
          .eq("account_id", userId)
          .eq("status", "active")
          .maybeSingle(),
      ]);
      setBalance(creditsRes.data?.tokens ?? 0);
      setDownloadCredits(creditsRes.data?.download_credits ?? 0);
      setTier(subRes.data?.tier ?? null);
    } catch {
      setBalance(null);
      setDownloadCredits(null);
      setTier(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { balance, downloadCredits, tier, loading, refresh };
}
