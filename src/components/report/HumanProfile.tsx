import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { ReportContent } from './types';
import { zodiacSigns } from '@/lib/zodiac';

interface HumanProfileProps {
  petName: string;
  report: ReportContent;
  occasionMode?: string;
}

const traitOrder = [
  'Aesthetic',
  'Career',
  'Morning Routine',
  'Toxic Trait',
  'Love Life',
  'Spotify Wrapped',
  'Red Flag',
  'Green Flag',
  'In a Group',
  'Catchphrase',
];

function generateDefaultProfile(
  petName: string,
  element: string,
  archetype: string
): Record<string, string> {
  // TODO: Add to generate-cosmic-report prompt
  const templates: Record<string, Record<string, string>> = {
    Water: {
      Aesthetic: 'Soft academia meets cottagecore — oversized sweaters, candlelight, rain on windows',
      Career: 'Art therapist who cries with her clients (in a healing way)',
      'Morning Routine': 'Wakes up slowly. Stares out the window for 20 minutes. Forgets to eat breakfast.',
      'Toxic Trait': "Takes on everyone else's problems while ignoring their own",
      'Love Life': 'Falls deeply, loves quietly, will rearrange their entire life for the right person',
      'Spotify Wrapped': 'Top genre: "Sad Indie Folk" — 847 minutes of Bon Iver',
      'Red Flag': 'Will ghost you for 3 days then come back with homemade soup',
      'Green Flag': "Remembers everything you've ever told them. Everything.",
      'In a Group': 'The quiet one who says one thing at the end of the night that makes everyone cry',
      Catchphrase: '"I\'m fine" (they are not fine, they are feeling the entire room)',
    },
    Fire: {
      Aesthetic: 'Streetwear meets main character energy — bold colours, statement pieces, always camera-ready',
      Career: 'Startup founder who gives TED talks about manifesting',
      'Morning Routine': 'Up at 5am. Cold shower. Already replied to 12 emails before coffee.',
      'Toxic Trait': 'Turns every board game into a blood sport',
      'Love Life': "Love-bombs intensely, then forgets to text back for 3 days because they're busy being iconic",
      'Spotify Wrapped': 'Top genre: "Power Anthems" — 1200 minutes of Beyoncé',
      'Red Flag': "Will argue a point they don't even believe in just to win",
      'Green Flag': 'Will literally fight someone for you. Literally.',
      'In a Group': 'The one planning the adventure nobody asked for',
      Catchphrase: '"Watch this" (something chaotic follows)',
    },
    Earth: {
      Aesthetic: 'Clean minimalism meets cosy cabin — neutrals, wood tones, everything has its place',
      Career: 'Financial advisor who secretly writes poetry on lunch breaks',
      'Morning Routine': 'Same breakfast, same mug, same routine for 4 years. Changing it would cause an existential crisis.',
      'Toxic Trait': 'Judges everyone for their life choices while eating cheese in bed',
      'Love Life': 'Takes 3 years to commit, then loves you with the loyalty of a golden retriever',
      'Spotify Wrapped': 'Top genre: "Jazz Lounge" — 600 minutes of Norah Jones',
      'Red Flag': 'Has a 47-step skincare routine and will not skip a single one',
      'Green Flag': 'Shows up. Every. Single. Time.',
      'In a Group': 'The designated driver who remembers where everyone left their stuff',
      Catchphrase: '"I told you so" (said with genuine concern)',
    },
    Air: {
      Aesthetic: 'Eclectic intellectual — vintage glasses, tote bags with witty slogans, impulsive hair changes',
      Career: 'Podcast host who accidentally becomes a philosopher',
      'Morning Routine': 'Reads 3 articles, starts a debate in the group chat, forgets where they put their keys.',
      'Toxic Trait': 'Overthinks a text message for 40 minutes then sends "lol ok"',
      'Love Life': 'Falls for minds first. Can discuss the meaning of love for hours but struggles to say "I like you"',
      'Spotify Wrapped': 'Top genre: "Experimental Electronic" — 900 minutes of Radiohead',
      'Red Flag': 'Will psychoanalyse you mid-argument',
      'Green Flag': 'Always sees both sides. Will be your translator in any conflict.',
      'In a Group': 'The one asking "but what does it all mean?" at 2am',
      Catchphrase: '"Interesting..." (already forming 7 theories)',
    },
  };

  return templates[element] || templates.Water;
}

export function HumanProfile({ petName, report, occasionMode }: HumanProfileProps) {
  const s = useScrollReveal();
  const element = report.dominantElement || 'Water';
  const archetype = report.archetype?.name || '';
  const sunSign = report.chartPlacements?.sun?.sign || report.sunSign || '';
  const signData = zodiacSigns[sunSign.toLowerCase()];
  const signIcon = signData?.icon || '⭐';

  const profile = report.humanProfile || generateDefaultProfile(petName, element, archetype);

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 p-[22px] px-5 bg-white rounded-[14px] border border-[#e8ddd0] max-w-[520px] sm:mx-auto"
    >
      <div className="text-[0.6rem] font-bold tracking-[2.5px] uppercase text-[#c4a265] text-center mb-1">
        👤 If {petName} Was a Human
      </div>
      <h3 className="font-dm-serif text-[1.05rem] text-[#3d2f2a] text-center mb-3.5">
        The Human Version of {petName}
      </h3>

      {/* Avatar */}
      <div
        className="w-[70px] h-[70px] rounded-full mx-auto mb-3 flex items-center justify-center text-[1.8rem]"
        style={{ background: 'linear-gradient(135deg, #c4a265, #8b6f3a)' }}
      >
        {signIcon}
      </div>

      {traitOrder.map((trait) => {
        const value = profile[trait];
        if (!value) return null;
        return (
          <div key={trait} className="flex items-center gap-2.5 py-2 border-b border-[#e8ddd0] last:border-b-0">
            <span className="text-[0.7rem] font-semibold text-[#9a8578] w-[90px] flex-shrink-0">
              {trait}
            </span>
            <span className="text-[0.82rem] text-[#3d2f2a]">{value}</span>
          </div>
        );
      })}
    </motion.div>
  );
}
