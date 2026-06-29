import { useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/**
 * /start — the fork / splash page.
 *
 * Every social bio + the "comment SOUL" funnel points here. One warm question,
 * two equal doors: a free birth-sky soul reading, or a cosmic portrait.
 *
 * ATTRIBUTION: the incoming query string (?utm_source=...&utm_medium=...) is
 * forwarded onto BOTH doors so conversion tracking survives the fork. The
 * <a href> carries it (graceful no-JS path) and navigate() carries it too.
 *
 * MOTION: a layered cosmos parallaxes on pointer + device tilt (transform-only,
 * rAF-throttled, overscanned so edges never show). Tapping a door plays a short
 * "chosen path" transition (the cosmos warps toward the door, the door blooms,
 * the other fades, a gold light sweep hands off) then navigates. It is
 * skippable, and prefers-reduced-motion collapses to an instant, static page.
 *
 * Palette + fonts are lifted from the live reading funnel (ReadingsLanding.tsx)
 * so this feels native: cosmos #0d0a14, gold #d4b67a / #f0d99f, violet #7c5cd6,
 * Playfair Display + Cormorant + Lato (all already loaded in index.html).
 */

const DOORS = [
  {
    key: "reading" as const,
    href: "/",
    glyph: "☉", // ☉ sun — "who they are at their core"
    title: "Their Soul Reading",
    sub: "See their birth sky, free.",
  },
  {
    key: "portrait" as const,
    href: "/pawtraits",
    glyph: "✦", // ✦ star
    title: "Their Portrait",
    sub: "Them, painted among the stars.",
  },
];

type DoorKey = (typeof DOORS)[number]["key"];

export default function Start() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement>(null);
  const [leaving, setLeaving] = useState<DoorKey | null>(null);
  const pending = useRef<string | null>(null);
  const timer = useRef<number | null>(null);

  const prefersReduced = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // --- Parallax: pointer + device tilt drive --px / --py on the page. -------
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
    const queue = () => {
      if (!frame) frame = window.requestAnimationFrame(apply);
    };

    const onPointer = (e: PointerEvent) => {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
      queue();
    };
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      tx = Math.max(-0.5, Math.min(0.5, e.gamma / 32));
      ty = Math.max(-0.5, Math.min(0.5, (e.beta - 45) / 32));
      queue();
    };

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("deviceorientation", onTilt, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("deviceorientation", onTilt);
    };
  }, []);

  const go = () => {
    const to = pending.current;
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    if (to != null) {
      pending.current = null;
      navigate({ pathname: to, search });
    }
  };

  const choose = (e: MouseEvent<HTMLAnchorElement>, key: DoorKey, href: string) => {
    // Honour modifier-clicks (open in new tab) and reduced-motion: let the
    // native link / instant navigation win.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (prefersReduced()) {
      navigate({ pathname: href, search });
      return;
    }
    if (leaving) {
      go(); // second tap during the animation = skip to the destination
      return;
    }
    const page = pageRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    if (page) {
      page.style.setProperty("--ox", `${rect.left + rect.width / 2}px`);
      page.style.setProperty("--oy", `${rect.top + rect.height / 2}px`);
    }
    pending.current = href;
    setLeaving(key);
    timer.current = window.setTimeout(go, 760);
  };

  // Skippable: Escape (or Enter) during the transition jumps straight through.
  useEffect(() => {
    if (!leaving) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") go();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaving]);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  return (
    <div
      ref={pageRef}
      className={`start-page${leaving ? " is-leaving" : ""}`}
      data-chosen={leaving ?? undefined}
    >
      <StartStyles />

      <div className="start-cosmos" aria-hidden="true">
        <div className="px-layer px-deep">
          <div className="px-inner start-nebula" />
        </div>
        <div className="px-layer px-mid">
          <div className="px-inner start-stars">
            <svg viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice">
              <g stroke="rgba(212,182,122,0.15)" strokeWidth="1" fill="none">
                <path d="M110 220 188 174 275 238 360 188" />
                <path d="M810 126 902 196 1010 156 1078 245" />
                <path d="M704 662 780 602 856 678 942 624" />
                <path d="M130 720 236 650 304 742" />
              </g>
              {[
                [110, 220, 2], [188, 174, 2.8], [275, 238, 2.2], [360, 188, 2],
                [810, 126, 2.4], [902, 196, 3], [1010, 156, 2], [1078, 245, 2.2],
                [704, 662, 2], [780, 602, 2.6], [856, 678, 2.1], [942, 624, 2.5],
                [510, 118, 1.4], [592, 322, 1.6], [110, 620, 1.5], [1090, 712, 1.4],
                [130, 720, 1.8], [236, 650, 2.2], [304, 742, 1.8],
              ].map(([cx, cy, r], i) => (
                <circle key={i} cx={cx} cy={cy} r={r} fill="rgba(245,239,230,0.72)" />
              ))}
            </svg>
          </div>
        </div>
        <div className="px-layer px-near">
          <span className="dust" style={{ top: "18%", left: "14%", ["--f" as string]: "26s" }} />
          <span className="dust" style={{ top: "30%", left: "82%", ["--f" as string]: "32s" }} />
          <span className="dust dust--lg" style={{ top: "72%", left: "20%", ["--f" as string]: "38s" }} />
          <span className="dust" style={{ top: "64%", left: "70%", ["--f" as string]: "29s" }} />
          <span className="dust dust--lg" style={{ top: "12%", left: "54%", ["--f" as string]: "44s" }} />
        </div>
      </div>

      <section className="start-inner">
        <p className="start-eyebrow start-reveal" style={{ ["--d" as string]: "0s" } as CSSProperties}>
          Little Souls
        </p>

        <h1 className="start-title start-reveal" style={{ ["--d" as string]: "0.08s" } as CSSProperties}>
          What are you looking for?
        </h1>

        <p className="start-sub start-reveal" style={{ ["--d" as string]: "0.16s" } as CSSProperties}>
          Two ways to hold them closer.
        </p>

        <nav className="start-doors" aria-label="Choose a path">
          {DOORS.map((door, i) => (
            <a
              key={door.key}
              href={`${door.href}${search}`}
              onClick={(e) => choose(e, door.key, door.href)}
              className={[
                "start-door start-reveal",
                leaving === door.key ? "is-chosen" : "",
                leaving && leaving !== door.key ? "is-other" : "",
              ].join(" ").trim()}
              style={{ ["--d" as string]: `${0.26 + i * 0.08}s` } as CSSProperties}
            >
              <span className="start-glyph" aria-hidden="true">{door.glyph}</span>
              <span className="start-door-body">
                <span className="start-door-title">{door.title}</span>
                <span className="start-door-sub">{door.sub}</span>
              </span>
              <ArrowRight className="start-door-arrow" size={20} aria-hidden="true" />
            </a>
          ))}
        </nav>
      </section>

      <div className="start-sweep" aria-hidden="true" onClick={go} />
    </div>
  );
}

