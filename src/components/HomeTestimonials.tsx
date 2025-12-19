import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

import customer1 from '@/assets/testimonials/customer-1.png';
import customer2 from '@/assets/testimonials/customer-2.png';
import customer3 from '@/assets/testimonials/customer-3.jpg';
import customer4 from '@/assets/testimonials/customer-4.jpg';
import customer5 from '@/assets/testimonials/customer-5.jpg';
import customer6 from '@/assets/testimonials/customer-6.jpg';
import customer7 from '@/assets/testimonials/customer-7.jpg';
import customer8 from '@/assets/testimonials/customer-8.jpg';
import customer9 from '@/assets/testimonials/customer-9.jpg';

export function HomeTestimonials() {
  const { t } = useLanguage();
  const [startIndex, setStartIndex] = useState(0);

  const testimonials = [
    { name: "Mia", pet: "Bruno", textKey: "testimonial.1", image: customer1 },
    { name: "David R.", pet: "", textKey: "testimonial.2", image: customer2 },
    { name: "Chloe", pet: "Luna", textKey: "testimonial.3", image: customer3 },
    { name: "Mark", pet: "Mr. Whiskers", textKey: "testimonial.4", image: customer4 },
    { name: "Sarah", pet: "Rex", textKey: "testimonial.5", image: customer5 },
    { name: "The Patel Family", pet: "Ginger", textKey: "testimonial.6", image: customer6 },
    { name: "Jamie", pet: "River", textKey: "testimonial.7", image: customer7 },
    { name: "Linda K.", pet: "Buddy", textKey: "testimonial.8", image: customer8 },
    { name: "Elena", pet: "Moose", textKey: "testimonial.9", image: customer9 },
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
