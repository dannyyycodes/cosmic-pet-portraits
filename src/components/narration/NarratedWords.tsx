import { Fragment } from 'react';
import type { NarrationHandle } from './types';
import './narration.css';

interface NarratedWordsProps {
  /** The block id this text belongs to (matches a NarrationBlock id). */
  blockId: string;
  /** The plain text to show when this block is not being read. */
  text: string;
  nar: NarrationHandle;
}

/**
 * Renders a block's text. When this block is the one being read (and per-word
 * timing is available), it renders each visible word as a span so the current
 * word can glow in sync with the voice. Otherwise it renders the plain text
 * exactly as before, so the reading is always fully legible on its own.
 */
export function NarratedWords({ blockId, text, nar }: NarratedWordsProps) {
  const isActiveBlock = nar.activeBlockId === blockId;
  const units = nar.unitsByBlock[blockId];

  if (!isActiveBlock || nar.reduce || !units || units.length === 0) {
    return <>{text}</>;
  }

  return (
    <>
      {units.map((u, i) => (
        <Fragment key={i}>
          {i > 0 ? ' ' : ''}
          <span
            className={`ls-nar-w${
              i === nar.activeUnitIndex
                ? ' is-lit'
                : i < nar.activeUnitIndex
                ? ' is-read'
                : ''
            }`}
          >
            {u.text}
          </span>
        </Fragment>
      ))}
    </>
  );
}

/**
 * Class helper for the paragraph wrapping a NarratedWords: adds the "being
 * read" state so upcoming words settle back and (in reduced motion) the whole
 * line lifts gently.
 */
export function narratedLineClass(
  blockId: string,
  nar: NarrationHandle,
  base = '',
): string {
  const active = nar.isActive && nar.activeBlockId === blockId;
  if (!active) return base;
  if (nar.reduce || !nar.unitsByBlock[blockId]) {
    return `${base} ls-nar-line is-reading-plain`.trim();
  }
  return `${base} ls-nar-line is-narrating`.trim();
}
