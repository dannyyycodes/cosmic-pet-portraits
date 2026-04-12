/**
 * Species-specific safe ingredient allowlists + absolute banlists for the
 * "Cosmic Recipe" section of the report.
 *
 * Sources cross-referenced: ASPCA Animal Poison Control, RSPCA, PDSA, Blue
 * Cross, VCA Animal Hospitals. Fish and snakes are flagged as NOT suitable
 * for a baked-treat concept — the worker swaps the section for a
 * species-appropriate alternative (feeding ritual / prey ritual).
 *
 * When adding ingredients, prefer whole, commonly-available, minimally
 * processed items. Always check commercial peanut butter for xylitol.
 */

export interface SpeciesRecipeRules {
  /** Whether a baked/prepared homemade treat recipe is appropriate for this species at all. */
  appropriate: boolean;
  /** Common, safe ingredients. Recipes MUST use only these. */
  safe: string[];
  /** Absolute never-use list. Worker-side regex rejects any output containing these. */
  banned: string[];
  /** One-line guidance the prompt passes to the model. */
  note: string;
  /** Fallback section title when `appropriate: false`. */
  fallbackTitle?: string;
  /** Fallback body framing when appropriate === false. */
  fallbackFraming?: string;
}

export const SPECIES_RECIPE_RULES: Record<string, SpeciesRecipeRules> = {
  dog: {
    appropriate: true,
    safe: [
      "pumpkin (plain, cooked)", "peanut butter (xylitol-free)", "oats", "banana",
      "sweet potato (cooked)", "plain cooked chicken", "blueberries", "carrots",
      "plain yogurt", "coconut oil", "eggs (cooked)", "rice flour",
      "apple (seedless, cored)", "plain cooked turkey", "green beans",
    ],
    banned: [
      "chocolate", "xylitol", "grapes", "raisins", "onion", "onion powder",
      "garlic", "garlic powder", "macadamia", "avocado", "caffeine", "coffee",
      "alcohol", "cooked bones", "raw bread dough", "chives", "leeks",
      "nutmeg",
    ],
    note: "Treats under 10% of daily calories. Always specify xylitol-free peanut butter.",
  },

  cat: {
    appropriate: true,
    safe: [
      "plain cooked chicken", "plain cooked turkey", "plain cooked salmon",
      "plain cooked tuna", "cooked egg", "plain cooked liver",
      "sardines in water", "pumpkin (plain, small amount)", "cantaloupe",
      "blueberries", "plain cooked shrimp", "catnip", "cat grass", "freeze-dried meat",
    ],
    banned: [
      "onion", "garlic", "chives", "leeks", "chocolate", "xylitol",
      "grapes", "raisins", "raw dough", "alcohol", "caffeine",
      "raw fish", "milk", "cream", "cheese", "dairy",
      "propylene glycol", "dog treats",
    ],
    note: "Cats are obligate carnivores — keep it meat-based. Garlic/onion at even trace doses are toxic to cats.",
  },

  rabbit: {
    appropriate: true,
    safe: [
      "timothy hay", "romaine lettuce", "cilantro", "parsley", "basil", "mint",
      "bell pepper", "carrot tops", "small piece of carrot", "small piece of apple",
      "blueberries", "strawberry", "banana (tiny)", "dandelion greens", "oats (small pinch)",
    ],
    banned: [
      "iceberg lettuce", "chocolate", "avocado", "onion", "garlic", "rhubarb",
      "potato", "seeds", "nuts", "bread", "crackers", "yogurt drops",
      "meat", "dairy", "milk", "cheese",
    ],
    note: "Rabbits need 80%+ hay diet — treats are rare. Fruit only 1 tsp per 2 lbs body weight, few times a week.",
  },

  guinea_pig: {
    appropriate: true,
    safe: [
      "timothy hay", "bell pepper", "romaine lettuce", "cilantro", "parsley",
      "cucumber", "small piece of carrot", "small piece of apple", "blueberries",
      "strawberry", "tomato (no stems/leaves)", "kale", "dandelion greens",
      "basil", "zucchini",
    ],
    banned: [
      "iceberg lettuce", "chocolate", "avocado", "onion", "garlic", "rhubarb",
      "potato", "seeds", "nuts", "dairy", "meat", "bread", "cabbage", "mushrooms",
    ],
    note: "Guinea pigs cannot synthesize vitamin C — bell pepper + leafy greens essential. No grains, no dairy.",
  },

  hamster: {
    appropriate: true,
    safe: [
      "plain cooked chicken (tiny)", "mealworms", "pumpkin seeds (unsalted)",
      "sunflower seeds", "plain oats", "plain cooked egg", "small piece of apple",
      "small piece of carrot", "cucumber", "broccoli", "blueberry",
      "plain cooked rice", "small piece of banana", "peas", "whole grain bread (tiny)",
    ],
    banned: [
      "chocolate", "citrus", "orange", "lemon", "onion", "garlic", "raw almonds",
      "avocado", "tomato leaves", "rhubarb", "raw potato", "raw kidney beans",
      "sugary candy", "salt", "iceberg lettuce",
    ],
    note: "Tiny portions — pea-sized, 2-3× weekly. Dwarf hamsters are prone to diabetes: avoid fruit/honey for dwarfs.",
  },

  horse: {
    appropriate: true,
    safe: [
      "carrots", "apples (cored)", "oats", "bran", "molasses (small)",
      "peppermints (commercial horse)", "bananas (peeled)", "pears (cored)",
      "watermelon (no rind)", "celery", "pumpkin (plain)", "sunflower seeds",
      "hay cubes", "beet pulp",
    ],
    banned: [
      "chocolate", "avocado", "onion", "garlic", "tomato", "potato", "rhubarb",
      "cabbage", "broccoli", "cauliflower", "lawn clippings", "bread", "meat",
      "dairy", "stone fruit pits", "acorns", "cherry pit", "peach pit",
    ],
    note: "Horses prone to laminitis/colic — moderation matters. Cut into thumb-sized pieces to prevent choking.",
  },

  bird: {
    appropriate: true,
    safe: [
      "millet spray", "plain cooked quinoa", "plain cooked brown rice",
      "apple (no seeds)", "banana", "berries", "leafy greens", "bell pepper",
      "carrot", "broccoli", "sweet potato (cooked)", "unsalted almonds",
      "pumpkin seeds (unsalted)", "plain cooked egg", "sprouted seeds",
    ],
    banned: [
      "avocado", "chocolate", "caffeine", "coffee", "alcohol", "onion", "garlic",
      "apple seeds", "cherry pit", "peach pit", "apricot pit", "salt",
      "fried food", "rhubarb", "mushrooms", "dairy", "raw dough",
    ],
    note: "Avocado is FATAL to birds (persin). Never bake near a bird — PTFE fumes from non-stick cookware are lethal.",
  },

  fish: {
    appropriate: false,
    safe: [],  // irrelevant — section is swapped
    banned: [],
    note: "Homemade baked treats are harmful to fish. Section replaced with species-appropriate feeding ritual.",
    fallbackTitle: "🐠 Cosmic Feeding Ritual",
    fallbackFraming: "Fish don't take baked treats — they thrive on species-specific commercial food. This section is a mindful FEEDING RITUAL written for this pet: when/how to feed them to honor their cosmic rhythm. Reference species-appropriate foods (flake/pellet, bloodworms, brine shrimp, blanched zucchini for herbivores) and frame as a shared moment of cosmic connection.",
  },

  reptile: {
    appropriate: true,
    safe: [
      "crickets (gut-loaded)", "mealworms", "dubia roaches",
      "black soldier fly larvae", "collard greens", "mustard greens",
      "dandelion greens", "butternut squash", "bell pepper", "blueberries",
      "strawberry", "hibiscus flowers", "squash", "endive",
      "commercial tortoise pellets",
    ],
    banned: [
      "iceberg lettuce", "spinach", "rhubarb", "avocado", "onion", "garlic",
      "citrus", "fireflies", "wild-caught insects", "dairy", "meat scraps",
      "processed human food",
    ],
    note: "Highly species-specific: bearded dragons = omnivore, tortoises = herbivore, leopard geckos = insectivore only. Calcium + D3 dusting essential for insectivores. FIREFLIES are fatal to bearded dragons.",
  },

  snake: {
    appropriate: false,
    safe: [],
    banned: [],
    note: "Snakes eat whole prey only. No baked-treat concept. Section replaced with a prey ritual.",
    fallbackTitle: "🐍 Cosmic Prey Ritual",
    fallbackFraming: "Snakes are carnivores that eat whole pre-killed prey (appropriately-sized frozen/thawed mice or rats). This section honors their hunter nature as a cosmic ritual: the waiting, the ambush, the patient meditation of digestion. Never suggest recipes or snacks. Frame as a meditation on their primal rhythm.",
  },
};

