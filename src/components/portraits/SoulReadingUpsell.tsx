/**
 * SoulReadingUpsell — in-cart upsell card for the Little Souls Reading add-on.
 *
 * Renders inside CartDrawer between the line items and the footer.
 *   • Hidden when no portrait line items in cart (no point upselling on an
 *     empty or reading-only cart).
 *   • Hidden if a Little Souls Reading is already in the cart.
 *   • Primary action = quick-add (no intake at checkout; their birth details are
 *     captured on a private page after payment). Customer can expand the form to
 *     fill the details in now instead.
 *
 * Design (2026-06-27, Danny-approved): cosmos hero + emotion-first copy + a
 * small "their real chart" authority chip with an info dot that explains the
 * calculation engine (VSOP87 + ELP2000 via astronomia). Sacred copy: no "AI",
 * no "report"; it is a "Little Souls Reading"; honour the astrology.
 * Hero/chip art: public/reading/cosmos.webp + public/reading/almanac.webp.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check, X, Info } from "lucide-react";
import { toast } from "sonner";
import { EASE } from "./tokens";
import type { CartItem } from "./cart";
import {
  SOUL_READING_VARIANT_ID,
  SOUL_READING_PRODUCT_ID,
  SOUL_READING_PRICE_MAJOR,
  isSoulReadingItem,
  buildSoulReadingCartItem,
  buildSoulReadingCartItemQuickAdd,
} from "./soulReading";

interface SoulReadingUpsellProps {
  /** Current cart — detect a portrait, pre-fill pet name, hide if already added. */
  cart: CartItem[];
  /** Add a Little Souls Reading line item. Parent persists + fires emitCartChanged(). */
  onAdd: (item: CartItem) => void;
}

// Warm Little Souls palette (locked) — kept local so the card reads premium
// regardless of the lighter tokens.ts surface palette.
const C = {
  cream: "#FFFDF5", cream2: "#faf4e8", paper: "#fffaf1",
  rose: "#bf524a", roseDeep: "#9c3d36", roseSoft: "#fbeae8",
  gold: "#c4a265", goldDeep: "#8b6f3a", goldSoft: "#f3e7cf",
  ink: "#141210", body: "#5a4a42", mutedText: "#6f6155", muted: "#958779",
  sand: "#e8ddd0", night: "#161a24",
} as const;
const DISP = "'Fraunces', Georgia, serif";
const UI = "'Assistant', system-ui, sans-serif";

const SESSION_PET_KEY = "portraits.lastPet";
// Anchor price the £40 is shown against (was £60).
const ANCHOR_MAJOR = 60;

/** Pull a pre-fill pet name out of cart line items or sessionStorage. */
function getPrefillPetName(cart: CartItem[]): string {
  for (const it of cart) {
    if (
      it.productType !== "framed-canvas" &&
      it.productType !== "canvas" &&
      (it.productType as string) !== "digital"
    ) continue;
    const props = (it as unknown as { properties?: Record<string, string> }).properties;
    if (props && typeof props._pet_name === "string" && props._pet_name.trim()) {
      return props._pet_name.trim();
    }
  }
  if (typeof window !== "undefined") {
    try {
      const last = window.sessionStorage.getItem(SESSION_PET_KEY);
      if (last) {
        const parsed = JSON.parse(last);
        if (parsed && typeof parsed.name === "string" && parsed.name.trim()) {
          return parsed.name.trim();
        }
      }
    } catch {
      /* malformed sessionStorage — silent */
    }
  }
  return "";
}

/** Validate a `<input type="date">` value. */
function dobError(value: string): string | null {
  if (!value) return "Required";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return "Use a valid date";
  const dob = new Date(parsed);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (dob.getTime() > today.getTime()) return "Must be in the past";
  const earliest = new Date();
  earliest.setFullYear(earliest.getFullYear() - 60);
  if (dob.getTime() < earliest.getTime()) return "Within the last 60 years";
  return null;
}

function nameError(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Required";
  if (trimmed.length > 40) return "Max 40 characters";
  return null;
}

function locationError(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Required";
  if (trimmed.length < 2) return "Too short";
  if (trimmed.length > 200) return "Max 200 characters";
  return null;
}

