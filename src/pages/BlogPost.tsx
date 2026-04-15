import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { ArrowLeft, ArrowRight, Clock, Dog, Cat, Share2, Sparkles, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Author {
  slug: string;
  name: string;
  short_name: string;
  job_title: string;
  description: string;
  long_bio: string;
  image_url: string | null;
  knows_about: string[];
  same_as: string[];
}

interface FAQ {
  question: string;
  answer: string;
}

interface Source {
  title: string;
  url: string;
  publisher?: string;
}

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_description: string;
  excerpt: string;
  species: string;
  category: string;
  cluster: string | null;
  is_pillar: boolean | null;
  tags: string[] | null;
  tldr: string | null;
  hero_alt: string | null;
  target_keyword: string;
  secondary_keywords: string[];
  reading_time_minutes: number;
  published_at: string;
  date_modified: string | null;
  views: number;
  word_count: number | null;
  author_slug: string | null;
  author: Author | null;
  faq: FAQ[] | null;
  sources: Source[] | null;
  cta_middle_url: string | null;
  cta_end_url: string | null;
  featured_image_url: string | null;
}

interface RelatedPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  species: string;
  reading_time_minutes: number;
  published_at: string;
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

const SITE = "https://littlesouls.app";
const ORG_ID = `${SITE}/#organization`;
const WEBSITE_ID = `${SITE}/#website`;

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);

  useEffect(() => {
    if (slug) fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*, author:authors!blog_posts_author_slug_fkey(*)")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (error || !data) {
      console.error("Error fetching post:", error);
      navigate("/blog");
      return;
    }

    setPost(data as BlogPost);
    trackView(data.id, data.views ?? 0);

    const { data: related } = await supabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, species, reading_time_minutes, published_at")
      .eq("is_published", true)
      .eq("species", data.species)
      .neq("id", data.id)
      .limit(3);

    setRelatedPosts(related || []);
    setLoading(false);
  };

  const trackView = async (postId: string, currentViews: number) => {
    try {
      await supabase.from("blog_posts").update({ views: currentViews + 1 }).eq("id", postId);
    } catch {}
    const sessionId = sessionStorage.getItem("session_id") || crypto.randomUUID();
    sessionStorage.setItem("session_id", sessionId);
    await supabase.from("blog_analytics").insert({
      blog_post_id: postId,
      session_id: sessionId,
      event_type: "view",
      referrer: document.referrer,
      user_agent: navigator.userAgent,
    });
  };

  const trackCTAClick = async (url: string) => {
    if (!post) return;
    const sessionId = sessionStorage.getItem("session_id") || crypto.randomUUID();
    await supabase.from("blog_analytics").insert({
      blog_post_id: post.id,
      session_id: sessionId,
      event_type: "cta_click",
      referrer: document.referrer,
      user_agent: navigator.userAgent,
    });
    navigate(url);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: post?.title, text: post?.meta_description, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  if (loading) {
    return (
      <div style={{ background: "#FFFDF5", minHeight: "100vh" }}>
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-24">
          <div className="animate-pulse">
            <div className="h-8 rounded w-3/4 mb-4" style={{ background: "#faf6ef" }} />
            <div className="h-4 rounded w-1/2 mb-8" style={{ background: "#faf6ef" }} />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-4 rounded w-full" style={{ background: "#faf6ef" }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) return null;

  const cluster = post.cluster ?? "A";
  const clusterLabel = CLUSTER_LABEL[cluster] ?? "Pet Astrology";
  const categorySlug = clusterLabel.toLowerCase().replace(/\s+/g, "-");
  const author = post.author;
  const ctaMiddle = post.cta_middle_url ?? "/checkout";
  const ctaEnd = post.cta_end_url ?? "/checkout";
  const heroUrl = post.featured_image_url || `${SITE}/og-cosmic-pet-portraits.jpg`;
  const heroAlt = post.hero_alt ?? post.title;
  const publishedIso = post.published_at;
  const modifiedIso = post.date_modified ?? post.published_at;

  // @graph: WebPage · BreadcrumbList · Article · Person · ImageObject · FAQPage
  const graph: unknown[] = [
    {
      "@type": "WebPage",
      "@id": `${SITE}/blog/${post.slug}#webpage`,
      url: `${SITE}/blog/${post.slug}`,
      name: post.title,
      isPartOf: { "@id": WEBSITE_ID },
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
      author: author ? { "@id": `${SITE}/author/${author.slug}#person` } : { "@id": ORG_ID },
      publisher: { "@id": ORG_ID },
      articleSection: clusterLabel,
      keywords: (post.tags || []).concat(post.secondary_keywords || []).join(", "),
      wordCount: post.word_count ?? undefined,
      inLanguage: "en-US",
      citation: (post.sources || []).map((s) => ({
        "@type": "CreativeWork",
        name: s.title,
        url: s.url,
        publisher: s.publisher ?? undefined,
      })),
    },
    {
      "@type": "ImageObject",
      "@id": `${SITE}/blog/${post.slug}#hero`,
      url: heroUrl,
      contentUrl: heroUrl,
      width: 1200,
      height: 630,
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
      worksFor: { "@id": ORG_ID },
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

  const schema = { "@context": "https://schema.org", "@graph": graph };

  return (
    <>
      <Helmet>
        <title>{post.title} | Little Souls</title>
        <meta name="description" content={post.meta_description} />
        <meta name="keywords" content={[post.target_keyword, ...(post.secondary_keywords || [])].join(", ")} />
        <meta name="author" content={author?.name ?? "Little Souls"} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.meta_description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${SITE}/blog/${post.slug}`} />
        <meta property="og:image" content={heroUrl} />
        <meta property="article:published_time" content={publishedIso} />
        <meta property="article:modified_time" content={modifiedIso} />
        {author && <meta property="article:author" content={author.name} />}
        <meta property="article:section" content={clusterLabel} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.meta_description} />
        <meta name="twitter:image" content={heroUrl} />
        <link rel="canonical" href={`${SITE}/blog/${post.slug}`} />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      <div style={{ background: "#FFFDF5", minHeight: "100vh" }}>
        <Navbar />

        <article className="pt-24 pb-12 px-4">
          <div className="max-w-3xl mx-auto">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-6 text-xs flex items-center flex-wrap gap-1" style={{ color: "#9a8578" }}>
              <Link to="/" className="hover:underline">Home</Link>
              <ChevronRight className="w-3 h-3" />
              <Link to="/blog" className="hover:underline">Blog</Link>
              <ChevronRight className="w-3 h-3" />
              <Link to={`/blog/category/${categorySlug}`} className="hover:underline">{clusterLabel}</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="line-clamp-1" style={{ color: "#5a4a42" }}>{post.title}</span>
            </nav>

            {/* Back link */}
            <Link to="/blog" className="inline-flex items-center text-sm mb-6 hover:opacity-80" style={{ color: "#9a8578" }}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Blog
            </Link>

            {/* Badges */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="inline-flex items-center text-xs px-2 py-1 rounded-full" style={{ background: "#fdf7e8", border: "1px solid #e8ddd0", color: "#8a6a2e" }}>
                {clusterLabel}
              </span>
              <span className="inline-flex items-center text-xs capitalize px-2 py-1 rounded-full" style={{ background: "#faf6ef", border: "1px solid #e8ddd0", color: "#c4a265" }}>
                {post.species === "cat" ? <Cat className="w-3 h-3 mr-1" /> : <Dog className="w-3 h-3 mr-1" />}
                {post.species}
              </span>
              {(post.tags ?? []).slice(0, 3).map((t) => (
                <span key={t} className="text-xs px-2 py-1 rounded-full" style={{ background: "#faf6ef", border: "1px solid #e8ddd0", color: "#c4a265" }}>
                  {t}
                </span>
              ))}
            </div>

            {/* H1 */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-5xl font-bold mb-6 leading-tight"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: "#3d2f2a" }}
            >
              {post.title}
            </motion.h1>

            {/* Hero image */}
            {post.featured_image_url && (
              <motion.figure
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="mb-8 -mx-4 md:mx-0"
              >
                <img
                  src={post.featured_image_url}
                  alt={heroAlt}
                  loading="eager"
                  fetchPriority="high"
                  width={1200}
                  height={630}
                  className="w-full aspect-[1200/630] object-cover md:rounded-2xl"
                  style={{ background: "#f5efe6" }}
                />
              </motion.figure>
            )}

            {/* Byline */}
            <div className="flex items-center justify-between py-4 mb-8 border-y flex-wrap gap-3" style={{ borderColor: "#e8ddd0" }}>
              <div className="flex items-center gap-3">
                {author?.image_url ? (
                  <img src={author.image_url} alt={author.name} className="w-12 h-12 rounded-full object-cover" style={{ boxShadow: "0 0 0 2px rgba(196,162,101,0.4)" }} />
                ) : (
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#fdf7e8,#faf0d8)", boxShadow: "0 0 0 2px rgba(196,162,101,0.4)", color: "#8a6a2e", fontFamily: "'DM Serif Display', Georgia, serif" }}>
                    {author?.short_name?.[0] ?? "L"}
                  </div>
                )}
                <div>
                  {author ? (
                    <>
                      <Link to={`/author/${author.slug}`} className="font-semibold hover:underline" style={{ color: "#3d2f2a" }}>
                        {author.name}
                      </Link>
                      <div className="text-xs" style={{ color: "#9a8578" }}>{author.job_title}</div>
                    </>
                  ) : (
                    <div className="font-semibold" style={{ color: "#3d2f2a" }}>Little Souls</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs" style={{ color: "#9a8578" }}>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.reading_time_minutes} min</span>
                <span>{formatDate(post.published_at)}</span>
                <button onClick={handleShare} className="flex items-center gap-1 hover:opacity-80">
                  <Share2 className="w-3 h-3" />Share
                </button>
              </div>
            </div>

            {/* TL;DR */}
            {post.tldr && (
              <motion.aside
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl p-6 mb-10 shadow-sm"
                style={{ background: "linear-gradient(135deg,#fdf7e8,#faf0d8)", borderLeft: "4px solid #c4a265" }}
              >
                <div className="text-xs uppercase tracking-widest mb-2 flex items-center gap-2" style={{ color: "#8a6a2e" }}>
                  <Sparkles className="w-3 h-3" />
                  Quick Answer
                </div>
                <p className="text-base md:text-lg leading-relaxed" style={{ color: "#3d2f2a" }}>
                  {post.tldr}
                </p>
              </motion.aside>
            )}

            {/* Body */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="blog-content mb-12"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: () => null,
                  h2: ({ children }) => (
                    <h2 className="text-2xl md:text-3xl font-semibold mt-10 mb-4 pb-2" style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: "#3d2f2a", borderBottom: "1px solid #e8ddd0" }}>{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl font-semibold mt-8 mb-3" style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: "#3d2f2a" }}>{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="leading-relaxed mb-5 text-lg" style={{ color: "#5a4a42" }}>{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-2 mb-6 text-lg pl-4" style={{ color: "#5a4a42" }}>{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-2 mb-6 text-lg pl-4" style={{ color: "#5a4a42" }}>{children}</ol>
                  ),
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  blockquote: ({ children }) => (
                    <blockquote className="my-8 rounded-2xl p-6 md:p-8" style={{ background: "linear-gradient(135deg,#c4a265,#b8973e)", color: "white" }}>
                      <div className="text-lg font-medium">{children}</div>
                    </blockquote>
                  ),
                  strong: ({ children }) => <strong className="font-semibold" style={{ color: "#3d2f2a" }}>{children}</strong>,
                  em: ({ children }) => <em className="italic" style={{ color: "#9a8578" }}>{children}</em>,
                  hr: () => <hr className="my-8" style={{ borderColor: "#e8ddd0" }} />,
                  a: ({ href, children }) => {
                    const h = href || "";
                    const isCta = h === ctaMiddle || h === ctaEnd || h === "/checkout" || h === "/gift-v2" || h === "/soul-chat" || h === "/intake" || h.startsWith("/checkout?");
                    if (isCta) {
                      const isMemorial = h.includes("intent=memorial") || h === "/soul-chat";
                      return (
                        <button
                          onClick={() => trackCTAClick(h)}
                          className="inline-flex items-center gap-2 my-4 px-6 py-3 font-medium transition-opacity hover:opacity-90"
                          style={{
                            background: isMemorial ? "#3d2f2a" : "linear-gradient(135deg,#c4a265,#b8973e)",
                            color: isMemorial ? "#FFFDF5" : "white",
                            border: "none",
                            borderRadius: "10px",
                          }}
                        >
                          {children}
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      );
                    }
                    const external = /^https?:\/\//.test(h);
                    return (
                      <a
                        href={h}
                        target={external ? "_blank" : undefined}
                        rel={external ? "nofollow noopener noreferrer" : undefined}
                        className="hover:underline font-medium"
                        style={{ color: "#c4a265" }}
                      >
                        {children}
                      </a>
                    );
                  },
                  code: ({ children }) => (
                    <code className="px-2 py-1 rounded text-sm font-mono" style={{ background: "#faf6ef", color: "#c4a265" }}>{children}</code>
                  ),
                }}
              >
                {post.content}
              </ReactMarkdown>
            </motion.div>

            {/* FAQ */}
            {Array.isArray(post.faq) && post.faq.length > 0 && (
              <section className="mb-12" aria-labelledby="faq-heading">
                <h2 id="faq-heading" className="text-2xl md:text-3xl font-semibold mb-6 pb-2" style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: "#3d2f2a", borderBottom: "1px solid #e8ddd0" }}>
                  Frequently asked questions
                </h2>
                <div className="space-y-4">
                  {post.faq.map((f, i) => (
                    <div key={i} className="rounded-xl p-5" style={{ background: "white", border: "1px solid #e8ddd0" }}>
                      <h3 className="font-semibold mb-2" style={{ color: "#3d2f2a", fontFamily: "'DM Serif Display', Georgia, serif" }}>{f.question}</h3>
                      <p className="text-base leading-relaxed" style={{ color: "#5a4a42" }}>{f.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* End CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-3xl p-10 text-center mb-12"
              style={{ background: "#3d2f2a", color: "#FFFDF5" }}
            >
              <Sparkles className="w-8 h-8 mx-auto mb-4" style={{ color: "#c4a265" }} />
              <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>
                {cluster === "D"
                  ? "Somewhere to put the love that has nowhere to go"
                  : cluster === "E"
                  ? "The gift that makes them cry at the coffee table"
                  : cluster === "G"
                  ? `Now hear what ${post.species === "cat" ? "they" : "they"} would say back`
                  : `A reading that sounds like a love letter`}
              </h2>
              <p className="mb-6 opacity-90 max-w-xl mx-auto">
                {cluster === "D"
                  ? "A cosmic reading becomes a keepsake — something to return to, on the hard days."
                  : cluster === "E"
                  ? "A cosmic reading of their pet, revealed the moment they click open. £27."
                  : cluster === "G"
                  ? "SoulSpeak uses their chart to write in their voice. Start a conversation, free."
                  : "£27. Cinematic reveal. The stars read aloud for the one you love most."}
              </p>
              <button
                onClick={() => trackCTAClick(ctaEnd)}
                className="inline-flex items-center gap-2 px-8 py-4 font-medium text-lg transition-opacity hover:opacity-90"
                style={{ background: "#c4a265", color: "#3d2f2a", border: "none", borderRadius: "10px" }}
              >
                {cluster === "D" ? "Honor their chart" : cluster === "E" ? "Send a reading" : cluster === "G" ? "Talk to them" : "Read my pet's chart"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>

            {/* Author card */}
            {author && (
              <section className="rounded-2xl p-6 mb-12" style={{ background: "white", border: "1px solid #e8ddd0" }}>
                <div className="flex gap-4 items-start">
                  {author.image_url ? (
                    <img src={author.image_url} alt={author.name} className="w-20 h-20 rounded-full object-cover flex-shrink-0" style={{ boxShadow: "0 0 0 2px rgba(196,162,101,0.4)" }} />
                  ) : (
                    <div className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 text-2xl" style={{ background: "linear-gradient(135deg,#fdf7e8,#faf0d8)", boxShadow: "0 0 0 2px rgba(196,162,101,0.4)", color: "#8a6a2e", fontFamily: "'DM Serif Display', Georgia, serif" }}>
                      {author.short_name?.[0] ?? "L"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Link to={`/author/${author.slug}`} className="text-xl font-semibold hover:underline block" style={{ color: "#3d2f2a", fontFamily: "'DM Serif Display', Georgia, serif" }}>
                      {author.name}
                    </Link>
                    <div className="text-sm mb-2" style={{ color: "#c4a265" }}>{author.job_title}</div>
                    <p className="text-sm leading-relaxed" style={{ color: "#5a4a42" }}>{author.description}</p>
                    <Link to={`/author/${author.slug}`} className="text-sm mt-3 inline-flex items-center gap-1 hover:underline" style={{ color: "#c4a265" }}>
                      More from {author.short_name}
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </section>
            )}

            {/* Sources */}
            {Array.isArray(post.sources) && post.sources.length > 0 && (
              <details className="mb-12 text-sm" style={{ color: "#6b5a52" }}>
                <summary className="cursor-pointer font-medium mb-2" style={{ color: "#3d2f2a" }}>Sources</summary>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  {post.sources.map((s, i) => (
                    <li key={i}>
                      <a href={s.url} target="_blank" rel="nofollow noopener noreferrer" className="hover:underline" style={{ color: "#c4a265" }}>
                        {s.title}
                      </a>
                      {s.publisher ? ` — ${s.publisher}` : ""}
                    </li>
                  ))}
                </ol>
              </details>
            )}

            {/* Related */}
            {relatedPosts.length > 0 && (
              <section>
                <h3 className="text-xl font-semibold mb-4" style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: "#3d2f2a" }}>Related Articles</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {relatedPosts.map((r) => (
                    <Link key={r.id} to={`/blog/${r.slug}`} className="p-4 transition-all hover:shadow-md" style={{ background: "white", border: "1px solid #e8ddd0", borderRadius: "16px" }}>
                      <h4 className="font-medium mb-2 line-clamp-2" style={{ color: "#3d2f2a" }}>{r.title}</h4>
                      <span className="text-xs flex items-center gap-1" style={{ color: "#9a8578" }}>
                        <Clock className="w-3 h-3" />{r.reading_time_minutes} min read
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </article>
      </div>
    </>
  );
};

export default BlogPost;
