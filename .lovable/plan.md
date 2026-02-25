

# Emotional Journey — Editorial Typography & Animated Trail Redesign

## Single File Change: `src/components/variants/variant-c/EmotionalJourney.tsx`

Complete rewrite of the component to apply the exact 4-level typography system, animated meandering trail dividers, and section-specific refinements.

---

### 1. Typography Hierarchy (4 strict levels)

| Level | Class String |
|-------|-------------|
| **Headlines** | `font-serif text-4xl md:text-6xl font-bold tracking-tighter text-slate-900` + inline style `textWrap: 'balance'` |
| **Whispers** | `font-sans text-xs md:text-sm font-light uppercase tracking-[0.3em] text-slate-500` |
| **Power Lines** | `font-serif text-2xl md:text-3xl italic font-medium text-slate-800 leading-relaxed` |
| **Signature** | `font-caveat text-3xl md:text-4xl text-slate-900` — ONLY the final line |

All `text-primary`, `text-foreground`, `text-muted-foreground` classes replaced with the specific slate values above.

---

### 2. TrailDivider Component (replaces PawHeartDivider)

New component using `framer-motion`. Three icons stacked vertically (Paw → Heart → Paw), each offset on the X-axis to create a meandering walking path:

- Icon 1 (Paw): `x: -12`, opacity `0.6`, delay `0s`
- Icon 2 (Heart): `x: 12`, opacity `0.4`, delay `0.2s`
- Icon 3 (Paw): `x: 0`, opacity `0.2`, delay `0.4s`

Each wrapped in `motion.div` with `whileInView` trigger, `viewport: { once: true }`. Icons use `text-blue-500/50` for paws and `text-red-500/50` for hearts. Arranged in a `flex flex-col items-center gap-1` container with `py-12 md:py-16`.

---

### 3. Section-by-Section Changes

**Section 1 — "They Love You Without Conditions."**
- Headline: Level 1 (serif, `text-4xl md:text-6xl`, bold, `tracking-tighter`, `text-slate-900`)
- "On your best days." / "On your worst days." / "No judgement." / "No expectations.": Level 2 Whisper style
- "Just loyalty. Just presence. Just love.": Level 3 Power Line. Replace periods with ` · ` (middle dot separator) for editorial look → "Just loyalty · Just presence · Just love."
- Padding: `py-24 md:py-32`, content `max-w-3xl mx-auto text-center`

**Section 2 — "They're Not 'Just a Pet.'"**
- Headline: Level 1
- "They are a living, feeling soul..." paragraph: `font-serif text-lg md:text-xl text-slate-600 leading-relaxed`
- "The way they comfort/protect/choose you": `font-serif italic text-slate-700 pl-4`, each with staggered fade-in (increasing delay)
- "That means something.": Level 3 Power Line
- Same padding and max-width

**Section 3 — "This Is an Act of Love."**
- Headline: Level 1
- Body lines ("Taking the time..."): Level 2 Whisper style
- "It's a small way of saying:": Whisper style
- **Floating Quote**: Remove the card (`bg-primary/5`, border, rounded). Replace with a `relative` container. Place a massive decorative `"` behind the text using `absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 text-[160px] font-serif text-slate-900 opacity-5 select-none pointer-events-none leading-none`. The quote lines ("I see you." etc.) rendered as `font-serif italic text-lg md:text-xl text-slate-800` centered in the white space.
- "Because when someone loves you unconditionally…": Whisper style
- "the most beautiful thing you can do": Level 3 Power Line
- "is try to understand them in return.": Level 4 Signature (`font-caveat text-3xl md:text-4xl text-slate-900`) with blur-reveal animation: `initial: { filter: 'blur(10px)', opacity: 0 }`, `whileInView: { filter: 'blur(0px)', opacity: 1 }`, `transition: { duration: 0.8 }`

---

### 4. Layout & Rhythm

- All three sections: `px-6 py-24 md:py-32`
- All content containers: `max-w-3xl mx-auto text-center`
- Line spacing within sections: `space-y-3 md:space-y-4`

---

### File Summary

| File | Change |
|------|--------|
| `src/components/variants/variant-c/EmotionalJourney.tsx` | Full rewrite: 4-level typography, animated meandering trail dividers, floating quote, blur-reveal signature, editorial spacing |

No other files modified. Fonts (`Playfair Display`, `Caveat`, `Lato`) and config are already in place.