// Common alias normalisation so intake form variants route to the right rule set.
const SPECIES_ALIASES: Record<string, string> = {
  "dog":            "dog",
  "puppy":          "dog",
  "cat":            "cat",
  "kitten":         "cat",
  "rabbit":         "rabbit",
  "bunny":          "rabbit",
  "guinea pig":     "guinea_pig",
  "guinea-pig":     "guinea_pig",
  "guinea_pig":     "guinea_pig",
  "cavy":           "guinea_pig",
  "hamster":        "hamster",
  "gerbil":         "hamster",
  "horse":          "horse",
  "pony":           "horse",
  "bird":           "bird",
  "parrot":         "bird",
  "budgie":         "bird",
  "canary":         "bird",
  "cockatiel":      "bird",
  "parakeet":       "bird",
  "fish":           "fish",
  "goldfish":       "fish",
  "betta":          "fish",
  "reptile":        "reptile",
  "tortoise":       "reptile",
  "turtle":         "reptile",
  "bearded dragon": "reptile",
  "gecko":          "reptile",
  "lizard":         "reptile",
  "snake":          "snake",
};

export function resolveSpeciesRules(speciesRaw: string): SpeciesRecipeRules {
  const key = speciesRaw.trim().toLowerCase();
  const normalized = SPECIES_ALIASES[key] ?? key;
  return SPECIES_RECIPE_RULES[normalized] ?? SPECIES_RECIPE_RULES.dog;  // safe default
}

