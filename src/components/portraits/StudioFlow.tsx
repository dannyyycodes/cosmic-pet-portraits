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
import { ArrowUp, HelpCircle, Sparkles, X, Check, Brush } from "lucide-react";
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
import { getVisitorId } from "@/lib/auth/visitorId";
import { PALETTE, EASE, MOTION, display, eyebrow } from "@/components/portraits/tokens";
import { SplitWords } from "@/components/portraits/SplitWords";
import { StudioBackdrop } from "@/components/portraits/StudioBackdrop";
import { GenerationCanvas } from "@/components/portraits/studio/GenerationCanvas";

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
  "a watercolour pawtrait in the style of an old children's book",
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
  // Honeypot: real users never see or fill this. Bots that auto-fill every
  // input land in it and get rejected silently server-side.
  const [hpField, setHpField] = useState("");

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    if (isDisposableEmail(email)) {
      toast.error("Please use a real email address — that one's a temporary inbox.");
      return;
    }
    setBusy(true);
    try {
      // Visitor ID: stable browser fingerprint. The signup trigger uses it
      // (alongside email-alias dedup) to stop one device farming free credits.
      // Fail-soft: if FingerprintJS doesn't load (privacy extension, etc.)
      // we just skip it and let email-only dedup do its job.
      const visitorId = await getVisitorId();

      // Try instant-signup first. New emails: account created + signed in
      // immediately, no email click. Existing emails: server already sent the
      // OTP, we switch to code-entry to verify ownership.
      const r = await fetch('/api/portraits?action=instant-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          visitorId: visitorId ?? undefined,
          honeypot: hpField,
        }),
      });
      const data = await r.json() as { status?: string; otp?: string; email?: string; error?: string; message?: string };

      if (!r.ok) {
        if (r.status === 429) {
          toast.error(data.message || "Try again in a few minutes.");
        } else {
          toast.error(data.error || `Sign-in failed (${r.status})`);
        }
        return;
      }

      if (data.status === 'created' && data.otp && data.email) {
        // New account — verify the server-issued OTP locally to establish session.
        const { error: vErr } = await supabase.auth.verifyOtp({
          email: data.email,
          token: data.otp,
          type: 'magiclink',
        });
        if (vErr) {
          toast.error(vErr.message || 'Sign-in failed');
          return;
        }
        onOpenChange(false);
        toast.success('Welcome — 3 free pawtraits ready to generate.');
        return;
      }

      if (data.status === 'exists') {
        // Returning user — server already sent the OTP. Just collect the code.
        setStep('code');
        setCode('');
        return;
      }

      // Unknown shape — fall back to plain OTP path.
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/pawtraits#studio` },
      });
      if (error) throw error;
      setStep('code');
      setCode('');
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
      toast.success("Welcome — 3 free pawtraits ready to generate.");
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
          w-[calc(100vw-1.5rem)] max-w-[400px] p-0 overflow-hidden border-0
          max-h-[90vh] overflow-y-auto
          top-[max(5vh,env(safe-area-inset-top))] !translate-y-0
          sm:top-[50%] sm:!translate-y-[-50%]
          rounded-2xl sm:rounded-3xl
        "
        style={{
          background: PALETTE.cream,
          boxShadow: "0 24px 64px rgba(20, 18, 16, 0.20), 0 4px 16px rgba(20, 18, 16, 0.06)",
        }}
      >
        <DialogTitle className="sr-only">Sign in to generate</DialogTitle>
        <DialogDescription className="sr-only">
          Sign in with a 6-digit code emailed to you. No password, no leaving the site.
        </DialogDescription>

        {/* Honeypot — invisible to humans (off-screen, no tab/focus, no
            autocomplete). Bots that fill every input land here. */}
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          value={hpField}
          onChange={(e) => setHpField(e.target.value)}
          style={{
            position: 'absolute',
            left: '-9999px',
            width: 1,
            height: 1,
            opacity: 0,
            pointerEvents: 'none',
          }}
        />

        <div className="px-6 pt-8 pb-7 sm:px-8 sm:pt-9 sm:pb-8">
          {/* Header — single rose icon, confident heading, one-line subhead */}
          <div className="text-center mb-6">
            <div
              className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4"
              style={{
                background: PALETTE.roseSoft,
              }}
            >
              <Sparkles className="w-5 h-5" style={{ color: PALETTE.rose }} />
            </div>
            <h2
              style={{
                ...display("24px"),
                color: PALETTE.ink,
                lineHeight: 1.2,
              }}
            >
              {step === "email" ? "3 free pawtraits" : "Check your email"}
            </h2>
            <p
              className="mx-auto mt-2"
              style={{
                fontFamily: 'Assistant, system-ui, sans-serif',
                fontSize: 14,
                color: PALETTE.earthMuted,
                lineHeight: 1.5,
                maxWidth: 300,
              }}
            >
              {step === "email" ? (
                <>Enter your email — no password, signed in instantly.</>
              ) : (
                <>We sent a 6-digit code to <span style={{ color: PALETTE.ink, fontWeight: 600 }}>{email}</span></>
              )}
            </p>
          </div>

          {/* Form */}
          {step === "email" ? (
            <form onSubmit={handleSendCode} className="space-y-3">
              <input
                type="email"
                required
                autoFocus
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl px-4 outline-none transition-all focus:ring-2"
                style={{
                  background: "#fff",
                  border: `1px solid ${PALETTE.sandDeep}`,
                  color: PALETTE.ink,
                  fontFamily: 'Assistant, system-ui, sans-serif',
                  // 16px prevents iOS Safari from auto-zooming on focus.
                  fontSize: 16,
                  height: 52,
                  // @ts-expect-error css var
                  "--tw-ring-color": "rgba(191, 82, 74, 0.18)",
                }}
              />
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl transition-all disabled:opacity-60 active:scale-[0.99]"
                style={{
                  background: PALETTE.rose,
                  color: PALETTE.cream,
                  fontFamily: 'Asap, system-ui, sans-serif',
                  fontSize: 16,
                  fontWeight: 600,
                  letterSpacing: "0.01em",
                  height: 52,
                  boxShadow: "0 8px 22px rgba(191, 82, 74, 0.28)",
                }}
              >
                {busy ? "Signing you in…" : "Continue"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-3">
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
                className="w-full rounded-xl px-4 outline-none transition-all text-center focus:ring-2"
                style={{
                  background: "#fff",
                  border: `1px solid ${PALETTE.sandDeep}`,
                  color: PALETTE.ink,
                  fontFamily: 'Asap, system-ui, sans-serif',
                  fontSize: 26,
                  fontWeight: 700,
                  letterSpacing: "0.35em",
                  fontVariantNumeric: "tabular-nums",
                  height: 60,
                  // @ts-expect-error css var
                  "--tw-ring-color": "rgba(191, 82, 74, 0.18)",
                }}
              />
              <button
                type="submit"
                disabled={busy || code.length < 6}
                className="w-full rounded-xl transition-all disabled:opacity-60 active:scale-[0.99]"
                style={{
                  background: PALETTE.rose,
                  color: PALETTE.cream,
                  fontFamily: 'Asap, system-ui, sans-serif',
                  fontSize: 16,
                  fontWeight: 600,
                  letterSpacing: "0.01em",
                  height: 52,
                  boxShadow: code.length === 6 ? "0 8px 22px rgba(191, 82, 74, 0.28)" : "none",
                }}
              >
                {busy ? "Verifying…" : "Verify & continue"}
              </button>
              <div
                className="flex items-center justify-between pt-2 text-[13px]"
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
  // Pet name carries forward to the Soul Reading upsell pre-fill (cart drawer)
  // and to the Shopify line-item-properties so the order admin shows the pet.
  const [petName, setPetName] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try { return window.sessionStorage.getItem("portraits.lastPet") ?? ""; } catch { return ""; }
  });
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
  const [cartAddCount, setCartAddCount] = useState(0);

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
        body: JSON.stringify({
          imageUrl: photoUrl,
          customPrompt: prompt.trim(),
          // Slots into the prompt: 'Render the name "{petName}" in serif typography
          // along the lower margin…'. Server re-sanitises and caps at 24 chars.
          petName: petName.trim().slice(0, 40),
        }),
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
    const trimmedPet = petName.trim().slice(0, 40);
    if (trimmedPet && typeof window !== "undefined") {
      try { window.sessionStorage.setItem("portraits.lastPet", trimmedPet); } catch {}
    }
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
      properties: trimmedPet ? { _pet_name: trimmedPet } : undefined,
    });
    onCartAdd(item);
    setCartAddCount((n) => n + 1);
    toast.success(
      cartAddCount === 0
        ? "Added to cart — pick a different size or frame to add another"
        : `Added — ${cartAddCount + 1} in cart`,
      { duration: 3500 },
    );
  }

  const sectionTransition = { duration: MOTION.base / 1000, ease: EASE.out };
  const generationsRemaining = balance ?? null;

  return (
    <section
      id="studio"
      className="relative px-4 md:px-8 overflow-hidden"
      style={{
        background: `radial-gradient(ellipse 90% 50% at top, ${PALETTE.cream} 0%, ${PALETTE.cream2} 50%, ${PALETTE.paper} 100%)`,
        paddingTop: "clamp(56px, 7vh, 96px)",
        paddingBottom: "clamp(72px, 9vh, 120px)",
        borderTop: `1px solid ${PALETTE.sand}`,
      }}
    >
      <StudioBackdrop active={generating} />

      <div className="mx-auto relative" style={{ maxWidth: 720, zIndex: 1 }}>

        {/* ── Studio anchor heading ─────────────────────────────────── */}
        <div className="text-center mb-9 md:mb-12">
          {/* Gilt rule above eyebrow — cinematic anchor */}
          <span
            aria-hidden
            style={{
              display: "block",
              width: 44,
              height: 1,
              margin: "0 auto 16px",
              background: `linear-gradient(90deg, transparent 0%, ${PALETTE.gold} 50%, transparent 100%)`,
              opacity: 0.7,
            }}
          />
          <p style={{ ...eyebrow(PALETTE.goldDeep), letterSpacing: "0.22em" }}>
            <span className="inline-flex items-center gap-2">
              <Brush
                className="w-4 h-4"
                style={{ color: PALETTE.rose, strokeWidth: 2.2 }}
                aria-hidden
              />
              The Studio
            </span>
          </p>
          <h2
            id="studio-heading"
            style={{
              ...display("clamp(30px, 4.6vw, 52px)"),
              color: PALETTE.ink,
              marginTop: 14,
              maxWidth: 620,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <SplitWords text="Imagine your pet," />{" "}
            <SplitWords
              text="anywhere."
              delay={0.28}
              className="ls-hero-shine"
            />
          </h2>
          <p
            className="mx-auto mt-4"
            style={{
              fontFamily: 'Assistant, system-ui, sans-serif',
              fontSize: 15,
              color: PALETTE.earthMuted,
              maxWidth: 540,
              lineHeight: 1.55,
            }}
          >
            Upload one photo. Describe the world. Pick the version that feels like them — then choose your size and frame.
          </p>
        </div>

        {/* ── Credits / status pill ─────────────────────────────────── */}
        <div className="flex justify-center mb-7">
          {user ? (
            <Link
              to="/pawtraits#topup"
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
              <strong style={{ color: PALETTE.ink }}>3 free pawtraits</strong>
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

        {/* ── Pet name → on-canvas typography (optional) ─────────────── */}
        <motion.div
          key="petname"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={sectionTransition}
          className="mt-7"
        >
          <div className="flex items-baseline justify-between gap-3 px-1.5 mb-1.5">
            <label
              className="block text-xs"
              style={{
                fontFamily: 'Assistant, system-ui, sans-serif',
                color: PALETTE.earthMuted,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              <span aria-hidden style={{ color: PALETTE.gold, marginRight: 6 }}>✦</span>
              Add your pet's name to the canvas?
            </label>
            <span
              style={{
                fontFamily: 'Assistant, system-ui, sans-serif',
                fontSize: 11,
                color: PALETTE.earthSubtle,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Optional
            </span>
          </div>
          <p
            className="text-xs mb-2.5 px-1.5"
            style={{
              fontFamily: 'Assistant, system-ui, sans-serif',
              fontSize: 12.5,
              color: PALETTE.earthSubtle,
              lineHeight: 1.55,
              maxWidth: 520,
            }}
          >
            Set in elegant typography along the lower margin of your print. Leave blank for a clean canvas.
          </p>
          <input
            type="text"
            value={petName}
            onChange={(e) => setPetName(e.target.value.slice(0, 40))}
            placeholder="e.g. Luna"
            maxLength={40}
            aria-label="Pet's name to print on the canvas"
            className="w-full bg-transparent outline-none px-5 py-3"
            style={{
              fontFamily: 'Assistant, system-ui, sans-serif',
              fontSize: 16,
              color: PALETTE.ink,
              background: '#ffffff',
              border: `1.5px solid ${PALETTE.sandDeep}`,
              borderRadius: 14,
              boxShadow: '0 8px 18px rgba(20,18,16,.04), 0 1px 2px rgba(20,18,16,.02)',
              transition: 'box-shadow 220ms, border-color 220ms',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = PALETTE.rose;
              e.currentTarget.style.boxShadow = '0 0 0 4px rgba(191,82,74,.08), 0 14px 28px rgba(20,18,16,.06)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = PALETTE.sandDeep;
              e.currentTarget.style.boxShadow = '0 8px 18px rgba(20,18,16,.04), 0 1px 2px rgba(20,18,16,.02)';
            }}
          />

          {/* ── Live "on the canvas" preview ──────────────────────── */}
          <AnimatePresence initial={false}>
            {petName.trim().length > 0 && (
              <motion.div
                key="petname-preview"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.36, ease: EASE.out }}
                className="flex items-center gap-3 mt-3 px-1.5"
                aria-live="polite"
              >
                <div
                  className="relative shrink-0 overflow-hidden"
                  style={{
                    width: 88,
                    height: 110,
                    borderRadius: 8,
                    background: selectedVariantUrl
                      ? `#000`
                      : `linear-gradient(160deg, ${PALETTE.cosmosMid} 0%, ${PALETTE.cosmos} 100%)`,
                    border: `1px solid ${PALETTE.sandDeep}`,
                    boxShadow: '0 8px 20px rgba(20,18,16,.10), inset 0 0 0 1px rgba(196,162,101,.18)',
                  }}
                  aria-hidden
                >
                  {selectedVariantUrl ? (
                    <img
                      src={selectedVariantUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ opacity: 0.86 }}
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          'radial-gradient(80% 60% at 50% 35%, rgba(196,162,101,.22) 0%, transparent 60%)',
                      }}
                    />
                  )}
                  {/* Soft bottom scrim so the name reads cleanly */}
                  <div
                    className="absolute left-0 right-0 bottom-0"
                    style={{
                      height: '46%',
                      background:
                        'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.55) 100%)',
                    }}
                  />
                  {/* The name as it'll print */}
                  <div
                    className="absolute left-0 right-0 bottom-1 px-1.5 text-center"
                    style={{
                      fontFamily: '"Cormorant", "Cormorant Garamond", Georgia, serif',
                      fontStyle: 'italic',
                      fontWeight: 500,
                      fontSize: 13,
                      letterSpacing: '0.02em',
                      color: '#fdf6e3',
                      textShadow: '0 1px 2px rgba(0,0,0,.5)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    <span style={{ color: PALETTE.goldSoft, marginRight: 4 }}>·</span>
                    {petName.trim()}
                    <span style={{ color: PALETTE.goldSoft, marginLeft: 4 }}>·</span>
                  </div>
                </div>
                <p
                  style={{
                    fontFamily: 'Assistant, system-ui, sans-serif',
                    fontSize: 12.5,
                    color: PALETTE.earthMuted,
                    lineHeight: 1.5,
                  }}
                >
                  This is roughly how <strong style={{ color: PALETTE.ink, fontWeight: 600 }}>{petName.trim()}</strong> will appear on your printed canvas.{' '}
                  <span style={{ color: PALETTE.earthSubtle }}>
                    Position and proportions are finalised during print preparation.
                  </span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Premium prompt box — always visible (Generate gated by !!photoUrl) ─ */}
        <AnimatePresence>
          {true && (
            <motion.div
              key="prompt"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={sectionTransition}
              className="mt-7"
            >
            <div style={{ position: "relative" }}>
              {/* Breathing gilt halo — only renders when focused or actively typing */}
              {(focused || prompt.length > 0) && (
                <div className="ls-prompt-halo" aria-hidden />
              )}
              <div
                className="relative ls-prompt-ring"
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
                    className={`ls-magnet ls-send-btn flex items-center justify-center rounded-full overflow-hidden relative transition-[background,box-shadow] disabled:cursor-not-allowed${canGenerate ? " ls-send-btn--ready" : ""}`}
                    style={{
                      width: 40,
                      height: 40,
                      background: canGenerate
                        ? `linear-gradient(135deg, ${PALETTE.rose} 0%, ${PALETTE.roseDeep} 100%)`
                        : "#ffffff",
                      color: canGenerate ? PALETTE.cream : PALETTE.rose,
                      border: canGenerate ? "none" : `1.5px solid ${PALETTE.sand}`,
                      boxShadow: canGenerate
                        ? `0 8px 22px ${PALETTE.rose}66, 0 0 0 4px ${PALETTE.rose}1a`
                        : `0 4px 14px rgba(191, 82, 74, 0.10)`,
                    }}
                    onMouseMove={(e) => {
                      if (!canGenerate) return;
                      const r = e.currentTarget.getBoundingClientRect();
                      const dx = e.clientX - (r.left + r.width / 2);
                      const dy = e.clientY - (r.top + r.height / 2);
                      const cap = 8;
                      const x = Math.max(-cap, Math.min(cap, dx * 0.35));
                      const y = Math.max(-cap, Math.min(cap, dy * 0.35));
                      e.currentTarget.style.setProperty("--mag-x", `${x}px`);
                      e.currentTarget.style.setProperty("--mag-y", `${y}px`);
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.setProperty("--mag-x", "0px");
                      e.currentTarget.style.setProperty("--mag-y", "0px");
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
            </div>{/* /halo wrapper */}

              {/* Upload-first hint when no photo yet — sits below the prompt.
                  Also clarifies that size + frame are picked AFTER variants generate. */}
              {!photoUrl && (
                <p
                  className="text-center mt-3 px-2"
                  style={{
                    fontFamily: 'Assistant, system-ui, sans-serif',
                    fontSize: 13,
                    color: PALETTE.earthMuted,
                    lineHeight: 1.5,
                  }}
                >
                  Upload your pet's photo above to generate. Pick your canvas size &amp; frame after.
                </p>
              )}

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
            <div className="mt-10 mx-auto" style={{ maxWidth: 460 }}>
              <GenerationCanvas />
            </div>
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
                        aria-pressed={active}
                        className="rounded-xl p-3 text-center transition-all relative"
                        style={{
                          background: active ? PALETTE.rose : PALETTE.cream,
                          color: active ? PALETTE.cream : PALETTE.ink,
                          border: active
                            ? `2px solid ${PALETTE.rose}`
                            : isHero
                              ? `1.5px solid ${PALETTE.gold}`
                              : `1px solid ${PALETTE.sandDeep}`,
                          fontFamily: 'Asap, system-ui, sans-serif',
                          boxShadow: active
                            ? "0 10px 24px rgba(191, 82, 74, 0.32), 0 2px 6px rgba(191, 82, 74, 0.14)"
                            : isHero
                              ? "0 6px 14px rgba(196, 162, 101, 0.18)"
                              : "0 2px 4px rgba(20, 18, 16, 0.02)",
                          transform: active ? "translateY(-1px)" : "translateY(0)",
                        }}
                      >
                        {/* Active checkmark badge */}
                        {active && (
                          <span
                            className="absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full"
                            style={{
                              width: 18,
                              height: 18,
                              background: PALETTE.cream,
                              boxShadow: "0 2px 6px rgba(20,18,16,0.16)",
                            }}
                          >
                            <Check className="w-3 h-3" strokeWidth={3} style={{ color: PALETTE.rose }} />
                          </span>
                        )}
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
                            color: active ? "rgba(255,253,245,0.85)" : PALETTE.earthMuted,
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
                <div className="flex justify-center gap-5">
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
                        {/* Outer ring grows when active to make selection unambiguous */}
                        <span
                          className="rounded-full flex items-center justify-center transition-all"
                          style={{
                            width: 60,
                            height: 60,
                            padding: 4,
                            background: active ? PALETTE.roseSoft : "transparent",
                            border: active ? `2px solid ${PALETTE.rose}` : "2px solid transparent",
                            boxShadow: active ? "0 6px 14px rgba(191, 82, 74, 0.18)" : "none",
                          }}
                        >
                          <span
                            className={`rounded-full flex items-center justify-center ${active ? "ls-glint" : ""}`}
                            style={{
                              width: 44,
                              height: 44,
                              background: c.swatchHex,
                              border: `1.5px solid ${PALETTE.sandDeep}`,
                              boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.4)",
                            }}
                          >
                            {active && (
                              <Check className="w-5 h-5" strokeWidth={3} style={{ color: PALETTE.cream, position: "relative", zIndex: 1 }} />
                            )}
                          </span>
                        </span>
                        <span
                          style={{
                            fontFamily: 'Assistant, system-ui, sans-serif',
                            fontSize: 12,
                            fontWeight: active ? 700 : 500,
                            color: active ? PALETTE.rose : PALETTE.earth,
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
                  {cartAddCount > 0 ? "Add another to cart" : "Add to cart"}
                  {variant ? ` · £${variant.priceMajor}` : ""}
                </button>
                {cartAddCount > 0 && (
                  <p
                    className="text-center mt-3"
                    style={{
                      fontFamily: 'Assistant, system-ui, sans-serif',
                      fontSize: 12.5,
                      color: PALETTE.earthMuted,
                      lineHeight: 1.5,
                    }}
                  >
                    <Sparkles className="inline-block w-3 h-3 mr-1" style={{ color: PALETTE.rose }} />
                    {cartAddCount} in your cart · pick a different size or frame to add another, or{" "}
                    <span style={{ color: PALETTE.rose, fontWeight: 600 }}>open the cart to checkout</span>
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
    </section>
  );
}
