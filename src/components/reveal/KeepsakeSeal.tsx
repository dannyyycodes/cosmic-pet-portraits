import { motion, useReducedMotion } from 'framer-motion';
import type { RevealReport } from './types';

interface Props {
  data: RevealReport;
}

function SealArt() {
  return (
    <svg viewBox="0 0 200 200" fill="none" aria-hidden="true">
      <circle cx="100" cy="100" r="94" stroke="rgba(212,175,55,0.55)" strokeWidth="1" />
      <circle cx="100" cy="100" r="84" stroke="rgba(212,175,55,0.3)" strokeWidth="1" />
      <circle cx="100" cy="100" r="66" stroke="rgba(187,167,255,0.4)" strokeWidth="1" />
      {Array.from({ length: 48 }).map((_, i) => {
        const a = (i / 48) * Math.PI * 2;
        const r1 = 84, r2 = i % 4 === 0 ? 90 : 87;
        return (
          <line
            key={i}
            x1={100 + r1 * Math.cos(a)} y1={100 + r1 * Math.sin(a)}
            x2={100 + r2 * Math.cos(a)} y2={100 + r2 * Math.sin(a)}
            stroke="rgba(212,175,55,0.45)" strokeWidth="1"
          />
        );
      })}
      {/* central star */}
      <path
        d="M100 52l6.5 30L136 88l-24 18 8 30-20-18-20 18 8-30-24-18 29.5-6z"
        stroke="rgba(212,175,55,0.5)" strokeWidth="1" fill="rgba(212,175,55,0.06)"
      />
    </svg>
  );
}

export function KeepsakeSeal({ data }: Props) {
  const reduced = useReducedMotion();
  const sc = data.report?.shareableCard || {};
  const nickname = sc.cosmicNickname || data.report?.cosmicNickname?.nickname || data.petName;
  const traits: string[] = Array.isArray(sc.sixKeyTraits) ? sc.sixKeyTraits : [];
  const signature = sc.signatureLine || data.report?.epilogue?.slice?.(0, 0) || '';
  const isMemorial = data.occasionMode === 'memorial';

  const entrance = reduced
    ? {}
    : {
        initial: { opacity: 0, scale: 0.92 },
        whileInView: { opacity: 1, scale: 1 },
        viewport: { once: true, amount: 0.4 },
        transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
      };

  const canSpeak = !!(data.reportId && (data.shareToken || true));
  const onSpeak = () => {
    if (!data.reportId) return;
    const token = data.shareToken ? `&token=${encodeURIComponent(data.shareToken)}` : '';
    window.location.href = `/chat?id=${encodeURIComponent(data.reportId)}${token}`;
  };

  return (
    <div className="rv-keepsake">
      <motion.div className="rv-seal" {...entrance}>
        <SealArt />
        <span className="rv-seal-nick">{nickname}</span>
      </motion.div>

      {traits.length > 0 && (
        <div className="rv-keepsake-traits">
          {traits.map((t, i) => <span key={i} className="rv-chip">{t}</span>)}
        </div>
      )}

      {signature && <p className="rv-keepsake-line">{signature}</p>}

      <div className="rv-cta-row">
        {canSpeak && (
          <button className="rv-cta rv-cta--primary" onClick={onSpeak}>
            {isMemorial ? `Speak with ${data.petName}’s soul` : `Speak with ${data.petName}’s soul`}
          </button>
        )}
        <button
          className="rv-cta rv-cta--ghost"
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: `${data.petName}’s soul reading`, url: window.location.href }).catch(() => {});
            }
          }}
        >
          Keep this reading
        </button>
      </div>

      <p className="rv-legacy-foot">
        {isMemorial
          ? `Their light, mapped and kept, carried with you always.`
          : `Their whole soul, mapped in starlight, and yours to keep.`}
      </p>
    </div>
  );
}
