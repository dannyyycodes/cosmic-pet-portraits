import { useEffect, useState } from "react";

/**
 * Map Preview — temporary route at /v2-map-preview
 *
 * Three "Loved in 37 countries" world-map variants for the V2 funnel
 * hero. Pick one, tell Claude which letter, the chosen one ships into
 * HeroV2.tsx and this page can be deleted.
 *
 * All three variants share the same dot data. No external deps,
 * no licensing concerns, fully inline SVG.
 */

/* ─────────────────────────────────────────────────────────────
 * COORDINATE SYSTEM
 * 1000 × 500 viewBox, equirectangular projection
 *   x = (lng + 180) / 360 * 1000
 *   y = (80 - lat)  / 140 * 500
 * ─────────────────────────────────────────────────────────────*/

// Background continent dots (sparse grid, hand-curated to look like continents)
const CONTINENT_DOTS: [number, number][] = [
  // North America
  [180, 60], [200, 65], [220, 60], [240, 55], [260, 60], [180, 80], [200, 85], [220, 80], [240, 78], [260, 80], [280, 85],
  [180, 100], [200, 105], [220, 100], [240, 105], [260, 110], [280, 115], [200, 125], [220, 130], [240, 135], [260, 140], [280, 145],
  [220, 155], [240, 160], [260, 170], [280, 175], [240, 185], [260, 195], [275, 205], [255, 215], [240, 220],
  // Central / Mexico
  [220, 200], [225, 215], [240, 230], [255, 235],
  // South America
  [285, 250], [300, 260], [310, 275], [320, 290], [325, 305], [320, 320], [330, 335], [320, 350], [310, 365], [305, 380],
  [300, 395], [310, 410], [305, 425],
  // Europe
  [475, 75], [490, 70], [505, 75], [520, 80], [535, 75], [550, 80], [475, 90], [490, 95], [505, 90], [520, 95], [535, 100], [550, 95],
  [475, 110], [490, 115], [505, 110], [520, 115], [535, 110], [550, 115], [490, 130], [505, 125], [520, 130], [535, 125], [550, 135],
  [475, 145], [490, 150], [505, 145], [520, 150], [535, 155], [505, 165],
  // Africa
  [510, 180], [525, 175], [540, 180], [555, 195], [570, 200], [585, 195], [600, 200], [510, 215], [525, 220], [540, 215], [555, 220],
  [570, 225], [585, 230], [600, 220], [510, 240], [525, 245], [540, 250], [555, 255], [570, 250], [585, 260], [540, 275], [555, 280],
  [570, 285], [585, 290], [555, 305], [570, 310], [585, 305], [555, 325], [570, 330], [555, 350], [570, 360], [560, 380],
  // Middle East
  [610, 165], [625, 175], [640, 170], [655, 180], [625, 190], [640, 195], [655, 200], [625, 210], [640, 215],
  // Asia (Russia / Central / South / SE)
  [580, 60], [600, 55], [620, 60], [640, 55], [660, 50], [680, 55], [700, 50], [720, 55], [740, 50], [760, 55], [780, 50], [800, 55], [820, 60],
  [580, 80], [600, 75], [620, 80], [640, 75], [660, 70], [680, 75], [700, 80], [720, 75], [740, 80], [760, 75], [780, 80], [800, 75], [820, 80],
  [600, 100], [620, 95], [640, 100], [660, 95], [680, 100], [700, 95], [720, 100], [740, 95], [760, 100], [780, 95], [800, 100],
  [620, 120], [640, 115], [660, 125], [680, 120], [700, 130], [720, 125], [740, 130], [760, 125], [780, 130],
  [660, 145], [680, 150], [700, 145], [720, 150], [740, 145], [760, 155], [780, 150],
  [680, 170], [700, 165], [720, 175], [740, 170], [760, 175], [780, 180], [800, 165],
  [700, 190], [720, 195], [740, 190], [760, 200], [780, 195], [800, 185],
  [740, 215], [760, 225], [780, 220], [800, 210],
  // Australia / NZ
  [820, 365], [840, 360], [860, 365], [880, 370], [900, 365], [840, 380], [860, 385], [880, 380], [900, 390], [920, 385],
  [860, 400], [880, 405], [970, 425], [985, 430],
  // Japan
  [870, 145], [880, 150], [875, 160],
  // Indonesia / Philippines
  [800, 240], [815, 245], [825, 240], [810, 255], [820, 260], [810, 270], [800, 230], [785, 235],
];

