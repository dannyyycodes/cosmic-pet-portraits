import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Mail, 
  FileText, 
  DollarSign, 
  LogOut,
  Star,
  Gift
} from 'lucide-react';

const navItems = [
  { title: 'Overview', path: '/admin', icon: LayoutDashboard },
  { title: 'Pet Reports', path: '/admin/reports', icon: FileText },
  { title: 'Subscriptions', path: '/admin/subscriptions', icon: Mail },
  { title: 'Affiliates', path: '/admin/affiliates', icon: Users },
  { title: 'Gift Certificates', path: '/admin/gifts', icon: Gift },
];

export function AdminSidebar() {
  const navigate = useNavigate();
  const adminEmail = sessionStorage.getItem('admin_email');

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_email');
    navigate('/admin/login');
  };

  return (
    <aside className="w-64 min-h-screen bg-card/50 backdrop-blur-sm border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cosmic-gold to-cosmic-gold/60 flex items-center justify-center">
            <Star className="w-5 h-5 text-cosmic-deep" />
          </div>
          <div>
            <h1 className="font-display font-bold text-foreground">Admin</h1>
            <p className="text-xs text-muted-foreground">Cosmic Pet Portal</p>
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
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-cosmic-gold/20 text-cosmic-gold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.title}</span>
          </NavLink>
        ))}
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground mb-3 truncate">{adminEmail}</p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
