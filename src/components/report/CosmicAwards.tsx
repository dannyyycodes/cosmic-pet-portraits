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
  const awards = report.cosmicAwards;
  if (!awards || awards.length === 0) return null;

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 p-[22px] px-5 bg-white rounded-[14px] border border-[#e8ddd0] max-w-[520px] sm:mx-auto"
    >
      <div className="text-[0.6rem] font-bold tracking-[2.5px] uppercase text-[#c4a265] mb-1">
        Cosmic Awards Ceremony
      </div>
      <p className="text-[0.72rem] text-[#9a8578] mb-4">
        The awards {petName} has earned just by being themselves.
      </p>

      <div className="space-y-3">
        {awards.map((award, i) => (
          <div
            key={i}
            className="flex gap-3 items-start p-2.5 rounded-lg hover:bg-[#faf6ef] transition-colors"
          >
            <span className="text-[1.3rem] flex-shrink-0 mt-0.5">
              {trophyEmojis[i % trophyEmojis.length]}
            </span>
            <div>
              <div className="font-dm-serif text-[0.88rem] text-[#3d2f2a]">
                {award.award}
              </div>
              <p className="text-[0.75rem] text-[#5a4a42] leading-[1.55] mt-0.5">
                {award.reason}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-2.5 border-t border-[#f0e8de] text-center">
        <p className="text-[0.65rem] text-[#b8a99e] italic">
          Acceptance speech: *tail wag* *head tilt* *exist perfectly*
        </p>
      </div>
    </motion.div>
  );
}
