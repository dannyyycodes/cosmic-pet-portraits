// AUTO-ASSEMBLED from approved copy-pool batches (free-reading deck pools).
// Do not hand-edit strings here without re-running the copy quality gate.
// Placeholders injected live by the composer: {DEG} {SIGN} {PDEG} {PSIGN} {PARTNER} {ORB} {SEP}
// Name tokens (from freeDeck): {self} {name} {Name} {poss} {Poss}
import type { Voiced } from "../freeDeck";

export type Family = "fused" | "hard" | "soft";
export type Species = "dog" | "cat" | "any";

/* Data placeholders, injected live by the composer as ALREADY-FORMATTED strings:
   {DEG} subject within-sign degree ("23"), {SIGN} subject sign ("Gemini"),
   {PDEG} partner degree, {PSIGN} partner sign, {PARTNER} partner label ("Jupiter"),
   {ORB} formatted orb phrase ("five degrees from exact" / "exact to the degree"),
   {SEP} separation in degrees ("174").
   Name tokens exactly as freeDeck: {self} {name} {Name} {poss} {Poss}. */
export type Beat = {
  /** aspect: "<planet>|<partnerBody>|<family>" e.g. "moon|venus|hard" (partnerBody uses BodyName ids: sun..pluto, chiron, northNode, lilith)
   *  dignity: "<planet>|<status>" e.g. "mars|fall", "sun|face" */
  key: string;
  /** "any" only when the behaviour is genuinely concrete for both dog and cat */
  species: Species;
  /** why THIS pairing matters in the pet, 1 to 3 sentences, evidence-chained to the placeholders */
  meaning: Voiced;
  /** d: one observable behaviour + a check the owner can run within 24h; m: remembered past-tense behaviour, zero instructions */
  behaviour: Voiced;
  /** one quotable line the owner can repeat; d present tense; m past behaviour hung on the present-tense chart */
  law: Voiced;
};

export type SealedBody =
  | "saturn"
  | "chiron"
  | "jupiter"
  | "pluto"
  | "northNode"
  | "uranus"
  | "neptune"
  | "lilith";

/* The locked-door beats moved to per-planet device pools: see seals.ts
   (PlanetSealBeat). SealedBody remains the type of the body a linked
   device names and the tease ledger runs on. */

export type TeachingKey =
  | "conjunction"
  | "sextile"
  | "square"
  | "trine"
  | "opposition"
  | "domicile"
  | "exaltation"
  | "detriment"
  | "fall"
  | "face";

export type SignatureKind =
  | "tightCluster"
  | "exactConjunction"
  | "exactOpposition"
  | "exactSquare"
  | "strongDignity"
  | "missingElement"
  | "dominantElement"
  | "modeSingleton"
  | "modeDominant";

export type SignatureTemplate = {
  kind: SignatureKind;
  species: Species;
  /** the numbers-led opening; extra placeholders allowed: {BODIES} (joined labels), {COUNT}, {SPAN}, {ELEMENT}, {MODE} */
  fact: Voiced;
  meaning: Voiced;
  behaviour: Voiced;
  law: Voiced;
};

/** Build the pool key for a (free planet x partner body x aspect family) beat. */
export function aspectKey(planet: string, partner: string, family: Family): string {
  return planet + "|" + partner + "|" + family;
}

/** Build the pool key for a (free planet x dignity status) beat. status: domicile | exaltation | detriment | fall | face */
export function dignityKey(planet: string, status: string): string {
  return planet + "|" + status;
}
