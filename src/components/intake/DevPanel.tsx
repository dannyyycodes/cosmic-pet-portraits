import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, ChevronDown, ChevronUp, Zap, SkipForward, CreditCard, Users, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PetData, PetSpecies, PetGender } from './IntakeWizard';
import { OccasionMode } from '@/lib/occasionMode';

interface DevPanelProps {
  step: number;
  currentPetIndex: number;
  petCount: number;
  petsData: PetData[];
  onSetStep: (step: number) => void;
  onSetPetIndex: (index: number) => void;
  onSetPetCount: (count: number) => void;
  onUpdatePetsData: (pets: PetData[]) => void;
  onSkipToCheckout: () => void;
  onSkipToResults: () => void;
}

const testPetNames = ['Luna', 'Max', 'Bella', 'Charlie', 'Lucy', 'Cooper', 'Daisy', 'Buddy'];
const testSpecies: PetSpecies[] = ['dog', 'cat', 'rabbit', 'bird', 'hamster'];
const testBreeds = {
  dog: ['Golden Retriever', 'Labrador', 'Husky', 'Poodle', 'Bulldog'],
  cat: ['Persian', 'Siamese', 'Maine Coon', 'British Shorthair', 'Ragdoll'],
  rabbit: ['Holland Lop', 'Rex', 'Lionhead', 'Dutch', 'Mini Lop'],
  bird: ['Parakeet', 'Cockatiel', 'Lovebird', 'Finch', 'Canary'],
  hamster: ['Syrian', 'Dwarf', 'Roborovski', 'Chinese', 'Campbell'],
};
const testLocations = ['New York, NY', 'Los Angeles, CA', 'London, UK', 'Paris, France', 'Tokyo, Japan'];
const testSoulTypes = ['adventurer', 'guardian', 'healer', 'trickster', 'sage'];
const testSuperpowers = ['zoomies', 'mind_reading', 'treat_detection', 'cuddle_therapy', 'stealth'];
const testStrangerReactions = ['friendly', 'shy', 'protective', 'curious', 'indifferent'];
const testOccasions: OccasionMode[] = ['discover', 'birthday', 'memorial', 'gift'];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateTestPet(index: number, existingEmail?: string): PetData {
  const species = getRandomItem(testSpecies);
  const breedList = testBreeds[species] || ['Mixed'];
  
  // Random date in the past 1-15 years
  const yearsAgo = Math.floor(Math.random() * 14) + 1;
  const dob = new Date();
  dob.setFullYear(dob.getFullYear() - yearsAgo);
  dob.setMonth(Math.floor(Math.random() * 12));
  dob.setDate(Math.floor(Math.random() * 28) + 1);

  return {
    name: testPetNames[index % testPetNames.length] + (index > 0 ? ` ${index + 1}` : ''),
    species,
    breed: getRandomItem(breedList),
    gender: Math.random() > 0.5 ? 'boy' : 'girl' as PetGender,
    dateOfBirth: dob,
    timeOfBirth: `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
    location: getRandomItem(testLocations),
    soulType: getRandomItem(testSoulTypes),
    superpower: getRandomItem(testSuperpowers),
    strangerReaction: getRandomItem(testStrangerReactions),
    email: existingEmail || `test${Date.now()}@example.com`,
    occasionMode: getRandomItem(testOccasions),
    photoUrl: null,
  };
}

export function DevPanel({
  step,
  currentPetIndex,
  petCount,
  petsData,
  onSetStep,
  onSetPetIndex,
  onSetPetCount,
  onUpdatePetsData,
  onSkipToCheckout,
  onSkipToResults,
}: DevPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const fillCurrentPet = () => {
    const existingEmail = petsData[0]?.email || `test${Date.now()}@example.com`;
    const newPets = [...petsData];
    newPets[currentPetIndex] = generateTestPet(currentPetIndex, existingEmail);
    onUpdatePetsData(newPets);
  };

  const fillAllPets = () => {
    const email = `test${Date.now()}@example.com`;
    const newPets = Array(petCount).fill(null).map((_, i) => generateTestPet(i, email));
    onUpdatePetsData(newPets);
  };

  const quickStart = (numPets: number) => {
    const email = `test${Date.now()}@example.com`;
    const pets = Array(numPets).fill(null).map((_, i) => generateTestPet(i, email));
    onSetPetCount(numPets);
    onUpdatePetsData(pets);
    onSetStep(11); // Go to email/checkout step
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-2 bg-background/95 backdrop-blur border border-border rounded-lg shadow-xl p-4 w-72"
          >
            <div className="space-y-3">
              {/* Quick Start Section */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">⚡ Quick Start</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => quickStart(1)}
                    className="flex-1 text-xs"
                  >
                    <User className="w-3 h-3 mr-1" />
                    1 Pet
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => quickStart(2)}
                    className="flex-1 text-xs"
                  >
                    <Users className="w-3 h-3 mr-1" />
                    2 Pets
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => quickStart(3)}
                    className="flex-1 text-xs"
                  >
                    <Users className="w-3 h-3 mr-1" />
                    3 Pets
                  </Button>
                </div>
              </div>

              {/* Fill Data */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">📝 Fill Test Data</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={fillCurrentPet}
                    className="flex-1 text-xs"
                  >
                    Current Pet
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={fillAllPets}
                    className="flex-1 text-xs"
                  >
                    All Pets
                  </Button>
                </div>
              </div>

              {/* Navigation */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">🚀 Skip To</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSetStep(11)}
                    className="text-xs"
                  >
                    <SkipForward className="w-3 h-3 mr-1" />
                    Email
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onSkipToCheckout}
                    className="text-xs"
                  >
                    <CreditCard className="w-3 h-3 mr-1" />
                    Checkout
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={onSkipToResults}
                    className="text-xs"
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    Results
                  </Button>
                </div>
              </div>

              {/* Current State */}
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Step: {step} | Pet: {currentPetIndex + 1}/{petCount}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  Name: {petsData[currentPetIndex]?.name || '(empty)'}
                </p>
              </div>

              {/* Step Navigation */}
              <div className="flex flex-wrap gap-1">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={step === s ? 'default' : 'ghost'}
                    onClick={() => onSetStep(s)}
                    className="w-7 h-7 p-0 text-xs"
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-background/95 backdrop-blur shadow-lg"
      >
        <Bug className="w-4 h-4 mr-2" />
        Dev
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 ml-1" />
        ) : (
          <ChevronUp className="w-4 h-4 ml-1" />
        )}
      </Button>
    </div>
  );
}
