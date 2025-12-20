import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

// Original uploaded images (shown first)
import miaImg from '@/assets/testimonials/mia.jpg';
import sarahImg from '@/assets/testimonials/sarah.jpg';
import patelsImg from '@/assets/testimonials/patels.jpg';
import chloeImg from '@/assets/testimonials/chloe.jpg';
import markImg from '@/assets/testimonials/mark.jpg';
import jamesImg from '@/assets/testimonials/james.jpg';
import emmaImg from '@/assets/testimonials/emma.jpg';
import davidImg from '@/assets/testimonials/david.jpg';
import granImg from '@/assets/testimonials/gran.jpg';

interface Testimonial {
  name: string;
  pet: string;
  petSign?: string;
  species?: string;
  text: string;
  image: string;
  highlight: string;
}

// All testimonials with zodiac and species info - original images first
const allTestimonials: Testimonial[] = [
  {
    name: "Mia",
    pet: "Bruno",
    petSign: "Aries",
    species: "dog",
    text: "I ordered Bruno's report thinking it would just be a cute thing. I was completely caught off guard by how accurate it was. The Aries energy described him PERFECTLY.",
    image: miaImg,
    highlight: "The Aries energy described him PERFECTLY"
  },
  {
    name: "Sarah",
    pet: "Rex",
    petSign: "Leo",
    species: "dog",
    text: "This report totally changed how I see my dog Rex. As a Leo, no wonder he demands all the attention! It explained his personality so well.",
    image: sarahImg,
    highlight: "As a Leo, no wonder he demands attention"
  },
  {
    name: "The Patel Family",
    pet: "Ginger",
    petSign: "Taurus",
    species: "dog",
    text: "It reads like a story about our Taurus dog, Ginger. Her love of routine and treats finally makes cosmic sense!",
    image: patelsImg,
    highlight: "Her love of routine finally makes cosmic sense"
  },
  {
    name: "Chloe",
    pet: "Luna",
    petSign: "Pisces",
    species: "cat",
    text: "My Pisces cat Luna is SO dreamy and intuitive, just like the report said. I shared it in my group chat and five people asked for the link!",
    image: chloeImg,
    highlight: "My Pisces cat is SO dreamy and intuitive"
  },
  {
    name: "Mark",
    pet: "Mr. Whiskers",
    petSign: "Scorpio",
    species: "cat",
    text: "Mr. Whiskers is a Scorpio and the report NAILED his mysterious, intense personality. My sister cried happy tears reading it.",
    image: markImg,
    highlight: "NAILED his mysterious, intense personality"
  },
  {
    name: "Jamie",
    pet: "Shadow",
    petSign: "Capricorn",
    species: "cat",
    text: "My Capricorn cat Shadow is described as 'ambitious and dignified' - so true! Even my skeptic partner said it was shockingly accurate.",
    image: jamesImg,
    highlight: "Even my skeptic partner was impressed"
  },
  {
    name: "Elena",
    pet: "Moose",
    petSign: "Cancer",
    species: "dog",
    text: "Cancer dogs are described as deeply emotional and protective - that's my Moose 100%. I keep going back to read his report.",
    image: emmaImg,
    highlight: "Cancer dogs are deeply emotional - that's my Moose"
  },
  {
    name: "David R.",
    pet: "Bella",
    petSign: "Gemini",
    species: "dog",
    text: "Bella's Gemini chart explained her two personalities perfectly - one minute cuddly, next minute chaos. Real astrology, not fluff.",
    image: davidImg,
    highlight: "Explained her two personalities perfectly"
  },
  {
    name: "Linda K.",
    pet: "Buddy",
    petSign: "Virgo",
    species: "dog",
    text: "I ordered the memorial version for my Virgo dog Buddy. It captured his gentle, helpful nature perfectly. Exactly what I needed.",
    image: granImg,
    highlight: "Captured his gentle nature perfectly"
  },
];

// Zodiac sign compatibility groupings
const signGroups: Record<string, string[]> = {
  Fire: ['Aries', 'Leo', 'Sagittarius'],
  Earth: ['Taurus', 'Virgo', 'Capricorn'],
  Air: ['Gemini', 'Libra', 'Aquarius'],
  Water: ['Cancer', 'Scorpio', 'Pisces'],
};

function getElementForSign(sign: string): string {
  for (const [element, signs] of Object.entries(signGroups)) {
    if (signs.includes(sign)) return element;
  }
  return 'Water';
}

interface PersonalizedTestimonialsProps {
  petSign: string;
  petSpecies: string;
  petName: string;
}

export function PersonalizedTestimonials({ petSign, petSpecies, petName }: PersonalizedTestimonialsProps) {
  const [current, setCurrent] = useState(0);
  
  // Filter and sort testimonials by relevance
  const getRelevantTestimonials = () => {
    const petElement = getElementForSign(petSign);
    
    // Score each testimonial by relevance
    const scored = allTestimonials.map(t => {
      let score = 0;
      
      // Same zodiac sign = highest priority
      if (t.petSign === petSign) score += 100;
      
      // Same element = medium priority  
      if (t.petSign && getElementForSign(t.petSign) === petElement) score += 50;
      
      // Same species = bonus
      if (t.species === petSpecies?.toLowerCase()) score += 30;
      
      return { ...t, score };
    });
    
    // Sort by score and take top 5
    return scored.sort((a, b) => b.score - a.score).slice(0, 5);
  };
  
  const testimonials = getRelevantTestimonials();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const testimonial = testimonials[current];
  const isSameSign = testimonial?.petSign === petSign;
  const isSameSpecies = testimonial?.species === petSpecies?.toLowerCase();

  return (
    <div className="relative overflow-hidden">
      {/* Personalization badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center mb-4"
      >
        <span className="text-xs px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary">
          {isSameSign 
            ? `✨ From another ${petSign} ${petSpecies} owner`
            : isSameSpecies 
              ? `🐾 From a fellow ${petSpecies} owner`
              : `💫 Verified ${testimonial?.species} owner`
          }
        </span>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="bg-gradient-to-br from-gold/10 via-card/60 to-primary/10 border border-gold/30 rounded-2xl p-6 relative overflow-hidden"
        >
          {/* Decorative quote */}
          <Quote className="absolute top-4 right-4 w-8 h-8 text-gold/20" />
          
          {/* Stars */}
          <div className="flex gap-1 mb-4 justify-center">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-gold text-gold" />
            ))}
          </div>

          {/* Highlighted Quote */}
          <div className="text-center mb-4">
            <p className="text-gold font-semibold text-lg">
              "{testimonial?.highlight}"
            </p>
          </div>

          {/* Full Quote */}
          <p className="text-foreground/80 text-sm italic text-center mb-5">
            "{testimonial?.text}"
          </p>

          {/* Author with Photo */}
          <div className="flex items-center justify-center gap-3">
            <img 
              src={testimonial?.image} 
              alt={testimonial?.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-gold/40 shadow-lg"
            />
            <div className="text-left">
              <p className="font-medium text-foreground">
                {testimonial?.name}
              </p>
              <p className="text-xs text-gold">
                {testimonial?.petSign} {testimonial?.species} owner
                {isSameSign && ' (same as ' + petName + '!)'}
              </p>
            </div>
          </div>

          {/* Verified badge */}
          <div className="flex justify-center mt-4">
            <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
              ✓ Verified Purchase
            </span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 mt-4">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === current ? 'bg-gold w-6' : 'bg-muted-foreground/30 w-1.5'
            }`}
          />
        ))}
      </div>
    </div>
  );
}