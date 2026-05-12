/**
 * SoulReadingUpsell — in-cart upsell card for the Soul Reading digital add-on.
 *
 * Phase 2 of the Cosmic Pet Portraits launch plan.
 * Spec source:
 *   vault/01-projects/little-souls/pet-portraits/research-2026-05-04-cart-upsell-ux.md §3
 *   vault/01-projects/little-souls/pet-portraits/research-2026-05-04-soul-reading-fulfilment.md §3
 *
 * Behaviour:
 *   • Renders inside CartDrawer between line items and footer.
 *   • Hidden when no canvas line items in cart (no point upselling on empty
 *     or Soul-Reading-only carts).
 *   • Hidden if a Soul Reading is already in the cart — instead the parent
 *     should show its details on the existing line item; we offer no second
 *     entry point to avoid duplicate readings.
 *   • Toggle ("Add Soul Reading →") expands an inline form with three required
 *     fields: Pet Name, Pet Date of Birth, Pet Birth Location.
 *   • Pet Name pre-fills from the first canvas line item's `_pet_name`
 *     property if any was set, else from sessionStorage `portraits.lastPet`,
 *     else blank.
 *   • Inline validation (no submit-time errors): CTA stays disabled until
 *     all fields valid. DOB must parse, must be in past, within last 60 yrs.
 *   • On valid submit: calls `onAdd()` with a properly-shaped CartItem.
 *   • Success: form collapses, "✓ Soul Reading added" confirmation shows
 *     for 2s, parent fires emitCartChanged().
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Sparkles, Check, X } from "lucide-react";
import { PALETTE, EASE } from "./tokens";
import type { CartItem } from "./cart";
import {
  SOUL_READING_VARIANT_ID,
  SOUL_READING_PRODUCT_ID,
  SOUL_READING_PRICE_MAJOR,
  SOUL_READING_TITLE,
  isSoulReadingItem,
  buildSoulReadingCartItem,
  buildSoulReadingCartItemQuickAdd,
} from "./soulReading";

interface SoulReadingUpsellProps {
  /** Current cart, used to (a) detect whether a canvas exists, (b) pre-fill
   *  pet name from any canvas line item, (c) hide if Soul Reading already
   *  added. */
  cart: CartItem[];
  /** Callback to add a Soul Reading line item. Parent updates state + persists
   *  + fires emitCartChanged(). */
  onAdd: (item: CartItem) => void;
}

const SESSION_PET_KEY = "portraits.lastPet";

