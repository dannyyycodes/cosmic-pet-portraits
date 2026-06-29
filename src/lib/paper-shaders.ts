/**
 * Tree-shake boundary for Paper Shaders.
 *
 * Dynamic-importing the package barrel directly (and reading members off the
 * resolved namespace) defeats Rollup tree-shaking — it pulls all ~30 shaders
 * into the lazy chunk. Both @paper-design packages are `sideEffects: false`, so
 * a STATIC named re-export here lets Rollup keep only these three components and
 * their shared core. /start lazy-imports THIS module, so the chunk stays small
 * and still code-splits out of the first-paint bundle.
 *
 * Licence: PolyForm Shield 1.0.0 — see /public/THIRD-PARTY-LICENSES.txt.
 */
export { MeshGradient, PulsingBorder, Warp } from "@paper-design/shaders-react";