export function SoulReadingUpsell({ cart, onAdd }: SoulReadingUpsellProps) {
  // ⚠ RULES OF HOOKS: every hook below MUST run on every render. The early
  // returns based on hasCanvas / hasSoulReading happen AFTER all hooks.
  const reduce = !!useReducedMotion();

  const hasCanvas = useMemo(
    () => cart.some((it) =>
      it.productType === "framed-canvas" ||
      it.productType === "canvas" ||
      (it.productType as string) === "digital"
    ),
    [cart],
  );
  const hasSoulReading = useMemo(() => cart.some(isSoulReadingItem), [cart]);
  const prefillName = useMemo(() => getPrefillPetName(cart), [cart]);

  const [open, setOpen] = useState(false);
  const [petName, setPetName] = useState(prefillName);
  const [petDob, setPetDob] = useState("");
  const [petBirthLocation, setPetBirthLocation] = useState("");
  const [confirmation, setConfirmation] = useState(false);

  const userTouchedRef = useRef(false);
  useEffect(() => {
    if (userTouchedRef.current) return;
    setPetName(prefillName);
  }, [prefillName]);

  useEffect(() => {
    if (!confirmation) return;
    const id = window.setTimeout(() => setConfirmation(false), 2000);
    return () => window.clearTimeout(id);
  }, [confirmation]);

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const minDob = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 60);
    return d.toISOString().slice(0, 10);
  }, []);

  const [touched, setTouched] = useState<{ name?: boolean; dob?: boolean; loc?: boolean }>({});
  const eName = nameError(petName);
  const eDob = dobError(petDob);
  const eLoc = locationError(petBirthLocation);
  const formValid = !eName && !eDob && !eLoc;

  const canvasRef = useMemo(() => {
    const firstCanvas = cart.find((it) =>
      it.productType === "framed-canvas" ||
      it.productType === "canvas" ||
      (it.productType as string) === "digital"
    );
    if (firstCanvas) return firstCanvas.id;
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    return `ref-${Math.random().toString(36).slice(2, 10)}`;
  }, [cart]);

  // Hidden states — MUST stay after every hook (React error #300 otherwise).
  if (!hasCanvas) return null;
  if (hasSoulReading) return null;

  function quickAdd() {
    try {
      const item = buildSoulReadingCartItemQuickAdd(canvasRef, prefillName);
      onAdd(item);
      setConfirmation(true);
    } catch {
      toast.error("We couldn't add the reading just now. Please try again.");
    }
  }

  function handleSubmit() {
    setTouched({ name: true, dob: true, loc: true });
    if (!formValid) return;
    const item = buildSoulReadingCartItem({
      petName: petName.trim(),
      petDob,
      petBirthLocation: petBirthLocation.trim(),
      canvasOrderRef: canvasRef,
    });
    onAdd(item);
    setOpen(false);
    setPetDob("");
    setPetBirthLocation("");
    setTouched({});
    setConfirmation(true);
  }

  return (
    <section
      aria-labelledby="soul-reading-upsell-title"
      className="mx-5 my-4"
      style={{
        borderRadius: 20,
        overflow: "hidden",
        position: "relative",
        background: C.paper,
        border: `1px solid ${C.sand}`,
        boxShadow: "0 1px 1px rgba(20,18,16,.04), 0 10px 22px -10px rgba(20,18,16,.18), 0 36px 64px -42px rgba(20,18,16,.42)",
      }}
    >
      {/* ── Hero: the real sky the night they were born ─────────────── */}
      <div style={{ position: "relative", height: 176, overflow: "hidden" }}>
        <img
          src="/reading/cosmos.webp"
          width={1000}
          height={563}
          alt="A deep night sky with a warm moon, the night they were born"
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 62%", display: "block" }}
          loading="lazy"
          decoding="async"
        />
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(13,15,22,0) 52%,rgba(13,15,22,.5) 100%)" }} />
        <div style={{ position: "absolute", left: 18, bottom: 13, zIndex: 1, color: "#f1e9da", fontFamily: DISP, fontStyle: "italic", fontWeight: 400, fontSize: 14, letterSpacing: ".01em", textShadow: "0 1px 10px rgba(0,0,0,.55)" }}>
          The real sky, <em style={{ fontStyle: "italic", color: "#e7cd96" }}>the night they were born</em>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div style={{ padding: "20px 20px 22px" }}>
        <p style={{ fontFamily: UI, fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase", color: C.goldDeep, fontWeight: 700, margin: "0 0 10px" }}>
          Little Souls Reading
        </p>
        <h3 id="soul-reading-upsell-title" style={{ fontFamily: DISP, fontWeight: 600, color: C.ink, fontSize: 24, lineHeight: 1.16, letterSpacing: "-.015em", margin: "0 0 12px" }}>
          You know their face by heart. This is the rest of them.
        </h3>
        <p style={{ fontFamily: UI, fontSize: 16, lineHeight: 1.55, color: C.body, margin: 0 }}>
          The reasons behind the moods. Why they chose <span style={{ color: C.rose, fontWeight: 700 }}>you</span>, out of everyone. What settles them when nothing else will.
        </p>

        {/* authority chip + info dot */}
        <AuthorityRow />

        {/* price */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 11, margin: "20px 0 0" }}>
          <span style={{ fontFamily: DISP, fontWeight: 600, color: C.rose, fontVariantNumeric: "tabular-nums", lineHeight: 1, fontSize: 32 }}>£{SOUL_READING_PRICE_MAJOR}</span>
          <span style={{ color: C.mutedText, textDecoration: "line-through", textDecorationThickness: "1.5px", fontWeight: 600, fontFamily: DISP, fontSize: 18 }}>£{ANCHOR_MAJOR}</span>
          <span style={{ marginLeft: "auto", alignSelf: "center", fontSize: 12, color: C.mutedText, fontFamily: UI }}>added to this order</span>
        </div>

        {/* confirmation */}
        <AnimatePresence>
          {confirmation && (
            <motion.div
              key="srconfirm"
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={reduce ? { duration: 0 } : { duration: 0.22, ease: EASE.out }}
              style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "rgba(191,82,74,.08)", border: "1px solid rgba(191,82,74,.25)", borderRadius: 10, fontFamily: UI, fontSize: 13.5, fontWeight: 600, color: C.rose }}
            >
              <Check size={14} strokeWidth={2.4} /> Their reading is in the order
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA or inline form */}
        <AnimatePresence initial={false} mode="wait">
          {!open ? (
            <motion.div
              key="cta"
              initial={false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.16 }}
            >
              <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); quickAdd(); }} style={ctaStyle}>
                Add their reading <span aria-hidden style={{ opacity: 0.8 }}>·</span> £{SOUL_READING_PRICE_MAJOR}
              </button>
              <p style={{ fontFamily: UI, fontSize: 13, color: C.mutedText, lineHeight: 1.5, margin: "11px 0 0", textAlign: "center" }}>
                Opens as a private page, minutes after you order.{" "}
                <button type="button" onClick={() => setOpen(true)} style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", color: C.rose, fontFamily: "inherit", fontSize: "inherit", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2 }}>
                  Add their details now
                </button>
              </p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
              initial={reduce ? false : { opacity: 0, height: 0 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, height: "auto" }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.28, ease: EASE.out }}
              style={{ marginTop: 16, overflow: "hidden" }}
            >
              <UpsellField label="Their name" value={petName} onChange={(v) => { userTouchedRef.current = true; setPetName(v); }} onBlur={() => setTouched((t) => ({ ...t, name: true }))} error={touched.name ? eName : null} maxLength={40} placeholder="Bella" autoFocus />
              <UpsellField label="The day they were born" type="date" value={petDob} onChange={setPetDob} onBlur={() => setTouched((t) => ({ ...t, dob: true }))} error={touched.dob ? eDob : null} min={minDob} max={todayIso} />
              <UpsellField label="Where they were born" value={petBirthLocation} onChange={setPetBirthLocation} onBlur={() => setTouched((t) => ({ ...t, loc: true }))} error={touched.loc ? eLoc : null} maxLength={200} placeholder="City, country" />

              <div style={{ display: "flex", alignItems: "center", gap: 11, marginTop: 6 }}>
                <button type="submit" disabled={!formValid} style={{ ...ctaStyle, flex: 1, margin: 0, opacity: formValid ? 1 : 0.55, cursor: formValid ? "pointer" : "not-allowed", background: formValid ? "linear-gradient(180deg,#c5564d,#bf524a)" : "rgba(191,82,74,.5)", boxShadow: formValid ? ctaStyle.boxShadow : "none" }}>
                  Add their reading · £{SOUL_READING_PRICE_MAJOR}
                </button>
                <button type="button" onClick={() => { setOpen(false); setTouched({}); }} aria-label="Close the details form" style={{ flexShrink: 0, background: "transparent", border: `1px solid ${C.sand}`, borderRadius: 12, width: 44, height: 44, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.muted }}>
                  <X size={16} strokeWidth={2} />
                </button>
              </div>
              <p style={{ fontFamily: UI, fontSize: 12.5, color: C.mutedText, lineHeight: 1.45, marginTop: 9 }}>
                Don't have the exact day? Add it later from your private page.
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      <span hidden data-soul-reading-variant-id={SOUL_READING_VARIANT_ID} data-soul-reading-product-id={SOUL_READING_PRODUCT_ID} />
    </section>
  );
}

