import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { ReportContent } from './types';

interface YelpReviewsProps {
  petName: string;
  report: ReportContent;
}

function generateDefaultReviews(petName: string, element: string) {
  const templates: Record<string, Array<{ place: string; rating: number; review: string }>> = {
    Fire: [
      { place: 'My Food Bowl', rating: 3, review: `It's fine. Would be 5 stars if it was full 24/7. I shouldn't have to REMIND them. The audacity of scheduled meals.` },
      { place: 'The Vet', rating: 1, review: `Betrayal. Pure betrayal. They said "car ride" and I believed them. Trust issues now. Would leave zero stars if possible.` },
      { place: 'My Bed', rating: 5, review: `Actually it's their bed. I allow them to share it. Prime real estate, excellent body heat, 10/10 would claim again.` },
      { place: 'The Park', rating: 5, review: `MY kingdom. Every blade of grass knows my name. The squirrels fear me. The other dogs respect me. As it should be.` },
      { place: 'Bath Time', rating: 1, review: `A hate crime. I did not consent. My lawyer will be in touch. The soap wasn't even the good kind.` },
    ],
    Water: [
      { place: 'My Food Bowl', rating: 4, review: `Emotionally nourishing. I wish they'd sit with me while I eat though. Dining alone is a melancholy I can't explain.` },
      { place: 'The Vet', rating: 2, review: `I cried. They poked me. I cried more. The treat at the end did NOT make up for the emotional damage.` },
      { place: 'Their Lap', rating: 5, review: `My safe harbor. My emotional support furniture. Would live here permanently if they didn't keep "needing to move."` },
      { place: 'The Window', rating: 5, review: `Best show in town. I watch. I feel. I wonder about the birds. We have an understanding, the birds and I.` },
      { place: 'When They Leave', rating: 1, review: `They left. Again. I waited by the door for 7 hours. It was 20 minutes. Felt like 7 hours.` },
    ],
    Earth: [
      { place: 'My Food Bowl', rating: 5, review: `Consistent. Reliable. Same time every day. This is what loyalty looks like. Only wish the portions reflected my devotion.` },
      { place: 'The Couch', rating: 5, review: `I have claimed my spot. It has my shape now. Attempts to sit there by others will be met with a disappointed stare.` },
      { place: 'The Vet', rating: 2, review: `Tolerable. I sat with dignity. The thermometer was unnecessary. We will never speak of this again.` },
      { place: 'My Walking Route', rating: 4, review: `Same route every day. Same smells. Same lampposts. Perfection. They tried a "new route" once. I sat down and refused.` },
      { place: 'Treat Jar', rating: 5, review: `The most important object in the home. I know exactly where it is at all times. This is not obsession. This is awareness.` },
    ],
    Air: [
      { place: 'My Food Bowl', rating: 3, review: `Sometimes I eat it, sometimes I stare at it philosophically. Depends on the vibe. Stop judging me.` },
      { place: 'The Window', rating: 5, review: `Endless entertainment. Every passing leaf, bird, and stranger has a story. I've written novels about the mail carrier.` },
      { place: 'The Vet', rating: 2, review: `I charmed every single person in the waiting room. The actual appointment was forgettable. I go for the social scene.` },
      { place: 'New Visitors', rating: 5, review: `LOVE new people. Every stranger is a friend I haven't overwhelmed yet. My enthusiasm is a gift. Accept it.` },
      { place: 'Being Alone', rating: 1, review: `I talked to a shoe for 45 minutes. No judgment. The shoe was a great listener. Still, would not recommend solitude.` },
    ],
  };
  return templates[element] || templates.Water;
}

const starColors = ['#c4a265', '#c4a265', '#c4a265', '#c4a265', '#c4a265'];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="text-[0.9rem]"
          style={{ color: i <= rating ? '#c4a265' : '#e0d5c7' }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export function YelpReviews({ petName, report }: YelpReviewsProps) {
  const s = useScrollReveal();
  const element = report.dominantElement || 'Water';
  const reviews = report.yelpReviews;
  if (!reviews || reviews.length === 0) return null;

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 p-[22px] px-5 bg-white rounded-[14px] border border-[#e8ddd0] max-w-[520px] sm:mx-auto"
    >
      <div className="text-[0.6rem] font-bold tracking-[2.5px] uppercase text-[#c4a265] mb-1">
        {petName}'s Reviews
      </div>
      <p className="text-[0.72rem] text-[#9a8578] mb-4">
        {petName} reviews their life — brutally honest, cosmically biased.
      </p>

      <div className="space-y-4">
        {reviews.map((review, i) => (
          <div
            key={i}
            className="pb-3.5 last:pb-0"
            style={{ borderBottom: i < reviews.length - 1 ? '1px solid #f0e8de' : 'none' }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-dm-serif text-[0.92rem] text-[#3d2f2a]">{review.place}</span>
              <Stars rating={review.rating} />
            </div>
            <p className="text-[0.78rem] text-[#5a4a42] leading-[1.6] italic">
              "{review.review}"
            </p>
          </div>
        ))}
      </div>

      <p className="text-[0.65rem] text-[#b8a99e] mt-3 text-center">
        {petName} is a verified reviewer and takes their opinions very seriously.
      </p>
    </motion.div>
  );
}
