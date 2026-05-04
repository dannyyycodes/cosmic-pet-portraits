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
  formatPrice,
  type AnySizeKey,
} from "@/components/portraits/productLineup";
import {
  CANVAS_SIZES,
  FRAME_COLORS,
  resolveFramedCanvasVariant,
  type FrameColor,
} from "@/components/portraits/gelatoFramedCanvas";
import { buildCartItem, type CartItem } from "@/components/portraits/cart";
import { supabase } from "@/integrations/supabase/client";
import { isDisposableEmail } from "@/lib/auth/disposableEmailDomains";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { PALETTE, EASE, MOTION, display } from "@/components/portraits/tokens";

// Lazy-load + cache FingerprintJS visitor ID. Stable across cache clears,
// incognito, and minor browser updates. Used by the Supabase signup trigger
// to enforce one-free-trial-per-device.
let cachedVisitorId: string | null = null;
async function getVisitorId(): Promise<string | null> {
  if (cachedVisitorId) return cachedVisitorId;
  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    cachedVisitorId = result.visitorId;
    return cachedVisitorId;
  } catch {
    return null;
  }
}

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
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<"email" | "code">("email");

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    if (isDisposableEmail(email)) {
      toast.error("Please use a real email address — that one's a temporary inbox.");
      return;
    }
    setBusy(true);
    try {
      const visitorId = await getVisitorId();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // Magic link in email also works (clickable fallback) — but the
          // template includes the 6-digit code so customers never leave site.
          emailRedirectTo: `${window.location.origin}/portraits#studio`,
          data: visitorId ? { visitor_id: visitorId } : undefined,
        },
      });
      if (error) throw error;
      setStep("code");
      setCode("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (code.length < 6) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });
      if (error) throw error;
      onOpenChange(false);
      toast.success("Welcome — 3 free portraits ready to generate.");
    } catch (e) {
      toast.error("That code didn't work. Try again or send a new one.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setStep("email");
    setCode("");
    setBusy(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setTimeout(reset, 200);
        onOpenChange(v);
      }}
    >
      <DialogContent
        className="
          max-w-[420px] p-0 overflow-hidden border-0
          max-h-[92vh] overflow-y-auto
          top-[max(6vh,env(safe-area-inset-top))] !translate-y-0
          sm:top-[50%] sm:!translate-y-[-50%]
          rounded-3xl
        "
        style={{
          background: `linear-gradient(180deg, ${PALETTE.cream} 0%, ${PALETTE.cream2} 100%)`,
          boxShadow: "0 32px 80px rgba(20, 18, 16, 0.18), 0 8px 24px rgba(20, 18, 16, 0.08)",
        }}
      >
        <DialogTitle className="sr-only">Sign in to generate</DialogTitle>
        <DialogDescription className="sr-only">
          Sign in with a 6-digit code emailed to you. No password, no leaving the site.
        </DialogDescription>

        {/* Header */}
        <div className="px-7 pt-9 pb-6 text-center relative">
          {/* Gilt hairline at top */}
          <div
            aria-hidden
            style={{
              position: "absolute", top: 0, left: "50%",
              transform: "translateX(-50%)",
              width: 56, height: 1.5,
              background: `linear-gradient(90deg, transparent 0%, ${PALETTE.gold} 50%, transparent 100%)`,
            }}
          />
          <div
            className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4"
            style={{
              background: PALETTE.roseSoft,
              boxShadow: "0 6px 18px rgba(191, 82, 74, 0.18)",
            }}
          >
            <Sparkles className="w-6 h-6" style={{ color: PALETTE.rose }} />
          </div>
          <h2 style={{ ...display("26px"), color: PALETTE.ink }}>
            {step === "email" ? "3 free portraits" : "Enter your code"}
          </h2>
          <p
            className="mx-auto mt-2"
            style={{
              fontFamily: 'Assistant, system-ui, sans-serif',
              fontSize: 14,
              color: PALETTE.earthMuted,
              maxWidth: 320,
              lineHeight: 1.5,
            }}
          >
            {step === "email" ? (
              <>Get a 6-digit code in your inbox. Type it below — you stay right here.</>
            ) : (
              <>We just emailed a 6-digit code to <strong style={{ color: PALETTE.ink }}>{email}</strong></>
            )}
          </p>
        </div>

        {/* Body */}
        <div className="px-7 pb-8">
          {step === "email" ? (
            <form onSubmit={handleSendCode} className="space-y-2.5">
              <input
                type="email"
                required
                autoFocus
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full rounded-xl px-4 py-3.5 outline-none transition-all focus:ring-2"
                style={{
                  background: "#fff",
                  border: `1px solid ${PALETTE.sandDeep}`,
                  color: PALETTE.ink,
                  fontFamily: 'Assistant, system-ui, sans-serif',
                  fontSize: 16,
                  // @ts-expect-error css var
                  "--tw-ring-color": "rgba(191, 82, 74, 0.18)",
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
                  fontSize: 15,
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  boxShadow: "0 10px 26px rgba(191, 82, 74, 0.32)",
                }}
              >
                {busy ? "Sending…" : "Send me a code"}
              </button>
              <p
                className="text-center pt-1"
                style={{
                  fontSize: 12,
                  color: PALETTE.earthMuted,
                  fontFamily: 'Assistant, system-ui, sans-serif',
                  lineHeight: 1.5,
                }}
              >
                No password to remember. We'll never share your email.
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-2.5">
              <input
                type="text"
                required
                autoFocus
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="w-full rounded-xl px-4 py-4 outline-none transition-all text-center"
                style={{
                  background: "#fff",
                  border: `1px solid ${PALETTE.sandDeep}`,
                  color: PALETTE.ink,
                  fontFamily: 'Asap, system-ui, sans-serif',
                  fontSize: 28,
                  fontWeight: 700,
                  letterSpacing: "0.4em",
                  fontVariantNumeric: "tabular-nums",
                }}
              />
              <button
                type="submit"
                disabled={busy || code.length < 6}
                className="w-full rounded-xl py-3.5 transition-all disabled:opacity-50"
                style={{
                  background: PALETTE.rose,
                  color: PALETTE.cream,
                  fontFamily: 'Asap, system-ui, sans-serif',
                  fontSize: 15,
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  boxShadow: code.length === 6 ? "0 10px 26px rgba(191, 82, 74, 0.32)" : "none",
                }}
              >
                {busy ? "Verifying…" : "Verify & continue"}
              </button>
              <div
                className="flex items-center justify-between pt-1 text-[12.5px]"
                style={{
                  color: PALETTE.earthMuted,
                  fontFamily: 'Assistant, system-ui, sans-serif',
                }}
              >
                <button
                  type="button"
                  onClick={() => { setStep("email"); setCode(""); }}
                  className="hover:underline"
                  style={{ color: PALETTE.earthMuted }}
                >
                  ← Wrong email
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); handleSendCode(e); }}
                  disabled={busy}
                  className="hover:underline disabled:opacity-50"
                  style={{ color: PALETTE.rose, fontWeight: 600 }}
                >
                  Resend code
                </button>
              </div>
            </form>
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
  // 11 sizes × 3 frame colors. 16x20 is the default hero size.
  const [sizeKey, setSizeKey] = useState<string>("16x20");
  const [frameColor, setFrameColor] = useState<FrameColor>("black");

  const variant = resolveFramedCanvasVariant(sizeKey, frameColor);
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
        toast.error("Out of credits. Top up below to keep going.");
        document.getElementById("topup")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      sizeKey: sizeKey as AnySizeKey,
      frameColor,
      packId: "custom-prompt",
      packName: prompt.trim().slice(0, 60),
      style: "photographic",
      sourcePhotoUrl: photoUrl,
      previewUrl: selectedVariantUrl,
      soulEdition: false,
      soulEditionPriceMajor: 40,
      variant: { variantId: variant.variantId, priceMajor: variant.priceMajor, sizeLabel: variant.sizeLabel },
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
        background: `radial-gradient(ellipse 90% 50% at top, ${PALETTE.cream} 0%, ${PALETTE.cream2} 50%, ${PALETTE.paper} 100%)`,
        paddingTop: "clamp(56px, 7vh, 96px)",
        paddingBottom: "clamp(72px, 9vh, 120px)",
        borderTop: `1px solid ${PALETTE.sand}`,
      }}
    >
      {/* Subtle gilt hairline accent at top */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 64,
          height: 1.5,
          background: `linear-gradient(90deg, transparent 0%, ${PALETTE.gold} 50%, transparent 100%)`,
        }}
      />
      <div className="mx-auto" style={{ maxWidth: 720 }}>

        {/* ── Credits / status pill ─────────────────────────────────── */}
        <div className="flex justify-center mb-7">
          {user ? (
            <Link
              to="/portraits#topup"
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
              {/* Variant gallery + size + cart wrapped in a premium card */}
              <div
                className="rounded-2xl p-5 md:p-7"
                style={{
                  background: PALETTE.cream,
                  border: `1px solid ${PALETTE.sand}`,
                  boxShadow: "0 24px 48px rgba(20, 18, 16, 0.06), 0 4px 12px rgba(20, 18, 16, 0.03)",
                }}
              >
                <VariantGallery
                  variants={variants}
                  selectedUrl={selectedVariantUrl}
                  onSelect={setSelectedVariantUrl}
                />

                <div
                  className="my-6"
                  style={{ height: 1, background: PALETTE.sand }}
                />

                <p
                  className="text-center mb-4"
                  style={{
                    fontFamily: 'Asap, system-ui, sans-serif',
                    fontSize: 11,
                    fontWeight: 700,
                    color: PALETTE.earthMuted,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  Choose your canvas size
                </p>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {CANVAS_SIZES.map((s) => {
                    const active = sizeKey === s.uid;
                    const isHero = !!s.hero;
                    return (
                      <button
                        key={s.uid}
                        onClick={() => setSizeKey(s.uid)}
                        className="rounded-xl p-3 text-center transition-all relative"
                        style={{
                          background: active ? PALETTE.ink : PALETTE.cream,
                          color: active ? PALETTE.cream : PALETTE.ink,
                          border: active
                            ? `1.5px solid ${PALETTE.ink}`
                            : isHero
                              ? `1.5px solid ${PALETTE.gold}`
                              : `1px solid ${PALETTE.sandDeep}`,
                          fontFamily: 'Asap, system-ui, sans-serif',
                          boxShadow: active
                            ? "0 8px 18px rgba(20, 18, 16, 0.18)"
                            : isHero
                              ? "0 6px 14px rgba(196, 162, 101, 0.18)"
                              : "0 2px 4px rgba(20, 18, 16, 0.02)",
                        }}
                      >
                        {isHero && !active && (
                          <span
                            className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5"
                            style={{
                              fontSize: 8.5,
                              fontWeight: 700,
                              color: PALETTE.goldDeep,
                              background: PALETTE.cream,
                              letterSpacing: "0.14em",
                              textTransform: "uppercase",
                              fontFamily: 'Asap, system-ui, sans-serif',
                              whiteSpace: "nowrap",
                            }}
                          >
                            Most loved
                          </span>
                        )}
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{s.label}</div>
                        <div
                          className="tabular-nums mt-0.5"
                          style={{
                            fontSize: 12,
                            color: active ? PALETTE.cream : PALETTE.earthMuted,
                          }}
                        >
                          £{s.priceGBP}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Frame color picker */}
                <p
                  className="text-center mt-6 mb-3"
                  style={{
                    fontFamily: 'Asap, system-ui, sans-serif',
                    fontSize: 11,
                    fontWeight: 700,
                    color: PALETTE.earthMuted,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  Choose frame colour
                </p>
                <div className="flex justify-center gap-4">
                  {FRAME_COLORS.map((c) => {
                    const active = frameColor === c.uid;
                    return (
                      <button
                        key={c.uid}
                        onClick={() => setFrameColor(c.uid)}
                        className="flex flex-col items-center gap-2 transition-all"
                        title={c.label}
                        aria-label={`Frame: ${c.label}`}
                        aria-pressed={active}
                      >
                        <div
                          className="rounded-full transition-all"
                          style={{
                            width: active ? 48 : 40,
                            height: active ? 48 : 40,
                            background: c.swatchHex,
                            border: active
                              ? `2.5px solid ${PALETTE.ink}`
                              : `1.5px solid ${PALETTE.sandDeep}`,
                            boxShadow: active
                              ? "0 6px 14px rgba(20,18,16,0.18)"
                              : "0 2px 6px rgba(20,18,16,0.08)",
                          }}
                        />
                        <span
                          style={{
                            fontFamily: 'Assistant, system-ui, sans-serif',
                            fontSize: 11.5,
                            fontWeight: active ? 600 : 400,
                            color: active ? PALETTE.ink : PALETTE.earthMuted,
                            letterSpacing: "0.02em",
                          }}
                        >
                          {c.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleAdd}
                  disabled={!canAdd}
                  className="mt-6 w-full rounded-xl py-4 transition-all disabled:opacity-40"
                  style={{
                    background: PALETTE.ink,
                    color: PALETTE.cream,
                    fontFamily: 'Asap, system-ui, sans-serif',
                    fontSize: 15,
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    boxShadow: canAdd
                      ? "0 14px 32px rgba(20, 18, 16, 0.18), 0 2px 6px rgba(20, 18, 16, 0.08)"
                      : "none",
                  }}
                >
                  Add to cart {variant ? `· ${formatPrice(variant.priceMajor)}` : ""}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
    </section>
  );
}
