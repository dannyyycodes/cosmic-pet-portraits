/**
 * MemorialReportViewer — dedicated viewer for the memorial product.
 *
 * Design principles (deliberately different from CosmicReportViewer):
 *   • Palette: dove white / warm cream / candle gold / soft sage. No cosmic
 *     purple. No emoji in section markers. No chapter Roman numerals.
 *   • Pacing: spacious. Every section is its own quiet card with generous
 *     vertical breathing room. No scroll-gated ceremony — the whole point is
 *     stillness, not theatre.
 *   • Typography: DM Serif Display (titles) + Cormorant (italic pullquotes)
 *     + Inter/system (body) for legibility.
 *   • Tone: reverent. Nothing playful. No "chaos goblin" residual copy.
 *
 * Data shape: MemorialReportContent from ./types.ts, populated by the
 * memorial prompt/schema in worker/memorial-prompt.ts.
 */

import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import DOMPurify from "dompurify";
import type { MemorialReportContent } from "./types";
import { MemorialPDFDownload } from "./MemorialPDFDownload";
import { MemorialShareButton } from "./MemorialShareButton";

interface MemorialReportViewerProps {
  report: MemorialReportContent;
  petName: string;
  gender?: string;
  petPhotoUrl?: string;
  portraitUrl?: string;
  reportId?: string;
  /** Optional share token for public share URLs. */
  shareToken?: string;
  /** Optional birth year — used for OG years string and PDF subtitle. */
  birthYear?: number;
  /** Optional passing year — used for OG years string and PDF subtitle. */
  passingYear?: number;
  /** Optional quiet-revisit mode — gentler entry, still shows keepsake + share. */
  quietMode?: boolean;
}

const safeHtml = (html: string) => DOMPurify.sanitize(html);

// Subject pronoun only — used in a few framing lines where the pet is referenced
function subjectPronoun(gender?: string): string {
  if (gender === "girl" || gender === "female") return "she";
  if (gender === "boy" || gender === "male") return "he";
  return "they";
}

// ─── Small shared building blocks ────────────────────────────────────────────

function SectionFrame({
  eyebrow,
  title,
  children,
  tone = "cream",
}: {
  eyebrow?: string;
  title?: string;
  children: React.ReactNode;
  tone?: "cream" | "dove" | "sage" | "gold";
}) {
  const s = useScrollReveal();
  const palettes = {
    cream: { bg: "#fffdf7", border: "#e8ddd0" },
    dove:  { bg: "#fbfaf6", border: "#e0dace" },
    sage:  { bg: "#f4f6f0", border: "#d6ddcb" },
    gold:  { bg: "#faf4e8", border: "#e4d6b8" },
  } as const;
  const pal = palettes[tone];
  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? "visible" : "hidden"}
      variants={s.variants}
      className="mx-4 my-8 max-w-[580px] sm:mx-auto"
    >
      <div
        className="py-10 px-6 sm:px-10 rounded-[20px]"
        style={{ background: pal.bg, border: `1px solid ${pal.border}` }}
      >
        {eyebrow && (
          <div
            className="text-[0.6rem] font-semibold tracking-[3px] uppercase mb-3"
            style={{ color: "#8fa082" }}
          >
            {eyebrow}
          </div>
        )}
        {title && (
          <h3
            className="text-[1.35rem] leading-[1.4] mb-5 text-[#2d2428]"
            style={{ fontFamily: "DM Serif Display, serif" }}
          >
            {title}
          </h3>
        )}
        {children}
      </div>
    </motion.div>
  );
}

function ThinRule() {
  return (
    <div className="flex justify-center my-12" aria-hidden>
      <div className="w-16 h-px" style={{ background: "#c4a265", opacity: 0.5 }} />
    </div>
  );
}

function PullQuote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote
      className="text-[1.05rem] leading-[1.65] text-[#2d2428] italic text-center max-w-[440px] mx-auto my-3 px-2"
      style={{ fontFamily: "DM Serif Display, serif" }}
    >
      {children}
    </blockquote>
  );
}

function BodyText({ children }: { children: string }) {
  return (
    <p
      className="text-[0.95rem] leading-[1.95] text-[#3d2f2a]"
      dangerouslySetInnerHTML={{ __html: safeHtml(children.replace(/\n\n/g, "<br /><br />")) }}
    />
  );
}

// ─── The viewer ──────────────────────────────────────────────────────────────

