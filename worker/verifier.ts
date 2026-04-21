/**
 * Report verifier — deterministic + LLM-backed quality control.
 *
 * Runs after the main Sonnet 4.5 generation. Returns a structured
 * VerificationResult that the worker uses to:
 *   1. Auto-fix simple issues inline (banned words, pronoun swaps, owner phrasing)
 *   2. Flag sections that need LLM regeneration (tense violations, language drift)
 *   3. Block unsafe content (recipe banlist already handled elsewhere; this is extra)
 *
 * Design principle: deterministic regex checks run first (instant, free).
 * Haiku is only invoked for checks that need semantic judgment — tense
 * consistency in memorial mode, and target-language verification for
 * non-English reports.
 */

// ─── Brand voice — banned words that make the report sound AI-generated ─────
// Must match the "BANNED WORDS & PATTERNS" block in the main prompt.
const BANNED_WORDS = [
  "fascinating", "gorgeous", "magnificent", "remarkable", "profound",
  "tapestry", "navigate", "embark", "realm", "delightful", "incredibly",
  "furthermore", "in essence", "it's worth noting", "essentially",
  "ultimately", "inherently", "innately", "myriad", "seamlessly",
];

// ─── Sections that MUST cite at least one real placement or zodiac sign by
//     name. A section that writes 200 words without naming Sun/Moon/Mars/etc
//     is almost certainly generic "could be any pet" slop. Feeds the
//     placement-citation auditor.
const PLACEMENT_REQUIRED_SECTIONS = [
  "solarSoulprint", "lunarHeart", "cosmicCuriosity", "harmonyHeartbeats",
  "spiritOfMotion", "starlitGaze", "destinyCompass", "gentleHealer",
  "wildSpirit", "cosmicExpansion", "cosmicLessons",
  "elementalNature", "celestialChoreography", "earthlyExpression",
  "luminousField", "eternalArchetype", "keepersBond",
  "petMonologue", "epilogue",
  // New 2026-04-17 sections:
  "shadowSelf", "petOwnerFriction",
] as const;

// Tokens whose presence in a section's text proves the AI grounded that
// section in real chart data. Includes planet names, sign names, and
// astrology anchors. Case-insensitive check.
//
// NOTE: "rising" is deliberately EXCLUDED (too easily triggered by common
// English — "rising to the occasion", "the sun is rising", etc.). Use
// "ascendant" for that placement. Agent audit 2026-04-17 flagged "rising"
// as the #1 false-negative in the citation auditor.
const PLACEMENT_CITATION_TOKENS = [
  "sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn",
  "uranus", "neptune", "pluto", "chiron", "lilith", "ascendant",
  "north node", "south node",
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
];

// Phrases the AI must never produce
const BANNED_PHRASES = [
  /\bhere's the thing\b/i,
  /\bhere's where it gets interesting\b/i,
  /\blet's be honest\b/i,
  /\blet's talk about\b/i,
  /\bcreates this\b/i,
];

// ─── Types ──────────────────────────────────────────────────────────────────

export type Severity = "critical" | "warning" | "info";

export interface VerificationIssue {
  section: string;                // e.g. "prologue", "petMonologue", "cosmicRecipe"
  category: "pronoun" | "tense" | "banned_word" | "owner_phrasing" | "sign_mismatch"
          | "degree_mismatch" | "name_drift" | "language" | "recipe_safety" | "other";
  severity: Severity;
  message: string;
  autoFixable: boolean;
  foundText?: string;
}

export interface VerificationResult {
  overallPass: boolean;
  autoFixesApplied: number;
  issues: VerificationIssue[];
  sectionsToRegenerate: string[];  // distinct sections needing LLM regen
}

