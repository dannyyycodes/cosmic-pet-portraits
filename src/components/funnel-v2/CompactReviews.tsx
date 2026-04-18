import { useEffect, useRef, useState } from "react";
import {
  Cat, Dog, Fish, Rabbit, Bird, Turtle, PawPrint, Bone,
  Squirrel, Snail, Rat, Worm, Feather, Egg,
} from "lucide-react";

/* ── Pet wallpaper — scattered Lucide icons behind the review rows ── */
type PetItem = {
  x: number; y: number; size: number; rot: number; op: number;
  Icon: typeof Cat;
};

// Row 1 — full coverage across the whole section (y 0-100, x 0-100)
const WALLPAPER_PETS_ROW1: PetItem[] = [
  // top edge
  { x: 4,  y: 8,  size: 30, rot: -12, op: 0.18, Icon: Cat },
  { x: 18, y: 5,  size: 22, rot: 10,  op: 0.15, Icon: PawPrint },
  { x: 32, y: 10, size: 28, rot: 6,   op: 0.17, Icon: Rabbit },
  { x: 46, y: 4,  size: 26, rot: -8,  op: 0.16, Icon: Bird },
  { x: 60, y: 9,  size: 32, rot: 14,  op: 0.19, Icon: Dog },
  { x: 74, y: 5,  size: 24, rot: -14, op: 0.15, Icon: Feather },
  { x: 88, y: 10, size: 28, rot: 8,   op: 0.17, Icon: Rat },
  // upper-mid
  { x: 10, y: 30, size: 34, rot: 6,   op: 0.19, Icon: Fish },
  { x: 26, y: 36, size: 22, rot: -10, op: 0.15, Icon: Bone },
  { x: 42, y: 28, size: 30, rot: 16,  op: 0.18, Icon: Turtle },
  { x: 58, y: 34, size: 26, rot: -6,  op: 0.16, Icon: Cat },
  { x: 74, y: 30, size: 28, rot: 12,  op: 0.17, Icon: Bird },
  { x: 92, y: 36, size: 24, rot: -16, op: 0.15, Icon: Squirrel },
  // lower-mid
  { x: 6,  y: 58, size: 26, rot: -10, op: 0.16, Icon: Snail },
  { x: 22, y: 62, size: 32, rot: 14,  op: 0.19, Icon: PawPrint },
  { x: 38, y: 56, size: 24, rot: -8,  op: 0.15, Icon: Worm },
  { x: 54, y: 62, size: 30, rot: 10,  op: 0.18, Icon: Dog },
  { x: 70, y: 58, size: 28, rot: -14, op: 0.17, Icon: Fish },
  { x: 86, y: 62, size: 26, rot: 6,   op: 0.16, Icon: Rabbit },
  // bottom edge
  { x: 4,  y: 88, size: 22, rot: 12,  op: 0.15, Icon: Bone },
  { x: 18, y: 92, size: 28, rot: -8,  op: 0.17, Icon: PawPrint },
  { x: 32, y: 88, size: 24, rot: 14,  op: 0.15, Icon: Cat },
  { x: 48, y: 94, size: 30, rot: -12, op: 0.18, Icon: Turtle },
  { x: 64, y: 88, size: 26, rot: 8,   op: 0.16, Icon: Feather },
  { x: 78, y: 92, size: 28, rot: -6,  op: 0.17, Icon: Bird },
  { x: 94, y: 88, size: 22, rot: 10,  op: 0.14, Icon: Rat },
];

