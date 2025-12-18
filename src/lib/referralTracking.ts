// Referral cookie tracking utility
// 30-day cookie duration

const REFERRAL_COOKIE_KEY = 'cosmic_ref';
const REFERRAL_COOKIE_DAYS = 30;

export function setReferralCode(code: string): void {
  if (!code || typeof code !== 'string') return;
  
  // Validate code format (alphanumeric, underscores, hyphens only)
  if (!/^[a-zA-Z0-9_-]+$/.test(code)) return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + REFERRAL_COOKIE_DAYS * 24 * 60 * 60 * 1000);
  
  // Set cookie
  document.cookie = `${REFERRAL_COOKIE_KEY}=${encodeURIComponent(code)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  
  // Also store in localStorage as backup
  try {
    localStorage.setItem(REFERRAL_COOKIE_KEY, code);
    localStorage.setItem(`${REFERRAL_COOKIE_KEY}_expires`, expires.toISOString());
  } catch (e) {
    // localStorage might be blocked
  }
}

export function getReferralCode(): string | null {
  // Try cookie first
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === REFERRAL_COOKIE_KEY && value) {
      return decodeURIComponent(value);
    }
  }
  
  // Fallback to localStorage
  try {
    const code = localStorage.getItem(REFERRAL_COOKIE_KEY);
    const expires = localStorage.getItem(`${REFERRAL_COOKIE_KEY}_expires`);
    
    if (code && expires) {
      if (new Date(expires) > new Date()) {
        return code;
      } else {
        // Expired, clean up
        localStorage.removeItem(REFERRAL_COOKIE_KEY);
        localStorage.removeItem(`${REFERRAL_COOKIE_KEY}_expires`);
      }
    }
  } catch (e) {
    // localStorage might be blocked
  }
  
  return null;
}

export function clearReferralCode(): void {
  // Clear cookie
  document.cookie = `${REFERRAL_COOKIE_KEY}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  
  // Clear localStorage
  try {
    localStorage.removeItem(REFERRAL_COOKIE_KEY);
    localStorage.removeItem(`${REFERRAL_COOKIE_KEY}_expires`);
  } catch (e) {
    // localStorage might be blocked
  }
}

// Check URL for referral code on page load
export function checkAndStoreReferralFromURL(): string | null {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref');
  
  if (refCode) {
    setReferralCode(refCode);
    
    // Optionally remove ref from URL without reload
    const url = new URL(window.location.href);
    url.searchParams.delete('ref');
    window.history.replaceState({}, '', url.toString());
    
    return refCode;
  }
  
  return getReferralCode();
}
