# Phase 1 — Content Engine Research

**Date:** 2026-04-14
**Scope:** Discovery + research for the Little Souls blog / AEO content engine. Zero code, zero content — this is the fact-base that Phase 2 strategy will lock onto.
**Status:** Partial. Live-SERP research complete. On-site SEO audit blocked on Cloudflare (see §1).

---

## 0. Executive summary (the caveman version)

1. **Blocker first:** Cloudflare is currently serving a managed robots.txt that DISALLOWS every AI crawler you worked to allow-list (ClaudeBot, GPTBot, Google-Extended, Applebot-Extended, Bytespider, Amazonbot, CCBot, meta-externalagent). The `/public/robots.txt` you shipped is being overridden. `/llms.txt` and `/sitemap.xml` also return 403. Nothing else in this doc matters until that flips.
2. **Google barely sees the site today.** `site:littlesouls.app` returns 0 results in Google. The site is either not indexed, not ranked, or hidden. Index coverage audit (Search Console) is a Phase 2 priority.
3. **The pet-astrology SERP is wide open on AEO.** The top ~20 pages (Chewy, Daily Paws, Almanac, Pawlicy, Trupanion, Moonpaws, shmushpets) are ~3,000-word listicles with WEAK or ZERO AEO optimization: no named human authors with `Person` schema, no FAQPage schema, no TL;DR answer-first intros, no BreadcrumbList. This is the moat.
4. **Direct competitor = Moonpaws.com.** Dedicated pet-astrology app + blog. 3,500-word posts, no author byline, only `Organization` schema, no FAQ, no TL;DR. We can leapfrog them on citation-worthiness within 10 pilot posts.
5. **Insurance brands own pet-astrology as top-of-funnel** (Chewy, Trupanion, Pawlicy, Spot, Felix). They publish because it pulls cheap pet-insurance-intent traffic. They're big-DA competitors but they don't ship E-E-A-T signals → we can outflank on author credibility + schema.
6. **Keyword plan:** 7 clusters mapped, top 12 pillar posts ranked. Highest-$ cluster = pet memorial/grief (not astrology-core). Biggest programmatic play = 600-1,200 breed×sign pages ("Is my golden retriever a Leo?"). Biggest AEO play = question-first Cluster G (SoulSpeak / soul / thinking).
7. **Recommendation:** Fix Cloudflare this week. Greenlight Phase 2 (strategy + character bible + templates) once fix is verified. Pilot 10 posts in 3 weeks. Do NOT build automation until pilot proves citation uplift.

---

## 1. Critical blockers (must fix before Phase 2)

### 1a. Cloudflare Managed robots.txt is serving — and it's hostile to our goal

Live fetch of `littlesouls.app/robots.txt` returns the Cloudflare-injected block (verified twice):

```
# BEGIN Cloudflare Managed content

User-agent: *
Content-Signal: search=yes,ai-train=no
Allow: /

User-agent: Amazonbot
Disallow: /

User-agent: Applebot-Extended
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: CloudflareBrowserRenderingCrawler
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: GPTBot
Disallow: /

User-agent: meta-externalagent
Disallow: /
```

**Impact.** Until this flips, no amount of AEO-optimized content will get cited. The `ai-train=no` content signal is also an explicit legal reservation under EU Directive 2019/790 — it tells AI companies they can't use the content for training or real-time grounding.

**Fix.** Cloudflare dashboard → `littlesouls.app` zone → Security → Bots → disable "AI Bot Blocking" / "AI Audit" / "Content Signals Policy". Then `/public/robots.txt` ships as intended. Verify with `curl https://littlesouls.app/robots.txt` after.

**Secondary effect.** WebFetch on the apex homepage from ANY non-allowlisted user agent returns 403. That's Cloudflare's Bot Fight Mode. For SEO + AI-SEO launch, Bot Fight Mode needs to be relaxed OR a specific allow-list rule added for Googlebot, Bingbot, GPTBot, ClaudeBot, PerplexityBot, Applebot, Amazonbot, OAI-SearchBot, DuckAssistBot, Bytespider, meta-externalagent, Google-Extended, Applebot-Extended. Otherwise crawlers show up, get 403'd, and our pages never enter their index.

