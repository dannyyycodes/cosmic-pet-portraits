import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PostPurchaseIntakeProps {
  reportId: string;
  onComplete: () => void;
}

function getPronouns(gender: string) {
  switch (gender) {
    case 'male': return { subject: 'he', Subject: 'He', possessive: 'his', object: 'him' };
    case 'female': return { subject: 'she', Subject: 'She', possessive: 'her', object: 'her' };
    default: return { subject: 'they', Subject: 'They', possessive: 'their', object: 'them' };
  }
}

const SPECIES_OPTIONS = [
  { value: "dog", emoji: "🐕", label: "Dog" },
  { value: "cat", emoji: "🐈", label: "Cat" },
  { value: "rabbit", emoji: "🐇", label: "Rabbit" },
  { value: "bird", emoji: "🐦", label: "Bird" },
  { value: "small_pet", emoji: "🐹", label: "Small pet" },
  { value: "other", emoji: "✨", label: "Other" },
];

const GENDER_OPTIONS = [
  { value: "male", label: "Boy" },
  { value: "female", label: "Girl" },
  { value: "unknown", label: "Not sure" },
];

const SOUL_TYPES = [
  { emoji: "🌿", label: "The Gentle Healer", desc: "Calm presence, soothing energy" },
  { emoji: "🔥", label: "The Wild Spirit", desc: "Untameable, fiercely free" },
  { emoji: "🧘", label: "The Calm Observer", desc: "Watches, waits, understands" },
  { emoji: "🦋", label: "The Social Butterfly", desc: "Loves everyone they meet" },
  { emoji: "🛡️", label: "The Loyal Guardian", desc: "Protective, devoted, steadfast" },
  { emoji: "😈", label: "The Mischief Maker", desc: "Chaos is their love language" },
  { emoji: "🧸", label: "The Comfort Giver", desc: "Always there when you need them" },
  { emoji: "👑", label: "The Diva", desc: "Dramatic, glamorous, unforgettable" },
];

const SUPERPOWERS = [
  { emoji: "💗", label: "Emotional Intelligence", desc: "Reads the room perfectly" },
  { emoji: "⚡", label: "Pure Chaos Energy", desc: "Zoomies on demand" },
  { emoji: "🧘", label: "Infinite Patience", desc: "Will wait forever, calmly" },
  { emoji: "🧠", label: "Mind Reading", desc: "Knows what you're thinking" },
  { emoji: "🍖", label: "Treat Detection", desc: "Hears a wrapper from 3 rooms away" },
  { emoji: "🙉", label: "Selective Hearing", desc: "Only hears what they want" },
  { emoji: "😴", label: "Champion Napper", desc: "Sleeps like a pro, anywhere" },
  { emoji: "💨", label: "Zoomie Master", desc: "0 to 60 in 0.5 seconds" },
];

const STRANGER_REACTIONS = [
  { emoji: "🤗", label: "Instant Best Friend", desc: "Loves everyone immediately" },
  { emoji: "🤔", label: "Cautious Then Obsessed", desc: "Slow warm-up, then clingy" },
  { emoji: "🕵️", label: "Suspicious Until Trust Earned", desc: "Needs time to open up" },
  { emoji: "😎", label: "Couldn't Care Less", desc: "Completely unbothered" },
  { emoji: "🙈", label: "Hides Then Investigates", desc: "Shy first, curious later" },
  { emoji: "🎭", label: "Shows Off Immediately", desc: "Look at me! Watch this!" },
];

const screenVariants = {
  enter: { opacity: 0, y: 20 },
  center: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.33, 1, 0.68, 1] as const } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.25, ease: [0.55, 0, 1, 0.45] as const } },
};

const grainStyle: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
};

