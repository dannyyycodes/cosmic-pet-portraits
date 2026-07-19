/* deckCompose.ts
   The bridge between the real astrology engine (astroEngine.ts) and the
   quality-gated copy pools (deckPools/). Every card it composes carries the
   approved FOUR-BEAT anatomy (Danny, 2026-07-16 draft):

     1. TEACH       one canonical, trusted line per planet: what this planet
                    is. Identical for every chart, both voices.
     2. THEIR SKY   the real chart fact with the real numbers injected:
                    the degree line, or the aspect line with partner + orb,
                    faceted from the engine (tightest aspect first, then
                    strongest dignity, then own face, then the plain degree).
     3. THE LOVE    the recognition beat: what this placement means in how
                    they love the owner. Keyed planet x sign (LOVE_POOL core)
                    and, when the sky told an aspect or dignity, carried on
                    by that fact's gated behaviour beat.
     4. THE LOCKED  the depth tease, a different device per planet
        DOOR        (PLANET_SEALS), keyed where linked to a genuinely sealed
                    body this planet really aspects.

   Everything here is deterministic: the same pet name + date always
   composes the same deck, and two different pets diverge through both the
   chart facts and the seeded pool picks.

   SAFETY LAW: a composed card is returned ONLY when every rendered string
   is free of unfilled placeholders. Any leak falls the card back to the
   legacy static entry upstream (buildDeck keeps those in the bundle), so
   the deck can never render a brace or an empty card. */

import {
  BODY_LABEL,
  PLANETS,
  computeAspects,
  chartSignature,
  dignity,
  hasFaceDignity,
  normalizeBodies,
  signMeta,
  type Aspect,
  type AspectType,
  type BodyName,
  type BodyPosition,
  type ChartBodies,
  type DignityStatus,
  type ElementName,
  type PlanetName,
} from "./astroEngine";
import {
  ASPECT_POOL,
  LOVE_POOL,
  PLANET_SEALS,
  SIGNATURES,
  aspectKey,
  dignityKey,
  loveKey,
} from "./deckPools";
import type { Beat, Family, SealedBody, SignatureKind, SignatureTemplate } from "./deckPools/types";
import { DECK_PLANETS, fill, type DeckPlanet, type Subject, type Voiced } from "./freeDeck";

export type ComposedPlanetCard = {
  teach: string;   /* beat 1: the canonical planet line */
  sky: string;     /* beat 2: the real chart fact, numbers injected */
  love: string;    /* beat 3: the recognition beat, love-first */
  seal: string;    /* beat 4: the locked-door device */
  sealBody: SealedBody;
};

export type ComposedElementCard = {
  teach: string;
  sky: string;
  love: string;
  seal: string;
};

export type ComposedSignatureCard = {
  kind: SignatureKind;
  teach: string;
  fact: string;      /* beat 2: their sky */
  meaning: string;   /* beat 3a */
  behaviour: string; /* beat 3b */
  law: string;       /* beat 3 close, the quotable line */
  seal: string;      /* beat 4: all thirteen read as one */
};

export type ComposedDeck = {
  planets: Partial<Record<DeckPlanet, ComposedPlanetCard>>;
  element: ComposedElementCard | null;
  signature: ComposedSignatureCard | null;
};

/* ── Beat 1: the canonical teach lines (approved draft, verbatim) ───────── */

export const CANON_TEACH: Record<DeckPlanet, string> = {
  sun: "The Sun is the centre of a chart. Who someone is before anything ever shaped them.",
  moon: "The Moon is the private half of a chart. What a soul needs when nobody is watching.",
  venus: "Venus is the heart's own planet. How a soul gives love back, in its own dialect.",
  mercury: "Mercury is the messenger. How a soul says things without a single word.",
  mars: "Mars is the engine. Where a soul's energy goes when it finally lets go.",
};

export const ELEMENT_TEACH =
  "Every chart leans on some elements and starves others. The lean is the temperament.";

export const SIGNATURE_TEACH =
  "Every chart has one loudest line. The signature. The sentence the whole sky was writing.";

const SIGNATURE_SEAL: Voiced = {
  d: "The full reading opens all thirteen placements and reads them as one, this thread followed to its end, written for {name} alone.",
  m: "The full reading opens all thirteen placements and reads them as one, this thread followed to its end, written for {name} alone.",
};

/* ── Deterministic pool picking ─────────────────────────────────────────── */

/* FNV-1a, 32 bit. Stable per pet (name + date in the seed), different
   across pets, no randomness between renders. */
