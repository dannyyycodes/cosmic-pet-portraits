/* Deck resume snapshot — recovery mechanics for the free reading.
 *
 * The chart is a pure function of the birth date, so the whole computed deck
 * can be rebuilt from this tiny snapshot: refetch the chart for the stored
 * date, recompose the deck, reopen at the stored card index. Lives in
 * localStorage (not sessionStorage) so it survives both a same-tab reload
 * AND a fresh tab opened from an emailed deep link (/v2?resume=1).
 *
 * Written when a chart computes; the card index is patched on every deck
 * advance. Snapshots older than 30 days are treated as absent.
 */

export type ResumeSnapshot = {
  name: string | null;
  date: string; // YYYY-MM-DD — the only input the chart needs
  species: string | null;
  email: string | null;
  photo: string | null;
  index: number; // last open card in the free deck
  ts: number;
};

const KEY = "ls_resume";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export function readResume(): ResumeSnapshot | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<ResumeSnapshot> | null;
    if (!v || typeof v.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v.date)) return null;
    if (typeof v.ts === "number" && Date.now() - v.ts > MAX_AGE_MS) return null;
    return {
      name: typeof v.name === "string" && v.name ? v.name : null,
      date: v.date,
      species: v.species === "dog" || v.species === "cat" || v.species === "other" ? v.species : null,
      email: typeof v.email === "string" && v.email ? v.email : null,
      photo: typeof v.photo === "string" && v.photo ? v.photo : null,
      index: typeof v.index === "number" && Number.isFinite(v.index) ? Math.max(0, Math.floor(v.index)) : 0,
      ts: typeof v.ts === "number" ? v.ts : 0,
    };
  } catch {
    return null;
  }
}

export function saveResume(snap: Omit<ResumeSnapshot, "ts">): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...snap, ts: Date.now() }));
  } catch {
    /* private mode — the reading still works, it just cannot be resumed */
  }
}

/* Merge a partial update into an existing snapshot. A no-op when no snapshot
 * exists yet, so stray writes can never invent a resumable reading. */
export function patchResume(patch: Partial<Omit<ResumeSnapshot, "ts">>): void {
  const cur = readResume();
  if (!cur) return;
  saveResume({ ...cur, ...patch });
}

export function saveResumeIndex(index: number): void {
  patchResume({ index });
}
