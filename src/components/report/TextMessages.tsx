import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { ReportContent } from './types';

interface TextMessagesProps {
  petName: string;
  report: ReportContent;
  occasionMode?: string;
}

interface MessageSegment {
  time: string;
  messages: Array<{ sender: 'pet' | 'human'; text: string }>;
}

function generateDefaultMessages(petName: string, element: string): MessageSegment[] {
  // TODO: Add to generate-cosmic-report prompt
  return [
    {
      time: 'Today 8:47 AM',
      messages: [
        { sender: 'pet', text: 'hey' },
        { sender: 'pet', text: 'hey' },
        { sender: 'pet', text: 'HEY' },
        { sender: 'pet', text: `are you awake yet i've been staring at you for 40 mins` },
        { sender: 'human', text: `${petName} it's 6am` },
        { sender: 'pet', text: 'yes and??? the sun is up and so am i' },
        { sender: 'pet', text: 'also i\'m hungry' },
        { sender: 'pet', text: 'also i love you' },
        { sender: 'pet', text: 'but mainly hungry' },
      ],
    },
    {
      time: 'Today 2:15 PM',
      messages: [
        { sender: 'pet', text: 'so i noticed you seemed stressed today' },
        { sender: 'human', text: 'Yeah work was rough' },
        { sender: 'pet', text: 'ok coming to sit on your feet now' },
        { sender: 'pet', text: 'this is non negotiable' },
        { sender: 'pet', text: 'also i moved a sock to your pillow for emotional support' },
        { sender: 'human', text: "That's... actually really sweet?" },
        { sender: 'pet', text: 'i know what i\'m doing' },
        { sender: 'pet', text: 'i am a professional' },
      ],
    },
    {
      time: 'Today 11:58 PM',
      messages: [
        { sender: 'pet', text: 'hey are you still awake' },
        { sender: 'human', text: 'Barely, why?' },
        { sender: 'pet', text: 'nothing i just wanted to say' },
        { sender: 'pet', text: `you're my favourite person in the whole entire world` },
        { sender: 'pet', text: 'like the WHOLE world' },
        { sender: 'pet', text: `ok goodnight i'm going to lie on your feet now` },
      ],
    },
  ];
}

function convertReportMessages(data: NonNullable<ReportContent['textMessages']>): MessageSegment[] {
  const segments: MessageSegment[] = [];

  if (data.morning) {
    const msgs: Array<{ sender: 'pet' | 'human'; text: string }> = [];
    data.morning.pet.forEach((t) => msgs.push({ sender: 'pet', text: t }));
    data.morning.human.forEach((t) => msgs.push({ sender: 'human', text: t }));
    segments.push({ time: 'Today 8:47 AM', messages: msgs });
  }
  if (data.afternoon) {
    const msgs: Array<{ sender: 'pet' | 'human'; text: string }> = [];
    data.afternoon.pet.forEach((t) => msgs.push({ sender: 'pet', text: t }));
    data.afternoon.human.forEach((t) => msgs.push({ sender: 'human', text: t }));
    segments.push({ time: 'Today 2:15 PM', messages: msgs });
  }
  if (data.night) {
    const msgs: Array<{ sender: 'pet' | 'human'; text: string }> = [];
    data.night.pet.forEach((t) => msgs.push({ sender: 'pet', text: t }));
    data.night.human.forEach((t) => msgs.push({ sender: 'human', text: t }));
    segments.push({ time: 'Today 11:58 PM', messages: msgs });
  }

  return segments;
}

export function TextMessages({ petName, report, occasionMode }: TextMessagesProps) {
  const s = useScrollReveal();
  const element = report.dominantElement || 'Water';
  const segments = report.textMessages
    ? convertReportMessages(report.textMessages)
    : generateDefaultMessages(petName, element);

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 p-5 px-4 bg-white rounded-[14px] border border-[#e8ddd0] max-w-[520px] sm:mx-auto"
    >
      <div className="text-[0.6rem] font-bold tracking-[2.5px] uppercase text-[#c4a265] mb-1">
        💬 What {petName} Would Text You
      </div>
      <h3 className="font-dm-serif text-[1.05rem] text-[#3d2f2a] mb-3.5">
        If {petName} Had a Phone
      </h3>

      <div className="max-w-[340px] mx-auto">
        {segments.map((segment, si) => (
          <div key={si}>
            <div className="clear-both text-center text-[0.62rem] text-[#8e8e93] py-2 pb-1.5">
              {segment.time}
            </div>
            {segment.messages.map((msg, mi) => (
              <div
                key={mi}
                className={`max-w-[80%] px-3.5 py-2 rounded-[18px] text-[0.82rem] leading-[1.45] mb-1 ${
                  msg.sender === 'pet'
                    ? 'float-left clear-both bg-[#e9e9eb] text-[#1a1a1a] rounded-bl-[6px]'
                    : 'float-right clear-both bg-[#007aff] text-white rounded-br-[6px]'
                }`}
              >
                {msg.text}
              </div>
            ))}
            <div className="clear-both" />
          </div>
        ))}

        {/* Delivered + typing */}
        <div className="clear-both text-right text-[0.58rem] text-[#8e8e93] py-0.5 px-1 pb-1.5">
          Delivered ✓
        </div>
        <div className="float-left px-4 py-2.5 bg-[#e9e9eb] rounded-[18px] rounded-bl-[6px] mb-1">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8e8e93] animate-bounce" style={{ animationDelay: '0s' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[#8e8e93] animate-bounce" style={{ animationDelay: '0.2s' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[#8e8e93] animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
        <div className="clear-both" />
      </div>
    </motion.div>
  );
}