function hashSeed(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function pickFrom<T>(arr: readonly T[], seed: string): T {
  return arr[hashSeed(seed) % arr.length];
}

/* The love beat opens on the sign truth and carries on with the fact's
   behaviour beat. The sky beat has already told the numbers, so among a
   key's beats prefer ones whose behaviour carries no raw number
   placeholder (a repeated "{SEP} degrees" reads machine-made). Falls back
   to the full pool when every behaviour in the key uses one. */
function pickBeat<T extends { behaviour: { d: string; m: string } }>(arr: readonly T[], seed: string): T {
  const plain = arr.filter((b) => !/\{(SEP|DEG|PDEG|ORB)\}/.test(b.behaviour.d + " " + b.behaviour.m));
  return pickFrom(plain.length ? plain : arr, seed);
}

/* ── Number formatting (all display degrees are integers) ───────────────── */

const SMALL_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"] as const;

function orbPhrase(orb: number): string {
  const n = Math.round(orb);
  if (n <= 0) return "exact to the degree";
  if (n === 1) return "one degree from exact";
  return `${SMALL_WORDS[n] ?? String(n)} degrees from exact`;
}

/* Distance-only words ("five degrees"), null when the angle is exact. */
function orbDistance(orb: number): string | null {
  const n = Math.round(orb);
  if (n <= 0) return null;
  if (n === 1) return "one degree";
  return `${SMALL_WORDS[n] ?? String(n)} degrees`;
}

/* A handful of pool frames use {ORB} as a pure distance ("stands {ORB}
   from a hard angle"). Injecting the full phrase there would double the
   "from exact", so those frames are rewritten around the real number
   BEFORE the generic injection runs. Every other {ORB} stays the full
   appositive phrase. */
function prepOrbContexts(text: string, orb: number | null): string {
  if (orb === null) return text;
  const dist = orbDistance(orb);
  return text
    .replace(/\{ORB\} from (a hard|an easy) angle/g, (_m, art: string) => {
      const kind = art === "a hard" ? "hard" : "easy";
      return dist ? `${dist} from an exact ${kind} angle` : `exactly on ${art} angle`;
    })
    .replace(/\{ORB\} from \{poss\}/g, () => (dist ? `${dist} from {poss}` : `on the exact degree of {poss}`))
    .replace(/\{ORB\} against \{poss\}/g, () =>
      dist ? `${dist} from exact, set against {poss}` : `exact to the degree, set against {poss}`)
    .replace(/you get \{ORB\}/g, () => (dist ? `you get ${dist}` : `you get no distance at all`));
}

/* "the North Node" mid-list; a sentence-case pass downstream fixes any
   token that happens to open a sentence. */
function bodyPhrase(b: BodyName): string {
  return b === "northNode" ? "the North Node" : BODY_LABEL[b];
}

function joinLabels(bodies: readonly BodyName[]): string {
  const names = bodies.map(bodyPhrase);
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/* Planet names as they read in a sentence: the Sun, the Moon, Venus. */
const PLANET_WORD: Record<DeckPlanet, string> = {
  sun: "Sun", moon: "Moon", venus: "Venus", mercury: "Mercury", mars: "Mars",
};
function planetWithThe(p: DeckPlanet): string {
  return p === "sun" || p === "moon" ? `the ${PLANET_WORD[p]}` : PLANET_WORD[p];
}

/* ── Placeholder injection ──────────────────────────────────────────────── */

type NumberBag = Partial<Record<
  "DEG" | "SIGN" | "PDEG" | "PSIGN" | "PARTNER" | "ORB" | "SEP" | "BODIES" | "COUNT" | "SPAN" | "ELEMENT" | "MODE" | "SEALED",
  string
>>;

function inject(text: string, bag: NumberBag): string {
  return text.replace(
    /\{(DEG|SIGN|PDEG|PSIGN|PARTNER|ORB|SEP|BODIES|COUNT|SPAN|ELEMENT|MODE|SEALED)\}/g,
    (whole, key: keyof NumberBag) => bag[key] ?? whole,
  );
}

/* Injected phrases like "the North Node" can land at a sentence start.
   Pool copy is plain prose (no abbreviations), so sentence-casing after
   terminal punctuation is safe and keeps every composed line grammatical. */
function sentenceCase(text: string): string {
  return text.replace(/(^|[.!?]\s+)([a-z])/g, (_m, lead: string, ch: string) => lead + ch.toUpperCase());
}

/* Injected integers meet the pools' plural "degrees": "at 1 degrees of"
   must read "at 1 degree of". Digits only ever arrive via injection, so
   the rewrite cannot touch authored copy. */
function fixDegreeGrammar(text: string): string {
  return text.replace(/(^|[^0-9])1 degrees\b/g, "$11 degree");
}

/* A placement in the first degree of a sign rounds to 0 and would otherwise
   read "at 0 degrees of Aries", which looks like an error. Digits only ever
   arrive via injection, so rewriting the zero case cannot touch authored copy. */
function fixZeroDegree(text: string): string {
  return text.replace(/\b0 degrees\b/g, "the first degree");
}

/* The no-name "Other" subject renders {Name} -> "They" and {name} -> "them".
   The copy pools were authored with a singular name in the subject slot
   ("Monty is", "the moods Monty reads"), so the plural fallback would print
   "They is", "They chooses", "them reads". This pass runs ONLY for that
   fallback subject: it brings a singular verb after the pronoun into plural
   agreement and lifts a bare object "them" in subject position to "they".
   Named / dog / cat subjects are singular and never enter here, so their
   approved copy is untouched. */
const THEY_IRREGULAR: Record<string, string> = { is: "are", was: "were", has: "have", does: "do", goes: "go" };
/* -s words that are NOT third-person-singular verbs, so must never be flattened. */
const THEY_NONVERB = new Set([
  "always", "already", "only", "perhaps", "sometimes", "sideways", "its",
  "this", "thus", "less", "unless", "whose", "yes", "both", "never", "still",
  "also", "just", "even", "often", "once", "twice", "as",
]);
/* Clause-openers that force the following pronoun to read as a SUBJECT. */
const THEY_SUBORDINATORS = new Set([
  "what", "which", "how", "where", "when", "why", "that", "who", "whom",
  "because", "if", "whether", "and", "but", "then", "so", "as",
]);
/* Prepositions and object-taking verbs: a lowercase "them" straight after one
   of these is an OBJECT ("at them", "let them", "promised them") and must be
   left alone. Any preceding word ending in -s or -ed is also treated as a verb
   (so "settles them", "promised them" stay object). Everything else before
   "them" (a noun, an adjective, an adverb, a subordinator) reads it as a
   SUBJECT and lifts it to "they". Capitalised "They"/"Them" is nominative and
   is always a subject. */
const THEY_PREPS = new Set([
  "at", "to", "for", "with", "in", "on", "of", "into", "from", "between",
  "near", "beside", "around", "past", "behind", "before", "after", "against",
  "through", "over", "under", "by", "like", "than", "up", "off", "toward",
  "towards", "onto", "upon", "without", "within", "across", "about", "among",
  "beneath", "below", "above",
]);
const THEY_OBJECT_VERBS = new Set([
  "let", "make", "give", "tell", "show", "watch", "keep", "hold", "take",
  "put", "set", "send", "see", "saw", "meet", "met", "find", "found", "feel",
  "hear", "heard", "help", "want", "bring", "brought", "leave", "left", "call",
  "hand", "offer", "teach", "get", "let", "made", "gave", "told", "showed",
  "kept", "held", "took", "sent", "felt", "meant", "cut", "hit",
]);
function pluralizeVerb(v: string): string {
  const low = v.toLowerCase();
  if (THEY_IRREGULAR[low]) return THEY_IRREGULAR[low];
  if (/ies$/.test(low)) return low.slice(0, -3) + "y";
  if (/(ss|ch|sh|x|z|o)es$/.test(low)) return low.slice(0, -2);
  if (low.endsWith("s")) return low.slice(0, -1);
  return low;
}
function normalizeTheyThem(text: string): string {
  return text.replace(/(\b[A-Za-z]+\s+)?\b(They|Them|them)(\s+)([A-Za-z]+)/g,
    (whole, before: string | undefined, subj: string, gap: string, next: string) => {
      const prev = before ? before.trim().toLowerCase() : "";
      let pronoun = subj;
      if (subj === "them" || subj === "Them") {
        const isObject =
          !THEY_SUBORDINATORS.has(prev) &&
          (THEY_PREPS.has(prev) ||
            THEY_OBJECT_VERBS.has(prev) ||
            (prev.length > 2 && /(s|ed)$/.test(prev)));
        if (isObject) return whole; /* object "them" stays as written */
        pronoun = subj === "Them" ? "They" : "they";
      }
      const low = next.toLowerCase();
      const nextIsVerb = low === "was" || (/s$/.test(low) && !THEY_NONVERB.has(low));
      const newNext = nextIsVerb ? pluralizeVerb(next) : next;
      if (pronoun === subj && newNext === next) return whole;
      return (before ?? "") + pronoun + gap + newNext;
    });
}

/* THE GUARD: a composed string may never carry a brace to the screen. */
function hasLeak(parts: string[]): boolean {
  return parts.some((p) => p.includes("{") || p.includes("}"));
}

/* ── Species filtering ──────────────────────────────────────────────────── */

function beatsFor(key: string, species: string | null | undefined): Beat[] {
  const bucket = ASPECT_POOL[key];
  if (!bucket) return [];
  const sp = species === "dog" || species === "cat" ? species : null;
  return bucket.filter((b) => b.species === "any" || (sp !== null && b.species === sp));
}

/* ── Aspect family mapping ──────────────────────────────────────────────── */

const FAMILY_OF: Record<AspectType, Family> = {
  conjunction: "fused",
  square: "hard",
  opposition: "hard",
  trine: "soft",
  sextile: "soft",
};

const SEALED_BODIES: readonly SealedBody[] = [
  "saturn", "chiron", "jupiter", "pluto", "northNode", "uranus", "neptune", "lilith",
];
const SEALED_SET: ReadonlySet<string> = new Set(SEALED_BODIES);

function isSealed(b: BodyName): b is SealedBody {
  return SEALED_SET.has(b);
}

/* ── Beat 2 templates: THEIR SKY (real numbers, draft phrasing) ─────────── */

function skyForAspect(planet: DeckPlanet, pos: BodyPosition, partner: BodyName, asp: Aspect, seed: string): string {
  const P = PLANET_WORD[planet];
  const deg = Math.round(pos.degree);
  const partnerLabel = BODY_LABEL[partner]; /* after {poss}: "their North Node" reads right */
  const dist = orbDistance(asp.orb);
  switch (asp.type) {
    case "conjunction":
      return dist
        ? `{Poss} ${P} stands at ${deg} degrees of ${pos.sign}, ${dist} from {poss} ${partnerLabel}. In a chart that close, two planets speak as one instrument.`
        : `{Poss} ${P} stands at ${deg} degrees of ${pos.sign}, on the very same degree as {poss} ${partnerLabel}. Planets do not sit closer than this. The two speak as one instrument.`;
    case "opposition": {
      const variants = dist
        ? [
            `{Poss} ${P} sits at ${deg} degrees of ${pos.sign}, staring straight across the whole sky at {poss} ${partnerLabel}, ${dist} from an exact opposition.`,
            `{Poss} ${P} sits at ${deg} degrees of ${pos.sign}, directly across the sky from {poss} ${partnerLabel}. The two face each other, ${dist} off an exact opposition.`,
          ]
        : [
            `{Poss} ${P} sits at ${deg} degrees of ${pos.sign}, staring straight across the whole sky at {poss} ${partnerLabel}. The line between them is exact to the degree.`,
          ];
      return pickFrom(variants, `${seed}|sky|opp`);
    }
    case "square":
      return `{Poss} ${P} stands at ${deg} degrees of ${pos.sign}, meeting {poss} ${partnerLabel} at a right angle, ${orbPhrase(asp.orb)}. Astrologers call it a square: two pulls grinding at one corner, and neither gives way.`;
    case "trine":
      return `{Poss} ${P} sits at ${deg} degrees of ${pos.sign}, in an easy flowing line to {poss} ${partnerLabel}, ${orbPhrase(asp.orb)}. A trine: one part of them feeding another without effort.`;
    case "sextile":
      return `{Poss} ${P} sits at ${deg} degrees of ${pos.sign}, at a helping angle to {poss} ${partnerLabel}, ${orbPhrase(asp.orb)}. A sextile: a door held open between two planets, and this chart uses it.`;
  }
}

const DIGNITY_SKY_TAIL: Record<Exclude<DignityStatus, "peregrine"> | "face", string> = {
  domicile: "That is its own sign. The planet is at home there, running at full strength.",
  exaltation: "That is the sign the old astrologers say honours it most. They call it exaltation: a guest the house was built for.",
  detriment: "That is the sign directly opposite its home ground. Far from its own tools, it improvises.",
  fall: "That is the sign the old astrologers call its fall. The strength is all still there. It just bends into an unexpected shape.",
  face: "", /* face writes its own line below */
};

function skyForDignity(planet: DeckPlanet, pos: BodyPosition, status: string): string {
  const theP = planetWithThe(planet);
  const deg = Math.round(pos.degree);
  const lead = `The day {name} arrived, ${theP} stood at ${deg} degrees of ${pos.sign}.`;
  if (status === "face") {
    return `${lead} That exact stretch of ${pos.sign} is the ${PLANET_WORD[planet]}'s own face, a small old dignity earned by the degree itself rather than the sign.`;
  }
  const tail = DIGNITY_SKY_TAIL[status as keyof typeof DIGNITY_SKY_TAIL];
  return tail ? `${lead} ${tail}` : lead;
}

function skyPlain(planet: DeckPlanet, pos: BodyPosition, seed: string): string {
  const deg = Math.round(pos.degree);
  const variants = [
    `The day {name} arrived, ${planetWithThe(planet)} stood at ${deg} degrees of ${pos.sign}.`,
    `{Poss} ${PLANET_WORD[planet]} holds ${deg} degrees of ${pos.sign}. It has held that exact spot since the day they were born, and it never moves.`,
  ];
  return pickFrom(variants, `${seed}|sky|plain|${planet}`);
}

/* ── The element card pieces (beat 2 and 3 composed from real counts) ───── */

const ELEMENT_TRAIT: Record<ElementName, string> = {
  Fire: "drive", Earth: "steadiness", Air: "curiosity", Water: "feeling",
};

const ELEMENT_FEEL: Record<ElementName, Voiced> = {
  Fire: { d: "Fire throws itself at you.", m: "Fire threw itself at you." },
  Earth: { d: "Earth stays beside you.", m: "Earth stayed beside you." },
  Air: { d: "Air wants to know you.", m: "Air wanted to know you." },
  Water: { d: "Water feels you.", m: "Water felt you." },
};

const ELEMENT_LOW: Record<ElementName, Voiced> = {
  Fire: {
    d: "Low fire means the love does not blaze and burn out. It holds. No fireworks, just a flame that has never once gone out.",
    m: "Low fire meant the love never blazed and burned out. It held. No fireworks, just a flame that never once went out.",
  },
  Earth: {
    d: "Low earth means routine is not what holds them. You are. Move the whole house tomorrow and they are fine by Thursday, as long as the people come too. {Poss} home has always been a who, not a where.",
    m: "Low earth meant routine was never what held them. You were. {Poss} home was never a where. It was a who, and it was you.",
  },
  Air: {
    d: "Low air means there is no figuring you out and no need to. They skip the thinking and go straight to the knowing. You are not a puzzle to them. You are the answer.",
    m: "Low air meant there was no figuring you out and no need to. They skipped the thinking and went straight to the knowing. You were never a puzzle to them. You were the answer.",
  },
  Water: {
    d: "Low water means the love is not weather. It is ground. They do not ride your moods, they stand steady underneath them, the same on your worst day as your best.",
    m: "Low water meant the love was never weather. It was ground. They did not ride your moods, they stood steady underneath them, the same on your worst day as your best.",
  },
};

/* Short on purpose: the seal bar's own tag already says "In the full reading". */
const ELEMENT_SEAL: Record<ElementName, Voiced> = {
  Fire: {
    d: "What lights the fire this chart keeps low, the one spark worth striking, stays sealed.",
    m: "What lit the fire this chart keeps low, and when you saw it flare, stays sealed.",
  },
  Earth: {
    d: "What fills in the earth this chart runs low on, the one steadying thing to never take away, stays sealed.",
    m: "What filled in the earth this chart runs low on, and how much of it was you, stays sealed.",
  },
  Air: {
    d: "What feeds the air this chart runs low on, the one puzzle worth setting, stays sealed.",
    m: "What fed the air this chart runs low on, the games that did it, stays sealed.",
  },
  Water: {
    d: "What tops up the water this chart runs low on, the one softness that reaches them, stays sealed.",
    m: "What topped up the water this chart runs low on, the softness that always reached them, stays sealed.",
  },
};

const ELEMENT_ORDER: readonly ElementName[] = ["Fire", "Earth", "Air", "Water"];

function composeElement(bodies: ChartBodies, voice: "d" | "m", render: (t: string, bag?: NumberBag) => string): ComposedElementCard | null {
  const counts: Record<ElementName, number> = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
  let placed = 0;
  for (const p of DECK_PLANETS) {
    const pos = bodies[p];
    if (!pos) continue;
    counts[signMeta(pos.sign).element] += 1;
    placed += 1;
  }
  if (placed < 3) return null;

  const ranked = [...ELEMENT_ORDER].sort((a, b) => counts[b] - counts[a] || ELEMENT_ORDER.indexOf(a) - ELEMENT_ORDER.indexOf(b));
  const top1 = ranked[0];
  const top2 = ranked[1];
  const twoLean = counts[top1] >= 2 && counts[top2] >= 2;
  const lean = twoLean ? [top1, top2] : [top1];

  /* The scarce element: a zero first, else the smallest count outside the lean. */
  let scarce: ElementName | null = null;
  for (const el of ELEMENT_ORDER) {
    if (counts[el] === 0) { scarce = el; break; }
  }
  if (!scarce) {
    const outside = ranked.filter((el) => !lean.includes(el));
    scarce = outside.length ? outside[outside.length - 1] : ranked[ranked.length - 1];
  }
  const missing = counts[scarce] === 0;

  const low = (s: string) => s.toLowerCase();
  const skyLead = twoLean
    ? `{Poss} chart leans ${low(top1)} and ${low(top2)}: ${ELEMENT_TRAIT[top1]} and ${ELEMENT_TRAIT[top2]}.`
    : `{Poss} chart leans hard into ${low(top1)}: ${ELEMENT_TRAIT[top1]} before everything else.`;
  const skyTail = missing
    ? `There is no ${low(scarce)} in it at all.`
    : `${scarce} is the element it carries least.`;

  const feel = lean.map((el) => ELEMENT_FEEL[el][voice]).join(" ");
  const love = `${feel} ${ELEMENT_LOW[scarce][voice]}`;

  const card: ComposedElementCard = {
    teach: ELEMENT_TEACH,
    sky: render(`${skyLead} ${skyTail}`),
    love: render(love),
    seal: render(ELEMENT_SEAL[scarce][voice]),
  };
  if (hasLeak([card.teach, card.sky, card.love, card.seal])) return null;
  return card;
}

/* ── The composer ───────────────────────────────────────────────────────── */

export function composeDeck(args: {
  raw: Parameters<typeof normalizeBodies>[0];
  voice: "d" | "m";
  species?: string | null;
  subject: Subject;
  seed: string; /* pet name + date */
}): ComposedDeck {
  const { raw, voice, species, subject, seed } = args;
  const empty: ComposedDeck = { planets: {}, element: null, signature: null };

  let bodies: ChartBodies;
  let aspects: Aspect[];
  try {
    bodies = normalizeBodies(raw);
    aspects = computeAspects(bodies);
  } catch (error) {
    console.warn("[Little Souls] astro engine failed, deck falls back to static copy", error);
    return empty;
  }

  const usedAspects = new Set<string>();   /* "a|b|type" pairs already told */
  const usedDignities = new Set<string>(); /* "planet|status" facts already told */
  const usedSeals = new Set<SealedBody>();

  /* True only for the no-name "Other" fallback subject ("They"/"them"), which
     needs verb-agreement repair the singular name paths never do. */
  const isPluralSubject = subject.Name === "They" && subject.name === "them";

  const render = (text: string, bag: NumberBag = {}, orbN: number | null = null): string => {
    const out = fixZeroDegree(fixDegreeGrammar(sentenceCase(fill(inject(prepOrbContexts(text, orbN), bag), subject))));
    return isPluralSubject ? normalizeTheyThem(out) : out;
  };

  /* The sealed bodies each planet REALLY aspects (for linked seal devices). */
  const partneredSealed = new Map<DeckPlanet, Set<SealedBody>>();
  for (const p of DECK_PLANETS) partneredSealed.set(p, new Set());
  for (const a of aspects) {
    if ((DECK_PLANETS as readonly string[]).includes(a.a) && isSealed(a.b)) partneredSealed.get(a.a as DeckPlanet)?.add(a.b);
    if ((DECK_PLANETS as readonly string[]).includes(a.b) && isSealed(a.a)) partneredSealed.get(a.b as DeckPlanet)?.add(a.a);
  }

  /* Seal choice: the aspect partner when it is genuinely sealed, else the
     card planet's next sealed aspect partner, else the chart's tightest
     sealed body, else the canonical dark-body order. Never repeats. */
  const chooseSeal = (planet: DeckPlanet, factPartner: BodyName | null): SealedBody | null => {
    const ranked: SealedBody[] = [];
    const push = (b: BodyName) => {
      if (isSealed(b) && !usedSeals.has(b) && !ranked.includes(b)) ranked.push(b);
    };
    if (factPartner) push(factPartner);
    for (const a of aspects) {
      if (a.a === planet) push(a.b);
      else if (a.b === planet) push(a.a);
    }
    for (const a of aspects) {
      push(a.a);
      push(a.b);
    }
    for (const b of SEALED_BODIES) {
      if (bodies[b]) push(b);
    }
    for (const b of SEALED_BODIES) push(b);
    return ranked[0] ?? null;
  };

  const composeSeal = (planet: DeckPlanet, factPartner: BodyName | null): { seal: string; sealBody: SealedBody } | null => {
    const body = chooseSeal(planet, factPartner);
    if (!body) return null;
    const linkable = partneredSealed.get(planet)?.has(body) ?? false;
    const pool = PLANET_SEALS[planet].filter((b) => !b.linked || linkable);
    if (!pool.length) return null;
    const beat = pickFrom(pool, `${seed}|seal|${planet}|${body}`);
    const seal = render(beat.text[voice], { SEALED: bodyPhrase(body) });
    if (hasLeak([seal])) return null;
    return { seal, sealBody: body };
  };

  /* ── Planet cards: the four beats ── */
  const planets: Partial<Record<DeckPlanet, ComposedPlanetCard>> = {};

  for (const planet of DECK_PLANETS) {
    const pos = bodies[planet];
    if (!pos) continue; /* missing body: the card stays on legacy copy */

    const loveEntry = LOVE_POOL[loveKey(planet, pos.sign)];
    if (!loveEntry) continue; /* no sign-love entry: legacy copy holds the card */

    type Candidate = {
      sky: string;
      behaviour: Beat["behaviour"] | null; /* null = plain degree card, love uses "more" */
      bag: NumberBag;
      orb: number | null;
      markUsed: () => void;
      factPartner: BodyName | null;
    };

    const candidates: Candidate[] = [];

    /* 1. Tightest aspect first (computeAspects is already tightest-first),
       skipping any pair another card has already told. */
    for (const asp of aspects) {
      if (asp.a !== planet && asp.b !== planet) continue;
      const pairId = `${asp.a}|${asp.b}|${asp.type}`;
      if (usedAspects.has(pairId)) continue;
      const partner = asp.a === planet ? asp.b : asp.a;
      const pool = beatsFor(aspectKey(planet, partner, FAMILY_OF[asp.type]), species);
      if (!pool.length) continue;
      const ppos = bodies[partner];
      if (!ppos) continue;
      candidates.push({
        sky: skyForAspect(planet, pos, partner, asp, seed),
        behaviour: pickBeat(pool, `${seed}|${planet}|${partner}|${asp.type}`).behaviour,
        bag: {
          DEG: String(Math.round(pos.degree)),
          SIGN: pos.sign,
          PDEG: String(Math.round(ppos.degree)),
          PSIGN: ppos.sign,
          PARTNER: bodyPhrase(partner),
          ORB: orbPhrase(asp.orb),
          SEP: String(Math.round(asp.separation)),
        },
        orb: asp.orb,
        markUsed: () => usedAspects.add(pairId),
        factPartner: partner,
      });
    }

    /* 2. Strongest dignity (domicile, exaltation, detriment, fall). */
    const dig = dignity(planet, pos.sign);
    if (dig && dig.primary !== "peregrine") {
      const pool = beatsFor(dignityKey(planet, dig.primary), species);
      if (pool.length) {
        candidates.push({
          sky: skyForDignity(planet, pos, dig.primary),
          behaviour: pickBeat(pool, `${seed}|${planet}|${dig.primary}`).behaviour,
          bag: { DEG: String(Math.round(pos.degree)), SIGN: pos.sign },
          orb: null,
          markUsed: () => usedDignities.add(`${planet}|${dig.primary}`),
          factPartner: null,
        });
      }
    }

    /* 3. The planet standing in its own Chaldean face. */
    if (hasFaceDignity(planet, pos.sign, pos.degree)) {
      const pool = beatsFor(dignityKey(planet, "face"), species);
      if (pool.length) {
        candidates.push({
          sky: skyForDignity(planet, pos, "face"),
          behaviour: pickBeat(pool, `${seed}|${planet}|face`).behaviour,
          bag: { DEG: String(Math.round(pos.degree)), SIGN: pos.sign },
          orb: null,
          markUsed: () => usedDignities.add(`${planet}|face`),
          factPartner: null,
        });
      }
    }

    /* 4. The always-there fallback: the plain degree line + the full
       sign-love beat. Never fails, so every present planet composes. */
    candidates.push({
      sky: skyPlain(planet, pos, seed),
      behaviour: null,
      bag: { DEG: String(Math.round(pos.degree)), SIGN: pos.sign },
      orb: null,
      markUsed: () => undefined,
      factPartner: null,
    });

    for (const cand of candidates) {
      const teach = CANON_TEACH[planet];
      const sky = render(cand.sky, cand.bag, cand.orb);
      const loveTail = cand.behaviour ? render(cand.behaviour[voice], cand.bag, cand.orb) : render(loveEntry.more[voice]);
      const love = `${render(loveEntry.core[voice])} ${loveTail}`;
      if (hasLeak([teach, sky, love])) {
        console.warn(`[Little Souls] placeholder leak in ${planet} beat, trying next fact`);
        continue;
      }
      const sealed = composeSeal(planet, cand.factPartner);
      if (!sealed) continue;
      cand.markUsed();
      usedSeals.add(sealed.sealBody);
      planets[planet] = { teach, sky, love, seal: sealed.seal, sealBody: sealed.sealBody };
      break;
    }
  }

  /* ── The balance card (beat anatomy from the real element counts) ── */
  const element = composeElement(bodies, voice, (t, bag) => render(t, bag));

  /* ── The chart signature (revelation) card ── */
  let signature: ComposedSignatureCard | null = null;

  const renderSignature = (kind: SignatureKind, bag: NumberBag, orbN: number | null = null): ComposedSignatureCard | null => {
    const sp = species === "dog" || species === "cat" ? species : null;
    const pool = SIGNATURES.filter(
      (t: SignatureTemplate) => t.kind === kind && (t.species === "any" || (sp !== null && t.species === sp)),
    );
    if (!pool.length) return null;
    const tpl = pickFrom(pool, `${seed}|signature|${kind}`);
    const out: ComposedSignatureCard = {
      kind,
      teach: SIGNATURE_TEACH,
      fact: render(tpl.fact[voice], bag, orbN),
      meaning: render(tpl.meaning[voice], bag, orbN),
      behaviour: render(tpl.behaviour[voice], bag, orbN),
      law: render(tpl.law[voice], bag, orbN),
      seal: render(SIGNATURE_SEAL[voice]),
    };
    if (hasLeak([out.teach, out.fact, out.meaning, out.behaviour, out.law, out.seal])) {
      console.warn(`[Little Souls] placeholder leak in signature template "${kind}", trying next storyline`);
      return null;
    }
    return out;
  };

  for (const item of chartSignature(bodies)) {
    if (signature) break;
    if (item.kind === "aspect") {
      const a = item.aspect;
      if (usedAspects.has(`${a.a}|${a.b}|${a.type}`)) continue;
      if (a.orb > 3) continue; /* only genuinely tight angles headline */
      const pa = bodies[a.a];
      const pb = bodies[a.b];
      if (!pa || !pb) continue;
      const labels = joinLabels([a.a, a.b]);
      if (a.type === "conjunction") {
        if (pa.sign !== pb.sign) continue; /* out-of-sign fusions read wrong in this template */
        signature = renderSignature("exactConjunction", {
          BODIES: labels,
          DEG: String(Math.round((pa.degree + pb.degree) / 2)),
          SIGN: pa.sign,
          ORB: orbPhrase(a.orb),
        }, a.orb);
      } else if (a.type === "opposition") {
        signature = renderSignature("exactOpposition", {
          BODIES: labels,
          SEP: String(Math.round(a.separation)),
          ORB: orbPhrase(a.orb),
        }, a.orb);
      } else if (a.type === "square") {
        signature = renderSignature("exactSquare", { BODIES: labels, ORB: orbPhrase(a.orb) }, a.orb);
      }
    } else if (item.kind === "dignity") {
      const d = item.dignity;
      if (usedDignities.has(`${item.body}|${d.primary}`)) continue;
      if (d.primary !== "domicile" && d.primary !== "exaltation") continue;
      const pos = bodies[item.body];
      if (!pos) continue;
      signature = renderSignature("strongDignity", {
        BODIES: BODY_LABEL[item.body],
        DEG: String(Math.round(pos.degree)),
        SIGN: pos.sign,
      });
    } else if (item.kind === "stellium") {
      const s = item.stellium;
      /* Only a genuinely tight gathering earns the "one bright knot" storyline;
         a wide same-sign scatter falls through to the next real signature. */
      if (!s.tight) continue;
      signature = renderSignature("tightCluster", {
        COUNT: String(s.bodies.length),
        SIGN: s.sign,
        SPAN: String(Math.max(1, Math.round(s.spanDegrees))),
        BODIES: joinLabels(s.bodies),
      });
    } else if (item.kind === "element") {
      if (item.scarce && item.counts[item.scarce] === 0) {
        const total = (["Fire", "Earth", "Air", "Water"] as const).reduce((sum, k) => sum + item.counts[k], 0);
        signature = renderSignature("missingElement", {
          COUNT: String(total),
          ELEMENT: item.scarce,
        });
      } else if (item.dominant) {
        signature = renderSignature("dominantElement", {
          COUNT: String(item.counts[item.dominant]),
          ELEMENT: item.dominant,
        });
      }
      /* a single-planet element has no approved template: skip */
    } else if (item.kind === "mode") {
      if (item.dominant) {
        signature = renderSignature("modeDominant", {
          COUNT: String(item.counts[item.dominant]),
          MODE: item.dominant.toLowerCase(),
        });
      } else if (item.scarce && item.counts[item.scarce] === 1) {
        const lone = PLANETS.find((p: PlanetName) => {
          const pos = bodies[p];
          return pos !== undefined && signMeta(pos.sign).mode === item.scarce;
        });
        if (!lone) continue;
        signature = renderSignature("modeSingleton", {
          BODIES: BODY_LABEL[lone],
          MODE: item.scarce.toLowerCase(),
        });
      }
    }
  }

  return { planets, element, signature };
}
