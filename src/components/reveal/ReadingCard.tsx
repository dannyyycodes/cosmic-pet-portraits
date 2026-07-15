import { useId, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Glyph } from './Glyph';
import type { Block, CardModel } from './types';

/* ---- block renderer ------------------------------------------------------ */

function Chevron() {
  return (
    <svg className="rv-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        const key = `${b.kind}-${i}`;
        switch (b.kind) {
          case 'para':
            return <p key={key} className={`rv-blk rv-para${b.lead ? ' rv-para--lead' : ''}`}>{b.text}</p>;
          case 'quote':
            return (
              <blockquote key={key} className="rv-blk rv-quote">
                {b.text}
                {b.cite && <cite>{b.cite}</cite>}
              </blockquote>
            );
          case 'labeled':
            return (
              <div key={key} className="rv-blk rv-labeled">
                <div className="rv-labeled-l">{b.label}</div>
                <div className="rv-labeled-t">{b.text}</div>
              </div>
            );
          case 'list':
            return (
              <div key={key} className="rv-blk">
                {b.label && <div className="rv-labeled-l">{b.label}</div>}
                <ul className={`rv-list${b.ordered ? ' rv-list--ord' : ''}`}>
                  {b.items.map((it, j) => <li key={j}>{it}</li>)}
                </ul>
              </div>
            );
          case 'chips':
            return (
              <div key={key} className="rv-blk rv-chips">
                {b.items.map((c, j) => (
                  <div key={j} className="rv-chipx">
                    <span className="cx-l">{c.label}</span>
                    <span className="cx-v" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {c.swatch && <span className="cx-sw" style={{ background: c.swatch }} />}
                      {c.value}
                    </span>
                  </div>
                ))}
              </div>
            );
          case 'bars':
            return (
              <div key={key} className="rv-blk rv-bars">
                {b.items.map((bar, j) => (
                  <div key={j} className="rv-bar-row">
                    <span className="rv-bar-l">{bar.label}</span>
                    <span className="rv-bar-track">
                      <span className="rv-bar-fill" style={{ width: `${Math.max(4, Math.min(100, bar.value))}%`, background: bar.color }} />
                    </span>
                    <span className="rv-bar-v">{bar.value}</span>
                  </div>
                ))}
              </div>
            );
          case 'exchange':
            return (
              <div key={key} className="rv-blk rv-exchange">
                {b.groups.map((g, gi) => (
                  <div key={gi}>
                    <div className="rv-ex-time">{g.time}</div>
                    {g.turns.map((t, ti) => (
                      <div key={ti} className={`rv-bubble rv-bubble--${t.who}`}>{t.text}</div>
                    ))}
                  </div>
                ))}
              </div>
            );
          default:
            return null;
        }
      })}
    </>
  );
}

/* ---- entrance wrapper ---------------------------------------------------- */

function useEntrance(reduced: boolean) {
  return reduced
    ? {}
    : {
        initial: { opacity: 0, y: 26 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.25, margin: '0px 0px -12% 0px' },
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
      };
}

/* ---- hero card ----------------------------------------------------------- */

function HeroCard({ card, reduced }: { card: CardModel; reduced: boolean }) {
  const entrance = useEntrance(reduced);
  const style = card.accentHex ? ({ ['--rv-accent' as string]: card.accentHex } as React.CSSProperties) : undefined;

  // Imagery-led: show only the opening beat by default, everything else folds
  // behind "Read the rest" so the hero breathes instead of dumping a wall.
  const splitAt = Math.min(1, card.blocks.length);
  const primary = card.blocks.slice(0, splitAt);
  const extra = card.blocks.slice(splitAt);
  const [open, setOpen] = useState(false);

  return (
    <motion.section className="rv-hero" style={style} {...entrance}>
      <div className={`rv-hero-glyph`}>
        <Glyph glyph={card.glyph} type={card.glyphType} />
      </div>
      {card.kicker && <div className="rv-hero-kicker">{card.kicker}</div>}
      <h3 className="rv-hero-sign">{card.signLabel || card.title}</h3>
      <div className="rv-hero-body">
        <Blocks blocks={primary} />
      </div>
      {extra.length > 0 && (
        <>
          <button className="rv-hero-more" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            {open ? 'Fewer words' : 'Read the rest'} <Chevron />
          </button>
          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                className="rv-hero-extra"
                initial={reduced ? undefined : { height: 0, opacity: 0 }}
                animate={reduced ? undefined : { height: 'auto', opacity: 1 }}
                exit={reduced ? undefined : { height: 0, opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{ overflow: 'hidden' }}
                aria-live="polite"
              >
                <div className="rv-card-bodyinner"><Blocks blocks={extra} /></div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.section>
  );
}

/* ---- standard collapsible card ------------------------------------------ */

function CollapsibleCard({ card, reduced }: { card: CardModel; reduced: boolean }) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();
  const entrance = useEntrance(reduced);
  const style = card.accentHex ? ({ ['--rv-accent' as string]: card.accentHex } as React.CSSProperties) : undefined;

  const toggle = () => {
    setOpen((o) => {
      if (!o && !reduced && typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(8);
      return !o;
    });
  };

  return (
    <motion.article className="rv-card" data-open={open} data-tone={card.tone} style={style} {...entrance}>
      <button
        className="rv-card-btn"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={toggle}
      >
        <div className="rv-card-head">
          <span className="rv-card-glyph"><Glyph glyph={card.glyph} type={card.glyphType} /></span>
          <span className="rv-card-heads">
            {card.kicker && <span className="rv-card-kicker">{card.kicker}</span>}
            <h3 className="rv-card-title">{card.title}</h3>
            {!open && <p className="rv-card-essence">{card.essence}</p>}
            <span className="rv-card-toggle">{open ? 'Fold away' : 'Unfold'} <Chevron /></span>
          </span>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={bodyId}
            className="rv-card-body"
            initial={reduced ? undefined : { height: 0, opacity: 0 }}
            animate={reduced ? undefined : { height: 'auto', opacity: 1 }}
            exit={reduced ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
            aria-live="polite"
          >
            <div className="rv-card-bodyinner"><Blocks blocks={card.blocks} /></div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

export function ReadingCard({ card }: { card: CardModel }) {
  const reduced = !!useReducedMotion();
  if (card.tier === 'hero') return <HeroCard card={card} reduced={reduced} />;
  return <CollapsibleCard card={card} reduced={reduced} />;
}
