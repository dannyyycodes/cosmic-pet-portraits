import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { setReferralCode } from '@/lib/referralTracking';

export default function ReferralRedirect() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (code) {
      setReferralCode(code);
    }
    // Redirect to home page
    navigate('/', { replace: true });
  }, [code, navigate]);

  return null;
}
