// Server-rendered blog post HTML — served to bot crawlers only (routed via
// vercel.json `has` user-agent rewrite). Humans continue to get the React SPA.
//
// Purpose: guarantee AI engines (GPTBot, ClaudeBot, Perplexity, Google-Extended)
// see the full article body + schema in the initial HTML response without
// executing JS. Schema + meta + body all in one static document.
import type { VercelRequest, VercelResponse } from "@vercel/node";

const SITE = "https://littlesouls.app";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://aduibsyrnenzobuyetmn.supabase.co";
// Public anon JWT — safe to ship; PostgREST enforces RLS. Fallback hardcoded so
// the function works even if the Vercel env var isn't configured.
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY
  || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkdWlic3lybmVuem9idXlldG1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MzAwMzgsImV4cCI6MjA4ODUwNjAzOH0.-axd-u-mY_73j2RPkySsLgG630WCUb05I8AbwYjIvkI";

const CLUSTER_LABEL: Record<string, string> = {
  A: "Pet Astrology",
  B: "Breed Personality",
  C: "Birthday",
  D: "Memorial",
  E: "Gifts",
  F: "Breed & Zodiac",
  G: "SoulSpeak",
};

interface Author {
  slug: string; name: string; short_name: string; job_title: string;
  description: string; long_bio: string; image_url: string | null;
  knows_about: string[]; same_as: string[];
}
interface Post {
  id: string; slug: string; title: string; content: string; meta_description: string;
  excerpt: string | null; species: string; category: string;
  cluster: string | null; is_pillar: boolean | null; tags: string[] | null;
  tldr: string | null; hero_alt: string | null;
  target_keyword: string; secondary_keywords: string[];
  reading_time_minutes: number; published_at: string;
  date_modified: string | null; word_count: number | null;
  author_slug: string | null;
  author?: Author | null;
  faq: Array<{ question: string; answer: string }> | null;
  sources: Array<{ title: string; url: string; publisher?: string }> | null;
  featured_image_url: string | null;
}

