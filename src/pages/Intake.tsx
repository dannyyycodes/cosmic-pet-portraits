import { useSearchParams } from 'react-router-dom';
import { IntakeWizard } from '@/components/intake/IntakeWizard';
import { OccasionMode } from '@/lib/occasionMode';
import { ExitIntentPopup } from '@/components/ExitIntentPopup';

const Intake = () => {
  const [searchParams] = useSearchParams();
  const mode = (searchParams.get('mode') || 'discover') as OccasionMode;
  
  return (
    <>
      <IntakeWizard mode={mode} />
      <ExitIntentPopup couponCode="STAYCOSMIC10" discountPercent={10} />
    </>
  );
};

export default Intake;
