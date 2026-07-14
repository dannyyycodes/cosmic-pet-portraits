import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SIGN_GLYPH, SIGN_ORDER, buildWheelPoints, type WheelPoint } from './astro';
import type { ChartPlacements } from './types';

gsap.registerPlugin(ScrollTrigger);

const VB = 400;
const C = VB / 2; // 200
const R_OUTER = 192;
const R_ZOD_O = 178;
const R_ZOD_I = 150;
const R_SIGN = 164;
const R_HOUSE = 120;
const R_CENTER = 94;
const R_PLANET_BASE = 135;

interface Props {
  placements: ChartPlacements;
  mode: 'draw' | 'static';
  interactive?: boolean;
  reduced?: boolean;
  sceneRef?: React.RefObject<HTMLElement>; // tall scroll scene for scrub
  compact?: boolean; // mini render — hide labels/aspects
}

interface Placed extends WheelPoint { x: number; y: number; r: number; ang: number; }

const ASPECTS = [
  { angle: 60, orb: 5, cls: 'rv-w-aspect--harmony' },
  { angle: 90, orb: 5, cls: 'rv-w-aspect--tense' },
  { angle: 120, orb: 6, cls: 'rv-w-aspect--harmony' },
  { angle: 180, orb: 6, cls: 'rv-w-aspect--tense' },
];
const ASPECT_KEYS = new Set(['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn']);