// Row 2 — staggered so the two rows don't mirror
const WALLPAPER_PETS_ROW2: PetItem[] = [
  // top edge
  { x: 8,  y: 6,  size: 28, rot: 10,  op: 0.17, Icon: Rabbit },
  { x: 22, y: 10, size: 22, rot: -12, op: 0.15, Icon: PawPrint },
  { x: 38, y: 6,  size: 30, rot: 6,   op: 0.18, Icon: Cat },
  { x: 54, y: 10, size: 26, rot: -8,  op: 0.16, Icon: Egg },
  { x: 68, y: 5,  size: 32, rot: 14,  op: 0.19, Icon: Dog },
  { x: 82, y: 10, size: 24, rot: -6,  op: 0.15, Icon: Snail },
  { x: 96, y: 5,  size: 26, rot: 12,  op: 0.16, Icon: Feather },
  // upper-mid
  { x: 4,  y: 34, size: 30, rot: -14, op: 0.18, Icon: Fish },
  { x: 18, y: 30, size: 24, rot: 10,  op: 0.15, Icon: Bird },
  { x: 34, y: 36, size: 32, rot: -4,  op: 0.19, Icon: Turtle },
  { x: 50, y: 30, size: 26, rot: 16,  op: 0.16, Icon: PawPrint },
  { x: 66, y: 36, size: 28, rot: -10, op: 0.17, Icon: Rat },
  { x: 82, y: 30, size: 24, rot: 8,   op: 0.15, Icon: Rabbit },
  // lower-mid
  { x: 12, y: 60, size: 30, rot: 12,  op: 0.18, Icon: Dog },
  { x: 28, y: 56, size: 24, rot: -16, op: 0.15, Icon: Squirrel },
  { x: 44, y: 62, size: 32, rot: 6,   op: 0.19, Icon: Cat },
  { x: 60, y: 56, size: 26, rot: -10, op: 0.16, Icon: Bone },
  { x: 76, y: 62, size: 28, rot: 14,  op: 0.17, Icon: Fish },
  { x: 92, y: 58, size: 24, rot: -6,  op: 0.15, Icon: Bird },
  // bottom edge
  { x: 6,  y: 92, size: 26, rot: -10, op: 0.16, Icon: PawPrint },
  { x: 20, y: 88, size: 22, rot: 12,  op: 0.14, Icon: Worm },
  { x: 36, y: 94, size: 30, rot: 6,   op: 0.18, Icon: Turtle },
  { x: 52, y: 88, size: 24, rot: -8,  op: 0.15, Icon: Egg },
  { x: 68, y: 92, size: 28, rot: 14,  op: 0.17, Icon: Rabbit },
  { x: 84, y: 88, size: 26, rot: -14, op: 0.16, Icon: Cat },
  { x: 96, y: 92, size: 22, rot: 8,   op: 0.14, Icon: Snail },
];

const PetWallpaper = ({ row }: { row: 1 | 2 }) => {
  const pets = row === 1 ? WALLPAPER_PETS_ROW1 : WALLPAPER_PETS_ROW2;
  return (
    <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {pets.map((p, i) => (
        <p.Icon
          key={i}
          size={p.size}
          strokeWidth={1.4}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            transform: `translate(-50%, -50%) rotate(${p.rot}deg)`,
            color: "#c4a265",
            opacity: p.op,
          }}
        />
      ))}
    </div>
  );
};

function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold, rootMargin: "0px 0px -30px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

type Review = { name: string; pet: string; breed: string; img: number; text: string };

