import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const validateSession = async () => {
      const adminToken = sessionStorage.getItem('admin_token');

      if (!adminToken) {
        navigate('/admin/login');
        return;
      }

      try {
        // Validate token server-side
        const { data, error } = await supabase.functions.invoke('admin-auth', {
          body: { token: adminToken },
          headers: { 'Content-Type': 'application/json' },
        });

        // Parse response - need to handle the query param
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-auth?action=validate`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ token: adminToken }),
          }
        );

        const result = await response.json();

        if (!result?.valid) {
          sessionStorage.removeItem('admin_token');
          sessionStorage.removeItem('admin_email');
          navigate('/admin/login');
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error('Session validation error:', error);
        sessionStorage.removeItem('admin_token');
        sessionStorage.removeItem('admin_email');
        navigate('/admin/login');
      } finally {
        setIsValidating(false);
      }
    };

    validateSession();
  }, [navigate]);

  if (isValidating) {
    return (
      <div className="flex items-center justify-center" style={{ background: '#FFFDF5', minHeight: '100vh' }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#c4a265' }} />
          <p style={{ color: '#9a8578' }}>Validating session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex" style={{ background: '#FFFDF5', minHeight: '100vh' }}>
      <div className="flex w-full">
        <AdminSidebar />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
