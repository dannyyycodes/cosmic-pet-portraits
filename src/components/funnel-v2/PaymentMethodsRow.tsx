/* ──────── Payment method badges — ONE shared truth (B10, 2026-07-17) ────────
 *
 * Every payment badge row on the funnel renders through this component so the
 * marks can never contradict what the Stripe session actually offers.
 *
 * SERVER TRUTH (verified read-only against the live Stripe account 2026-07-17,
 * acct_1SYmd1EFEZSdxrGt, and supabase/functions/create-checkout/index.ts):
 *
 * - Living-pet carts bundle the free month of weekly horoscopes, which sets
 *   `setup_future_usage: off_session` on the session. Stripe then only allows
 *   methods that support off-session billing, so create-checkout narrows
 *   `payment_method_types` to ["card", "link"]. Klarna, Afterpay, Amazon Pay
 *   and Revolut Pay are NOT offered on those sessions. Apple Pay + Google Pay
 *   still surface through "card" on supported browsers (dashboard has both
 *   enabled; littlesouls.app is a registered Apple Pay domain).
 * - Pure memorial carts carry no horoscope, so the session offers
 *   ["card", "link", "klarna", "afterpay_clearpay", "amazon_pay",
 *   "revolut_pay", ...]. Klarna IS truthful there.
 *
 * So: card networks + wallets always; the Klarna mark only when the cart is
 * purely memorial (`klarna` prop). If create-checkout's method lists change,
 * change them HERE too — the badges must keep mirroring the session.
 *
 * All marks are canonical simple-icons paths (MIT) in official brand colours.
 */

import type { CSSProperties, ReactNode } from "react";

const CHIP_STYLE: CSSProperties = {
  height: 30,
  background: "#fff",
  border: "1px solid var(--cream3, #f3eadb)",
  borderRadius: 5,
};

const BadgeWrap = ({
  children,
  label,
  width = 52,
  bg = "#fff",
}: {
  children: ReactNode;
  label: string;
  width?: number;
  bg?: string;
}) => (
  <div
    aria-label={label}
    role="img"
    className="flex items-center justify-center"
    style={{ ...CHIP_STYLE, width, background: bg, padding: "0 6px" }}
  >
    {children}
  </div>
);

/* Stripe — #635BFF (official purple) */
const StripeLogo = () => (
  <BadgeWrap label="Stripe" width={54}>
    <svg viewBox="0 0 24 24" width="38" height="18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        fill="#635BFF"
        d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"
      />
    </svg>
  </BadgeWrap>
);

/* Apple Pay — simple-icons canonical mark (includes Apple + Pay) */
const ApplePayLogo = () => (
  <BadgeWrap label="Apple Pay" width={62}>
    <svg viewBox="0 0 24 24" width="50" height="22" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        fill="#000"
        d="M2.15 4.318a42.16 42.16 0 0 0-.454.003c-.15.005-.303.013-.452.04a1.44 1.44 0 0 0-1.06.772c-.07.138-.114.278-.14.43-.028.148-.037.3-.04.45A10.2 10.2 0 0 0 0 6.222v11.557c0 .07.002.138.003.207.004.15.013.303.04.452.027.15.072.291.142.429a1.436 1.436 0 0 0 .63.63c.138.07.278.115.43.142.148.027.3.036.45.04l.208.003h20.194l.207-.003c.15-.004.303-.013.452-.04.15-.027.291-.071.428-.141a1.432 1.432 0 0 0 .631-.631c.07-.138.115-.278.141-.43.027-.148.036-.3.04-.45.002-.07.003-.138.003-.208l.001-.246V6.221c0-.07-.002-.138-.004-.207a2.995 2.995 0 0 0-.04-.452 1.446 1.446 0 0 0-1.2-1.201 3.022 3.022 0 0 0-.452-.04 10.448 10.448 0 0 0-.453-.003zm0 .512h19.942c.066 0 .131.002.197.003.115.004.25.01.375.032.109.02.2.05.287.094a.927.927 0 0 1 .407.407.997.997 0 0 1 .094.288c.022.123.028.258.031.374.002.065.003.13.003.197v11.552c0 .065 0 .13-.003.196-.003.115-.009.25-.032.375a.927.927 0 0 1-.5.693 1.002 1.002 0 0 1-.286.094 2.598 2.598 0 0 1-.373.032l-.2.003H1.906c-.066 0-.133-.002-.196-.003a2.61 2.61 0 0 1-.375-.032c-.109-.02-.2-.05-.288-.094a.918.918 0 0 1-.406-.407 1.006 1.006 0 0 1-.094-.288 2.531 2.531 0 0 1-.032-.373 9.588 9.588 0 0 1-.002-.197V6.224c0-.065 0-.131.002-.197.004-.114.01-.248.032-.375.02-.108.05-.199.094-.287a.925.925 0 0 1 .407-.406 1.03 1.03 0 0 1 .287-.094c.125-.022.26-.029.375-.032.065-.002.131-.002.196-.003zm4.71 3.7c-.3.016-.668.199-.88.456-.191.22-.36.58-.316.918.338.03.675-.169.888-.418.205-.258.345-.603.308-.955zm2.207.42v5.493h.852v-1.877h1.18c1.078 0 1.835-.739 1.835-1.812 0-1.07-.742-1.805-1.808-1.805zm.852.719h.982c.739 0 1.161.396 1.161 1.089 0 .692-.422 1.092-1.164 1.092h-.979zm-3.154.3c-.45.01-.83.28-1.05.28-.235 0-.593-.264-.981-.257a1.446 1.446 0 0 0-1.23.747c-.527.908-.139 2.255.374 2.995.249.366.549.769.944.754.373-.014.52-.242.973-.242.454 0 .586.242.98.235.41-.007.667-.366.915-.733.286-.417.403-.82.41-.841-.007-.008-.79-.308-.797-1.209-.008-.754.615-1.113.644-1.135-.352-.52-.9-.578-1.09-.593a1.123 1.123 0 0 0-.092-.002zm8.204.397c-.99 0-1.606.533-1.652 1.256h.777c.072-.358.369-.586.845-.586.502 0 .803.266.803.711v.309l-1.097.064c-.951.054-1.488.484-1.488 1.184 0 .72.548 1.207 1.332 1.207.526 0 1.032-.281 1.264-.727h.019v.659h.788v-2.76c0-.803-.62-1.317-1.591-1.317zm1.94.072l1.446 4.009c0 .003-.073.24-.073.247-.125.41-.33.571-.711.571-.069 0-.206 0-.267-.015v.666c.06.011.267.019.335.019.83 0 1.226-.312 1.568-1.283l1.5-4.214h-.868l-1.012 3.259h-.015l-1.013-3.26zm-1.167 2.189v.316c0 .521-.45.917-1.024.917-.442 0-.731-.228-.731-.579 0-.342.278-.56.769-.593z"
      />
    </svg>
  </BadgeWrap>
);

