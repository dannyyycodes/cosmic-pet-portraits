/**
 * Editorial gold divider — thin rule + centered diamond ornament.
 * Used between major V2 funnel sections to create a premium
 * magazine-layout rhythm.
 */

interface GoldDividerProps {
  /** px width of each side line. Default 80. */
  lineWidth?: number;
  /** extra vertical margin above/below. Default 0 (sections have their own). */
  my?: number;
}

export const GoldDivider = ({ lineWidth = 80, my = 0 }: GoldDividerProps) => (
  <div
    className="flex items-center justify-center gap-3 mx-auto"
    style={{ marginTop: my, marginBottom: my }}
    aria-hidden="true"
  >
    <div
      style={{
        width: lineWidth,
        height: 1,
        background:
          "linear-gradient(to right, transparent, var(--gold, #c4a265) 50%, var(--gold, #c4a265))",
        opacity: 0.5,
      }}
    />
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M5 0.5L9.5 5L5 9.5L0.5 5L5 0.5Z"
        stroke="var(--gold, #c4a265)"
        strokeWidth="1"
        opacity="0.7"
      />
      <circle cx="5" cy="5" r="1.2" fill="var(--gold, #c4a265)" opacity="0.5" />
    </svg>
    <div
      style={{
        width: lineWidth,
        height: 1,
        background:
          "linear-gradient(to left, transparent, var(--gold, #c4a265) 50%, var(--gold, #c4a265))",
        opacity: 0.5,
      }}
    />
  </div>
);
