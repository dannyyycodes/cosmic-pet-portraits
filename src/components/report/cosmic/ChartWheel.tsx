import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { COSMIC } from './tokens';

type Placement = { sign: string; degree: number };
type Placements = Record<string, Placement | undefined>;

interface ChartWheelProps {
  placements: Placements;
  petName?: string;
  size?: number;
}

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

const PL: Record<string, { abbr: string; c: string; order: number }> = {
  sun:       { abbr: 'Sun',  c: '#f6a02a', order: 0 },
  moon:      { abbr: 'Moon', c: '#c7c2da', order: 1 },
  mercury:   { abbr: 'Merc', c: '#c9a98a', order: 2 },
  venus:     { abbr: 'Ven',  c: '#e9a36a', order: 3 },
  mars:      { abbr: 'Mars', c: '#d6603e', order: 4 },
  chiron:    { abbr: 'Chi',  c: '#8fc4d6', order: 5 },
  lilith:    { abbr: 'Lil',  c: '#9a7ee6', order: 6 },
  northNode: { abbr: 'Node', c: '#79c79f', order: 7 },
  ascendant: { abbr: 'ASC',  c: '#9fbce6', order: 8 },
};

const ASPECTS = [
  { name: 'conjunction', angle: 0,   orb: 8,  c: '#e6c179' },
  { name: 'sextile',     angle: 60,  orb: 5,  c: '#9a7ee6' },
  { name: 'square',      angle: 90,  orb: 6,  c: '#d6603e' },
  { name: 'trine',       angle: 120, orb: 6,  c: '#e6c179' },
  { name: 'opposition',  angle: 180, orb: 7,  c: '#b59be8' },
];

const lon = (p: Placement) => SIGNS.indexOf(p.sign) * 30 + (p.degree || 0);
const polar = (cx: number, cy: number, r: number, deg: number) => {
  const t = ((deg - 90) * Math.PI) / 180; // 0° Aries at top, clockwise
  return { x: cx + Math.cos(t) * r, y: cy + Math.sin(t) * r };
};

