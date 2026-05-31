// Pet Birth Chart — public, free, $0. Pure astronomy (VSOP87/ELP2000), NO AI.
// Reuses the same ephemeris engine as the paid soul reading (_shared/ephemeris-v2.ts).
// Same input -> same output, deterministic. verify_jwt=false (set in config.toml).
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  calculateAllPositions,
  getElement,
  getModality,
  getRulingPlanet,
} from "../_shared/ephemeris-v2.ts";

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app"];
function cors(req: Request) {
  const o = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(o) ? o : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}
function json(o: unknown, status: number, req: Request) {
  return new Response(JSON.stringify(o), {
    status,
    headers: { ...cors(req), "Content-Type": "application/json", "Cache-Control": "public, max-age=86400, s-maxage=604800" },
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors(req) });
  try {
    let params: Record<string, string> = {};
    if (req.method === "GET") {
      const u = new URL(req.url);
      params = Object.fromEntries(u.searchParams) as Record<string, string>;
    } else {
      params = await req.json().catch(() => ({}));
    }

    const dateStr = (params.date || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return json({ error: "Provide date as YYYY-MM-DD" }, 400, req);

    const hasTime = !!params.time && /^\d{2}:\d{2}$/.test(params.time);
    const time = hasTime ? params.time : "12:00";
    const date = new Date(`${dateStr}T${time}:00Z`);
    if (isNaN(date.getTime())) return json({ error: "Invalid date" }, 400, req);

    const lat = params.lat !== undefined ? parseFloat(params.lat) : NaN;
    const lon = params.lon !== undefined ? parseFloat(params.lon) : NaN;
    const hasLoc = Number.isFinite(lat) && Number.isFinite(lon);
    const wantAsc = hasLoc && hasTime;

    const pos = calculateAllPositions(date, wantAsc ? lat : undefined, wantAsc ? lon : undefined);
    const b = (x?: { sign: string; degree: number }) => (x ? { sign: x.sign, degree: Math.round(x.degree * 10) / 10 } : null);

    const sunSign = pos.sun.sign;
    const core = [pos.sun, pos.moon, pos.mercury, pos.venus, pos.mars, pos.jupiter, pos.saturn, pos.uranus, pos.neptune, pos.pluto];
    if (wantAsc && pos.ascendant) core.push(pos.ascendant);
    const bal: Record<string, number> = { Fire: 0, Earth: 0, Water: 0, Air: 0 };
    for (const x of core) { const e = getElement(x.sign); if (e in bal) bal[e]++; }
    const dominantElement = Object.entries(bal).sort((a, c) => c[1] - a[1])[0][0];

    return json({
      input: { date: dateStr, time: hasTime ? time : null, hasLocation: hasLoc },
      sun: { ...b(pos.sun), element: getElement(sunSign), modality: getModality(sunSign), ruler: getRulingPlanet(sunSign) },
      moon: b(pos.moon),
      ascendant: wantAsc && pos.ascendant ? b(pos.ascendant) : null,
      mercury: b(pos.mercury), venus: b(pos.venus), mars: b(pos.mars),
      jupiter: b(pos.jupiter), saturn: b(pos.saturn), uranus: b(pos.uranus),
      neptune: b(pos.neptune), pluto: b(pos.pluto),
      chiron: b(pos.chiron), northNode: b(pos.northNode), lilith: b(pos.lilith),
      elementBalance: bal, dominantElement,
      ascendantAvailable: wantAsc,
      ascendantNote: wantAsc ? "True rising sign from birth time + location." : "Rising sign needs an exact birth time and place — add them for the full chart.",
      engine: "VSOP87 (astronomia) + ELP2000 Moon + Chiron table — same engine as the full Little Souls reading.",
    }, 200, req);
  } catch (e) {
    return json({ error: "calculation failed", detail: String((e as Error)?.message || e) }, 500, req);
  }
});
