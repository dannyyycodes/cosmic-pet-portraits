import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { ReportContent } from './types';

interface CosmicAwardsProps {
  petName: string;
  report: ReportContent;
}

const trophyEmojis = ['🏆', '🥇', '🌟', '👑', '💫', '🎖️', '✨', '🏅'];

function generateDefaultAwards(petName: string, element: string) {
  const templates: Record<string, Array<{ award: string; reason: string }>> = {
    Fire: [
      { award: 'Most Dramatic Entrance', reason: `Has never once entered a room quietly. Every arrival is an event. Standing ovation expected.` },
      { award: 'Best Performance in a Crisis', reason: `The crisis was a leaf. The performance was Oscar-worthy. No notes.` },
      { award: 'Most Likely to Start a Revolution', reason: `Against bedtime, meal schedules, and the general concept of "no."` },
      { award: 'Loudest Personality Per Kilogram', reason: `A force of nature compressed into an unreasonably cute package.` },
      { award: 'Best Supporting Napper', reason: `Falls asleep mid-chaos and somehow makes it look intentional.` },
      { award: 'Lifetime Achievement in Zoomies', reason: `For outstanding contribution to the field of running very fast for absolutely no reason.` },
    ],
    Water: [
      { award: 'Most Emotionally Available', reason: `Will absorb your sadness, anxiety, and general Tuesday energy without being asked.` },
      { award: 'Best Dramatic Stare', reason: `Can communicate an entire novel of longing in a single, unblinking look.` },
      { award: 'Most Likely to Write Poetry', reason: `If they could hold a pen, there would be sonnets. Sad, beautiful, slightly damp sonnets.` },
      { award: 'Best Cuddle Technique', reason: `Has perfected the art of being simultaneously everywhere and exactly where you need them.` },
      { award: 'Most Photogenic Sadness', reason: `Even their melancholy is beautiful. It's honestly unfair.` },
      { award: 'Lifetime Achievement in Loyalty', reason: `For choosing the same person every single day without hesitation.` },
    ],
    Earth: [
      { award: 'Most Consistent Schedule Keeper', reason: `Knows dinner time to the minute. Has never once been wrong. Doesn't need a clock.` },
      { award: 'Best Judgmental Stare', reason: `Can silently disapprove with more eloquence than most humans can manage with words.` },
      { award: 'Most Likely to Be a Manager', reason: `Supervises all household activities. Performance reviews are conducted via eye contact.` },
      { award: 'Best Spot Claimer', reason: `Has never lost a territorial negotiation for a warm spot on the couch.` },
      { award: 'Most Unbothered', reason: `Chaos happens around them while they remain a picture of dignified calm.` },
      { award: 'Lifetime Achievement in Patience', reason: `Waited for dinner 37 seconds past schedule and handled it with remarkable grace.` },
    ],
    Air: [
      { award: 'Most Social Butterfly', reason: `Has more friends at the park than you have in your entire contact list.` },
      { award: 'Shortest Attention Span (Endearing)', reason: `Started three activities, finished none, charmed everyone in the process.` },
      { award: 'Best Conversationalist', reason: `Has opinions about everything and the vocal range to express them all.` },
      { award: 'Most Likely to Befriend a Stranger', reason: `Has never met a stranger. Only friends they haven't overwhelmed yet.` },
      { award: 'Best Plot Twist Energy', reason: `You never know what they'll do next. Neither do they. It's part of the magic.` },
      { award: 'Lifetime Achievement in Enthusiasm', reason: `For making every single moment feel like the greatest moment that has ever occurred.` },
    ],
  };
  return templates[element] || templates.Water;
}

export function CosmicAwards({ petName, report }: CosmicAwardsProps) {
  const s = useScrollReveal();
  const element = report.dominantElement || 'Water';
  const awards = report.cosmicAwards || generateDefaultAwards(petName, element);

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 max-w-[520px] sm:mx-auto"
    >
      <div
        className="p-6 sm:p-7 rounded-[18px] relative overflow-hidden"
        style={{
          background: 'linear-gradient(165deg, #3d2f2a 0%, #2a1f1a 60%, #1f1613 100%)',
          boxShadow: '0 8px 32px rgba(61,47,42,0.3)',
        }}
      >
        {/* Corner glow accents */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(196,162,101,0.4), transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full pointer-events-none opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(196,162,101,0.4), transparent 70%)' }} />

        <div className="text-[0.6rem] font-bold tracking-[2.5px] uppercase text-[#c4a265]/80 mb-1 text-center">
          Cosmic Awards Ceremony
        </div>
        <p className="text-[0.72rem] text-white/50 mb-5 text-center">
          The awards {petName} has earned just by being themselves.
        </p>

        <div className="space-y-3">
          {awards.map((award, i) => (
            <div
              key={i}
              className="flex gap-3 items-start p-3.5 rounded-[12px] relative"
              style={{
                background: 'rgba(196,162,101,0.06)',
                border: '1px solid rgba(196,162,101,0.18)',
              }}
            >
              <div className="relative flex-shrink-0 mt-0.5">
                <div
                  className="w-[36px] h-[36px] rounded-full flex items-center justify-center"
                  style={{
                    background: 'radial-gradient(circle, rgba(196,162,101,0.25) 0%, rgba(196,162,101,0.08) 60%, transparent 100%)',
                    boxShadow: '0 0 12px rgba(196,162,101,0.15)',
                  }}
                >
                  <span className="text-[1.2rem]">{trophyEmojis[i % trophyEmojis.length]}</span>
                </div>
              </div>
              <div>
                <div className="font-dm-serif text-[0.88rem] text-[#c4a265]">
                  {award.award}
                </div>
                <p className="text-[0.75rem] text-white/65 leading-[1.55] mt-0.5">
                  {award.reason}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-[#c4a265]/15 text-center">
          <p className="text-[0.65rem] text-[#c4a265]/40 italic">
            Acceptance speech: *tail wag* *head tilt* *exist perfectly*
          </p>
        </div>
      </div>
    </motion.div>
  );
}