// ── Batch 1 (Grok set 1) ────────────────────────────────────
const ROW_1: Review[] = [
  { name: "Sarah M.", pet: "Bailey, Golden Retriever", breed: "golden-retriever", img: 1, text: "Ok so I was super skeptical but the soul reading nailed how Bailey gets all zoomie when the moon is full. The SoulSpeak thing is wild, I asked why he steals socks and he basically said he likes my smell on them." },
  { name: "Mike T.", pet: "Louie, French Bulldog", breed: "french-bulldog", img: 1, text: "My husband thinks I've lost it but I swear the compatibility section explained why Louie hates my mom's yorkie so much. The cosmic portrait looks exactly like him too." },
  { name: "Emily R.", pet: "Luna, Maine Coon", breed: "maine-coon", img: 1, text: "Not even into astrology but the part about her being anxious around loud noises was spot on. Asked her through SoulSpeak why she only drinks from the faucet and her answer made me laugh." },
  { name: "David K.", pet: "Max, Labrador", breed: "labrador", img: 1, text: "Got this for my lab who passed last year. The soul letter made me cry but in a good way. Still not over him." },
  { name: "Jessica P.", pet: "Princess, Persian", breed: "persian", img: 1, text: "So I bought this as a joke and now I can't stop using SoulSpeak. Asked Princess why she stares at me while I sleep and she said she's protecting my energy or something." },
  { name: "Chris B.", pet: "Zeus, German Shepherd", breed: "german-shepherd", img: 1, text: "The reading said he's a protector soul and that tracks 100%. SoulSpeak is addictive, I ask him stuff all the time now." },
  { name: "Anna L.", pet: "Mochi, Ragdoll", breed: "ragdoll", img: 1, text: "I'm not gonna lie I teared up reading the soul letter. Mochi's chart matches her personality perfectly, even the picky eating part." },
  { name: "Ryan S.", pet: "Winston, Corgi", breed: "corgi", img: 1, text: "Ok this is weirdly accurate. The cosmic portrait is hanging in my living room now. My friends make fun of me but whatever." },
  { name: "Lauren H.", pet: "Shadow, Siamese", breed: "siamese", img: 1, text: "Asked Shadow through SoulSpeak why he yells at 3am and he said the spirits are loud then. Not sure if I believe it but I laughed so hard." },
  { name: "Tyler M.", pet: "Bruno, Bulldog", breed: "bulldog", img: 1, text: "Bought this right after Bruno passed. The reading helped me process it a little. Still miss him every day." },
  { name: "Megan F.", pet: "Coco, Poodle", breed: "poodle", img: 1, text: "My poodle's soul reading said she's an old soul and honestly it explains why she's so chill compared to other dogs. SoulSpeak is my new favorite thing." },
  { name: "Josh C.", pet: "Scout, Beagle", breed: "beagle", img: 1, text: "The compatibility with my other dog was scary accurate. They really do fight over toys exactly like the report said." },
  { name: "Olivia W.", pet: "Ollie, Scottish Fold", breed: "scottish-fold", img: 1, text: "I was a total skeptic but the part about him hiding when strangers come over was dead on. Now I use SoulSpeak every night before bed." },
  { name: "Nathan D.", pet: "Loki, Husky", breed: "husky", img: 1, text: "Loki's cosmic portrait looks just like him howling at the moon. The soul reading explained his dramatic personality so well." },
  { name: "Sophia G.", pet: "Zara, Bengal", breed: "bengal", img: 1, text: "So my cat basically told me through SoulSpeak that she knocks stuff off tables because she's bored. Makes sense I guess." },
  { name: "Ethan J.", pet: "Oscar, Dachshund", breed: "dachshund", img: 1, text: "Short and sweet, this thing is spot on for my sausage dog. The anxiety around thunderstorms part hit different." },
  { name: "Isabella V.", pet: "Winston, British Shorthair", breed: "british-shorthair", img: 1, text: "Got the full package and the soul letter was so beautiful. My british shorthair is basically a little philosopher according to this." },
  { name: "Caleb R.", pet: "Tank, Rottweiler", breed: "rottweiler", img: 1, text: "Everyone says rotties are tough but the reading showed Tank has a really gentle soul. SoulSpeak confirmed it when I asked him." },
  { name: "Ava K.", pet: "Cleo, Abyssinian", breed: "abyssinian", img: 1, text: "My abyssinian is so active and the chart explained it with her fire energy or whatever. I don't get astrology but it's fun." },
  { name: "Logan P.", pet: "Rocky, Boxer", breed: "boxer", img: 1, text: "Rocky passed two months ago and I got this on a whim. The soul reading brought me some peace I didn't know I needed." },
  { name: "Mia T.", pet: "Bella, Shih Tzu", breed: "shih-tzu", img: 1, text: "The compatibility section with me was hilarious. Apparently we're both stubborn souls. Bella's portrait is adorable." },
  { name: "Jacob L.", pet: "Taco, Chihuahua", breed: "chihuahua", img: 1, text: "Ok so my tiny terror's soul reading said he's actually a big soul in a small body and that explains everything." },
  { name: "Harper N.", pet: "Misty, Birman", breed: "birman", img: 1, text: "Asked Misty why she only sits on my keyboard and SoulSpeak said she wants my attention. Smart girl." },
  { name: "Aiden B.", pet: "Charlie, Cavalier King Charles", breed: "cavalier-kcs", img: 1, text: "My cavalier is the sweetest and the soul letter captured that perfectly. I read it to him every night now." },
  { name: "Ella S.", pet: "Pixie, Yorkshire Terrier", breed: "yorkshire-terrier", img: 1, text: "Wasn't expecting much but the reading about her being sassy was 100% right. SoulSpeak is wild." },
  { name: "Noah H.", pet: "Blue, Australian Shepherd", breed: "australian-shepherd", img: 1, text: "Blue's cosmic portrait is so good I made it my phone wallpaper. The herding instinct part in the reading was funny." },
  { name: "Lily M.", pet: "Smokey, Russian Blue", breed: "russian-blue", img: 1, text: "My russian blue is kinda aloof and the soul reading explained it as him being a wise old soul. Kinda makes me feel better about it." },
  { name: "Mason D.", pet: "Peanut, Pug", breed: "pug", img: 1, text: "Peanut's soul reading was so accurate about his snoring and lazy days. I showed it to my vet and we both laughed." },
  { name: "Zoe C.", pet: "Thor, Maine Coon", breed: "maine-coon", img: 2, text: "Got this for my giant maine coon and the portrait makes him look majestic as hell. SoulSpeak answers are surprisingly on point." },
  { name: "Lucas R.", pet: "Dash, Border Collie", breed: "border-collie", img: 1, text: "My border collie needs constant stimulation and the chart called it out immediately. Now I feel less guilty when I can't keep up." },
  { name: "Amelia P.", pet: "Luna, Sphynx", breed: "sphynx", img: 1, text: "The hairless thing and her needing extra warmth was mentioned in the soul reading. Asked her through SoulSpeak if she's cold and she said yes lol." },
  { name: "Gabriel F.", pet: "Duke, Great Dane", breed: "great-dane", img: 1, text: "For such a big dog the reading said he has a gentle giant soul. Duke passed recently and this helped." },
  { name: "Charlotte B.", pet: "Snowy, Maltese", breed: "maltese", img: 1, text: "My little maltese is a diva and the soul reading confirmed it. The cosmic portrait is framed on my wall now." },
  { name: "Elijah T.", pet: "Cloud, Samoyed", breed: "samoyed", img: 1, text: "Cloud's fluffy smile in the portrait is perfect. SoulSpeak told me he loves snow because it feels like home." },
];

