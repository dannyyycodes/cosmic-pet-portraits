/**
 * MemorialPDFDownload — the quiet, letterpress-feeling companion file for a
 * memorial reading. Never called "download PDF" in-copy; we name it
 * "Save as a keepsake" because the container is the point, not the bytes.
 *
 * Font limitation worth flagging: jsPDF ships with Helvetica, Courier, and
 * Times (14 standard PDF fonts). We can't easily embed DM Serif Display /
 * Cormorant client-side without shipping TTF blobs, so we use Times as the
 * serif family throughout. Times has real italic + bold and is the closest
 * thing to a reverent, "printed letter" aesthetic that the jsPDF default set
 * allows. A future version could embed the real fonts via doc.addFileToVFS +
 * doc.addFont if Danny wants pixel-perfect parity with the on-screen viewer.
 *
 * Palette mirrors MemorialReportViewer:
 *   bg cream        #fbfaf6
 *   bg dove         #f8f5ee
 *   text warm brown #2d2428
 *   muted brown     #5a4a42
 *   gold rule       #c4a265
 *   sage small-cap  #8fa082
 */

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { MemorialReportContent } from './types';

interface MemorialPDFDownloadProps {
  petName: string;
  reportContent: MemorialReportContent;
  /** Optional years string e.g. "2015 – 2024". Rendered under the title. */
  years?: string;
}

// Hex -> rgb tuple
const rgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
};

const COLOR = {
  cream: rgb('#fbfaf6'),
  dove: rgb('#f8f5ee'),
  text: rgb('#2d2428'),
  muted: rgb('#5a4a42'),
  softBrown: rgb('#3d2f2a'),
  gold: rgb('#c4a265'),
  sage: rgb('#8fa082'),
  divider: rgb('#e0dace'),
} as const;

