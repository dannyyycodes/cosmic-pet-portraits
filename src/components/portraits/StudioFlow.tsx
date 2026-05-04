/**
 * StudioFlow — sleek single-prompt configurator.
 *
 * App aesthetic, not editorial. Strip text. One big prompt input as the
 * centerpiece. Rotating typewriter placeholder. "?" icon expands guidance.
 * Photo upload above. After generate → variant grid + size + add to cart.
 *
 * Pipeline:
 *   imageUrl + customPrompt → /api/portraits?action=generate (auth-gated)
 *   → 4 fal Kontext variants → pick one → choose canvas size → cart.
 */
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { PetPhotoUpload } from "@/components/portraits/PetPhotoUpload";
import { VariantGallery, type Variant } from "@/components/portraits/styles/VariantGallery";
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
import { PALETTE, EASE, MOTION } from "@/components/portraits/tokens";

interface StudioFlowProps {
  onCartAdd: (item: CartItem) => void;
}

const PROMPT_EXAMPLES = [
  "a regal Renaissance king with velvet robes and a gold crown",
  "an astronaut floating among glowing stars",
  "a wizard in a candlelit library, robes of midnight blue",
  "a 1920s underworld boss with cigar smoke and pinstripes",
  "the centre of a luminous cosmic birth-chart wheel",
  "a Pixar-style hero with big expressive eyes",
  "a watercolour portrait in the style of an old children's book",
  "a galaxy smuggler in a worn leather flight jacket",
];

// Typewriter effect for the placeholder — types one example, pauses,
// deletes, types the next. Apple-homepage-style.
function useTypewriterPlaceholder(examples: string[], paused: boolean): string {
  const [text, setText] = useState("");
  const [exampleIdx, setExampleIdx] = useState(0);
  const [phase, setPhase] = useState<"typing" | "holding" | "deleting">("typing");

  useEffect(() => {
    if (paused) return;
    const current = examples[exampleIdx];
    let timeout: ReturnType<typeof setTimeout>;
    if (phase === "typing") {
      if (text.length < current.length) {
        timeout = setTimeout(() => setText(current.slice(0, text.length + 1)), 35);
      } else {
        timeout = setTimeout(() => setPhase("holding"), 1800);
      }
    } else if (phase === "holding") {
      timeout = setTimeout(() => setPhase("deleting"), 0);
    } else {
      if (text.length > 0) {
        timeout = setTimeout(() => setText(text.slice(0, -1)), 18);
      } else {
        setExampleIdx((idx) => (idx + 1) % examples.length);
        setPhase("typing");
      }
    }
    return () => clearTimeout(timeout);
  }, [text, phase, exampleIdx, examples, paused]);

  return text;
}

