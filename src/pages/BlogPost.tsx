import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-24">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-3/4 mb-4" />
            <div className="h-4 bg-muted rounded w-1/2 mb-8" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-4 bg-muted rounded w-full" />
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

      <div className="min-h-screen bg-background">
        <Navbar />

        <article className="pt-24 pb-12 px-4">
          <div className="max-w-3xl mx-auto">
            {/* Back Link */}
            <Link
              to="/blog"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
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
                <Badge variant="secondary" className="capitalize">
                  {post.species === "dog" ? <Dog className="w-3 h-3 mr-1" /> : <Cat className="w-3 h-3 mr-1" />}
                  {post.species}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {post.category}
                </Badge>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {post.reading_time_minutes} min read
                  </span>
                  <span>{formatDate(post.published_at)}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </Button>
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
                    <h2 className="text-2xl font-semibold mt-10 mb-4 text-foreground border-b border-border pb-2">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl font-semibold mt-8 mb-3 text-foreground">{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-muted-foreground leading-relaxed mb-5 text-lg">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-2 mb-6 text-muted-foreground text-lg pl-4">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-2 mb-6 text-muted-foreground text-lg pl-4">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary pl-6 py-2 my-6 bg-muted/30 rounded-r-lg italic text-muted-foreground">
                      {children}
                    </blockquote>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-muted-foreground">{children}</em>
                  ),
                  hr: () => (
                    <hr className="my-8 border-border" />
                  ),
                  a: ({ href, children }) => {
                    if (href === "/intake") {
                      return (
                        <Button onClick={trackCTAClick} className="inline-flex my-4">
                          {children}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      );
                    }
                    return (
                      <a href={href} className="text-primary hover:underline font-medium">
                        {children}
                      </a>
                    );
                  },
                  code: ({ children }) => (
                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono text-primary">{children}</code>
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
              className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 rounded-2xl p-8 text-center mb-12"
            >
              <Sparkles className="w-8 h-8 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">
                Want to Truly Understand Your {post.species === "cat" ? "Cat" : "Dog"}?
              </h2>
              <p className="text-muted-foreground mb-6">
                Discover their unique cosmic personality, hidden traits, and what makes your bond so special.
              </p>
              <Button size="lg" onClick={trackCTAClick}>
                Get Your Pet's Free Cosmic Reading
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <section>
                <h3 className="text-xl font-semibold mb-4">Related Articles</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {relatedPosts.map((related) => (
                    <Link
                      key={related.id}
                      to={`/blog/${related.slug}`}
                      className="bg-card hover:bg-card/80 border border-border rounded-lg p-4 transition-all hover:shadow-md"
                    >
                      <h4 className="font-medium mb-2 line-clamp-2">{related.title}</h4>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
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
