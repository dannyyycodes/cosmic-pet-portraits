/**
 * InTheWildGallery — pre-launch UGC strip.
 *
 * Real customer-portrait-on-wall photos don't exist yet. We render a tasteful
 * 9-frame mosaic of placeholder "framed master portraits" and surface a small
 * "share yours and we'll re-print free" CTA so future entries seed naturally.
 *
 * The placeholder treatment is deliberate: each frame mounts a master portrait
 * placeholder inside a "wall" panel with shadow and label, reading as concept
 * art rather than empty cells.
 */
import { MasterPortraitPlaceholder } from "./MasterPortraitPlaceholder";
import { PALETTE, display, cormorantItalic, eyebrow } from "./tokens";

const PACKS = [
  "1920s-boss",
  "wizard-school",
  "regency-court",
  "galaxy-smuggler",
  "cosmic-chart",
  "gothic-academy",
  "1920s-boss",
  "wizard-school",
  "regency-court",
];

export function InTheWildGallery() {
  return (
    <section
      className="relative px-6 md:px-10"
      style={{
        background: "rgba(255, 255, 255, 0.84)",
        paddingTop: "clamp(96px, 12vh, 160px)",
        paddingBottom: "clamp(96px, 12vh, 160px)",
        borderTop: `1px solid ${PALETTE.sand}`,
      }}
      aria-labelledby="in-the-wild-heading"
    >
      <div className="mx-auto" style={{ maxWidth: "1240px" }}>
        <div className="max-w-[760px]">
          <p style={eyebrow(PALETTE.earthMuted)}>In the wild</p>
          <h2
            id="in-the-wild-heading"
            style={{ ...display("clamp(34px, 5vw, 58px)"), color: PALETTE.ink, marginTop: "18px" }}
          >
            On <span style={{ color: PALETTE.rose, fontStyle: "italic" }}>real walls</span>, in
            real homes — soon.
          </h2>
          <p style={{ ...cormorantItalic("21px"), color: PALETTE.earth, marginTop: "20px" }}>
            We're a few weeks from our first customer photos. Until they arrive, here's the
            painterly direction. Tag <strong style={{ color: PALETTE.ink, fontWeight: 600 }}>@littlesoulsapp</strong> when yours lands —
            we'll re-print one of your scenes free as a thank-you.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6 mt-14">
          {PACKS.map((packId, idx) => (
            <div
              key={`${packId}-${idx}`}
              className="relative"
              style={{
                background: PALETTE.cream2,
                padding: "10px",
                border: `1px solid ${PALETTE.sand}`,
                boxShadow: "0 18px 36px rgba(20, 18, 16, 0.08)",
              }}
            >
              <MasterPortraitPlaceholder
                packId={packId}
                className="aspect-square w-full"
                hideCaption
              />
            </div>
          ))}
        </div>

        <p
          className="text-center mt-10"
          style={{ fontSize: "13px", color: PALETTE.earthMuted, letterSpacing: "0.04em" }}
        >
          Concept frames · real customer wall art replaces this grid as orders ship.
        </p>
      </div>
    </section>
  );
}
