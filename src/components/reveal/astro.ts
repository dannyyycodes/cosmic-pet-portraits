// Shared astrological constants + polar math for the wheel and chapters.
import type { ChartPlacements } from './types';

export const SIGN_ORDER = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

export const SIGN_GLYPH: Record<string, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋', Leo: '♌', Virgo: '♍',
  Libra: '♎', Scorpio: '♏', Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
};

// ruler of each sign (traditional-ish, used to find the chart ruler)
export const SIGN_RULER: Record<string, string> = {
  Aries: 'mars', Taurus: 'venus', Gemini: 'mercury', Cancer: 'moon', Leo: 'sun', Virgo: 'mercury',
  Libra: 'venus', Scorpio: 'pluto', Sagittarius: 'jupiter', Capricorn: 'saturn', Aquarius: 'uranus', Pisces: 'neptune',
};

export interface PlanetMeta { key: string; name: string; glyph: string; }

// order matters for wheel stagger (outer/slow last feels nice, but we draw by longitude)
export const PLANETS: PlanetMeta[] = [
  { key: 'sun', name: 'Sun', glyph: '☉' },
  { key: 'moon', name: 'Moon', glyph: '☽' },
  { key: 'mercury', name: 'Mercury', glyph: '☿' },
  { key: 'venus', name: 'Venus', glyph: '♀' },
  { key: 'mars', name: 'Mars', glyph: '♂' },
  { key: 'jupiter', name: 'Jupiter', glyph: '♃' },
  { key: 'saturn', name: 'Saturn', glyph: '♄' },
  { key: 'uranus', name: 'Uranus', glyph: '♅' },
  { key: 'neptune', name: 'Neptune', glyph: '♆' },
  { key: 'pluto', name: 'Pluto', glyph: '♇' },
  { key: 'chiron', name: 'Chiron', glyph: '⚷' },
  { key: 'ascendant', name: 'Rising', glyph: 'Asc' },
  { key: 'northNode', name: 'North Node', glyph: '☊' },
  { key: 'lilith', name: 'Lilith', glyph: '⚸' },
];

export function longitude(sign: string, degree: number): number {
  const i = SIGN_ORDER.indexOf(sign);
  if (i < 0) return 0;
  return i * 30 + (degree || 0);
}

export function chartRulerKey(placements: ChartPlacements): string | null {
  const asc = placements?.ascendant;
  if (!asc?.sign) return null;
  return SIGN_RULER[asc.sign] ?? null;
}

/** Which points get the gold glow. */
export function litSet(placements: ChartPlacements): Set<string> {
  const s = new Set<string>(['sun', 'moon', 'ascendant']);
  const ruler = chartRulerKey(placements);
  if (ruler) s.add(ruler);
  return s;
}

export interface WheelPoint {
  key: string;
  name: string;
  glyph: string;
  sign: string;
  degree: number;
  lon: number;
  lit: boolean;
}

export function buildWheelPoints(placements: ChartPlacements): WheelPoint[] {
  if (!placements) return [];
  const lit = litSet(placements);
  const pts: WheelPoint[] = [];
  for (const p of PLANETS) {
    const pl = placements[p.key];
    if (!pl || !pl.sign) continue;
    pts.push({
      key: p.key,
      name: p.name,
      glyph: p.glyph,
      sign: pl.sign,
      degree: pl.degree ?? 0,
      lon: longitude(pl.sign, pl.degree ?? 0),
      lit: lit.has(p.key),
    });
  }
  return pts;
}

/** the Big Three, for the invocation birthline. */
export function bigThree(placements: ChartPlacements) {
  const sun = placements?.sun;
  const moon = placements?.moon;
  const asc = placements?.ascendant;
  return {
    sun: sun?.sign ?? null,
    moon: moon?.sign ?? null,
    rising: asc?.sign ?? null,
  };
}