// ── Batch 2 (Grok set 2 + exotics) ──────────────────────────
const ROW_2: Review[] = [
  { name: "Katie B.", pet: "Murphy, Golden Retriever", breed: "golden-retriever", img: 2, text: "So I downloaded this at 2am because I couldn't sleep and now I'm obsessed. Murphy's soul reading said he's here to teach unconditional love and I'm not crying you are." },
  { name: "Derek S.", pet: "Frank, French Bulldog", breed: "french-bulldog", img: 2, text: "Was totally skeptical but the SoulSpeak chat actually explained why Frank farts and then looks at me like I did it. Laughed way too hard." },
  { name: "Rachel T.", pet: "Bear, Maine Coon", breed: "maine-coon", img: 3, text: "My big maine coon's cosmic portrait is insane, he looks like a lion. The compatibility section with my boyfriend was lowkey accurate and now we joke about it." },
  { name: "Jordan H.", pet: "River, Labrador", breed: "labrador", img: 2, text: "Got this after my lab passed away last month. The soul letter felt like River was talking directly to me. Still hurts but it helped a little." },
  { name: "Samantha L.", pet: "Willow, Ragdoll", breed: "ragdoll", img: 2, text: "I asked Willow through SoulSpeak if she loves me and she said more than the sunbeam on the couch. I'm deceased." },
  { name: "Brandon M.", pet: "Koda, Husky", breed: "husky", img: 2, text: "Koda's reading called him a free spirit who howls at the universe. That tracks so hard. The portrait is now my lock screen." },
  { name: "Taylor C.", pet: "Gizmo, Persian", breed: "persian", img: 2, text: "Ok I bought this thinking it was silly but Gizmo's soul reading explained her dramatic sighs perfectly. My roommate keeps asking me what the cat said today." },
  { name: "Alex R.", pet: "Biscuit, Corgi", breed: "corgi", img: 2, text: "The part about my corgi being a little chaos goblin with a big heart was too real. SoulSpeak is dangerous, I spent an hour asking dumb questions." },
  { name: "Nicole P.", pet: "Sapphire, Siamese", breed: "siamese", img: 2, text: "My siamese is super vocal and the soul reading said she's an old soul with opinions. Asked her why she screams at birds and her answer was sassy." },
  { name: "Kevin D.", pet: "Rex, German Shepherd", breed: "german-shepherd", img: 2, text: "Rex passed two years ago and I still miss him every day. The soul letter from Little Souls made me smile through the tears." },
  { name: "Hannah W.", pet: "Jax, Bengal", breed: "bengal", img: 2, text: "Jax's cosmic portrait looks exactly like him mid-zoomies. I showed it to my mom and she immediately wanted one for her cat too." },
  { name: "Dylan F.", pet: "Otis, Bulldog", breed: "bulldog", img: 2, text: "I'm not an astrology person at all but Otis's reading about being a loyal couch potato was spot on. Made me feel seen as his human too." },
  { name: "Brooke A.", pet: "Finn, Scottish Fold", breed: "scottish-fold", img: 2, text: "Finn's SoulSpeak answers are so calm and wise it's creepy. Asked why he headbutts me at 5am and he said he's recharging my heart." },
  { name: "Justin G.", pet: "Lulu, Poodle", breed: "poodle", img: 2, text: "My standard poodle's soul reading said she's elegant but playful. The portrait is gorgeous, I framed it." },
  { name: "Megan K.", pet: "Bailey, Beagle", breed: "beagle", img: 2, text: "Bailey's compatibility with the neighbor's dog explained why they always bark at each other through the fence. Kinda funny." },
  { name: "Connor L.", pet: "Dash, Abyssinian", breed: "abyssinian", img: 2, text: "Was laughing the whole time reading Dash's soul letter. Apparently he's an adventurer soul stuck in an apartment. Poor guy." },
  { name: "Leah S.", pet: "Mila, Boxer", breed: "boxer", img: 2, text: "Mila passed away in January and getting her soul reading felt like getting one last hug. I keep the letter in my nightstand." },
  { name: "Ryan V.", pet: "Frankfurter, Dachshund", breed: "dachshund", img: 2, text: "My wiener dog's reading called him a sausage with big feelings and I can't stop saying that now." },
  { name: "Kayla M.", pet: "Oliver, British Shorthair", breed: "british-shorthair", img: 2, text: "Oliver's soul reading said he's a quiet guardian. Now when he sits on my chest I feel like he's actually protecting me or something." },
  { name: "Tyler J.", pet: "Bruno, Rottweiler", breed: "rottweiler", img: 2, text: "Everyone thinks rotties are scary but Bruno's soul profile is the softest thing ever. SoulSpeak made me tear up." },
  { name: "Sophia R.", pet: "Angel, Birman", breed: "birman", img: 2, text: "The cosmic portrait of my birman is angelic, fits her name perfectly. I use SoulSpeak when I'm stressed and it actually calms me down." },
  { name: "Ethan P.", pet: "Teddy, Cavalier King Charles", breed: "cavalier-kcs", img: 2, text: "Teddy's reading described him as pure love in dog form. I already knew that but seeing it written out hit different." },
  { name: "Ava N.", pet: "Pepper, Chihuahua", breed: "chihuahua", img: 2, text: "My tiny chihuahua has such a big attitude and the soul reading roasted her lovingly. Laughed the whole time." },
  { name: "Liam H.", pet: "Coco, Yorkshire Terrier", breed: "yorkshire-terrier", img: 2, text: "Coco's SoulSpeak session was hilarious. Asked why she barks at nothing and she said she's talking to the fairies. Sure buddy." },
  { name: "Isabella T.", pet: "Skye, Australian Shepherd", breed: "australian-shepherd", img: 2, text: "Skye needs so much mental stimulation and the chart explained it with her cosmic herder energy. Makes training feel less frustrating." },
  { name: "Noah B.", pet: "Ghost, Russian Blue", breed: "russian-blue", img: 2, text: "My russian blue is super independent and the reading called it ancient wisdom vibes. I kinda love that." },
  { name: "Charlotte D.", pet: "Mochi, Pug", breed: "pug", img: 2, text: "Mochi's cosmic portrait makes his wrinkles look majestic. The soul letter was so sweet I read it twice." },
  { name: "Mason C.", pet: "Princess, Shih Tzu", breed: "shih-tzu", img: 2, text: "Bought this on a whim and now my whole family is hooked on what Princess says through SoulSpeak." },
  { name: "Evelyn G.", pet: "Loki, Maine Coon", breed: "maine-coon", img: 1, text: "Loki's soul reading said he's a trickster with a golden heart. That explains the 3am parkour sessions." },
  { name: "Gabriel F.", pet: "Nova, Border Collie", breed: "border-collie", img: 2, text: "Nova's reading was so detailed I felt like I understood her better after 5 years together. The portrait is beautiful." },
  { name: "Scarlett M.", pet: "Cleopatra, Sphynx", breed: "sphynx", img: 2, text: "My sphynx gets cold easily and the soul reading mentioned her needing extra warmth and cuddles. She basically lives on my lap now." },
  { name: "Owen L.", pet: "Titan, Great Dane", breed: "great-dane", img: 2, text: "For a giant dog Titan's soul is apparently very gentle. SoulSpeak confirmed he just wants belly rubs and snacks." },
  { name: "Harper K.", pet: "Fluffy, Maltese", breed: "maltese", img: 2, text: "Fluffy's soul letter made me emotional even though she's still here. It feels like someone really sees her." },
  { name: "Lucas P.", pet: "Arctic, Samoyed", breed: "samoyed", img: 2, text: "Arctic's fluffy cosmic portrait is everything. Asked him through SoulSpeak if he likes being brushed and he said it feels like flying." },
  { name: "Grace L.", pet: "Pickles, Guinea Pig", breed: "guinea-pig", img: 1, text: "Got this for my guinea pig as a joke but the reading was weirdly sweet. Asked him why he wheeks so much through SoulSpeak." },
  { name: "Owen K.", pet: "Sheldon, Tortoise", breed: "tortoise", img: 1, text: "My tortoise is slow and steady just like the soul reading said. The portrait is cute even if he's a reptile." },
  { name: "Scarlett J.", pet: "Daisy, Cocker Spaniel", breed: "cocker-spaniel", img: 1, text: "Daisy's soul letter made me emotional. She passed last summer and this felt like one last message." },
  { name: "Zoe R.", pet: "Popcorn, Guinea Pig", breed: "guinea-pig", img: 2, text: "My guinea pig's reading was surprisingly deep for such a little guy. He told me he loves when I sing to him." },
  { name: "Elijah S.", pet: "Storm, Horse", breed: "horse", img: 1, text: "Got this for my horse and the soul reading about his free spirit energy was perfect. The portrait looks so majestic in the barn." },
  { name: "Mia T.", pet: "Rosie, Cocker Spaniel", breed: "cocker-spaniel", img: 2, text: "Rosie's SoulSpeak answers always make me smile. Asked why she rolls in gross stuff and she said she's collecting stories. Weird but cute." },
];

