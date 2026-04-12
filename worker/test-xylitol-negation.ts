import { resolveSpeciesRules, findBannedIngredients } from "./species-recipe-rules.ts";

const dog = resolveSpeciesRules("dog");
const cases = [
  { text: "xylitol-free peanut butter",    expect: false, note: "safe compound" },
  { text: "no xylitol anywhere",            expect: false, note: "preceded by 'no'" },
  { text: "xylitol free nutty spread",      expect: false, note: "space-separated" },
  { text: "2 tbsp xylitol",                 expect: true,  note: "plain xylitol — unsafe" },
  { text: "peanut butter with xylitol",     expect: true,  note: "plain xylitol in ingredient" },
  { text: "chocolate chips",                expect: true,  note: "plain chocolate — unsafe" },
];

let pass = 0, fail = 0;
for (const c of cases) {
  const hits = findBannedIngredients(c.text, dog);
  const flagged = hits.length > 0;
  const ok = flagged === c.expect;
  console.log(`${ok ? "✓" : "✗"} ${c.note.padEnd(26)} text="${c.text}"  hits=[${hits.join(",")}]`);
  if (ok) pass++; else fail++;
}
console.log(`\nPASS: ${pass} / FAIL: ${fail}`);
if (fail > 0) Deno.exit(1);
