import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll } from 'framer-motion';
import './reveal.css';
import { StarfieldCanvas } from './StarfieldCanvas';
import { NatalWheel } from './NatalWheel';
import { Chapter } from './Chapter';
import { KeepsakeSeal } from './KeepsakeSeal';
import { buildChapters } from './chapters';
import { bigThree, PLANETS } from './astro';
import { heroMobile, heroWide } from './assets';
import type { ChapterModel, RevealReport } from './types';

/* -------- invocation header (ceremonial open) -------- */

function useTypewriter(full: string, enabled: boolean, speed = 55) {
  const [out, setOut] = useState(enabled ? '' : full);
  useEffect(() => {
    if (!enabled) { setOut(full); return; }
    let i = 0;
    setOut('');
    const id = setInterval(() => {
      i += 1;
      setOut(full.slice(0, i));
      if (i >= full.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [full, enabled, speed]);
  return out;
}

function InvocationHeader({ data, reduced }: { data: RevealReport; reduced: boolean }) {
  const isMemorial = data.occasionMode === 'memorial';
  const summonFull = `${isMemorial ? 'Remembering' : 'Summoning'} ${data.petName}`;
  const typed = useTypewriter(summonFull, !reduced);
  const done = typed.length >= summonFull.length;

  const { sun, moon, rising } = bigThree(data.report?.chartPlacements || {});
  const species = data.species ? data.species.charAt(0).toUpperCase() + data.species.slice(1) : null;
  const breedLine = [data.breed, species].filter(Boolean).join(' · ');

  // date of birth from the "based on your answers" mapping, if present
  const dob = useMemo(() => {
    const maps = data.report?.basedOnYourAnswers?.mappings;
    if (!Array.isArray(maps)) return null;
    const m = maps.find((x: any) => /date of birth/i.test(x?.question || ''));
    return m?.yourAnswer && !/not provided|not selected/i.test(m.yourAnswer) ? m.yourAnswer : null;
  }, [data]);

  const nameEntrance = reduced
    ? {}
    : { initial: { opacity: 0, y: 18, filter: 'blur(8px)' }, animate: { opacity: 1, y: 0, filter: 'blur(0px)' }, transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] as const } };

  // Their own face, framed in violet, the moment their name is summoned. The
  // uploaded photo leads; the generated portrait stands in if there is one and
  // no upload; if neither exists the block simply is not there.
  const heroPhoto = data.petPhotoUrl || data.portraitUrl;

  return (
    <header className="rv-invocation">
      <div className="rv-invocation-bg" aria-hidden="true">
        <picture>
          <source media="(max-width: 640px)" srcSet={heroMobile('ch1-invocation')} />
          <img src={heroWide('ch1-invocation')} alt="" fetchPriority="high" decoding="async" draggable={false} />
        </picture>
      </div>
      <div className="rv-summon" aria-hidden="true">
        {typed}{!done && <span className="rv-caret" />}
      </div>
      <motion.h1 className="rv-petname" {...(done || reduced ? nameEntrance : { initial: { opacity: 0 }, animate: { opacity: 0 } })}>
        {data.petName}
      </motion.h1>
      {heroPhoto && (
        <motion.div
          className="rv-invocation-photo"
          initial={reduced ? undefined : { opacity: 0, scale: 0.92, filter: 'blur(12px)' }}
          animate={reduced ? undefined : (done ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : { opacity: 0, scale: 0.92 })}
          transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1], delay: done ? 0.4 : 0 }}
        >
          <span className="rv-invocation-photo-glow" aria-hidden="true" />
          <span className="rv-invocation-photo-frame">
            <img src={heroPhoto} alt={data.petName} decoding="async" draggable={false} />
          </span>
          <span className="rv-invocation-photo-ring" aria-hidden="true" />
        </motion.div>
      )}
      {(sun || moon || rising) && (
        <p className="rv-birthline">
          {[sun && `Sun in ${sun}`, moon && `Moon in ${moon}`, rising && `${rising} Rising`].filter(Boolean).join('  ·  ')}
        </p>
      )}
      <div className="rv-birthchips">
        {breedLine && <span className="rv-chip">{breedLine}</span>}
        {dob && <span className="rv-chip"><span className="rv-glyph">✶</span> {dob}</span>}
      </div>
      <div className="rv-scrollcue" aria-hidden="true">
        <span className="rv-mouse" />
        <span>{isMemorial ? 'Begin remembering' : 'Begin the reading'}</span>
      </div>
    </header>
  );
}

/* -------- wheel scene -------- */

