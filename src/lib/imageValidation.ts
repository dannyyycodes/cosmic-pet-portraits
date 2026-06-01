/**
 * Image upload validation + HEIC conversion for the Pawtraits pipeline.
 *
 * Locked spec (2026-05-07):
 *  - Accepted formats: JPEG, PNG, WebP, HEIC, HEIF
 *  - Rejected: GIF, SVG, MP4, PDF, AVIF (decoded inconsistently across CDNs)
 *  - Max file size: 25 MB (Supabase Storage default)
 *  - Min resolution: 600 px on the long edge — gpt-image-2 cannot anchor
 *    identity below this and the print master pipeline can't upscale to
 *    print-grade DPI from sub-600 sources.
 *  - HEIC/HEIF: converted client-side to JPEG (quality 0.92) before upload
 *    so fal.ai / OpenAI image endpoints (which can't decode HEIC) receive
 *    a web-safe master.
 *
 * iPhone quirk: Mobile Safari often reports HEIC as `application/octet-stream`
 * or an empty MIME string. We fall back to extension sniffing when MIME is
 * empty or unrecognised so iPhone uploads aren't false-rejected.
 */

// Lazy-loaded — heic2any is ~600KB and only needed when an HEIC is dropped.
// Dynamic import keeps it out of the main /portraits bundle for >99% of uploads.
type Heic2AnyFn = (opts: {
  blob: Blob;
  toType?: string;
  quality?: number;
}) => Promise<Blob | Blob[]>;

/** Web-safe formats accepted by fal.ai + Supabase Storage + browsers. */
export const ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

/** Extension fallback for iPhone uploads where MIME is empty/octet-stream. */
export const ACCEPTED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
  ".heif",
] as const;

export const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
export const MIN_DIMENSION_PX = 600; // long edge — must clear identity gate

/**
 * Pretty-print a byte count for user-facing error messages.
 * 24,500,000 → "23.4 MB"
 */
function formatMB(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** True when the file's MIME or extension is in the accepted set. */
export function isAcceptedFormat(file: File): boolean {
  const mime = (file.type || "").toLowerCase();
  if ((ACCEPTED_MIME_TYPES as readonly string[]).includes(mime)) return true;

  // iPhone fallback — empty/octet-stream MIME, sniff extension.
  const lower = file.name.toLowerCase();
  return (ACCEPTED_EXTENSIONS as readonly string[]).some((ext) => lower.endsWith(ext));
}

/** True when the file extension or MIME indicates HEIC/HEIF. */
export function isHeic(file: File): boolean {
  const mime = (file.type || "").toLowerCase();
  if (mime === "image/heic" || mime === "image/heif") return true;
  // iPhone uploads often have empty/octet-stream MIME — sniff the extension.
  const lower = file.name.toLowerCase();
  return lower.endsWith(".heic") || lower.endsWith(".heif");
}

/**
 * Best-effort detected-type label for friendly error messages.
 * Prefers the browser-reported MIME, falls back to extension, finally "file".
 */
function detectedLabel(file: File): string {
  if (file.type) return file.type;
  const lower = file.name.toLowerCase();
  const ext = lower.split(".").pop();
  return ext ? `.${ext} file` : "file";
}

/**
 * Surface-level validation — runs synchronously before any IO.
 * Returns null on success, or a human-friendly error string on rejection.
 */
export function validateFileBasics(file: File): string | null {
  if (!isAcceptedFormat(file)) {
    return `Sorry — please upload a JPG, PNG, HEIC, or WebP photo. ${file.name} appears to be a ${detectedLabel(file)}.`;
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `Photo is too large (${formatMB(file.size)}). Please use a photo under 25 MB.`;
  }
  return null;
}

/**
 * Convert HEIC/HEIF to JPEG client-side. Returns a fresh File (not Blob) so
 * the caller can reuse `file.name` / size logic downstream.
 *
 * heic2any is dynamically imported to keep it out of the main bundle.
 * On failure (rare — corrupt HEIC, browser decoder bug) we re-throw with a
 * friendly message the dropzone can surface verbatim.
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  let heic2any: Heic2AnyFn;
  try {
    // The package's default export is the function itself.
    const mod = await import("heic2any");
    heic2any = (mod.default ?? mod) as Heic2AnyFn;
  } catch (err) {
    console.error("[imageValidation] failed to load heic2any", err);
    throw new Error(
      "We couldn't load the HEIC converter. Please save this photo as JPG and try again.",
    );
  }

  let result: Blob | Blob[];
  try {
    result = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
  } catch (err) {
    console.error("[imageValidation] HEIC conversion failed", err);
    throw new Error(
      "Couldn't convert this HEIC photo. Please re-save it as JPG (Photos app → Share → Save Image) and try again.",
    );
  }

  // heic2any returns Blob or Blob[] depending on multi-frame HEICs — we always
  // want the first frame for portraits.
  const blob = Array.isArray(result) ? result[0] : result;
  const baseName = file.name.replace(/\.(heic|heif)$/i, "") || "photo";
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
}

/**
 * Read a file's intrinsic pixel dimensions client-side without uploading.
 * Uses URL.createObjectURL → <img> probe → revokeObjectURL.
 *
 * Resolves to {width, height}. Rejects if the browser can't decode the image
 * (corrupt file, unsupported codec).
 */
export function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const dims = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(url);
      resolve(dims);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read this image — it may be corrupt."));
    };
    img.src = url;
  });
}

/**
 * Validate that the long-edge resolution is >= MIN_DIMENSION_PX.
 * Returns null on success or a friendly error string on rejection.
 *
 * Note: long-edge gate (not BOTH dimensions) — a portrait-orientation phone
 * photo typically has width ~1170 / height ~2532; we want to accept those
 * even though one dimension is short. The spec says "600px on the long edge".
 */
export function validateDimensions(width: number, height: number): string | null {
  const longEdge = Math.max(width, height);
  if (longEdge < MIN_DIMENSION_PX) {
    return `This photo is too small (${width}×${height}px). Please upload a photo where the longest edge is at least ${MIN_DIMENSION_PX}px — your phone's full-resolution photos work great.`;
  }
  return null;
}
