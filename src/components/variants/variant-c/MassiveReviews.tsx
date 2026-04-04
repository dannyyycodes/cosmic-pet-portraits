import { useState, useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { breedImages } from "@/assets/breedMapping";

// Parse breed slug from pet string e.g. "Buddy, Labrador, 6" → "labrador"
function getBreedSlug(pet: string): string | null {
  const breed = pet.split(',')[1]?.trim().toLowerCase() ?? '';
  const map: Record<string, string> = {
    'labrador': 'labrador', 'lab mix': 'labrador', 'lab': 'labrador',
    'golden retriever': 'golden-retriever', 'golden mix': 'golden-retriever',
    'beagle': 'beagle',
    'german shepherd': 'german-shepherd',
    'cavalier king charles': 'cavalier-kcs',
    'boxer': 'boxer',
    'border collie': 'border-collie',
    'dachshund': 'dachshund',
    'australian shepherd': 'australian-shepherd',
    'rottweiler': 'rottweiler',
    'french bulldog': 'french-bulldog',
    'great dane': 'great-dane',
    'cocker spaniel': 'cocker-spaniel',
    'pit bull mix': 'pit-bull', 'pit bull': 'pit-bull',
    'shih tzu': 'shih-tzu',
    'labradoodle': 'labradoodle',
    'poodle': 'poodle',
    'corgi': 'corgi',
    'bulldog': 'bulldog', 'english bulldog': 'bulldog',
    'chihuahua': 'chihuahua',
    'staffy': 'staffy',
    'maltese': 'maltese',
    'cockapoo': 'cockapoo',
    'ragdoll': 'ragdoll',
    'siamese': 'siamese',
    'black cat': 'black-cat',
    'tabby': 'tabby', 'tabby cat': 'tabby',
    'bengal': 'bengal',
    'tuxedo cat': 'tuxedo-cat',
    'orange tabby': 'orange-tabby',
    'persian': 'persian', 'white persian': 'persian',
    'calico': 'calico',
    'maine coon': 'maine-coon',
    'russian blue': 'russian-blue',
    'scottish fold': 'scottish-fold',
    'ginger cat': 'ginger-cat',
    'british shorthair': 'british-shorthair',
    'cat': 'cat-generic',
    'holland lop': 'holland-lop',
    'guinea pig': 'guinea-pig',
    'hamster': 'hamster',
    'ferret': 'ferret',
  };
  return map[breed] ?? null;
}

// Pre-assign a unique image to each review — never reuse the same image
function assignPetImages(reviews: Review[]): (string | null)[] {
  const counters: Record<string, number> = {};
  return reviews.map(r => {
    const slug = getBreedSlug(r.pet);
    if (!slug) return null;
    const imgs = breedImages[slug];
    if (!imgs?.length) return null;
    const i = counters[slug] ?? 0;
    counters[slug] = i + 1;
    if (i >= imgs.length) return null; // exhausted unique images for this breed
    return imgs[i];
  });
}

const COLORS = {
  black: "#141210", ink: "#1f1c18", deep: "#2e2a24", warm: "#4d443b",
  earth: "#6e6259", muted: "#958779", faded: "#bfb2a3", sand: "#d6c8b6",
  cream: "#FFFDF5", cream2: "#faf4e8", cream3: "#f3eadb",
  rose: "#bf524a", roseLight: "#d4857e", gold: "#c4a265",
};

const ALL_REVIEWS = [
  { name: "Sarah M.", pet: "Buddy, Labrador, 6", text: "It described things about Buddy that I've never been able to put into words. My partner and I both teared up reading it together.", rating: 5, tag: "verified", time: "2 weeks ago" },
  { name: "James T.", pet: "Luna, Golden Retriever, 4", text: "Bought it as a joke honestly. Then I read it and got genuinely emotional. The emotional blueprint section nailed Luna's personality.", rating: 5, tag: "verified", time: "3 weeks ago" },
  { name: "Mark D.", pet: "Charlie, Beagle, 4", text: "Best gift I've ever given my wife. She read it three times and kept reading quotes out loud to me.", rating: 5, tag: "top reviewer", time: "1 month ago" },
  { name: "David R.", pet: "Max, Golden Retriever, 8", text: "Max is getting older. The keepsake PDF is something I'll keep forever. It captures his spirit perfectly.", rating: 5, tag: "verified", time: "5 days ago" },
  { name: "Tom H.", pet: "Bear, German Shepherd, 5", text: "The compatibility chart between me and Bear made my wife cry. It knew things we never told it.", rating: 5, time: "3 days ago" },
  { name: "Rachel S.", pet: "Daisy, Cavalier King Charles, 3", text: "How did it know she sits by the door 20 minutes before I get home? The emotional blueprint was scary accurate.", rating: 5, tag: "verified", time: "1 week ago" },
  { name: "Mike P.", pet: "Rocky, Boxer, 7", text: "Got this for my daughter's dog. She framed the AI portrait and hung it in her apartment. Beautiful.", rating: 5, time: "2 weeks ago" },
  { name: "Lisa K.", pet: "Cooper, Border Collie, 2", text: "The cosmic profile was so specific to Cooper. It mentioned his herding behaviour and need for mental stimulation before I even said anything.", rating: 5, tag: "verified", time: "4 days ago" },
  { name: "Nathan W.", pet: "Biscuit, Dachshund, 9", text: "Worth every penny.", rating: 5, time: "1 month ago" },
  { name: "Anna C.", pet: "Pepper, Australian Shepherd, 1", text: "Even for a young pup, the personality insights were incredibly accurate. The archetype section was fascinating.", rating: 5, tag: "verified", time: "6 days ago" },
  { name: "Chris B.", pet: "Zeus, Rottweiler, 5", text: "Everyone thinks Rotties are tough. The emotional blueprint captured how gentle and emotionally sensitive Zeus really is.", rating: 5, time: "3 weeks ago" },
  { name: "Jenna F.", pet: "Noodle, French Bulldog, 3", text: "Used SoulSpeak to 'talk' to Noodle and the responses were so him. The part about being 'a comedian who performs exclusively for one audience' killed me", rating: 5, tag: "verified", time: "1 week ago" },
  { name: "Andrew L.", pet: "Duke, Great Dane, 4", text: "Duke's archetype was 'The Gentle Guardian.' My whole family gathered around to read the full report.", rating: 5, time: "2 weeks ago" },
  { name: "Samantha J.", pet: "Rosie, Cocker Spaniel, 6", text: "I've never read something that captured a dog's personality so perfectly. The shareable card is now my phone wallpaper.", rating: 5, tag: "top reviewer", time: "4 weeks ago" },
  { name: "Kevin O.", pet: "Bruno, Pit Bull Mix, 3", text: "We rescued Bruno. The emotional blueprint helped us understand his anxious behaviours so much better. Actually changed how we care for him.", rating: 5, tag: "verified", time: "5 days ago" },
  { name: "Olivia N.", pet: "Milo, Shih Tzu, 10", text: "So good.", rating: 5, time: "2 weeks ago" },
  { name: "Daniel G.", pet: "Scout, Labradoodle, 2", text: "The emotional blueprint had things about Scout that I've noticed but never articulated. Then I tried SoulSpeak and it was like actually hearing his thoughts.", rating: 5, tag: "verified", time: "1 week ago" },
  { name: "Amy R.", pet: "Coco, Poodle, 5", text: "Bought readings for all three of my dogs. Each one was completely unique with different archetypes. This isn't generic at all.", rating: 5, time: "3 weeks ago" },
  { name: "Priya K.", pet: "Cinnamon, Ragdoll, 2", text: "Scary accurate. The emotional blueprint knew she thumps her tail when she's jealous. How?", rating: 5, tag: "verified", time: "2 weeks ago" },
  { name: "Emma L.", pet: "Mochi, Siamese, 5", text: "We framed the AI portrait. It's hanging in our living room. The writing in the keepsake PDF was so personal and warm.", rating: 5, tag: "verified", time: "10 days ago" },
  { name: "Sophie A.", pet: "Shadow, Black Cat, 7", text: "Shadow's archetype was 'The Silent Observer.' His cosmic profile described him as 'choosing carefully who earns his gaze.' I'm not crying, you are.", rating: 5, time: "1 week ago" },
  { name: "Maya R.", pet: "Whiskers, Tabby, 12", text: "My old man Whiskers deserved this. The report captured 12 years of love in the most beautiful way.", rating: 5, tag: "top reviewer", time: "3 weeks ago" },
  { name: "Tanya B.", pet: "Nala, Bengal, 3", text: "The cosmic profile section about her 'wild spirit in a domestic soul' was so perfect.", rating: 5, tag: "verified", time: "4 days ago" },
  { name: "Jackie W.", pet: "Boots, Tuxedo Cat, 8", text: "Used SoulSpeak and asked Boots why he knocks things off tables. The answer was hilarious and honestly probably accurate.", rating: 5, time: "2 weeks ago" },
  { name: "Lily H.", pet: "Mango, Orange Tabby, 4", text: "The compatibility chart showed a 97% emotional bond score between me and Mango. I always knew we were soulmates, now I have proof.", rating: 5, tag: "verified", time: "6 days ago" },
  { name: "Chloe M.", pet: "Pearl, White Persian, 6", text: "Nice!", rating: 5, time: "3 weeks ago" },
  { name: "Grace T.", pet: "Olive, Calico, 3", text: "Bought this for my sister's birthday. She called me crying. The AI portrait looked exactly like Olive somehow.", rating: 5, tag: "verified", time: "1 week ago" },
  { name: "Nina D.", pet: "Socks, Maine Coon, 5", text: "The archetype 'The Gentle Giant' was spot on. The report said he 'communicates through deliberate, slow blinks of trust.'", rating: 5, time: "2 weeks ago" },
  { name: "Alex F.", pet: "Loki, Russian Blue, 4", text: "Named him Loki because he's mischievous. The cosmic profile called him 'a strategist who tests every boundary with elegance.'", rating: 5, tag: "verified", time: "8 days ago" },
  { name: "Hannah P.", pet: "Biscuit, Scottish Fold, 2", text: "The AI portrait alone was worth it. Then the personality reading made me realise how much Biscuit means to me. Then SoulSpeak made me cry. 10/10.", rating: 5, time: "1 month ago" },
  { name: "Zoe C.", pet: "Pumpkin, Ginger Cat, 9", text: "Pumpkin has been with me through my worst years. This report honoured that bond in a way I can't describe.", rating: 5, tag: "verified", time: "5 days ago" },
  { name: "Rebecca J.", pet: "Mist, British Shorthair, 3", text: "Loved it!", rating: 5, time: "2 weeks ago" },
  { name: "Aisha T.", pet: "Cinnamon, Holland Lop, 2", text: "I didn't expect this level of depth for a rabbit. The emotional blueprint section actually helped me understand her better.", rating: 5, tag: "verified", time: "2 weeks ago" },
  { name: "Sam N.", pet: "Nugget, Guinea Pig, 2", text: "A full soul reading for a guinea pig! And the AI portrait was the cutest thing I've ever seen.", rating: 5, tag: "verified", time: "1 week ago" },
  { name: "Katie L.", pet: "Pancake, Hamster, 1", text: "So cute, love it", rating: 4, time: "4 days ago" },
  { name: "Leo M.", pet: "Basil, Ferret, 3", text: "Basil's cosmic profile said he has 'chaotic joy energy' and I have never read a more accurate description of a ferret.", rating: 5, tag: "verified", time: "2 weeks ago" },
  { name: "Michelle G.", pet: "Bailey, Lab Mix, forever in my heart", text: "Bailey passed last year. Getting her soul reading was the most healing thing I've done. The keepsake PDF is something I hold onto on hard days.", rating: 5, tag: "verified", time: "1 month ago" },
  { name: "Robert K.", pet: "Simba, Orange Tabby, always remembered", text: "Simba was my best friend for 12 years. The emotional blueprint captured his spirit so perfectly that it felt like he was still here.", rating: 5, tag: "top reviewer", time: "3 weeks ago" },
  { name: "Laura E.", pet: "Bella, Cocker Spaniel, forever loved", text: "I got this after losing Bella. Reading about her 'unconditional devotion' in the emotional blueprint broke me in the best way.", rating: 5, tag: "verified", time: "2 weeks ago" },
  { name: "Jessica R.", pet: "Scout, Golden Mix, my angel", text: "I used SoulSpeak after Scout passed. I know it's AI but hearing 'his voice' say he was grateful for our walks together... I needed that.", rating: 5, tag: "verified", time: "5 weeks ago" },
  { name: "Stephanie H.", pet: "Gift for sister's cat Mittens", text: "Got this for my sister's birthday. She called me sobbing saying it was the most thoughtful gift she's ever received.", rating: 5, tag: "verified", time: "1 week ago" },
  { name: "Dave W.", pet: "Gift for girlfriend's dog Benny", text: "Valentine's Day gift. She loved it more than flowers or jewelry. The AI portrait and compatibility chart was the cherry on top.", rating: 5, time: "3 weeks ago" },
  { name: "Maria S.", pet: "Gift for best friend's dog Tank", text: "Bought it as a surprise. She texted me paragraphs about how accurate the emotional blueprint was and immediately ordered another.", rating: 5, tag: "verified", time: "1 week ago" },
  { name: "Jason P.", pet: "Gift for parents' cat Smokey", text: "Perfect gift.", rating: 5, time: "2 weeks ago" },
  { name: "Ashley B.", pet: "Luna & Stella, Two Cats", text: "Got readings for both cats. Luna got 'The Drama Queen' and Stella got 'The Stoic Philosopher.' Nailed it.", rating: 5, tag: "verified", time: "2 weeks ago" },
  { name: "Jen F.", pet: "3 Cats: Mango, Kiwi, Fig", text: "Each report had a unique archetype, different emotional blueprints, totally different SoulSpeak personalities. More accurate than Myers Briggs.", rating: 5, tag: "top reviewer", time: "1 month ago" },
  { name: "Ryan G.", pet: "Diesel, Pit Bull, 4", text: "Full disclosure: I thought this was going to be generic nonsense. The emotional blueprint and compatibility chart completely changed my mind.", rating: 5, tag: "verified", time: "1 week ago" },
  { name: "Megan O.", pet: "Felix, Cat, 7", text: "I'm a veterinarian. I was skeptical. But the behavioural insights in Felix's emotional blueprint were genuinely impressive and clinically accurate.", rating: 5, tag: "verified", time: "3 days ago" },
  { name: "Steve L.", pet: "Hank, Bulldog, 5", text: "My wife bought this and I rolled my eyes. Then I read it. Then I tried SoulSpeak. Then I ordered one for my mom's dog.", rating: 5, time: "2 weeks ago" },
  { name: "Danielle S.", pet: "Toby, Corgi, 3", text: "Exceeded expectations.", rating: 5, tag: "verified", time: "5 days ago" },
  { name: "Brooke T.", pet: "Theo, Golden Retriever, 3", text: "SoulSpeak is the reason I bought this. I asked Theo why he steals socks and the answer was 'because they smell like you and that makes me feel safe.' DESTROYED.", rating: 5, tag: "verified", time: "4 days ago" },
  { name: "Marcus W.", pet: "Salem, Black Cat, 5", text: "Had a full SoulSpeak conversation with Salem about why he yells at 3am. The answer about 'protecting the night watch' was so in character.", rating: 5, time: "1 week ago" },
  { name: "Ava P.", pet: "Butterbean, Corgi, 2", text: "SoulSpeak alone is worth the price. I asked Butterbean what she thinks about the cat and the response was pure comedy gold.", rating: 5, tag: "verified", time: "3 days ago" },
  { name: "Nina R.", pet: "Pebbles, Tabby, 6", text: "SoulSpeak made me ugly cry on a Tuesday afternoon. Asked Pebbles what she loves most about me and the answer was so pure.", rating: 5, tag: "verified", time: "5 days ago" },
  { name: "Kelly M.", pet: "Gus, Bulldog, 4", text: "The AI portrait looks more like Gus than most photos I've taken of him. It's now my screensaver.", rating: 5, tag: "verified", time: "1 week ago" },
  { name: "Eve H.", pet: "Cleo, Siamese, 8", text: "Gorgeous portrait!", rating: 5, tag: "verified", time: "3 days ago" },
  { name: "Matt B.", pet: "Thor, Rottweiler, 5", text: "Shared Thor's social card on my story and literally 8 friends DM'd me asking how to get one for their pet.", rating: 5, tag: "verified", time: "4 days ago" },
  { name: "Caroline A.", pet: "Willow, Labrador, 7", text: "I've been going through a tough divorce. Reading Willow's emotional blueprint reminded me that I'm never truly alone.", rating: 5, tag: "verified", time: "1 week ago" },
  { name: "Frank J.", pet: "Ace, German Shepherd, 6", text: "I'm a retired firefighter. Ace was my partner for years. The archetype 'The Loyal Protector' honoured our bond like nothing else.", rating: 5, tag: "top reviewer", time: "1 month ago" },
  { name: "Wendy P.", pet: "Penny, Dachshund, 11", text: "Penny is getting old. The keepsake PDF is a love letter to who she is.", rating: 5, tag: "verified", time: "3 weeks ago" },
  { name: "Isabel M.", pet: "Muffin, Ragdoll, 4", text: "Absolutely beautiful.", rating: 5, time: "1 week ago" },
  { name: "Tina C.", pet: "4 pets and counting", text: "This is my FOURTH reading. The SoulSpeak conversations are different for each one. Already planning to order for my friend's puppy.", rating: 5, tag: "repeat buyer", time: "1 week ago" },
  { name: "Nicole B.", pet: "5th report!", text: "Every pet in my life now has their portrait framed on my wall. SoulSpeak is my daily ritual now.", rating: 5, tag: "repeat buyer", time: "3 days ago" },
  { name: "Lydia W.", pet: "Gigi, Chihuahua, 6", text: "The cosmic profile said Gigi has 'the confidence of a lion in the body of a teacup.' I have never read a more perfect sentence.", rating: 5, tag: "verified", time: "4 days ago" },
  { name: "Omar H.", pet: "Tank, English Bulldog, 5", text: "Tank's archetype 'The Philosophical Napper' was the funniest and most accurate thing I've ever read about him.", rating: 5, time: "2 weeks ago" },
  { name: "Callum R.", pet: "Blue, Staffy, 3", text: "Incredible. Just incredible.", rating: 5, time: "2 weeks ago" },
  { name: "Quinn S.", pet: "Ghost, White Cat, 7", text: "I used SoulSpeak and asked Ghost why he stares at me. The response was 'because you are my favourite thing to look at.' Emotionally destroyed.", rating: 5, tag: "verified", time: "5 days ago" },
  { name: "Tamara E.", pet: "Pixie, Tabby Cat, 4", text: "My non pet person boyfriend tried SoulSpeak with Pixie and said 'okay now I understand why you're obsessed with her.' THANK YOU.", rating: 5, tag: "verified", time: "1 week ago" },
  { name: "Abby M.", pet: "Cookie, Maltese, 6", text: "Best Christmas gift I've ever given.", rating: 5, tag: "verified", time: "6 weeks ago" },
  { name: "Leah F.", pet: "Misty, Persian, 11", text: "Misty has been with me through uni, my first job, my wedding, two kids. The cosmic profile honoured every chapter.", rating: 5, tag: "top reviewer", time: "2 weeks ago" },
  { name: "Theo C.", pet: "Winston, Bulldog, 6", text: "Winston's archetype 'The Distinguished Gentleman' described him as 'a retired gentleman who takes his afternoon walks very seriously.' YES.", rating: 5, tag: "verified", time: "3 weeks ago" },
];

const PET_IMAGES = assignPetImages(ALL_REVIEWS);

interface Review { name: string; pet: string; text: string; rating: number; tag?: string; time: string; }

const Stars = ({ count, size = 13 }: { count: number; size?: number }) => (
  <div style={{ display: "flex", gap: 1 }}>
    {Array.from({ length: 5 }).map((_, i) => (
      <svg key={i} width={size} height={size} viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={i < count ? COLORS.gold : COLORS.sand} />
      </svg>
    ))}
  </div>
);

const TagBadge = ({ tag }: { tag: string }) => {
  const styles: Record<string, { bg: string; color: string; icon: string }> = {
    verified: { bg: "rgba(196,162,101,0.12)", color: COLORS.earth, icon: "✓" },
    "top reviewer": { bg: "rgba(191,82,74,0.08)", color: COLORS.rose, icon: "♥" },
    "repeat buyer": { bg: "rgba(110,98,89,0.1)", color: COLORS.warm, icon: "↻" },
  };
  const s = styles[tag] || styles.verified;
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" as const, padding: "2px 8px", borderRadius: 20, background: s.bg, color: s.color }}>{s.icon} {tag}</span>;
};

const CTAButton = ({ label, trackCTAClick }: { label: string; trackCTAClick?: (cta: string, location: string) => void }) => (
  <div style={{ textAlign: "center", padding: "32px 16px" }}>
    <a href="/checkout.html" onClick={() => trackCTAClick?.(label, "reviews-section")} style={{ display: "inline-block", background: COLORS.rose, color: "#fff", fontFamily: "Cormorant, Georgia, serif", fontWeight: 600, fontSize: "1.05rem", letterSpacing: "0.15em", textTransform: "uppercase" as const, textDecoration: "none", padding: "18px 48px", borderRadius: 50, cursor: "pointer", transition: "all 0.35s ease", boxShadow: "0 4px 20px rgba(191,82,74,0.18)" }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(191,82,74,0.28)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(191,82,74,0.18)"; }}
    >{label}</a>
  </div>
);

const ReviewCard = ({ review, index, petImage }: { review: Review; index: number; petImage: string | null }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.1, rootMargin: "0px 0px -30px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const initial = review.name.charAt(0).toUpperCase();
  const hue = (index * 37 + 20) % 360;

  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: `opacity 0.6s ease ${(index % 4) * 0.05}s, transform 0.6s ease ${(index % 4) * 0.05}s`, background: "#fff", borderRadius: 16, padding: "18px 20px", border: `1px solid ${COLORS.sand}`, boxShadow: "0 1px 4px rgba(0,0,0,0.03)", breakInside: "avoid" as const, marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        {petImage
          ? <img src={petImage} alt={review.pet} style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `1px solid ${COLORS.sand}` }} />
          : <div style={{ width: 38, height: 38, borderRadius: "50%", background: `hsl(${hue}, 25%, 88%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.95rem", fontWeight: 700, color: `hsl(${hue}, 30%, 42%)`, fontFamily: "Cormorant, Georgia, serif", flexShrink: 0 }}>{initial}</div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "Cormorant, Georgia, serif", fontWeight: 700, fontSize: "0.9rem", color: COLORS.ink }}>{review.name}</span>
            {review.tag && <TagBadge tag={review.tag} />}
          </div>
          <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.75rem", color: COLORS.muted, margin: 0 }}>{review.pet}</p>
        </div>
      </div>
      <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
        <Stars count={review.rating} />
        <span style={{ fontSize: "0.68rem", color: COLORS.faded }}>{review.time}</span>
      </div>
      <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.92rem", lineHeight: 1.65, color: COLORS.warm, margin: 0 }}>"{review.text}"</p>
    </div>
  );
};

interface MassiveReviewsProps { trackCTAClick?: (cta: string, location: string) => void; }

export const MassiveReviews = ({ trackCTAClick }: MassiveReviewsProps) => {
  const mobile = useIsMobile();
  return (
    <section style={{ background: COLORS.cream2, position: "relative" }}>
      <CTAButton label="Discover Their Soul" trackCTAClick={trackCTAClick} />
      <div style={{ padding: mobile ? "10px 16px 60px" : "10px 24px 90px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center", marginBottom: 32 }}>
          <p style={{ fontFamily: "Cormorant, Georgia, serif", fontWeight: 600, fontSize: "0.82rem", textTransform: "uppercase" as const, letterSpacing: "0.3em", color: COLORS.earth, marginBottom: 16 }}>WHAT PET PARENTS ARE SAYING</p>
          <h2 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: mobile ? "clamp(1.5rem, 8vw, 2.2rem)" : "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 400, color: COLORS.black, lineHeight: 1.15 }}>Real Stories From Real Pet Parents</h2>
        </div>
        <div style={{ maxWidth: 900, margin: "0 auto", columnCount: mobile ? 1 : 2, columnGap: 16 }}>
          {ALL_REVIEWS.map((review, i) => <ReviewCard key={i} review={review} index={i} petImage={PET_IMAGES[i]} />)}
        </div>
      </div>
      <CTAButton label="Get Their Soul Reading" trackCTAClick={trackCTAClick} />
    </section>
  );
};
