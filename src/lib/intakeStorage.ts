import { PetData } from '@/components/intake/IntakeWizard';

const STORAGE_KEY = 'cosmic_pet_intake_progress';
const OCCASION_KEY = 'cosmic_pet_occasion_mode';
const OWNER_KEY = 'cosmic_pet_owner_data';

interface SavedProgress {
  petsData: PetData[];
  currentPetIndex: number;
  step: number;
  petCount: number;
  savedAt: number;
}

export interface OwnerData {
  name: string;
  birthDate: string;
  birthTime: string;
  birthLocation: string;
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
    localStorage.removeItem(OCCASION_KEY);
  } catch (e) {
    console.error('Failed to clear progress:', e);
  }
}

export function hasIntakeProgress(): boolean {
  return loadIntakeProgress() !== null;
}

export function saveOccasionMode(mode: string): void {
  try {
    localStorage.setItem(OCCASION_KEY, mode);
  } catch (e) {
    console.error('Failed to save occasion mode:', e);
  }
}

export function loadOccasionMode(): string | null {
  try {
    return localStorage.getItem(OCCASION_KEY);
  } catch (e) {
    console.error('Failed to load occasion mode:', e);
    return null;
  }
}

export function clearOccasionMode(): void {
  try {
    localStorage.removeItem(OCCASION_KEY);
  } catch (e) {
    console.error('Failed to clear occasion mode:', e);
  }
}

// Owner data for compatibility
export function saveOwnerData(data: OwnerData): void {
  try {
    localStorage.setItem(OWNER_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save owner data:', e);
  }
}

export function loadOwnerData(): OwnerData | null {
  try {
    const saved = localStorage.getItem(OWNER_KEY);
    if (!saved) return null;
    return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load owner data:', e);
    return null;
  }
}

export function clearOwnerData(): void {
  try {
    localStorage.removeItem(OWNER_KEY);
  } catch (e) {
    console.error('Failed to clear owner data:', e);
  }
}
