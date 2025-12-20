import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Check, Sparkles, ImageIcon, Wand2, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PetData } from './IntakeWizard';

export type PhotoProcessingMode = 'original' | 'cosmic' | 'pokemon' | 'watercolor' | 'neon';

export interface PetPhotoData {
  url: string;
  processingMode: PhotoProcessingMode;
}

interface MultiPetPhotoUploadProps {
  petsData: PetData[];
  petPhotos: Record<number, PetPhotoData>;
  onPhotoChange: (petIndex: number, photo: PetPhotoData | null) => void;
}

const PROCESSING_OPTIONS: { id: PhotoProcessingMode; label: string; description: string; icon: React.ReactNode }[] = [
  { 
    id: 'original', 
    label: 'Use As-Is', 
    description: 'Keep the original photo unchanged',
    icon: <Image className="w-4 h-4" />
  },
  { 
    id: 'cosmic', 
    label: 'Cosmic Portrait', 
    description: 'Transform into a celestial trading card',
    icon: <Sparkles className="w-4 h-4" />
  },
  { 
    id: 'pokemon', 
    label: 'Pokemon Style', 
    description: 'Anime-inspired character card',
    icon: <Wand2 className="w-4 h-4" />
  },
  { 
    id: 'watercolor', 
    label: 'Watercolor Art', 
    description: 'Artistic watercolor painting style',
    icon: <Wand2 className="w-4 h-4" />
  },
  { 
    id: 'neon', 
    label: 'Neon Glow', 
    description: 'Vibrant neon cyberpunk style',
    icon: <Wand2 className="w-4 h-4" />
  },
];

function SinglePetPhotoUpload({ 
  petName, 
  petIndex,
  photoData,
  onPhotoChange 
}: { 
  petName: string;
  petIndex: number;
  photoData: PetPhotoData | null;
  onPhotoChange: (photo: PetPhotoData | null) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [tempPhotoUrl, setTempPhotoUrl] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, etc.)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image is too large. Please use an image under 10MB.');
      return;
    }

    setIsUploading(true);
    
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const filename = `${crypto.randomUUID()}.${ext}`;
      
      const { data, error } = await supabase.storage
        .from('pet-photos')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('pet-photos')
        .getPublicUrl(filename);

      setTempPhotoUrl(urlData.publicUrl);
      setShowOptions(true);
      toast.success(`${petName}'s photo uploaded!`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSelectMode = (mode: PhotoProcessingMode) => {
    if (tempPhotoUrl) {
      onPhotoChange({ url: tempPhotoUrl, processingMode: mode });
      setShowOptions(false);
      setTempPhotoUrl(null);
    }
  };

  const removePhoto = () => {
    onPhotoChange(null);
    setTempPhotoUrl(null);
    setShowOptions(false);
  };

  return (
    <div className="p-4 rounded-xl bg-card/30 border border-border/50 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
          {petIndex + 1}
        </div>
        <span className="font-medium text-foreground">{petName || `Pet ${petIndex + 1}`}</span>
      </div>

      <AnimatePresence mode="wait">
        {photoData ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-lg overflow-hidden border-2 border-nebula-purple/50"
          >
            <img
              src={photoData.url}
              alt={`${petName}'s photo`}
              className="w-full h-32 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-white">
                <Check className="w-3 h-3 text-green-400" />
                <span className="px-2 py-0.5 rounded-full bg-nebula-purple/80 text-white">
                  {PROCESSING_OPTIONS.find(o => o.id === photoData.processingMode)?.label}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removePhoto}
                className="text-white hover:bg-white/20 h-6 px-2"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>
        ) : showOptions && tempPhotoUrl ? (
          <motion.div
            key="options"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <div className="relative rounded-lg overflow-hidden h-24">
              <img src={tempPhotoUrl} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              How would you like to use this photo?
            </p>
            
            <div className="grid grid-cols-2 gap-2">
              {PROCESSING_OPTIONS.slice(0, 2).map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelectMode(option.id)}
                  className={cn(
                    "p-2 rounded-lg border-2 text-left transition-all",
                    option.id === 'original' 
                      ? "border-green-500/50 bg-green-500/10 hover:bg-green-500/20"
                      : "border-nebula-purple/50 bg-nebula-purple/10 hover:bg-nebula-purple/20"
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {option.icon}
                    <span className="text-xs font-medium">{option.label}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{option.description}</p>
                </button>
              ))}
            </div>
            
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground text-center">Or choose AI style:</p>
              <div className="flex gap-1.5 justify-center flex-wrap">
                {PROCESSING_OPTIONS.slice(2).map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleSelectMode(option.id)}
                    className="px-2 py-1 rounded-full border border-border/50 bg-card/50 hover:bg-nebula-purple/20 hover:border-nebula-purple/50 transition-all text-[10px]"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              className="hidden"
              id={`photo-upload-${petIndex}`}
            />
            <label
              htmlFor={`photo-upload-${petIndex}`}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              className={cn(
                "block w-full h-24 rounded-lg border-2 border-dashed cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-1",
                dragActive
                  ? "border-nebula-purple bg-nebula-purple/20"
                  : "border-border/50 bg-card/20 hover:border-nebula-purple/50 hover:bg-nebula-purple/5",
                isUploading && "opacity-50 cursor-wait"
              )}
            >
              {isUploading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 border-2 border-nebula-purple border-t-transparent rounded-full"
                  />
                  <span className="text-xs text-muted-foreground">Uploading...</span>
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {dragActive ? 'Drop here!' : 'Click or drag photo'}
                  </span>
                </>
              )}
            </label>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MultiPetPhotoUpload({ petsData, petPhotos, onPhotoChange }: MultiPetPhotoUploadProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Camera className="w-4 h-4 text-nebula-purple" />
        <span className="text-sm font-medium text-foreground">
          Upload Photos for Your Cards
        </span>
      </div>
      
      <div className="bg-card/50 border border-border/50 rounded-lg p-3 mb-3">
        <p className="text-xs text-foreground font-medium mb-2">📸 After uploading, you'll choose:</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-green-400">
            <Image className="w-3 h-3" />
            <span><strong>Use As-Is</strong> – Keep original photo</span>
          </div>
          <div className="flex items-center gap-1.5 text-nebula-purple">
            <Wand2 className="w-3 h-3" />
            <span><strong>AI Transform</strong> – Cosmic/Pokemon style</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {petsData.map((pet, index) => (
          <SinglePetPhotoUpload
            key={index}
            petName={pet.name}
            petIndex={index}
            photoData={petPhotos[index] || null}
            onPhotoChange={(photo) => onPhotoChange(index, photo)}
          />
        ))}
      </div>
    </div>
  );
}
