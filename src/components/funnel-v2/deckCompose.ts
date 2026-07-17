/* deckCompose.ts
   The bridge between the real astrology engine (astroEngine.ts) and the
   quality-gated copy pools (deckPools/). Given the raw chart payload it
   picks, for each free planet card, the single most striking computed fact
   (tightest aspect first, then strongest dignity, then own face), renders
   the matching pool beat with the real numbers injected, attaches the
   verbatim teaching sentence, and keys a seal to a genuinely sealed body.
   It also selects the chart-signature storyline for the revelation card.

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
  type ChartBodies,
  type PlanetName,
} from "./astroEngine";
import {
  ASPECT_POOL,
  SEALS,
  SIGNATURES,
  TEACHING,
  aspectKey,
  dignityKey,
} from "./deckPools";
import type { Beat, Family, SealedBody, SignatureKind, SignatureTemplate, TeachingKey } from "./deckPools/types";
import { DECK_PLANETS, fill, type DeckPlanet, type Subject } from "./freeDeck";

export type ComposedPlanetCard = {
  fact: string;      /* the computed fact, numbers injected (pool "meaning") */
  teaching: string;  /* the verbatim teaching sentence for the mechanism */
  behaviour: string; /* the species-true behaviour + tonight-test beat */
  law: string;       /* the quotable law line */
  seal: string;      /* the sealed-depth footer, keyed to sealBody */
  sealBody: SealedBody;
};

export type ComposedSignatureCard = {
  kind: SignatureKind;
  fact: string;
  meaning: string;
  behaviour: string;
  law: string;
};

export type ComposedDeck = {
  planets: Partial<Record<DeckPlanet, ComposedPlanetCard>>;
  signature: ComposedSignatureCard | null;
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

/* The law line is the card's quotable close: it must read as plain speech.
   Among a key's beats, prefer ones whose law carries no raw number
   placeholder ("86 degrees out of Venus's reach" is machine talk); numbers
   belong in the fact block. Falls back to the full pool when every law in
   the key uses one. */
function pickBeat<T extends { law: { d: string; m: string } }>(arr: readonly T[], seed: string): T {
  const plain = arr.filter((b) => !/\{(SEP|DEG|PDEG|ORB)\}/.test(b.law.d + " " + b.law.m));
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

/* ── Placeholder injection ──────────────────────────────────────────────── */

type NumberBag = Partial<Record<
  "DEG" | "SIGN" | "PDEG" | "PSIGN" | "PARTNER" | "ORB" | "SEP" | "BODIES" | "COUNT" | "SPAN" | "ELEMENT" | "MODE",
  string
>>;

function inject(text: string, bag: NumberBag): string {
  return text.replace(
    /\{(DEG|SIGN|PDEG|PSIGN|PARTNER|ORB|SEP|BODIES|COUNT|SPAN|ELEMENT|MODE)\}/g,
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

/* ── The composer ───────────────────────────────────────────────────────── */

export function composeDeck(args: {
  raw: Parameters<typeof normalizeBodies>[0];
  voice: "d" | "m";
  species?: string | null;
  subject: Subject;
  seed: string; /* pet name + date */
}): ComposedDeck {
  const { raw, voice, species, subject, seed } = args;
  const empty: ComposedDeck = { planets: {}, signature: null };

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

  const render = (text: string, bag: NumberBag, orbN: number | null = null): string =>
    fixDegreeGrammar(sentenceCase(fill(inject(prepOrbContexts(text, orbN), bag), subject)));

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
    const pool = SEALS.filter((s) => s.body === body);
    if (!pool.length) return null;
    const beat = pickFrom(pool, `${seed}|seal|${planet}|${body}`);
    const seal = render(beat.text[voice], {});
    if (hasLeak([seal])) return null;
    return { seal, sealBody: body };
  };

  /* ── Planet cards ── */
  const planets: Partial<Record<DeckPlanet, ComposedPlanetCard>> = {};

  for (const planet of DECK_PLANETS) {
    const pos = bodies[planet];
    if (!pos) continue; /* missing body: the card stays on legacy copy */

    type Candidate = {
      beat: Beat;
      bag: NumberBag;
      teaching: string;
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
        beat: pickBeat(pool, `${seed}|${planet}|${partner}|${asp.type}`),
        bag: {
          DEG: String(Math.round(pos.degree)),
          SIGN: pos.sign,
          PDEG: String(Math.round(ppos.degree)),
          PSIGN: ppos.sign,
          PARTNER: bodyPhrase(partner),
          ORB: orbPhrase(asp.orb),
          SEP: String(Math.round(asp.separation)),
        },
        teaching: TEACHING[asp.type],
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
          beat: pickBeat(pool, `${seed}|${planet}|${dig.primary}`),
          bag: { DEG: String(Math.round(pos.degree)), SIGN: pos.sign },
          teaching: TEACHING[dig.primary as TeachingKey],
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
          beat: pickBeat(pool, `${seed}|${planet}|face`),
          bag: { DEG: String(Math.round(pos.degree)), SIGN: pos.sign },
          teaching: TEACHING.face,
          orb: null,
          markUsed: () => usedDignities.add(`${planet}|face`),
          factPartner: null,
        });
      }
    }

    for (const cand of candidates) {
      const fact = render(cand.beat.meaning[voice], cand.bag, cand.orb);
      const behaviour = render(cand.beat.behaviour[voice], cand.bag, cand.orb);
      const law = render(cand.beat.law[voice], cand.bag, cand.orb);
      if (hasLeak([fact, behaviour, law])) {
        console.warn(`[Little Souls] placeholder leak in ${planet} pool beat "${cand.beat.key}", trying next fact`);
        continue;
      }
      const sealed = composeSeal(planet, cand.factPartner);
      if (!sealed) continue;
      cand.markUsed();
      usedSeals.add(sealed.sealBody);
      planets[planet] = {
        fact,
        teaching: cand.teaching,
        behaviour,
        law,
        seal: sealed.seal,
        sealBody: sealed.sealBody,
      };
      break;
    }
  }

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
      fact: render(tpl.fact[voice], bag, orbN),
      meaning: render(tpl.meaning[voice], bag, orbN),
      behaviour: render(tpl.behaviour[voice], bag, orbN),
      law: render(tpl.law[voice], bag, orbN),
    };
    if (hasLeak([out.fact, out.meaning, out.behaviour, out.law])) {
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

  return { planets, signature };
}
