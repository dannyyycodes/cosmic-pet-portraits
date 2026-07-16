import type { NarrationHandle } from './types';
import './narration.css';

interface NarrationControlProps {
  nar: NarrationHandle;
  /** Resting label, e.g. "Hear it read to you". */
  idleLabel?: string;
  /** Shown while the voice is being fetched. */
  busyLabel?: string;
  /** Shown while reading. */
  playingLabel?: string;
  /** Shown if the voice could not load; tap retries. */
  failedLabel?: string;
  /** Icon-only pill for tight rows. Label stays for screen readers. */
  mini?: boolean;
  className?: string;
  /** Fires before toggle — e.g. expand a collapsed section first. */
  onBeforeToggle?: () => void;
}

function PlayMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.2c0-.9 1-1.5 1.8-1L18 9.1c.8.5.8 1.6 0 2.1l-8.2 4.9c-.8.5-1.8-.1-1.8-1V5.2z" transform="translate(-1 0)" />
    </svg>
  );
}

function PauseMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="7" y="5.5" width="3.4" height="13" rx="1.4" />
      <rect x="13.6" y="5.5" width="3.4" height="13" rx="1.4" />
    </svg>
  );
}

function LoadingMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="rgba(255,255,255,0.28)" strokeWidth="2.4" />
      <path
        className="ls-nar-ring"
        d="M12 4a8 8 0 0 1 8 8"
        stroke="#ffffff"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * The voice affordance. A soft violet glow, a warm-white mark, and live voice
 * bars while reading. Never gold (not a luminary), never a stock media player.
 */
export function NarrationControl({
  nar,
  idleLabel = 'Hear it read to you',
  busyLabel = 'Warming the voice',
  playingLabel = 'Reading aloud',
  failedLabel = 'Try the voice again',
  mini = false,
  className = '',
  onBeforeToggle,
}: NarrationControlProps) {
  if (!nar.available) return null;

  const failed = nar.phase === 'error';
  const label = nar.isBusy
    ? busyLabel
    : nar.isPlaying
    ? playingLabel
    : failed
    ? failedLabel
    : idleLabel;

  const aria = nar.isBusy
    ? 'Loading the reading'
    : nar.isPlaying
    ? 'Pause the reading'
    : failed
    ? 'Try loading the reading again'
    : 'Play the reading aloud';

  return (
    <button
      type="button"
      className={`ls-nar-ctrl${nar.isPlaying ? ' is-playing' : ''}${
        nar.isBusy ? ' is-busy' : ''
      }${failed ? ' is-failed' : ''}${mini ? ' is-mini' : ''} ${className}`.trim()}
      aria-label={aria}
      aria-pressed={nar.isPlaying}
      onClick={(e) => {
        e.stopPropagation();
        onBeforeToggle?.();
        nar.toggle();
      }}
    >
      <span className="ls-nar-disc">
        {nar.isBusy ? <LoadingMark /> : nar.isPlaying ? <PauseMark /> : <PlayMark />}
      </span>
      {nar.isPlaying && !mini && (
        <span className="ls-nar-bars" aria-hidden="true">
          <i /><i /><i /><i />
        </span>
      )}
      <span className="ls-nar-label">{label}</span>
    </button>
  );
}
