// AUTO-ASSEMBLED from approved copy-pool batches (free-reading deck pools).
// Do not hand-edit strings here without re-running the copy quality gate.
// Placeholders injected live by the composer: {DEG} {SIGN} {PDEG} {PSIGN} {PARTNER} {ORB} {SEP}
// Name tokens (from freeDeck): {self} {name} {Name} {poss} {Poss}

import type { Beat } from "./types";
import { SUN_FUSED } from "./sunFused";
import { SUN_HARD } from "./sunHard";
import { SUN_SOFT } from "./sunSoft";
import { MOON_FUSED } from "./moonFused";
import { MOON_HARD } from "./moonHard";
import { MOON_SOFT } from "./moonSoft";
import { MERCURY_FUSED } from "./mercuryFused";
import { MERCURY_HARD } from "./mercuryHard";
import { MERCURY_SOFT } from "./mercurySoft";
import { VENUS_FUSED } from "./venusFused";
import { VENUS_HARD } from "./venusHard";
import { VENUS_SOFT } from "./venusSoft";
import { MARS_FUSED } from "./marsFused";
import { MARS_HARD } from "./marsHard";
import { MARS_SOFT } from "./marsSoft";
import { DIGNITY_BEATS } from "./dignity";

/** Every composed beat: the 15 aspect pools plus the dignity pool. */
const ALL_BEATS: Beat[] = [
  ...SUN_FUSED,
  ...SUN_HARD,
  ...SUN_SOFT,
  ...MOON_FUSED,
  ...MOON_HARD,
  ...MOON_SOFT,
  ...MERCURY_FUSED,
  ...MERCURY_HARD,
  ...MERCURY_SOFT,
  ...VENUS_FUSED,
  ...VENUS_HARD,
  ...VENUS_SOFT,
  ...MARS_FUSED,
  ...MARS_HARD,
  ...MARS_SOFT,
  ...DIGNITY_BEATS,
];

/**
 * One lookup for the composer. Keys:
 *   aspect beats  -> "<planet>|<partnerBody>|<family>"  (see aspectKey)
 *   dignity beats -> "<planet>|<status>"                (see dignityKey)
 */
export const ASPECT_POOL: Record<string, Beat[]> = {};
for (const beat of ALL_BEATS) {
  const bucket = ASPECT_POOL[beat.key];
  if (bucket) {
    bucket.push(beat);
  } else {
    ASPECT_POOL[beat.key] = [beat];
  }
}

export { SUN_FUSED } from "./sunFused";
export { SUN_HARD } from "./sunHard";
export { SUN_SOFT } from "./sunSoft";
export { MOON_FUSED } from "./moonFused";
export { MOON_HARD } from "./moonHard";
export { MOON_SOFT } from "./moonSoft";
export { MERCURY_FUSED } from "./mercuryFused";
export { MERCURY_HARD } from "./mercuryHard";
export { MERCURY_SOFT } from "./mercurySoft";
export { VENUS_FUSED } from "./venusFused";
export { VENUS_HARD } from "./venusHard";
export { VENUS_SOFT } from "./venusSoft";
export { MARS_FUSED } from "./marsFused";
export { MARS_HARD } from "./marsHard";
export { MARS_SOFT } from "./marsSoft";
export { DIGNITY_BEATS } from "./dignity";
export { TEACHING } from "./teaching";
export { PLANET_SEALS } from "./seals";
export type { PlanetSealBeat } from "./seals";
export { SIGNATURES } from "./signatures";
export { LOVE_POOL, loveKey } from "./love";
export type { LoveEntry } from "./love";
export { aspectKey, dignityKey } from "./types";
export type {
  Family,
  Species,
  Beat,
  SealedBody,
  TeachingKey,
  SignatureKind,
  SignatureTemplate,
} from "./types";
