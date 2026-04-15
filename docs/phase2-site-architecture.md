# Phase 2 — Site Architecture & Internal Linking Graph

**Date:** 2026-04-14
**Scope:** URL structure, routing map, hub-and-spoke link graph, breadcrumbs, sitemap, and the auto-linking algorithm the Phase 5 n8n workflow will run. Governs Phase 3 engineering.
**Status:** Locked. Engineer implements from this directly.

---

## 0. Executive summary

- **Canonical host:** `https://www.littlesouls.app` (apex 301s to www — matches current behaviour).
- **URL strategy:** **Flat** for posts (`/blog/[slug]`), **faceted** for filter-hubs (`/blog/category/[cat]`, `/author/[slug]`, `/blog/sign/[sign]`, `/blog/breed/[breed]`). Programmatic breed×sign uses a **nested** pattern (`/breed/[breed]/zodiac/[sign]`) that sits OUTSIDE `/blog/` so it scales independently and gets its own sitemap.
- **Monthly birthday posts:** keep flat under `/blog/`. The 24 posts are discovered via a lightweight hub (`/blog/birthday-by-month`) and the two pillars.
- **Tag pages:** **skipped for now.** Re-evaluate after 60 posts. `sign/` and `breed/` facets cover the useful tag intents.
- **Render strategy:** blog routes MUST be SSG or SSR (NOT SPA). AI crawlers will 403 / miss content on the current Vite/React client-only stack. Recommendation: pre-render `/blog/*`, `/author/*`, `/breed/*` at build time; keep `/`, `/admin/*`, `/checkout` as the existing SPA.
- **Link budget:** every spoke post ships with **3–5 internal links** (1 to pillar, 2–3 to siblings, 1 to CTA). Pillars get 6–10 (more spokes, plus cross-cluster bridges).

---

## 1. URL structure (locked)

### 1.1 Canonical host

`https://www.littlesouls.app` is canonical. Apex already 301s to www (per Cloudflare config in `reference_littlesouls_cloudflare.md`). All `<link rel="canonical">` tags, sitemap entries, and internal links use the www host. OG tags use www. Never mix.

### 1.2 Slug rules

- Lowercase, hyphen-separated, ASCII only.
- **Max 70 characters** (measured as the slug itself, not the full URL).
- Drop stopwords (`a`, `the`, `of`, `to`, `for`, `in`, `and`, `is`) UNLESS removing them breaks the phrase (e.g. keep "is" in `is-my-golden-retriever-a-leo` — the verb is the whole search intent).
- No trailing dates, no `-2026`, no `-final`, no numbers unless they're part of the keyword (`12-dog-zodiac-signs` is fine).
- Apostrophes stripped, not hyphenated: `dogs-birthday` not `dog-s-birthday`.
- Collisions: append the next-best disambiguator word from the title, never `-2`.

### 1.3 Page types and URL patterns

| Page type | URL pattern | Example | Index? |
|---|---|---|---|
| Blog index | `/blog` | `/blog` | ✅ |
| Blog post (all posts, flat) | `/blog/[slug]` | `/blog/what-does-your-dogs-birthday-say-about-them` | ✅ |
| Category hub | `/blog/category/[cat-slug]` | `/blog/category/pet-astrology` | ✅ |
| Author page | `/author/[slug]` | `/author/dr-elena-whitaker` | ✅ |
| Zodiac sign facet | `/blog/sign/[sign-slug]` | `/blog/sign/aries` | ✅ |
| Breed facet | `/blog/breed/[breed-slug]` | `/blog/breed/golden-retriever` | ✅ |
| Birthday-month hub | `/blog/birthday-by-month` | same | ✅ |
| SoulSpeak hub | `/blog/soulspeak` | same | ✅ |
| Memorial hub | `/blog/memorial` | same | ✅ |
| Programmatic breed×sign (Phase 6) | `/breed/[breed]/zodiac/[sign]` | `/breed/golden-retriever/zodiac/aries` | ✅ (Phase 6) |
| Search (optional later) | `/blog/search?q=` | — | noindex |

