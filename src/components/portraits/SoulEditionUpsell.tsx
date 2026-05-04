/**
 * SoulEditionUpsell — gold-hairline ceremonial card.
 *
 * Single accent per viewport (DESIGN.md rule). Lives between the upload
 * studio and reviews so it's seen *after* commitment, not before.
 *
 * Phase 2: wire as inline toggle inside the upload studio.
 */
import { PALETTE, display, cormorantItalic, eyebrow } from "./tokens";
import type { Currency } from "./FrameSizes";
import { PRICING } from "./FrameSizes";

interface SoulEditionUpsellProps {
  currency: Currency;
}

export function SoulEditionUpsell({ currency }: SoulEditionUpsellProps) {
  const price = PRICING[currency].soulEdition.label;

  return (
    <section
      className="relative px-6 md:px-10"
      style={{
        background: PALETTE.cream,
        paddingTop: "clamp(80px, 10vh, 130px)",
        paddingBottom: "clamp(80px, 10vh, 130px)",
        borderTop: `1px solid ${PALETTE.sand}`,
      }}
      aria-labelledby="soul-edition-heading"
    >
      <div className="mx-auto" style={{ maxWidth: "880px" }}>
        <article
          className="relative rounded-sm p-8 md:p-12 lg:p-16 overflow-hidden"
          style={{
            background: PALETTE.cream2,
            border: `1px solid ${PALETTE.gold}55`,
            boxShadow: "0 24px 48px rgba(196, 162, 101, 0.1)",
          }}
        >
          {/* corner ornament */}
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: "-1px",
              left: "-1px",
              width: "60px",
              height: "60px",
              borderTop: `1px solid ${PALETTE.gold}`,
              borderLeft: `1px solid ${PALETTE.gold}`,
            }}
          />
          <span
            aria-hidden
            style={{
              position: "absolute",
              bottom: "-1px",
              right: "-1px",
              width: "60px",
              height: "60px",
              borderBottom: `1px solid ${PALETTE.gold}`,
              borderRight: `1px solid ${PALETTE.gold}`,
            }}
          />

          <p style={eyebrow(PALETTE.goldDeep)}>
            ✦ &nbsp;Soul Edition &nbsp;· &nbsp;{price}
          </p>

          <h2
            id="soul-edition-heading"
            style={{ ...display("clamp(28px, 4vw, 46px)"), color: PALETTE.ink, marginTop: "18px" }}
          >
            Add the{" "}
            <span style={{ color: PALETTE.gold, fontStyle: "italic" }}>
              story behind their soul.
            </span>
          </h2>

          <p style={{ ...cormorantItalic("22px"), color: PALETTE.earth, marginTop: "18px" }}>
            Their natal chart. Their dominant element. Their archetype, crystal and aura. A bound
            printed reading sent alongside the framed portrait.
          </p>

          <p style={{ marginTop: "20px", color: PALETTE.earth, fontSize: "16.5px", lineHeight: 1.7 }}>
            Calculated to <strong style={{ color: PALETTE.ink, fontWeight: 600 }}>VSOP87 astronomical precision</strong> — not
            a horoscope template. Eight chapters, hand-tuned to your specific pet, paired with
            the framed portrait above.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3" style={{ fontSize: "13.5px", color: PALETTE.earthMuted }}>
            <span className="flex items-center gap-2"><span style={{ color: PALETTE.gold }}>✦</span> 8 chapters</span>
            <span className="flex items-center gap-2"><span style={{ color: PALETTE.gold }}>✦</span> Bound + printed</span>
            <span className="flex items-center gap-2"><span style={{ color: PALETTE.gold }}>✦</span> Ships with portrait</span>
            <span className="flex items-center gap-2"><span style={{ color: PALETTE.gold }}>✦</span> Add at checkout</span>
          </div>
        </article>
      </div>
    </section>
  );
}
