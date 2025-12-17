import { PetData } from '@/components/intake/IntakeWizard';

const STORAGE_KEY = 'cosmic_pet_intake_progress';

interface SavedProgress {
  petsData: PetData[];
  currentPetIndex: number;
  step: number;
  petCount: number;
  savedAt: number;
}

export function saveIntakeProgress(data: SavedProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...data,
      savedAt: Date.now(),
    }));
  } catch (e) {
    console.error('Failed to save progress:', e);
  }
}

export function loadIntakeProgress(): SavedProgress | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    
    const data: SavedProgress = JSON.parse(saved);
    
    // Expire after 24 hours
    const ONE_DAY = 24 * 60 * 60 * 1000;
    if (Date.now() - data.savedAt > ONE_DAY) {
      clearIntakeProgress();
      return null;
    }
    
    return data;
  } catch (e) {
    console.error('Failed to load progress:', e);
    return null;
  }
}

export function clearIntakeProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear progress:', e);
  }
}

export function hasIntakeProgress(): boolean {
  return loadIntakeProgress() !== null;
}
