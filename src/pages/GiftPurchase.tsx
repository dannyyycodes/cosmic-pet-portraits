import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLocalizedPrice } from '@/hooks/useLocalizedPrice';
import { REVIEWS } from '@/components/funnel-v2/DossierCheckout';
/* Dark-surface payment marks. Same canonical simple-icons brand paths as
   the shared PaymentMethodsRow (the truth of what the Stripe session
   offers), rendered as quiet light marks for the night background — no
   white chips. Keep in sync with PaymentMethodsRow if methods change. */
function GiftPayMarks() {
  return (
    <div className="gp-paymarks" aria-label="Payment methods">
      <span className="gp-paychip" role="img" aria-label="Stripe"><svg viewBox="0 0 24 24" style={{ height: 20, width: 30 }}><path fill="#635BFF" d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/></svg></span>
      <span className="gp-paychip" role="img" aria-label="Apple Pay"><svg viewBox="0 0 24 24" style={{ height: 22, width: 46 }}><path fill="#ffffff" d="M2.15 4.318a42.16 42.16 0 0 0-.454.003c-.15.005-.303.013-.452.04a1.44 1.44 0 0 0-1.06.772c-.07.138-.114.278-.14.43-.028.148-.037.3-.04.45A10.2 10.2 0 0 0 0 6.222v11.557c0 .07.002.138.003.207.004.15.013.303.04.452.027.15.072.291.142.429a1.436 1.436 0 0 0 .63.63c.138.07.278.115.43.142.148.027.3.036.45.04l.208.003h20.194l.207-.003c.15-.004.303-.013.452-.04.15-.027.291-.071.428-.141a1.432 1.432 0 0 0 .631-.631c.07-.138.115-.278.141-.43.027-.148.036-.3.04-.45.002-.07.003-.138.003-.208l.001-.246V6.221c0-.07-.002-.138-.004-.207a2.995 2.995 0 0 0-.04-.452 1.446 1.446 0 0 0-1.2-1.201 3.022 3.022 0 0 0-.452-.04 10.448 10.448 0 0 0-.453-.003zm0 .512h19.942c.066 0 .131.002.197.003.115.004.25.01.375.032.109.02.2.05.287.094a.927.927 0 0 1 .407.407.997.997 0 0 1 .094.288c.022.123.028.258.031.374.002.065.003.13.003.197v11.552c0 .065 0 .13-.003.196-.003.115-.009.25-.032.375a.927.927 0 0 1-.5.693 1.002 1.002 0 0 1-.286.094 2.598 2.598 0 0 1-.373.032l-.2.003H1.906c-.066 0-.133-.002-.196-.003a2.61 2.61 0 0 1-.375-.032c-.109-.02-.2-.05-.288-.094a.918.918 0 0 1-.406-.407 1.006 1.006 0 0 1-.094-.288 2.531 2.531 0 0 1-.032-.373 9.588 9.588 0 0 1-.002-.197V6.224c0-.065 0-.131.002-.197.004-.114.01-.248.032-.375.02-.108.05-.199.094-.287a.925.925 0 0 1 .407-.406 1.03 1.03 0 0 1 .287-.094c.125-.022.26-.029.375-.032.065-.002.131-.002.196-.003zm4.71 3.7c-.3.016-.668.199-.88.456-.191.22-.36.58-.316.918.338.03.675-.169.888-.418.205-.258.345-.603.308-.955zm2.207.42v5.493h.852v-1.877h1.18c1.078 0 1.835-.739 1.835-1.812 0-1.07-.742-1.805-1.808-1.805zm.852.719h.982c.739 0 1.161.396 1.161 1.089 0 .692-.422 1.092-1.164 1.092h-.979zm-3.154.3c-.45.01-.83.28-1.05.28-.235 0-.593-.264-.981-.257a1.446 1.446 0 0 0-1.23.747c-.527.908-.139 2.255.374 2.995.249.366.549.769.944.754.373-.014.52-.242.973-.242.454 0 .586.242.98.235.41-.007.667-.366.915-.733.286-.417.403-.82.41-.841-.007-.008-.79-.308-.797-1.209-.008-.754.615-1.113.644-1.135-.352-.52-.9-.578-1.09-.593a1.123 1.123 0 0 0-.092-.002zm8.204.397c-.99 0-1.606.533-1.652 1.256h.777c.072-.358.369-.586.845-.586.502 0 .803.266.803.711v.309l-1.097.064c-.951.054-1.488.484-1.488 1.184 0 .72.548 1.207 1.332 1.207.526 0 1.032-.281 1.264-.727h.019v.659h.788v-2.76c0-.803-.62-1.317-1.591-1.317zm1.94.072l1.446 4.009c0 .003-.073.24-.073.247-.125.41-.33.571-.711.571-.069 0-.206 0-.267-.015v.666c.06.011.267.019.335.019.83 0 1.226-.312 1.568-1.283l1.5-4.214h-.868l-1.012 3.259h-.015l-1.013-3.26zm-1.167 2.189v.316c0 .521-.45.917-1.024.917-.442 0-.731-.228-.731-.579 0-.342.278-.56.769-.593z"/></svg></span>
      <span className="gp-paychip" role="img" aria-label="Google Pay"><svg viewBox="0 0 112 46" style={{ height: 20, width: 48 }}><path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/><path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/><path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"/><path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/><text x="51" y="33" fontFamily="Arial, Helvetica, sans-serif" fontSize="27" fontWeight="500" fill="#ffffff">Pay</text></svg></span>
      <span className="gp-paychip" role="img" aria-label="Visa"><svg viewBox="0 0 24 24" style={{ height: 18, width: 40 }}><path fill="#ffffff" d="M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656l1.02-2.815.588 2.815zm-8.16-4.84l-1.603 7.496H8.34l1.605-7.496z"/></svg></span>
      <span className="gp-paychip" role="img" aria-label="Mastercard"><svg viewBox="0 0 32 20" style={{ height: 20, width: 32 }}><circle cx="12" cy="10" r="7" fill="#EB001B"/><circle cx="20" cy="10" r="7" fill="#F79E1B"/><path d="M16 4.8a7 7 0 010 10.4 7 7 0 010-10.4z" fill="#FF5F00"/></svg></span>
      <span className="gp-paychip" role="img" aria-label="American Express"><svg viewBox="0 0 48 32" style={{ height: 22, width: 33 }}><rect width="48" height="32" rx="5" fill="#006FCF"/><g stroke="#fff" strokeWidth="2.4" fill="none"><path d="M5.5 22 9.5 10l4 12M6.9 17.6h5.2"/><path d="M17 22V10l4 7 4-7v12"/><path d="M34 10h-6v12h6M28 16h5"/><path d="m37.5 10 7 12m0-12-7 12"/></g></svg></span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   GIFT PAGE v10 — cosmic purple + white, matched to the live readings
   funnel (funnel-v2 design system). Fraunces display / Newsreader
   body. Violet metal CTAs. Star gold appears ONLY as review-star
   fills.

   v10 life pass (Danny, 2026-07-17): echo sentences cut page-wide
   (one sentence lands, no explainer after it); occasion picker
   reimagined as four scene cards with bespoke scene SVGs; aurora
   nebula layer + alternating tint bands + glow-lifted hover/press
   states for depth. Entrances 550-600ms ease-out, feedback under
   250ms, no bounce, reduced-motion kill intact.
   · ZERO stock icons — every mark is a bespoke inline SVG drawn for
     this page (one stroke system: 1.6 weight, round caps, celestial
     geometry, currentColor; scenes on a 120×88 grid).
   · Layered depth: aurora plane + three-plane parallax star field via
     CSS scroll-driven animation (@supports gated, reduced-motion off).
   · The emotional argument arrives beat by beat on scroll — four
     short lines rising one at a time, never a paragraph wall.
   · No em-dashes in visible copy (the localized-billing note is
     preserved byte-identical by mandate).

   v11 alternating-bands pass (Danny, 2026-07-18): warm cream light
   sections (how-it-works, reviews, FAQ) between the dark cosmic
   ones. Opaque envelope-paper grounds with crisp letterpress seams;
   aubergine ink + darkened violet accents on cream. ScenesBand
   rebuilt as full-bleed envelope photo breaks. Dark zones tinted
   along a temperature arc (early indigo, late plum) so the checkout
   reads as deep night again. No gold/amber chrome anywhere; star
   fills stay the one gold exception.

   v12 gift-funnel pass (Danny-approved 5-point plan, 2026-07-19):
   ScenesBand photo breaks deleted; replaced by a one-line emotional
   bridge (eyebrow + Fraunces italic) on the open cosmos. Occasion
   picker shrunk to a tiny tick-box chip row under the section
   header (hero rotator untouched). Tier bullets rewritten as
   love/gifting payoffs; price moved into each card's select CTA;
   worry-killer row + one verbatim decision-point review (Ben H. ·
   Loki, sanctioned set) under the tier cards.

   The interactive purchase funnel (occasion picker → tier cards →
   3-step flow → purchase-gift-certificate) is preserved
   byte-compatible; only the presentation shell changes.
   ═══════════════════════════════════════════════════════════════════ */

type DeliveryMethod = 'email' | 'link';

type GiftOccasion = 'discover' | 'new' | 'memorial' | 'birthday';

interface GiftRecipient {
  id: string;
  name: string;
  email: string;
  // Gifter can pre-specify what kind of reading this recipient gets.
  // Defaults to 'discover' so legacy behaviour is unchanged; buyer changes
  // it per recipient if they're gifting a new-pet or memorial reading.
  occasion?: GiftOccasion;
}

/* ═══ BESPOKE GLYPH SET ═════════════════════════════════════════════
   One geometry system for every mark on the page: 24-unit grid,
   1.6 stroke, round caps and joins, currentColor. Micro-stars and
   dots are the only fills. Drawn for this page — no icon library. ═══ */

type GlyphProps = { className?: string };

const glyphBase: React.SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: 'false',
};

/** Fine left arrow — nav + step backs. */
function GlyphArrow({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <path d="M19.5 12H4.8" />
      <path d="M11 5.6 4.6 12l6.4 6.4" />
    </svg>
  );
}

/** Fine right chevron — continue affordances. */
function GlyphChevron({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <path d="M9.3 5.4 15.9 12l-6.6 6.6" />
    </svg>
  );
}

function GlyphPlus({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <path d="M12 5.2v13.6M5.2 12h13.6" />
    </svg>
  );
}

function GlyphCross({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <path d="M6.6 6.6l10.8 10.8M17.4 6.6 6.6 17.4" />
    </svg>
  );
}

function GlyphCheck({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <path d="M5.4 12.8l4.1 4.3 9.1-10.2" />
    </svg>
  );
}

/** The soul star — the page's four-point celestial mark. */
function GlyphStar({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <path d="M12 3.2c.55 3.7 2.2 5.9 8.2 8.8-6 2.9-7.65 5.1-8.2 8.8-.55-3.7-2.2-5.9-8.2-8.8 6-2.9 7.65-5.1 8.2-8.8z" />
    </svg>
  );
}

/** Bespoke double-quote mark — the review spotlight watermark. Filled,
   drawn for this page (not from the stroke grid; a solid display glyph). */
function GlyphQuote({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 40 32" className={className} fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M0 32V18.4C0 8.7 5.5 1.9 15.8 0l1.9 4.4C12.1 6.5 9.4 9.6 9.1 13.8h6.5V32H0zm22.5 0V18.4C22.5 8.7 28 1.9 38.3 0L40.2 4.4C34.6 6.5 31.9 9.6 31.6 13.8h6.5V32H22.5z" />
    </svg>
  );
}

/** A small constellation of souls — the multi-gift mark. */
function GlyphSoulFew({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <path d="M9.6 8.6c.4 2.6 1.6 4.2 5.9 6.3-4.3 2.1-5.5 3.7-5.9 6.3-.4-2.6-1.6-4.2-5.9-6.3 4.3-2.1 5.5-3.7 5.9-6.3z" />
      <path d="M17.8 3.2c.22 1.5.9 2.4 3.2 3.5-2.3 1.1-2.98 2-3.2 3.5-.22-1.5-.9-2.4-3.2-3.5 2.3-1.1 2.98-2 3.2-3.5z" />
    </svg>
  );
}

/** Moon-dial clock — "ready in minutes". */
function GlyphMoonClock({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 7.4v4.9l3.2 1.9" />
    </svg>
  );
}

/** Comet with motion trails — arrives instantly, nothing to ship. */
function GlyphComet({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <path d="M15.4 5.2c.4 2.5 1.6 4.1 5.4 5.9-3.8 1.8-5 3.4-5.4 5.9-.4-2.5-1.6-4.1-5.4-5.9 3.8-1.8 5-3.4 5.4-5.9z" />
      <path d="M3.2 8.6h4.4M2.6 12.4h5.6M4.4 16.2h4" />
    </svg>
  );
}

/** Keepsake lock — private, no price shown. */
function GlyphLock({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <rect x="6.4" y="10.6" width="11.2" height="9" rx="2.2" />
      <path d="M8.8 10.6V8.2a3.2 3.2 0 0 1 6.4 0v2.4" />
      <circle cx="12" cy="15.1" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Planet in orbit with its moon — the real chart. */
function GlyphOrbit({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <circle cx="12" cy="12" r="4.1" />
      <ellipse cx="12" cy="12" rx="9.6" ry="3.6" transform="rotate(-18 12 12)" />
      <circle cx="20" cy="8.1" r="1.05" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Calendar with a soul star — valid a full year. */
function GlyphCalendar({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <rect x="3.8" y="5.6" width="16.4" height="14.2" rx="2.4" />
      <path d="M3.8 10.2h16.4M8.3 3.4v3.4M15.7 3.4v3.4" />
      <path d="M12 12.1l.75 1.85 1.85.75-1.85.75L12 17.3l-.75-1.85-1.85-.75 1.85-.75z" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Ribboned gift box. */
function GlyphGift({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <rect x="4.4" y="11.2" width="15.2" height="8.6" rx="1.8" />
      <rect x="3.6" y="7.6" width="16.8" height="3.6" rx="1.2" />
      <path d="M12 7.6v12.2" />
      <path d="M12 7.6C11 4.9 8.9 3.6 7.5 4.6c-1.5 1.1.3 3 4.5 3zM12 7.6c1-2.7 3.1-4 4.5-3 1.5 1.1-.3 3-4.5 3z" />
    </svg>
  );
}

/** Two threads joined — the magic link. */
function GlyphThread({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <path d="M10.6 13.4a3.9 3.9 0 0 1 0-5.5l2.4-2.4a3.9 3.9 0 0 1 5.5 5.5l-1.7 1.7" />
      <path d="M13.4 10.6a3.9 3.9 0 0 1 0 5.5l-2.4 2.4a3.9 3.9 0 0 1-5.5-5.5l1.7-1.7" />
    </svg>
  );
}

/** Sealed envelope — direct gift email. */
function GlyphEnvelope({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <rect x="3.4" y="5.8" width="17.2" height="12.6" rx="2.2" />
      <path d="M4.2 7l7.8 6.2L19.8 7" />
    </svg>
  );
}

/** Guardian seal — the guarantee. */
function GlyphSeal({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <path d="M12 3.1 19.2 6v5.3c0 4.7-2.9 7.8-7.2 9.6-4.3-1.8-7.2-4.9-7.2-9.6V6L12 3.1z" />
      <path d="M12 8.4l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Paw — four toes and a pad, drawn in the house stroke. */
function GlyphPaw({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <circle cx="7.1" cy="10.1" r="1.5" />
      <circle cx="10.3" cy="7.5" r="1.55" />
      <circle cx="13.7" cy="7.5" r="1.55" />
      <circle cx="16.9" cy="10.1" r="1.5" />
      <path d="M12 11.7c2.8 0 5 2.1 5 4.2 0 1.6-1.4 2.7-2.9 2.3-.9-.2-1.4-.55-2.1-.55s-1.2.35-2.1.55c-1.5.4-2.9-.7-2.9-2.3 0-2.1 2.2-4.2 5-4.2z" />
    </svg>
  );
}

/** New growth — the just-arrived soul. */
function GlyphSprout({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <path d="M12 20.4v-7.2" />
      <path d="M12 13.2c0-3.5-2.7-6.3-6.2-6.3 0 3.5 2.7 6.3 6.2 6.3z" />
      <path d="M12 13.2c0-3.5 2.7-6.3 6.2-6.3 0 3.5-2.7 6.3-6.2 6.3z" />
    </svg>
  );
}

/** A candle held lit — memorial. */
function GlyphCandle({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <path d="M12 3.4c1.5 1.9 2.3 3.2 2.3 4.4a2.3 2.3 0 1 1-4.6 0c0-1.2.8-2.5 2.3-4.4z" />
      <path d="M12 10.1v1.7" />
      <rect x="9.2" y="12.6" width="5.6" height="7.6" rx="1.1" />
    </svg>
  );
}

/** One candle on the cake — birthday. */
function GlyphCake({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <rect x="4.6" y="12.6" width="14.8" height="6.9" rx="1.5" />
      <path d="M4.6 15.9c1.2 1.15 2.35 1.15 3.55 0s2.35-1.15 3.55 0 2.35 1.15 3.55 0 2.35-1.15 3.55 0" />
      <path d="M12 9.2v3.4" />
      <path d="M12 4.3c.8 1.05 1.2 1.75 1.2 2.4a1.2 1.2 0 1 1-2.4 0c0-.65.4-1.35 1.2-2.4z" />
    </svg>
  );
}

/* ═══ OCCASION SCENES ═══════════════════════════════════════════════
   Four larger scene drawings for the occasion cards — same house
   geometry (round caps, currentColor, star fills only), drawn on a
   120×88 scene grid so each occasion gets real art, not a list row. ═══ */

const sceneBase: React.SVGProps<SVGSVGElement> = {
  viewBox: '0 0 120 88',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: 'false',
};

type GlyphComponent = (props: GlyphProps) => JSX.Element;

type GiftOccasionOption = { value: GiftOccasion; Glyph: GlyphComponent; label: string; hint: string };


// Prices come from useLocalizedPrice() at render time — this const only
// holds static copy. Price mapping: essential → prices.basic/wasBasic,
// portrait → prices.premium/wasPremium.
const TIERS = {
  essential: {
    label: 'Soul Reading',
    tagline: 'The reading they\'ll keep coming back to.',
    badge: null as string | null,
    features: [
      'Written for the one soul they love most, from their pet\'s real birth chart',
      'Their pet\'s photo, waiting inside the reveal',
      'Theirs to keep forever, on any device',
    ],
  },
  portrait: {
    label: 'Soul Bond',
    tagline: 'Them and their pet, read side by side.',
    badge: 'MOST CHOSEN' as string | null,
    popular: true,
    features: [
      'Everything in Soul Reading, plus:',
      'Their chart beside their pet\'s: why these two souls found each other',
      'The bond they feel every day, finally written down',
    ],
  },
} as const;

// ─── Occasion-specific tier overrides ─────────────────────────────────
//
// Different occasions call for different tier framing. Memorial
// intentionally has NO `essential` entry — the memorial product is one
// single offering at the Soul Bond price, matching the main funnel.
type TierContent = {
  label: string;
  tagline: string;
  badge: string | null;
  features: readonly string[];
};
type OccasionTiers = Partial<Record<TierKey, TierContent>>;

const OCCASION_TIERS: Record<GiftOccasion, OccasionTiers> = {
  new: {
    essential: {
      label: 'The Welcome Reading',
      tagline: 'For the new soul they just brought home.',
      badge: null,
      features: [
        'An introduction to the soul they just fell in love with',
        'Their pet\'s photo, woven into the reveal',
        'Theirs to keep for every year ahead',
      ],
    },
    portrait: {
      label: 'The Welcome Bond',
      tagline: 'The pairing the universe just made, written in full.',
      badge: 'MOST GIFTED',
      features: [
        'Everything in the Welcome Reading, plus:',
        'Their chart beside their new pet\'s: why they found each other now',
        'The first chapter of the bond, theirs to keep',
      ],
    },
  },
  discover: {
    essential: {
      label: 'The Discover Reading',
      tagline: 'The pet they\'ve loved for years, finally written down.',
      badge: null,
      features: [
        'The quirks they\'ve always sensed in them, finally named',
        'Their pet\'s photo, woven into the reveal',
        'Theirs to keep forever, on any device',
      ],
    },
    portrait: {
      label: 'The Discover Bond',
      tagline: 'Them and their pet, read side by side. The proof it was meant to be.',
      badge: 'MOST GIFTED',
      features: [
        'Everything in the Discover Reading, plus:',
        'Their chart beside their pet\'s: why these two found each other',
        'The love they feel every day, written down at last',
      ],
    },
  },
  memorial: {
    portrait: {
      label: 'The Memorial Reading',
      tagline: 'For the pet who\'s gone, and the person still talking to them.',
      badge: 'A TRIBUTE',
      features: [
        'Honours the pet they lost. Not the loss.',
        'Their chart beside their pet\'s: the bond that didn\'t end',
        'Theirs to keep, for the hard days and the good ones',
      ],
    },
  },
  birthday: {
    essential: {
      label: 'The Birthday Reading',
      tagline: 'For the pet whose birthday matters more than their own.',
      badge: null,
      features: [
        'Made for the pet whose birthday they never miss',
        'Their pet\'s photo, woven into the reveal',
        'Theirs to keep long after the candles',
      ],
    },
    portrait: {
      label: 'The Birthday Bond',
      tagline: 'Birthday gift + soulmate proof. Them and their pet, side by side.',
      badge: 'MOST GIFTED',
      features: [
        'Everything in the Birthday Reading, plus:',
        'Their chart beside their pet\'s: why these two celebrate together',
        'The bond behind every birthday, written down',
      ],
    },
  },
};

// The four occasions, in gifting order. Rendered per gift — one chip row
// for a single gift, one labelled row per gift for group orders.
const OCCASION_CHIPS: Array<{ value: GiftOccasion; label: string }> = [
  { value: 'new',      label: 'New pet' },
  { value: 'discover', label: 'Had them for years' },
  { value: 'memorial', label: 'Their pet has passed' },
  { value: 'birthday', label: "Pet's birthday" },
];

// Subtle visual accent per occasion — a soft coloured ring that frames
// the tier cards per occasion. Memorial resolves to moon silver (the
// page palette is violet + white only; no gold chrome anywhere).
const OCCASION_ACCENT: Record<GiftOccasion, { ring: string; badge: string }> = {
  new:      { ring: 'rgba(154,126,230,0.30)', badge: '#9a7ee6' }, // violet soft (fresh beginning)
  discover: { ring: 'rgba(154,126,230,0.32)', badge: '#9a7ee6' }, // violet (mystery/reveal)
  memorial: { ring: 'rgba(200,196,216,0.30)', badge: '#b8b2cc' }, // moon silver (honouring)
  birthday: { ring: 'rgba(185,165,240,0.32)', badge: '#b9a5f0' }, // violet bright (celebration)
};

type TierKey = keyof typeof TIERS;

const getVolumeDiscount = (count: number): number => {
  if (count >= 5) return 0.30;
  if (count >= 4) return 0.25;
  if (count >= 3) return 0.20;
  if (count >= 2) return 0.15;
  return 0;
};

/* ── The wall of love. Sanctioned set ONLY — every quote is verbatim
   from the approved reviews (REVIEWS in DossierCheckout + the landing
   ReviewsWall). Curated for the gift audience: gifter voices first, then
   the strongest recognition and accuracy proofs, honest four-star voices
   kept in so the wall reads real. The gift spotlight (Mo) is rendered
   separately above, so it never repeats here. Never write new ones,
   never invent a name, star count, or number. ── */
type GifterReview = { img: string; alt: string; stars: number; quote: string; attr: string };
const GIFTER_CARDS: GifterReview[] = [
  {
    img: '/reviews/review-16.webp', alt: 'Loki', stars: 5,
    quote: "Sam was openly dismissive when I ordered Loki's reading, mainly because astrology is not their thing. Then the reading described a fixed, territorial streak around shared spaces, and Loki had spent that same week blocking our other cat from the Manchester flat's hallway rug. Sam went quiet, read that paragraph twice, and has mentioned Loki's Mars placement more than I have.",
    attr: 'Ben H. · Loki, Maine Coon cat',
  },
  {
    img: '/reviews/review-7.webp', alt: 'Marmite', stars: 5,
    quote: "I ordered Marmite's reading for the anniversary of the day we brought him back to Leeds in a borrowed blanket. It picked up his restless little Mars rhythm by the front door at about 6pm, which is exactly the hour he still starts pacing every October as if the car is coming again. Too specific to brush off, really.",
    attr: 'Freya H. · Marmite, cockapoo',
  },
  {
    img: '/reviews/review-11.webp', alt: 'Fig and Norm', stars: 5,
    quote: "We ordered Fig and Norm's readings together, assuming two dogs in the same Glasgow house would come out much the same. Fig's was all bright Mars, cupboard doors and sudden decisions, while Norm's had this older Beagle patience and a Moon that sounded exactly like him refusing the rain at the back step. Same sofa, same walks, totally different souls.",
    attr: 'Isla M. · Fig and Norm, sprocker spaniel and beagle',
  },
  {
    img: '/reviews/review-1.webp', alt: 'Nell', stars: 5,
    quote: "I thought it was money-for-grief nonsense, if I am honest. Then it mentioned Nell guarding the stairs whenever Saturn feelings show up, and that is exactly where she plants herself when anyone raises a voice, one white sock hanging over the top step. I read that bit twice before I showed my husband.",
    attr: 'Hannah P. · Nell, whippet-lurcher',
  },
  {
    img: '/reviews/review-8.webp', alt: 'Otis', stars: 5,
    quote: "otis spent his first three months under our bed in Cardiff, only coming out after midnight for biscuits. The reading described a guarded Moon placement and a creature who watches the room from a border before choosing anyone. I had not written anything about him being formerly feral, so that line stayed with me.",
    attr: 'Grace O. · Otis, rescue shorthair cat',
  },
  {
    img: '/reviews/review-3.webp', alt: 'Alfie', stars: 5,
    quote: "alfie has a habit of dropping one toy on your foot and then pretending he has nothing to do with it. The reading called out his Venus charm and the little performance before asking to play, which made me laugh in the queue at Tesco. Sent it straight to the family chat.",
    attr: 'Tom W. · Alfie, cocker spaniel',
  },
  {
    img: '/reviews/review-6.webp', alt: 'Tilly', stars: 5,
    quote: "We came back for Tilly six months after doing our first reading for Pip. Pip's is framed in the hallway and I still notice new lines in it when I am putting my shoes on, especially the bit about his Moon softening with age. Tilly's felt different in exactly the way she is different: steadier, slower, still checking every room for us...",
    attr: 'Sarah K. · Tilly, chocolate Labrador',
  },
  {
    img: '/reviews/review-12.webp', alt: 'Bracken', stars: 5,
    quote: "I was not sure a reading would make sense for a horse, especially Bracken, who has opinions about everything at the Devon yard. Then it mentioned a stubborn Saturn edge around thresholds and moving boxes, which is exactly his trailer-loading face on a wet Tuesday. The yard owner laughed because only the people here would know that.",
    attr: 'Emily F. · Bracken, cob-type horse',
  },
  {
    img: '/reviews/review-13.webp', alt: 'Willow', stars: 5,
    quote: "weeks after Willow died, I ordered her reading during a rough patch when the house in Nottingham felt very quiet. It gave me a way to talk with my kids about her little routines, the radiator spot, the paw on the newspaper, the way she chose one person at a time. Nothing overblown. Just enough shape around the missing.",
    attr: 'Daniel K. · Willow, senior cat',
  },
  {
    img: '/reviews/review-9.webp', alt: 'Meg', stars: 4,
    quote: "Meg is fourteen now, grey round the muzzle and slower on the lane behind our house near Sheffield. Her reading did not try to make her sound young again, it spoke about Saturn steadiness and the comfort of doing the same small jobs well. I was glad of that. Only niggle is that it took closer to a day to arrive, rather than the couple of hours I had expected.",
    attr: 'Alan R. · Meg, border collie, fourteen',
  },
  {
    img: '/reviews/review-14.webp', alt: 'Nugget', stars: 4,
    quote: "I did roll my eyes at spending money on a guinea pig of all things, but Nugget's reading had his number. The bit about comfort-seeking Venus and always choosing the covered end of the run was bang on, right down to him ignoring the parsley until he has dragged it under the little red shelter. For less than we paid last month for bedding and hay, it was fair value. I would have liked a cheaper way to add our second guinea pig afterwards.",
    attr: 'Colin B. · Nugget, guinea pig',
  },
];

/* ── The one voice at the decision point, beside the tier cards.
   Verbatim from the sanctioned set (Ben H. also appears on the wall
   below). Chosen because it answers the gifter's exact fear: the
   dismissive person in the house was won over. NOT the Mo spotlight,
   which opens the reviews section. Never edit the words. ── */

/* ── Review stars — the ONE gold exception: star fills only. ── */
const STAR_PATH = 'M12 2l2.9 6.26 6.9.6-5.2 4.5 1.55 6.74L12 16.9 5.85 20.1l1.55-6.74-5.2-4.5 6.9-.6L12 2z';

function StarDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
      <defs>
        <linearGradient id="gp-star-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8cf8f" />
          <stop offset="55%" stopColor="#c4a265" />
          <stop offset="100%" stopColor="#9a7b4f" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function StarsRow({ n = 5, size = 15 }: { n?: number; size?: number }) {
  return (
    <span className="gp-stars" aria-label={`${n} out of 5 stars`} role="img">
      {[...Array(5)].map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" width={size} height={size} aria-hidden="true"
          style={{ filter: i < n ? 'drop-shadow(0 0 5px rgba(196,162,101,0.28))' : 'none' }}>
          <path d={STAR_PATH} fill={i < n ? 'url(#gp-star-g)' : 'rgba(196,190,220,0.22)'} />
        </svg>
      ))}
    </span>
  );
}

/* ── Fixed cosmos backdrop — three planes of violet star field.
   The far and near planes drift at different rates as the page
   scrolls (CSS scroll-driven animation, @supports gated), so the sky
   has depth without ever touching the text plane. ── */
function CosmicSky() {
  return (
    <div className="gp-sky" aria-hidden="true">
      <div className="gp-sky-base" />
      <div className="gp-sky-aurora" />
      <div className="gp-sky-far" />
      <div className="gp-sky-near" />
    </div>
  );
}

function GiftNav() {
  return (
    <div className="gp-wrap gp-nav">
      <Link to="/" className="gp-back">
        <GlyphArrow /> Back
      </Link>
      <Link to="/" className="gp-wordmark">Little Souls</Link>
      <span className="gp-nav-spacer" aria-hidden="true" />
    </div>
  );
}

/* ── HERO — outcome first. CTA + price + the three gift-fear killers.
   The photo sits inside a depth stack: violet halo, a fine orbit
   ornament drifting slower than the scroll, then the image plane. ── */
function Hero({ fmt, prices, onCta, heroRef }: {
  fmt: (c: number) => string;
  prices: { basic: number };
  onCta: () => void;
  heroRef: React.RefObject<HTMLElement>;
}) {
  return (
    <header className="gp-wrap gp-hero" ref={heroRef as React.RefObject<HTMLElement>}>
      <div className="gp-hero-copy">
        <h1 className="gp-h1 gp-rev">
          We all know how good it feels to get someone <em>a gift they love</em>.
        </h1>
        <p className="gp-turn gp-rev" style={{ ['--d' as string]: '120ms' }}>
          This is one of those.
        </p>
        <p className="gp-lead gp-rev" style={{ ['--d' as string]: '200ms' }}>
          A reading of the soul they love most, built from their pet's <strong>real birth chart</strong>.
        </p>
        <div className="gp-cta-row gp-rev" style={{ ['--d' as string]: '240ms' }}>
          <button type="button" className="gp-cta" onClick={onCta}>Create their gift</button>
          <p className="gp-price-note">from <span>{fmt(prices.basic)}</span></p>
        </div>
      </div>
      <div className="gp-hero-visual gp-rev" style={{ ['--d' as string]: '200ms' }}>
        <svg className="gp-hero-orbit" viewBox="0 0 400 400" aria-hidden="true" focusable="false">
          <ellipse cx="200" cy="200" rx="194" ry="70" transform="rotate(-16 200 200)"
            fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="356" cy="132" r="5" fill="#cfc0f4" stroke="none" />
          <path d="M52 300l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6 1.6-4z" fill="rgba(207,192,244,0.7)" stroke="none" />
          <path d="M340 322l1.3 3.2 3.2 1.3-3.2 1.3-1.3 3.2-1.3-3.2-3.2-1.3 3.2-1.3 1.3-3.2z" fill="rgba(185,165,240,0.55)" stroke="none" />
        </svg>
        <HeroRotator />
      </div>
    </header>
  );
}

/* ── HERO ROTATOR — every gifting scene, slow crossfade. Envelope
   scenes (the real object: a sealed reveal) lead; box scenes follow.
   Reduced-motion or missing IntersectionObserver just shows frame 1. ── */
const HERO_FRAMES = [
  { src: '/gift-scene-partner-env.webp', alt: 'A woman breaking the violet wax seal of a Little Souls envelope beside her partner, their tabby cat curled against her' },
  { src: '/gift-scene-family-env.webp', alt: 'A daughter kissing her laughing mum at the kitchen table, a wax-sealed Little Souls envelope beside her mug, their golden retriever resting at her side' },
  { src: '/gift-scene-friend-env.webp', alt: 'Two friends on a doorstep at dusk, one holding a wax-sealed Little Souls envelope, their border collie looking up' },
  { src: '/gift-hero-v2.webp', alt: 'Two men on a porch opening a violet Little Souls gift box, their little terrier between them' },
  { src: '/gift-scene-family.webp', alt: 'A father and his daughter opening a Little Souls gift box together, their shaggy dog across their laps' },
  { src: '/gift-scene-friend.webp', alt: 'Two friends opening a violet Little Souls gift box together, their fluffy cat beside them' },
];

function HeroRotator() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setInterval(() => setFrame((f) => (f + 1) % HERO_FRAMES.length), 6000);
    return () => window.clearInterval(t);
  }, []);
  return (
    <div className="gp-hero-photo">
      {HERO_FRAMES.map((f, i) => (
        <img
          key={f.src}
          src={f.src}
          alt={i === frame ? f.alt : ''}
          aria-hidden={i !== frame}
          className={`gp-hero-frame ${i === frame ? 'is-front' : ''}`}
          width={1536}
          height={1024}
          loading={i === 0 ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={i === 0 ? 'high' : undefined}
        />
      ))}
      <span className="gp-hero-scrim" aria-hidden="true" />
    </div>
  );
}

const CHARITIES = [
  { src: '/badges/ifaw.png', alt: 'IFAW, the International Fund for Animal Welfare', does: 'Rescues animals in crisis worldwide', h: 24, mono: true },
  { src: '/badges/wlt-white.svg', alt: 'World Land Trust', does: 'Buys and protects threatened habitat', h: 46, mono: false },
  { src: '/badges/eden-white.svg', alt: 'Eden, People and Planet', does: 'Plants forests, employs local people', h: 40, mono: false },
];

function TrustStrip() {
  return (
    <section className="gp-wrap gp-trust">
      <p className="gp-give-lead gp-rev">Every reading gives back</p>
      <ul className="gp-give-grid gp-rev" style={{ ['--d' as string]: '90ms' }}>
        {CHARITIES.map((c, i) => (
          <li key={c.src} style={{ ['--d' as string]: `${120 + i * 80}ms` }}>
            <span className={`gp-give-logo ${c.mono ? 'is-mono' : ''}`}><img src={c.src} alt={c.alt} style={{ height: c.h }} loading="lazy" decoding="async" /></span>
            <span className="gp-give-does">{c.does}</span>
          </li>
        ))}
      </ul>
      <a
        className="gp-tp-strip gp-rev"
        style={{ ['--d' as string]: '360ms' }}
        href="https://uk.trustpilot.com/review/littlesouls.app"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Review Little Souls on Trustpilot"
      >
        <span className="gp-tp-lead">Review us on</span>
        <img src="/badges/trustpilot-white.svg" alt="Trustpilot" height={20} loading="lazy" decoding="async" />
      </a>
    </section>
  );
}

/* ── HOW IT WORKS — gift mechanics on the page, not at checkout.
   Each step wears a bespoke icon plaque (no icon libraries). The
   delivery step frames the two real, backend-verified ways to give
   it: emailed with your message, or a private link you present. ── */
function HowItWorks() {
  const steps = [
    { Icon: GlyphStar, n: '01', t: 'Choose their reading', s: 'Pick the occasion and the depth, then write the message they will read the moment it opens.' },
    { Icon: GlyphEnvelope, n: '02', t: 'Give it two ways', s: 'Have us email it to them with your message, at the exact moment you choose. Or take the private link yourself: text it, tuck it in a card, wrap it, or hand it over.' },
    { Icon: GlyphGift, n: '03', t: 'They open the reveal', s: 'They add their pet’s name and birth date. The sky computes, and their reading unfolds like nothing they have opened before.' },
  ];
  return (
    <section className="gp-wrap gp-band gp-cream">
      <div className="gp-shead gp-rev">
        <h2 className="gp-h2">How it works.</h2>
        <p className="gp-support">You need <strong>no pet details</strong>.</p>
      </div>
      <div className="gp-steps">
        {steps.map((st, i) => (
          <div className="gp-step gp-panel gp-rev" key={st.n} style={{ ['--d' as string]: `${i * 90}ms` }}>
            <span className="gp-step-icon" aria-hidden="true"><st.Icon /></span>
            <p className="gp-step-n">Step {st.n}</p>
            <h3>{st.t}</h3>
            <p className="gp-step-s">{st.s}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── PROOF — gifter-voice reviews, verbatim from the sanctioned set. ── */
function GifterProof() {
  const spot = REVIEWS.gift;
  return (
    <section className="gp-wrap gp-band gp-cream gp-cream-deep gp-proof">
      <div className="gp-shead gp-rev">
        <p className="gp-kicker">In their own words</p>
        <h2 className="gp-h2">After they gave it.</h2>
      </div>

      {/* Rating banner — authority up front, no fabricated number. */}
      <div className="gp-rate gp-rev" style={{ ['--d' as string]: '40ms' }}>
        <StarsRow n={5} size={26} />
        <p className="gp-rate-line">Real readings. Real people. Every word below is from someone who loves their pet.</p>
      </div>

      {/* Featured spotlight — the gift review they read first. */}
      <figure className="gp-spotlight gp-rev" style={{ ['--d' as string]: '80ms' }}>
        <span className="gp-spot-quote" aria-hidden="true"><GlyphQuote /></span>
        <StarsRow n={spot.stars} size={20} />
        <blockquote>{spot.quote}</blockquote>
        <figcaption>
          <img src={spot.img} alt={spot.alt} width={52} height={52} loading="lazy" decoding="async" />
          <span>{spot.attr}</span>
        </figcaption>
      </figure>

      {/* The wall — every voice, masonry-packed. */}
      <div className="gp-wall">
        {GIFTER_CARDS.map((r, i) => (
          <figure className="gp-wall-card gp-rev" key={r.attr} style={{ ['--d' as string]: `${Math.min(i, 6) * 70}ms` }}>
            <StarsRow n={r.stars} size={15} />
            <blockquote>{r.quote}</blockquote>
            <figcaption>
              <img src={r.img} alt={r.alt} width={44} height={44} loading="lazy" decoding="async" />
              <span>{r.attr}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      <ul className="gp-proof-trust gp-rev" style={{ ['--d' as string]: '120ms' }}>
        <li><GlyphLock /> Secure checkout with Stripe</li>
        <li><GlyphSeal /> If the reading does not feel like them, we refund every cent</li>
        <li><GlyphOrbit /> Built on their pet's real chart</li>
      </ul>
    </section>
  );
}

/* ── BRIDGE — one quiet line on the open cosmos, right before the
   choice. The gift framed on the love axis: they already have the
   feeling, this gives it words. Eyebrow + one Fraunces italic line,
   scroll-revealed. Nothing else. ── */
/* ── SUBSTANCE — the honest proof language: real astronomy. ── */
function RigorBand() {
  const items = [
    { v: 'VSOP87', l: 'Ephemeris model' },
    { v: '13', l: 'Celestial bodies' },
    { v: 'J2000', l: 'Reference epoch' },
    { v: '< 0.01°', l: 'Geometric precision' },
  ];
  return (
    <section className="gp-wrap gp-band gp-rigor gp-night-late">
      <div className="gp-shead gp-rev">
        <h2 className="gp-h2">Real astronomy underneath.</h2>
      </div>
      <div className="gp-rigor-stage">
        <svg className="gp-rigor-orbit" viewBox="0 0 760 240" aria-hidden="true" focusable="false">
          <ellipse cx="380" cy="120" rx="356" ry="82" transform="rotate(-6 380 120)"
            fill="none" stroke="currentColor" strokeWidth="1" />
          <ellipse cx="380" cy="120" rx="292" ry="56" transform="rotate(-6 380 120)"
            fill="none" stroke="currentColor" strokeWidth="0.75" opacity="0.55" />
          <circle cx="700" cy="66" r="4.5" fill="#cfc0f4" stroke="none" />
          <circle cx="92" cy="176" r="2.5" fill="rgba(185,165,240,0.8)" stroke="none" />
          <path d="M148 44l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6 1.6-4z" fill="rgba(207,192,244,0.7)" stroke="none" />
          <path d="M628 196l1.3 3.2 3.2 1.3-3.2 1.3-1.3 3.2-1.3-3.2-3.2-1.3 3.2-1.3 1.3-3.2z" fill="rgba(185,165,240,0.55)" stroke="none" />
        </svg>
        <div className="gp-rigor-row">
          {items.map((it, i) => (
            <div className="gp-rigor-item gp-rev" style={{ ['--d' as string]: `${80 + i * 90}ms` }} key={it.v}>
              <p className="gp-rigor-v">{it.v}</p>
              <p className="gp-rigor-l">{it.l}</p>
            </div>
          ))}
        </div>
      </div>
      <p className="gp-rigor-line gp-rev" style={{ ['--d' as string]: '440ms' }}>
        Every placement is computed from their own chart.
      </p>
      <ul className="gp-rigor-sources gp-rev" style={{ ['--d' as string]: '520ms' }}>
        <li>
          <span className="gp-src-name">VSOP87 planetary theory</span>
          <span className="gp-src-org">Bretagnon &amp; Francou, Bureau des Longitudes, Paris</span>
        </li>
        <li>
          <span className="gp-src-name">J2000.0 reference epoch</span>
          <span className="gp-src-org">International Astronomical Union standard</span>
        </li>
        <li>
          <span className="gp-src-name">True geocentric sky</span>
          <span className="gp-src-org">The same math professional planetarium software runs</span>
        </li>
      </ul>
    </section>
  );
}

/* ── FAQ — the real gift objections, answered from the real flow. ── */
function FaqSection() {
  const faq = [
    { q: 'Do I need their pet’s details?', a: 'No. They add their pet’s name, birth date and photo when they open it.' },
    { q: 'How does it reach them?', a: 'The moment you pay, you get a private gift link. Text it, tuck it in a card, or have us email it to them.' },
    { q: 'What if the birth date is unknown?', a: 'Their chart can be cast from the day their pet arrived home. A real astrological convention, worked to the same precision.' },
    { q: 'What if they have more than one pet?', a: 'Add a reading for each. Two save 15%, three save 20%, four save 25%, five or more save 30%.' },
    { q: 'When does it expire?', a: 'A full year from the day you buy it.' },
    { q: 'What if it misses?', a: 'If the reading does not feel like them, we refund every cent.' },
  ];
  return (
    <section className="gp-wrap gp-band gp-faq gp-cream">
      <div className="gp-shead gp-rev">
        <h2 className="gp-h2">Before you ask.</h2>
      </div>
      <dl className="gp-faq-list gp-rev" style={{ ['--d' as string]: '100ms' }}>
        {faq.map((f) => (
          <div className="gp-faq-item" key={f.q}>
            <dt>{f.q}</dt>
            <dd>{f.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ClosingCta({ fmt, prices, onCta }: { fmt: (c: number) => string; prices: { basic: number }; onCta: () => void }) {
  return (
    <section className="gp-wrap gp-band gp-closing gp-night-late">
      <h2 className="gp-h2 gp-rev">Give the reading written in their stars.</h2>
      <div className="gp-cta-row gp-closing-row gp-rev" style={{ ['--d' as string]: '100ms' }}>
        <button type="button" className="gp-cta" onClick={onCta}>Create their gift</button>
        <p className="gp-price-note">from <span>{fmt(prices.basic)}</span></p>
      </div>
      <p className="gp-guarantee gp-rev" style={{ ['--d' as string]: '160ms' }}>
        If the reading does not feel like them, we refund every cent.
      </p>
    </section>
  );
}

function GiftFooter() {
  return (
    <footer className="gp-wrap gp-foot">
      <span>Little Souls</span>
      <span className="gp-foot-hair" aria-hidden="true" />
      <span>read from the day their soul arrived</span>
    </footer>
  );
}

/* ── TIER CARD — violet glass, occasion accent ring, clean price. ── */
function TierCard({
  tierKey, selected, onClick, fmt, cents, wasCents, override, accent: occAccent,
}: {
  tierKey: TierKey; selected: boolean; onClick: () => void;
  fmt: (cents: number) => string;
  cents: number;
  wasCents?: number;
  override?: TierContent;
  accent?: { ring: string; badge: string };
}) {
  const base = TIERS[tierKey];
  const tier = override ?? base;

  // Presentation only: split the localized price string so the currency
  // mark sets smaller than the figure. The rendered characters are
  // byte-identical to fmt(cents); handles symbol-before and symbol-after
  // locales.
  const renderPrice = (str: string) => {
    const m = str.match(/^([^\d]*)([\d.,\s ]*\d)([^\d]*)$/);
    if (!m) return str;
    return (
      <>
        {m[1] && <span className="gp-tier-cur">{m[1]}</span>}
        {m[2]}
        {m[3] && <span className="gp-tier-cur">{m[3]}</span>}
      </>
    );
  };

  return (
    <motion.button
      onClick={onClick}
      className={`gp-tier ${tierKey === 'portrait' ? 'is-feat' : ''} ${selected ? 'is-selected' : ''}`}
      style={{ ['--acc-ring' as string]: occAccent?.ring ?? 'rgba(154,126,230,0.30)' }}
    >
      {tier.badge && (
        <span className="gp-tier-badge" style={{ background: occAccent?.badge ?? '#9a7ee6' }}>
          {tier.badge}
        </span>
      )}

      {/* selected indicator, top right. Purely visual; aria state lives
          on the card via is-selected */}
      <span className={`gp-tier-picked ${selected ? 'is-on' : ''}`} aria-hidden="true"><GlyphCheck /></span>

      <div className="gp-tier-names">
        <p className="gp-tier-label">{tier.label}</p>
        <p className="gp-tier-tag">{tier.tagline}</p>
      </div>

      {/* price row: quiet anchor, confident figure, one-time suffix */}
      <div className="gp-tier-price-row">
        {typeof wasCents === 'number' && wasCents > cents && (
          <span className="gp-tier-was">{fmt(wasCents)}</span>
        )}
        <span className="gp-tier-price">{renderPrice(fmt(cents))}</span>
        <span className="gp-tier-once">one-time</span>
      </div>

      {/* Select CTA — the price lives at the point of action. The whole
          card is the button; this is its visual affordance. Sits above
          the checklist so price and action read as one unit. */}
      <span className={`gp-tier-cta ${selected ? 'is-picked' : ''}`}>
        {selected
          ? <><GlyphCheck /> Selected. Continue below</>
          : <>Give the {tier.label.replace(/^The /, '')} &middot; {fmt(cents)}</>}
      </span>

      <span className="gp-tier-hair" aria-hidden="true" />

      <div className="gp-tier-features">
        {tier.features.map((f, idx) => {
          const isDivider = f.endsWith(':');
          return (
            <p key={idx} className={isDivider ? 'gp-tier-div' : 'gp-tier-feat'}>
              {!isDivider && <GlyphCheck />}
              <span>{f}</span>
            </p>
          );
        })}
      </div>
    </motion.button>
  );
}

export default function GiftPurchase() {
  const [searchParams] = useSearchParams();
  const { fmt, code: currencyCode, currency, isLocalized, prices } = useLocalizedPrice();
  // Map tier key → current-currency cents (mirrors the backend pricing table)
  const TIER_CENTS: Record<TierKey, { cents: number; wasCents: number }> = {
    essential: { cents: prices.basic, wasCents: prices.wasBasic },
    portrait:  { cents: prices.premium, wasCents: prices.wasPremium },
  };
  const [selectedTier, setSelectedTier] = useState<TierKey | null>(null);
  // Single-gift occasion — written together with singleRecipient.occasion
  // by the single-mode occasion chips. The copy the section actually
  // renders comes from derivedOccasion below, which unifies single and
  // group orders.
  const [selectedOccasion, setSelectedOccasion] = useState<GiftOccasion | null>('discover');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('link');
  // Owned by the "How many are you gifting?" selector. Defaults to a
  // single gift so the occasion row, tier cards and prices are all
  // visible in the natural scroll — the funnel never opens dead.
  const [giftType, setGiftType] = useState<'single' | 'multiple'>('single');
  const [purchaserEmail, setPurchaserEmail] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ id: string; code: string; discount_value: number } | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [singleRecipient, setSingleRecipient] = useState<GiftRecipient>({ id: crypto.randomUUID(), name: '', email: '', occasion: 'discover' });
  const [recipients, setRecipients] = useState<GiftRecipient[]>([{ id: crypto.randomUUID(), name: '', email: '', occasion: 'discover' }]);

  // Sticky CTA visibility: shown once the hero has scrolled away and the
  // purchase funnel is not on screen.
  const heroRef = useRef<HTMLElement>(null);
  const funnelRef = useRef<HTMLElement>(null);
  const [heroInView, setHeroInView] = useState(true);
  const [funnelInView, setFunnelInView] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const hero = heroRef.current;
    const funnel = funnelRef.current;
    if (!hero || !funnel) return;
    const ioHero = new IntersectionObserver(([e]) => setHeroInView(e.isIntersecting), { threshold: 0.05 });
    const ioFunnel = new IntersectionObserver(([e]) => setFunnelInView(e.isIntersecting), { rootMargin: '0px 0px -10% 0px' });
    ioHero.observe(hero);
    ioFunnel.observe(funnel);
    return () => { ioHero.disconnect(); ioFunnel.disconnect(); };
  }, []);

  // Scroll-reveal for the marketing shell. Reduced motion handled in CSS.
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.gp-rev'));
    if (typeof IntersectionObserver === 'undefined') {
      els.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Count selector — the funnel's first question. 1 keeps the single-gift
  // path; 2..5 switch to the group path and size the recipients array,
  // preserving anything already typed. Group orders stay link-delivery
  // only (one gift email cannot reach five people). "5+" means at least
  // five — more rows can be added in the details step, hard cap 10.
  const handleCountSelect = useCallback((n: number) => {
    if (n === 1) {
      setGiftType('single');
      return;
    }
    setGiftType('multiple');
    setDeliveryMethod('link');
    setRecipients(rs => {
      if (n === 5 && rs.length >= 5) return rs;
      if (rs.length === n) return rs;
      if (rs.length > n) return rs.slice(0, n);
      return [
        ...rs,
        ...Array.from({ length: n - rs.length }, () => ({
          id: crypto.randomUUID(), name: '', email: '', occasion: 'discover' as GiftOccasion,
        })),
      ];
    });
  }, []);

  // Single-gift occasion chips write both the page-level state and the
  // recipient row that actually ships in the payload.
  const handleSingleOccasion = useCallback((occ: GiftOccasion) => {
    setSelectedOccasion(occ);
    setSingleRecipient(r => ({ ...r, occasion: occ }));
  }, []);

  // Auto-apply promo from URL
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode && !appliedCoupon) {
      setPromoCode(urlCode.toUpperCase());
      (async () => {
        try {
          const { data } = await supabase.from('coupons').select('id,code,discount_type,discount_value,expires_at,max_uses,current_uses').eq('code', urlCode.toUpperCase()).eq('is_active', true).single();
          if (data && (!data.expires_at || new Date(data.expires_at) >= new Date()) && (!data.max_uses || data.current_uses < data.max_uses)) {
            setAppliedCoupon({ id: data.id, code: data.code, discount_value: data.discount_value });
            setPromoCode('');
          }
        } catch { /* ignore */ }
      })();
    }
  }, [searchParams]);

  const handleTierSelect = (tier: TierKey) => {
    setSelectedTier(tier);
    setStep(2);
    // Small delay then scroll to flow section
    setTimeout(() => {
      document.getElementById('gift-flow')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Hero / closing CTAs drop the visitor onto the first real choice:
  // the count selector (which leads into occasion + tier cards).
  const scrollToPicker = useCallback(() => {
    const el = document.getElementById('gift-count');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const activeRecipients = giftType === 'single' ? [singleRecipient] : recipients;
  const giftCount = activeRecipients.length;
  const discount = getVolumeDiscount(giftCount);

  // The occasion the section displays. One gift: that gift's occasion.
  // Several gifts sharing one occasion: that occasion (drives the
  // occasion copy overrides and the memorial portrait-only gating).
  // Mixed occasions: neutral 'discover' framing with both tiers visible.
  const derivedOccasion: GiftOccasion = useMemo(() => {
    if (giftType === 'single') return singleRecipient.occasion ?? 'discover';
    const first = recipients[0]?.occasion ?? 'discover';
    return recipients.every(r => (r.occasion ?? 'discover') === first) ? first : 'discover';
  }, [giftType, singleRecipient, recipients]);

  // Memorial has no essential tier — drop an impossible tier selection
  // whenever the derived occasion lands on memorial.
  useEffect(() => {
    if (derivedOccasion === 'memorial') {
      setSelectedTier(prev => (prev !== null && prev !== 'portrait') ? null : prev);
    }
  }, [derivedOccasion]);

  const pricing = useMemo(() => {
    if (!selectedTier) return { baseTotal: 0, discountAmount: 0, promoAmount: 0, finalTotal: 0 };
    const tierCents = TIER_CENTS[selectedTier].cents;
    const baseTotal = activeRecipients.reduce((sum) => sum + tierCents, 0);
    const discountAmount = Math.round(baseTotal * discount);
    const afterVolume = baseTotal - discountAmount;
    const promoAmount = appliedCoupon ? Math.round(afterVolume * (appliedCoupon.discount_value / 100)) : 0;
    return { baseTotal, discountAmount, promoAmount, finalTotal: afterVolume - promoAmount };
  }, [selectedTier, activeRecipients, discount, appliedCoupon]);

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    setIsValidatingPromo(true);
    setPromoError('');
    try {
      const { data } = await supabase.from('coupons').select('id,code,discount_type,discount_value,expires_at,max_uses,current_uses').eq('code', promoCode.trim().toUpperCase()).eq('is_active', true).single();
      if (!data) { setPromoError('Invalid promo code'); return; }
      if (data.expires_at && new Date(data.expires_at) < new Date()) { setPromoError('This code has expired'); return; }
      if (data.max_uses && data.current_uses >= data.max_uses) { setPromoError('This code has reached its limit'); return; }
      setAppliedCoupon({ id: data.id, code: data.code, discount_value: data.discount_value });
      setPromoCode('');
    } catch { setPromoError('Something went wrong'); }
    finally { setIsValidatingPromo(false); }
  };

  const updateSingleRecipient = (field: keyof GiftRecipient, value: string) => {
    setSingleRecipient(r => ({ ...r, [field]: value }));
  };
  const updateRecipient = (id: string, field: keyof GiftRecipient, value: string) => {
    setRecipients(rs => rs.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const canProceedStep2 = () => {
    if (deliveryMethod === 'link') return true;
    if (giftType === 'single') return singleRecipient.email.includes('@');
    return recipients.every(r => r.email.includes('@'));
  };

  const handlePurchase = async () => {
    if (!purchaserEmail.includes('@')) { toast.error('Please enter your email address'); return; }
    if (!selectedTier) return;
    setIsLoading(true);
    try {
      const body = {
        purchaserEmail,
        recipientEmail: giftType === 'single' && deliveryMethod === 'email' ? singleRecipient.email : '',
        recipientName: giftType === 'single' ? (singleRecipient.name || '') : '',
        giftMessage: giftMessage || '',
        giftPets: activeRecipients.map(r => ({
          id: r.id, tier: selectedTier,
          recipientName: r.name || '',
          recipientEmail: deliveryMethod === 'email' ? r.email : null,
          horoscopeAddon: 'none',
          occasion: r.occasion ?? 'discover',
        })),
        deliveryMethod,
        multiRecipient: giftType === 'multiple',
        couponId: appliedCoupon?.id || null,
        currency,
      };

      const { data, error } = await supabase.functions.invoke('purchase-gift-certificate', { body });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err) {
      console.error('Gift purchase error:', err);
      toast.error('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const stepCount = 2;
  const stickyVisible = !heroInView && !funnelInView;

  return (
    <div className="gp">
      <CosmicSky />
      <StarDefs />

      <main className="gp-main">
        <GiftNav />

        <Hero fmt={fmt} prices={prices} onCta={scrollToPicker} heroRef={heroRef} />
        <TrustStrip />

        <hr className="gp-hr" />
        {/* cream bands carry their own crisp seams; no violet hr at
            a dark/cream boundary */}
        <HowItWorks />


        {/* ── CREATE THEIR GIFT — the interactive purchase funnel.
             Order: how many → occasion per gift → tier cards → the
             preserved 2-step wizard. The count selector owns giftType
             and the recipients array; the section copy follows
             derivedOccasion. ── */}
        <section className="gp-wrap gp-band gp-funnel gp-night-late" id="tiers" ref={funnelRef as React.RefObject<HTMLElement>}>
          <div className="gp-shead gp-rev">
            <h2 className="gp-h2">Choose their reading.</h2>
          </div>

          {/* ── HOW MANY — the funnel's first question. This group is
               the page's scroll target: hero / closing / sticky CTAs
               land here (selector [role="radiogroup"]
               [aria-label="Gift occasion"] — keep it unique). ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="gp-count-strip"
          >
            <p className="gp-ask">How many are you gifting?</p>
            <div id="gift-count" role="radiogroup" aria-label="How many gifts" className="gp-count-row">
              {[1, 2, 3, 4, 5].map((n) => {
                const active = giftType === 'single'
                  ? n === 1
                  : (n === 5 ? recipients.length >= 5 : recipients.length === n);
                const pct = Math.round(getVolumeDiscount(n) * 100);
                return (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={n === 5 ? '5 or more gifts' : `${n} ${n === 1 ? 'gift' : 'gifts'}`}
                    onClick={() => handleCountSelect(n)}
                    className={`gp-count-chip ${active ? 'is-on' : ''}`}
                  >
                    <span className="gp-count-n">{n === 5 ? '5+' : n}</span>
                    {pct > 0 && <span className="gp-count-save">{pct}% off</span>}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* ── OCCASION PER GIFT — one chip row for a single gift, one
               labelled row per gift for group orders. Writes the
               occasion that ships on each recipient row. ── */}
          <motion.div
            key={`occ-${giftType}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="gp-occ-strip"
          >
            {giftType === 'single' ? (
              <>
                <p className="gp-ask">What's the occasion?</p>
                <div role="radiogroup" aria-label="Occasion" className="gp-occ-row">
                  {OCCASION_CHIPS.map(({ value, label }) => {
                    const active = selectedOccasion === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => handleSingleOccasion(value)}
                        className={`gp-occ-tickbox ${active ? 'is-on' : ''} ${value === 'memorial' ? 'is-mem' : ''}`}
                      >
                        <span className="gp-occ-sq" aria-hidden="true">{active && <GlyphCheck />}</span>
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <p className="gp-ask">What's the occasion for each?</p>
                <div className="gp-occ-multi">
                  {recipients.map((r, idx) => (
                    <div key={r.id} className="gp-occ-gift">
                      <span className="gp-occ-gift-label">Gift {idx + 1}</span>
                      <div role="radiogroup" aria-label={`Gift occasion ${idx + 1}`} className="gp-occ-row">
                        {OCCASION_CHIPS.map(({ value, label }) => {
                          const active = (r.occasion ?? 'discover') === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              role="radio"
                              aria-checked={active}
                              onClick={() => updateRecipient(r.id, 'occasion', value)}
                              className={`gp-occ-tickbox ${active ? 'is-on' : ''} ${value === 'memorial' ? 'is-mem' : ''}`}
                            >
                              <span className="gp-occ-sq" aria-hidden="true">{active && <GlyphCheck />}</span>
                              <span>{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>

          <div className="gp-tier-zone">

            {/* ── TIER CARDS — always live (derived occasion defaults
                to discover). An all-memorial order is portrait-only;
                everything else renders both tiers. ── */}
            <AnimatePresence>
              <motion.div
                key={`tiers-${derivedOccasion}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className={`gp-tier-row ${derivedOccasion === 'memorial' ? 'is-single' : ''}`}>
                  {(() => {
                    const occTiers = OCCASION_TIERS[derivedOccasion];
                    const accent = OCCASION_ACCENT[derivedOccasion];
                    const visibleKeys: TierKey[] = derivedOccasion === 'memorial'
                      ? ['portrait']
                      : ['essential', 'portrait'];

                    return visibleKeys.map((key) => (
                      <TierCard
                        key={key}
                        tierKey={key}
                        selected={selectedTier === key}
                        onClick={() => handleTierSelect(key)}
                        fmt={fmt}
                        cents={TIER_CENTS[key].cents}
                        wasCents={TIER_CENTS[key].wasCents}
                        override={occTiers?.[key]}
                        accent={accent}
                      />
                    ));
                  })()}
                </div>

                {/* Worry-killer row + one voice at the decision. No
                    gp-rev here: this block re-mounts on occasion
                    change and the reveal observer only runs once. */}
                <ul className="gp-worry-row">
                  <li><GlyphMoonClock /> Ready in minutes</li>
                  <li><GlyphComet /> Nothing to ship</li>
                  <li><GlyphSeal /> Full refund if it does not feel like them</li>
                </ul>
                <div className="gp-tier-pay">
                  <GiftPayMarks />
                </div>

              </motion.div>
            </AnimatePresence>
          </div>{/* /.gp-tier-zone */}

          <div className="gp-funnel-col">
            {/* ── FLOW (appears after tier selection) ── */}
            <div id="gift-flow">
              <AnimatePresence>
                {selectedTier && (
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="gp-flow"
                  >
                    {/* Panel header — the chosen gift, stated with confidence */}
                    <div className="gp-flow-head">
                      <div className="gp-flow-head-l">
                        <p className="gp-flow-eyebrow">Their gift</p>
                        <p className="gp-flow-tier">{OCCASION_TIERS[derivedOccasion]?.[selectedTier]?.label ?? TIERS[selectedTier].label}</p>
                      </div>
                      <div className="gp-flow-head-r">
                        <span className="gp-flow-price">{fmt(TIER_CENTS[selectedTier].cents)}</span>
                        <button onClick={() => { setSelectedTier(null); setStep(2); }} className="gp-change">
                          Change
                        </button>
                      </div>
                    </div>

                    {/* Step indicator — slim violet progress */}
                    <div className="gp-stepper" aria-hidden="true">
                      {[...Array(stepCount)].map((_, idx) => {
                        const s = idx + 2;
                        return (
                          <div key={s} className="gp-stepper-seg">
                            <div className={`gp-stepper-dot ${step >= s ? 'is-on' : ''}`}>
                              {step > s ? <GlyphCheck /> : idx + 1}
                            </div>
                            {idx + 1 < stepCount && <div className={`gp-stepper-bar ${step > s ? 'is-on' : ''}`} />}
                          </div>
                        );
                      })}
                    </div>

                    <AnimatePresence mode="wait">

                      {/* ── STEP 1: Who? ── */}
                      {/* ── Delivery + recipient details ── */}
                      {step === 2 && (
                        <motion.div key="ds2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className="gp-step-col">

                          <div className="gp-step-head">
                            <div style={{ width: 48 }} />
                            <p>{giftType === 'single' ? 'Their Details' : 'Add Recipients'}</p>
                            <div style={{ width: 48 }} />
                          </div>

                          {/* Delivery method. Group gifts are link-only: the
                              gift email reaches one recipient, so promising
                              per-person emails on a group order would be
                              false. Each person gets their own link instead. */}
                          <div className="gp-panel gp-pad">
                            <p className="gp-field-label">How should we deliver it?</p>
                            <div className="gp-two-col" style={giftType === 'multiple' ? { gridTemplateColumns: '1fr' } : undefined}>
                              {(giftType === 'multiple'
                                ? [
                                    { key: 'link' as const, Glyph: GlyphThread, title: 'Magic links', sub: 'One link per person. Share each by text, card, or in person', badge: 'How group gifts arrive' },
                                  ]
                                : [
                                    { key: 'link' as const, Glyph: GlyphThread, title: 'Magic link', sub: 'Share via text, card, or in person', badge: 'Most flexible' },
                                    { key: 'email' as const, Glyph: GlyphEnvelope, title: 'Email directly', sub: 'We send a beautiful gift email', badge: null },
                                  ]
                              ).map(opt => (
                                <button key={opt.key} onClick={() => setDeliveryMethod(opt.key)}
                                  className={`gp-choice gp-choice-left ${deliveryMethod === opt.key ? 'is-on' : ''}`}>
                                  {opt.badge && (
                                    <span className="gp-flex-chip">{opt.badge}</span>
                                  )}
                                  <span className={`gp-choice-picked ${deliveryMethod === opt.key ? 'is-on' : ''}`} aria-hidden="true"><GlyphCheck /></span>
                                  <span className="gp-choice-plaque gp-choice-plaque-sm" aria-hidden="true"><opt.Glyph className="gp-choice-icon gp-choice-icon-sm" /></span>
                                  <p className="gp-choice-t">{opt.title}</p>
                                  <p className="gp-choice-s">{opt.sub}</p>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Single recipient */}
                          {giftType === 'single' && (
                            <div className="gp-panel gp-pad">
                              <p className="gp-field-label">Who's the lucky pet parent?</p>
                              <div className="gp-field-col">
                                <input type="text" className="gp-field" value={singleRecipient.name} onChange={e => updateSingleRecipient('name', e.target.value)} placeholder="Their name (optional)" />
                                {deliveryMethod === 'email' && (
                                  <input type="email" className="gp-field" value={singleRecipient.email} onChange={e => updateSingleRecipient('email', e.target.value)} placeholder="Their email address" />
                                )}
                              </div>
                            </div>
                          )}

                          {/* Multiple recipients */}
                          {giftType === 'multiple' && (
                            <div className="gp-field-col">
                              {recipients.map((r, idx) => (
                                <div key={r.id} className="gp-panel gp-pad-sm">
                                  <div className="gp-recip-head">
                                    <div className="gp-recip-id">
                                      <span className="gp-recip-n">{idx + 1}</span>
                                      <span className="gp-recip-name">{r.name || `Recipient ${idx + 1}`}</span>
                                    </div>
                                    {recipients.length > 1 && (
                                      <button onClick={() => setRecipients(rs => rs.filter(x => x.id !== r.id))} className="gp-ghost" aria-label={`Remove recipient ${idx + 1}`}>
                                        <GlyphCross />
                                      </button>
                                    )}
                                  </div>
                                  <div className={`gp-recip-fields ${deliveryMethod === 'email' ? 'has-email' : ''}`}>
                                    <input type="text" className="gp-field gp-field-sm" value={r.name} onChange={e => updateRecipient(r.id, 'name', e.target.value)} placeholder="Name" />
                                    {deliveryMethod === 'email' && (
                                      <input type="email" className="gp-field gp-field-sm" value={r.email} onChange={e => updateRecipient(r.id, 'email', e.target.value)} placeholder="Email" />
                                    )}
                                  </div>
                                </div>
                              ))}
                              {recipients.length < 10 && (
                                <button
                                  onClick={() => setRecipients(rs => [...rs, { id: crypto.randomUUID(), name: '', email: '', occasion: derivedOccasion }])}
                                  className="gp-add-row"
                                >
                                  <GlyphPlus /> Add another person
                                  {discount < 0.30 && (
                                    <span className="gp-add-bonus">
                                      +{Math.round((getVolumeDiscount(recipients.length + 1) - discount) * 100)}% off
                                    </span>
                                  )}
                                </button>
                              )}
                            </div>
                          )}

                          <button onClick={() => setStep(3)} disabled={!canProceedStep2()} className="gp-cta gp-cta-full">
                            Continue to Checkout <GlyphChevron />
                          </button>
                        </motion.div>
                      )}

                      {/* ── STEP 3: Checkout ── */}
                      {step === 3 && (
                        <motion.div key="ds3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className="gp-step-col">

                          <div className="gp-step-head">
                            <button onClick={() => setStep(2)} className="gp-ghost">
                              <GlyphArrow /> Back
                            </button>
                            <p>Almost Done</p>
                            <div style={{ width: 48 }} />
                          </div>

                          {/* Gift message first — emotional anchor */}
                          <div className="gp-message">
                            <label className="gp-field-label" htmlFor="gp-message">
                              Write them a message
                            </label>
                            <p className="gp-field-sub gp-message-sub">They'll see this the moment they open their gift.</p>
                            <textarea
                              id="gp-message"
                              className="gp-field gp-message-field"
                              value={giftMessage}
                              onChange={e => setGiftMessage(e.target.value)}
                              placeholder={`From the moment I saw you with your pet, I knew you two were meant to be...`}
                              rows={4}
                              maxLength={500}
                              style={{ resize: 'none' }}
                            />
                            <p className="gp-message-count" aria-hidden="true">{giftMessage.length}/500</p>
                          </div>

                          {/* Purchaser email */}
                          <div>
                            <label className="gp-field-label" htmlFor="gp-email">
                              Your email
                              <span className="gp-field-note"> (for your receipt and gift link)</span>
                            </label>
                            <input id="gp-email" type="email" className="gp-field" value={purchaserEmail} onChange={e => setPurchaserEmail(e.target.value)} placeholder="your@email.com" />
                          </div>

                          {/* Order summary — receipt block */}
                          <div className="gp-panel gp-pad gp-receipt">
                            <div className="gp-summary-head">
                              <GlyphGift />
                              <p>Order Summary</p>
                            </div>
                            {activeRecipients.map((r, idx) => (
                              <div key={r.id} className={`gp-summary-row ${idx < activeRecipients.length - 1 ? 'has-hair' : ''}`}>
                                <div className="gp-summary-item">
                                  <GlyphPaw />
                                  <div>
                                    <p className="gp-summary-tier">{OCCASION_TIERS[derivedOccasion]?.[selectedTier!]?.label ?? TIERS[selectedTier!].label}</p>
                                    {r.name && <p className="gp-summary-for">for {r.name}</p>}
                                  </div>
                                </div>
                                <span className="gp-summary-price">{fmt(TIER_CENTS[selectedTier!].cents)}</span>
                              </div>
                            ))}
                            <div className="gp-summary-totals">
                              {discount > 0 && (
                                <div className="gp-summary-disc">
                                  <span><GlyphStar />{Math.round(discount * 100)}% volume discount</span>
                                  <span>&minus;{fmt(pricing.discountAmount)}</span>
                                </div>
                              )}
                              {pricing.promoAmount > 0 && appliedCoupon && (
                                <div className="gp-summary-disc">
                                  <span><GlyphStar />{appliedCoupon.code} ({appliedCoupon.discount_value}% off)</span>
                                  <span>&minus;{fmt(pricing.promoAmount)}</span>
                                </div>
                              )}
                              <div className="gp-summary-total">
                                <span>Total</span>
                                <span className="gp-summary-total-v">{fmt(pricing.finalTotal)}</span>
                              </div>
                              {isLocalized && (
                                <p className="gp-summary-note">
                                  Shown in {currencyCode} — billed in USD at checkout.
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Promo code */}
                          {appliedCoupon ? (
                            <div className="gp-promo-chip">
                              <span>{appliedCoupon.code} applied &middot; {appliedCoupon.discount_value}% off</span>
                              <button onClick={() => setAppliedCoupon(null)} aria-label="Remove promo code">&times;</button>
                            </div>
                          ) : (
                            <div>
                              <div className="gp-promo-row">
                                <input
                                  className="gp-field"
                                  value={promoCode}
                                  onChange={e => setPromoCode(e.target.value.toUpperCase())}
                                  placeholder="PROMO CODE"
                                  onKeyDown={e => e.key === 'Enter' && applyPromo()}
                                  style={{ flex: 1, textTransform: 'uppercase' }}
                                />
                                <button
                                  onClick={applyPromo}
                                  disabled={!promoCode.trim() || isValidatingPromo}
                                  className="gp-apply"
                                >
                                  {isValidatingPromo ? '...' : 'Apply'}
                                </button>
                              </div>
                              {promoError && <p className="gp-promo-err">{promoError}</p>}
                            </div>
                          )}

                          {/* Pay button */}
                          <button
                            onClick={handlePurchase}
                            disabled={isLoading || !purchaserEmail.includes('@')}
                            className="gp-cta gp-cta-full gp-cta-pay"
                          >
                            {isLoading
                              ? <><SpinnerInline />Opening secure checkout...</>
                              : <><GlyphGift />Send This Gift &middot; {fmt(pricing.finalTotal)}</>
                            }
                          </button>

                          {/* Risk reversal at the money moment — DossierCheckout treatment */}
                          <p className="gp-pay-guarantee">If the reading does not feel like them, we refund every cent.</p>

                          {/* Quiet trust footer + the real payment marks */}
                          <div className="gp-pay-quiet">
                            <div className="gp-pay-trust-line">
                              <span>Secure checkout</span>
                              <span>Ready in minutes</span>
                              <span>Valid a full year</span>
                            </div>
                            <GiftPayMarks />
                          </div>
                        </motion.div>
                      )}

                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>{/* /.gp-funnel-col */}
        </section>

        <GifterProof />

        <hr className="gp-hr" />
        <RigorBand />
        <FaqSection />
        <ClosingCta fmt={fmt} prices={prices} onCta={scrollToPicker} />
        <GiftFooter />
      </main>

      {/* Sticky CTA — appears once the hero scrolls away, hides over the funnel */}
      <div className={`gp-sticky ${stickyVisible ? 'is-shown' : ''}`} aria-hidden={!stickyVisible}>
        <p className="gp-sticky-price">from <span>{fmt(prices.basic)}</span></p>
        <button type="button" className="gp-cta gp-cta-sticky" onClick={scrollToPicker} tabIndex={stickyVisible ? 0 : -1}>
          Create their gift
        </button>
      </div>

      <style>{GP_CSS}</style>
    </div>
  );
}

function SpinnerInline() {
  return (
    <span className="gp-spin" aria-hidden="true" />
  );
}

function TrustRow({ items, glyphs }: { items: string[]; glyphs: GlyphComponent[] }) {
  return (
    <div className="gp-trust-mini">
      {items.map((t, i) => {
        const Glyph = glyphs[i];
        return (
          <span key={i}>
            <Glyph />{t}
          </span>
        );
      })}
    </div>
  );
}

/* ═══ Design system — cosmic purple + white (funnel-v2 tokens).
   Surfaces: sky #0d0a14 · glass violet gradient over #15101c · panel
   #15101c→#110d18. Violet family #b9a5f0/#9a7ee6/#7c5cd6. Star gold
   ONLY on review-star fills. Fraunces display / Newsreader body.
   Motion: --ease-settle entrances via IntersectionObserver, one
   constellation ceremony, parallax sky planes via CSS scroll-driven
   animation (@supports + reduced-motion gated). ═══ */
const GP_CSS = `
.gp{
  --bg:#0d0a14;
  --white:#ffffff;
  --body:#ececf2;
  --muted:#c8c8d2;
  --dim:#9b93b8;
  --vio:#7c5cd6;
  --vio-soft:#9a7ee6;
  --vio-bright:#b9a5f0;
  --vio-pale:#cfc0f4;
  --line:rgba(154,126,230,0.22);
  --line-bright:rgba(185,165,240,0.35);
  --ease-stage:cubic-bezier(0.22,0.7,0.2,1);
  --ease-settle:cubic-bezier(0.16,1,0.3,1);
  position:relative;min-height:100vh;background:var(--bg);overflow-x:hidden;
  color:var(--body);
  font-family:'Newsreader',Georgia,serif;font-weight:400;
  font-size:clamp(18px,1vw + 14px,19px);line-height:1.7;
  -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;
}
.gp *{box-sizing:border-box;margin:0}
.gp-main{position:relative;z-index:1}
.gp :focus-visible{outline:2px solid #9a7ee6;outline-offset:2px;border-radius:4px}
.gp strong{font-weight:600;color:var(--white)}
.gp button{font:inherit;color:inherit}
.gp input,.gp textarea{font:inherit}

/* ── backdrop: three planes. Base holds the nebula; far and near
   star fields drift upward at different rates as the page scrolls
   (scroll-driven, transform-only, gated). ── */
.gp-sky{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.gp-sky-base{position:absolute;inset:0;background:
  radial-gradient(900px 620px at 82% 0%, rgba(124,92,214,.14), transparent 70%),
  radial-gradient(760px 560px at 6% 8%, rgba(93,71,160,.16), transparent 72%),
  linear-gradient(180deg,#15101c 0%,#100c18 24%,#0d0a14 50%,#0d0a14 100%)}
.gp-sky-aurora{position:absolute;inset:-24% -12%;pointer-events:none;
  filter:blur(46px);mix-blend-mode:screen;
  background:
    radial-gradient(46% 34% at 20% 26%, rgba(124,92,214,.22), transparent 70%),
    radial-gradient(40% 30% at 82% 14%, rgba(185,165,240,.15), transparent 70%),
    radial-gradient(52% 38% at 62% 74%, rgba(98,67,176,.20), transparent 72%)}
.gp-sky-far{position:absolute;inset:-10vh 0;background:
  radial-gradient(1px 1px at 18% 14%, rgba(236,236,242,.34), transparent 60%),
  radial-gradient(1px 1px at 72% 9%, rgba(185,165,240,.28), transparent 60%),
  radial-gradient(1px 1px at 41% 24%, rgba(236,236,242,.26), transparent 60%),
  radial-gradient(1px 1px at 9% 46%, rgba(185,165,240,.22), transparent 60%),
  radial-gradient(1px 1px at 60% 54%, rgba(236,236,242,.2), transparent 60%),
  radial-gradient(1px 1px at 30% 72%, rgba(236,236,242,.18), transparent 60%),
  radial-gradient(1px 1px at 84% 66%, rgba(185,165,240,.2), transparent 60%),
  radial-gradient(1px 1px at 52% 90%, rgba(236,236,242,.16), transparent 60%)}
.gp-sky-near{position:absolute;inset:-16vh 0;background:
  radial-gradient(1.5px 1.5px at 26% 10%, rgba(236,236,242,.5), transparent 60%),
  radial-gradient(1.3px 1.3px at 66% 20%, rgba(185,165,240,.44), transparent 60%),
  radial-gradient(1.4px 1.4px at 88% 34%, rgba(236,236,242,.36), transparent 60%),
  radial-gradient(1.3px 1.3px at 12% 58%, rgba(185,165,240,.34), transparent 60%),
  radial-gradient(1.5px 1.5px at 44% 44%, rgba(236,236,242,.3), transparent 60%),
  radial-gradient(1.3px 1.3px at 78% 74%, rgba(185,165,240,.3), transparent 60%),
  radial-gradient(1.4px 1.4px at 34% 88%, rgba(236,236,242,.26), transparent 60%)}
@supports (animation-timeline: scroll()) {
  @media (prefers-reduced-motion: no-preference) {
    .gp-sky-far{animation:gpSkyFar linear both;animation-timeline:scroll(root)}
    .gp-sky-near{animation:gpSkyNear linear both;animation-timeline:scroll(root)}
    .gp-sky-aurora{animation:gpAurora linear both;animation-timeline:scroll(root)}
  }
}
@keyframes gpSkyFar{to{transform:translateY(-7vh)}}
@keyframes gpSkyNear{to{transform:translateY(-13vh)}}
@keyframes gpAurora{from{transform:translateY(4vh) rotate(0deg)}to{transform:translateY(-9vh) rotate(3deg)}}

/* layout */
.gp-wrap{max-width:1080px;margin:0 auto;padding-left:22px;padding-right:22px}
.gp-band{padding-top:clamp(64px,9vw,104px);padding-bottom:clamp(64px,9vw,104px)}
.gp-hr{height:1px;border:0;max-width:1080px;margin:0 auto;
  background:linear-gradient(90deg,transparent,rgba(154,126,230,0.30) 35%,rgba(185,165,240,0.42) 50%,rgba(154,126,230,0.30) 65%,transparent)}

/* ── temperature arc: dark zones tint along the scroll. Early dark
   (hero + sample) leans indigo night; late dark (funnel, rigor,
   closing) leans deeper plum, so the buy moment reads as a different
   hour of the same night. ── */
.gp-night-early,.gp-night-late{position:relative}
.gp-night-early::before,.gp-night-late::before{content:"";position:absolute;top:0;bottom:0;left:50%;width:100vw;
  transform:translateX(-50%);z-index:-1;pointer-events:none}
.gp-night-early::before{background:linear-gradient(180deg,transparent,rgba(21,16,32,.40) 14%,rgba(15,11,22,.46) 86%,transparent)}
.gp-night-late::before{background:
  radial-gradient(720px 420px at 80% 8%, rgba(124,92,214,.10), transparent 70%),
  linear-gradient(180deg,transparent,rgba(21,16,30,.44) 12%,rgba(15,11,22,.52) 88%,transparent)}

/* ── cream bands: the envelope-paper light sections. Opaque grounds
   (the fixed star sky must never show through), aubergine ink,
   darkened violet accents, crisp letterpress seams top and bottom.
   Texture is pure CSS gradient noise; no image files. ── */
.gp-cream{position:relative;
  --cream:#15101c;--cream-2:#1a1420}
.gp-cream-deep{--cream:#1a1420;--cream-2:#201722}
.gp-cream::before{content:"";position:absolute;top:0;bottom:0;left:50%;width:100vw;
  transform:translateX(-50%);z-index:-1;pointer-events:none;
  background:
    radial-gradient(1100px 520px at 50% 0%, rgba(167,139,250,.10), transparent 72%),
    linear-gradient(180deg,var(--cream),var(--cream-2));
  border-top:1px solid rgba(185,165,240,.26);border-bottom:1px solid rgba(185,165,240,.26);
  box-shadow:inset 0 1px 0 rgba(207,192,244,.12),inset 0 -1px 0 rgba(8,5,18,.7),
    inset 0 30px 46px -30px rgba(167,139,250,.10),inset 0 -30px 46px -30px rgba(8,5,18,.55)}
.gp-cream + .gp-cream::before{border-top:0;
  box-shadow:inset 0 -1px 0 rgba(8,5,18,.7),inset 0 -30px 46px -30px rgba(8,5,18,.55)}
.gp-cream .gp-panel{background:linear-gradient(180deg,#1c1629,#17111f);
  border:1px solid rgba(185,165,240,.20);
  box-shadow:0 1px 2px rgba(8,5,18,.4),0 16px 34px -18px rgba(8,5,18,.7)}
.gp-cream .gp-glass{background:linear-gradient(180deg,#1c1629,#17111f);
  border:1px solid rgba(185,165,240,.20);
  box-shadow:0 1px 2px rgba(8,5,18,.4),0 18px 36px -18px rgba(8,5,18,.7)}
@media (hover:hover){
  .gp-cream .gp-step:hover{border-color:rgba(185,165,240,.42);
    box-shadow:0 18px 36px -16px rgba(124,92,214,.35)}
}

/* type */
.gp-h1{font-family:'Asap',system-ui,sans-serif;font-weight:700;color:var(--white);
  font-size:clamp(2rem,4.8vw,3.25rem);line-height:1.13;letter-spacing:-.017em;text-wrap:balance}
.gp-h1 em{font-style:normal;color:inherit}
.gp-turn{font-family:'Fraunces',Georgia,serif;font-style:italic;font-weight:500;color:#d7c9ff;
  font-size:clamp(1.6rem,3.5vw,2.35rem);line-height:1.08;margin-top:14px}
.gp-h2{font-family:'Fraunces',Georgia,serif;font-weight:500;color:var(--white);
  font-size:clamp(1.9rem,4.8vw,3rem);line-height:1.02;letter-spacing:-.018em;text-wrap:balance}
.gp-eyebrow{font-weight:600;font-size:clamp(14px,1.2vw + 9px,15px);letter-spacing:.14em;
  text-transform:uppercase;color:var(--vio-bright)}
.gp-kicker{font-weight:600;font-size:clamp(14px,1.2vw + 9px,15px);letter-spacing:.14em;
  text-transform:uppercase;color:var(--vio-bright);text-align:center}
.gp-lead{font-size:clamp(1.05rem,2.1vw,1.3rem);line-height:1.5;color:var(--body);max-width:34em}
.gp-support{color:var(--muted);font-size:clamp(18px,1vw + 14px,19px);margin-top:12px}
.gp-shead{text-align:center;max-width:720px;margin:0 auto clamp(34px,5vw,52px)}
.gp-shead::after{content:"";display:block;width:56px;height:2px;margin:18px auto 0;border-radius:2px;
  background:linear-gradient(90deg,transparent,#9a7ee6,transparent)}

/* reveal */
.gp-rev{opacity:0;transform:translateY(16px);
  transition:opacity .55s var(--ease-settle),transform .55s var(--ease-settle);
  transition-delay:var(--d,0ms)}
.gp-rev.is-in{opacity:1;transform:none}
@media (prefers-reduced-motion: reduce){
  .gp-rev{opacity:1 !important;transform:none !important;filter:none !important;transition:none !important}
  .gp *,.gp *::before,.gp *::after{animation:none !important;transition:none !important}
}

/* surfaces */
.gp-glass{border-radius:18px;
  background:linear-gradient(180deg,rgba(124,92,214,.13),rgba(124,92,214,.05)),#15101c;
  border:1px solid rgba(154,126,230,.28);
  box-shadow:0 2px 6px rgba(0,0,0,.4),0 14px 34px rgba(0,0,0,.35)}
.gp-panel{border-radius:18px;background:linear-gradient(180deg,#15101c,#110d18);
  border:1px solid rgba(154,126,230,.20)}
.gp-pad{padding:20px}
.gp-pad-sm{padding:16px}

/* CTA — violet metal ramp */
.gp-cta{position:relative;overflow:hidden;display:inline-flex;align-items:center;justify-content:center;gap:10px;
  border:0;cursor:pointer;border-radius:12px;min-height:56px;padding:0 30px;
  font-family:'Newsreader',Georgia,serif;font-weight:600;font-size:clamp(18px,1vw + 14px,19px);letter-spacing:.02em;color:#fff;
  background:linear-gradient(180deg,#9a7ee6 0%,#9a7ee6 18%,#7c5cd6 40%,#5d47a0 56%,#6243b0 80%,#47307f 100%);
  box-shadow:0 1px 0 rgba(255,255,255,.4) inset,0 -1px 0 rgba(0,0,0,.28) inset,0 6px 18px -6px rgba(124,92,214,.45);
  transition:transform .18s var(--ease-stage),box-shadow .18s var(--ease-stage)}
.gp-cta svg{width:19px;height:19px}
.gp-cta::after{content:"";position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(105deg,transparent 42%,rgba(255,255,255,.32) 50%,transparent 58%);
  transform:translateX(-130%);transition:transform .6s ease}
.gp-cta:hover{transform:translateY(-1px);
  box-shadow:0 1px 0 rgba(255,255,255,.4) inset,0 -1px 0 rgba(0,0,0,.28) inset,0 12px 34px -8px rgba(124,92,214,.65)}
.gp-cta:hover::after{transform:translateX(130%)}
.gp-cta:active{transform:scale(.98) translateY(1px);transition-duration:.06s}
.gp-cta:disabled{cursor:default;color:var(--dim);background:rgba(124,92,214,.16);box-shadow:none;transform:none}
.gp-cta:disabled::after{display:none}
.gp-cta-full{width:100%}
.gp-spin{width:18px;height:18px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;
  border-radius:50%;animation:gpspin 1s linear infinite;flex-shrink:0;display:inline-block}
@keyframes gpspin{to{transform:rotate(360deg)}}

/* nav */
.gp-nav{display:flex;align-items:center;justify-content:space-between;padding-top:20px}
.gp-back{display:inline-flex;align-items:center;gap:6px;color:var(--muted);text-decoration:none;
  font-size:16px;transition:color .2s}
.gp-back:hover{color:var(--white)}
.gp-back svg{width:16px;height:16px}
.gp-wordmark{font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:21px;letter-spacing:-.01em;
  color:var(--white);text-decoration:none}
.gp-nav-spacer{width:58px}

/* hero */
.gp-hero{display:grid;gap:clamp(30px,5vw,56px);align-items:center;
  padding-top:clamp(40px,7vw,84px);padding-bottom:clamp(48px,7vw,84px)}
@media (min-width:880px){.gp-hero{grid-template-columns:1.05fr .95fr}}
.gp-hero-copy .gp-h1{margin:16px 0 18px}
.gp-cta-row{display:flex;align-items:center;gap:18px;flex-wrap:wrap;margin-top:26px}
.gp-price-note{color:var(--muted);font-size:17px}
.gp-price-note span{font-family:'Fraunces',Georgia,serif;font-weight:500;font-size:1.25em;color:var(--white)}
.gp-badges{display:flex;flex-wrap:wrap;gap:8px 22px;list-style:none;padding:0;margin-top:22px}
.gp-badges li{display:inline-flex;align-items:center;gap:7px;font-size:15.5px;color:var(--muted)}
.gp-badges svg{width:16px;height:16px;color:var(--vio-soft);flex-shrink:0}
.gp-hero-visual{position:relative}
.gp-hero-visual::before{content:"";position:absolute;inset:-14%;pointer-events:none;
  background:radial-gradient(closest-side, rgba(124,92,214,.30), transparent 72%)}
.gp-hero-orbit{position:absolute;left:-12%;top:-9%;width:124%;height:118%;
  color:rgba(154,126,230,.4);pointer-events:none}
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .gp-hero-orbit{animation:gpOrbDrift linear both;animation-timeline:view();
      animation-range:entry 0% exit 100%}
  }
}
@keyframes gpOrbDrift{from{transform:translateY(16px)}to{transform:translateY(-16px)}}
.gp-hero-photo{position:relative;border-radius:20px;overflow:hidden;
  border:1px solid rgba(154,126,230,.28);
  box-shadow:0 2px 6px rgba(0,0,0,.4),0 24px 54px rgba(0,0,0,.45)}
.gp-hero-photo img{display:block;width:100%;height:auto;max-width:100%}
.gp-hero-photo .gp-hero-frame{position:absolute;inset:0;height:100%;object-fit:cover;opacity:0;
  transition:opacity 1.4s ease}
.gp-hero-photo .gp-hero-frame:first-child{position:relative}
.gp-hero-photo .gp-hero-frame.is-front{opacity:1}
@media (prefers-reduced-motion: reduce){.gp-hero-photo .gp-hero-frame{transition:none}}
.gp-hero-scrim{position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(180deg,rgba(13,10,20,0) 55%,rgba(13,10,20,.55) 100%)}

/* trust strip */
.gp-trust{padding-bottom:clamp(40px,6vw,64px)}
.gp-give-lead{text-align:center;font-weight:600;font-size:13.5px;letter-spacing:.16em;
  text-transform:uppercase;color:var(--vio-bright)}
.gp-give-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px 30px;
  max-width:820px;margin:26px auto 0;list-style:none;padding:0}
.gp-give-grid li{display:flex;flex-direction:column;align-items:center;text-align:center;gap:13px}
.gp-give-logo{display:flex;align-items:center;justify-content:center;height:48px}
.gp-give-logo img{display:block;width:auto;max-width:160px;
  opacity:.9;transition:opacity .25s var(--ease-settle)}
.gp-give-logo.is-mono img{filter:brightness(0) invert(1)}
.gp-give-grid li:hover .gp-give-logo img{opacity:1}
.gp-give-does{font-size:13.5px;line-height:1.4;color:var(--dim);max-width:190px}
.gp-tp-strip{display:flex;align-items:center;justify-content:center;gap:9px;
  width:fit-content;margin:34px auto 0;padding:11px 20px;border-radius:26px;text-decoration:none;
  border:1px solid var(--line);background:rgba(124,92,214,.07);
  transition:border-color .25s var(--ease-settle),background .25s var(--ease-settle)}
.gp-tp-strip:hover{border-color:var(--line-bright);background:rgba(124,92,214,.12)}
.gp-tp-lead{font-size:14px;color:var(--dim)}
.gp-tp-strip img{display:block;height:20px;width:auto}
@media (max-width:560px){
  .gp-give-grid{grid-template-columns:1fr;gap:22px;max-width:280px}
}
.gp-trust-row{display:flex;flex-wrap:wrap;justify-content:center;gap:12px 14px;list-style:none;padding:0}
.gp-trust-row li{display:inline-flex;align-items:center;gap:9px;font-size:16.5px;color:var(--body);
  padding:10px 18px;border-radius:999px;border:1px solid var(--line);
  background:linear-gradient(180deg,rgba(124,92,214,.12),rgba(124,92,214,.04))}
.gp-trust-row svg{width:18px;height:18px;color:var(--vio-bright);flex-shrink:0}

/* sample reading */
/* steps */
.gp-steps{display:grid;gap:16px}
@media (min-width:760px){.gp-steps{grid-template-columns:repeat(3,1fr)}}
.gp-step{padding:clamp(26px,3.4vw,34px);
  transition:transform .25s var(--ease-settle),border-color .2s ease,box-shadow .25s ease}
@media (hover:hover){
  .gp-step:hover{transform:translateY(-4px);border-color:var(--line-bright);
    box-shadow:0 14px 34px -12px rgba(124,92,214,.4)}
  .gp-step:hover .gp-step-icon{transform:translateY(-2px);
    box-shadow:0 12px 28px -10px rgba(124,92,214,.55)}
}
.gp-step-icon{display:inline-grid;place-items:center;width:52px;height:52px;border-radius:15px;
  background:linear-gradient(165deg,rgba(154,126,230,.24),rgba(124,92,214,.10));
  border:1px solid rgba(185,165,240,.30);box-shadow:0 8px 22px -12px rgba(124,92,214,.5);
  transition:transform .25s var(--ease-settle),box-shadow .25s ease}
.gp-step-icon svg{width:26px;height:26px;color:var(--vio-pale)}
.gp-step-n{font-family:'Fraunces',Georgia,serif;font-style:italic;font-weight:500;
  font-size:1rem;color:var(--vio-bright);margin:16px 0 6px}
.gp-step h3{font-family:'Fraunces',Georgia,serif;font-weight:500;font-size:1.35rem;line-height:1.15;color:var(--white)}
.gp-step-s{margin-top:10px;font-size:16.5px;line-height:1.6;color:var(--muted)}

/* proof */
.gp-stars{display:inline-flex;gap:3px}
.gp-proof .gp-kicker{margin-bottom:13px}

/* featured spotlight — the review they read first, framed on its own
   lifted violet panel with a bespoke quote watermark. */
.gp-rate{text-align:center;max-width:640px;margin:0 auto clamp(28px,4vw,42px)}
.gp-rate .gp-stars{justify-content:center}
.gp-rate-line{margin-top:12px;font-family:'Newsreader',Georgia,serif;font-style:italic;
  font-size:clamp(1.05rem,2.4vw,1.32rem);line-height:1.45;color:#e7dffb}
.gp-spotlight{position:relative;max-width:840px;margin:0 auto clamp(30px,4.4vw,46px);
  padding:clamp(32px,4.6vw,52px) clamp(24px,4.4vw,54px);text-align:center;border-radius:24px;overflow:hidden;
  background:
    radial-gradient(130% 92% at 50% -8%, rgba(167,139,250,.30), transparent 62%),
    linear-gradient(180deg,#221a35,#181221);
  border:1px solid rgba(197,178,255,.40);
  box-shadow:0 1px 0 rgba(207,192,244,.20) inset,0 26px 62px -26px rgba(8,5,18,.92),
    0 0 60px -10px rgba(139,102,246,.42)}
.gp-spotlight::before,.gp-wall-card::before{content:"";position:absolute;top:0;left:0;right:0;height:3px;
  background:linear-gradient(90deg,transparent,#b9a5f0 30%,#e3d9ff 50%,#b9a5f0 70%,transparent);
  opacity:.9}
.gp-spot-quote{position:absolute;top:16px;left:clamp(18px,4vw,40px);line-height:0;
  color:rgba(197,178,255,.26);pointer-events:none}
.gp-spot-quote svg{width:clamp(38px,5.6vw,58px);height:auto}
.gp-spotlight .gp-stars{position:relative}
.gp-spotlight blockquote{position:relative;font-family:'Fraunces',Georgia,serif;font-style:italic;
  font-weight:400;font-size:clamp(1.38rem,2.9vw,1.9rem);line-height:1.42;color:#faf8ff;
  margin:18px auto 24px;max-width:34ch;text-wrap:pretty}
.gp-spotlight figcaption{display:inline-flex;align-items:center;gap:13px;color:var(--vio-pale);
  font-size:17px;letter-spacing:.02em}
.gp-spotlight figcaption img{width:52px;height:52px;border-radius:14px;object-fit:cover;
  border:1px solid rgba(197,178,255,.45);box-shadow:0 6px 16px -8px rgba(8,5,18,.85)}

/* the wall of love — masonry columns of rich violet glass, packed by
   quote length. Big readable body, brighter names, glow-lift on hover. */
.gp-wall{column-count:1;column-gap:18px}
@media (min-width:600px){.gp-wall{column-count:2}}
@media (min-width:1000px){.gp-wall{column-count:3}}
.gp-wall-card{position:relative;overflow:hidden;break-inside:avoid;-webkit-column-break-inside:avoid;
  margin:0 0 18px;padding:24px 22px 21px;border-radius:18px;
  background:
    radial-gradient(120% 78% at 50% -12%, rgba(167,139,250,.26), transparent 60%),
    linear-gradient(180deg,#1d1730,#17111f);
  border:1px solid rgba(167,139,250,.38);
  box-shadow:0 1px 0 rgba(207,192,244,.14) inset,0 18px 42px -22px rgba(8,5,18,.9);
  transition:transform .28s var(--ease-settle),border-color .25s ease,box-shadow .3s ease}
@media (hover:hover){
  .gp-wall-card:hover{transform:translateY(-4px);border-color:rgba(197,178,255,.55);
    box-shadow:0 1px 0 rgba(207,192,244,.16) inset,0 24px 54px -18px rgba(8,5,18,.95),
      0 0 34px -6px rgba(139,102,246,.48)}
}
.gp-wall-card .gp-stars{margin-bottom:2px}
.gp-wall-card blockquote{margin:13px 0 16px;font-size:18px;line-height:1.62;color:#efeaff}
.gp-wall-card figcaption{display:flex;align-items:center;gap:11px;color:var(--vio-pale);
  font-size:15px;line-height:1.4}
.gp-wall-card figcaption img{width:44px;height:44px;border-radius:12px;object-fit:cover;
  border:1px solid rgba(197,178,255,.4);flex:none}

/* bridge — one quiet line on the open cosmos before the funnel */
.gp-bridge{text-align:center;padding-top:clamp(76px,11vw,128px);padding-bottom:clamp(76px,11vw,128px)}
.gp-bridge-line{font-family:'Fraunces',Georgia,serif;font-style:italic;font-weight:500;
  font-size:clamp(1.5rem,3.6vw,2.35rem);line-height:1.3;color:var(--white);
  max-width:22em;margin:16px auto 0;text-wrap:balance}

/* rigor */
.gp-rigor-sources{list-style:none;margin:34px auto 0;padding:22px 0 0;max-width:860px;
  border-top:1px solid rgba(185,165,240,.18);
  display:flex;justify-content:center;gap:clamp(18px,4vw,52px);flex-wrap:wrap}
.gp-rigor-sources li{display:flex;flex-direction:column;gap:3px;max-width:250px}
.gp-src-name{font-weight:600;font-size:13.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--vio-pale)}
.gp-src-org{font-size:13.5px;color:var(--dim);line-height:1.4}
/* reviews trust row */
.gp-proof-trust{list-style:none;margin:30px auto 0;padding:18px 0 0;max-width:920px;
  border-top:1px solid rgba(185,165,240,.16);
  display:flex;justify-content:center;gap:clamp(14px,3vw,38px);flex-wrap:wrap;
  font-size:14px;color:var(--dim)}
.gp-proof-trust li{display:inline-flex;align-items:center;gap:7px;text-align:left}
.gp-proof-trust svg{width:15px;height:15px;flex:none;color:var(--vio-soft)}
.gp-rigor{text-align:center}
.gp-rigor-stage{position:relative;max-width:760px;margin:0 auto}
.gp-rigor-stage::before{content:"";position:absolute;left:50%;top:50%;width:min(820px,108%);height:190%;
  transform:translate(-50%,-50%);z-index:-1;pointer-events:none;filter:blur(34px);
  background:radial-gradient(closest-side, rgba(124,92,214,.16), transparent 74%)}
.gp-rigor-orbit{position:absolute;left:50%;top:50%;width:min(880px,116%);height:auto;
  transform:translate(-50%,-50%);z-index:-1;pointer-events:none;color:rgba(154,126,230,.34)}
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .gp-rigor-orbit{animation:gpRigorDrift linear both;animation-timeline:view();
      animation-range:entry 0% exit 100%}
  }
}
@keyframes gpRigorDrift{from{transform:translate(-50%,-46%) rotate(2deg)}to{transform:translate(-50%,-54%) rotate(-2deg)}}
.gp-rigor-row{position:relative;display:grid;grid-template-columns:repeat(2,1fr);gap:26px 16px}
@media (min-width:700px){.gp-rigor-row{grid-template-columns:repeat(4,1fr)}}
.gp-rigor-item{position:relative;padding:8px 2px}
.gp-rigor-item::before{content:"";position:absolute;left:50%;top:50%;width:130px;height:110px;
  transform:translate(-50%,-50%);z-index:-1;pointer-events:none;filter:blur(20px);
  background:radial-gradient(closest-side, rgba(124,92,214,.28), transparent 72%)}
.gp-rigor-v{font-family:'Fraunces',Georgia,serif;font-weight:500;font-size:clamp(1.5rem,3vw,1.9rem);color:var(--vio-pale);
  background:linear-gradient(180deg,#ffffff 15%,#cfc0f4 85%);
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.gp-rigor-l{font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);margin-top:6px}
.gp-rigor-line{font-style:italic;color:var(--muted);margin-top:clamp(26px,4vw,36px);font-size:17.5px}

/* faq */
.gp-faq-list{max-width:720px;margin:0 auto;border-top:1px solid var(--line)}
.gp-faq-item{padding:20px 4px;border-bottom:1px solid var(--line)}
.gp-faq-item dt{font-weight:600;color:var(--white);font-size:19px}
.gp-faq-item dd{margin-top:8px;color:var(--muted);font-size:17.5px;line-height:1.65}

/* closing */
.gp-closing{text-align:center}
.gp-closing-row{justify-content:center}
.gp-guarantee{font-family:'Fraunces',Georgia,serif;font-style:italic;font-size:18px;color:var(--white);margin-top:26px}

/* footer */
.gp-foot{display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;
  padding-top:8px;padding-bottom:44px;color:var(--dim);font-size:15px}
.gp-foot-hair{width:34px;height:1px;background:var(--line)}

/* sticky bar */
.gp-sticky{position:fixed;left:0;right:0;bottom:0;z-index:40;display:flex;align-items:center;justify-content:center;gap:16px;
  padding:12px 18px calc(12px + env(safe-area-inset-bottom));
  background:rgba(13,10,20,.93);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
  border-top:1px solid var(--line);box-shadow:0 -10px 34px rgba(124,92,214,.18);
  transform:translateY(110%);transition:transform .35s var(--ease-settle)}
.gp-sticky.is-shown{transform:translateY(0)}
.gp-sticky-price{color:var(--muted);font-size:15.5px;white-space:nowrap}
.gp-sticky-price span{font-family:'Fraunces',Georgia,serif;font-size:1.2em;color:var(--white)}
.gp-cta-sticky{min-height:48px;padding:0 26px;font-size:17px}
@media (prefers-reduced-motion: reduce){.gp-sticky{transition:none}}

/* ── funnel ── */
.gp-funnel .gp-shead{margin-bottom:clamp(30px,4.4vw,44px)}
.gp-funnel .gp-h2{font-size:clamp(1.85rem,4vw,2.6rem);line-height:1.12}
.gp-tier-zone{max-width:920px;margin:0 auto}
.gp-funnel-col{max-width:560px;margin:0 auto}

/* the two funnel questions: count first, then occasion per gift */
.gp-ask{text-align:center;font-family:'Fraunces',Georgia,serif;font-weight:500;
  font-size:clamp(1.15rem,2.6vw,1.3rem);color:var(--white);margin-bottom:14px}
.gp-count-strip{max-width:560px;margin:0 auto clamp(26px,4vw,36px)}
.gp-count-row{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;
  max-width:430px;margin:0 auto}
.gp-count-chip{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;
  min-height:62px;padding:9px 4px;border-radius:14px;cursor:pointer;
  border:1px solid rgba(154,126,230,.28);
  background:linear-gradient(180deg,rgba(124,92,214,.08),rgba(124,92,214,.02)),#141020;
  transition:transform .18s var(--ease-stage),border-color .18s ease,background-color .18s ease,box-shadow .18s ease;
  -webkit-tap-highlight-color:transparent}
@media (hover:hover){
  .gp-count-chip:hover{transform:translateY(-1px);border-color:var(--line-bright)}
}
.gp-count-chip:active{transform:scale(.96);transition-duration:.06s}
.gp-count-n{font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:1.35rem;line-height:1;
  color:var(--body);font-variant-numeric:tabular-nums;transition:color .18s ease}
.gp-count-save{font-size:10.5px;font-weight:600;letter-spacing:.03em;line-height:1;
  color:var(--vio-bright);white-space:nowrap}
.gp-count-chip.is-on{border-color:#9a7ee6;background:rgba(124,92,214,.16);
  box-shadow:0 0 0 1px #9a7ee6,0 10px 24px -12px rgba(124,92,214,.55)}
.gp-count-chip.is-on .gp-count-n{color:var(--white)}
@media (prefers-reduced-motion: reduce){
  .gp-count-chip,.gp-count-chip:hover,.gp-count-chip:active{transform:none}
}

/* occasion picker: quiet segmented chips on one shared rail. The tier
   cards are the stars of the section. 44px touch targets kept. */
.gp-occ-strip{max-width:760px;margin:0 auto clamp(26px,4vw,36px)}
.gp-occ-row{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;
  width:fit-content;margin:0 auto}
.gp-occ-tickbox{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:8px 15px;
  border-radius:12px;cursor:pointer;border:1px solid transparent;
  background:transparent;color:var(--dim);font-size:14px;font-weight:500;
  transition:border-color .18s ease,background-color .18s ease,color .18s ease;
  -webkit-tap-highlight-color:transparent}
@media (hover:hover){
  .gp-occ-tickbox:hover{color:var(--body);background:rgba(124,92,214,.08)}
}
.gp-occ-tickbox:active{transform:scale(.97);transition-duration:.06s}
.gp-occ-sq{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;
  border-radius:5px;border:1.5px solid rgba(154,126,230,.45);flex-shrink:0;
  transition:background-color .15s ease,border-color .15s ease}
.gp-occ-sq svg{width:10px;height:10px;color:#fff}
.gp-occ-tickbox.is-on{border-color:rgba(154,126,230,.55);background:rgba(124,92,214,.15);color:var(--white)}
.gp-occ-tickbox.is-on .gp-occ-sq{background:linear-gradient(180deg,#9a7ee6,#5d47a0);border-color:#9a7ee6}
.gp-occ-tickbox.is-mem.is-on{border-color:rgba(200,196,216,.5);background:rgba(200,196,216,.10)}
.gp-occ-tickbox.is-mem.is-on .gp-occ-sq{background:linear-gradient(180deg,#c9c4dd,#948caa);border-color:#b8b2cc}
@media (max-width:560px){
  .gp-occ-row{display:grid;grid-template-columns:1fr 1fr;width:100%;gap:5px}
  .gp-occ-tickbox{justify-content:flex-start;padding:8px 12px;text-align:left}
}

/* group orders: one labelled occasion row per gift. Label sits ABOVE its
   row so the chip row gets the full 760px rail — all four chips render on
   one line per gift at desktop, matching the single-mode strip. */
.gp-occ-multi{display:flex;flex-direction:column;gap:16px;max-width:760px;margin:0 auto}
.gp-occ-gift{display:flex;flex-direction:column;align-items:center;gap:7px}
.gp-occ-gift-label{font-weight:600;font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;
  color:var(--vio-bright);flex-shrink:0}
.gp-occ-gift .gp-occ-row{margin:0}
@media (max-width:560px){
  .gp-occ-multi{gap:18px}
  .gp-occ-gift{align-items:stretch}
  .gp-occ-gift-label{text-align:left}
}

/* ── tier cards: two-up pricing row, featured Bond physically taller ── */
.gp-tier-row{display:grid;grid-template-columns:1fr;gap:20px;align-items:start;padding-top:16px}
@media (min-width:720px){
  .gp-tier-row{grid-template-columns:1fr 1fr;gap:24px}
  .gp-tier-row .gp-tier.is-feat{margin-top:-14px}
}
@media (max-width:719.98px){
  .gp-tier-row .gp-tier.is-feat{order:-1}
}
.gp-tier-row.is-single{grid-template-columns:1fr;justify-items:center}
.gp-tier-row.is-single .gp-tier{max-width:520px;margin-top:0}
.gp-tier{width:100%;text-align:left;padding:30px 28px 26px;border-radius:18px;cursor:pointer;position:relative;
  border:1px solid rgba(154,126,230,.26);
  background:linear-gradient(180deg,rgba(124,92,214,.09),rgba(124,92,214,.03)),#15101c;
  box-shadow:0 2px 10px rgba(0,0,0,.3);
  transition:transform .18s var(--ease-stage),border-color .18s ease,box-shadow .18s ease}
@media (prefers-reduced-motion: no-preference){
  .gp-tier{animation:gpTierIn .5s var(--ease-settle) backwards}
  .gp-tier-row .gp-tier:nth-child(2){animation-delay:90ms}
}
@keyframes gpTierIn{from{opacity:0;transform:translateY(16px)}}
.gp-tier.is-feat{border:1.5px solid rgba(185,165,240,.5);
  background:radial-gradient(120% 82% at 50% -12%,rgba(167,139,250,.17),transparent 62%),
    linear-gradient(180deg,#1c1530,#151020);
  box-shadow:0 16px 48px rgba(8,5,18,.55),0 0 44px -12px rgba(124,92,214,.35)}
@media (hover:hover){
  .gp-tier:hover{transform:translateY(-3px);border-color:var(--line-bright);
    box-shadow:0 12px 30px rgba(8,5,18,.45)}
  .gp-tier.is-feat:hover{transform:none;border-color:rgba(197,178,255,.62);
    box-shadow:0 22px 58px rgba(8,5,18,.65),0 0 56px -10px rgba(124,92,214,.5)}
  .gp-tier.is-selected:hover{transform:none}
}
.gp-tier.is-selected{border-color:#9a7ee6;
  box-shadow:0 0 0 1px #9a7ee6,0 0 0 5px var(--acc-ring),0 16px 44px rgba(8,5,18,.5)}
.gp-tier-badge{position:absolute;top:-13px;left:50%;transform:translateX(-50%);color:#0d0a14;
  font-size:11px;font-weight:700;padding:6px 16px;border-radius:999px;letter-spacing:.08em;white-space:nowrap;
  box-shadow:0 8px 18px -8px rgba(124,92,214,.6)}
.gp-tier-picked{position:absolute;top:14px;right:14px;width:26px;height:26px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  background:linear-gradient(180deg,#9a7ee6,#5d47a0);color:#fff;
  box-shadow:0 4px 12px -4px rgba(124,92,214,.6);
  opacity:0;transform:scale(.6);transition:opacity .18s var(--ease-stage),transform .18s var(--ease-stage)}
.gp-tier-picked svg{width:13px;height:13px}
.gp-tier-picked.is-on{opacity:1;transform:scale(1)}
.gp-tier-names{padding-right:30px}
.gp-tier-label{font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:1.3rem;color:var(--white);
  margin-bottom:5px;line-height:1.15}
.gp-tier-tag{font-style:italic;font-size:15.5px;color:var(--dim);line-height:1.45}
.gp-tier-price-row{display:flex;align-items:baseline;gap:9px;margin:18px 0 20px;flex-wrap:wrap}
.gp-tier-was{font-size:16px;color:var(--dim);opacity:.75;text-decoration:line-through}
.gp-tier-price{font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:clamp(2.35rem,5.6vw,2.875rem);
  line-height:1;letter-spacing:-.01em;font-variant-numeric:tabular-nums;
  background:linear-gradient(180deg,#ffffff 15%,#cfc0f4 85%);
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.gp-tier-cur{font-size:.58em;font-weight:600}
.gp-tier-once{font-size:14px;color:var(--dim)}
.gp-tier-hair{display:block;height:1px;margin:22px 0;
  background:linear-gradient(90deg,transparent,rgba(154,126,230,.32),transparent)}
.gp-tier-features{display:flex;flex-direction:column;gap:13px}
.gp-tier-feat{display:grid;grid-template-columns:24px 1fr;align-items:start;
  font-size:16px;line-height:1.5;color:var(--body)}
.gp-tier-feat svg{width:16px;height:16px;color:var(--vio-soft);margin-top:4px}
.gp-tier-div{font-style:italic;font-weight:600;font-size:15.5px;color:var(--vio-bright)}
.gp-tier-cta{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;
  min-height:50px;padding:0 18px;border-radius:12px;
  font-weight:600;font-size:16px;letter-spacing:.02em;color:#fff;
  background:linear-gradient(180deg,#9a7ee6 0%,#7c5cd6 45%,#5d47a0 100%);
  box-shadow:0 1px 0 rgba(255,255,255,.35) inset,0 -1px 0 rgba(0,0,0,.25) inset,0 8px 18px -8px rgba(124,92,214,.55);
  transition:filter .18s ease,box-shadow .18s ease,background-color .18s ease,border-color .18s ease,color .18s ease}
.gp-tier:not(.is-feat) .gp-tier-cta{background:rgba(124,92,214,.07);
  border:1px solid rgba(154,126,230,.5);color:var(--vio-pale);box-shadow:none}
@media (hover:hover){
  .gp-tier.is-feat:hover .gp-tier-cta{filter:brightness(1.07);
    box-shadow:0 1px 0 rgba(255,255,255,.35) inset,0 -1px 0 rgba(0,0,0,.25) inset,0 12px 26px -8px rgba(124,92,214,.7)}
  .gp-tier:not(.is-feat):hover .gp-tier-cta{background:rgba(124,92,214,.14);
    border-color:rgba(185,165,240,.7);color:#fff}
}
.gp-tier-cta svg{width:15px;height:15px}
.gp-tier .gp-tier-cta.is-picked{background:rgba(124,92,214,.16);border:1px solid transparent;
  color:var(--vio-bright);box-shadow:none;filter:none}
@media (max-width:560px){
  .gp-tier{padding:26px 20px 24px}
}

/* worry-killers: one quiet chip row under both cards */
.gp-worry-row{list-style:none;display:flex;justify-content:center;flex-wrap:wrap;gap:10px 24px;
  margin:20px 0 0;padding:0;font-size:13.5px;font-weight:500;color:rgba(236,236,242,.7)}
.gp-worry-row li{display:inline-flex;align-items:center;gap:7px}
.gp-worry-row svg{width:14px;height:14px;flex-shrink:0;color:var(--vio-soft)}
.gp-tier-pay{display:flex;justify-content:center;margin-top:16px;opacity:.75}
.gp-paymarks{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap}
.gp-paymarks svg{display:block}
.gp-paychip{display:inline-flex;align-items:center;justify-content:center;
  min-width:58px;height:36px;padding:0 12px;border-radius:9px;
  background:linear-gradient(180deg,#221a35,#181221);
  border:1px solid rgba(154,126,230,.28);
  box-shadow:0 2px 10px rgba(8,5,18,.5),inset 0 1px 0 rgba(207,192,244,.08)}
/* the one voice beside the decision: a compact strip below the chips */

/* ── flow: the checkout panel. Opens as a considered, elevated piece
   of cosmos glass (spotlight surface language), never a bare divider.
   Entrance handled by framer (450ms ease-out, y 24 → 0). ── */
.gp-flow{position:relative;overflow:hidden;margin-top:clamp(36px,6vw,52px);border-radius:24px;
  padding:clamp(24px,4.6vw,38px) clamp(18px,3.8vw,34px) clamp(28px,4.6vw,40px);
  background:
    radial-gradient(130% 90% at 50% -10%, rgba(167,139,250,.22), transparent 62%),
    linear-gradient(180deg,#1c1629,#151020);
  border:1px solid rgba(167,139,250,.38);
  box-shadow:0 1px 0 rgba(207,192,244,.16) inset,0 30px 70px -30px rgba(8,5,18,.95),
    0 0 54px -14px rgba(124,92,214,.36)}
.gp-flow::before{content:"";position:absolute;top:0;left:0;right:0;height:3px;
  background:linear-gradient(90deg,transparent,#b9a5f0 30%,#e3d9ff 50%,#b9a5f0 70%,transparent);opacity:.9}

/* header row: the chosen tier + price, stated with confidence */
.gp-flow-head{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;
  padding-bottom:18px;margin-bottom:22px;
  border-bottom:1px solid rgba(154,126,230,.24)}
.gp-flow-eyebrow{font-weight:600;font-size:13px;letter-spacing:.15em;text-transform:uppercase;color:var(--vio-bright)}
.gp-flow-tier{font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:clamp(1.25rem,3.2vw,1.5rem);
  line-height:1.15;color:var(--white);margin-top:4px}
.gp-flow-head-r{display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex-shrink:0}
.gp-flow-price{font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:clamp(1.25rem,3.2vw,1.5rem);line-height:1.15;
  font-variant-numeric:tabular-nums;
  background:linear-gradient(180deg,#ffffff 15%,#cfc0f4 85%);
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.gp-change{font-size:14px;color:var(--dim);background:none;border:none;cursor:pointer;
  display:inline-flex;align-items:center;min-height:44px;padding:0 2px;margin:-10px 0;
  text-decoration:underline;text-underline-offset:3px;font-family:'Newsreader',Georgia,serif;
  transition:color .18s ease}
.gp-change:hover{color:var(--body)}

/* slim violet progress */
.gp-stepper{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:26px}
.gp-stepper-seg{display:flex;align-items:center;gap:10px}
.gp-stepper-dot{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-size:13px;font-weight:700;font-variant-numeric:tabular-nums;
  background:rgba(124,92,214,.10);border:1px solid rgba(154,126,230,.30);color:var(--dim);
  transition:background-color .3s ease,border-color .3s ease,color .3s ease,box-shadow .3s ease}
.gp-stepper-dot.is-on{background:linear-gradient(180deg,#9a7ee6,#5d47a0);border-color:transparent;color:#fff;
  box-shadow:0 0 14px rgba(167,139,250,.45)}
.gp-stepper-dot svg{width:13px;height:13px}
.gp-stepper-bar{width:44px;height:2px;background:rgba(154,126,230,.18);border-radius:2px;transition:background .3s}
.gp-stepper-bar.is-on{background:var(--vio-soft)}
.gp-step-col{display:flex;flex-direction:column;gap:20px}
.gp-step-intro{text-align:center}
.gp-flow-q{text-align:center;font-family:'Fraunces',Georgia,serif;font-weight:500;
  font-size:clamp(1.35rem,3.4vw,1.55rem);color:var(--white)}
.gp-flow-hint{margin-top:7px;font-size:15.5px;font-style:italic;color:var(--dim)}

/* panel-on-panel: surfaces inside the flow sit one step deeper */
.gp-flow .gp-panel{background:linear-gradient(180deg,#120d1d,#100c18);border:1px solid rgba(154,126,230,.24)}
.gp-two-col{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.gp-choice{position:relative;padding:24px 16px 20px;border-radius:16px;cursor:pointer;text-align:center;
  border:1px solid rgba(154,126,230,.30);
  background:linear-gradient(180deg,rgba(124,92,214,.10),rgba(124,92,214,.03)),#141020;
  transition:transform .2s var(--ease-stage),border-color .2s ease,background-color .2s ease,box-shadow .2s ease}
@media (hover:hover){
  .gp-choice:hover{transform:translateY(-2px);border-color:var(--line-bright);
    box-shadow:0 10px 26px -10px rgba(124,92,214,.4)}
}
.gp-choice:active{transform:scale(.98);transition-duration:.06s}
.gp-choice.is-on{border-color:#9a7ee6;
  background:linear-gradient(180deg,rgba(124,92,214,.18),rgba(124,92,214,.08)),#141020;
  box-shadow:0 0 0 3px rgba(154,126,230,.16),0 12px 30px -12px rgba(124,92,214,.5)}
.gp-choice-picked{position:absolute;top:10px;right:10px;width:22px;height:22px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  background:linear-gradient(180deg,#9a7ee6,#5d47a0);color:#fff;
  box-shadow:0 4px 12px -4px rgba(124,92,214,.6);
  opacity:0;transform:scale(.6);transition:opacity .18s var(--ease-stage),transform .18s var(--ease-stage)}
.gp-choice-picked svg{width:11px;height:11px}
.gp-choice-picked.is-on{opacity:1;transform:scale(1)}
.gp-choice-plaque{display:inline-grid;place-items:center;width:46px;height:46px;margin:0 auto 12px;border-radius:14px;
  background:linear-gradient(165deg,rgba(154,126,230,.24),rgba(124,92,214,.10));
  border:1px solid rgba(185,165,240,.30);box-shadow:0 8px 22px -12px rgba(124,92,214,.5);
  transition:border-color .2s ease,box-shadow .2s ease}
.gp-choice.is-on .gp-choice-plaque{border-color:rgba(197,178,255,.55);
  box-shadow:0 10px 26px -10px rgba(124,92,214,.65)}
.gp-choice-left{text-align:left;padding:18px 16px 16px}
.gp-choice-left .gp-choice-plaque{margin:0 0 10px}
.gp-choice-plaque-sm{width:38px;height:38px;border-radius:11px}
.gp-choice-icon{width:24px;height:24px;color:var(--vio-pale);display:block}
.gp-choice-icon-sm{width:19px;height:19px}
.gp-choice.is-on .gp-choice-icon{color:#fff}
.gp-choice-t{font-weight:700;font-size:16.5px;color:var(--white)}
.gp-choice-s{font-size:14.5px;color:var(--dim);margin-top:3px;line-height:1.4}
.gp-save-chip{position:absolute;top:-9px;right:12px;font-size:11px;font-weight:700;
  background:linear-gradient(180deg,#9a7ee6,#7c5cd6);color:#fff;padding:2px 8px;border-radius:20px;letter-spacing:.04em}
.gp-flex-chip{position:absolute;top:-9px;left:12px;font-size:11.5px;font-weight:700;
  background:linear-gradient(180deg,#9a7ee6,#7c5cd6);color:#fff;padding:2px 9px;border-radius:20px}
.gp-trust-mini{display:flex;justify-content:center;gap:8px 18px;flex-wrap:wrap;
  font-size:14.5px;color:var(--dim);opacity:.85}
.gp-trust-mini span{display:inline-flex;align-items:center;gap:6px}
.gp-trust-mini svg{width:14px;height:14px;color:var(--vio-soft)}
.gp-step-head{display:flex;align-items:center;justify-content:space-between}
.gp-step-head p{font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:1.15rem;color:var(--white)}
.gp-ghost{background:none;border:none;color:var(--dim);cursor:pointer;display:inline-flex;
  align-items:center;gap:5px;font-size:15px;padding:4px}
.gp-ghost:hover{color:var(--body)}
.gp-ghost svg{width:15px;height:15px}

/* fields */
.gp-field{width:100%;padding:13px 16px;border-radius:10px;min-height:48px;
  border:1px solid rgba(139,123,216,.38);background:rgba(11,8,18,.55);
  font-size:17px;color:var(--body);outline:none;
  transition:border-color .2s ease,box-shadow .2s ease}
.gp-field::placeholder{color:var(--dim)}
.gp-field:focus{border-color:#9a7ee6;box-shadow:0 0 0 3px rgba(167,139,250,.22)}

/* the gift message — the emotional moment of step 3 */
.gp-message{padding:20px 18px 14px;border-radius:16px;
  background:radial-gradient(120% 80% at 50% -10%, rgba(167,139,250,.14), transparent 60%),
    linear-gradient(180deg,#161022,#120d1d);
  border:1px solid rgba(167,139,250,.30)}
.gp-message .gp-field-label{margin-bottom:4px}
.gp-message-sub{font-family:'Fraunces',Georgia,serif;font-style:italic;font-weight:400;
  color:var(--vio-pale);font-size:15.5px;margin-bottom:12px}
.gp-message-field{min-height:112px;line-height:1.55}
.gp-message-count{text-align:right;font-size:12.5px;color:var(--dim);margin-top:6px;
  font-variant-numeric:tabular-nums}
.gp-field-sm{padding:10px 14px;min-height:44px;font-size:16px}
.gp-field-col{display:flex;flex-direction:column;gap:10px}
.gp-field-label{font-size:16.5px;font-weight:600;color:var(--white);display:block;margin-bottom:10px}
.gp-field-note{font-weight:400;color:var(--dim)}
.gp-field-sub{font-weight:600;color:var(--body);font-size:15px;margin-bottom:8px}
.gp-help{font-size:14px;color:var(--dim);margin-top:8px}

/* per-recipient occasion pickers */

/* multi recipients */
.gp-recip-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.gp-recip-id{display:flex;align-items:center;gap:8px}
.gp-recip-n{width:24px;height:24px;border-radius:50%;background:linear-gradient(180deg,#9a7ee6,#5d47a0);
  color:#fff;display:flex;align-items:center;justify-content:center;font-size:12.5px;font-weight:700}
.gp-recip-name{font-weight:600;font-size:15.5px;color:var(--white)}
.gp-recip-fields{display:grid;grid-template-columns:1fr;gap:8px}
.gp-recip-fields.has-email{grid-template-columns:1fr 1fr}
.gp-add-row{padding:14px;border-radius:14px;border:2px dashed rgba(154,126,230,.4);
  background:rgba(124,92,214,.08);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;
  color:var(--vio-bright);font-weight:600;font-size:15.5px;
  transition:border-color .2s ease,background-color .2s ease}
@media (hover:hover){
  .gp-add-row:hover{border-color:rgba(185,165,240,.7);background:rgba(124,92,214,.15)}
}
.gp-add-row svg{width:18px;height:18px}
.gp-add-bonus{font-size:13px;color:var(--vio-pale);margin-left:4px}

/* summary */
.gp-summary-head{display:flex;align-items:center;gap:8px;padding-bottom:12px;
  border-bottom:1px solid var(--line);margin-bottom:12px}
.gp-summary-head svg{width:17px;height:17px;color:var(--vio-bright)}
.gp-summary-head p{font-weight:700;color:var(--white);font-size:15.5px}
.gp-summary-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0}
.gp-summary-row.has-hair{border-bottom:1px solid var(--line)}
.gp-summary-item{display:flex;align-items:center;gap:8px}
.gp-summary-item svg{width:15px;height:15px;color:var(--vio-soft);flex-shrink:0}
.gp-summary-tier{font-weight:600;font-size:15.5px;color:var(--white)}
.gp-summary-for{font-size:13.5px;color:var(--vio-bright)}
.gp-summary-price{font-size:15.5px;color:var(--muted)}
.gp-summary-totals{margin-top:12px;padding-top:12px;border-top:1px solid var(--line)}
.gp-summary-disc{display:flex;justify-content:space-between;margin-bottom:6px;font-size:15px;color:var(--vio-pale)}
.gp-summary-disc span{display:flex;align-items:center;gap:4px}
.gp-summary-disc svg{width:12px;height:12px}
.gp-summary-total{display:flex;justify-content:space-between;font-size:1.25rem;font-weight:700;color:var(--white)}
.gp-summary-total-v{font-family:'Fraunces',Georgia,serif}
.gp-summary-note{font-size:13px;color:var(--dim);margin-top:6px;text-align:right}

/* receipt treatment — dashed rules, tabular figures, lifted total */
.gp-receipt{padding:22px 20px}
.gp-receipt .gp-summary-head{border-bottom:1px dashed rgba(154,126,230,.34)}
.gp-receipt .gp-summary-price{font-variant-numeric:tabular-nums}
.gp-receipt .gp-summary-totals{border-top:1px dashed rgba(154,126,230,.34)}
.gp-receipt .gp-summary-total{align-items:baseline}
.gp-receipt .gp-summary-total-v{font-size:1.45rem;font-variant-numeric:tabular-nums;
  background:linear-gradient(180deg,#ffffff 15%,#cfc0f4 85%);
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}

/* promo */
.gp-promo-row{display:flex;gap:8px}
.gp-apply{padding:0 20px;border-radius:10px;min-height:48px;border:none;cursor:pointer;
  background:linear-gradient(180deg,#9a7ee6,#5d47a0);color:#fff;font-weight:600;font-size:15px;white-space:nowrap}
.gp-apply:disabled{opacity:.5;cursor:default}
@media (hover:hover){.gp-apply:not(:disabled):hover{filter:brightness(1.1)}}
.gp-apply:not(:disabled):active{transform:scale(.97)}
.gp-promo-err{color:var(--body);font-size:14px;margin-top:6px;padding-left:10px;border-left:2px solid var(--vio-soft)}
.gp-promo-chip{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;
  border-radius:10px;background:rgba(124,92,214,.12);border:1px solid rgba(185,165,240,.35)}
.gp-promo-chip span{font-size:15px;color:var(--vio-pale);font-weight:600}
.gp-promo-chip button{background:none;border:none;color:var(--vio-pale);cursor:pointer;font-size:1.1rem;line-height:1}

/* ── the pay moment: guarantee + quiet trust footer + real payment
   marks, mirroring the approved DossierCheckout treatment ── */
.gp-cta-pay{min-height:62px}
.gp-pay-guarantee{font-family:'Fraunces',Georgia,serif;font-style:italic;font-size:17.5px;line-height:1.5;
  color:var(--white);text-align:center;margin:2px 6px 0}
.gp-pay-quiet{display:flex;flex-direction:column;gap:14px;opacity:.8;margin-top:2px}
.gp-pay-trust-line{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;
  font-size:15px;color:var(--dim);text-align:center}
.gp-pay-trust-line span{white-space:nowrap}
.gp-pay-trust-line span + span::before{content:"\\00B7";margin-right:8px;color:rgba(139,123,216,.5)}

@media (max-width:520px){
  .gp-two-col{grid-template-columns:1fr}
  .gp-recip-fields.has-email{grid-template-columns:1fr}
  .gp-sticky-price{display:none}
  .gp-cta-sticky{width:100%;max-width:420px}
  .gp-flow{border-radius:18px}
  .gp-stepper-bar{width:26px}
  .gp-flow-head{align-items:flex-start}
  .gp-cta-pay{font-size:17px}
}
`;