export function MemorialPDFDownload({
  petName,
  reportContent,
  years,
}: MemorialPDFDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const { jsPDF } = await import('jspdf');

      // Letter-sized PDF in points so typography measurements feel like real
      // print design rather than millimetres. 612 x 792 pt.
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'letter',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginX = 50;
      const marginTop = 60;
      const marginBottom = 60;
      const contentWidth = pageWidth - marginX * 2;
      let y = marginTop;

      // ── Helpers ────────────────────────────────────────────────────────────
      const paintBg = () => {
        doc.setFillColor(...COLOR.cream);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
      };

      const newPage = () => {
        doc.addPage();
        paintBg();
        y = marginTop;
      };

      const ensureSpace = (needed: number) => {
        if (y + needed > pageHeight - marginBottom) {
          newPage();
          return true;
        }
        return false;
      };

      const centerText = (text: string, yPos: number, size: number) => {
        doc.setFontSize(size);
        const w = doc.getTextWidth(text);
        doc.text(text, (pageWidth - w) / 2, yPos);
      };

      const wrap = (text: string, maxWidth: number): string[] => {
        if (!text) return [];
        return doc.splitTextToSize(String(text), maxWidth);
      };

      // A thin gold rule — used as a decorative divider between sections.
      const thinGoldRule = (width = 60) => {
        doc.setDrawColor(...COLOR.gold);
        doc.setLineWidth(0.4);
        const x1 = (pageWidth - width) / 2;
        doc.line(x1, y, x1 + width, y);
      };

      // Body paragraph: Times, 11pt, 1.6 line-height, warm brown.
      const paragraph = (text: string, opts?: { italic?: boolean; color?: readonly [number, number, number]; size?: number; indent?: number }) => {
        if (!text) return;
        const size = opts?.size ?? 11;
        const italic = opts?.italic ?? false;
        const color = opts?.color ?? COLOR.softBrown;
        const indent = opts?.indent ?? 0;

        doc.setFont('times', italic ? 'italic' : 'normal');
        doc.setFontSize(size);
        doc.setTextColor(...color);

        const lineHeight = size * 1.6;
        const lines = wrap(text.replace(/\n\n+/g, '\n\n'), contentWidth - indent);
        for (const line of lines) {
          ensureSpace(lineHeight);
          doc.text(line, marginX + indent, y);
          y += lineHeight;
        }
        y += 4; // small trailing gap between paragraphs
      };

      // Section eyebrow: sage, small-caps feel via uppercased text with tracking.
      const eyebrow = (text: string) => {
        ensureSpace(24);
        doc.setFont('times', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...COLOR.sage);
        // Manual letter-spacing approximation: insert a space between each char.
        const tracked = text.toUpperCase().split('').join(' ');
        doc.text(tracked, marginX, y);
        y += 16;
      };

      // Section title: Times (serif fallback for DM Serif Display), 20pt, dark.
      const sectionTitle = (text: string) => {
        ensureSpace(34);
        doc.setFont('times', 'normal');
        doc.setFontSize(20);
        doc.setTextColor(...COLOR.text);
        const lines = wrap(text, contentWidth);
        for (const line of lines) {
          ensureSpace(28);
          doc.text(line, marginX, y);
          y += 26;
        }
        y += 6;
      };

      const pullQuote = (text: string) => {
        if (!text) return;
        ensureSpace(60);
        y += 8;
        doc.setFont('times', 'italic');
        doc.setFontSize(13);
        doc.setTextColor(...COLOR.text);
        const lines = wrap(`\u201C${text}\u201D`, contentWidth - 60);
        for (const line of lines) {
          ensureSpace(22);
          const w = doc.getTextWidth(line);
          doc.text(line, (pageWidth - w) / 2, y);
          y += 20;
        }
        y += 10;
      };

      const sectionDivider = () => {
        ensureSpace(30);
        y += 12;
        thinGoldRule(50);
        y += 16;
      };

      const subEyebrow = (text: string, color: readonly [number, number, number] = COLOR.gold) => {
        ensureSpace(20);
        doc.setFont('times', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...color);
        const tracked = text.toUpperCase().split('').join(' ');
        doc.text(tracked, marginX, y);
        y += 12;
      };

      // ── PAGE 1: Title page ────────────────────────────────────────────────
      paintBg();

      // Top gold hairline
      doc.setDrawColor(...COLOR.gold);
      doc.setLineWidth(0.6);
      doc.line(marginX, 50, pageWidth - marginX, 50);

      // Centred eyebrow
      y = pageHeight * 0.32;
      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...COLOR.sage);
      const tracked = 'IN REMEMBRANCE'.split('').join(' ');
      const tw = doc.getTextWidth(tracked);
      doc.text(tracked, (pageWidth - tw) / 2, y);
      y += 46;

      // Pet name (serif, large)
      doc.setFont('times', 'normal');
      doc.setTextColor(...COLOR.text);
      centerText(petName, y, 48);
      y += 26;

      // Years (italic serif)
      if (years) {
        doc.setFont('times', 'italic');
        doc.setTextColor(...COLOR.muted);
        centerText(years, y, 16);
        y += 28;
      }

      // Thin gold rule
      y += 12;
      thinGoldRule(80);
      y += 32;

      // Subtitle line
      doc.setFont('times', 'italic');
      doc.setTextColor(...COLOR.muted);
      centerText('A reading held in remembrance', y, 13);

      // Bottom signature on title page
      doc.setFont('times', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLOR.sage);
      const signature = `A Little Souls memorial for ${petName}`.toUpperCase().split('').join(' ');
      const sw = doc.getTextWidth(signature);
      doc.text(signature, (pageWidth - sw) / 2, pageHeight - 54);

      // ── INTERIOR PAGES ────────────────────────────────────────────────────
      newPage();

      // Prologue (opens quietly, no eyebrow)
      if (reportContent.prologue) {
        paragraph(reportContent.prologue);
        sectionDivider();
      }

      // Name meaning
      if (reportContent.nameMeaning) {
        eyebrow('The Name');
        sectionTitle(`The meaning of "${petName}"`);
        paragraph(reportContent.nameMeaning.origin);
        paragraph(reportContent.nameMeaning.cosmicSignificance);
        if (reportContent.nameMeaning.numerologyMeaning) {
          paragraph(reportContent.nameMeaning.numerologyMeaning);
        }
        if (reportContent.nameMeaning.memorialNote) {
          pullQuote(reportContent.nameMeaning.memorialNote);
        }
        sectionDivider();
      }

      // Who they were
      if (reportContent.whoTheyWere) {
        eyebrow('Chart Reading');
        sectionTitle(reportContent.whoTheyWere.title || `Who ${petName} was`);
        paragraph(reportContent.whoTheyWere.threeTruths);
        if (reportContent.whoTheyWere.goldenThread) {
          pullQuote(reportContent.whoTheyWere.goldenThread);
        }
        sectionDivider();
      }

      // Gifts
      if (reportContent.giftsTheyBrought) {
        eyebrow('What They Gave');
        sectionTitle(reportContent.giftsTheyBrought.title || `What ${petName} gave you`);
        const giftLabels = ['The First Gift', 'The Second', 'The Third'];
        reportContent.giftsTheyBrought.gifts?.forEach((gift, i) => {
          subEyebrow(giftLabels[i] || `Gift ${i + 1}`);
          paragraph(gift);
        });
        if (reportContent.giftsTheyBrought.quietestGift) {
          subEyebrow('The Quietest Gift');
          paragraph(reportContent.giftsTheyBrought.quietestGift);
        }
        sectionDivider();
      }

      // The Bridge (lessons)
      if (reportContent.theBridge) {
        eyebrow('Lessons');
        sectionTitle(reportContent.theBridge.title || `What ${petName} taught you`);
        reportContent.theBridge.lessons?.forEach((lesson, i) => {
          paragraph(`${i + 1}.  ${lesson}`, { indent: 12 });
        });
        if (reportContent.theBridge.quotableLine) {
          pullQuote(reportContent.theBridge.quotableLine);
        }
        sectionDivider();
      }

      // Soul still speaks
      if (reportContent.soulStillSpeaks) {
        eyebrow('What Lives On');
        sectionTitle(reportContent.soulStillSpeaks.title || 'The soul still speaks');
        paragraph(reportContent.soulStillSpeaks.content);
        if (reportContent.soulStillSpeaks.signatureYouCarry) {
          subEyebrow('What You Carry Now');
          paragraph(reportContent.soulStillSpeaks.signatureYouCarry);
        }
        if (reportContent.soulStillSpeaks.smallSigns?.length) {
          subEyebrow('Small Signs to Watch For', COLOR.sage);
          reportContent.soulStillSpeaks.smallSigns.forEach((sign) => {
            paragraph(`—  ${sign}`, { indent: 10, italic: true, color: COLOR.muted });
          });
        }
        sectionDivider();
      }

      // Their voice now — the letter
      if (reportContent.theirVoiceNow) {
        eyebrow('A Letter From Them');
        sectionTitle(reportContent.theirVoiceNow.title || `If ${petName} could speak to you now`);
        // Letter body — italic serif for letter feel.
        const letterParts = String(reportContent.theirVoiceNow.letter || '').split(/\n\n+/);
        for (const part of letterParts) {
          paragraph(part, { italic: true, size: 11, color: COLOR.text });
        }
        if (reportContent.theirVoiceNow.signoff) {
          ensureSpace(24);
          y += 6;
          doc.setFont('times', 'italic');
          doc.setFontSize(11);
          doc.setTextColor(...COLOR.muted);
          const sig = reportContent.theirVoiceNow.signoff;
          const sigW = doc.getTextWidth(sig);
          doc.text(sig, pageWidth - marginX - sigW, y);
          y += 20;
        }
        sectionDivider();
      }

      // Grief compass
      if (reportContent.griefCompass) {
        eyebrow('Your Grief');
        sectionTitle(reportContent.griefCompass.title || 'The shape of the missing');
        paragraph(reportContent.griefCompass.content);
        if (reportContent.griefCompass.youAreNotDoingThisWrong) {
          pullQuote(reportContent.griefCompass.youAreNotDoingThisWrong);
        }
        sectionDivider();
      }

      // Rituals
      if (reportContent.ritualsForRemembering) {
        eyebrow('Ways to Remember');
        sectionTitle(reportContent.ritualsForRemembering.title || `Rituals written in ${petName}'s chart`);
        const ritualLabels = ['Daily', 'Weekly', 'Monthly'];
        reportContent.ritualsForRemembering.rituals?.forEach((ritual, i) => {
          subEyebrow(ritualLabels[i] || `Ritual ${i + 1}`, COLOR.sage);
          paragraph(ritual);
        });
        if (reportContent.ritualsForRemembering.anchorObject) {
          subEyebrow('An Anchor Object', COLOR.sage);
          paragraph(reportContent.ritualsForRemembering.anchorObject);
        }
        sectionDivider();
      }

      // Three permissions
      if (reportContent.threePermissionSlips) {
        eyebrow('Permission');
        sectionTitle(reportContent.threePermissionSlips.title || `What ${petName} wants you to know`);
        const slipLabels = ['First Permission', 'Second Permission', 'Third Permission'];
        reportContent.threePermissionSlips.slips?.forEach((slip, i) => {
          subEyebrow(slipLabels[i] || `Permission ${i + 1}`);
          paragraph(slip);
        });
        sectionDivider();
      }

      // Anniversary guide
      if (reportContent.anniversaryGuide) {
        eyebrow('The Days');
        sectionTitle(reportContent.anniversaryGuide.title || 'The days that will ask something of you');
        subEyebrow('Their Birthday');
        paragraph(reportContent.anniversaryGuide.birthday);
        subEyebrow('The Day They Went', COLOR.sage);
        paragraph(reportContent.anniversaryGuide.passingDay);
        if (reportContent.anniversaryGuide.hardRandomDays) {
          paragraph(reportContent.anniversaryGuide.hardRandomDays);
        }
        sectionDivider();
      }

      // A treat for their memory (optional)
      if (reportContent.aTreatForTheirMemory) {
        eyebrow('In Their Memory');
        sectionTitle(reportContent.aTreatForTheirMemory.title || `Something you can make for ${petName}`);
        paragraph(reportContent.aTreatForTheirMemory.description);
        if (reportContent.aTreatForTheirMemory.ingredients?.length) {
          subEyebrow('What You Gather');
          reportContent.aTreatForTheirMemory.ingredients.forEach((ing) => {
            paragraph(`—  ${ing}`, { indent: 10 });
          });
        }
        if (reportContent.aTreatForTheirMemory.steps?.length) {
          subEyebrow('The Ritual');
          reportContent.aTreatForTheirMemory.steps.forEach((step, i) => {
            paragraph(`${i + 1}.  ${step}`, { indent: 12 });
          });
        }
        if (reportContent.aTreatForTheirMemory.whenToMake) {
          paragraph(reportContent.aTreatForTheirMemory.whenToMake, { italic: true, color: COLOR.muted });
        }
        sectionDivider();
      }

      // When another arrives (optional)
      if (reportContent.whenAnotherArrives) {
        eyebrow('Someday');
        sectionTitle(reportContent.whenAnotherArrives.title || 'When another arrives');
        paragraph(reportContent.whenAnotherArrives.content);
        if (reportContent.whenAnotherArrives.signToWatchFor) {
          pullQuote(reportContent.whenAnotherArrives.signToWatchFor);
        }
        sectionDivider();
      }

      // Keeper's oath
      if (reportContent.keepersOath) {
        eyebrow('The Vow');
        sectionTitle(reportContent.keepersOath.title || 'What you carry');
        // Oath is centred italic — treat like a pullquote block
        const oathLines = String(reportContent.keepersOath.oath || '').split(/\n+/);
        for (const line of oathLines) {
          if (!line.trim()) { y += 6; continue; }
          ensureSpace(22);
          doc.setFont('times', 'italic');
          doc.setFontSize(12);
          doc.setTextColor(...COLOR.text);
          const wrapped = wrap(line, contentWidth - 80);
          for (const w of wrapped) {
            ensureSpace(20);
            const width = doc.getTextWidth(w);
            doc.text(w, (pageWidth - width) / 2, y);
            y += 20;
          }
        }
        sectionDivider();
      }

      // Epilogue (closing letter — italic serif, no eyebrow)
      if (reportContent.epilogue) {
        const parts = String(reportContent.epilogue).split(/\n\n+/);
        for (const part of parts) {
          paragraph(part, { italic: true, color: COLOR.text, size: 11 });
        }
      }

      // Closing benediction
      ensureSpace(80);
      y += 24;
      thinGoldRule(40);
      y += 22;
      doc.setFont('times', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLOR.sage);
      const heldTracked = 'HELD IN REMEMBRANCE'.split('').join(' ');
      const htw = doc.getTextWidth(heldTracked);
      doc.text(heldTracked, (pageWidth - htw) / 2, y);

      // ── Footers on every page ─────────────────────────────────────────────
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont('times', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(...COLOR.sage);
        const footerText = `— A Little Souls memorial for ${petName}`;
        doc.text(footerText, marginX, pageHeight - 28);
        doc.text(`${i}`, pageWidth - marginX - 10, pageHeight - 28);
      }

      // ── Save ──────────────────────────────────────────────────────────────
      const fileName = `${petName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-memorial.pdf`;
      doc.save(fileName);
      toast.success('Your keepsake is saved.');
    } catch (error) {
      console.error('Memorial PDF generation error:', error);
      toast.error('Something went quiet. Please try once more.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={generatePDF}
      disabled={isGenerating}
      variant="outline"
      className="gap-2"
      style={{
        borderColor: '#8fa082',
        color: '#2d2428',
        background: 'transparent',
        fontFamily: "'DM Serif Display', Georgia, serif",
        padding: '0.85rem 1.5rem',
        borderRadius: '10px',
      }}
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Preparing the keepsake…</span>
        </>
      ) : (
        <span>Save as a keepsake</span>
      )}
    </Button>
  );
}
