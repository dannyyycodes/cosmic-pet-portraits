# Pet Birth Chart API — for the landing page wiring (Codex)

Free, public, $0. Pure astronomy (VSOP87 + ELP2000 + Chiron table) — **NO AI**. Same engine as the paid soul reading. Deterministic: same input → same output.

## Endpoint
`GET https://aduibsyrnenzobuyetmn.supabase.co/functions/v1/pet-birth-chart`

- No auth needed (`verify_jwt = false`). CORS allows `littlesouls.app` + `www.littlesouls.app`.
- Also accepts `POST` with a JSON body of the same params.

## Params
- `date` (required) — `YYYY-MM-DD` (birth date, or adoption "gotcha" date).
- `time` (optional) — `HH:MM` (24h). Improves Moon precision; **required (with lat/lon) for Rising**.
- `lat`, `lon` (optional) — decimal degrees. **Both + `time` required to return the Rising/Ascendant.**

## Response (200)
```json
{
  "input": { "date": "2020-08-15", "time": null, "hasLocation": false },
  "sun":   { "sign": "Leo", "degree": 22, "element": "Fire", "modality": "Fixed", "ruler": "Sun" },
  "moon":  { "sign": "Cancer", "degree": 12.4 },
  "ascendant": null,
  "mercury": {...}, "venus": {...}, "mars": {...},
  "jupiter": {...}, "saturn": {...}, "uranus": {...}, "neptune": {...}, "pluto": {...},
  "chiron": {...}, "northNode": {...}, "lilith": {...},
  "elementBalance": { "Fire": 4, "Earth": 2, "Air": 1, "Water": 3 },
  "dominantElement": "Fire",
  "ascendantAvailable": false,
  "ascendantNote": "Rising sign needs an exact birth time and place — add them for the full chart.",
  "engine": "VSOP87 (astronomia) + ELP2000 Moon + Chiron table — same engine as the full Little Souls reading."
}
```
Every body object = `{ "sign": string, "degree": number }`. `ascendant` is `null` unless `time` + `lat` + `lon` are all supplied.

## UX notes for the landing section
- Free chart = the hook. Sun + Moon + all planets render instantly from `date` alone. Rising appears only when time + place are added — use that as the upsell nudge to the full reading.
- Brand: no "AI", no "report" — it's a "soul reading". The free chart leads to `/intake`.
- Standalone reference implementation: `public/tools/pet-birth-chart.html` (calls this exact endpoint).
