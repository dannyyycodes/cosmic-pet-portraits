-- Create blog_posts table for SEO content
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  target_keyword TEXT NOT NULL,
  secondary_keywords TEXT[],
  species TEXT DEFAULT 'dog',
  category TEXT DEFAULT 'behavior',
  featured_image_url TEXT,
  views INTEGER DEFAULT 0,
  cta_clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  reading_time_minutes INTEGER DEFAULT 5,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Public read access for published posts (SEO crawlers need this)
CREATE POLICY "Anyone can read published blog posts"
  ON public.blog_posts
  FOR SELECT
  USING (is_published = true);

-- Create index for slug lookups (SEO URLs)
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);

-- Create index for published posts ordering
CREATE INDEX idx_blog_posts_published ON public.blog_posts(is_published, published_at DESC);

-- Create index for keyword searches
CREATE INDEX idx_blog_posts_keyword ON public.blog_posts(target_keyword);

-- Create index for species filtering
CREATE INDEX idx_blog_posts_species ON public.blog_posts(species);

-- Add trigger for updated_at
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create blog analytics table for detailed tracking
CREATE TABLE public.blog_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on analytics
ALTER TABLE public.blog_analytics ENABLE ROW LEVEL SECURITY;

-- Allow inserts for tracking (public)
CREATE POLICY "Anyone can insert blog analytics"
  ON public.blog_analytics
  FOR INSERT
  WITH CHECK (true);