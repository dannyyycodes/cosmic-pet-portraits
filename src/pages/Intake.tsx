import { useSearchParams } from 'react-router-dom';
import { IntakeWizard } from '@/components/intake/IntakeWizard';
import { OccasionMode } from '@/lib/occasionMode';
import { ExitIntentPopup } from '@/components/ExitIntentPopup';

const Intake = () => {
  const [searchParams] = useSearchParams();
  const mode = (searchParams.get('mode') || 'discover') as OccasionMode;

  // Gift flow still uses the IntakeWizard (they've already paid via gift code)
  const isGiftFlow = Boolean(searchParams.get('gift'));
  // Returning from Stripe cancel also needs the wizard (to restore progress)
  const isCheckoutReturn = searchParams.get('checkout') === 'true';

  // Everyone else should go to checkout (direct navigation, no React Router redirect)
  if (!isGiftFlow && !isCheckoutReturn) {
    window.location.replace('/#checkout');
    return null;
  }

  return (
    <>
      <IntakeWizard mode={mode} />
      <ExitIntentPopup couponCode="STAYCOSMIC10" discountPercent={10} />
    </>
  );
};

export default Intake;
