import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Sparkles } from "lucide-react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/30">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-tangerine flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-background" />
            </div>
            <span className="font-serif text-lg font-semibold text-foreground">
              Astro Paws
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-gold transition-colors">
              How It Works
            </a>
            <a href="#testimonials" className="text-sm text-muted-foreground hover:text-gold transition-colors">
              Testimonials
            </a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-gold transition-colors">
              FAQ
            </a>
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Button variant="cosmic" size="sm" asChild>
              <Link to="/intake?mode=discover">
                Get Started
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-lg border-b border-border/30">
          <div className="px-4 py-4 space-y-4">
            <a 
              href="#how-it-works" 
              className="block text-foreground hover:text-gold transition-colors"
              onClick={() => setIsOpen(false)}
            >
              How It Works
            </a>
            <a 
              href="#testimonials" 
              className="block text-foreground hover:text-gold transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Testimonials
            </a>
            <a 
              href="#faq" 
              className="block text-foreground hover:text-gold transition-colors"
              onClick={() => setIsOpen(false)}
            >
              FAQ
            </a>
            <Button variant="cosmic" size="sm" className="w-full" asChild>
              <Link to="/intake?mode=discover" onClick={() => setIsOpen(false)}>
                Get Started
              </Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
