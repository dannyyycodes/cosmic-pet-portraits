import { useEffect, useState } from "react";

// Preview-only page — 7 live cards, each with a distinct-voiced tailored
// review AND a real pet photo pulled from the free dog.ceo / thecatapi
// APIs. Every review targets its card's specific emotion and sounds like
// a different person (different sentence rhythm, punctuation, register).
// Route: /cards-preview

type Species = "cat" | "dog";

type Card = {
  n: number;
  accent: string;
  species: Species;
  eyebrow: string;
  headline: string;
  sub: string;
  review: {
    quote: string;
    name: string;
    pet: string;
    rating: number;
  };
};

const CARDS: Card[] = [
  // Card 1 — recognition / everyday love. Voice: quiet, contemplative,
  // private admission. Short sentences broken by one long one.
  {
    n: 1, accent: "#c4a265", species: "cat",
    eyebrow: "For the one who's been beside you every day",
    headline: "They have a look they save only for you. You still don't know what it means.",
    sub: "You've studied them longer than almost anyone in your life. You've never been able to put it into words. This finally does.",
    review: {
      quote: "She does this thing where she goes soft around the eyes when I walk in. Only me. Never my partner, never my mom when she visits. I've noticed it for six years and never had a word for it. The reading called it her trust gaze. I sat with that for a long time.",
      name: "Sarah K.",
      pet: "Miso, 6",
      rating: 5,
    },
  },
  // Card 2 — quirk decoding. Voice: bemused, dry, gently self-aware.
  {
    n: 2, accent: "#bf524a", species: "cat",
    eyebrow: "For the pet with that weird thing",
    headline: "You've known what they do. Now know why.",
    sub: "The ritual. The obsession. The specific moment they always appear. You've been narrating their weirdness to friends for years. This tells you what you were actually watching.",
    review: {
      quote: "11 p.m. on the dot, Walter goes to the window. Every night. Waits about twenty minutes, then comes to bed. I used to tell people he was keeping watch, half joking. Turns out I was closer than I thought. The reading called it his threshold ritual. I still say goodnight to the window now.",
      name: "James D.",
      pet: "Walter · tabby, extremely serious",
      rating: 5,
    },
  },
  // Card 3 — bond validation. Voice: a little defensive, emotional,
  // longer sentences, ends vindicated.
  {
    n: 3, accent: "#8a6f8c", species: "dog",
    eyebrow: "For the bond nobody else gets",
    headline: "Everyone thinks you're projecting. You're not.",
    sub: "The pull. The rightness. The way it felt like they were yours before they were yours. Every feeling you've had about your bond is in their chart. Written, not imagined.",
    review: {
      quote: "I've had Pepper since she was eight weeks old and I swear I knew her before she was mine. My husband thinks it's cute how attached I am. My mother thinks it's a problem. The reading mapped three things we share, not vaguely but specifically, and I printed the page about our bond and left it on the kitchen counter. Nobody's saying it's a problem anymore.",
      name: "Elena M.",
      pet: "Pepper · rescue hound, my soul dog",
      rating: 5,
    },
  },
  // Card 4 — memorial. Voice: soft, fragmented, raw. Simple words.
  {
    n: 4, accent: "#5a4a42", species: "dog",
    eyebrow: "For the pet getting older — or already gone",
    headline: "Love doesn't stop at goodbye. Neither does this.",
    sub: "For the ones still here: don't leave them half-understood while there's still time. For the ones you've lost: a memorial reading reads them in past tense — their full chart, their bond with you, a letter in their voice. Not closure. Continuation.",
    review: {
      quote: "We lost Biscuit in February. I ordered the reading in March because I wasn't ready, and then I was. It came in past tense. There was a letter at the end in her voice and I couldn't finish it the first night. I go back to it. I keep it in the drawer next to the bed.",
      name: "Claire R.",
      pet: "for Biscuit, always",
      rating: 5,
    },
  },
  // Card 5 — rescue past. Voice: analytical, piecing-it-together,
  // quiet relief. Lists things.
  {
    n: 5, accent: "#7a8670", species: "dog",
    eyebrow: "For the ones with a history you weren't there for",
    headline: "What they can't tell you, their chart remembers.",
    sub: "Rescued, rehomed, shelter, stray — their past is older than your bond, and every piece of it shaped who they are for you. This reads the part they can't say.",
    review: {
      quote: "Otis came to us at four. He flinched at brooms, slept in the bathroom for a month, wouldn't eat unless I left the room. I spent three years piecing together stories about his life before us. The reading pointed at early isolation in his chart. It matched every instinct I'd had. I stopped guessing.",
      name: "Marcus P.",
      pet: "Otis · adopted 2023",
      rating: 5,
    },
  },
  // Card 6 — gift. Voice: family-context, practical-warm, a joke
  // landing on real feeling.
  {
    n: 6, accent: "#b0773f", species: "cat",
    eyebrow: "For the ones who'd give them the world",
    headline: "Every gift you've bought has said \u201CI love you.\u201D This one says \u201CI see you.\u201D",
    sub: "The full chart. The cosmic portrait for your wall. The archetype, the aura, the letter. A gift that doesn't get chewed, outgrown, or lost — because it is them, not something for them.",
    review: {
      quote: "Gave this to my mom for her birthday. She's had Maple since my dad died in 2021 — that cat is basically her person now. I sent the link not expecting much. She called me on FaceTime and read me the whole thing, stopping every other paragraph to say 'that's her, Dani, that's EXACTLY her.' She's not a crier. She cried.",
      name: "Dani L.",
      pet: "gifted for Mom & Maple",
      rating: 5,
    },
  },
  // Card 7 — reciprocity. Voice: revelatory, short punchy,
  // energized — like someone who just figured something out.
  {
    n: 7, accent: "#9d4038", species: "dog",
    eyebrow: "For the ones loved this fiercely",
    headline: "They've been reading you for years. Now read them back.",
    sub: "The hours they've spent watching you. The way they knew you were sad before you did. They've been learning your language without one of their own. This finally gives you theirs.",
    review: {
      quote: "Here's the thing I didn't expect. The reading didn't just tell me about Nova. It told me how she reads me. The way she tracks my mood, the specific things she picks up on, what she does when I'm overwhelmed vs when I'm just tired. Different responses. I thought I was observing her. She's been observing me the whole time.",
      name: "Ana T.",
      pet: "Nova · bulldog, apparently my therapist",
      rating: 5,
    },
  },
];