/**
 * Post-generation validator: returns a list of BANNED ingredient mentions found
 * in the text. If it returns anything non-empty, the recipe section must be
 * regenerated or blocked. Case-insensitive whole-word matching where possible.
 */
export function findBannedIngredients(text: string, rules: SpeciesRecipeRules): string[] {
  if (!text || rules.banned.length === 0) return [];
  const lower = text.toLowerCase();
  const hits: string[] = [];
  for (const banned of rules.banned) {
    const term = banned.toLowerCase();
    if (!lower.includes(term)) continue;
    // Guard against common SAFE compounds — e.g. "xylitol-free peanut butter" is safe.
    // Scan each occurrence; if every occurrence is part of an allowed compound, skip.
    const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    let unsafeCount = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(lower)) !== null) {
      const start = m.index;
      const end = start + term.length;
      const afterCtx = lower.slice(end, end + 8);
      const beforeCtx = lower.slice(Math.max(0, start - 8), start);
      // Negation patterns that make this occurrence safe
      const negated = /^\s*[- ]?\s*(free|less|less[\s-]|less )/i.test(afterCtx)
                   || /\b(no|without|zero|free\s+of)\s*$/i.test(beforeCtx)
                   || afterCtx.startsWith("-free");
      if (!negated) unsafeCount++;
    }
    if (unsafeCount > 0) hits.push(banned);
  }
  return hits;
}
