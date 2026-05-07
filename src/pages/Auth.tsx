/**
 * /auth — Passwordless email OTP flow.
 *
 *   Step 1: type email → "Continue" → Supabase sends a 6-digit code
 *   Step 2: 6-box code input → "Verify" → signed in
 *
 * The 6-digit input has autoComplete="one-time-code" + inputMode="numeric"
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
import { useTurnstile } from '@/lib/turnstile';
import { toast } from 'sonner';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

type Step = 'email' | 'code' | 'password';

const RESEND_COOLDOWN_S = 30;

export default function Auth() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [errors, setErrors] = useState<{ email?: string; code?: string; password?: string }>({});

  const { sendOtp, verifyOtp, signIn, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const turnstile = useTurnstile({ action: 'auth' });

  // Same-origin relative path only — prevents open-redirect abuse.
  const redirectParam = searchParams.get('redirect');
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
      // Try instant-signup first. New emails: account created + signed in
      // immediately, no email click needed. Existing emails: server sends an
      // OTP and tells us to switch to code-entry to verify ownership.
      let turnstileToken = '';
      try {
        turnstileToken = await turnstile.execute();
      } catch (err) {
        toast.error('Could not verify you are human — please refresh and try again.');
        return;
      }

      const r = await fetch('/api/portraits?action=instant-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), turnstileToken }),
      });
      const data = await r.json() as { status?: string; otp?: string; email?: string; error?: string };

      if (!r.ok) {
        if (data.error === 'turnstile_failed') {
          toast.error('Verification failed — please refresh and try again.');
        } else {
          toast.error(data.error || `Sign-in failed (${r.status})`);
        }
        turnstile.reset();
        return;
      }

      if (data.status === 'created' && data.otp && data.email) {
        // New account — verify the server-issued OTP locally to establish session.
        const { error: vErr } = await verifyOtp(data.email, data.otp);
        if (vErr) {
          toast.error(vErr.message || 'Sign-in failed');
        } else {
          toast.success('Welcome to Little Souls.');
          // Navigate fires from the user-effect once SIGNED_IN emits.
        }
        return;
      }

      if (data.status === 'exists') {
        // Returning user. Server already sent the OTP — just collect the code.
        setStep('code');
        setResendIn(RESEND_COOLDOWN_S);
        setCode('');
        toast.success("Welcome back. We've sent a 6-digit code to your email.");
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
        toast.success('Check your email for a 6-digit code');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (overrideCode?: string) => {
    const finalCode = (overrideCode ?? code).trim();
    if (finalCode.length !== 6) {
      setErrors({ code: 'Enter the 6-digit code from your email' });
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

  // Ultra-compact 6-box code input with iOS / Android auto-fill support.
  // The wide hidden input owns autoComplete="one-time-code". The 6 visible
  // boxes are styling — they read from the same `code` state.
  const handleCodeChange = (v: string) => {
    const cleaned = v.replace(/\D/g, '').slice(0, 6);
    setCode(cleaned);
    if (cleaned.length === 6) {
      // Auto-submit when 6 digits land (typed manually OR pasted from auto-fill)
      handleVerifyCode(cleaned);
    }
  };

  const titles: Record<Step, string> = {
    email: 'Sign in or create your account',
    code: 'Enter your code',
    password: 'Use your password',
  };
  const descriptions: Record<Step, string> = {
    email: "We'll email you a 6-digit code. No password needed.",
    code: `Sent to ${email}. Check your inbox — the code expires in 60 minutes.`,
    password: 'For accounts created before passwordless sign-in.',
  };

  return (
    <div style={{ background: '#FFFDF5', minHeight: '100vh' }} className="relative overflow-hidden">
      {/* Invisible Turnstile mount — Cloudflare auto-renders into this. */}
      <div ref={turnstile.mountRef} style={{ position: 'absolute', left: '-9999px' }} aria-hidden />
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
                <Star className="w-8 h-8 text-white fill-white" />
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

                  <p className="text-center text-xs" style={{ color: '#9a8578' }}>
                    By continuing you agree to our{' '}
                    <a href="/terms" className="underline" style={{ color: '#c4a265' }}>terms</a>{' '}and{' '}
                    <a href="/privacy" className="underline" style={{ color: '#c4a265' }}>privacy policy</a>.
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
                    onChange={handleCodeChange}
                    firstBoxRef={firstCodeBoxRef}
                    error={errors.code}
                  />

                  <button
                    type="button"
                    onClick={() => handleVerifyCode()}
                    className="w-full py-3 px-6 font-medium text-lg transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #c4a265, #b8973e)', color: 'white', border: 'none', borderRadius: '10px' }}
                    disabled={loading || code.length !== 6}
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

// ── 6-digit code input ────────────────────────────────────────────────────────
// Single hidden text input owns autoComplete="one-time-code" + inputMode="numeric"
// — that's what tells iOS Mail / Android Gmail to surface the code as a one-tap
// suggestion above the keyboard. Six visible boxes are styling on top.
function CodeInput({
  code,
  onChange,
  firstBoxRef,
  error,
}: {
  code: string;
  onChange: (v: string) => void;
  firstBoxRef: React.RefObject<HTMLInputElement | null>;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium" style={{ color: '#5a4a42' }}>
        6-digit code
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
          maxLength={6}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Enter the 6-digit code from your email"
          className="absolute inset-0 w-full h-full opacity-0"
          style={{ caretColor: 'transparent' }}
        />
        {/* The 6 visible boxes */}
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 6 }).map((_, i) => {
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
