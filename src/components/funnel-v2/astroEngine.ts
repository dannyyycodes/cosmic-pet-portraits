/* astroEngine.ts
   Real classical astrology computation for the Little Souls free reading.
   Pure, deterministic, zero dependencies. Every table in this file is
   standard traditional astrology; nothing is invented.

   Input shape: up to 13 bodies, each { sign, degree } where degree is the
   within-sign degree. The pet-birth-chart edge function sends integers
   0 to 29; fractional degrees also work.

   Table sources (verified against independent references, 2026-07-16):
   - Rulerships, exaltations, detriments, falls: the classical scheme
     (Ptolemy, Tetrabiblos I.17 to I.19). Exaltation degrees: Sun 19 Aries,
     Moon 3 Taurus, Mercury 15 Virgo, Venus 27 Pisces, Mars 28 Capricorn,
     Jupiter 15 Cancer, Saturn 21 Libra.
   - Chaldean decans (the 36 faces): the descending Chaldean order
     Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon, cycling from Mars at
     Aries 0 (Agrippa, Three Books of Occult Philosophy II).
   - Modern outer-planet rulerships (Uranus in Aquarius, Neptune in Pisces,
     Pluto in Scorpio) are applied for domicile and detriment only.
     Exaltation and fall are left to the seven classical planets because no
     consensus exists for the outers.

   No em-dashes appear in any generated string. Summaries are plain words
   so they can sit next to user-facing copy or drive it. */

/* ── Names and constants ─────────────────────────────────────────────── */

export const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;
export type SignName = (typeof SIGNS)[number];

export const BODIES = [
  "sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn",
  "uranus", "neptune", "pluto", "chiron", "northNode", "lilith",
] as const;
export type BodyName = (typeof BODIES)[number];

/* The ten planets that carry essential dignity. Chiron, the North Node and
   Lilith are points, not planets: they aspect, but they hold no dignity. */
export const PLANETS = [
  "sun", "moon", "mercury", "venus", "mars",
  "jupiter", "saturn", "uranus", "neptune", "pluto",
] as const;
export type PlanetName = (typeof PLANETS)[number];

export const BODY_LABEL: Record<BodyName, string> = {
  sun: "Sun", moon: "Moon", mercury: "Mercury", venus: "Venus",
  mars: "Mars", jupiter: "Jupiter", saturn: "Saturn", uranus: "Uranus",
  neptune: "Neptune", pluto: "Pluto", chiron: "Chiron",
  northNode: "North Node", lilith: "Lilith",
};

export type ElementName = "Fire" | "Earth" | "Air" | "Water";
export type ModeName = "Cardinal" | "Fixed" | "Mutable";
export type Polarity = "Positive" | "Negative";

/* The seven classical planets, as display labels, for the decan tables. */
export type ClassicalLabel =
  | "Sun" | "Moon" | "Mercury" | "Venus" | "Mars" | "Jupiter" | "Saturn";

export type BodyPosition = { sign: SignName; degree: number };
export type ChartBodies = Partial<Record<BodyName, BodyPosition>>;

/* ── 1. Absolute longitude ───────────────────────────────────────────── */

/* Ecliptic longitude 0 to 359.x: sign index times 30 plus within-sign
   degree. Aries 0 is longitude 0; Pisces 29 is longitude 359. */
export function absoluteLongitude(sign: SignName, degree: number): number {
  const d = Math.min(Math.max(degree, 0), 29.999);
  return SIGNS.indexOf(sign) * 30 + d;
}

/* Angular separation of two longitudes, 0 to 180, wrap-safe at 0/360. */
export function separation(lonA: number, lonB: number): number {
  const d = Math.abs(lonA - lonB) % 360;
  return d > 180 ? 360 - d : d;
}

/* ── 2. Aspects ──────────────────────────────────────────────────────── */

export type AspectType =
  | "conjunction" | "sextile" | "square" | "trine" | "opposition";

/* Classical orbs. For any pair that includes a minor point (Chiron, the
   North Node, Lilith) the allowed orb tightens to 3 degrees so the points
   only register when genuinely close. */
export const ASPECT_DEFS: { type: AspectType; angle: number; orb: number }[] = [
  { type: "conjunction", angle: 0, orb: 8 },
  { type: "sextile", angle: 60, orb: 4 },
  { type: "square", angle: 90, orb: 7 },
  { type: "trine", angle: 120, orb: 8 },
  { type: "opposition", angle: 180, orb: 8 },
];
const MINOR_POINT_ORB = 3;
const MINOR_POINTS: ReadonlySet<BodyName> = new Set<BodyName>(["chiron", "northNode", "lilith"]);

