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

const CLUSTER_LABEL: Record<string, string> = {
  A: "Pet Astrology",
  B: "Breed Personality",
  C: "Birthday",
  D: "Memorial",
  E: "Gifts",
  F: "Breed & Zodiac",
  G: "SoulSpeak",
};

const CTA_BY_CLUSTER: Record<string, { middle: string; end: string }> = {
  A: { middle: "/checkout", end: "/checkout" },
  B: { middle: "/checkout", end: "/checkout" },
  C: { middle: "/checkout", end: "/checkout" },
  D: { middle: "/soul-chat", end: "/checkout?intent=memorial" },
  E: { middle: "/gift-v2", end: "/gift-v2" },
  F: { middle: "/checkout", end: "/checkout" },
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
  "wordCount": ${targetWordCount}
}`;

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
        let blogData: any;
        try {
          const match = contentText.match(/```(?:json)?\s*([\s\S]*?)```/);
          blogData = JSON.parse((match ? match[1] : contentText).trim());
        } catch (err) {
          console.error(`Parse fail for "${topic.topic}":`, contentText.slice(0, 300));
          results.push({ topic: topic.topic, success: false, error: "JSON parse failed" });
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

        // Insert middle + end CTA at end of body (middle gets inlined after 2nd H2)
        const ctaEnd = `\n\n## Ready to read ${species === "cat" ? "their feline soul" : "your dog's soul"}?\n\n*Written by ${author.short_name}.* [Read your pet's cosmic chart →](${cta.end})\n`;
        let finalContent: string = blogData.content;
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
          hero_alt: blogData.heroAlt || blogData.title,
          target_query: targetKeyword,
          cta_middle_url: cta.middle,
          cta_end_url: cta.end,
          date_modified: nowIso,
          word_count: contentWords,
          sources: blogData.sources ?? [],
        };

        const { data: post, error: insertErr } = await supabase
          .from("blog_posts")
          .insert(insertRow)
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