### 1.4 Flat vs nested decision (justified)

Flat `/blog/[slug]` for editorial posts because:
1. Slugs don't change when a post is re-categorized (common — e.g. memorial post later feels better as SoulSpeak).
2. Shorter URLs rank marginally better and share cleanly.
3. Breadcrumbs + category pages carry the hierarchy without baking it into the URL.

Facets (`/blog/category/*`, `/blog/sign/*`, `/blog/breed/*`) are **filter hubs**, not post containers. A post belongs to exactly ONE primary category (for breadcrumb) but can appear on multiple facet hubs via tags in the DB.

Nested `/breed/[breed]/zodiac/[sign]` for programmatic Phase 6 because:
1. 1,200 pages need their own sitemap partition.
2. The URL itself becomes a keyword-rich canonical that Google can parse.
3. Keeps them structurally separate from editorial `/blog/*` so link-equity + authority are isolated.

### 1.5 Monthly birthday posts

Individual slugs, flat:
- `/blog/dog-born-in-january` … `/blog/dog-born-in-december` (12)
- `/blog/cat-born-in-january` … `/blog/cat-born-in-december` (12)

Plus one hub: `/blog/birthday-by-month` (lists all 24, grouped by species). The hub links down to each month post; each month post links UP to the hub + UP to the main birthday pillar.

### 1.6 Author pages

Bio + post feed on the same page. Rationale: author pages are trust pages (schema signal) AND topic-feed pages (discovery). Splitting dilutes both. Structure:

1. Hero: photo, name, credentials, 2-sentence bio
2. Expertise tags (clickable → filter their feed)
3. `Person` JSON-LD (see §2)
4. Feed of their posts, newest first (paginate at 20)
5. "Topics they cover" cross-linking to 2–3 relevant category hubs

### 1.7 Tag pages — skipped

Defer. Tag pages create thin duplicates of category + facet hubs. Re-evaluate after 60 posts if GSC shows clear tag-intent queries we aren't serving.

---

## 2. Routing map (for the engineer)

React Router v6 patterns. Component files under `src/pages/blog/` unless noted. All routes below are **new** additions in Phase 3.

| Route | Component | Data source | Schema on page | Render mode |
|---|---|---|---|---|
| `/blog` | `BlogIndex.tsx` | Supabase: `posts` (paginated, newest first) | `CollectionPage`, `BreadcrumbList` | **SSG** (rebuild on publish via webhook) |
| `/blog/:slug` | `BlogPost.tsx` | Supabase: `posts.where(slug).single()` + author join | `Article`, `FAQPage`, `Person` (author), `BreadcrumbList` | **SSG** (rebuild per post on publish) |
| `/blog/category/:cat` | `BlogCategory.tsx` | Supabase: `posts.where(category=cat)` | `CollectionPage`, `BreadcrumbList` | SSG |
| `/blog/sign/:sign` | `BlogSignFacet.tsx` | Supabase: `posts.where('aries' = any(tags))` | `CollectionPage`, `BreadcrumbList` | SSG |
| `/blog/breed/:breed` | `BlogBreedFacet.tsx` | Supabase: `posts.where('golden-retriever' = any(tags))` | `CollectionPage`, `BreadcrumbList` | SSG |
| `/blog/birthday-by-month` | `BirthdayMonthHub.tsx` | Static list (24 posts) | `CollectionPage`, `BreadcrumbList` | SSG |
| `/blog/soulspeak` | `SoulSpeakHub.tsx` | Supabase: `posts.where(cluster='G')` | `CollectionPage`, `BreadcrumbList` | SSG |
| `/blog/memorial` | `MemorialHub.tsx` | Supabase: `posts.where(cluster='D')` | `CollectionPage`, `BreadcrumbList` | SSG |
| `/author/:slug` | `AuthorPage.tsx` | Supabase: `authors.where(slug).single()` + their `posts` | `Person`, `CollectionPage`, `BreadcrumbList` | SSG |
| `/breed/:breed/zodiac/:sign` | `BreedSignPage.tsx` | Supabase: `breed_sign_pages.where(breed, sign)` | `Article`, `FAQPage`, `BreadcrumbList` | SSG (Phase 6, can fall back to SSR) |
| `/sitemap.xml` | serverless/edge handler | Supabase aggregate | — | Dynamic endpoint |
| `/sitemap-posts.xml` | serverless | Supabase | — | Dynamic |
| `/sitemap-authors.xml` | serverless | Supabase | — | Dynamic |
| `/sitemap-breed-sign.xml` | serverless | Supabase | — | Dynamic (Phase 6) |
| `/robots.txt` | static | — | — | Static (post-Cloudflare fix) |
| `/llms.txt` | static | — | — | Static (post-Cloudflare fix) |

