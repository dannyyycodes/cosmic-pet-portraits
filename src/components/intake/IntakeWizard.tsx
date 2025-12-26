import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { IntakeStepPetCount } from './IntakeStepPetCount';
import { IntakeStepPetOccasion } from './IntakeStepPetOccasion';
import { IntakeStepName } from './IntakeStepName';
import { IntakeStepSpecies } from './IntakeStepSpecies';
import { IntakeStepBreed } from './IntakeStepBreed';
import { IntakeStepGender } from './IntakeStepGender';
import { IntakeStepDOB } from './IntakeStepDOB';
import { IntakeStepLocation } from './IntakeStepLocation';
import { IntakeStepSoul } from './IntakeStepSoul';
import { IntakeStepSuperpower } from './IntakeStepSuperpower';
import { IntakeStepStrangers } from './IntakeStepStrangers';
import { IntakeStepOwnerDetails } from './IntakeStepOwnerDetails';
import { IntakeStepEmail } from './IntakeStepEmail';
import { IntakeStepEmailEarly } from './IntakeStepEmailEarly';
import { IntakeStepPhoto } from './IntakeStepPhoto';
import { IntakeStepPortraitSelect } from './IntakeStepPortraitSelect';
import { CosmicLoading } from './CosmicLoading';

import { MultiPetMiniReport } from './MultiPetMiniReport';
import { GiftWelcome } from './GiftWelcome';
import { DevPanel } from './DevPanel';
import { OccasionMode, occasionModeContent } from '@/lib/occasionMode';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { StarfieldBackground } from '@/components/cosmic/StarfieldBackground';
import { CosmicProgress } from '@/components/cosmic/CosmicProgress';
import { EmotionProvider, useEmotion } from '@/contexts/EmotionContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { CheckoutData } from './CheckoutPanel';
import { saveIntakeProgress, loadIntakeProgress, clearIntakeProgress, saveOwnerData, loadOwnerData, OwnerData } from '@/lib/intakeStorage';
import { getReferralCode } from '@/lib/referralTracking';

export type PetSpecies = 'dog' | 'cat' | 'rabbit' | 'hamster' | 'guinea_pig' | 'bird' | 'fish' | 'reptile' | 'horse' | 'other' | '';
export type PetGender = 'boy' | 'girl' | '';

export interface PetData {
  name: string;
  species: PetSpecies;
  breed: string;
  gender: PetGender;
  dateOfBirth: Date | null;
  timeOfBirth: string;
  location: string;
  soulType: string;
  superpower: string;
  strangerReaction: string;
  email: string;
  occasionMode: OccasionMode;
  photoUrl?: string | null;
}

export interface CosmicReport {
  sunSign: string;
  archetype: string;
  element: string;
  modality: string;
  nameVibration: number;
  coreEssence: string;
  soulMission: string;
  hiddenGift: string;
  loveLanguage: string;
  cosmicAdvice: string;
}

interface IntakeWizardProps {
  mode: OccasionMode;
}

const createEmptyPetData = (mode: OccasionMode): PetData => ({
  name: '',
  species: '',
  breed: '',
  gender: '',
  dateOfBirth: null,
  timeOfBirth: '',
  location: '',
  soulType: '',
  superpower: '',
  strangerReaction: '',
  email: '',
  occasionMode: mode,
  photoUrl: null,
});

// Wrapper component with EmotionProvider
export function IntakeWizard({ mode }: IntakeWizardProps) {
  return (
    <EmotionProvider>
      <IntakeWizardContent mode={mode} />
    </EmotionProvider>
  );
}

