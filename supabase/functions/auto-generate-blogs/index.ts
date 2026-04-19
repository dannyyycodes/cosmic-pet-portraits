// Phase 3 blog generator — character-voiced, schema-rich, AEO-graded.
// Source of truth: /docs/phase2-post-template.md + /docs/phase2-character-bibles.md
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app"];

function cors(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

// Strip Windows-1252-as-UTF-8 mojibake (e.g. "â€"" in place of em-dash). LLMs
// occasionally regurgitate these sequences from training data; if they slip
// through, every reader sees garbage until the row is manually cleaned.
const MOJIBAKE_MAP: Array<[string, string]> = [
  ["\u00e2\u20ac\u201d", "\u2014"], // em-dash —
  ["\u00e2\u20ac\u201c", "\u2013"], // en-dash –
  ["\u00e2\u20ac\u2122", "\u2019"], // right single quote '
  ["\u00e2\u20ac\u02dc", "\u2018"], // left single quote '
  ["\u00e2\u20ac\u0153", "\u201c"], // left double quote "
  ["\u00e2\u20ac\u009d", "\u201d"], // right double quote "
  ["\u00e2\u20ac\u00a6", "\u2026"], // ellipsis …
  ["\u00e2\u20ac\u00a2", "\u2022"], // bullet •
  ["\u00c2\u00a0", "\u00a0"],       // non-breaking space
];
function scrubMojibake<T>(v: T): T {
  if (typeof v === "string") {
    let s = v;
    for (const [bad, good] of MOJIBAKE_MAP) s = s.split(bad).join(good);
    return s as unknown as T;
  }
  if (Array.isArray(v)) return v.map(scrubMojibake) as unknown as T;
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) out[k] = scrubMojibake(val);
    return out as unknown as T;
  }
  return v;
}

const CLUSTER_LABEL: Record<string, string> = {
  A: "Pet Astrology",
  B: "Breed Personality",
  C: "Birthday",
  D: "Memorial",
  E: "Gifts",
  F: "Breed & Zodiac",
  G: "SoulSpeak",
};

// CTA destinations — "/" is the new funnel homepage (emotional journey → pricing cards).
// Never link to /checkout (that's the legacy checkout.html, being retired).
const CTA_BY_CLUSTER: Record<string, { middle: string; end: string }> = {
  A: { middle: "/", end: "/" },
  B: { middle: "/", end: "/" },
  C: { middle: "/", end: "/" },
  D: { middle: "/soul-chat", end: "/?intent=memorial" },
  E: { middle: "/gift-v2", end: "/gift-v2" },
  F: { middle: "/", end: "/" },
  G: { middle: "/soul-chat", end: "/soul-chat" },
};

// Cluster word-count norms (from phase2-post-template §6)
const WORDCOUNT_NORMS: Record<string, [number, number]> = {
  A: [2000, 4000],
  B: [1200, 2200],
  C: [1500, 2500],
  D: [2000, 3000],
  E: [1200, 2000],
  F: [800, 1200],
  G: [1500, 2500],
};