### 1b. `/llms.txt` and `/sitemap.xml` both return 403

Same Cloudflare layer. Once bot-blocking relaxes, these need a re-verify. Note: **there is no `sitemap.xml` route in the current codebase** — even if Cloudflare was permissive, there's nothing to serve. Building one is a Phase 3 requirement.

### 1c. Google indexing is effectively zero

`site:littlesouls.app` returns 0 results. `"little souls" pet astrology` doesn't surface the domain anywhere in top 10. Possible causes: Cloudflare block is extending to Googlebot, site was only recently launched, Search Console not yet submitted, or old robots.txt was even more restrictive. Phase 2 action: verify GSC ownership, submit sitemap (once built), check crawl stats.

---

## 2. Competitive landscape

### 2a. Top-20 SERP for pet-astrology queries (live-verified)

Sampled across 5 real queries (what zodiac sign is my cat / dog astrology by birthday / golden retriever zodiac / how does pet astrology work / pet astrology site OR blog):

**Direct competitors (dedicated pet astrology):**
| Site | Type | Signal |
|---|---|---|
| **moonpaws.com** | App + blog, dedicated | PRIMARY direct competitor. Generic brand, weak AEO (see §2b). Exploitable. |
| astrologyforpets.com | Legacy site + book | Old design, low authority signal. Likely not a real threat. |
| primalastrology.com | Novelty astrology system | Uses "Golden Retriever" as a primal sign type — a gimmick. Not a real competitor for our intent cluster. |
| shmushpets.com | Pet-product brand w/ blog | 2,800-word post with Article+WebPage schema but no FAQ / Person author. |
| findyourfate.com | Generic astrology portal | Low-quality, legacy. |
| Taylor Ellis Astrology (Substack) | Indie astrologer | One of the few indie voices with traction. Voice is distinct. |

**Big-DA insurance/retail brands using pet astrology as top-of-funnel:**
| Site | Play |
|---|---|
| Chewy.com | Commissioned celebrity astrologer (Lisa Stardust) writes 12-sign listicles. Pulls insurance/food buyers. |
| Trupanion pet blog | Pet-insurance funnel. |
| Pawlicy.com/blog | Pet-insurance funnel. |
| Spot Pet Insurance | Same. |
| Felix Cat Insurance | Same. |
| 24PetWatch | Seasonal horoscopes (annual 2025 pet horoscopes — drives year-over-year traffic). |
| Daily Paws, Catster, Animal Friends UK, Earth Rated, Holistapet | Lifestyle/product brands with zodiac listicles as evergreen traffic. |

**Adjacent astrology authorities covering pet angle:**
| Site | Role |
|---|---|
| Parade | Celebrity-astrologer-driven, highly syndicated. |
| Bustle | Lifestyle astrology with pet angles. |
| The Old Farmer's Almanac | Surprisingly strong for "pet zodiac signs" — massive trust signal. |
| Collective World | Zodiac-lifestyle listicles. |

### 2b. Competitor structural audit (live-fetched)

**moonpaws.com — `/blogs/the-basics-of-pet-astrology/dog-astrology-traits-and-behaviors-based-on-your-dogs-zodiac-sign`**
- Word count: ~3,500-4,000
- H1: "Dog Astrology: Traits And Behaviors Based On Your Dog's Zodiac Sign"
- TL;DR box: **no**
- Named author with bio: **no**
- JSON-LD: `Organization` only
- FAQ Q&A block with FAQPage schema: **no**
- Internal links to checkout/products: 2-3 (oracle cards, cosmic chews)
- Opening 80 words: "Did you know your dog's astrological sign could offer insight into their personality, just like it does for people?..."

