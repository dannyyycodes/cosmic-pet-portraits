import { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Reveal } from './Reveal';
import { CosmicLineIcon } from './CosmicLineIcon';
import { deDash } from './text';

// ProseSectionFrame
// -----------------------------------------------------------------------------
// A reusable engagement system for the ~11 text-heavy prose sections of the
// Soul Reading so they stop reading as a flat wall of text — WITHOUT touching
// the (sacred, locked) copy. Four distinct variants give each kind of section
// its own rhythm: a pulled proclamation, a constellation timeline, an aura
// field, or a transmission column.
//
// Copy rules: the original content is split, never edited. The first sentence
// becomes the "signal"; the remainder is regrouped into 2-3 sentence chunks in
// verbatim original order. Nothing is rewritten, summarised, or reordered.
//
// Token discipline: ONLY solid hex inside Tailwind arbitrary [] classes. Any
// rgba/gradient lives in inline style objects. Motion is transform/opacity/
// filter/pathLength only and respects prefers-reduced-motion.

const EASE = [0.22, 1, 0.36, 1] as const;
const COLLAPSE_THRESHOLD = 420;

export type ProseVariant =
  | 'oraclePull'
  | 'constellationThread'
  | 'auraField'
  | 'transmission';

// Section-id -> variant. Lets callers stay declarative; ProseSectionFrame reads
// this when no explicit `variant` prop is given.
export const proseVariantById: Record<string, string> = {
  cosmicNickname: 'oraclePull',
  nameMeaning: 'oraclePull',
  eternalArchetype: 'oraclePull',
  celestialChoreography: 'constellationThread',
  accuracyMoments: 'constellationThread',
  luminousField: 'auraField',
  keepersBond: 'auraField',
  basedOnYourAnswers: 'auraField',
  villainOriginStory: 'transmission',
  quirkDecoder: 'transmission',
  petMonologue: 'transmission',
};

interface ProseSectionFrameProps {
  id: string;
  title: string;
  content: string;
  why?: string;
  tip?: { label?: string; text: string };
  iconKey?: string;
  auraColors?: { primary?: string; secondary?: string };
  element?: string;
  /** Force a variant. Defaults to proseVariantById[id] || 'oraclePull'. */
  variant?: ProseVariant;
}

// ---------------------------------------------------------------------------
// Copy derivation — split, never edit.
// ---------------------------------------------------------------------------

const clean = (s: string) => (s || '').replace(/\s+/g, ' ').trim();

// First sentence as the signal. If the first sentence is very long (or the
// text has no terminal punctuation), fall back to a 120-160 char window that
// ends at a word boundary near a sentence end — still verbatim.
function deriveSignal(text: string): { signal: string; rest: string } {
  const c = clean(text);
  if (!c) return { signal: '', rest: '' };

  const sentence = c.match(/^(.+?[.!?])(\s+|$)([\s\S]*)$/);
  if (sentence && sentence[1].length <= 180) {
    return { signal: sentence[1].trim(), rest: clean(sentence[3]) };
  }

  // No clean short sentence — window 120-160 chars, break at last space.
  if (c.length <= 160) return { signal: c, rest: '' };
  let cut = c.lastIndexOf(' ', 160);
  if (cut < 120) cut = c.indexOf(' ', 120);
  if (cut < 0) cut = 160;
  return { signal: c.slice(0, cut).trim(), rest: c.slice(cut).trim() };
}

