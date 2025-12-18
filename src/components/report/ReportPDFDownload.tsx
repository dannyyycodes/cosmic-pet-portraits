import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ReportPDFDownloadProps {
  petName: string;
  reportContent: any;
}

export function ReportPDFDownload({ petName, reportContent }: ReportPDFDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      // Dynamic import for pdf generation
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let y = margin;

      // Helper functions
      const addNewPageIfNeeded = (requiredSpace: number) => {
        if (y + requiredSpace > pageHeight - margin) {
          doc.addPage();
          y = margin;
          return true;
        }
        return false;
      };

      const centerText = (text: string, yPos: number, fontSize: number = 12) => {
        doc.setFontSize(fontSize);
        const textWidth = doc.getTextWidth(text);
        doc.text(text, (pageWidth - textWidth) / 2, yPos);
      };

      // Background gradient effect (simplified)
      doc.setFillColor(15, 10, 31);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // Title Section
      doc.setTextColor(168, 85, 247);
      doc.setFontSize(12);
      centerText('✧ COSMIC PET ASTROLOGY ✧', y, 12);
      y += 15;

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(32);
      centerText(petName, y, 32);
      y += 12;

      doc.setTextColor(168, 85, 247);
      doc.setFontSize(14);
      centerText(reportContent.archetype?.name || 'Cosmic Soul', y, 14);
      y += 20;

      // Sun, Moon, Rising
      const sunSign = reportContent.chartPlacements?.sun?.sign || 'Aries';
      const moonSign = reportContent.chartPlacements?.moon?.sign || 'Cancer';
      const rising = reportContent.chartPlacements?.ascendant?.sign || 'Leo';
      const element = reportContent.dominantElement || 'Fire';

      doc.setTextColor(200, 200, 200);
      doc.setFontSize(11);
      centerText(`☉ ${sunSign} Sun  •  ☽ ${moonSign} Moon  •  ↑ ${rising} Rising  •  ${element} Dominant`, y, 11);
      y += 15;

      // Divider
      doc.setDrawColor(168, 85, 247);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      // Prologue
      if (reportContent.prologue) {
        doc.setTextColor(180, 180, 180);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        const prologueLines = doc.splitTextToSize(reportContent.prologue, pageWidth - margin * 2);
        doc.text(prologueLines, margin, y);
        y += prologueLines.length * 5 + 10;
        doc.setFont('helvetica', 'normal');
      }

      // Section renderer
      const renderSection = (title: string, icon: string, section: any) => {
        if (!section) return;
        
        addNewPageIfNeeded(50);
        
        // Section title
        doc.setFillColor(30, 20, 50);
        doc.roundedRect(margin - 5, y - 5, pageWidth - margin * 2 + 10, 12, 3, 3, 'F');
        
        doc.setTextColor(168, 85, 247);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${icon} ${title}`, margin, y + 4);
        y += 15;

        // Section content
        if (section.content) {
          doc.setTextColor(220, 220, 220);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          const contentLines = doc.splitTextToSize(section.content, pageWidth - margin * 2);
          
          for (const line of contentLines) {
            addNewPageIfNeeded(6);
            doc.text(line, margin, y);
            y += 5;
          }
          y += 5;
        }

        // Why This Matters
        if (section.whyThisMatters) {
          addNewPageIfNeeded(20);
          doc.setTextColor(168, 85, 247);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text('Why This Matters:', margin, y);
          y += 5;
          doc.setTextColor(180, 180, 180);
          doc.setFont('helvetica', 'normal');
          const matterLines = doc.splitTextToSize(section.whyThisMatters, pageWidth - margin * 2);
          doc.text(matterLines, margin, y);
          y += matterLines.length * 4 + 5;
        }

        // Practical Tip
        if (section.practicalTip) {
          addNewPageIfNeeded(20);
          doc.setTextColor(34, 197, 94);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text('💡 Practical Tip:', margin, y);
          y += 5;
          doc.setTextColor(180, 180, 180);
          doc.setFont('helvetica', 'normal');
          const tipLines = doc.splitTextToSize(section.practicalTip, pageWidth - margin * 2);
          doc.text(tipLines, margin, y);
          y += tipLines.length * 4 + 10;
        }
      };

      // Render all sections
      const sections = [
        { title: 'Solar Soulprint', icon: '☉', data: reportContent.solarSoulprint },
        { title: 'Lunar Heart', icon: '☽', data: reportContent.lunarHeart },
        { title: 'Cosmic Curiosity', icon: '☿', data: reportContent.cosmicCuriosity },
        { title: 'Harmony & Heartbeats', icon: '♀', data: reportContent.harmonyHeartbeats },
        { title: 'Spirit of Motion', icon: '♂', data: reportContent.spiritOfMotion },
        { title: 'Starlit Gaze', icon: '↑', data: reportContent.starlitGaze },
        { title: 'Destiny Compass', icon: '☊', data: reportContent.destinyCompass },
        { title: 'Gentle Healer', icon: '⚷', data: reportContent.gentleHealer },
        { title: 'Wild Spirit', icon: '⚸', data: reportContent.wildSpirit },
        { title: 'Elemental Nature', icon: '✦', data: reportContent.elementalNature },
      ];

      for (const section of sections) {
        renderSection(section.title, section.icon, section.data);
      }

      // Lucky Elements Page
      addNewPageIfNeeded(60);
      doc.setFillColor(30, 20, 50);
      doc.roundedRect(margin - 5, y - 5, pageWidth - margin * 2 + 10, 50, 5, 5, 'F');
      
      doc.setTextColor(255, 215, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      centerText('✨ Lucky Elements ✨', y + 5, 14);
      y += 15;

      if (reportContent.luckyElements) {
        const lucky = reportContent.luckyElements;
        doc.setTextColor(220, 220, 220);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        centerText(`Lucky Number: ${lucky.luckyNumber}  •  Lucky Day: ${lucky.luckyDay}`, y, 11);
        y += 8;
        centerText(`Lucky Color: ${lucky.luckyColor}  •  Power Time: ${lucky.powerTime}`, y, 11);
        y += 15;
      }

      // Epilogue
      if (reportContent.epilogue) {
        addNewPageIfNeeded(40);
        doc.setDrawColor(168, 85, 247);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;
        
        doc.setTextColor(180, 180, 180);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        const epilogueLines = doc.splitTextToSize(reportContent.epilogue, pageWidth - margin * 2);
        doc.text(epilogueLines, margin, y);
      }

      // Footer on last page
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Generated by Cosmic Paws • cosmicpaws.com', margin, pageHeight - 10);
      doc.text(new Date().toLocaleDateString(), pageWidth - margin - 20, pageHeight - 10);

      // Save
      doc.save(`${petName.toLowerCase().replace(/\s+/g, '-')}-cosmic-report.pdf`);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF. Please try again.');
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
          Generating PDF...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Download PDF
        </>
      )}
    </Button>
  );
}
