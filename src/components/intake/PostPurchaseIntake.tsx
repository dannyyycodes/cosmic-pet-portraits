import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, MapPin, Loader2, ChevronDown, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import imageCompression from 'browser-image-compression';

interface SharedOwnerData {
  ownerName?: string;
  ownerBirthDate?: string;
  ownerBirthTime?: string;
  ownerBirthLocation?: string;
}

export interface PetIntakeSnapshot {
  email: string;
  owner?: SharedOwnerData;
}

interface PostPurchaseIntakeProps {
  reportId: string;
  onComplete: (snapshot?: PetIntakeSnapshot) => void;
  /** When rendered inside MultiPetIntakeFlow, these give context for progress + re-use. */
  petIndex?: number; // 0-based
  totalPets?: number;
  sharedEmail?: string;
  sharedOwner?: SharedOwnerData;
  /** Label to show on the final submit button. Defaults to "Create {petName}'s Soul Reading →" */
  submitLabel?: (petName: string) => string;
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
  { value: "hamster", emoji: "🐹", label: "Hamster" },
  { value: "guinea_pig", emoji: "🐹", label: "Guinea pig" },
  { value: "fish", emoji: "🐠", label: "Fish" },
  { value: "reptile", emoji: "🦎", label: "Reptile" },
  { value: "horse", emoji: "🐴", label: "Horse" },
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

const OCCASION_OPTIONS = [
  { value: "discover", emoji: "🔮", label: "Discover", desc: "Explore who they truly are" },
  { value: "new", emoji: "🌱", label: "New Pet", desc: "A soul just arrived in your life" },
  { value: "memorial", emoji: "🕊️", label: "Memorial", desc: "For a beloved soul no longer at your side" },
  { value: "birthday", emoji: "🎂", label: "Birthday", desc: "Celebrate another year of magic" },
  { value: "gift", emoji: "🎁", label: "Gift", desc: "A cosmic gift for someone special" },
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

export function PostPurchaseIntake({
  reportId,
  onComplete,
  petIndex,
  totalPets,
  sharedEmail,
  sharedOwner,
  submitLabel,
}: PostPurchaseIntakeProps) {
  const isMultiPet = typeof totalPets === 'number' && totalPets > 1;
  const currentPetNumber = (petIndex ?? 0) + 1;
  const hasSharedEmail = !!sharedEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sharedEmail);
  const hasSharedOwner = !!(sharedOwner && sharedOwner.ownerBirthDate);

  const [screen, setScreen] = useState(0);
  const [occasionMode, setOccasionMode] = useState("discover");
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
  const [ownerMemory, setOwnerMemory] = useState("");
  const [petPhotoUrl, setPetPhotoUrl] = useState<string | null>(null);
  const [email, setEmail] = useState(sharedEmail ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Soul Bond (premium) — owner details
  const [includesSoulBond, setIncludesSoulBond] = useState(false);
  const [ownerName, setOwnerName] = useState(sharedOwner?.ownerName ?? "");
  const [ownerBirthMonth, setOwnerBirthMonth] = useState("");
  const [ownerBirthYear, setOwnerBirthYear] = useState("");
  const [ownerBirthDay, setOwnerBirthDay] = useState("");
  const [ownerBirthDate, setOwnerBirthDate] = useState(sharedOwner?.ownerBirthDate ?? "");
  const [ownerBirthTime, setOwnerBirthTime] = useState(sharedOwner?.ownerBirthTime ?? "");
  const [ownerBirthLocation, setOwnerBirthLocation] = useState(sharedOwner?.ownerBirthLocation ?? "");
  const [ownerLocationResults, setOwnerLocationResults] = useState<Array<{ display_name: string; address?: { city?: string; town?: string; village?: string; country?: string; state?: string }; name?: string }>>([]);
  const [showOwnerLocationResults, setShowOwnerLocationResults] = useState(false);
  const [isSearchingOwnerLocation, setIsSearchingOwnerLocation] = useState(false);
  const ownerLocationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drag-and-drop state
  const [isDragging, setIsDragging] = useState(false);

  // Fetch report row to check premium tier AND pre-seed the occasion from the
  // purchase context. For pure-memorial Stripe carts the webhook already wrote
  // occasion_mode='memorial' to the row; for redeem codes the user picks their
  // occasion on /redeem-code. Either way we know the occasion before intake —
  // so we skip the redundant "What's the occasion?" screen and jump straight
  // into the pet-details flow with the correct copy already wired via isMemorial.
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('pet_reports')
          .select('includes_portrait, occasion_mode')
          .eq('id', reportId)
          .single();
        if (data?.includes_portrait) setIncludesSoulBond(true);
        const dbOccasion = (data as { occasion_mode?: string } | null)?.occasion_mode;
        if (dbOccasion && ['discover', 'new', 'birthday', 'memorial', 'gift'].includes(dbOccasion)) {
          setOccasionMode(dbOccasion);
          // Single-pet orders: auto-skip Screen 0 — we already know why they're here.
          // Multi-pet orders: show Screen 0 with the cart-level occasion pre-selected
          // so the buyer can confirm OR change per pet. This is the fix for mixed-
          // occasion carts where today all pets silently inherited the landing path's
          // occasion (e.g. a new-pet cart with 4 pets used to write occasion=new to
          // all 4 even if the buyer actually wanted pet 3 to be a memorial reading).
          if (!isMultiPet) {
            setScreen(1);
          }
        }
      } catch { /* non-fatal — Screen 0 still available as fallback */ }
    })();
  }, [reportId]);

  // Prevent browser from navigating away on accidental file drops outside the drop zone
  useEffect(() => {
    const prevent = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    window.addEventListener('dragover', prevent);
    window.addEventListener('drop', prevent);
    return () => {
      window.removeEventListener('dragover', prevent);
      window.removeEventListener('drop', prevent);
    };
  }, []);

  // Scroll to top on every screen transition — on mobile the page can sit
  // mid-scroll from the previous screen, hiding the new screen's heading
  // under the iOS keyboard or nav bar. Respect prefers-reduced-motion.
  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    try {
      window.scrollTo({ top: 0, left: 0, behavior: reduced ? 'auto' : 'smooth' });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [screen]);

  // Memorial-only anchors — the memorial prompt on the worker reads these
  // three columns from pet_reports (passed_date, favorite_memory, remembered_by)
  // to anchor grief-specific sections. Without them the memorial report is
  // generic grief writing rather than a reading *about this pet*.
  const [passedMonth, setPassedMonth] = useState("");
  const [passedYear, setPassedYear] = useState("");
  const [passedDay, setPassedDay] = useState("");
  const [passedDate, setPassedDate] = useState("");
  const [favoriteMemory, setFavoriteMemory] = useState("");
  const [rememberedBy, setRememberedBy] = useState("");

  // Improved date picker state
  const [useEstimateAge, setUseEstimateAge] = useState(false);
  const [estimateYears, setEstimateYears] = useState("");
  const [estimateMonths, setEstimateMonths] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthDay, setBirthDay] = useState("");

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => Array.from({ length: 30 }, (_, i) => currentYear - i), [currentYear]);
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  // Sync month/year/day selects → birthDate string. Refuses future dates —
  // a pet born tomorrow is the kind of quiet bug that makes the reveal feel
  // broken (future chart = future transits = nonsense).
  useEffect(() => {
    if (birthMonth && birthYear && birthDay) {
      const m = (parseInt(birthMonth) + 1).toString().padStart(2, '0');
      const d = birthDay.padStart(2, '0');
      const candidate = `${birthYear}-${m}-${d}`;
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      setBirthDate(candidate <= today ? candidate : "");
    }
  }, [birthMonth, birthYear, birthDay]);

  // Calculate days in selected month
  const daysInMonth = useMemo(() => {
    if (birthMonth === "" || !birthYear) return 31;
    return new Date(parseInt(birthYear), parseInt(birthMonth) + 1, 0).getDate();
  }, [birthMonth, birthYear]);

  // Estimate age → birthDate
  useEffect(() => {
    if (useEstimateAge && (estimateYears || estimateMonths)) {
      const y = parseInt(estimateYears) || 0;
      const m = parseInt(estimateMonths) || 0;
      if (y > 0 || m > 0) {
        const d = new Date();
        d.setFullYear(d.getFullYear() - y);
        d.setMonth(d.getMonth() - m);
        setBirthDate(d.toISOString().split('T')[0]);
      }
    }
  }, [estimateYears, estimateMonths, useEstimateAge]);

  // Sync owner month/year/day → ownerBirthDate
  useEffect(() => {
    if (ownerBirthMonth && ownerBirthYear && ownerBirthDay) {
      const m = (parseInt(ownerBirthMonth) + 1).toString().padStart(2, '0');
      const d = ownerBirthDay.padStart(2, '0');
      setOwnerBirthDate(`${ownerBirthYear}-${m}-${d}`);
    }
  }, [ownerBirthMonth, ownerBirthYear, ownerBirthDay]);

  // Sync passed month/year/day → passedDate. Refuses future passed-dates AND
  // passed-dates before the pet's birth date. Picker is optional — all three
  // parts must be set for the date to emit; partial entries don't commit.
  useEffect(() => {
    if (passedMonth && passedYear && passedDay) {
      const m = (parseInt(passedMonth) + 1).toString().padStart(2, '0');
      const d = passedDay.padStart(2, '0');
      const candidate = `${passedYear}-${m}-${d}`;
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const afterBirth = !birthDate || candidate >= birthDate;
      setPassedDate(candidate <= today && afterBirth ? candidate : "");
    }
  }, [passedMonth, passedYear, passedDay, birthDate]);

  const ownerDaysInMonth = useMemo(() => {
    if (ownerBirthMonth === "" || !ownerBirthYear) return 31;
    return new Date(parseInt(ownerBirthYear), parseInt(ownerBirthMonth) + 1, 0).getDate();
  }, [ownerBirthMonth, ownerBirthYear]);

  const ownerYears = useMemo(() => Array.from({ length: 80 }, (_, i) => currentYear - 16 - i), [currentYear]);

  const passedDaysInMonth = useMemo(() => {
    if (passedMonth === "" || !passedYear) return 31;
    return new Date(parseInt(passedYear), parseInt(passedMonth) + 1, 0).getDate();
  }, [passedMonth, passedYear]);

  // Owner location autocomplete
  useEffect(() => {
    if (ownerLocationTimeout.current) clearTimeout(ownerLocationTimeout.current);
    const query = ownerBirthLocation.trim();
    if (query.length < 2) { setOwnerLocationResults([]); setShowOwnerLocationResults(false); return; }
    setIsSearchingOwnerLocation(true);
    ownerLocationTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`, { headers: { 'Accept-Language': 'en' } });
        const data = await res.json();
        setOwnerLocationResults(data);
        setShowOwnerLocationResults(true);
      } catch { setOwnerLocationResults([]); }
      finally { setIsSearchingOwnerLocation(false); }
    }, 300);
    return () => { if (ownerLocationTimeout.current) clearTimeout(ownerLocationTimeout.current); };
  }, [ownerBirthLocation]);

  const selectOwnerLocation = (result: typeof ownerLocationResults[0]) => {
    const city = result.address?.city || result.address?.town || result.address?.village || result.name || '';
    const country = result.address?.country || '';
    const state = result.address?.state;
    let formatted: string;
    if (country === 'United States' && state && city) formatted = `${city}, ${state}, USA`;
    else if (city && country) formatted = `${city}, ${country}`;
    else formatted = result.display_name.split(',').slice(0, 3).join(',').trim();
    setOwnerBirthLocation(formatted);
    setShowOwnerLocationResults(false);
  };

  // Quick-select cities for location
  const quickCities = [
    { city: 'New York', country: 'USA', flag: '🇺🇸' },
    { city: 'London', country: 'UK', flag: '🇬🇧' },
    { city: 'Sydney', country: 'Australia', flag: '🇦🇺' },
    { city: 'Toronto', country: 'Canada', flag: '🇨🇦' },
    { city: 'Dubai', country: 'UAE', flag: '🇦🇪' },
    { city: 'Paris', country: 'France', flag: '🇫🇷' },
  ];

  const pronouns = getPronouns(gender);

  // Memorial mode reshapes every present-tense prompt into past-tense,
  // grief-aware phrasing. Branch once here so the JSX stays readable.
  const isMemorial = occasionMode === 'memorial';
  // New-pet mode reshapes copy toward arrival / bonding / who-will-they-become
  // rather than revelation-about-established-pet. Every screen that talks to
  // the reader as a long-time owner needs a different voice when the pet just
  // walked in the door.
  const isNew = occasionMode === 'new';

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
    const isImage = file.type.startsWith('image/') || /\.(heic|heif|webp|avif)$/i.test(file.name);
    if (!isImage) {
      toast.error("Please upload an image file.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Image is too large. Please use an image under 50MB.");
      return;
    }
    setIsUploading(true);
    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: 'image/jpeg',
        initialQuality: 0.85,
      });
      const filename = `${crypto.randomUUID()}.jpg`;
      const { error } = await supabase.storage.from('pet-photos').upload(filename, compressedFile, { cacheControl: '31536000', upsert: false, contentType: 'image/jpeg' });
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
    // Submission logged server-side only
    try {
      const { data, error } = await supabase.functions.invoke("update-pet-data", {
        body: {
          reportId, petName, species, gender: gender || undefined, occasionMode,
          birthDate: birthDate || undefined, birthTime: birthTime || undefined,
          breed: breed || undefined, location: location || undefined,
          soulType: soulTypes.join(', ') || undefined, superpower: superpowers.join(', ') || undefined,
          strangerReaction: strangerReaction || undefined, petPhotoUrl: petPhotoUrl || undefined,
          ownerMemory: ownerMemory.trim() || undefined,
          email: email.trim() || undefined,
          // Memorial-only anchor fields — worker memorial-prompt.ts uses these
          // to ground sections in *this* pet rather than generic grief writing.
          ...(isMemorial ? {
            passedDate: passedDate || undefined,
            favoriteMemory: favoriteMemory.trim() || undefined,
            rememberedBy: rememberedBy.trim() || undefined,
          } : {}),
          ...(includesSoulBond && !isMemorial && ownerBirthDate ? {
            ownerName: ownerName.trim() || undefined,
            ownerBirthDate: ownerBirthDate || undefined,
            ownerBirthTime: ownerBirthTime || undefined,
            ownerBirthLocation: ownerBirthLocation || undefined,
          } : {}),
        },
      });
      if (error) {
        console.error("[PostPurchaseIntake] update-pet-data error:", error);
        throw error;
      }
      if (data?.error) {
        console.error("[PostPurchaseIntake] update-pet-data returned error:", data.error);
        throw new Error(data.error);
      }

      // Capture shared fields for re-use across subsequent pets in a multi-pet flow.
      const snapshot: PetIntakeSnapshot = {
        email: email.trim(),
        ...(includesSoulBond && ownerBirthDate
          ? {
              owner: {
                ownerName: ownerName.trim() || undefined,
                ownerBirthDate: ownerBirthDate || undefined,
                ownerBirthTime: ownerBirthTime || undefined,
                ownerBirthLocation: ownerBirthLocation || undefined,
              },
            }
          : {}),
      };

      // Fire and forget — report generates in the background
      supabase.functions.invoke("generate-report-background", {
        body: { reportId, includesPortrait: includesSoulBond },
      }).catch(err => console.warn("[PostPurchaseIntake] Generation trigger:", err));

      // Hand control back — wrapper decides whether to advance to next pet or
      // move to the reveal sequence.
      onComplete(snapshot);
    } catch (err: any) {
      console.error("[PostPurchaseIntake] Submission failed");
      const errorMsg = err?.message || "Something went wrong";
      toast.error(errorMsg + ". Please try again.");
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full border-[1.5px] border-[#E8DFD6] rounded-xl px-5 py-[0.9rem] text-[1.1rem] text-[#2D2926] bg-white placeholder:text-[#9B8E84] focus:outline-none focus:border-[#bf524a] transition-colors font-[Cormorant,serif]";
  const hintClass = "text-[0.78rem] text-[#9B8E84] font-[Cormorant,serif] mt-1";
  const labelClass = "text-[0.7rem] text-[#9B8E84] uppercase tracking-widest font-[Cormorant,serif] font-semibold mb-1 block";
  const roseBtn = "w-full py-[0.9rem] rounded-xl text-white font-[Cormorant,serif] font-semibold text-[1rem] transition-all";

  // Screen 5 is a per-product slot:
  // - Memorial path  → memorial anchors (passed_date, favorite_memory, remembered_by)
  // - Premium path   → Soul Bond owner chart
  // - Basic path     → skipped straight to confirm
  // Memorial and Soul Bond are mutually exclusive — Soul Bond adds owner-vs-pet
  // compatibility to the report, but the memorial prompt has no compatibility
  // section, so collecting owner chart on a memorial cart would be a silent
  // value leak. Memorial carts pay the premium £49 price but deliver memorial
  // content, not synastry.
  // When owner data is already captured from a previous pet in a multi-pet flow,
  // skip the Soul Bond screen entirely — we already have what we need.
  const skipSoulBondScreen = includesSoulBond && hasSharedOwner;
  const showMemorialScreen = isMemorial;
  const showSoulBondScreen = includesSoulBond && !hasSharedOwner && !isMemorial;
  const extraScreen = showMemorialScreen || showSoulBondScreen;
  const totalScreens = extraScreen ? 7 : 6;
  // For memorial: 0=occasion, 1=name, 2=birthday, 3=breed/location, 4=personality, 5=memorial anchors, 6=confirm
  // For premium:  0=occasion, 1=name, 2=birthday, 3=breed/location, 4=personality, 5=soul bond,        6=confirm
  // For basic:    0=occasion, 1=name, 2=birthday, 3=breed/location, 4=personality, 5=confirm
  const confirmScreen = extraScreen ? 6 : 5;
  const memorialScreen = 5; // only used when showMemorialScreen
  const soulBondScreen = 5; // only used when showSoulBondScreen

  // Previous-screen resolver for the back button. Accounts for the optional
  // screen 5 (memorial anchors OR Soul Bond, mutually exclusive) so basic-tier
  // buyers go 4 → confirm(5), premium buyers go 4 → soulBond(5) → confirm(6),
  // memorial buyers go 4 → memorial(5) → confirm(6). Screen 0 is the occasion
  // picker and has no further back step.
  const previousScreen = (current: number): number => {
    if (current <= 1) return 0;
    if (current <= 4) return current - 1;
    if (current === 5 && extraScreen) return 4;
    if (current === confirmScreen) return extraScreen ? 5 : 4;
    return 0;
  };
  const goBack = () => setScreen((s) => previousScreen(s));

  const ProgressDots = () => (
    <div className="flex flex-col items-center gap-2 mb-6">
      {isMultiPet && (
        <motion.div
          key={`pet-badge-${petIndex}`}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          role="status"
          aria-live="polite"
          aria-label={`Pet ${currentPetNumber} of ${totalPets}`}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full"
          style={{
            background: 'linear-gradient(135deg, rgba(196,162,101,0.15), rgba(191,82,74,0.12))',
            border: '1px solid rgba(196,162,101,0.35)',
          }}
        >
          <span className="text-[0.68rem] font-bold uppercase tracking-[0.15em]" style={{ color: '#a07c3a', fontFamily: 'Cormorant, serif' }}>
            Pet {currentPetNumber} of {totalPets}
          </span>
          <div className="flex gap-1" aria-hidden="true">
            {Array.from({ length: totalPets! }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 rounded-full transition-all",
                  i < currentPetNumber ? "bg-[#bf524a] w-4" : "bg-[#E8DFD6] w-2"
                )}
              />
            ))}
          </div>
        </motion.div>
      )}
      <div className="flex items-center gap-2 justify-center">
        {Array.from({ length: totalScreens }, (_, i) => (
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
    </div>
  );

  const summaryRows = [
    { label: "Occasion", value: OCCASION_OPTIONS.find(o => o.value === occasionMode)?.label || "Discover" },
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
    <div
      className="min-h-screen flex items-start sm:items-center justify-center px-4 py-8"
      style={{
        backgroundColor: '#FFFDF5',
        paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))',
        paddingTop: 'calc(2rem + env(safe-area-inset-top, 0px))',
        ...grainStyle,
      }}
    >
      <div className="w-full max-w-[480px]">
        {screen > 0 && !isSubmitting && (
          <button
            type="button"
            onClick={goBack}
            aria-label="Go back to the previous step"
            className="flex items-center gap-1.5 mb-3 text-[0.82rem] text-[#9B8E84] hover:text-[#2D2926] transition-colors"
            style={{ fontFamily: 'Cormorant, serif' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}
        <ProgressDots />
        <AnimatePresence mode="wait">
          {/* SCREEN 0: Occasion Mode */}
          {screen === 0 && (
            <motion.div key="s0" variants={screenVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
              <h1 className="text-center text-[1.5rem] text-[#2D2926]" style={{ fontFamily: 'DM Serif Display, serif' }}>What's the occasion?</h1>
              <div className="grid grid-cols-2 gap-2">
                {OCCASION_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setOccasionMode(opt.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 py-4 px-3 rounded-xl border-[1.5px] transition-all",
                      occasionMode === opt.value ? "border-[#bf524a] bg-[rgba(240,213,210,0.3)]" : "border-[#E8DFD6] bg-white hover:border-[#c9665f]"
                    )}>
                    <span className="text-[1.5rem]">{opt.emoji}</span>
                    <span className="text-[0.88rem] font-[Cormorant,serif] font-semibold text-[#2D2926]">{opt.label}</span>
                    <span className="text-[0.72rem] font-[Cormorant,serif] text-[#9B8E84]">{opt.desc}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setScreen(1)}
                className={cn(roseBtn, "bg-[#bf524a] hover:bg-[#c9665f]")}>
                Continue →
              </button>
            </motion.div>
          )}

          {/* SCREEN 1: Name, Species, Gender */}
          {screen === 1 && (
            <motion.div key="s1" variants={screenVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
              <h1 className="text-center text-[1.5rem] text-[#2D2926]" style={{ fontFamily: 'DM Serif Display, serif' }}>
                {isMemorial ? 'Tell us about them' : isNew ? 'Let\'s welcome them' : "Let's meet them"}
              </h1>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <input
                  value={petName} onChange={e => {
                    const val = e.target.value;
                    const formatted = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
                    setPetName(formatted);
                  }}
                  placeholder={isMemorial ? 'What was their name?' : isNew ? "What's your new arrival's name?" : "What's their name?"}
                  className={cn(inputClass, "text-center")}
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

              <button onClick={() => setScreen(2)} disabled={!screen1Ready}
                className={cn(roseBtn, screen1Ready ? "bg-[#bf524a] hover:bg-[#c9665f]" : "bg-[#bf524a]/50 cursor-not-allowed")}>
                Continue →
              </button>
            </motion.div>
          )}

          {/* SCREEN 2: Birthday + Time */}
          {screen === 2 && (
            <motion.div key="s2" variants={screenVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
              <h1 className="text-center text-[1.5rem] text-[#2D2926]" style={{ fontFamily: 'DM Serif Display, serif' }}>
                When was {petName} born?
              </h1>
              <p className="text-center text-[0.92rem] text-[#6B5E54] italic" style={{ fontFamily: 'Cormorant, serif' }}>
                {isMemorial
                  ? `Every planetary position in ${pronouns.possessive} chart was set the moment ${pronouns.subject} arrived.`
                  : isNew
                  ? `The stars were arranged on the day ${pronouns.subject} came into the world — this is what ${pronouns.subject} brings to you.`
                  : `Every planetary position in ${pronouns.possessive} chart is calculated from this exact date.`}
              </p>

              {/* Toggle: Know exact date vs Estimate age */}
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => { setUseEstimateAge(false); setBirthDate(''); }}
                  className={cn(
                    "px-4 py-2 rounded-full text-[0.82rem] font-[Cormorant,serif] font-semibold border-[1.5px] transition-all",
                    !useEstimateAge ? "border-[#bf524a] bg-[rgba(240,213,210,0.3)] text-[#2D2926]" : "border-[#E8DFD6] bg-white text-[#9B8E84]"
                  )}
                >
                  📅 I know the date
                </button>
                <button
                  onClick={() => { setUseEstimateAge(true); setBirthDate(''); }}
                  className={cn(
                    "px-4 py-2 rounded-full text-[0.82rem] font-[Cormorant,serif] font-semibold border-[1.5px] transition-all",
                    useEstimateAge ? "border-[#bf524a] bg-[rgba(240,213,210,0.3)] text-[#2D2926]" : "border-[#E8DFD6] bg-white text-[#9B8E84]"
                  )}
                >
                  🤔 Estimate age
                </button>
              </div>

              <AnimatePresence mode="wait">
                {!useEstimateAge ? (
                  <motion.div key="exact-date" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
                    {/* Month + Year selects */}
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <select
                          value={birthMonth}
                          onChange={e => setBirthMonth(e.target.value)}
                          className={cn(inputClass, "appearance-none pr-8")}
                          style={{ fontSize: '16px' }}
                        >
                          <option value="">Month</option>
                          {months.map((m, i) => (
                            <option key={m} value={i.toString()}>{m}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B8E84] pointer-events-none" />
                      </div>
                      <div className="w-[100px] relative">
                        <select
                          value={birthYear}
                          onChange={e => setBirthYear(e.target.value)}
                          className={cn(inputClass, "appearance-none pr-8")}
                          style={{ fontSize: '16px' }}
                        >
                          <option value="">Year</option>
                          {years.map(y => (
                            <option key={y} value={y.toString()}>{y}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B8E84] pointer-events-none" />
                      </div>
                    </div>

                    {/* Day select - only show after month/year selected */}
                    {birthMonth !== "" && birthYear && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                        <label className={labelClass}>Day</label>
                        <div className="grid grid-cols-7 gap-1">
                          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                            <button
                              key={day}
                              onClick={() => setBirthDay(day.toString())}
                              className={cn(
                                "py-2 rounded-lg text-[0.88rem] font-[Cormorant,serif] font-semibold transition-all",
                                birthDay === day.toString()
                                  ? "bg-[#bf524a] text-white"
                                  : "bg-white border border-[#E8DFD6] text-[#2D2926] hover:border-[#c9665f]"
                              )}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div key="estimate-age" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
                    <p className="text-center text-[0.85rem] text-[#6B5E54]" style={{ fontFamily: 'Cormorant, serif' }}>
                      How old is {petName}?
                    </p>
                    <div className="flex gap-3 justify-center">
                      <div className="w-[110px] relative">
                        <select
                          value={estimateYears}
                          onChange={e => setEstimateYears(e.target.value)}
                          className={cn(inputClass, "appearance-none pr-8 text-center")}
                          style={{ fontSize: '16px' }}
                        >
                          <option value="">Years</option>
                          {Array.from({ length: 26 }, (_, i) => (
                            <option key={i} value={i.toString()}>{i} {i === 1 ? 'year' : 'years'}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B8E84] pointer-events-none" />
                      </div>
                      <div className="w-[120px] relative">
                        <select
                          value={estimateMonths}
                          onChange={e => setEstimateMonths(e.target.value)}
                          className={cn(inputClass, "appearance-none pr-8 text-center")}
                          style={{ fontSize: '16px' }}
                        >
                          <option value="">Months</option>
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i} value={i.toString()}>{i} {i === 1 ? 'month' : 'months'}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B8E84] pointer-events-none" />
                      </div>
                    </div>
                    {birthDate && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-[0.82rem] text-[#bf524a]" style={{ fontFamily: 'Cormorant, serif' }}>
                        Estimated: ~{new Date(birthDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </motion.p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Time of birth - optional */}
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

              <button onClick={() => setScreen(3)} disabled={!birthDate} className={cn(roseBtn, birthDate ? "bg-[#bf524a] hover:bg-[#c9665f]" : "bg-[#bf524a]/50 cursor-not-allowed")}>
                Continue →
              </button>
            </motion.div>
          )}

          {/* SCREEN 3: Breed + Location */}
          {screen === 3 && (
            <motion.div key="s3" variants={screenVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
              <h1 className="text-center text-[1.5rem] text-[#2D2926]" style={{ fontFamily: 'DM Serif Display, serif' }}>
                A little more about {petName}
              </h1>
              <p className="text-center text-[0.88rem] text-[#9B8E84] italic" style={{ fontFamily: 'Cormorant, serif' }}>
                {isMemorial
                  ? 'Share only what you remember — skip anything unclear.'
                  : isNew
                  ? "If you don't know these yet, skip — you'll get to know them as you go."
                  : "Both optional — skip if you're not sure."}
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
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B8E84]" />
                  <input value={location} onChange={e => setLocation(e.target.value)}
                    placeholder="Start typing a city..."
                    className={cn(inputClass, "pl-10")} aria-label="Location" style={{ fontSize: '16px' }}
                    onFocus={() => { if (location.length >= 2) setShowLocationResults(true); }}
                    onBlur={() => setTimeout(() => setShowLocationResults(false), 200)} />
                  {isSearchingLocation && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#bf524a] animate-spin" />
                  )}
                </div>
                <AnimatePresence>
                  {showLocationResults && locationResults.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                      className="absolute z-50 w-full mt-1 bg-white border border-[#E8DFD6] rounded-xl shadow-lg overflow-hidden">
                      {locationResults.map((r, i) => (
                        <button key={i} onMouseDown={e => e.preventDefault()} onClick={() => selectLocation(r)}
                          className="w-full px-4 py-3 text-left hover:bg-[rgba(240,213,210,0.2)] transition-colors border-b border-[#E8DFD6] last:border-0 text-[0.85rem] font-[Cormorant,serif] text-[#2D2926] flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#9B8E84] flex-shrink-0" />
                          {r.display_name.split(',').slice(0, 3).join(',')}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Use current location button */}
                <button
                  onClick={async () => {
                    if (!navigator.geolocation) return;
                    try {
                      const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 }));
                      const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&addressdetails=1`);
                      const data = await resp.json();
                      const city = data.address?.city || data.address?.town || data.address?.village || '';
                      const country = data.address?.country || '';
                      setLocation(city && country ? `${city}, ${country}` : city || country);
                      setShowLocationResults(false);
                    } catch { /* silently fail */ }
                  }}
                  className="flex items-center gap-1.5 mt-2 text-[0.78rem] text-[#bf524a] font-[Cormorant,serif] font-semibold hover:underline"
                >
                  📍 Use my current location
                </button>

                {/* Quick-select cities */}
                {!location && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3">
                    <p className="text-[0.7rem] text-[#9B8E84] mb-2">Or quick-select:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {quickCities.map(c => (
                        <button key={c.city} onClick={() => { setLocation(`${c.city}, ${c.country}`); setShowLocationResults(false); }}
                          className="px-3 py-1.5 rounded-full border border-[#E8DFD6] bg-white text-[0.78rem] font-[Cormorant,serif] text-[#2D2926] hover:border-[#c9665f] transition-all">
                          {c.flag} {c.city}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
                <p className={hintClass}>Affects which stars were visible — refines house placements in the chart.</p>
              </div>

              <button onClick={() => setScreen(4)} className={cn(roseBtn, "bg-[#bf524a] hover:bg-[#c9665f]")}>
                Continue →
              </button>
              <button onClick={() => setScreen(4)} className="w-full text-center text-[0.85rem] text-[#9B8E84] font-[Cormorant,serif] hover:underline mt-1">
                Skip these — keep it simple
              </button>
            </motion.div>
          )}

          {/* SCREEN 4: Make it personal */}
          {screen === 4 && (
            <motion.div key="s4" variants={screenVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
              <div className="bg-[rgba(196,162,101,0.15)] rounded-[10px] px-4 py-2 text-center">
                <span className="text-[0.78rem] text-[#c4a265] font-semibold">⭐ Makes it personal</span>
              </div>

              <h1 className="text-center text-[1.5rem] text-[#2D2926]" style={{ fontFamily: 'DM Serif Display, serif' }}>
                {isMemorial
                  ? `Help us really hold ${petName}`
                  : isNew
                  ? `First impressions of ${petName}`
                  : `Help us really see ${petName}`}
              </h1>
              <p className="text-center text-[0.88rem] text-[#6B5E54]" style={{ fontFamily: 'Cormorant, serif' }}>
                {isMemorial
                  ? `The more you share, the more the reading sounds like it was written by someone who truly knew ${petName}.`
                  : isNew
                  ? `Even a few days is enough — your earliest read on ${petName} is more accurate than you think.`
                  : `The more we know, the more the reading sounds like it was written by someone who actually knows ${petName}.`}
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
                <label className={labelClass}>{isMemorial ? 'How did they greet new people?' : isNew ? 'How are they with new people so far?' : 'How do they react to strangers?'}</label>
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

              {/* One memory — optional, powers SoulSpeak personalisation */}
              <div>
                <label className={labelClass}>
                  {isMemorial
                    ? 'One moment you want us to hold'
                    : isNew
                    ? 'The first moment that made you know'
                    : "One memory that's SO them"}{' '}
                  <span className="text-[#9B8E84] font-normal">(optional)</span>
                </label>
                <textarea
                  value={ownerMemory}
                  onChange={(e) => setOwnerMemory(e.target.value.slice(0, 500))}
                  placeholder={isMemorial
                    ? `A small moment only you'd remember — the spot ${petName || 'they'} sat, the sound ${petName || 'they'} made when you came home. Share as much or as little as you're ready to.`
                    : isNew
                    ? `The first time ${petName || 'they'} looked at you and you knew. Or the first small thing ${petName || 'they'} did that felt like them.`
                    : `The one story that makes ${petName || 'them'} ${petName || 'them'}. ${petName || 'They'} will reference it in SoulSpeak someday and you'll gasp.`}
                  rows={3}
                  className="w-full px-3 py-2 rounded-[10px] border-[1.5px] border-[#E8DFD6] bg-white text-[0.88rem] font-[Cormorant,serif] text-[#2D2926] placeholder:text-[#C2B8AE] focus:border-[#bf524a] focus:outline-none resize-none"
                  maxLength={500}
                />
                <div className="text-right text-[0.7rem] text-[#9B8E84] font-[Cormorant,serif] mt-1">{ownerMemory.length}/500</div>
              </div>

              <button onClick={() => setScreen(extraScreen ? 5 : confirmScreen)} className={cn(roseBtn, "bg-[#bf524a] hover:bg-[#c9665f]")}>
                Continue →
              </button>
              <button onClick={() => setScreen(extraScreen ? 5 : confirmScreen)} className="w-full text-center text-[0.85rem] text-[#9B8E84] font-[Cormorant,serif] hover:underline mt-1">
                {isMemorial ? 'Skip — let the stars speak for them' : isNew ? "Skip — you'll learn the rest as you go" : 'Skip — let the stars do the talking'}
              </button>
            </motion.div>
          )}

          {/* SCREEN 5: Soul Bond (premium only, skipped when owner data already shared) */}
          {showSoulBondScreen && screen === soulBondScreen && (
            <motion.div key="s-sb" variants={screenVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
                  style={{ background: 'linear-gradient(135deg, rgba(196,162,101,0.15), rgba(196,122,122,0.15))', border: '1px solid rgba(196,162,101,0.3)' }}>
                  <span className="text-[0.78rem] font-semibold" style={{ color: '#c4a265' }}>💞 Soul Bond — Premium</span>
                </div>
                <h1 className="text-[1.5rem] text-[#2D2926]" style={{ fontFamily: 'DM Serif Display, serif' }}>
                  Now let's look at your stars
                </h1>
                <p className="text-[0.88rem] text-[#6B5E54] mt-2" style={{ fontFamily: 'Cormorant, serif' }}>
                  We'll compare your natal chart with {petName}'s to reveal why you two were cosmically destined to find each other.
                </p>
              </div>

              {/* Owner name */}
              <div>
                <label className={labelClass}>Your first name</label>
                <input value={ownerName} onChange={e => setOwnerName(e.target.value)}
                  placeholder="Your name" className={inputClass} style={{ fontSize: '16px' }} />
              </div>

              {/* Owner birthday */}
              <div>
                <label className={labelClass}>Your date of birth</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <select value={ownerBirthMonth} onChange={e => setOwnerBirthMonth(e.target.value)}
                      className={cn(inputClass, "appearance-none pr-8")} style={{ fontSize: '16px' }}>
                      <option value="">Month</option>
                      {months.map((m, i) => <option key={m} value={i.toString()}>{m}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B8E84] pointer-events-none" />
                  </div>
                  <div className="w-[100px] relative">
                    <select value={ownerBirthYear} onChange={e => setOwnerBirthYear(e.target.value)}
                      className={cn(inputClass, "appearance-none pr-8")} style={{ fontSize: '16px' }}>
                      <option value="">Year</option>
                      {ownerYears.map(y => <option key={y} value={y.toString()}>{y}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B8E84] pointer-events-none" />
                  </div>
                </div>
                {ownerBirthMonth !== "" && ownerBirthYear && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3">
                    <label className={labelClass}>Day</label>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: ownerDaysInMonth }, (_, i) => i + 1).map(day => (
                        <button key={day} onClick={() => setOwnerBirthDay(day.toString())}
                          className={cn(
                            "py-2 rounded-lg text-[0.88rem] font-[Cormorant,serif] font-semibold transition-all",
                            ownerBirthDay === day.toString()
                              ? "bg-[#bf524a] text-white"
                              : "bg-white border border-[#E8DFD6] text-[#2D2926] hover:border-[#c9665f]"
                          )}>
                          {day}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Owner birth time */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className={cn(labelClass, "mb-0")}>Time of birth</label>
                  <span className="text-[0.6rem] font-bold text-[#c4a265] bg-[rgba(196,162,101,0.15)] px-2 py-[2px] rounded">OPTIONAL</span>
                </div>
                <input type="time" value={ownerBirthTime} onChange={e => setOwnerBirthTime(e.target.value)}
                  className={inputClass} style={{ fontSize: '16px' }} />
              </div>

              {/* Owner birth location */}
              <div className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <label className={cn(labelClass, "mb-0")}>Birth location</label>
                  <span className="text-[0.6rem] font-bold text-[#c4a265] bg-[rgba(196,162,101,0.15)] px-2 py-[2px] rounded">OPTIONAL</span>
                </div>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B8E84]" />
                  <input value={ownerBirthLocation} onChange={e => setOwnerBirthLocation(e.target.value)}
                    placeholder="Start typing a city..."
                    className={cn(inputClass, "pl-10")} style={{ fontSize: '16px' }}
                    onFocus={() => { if (ownerBirthLocation.length >= 2) setShowOwnerLocationResults(true); }}
                    onBlur={() => setTimeout(() => setShowOwnerLocationResults(false), 200)} />
                  {isSearchingOwnerLocation && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#bf524a] animate-spin" />
                  )}
                </div>
                <AnimatePresence>
                  {showOwnerLocationResults && ownerLocationResults.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                      className="absolute z-50 w-full mt-1 bg-white border border-[#E8DFD6] rounded-xl shadow-lg overflow-hidden">
                      {ownerLocationResults.map((r, i) => (
                        <button key={i} onMouseDown={e => e.preventDefault()} onClick={() => selectOwnerLocation(r)}
                          className="w-full px-4 py-3 text-left hover:bg-[rgba(240,213,210,0.2)] transition-colors border-b border-[#E8DFD6] last:border-0 text-[0.85rem] font-[Cormorant,serif] text-[#2D2926] flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#9B8E84] flex-shrink-0" />
                          {r.display_name.split(',').slice(0, 3).join(',')}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button onClick={() => setScreen(confirmScreen)}
                disabled={!ownerName.trim() || !ownerBirthDate}
                className={cn(roseBtn, ownerName.trim() && ownerBirthDate ? "bg-[#bf524a] hover:bg-[#c9665f]" : "bg-[#bf524a]/50 cursor-not-allowed")}>
                Continue →
              </button>
            </motion.div>
          )}

          {/* SCREEN 5 (memorial-only): grief anchors. The worker's memorial
              prompt reads passed_date + favorite_memory + remembered_by from
              pet_reports to ground each section in what *this* pet was.
              Without them every memorial reading becomes generic grief prose. */}
          {showMemorialScreen && screen === memorialScreen && (
            <motion.div key="s-mem" variants={screenVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
              <div className="text-center">
                <h1 className="text-[1.5rem] text-[#2D2926]" style={{ fontFamily: 'DM Serif Display, serif' }}>
                  A few last, gentle details
                </h1>
                <p className="text-[0.92rem] text-[#6B5E54] italic mt-2" style={{ fontFamily: 'Cormorant, serif' }}>
                  Only share what you're ready to. Each of these shapes how we write about {petName || 'them'} specifically.
                </p>
              </div>

              {/* Field 1: when they passed */}
              <div>
                <label className={labelClass}>When did {petName || 'they'} pass? <span className="text-[#9B8E84] normal-case tracking-normal font-normal">(optional — for gentle anniversary remembrances)</span></label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <select value={passedMonth} onChange={e => setPassedMonth(e.target.value)}
                      className={cn(inputClass, "appearance-none pr-8")} style={{ fontSize: '16px' }}>
                      <option value="">Month</option>
                      {months.map((m, i) => <option key={m} value={i.toString()}>{m}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B8E84] pointer-events-none" />
                  </div>
                  <div className="w-[100px] relative">
                    <select value={passedYear} onChange={e => setPassedYear(e.target.value)}
                      className={cn(inputClass, "appearance-none pr-8")} style={{ fontSize: '16px' }}>
                      <option value="">Year</option>
                      {years.map(y => <option key={y} value={y.toString()}>{y}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B8E84] pointer-events-none" />
                  </div>
                </div>
                {passedMonth !== "" && passedYear && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3">
                    <label className={labelClass}>Day</label>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: passedDaysInMonth }, (_, i) => i + 1).map(day => (
                        <button key={day} onClick={() => setPassedDay(day.toString())}
                          className={cn(
                            "py-2 rounded-lg text-[0.88rem] font-[Cormorant,serif] font-semibold transition-all",
                            passedDay === day.toString()
                              ? "bg-[#bf524a] text-white"
                              : "bg-white border border-[#E8DFD6] text-[#2D2926] hover:border-[#c9665f]"
                          )}>
                          {day}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Field 2: favorite memory */}
              <div>
                <label className={labelClass}>Is there one moment you want us to hold? <span className="text-[#9B8E84] normal-case tracking-normal font-normal">(optional)</span></label>
                <p className="text-[0.78rem] text-[#9B8E84] font-[Cormorant,serif] mb-2">
                  A small moment only you'd remember — where {petName || 'they'} sat, a sound {petName || 'they'} made, a tiny ritual you shared.
                </p>
                <textarea
                  value={favoriteMemory}
                  onChange={e => setFavoriteMemory(e.target.value.slice(0, 500))}
                  placeholder="A quiet moment, a small ritual, the way they looked at you…"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border-[1.5px] border-[#E8DFD6] bg-white text-[0.95rem] font-[Cormorant,serif] text-[#2D2926] placeholder:text-[#C2B8AE] focus:border-[#bf524a] focus:outline-none resize-none"
                  style={{ fontSize: '16px' }}
                  maxLength={500}
                />
                <div className="text-right text-[0.7rem] text-[#9B8E84] font-[Cormorant,serif] mt-1">{favoriteMemory.length}/500</div>
              </div>

              {/* Field 3: one-word essence */}
              <div>
                <label className={labelClass}>If you had one word to capture {petName || 'them'}, what would it be? <span className="text-[#9B8E84] normal-case tracking-normal font-normal">(optional)</span></label>
                <p className="text-[0.78rem] text-[#9B8E84] font-[Cormorant,serif] mb-2">
                  Their essence. "Golden light." "Gentle." "Mischief." Skip if nothing fits.
                </p>
                <input
                  value={rememberedBy}
                  onChange={e => setRememberedBy(e.target.value.slice(0, 80))}
                  placeholder="One word, or a short phrase"
                  className={inputClass}
                  style={{ fontSize: '16px' }}
                  maxLength={80}
                />
              </div>

              <button onClick={() => setScreen(confirmScreen)}
                className={cn(roseBtn, "bg-[#bf524a] hover:bg-[#c9665f]")}>
                Continue →
              </button>
              <button onClick={() => setScreen(confirmScreen)}
                className="w-full text-center text-[0.85rem] text-[#9B8E84] font-[Cormorant,serif] hover:underline mt-1">
                Skip for now — the stars will hold {petName || 'them'} regardless
              </button>
            </motion.div>
          )}

          {/* CONFIRMATION SCREEN */}
          {screen === confirmScreen && (
            <motion.div key="s5" variants={screenVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
              <h1 className="text-center text-[1.5rem] text-[#2D2926]" style={{ fontFamily: 'DM Serif Display, serif' }}>
                {isMemorial
                  ? `Ready to hold ${petName}'s stars`
                  : isNew
                  ? `Ready to welcome ${petName}'s stars`
                  : `Ready to read ${petName}'s stars`}
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
                  {isMemorial ? `📸 Share a treasured photo of ${petName}` : `📸 Upload ${petName}'s photo`}
                </p>
                <p className="text-[0.78rem] text-[#9B8E84] font-[Cormorant,serif] mb-3">
                  {isMemorial
                    ? `We'll hold ${pronouns.possessive} photo through the reading and SoulSpeak — so you can see ${pronouns.object} again, quietly.`
                    : `We'll weave ${pronouns.possessive} photo through the reveal and SoulSpeak — it brings everything to life.`}
                </p>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="hidden"
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
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={e => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                    onDragOver={e => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                    onDragLeave={e => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                    onDrop={e => {
                      e.preventDefault(); e.stopPropagation(); setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handlePhotoUpload(file);
                    }}
                    className={cn(
                      "w-full h-[120px] border-2 border-dashed rounded-[14px] flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer",
                      isDragging ? "border-[#bf524a] bg-[rgba(240,213,210,0.2)]" : "border-[#E8DFD6] hover:border-[#c9665f]",
                      isUploading && "pointer-events-none opacity-60"
                    )}
                  >
                    {isUploading ? (
                      <span className="text-[0.82rem] text-[#9B8E84]">Uploading...</span>
                    ) : (
                      <>
                        <Camera className="w-5 h-5 text-[#9B8E84]" />
                        <span className="text-[0.82rem] text-[#9B8E84] font-[Cormorant,serif]">
                          {isDragging ? 'Drop photo here' : 'Tap or drag photo here'}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Email — either fresh entry or confirmed from previous pet in flow */}
              {hasSharedEmail ? (
                <div>
                  <label className={labelClass}>Your email</label>
                  <div className="flex items-center justify-between rounded-xl px-4 py-3 bg-[rgba(196,162,101,0.08)] border border-[rgba(196,162,101,0.35)]">
                    <span className="text-[0.95rem] text-[#2D2926]" style={{ fontFamily: 'Cormorant, serif' }}>
                      {email}
                    </span>
                    <span className="text-[0.62rem] uppercase tracking-wider font-semibold" style={{ color: '#a07c3a', fontFamily: 'Cormorant, serif' }}>
                      ✓ Saved
                    </span>
                  </div>
                  <p className={hintClass}>
                    We'll keep all of {isMultiPet ? 'your pets\'' : petName + '\'s'} readings under this email so you can find them again.
                  </p>
                </div>
              ) : (
                <div>
                  <label className={labelClass}>Your email</label>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    inputMode="email"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className={inputClass}
                    aria-label="Email address"
                    style={{ fontSize: '16px' }}
                  />
                  <p className={hintClass}>
                    So you can revisit {petName}'s reading anytime. The stars reveal themselves here — no email waiting required.
                  </p>
                </div>
              )}

              {/* CTA */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !email.trim().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)}
                className={cn(
                  "w-full py-4 rounded-xl text-white text-[1.05rem] transition-all",
                  email.trim().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) && !isSubmitting
                    ? "bg-[#bf524a] hover:bg-[#c9665f]"
                    : "bg-[#bf524a]/50 cursor-not-allowed"
                )}
                style={{ fontFamily: 'DM Serif Display, serif' }}
              >
                {isSubmitting
                  ? (isMemorial ? 'Holding...' : isNew ? 'Welcoming...' : 'Creating...')
                  : (submitLabel
                      ? submitLabel(petName)
                      : (isMemorial
                          ? `Hold ${petName} in Their Reading →`
                          : isNew
                          ? `Welcome ${petName} with Their Reading →`
                          : `Create ${petName}'s Soul Reading →`))}
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
