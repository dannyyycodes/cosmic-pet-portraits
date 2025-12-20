import { motion } from 'framer-motion';
import { Star, Quote, CheckCircle2, Heart, Sparkles, Gift } from 'lucide-react';
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
  text: string;
  highlight: string;
  image: string;
  tag: string;
  tagIcon: React.ReactNode;
  tagColor: string;
  delay?: number;
}

function FeaturedTestimonial({ 
  name, 
  pet, 
  text, 
  highlight, 
  image, 
  tag, 
  tagIcon, 
  tagColor,
  delay = 0 
}: FeaturedTestimonialProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="relative group pt-4"
    >
      {/* Tag badge - positioned above card */}
      <div className={`absolute top-0 left-6 z-10 px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${tagColor}`}>
        {tagIcon}
        {tag}
      </div>
      
      <div className="relative bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-8 h-full transition-all duration-500 hover:border-gold/40 hover:shadow-[0_0_40px_hsl(43_69%_52%/0.15)]">
        {/* Background glow on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
        
        {/* Quote icon */}
        <Quote className="absolute top-6 right-6 w-10 h-10 text-gold/10" />
        
        {/* Stars */}
        <div className="flex gap-1 mb-6 relative z-10">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-5 h-5 fill-gold text-gold" />
          ))}
        </div>

        {/* Highlight quote */}
        <p className="text-xl md:text-2xl font-serif font-medium text-gold mb-4 leading-relaxed relative z-10">
          "{highlight}"
        </p>

        {/* Full text */}
        <p className="text-foreground/70 leading-relaxed mb-8 text-sm md:text-base relative z-10">
          {text}
        </p>

        {/* Author */}
        <div className="flex items-center gap-4 relative z-10">
          <div className="relative">
            <img 
              src={image} 
              alt={name}
              className="w-14 h-14 rounded-full object-cover border-2 border-gold/40"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-background">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
          </div>
          <div>
            <p className="font-semibold text-foreground">{name}</p>
            {pet && (
              <p className="text-sm text-gold">Pet parent of {pet}</p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">Verified purchase</p>
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
      name: "Mia",
      pet: "Bruno the Labrador",
      text: "I read the first paragraph and my jaw dropped. It described Bruno's exact little habits — how he tilts his head when he's confused, his thing with thunder, all of it. My husband was like 'did you write this?' Honestly didn't expect it to be this good.",
      highlight: "My husband was like 'did you write this?'",
      image: miaImg,
      tag: "Scary Accurate",
      tagIcon: <Sparkles className="w-3 h-3" />,
      tagColor: "bg-gradient-to-r from-primary to-gold text-primary-foreground"
    },
    {
      name: "Mark",
      pet: "Mr. Whiskers the Cat",
      text: "Got this last minute for my sister's birthday. She rang me crying! She kept saying 'how do they know all this about Whiskers?' Honestly best £15 I've spent. Already bought 4 more for mates.",
      highlight: "She rang me crying!",
      image: markImg,
      tag: "Gift That Made Her Cry",
      tagIcon: <Gift className="w-3 h-3" />,
      tagColor: "bg-gradient-to-r from-nebula-pink to-nebula-purple text-white"
    },
    {
      name: "Sarah",
      pet: "Rex the German Shepherd",
      text: "I was proper skeptical tbh. But my mate wouldn't shut up about hers so I gave it a go. The report explained why Rex gets weird at 6pm every day (never noticed before!). Changed how I do his evenings now. He's way less stressed.",
      highlight: "He's way less stressed now",
      image: sarahImg,
      tag: "Skeptic Turned Believer",
      tagIcon: <Heart className="w-3 h-3" />,
      tagColor: "bg-gradient-to-r from-gold to-tangerine text-primary-foreground"
    },
    {
      name: "James",
      pet: "Biscuit the Rabbit",
      text: "Never thought I'd get something like this for a rabbit but my daughter begged me. Turns out Biscuit is a 'grounded earth soul' which explains why he hates being picked up! We leave him be now and he's so much happier.",
      highlight: "Explains why he hates being picked up!",
      image: jamesImg,
      tag: "Works for Rabbits Too",
      tagIcon: <Sparkles className="w-3 h-3" />,
      tagColor: "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
    },
    {
      name: "Priya",
      pet: "Coco the Cockatiel",
      text: "My mum got this for Coco and we couldn't stop laughing at how spot on it was. It said he needs 'an audience' and that's literally him — screams when no one's watching! We put his cage in the lounge now.",
      highlight: "Screams when no one's watching — literally him!",
      image: priyaImg,
      tag: "Bird Parents Love It",
      tagIcon: <Heart className="w-3 h-3" />,
      tagColor: "bg-gradient-to-r from-sky-500 to-blue-600 text-white"
    },
    {
      name: "Gran & Tom",
      pet: "Duchess the Persian Cat",
      text: "My grandson got this for my 75th birthday. I've had cats my whole life but never understood Duchess like I do now. She's an 'old soul' apparently — makes perfect sense. Best gift I've had in years.",
      highlight: "Best gift I've had in years",
      image: granImg,
      tag: "Multi-Generational Love",
      tagIcon: <Gift className="w-3 h-3" />,
      tagColor: "bg-gradient-to-r from-purple-500 to-violet-600 text-white"
    },
  ];

  const miniTestimonials = [
    { name: "Chloe L.", text: "Sent it to 5 friends — they all bought one", image: chloeImg },
    { name: "The Patels", text: "Our whole family read it together!", image: patelsImg },
    { name: "David R.", text: "Way more legit than I expected", image: davidImg },
    { name: "Emma T.", text: "Did one for my horse — nailed it!", image: emmaImg },
    { name: "The Nguyens", text: "Got all 3 pets done. No regrets", image: nguyensImg },
    { name: "Bob, 68", text: "My daughter showed me how to order. Worth it!", image: bobImg },
  ];

  return (
    <section className="relative py-20 px-4 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gold/5 to-transparent" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/30 mb-6">
            <Star className="w-4 h-4 text-gold fill-gold" />
            <span className="text-sm font-medium text-gold">Over 50,000 Happy Pet Parents</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-serif font-semibold text-foreground mb-4">
            {t('testimonials.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real stories from pet parents who discovered their pet's hidden cosmic personality
          </p>
        </motion.div>

        {/* Featured testimonials grid - first row */}
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {featuredTestimonials.slice(0, 3).map((testimonial, i) => (
            <FeaturedTestimonial
              key={testimonial.name}
              {...testimonial}
              delay={i * 0.1}
            />
          ))}
        </div>

        {/* Featured testimonials grid - second row */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {featuredTestimonials.slice(3, 6).map((testimonial, i) => (
            <FeaturedTestimonial
              key={testimonial.name}
              {...testimonial}
              delay={i * 0.1 + 0.3}
            />
          ))}
        </div>

        {/* Mini testimonials row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
        >
          {miniTestimonials.map((t, i) => (
            <div 
              key={i}
              className="flex items-center gap-3 bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4"
            >
              <img 
                src={t.image} 
                alt={t.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-gold/30 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex gap-0.5 mb-1">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-3 h-3 fill-gold text-gold" />
                  ))}
                </div>
                <p className="text-sm text-foreground font-medium leading-tight">"{t.text}"</p>
                <p className="text-xs text-muted-foreground mt-1">— {t.name}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center items-center gap-8 mt-12 pt-8 border-t border-border/30"
        >
          <div className="text-center">
            <p className="text-3xl font-bold text-gold">50,847</p>
            <p className="text-xs text-muted-foreground">Reports Generated</p>
          </div>
          <div className="w-px h-10 bg-border/50 hidden sm:block" />
          <div className="text-center">
            <p className="text-3xl font-bold text-gold">4.9/5</p>
            <p className="text-xs text-muted-foreground">Average Rating</p>
          </div>
          <div className="w-px h-10 bg-border/50 hidden sm:block" />
          <div className="text-center">
            <p className="text-3xl font-bold text-gold">97%</p>
            <p className="text-xs text-muted-foreground">Would Recommend</p>
          </div>
          <div className="w-px h-10 bg-border/50 hidden sm:block" />
          <div className="text-center">
            <p className="text-3xl font-bold text-gold">12k+</p>
            <p className="text-xs text-muted-foreground">5-Star Reviews</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
