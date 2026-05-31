import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { MessageCircle, Sparkles, ArrowRight } from "lucide-react";
import { NoIndex } from "@/components/NoIndex";

interface PetRow {
  id: string;
  pet_name: string;
  species: string | null;
  breed: string | null;
  pet_photo_url: string | null;
  share_token: string | null;
  occasion_mode: string | null;
}

const grainStyle: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
};

/**
 * SoulSpeak Household Hub — shows every pet the authenticated user owns with
 * a tile that launches the existing per-pet chat. Shared credit balance sits
 * at the top so a multi-pet buyer sees it applies across the whole family.
 */
export default function SoulSpeakHub() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [pets, setPets] = useState<PetRow[]>([]);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth?redirect=/chat");
      return;
    }

    const email = (user.email || "").toLowerCase();

    (async () => {
      try {
        // Pets paid for by this user — link by email (pre-auth purchases) OR
        // user_id (auth-linked). Mirrors customer-data's lookup shape.
        const { data: reportRows } = await supabase
          .from("pet_reports")
          .select("id, pet_name, species, breed, pet_photo_url, share_token, occasion_mode")
          .or(`email.eq.${email},user_id.eq.${user.id}`)
          .eq("payment_status", "paid")
          .order("created_at", { ascending: true });
        setPets((reportRows ?? []) as PetRow[]);

        const { data: pooledRow } = await supabase
          .from("chat_credits")
          .select("credits_remaining, is_unlimited")
          .eq("email", email)
          .is("order_id", null)
          .maybeSingle();
        if (pooledRow) {
          setIsUnlimited(!!pooledRow.is_unlimited);
          setCreditsRemaining(pooledRow.credits_remaining ?? 0);
        }
      } finally {
        setFetching(false);
      }
    })();
  }, [user, loading, navigate]);

  const messagesLeft = isUnlimited
    ? Infinity
    : creditsRemaining !== null
      ? Math.floor(creditsRemaining / 50)
      : null;

  return (
    <div
      className="min-h-screen"
      style={{
        background: "#0d0a14",
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        ...grainStyle,
      }}
    >
      <NoIndex />
      <div className="max-w-[720px] mx-auto px-5 py-10 md:py-14">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <p className="text-[0.68rem] uppercase tracking-[0.18em] mb-2" style={{ color: "#d4b67a", fontFamily: "\"Playfair Display\", Georgia, serif", fontVariant: "small-caps" }}>
            ✦ SoulSpeak · Household
          </p>
          <h1 className="text-[1.9rem] md:text-[2.4rem] leading-tight mb-2" style={{ fontFamily: "\"Playfair Display\", Georgia, serif", color: "#f5efe6" }}>
            Who do you want to talk to today?
          </h1>
          <p className="text-[0.98rem] italic" style={{ color: "#cfc1b1", fontFamily: "\"Playfair Display\", Georgia, serif" }}>
            Pick any of your pets — the conversation picks up exactly where you left it.
          </p>
        </motion.div>

        {/* Shared credits banner */}
        {messagesLeft !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8 rounded-[16px] p-4 flex items-center justify-between"
            style={{
              background: "rgba(245,239,230,0.05)",
              border: "1px solid rgba(212,182,122,0.22)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #d4b67a, #f0d99f)" }}>
                <Sparkles className="w-4 h-4" style={{ color: "#141210" }} />
              </div>
              <div>
                <div className="text-[0.62rem] uppercase tracking-wider font-semibold" style={{ color: "#d4b67a" }}>
                  Shared across all your pets
                </div>
                <div className="text-[1.05rem]" style={{ fontFamily: "\"Playfair Display\", Georgia, serif", color: "#f5efe6" }}>
                  {isUnlimited ? "Unlimited messages" : `${messagesLeft} message${messagesLeft === 1 ? "" : "s"} left`}
                </div>
              </div>
            </div>
            {!isUnlimited && pets.length > 0 && (
              <a
                href={`/soul-chat.html?id=${pets[0].id}${pets[0].share_token ? `&token=${pets[0].share_token}` : ""}&topup=1`}
                className="text-[0.82rem] underline-offset-4 hover:underline"
                style={{ color: "#d4b67a", fontFamily: "\"Playfair Display\", Georgia, serif" }}
              >
                Top up
              </a>
            )}
          </motion.div>
        )}

        {/* Pet grid */}
        {fetching ? (
          <div className="text-center py-12" style={{ color: "#9d8d7f" }}>Loading your pets…</div>
        ) : pets.length === 0 ? (
          <div className="text-center py-12 rounded-[16px]"
            style={{ background: "rgba(245,239,230,0.05)", border: "1px solid rgba(212,182,122,0.22)" }}>
            <MessageCircle className="w-10 h-10 mx-auto mb-3" style={{ color: "#d4b67a" }} />
            <p className="mb-2" style={{ color: "#f5efe6", fontFamily: "\"Playfair Display\", Georgia, serif", fontSize: "1.05rem" }}>
              No pets yet
            </p>
            <p className="text-sm max-w-xs mx-auto mb-5" style={{ color: "#9d8d7f" }}>
              Once you've unlocked a reading, your pet's soul lives in here.
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
              style={{ background: "#d4b67a", color: "#141210", border: "none", borderRadius: "10px" }}
            >
              Begin a reading
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {pets.map((p, i) => {
              const isMemorial = p.occasion_mode === "memorial";
              return (
                <motion.a
                  key={p.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  href={`/soul-chat.html?id=${p.id}${p.share_token ? `&token=${p.share_token}` : ""}`}
                  className="relative group p-5 rounded-[18px] flex items-center gap-4 transition-all hover:shadow-lg no-underline"
                  style={{ background: "rgba(245,239,230,0.05)", border: "1px solid rgba(212,182,122,0.22)" }}
                >
                  <div
                    className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, rgba(212,182,122,0.25), rgba(212,182,122,0.12))", border: "2.5px solid #d4b67a" }}
                  >
                    {p.pet_photo_url ? (
                      <img src={p.pet_photo_url} alt={p.pet_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[1.4rem]">🐾</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[1.15rem] truncate"
                      style={{ fontFamily: "\"Playfair Display\", Georgia, serif", color: "#f5efe6" }}>
                      {p.pet_name}
                    </h3>
                    <p className="text-[0.82rem] truncate" style={{ color: "#cfc1b1", fontFamily: "\"Playfair Display\", Georgia, serif" }}>
                      {p.species}{p.breed ? ` · ${p.breed}` : ""}
                    </p>
                    {isMemorial && (
                      <p className="text-[0.7rem] italic mt-0.5" style={{ color: "#d4b67a" }}>
                        Memorial — speaking across the veil
                      </p>
                    )}
                  </div>
                  <ArrowRight className="w-5 h-5 shrink-0 transition-transform group-hover:translate-x-1" style={{ color: "#d4b67a" }} />
                </motion.a>
              );
            })}
          </div>
        )}

        <div className="mt-10 text-center">
          <button
            onClick={() => navigate("/account")}
            className="text-[0.85rem] underline-offset-4 hover:underline"
            style={{ color: "#9d8d7f", fontFamily: "\"Playfair Display\", Georgia, serif" }}
          >
            ← Back to your account
          </button>
        </div>
      </div>
    </div>
  );
}
