import { useABTest } from '@/hooks/useABTest';
import { EmotionalReportReveal } from '@/components/report/EmotionalReportReveal';
import { ReportRevealVariantB } from '@/components/variants/variant-b/ReportRevealVariantB';
import { ReportRevealVariantC } from '@/components/variants/variant-c/ReportRevealVariantC';

interface ReportRevealVariantRendererProps {
  petName: string;
  report: any;
  onComplete: () => void;
}

export function ReportRevealVariantRenderer({ petName, report, onComplete }: ReportRevealVariantRendererProps) {
  const { variant } = useABTest();
  
  // Extract key report data for variant B and C
  const sunSign = report?.chartPlacements?.sun?.sign || report?.sunSign || 'Aries';
  const archetype = report?.archetype?.name || report?.archetype || 'Cosmic Soul';

  switch (variant) {
    case 'B':
      return (
        <ReportRevealVariantB
          petName={petName}
          sunSign={sunSign}
          archetype={archetype}
          onComplete={onComplete}
        />
      );
    case 'C':
      return (
        <ReportRevealVariantC
          petName={petName}
          sunSign={sunSign}
          archetype={archetype}
          onComplete={onComplete}
        />
      );
    case 'A':
    default:
      return (
        <EmotionalReportReveal
          petName={petName}
          report={report}
          onComplete={onComplete}
        />
      );
  }
}
