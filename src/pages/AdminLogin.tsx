import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { StarfieldBackground } from '@/components/cosmic/StarfieldBackground';
import { CosmicInput } from '@/components/cosmic/CosmicInput';
import { CosmicButton } from '@/components/cosmic/CosmicButton';
import { toast } from 'sonner';
import { Lock, Mail } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [setupKey, setSetupKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { email, password },
      });

      if (error || data?.error) {
        toast.error(data?.error || 'Invalid credentials');
        return;
      }

      // Store admin session
      sessionStorage.setItem('admin_token', data.token);
      sessionStorage.setItem('admin_email', data.admin.email);
      
      toast.success('Welcome back!');
      navigate('/admin/affiliates');
    } catch (err) {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('admin-auth?action=register', {
        body: { email, password, setupKey },
      });

      if (error || data?.error) {
        toast.error(data?.error || 'Setup failed');
        return;
      }

      toast.success('Admin account created! Please login.');
      setIsSetupMode(false);
      setSetupKey('');
    } catch (err) {
      toast.error('Setup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6">
      <StarfieldBackground />
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cosmic-gold to-cosmic-gold/60 flex items-center justify-center">
            <Lock className="w-8 h-8 text-cosmic-deep" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Admin Portal
          </h1>
          <p className="text-muted-foreground">
            {isSetupMode ? 'Create your admin account' : 'Sign in to manage affiliates'}
          </p>
        </div>

        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-8">
          <form onSubmit={isSetupMode ? handleSetup : handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cosmic-gold/50"
                  placeholder="admin@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cosmic-gold/50"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>
            </div>

            {isSetupMode && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Setup Key
                </label>
                <input
                  type="text"
                  value={setupKey}
                  onChange={(e) => setSetupKey(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cosmic-gold/50"
                  placeholder="Enter setup key"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Default: cosmic-admin-setup-2024
                </p>
              </div>
            )}

            <CosmicButton
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Please wait...' : isSetupMode ? 'Create Admin' : 'Sign In'}
            </CosmicButton>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSetupMode(!isSetupMode)}
              className="text-sm text-cosmic-gold hover:underline"
            >
              {isSetupMode ? 'Already have an account? Sign in' : 'First time? Setup admin account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