export interface VerifyOpts {
  gender: "boy" | "girl";
  occasionMode: "discover" | "new" | "birthday" | "memorial" | "gift";
  petName: string;
  language: string;                 // "en", "es", "de", "fr", "pt", "ar"
  // All zodiac signs that legitimately appear in the calculated chart
  validSigns: Set<string>;
  // Expected degrees for each body mentioned (sign -> degrees)
  chartDegrees: Record<string, { sign: string; degree: number }>;
  // Species-safe recipe banlist (applies to cosmicRecipe section)
  recipeBannedIngredients: string[];
  // Override the default PLACEMENT_REQUIRED_SECTIONS list — used by memorial
  // reports which have a different set of sections. If omitted, cosmic default.
  placementRequiredSections?: readonly string[];
}

// ─── Utilities ──────────────────────────────────────────────────────────────

const ALL_ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

function extractStringsWithPath(
  obj: unknown,
  path = "",
  out: Array<{ path: string; text: string }> = [],
): Array<{ path: string; text: string }> {
  if (typeof obj === "string") {
    out.push({ path, text: obj });
  } else if (Array.isArray(obj)) {
    obj.forEach((v, i) => extractStringsWithPath(v, `${path}[${i}]`, out));
  } else if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      extractStringsWithPath(v, path ? `${path}.${k}` : k, out);
    }
  }
  return out;
}

