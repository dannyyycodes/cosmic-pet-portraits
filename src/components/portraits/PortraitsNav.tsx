/**
 * PortraitsNav — page-specific top navigation for /portraits.
 *
 * Replaces the global site Navbar on this route. Items reference our actual
 * page sections; auth uses existing AuthContext; mobile uses a sheet menu.
 *
 * Visual register matches the bright commercial palette:
 *   white surface, subtle backdrop blur, hairline bottom border, deep ink type.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { PALETTE } from "./tokens";

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Studio",           href: "/portraits#studio" },
  { label: "How It Works",     href: "/portraits#how" },
];

interface PortraitsNavProps {
  cartCount?: number;
  onCartOpen?: () => void;
}

export function PortraitsNav({ cartCount = 0, onCartOpen }: PortraitsNavProps) {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[60] transition-all"
      style={{
        background: scrolled ? "rgba(255, 255, 255, 0.92)" : "rgba(255, 255, 255, 0.78)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: scrolled ? `1px solid ${PALETTE.sand}` : "1px solid transparent",
        height: "62px",
      }}
    >
      <div
        className="mx-auto flex items-center justify-between h-full px-5 md:px-8"
        style={{ maxWidth: "1240px" }}
      >
        {/* ── Brand wordmark ── */}
        <Link
          to="/portraits"
          className="flex items-baseline gap-2 transition-opacity hover:opacity-80"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          aria-label="Little Souls Portraits — back to top"
        >
          <span
            style={{
              fontFamily: "Asap, system-ui, sans-serif",
              fontSize: "20px",
              fontWeight: 800,
              color: PALETTE.ink,
              letterSpacing: "-0.018em",
            }}
          >
            Little Souls
          </span>
          <span style={{ fontSize: "11px", color: PALETTE.rose, fontWeight: 700, letterSpacing: "0.18em" }}>
            ✦ &nbsp;PORTRAITS
          </span>
        </Link>

        {/* ── Desktop nav links ── */}
        <nav className="hidden lg:flex items-center gap-7" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="transition-colors"
              style={{
                fontFamily: "Assistant, system-ui, sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                color: PALETTE.earth,
                letterSpacing: "0.01em",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = PALETTE.rose)}
              onMouseLeave={(e) => (e.currentTarget.style.color = PALETTE.earth)}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* ── Right action group ── */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Account */}
          {user ? (
            <Link
              to="/account"
              className="hidden sm:inline-flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors"
              style={{
                fontFamily: "Assistant, system-ui, sans-serif",
                fontSize: "13px",
                fontWeight: 600,
                color: PALETTE.earth,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = PALETTE.rose)}
              onMouseLeave={(e) => (e.currentTarget.style.color = PALETTE.earth)}
              aria-label="My account"
            >
              <UserIcon /> Account
            </Link>
          ) : (
            <Link
              to="/auth"
              className="hidden sm:inline-flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors"
              style={{
                fontFamily: "Assistant, system-ui, sans-serif",
                fontSize: "13px",
                fontWeight: 600,
                color: PALETTE.earth,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = PALETTE.rose)}
              onMouseLeave={(e) => (e.currentTarget.style.color = PALETTE.earth)}
              aria-label="Sign in"
            >
              <UserIcon /> Sign in
            </Link>
          )}

          {/* Cart icon + count badge — opens CartDrawer */}
          <button
            type="button"
            onClick={onCartOpen}
            aria-label={`Cart · ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
            className="relative inline-flex items-center justify-center rounded-full transition-all hover:scale-[1.04]"
            style={{
              width: "40px",
              height: "40px",
              background: cartCount > 0 ? PALETTE.ink : PALETTE.cream,
              border: `1px solid ${cartCount > 0 ? PALETTE.ink : PALETTE.sand}`,
              color: cartCount > 0 ? PALETTE.cream : PALETTE.earth,
            }}
          >
            <CartIcon />
            {cartCount > 0 && (
              <span
                aria-hidden
                className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full"
                style={{
                  minWidth: "18px",
                  height: "18px",
                  background: PALETTE.rose,
                  color: PALETTE.cream,
                  fontSize: "10.5px",
                  fontWeight: 800,
                  padding: "0 5px",
                  fontFamily: "Asap, system-ui, sans-serif",
                  fontVariantNumeric: "tabular-nums",
                  border: `1.5px solid ${PALETTE.cream}`,
                }}
              >
                {cartCount}
              </span>
            )}
          </button>

          {/* Begin CTA — visible on all sizes, primary action */}
          <a
            href="#upload"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full transition-all hover:scale-[1.02]"
            style={{
              background: PALETTE.rose,
              color: PALETTE.cream,
              fontFamily: "Assistant, system-ui, sans-serif",
              fontSize: "13.5px",
              fontWeight: 700,
              letterSpacing: "0.02em",
              padding: "9px 18px",
              boxShadow: "0 6px 16px rgba(191, 82, 74, 0.25)",
            }}
          >
            Begin
            <span aria-hidden style={{ fontSize: "13px" }}>→</span>
          </a>

          {/* ── Mobile sheet trigger ── */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                className="lg:hidden inline-flex items-center justify-center rounded-full"
                style={{
                  width: "38px",
                  height: "38px",
                  border: `1px solid ${PALETTE.sand}`,
                  background: PALETTE.cream,
                }}
                aria-label="Open menu"
              >
                <BurgerIcon />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[360px]" style={{ background: PALETTE.cream, borderColor: PALETTE.sand }}>
              <nav className="mt-10 flex flex-col gap-2" aria-label="Mobile primary">
                {NAV_ITEMS.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <a
                      href={item.href}
                      className="rounded-sm px-4 py-3 transition-colors"
                      style={{
                        fontFamily: "Asap, system-ui, sans-serif",
                        fontSize: "17px",
                        fontWeight: 600,
                        color: PALETTE.ink,
                        background: "transparent",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = PALETTE.cream2)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {item.label}
                    </a>
                  </SheetClose>
                ))}

                <div className="mt-6 border-t pt-6 flex flex-col gap-2" style={{ borderColor: PALETTE.sand }}>
                  <SheetClose asChild>
                    <Link
                      to={user ? "/account" : "/auth"}
                      className="rounded-sm px-4 py-3"
                      style={{
                        fontFamily: "Asap, system-ui, sans-serif",
                        fontSize: "16px",
                        fontWeight: 500,
                        color: PALETTE.earth,
                      }}
                    >
                      {user ? "My account" : "Sign in"}
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <a
                      href="#upload"
                      className="rounded-full text-center mx-4 mt-3"
                      style={{
                        background: PALETTE.rose,
                        color: PALETTE.cream,
                        fontFamily: "Assistant, system-ui, sans-serif",
                        fontSize: "15px",
                        fontWeight: 700,
                        padding: "12px 18px",
                      }}
                    >
                      Begin their portrait →
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

// ─── Icons ───────────────────────────────────────────────────────────────
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
function CartIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 7h14l-1.5 11.5a2 2 0 0 1-2 1.75h-7a2 2 0 0 1-2-1.75L5 7z" />
      <path d="M9 10V6a3 3 0 0 1 6 0v4" />
    </svg>
  );
}
