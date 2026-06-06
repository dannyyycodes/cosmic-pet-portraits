import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CosmicPlanet } from './CosmicPlanet';
import { Reveal } from './Reveal';
import { COSMIC, TYPE, PlanetPreset } from './tokens';
import { deDash } from './text';

interface PlanetReadingCardProps {
  id: string;
  preset: PlanetPreset;
  index: number;        // 0-based section order
  total: number;
  title: string;        // section.title
  content: string;      // section.content (sacred copy — never rewritten)
  placement?: { sign: string; degree: number };
}

const stripGlyph = (s: string) =>
  s.replace(/^[←-⇿⌀-➿☀-➿⬀-⯿️\s]+/, '').trim();

// Split sacred copy WITHOUT editing it: first sentence = the "signal" takeaway,
// the remainder = the full reading shown in a premium reading-room reveal.
function splitCopy(content: string) {
  const clean = content.trim();
  const m = clean.match(/^(.+?[.!?])(\s+)([\s\S]*)$/);
  if (!m) return { signal: clean, rest: '' };
  return { signal: m[1].trim(), rest: m[3].trim() };
}

export function PlanetReadingCard({
  id, preset, index, total, title, content, placement,
}: PlanetReadingCardProps) {
  const [open, setOpen] = useState(false);
  // Cap the planet hero on small screens so it leaves room for text at 390px.
  // The orb's metadata ring extends ~1.34x, so 176 -> ~236px ring is too large
  // on mobile; 140 -> ~188px ring stacks cleanly above the reading.
  const [planetSize, setPlanetSize] = useState(176);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 640px)');
    const apply = () => setPlanetSize(mq.matches ? 176 : 140);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  const planetRight = index % 2 === 1;
  const { signal, rest } = splitCopy(content);
  const num = String(index + 1).padStart(2, '0');
  const tot = String(total).padStart(2, '0');

  return (
    <section
      id={`planet-${id}`}
      className="relative my-8 sm:my-10 px-5 sm:px-4 mx-auto max-w-[900px] scroll-mt-28"
    >
      <div
        className={`relative flex flex-col items-center gap-7 sm:gap-10 ${planetRight ? 'sm:flex-row-reverse' : 'sm:flex-row'}`}
      >
        {/* Planet hero */}
        <Reveal from={planetRight ? 'left' : 'right'} className="shrink-0">
          <div className="flex flex-col items-center">
            <CosmicPlanet preset={preset} size={planetSize} degree={placement?.degree} />
            <div className="mt-3 text-center" style={{ color: preset.accent }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.22em' }}
                   className="uppercase opacity-90">
                {preset.planet}
              </div>
            </div>
          </div>
        </Reveal>

        {/* Content */}
        <div className="flex-1 min-w-0 w-full text-center sm:text-left">
          <Reveal delay={0.08}>
            {/* eyebrow: planet number / total */}
            <div className="flex items-center gap-2 justify-center sm:justify-start mb-2"
                 style={{ color: preset.accent }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, letterSpacing: TYPE.labelTrack }}
                    className="uppercase">Planet {num}</span>
              <span style={{ width: 22, height: 1, background: preset.accent, opacity: 0.4 }} />
              <span style={{ fontSize: '0.74rem', letterSpacing: '0.14em', color: '#b9a8e0' }}>{num} / {tot}</span>
            </div>

            {/* title */}
            <h3 style={{
              fontFamily: '"DM Serif Display", Georgia, serif', color: COSMIC.text,
              fontSize: TYPE.cardTitle, lineHeight: 1.18, letterSpacing: '-0.01em',
            }}>
              {deDash(stripGlyph(title))}
            </h3>

            {/* placement chip */}
            {placement && (
              <div className="mt-2.5 inline-flex items-center gap-2 rounded-full px-3 py-1"
                   style={{ background: 'rgba(154,126,230,0.10)', border: `1px solid ${preset.accent}3a` }}>
                <span style={{ width: 5, height: 5, borderRadius: 99, background: preset.glow }} />
                <span style={{ fontSize: '0.84rem', color: COSMIC.text2, fontFamily: 'Cormorant, serif' }}>
                  {preset.planet} in <span style={{ color: preset.accent, fontWeight: 600 }}>{placement.sign}</span> · {placement.degree}°
                </span>
              </div>
            )}

            {/* signal — the takeaway, high-contrast */}
            <p className="mt-4" style={{
              fontFamily: '"DM Serif Display", Georgia, serif', color: COSMIC.text,
              fontSize: 'clamp(1.1rem,2.1vw,1.35rem)', lineHeight: 1.4,
            }}>
              {deDash(signal)}
            </p>
          </Reveal>

          {/* reading room — the rest of the sacred copy, revealed in place */}
          {rest && (
            <>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    key="room"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="mt-4 pl-4 sm:pl-5 text-left max-w-[62ch]"
                         style={{ borderLeft: `2px solid ${preset.accent}55` }}>
                      {rest.split(/\n{2,}/).map((para, i) => (
                        <p key={i} className="mb-4 last:mb-0" style={{
                          fontFamily: 'Cormorant, Georgia, serif', color: '#ece5ff',
                          fontSize: 'clamp(1.06rem,1.6vw,1.2rem)', lineHeight: 1.64,
                        }}>{deDash(para)}</p>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={() => setOpen((v) => !v)}
                className="group mt-3 inline-flex items-center gap-2 min-h-[44px] py-2.5"
                style={{ color: preset.accent, fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.16em' }}
              >
                <span className="uppercase">{open ? 'Close reading' : 'Continue the reading'}</span>
                <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}
                  style={{ display: 'inline-block', lineHeight: 0 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
                </motion.span>
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
