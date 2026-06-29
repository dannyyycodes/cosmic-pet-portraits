import type { ComponentType, CSSProperties, MouseEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";

/**
 * /start — the fork / splash page.
 *
 * Every social bio + the "comment SOUL" funnel points here. One warm question,
 * two small premium option pills: a free birth-sky soul reading, or a framed
 * pawtrait. Each pill carries a real thumbnail (a glowing birth-sky cosmos for
 * the reading, the Ollie canvas pawtrait for the portrait) so the choice is
 * shown, not just labelled.
 *
 * AESTHETIC: matches the /pawtraits page char-for-char (tokens.ts) — white /
 * warm-cream led, ROSE accent, gold detail used sparingly, Asap headings +
 * Assistant body + one Cormorant-italic rose accent phrase.
 *
 * ATTRIBUTION: the incoming query string (?utm_source=...&utm_medium=...) is
 * forwarded onto BOTH pills so conversion tracking survives the fork. The
 * <a href> carries it (graceful no-JS path) and navigate() carries it too.
 *
 * MOTION: a single orchestrated CSS load-reveal, plus a gentle lift/glow on
 * pill hover. No WebGL, no shader background, no warp transition (a richer
 * intro animation is being chosen separately). prefers-reduced-motion strips
 * every animation and keeps the page fully static.
 */

const C = {
  white: "#ffffff",
  cream: "#fffdfb",
  cream2: "#fafafa",
  sand: "#ededed",
  sandDeep: "#e0d8cf",
  ink: "#1c1c1c",
  earth: "#3a3a3a",
  earthMuted: "#7a7a7a",
  rose: "#bf524a",
  roseDeep: "#9c3d36",
  roseSoft: "#fbeae8",
  gold: "#c4a265",
  goldSoft: "#d4b67a",
};

type PillIcon = ComponentType<{ size?: number | string; strokeWidth?: number | string }>;

/**
 * Bespoke ORNATE picture-frame icon for the portrait pill.
 *
 * An arched-top classic gallery frame (the silhouette of a hung wall portrait),
 * NOT a plain square: a nested outer + inner arched moulding reads as
 * carved/ornate framing, a third gilt-GOLD arch is the visible mat lip, and a
 * small bust (head + shoulders) sits inside so it is unmistakably a *portrait*.
 * The arched crown is what separates it from a box.
 *
 * Everything is `currentColor` (rose by default) except the mat, locked to
 * brand gold #c4a265 for the gilt-frame two-tone. Same 24x24 viewBox + stroke
 * conventions as Lucide so size + strokeWidth stay consistent with the page.
 */
function PortraitFrame({ size = 24, strokeWidth = 1.6 }: { size?: number | string; strokeWidth?: number | string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* arched classic moulding — outer + inner line make it ornate, not a box */}
      <path d="M5.2 9.5a6.8 6.8 0 0 1 13.6 0v9.3a1.2 1.2 0 0 1-1.2 1.2H6.4a1.2 1.2 0 0 1-1.2-1.2Z" />
      <path d="M6.9 9.6a5.1 5.1 0 0 1 10.2 0v8a.6.6 0 0 1-.6.6H7.5a.6.6 0 0 1-.6-.6Z" />
      {/* gilt mat / inner border — the gold lip of the frame */}
      <path d="M8.5 9.7a3.5 3.5 0 0 1 7 0v6.3a.5.5 0 0 1-.5.5H9a.5.5 0 0 1-.5-.5Z" stroke={C.gold} />
      {/* the matted subject: a framed bust portrait */}
      <circle cx="12" cy="10.4" r="1.5" />
      <path d="M9.4 16c.3-2.3 4.9-2.3 5.2 0" />
    </svg>
  );
}

const PILLS: ReadonlyArray<{
  key: "reading" | "portrait";
  href: string;
  Icon: PillIcon;
  img: string;
  imgPos: string;
  title: string;
  free: boolean;
}> = [
  {
    key: "reading",
    href: "/",
    Icon: Heart,
    img: "/reading/cosmos.webp",
    imgPos: "72% 56%",
    title: "Their Soul Reading",
    free: true,
  },
  {
    key: "portrait",
    href: "/pawtraits",
    Icon: PortraitFrame,
    img: "/start/ollie.webp",
    imgPos: "50% 40%",
    title: "Their Portrait",
    free: false,
  },
];

