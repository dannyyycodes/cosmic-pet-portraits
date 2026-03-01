import { motion } from 'framer-motion';
import { Star, Heart, Zap, Shield, Sparkles, Crown, PartyPopper } from 'lucide-react';
import { forwardRef } from 'react';
import { OccasionMode } from '@/lib/occasionMode';

interface CardStats {
  vitality: number;
  empathy: number;
  curiosity: number;
  charm: number;
  energy: number;
  mystery: number;
}

interface StoryCardExportProps {
  petName: string;
  archetype: string;
  sunSign: string;
  moonSign: string;
  element: string;
  zodiacIcon: string;
  stats: CardStats;
  auraColor: string;
  petPortraitUrl?: string;
  occasionMode: OccasionMode;
  viralCaption: string;
}

const occasionThemes: Record<OccasionMode, {
  gradient: { from: string; to: string };
  badge: string;
  topEmoji: string;
  bottomText: string;
  bgGradient: string;
}> = {
  discover: {
    gradient: { from: '#8b5cf6', to: '#ec4899' },
    badge: '✨ COSMIC REVEAL ✨',
    topEmoji: '🔮',
    bottomText: 'Discover your pet\'s cosmic soul',
    bgGradient: 'linear-gradient(180deg, #0f0a1f 0%, #1a0a2e 30%, #0d1117 100%)',
  },
  birthday: {
    gradient: { from: '#f59e0b', to: '#ef4444' },
    badge: '🎂 BIRTHDAY LEGEND 🎂',
    topEmoji: '🎉',
    bottomText: 'Another year of being iconic!',
    bgGradient: 'linear-gradient(180deg, #1a0f05 0%, #2d1810 30%, #0d1117 100%)',
  },
  memorial: {
    gradient: { from: '#6366f1', to: '#0ea5e9' },
    badge: '🌟 FOREVER IN THE STARS 🌟',
    topEmoji: '👼',
    bottomText: 'Forever loved, forever remembered',
    bgGradient: 'linear-gradient(180deg, #0a0f1f 0%, #0d1a2e 30%, #0d1117 100%)',
  },
  gift: {
    gradient: { from: '#10b981', to: '#8b5cf6' },
    badge: '🎁 COSMIC GIFT 🎁',
    topEmoji: '✨',
    bottomText: 'A gift from the stars',
    bgGradient: 'linear-gradient(180deg, #051a10 0%, #0d2e1a 30%, #0d1117 100%)',
  },
};

const elementGradients: Record<string, { from: string; to: string }> = {
  Fire: { from: '#f97316', to: '#eab308' },
  Earth: { from: '#22c55e', to: '#84cc16' },
  Air: { from: '#3b82f6', to: '#a855f7' },
  Water: { from: '#06b6d4', to: '#8b5cf6' },
};

const StatBarMini = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="flex items-center gap-2">
    <span className="text-[10px] uppercase tracking-wider text-white/70 w-16">{label}</span>
    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{ width: `${value}%`, backgroundColor: color }}
      />
    </div>
    <span className="text-xs font-bold text-white w-6 text-right">{value}</span>
  </div>
);

