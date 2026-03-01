import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface ReportPDFDownloadProps {
  petName: string;
  reportContent: any;
}

export function ReportPDFDownload({ petName, reportContent }: ReportPDFDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { t } = useLanguage();

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      // Colors
      const colors = {
        bg: [15, 10, 31] as [number, number, number],
        bgLight: [25, 18, 45] as [number, number, number],
        accent: [168, 85, 247] as [number, number, number],
        accentLight: [200, 140, 255] as [number, number, number],
        gold: [255, 215, 0] as [number, number, number],
        text: [240, 240, 240] as [number, number, number],
        textMuted: [160, 160, 180] as [number, number, number],
        green: [34, 197, 94] as [number, number, number],
      };

      // Helper: new page with background
      const addPageWithBg = () => {
        doc.addPage();
        doc.setFillColor(...colors.bg);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        y = margin;
      };

      // Helper: check space and add page if needed
      const checkSpace = (needed: number) => {
        if (y + needed > pageHeight - margin) {
          addPageWithBg();
          return true;
        }
        return false;
      };

      // Helper: center text
      const centerText = (text: string, yPos: number) => {
        const textWidth = doc.getTextWidth(text);
        doc.text(text, (pageWidth - textWidth) / 2, yPos);
      };

      // Helper: wrap text with proper line handling
      const wrapText = (text: string, maxWidth: number): string[] => {
        if (!text) return [];
        return doc.splitTextToSize(String(text), maxWidth);
      };

      // === PAGE 1: Cover ===
      doc.setFillColor(...colors.bg);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // Decorative header line
      doc.setFillColor(...colors.accent);
      doc.rect(0, 0, pageWidth, 3, 'F');

      y = 40;

      // Title
      doc.setTextColor(...colors.accentLight);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      centerText('✧ COSMIC PET ASTROLOGY ✧', y);
      y += 20;

      // Pet name
      doc.setTextColor(...colors.text);
      doc.setFontSize(36);
      doc.setFont('helvetica', 'bold');
      centerText(petName.toUpperCase(), y);
      y += 15;

      // Archetype
      if (reportContent.archetype?.name) {
        doc.setTextColor(...colors.gold);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'italic');
        centerText(reportContent.archetype.name, y);
        y += 25;
      }

      // Chart summary box
      const sunSign = reportContent.chartPlacements?.sun?.sign || 'Unknown';
      const moonSign = reportContent.chartPlacements?.moon?.sign || 'Unknown';
      const rising = reportContent.chartPlacements?.ascendant?.sign || 'Unknown';

      doc.setFillColor(...colors.bgLight);
      doc.roundedRect(margin, y, contentWidth, 25, 4, 4, 'F');
      
      doc.setTextColor(...colors.text);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      centerText(`☉ ${sunSign} Sun  •  ☽ ${moonSign} Moon  •  ↑ ${rising} Rising`, y + 15);
      y += 35;

      // Prologue
      if (reportContent.prologue) {
        doc.setFillColor(...colors.bgLight);
        doc.roundedRect(margin, y, contentWidth, 50, 4, 4, 'F');
        
        doc.setTextColor(...colors.textMuted);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        const prologueLines = wrapText(reportContent.prologue, contentWidth - 16);
        let prologueY = y + 10;
        for (const line of prologueLines.slice(0, 6)) {
          doc.text(line, margin + 8, prologueY);
          prologueY += 6;
        }
        y += 60;
      }

      // Elemental balance
      if (reportContent.elementalBalance) {
        y += 10;
        doc.setTextColor(...colors.accentLight);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        centerText('✦ Elemental Balance ✦', y);
        y += 12;

        const elements = ['Fire', 'Earth', 'Air', 'Water'];
        const elementSymbols: Record<string, string> = {
          Fire: '🔥',
          Earth: '🌍',
          Air: '💨',
          Water: '💧'
        };
        
        const barWidth = (contentWidth - 30) / 4;
        elements.forEach((el, i) => {
          const x = margin + 15 + (i * barWidth);
          const pct = reportContent.elementalBalance[el] || 0;
          
          doc.setTextColor(...colors.textMuted);
          doc.setFontSize(9);
          doc.text(`${elementSymbols[el]} ${pct}%`, x, y);
        });
        y += 20;
      }

      // Cosmic nickname
      if (reportContent.cosmicNickname?.nickname) {
        doc.setFillColor(...colors.bgLight);
        doc.roundedRect(margin, y, contentWidth, 20, 4, 4, 'F');
        
        doc.setTextColor(...colors.gold);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        centerText(`"${reportContent.cosmicNickname.nickname}"`, y + 13);
        y += 30;
      }

      // === CONTENT PAGES ===
      const renderSection = (section: any, icon: string, fallbackTitle: string) => {
        if (!section) return;
        
        checkSpace(60);

        // Section header
        doc.setFillColor(...colors.bgLight);
        doc.roundedRect(margin, y, contentWidth, 10, 3, 3, 'F');
        
        doc.setTextColor(...colors.accent);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        const title = section.title || fallbackTitle;
        doc.text(`${icon}  ${title}`, margin + 5, y + 7);
        y += 15;

        // Planet explanation
        if (section.planetExplanation) {
          doc.setTextColor(...colors.textMuted);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'italic');
          const explLines = wrapText(section.planetExplanation, contentWidth - 10);
          for (const line of explLines.slice(0, 2)) {
            doc.text(line, margin + 3, y);
            y += 5;
          }
          y += 3;
        }

        // Main content
        if (section.content) {
          doc.setTextColor(...colors.text);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          const contentLines = wrapText(section.content, contentWidth - 6);
          for (const line of contentLines) {
            checkSpace(6);
            doc.text(line, margin + 3, y);
            y += 5;
          }
          y += 5;
        }

        // Relatable moment
        if (section.relatable_moment) {
          checkSpace(20);
          doc.setTextColor(...colors.accentLight);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'italic');
          const momentLines = wrapText(`"${section.relatable_moment}"`, contentWidth - 10);
          for (const line of momentLines.slice(0, 2)) {
            doc.text(line, margin + 5, y);
            y += 5;
          }
          y += 3;
        }

        // Practical tip
        if (section.practicalTip) {
          checkSpace(20);
          doc.setTextColor(...colors.green);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text('💡 Tip:', margin + 3, y);
          y += 5;
          doc.setTextColor(...colors.textMuted);
          doc.setFont('helvetica', 'normal');
          const tipLines = wrapText(section.practicalTip, contentWidth - 15);
          for (const line of tipLines.slice(0, 3)) {
            doc.text(line, margin + 8, y);
            y += 5;
          }
        }

        y += 10;
      };

      // Render main sections
      addPageWithBg();
      
      const sections = [
        { data: reportContent.solarSoulprint, icon: '☉', title: 'Solar Soulprint' },
        { data: reportContent.lunarHeart, icon: '☽', title: 'Lunar Heart' },
        { data: reportContent.cosmicCuriosity, icon: '☿', title: 'Cosmic Curiosity' },
        { data: reportContent.harmonyHeartbeats, icon: '♀', title: 'Harmony & Heartbeats' },
        { data: reportContent.spiritOfMotion, icon: '♂', title: 'Spirit of Motion' },
        { data: reportContent.starlitGaze, icon: '↑', title: 'Starlit Gaze' },
        { data: reportContent.destinyCompass, icon: '☊', title: 'Destiny Compass' },
        { data: reportContent.gentleHealer, icon: '⚷', title: 'Gentle Healer' },
        { data: reportContent.wildSpirit, icon: '⚸', title: 'Wild Spirit' },
      ];

      for (const section of sections) {
        renderSection(section.data, section.icon, section.title);
      }

      // === FUN SECTIONS ===
      if (reportContent.memePersonality) {
        checkSpace(50);
        doc.setFillColor(...colors.bgLight);
        doc.roundedRect(margin, y, contentWidth, 8, 3, 3, 'F');
        doc.setTextColor(...colors.gold);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('😼 ' + (reportContent.memePersonality.title || 'Internet Personality'), margin + 5, y + 6);
        y += 12;

        if (reportContent.memePersonality.type) {
          doc.setTextColor(...colors.accent);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(reportContent.memePersonality.type, margin + 5, y);
          y += 8;
        }

        if (reportContent.memePersonality.description) {
          doc.setTextColor(...colors.text);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          const descLines = wrapText(reportContent.memePersonality.description, contentWidth - 10);
          for (const line of descLines.slice(0, 3)) {
            doc.text(line, margin + 5, y);
            y += 5;
          }
        }
        y += 10;
      }

      // Top 5 Crimes
      if (reportContent.topFiveCrimes?.crimes) {
        checkSpace(60);
        doc.setFillColor(...colors.bgLight);
        doc.roundedRect(margin, y, contentWidth, 8, 3, 3, 'F');
        doc.setTextColor(...colors.gold);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('🚨 ' + (reportContent.topFiveCrimes.title || 'Criminal Record'), margin + 5, y + 6);
        y += 14;

        doc.setTextColor(...colors.text);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        const crimes = reportContent.topFiveCrimes.crimes.slice(0, 5);
        crimes.forEach((crime: string, i: number) => {
          checkSpace(12);
          const crimeLines = wrapText(`${i + 1}. ${crime}`, contentWidth - 15);
          for (const line of crimeLines.slice(0, 2)) {
            doc.text(line, margin + 5, y);
            y += 5;
          }
          y += 2;
        });
        y += 5;
      }

      // Dating Profile
      if (reportContent.datingProfile) {
        checkSpace(50);
        doc.setFillColor(...colors.bgLight);
        doc.roundedRect(margin, y, contentWidth, 8, 3, 3, 'F');
        doc.setTextColor(...colors.gold);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('💕 ' + (reportContent.datingProfile.title || 'Dating Profile'), margin + 5, y + 6);
        y += 14;

        if (reportContent.datingProfile.headline) {
          doc.setTextColor(...colors.accent);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text(`"${reportContent.datingProfile.headline}"`, margin + 5, y);
          y += 8;
        }

        if (reportContent.datingProfile.bio) {
          doc.setTextColor(...colors.text);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          const bioLines = wrapText(reportContent.datingProfile.bio, contentWidth - 10);
          for (const line of bioLines.slice(0, 4)) {
            doc.text(line, margin + 5, y);
            y += 5;
          }
        }
        y += 10;
      }

      // === LUCKY ELEMENTS ===
      if (reportContent.luckyElements) {
        checkSpace(45);
        doc.setFillColor(40, 30, 60);
        doc.roundedRect(margin, y, contentWidth, 35, 5, 5, 'F');
        
        doc.setTextColor(...colors.gold);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        centerText('✨ Lucky Elements ✨', y + 12);
        
        const lucky = reportContent.luckyElements;
        doc.setTextColor(...colors.text);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        centerText(`Number: ${lucky.luckyNumber || '?'}  •  Day: ${lucky.luckyDay || '?'}  •  Color: ${lucky.luckyColor || '?'}`, y + 24);
        y += 45;
      }

      // === EPILOGUE ===
      if (reportContent.epilogue) {
        checkSpace(40);
        doc.setDrawColor(...colors.accent);
        doc.setLineWidth(0.3);
        doc.line(margin + 20, y, pageWidth - margin - 20, y);
        y += 10;

        doc.setTextColor(...colors.textMuted);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        const epilogueLines = wrapText(reportContent.epilogue, contentWidth - 20);
        for (const line of epilogueLines.slice(0, 5)) {
          checkSpace(6);
          centerText(line, y);
          y += 6;
        }
      }

      // Footer on all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setTextColor(100, 100, 120);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Little Souls • Cosmic Pet Astrology', margin, pageHeight - 8);
        doc.text(`${i} / ${totalPages}`, pageWidth - margin - 10, pageHeight - 8);
      }

      // Save
      const fileName = `${petName.toLowerCase().replace(/\s+/g, '-')}-cosmic-report.pdf`;
      doc.save(fileName);
      toast.success(t('report.pdfSuccess') || 'PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error(t('report.pdfError') || 'Failed to generate PDF. Please try again.');
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
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {t('report.generatingPdf') || 'Generating PDF...'}
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          {t('report.downloadPdf') || 'Download PDF'}
        </>
      )}
    </Button>
  );
}
