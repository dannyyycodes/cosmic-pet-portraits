# Little Souls — Phase 2 Master Post Template

**Status:** Locked 2026-04-14. Every post the blog engine produces uses this structure, schema, CTA patterns, design specs, and quality gates.

---

## 1. Post structure (top to bottom)

Dynamic fields use `{{mustache}}` syntax. Engineer templates via Handlebars/Mustache or equivalent.

1. **Breadcrumb** — `Home > Blog > [Cluster] > [Post]`, semantic `<nav>` with BreadcrumbList schema
2. **Badge row** — category + 2-5 tags (sign/breed/species), pill buttons `bg-[#c4a265]/15 text-[#8a6a2e]`
3. **H1 title** — under 65 chars, `font-['DM_Serif_Display'] text-4xl md:text-5xl text-[#3d2f2a]`
4. **Hero image** — 1200×630, `loading="eager" fetchpriority="high"`, rounded on desktop, full-bleed on mobile. Hero is NOT lazy — the first body image after intro IS lazy.
5. **Byline strip** — author avatar + name link + `jobTitle` + published + updated + reading time. Bordered top/bottom, `border-[#e8ddd0]`.
6. **TL;DR box** — 40-80 word answer-first box. Gold gradient `from-[#fdf7e8] to-[#faf0d8]`, left border `border-[#c4a265]`, "Quick Answer" label in uppercase. **AEO-critical — AI engines extract this first.**
7. **Table of contents** — auto from H2s. Mobile = `<details>` summary. Desktop = sticky right rail with scroll-spy.
8. **Intro paragraph** — first 80 words MUST directly answer the query. Cosine similarity ≥0.55 against target keyword.
9. **Body sections** — H2 blocks, inline images (first lazy), pull-quotes with character photo on strong claims.
10. **Author bio card (inline)** — injected after H2 #2. Photo 80×80 circle with gold ring, name + tagline + short bio + "More from {firstName} →" link.
11. **Middle CTA** — at ~40% scroll. Gold gradient card (rose variant for memorial). Headline ≤10 words, subline ≤22 words, button ≤4 words. Cluster-aware URL.
12. **Body continuation** — remaining H2s.
13. **FAQ block** — 3-6 Q&A, always-expanded (NOT accordion — AEO crawlers weight visible text higher). Source of FAQPage schema.
14. **Related in series** — hub-and-spoke links. 3-card grid on desktop. Min 3 links.
15. **Sources** — `<details>` collapsed by default but crawlable. `rel="nofollow"` on all citations.
16. **End CTA** — dark reverse card `bg-[#3d2f2a] text-[#FFFDF5]`. Stronger offer than middle.
17. **Social share rail** — sticky left rail on desktop, hidden on mobile.
18. **Email capture strip** — below end-CTA. Hidden on cluster D (memorial — tonally wrong).
19. **Footer author card** — full author card with credentials chip + sameAs icons + link to /author/{slug}. Reinforces E-E-A-T.

**Visibility rules:**
- Social share (§17): desktop only (<1024px hide)
- Sticky TOC rail: desktop only
- Author bio card (§10): skip for cluster F programmatic — replace with 1-sentence "Written by" line
- Sources (§15): required for A/C/D, optional for B/E/G, mandatory for any health/medical claim (Elena posts)
- Email capture (§18): hidden on cluster D — replace with quiet link to `/memorial-guide`

---

## 2. JSON-LD @graph (locked template)

Injected as a single `<script type="application/ld+json">` in `<head>`.

