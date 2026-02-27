import { useState, useRef, useCallback } from "react";
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
  "The Calm Observer", "The Wild Spirit", "The Gentle Healer",
  "The Social Butterfly", "The Loyal Guardian", "The Mischief Maker",
];

const SUPERPOWERS = [
  "Emotional Intelligence", "Pure Chaos Energy", "Infinite Patience",
  "Mind Reading", "Treat Detection", "Selective Hearing",
];

const STRANGER_REACTIONS = [
  "Instant Best Friend", "Cautious Then Obsessed", "Suspicious Until Trust Earned",
  "Couldn't Care Less", "Hides Then Investigates",
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
  const [soulType, setSoulType] = useState("");
  const [superpower, setSuperpower] = useState("");
  const [strangerReaction, setStrangerReaction] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [petPhotoUrl, setPetPhotoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [privacyError, setPrivacyError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pronouns = getPronouns(gender);

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
    if (!privacyAccepted) {
      setPrivacyError(true);
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("update-pet-data", {
        body: {
          reportId, petName, species, gender: gender || undefined,
          birthDate: birthDate || undefined, birthTime: birthTime || undefined,
          breed: breed || undefined, location: location || undefined,
          soulType: soulType || undefined, superpower: superpower || undefined,
          strangerReaction: strangerReaction || undefined, petPhotoUrl: petPhotoUrl || undefined,
        },
      });
      if (error) throw error;

      const { error: genError } = await supabase.functions.invoke("generate-cosmic-report", {
        body: { reportId },
      });
      if (genError) console.warn("[PostPurchaseIntake] Generation trigger:", genError);
      onComplete();
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
    { label: "Soul type", value: soulType },
    { label: "Superpower", value: superpower },
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
                <input value={breed} onChange={e => setBreed(e.target.value)}
                  placeholder="e.g. Golden Retriever, Siamese, Holland Lop..."
                  className={inputClass} aria-label="Breed" style={{ fontSize: '16px' }} />
                <p className={hintClass}>Lets us write breed-specific personality insights that actually sound like {petName}.</p>
              </div>

              <div>
                <input value={location} onChange={e => setLocation(e.target.value)}
                  placeholder="City or country" className={inputClass} aria-label="Location" style={{ fontSize: '16px' }} />
                <p className={hintClass}>Affects which stars were visible at {pronouns.possessive} birth — refines house placements in the chart.</p>
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
                <label className={labelClass}>Soul type</label>
                <div className="grid grid-cols-2 gap-2">
                  {SOUL_TYPES.map(t => (
                    <button key={t} onClick={() => setSoulType(soulType === t ? "" : t)}
                      className={cn(
                        "px-3 py-[0.55rem] rounded-[10px] border-[1.5px] text-[0.82rem] font-[Cormorant,serif] text-left transition-all",
                        soulType === t ? "border-[#bf524a] bg-[rgba(240,213,210,0.3)]" : "border-[#E8DFD6] bg-white"
                      )}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Superpower */}
              <div>
                <label className={labelClass}>Superpower</label>
                <div className="grid grid-cols-2 gap-2">
                  {SUPERPOWERS.map(s => (
                    <button key={s} onClick={() => setSuperpower(superpower === s ? "" : s)}
                      className={cn(
                        "px-3 py-[0.55rem] rounded-[10px] border-[1.5px] text-[0.82rem] font-[Cormorant,serif] text-left transition-all",
                        superpower === s ? "border-[#bf524a] bg-[rgba(240,213,210,0.3)]" : "border-[#E8DFD6] bg-white"
                      )}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stranger Reaction */}
              <div>
                <label className={labelClass}>Stranger reaction</label>
                <div className="flex flex-col gap-2">
                  {STRANGER_REACTIONS.map(r => (
                    <button key={r} onClick={() => setStrangerReaction(strangerReaction === r ? "" : r)}
                      className={cn(
                        "w-full px-4 py-[0.6rem] rounded-[10px] border-[1.5px] text-[0.82rem] font-[Cormorant,serif] text-left transition-all",
                        strangerReaction === r ? "border-[#bf524a] bg-[rgba(240,213,210,0.3)]" : "border-[#E8DFD6] bg-white"
                      )}>
                      {r}
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

              {/* Privacy Panel */}
              <div className="bg-white rounded-[14px] border border-[#E8DFD6] p-5 space-y-3">
                <p className="text-[0.92rem] text-[#2D2926] font-semibold font-[Cormorant,serif]">
                  🔒 Your Data, Your Control
                </p>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={privacyAccepted}
                    onChange={e => { setPrivacyAccepted(e.target.checked); setPrivacyError(false); }}
                    className="mt-1 w-4 h-4 accent-[#bf524a] shrink-0" />
                  <span className="text-[0.82rem] text-[#6B5E54] font-[Cormorant,serif] leading-relaxed">
                    I understand my pet's details are used solely to generate their cosmic reading. No data is shared with third parties. I can delete all my data at any time.
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {["✓ No third-party sharing", "✓ Delete anytime", "✓ Encrypted"].map(b => (
                    <span key={b} className="text-[0.7rem] text-[#4a8c5c] bg-[rgba(74,140,92,0.1)] px-2 py-[2px] rounded-md font-[Cormorant,serif]">
                      {b}
                    </span>
                  ))}
                </div>
                {privacyError && (
                  <p className="text-[0.78rem] text-[#bf524a]">Please accept the privacy terms to continue</p>
                )}
              </div>

              {/* CTA */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={cn(
                  "w-full py-4 rounded-xl text-white text-[1.05rem] transition-all",
                  privacyAccepted ? "bg-[#bf524a] hover:bg-[#c9665f]" : "bg-[#bf524a]/50 cursor-not-allowed"
                )}
                style={{ fontFamily: 'DM Serif Display, serif' }}
              >
                {isSubmitting ? "Creating..." : `Create ${petName}'s Soul Reading →`}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