**SSG requirement — critical.** The current `/` homepage is Vite/React SPA. Blog routes **cannot** be SPA-only: GPTBot, ClaudeBot, Perplexity, and Googlebot-News can and will miss client-rendered content. Options, ranked:

1. **Recommended:** migrate to Next.js App Router for the blog subtree only (other routes keep their SPA shell via `rewrites`). Works natively on Vercel.
2. Use `vite-plugin-ssg` / `vite-react-ssg` to pre-render blog routes at build time. Lower lift, stays within the existing Vite repo.
3. (Fallback) Add Cloudflare-side pre-rendering via Cloudflare Pages Functions. Fragile; avoid.

Engineer picks #1 or #2 before Phase 3 starts. Flag this back to Danny.

### 2.1 Schema emission rules

- `Article` on every post. Includes `author` (Person), `datePublished`, `dateModified`, `image`, `publisher` (Organization = Little Souls), `mainEntityOfPage`, `wordCount`, `keywords`.
- `FAQPage` only if the post has a real FAQ block (3–6 Q&A). Never fake FAQs to get schema.
- `Person` on every blog post (author) AND on `/author/[slug]` (standalone). Must include `sameAs` → at minimum the author page itself + one real-ish social profile.
- `BreadcrumbList` on every page except `/` and `/blog` root.
- `CollectionPage` on index, category, facet, and hub pages.

---

## 3. Internal linking graph (hub-and-spoke)

**Link budget per post:**
- Spoke post: **3–5 internal links** minimum. 1 UP to pillar, 2–3 LATERAL to siblings, 1 to CTA.
- Pillar post: **6–10 internal links**. Down to primary spokes, lateral to sibling pillars, plus CTA.
- Programmatic breed×sign page (Phase 6): **3 links fixed** — up to breed facet, up to sign facet, down to CTA.

**CTA destinations per cluster:**

| Cluster | Primary CTA | Secondary CTA |
|---|---|---|
| A. Pet astrology core | `/checkout` (reading) | `/blog` |
| B. Breed × personality | `/checkout` | `/gift-v2` |
| C. Birthday-specific | `/checkout` | `/gift-v2` |
| D. Memorial | `/soul-chat` (gentle first touch) | `/checkout` (soft, end only) |
| E. Gifts | `/gift-v2` | `/checkout` |
| F. Programmatic breed×sign | `/checkout` | — |
| G. SoulSpeak | `/soul-chat` | `/checkout` |

### 3.1 Cluster A — Pet astrology core

**Hubs (pillars):** P1 "What Does Your Dog's Birthday Say About Them?", P2 "12 Dog Zodiac Signs Explained", P3 "12 Cat Zodiac Signs"

**Spokes (link UP to pillars):** per-sign deep dives (24 — 12 dog + 12 cat), "How to Determine Your Rescue Pet's Zodiac Sign", P10 "Free Pet Birth Chart", P12 "Best Dog Breed for Your Zodiac Sign (Owner Edition)"

