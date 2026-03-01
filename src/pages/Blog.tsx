import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { ArrowRight, Clock, Search, Dog, Cat, Sparkles } from "lucide-react";

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

      <div style={{ background: '#FFFDF5', minHeight: '100vh' }}>
        <Navbar />

        {/* Hero Section */}
        <section className="pt-24 pb-12 px-4 relative overflow-hidden">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span
                className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full mb-4"
                style={{ background: '#faf6ef', border: '1px solid #e8ddd0', color: '#c4a265' }}
              >
                <Sparkles className="w-3 h-3" />
                Pet Wisdom
              </span>
              <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#3d2f2a' }}>
                Understand Your Pet's <span style={{ color: '#c4a265' }}>Cosmic Soul</span>
              </h1>
              <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: '#9a8578' }}>
                Expert insights into pet behavior, zodiac personalities, and what makes your furry friend truly unique.
              </p>
            </motion.div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#9a8578' }} />
                <input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c4a265]/50"
                  style={{ background: '#faf6ef', border: '1px solid #e8ddd0', color: '#3d2f2a', borderRadius: '10px' }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSpeciesFilter(null)}
                  className="px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
                  style={speciesFilter === null
                    ? { background: 'linear-gradient(135deg, #c4a265, #b8973e)', color: 'white', border: 'none', borderRadius: '10px' }
                    : { border: '1px solid #e8ddd0', color: '#5a4a42', borderRadius: '10px', background: 'transparent' }
                  }
                >
                  All
                </button>
                <button
                  onClick={() => setSpeciesFilter("dog")}
                  className="px-4 py-2 text-sm font-medium flex items-center gap-1 transition-opacity hover:opacity-90"
                  style={speciesFilter === "dog"
                    ? { background: 'linear-gradient(135deg, #c4a265, #b8973e)', color: 'white', border: 'none', borderRadius: '10px' }
                    : { border: '1px solid #e8ddd0', color: '#5a4a42', borderRadius: '10px', background: 'transparent' }
                  }
                >
                  <Dog className="w-4 h-4" />
                  Dogs
                </button>
                <button
                  onClick={() => setSpeciesFilter("cat")}
                  className="px-4 py-2 text-sm font-medium flex items-center gap-1 transition-opacity hover:opacity-90"
                  style={speciesFilter === "cat"
                    ? { background: 'linear-gradient(135deg, #c4a265, #b8973e)', color: 'white', border: 'none', borderRadius: '10px' }
                    : { border: '1px solid #e8ddd0', color: '#5a4a42', borderRadius: '10px', background: 'transparent' }
                  }
                >
                  <Cat className="w-4 h-4" />
                  Cats
                </button>
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
                  <div key={i} className="rounded-xl p-6 animate-pulse" style={{ background: 'white', border: '1px solid #e8ddd0' }}>
                    <div className="h-4 rounded w-1/4 mb-4" style={{ background: '#faf6ef' }} />
                    <div className="h-6 rounded w-3/4 mb-2" style={{ background: '#faf6ef' }} />
                    <div className="h-4 rounded w-full mb-4" style={{ background: '#faf6ef' }} />
                    <div className="h-4 rounded w-2/3" style={{ background: '#faf6ef' }} />
                  </div>
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <p className="mb-4" style={{ color: '#9a8578' }}>No articles found yet.</p>
                <button
                  onClick={() => navigate("/intake")}
                  className="inline-flex items-center gap-2 px-6 py-3 font-medium transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #c4a265, #b8973e)', color: 'white', border: 'none', borderRadius: '10px' }}
                >
                  Get Your Pet's Reading Instead
                  <ArrowRight className="h-4 w-4" />
                </button>
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
                      className="block p-6 h-full transition-all hover:shadow-lg hover:-translate-y-1"
                      style={{ background: 'white', border: '1px solid #e8ddd0', borderRadius: '16px' }}
                    >
                      <div className="flex items-center gap-2 mb-3">
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
                      <h2 className="text-lg font-semibold mb-2 line-clamp-2" style={{ color: '#3d2f2a' }}>
                        {post.title}
                      </h2>
                      <p className="text-sm mb-4 line-clamp-3" style={{ color: '#9a8578' }}>
                        {post.excerpt || post.meta_description}
                      </p>
                      <div className="flex items-center justify-between text-xs" style={{ color: '#9a8578' }}>
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
        <section className="py-16 px-4" style={{ background: '#faf6ef' }}>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#3d2f2a' }}>
              Ready to Discover Your Pet's True Personality?
            </h2>
            <p className="mb-6" style={{ color: '#9a8578' }}>
              Get a personalized cosmic reading that reveals your pet's unique traits, behaviors, and soul connection.
            </p>
            <button
              onClick={() => navigate("/intake")}
              className="inline-flex items-center gap-2 px-8 py-4 font-medium text-lg transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #c4a265, #b8973e)', color: 'white', border: 'none', borderRadius: '10px' }}
            >
              Get Your Pet's Free Reading
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>
    </>
  );
};

export default Blog;
