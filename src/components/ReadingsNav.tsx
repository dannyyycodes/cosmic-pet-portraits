import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Brush, Gift } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { descendTo } from "@/lib/descend";
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

/* the house metal-gold ramp (mockup material system) + its ink */
const GOLD_METAL =
  "linear-gradient(180deg,#f7e7b6 0%,#e9cd8b 18%,#d4b26b 40%,#c4a265 56%,#a9884f 80%,#8a6d3b 100%)";
const GOLD_INK = "#2a1f0a";
const GOLD_CTA_SHADOW =
  "0 1px 0 rgba(255,255,255,.4) inset, 0 -1px 0 rgba(0,0,0,.28) inset, 0 4px 14px -6px rgba(208,169,82,.45)";

/* the checkout lives at #begin on the funnel page; descend, never jump */
function goToBegin(e: React.MouseEvent<HTMLAnchorElement>) {
  const el = document.getElementById("begin");
  if (el) {
    e.preventDefault();
    descendTo(el);
  }
}

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
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
    let frame = 0;
    const apply = () => {
      frame = 0;
      setScrolled(window.scrollY > 18);
      // Inside the cosmic passage the nav fades to near-invisible so no beat
      // headline is ever sliced by a bar; it returns as the free reading
      // (the passage's end) reaches the top of the viewport.
      const header = headerRef.current;
      if (!header) return;
      const bridge = document.querySelector(".lcb-root");
      let op = 1;
      if (bridge) {
        const r = bridge.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        const outP = clamp01((vh * 0.5 - r.top) / (vh * 0.22));
        // only return once the passage's last line has fully cleared the nav
        // zone: ramp from bottom=100px (still hidden) to bottom=-80px (back)
        const backP = clamp01((r.bottom + 80) / 180);
        op = 1 - Math.min(outP, backP) * 0.96;
      }
      header.style.opacity = op.toFixed(3);
      header.style.pointerEvents = op < 0.5 ? "none" : "";
      header.style.visibility = op <= 0.05 ? "hidden" : "visible";
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const linkColor = C.cosmosDim;
  const brandColor = C.cosmosText;

  return (
    <header
      ref={headerRef}
      className="fixed left-0 right-0 top-0 z-[60]"
      style={{ height: 64 }}
    >
      {/* transparent blur scrim: darkest at the very top, gone by ~96px down,
          so it can never read as an opaque bar slicing a headline */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: 96,
          pointerEvents: "none",
          background: scrolled
            ? "linear-gradient(180deg, rgba(11,9,17,0.82) 0%, rgba(11,9,17,0.42) 52%, rgba(11,9,17,0) 100%)"
            : "linear-gradient(180deg, rgba(11,9,17,0.55) 0%, rgba(11,9,17,0.22) 52%, rgba(11,9,17,0) 100%)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          maskImage: "linear-gradient(180deg, #000 0%, #000 42%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(180deg, #000 0%, #000 42%, transparent 100%)",
          transition: "background 0.3s ease",
        }}
      />
      <div
        className="relative mx-auto flex h-full items-center justify-between px-5 md:px-8"
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
              fontFamily: '"Fraunces", Georgia, serif',
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
              fontFamily: '"Newsreader", Georgia, serif',
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
                  fontFamily: '"Newsreader", Georgia, serif',
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
              style={{ color: linkColor, fontFamily: '"Newsreader", Georgia, serif' }}
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
                fontFamily: '"Newsreader", Georgia, serif',
              }}
              aria-label="Sign in"
            >
              <UserIcon /> Sign in
            </Link>
          )}

          <a
            href="/#begin"
            onClick={goToBegin}
            className="hidden min-h-10 items-center gap-1.5 px-4 text-sm sm:inline-flex"
            style={{
              backgroundImage: GOLD_METAL,
              borderRadius: 9,
              color: GOLD_INK,
              fontFamily: '"Newsreader", Georgia, serif',
              fontWeight: 600,
              letterSpacing: "0.02em",
              boxShadow: GOLD_CTA_SHADOW,
              transition: "filter .18s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.07) saturate(1.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.filter = "")}
          >
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
                          fontFamily: '"Newsreader", Georgia, serif',
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
                        fontFamily: '"Newsreader", Georgia, serif',
                        fontSize: 15,
                        fontWeight: 500,
                      }}
                    >
                      {user ? "My account" : "Sign in"}
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <a
                      href="/#begin"
                      onClick={goToBegin}
                      className="mx-4 mt-2 inline-flex items-center justify-center gap-2 px-4 py-3 text-center"
                      style={{
                        backgroundImage: GOLD_METAL,
                        borderRadius: 10,
                        color: GOLD_INK,
                        fontFamily: '"Newsreader", Georgia, serif',
                        fontSize: 15,
                        fontWeight: 600,
                        letterSpacing: "0.02em",
                        boxShadow: GOLD_CTA_SHADOW,
                      }}
                    >
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