// ─────────────────────────── image fetch ───────────────────────────

async function fetchPetImage(species: Species): Promise<string | null> {
  try {
    if (species === "cat") {
      const r = await fetch("https://api.thecatapi.com/v1/images/search");
      const data = await r.json();
      return data?.[0]?.url ?? null;
    } else {
      const r = await fetch("https://dog.ceo/api/breeds/image/random");
      const data = await r.json();
      return data?.status === "success" ? data.message : null;
    }
  } catch {
    return null;
  }
}

// ─────────────────────────── type styles ───────────────────────────

const typeEyebrow = (accent: string): React.CSSProperties => ({
  fontFamily: '"Caveat", cursive',
  fontWeight: 500,
  fontSize: "clamp(1.3rem, 3.1vw, 1.6rem)",
  letterSpacing: "0.005em",
  color: accent,
  lineHeight: 1.3,
});

const typeHeadline: React.CSSProperties = {
  fontFamily: '"DM Serif Display", Georgia, serif',
  fontSize: "clamp(1.55rem, 5.3vw, 2.05rem)",
  fontWeight: 400,
  fontStyle: "italic",
  color: "#141210",
  lineHeight: 1.2,
  letterSpacing: "-0.01em",
  margin: 0,
};

const typeSub: React.CSSProperties = {
  fontFamily: '"Cormorant", Georgia, serif',
  fontSize: "clamp(1.08rem, 2.6vw, 1.22rem)",
  fontWeight: 400,
  fontStyle: "italic",
  color: "#5a4a42",
  lineHeight: 1.6,
  margin: 0,
};

// ─────────────────────────── review block ───────────────────────────

const StarRow = ({ rating, color }: { rating: number; color: string }) => (
  <div aria-label={`${rating} out of 5 stars`} style={{ display: "inline-flex", gap: 3 }}>
    {Array.from({ length: 5 }).map((_, i) => (
      <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i < rating ? color : "none"} stroke={color} strokeWidth="1.2">
        <path d="M12 2l2.9 6.9 7.5.7-5.7 5 1.7 7.4L12 18.3 5.6 22l1.7-7.4-5.7-5 7.5-.7L12 2z" />
      </svg>
    ))}
  </div>
);

