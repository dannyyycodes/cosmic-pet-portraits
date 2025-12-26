import { motion } from 'framer-motion';
import { Star, BadgeCheck, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// Featured testimonial images
import miaImg from '@/assets/testimonials/mia.jpg';
import markImg from '@/assets/testimonials/mark.jpg';
import sarahImg from '@/assets/testimonials/sarah.jpg';
import jamesImg from '@/assets/testimonials/james.jpg';
import priyaImg from '@/assets/testimonials/priya.jpg';
import granImg from '@/assets/testimonials/gran.jpg';

// Mini testimonial images
import chloeImg from '@/assets/testimonials/chloe.jpg';
import patelsImg from '@/assets/testimonials/patels.jpg';
import davidImg from '@/assets/testimonials/david.jpg';
import emmaImg from '@/assets/testimonials/emma.jpg';
import nguyensImg from '@/assets/testimonials/nguyens.jpg';
import bobImg from '@/assets/testimonials/bob.jpg';

interface FeaturedTestimonialProps {
  name: string;
  pet: string;
  species: string;
  text: string;
  highlight: string;
  image: string;
  delay?: number;
}

function FeaturedTestimonial({ 
  name, 
  pet, 
  species,
  text, 
  highlight, 
  image, 
  delay = 0 
}: FeaturedTestimonialProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4 }}
      className="relative group"
    >
      <div className="relative bg-card/60 backdrop-blur-sm border border-border/40 rounded-2xl p-5 sm:p-6 h-full transition-all duration-300 hover:border-primary/30 hover:bg-card/80">
        {/* Author at top for mobile engagement */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <img 
              src={image} 
              alt={name}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-primary/20"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-background">
              <BadgeCheck className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground text-sm">{name}</p>
              <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded font-medium">Verified</span>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {pet} the {species}
            </p>
          </div>
        </div>

        {/* Stars */}
        <div className="flex gap-0.5 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
          ))}
        </div>

        {/* Highlight quote - bigger, bolder */}
        <p className="text-base sm:text-lg font-semibold text-foreground mb-2 leading-snug">
          "{highlight}"
        </p>

        {/* Full text */}
        <p className="text-muted-foreground leading-relaxed text-sm">
          {text}
        </p>
      </div>
    </motion.div>
  );
}

export function PremiumTestimonials() {
  const { t } = useLanguage();

  const featuredTestimonials = [
    {
      name: "Mia Thompson",
      pet: "Bruno",
      species: "Labrador",
      text: "I read the first paragraph and my jaw dropped. It described his exact little habits — the head tilt, the thunder thing. I cried reading it.",
      highlight: "I cried reading it. It's like they know him.",
      image: miaImg,
    },
    {
      name: "Mark Davies",
      pet: "Mr. Whiskers",
      species: "Tabby Cat",
      text: "Got this for my sister's birthday. She kept asking 'how do they know all this?' Already bought 4 more for friends. Best gift ever.",
      highlight: "Best gift I've ever given anyone.",
      image: markImg,
    },
    {
      name: "Sarah Mitchell",
      pet: "Rex",
      species: "German Shepherd",
      text: "I was skeptical. But it explained why Rex gets anxious at 6pm every day. Changed how I handle his evenings. He's so much calmer now.",
      highlight: "It actually changed how I care for him.",
      image: sarahImg,
    },
    {
      name: "James Wilson",
      pet: "Biscuit",
      species: "Holland Lop",
      text: "Never thought I'd get this for a rabbit. Turns out he's a 'grounded earth soul' — explains why he hates being picked up! Makes so much sense now.",
      highlight: "Finally understand why he does that!",
      image: jamesImg,
    },
    {
      name: "Priya Sharma",
      pet: "Coco",
      species: "Cockatiel",
      text: "We couldn't stop laughing at how accurate it was. It said he needs 'an audience' — that's literally him. Moved his cage to the lounge.",
      highlight: "Scarily accurate. We were dying laughing.",
      image: priyaImg,
    },
    {
      name: "Margaret & Tom",
      pet: "Duchess",
      species: "Persian Cat",
      text: "My grandson got this for my 75th birthday. I've had cats my whole life but never understood Duchess like I do now. She's an 'old soul'.",
      highlight: "75 years with cats — this still surprised me.",
      image: granImg,
    },
  ];

  const miniTestimonials = [
    { name: "Chloe L.", text: "Shared with 5 friends — all bought one!", image: chloeImg },
    { name: "The Patels", text: "Read it as a family. So special.", image: patelsImg },
    { name: "David R.", text: "Way more insightful than expected", image: davidImg },
    { name: "Emma T.", text: "Got one for my horse — spot on!", image: emmaImg },
    { name: "The Nguyens", text: "Did all 3 pets. Worth every penny.", image: nguyensImg },
    { name: "Bob, 68", text: "Best gift my daughter ever got me", image: bobImg },
  ];

  return (
    <section className="relative py-16 sm:py-20 px-4 overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section header - tighter on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-xs sm:text-sm font-medium text-primary">50,000+ Pet Parents Can't Be Wrong</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold text-foreground mb-2">
            Real Stories, Real Tears
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
            See why pet parents say this is the most meaningful gift they've ever given
          </p>
        </motion.div>

        {/* Featured testimonials grid - single column on mobile for readability */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
          {featuredTestimonials.map((testimonial, i) => (
            <FeaturedTestimonial
              key={testimonial.name}
              {...testimonial}
              delay={i * 0.05}
            />
          ))}
        </div>

        {/* Mini testimonials row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
        >
          {miniTestimonials.map((t, i) => (
            <div 
              key={i}
              className="flex items-center gap-2.5 bg-card/40 backdrop-blur-sm border border-border/30 rounded-xl p-3"
            >
              <img 
                src={t.image} 
                alt={t.name}
                className="w-10 h-10 rounded-full object-cover ring-1 ring-border/50 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex gap-0.5 mb-0.5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-2.5 h-2.5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-xs text-foreground leading-tight line-clamp-2">"{t.text}"</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">— {t.name}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center items-center gap-8 mt-12 pt-8 border-t border-border/20"
        >
          <div className="text-center">
            <p className="text-2xl font-semibold text-foreground">50,847</p>
            <p className="text-xs text-muted-foreground">Reports Generated</p>
          </div>
          <div className="w-px h-8 bg-border/30 hidden sm:block" />
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <p className="text-2xl font-semibold text-foreground">4.9</p>
              <Star className="w-4 h-4 fill-primary text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Average Rating</p>
          </div>
          <div className="w-px h-8 bg-border/30 hidden sm:block" />
          <div className="text-center">
            <p className="text-2xl font-semibold text-foreground">97%</p>
            <p className="text-xs text-muted-foreground">Would Recommend</p>
          </div>
          <div className="w-px h-8 bg-border/30 hidden sm:block" />
          <div className="text-center">
            <p className="text-2xl font-semibold text-foreground">12,000+</p>
            <p className="text-xs text-muted-foreground">5-Star Reviews</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