```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": "https://littlesouls.app/#organization" },
    { "@type": "WebSite", "@id": "https://littlesouls.app/#website" },
    {
      "@type": "WebPage",
      "@id": "https://littlesouls.app/blog/{{post.slug}}/#webpage",
      "url": "https://littlesouls.app/blog/{{post.slug}}",
      "name": "{{post.title}}",
      "isPartOf": { "@id": "https://littlesouls.app/#website" },
      "about": { "@id": "https://littlesouls.app/#service" },
      "primaryImageOfPage": { "@id": "https://littlesouls.app/blog/{{post.slug}}/#hero" },
      "datePublished": "{{post.datePublished|iso8601}}",
      "dateModified": "{{post.dateModified|iso8601}}",
      "description": "{{post.metaDescription}}",
      "breadcrumb": { "@id": "https://littlesouls.app/blog/{{post.slug}}/#breadcrumb" },
      "inLanguage": "en-US"
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://littlesouls.app/blog/{{post.slug}}/#breadcrumb",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://littlesouls.app/" },
        { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://littlesouls.app/blog" },
        { "@type": "ListItem", "position": 3, "name": "{{cluster.label}}", "item": "https://littlesouls.app/blog/category/{{cluster.slug}}" },
        { "@type": "ListItem", "position": 4, "name": "{{post.title_short}}" }
      ]
    },
    {
      "@type": "Article",
      "@id": "https://littlesouls.app/blog/{{post.slug}}/#article",
      "isPartOf": { "@id": "https://littlesouls.app/blog/{{post.slug}}/#webpage" },
      "mainEntityOfPage": { "@id": "https://littlesouls.app/blog/{{post.slug}}/#webpage" },
      "headline": "{{post.title}}",
      "description": "{{post.metaDescription}}",
      "image": { "@id": "https://littlesouls.app/blog/{{post.slug}}/#hero" },
      "datePublished": "{{post.datePublished|iso8601}}",
      "dateModified": "{{post.dateModified|iso8601}}",
      "author": { "@id": "https://littlesouls.app/author/{{author.slug}}#person" },
      "publisher": { "@id": "https://littlesouls.app/#organization" },
      "articleSection": "{{cluster.label}}",
      "keywords": "{{post.tags|join}}",
      "wordCount": {{post.wordCount}},
      "inLanguage": "en-US",
      "citation": [ {{#each post.sources}} {"@type": "CreativeWork", "name": "{{title}}", "url": "{{url}}", "publisher": "{{publisher}}"}{{#unless @last}},{{/unless}} {{/each}} ]
    },
    { "@type": "Person", "@id": "https://littlesouls.app/author/{{author.slug}}#person" },
    {
      "@type": "ImageObject",
      "@id": "https://littlesouls.app/blog/{{post.slug}}/#hero",
      "url": "{{post.hero.url}}",
      "contentUrl": "{{post.hero.url}}",
      "width": 1200, "height": 630,
      "caption": "{{post.hero.alt}}",
      "creditText": "Little Souls"
    },
    {
      "@type": "FAQPage",
      "@id": "https://littlesouls.app/blog/{{post.slug}}/#faq",
      "mainEntity": [ {{#each post.faqs}} {"@type": "Question", "name": "{{question}}", "acceptedAnswer": {"@type": "Answer", "text": "{{answer|plaintext}}"}}{{#unless @last}},{{/unless}} {{/each}} ]
    }
  ]
}
```

Organization/WebSite/Service are defined site-wide on homepage — blog posts reference `@id` only.

---

## 3. CTA patterns (by cluster)

### Link targets
- Default: `/checkout`
- Cluster E (gifts): `/gift-v2`
- Cluster G (SoulSpeak): `/soul-chat` (demo)
- Cluster D (memorial): `/checkout?intent=memorial`

### Copy constraints
Headline ≤10 words · subline ≤22 words · button ≤4 words · never "email", "inbox", "AI", "delivered via email".

### Middle CTA patterns by cluster

**Pet astrology (A/B/C/F):**
1. `Your {{sign}} pup deserves more than a horoscope` / `Get their full birth chart read aloud — the moment you check out, the stars speak.` / `See {{petName}}'s chart →`
2. `We've named the pattern. Want the full story?` / `A cosmic reading goes deeper than sun sign — rising, moon, and the quiet houses too.` / `Read my pet's chart`

**Memorial (D):**
1. `Something to hold, when the house is quiet` / `A cosmic reading of who they were — the shape of their soul, written in stars.` / `Honor their chart →`
2. `Grief moves. The stars stay.` / `A keepsake reading for the one who left paw-prints on your chart.` / `Create their memorial`

**Gift (E):**
1. `Wrapping paper runs out. A soul reading doesn't.` / `Give the pet parent in your life something the group chat will screenshot for months.` / `Send the gift →`
2. `The "you shouldn't have" gift — except they'll mean it.` / `A cosmic reading of their pet, revealed the moment they open it.` / `Gift a reading`

**SoulSpeak (G):**
1. `Wonder what {{petName}} would say back?` / `Try a free SoulSpeak exchange — their voice, their perspective, ten seconds.` / `Hear them speak →`
2. `If they could text you, what would they say?` / `SoulSpeak turns their chart into a voice. Try one message free.` / `Start a chat`

### End CTA patterns (stronger offer)

**Pet astrology:**
1. `Give them a reading that sounds like a love letter` / `$27. Cinematic reveal. The stars read aloud for the one you love most.` / `Read my pet's chart →`

**Memorial:**
1. `Somewhere to put the love that has nowhere to go` / `A cosmic reading becomes a keepsake — something to return to, on the hard days.` / `Honor their chart →`

**Gift:**
1. `The gift that makes them cry at the coffee table` / `A cosmic reading for their pet — revealed the moment they click open. $27.` / `Send a reading →`

**SoulSpeak:**
1. `Now hear what {{petName}} would say back` / `SoulSpeak uses their chart to write in their voice. Start a conversation, free.` / `Talk to them →`

---

## 4. Design specs (Tailwind level)

**TL;DR box:** `bg-gradient-to-br from-[#fdf7e8] to-[#faf0d8]` · `border-l-4 border-[#c4a265]` · `rounded-2xl p-6 shadow-sm` · star icon in `#c4a265` · label `text-xs uppercase tracking-widest text-[#8a6a2e]`

**Author bio card (inline):** `bg-white border border-[#e8ddd0] rounded-2xl p-6` · 80×80 circle avatar with `ring-2 ring-[#c4a265]/30` · name in DM Serif Display text-xl · bio in text-sm

