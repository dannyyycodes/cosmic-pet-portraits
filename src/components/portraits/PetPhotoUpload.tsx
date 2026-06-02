/**
 * PetPhotoUpload — drag/drop + tap photo capture for /portraits Upload Studio.
 *
 * Flow: pick/drop → validate format/size → HEIC→JPEG (if needed) →
 *       check min-resolution → compress → Supabase Storage → return public URL
 *       to parent for the live cinematic preview step.
 *
 * CROSS-BROWSER / IN-APP-WEBVIEW (2026-06-01):
 *   The previous build used react-dropzone, which opens the file picker by
 *   programmatically clicking a hidden <input>. In-app browsers (TikTok,
 *   Instagram, Facebook, some Android WebViews) BLOCK that synthetic click —
 *   it isn't a "trusted" user gesture once it's forwarded from the wrapper
 *   div — so tapping the dropzone did NOTHING and customers from TikTok could
 *   never upload. Fixed by wrapping the zone in a real <label> tied to a real
 *   <input type="file">: a tap on the label opens the native picker directly
 *   (trusted gesture) in EVERY browser, including in-app webviews. Drag-drop is
 *   kept for desktop via manual dragover/drop handlers — no library.
 *
 * Validation spec (2026-05-07, see src/lib/imageValidation.ts):
 *  - JPEG / PNG / WebP / HEIC / HEIF only (with iPhone MIME fallback)
 *  - Max 25 MB
 *  - Min 600 px on the long edge
 *  - HEIC/HEIF converted client-side to JPEG (q=0.92) before upload because
 *    fal.ai / OpenAI image endpoints can't fetch+decode HEIC.
 */
import { useCallback, useId, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import imageCompression from "browser-image-compression";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  validateFileBasics,
  isHeic,
  convertHeicToJpeg,
  readImageDimensions,
  validateDimensions,
} from "@/lib/imageValidation";

interface PetPhotoUploadProps {
  /** Called with the public Supabase URL once the photo lands. */
  onUploaded: (url: string) => void;
  /** Currently uploaded photo URL (controlled). */
  photoUrl: string | null;
  /** Reset handler for "use a different photo". */
  onReset: () => void;
  /** Compact studio-card treatment. Defaults to the original large dropzone. */
  variant?: "default" | "compact";
}