/* Google Pay — real 4-colour Google "G" (blue / green / yellow / red) + Pay wordmark */
const GooglePayLogo = () => (
  <BadgeWrap label="Google Pay" width={66}>
    <svg viewBox="0 0 112 46" width="56" height="23" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z" />
      <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
      <text x="51" y="33" fontFamily="Arial, Helvetica, sans-serif" fontSize="27" fontWeight="500" fill="#5F6368">Pay</text>
    </svg>
  </BadgeWrap>
);

/* Klarna — pink #FFB3C7 background with canonical K mark.
 * ONLY rendered on pure memorial carts — see the header comment. */
const KlarnaLogo = () => (
  <BadgeWrap label="Klarna" width={54} bg="#FFB3C7">
    <svg viewBox="0 0 24 24" width="38" height="18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        fill="#0F0F0F"
        d="M4.592 2v20H0V2h4.592zm11.46 0c0 4.194-1.583 8.105-4.415 11.068l-.278.283L17.702 22h-5.668l-6.893-9.4 1.779-1.332c2.858-2.14 4.535-5.378 4.637-8.924L11.562 2h4.49zM21.5 17a2.5 2.5 0 110 5 2.5 2.5 0 010-5z"
      />
    </svg>
  </BadgeWrap>
);

/* Visa — canonical wordmark, #1A1F71 */
const VisaLogo = () => (
  <BadgeWrap label="Visa" width={54}>
    <svg viewBox="0 0 24 24" width="40" height="18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        fill="#1A1F71"
        d="M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656l1.02-2.815.588 2.815zm-8.16-4.84l-1.603 7.496H8.34l1.605-7.496z"
      />
    </svg>
  </BadgeWrap>
);

/* Mastercard — classic two-circle brand mark, official red/yellow/orange */
const MastercardLogo = () => (
  <BadgeWrap label="Mastercard" width={50}>
    <svg viewBox="0 0 32 20" width="32" height="20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="12" cy="10" r="7" fill="#EB001B" />
      <circle cx="20" cy="10" r="7" fill="#F79E1B" />
      <path
        d="M16 4.8a7 7 0 010 10.4 7 7 0 010-10.4z"
        fill="#FF5F00"
      />
    </svg>
  </BadgeWrap>
);

/* American Express — official blue field with Amex letterforms */
const AmexLogo = () => (
  <BadgeWrap label="American Express" width={50}>
    <svg viewBox="0 0 48 32" width="36" height="24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="48" height="32" rx="5" fill="#006FCF" />
      <g stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="butt">
        <path d="M5.5 22 9.5 10l4 12M6.9 17.6h5.2" />
        <path d="M17 22V10l4 7 4-7v12" />
        <path d="M34 10h-6v12h6M28 16h5" />
        <path d="m37.5 10 7 12m0-12-7 12" />
      </g>
    </svg>
  </BadgeWrap>
);

/**
 * The one payment badge row. `klarna` may only be true when the cart is
 * purely memorial (no horoscope bundle on the session) — pass the live
 * cart-mix check, never a constant `true`.
 */
export const PaymentMethodsRow = ({ klarna = false }: { klarna?: boolean }) => (
  <div className="flex flex-wrap items-center justify-center gap-2 mt-5" aria-label="Payment methods">
    <StripeLogo />
    <ApplePayLogo />
    <GooglePayLogo />
    {klarna && <KlarnaLogo />}
    <VisaLogo />
    <MastercardLogo />
    <AmexLogo />
  </div>
);