// 37 highlighted countries (approximate centroids → equirect coords)
type Country = { name: string; x: number; y: number };
const COUNTRIES: Country[] = [
  { name: "United States", x: 236, y: 146 },
  { name: "Canada", x: 194, y: 96 },
  { name: "Mexico", x: 217, y: 204 },
  { name: "United Kingdom", x: 494, y: 93 },
  { name: "Ireland", x: 478, y: 96 },
  { name: "France", x: 506, y: 118 },
  { name: "Germany", x: 528, y: 104 },
  { name: "Spain", x: 489, y: 143 },
  { name: "Portugal", x: 478, y: 143 },
  { name: "Italy", x: 533, y: 136 },
  { name: "Netherlands", x: 514, y: 100 },
  { name: "Belgium", x: 511, y: 104 },
  { name: "Switzerland", x: 522, y: 118 },
  { name: "Austria", x: 539, y: 118 },
  { name: "Sweden", x: 550, y: 71 },
  { name: "Norway", x: 528, y: 64 },
  { name: "Denmark", x: 528, y: 86 },
  { name: "Poland", x: 553, y: 100 },
  { name: "Greece", x: 561, y: 146 },
  { name: "Turkey", x: 597, y: 146 },
  { name: "Israel", x: 597, y: 171 },
  { name: "UAE", x: 650, y: 200 },
  { name: "India", x: 714, y: 214 },
  { name: "Singapore", x: 789, y: 282 },
  { name: "China", x: 792, y: 161 },
  { name: "Japan", x: 883, y: 157 },
  { name: "South Korea", x: 856, y: 154 },
  { name: "Russia", x: 778, y: 71 },
  { name: "Australia", x: 875, y: 375 },
  { name: "New Zealand", x: 983, y: 432 },
  { name: "South Africa", x: 569, y: 393 },
  { name: "Egypt", x: 583, y: 193 },
  { name: "Brazil", x: 347, y: 339 },
  { name: "Argentina", x: 322, y: 410 },
  { name: "Chile", x: 303, y: 393 },
  { name: "Colombia", x: 294, y: 271 },
  { name: "Peru", x: 289, y: 321 },
];

/* ──────────────────────────────────────────────────────────────
 * VARIANT A — Subtle dot-pin map (Stripe / Linear / Vercel style)
 * Cream continent dots, gold pin dots for the 37 countries.
 * ──────────────────────────────────────────────────────────────*/
const VariantA = () => (
  <svg viewBox="0 0 1000 500" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
    {CONTINENT_DOTS.map(([x, y], i) => (
      <circle key={`bg-${i}`} cx={x} cy={y} r="2.4" fill="var(--sand, #d6c8b6)" opacity="0.55" />
    ))}
    {COUNTRIES.map((c, i) => (
      <circle
        key={`pin-${i}`}
        cx={c.x}
        cy={c.y}
        r="3.6"
        fill="var(--rose, #bf524a)"
      >
        <title>{c.name}</title>
      </circle>
    ))}
  </svg>
);

/* ──────────────────────────────────────────────────────────────
 * VARIANT B — Constellation map
 * Continent dots + 37 country dots connected by thin gold lines
 * forming a cosmic constellation. Ties into the hero star theme.
 * ──────────────────────────────────────────────────────────────*/
const VariantB = () => {
  // Connect each country to its 2 nearest neighbours (excluding itself)
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  COUNTRIES.forEach((a, i) => {
    const dists = COUNTRIES.map((b, j) => ({
      j,
      d: i === j ? Infinity : Math.hypot(a.x - b.x, a.y - b.y),
    }))
      .sort((p, q) => p.d - q.d)
      .slice(0, 2);
    dists.forEach(({ j }) => {
      // Avoid duplicate lines
      if (j > i) lines.push({ x1: a.x, y1: a.y, x2: COUNTRIES[j].x, y2: COUNTRIES[j].y });
    });
  });

  return (
    <svg viewBox="0 0 1000 500" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      {CONTINENT_DOTS.map(([x, y], i) => (
        <circle key={`bg-${i}`} cx={x} cy={y} r="1.8" fill="var(--sand, #d6c8b6)" opacity="0.4" />
      ))}
      {lines.map((l, i) => (
        <line
          key={`ln-${i}`}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke="var(--gold, #c4a265)"
          strokeWidth="0.6"
          opacity="0.55"
        />
      ))}
      {COUNTRIES.map((c, i) => (
        <g key={`star-${i}`}>
          <circle cx={c.x} cy={c.y} r="6" fill="var(--gold, #c4a265)" opacity="0.18" />
          <circle cx={c.x} cy={c.y} r="2.8" fill="var(--gold, #c4a265)">
            <title>{c.name}</title>
          </circle>
        </g>
      ))}
    </svg>
  );
};

/* ──────────────────────────────────────────────────────────────
 * VARIANT C — Pulsing live map
 * Dots randomly fire a soft rose ping, mimicking live activity.
 * Most "alive" / hyped feel.
 * ──────────────────────────────────────────────────────────────*/
