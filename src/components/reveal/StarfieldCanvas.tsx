import { useEffect, useRef } from 'react';

interface Star {
  x: number;      // 0..1 normalized
  y: number;      // 0..1 normalized
  r: number;      // radius px
  depth: number;  // 0 (far) .. 1 (near) — parallax + twinkle amount
  tw: number;     // twinkle phase
  tws: number;    // twinkle speed
}

interface Props {
  accent: string;   // active chapter accent hex
  reduced: boolean; // prefers-reduced-motion
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Ambient starfield — Canvas 2D (no WebGL dependency, mobile-light).
 * Three depth layers drift + twinkle; scroll drives parallax; the active
 * chapter accent tints the field and a soft nebula. Reduced-motion => a
 * single static frame, no rAF, no parallax.
 */
export function StarfieldCanvas({ accent, reduced }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const starsRef = useRef<Star[]>([]);
  const accentRef = useRef<[number, number, number]>(hexToRgb(accent));
  const targetRef = useRef<[number, number, number]>(hexToRgb(accent));
  const rafRef = useRef<number>(0);
  const scrollRef = useRef<number>(0);

  // update target tint when the accent changes (lerped in the loop)
  useEffect(() => { targetRef.current = hexToRgb(accent); }, [accent]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0, dpr = 1;

    const build = () => {
      const count = Math.min(150, Math.round((w * h) / 9000));
      const stars: Star[] = [];
      for (let i = 0; i < count; i++) {
        const depth = Math.random();
        stars.push({
          x: Math.random(),
          y: Math.random(),
          r: 0.4 + depth * 1.5,
          depth,
          tw: Math.random() * Math.PI * 2,
          tws: 0.6 + Math.random() * 1.6,
        });
      }
      starsRef.current = stars;
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    };

    const draw = (t: number) => {
      // lerp accent -> target
      const a = accentRef.current, tg = targetRef.current;
      for (let i = 0; i < 3; i++) a[i] += (tg[i] - a[i]) * 0.03;
      const [ar, ag, ab] = a;

      ctx.clearRect(0, 0, w, h);

      // soft nebula glow tied to the accent + scroll
      const scroll = scrollRef.current;
      const ny = h * 0.32 + (reduced ? 0 : Math.sin(scroll * 0.0006) * 40);
      const neb = ctx.createRadialGradient(w * 0.5, ny, 0, w * 0.5, ny, Math.max(w, h) * 0.7);
      neb.addColorStop(0, `rgba(${ar | 0},${ag | 0},${ab | 0},0.10)`);
      neb.addColorStop(0.5, `rgba(${ar | 0},${ag | 0},${ab | 0},0.03)`);
      neb.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = neb;
      ctx.fillRect(0, 0, w, h);

      const time = t * 0.001;
      const stars = starsRef.current;
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        // parallax: nearer stars shift more with scroll
        const par = reduced ? 0 : (scroll * (0.02 + s.depth * 0.06));
        let py = (s.y * h - par) % h;
        if (py < 0) py += h;
        const px = s.x * w;

        const tw = reduced ? 0.85 : 0.55 + 0.45 * Math.sin(time * s.tws + s.tw);
        const alpha = (0.25 + s.depth * 0.6) * tw;

        // near stars pick up the accent tint; far stars stay pearl
        const mix = s.depth * 0.7;
        const cr = Math.round(244 * (1 - mix) + ar * mix);
        const cg = Math.round(238 * (1 - mix) + ag * mix);
        const cb = Math.round(255 * (1 - mix) + ab * mix);

        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
        ctx.fill();

        if (s.depth > 0.82) {
          ctx.beginPath();
          ctx.arc(px, py, s.r * 2.6, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha * 0.12})`;
          ctx.fill();
        }
      }

      if (!reduced) rafRef.current = requestAnimationFrame(draw);
    };

    const onScroll = () => { scrollRef.current = window.scrollY || window.pageYOffset || 0; };
    const onVisibility = () => {
      if (document.hidden) { cancelAnimationFrame(rafRef.current); }
      else if (!reduced) { rafRef.current = requestAnimationFrame(draw); }
    };

    resize();
    onScroll();
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    if (reduced) {
      draw(0); // single static frame
    } else {
      rafRef.current = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reduced]);

  return <canvas ref={canvasRef} className="rv-starfield" aria-hidden="true" />;
}
