/**
 * StudioFlow — the inline configurator (photo → style → prompt → generate → pick → buy).
 *
 * Rendered both on /portraits (inline section) and /portraits/studio (full page).
 * Editorial / commercial polish per design tokens (rose CTA, refined cards,
 * generous spacing, numbered steps, Cormorant italic for emotional accents).
 *
 * State machine:
 *   no photo                              → step 1 (upload)
 *   photo, no style/theme picked          → step 2 (pick)
 *   photo + picks, not yet generated      → step 3 (generate)
 *   generating                            → loading variants
 *   variants returned                     → step 4 (pick favourite) + step 5 (size + frame) + add to cart
 *   AI service paused                     → fallback
 */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { PetPhotoUpload } from "@/components/portraits/PetPhotoUpload";
import { StyleThemePicker } from "@/components/portraits/styles/StyleThemePicker";
import { VariantGallery, type Variant } from "@/components/portraits/styles/VariantGallery";
import { getStyle, getTheme } from "@/components/portraits/styles/styleTheme";
import { useAuth } from "@/contexts/AuthContext";
import { useCredits } from "@/components/portraits/useCredits";
import { savePetPhoto, loadPetPhoto, clearPetPhoto } from "@/components/portraits/photoSharing";
import {
  PRODUCTS,
  resolveVariant,
  formatPrice,
  type AnySizeKey,
} from "@/components/portraits/productLineup";
import { buildCartItem, type CartItem } from "@/components/portraits/cart";
import { PALETTE, display, cormorantItalic, eyebrow, EASE, MOTION } from "@/components/portraits/tokens";

interface StudioFlowProps {
  onCartAdd: (item: CartItem) => void;
}

