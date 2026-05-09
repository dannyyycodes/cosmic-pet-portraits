/**
 * StudioFlow — sleek multi-pet configurator (premium app aesthetic).
 *
 * Layout:
 *   credits badge → multi-pet upload stack → shared prompt box →
 *   approval gate (Reveal step) → variants/size/cart
 *
 * Multi-pet upload (Crown & Paw / West & Willow proven model — vault:
 *   research-2026-05-07-multipet-orientation-ux.md):
 *   - One PetUploadCard per pet (photo + name input). Cap at 4 pets.
 *   - "+ Add another pet" button below the stack; per-card "×" delete.
 *   - The freeform `prompt` is shared — it's the artistic transformation
 *     for ALL pets together (not per-pet).
 *
 * Approval gate (Reveal):
 *   - After generation, customer must explicitly approve before SKU pick.
 *   - "Continue", "Try again (1 credit)", "Tweak the prompt" affordances.
 *   - Resets to false on any change to pets or prompt.
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
 * API contracts (Agent 1 owns the backend):
 *   POST /api/portraits?action=generate
 *     body { imageUrls: string[], petNames?: string[], customPrompt }
 *     → { variants: [{url, composition}], subjects, prompts }
 *     → 400 { error: 'no_pet_detected', petIndex } — show inline on card N
 *     → 402 / 503 — same handling as today
 *   POST /api/portraits?action=printMaster
 *     body { imageUrls, petNames?, customPrompt, sizeKey }
 *     → { printMasterUrl, width, height, aspect, costEstimate }
 *     → triggered on cart-add to produce the print-grade asset
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ArrowUp, HelpCircle, Sparkles, X, Check, Brush, Plus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PetUploadCard, type Pet } from "@/components/portraits/PetUploadCard";
import { ApprovalGate } from "@/components/portraits/ApprovalGate";
import { VariantGallery, type Variant } from "@/components/portraits/styles/VariantGallery";
import { useAuth } from "@/contexts/AuthContext";
import { useCredits } from "@/components/portraits/useCredits";
import { savePetPhoto, loadPetPhoto, clearPetPhoto } from "@/components/portraits/photoSharing";
import { saveStudioState, loadStudioState, clearStudioState } from "@/components/portraits/studioStatePersistence";
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

// Multi-pet hard cap. Per Crown & Paw's model + research above, 4 is the
// composition ceiling — beyond that per-pet recognition drops sharply.
const MAX_PETS = 4;

/** Generate a stable client-side id for a pet card. Falls back to a
 *  Math.random key in older browsers without crypto.randomUUID. */