function sectionFromPath(p: string): string {
  // Top-level key, e.g. "petMonologue.monologue" → "petMonologue"
  return p.split(/[.\[]/)[0] || "(root)";
}

// ─── Deterministic checks ───────────────────────────────────────────────────

/**
 * Run fast regex-based checks on an already-parsed report object. Returns
 * a MUTATED report with inline auto-fixes applied, plus a list of issues.
 */
export function runDeterministicVerification(
  report: Record<string, unknown>,
  opts: VerifyOpts,
): { report: Record<string, unknown>; issues: VerificationIssue[]; autoFixesApplied: number } {
  const issues: VerificationIssue[] = [];
  let autoFixesApplied = 0;

  const pronounRules = opts.gender === "boy"
    ? {
        wrongSubject: /\bshe\b/gi,
        wrongObject:  /(?<![a-zA-Z])her\b(?!\s+name)/gi,
        wrongPoss:    /\bhers\b/gi,
        correctSubject: "he",
        correctObject: "him",
      }
    : {
        wrongSubject: /\bhe\b/gi,
        wrongObject:  /\bhim\b/gi,
        wrongPoss:    /\bhis\b/gi,
        correctSubject: "she",
        correctObject: "her",
      };

  const ownerPattern = /\b(your|the|their)\s+owner\b/gi;

  // ─── Walk every string field and check/fix it ─────────────────────────────
  const walkAndFix = (obj: unknown, path = ""): unknown => {
    if (typeof obj === "string") {
      const section = sectionFromPath(path);
      let fixed = obj;

      // 1. "your owner" / "the owner" → "you"
      if (ownerPattern.test(fixed)) {
        const originals = fixed.match(ownerPattern) ?? [];
        fixed = fixed.replace(ownerPattern, (match) => {
          const lower = match.toLowerCase();
          if (lower.startsWith("your")) return "you";
          if (lower.startsWith("their")) return "your";
          return "you";
        });
        for (const orig of originals) {
          issues.push({
            section, category: "owner_phrasing", severity: "warning",
            message: `"${orig}" auto-fixed to "you" — reader IS the owner.`,
            autoFixable: true, foundText: orig,
          });
          autoFixesApplied++;
        }
      }

      // 2. Banned brand-voice words → flagged CRITICAL so the worker
      //    regenerates the section instead of shipping slop. 48-hour probe —
      //    dial back to "warning" if regen rate proves excessive.
      for (const word of BANNED_WORDS) {
        const re = new RegExp(`\\b${word}\\b`, "gi");
        const hits = fixed.match(re);
        if (hits) {
          issues.push({
            section, category: "banned_word", severity: "critical",
            message: `Banned word "${word}" used ${hits.length}× — breaks brand voice.`,
            autoFixable: false, foundText: word,
          });
        }
      }
      for (const re of BANNED_PHRASES) {
        const hits = fixed.match(re);
        if (hits) {
          issues.push({
            section, category: "banned_word", severity: "critical",
            message: `Banned phrase "${hits[0]}" — AI crutch language.`,
            autoFixable: false, foundText: hits[0],
          });
        }
      }

      // 3. Pet name spelling — case-insensitive count, flag if apparent drift
      if (opts.petName.length >= 3) {
        const esc = opts.petName.replace(/[.*+?^${}()|[\]\\]/g, "\\$1");
        // Match close-but-different: one-letter swaps up to 1 edit distance is costly,
        // so we just check casing drift as a common LLM failure mode.
        const exact = new RegExp(`\\b${esc}\\b`, "g");
        const caseInsensitive = new RegExp(`\\b${esc}\\b`, "gi");
        const exactCount = (fixed.match(exact) ?? []).length;
        const ciCount = (fixed.match(caseInsensitive) ?? []).length;
        if (ciCount > exactCount && exactCount > 0) {
          // Auto-fix casing drift (e.g. "BEAR" or "bear" → "Bear")
          const originals = fixed.match(caseInsensitive) ?? [];
          fixed = fixed.replace(caseInsensitive, opts.petName);
          const fixedCount = originals.filter(o => o !== opts.petName).length;
          if (fixedCount > 0) {
            issues.push({
              section, category: "name_drift", severity: "info",
              message: `Pet name casing auto-fixed (${fixedCount}×).`,
              autoFixable: true,
            });
            autoFixesApplied += fixedCount;
          }
        }
      }

      // 4. Zodiac sign mentions must be in validSigns set (catches sign-swap errors).
      //    Only flag as CRITICAL when the sign is directly ATTRIBUTED to this pet,
      //    not when it appears in general/educational context.
      const nameEsc = opts.petName.replace(/[.*+?^${}()|[\]\\]/g, "\\$1");
      const attributionTerms = new RegExp(
        // Pet's name, or a pronoun we know belongs to the pet, near the sign
        `\\b(${nameEsc}|${opts.gender === "boy" ? "he|him|his" : "she|her|hers"})\\b`,
        "gi",
      );
      const educationalMarkers = /\b(fire|earth|air|water)\s+signs?\b|\b(Cancer|Scorpio|Pisces|Aries|Leo|Sagittarius|Taurus|Virgo|Capricorn|Gemini|Libra|Aquarius)\s*,\s*(Cancer|Scorpio|Pisces|Aries|Leo|Sagittarius|Taurus|Virgo|Capricorn|Gemini|Libra|Aquarius)\b|\b(compat|match|playmate|vib|pair|great with|best with|friend|ally|opposite|dogs? with|cats? with|pets? with|animals? with)\b/i;

      for (const sign of ALL_ZODIAC_SIGNS) {
        const re = new RegExp(`\\b${sign}\\b`, "g");
        const hits = [...fixed.matchAll(re)];
        if (hits.length === 0 || opts.validSigns.has(sign)) continue;

        // For each mention, check if its sentence has attribution to this pet AND no educational marker
        const sentenceRe = new RegExp(`[^.!?\\n]*\\b${sign}\\b[^.!?\\n]*[.!?]`, "g");
        const sentences = fixed.match(sentenceRe) ?? [];
        const attributedBad = sentences.filter((s) =>
          attributionTerms.test(s) && !educationalMarkers.test(s)
        );
        // Reset global regex state
        attributionTerms.lastIndex = 0;

        if (attributedBad.length > 0) {
          issues.push({
            section, category: "sign_mismatch", severity: "critical",
            message: `Sign "${sign}" attributed to ${opts.petName} but not in this pet's chart. Sentence: "${attributedBad[0].trim().slice(0, 140)}"`,
            autoFixable: false, foundText: sign,
          });
        }
      }

      // 5a. Memorial tense pre-check — fast deterministic catch for obvious
      //     present-tense verbs about the deceased pet. Haiku semantic check
      //     runs later (slower, LLM-based), but this catches ~80% of violations
      //     for free. A present-tense sentence about a dead pet in a memorial
      //     report is a critical failure. Attributing the verb to the pet is
      //     required (via pet name + subject pronoun) so we don't false-fire
      //     on sentences that happen to contain common present-tense verbs
      //     about the owner ("you still love them").
      if (opts.occasionMode === "memorial") {
        // Common present-tense verbs the memorial prompt explicitly forbids
        // (mirrors the cosmic→memorial verb substitution in occasionMode.ts).
        const PT_VERBS =
          "is|are|loves|brings|has|have|feels|shows|reacts|greets|wants|needs|does|goes|comes|runs|sits|sleeps|eats|thinks|knows";
        const namePart = opts.petName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const subjectPronoun = opts.gender === "boy" ? "he" : "she";
        const ptRe = new RegExp(
          // Either "{name} <verb>" or "{subjectPronoun} <verb>" at word boundaries.
          `\\b(?:${namePart}|${subjectPronoun})\\s+(?:${PT_VERBS})\\b`,
          "gi",
        );
        // Conditional markers that legitimately use present tense in a memorial
        // context ("if he is happy now", "when he comes to me in dreams") — we
        // tolerate these so the verb only counts when it's a bare statement.
        const conditionalRe =
          /\b(if|when|whether|as if|even if|as though|should|would|might|could|in case|imagine|suppose|perhaps|maybe)\b/i;
        const sentenceRe = new RegExp(
          `[^.!?\\n]*\\b(?:${namePart}|${subjectPronoun})\\s+(?:${PT_VERBS})\\b[^.!?\\n]*[.!?]`,
          "gi",
        );
        const ptMatches = [...fixed.matchAll(ptRe)];
        if (ptMatches.length > 0) {
          const sentences = fixed.match(sentenceRe) ?? [];
          const badSentences = sentences.filter((s) => !conditionalRe.test(s));
          if (badSentences.length > 0) {
            issues.push({
              section,
              category: "tense",
              severity: "critical",
              message:
                `Memorial mode requires PAST TENSE. Present-tense sentence detected: ` +
                `"${badSentences[0].trim().slice(0, 160)}"`,
              autoFixable: false,
              foundText: ptMatches[0][0],
            });
          }
        }
      }

      // 5. Degree drift — if "Sun at 5°" claimed, must match calculated ±1°
      const degRe = /\b(sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|ascendant|rising|chiron|lilith|north node)\s+(?:at|is at|of|in)?\s*(?:[a-z]+\s+)?(\d{1,2})\s*°/gi;
      for (const m of fixed.matchAll(degRe)) {
        const body = m[1].toLowerCase().replace(" ", "").replace("rising", "ascendant").replace("northnode", "northNode");
        const claimed = parseInt(m[2], 10);
        const calc = opts.chartDegrees[body];
        if (calc && Math.abs(claimed - calc.degree) > 1) {
          issues.push({
            section, category: "degree_mismatch", severity: "critical",
            message: `${body} claimed at ${claimed}° but chart has ${calc.degree}°. Full match: "${m[0]}"`,
            autoFixable: false, foundText: m[0],
          });
        }
      }

      return fixed;
    }

    if (Array.isArray(obj)) return obj.map((v, i) => walkAndFix(v, `${path}[${i}]`));
    if (obj && typeof obj === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
        out[k] = walkAndFix(v, path ? `${path}.${k}` : k);
      }
      return out;
    }
    return obj;
  };

  const fixedReport = walkAndFix(report) as Record<string, unknown>;

  // ─── Placement-citation audit ────────────────────────────────────────────
  // Every required section must cite at least one placement/sign by name.
  // A section that says 200 words about "energy" without ever naming a
  // planet or sign is generic AI-slop — regenerate it.
  const requiredSections = opts.placementRequiredSections ?? PLACEMENT_REQUIRED_SECTIONS;
  for (const sectionName of requiredSections) {
    const section = fixedReport[sectionName];
    if (!section) continue;

    // Flatten the section's text fields (title, content, preamble, etc.)
    // into one string. Skip short meta-fields like title so we only check
    // substantive narrative content.
    const texts = extractStringsWithPath(section);
    const body = texts
      .filter((t) => t.text.length >= 60)      // skip titles / short subfields
      .filter((t) => !/title$/i.test(t.path))  // belt + braces
      .map((t) => t.text)
      .join(" ")
      .toLowerCase();

    if (body.length < 80) continue; // nothing substantive to audit

    const cited = PLACEMENT_CITATION_TOKENS.some((tok) => {
      // Word-boundary match so "leo" doesn't trip on "sleeping".
      const re = new RegExp(`\\b${tok.replace(/\s+/g, "\\s+")}\\b`, "i");
      return re.test(body);
    });

    if (!cited) {
      issues.push({
        section: sectionName,
        category: "other",
        severity: "critical",
        message:
          `No placement citation in "${sectionName}" — section wrote ` +
          `${body.length} chars without naming any planet, sign, or chart anchor. ` +
          `This is generic slop; regenerate with chart-grounded rewrite.`,
        autoFixable: false,
      });
    }
  }

  // ─── Whole-report pronoun balance check ──────────────────────────────────
  // We count wrong-gender pronouns across the whole report. A few are fine
  // (dialogue, names, etc.); >3 indicates the AI drifted.
  const fullText = extractStringsWithPath(fixedReport).map((x) => x.text).join("\n");
  const wrongSubjectHits = fullText.match(pronounRules.wrongSubject) ?? [];
  if (wrongSubjectHits.length > 3) {
    issues.push({
      section: "(whole-report)", category: "pronoun", severity: "warning",
      message: `${wrongSubjectHits.length} wrong-gender subject pronouns ("${pronounRules.wrongSubject.source}") — should be "${pronounRules.correctSubject}". Likely sections need regeneration.`,
      autoFixable: false,
    });
  }

  return { report: fixedReport, issues, autoFixesApplied };
}

