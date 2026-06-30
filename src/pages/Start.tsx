import { useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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
 * MOTION: a single orchestrated CSS load-reveal for the content, plus two
 * hand-off loaders that play just before we navigate. The PORTRAIT pill keeps
 * the small rose walking-dog Lottie (recoloured to brand rose), which also runs
 * once on first paint. The SOUL READING pill plays a realistic moon-phases
 * loader: a real public-domain Moon photo (NASA/GSFC/Arizona State University
 * LRO nearside mosaic) set in a violet cosmic night, with a soft terminator
 * shadow sweeping across the cratered disk so it reads as the real Moon moving
 * through its phases. The moon loader is pure CSS/SVG with a vendored image, no
 * script. The Lottie player is self-hosted (vendored) so it passes the site CSP
 * and never touches first paint. No WebGL, no shader background.
 * prefers-reduced-motion strips every animation: no dog, no phase sweep, instant
 * navigate, fully static page.
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

/** Vendored rose-recoloured Walking Dog Lottie (every fill + stroke -> #bf524a). */
const DOG_SRC = "/start/walking-dog-rose.json";

/** Vendored real Moon photo for the Soul Reading tap loader. Public domain:
 *  NASA/GSFC/Arizona State University LRO nearside mosaic (PD-USGov-NASA, free
 *  for commercial use), cropped to the lunar disk and optimised. The phase sweep
 *  is done in pure CSS over this same-origin image (no script, passes the CSP). */
const MOON_SRC = "/start/moon-phase.webp";

type LottiePlayer = {
  loadAnimation: (cfg: Record<string, unknown>) => { destroy: () => void };
};

/** Self-hosted lottie-web light (SVG) build, vendored so it loads from our own
 * origin. The site CSP only allows scripts from 'self', so a same-origin file is
 * the reliable path (a CDN import is blocked). */
const DOG_PLAYER_SRC = "/start/lottie_light.min.js";

/**
 * Lazy-load the lottie-web SVG player ONCE, by injecting the vendored script the
 * first time the loader is needed. The light SVG renderer is pure JS (no WASM)
 * and stays out of the app bundle, so first paint / LCP is never charged for it.
 * Returns a cached promise; failure resolves null so the loader degrades to a
 * clean cream fade and navigation is never blocked.
 */
let playerPromise: Promise<LottiePlayer | null> | null = null;
function ensurePlayer(): Promise<LottiePlayer | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!playerPromise) {
    playerPromise = new Promise<LottiePlayer | null>((resolve) => {
      const w = window as unknown as { lottie?: LottiePlayer };
      if (w.lottie) return resolve(w.lottie);
      const s = document.createElement("script");
      s.src = DOG_PLAYER_SRC;
      s.async = true;
      s.onload = () => resolve(w.lottie ?? null);
      s.onerror = () => resolve(null);
      document.head.appendChild(s);
    });
  }
  return playerPromise;
}

/** Fetch + cache the rose Lottie JSON ONCE so every loader instance draws from a
 * ready object (no per-mount network fetch), making the dog appear instantly. */
let dogDataPromise: Promise<unknown | null> | null = null;
function ensureDogData(): Promise<unknown | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!dogDataPromise) {
    dogDataPromise = fetch(DOG_SRC).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  }
  return dogDataPromise;
}

// Warm the player + the animation data at module load (unless reduced-motion) so
// the brief loader has the dog ready to draw the instant the overlay appears.
if (
  typeof window !== "undefined" &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches
) {
  void ensurePlayer();
  void ensureDogData();
  // Prime the Moon photo so the reading-tap loader paints instantly.
  const moonImg = new Image();
  moonImg.src = MOON_SRC;
}

/**
 * Renders the rose walking dog as inline SVG via lottie-web, once the player is
 * ready. The animation fetches the recoloured JSON itself and loops the
 * walk-cycle. Destroyed on unmount so no stray timers survive the overlay.
 */
