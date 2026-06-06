import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { ReportContent } from './types';
import { CosmicLineIcon } from './cosmic/CosmicLineIcon';
import { deDash } from './cosmic/text';

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

// Map each dossier field to a fitting line-icon by meaning. Fallback: spark.
const traitIcons: Record<string, string> = {
  Aesthetic: 'sparkle',
  Career: 'compass',
  'Morning Routine': 'sun',
  'Toxic Trait': 'mask',
  'Love Life': 'heartOrbit',
  'Spotify Wrapped': 'star',
  'Red Flag': 'shield',
  'Green Flag': 'leaf',
  'In a Group': 'orbit',
  Catchphrase: 'chat',
};

// Long-form fields get the full width so the grid never reads as a monotonous list.
const wideTraits = new Set([
  'Morning Routine',
  'Love Life',
  'In a Group',
  'Catchphrase',
]);

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

function generateDefaultProfile(
  petName: string,
  element: string,
  archetype: string
): Record<string, string> {
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

  const profile = report.humanProfile || generateDefaultProfile(petName, element, archetype);

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 max-w-[520px] sm:mx-auto"
    >
      <div
        className="rounded-[18px] overflow-hidden"
        style={{
          border: '1px solid rgba(154,126,230,0.18)',
          boxShadow: '0 3px 16px rgba(0,0,0,0.45)',
        }}
      >
        {/* Manila folder tab header */}
        <div
          className="px-5 py-4 relative"
          style={{
            background: 'linear-gradient(135deg, #1a1330 0%, #221a44 100%)',
            borderBottom: '1px solid rgba(154,126,230,0.18)',
          }}
        >
          <div className="text-[0.56rem] font-bold tracking-[2.5px] uppercase text-[#d9b46a]">
            Classified Dossier
          </div>
          <h3
            className="text-[1.05rem] text-[#f3ecff] mt-0.5"
            style={{ fontFamily: 'DM Serif Display, serif' }}
          >
            Subject: {petName}&rsquo;s Human
          </h3>

          {/* TOP SECRET stamp */}
          <div
            className="absolute top-3 right-4 text-[0.7rem] font-black tracking-[2px] uppercase select-none pointer-events-none"
            style={{
              color: 'rgba(230,193,121,0.32)',
              transform: 'rotate(-12deg)',
              border: '2px solid rgba(230,193,121,0.22)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontFamily: 'monospace',
            }}
          >
            Top Secret
          </div>
        </div>

        {/* Dossier body */}
        <div
          className="px-5 py-4"
          style={{
            background: 'rgba(13,10,22,0.9)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
          }}
        >
          {/* Avatar */}
          <div className="flex items-center gap-3 mb-4 pb-3" style={{ borderBottom: '1px dashed rgba(154,126,230,0.18)' }}>
            <div
              className="w-[52px] h-[52px] rounded-full flex items-center justify-center flex-shrink-0 text-[#1a1330]"
              style={{ background: 'linear-gradient(135deg, #e6c179, #d9b46a)' }}
            >
              <CosmicLineIcon name="eye" size={26} />
            </div>
            <div>
              <div className="text-[0.62rem] font-bold tracking-[1.5px] uppercase text-[#d9b46a]">
                Profile Assessment
              </div>
              <div className="text-[0.78rem] text-[#d8c5f5] mt-0.5">
                As observed by {petName}
              </div>
            </div>
          </div>

          {/* Case-file cards — each field is its own scannable dossier card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {traitOrder
              .filter((trait) => Boolean(profile[trait]))
              .map((trait, i) => {
                const value = profile[trait];
                const iconName = traitIcons[trait] || 'spark';
                const wide = wideTraits.has(trait);
                return (
                  <motion.div
                    key={trait}
                    custom={i}
                    variants={cardVariants}
                    initial="hidden"
                    animate={s.isInView ? 'visible' : 'hidden'}
                    className={`rounded-[12px] p-3.5 ${wide ? 'sm:col-span-2' : ''}`}
                    style={{
                      background: 'rgba(22,16,42,0.72)',
                      border: '1px solid rgba(154,126,230,0.18)',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
                    }}
                  >
                    {/* Header row: icon + monospace gold label */}
                    <div className="flex items-center gap-2 mb-2 pb-2" style={{ borderBottom: '1px dashed rgba(154,126,230,0.18)' }}>
                      <span className="flex-shrink-0 text-[#e6c179]" aria-hidden="true">
                        <CosmicLineIcon name={iconName} size={16} />
                      </span>
                      <span
                        className="text-[0.72rem] font-bold text-[#e6c179] uppercase tracking-[1px]"
                        style={{ fontFamily: 'monospace' }}
                      >
                        {trait}
                      </span>
                    </div>
                    {/* Field text — left-aligned, body size, readable */}
                    <p className="text-left text-[1.05rem] text-[#ece5ff] leading-[1.6] m-0">
                      {deDash(value)}
                    </p>
                  </motion.div>
                );
              })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
