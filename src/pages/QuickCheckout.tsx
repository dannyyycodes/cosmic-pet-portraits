import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Check,
  Shield,
  Zap,
  ArrowRight,
  Heart,
  Sparkles,
  Palette,
  Sun,
  Gift,
  Cake,
  Minus,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PremiumTestimonials } from "@/components/PremiumTestimonials";

// ─── Ticker Messages ───
const tickerMessages = [
  { name: "Sarah", country: "the UK", pet: "Bruno", emoji: "🐕" },
  { name: "Emma", country: "Australia", pet: "Milo, Daisy & Pepper", emoji: "🐶🐱🐰" },
  { name: "Priya", country: "Canada", pet: "Coco", emoji: "🐦" },
  { name: "James", country: "the UK", pet: "Biscuit", emoji: "🐇" },
  { name: "Maria", country: "the US", pet: "Zeus", emoji: "🐕" },
  { name: "Aiko", country: "Japan", pet: "Mochi", emoji: "🐱" },
  { name: "Lars", country: "Sweden", pet: "Odin", emoji: "🐕" },
  { name: "Sophie", country: "France", pet: "Chloé", emoji: "🐩" },
  { name: "Chen", country: "Singapore", pet: "Bubbles", emoji: "🐠" },
  { name: "Fatima", country: "the UAE", pet: "Simba", emoji: "🐈" },
];

const actions = [
  "just got a reading for",
  "ordered 3 readings for",
  "just discovered",
  "got",
  "just gifted a reading for",
  "got a reading for",
  "ordered for",
  "just got",
  "ordered for",
  "got",
];

const suffixes = [
  "",
  "",
  "'s love language",
  "'s soul reading",
  "",
  "",
  "",
  "'s cosmic blueprint",
  "",
  "'s personality reading",
];

// ─── Occasion Modes ───
type OccasionMode = "discover" | "birthday" | "gift" | "memorial";

const occasionDescriptions: Record<OccasionMode, string> = {
  discover: "Explore their personality, quirks, love language and cosmic soul profile.",
  birthday: "A celebratory reading with year-ahead predictions and birthday milestones.",
  gift: "A beautifully wrapped reading experience — perfect for any pet parent.",
  memorial: "A gentle, honouring tribute to a pet who has passed on.",
};

// ─── FAQ Data ───
const faqItems = [
  {
    q: "How does it work?",
    a: "After checkout, you'll answer a few simple questions about your pet — their name, birthday, breed, and a little about their personality. We use this to craft a deeply personalised soul and astrology reading, delivered as a beautiful PDF within minutes.",
  },
  {
    q: "What if I don't know their exact birthday?",
    a: "That's completely fine! An approximate date or even the month and year works perfectly. Many rescue parents don't know exact dates — your reading will still be beautifully accurate.",
  },
  {
    q: "Is this just for dogs and cats?",
    a: "Not at all! We've done readings for rabbits, horses, birds, hamsters, and even a tortoise named Gerald. If you love them, we can read them.",
  },
  {
    q: "What if I'm not happy with it?",
    a: "We offer a full money-back guarantee. If your reading doesn't make you smile, just let us know and we'll refund you — and use your feedback to make future readings even better.",
  },
  {
    q: "Can I gift this to someone?",
    a: "Absolutely — it's one of our most popular gifts. Many pet parents order multiple readings as birthday, Christmas, or just-because presents. You can fill in the details for their pet at checkout.",
  },
  {
    q: "What's the Printed Keepsake Book?",
    a: "It's a gorgeous hardcover book containing the entire soul reading — full colour, 40+ pages, on premium 200gsm paper with gold foil accents. Your pet's photo on the cover. Ships worldwide in 5–7 days.",
  },
];

// ─── Chapter Data ───
const chapters = [
  { num: 1, name: "The Arrival", detail: "cosmic nickname, first meeting, name meaning" },
  { num: 2, name: "The Soul Revealed", detail: "planet-by-planet personality deep dive" },
  { num: 3, name: "The Lighter Side", detail: "the fun side: quirks decoded, personality profile, dream job" },
  { num: 4, name: "The Deep Dive", detail: "pet monologue, elemental nature, archetype" },
  { num: 5, name: "The Bond", detail: "your soul connection & compatibility" },
];

// ─── Volume Discount ───
function getVolumeDiscount(petCount: number): number {
  if (petCount >= 5) return 0.50;
  if (petCount >= 4) return 0.40;
  if (petCount >= 3) return 0.30;
  if (petCount >= 2) return 0.20;
  return 0;
}