const ctaStyle: CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
  border: "none", cursor: "pointer", borderRadius: 14, fontFamily: UI, fontWeight: 700, fontSize: 16,
  letterSpacing: ".005em", minHeight: 54, padding: "15px 20px", marginTop: 14,
  background: "linear-gradient(180deg,#c5564d,#bf524a)", color: "#fff",
  boxShadow: "0 1px 1px rgba(20,18,16,.10), 0 14px 26px -8px rgba(156,61,54,.45)",
};

/* ─── Authority row: engraved chart chip + "i" engine explainer ─────────── */
function AuthorityRow() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: "relative", display: "flex", gap: 14, alignItems: "center", margin: "16px 0 2px", padding: 13, border: `1px solid ${C.goldSoft}`, borderRadius: 14, background: `linear-gradient(180deg,#fffdf6,${C.paper})` }}>
      <div style={{ position: "relative", width: 60, height: 60, flex: "none", borderRadius: 8, overflow: "hidden", boxShadow: "0 8px 18px -10px rgba(20,18,16,.5)", outline: `1px solid rgba(196,162,101,.6)`, outlineOffset: -1 }}>
        <img src="/reading/almanac.webp" width={520} height={520} alt="Their birth chart, drawn from the real sky" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" decoding="async" />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "0 0 4px" }}>
          <span style={{ fontFamily: UI, fontSize: 11, letterSpacing: ".13em", textTransform: "uppercase", color: C.goldDeep, fontWeight: 700 }}>Their real chart</span>
          <button
            type="button"
            aria-label="How the reading is calculated"
            aria-expanded={open}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, padding: 0, border: "none", background: "transparent", color: C.goldDeep, cursor: "pointer" }}
          >
            <Info size={15} strokeWidth={2} />
          </button>
        </div>
        <p style={{ fontFamily: UI, fontSize: 15.5, lineHeight: 1.42, color: C.body, margin: 0 }}>
          Read from where every planet truly stood the day they were born. <strong style={{ color: C.ink, fontWeight: 600 }}>Not a star sign.</strong>
        </p>
      </div>

      {open && (
        <div
          role="tooltip"
          style={{ position: "absolute", left: 12, right: 12, bottom: "calc(100% + 8px)", zIndex: 30, background: C.ink, color: "#f4ece0", borderRadius: 12, padding: "12px 14px", fontFamily: UI, fontSize: 13, lineHeight: 1.5, boxShadow: "0 16px 34px -12px rgba(20,18,16,.65)" }}
        >
          Not a generic star sign. We place the Sun, Moon and every planet exactly where they stood the day they were born, using VSOP87 and ELP2000, the same planetary and lunar models astronomers use for real star charts. Their chart is true to the degree.
        </div>
      )}
    </div>
  );
}