export function PetPhotoUpload({ onUploaded, photoUrl, onReset, variant = "default" }: PetPhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [isDragActive, setIsDragActive] = useState(false);
  const compact = variant === "compact";
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  // Process a single chosen/dropped file through the full pipeline.
  const processFile = useCallback(
    async (original: File | undefined | null) => {
      if (!original) return;

      // ── 1. Surface validation (format + size) ──────────────────────────
      // Runs sync before any IO so iPhone HEICs reported as
      // application/octet-stream still pass the extension fallback.
      const basicErr = validateFileBasics(original);
      if (basicErr) {
        toast.error(basicErr);
        return;
      }

      setIsUploading(true);

      try {
        // ── 2. HEIC → JPEG (client-side) ─────────────────────────────────
        let workingFile = original;
        if (isHeic(original)) {
          setProgress("Converting HEIC photo…");
          workingFile = await convertHeicToJpeg(original);
        }

        // ── 3. Min-resolution gate ───────────────────────────────────────
        setProgress("Checking photo…");
        const dims = await readImageDimensions(workingFile);
        const dimErr = validateDimensions(dims.width, dims.height);
        if (dimErr) {
          toast.error(dimErr);
          setIsUploading(false);
          setProgress("");
          return;
        }

        // ── 4. Compress + upload ─────────────────────────────────────────
        setProgress("Optimising photo…");
        const compressed = await imageCompression(workingFile, {
          // 8 MB ceiling (NOT 2): browser-image-compression hits maxSizeMB by
          // first dropping quality, THEN shrinking dimensions. A 2 MB cap forced
          // detailed 3000px photos down to ~2000px, which silently starved the
          // "use my photo" as-is print path (ASIS_PPI_HIDE = 50 → a 24" edge
          // needs ≥1200px; large sizes were dead-ending). 8 MB keeps the full
          // 3000px long edge for real photos while still bounding the upload.
          maxSizeMB: 8,
          // 3000px long edge: AI (gpt-image-2) needs detail to anchor identity,
          // AND the as-is path prints the upload directly — the bigger the
          // source, the more canvas sizes print crisply (50-PPI floor).
          maxWidthOrHeight: 3000,
          useWebWorker: true,
          fileType: "image/jpeg",
          initialQuality: 0.9,
        });

        // Re-validate AFTER compression — if the encoder still had to shrink the
        // image below the floor, tell the customer now instead of letting them
        // hit a confusing size-bounce at "Add to cart" (Danny 2026-06-02).
        try {
          const compDims = await readImageDimensions(
            new File([compressed], "compressed.jpg", { type: "image/jpeg" }),
          );
          const compErr = validateDimensions(compDims.width, compDims.height);
          if (compErr) {
            toast.error(compErr);
            setIsUploading(false);
            setProgress("");
            return;
          }
        } catch {
          // Non-fatal: if we can't re-measure, fall through and let the upload +
          // server-side gate handle it rather than blocking a valid photo.
        }

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
        const msg = err instanceof Error && err.message ? err.message : "Upload failed. Please try a different photo.";
        toast.error(msg);
      } finally {
        setIsUploading(false);
        setProgress("");
        // Reset the input so re-selecting the SAME file fires onChange again.
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [onUploaded],
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      processFile(e.target.files?.[0]);
    },
    [processFile],
  );

  const onDropFiles = useCallback(
    (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      setIsDragActive(false);
      if (isUploading || photoUrl) return;
      processFile(e.dataTransfer.files?.[0]);
    },
    [processFile, isUploading, photoUrl],
  );

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
            maxWidth: compact ? "128px" : "320px",
            width: compact ? "128px" : undefined,
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
            className={`absolute uppercase rounded-full transition-opacity hover:opacity-90 ${compact ? "top-2 right-2 text-[10px] px-2 py-0.5" : "top-3 right-3 text-[12px] px-3 py-1"}`}
            style={{
              background: "rgba(13, 10, 20, 0.72)",
              color: "#f5efe6",
              letterSpacing: "0.1em",
              backdropFilter: "blur(4px)",
            }}
          >
            {compact ? "Change" : "Use a different photo"}
          </button>
        </motion.div>
      ) : (
        // <label> + real <input>: a tap opens the native picker DIRECTLY (a
        // trusted user gesture) in every browser, including TikTok/IG/FB in-app
        // webviews where a programmatic .click() is silently ignored.
        <label
          key="dropzone"
          htmlFor={inputId}
          onDragOver={(e) => { e.preventDefault(); if (!isUploading && !photoUrl) setIsDragActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragActive(false); }}
          onDrop={onDropFiles}
          className={`ls-upload-zone cursor-pointer rounded-lg transition-all relative overflow-hidden block ${compact ? "p-4 mx-auto" : "p-12 md:p-16"}`}
          style={{
            background: isDragActive ? "#faf6ef" : "#FFFDF5",
            border: isDragActive ? "1px dashed #bf524a" : "1px dashed #c4a265",
            color: "#5a4a42",
            transform: isDragActive ? "scale(1.01)" : "scale(1)",
            width: compact ? 140 : undefined,
            minHeight: compact ? 140 : undefined,
            display: compact ? "flex" : "block",
            alignItems: compact ? "center" : undefined,
            justifyContent: compact ? "center" : undefined,
            opacity: isUploading ? 0.6 : 1,
            cursor: isUploading ? "wait" : "pointer",
            // iOS Safari sometimes ignores taps on a label whose control is
            // display:none — keep the input in-flow but visually hidden.
            WebkitTapHighlightColor: "transparent",
          }}
          aria-label="Add your pet photo — tap to choose or drop a file"
        >
          {/* Real, directly-tappable file input. Visually hidden but NOT
              display:none (some webviews won't activate a display:none input
              via its label). accept lists explicit extensions because some
              in-app browsers show nothing for a bare image/* on iOS. */}
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/*,image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
            onChange={onInputChange}
            disabled={isUploading}
            style={{
              position: "absolute",
              width: 1,
              height: 1,
              opacity: 0,
              overflow: "hidden",
              pointerEvents: "none",
            }}
          />
          <div className="text-center pointer-events-none">
            {isUploading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-7 h-7 mx-auto rounded-full border-2"
                  style={{ borderColor: "#c4a265", borderTopColor: "transparent" }}
                />
                <p
                  className={`${compact ? "mt-3" : "mt-4"} font-cormorant italic`}
                  style={{ fontSize: compact ? "13px" : "18px", color: "#5a4a42" }}
                >
                  {progress || "Uploading…"}
                </p>
              </>
            ) : (
              <>
                <p
                  className="font-serif"
                  style={{ fontSize: compact ? "15px" : "22px", fontWeight: 400, color: "#3d2f2a", letterSpacing: "-0.005em" }}
                >
                  {compact
                    ? isDragActive
                      ? "Drop photo"
                      : "Add photo"
                    : isDragActive
                      ? "Drop their photo here"
                      : "Drag in their photo"}
                </p>
                {compact ? (
                  <p className="mt-1" style={{ fontFamily: "Assistant, system-ui, sans-serif", fontSize: "11px", color: "#8b7a6a" }}>
                    tap or drop
                  </p>
                ) : (
                  <p className="mt-3 font-cormorant italic" style={{ fontSize: "17px", color: "#5a4a42" }}>
                    or tap to choose · JPG, PNG, HEIC, WebP — up to 25 MB
                  </p>
                )}
              </>
            )}
          </div>
        </label>
      )}
    </AnimatePresence>
  );
}
