import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock, Search, Dog, Cat, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  meta_description: string;
  species: string;
  category: string;
  reading_time_minutes: number;
  published_at: string;
  views: number;
}

const Blog = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [speciesFilter]);

  const fetchPosts = async () => {
    setLoading(true);
    let query = supabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, meta_description, species, category, reading_time_minutes, published_at, views")
      .eq("is_published", true)
      .order("published_at", { ascending: false });

    if (speciesFilter) {
      query = query.eq("species", speciesFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching posts:", error);
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
      <Helmet>
        <title>Pet Behavior & Astrology Blog | Little Souls</title>
        <meta
          name="description"
          content="Discover why your pet does what they do. Expert articles on dog and cat behavior, zodiac personalities, and cosmic pet insights."
        />
        <meta property="og:title" content="Pet Behavior & Astrology Blog | Little Souls" />
        <meta property="og:description" content="Discover why your pet does what they do. Expert articles on dog and cat behavior, zodiac personalities, and cosmic pet insights." />
        <link rel="canonical" href="https://littlesouls.co/blog" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            "name": "Little Souls Blog",
            "description": "Expert articles on pet behavior and cosmic pet personalities",
            "url": "https://littlesouls.co/blog",
            "publisher": {
              "@type": "Organization",
              "name": "Little Souls",
              "url": "https://littlesouls.co"
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />

        {/* Hero Section */}
        <section className="pt-24 pb-12 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                <Sparkles className="w-3 h-3 mr-1" />
                Pet Wisdom
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Understand Your Pet's <span className="text-primary">Cosmic Soul</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Expert insights into pet behavior, zodiac personalities, and what makes your furry friend truly unique.
              </p>
            </motion.div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={speciesFilter === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSpeciesFilter(null)}
                >
                  All
                </Button>
                <Button
                  variant={speciesFilter === "dog" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSpeciesFilter("dog")}
                >
                  <Dog className="w-4 h-4 mr-1" />
                  Dogs
                </Button>
                <Button
                  variant={speciesFilter === "cat" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSpeciesFilter("cat")}
                >
                  <Cat className="w-4 h-4 mr-1" />
                  Cats
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-card rounded-xl p-6 animate-pulse">
                    <div className="h-4 bg-muted rounded w-1/4 mb-4" />
                    <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-full mb-4" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No articles found yet.</p>
                <Button onClick={() => navigate("/intake")}>
                  Get Your Pet's Reading Instead
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map((post, index) => (
                  <motion.article
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Link
                      to={`/blog/${post.slug}`}
                      className="block bg-card hover:bg-card/80 border border-border rounded-xl p-6 h-full transition-all hover:shadow-lg hover:-translate-y-1"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary" className="text-xs capitalize">
                          {post.species === "dog" ? <Dog className="w-3 h-3 mr-1" /> : <Cat className="w-3 h-3 mr-1" />}
                          {post.species}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {post.category}
                        </Badge>
                      </div>
                      <h2 className="text-lg font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h2>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {post.excerpt || post.meta_description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.reading_time_minutes} min read
                        </span>
                        <span>{formatDate(post.published_at)}</span>
                      </div>
                    </Link>
                  </motion.article>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Discover Your Pet's True Personality?
            </h2>
            <p className="text-muted-foreground mb-6">
              Get a personalized cosmic reading that reveals your pet's unique traits, behaviors, and soul connection.
            </p>
            <Button size="lg" onClick={() => navigate("/intake")}>
              Get Your Pet's Free Reading
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>
      </div>
    </>
  );
};

export default Blog;
