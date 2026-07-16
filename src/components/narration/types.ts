// Narration engine — shared types.
// A warm woman's voice reads a reading aloud with word-by-word highlight sync.
// The backend edge function `narrate-reading` is already live; the front-end
// only calls it and drives the highlight from the returned word timings.

export interface NarrationBlock {
  /** Stable id, unique within one reader (e.g. "beats", "title", "p0"). */
  id: string;
  /** The plain text to speak and to highlight. */
  text: string;
}

export interface NarrationWord {
  /** The spoken token. Punctuation arrives as its own token (e.g. ",", "."). */
  w: string;
  /** Start time in seconds within this block's audio. */
  s: number;
  /** End time in seconds within this block's audio. */
  e: number;
}

export interface NarrationSegmentResult {
  id: string;
  audioUrl: string;
  words: NarrationWord[];
  duration: number;
  cached: boolean;
  empty?: boolean;
}

/** A visible word plus any punctuation merged onto it, with its lit window. */
export interface DisplayUnit {
  text: string;
  s: number;
  e: number;
}

export type NarrationPhase =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'ended'
  | 'error'
  | 'unsupported';

export interface NarrationHandle {
  phase: NarrationPhase;
  isBusy: boolean;
  isPlaying: boolean;
  /** True while any block is on the stage (playing or paused). */
  isActive: boolean;
  available: boolean;
  reduce: boolean;
  /** Id of the block currently being read, or null. */
  activeBlockId: string | null;
  /** Index of the lit word within the active block, or -1. */
  activeUnitIndex: number;
  /** Display units per block id, once fetched. */
  unitsByBlock: Record<string, DisplayUnit[]>;
  toggle: () => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
}