// This component is meant to be rendered off-screen and captured with html2canvas
// It's designed for 9:16 aspect ratio (1080x1920 at 3x scale = 360x640 base)
export const StoryCardExport = forwardRef<HTMLDivElement, StoryCardExportProps>(({
  petName,
  archetype,
  sunSign,
  moonSign,
  element,
  zodiacIcon,
  stats,
  auraColor,
  petPortraitUrl,
  occasionMode,
  viralCaption,
}, ref) => {
  const theme = occasionThemes[occasionMode];
  const colors = occasionMode === 'memorial' || occasionMode === 'birthday' 
    ? theme.gradient 
    : elementGradients[element] || elementGradients.Fire;
  
  const totalPower = Math.round((stats.vitality + stats.empathy + stats.curiosity + stats.charm + stats.energy + stats.mystery) / 6);
  const isMemorial = occasionMode === 'memorial';
  const isBirthday = occasionMode === 'birthday';

  return (
    <div
      ref={ref}
      style={{
        width: '360px',
        height: '640px',
        background: theme.bgGradient,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Animated stars background */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.4 }}>
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: i % 3 === 0 ? '3px' : '2px',
              height: i % 3 === 0 ? '3px' : '2px',
              borderRadius: '50%',
              backgroundColor: '#fff',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.3 + Math.random() * 0.7,
            }}
          />
        ))}
      </div>

      {/* Top section with emoji and branding */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '40px',
        position: 'relative',
        zIndex: 10,
      }}>
        <span style={{ fontSize: '48px', marginBottom: '8px' }}>{theme.topEmoji}</span>
        <div style={{
          background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
          padding: '8px 24px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 700,
          color: 'white',
          letterSpacing: '0.1em',
        }}>
          {theme.badge}
        </div>
      </div>

      {/* Main card area */}
      <div style={{
        margin: '20px 20px',
        borderRadius: '24px',
        background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
        padding: '3px',
        boxShadow: `0 0 60px ${colors.from}40`,
      }}>
        <div style={{
          borderRadius: '22px',
          background: 'linear-gradient(180deg, #1a1a2e 0%, #0d0d1a 100%)',
          overflow: 'hidden',
        }}>
          {/* Portrait */}
          <div style={{
            height: '200px',
            position: 'relative',
            background: petPortraitUrl ? 'transparent' : `radial-gradient(circle at center, ${auraColor}40, transparent)`,
          }}>
            {petPortraitUrl ? (
              <img 
                src={petPortraitUrl} 
                alt={petName}
                crossOrigin="anonymous"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                fontSize: '80px',
              }}>
                {zodiacIcon}
              </div>
            )}
            
            {/* Overlay gradient */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '60px',
              background: 'linear-gradient(to top, #0d0d1a, transparent)',
            }} />

            {/* Crown/halo for special occasions */}
            {(totalPower >= 75 && !isMemorial) && (
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                fontSize: '32px',
              }}>
                👑
              </div>
            )}
            {isMemorial && (
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '32px',
              }}>
                👼
              </div>
            )}

            {/* Element badge */}
            <div style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              background: `${colors.from}dd`,
              padding: '6px 12px',
              borderRadius: '16px',
              fontSize: '11px',
              fontWeight: 700,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              {element === 'Fire' ? '🔥' : element === 'Earth' ? '🌿' : element === 'Air' ? '💨' : '💧'}
              {element}
            </div>
          </div>

          {/* Name section */}
          <div style={{
            textAlign: 'center',
            padding: '16px 20px 8px',
          }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: 800,
              color: 'white',
              margin: 0,
              letterSpacing: '0.02em',
            }}>
              {petName}
            </h2>
            <p style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.5)',
              margin: '4px 0 0',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
            }}>
              {archetype}
            </p>
          </div>

          {/* Signs row */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            padding: '8px 20px',
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '6px 14px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <span style={{ fontSize: '16px' }}>{zodiacIcon}</span>
              <span style={{ fontSize: '12px', color: 'white', fontWeight: 600 }}>{sunSign}</span>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '6px 14px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <span style={{ fontSize: '14px' }}>☽</span>
              <span style={{ fontSize: '12px', color: 'white', fontWeight: 600 }}>{moonSign}</span>
            </div>
          </div>

          {/* Power score */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '12px 20px',
          }}>
            <div style={{
              background: `linear-gradient(135deg, ${colors.from}30, ${colors.to}30)`,
              border: `2px solid ${colors.from}50`,
              padding: '10px 24px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              {isBirthday ? (
                <span style={{ fontSize: '20px' }}>🎂</span>
              ) : isMemorial ? (
                <span style={{ fontSize: '20px' }}>⭐</span>
              ) : (
                <span style={{ fontSize: '20px' }}>🔥</span>
              )}
              <span style={{
                fontSize: '24px',
                fontWeight: 900,
                color: 'white',
              }}>
                {totalPower}
              </span>
              <span style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.6)',
              }}>
                POWER
              </span>
            </div>
          </div>

          {/* Branding footer */}
          <div style={{
            padding: '12px 20px',
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ fontSize: '14px' }}>✨</span>
            <span style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.5)',
              fontWeight: 600,
            }}>
              littlesouls.co
            </span>
          </div>
        </div>
      </div>

      {/* Viral caption area */}
      <div style={{
        margin: '0 24px',
        padding: '16px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <p style={{
          fontSize: '14px',
          color: 'rgba(255,255,255,0.9)',
          textAlign: 'center',
          fontWeight: 500,
          fontStyle: 'italic',
          margin: 0,
          lineHeight: 1.5,
        }}>
          "{viralCaption}"
        </p>
      </div>

      {/* Bottom CTA */}
      <div style={{
        position: 'absolute',
        bottom: '40px',
        left: 0,
        right: 0,
        textAlign: 'center',
      }}>
        <p style={{
          fontSize: '14px',
          color: 'rgba(255,255,255,0.7)',
          margin: 0,
          fontWeight: 500,
        }}>
          {theme.bottomText}
        </p>
        <div style={{
          marginTop: '12px',
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
        }}>
          <span style={{
            background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
            padding: '8px 20px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 700,
            color: 'white',
          }}>
            Get Your Pet's Card ✨
          </span>
        </div>
      </div>
    </div>
  );
});

StoryCardExport.displayName = 'StoryCardExport';