// Numbered step header — used above each step section.
function StepHeader({ n, title, sub }: { n: string; title: string; sub?: string }) {
  return (
    <div className="flex items-baseline gap-3 mb-5">
      <span
        className="font-semibold tabular-nums"
        style={{
          fontFamily: 'Asap, system-ui, sans-serif',
          fontSize: 14,
          color: PALETTE.rose,
          letterSpacing: "0.04em",
        }}
      >
        {n}
      </span>
      <div className="flex-1">
        <h3 style={{ ...display("22px"), color: PALETTE.ink, marginBottom: sub ? 4 : 0 }}>
          {title}
        </h3>
        {sub && (
          <p style={{ ...cormorantItalic("16px"), color: PALETTE.earth, marginTop: 2 }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

const sectionMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: MOTION.base / 1000, ease: EASE.out },
} as const;

export function StudioFlow({ onCartAdd }: StudioFlowProps) {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { balance, tier, refresh: refreshCredits } = useCredits();

  const [photoUrl, setPhotoUrlState] = useState<string | null>(() => loadPetPhoto());
  const setPhotoUrl = (url: string | null) => {
    setPhotoUrlState(url);
    if (url) savePetPhoto(url); else clearPetPhoto();
  };
  const [styleId, setStyleId] = useState<string | null>(null);
  const [themeId, setThemeId] = useState<string | null>(null);
  const [addDetails, setAddDetails] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedVariantUrl, setSelectedVariantUrl] = useState<string | null>(null);
  const [aiPaused, setAiPaused] = useState(false);

  // Canvas-only product. Frame color reserved for v2 (currently Black only on
  // the default Printful catalog mapping).
  const productType = "framed-canvas" as const;
  const product = PRODUCTS[productType];
  const [sizeKey, setSizeKey] = useState<AnySizeKey>(product.defaultSizeKey);

  const variant = resolveVariant(productType, sizeKey);
  const canGenerate = !!photoUrl && !!styleId && !!themeId && !generating;
  const canAdd = !!selectedVariantUrl && !!variant && !!photoUrl && !!styleId && !!themeId;

  async function handleGenerate() {
    if (!photoUrl || !styleId || !themeId) return;
    if (!user || !session?.access_token) {
      toast("Sign in to generate — 3 free portraits on us.", { duration: 2200 });
      setTimeout(() => navigate(`/auth?next=${encodeURIComponent("/portraits#studio")}`), 800);
      return;
    }
    setGenerating(true);
    setVariants([]);
    setSelectedVariantUrl(null);
    setAiPaused(false);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 60000);
    try {
      const res = await fetch("/api/portraits?action=generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ imageUrl: photoUrl, styleId, themeId, addDetails }),
        signal: ctrl.signal,
      });
      const data = await res.json();
      if (res.status === 402) {
        toast.error("Out of credits. Top up to keep going.");
        navigate("/unlimited");
        return;
      }
      if (res.status === 503 && data.error === "ai-service-paused") {
        setAiPaused(true);
        toast.error(data.message ?? "AI service is briefly paused — try again in a moment.");
        refreshCredits();
        return;
      }
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setVariants(data.variants);
      if (data.variants[0]) setSelectedVariantUrl(data.variants[0].url);
      refreshCredits();
    } catch (e) {
      const err = e as Error;
      toast.error(err.name === "AbortError" ? "Generation timed out — please try again." : err.message);
    } finally {
      clearTimeout(timer);
      setGenerating(false);
    }
  }

  function handleAdd() {
    if (!selectedVariantUrl || !variant || !photoUrl || !styleId || !themeId) return;
    const style = getStyle(styleId);
    const theme = getTheme(themeId);
    if (!style || !theme) return;
    const item = buildCartItem({
      kind: "ai",
      productType,
      sizeKey,
      packId: `${styleId}__${themeId}`,
      packName: `${style.label} × ${theme.label}`,
      style: "photographic",
      sourcePhotoUrl: photoUrl,
      previewUrl: selectedVariantUrl,
      soulEdition: false,
      soulEditionPriceMajor: 40,
      variant,
      id: crypto.randomUUID(),
    });
    onCartAdd(item);
    toast.success(`${style.label} × ${theme.label} added to cart`);
  }

  // Auto-scroll to next step as state advances
  useEffect(() => {
    if (variants.length > 0) {
      const el = document.getElementById("studio-step-pick");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [variants.length]);

  return (
    <section
      id="studio"
      className="relative px-5 md:px-8"
      style={{
        background: PALETTE.cream2,
        paddingTop: "clamp(72px, 9vh, 120px)",
        paddingBottom: "clamp(72px, 9vh, 120px)",
        borderTop: `1px solid ${PALETTE.sand}`,
      }}
      aria-labelledby="studio-heading"
    >
      <div className="mx-auto" style={{ maxWidth: 920 }}>
        {/* ── Section header ──────────────────────────────────────────── */}
        <div className="text-center mb-12">
          <p style={eyebrow(PALETTE.earthMuted)}>The Studio</p>
          <h2
            id="studio-heading"
            style={{
              ...display("clamp(34px, 4.4vw, 52px)"),
              color: PALETTE.ink,
              marginTop: 14,
              marginBottom: 18,
            }}
          >
            Begin their portrait
          </h2>
          <p
            style={{
              ...cormorantItalic("clamp(17px, 2vw, 21px)"),
              color: PALETTE.earth,
              maxWidth: 580,
              margin: "0 auto",
            }}
          >
            Three quiet steps. Three free attempts with sign-up. Then a museum-quality framed canvas, printed and shipped to you.
          </p>

          {/* Credit / signup hint */}
          <div
            className="mt-7 inline-flex items-center gap-2 px-5 py-2 rounded-full"
            style={{
              background: PALETTE.cream,
              border: `1px solid ${PALETTE.sand}`,
              color: PALETTE.earth,
              fontSize: 13,
              fontFamily: 'Assistant, system-ui, sans-serif',
            }}
          >
            {user ? (
              <>
                <span>
                  <strong style={{ color: PALETTE.ink }}>{balance ?? "…"}</strong> credits left
                </span>
                {tier && <span style={{ color: PALETTE.earthMuted }}>· {tier === "elite" ? "Elite" : "Pass"}</span>}
                <Link to="/unlimited" className="ml-2" style={{ color: PALETTE.rose, fontWeight: 600 }}>
                  Top up →
                </Link>
              </>
            ) : (
              <>
                <span>3 free portraits with sign-up — then £4.99 for 5 more.</span>
                <Link
                  to={`/auth?next=${encodeURIComponent("/portraits#studio")}`}
                  className="ml-1"
                  style={{ color: PALETTE.rose, fontWeight: 600 }}
                >
                  Sign in →
                </Link>
              </>
            )}
          </div>
        </div>

        {/* ── Step 1 — Upload ─────────────────────────────────────────── */}
        <motion.div {...sectionMotion} className="mb-12">
          <div
            className="rounded-sm p-7 md:p-9"
            style={{
              background: PALETTE.cream,
              border: `1px solid ${PALETTE.sand}`,
              boxShadow: "0 14px 32px rgba(20, 18, 16, 0.04)",
            }}
          >
            <StepHeader n="01" title="Upload their photo" sub="A clear face-on photo with good light works best." />
            <PetPhotoUpload
              photoUrl={photoUrl}
              onUploaded={setPhotoUrl}
              onReset={() => {
                setPhotoUrl(null);
                setVariants([]);
                setSelectedVariantUrl(null);
                setStyleId(null);
                setThemeId(null);
              }}
            />
          </div>
        </motion.div>

        {/* ── Step 2 + 3 — Style/Theme + prompt + Generate ────────────── */}
        <AnimatePresence>
          {photoUrl && (
            <motion.div key="step2" {...sectionMotion} className="mb-12">
              <div
                className="rounded-sm p-7 md:p-9"
                style={{
                  background: PALETTE.cream,
                  border: `1px solid ${PALETTE.sand}`,
                  boxShadow: "0 14px 32px rgba(20, 18, 16, 0.04)",
                }}
              >
                <StepHeader
                  n="02"
                  title="Choose the look"
                  sub="Pick a Style and a World. Add a short note if you want — keep it simple, like talking to a friend."
                />
                <StyleThemePicker
                  styleId={styleId}
                  themeId={themeId}
                  addDetails={addDetails}
                  onStyleChange={setStyleId}
                  onThemeChange={setThemeId}
                  onAddDetailsChange={setAddDetails}
                />
              </div>

              {/* Generate CTA card */}
              <div className="mt-6 text-center">
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="px-9 py-4 rounded-sm transition-all disabled:opacity-40"
                  style={{
                    background: PALETTE.rose,
                    color: PALETTE.cream,
                    fontFamily: 'Asap, system-ui, sans-serif',
                    fontSize: 15,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    boxShadow: canGenerate
                      ? "0 18px 48px rgba(191, 82, 74, 0.32)"
                      : "0 6px 18px rgba(191, 82, 74, 0.12)",
                  }}
                >
                  {generating ? "Painting their portrait…" : "Generate 4 portraits →"}
                </button>
                <p
                  className="mt-4"
                  style={{
                    ...cormorantItalic("15px"),
                    color: PALETTE.earthMuted,
                  }}
                >
                  ~10 seconds. Each generation makes 4 versions to choose from.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Step 4 + 5 — Pick variant + size + add to cart ──────────── */}
        <div id="studio-step-pick" />
        <AnimatePresence>
          {generating && (
            <motion.div
              key="loading"
              {...sectionMotion}
              className="rounded-sm p-12 text-center"
              style={{ background: PALETTE.cream, border: `1px solid ${PALETTE.sand}` }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                className="w-9 h-9 mx-auto rounded-full border-2"
                style={{ borderColor: PALETTE.rose, borderTopColor: "transparent" }}
              />
              <p style={{ ...cormorantItalic("20px"), color: PALETTE.earth, marginTop: 18 }}>
                Painting their portrait in four different worlds…
              </p>
            </motion.div>
          )}

          {!generating && variants.length > 0 && (
            <motion.div key="step4" {...sectionMotion} className="mb-12">
              <div
                className="rounded-sm p-7 md:p-9"
                style={{
                  background: PALETTE.cream,
                  border: `1px solid ${PALETTE.sand}`,
                  boxShadow: "0 14px 32px rgba(20, 18, 16, 0.04)",
                }}
              >
                <StepHeader n="03" title="Pick your favourite" sub="Tap to select. This is what we'll print." />
                <VariantGallery
                  variants={variants}
                  selectedUrl={selectedVariantUrl}
                  onSelect={setSelectedVariantUrl}
                />
              </div>

              <div
                className="rounded-sm p-7 md:p-9 mt-6"
                style={{
                  background: PALETTE.cream,
                  border: `1px solid ${PALETTE.sand}`,
                  boxShadow: "0 14px 32px rgba(20, 18, 16, 0.04)",
                }}
              >
                <StepHeader n="04" title="Choose your canvas" sub="Museum-quality framed canvas, ships in 3-5 days." />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.entries(product.variants).map(([key, v]) => {
                    if (!v) return null;
                    const active = sizeKey === key;
                    const isHero = product.heroSizeKey === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setSizeKey(key as AnySizeKey)}
                        className="rounded-sm p-4 text-left relative transition-all"
                        style={{
                          background: active ? PALETTE.ink : PALETTE.cream,
                          color: active ? PALETTE.cream : PALETTE.ink,
                          border: active
                            ? `1px solid ${PALETTE.ink}`
                            : isHero
                              ? `1px solid ${PALETTE.gold}`
                              : `1px solid ${PALETTE.sandDeep}`,
                        }}
                      >
                        {isHero && !active && (
                          <span
                            className="absolute -top-2 left-3 px-2"
                            style={{
                              ...eyebrow(PALETTE.gold),
                              fontSize: 9.5,
                              background: PALETTE.cream,
                              letterSpacing: "0.18em",
                            }}
                          >
                            Most loved
                          </span>
                        )}
                        <div style={{ ...display("18px"), color: active ? PALETTE.cream : PALETTE.ink }}>
                          {v.sizeLabel}
                        </div>
                        <div
                          className="mt-1 tabular-nums"
                          style={{
                            fontFamily: 'Asap, system-ui, sans-serif',
                            fontSize: 14,
                            color: active ? PALETTE.cream : PALETTE.earthMuted,
                          }}
                        >
                          {formatPrice(v.priceMajor)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-7 text-center">
                <button
                  onClick={handleAdd}
                  disabled={!canAdd}
                  className="px-10 py-4 rounded-sm transition-all disabled:opacity-40"
                  style={{
                    background: PALETTE.ink,
                    color: PALETTE.cream,
                    fontFamily: 'Asap, system-ui, sans-serif',
                    fontSize: 15,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    boxShadow: canAdd
                      ? "0 18px 48px rgba(20, 18, 16, 0.18)"
                      : "0 6px 18px rgba(20, 18, 16, 0.06)",
                  }}
                >
                  Add to cart {variant ? `· ${formatPrice(variant.priceMajor)}` : ""}
                </button>
              </div>
            </motion.div>
          )}

          {aiPaused && (
            <motion.div
              key="paused"
              {...sectionMotion}
              className="rounded-sm p-9 text-center"
              style={{ background: PALETTE.cream, border: `1px solid ${PALETTE.sand}` }}
            >
              <p style={{ ...display("22px"), color: PALETTE.ink }}>
                AI is briefly paused
              </p>
              <p style={{ ...cormorantItalic("17px"), color: PALETTE.earth, marginTop: 8 }}>
                Your credit wasn't charged. Try again in a moment.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
