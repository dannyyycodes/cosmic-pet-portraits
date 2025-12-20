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
    { name: "Mia", pet: "Bruno", textKey: "testimonial.1", image: miaImg },
    { name: "David R.", pet: "", textKey: "testimonial.2", image: davidImg },
    { name: "Chloe", pet: "Luna", textKey: "testimonial.3", image: chloeImg },
    { name: "Mark", pet: "Mr. Whiskers", textKey: "testimonial.4", image: markImg },
    { name: "Sarah", pet: "Rex", textKey: "testimonial.5", image: sarahImg },
    { name: "The Patel Family", pet: "Ginger", textKey: "testimonial.6", image: patelsImg },
    { name: "Jamie", pet: "River", textKey: "testimonial.7", image: jamesImg },
    { name: "Linda K.", pet: "Buddy", textKey: "testimonial.8", image: granImg },
    { name: "Elena", pet: "Moose", textKey: "testimonial.9", image: emmaImg },
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
                alt={testimonial.name}
                className="w-10 h-10 rounded-full object-cover border border-gold/30"
              />
              <span className="text-sm text-muted-foreground">
                {testimonial.name}{testimonial.pet && <> {t('testimonial.with')} <span className="text-gold">{testimonial.pet}</span></>}
              </span>
            </div>
          </div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