export function StudioFlow({ onCartAdd }: StudioFlowProps) {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { balance, refresh: refreshCredits } = useCredits();

  const [photoUrl, setPhotoUrlState] = useState<string | null>(() => loadPetPhoto());
  const setPhotoUrl = (url: string | null) => {
    setPhotoUrlState(url);
    if (url) savePetPhoto(url); else clearPetPhoto();
  };
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedVariantUrl, setSelectedVariantUrl] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const productType = "framed-canvas" as const;
  const product = PRODUCTS[productType];
  const [sizeKey, setSizeKey] = useState<AnySizeKey>(product.defaultSizeKey);

  const variant = resolveVariant(productType, sizeKey);
  const placeholder = useTypewriterPlaceholder(PROMPT_EXAMPLES, prompt.length > 0);
  const canGenerate = !!photoUrl && prompt.trim().length > 3 && !generating;
  const canAdd = !!selectedVariantUrl && !!variant && !!photoUrl;

  const variantsRef = useRef<HTMLDivElement>(null);

  async function handleGenerate() {
    if (!photoUrl || prompt.trim().length < 4) return;
    if (!user || !session?.access_token) {
      toast("Sign in to generate — 3 free portraits on us.", { duration: 2200 });
      setTimeout(() => navigate(`/auth?next=${encodeURIComponent("/portraits#studio")}`), 800);
      return;
    }
    setGenerating(true);
    setVariants([]);
    setSelectedVariantUrl(null);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 60000);
    try {
      const res = await fetch("/api/portraits?action=generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ imageUrl: photoUrl, customPrompt: prompt.trim() }),
        signal: ctrl.signal,
      });
      const data = await res.json();
      if (res.status === 402) {
        toast.error("Out of credits. Top up to keep going.");
        navigate("/unlimited");
        return;
      }
      if (res.status === 503 && data.error === "ai-service-paused") {
        toast.error(data.message ?? "AI is briefly paused — try again in a moment.");
        refreshCredits();
        return;
      }
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setVariants(data.variants);
      if (data.variants[0]) setSelectedVariantUrl(data.variants[0].url);
      refreshCredits();
      requestAnimationFrame(() => variantsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (e) {
      const err = e as Error;
      toast.error(err.name === "AbortError" ? "Took too long — please try again." : err.message);
    } finally {
      clearTimeout(timer);
      setGenerating(false);
    }
  }

  function handleAdd() {
    if (!selectedVariantUrl || !variant || !photoUrl) return;
    const item = buildCartItem({
      kind: "ai",
      productType,
      sizeKey,
      packId: "custom-prompt",
      packName: prompt.trim().slice(0, 60),
      style: "photographic",
      sourcePhotoUrl: photoUrl,
      previewUrl: selectedVariantUrl,
      soulEdition: false,
      soulEditionPriceMajor: 40,
      variant,
      id: crypto.randomUUID(),
    });
    onCartAdd(item);
    toast.success("Added to cart");
  }

  const sectionTransition = { duration: MOTION.base / 1000, ease: EASE.out };

  return (
    <section
      id="studio"
      className="relative px-4 md:px-8"
      style={{
        background: PALETTE.cream2,
        paddingTop: "clamp(64px, 8vh, 96px)",
        paddingBottom: "clamp(64px, 8vh, 96px)",
        borderTop: `1px solid ${PALETTE.sand}`,
      }}
    >
      <div className="mx-auto" style={{ maxWidth: 720 }}>

        {/* ── Photo upload (compact) ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={sectionTransition}
        >
          <PetPhotoUpload
            photoUrl={photoUrl}
            onUploaded={setPhotoUrl}
            onReset={() => {
              setPhotoUrl(null);
              setVariants([]);
              setSelectedVariantUrl(null);
              setPrompt("");
            }}
          />
        </motion.div>

        {/* ── Prompt box (the centerpiece) ─────────────────────────── */}
        <AnimatePresence>
          {photoUrl && (
            <motion.div
              key="prompt"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={sectionTransition}
              className="mt-6"
            >
              <div
                className="relative rounded-xl"
                style={{
                  background: PALETTE.cream,
                  border: `1px solid ${PALETTE.sandDeep}`,
                  boxShadow: "0 12px 32px rgba(20, 18, 16, 0.06)",
                  transition: "border-color 200ms",
                }}
              >
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value.slice(0, 400))}
                  placeholder={placeholder + (prompt.length === 0 ? "▎" : "")}
                  rows={3}
                  className="w-full resize-none bg-transparent outline-none px-5 pt-5 pb-2"
                  style={{
                    fontFamily: 'Assistant, system-ui, sans-serif',
                    fontSize: 16,
                    color: PALETTE.ink,
                    lineHeight: 1.55,
                  }}
                />
                <div className="flex items-center justify-between px-3 pb-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setHelpOpen((v) => !v)}
                    aria-expanded={helpOpen}
                    className="flex items-center justify-center w-7 h-7 rounded-full transition-colors"
                    style={{
                      background: helpOpen ? PALETTE.paper : "transparent",
                      color: PALETTE.earthMuted,
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: 'Asap, system-ui, sans-serif',
                      border: `1px solid ${PALETTE.sand}`,
                    }}
                    title="How to write a good prompt"
                  >
                    ?
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                    className="rounded-lg px-5 py-2.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{
                      background: PALETTE.rose,
                      color: PALETTE.cream,
                      fontFamily: 'Asap, system-ui, sans-serif',
                      fontSize: 14,
                      fontWeight: 600,
                      letterSpacing: "0.02em",
                      boxShadow: canGenerate ? "0 8px 22px rgba(191, 82, 74, 0.28)" : "none",
                    }}
                  >
                    {generating ? "Generating…" : "Generate ↑"}
                  </button>
                </div>
              </div>

              {/* Help expansion */}
              <AnimatePresence initial={false}>
                {helpOpen && (
                  <motion.div
                    key="help"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: EASE.out }}
                    className="overflow-hidden mt-2"
                  >
                    <div
                      className="rounded-xl px-5 py-4"
                      style={{
                        background: PALETTE.paper,
                        border: `1px solid ${PALETTE.sand}`,
                        fontFamily: 'Assistant, system-ui, sans-serif',
                        fontSize: 14,
                        color: PALETTE.earth,
                      }}
                    >
                      <p style={{ marginBottom: 10, color: PALETTE.ink, fontWeight: 600 }}>
                        How to write a good prompt
                      </p>
                      <p style={{ marginBottom: 10, lineHeight: 1.55 }}>
                        Describe how you want your pet shown. Costume, scene, mood — keep it simple, like talking to a friend.
                      </p>
                      <p style={{ marginBottom: 6, color: PALETTE.earthMuted, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        Tap to use:
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {PROMPT_EXAMPLES.slice(0, 5).map((ex) => (
                          <button
                            key={ex}
                            type="button"
                            onClick={() => { setPrompt(ex); setHelpOpen(false); }}
                            className="text-left rounded-md px-3 py-2 transition-colors"
                            style={{
                              background: PALETTE.cream,
                              border: `1px solid ${PALETTE.sand}`,
                              color: PALETTE.ink,
                              fontSize: 13.5,
                            }}
                          >
                            {ex}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* credit hint */}
              <p
                className="mt-3 text-center"
                style={{
                  fontFamily: 'Assistant, system-ui, sans-serif',
                  fontSize: 12.5,
                  color: PALETTE.earthMuted,
                }}
              >
                {user
                  ? <>
                      <strong style={{ color: PALETTE.ink }}>{balance ?? "…"}</strong> credit{(balance ?? 0) === 1 ? "" : "s"} left
                      <span> · </span>
                      <Link to="/unlimited" style={{ color: PALETTE.rose, fontWeight: 600 }}>Top up</Link>
                    </>
                  : <>
                      3 free with sign-up · then £4.99 / pack
                      <span> · </span>
                      <Link
                        to={`/auth?next=${encodeURIComponent("/portraits#studio")}`}
                        style={{ color: PALETTE.rose, fontWeight: 600 }}
                      >
                        Sign in
                      </Link>
                    </>}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Variants + size + cart ───────────────────────────────── */}
        <div ref={variantsRef} />
        <AnimatePresence>
          {generating && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-10 rounded-xl py-12 text-center"
              style={{ background: PALETTE.cream, border: `1px solid ${PALETTE.sand}` }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 mx-auto rounded-full border-2"
                style={{ borderColor: PALETTE.rose, borderTopColor: "transparent" }}
              />
              <p
                className="mt-4"
                style={{
                  fontFamily: 'Assistant, system-ui, sans-serif',
                  fontSize: 13.5,
                  color: PALETTE.earthMuted,
                }}
              >
                Generating four versions… ~10 seconds
              </p>
            </motion.div>
          )}

          {!generating && variants.length > 0 && (
            <motion.div
              key="variants"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={sectionTransition}
              className="mt-10"
            >
              <VariantGallery
                variants={variants}
                selectedUrl={selectedVariantUrl}
                onSelect={setSelectedVariantUrl}
              />

              {/* Size selector */}
              <div className="grid grid-cols-3 gap-2 mt-6">
                {Object.entries(product.variants).map(([key, v]) => {
                  if (!v) return null;
                  const active = sizeKey === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSizeKey(key as AnySizeKey)}
                      className="rounded-lg p-3 text-center transition-all"
                      style={{
                        background: active ? PALETTE.ink : PALETTE.cream,
                        color: active ? PALETTE.cream : PALETTE.ink,
                        border: active ? `1px solid ${PALETTE.ink}` : `1px solid ${PALETTE.sandDeep}`,
                        fontFamily: 'Asap, system-ui, sans-serif',
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{v.sizeLabel}</div>
                      <div
                        className="tabular-nums mt-0.5"
                        style={{
                          fontSize: 12,
                          color: active ? PALETTE.cream : PALETTE.earthMuted,
                        }}
                      >
                        {formatPrice(v.priceMajor)}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleAdd}
                disabled={!canAdd}
                className="mt-5 w-full rounded-lg py-3.5 transition-all disabled:opacity-40"
                style={{
                  background: PALETTE.ink,
                  color: PALETTE.cream,
                  fontFamily: 'Asap, system-ui, sans-serif',
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                }}
              >
                Add to cart {variant ? `· ${formatPrice(variant.priceMajor)}` : ""}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
