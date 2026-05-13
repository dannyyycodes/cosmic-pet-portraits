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
import { Component, type ErrorInfo, type ReactNode, useCallback, useState } from "react";
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
import { isSoulReadingItem } from "./soulReading";
import { SoulReadingUpsell } from "./SoulReadingUpsell";
import { CartGiftUpsell } from "./CartGiftUpsell";
import { CartConsents, type ConsentSnapshot } from "./CartConsents";
import { SoulReadingThumb, GiftCardThumb } from "./CartThumbnails";

/**
 * Local error boundary scoped to a SINGLE cart line. When an item render
 * throws (e.g. malformed cart entry, missing PRODUCTS lookup, etc.) we catch
 * it here so the whole page doesn't end up at the global "cosmic hiccup".
 * The actual error gets logged + shown inline so we can diagnose it.
 */
class CartLineErrorBoundary extends Component<
  { children: ReactNode; itemSummary: string },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: ReactNode; itemSummary: string }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message ?? "Unknown render error" };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[CartLineErrorBoundary] crash rendering item:", this.props.itemSummary, error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            background: "rgba(191, 82, 74, 0.06)",
            border: `1px dashed ${PALETTE.rose}`,
            borderRadius: 8,
            padding: "12px 14px",
            fontFamily: "Assistant, system-ui, sans-serif",
            fontSize: 12.5,
            color: PALETTE.earth,
          }}
        >
          <strong style={{ color: PALETTE.rose }}>Couldn't render this line:</strong>{" "}
          {this.props.itemSummary}
          <div style={{ fontFamily: "Menlo, monospace", fontSize: 11, marginTop: 6, color: PALETTE.earthMuted }}>
            {this.state.message}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  onRemove: (id: string) => void;
  /** Adds a new line (used by the in-drawer Soul Reading upsell). */
  onAddItem?: (item: CartItem) => void;
  /** Fired when the customer clicks Checkout. Receives the consent snapshot
   *  (timestamps) so the parent can pass it to /api/cart/checkout for
   *  metafield persistence. Existing callers that ignore the arg keep
   *  working — the snapshot is null when no consents apply. */
  onCheckout: (consent?: ConsentSnapshot | null) => void;
  checkoutBusy?: boolean;
  checkoutError?: string | null;
}