// Split the remaining body into 2-3 sentence groups, verbatim and in order.
// Honours explicit paragraph breaks first; long paragraphs are then chunked.
function chunkBody(body: string): string[] {
  const c = clean(body);
  if (!c) return [];

  const sentences = c.match(/[^.!?]+[.!?]+(?:["')\]]+)?|\S[^.!?]*$/g) || [c];
  const groups: string[] = [];
  for (let i = 0; i < sentences.length; i += 3) {
    const group = sentences
      .slice(i, i + 3)
      .map((s) => s.trim())
      .join(' ')
      .trim();
    if (group) groups.push(group);
  }
  return groups.length ? groups : [c];
}

const bodyText = (text: string) => clean(text).slice(deriveSignal(text).signal.length).trim();

// ---------------------------------------------------------------------------
// Shared style atoms
// ---------------------------------------------------------------------------

const SERIF = '"DM Serif Display", Georgia, serif';
const BODY_SERIF = 'Cormorant, Georgia, serif';

const stripGlyph = (s: string) =>
  (s || '').replace(/^[←-➿⬀-⯿️\s]+/, '').trim();

function TitleRow({
  title,
  iconKey,
  color = '#e6c179',
}: {
  title: string;
  iconKey?: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span style={{ color, lineHeight: 0 }}>
        <CosmicLineIcon name={iconKey || 'sparkle'} size={17} />
      </span>
      <span
        className="text-[0.74rem] md:text-[0.78rem] uppercase tracking-[0.22em] text-[#e6c179]"
        style={{ color, fontWeight: 700 }}
      >
        {deDash(stripGlyph(title))}
      </span>
    </div>
  );
}

function WhyTip({
  why,
  tip,
}: {
  why?: string;
  tip?: { label?: string; text: string };
}) {
  if (!why && !tip) return null;
  return (
    <div className="mt-7 space-y-4">
      {why && (
        <div
          className="border-l pl-4"
          style={{ borderLeftColor: 'rgba(230,193,121,0.45)' }}
        >
          <div className="text-[0.72rem] uppercase tracking-[0.18em] text-[#b9a8e0] mb-2">
            Why this matters
          </div>
          <p
            className="text-[1.06rem] md:text-[1.12rem] leading-[1.64] text-[#ece5ff] max-w-[62ch]"
            style={{ fontFamily: BODY_SERIF }}
          >
            {deDash(why)}
          </p>
        </div>
      )}
      {tip && (
        <div
          className="border-l pl-4"
          style={{ borderLeftColor: 'rgba(230,193,121,0.45)' }}
        >
          <div className="text-[0.72rem] uppercase tracking-[0.18em] text-[#b9a8e0] mb-2">
            {tip.label || 'A small ritual'}
          </div>
          <p
            className="text-[1.06rem] md:text-[1.12rem] leading-[1.64] text-[#ece5ff] max-w-[62ch]"
            style={{ fontFamily: BODY_SERIF }}
          >
            {deDash(tip.text)}
          </p>
        </div>
      )}
    </div>
  );
}

// Expand / collapse control + animated body container.
function Collapsible({
  open,
  setOpen,
  expanded,
  children,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  expanded: boolean;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();

  if (expanded) return <>{children}</>;

  return (
    <>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="prose-body"
            initial={reduce ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={reduce ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            style={{ overflow: 'hidden' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="group mt-5 inline-flex items-center gap-2 min-h-[44px] py-2.5 text-[0.82rem] uppercase tracking-[0.18em] text-[#b9a8e0]"
        style={{ color: '#b9a8e0' }}
      >
        <span style={{ lineHeight: 0 }}>
          <CosmicLineIcon name={open ? 'spark' : 'star'} size={13} />
        </span>
        <span>{open ? 'Less' : 'Read the full passage'}</span>
        <motion.span
          aria-hidden
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          style={{ display: 'inline-block', lineHeight: 0 }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </motion.span>
      </button>
    </>
  );
}

// Faded preview strip shown while collapsed.
function FadedPreview({ text }: { text: string }) {
  if (!text) return null;
  const preview = text.length > 150 ? `${text.slice(0, 150).trim()}…` : text;
  return (
    <div className="relative mt-4 max-h-[3.6em] overflow-hidden">
      <p
        className="leading-[1.64] text-[#ece5ff] max-w-[62ch]"
        style={{ fontFamily: BODY_SERIF, fontSize: 'clamp(1.06rem, 1.6vw, 1.2rem)' }}
      >
        {preview}
      </p>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-12"
        style={{ background: 'linear-gradient(180deg, rgba(10,8,18,0) 0%, #0a0810 92%)' }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant 1 — oraclePull (identity / proclamation)
// ---------------------------------------------------------------------------

function OraclePull({
  signal,
  chunks,
  bodyRaw,
  expanded,
  open,
  setOpen,
}: VariantInnerProps) {
  return (
    <div className="relative">
      {/* faint radial seal behind the signal */}
      <svg
        aria-hidden
        width="96"
        height="96"
        viewBox="0 0 96 96"
        className="pointer-events-none absolute -top-4 left-0"
        style={{ opacity: 0.12 }}
      >
        <circle cx="48" cy="48" r="46" fill="none" stroke="#e6c179" strokeWidth="1" />
        <circle cx="48" cy="48" r="34" fill="none" stroke="#9a7ee6" strokeWidth="0.75" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={48 + Math.cos(a) * 36}
              y1={48 + Math.sin(a) * 36}
              x2={48 + Math.cos(a) * 46}
              y2={48 + Math.sin(a) * 46}
              stroke="#e6c179"
              strokeWidth="0.75"
            />
          );
        })}
      </svg>

      <p
        className="relative text-[#f3ecff]"
        style={{
          fontFamily: SERIF,
          fontSize: 'clamp(1.35rem, 4vw, 1.85rem)',
          lineHeight: 1.32,
          letterSpacing: '-0.01em',
        }}
      >
        {signal}
      </p>

      {/* quiet body panel: border-y only, transparent fill */}
      {bodyRaw && !expanded && !open && <FadedPreview text={bodyRaw} />}

      {bodyRaw && (
        <Collapsible open={open} setOpen={setOpen} expanded={expanded}>
          <div className="mt-6 border-y border-[#2a1f47] py-7 space-y-5">
            {chunks.map((c, i) => (
              <Reveal key={i} delay={i * 0.06} distance={16} duration={0.6}>
                <p
                  className="leading-[1.64] text-[#ece5ff] max-w-[62ch]"
                  style={{ fontFamily: BODY_SERIF, fontSize: 'clamp(1.06rem, 1.6vw, 1.2rem)' }}
                >
                  {c}
                </p>
              </Reveal>
            ))}
          </div>
        </Collapsible>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant 2 — constellationThread (long explanatory: aspects)
// ---------------------------------------------------------------------------

function ConstellationRail({ nodeCount }: { nodeCount: number }) {
  const reduce = useReducedMotion();
  const n = Math.max(2, nodeCount);
  const top = 14;
  const step = n > 1 ? (170 - top * 2) / (n - 1) : 0;
  const ys = Array.from({ length: n }, (_, i) => top + step * i);
  const x = 36;
  const d = ys.map((y, i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');

  return (
    <svg
      aria-hidden
      width="72"
      height="180"
      viewBox="0 0 72 180"
      className="hidden md:block"
      style={{ overflow: 'visible' }}
    >
      <motion.path
        d={d}
        fill="none"
        stroke="#2a1f47"
        strokeWidth="1.25"
        strokeLinecap="round"
        initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, margin: '-15%' }}
        transition={{ duration: 1.1, ease: EASE }}
      />
      {ys.map((y, i) => {
        const c = i % 2 === 0 ? '#e6c179' : '#9a7ee6';
        return (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r={i === 0 ? 4 : 3}
            fill={c}
            initial={reduce ? { scale: 1, opacity: 1 } : { scale: 0.75, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.5, delay: 0.2 + i * 0.08, ease: EASE }}
            style={{ transformOrigin: `${x}px ${y}px` }}
          />
        );
      })}
    </svg>
  );
}

function ConstellationThread({
  signal,
  chunks,
  bodyRaw,
  iconKey,
  expanded,
  open,
  setOpen,
}: VariantInnerProps) {
  return (
    <div className="grid md:grid-cols-[72px_1fr] gap-x-2">
      <div className="row-span-2 hidden md:flex justify-center">
        <ConstellationRail nodeCount={chunks.length + 1} />
      </div>

      <div>
        <p
          className="text-[#f3ecff]"
          style={{
            fontFamily: SERIF,
            fontSize: 'clamp(1.28rem, 3vw, 1.55rem)',
            lineHeight: 1.36,
          }}
        >
          {signal}
        </p>

        {bodyRaw && !expanded && !open && <FadedPreview text={bodyRaw} />}

        {bodyRaw && (
          <Collapsible open={open} setOpen={setOpen} expanded={expanded}>
            <div className="mt-5 space-y-5">
              {chunks.map((c, i) => (
                <Reveal key={i} delay={i * 0.06} distance={14} duration={0.6}>
                  <div className="pl-5 border-l border-[#2a1f47] flex gap-3">
                    <span
                      className="mt-2 shrink-0"
                      style={{ color: i % 2 === 0 ? '#e6c179' : '#9a7ee6', lineHeight: 0 }}
                    >
                      <CosmicLineIcon
                        name={i % 2 === 0 ? 'star' : iconKey || 'spark'}
                        size={12}
                      />
                    </span>
                    <p
                      className="leading-[1.64] text-[#ece5ff] max-w-[62ch]"
                      style={{ fontFamily: BODY_SERIF, fontSize: 'clamp(1.06rem, 1.6vw, 1.2rem)' }}
                    >
                      {c}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </Collapsible>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant 3 — auraField (emotional / relational)
// ---------------------------------------------------------------------------

function AuraAnchor({
  primary = '#9a7ee6',
  secondary = '#e6c179',
  reduce,
}: {
  primary?: string;
  secondary?: string;
  reduce: boolean;
}) {
  return (
    <svg
      aria-hidden
      width="160"
      height="160"
      viewBox="0 0 160 160"
      className="w-full max-w-[180px]"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="aura-stroke-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={primary} stopOpacity="0.55" />
          <stop offset="100%" stopColor={secondary} stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="aura-stroke-b" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={secondary} stopOpacity="0.4" />
          <stop offset="100%" stopColor={primary} stopOpacity="0.15" />
        </linearGradient>
      </defs>

      {/* three irregular concentric ellipses, stroked only — no filled blob */}
      <motion.g
        animate={reduce ? undefined : { rotate: 360 }}
        transition={reduce ? undefined : { duration: 60, ease: 'linear', repeat: Infinity }}
        style={{ transformOrigin: '80px 80px' }}
      >
        <ellipse cx="80" cy="80" rx="62" ry="50" fill="none" stroke="url(#aura-stroke-a)" strokeWidth="1.25" transform="rotate(-12 80 80)" />
        <ellipse cx="80" cy="80" rx="46" ry="56" fill="none" stroke="url(#aura-stroke-b)" strokeWidth="1.1" transform="rotate(28 80 80)" />
        <ellipse cx="80" cy="80" rx="34" ry="30" fill="none" stroke="url(#aura-stroke-a)" strokeWidth="1" transform="rotate(-40 80 80)" />
      </motion.g>

      {/* one slow orbiting dot */}
      <motion.g
        animate={reduce ? undefined : { rotate: -360 }}
        transition={reduce ? undefined : { duration: 18, ease: 'linear', repeat: Infinity }}
        style={{ transformOrigin: '80px 80px' }}
      >
        <circle cx="80" cy="18" r="2.6" fill={secondary} />
      </motion.g>
    </svg>
  );
}

function AuraField({
  signal,
  chunks,
  bodyRaw,
  auraColors,
  expanded,
  open,
  setOpen,
}: VariantInnerProps) {
  const reduce = !!useReducedMotion();
  const primary = auraColors?.primary || '#9a7ee6';
  const secondary = auraColors?.secondary || '#e6c179';

  return (
    <div className="md:grid md:grid-cols-[1fr_180px] md:gap-8 md:items-start">
      <div>
        {/* mobile aura strip above signal */}
        <div className="md:hidden mb-5 flex justify-center">
          <div className="w-[120px]">
            <AuraAnchor primary={primary} secondary={secondary} reduce={reduce} />
          </div>
        </div>

        <p
          className="text-[#f3ecff]"
          style={{
            fontFamily: SERIF,
            fontSize: 'clamp(1.25rem, 3.4vw, 1.6rem)',
            lineHeight: 1.36,
          }}
        >
          {signal}
        </p>

        {bodyRaw && !expanded && !open && <FadedPreview text={bodyRaw} />}

        {bodyRaw && (
          <Collapsible open={open} setOpen={setOpen} expanded={expanded}>
            <div className="mt-5">
              {chunks.map((c, i) => (
                <Reveal key={i} delay={i * 0.06} distance={14} duration={0.6}>
                  <p
                    className={i === 0 ? 'max-w-[62ch]' : 'border-t pt-6 mt-6 max-w-[62ch]'}
                    style={{
                      fontFamily: BODY_SERIF,
                      ...(i === 0 ? {} : { borderTopColor: 'rgba(243,236,255,0.08)' }),
                    }}
                  >
                    <span
                      className="leading-[1.64] text-[#ece5ff]"
                      style={{ fontSize: 'clamp(1.06rem, 1.6vw, 1.2rem)' }}
                    >
                      {c}
                    </span>
                  </p>
                </Reveal>
              ))}
            </div>
          </Collapsible>
        )}
      </div>

      {/* desktop aura anchor */}
      <div className="hidden md:flex justify-end pt-1">
        <AuraAnchor primary={primary} secondary={secondary} reduce={reduce} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant 4 — transmission (personality / comedy / voice)
// ---------------------------------------------------------------------------

function TransmissionWave({ accent = '#e6c179' }: { accent?: string }) {
  const reduce = useReducedMotion();
  return (
    <svg
      aria-hidden
      width="120"
      height="28"
      viewBox="0 0 120 28"
      className="mb-4"
      style={{ overflow: 'visible' }}
    >
      <motion.path
        d="M2 14 Q12 2 22 14 T42 14 T62 14 T82 14 T102 14 T118 14"
        fill="none"
        stroke={accent}
        strokeWidth="1.25"
        strokeLinecap="round"
        initial={reduce ? { pathLength: 1, opacity: 0.7 } : { pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 0.7 }}
        viewport={{ once: true, margin: '-15%' }}
        transition={{ duration: 1, ease: EASE }}
      />
      <circle cx="60" cy="14" r="2" fill="#9a7ee6" />
    </svg>
  );
}

function CornerMark({ flip }: { flip?: boolean }) {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="#9a86c8"
      strokeWidth="1.3"
      strokeLinecap="round"
      style={{ opacity: 0.6, transform: flip ? 'scaleX(-1)' : undefined }}
    >
      <path d="M2 2v4M2 2h4" />
    </svg>
  );
}

function Transmission({
  signal,
  chunks,
  bodyRaw,
  expanded,
  open,
  setOpen,
}: VariantInnerProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <TransmissionWave />

      <div
        className="border-l pl-5"
        style={{ borderLeftColor: 'rgba(230,193,121,0.5)' }}
      >
        <p
          className="text-[#f3ecff]"
          style={{
            fontFamily: SERIF,
            fontSize: 'clamp(1.28rem, 3.2vw, 1.5rem)',
            lineHeight: 1.36,
          }}
        >
          {signal}
        </p>
      </div>

      {bodyRaw && !expanded && !open && <FadedPreview text={bodyRaw} />}

      {bodyRaw && (
        <Collapsible open={open} setOpen={setOpen} expanded={expanded}>
          <div className="mt-6 space-y-5">
            {chunks.map((c, i) => (
              <Reveal key={i} delay={i * 0.06} distance={14} duration={0.6}>
                <div className={i % 2 === 1 ? 'md:ml-8' : ''}>
                  <CornerMark flip={i % 2 === 1} />
                  <p
                    className="mt-2 leading-[1.64] text-[#ece5ff] max-w-[62ch]"
                    style={{ fontFamily: BODY_SERIF, fontSize: 'clamp(1.06rem, 1.6vw, 1.2rem)' }}
                  >
                    {c}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </Collapsible>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared inner-variant prop shape
// ---------------------------------------------------------------------------

interface VariantInnerProps {
  signal: string;
  chunks: string[];
  bodyRaw: string;
  iconKey?: string;
  auraColors?: { primary?: string; secondary?: string };
  expanded: boolean;
  open: boolean;
  setOpen: (v: boolean) => void;
}

// ---------------------------------------------------------------------------
// Frame
// ---------------------------------------------------------------------------

export function ProseSectionFrame({
  id,
  title,
  content,
  why,
  tip,
  iconKey,
  auraColors,
  variant,
}: ProseSectionFrameProps) {
  const chosen: ProseVariant =
    variant || (proseVariantById[id] as ProseVariant) || 'oraclePull';

  const { signal, chunks, bodyRaw } = useMemo(() => {
    const s = deriveSignal(content);
    const raw = bodyText(content);
    return {
      signal: deDash(s.signal),
      chunks: chunkBody(raw).map(deDash),
      bodyRaw: deDash(raw),
    };
  }, [content]);

  const expanded = clean(content).length < COLLAPSE_THRESHOLD || !bodyRaw;
  const [open, setOpen] = useState(false);

  const inner: VariantInnerProps = {
    signal,
    chunks,
    bodyRaw,
    iconKey,
    auraColors,
    expanded,
    open,
    setOpen,
  };

  return (
    <section id={id} className="scroll-mt-28 py-10 md:py-14">
      <div className="max-w-3xl mx-auto px-5">
        <Reveal>
          <div className="mb-5">
            <TitleRow title={title} iconKey={iconKey} />
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          {chosen === 'constellationThread' ? (
            <ConstellationThread {...inner} />
          ) : chosen === 'auraField' ? (
            <AuraField {...inner} />
          ) : chosen === 'transmission' ? (
            <Transmission {...inner} />
          ) : (
            <OraclePull {...inner} />
          )}
        </Reveal>

        <Reveal delay={0.12}>
          <WhyTip why={why} tip={tip} />
        </Reveal>
      </div>
    </section>
  );
}

export default ProseSectionFrame;
