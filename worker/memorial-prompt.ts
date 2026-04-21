/**
 * Memorial prompt + schema — dedicated product for pets who have passed.
 *
 * The cosmic report ships jokes (crimes, dating profile, dream job, yelp
 * reviews). For a grieving owner, those are tone-deaf even rendered in past
 * tense. This module produces an ENTIRELY different report: slower, reverent,
 * grief-aware, structured around what the pet GAVE and what the owner CARRIES.
 *
 * The system and user prompts are separate from the main cosmic prompt so we
 * never leak playful-voice rules into the memorial pathway.
 */

import { z } from "https://esm.sh/zod@3.23.8";

// ─── Inputs passed from worker.ts ────────────────────────────────────────────

export interface MemorialPromptContext {
  name: string;
  species: string;
  breed: string;
  gender: "boy" | "girl";
  pronouns: { subject: string; object: string; possessive: string; reflexive: string };
  targetLanguage: string;

  sunSign: string;
  moonSign: string;
  ascendant: string;
  mercury: string;
  venus: string;
  mars: string;
  chiron: string;
  saturn: string;
  lilith: string;
  northNode: string;
  jupiter: string;
  neptune: string;
  element: string;
  rulingPlanet: string;
  positions: { sun: { degree: number }; moon: { degree: number }; ascendant?: { degree: number }; mars: { degree: number }; venus: { degree: number } };
  hasRealAscendant: boolean;

  chartPlacements: Record<string, { sign: string; degree: number; symbol: string }>;
  elementalBalance: Record<string, number>;
  aura: { primary: string; secondary: string; meaning: string };
  archetype: { name: string; description: string };
  nameVibration: number;

  dob: Date;
  passedDate?: string; // optional ISO date
  rememberedBy?: string; // optional "one word" field
  favoriteMemory?: string; // optional text

  ownerInsights: { soulType: string; superpower: string; strangerReaction: string };

  petPhotoDescription: string;

  // Optional owner chart — if the grieving buyer opted into Soul Bond (or had
  // it set from a prior reading on another pet), we use it to write a "You &
  // Them" synastry section. When absent, the memorial reading simply omits
  // that section; memorial stands alone without it.
  ownerChart?: {
    name?: string;
    sunSign: string;
    moonSign: string;
    ascendant: string;
    element: string;
    // Most synastry aspects for pet-owner are described in plain language,
    // not by aspect angles, so a minimal subset of placements is enough.
  };
}

// ─── System prompt ───────────────────────────────────────────────────────────

