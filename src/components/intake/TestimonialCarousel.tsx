import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

import customer1 from '@/assets/testimonials/customer-1.png';
import customer2 from '@/assets/testimonials/customer-2.png';
import customer3 from '@/assets/testimonials/customer-3.jpg';
import customer4 from '@/assets/testimonials/customer-4.jpg';
import customer5 from '@/assets/testimonials/customer-5.jpg';
import customer6 from '@/assets/testimonials/customer-6.jpg';
import customer7 from '@/assets/testimonials/customer-7.jpg';
import customer8 from '@/assets/testimonials/customer-8.jpg';
import customer9 from '@/assets/testimonials/customer-9.jpg';

const testimonials = [
  {
    name: "Mia",
    pet: "Bruno",
    text: "I ordered Bruno's report thinking it would just be a cute thing. I was completely caught off guard by how accurate it was. It didn't feel generic at all.",
    image: customer1,
    highlight: "Completely caught off guard by how accurate it was"
  },
  {
    name: "David R.",
    pet: "",
    text: "You can tell the astrology part is the real deal here. This isn't just fluffy horoscope stuff. The way they track the timing and the chart actually makes sense.",
    image: customer2,
    highlight: "This isn't just fluffy horoscope stuff"
  },
  {
    name: "Chloe",
    pet: "Luna",
    text: "I shared a bit from my cat Luna's report in my group chat and then like five people asked for the link. Seriously, if you're thinking about it, just get it.",
    image: customer3,
    highlight: "Five people asked for the link"
  },
  {
    name: "Mark",
    pet: "Mr. Whiskers",
    text: "I got this for my sister and her cat. She actually cried when she read it, happy tears of course. She said it was the most thoughtful gift.",
    image: customer4,
    highlight: "She actually cried when she read it"
  },
  {
    name: "Sarah",
    pet: "Rex",
    text: "This report totally changed how I see my dog Rex. I thought he was just being stubborn on walks, but it explained his needs and his breed's temperament.",
    image: customer5,
    highlight: "Totally changed how I see my dog"
  },
  {
    name: "The Patel Family",
    pet: "Ginger",
    text: "It reads like a story about our dog, Ginger. It wasn't cheesy or silly, it was just really nicely written and felt true to her.",
    image: customer6,
    highlight: "It reads like a story about our dog"
  },
  {
    name: "Jamie",
    pet: "River",
    text: "My partner is a huge skeptic about anything like this. They read the part about our dog River's personality and just got quiet. Then they said, 'Okay, that's actually really accurate.'",
    image: customer7,
    highlight: "Even my skeptic partner was impressed"
  },
  {
    name: "Linda K.",
    pet: "Buddy",
    text: "I ordered the memorial version for my dog Buddy. It was exactly what I needed. It wasn't too heavy or too simple, it was just right.",
    image: customer8,
    highlight: "It was exactly what I needed"
  },
  {
    name: "Elena",
    pet: "Moose",
    text: "I keep going back to read my dog Moose's report. Most things you buy online you forget about, but this one has little details that I notice in real life.",
    image: customer9,
    highlight: "I keep going back to read it"
  },
];

export function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const testimonial = testimonials[current];

  return (
    <div className="relative overflow-hidden">
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
              "{testimonial.highlight}"
            </p>
          </div>

          {/* Full Quote */}
          <p className="text-foreground/80 text-sm italic text-center mb-5">
            "{testimonial.text}"
          </p>

          {/* Author with Photo */}
          <div className="flex items-center justify-center gap-3">
            <img 
              src={testimonial.image} 
              alt={testimonial.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-gold/40 shadow-lg"
            />
            <div className="text-left">
              <p className="font-medium text-foreground">
                {testimonial.name}
              </p>
              {testimonial.pet && (
                <p className="text-xs text-gold">
                  Pet parent of {testimonial.pet}
                </p>
              )}
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
