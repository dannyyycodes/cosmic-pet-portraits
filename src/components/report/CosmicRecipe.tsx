import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { ReportContent } from './types';

interface CosmicRecipeProps {
  petName: string;
  report: ReportContent;
}

interface RecipeData {
  name: string;
  emoji: string;
  description: string;
  why: string;
  ingredients: string[];
  steps: string[];
}

function generateDefaultRecipe(petName: string, sunSign: string, element: string): RecipeData {
  const templates: Record<string, RecipeData> = {
    Water: {
      name: 'Moonlit Salmon Bites',
      emoji: '🐟',
      description: `A homemade treat crafted for ${petName}'s ${sunSign} soul`,
      why: `These treats channel ${petName}'s Water-dominant chart: nourishing, gentle, and deeply satisfying. The kind of snack that says "I love you" in every bite — packed with omega-3s for a glossy, moon-kissed coat.`,
      ingredients: [
        '1 can (6 oz) salmon, drained (omega-3 goodness)',
        '1 cup oat flour (gentle on tummies)',
        '1 egg (binding cosmic energy)',
        '1/2 cup pumpkin puree (digestive harmony)',
      ],
      steps: [
        'Preheat oven to 175°C (350°F). Line a baking sheet with parchment paper.',
        'Mix salmon, oat flour, egg, and pumpkin puree in a bowl until combined.',
        'Roll into small bite-sized balls and place on the baking sheet.',
        'Flatten slightly with a fork and bake for 20-25 minutes until firm and golden.',
        `Let cool completely before serving to ${petName}. Store in the fridge for up to 5 days.`,
      ],
    },
    Fire: {
      name: 'Blaze Berry Frozen Pops',
      emoji: '🫐',
      description: `A treat inspired by ${petName}'s fiery ${sunSign} energy`,
      why: `These frozen pops channel ${petName}'s Fire-dominant chart: bold, refreshing, and bursting with flavour. Perfect for cooling down a hot-spirited soul after a vigorous zoomie session.`,
      ingredients: [
        '1 cup blueberries (antioxidant fire-fighters)',
        '1 ripe banana (natural sweetness)',
        '1/2 cup plain yogurt — no sweeteners (cooling lunar influence)',
        '1/4 cup water (to blend)',
      ],
      steps: [
        'Blend blueberries, banana, yogurt, and water until smooth.',
        'Pour into silicone moulds or an ice cube tray.',
        'Freeze for at least 4 hours or overnight.',
        'Pop out and serve one at a time as a refreshing treat.',
        `Watch ${petName} devour it with fiery enthusiasm. Store in freezer for up to 2 weeks.`,
      ],
    },
    Earth: {
      name: 'Grounded Peanut Butter Bones',
      emoji: '🦴',
      description: `A treat inspired by ${petName}'s steady ${sunSign} nature`,
      why: `These treats channel ${petName}'s Earth-dominant chart: reliable, satisfying, and built to be savoured slowly. A grounding snack for a soul that appreciates the simple, good things in life.`,
      ingredients: [
        '1/2 cup peanut butter — xylitol-free! (earthy protein)',
        '1 cup oat flour (wholesome foundation)',
        '1 ripe banana, mashed (natural binding sweetness)',
        '1 egg (structural integrity)',
      ],
      steps: [
        'Preheat oven to 175°C (350°F). Line a baking sheet with parchment paper.',
        'Mix peanut butter, oat flour, mashed banana, and egg until a dough forms.',
        'Roll out to about 1cm thick on a floured surface. Cut with a bone-shaped cookie cutter (or any shape).',
        'Place on baking sheet and bake for 15-18 minutes until firm and lightly golden.',
        `Let cool completely. Offer one to ${petName} with ceremony — they deserve the ritual. Store in an airtight container for up to a week.`,
      ],
    },
    Air: {
      name: 'Cloud Nine Apple Crisps',
      emoji: '🍎',
      description: `A treat inspired by ${petName}'s airy ${sunSign} spirit`,
      why: `These light, crispy treats channel ${petName}'s Air-dominant chart: delicate, surprising, and effortlessly elegant. A snack that's as breezy and refined as ${petName}'s cosmic energy.`,
      ingredients: [
        '2 apples, cored and thinly sliced — no seeds! (light Air energy)',
        '1/2 tsp cinnamon (warm spice breeze)',
        '1 tsp coconut oil, melted (silky finish)',
      ],
      steps: [
        'Preheat oven to 100°C (200°F). Line a baking sheet with parchment paper.',
        'Core apples and slice thinly (about 3mm). Remove all seeds — they are not safe for pets.',
        'Toss apple slices lightly in melted coconut oil and dust with cinnamon.',
        'Spread in a single layer on the baking sheet. Bake for 2 hours, flipping halfway, until dry and crispy.',
        `Let cool and offer to ${petName} one crisp at a time — watch the contemplative chewing. Store in an airtight container for up to 5 days.`,
      ],
    },
  };

  return templates[element] || templates.Water;
}

export function CosmicRecipe({ petName, report }: CosmicRecipeProps) {
  const s = useScrollReveal();
  const sunSign = report.chartPlacements?.sun?.sign || report.sunSign || 'Pisces';
  const element = report.dominantElement || 'Water';
  const rawRecipe = report.cosmicRecipe || generateDefaultRecipe(petName, sunSign, element);
  // Worker generates 'cosmicNote' instead of 'why', normalize
  const recipe = {
    ...rawRecipe,
    why: rawRecipe.why || (rawRecipe as any).cosmicNote || '',
    ingredients: rawRecipe.ingredients || [],
    steps: rawRecipe.steps || [],
  };

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 p-[22px] px-5 bg-white rounded-[14px] border border-[#e8ddd0] max-w-[520px] sm:mx-auto"
    >
      <div className="text-[0.6rem] font-bold tracking-[2.5px] uppercase text-[#c4a265] mb-2.5">
        🍽️ {petName}'s Cosmic Recipe
      </div>

      <div className="flex gap-3.5 mb-3.5">
        <div className="text-[2.4rem]">{recipe.emoji}</div>
        <div>
          <h4 className="font-dm-serif text-[1.05rem] text-[#3d2f2a]">{recipe.name}</h4>
          <p className="text-[0.75rem] text-[#9a8578] mt-0.5">{recipe.description}</p>
        </div>
      </div>

      <p className="text-[0.78rem] text-[#5a4a42] leading-[1.6] mb-2 italic">{recipe.why}</p>
      <p className="text-[0.68rem] text-[#9a8578] mb-3.5 bg-[#faf6ef] rounded-lg px-3 py-1.5 inline-block">
        🐾 A homemade treat recipe crafted for {petName}'s cosmic palate.
      </p>

      <div className="mb-3">
        <h5 className="text-[0.68rem] font-bold text-[#c4a265] uppercase tracking-[1px] mb-1.5">
          Ingredients
        </h5>
        <ul className="list-none p-0">
          {recipe.ingredients.map((ing, i) => (
            <li key={i} className="text-[0.8rem] text-[#5a4a42] py-0.5">
              <span className="text-[#c4a265]">· </span>
              {ing}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h5 className="text-[0.68rem] font-bold text-[#c4a265] uppercase tracking-[1px] mb-1.5">
          Method
        </h5>
        <ol className="pl-[18px]">
          {recipe.steps.map((step, i) => (
            <li key={i} className="text-[0.8rem] text-[#5a4a42] py-0.5 leading-[1.5]">
              {step}
            </li>
          ))}
        </ol>
      </div>
    </motion.div>
  );
}
