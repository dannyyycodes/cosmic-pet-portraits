// text.ts
// -----------------------------------------------------------------------------
// deDash — removes em-dashes (— U+2014) and en-dashes (– U+2013) from any
// DISPLAYED report copy, since the brand standard is to never show a dash on
// screen. Pure, allocation-light, and safe on undefined / null / non-string.
//
// Conversion rules, in order:
//   1. Leading attribution dash:  "— Name"  ->  "Name"
//      (handles "—", "–", and a plain hyphen "-" used as an attribution lead)
//   2. Spaced mid-sentence dash:  "a — b"   ->  "a, b"
//   3. Any remaining em/en dash (touching letters, no spaces) -> ", "
//   4. Collapse the artifacts that step 2/3 can create:
//        ", ,"  -> ", "    (doubled commas)
//        ", ."  -> "."     (comma immediately before a full stop / ! / ?)
//        " ,"   -> ","     (stray space before comma)
//      then squeeze any double spaces and trim.
//
// Only em/en dashes are removed — ordinary hyphens inside words (e.g.
// "cottagecore", "5am", "2-step") are preserved, except the single leading
// attribution case in rule 1.

export function deDash(s?: string | null): string {
  if (typeof s !== 'string') return '';
  let out = s;

  // 1. Leading attribution dash at the very start of the string.
  //    e.g. "— Luna's Soul"  ->  "Luna's Soul"
  out = out.replace(/^\s*[—–-]\s*/, '');

  // 2. Spaced mid-sentence em/en dash  ->  ", "
  out = out.replace(/\s*[—–]\s+/g, ', ');

  // 3. Any remaining em/en dash (e.g. touching letters)  ->  ", "
  out = out.replace(/[—–]/g, ', ');

  // 4. Clean up artifacts.
  out = out
    .replace(/,\s*,+/g, ', ')   // doubled commas -> single
    .replace(/\s+,/g, ',')      // stray space before a comma
    .replace(/,\s*([.!?;:])/g, '$1') // ", ." / ", !" -> "." / "!"
    .replace(/ {2,}/g, ' ')     // squeeze double spaces
    .trim();

  return out;
}

export default deDash;
