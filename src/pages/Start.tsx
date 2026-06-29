import { useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Frame } from "lucide-react";

/**
 * /start — the fork / splash page.
 *
 * Every social bio + the "comment SOUL" funnel points here. One warm question,
 * two equal premium doors: a free birth-sky soul reading, or a framed pawtrait.
 *
 * AESTHETIC: matches the /pawtraits page char-for-char (tokens.ts) — white /
 * warm-cream led, ROSE accent, gold detail used sparingly, Asap headings +
 * Assistant body + one Cormorant-italic rose accent phrase. NOT the old dark
 * cosmos look.
 *
 * ATTRIBUTION: the incoming query string (?utm_source=...&utm_medium=...) is
 * forwarded onto BOTH doors so conversion tracking survives the fork. The
 * <a href> carries it (graceful no-JS path) and navigate() carries it too.
 *
 * MOTION (intentionally restrained this pass — real premium animation assets
 * drop in later): a clean staggered entrance, a very subtle warm parallax on
 * two soft glows, a tasteful door hover, and a simple fade on selection before
 * navigating. prefers-reduced-motion = instant + static.
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

const DOORS = [
  {
    key: "reading" as const,
    href: "/",
    Icon: Sparkles,
    title: "Their Soul Reading",
    sub: "See their birth sky, free.",
  },
  {
    key: "portrait" as const,
    href: "/pawtraits",
    Icon: Frame,
    title: "Their Portrait",
    sub: "Them, framed as the main character.",
  },
];

export default function Start() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement>(null);
  const [leaving, setLeaving] = useState(false);
  const pending = useRef<string | null>(null);
  const timer = useRef<number | null>(null);

  const prefersReduced = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Subtle warm parallax: pointer drives --px / --py on the page (soft glows only).
  useEffect(() => {
    const page = pageRef.current;
    if (!page || typeof window === "undefined") return;
    if (prefersReduced()) return;
    let frame = 0;
    let tx = 0;
    let ty = 0;
    const apply = () => {
      frame = 0;
      page.style.setProperty("--px", tx.toFixed(3));
      page.style.setProperty("--py", ty.toFixed(3));
    };
    const onPointer = (e: PointerEvent) => {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
      if (!frame) frame = window.requestAnimationFrame(apply);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);

  const go = () => {
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    const to = pending.current;
    if (to != null) {
      pending.current = null;
      navigate({ pathname: to, search });
    }
  };

  const choose = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (prefersReduced()) {
      navigate({ pathname: href, search });
      return;
    }
    if (leaving) {
      go();
      return;
    }
    pending.current = href;
    setLeaving(true);
    timer.current = window.setTimeout(go, 300);
  };

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  return (
    <div ref={pageRef} className={`ps-page${leaving ? " is-leaving" : ""}`}>
      <StartStyles />

      <div className="ps-glow ps-glow--rose" aria-hidden="true" />
      <div className="ps-glow ps-glow--gold" aria-hidden="true" />

      <section className="ps-inner">
        <p className="ps-brand ps-reveal" style={{ ["--d" as string]: "0s" } as CSSProperties}>
          <span className="ps-brand-mark" aria-hidden="true">&#10022;</span>
          Little Souls
        </p>

        <h1 className="ps-title ps-reveal" style={{ ["--d" as string]: "0.07s" } as CSSProperties}>
          What are you
          <span className="ps-title-accent">looking for?</span>
        </h1>

        <p className="ps-sub ps-reveal" style={{ ["--d" as string]: "0.15s" } as CSSProperties}>
          Two ways to hold them closer.
        </p>

        <nav className="ps-doors" aria-label="Choose a path">
          {DOORS.map((door, i) => (
            <a
              key={door.key}
              href={`${door.href}${search}`}
              onClick={(e) => choose(e, door.href)}
              className="ps-door ps-reveal"
              style={{ ["--d" as string]: `${0.24 + i * 0.08}s` } as CSSProperties}
            >
              <span className="ps-orb" aria-hidden="true">
                <door.Icon size={22} strokeWidth={1.75} />
              </span>
              <span className="ps-door-body">
                <span className="ps-door-title">{door.title}</span>
                <span className="ps-door-sub">{door.sub}</span>
              </span>
              <ArrowRight className="ps-door-arrow" size={20} aria-hidden="true" />
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
        --px: 0; --py: 0;
        position: relative;
        min-height: 100svh;
        min-height: 100dvh;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 28px 22px calc(36px + env(safe-area-inset-bottom, 0px));
        background:
          radial-gradient(62% 48% at 50% 118%, rgba(191,82,74,0.07), transparent 72%),
          radial-gradient(48% 38% at 50% -10%, rgba(196,162,101,0.06), transparent 72%),
          linear-gradient(180deg, ${C.cream} 0%, ${C.white} 44%);
        color: ${C.ink};
        isolation: isolate;
      }

      /* Soft warm depth glows (subtle parallax) */
      .ps-glow {
        position: absolute; z-index: 0; pointer-events: none;
        border-radius: 50%; filter: blur(8px);
        will-change: transform;
        transition: transform 360ms cubic-bezier(0.22,1,0.36,1);
      }
      .ps-glow--rose {
        width: 60vw; max-width: 520px; aspect-ratio: 1;
        top: -14%; left: -12%;
        background: radial-gradient(circle, rgba(191,82,74,0.10), transparent 64%);
        transform: translate3d(calc(var(--px) * 22px), calc(var(--py) * 22px), 0);
      }
      .ps-glow--gold {
        width: 54vw; max-width: 460px; aspect-ratio: 1;
        bottom: -16%; right: -12%;
        background: radial-gradient(circle, rgba(196,162,101,0.12), transparent 64%);
        transform: translate3d(calc(var(--px) * -16px), calc(var(--py) * -16px), 0);
      }

      .ps-inner {
        position: relative; z-index: 1;
        width: 100%; max-width: 600px; text-align: center;
        transition: opacity 280ms ease, transform 320ms cubic-bezier(0.22,1,0.36,1);
      }
      .is-leaving .ps-inner { opacity: 0; transform: scale(0.985); }

      /* Brand mark — rose, like the pawtraits nav lockup */
      .ps-brand {
        display: inline-flex; align-items: center; gap: 9px;
        margin: 0; color: ${C.rose};
        font-family: Assistant, system-ui, sans-serif;
        font-size: 13px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase;
      }
      .ps-brand-mark { color: ${C.rose}; font-size: 14px; line-height: 1; }

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

      /* Doors — premium product cards, equal weight */
      .ps-doors {
        display: grid; gap: 14px; margin-top: clamp(30px, 6vw, 44px);
      }
      @media (min-width: 720px) {
        .ps-doors { grid-template-columns: 1fr 1fr; gap: 16px; }
      }

      .ps-door {
        position: relative;
        display: flex; align-items: center; gap: 15px;
        min-height: 96px; padding: 18px 18px;
        border-radius: 18px;
        border: 1px solid ${C.sand};
        background: linear-gradient(180deg, #ffffff 0%, ${C.cream2} 100%);
        text-align: left; text-decoration: none;
        box-shadow: 0 14px 34px rgba(28,28,28,0.05);
        transition: border-color 220ms ease, transform 240ms cubic-bezier(0.22,1,0.36,1),
                    box-shadow 240ms ease, background 220ms ease;
      }
      .ps-door:hover, .ps-door:focus-visible {
        transform: translateY(-3px);
        border-color: ${C.rose};
        background: linear-gradient(180deg, #ffffff 0%, ${C.roseSoft} 170%);
        box-shadow: 0 22px 50px rgba(191,82,74,0.16);
        outline: none;
      }
      .ps-door:focus-visible { box-shadow: 0 0 0 3px rgba(191,82,74,0.35), 0 22px 50px rgba(191,82,74,0.16); }

      .ps-orb {
        flex: none; width: 54px; height: 54px; border-radius: 50%;
        display: grid; place-items: center;
        color: ${C.rose};
        background: ${C.roseSoft};
        border: 1px solid rgba(191,82,74,0.16);
        transition: background 220ms ease, color 220ms ease, border-color 220ms ease, box-shadow 220ms ease;
      }
      .ps-door:hover .ps-orb, .ps-door:focus-visible .ps-orb {
        background: ${C.rose}; color: #ffffff; border-color: ${C.rose};
        box-shadow: 0 10px 22px rgba(191,82,74,0.30);
      }

      .ps-door-body { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
      .ps-door-title {
        color: ${C.ink}; font-family: Asap, system-ui, sans-serif;
        font-size: 1.42rem; font-weight: 700; line-height: 1.08; letter-spacing: -0.015em;
      }
      .ps-door-sub {
        color: ${C.earth}; font-family: Assistant, system-ui, sans-serif;
        font-size: 0.92rem; line-height: 1.4;
      }
      .ps-door-arrow {
        flex: none; margin-left: auto; color: ${C.rose};
        transition: transform 240ms cubic-bezier(0.22,1,0.36,1), color 220ms ease;
      }
      .ps-door:hover .ps-door-arrow, .ps-door:focus-visible .ps-door-arrow {
        transform: translateX(5px); color: ${C.roseDeep};
      }

      /* Entrance reveal */
      @keyframes ps-rise {
        from { opacity: 0; transform: translate3d(0, 14px, 0); }
        to { opacity: 1; transform: none; }
      }
      .ps-reveal {
        opacity: 0;
        animation: ps-rise 600ms cubic-bezier(0.22,1,0.36,1) forwards;
        animation-delay: var(--d, 0s);
      }
      .is-leaving .ps-reveal { animation: none; }

      @media (prefers-reduced-motion: reduce) {
        .ps-glow, .ps-inner, .ps-door, .ps-door-arrow, .ps-orb, .ps-reveal {
          animation: none !important;
          transition: none !important;
        }
        .ps-reveal { opacity: 1; }
        .ps-glow { transform: none !important; }
      }
    `}</style>
  );
}