function DogCanvas({ size }: { size: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    let alive = true;
    let anim: { destroy: () => void } | null = null;

    Promise.all([ensurePlayer(), ensureDogData()]).then(([lottie, data]) => {
      if (!alive || !ref.current || !lottie || !data) return;
      anim = lottie.loadAnimation({
        container: ref.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        animationData: data,
        rendererSettings: { preserveAspectRatio: "xMidYMid meet", progressiveLoad: false },
      });
    });

    return () => {
      alive = false;
      if (anim) anim.destroy();
    };
  }, []);

  return (
    <span
      ref={ref}
      className="ps-dog"
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

/** A few faint stars scattered around the moon (percent positions within the
 *  loader field, size in px, twinkle delay in s). Subtle on purpose. */
const STARS: ReadonlyArray<{ x: number; y: number; s: number; d: number }> = [
  { x: 8, y: 20, s: 2, d: 0.0 },
  { x: 22, y: 68, s: 2, d: 0.5 },
  { x: 34, y: 11, s: 3, d: 1.1 },
  { x: 49, y: 84, s: 2, d: 0.8 },
  { x: 63, y: 24, s: 2, d: 1.6 },
  { x: 79, y: 62, s: 3, d: 0.3 },
  { x: 90, y: 38, s: 2, d: 1.3 },
  { x: 14, y: 47, s: 2, d: 2.0 },
  { x: 70, y: 9, s: 2, d: 0.9 },
  { x: 87, y: 80, s: 2, d: 1.8 },
  { x: 41, y: 38, s: 3, d: 2.3 },
  { x: 58, y: 57, s: 2, d: 1.4 },
];

/**
 * Realistic moon-phases loader for the Soul Reading tap. A vendored public-domain
 * Moon photo sits in a violet cosmic night with a soft purple halo and faint
 * stars; a soft terminator shadow sweeps across the cratered disk so it reads as
 * the real Moon moving through its phases. Pure CSS, no script. Decorative.
 */
function MoonLoader() {
  return (
    <div className="ps-loader ps-loader-moon" aria-hidden="true">
      <div className="psm-field">
        {STARS.map((st, i) => (
          <span
            key={i}
            className="psm-star"
            style={{
              left: `${st.x}%`,
              top: `${st.y}%`,
              width: st.s,
              height: st.s,
              animationDelay: `${st.d}s`,
            }}
          />
        ))}
        <span className="psm-halo" aria-hidden="true" />
        <span className="psm-moon">
          <img className="psm-moon-photo" src={MOON_SRC} alt="" decoding="async" />
          <span className="psm-moon-shadow" />
        </span>
      </div>
    </div>
  );
}

/** Honours the OS reduced-motion setting, live. */
function usePrefersReducedMotion(): boolean {
  const read = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [reduce, setReduce] = useState<boolean>(read);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduce(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return reduce;
}

const PILLS: ReadonlyArray<{
  key: "reading" | "portrait";
  href: string;
  img: string;
  imgPos: string;
  title: string;
  free: boolean;
}> = [
  {
    key: "reading",
    href: "/",
    img: "/reading/cosmos.webp",
    imgPos: "72% 56%",
    title: "Their Soul Reading",
    free: true,
  },
  {
    key: "portrait",
    href: "/pawtraits",
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
  const reduce = usePrefersReducedMotion();

  // Brief rose-dog splash on first paint (overlays the already-painted page,
  // then fades out). Skipped entirely under reduced-motion.
  const [intro, setIntro] = useState<boolean>(() => !reduce);
  // When set, the hand-off loader is up and we navigate to this href next. The
  // kind picks the loader: the reading tap plays the moon-phase loader, the
  // portrait tap keeps the rose walking dog.
  const [handoff, setHandoff] = useState<{
    href: string;
    kind: "reading" | "portrait";
  } | null>(null);

  // Lift the intro splash after one short walk beat. Guaranteed by a timer, so
  // a slow or failed CDN never traps the page behind the overlay.
  useEffect(() => {
    if (!intro) return;
    const t = window.setTimeout(() => setIntro(false), 1400);
    return () => window.clearTimeout(t);
  }, [intro]);

  // Hand-off: let the loader play one beat, then navigate (UTM preserved). The
  // moon phase sweep gets a touch longer so the phases are appreciable; the dog
  // finishes one walk cycle. The timer owns navigation, never waits on a player.
  useEffect(() => {
    if (!handoff) return;
    const ms = handoff.kind === "reading" ? 1700 : 1100;
    const t = window.setTimeout(
      () => navigate({ pathname: handoff.href, search }),
      ms,
    );
    return () => window.clearTimeout(t);
  }, [handoff, navigate, search]);

  // Plain client-side hop. UTM survives both paths: the <a href> carries the
  // query for no-JS / new-tab / modified clicks, and navigate() carries it for
  // the SPA click. With motion, we show the dog loader first, then navigate.
  const choose = (
    e: MouseEvent<HTMLAnchorElement>,
    href: string,
    kind: "reading" | "portrait",
  ) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (reduce) {
      navigate({ pathname: href, search });
      return;
    }
    if (!handoff) setHandoff({ href, kind });
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
              onClick={(e) => choose(e, pill.href, pill.key)}
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
              <span className="ps-label">{pill.title}</span>
            </a>
          ))}
        </nav>
      </section>

      {/* First-paint rose walking-dog splash. */}
      {!reduce && intro && (
        <div className="ps-loader ps-loader-intro" aria-hidden="true">
          <DogCanvas size={132} />
        </div>
      )}

      {/* Pill-tap hand-off loader: realistic moon phases for the reading,
          the rose walking dog for the portrait. */}
      {!reduce && handoff?.kind === "reading" && <MoonLoader />}
      {!reduce && handoff?.kind === "portrait" && (
        <div className="ps-loader ps-loader-handoff" aria-hidden="true">
          <DogCanvas size={132} />
        </div>
      )}
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

      /* Rose walking-dog loader overlay — cream wash matching the page, the
         recoloured Lottie centered. Intro fades out; hand-off fades in. */
      .ps-loader {
        position: fixed; inset: 0; z-index: 40;
        display: grid; place-items: center;
        background:
          radial-gradient(64% 50% at 50% 116%, rgba(191,82,74,0.11), transparent 72%),
          radial-gradient(52% 40% at 50% -8%, rgba(196,162,101,0.07), transparent 72%),
          linear-gradient(180deg, ${C.cream} 0%, ${C.white} 46%, ${C.roseSoft} 168%);
      }
      .ps-loader-intro {
        pointer-events: none;
        animation: ps-loader-out 1350ms ease forwards;
      }
      .ps-loader-handoff {
        pointer-events: auto;
        animation: ps-loader-in 240ms ease-out forwards;
      }
      @keyframes ps-loader-out {
        0%, 74% { opacity: 1; }
        100% { opacity: 0; }
      }
      @keyframes ps-loader-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      /* The dog itself — soft entrance, GPU-only props */
      .ps-dog {
        display: block;
        animation: ps-dog-in 460ms cubic-bezier(0.22,1,0.36,1) both;
      }
      @keyframes ps-dog-in {
        from { opacity: 0; transform: translate3d(0, 6px, 0) scale(0.94); }
        to { opacity: 1; transform: none; }
      }

      /* ── Soul Reading tap loader: realistic moon phases in a violet night ── */
      .ps-loader-moon {
        --d: clamp(132px, 42vw, 168px);
        background:
          radial-gradient(52% 38% at 50% 40%, rgba(124,92,214,0.32), transparent 70%),
          radial-gradient(135% 100% at 50% 30%, #5e467a 0%, #44315c 44%, #2c2142 76%, #1b1430 100%);
        animation: ps-loader-in 260ms ease-out forwards;
      }
      .psm-field {
        position: relative;
        width: min(86vw, 360px); aspect-ratio: 1 / 1;
        display: grid; place-items: center;
      }
      /* a few faint stars */
      .psm-star {
        position: absolute; display: block; border-radius: 50%;
        background: #efeafc; opacity: 0.18;
        box-shadow: 0 0 4px 1px rgba(224,214,250,0.7);
        transform: translate(-50%, -50%);
        animation: psm-twinkle 4s ease-in-out infinite;
      }
      @keyframes psm-twinkle { 0%, 100% { opacity: 0.16; } 50% { opacity: 0.85; } }

      /* soft purple cosmic glow behind the moon */
      .psm-halo {
        position: absolute; z-index: 1; display: block;
        width: calc(var(--d) * 1.92); height: calc(var(--d) * 1.92);
        border-radius: 50%;
        background: radial-gradient(circle,
          rgba(160,132,236,0.42) 0%,
          rgba(124,92,214,0.24) 32%,
          rgba(94,70,122,0.10) 52%,
          rgba(60,44,84,0.0) 70%);
        animation: psm-breathe 5.6s ease-in-out infinite;
      }
      @keyframes psm-breathe {
        0%, 100% { transform: scale(1); opacity: 0.85; }
        50% { transform: scale(1.07); opacity: 1; }
      }

      /* the real cratered moon disk, silver-grey */
      .psm-moon {
        position: relative; z-index: 2; display: block;
        width: var(--d); height: var(--d);
        border-radius: 50%; overflow: hidden; isolation: isolate;
        box-shadow: 0 0 0 1px rgba(216,208,232,0.10), 0 14px 46px rgba(10,7,22,0.6);
      }
      .psm-moon-photo {
        position: absolute; inset: 0; width: 100%; height: 100%;
        object-fit: cover; display: block;
        filter: brightness(1.05) contrast(1.04);
      }
      /* limb darkening so the disk reads as a sphere */
      .psm-moon::after {
        content: ""; position: absolute; inset: 0; border-radius: 50%;
        z-index: 3; pointer-events: none;
        box-shadow: inset 0 0 20px 6px rgba(7,5,15,0.5);
      }
      /* soft terminator shadow sweeping across the disk = the phases */
      .psm-moon-shadow {
        position: absolute; top: 50%; left: 50%; z-index: 2; display: block;
        width: 132%; height: 132%; border-radius: 50%;
        transform: translate(-50%, -50%) translateX(112%);
        background: radial-gradient(circle at 50% 50%,
          rgba(11,8,20,0.96) 0%,
          rgba(12,9,22,0.95) 42%,
          rgba(16,12,28,0.82) 53%,
          rgba(20,15,34,0.40) 63%,
          rgba(24,18,40,0.0) 73%);
        will-change: transform;
        animation: psm-sweep 6.2s cubic-bezier(0.42, 0, 0.58, 1) infinite;
      }
      @keyframes psm-sweep {
        0% { transform: translate(-50%, -50%) translateX(112%); }
        50% { transform: translate(-50%, -50%) translateX(-112%); }
        100% { transform: translate(-50%, -50%) translateX(112%); }
      }

      @media (prefers-reduced-motion: reduce) {
        .ps-reveal, .ps-pill, .ps-thumb-img,
        .ps-loader, .ps-loader-intro, .ps-loader-handoff, .ps-dog,
        .ps-loader-moon, .psm-halo, .psm-star, .psm-moon-shadow {
          animation: none !important;
          transition: none !important;
        }
        .ps-reveal { opacity: 1; }
        /* degrade to a single static full moon if ever shown */
        .psm-moon-shadow { display: none; }
        .psm-halo { opacity: 0.9; }
      }
    `}</style>
  );
}