function getDiscountLabel(petCount: number): string {
  const pct = Math.round(getVolumeDiscount(petCount) * 100);
  return `🎉 ${pct}% off!`;
}

export default function QuickCheckout() {
  const [includePortrait, setIncludePortrait] = useState(false);
  const [includeBook, setIncludeBook] = useState(false);
  const [petCount, setPetCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<OccasionMode>("discover");
  const [tickerIndex, setTickerIndex] = useState(0);
  const [tickerVisible, setTickerVisible] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const mainCtaRef = useRef<HTMLButtonElement>(null);

  const basePriceCents = 2700;
  const portraitPriceCents = 800;
  const bookPriceCents = 8900;

  // Calculate totals
  const readingSubtotal = basePriceCents * petCount;
  const portraitSubtotal = includePortrait ? portraitPriceCents * petCount : 0;
  const discountableSubtotal = readingSubtotal + portraitSubtotal;
  const discountRate = getVolumeDiscount(petCount);
  const discountAmount = Math.round(discountableSubtotal * discountRate);
  const bookTotal = includeBook ? bookPriceCents : 0;
  const totalCents = discountableSubtotal - discountAmount + bookTotal;
  const totalDisplay = (totalCents / 100).toFixed(0);

  // Ticker rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerVisible(false);
      setTimeout(() => {
        setTickerIndex((prev) => (prev + 1) % tickerMessages.length);
        setTickerVisible(true);
      }, 300);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Sticky mobile CTA observer
  useEffect(() => {
    if (!mainCtaRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (window.innerWidth <= 640) {
          setShowStickyCta(!entry.isIntersecting);
        }
      },
      { threshold: 0 },
    );
    observer.observe(mainCtaRef.current);
    return () => observer.disconnect();
  }, []);

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          quickCheckout: true,
          selectedTier: includePortrait ? "premium" : "basic",
          abVariant: "C",
          includesPortrait: includePortrait,
          includesBook: includeBook,
          occasionMode: selectedMode,
          petCount,
        },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("No checkout URL returned");
      window.location.href = data.url;
    } catch (err: any) {
      console.error("[QuickCheckout] Error:", err);
      toast.error("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const currentTicker = tickerMessages[tickerIndex];
  const currentAction = actions[tickerIndex];
  const currentSuffix = suffixes[tickerIndex];

  const features = [
    "Full soul profile, love language & emotional blueprint",
    "Cosmic zodiac chart with 10 planetary positions",
    "Their unique quirks & behaviours — finally explained",
    "Breed-specific insights & lucky elements",
    "Shareable cosmic card & beautiful PDF keepsake",
  ];

  return (
    <main className="variant-c min-h-screen bg-background">
      {/* ═══ FIXED TICKER BAR ═══ */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div
          className="max-w-xl mx-auto text-center py-2.5 px-5 font-cormorant text-[0.82rem] text-muted-foreground transition-opacity duration-500"
          style={{ opacity: tickerVisible ? 1 : 0 }}
        >
          <strong className="text-foreground">{currentTicker.name}</strong>
          &nbsp;from {currentTicker.country} {currentAction}&nbsp;
          <strong className="text-foreground">{currentTicker.pet}</strong>
          {currentSuffix}&nbsp;
          <span>{currentTicker.emoji}</span>
        </div>
      </div>

      {/* Spacer for fixed ticker */}
      <div className="h-10" />

      {/* ═══ HERO ═══ */}
      <section className="min-h-[40vh] flex flex-col items-center justify-center px-7 py-14 sm:py-16 text-center relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/15 text-primary text-xs font-semibold tracking-wide mb-7"
        >
          <Heart className="w-3.5 h-3.5 fill-primary" />
          Loved by 12,000+ pet parents
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="font-dm-serif text-[clamp(2rem,7vw,3.4rem)] font-normal leading-[1.08] tracking-tight text-foreground mb-4"
        >
          Discover the Soul
          <br />
          Behind <em className="italic">Those Eyes</em>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="font-cormorant italic text-[clamp(1.05rem,3.5vw,1.25rem)] text-muted-foreground leading-relaxed max-w-[420px]"
        >
          A beautifully crafted keepsake that captures
          <br />
          everything you love about them.
        </motion.p>
      </section>

      {/* ═══ CHECKOUT AREA ═══ */}
      <div className="max-w-[520px] mx-auto px-5 pb-14">
        {/* ── Product Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl border border-border shadow-sm p-6 sm:p-7 mb-4"
        >
          {/* Multi-Pet Selector */}
          <div className="mb-5 pb-5 border-b border-border">
            <p className="font-cormorant text-[0.9rem] text-muted-foreground mb-2.5">
              How many fur babies?
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPetCount(Math.max(1, petCount - 1))}
                className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-foreground/30 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-dm-serif text-xl text-foreground w-8 text-center">{petCount}</span>
              <button
                onClick={() => setPetCount(Math.min(10, petCount + 1))}
                className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-foreground/30 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
              {petCount >= 2 && (
                <span className="ml-2 text-[0.75rem] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                  {getDiscountLabel(petCount)}
                </span>
              )}
            </div>
          </div>

          {/* Occasion Selector */}
          <div className="mb-5 pb-5 border-b border-border">
            <p className="font-cormorant font-semibold text-[0.85rem] text-muted-foreground mb-1">
              What's the occasion?
            </p>
            <p className="text-[0.78rem] text-muted-foreground/70 mb-3">
              Each mode tailors the entire report's tone, language and content
            </p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { mode: "discover" as OccasionMode, label: "Discover", Icon: Sun },
                  { mode: "birthday" as OccasionMode, label: "Birthday", Icon: Cake },
                  { mode: "gift" as OccasionMode, label: "Gift", Icon: Gift },
                  { mode: "memorial" as OccasionMode, label: "In Memory", Icon: Heart },
                ] as const
              ).map(({ mode, label, Icon }) => (
                <button
                  key={mode}
                  onClick={() => setSelectedMode(mode)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border-[1.5px] font-cormorant font-semibold text-[0.85rem] transition-all ${
                    selectedMode === mode
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted/30"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${selectedMode === mode ? "text-primary" : "text-muted-foreground"}`} />
                  {label}
                </button>
              ))}
            </div>
            {selectedMode && (
              <div className="mt-2.5 px-3.5 py-2.5 bg-muted/50 rounded-lg text-[0.78rem] text-muted-foreground italic">
                {occasionDescriptions[selectedMode]}
              </div>
            )}
          </div>

          {/* Product Header */}
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-dm-serif text-lg text-foreground">Cosmic Soul Reading</h3>
                <p className="font-cormorant italic text-[0.85rem] text-muted-foreground">
                  5 chapters · 30+ personalised sections
                </p>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-cormorant font-semibold text-base text-muted-foreground line-through">$49</span>
              <span className="font-dm-serif text-2xl text-foreground">$27</span>
              <span className="text-[0.65rem] font-bold text-white bg-primary px-2 py-0.5 rounded-full">45% OFF</span>
            </div>
          </div>

          {/* Features */}
          <ul className="space-y-2 mb-5">
            {features.map((f, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-[0.95rem] font-cormorant font-medium text-muted-foreground"
              >
                <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>

          {/* Chapter Peek */}
          <div className="pt-4 border-t border-border mb-5">
            <p className="font-cormorant font-semibold text-[0.78rem] text-muted-foreground/70 uppercase tracking-[0.15em] mb-3">
              Your 5-chapter journey
            </p>
            {chapters.map((ch) => (
              <div
                key={ch.num}
                className="flex items-center gap-2.5 py-1.5 text-[0.88rem] font-cormorant text-muted-foreground"
              >
                <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[0.7rem] font-bold text-muted-foreground shrink-0">
                  {ch.num}
                </span>
                <span className="font-semibold">{ch.name}</span>
                <span className="text-muted-foreground/60 text-[0.78rem]">— {ch.detail}</span>
              </div>
            ))}
          </div>

          {/* ── Portrait Upsell (inside product card) ── */}
          <div
            onClick={() => setIncludePortrait(!includePortrait)}
            className={`rounded-xl border p-4 flex items-center justify-between cursor-pointer transition-all ${
              includePortrait
                ? "border-accent shadow-[0_0_0_2px_hsl(var(--accent)/0.15)]"
                : "border-border hover:border-muted-foreground/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                <Palette className={`w-4 h-4 ${includePortrait ? "text-accent" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="font-cormorant font-semibold text-[0.92rem] text-foreground">✨ Cosmic Portrait Edition</p>
                <p className="text-[0.78rem] text-muted-foreground">
                  Your favourite photo set in a cosmic scene matched to their aura colours. Featured on the report, shareable card, and printed book cover.
                </p>
                {includePortrait && (
                  <p className="text-[0.75rem] text-muted-foreground italic mt-1">You'll upload the photo after payment</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="font-cormorant font-bold text-[0.92rem] text-muted-foreground">+$8</span>
              <Switch checked={includePortrait} onCheckedChange={setIncludePortrait} />
            </div>
          </div>
        </motion.div>

        {/* ── Printed Keepsake Book Upsell ── */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          onClick={() => setIncludeBook(!includeBook)}
          className={`bg-card rounded-2xl border-[1.5px] p-5 sm:p-6 mb-4 cursor-pointer transition-all ${
            includeBook
              ? "border-primary/60 shadow-[0_0_0_2px_hsl(var(--primary)/0.12)]"
              : "border-accent/30 hover:border-accent/50"
          }`}
        >
          <div className="flex gap-4 mb-4">
            {/* Book mockup */}
            <div className="w-[80px] shrink-0 flex items-start justify-center">
              <div className="w-[60px] h-[80px] rounded-sm bg-background border border-accent/40 shadow-md flex flex-col items-center justify-center relative">
                <div className="absolute inset-1 border border-accent/20 rounded-[1px]" />
                <span className="text-lg mb-1">🐾</span>
                <span className="font-dm-serif text-[0.45rem] text-foreground tracking-tight uppercase">Your Pet</span>
              </div>
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              <span className="inline-block text-[0.6rem] font-semibold text-accent uppercase tracking-[0.12em] bg-accent/10 px-2 py-0.5 rounded mb-2">
                ✨ THE KEEPSAKE
              </span>
              <h4 className="font-dm-serif text-[1.1rem] text-foreground mb-1.5">Printed Hardcover Edition</h4>
              <p className="font-cormorant text-[0.88rem] text-muted-foreground leading-relaxed mb-3">
                The entire soul reading as a beautiful hardbound book. Full colour on premium 200gsm paper. Their photo on the cover. Ships worldwide in 5–7 days.
              </p>
              <div className="space-y-1">
                {[
                  "40+ pages, full colour, hardcover",
                  "Their photo on the cover (or species art)",
                  "Gold foil accents",
                  "Free worldwide shipping",
                ].map((feat) => (
                  <p key={feat} className="text-[0.8rem] text-muted-foreground font-cormorant">
                    <span className="text-green-600 mr-1.5">✓</span>
                    {feat}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing row */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[0.78rem] text-muted-foreground font-cormorant">Bundle price</span>
            <div className="flex items-center gap-2">
              <span className="text-[0.85rem] text-muted-foreground line-through">$99</span>
              <span className="font-dm-serif text-[1.3rem] text-foreground">$89</span>
              <span className="text-[0.6rem] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">SAVE $10</span>
            </div>
          </div>

          {/* Add button */}
          <button
            className={`w-full py-2.5 rounded-xl font-cormorant font-semibold text-[0.92rem] transition-all ${
              includeBook
                ? "bg-primary/10 text-primary border border-primary/30"
                : "bg-muted text-foreground border border-border hover:bg-muted/80"
            }`}
          >
            {includeBook ? "✓ Added — $89" : "Add to order — $89"}
          </button>

          <p className="font-caveat italic text-[0.85rem] text-primary text-center mt-2.5">
            Perfect for gifts, memorials, and keeping their story forever.
          </p>
        </motion.div>

        {/* ── Order Summary ── */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42 }}
          className="bg-card rounded-xl border border-border p-4 mb-4"
        >
          <p className="font-cormorant font-semibold text-[0.82rem] text-muted-foreground/70 uppercase tracking-[0.12em] mb-3">
            Order summary
          </p>
          <div className="space-y-2 text-[0.88rem] font-cormorant">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {petCount > 1 ? `${petCount}× ` : ""}Cosmic Soul Reading
              </span>
              <span className="text-foreground font-semibold">${(readingSubtotal / 100).toFixed(2)}</span>
            </div>
            {includePortrait && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {petCount > 1 ? `${petCount}× ` : ""}Cosmic Portrait Edition
                </span>
                <span className="text-foreground font-semibold">${(portraitSubtotal / 100).toFixed(2)}</span>
              </div>
            )}
            {includeBook && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Printed Keepsake Book</span>
                <span className="text-foreground font-semibold">$89.00</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Multi-pet discount ({Math.round(discountRate * 100)}%)</span>
                <span className="font-semibold">-${(discountAmount / 100).toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="text-foreground font-semibold">Total</span>
              <span className="font-dm-serif text-lg text-foreground">${(totalCents / 100).toFixed(2)}</span>
            </div>
          </div>
        </motion.div>

        {/* ── Primary CTA ── */}
        <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Button
            ref={mainCtaRef}
            size="lg"
            className="w-full py-7 text-lg font-cormorant font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-[0_4px_20px_hsl(var(--primary)/0.2)] hover:shadow-[0_8px_30px_hsl(var(--primary)/0.3)] hover:-translate-y-0.5 transition-all group"
            onClick={handleCheckout}
            disabled={isLoading}
          >
            {isLoading ? (
              "Redirecting to checkout..."
            ) : (
              <>
                Discover Who They Really Are — ${totalDisplay}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
          <p className="text-center text-[0.82rem] text-muted-foreground italic mt-2.5 font-cormorant">
            You'll tell us about your pet after checkout — takes 60 seconds
          </p>
        </motion.div>

        {/* ── Trustpilot ── */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-5 h-5 bg-[#00B67A] flex items-center justify-center rounded-sm">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
            ))}
          </div>
          <span className="text-[0.82rem] text-muted-foreground font-cormorant">
            <strong className="text-foreground">Excellent</strong> on Trustpilot
          </span>
        </div>

        {/* ── Trust Strip ── */}
        <div className="flex flex-wrap items-center justify-center gap-5 mt-4 mb-8 text-[0.8rem] font-cormorant font-medium text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Secure checkout
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            Instant delivery
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            100% money-back guarantee
          </span>
        </div>

        {/* ── Guarantee Box ── */}
        <div className="bg-green-50 border border-green-200/50 rounded-xl p-5 flex items-start gap-3.5 mb-8">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h4 className="font-dm-serif text-base text-foreground mb-1">Love It or It's Free</h4>
            <p className="text-[0.85rem] font-cormorant text-muted-foreground leading-relaxed">
              If your reading doesn't make you smile, we'll give you a full refund — and we'll ask what we could do
              better so we can make every reading even more special. No hoops, no hassle.
            </p>
          </div>
        </div>
      </div>

      {/* ═══ TESTIMONIALS ═══ */}
      <PremiumTestimonials />

      {/* ═══ FAQ ═══ */}
      <div className="max-w-[520px] mx-auto px-5 pb-10">
        <h3 className="font-dm-serif text-xl text-foreground text-center mb-6">Common Questions</h3>
        {faqItems.map((item, i) => (
          <div key={i} className="border-b border-border">
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full flex items-center justify-between py-4 text-left font-cormorant font-semibold text-[1rem] text-foreground"
            >
              {item.q}
              <span className="text-muted-foreground text-lg shrink-0 ml-4">{openFaq === i ? "−" : "+"}</span>
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ${openFaq === i ? "max-h-48 pb-4" : "max-h-0"}`}
            >
              <p className="text-[0.88rem] font-cormorant text-muted-foreground leading-relaxed">{item.a}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ SECOND CTA ═══ */}
      <div className="max-w-[520px] mx-auto px-5 pb-5 text-center">
        <Button
          size="lg"
          className="w-full py-7 text-lg font-cormorant font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-[0_4px_20px_hsl(var(--primary)/0.2)] hover:shadow-[0_8px_30px_hsl(var(--primary)/0.3)] hover:-translate-y-0.5 transition-all group"
          onClick={handleCheckout}
          disabled={isLoading}
        >
          {isLoading ? (
            "Redirecting to checkout..."
          ) : (
            <>
              Discover Who They Really Are — ${totalDisplay}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>
        <p className="font-cormorant italic text-[0.92rem] text-muted-foreground mt-3">
          Join 12,000+ pet parents who've taken the leap
        </p>
      </div>

      {/* ── Back Link ── */}
      <div className="text-center pb-12">
        <Link to="/" className="text-sm font-cormorant text-muted-foreground hover:text-foreground transition-colors">
          ← Back to home
        </Link>
      </div>

      {/* ═══ STICKY MOBILE CTA ═══ */}
      {showStickyCta && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/50 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] p-3 sm:hidden">
          <Button
            size="lg"
            className="w-full py-4 text-base font-cormorant font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all"
            onClick={handleCheckout}
            disabled={isLoading}
          >
            {isLoading ? "Redirecting..." : `Discover Them — $${totalDisplay}`}
          </Button>
        </div>
      )}
    </main>
  );
}