// Instrument-grade natal wheel. Precomputed geometry, zodiac ring + ticks,
// planets plotted by true longitude, major aspect lines, sequenced draw-in,
// hover/tap highlight. No cheap glyphs — clean labels + accent dots.
export function ChartWheel({ placements, petName, size = 360 }: ChartWheelProps) {
  const reduce = !!useReducedMotion();
  const [hot, setHot] = useState<string | null>(null);
  const cx = size / 2, cy = size / 2;
  const rOuter = size / 2 - 6;
  const rZodiac = rOuter - 22;   // inner edge of zodiac band
  const rPlanet = rZodiac - 34;  // planet ring radius
  const rAspect = rPlanet - 8;

  // ── Mobile-readable typography ────────────────────────────────────────
  // Fonts are sized in viewBox units. The SVG renders at width=100% of its
  // container, so rendered px = fontUnits * (containerPx / size). Worst-case
  // mobile container at a 390px viewport (minus the my-10 px-4 = 32px gutter)
  // is ~358px → render scale ~0.895. We size the floors so the *rendered* px
  // never drops below the requirement, and scale up gracefully on desktop
  // (wider container → larger render). Geometry/astronomy math is untouched.
  const planetFont = Math.max(11, size * 0.03);   // ≥10px @390 (≈10.7), ≥11 desktop
  const signFont = Math.max(10, size * 0.0275);   // ≥9px @390 (≈9.9)
  // Push planet labels radially OUTWARD — just outside the planet ring, clear
  // of the dots. Gap scales with font so bigger text never collides with dots.
  const labelGap = 9 + planetFont * 0.65;          // ≈ 16.8 units @ size 400
  const rLabel = rPlanet + labelGap;
  // Tight-cluster fan-out: when neighbours sit within this longitude window we
  // splay their labels apart so they stop overlapping (e.g. "VenSun").
  const FAN_WINDOW = 6;   // degrees of longitude
  const FAN_STEP = 5;     // degrees of angular splay per offset step

  const planets = useMemo(() => {
    const base = Object.entries(PL)
      .map(([k, meta]) => {
        const p = placements[k];
        if (!p || !p.sign || SIGNS.indexOf(p.sign) < 0) return null;
        const L = lon(p);
        return { k, ...meta, L, sign: p.sign, degree: p.degree, pos: polar(cx, cy, rPlanet, L) };
      })
      .filter(Boolean) as Array<{ k: string; abbr: string; c: string; L: number; sign: string; degree: number; pos: { x: number; y: number } }>;

    // Fan labels apart inside tight clusters. Sort by longitude, group runs of
    // planets within FAN_WINDOW of their neighbour (circular — a cluster that
    // straddles 0°/360° is still one group), then splay each run symmetrically
    // around its members. Labels also step outward a touch per cluster member so
    // even 3+ stacked planets stay legible. Astronomy (L) is never mutated.
    const sorted = [...base].sort((a, b) => a.L - b.L);
    const labelAngle: Record<string, number> = {};
    const labelRadius: Record<string, number> = {};
    const N = sorted.length;
    const clusters: (typeof sorted)[] = [];
    if (N > 0) {
      let run = [sorted[0]];
      for (let k = 1; k < N; k++) {
        if (sorted[k].L - sorted[k - 1].L <= FAN_WINDOW) run.push(sorted[k]);
        else { clusters.push(run); run = [sorted[k]]; }
      }
      clusters.push(run);
      // Merge wrap-seam: first + last cluster within FAN_WINDOW across 0°/360°.
      if (clusters.length > 1) {
        const first = clusters[0], last = clusters[clusters.length - 1];
        if (360 - last[last.length - 1].L + first[0].L <= FAN_WINDOW) {
          clusters[0] = [...last, ...first];
          clusters.pop();
        }
      }
    }
    for (const run of clusters) {
      const n = run.length;
      if (n === 1) {
        labelAngle[run[0].k] = run[0].L;
        labelRadius[run[0].k] = rLabel;
      } else {
        const mid = (n - 1) / 2;
        run.forEach((pl, idx) => {
          labelAngle[pl.k] = pl.L + (idx - mid) * FAN_STEP;
          labelRadius[pl.k] = rLabel + Math.abs(idx - mid) * (planetFont * 0.5);
        });
      }
    }

    return base.map((pl) => {
      const aL = labelAngle[pl.k] ?? pl.L;
      const rL = labelRadius[pl.k] ?? rLabel;
      return { ...pl, lab: polar(cx, cy, rL, aL) };
    });
  }, [placements, cx, cy, rPlanet, rLabel, planetFont]);

  const aspects = useMemo(() => {
    const out: Array<{ a: string; b: string; c: string; pa: any; pb: any }> = [];
    for (let i = 0; i < planets.length; i++) for (let j = i + 1; j < planets.length; j++) {
      let d = Math.abs(planets[i].L - planets[j].L) % 360; if (d > 180) d = 360 - d;
      for (const asp of ASPECTS) {
        if (Math.abs(d - asp.angle) <= asp.orb) {
          out.push({ a: planets[i].k, b: planets[j].k, c: asp.c,
            pa: polar(cx, cy, rAspect, planets[i].L), pb: polar(cx, cy, rAspect, planets[j].L) });
          break;
        }
      }
    }
    return out;
  }, [planets, cx, cy, rAspect]);

  const draw = (delay: number) => reduce ? {} : ({
    initial: { pathLength: 0, opacity: 0 },
    whileInView: { pathLength: 1, opacity: 1 },
    viewport: { once: true },
    transition: { duration: 1, delay, ease: 'easeInOut' as const },
  });

  return (
    <div className="mx-auto" style={{ width: size, maxWidth: '100%' }}>
      <svg width="100%" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Birth chart wheel">
        {/* subtle field */}
        <defs>
          <radialGradient id="cw-field" cx="50%" cy="42%" r="62%">
            <stop offset="0%" stopColor="#1a1330" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0a0810" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={rOuter} fill="url(#cw-field)" />

        {/* zodiac band rings */}
        <motion.circle cx={cx} cy={cy} r={rOuter} fill="none" stroke={COSMIC.gold} strokeOpacity={0.35} strokeWidth={1} {...draw(0)} />
        <motion.circle cx={cx} cy={cy} r={rZodiac} fill="none" stroke={COSMIC.violet} strokeOpacity={0.18} strokeWidth={1} {...draw(0.15)} />
        <circle cx={cx} cy={cy} r={rPlanet} fill="none" stroke={COSMIC.border} strokeWidth={1} />

        {/* 360 degree ticks (every 5°) + sign sectors (every 30°) */}
        {Array.from({ length: 72 }).map((_, i) => {
          const deg = i * 5; const major = deg % 30 === 0;
          const a = polar(cx, cy, rOuter, deg); const b = polar(cx, cy, rOuter - (major ? 14 : 7), deg);
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={major ? COSMIC.gold : COSMIC.violet} strokeOpacity={major ? 0.5 : 0.22} strokeWidth={major ? 1.3 : 0.7} />;
        })}

        {/* sign labels in the band */}
        {SIGNS.map((s, i) => {
          const mid = i * 30 + 15; const p = polar(cx, cy, (rOuter + rZodiac) / 2, mid);
          return <text key={s} x={p.x} y={p.y} fill={COSMIC.muted} fontSize={signFont} fontWeight={700}
            letterSpacing="0.5" textAnchor="middle" dominantBaseline="central" style={{ textTransform: 'uppercase' }}>{s.slice(0, 3)}</text>;
        })}

        {/* aspect lines */}
        {aspects.map((asp, i) => {
          const dim = hot && hot !== asp.a && hot !== asp.b;
          return <motion.line key={i} x1={asp.pa.x} y1={asp.pa.y} x2={asp.pb.x} y2={asp.pb.y}
            stroke={asp.c} strokeWidth={1} strokeOpacity={dim ? 0.06 : 0.4}
            {...draw(0.5 + i * 0.05)} />;
        })}

        {/* planets */}
        {planets.map((pl, i) => {
          const dim = hot && hot !== pl.k;
          // Anchor the outward label by side so fanned labels read away from
          // the dot instead of sitting on top of the ring.
          const anchor = pl.lab.x < cx - 1 ? 'end' : pl.lab.x > cx + 1 ? 'start' : 'middle';
          return (
            <motion.g key={pl.k} style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHot(pl.k)} onMouseLeave={() => setHot(null)}
              onClick={() => setHot(h => h === pl.k ? null : pl.k)}
              initial={reduce ? false : { opacity: 0, scale: 0.4 }}
              whileInView={reduce ? undefined : { opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + i * 0.07, type: 'spring', stiffness: 260, damping: 18 }}
              opacity={dim ? 0.3 : 1}
            >
              {/* invisible ≥44px tap target spanning dot + its label */}
              <circle cx={(pl.pos.x + pl.lab.x) / 2} cy={(pl.pos.y + pl.lab.y) / 2}
                r={Math.max(24, size * 0.07)} fill="transparent" />
              {/* leader line from dot to its fanned label keeps the link clear */}
              <line x1={pl.pos.x} y1={pl.pos.y} x2={pl.lab.x} y2={pl.lab.y}
                stroke={pl.c} strokeOpacity={dim ? 0.08 : 0.28} strokeWidth={0.8} />
              <circle cx={pl.pos.x} cy={pl.pos.y} r={5.5} fill={pl.c} style={{ filter: `drop-shadow(0 0 5px ${pl.c})` }} />
              <circle cx={pl.pos.x} cy={pl.pos.y} r={5.5} fill="none" stroke="#0a0810" strokeWidth={1.3} />
              <text x={pl.lab.x} y={pl.lab.y} fill={pl.c} fontSize={planetFont} fontWeight={700}
                textAnchor={anchor} dominantBaseline="central"
                style={{ paintOrder: 'stroke', stroke: '#0a0810', strokeWidth: 2.4, strokeLinejoin: 'round' }}>{pl.abbr}</text>
            </motion.g>
          );
        })}

        {/* center hub */}
        <circle cx={cx} cy={cy} r={3} fill={COSMIC.gold} style={{ filter: `drop-shadow(0 0 6px ${COSMIC.gold})` }} />
      </svg>

      {/* hover detail / legend — active line ≥0.9rem, idle hint ≥0.7rem */}
      <div className="text-center mt-2" style={{ minHeight: 22 }}>
        {hot && PL[hot] && placements[hot] ? (
          <span style={{ fontFamily: 'Cormorant, serif', color: COSMIC.text2, fontSize: '0.95rem' }}>
            <span style={{ color: PL[hot].c, fontWeight: 600 }}>{PL[hot].abbr}</span> in {placements[hot]!.sign} · {placements[hot]!.degree}°
          </span>
        ) : (
          <span style={{ fontSize: '0.7rem', letterSpacing: '0.1em', color: COSMIC.muted }} className="uppercase">
            {petName ? `${petName}'s natal chart` : 'Natal chart'} · tap a planet
          </span>
        )}
      </div>
    </div>
  );
}