**Cross-cluster bridges:** Cluster A → Cluster C (monthly birthday) ; Cluster A → Cluster G (SoulSpeak "what is my dog thinking")

### 3.2 Cluster B — Breed × personality

**Hubs:** P4 "Is My [Breed] a [Sign]?" template page + breed facet hubs (`/blog/breed/[breed]`)

**Spokes:** programmatic breed×sign (Phase 6, 1,200 pages) ; editorial breed personality posts when written

**Cross-cluster:** B → A (sign pillars) ; B → E (gifts filtered by breed)

### 3.3 Cluster C — Birthday-specific

**Hub:** P1 (same as Cluster A pillar — shared hub) + `/blog/birthday-by-month`

**Spokes:** 24 monthly posts (dog + cat born in [Month])

**Cross-cluster:** C → A (relevant sign pillar for that month) ; C → E (gifts for new-puppy owners)

### 3.4 Cluster D — Memorial

**Hubs:** P5 "Signs Your Pet Is Still With You", P6 "How to Honor a Pet Who Has Passed"

**Spokes:** "rainbow bridge meaning" (reverent version only), "pet grief stages", "creating a memorial altar for your pet", "what to say when someone loses a pet"

**Cross-cluster (important):** D → G (SoulSpeak — do pets have souls, pet afterlife beliefs). Memorial → SoulSpeak is a natural spiritual on-ramp. D should NEVER bridge into B (gifts feels wrong) except the single "memorial keepsake reading" link at post-end.

### 3.5 Cluster E — Gifts

**Hub:** P7 "Cosmic Gifts for Dog Lovers: The 2026 Guide"

**Spokes:** "astrology gift for new puppy owner", "gift for someone who lost a pet" (bridge to D), "zodiac-based dog collar ideas", "cat lover astrology gift ideas"

**Cross-cluster:** E → A (sign pillars for gift-matching), E → C (month-based gifting)

### 3.6 Cluster G — SoulSpeak

**Hubs:** P9 "What Is My Dog Thinking?", P11 "Do Pets Have Souls?"

**Spokes:** "signs my pet and I are soulmates", "pet telepathy: what the science says", "why my dog stares at nothing (and what it might mean)", "cat purring meaning astrology"

**Cross-cluster:** G → D (memorial — pet afterlife, signs from beyond) ; G → A (sign pillars for personality explanations)

### 3.7 Concrete example — spokes that link UP to P1

Pillar: **P1 "What Does Your Dog's Birthday Say About Them?"** at `/blog/what-does-your-dogs-birthday-say-about-them`

**Spokes that MUST link up to P1 (10–15):**
1. `/blog/dog-born-in-january` (…through `/blog/dog-born-in-december`) — all 12
2. `/blog/12-dog-zodiac-signs-explained` (sibling pillar — mutual link)
3. `/blog/how-to-determine-your-rescue-pets-zodiac-sign`
4. `/blog/free-pet-birth-chart`
5. `/blog/best-dog-breed-for-your-zodiac-sign`
6. `/blog/is-my-golden-retriever-a-leo` (example programmatic — Phase 6)
7. `/blog/what-is-my-dog-thinking` (SoulSpeak cross-cluster)

**Sibling links P1 pushes OUT (4–5):**
1. P2 `/blog/12-dog-zodiac-signs-explained` (mutual pillar)
2. P10 `/blog/free-pet-birth-chart`
3. P8 `/blog/dog-born-in-january` (or whichever month is currently seasonally relevant; template can pick by `new Date().getMonth()`)
4. P9 `/blog/what-is-my-dog-thinking` (cross-cluster to G)
5. CTA: `/checkout` (middle + end, same URL)

---

## 4. Hub-and-spoke visual (ASCII)

