/**
 * CharacterPacks — six archetype story cards in a horizontal scroll-snap rail.
 *
 * Each card pairs a master portrait with a Cormorant tagline and a
 * "Step into this world" CTA that scroll-jumps to upload + pre-selects pack.
 *
 * Cards rise + fade as the section enters viewport (whileInView), staggered.
 * Mobile: smaller cards, no parallax.
 */
import { motion } from "framer-motion";
import { MasterPortraitPlaceholder } from "./MasterPortraitPlaceholder";
import { PALETTE, cormorantItalic, eyebrow, EASE } from "./tokens";

export interface CharacterPack {
  id: string;
  name: string;
  /** One-line painterly tagline (Cormorant italic, premium). */
  tagline: string;
  /** Three short scene descriptors that ship inside the pack. */
  scenes: [string, string, string];
}

export const CHARACTER_PACKS: CharacterPack[] = [
  {
    id: "1920s-boss",
    name: "1920s Underworld Boss",
    tagline: "Tiny don. Enormous gravitas. Rain on cobblestones.",
    scenes: ["Smoky private room", "Brass-lamp close-up", "Rainy alleyway"],
  },
  {
    id: "wizard-school",
    name: "Wizard School Prodigy",
    tagline: "Velvet robe. Floating spell book. Candlelight on fur.",
    scenes: ["Ancient library", "Stained-glass moonlight", "Spell-cast portrait"],
  },
  {
    id: "gothic-academy",
    name: "Gothic Academy Star",
    tagline: "Deadpan brilliance. Rain on stained glass. Quiet menace.",
    scenes: ["Candle-lit study", "Ribbon collar close-up", "Storm-window full"],
  },
  {
    id: "galaxy-smuggler",
    name: "Galaxy Smuggler Captain",
    tagline: "Worn leather. Charming roguery. Hyperspace at the window.",
    scenes: ["Cockpit hero", "Cantina low-light", "Console reflection"],
  },
  {
    id: "regency-court",
    name: "Regency Court Darling",
    tagline: "Ivory silk. Witty grace. Ballroom candlelight.",
    scenes: ["Gilded mirror", "Garden promenade", "Court portrait"],
  },
  {
    id: "cosmic-chart",
    name: "Cosmic Birth Chart",
    tagline: "Their natal chart, painted around them. The Soul Edition signature.",
    scenes: ["Chart wheel halo", "Constellation veil", "Soul-centre portrait"],
  },
];

interface CharacterPacksProps {
  onPickPack: (packId: string) => void;
}

export function CharacterPacks({ onPickPack }: CharacterPacksProps) {
  return (
    <section
      id="characters"
      className="relative px-6 md:px-10"
      style={{
        background: "rgba(255, 255, 255, 0.84)",
        paddingTop: "clamp(96px, 12vh, 160px)",
        paddingBottom: "clamp(96px, 12vh, 160px)",
      }}
      aria-labelledby="characters-heading"
    >
      <div className="mx-auto" style={{ maxWidth: "1240px" }}>
        <div className="max-w-[760px]">
          <p style={eyebrow(PALETTE.earthMuted)} id="characters-heading">Pick a character world</p>
        </div>

        {/* ── Card grid ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 lg:gap-8 mt-16">
          {CHARACTER_PACKS.map((pack, idx) => (
            <motion.article
              key={pack.id}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, delay: idx * 0.07, ease: EASE.out }}
              className="group relative overflow-hidden rounded-sm"
              style={{
                background: PALETTE.cream2,
                border: `1px solid ${PALETTE.sand}`,
              }}
            >
              <MasterPortraitPlaceholder packId={pack.id} className="aspect-[4/5] w-full" />

              <div className="p-6">
                <h3
                  style={{
                    fontFamily: 'Asap, system-ui, sans-serif',
                    fontSize: "21px",
                    fontWeight: 500,
                    color: PALETTE.ink,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {pack.name}
                </h3>
                <p style={{ ...cormorantItalic("17px"), color: PALETTE.earth, marginTop: "8px" }}>
                  {pack.tagline}
                </p>

                {/* Scenes inside the pack — small caption row */}
                <ul
                  className="mt-4 flex flex-wrap gap-x-3 gap-y-1"
                  style={{ fontSize: "12px", color: PALETTE.earthMuted, letterSpacing: "0.05em" }}
                >
                  {pack.scenes.map((s, i) => (
                    <li key={s} className="flex items-center gap-2">
                      {i > 0 && <span aria-hidden style={{ opacity: 0.4 }}>·</span>}
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => onPickPack(pack.id)}
                  className="mt-5 inline-flex items-center gap-2 transition-colors"
                  style={{
                    color: PALETTE.rose,
                    fontSize: "15px",
                    fontWeight: 500,
                    textDecoration: "underline",
                    textDecorationColor: "rgba(191, 82, 74, 0.4)",
                    textUnderlineOffset: "5px",
                  }}
                >
                  Step into this world
                  <span aria-hidden>→</span>
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
