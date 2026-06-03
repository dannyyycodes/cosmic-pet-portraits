import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Brush, Gift, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

const C = {
  cream: "#FFFDF5",
  cream2: "#faf6ef",
  sand: "#e8ddd0",
  ink: "#141210",
  warm: "#5a4a42",
  gold: "#7c5cd6",
  goldLight: "#9a7ee6",
  cosmos: "#0d0a14",
  cosmosText: "#f5efe6",
  cosmosDim: "#b8a89c",
};

interface NavItem {
  label: string;
  href: string;
  icon?: typeof Brush;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Pawtraits", href: "/pawtraits", icon: Brush },
  { label: "Gift", href: "/gift", icon: Gift },
];

export function ReadingsNav() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkColor = scrolled ? C.cosmosDim : C.cosmosDim;
  const brandColor = C.cosmosText;
  const navBg = scrolled ? "rgba(13, 10, 20, 0.82)" : "rgba(13, 10, 20, 0.18)";

  return (
    <header
      className="fixed left-0 right-0 top-0 z-[60] transition-colors duration-300"
      style={{
        background: navBg,
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: scrolled ? `1px solid rgba(124,92,214,0.22)` : "1px solid rgba(154,126,230,0.16)",
        height: 64,
      }}
    >
      <div
        className="mx-auto flex h-full items-center justify-between px-5 md:px-8"
        style={{ maxWidth: 1240 }}
      >
        <Link
          to="/"
          className="flex items-baseline gap-2 transition-opacity hover:opacity-80"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Little Souls Readings, back to top"
        >
          <span
            style={{
              color: brandColor,
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            Little Souls
          </span>
          <span
            style={{
              color: C.gold,
              fontFamily: "Lato, system-ui, sans-serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.16em",
            }}
          >
            READINGS
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-1.5 transition-colors"
                style={{
                  color: linkColor,
                  fontFamily: "Lato, system-ui, sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.goldLight)}
                onMouseLeave={(e) => (e.currentTarget.style.color = linkColor)}
              >
                {Icon && <Icon className="h-3.5 w-3.5" style={{ color: C.goldLight, strokeWidth: 2 }} />}
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          {user ? (
            <Link
              to="/account"
              className="hidden min-h-10 items-center gap-2 px-3 text-sm font-medium sm:inline-flex"
              style={{ color: linkColor, fontFamily: "Lato, system-ui, sans-serif" }}
              aria-label="My account"
            >
              <UserIcon /> Account
            </Link>
          ) : (
            <Link
              to="/auth"
              className="hidden min-h-10 items-center gap-2 px-3 text-sm font-medium sm:inline-flex"
              style={{
                color: C.cosmosText,
                border: "1px solid rgba(154,126,230,0.28)",
                borderRadius: 8,
                fontFamily: "Lato, system-ui, sans-serif",
              }}
              aria-label="Sign in"
            >
              <UserIcon /> Sign in
            </Link>
          )}

          <a
            href="/#checkout"
            className="hidden min-h-10 items-center gap-1.5 px-4 text-sm font-medium transition-colors sm:inline-flex"
            style={{
              background: C.goldLight,
              borderRadius: 8,
              color: C.ink,
              fontFamily: "Lato, system-ui, sans-serif",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#9a7ee6")}
            onMouseLeave={(e) => (e.currentTarget.style.background = C.goldLight)}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Begin Their Reading
          </a>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                className="inline-flex items-center justify-center lg:hidden"
                style={{
                  width: 40,
                  height: 40,
                  border: "1px solid rgba(154,126,230,0.32)",
                  borderRadius: 8,
                  background: "rgba(245,239,230,0.06)",
                  color: C.cosmosText,
                }}
                aria-label="Open menu"
              >
                <BurgerIcon />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[360px]" style={{ background: C.cosmos, borderColor: "rgba(124,92,214,0.22)" }}>
              <nav className="mt-10 flex flex-col gap-2" aria-label="Mobile primary">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SheetClose asChild key={item.href}>
                      <a
                        href={item.href}
                        className="inline-flex items-center gap-2 px-4 py-3"
                        style={{
                          color: C.cosmosText,
                          fontFamily: "Lato, system-ui, sans-serif",
                          fontSize: 16,
                          fontWeight: 500,
                        }}
                      >
                        {Icon && <Icon className="h-4 w-4" style={{ color: C.goldLight, strokeWidth: 2 }} />}
                        {item.label}
                      </a>
                    </SheetClose>
                  );
                })}

                <div className="mt-6 flex flex-col gap-2 border-t pt-6" style={{ borderColor: "rgba(124,92,214,0.22)" }}>
                  <SheetClose asChild>
                    <Link
                      to={user ? "/account" : "/auth"}
                      className="mx-4 inline-flex items-center justify-center gap-2 px-4 py-3 text-center"
                      style={{
                        border: "1px solid rgba(124,92,214,0.28)",
                        borderRadius: 8,
                        color: C.cosmosText,
                        fontFamily: "Lato, system-ui, sans-serif",
                        fontSize: 15,
                        fontWeight: 500,
                      }}
                    >
                      {user ? "My account" : "Sign in"}
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <a
                      href="/#checkout"
                      className="mx-4 mt-2 inline-flex items-center justify-center gap-2 px-4 py-3 text-center"
                      style={{
                        background: C.goldLight,
                        borderRadius: 8,
                        color: C.ink,
                        fontFamily: "Lato, system-ui, sans-serif",
                        fontSize: 15,
                        fontWeight: 600,
                      }}
                    >
                      <Sparkles className="h-4 w-4" />
                      Begin Their Reading
                    </a>
                  </SheetClose>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function UserIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
    </svg>
  );
}

function BurgerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}