export type Exactness = "exact" | "close" | "wide";

export type Aspect = {
  a: BodyName;              /* earlier body in BODIES order */
  b: BodyName;
  type: AspectType;
  angle: number;            /* the ideal angle: 0, 60, 90, 120 or 180 */
  separation: number;       /* actual angular separation, 0 to 180 */
  orb: number;              /* distance from exact, in degrees */
  maxOrb: number;           /* the orb this pair was allowed */
  exactness: Exactness;     /* orb <= 1 exact, <= 3 close, else wide */
  /* Plain words, e.g. "Mercury opposite Saturn, 1 degree from exact". */
  summary: string;
};

const ASPECT_VERB: Record<AspectType, string> = {
  conjunction: "conjunct", sextile: "sextile", square: "square",
  trine: "trine", opposition: "opposite",
};

function fmtOrb(orb: number): string {
  const r = Math.round(orb * 10) / 10;
  if (r === 0) return "exact to the degree";
  const n = Number.isInteger(r) ? String(r) : r.toFixed(1);
  return `${n} degree${r === 1 ? "" : "s"} from exact`;
}

function exactnessOf(orb: number): Exactness {
  if (orb <= 1) return "exact";
  if (orb <= 3) return "close";
  return "wide";
}

/* All real aspects between every pair of supplied bodies, tightest first.
   Deterministic order: orb ascending, then aspect definition order, then
   body order. */
export function computeAspects(bodies: ChartBodies): Aspect[] {
  const present = BODIES.filter((name) => bodies[name] !== undefined);
  const out: Aspect[] = [];
  for (let i = 0; i < present.length; i++) {
    for (let j = i + 1; j < present.length; j++) {
      const a = present[i];
      const b = present[j];
      const pa = bodies[a];
      const pb = bodies[b];
      if (!pa || !pb) continue;
      const sep = separation(
        absoluteLongitude(pa.sign, pa.degree),
        absoluteLongitude(pb.sign, pb.degree),
      );
      for (const def of ASPECT_DEFS) {
        const maxOrb =
          MINOR_POINTS.has(a) || MINOR_POINTS.has(b)
            ? Math.min(def.orb, MINOR_POINT_ORB)
            : def.orb;
        const orb = Math.abs(sep - def.angle);
        if (orb <= maxOrb) {
          out.push({
            a, b, type: def.type, angle: def.angle,
            separation: sep, orb, maxOrb,
            exactness: exactnessOf(orb),
            summary: `${BODY_LABEL[a]} ${ASPECT_VERB[def.type]} ${BODY_LABEL[b]}, ${fmtOrb(orb)}`,
          });
          break; /* a pair can only make one aspect */
        }
      }
    }
  }
  out.sort((x, y) => {
    if (x.orb !== y.orb) return x.orb - y.orb;
    const tx = ASPECT_DEFS.findIndex((d) => d.type === x.type);
    const ty = ASPECT_DEFS.findIndex((d) => d.type === y.type);
    if (tx !== ty) return tx - ty;
    const ax = BODIES.indexOf(x.a);
    const ay = BODIES.indexOf(y.a);
    if (ax !== ay) return ax - ay;
    return BODIES.indexOf(x.b) - BODIES.indexOf(y.b);
  });
  return out;
}

/* ── 3. Essential dignity ────────────────────────────────────────────── */

export type DignityStatus =
  | "domicile" | "exaltation" | "detriment" | "fall" | "peregrine";

export type Dignity = {
  planet: PlanetName;
  sign: SignName;
  /* All statuses that apply, strongest first. Mercury in Virgo is both
     domicile and exaltation; Mercury in Pisces is both detriment and fall.
     ["peregrine"] when none apply. */
  statuses: DignityStatus[];
  primary: DignityStatus;
  /* Lilly's point values summed: domicile +5, exaltation +4,
     detriment -5, fall -4, peregrine 0. */
  score: number;
  /* The traditional exaltation degree, present when statuses includes
     exaltation (e.g. Moon in Taurus: 3). */
  exaltationDegree?: number;
  /* Plain words, e.g. "Mars in Cancer, the sign of its fall". */
  summary: string;
};

