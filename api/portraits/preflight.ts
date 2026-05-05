/**
 * Print-pipeline pre-flight image checks.
 *
 * Pure functions, no I/O. Run on the *upscaled* PNG buffer right before we
 * submit to Gelato. If any gate fails, the orchestrator re-runs the upscaler
 * once; on second failure, the order is queued to manual review and NEVER
 * auto-submitted.
 *
 * Spec: research-2026-05-05-gelato-print-quality.md §4 + §6.
 *   - Long edge >= 4000px (Gelato 150 DPI floor at every SKU we ship)
 *   - Laplacian variance > 100 (sharpness — PyImageSearch convention)
 *   - <5% pixels clipped at 0 or 255 in luminance (no blown highlights/blacks)
 *   - LAB B-channel std-dev > 20 (catches solid-colour FLUX failure outputs)
 *
 * Implementation notes:
 *   - sharp's `convolve` is used for the 3x3 Laplacian. Output is read raw,
 *     interpreted as signed int16 magnitudes, variance computed in pure JS.
 *   - sharp does NOT expose CIELAB conversion directly; we do the sRGB → linear
 *     → XYZ → LAB conversion in pure JS over the RGB raw buffer. Cheap (single
 *     pass), and avoids a new dependency.
 */

import sharp from "sharp";

// ─── Types ──────────────────────────────────────────────────────────────────

export type PreflightFailReason =
  | "too_small"          // long edge < 4000px
  | "too_blurry"         // Laplacian variance <= 100
  | "histogram_clipped"  // > 5% pixels at 0 or 255 in luminance
  | "low_color_variance"; // LAB B-channel std-dev <= 20

export type PreflightMetrics = {
  width: number;
  height: number;
  longEdge: number;
  laplacianVariance: number;
  clippedPixelRatio: number;
  labBStdDev: number;
};

export type PreflightResult =
  | { ok: true; metrics: PreflightMetrics }
  | { ok: false; reason: PreflightFailReason; metrics: PreflightMetrics };

// ─── Tunables (research §4) ─────────────────────────────────────────────────
//
// ⚠ CALIBRATION NOTE 2026-05-05: research §4.2 cites a Laplacian variance
// threshold of 100 ("AuraSR-upscaled outputs typically score 150-300"). On
// real fal Kontext → AuraSR 4× outputs (verified end-to-end with the dry-run
// test), shipping-grade visually-sharp images measure ~15-25 — not 150-300.
// The implementation here matches the OpenCV reference (signed Laplacian,
// population variance over the grayscale buffer), so the gap is a calibration
// issue with the research note, not an implementation bug. We keep the spec'd
// threshold of 100 as a placeholder and intentionally fail safe — better to
// route to manual_review than auto-ship — until we collect 50+ real production
// samples and tune empirically. See test-print-pipeline.ts for reproducible
// measurements.

export const MIN_LONG_EDGE_PX = 4000;
export const MIN_LAPLACIAN_VARIANCE = 100;
export const MAX_CLIPPED_RATIO = 0.05;
export const MIN_LAB_B_STDDEV = 20;

// Subsampling: LAB conversion + clip count over a 4096×4096 buffer = 16M pixels;
// dominated by Math overhead, not memory. Subsample to ~1M pixels (every 4th
// pixel on each axis) for ~4× speedup with no statistical penalty for these
// metrics.
const LAB_SUBSAMPLE_STRIDE = 4;

// ─── Public entrypoint ──────────────────────────────────────────────────────

export async function preflightImage(buffer: Buffer): Promise<PreflightResult> {
  // Test-only escape hatch (set by scripts/test-print-pipeline.ts --bypass-preflight).
  // Never set in production. Lets us exercise the success-path of the
  // orchestrator + inspect the Gelato request body even when the source image
  // doesn't clear the (currently uncalibrated) gates.
  const bypass = process.env.PREFLIGHT_BYPASS === "1";
  // Decode once. Use auto-orient + flatten alpha onto neutral grey so the
  // metrics aren't biased by transparent margins (FLUX outputs are opaque
  // anyway, but defensive).
  const base = sharp(buffer, { failOn: "none" })
    .rotate()
    .flatten({ background: { r: 128, g: 128, b: 128 } });

  const meta = await base.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  const longEdge = Math.max(width, height);

  // Run the three pixel-level passes in parallel.
  const [lapVar, clippedRatio, bStd] = await Promise.all([
    laplacianVariance(base.clone()),
    clippedLuminanceRatio(base.clone()),
    labBStdDev(base.clone()),
  ]);

  const metrics: PreflightMetrics = {
    width,
    height,
    longEdge,
    laplacianVariance: round2(lapVar),
    clippedPixelRatio: round4(clippedRatio),
    labBStdDev: round2(bStd),
  };

  // Gates run in priority order — return the first failure so the orchestrator
  // gets the most actionable reason.
  if (!bypass && longEdge < MIN_LONG_EDGE_PX) {
    return { ok: false, reason: "too_small", metrics };
  }
  if (!bypass && lapVar <= MIN_LAPLACIAN_VARIANCE) {
    return { ok: false, reason: "too_blurry", metrics };
  }
  if (!bypass && clippedRatio > MAX_CLIPPED_RATIO) {
    return { ok: false, reason: "histogram_clipped", metrics };
  }
  if (!bypass && bStd <= MIN_LAB_B_STDDEV) {
    return { ok: false, reason: "low_color_variance", metrics };
  }

  return { ok: true, metrics };
}

