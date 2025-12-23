import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Check, Sparkles, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PetPhotoUploadProps {
  petName: string;
  onPhotoUploaded: (url: string | null) => void;
  photoUrl: string | null;
  isRequired?: boolean;
}

export function PetPhotoUpload({ petName, onPhotoUploaded, photoUrl, isRequired = false }: PetPhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, etc.)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('Image is too large. Please use an image under 10MB.');
      return;
    }

    setIsUploading(true);
    
    try {
      // Create unique filename
      const ext = file.name.split('.').pop() || 'jpg';
      const filename = `${crypto.randomUUID()}.${ext}`;
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('pet-photos')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('pet-photos')
        .getPublicUrl(filename);

      onPhotoUploaded(urlData.publicUrl);
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const removePhoto = () => {
    onPhotoUploaded(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Camera className="w-4 h-4 text-nebula-purple" />
        <span className="text-sm font-medium text-foreground">
          Upload {petName}'s Photo
        </span>
        {isRequired && (
          <span className="text-xs text-red-400">(Required for portrait)</span>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground">
        For the best card, upload a clear, well-lit photo of {petName}. We’ll use this exact photo on your trading card.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {photoUrl ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-xl overflow-hidden border-2 border-nebula-purple/50 bg-nebula-purple/10"
          >
            <img
              src={photoUrl}
              alt={`${petName}'s photo`}
              className="w-full h-40 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-white">
                <Check className="w-4 h-4 text-green-400" />
                <span>Photo ready!</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removePhoto}
                className="text-white hover:bg-white/20"
              >
                <X className="w-4 h-4 mr-1" />
                Remove
              </Button>
            </div>

            <div className="absolute top-3 right-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="p-2 rounded-full bg-cosmic-gold text-cosmic-gold-foreground"
              >
                <Sparkles className="w-4 h-4" />
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            disabled={isUploading}
            className={cn(
              "w-full h-32 rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center gap-2",
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
                  className="w-8 h-8 border-2 border-nebula-purple border-t-transparent rounded-full"
                />
                <span className="text-sm text-muted-foreground">Uploading...</span>
              </>
            ) : (
              <>
                <div className="p-3 rounded-full bg-nebula-purple/20 text-nebula-purple">
                  {dragActive ? (
                    <Upload className="w-6 h-6" />
                  ) : (
                    <ImageIcon className="w-6 h-6" />
                  )}
                </div>
                <div className="text-center">
                  <span className="text-sm font-medium text-foreground">
                    {dragActive ? 'Drop photo here!' : 'Click or drag photo'}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG up to 10MB
                  </p>
                </div>
              </>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {!photoUrl && (
        <p className="text-xs text-muted-foreground text-center italic">
          💡 Best results: Clear, well-lit photo showing {petName}'s face and body
        </p>
      )}
    </div>
  );
}