const ReviewCard = ({ review }: { review: Review }) => (
  <div
    className="review-marquee-card flex-shrink-0 rounded-xl p-4"
    style={{
      width: 320,
      background: "#fff",
      border: "1px solid rgba(0,0,0,0.05)",
      boxShadow: "0 1px 8px rgba(0,0,0,0.03)",
    }}
  >
    <div className="flex items-center gap-2.5 mb-2.5">
      <img
        src={`/breeds/${review.breed}-${review.img}.jpg`}
        alt=""
        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
        style={{ border: "2px solid var(--cream3, #f3eadb)" }}
        onError={(e) => {
          const el = e.currentTarget;
          el.style.display = "none";
          const fallback = el.nextElementSibling as HTMLElement;
          if (fallback) fallback.style.display = "flex";
        }}
      />
      <div
        className="w-9 h-9 rounded-full items-center justify-center flex-shrink-0 hidden"
        style={{
          background: "linear-gradient(135deg, var(--cream3, #f3eadb), var(--sand, #d6c8b6))",
          fontFamily: "Caveat, cursive",
          fontSize: "0.9rem",
          color: "var(--earth, #6e6259)",
        }}
      >
        {review.name.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span style={{ fontWeight: 600, fontSize: "0.82rem", color: "var(--ink, #1f1c18)" }}>
            {review.name}
          </span>
          <span
            aria-label="Verified"
            title="Verified"
            className="inline-flex items-center justify-center rounded-full"
            style={{
              width: 14,
              height: 14,
              background: "#4a8c5c",
              flexShrink: 0,
            }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12l5 5L20 7" />
            </svg>
          </span>
        </div>
        <p style={{ fontSize: "0.72rem", color: "var(--muted, #958779)" }}>{review.pet}</p>
      </div>
      <div className="flex gap-0.5 flex-shrink-0">
        {[1, 2, 3, 4, 5].map((s) => (
          <svg key={s} width="12" height="12" viewBox="0 0 20 20" aria-hidden="true">
            <path
              fill="#c4a265"
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
        ))}
      </div>
    </div>
    <p
      style={{
        fontFamily: "Cormorant, Georgia, serif",
        fontStyle: "italic",
        fontSize: "0.92rem",
        color: "var(--earth, #6e6259)",
        lineHeight: 1.55,
      }}
    >
      &ldquo;{review.text}&rdquo;
    </p>
  </div>
);

const MarqueeRow = ({
  reviews,
  direction = "left",
  speed = 40,
}: {
  reviews: Review[];
  direction?: "left" | "right";
  speed?: number;
}) => (
  <div
    className="marquee-row flex overflow-hidden w-full"
    style={{
      ["--marquee-duration" as string]: `${speed}s`,
      ["--marquee-direction" as string]: direction === "left" ? "normal" : "reverse",
    }}
  >
    <div className="marquee-track flex gap-5" style={{ width: "max-content" }}>
      {reviews.map((r, i) => (
        <ReviewCard key={`a-${i}`} review={r} />
      ))}
      {reviews.map((r, i) => (
        <ReviewCard key={`b-${i}`} review={r} />
      ))}
    </div>
  </div>
);

export const CompactReviews = ({ row = 1 }: { row?: 1 | 2 }) => {
  const { ref, visible } = useScrollReveal(0.1);

  return (
    <section
      ref={ref}
      className="relative py-2 sm:py-3 overflow-hidden"
      style={{
        background: "var(--cream, #FFFDF5)",
      }}
    >
      <PetWallpaper row={row} />
      <div
        className="marquee-container transition-all duration-[1400ms]"
        style={{
          opacity: visible ? 1 : 0,
          transitionDelay: "0.1s",
          position: "relative",
          zIndex: 1,
        }}
      >
        {row === 1 ? (
          <MarqueeRow reviews={ROW_1} direction="left" speed={200} />
        ) : (
          <MarqueeRow reviews={ROW_2} direction="right" speed={220} />
        )}
      </div>

      <style>{`
        .marquee-container {
          -webkit-mask-image: linear-gradient(
            to right,
            transparent 0%,
            black 4%,
            black 96%,
            transparent 100%
          );
          mask-image: linear-gradient(
            to right,
            transparent 0%,
            black 4%,
            black 96%,
            transparent 100%
          );
        }

        .marquee-track {
          will-change: transform;
          animation-name: marqueeScroll;
          animation-duration: var(--marquee-duration, 40s);
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          animation-direction: var(--marquee-direction, normal);
        }

        .marquee-row:hover .marquee-track {
          animation-play-state: paused;
        }

        @keyframes marqueeScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @media (max-width: 768px) {
          .review-marquee-card {
            width: 275px !important;
          }
          .marquee-container {
            gap: 12px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .marquee-track {
            animation-play-state: paused;
          }
        }
      `}</style>
    </section>
  );
};
