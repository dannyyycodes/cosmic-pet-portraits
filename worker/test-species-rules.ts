import { resolveSpeciesRules, findBannedIngredients } from "./species-recipe-rules.ts";

const cases = [
  { species: "dog",          text: "2 tbsp peanut butter and oats",      expectSafe: true  },
  { species: "dog",          text: "Mix in some chocolate chips",         expectSafe: false },
  { species: "cat",          text: "Chicken with a pinch of garlic",      expectSafe: false },
  { species: "cat",          text: "Plain cooked chicken and sardines",   expectSafe: true  },
  { species: "rabbit",       text: "Timothy hay with small apple slice",  expectSafe: true  },
  { species: "rabbit",       text: "Iceberg lettuce salad",               expectSafe: false },
  { species: "bird",         text: "Quinoa with avocado",                 expectSafe: false },
  { species: "bird",         text: "Millet spray with berries",           expectSafe: true  },
  { species: "reptile",      text: "Gut-loaded crickets and squash",      expectSafe: true  },
  { species: "reptile",      text: "Wild-caught fireflies",               expectSafe: false },
  { species: "Goldfish",     text: "",                                    expectSafe: null, expectAppropriate: false  },
  { species: "snake",        text: "",                                    expectSafe: null, expectAppropriate: false  },
  { species: "Guinea Pig",   text: "Bell pepper and parsley",             expectSafe: true  },  // alias test
  { species: "BUDGIE",       text: "millet and some apple",               expectSafe: true  },
];

let pass = 0, fail = 0;
for (const c of cases) {
  const rules = resolveSpeciesRules(c.species);
  if (c.expectAppropriate === false) {
    const ok = rules.appropriate === false;
    console.log(ok ? "✓" : "✗", `${c.species.padEnd(14)} → appropriate=${rules.appropriate} fallback="${rules.fallbackTitle ?? "-"}"`);
    ok ? pass++ : fail++;
    continue;
  }
  const hits = findBannedIngredients(c.text, rules);
  const safe = hits.length === 0;
  const ok = safe === c.expectSafe;
  console.log(
    ok ? "✓" : "✗",
    `${c.species.padEnd(14)} safe=${safe}  expected=${c.expectSafe}  hits=[${hits.join(",")}]  text="${c.text}"`
  );
  ok ? pass++ : fail++;
}

console.log(`\nPASS: ${pass} / FAIL: ${fail}`);
if (fail > 0) Deno.exit(1);