const DOMICILE: Record<PlanetName, readonly SignName[]> = {
  sun: ["Leo"],
  moon: ["Cancer"],
  mercury: ["Gemini", "Virgo"],
  venus: ["Taurus", "Libra"],
  mars: ["Aries", "Scorpio"],
  jupiter: ["Sagittarius", "Pisces"],
  saturn: ["Capricorn", "Aquarius"],
  /* Modern rulerships, standard for the outers: */
  uranus: ["Aquarius"],
  neptune: ["Pisces"],
  pluto: ["Scorpio"],
};

const EXALTATION: Partial<Record<PlanetName, { sign: SignName; degree: number }>> = {
  sun: { sign: "Aries", degree: 19 },
  moon: { sign: "Taurus", degree: 3 },
  mercury: { sign: "Virgo", degree: 15 },
  venus: { sign: "Pisces", degree: 27 },
  mars: { sign: "Capricorn", degree: 28 },
  jupiter: { sign: "Cancer", degree: 15 },
  saturn: { sign: "Libra", degree: 21 },
};

function oppositeSign(sign: SignName): SignName {
  return SIGNS[(SIGNS.indexOf(sign) + 6) % 12];
}

const DIGNITY_POINTS: Record<DignityStatus, number> = {
  domicile: 5, exaltation: 4, detriment: -5, fall: -4, peregrine: 0,
};

function dignityWords(planet: PlanetName, sign: SignName, statuses: DignityStatus[]): string {
  const label = BODY_LABEL[planet];
  const has = (s: DignityStatus) => statuses.includes(s);
  if (has("domicile") && has("exaltation"))
    return `${label} in ${sign}, its own sign and the sign of its exaltation`;
  if (has("detriment") && has("fall"))
    return `${label} in ${sign}, in both detriment and fall`;
  if (has("domicile")) return `${label} in ${sign}, its own sign`;
  if (has("exaltation")) return `${label} in ${sign}, the sign of its exaltation`;
  if (has("detriment")) return `${label} in ${sign}, the sign of its detriment`;
  if (has("fall")) return `${label} in ${sign}, the sign of its fall`;
  return `${label} in ${sign}, peregrine, with no essential dignity`;
}

/* Essential dignity of a planet in a sign. Returns null for the points
   (Chiron, North Node, Lilith), which hold no dignity. */
export function dignity(body: BodyName, sign: SignName): Dignity | null {
  if (!(PLANETS as readonly string[]).includes(body)) return null;
  const planet = body as PlanetName;
  const statuses: DignityStatus[] = [];
  let exaltationDegree: number | undefined;
  if (DOMICILE[planet].includes(sign)) statuses.push("domicile");
  const ex = EXALTATION[planet];
  if (ex && ex.sign === sign) {
    statuses.push("exaltation");
    exaltationDegree = ex.degree;
  }
  if (DOMICILE[planet].some((s) => oppositeSign(s) === sign)) statuses.push("detriment");
  if (ex && oppositeSign(ex.sign) === sign) statuses.push("fall");
  if (statuses.length === 0) statuses.push("peregrine");
  const score = statuses.reduce((sum, s) => sum + DIGNITY_POINTS[s], 0);
  const result: Dignity = {
    planet, sign, statuses, primary: statuses[0], score,
    summary: dignityWords(planet, sign, statuses),
  };
  if (exaltationDegree !== undefined) result.exaltationDegree = exaltationDegree;
  return result;
}

/* ── 4. Decans ───────────────────────────────────────────────────────── */

/* The 36 Chaldean faces: descending planetary order (Saturn, Jupiter,
   Mars, Sun, Venus, Mercury, Moon) cycling from Mars at Aries 0. */
const CHALDEAN_FACES: Record<SignName, readonly [ClassicalLabel, ClassicalLabel, ClassicalLabel]> = {
  Aries: ["Mars", "Sun", "Venus"],
  Taurus: ["Mercury", "Moon", "Saturn"],
  Gemini: ["Jupiter", "Mars", "Sun"],
  Cancer: ["Venus", "Mercury", "Moon"],
  Leo: ["Saturn", "Jupiter", "Mars"],
  Virgo: ["Sun", "Venus", "Mercury"],
  Libra: ["Moon", "Saturn", "Jupiter"],
  Scorpio: ["Mars", "Sun", "Venus"],
  Sagittarius: ["Mercury", "Moon", "Saturn"],
  Capricorn: ["Jupiter", "Mars", "Sun"],
  Aquarius: ["Venus", "Mercury", "Moon"],
  Pisces: ["Saturn", "Jupiter", "Mars"],
};