**Middle CTA:** `bg-gradient-to-br from-[#c4a265] to-[#b8973e] text-white rounded-2xl p-8` · button `bg-white text-[#8a6a2e]` pill · MEMORIAL OVERRIDE: `bg-[#3d2f2a]/95 text-[#FFFDF5]` with rose `#bf524a` button (no gold gradient — too celebratory)

**End CTA:** `bg-[#3d2f2a] text-[#FFFDF5] rounded-3xl p-10 text-center` · button `bg-[#c4a265] text-[#3d2f2a]` pill

**FAQ block:** always-expanded (NOT accordion) · each Q card `bg-white border border-[#e8ddd0] rounded-xl p-5` · H2 heading so it appears in TOC

**Related block:** 3-card grid (`md:grid-cols-3`) · card `bg-white border border-[#e8ddd0] rounded-xl p-4 hover:border-[#c4a265]` · thumb 16:9 rounded-lg

**Sources:** `<details>` collapsed (content stays in DOM for crawlers) · `text-sm text-[#6b5a52]` ordered list · `rel="nofollow"` on citations

---

## 5. Voice rules per cluster

**A — Pet Astrology Core:** warm authority, mystical but grounded, long-form. Owner: River. Co-author: Elena on health-adjacent pieces.

**B — Breed × Personality:** observational, affectionate, breed-specific. Owner: Callum (dogs) or Maggie (cats), never mixed.

**C — Birthday-Specific (sun-sign):** playful, trait-list-friendly, mid-length. Owner: River. Each cross-links to Pillar A.

**D — Memorial:** quiet, slow, reverent. No exclamation points. No emojis in body. Owner: Rowan only.

**E — Gifts:** cheerful, gift-giver perspective, practical specifics. Owner: Callum or Maggie (species-matched). Cross-sign with Rowan for memorial gifts.

**F — "Is my [breed] a [sign]" programmatic:** tight, scannable, answer-first. No personal stories (breaks programmatic trust). Owner: Callum or Maggie, byline only.

**G — SoulSpeak:** curious, tender, first-person-of-the-pet when quoting. Frame as chart-to-voice interpretation, not literal talking. Owner: River. Co-sign with Maggie or Callum.

---

## 6. AEO quality gates (automated pre-publish boolean checks)

```ts
checks = {
  tldr_present:              post.tldr !== null,
  tldr_wordcount_valid:      wordCount(post.tldr) >= 40 && wordCount(post.tldr) <= 80,
  tldr_answers_query:        cosineSimilarity(post.tldr, post.targetQuery) >= 0.55,
  intro_first80_answers:     cosineSimilarity(firstNWords(post.intro, 80), post.targetQuery) >= 0.55,
  h2_count_in_range:         post.h2s.length >= 3 && post.h2s.length <= 7,
  internal_links_min3:       countInternalLinks(post.body) >= 3,
  internal_link_to_pillar:   post.body.includes(`/blog/${cluster.pillarSlug}`),
  internal_link_to_sibling:  hasLinkToSameCluster(post.body, cluster.slug),
  faq_count_in_range:        post.faqs.length >= 3 && post.faqs.length <= 6,
  faq_questions_realintent:  post.faqs.every(f => matchesRealSearchQuery(f.question)),
  inline_citation_min1:      countInlineCitations(post.body) >= 1,
  author_is_named:           post.author && post.author.name && post.author.slug,
  person_schema_present:     schema.some(n => n['@type']==='Person' && n.sameAs?.length > 0),
  article_schema_present:    schema.some(n => n['@type']==='Article'),
  datepublished_iso:         isValidIso8601(post.datePublished),
  datemodified_iso:          isValidIso8601(post.dateModified),
  datemodified_gte_published: new Date(post.dateModified) >= new Date(post.datePublished),
  breadcrumb_schema_present: schema.some(n => n['@type']==='BreadcrumbList' && n.itemListElement.length >= 3),
  faqpage_schema_present:    schema.some(n => n['@type']==='FAQPage' && n.mainEntity.length >= 3),
  hero_alt_descriptive:      post.hero.alt.length >= 20 && post.hero.alt.length <= 140 && !isAutoGenerated(post.hero.alt),
  hero_dimensions_valid:     post.hero.width === 1200 && post.hero.height === 630,
  wordcount_in_cluster_norm: wordCountInRange(post.wordCount, cluster.slug),
     // A-pillar: 3000-4000, C-per-sign: 1500-2500, B-breed×sign: 800-1200,
     // D-memorial: 2000-3000, G-SoulSpeak: 1500-2500, E-gift: 1200-2000, F-programmatic: 600-1000
  ai_slop_score_under_15:    aiSlopDetector(post.body) < 0.15,
  gptzero_human_over_75:     gptZero(post.body).humanProbability > 0.75,
  no_banned_phrases:         !containsAny(post.body, [
                               "we'll email you", "check your inbox", "powered by AI",
                               "as an AI", "in conclusion", "delve into", "in today's world"
                             ]),
  cta_urls_valid:            [post.cta.middle.url, post.cta.end.url].every(isAllowedCtaTarget),
  cluster_author_match:      clusterAuthorValid(cluster.slug, post.author.slug)
}
```

Pipeline fails closed — any `false` blocks publish and returns to review queue with failing key(s).
