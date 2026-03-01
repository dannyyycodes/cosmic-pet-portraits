import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Mail,
  FileText,
  LogOut,
  Star,
  Gift,
  Tag,
  Ticket,
  BarChart3,
  Newspaper
} from 'lucide-react';

const navItems = [
  { title: 'Overview', path: '/admin', icon: LayoutDashboard },
  { title: 'Page Analytics', path: '/admin/analytics', icon: BarChart3 },
  { title: 'Blog Stats', path: '/admin/blog', icon: Newspaper },
  { title: 'Pet Reports', path: '/admin/reports', icon: FileText },
  { title: 'Subscriptions', path: '/admin/subscriptions', icon: Mail },
  { title: 'Affiliates', path: '/admin/affiliates', icon: Users },
  { title: 'Gift Certificates', path: '/admin/gifts', icon: Gift },
  { title: 'Coupons', path: '/admin/coupons', icon: Tag },
  { title: 'Redeem Codes', path: '/admin/redeem-codes', icon: Ticket },
];

export function AdminSidebar() {
  const navigate = useNavigate();
  const adminEmail = sessionStorage.getItem('admin_email');

  const handleLogout = async () => {
    const token = sessionStorage.getItem('admin_token');

    // Invalidate session server-side
    if (token) {
      try {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-auth?action=logout`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ token }),
          }
        );
      } catch (e) {
        // Continue with logout even if server call fails
      }
    }

    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_email');
    navigate('/admin/login');
  };

  return (
    <aside className="w-64 min-h-screen flex flex-col" style={{ background: 'white', borderRight: '1px solid #e8ddd0' }}>
      {/* Logo */}
      <div className="p-6" style={{ borderBottom: '1px solid #e8ddd0' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#faf6ef', border: '1px solid #e8ddd0' }}>
            <Star className="w-5 h-5" style={{ color: '#c4a265' }} />
          </div>
          <div>
            <h1 className="font-display font-bold" style={{ color: '#3d2f2a' }}>Admin</h1>
            <p className="text-xs" style={{ color: '#9a8578' }}>Little Souls Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
            style={({ isActive }) =>
              isActive
                ? { background: 'rgba(196,162,101,0.12)', color: '#c4a265' }
                : { color: '#9a8578' }
            }
            onMouseEnter={(e) => {
              const link = e.currentTarget;
              if (!link.classList.contains('active')) {
                link.style.color = '#3d2f2a';
                link.style.background = '#faf6ef';
              }
            }}
            onMouseLeave={(e) => {
              const link = e.currentTarget;
              // Check if it's the active link by looking at aria-current
              if (!link.getAttribute('aria-current')) {
                link.style.color = '#9a8578';
                link.style.background = 'transparent';
              }
            }}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.title}</span>
          </NavLink>
        ))}
      </nav>

      {/* User & Logout */}
      <div className="p-4" style={{ borderTop: '1px solid #e8ddd0' }}>
        <p className="text-xs mb-3 truncate" style={{ color: '#9a8578' }}>{adminEmail}</p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all"
          style={{ color: '#9a8578' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#3d2f2a';
            e.currentTarget.style.background = '#faf6ef';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#9a8578';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
