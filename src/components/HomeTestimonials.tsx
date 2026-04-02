import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

// Original uploaded images (shown first)
import miaImg from '@/assets/testimonials/mia.jpg';
import davidImg from '@/assets/testimonials/david.jpg';
import chloeImg from '@/assets/testimonials/chloe.jpg';
import markImg from '@/assets/testimonials/mark.jpg';
import sarahImg from '@/assets/testimonials/sarah.jpg';
import patelsImg from '@/assets/testimonials/patels.jpg';
import jamesImg from '@/assets/testimonials/james.jpg';
import granImg from '@/assets/testimonials/gran.jpg';
import emmaImg from '@/assets/testimonials/emma.jpg';

export function HomeTestimonials() {
  const { t } = useLanguage();
  const [startIndex, setStartIndex] = useState(0);

  const testimonials = [
    { name: "Mia", pet: "Bruno", species: "Labrador", textKey: "testimonial.1", image: miaImg },
    { name: "David R.", pet: "Max", species: "Golden Retriever", textKey: "testimonial.2", image: davidImg },
    { name: "Chloe", pet: "Luna", species: "Maine Coon", textKey: "testimonial.3", image: chloeImg },
    { name: "Mark", pet: "Mr. Whiskers", species: "Tabby Cat", textKey: "testimonial.4", image: markImg },
    { name: "Sarah", pet: "Rex", species: "German Shepherd", textKey: "testimonial.5", image: sarahImg },
    { name: "The Patel Family", pet: "Ginger", species: "British Shorthair", textKey: "testimonial.6", image: patelsImg },
    { name: "Jamie", pet: "River", species: "Cockapoo", textKey: "testimonial.7", image: jamesImg },
    { name: "Linda K.", pet: "Buddy", species: "Beagle", textKey: "testimonial.8", image: granImg },
    { name: "Elena", pet: "Moose", species: "Shih Tzu", textKey: "testimonial.9", image: emmaImg },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStartIndex((prev) => (prev + 3) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const visibleTestimonials = [
    testimonials[startIndex % testimonials.length],
    testimonials[(startIndex + 1) % testimonials.length],
    testimonials[(startIndex + 2) % testimonials.length],
  ];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={startIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        className="grid md:grid-cols-3 gap-6"
      >
        {visibleTestimonials.map((testimonial, i) => (
          <div 
            key={i} 
            className="testimonial-card p-6 backdrop-blur-sm"
          >
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, j) => (
                <Star key={j} className="w-4 h-4 fill-gold text-gold" />
              ))}
            </div>
            <p className="text-foreground/90 leading-relaxed mb-6 italic">
              "{t(testimonial.textKey)}"
            </p>
            <div className="flex items-center gap-3">
              <img
                src={testimonial.image}
                alt={testimonial.pet || testimonial.name}
                className="w-10 h-10 rounded-full object-cover border border-gold/30"
              />
              <div>
                <span className="text-sm text-muted-foreground block">
                  {testimonial.name}{testimonial.pet && <> {t('testimonial.with')} <span className="text-gold">{testimonial.pet}</span></>}
                </span>
                {testimonial.species && (
                  <span className="text-xs text-muted-foreground/60">{testimonial.species}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
