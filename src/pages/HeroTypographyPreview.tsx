import { HeroCardRotator, type TypographyVariant } from "@/components/funnel-v2/HeroCardRotator";

const VARIANTS: { key: TypographyVariant; name: string; blurb: string }[] = [
  {
    key: "editorial-italic",
    name: "A · Editorial Italic",
    blurb:
      "DM Serif Display italic headline · Cormorant italic eyebrow in gold · Cormorant upright body. The current look — literary, intimate, slightly Vogue-column.",
  },
  {
    key: "classical-upright",
    name: "B · Classical Upright",
    blurb:
      "DM Serif Display upright headline (no italic) · Lato caps-tracked eyebrow · Cormorant italic body. More formal, magazine-masthead, less romantic.",
  },
  {
    key: "bold-modern",
    name: "C · Bold Modern",
    blurb:
      "Playfair Display 700 bold headline · Cormorant italic eyebrow in rose · Lato body. Higher contrast, more editorial-impact, reads like a print ad.",
  },
  {
    key: "handwritten-intimate",
    name: "D · Handwritten Intimate",
    blurb:
      "DM Serif Display italic headline · Caveat handwritten eyebrow in gold · Lato light-italic body. Softer, diaristic, feels like a private note.",
  },
];

const HeroTypographyPreview = () => {
  return (
    <div
      style={{
        background: "var(--cream, #FFFDF5)",
        minHeight: "100vh",
        padding: "clamp(32px, 5vw, 72px) clamp(16px, 4vw, 48px) 120px",
      }}
    >
      <div className="max-w-[820px] mx-auto text-center" style={{ marginBottom: 48 }}>
        <div
          style={{
            fontFamily: '"Lato", system-ui, sans-serif',
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.24em",
            fontSize: "0.72rem",
            color: "var(--gold, #c4a265)",
            marginBottom: 10,
          }}
        >
          Hero Deck · Typography Preview
        </div>
        <h1
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: "clamp(1.8rem, 5vw, 2.4rem)",
            fontWeight: 400,
            color: "var(--black, #141210)",
            margin: 0,
          }}
        >
          Four typographic takes on the same deck.
        </h1>
        <p
          style={{
            fontFamily: '"Cormorant", Georgia, serif',
            fontSize: "clamp(1rem, 2.2vw, 1.12rem)",
            color: "var(--warm, #5a4a42)",
            maxWidth: 640,
            margin: "16px auto 0",
          }}
        >
          Flick through each deck, compare the feel, tell me which variant to lock in on the live site.
        </p>
      </div>

      <div className="flex flex-col" style={{ gap: 72 }}>
        {VARIANTS.map((v) => (
          <section key={v.key} className="max-w-[820px] mx-auto w-full">
            <div
              style={{
                borderTop: "1px solid rgba(196, 162, 101, 0.3)",
                paddingTop: 20,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  fontFamily: '"Lato", system-ui, sans-serif',
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: "var(--black, #141210)",
                  fontSize: "1rem",
                }}
              >
                {v.name}
              </div>
              <div
                style={{
                  fontFamily: '"Cormorant", Georgia, serif',
                  fontSize: "0.98rem",
                  color: "var(--muted, #958779)",
                  fontStyle: "italic",
                  marginTop: 4,
                  lineHeight: 1.5,
                }}
              >
                {v.blurb}
              </div>
            </div>
            <HeroCardRotator typography={v.key} />
          </section>
        ))}
      </div>
    </div>
  );
};

export default HeroTypographyPreview;