const VariantC = () => {
  const [pingIndex, setPingIndex] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setPingIndex(Math.floor(Math.random() * COUNTRIES.length));
    tick();
    const id = setInterval(tick, 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <svg viewBox="0 0 1000 500" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @keyframes mapPing {
          0% { r: 3.6; opacity: 0.9; }
          80% { r: 16; opacity: 0; }
          100% { r: 16; opacity: 0; }
        }
      `}</style>
      {CONTINENT_DOTS.map(([x, y], i) => (
        <circle key={`bg-${i}`} cx={x} cy={y} r="2.4" fill="var(--sand, #d6c8b6)" opacity="0.5" />
      ))}
      {COUNTRIES.map((c, i) => (
        <g key={`p-${i}`}>
          {pingIndex === i && (
            <circle
              cx={c.x}
              cy={c.y}
              r="3.6"
              fill="none"
              stroke="var(--rose, #bf524a)"
              strokeWidth="1.2"
              style={{ animation: "mapPing 1.4s ease-out forwards" }}
            />
          )}
          <circle cx={c.x} cy={c.y} r="3.4" fill="var(--rose, #bf524a)">
            <title>{c.name}</title>
          </circle>
        </g>
      ))}
    </svg>
  );
};

/* ──────────────────────────────────────────────────────────────
 * Page wrapper — three variants stacked
 * ──────────────────────────────────────────────────────────────*/
const VariantCard = ({
  letter,
  title,
  description,
  children,
}: {
  letter: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <section
    className="rounded-2xl p-6 md:p-10"
    style={{
      background: "#fff",
      border: "1px solid var(--cream3, #f3eadb)",
      boxShadow: "0 4px 24px rgba(31,28,24,0.04)",
    }}
  >
    <header className="text-center mb-6">
      <p
        style={{
          fontFamily: "Cormorant, Georgia, serif",
          fontWeight: 700,
          fontSize: "0.7rem",
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: "var(--rose, #bf524a)",
          marginBottom: 6,
        }}
      >
        Variant {letter}
      </p>
      <h2
        style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: "clamp(1.4rem, 4vw, 1.8rem)",
          color: "var(--black, #141210)",
          marginBottom: 8,
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontFamily: "Cormorant, Georgia, serif",
          fontStyle: "italic",
          fontSize: "0.95rem",
          color: "var(--earth, #6e6259)",
          maxWidth: 520,
          margin: "0 auto",
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>
    </header>

    {/* Mock heading just like the hero would render */}
    <div className="text-center mb-4">
      <p
        style={{
          fontFamily: "Cormorant, Georgia, serif",
          fontWeight: 600,
          fontSize: "0.66rem",
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: "var(--muted, #958779)",
        }}
      >
        Loved in 37 countries
      </p>
    </div>

    {children}

    {/* Country count footer */}
    <p
      className="text-center mt-3"
      style={{
        fontFamily: '"DM Serif Display", Georgia, serif',
        fontSize: "0.95rem",
        color: "var(--earth, #6e6259)",
      }}
    >
      Pet parents worldwide
    </p>
  </section>
);

const MapPreview = () => (
  <main className="min-h-screen py-12 px-4" style={{ background: "var(--cream, #FFFDF5)" }}>
    <div className="max-w-3xl mx-auto mb-10 text-center">
      <h1
        style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: "clamp(1.8rem, 5vw, 2.6rem)",
          color: "var(--black, #141210)",
          marginBottom: 10,
        }}
      >
        Map Variant Preview
      </h1>
      <p
        style={{
          fontFamily: "Cormorant, Georgia, serif",
          fontStyle: "italic",
          fontSize: "1.05rem",
          color: "var(--earth, #6e6259)",
          maxWidth: 560,
          margin: "0 auto",
          lineHeight: 1.55,
        }}
      >
        Three "37 countries" map variants for the V2 hero.
        Tell Claude which letter you want and the rest get deleted.
      </p>
    </div>

    <div className="max-w-3xl mx-auto space-y-8">
      <VariantCard
        letter="A"
        title="Subtle Dot Map"
        description="Cream continent dots with rose country pins. Editorial, restrained, premium. Closest to Stripe / Linear / Vercel landing pages."
      >
        <VariantA />
      </VariantCard>

      <VariantCard
        letter="B"
        title="Constellation Map"
        description="Country pins connected by thin gold lines, mirroring the constellation pattern in the hero background. Ties the cosmic theme together."
      >
        <VariantB />
      </VariantCard>

      <VariantCard
        letter="C"
        title="Pulsing Live Map"
        description="Country pins randomly fire a soft rose ping every 1.4 seconds, like live activity firing across the world. Most alive, most hyped."
      >
        <VariantC />
      </VariantCard>
    </div>

    <p
      className="text-center mt-10"
      style={{
        fontFamily: "Cormorant, Georgia, serif",
        fontSize: "0.85rem",
        color: "var(--muted, #958779)",
      }}
    >
      This page is temporary. Reply with the variant letter you want shipped and Claude will wire it into the hero + delete this preview.
    </p>
  </main>
);

export default MapPreview;
