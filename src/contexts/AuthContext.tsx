import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import * as Sentry from '@sentry/react';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** Passwordless: sends a 6-digit code to the email. Auto-creates account if new. */
  sendOtp: (email: string) => Promise<{ error: Error | null }>;
  /** Verify the 6-digit code. Signs the user in / completes signup. */
  verifyOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
  /** One-tap Google OAuth. Redirects out to Google, lands back on returnTo. */
  signInWithGoogle: (returnTo?: string) => Promise<{ error: Error | null }>;
  /** Legacy password path — kept for accounts that pre-date OTP rollout. */
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Link any existing reports to this user on sign in/up.
        // Failures here silently leave guest purchases unattached to the
        // account — so we capture properly to Sentry instead of swallowing.
        if (session?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
          // Defer the supabase call to avoid deadlock
          setTimeout(() => {
            supabase.functions.invoke('link-user-reports').then(({ data, error }) => {
              if (error || data?.error) {
                const reason = error?.message || data?.error || 'unknown';
                console.error('[AuthContext] link-user-reports failed:', reason, { userId: session.user.id });
                Sentry.captureMessage('link-user-reports failed', {
                  level: 'error',
                  extra: { reason, userId: session.user.id, email: session.user.email },
                });
              }
            }).catch((err) => {
              console.error('[AuthContext] link-user-reports threw:', err);
              Sentry.captureException(err, { tags: { fn: 'link-user-reports' } });
            });
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const sendOtp = async (email: string) => {
    // shouldCreateUser:true is the default — same flow handles new + returning users.
    // emailRedirectTo is unused for the code path but the link fallback respects it.
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    return { error };
  };

  const verifyOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    return { error };
  };

  const signInWithGoogle = async (returnTo?: string) => {
    // Land the customer back where they started (default: the studio gate)
    // so the OAuth round-trip is invisible. The `link-user-reports` hook in
    // onAuthStateChange attaches any guest purchases on return.
    const redirectTo = `${window.location.origin}${returnTo ?? '/pawtraits#studio'}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: { prompt: 'select_account' },
      },
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, sendOtp, verifyOtp, signInWithGoogle, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
