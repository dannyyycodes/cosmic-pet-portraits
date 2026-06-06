// Aura colours may arrive as raw hex (#4169E1). Never show hex to the reader —
// derive a poetic colour name from hue / saturation / lightness instead.
export function auraColorName(v?: string): string {
  if (!v) return '';
  const s = v.trim();
  if (!s.startsWith('#')) return s; // already a name
  const h = s.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  if (n.length < 6) return '';
  const r = parseInt(n.slice(0, 2), 16) / 255, g = parseInt(n.slice(2, 4), 16) / 255, b = parseInt(n.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const l = (max + min) / 2;
  const sat = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let hue = 0;
  if (d !== 0) {
    if (max === r) hue = ((g - b) / d) % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue = (hue * 60 + 360) % 360;
  }
  if (sat < 0.12) return l > 0.7 ? 'Pearl' : l < 0.3 ? 'Obsidian' : 'Silver';
  const base =
    hue < 15 || hue >= 345 ? 'Crimson' :
    hue < 40 ? 'Copper' :
    hue < 65 ? 'Gold' :
    hue < 150 ? 'Emerald' :
    hue < 200 ? 'Aquamarine' :
    hue < 240 ? 'Sapphire' :
    hue < 268 ? 'Indigo' :
    hue < 300 ? 'Amethyst' :
    hue < 330 ? 'Magenta' : 'Rose';
  const prefix = l > 0.72 ? 'Pale ' : l < 0.32 ? 'Deep ' : '';
  return prefix + base;
}
