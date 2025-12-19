import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Sparkles, User, LogOut } from "lucide-react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

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
              AstroPets
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-gold transition-colors">
              {t('nav.howItWorks')}
            </a>
            <a href="#testimonials" className="text-sm text-muted-foreground hover:text-gold transition-colors">
              {t('nav.testimonials')}
            </a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-gold transition-colors">
              {t('nav.faq')}
            </a>
          </div>

          {/* Right side: Language + Auth/CTA */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSelector variant="minimal" />
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    My Account
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/my-reports" className="flex items-center gap-2 cursor-pointer">
                      <Sparkles className="w-4 h-4" />
                      My Reports
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 cursor-pointer">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button variant="cosmic" size="sm" asChild>
                  <Link to="/intake?mode=discover">
                    {t('nav.getReading')}
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            <LanguageSelector variant="minimal" />
            <button
              className="p-2 text-foreground"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
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
              {t('nav.howItWorks')}
            </a>
            <a 
              href="#testimonials" 
              className="block text-foreground hover:text-gold transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {t('nav.testimonials')}
            </a>
            <a 
              href="#faq" 
              className="block text-foreground hover:text-gold transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {t('nav.faq')}
            </a>
            
            {user ? (
              <>
                <Link 
                  to="/my-reports" 
                  className="block text-foreground hover:text-gold transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  My Reports
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsOpen(false);
                  }}
                  className="block text-foreground hover:text-gold transition-colors w-full text-left"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/auth" 
                  className="block text-foreground hover:text-gold transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
                <Button variant="cosmic" size="sm" className="w-full" asChild>
                  <Link to="/intake?mode=discover" onClick={() => setIsOpen(false)}>
                    {t('nav.getReading')}
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
