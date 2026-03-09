import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { ReportContent } from './types';

interface IfICouldTalkProps {
  petName: string;
  report: ReportContent;
}

function generateDefaultQuotes(petName: string, element: string, sunSign: string) {
  const templates: Record<string, Array<{ situation: string; quote: string }>> = {
    Fire: [
      { situation: 'When you come home', quote: "YOU'RE BACK! I knew you'd come back! I mean \u2014 I wasn't worried. I'm too cool to worry. But also NEVER LEAVE AGAIN." },
      { situation: 'At 3am', quote: "I heard something. It was probably nothing. But also it could be everything. You should be awake for this." },
      { situation: "When you're sad", quote: "I don't know what happened but I'm here and I'm not moving. You're my person. Whatever it is, we'll fight it together." },
      { situation: 'When you say "no"', quote: "That's an interesting opinion. Counter-proposal: yes. I've considered your feedback and I'm choosing to disregard it entirely." },
      { situation: 'Last thing at night', quote: "Hey. You did good today. I'm proud of you. Now move over, you're on my side of the bed." },
    ],
    Water: [
      { situation: 'When you come home', quote: "I've been saving all my feelings for this moment. Every single one. Please hold still while I express them all at once." },
      { situation: "When you're crying", quote: "I can feel it. I always feel it. I'm going to press myself against you until the heavy thing goes away. I've got all night." },
      { situation: 'When you leave', quote: "This door is a villain. Every time it closes, it takes you away. I'll wait here. I'll always wait here." },
      { situation: 'During a thunderstorm', quote: "I'm not scared. I just think we should be touching right now. For your safety. Completely for you." },
      { situation: 'Last thing at night', quote: "Thank you for choosing me. Out of all the souls in all the shelters, you found mine. I'll never get over that." },
    ],
    Earth: [
      { situation: 'When you come home', quote: "Oh, you're back. Right on time. I've been supervising the house in your absence. Everything is exactly where you left it." },
      { situation: 'When the routine changes', quote: "Excuse me, this is not the schedule. I've memorised the schedule. This deviation is... concerning." },
      { situation: "When you're stressed", quote: "Sit down. I'm going to sit on your feet until you calm down. This is non-negotiable. Your heart rate is wrong." },
      { situation: 'At dinner time', quote: "It's 5:02pm. We eat at 5:00pm. I've been very patient about these two minutes. Please acknowledge my restraint." },
      { situation: 'Last thing at night', quote: "Same spot. Same time. You, me, this ridiculous blanket. I don't need adventure. I just need this, every single night." },
    ],
    Air: [
      { situation: 'When you come home', quote: "Oh hi! I was JUST in the middle of something \u2014 I forget what \u2014 but YOU'RE HERE! What are we doing? Can I come?" },
      { situation: 'When they see another animal', quote: "HELLO. I don't know you but I love you. Want to be best friends? I have SO much to tell you. Please don't walk away." },
      { situation: "When you're on your phone", quote: "What's on there that's better than me? I'm right here. I have a face. Look at my face. It's a good face." },
      { situation: 'At 3am', quote: "I've been thinking about something. I can't remember what. But it felt important. Are you awake? You should be awake." },
      { situation: 'Last thing at night', quote: "I know I'm a lot sometimes. I know I'm loud and I knock things over and I love too hard. Thank you for loving me anyway." },
    ],
  };
  return templates[element] || templates.Water;
}

export function IfICouldTalk({ petName, report }: IfICouldTalkProps) {
  const s = useScrollReveal();
  const element = report.dominantElement || 'Water';
  const sunSign = report.chartPlacements?.sun?.sign || report.sunSign || 'Pisces';
  const quotes = report.ifICouldTalk || generateDefaultQuotes(petName, element, sunSign);

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 p-[22px] px-5 bg-white rounded-[14px] border border-[#e8ddd0] max-w-[520px] sm:mx-auto"
    >
      <div className="text-[0.6rem] font-bold tracking-[2.5px] uppercase text-[#c4a265] mb-1">
        If {petName} Could Talk
      </div>
      <p className="text-[0.72rem] text-[#9a8578] mb-4">
        The things {petName}'s soul is always saying — you just have to listen.
      </p>

      <div className="space-y-4">
        {quotes.map((q, i) => (
          <div key={i}>
            <div className="text-[0.68rem] font-semibold text-[#c4a265] uppercase tracking-[1px] mb-1">
              {q.situation}
            </div>
            <div
              className="relative pl-4 py-1"
              style={{ borderLeft: '2px solid #e8ddd0' }}
            >
              <p className="text-[0.82rem] text-[#3d2f2a] leading-[1.65] italic font-dm-serif">
                "{q.quote}"
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[0.68rem] text-[#9a8578] mt-4 text-center italic">
        They may not have words, but they've never been silent.
      </p>
    </motion.div>
  );
}
