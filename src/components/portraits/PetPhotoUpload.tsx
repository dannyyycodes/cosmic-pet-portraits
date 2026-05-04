/**
 * PetPhotoUpload — drag/drop photo capture for /portraits Upload Studio.
 *
 * Flow: drag/drop → compress → Supabase Storage → return public URL
 * to parent for the live cinematic preview step.
 *
 * Uses react-dropzone per locked build plan (2026-05-02).
 * Uses existing `pet-photos` bucket for Phase 1; production target per
 * architecture is `pet-portraits/raw/{orderId}/...` — migrate when order
 * tracking lands in Phase 2.
 */
import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import imageCompression from "browser-image-compression";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PetPhotoUploadProps {
  /** Called with the public Supabase URL once the photo lands. */
  onUploaded: (url: string) => void;
  /** Currently uploaded photo URL (controlled). */
  photoUrl: string | null;
  /** Reset handler for "use a different photo". */
  onReset: () => void;
}

const MAX_BYTES = 50 * 1024 * 1024; // 50MB hard cap (compression handles the rest)

export function PetPhotoUpload({ onUploaded, photoUrl, onReset }: PetPhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<string>("");

  const onDrop = useCallback(
    async (accepted: File[], rejected: FileRejection[]) => {
      if (rejected.length) {
        toast.error("Please drop a single image (JPG, PNG, HEIC, WebP).");
        return;
      }
      const file = accepted[0];
      if (!file) return;

      if (file.size > MAX_BYTES) {
        toast.error("Image is too large. Please use one under 50MB.");
        return;
      }

      setIsUploading(true);
      setProgress("Optimising photo…");

      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1600, // higher than report flow — kontext needs the detail
          useWebWorker: true,
          fileType: "image/jpeg",
          initialQuality: 0.88,
        });

        setProgress("Uploading to your private gallery…");
        const filename = `portraits/${crypto.randomUUID()}.jpg`;

        const { error } = await supabase.storage
          .from("pet-photos")
          .upload(filename, compressed, {
            cacheControl: "31536000",
            upsert: false,
            contentType: "image/jpeg",
          });

        if (error) throw error;

        const { data: urlData } = supabase.storage.from("pet-photos").getPublicUrl(filename);
        onUploaded(urlData.publicUrl);
        toast.success("Photo ready — pick a character world.");
      } catch (err) {
        console.error("[PortraitsUpload]", err);
        toast.error("Upload failed. Please try a different photo.");
      } finally {
        setIsUploading(false);
        setProgress("");
      }
    },
    [onUploaded],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".avif"],
    },
    multiple: false,
    disabled: isUploading || !!photoUrl,
  });

  return (
    <AnimatePresence mode="wait">
      {photoUrl ? (
        <motion.div
          key="preview"
          layoutId="portrait-source-photo"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-lg overflow-hidden mx-auto"
          style={{
            maxWidth: "320px",
            border: "1px solid rgba(196, 162, 101, 0.55)",
            background: "#FFFDF5",
          }}
        >
          <img
            src={photoUrl}
            alt="Your pet — source photo"
            className="w-full aspect-square object-cover"
          />
          <button
            type="button"
            onClick={onReset}
            className="absolute top-3 right-3 text-[12px] uppercase rounded-full px-3 py-1 transition-opacity hover:opacity-90"
            style={{
              background: "rgba(13, 10, 20, 0.72)",
              color: "#f5efe6",
              letterSpacing: "0.1em",
              backdropFilter: "blur(4px)",
            }}
          >
            Use a different photo
          </button>
        </motion.div>
      ) : (
        // Plain div (not motion.div) — react-dropzone's onDrag handler conflicts
        // with framer-motion's drag prop type. Crossfade lives on AnimatePresence.
        <div
          key="dropzone"
          {...getRootProps()}
          className="cursor-pointer rounded-lg p-12 md:p-16 transition-all"
          style={{
            background: isDragActive ? "#faf6ef" : "#FFFDF5",
            border: isDragActive ? "1px dashed #bf524a" : "1px dashed #c4a265",
            color: "#5a4a42",
            transform: isDragActive ? "scale(1.01)" : "scale(1)",
          }}
          aria-label="Drop your pet photo here, or click to browse"
        >
          <input {...getInputProps()} />
          <div className="text-center">
            {isUploading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-7 h-7 mx-auto rounded-full border-2"
                  style={{ borderColor: "#c4a265", borderTopColor: "transparent" }}
                />
                <p className="mt-4 font-cormorant italic" style={{ fontSize: "18px", color: "#5a4a42" }}>
                  {progress || "Uploading…"}
                </p>
              </>
            ) : (
              <>
                <p
                  className="font-serif"
                  style={{ fontSize: "22px", fontWeight: 400, color: "#3d2f2a", letterSpacing: "-0.005em" }}
                >
                  {isDragActive ? "Drop their photo here" : "Drag in their photo"}
                </p>
                <p className="mt-3 font-cormorant italic" style={{ fontSize: "17px", color: "#5a4a42" }}>
                  or click to choose · JPG, PNG, HEIC, WebP — up to 50MB
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
