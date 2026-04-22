/**
 * Standalone Deno worker for generating cross-pet compatibility readings.
 *
 * Usage:  deno run --allow-net --allow-env compatibility-reading.ts <compatibilityId> <petReportAId> <petReportBId>
 * Env:    OPENROUTER_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENROUTER_MODEL (optional)
 *
 * Invocation contract:
 *   server.ts receives POST { compatibilityId, petReportAId, petReportBId }
 *   and spawns this script with those three positional args.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://aduibsyrnenzobuyetmn.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// Opus 4.6 per the 2026-04-22 research sweep — human blind-rater panel
// preferred Opus 4.6 over GPT-5.4 and Gemini 3.1 Pro for literary / emotional
// prose. Opus 4.7 regressed (reviewer-reported bullets + sycophancy). Cross-
// pet synastry is the most reasoning-heavy reading we ship, literary register
// matches the product tone. Override via OPENROUTER_MODEL env var if a future
// experiment wants to test a cheaper pass.
const OPENROUTER_MODEL = Deno.env.get("OPENROUTER_MODEL") || "anthropic/claude-opus-4.6";

const compatibilityId = Deno.args[0];
const petReportAId = Deno.args[1];
const petReportBId = Deno.args[2];

if (!compatibilityId || !petReportAId || !petReportBId) {
  console.error("Usage: compatibility-reading.ts <compatibilityId> <petReportAId> <petReportBId>");
  Deno.exit(1);
}

// ─── Types ────────────────────────────────────────────────────────────────

interface PetSnapshot {
  id: string;
  petName: string;
  species?: string;
  gender?: string;
  sunSign?: string;
  moonSign?: string;
  risingSign?: string;
  element?: string;
  archetype?: string;
  prologue?: string;
  strangerReaction?: string;
  soulType?: string;
  superpower?: string;
  birthDate?: string;
}

// ─── Prompt ───────────────────────────────────────────────────────────────

function buildSystemPrompt(petA: PetSnapshot, petB: PetSnapshot): string {
  return `You are the cosmic bond translator at Little Souls. Two pets share a household; your job is to compose a cross-pet reading that reveals how they move through the world side by side.

═══ ABSOLUTE DATA ACCURACY RULES ═══
• Use ONLY the astrological placements supplied below. Do not invent degrees, signs, or planets that are not given.
• ${petA.petName} is a ${petA.species || 'pet'}. ${petB.petName} is a ${petB.species || 'pet'}. Keep their species consistent throughout.
• Address the READER as "you" / "your". Refer to each pet by name and the right pronouns.
• Never say "your pet" when you can say the pet's name.
• Never reference artificial intelligence, prompts, models, or generation. You are a cosmic translator, not a chatbot.

═══ BRAND VOICE ═══
• Tender, literary, grounded. Think: warm letter from a friend who reads charts.
• British English sensibilities, no American cheese.
• Specific over abstract. "${petA.petName} paws at ${petB.petName}'s water bowl before drinking" > "they share things."
• Favour observation over prediction. No fortune-telling language.

═══ OUTPUT SHAPE (strict JSON) ═══
Return a single JSON object with this exact shape. No markdown fences, no prose outside the JSON:

{
  "headline": "<6–10 words, evocative, weaves both names>",
  "opening": "<1 paragraph, 3–5 sentences. Set the emotional tone. Mention both names.>",
  "sections": [
    {
      "title": "How they meet each other",
      "icon": "✦",
      "body": "<2–3 paragraphs. First-meeting energy, body language cues, the rhythm of their hellos.>"
    },
    {
      "title": "Where their charts harmonise",
      "icon": "☯",
      "body": "<2 paragraphs. Aspects between sun/moon/rising that flow. Translated into everyday behaviour.>"
    },
    {
      "title": "Where they gently clash",
      "icon": "⚡",
      "body": "<1–2 paragraphs. One or two tension points, named with compassion. How you can soften them.>"
    },
    {
      "title": "Rituals that keep the bond steady",
      "icon": "🌿",
      "body": "<2 paragraphs. 3–4 concrete daily rituals tailored to their specific placements. Be specific — name mealtime, bedtime, play.>"
    },
    {
      "title": "The gift they give each other",
      "icon": "💗",
      "body": "<1–2 paragraphs. The deeper soul-work each one does for the other.>"
    }
  ],
  "blessing": "<1 short, lyrical sentence. A line the reader wants to put on the fridge.>"
}

═══ PET A ═══
Name: ${petA.petName}
Species: ${petA.species || 'unknown'}
Gender: ${petA.gender || 'unknown'}
Sun: ${petA.sunSign || '—'}
Moon: ${petA.moonSign || '—'}
Rising: ${petA.risingSign || '—'}
Dominant element: ${petA.element || '—'}
Archetype: ${petA.archetype || '—'}
Soul type (owner-described): ${petA.soulType || '—'}
Superpower (owner-described): ${petA.superpower || '—'}
How they greet strangers: ${petA.strangerReaction || '—'}
Prologue snippet from their reading: ${petA.prologue || '—'}

═══ PET B ═══
Name: ${petB.petName}
Species: ${petB.species || 'unknown'}
Gender: ${petB.gender || 'unknown'}
Sun: ${petB.sunSign || '—'}
Moon: ${petB.moonSign || '—'}
Rising: ${petB.risingSign || '—'}
Dominant element: ${petB.element || '—'}
Archetype: ${petB.archetype || '—'}
Soul type (owner-described): ${petB.soulType || '—'}
Superpower (owner-described): ${petB.superpower || '—'}
How they greet strangers: ${petB.strangerReaction || '—'}
Prologue snippet from their reading: ${petB.prologue || '—'}

Return the JSON now.`;
}

// ─── Main ─────────────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function markFailed(reason: string) {
  console.error("[COMPAT-WORKER] Failing:", reason);
  await supabase
    .from("pet_compatibilities")
    .update({ status: "failed", error_message: reason.slice(0, 500) })
    .eq("id", compatibilityId);
}

function petFromRow(r: Record<string, unknown>): PetSnapshot {
  const report = (r.report_content ?? {}) as Record<string, unknown>;
  const chart = (report.chartPlacements ?? {}) as Record<string, { sign?: string }>;
  const archetype = report.archetype as { name?: string } | string | undefined;
  return {
    id: r.id as string,
    petName: r.pet_name as string,
    species: r.species as string | undefined,
    gender: r.gender as string | undefined,
    birthDate: r.birth_date as string | undefined,
    soulType: r.soul_type as string | undefined,
    superpower: r.superpower as string | undefined,
    strangerReaction: r.stranger_reaction as string | undefined,
    sunSign: chart.sun?.sign || (report.sunSign as string | undefined),
    moonSign: chart.moon?.sign || (report.moonSign as string | undefined),
    risingSign: chart.ascendant?.sign || (report.risingSign as string | undefined),
    element: (report.dominantElement as string | undefined) || (report.element as string | undefined),
    archetype: typeof archetype === "string" ? archetype : archetype?.name,
    prologue: typeof report.prologue === "string" ? (report.prologue as string) : undefined,
  };
}

async function main() {
  console.log("[COMPAT-WORKER] Starting for", compatibilityId);
  await supabase.from("pet_compatibilities").update({ status: "generating" }).eq("id", compatibilityId);

  const { data: rows, error } = await supabase
    .from("pet_reports")
    .select("id, pet_name, species, gender, birth_date, report_content, soul_type, superpower, stranger_reaction")
    .in("id", [petReportAId, petReportBId]);
  if (error || !rows || rows.length !== 2) {
    await markFailed(`Source reports not found: ${error?.message ?? "unknown"}`);
    return;
  }

  const petA = petFromRow(rows.find((r: Record<string, unknown>) => r.id === petReportAId)!);
  const petB = petFromRow(rows.find((r: Record<string, unknown>) => r.id === petReportBId)!);
  const systemPrompt = buildSystemPrompt(petA, petB);

  let reading: unknown;
  try {
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://littlesouls.app",
        "X-Title": "Little Souls Compatibility",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        max_tokens: 6000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Compose the cross-pet reading for ${petA.petName} and ${petB.petName}.` },
        ],
      }),
    });
    if (!resp.ok) {
      await markFailed(`OpenRouter HTTP ${resp.status}: ${await resp.text()}`);
      return;
    }
    const json = await resp.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) {
      await markFailed("OpenRouter returned empty content");
      return;
    }
    if (typeof content === "string") {
      // Some OpenRouter providers ignore response_format and wrap JSON in
      // a ```json … ``` fence. Strip any fence before parsing so the worker
      // survives that inconsistency.
      const cleaned = content
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "");
      try {
        reading = JSON.parse(cleaned);
      } catch (parseErr) {
        await markFailed(`JSON parse failed: ${(parseErr as Error).message}. First 200 chars: ${cleaned.slice(0, 200)}`);
        return;
      }
    } else {
      reading = content;
    }
  } catch (err) {
    await markFailed(`OpenRouter error: ${(err as Error).message}`);
    return;
  }

  const { error: writeError } = await supabase
    .from("pet_compatibilities")
    .update({ reading_content: reading, status: "ready", error_message: null })
    .eq("id", compatibilityId);
  if (writeError) {
    await markFailed(`DB write failed: ${writeError.message}`);
    return;
  }

  console.log("[COMPAT-WORKER] Completed", compatibilityId);
}

await main();