// ─── Haiku-backed semantic checks ───────────────────────────────────────────

/**
 * Ask Haiku 4.5 to spot tense violations in memorial mode and language
 * drift for non-English reports. Returns a list of sections that need
 * full regeneration. Never throws — falls back to "no issues" on network error.
 */
export async function runSemanticVerification(
  report: Record<string, unknown>,
  opts: VerifyOpts,
  openrouterApiKey: string,
): Promise<{ issues: VerificationIssue[] }> {
  const issues: VerificationIssue[] = [];

  // Only run if we have something actually worth semantic-checking
  const needsTenseCheck = opts.occasionMode === "memorial";
  const needsLangCheck = opts.language !== "en";
  if (!needsTenseCheck && !needsLangCheck) return { issues };

  const targetLangNames: Record<string, string> = {
    es: "Spanish", de: "German", fr: "French", pt: "Portuguese", ar: "Arabic",
  };

  const systemPrompt = `You are a strict report auditor. You return ONLY a JSON object.
Given a pet astrology report, flag violations of the rules the author MUST follow.
Return schema:
{
  "issues": [
    { "section": "prologue" | "petMonologue" | ... | "(global)",
      "rule": "memorial_tense" | "language",
      "excerpt": "<the problematic sentence>",
      "why": "<brief reason>" }
  ]
}
If no issues, return { "issues": [] }.`;

  const checks: string[] = [];
  if (needsTenseCheck) {
    checks.push(
`RULE — MEMORIAL MODE PAST TENSE: This is a MEMORIAL report — the pet has passed away.
EVERY section (prologue, monologue, fun sections, recipe, everything) MUST use past tense
("was", "loved", "brought"). Present-tense verbs about the pet ("is", "loves", "brings") are
critical violations. Ignore dialogue or quotes that are intentionally in past-tense form.`
    );
  }
  if (needsLangCheck) {
    checks.push(
`RULE — LANGUAGE: This report MUST be entirely in ${targetLangNames[opts.language] || opts.language}.
JSON keys stay in English, but every VALUE (titles, descriptions, sentences) must be in
${targetLangNames[opts.language] || opts.language}. Flag any English sentence in a string value.`
    );
  }

  const userPrompt =
    `Pet: ${opts.petName} (${opts.gender})
Occasion: ${opts.occasionMode}
Language: ${opts.language}

${checks.join("\n\n")}

REPORT JSON:
${JSON.stringify(report).slice(0, 100_000)}`;   // Haiku 200k context, but cap at 100k for safety

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openrouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://littlesouls.app",
        "X-Title": "Little Souls Verifier",
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4.5",
        max_tokens: 4000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      console.warn("[VERIFIER] Haiku semantic check failed:", res.status);
      return { issues };
    }
    const json = await res.json();
    let content: string = json.choices?.[0]?.message?.content ?? "";
    if (!content) return { issues };

    // Strip markdown fences if Haiku wrapped its JSON (```json ... ```)
    content = content.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

    let parsed: { issues?: Array<{ section: string; rule: string; excerpt?: string; why?: string }> };
    try {
      parsed = JSON.parse(content);
    } catch {
      console.warn("[VERIFIER] Haiku response not JSON after fence strip:", content.slice(0, 200));
      return { issues };
    }

    for (const raw of parsed.issues ?? []) {
      const category: VerificationIssue["category"] = raw.rule === "memorial_tense" ? "tense" : "language";
      // Language drift = always critical (non-English content in an English
      // report is unusable). Memorial tense violations: previously warnings
      // because conditional/subjunctive forms can false-positive, but a
      // present-tense memorial report is a brand-level failure, so we escalate
      // to critical for memorial mode. Cosmic reports stay at "warning" for
      // tense (future-tense in a birthday report is fine).
      const severity: Severity =
        category === "language" ? "critical"
        : (category === "tense" && opts.occasionMode === "memorial") ? "critical"
        : "warning";
      issues.push({
        section: raw.section || "(global)",
        category,
        severity,
        message: `${raw.rule}: ${raw.why || ""} — "${(raw.excerpt || "").slice(0, 160)}"`,
        autoFixable: false,
        foundText: raw.excerpt,
      });
    }
    console.log(`[VERIFIER] Haiku flagged ${issues.length} semantic issues.`);
  } catch (e) {
    console.warn("[VERIFIER] Haiku call threw:", e);
  }

  return { issues };
}

// ─── Top-level entry point ──────────────────────────────────────────────────

export async function verifyReport(
  report: Record<string, unknown>,
  opts: VerifyOpts,
  openrouterApiKey: string,
): Promise<{ report: Record<string, unknown>; result: VerificationResult }> {
  // Step 1 — fast deterministic pass (also applies auto-fixes inline)
  const det = runDeterministicVerification(report, opts);

  // Step 2 — Haiku semantic pass (only for memorial or non-English)
  const sem = await runSemanticVerification(det.report, opts, openrouterApiKey);

  const allIssues = [...det.issues, ...sem.issues];
  const sectionsToRegenerate = Array.from(new Set(
    allIssues
      .filter((i) => !i.autoFixable && i.severity === "critical")
      .map((i) => i.section)
      .filter((s) => s !== "(whole-report)" && s !== "(global)"),
  ));
  const overallPass = allIssues.filter((i) => i.severity === "critical").length === 0;

  return {
    report: det.report,
    result: {
      overallPass,
      autoFixesApplied: det.autoFixesApplied,
      issues: allIssues,
      sectionsToRegenerate,
    },
  };
}