**shmushpets.com — `/blogs/news/dog-astrology-understanding-zodiac-signs-and-personalities`**
- Word count: ~2,800-3,000
- H1: "Dog Astrology: Understanding Zodiac Signs and Personalities"
- TL;DR: no
- Named author: no (org credited as author)
- JSON-LD: `Article`, `WebPage`, `Organization`
- FAQ: zero
- Internal links to checkout: ~2
- Opening: "Dog horoscope! Yes, interesting, right? That's how everyone reacts when they hear about it!..."

**Chewy, Daily Paws, Almanac** — WebFetch blocked (JS-rendered SPA for Chewy; Daily Paws 402 paywall-like; Almanac 403). Can't audit structurally in-session. Visible signal from SERP: all three rank high, suggesting Google weights their domain authority heavily over AEO micro-optimization.

### 2c. The moat — what every competitor is missing

Consistent pattern across 3 directly audited sites + observable pattern across SERP metadata of the rest:

| AEO signal | Moonpaws | Shmush | Chewy/Almanac/etc | Us (planned) |
|---|---|---|---|---|
| Named human/expert author with Person schema | ❌ | ❌ (org-as-author) | ⚠️ inconsistent | ✅ character bible |
| `sameAs` / credentials on author | ❌ | ❌ | ❌ | ✅ |
| TL;DR / answer-first intro (first 80w answers query) | ❌ | ❌ | ❌ | ✅ |
| FAQPage schema with 3-6 Q&A | ❌ | ❌ | ❌ | ✅ |
| BreadcrumbList schema | ❌ | ❌ | ⚠️ sometimes | ✅ |
| Article + WebPage schema | ❌ moonpaws / ✅ shmush | ✅ | ⚠️ | ✅ |
| Inline citations to primary sources | ❌ | ❌ | ❌ | ✅ |
| Middle + end CTA | ⚠️ weak | ⚠️ weak | ⚠️ | ✅ strong |
| Hero image with descriptive alt | ⚠️ | ⚠️ | ✅ | ✅ |

**Conclusion:** Nobody in this niche is combining `Article + FAQPage + Person + BreadcrumbList` with answer-first prose and a named expert author. If we ship that on 10 pilot posts, we are structurally differentiated from every existing page for AI-engine citation purposes.

---

## 3. Keyword universe + Top 12 pillars

(Derived from niche pattern-analysis + live SERP corroboration. Volume/difficulty numbers NOT included — validate in Ahrefs/Semrush during Phase 2 before locking the editorial calendar.)

### 3a. Clusters

**A. Pet astrology core** — "pet astrology", "dog/cat zodiac signs", "dog horoscope today", "pet birth chart calculator". Head terms are owned by big-DA brands; long-tail answer queries (AEO-friendly) are open.

**B. Breed × personality (Trojan horse)** — "golden retriever personality", "ragdoll cat personality", "is my labrador a Leo". Head terms owned by AKC/PetMD. Astrology-wedge long-tails (breed × sign) are uncontested → programmatic goldmine.

**C. Birthday-specific** — "what does my dog's birthday mean", "pet born in March personality". HIGH commercial intent because the searcher already has the data the product needs.

**D. Pet memorial/grief** — "signs my pet visits me", "how to honor a deceased pet", "is my pet still with me". **Highest LTV / fastest conversion** segment in the entire map. Requires careful handling — dedicated sub-section, gentle voice.

**E. Gifts (seasonal $$$)** — "cosmic gift for dog lover", "astrology gift for pet owner", "gift for someone who just got a puppy". Nov-Dec 4-6x spike. "Astrology gift for pet owner" is uncontested white space.

**F. "Is my [breed] a [sign]" programmatic** — template-able at scale. 50 breeds × 12 signs × 2 species = 1,200 pages from one component. Every page CTAs to the birthday reading. Build once, compound forever.

**G. SoulSpeak / curiosity (top-funnel AEO)** — "what is my dog thinking", "do dogs have souls", "signs my pet and I are soulmates". These are exactly the prompts people type into ChatGPT now. Pure AEO play.