function WheelScene({ data, reduced }: { data: RevealReport; reduced: boolean }) {
  const sceneRef = useRef<HTMLElement | null>(null);
  const isMemorial = data.occasionMode === 'memorial';
  return (
    <section className="rv-wheel-scene" ref={sceneRef} style={{ height: reduced ? 'auto' : '260vh' }}>
      <div className="rv-wheel-sticky">
        <span className="rv-wheel-eyebrow">Their sky, the moment they arrived</span>
        <div className="rv-wheel-stage">
          <div className="rv-wheel-aura" aria-hidden="true" />
          <div className="rv-wheel-holder">
            <NatalWheel
              placements={data.report?.chartPlacements || {}}
              mode={reduced ? 'static' : 'draw'}
              reduced={reduced}
              sceneRef={sceneRef}
            />
          </div>
        </div>
        <p className="rv-wheel-caption">
          {isMemorial
            ? `This is the sky that held ${data.petName} the day they were born, drawn once more so you can keep it.`
            : `This is ${data.petName}’s sky, exactly as it turned the moment they were born.`}
        </p>
      </div>
    </section>
  );
}

/* -------- main -------- */

export function RevealExperience({ data }: { data: RevealReport }) {
  const reduced = !!useReducedMotion();
  const chapters = useMemo(() => buildChapters(data), [data]);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const wheelSentinelRef = useRef<HTMLDivElement | null>(null);

  const [active, setActive] = useState<ChapterModel>(chapters[0]);
  const [pastWheel, setPastWheel] = useState(false);
  const [wheelModal, setWheelModal] = useState(false);

  const { scrollYProgress } = useScroll();

  const onActive = useCallback((ch: ChapterModel) => setActive(ch), []);

  // drive the colour-wash + accent from the active chapter
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    el.style.setProperty('--rv-wash-a', active.washA);
    el.style.setProperty('--rv-wash-b', active.washB);
    el.style.setProperty('--rv-accent', active.accent);
  }, [active]);

  // show the mini wheel once the wheel scene has scrolled past
  useEffect(() => {
    const el = wheelSentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        setPastWheel(!e.isIntersecting && e.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // escape closes the wheel modal
  useEffect(() => {
    if (!wheelModal) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setWheelModal(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [wheelModal]);

  const legendPlanets = useMemo(() => {
    const pl = data.report?.chartPlacements || {};
    return PLANETS.filter((p) => pl[p.key]?.sign).map((p) => ({
      ...p, sign: pl[p.key].sign, lit: ['sun', 'moon', 'ascendant'].includes(p.key),
    }));
  }, [data]);

  return (
    <div className="reveal-root" ref={rootRef}>
      <StarfieldCanvas accent={active.accent} reduced={reduced} />
      <div className="rv-wash" />
      <div className="rv-vignette" />

      {!reduced && <motion.div className="rv-progress" style={{ scaleX: scrollYProgress }} aria-hidden="true" />}

      <div className="rv-chapmark" aria-hidden="true">
        <span>{active.numeral}</span>
        <b>{active.title}</b>
      </div>

      <div className="rv-stage">
        <InvocationHeader data={data} reduced={reduced} />
        <WheelScene data={data} reduced={reduced} />
        <div ref={wheelSentinelRef} aria-hidden="true" />

        {chapters.map((ch, i) => (
          <Chapter
            key={ch.id}
            chapter={ch}
            onActive={onActive}
            eagerHero={i === 0}
            isMemorial={data.occasionMode === 'memorial'}
          >
            {ch.special === 'legacy' && <KeepsakeSeal data={data} />}
          </Chapter>
        ))}
      </div>

      {/* sticky mini wheel */}
      {pastWheel && !wheelModal && (
        <button className="rv-mini-wheel" onClick={() => setWheelModal(true)} aria-label="Open the natal chart wheel">
          <NatalWheel placements={data.report?.chartPlacements || {}} mode="static" compact reduced />
          <span className="rv-mini-label">Their chart</span>
        </button>
      )}

      {/* wheel overlay */}
      {wheelModal && (
        <div className="rv-wheel-overlay" role="dialog" aria-modal="true" aria-label="Natal chart wheel" onClick={() => setWheelModal(false)}>
          <button className="rv-overlay-close" onClick={() => setWheelModal(false)} aria-label="Close">×</button>
          <div className="rv-wheel-holder" onClick={(e) => e.stopPropagation()}>
            <NatalWheel placements={data.report?.chartPlacements || {}} mode="static" interactive reduced />
          </div>
          <div className="rv-legend" onClick={(e) => e.stopPropagation()}>
            {legendPlanets.map((p) => (
              <div key={p.key} className={p.lit ? 'lg-lit' : ''}>
                <span className="lg-glyph">{p.glyph}</span>
                <span>{p.name} in {p.sign}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default RevealExperience;
