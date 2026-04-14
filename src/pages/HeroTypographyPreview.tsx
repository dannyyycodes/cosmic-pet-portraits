import { HeroCardRotator, type TypographyVariant } from "@/components/funnel-v2/HeroCardRotator";

const VARIANTS: { key: TypographyVariant; name: string; blurb: string }[] = [
  {
    key: "hw-soft-diary",
    name: "A · Soft Diary",
    blurb:
      "Caveat handwritten eyebrow in gold · DM Serif Display italic headline (bigger) · Lato light-italic body. Warm, private, journal-style. The current default.",
  },
  {
    key: "hw-love-letter",
    name: "B · Love Letter",
    blurb:
      "Caveat eyebrow (larger, bolder) · Playfair Display italic headline (extra large, 500 weight) · Cormorant body. More ornate, more emotional, reads like a handwritten letter.",
  },
  {
    key: "hw-big-quote",
    name: "C · Big Quote",
    blurb:
      "Small Caveat eyebrow in muted grey (subtle, feels like a margin note) · Massive DM Serif Display italic headline · Cormorant italic body. Headline-dominant; eyebrow steps back.",
  },
  {
    key: "hw-full-cursive",
    name: "D · Full Cursive",
    blurb:
      "Caveat eyebrow · Caveat 700 cursive headline at giant scale · Cormorant body. Most intimate, most handwritten — the whole thing feels like a note scrawled for them.",
  },
  {
    key: "hw-whisper",
    name: "E · Whisper",
    blurb:
      "Caveat eyebrow in rose · Cormorant italic headline (elegant, thinner feel than DM Serif) · Cormorant light-italic body. Softer, quieter, more breath around every line.",
  },
];

const HeroTypographyPreview = () => {
  return (
    <div
      style={{
        background: "var(--cream, #FFFDF5)",
        minHeight: "100vh",
        padding: "clamp(32px, 5vw, 72px) clamp(16px, 4vw, 48px) 160px",
      }}
    >
      <div className="max-w-[820px] mx-auto text-center" style={{ marginBottom: 56 }}>
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
          Hero Deck · Handwritten Variants
        </div>
        <h1
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: "clamp(1.9rem, 5.2vw, 2.5rem)",
            fontWeight: 400,
            fontStyle: "italic",
            color: "var(--black, #141210)",
            margin: 0,
          }}
        >
          Five handwritten takes on the same deck.
        </h1>
        <p
          style={{
            fontFamily: '"Cormorant", Georgia, serif',
            fontSize: "clamp(1rem, 2.2vw, 1.14rem)",
            color: "var(--warm, #5a4a42)",
            maxWidth: 640,
            margin: "16px auto 0",
            lineHeight: 1.55,
          }}
        >
          Same 7 cards, five different type hierarchies. Flick through each deck, compare the feel, tell me which letter (A–E) to lock in.
        </p>
      </div>

      <div className="flex flex-col" style={{ gap: 96 }}>
        {VARIANTS.map((v) => (
          <section key={v.key} className="max-w-[820px] mx-auto w-full">
            <div
              style={{
                borderTop: "1px solid rgba(196, 162, 101, 0.3)",
                paddingTop: 22,
                marginBottom: 22,
              }}
            >
              <div
                style={{
                  fontFamily: '"Lato", system-ui, sans-serif',
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: "var(--black, #141210)",
                  fontSize: "1.02rem",
                }}
              >
                {v.name}
              </div>
              <div
                style={{
                  fontFamily: '"Cormorant", Georgia, serif',
                  fontSize: "1rem",
                  color: "var(--muted, #958779)",
                  fontStyle: "italic",
                  marginTop: 4,
                  lineHeight: 1.55,
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