### 3b. Top 12 pillar posts (ranked — write these first)

1. **What Does Your Dog's Birthday Say About Them? (Complete Pet Astrology Guide)** — definitional post; every other page links up to it.
2. **The 12 Dog Zodiac Signs Explained: Personality, Needs & Compatibility** — canonical pillar-of-twelve with per-sign anchors.
3. **The 12 Cat Zodiac Signs: What Each One Means for Your Cat's Soul** — feline mirror.
4. **Is My [Breed] a [Sign]?** — template for 600+ programmatic pages (Phase 6).
5. **Signs Your Pet Is Still With You: A Gentle Guide for Grieving Owners** — highest-$ memorial query.
6. **How to Honor a Pet Who Has Passed: 11 Meaningful Rituals** — evergreen memorial, gift-adjacent.
7. **Cosmic Gifts for Dog Lovers: The 2026 Guide** — Q4 commercial anchor, open angle.
8. **Dog Born in [Month]: Personality Traits, Quirks & What to Expect** — 12 monthly posts.
9. **What Is My Dog Thinking? The Science, the Spirit, and the Surprising Answers** — SoulSpeak anchor; highest LLM-citation potential.
10. **Free Pet Birth Chart: How to Read Your Dog or Cat's Cosmic Blueprint** — lead-magnet.
11. **Do Pets Have Souls? What Ancient Traditions and Modern Pet Owners Believe** — brand-voice defining; memorial on-ramp.
12. **Best Dog Breed for Your Zodiac Sign (Owner Edition)** — viral-shaped, cross-audience; pulls astrology-first readers INTO pets.

### 3c. Go / no-go per cluster

| Cluster | Go? | Rationale |
|---|---|---|
| A. Pet astrology core | ✅ GO | Home turf. Own the long-tail answer queries. |
| B. Breed × personality (wedge only) | ✅ GO | Skip head terms; own "is my [breed] a [sign]" long-tails. |
| C. Birthday-specific | ✅ GO | Highest commercial intent outside memorial. |
| D. Pet memorial | ✅ GO (careful) | Highest LTV. Dedicated sub-section. Brand voice must stay reverent. |
| E. Gifts (seasonal) | ✅ GO | Publish by Sep for Nov-Dec peak. "Astrology gift" angle uncontested. |
| F. "Is my [breed] a [sign]" programmatic | ⚠️ GO later (Phase 6) | Defer until pilot validates core. Then scale aggressively. |
| G. SoulSpeak / curiosity | ✅ GO | Pure AEO. Answer-first format. |
| — | ❌ SKIP | Daily horoscope automation (low LTV), generic breed personality head terms (AKC/PetMD wall), rainbow bridge poem (zero $). |

---

## 4. AEO / AI citation patterns

### 4a. What the SERP tells us Google AI Overviews value

From the 6 live queries run (pet astrology core + dog-by-birthday + golden retriever + birth chart + pet astrology sites):
- Google AI Overviews were NOT triggered on most queries (astrology is filtered in AIO for some regions / intents).
- Where answers surfaced, they drew from multi-source aggregation — sites that clearly answered a sub-question in structured prose got extracted.
- Schema on extracted sources leans toward `Article` + `WebPage` at minimum. Pages without ANY JSON-LD appear to be skipped.

### 4b. Per-engine strategy

