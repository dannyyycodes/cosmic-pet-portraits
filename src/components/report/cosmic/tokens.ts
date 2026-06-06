// Cosmic design tokens for the Soul Reading redesign.
// Single source of truth for palette, type scale, and per-planet identity.
// Matches littlesouls.app homepage + soul-chat cosmic theme.

export const COSMIC = {
  bg: '#0a0810',
  bgDeep: '#06050c',
  surface: 'rgba(22,16,42,0.72)',     // dark glass (use with backdrop blur)
  surfaceSolid: '#161029',
  raised: 'linear-gradient(135deg,#1a1330,#221a44)',
  border: 'rgba(154,126,230,0.18)',
  borderSolid: '#2a1f47',
  divider: 'rgba(154,126,230,0.10)',
  text: '#f3ecff',        // primary
  text2: '#d8c5f5',       // secondary
  muted: '#9a86c8',       // muted labels
  bodyColor: '#ece5ff',   // brighter primary body text
  mutedColor: '#b9a8e0',  // lighter muted labels
  gold: '#e6c179',
  goldBright: '#ffd86b',
  goldDeep: '#d9b46a',
  violet: '#9a7ee6',
  violetDeep: '#5a3fa6',
  rose: '#e98aa0',
  mint: '#6fe3b8',
} as const;

// Type scale (px). Headings/labels use accent colours; body never low-contrast.
export const TYPE = {
  chapter: 'clamp(2.4rem, 6vw, 3.4rem)',  // 40-56
  pull: 'clamp(2rem, 5vw, 2.6rem)',       // 32-44
  cardTitle: 'clamp(1.25rem, 2.4vw, 1.5rem)',
  body: 'clamp(1.06rem,1.6vw,1.2rem)', // 17-19
  bodyLh: 1.64,
  label: '0.74rem',
  labelTrack: '0.18em',
} as const;

export type PlanetMotion =
  | 'radiantPulse' | 'silverTide' | 'quickShimmer' | 'softBloom'
  | 'sharpEdge' | 'broadRing' | 'structuredRings' | 'electricOffset'
  | 'blurToFocus' | 'darkBloom' | 'splitRing' | 'shadowReveal' | 'earthDrift';

export interface PlanetPreset {
  /** Real planet name shown to the reader. */
  planet: string;
  /** NASA image in /public/planets/. */
  image: string;
  /** Whether the source image is a disc to crop to a circle (jpg with black bg). */
  imageScale?: number;
  /** Accent colour for this planet's section. */
  accent: string;
  /** Glow colour (rim light / halo). */
  glow: string;
  /** Signature motion preset. */
  motion: PlanetMotion;
  /** Static (no rotation) — for horizons/comets. */
  staticImage?: boolean;
  /** Key into report.chartPlacements for the sign/degree badge (if any). */
  placementKey?: string;
}

// Keyed by reading-section key (see CosmicReportViewer.readingSections).
// Each planet feels distinct: own accent, glow and motion signature.
export const PLANET_PRESETS: Record<string, PlanetPreset> = {
  solarSoulprint:    { planet: 'Sun',        image: '/planets/sun_sdo.jpg', imageScale: 1.04, accent: '#f6a02a', glow: '#fbd07c', motion: 'radiantPulse', placementKey: 'sun' },
  lunarHeart:        { planet: 'Moon',       image: '/planets/moon.jpg',    imageScale: 1.22, accent: '#c7c2da', glow: '#e7e3f0', motion: 'silverTide', placementKey: 'moon' },
  cosmicCuriosity:   { planet: 'Mercury',    image: '/planets/mercury.png', accent: '#c9a98a', glow: '#e0c4a8', motion: 'quickShimmer', placementKey: 'mercury' },
  harmonyHeartbeats: { planet: 'Venus',      image: '/planets/venus.png',   accent: '#e9a36a', glow: '#f5c8a4', motion: 'softBloom', placementKey: 'venus' },
  spiritOfMotion:    { planet: 'Mars',       image: '/planets/mars.png',    accent: '#d6603e', glow: '#ed9379', motion: 'sharpEdge', placementKey: 'mars' },
  starlitGaze:       { planet: 'Ascendant',  image: '/readings/planets/star-chart.jpg', imageScale: 1.12, staticImage: true, accent: '#9fbce6', glow: '#cfe0f6', motion: 'blurToFocus', placementKey: 'ascendant' },
  destinyCompass:    { planet: 'North Node', image: '/planets/earth.png',   accent: '#79c79f', glow: '#a5d09f', motion: 'earthDrift', placementKey: 'northNode' },
  gentleHealer:      { planet: 'Chiron',     image: '/readings/planets-nasa/chiron.png', staticImage: true, accent: '#8fc4d6', glow: '#cfe7f0', motion: 'splitRing', placementKey: 'chiron' },
  wildSpirit:        { planet: 'Lilith',     image: '/planets/neptune.png', accent: '#7a6bd0', glow: '#b3a4e8', motion: 'blurToFocus', placementKey: 'lilith' },
  cosmicExpansion:   { planet: 'Jupiter',    image: '/planets/jupiter.png', accent: '#d6a24a', glow: '#f4d378', motion: 'broadRing' },
  cosmicLessons:     { planet: 'Saturn',     image: '/readings/planets-nasa/saturn.png', accent: '#d4b67a', glow: '#e6cfa0', motion: 'structuredRings' },
  earthlyExpression: { planet: 'Earth',      image: '/planets/earth.png',   accent: '#5a98c4', glow: '#7ab2c4', motion: 'earthDrift' },
  celestialChoreography: { planet: 'Aspects', image: '', accent: '#b59be8', glow: '#cabaf0', motion: 'darkBloom' },
};
