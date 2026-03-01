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
  // TODO: Add to generate-cosmic-report prompt
  const templates: Record<string, RecipeData> = {
    Water: {
      name: 'Moonlit Comfort Bowl',
      emoji: '🥣',
      description: `A recipe inspired by ${petName}'s ${sunSign} soul`,
      why: `This dish channels ${petName}'s Water-dominant chart: warm, nurturing, and deeply comforting. The kind of meal that feels like a hug from the inside — gentle, restorative, made with love.`,
      ingredients: [
        '1 cup jasmine rice (for grounding Earth energy)',
        `1 salmon fillet (${sunSign === 'Pisces' ? 'Pisces = the fish, obviously' : 'Water sign nourishment'})`,
        '1 cup coconut milk (lunar nourishment)',
        'Fresh ginger + turmeric (warmth for a Water soul)',
        'Honey + soy glaze (bold sweetness)',
        'Sesame seeds + spring onion (for the finishing stardust)',
      ],
      steps: [
        'Cook jasmine rice in coconut milk instead of water — instant comfort.',
        'Glaze salmon with honey, soy, ginger, and a squeeze of lime. Bake 12 mins at 200°C.',
        'Warm remaining coconut milk with turmeric and a pinch of black pepper for a golden drizzle.',
        'Bowl it up: rice base, salmon on top, golden drizzle, sesame seeds, spring onion.',
        `Eat slowly. Preferably with ${petName} at your feet. They'd approve.`,
      ],
    },
    Fire: {
      name: 'Blaze & Glory Tacos',
      emoji: '🌮',
      description: `A recipe inspired by ${petName}'s fiery ${sunSign} energy`,
      why: `This dish channels ${petName}'s Fire-dominant chart: bold, vibrant, and unapologetically flavourful. Every bite is a celebration.`,
      ingredients: [
        'Soft corn tortillas (foundation energy)',
        'Spiced chicken thighs with smoked paprika + cayenne (Fire energy)',
        'Mango salsa (tropical sweetness to balance the heat)',
        'Pickled red onions (the spark)',
        'Lime crema (cooling lunar influence)',
        'Fresh coriander + lime wedges (the finishing flames)',
      ],
      steps: [
        'Marinate chicken in paprika, cumin, garlic, lime, and a hit of cayenne — let the Fire build.',
        'Grill until charred and bold. Slice into strips.',
        'Char tortillas directly over flame for authentic smoky edges.',
        `Layer: tortilla, chicken, mango salsa, pickled onion, crema, coriander.`,
        `Eat with your hands. ${petName} would respect the chaos.`,
      ],
    },
    Earth: {
      name: 'Grounded Harvest Bowl',
      emoji: '🥗',
      description: `A recipe inspired by ${petName}'s steady ${sunSign} nature`,
      why: `This dish channels ${petName}'s Earth-dominant chart: grounding, nourishing, and built to last. Comfort food that makes you feel like everything's going to be okay.`,
      ingredients: [
        'Roasted sweet potato (Earth grounding)',
        'Quinoa or farro (ancient grains for an old soul)',
        'Roasted chickpeas with cumin (steady protein)',
        'Tahini dressing (creamy stability)',
        'Pomegranate seeds (jewels of the earth)',
        'Fresh herbs + toasted nuts (for texture and depth)',
      ],
      steps: [
        'Roast sweet potato wedges with olive oil, salt, and a pinch of cinnamon — 25 mins at 200°C.',
        'Cook grains according to package. Fluff with a fork.',
        'Toss chickpeas in cumin + paprika, roast until crunchy.',
        'Whisk tahini with lemon, garlic, and water until drizzleable.',
        `Assemble bowl. Eat slowly. ${petName} approves of the ritual.`,
      ],
    },
    Air: {
      name: 'Cloud Nine Pasta',
      emoji: '🍝',
      description: `A recipe inspired by ${petName}'s airy ${sunSign} spirit`,
      why: `This dish channels ${petName}'s Air-dominant chart: light, surprising, and intellectually satisfying. The kind of meal that makes you think "who am I and why is this so good?"`,
      ingredients: [
        'Fresh pasta (lightness in carb form)',
        'Lemon + brown butter (bright Air energy)',
        'Crispy sage leaves (herbal wisdom)',
        'Burrata (creamy cloud centre)',
        'Toasted pine nuts (scattered like thoughts)',
        'Black pepper + flaky salt (the finishing breeze)',
      ],
      steps: [
        'Cook pasta until just al dente — Air signs don\'t do overcooked.',
        'Brown butter in a pan until nutty and golden. Add fresh sage until crispy.',
        'Toss pasta in brown butter with lemon zest and juice.',
        'Plate. Tear burrata over the top. Scatter pine nuts and crispy sage.',
        `Eat while contemplating the universe. ${petName} is already doing that.`,
      ],
    },
  };

  return templates[element] || templates.Water;
}

export function CosmicRecipe({ petName, report }: CosmicRecipeProps) {
  const s = useScrollReveal();
  const sunSign = report.chartPlacements?.sun?.sign || report.sunSign || 'Pisces';
  const element = report.dominantElement || 'Water';
  const recipe = report.cosmicRecipe || generateDefaultRecipe(petName, sunSign, element);

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

      <p className="text-[0.78rem] text-[#5a4a42] leading-[1.6] mb-3.5 italic">{recipe.why}</p>

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
