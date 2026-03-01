interface SoulSpeakFABProps {
  reportId?: string;
}

export function SoulSpeakFAB({ reportId }: SoulSpeakFABProps) {
  const href = reportId ? `/soul-chat.html?id=${reportId}` : '/soul-chat.html';

  return (
    <a
      href={href}
      className="fixed bottom-5 right-5 z-[1000] w-[58px] h-[58px] rounded-full flex items-center justify-center cursor-pointer no-underline"
      style={{
        background: 'linear-gradient(135deg, #3d2f2a, #5a3e2e)',
        boxShadow: '0 4px 20px rgba(61,47,42,0.35)',
        color: '#fff',
        fontSize: '1.3rem',
        transition: 'all 0.3s',
      }}
    >
      {/* Pulse ring */}
      <span
        className="absolute inset-[-4px] rounded-full border-2 border-[#c4a265]"
        style={{ animation: 'fab-pulse 2.5s ease-out infinite' }}
      />
      {/* NEW badge */}
      <span
        className="absolute -top-[3px] -right-[3px] text-white text-[7px] font-extrabold px-[5px] py-[2px] rounded-[6px] tracking-[0.5px] uppercase"
        style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
      >
        NEW
      </span>
      <span className="relative z-[1]">⭐</span>

      <style>{`
        @keyframes fab-pulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.4); opacity: 0; }
        }
      `}</style>
    </a>
  );
}