const Avatar = ({ src, accent, species }: { src: string | null | undefined; accent: string; species: Species }) => (
  <div
    style={{
      width: 52, height: 52,
      borderRadius: "50%",
      border: `2px solid ${accent}`,
      padding: 2,
      background: `${accent}1a`,
      flexShrink: 0,
      boxShadow: `0 4px 12px rgba(20,15,8,0.12)`,
    }}
  >
    <div
      style={{
        width: "100%", height: "100%",
        borderRadius: "50%",
        overflow: "hidden",
        background: `${accent}22`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      {src ? (
        <img
          src={src}
          alt={`${species} photo`}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          loading="lazy"
        />
      ) : (
        <span style={{ fontSize: 20 }}>{species === "cat" ? "🐱" : "🐶"}</span>
      )}
    </div>
  </div>
);

const ReviewBlock = ({ card, image }: { card: Card; image: string | null | undefined }) => (
  <figure
    style={{
      position: "relative",
      marginTop: "clamp(18px, 3vw, 26px)",
      padding: "clamp(20px, 3vw, 26px) clamp(22px, 3.5vw, 30px)",
      borderRadius: 14,
      background: `linear-gradient(180deg, ${card.accent}0e 0%, ${card.accent}18 100%)`,
      border: `1px solid ${card.accent}33`,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.6)`,
      maxWidth: "34rem",
      width: "100%",
      textAlign: "left",
    }}
  >
    <span
      aria-hidden="true"
      style={{
        position: "absolute",
        top: -10, left: 18,
        fontFamily: '"DM Serif Display", Georgia, serif',
        fontSize: 52, lineHeight: 1,
        color: card.accent,
        opacity: 0.55,
      }}
    >
      “
    </span>

    <div style={{ marginBottom: 10 }}>
      <StarRow rating={card.review.rating} color={card.accent} />
    </div>

    <blockquote
      style={{
        margin: 0,
        fontFamily: '"Cormorant", Georgia, serif',
        fontSize: "clamp(1rem, 2.3vw, 1.1rem)",
        fontStyle: "italic",
        color: "#2d241c",
        lineHeight: 1.6,
      }}
    >
      {card.review.quote}
    </blockquote>

    <figcaption
      style={{
        marginTop: 16,
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontFamily: "Lato, system-ui, sans-serif",
      }}
    >
      <Avatar src={image} accent={card.accent} species={card.species} />
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: "#2d241c", letterSpacing: "0.02em" }}>
          {card.review.name}
        </span>
        <span style={{ fontFamily: '"Caveat", cursive', fontSize: 17, color: card.accent, fontWeight: 500, lineHeight: 1 }}>
          {card.review.pet}
        </span>
      </div>
    </figcaption>
  </figure>
);

// ─────────────────────────── card ───────────────────────────

const CardPreview = ({ card, image }: { card: Card; image: string | null | undefined }) => (
  <div
    className="relative w-full overflow-hidden"
    style={{
      background: `linear-gradient(180deg, #FFFDF5 0%, #faf4e8 100%)`,
      border: `1px solid ${card.accent}47`,
      borderRadius: 24,
      padding: "clamp(40px, 6vw, 60px) clamp(28px, 5vw, 52px)",
      boxShadow: "0 14px 46px rgba(31, 28, 24, 0.09), inset 0 1px 0 rgba(255,255,255,0.75)",
    }}
  >
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{ background: `radial-gradient(ellipse at 50% 40%, ${card.accent}14 0%, transparent 60%)` }}
    />
    <div
      className="relative flex flex-col items-center text-center"
      style={{ gap: "clamp(14px, 2vw, 20px)" }}
    >
      <div
        style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: 11, fontStyle: "italic",
          letterSpacing: "0.32em", textTransform: "uppercase",
          color: card.accent, opacity: 0.75,
        }}
      >
        № {card.n.toString().padStart(2, "0")}  /  07
      </div>
      <div style={typeEyebrow(card.accent)}>{card.eyebrow}</div>
      <svg aria-hidden="true" width="84" height="8" viewBox="0 0 84 8" fill="none" style={{ opacity: 0.85 }}>
        <path d="M 2 5 Q 10 0.5 18 4.5 T 34 4.5 T 50 4.5 T 66 4.5 T 82 4.5" stroke={card.accent} strokeWidth="1.4" strokeLinecap="round" fill="none" />
      </svg>
      <h2 style={{ ...typeHeadline, maxWidth: "32rem" }}>{card.headline}</h2>
      <p style={{ ...typeSub, maxWidth: "32rem" }}>{card.sub}</p>
      <ReviewBlock card={card} image={image} />
    </div>
  </div>
);