const BANNED_PHRASES = [
  "we'll email you", "check your inbox", "powered by AI", "as an AI",
  "in conclusion", "delve into", "in today's world", "dive into",
  "this article will explore", "fur baby", "furbaby",
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors(req) });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openrouterKey = Deno.env.get("OPENROUTER_API_KEY");
    // Pexels API key — public-ish, rate-limited per-account. Fallback hardcoded so we
    // don't lose hero images if the secret isn't set. Env override still works.
    const pexelsKey = Deno.env.get("PEXELS_API_KEY") || "okUyRy6l876v4eV0vh42MAay9MRNrb3iPNBIoR7Qqii5MGaJv4oVNeWA";
    if (!openrouterKey) throw new Error("OPENROUTER_API_KEY not set");

    const supabase = createClient(supabaseUrl, supabaseKey);

    let postsToGenerate = 1;
    try {
      const body = await req.json();
      if (body?.count && Number.isInteger(body.count) && body.count > 0 && body.count <= 5) {
        postsToGenerate = body.count;
      }
    } catch { /* no body */ }

    // Pull next due topics — scheduled_for today or past due, earliest first.
    // Fallback to priority order if nothing is scheduled.
    const today = new Date().toISOString().slice(0, 10);
    let { data: topics } = await supabase
      .from("blog_topics")
      .select("*")
      .eq("is_used", false)
      .lte("scheduled_for", today)
      .order("scheduled_for", { ascending: true })
      .limit(postsToGenerate);

    if (!topics || topics.length === 0) {
      const fallback = await supabase
        .from("blog_topics")
        .select("*")
        .eq("is_used", false)
        .order("priority", { ascending: false })
        .limit(postsToGenerate);
      topics = fallback.data ?? [];
    }

    if (topics.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No topics remaining", postsGenerated: 0 }),
        { headers: { ...cors(req), "Content-Type": "application/json" } },
      );
    }

    const results: unknown[] = [];

    for (const topic of topics) {
      try {
        // Resolve author — topic.author_slug is authoritative; fallback by cluster
        let authorSlug = topic.author_slug as string | null;
        if (!authorSlug) {
          const { data: fallbackAuthor } = await supabase
            .from("authors")
            .select("slug")
            .contains("primary_clusters", [topic.cluster ?? "A"])
            .limit(1)
            .maybeSingle();
          authorSlug = fallbackAuthor?.slug ?? "river-callahan";
        }

        const { data: author } = await supabase
          .from("authors")
          .select("*")
          .eq("slug", authorSlug)
          .single();
        if (!author) {
          results.push({ topic: topic.topic, success: false, error: `Author ${authorSlug} not found` });
          continue;
        }

        const cluster = (topic.cluster ?? "A") as string;
        const clusterLabel = CLUSTER_LABEL[cluster] ?? "Pet Astrology";
        const cta = CTA_BY_CLUSTER[cluster] ?? CTA_BY_CLUSTER.A;
        const [minWords, maxWords] = WORDCOUNT_NORMS[cluster] ?? WORDCOUNT_NORMS.A;
        const species = topic.species as string;
        const targetKeyword = topic.target_keyword || topic.topic;
        const workingTitle = topic.working_title || topic.topic;
        const targetWordCount = Math.round((minWords + maxWords) / 2);

        const systemPrompt = `You are ${author.name}, writing for Little Souls — a cosmic pet astrology service. Voice brief: ${author.voice_profile}

Phrases you use: ${(author.voice_dos ?? []).join(" · ")}
Phrases you never use: ${(author.voice_donts ?? []).join(" · ")}

Writing rules for EVERY post:
1. First 80 words directly answer the searcher's query. Not a setup — the answer.
2. Use 4–6 H2 sections (## in markdown). No H1 (title is rendered separately).
3. Include ONE inline citation — a markdown link to a real authoritative source (AVMA, AKC, ASPCA, VCA Hospitals, Cornell Feline Health Center, Almanac, a peer-reviewed paper, etc). Not a placeholder; use a real reputable URL.
4. Sprinkle 3–5 short internal links using markdown — \`[anchor text](/blog/related-slug-guess)\`. Anchor text must be natural phrasing.
5. Never use banned phrases: ${BANNED_PHRASES.join(", ")}.
6. Never say "email delivery", "check your inbox", "PDF", or reference AI — Little Souls is a cinematic reveal experience.
7. Memorial cluster (D): no exclamation points, no emojis, reverent register.
8. Use your personal anecdotes and vocabulary — write as yourself, not generic.
9. End each post with a ## Sources section listing your citation(s).
10. NEVER link to /checkout or /checkout.html anywhere — the conversion funnel lives at /. If you want to send the reader to the reading, link to / (the homepage).

Output STRICT JSON matching the schema below. No markdown code fences. No commentary. Just the JSON object.`;

        const userPrompt = `Write the post now.

Working title: "${workingTitle}"
Target keyword: "${targetKeyword}"
Cluster: ${cluster} (${clusterLabel})
Species: ${species}
Target length: ~${targetWordCount} words (hard min ${minWords}, max ${maxWords})
Middle CTA target: ${cta.middle}
End CTA target: ${cta.end}

Return JSON with this exact shape:
{
  "title": "SEO title 50–65 chars, keyword-first if natural",
  "slug": "url-friendly-slug-under-70-chars",
  "metaDescription": "150–160 char meta description",
  "tldr": "40–80 word answer-first box. First sentence IS the direct answer to the query.",
  "heroAlt": "20–140 char descriptive alt including keyword",
  "excerpt": "2–3 sentence blog-listing preview",
  "content": "Full markdown body: 4–6 ## H2 sections, inline links, ONE inline citation, ## Sources at end. NO H1. NO title. Start with the first body paragraph.",
  "faq": [
    {"question": "Real searcher question 1?", "answer": "Plain-text answer, 40–80 words, no markdown."},
    {"question": "Question 2?", "answer": "..."},
    {"question": "Question 3?", "answer": "..."}
  ],
  "anchorVariants": ["2–6 word anchor phrase variant 1", "variant 2", "variant 3", "variant 4", "variant 5"],
  "secondaryKeywords": ["related keyword 1", "kw 2", "kw 3", "kw 4"],
  "sources": [
    {"title": "Source title", "url": "https://real-authority.org/page", "publisher": "Source publisher"}
  ],
  "readingTimeMinutes": 6,
  "wordCount": ${targetWordCount},
  "heroImage": {
    "pexelsQuery": "2–4 word Pexels search query picking an image that literally and emotionally matches the post (examples: 'golden retriever sunset', 'black cat windowsill', 'senior dog sleeping', 'puppy muddy paws'). Prefer concrete subject matter over abstract concepts. No cosmic/galaxy/constellation — those return generic stock.",
    "alt": "20–140 char descriptive alt text including the target keyword naturally. Describe what's IN the image, not what it represents."
  },
  "inlineImages": [
    {
      "afterHeading": "EXACT H2 text to place this image after (match the ## heading text verbatim, no ## prefix). Pick a middle section, not the first or the Sources section.",
      "pexelsQuery": "2–4 word Pexels query for THIS section's actual subject matter. If the section is about a specific breed/behaviour/age, query that — not the whole post topic. Examples: 'puppy sleeping', 'dog park running', 'cat stretching morning', 'senior labrador grey muzzle'. No cosmic/galaxy/constellation.",
      "alt": "20–140 char alt describing what's in the image."
    },
    {
      "afterHeading": "Different H2 than the first. Space the images across the body.",
      "pexelsQuery": "Different subject than image #1 — reflect this section specifically.",
      "alt": "..."
    }
  ]
}

Inline image rules:
- Exactly 2 inline images (plus 1 hero) — don't over-illustrate.
- afterHeading MUST match one of your H2 lines exactly (text only, no "##").
- Never pick the first H2 (image would fight the TL;DR) or the "Sources" or "Ready to..." H2.
- Space them: if you have 5 H2s named [Intro, Foo, Bar, Baz, Sources], place image 1 after "Foo" and image 2 after "Baz" (or similar).
- Each query should reflect that section's specific content, not the overall topic.`;

        const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openrouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://littlesouls.app",
            "X-Title": "Little Souls Blog Engine",
          },
          body: JSON.stringify({
            model: "anthropic/claude-sonnet-4-5",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.75,
            max_tokens: 8000,
            response_format: { type: "json_object" },
          }),
        });

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          console.error(`OpenRouter error for "${topic.topic}":`, aiResponse.status, errText.slice(0, 500));
          results.push({ topic: topic.topic, success: false, error: `OpenRouter ${aiResponse.status}` });
          // Infra failures — don't burn the calendar slot. Skip the mark-used step.
          if (aiResponse.status === 429 || aiResponse.status === 402 || aiResponse.status >= 500) {
            break;
          }
          continue;
        }

        const aiJson = await aiResponse.json();
        const contentText: string = aiJson.choices?.[0]?.message?.content ?? "";
        let blogData: any = null;
        // 1) Try the raw content as JSON.
        // 2) Try extracting from a fenced code block.
        // 3) Try finding the outermost { ... } substring.
        const candidates: string[] = [contentText.trim()];
        const fence = contentText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (fence) candidates.push(fence[1].trim());
        const first = contentText.indexOf("{");
        const last = contentText.lastIndexOf("}");
        if (first >= 0 && last > first) candidates.push(contentText.slice(first, last + 1).trim());
        for (const c of candidates) {
          try {
            blogData = JSON.parse(c);
            break;
          } catch (_e) { /* try next */ }
        }
        if (!blogData) {
          console.error(`Parse fail for "${topic.topic}". First 400 chars of response:`, contentText.slice(0, 400));
          results.push({ topic: topic.topic, success: false, error: "JSON parse failed (retryable)" });
          // Don't mark topic used — infra-style failure
          continue;
        }

        if (!blogData.title || !blogData.slug || !blogData.content || !blogData.tldr) {
          results.push({ topic: topic.topic, success: false, error: "Missing required fields" });
          continue;
        }

        // Quality gates — fail-soft: log but still insert so Danny can see drift.
        const tldrWords = (blogData.tldr || "").trim().split(/\s+/).length;
        const contentWords = (blogData.content || "").trim().split(/\s+/).length;
        const gates = {
          tldr_in_range: tldrWords >= 35 && tldrWords <= 100,
          faq_count: Array.isArray(blogData.faq) && blogData.faq.length >= 3 && blogData.faq.length <= 6,
          wordcount: contentWords >= Math.round(minWords * 0.7),
          no_banned: !BANNED_PHRASES.some((p) => (blogData.content as string).toLowerCase().includes(p)),
          has_h2: /^##\s+/m.test(blogData.content),
          has_citation: /\]\(https?:\/\//.test(blogData.content),
        };
        const failures = Object.entries(gates).filter(([, v]) => !v).map(([k]) => k);
        if (failures.length) console.warn(`Gates failed for "${topic.topic}":`, failures);

        // Fetch a Pexels hero image using the query Claude picked.
        // Fall back: species-only query, then empty (blog still ships).
        let heroImageUrl: string | null = null;
        let heroImageAlt: string = blogData.heroImage?.alt || blogData.heroAlt || blogData.title;
        if (pexelsKey) {
          const queries = [
            blogData.heroImage?.pexelsQuery,
            `${species} ${targetKeyword.split(" ").slice(-2).join(" ")}`,
            species,
          ].filter(Boolean) as string[];
          for (const q of queries) {
            try {
              const pexRes = await fetch(
                `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&orientation=landscape&per_page=5&size=large`,
                { headers: { Authorization: pexelsKey } },
              );
              if (!pexRes.ok) continue;
              const pexJson = await pexRes.json();
              const photo = (pexJson.photos ?? [])[0];
              if (photo?.src?.large2x || photo?.src?.large) {
                heroImageUrl = photo.src.large2x || photo.src.large;
                if (photo.alt && photo.alt.length > 20) heroImageAlt = photo.alt;
                console.log(`Pexels hit for "${topic.topic}": query="${q}" -> ${heroImageUrl}`);
                break;
              }
            } catch (err) {
              console.warn(`Pexels error for query "${q}":`, err);
            }
          }
          if (!heroImageUrl) console.warn(`Pexels: no image for "${topic.topic}" across all queries`);
        } else {
          console.warn("PEXELS_API_KEY not set — skipping hero image");
        }

        // --- Inline section images (2 per post) ---
        async function fetchPexels(query: string): Promise<{ url: string; alt: string } | null> {
          try {
            const r = await fetch(
              `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=landscape&per_page=5&size=large`,
              { headers: { Authorization: pexelsKey } },
            );
            if (!r.ok) return null;
            const j = await r.json();
            const photo = (j.photos ?? [])[0];
            if (!photo) return null;
            const url = photo.src?.large2x || photo.src?.large;
            if (!url) return null;
            return { url, alt: photo.alt && photo.alt.length > 20 ? photo.alt : query };
          } catch {
            return null;
          }
        }

        let bodyWithImages: string = blogData.content;
        if (pexelsKey && Array.isArray(blogData.inlineImages)) {
          // Avoid duplicating the hero photo inside the body
          const usedUrls = new Set<string>([heroImageUrl ?? ""]);
          for (const img of (blogData.inlineImages as Array<{ afterHeading?: string; pexelsQuery?: string; alt?: string }>).slice(0, 2)) {
            if (!img?.pexelsQuery || !img?.afterHeading) continue;
            // Skip forbidden sections
            if (/^(sources|ready to|ready to read|faq|frequently)/i.test(img.afterHeading.trim())) continue;
            // Find the heading line in body
            const escaped = img.afterHeading.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const headingRe = new RegExp(`(^##\\s+${escaped}\\s*$)`, "m");
            const match = headingRe.exec(bodyWithImages);
            if (!match) {
              console.warn(`Inline image heading not found: "${img.afterHeading}" — skipping`);
              continue;
            }
            // Fetch: use Claude's query, fall back to that query + species
            const queries = [img.pexelsQuery, `${species} ${img.pexelsQuery}`, img.pexelsQuery.split(" ")[0]];
            let pick: { url: string; alt: string } | null = null;
            for (const q of queries) {
              const tried = await fetchPexels(q);
              if (tried && !usedUrls.has(tried.url)) { pick = tried; break; }
            }
            if (!pick) {
              console.warn(`Inline image: no Pexels result for "${img.pexelsQuery}"`);
              continue;
            }
            usedUrls.add(pick.url);
            const alt = (img.alt && img.alt.length > 10) ? img.alt : pick.alt;
            const insertion = `\n\n![${alt.replace(/[\[\]]/g, "")}](${pick.url})\n`;
            const idx = match.index + match[0].length;
            bodyWithImages = bodyWithImages.slice(0, idx) + insertion + bodyWithImages.slice(idx);
            console.log(`Inline image inserted after "${img.afterHeading}" -> ${pick.url}`);
          }
        }

        // Insert middle + end CTA at end of body (middle gets inlined after 2nd H2)
        const ctaEnd = `\n\n## Ready to read ${species === "cat" ? "their feline soul" : "your dog's soul"}?\n\n*Written by ${author.short_name}.* [Read your pet's cosmic chart →](${cta.end})\n`;
        let finalContent: string = bodyWithImages;
        if (!finalContent.includes("](" + cta.end) && !finalContent.includes("](" + cta.middle)) {
          // Inject middle CTA after the 2nd H2 (approx 40% scroll)
          const h2Positions: number[] = [];
          const re = /^##\s+/gm;
          let m: RegExpExecArray | null;
          while ((m = re.exec(finalContent)) !== null) h2Positions.push(m.index);
          const injectAt = h2Positions[2] ?? h2Positions[1] ?? -1;
          if (injectAt > 0) {
            const middleCta = `\n\n> **See the stars read aloud for the one you love most.**\n>\n> [Read their full chart →](${cta.middle})\n\n`;
            finalContent = finalContent.slice(0, injectAt) + middleCta + finalContent.slice(injectAt);
          }
        }
        if (!finalContent.includes("Ready to read")) finalContent += ctaEnd;

        const nowIso = new Date().toISOString();

        const insertRow = {
          slug: String(blogData.slug).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").slice(0, 70),
          title: blogData.title,
          meta_description: blogData.metaDescription || `${blogData.title} — from Little Souls.`,
          content: finalContent,
          excerpt: blogData.excerpt || blogData.tldr.slice(0, 220),
          target_keyword: targetKeyword,
          secondary_keywords: blogData.secondaryKeywords || [],
          species,
          category: clusterLabel.toLowerCase().replace(/\s+/g, "-"),
          reading_time_minutes: blogData.readingTimeMinutes || Math.max(3, Math.round(contentWords / 200)),
          is_published: true,
          published_at: nowIso,
          author_slug: author.slug,
          cluster,
          is_pillar: !!topic.is_pillar,
          tags: topic.tags ?? [],
          anchor_variants: blogData.anchorVariants ?? [],
          tldr: blogData.tldr,
          faq: blogData.faq ?? [],
          hero_alt: heroImageAlt,
          featured_image_url: heroImageUrl,
          target_query: targetKeyword,
          cta_middle_url: cta.middle,
          cta_end_url: cta.end,
          date_modified: nowIso,
          word_count: contentWords,
          sources: blogData.sources ?? [],
        };

        const { data: post, error: insertErr } = await supabase
          .from("blog_posts")
          .insert(scrubMojibake(insertRow))
          .select()
          .single();

        if (insertErr) {
          if (insertErr.code === "23505") {
            console.log(`Duplicate slug for "${topic.topic}" — marking as used`);
            await supabase.from("blog_topics").update({ is_used: true, used_at: nowIso }).eq("id", topic.id);
          } else {
            console.error(`DB error:`, insertErr);
          }
          results.push({ topic: topic.topic, success: false, error: insertErr.message });
        } else {
          // Only mark topic used when the post is actually in the DB
          await supabase.from("blog_topics").update({ is_used: true, used_at: nowIso }).eq("id", topic.id);
          results.push({ topic: topic.topic, success: true, slug: post.slug, author: author.slug, gate_failures: failures });
        }

        await new Promise((r) => setTimeout(r, 2000));
      } catch (err) {
        console.error(`Topic error "${topic.topic}":`, err);
        results.push({ topic: topic.topic, success: false, error: String(err) });
      }
    }

    const successCount = (results as any[]).filter((r) => r.success).length;
    return new Response(
      JSON.stringify({ success: true, postsGenerated: successCount, totalProcessed: results.length, results }),
      { headers: { ...cors(req), "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("auto-generate-blogs fatal:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Failed to generate blogs" }),
      { status: 500, headers: { ...cors(req), "Content-Type": "application/json" } },
    );
  }
});
