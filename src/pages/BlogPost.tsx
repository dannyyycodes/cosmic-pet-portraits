import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { ArrowLeft, ArrowRight, Clock, Dog, Cat, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_description: string;
  excerpt: string;
  species: string;
  category: string;
  target_keyword: string;
  secondary_keywords: string[];
  reading_time_minutes: number;
  published_at: string;
  views: number;
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

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const fetchPost = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .single();

    if (error || !data) {
      console.error("Error fetching post:", error);
      navigate("/blog");
      return;
    }

    setPost(data);

    // Track page view
    trackView(data.id);

    // Fetch related posts
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

  const trackView = async (postId: string) => {
    // Increment view count via direct update (no RPC needed)
    try {
      await supabase
        .from("blog_posts")
        .update({ views: (post?.views || 0) + 1 })
        .eq("id", postId);
    } catch {
      // Silent fail is okay
    }

    // Track in analytics
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

  const trackCTAClick = async () => {
    if (!post) return;

    const sessionId = sessionStorage.getItem("session_id") || crypto.randomUUID();

    await supabase.from("blog_analytics").insert({
      blog_post_id: post.id,
      session_id: sessionId,
      event_type: "cta_click",
      referrer: document.referrer,
      user_agent: navigator.userAgent,
    });

    navigate("/intake");
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: post?.title,
        text: post?.meta_description,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div style={{ background: '#FFFDF5', minHeight: '100vh' }}>
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-24">
          <div className="animate-pulse">
            <div className="h-8 rounded w-3/4 mb-4" style={{ background: '#faf6ef' }} />
            <div className="h-4 rounded w-1/2 mb-8" style={{ background: '#faf6ef' }} />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-4 rounded w-full" style={{ background: '#faf6ef' }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <>
      <Helmet>
        <title>{post.title} | Little Souls Blog</title>
        <meta name="description" content={post.meta_description} />
        <meta name="keywords" content={[post.target_keyword, ...(post.secondary_keywords || [])].join(", ")} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.meta_description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://littlesouls.co/blog/${post.slug}`} />
        <link rel="canonical" href={`https://littlesouls.co/blog/${post.slug}`} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": post.title,
            "description": post.meta_description,
            "datePublished": post.published_at,
            "author": {
              "@type": "Organization",
              "name": "Little Souls"
            },
            "publisher": {
              "@type": "Organization",
              "name": "Little Souls",
              "url": "https://littlesouls.co"
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `https://littlesouls.co/blog/${post.slug}`
            }
          })}
        </script>
      </Helmet>

      <div style={{ background: '#FFFDF5', minHeight: '100vh' }}>
        <Navbar />

        <article className="pt-24 pb-12 px-4">
          <div className="max-w-3xl mx-auto">
            {/* Back Link */}
            <Link
              to="/blog"
              className="inline-flex items-center text-sm mb-6 transition-colors hover:opacity-80"
              style={{ color: '#9a8578' }}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Blog
            </Link>

            {/* Header */}
            <motion.header
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="inline-flex items-center text-xs capitalize px-2 py-1 rounded-full"
                  style={{ background: '#faf6ef', border: '1px solid #e8ddd0', color: '#c4a265' }}
                >
                  {post.species === "dog" ? <Dog className="w-3 h-3 mr-1" /> : <Cat className="w-3 h-3 mr-1" />}
                  {post.species}
                </span>
                <span
                  className="inline-flex items-center text-xs capitalize px-2 py-1 rounded-full"
                  style={{ background: '#faf6ef', border: '1px solid #e8ddd0', color: '#c4a265' }}
                >
                  {post.category}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#3d2f2a' }}>{post.title}</h1>

              <div className="flex items-center justify-between text-sm" style={{ color: '#9a8578' }}>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {post.reading_time_minutes} min read
                  </span>
                  <span>{formatDate(post.published_at)}</span>
                </div>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1 px-3 py-1 transition-opacity hover:opacity-80"
                  style={{ color: '#5a4a42' }}
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </motion.header>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="blog-content mb-12"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: () => null, // Hide H1s since we already show the title in the header
                  h2: ({ children }) => (
                    <h2 className="text-2xl font-semibold mt-10 mb-4 pb-2" style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#3d2f2a', borderBottom: '1px solid #e8ddd0' }}>{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl font-semibold mt-8 mb-3" style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#3d2f2a' }}>{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="leading-relaxed mb-5 text-lg" style={{ color: '#5a4a42' }}>{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-2 mb-6 text-lg pl-4" style={{ color: '#5a4a42' }}>{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-2 mb-6 text-lg pl-4" style={{ color: '#5a4a42' }}>{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="pl-6 py-2 my-6 rounded-r-lg italic" style={{ borderLeft: '4px solid #c4a265', background: '#faf6ef', color: '#9a8578' }}>
                      {children}
                    </blockquote>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold" style={{ color: '#3d2f2a' }}>{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic" style={{ color: '#9a8578' }}>{children}</em>
                  ),
                  hr: () => (
                    <hr className="my-8" style={{ borderColor: '#e8ddd0' }} />
                  ),
                  a: ({ href, children }) => {
                    if (href === "/intake") {
                      return (
                        <button
                          onClick={trackCTAClick}
                          className="inline-flex items-center gap-2 my-4 px-6 py-3 font-medium transition-opacity hover:opacity-90"
                          style={{ background: 'linear-gradient(135deg, #c4a265, #b8973e)', color: 'white', border: 'none', borderRadius: '10px' }}
                        >
                          {children}
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      );
                    }
                    return (
                      <a href={href} className="hover:underline font-medium" style={{ color: '#c4a265' }}>
                        {children}
                      </a>
                    );
                  },
                  code: ({ children }) => (
                    <code className="px-2 py-1 rounded text-sm font-mono" style={{ background: '#faf6ef', color: '#c4a265' }}>{children}</code>
                  ),
                }}
              >
                {post.content}
              </ReactMarkdown>
            </motion.div>

            {/* CTA Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="rounded-2xl p-8 text-center mb-12"
              style={{ background: '#faf6ef', border: '1px solid #e8ddd0' }}
            >
              <Sparkles className="w-8 h-8 mx-auto mb-4" style={{ color: '#c4a265' }} />
              <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#3d2f2a' }}>
                Want to Truly Understand Your {post.species === "cat" ? "Cat" : "Dog"}?
              </h2>
              <p className="mb-6" style={{ color: '#9a8578' }}>
                Discover their unique cosmic personality, hidden traits, and what makes your bond so special.
              </p>
              <button
                onClick={trackCTAClick}
                className="inline-flex items-center gap-2 px-8 py-4 font-medium text-lg transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #c4a265, #b8973e)', color: 'white', border: 'none', borderRadius: '10px' }}
              >
                Get Your Pet's Free Cosmic Reading
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <section>
                <h3 className="text-xl font-semibold mb-4" style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#3d2f2a' }}>Related Articles</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {relatedPosts.map((related) => (
                    <Link
                      key={related.id}
                      to={`/blog/${related.slug}`}
                      className="p-4 transition-all hover:shadow-md"
                      style={{ background: 'white', border: '1px solid #e8ddd0', borderRadius: '16px' }}
                    >
                      <h4 className="font-medium mb-2 line-clamp-2" style={{ color: '#3d2f2a' }}>{related.title}</h4>
                      <span className="text-xs flex items-center gap-1" style={{ color: '#9a8578' }}>
                        <Clock className="w-3 h-3" />
                        {related.reading_time_minutes} min read
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