export function MemorialReportViewer({
  report,
  petName,
  gender,
  petPhotoUrl,
  portraitUrl,
  reportId,
  shareToken,
  birthYear,
  passingYear,
}: MemorialReportViewerProps) {
  const he = subjectPronoun(gender);

  // Build a "2015 – 2024" style years string when both years are present.
  const yearsString =
    birthYear && passingYear
      ? `${birthYear} \u2013 ${passingYear}`
      : undefined;

  // Memorial OG image URL — the /api/og-memorial endpoint returns an SVG card
  // naming the pet + years. Used so WhatsApp / iMessage / Slack show a quiet
  // cream-on-gold "In Remembrance" preview rather than the generic SPA default.
  const ogImageUrl = (() => {
    const params = new URLSearchParams();
    params.set("pet", petName);
    if (yearsString) params.set("years", yearsString);
    return `/api/og-memorial?${params.toString()}`;
  })();

  const ogTitle = `${petName} \u2014 in remembrance`;
  const ogDescription = `A reading held in remembrance of ${petName}.`;

  return (
    <div
      className="w-full min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, #fbfaf6 0%, #f8f5ee 60%, #fbfaf6 100%)",
        color: "#2d2428",
        fontFamily:
          'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <Helmet>
        <title>{ogTitle}</title>
        <meta name="description" content={ogDescription} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImageUrl} />
      </Helmet>
      {/* ── QUIET ENTRY ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="pt-16 sm:pt-24 pb-8 text-center px-6"
      >
        <div
          className="text-[0.6rem] font-semibold tracking-[4px] uppercase mb-4"
          style={{ color: "#8fa082" }}
        >
          In Memory
        </div>
        {(portraitUrl || petPhotoUrl) && (
          <div className="flex justify-center mb-6">
            <div
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden"
              style={{
                border: "2px solid #c4a265",
                boxShadow: "0 0 40px rgba(196,162,101,0.12)",
              }}
            >
              <img
                src={portraitUrl || petPhotoUrl}
                alt={petName}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
        <h1
          className="text-[2.25rem] sm:text-[2.75rem] leading-[1.15] text-[#2d2428]"
          style={{ fontFamily: "DM Serif Display, serif" }}
        >
          {petName}
        </h1>
        <p
          className="text-[0.95rem] text-[#5a4a42] italic mt-3 max-w-[360px] mx-auto"
          style={{ fontFamily: "DM Serif Display, serif" }}
        >
          A reading held in remembrance of a beloved soul.
        </p>
      </motion.div>

      {report._needsReview && (
        <div className="mx-4 max-w-[580px] sm:mx-auto mb-4 p-3 rounded-lg text-[0.78rem] text-[#8c6a1a] bg-[#faf2df] border border-[#e4d6b8]">
          This reading is being quietly reviewed by our team. You may notice a
          small update in the next day or two — we want every line to be worthy
          of {petName}.
        </div>
      )}

      {/* ── PROLOGUE ────────────────────────────────────────────────────── */}
      <SectionFrame tone="cream">
        <BodyText>{report.prologue}</BodyText>
      </SectionFrame>

      <ThinRule />

      {/* ── NAME MEANING ────────────────────────────────────────────────── */}
      {report.nameMeaning && (
        <>
          <SectionFrame eyebrow="The Name" title={`The meaning of "${petName}"`} tone="dove">
            <BodyText>{report.nameMeaning.origin}</BodyText>
            <div className="mt-4">
              <BodyText>{report.nameMeaning.cosmicSignificance}</BodyText>
            </div>
            {report.nameMeaning.numerologyMeaning && (
              <div className="mt-4">
                <BodyText>{report.nameMeaning.numerologyMeaning}</BodyText>
              </div>
            )}
            {report.nameMeaning.memorialNote && (
              <>
                <div className="my-5 border-t border-[#e0dace]" />
                <PullQuote>&ldquo;{report.nameMeaning.memorialNote}&rdquo;</PullQuote>
              </>
            )}
          </SectionFrame>
          <ThinRule />
        </>
      )}

      {/* ── WHO THEY WERE ───────────────────────────────────────────────── */}
      <SectionFrame
        eyebrow="Chart Reading"
        title={report.whoTheyWere.title || `Who ${petName} was`}
        tone="cream"
      >
        <BodyText>{report.whoTheyWere.threeTruths}</BodyText>
        <div className="mt-7">
          <PullQuote>{report.whoTheyWere.goldenThread}</PullQuote>
        </div>
      </SectionFrame>

      <ThinRule />

      {/* ── GIFTS THEY BROUGHT ──────────────────────────────────────────── */}
      <SectionFrame
        eyebrow="What They Gave"
        title={report.giftsTheyBrought.title || `What ${petName} gave you`}
        tone="gold"
      >
        <div className="space-y-5">
          {report.giftsTheyBrought.gifts.map((gift, i) => (
            <div key={i}>
              <div
                className="text-[0.6rem] font-semibold tracking-[2px] uppercase mb-1.5"
                style={{ color: "#c4a265" }}
              >
                {["The First Gift", "The Second", "The Third"][i] || `Gift ${i + 1}`}
              </div>
              <BodyText>{gift}</BodyText>
            </div>
          ))}
        </div>
        {report.giftsTheyBrought.quietestGift && (
          <>
            <div className="my-6 border-t border-[#e4d6b8]" />
            <div
              className="text-[0.6rem] font-semibold tracking-[2px] uppercase mb-1.5"
              style={{ color: "#c4a265" }}
            >
              The Quietest Gift
            </div>
            <BodyText>{report.giftsTheyBrought.quietestGift}</BodyText>
          </>
        )}
      </SectionFrame>

      <ThinRule />

      {/* ── THE BRIDGE ──────────────────────────────────────────────────── */}
      <SectionFrame
        eyebrow="Lessons"
        title={report.theBridge.title || `What ${petName} taught you`}
        tone="sage"
      >
        <ol className="space-y-5 list-none">
          {report.theBridge.lessons.map((lesson, i) => (
            <li key={i} className="flex gap-4">
              <span
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[0.78rem] font-semibold"
                style={{ background: "#e8ecde", color: "#5a6b4a" }}
              >
                {i + 1}
              </span>
              <div className="flex-1">
                <BodyText>{lesson}</BodyText>
              </div>
            </li>
          ))}
        </ol>
        {report.theBridge.quotableLine && (
          <div className="mt-7">
            <PullQuote>&ldquo;{report.theBridge.quotableLine}&rdquo;</PullQuote>
          </div>
        )}
      </SectionFrame>

      <ThinRule />

      {/* ── SOUL STILL SPEAKS ───────────────────────────────────────────── */}
      <SectionFrame
        eyebrow="What Lives On"
        title={report.soulStillSpeaks.title || "The soul still speaks"}
        tone="cream"
      >
        <BodyText>{report.soulStillSpeaks.content}</BodyText>
        {report.soulStillSpeaks.signatureYouCarry && (
          <div className="mt-5 p-4 rounded-[12px] border-l-[3px]" style={{ background: "#faf4e8", borderColor: "#c4a265" }}>
            <div
              className="text-[0.6rem] font-semibold tracking-[2px] uppercase mb-1.5"
              style={{ color: "#c4a265" }}
            >
              What You Carry Now
            </div>
            <BodyText>{report.soulStillSpeaks.signatureYouCarry}</BodyText>
          </div>
        )}
        {report.soulStillSpeaks.smallSigns?.length > 0 && (
          <div className="mt-6">
            <div
              className="text-[0.6rem] font-semibold tracking-[2px] uppercase mb-2.5"
              style={{ color: "#8fa082" }}
            >
              Small Signs to Watch For
            </div>
            <ul className="space-y-2">
              {report.soulStillSpeaks.smallSigns.map((sign, i) => (
                <li
                  key={i}
                  className="text-[0.92rem] leading-[1.8] text-[#3d2f2a] pl-4 border-l-2"
                  style={{ borderColor: "#d6ddcb" }}
                >
                  {sign}
                </li>
              ))}
            </ul>
          </div>
        )}
      </SectionFrame>

      <ThinRule />

      {/* ── THEIR VOICE NOW (letter from beyond) ────────────────────────── */}
      <SectionFrame
        eyebrow="A Letter From Them"
        title={report.theirVoiceNow.title || `If ${petName} could speak to you now`}
        tone="gold"
      >
        <div
          className="text-[1.02rem] leading-[2] text-[#2d2428]"
          style={{ fontFamily: "DM Serif Display, serif" }}
          dangerouslySetInnerHTML={{
            __html: safeHtml(
              report.theirVoiceNow.letter.replace(/\n\n/g, "<br /><br />"),
            ),
          }}
        />
        {report.theirVoiceNow.signoff && (
          <p
            className="text-right text-[0.95rem] text-[#5a4a42] italic mt-6 pt-4 border-t border-[#e4d6b8]"
            style={{ fontFamily: "DM Serif Display, serif" }}
          >
            {report.theirVoiceNow.signoff}
          </p>
        )}
      </SectionFrame>

      <ThinRule />

      {/* ── GRIEF COMPASS ───────────────────────────────────────────────── */}
      <SectionFrame
        eyebrow="Your Grief"
        title={report.griefCompass.title || "The shape of the missing"}
        tone="sage"
      >
        <BodyText>{report.griefCompass.content}</BodyText>
        {report.griefCompass.youAreNotDoingThisWrong && (
          <div className="mt-6">
            <PullQuote>{report.griefCompass.youAreNotDoingThisWrong}</PullQuote>
          </div>
        )}
      </SectionFrame>

      <ThinRule />

      {/* ── RITUALS ─────────────────────────────────────────────────────── */}
      <SectionFrame
        eyebrow="Rituals"
        title={report.ritualsForRemembering.title || `Rituals written in ${petName}'s chart`}
        tone="cream"
      >
        <div className="space-y-6">
          {report.ritualsForRemembering.rituals.map((ritual, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex-shrink-0 mt-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: "#c4a265" }}
                />
              </div>
              <div className="flex-1">
                <div
                  className="text-[0.58rem] font-semibold tracking-[2.5px] uppercase mb-1"
                  style={{ color: "#8fa082" }}
                >
                  {["Daily", "Weekly", "Monthly"][i] || `Ritual ${i + 1}`}
                </div>
                <BodyText>{ritual}</BodyText>
              </div>
            </div>
          ))}
        </div>
        {report.ritualsForRemembering.anchorObject && (
          <div
            className="mt-7 p-4 rounded-[12px]"
            style={{ background: "#f4f6f0" }}
          >
            <div
              className="text-[0.6rem] font-semibold tracking-[2px] uppercase mb-1.5"
              style={{ color: "#5a6b4a" }}
            >
              An Anchor Object
            </div>
            <BodyText>{report.ritualsForRemembering.anchorObject}</BodyText>
          </div>
        )}
      </SectionFrame>

      <ThinRule />

      {/* ── THREE PERMISSION SLIPS ──────────────────────────────────────── */}
      <SectionFrame
        eyebrow="Permission"
        title={
          report.threePermissionSlips.title || `What ${petName} wants you to know`
        }
        tone="gold"
      >
        <div className="space-y-6">
          {report.threePermissionSlips.slips.map((slip, i) => (
            <div key={i}>
              <div
                className="text-[0.6rem] font-semibold tracking-[2px] uppercase mb-1.5"
                style={{ color: "#c4a265" }}
              >
                Permission Slip {i + 1}
              </div>
              <BodyText>{slip}</BodyText>
            </div>
          ))}
        </div>
      </SectionFrame>

      <ThinRule />

      {/* ── ANNIVERSARY GUIDE ───────────────────────────────────────────── */}
      <SectionFrame
        eyebrow="The Days"
        title={
          report.anniversaryGuide.title || "The days that will ask something of you"
        }
        tone="dove"
      >
        <div className="space-y-5">
          <div>
            <div
              className="text-[0.6rem] font-semibold tracking-[2px] uppercase mb-1.5"
              style={{ color: "#c4a265" }}
            >
              Their Birthday
            </div>
            <BodyText>{report.anniversaryGuide.birthday}</BodyText>
          </div>
          <div>
            <div
              className="text-[0.6rem] font-semibold tracking-[2px] uppercase mb-1.5"
              style={{ color: "#8fa082" }}
            >
              The Day They Went
            </div>
            <BodyText>{report.anniversaryGuide.passingDay}</BodyText>
          </div>
          {report.anniversaryGuide.hardRandomDays && (
            <>
              <div className="my-1 border-t border-[#e0dace]" />
              <BodyText>{report.anniversaryGuide.hardRandomDays}</BodyText>
            </>
          )}
        </div>
      </SectionFrame>

      <ThinRule />

      {/* ── A TREAT FOR THEIR MEMORY (optional) ─────────────────────────── */}
      {report.aTreatForTheirMemory && (
        <>
          <SectionFrame
            eyebrow="In Their Memory"
            title={
              report.aTreatForTheirMemory.title ||
              `Something you can make for ${petName}`
            }
            tone="cream"
          >
            <BodyText>{report.aTreatForTheirMemory.description}</BodyText>
            <div className="mt-6">
              <div
                className="text-[0.6rem] font-semibold tracking-[2px] uppercase mb-2"
                style={{ color: "#c4a265" }}
              >
                What You Gather
              </div>
              <ul className="space-y-1.5">
                {report.aTreatForTheirMemory.ingredients.map((ing, i) => (
                  <li
                    key={i}
                    className="text-[0.92rem] leading-[1.75] text-[#3d2f2a] pl-4 border-l-2"
                    style={{ borderColor: "#e4d6b8" }}
                  >
                    {ing}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-5">
              <div
                className="text-[0.6rem] font-semibold tracking-[2px] uppercase mb-2"
                style={{ color: "#c4a265" }}
              >
                The Ritual
              </div>
              <ol className="space-y-1.5 list-decimal pl-5">
                {report.aTreatForTheirMemory.steps.map((step, i) => (
                  <li
                    key={i}
                    className="text-[0.92rem] leading-[1.75] text-[#3d2f2a]"
                  >
                    {step}
                  </li>
                ))}
              </ol>
            </div>
            {report.aTreatForTheirMemory.whenToMake && (
              <p className="mt-6 text-[0.88rem] text-[#5a4a42] italic">
                {report.aTreatForTheirMemory.whenToMake}
              </p>
            )}
          </SectionFrame>
          <ThinRule />
        </>
      )}

      {/* ── WHEN ANOTHER ARRIVES (optional) ─────────────────────────────── */}
      {report.whenAnotherArrives && (
        <>
          <SectionFrame
            eyebrow="Someday"
            title={report.whenAnotherArrives.title || "If another arrives"}
            tone="sage"
          >
            <BodyText>{report.whenAnotherArrives.content}</BodyText>
            {report.whenAnotherArrives.signToWatchFor && (
              <div className="mt-5">
                <PullQuote>{report.whenAnotherArrives.signToWatchFor}</PullQuote>
              </div>
            )}
          </SectionFrame>
          <ThinRule />
        </>
      )}

      {/* ── KEEPER'S OATH ───────────────────────────────────────────────── */}
      <SectionFrame
        eyebrow="The Vow"
        title={report.keepersOath.title || "What you carry"}
        tone="gold"
      >
        <div
          className="text-[1.05rem] leading-[2] text-[#2d2428] whitespace-pre-wrap text-center"
          style={{ fontFamily: "DM Serif Display, serif" }}
          dangerouslySetInnerHTML={{
            __html: safeHtml(report.keepersOath.oath),
          }}
        />
      </SectionFrame>

      <ThinRule />

      {/* ── EPILOGUE (final letter) ─────────────────────────────────────── */}
      <SectionFrame tone="cream">
        <div
          className="text-[1rem] leading-[2.05] text-[#2d2428]"
          style={{ fontFamily: "DM Serif Display, serif" }}
          dangerouslySetInnerHTML={{
            __html: safeHtml(report.epilogue.replace(/\n\n/g, "<br /><br />")),
          }}
        />
      </SectionFrame>

      {/* ── FINAL MOMENT ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="text-center py-16 px-6 max-w-[520px] mx-auto"
      >
        <div className="flex justify-center mb-6" aria-hidden>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="12" stroke="#c4a265" strokeWidth="0.75" opacity="0.6" />
            <circle cx="14" cy="14" r="2.5" fill="#c4a265" />
          </svg>
        </div>
        <p
          className="text-[0.95rem] text-[#5a4a42] italic leading-[1.9]"
          style={{ fontFamily: "DM Serif Display, serif" }}
        >
          Return to this reading whenever {he} needs to hear you
          <br />
          or you need to hear {he === "they" ? "them" : he === "he" ? "him" : "her"}.
        </p>

        {/* Keepsake + share — intentionally placed after the benediction so
            the first pass through is undisturbed. Kept visible in quiet-revisit
            mode too, since a returning owner may come back specifically to
            save the reading or send it to a family member. */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <MemorialPDFDownload
            petName={petName}
            reportContent={report}
            years={yearsString}
          />
          <MemorialShareButton
            petName={petName}
            reportId={reportId}
            shareToken={shareToken}
            years={yearsString}
          />
        </div>

        <div className="mt-10 text-[0.6rem] font-semibold tracking-[3px] uppercase" style={{ color: "#8fa082" }}>
          Held in Remembrance
        </div>
      </motion.div>

      <div className="pb-24" />
    </div>
  );
}