export function PostPurchaseIntake({ reportId, onComplete }: PostPurchaseIntakeProps) {
  const [screen, setScreen] = useState(0);
  const [petName, setPetName] = useState("");
  const [species, setSpecies] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [breed, setBreed] = useState("");
  const [location, setLocation] = useState("");
  const [locationResults, setLocationResults] = useState<Array<{ display_name: string; address?: { city?: string; town?: string; village?: string; country?: string; state?: string }; name?: string }>>([]);
  const [showLocationResults, setShowLocationResults] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const locationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [soulTypes, setSoulTypes] = useState<string[]>([]);
  const [superpowers, setSuperpowers] = useState<string[]>([]);
  const [strangerReaction, setStrangerReaction] = useState("");
  const [petPhotoUrl, setPetPhotoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pronouns = getPronouns(gender);

  // Location autocomplete (Nominatim)
  useEffect(() => {
    if (locationTimeout.current) clearTimeout(locationTimeout.current);
    const query = location.trim();
    if (query.length < 2) { setLocationResults([]); setShowLocationResults(false); return; }
    setIsSearchingLocation(true);
    locationTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`, { headers: { 'Accept-Language': 'en' } });
        const data = await res.json();
        setLocationResults(data);
        setShowLocationResults(true);
      } catch { setLocationResults([]); }
      finally { setIsSearchingLocation(false); }
    }, 300);
    return () => { if (locationTimeout.current) clearTimeout(locationTimeout.current); };
  }, [location]);

  const selectLocation = (result: typeof locationResults[0]) => {
    const city = result.address?.city || result.address?.town || result.address?.village || result.name || '';
    const country = result.address?.country || '';
    const state = result.address?.state;
    let formatted: string;
    if (country === 'United States' && state && city) formatted = `${city}, ${state}, USA`;
    else if (city && country) formatted = `${city}, ${country}`;
    else formatted = result.display_name.split(',').slice(0, 3).join(',').trim();
    setLocation(formatted);
    setShowLocationResults(false);
  };

  const toggleMultiSelect = (current: string[], setter: (v: string[]) => void, value: string, max: number) => {
    if (current.includes(value)) setter(current.filter(v => v !== value));
    else if (current.length < max) setter([...current, value]);
  };

  // Screen 1 readiness
  const showSpecies = petName.length >= 1;
  const showGender = showSpecies && !!species;
  const screen1Ready = !!petName.trim() && !!species && !!gender;

  const handlePhotoUpload = async (file: File) => {
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      toast.error("Please upload a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB.");
      return;
    }
    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const filename = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('pet-photos').upload(filename, file, { cacheControl: '3600', upsert: false });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('pet-photos').getPublicUrl(filename);
      setPetPhotoUrl(urlData.publicUrl);
      toast.success("Photo uploaded!");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("update-pet-data", {
        body: {
          reportId, petName, species, gender: gender || undefined,
          birthDate: birthDate || undefined, birthTime: birthTime || undefined,
          breed: breed || undefined, location: location || undefined,
          soulType: soulTypes.join(', ') || undefined, superpower: superpowers.join(', ') || undefined,
          strangerReaction: strangerReaction || undefined, petPhotoUrl: petPhotoUrl || undefined,
        },
      });
      if (error) throw error;

      // Show loading screen immediately — don't wait for background generation
      onComplete();

      // Fire and forget — report generates in the background
      supabase.functions.invoke("generate-report-background", {
        body: { reportId },
      }).catch(err => console.warn("[PostPurchaseIntake] Generation trigger:", err));
    } catch (err) {
      console.error("[PostPurchaseIntake] Error:", err);
      toast.error("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full border-[1.5px] border-[#E8DFD6] rounded-xl px-5 py-[0.9rem] text-[1.1rem] text-[#2D2926] bg-white placeholder:text-[#9B8E84] focus:outline-none focus:border-[#bf524a] transition-colors font-[Cormorant,serif]";
  const hintClass = "text-[0.78rem] text-[#9B8E84] font-[Cormorant,serif] mt-1";
  const labelClass = "text-[0.7rem] text-[#9B8E84] uppercase tracking-widest font-[Cormorant,serif] font-semibold mb-1 block";
  const roseBtn = "w-full py-[0.9rem] rounded-xl text-white font-[Cormorant,serif] font-semibold text-[1rem] transition-all";

  const ProgressDots = () => (
    <div className="flex items-center gap-2 justify-center mb-8">
      {[0, 1, 2, 3, 4].map(i => (
        <motion.div
          key={i}
          animate={i === screen ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.3 }}
          className={cn(
            "w-2 h-2 rounded-full transition-colors",
            i === screen ? "bg-[#bf524a]" : "border border-[#E8DFD6] bg-transparent"
          )}
        />
      ))}
    </div>
  );

  const summaryRows = [
    { label: "Name", value: petName },
    { label: "Species", value: species ? SPECIES_OPTIONS.find(s => s.value === species)?.label : "" },
    { label: "Gender", value: gender ? GENDER_OPTIONS.find(g => g.value === gender)?.label : "" },
    { label: "Birthday", value: birthDate || "" },
    { label: "Time", value: birthTime || "" },
    { label: "Breed", value: breed },
    { label: "Location", value: location },
    { label: "Soul type", value: soulTypes.join(', ') },
    { label: "Superpower", value: superpowers.join(', ') },
    { label: "Stranger reaction", value: strangerReaction },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ backgroundColor: '#FFFDF5', ...grainStyle }}>
      <div className="w-full max-w-[480px]">
        <ProgressDots />
        <AnimatePresence mode="wait">
          {/* SCREEN 1 */}
          {screen === 0 && (
            <motion.div key="s1" variants={screenVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
              <h1 className="text-center text-[1.5rem] text-[#2D2926]" style={{ fontFamily: 'DM Serif Display, serif' }}>Let's meet them</h1>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <input
                  value={petName} onChange={e => setPetName(e.target.value)}
                  placeholder="What's their name?" className={cn(inputClass, "text-center")}
                  autoFocus style={{ fontSize: '1.1rem' }}
                  aria-label="Pet name"
                />
              </motion.div>

              {showSpecies && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.2 }}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SPECIES_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => setSpecies(opt.value)}
                        className={cn(
                          "flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-[1.5px] transition-all",
                          species === opt.value ? "border-[#bf524a] bg-[rgba(240,213,210,0.3)]" : "border-[#E8DFD6] bg-white hover:border-[#c9665f]"
                        )}>
                        <span className="text-[1.3rem]">{opt.emoji}</span>
                        <span className="text-[0.82rem] font-[Cormorant,serif] text-[#2D2926]">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {showGender && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.2 }}>
                  <div className="flex gap-2 justify-center">
                    {GENDER_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => setGender(opt.value)}
                        className={cn(
                          "px-5 py-[0.6rem] rounded-[20px] border-[1.5px] text-[0.88rem] font-[Cormorant,serif] transition-all",
                          gender === opt.value ? "bg-[#bf524a] text-white border-[#bf524a]" : "border-[#E8DFD6] bg-white text-[#2D2926] hover:border-[#c9665f]"
                        )}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              <button onClick={() => setScreen(1)} disabled={!screen1Ready}
                className={cn(roseBtn, screen1Ready ? "bg-[#bf524a] hover:bg-[#c9665f]" : "bg-[#bf524a]/50 cursor-not-allowed")}>
                Continue →
              </button>
            </motion.div>
          )}

          {/* SCREEN 2: Birthday + Time */}
          {screen === 1 && (
            <motion.div key="s2" variants={screenVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
              <h1 className="text-center text-[1.5rem] text-[#2D2926]" style={{ fontFamily: 'DM Serif Display, serif' }}>
                When was {petName} born?
              </h1>
              <p className="text-center text-[0.92rem] text-[#6B5E54] italic" style={{ fontFamily: 'Cormorant, serif' }}>
                Every planetary position in {pronouns.possessive} chart is calculated from this exact date.
              </p>
              <p className="text-center text-[1.1rem] text-[#bf524a]" style={{ fontFamily: 'Caveat, cursive' }}>
                The stars don't lie.
              </p>

              <div>
                <label className={labelClass}>Date of birth</label>
                <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)}
                  className={inputClass} aria-label="Date of birth" style={{ fontSize: '16px' }} />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className={cn(labelClass, "mb-0")}>Time of birth</label>
                  <span className="text-[0.6rem] font-bold text-[#c4a265] bg-[rgba(196,162,101,0.15)] px-2 py-[2px] rounded">OPTIONAL</span>
                </div>
                <input type="time" value={birthTime} onChange={e => setBirthTime(e.target.value)}
                  className={inputClass} aria-label="Time of birth" style={{ fontSize: '16px' }} />
                <p className={hintClass}>
                  Determines {pronouns.possessive} Rising sign — the mask {pronouns.subject} shows the world.
                </p>
              </div>

              <div className="bg-white border border-[#E8DFD6] rounded-xl p-4 border-l-[3px] border-l-[#c4a265]">
                <p className="text-[0.82rem] text-[#6B5E54]" style={{ fontFamily: 'Cormorant, serif' }}>
                  If you're not sure of the exact date, your best estimate still works — the Sun and outer planets move slowly enough to capture {pronouns.possessive} core essence accurately.
                </p>
              </div>

              <button onClick={() => setScreen(2)} className={cn(roseBtn, "bg-[#bf524a] hover:bg-[#c9665f]")}>
                Continue →
              </button>
            </motion.div>
          )}

          {/* SCREEN 3: Breed + Location */}
          {screen === 2 && (
            <motion.div key="s3" variants={screenVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
              <h1 className="text-center text-[1.5rem] text-[#2D2926]" style={{ fontFamily: 'DM Serif Display, serif' }}>
                A little more about {petName}
              </h1>
              <p className="text-center text-[0.88rem] text-[#9B8E84] italic" style={{ fontFamily: 'Cormorant, serif' }}>
                Both optional — skip if you're not sure.
              </p>

              <div>
                <label className={labelClass}>Breed</label>
                <input value={breed} onChange={e => setBreed(e.target.value)}
                  placeholder="e.g. Golden Retriever, Siamese, Holland Lop..."
                  className={inputClass} aria-label="Breed" style={{ fontSize: '16px' }} />
                <p className={hintClass}>Lets us write breed-specific personality insights that actually sound like {petName}.</p>
              </div>

              <div className="relative">
                <label className={labelClass}>Birth location</label>
                <input value={location} onChange={e => setLocation(e.target.value)}
                  placeholder="City or country"
                  className={inputClass} aria-label="Location" style={{ fontSize: '16px' }}
                  onFocus={() => { if (location.length >= 2) setShowLocationResults(true); }}
                  onBlur={() => setTimeout(() => setShowLocationResults(false), 200)} />
                <AnimatePresence>
                  {showLocationResults && locationResults.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                      className="absolute z-50 w-full mt-1 bg-white border border-[#E8DFD6] rounded-xl shadow-lg overflow-hidden">
                      {locationResults.map((r, i) => (
                        <button key={i} onMouseDown={e => e.preventDefault()} onClick={() => selectLocation(r)}
                          className="w-full px-4 py-3 text-left hover:bg-[rgba(240,213,210,0.2)] transition-colors border-b border-[#E8DFD6] last:border-0 text-[0.85rem] font-[Cormorant,serif] text-[#2D2926]">
                          {r.display_name.split(',').slice(0, 3).join(',')}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                <p className={hintClass}>Affects which stars were visible — refines house placements in the chart.</p>
              </div>

              <button onClick={() => setScreen(3)} className={cn(roseBtn, "bg-[#bf524a] hover:bg-[#c9665f]")}>
                Continue →
              </button>
              <button onClick={() => setScreen(3)} className="w-full text-center text-[0.85rem] text-[#9B8E84] font-[Cormorant,serif] hover:underline mt-1">
                Skip these — keep it simple
              </button>
            </motion.div>
          )}

          {/* SCREEN 4: Make it personal */}
          {screen === 3 && (
            <motion.div key="s4" variants={screenVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
              <div className="bg-[rgba(196,162,101,0.15)] rounded-[10px] px-4 py-2 text-center">
                <span className="text-[0.78rem] text-[#c4a265] font-semibold">⭐ Makes it personal</span>
              </div>

              <h1 className="text-center text-[1.5rem] text-[#2D2926]" style={{ fontFamily: 'DM Serif Display, serif' }}>
                Help us really see {petName}
              </h1>
              <p className="text-center text-[0.88rem] text-[#6B5E54]" style={{ fontFamily: 'Cormorant, serif' }}>
                The more we know, the more the reading sounds like it was written by someone who actually knows {petName}.
              </p>

              {/* Soul Type */}
              <div>
                <label className={labelClass}>Soul type <span className="text-[#9B8E84] normal-case tracking-normal font-normal">(pick up to 2)</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {SOUL_TYPES.map(t => (
                    <button key={t.label} onClick={() => toggleMultiSelect(soulTypes, setSoulTypes, t.label, 2)}
                      className={cn(
                        "px-3 py-[0.55rem] rounded-[10px] border-[1.5px] text-left transition-all flex items-start gap-2",
                        soulTypes.includes(t.label) ? "border-[#bf524a] bg-[rgba(240,213,210,0.3)]" : "border-[#E8DFD6] bg-white"
                      )}>
                      <span className="text-[1rem] mt-[1px]">{t.emoji}</span>
                      <div>
                        <div className="text-[0.82rem] font-[Cormorant,serif] font-semibold text-[#2D2926]">{t.label}</div>
                        <div className="text-[0.7rem] font-[Cormorant,serif] text-[#9B8E84]">{t.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Superpower */}
              <div>
                <label className={labelClass}>Superpower <span className="text-[#9B8E84] normal-case tracking-normal font-normal">(pick up to 2)</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {SUPERPOWERS.map(s => (
                    <button key={s.label} onClick={() => toggleMultiSelect(superpowers, setSuperpowers, s.label, 2)}
                      className={cn(
                        "px-3 py-[0.55rem] rounded-[10px] border-[1.5px] text-left transition-all flex items-start gap-2",
                        superpowers.includes(s.label) ? "border-[#bf524a] bg-[rgba(240,213,210,0.3)]" : "border-[#E8DFD6] bg-white"
                      )}>
                      <span className="text-[1rem] mt-[1px]">{s.emoji}</span>
                      <div>
                        <div className="text-[0.82rem] font-[Cormorant,serif] font-semibold text-[#2D2926]">{s.label}</div>
                        <div className="text-[0.7rem] font-[Cormorant,serif] text-[#9B8E84]">{s.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stranger Reaction */}
              <div>
                <label className={labelClass}>How do they react to strangers?</label>
                <div className="grid grid-cols-2 gap-2">
                  {STRANGER_REACTIONS.map(r => (
                    <button key={r.label} onClick={() => setStrangerReaction(strangerReaction === r.label ? "" : r.label)}
                      className={cn(
                        "px-3 py-[0.55rem] rounded-[10px] border-[1.5px] text-left transition-all flex items-start gap-2",
                        strangerReaction === r.label ? "border-[#bf524a] bg-[rgba(240,213,210,0.3)]" : "border-[#E8DFD6] bg-white"
                      )}>
                      <span className="text-[1rem] mt-[1px]">{r.emoji}</span>
                      <div>
                        <div className="text-[0.82rem] font-[Cormorant,serif] font-semibold text-[#2D2926]">{r.label}</div>
                        <div className="text-[0.7rem] font-[Cormorant,serif] text-[#9B8E84]">{r.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => setScreen(4)} className={cn(roseBtn, "bg-[#bf524a] hover:bg-[#c9665f]")}>
                Continue →
              </button>
              <button onClick={() => setScreen(4)} className="w-full text-center text-[0.85rem] text-[#9B8E84] font-[Cormorant,serif] hover:underline mt-1">
                Skip — let the stars do the talking
              </button>
            </motion.div>
          )}

          {/* SCREEN 5: Confirmation */}
          {screen === 4 && (
            <motion.div key="s5" variants={screenVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
              <h1 className="text-center text-[1.5rem] text-[#2D2926]" style={{ fontFamily: 'DM Serif Display, serif' }}>
                Ready to read {petName}'s stars
              </h1>

              {/* Summary Card */}
              <div className="bg-white rounded-[14px] border border-[#E8DFD6] p-5">
                {summaryRows.map((row, i) => (
                  <div key={row.label}>
                    <div className="flex justify-between py-2">
                      <span className="text-[0.82rem] text-[#9B8E84] font-[Cormorant,serif]">{row.label}</span>
                      <span className={cn("text-[0.88rem] font-semibold font-[Cormorant,serif]", row.value ? "text-[#2D2926]" : "text-[#9B8E84] italic")}>
                        {row.value || "—"}
                      </span>
                    </div>
                    {i < summaryRows.length - 1 && <div className="h-[0.5px] bg-[#E8DFD6]" />}
                  </div>
                ))}
              </div>

              {/* Photo Upload */}
              <div>
                <p className="text-[0.95rem] text-[#2D2926] font-[Cormorant,serif] font-semibold mb-1">
                  📸 Add {petName}'s photo
                </p>
                <p className="text-[0.78rem] text-[#9B8E84] font-[Cormorant,serif] mb-3">
                  Your favourite photo of {petName}. Used on the report and shareable card.
                </p>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                  onChange={e => { if (e.target.files?.[0]) handlePhotoUpload(e.target.files[0]); }} />
                {petPhotoUrl ? (
                  <div className="flex items-center gap-3">
                    <img src={petPhotoUrl} alt={`${petName}`} className="w-20 h-20 rounded-full object-cover border-2 border-[#E8DFD6]" />
                    <button onClick={() => { setPetPhotoUrl(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="text-[0.82rem] text-[#9B8E84] hover:text-[#bf524a] underline font-[Cormorant,serif]">
                      Remove
                    </button>
                  </div>
                ) : (
                  <button onClick={() => fileInputRef.current?.click()} disabled={isUploading}
                    className="w-full h-[120px] border-2 border-dashed border-[#E8DFD6] rounded-[14px] flex flex-col items-center justify-center gap-1 hover:border-[#c9665f] transition-colors">
                    {isUploading ? (
                      <span className="text-[0.82rem] text-[#9B8E84]">Uploading...</span>
                    ) : (
                      <>
                        <Camera className="w-5 h-5 text-[#9B8E84]" />
                        <span className="text-[0.82rem] text-[#9B8E84] font-[Cormorant,serif]">Tap to upload</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* CTA */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={cn(
                  "w-full py-4 rounded-xl text-white text-[1.05rem] transition-all",
                  "bg-[#bf524a] hover:bg-[#c9665f]"
                )}
                style={{ fontFamily: 'DM Serif Display, serif' }}
              >
                {isSubmitting ? "Creating..." : `Create ${petName}'s Soul Reading →`}
              </button>
              <p className="text-center text-[0.72rem] text-[#9B8E84] font-[Cormorant,serif]">
                🔒 Your data is encrypted and never shared.{' '}
                <a href="/privacy" className="underline hover:text-[#6B5E54]">Privacy policy</a>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
