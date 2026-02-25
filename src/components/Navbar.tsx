import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, Sparkles, User, LogOut, Gift, HelpCircle, Star, Info, ArrowRight, X } from "lucide-react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useABTest } from "@/hooks/useABTest";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [giftBannerDismissed, setGiftBannerDismissed] = useState(() => {
    return sessionStorage.getItem('gift-banner-dismissed') === 'true';
  });
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const { isVariantC } = useABTest();

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  const dismissGiftBanner = () => {
    setGiftBannerDismissed(true);
    sessionStorage.setItem('gift-banner-dismissed', 'true');
  };

  const navLinks = [
    { href: "#how-it-works", label: t('nav.howItWorks'), icon: Info },
    { href: "#testimonials", label: t('nav.testimonials'), icon: Star },
    { href: "#faq", label: t('nav.faq'), icon: HelpCircle },
  ];

  const hoverClass = isVariantC ? "hover:text-primary" : "hover:text-gold";

  return (
    <>
      {/* Gift Banner — Variant C only */}
      {isVariantC && !giftBannerDismissed && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-[#2D7D46] text-white text-center text-sm py-2.5 px-4">
          <div className="max-w-6xl mx-auto flex items-center justify-center gap-2">
            <Link to="/gift" className="flex items-center gap-2 hover:underline underline-offset-2 font-medium">
              <span>🎁</span>
              <span>The perfect gift for a pet lover</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button onClick={dismissGiftBanner} className="absolute right-3 p-1 hover:bg-white/20 rounded transition-colors" aria-label="Dismiss">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    {/* Hide entire nav for Variant C — only gift banner shows */}
    {!isVariantC && (
    <nav className={`fixed left-0 right-0 z-50 border-b top-0 bg-background/80 backdrop-blur-lg border-border/30`}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="font-serif text-lg font-semibold text-foreground">
              Pet Readings
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/blog" className={`text-sm text-muted-foreground ${hoverClass} transition-colors`}>
              Blog
            </Link>
            <a href="#how-it-works" className={`text-sm text-muted-foreground ${hoverClass} transition-colors`}>
              {t('nav.howItWorks')}
            </a>
            <a href="#testimonials" className={`text-sm text-muted-foreground ${hoverClass} transition-colors`}>
              {t('nav.testimonials')}
            </a>
            <a href="#faq" className={`text-sm text-muted-foreground ${hoverClass} transition-colors`}>
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
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <button className="p-2 text-foreground hover:bg-muted/50 rounded-lg transition-colors">
                  <Menu className="w-6 h-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] border-l p-0 bg-background/95 backdrop-blur-xl border-border/50">
                <SheetHeader className="p-6 border-b border-border/30">
                  <div className="flex items-center justify-between">
                    <SheetTitle className="font-serif text-lg font-semibold text-foreground">
                      Menu
                    </SheetTitle>
                  </div>
                </SheetHeader>
                
                <div className="flex flex-col h-[calc(100%-80px)]">
                  {/* Navigation Links */}
                  <div className="flex-1 py-4">
                    <div className="space-y-1 px-3">
                      {navLinks.map((link) => (
                        <SheetClose asChild key={link.href}>
                          <a
                            href={link.href}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-muted/50 transition-colors"
                          >
                            <link.icon className="w-5 h-5 text-muted-foreground" />
                            <span className="font-medium">{link.label}</span>
                          </a>
                        </SheetClose>
                      ))}
                      
                      <div className="h-px bg-border/50 my-3" />
                      
                      <SheetClose asChild>
                        <Link
                          to="/gift"
                          className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-muted/50 transition-colors"
                        >
                          <Gift className="w-5 h-5 text-primary" />
                          <span className="font-medium">Send as Gift</span>
                        </Link>
                      </SheetClose>
                    </div>

                    {/* User section */}
                    {user && (
                      <div className="mt-4 px-3">
                        <div className="h-px bg-border/50 mb-3" />
                        <SheetClose asChild>
                          <Link
                            to="/my-reports"
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-muted/50 transition-colors"
                          >
                            <Sparkles className="w-5 h-5 text-accent" />
                            <span className="font-medium">My Reports</span>
                          </Link>
                        </SheetClose>
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-muted/50 transition-colors w-full text-left"
                        >
                          <LogOut className="w-5 h-5 text-muted-foreground" />
                          <span className="font-medium">Sign Out</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Bottom CTA */}
                  <div className="p-4 border-t border-border/30 space-y-3">
                    {!user && (
                      <SheetClose asChild>
                        <Link to="/auth" className="block">
                          <Button variant="outline" className="w-full justify-center gap-2">
                            <User className="w-4 h-4" />
                            Sign In
                          </Button>
                        </Link>
                      </SheetClose>
                    )}
                    <SheetClose asChild>
                      <Link to="/intake?mode=discover" className="block">
                        <Button variant="cosmic" className="w-full justify-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          {t('nav.getReading')}
                        </Button>
                      </Link>
                    </SheetClose>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
    )}
    </>
  );
}