function esc(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function escAttr(s: string | null | undefined): string {
  return esc(s);
}

// Minimal markdown -> HTML for our edge-function-generated content
function mdToHtml(md: string, ctx: { slug: string; title: string }): string {
  // Split into lines and process block-level first
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;
  let inList = false;
  let inBlockquote = false;

  const flushList = () => { if (inList) { out.push("</ul>"); inList = false; } };
  const flushQuote = () => { if (inBlockquote) { out.push("</blockquote>"); inBlockquote = false; } };

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw;

    // Image-only paragraph (![alt](url))
    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/);
    if (imgMatch) {
      flushList(); flushQuote();
      const alt = esc(imgMatch[1]);
      const src = escAttr(imgMatch[2]);
      out.push(`<figure class="ls-figure"><img src="${src}" alt="${alt}" loading="lazy" width="1200" height="675"/><figcaption>${alt}</figcaption></figure>`);
      i++; continue;
    }

    // H2/H3
    const h2 = line.match(/^##\s+(.+?)\s*$/);
    const h3 = line.match(/^###\s+(.+?)\s*$/);
    if (h2) { flushList(); flushQuote(); out.push(`<h2>${renderInline(h2[1])}</h2>`); i++; continue; }
    if (h3) { flushList(); flushQuote(); out.push(`<h3>${renderInline(h3[1])}</h3>`); i++; continue; }

    // Horizontal rule
    if (/^---+\s*$/.test(line)) { flushList(); flushQuote(); out.push("<hr/>"); i++; continue; }

    // Blockquote
    if (line.startsWith("> ")) {
      if (!inBlockquote) { flushList(); out.push(`<blockquote class="ls-quote">`); inBlockquote = true; }
      out.push(`<p>${renderInline(line.slice(2))}</p>`);
      i++; continue;
    }
    if (inBlockquote && line.trim() === "") { flushQuote(); i++; continue; }

    // List item
    if (line.match(/^[-*]\s+/)) {
      flushQuote();
      if (!inList) { out.push("<ul>"); inList = true; }
      out.push(`<li>${renderInline(line.replace(/^[-*]\s+/, ""))}</li>`);
      i++; continue;
    }

    // Blank line -> paragraph break
    if (line.trim() === "") {
      flushList(); flushQuote();
      i++; continue;
    }

    // Accumulate until blank line, handling \n within a paragraph as <br>
    let para = line;
    i++;
    while (i < lines.length && lines[i].trim() !== "" &&
           !lines[i].match(/^(#{1,6}\s|>\s|[-*]\s|---+\s*$|!\[.*\]\()/)) {
      para += " " + lines[i];
      i++;
    }
    flushList(); flushQuote();
    out.push(`<p>${renderInline(para)}</p>`);
  }

  flushList(); flushQuote();
  return out.join("\n");
}

function renderInline(s: string): string {
  // NOTE: order matters — images before links before bold/italic
  let r = s;
  r = r.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, a, u) => `<img src="${escAttr(u)}" alt="${esc(a)}" loading="lazy"/>`);
  r = r.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) => {
    const url = u.trim();
    const external = /^https?:\/\//.test(url);
    const rel = external ? ' rel="nofollow noopener"' : "";
    const target = external ? ' target="_blank"' : "";
    return `<a href="${escAttr(url)}"${rel}${target}>${esc(t)}</a>`;
  });
  r = r.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  r = r.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  r = r.replace(/`([^`]+)`/g, "<code>$1</code>");
  return r;
}

async function fetchPost(slug: string): Promise<Post | null> {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/blog_posts?slug=eq.${encodeURIComponent(slug)}&is_published=eq.true&select=*,author:authors!blog_posts_author_slug_fkey(*)`,
    { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` } },
  );
  if (!r.ok) return null;
  const rows = (await r.json()) as Post[];
  return rows[0] ?? null;
}

function buildSchema(post: Post): unknown {
  const cluster = post.cluster ?? "A";
  const clusterLabel = CLUSTER_LABEL[cluster] ?? "Pet Astrology";
  const categorySlug = clusterLabel.toLowerCase().replace(/\s+/g, "-");
  const heroUrl = post.featured_image_url || `${SITE}/og-cosmic-pet-portraits.jpg`;
  const heroAlt = post.hero_alt ?? post.title;
  const publishedIso = post.published_at;
  const modifiedIso = post.date_modified ?? post.published_at;
  const author = post.author;

  const graph: unknown[] = [
    { "@type": "Organization", "@id": `${SITE}/#organization`, name: "Little Souls", url: SITE },
    { "@type": "WebSite", "@id": `${SITE}/#website`, url: SITE, name: "Little Souls", publisher: { "@id": `${SITE}/#organization` } },
    {
      "@type": "WebPage",
      "@id": `${SITE}/blog/${post.slug}#webpage`,
      url: `${SITE}/blog/${post.slug}`,
      name: post.title,
      isPartOf: { "@id": `${SITE}/#website` },
      primaryImageOfPage: { "@id": `${SITE}/blog/${post.slug}#hero` },
      datePublished: publishedIso,
      dateModified: modifiedIso,
      description: post.meta_description,
      breadcrumb: { "@id": `${SITE}/blog/${post.slug}#breadcrumb` },
      inLanguage: "en-US",
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${SITE}/blog/${post.slug}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
        { "@type": "ListItem", position: 3, name: clusterLabel, item: `${SITE}/blog/category/${categorySlug}` },
        { "@type": "ListItem", position: 4, name: post.title },
      ],
    },
    {
      "@type": "Article",
      "@id": `${SITE}/blog/${post.slug}#article`,
      isPartOf: { "@id": `${SITE}/blog/${post.slug}#webpage` },
      mainEntityOfPage: { "@id": `${SITE}/blog/${post.slug}#webpage` },
      headline: post.title,
      description: post.meta_description,
      image: { "@id": `${SITE}/blog/${post.slug}#hero` },
      datePublished: publishedIso,
      dateModified: modifiedIso,
      author: author ? { "@id": `${SITE}/author/${author.slug}#person` } : { "@id": `${SITE}/#organization` },
      publisher: { "@id": `${SITE}/#organization` },
      articleSection: clusterLabel,
      keywords: (post.tags || []).concat(post.secondary_keywords || []).join(", "),
      wordCount: post.word_count ?? undefined,
      inLanguage: "en-US",
      citation: (post.sources || []).map((s) => ({
        "@type": "CreativeWork", name: s.title, url: s.url, publisher: s.publisher ?? undefined,
      })),
    },
    {
      "@type": "ImageObject",
      "@id": `${SITE}/blog/${post.slug}#hero`,
      url: heroUrl,
      contentUrl: heroUrl,
      width: 1200, height: 630,
      caption: heroAlt,
      creditText: "Little Souls",
    },
  ];

  if (author) {
    graph.push({
      "@type": "Person",
      "@id": `${SITE}/author/${author.slug}#person`,
      name: author.name,
      jobTitle: author.job_title,
      description: author.description,
      image: author.image_url || `${SITE}/og-cosmic-pet-portraits.jpg`,
      url: `${SITE}/author/${author.slug}`,
      knowsAbout: author.knows_about,
      sameAs: (author.same_as || []).concat([`${SITE}/author/${author.slug}`]),
      worksFor: { "@id": `${SITE}/#organization` },
    });
  }

  if (Array.isArray(post.faq) && post.faq.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${SITE}/blog/${post.slug}#faq`,
      mainEntity: post.faq.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

function renderHtml(post: Post): string {
  const cluster = post.cluster ?? "A";
  const clusterLabel = CLUSTER_LABEL[cluster] ?? "Pet Astrology";
  const categorySlug = clusterLabel.toLowerCase().replace(/\s+/g, "-");
  const heroUrl = post.featured_image_url || `${SITE}/og-cosmic-pet-portraits.jpg`;
  const heroAlt = post.hero_alt ?? post.title;
  const author = post.author;
  const publishedIso = post.published_at;
  const modifiedIso = post.date_modified ?? post.published_at;
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const bodyHtml = mdToHtml(post.content, { slug: post.slug, title: post.title });
  const schema = JSON.stringify(buildSchema(post));

  const faqBlock = Array.isArray(post.faq) && post.faq.length > 0
    ? `<section class="ls-faq" aria-labelledby="faq-h2">
        <h2 id="faq-h2">Frequently asked questions</h2>
        ${post.faq.map((f) => `
          <div class="ls-faq-q">
            <h3>${esc(f.question)}</h3>
            <p>${esc(f.answer)}</p>
          </div>`).join("")}
       </section>` : "";

  const sourcesBlock = Array.isArray(post.sources) && post.sources.length > 0
    ? `<details class="ls-sources"><summary>Sources</summary><ol>${post.sources.map((s) =>
        `<li><a href="${escAttr(s.url)}" rel="nofollow noopener" target="_blank">${esc(s.title)}</a>${s.publisher ? ` — ${esc(s.publisher)}` : ""}</li>`,
      ).join("")}</ol></details>` : "";

  const authorCard = author ? `
    <section class="ls-author-card">
      ${author.image_url ? `<img src="${escAttr(author.image_url)}" alt="${esc(author.name)}" class="ls-author-img"/>` : `<div class="ls-author-img ls-author-init">${esc((author.short_name || "L").slice(0, 1))}</div>`}
      <div>
        <a href="/author/${escAttr(author.slug)}" class="ls-author-name">${esc(author.name)}</a>
        <div class="ls-author-job">${esc(author.job_title)}</div>
        <p class="ls-author-bio">${esc(author.description)}</p>
        <a href="/author/${escAttr(author.slug)}" class="ls-author-more">More from ${esc(author.short_name)} →</a>
      </div>
    </section>` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(post.title)} | Little Souls</title>
<meta name="description" content="${escAttr(post.meta_description)}"/>
<meta name="keywords" content="${escAttr([post.target_keyword, ...(post.secondary_keywords || [])].join(", "))}"/>
<meta name="author" content="${escAttr(author?.name ?? "Little Souls")}"/>
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"/>
<link rel="canonical" href="${SITE}/blog/${escAttr(post.slug)}"/>
<meta property="og:title" content="${escAttr(post.title)}"/>
<meta property="og:description" content="${escAttr(post.meta_description)}"/>
<meta property="og:type" content="article"/>
<meta property="og:url" content="${SITE}/blog/${escAttr(post.slug)}"/>
<meta property="og:image" content="${escAttr(heroUrl)}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:site_name" content="Little Souls"/>
<meta property="article:published_time" content="${escAttr(publishedIso)}"/>
<meta property="article:modified_time" content="${escAttr(modifiedIso)}"/>
${author ? `<meta property="article:author" content="${escAttr(author.name)}"/>` : ""}
<meta property="article:section" content="${escAttr(clusterLabel)}"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${escAttr(post.title)}"/>
<meta name="twitter:description" content="${escAttr(post.meta_description)}"/>
<meta name="twitter:image" content="${escAttr(heroUrl)}"/>
<style>
  :root{--cream:#FFFDF5;--cream2:#faf4e8;--ink:#3d2f2a;--body:#5a4a42;--muted:#9a8578;--border:#e8ddd0;--gold:#c4a265;--gold-dk:#8a6a2e;--rose:#bf524a}
  *{box-sizing:border-box}
  body{margin:0;background:var(--cream);color:var(--body);font:17px/1.7 Georgia,"Times New Roman",serif;-webkit-font-smoothing:antialiased}
  a{color:var(--gold);text-decoration:none}a:hover{text-decoration:underline}
  .ls-wrap{max-width:720px;margin:0 auto;padding:40px 20px 80px}
  .ls-crumbs{font-size:12px;color:var(--muted);margin-bottom:16px}
  .ls-crumbs a{color:var(--muted)}.ls-crumbs span{color:var(--ink)}
  .ls-badges{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;font-size:12px}
  .ls-badge{padding:3px 9px;border-radius:999px;background:#fdf7e8;color:var(--gold-dk);border:1px solid var(--border);text-transform:capitalize}
  h1{font-family:"DM Serif Display",Georgia,serif;font-size:clamp(28px,5.5vw,44px);color:var(--ink);line-height:1.15;margin:0 0 16px}
  h2{font-family:"DM Serif Display",Georgia,serif;font-size:clamp(22px,4vw,30px);color:var(--ink);margin:40px 0 12px;padding-bottom:8px;border-bottom:1px solid var(--border)}
  h3{font-family:"DM Serif Display",Georgia,serif;font-size:20px;color:var(--ink);margin:24px 0 10px}
  p{margin:0 0 18px;font-size:18px;line-height:1.75}
  ul,ol{padding-left:22px;margin:0 0 18px}li{margin-bottom:6px;line-height:1.7}
  hr{border:0;border-top:1px solid var(--border);margin:28px 0}
  strong{color:var(--ink)}em{color:var(--muted)}
  code{background:#faf6ef;color:var(--gold);padding:2px 6px;border-radius:4px;font-size:0.9em}
  .ls-hero{margin:0 -20px 32px}
  .ls-hero img{width:100%;aspect-ratio:1200/630;object-fit:cover;display:block;background:#f5efe6}
  @media(min-width:720px){.ls-hero{margin:0 0 32px}.ls-hero img{border-radius:18px}}
  .ls-byline{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:14px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border);margin-bottom:32px}
  .ls-byline-name{display:flex;gap:12px;align-items:center}
  .ls-avatar{width:46px;height:46px;border-radius:50%;object-fit:cover;box-shadow:0 0 0 2px rgba(196,162,101,0.4)}
  .ls-avatar-init{display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#fdf7e8,#faf0d8);color:var(--gold-dk);font-family:"DM Serif Display",Georgia,serif;font-size:18px;width:46px;height:46px;border-radius:50%;box-shadow:0 0 0 2px rgba(196,162,101,0.4)}
  .ls-byline-name a{font-weight:600;color:var(--ink)}
  .ls-byline-job{font-size:12px;color:var(--muted)}
  .ls-byline-meta{font-size:12px;color:var(--muted);display:flex;gap:12px;align-items:center}
  .ls-tldr{background:linear-gradient(135deg,#fdf7e8,#faf0d8);border-left:4px solid var(--gold);border-radius:16px;padding:22px 24px;margin:0 0 36px;box-shadow:0 1px 2px rgba(0,0,0,0.03)}
  .ls-tldr-label{text-transform:uppercase;letter-spacing:0.15em;font-size:11px;color:var(--gold-dk);font-weight:600;margin-bottom:8px}
  .ls-tldr p{margin:0;color:var(--ink);font-size:17px}
  .ls-figure{margin:36px -20px}
  .ls-figure img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block;background:#f5efe6}
  @media(min-width:720px){.ls-figure{margin:36px 0}.ls-figure img{border-radius:18px}}
  .ls-figure figcaption{text-align:center;font-style:italic;color:var(--muted);font-size:13px;margin-top:10px;padding:0 12px}
  .ls-quote{background:linear-gradient(135deg,var(--gold),#b8973e);color:#fff;border-radius:18px;padding:22px 26px;margin:32px 0}
  .ls-quote p{color:#fff;font-size:18px;margin:0 0 8px}.ls-quote p:last-child{margin-bottom:0}
  .ls-faq{margin:48px 0}
  .ls-faq-q{background:#fff;border:1px solid var(--border);border-radius:14px;padding:18px 20px;margin-bottom:14px}
  .ls-faq-q h3{font-family:"DM Serif Display",Georgia,serif;color:var(--ink);margin:0 0 8px;font-size:18px}
  .ls-faq-q p{font-size:16px;color:var(--body);margin:0}
  .ls-end-cta{background:var(--ink);color:var(--cream);border-radius:24px;padding:40px 28px;text-align:center;margin:40px 0}
  .ls-end-cta h2{color:var(--cream);border:0;margin:0 0 12px;padding:0;font-size:26px}
  .ls-end-cta p{color:var(--cream);opacity:0.9;max-width:460px;margin:0 auto 22px;font-size:16px}
  .ls-end-cta a.btn{display:inline-block;background:var(--gold);color:var(--ink);font-weight:600;padding:14px 28px;border-radius:10px;font-family:"DM Serif Display",Georgia,serif}
  .ls-author-card{display:flex;gap:16px;background:#fff;border:1px solid var(--border);border-radius:18px;padding:22px;margin:32px 0}
  .ls-author-card .ls-author-img,.ls-author-card .ls-author-init{width:80px;height:80px;min-width:80px;border-radius:50%;object-fit:cover;box-shadow:0 0 0 2px rgba(196,162,101,0.4)}
  .ls-author-card .ls-author-init{display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#fdf7e8,#faf0d8);color:var(--gold-dk);font-family:"DM Serif Display",Georgia,serif;font-size:28px}
  .ls-author-name{font-family:"DM Serif Display",Georgia,serif;font-size:20px;color:var(--ink);font-weight:600;display:block;margin-bottom:2px}
  .ls-author-job{color:var(--gold);font-size:13px;margin-bottom:8px}
  .ls-author-bio{font-size:14px;color:var(--body);line-height:1.65;margin:0 0 10px}
  .ls-author-more{font-size:13px;color:var(--gold)}
  .ls-sources{margin:28px 0;font-size:14px;color:#6b5a52}
  .ls-sources summary{cursor:pointer;font-weight:600;color:var(--ink)}
  .ls-sources ol{margin-top:10px}
  .ls-footer{text-align:center;padding:40px 20px;border-top:1px solid var(--border);margin-top:60px;color:var(--muted);font-size:13px}
  .ls-footer a{color:var(--muted);margin:0 8px}
</style>
<script type="application/ld+json">${schema}</script>
</head>
<body>
<div class="ls-wrap">
  <nav class="ls-crumbs" aria-label="Breadcrumb">
    <a href="/">Home</a> &rsaquo; <a href="/blog">Blog</a> &rsaquo; <a href="/blog/category/${escAttr(categorySlug)}">${esc(clusterLabel)}</a> &rsaquo; <span>${esc(post.title)}</span>
  </nav>
  <div class="ls-badges">
    <span class="ls-badge">${esc(clusterLabel)}</span>
    <span class="ls-badge">${esc(post.species)}</span>
    ${(post.tags ?? []).slice(0, 3).map((t) => `<span class="ls-badge">${esc(t)}</span>`).join("")}
  </div>
  <h1>${esc(post.title)}</h1>
  ${post.featured_image_url ? `<figure class="ls-hero"><img src="${escAttr(heroUrl)}" alt="${escAttr(heroAlt)}" width="1200" height="630" loading="eager" fetchpriority="high"/></figure>` : ""}
  <div class="ls-byline">
    <div class="ls-byline-name">
      ${author?.image_url ? `<img src="${escAttr(author.image_url)}" alt="${escAttr(author.name)}" class="ls-avatar"/>` : `<div class="ls-avatar-init">${esc((author?.short_name || "L").slice(0,1))}</div>`}
      <div>
        ${author ? `<a href="/author/${escAttr(author.slug)}">${esc(author.name)}</a>` : "Little Souls"}
        ${author ? `<div class="ls-byline-job">${esc(author.job_title)}</div>` : ""}
      </div>
    </div>
    <div class="ls-byline-meta">
      <span>${post.reading_time_minutes} min read</span>
      <span>${formatDate(post.published_at)}</span>
    </div>
  </div>
  ${post.tldr ? `<aside class="ls-tldr"><div class="ls-tldr-label">✨ Quick Answer</div><p>${esc(post.tldr)}</p></aside>` : ""}
  <article class="ls-article">
    ${bodyHtml}
  </article>
  ${faqBlock}
  <section class="ls-end-cta">
    <h2>${cluster === "D" ? "Somewhere to put the love that has nowhere to go" : cluster === "E" ? "The gift that makes them cry at the coffee table" : cluster === "G" ? "Now hear what they would say back" : "A reading that sounds like a love letter"}</h2>
    <p>${cluster === "D" ? "A cosmic reading becomes a keepsake — something to return to, on the hard days." : cluster === "E" ? "A cosmic reading of their pet, revealed the moment they click open." : cluster === "G" ? "SoulSpeak uses their chart to write in their voice. Start a conversation, free." : "Cinematic reveal. The stars read aloud for the one you love most."}</p>
    <a href="/?utm_source=blog&amp;utm_medium=cta&amp;utm_campaign=${escAttr(post.slug)}&amp;utm_content=end" class="btn">${cluster === "D" ? "Honor their chart →" : cluster === "E" ? "Send a reading →" : cluster === "G" ? "Talk to them →" : "Read my pet's chart →"}</a>
  </section>
  ${authorCard}
  ${sourcesBlock}
</div>
<footer class="ls-footer">
  <div>
    <a href="/">Home</a> <a href="/blog">Blog</a> <a href="/contact">Contact</a> <a href="/privacy">Privacy</a> <a href="/terms">Terms</a>
  </div>
  <div style="margin-top:12px">© Little Souls — cosmic readings for your pet</div>
</footer>
</body>
</html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slug = String(req.query.slug ?? "").trim();
  if (!slug) {
    res.status(400).send("missing slug");
    return;
  }
  try {
    const post = await fetchPost(slug);
    if (!post) {
      res.status(404).setHeader("Content-Type", "text/html; charset=utf-8").send(
        `<!DOCTYPE html><title>Not found</title><p>No post for <code>${esc(slug)}</code>.</p><a href="/blog">Back to blog</a>`,
      );
      return;
    }
    const html = renderHtml(post);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).send(html);
  } catch (err) {
    console.error("[blog-ssr] error", err);
    res.status(500).send("internal error");
  }
}