function newPetId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `pet_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Studio phase — what the customer is currently doing inside the studio.
 *
 *  compose    : picking pets / typing a prompt (default).
 *  generating : portrait is being painted (the cinematic in-progress state).
 *  reveal     : portrait is back, awaiting Approve / Try again / Tweak.
 *  approved   : customer approved → size/frame/cart UI is the focus.
 *
 * Emitted to the parent so the surrounding page can dim / fade non-studio
 * sections during the high-attention phases (generating + reveal).
 */
export type StudioPhase = 'compose' | 'generating' | 'reveal' | 'approved';

interface StudioFlowProps {
  onCartAdd: (item: CartItem) => void;
  onPhaseChange?: (phase: StudioPhase) => void;
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

const PROMPT_CHIPS = [
  { label: "Renaissance king", prompt: PROMPT_EXAMPLES[0] },
  { label: "Astronaut", prompt: PROMPT_EXAMPLES[1] },
  { label: "Wizard library", prompt: PROMPT_EXAMPLES[2] },
  { label: "1920s boss", prompt: PROMPT_EXAMPLES[3] },
  { label: "Cosmic chart", prompt: PROMPT_EXAMPLES[4] },
];

function canvasPetName(pet: Pet): string {
  return pet.noName ? "" : pet.name.trim().slice(0, 40);
}

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

      // Server emails an OTP for both new and existing accounts. We always
      // collect the code — no client-side auto-verify (would require trusting
      // the server to hand us a token for an email we haven't proven we own).
      const r = await fetch('/api/portraits?action=instant-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          visitorId: visitorId ?? undefined,
          honeypot: hpField,
        }),
      });
      const data = await r.json() as { status?: string; email?: string; error?: string; message?: string };

      if (!r.ok) {
        if (r.status === 429) {
          toast.error(data.message || "Try again in a few minutes.");
        } else {
          toast.error(data.error || `Sign-in failed (${r.status})`);
        }
        return;
      }

      if (data.status === 'otp_sent') {
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
export function StudioFlow({ onCartAdd, onPhaseChange }: StudioFlowProps) {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { balance, refresh: refreshCredits } = useCredits();

  // ── Multi-pet state ──────────────────────────────────────────────────
  // The first pet seeds from the photoSharing helper so a customer who
  // uploaded on /portraits/templates lands here with their photo intact.
  // (Multi-pet is NOT persisted across sessions for now — overscope.)
  // Session-stored pet-name pre-fill from the prior single-pet flow goes
  // onto the first card so returning customers don't lose their typed name.
  // Restore the full studio state if a recent session left a snapshot
  // (within the 4h TTL). Survives accidental tab close mid-generation —
  // pets, prompt, generated variants, approval all come back. If no
  // snapshot, fall back to the legacy single-photo seed.
  const restoredState = (() => {
    if (typeof window === "undefined") return null;
    return loadStudioState();
  })();

  const [pets, setPets] = useState<Pet[]>(() => {
    if (restoredState && restoredState.pets.length > 0) {
      return restoredState.pets.map((p) => ({
        id: p.id || newPetId(),
        name: p.name || "",
        photoUrl: p.photoUrl ?? null,
        noName: p.noName ?? false,
      }));
    }
    const seedPhoto = loadPetPhoto();
    let seedName = "";
    if (typeof window !== "undefined") {
      try { seedName = window.sessionStorage.getItem("portraits.lastPet") ?? ""; } catch { /* */ }
    }
    return [{ id: newPetId(), photoUrl: seedPhoto, name: seedName }];
  });

  // Per-pet error messages from the backend (e.g. no_pet_detected).
  // Keyed by pet.id so it survives reorder/delete.
  const [petErrors, setPetErrors] = useState<Record<string, string>>({});

  /** Mutate one pet by id — also clears any per-pet API error so the
   *  red border drops as soon as the user touches that card. Persists
   *  the FIRST pet's photo to the cross-page sharing helper (per spec
   *  — multi-pet persistence is out of scope). */
  function updatePet(id: string, next: Pet) {
    setPets((prev) => {
      const updated = prev.map((p) => (p.id === id ? next : p));
      // Persist the first pet's photo for cross-page hand-off.
      const first = updated[0];
      if (first?.photoUrl) savePetPhoto(first.photoUrl);
      else if (first && !first.photoUrl) clearPetPhoto();
      if (first?.noName && typeof window !== "undefined") {
        try { window.sessionStorage.removeItem("portraits.lastPet"); } catch {}
      }
      return updated;
    });
    setPetErrors((prev) => {
      if (!prev[id]) return prev;
      const { [id]: _drop, ...rest } = prev;
      return rest;
    });
    // Approval is invalidated by any pet change.
    setApproved(false);
  }

  function addPet() {
    setPets((prev) =>
      prev.length >= MAX_PETS
        ? prev
        : [...prev, { id: newPetId(), photoUrl: null, name: "" }],
    );
    setApproved(false);
  }

  function removePet(id: string) {
    setPets((prev) => (prev.length > 1 ? prev.filter((p) => p.id !== id) : prev));
    setPetErrors((prev) => {
      const { [id]: _drop, ...rest } = prev;
      return rest;
    });
    setApproved(false);
  }

  const [prompt, setPrompt] = useState(restoredState?.prompt ?? "");
  const [generating, setGenerating] = useState(false);
  const [variants, setVariants] = useState<Variant[]>(restoredState?.variants ?? []);
  const [selectedVariantUrl, setSelectedVariantUrl] = useState<string | null>(restoredState?.selectedVariantUrl ?? null);
  // Approval gate — the Reveal step. Customer must explicitly approve
  // before size/frame picker + cart UI become visible.
  const [approved, setApproved] = useState(restoredState?.approved ?? false);
  const [generationCount, setGenerationCount] = useState(0);

  // Persist state on every meaningful change so a tab close mid-generation
  // doesn't lose work + the credit it burned. Cleared on cart-add success
  // (handleAdd below) so a returning customer doesn't see a stale sale-attempt.
  useEffect(() => {
    if (typeof window === "undefined") return;
    saveStudioState({
      pets: pets.map((p) => ({ id: p.id, name: p.name, noName: p.noName ?? false, photoUrl: p.photoUrl })),
      prompt,
      variants,
      selectedVariantUrl,
      approved,
    });
  }, [pets, prompt, variants, selectedVariantUrl, approved]);
  // Print-master regen state — busy spinner over the cart-add button while
  // the print-grade asset is being prepared (~10-20s).
  const [preparingPrintMaster, setPreparingPrintMaster] = useState(false);
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

  // Derived: at least one pet has a photo + prompt is long enough.
  const uploadedPets = useMemo(() => pets.filter((p) => p.photoUrl), [pets]);
  const canGenerate =
    uploadedPets.length >= 1 && prompt.trim().length >= 4 && !generating;
  const canAdd =
    approved && !!selectedVariantUrl && !!variant && uploadedPets.length >= 1 && !preparingPrintMaster;

  // ── Phase machine ───────────────────────────────────────────────────
  // Single source of truth for what the studio is currently doing. Drives
  // the "only one section visible at a time" layout and is emitted to the
  // parent so the surrounding page can dim during high-attention phases.
  const studioPhase: StudioPhase = generating
    ? 'generating'
    : variants.length > 0 && approved
      ? 'approved'
      : variants.length > 0
        ? 'reveal'
        : 'compose';

  useEffect(() => {
    onPhaseChange?.(studioPhase);
  }, [studioPhase, onPhaseChange]);

  // Reset approval whenever the prompt changes (any prompt edit invalidates
  // the prior generation's approval state — same gen no longer represents
  // what the customer wants).
  useEffect(() => {
    setApproved(false);
  }, [prompt]);

  const variantsRef = useRef<HTMLDivElement>(null);
  const approvalRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // When handleTweak transitions us back to compose, the textarea is being
  // re-mounted — promptRef won't be live for ~1 frame. The ref couldn't be
  // focused via requestAnimationFrame inside handleTweak (the ref hadn't
  // attached yet). Instead we set this flag in handleTweak, and a useEffect
  // below picks it up once the compose subtree has actually rendered and
  // the ref is live, then focuses + scrolls. Same idea as a "do this on
  // next mount" guard.
  const tweakFocusPendingRef = useRef(false);
  useEffect(() => {
    if (studioPhase !== 'compose' || !tweakFocusPendingRef.current) return;
    if (!promptRef.current) return;
    tweakFocusPendingRef.current = false;
    promptRef.current.focus();
    promptRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [studioPhase]);

  async function handleGenerate() {
    if (uploadedPets.length < 1 || prompt.trim().length < 4) return;
    if (!user || !session?.access_token) {
      setSignInOpen(true);
      return;
    }
    setGenerating(true);
    setVariants([]);
    setSelectedVariantUrl(null);
    setApproved(false);
    // Scroll the studio's focal area to the top of the viewport so the
    // GenerationCanvas (which is about to replace the compose UI) lands in
    // the customer's eyeline. Without this, customers on long mobile pages
    // could trigger Generate while the prompt is mid-screen and never
    // see the cinematic loading state.
    requestAnimationFrame(() =>
      stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
    setPetErrors({});

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 60000);
    try {
      // Build the request body per the API contract Agent 1 implemented:
      //   imageUrls is the array of uploaded pet photos (filter out empty
      //   slots so we never send null), petNames is parallel to that list
      //   so the server can map per-pet name → per-pet typography.
      const orderedPets = pets.filter((p) => p.photoUrl);
      const res = await fetch("/api/portraits?action=generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          imageUrls: orderedPets.map((p) => p.photoUrl as string),
          petNames: orderedPets.map(canvasPetName),
          customPrompt: prompt.trim(),
        }),
        signal: ctrl.signal,
      });
      const data = await res.json();

      // 400 — no pet detected on a specific upload. Highlight that card
      // inline rather than firing a generic toast (per task spec).
      if (res.status === 400 && data?.error === "no_pet_detected") {
        const idx: number = typeof data.petIndex === "number" ? data.petIndex : 0;
        const target = orderedPets[idx]?.id;
        const message: string =
          data.message || "We couldn't find a pet in this photo. Try a clearer, well-lit shot.";
        if (target) {
          setPetErrors((prev) => ({ ...prev, [target]: message }));
        } else {
          toast.error(message);
        }
        return;
      }

      if (res.status === 402) {
        toast.error("Out of credits. Top up below to keep going.");
        document.getElementById("topup")?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (res.status === 503 && data.error === "ai-service-paused") {
        toast.error(data.message ?? "Our portrait studio is briefly paused — try again.");
        refreshCredits();
        return;
      }
      // 422 — content policy violation. Usually a pet name resembling an
      // unsafe word (Sphynx "Naked" was the canonical case). Show the
      // backend's message + a clear suggestion. Credit was already refunded
      // server-side, so refreshCredits() picks it up.
      if (res.status === 422 && data?.error === "content_policy_violation") {
        toast.error(
          data.message ??
            "Our moderator flagged this generation — try a different name.",
          { duration: 8000 },
        );
        refreshCredits();
        return;
      }
      if (!res.ok) throw new Error(data.error || "Generation failed");

      setVariants(data.variants);
      if (data.variants[0]) setSelectedVariantUrl(data.variants[0].url);
      setGenerationCount((n) => n + 1);
      refreshCredits();
      // Scroll to the Approval gate (replaces the old "scroll to variants").
      requestAnimationFrame(() =>
        approvalRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    } catch (e) {
      const err = e as Error;
      toast.error(err.name === "AbortError" ? "Took too long — please try again." : err.message);
    } finally {
      clearTimeout(timer);
      setGenerating(false);
    }
  }

  /** Approval-gate retry: regenerate with same photos + prompt. */
  function handleTryAgain() {
    handleGenerate();
  }

  /** Approval-gate tweak: collapse gate, scroll back to prompt editor. The
   *  compose subtree is unmounted in reveal phase, so promptRef won't be
   *  live for ~1 frame after we clear variants. We can't focus/scroll
   *  synchronously here — instead we set tweakFocusPendingRef and let the
   *  useEffect above pick it up once compose has re-mounted. */
  function handleTweak() {
    tweakFocusPendingRef.current = true;
    setVariants([]);
    setSelectedVariantUrl(null);
    setApproved(false);
  }

  /** Approval-gate continue: flip approved=true → reveals size/frame picker. */
  function handleApprove() {
    setApproved(true);
    setCartAddCount(0);
    requestAnimationFrame(() =>
      variantsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }

  async function handleAdd() {
    // Debounce against double-click. The button is disabled via canAdd while
    // preparingPrintMaster, but a fast double-tap can fire both clicks before
    // React re-renders the disabled prop. Without this guard the second
    // click kicks off a parallel print-master fetch and a second cart insert.
    if (preparingPrintMaster) return;
    if (!selectedVariantUrl || !variant) return;
    if (uploadedPets.length === 0) return;
    if (!session?.access_token) {
      setSignInOpen(true);
      return;
    }

    // Persist the first pet's name for the Soul Reading upsell pre-fill.
    const trimmedNames = pets.map(canvasPetName);
    const firstName = trimmedNames[0];
    if (firstName && typeof window !== "undefined") {
      try { window.sessionStorage.setItem("portraits.lastPet", firstName); } catch {}
    }

    // ── Print-master regen ──────────────────────────────────────────────
    // The selectedVariantUrl is preview-grade. For physical canvas we POST
    // back to /api/portraits?action=printMaster to get the print-grade
    // asset at the correct aspect for the chosen size. ~10-20s typical.
    setPreparingPrintMaster(true);
    let printMasterUrl: string | null = null;
    try {
      const orderedPhotos = uploadedPets.map((p) => p.photoUrl as string);
      const orderedNames = uploadedPets.map(canvasPetName);
      // 30s timeout is generous — print-grade gens average 10-20s.
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 30000);
      try {
        const res = await fetch("/api/portraits?action=printMaster", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            imageUrls: orderedPhotos,
            petNames: orderedNames,
            customPrompt: prompt.trim(),
            sizeKey,
          }),
          signal: ctrl.signal,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.printMasterUrl) {
          throw new Error(data?.error || `printMaster failed (${res.status})`);
        }
        printMasterUrl = data.printMasterUrl as string;
      } finally {
        clearTimeout(timer);
      }
    } catch (e) {
      console.error("[StudioFlow] printMaster failed", e);
      toast.error("Couldn't prepare print master — please try again.");
      setPreparingPrintMaster(false);
      return; // Hard stop — do NOT add to cart with a bad master.
    }
    setPreparingPrintMaster(false);

    // Multi-pet line-item property: Shopify line-item-property is one key,
    // one string value — comma-join the names so the order admin shows them.
    const nameList = trimmedNames.filter((n) => n.length > 0);
    const properties: Record<string, string> = {};
    if (nameList.length === 1) {
      properties._pet_name = nameList[0];
    } else if (nameList.length > 1) {
      properties._pet_names = nameList.join(", ");
    }

    const item = buildCartItem({
      kind: "ai",
      productType,
      sizeKey: sizeKey as AnySizeKey,
      frameColor,
      packId: "custom-prompt",
      packName: prompt.trim().slice(0, 60),
      style: "photographic",
      // Source photo: first pet's upload — fulfilment uses this as the
      // "anchor" photo of record. The print master carries the actual
      // composited art for fulfilment.
      sourcePhotoUrl: uploadedPets[0].photoUrl as string,
      previewUrl: printMasterUrl,
      printMasterUrl,
      soulEdition: false,
      soulEditionPriceMajor: 40,
      variant: { variantId: variant.variantId, priceMajor: variant.priceMajor, sizeLabel: variant.sizeLabel },
      id: newPetId(),
      properties: Object.keys(properties).length > 0 ? properties : undefined,
    });
    onCartAdd(item);
    setCartAddCount((n) => n + 1);
    // Cart-add is the natural "session ended" boundary — clear the
    // mid-generation snapshot so a returning customer doesn't see a
    // half-built attempt from the order they just completed.
    clearStudioState();
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
        paddingTop: "clamp(36px, 5vh, 64px)",
        paddingBottom: "clamp(48px, 6vh, 84px)",
        borderTop: `1px solid ${PALETTE.sand}`,
      }}
    >
      <StudioBackdrop active={studioPhase === 'generating' || studioPhase === 'reveal'} />

      <div className="mx-auto relative" style={{ maxWidth: 880, zIndex: 1 }}>

        {/* Scroll target for handleGenerate — lands the focal area in the
            customer's eyeline as the compose UI fades to make room for the
            GenerationCanvas / ApprovalGate. scrollMarginTop keeps the heading
            clear of the 62px fixed PortraitsNav (without it, smooth scroll
            buries the eyebrow + first line of the heading under the nav). */}
        <div
          ref={stageRef}
          aria-hidden
          style={{ position: "absolute", top: 0, scrollMarginTop: "80px" }}
        />

        {/* ── Studio anchor heading ─────────────────────────────────── */}
        <div className="text-center mb-5 md:mb-7">
          {/* Gilt rule above eyebrow — cinematic anchor */}
          <span
            aria-hidden
            style={{
              display: "block",
              width: 44,
              height: 1,
              margin: "0 auto 10px",
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
              marginTop: 10,
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
              fontSize: 13,
              color: PALETTE.earthMuted,
              maxWidth: 440,
              lineHeight: 1.45,
            }}
          >
            Photo, prompt, generate, frame.
          </p>
        </div>

        {/* ── Credits / status pill ─────────────────────────────────── */}
        <div className="flex justify-center mb-4">
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

        {/* ── Compose phase: upload stack + name previews + prompt ────
            Only rendered when studioPhase === 'compose'. Once the customer
            hits Generate, this whole block fades out and the GenerationCanvas
            / ApprovalGate / cart UI take its place — that's the "single
            focal area" experience Danny asked for. State (pets, prompt) is
            preserved across the unmount because it lives in StudioFlow's own
            useState hooks, so a Tweak click brings it back intact.

            NOTE: no mode="wait" — we DON'T want to delay the new compose
            subtree's mount behind the old subtree's exit anim, because that
            keeps promptRef null while handleTweak's focus useEffect is
            looking for it. Without mode="wait", old subtree exits and new
            subtree mounts in parallel (crossfade). The focus useEffect can
            then see the live promptRef as soon as compose enters. */}
        <AnimatePresence>
        {studioPhase === 'compose' && (
        <motion.div
          key="compose"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8, transition: { duration: 0.32, ease: EASE.out } }}
          transition={sectionTransition}
        >
        {/* ── Multi-pet upload stack ──────────────────────────────────
            One PetUploadCard per pet (photo + name input). Cap at MAX_PETS.
            "+ Add another pet" button below; per-card "×" delete affordance. */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={sectionTransition}
          className="space-y-3"
        >
          <AnimatePresence initial={false}>
            {pets.map((p, idx) => (
              <PetUploadCard
                key={p.id}
                pet={p}
                index={idx + 1}
                onChange={(next) => updatePet(p.id, next)}
                onDelete={() => removePet(p.id)}
                canDelete={pets.length > 1}
                errorMessage={petErrors[p.id]}
              />
            ))}
          </AnimatePresence>

          {/* "+ Add another pet" — disabled at MAX_PETS with tooltip. */}
          <button
            type="button"
            onClick={addPet}
            disabled={pets.length >= MAX_PETS}
            title={
              pets.length >= MAX_PETS
                ? `Up to ${MAX_PETS} pets per portrait — beyond that, recognition drops.`
                : "Add another pet to this portrait"
            }
            className="w-fit ml-auto rounded-full px-3.5 py-2 transition-all disabled:opacity-50 active:scale-[0.99] flex items-center justify-center gap-2"
            style={{
              background: "transparent",
              border: `1px solid ${PALETTE.sandDeep}`,
              color: PALETTE.earth,
              fontFamily: "Asap, system-ui, sans-serif",
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            <Plus className="w-[16px] h-[16px]" strokeWidth={2.4} />
            {pets.length >= MAX_PETS
              ? `${MAX_PETS}-pet max`
              : `Add pet (${pets.length}/${MAX_PETS})`}
          </button>
        </motion.div>

        {/* ── On-canvas typography preview ──────────────────────────────
            One chip per named pet, side-by-side. Same look as the prior
            single-pet preview, just rendered per pet. Uses the first
            generated variant as the chip background once available. */}
        <AnimatePresence initial={false}>
          {pets.some((p) => canvasPetName(p).length > 0) && (
            <motion.div
              key="petname-previews"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.36, ease: EASE.out }}
              className="mt-5 flex items-start gap-3 flex-wrap px-1.5"
              aria-live="polite"
            >
              {pets
                .filter((p) => canvasPetName(p).length > 0)
                .map((p) => (
                  <div key={p.id} className="flex items-center gap-2.5">
                    <div
                      className="relative shrink-0 overflow-hidden"
                      style={{
                        width: 76,
                        height: 96,
                        borderRadius: 8,
                        background: selectedVariantUrl
                          ? "#000"
                          : `linear-gradient(160deg, ${PALETTE.cosmosMid} 0%, ${PALETTE.cosmos} 100%)`,
                        border: `1px solid ${PALETTE.sandDeep}`,
                        boxShadow:
                          "0 6px 14px rgba(20,18,16,.08), inset 0 0 0 1px rgba(196,162,101,.18)",
                      }}
                      aria-hidden
                    >
                      {selectedVariantUrl ? (
                        <img
                          src={selectedVariantUrl}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                          style={{ opacity: 0.84 }}
                        />
                      ) : p.photoUrl ? (
                        <img
                          src={p.photoUrl}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                          style={{ opacity: 0.7 }}
                        />
                      ) : (
                        <div
                          className="absolute inset-0"
                          style={{
                            background:
                              "radial-gradient(80% 60% at 50% 35%, rgba(196,162,101,.22) 0%, transparent 60%)",
                          }}
                        />
                      )}
                      {/* Soft bottom scrim so the name reads cleanly */}
                      <div
                        className="absolute left-0 right-0 bottom-0"
                        style={{
                          height: "46%",
                          background:
                            "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.55) 100%)",
                        }}
                      />
                      <div
                        className="absolute left-0 right-0 bottom-1 px-1.5 text-center"
                        style={{
                          fontFamily: '"Cormorant", "Cormorant Garamond", Georgia, serif',
                          fontStyle: "italic",
                          fontWeight: 500,
                          fontSize: 12,
                          letterSpacing: "0.02em",
                          color: "#fdf6e3",
                          textShadow: "0 1px 2px rgba(0,0,0,.5)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        <span style={{ color: PALETTE.goldSoft, marginRight: 3 }}>·</span>
                        {canvasPetName(p)}
                        <span style={{ color: PALETTE.goldSoft, marginLeft: 3 }}>·</span>
                      </div>
                    </div>
                  </div>
                ))}
              <p
                className="self-center"
                style={{
                  fontFamily: "Assistant, system-ui, sans-serif",
                  fontSize: 12.5,
                  color: PALETTE.earthMuted,
                  lineHeight: 1.5,
                  maxWidth: 280,
                }}
              >
                Roughly how each name will appear on the canvas.{" "}
                <span style={{ color: PALETTE.earthSubtle }}>
                  Position and proportions are finalised during print preparation.
                </span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Premium prompt box — always visible (Generate gated by !!photoUrl) ─ */}
        <AnimatePresence>
          {true && (
            <motion.div
              key="prompt"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={sectionTransition}
              className="mt-5"
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
                  borderRadius: 18,
                  boxShadow: focused
                    ? "0 0 0 4px rgba(191, 82, 74, 0.08), 0 24px 48px rgba(20, 18, 16, 0.10), 0 4px 12px rgba(20, 18, 16, 0.04)"
                    : "0 18px 38px rgba(20, 18, 16, 0.06), 0 2px 6px rgba(20, 18, 16, 0.03)",
                  transition: "box-shadow 240ms, border-color 240ms, background 240ms",
                }}
              >
                <textarea
                  ref={promptRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value.slice(0, 400))}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder={placeholder + (prompt.length === 0 && !focused ? "▎" : "")}
                  rows={2}
                  className="w-full resize-none bg-transparent outline-none px-5 pt-5 pb-1.5"
                  style={{
                    fontFamily: 'Assistant, system-ui, sans-serif',
                    fontSize: 16,
                    color: PALETTE.ink,
                    lineHeight: 1.55,
                    letterSpacing: "-0.005em",
                  }}
                />

                <div className="flex items-center justify-between px-3 pb-3 pt-1">
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
              {uploadedPets.length === 0 && (
                <p
                  className="text-center mt-3 px-2"
                  style={{
                    fontFamily: 'Assistant, system-ui, sans-serif',
                    fontSize: 13,
                    color: PALETTE.earthMuted,
                    lineHeight: 1.5,
                  }}
                >
                  Upload {pets.length > 1 ? "at least one pet's photo above" : "your pet's photo above"} to generate. Pick your canvas size &amp; frame after.
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
                      className="rounded-2xl p-3"
                      style={{
                        background: PALETTE.cream,
                        border: `1px solid ${PALETTE.sand}`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p style={{ fontFamily: 'Asap, system-ui, sans-serif', fontSize: 14, fontWeight: 600, color: PALETTE.ink }}>
                            Prompt ideas
                          </p>
                          <p style={{ fontFamily: 'Assistant, system-ui, sans-serif', fontSize: 12, color: PALETTE.earthMuted, marginTop: 2, lineHeight: 1.35 }}>
                            Pick a starting point, then make it yours.
                          </p>
                        </div>
                        <button onClick={() => setHelpOpen(false)} className="-mr-1 -mt-1 p-1 rounded-md hover:bg-black/5" aria-label="Close">
                          <X className="w-4 h-4" style={{ color: PALETTE.earthMuted }} />
                        </button>
                      </div>
                      <p style={{ fontFamily: 'Assistant, system-ui, sans-serif', fontSize: 11, color: PALETTE.earthMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                        Tap any to use:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {PROMPT_CHIPS.map((chip) => (
                          <button
                            key={chip.label}
                            type="button"
                            onClick={() => { setPrompt(chip.prompt); setHelpOpen(false); }}
                            className="text-left rounded-full px-3 py-1.5 transition-colors hover:bg-black/[0.03]"
                            style={{
                              background: PALETTE.cream2,
                              border: `1px solid ${PALETTE.sand}`,
                              color: PALETTE.ink,
                              fontFamily: 'Assistant, system-ui, sans-serif',
                              fontSize: 12.5,
                            }}
                          >
                            {chip.label}
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
        </motion.div>
        )}
        </AnimatePresence>

        {/* ── Generating phase: cinematic in-progress canvas ─────────
            Takes the place of the compose UI (which has just exited).
            Larger, centered, the only thing on screen besides the
            heading + credits pill. The dim-sections-during-generate
            behaviour in Portraits.tsx isolates focus further. */}
        <AnimatePresence>
          {studioPhase === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.36, ease: EASE.out }}
              className="mt-6 mx-auto"
              style={{ maxWidth: 540 }}
            >
              <GenerationCanvas />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Approval gate (Reveal step) ─────────────────────────────
            After variants return, customer must explicitly approve before
            the size/frame picker + cart UI become visible. This matches the
            Crown & Paw "preview & approve before print" pattern (research
            doc §8 Screen 5). Resets to false on any pet/prompt change. */}
        <div ref={approvalRef} style={{ scrollMarginTop: "80px" }} />
        <AnimatePresence>
          {!generating && variants.length > 0 && !approved && selectedVariantUrl && (
            <motion.div
              key="approval"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={sectionTransition}
              className="mt-6"
            >
              <ApprovalGate
                previewUrl={selectedVariantUrl}
                generationCount={generationCount}
                creditsRemaining={generationsRemaining}
                busy={generating}
                onApprove={handleApprove}
                onTryAgain={handleTryAgain}
                onTweak={handleTweak}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Variants + size + cart (post-approval) ─────────────────── */}
        <div ref={variantsRef} style={{ scrollMarginTop: "80px" }} />
        <AnimatePresence>
          {!generating && variants.length > 0 && approved && (
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
                className="rounded-2xl p-4 md:p-5"
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
                  compact
                />

                <div
                  className="my-4"
                  style={{ height: 1, background: PALETTE.sand }}
                />

                <p
                  className="text-center mb-3"
                  style={{
                    fontFamily: 'Asap, system-ui, sans-serif',
                    fontSize: 11,
                    fontWeight: 700,
                    color: PALETTE.earthMuted,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                  }}
                >
                  Choose your canvas size
                </p>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
                  {CANVAS_SIZES.map((s) => {
                    const active = sizeKey === s.uid;
                    const isHero = !!s.hero;
                    return (
                      <button
                        key={s.uid}
                        onClick={() => setSizeKey(s.uid)}
                        aria-pressed={active}
                        className="rounded-xl px-2 py-2.5 text-center transition-all relative"
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
                        <div style={{ fontSize: 12.5, fontWeight: 600 }}>{s.label}</div>
                        <div
                          className="tabular-nums mt-0.5"
                          style={{
                            fontSize: 11.5,
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
                  className="text-center mt-4 mb-2.5"
                  style={{
                    fontFamily: 'Asap, system-ui, sans-serif',
                    fontSize: 11,
                    fontWeight: 700,
                    color: PALETTE.earthMuted,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                  }}
                >
                  Choose frame colour
                </p>
                <div className="flex justify-center gap-3">
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
                            width: 46,
                            height: 46,
                            padding: 3,
                            background: active ? PALETTE.roseSoft : "transparent",
                            border: active ? `2px solid ${PALETTE.rose}` : "2px solid transparent",
                            boxShadow: active ? "0 6px 14px rgba(191, 82, 74, 0.18)" : "none",
                          }}
                        >
                          <span
                            className={`rounded-full flex items-center justify-center ${active ? "ls-glint" : ""}`}
                            style={{
                              width: 34,
                              height: 34,
                              background: c.swatchHex,
                              border: `1.5px solid ${PALETTE.sandDeep}`,
                              boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.4)",
                            }}
                          >
                            {active && (
                              <Check className="w-4 h-4" strokeWidth={3} style={{ color: PALETTE.cream, position: "relative", zIndex: 1 }} />
                            )}
                          </span>
                        </span>
                        <span
                          style={{
                            fontFamily: 'Assistant, system-ui, sans-serif',
                            fontSize: 11.5,
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
                  className="mt-4 w-full rounded-xl py-3.5 transition-all disabled:opacity-40 inline-flex items-center justify-center gap-2"
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
                  {preparingPrintMaster ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
                      Preparing print master…
                    </>
                  ) : (
                    <>
                      {cartAddCount > 0 ? "Add another to cart" : "Add to cart"}
                      {variant ? ` · £${variant.priceMajor}` : ""}
                    </>
                  )}
                </button>
                {preparingPrintMaster && (
                  <p
                    className="text-center mt-2"
                    style={{
                      fontFamily: 'Assistant, system-ui, sans-serif',
                      fontSize: 12,
                      color: PALETTE.earthMuted,
                      lineHeight: 1.4,
                    }}
                    aria-live="polite"
                  >
                    Generating a print-grade version at {variant?.sizeLabel ?? "your size"} — usually 10–20 seconds.
                  </p>
                )}
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