export function NatalWheel({ placements, mode, interactive = false, reduced = false, sceneRef, compact = false }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [selected, setSelected] = useState<Placed | null>(null);

  const points = useMemo(() => buildWheelPoints(placements), [placements]);
  const ascLon = useMemo(() => {
    const asc = placements?.ascendant;
    if (!asc?.sign) return 0;
    return SIGN_ORDER.indexOf(asc.sign) * 30 + (asc.degree || 0);
  }, [placements]);

  const toXY = (lon: number, r: number) => {
    const deg = 180 + (lon - ascLon);
    const a = (deg * Math.PI) / 180;
    return { x: C + r * Math.cos(a), y: C - r * Math.sin(a), ang: deg };
  };

  // place planets with simple radial de-collision
  const placed: Placed[] = useMemo(() => {
    const sorted = [...points].sort((a, b) => a.lon - b.lon);
    const out: Placed[] = [];
    let lastScreenAng = -999;
    let tier = 0;
    for (const p of sorted) {
      const screenAng = (180 + (p.lon - ascLon) + 720) % 360;
      const gap = Math.abs(screenAng - lastScreenAng);
      if (gap < 11 || gap > 349) tier = (tier + 1) % 3;
      else tier = 0;
      lastScreenAng = screenAng;
      const r = R_PLANET_BASE + tier * 15;
      const { x, y, ang } = toXY(p.lon, r);
      out.push({ ...p, x, y, r, ang });
    }
    return out;
  }, [points, ascLon]);

  const aspects = useMemo(() => {
    if (compact) return [];
    const majors = placed.filter((p) => ASPECT_KEYS.has(p.key));
    const lines: { x1: number; y1: number; x2: number; y2: number; cls: string }[] = [];
    for (let i = 0; i < majors.length; i++) {
      for (let j = i + 1; j < majors.length; j++) {
        let d = Math.abs(majors[i].lon - majors[j].lon) % 360;
        if (d > 180) d = 360 - d;
        for (const asp of ASPECTS) {
          if (Math.abs(d - asp.angle) <= asp.orb) {
            const a = toXY(majors[i].lon, R_HOUSE);
            const b = toXY(majors[j].lon, R_HOUSE);
            lines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, cls: asp.cls });
            break;
          }
        }
      }
    }
    return lines;
  }, [placed, ascLon, compact]);

  // zodiac ticks + sign glyphs (signs are fixed by longitude)
  const zodiac = useMemo(() => {
    const ticks: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const glyphs: { x: number; y: number; g: string }[] = [];
    for (let s = 0; s < 12; s++) {
      const boundary = toXY(s * 30, R_ZOD_I);
      const boundaryO = toXY(s * 30, R_ZOD_O);
      ticks.push({ x1: boundary.x, y1: boundary.y, x2: boundaryO.x, y2: boundaryO.y });
      const mid = toXY(s * 30 + 15, R_SIGN);
      glyphs.push({ x: mid.x, y: mid.y, g: SIGN_GLYPH[SIGN_ORDER[s]] });
    }
    return { ticks, glyphs };
  }, [ascLon]);

  // house spokes (whole-sign from ascendant sign)
  const spokes = useMemo(() => {
    const ascSignStart = Math.floor(ascLon / 30) * 30;
    const arr: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let k = 0; k < 12; k++) {
      const lon = ascSignStart + k * 30;
      const a = toXY(lon, R_CENTER);
      const b = toXY(lon, R_HOUSE);
      arr.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
    }
    return arr;
  }, [ascLon]);

  // GSAP draw-on
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    if (mode !== 'draw' || reduced) return; // static = already at final render

    const ctx = gsap.context(() => {
      const rings = gsap.utils.toArray<SVGGeometryElement>('.rv-w-ring', svg);
      rings.forEach((el) => {
        const len = el.getTotalLength ? el.getTotalLength() : 1200;
        gsap.set(el, { strokeDasharray: len, strokeDashoffset: len });
      });
      gsap.set(['.rv-w-tick', '.rv-w-spoke', '.rv-w-signglyph'], { opacity: 0 });
      gsap.set('.rv-w-planet-inner', { opacity: 0, scale: 0.3, transformOrigin: 'center' });
      const aspEls = gsap.utils.toArray<SVGGeometryElement>('.rv-w-aspect', svg);
      aspEls.forEach((el) => {
        const len = el.getTotalLength ? el.getTotalLength() : 300;
        gsap.set(el, { strokeDasharray: len, strokeDashoffset: len, opacity: 0 });
      });

      const useScrub = !!sceneRef?.current;
      const tl = gsap.timeline(
        useScrub
          ? {
              scrollTrigger: {
                trigger: sceneRef!.current!,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 0.6,
              },
            }
          : { defaults: {} }
      );

      tl.to('.rv-w-ring', { strokeDashoffset: 0, duration: 1.2, ease: 'power1.inOut', stagger: 0.15 }, 0)
        .to('.rv-w-spoke', { opacity: 1, duration: 0.5, stagger: 0.02 }, 0.5)
        .to('.rv-w-tick', { opacity: 1, duration: 0.5, stagger: 0.02 }, 0.7)
        .to('.rv-w-signglyph', { opacity: 0.82, duration: 0.6, stagger: 0.03 }, 0.9)
        .to('.rv-w-planet-inner', { opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(1.7)', stagger: 0.06 }, 1.3)
        .to('.rv-w-aspect', { strokeDashoffset: 0, opacity: 1, duration: 0.8, ease: 'power1.inOut', stagger: 0.05 }, 2.1);

      if (!useScrub) tl.play();
    }, svg);

    // give layout a frame, then refresh triggers
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => { cancelAnimationFrame(id); ctx.revert(); };
  }, [mode, reduced, sceneRef, placed.length]);

  useEffect(() => {
    if (!interactive) return;
    const onDoc = () => setSelected(null);
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, [interactive]);

  const ariaLabel = useMemo(() => {
    const parts = placed
      .filter((p) => ['sun', 'moon', 'ascendant'].includes(p.key))
      .map((p) => `${p.name} in ${p.sign}`);
    return `Natal chart wheel. ${parts.join(', ')}.`;
  }, [placed]);

  const dotR = compact ? 8 : 11;
  const glyphSize = compact ? 11 : 13;

  return (
    <>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB} ${VB}`}
        role="img"
        aria-label={ariaLabel}
      >
        {/* rings */}
        <circle className="rv-w-ring rv-w-ring--outer" cx={C} cy={C} r={R_OUTER} strokeWidth={1} />
        <circle className="rv-w-ring rv-w-ring--zodiac" cx={C} cy={C} r={R_ZOD_O} strokeWidth={1} />
        <circle className="rv-w-ring rv-w-ring--zodiac" cx={C} cy={C} r={R_ZOD_I} strokeWidth={1} />
        <circle className="rv-w-ring" cx={C} cy={C} r={R_HOUSE} strokeWidth={1} />
        <circle className="rv-w-ring" cx={C} cy={C} r={R_CENTER} strokeWidth={1} />

        {/* house spokes */}
        {!compact && spokes.map((s, i) => (
          <line key={`sp${i}`} className="rv-w-spoke" x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} strokeWidth={0.75} />
        ))}

        {/* zodiac ticks */}
        {zodiac.ticks.map((t, i) => (
          <line key={`tk${i}`} className="rv-w-tick" x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} strokeWidth={0.75} />
        ))}

        {/* sign glyphs */}
        {!compact && zodiac.glyphs.map((g, i) => (
          <text key={`sg${i}`} className="rv-w-signglyph" x={g.x} y={g.y} fontSize={15}
            textAnchor="middle" dominantBaseline="central">{g.g}</text>
        ))}

        {/* aspect lines */}
        {aspects.map((a, i) => (
          <line key={`asp${i}`} className={`rv-w-aspect ${a.cls}`} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} strokeWidth={0.9} />
        ))}

        {/* planets */}
        {placed.map((p) => (
          <g
            key={p.key}
            className={`rv-w-planet${p.lit ? ' rv-w-planet--lit' : ''}`}
            transform={`translate(${p.x} ${p.y})`}
            tabIndex={interactive ? 0 : -1}
            role={interactive ? 'button' : undefined}
            aria-label={interactive ? `${p.name} in ${p.sign}, ${p.degree} degrees` : undefined}
            onClick={interactive ? (e) => { e.stopPropagation(); setSelected(selected?.key === p.key ? null : p); } : undefined}
            onKeyDown={interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(selected?.key === p.key ? null : p); } } : undefined}
          >
            <g className="rv-w-planet-inner">
              <circle className="rv-w-planet-dot" cx={0} cy={0} r={dotR} strokeWidth={1.3} />
              <text className="rv-w-planet-glyph" x={0} y={0.5} fontSize={glyphSize} textAnchor="middle" dominantBaseline="central">{p.glyph}</text>
            </g>
          </g>
        ))}
      </svg>

      {interactive && selected && (
        <div
          className="rv-w-tooltip"
          style={{ left: `${(selected.x / VB) * 100}%`, top: `${(selected.y / VB) * 100}%` }}
          role="status"
        >
          <div className="tt-planet">{selected.name}</div>
          <div className="tt-sign">{SIGN_GLYPH[selected.sign] || ''} {selected.sign}</div>
          <div className="tt-deg">{selected.degree}°</div>
        </div>
      )}
    </>
  );
}
