/**
 * PetUploadCard — one upload slot in the multi-pet StudioFlow.
 *
 * Wraps PetPhotoUpload + a pet-name input + an optional delete affordance,
 * keeping each pet's state isolated so the parent (StudioFlow) can map over
 * a `pets` array without ballooning the JSX inline.
 *
 * Per the Crown & Paw / West & Willow research (vault: research-2026-05-07-
 * multipet-orientation-ux.md), the proven UX is "one tile per pet" — separate
 * photo + name per pet, never a single group photo. This card is the building
 * block for that pattern. Cap is enforced by the parent (max 4).
 *
 * Validation feedback: when the backend returns 400 { error: 'no_pet_detected',
 * petIndex }, the parent flips `errorMessage` on the matching card and we
 * highlight in rose with the message inline. No global toast for this case —
 * it's per-pet.
 */
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { PetPhotoUpload } from "@/components/portraits/PetPhotoUpload";
import { PALETTE, EASE } from "@/components/portraits/tokens";

export interface Pet {
  /** Stable client-side id — used as React key so reordering / deleting
   *  doesn't unmount the wrong card mid-upload. */
  id: string;
  /** Public Supabase URL once upload completes. Null until uploaded. */
  photoUrl: string | null;
  /** Optional pet name — printed on the canvas typography. */
  name: string;
}

interface PetUploadCardProps {
  pet: Pet;
  /** Display index (1-based) — shown in the header chip. */
  index: number;
  onChange: (next: Pet) => void;
  onDelete: () => void;
  /** Disabled when this is the only remaining pet (must keep at least 1). */
  canDelete: boolean;
  /** Per-pet error from the API (e.g. "no_pet_detected"). Empty when clear. */
  errorMessage?: string | null;
}

export function PetUploadCard({
  pet,
  index,
  onChange,
  onDelete,
  canDelete,
  errorMessage,
}: PetUploadCardProps) {
  const hasError = !!errorMessage;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.32, ease: EASE.out }}
      className="rounded-2xl p-3 sm:p-3.5 relative"
      style={{
        background: hasError ? "#fff5f4" : PALETTE.cream,
        // Rose border when API flagged "no pet detected" on this slot.
        border: hasError
          ? `1.5px solid ${PALETTE.rose}`
          : `1px solid ${PALETTE.sandDeep}`,
        boxShadow: hasError
          ? `0 0 0 3px rgba(191, 82, 74, 0.08), 0 10px 24px rgba(20, 18, 16, 0.05)`
          : "0 6px 18px rgba(20, 18, 16, 0.035), 0 1px 3px rgba(20, 18, 16, 0.02)",
        transition: "box-shadow 220ms, border-color 220ms, background 220ms",
      }}
    >
      {/* Header row — pet number chip + delete affordance */}
      <div className="flex items-center justify-between mb-2.5">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{
            background: PALETTE.cream2,
            border: `1px solid ${PALETTE.sand}`,
            fontFamily: "Asap, system-ui, sans-serif",
            fontSize: 10.5,
            fontWeight: 700,
            color: PALETTE.earth,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          <span aria-hidden style={{ color: PALETTE.gold }}>✦</span>
          Pet {index}
        </span>

        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Remove pet ${index}`}
            className="flex items-center justify-center rounded-full transition-colors hover:bg-black/5"
            style={{
              width: 26,
              height: 26,
              color: PALETTE.earthMuted,
            }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Photo upload — Agent 3 owns the internals; we just instantiate it. */}
      <PetPhotoUpload
        photoUrl={pet.photoUrl}
        onUploaded={(url) => onChange({ ...pet, photoUrl: url })}
        onReset={() => onChange({ ...pet, photoUrl: null })}
        variant="compact"
      />

      {/* Per-pet error inline — only shown when the API rejected this slot.
          Sits between photo + name so it's visible right where the issue is. */}
      <AnimatePresence initial={false}>
        {hasError && (
          <motion.p
            key="err"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: EASE.out }}
            role="alert"
            className="mt-3 px-3.5 py-2.5 rounded-xl overflow-hidden"
            style={{
              background: PALETTE.roseSoft,
              border: `1px solid ${PALETTE.rose}`,
              color: PALETTE.roseDeep,
              fontFamily: "Assistant, system-ui, sans-serif",
              fontSize: 13,
              lineHeight: 1.45,
            }}
          >
            {errorMessage}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Name input — same microcopy as the original single-pet flow. */}
      <div className="mt-3">
        <div className="flex items-baseline justify-between gap-3 px-1 mb-1.5">
          <label
            htmlFor={`petname-${pet.id}`}
            className="block text-xs"
            style={{
              fontFamily: "Assistant, system-ui, sans-serif",
              color: PALETTE.earthMuted,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Name on canvas
          </label>
          <span
            style={{
              fontFamily: "Assistant, system-ui, sans-serif",
              fontSize: 11,
              color: PALETTE.earthSubtle,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Optional
          </span>
        </div>
        <input
          id={`petname-${pet.id}`}
          type="text"
          value={pet.name}
          onChange={(e) => onChange({ ...pet, name: e.target.value.slice(0, 40) })}
          placeholder={`e.g. ${["Luna", "Bella", "Rex", "Milo"][(index - 1) % 4]}`}
          maxLength={40}
          aria-label={`Name to print for pet ${index}`}
          className="w-full bg-transparent outline-none px-3.5 py-2.5"
          style={{
            fontFamily: "Assistant, system-ui, sans-serif",
            fontSize: 15,
            color: PALETTE.ink,
            background: "#ffffff",
            border: `1.5px solid ${PALETTE.sandDeep}`,
            borderRadius: 12,
            transition: "box-shadow 220ms, border-color 220ms",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = PALETTE.rose;
            e.currentTarget.style.boxShadow =
              "0 0 0 4px rgba(191,82,74,.08), 0 8px 18px rgba(20,18,16,.05)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = PALETTE.sandDeep;
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </div>
    </motion.div>
  );
}
