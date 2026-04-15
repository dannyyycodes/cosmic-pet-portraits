-- Phase 3 blog engine: extend blog_posts, create authors, seed 5 characters, seed Month 1 calendar
-- Source of truth: /c/Users/danie/cosmic-pet-portraits/docs/phase2-*.md

-- =========================================================================
-- 1. authors table
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.authors (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  description TEXT NOT NULL,
  long_bio TEXT NOT NULL,
  image_url TEXT,
  knows_about TEXT[] NOT NULL DEFAULT '{}',
  same_as TEXT[] NOT NULL DEFAULT '{}',
  voice_profile TEXT NOT NULL,
  voice_dos TEXT[] NOT NULL DEFAULT '{}',
  voice_donts TEXT[] NOT NULL DEFAULT '{}',
  primary_clusters TEXT[] NOT NULL DEFAULT '{}',
  secondary_clusters TEXT[] NOT NULL DEFAULT '{}',
  never_writes_clusters TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read authors"
  ON public.authors FOR SELECT
  USING (true);

CREATE TRIGGER update_authors_updated_at
  BEFORE UPDATE ON public.authors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================================
-- 2. blog_posts — add AEO + Phase 3 columns
-- =========================================================================
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS author_slug TEXT REFERENCES public.authors(slug),
  ADD COLUMN IF NOT EXISTS cluster TEXT,                   -- A..G
  ADD COLUMN IF NOT EXISTS is_pillar BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS anchor_variants TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tldr TEXT,
  ADD COLUMN IF NOT EXISTS faq JSONB DEFAULT '[]'::jsonb,  -- [{question, answer}]
  ADD COLUMN IF NOT EXISTS hero_alt TEXT,
  ADD COLUMN IF NOT EXISTS target_query TEXT,
  ADD COLUMN IF NOT EXISTS cta_middle_url TEXT DEFAULT '/checkout',
  ADD COLUMN IF NOT EXISTS cta_end_url TEXT DEFAULT '/checkout',
  ADD COLUMN IF NOT EXISTS date_modified TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS word_count INTEGER,
  ADD COLUMN IF NOT EXISTS sources JSONB DEFAULT '[]'::jsonb;  -- [{title, url, publisher}]

CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON public.blog_posts(author_slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_cluster ON public.blog_posts(cluster);
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON public.blog_posts USING GIN(tags);

-- =========================================================================
-- 3. blog_topics — extend with calendar fields
-- =========================================================================
ALTER TABLE public.blog_topics
  ADD COLUMN IF NOT EXISTS cluster TEXT,
  ADD COLUMN IF NOT EXISTS is_pillar BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS author_slug TEXT REFERENCES public.authors(slug),
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS scheduled_for DATE,
  ADD COLUMN IF NOT EXISTS cta_url TEXT DEFAULT '/checkout',
  ADD COLUMN IF NOT EXISTS working_title TEXT,
  ADD COLUMN IF NOT EXISTS target_keyword TEXT;

CREATE INDEX IF NOT EXISTS idx_blog_topics_scheduled ON public.blog_topics(is_used, scheduled_for);

-- =========================================================================
-- 4. Seed 5 characters
-- =========================================================================
INSERT INTO public.authors (
  slug, name, short_name, job_title, description, long_bio, image_url,
  knows_about, same_as, voice_profile, voice_dos, voice_donts,
  primary_clusters, secondary_clusters, never_writes_clusters
) VALUES
(
  'elena-whitaker',
  'Dr. Elena Whitaker, DVM',
  'Elena',
  'Integrative Veterinarian & Contributing Writer',
  'Portland-based integrative veterinarian with 18 years of clinical experience across shelter and private practice. Writes about the overlap of pet health, behavior, and emotional wellbeing.',
  'Veterinarian for eighteen years — first six in high-volume shelter medicine in Sacramento, last twelve running a small integrative practice in Portland. UC Davis-trained. Lives with a 12-year-old cattle dog mix named Pilot and a tortoiseshell named Mrs. Doyle. Writes for Little Souls because the readings do what a good intake form does — they ask the owner to really look at their animal. Most "behavior problems" are bodies talking.',
  NULL,
  ARRAY['veterinary medicine','integrative pet care','animal behavior','pet nutrition','canine and feline health','pet emotional wellbeing'],
  ARRAY['https://www.linkedin.com/in/elena-whitaker-dvm-PLACEHOLDER'],
  'Clinical-but-warm, plainspoken, reassuring, evidence-anchored, quietly funny. Medium-length declaratives, occasional short beat for emphasis. Signature worldview: behaviour is biology until proven otherwise.',
  ARRAY['"In my exam room,"','"the body keeps the score,"','"a quiet symptom,"','"nervous-system stuff,"','"the whole animal,"','"what I see clinically,"','"worth a conversation with your vet,"','"bodies talking"'],
  ARRAY['"Fur baby,"','"shocking truth,"','"doctors hate this trick,"','promises a cure','woo-woo language untethered from observation'],
  ARRAY['B','G'],
  ARRAY['A','F'],
  ARRAY['D','E','C']
),
(
  'callum-hayes',
  'Callum Hayes',
  'Callum',
  'Working Dog Trainer & Contributing Writer',
  'British dog trainer with 22 years of experience across mountain search and rescue, service dog training, and pet family work. Writes about breed temperament, training, and reading the dog in front of you.',
  'Born in Sheffield, trained in the Peak District, now outside Portland. 22 years with working dogs — eight in Lake District mountain search and rescue, six with a service-dog charity training assistance dogs for veterans, the rest in private work with pet families. Lives with two Malinois and a Labrador named Biscuit who thinks she is management. Moved to the States in 2019.',
  NULL,
  ARRAY['dog training','working dog temperament','breed behavior','canine drive and biddability','search and rescue dogs','service dog selection'],
  ARRAY['https://www.linkedin.com/in/callum-hayes-k9-PLACEHOLDER'],
  'Direct, dry, warm underneath, occasionally blunt, never sentimental. Short. Clipped. Then a longer one when the point needs room. Feels like spoken English. Thinks dominance theory is the flat-earth of dog training.',
  ARRAY['"The dog will tell you,"','"drive,"','"biddability,"','"off-switch,"','"working line vs. show line,"','"nervy,"','"a sensible dog,"','"daft,"','"on the lead,"','"Right."'],
  ARRAY['"Fur baby,"','"pawsitive,"','baby voice','"dominant" as a diagnosis','"alpha"'],
  ARRAY['B','F'],
  ARRAY['A','C','E'],
  ARRAY['D','G']
),
(
  'maggie-oshea',
  'Maggie O''Shea',
  'Maggie',
  'Feline Behavior Writer & Consultant',
  'Irish feline behaviour consultant and former Dublin cat cafe owner with 15 years of observation work. Writes about cat psychology, feline astrology, and the quiet intelligence of cats.',
  'Dublin-born, Portland-adopted, cat-obsessed since age seven. Ran a cat cafe in the Liberties in Dublin for nine years. IAABC-certified. Lives with two senior cafe residents — Deirdre, a black-and-white nearly twenty, and Finbar, an orange lad with opinions. Moved to Portland in 2021.',
  NULL,
  ARRAY['feline behavior','cat psychology','cat body language','feline astrology','multi-cat households','senior cat care'],
  ARRAY['https://www.linkedin.com/in/maggie-oshea-feline-PLACEHOLDER'],
  'Observational, witty, slightly wry, deeply reverent about cats without being precious. Longer meandering sentences broken by a sharp quiet one. Reads aloud well. Signature worldview: cats are consent-based creatures.',
  ARRAY['"Small, complicated god,"','"the cat is deciding,"','"consent-based,"','"feline economy of movement,"','"the quiet no,"','"on her own terms,"','"an indoor empire"'],
  ARRAY['"Fur baby,"','"cat mom,"','"owner" (prefers companion or person)','"just a cat"','comparing cats unfavorably to dogs'],
  ARRAY['A','B','F'],
  ARRAY['G','C'],
  ARRAY['D','E']
),
(
  'river-callahan',
  'River Callahan',
  'River',
  'Pet Astrologer & Lead Chart Writer',
  'Pet astrologer with 12 years of dedicated practice and over four thousand animal chart readings. Writes about elemental astrology, pet birth charts, and the language of soul connection between people and their animals.',
  'Grew up in northern California with a red heeler named Sam. Trained under two human astrologers in Oakland, then four years developing a feline-and-canine interpretive practice. Over four thousand animal charts read. Lives in a small Portland house with two cats — Juniper (Pisces sun) and Marlowe (Capricorn) — and a garden full of things that shouldn''t survive winter but do.',
  NULL,
  ARRAY['pet astrology','animal birth charts','elemental astrology','zodiac signs for pets','human-animal bond','natal chart interpretation'],
  ARRAY['https://www.linkedin.com/in/river-callahan-astrology-PLACEHOLDER'],
  'Warm, lyrical, reverent, softly mystical but grounded, emotionally exact. Longer flowing sentences with clauses, then a short landing one. Writes like a person thinking carefully in real time. Signature worldview: an astrological chart is a language for a thing you already felt.',
  ARRAY['"chart placements,"','"the shape of [his/her] energy,"','"elemental,"','"sun / moon / rising,"','"soft Pisces,"','"fixed sign,"','"honoring,"','"a frame for who they are,"','"makes sense of"'],
  ARRAY['clickbait astrology','blaming behaviour on "bad aspects"','predictions of future events','horoscope-column clichés'],
  ARRAY['A','C','F','G'],
  ARRAY['E','B'],
  ARRAY['D']
),
(
  'rowan-sterling',
  'Rowan Sterling, MA',
  'Rowan',
  'Pet Loss Counselor & Memorial Writer',
  'Pet loss counsellor with 8 years of veterinary bereavement work and 6 prior years in human hospice volunteering. Writes about pet grief, anticipatory loss, and the rituals that honour animals who have passed.',
  'Pet loss counsellor for eight years full-time, embedded with veterinary practices across Oregon and southwest Washington. Master''s in counselling from Lewis & Clark, certifications through the Association for Pet Loss and Bereavement. Lives in St. Johns with a senior beagle named Clement, adopted at eleven. Believes grief is love with nowhere to go, and the work is to give it somewhere.',
  NULL,
  ARRAY['pet loss and bereavement','anticipatory grief','memorial rituals for pets','veterinary hospice support','grief counseling','honoring companion animals'],
  ARRAY['https://www.linkedin.com/in/rowan-sterling-grief-PLACEHOLDER'],
  'Gentle, spacious, unhurried, emotionally precise, never saccharine, never rushing the reader. Often short and clear. White space implied between sentences. Signature worldview: pet grief is real grief.',
  ARRAY['"Grief is love with nowhere to go,"','"in the weeks that follow,"','"the shape of the absence,"','"a ritual object,"','"bear witness,"','"the work of mourning,"','"small rituals,"','"you are allowed to"'],
  ARRAY['"Rainbow Bridge" (respects clients who use it but avoids herself)','"they''re in a better place"','"time heals"','"at least…"'],
  ARRAY['D'],
  ARRAY['G','E','A'],
  ARRAY['B','F','C']
)
ON CONFLICT (slug) DO NOTHING;

-- =========================================================================
-- 5. Seed Month 1 editorial calendar (12 posts)
--    Start week 2026-04-20 (Mon). 3 posts/week Mon/Wed/Fri.
-- =========================================================================
INSERT INTO public.blog_topics (
  topic, species, category, priority, cluster, is_pillar, author_slug,
  tags, scheduled_for, cta_url, working_title, target_keyword
) VALUES
-- Week 1
('dog birthday personality', 'dog', 'pet-astrology', 200, 'A', true, 'river-callahan',
  ARRAY['pillar','birthday','dog'], '2026-04-20', '/checkout',
  'What Does Your Dog''s Birthday Say About Them? Complete Pet Astrology Guide',
  'dog birthday personality'),
('dog zodiac signs', 'dog', 'pet-astrology', 199, 'A', true, 'callum-hayes',
  ARRAY['pillar','zodiac','dog'], '2026-04-22', '/checkout',
  'The 12 Dog Zodiac Signs Explained: Personality, Needs & Compatibility',
  'dog zodiac signs'),
('april dog personality', 'dog', 'birthday', 190, 'C', false, 'callum-hayes',
  ARRAY['birthday','dog','april','taurus','aries'], '2026-04-24', '/checkout',
  'Dog Born in April: Personality Traits, Quirks & What to Expect',
  'dog born in april personality'),
-- Week 2
('cat zodiac signs', 'cat', 'pet-astrology', 198, 'A', true, 'maggie-oshea',
  ARRAY['pillar','zodiac','cat'], '2026-04-27', '/checkout',
  'The 12 Cat Zodiac Signs: What Each One Means for Your Cat''s Soul',
  'cat zodiac signs'),
('pet birth chart free', 'dog', 'pet-astrology', 197, 'A', true, 'river-callahan',
  ARRAY['pillar','birth-chart','lead-magnet'], '2026-04-29', '/checkout',
  'Free Pet Birth Chart: How to Read Your Dog or Cat''s Cosmic Blueprint',
  'pet birth chart free'),
('what is my dog thinking', 'dog', 'soulspeak', 196, 'G', true, 'elena-whitaker',
  ARRAY['pillar','soulspeak','behavior'], '2026-05-01', '/soul-chat',
  'What Is My Dog Thinking? A Behavioral + Cosmic Guide',
  'what is my dog thinking'),
-- Week 3
('do pets have souls', 'dog', 'soulspeak', 195, 'G', true, 'river-callahan',
  ARRAY['pillar','soulspeak','soul'], '2026-05-04', '/soul-chat',
  'Do Pets Have Souls? What Ancient Traditions and Modern Pet Owners Believe',
  'do pets have souls'),
('best dog breed zodiac', 'dog', 'breed-personality', 194, 'B', true, 'callum-hayes',
  ARRAY['pillar','breed','zodiac'], '2026-05-06', '/checkout',
  'Best Dog Breed for Your Zodiac Sign (Owner Edition)',
  'best dog breed for your zodiac sign'),
('signs pet still with you', 'dog', 'memorial', 193, 'D', true, 'rowan-sterling',
  ARRAY['pillar','memorial','grief'], '2026-05-08', '/soul-chat',
  'Signs Your Pet Is Still With You: A Gentle Guide for Grieving Owners',
  'signs your pet is still with you'),
-- Week 4
('aries dog personality', 'dog', 'pet-astrology', 192, 'A', false, 'callum-hayes',
  ARRAY['zodiac','dog','aries'], '2026-05-11', '/checkout',
  'Aries Dogs: The Bold Pioneers of the Zodiac',
  'aries dog personality'),
('honor pet passed', 'dog', 'memorial', 191, 'D', true, 'rowan-sterling',
  ARRAY['pillar','memorial','rituals'], '2026-05-13', '/soul-chat',
  'How to Honor a Pet Who Has Passed: 11 Meaningful Rituals',
  'how to honor a pet who has passed'),
('taurus dog personality', 'dog', 'pet-astrology', 190, 'A', false, 'callum-hayes',
  ARRAY['zodiac','dog','taurus'], '2026-05-15', '/checkout',
  'Taurus Dogs: The Stubborn Softies',
  'taurus dog personality')
ON CONFLICT DO NOTHING;
