import { useSearchParams } from 'react-router-dom';
import { IntakeWizard } from '@/components/intake/IntakeWizard';
import { OccasionMode } from '@/lib/occasionMode';

const Intake = () => {
  const [searchParams] = useSearchParams();
  const mode = (searchParams.get('mode') || 'discover') as OccasionMode;
  
  return <IntakeWizard mode={mode} />;
};

export default Intake;