// ─────────────────────────── page ───────────────────────────

const CardsPreview = () => {
  const [images, setImages] = useState<Record<number, string | null>>({});

  useEffect(() => {
    let cancelled = false;
    CARDS.forEach((c) => {
      fetchPetImage(c.species).then((url) => {
        if (cancelled) return;
        setImages((prev) => ({ ...prev, [c.n]: url }));
      });
    });
    return () => { cancelled = true; };
  }, []);

  const reroll = () => {
    setImages({});
    CARDS.forEach((c) => {
      fetchPetImage(c.species).then((url) => {
        setImages((prev) => ({ ...prev, [c.n]: url }));
      });
    });
  };

  return (
    <div style={{ background: "#f5efe0", minHeight: "100vh", padding: "40px 20px 80px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <h1 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 36, margin: 0, color: "#1a1612" }}>
          7 cards · tailored review + real pet photo
        </h1>
        <p style={{ fontFamily: "Lato, system-ui, sans-serif", color: "#4a3f36", marginTop: 6, maxWidth: 680 }}>
          Every review is written in a different voice and language rhythm to match that card's emotional target. Photos pulled live from <code>dog.ceo</code> and <code>thecatapi.com</code> — click reroll for a new set.
        </p>

        <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={reroll}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              border: "1px solid rgba(149,135,121,0.5)",
              background: "#FFFDF5",
              fontFamily: "Lato, system-ui, sans-serif",
              fontSize: 13,
              cursor: "pointer",
              color: "#3a342f",
            }}
          >
            ↻ reroll pet photos
          </button>
          <span style={{ fontFamily: "Lato, system-ui, sans-serif", fontSize: 12, color: "#6e6259" }}>
            Photos load async — give them a moment.
          </span>
        </div>

        <div style={{ marginTop: 36, padding: "14px 18px", background: "rgba(255,253,245,0.6)", borderRadius: 10, fontFamily: "Lato, system-ui, sans-serif", fontSize: 13, color: "#4a3f36", border: "1px dashed rgba(149,135,121,0.3)" }}>
          <b>Voice guide per card:</b>
          <ul style={{ margin: "6px 0 0", paddingLeft: 18, lineHeight: 1.7 }}>
            <li>01 — quiet, contemplative, private admission</li>
            <li>02 — bemused, dry, gently self-aware</li>
            <li>03 — emotional, vindicated, slightly defensive</li>
            <li>04 — soft, fragmented, raw grief</li>
            <li>05 — analytical, piecing it together, quiet relief</li>
            <li>06 — family-context, practical warmth, humour landing on feeling</li>
            <li>07 — revelatory, punchy sentences, energised discovery</li>
          </ul>
        </div>

        <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 44 }}>
          {CARDS.map((c) => (
            <section key={c.n}>
              <div style={{ marginBottom: 12, fontFamily: "Lato, system-ui, sans-serif", fontSize: 12, color: "#6e6259", textTransform: "uppercase", letterSpacing: "0.18em" }}>
                Card {c.n} · {c.species}
              </div>
              <CardPreview card={c} image={images[c.n]} />
            </section>
          ))}
        </div>

        <div style={{ marginTop: 56, padding: "22px 24px", background: "rgba(255,253,245,0.7)", border: "1px dashed rgba(149,135,121,0.4)", borderRadius: 12, fontFamily: "Lato, system-ui, sans-serif", color: "#3a342f" }}>
          <div style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 20, marginBottom: 10, color: "#1a1612" }}>
            Note on live deployment
          </div>
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            For production we'll want to <b>pick one photo per card and self-host it</b> — random rerolling on every load would look inconsistent and hit those APIs unnecessarily. Once you like a set (reroll until you do), screenshot or tell me and I'll pin them.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CardsPreview;
