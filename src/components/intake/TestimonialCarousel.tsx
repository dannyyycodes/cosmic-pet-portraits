import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: "Emily",
    pet: "Luna",
    avatar: "👩‍🦰",
    text: "Shockingly accurate... described my cat's behavior word for word.",
  },
  {
    name: "Ella",
    pet: "Rufus",
    avatar: "👩",
    text: "I didn't expect it to make me cry but it did.",
  },
  {
    name: "Sophie",
    pet: "Clover",
    avatar: "👩‍🦱",
    text: "It made me realise how sensitive my rabbit is.",
  },
  {
    name: "Marcus",
    pet: "Bear",
    avatar: "👨",
    text: "Finally understand why he does what he does. Mind-blown.",
  },
  {
    name: "Rachel",
    pet: "Whiskers",
    avatar: "👩‍🦳",
    text: "Bought this as a joke. Now I'm a believer.",
  },
];

export function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.4 }}
          className="bg-card/40 border border-border/50 rounded-2xl p-6"
        >
          {/* Stars */}
          <div className="flex gap-1 mb-4 justify-center">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-gold text-gold" />
            ))}
          </div>

          {/* Quote */}
          <p className="text-foreground/80 text-lg italic text-center mb-4">
            "{testimonials[current].text}"
          </p>

          {/* Author */}
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl">{testimonials[current].avatar}</span>
            <div>
              <p className="font-medium text-foreground">
                {testimonials[current].name} with {testimonials[current].pet}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-4">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === current ? 'bg-primary w-6' : 'bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