```
                                  LITTLE SOULS BLOG
                                          |
            +-----------------------------+-----------------------------+
            |                             |                             |
        CLUSTER A                    CLUSTER D                     CLUSTER G
     Pet Astrology Core              Memorial                      SoulSpeak
     CTA: /checkout                  CTA: /soul-chat               CTA: /soul-chat
            |                             |                             |
    +-------+--------+              +-----+-----+                 +-----+-----+
    |       |        |              |           |                 |           |
   P1      P2       P3             P5          P6                P9          P11
 Dog BD   12 Dog   12 Cat        Signs Pet   How to             What Dog    Do Pets
 Pillar   Signs    Signs         Still With  Honor              Thinking?   Have
    |       |        |            You          Pet                |         Souls?
    |       |        |              |           |                 |           |
    v       v        v              v           v                 v           v
  [12    [12 sign  [12 sign     [grief     [memorial        [telepathy   [afterlife
  month   deep     deep          stages]    rituals]         science]    beliefs]
  dog     dives]   dives]           \          /                 \         /
  posts]     \      /                \        /                   \       /
     \        \    /                  \      /                     \     /
      \        \  /                    \    /                       \   /
       +--- P10 Free Birth Chart ---+   \  /                        \ /
                                     \   \/                          X
                                      \  /\                         / \
                                       \/  \                       /   \
                                    bridge  +----- bridge -------- +    \
                                    A<->C                          G<->D (strong)
                                                                        \
                                          CLUSTER C                      \
                                       Birthday by Month                  \
                                       (24 posts -> P1 hub)                \
                                                                            \
                                      CLUSTER B                              \
                                   Breed x Personality                        \
                                (programmatic Phase 6)                         \
                                                                                \
                                      CLUSTER E                                  \
                                         Gifts                                    \
                                      CTA: /gift-v2                                \
                                  (bridges into A + C + D-soft)                     \
                                                                                     \
                                     CLUSTER F (Phase 6)                              \
                                   /breed/*/zodiac/* programmatic                      \
                             -> links UP to P1 + breed facet + sign facet               \
                                                                                         \
```

The graph shows: every spoke points up at a hub; pillars cross-link laterally; Cluster D and Cluster G bridge strongly (memorial ↔ afterlife); Cluster E bridges into A and C for gift context; Cluster F (programmatic) feeds link-equity into A (sign facets) and B (breed facets).

---

## 5. Automated internal-linking algorithm (Phase 5 n8n code node)

Runs inside the content-generation workflow AFTER the draft is written but BEFORE it's stored. Input: the draft JSON (title, slug, cluster, character, body_markdown, tags[]). Output: body_markdown with contextual internal links inserted + a sibling-pool update.

### 5.1 Algorithm

