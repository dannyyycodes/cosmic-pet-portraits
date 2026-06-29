import { Component, lazy, Suspense, useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Moon, Frame } from "lucide-react";

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
 * <a href> carries it (graceful no-JS path) and navigate() carries it too,
 * including through the warp hand-off.
 *
 * MOTION — REAL animation pass (Paper Shaders, GPU, colour-prop driven):
 *  1. Ambient  : MeshGradient living rose/gold light behind the page.
 *  2. Door glow: PulsingBorder rose/gold halo on hover/focus (per door).
 *  3. Hand-off : Warp veil swallows the page on tap, then navigates.
 *  4. Loader   : the reading hand-off carries a gold-shimmer "Reading their
 *                stars" line over the warp.
 * PERF: LCP paint is the plain CSS cream gradient. Every shader canvas
 * lazy-mounts AFTER first paint and is code-split out of the first-paint
 * bundle. prefers-reduced-motion = static cream background + instant navigate
 * (no shaders, no warp).
 *
 * LICENSE: @paper-design/shaders(-react) is PolyForm Shield 1.0.0
 * (https://polyformproject.org/licenses/shield/1.0.0). Permitted: any
 * non-competing use; Little Souls does not compete with Paper. Notice mirrored
 * in /public/THIRD-PARTY-LICENSES.txt.
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
    Icon: Moon,
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

// Paper Shaders — code-split out of the /start first-paint bundle. One module,
// one chunk; the three lazy components share it (loaded once, after first paint).
// Imported via the static-re-export wrapper so Rollup tree-shakes to just these
// three shaders (not all ~30 in the package).
const loadShaders = () => import("@/lib/paper-shaders");
const MeshGradient = lazy(() => loadShaders().then((m) => ({ default: m.MeshGradient })));
const PulsingBorder = lazy(() => loadShaders().then((m) => ({ default: m.PulsingBorder })));
const Warp = lazy(() => loadShaders().then((m) => ({ default: m.Warp })));

/** Shaders are pure enhancement: if WebGL is missing or a canvas throws, the
 *  CSS base layer carries the page. Render nothing on failure. */
class ShaderBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function SafeShader({ children }: { children: ReactNode }) {
  return (
    <ShaderBoundary>
      <Suspense fallback={null}>{children}</Suspense>
    </ShaderBoundary>
  );
}

const delay = (v: string) => ({ ["--d" as string]: v } as CSSProperties);

export default function Start() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const [ambient, setAmbient] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [leavingKey, setLeavingKey] = useState<string | null>(null);
  const pending = useRef<string | null>(null);
  const timer = useRef<number | null>(null);

  const prefersReduced = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Mount the ambient shader ONLY after first paint (LCP = the CSS cream
  // gradient). Double rAF guarantees at least one painted frame first.
  useEffect(() => {
    if (typeof window === "undefined" || prefersReduced()) return;
    let raf1 = 0;
    let raf2 = 0;
    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => setAmbient(true));
    });
    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
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
      navigate({ pathname: to, search }); // UTM preserved through the hand-off
    }
  };

  const choose = (e: MouseEvent<HTMLAnchorElement>, href: string, key: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (prefersReduced()) {
      navigate({ pathname: href, search });
      return;
    }
    if (leavingKey) {
      go();
      return;
    }
    pending.current = href;
    setLeavingKey(key);
    // reading carries a readable line, so hold it a touch longer
    timer.current = window.setTimeout(go, key === "reading" ? 820 : 700);
  };

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    []
  );

  const leaving = leavingKey != null;

  return (
    <div className={`ps-page${leaving ? " is-leaving" : ""}`}>
      <StartStyles />

      {ambient && (
        <SafeShader>
          <MeshGradient
            className="ps-mesh"
            colors={[C.cream, C.roseSoft, C.rose, C.gold]}
            distortion={0.8}
            swirl={0.5}
            speed={0.22}
            maxPixelCount={2_073_600}
            style={{
              position: "fixed",
              inset: 0,
              width: "100%",
              height: "100%",
              zIndex: 0,
              pointerEvents: "none",
            }}
          />
        </SafeShader>
      )}

      <section className="ps-inner">
        <p className="ps-brand ps-reveal" style={delay("0s")}>
          Little Souls
        </p>

        <h1 className="ps-title ps-reveal" style={delay("0.07s")}>
          What are you
          <span className="ps-title-accent">looking for?</span>
        </h1>

        <p className="ps-sub ps-reveal" style={delay("0.15s")}>
          Two ways to hold them closer.
        </p>

        <nav className="ps-doors" aria-label="Choose a path">
          {DOORS.map((door, i) => (
            <a
              key={door.key}
              href={`${door.href}${search}`}
              onClick={(e) => choose(e, door.href, door.key)}
              onPointerEnter={() => {
                if (!prefersReduced()) setHovered(door.key);
              }}
              onPointerLeave={() => setHovered((h) => (h === door.key ? null : h))}
              onFocus={() => {
                if (!prefersReduced()) setHovered(door.key);
              }}
              onBlur={() => setHovered((h) => (h === door.key ? null : h))}
              className="ps-door ps-reveal"
              style={delay(`${0.24 + i * 0.08}s`)}
            >
              {hovered === door.key && (
                <SafeShader>
                  <PulsingBorder
                    className="ps-door-glow"
                    colors={
                      door.key === "reading" ? [C.rose, C.gold] : [C.gold, C.rose]
                    }
                    colorBack="rgba(255,253,251,0)"
                    roundness={0.2}
                    thickness={0.045}
                    softness={1}
                    intensity={0.55}
                    bloom={0.55}
                    spots={4}
                    spotSize={0.35}
                    pulse={0.12}
                    smoke={0}
                    speed={1.1}
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 18,
                      pointerEvents: "none",
                      zIndex: 0,
                    }}
                  />
                </SafeShader>
              )}
              <span className="ps-orb" aria-hidden="true">
                <door.Icon size={22} strokeWidth={1.6} />
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

      {leaving && (
        <div className="ps-warp" aria-hidden="true">
          <SafeShader>
            <Warp
              className="ps-warp-canvas"
              colors={
                leavingKey === "reading"
                  ? [C.rose, C.gold, C.cream]
                  : [C.gold, C.rose, C.cream]
              }
              proportion={0.4}
              softness={0.9}
              swirl={0.8}
              speed={1.1}
              style={{ position: "fixed", inset: 0, width: "100%", height: "100%" }}
            />
          </SafeShader>
          {leavingKey === "reading" && (
            <p className="ps-warp-text">
              <span className="ps-plaque">
                <span className="ps-shine">Reading their stars</span>
              </span>
            </p>
          )}
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
        padding: 28px 22px calc(36px + env(safe-area-inset-bottom, 0px));
        background:
          radial-gradient(62% 48% at 50% 118%, rgba(191,82,74,0.07), transparent 72%),
          radial-gradient(48% 38% at 50% -10%, rgba(196,162,101,0.06), transparent 72%),
          linear-gradient(180deg, ${C.cream} 0%, ${C.white} 44%);
        color: ${C.ink};
        isolation: isolate;
      }

      /* Ambient MeshGradient — fades in over the cream LCP paint, kept subtle */
      .ps-mesh {
        opacity: 0;
        animation: ps-mesh-in 1100ms ease forwards;
      }
      @keyframes ps-mesh-in {
        from { opacity: 0; }
        to { opacity: 0.52; }
      }

      .ps-inner {
        position: relative; z-index: 1;
        width: 100%; max-width: 600px; text-align: center;
        transition: opacity 280ms ease, transform 320ms cubic-bezier(0.22,1,0.36,1);
      }
      .is-leaving .ps-inner { opacity: 0; transform: scale(0.985); }

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

      /* Doors — premium product cards, equal weight */
      .ps-doors {
        display: grid; gap: 14px; margin-top: clamp(30px, 6vw, 44px);
      }
      @media (min-width: 720px) {
        .ps-doors { grid-template-columns: 1fr 1fr; gap: 16px; }
      }

      .ps-door {
        position: relative;
        overflow: hidden;
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

      /* Door content sits above the PulsingBorder canvas */
      .ps-door > .ps-orb,
      .ps-door > .ps-door-body,
      .ps-door > .ps-door-arrow { position: relative; z-index: 1; }

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

      /* Chosen-path warp hand-off */
      .ps-warp {
        position: fixed; inset: 0; z-index: 50;
        opacity: 0;
        animation: ps-warp-in 200ms ease forwards;
        background: linear-gradient(180deg, ${C.roseSoft} 0%, ${C.cream} 100%);
      }
      @keyframes ps-warp-in { from { opacity: 0; } to { opacity: 1; } }
      .ps-warp-text {
        position: absolute; inset: 0; z-index: 2; margin: 0;
        display: grid; place-items: center;
      }
      .ps-plaque {
        padding: 14px 26px; border-radius: 999px;
        background: rgba(255,253,251,0.82);
        -webkit-backdrop-filter: blur(7px); backdrop-filter: blur(7px);
        border: 1px solid rgba(196,162,101,0.32);
        box-shadow: 0 18px 40px rgba(28,28,28,0.10);
      }
      .ps-shine {
        font-family: Assistant, system-ui, sans-serif;
        font-size: 1.06rem; font-weight: 600; letter-spacing: 0.01em;
        color: ${C.earth};
        background: linear-gradient(110deg,
          ${C.earth} 0%, ${C.earth} 40%, ${C.gold} 50%, ${C.earth} 60%, ${C.earth} 100%);
        background-size: 220% 100%;
        background-repeat: no-repeat;
        -webkit-background-clip: text; background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: ps-shimmer 1.7s linear infinite;
      }
      @keyframes ps-shimmer {
        from { background-position: 160% 0; }
        to { background-position: -60% 0; }
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
        .ps-inner, .ps-door, .ps-door-arrow, .ps-orb, .ps-reveal, .ps-mesh, .ps-shine, .ps-warp {
          animation: none !important;
          transition: none !important;
        }
        .ps-reveal { opacity: 1; }
        .ps-mesh { opacity: 0 !important; }
        .ps-shine { -webkit-text-fill-color: ${C.earth}; color: ${C.earth}; }
      }
    `}</style>
  );
}
