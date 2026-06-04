// Legacy-pin redirector. Every Pinterest pin posted before 2026-06-04 points at
// the Shlink short URL go.littlesouls.app/littlesouls-pin, which forwards its
// query string here. Each carries utm_content=<library_id>-v<n>. We extract the
// library uuid and 302 to that artwork's own product page — so EVERY old pin
// lands on its /pawtraits/art/<id> page with one redirect, no per-pin editing.
//
// Wire-up: Shlink short code `littlesouls-pin` longUrl repointed to
// https://www.littlesouls.app/r/pin (vercel rewrite /r/pin -> /api/pin).
import type { VercelRequest, VercelResponse } from "@vercel/node";

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const GALLERY = "https://www.littlesouls.app/pawtraits/gallery";

export default function handler(req: VercelRequest, res: VercelResponse) {
  // utm_content = "<uuid>-v<n>"; also accept a bare ?id=<uuid> fallback.
  const utm = (req.query.utm_content ?? req.query.id ?? "").toString();
  const m = utm.match(UUID_RE);
  const dest = m
    ? `https://www.littlesouls.app/pawtraits/art/${m[0]}?utm_source=pinterest&utm_medium=organic&utm_campaign=library&utm_content=${encodeURIComponent(utm)}`
    : GALLERY;
  // 302 (not 301) — destinations are data-driven; don't let it get cached hard.
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60");
  res.redirect(302, dest);
}