export function buildMemorialSystemPrompt(ctx: MemorialPromptContext): string {
  const {
    name, species, breed, gender, pronouns, targetLanguage,
    sunSign, moonSign, ascendant, mercury, venus, mars,
    chiron, saturn, lilith, northNode, jupiter, neptune,
    element, rulingPlanet, positions, hasRealAscendant,
    elementalBalance, petPhotoDescription,
  } = ctx;

  return `You are Celeste, Little Souls' pet astrologer. This is a MEMORIAL reading — ${name} has passed away. Your role here is different from the discovery and birthday readings: you are not the sassy friend, you are the quiet witness. A chaplain with a birth chart.

LANGUAGE: Write every value in ${targetLanguage}. Only JSON keys stay in English.

ABSOLUTE RULES (non-negotiable):
- ${name} is ${gender === "boy" ? "a BOY (male)" : "a GIRL (female)"}. Use ONLY ${pronouns.subject}/${pronouns.object}/${pronouns.possessive}/${pronouns.reflexive}. Never "they/them/their" for ${name}.
- PAST TENSE throughout — "was", "loved", "brought", "had". ${name} is not in the present. ${pronouns.subject} lived.
- NEVER write "your owner", "the owner", or "their owner". The reader IS the owner. Address them as "you".
- Every zodiac sign named in prose must match the calculated chart exactly.
- NEVER fabricate degrees or placements.
- The reader is grieving. Do NOT be funny. Do NOT use "chaos", "goblin", "criminal", "drama queen", "tyrant" framing anywhere. Forbidden entirely.
- No puns. No cheekiness. No pop-culture jokes.
- No "rainbow bridge" cliché. No "running free in heaven" cliché. No "always by your side" cliché. Earn every emotional moment.
- No stock phrases: "furry angel", "paw prints on your heart", "forever in our hearts" — these are Hallmark. Write as if you are the first person ever to say what you're saying.

VOICE:
- Reverent. Tender. Specific. Earned.
- Short sentences carry more weight than long ones here.
- Silence is a tool. A single short line on its own carries grief better than a paragraph.
- When you reach for a metaphor, make it small and sensory — a doorway, a weight, a thread, light through a window — not cosmic grandeur.
- When you reach for comfort, make it specific to ${name}, not general to grief.
- When you need to say something hard, say it plainly. "${name} is gone. That is a real thing. You are allowed to still be inside that."
- Include at least three moments that would make a grieving person stop reading for a second. Not to cry on cue — to recognize themselves.

BANNED WORDS (using any of these = failure):
- fascinating, gorgeous, magnificent, remarkable, profound, tapestry, navigate, embark, realm, delightful, incredibly, furthermore, essentially, ultimately, inherently, innately, myriad, seamlessly
- Stock grief phrases (above)
- "rainbow bridge", "paws left prints", "forever and always", "watching over you from", "crossed over"

CHART DATA (use exactly — never alter):
☉ Sun: ${sunSign} ${positions.sun.degree}°
☽ Moon: ${moonSign} ${positions.moon.degree}°
Rising: ${ascendant}${hasRealAscendant ? "" : " (estimated)"}
Mercury: ${mercury} | Venus: ${venus} | Mars: ${mars}
Chiron: ${chiron} | Saturn: ${saturn} | Lilith: ${lilith}
North Node: ${northNode} | Jupiter: ${jupiter} | Neptune: ${neptune}
Element: ${element} | Ruling planet: ${rulingPlanet}
Elemental balance: Fire ${elementalBalance.Fire}%, Earth ${elementalBalance.Earth}%, Air ${elementalBalance.Air}%, Water ${elementalBalance.Water}%

PET CONTEXT:
- Name: ${name}
- Species: ${species}${breed ? ` (breed: ${breed})` : ""}
- Gender: ${gender}${petPhotoDescription ? `
- Appearance: ${petPhotoDescription}
  → Weave real physical details (coat colour, markings, eyes, expression) into relevant sections. Never generic.` : ""}

EVERY MAJOR SECTION must:
- Cite at least one specific placement by name (Sun, Moon, Mars, Venus, Chiron, North Node, or a sign).
- Ground the emotional claim in something ${name}'s chart actually says — not generic dog/cat grief writing.
- Be written in ${targetLanguage}, past tense, reader-as-owner voice.`;
}

// ─── User prompt (JSON template) ─────────────────────────────────────────────