const delay = (v: string) => ({ ["--d" as string]: v } as CSSProperties);

export default function Start() {
  const { search } = useLocation();
  const navigate = useNavigate();

  // Plain client-side hop. UTM survives both paths: the <a href> carries the
  // query for no-JS / new-tab, and navigate() carries it for the SPA click.
  const choose = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    navigate({ pathname: href, search });
  };

  return (
    <div className="ps-page">
      <StartStyles />

      <section className="ps-inner">
        <p className="ps-brand ps-reveal" style={delay("0s")}>
          Little Souls
        </p>

        <h1 className="ps-title ps-reveal" style={delay("0.07s")}>
          What are you
          <span className="ps-title-accent">looking for?</span>
        </h1>

        <p className="ps-sub ps-reveal" style={delay("0.14s")}>
          Two ways to hold them closer.
        </p>

        <nav className="ps-pills" aria-label="Choose a path">
          {PILLS.map((pill, i) => (
            <a
              key={pill.key}
              href={`${pill.href}${search}`}
              onClick={(e) => choose(e, pill.href)}
              className="ps-pill ps-reveal"
              style={delay(`${0.22 + i * 0.07}s`)}
            >
              <span className="ps-thumb">
                <img
                  className="ps-thumb-img"
                  src={pill.img}
                  alt=""
                  loading="eager"
                  decoding="async"
                  style={{ objectPosition: pill.imgPos }}
                />
                {pill.free && <span className="ps-free">Free</span>}
              </span>
              <span className="ps-pico" aria-hidden="true">
                <pill.Icon size={16} strokeWidth={1.7} />
              </span>
              <span className="ps-label">{pill.title}</span>
            </a>
          ))}
        </nav>
      </section>
    </div>
  );
}

