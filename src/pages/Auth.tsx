/**
 * /auth — Passwordless email OTP flow.
 *
 *   Step 1: type email → "Continue" → server tries instant-signup; falls back to OTP email
 *   Step 2: code input (6/7/8 digits — Supabase config decides) → auto-verify on full input
 *
 * Code length is read from the live Supabase response (whatever digit count
 * Supabase mails out), so changing the dashboard "Email OTP Length" setting
 * never breaks the UI again.
 *
 * The hidden input has autoComplete="one-time-code" + inputMode="numeric"
 * so iOS Mail / Android Gmail surface the code as a one-tap suggestion when
 * the email arrives. Same pattern as Vercel / Linear / Substack.
 *
 * Existing accounts created with a password still work — sendOtp also signs
 * in returning users. Password fallback link kept for the rare case someone
 * specifically wants it.
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Mail, ArrowLeft, Sparkles, Check, Lock } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { getVisitorId } from '@/lib/auth/visitorId';
import { toast } from 'sonner';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

type Step = 'email' | 'code' | 'password';

const RESEND_COOLDOWN_S = 30;
// Supabase Email OTP Length is dashboard-configurable (6/7/8). We support all
// three so a config change in the Supabase project never breaks this UI again.
const ALLOWED_OTP_LENGTHS = [6, 7, 8] as const;
const DEFAULT_OTP_LENGTH = 6;
const MAX_OTP_LENGTH = 8;

export default function Auth() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeLength, setCodeLength] = useState<number>(DEFAULT_OTP_LENGTH);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [errors, setErrors] = useState<{ email?: string; code?: string; password?: string }>({});
  // Honeypot: bots that auto-fill every input land here and get rejected.
  const [hpField, setHpField] = useState('');

  const { sendOtp, verifyOtp, signInWithGoogle, signIn, user } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Same-origin relative path only — prevents open-redirect abuse.
  // Accept both ?redirect= (legacy) and ?next= (Pawtraits Studio + TopUpPlans).
  const redirectParam = searchParams.get('redirect') ?? searchParams.get('next');
  const safeRedirect = (redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//'))
    ? redirectParam
    : '/my-reports';

  // First code box auto-focuses when we transition to step 'code'.
  const firstCodeBoxRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (step === 'code') firstCodeBoxRef.current?.focus();
  }, [step]);

  // Logged in → bounce out
  useEffect(() => {
    if (user) {
      linkUserReports();
      navigate(safeRedirect);
    }
  }, [user, navigate, safeRedirect]);

  // Cooldown ticker for "Resend code"
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const linkUserReports = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.functions.invoke('link-user-reports', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      }
    } catch (error) {
      console.error('Error linking reports:', error);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      // Return to wherever they were headed (?next=/?redirect=), default /my-reports.
      const { error } = await signInWithGoogle(safeRedirect);
      if (error) throw error;
      // Page redirects to Google immediately on success.
    } catch (err) {
      toast.error((err as Error).message || "Couldn't open Google sign-in. Try email instead.");
      setGoogleLoading(false);
    }
  };

  const handleSendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const r = emailSchema.safeParse(email);
    if (!r.success) {
      setErrors({ email: r.error.errors[0].message });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      // Visitor ID: stable browser fingerprint. The signup trigger uses it
      // to stop one device farming free credits via email aliases. Fail-soft
      // — privacy extensions / ITP can block FingerprintJS, in which case
      // email-only dedup still applies.
      const visitorId = await getVisitorId();

      // Server emails an OTP for both new and existing accounts. The response
      // is uniform (no user-enumeration oracle); we always go to code entry.
      const r = await fetch('/api/portraits?action=instant-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          visitorId: visitorId ?? undefined,
          honeypot: hpField,
        }),
      });
      const data = await r.json() as { status?: string; email?: string; otpLength?: number; error?: string; message?: string };

      if (!r.ok) {
        if (r.status === 429) {
          toast.error(data.message || 'Try again in a few minutes.');
        } else {
          toast.error(data.error || `Sign-in failed (${r.status})`);
        }
        return;
      }

      if (data.status === 'otp_sent') {
        const len = (ALLOWED_OTP_LENGTHS as readonly number[]).includes(data.otpLength ?? -1)
          ? (data.otpLength as number)
          : DEFAULT_OTP_LENGTH;
        setCodeLength(len);
        setStep('code');
        setResendIn(RESEND_COOLDOWN_S);
        setCode('');
        toast.success(`Check your email for a ${len}-digit code.`);
        return;
      }

      // Unknown response shape — fall back to plain OTP send so user isn't stuck.
      const { error } = await sendOtp(email.trim().toLowerCase());
      if (error) {
        toast.error(error.message);
      } else {
        setStep('code');
        setResendIn(RESEND_COOLDOWN_S);
        setCode('');
        toast.success(`Check your email for a ${codeLength}-digit code`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (overrideCode?: string) => {
    const finalCode = (overrideCode ?? code).trim();
    if (finalCode.length !== codeLength) {
      setErrors({ code: `Enter the ${codeLength}-digit code from your email` });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const { error } = await verifyOtp(email.trim().toLowerCase(), finalCode);
      if (error) {
        if (error.message.toLowerCase().includes('expired') || error.message.toLowerCase().includes('invalid')) {
          toast.error('Code is invalid or expired. Try resending.');
        } else {
          toast.error(error.message);
        }
        setCode('');
        firstCodeBoxRef.current?.focus();
      } else {
        toast.success('Welcome to Little Souls.');
        // Navigate fires through the user-effect above when supabase emits SIGNED_IN
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const er = emailSchema.safeParse(email);
    const pr = passwordSchema.safeParse(password);
    const next: typeof errors = {};
    if (!er.success) next.email = er.error.errors[0].message;
    if (!pr.success) next.password = pr.error.errors[0].message;
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message.includes('Invalid login') ? 'Invalid email or password' : error.message);
      } else {
        toast.success('Welcome back!');
        navigate(safeRedirect);
      }
    } finally {
      setLoading(false);
    }
  };

  // Ultra-compact code input with iOS / Android auto-fill support.
  // The wide hidden input owns autoComplete="one-time-code". The visible
  // boxes (6/7/8 wide depending on Supabase config) read from the same `code` state.
  const handleCodeChange = (v: string) => {
    const cleaned = v.replace(/\D/g, '').slice(0, codeLength);
    setCode(cleaned);
    if (cleaned.length === codeLength) {
      // Auto-submit when the full code lands (typed manually OR pasted from auto-fill)
      handleVerifyCode(cleaned);
    }
  };

  const titles: Record<Step, string> = {
    email: 'Sign in or create your account',
    code: 'Welcome back — verify it’s you',
    password: 'Use your password',
  };
  const descriptions: Record<Step, string> = {
    email: "New here? Instant sign-up — no email click needed.",
    code: `Looks like you’ve signed in before with ${email}. We just emailed a ${codeLength}-digit code — it expires in 60 minutes.`,
    password: 'For accounts created before passwordless sign-in.',
  };

  return (
    <div style={{ background: '#FFFDF5', minHeight: '100vh' }} className="relative overflow-hidden">
      {/* Honeypot — invisible to humans, irresistible to indiscriminate bots. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        value={hpField}
        onChange={(e) => setHpField(e.target.value)}
        style={{
          position: 'absolute',
          left: '-9999px',
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: 'none',
        }}
      />
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <button
            onClick={() => {
              if (step === 'email') navigate('/');
              else setStep('email');
            }}
            className="flex items-center gap-2 mb-8 transition-colors"
            style={{ color: '#9a8578' }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{step === 'email' ? t('nav.backHome') : 'Back'}</span>
          </button>

          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring' }}
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #c4a265, #b8973e)' }}
            >
              {step === 'code' ? (
                <Mail className="w-8 h-8 text-white" />
              ) : step === 'password' ? (
                <Lock className="w-8 h-8 text-white" />
              ) : (
                <Sparkles className="w-8 h-8 text-white" />
              )}
            </motion.div>
            <h1 className="text-3xl font-display font-bold" style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#3d2f2a' }}>
              {titles[step]}
            </h1>
            <p className="mt-2 px-4" style={{ color: '#9a8578' }}>
              {descriptions[step]}
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6"
            style={{ background: 'white', border: '1px solid #e8ddd0', borderRadius: '16px' }}
          >
            <AnimatePresence mode="wait">
              {step === 'email' && (
                <motion.form
                  key="email-step"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleSendCode}
                  className="space-y-5"
                >
                  {/* One-tap Google — lowest-friction path, same provider as Pawtraits */}
                  <button
                    type="button"
                    onClick={handleGoogle}
                    disabled={googleLoading || loading}
                    className="w-full py-3 px-6 font-medium flex items-center justify-center gap-3 transition-all hover:shadow-md disabled:opacity-50"
                    style={{ background: 'white', border: '1px solid #e8ddd0', color: '#3d2f2a', borderRadius: '10px' }}
                  >
                    {googleLoading ? (
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                        <Sparkles className="w-4 h-4" style={{ color: '#9a8578' }} />
                      </motion.span>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/>
                        <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"/>
                      </svg>
                    )}
                    {googleLoading ? 'Opening Google…' : 'Sign in with Google'}
                  </button>

                  <div className="flex items-center gap-3" aria-hidden>
                    <div style={{ flex: 1, height: 1, background: '#e8ddd0' }} />
                    <span className="text-xs" style={{ color: '#9a8578' }}>or</span>
                    <div style={{ flex: 1, height: 1, background: '#e8ddd0' }} />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium" style={{ color: '#5a4a42' }}>Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9a8578' }} />
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        autoFocus
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c4a265]/50"
                        style={{ background: '#faf6ef', border: '1px solid #e8ddd0', color: '#3d2f2a', borderRadius: '10px' }}
                      />
                    </div>
                    {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-6 font-medium text-lg transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #c4a265, #b8973e)', color: 'white', border: 'none', borderRadius: '10px' }}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2 justify-center">
                        <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                          <Sparkles className="w-4 h-4" />
                        </motion.span>
                        Sending code…
                      </span>
                    ) : 'Continue →'}
                  </button>

                  {/* Compact trust assurances */}
                  <div className="flex items-center justify-center gap-4 flex-wrap pt-1 text-xs font-semibold" style={{ color: '#9a8578' }}>
                    <span className="inline-flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5a8f6b" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z"/><path d="M9 12l2 2 4-4"/></svg>
                      Encrypted
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5a8f6b" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
                      No spam
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5a8f6b" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M5 5l14 14"/></svg>
                      Never shared
                    </span>
                  </div>
                  <p className="text-center text-[11px]" style={{ color: '#b3a293' }}>
                    By continuing you agree to our{' '}
                    <a href="/terms" className="underline" style={{ color: '#c4a265' }}>terms</a>{' '}and{' '}
                    <a href="/privacy" className="underline" style={{ color: '#c4a265' }}>privacy</a>.
                  </p>
                </motion.form>
              )}

              {step === 'code' && (
                <motion.div
                  key="code-step"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <CodeInput
                    code={code}
                    length={codeLength}
                    onChange={handleCodeChange}
                    firstBoxRef={firstCodeBoxRef}
                    error={errors.code}
                  />

                  <button
                    type="button"
                    onClick={() => handleVerifyCode()}
                    className="w-full py-3 px-6 font-medium text-lg transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #c4a265, #b8973e)', color: 'white', border: 'none', borderRadius: '10px' }}
                    disabled={loading || code.length !== codeLength}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2 justify-center">
                        <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                          <Sparkles className="w-4 h-4" />
                        </motion.span>
                        Verifying…
                      </span>
                    ) : 'Verify & sign in'}
                  </button>

                  <div className="flex items-center justify-between text-sm pt-2">
                    <button
                      type="button"
                      onClick={() => handleSendCode()}
                      disabled={resendIn > 0 || loading}
                      className="transition-colors disabled:opacity-50"
                      style={{ color: resendIn > 0 ? '#9a8578' : '#c4a265' }}
                    >
                      {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setStep('email'); setCode(''); }}
                      className="transition-colors"
                      style={{ color: '#9a8578' }}
                    >
                      Wrong email?
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 'password' && (
                <motion.form
                  key="password-step"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handlePasswordSignIn}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <label className="block text-sm font-medium" style={{ color: '#5a4a42' }}>Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9a8578' }} />
                      <input
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c4a265]/50"
                        style={{ background: '#faf6ef', border: '1px solid #e8ddd0', color: '#3d2f2a', borderRadius: '10px' }}
                      />
                    </div>
                    {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium" style={{ color: '#5a4a42' }}>Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9a8578' }} />
                      <input
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c4a265]/50"
                        style={{ background: '#faf6ef', border: '1px solid #e8ddd0', color: '#3d2f2a', borderRadius: '10px' }}
                      />
                    </div>
                    {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 px-6 font-medium text-lg transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #c4a265, #b8973e)', color: 'white', border: 'none', borderRadius: '10px' }}
                    disabled={loading}
                  >
                    {loading ? 'Signing in…' : 'Sign in'}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Tertiary link below the card */}
          {step === 'email' && (
            <p className="mt-6 text-center text-sm" style={{ color: '#9a8578' }}>
              Have a password from before?{' '}
              <button
                type="button"
                onClick={() => setStep('password')}
                className="underline transition-colors"
                style={{ color: '#c4a265' }}
              >
                Use it instead
              </button>
            </p>
          )}
          {step === 'password' && (
            <p className="mt-6 text-center text-sm" style={{ color: '#9a8578' }}>
              <button
                type="button"
                onClick={() => setStep('email')}
                className="underline transition-colors"
                style={{ color: '#c4a265' }}
              >
                ← Back to passwordless sign in
              </button>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// ── Variable-length code input ───────────────────────────────────────────────
// Single hidden text input owns autoComplete="one-time-code" + inputMode="numeric"
// — that's what tells iOS Mail / Android Gmail to surface the code as a one-tap
// suggestion above the keyboard. Visible boxes (6/7/8) are styling on top.
function CodeInput({
  code,
  length,
  onChange,
  firstBoxRef,
  error,
}: {
  code: string;
  length: number;
  onChange: (v: string) => void;
  firstBoxRef: React.RefObject<HTMLInputElement | null>;
  error?: string;
}) {
  // Tailwind doesn't tree-shake arbitrary grid-cols-N classes, so map explicitly.
  const gridColsClass = length === 8 ? 'grid-cols-8' : length === 7 ? 'grid-cols-7' : 'grid-cols-6';
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium" style={{ color: '#5a4a42' }}>
        {length}-digit code
      </label>
      <div
        className="relative cursor-text"
        onClick={() => firstBoxRef.current?.focus()}
      >
        {/* The real input — visually invisible but holds focus + auto-fill */}
        <input
          ref={firstBoxRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          maxLength={MAX_OTP_LENGTH}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`Enter the ${length}-digit code from your email`}
          className="absolute inset-0 w-full h-full opacity-0"
          style={{ caretColor: 'transparent' }}
        />
        {/* Visible boxes */}
        <div className={`grid ${gridColsClass} gap-2`}>
          {Array.from({ length }).map((_, i) => {
            const ch = code[i] ?? '';
            const isCurrent = code.length === i;
            return (
              <div
                key={i}
                aria-hidden
                className="aspect-square flex items-center justify-center text-2xl font-mono"
                style={{
                  background: '#faf6ef',
                  border: `1px solid ${ch ? '#c4a265' : isCurrent ? '#c4a265' : '#e8ddd0'}`,
                  color: '#3d2f2a',
                  borderRadius: '10px',
                  boxShadow: isCurrent ? '0 0 0 3px rgba(196,162,101,0.15)' : 'none',
                  transition: 'all 150ms',
                }}
              >
                {ch}
              </div>
            );
          })}
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
