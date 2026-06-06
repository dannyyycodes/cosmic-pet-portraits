import { useMemo } from 'react';
import { motion, useReducedMotion, type Transition } from 'framer-motion';
import { Share2 } from 'lucide-react';
import { COSMIC } from './tokens';

interface FinalSoulSealProps {
  petName: string;
  sun?: { sign: string };
  moon?: { sign: string };
  rising?: { sign: string };
  dominantElement?: string;
  archetype?: string;
  auraColors?: { primary?: string; secondary?: string };
}

// ── geometry helpers ────────────────────────────────────────────────────────
const CX = 180;
const CY = 180;
const polar = (r: number, deg: number) => {
  const t = ((deg - 90) * Math.PI) / 180; // 0° at top, clockwise
  return { x: CX + Math.cos(t) * r, y: CY + Math.sin(t) * r };
};

// the big-three anchor points on the sigil (as specified)
const SUN_PT = { x: 180, y: 58 };
const MOON_PT = { x: 96, y: 236 };
const RISE_PT = { x: 264, y: 236 };

// stable string→bucket hash, used to map free-text archetypes to one of 5 motifs
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const ARCHETYPES = ['Guardian', 'Trickster', 'Mystic', 'Sovereign', 'Healer'] as const;
type ArchetypeMotif = typeof ARCHETYPES[number];

function resolveArchetype(raw?: string): ArchetypeMotif {
  const txt = (raw || '').trim();
  if (!txt) return ARCHETYPES[hashString('soul') % 5];
  const lower = txt.toLowerCase();
  const direct = ARCHETYPES.find((a) => lower.includes(a.toLowerCase()));
  if (direct) return direct;
  return ARCHETYPES[hashString(lower) % 5];
}

type Element = 'Fire' | 'Water' | 'Air' | 'Earth';
function resolveElement(raw?: string): Element | null {
  const lower = (raw || '').toLowerCase();
  if (lower.includes('fire')) return 'Fire';
  if (lower.includes('water')) return 'Water';
  if (lower.includes('air')) return 'Air';
  if (lower.includes('earth')) return 'Earth';
  return null;
}

// ── reveal timing ───────────────────────────────────────────────────────────
// outer ring 0.8s · ticks stagger 0.3s · triangle 0.6s · element fade ·
// aura orbits 1s (last) · pet name 0.25s after sigil. Total ~1.8s.
const T = {
  ring: 0.0,
  ticks: 0.55,
  triangle: 0.75,
  element: 1.05,
  aura: 1.25,
  name: 1.55,
};

const EASE: Transition['ease'] = [0.22, 1, 0.36, 1];

