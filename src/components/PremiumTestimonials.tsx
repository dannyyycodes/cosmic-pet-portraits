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
      text: "Okay so I wasn't expecting much but literally the first paragraph had me in tears. How did they know about his head tilt thing?? And the thunder. My husband thought I was crazy crying over a dog report lol",
      highlight: "Had me in tears by the first paragraph",
      image: miaImg,
    },
    {
      name: "Mark Davies",
      pet: "Mr. Whiskers",
      species: "Tabby Cat",
      text: "Bought this for my sister for her birthday not knowing what to expect. She's been showing everyone. Already ordered 4 more for christmas presents because everyone keeps asking where she got it",
      highlight: "Already ordered 4 more as gifts",
      image: markImg,
    },
    {
      name: "Sarah Mitchell",
      pet: "Rex",
      species: "German Shepherd",
      text: "Was pretty skeptical honestly but it explained why Rex freaks out every day at 6pm. Started doing his evening walk earlier and he's like a different dog. My vet was impressed",
      highlight: "My vet was actually impressed",
      image: sarahImg,
    },
    {
      name: "James Wilson",
      pet: "Biscuit",
      species: "Holland Lop",
      text: "Thought this was just for cats and dogs but got one for my rabbit anyway. It said he's a grounded earth soul which is why he hates being held. We stopped forcing cuddles and he's way happier now",
      highlight: "We stopped forcing cuddles on him",
      image: jamesImg,
    },
    {
      name: "Priya Sharma",
      pet: "Coco",
      species: "Cockatiel",
      text: "Me and my mum could not stop laughing. It said Coco needs an audience and honestly that's him to a tee. We moved his cage to the living room and he's been so much louder and happier",
      highlight: "Could not stop laughing reading this",
      image: priyaImg,
    },
    {
      name: "Margaret & Tom",
      pet: "Duchess",
      species: "Persian Cat",
      text: "My grandson got me this for my 75th. I've had cats all my life and thought I knew everything. This thing called Duchess an old soul and honestly? Makes perfect sense now. Wish I'd had this years ago",
      highlight: "Wish I'd had this years ago",
      image: granImg,
    },
  ];

  const miniTestimonials = [
    { name: "Chloe L.", text: "Sent it to 5 friends. They all bought one", image: chloeImg },
    { name: "The Patels", text: "Read it out loud as a family lol", image: patelsImg },
    { name: "David R.", text: "Ok this was actually really good", image: davidImg },
    { name: "Emma T.", text: "Did my horse!! So accurate", image: emmaImg },
    { name: "The Nguyens", text: "Got all 3 pets done. No regrets", image: nguyensImg },
    { name: "Bob, 68", text: "Best present my daughter ever got me", image: bobImg },
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
            <span className="text-xs sm:text-sm font-medium text-primary">Loved by Pet Parents Everywhere</span>
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