function StartStyles() {
  return (
    <style>{`
      .start-page {
        --px: 0; --py: 0; --ox: 50%; --oy: 50%;
        position: relative;
        min-height: 100svh;
        min-height: 100dvh;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 28px 20px calc(28px + env(safe-area-inset-bottom, 0px));
        background:
          radial-gradient(ellipse at 50% -8%, rgba(65,47,88,0.55), transparent 46%),
          radial-gradient(ellipse at 88% 16%, rgba(212,182,122,0.10), transparent 26%),
          radial-gradient(ellipse at 8% 80%, rgba(94,70,122,0.18), transparent 34%),
          #0d0a14;
        color: #ffffff;
        isolation: isolate;
      }

      /* ---- Parallax cosmos ---------------------------------------------- */
      .start-cosmos {
        position: absolute; inset: 0; z-index: 0; pointer-events: none;
        transform-origin: var(--ox) var(--oy);
        will-change: transform, opacity;
      }
      .px-layer {
        position: absolute; inset: -8%;
        will-change: transform;
        transform: translate3d(calc(var(--px) * var(--depth) * 1px), calc(var(--py) * var(--depth) * 1px), 0);
        transition: transform 320ms cubic-bezier(0.2, 0.7, 0.2, 1);
      }
      .px-deep { --depth: 7; }
      .px-mid { --depth: 17; }
      .px-near { --depth: 32; }
      .px-inner { position: absolute; inset: 0; }

      .start-nebula {
        background:
          radial-gradient(38% 30% at 24% 22%, rgba(124,92,214,0.22), transparent 70%),
          radial-gradient(30% 26% at 80% 30%, rgba(212,182,122,0.10), transparent 72%),
          radial-gradient(46% 36% at 62% 84%, rgba(94,70,122,0.20), transparent 72%);
        animation: start-breathe 30s ease-in-out infinite;
      }
      .start-stars svg { width: 100%; height: 100%; display: block; opacity: 0.62; }
      .start-stars { animation: start-drift 60s ease-in-out infinite; }

      .dust {
        position: absolute; width: 4px; height: 4px; border-radius: 50%;
        background: radial-gradient(circle, rgba(240,217,159,0.9), rgba(240,217,159,0) 70%);
        box-shadow: 0 0 8px 2px rgba(240,217,159,0.35);
        animation: start-float var(--f, 30s) ease-in-out infinite;
      }
      .dust--lg { width: 7px; height: 7px; }

      /* ---- Centre content ----------------------------------------------- */
      .start-inner {
        position: relative; z-index: 1;
        width: 100%; max-width: 600px; text-align: center;
        transition: opacity 380ms ease, transform 480ms cubic-bezier(0.2,0.7,0.2,1);
      }
      .is-leaving .start-inner { opacity: 0.92; }

      .start-eyebrow {
        margin: 0; color: #d4b67a;
        font-family: Lato, system-ui, sans-serif;
        font-size: 13px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase;
      }
      .start-title {
        margin: 16px 0 0; color: #ffffff;
        font-family: "Playfair Display", Georgia, serif;
        font-size: clamp(2.2rem, 7.4vw, 3.5rem);
        font-weight: 500; line-height: 1.02; letter-spacing: -0.018em; text-wrap: balance;
      }
      .start-sub {
        margin: 14px 0 0; color: #d8c7be;
        font-family: "Cormorant", Georgia, serif; font-style: italic;
        font-size: clamp(1.15rem, 3.4vw, 1.4rem); line-height: 1.4;
      }

      /* ---- Doors -------------------------------------------------------- */
      .start-doors {
        display: grid; gap: 14px; margin-top: clamp(30px, 6vw, 44px);
      }
      @media (min-width: 720px) {
        .start-doors { grid-template-columns: 1fr 1fr; gap: 18px; }
      }

      .start-door {
        position: relative; isolation: isolate;
        display: flex; align-items: center; gap: 16px;
        min-height: 104px; padding: 20px;
        border-radius: 16px;
        border: 1px solid rgba(212,182,122,0.26);
        background: linear-gradient(158deg, rgba(33,23,34,0.62), rgba(21,16,28,0.74));
        text-align: left; text-decoration: none;
        box-shadow: 0 18px 44px rgba(5,4,10,0.4);
        transition: border-color 240ms ease, transform 260ms cubic-bezier(0.2,0.7,0.2,1),
                    background 240ms ease, box-shadow 260ms ease, opacity 380ms ease, filter 380ms ease;
      }
      /* Gold glow bloom on hover/focus */
      .start-door::before {
        content: ""; position: absolute; inset: -1px; border-radius: 16px; z-index: -1;
        background: radial-gradient(130% 150% at 26% -10%, rgba(240,217,159,0.18), transparent 62%);
        opacity: 0; transition: opacity 260ms ease;
      }
      .start-door:hover, .start-door:focus-visible {
        transform: translateY(-3px);
        border-color: rgba(240,217,159,0.62);
        background: linear-gradient(158deg, rgba(43,30,46,0.74), rgba(27,20,38,0.84));
        box-shadow: 0 26px 60px rgba(124,92,214,0.30), 0 18px 44px rgba(5,4,10,0.46);
        outline: none;
      }
      .start-door:hover::before, .start-door:focus-visible::before { opacity: 1; }
      .start-door:focus-visible { box-shadow: 0 0 0 2px #f0d99f, 0 26px 60px rgba(124,92,214,0.30); }

      .start-glyph {
        position: relative; flex: none;
        width: 54px; height: 54px; border-radius: 50%;
        display: grid; place-items: center;
        font-family: "Noto Sans Symbols2", "Segoe UI Symbol", "Apple Symbols", system-ui, sans-serif;
        font-size: 1.55rem; line-height: 1; color: #f0d99f;
        border: 1px solid rgba(212,182,122,0.4);
        background: radial-gradient(circle at 38% 32%, rgba(124,92,214,0.3), rgba(13,10,20,0.4));
        transition: color 240ms ease, border-color 240ms ease, box-shadow 240ms ease;
      }
      .start-glyph::after {
        content: ""; position: absolute; inset: -1px; border-radius: 50%;
        border: 1px solid rgba(240,217,159,0.5);
        opacity: 0; transform: scale(0.8);
      }
      .start-door:hover .start-glyph, .start-door:focus-visible .start-glyph {
        color: #ffffff; border-color: rgba(240,217,159,0.8);
        box-shadow: 0 0 22px rgba(240,217,159,0.4);
      }
      .start-door:hover .start-glyph::after { animation: start-ring 900ms ease-out infinite; }

      .start-door-body { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
      .start-door-title {
        color: #ffffff; font-family: "Playfair Display", Georgia, serif;
        font-size: 1.45rem; font-weight: 500; line-height: 1.06;
      }
      .start-door-sub {
        color: #c8c8d2; font-family: Lato, system-ui, sans-serif;
        font-size: 0.9rem; line-height: 1.4;
      }
      .start-door-arrow {
        flex: none; margin-left: auto; color: #d4b67a;
        transition: transform 240ms cubic-bezier(0.2,0.7,0.2,1), color 240ms ease;
      }
      .start-door:hover .start-door-arrow, .start-door:focus-visible .start-door-arrow {
        transform: translateX(5px); color: #f0d99f;
      }

      /* ---- "Chosen path" transition ------------------------------------- */
      .is-leaving .start-cosmos {
        transform: scale(1.22); opacity: 0.85;
        transition: transform 760ms cubic-bezier(0.5,0,0.2,1), opacity 760ms ease-in;
      }
      .start-door.is-chosen {
        transform: scale(1.06) translateY(-3px);
        border-color: rgba(240,217,159,0.92);
        box-shadow: 0 0 0 1px rgba(240,217,159,0.55), 0 32px 80px rgba(124,92,214,0.55);
        z-index: 2;
      }
      .start-door.is-chosen .start-glyph {
        color: #ffffff; border-color: rgba(240,217,159,0.95);
        box-shadow: 0 0 30px rgba(240,217,159,0.6);
      }
      .start-door.is-other {
        opacity: 0.16; transform: scale(0.95); filter: blur(1px); pointer-events: none;
      }

      .start-sweep {
        position: fixed; inset: 0; z-index: 5; pointer-events: none; opacity: 0;
        transform: scale(0.18); transform-origin: var(--ox) var(--oy);
        background: radial-gradient(circle at var(--ox) var(--oy),
          rgba(240,217,159,0.95), rgba(212,182,122,0.6) 16%, rgba(124,92,214,0.28) 38%, transparent 66%);
      }
      .is-leaving .start-sweep {
        opacity: 1; transform: scale(3.6); pointer-events: auto;
        transition: transform 760ms cubic-bezier(0.5,0,0.2,1), opacity 720ms ease-in;
      }

      /* ---- Entrance reveal ---------------------------------------------- */
      @keyframes start-rise {
        from { opacity: 0; transform: translate3d(0, 16px, 0); }
        to { opacity: 1; transform: none; }
      }
      .start-reveal {
        opacity: 0;
        animation: start-rise 620ms cubic-bezier(0.2,0.7,0.2,1) forwards;
        animation-delay: var(--d, 0s);
      }
      .is-leaving .start-reveal { animation: none; }

      @keyframes start-ring {
        0% { opacity: 0.55; transform: scale(0.85); }
        70% { opacity: 0; transform: scale(1.5); }
        100% { opacity: 0; transform: scale(1.5); }
      }
      @keyframes start-breathe {
        0%, 100% { transform: scale(1); opacity: 0.92; }
        50% { transform: scale(1.06); opacity: 1; }
      }
      @keyframes start-drift {
        0%, 100% { transform: translate3d(0, 0, 0); }
        50% { transform: translate3d(0, -14px, 0); }
      }
      @keyframes start-float {
        0%, 100% { transform: translate3d(0, 0, 0); opacity: 0.85; }
        50% { transform: translate3d(0, -22px, 0); opacity: 1; }
      }

      /* ---- Reduced motion: static, premium, instant --------------------- */
      @media (prefers-reduced-motion: reduce) {
        .px-layer, .start-cosmos, .start-stars, .start-nebula, .dust,
        .start-reveal, .start-door, .start-glyph, .start-door-arrow, .start-inner, .start-sweep {
          animation: none !important;
          transition: none !important;
        }
        .start-reveal { opacity: 1; }
        .px-layer { transform: none !important; }
      }
    `}</style>
  );
}
