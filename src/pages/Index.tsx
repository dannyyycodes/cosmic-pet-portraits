import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star, Sparkles, Gift, Heart, Cake, ArrowDown } from "lucide-react";
import { HomeTestimonials } from "@/components/HomeTestimonials";

type OccasionMode = "discover" | "birthday" | "memorial" | "gift";

const occasionContent = {
  discover: {
    headline: "Do You Know Your Pet's 'Soul Contract'?",
    subhead: "92% of owners say this reading revealed the spiritual agreement they share. Discover their true purpose in 60 seconds.",
    buttonText: "Reveal My Pet's Soul Profile",
    icon: Sparkles,
  },
  birthday: {
    headline: "The Ultimate Cosmic Gift for Their Solar Return.",
    subhead: "Celebrate another orbit of love. Unlock a birthday report that reveals the light they bring into your life.",
    buttonText: "Create a Birthday Portrait",
    icon: Cake,
  },
  memorial: {
    headline: "Honor the Starlight That Never Fades.",
    subhead: "Your bond didn't end; it evolved. Discover the eternal soul contract that connects you forever.",
    buttonText: "Create a Memorial Tribute",
    icon: Heart,
  },
  gift: {
    headline: "The Gift Every Pet Lover Actually Wants.",
    subhead: "Forget toys and treats. Give them a window into their pet's soul. The most meaningful, personalized surprise for any occasion.",
    buttonText: "Send a Cosmic Gift",
    icon: Gift,
  },
};

const Index = () => {
  const [selectedMode, setSelectedMode] = useState<OccasionMode>("discover");
  const content = occasionContent[selectedMode];
  const IconComponent = content.icon;

  return (
    <main className="min-h-screen bg-background overflow-hidden">
      {/* Dynamic Cosmic Background */}
      <div className="fixed inset-0 z-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220,35%,8%)] via-[hsl(220,35%,6%)] to-[hsl(220,35%,4%)]" />
        
        {/* Animated nebula layers */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 20% 30%, hsl(280 50% 30% / 0.5), transparent 60%)',
            animation: 'cosmic-breathe 12s ease-in-out infinite',
          }}
        />
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 75% 70%, hsl(220 60% 35% / 0.4), transparent 50%)',
            animation: 'cosmic-breathe 15s ease-in-out infinite reverse',
          }}
        />
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: 'radial-gradient(ellipse 50% 50% at 50% 50%, hsl(25 80% 50% / 0.15), transparent 60%)',
            animation: 'cosmic-breathe 18s ease-in-out infinite',
          }}
        />

        {/* Floating Star Particles */}
        {[...Array(80)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-starlight"
            style={{
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.6 + 0.2,
              animation: `twinkle ${Math.random() * 4 + 3}s ease-in-out infinite, star-float ${Math.random() * 20 + 15}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative flex items-center justify-center px-4 pt-20 pb-8 z-10">
        <div className="max-w-4xl mx-auto text-center">
          
          {/* Dynamic Intent Switcher - Segmented Control with Arrow */}
          <div className="relative inline-block mb-8">
            {/* Golden Arrow + Label */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce-gentle">
              <span className="text-gold text-sm font-medium whitespace-nowrap mb-1">
                ✨ Select Occasion
              </span>
              <ArrowDown className="w-5 h-5 text-gold" />
            </div>
            
            {/* Segmented Control */}
            <div className="inline-flex items-center p-1 rounded-full bg-background/30 backdrop-blur-md border border-gold/40 shadow-[0_0_20px_hsl(43_69%_52%/0.2)]">
              {(["discover", "birthday", "memorial", "gift"] as OccasionMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSelectedMode(mode)}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 capitalize ${
                    selectedMode === mode
                      ? "bg-gold/90 text-background shadow-lg shadow-gold/20"
                      : "text-foreground/70 hover:text-foreground hover:bg-foreground/10"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Main Headline with Gold-Purple Gradient */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-semibold leading-tight mb-6">
            <span className="text-gradient-gold-purple">
              {content.headline}
            </span>
          </h1>

          {/* Subhead */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            {content.subhead}
          </p>

          {/* Magical CTA Button */}
          <div className="relative inline-block mb-6">
            <Button 
              variant="cosmic" 
              size="xl" 
              className={`btn-magical relative z-10 ${selectedMode === "gift" ? "btn-shimmer" : ""}`}
              asChild
            >
              <Link to={`/intake?mode=${selectedMode}`}>
                <IconComponent className="w-5 h-5 mr-2" />
                {content.buttonText}
              </Link>
            </Button>
          </div>

          {/* Authority Seal */}
          <div className="flex justify-center mb-8">
            <div className="authority-seal inline-flex items-center gap-3 px-6 py-3 rounded-xl">
              <div className="relative">
                <Star className="w-5 h-5 text-gold fill-gold" />
                <Sparkles className="w-3 h-3 text-gold absolute -top-1 -right-1" />
              </div>
              <span className="text-sm text-foreground/80">
                Powered by <span className="text-gold font-medium">Swiss Ephemeris data</span>, crafted by devoted pet lovers
              </span>
            </div>
          </div>

          {/* Trust Badge */}
          <div className="flex flex-col items-center gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-background/40 backdrop-blur-sm border border-border/50">
              <span className="text-sm text-foreground/80">
                Rated <strong className="text-gold">4.9/5</strong> by 2,000+ Pet Parents
              </span>
            </div>
            {/* Trustpilot Logo */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1">
                <Star className="w-6 h-6 fill-[#00b67a] text-[#00b67a]" />
                <span className="text-xl font-semibold text-foreground tracking-tight">Trustpilot</span>
              </div>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-7 h-7 flex items-center justify-center bg-[#00b67a]">
                    <Star className="w-4 h-4 fill-white text-white" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative pt-6 pb-20 px-4 z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-serif text-center text-foreground mb-4">
            What Pet Parents Are Saying
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Real stories from pet parents who discovered their companion's cosmic truth
          </p>

          <HomeTestimonials />
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-4 border-t border-border/30 z-10">
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