export function FinalSoulSeal(props: FinalSoulSealProps) {
  const {
    petName,
    sun,
    moon,
    rising,
    dominantElement,
    archetype,
    auraColors,
  } = props;

  const reduce = !!useReducedMotion();

  const element = resolveElement(dominantElement);
  const motif = useMemo(() => resolveArchetype(archetype), [archetype]);

  const auraPrimary = auraColors?.primary || COSMIC.violet;
  const auraSecondary = auraColors?.secondary || COSMIC.gold;

  // draw-in helper for stroked paths/circles
  const draw = (delay: number, duration: number): Record<string, unknown> =>
    reduce
      ? {}
      : {
          initial: { pathLength: 0, opacity: 0 },
          whileInView: { pathLength: 1, opacity: 1 },
          viewport: { once: true, margin: '-10%' },
          transition: { duration, delay, ease: 'easeInOut' as const },
        };

  // simple fade-in helper
  const fade = (delay: number, duration: number): Record<string, unknown> =>
    reduce
      ? {}
      : {
          initial: { opacity: 0 },
          whileInView: { opacity: 1 },
          viewport: { once: true, margin: '-10%' },
          transition: { duration, delay, ease: EASE },
        };

  // 12 zodiac ticks around the outer ring
  const ticks = Array.from({ length: 12 }).map((_, i) => {
    const deg = i * 30;
    const a = polar(132, deg);
    const b = polar(120, deg);
    return { i, a, b };
  });

  const bigThree: Array<{ label: string; sign?: string }> = [
    { label: 'Sun', sign: sun?.sign },
    { label: 'Moon', sign: moon?.sign },
    { label: 'Rising', sign: rising?.sign },
  ];

  return (
    <section
      className="relative mx-auto w-full px-5 sm:px-4 py-10"
      style={{ maxWidth: 'min(92vw, 560px)' }}
    >
      {/* share / download stub — OUTSIDE the card, top-right of the section */}
      <div className="flex justify-end mb-3">
        <button
          type="button"
          aria-label="Share or download your Soul Seal"
          onClick={() => console.log('[FinalSoulSeal] share/download stub')}
          className="inline-flex items-center justify-center rounded-full transition-colors min-h-[44px] min-w-[44px]"
          style={{
            width: 44,
            height: 44,
            color: COSMIC.gold,
            background: 'rgba(22,16,42,0.72)',
            border: '1px solid rgba(230,193,121,0.38)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <Share2 size={16} strokeWidth={1.8} />
        </button>
      </div>

      {/* the ceremonial card */}
      <motion.div
        data-share-card
        className="relative mx-auto aspect-[4/5] overflow-hidden rounded-lg p-7 sm:p-9"
        style={{
          maxWidth: 'min(92vw, 520px)',
          background: COSMIC.bg,
          border: '1px solid rgba(230,193,121,0.38)',
          boxShadow: '0 24px 70px rgba(0,0,0,0.55)',
        }}
        initial={reduce ? false : { opacity: 0, y: 18 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-8%' }}
        transition={{ duration: 0.9, ease: EASE }}
      >
        {/* inset hairline rect (inset 18px), drawn as an SVG overlay */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 400 500"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <rect
            x={18}
            y={18}
            width={364}
            height={464}
            rx={6}
            fill="none"
            stroke="#e6c179"
            strokeOpacity={0.22}
            strokeWidth={0.75}
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <div className="relative flex h-full flex-col items-center">
          {/* top label */}
          <motion.div
            className="uppercase text-center"
            style={{
              fontSize: '0.6rem',
              fontWeight: 800,
              letterSpacing: '0.28em',
              color: COSMIC.gold,
            }}
            {...fade(reduce ? 0 : 0.1, 0.6)}
          >
            The Soul Seal
          </motion.div>

          {/* ── the sigil ─────────────────────────────────────────────── */}
          <div className="mt-1.5 w-full flex-1 flex items-start justify-center">
            <svg
              viewBox="0 0 360 360"
              role="img"
              aria-label={`${petName}'s soul seal sigil`}
              className="w-full"
              style={{ maxWidth: 440 }}
            >
              <defs>
                <radialGradient id="fss-field" cx="50%" cy="46%" r="58%">
                  <stop offset="0%" stopColor="#1a1330" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#0a0810" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* faint field behind the sigil */}
              <circle cx={CX} cy={CY} r={146} fill="url(#fss-field)" />

              {/* ── concentric rings (r 132 / 104 / 68) ── */}
              <motion.circle
                cx={CX}
                cy={CY}
                r={132}
                fill="none"
                stroke={COSMIC.gold}
                strokeOpacity={0.55}
                strokeWidth={1.1}
                {...draw(T.ring, 0.8)}
              />
              <motion.circle
                cx={CX}
                cy={CY}
                r={104}
                fill="none"
                stroke={COSMIC.violet}
                strokeOpacity={0.28}
                strokeWidth={0.9}
                {...draw(T.ring + 0.25, 0.7)}
              />
              <motion.circle
                cx={CX}
                cy={CY}
                r={68}
                fill="none"
                stroke={COSMIC.gold}
                strokeOpacity={0.32}
                strokeWidth={0.9}
                {...draw(T.ring + 0.45, 0.7)}
              />

              {/* ── 12 zodiac ticks around outer ring ── */}
              {ticks.map(({ i, a, b }) => (
                <motion.line
                  key={i}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={COSMIC.gold}
                  strokeWidth={1.1}
                  strokeOpacity={0.5}
                  {...fade(reduce ? 0 : T.ticks + i * 0.025, 0.35)}
                />
              ))}

              {/* ── big-three connecting triangle ── */}
              <motion.path
                d={`M${SUN_PT.x} ${SUN_PT.y} L${RISE_PT.x} ${RISE_PT.y} L${MOON_PT.x} ${MOON_PT.y} Z`}
                fill="none"
                stroke="#e6c179"
                strokeOpacity={0.35}
                strokeWidth={1}
                strokeLinejoin="round"
                {...draw(T.triangle, 0.6)}
              />

              {/* big-three glyph nodes */}
              <BigThreeGlyph type="sun" pt={SUN_PT} reduce={reduce} delay={T.triangle + 0.5} />
              <BigThreeGlyph type="moon" pt={MOON_PT} reduce={reduce} delay={T.triangle + 0.6} />
              <BigThreeGlyph type="rising" pt={RISE_PT} reduce={reduce} delay={T.triangle + 0.7} />

              {/* ── dominant element geometry (center) ── */}
              <motion.g
                initial={reduce ? false : { opacity: 0, scale: 0.92 }}
                whileInView={reduce ? undefined : { opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ delay: T.element, duration: 0.6, ease: EASE }}
                style={{ transformOrigin: '180px 180px' }}
              >
                <ElementMark element={element} />
              </motion.g>

              {/* ── archetype line-motif (woven over the inner field) ── */}
              <motion.g {...fade(reduce ? 0 : T.element + 0.15, 0.6)}>
                <ArchetypeMotifMark motif={motif} />
              </motion.g>

              {/* ── aura orbits (drawn last) ── */}
              <AuraOrbits
                primary={auraPrimary}
                secondary={auraSecondary}
                reduce={reduce}
                delay={T.aura}
              />
            </svg>
          </div>

          {/* ── pet name ── */}
          <motion.h2
            className="text-center"
            style={{
              fontFamily: '"DM Serif Display", Cormorant, serif',
              fontSize: 'clamp(1.55rem, 8vw, 2.45rem)',
              lineHeight: 1.05,
              color: COSMIC.text,
              textWrap: 'balance',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              maxWidth: '92%',
            }}
            {...fade(reduce ? 0 : T.name, 0.6)}
          >
            {petName}
          </motion.h2>

          {/* ── Sun / Moon / Rising tokens ── */}
          <motion.div
            className="mt-3 flex w-full items-stretch justify-center gap-2"
            {...fade(reduce ? 0 : T.name + 0.1, 0.55)}
          >
            {bigThree.map((b) => (
              <div
                key={b.label}
                className="flex-1 rounded-md px-2 py-1.5 text-center"
                style={{
                  maxWidth: 110,
                  background: 'rgba(22,16,42,0.6)',
                  border: '1px solid rgba(154,126,230,0.18)',
                }}
              >
                <div
                  className="uppercase"
                  style={{
                    fontSize: '0.5rem',
                    fontWeight: 800,
                    letterSpacing: '0.16em',
                    color: COSMIC.muted,
                  }}
                >
                  {b.label}
                </div>
                <div
                  style={{
                    fontFamily: 'Cormorant, serif',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: COSMIC.text2,
                    lineHeight: 1.2,
                  }}
                >
                  {b.sign || '—'}
                </div>
              </div>
            ))}
          </motion.div>

          {/* ── bottom row: element · archetype · aura swatches ── */}
          <motion.div
            className="mt-3 flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-1"
            {...fade(reduce ? 0 : T.name + 0.2, 0.55)}
          >
            {element && (
              <span
                className="uppercase"
                style={{
                  fontSize: '0.54rem',
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  color: COSMIC.gold,
                }}
              >
                {element}
              </span>
            )}
            {element && archetype && (
              <span style={{ color: COSMIC.muted, fontSize: '0.5rem' }}>·</span>
            )}
            {archetype && (
              <span
                className="uppercase"
                style={{
                  fontSize: '0.54rem',
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  color: COSMIC.violet,
                }}
              >
                {archetype}
              </span>
            )}
            {(auraColors?.primary || auraColors?.secondary) && (
              <span className="inline-flex items-center gap-1">
                {auraColors?.primary && (
                  <span
                    className="inline-block rounded-full"
                    style={{
                      width: 9,
                      height: 9,
                      background: auraPrimary,
                      boxShadow: `0 0 6px ${auraPrimary}`,
                      border: '1px solid rgba(243,236,255,0.25)',
                    }}
                  />
                )}
                {auraColors?.secondary && (
                  <span
                    className="inline-block rounded-full"
                    style={{
                      width: 9,
                      height: 9,
                      background: auraSecondary,
                      boxShadow: `0 0 6px ${auraSecondary}`,
                      border: '1px solid rgba(243,236,255,0.25)',
                    }}
                  />
                )}
              </span>
            )}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

// ── big-three glyphs ────────────────────────────────────────────────────────
function BigThreeGlyph({
  type,
  pt,
  reduce,
  delay,
}: {
  type: 'sun' | 'moon' | 'rising';
  pt: { x: number; y: number };
  reduce: boolean;
  delay: number;
}) {
  const anim = reduce
    ? {}
    : {
        initial: { opacity: 0, scale: 0.5 },
        whileInView: { opacity: 1, scale: 1 },
        viewport: { once: true, margin: '-10%' },
        transition: { delay, type: 'spring' as const, stiffness: 240, damping: 18 },
      };

  return (
    <motion.g style={{ transformOrigin: `${pt.x}px ${pt.y}px` }} {...anim}>
      {/* seat disc */}
      <circle cx={pt.x} cy={pt.y} r={13} fill="#0a0810" stroke="#e6c179" strokeOpacity={0.45} strokeWidth={1} />
      {type === 'sun' && (
        <>
          <circle cx={pt.x} cy={pt.y} r={4.2} fill="none" stroke={COSMIC.goldBright} strokeWidth={1.2} />
          <circle cx={pt.x} cy={pt.y} r={1} fill={COSMIC.goldBright} />
          {Array.from({ length: 8 }).map((_, i) => {
            const t = (i * 45 * Math.PI) / 180;
            const x1 = pt.x + Math.cos(t) * 6.5;
            const y1 = pt.y + Math.sin(t) * 6.5;
            const x2 = pt.x + Math.cos(t) * 9.5;
            const y2 = pt.y + Math.sin(t) * 9.5;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={COSMIC.goldBright} strokeWidth={1} strokeLinecap="round" />;
          })}
        </>
      )}
      {type === 'moon' && (
        <path
          d={`M${pt.x + 2.5} ${pt.y - 6.5} a7 7 0 1 0 0 13 a5.2 5.2 0 1 1 0 -13 Z`}
          fill="none"
          stroke={COSMIC.text2}
          strokeWidth={1.2}
          strokeLinejoin="round"
        />
      )}
      {type === 'rising' && (
        <>
          {/* ascending horizon: arc rising over a line */}
          <path d={`M${pt.x - 7} ${pt.y + 3} A7 7 0 0 1 ${pt.x + 7} ${pt.y + 3}`} fill="none" stroke={COSMIC.violet} strokeWidth={1.3} strokeLinecap="round" />
          <line x1={pt.x - 8.5} y1={pt.y + 4.5} x2={pt.x + 8.5} y2={pt.y + 4.5} stroke={COSMIC.violet} strokeWidth={1.1} strokeLinecap="round" />
          <line x1={pt.x} y1={pt.y - 6} x2={pt.x} y2={pt.y - 1.5} stroke={COSMIC.violet} strokeWidth={1.1} strokeLinecap="round" />
        </>
      )}
    </motion.g>
  );
}

// ── dominant-element geometry ───────────────────────────────────────────────
function ElementMark({ element }: { element: Element | null }) {
  const c = COSMIC.goldBright;
  const stroke = { fill: 'none', stroke: c, strokeWidth: 1.4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

  if (element === 'Fire') {
    return (
      <g>
        <path d="M180 152 L200 196 L160 196 Z" {...stroke} />
        {/* 3 rays above the apex */}
        <line x1={180} y1={148} x2={180} y2={138} {...stroke} />
        <line x1={168} y1={150} x2={162} y2={142} {...stroke} />
        <line x1={192} y1={150} x2={198} y2={142} {...stroke} />
      </g>
    );
  }
  if (element === 'Water') {
    return (
      <g>
        <path d="M160 156 L200 156 L180 200 Z" {...stroke} />
        {/* wave beneath */}
        <path d="M158 210 q7 -8 14 0 t14 0 t14 0" {...stroke} />
      </g>
    );
  }
  if (element === 'Air') {
    return (
      <g>
        <path d="M180 152 L200 196 L160 196 Z" {...stroke} />
        {/* horizontal bar through the body */}
        <line x1={166} y1={182} x2={194} y2={182} {...stroke} />
      </g>
    );
  }
  if (element === 'Earth') {
    return (
      <g>
        <path d="M160 156 L200 156 L180 200 Z" {...stroke} />
        {/* horizontal bar through the body */}
        <line x1={166} y1={176} x2={194} y2={176} {...stroke} />
      </g>
    );
  }
  // unknown element — a quiet central node so the seal never reads empty
  return <circle cx={180} cy={180} r={6} fill="none" stroke={c} strokeWidth={1.3} strokeOpacity={0.6} />;
}

// ── archetype line-motif ────────────────────────────────────────────────────
function ArchetypeMotifMark({ motif }: { motif: ArchetypeMotif }) {
  const c = COSMIC.violet;
  const op = 0.55;
  const stroke = {
    fill: 'none',
    stroke: c,
    strokeOpacity: op,
    strokeWidth: 1.1,
    strokeLinejoin: 'round' as const,
    strokeLinecap: 'round' as const,
  };

  switch (motif) {
    case 'Guardian':
      // shield arc cradling the lower inner field
      return <path d="M130 214 Q180 248 230 214" {...stroke} />;
    case 'Trickster':
      // offset crossing orbit (an ellipse tilted off-axis)
      return (
        <g {...stroke}>
          <ellipse cx={180} cy={180} rx={52} ry={22} transform="rotate(28 180 180)" />
          <ellipse cx={180} cy={180} rx={52} ry={22} transform="rotate(-28 180 180)" strokeOpacity={op * 0.6} />
        </g>
      );
    case 'Mystic':
      // almond / eye path (vesica)
      return (
        <g {...stroke}>
          <path d="M138 180 Q180 154 222 180 Q180 206 138 180 Z" />
          <circle cx={180} cy={180} r={6} strokeOpacity={op * 0.9} />
        </g>
      );
    case 'Sovereign':
      // 3-peak crown across the inner field
      return (
        <path
          d="M146 198 L156 168 L168 188 L180 162 L192 188 L204 168 L214 198 Z"
          {...stroke}
        />
      );
    case 'Healer':
    default:
      // stem with two leaves
      return (
        <g {...stroke}>
          <line x1={180} y1={212} x2={180} y2={168} />
          <path d="M180 188 Q200 182 206 166 Q188 168 180 188 Z" />
          <path d="M180 196 Q160 190 154 174 Q172 176 180 196 Z" strokeOpacity={op * 0.85} />
        </g>
      );
  }
}

// ── aura orbits (drawn last) ────────────────────────────────────────────────
function AuraOrbits({
  primary,
  secondary,
  reduce,
  delay,
}: {
  primary: string;
  secondary: string;
  reduce: boolean;
  delay: number;
}) {
  const draw = (d: number): Record<string, unknown> =>
    reduce
      ? {}
      : {
          initial: { pathLength: 0, opacity: 0 },
          whileInView: { pathLength: 1, opacity: 0.45 },
          viewport: { once: true, margin: '-10%' },
          transition: { duration: 1, delay: d, ease: 'easeInOut' as const },
        };

  // 3 irregular orbits — varied radii, tilt, and dash for a bespoke feel.
  // Subtle drop-shadow glow only (no big blurry orb).
  const orbits = [
    { rx: 124, ry: 118, rot: 14, color: primary, dash: '2 7', sw: 1.25, glow: 1.6 },
    { rx: 138, ry: 110, rot: -22, color: secondary, dash: '5 9', sw: 1.25, glow: 1.4 },
    { rx: 116, ry: 130, rot: 40, color: primary, dash: '1 5', sw: 1.1, glow: 1.4 },
  ];

  return (
    <g>
      {orbits.map((o, i) => (
        <motion.ellipse
          key={i}
          cx={CX}
          cy={CY}
          rx={o.rx}
          ry={o.ry}
          transform={`rotate(${o.rot} ${CX} ${CY})`}
          fill="none"
          stroke={o.color}
          strokeWidth={o.sw}
          strokeDasharray={o.dash}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 ${o.glow}px ${o.color})` }}
          {...draw(delay + i * 0.18)}
        />
      ))}
    </g>
  );
}

export default FinalSoulSeal;
