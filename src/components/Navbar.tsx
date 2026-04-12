import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, Sparkles, User, LogOut, Gift, HelpCircle, Star, Info, ArrowRight, X, Sun, Moon } from "lucide-react";
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

export function Navbar({ hideGiftBanner = false }: { hideGiftBanner?: boolean }) {
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

  // Dark/light theme — persisted across sessions. Default = light (per brand).
  const [isDark, setIsDark] = useState<boolean>(() => {
    try { return localStorage.getItem('ls-theme') === 'dark'; } catch { return false; }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add('dark'); else root.classList.remove('dark');
    try { localStorage.setItem('ls-theme', isDark ? 'dark' : 'light'); } catch { /* noop */ }
  }, [isDark]);

  const toggleTheme = () => setIsDark((v) => !v);
  const ThemeIcon = isDark ? Sun : Moon;

  const hoverClass = isVariantC ? "hover:text-primary" : "hover:text-gold";

  return (
    <>
      {/* Variant C: Slim nav bar with logo + account */}
      {isVariantC && (
        <div className="fixed top-0 left-0 right-0 z-[61]">
          {/* Gift Banner */}
          {!giftBannerDismissed && !hideGiftBanner && (
            <div className="bg-[#bf524a] text-white text-center text-sm py-2 px-4 font-medium relative">
              <Link to="/gift" className="inline-flex items-center gap-2 hover:underline underline-offset-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>
                <span>Buying for someone else? Tap here to gift</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
              <button onClick={dismissGiftBanner} className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-white/20 rounded transition-colors" aria-label="Dismiss">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Ticker / Nav bar */}
          <div className="flex items-center justify-end px-4 py-2 bg-[#FFFDF5]/92 backdrop-blur-md border-b border-black/[0.06]" style={{ minHeight: 36 }}>
            <div className="flex items-center gap-3">
              {/* Theme toggle — sun/moon */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                aria-pressed={isDark}
                className="flex items-center justify-center w-7 h-7 rounded-full text-[#6e6259] hover:text-[#141210] hover:bg-[#f3eadb] transition-colors"
              >
                <ThemeIcon className="w-3.5 h-3.5" />
              </button>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1.5 text-[0.76rem] font-medium text-[#6e6259] hover:text-[#141210] transition-colors">
                      <User className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">My Account</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 bg-white border border-[#e8ddd0]">
                    <DropdownMenuItem asChild>
                      <Link to="/my-reports" className="flex items-center gap-2 cursor-pointer text-[0.82rem]">
                        <Sparkles className="w-3.5 h-3.5 text-[#c4a265]" />
                        My Reports
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 cursor-pointer text-[0.82rem]">
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth" className="flex items-center gap-1.5 text-sm font-medium text-[#6e6259] hover:text-[#141210] transition-colors">
                  <User className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
              )}

              {/* Hamburger menu */}
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <button className="p-1 text-[#958779] hover:text-[#141210] transition-colors" aria-label="Open menu">
                    <Menu className="w-4 h-4" />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] border-l p-0 bg-[#FFFDF5] backdrop-blur-xl border-[#e8ddd0]">
                  <SheetHeader className="p-5 border-b border-[#e8ddd0]">
                    <SheetTitle className="font-serif text-base font-semibold text-[#141210]">
                      Menu
                    </SheetTitle>
                  </SheetHeader>

                  <div className="flex flex-col h-[calc(100%-64px)]">
                    <div className="flex-1 py-4">
                      <div className="space-y-1 px-3">
                        {navLinks.map((link) => (
                          <SheetClose asChild key={link.href}>
                            <a
                              href={link.href}
                              className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#141210] hover:bg-[#f3eadb] transition-colors"
                            >
                              <link.icon className="w-4 h-4 text-[#958779]" />
                              <span className="text-sm font-medium">{link.label}</span>
                            </a>
                          </SheetClose>
                        ))}

                        <div className="h-px bg-[#e8ddd0] my-3" />

                        <SheetClose asChild>
                          <Link
                            to="/gift"
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#141210] hover:bg-[#f3eadb] transition-colors"
                          >
                            <Gift className="w-4 h-4 text-[#bf524a]" />
                            <span className="text-sm font-medium">Send as Gift</span>
                          </Link>
                        </SheetClose>
                      </div>

                      {user && (
                        <div className="mt-4 px-3">
                          <div className="h-px bg-[#e8ddd0] mb-3" />
                          <SheetClose asChild>
                            <Link
                              to="/my-reports"
                              className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#141210] hover:bg-[#f3eadb] transition-colors"
                            >
                              <Sparkles className="w-4 h-4 text-[#c4a265]" />
                              <span className="text-sm font-medium">My Reports</span>
                            </Link>
                          </SheetClose>
                          <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#141210] hover:bg-[#f3eadb] transition-colors w-full text-left"
                          >
                            <LogOut className="w-4 h-4 text-[#958779]" />
                            <span className="text-sm font-medium">Sign Out</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Bottom CTA */}
                    <div className="p-4 border-t border-[#e8ddd0] space-y-3">
                      <SheetClose asChild>
                        <a
                          href="/checkout.html"
                          className="flex items-center justify-center gap-2 w-full py-3 rounded-full text-white text-sm font-semibold uppercase tracking-wider"
                          style={{ background: "var(--rose, #bf524a)", letterSpacing: "0.08em" }}
                        >
                          <Sparkles className="w-4 h-4" />
                          {t('nav.getReading')}
                        </a>
                      </SheetClose>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      )}

    {/* Full nav for non-Variant C */}
    {!isVariantC && (
    <nav className={`fixed left-0 right-0 z-50 border-b top-0 bg-background/80 backdrop-blur-lg border-border/30`}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="font-serif text-lg font-semibold text-foreground">
              Little Souls
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

          {/* Right side: Language + Theme + Auth/CTA */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSelector variant="minimal" />

            {/* Theme toggle — sun/moon */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-pressed={isDark}
              className="flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <ThemeIcon className="w-4 h-4" />
            </button>

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
                  <a href="/checkout.html">
                    {t('nav.getReading')}
                  </a>
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
                    <Button variant="cosmic" className="w-full justify-center gap-2" asChild>
                      <a href="/checkout.html">
                        <Sparkles className="w-4 h-4" />
                        {t('nav.getReading')}
                      </a>
                    </Button>
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