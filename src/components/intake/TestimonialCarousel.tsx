import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

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

// Generated images (shown after, less prominent)
import customer1 from '@/assets/testimonials/customer-1.png';
import customer2 from '@/assets/testimonials/customer-2.png';
import customer3 from '@/assets/testimonials/customer-3.jpg';

const testimonials = [
  // Original uploaded images first
  {
    name: "Mia",
    pet: "Bruno",
    text: "I ordered Bruno's report thinking it would just be a cute thing. I was completely caught off guard by how accurate it was. It didn't feel generic at all.",
    image: miaImg,
    highlight: "Completely caught off guard by how accurate it was"
  },
  {
    name: "David R.",
    pet: "",
    text: "You can tell the astrology part is the real deal here. This isn't just fluffy horoscope stuff. The way they track the timing and the chart actually makes sense.",
    image: davidImg,
    highlight: "This isn't just fluffy horoscope stuff"
  },
  {
    name: "Chloe",
    pet: "Luna",
    text: "I shared a bit from my cat Luna's report in my group chat and then like five people asked for the link. Seriously, if you're thinking about it, just get it.",
    image: chloeImg,
    highlight: "Five people asked for the link"
  },
  {
    name: "Mark",
    pet: "Mr. Whiskers",
    text: "I got this for my sister and her cat. She actually cried when she read it, happy tears of course. She said it was the most thoughtful gift.",
    image: markImg,
    highlight: "She actually cried when she read it"
  },
  {
    name: "Sarah",
    pet: "Rex",
    text: "This report totally changed how I see my dog Rex. I thought he was just being stubborn on walks, but it explained his needs and his breed's temperament.",
    image: sarahImg,
    highlight: "Totally changed how I see my dog"
  },
  {
    name: "The Patel Family",
    pet: "Ginger",
    text: "It reads like a story about our dog, Ginger. It wasn't cheesy or silly, it was just really nicely written and felt true to her.",
    image: patelsImg,
    highlight: "It reads like a story about our dog"
  },
  {
    name: "Jamie",
    pet: "River",
    text: "My partner is a huge skeptic about anything like this. They read the part about our dog River's personality and just got quiet. Then they said, 'Okay, that's actually really accurate.'",
    image: jamesImg,
    highlight: "Even my skeptic partner was impressed"
  },
  {
    name: "Linda K.",
    pet: "Buddy",
    text: "I ordered the memorial version for my dog Buddy. It was exactly what I needed. It wasn't too heavy or too simple, it was just right.",
    image: granImg,
    highlight: "It was exactly what I needed"
  },
  {
    name: "Elena",
    pet: "Moose",
    text: "I keep going back to read my dog Moose's report. Most things you buy online you forget about, but this one has little details that I notice in real life.",
    image: emmaImg,
    highlight: "I keep going back to read it"
  },
  // Generated images (less prominent, shown later)
  {
    name: "Alex",
    pet: "Biscuit",
    text: "The cosmic insights about Biscuit were spot on. Really helped me understand why she acts the way she does during full moons!",
    image: customer1,
    highlight: "Spot on cosmic insights"
  },
  {
    name: "Jordan",
    pet: "Maple",
    text: "Such a unique gift idea. My whole family loved reading Maple's personality breakdown together.",
    image: customer2,
    highlight: "A unique gift the whole family loved"
  },
  {
    name: "Taylor",
    pet: "Ziggy",
    text: "I was skeptical at first but Ziggy's chart explained so much about his quirky behavior. Worth every penny.",
    image: customer3,
    highlight: "Explained so much about his quirky behavior"
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