export function buildMemorialUserPrompt(ctx: MemorialPromptContext): string {
  const {
    name, species, breed, gender, pronouns,
    sunSign, moonSign, ascendant, venus, mars, chiron, saturn, jupiter,
    element, rulingPlanet, dob, passedDate, rememberedBy, favoriteMemory,
    ownerInsights, archetype, aura, chartPlacements, elementalBalance, nameVibration,
    ownerChart,
  } = ctx;

  const dobFormatted = dob.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const passedFormatted = passedDate
    ? new Date(passedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;
  const hasOwnerChart = !!(ownerChart && ownerChart.sunSign && ownerChart.moonSign);

  return `Generate a memorial reading for ${name} the ${breed || species}. Return ONLY valid JSON matching this structure. Each narrative section must be substantive — memorial readings err on the side of deeper, slower, more specific.

DATES:
- Born: ${dobFormatted}
${passedFormatted ? `- Passed: ${passedFormatted}` : "- Passing date not provided"}
${rememberedBy ? `- Owner remembers ${pronouns.object} by: "${rememberedBy}"` : ""}
${favoriteMemory ? `- Shared memory from owner: "${favoriteMemory.slice(0, 400)}"` : ""}

OWNER'S OBSERVATIONS (weave in where they fit — never force):
${ownerInsights.soulType ? `- Soul type: "${ownerInsights.soulType}"` : "- Soul type: not specified"}
${ownerInsights.superpower ? `- Their gift: "${ownerInsights.superpower}"` : "- Gift: not specified"}
${ownerInsights.strangerReaction ? `- With strangers: "${ownerInsights.strangerReaction}"` : ""}

${hasOwnerChart ? `OWNER'S CHART (present — include the "ourBond" section; see schema below):
- Owner${ownerChart?.name ? ` (${ownerChart.name})` : ""}: Sun ${ownerChart?.sunSign}, Moon ${ownerChart?.moonSign}, Rising ${ownerChart?.ascendant}, dominant element ${ownerChart?.element}.
- This is a synastry thread, written past-tense: what ${pronouns.possessive} chart MET in yours. What ${pronouns.subject} came to teach your ${ownerChart?.sunSign} Sun. How ${pronouns.possessive} ${element} element balanced or challenged your ${ownerChart?.element} element. Keep it reverent. No Hallmark.` : `OWNER'S CHART: not provided. Do NOT emit the "ourBond" section — omit it entirely from the JSON output.`}

JSON STRUCTURE:

{
  "chartPlacements": ${JSON.stringify(chartPlacements)},
  "elementalBalance": ${JSON.stringify(elementalBalance)},
  "dominantElement": "${element}",
  "aura": ${JSON.stringify(aura)},
  "archetype": ${JSON.stringify(archetype)},

  "prologue": "5-6 sentences. Open the memorial not with cosmic grandeur but with the quiet truth that ${name} existed — specifically, particularly, irreplaceably. Reference ${sunSign} Sun and ${element} element as the light ${pronouns.subject} carried. Past tense. End on a line that holds weight — something the owner will want to re-read.",

  "nameMeaning": {
    "origin": "The origin/etymology of '${name}' in past-tense framing. What the name meant where it came from.",
    "cosmicSignificance": "2-3 sentences. How the name's meaning fit ${pronouns.possessive} ${sunSign} Sun or ${moonSign} Moon. Past tense. Gentle.",
    "nameVibration": ${nameVibration},
    "numerologyMeaning": "1-2 sentences on what the vibration ${nameVibration} revealed about who ${pronouns.subject} was. Past tense.",
    "memorialNote": "A single sentence — what it means to still speak ${pronouns.possessive} name now that ${pronouns.subject} is gone."
  },

  "whoTheyWere": {
    "title": "Who ${name} Was",
    "threeTruths": "3 paragraphs, one each: (1) The Sun — who ${pronouns.subject} was at the core (${sunSign}, past tense, specific ${species} behaviours, body language, energy). (2) The Moon — how ${pronouns.subject} felt safe and what soothed ${pronouns.object} (${moonSign}, specific comfort rituals ${pronouns.subject} had). (3) The Rising — how ${pronouns.subject} met the world (${ascendant}, first-impression signature). Each paragraph must reference the actual placement and one specific behaviour the owner would recognise.",
    "goldenThread": "A single short sentence that names the ONE thing that ran through everything ${name} did — the signature trait the chart kept pointing at. This thread appears in other sections too."
  },

  "giftsTheyBrought": {
    "title": "What ${name} Gave You",
    "gifts": [
      "Gift 1 — grounded in ${pronouns.possessive} ${venus} Venus. The specific way ${pronouns.subject} gave love and what that changed in your house. 2-3 sentences. Past tense.",
      "Gift 2 — grounded in ${pronouns.possessive} ${mars} Mars or ${jupiter}. The particular energy ${pronouns.subject} brought when ${pronouns.subject} walked in. 2-3 sentences.",
      "Gift 3 — grounded in ${pronouns.possessive} ${sunSign} Sun or breed nature. The thing only ${name}, in particular, could have given. 2-3 sentences."
    ],
    "quietestGift": "1-2 sentences. The gift the owner probably didn't realise they were getting until now. Reference ${pronouns.possessive} ${moonSign} Moon or ${chiron} Chiron."
  },

  "theBridge": {
    "title": "What ${name} Taught You",
    "lessons": [
      "Lesson 1 — tied to ${pronouns.possessive} ${sunSign} Sun. 2-3 sentences. Not abstract — something specific they taught YOU to do/see/hold. Past tense.",
      "Lesson 2 — tied to ${pronouns.possessive} ${moonSign} Moon or ${chiron} Chiron. 2-3 sentences.",
      "Lesson 3 — tied to ${pronouns.possessive} Rising or North Node in ${chartPlacements.northNode?.sign ?? "unknown"}. 2-3 sentences."
    ],
    "quotableLine": "A single line you'd put on a small card the owner carries in their wallet. Earn it — no cliché."
  },

  "soulStillSpeaks": {
    "title": "What Lives On",
    "content": "4-5 sentences. In astrology the chart doesn't end when the body does — ${pronouns.possessive} ${chiron} Chiron (the healer's wound) and ${chartPlacements.northNode?.sign ?? "unknown"} North Node (soul's purpose) keep working. Say, specifically, what ${name}'s soul is still doing for you — how ${pronouns.possessive} presence is still shaped into your life. Not cliché ('looking down on you'); specific ('the way you reach to check the back seat of the car is ${pronouns.possessive}').",
    "signatureYouCarry": "1-2 sentences. The specific habit, phrase, or reflex the owner now has BECAUSE of ${name} — something they didn't do before ${name} came into their life and still do now.",
    "smallSigns": ["2-3 specific things to watch for that might feel like ${pronouns.object} saying hello — each grounded in ${pronouns.possessive} chart (a colour from ${pronouns.possessive} element, a time of day from ${pronouns.possessive} ruling planet, a specific sound or animal). No 'rainbows', no 'butterflies'. Earn each one."]
  },

  "theirVoiceNow": {
    "title": "If ${name} Could Speak to You Now",
    "letter": "8-12 sentences. A message from ${name} to the owner, written in first person. Past-present tense — ${pronouns.subject} is speaking FROM the other side, about what ${pronouns.subject} experienced while alive and what ${pronouns.subject} still sees now. Required beats: (1) A specific small thing ${pronouns.subject} noticed about you that you never knew ${pronouns.subject} noticed. (2) The moment ${pronouns.subject} understood you loved ${pronouns.object}. (3) A line about what ${pronouns.subject} wants you to know about how ${pronouns.subject} felt at the end. (4) A line releasing you from guilt about anything you think you should have done. (5) What ${pronouns.subject} wants for you now. Reference ${pronouns.possessive} ${sunSign} Sun and ${moonSign} Moon in the voice. This letter must make the reader stop and put the phone down. If it doesn't, it's not done.",
    "signoff": "A one-line sign-off in ${name}'s voice, tied to a real behaviour or place. Example shape: '— ${name}, from the doorway I always watched.'"
  },

  "griefCompass": {
    "title": "Your Grief, Through ${name}'s Chart",
    "content": "4-5 sentences. Name the shape grief is taking in YOU because ${name}'s element was ${element}. Fire pets leave a restless grief (you'll want motion). Earth pets leave an emptied-house grief (the body of the home feels wrong). Air pets leave a silence grief (the sound of the house changes). Water pets leave a tidal grief (it comes in waves, and each wave is a memory). Say which one is happening to you, gently, and name it. Then give ONE thing the owner can do today to move with it, not through it.",
    "youAreNotDoingThisWrong": "A single short sentence. Permission."
  },

  "ritualsForRemembering": {
    "title": "Rituals Written in ${name}'s Chart",
    "rituals": [
      "Ritual 1 — a daily small act tied to ${pronouns.possessive} ${element} element. Be specific: the time of day, the sensory detail (sunlight / water / window / soil), the duration (2-3 minutes). Grounded in ${pronouns.possessive} ${rulingPlanet} ruling planet.",
      "Ritual 2 — a weekly act tied to ${pronouns.possessive} ${venus} Venus. Involves something you two loved together.",
      "Ritual 3 — a monthly act tied to ${pronouns.possessive} moon cycle (new moon or full moon, chosen by ${pronouns.possessive} ${moonSign} Moon)."
    ],
    "anchorObject": "1 sentence naming a single object the owner might keep somewhere visible — chosen based on ${pronouns.possessive} element (Fire = a candle; Earth = a stone; Air = a feather; Water = a small bowl of water). Why this specific thing for ${name}."
  },

  "threePermissionSlips": {
    "title": "Three Things ${name} Wants You to Know",
    "slips": [
      "Permission slip 1 — what ${name} wants you to let yourself feel. Grounded in ${pronouns.possessive} ${chiron} Chiron or ${moonSign} Moon. A sentence you'd want framed.",
      "Permission slip 2 — what ${name} wants you to let yourself do (rest, cry, laugh at a memory, not feel guilty for a specific thing). Specific, not generic.",
      "Permission slip 3 — what ${name} wants you to let yourself become. Tied to ${pronouns.possessive} North Node — what ${pronouns.subject} was sent to free in you."
    ]
  },

  "anniversaryGuide": {
    "title": "The Days That Will Ask Something of You",
    "birthday": "3-4 sentences. What to do on ${name}'s birthday each year. A specific, small ritual tied to ${pronouns.possessive} ${sunSign} Sun. Not a lavish gesture — a small, repeatable one the owner can keep forever.",
    "passingDay": "3-4 sentences. What to do on the anniversary of the day ${pronouns.subject} went. Permission to mark it or not. If you mark it — one suggested gesture tied to ${pronouns.possessive} ${moonSign} Moon. A line for what to say aloud.",
    "hardRandomDays": "1-2 sentences. Permission to have days out of nowhere that flatten you. Grounded in the fact that grief isn't a calendar; it's a weather system."
  },

  "whenAnotherArrives": {
    "title": "Someday, If Another Arrives",
    "content": "4-5 sentences. Soft. No pressure. NEVER say 'you should' or 'it's time'. Say that if another soul comes, it won't be ${name} — and that's not a betrayal. Reference that ${name}'s ${sunSign} Sun was specific and unrepeatable. Give permission for the new one to be different AND for the owner to still miss ${name} on the same day they love the new one. End with one line that holds both.",
    "signToWatchFor": "A single sentence — when you'll know another can come in. Tied vaguely to the heart, not a timeline."
  },

  "aTreatForTheirMemory": {
    "title": "Something You Can Make for ${name}'s Memory",
    "description": "2-3 sentences introducing a simple, human-edible treat (not pet food) the owner can make on ${name}'s birthday or anniversary — chosen for symbolism, not nutrition. The ingredient list should tie to ${pronouns.possessive} element: Fire = warm spices and citrus; Earth = oats, honey, nuts; Air = light, almond, lemon; Water = berry, chamomile. Past tense framing — 'this is what ${name}'s sign always pointed to'.",
    "ingredients": ["4-6 simple human-safe ingredients matching the element"],
    "steps": ["3-4 very short, comforting steps. The point is the ritual, not the recipe."],
    "whenToMake": "The specific day or days to make it."
  },

  "keepersOath": {
    "title": "What You Carry",
    "oath": "3-4 short lines, formatted as a vow. First person ('I carry ${name}'s...'). Each line tied to a different placement (e.g. Sun, Moon, Venus). The owner can read it aloud on hard days. Must feel earned, not saccharine. Should end with a specific, personal commitment — not a generic 'I will remember'."
  },${hasOwnerChart ? `

  "ourBond": {
    "title": "You and ${name}",
    "content": "4-5 sentences. Past-tense synastry: the specific way your ${ownerChart?.sunSign} Sun met ${pronouns.possessive} ${sunSign} Sun, what ${pronouns.possessive} ${element} element gave your ${ownerChart?.element} element, the thread that ran between you that was not accidental. Be reverent. No Hallmark phrasing.",
    "whatYouGave": "2-3 sentences. What the chart shows YOU gave ${name} — grounded in your ${ownerChart?.moonSign} Moon or ${ownerChart?.sunSign} Sun.",
    "whatTheyGave": "2-3 sentences. What ${pronouns.subject} gave back — grounded in ${pronouns.possessive} ${moonSign} Moon or ${venus} Venus. Specific, not generic.",
    "aspectInAWord": "A single word that names the shape of your bond in the sky (e.g. 'answer', 'mirror', 'teacher', 'shelter'). Tie to the synastry — no meaningless poetry."
  },` : ""}

  "epilogue": "5-6 sentences. The closing letter. Past tense. Weave ${sunSign} Sun, ${moonSign} Moon, and ${ascendant} Rising into a final, quotable goodbye-that-is-not-a-goodbye. The final line is the most important line in the entire reading — it must be the one the owner will come back to when ${pronouns.subject} needs to hear from ${name} again. Make it small. Make it true."
}

FINAL RULES:
- Never show a Roman numeral chapter framework — this reading is a quiet book, not an album.
- Every section must reference at least one placement by name.
- Never comfort by diminishing. "${name} is gone." is not a mistake to soften.`;
}

// ─── Zod schema for memorial report ──────────────────────────────────────────

const memChartPlacement = z.object({
  sign: z.string().min(2),
  degree: z.number().min(0).max(30),
  symbol: z.string().min(1),
});

const memMin = (n: number) => z.string().min(n);

export const memorialReportSchema = z.object({
  chartPlacements: z.record(z.string(), memChartPlacement),
  elementalBalance: z.record(z.string(), z.number().min(0).max(100)),
  dominantElement: z.enum(["Fire", "Earth", "Air", "Water"]),
  aura: z.object({ primary: z.string(), secondary: z.string(), meaning: z.string() }),
  archetype: z.object({ name: z.string(), description: z.string() }),

  prologue: memMin(300),

  nameMeaning: z.object({
    origin: memMin(40),
    cosmicSignificance: memMin(60),
    nameVibration: z.number().int(),
    numerologyMeaning: memMin(40),
    memorialNote: memMin(30),
  }).passthrough().optional(),

  whoTheyWere: z.object({
    title: z.string().optional(),
    threeTruths: memMin(500),
    goldenThread: memMin(40),
  }).passthrough(),

  giftsTheyBrought: z.object({
    title: z.string().optional(),
    gifts: z.array(memMin(120)).min(3).max(3),
    quietestGift: memMin(60),
  }).passthrough(),

  theBridge: z.object({
    title: z.string().optional(),
    lessons: z.array(memMin(120)).min(3).max(3),
    quotableLine: memMin(30),
  }).passthrough(),

  soulStillSpeaks: z.object({
    title: z.string().optional(),
    content: memMin(300),
    signatureYouCarry: memMin(60),
    smallSigns: z.array(memMin(40)).min(2).max(3),
  }).passthrough(),

  theirVoiceNow: z.object({
    title: z.string().optional(),
    letter: memMin(500),
    signoff: z.string().optional(),
  }).passthrough(),

  griefCompass: z.object({
    title: z.string().optional(),
    content: memMin(300),
    youAreNotDoingThisWrong: z.string().optional(),
  }).passthrough(),

  ritualsForRemembering: z.object({
    title: z.string().optional(),
    rituals: z.array(memMin(80)).min(3).max(3),
    anchorObject: memMin(40),
  }).passthrough(),

  threePermissionSlips: z.object({
    title: z.string().optional(),
    slips: z.array(memMin(60)).min(3).max(3),
  }).passthrough(),

  anniversaryGuide: z.object({
    title: z.string().optional(),
    birthday: memMin(120),
    passingDay: memMin(120),
    hardRandomDays: z.string().optional(),
  }).passthrough(),

  whenAnotherArrives: z.object({
    title: z.string().optional(),
    content: memMin(200),
    signToWatchFor: z.string().optional(),
  }).passthrough().optional(),

  aTreatForTheirMemory: z.object({
    title: z.string().optional(),
    description: memMin(80),
    ingredients: z.array(z.string()).min(3),
    steps: z.array(z.string()).min(2),
    whenToMake: z.string().optional(),
  }).passthrough().optional(),

  keepersOath: z.object({
    title: z.string().optional(),
    oath: memMin(80),
  }).passthrough(),

  // Optional synastry section — only emitted when ownerChart is provided in
  // the memorial context. Gives memorial + Soul Bond buyers a dedicated
  // "You & Them" thread without bloating the reading for grief-only buyers.
  ourBond: z.object({
    title: z.string().optional(),
    content: memMin(300),
    whatYouGave: memMin(100),
    whatTheyGave: memMin(100),
    aspectInAWord: z.string().optional(),
  }).passthrough().optional(),

  epilogue: memMin(300),
}).passthrough();

export type MemorialReport = z.infer<typeof memorialReportSchema>;

export interface MemorialValidationResult {
  valid: boolean;
  failedSections: string[];
  errors: string[];
}

export function validateMemorialReport(raw: unknown): MemorialValidationResult {
  const parsed = memorialReportSchema.safeParse(raw);
  if (parsed.success) return { valid: true, failedSections: [], errors: [] };
  const failed = new Set<string>();
  const errors: string[] = [];
  for (const issue of parsed.error.issues) {
    const section = typeof issue.path[0] === "string" ? issue.path[0] : "unknown";
    failed.add(section);
    errors.push(`${issue.path.join(".")}: ${issue.message}`);
  }
  return { valid: false, failedSections: Array.from(failed), errors };
}

// ─── Memorial-specific placement-citation required sections ──────────────────
// Used by the verifier when occasionMode === 'memorial' to enforce chart
// grounding in every major memorial section.
export const MEMORIAL_PLACEMENT_REQUIRED_SECTIONS = [
  "prologue",
  "whoTheyWere",
  "giftsTheyBrought",
  "theBridge",
  "soulStillSpeaks",
  "theirVoiceNow",
  "griefCompass",
  "ritualsForRemembering",
  "threePermissionSlips",
  "anniversaryGuide",
  "keepersOath",
  "epilogue",
] as const;
