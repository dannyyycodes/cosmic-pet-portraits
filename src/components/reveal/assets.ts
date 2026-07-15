// Durable CDN home for the reveal's cosmic imagery (heroes, element motifs,
// constellation dividers). Hosted on content.littlesouls.app so it survives
// any front-end redeploy. Optimised .jpg is the web default; .png masters exist
// alongside for anything that needs the full file.

export const REVEAL_ASSETS = 'https://content.littlesouls.app/viral-pet-media/reveal-assets/';

/** Chapter id -> hero image base name. Each chapter opens on its own sky. */
export const CHAPTER_HERO: Record<string, string> = {
  invocation: 'ch1-invocation',
  essence: 'ch2-essence',
  'inner-world': 'ch3-inner-world',
  'social-soul': 'ch4-social-soul',
  'hidden-depths': 'ch5-hidden-depths',
  crossroads: 'ch6-crossroads',
  legacy: 'ch7-legacy',
};

export function heroWide(base: string) {
  return `${REVEAL_ASSETS}${base}-wide.jpg`;
}
export function heroMobile(base: string) {
  return `${REVEAL_ASSETS}${base}-mobile.jpg`;
}

export type ElementKey = 'fire' | 'earth' | 'air' | 'water';
export function motifSrc(el: ElementKey) {
  return `${REVEAL_ASSETS}element-${el}.jpg`;
}

export type DividerKey = 'strand' | 'constellation' | 'crescent' | 'starburst';
const DIVIDERS: DividerKey[] = ['strand', 'constellation', 'crescent', 'starburst'];
export function dividerSrc(i: number) {
  return `${REVEAL_ASSETS}divider-${DIVIDERS[i % DIVIDERS.length]}.png`;
}
