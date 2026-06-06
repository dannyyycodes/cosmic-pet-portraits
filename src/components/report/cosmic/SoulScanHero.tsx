import { useReducedMotion, motion } from 'framer-motion';
import { COSMIC } from './tokens';
import { CosmicLineIcon } from './CosmicLineIcon';
import { deDash } from './text';

interface SoulScanHeroProps {
  petName: string;
  sunSign: string;
  moonSign: string;
  ascendant: string;
  element: string;
  archetype: string;
  archetypeDesc: string;
  portraitUrl?: string;
}

// Cinematic opening: a "soul scan". A natal ring sweeps like radar around the
// pet, four placement nodes ping into place, the name resolves from light, then
// the data settles into readable pills. The first impression of the reading.
export function SoulScanHero({
  petName, sunSign, moonSign, ascendant, element, archetype, archetypeDesc, portraitUrl,
}: SoulScanHeroProps) {
  const reduce = !!useReducedMotion();
  const RING = 230;          // ring diameter (desktop)
  const R = RING / 2;
  const disc = 150;          // photo disc diameter

  const nodes = [
    { key: 'sun', icon: 'sun', label: 'Sun', value: sunSign, angle: -90, c: '#f6a02a' },
    { key: 'moon', icon: 'moon', label: 'Moon', value: moonSign, angle: 18, c: '#c7c2da' },
    ...(ascendant ? [{ key: 'asc', icon: 'compass', label: 'Rising', value: ascendant, angle: 162, c: '#9fbce6' }] : []),
    { key: 'el', icon: element ? element.toLowerCase() : 'spark', label: 'Element', value: element, angle: ascendant ? 90 : 126, c: '#9a7ee6' },
  ];
  const polar = (deg: number, r: number) => {
    const t = (deg * Math.PI) / 180;
    return { x: R + Math.cos(t) * r, y: R + Math.sin(t) * r };
  };

  const appear = (delay: number) => reduce ? {} : ({
    initial: { opacity: 0, scale: 0.4 }, animate: { opacity: 1, scale: 1 },
    transition: { delay, type: 'spring' as const, stiffness: 240, damping: 18 },
  });

  return (
    <section className="relative overflow-hidden" style={{ background: COSMIC.bg }}>
      {/* starfield + vertical light beam */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true" style={{
        background:
          'radial-gradient(1.4px 1.4px at 18% 22%, rgba(255,255,255,0.7), transparent),' +
          'radial-gradient(1.3px 1.3px at 72% 30%, rgba(216,197,245,0.6), transparent),' +
          'radial-gradient(1.5px 1.5px at 40% 70%, rgba(255,236,180,0.55), transparent),' +
          'radial-gradient(1.1px 1.1px at 88% 64%, rgba(255,255,255,0.5), transparent),' +
          'radial-gradient(1.2px 1.2px at 9% 56%, rgba(216,197,245,0.5), transparent),' +
          'radial-gradient(ellipse 70% 50% at 50% 26%, rgba(154,126,230,0.18), transparent 70%)',
        backgroundRepeat: 'no-repeat',
      }} />
      <div className="absolute left-1/2 top-0 pointer-events-none" aria-hidden="true" style={{
        width: 320, height: '46%', transform: 'translateX(-50%)',
        background: 'radial-gradient(ellipse 50% 100% at 50% 0%, rgba(230,193,121,0.12), transparent 72%)',
      }} />

      <div className="relative mx-auto max-w-[560px] px-6 pt-14 pb-12 text-center">
        {/* scan eyebrow */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="uppercase" style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.34em', color: COSMIC.gold }}
        >
          Aligning the stars
        </motion.div>

        {/* the natal scan ring */}
        <div className="relative mx-auto mt-7" style={{ width: RING, height: RING, maxWidth: '86vw' }}>
          <svg viewBox={`0 0 ${RING} ${RING}`} className="absolute inset-0 w-full h-full" aria-hidden="true">
            {/* concentric rings draw in */}
            <motion.circle cx={R} cy={R} r={R - 2} fill="none" stroke={COSMIC.gold} strokeOpacity={0.4} strokeWidth={1}
              {...(reduce ? {} : { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 1.1, ease: 'easeInOut' } })} />
            <motion.circle cx={R} cy={R} r={R - 18} fill="none" stroke={COSMIC.violet} strokeOpacity={0.22} strokeWidth={1}
              {...(reduce ? {} : { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 1.1, delay: 0.15, ease: 'easeInOut' } })} />
            {/* 24 zodiac ticks */}
            {Array.from({ length: 24 }).map((_, i) => {
              const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
              const major = i % 2 === 0;
              const ro = R - 2, ri = R - (major ? 11 : 6);
              return <line key={i} x1={R + Math.cos(a) * ro} y1={R + Math.sin(a) * ro}
                x2={R + Math.cos(a) * ri} y2={R + Math.sin(a) * ri}
                stroke={COSMIC.gold} strokeOpacity={major ? 0.45 : 0.2} strokeWidth={major ? 1.2 : 0.7} />;
            })}
            {/* node connector lines */}
            {nodes.map((n, i) => {
              const p = polar(n.angle, R - 24);
              return <motion.line key={n.key} x1={R} y1={R} x2={p.x} y2={p.y}
                stroke={n.c} strokeOpacity={0.3} strokeWidth={0.8}
                {...(reduce ? {} : { initial: { pathLength: 0, opacity: 0 }, animate: { pathLength: 1, opacity: 1 }, transition: { delay: 1.2 + i * 0.18, duration: 0.5 } })} />;
            })}
          </svg>

          {/* radar sweep */}
          {!reduce && (
            <motion.div className="absolute inset-0" aria-hidden="true"
              initial={{ rotate: 0, opacity: 0 }} animate={{ rotate: 360, opacity: [0, 1, 1, 0] }}
              transition={{ duration: 2.2, ease: 'easeInOut', times: [0, 0.1, 0.85, 1] }}
              style={{ borderRadius: '50%',
                background: `conic-gradient(from 0deg, transparent 0deg, ${COSMIC.gold}00 280deg, ${COSMIC.gold}44 350deg, ${COSMIC.gold}88 360deg)`,
                WebkitMaskImage: 'radial-gradient(circle, transparent 50%, #000 51%)',
                maskImage: 'radial-gradient(circle, transparent 50%, #000 51%)' }} />
          )}

          {/* center disc: photo or glyph */}
          <motion.div
            initial={reduce ? false : { scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute rounded-full overflow-hidden"
            style={{ width: disc, height: disc, left: (RING - disc) / 2, top: (RING - disc) / 2,
              border: `2px solid ${COSMIC.gold}99`, boxShadow: `0 0 44px ${COSMIC.gold}33, inset 0 0 24px rgba(0,0,0,0.4)` }}
          >
            {portraitUrl ? (
              <img src={portraitUrl} alt={petName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: COSMIC.raised, color: COSMIC.gold }}>
                <CosmicLineIcon name="star" size={48} />
              </div>
            )}
            <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset -8px -10px 30px rgba(0,0,0,0.5)' }} />
          </motion.div>

          {/* placement nodes pinging in around the ring */}
          {nodes.map((n, i) => {
            const p = polar(n.angle, R - 24);
            return (
              <motion.div key={n.key} className="absolute" style={{ left: p.x, top: p.y, transform: 'translate(-50%,-50%)' }}
                {...appear(1.3 + i * 0.18)}>
                <span className="block rounded-full" style={{ width: 9, height: 9, background: n.c, boxShadow: `0 0 10px ${n.c}` }} />
              </motion.div>
            );
          })}
        </div>

        {/* archetype + name resolve from light */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 2.0, duration: 0.7 }}
          className="mt-8 uppercase" style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.26em', color: COSMIC.gold }}
        >
          {deDash(archetype)}
        </motion.div>

        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 16, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: reduce ? 0 : 2.15, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          style={{ fontFamily: '"DM Serif Display", Georgia, serif', color: '#f8f3ff',
            fontSize: 'clamp(2.6rem, 11vw, 4rem)', lineHeight: 1.04, marginTop: 6,
            textShadow: '0 0 30px rgba(230,193,121,0.25)' }}
        >
          {petName}
        </motion.h1>

        {archetypeDesc && (
          <motion.p
            initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: reduce ? 0 : 2.5, duration: 0.8 }}
            className="mx-auto mt-3" style={{ fontFamily: 'Cormorant, Georgia, serif', fontStyle: 'italic',
              color: COSMIC.text2, fontSize: '1.12rem', lineHeight: 1.5, maxWidth: 360 }}
          >
            {deDash(archetypeDesc)}
          </motion.p>
        )}

        {/* settled placement pills */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 2.7, duration: 0.7 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-2"
        >
          {nodes.map((n) => (
            <span key={n.key} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5"
              style={{ background: 'rgba(22,16,42,0.6)', border: `1px solid ${n.c}55`, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
              <span style={{ color: n.c, lineHeight: 0 }}><CosmicLineIcon name={n.icon} size={13} /></span>
              <span className="uppercase" style={{ fontSize: '0.56rem', fontWeight: 800, letterSpacing: '0.12em', color: COSMIC.muted }}>{n.label}</span>
              <span style={{ color: '#f3ecff', fontWeight: 600, fontFamily: 'Cormorant, Georgia, serif', fontSize: '0.95rem' }}>{n.value}</span>
            </span>
          ))}
        </motion.div>

        {/* scroll cue */}
        <motion.div
          initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: reduce ? 0 : 3.0, duration: 0.8 }}
          className="mt-10 flex flex-col items-center gap-2" aria-hidden="true"
        >
          <span className="uppercase" style={{ fontSize: '0.56rem', letterSpacing: '0.3em', color: COSMIC.muted }}>The reading begins</span>
          <motion.span animate={reduce ? undefined : { y: [0, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ color: COSMIC.gold, lineHeight: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
          </motion.span>
        </motion.div>
      </div>
    </section>
  );
}
