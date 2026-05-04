/**
 * StyleThemePicker — 8×8 visual picker for the new AI Studio.
 *
 * Two-axis grid: Style (rendering treatment) × Theme (scene). 64 combos.
 * Plus optional "add details" freeform field.
 *
 * Outputs the chosen styleId + themeId + addDetails to parent so it can
 * fire /api/portraits/generate.
 */
import { STYLES, THEMES, type StyleDef, type ThemeDef } from "./styleTheme";
import { PALETTE } from "../tokens";

interface StyleThemePickerProps {
  styleId: string | null;
  themeId: string | null;
  addDetails: string;
  onStyleChange: (id: string) => void;
  onThemeChange: (id: string) => void;
  onAddDetailsChange: (val: string) => void;
}

export function StyleThemePicker({
  styleId,
  themeId,
  addDetails,
  onStyleChange,
  onThemeChange,
  onAddDetailsChange,
}: StyleThemePickerProps) {
  const both = !!styleId && !!themeId;
  return (
    <div className="space-y-8">
      <PickerSection
        title="Style"
        subtitle="Pick the rendering treatment"
        items={STYLES}
        selectedId={styleId}
        onChange={onStyleChange}
        complete={!!styleId}
      />
      <PickerSection
        title="Theme"
        subtitle="Pick the world they appear in"
        items={THEMES}
        selectedId={themeId}
        onChange={onThemeChange}
        complete={!!themeId}
      />
      {!both && (styleId || themeId) && (
        <p className="text-sm font-cormorant italic" style={{ color: PALETTE.muted }}>
          {styleId ? "One more — pick a Theme to enable Generate." : "One more — pick a Style to enable Generate."}
        </p>
      )}
      <div>
        <p
          className="uppercase mb-2"
          style={{ color: PALETTE.muted, fontSize: 11, letterSpacing: "0.12em" }}
        >
          Step 3 · Tell us what to draw (optional)
        </p>
        <p className="mb-2 text-sm" style={{ color: PALETTE.ink, lineHeight: 1.5 }}>
          Type a short note describing how you'd like your pet shown. Don't worry — keep it simple,
          like you're talking to a friend. We'll handle the rest.
        </p>

        <div className="mb-3 p-3 rounded-lg" style={{ background: "#FFFDF5", border: `1px solid ${PALETTE.sand}` }}>
          <p className="text-[12px] mb-1.5" style={{ color: PALETTE.muted, fontWeight: 600 }}>
            Examples (tap to use):
          </p>
          <div className="flex flex-col gap-1.5">
            {[
              "wearing a little red bow-tie",
              "sitting on a pile of books in a library",
              "looking proud and majestic",
              "with a tiny crown on their head",
              "in front of a starry night sky",
            ].map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => onAddDetailsChange(ex)}
                className="text-left text-[13px] px-2 py-1 rounded transition-colors"
                style={{ color: PALETTE.ink, background: "transparent" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f0e8d8")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                "{ex}"
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={addDetails}
          onChange={(e) => onAddDetailsChange(e.target.value.slice(0, 200))}
          placeholder="Or type your own — what should they be wearing or doing?"
          rows={3}
          maxLength={200}
          className="w-full rounded-lg p-3 text-sm"
          style={{
            background: "#fff",
            border: `1px solid ${PALETTE.sand}`,
            color: PALETTE.ink,
            fontFamily: "Assistant, system-ui, sans-serif",
          }}
        />
        <p className="mt-1 text-[11px]" style={{ color: PALETTE.muted }}>
          {addDetails.length}/200 characters
        </p>
      </div>
    </div>
  );
}

interface PickerSectionProps<T extends StyleDef | ThemeDef> {
  title: string;
  subtitle: string;
  items: T[];
  selectedId: string | null;
  onChange: (id: string) => void;
  complete?: boolean;
}

function PickerSection<T extends StyleDef | ThemeDef>({
  title,
  subtitle,
  items,
  selectedId,
  onChange,
  complete,
}: PickerSectionProps<T>) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-serif flex items-center gap-2" style={{ fontSize: 18, color: PALETTE.ink }}>
          {title}
          {complete && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px]" style={{ background: PALETTE.rose, color: "#fff" }}>✓</span>
          )}
        </h3>
        <p className="text-xs" style={{ color: PALETTE.muted }}>{subtitle}</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {items.map((it) => {
          const selected = selectedId === it.id;
          return (
            <button
              key={it.id}
              onClick={() => onChange(it.id)}
              className="text-left rounded-lg p-3 transition-all"
              style={{
                background: selected ? PALETTE.cream2 : "#fff",
                border: selected ? `2px solid ${PALETTE.rose}` : `1px solid ${PALETTE.sand}`,
                boxShadow: selected ? "0 4px 16px rgba(191, 82, 74, 0.18)" : "none",
              }}
            >
              <p className="font-serif text-sm" style={{ color: PALETTE.ink }}>{it.label}</p>
              <p className="text-[11px] mt-1" style={{ color: PALETTE.muted, lineHeight: 1.35 }}>
                {it.tagline}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