export type Decan = {
  index: 1 | 2 | 3;
  startDegree: number;      /* 0, 10 or 20 */
  endDegree: number;        /* 9, 19 or 29 */
  /* The face ruler under the Chaldean system (the classical "36 faces"). */
  chaldeanRuler: ClassicalLabel;
  /* The triplicity-based decan: first decan is the sign itself, second is
     the next sign of the same element, third is the one after that. */
  triplicitySign: SignName;
  triplicityRuler: string;  /* modern ruler of that sub-sign */
};

export function decan(sign: SignName, degree: number): Decan {
  const d = Math.min(Math.max(degree, 0), 29.999);
  const idx = (Math.floor(d / 10) as 0 | 1 | 2);
  const triplicitySign = SIGNS[(SIGNS.indexOf(sign) + idx * 4) % 12];
  return {
    index: (idx + 1) as 1 | 2 | 3,
    startDegree: idx * 10,
    endDegree: idx * 10 + 9,
    chaldeanRuler: CHALDEAN_FACES[sign][idx],
    triplicitySign,
    triplicityRuler: signMeta(triplicitySign).ruler,
  };
}

/* True when a planet stands in its own Chaldean face: the smallest of the
   classical dignities, but a real one (e.g. the Sun anywhere in Gemini 20
   to 29 is in the Sun's own face). */
export function hasFaceDignity(body: BodyName, sign: SignName, degree: number): boolean {
  const label = BODY_LABEL[body];
  return decan(sign, degree).chaldeanRuler === (label as ClassicalLabel);
}

/* ── 5. Sign metadata ────────────────────────────────────────────────── */

export type SignMeta = {
  sign: SignName;
  element: ElementName;
  mode: ModeName;
  polarity: Polarity;       /* Positive: fire and air. Negative: earth and water. */
  ruler: string;            /* modern standard ruler */
  classicalRuler: ClassicalLabel;
};

const SIGN_TABLE: Record<SignName, { element: ElementName; mode: ModeName; ruler: string; classicalRuler: ClassicalLabel }> = {
  Aries: { element: "Fire", mode: "Cardinal", ruler: "Mars", classicalRuler: "Mars" },
  Taurus: { element: "Earth", mode: "Fixed", ruler: "Venus", classicalRuler: "Venus" },
  Gemini: { element: "Air", mode: "Mutable", ruler: "Mercury", classicalRuler: "Mercury" },
  Cancer: { element: "Water", mode: "Cardinal", ruler: "Moon", classicalRuler: "Moon" },
  Leo: { element: "Fire", mode: "Fixed", ruler: "Sun", classicalRuler: "Sun" },
  Virgo: { element: "Earth", mode: "Mutable", ruler: "Mercury", classicalRuler: "Mercury" },
  Libra: { element: "Air", mode: "Cardinal", ruler: "Venus", classicalRuler: "Venus" },
  Scorpio: { element: "Water", mode: "Fixed", ruler: "Pluto", classicalRuler: "Mars" },
  Sagittarius: { element: "Fire", mode: "Mutable", ruler: "Jupiter", classicalRuler: "Jupiter" },
  Capricorn: { element: "Earth", mode: "Cardinal", ruler: "Saturn", classicalRuler: "Saturn" },
  Aquarius: { element: "Air", mode: "Fixed", ruler: "Uranus", classicalRuler: "Saturn" },
  Pisces: { element: "Water", mode: "Mutable", ruler: "Neptune", classicalRuler: "Jupiter" },
};

export function signMeta(sign: SignName): SignMeta {
  const t = SIGN_TABLE[sign];
  return {
    sign,
    element: t.element,
    mode: t.mode,
    polarity: t.element === "Fire" || t.element === "Air" ? "Positive" : "Negative",
    ruler: t.ruler,
    classicalRuler: t.classicalRuler,
  };
}

/* ── Balances and stelliums ──────────────────────────────────────────── */

/* Element and mode counts are taken over the ten planets only (matching
   the live pet-birth-chart edge function, which counts ten). The points
   would double-weight the lunar cluster. */
export function elementBalance(bodies: ChartBodies): Record<ElementName, number> {
  const counts: Record<ElementName, number> = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
  for (const p of PLANETS) {
    const pos = bodies[p];
    if (pos) counts[signMeta(pos.sign).element] += 1;
  }
  return counts;
}

