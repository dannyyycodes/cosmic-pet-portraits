/**
 * StudioFlow — sleek single-prompt configurator (premium app aesthetic).
 *
 * Layout:
 *   credits badge → photo upload → premium prompt box → variants/size/cart
 *
 * Premium prompt box:
 *   - glass surface with multi-layer shadow + rose-accent focus ring
 *   - rounded-2xl, generous padding, refined typography
 *   - typewriter placeholder cycles 8 examples (char-by-char)
 *   - HelpCircle "?" icon expands inline guidance
 *   - ArrowUp send button (Midjourney/v0/ChatGPT pattern)
 *
 * Auth gate:
 *   - frictionless inline Dialog instead of route-leaving redirect
 *   - "Continue with Google" + "Continue with Apple" + email fallback
 *
 * API:
 *   POST /api/portraits?action=generate { imageUrl, customPrompt }
 *   → 4 fal Kontext variants → pick one → choose size → add to cart
 */
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ArrowUp, HelpCircle, Sparkles, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
import { supabase } from "@/integrations/supabase/client";
import { isDisposableEmail } from "@/lib/auth/disposableEmailDomains";
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

// Typewriter placeholder — types one example, holds, deletes, types next.
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

// ── Inline sign-in dialog ─────────────────────────────────────────────────
function SignInDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    if (isDisposableEmail(email)) {
      toast.error("Please use a real email address — that one's a temporary inbox.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/portraits#studio` },
      });
      if (error) throw error;
      setSent(true);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          // Reset on close so the next open is fresh.
          setTimeout(() => { setEmail(""); setSent(false); }, 200);
        }
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-[420px] p-0 overflow-hidden border-0" style={{ background: PALETTE.cream, borderRadius: 20 }}>
        <DialogTitle className="sr-only">Sign in to generate</DialogTitle>
        <DialogDescription className="sr-only">
          Get a one-tap sign-in link in your inbox. No password needed.
        </DialogDescription>

        <div className="px-7 pt-8 pb-6 text-center">
          <div
            className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4"
            style={{ background: PALETTE.roseSoft }}
          >
            <Sparkles className="w-5 h-5" style={{ color: PALETTE.rose }} />
          </div>
          <h2 style={{ fontFamily: 'Asap, system-ui, sans-serif', fontSize: 22, fontWeight: 700, color: PALETTE.ink, letterSpacing: "-0.02em" }}>
            {sent ? "Check your inbox" : "3 free portraits"}
          </h2>
          <p
            className="mx-auto"
            style={{
              fontFamily: 'Assistant, system-ui, sans-serif',
              fontSize: 14,
              color: PALETTE.earthMuted,
              marginTop: 6,
              maxWidth: 320,
              lineHeight: 1.5,
            }}
          >
            {sent ? (
              <>We sent a sign-in link to <strong style={{ color: PALETTE.ink }}>{email}</strong>. Open it on this device and you're in — no password needed.</>
            ) : (
              <>One-tap sign in. Enter your email and we'll send a sign-in link. No password to remember.</>
            )}
          </p>
        </div>

        <div className="px-7 pb-7">
          {!sent ? (
            <form onSubmit={handleMagicLink} className="space-y-2.5">
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full rounded-xl px-4 py-3.5 outline-none transition-colors focus:border-[var(--rose)]"
                style={{
                  background: "#fff",
                  border: `1px solid ${PALETTE.sandDeep}`,
                  color: PALETTE.ink,
                  fontFamily: 'Assistant, system-ui, sans-serif',
                  fontSize: 15,
                  // @ts-expect-error CSS var used by focus
                  "--rose": PALETTE.rose,
                }}
              />
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl py-3.5 transition-all disabled:opacity-50"
                style={{
                  background: PALETTE.rose,
                  color: PALETTE.cream,
                  fontFamily: 'Asap, system-ui, sans-serif',
                  fontSize: 14.5,
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  boxShadow: "0 8px 22px rgba(191, 82, 74, 0.25)",
                }}
              >
                {busy ? "Sending…" : "Email me a sign-in link →"}
              </button>
              <p
                className="text-center pt-2"
                style={{ fontSize: 12, color: PALETTE.earthMuted, fontFamily: 'Assistant, system-ui, sans-serif', lineHeight: 1.5 }}
              >
                We'll never share your email. By continuing you agree to our terms.
              </p>
            </form>
          ) : (
            <div className="space-y-3 text-center">
              <div
                className="mx-auto w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: PALETTE.cream2, border: `1px solid ${PALETTE.sand}` }}
              >
                <span style={{ fontSize: 28 }}>📨</span>
              </div>
              <p style={{ fontFamily: 'Assistant, system-ui, sans-serif', fontSize: 13, color: PALETTE.earthMuted }}>
                The link expires in 1 hour. Didn't get it?{" "}
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  style={{ color: PALETTE.rose, fontWeight: 600 }}
                >
                  Try again
                </button>
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Studio ─────────────────────────────────────────────────────────────────
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
  const [signInOpen, setSignInOpen] = useState(false);
  const [focused, setFocused] = useState(false);

  const productType = "framed-canvas" as const;
  const product = PRODUCTS[productType];
  const [sizeKey, setSizeKey] = useState<AnySizeKey>(product.defaultSizeKey);

  const variant = resolveVariant(productType, sizeKey);
  const placeholder = useTypewriterPlaceholder(PROMPT_EXAMPLES, prompt.length > 0 || focused);
  const canGenerate = !!photoUrl && prompt.trim().length > 3 && !generating;
  const canAdd = !!selectedVariantUrl && !!variant && !!photoUrl;

  const variantsRef = useRef<HTMLDivElement>(null);

  async function handleGenerate() {
    if (!photoUrl || prompt.trim().length < 4) return;
    if (!user || !session?.access_token) {
      setSignInOpen(true);
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
        toast.error(data.message ?? "AI is briefly paused — try again.");
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
  const generationsRemaining = balance != null ? Math.floor(balance / 4) : null;

  return (
    <section
      id="studio"
      className="relative px-4 md:px-8"
      style={{
        background: PALETTE.cream2,
        paddingTop: "clamp(48px, 6vh, 80px)",
        paddingBottom: "clamp(64px, 8vh, 96px)",
        borderTop: `1px solid ${PALETTE.sand}`,
      }}
    >
      <div className="mx-auto" style={{ maxWidth: 720 }}>

        {/* ── Credits / status pill ─────────────────────────────────── */}
        <div className="flex justify-center mb-7">
          {user ? (
            <Link
              to="/unlimited"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full transition-colors"
              style={{
                background: PALETTE.cream,
                border: `1px solid ${PALETTE.sand}`,
                fontFamily: 'Assistant, system-ui, sans-serif',
                fontSize: 13,
                color: PALETTE.earth,
              }}
            >
              <Sparkles className="w-3.5 h-3.5" style={{ color: PALETTE.rose }} />
              <strong style={{ color: PALETTE.ink }}>
                {generationsRemaining != null ? generationsRemaining : "…"}
              </strong>
              {" "}
              generation{generationsRemaining === 1 ? "" : "s"} remaining
              <span style={{ color: PALETTE.earthMuted, marginLeft: 4 }}>· Top up</span>
            </Link>
          ) : (
            <button
              onClick={() => setSignInOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full transition-colors"
              style={{
                background: PALETTE.cream,
                border: `1px solid ${PALETTE.sand}`,
                fontFamily: 'Assistant, system-ui, sans-serif',
                fontSize: 13,
                color: PALETTE.earth,
              }}
            >
              <Sparkles className="w-3.5 h-3.5" style={{ color: PALETTE.rose }} />
              <strong style={{ color: PALETTE.ink }}>3 free portraits</strong>
              <span style={{ color: PALETTE.earthMuted, marginLeft: 4 }}>· Sign in</span>
            </button>
          )}
        </div>

        {/* ── Photo upload ─────────────────────────────────────────── */}
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

        {/* ── Premium prompt box ────────────────────────────────────── */}
        <AnimatePresence>
          {photoUrl && (
            <motion.div
              key="prompt"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={sectionTransition}
              className="mt-7"
            >
              <div
                className="relative"
                style={{
                  background: focused
                    ? `linear-gradient(180deg, #ffffff 0%, ${PALETTE.cream} 100%)`
                    : `linear-gradient(180deg, #ffffff 0%, ${PALETTE.cream2} 100%)`,
                  border: `1.5px solid ${focused ? PALETTE.rose : PALETTE.sandDeep}`,
                  borderRadius: 20,
                  boxShadow: focused
                    ? "0 0 0 4px rgba(191, 82, 74, 0.08), 0 24px 48px rgba(20, 18, 16, 0.10), 0 4px 12px rgba(20, 18, 16, 0.04)"
                    : "0 18px 38px rgba(20, 18, 16, 0.06), 0 2px 6px rgba(20, 18, 16, 0.03)",
                  transition: "box-shadow 240ms, border-color 240ms, background 240ms",
                }}
              >
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value.slice(0, 400))}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder={placeholder + (prompt.length === 0 && !focused ? "▎" : "")}
                  rows={3}
                  className="w-full resize-none bg-transparent outline-none px-6 pt-6 pb-2"
                  style={{
                    fontFamily: 'Assistant, system-ui, sans-serif',
                    fontSize: 17,
                    color: PALETTE.ink,
                    lineHeight: 1.55,
                    letterSpacing: "-0.005em",
                  }}
                />

                <div className="flex items-center justify-between px-3.5 pb-3.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setHelpOpen((v) => !v)}
                    aria-expanded={helpOpen}
                    aria-label="How to write a good prompt"
                    className="flex items-center justify-center w-9 h-9 rounded-full transition-all hover:bg-black/5"
                    style={{ color: PALETTE.earthMuted }}
                  >
                    <HelpCircle className="w-[18px] h-[18px]" />
                  </button>

                  <button
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                    aria-label="Generate"
                    className="flex items-center justify-center rounded-full transition-all disabled:cursor-not-allowed"
                    style={{
                      width: 40,
                      height: 40,
                      background: canGenerate ? PALETTE.rose : PALETTE.sandDeep,
                      color: PALETTE.cream,
                      boxShadow: canGenerate ? "0 6px 18px rgba(191, 82, 74, 0.32)" : "none",
                    }}
                  >
                    {generating ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 rounded-full border-2"
                        style={{ borderColor: "currentColor", borderTopColor: "transparent" }}
                      />
                    ) : (
                      <ArrowUp className="w-[18px] h-[18px]" strokeWidth={2.5} />
                    )}
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
                    className="overflow-hidden mt-2.5"
                  >
                    <div
                      className="rounded-2xl p-5"
                      style={{
                        background: PALETTE.cream,
                        border: `1px solid ${PALETTE.sand}`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <p style={{ fontFamily: 'Asap, system-ui, sans-serif', fontSize: 14, fontWeight: 600, color: PALETTE.ink }}>
                            How to write a good prompt
                          </p>
                          <p style={{ fontFamily: 'Assistant, system-ui, sans-serif', fontSize: 13, color: PALETTE.earthMuted, marginTop: 4, lineHeight: 1.5 }}>
                            Describe how you want your pet shown. Costume, scene, mood — keep it simple, like talking to a friend.
                          </p>
                        </div>
                        <button onClick={() => setHelpOpen(false)} className="-mr-1 -mt-1 p-1 rounded-md hover:bg-black/5" aria-label="Close">
                          <X className="w-4 h-4" style={{ color: PALETTE.earthMuted }} />
                        </button>
                      </div>
                      <p style={{ fontFamily: 'Assistant, system-ui, sans-serif', fontSize: 11, color: PALETTE.earthMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                        Tap any to use:
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {PROMPT_EXAMPLES.slice(0, 5).map((ex) => (
                          <button
                            key={ex}
                            type="button"
                            onClick={() => { setPrompt(ex); setHelpOpen(false); }}
                            className="text-left rounded-lg px-3.5 py-2.5 transition-colors hover:bg-black/[0.03]"
                            style={{
                              background: PALETTE.cream2,
                              border: `1px solid ${PALETTE.sand}`,
                              color: PALETTE.ink,
                              fontFamily: 'Assistant, system-ui, sans-serif',
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
              className="mt-10 rounded-2xl py-12 text-center"
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

              <div className="grid grid-cols-3 gap-2 mt-6">
                {Object.entries(product.variants).map(([key, v]) => {
                  if (!v) return null;
                  const active = sizeKey === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSizeKey(key as AnySizeKey)}
                      className="rounded-xl p-3.5 text-center transition-all"
                      style={{
                        background: active ? PALETTE.ink : PALETTE.cream,
                        color: active ? PALETTE.cream : PALETTE.ink,
                        border: active ? `1.5px solid ${PALETTE.ink}` : `1px solid ${PALETTE.sandDeep}`,
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
                className="mt-5 w-full rounded-xl py-3.5 transition-all disabled:opacity-40"
                style={{
                  background: PALETTE.ink,
                  color: PALETTE.cream,
                  fontFamily: 'Asap, system-ui, sans-serif',
                  fontSize: 14.5,
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

      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
    </section>
  );
}
