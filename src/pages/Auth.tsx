import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Mail, Lock, ArrowLeft, Sparkles, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';


const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

type AuthMode = 'login' | 'signup' | 'forgot';

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { signIn, signUp, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      // Link any existing reports to this user
      linkUserReports();
      navigate('/my-reports');
    }
  }, [user, navigate]);

  const linkUserReports = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.functions.invoke('link-user-reports', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
      }
    } catch (error) {
      console.error('Error linking reports:', error);
    }
  };

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    if (mode !== 'forgot') {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) {
          toast.error(error.message);
        } else {
          setResetSent(true);
          toast.success('Check your email for a password reset link');
        }
      } else if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Welcome back!');
          navigate('/my-reports');
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('This email is already registered. Try logging in instead.');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Account created! Welcome to Little Souls.');
          navigate('/my-reports');
        }
      }
    } finally {
      setLoading(false);
    }
  };


  const getTitle = () => {
    if (mode === 'forgot') return resetSent ? 'Check Your Email' : 'Reset Password';
    return mode === 'login' ? 'Welcome Back' : 'Create Account';
  };

  const getDescription = () => {
    if (mode === 'forgot') {
      return resetSent
        ? 'We sent you a link to reset your password'
        : 'Enter your email to receive a reset link';
    }
    return mode === 'login'
      ? 'Sign in to view your cosmic reports'
      : 'Join Little Souls to save your reports';
  };

  return (
    <div style={{ background: '#FFFDF5', minHeight: '100vh' }} className="relative overflow-hidden">

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <button
            onClick={() => mode === 'forgot' ? setMode('login') : navigate('/')}
            className="flex items-center gap-2 mb-8 transition-colors"
            style={{ color: '#9a8578' }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{mode === 'forgot' ? 'Back to Sign In' : t('nav.backHome')}</span>
          </button>

          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring' }}
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #c4a265, #b8973e)' }}
            >
              {resetSent ? (
                <Check className="w-8 h-8 text-white" />
              ) : (
                <Star className="w-8 h-8 text-white fill-white" />
              )}
            </motion.div>
            <h1 className="text-3xl font-display font-bold" style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#3d2f2a' }}>
              {getTitle()}
            </h1>
            <p className="mt-2" style={{ color: '#9a8578' }}>
              {getDescription()}
            </p>
          </div>

          {!resetSent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6"
              style={{ background: 'white', border: '1px solid #e8ddd0', borderRadius: '16px' }}
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium" style={{ color: '#5a4a42' }}>Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9a8578' }} />
                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c4a265]/50"
                      style={{ background: '#faf6ef', border: '1px solid #e8ddd0', color: '#3d2f2a', borderRadius: '10px' }}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                {mode !== 'forgot' && (
                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-medium" style={{ color: '#5a4a42' }}>Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9a8578' }} />
                      <input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c4a265]/50"
                        style={{ background: '#faf6ef', border: '1px solid #e8ddd0', color: '#3d2f2a', borderRadius: '10px' }}
                      />
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-500">{errors.password}</p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 px-6 font-medium text-lg transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #c4a265, #b8973e)', color: 'white', border: 'none', borderRadius: '10px' }}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2 justify-center">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Sparkles className="w-4 h-4" />
                      </motion.span>
                      {mode === 'forgot' ? 'Sending...' : mode === 'login' ? 'Signing in...' : 'Creating account...'}
                    </span>
                  ) : (
                    mode === 'forgot' ? 'Send Reset Link' : mode === 'login' ? 'Sign In' : 'Create Account'
                  )}
                </button>
              </form>

              <div className="mt-6 space-y-3 text-center">
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-sm transition-colors block w-full"
                    style={{ color: '#9a8578' }}
                  >
                    Forgot your password?
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="text-sm transition-colors"
                  style={{ color: '#c4a265' }}
                >
                  {mode === 'login'
                    ? "Don't have an account? Sign up"
                    : 'Already have an account? Sign in'}
                </button>
              </div>
            </motion.div>
          )}

          {resetSent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 text-center"
              style={{ background: 'white', border: '1px solid #e8ddd0', borderRadius: '16px' }}
            >
              <p className="mb-4" style={{ color: '#9a8578' }}>
                Didn't receive the email? Check your spam folder or
              </p>
              <button
                onClick={() => setResetSent(false)}
                className="px-6 py-2 font-medium transition-opacity hover:opacity-80"
                style={{ border: '1px solid #e8ddd0', color: '#5a4a42', borderRadius: '10px', background: 'transparent' }}
              >
                Try again
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
