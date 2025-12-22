import { motion } from 'framer-motion';
import { Star, Quote, BadgeCheck, ShieldCheck } from 'lucide-react';
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
      <div className="relative bg-card/60 backdrop-blur-sm border border-border/40 rounded-2xl p-6 h-full transition-all duration-300 hover:border-border/60 hover:bg-card/80">
        {/* Quote icon */}
        <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/10" />
        
        {/* Stars */}
        <div className="flex gap-0.5 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-primary text-primary" />
          ))}
        </div>

        {/* Highlight quote */}
        <p className="text-lg font-medium text-foreground mb-3 leading-relaxed">
          "{highlight}"
        </p>

        {/* Full text */}
        <p className="text-muted-foreground leading-relaxed mb-6 text-sm">
          {text}
        </p>

        {/* Author */}
        <div className="flex items-center gap-3 pt-4 border-t border-border/30">
          <div className="relative">
            <img 
              src={image} 
              alt={name}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-border/50"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center ring-2 ring-background">
              <BadgeCheck className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-foreground text-sm">{name}</p>
              <span className="text-xs text-green-500/90 bg-green-500/10 px-1.5 py-0.5 rounded">Verified</span>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {pet} • {species}
            </p>
          </div>
        </div>
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
      species: "Labrador Retriever",
      text: "I read the first paragraph and my jaw dropped. It described Bruno's exact little habits — how he tilts his head when he's confused, his thing with thunder, all of it.",
      highlight: "It described Bruno's exact little habits",
      image: miaImg,
    },
    {
      name: "Mark Davies",
      pet: "Mr. Whiskers",
      species: "Tabby Cat",
      text: "Got this for my sister's birthday. She kept saying 'how do they know all this about Whiskers?' Honestly best gift I've given. Already bought 4 more for friends.",
      highlight: "How do they know all this about Whiskers?",
      image: markImg,
    },
    {
      name: "Sarah Mitchell",
      pet: "Rex",
      species: "German Shepherd",
      text: "I was skeptical at first. But the report explained why Rex gets anxious at 6pm every day. Changed how I do his evenings now. He's noticeably calmer.",
      highlight: "Changed how I do his evenings now",
      image: sarahImg,
    },
    {
      name: "James Wilson",
      pet: "Biscuit",
      species: "Holland Lop Rabbit",
      text: "Never thought I'd get something like this for a rabbit. Turns out Biscuit is a 'grounded earth soul' which explains why he hates being picked up! We leave him be now and he's much happier.",
      highlight: "Explains why he hates being picked up",
      image: jamesImg,
    },
    {
      name: "Priya Sharma",
      pet: "Coco",
      species: "Cockatiel",
      text: "My mum got this for Coco and we couldn't stop laughing at how accurate it was. It said he needs 'an audience' — that's literally him. We moved his cage to the lounge.",
      highlight: "We couldn't stop laughing at how accurate it was",
      image: priyaImg,
    },
    {
      name: "Margaret & Tom",
      pet: "Duchess",
      species: "Persian Cat",
      text: "My grandson got this for my 75th birthday. I've had cats my whole life but never understood Duchess like I do now. She's an 'old soul' apparently — makes perfect sense.",
      highlight: "Never understood Duchess like I do now",
      image: granImg,
    },
  ];

  const miniTestimonials = [
    { name: "Chloe L.", text: "Shared it with 5 friends — they all bought one", image: chloeImg },
    { name: "The Patels", text: "Our whole family read it together", image: patelsImg },
    { name: "David R.", text: "More insightful than I expected", image: davidImg },
    { name: "Emma T.", text: "Got one for my horse — spot on!", image: emmaImg },
    { name: "The Nguyens", text: "Got all 3 pets done. Worth every penny", image: nguyensImg },
    { name: "Bob, 68", text: "My daughter helped me order. So glad she did", image: bobImg },
  ];

  return (
    <section className="relative py-20 px-4 overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-5">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">50,000+ Pet Parents Can't Be Wrong</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-serif font-semibold text-foreground mb-3">
            "It's Scary How Accurate This Was..."
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            See why pet lovers are calling this "the best gift I've ever given" (and received!)
          </p>
        </motion.div>

        {/* Featured testimonials grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {featuredTestimonials.map((testimonial, i) => (
            <FeaturedTestimonial
              key={testimonial.name}
              {...testimonial}
              delay={i * 0.08}
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