/** Pull a pre-fill pet name out of cart line items or sessionStorage. */
function getPrefillPetName(cart: CartItem[]): string {
  // 1. Look at canvas line items for a `_pet_name` property if any of them
  //    carry it (StudioFlow doesn't yet — but the field is here so it'll
  //    Just Work the moment it does).
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
  // 2. sessionStorage fallback (set by some other surface, e.g. quiz funnel).
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
  // ⚠ RULES OF HOOKS: every hook below MUST run on every render. Early-
  // returns based on `hasCanvas` / `hasSoulReading` happen AFTER all hooks
  // are called — moving them above the hooks causes React error #300
  // (hook count mismatch when the upsell disappears after Soul Reading is
  // added). Bug repro: 2026-05-12.
  const reduce = !!useReducedMotion();

  // Derived flags from cart contents.
  // Upsell renders when ANY portrait product is in the cart — unframed canvas,
  // framed canvas, OR digital download. Pre-2026-05-12 this was framed-only,
  // which meant customers buying the new default (unframed canvas) never saw
  // the upsell. Same logic for the canvasRef fallback below.
  const hasCanvas = useMemo(
    () => cart.some((it) =>
      it.productType === "framed-canvas" ||
      it.productType === "canvas" ||
      (it.productType as string) === "digital"
    ),
    [cart],
  );
  const hasSoulReading = useMemo(
    () => cart.some(isSoulReadingItem),
    [cart],
  );

  // Pre-fill name from cart on first mount (or whenever cart changes the
  // prefill source — cheap recompute).
  const prefillName = useMemo(() => getPrefillPetName(cart), [cart]);

  // Form state.
  const [open, setOpen] = useState(false);
  const [petName, setPetName] = useState(prefillName);
  const [petDob, setPetDob] = useState("");
  const [petBirthLocation, setPetBirthLocation] = useState("");
  const [confirmation, setConfirmation] = useState(false);

  // Refresh prefilled name if cart changes (e.g. canvas added/removed) AND
  // the user hasn't typed anything else into the field yet. Keeps the
  // canvas → upsell flow in sync without overwriting user edits.
  const userTouchedRef = useRef(false);
  useEffect(() => {
    if (userTouchedRef.current) return;
    setPetName(prefillName);
  }, [prefillName]);

  // Auto-clear confirmation after 2s.
  useEffect(() => {
    if (!confirmation) return;
    const id = window.setTimeout(() => setConfirmation(false), 2000);
    return () => window.clearTimeout(id);
  }, [confirmation]);

  // Today's date in YYYY-MM-DD for the DOB input's `max` attribute.
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const minDob = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 60);
    return d.toISOString().slice(0, 10);
  }, []);

  // Inline validation errors. Show only after a field has been touched OR
  // form has been submitted-attempt — keeps the empty form quiet.
  const [touched, setTouched] = useState<{ name?: boolean; dob?: boolean; loc?: boolean }>({});
  const eName = nameError(petName);
  const eDob = dobError(petDob);
  const eLoc = locationError(petBirthLocation);
  const formValid = !eName && !eDob && !eLoc;

  // Build canvas ref UUID. Prefer linking to the FIRST canvas item's id so
  // the order-paid webhook can correlate. Fallback to fresh UUID.
  const canvasRef = useMemo(() => {
    const firstCanvas = cart.find((it) =>
      it.productType === "framed-canvas" ||
      it.productType === "canvas" ||
      (it.productType as string) === "digital"
    );
    if (firstCanvas) return firstCanvas.id;
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `ref-${Math.random().toString(36).slice(2, 10)}`;
  }, [cart]);

  // Hidden states — MUST be after all hooks above. React error #300 fires
  // if hooks are skipped on a re-render where the early-return now hits.
  if (!hasCanvas) return null;
  if (hasSoulReading) return null;

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

    // Collapse + reset (everything except the petName which we leave so it
    // stays cohesive if the customer toggles back).
    setOpen(false);
    setPetDob("");
    setPetBirthLocation("");
    setTouched({});
    setConfirmation(true);
  }

  return (
    <section
      aria-labelledby="soul-reading-upsell-title"
      className="mx-6 my-4 rounded-2xl"
      style={{
        background: "#FFFAF3",
        border: `1.5px dashed ${PALETTE.rose}`,
        padding: "16px 18px",
      }}
    >
      {/* ── Header row ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <span
            aria-hidden
            className="flex-shrink-0"
            style={{
              width: 28,
              height: 28,
              borderRadius: 9999,
              background: "rgba(191, 82, 74, 0.10)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: PALETTE.rose,
              marginTop: 2,
            }}
          >
            <Sparkles size={16} strokeWidth={2} />
          </span>
          <h3
            id="soul-reading-upsell-title"
            style={{
              fontFamily: '"Georgia", "Cormorant", serif',
              fontSize: 18,
              lineHeight: 1.25,
              fontWeight: 600,
              color: PALETTE.ink,
              letterSpacing: "-0.005em",
            }}
          >
            Add a Soul Reading
            <span style={{ color: PALETTE.earthMuted, fontWeight: 400, marginLeft: 6 }}>
              — £{SOUL_READING_PRICE_MAJOR}
            </span>
          </h3>
        </div>
        {/* Trailing price chip */}
        <span
          aria-hidden
          style={{
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            padding: "4px 10px",
            background: PALETTE.rose,
            color: "#fff",
            borderRadius: 9999,
            fontFamily: "Asap, system-ui, sans-serif",
            fontSize: 13,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.01em",
          }}
        >
          +£{SOUL_READING_PRICE_MAJOR}
        </span>
      </div>

      {/* ── Body lead ─────────────────────────────────────────────────── */}
      <p
        style={{
          marginTop: 10,
          fontFamily: "Assistant, system-ui, sans-serif",
          fontSize: 13.5,
          lineHeight: 1.5,
          color: PALETTE.earth,
        }}
      >
        A personalised astrological reading for your pet — based on their birth
        date, location, and your photo. Generated in minutes, treasured forever.
      </p>

      {/* ── Trust line ────────────────────────────────────────────────── */}
      <ul
        className="flex flex-wrap gap-x-3 gap-y-1"
        style={{
          marginTop: 8,
          listStyle: "none",
          padding: 0,
          fontFamily: "Assistant, system-ui, sans-serif",
          fontSize: 11.5,
          color: PALETTE.earthMuted,
          letterSpacing: "0.01em",
        }}
      >
        <li>
          <span style={{ color: PALETTE.rose, marginRight: 4 }}>✓</span>
          £{SOUL_READING_PRICE_MAJOR} today, normally £60
        </li>
        <li>
          <span style={{ color: PALETTE.rose, marginRight: 4 }}>✓</span>
          Personal magic-link
        </li>
        <li>
          <span style={{ color: PALETTE.rose, marginRight: 4 }}>✓</span>
          Ready in ~10 min
        </li>
      </ul>

      {/* ── Confirmation toast ────────────────────────────────────────── */}
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
            style={{
              marginTop: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 12px",
              background: "rgba(191, 82, 74, 0.08)",
              border: `1px solid rgba(191, 82, 74, 0.25)`,
              borderRadius: 10,
              fontFamily: "Assistant, system-ui, sans-serif",
              fontSize: 13,
              fontWeight: 600,
              color: PALETTE.rose,
            }}
          >
            <Check size={14} strokeWidth={2.4} />
            Soul Reading added
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toggle button or inline form ──────────────────────────────── */}
      <AnimatePresence initial={false} mode="wait">
        {!open ? (
          <motion.div
            key="cta"
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.16 }}
            style={{ marginTop: 14 }}
          >
            {/* Primary: Quick add — no intake at checkout, magic link after payment.
                Customer can also expand the form to fill it in now. Crown & Paw
                style — get them through checkout fast, capture details async. */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  const item = buildSoulReadingCartItemQuickAdd(canvasRef);
                  console.log("[SoulReading Quick-add] dispatching item", item.id, item.productType);
                  onAdd(item);
                  setConfirmation(true);
                } catch (err) {
                  console.error("[SoulReading Quick-add] failed", err);
                  // Don't let the error bubble to the React error boundary —
                  // log + show a friendly toast instead.
                  if (typeof window !== "undefined") {
                    alert(`Could not add Soul Reading: ${(err as Error).message ?? "unknown error"}. Check console for details.`);
                  }
                }
              }}
              className="w-full transition-transform hover:scale-[1.005] active:scale-[0.997]"
              style={{
                background: PALETTE.rose,
                color: "#fff",
                fontFamily: "Asap, system-ui, sans-serif",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.01em",
                border: "none",
                borderRadius: 9999,
                padding: "11px 18px",
                cursor: "pointer",
                boxShadow: "0 8px 22px rgba(191, 82, 74, 0.22)",
              }}
            >
              Add to order — £{SOUL_READING_PRICE_MAJOR}
            </button>
            <p
              className="text-center"
              style={{
                marginTop: 8,
                fontFamily: "Assistant, system-ui, sans-serif",
                fontSize: 11.5,
                color: PALETTE.earthMuted,
                lineHeight: 1.4,
              }}
            >
              We'll email you a quick form for your pet's details after checkout.{" "}
              <button
                type="button"
                onClick={() => setOpen(true)}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  color: PALETTE.rose,
                  fontFamily: "inherit",
                  fontSize: "inherit",
                  textDecoration: "underline",
                  textUnderlineOffset: 2,
                }}
              >
                Or fill in now →
              </button>
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, height: "auto" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.28, ease: EASE.out }}
            style={{ marginTop: 14, overflow: "hidden" }}
          >
            <UpsellField
              label="Pet name"
              value={petName}
              onChange={(v) => {
                userTouchedRef.current = true;
                setPetName(v);
              }}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              error={touched.name ? eName : null}
              maxLength={40}
              placeholder="Bella"
              autoFocus
            />
            <UpsellField
              label="Pet date of birth"
              type="date"
              value={petDob}
              onChange={setPetDob}
              onBlur={() => setTouched((t) => ({ ...t, dob: true }))}
              error={touched.dob ? eDob : null}
              min={minDob}
              max={todayIso}
            />
            <UpsellField
              label="Pet birth location"
              value={petBirthLocation}
              onChange={setPetBirthLocation}
              onBlur={() => setTouched((t) => ({ ...t, loc: true }))}
              error={touched.loc ? eLoc : null}
              maxLength={200}
              placeholder="City, Country"
            />

            <div className="flex items-center justify-between gap-3" style={{ marginTop: 6 }}>
              <button
                type="submit"
                disabled={!formValid}
                className="transition-all hover:scale-[1.005] active:scale-[0.997] disabled:cursor-not-allowed"
                style={{
                  flex: 1,
                  background: formValid ? PALETTE.rose : "rgba(191, 82, 74, 0.45)",
                  color: "#fff",
                  fontFamily: "Asap, system-ui, sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: "0.01em",
                  border: "none",
                  borderRadius: 9999,
                  padding: "10px 18px",
                  cursor: formValid ? "pointer" : "not-allowed",
                  boxShadow: formValid
                    ? "0 8px 22px rgba(191, 82, 74, 0.22)"
                    : "none",
                  opacity: formValid ? 1 : 0.7,
                }}
              >
                Add Soul Reading to order
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setTouched({});
                }}
                aria-label="Cancel adding Soul Reading"
                style={{
                  flexShrink: 0,
                  background: "transparent",
                  border: `1px solid ${PALETTE.sand}`,
                  borderRadius: 9999,
                  width: 36,
                  height: 36,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: PALETTE.earthMuted,
                }}
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            <p
              style={{
                marginTop: 8,
                fontFamily: "Assistant, system-ui, sans-serif",
                fontSize: 11.5,
                color: PALETTE.earthMuted,
                lineHeight: 1.4,
              }}
            >
              Or skip — you can add later from the email link.
            </p>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Hidden product/variant identifiers for any QA tooling. */}
      <span hidden data-soul-reading-variant-id={SOUL_READING_VARIANT_ID} data-soul-reading-product-id={SOUL_READING_PRODUCT_ID} />
    </section>
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