// ─── Laplacian variance ─────────────────────────────────────────────────────
// 3×3 discrete Laplacian kernel:  [[0, 1, 0], [1, -4, 1], [0, 1, 0]]
// Higher variance => more high-frequency content => sharper image.
// (PyImageSearch: 100 is the standard threshold for "sharp" on natural photos.)
//
// We compute the convolution in pure JS over the raw grayscale buffer instead
// of using sharp.convolve — sharp clamps the convolve output to uint8 (0..255)
// which destroys the negative side of the kernel response, depressing variance
// to ~10× lower than the calibrated 100 threshold. Doing it in JS gives true
// signed responses and aligns with the OpenCV reference implementation.
//
// Subsampled by stride for speed (4096² = 16M px would be slow in pure JS;
// every-2nd-pixel sampling keeps statistics stable).

const LAPLACIAN_STRIDE = 2;

async function laplacianVariance(pipeline: sharp.Sharp): Promise<number> {
  const { data, info } = await pipeline
    .grayscale()
    .toColorspace("b-w")
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  if (width < 3 || height < 3) return 0;

  // For grayscale b-w colorspace channels === 1 (single byte per pixel).
  let sum = 0;
  let sumSq = 0;
  let n = 0;
  const stride = LAPLACIAN_STRIDE;
  // Skip 1px border so the 3x3 stencil never reads out of bounds.
  for (let y = 1; y < height - 1; y += stride) {
    const yRow = y * width;
    const yUp = (y - 1) * width;
    const yDn = (y + 1) * width;
    for (let x = 1; x < width - 1; x += stride) {
      // [[0, 1, 0], [1, -4, 1], [0, 1, 0]] convolved on grayscale
      const lap =
        data[(yUp + x) * channels] +
        data[(yRow + x - 1) * channels] +
        data[(yRow + x + 1) * channels] +
        data[(yDn + x) * channels] -
        4 * data[(yRow + x) * channels];
      sum += lap;
      sumSq += lap * lap;
      n++;
    }
  }
  if (n === 0) return 0;
  const mean = sum / n;
  const variance = sumSq / n - mean * mean;
  return variance;
}

// ─── Clipped-luminance ratio ────────────────────────────────────────────────
// Rec.709 luma. Counts pixels at exact 0 or exact 255. >5% is trouble.

async function clippedLuminanceRatio(pipeline: sharp.Sharp): Promise<number> {
  const { data, info } = await pipeline
    .grayscale()
    .toColorspace("b-w")
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  let clipped = 0;
  let total = 0;
  for (let i = 0; i < data.length; i += channels) {
    const v = data[i];
    if (v === 0 || v === 255) clipped++;
    total++;
  }
  if (total === 0) return 0;
  return clipped / total;
}

// ─── LAB B-channel std-dev ──────────────────────────────────────────────────
// LAB B = blue↔yellow axis. A solid-coloured FLUX failure output has near-zero
// std on this axis. We do the sRGB → linear → XYZ (D65) → LAB conversion in JS
// over the raw RGB buffer. Subsampled stride for speed.

async function labBStdDev(pipeline: sharp.Sharp): Promise<number> {
  const { data, info } = await pipeline
    .removeAlpha()
    .toColorspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  if (channels < 3) return 0;

  let sum = 0;
  let sumSq = 0;
  let n = 0;
  const stride = LAB_SUBSAMPLE_STRIDE;
  for (let y = 0; y < height; y += stride) {
    for (let x = 0; x < width; x += stride) {
      const i = (y * width + x) * channels;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const labB = rgbToLabB(r, g, b);
      sum += labB;
      sumSq += labB * labB;
      n++;
    }
  }
  if (n === 0) return 0;
  const mean = sum / n;
  const variance = Math.max(0, sumSq / n - mean * mean);
  return Math.sqrt(variance);
}

// ─── sRGB → LAB (B-channel only, since that's all we score on) ──────────────

function srgbCompandedToLinear(c: number): number {
  // c is in [0, 1]
  if (c <= 0.04045) return c / 12.92;
  return Math.pow((c + 0.055) / 1.055, 2.4);
}

// D65 reference white (CIE 1931 2°)
const REF_Y = 1.0;
const REF_Z = 1.08883;

function fLab(t: number): number {
  // Standard LAB nonlinearity
  const epsilon = 216 / 24389; // 0.008856
  const kappa = 24389 / 27;    // 903.3
  if (t > epsilon) return Math.cbrt(t);
  return (kappa * t + 16) / 116;
}

function rgbToLabB(r8: number, g8: number, b8: number): number {
  const r = srgbCompandedToLinear(r8 / 255);
  const g = srgbCompandedToLinear(g8 / 255);
  const b = srgbCompandedToLinear(b8 / 255);
  // sRGB D65 → XYZ (we only need Y and Z to compute LAB B).
  const Y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b;
  const Z = 0.0193339 * r + 0.1191920 * g + 0.9503041 * b;
  const fy = fLab(Y / REF_Y);
  const fz = fLab(Z / REF_Z);
  // LAB B = 200 * (fy - fz)
  return 200 * (fy - fz);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
