import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StarfieldBackground } from '@/components/cosmic/StarfieldBackground';
import { AdminSidebar } from './AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const adminToken = sessionStorage.getItem('admin_token');

  useEffect(() => {
    if (!adminToken) {
      navigate('/admin/login');
    }
  }, [adminToken, navigate]);

  if (!adminToken) return null;

  return (
    <div className="min-h-screen relative flex">
      <StarfieldBackground />
      <div className="relative z-10 flex w-full">
        <AdminSidebar />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
