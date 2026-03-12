interface SoulSpeakFABProps {
  reportId?: string;
  petName?: string;
}

export function SoulSpeakFAB({ reportId, petName }: SoulSpeakFABProps) {
  const href = reportId ? `/soul-chat.html?id=${reportId}` : '/soul-chat.html';
  const label = petName ? `Talk to ${petName}` : 'Soul Chat';

  return (
    <a
      href={href}
      className="fixed bottom-5 right-5 z-[1000] flex items-center gap-2.5 rounded-full cursor-pointer no-underline group"
      style={{
        background: 'linear-gradient(135deg, #1a1210 0%, #2e2218 50%, #3d2f2a 100%)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3), 0 0 0 1px rgba(196,162,101,0.2), 0 0 40px rgba(196,162,101,0.08)',
        color: '#fff',
        padding: '14px 22px 14px 16px',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = '0 6px 28px rgba(0,0,0,0.35), 0 0 0 1px rgba(196,162,101,0.35), 0 0 50px rgba(196,162,101,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3), 0 0 0 1px rgba(196,162,101,0.2), 0 0 40px rgba(196,162,101,0.08)';
      }}
    >
      {/* Outer breathing ring */}
      <span
        className="absolute inset-[-5px] rounded-full pointer-events-none"
        style={{
          border: '1.5px solid rgba(196,162,101,0.35)',
          animation: 'fab-breathe 3s ease-in-out infinite',
        }}
      />

      {/* Inner gold shimmer */}
      <span
        className="absolute inset-0 rounded-full pointer-events-none overflow-hidden"
        style={{ opacity: 0.12 }}
      >
        <span
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(196,162,101,0.6) 50%, transparent 60%)',
            animation: 'fab-shimmer 4s ease-in-out infinite',
          }}
        />
      </span>

      {/* Icon orb */}
      <span
        className="relative z-[1] w-[28px] h-[28px] rounded-full flex items-center justify-center flex-shrink-0 text-[0.85rem]"
        style={{
          background: 'linear-gradient(135deg, rgba(196,162,101,0.2), rgba(196,162,101,0.08))',
          border: '1px solid rgba(196,162,101,0.25)',
        }}
      >
        ✦
      </span>

      {/* Label */}
      <span className="relative z-[1] text-[0.8rem] font-semibold tracking-[0.3px] whitespace-nowrap"
        style={{ color: 'rgba(255,255,255,0.9)' }}
      >
        {label}
      </span>

      <style>{`
        @keyframes fab-breathe {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.12); opacity: 0; }
        }
        @keyframes fab-shimmer {
          0%, 100% { transform: translateX(-120%); }
          50% { transform: translateX(120%); }
        }
      `}</style>
    </a>
  );
}
