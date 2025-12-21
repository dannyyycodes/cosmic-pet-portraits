import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { IntakeWizard } from '@/components/intake/IntakeWizard';
import { clearIntakeProgress } from '@/lib/intakeStorage';

/**
 * Dedicated gift redemption intake page.
 * - Always clears saved progress on mount to ensure a fresh start
 * - Prevents conflicts with regular intake flow
 * - Expects `?gift=CODE&pets=N` query params
 */
const GiftIntake = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const giftCode = searchParams.get('gift');
  const petCount = searchParams.get('pets') || '1';

  // Always clear saved progress for gift redemptions
  useEffect(() => {
    clearIntakeProgress();
  }, []);

  // Redirect to /redeem if no gift code provided
  useEffect(() => {
    if (!giftCode) {
      navigate('/redeem', { replace: true });
    }
  }, [giftCode, navigate]);

  if (!giftCode) {
    return null; // Will redirect
  }

  return <IntakeWizard mode="discover" />;
};

export default GiftIntake;
