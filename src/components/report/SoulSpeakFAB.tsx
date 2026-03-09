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
        background: 'linear-gradient(135deg, #3d2f2a, #5a3e2e)',
        boxShadow: '0 4px 24px rgba(61,47,42,0.4)',
        color: '#fff',
        padding: '12px 18px 12px 14px',
        transition: 'all 0.3s',
      }}
    >
      {/* Pulse ring */}
      <span
        className="absolute inset-[-4px] rounded-full border-2 border-[#c4a265]"
        style={{ animation: 'fab-pulse 2.5s ease-out infinite' }}
      />

      {/* Icon */}
      <span className="relative z-[1] text-[1.2rem] flex-shrink-0">✨</span>

      {/* Label */}
      <span className="relative z-[1] text-[0.78rem] font-semibold tracking-[0.3px] whitespace-nowrap pr-0.5">
        {label}
      </span>

      <style>{`
        @keyframes fab-pulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.35); opacity: 0; }
        }
      `}</style>
    </a>
  );
}