function IntakeWizardContent({ mode }: IntakeWizardProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const isDevMode = searchParams.get('dev') === 'true';
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isPreviewHost =
    hostname === 'localhost' ||
    hostname.endsWith('lovableproject.com') ||
    hostname.endsWith('lovable.app');
  const isTestMode = isDevMode || isPreviewHost;
  const isGiftFlow = Boolean(searchParams.get('gift'));

  const toggleDevMode = () => {
    const next = new URLSearchParams(searchParams);
    if (isDevMode) {
      next.delete('dev');
    } else {
      next.set('dev', 'true');
    }
    setSearchParams(next, { replace: true });
  };
  const [step, setStep] = useState(0);
  const [occasionMode, setOccasionMode] = useState<OccasionMode>(mode);
  const [petCount, setPetCount] = useState(1);
  const [currentPetIndex, setCurrentPetIndex] = useState(0);
  const [petsData, setPetsData] = useState<PetData[]>([createEmptyPetData(mode)]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [cosmicReport, setCosmicReport] = useState<CosmicReport | null>(null);
  const [hasRestoredProgress, setHasRestoredProgress] = useState(false);
  const [giftCodeFromUrl, setGiftCodeFromUrl] = useState<string | null>(null);
  const [showGiftWelcome, setShowGiftWelcome] = useState(false);
  const [giftData, setGiftData] = useState<{ 
    amountCents: number; 
    giftMessage?: string;
    recipientName?: string;
    giftedTier?: 'essential' | 'portrait' | 'vip' | 'basic' | 'premium';
    petCount?: number;
    includesPortrait?: boolean;
    includesWeeklyHoroscope?: boolean;
    giftPets?: { id: string; tier: string }[]; // Per-pet tier info
    portraitPetIndices?: number[]; // Which pet indices get portraits
  } | null>(null);
  const [portraitPetIndex, setPortraitPetIndex] = useState<number | null>(null); // Which pet user selected for portrait
  const [ownerData, setOwnerData] = useState<OwnerData>(() => loadOwnerData() || {
    name: '',
    birthDate: '',
    birthTime: '',
    birthLocation: '',
  });
  const stepStartTime = useRef<number>(Date.now());
  const { trackAction, intensity } = useEmotion();
  const { t, language } = useLanguage();
  const { user } = useAuth();

  // Check for gift code in URL
  useEffect(() => {
    const giftCode = searchParams.get('gift');
    const giftPetCount = parseInt(searchParams.get('pets') || '1', 10);
    
    if (giftCode) {
      setGiftCodeFromUrl(giftCode);
      // Skip the GiftWelcome screen since user already saw it on RedeemGift page
      // Go straight to pet name entry
      setShowGiftWelcome(false);
      
      // Validate the gift code
      supabase.functions.invoke('validate-gift-code', {
        body: { code: giftCode.toUpperCase() },
      }).then(({ data, error }) => {
        if (!error && data?.valid) {
          const petCount = data.petCount || giftPetCount || 1;
          
          setGiftData({
            amountCents: data.amountCents,
            giftMessage: data.giftMessage,
            recipientName: data.recipientName,
            giftedTier: data.giftTier || data.giftedTier,
            petCount,
            includesPortrait: data.includesPortrait,
            includesWeeklyHoroscope: data.includesWeeklyHoroscope,
            giftPets: data.giftPets || null,
            portraitPetIndices: data.portraitPetIndices || [],
          });
          
          // Set pet count from gift certificate
          setPetCount(petCount);
          // Set occasion mode to 'discover' for gift recipients (they're discovering their pet's reading)
          setOccasionMode('discover');
          // Initialize petsData array with correct number of pets
          const newPetsData = Array(petCount).fill(null).map(() => createEmptyPetData('discover'));
          setPetsData(newPetsData);
          // Skip directly to name step (step 2), bypassing pet count and occasion selection
          setStep(2);
        } else {
          toast.error(data?.error || 'Invalid gift code');
          // Redirect back to redeem page on error
          window.location.href = '/redeem';
        }
      });
    }
  }, [searchParams]);

  // Get mode content for current pet (each pet can have different occasion)
  const currentPetMode = petsData[currentPetIndex]?.occasionMode || occasionMode;
  const modeContent = occasionModeContent[currentPetMode];

  // Restore saved progress on mount - but always start with occasion step for fresh visits
  // Also handle checkout=true from Stripe cancel redirect
  useEffect(() => {
    if (hasRestoredProgress) return;

    // Gift redemptions should always start fresh (saved progress can break the multi-pet gift flow)
    if (isGiftFlow) {
      clearIntakeProgress();
      setHasRestoredProgress(true);
      return;
    }

    const isCheckoutReturn = searchParams.get('checkout') === 'true';
    const saved = loadIntakeProgress();

    // Only restore if there's saved progress
    if (saved && saved.petsData.length > 0 && saved.step > 0) {
      // Convert date strings back to Date objects
      const restoredPets = saved.petsData.map((pet) => ({
        ...pet,
        dateOfBirth: pet.dateOfBirth ? new Date(pet.dateOfBirth) : null,
      }));

      setPetsData(restoredPets);
      setCurrentPetIndex(saved.currentPetIndex);
      setStep(saved.step);
      setPetCount(saved.petCount);
      setOccasionMode(saved.petsData[0]?.occasionMode || mode);

      // If returning from Stripe checkout, go directly to results/checkout view
      if (isCheckoutReturn) {
        setShowResults(true);
        // Clean up the URL
        const next = new URLSearchParams(searchParams);
        next.delete('checkout');
        setSearchParams(next, { replace: true });
      } else {
        toast.success('Welcome back! Your progress has been restored.');
      }
    }

    setHasRestoredProgress(true);
  }, [hasRestoredProgress, isGiftFlow, mode, searchParams, setSearchParams]);

  // Save progress whenever state changes
  useEffect(() => {
    if (!hasRestoredProgress) return;
    if (step === 0 && petsData[0].name === '') return; // Don't save if nothing entered
    
    saveIntakeProgress({
      petsData,
      currentPetIndex,
      step,
      petCount,
      savedAt: Date.now(),
    });
  }, [petsData, currentPetIndex, step, petCount, hasRestoredProgress]);

  // Steps: 0=pet count, 1=pet occasion, 2=name, 3=species, 4=breed, 5=gender, 6=dob, 7=location, 8=soul, 9=superpower, 10=strangers (per pet)
  // Then ONCE: 11=owner details (optional), 12=email, 13=checkout
  const stepsPerPet = 10; // occasion + 9 data steps (NOT including email)
  const totalSteps = 1 + (petCount * stepsPerPet) + 3; // pet count + pet steps + owner + email + checkout

  // Calculate current global step for progress
  const getGlobalStep = () => {
    if (step === 0) return 0; // Pet count
    if (step === 11) return 1 + (petCount * stepsPerPet); // Owner details step
    if (step === 12) return 1 + (petCount * stepsPerPet) + 1; // Email step
    if (step === 13) return 1 + (petCount * stepsPerPet) + 2; // Checkout step
    // Pet data steps (1-10 per pet)
    return 1 + (currentPetIndex * stepsPerPet) + (step - 1);
  };

  // Track step timing and scroll to top on step change
  useEffect(() => {
    trackAction({ type: 'step_start' });
    stepStartTime.current = Date.now();
    // Scroll to top on every step change, especially important for mobile on checkout step
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, currentPetIndex, trackAction]);

  // Handle per-pet occasion selection
  const handlePetOccasionSelect = (newMode: OccasionMode) => {
    updatePetData({ occasionMode: newMode });
    goToStep(2); // Go to name step
  };

  // Update pet count and initialize pet data array
  const handlePetCountChange = (count: number) => {
    setPetCount(count);
    const newPetsData = Array(count).fill(null).map((_, i) => 
      petsData[i] || createEmptyPetData(occasionMode)
    );
    setPetsData(newPetsData);
  };

  const currentPetData = petsData[currentPetIndex];

  // Defensive: ensure multi-pet arrays are always the right length (prevents "blank" screens)
  useEffect(() => {
    if (currentPetIndex >= petCount) {
      setCurrentPetIndex(Math.max(0, petCount - 1));
      return;
    }

    if (!petsData[currentPetIndex] || petsData.length < petCount) {
      setPetsData((prev) => {
        const next = [...prev];

        while (next.length < petCount) {
          next.push(createEmptyPetData(isGiftFlow ? 'discover' : occasionMode));
        }

        if (!next[currentPetIndex]) {
          next[currentPetIndex] = createEmptyPetData(isGiftFlow ? 'discover' : occasionMode);
        }

        return next;
      });
    }
  }, [currentPetIndex, petCount, petsData, isGiftFlow, occasionMode]);

  const updatePetData = (data: Partial<PetData>) => {
    setPetsData(prev => prev.map((pet, i) => 
      i === currentPetIndex ? { ...pet, ...data } : pet
    ));
    if ('name' in data && data.name) {
      trackAction({ type: 'input_change', length: data.name.length });
    }
  };

  const goToStep = (nextStep: number) => {
    const timeSpent = Date.now() - stepStartTime.current;
    trackAction({ type: 'step_complete', timeSpent });
    setStep(nextStep);
  };

  const handleBack = () => {
    trackAction({ type: 'back_pressed' });
    
    // If on step 1 (per-pet occasion) and not the first pet, go to previous pet's last step
    if (step === 1 && currentPetIndex > 0) {
      setCurrentPetIndex(currentPetIndex - 1);
      setStep(10); // Last per-pet step (strangers)
    } else if (step === 1 && currentPetIndex === 0) {
      setStep(0); // Go back to pet count selection
    } else if (step === 11) {
      // Going back from owner details step - go to last pet's strangers step
      setCurrentPetIndex(petCount - 1);
      setStep(10);
    } else if (step === 12) {
      // Going back from email step - go to owner details
      setStep(11);
    } else if (step > 1) {
      setStep(step - 1); // Go to previous step
    }
  };

  // Called after completing step 10 (strangers) for each pet
  const handleNextPetOrOwnerDetails = () => {
    if (currentPetIndex < petCount - 1) {
      const nextIndex = currentPetIndex + 1;

      // Ensure the next pet slot exists before rendering its steps
      setPetsData((prev) => {
        if (prev[nextIndex]) return prev;
        const next = [...prev];
        while (next.length <= nextIndex) {
          next.push(createEmptyPetData(isGiftFlow ? 'discover' : occasionMode));
        }
        return next;
      });

      setCurrentPetIndex(nextIndex);
      // Gift flow skips per-pet occasion selection
      setStep(isGiftFlow ? 2 : 1);
    } else {
      // All pets done, go to owner details step
      setStep(11);
    }
  };

  // Handle owner data updates - maps from component props to OwnerData interface
  const handleOwnerDataUpdate = (data: { ownerName?: string; ownerBirthDate?: string; ownerBirthTime?: string; ownerBirthLocation?: string; }) => {
    setOwnerData(prev => {
      const updated = { 
        ...prev, 
        ...(data.ownerName !== undefined && { name: data.ownerName }),
        ...(data.ownerBirthDate !== undefined && { birthDate: data.ownerBirthDate }),
        ...(data.ownerBirthTime !== undefined && { birthTime: data.ownerBirthTime }),
        ...(data.ownerBirthLocation !== undefined && { birthLocation: data.ownerBirthLocation }),
      };
      saveOwnerData(updated);
      return updated;
    });
  };

  // Validate all required fields before submission
  const validatePetData = (pet: PetData): string | null => {
    const trimmedName = pet.name.trim();
    if (!trimmedName) return 'Pet name is required';
    if (trimmedName.length > 50) return 'Pet name is too long';
    // Allow letters, numbers, spaces, hyphens, apostrophes, and unicode characters
    if (!/^[\p{L}\p{N}\s\-'\.]+$/u.test(trimmedName)) return 'Pet name contains invalid characters';
    if (!pet.species) return 'Species is required';
    if (!pet.gender || (pet.gender !== 'boy' && pet.gender !== 'girl')) return 'Gender is required';
    if (!pet.dateOfBirth) return 'Date of birth is required';
    return null;
  };

  const handleReveal = async (checkoutData?: CheckoutData) => {
    setIsLoading(true);
    
    try {
      // Validate all pets before proceeding
      for (let i = 0; i < petsData.length; i++) {
        const validationError = validatePetData(petsData[i]);
        if (validationError) {
          toast.error(`Pet ${i + 1}: ${validationError}`);
          setIsLoading(false);
          return;
        }
      }

      // Save all pets to database
      const email = petsData[0].email.trim(); // Trim to prevent Stripe email errors
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast.error('Please enter a valid email address');
        setIsLoading(false);
        return;
      }

      // Prepare pet data for the edge function (include owner data for compatibility)
      const petsPayload = petsData.map(pet => ({
        email: email,
        pet_name: pet.name.trim().slice(0, 50),
        species: pet.species,
        breed: (pet.breed || '').trim().slice(0, 100) || null,
        gender: pet.gender || null,
        birth_date: pet.dateOfBirth?.toISOString().split('T')[0] || null,
        birth_time: pet.timeOfBirth || null, // Pass birth time for accurate Moon/Ascendant
        birth_location: (pet.location || '').trim().slice(0, 100) || null,
        soul_type: (pet.soulType || '').trim().slice(0, 50) || null,
        superpower: (pet.superpower || '').trim().slice(0, 50) || null,
        stranger_reaction: (pet.strangerReaction || '').trim().slice(0, 50) || null,
        occasion_mode: pet.occasionMode || null,
        language: language,
        // Owner data for compatibility (optional)
        owner_name: ownerData.name?.trim().slice(0, 50) || null,
        owner_birth_date: ownerData.birthDate || null,
        owner_birth_time: ownerData.birthTime || null,
        owner_birth_location: ownerData.birthLocation?.trim().slice(0, 100) || null,
      }));

      console.log('[INTAKE] Creating reports via edge function for', petsPayload.length, 'pets');
      
      const { data: intakeResult, error: intakeError } = await supabase.functions.invoke(
        'create-intake-report',
        { body: { pets: petsPayload } }
      );

      if (intakeError || !intakeResult?.reportIds) {
        console.error('[INTAKE] Edge function error:', intakeError || intakeResult);
        toast.error('Failed to save pet data. Please try again.');
        setIsLoading(false);
        return;
      }

      const reportIds: string[] = intakeResult.reportIds;
      console.log('[INTAKE] Reports created:', reportIds);

      const primaryReportId = reportIds[0];
      const primaryPetData = petsData[0];

      // GIFT REDEMPTION: If a gift code is present and validated, skip checkout entirely
      if (giftCodeFromUrl && giftData) {
        console.log('[INTAKE] Gift code detected, redeeming:', giftCodeFromUrl, 'for', reportIds.length, 'pets');
        
        // Build petPhotoUrls map for multi-pet gifts
        const petPhotoUrls: Record<string, string> = {};
        petsData.forEach((pet, i) => {
          if (pet.photoUrl && reportIds[i]) {
            petPhotoUrls[reportIds[i]] = pet.photoUrl;
          }
        });
        
        const { data: redeemResult, error: redeemError } = await supabase.functions.invoke(
          'redeem-gift',
          {
            body: {
              giftCode: giftCodeFromUrl.toUpperCase(),
              reportId: primaryReportId, // For backwards compat
              reportIds: reportIds, // All report IDs for multi-pet gifts
              petPhotoUrl: primaryPetData.photoUrl || undefined, // For backwards compat
              petPhotoUrls: Object.keys(petPhotoUrls).length > 0 ? petPhotoUrls : undefined,
            },
          }
        );

        if (redeemError || !redeemResult?.success) {
          console.error('[INTAKE] Gift redemption error:', redeemError || redeemResult?.error);
          toast.error(redeemResult?.error || 'Failed to redeem gift. Please try again.');
          setIsLoading(false);
          return;
        }

        console.log('[INTAKE] Gift redeemed successfully:', redeemResult);
        clearIntakeProgress();
        toast.success(`🎁 Gift redeemed! Generating ${reportIds.length > 1 ? `${reportIds.length} cosmic reports` : 'your cosmic report'}...`);
        
        // Redirect to payment success which will generate the report(s)
        // Include gift info so the success page shows appropriate upsells
        const giftParams = new URLSearchParams({
          session_id: `gift_${giftCodeFromUrl}`,
          report_id: primaryReportId,
          gifted: 'true',
          gifted_tier: redeemResult.giftedTier || 'basic',
          includes_portrait: redeemResult.includesPortrait ? 'true' : 'false',
        });
        
        // Add all report IDs for multi-pet flow
        if (reportIds.length > 1) {
          giftParams.set('report_ids', reportIds.join(','));
        }
        
        window.location.href = `/payment-success?${giftParams.toString()}`;
        return;
      }

      // TEST MODE: Skip Stripe checkout for preview/dev
      if (isTestMode) {
        console.log('[TEST MODE] Skipping Stripe checkout, redirecting to success page');
        clearIntakeProgress();
        toast.success('Test mode: Skipping payment');
        
        // Build URL params with checkout options for dev mode
        const devParams = new URLSearchParams({
          session_id: `dev_test_${Date.now()}`,
          report_id: primaryReportId,
        });
        
        // Pass checkout options through URL for dev mode
        if (checkoutData?.includeGiftForFriend) {
          devParams.set('include_gift', 'true');
        }
        if (checkoutData?.includeHoroscope || checkoutData?.selectedTier === 'vip') {
          devParams.set('include_horoscope', 'true');
        }
        if (checkoutData?.selectedTier) {
          devParams.set('selected_tier', checkoutData.selectedTier);
        }
        if (checkoutData?.includesPortrait) {
          devParams.set('includes_portrait', 'true');
        }
        
        // Store petPhotos and petTiers in sessionStorage for dev mode (too big for URL)
        if (checkoutData?.petPhotos && Object.keys(checkoutData.petPhotos).length > 0) {
          try {
            sessionStorage.setItem('dev_checkout_petPhotos', JSON.stringify(checkoutData.petPhotos));
          } catch (e) {
            console.warn('Could not store petPhotos in sessionStorage:', e);
          }
        }
        if (checkoutData?.petTiers && Object.keys(checkoutData.petTiers).length > 0) {
          try {
            sessionStorage.setItem('dev_checkout_petTiers', JSON.stringify(checkoutData.petTiers));
          } catch (e) {
            console.warn('Could not store petTiers in sessionStorage:', e);
          }
        }
        
        window.location.href = `/payment-success?${devParams.toString()}`;
        return;
      }

      // Create checkout with volume discount
      if (checkoutData) {
        // Photo URL is passed to checkout and saved via edge function
        // No need to save directly here - it goes through create-checkout

        // Get referral code if present
        const referralCode = getReferralCode();
        
        const { data: checkoutResult, error: checkoutError } = await supabase.functions.invoke(
          'create-checkout',
          {
            body: {
              reportIds, // Array of report IDs
              petCount,
              selectedTier: checkoutData.selectedTier || 'basic',
              selectedProducts: checkoutData.selectedProducts,
              couponId: checkoutData.couponId,
              giftCertificateId: checkoutData.giftCertificateId,
              isGift: checkoutData.isGift,
              recipientName: checkoutData.recipientName,
              recipientEmail: checkoutData.recipientEmail,
              giftMessage: checkoutData.giftMessage,
              includeGiftForFriend: checkoutData.includeGiftForFriend || false,
              giftTierForFriend: checkoutData.giftTierForFriend || 'basic',
              referralCode: referralCode || undefined, // Pass referral code to checkout
              includeHoroscope: checkoutData.includeHoroscope || false, // Weekly horoscope add-on
              includesPortrait: checkoutData.includesPortrait || false,
              petPhotoUrl: checkoutData.petPhotoUrl || undefined, // Pass photo URL for portrait generation
              petTiers: checkoutData.petTiers || {}, // Per-pet tier selection
              petPhotos: checkoutData.petPhotos || {}, // Per-pet photo URLs
              petHoroscopes: checkoutData.petHoroscopes || {}, // Per-pet horoscope subscriptions
            },
          }
        );

        if (checkoutError) {
          console.error('[INTAKE] Checkout error:', checkoutError);
          toast.error(`Checkout failed: ${checkoutError.message || 'Unknown error'}`);
          throw new Error('Failed to create checkout session');
        }

        console.log('[INTAKE] Checkout result:', checkoutResult);
        
        if (checkoutResult?.url) {
          console.log('[INTAKE] Redirecting to Stripe checkout:', checkoutResult.url);
          // Clear saved progress before checkout
          clearIntakeProgress();
          window.location.href = checkoutResult.url;
          return;
        } else {
          console.error('[INTAKE] No checkout URL returned');
          toast.error('Failed to get checkout URL');
        }
      }

      setIsLoading(false);
      setShowResults(true);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  if (showResults) {
    return <MultiPetMiniReport petsData={petsData} />;
  }

  if (isLoading) {
    const currentPetName = petsData[currentPetIndex]?.name || 'your pet';
    return (
      <>
        <StarfieldBackground intensity="excited" />
        <CosmicLoading petName={currentPetName} />
      </>
    );
  }

  const handleStartFresh = () => {
    clearIntakeProgress();
    setPetsData([createEmptyPetData(mode)]);
    setCurrentPetIndex(0);
    setPetCount(1);
    setOccasionMode(mode);
    setStep(0);
    toast.success('Starting fresh! Create a new reading.');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 pt-14 relative overflow-hidden">
      <StarfieldBackground intensity={intensity} interactive />
      
      

      
      <div className="w-full max-w-xl relative z-10">
        {/* Start Again (moved into the questionnaire card area so it's always visible) */}
        {step > 0 && (
          <div className="flex justify-end mb-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium bg-card/70 text-muted-foreground border border-border/50 hover:bg-card hover:text-foreground transition-colors"
                  title="Start over with a new pet"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Start Again
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle>Start a new reading?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will clear all your current progress and pet information. You'll need to enter everything again from the beginning.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-muted hover:bg-muted/80">Keep Going</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleStartFresh}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, Start Over
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {/* Progress bar - only show after occasion selection */}
        {step > 0 && (
          <CosmicProgress current={getGlobalStep()} total={totalSteps} />
        )}

        {/* Pet indicator for multi-pet flow - only during per-pet steps (1-10) */}
        {step >= 1 && step <= 10 && petCount > 1 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-4"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium">
              🐾 Pet {currentPetIndex + 1} of {petCount}
              {currentPetData?.name && `: ${currentPetData.name}`}
              {currentPetData?.occasionMode && step > 1 && (
                <span className="opacity-70">
                  ({currentPetData.occasionMode === 'discover' ? '🔮' : currentPetData.occasionMode === 'birthday' ? '🎂' : currentPetData.occasionMode === 'memorial' ? '🌈' : '🎁'})
                </span>
              )}
            </span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* Gift Welcome Screen - shown before everything else for gift recipients */}
          {showGiftWelcome && giftData && (
            <motion.div key="gift-welcome" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <GiftWelcome
                recipientName={giftData.recipientName}
                giftMessage={giftData.giftMessage}
                giftedTier={giftData.giftedTier || 'basic'}
                includesPortrait={giftData.includesPortrait}
                onContinue={() => {
                  setShowGiftWelcome(false);
                  setOccasionMode('gift');
                  setPetsData(prev => prev.map(pet => ({ ...pet, occasionMode: 'gift' })));
                  // Skip to name step (step 2), bypassing occasion and pet count
                  setStep(2);
                }}
              />
            </motion.div>
          )}

          {!showGiftWelcome && step === 0 && !giftCodeFromUrl && (
            <motion.div key="step-petcount" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepPetCount 
                petCount={petCount} 
                onUpdate={handlePetCountChange} 
                onNext={() => goToStep(1)}
                showRestart={petsData[0]?.name !== ''}
                onRestart={() => {
                  setPetsData([createEmptyPetData(mode)]);
                  setPetCount(1);
                  setCurrentPetIndex(0);
                  setStep(0);
                }}
              />
            </motion.div>
          )}

          {!showGiftWelcome && step === 1 && !giftCodeFromUrl && (
            <motion.div key={`step-occasion-pet${currentPetIndex}`} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepPetOccasion 
                petName={currentPetData?.name}
                petNumber={petCount > 1 ? currentPetIndex + 1 : undefined}
                selectedMode={currentPetData?.occasionMode || 'discover'}
                onSelect={handlePetOccasionSelect}
                onBack={handleBack}
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key={`step2-pet${currentPetIndex}`} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepName 
                petData={currentPetData} 
                onUpdate={updatePetData} 
                onNext={() => goToStep(3)} 
                totalSteps={stepsPerPet} 
                modeContent={modeContent}
                petNumber={petCount > 1 ? currentPetIndex + 1 : undefined}
                onBack={handleBack}
              />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key={`step3-pet${currentPetIndex}`} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepSpecies petData={currentPetData} onUpdate={updatePetData} onNext={() => goToStep(4)} onBack={handleBack} totalSteps={stepsPerPet} modeContent={modeContent} />
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key={`step4-pet${currentPetIndex}`} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepBreed petData={currentPetData} onUpdate={updatePetData} onNext={() => goToStep(5)} onBack={handleBack} totalSteps={stepsPerPet} modeContent={modeContent} />
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key={`step5-pet${currentPetIndex}`} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepGender petData={currentPetData} onUpdate={updatePetData} onNext={() => goToStep(6)} onBack={handleBack} totalSteps={stepsPerPet} modeContent={modeContent} />
            </motion.div>
          )}

          {step === 6 && (
            <motion.div key={`step6-pet${currentPetIndex}`} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepDOB petData={currentPetData} onUpdate={updatePetData} onNext={() => goToStep(7)} onBack={handleBack} totalSteps={stepsPerPet} modeContent={modeContent} />
            </motion.div>
          )}

          {step === 7 && (
            <motion.div key={`step7-pet${currentPetIndex}`} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepLocation petData={currentPetData} onUpdate={updatePetData} onNext={() => goToStep(8)} onBack={handleBack} totalSteps={stepsPerPet} modeContent={modeContent} />
            </motion.div>
          )}

          {step === 8 && (
            <motion.div key={`step8-pet${currentPetIndex}`} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepSoul petData={currentPetData} onUpdate={updatePetData} onNext={() => goToStep(9)} onBack={handleBack} totalSteps={stepsPerPet} modeContent={modeContent} />
            </motion.div>
          )}

          {step === 9 && (
            <motion.div key={`step9-pet${currentPetIndex}`} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepSuperpower petData={currentPetData} onUpdate={updatePetData} onNext={() => goToStep(10)} onBack={handleBack} totalSteps={stepsPerPet} modeContent={modeContent} />
            </motion.div>
          )}

          {step === 10 && (
            <motion.div key={`step10-pet${currentPetIndex}`} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepStrangers 
                petData={currentPetData} 
                onUpdate={updatePetData} 
                onNext={handleNextPetOrOwnerDetails} 
                onBack={handleBack} 
                totalSteps={stepsPerPet}
                modeContent={modeContent}
              />
            </motion.div>
          )}

          {step === 11 && (
            <motion.div key="step11-owner" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepOwnerDetails 
                ownerName={ownerData.name}
                ownerBirthDate={ownerData.birthDate}
                ownerBirthTime={ownerData.birthTime}
                ownerBirthLocation={ownerData.birthLocation}
                onUpdate={handleOwnerDataUpdate}
                onNext={() => goToStep(12)}
                onSkip={() => goToStep(12)}
                petName={petsData[0]?.name || 'your pet'}
              />
            </motion.div>
          )}

          {step === 12 && (
            <motion.div key="step12-email" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepEmailEarly 
                petData={petsData[0]} 
                onUpdate={(data) => {
                  // Update email for all pets when entered
                  if (data.email !== undefined) {
                    setPetsData(prev => prev.map(pet => ({ ...pet, email: data.email! })));
                  }
                }}
                onNext={() => goToStep(13)} 
                onBack={handleBack} 
                totalSteps={stepsPerPet}
                currentStep={12}
                modeContent={modeContent}
              />
            </motion.div>
          )}

          {step === 13 && (
            <motion.div key="step-checkout" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepEmail 
                petData={currentPetData} 
                petsData={petsData}
                petCount={petCount}
                onUpdate={() => {}} 
                onReveal={(checkoutData) => {
                  // For gift redemptions with portrait included, go to portrait selection first
                  if (giftCodeFromUrl && giftData?.includesPortrait) {
                    // If multiple pets have portrait tier, show selection; else go straight to photo
                    const portraitIndices = giftData.portraitPetIndices || [];
                    if (portraitIndices.length > 1) {
                      goToStep(14); // Portrait selection step
                    } else if (portraitIndices.length === 1) {
                      setPortraitPetIndex(portraitIndices[0]);
                      setCurrentPetIndex(portraitIndices[0]);
                      goToStep(15); // Photo upload step
                    } else {
                      // Fallback: all pets get portrait if includesPortrait is true but no indices
                      setPortraitPetIndex(0);
                      goToStep(15);
                    }
                  } else {
                    handleReveal(checkoutData);
                  }
                }}
                onBack={() => {
                  setStep(12); // Back to email step
                }}
                onAddAnotherPet={() => {
                  // Add a new pet slot and go to occasion step for the new pet
                  const newPetCount = petCount + 1;
                  setPetCount(newPetCount);
                  setPetsData(prev => [...prev, createEmptyPetData(occasionMode)]);
                  setCurrentPetIndex(newPetCount - 1);
                  setStep(1); // Go to occasion selection for the new pet
                }}
                totalSteps={stepsPerPet}
                modeContent={modeContent}
                giftCode={giftCodeFromUrl}
                giftedTier={giftData?.giftedTier}
                skipEmailInput={true}
              />
            </motion.div>
          )}

          {/* Portrait pet selection step - when multiple pets have portrait tier */}
          {step === 14 && giftCodeFromUrl && giftData?.includesPortrait && (giftData.portraitPetIndices?.length || 0) > 1 && (
            <motion.div key="step-portrait-select" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepPortraitSelect
                petsData={petsData}
                portraitPetIndices={giftData.portraitPetIndices || []}
                selectedPetIndex={portraitPetIndex}
                onSelect={(idx) => {
                  setPortraitPetIndex(idx);
                  setCurrentPetIndex(idx);
                }}
                onNext={() => goToStep(15)}
                onBack={() => setStep(13)}
              />
            </motion.div>
          )}

          {/* Photo upload step - only for portrait/VIP gift recipients */}
          {step === 15 && giftCodeFromUrl && giftData?.includesPortrait && (
            <motion.div key="step-photo" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepPhoto
                petName={petsData[portraitPetIndex ?? 0]?.name || 'Your pet'}
                photoUrl={petsData[portraitPetIndex ?? 0]?.photoUrl || null}
                onPhotoChange={(url) => {
                  const idx = portraitPetIndex ?? 0;
                  setPetsData(prev => prev.map((pet, i) => 
                    i === idx ? { ...pet, photoUrl: url } : pet
                  ));
                }}
                onNext={() => handleReveal()}
                onBack={() => {
                  const portraitIndices = giftData.portraitPetIndices || [];
                  if (portraitIndices.length > 1) {
                    setStep(14); // Back to selection
                  } else {
                    setStep(13); // Back to checkout
                  }
                }}
                onSkip={() => handleReveal()}
                isRequired={false}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dev Panel - only visible in test/dev mode */}
      {isTestMode && (
        <DevPanel
          step={step}
          currentPetIndex={currentPetIndex}
          petCount={petCount}
          petsData={petsData}
          onSetStep={setStep}
          onSetPetIndex={setCurrentPetIndex}
          onSetPetCount={(count) => {
            setPetCount(count);
            const newPets = Array(count).fill(null).map((_, i) => petsData[i] || createEmptyPetData(occasionMode));
            setPetsData(newPets);
          }}
          onUpdatePetsData={setPetsData}
          onSkipToCheckout={() => {
            // Fill data if empty and go to email step
            if (!petsData[0].name) {
              const email = `test${Date.now()}@example.com`;
              const pets = Array(petCount).fill(null).map((_, i) => {
                const species = ['dog', 'cat', 'rabbit'][i % 3] as PetSpecies;
                return {
                  name: ['Luna', 'Max', 'Bella'][i % 3],
                  species,
                  breed: 'Mixed',
                  gender: (i % 2 === 0 ? 'girl' : 'boy') as PetGender,
                  dateOfBirth: new Date(2020, 5, 15),
                  timeOfBirth: '10:30',
                  location: 'New York, NY',
                  soulType: 'adventurer',
                  superpower: 'zoomies',
                  strangerReaction: 'friendly',
                  email,
                  occasionMode: occasionMode,
                  photoUrl: null,
                };
              });
              setPetsData(pets);
            }
            setStep(11);
          }}
          onSkipToResults={() => {
            // Fill data if empty and trigger results
            const email = `test${Date.now()}@example.com`;
            const pets = Array(petCount).fill(null).map((_, i) => {
              const species = ['dog', 'cat', 'rabbit'][i % 3] as PetSpecies;
              return {
                name: petsData[i]?.name || ['Luna', 'Max', 'Bella'][i % 3],
                species: petsData[i]?.species || species,
                breed: petsData[i]?.breed || 'Mixed',
                gender: (petsData[i]?.gender || (i % 2 === 0 ? 'girl' : 'boy')) as PetGender,
                dateOfBirth: petsData[i]?.dateOfBirth || new Date(2020, 5, 15),
                timeOfBirth: petsData[i]?.timeOfBirth || '10:30',
                location: petsData[i]?.location || 'New York, NY',
                soulType: petsData[i]?.soulType || 'adventurer',
                superpower: petsData[i]?.superpower || 'zoomies',
                strangerReaction: petsData[i]?.strangerReaction || 'friendly',
                email: petsData[i]?.email || email,
                occasionMode: petsData[i]?.occasionMode || occasionMode,
                photoUrl: petsData[i]?.photoUrl || null,
              };
            });
            setPetsData(pets);
            setShowResults(true);
          }}
        />
      )}
    </div>
  );
}