export function modeBalance(bodies: ChartBodies): Record<ModeName, number> {
  const counts: Record<ModeName, number> = { Cardinal: 0, Fixed: 0, Mutable: 0 };
  for (const p of PLANETS) {
    const pos = bodies[p];
    if (pos) counts[signMeta(pos.sign).mode] += 1;
  }
  return counts;
}

export type Stellium = {
  sign: SignName;
  bodies: BodyName[];       /* in BODIES order */
  planetCount: number;      /* how many of them are true planets */
  spanDegrees: number;      /* spread from the lowest to the highest degree */
  tight: boolean;           /* bodies sit inside TIGHT_STELLIUM_SPAN: a real knot, not a whole-sign scatter */
  summary: string;
};

const COUNT_WORDS = ["", "one", "two", "three", "four", "five", "six", "seven"] as const;

/* A same-sign gathering only reads as "one bright knot" when its bodies sit
   close together. Beyond this span it is a sign emphasis, not a stellium that
   fires as one instrument, so the tight-cluster storyline is withheld. */
const TIGHT_STELLIUM_SPAN = 10;

/* Three or more bodies gathered in one sign, largest first. All thirteen
   bodies count toward a stellium; planetCount says how many are planets. */
export function findStelliums(bodies: ChartBodies): Stellium[] {
  const bySign = new Map<SignName, BodyName[]>();
  for (const name of BODIES) {
    const pos = bodies[name];
    if (!pos) continue;
    const list = bySign.get(pos.sign) ?? [];
    list.push(name);
    bySign.set(pos.sign, list);
  }
  const out: Stellium[] = [];
  for (const sign of SIGNS) {
    const members = bySign.get(sign);
    if (!members || members.length < 3) continue;
    const degs = members.map((m) => (bodies[m] as BodyPosition).degree);
    const planetCount = members.filter((m) =>
      (PLANETS as readonly string[]).includes(m)).length;
    const names = members.map((m) => BODY_LABEL[m]).join(", ");
    const countWord = COUNT_WORDS[Math.min(members.length, 7)] || String(members.length);
    const spanDegrees = Math.max(...degs) - Math.min(...degs);
    out.push({
      sign,
      bodies: members,
      planetCount,
      spanDegrees,
      tight: spanDegrees <= TIGHT_STELLIUM_SPAN,
      summary: `A gathering of ${countWord} in ${sign}: ${names}`,
    });
  }
  out.sort((x, y) => y.bodies.length - x.bodies.length ||
    SIGNS.indexOf(x.sign) - SIGNS.indexOf(y.sign));
  return out;
}

/* ── 6. Chart signature ──────────────────────────────────────────────── */

/* The strongest genuine storylines of THIS chart, ranked. Aspect strength
   scores by kind and tightness, boosted when personal planets are
   involved (a generational outer-to-outer aspect never outranks a tight
   personal one). Dignities, stelliums and lopsided element or mode
   balances take their own scores. The caller reads from the top. */

export type SignatureItem =
  | { kind: "aspect"; score: number; summary: string; aspect: Aspect }
  | { kind: "dignity"; score: number; summary: string; body: PlanetName; dignity: Dignity }
  | { kind: "stellium"; score: number; summary: string; stellium: Stellium }
  | { kind: "element"; score: number; summary: string; counts: Record<ElementName, number>; scarce: ElementName | null; dominant: ElementName | null }
  | { kind: "mode"; score: number; summary: string; counts: Record<ModeName, number>; scarce: ModeName | null; dominant: ModeName | null };

/* How personally a body speaks in a pet's chart. */
const PERSONAL_WEIGHT: Record<BodyName, number> = {
  sun: 5, moon: 5, mercury: 4, venus: 4, mars: 4,
  jupiter: 2, saturn: 2, uranus: 0, neptune: 0, pluto: 0,
  chiron: 1, northNode: 1, lilith: 1,
};

const ASPECT_BASE: Record<AspectType, number> = {
  conjunction: 10, opposition: 9, square: 9, trine: 8, sextile: 6,
};

function aspectScore(a: Aspect): number {
  return ASPECT_BASE[a.type] + PERSONAL_WEIGHT[a.a] + PERSONAL_WEIGHT[a.b] - a.orb;
}

