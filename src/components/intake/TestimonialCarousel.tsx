import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: "Mia",
    pet: "Bruno",
    text: "I ordered Bruno's report thinking it would just be a cute thing. I was completely caught off guard by how accurate it was. It didn't feel generic at all, it really seemed like you knew him.",
  },
  {
    name: "David R.",
    pet: "",
    text: "You can tell the astrology part is the real deal here. This isn't just fluffy horoscope stuff. The way they track the timing and the chart actually makes sense.",
  },
  {
    name: "Chloe",
    pet: "Luna",
    text: "I shared a bit from my cat Luna's report in my group chat and then like five people asked for the link. Seriously, if you're thinking about it, just get it.",
  },
  {
    name: "Mark",
    pet: "Mr. Whiskers",
    text: "I got this for my sister and her cat. She actually cried when she read it, happy tears of course. She said it was the most thoughtful gift.",
  },
  {
    name: "Sarah",
    pet: "Rex",
    text: "This report totally changed how I see my dog Rex. I thought he was just being stubborn on walks, but it explained his needs and his breed's temperament.",
  },
  {
    name: "The Patel Family",
    pet: "Ginger",
    text: "It reads like a story about our dog, Ginger. It wasn't cheesy or silly, it was just really nicely written and felt true to her.",
  },
  {
    name: "Jamie",
    pet: "River",
    text: "My partner is a huge skeptic about anything like this. They read the part about our dog River's personality and just got quiet. Then they said, 'Okay, that's actually really accurate.'",
  },
  {
    name: "Linda K.",
    pet: "Buddy",
    text: "I ordered the memorial version for my dog Buddy. It was exactly what I needed. It wasn't too heavy or too simple, it was just right.",
  },
  {
    name: "Alex C.",
    pet: "Clover",
    text: "I tried a cheaper version from another site first. There's just no comparison. This one for my rabbit Clover felt like it was actually made for her.",
  },
  {
    name: "Priya",
    pet: "Nala",
    text: "The section about my cat Nala's daily rhythm explained so much. It pinpointed her energetic times and her lazy habits perfectly.",
  },
  {
    name: "Carlos",
    pet: "Zeus",
    text: "I only meant to buy one for my dog Zeus. After I got his, I immediately went back and got reports for my other two pets. It's that good.",
  },
  {
    name: "Elena",
    pet: "Moose",
    text: "I keep going back to read my dog Moose's report. Most things you buy online you forget about, but this one has little details that I notice in real life.",
  },
  {
    name: "Jordan T.",
    pet: "Spike",
    text: "This finally feels like a real, professional product and not some internet scam. The whole thing from the website to the report itself feels high quality.",
  },
  {
    name: "Maya",
    pet: "Olive",
    text: "The personality type they gave my cat Olive was perfect. It nailed that she's loving but only on her terms, plus all her little quirks.",
  },
  {
    name: "Tom",
    pet: "",
    text: "I really wish I had bought this months ago. I've wasted money on so many toys my dog doesn't care about. This actually meant something right away.",
  },
  {
    name: "Dr. Rebecca Lee",
    pet: "",
    text: "It hits a really nice balance. It's smart and well organized, but it's also warm and personal. They don't talk down to you or get too vague.",
  },
  {
    name: "Natasha",
    pet: "",
    text: "This is my new standard gift whenever a friend gets a pet. It's such a unique idea and it feels so personal.",
  },
  {
    name: "Michael",
    pet: "Daisy",
    text: "I bought it thinking it would be just a bit of fun. It was actually really sweet and meaningful. Some parts about my dog Daisy were so true it made me stop and look at her.",
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
          <div className="flex items-center justify-center">
            <p className="font-medium text-foreground">
              {testimonials[current].name}
              {testimonials[current].pet && ` & ${testimonials[current].pet}`}
            </p>
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