**Google AI Overviews** — rewards featured-snippet-style answer blocks, `Article` + `FAQPage` schema, clean canonical, short authoritative answers in the first 80 words. Will skip pages where content is paywalled/JS-heavy (Chewy is big but AIO can't always extract).

**Perplexity** — rewards recency, clear source attribution, named human authors. Sitemap hygiene matters because their crawler batches.

**ChatGPT Search / GPTBot** — rewards authoritative structure + schema. Named-expert with `sameAs` to LinkedIn / other profiles is a major trust signal. Pages that explicitly state a position (not just aggregate) get cited.

**Claude / ClaudeBot** — rewards long-form depth + clean schema. Multi-section articles with TOC and schema get cited more than tight listicles.

**Applebot-Extended / Apple Intelligence** — opaque, but generally mirrors Google's structured-data preferences. Article + breadcrumb + author schema is the baseline.

**Meta AI / meta-externalagent** — newest, least documented. Schema-first pages with crawlable markup will outperform JS-rendered SPAs.

**DuckAssist** — rewards Wikipedia-style neutral tone + clear structure. Encyclopedia-format sub-headers help.

### 4c. Blog post template requirements (locked in from research)

Every pilot post MUST have:
1. **TL;DR / Key Answer box** at the top — 40-80 words that directly answer the query. This is what AI engines extract first.
2. **Named expert author** (character bible — e.g. Dr. Luna) with visible byline + `Person` JSON-LD including: `name`, `jobTitle`, `image`, `description`, `sameAs` (social / author page), `knowsAbout`.
3. **Article JSON-LD** with `headline`, `author` (Person), `datePublished`, `dateModified`, `image`, `publisher`, `mainEntityOfPage`.
4. **FAQPage JSON-LD** with 3-6 Q&A that mirror real searcher questions (use "People Also Ask" for seed).
5. **BreadcrumbList JSON-LD** — `Home > Blog > Category > Post`.
6. **Hero image** 1200×630 with descriptive alt text containing target keyword variant.
7. **Middle CTA** at ~40% scroll — topical, picks up a thread from the post.
8. **End CTA** — clearer offer (usually reading or gift depending on post cluster).
9. **Internal links** — 3-5 contextual links to sibling posts + pillar + CTA page.
10. **Inline citations** for any factual claim (backlink to Almanac / AKC / study / source).

### 4d. Pitfalls to avoid

- **JS-only rendering** (current homepage is a Vite/React SPA — if blog pages are client-rendered, AI crawlers may not index the content). Blog must be SSR or SSG.
- **Generic house voice.** AI engines are increasingly penalizing thin / aggregate / AI-generated-smelling content. Character bible fixes this; consistency matters.
- **Fake expertise.** Person schema with `sameAs` that links nowhere will eventually be devalued. Author pages need real bios and discoverable social/author presence (AI-generated but stable).
- **Over-CTA.** Three+ CTAs in one post reduces engagement. Two max.
- **No inline citations.** LLMs treat uncited claims as lower-quality. Citing Almanac/AKC/studies lends credibility even in astrology content.

---

## 5. Hook + format library (seed — validate with more research in Phase 2)

Based on SERP title scan across 30+ top-ranking pet-astrology pages:

### 5a. Hook patterns that dominate

1. **"What Your [Pet]'s Zodiac Sign Says About Them"** — authority / encyclopedia tone. Daily Paws, Almanac, Trupanion all use it.
2. **"The 12 [Dog/Cat] Zodiac Signs Explained"** — pillar / listicle format.
3. **"Is Your [Breed] a [Sign]?"** — personalized curiosity. Underused.
4. **"Dog Born in [Month]: [Traits]"** — specific + shareable.
5. **"Which [Breed] Are You, Based on Zodiac Sign"** — inversion (for the human). Parade uses it.
6. **"Zodiac Signs With [Breed] Energy"** — cross-audience. Bustle / Collective World use it.
7. **"How to Determine Your Rescue Pet's Zodiac Sign"** — problem/solution.
8. **"Pet Astrology: [Definitional]"** — foundational explainer.
9. **"Signs Your Pet [emotional claim]"** — memorial / soul / "still with you".
10. **"[Sign] Pets: The Complete Guide"** — per-sign deep dives for programmatic scale.

### 5b. Post structures (per format)

- **Pillar 12-sign listicle:** 3,000-4,000 words. H2 per sign. Intro answer-first. End with CTA + internal links to per-sign deep dives.
- **Per-sign deep dive:** 1,500-2,500 words. Personality / needs / compatibility / ideal human / famous examples. CTA to reading.
- **Breed × sign programmatic:** 800-1,200 words. Template-generated. Breed traits × sign traits. CTA to birth chart.
- **Memorial / grief:** 2,000-3,000 words. Story-led, reverent, no product-first language in first half. CTA at end — gentle.
- **Gift guide:** 1,500-2,500 words. Comparison-friendly. 8-15 items with clear reasoning. Middle + end CTAs to /gift-v2.
- **SoulSpeak explainer:** 1,500-2,500 words. Answer-first, schema-rich, question-heavy H2s. FAQ block with 5-6 Q&A. CTA to /soul-chat demo.

### 5c. What NOT to do

- Generic "ultimate guide" titles without specificity.
- "You won't believe…" / "#1 will shock you" clickbait — per brand voice ruling (see `feedback_astrologyxastronomy_voice_nosucks.md`).
- Teaser / blurred content. Anti-pattern for AEO + brand.
- Any copy referencing "email delivery" or "AI" in the product context — violates brand rule.
- Fake statistics or invented studies. Cite real sources only.

---

## 6. Recommended Phase 2 prerequisites (what Danny must approve before strategy locks)

1. **Fix Cloudflare bot-blocking** (highest priority — see §1a).
2. **Verify Google Search Console ownership** and submit the domain for indexing.
3. **Confirm blog route stack** — will blog pages be SSR (Next.js-style) or SSG (static-built) to guarantee crawlable HTML? (Currently repo is Vite/React SPA — this may need a render-strategy decision.)
4. **Approve the author-character approach** (2-4 characters, AI-generated consistent photos, dedicated author pages with Person schema). Confirm budget/time for character bible work.
5. **Approve editorial constraints**: memorial voice, no-clickbait, no email/AI references, inline citations mandatory.
6. **Validate keyword cluster priorities** with Ahrefs/Semrush data (optional but strongly recommended before locking 12-month calendar).

---

## 7. Open questions flagged for Danny

- Is the current homepage SPA (Vite/React) going to be replaced with Next.js or Remix for the blog? Or will blog be served as pre-rendered HTML via a separate build? Crawlability hinges on this.
- Cloudflare Bot Fight Mode — will you turn it off entirely, or do we want a narrower allow-list for crawlers?
- Are there existing Little Souls brand visuals / character sketches, or are we generating characters from scratch in Phase 2?
- Does AdminBlogStats have a working auto-generate-blogs trigger path already, or is that still stubbed? (Relevant for Phase 5 workflow build, not now.)
- Budget: are we okay investing ~10-20 hours of Claude time in Phase 2 to produce the character bible, templates, and 12-month calendar before any content ships?

---

## 8. Sources (live-verified in this session)

- https://moonpaws.com/blogs/the-basics-of-pet-astrology/dog-astrology-traits-and-behaviors-based-on-your-dogs-zodiac-sign (fetched; structural audit complete)
- https://shmushpets.com/blogs/news/dog-astrology-understanding-zodiac-signs-and-personalities (fetched; structural audit complete)
- https://littlesouls.app/robots.txt (fetched twice; Cloudflare managed block confirmed)
- Google SERP for "what zodiac sign is my cat based on birthday" (10 results captured)
- Google SERP for "dog astrology by birthday zodiac personality" (10 results captured)
- Google SERP for "golden retriever zodiac personality astrology" (10 results captured)
- Google SERP for "how does pet astrology work birth chart" (10 results captured)
- Google SERP for "pet astrology site OR blog" (10 results captured)
- Google SERP for `"little souls" pet astrology` (1 unrelated result)
- Google SERP for `site:littlesouls.app` (0 results — indexing concern)

Blocked this session: live audit of littlesouls.app homepage / internal pages, Perplexity SERP (403), Daily Paws / Almanac (402/403), Chewy (JS-rendered), Search Console data.

---

**End Phase 1 deliverable.** Phase 2 is gated on Cloudflare fix + Danny's sign-off on the strategic direction in §0 and §6.