function balanceItem<K extends string>(
  kindName: "element" | "mode",
  counts: Record<K, number>,
  order: readonly K[],
  total: number,
): { score: number; summary: string; scarce: K | null; dominant: K | null } | null {
  if (total < 5) return null; /* not enough bodies supplied to judge */
  let scarce: K | null = null;
  let dominant: K | null = null;
  for (const k of order) {
    if (counts[k] === 0 && scarce === null) scarce = k;
  }
  if (scarce === null) {
    for (const k of order) {
      if (counts[k] === 1 && scarce === null) scarce = k;
    }
  }
  for (const k of order) {
    if (counts[k] >= Math.ceil(total * 0.6) && dominant === null) dominant = k;
  }
  if (scarce !== null && counts[scarce] === 0) {
    return {
      score: 9, scarce, dominant,
      summary: `No ${scarce} among the ${total} planets placed`,
    };
  }
  if (dominant !== null) {
    return {
      score: 8, scarce, dominant,
      summary: `${counts[dominant]} of ${total} planets stand in ${dominant} signs`,
    };
  }
  if (scarce !== null) {
    return {
      score: 7, scarce, dominant,
      summary: `Only one of the ${total} planets stands in a ${scarce} sign`,
    };
  }
  return null;
}

const OUTER_BODIES: ReadonlySet<BodyName> = new Set(["uranus", "neptune", "pluto"]);

export function chartSignature(bodies: ChartBodies): SignatureItem[] {
  const items: SignatureItem[] = [];

  for (const a of computeAspects(bodies)) {
    /* An outer-to-outer aspect (Uranus/Neptune/Pluto) is a generational angle,
       true of every pet born that year. It must never headline the signature
       card as if it were personal, so it is not offered as a storyline. */
    if (OUTER_BODIES.has(a.a) && OUTER_BODIES.has(a.b)) continue;
    items.push({ kind: "aspect", score: aspectScore(a), summary: a.summary, aspect: a });
  }

  for (const p of PLANETS) {
    const pos = bodies[p];
    if (!pos) continue;
    const d = dignity(p, pos.sign);
    if (!d || d.primary === "peregrine") continue;
    items.push({
      kind: "dignity",
      score: Math.abs(d.score) + 2 + PERSONAL_WEIGHT[p],
      summary: d.summary,
      body: p,
      dignity: d,
    });
  }

  for (const s of findStelliums(bodies)) {
    const weight = s.bodies.reduce((sum, b) => sum + PERSONAL_WEIGHT[b], 0);
    items.push({ kind: "stellium", score: 6 + weight, summary: s.summary, stellium: s });
  }

  const eCounts = elementBalance(bodies);
  const eTotal = eCounts.Fire + eCounts.Earth + eCounts.Air + eCounts.Water;
  const e = balanceItem("element", eCounts, ["Fire", "Earth", "Air", "Water"] as const, eTotal);
  if (e) items.push({ kind: "element", counts: eCounts, ...e });

  const mCounts = modeBalance(bodies);
  const mTotal = mCounts.Cardinal + mCounts.Fixed + mCounts.Mutable;
  const m = balanceItem("mode", mCounts, ["Cardinal", "Fixed", "Mutable"] as const, mTotal);
  if (m) items.push({ kind: "mode", counts: mCounts, ...m });

  const kindOrder = { aspect: 0, dignity: 1, stellium: 2, element: 3, mode: 4 } as const;
  items.sort((x, y) => y.score - x.score ||
    kindOrder[x.kind] - kindOrder[y.kind] ||
    x.summary.localeCompare(y.summary));
  return items;
}

/* ── Adapter for the edge-function payload ───────────────────────────── */

/* The pet-birth-chart edge function sends { sign: string, degree?: number }
   per body. This narrows that loose shape to typed ChartBodies. A body is
   kept only when its sign is a real sign AND its degree is a finite number
   inside [0, 30): the engine never invents a degree. */
export function normalizeBodies(
  raw: Partial<Record<BodyName, { sign?: string | null; degree?: number | null } | null | undefined>>,
): ChartBodies {
  const out: ChartBodies = {};
  for (const name of BODIES) {
    const body = raw[name];
    if (!body || typeof body.sign !== "string") continue;
    const sign = body.sign as SignName;
    if (!SIGNS.includes(sign)) continue;
    const degree = body.degree;
    if (typeof degree !== "number" || !Number.isFinite(degree) || degree < 0 || degree >= 30) continue;
    out[name] = { sign, degree };
  }
  return out;
}
