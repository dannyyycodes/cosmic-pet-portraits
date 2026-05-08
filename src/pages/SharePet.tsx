/**
 * /share/:reportId — Pawtraits UGC backstory share page.
 *
 * Owners land here from a "share your pet's portrait" CTA in the report
 * viewer / order-complete email. They:
 *   1. See the canvas portrait we generated for their pet.
 *   2. Upload a real photo of the pet (HEIC support — iPhone-friendly).
 *   3. Type the first name we should credit them with.
 *   4. Tick the consent box (unticked by default — GDPR explicit consent).
 *   5. Submit. We mint a signed upload URL, the bytes go direct to
 *      Supabase storage, then we finalize the row, then send them on
 *      to /share/thanks.
 *
 * Sacred copy:
 *   • No "report" word. We say "soul reading" / "canvas" / "portrait".
 *   • No reference to AI.
 *   • Transformation framing — "share their story", not "give us a photo".
 *
 * GDPR posture:
 *   • Checkbox is UNTICKED by default. Submit is disabled until ticked.
 *   • Consent body is rendered inline, plus a "what does this mean"
 *     tooltip pulled from the same body_text.
 *   • consent_text_version + consent_granted_at captured server-side.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import imageCompression from "browser-image-compression";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  validateFileBasics,
  isHeic,
  convertHeicToJpeg,
  readImageDimensions,
  validateDimensions,
} from "@/lib/imageValidation";

interface ReportRow {
  id: string;
  pet_name: string | null;
  species: string | null;
  breed: string | null;
  portrait_url: string | null;
  pet_photo_url: string | null;
}

interface ConsentRow {
  version: string;
  body_text: string;
}

const PALETTE = {
  cream: "#FFFDF5",
  cream2: "#faf4e8",
  rose: "#bf524a",
  gold: "#c4a265",
  ink: "#141210",
  ink2: "#3d2f2a",
  body: "#5a4a42",
  muted: "#958779",
  sand: "#e8ddd0",
} as const;

export default function SharePet() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();

  const [report, setReport] = useState<ReportRow | null>(null);
  const [consent, setConsent] = useState<ConsentRow | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [ownerFirstName, setOwnerFirstName] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ── Load report + latest consent version in parallel ──────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!reportId) {
        setLoadError("Missing reading reference.");
        setLoading(false);
        return;
      }
      try {
        // ugc_consent_versions is freshly migrated — Supabase generated types
        // lag behind so we cast the client to `any` for that one read. The
        // reports query stays fully typed.
        const supabaseAny = supabase as unknown as {
          from: (t: string) => {
            select: (cols: string) => {
              order: (c: string, o: { ascending: boolean }) => {
                limit: (n: number) => { maybeSingle: () => Promise<{ data: ConsentRow | null; error: unknown }> };
              };
            };
          };
        };
        const [reportRes, consentRes] = await Promise.all([
          supabase
            .from("pet_reports")
            .select("id, pet_name, species, breed, portrait_url, pet_photo_url")
            .eq("id", reportId)
            .maybeSingle(),
          supabaseAny
            .from("ugc_consent_versions")
            .select("version, body_text")
            .order("effective_from", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);
        if (cancelled) return;
        if (reportRes.error || !reportRes.data) {
          setLoadError("We couldn't find this canvas. Try the link from your reading email.");
        } else {
          setReport(reportRes.data as ReportRow);
        }
        if (consentRes.error || !consentRes.data) {
          setLoadError("We couldn't load the consent text. Please refresh in a moment.");
        } else {
          setConsent(consentRes.data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[SharePet] load failed:", err);
          setLoadError("Something went wrong loading this page. Please refresh.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [reportId]);

  // ── Photo selection ─────────────────────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    const basicErr = validateFileBasics(file);
    if (basicErr) {
      toast.error(basicErr);
      return;
    }
    setProgress("Reading photo…");
    try {
      let working = file;
      if (isHeic(file)) {
        setProgress("Converting HEIC photo…");
        working = await convertHeicToJpeg(file);
      }
      setProgress("Checking photo…");
      const dims = await readImageDimensions(working);
      const dimErr = validateDimensions(dims.width, dims.height);
      if (dimErr) {
        toast.error(dimErr);
        setProgress("");
        return;
      }
      setPhotoFile(working);
      const url = URL.createObjectURL(working);
      setPhotoPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (err) {
      console.error("[SharePet] photo prep failed:", err);
      const msg = err instanceof Error && err.message ? err.message : "Could not read that photo.";
      toast.error(msg);
    } finally {
      setProgress("");
    }
  }, []);

  // ── Submit ──────────────────────────────────────────────────────────────
  const canSubmit = !!photoFile && ownerFirstName.trim().length > 0 && consentChecked && !submitting && !!consent;

  async function handleSubmit() {
    if (!canSubmit || !photoFile || !consent || !reportId) return;
    setSubmitting(true);
    try {
      // 1. Confirm we have a session.
      setProgress("Checking your session…");
      const { data: sessionRes } = await supabase.auth.getSession();
      const accessToken = sessionRes.session?.access_token;
      if (!accessToken) {
        toast.error("Please sign in to share your photo.");
        navigate(`/auth?next=/share/${encodeURIComponent(reportId)}`);
        return;
      }

      // 2. Mint signed upload URL.
      setProgress("Preparing upload…");
      const submitRes = await fetch("/api/ugc/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          reportId,
          ownerFirstName: ownerFirstName.trim(),
          consentVersion: consent.version,
        }),
      });
      const submitJson = (await submitRes.json().catch(() => null)) as
        | { submissionId?: string; uploadUrl?: string; uploadPath?: string; token?: string; error?: string; latestConsentVersion?: string }
        | null;

      if (!submitRes.ok || !submitJson?.submissionId || !submitJson.uploadPath || !submitJson.token) {
        toast.error(submitJson?.error || "Could not start the upload. Please try again.");
        return;
      }

      // 3. Compress + upload to the signed URL.
      setProgress("Optimising your photo…");
      const compressed = await imageCompression(photoFile, {
        maxSizeMB: 1.2,
        maxWidthOrHeight: 2400,
        useWebWorker: true,
        fileType: "image/jpeg",
        initialQuality: 0.9,
      });

      setProgress("Uploading to your private gallery…");
      const { error: uploadErr } = await supabase.storage
        .from("ugc-photos")
        .uploadToSignedUrl(submitJson.uploadPath, submitJson.token, compressed, {
          contentType: "image/jpeg",
          upsert: false,
        });
      if (uploadErr) {
        console.error("[SharePet] upload failed:", uploadErr);
        toast.error("Upload failed. Please try a different photo.");
        return;
      }

      // 4. Finalize.
      setProgress("Finishing up…");
      const finalizeRes = await fetch("/api/ugc/submit?action=finalize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ submissionId: submitJson.submissionId }),
      });
      const finalizeJson = (await finalizeRes.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!finalizeRes.ok || !finalizeJson?.ok) {
        toast.error(finalizeJson?.error || "Could not finalise your submission.");
        return;
      }

      navigate("/share/thanks");
    } catch (err) {
      console.error("[SharePet] submit failed:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
      setProgress("");
    }
  }

  const petName = report?.pet_name?.trim() || "your soul";
  const portraitUrl = report?.portrait_url || report?.pet_photo_url || null;

  // ── Preview cleanup ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const consentBody = useMemo(() => consent?.body_text ?? "", [consent]);

  return (
    <TooltipProvider>
      <Helmet>
        <title>Share {petName}'s story — Little Souls</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <main style={{ background: PALETTE.cream, minHeight: "100vh", color: PALETTE.body }}>
        <div className="max-w-2xl mx-auto px-4 py-16 md:py-20">
          <header className="text-center mb-10">
            <p
              className="text-xs uppercase tracking-[0.18em] mb-4"
              style={{ color: PALETTE.gold, fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif" }}
            >
              Pawtraits · A community of souls
            </p>
            <h1
              className="text-3xl md:text-4xl mb-4"
              style={{ fontFamily: "Georgia, 'DM Serif Display', serif", color: PALETTE.ink, fontWeight: 400, letterSpacing: "-0.01em" }}
            >
              Share {petName}&apos;s story
            </h1>
            <p
              className="text-base md:text-lg max-w-lg mx-auto"
              style={{ color: PALETTE.body, fontFamily: "Georgia, serif", lineHeight: 1.6 }}
            >
              Upload a photo of {petName} so other soul-keepers can meet them. We&apos;ll pair it with the canvas we made and feature it on our community channels — only if you&apos;d like us to.
            </p>
          </header>

          {loading && (
            <Card className="p-8 text-center" style={{ background: "white", border: `1px solid ${PALETTE.sand}` }}>
              <p style={{ color: PALETTE.muted, fontFamily: "Georgia, serif" }}>Loading your canvas…</p>
            </Card>
          )}

          {!loading && loadError && (
            <Card className="p-8 text-center" style={{ background: "white", border: `1px solid ${PALETTE.sand}` }}>
              <p style={{ color: PALETTE.ink2, fontFamily: "Georgia, serif" }}>{loadError}</p>
              <p className="mt-4">
                <Link to="/" style={{ color: PALETTE.rose, textDecoration: "underline" }}>
                  Return home
                </Link>
              </p>
            </Card>
          )}

          {!loading && !loadError && report && consent && (
            <>
              {/* Canvas preview */}
              {portraitUrl && (
                <Card
                  className="p-4 md:p-6 mb-8"
                  style={{ background: "white", border: `1px solid ${PALETTE.sand}` }}
                >
                  <div
                    className="relative mx-auto rounded-md overflow-hidden"
                    style={{ maxWidth: 360, border: `1px solid ${PALETTE.gold}` }}
                  >
                    <img
                      src={portraitUrl}
                      alt={`${petName}'s canvas portrait`}
                      className="w-full aspect-square object-cover"
                    />
                  </div>
                  <p
                    className="text-center mt-4 italic"
                    style={{ color: PALETTE.muted, fontFamily: "Georgia, serif" }}
                  >
                    The canvas we painted for {petName}.
                  </p>
                </Card>
              )}

              {/* Photo upload */}
              <Card className="p-6 md:p-8 mb-8" style={{ background: "white", border: `1px solid ${PALETTE.sand}` }}>
                <h2
                  className="text-xl mb-2"
                  style={{ fontFamily: "Georgia, serif", color: PALETTE.ink, fontWeight: 400 }}
                >
                  A real photo of {petName}
                </h2>
                <p className="text-sm mb-5" style={{ color: PALETTE.muted, fontFamily: "Georgia, serif" }}>
                  JPG, PNG, HEIC, or WebP. Up to 25 MB. We crop and resize for social — your original stays put.
                </p>

                {photoPreview ? (
                  <div className="space-y-4">
                    <div
                      className="relative mx-auto rounded-md overflow-hidden"
                      style={{ maxWidth: 360, border: `1px solid ${PALETTE.gold}` }}
                    >
                      <img src={photoPreview} alt={`${petName}'s photo`} className="w-full aspect-square object-cover" />
                    </div>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoFile(null);
                          if (photoPreview) URL.revokeObjectURL(photoPreview);
                          setPhotoPreview(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="text-sm underline"
                        style={{ color: PALETTE.rose, fontFamily: "system-ui, sans-serif" }}
                      >
                        Use a different photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    className="block cursor-pointer rounded-md p-10 text-center transition-colors"
                    style={{
                      background: PALETTE.cream2,
                      border: `1px dashed ${PALETTE.gold}`,
                      color: PALETTE.body,
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f);
                      }}
                    />
                    <p style={{ fontFamily: "Georgia, serif", fontSize: 18, color: PALETTE.ink2 }}>
                      {progress || "Tap to choose a photo"}
                    </p>
                    <p className="mt-2 text-sm italic" style={{ color: PALETTE.muted }}>
                      JPG, PNG, HEIC, WebP — up to 25 MB
                    </p>
                  </label>
                )}
              </Card>

              {/* Owner name */}
              <Card className="p-6 md:p-8 mb-8" style={{ background: "white", border: `1px solid ${PALETTE.sand}` }}>
                <label
                  htmlFor="owner-first-name"
                  className="block text-xl mb-2"
                  style={{ fontFamily: "Georgia, serif", color: PALETTE.ink, fontWeight: 400 }}
                >
                  How should we credit you?
                </label>
                <p className="text-sm mb-4" style={{ color: PALETTE.muted, fontFamily: "Georgia, serif" }}>
                  We&apos;ll only ever use your first name — never your surname or email.
                </p>
                <Input
                  id="owner-first-name"
                  type="text"
                  value={ownerFirstName}
                  onChange={(e) => setOwnerFirstName(e.target.value)}
                  placeholder="First name"
                  maxLength={80}
                  autoComplete="given-name"
                />
              </Card>

              {/* Consent */}
              <Card className="p-6 md:p-8 mb-8" style={{ background: "white", border: `1px solid ${PALETTE.sand}` }}>
                <h2
                  className="text-xl mb-3 flex items-center gap-2"
                  style={{ fontFamily: "Georgia, serif", color: PALETTE.ink, fontWeight: 400 }}
                >
                  Your permission
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label="What does this mean?"
                        className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs"
                        style={{
                          background: PALETTE.cream2,
                          border: `1px solid ${PALETTE.gold}`,
                          color: PALETTE.gold,
                          fontFamily: "system-ui, sans-serif",
                        }}
                      >
                        ?
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="max-w-sm whitespace-pre-line text-sm"
                      style={{ background: PALETTE.ink, color: PALETTE.cream, lineHeight: 1.5 }}
                    >
                      {consentBody}
                    </TooltipContent>
                  </Tooltip>
                </h2>
                <div
                  className="text-sm whitespace-pre-line mb-5 rounded-md p-4"
                  style={{
                    color: PALETTE.body,
                    fontFamily: "Georgia, serif",
                    lineHeight: 1.6,
                    background: PALETTE.cream2,
                    border: `1px solid ${PALETTE.sand}`,
                    maxHeight: 240,
                    overflowY: "auto",
                  }}
                >
                  {consentBody}
                </div>
                <label className="flex items-start gap-3 cursor-pointer" htmlFor="ugc-consent">
                  <Checkbox
                    id="ugc-consent"
                    checked={consentChecked}
                    onCheckedChange={(value) => setConsentChecked(value === true)}
                  />
                  <span style={{ fontFamily: "Georgia, serif", color: PALETTE.ink2, lineHeight: 1.55 }}>
                    Yes — Little Souls may share my photo on Facebook, Instagram, Pinterest, and littlesouls.app, with first-name credit only.
                  </span>
                </label>
                <p className="mt-3 text-xs" style={{ color: PALETTE.muted, fontFamily: "system-ui, sans-serif" }}>
                  You can withdraw any time at <a href="mailto:consent@littlesouls.app" style={{ color: PALETTE.rose }}>consent@littlesouls.app</a> — we aim to remove within 30 days.
                </p>
              </Card>

              {/* Submit */}
              <div className="text-center">
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="px-10 py-6 text-base"
                  style={{
                    background: canSubmit ? PALETTE.rose : PALETTE.muted,
                    color: PALETTE.cream,
                    fontFamily: "system-ui, sans-serif",
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                    cursor: canSubmit ? "pointer" : "not-allowed",
                  }}
                >
                  {submitting ? progress || "Sending…" : "Share their story"}
                </Button>
                <p className="mt-4 text-xs" style={{ color: PALETTE.muted, fontFamily: "system-ui, sans-serif" }}>
                  Consent version <code>{consent.version}</code> · You can untick the box at any moment before submitting.
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </TooltipProvider>
  );
}
