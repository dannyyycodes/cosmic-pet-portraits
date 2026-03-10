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

function spotifySearchUrl(title: string, artist: string): string {
  return `https://open.spotify.com/search/${encodeURIComponent(title + ' ' + artist)}`;
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
          <a
            href={spotifySearchUrl(item.title, item.artist)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 group no-underline"
          >
            <div className="flex items-center gap-1.5">
              <svg
                viewBox="0 0 24 24"
                className="w-3.5 h-3.5 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity"
                fill="#1DB954"
              >
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
              <span className="text-[0.82rem] font-semibold text-[#3d2f2a] group-hover:underline decoration-[#1DB954]/40 underline-offset-2">
                {item.title}
              </span>
            </div>
            <div className="text-[0.7rem] text-[#9a8578] ml-5">{item.artist}</div>
          </a>
          <span className="text-[0.62rem] text-[#c4a265] font-semibold uppercase tracking-[0.5px]">
            {item.vibe}
          </span>
        </div>
      ))}

      <a
        href="https://open.spotify.com"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 mt-3 pt-2.5 text-[0.68rem] text-[#1DB954] font-medium no-underline hover:underline underline-offset-2 opacity-70 hover:opacity-100 transition-opacity"
      >
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="#1DB954">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
        Listen on Spotify
      </a>
    </motion.div>
  );
}