function StartStyles() {
  return (
    <style>{`
      .ps-page {
        position: relative;
        min-height: 100svh;
        min-height: 100dvh;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 28px 22px calc(40px + env(safe-area-inset-bottom, 0px));
        background:
          radial-gradient(64% 50% at 50% 116%, rgba(191,82,74,0.11), transparent 72%),
          radial-gradient(52% 40% at 50% -8%, rgba(196,162,101,0.07), transparent 72%),
          linear-gradient(180deg, ${C.cream} 0%, ${C.white} 46%, ${C.roseSoft} 168%);
        color: ${C.ink};
        isolation: isolate;
      }

      /* Whisper of film grain for premium texture — fully static */
      .ps-page::before {
        content: "";
        position: fixed; inset: 0; z-index: 0; pointer-events: none;
        opacity: 0.05;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      }

      .ps-inner {
        position: relative; z-index: 1;
        width: 100%; max-width: 460px; text-align: center;
      }

      /* Brand wordmark — rose, like the pawtraits nav lockup (no glyph) */
      .ps-brand {
        display: inline-block;
        margin: 0; color: ${C.rose};
        font-family: Assistant, system-ui, sans-serif;
        font-size: 13px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase;
      }

      /* Headline — Asap ink + one Cormorant-italic rose line (pawtraits signature) */
      .ps-title {
        margin: 18px 0 0; color: ${C.ink};
        font-family: Asap, system-ui, sans-serif;
        font-weight: 700; font-size: clamp(2.6rem, 9.2vw, 4.4rem);
        line-height: 1.02; letter-spacing: -0.022em; text-wrap: balance;
      }
      .ps-title-accent {
        display: block; margin-top: 2px;
        font-family: "Cormorant", "Cormorant Garamond", Georgia, serif;
        font-style: italic; font-weight: 600;
        color: ${C.rose};
        font-size: clamp(2.7rem, 9.6vw, 4.7rem);
        line-height: 1.0; letter-spacing: -0.005em;
      }

      .ps-sub {
        margin: 16px 0 0; color: ${C.earth};
        font-family: Assistant, system-ui, sans-serif;
        font-size: clamp(1rem, 3.4vw, 1.18rem); font-weight: 400; line-height: 1.5;
      }

      /* Two small option pills, side by side, centered */
      .ps-pills {
        display: flex; justify-content: center; align-items: stretch;
        gap: 16px; margin-top: clamp(28px, 6vw, 40px);
      }

      .ps-pill {
        position: relative;
        flex: 1 1 0; min-width: 0; max-width: 188px;
        display: flex; flex-direction: column; align-items: center;
        gap: 11px; padding: 12px 12px 16px;
        border-radius: 22px;
        border: 1px solid ${C.sand};
        background: linear-gradient(180deg, #ffffff 0%, ${C.cream2} 100%);
        text-decoration: none;
        box-shadow: 0 12px 30px rgba(28,28,28,0.06);
        transition: transform 260ms cubic-bezier(0.22,1,0.36,1),
                    border-color 220ms ease, box-shadow 260ms ease;
      }
      .ps-pill:hover, .ps-pill:focus-visible {
        transform: translateY(-5px);
        border-color: ${C.rose};
        box-shadow: 0 22px 46px rgba(191,82,74,0.18);
        outline: none;
      }
      .ps-pill:focus-visible {
        box-shadow: 0 0 0 3px rgba(191,82,74,0.34), 0 22px 46px rgba(191,82,74,0.18);
      }

      /* Thumbnail — neat rounded square, real image inside */
      .ps-thumb {
        position: relative;
        width: 100%; aspect-ratio: 1 / 1;
        border-radius: 15px; overflow: hidden;
        background: ${C.roseSoft};
        box-shadow: inset 0 0 0 1px rgba(28,28,28,0.05);
      }
      .ps-thumb-img {
        width: 100%; height: 100%; object-fit: cover; display: block;
        transition: transform 420ms cubic-bezier(0.22,1,0.36,1);
      }
      .ps-pill:hover .ps-thumb-img, .ps-pill:focus-visible .ps-thumb-img {
        transform: scale(1.045);
      }

      /* Gilt "Free" tag — gold gift signal on the reading thumbnail */
      .ps-free {
        position: absolute; top: 8px; right: 8px;
        padding: 3px 9px; border-radius: 999px;
        font-family: Assistant, system-ui, sans-serif;
        font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
        color: #3a2a12;
        background: linear-gradient(180deg, ${C.goldSoft} 0%, ${C.gold} 100%);
        border: 1px solid rgba(146,118,58,0.45);
        box-shadow: 0 4px 12px rgba(146,118,58,0.32);
      }

      /* Tiny rose accent icon above each label (no box) */
      .ps-pico {
        display: grid; place-items: center;
        color: ${C.rose};
        transition: color 220ms ease, transform 260ms cubic-bezier(0.22,1,0.36,1);
      }
      .ps-pill:hover .ps-pico, .ps-pill:focus-visible .ps-pico {
        color: ${C.roseDeep}; transform: translateY(-1px);
      }

      .ps-label {
        color: ${C.ink};
        font-family: Asap, system-ui, sans-serif;
        font-size: 1.04rem; font-weight: 700; line-height: 1.18; letter-spacing: -0.01em;
        text-align: center; text-wrap: balance;
      }

      /* One orchestrated entrance reveal */
      @keyframes ps-rise {
        from { opacity: 0; transform: translate3d(0, 14px, 0); }
        to { opacity: 1; transform: none; }
      }
      .ps-reveal {
        opacity: 0;
        animation: ps-rise 600ms cubic-bezier(0.22,1,0.36,1) forwards;
        animation-delay: var(--d, 0s);
      }

      @media (prefers-reduced-motion: reduce) {
        .ps-reveal, .ps-pill, .ps-thumb-img, .ps-pico {
          animation: none !important;
          transition: none !important;
        }
        .ps-reveal { opacity: 1; }
      }
    `}</style>
  );
}