function UpsellField({
  label,
  value,
  onChange,
  onBlur,
  error,
  type = "text",
  placeholder,
  maxLength,
  min,
  max,
  autoFocus,
}: UpsellFieldProps) {
  const hasError = !!error;
  return (
    <label className="block" style={{ marginBottom: 12 }}>
      <span
        style={{
          display: "block",
          fontFamily: "Assistant, system-ui, sans-serif",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: PALETTE.earthMuted,
          marginBottom: 4,
        }}
      >
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
        style={{
          width: "100%",
          padding: "10px 12px",
          background: "#fff",
          border: `1px solid ${hasError ? PALETTE.rose : PALETTE.sand}`,
          borderRadius: 8,
          fontFamily: "Assistant, system-ui, sans-serif",
          fontSize: 14,
          color: PALETTE.ink,
          outline: "none",
          transition: "border-color 120ms ease",
        }}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${label.replace(/\s+/g, "-")}-error` : undefined}
      />
      {hasError && (
        <span
          id={`${label.replace(/\s+/g, "-")}-error`}
          style={{
            display: "block",
            marginTop: 4,
            fontFamily: "Assistant, system-ui, sans-serif",
            fontSize: 11.5,
            color: PALETTE.rose,
          }}
        >
          {error}
        </span>
      )}
    </label>
  );
}

export default SoulReadingUpsell;
