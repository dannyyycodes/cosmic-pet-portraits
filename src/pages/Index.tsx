import heroNebula from "@/assets/hero-nebula.jpg";
import trustpilotStars from "@/assets/trustpilot-stars.png";
import { Button } from "@/components/ui/button";
import { Star, Heart, Search, Sparkles, Check, Shield } from "lucide-react";

const Index = () => {
  return (
    <main className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroNebula} 
            alt="" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/50 to-background" />
        </div>

        {/* Animated Stars */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-starlight rounded-full animate-star-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                opacity: Math.random() * 0.5 + 0.3,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/30 bg-background/30 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-sm text-gold font-medium">Cosmic Pet Astrology</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-semibold text-foreground leading-tight mb-6">
            Your pet has a hidden side.{" "}
            <span className="italic text-gold">The stars can show you.</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            What if you finally understood what your pet is trying to tell you? 
            Discover how to make them feel even more loved and understood through 
            their unique cosmic personality.
          </p>

          <Button variant="cosmic" size="xl" className="mb-4">
            Reveal My Pet's Free Cosmic Profile
          </Button>

          <p className="text-sm text-muted-foreground/70 max-w-md mx-auto mb-8">
            Instant on-screen reading. No payment required. Just your pet's name, 
            birth date, and a minute of your time.
          </p>

          {/* Trust Badge */}
          <div className="flex flex-col items-center gap-3">
            <img 
              src={trustpilotStars} 
              alt="Trustpilot 4.9 stars" 
              className="h-10 w-auto brightness-0 invert"
            />
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-background/40 backdrop-blur-sm border border-border/50">
              <span className="text-sm text-foreground/80">
                Rated <strong className="text-gold">4.9/5</strong> by 2,000+ Pet Parents
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Strip */}
      <section className="py-16 px-4 bg-secondary/50 border-y border-border/30">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-2xl sm:text-3xl font-serif text-foreground mb-4">
            Over <span className="text-gold font-semibold">92%</span> of pet parents who see their 
            free profile go on to unlock the full reading.
          </p>
          <p className="text-muted-foreground mb-3">
            Find out why it feels so uncannily true.
          </p>
          <p className="text-sm text-gold italic">
            Crafted by astrologers and pet-lovers who know every tail tells a story.
          </p>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-serif text-center text-foreground mb-4">
            What Pet Parents Are Saying
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Real stories from pet parents who discovered their companion's cosmic truth
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                text: "Shockingly accurate. I thought it was a gimmick until it literally described my cat's behaviour word for word.",
                author: "Emily",
                pet: "Luna",
              },
              {
                text: "I didn't expect it to make me cry but it did. It felt like my dog's little soul was speaking.",
                author: "Ella",
                pet: "Rufus",
              },
              {
                text: "It made me realise how sensitive my rabbit is. I've started giving her more quiet time and she's calmer.",
                author: "Sophie",
                pet: "Clover",
              },
            ].map((testimonial, i) => (
              <div 
                key={i} 
                className="glass-card p-6 rounded-2xl"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-gold text-gold" />
                  ))}
                </div>
                <p className="text-foreground/90 leading-relaxed mb-6 italic">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/30 to-primary/30 flex items-center justify-center">
                    <span className="text-sm font-semibold text-gold">
                      {testimonial.author[0]}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {testimonial.author} with <span className="text-gold">{testimonial.pet}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-secondary/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-serif text-center text-foreground mb-4">
            Why This Reading Changes Everything
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-xl mx-auto">
            More than just insight—it's a doorway to deeper connection
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Heart,
                title: "See The Soul Behind The Species",
                text: "Forget just their breed. Your pet has a unique cosmic signature that shapes how they love, play, and protect.",
              },
              {
                icon: Search,
                title: "Understand The 'Why' Behind Their Actions",
                text: "That quirky habit? That specific mood? Now you'll have the key. Recognize the little signs that reveal your pet's unique spirit.",
              },
              {
                icon: Sparkles,
                title: "Create Tangible Shifts in Your Relationship",
                text: "This isn't just insight—it's practical magic. Pet parents report calmer pets, closer moments, and a profound new understanding almost immediately.",
              },
            ].map((item, i) => (
              <div key={i} className="text-center group">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <item.icon className="w-7 h-7 text-gold" />
                </div>
                <h3 className="text-xl font-serif text-gold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Button variant="cosmicOutline" size="lg">
              Understand My Pet's True Nature
            </Button>
          </div>
        </div>
      </section>

      {/* Leo Card Teaser */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-serif text-foreground mb-4">
            Your pet's first cosmic message has arrived.
          </h2>
          <p className="text-muted-foreground mb-12">
            A glimpse into the mystical bond waiting to be discovered
          </p>

          {/* Cosmic Card */}
          <div className="relative max-w-md mx-auto">
            {/* Glow Effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-gold/30 via-primary/20 to-gold/30 rounded-3xl blur-xl opacity-60 animate-pulse" />
            
            <div className="cosmic-card relative rounded-2xl p-8 border border-gold/40 glow-gold">
              <div className="relative z-10">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center">
                  <span className="text-3xl">♌</span>
                </div>

                <h3 className="text-2xl font-serif text-gold mb-2">LEO</h3>
                <p className="text-sm text-gold/80 font-medium tracking-wider uppercase mb-6">
                  The Radiant Guardian
                </p>

                <div className="space-y-3 text-left mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gold/60 uppercase tracking-wide w-28">Ruling Element</span>
                    <span className="text-foreground">Fire</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gold/60 uppercase tracking-wide w-28">Core Nature</span>
                    <span className="text-foreground">Brave, devoted, endlessly protective</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gold/60 uppercase tracking-wide w-28">Gift</span>
                    <span className="text-foreground">Turns loyalty into light</span>
                  </div>
                </div>

                <div className="border-t border-gold/20 pt-6">
                  <p className="text-foreground/80 text-sm leading-relaxed italic">
                    "Your Leo lives with their heart wide open. Praise feeds their soul; 
                    silence dims it. When you understand this rhythm, the entire relationship changes."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-secondary/30 to-background">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-serif text-foreground mb-4">
            You've Just Seen a Single Star.{" "}
            <span className="italic text-gold">Ready to Explore the Entire Galaxy?</span>
          </h2>
          <p className="text-muted-foreground mb-12 max-w-2xl mx-auto">
            The Free Mini-Report is a powerful glimpse, but the Complete Cosmic Portrait 
            is the deep, soul-level conversation you've been longing for.
          </p>

          <div className="glass-card max-w-lg mx-auto p-8 rounded-2xl border border-gold/30">
            <h3 className="text-xl font-serif text-gold mb-6">Complete Cosmic Portrait</h3>
            
            <div className="space-y-4 text-left mb-8">
              {[
                "The Karmic Thread Between You",
                "Their Emotional World Decoded",
                "Your Unique Bond Blueprint",
                "Personalized Guidance & Rituals",
                "Lifetime Access to Updates",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-gold" />
                  </div>
                  <span className="text-foreground/90">{item}</span>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <span className="text-5xl font-serif text-gold">$27</span>
              <span className="text-muted-foreground ml-2">one-time</span>
            </div>

            <Button variant="cosmic" size="xl" className="w-full mb-4">
              Unlock My Pet's Complete Cosmic Portrait
            </Button>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4 text-gold" />
              <span>30-Day Happiness Guarantee</span>
            </div>
            <p className="text-xs text-muted-foreground/70 mt-2">
              If your pet doesn't feel 'seen', we refund you.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border/30">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-muted-foreground/60 text-sm mb-4">
            © 2025 The Cosmic Pet Report.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm">
            <a href="#" className="text-muted-foreground hover:text-gold transition-colors">
              Terms
            </a>
            <a href="#" className="text-muted-foreground hover:text-gold transition-colors">
              Privacy
            </a>
            <a href="#" className="text-muted-foreground hover:text-gold transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Index;
