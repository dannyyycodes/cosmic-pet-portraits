import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { ReportContent } from './types';

interface CosmicPlaylistProps {
  petName: string;
  report: ReportContent;
}

interface PlaylistItem {
  title: string;
  artist: string;
  vibe: string;
}

function generateDefaultPlaylist(element: string): PlaylistItem[] {
  // TODO: Add to generate-cosmic-report prompt
  const templates: Record<string, PlaylistItem[]> = {
    Water: [
      { title: 'Clair de Lune', artist: 'Debussy', vibe: 'Dreamy' },
      { title: 'Moon River', artist: 'Audrey Hepburn', vibe: 'Soulful' },
      { title: 'Weightless', artist: 'Marconi Union', vibe: 'Calming' },
      { title: 'Ocean Eyes', artist: 'Billie Eilish', vibe: 'Tender' },
      { title: 'Saturn', artist: 'Sleeping At Last', vibe: 'Cosmic' },
    ],
    Fire: [
      { title: 'Run the World', artist: 'Beyoncé', vibe: 'Powerful' },
      { title: 'Eye of the Tiger', artist: 'Survivor', vibe: 'Fierce' },
      { title: 'Firework', artist: 'Katy Perry', vibe: 'Explosive' },
      { title: 'Stronger', artist: 'Kanye West', vibe: 'Bold' },
      { title: 'Born This Way', artist: 'Lady Gaga', vibe: 'Iconic' },
    ],
    Earth: [
      { title: 'Here Comes the Sun', artist: 'The Beatles', vibe: 'Warm' },
      { title: 'Don\'t Know Why', artist: 'Norah Jones', vibe: 'Grounded' },
      { title: 'Harvest Moon', artist: 'Neil Young', vibe: 'Earthy' },
      { title: 'Sunday Morning', artist: 'Maroon 5', vibe: 'Cosy' },
      { title: 'What a Wonderful World', artist: 'Louis Armstrong', vibe: 'Timeless' },
    ],
    Air: [
      { title: 'Everything in Its Right Place', artist: 'Radiohead', vibe: 'Cerebral' },
      { title: 'Dog Days Are Over', artist: 'Florence + The Machine', vibe: 'Free' },
      { title: 'Breathe Me', artist: 'Sia', vibe: 'Ethereal' },
      { title: 'Yellow', artist: 'Coldplay', vibe: 'Breezy' },
      { title: 'Space Oddity', artist: 'David Bowie', vibe: 'Cosmic' },
    ],
  };

  return templates[element] || templates.Water;
}

export function CosmicPlaylist({ petName, report }: CosmicPlaylistProps) {
  const s = useScrollReveal();
  const element = report.dominantElement || 'Water';
  const playlist = report.playlist || generateDefaultPlaylist(element);

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 p-5 bg-white rounded-[14px] border border-[#e8ddd0] max-w-[520px] sm:mx-auto"
    >
      <div className="text-[0.6rem] font-bold tracking-[2.5px] uppercase text-[#c4a265] mb-2.5">
        🎵 {petName}'s Cosmic Playlist
      </div>

      {playlist.map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-2.5 py-2 border-b border-[#e8ddd0] last:border-b-0"
        >
          <span className="text-[0.7rem] font-bold text-[#9a8578] w-5">
            {String(i + 1).padStart(2, '0')}
          </span>
          <div className="flex-1">
            <div className="text-[0.82rem] font-semibold text-[#3d2f2a]">{item.title}</div>
            <div className="text-[0.7rem] text-[#9a8578]">{item.artist}</div>
          </div>
          <span className="text-[0.62rem] text-[#c4a265] font-semibold uppercase tracking-[0.5px]">
            {item.vibe}
          </span>
        </div>
      ))}
    </motion.div>
  );
}