/* ─── Field row ───────────────────────────────────────────────────────── */
interface UpsellFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string | null;
  type?: "text" | "date";
  placeholder?: string;
  maxLength?: number;
  min?: string;
  max?: string;
  autoFocus?: boolean;
}

function UpsellField({ label, value, onChange, onBlur, error, type = "text", placeholder, maxLength, min, max, autoFocus }: UpsellFieldProps) {
  const hasError = !!error;
  return (
    <label className="block" style={{ marginBottom: 12 }}>
      <span style={{ display: "block", fontFamily: UI, fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: C.muted, marginBottom: 4 }}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        min={min}
        max={max}
        autoFocus={autoFocus}
        style={{ width: "100%", padding: "11px 12px", background: "#fff", border: `1px solid ${hasError ? C.rose : C.sand}`, borderRadius: 9, fontFamily: UI, fontSize: 16, color: C.ink, outline: "none", transition: "border-color 120ms ease" }}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${label.replace(/\s+/g, "-")}-error` : undefined}
      />
      {hasError && (
        <span id={`${label.replace(/\s+/g, "-")}-error`} style={{ display: "block", marginTop: 4, fontFamily: UI, fontSize: 11.5, color: C.rose }}>
          {error}
        </span>
      )}
    </label>
  );
}

export default SoulReadingUpsell;
