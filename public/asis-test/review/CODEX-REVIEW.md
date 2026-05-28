# Codex independent review — pawtraits print pipeline (2026-05-28)

Run on the Hetzner VPS via Codex (gpt-5.5, high reasoning) with vision QC on the 6 fit boards.

## Verdict
**No — not ship-ready for "100% size-perfect, no unexpected crop/border."** Fix the blockers below.

## Blockers
1. **3:4 and 5:7 master dims are wrong (not exact ratio).** `3:4 = 2048×2720` (+0.392%), `5:7 = 2048×2864` (+0.112%). Affects BOTH AI and as-is (shared `ASPECTS` table, portraits.ts:3008). Gelato gets only the file, no crop metadata — exact aspect is our responsibility → tiny crop or border.
   Recommended exact, multiple-of-16 dims: `4:5 2048×2560`, `3:4 2016×2688`, `5:7 2000×2800`, `2:3 2048×3072`, `1:1 2048×2048`.
2. **As-is preview ≠ final crop.** UI approves the uncropped original, only crops at cart-add → customer never sees the real crop. Must show the per-size crop before add (or manual crop control).
3. **"No AI" is false for as-is** — fulfilment runs AuraSR 4× (AI) on every canvas incl. as-is. Reword to "no AI restyling", or bypass AuraSR for as-is.
4. **Lossy roundtrip** — as-is downsizes to 2048 then AuraSR re-upscales to 8192. Crop at native source res instead.
5. **EXIF orientation bug** — `printMaster_asis` reads `metadata()` BEFORE `.rotate()`, so portrait phone photos with EXIF rotation get gated on swapped dims → wrong PPI/sizes. Normalise orientation before measuring.

## Should-fix
- Hard aspect assertion before Gelato submit (reject if final dims off-ratio beyond epsilon).
- SKU-specific min pixels: `max(4000, 150 × longEdgeIn)`, not flat 4000.
- Recalibrate preflight for photos — `LAB-B stddev > 20` can false-fail B&W pets / snow / white walls → as-is orders stuck in manual_review.
- Frontend `SAFE_LONG_EDGE_IN=36` vs backend blocks `>16` unless `LARGE_FORMAT_ENABLED` env — verify prod or customers pick sizes backend rejects.

## PPI floor
Current 75 hide / 100 clean is too soft for a truthful no-AI product. Recommended: hide `<100`, warn `100–149`, sharp `≥150`; premium/large prefer `180–200+`.

## Vision QC (per board)
- dannydog 720×1280: kept in tall crops; square too tight on face/chest; too low-res beyond small sizes.
- unsplash_dog 3000×4000: strong across all shapes; square close but acceptable.
- unsplash_cat 3000×2064: good across all; ears/face/paws survive.
- lowres_dog 601×480: **fails** tall crops (head cut in 4:5/3:4/5:7/2:3); square best; too low-res for print.
- hires_square 3000×3000: tall crops cut side content — proves auto-crop needs preview/manual control.
- mid_dog 810×1080: composition mostly kept; soft on large canvas.
