import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { email, password, setupKey, action: 'register' },
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
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#FFFDF5' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#c4a265] to-[#8b6f3a] flex items-center justify-center">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-[#3d2f2a] font-serif text-3xl font-bold mb-2">
            Admin Portal
          </h1>
          <p className="text-[#5a4a42]">
            {isSetupMode ? 'Create your admin account' : 'Sign in to manage affiliates'}
          </p>
        </div>

        <div className="bg-white border border-[#e8ddd0] rounded-2xl shadow-sm p-8">
          <form onSubmit={isSetupMode ? handleSetup : handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#3d2f2a] mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9a8578]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[#faf6ef] border border-[#e8ddd0] rounded-xl text-[#3d2f2a] placeholder:text-[#9a8578] focus:outline-none focus:ring-2 focus:ring-[#c4a265]/50"
                  placeholder="admin@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3d2f2a] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9a8578]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[#faf6ef] border border-[#e8ddd0] rounded-xl text-[#3d2f2a] placeholder:text-[#9a8578] focus:outline-none focus:ring-2 focus:ring-[#c4a265]/50"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>
            </div>

            {isSetupMode && (
              <div>
                <label className="block text-sm font-medium text-[#3d2f2a] mb-2">
                  Setup Key
                </label>
                <input
                  type="text"
                  value={setupKey}
                  onChange={(e) => setSetupKey(e.target.value)}
                  className="w-full px-4 py-3 bg-[#faf6ef] border border-[#e8ddd0] rounded-xl text-[#3d2f2a] placeholder:text-[#9a8578] focus:outline-none focus:ring-2 focus:ring-[#c4a265]/50"
                  placeholder="Enter setup key"
                  required
                />
                <p className="text-xs text-[#9a8578] mt-1">
                  Contact admin for setup key
                </p>
              </div>
            )}

            <button
              type="submit"
              className="bg-gradient-to-r from-[#c4a265] to-[#8b6f3a] text-white font-semibold py-3 rounded-xl w-full hover:opacity-90 transition-opacity disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Please wait...' : isSetupMode ? 'Create Admin' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSetupMode(!isSetupMode)}
              className="text-sm text-[#c4a265] hover:underline"
            >
              {isSetupMode ? 'Already have an account? Sign in' : 'First time? Setup admin account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