```
function injectInternalLinks(draft, postgresClient):
  cluster   = draft.cluster          # e.g. "A"
  character = draft.character        # e.g. "dr-elena-whitaker"
  tags      = draft.tags             # e.g. ["aries", "golden-retriever", "birthday"]
  body      = draft.body_markdown

  links = []

  # 1. PILLAR (the hub for this cluster)
  pillar = db.query("""
    SELECT slug, title FROM posts
    WHERE cluster = $1 AND is_pillar = true AND slug <> $2
    ORDER BY published_at ASC LIMIT 1
  """, [cluster, draft.slug])
  links.push({ type: 'pillar', url: `/blog/${pillar.slug}`, anchor_pool: pillar.title_variants })

  # 2. SIBLINGS (2-3 strongest topical overlap, same cluster)
  siblings = db.query("""
    SELECT slug, title, tags,
      cardinality(ARRAY(SELECT UNNEST(tags) INTERSECT SELECT UNNEST($1::text[]))) AS overlap
    FROM posts
    WHERE cluster = $2 AND is_pillar = false AND slug <> $3 AND status = 'published'
    ORDER BY overlap DESC, published_at DESC
    LIMIT 3
  """, [tags, cluster, draft.slug])
  for s in siblings where s.overlap >= 1:
    links.push({ type: 'sibling', url: `/blog/${s.slug}`, anchor_pool: s.title_variants })

  # 3. CROSS-CLUSTER BRIDGE (1, if draft is in D, E, or G)
  bridgeMap = { D: 'G', G: 'D', E: 'A' }
  if cluster in bridgeMap:
    bridge = db.query("""
      SELECT slug, title FROM posts
      WHERE cluster = $1 AND is_pillar = true ORDER BY random() LIMIT 1
    """, [bridgeMap[cluster]])
    links.push({ type: 'bridge', url: `/blog/${bridge.slug}`, anchor_pool: bridge.title_variants })

  # 4. CTA (middle + end, same URL pulled from cluster map)
  ctaMap = {
    A: '/checkout', B: '/checkout', C: '/checkout',
    D: '/soul-chat', E: '/gift-v2', F: '/checkout', G: '/soul-chat'
  }
  cta = ctaMap[cluster]

  # 5. INSERT CONTEXTUALLY
  # For each link, search body for the first case-insensitive phrase match
  # from anchor_pool that is NOT already inside a markdown link. Wrap it.
  # Fallback: if no natural match, append as a sentence at end of a chosen paragraph.
  for link in links:
    body = insertNaturalLink(body, link.url, link.anchor_pool)

  # 6. INSERT CTAs at ~40% and ~95% scroll positions
  body = insertCTABlock(body, cta, position='middle')
  body = insertCTABlock(body, cta, position='end')

  # 7. ADD THIS POST TO THE SIBLING POOL for future drafts
  # (happens automatically via the posts table insert — no action needed here)

  return { body_markdown: body, links_inserted: links }
```

### 5.2 `insertNaturalLink` heuristic

1. For each anchor candidate in `anchor_pool` (3–5 phrase variants per target), do a case-insensitive regex search in `body`.
2. Skip matches already inside `[...]()` markdown link syntax or inside code blocks.
3. First clean match wins — wrap it as `[anchor](url)`.
4. If no match and link is `type: pillar`, force-insert a sentence after the first H2: `"If you're new to pet astrology, start with our [pillar anchor](url) guide."`
5. If no match and link is `type: sibling`, append sentence at end of the paragraph that shares the most tag-terms with the sibling's tags.
6. Never insert more than ONE link per paragraph.
7. Never link the same URL twice in one post.

### 5.3 Anchor pool generation

Each post's row stores an `anchor_variants` array with 3–5 phrasings of the title suitable for inline linking. Examples for P1:
- "your dog's birthday"
- "what your dog's birthday means"
- "dog astrology guide"
- "birth chart for dogs"
- "your dog's zodiac sign"

Generated at post-publish time by the same LLM that wrote the draft (quick prompt: "give 5 short anchor-text variants of this title, 2–6 words each, natural phrases not exact title").

### 5.4 CTA block format

Middle CTA (~40% scroll, inserted after the 2nd or 3rd H2):
```
> **[Cluster-specific hook line]**
> [Short sentence picking up the current paragraph thread]
> [Read your pet's chart →](/checkout)
```

End CTA (after final H2, before FAQ):
```
## Ready to read your pet's soul?
[2-sentence personal close in the character's voice]
[Get your pet's reading →](/checkout)
```

The character voice + hook line are pulled from the character bible (Phase 2 deliverable — not in this doc).

---

## 6. Breadcrumb patterns

`BreadcrumbList` JSON-LD on every page + visual breadcrumb above the H1.

| Page type | Breadcrumb |
|---|---|
| Blog index | Home > Blog |
| Blog post (astrology) | Home > Blog > Pet Astrology > "[Post Title]" |
| Blog post (memorial) | Home > Blog > Memorial > "[Post Title]" |
| Blog post (SoulSpeak) | Home > Blog > SoulSpeak > "[Post Title]" |
| Blog post (gifts) | Home > Blog > Gifts > "[Post Title]" |
| Category hub | Home > Blog > "[Category Name]" |
| Sign facet | Home > Blog > Signs > "Aries" |
| Breed facet | Home > Blog > Breeds > "Golden Retriever" |
| Birthday-month hub | Home > Blog > Birthday by Month |
| Month post | Home > Blog > Birthday by Month > "Dog Born in January" |
| Author page | Home > Authors > "Dr. Elena Whitaker" |
| Programmatic (Phase 6) | Home > Breeds > "Golden Retriever" > Zodiac > "Aries" |

