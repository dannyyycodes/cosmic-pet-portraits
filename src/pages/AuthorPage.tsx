import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import { ChevronRight, Clock, Sparkles } from "lucide-react";

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

interface AuthorPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  species: string;
  reading_time_minutes: number;
  published_at: string;
  cluster: string | null;
}

const SITE = "https://littlesouls.app";
const ORG_ID = `${SITE}/#organization`;

const AuthorPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [author, setAuthor] = useState<Author | null>(null);
  const [posts, setPosts] = useState<AuthorPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) load();
  }, [slug]);

  const load = async () => {
    setLoading(true);
    const { data: a } = await supabase.from("authors").select("*").eq("slug", slug).maybeSingle();
    if (!a) {
      navigate("/blog");
      return;
    }
    setAuthor(a as Author);
    const { data: p } = await supabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, species, reading_time_minutes, published_at, cluster")
      .eq("is_published", true)
      .eq("author_slug", slug)
      .order("published_at", { ascending: false })
      .limit(60);
    setPosts((p ?? []) as AuthorPost[]);
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ background: "#FFFDF5", minHeight: "100vh" }}>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-24">
          <div className="animate-pulse space-y-4">
            <div className="h-8 rounded w-1/2" style={{ background: "#faf6ef" }} />
            <div className="h-4 rounded w-3/4" style={{ background: "#faf6ef" }} />
          </div>
        </div>
      </div>
    );
  }

  if (!author) return null;

  const graph: unknown[] = [
    {
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
    },
    {
      "@type": "CollectionPage",
      "@id": `${SITE}/author/${author.slug}#collection`,
      url: `${SITE}/author/${author.slug}`,
      name: `Posts by ${author.name}`,
      about: { "@id": `${SITE}/author/${author.slug}#person` },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Authors", item: `${SITE}/blog` },
        { "@type": "ListItem", position: 3, name: author.name },
      ],
    },
  ];

  const schema = { "@context": "https://schema.org", "@graph": graph };

  return (
    <>
      <Helmet>
        <title>{author.name} — Author at Little Souls</title>
        <meta name="description" content={author.description} />
        <meta property="og:title" content={`${author.name} — Little Souls`} />
        <meta property="og:description" content={author.description} />
        <meta property="og:url" content={`${SITE}/author/${author.slug}`} />
        <meta property="og:type" content="profile" />
        {author.image_url && <meta property="og:image" content={author.image_url} />}
        <link rel="canonical" href={`${SITE}/author/${author.slug}`} />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      <div style={{ background: "#FFFDF5", minHeight: "100vh" }}>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
          <nav aria-label="Breadcrumb" className="mb-6 text-xs flex items-center gap-1" style={{ color: "#9a8578" }}>
            <Link to="/" className="hover:underline">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/blog" className="hover:underline">Blog</Link>
            <ChevronRight className="w-3 h-3" />
            <span style={{ color: "#5a4a42" }}>{author.name}</span>
          </nav>

          <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row gap-6 items-start mb-12"
          >
            {author.image_url ? (
              <img src={author.image_url} alt={author.name} className="w-32 h-32 rounded-full object-cover flex-shrink-0" style={{ boxShadow: "0 0 0 3px rgba(196,162,101,0.5)" }} />
            ) : (
              <div className="w-32 h-32 rounded-full flex items-center justify-center flex-shrink-0 text-5xl" style={{ background: "linear-gradient(135deg,#fdf7e8,#faf0d8)", boxShadow: "0 0 0 3px rgba(196,162,101,0.5)", color: "#8a6a2e", fontFamily: "'DM Serif Display', Georgia, serif" }}>
                {author.short_name?.[0] ?? "L"}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold mb-2" style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: "#3d2f2a" }}>
                {author.name}
              </h1>
              <div className="text-base mb-4 flex items-center gap-2" style={{ color: "#c4a265" }}>
                <Sparkles className="w-4 h-4" />
                {author.job_title}
              </div>
              <p className="text-lg leading-relaxed" style={{ color: "#5a4a42" }}>
                {author.long_bio}
              </p>
              {author.knows_about?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {author.knows_about.slice(0, 6).map((k) => (
                    <span key={k} className="text-xs px-2 py-1 rounded-full" style={{ background: "#faf6ef", border: "1px solid #e8ddd0", color: "#8a6a2e" }}>
                      {k}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.header>

          <h2 className="text-2xl font-semibold mb-4 pb-2" style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: "#3d2f2a", borderBottom: "1px solid #e8ddd0" }}>
            Posts by {author.short_name}
          </h2>

          {posts.length === 0 ? (
            <p className="text-base" style={{ color: "#9a8578" }}>No posts published yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {posts.map((p) => (
                <Link
                  key={p.id}
                  to={`/blog/${p.slug}`}
                  className="p-6 transition-all hover:shadow-md"
                  style={{ background: "white", border: "1px solid #e8ddd0", borderRadius: "16px" }}
                >
                  <h3 className="text-lg font-semibold mb-2 line-clamp-2" style={{ color: "#3d2f2a", fontFamily: "'DM Serif Display', Georgia, serif" }}>
                    {p.title}
                  </h3>
                  {p.excerpt && <p className="text-sm mb-3 line-clamp-2" style={{ color: "#5a4a42" }}>{p.excerpt}</p>}
                  <div className="flex items-center gap-3 text-xs" style={{ color: "#9a8578" }}>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{p.reading_time_minutes} min</span>
                    <span className="capitalize">{p.species}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AuthorPage;