export function CartDrawer({
  open,
  onOpenChange,
  items,
  onRemove,
  onAddItem,
  onCheckout,
  checkoutBusy,
  checkoutError,
}: CartDrawerProps) {
  const subtotal = cartSubtotalMajor(items);
  const isEmpty = items.length === 0;

  // Consent gating — drives both the disabled state of the Checkout button
  // and the consent timestamps passed into the checkout API on submit.
  const [consentState, setConsentState] = useState<{
    allRequiredChecked: boolean;
    snapshot: ConsentSnapshot;
  }>({
    allRequiredChecked: true, // empty cart / no applicable consents → not blocked
    snapshot: { canvasPersonalisedAt: null, readingImmediateAt: null },
  });
  const handleConsentChange = useCallback(
    (state: { allRequiredChecked: boolean; snapshot: ConsentSnapshot }) => {
      setConsentState(state);
    },
    [],
  );

  const checkoutDisabled = !!checkoutBusy || !consentState.allRequiredChecked;
  const checkoutTooltip = !consentState.allRequiredChecked
    ? "Tick the consent boxes above to continue"
    : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0"
        style={{
          background: PALETTE.cream,
          borderColor: PALETTE.sand,
          // Start the drawer below the fixed PortraitsNav (62px) so both
          // the title and the absolute-positioned close button clear it.
          top: 62,
          height: "calc(100vh - 62px)",
        }}
      >
        <SheetHeader
          className="px-6 pt-6 pb-4 text-left"
          style={{
            borderBottom: `1px solid ${PALETTE.sand}`,
          }}
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
            Your pawtraits
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
              Each pawtrait ships in 3–5 days · printed locally (UK · EU · USA)
            </SheetDescription>
          )}
        </SheetHeader>

        {/* ── Items list ──────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {isEmpty ? (
            <EmptyState />
          ) : (
            <>
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
                      <CartLineErrorBoundary
                        itemSummary={`${item.productLabel ?? item.productType ?? "Cart item"} (${item.id})`}
                      >
                        {isSoulReadingItem(item) ? (
                          <SoulReadingLine item={item} onRemove={onRemove} />
                        ) : (
                          <CartLine item={item} onRemove={onRemove} />
                        )}
                      </CartLineErrorBoundary>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>

              {/* Soul Reading upsell card — sits between line items and
                  footer. Hides itself when there are no canvas items or
                  when a Soul Reading is already in cart. Wrapped in
                  CartLineErrorBoundary so a render crash here doesn't
                  cascade to the global "cosmic hiccup" page. */}
              {onAddItem && (
                <CartLineErrorBoundary itemSummary="Soul Reading upsell card">
                  <SoulReadingUpsell cart={items} onAdd={onAddItem} />
                </CartLineErrorBoundary>
              )}

              {/* Gift card upsell — "Send a portrait to a friend".
                  Recipient details ride as Shopify line-item properties;
                  Shopify auto-generates the code + emails the recipient on
                  payment. Native redemption at checkout. */}
              {onAddItem && (
                <CartLineErrorBoundary itemSummary="Gift card upsell card">
                  <CartGiftUpsell onAdd={onAddItem} />
                </CartLineErrorBoundary>
              )}
            </>
          )}
        </div>

        {/* ── Footer (consents + subtotal + CTA) ──────────────────── */}
        {!isEmpty && (
          <footer
            className="px-6 py-5"
            style={{ borderTop: `1px solid ${PALETTE.sand}`, background: PALETTE.cream2 }}
          >
            {/* CCR consent checkboxes — required before checkout enables. */}
            <CartConsents items={items} onChange={handleConsentChange} />

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
              onClick={() => onCheckout(consentState.snapshot)}
              disabled={checkoutDisabled}
              title={checkoutTooltip}
              aria-disabled={checkoutDisabled}
              className="w-full px-6 py-4 rounded-full transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed"
              style={{
                background: PALETTE.rose,
                color: PALETTE.cream,
                fontFamily: 'Assistant, system-ui, sans-serif',
                fontSize: "16px",
                fontWeight: 700,
                letterSpacing: "0.01em",
                boxShadow: checkoutDisabled
                  ? "none"
                  : "0 18px 40px rgba(191, 82, 74, 0.28)",
                opacity: checkoutDisabled ? 0.55 : 1,
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
  const [zoomOpen, setZoomOpen] = useState(false);
  const hasPreview = !!item.previewUrl && item.previewUrl.length > 0;
  const isGiftCard = item.productType === "gift-card";

  // Gift cards have no preview URL — render the 3D heart-with-ribbon thumbnail
  // in place of the empty cosmos placeholder, and a slimmer body without the
  // template/illustrated/soul-edition meta that doesn't apply.
  if (isGiftCard) {
    const props = (item as unknown as { properties?: Record<string, string> }).properties ?? {};
    const memo = props._gift_message?.trim();
    return (
      <article
        className="flex gap-4 p-3 rounded-sm"
        style={{ background: PALETTE.cream2, border: `1px solid ${PALETTE.sand}` }}
      >
        <div className="flex-shrink-0" aria-hidden>
          <GiftCardThumb width={72} height={90} />
        </div>
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
            Gift card · £{total}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="inline-block px-1.5 py-0.5 rounded-sm text-[10px] uppercase"
              style={{
                background: "rgba(196, 162, 101, 0.18)",
                color: PALETTE.goldDeep,
                letterSpacing: "0.1em",
                fontWeight: 700,
              }}
            >
              Gift
            </span>
          </div>
          <p
            className="truncate"
            style={{ fontSize: "12.5px", color: PALETTE.earth, marginTop: "4px" }}
          >
            Code emailed to you to share
          </p>
          {memo && (
            <p
              className="truncate"
              style={{
                fontSize: "11.5px",
                color: PALETTE.earthMuted,
                marginTop: "2px",
                fontStyle: "italic",
              }}
            >
              "{memo}"
            </p>
          )}
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
              aria-label="Remove gift card from cart"
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

  return (
    <article
      className="flex gap-4 p-3 rounded-sm"
      style={{ background: PALETTE.cream2, border: `1px solid ${PALETTE.sand}` }}
    >
      {/* Thumbnail = the generated preview. Click to inspect full-size — opens
          a lightbox overlay so customer can verify the portrait before paying. */}
      <button
        type="button"
        onClick={() => hasPreview && setZoomOpen(true)}
        disabled={!hasPreview}
        aria-label={hasPreview ? `View ${item.packName} portrait full size` : "No preview available"}
        className="flex-shrink-0 overflow-hidden rounded-sm relative transition-opacity hover:opacity-90 disabled:cursor-default disabled:hover:opacity-100"
        style={{
          width: "72px",
          height: "90px",
          background: PALETTE.cosmos,
          border: `1px solid ${PALETTE.sand}`,
          padding: 0,
          cursor: hasPreview ? "zoom-in" : "default",
        }}
      >
        {hasPreview ? (
          <>
            <img
              src={item.previewUrl}
              alt={`${item.packName} preview`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <span
              aria-hidden
              className="absolute bottom-1 right-1 text-[10px] px-1.5 py-0.5 rounded-sm"
              style={{
                background: "rgba(255, 253, 245, 0.92)",
                color: PALETTE.ink,
                fontFamily: "Asap, system-ui, sans-serif",
                fontWeight: 700,
                letterSpacing: "0.02em",
                lineHeight: 1.2,
              }}
            >
              View
            </span>
          </>
        ) : (
          <span
            className="w-full h-full flex items-center justify-center text-[10px]"
            style={{ color: PALETTE.cream, fontFamily: "Asap, system-ui, sans-serif", letterSpacing: "0.06em" }}
          >
            —
          </span>
        )}
      </button>

      {/* Lightbox overlay — click backdrop or button to close. */}
      {zoomOpen && hasPreview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${item.packName} portrait`}
          onClick={() => setZoomOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(20, 18, 16, 0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            cursor: "zoom-out",
          }}
        >
          <img
            src={item.previewUrl}
            alt={item.packName}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "min(900px, 92vw)",
              maxHeight: "92vh",
              width: "auto",
              height: "auto",
              objectFit: "contain",
              borderRadius: 6,
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.5)",
              cursor: "default",
            }}
          />
          <button
            type="button"
            onClick={() => setZoomOpen(false)}
            aria-label="Close portrait preview"
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              background: "rgba(255, 253, 245, 0.95)",
              color: PALETTE.ink,
              border: "none",
              borderRadius: 999,
              width: 40,
              height: 40,
              fontSize: 22,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
            }}
          >
            ×
          </button>
        </div>
      )}

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
            {item.kind === "template" ? "Real photo" : "Painted pawtrait"}
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

/* ─── Soul Reading line ───────────────────────────────────────────── */
function SoulReadingLine({ item, onRemove }: { item: CartItem; onRemove: (id: string) => void }) {
  const total = itemTotalMajor(item);
  const props = (item as unknown as { properties?: Record<string, string> }).properties ?? {};
  const petName = props._pet_name?.trim() || "Your pet";
  return (
    <article
      className="flex gap-4 p-3 rounded-sm"
      style={{
        background: "#FFFAF3",
        border: `1px dashed rgba(191, 82, 74, 0.45)`,
      }}
    >
      <div className="flex-shrink-0" aria-hidden>
        <SoulReadingThumb width={72} height={90} />
      </div>

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
          Soul Reading · Digital
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className="inline-block px-1.5 py-0.5 rounded-sm text-[10px] uppercase"
            style={{
              background: "rgba(196, 162, 101, 0.18)",
              color: PALETTE.goldDeep,
              letterSpacing: "0.1em",
              fontWeight: 700,
            }}
          >
            Add-on
          </span>
        </div>
        <p
          className="truncate"
          style={{ fontSize: "12.5px", color: PALETTE.earth, marginTop: "4px" }}
        >
          For {petName}
          {props._pet_dob ? ` · ${props._pet_dob}` : ""}
        </p>
        {props._pet_birth_location && (
          <p
            className="truncate"
            style={{
              fontSize: "11.5px",
              color: PALETTE.earthMuted,
              marginTop: "2px",
              letterSpacing: "0.02em",
            }}
          >
            {props._pet_birth_location}
          </p>
        )}

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
            aria-label="Remove Soul Reading from cart"
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
        Configure their pawtrait in the studio and add it here.
      </p>
    </div>
  );
}
