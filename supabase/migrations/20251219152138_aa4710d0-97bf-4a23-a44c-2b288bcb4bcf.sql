-- Create translations cache table
CREATE TABLE public.translation_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_text TEXT NOT NULL,
  target_language TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(source_text, target_language)
);

-- Enable RLS but allow public read/write for caching
ALTER TABLE public.translation_cache ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read translations (public content)
CREATE POLICY "Translations are publicly readable" 
ON public.translation_cache 
FOR SELECT 
USING (true);

-- Allow edge function to insert translations (using service role)
CREATE POLICY "Service role can insert translations" 
ON public.translation_cache 
FOR INSERT 
WITH CHECK (true);

-- Create index for fast lookups
CREATE INDEX idx_translation_cache_lookup ON public.translation_cache(source_text, target_language);