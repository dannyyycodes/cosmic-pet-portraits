import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { ReportContent } from './types';

interface GoogleSearchesProps {
  petName: string;
  report: ReportContent;
}

function generateDefaultSearches(petName: string, sunSign: string, element: string): string[] {
  // TODO: Add to generate-cosmic-report prompt
  const templates: Record<string, string[]> = {
    Water: [
      `why does my human stare at the glowing rectangle instead of me`,
      `how to telepathically tell someone you need a treat`,
      `is it normal to feel everyone's emotions or am i broken`,
      `why do humans leave and then come back where do they go`,
      `how to be less emotionally available (asking for a friend)`,
      `that thing where your human says "who's a good girl" am i the good girl`,
      `sock hiding spots they haven't found yet`,
      `${sunSign.toLowerCase()} emotional support techniques advanced level`,
    ],
    Fire: [
      `how to get more treats through intimidation`,
      `why won't my human let me chase the mailman`,
      `am i the alpha or is the cat`,
      `why do humans sleep so much they're wasting daylight`,
      `how to open doors by myself tutorial`,
      `fastest zoomie speed ever recorded`,
      `why does my human say "no" like it applies to me`,
      `${sunSign.toLowerCase()} leadership tips`,
    ],
    Earth: [
      `best napping positions ranked`,
      `why does my human move my bed I put it there for a reason`,
      `how to get more snacks without looking desperate`,
      `is it weird to follow your human to the bathroom every time`,
      `property rights do dogs own the couch legally`,
      `how to look disappointed without saying anything`,
      `ideal sleeping temperature for maximum comfort`,
      `${sunSign.toLowerCase()} stability habits`,
    ],
    Air: [
      `what is that red dot and why can't I catch it`,
      `how to pretend you didn't hear "come here"`,
      `why does my human talk to other dogs`,
      `how to communicate complex thoughts using only eye contact`,
      `do other pets also watch their humans from across the room or just me`,
      `how to look mysterious while doing absolutely nothing`,
      `what's outside the window a comprehensive study`,
      `${sunSign.toLowerCase()} communication styles`,
    ],
  };

  return templates[element] || templates.Water;
}

export function GoogleSearches({ petName, report }: GoogleSearchesProps) {
  const s = useScrollReveal();
  const sunSign = report.chartPlacements?.sun?.sign || report.sunSign || 'Pisces';
  const element = report.dominantElement || 'Water';
  const searches = report.googleSearches || generateDefaultSearches(petName, sunSign, element);

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 p-5 bg-white rounded-[14px] border border-[#e8ddd0] max-w-[520px] sm:mx-auto"
    >
      <div className="text-[0.6rem] font-bold tracking-[2.5px] uppercase text-[#c4a265] mb-1">
        🔍 Things {petName} Would Google
      </div>
      <h3 className="font-dm-serif text-[1.05rem] text-[#3d2f2a] mb-2.5">Late Night Search History</h3>

      {searches.map((search, i) => (
        <div
          key={i}
          className="flex items-center gap-2.5 px-3.5 py-2.5 my-1.5 rounded-3xl text-[0.82rem] text-[#202124]"
          style={{ background: '#f8f9fa', border: '1px solid #dfe1e5' }}
        >
          <span className="text-[#9aa0a6] text-[0.85rem] flex-shrink-0">🔍</span>
          <span className="flex-1">{search}</span>
        </div>
      ))}
    </motion.div>
  );
}
