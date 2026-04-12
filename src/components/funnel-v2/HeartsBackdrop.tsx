import { Heart } from "lucide-react";

/* ── Hearts backdrop — subtle love-hearts pattern for the benefits + checkout band ── */

type HeartItem = {
  x: number; y: number; size: number; rot: number; op: number; fill?: boolean;
};

const BENEFIT_HEARTS: HeartItem[] = [
  // Top edge
  { x: 4,  y: 4,  size: 22, rot: -12, op: 0.14, fill: true  },
  { x: 18, y: 8,  size: 28, rot: 10,  op: 0.16, fill: false },
  { x: 32, y: 5,  size: 20, rot: 14,  op: 0.12, fill: true  },
  { x: 46, y: 9,  size: 32, rot: -6,  op: 0.15, fill: false },
  { x: 62, y: 4,  size: 22, rot: 12,  op: 0.13, fill: true  },
  { x: 76, y: 8,  size: 26, rot: -14, op: 0.15, fill: false },
  { x: 92, y: 5,  size: 20, rot: 6,   op: 0.13, fill: true  },

  // Upper-mid
  { x: 8,  y: 24, size: 26, rot: 14,  op: 0.14, fill: false },
  { x: 28, y: 28, size: 20, rot: -10, op: 0.12, fill: true  },
  { x: 52, y: 26, size: 30, rot: 4,   op: 0.15, fill: false },
  { x: 76, y: 30, size: 22, rot: -16, op: 0.13, fill: true  },
  { x: 94, y: 24, size: 24, rot: 8,   op: 0.14, fill: false },

  // Middle
  { x: 4,  y: 48, size: 22, rot: -8,  op: 0.12, fill: true  },
  { x: 22, y: 52, size: 28, rot: 16,  op: 0.14, fill: false },
  { x: 44, y: 48, size: 20, rot: -12, op: 0.12, fill: true  },
  { x: 64, y: 52, size: 30, rot: 6,   op: 0.15, fill: false },
  { x: 86, y: 50, size: 22, rot: -14, op: 0.13, fill: true  },

  // Lower-mid
  { x: 10, y: 72, size: 26, rot: 12,  op: 0.14, fill: false },
  { x: 32, y: 76, size: 20, rot: -10, op: 0.12, fill: true  },
  { x: 54, y: 72, size: 28, rot: 14,  op: 0.15, fill: false },
  { x: 74, y: 78, size: 22, rot: -6,  op: 0.13, fill: true  },
  { x: 94, y: 72, size: 30, rot: 8,   op: 0.15, fill: false },

  // Bottom edge
  { x: 4,  y: 94, size: 20, rot: -12, op: 0.12, fill: true  },
  { x: 20, y: 92, size: 26, rot: 8,   op: 0.14, fill: false },
  { x: 36, y: 96, size: 22, rot: 14,  op: 0.13, fill: true  },
  { x: 52, y: 92, size: 30, rot: -8,  op: 0.15, fill: false },
  { x: 68, y: 96, size: 20, rot: 10,  op: 0.12, fill: true  },
  { x: 82, y: 92, size: 26, rot: -14, op: 0.14, fill: false },
  { x: 96, y: 96, size: 22, rot: 6,   op: 0.13, fill: true  },
];

export const HeartsBackdrop = () => (
  <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
    {BENEFIT_HEARTS.map((h, i) => (
      <Heart
        key={i}
        size={h.size}
        strokeWidth={1.3}
        fill={h.fill ? "#bf524a" : "none"}
        color="#bf524a"
        style={{
          position: "absolute",
          left: `${h.x}%`,
          top: `${h.y}%`,
          transform: `translate(-50%, -50%) rotate(${h.rot}deg)`,
          opacity: h.op,
        }}
      />
    ))}
  </div>
);
