import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useInView } from 'framer-motion';
import { COSMIC } from './tokens';

type Balance = { Fire?: number; Water?: number; Earth?: number; Air?: number };

interface ElementalTilesProps {
  balance: Balance;
  dominant?: string;
  /** When given, balance is computed from these placements so it always
   *  matches the chart wheel (avoids "why is Earth 0%?" when the wheel
   *  clearly shows an earth placement). */
  placements?: Record<string, { sign: string } | undefined>;
}

const ELEMENTS = ['Fire', 'Earth', 'Air', 'Water'] as const;
type El = typeof ELEMENTS[number];

const SIGN_EL: Record<string, El> = {
  Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
  Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
  Gemini: 'Air', Libra: 'Air', Aquarius: 'Air',
  Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water',
};

function balanceFromPlacements(pl?: Record<string, { sign: string } | undefined>): { bal: Balance; dom: string } | null {
  if (!pl) return null;
  const counts: Record<El, number> = { Water: 0, Fire: 0, Earth: 0, Air: 0 };
  let total = 0;
  for (const k of Object.keys(pl)) {
    const sign = pl[k]?.sign; const el = sign ? SIGN_EL[sign] : undefined;
    if (el) { counts[el]++; total++; }
  }
  if (!total) return null;
  const bal: Balance = {
    Water: Math.round((counts.Water / total) * 100),
    Fire: Math.round((counts.Fire / total) * 100),
    Earth: Math.round((counts.Earth / total) * 100),
    Air: Math.round((counts.Air / total) * 100),
  };
  const dom = (ELEMENTS).reduce((a, b) => (counts[b] > counts[a] ? b : a), 'Fire' as El);
  return { bal, dom };
}

// Element identity: stroke colour, bright glow, and the classical temperament word.
const TONE: Record<El, { c: string; glow: string; word: string }> = {
  Fire: { c: '#ef6a3a', glow: '#ff9a6a', word: 'Drive' },
  Earth: { c: '#b89a5a', glow: '#e6cf95', word: 'Ground' },
  Air: { c: '#a892e8', glow: '#d8c5f5', word: 'Mind' },
  Water: { c: '#4f9bd8', glow: '#7cc0f0', word: 'Feeling' },
};

/* ── Alchemical element symbols, drawn crisp on a 24×24 grid ────────────────
   Fire  = upward triangle
   Water = downward triangle
   Air   = upward triangle + horizontal bar
   Earth = downward triangle + horizontal bar                                */
function AlchemySymbol({ el, size, color }: { el: El; size: number; color: string }) {
  const up = 'M12 3.2 21 19.4H3 Z';        // upward triangle
  const down = 'M12 20.8 3 4.6h18 Z';      // downward triangle
  const isUp = el === 'Fire' || el === 'Air';
  const tri = isUp ? up : down;
  const bar = el === 'Air' ? 'M6.6 13.4h10.8' : el === 'Earth' ? 'M6.6 10.6h10.8' : null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"
      style={{ display: 'block', overflow: 'visible' }}>
      <path d={tri} stroke={color} strokeWidth={1.7} strokeLinejoin="round" strokeLinecap="round" />
      {bar && <path d={bar} stroke={color} strokeWidth={1.7} strokeLinecap="round" />}
    </svg>
  );
}

