-- Breed photo review queue for carousel image verification
CREATE TABLE IF NOT EXISTS breed_photo_review (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  expected_breed text NOT NULL,
  animal_type text NOT NULL DEFAULT 'dog',
  photo_url text NOT NULL,
  pexels_id text,
  pexels_alt text,
  gemini_breed text,
  gemini_confidence float,
  status text NOT NULL DEFAULT 'pending',
  verified boolean DEFAULT false,
  storage_path text,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_breed_review_status ON breed_photo_review(status);
CREATE INDEX IF NOT EXISTS idx_breed_review_breed ON breed_photo_review(expected_breed);
CREATE INDEX IF NOT EXISTS idx_breed_review_verified ON breed_photo_review(verified) WHERE verified = true;

-- Verified breed photos table (the final library)
CREATE TABLE IF NOT EXISTS breed_photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  breed text NOT NULL,
  animal_type text NOT NULL DEFAULT 'dog',
  storage_path text NOT NULL,
  photo_url text NOT NULL,
  source text DEFAULT 'pexels',
  width int,
  height int,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_breed_photos_breed ON breed_photos(breed);
CREATE INDEX IF NOT EXISTS idx_breed_photos_type ON breed_photos(animal_type);
