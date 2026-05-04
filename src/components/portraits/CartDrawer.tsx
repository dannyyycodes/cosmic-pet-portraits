/**
 * CartDrawer — slide-in cart panel for /portraits.
 *
 * Lists configured cart items with their generated preview thumbnail,
 * product + size + price, and a remove button per row. Footer holds the
 * subtotal + "Continue to checkout" CTA which fires the multi-item draft
 * order create flow.
 *
 * Empty state nudges them back to the studio.
 */
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";
import { PALETTE, cormorantItalic, EASE } from "./tokens";
import { type CartItem, cartSubtotalMajor, itemTotalMajor } from "./cart";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  onRemove: (id: string) => void;
  onCheckout: () => void;
  checkoutBusy?: boolean;
  checkoutError?: string | null;
}

export function CartDrawer({
  open,
  onOpenChange,
  items,
  onRemove,
  onCheckout,
  checkoutBusy,
  checkoutError,
}: CartDrawerProps) {
  const subtotal = cartSubtotalMajor(items);
  const isEmpty = items.length === 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0"
        style={{ background: PALETTE.cream, borderColor: PALETTE.sand }}
      >
        <SheetHeader
          className="px-6 pt-6 pb-4 text-left"
          style={{ borderBottom: `1px solid ${PALETTE.sand}` }}
        >
          <SheetTitle
            style={{
              fontFamily: 'Asap, system-ui, sans-serif',
              fontSize: "20px",
              fontWeight: 700,
              color: PALETTE.ink,
              letterSpacing: "-0.01em",
            }}
          >
            Your portraits
            {!isEmpty && (
              <span style={{ color: PALETTE.earthMuted, fontWeight: 400, marginLeft: "8px" }}>
                · {items.length}
              </span>
            )}
          </SheetTitle>
          {!isEmpty && (
            <SheetDescription
              style={{ fontSize: "13px", color: PALETTE.earthMuted, marginTop: "2px" }}
            >
              Each portrait ships in 3–5 days · refund if it doesn't feel like them
            </SheetDescription>
          )}
        </SheetHeader>

        {/* ── Items list ──────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {isEmpty ? (
            <EmptyState />
          ) : (
            <ul className="px-6 py-4 space-y-4">
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.li
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: 20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: "auto" }}
                    exit={{ opacity: 0, x: 20, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0 }}
                    transition={{ duration: 0.32, ease: EASE.out }}
                    className="overflow-hidden"
                  >
                    <CartLine item={item} onRemove={onRemove} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>

        {/* ── Footer (subtotal + CTA) ─────────────────────────────── */}
        {!isEmpty && (
          <footer
            className="px-6 py-5"
            style={{ borderTop: `1px solid ${PALETTE.sand}`, background: PALETTE.cream2 }}
          >
            <div className="flex items-baseline justify-between mb-4">
              <span
                style={{
                  fontFamily: 'Assistant, system-ui, sans-serif',
                  fontSize: "12px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  color: PALETTE.earthMuted,
                }}
              >
                Subtotal
              </span>
              <span
                style={{
                  fontFamily: 'Asap, system-ui, sans-serif',
                  fontSize: "26px",
                  fontWeight: 700,
                  color: PALETTE.ink,
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "-0.01em",
                }}
              >
                £{subtotal}
              </span>
            </div>

            <button
              type="button"
              onClick={onCheckout}
              disabled={checkoutBusy}
              className="w-full px-6 py-4 rounded-full transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: PALETTE.rose,
                color: PALETTE.cream,
                fontFamily: 'Assistant, system-ui, sans-serif',
                fontSize: "16px",
                fontWeight: 700,
                letterSpacing: "0.01em",
                boxShadow: "0 18px 40px rgba(191, 82, 74, 0.28)",
              }}
            >
              {checkoutBusy ? "Opening checkout…" : "Continue to checkout →"}
            </button>

            {checkoutError && (
              <p style={{ marginTop: "10px", fontSize: "13px", color: PALETTE.rose, textAlign: "center" }}>
                {checkoutError}
              </p>
            )}

            <p
              className="mt-3 text-center"
              style={{ fontSize: "12px", color: PALETTE.earthMuted, letterSpacing: "0.02em" }}
            >
              Shipping calculated at checkout · Apple Pay · Shop Pay · cards
            </p>
          </footer>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ─── Item row ────────────────────────────────────────────────────── */
function CartLine({ item, onRemove }: { item: CartItem; onRemove: (id: string) => void }) {
  const total = itemTotalMajor(item);
  return (
    <article
      className="flex gap-4 p-3 rounded-sm"
      style={{ background: PALETTE.cream2, border: `1px solid ${PALETTE.sand}` }}
    >
      {/* Thumbnail = the generated preview */}
      <div
        className="flex-shrink-0 overflow-hidden rounded-sm"
        style={{
          width: "72px",
          height: "90px",
          background: PALETTE.cosmos,
          border: `1px solid ${PALETTE.sand}`,
        }}
      >
        <img
          src={item.previewUrl}
          alt={`${item.packName} preview`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <p
          style={{
            fontFamily: 'Asap, system-ui, sans-serif',
            fontSize: "14px",
            fontWeight: 700,
            color: PALETTE.ink,
            letterSpacing: "-0.005em",
          }}
        >
          {item.productShortLabel} · {item.sizeLabel}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className="inline-block px-1.5 py-0.5 rounded-sm text-[10px] uppercase"
            style={{
              background: item.kind === "template" ? "rgba(196, 162, 101, 0.16)" : "rgba(191, 82, 74, 0.10)",
              color: item.kind === "template" ? PALETTE.goldDeep : PALETTE.rose,
              letterSpacing: "0.1em",
              fontWeight: 700,
            }}
          >
            {item.kind === "template" ? "Real photo" : "AI portrait"}
          </span>
        </div>
        <p
          className="truncate"
          style={{ fontSize: "12.5px", color: PALETTE.earth, marginTop: "4px" }}
        >
          {item.packName}
        </p>
        <p
          style={{
            fontSize: "11.5px",
            color: PALETTE.earthMuted,
            marginTop: "2px",
            letterSpacing: "0.02em",
          }}
        >
          {item.kind === "template"
            ? "Pet face composited on template"
            : (item.style === "illustrated" ? "Illustrated" : "Photographic")}
          {item.soulEdition ? " · + Soul Edition" : ""}
        </p>

        <div className="flex items-baseline justify-between mt-2">
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="transition-colors hover:underline"
            style={{
              fontSize: "12px",
              color: PALETTE.earthMuted,
              letterSpacing: "0.02em",
            }}
            aria-label={`Remove ${item.productShortLabel} ${item.sizeLabel} from cart`}
          >
            Remove
          </button>
          <span
            style={{
              fontFamily: 'Asap, system-ui, sans-serif',
              fontSize: "16px",
              fontWeight: 700,
              color: PALETTE.ink,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            £{total}
          </span>
        </div>
      </div>
    </article>
  );
}

/* ─── Empty state ─────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-8 py-16">
      <div
        aria-hidden
        style={{
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          background: PALETTE.cream2,
          border: `1px solid ${PALETTE.sand}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: PALETTE.earthMuted,
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="4" width="14" height="16" rx="1" />
          <rect x="8" y="7" width="8" height="10" />
        </svg>
      </div>
      <p
        className="mt-5"
        style={{
          ...cormorantItalic("19px"),
          color: PALETTE.earth,
          maxWidth: "260px",
          textWrap: "pretty",
        }}
      >
        Nothing in your cart yet.<br />
        Configure their portrait in the studio and add it here.
      </p>
    </div>
  );
}