/* ── Number that ticks up from 0 once in view ──────────────────────────── */
function TickNumber({ value, play, duration = 1.1, className, style }:
  { value: number; play: boolean; duration?: number; className?: string; style?: React.CSSProperties }) {
  const [n, setN] = useState(play ? 0 : value);
  useEffect(() => {
    if (!play) { setN(value); return; }
    let raf = 0; const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setN(Math.round(eased * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, play, duration]);
  return <span className={className} style={style}>{n}</span>;
}

/* ── The radial elemental wheel: a ring split into 4 proportional arcs ──── */
const R = 90;          // arc radius
const SW = 20;         // stroke width
const CIRC = 2 * Math.PI * R;
const GAP_FRAC = 0.012; // gap between segments, as a fraction of the circle

function Wheel({ data, dom, play, reduce, dominantPct }:
  { data: { el: El; pct: number }[]; dom?: string; play: boolean; reduce: boolean; dominantPct: number }) {
  // Build cumulative start angles (degrees, clockwise from top -90°).
  // Each segment shrinks by the gap so the arcs read as distinct elements.
  let acc = 0;
  const segs = data.map(({ el, pct }) => {
    const frac = pct / 100;
    const startDeg = -90 + acc * 360;
    acc += frac;
    const visFrac = Math.max(0, frac - GAP_FRAC);
    return { el, pct, frac, visFrac, startDeg };
  });
  const domTone = (dom && TONE[dom as El]) ? TONE[dom as El] : { c: COSMIC.gold, glow: COSMIC.goldBright, word: '' };

  return (
    <div className="relative mx-auto" style={{ width: 'min(82vw, 280px)', aspectRatio: '1 / 1' }}>
      <svg viewBox="0 0 240 240" width="100%" height="100%" style={{ overflow: 'visible' }}>
        <defs>
          <filter id="el-soft" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.2" />
          </filter>
        </defs>

        {/* base track */}
        <circle cx="120" cy="120" r={R} fill="none" stroke={COSMIC.borderSolid} strokeWidth={SW} opacity={0.5} />

        {/* faint glow pass behind the live arcs */}
        {!reduce && segs.map((s) => s.visFrac > 0 && (
          <circle key={`g-${s.el}`} cx="120" cy="120" r={R} fill="none"
            stroke={TONE[s.el].glow} strokeWidth={SW + 4} strokeLinecap="butt"
            filter="url(#el-soft)" opacity={0.4}
            strokeDasharray={`${s.visFrac * CIRC} ${CIRC}`}
            transform={`rotate(${s.startDeg} 120 120)`}
            style={{ pointerEvents: 'none' }} />
        ))}

        {/* proportional element arcs */}
        {segs.map((s) => s.visFrac > 0 && (
          <motion.circle key={`a-${s.el}`} cx="120" cy="120" r={R} fill="none"
            stroke={TONE[s.el].c} strokeWidth={SW} strokeLinecap="butt"
            transform={`rotate(${s.startDeg} 120 120)`}
            strokeDasharray={`${s.visFrac * CIRC} ${CIRC}`}
            initial={reduce ? false : { strokeDashoffset: s.visFrac * CIRC }}
            animate={play ? { strokeDashoffset: 0 } : undefined}
            transition={{ duration: 1.25, ease: [0.22, 1, 0.36, 1], delay: 0.08 + s.startDeg / 720 }} />
        ))}
      </svg>

      {/* centre label — dominant element as the instrument's reading */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none" style={{ padding: '22%' }}>
        {dom && (
          <>
            <div style={{ filter: `drop-shadow(0 0 10px ${domTone.glow}66)` }}>
              <AlchemySymbol el={dom as El} size={30} color={domTone.glow} />
            </div>
            <div className="uppercase mt-2" style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.2em', color: COSMIC.gold }}>
              Dominant
            </div>
            <div style={{ fontFamily: '"DM Serif Display", serif', fontSize: 'clamp(1.5rem, 6vw, 1.95rem)', lineHeight: 1.04, color: '#fff', marginTop: 2 }}>
              {dom}
            </div>
            <div style={{ fontFamily: '"DM Serif Display", serif', fontSize: '1.15rem', lineHeight: 1, color: domTone.glow, marginTop: 4 }}>
              <TickNumber value={dominantPct} play={play} />
              <span style={{ fontSize: '0.72rem' }}>%</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function ElementalTiles({ balance, dominant, placements }: ElementalTilesProps) {
  const reduce = !!useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-12%' });
  const play = reduce ? false : inView;

  const computed = balanceFromPlacements(placements);
  const bal = computed?.bal ?? balance;
  const dom = computed?.dom ?? dominant;
  const data = ELEMENTS.map((el) => ({ el, pct: Math.round((bal?.[el] ?? 0)) }));
  const dominantPct = dom ? Math.round((bal?.[dom as El] ?? 0)) : 0;

  return (
    <div ref={ref} className="mx-4 sm:mx-auto max-w-[760px] my-8">
      {/* heading */}
      <div className="text-center mb-6">
        <div className="uppercase" style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.22em', color: COSMIC.gold }}>
          Elemental Balance
        </div>
        {dom && (
          <div className="mt-2" style={{ fontFamily: 'Cormorant, serif', fontStyle: 'italic', color: '#ece5ff', fontSize: '1.12rem', lineHeight: 1.5 }}>
            <span style={{ color: TONE[(dom as El)] ? TONE[dom as El].glow : COSMIC.gold, fontWeight: 600 }}>{dom}</span> leads the chart
          </div>
        )}
      </div>

      {/* the instrument: proportional wheel + legend */}
      <div
        className="rounded-2xl px-5 py-7 sm:px-8 sm:py-8"
        style={{
          background: COSMIC.surface,
          border: `1px solid ${COSMIC.border}`,
          boxShadow: 'inset 0 0 60px rgba(0,0,0,0.35), 0 12px 40px rgba(0,0,0,0.35)',
          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-center lg:gap-10">
          {/* wheel */}
          <div className="shrink-0">
            <Wheel data={data} dom={dom} play={play} reduce={reduce} dominantPct={dominantPct} />
          </div>

          {/* legend — stacks on mobile, sits beside the wheel on wide screens */}
          <div className="w-full max-w-[360px] flex flex-col gap-3">
            {data.map(({ el, pct }, i) => {
              const isDom = dom === el;
              const { c, glow, word } = TONE[el];
              return (
                <motion.div key={el}
                  initial={reduce ? false : { opacity: 0, x: 14 }}
                  animate={play ? { opacity: 1, x: 0 } : undefined}
                  transition={{ duration: 0.5, delay: 0.25 + i * 0.1 }}
                  className="rounded-xl px-3 py-2.5"
                  style={{
                    background: isDom ? `${glow}1f` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isDom ? glow + '66' : COSMIC.border}`,
                    boxShadow: isDom ? `0 0 22px ${glow}33` : 'none',
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* symbol chip */}
                    <div className="shrink-0 grid place-items-center rounded-lg"
                      style={{ width: 38, height: 38, background: `${c}22`, border: `1px solid ${c}55` }}>
                      <AlchemySymbol el={el} size={20} color={glow} />
                    </div>

                    {/* name + word + proportional bar */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="uppercase truncate" style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.12em', color: '#ece5ff' }}>
                          {el}
                        </span>
                        <span style={{ fontFamily: '"DM Serif Display", serif', fontSize: '1.15rem', lineHeight: 1, color: isDom ? glow : '#ece5ff' }}>
                          <TickNumber value={pct} play={play} />
                          <span style={{ fontSize: '0.7rem', opacity: 0.85 }}>%</span>
                        </span>
                      </div>

                      {/* proportional track */}
                      <div className="relative mt-1.5 overflow-hidden rounded-full"
                        style={{ height: 6, background: COSMIC.borderSolid }}>
                        <motion.div className="absolute inset-y-0 left-0 rounded-full"
                          style={{ background: `linear-gradient(90deg, ${c}, ${glow})` }}
                          initial={reduce ? false : { width: 0 }}
                          animate={play ? { width: `${pct}%` } : undefined}
                          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.3 + i * 0.1 }} />
                      </div>

                      <div className="mt-1 flex items-center justify-between">
                        <span style={{ fontFamily: 'Cormorant, serif', fontStyle: 'italic', fontSize: '0.86rem', color: COSMIC.mutedColor, lineHeight: 1 }}>
                          {word}
                        </span>
                        <span className="uppercase" style={{ fontSize: '0.6rem', letterSpacing: '0.12em', fontWeight: 700, color: isDom ? glow : COSMIC.muted }}>
                          {isDom ? 'Dominant' : pct === 0 ? 'Quiet' : pct < 25 ? 'Faint' : 'Present'}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