Category name → display label mapping (category slug → breadcrumb label):
- `pet-astrology` → "Pet Astrology"
- `breed-personality` → "Breed Personality"
- `birthday` → "Birthday"
- `memorial` → "Memorial"
- `gifts` → "Gifts"
- `soulspeak` → "SoulSpeak"

---

## 7. Sitemap architecture

### 7.1 Sitemap index (root)

`/sitemap.xml` → sitemap index that lists child sitemaps:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://www.littlesouls.app/sitemap-core.xml</loc><lastmod>2026-04-14</lastmod></sitemap>
  <sitemap><loc>https://www.littlesouls.app/sitemap-posts.xml</loc><lastmod>2026-04-14</lastmod></sitemap>
  <sitemap><loc>https://www.littlesouls.app/sitemap-authors.xml</loc><lastmod>2026-04-14</lastmod></sitemap>
  <sitemap><loc>https://www.littlesouls.app/sitemap-facets.xml</loc><lastmod>2026-04-14</lastmod></sitemap>
  <sitemap><loc>https://www.littlesouls.app/sitemap-breed-sign.xml</loc><lastmod>2026-04-14</lastmod></sitemap>
</sitemapindex>
```

### 7.2 Child sitemaps

| File | Contents | Cadence |
|---|---|---|
| `sitemap-core.xml` | `/`, `/blog`, `/checkout`, `/gift-v2`, `/soul-chat`, category hubs, memorial + SoulSpeak + birthday-month hubs | regenerate on deploy |
| `sitemap-posts.xml` | every `/blog/[slug]` | regenerate on post publish |
| `sitemap-authors.xml` | every `/author/[slug]` | regenerate on author change |
| `sitemap-facets.xml` | every `/blog/sign/*`, `/blog/breed/*`, `/blog/category/*` that has ≥1 post | regenerate on post publish |
| `sitemap-breed-sign.xml` | Phase 6 only — `/breed/[breed]/zodiac/[sign]` (up to 1,200 URLs) | regenerate on data-table change |

Split thresholds: if any child exceeds 45,000 URLs, partition (Google's hard limit is 50k; headroom matters). Phase 6 will hit this on `breed-sign` — partition into `sitemap-breed-sign-dog.xml` and `sitemap-breed-sign-cat.xml` when species count makes it necessary.

### 7.3 `<lastmod>` strategy

- Posts: `dateModified` on the post row. Updated every time the post body, FAQ, or author changes.
- Author pages: `greatest(author.updated_at, max(author.posts.published_at))` — so when an author publishes a new post, their page lastmod updates.
- Facet hubs: `max(posts.published_at)` among posts matching the facet.
- Core pages: deploy timestamp.

Never fake `<lastmod>`. Google demotes sources with stale-but-claimed-fresh sitemaps.

### 7.4 `robots.txt` (post-Cloudflare fix)

```
User-agent: *
Allow: /

Sitemap: https://www.littlesouls.app/sitemap.xml

# AI crawlers explicitly welcomed
User-agent: GPTBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: Applebot-Extended
Allow: /
User-agent: Amazonbot
Allow: /
User-agent: meta-externalagent
Allow: /
User-agent: Bytespider
Allow: /
User-agent: CCBot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: DuckAssistBot
Allow: /

# Don't crawl admin or checkout
User-agent: *
Disallow: /admin/
Disallow: /checkout

# Keep search out of index if we add it
Disallow: /blog/search
```

### 7.5 `llms.txt` (post-Cloudflare fix)

Standard `llms.txt` format — short project description + list of the 12 pillar URLs as primary sources, grouped by cluster. Regenerated on each pillar publish.

---

## 8. Programmatic Phase 6 architecture (reference, don't build yet)

### Pattern

- Route: `/breed/[breed-slug]/zodiac/[sign-slug]`
- Example: `/breed/golden-retriever/zodiac/aries`
- Scale: 50 breeds × 12 signs × 2 species (dog/cat, separated via breed's implicit species) = 1,200 pages.

### Data model

New Supabase table `breed_sign_pages` (materialized view is fine if `breeds` × `signs` stays small):

```
breed_slug       text  -- golden-retriever
breed_name       text  -- Golden Retriever
species          text  -- dog|cat
sign_slug        text  -- aries
sign_name        text  -- Aries
breed_traits     jsonb -- { energy, trainability, social, grooming, ... }
sign_traits      jsonb -- { element, ruling_planet, core_drive, ... }
composite_copy   text  -- LLM-generated 800-1,200w body
faq              jsonb -- [{q, a}, ...]
author_slug      text  -- one of the 5 characters (assigned deterministically by hash(breed+sign))
published_at     timestamptz
updated_at       timestamptz
```

### Template fields rendered on the page

- H1: "Is My [Breed] a [Sign]?" (or "[Sign] [Breed]: Personality & Traits")
- TL;DR box — 60 words, answer-first.
- Sections: Breed overview → Sign overview → The composite personality → How to tell if your [breed] is really a [sign] → Compatibility notes → FAQ.
- Schema: `Article` + `FAQPage` + `BreadcrumbList` + `Person` (author).
- Internal links (3, fixed):
  1. UP to `/blog/breed/[breed-slug]` facet
  2. UP to `/blog/sign/[sign-slug]` facet
  3. DOWN to `/checkout`
- Breadcrumb: Home > Breeds > [Breed] > Zodiac > [Sign]

### Composition pipeline (Phase 6)

1. Seed table with 50 breeds + their traits (one-off research prompt).
2. Seed table with 12 signs + their traits (already known from Phase 2 character-bible work).
3. For each (breed × sign), call the LLM with a composition prompt that fuses the two trait blobs into a coherent personality profile, generates 3 FAQs, and outputs ready-to-insert JSON.
4. Store in `breed_sign_pages`. Expose via the `/breed/[breed]/zodiac/[sign]` SSG route.
5. Regenerate `sitemap-breed-sign.xml` once at the end of the batch.

### Expected sitemap entries

1,200 URLs in `sitemap-breed-sign.xml`. Well under 50k so no partition needed at launch. When breed count scales past 100 (possible if we add rare breeds), partition by species.

### Link-equity plan

Every `breed-sign` page gets exactly 3 outbound internal links (minimal noise) and accumulates inbound links from: the breed facet hub, the sign facet hub, and the P4 pillar template. This keeps authority flowing DOWN to each programmatic page without spamming the graph.

---

## 9. Engineering checklist (Phase 3 kickoff)

- [ ] Decide render strategy (Next.js migration vs Vite SSG plugin) and document the choice.
- [ ] Implement routes in §2 table, in the order listed.
- [ ] Ship `BreadcrumbList`, `Article`, `Person`, `FAQPage` schema helpers as shared utilities.
- [ ] Build the 5 dynamic sitemap endpoints.
- [ ] Ship `/robots.txt` + `/llms.txt` (after Cloudflare flip verified).
- [ ] Wire `posts` table with `cluster`, `is_pillar`, `tags[]`, `anchor_variants[]`, `author_slug`, `dateModified` columns.
- [ ] Stub `/breed/[breed]/zodiac/[sign]` route + `breed_sign_pages` table for Phase 6 (empty) — saves a migration later.

---

**End Phase 2 site architecture deliverable.** Phase 3 engineering can proceed from this document directly.
