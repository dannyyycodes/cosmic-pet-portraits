import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatCard } from '@/components/admin/StatCard';
import { toast } from 'sonner';
import { 
  FileText, 
  Users, 
  Mail, 
  DollarSign, 
  TrendingUp,
  Gift,
  RefreshCw,
  Star
} from 'lucide-react';
import { CosmicButton } from '@/components/cosmic/CosmicButton';

interface DashboardStats {
  totalReports: number;
  paidReports: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalAffiliates: number;
  activeAffiliates: number;
  totalRevenue: number;
  pendingPayouts: number;
  totalGiftCertificates: number;
  redeemedGiftCertificates: number;
  recentReports: any[];
  recentSubscriptions: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const token = sessionStorage.getItem('admin_token');
      if (!token) {
        toast.error('Not authenticated');
        return;
      }

      // Call admin-data Edge Function instead of direct DB queries
      const { data, error } = await supabase.functions.invoke('admin-data', {
        body: null,
        headers: {
          'X-Admin-Token': token,
        },
      });

      // Handle the response - need to pass action via URL params
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-data?action=dashboard`,
        {
          method: 'GET',
          headers: {
            'X-Admin-Token': token,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Session expired. Please login again.');
          sessionStorage.removeItem('admin_token');
          window.location.href = '/admin/login';
          return;
        }
        throw new Error('Failed to load data');
      }

      const { reports, subscriptions, affiliates, gifts } = await response.json();

      // Calculate stats
      const paidReports = reports?.filter((r: any) => r.payment_status === 'paid') || [];
      const activeSubscriptions = subscriptions?.filter((s: any) => s.status === 'active') || [];
      const activeAffiliates = affiliates?.filter((a: any) => a.status === 'active') || [];
      const redeemedGifts = gifts?.filter((g: any) => g.is_redeemed) || [];

      // Calculate revenue (estimate based on paid reports at $19.99)
      const reportRevenue = paidReports.length * 1999;
      const subscriptionRevenue = activeSubscriptions.length * 499;
      const giftRevenue = gifts?.reduce((acc: number, g: any) => acc + g.amount_cents, 0) || 0;
      const totalRevenue = reportRevenue + subscriptionRevenue + giftRevenue;

      // Calculate pending payouts
      const pendingPayouts = affiliates?.reduce((acc: number, a: any) => acc + a.pending_balance_cents, 0) || 0;

      setStats({
        totalReports: reports?.length || 0,
        paidReports: paidReports.length,
        totalSubscriptions: subscriptions?.length || 0,
        activeSubscriptions: activeSubscriptions.length,
        totalAffiliates: affiliates?.length || 0,
        activeAffiliates: activeAffiliates.length,
        totalRevenue,
        pendingPayouts,
        totalGiftCertificates: gifts?.length || 0,
        redeemedGiftCertificates: redeemedGifts.length,
        recentReports: reports?.slice(0, 5) || [],
        recentSubscriptions: subscriptions?.slice(0, 5) || [],
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
      toast.error('Failed to load dashboard stats');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Overview of your cosmic empire</p>
          </div>
          <CosmicButton
            variant="secondary"
            onClick={loadStats}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </CosmicButton>
        </div>

        {isLoading && !stats ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-cosmic-gold" />
          </div>
        ) : stats && (
          <>
            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Total Revenue"
                value={formatCurrency(stats.totalRevenue)}
                icon={DollarSign}
                iconColor="text-green-400"
                iconBg="bg-green-500/20"
              />
              <StatCard
                title="Paid Reports"
                value={stats.paidReports}
                subtitle={`${stats.totalReports} total`}
                icon={FileText}
                iconColor="text-cosmic-purple"
                iconBg="bg-cosmic-purple/20"
              />
              <StatCard
                title="Active Subscriptions"
                value={stats.activeSubscriptions}
                subtitle={`$${(stats.activeSubscriptions * 4.99).toFixed(2)}/month MRR`}
                icon={Mail}
                iconColor="text-cosmic-gold"
                iconBg="bg-cosmic-gold/20"
              />
              <StatCard
                title="Active Affiliates"
                value={stats.activeAffiliates}
                subtitle={`${formatCurrency(stats.pendingPayouts)} pending`}
                icon={Users}
                iconColor="text-blue-400"
                iconBg="bg-blue-500/20"
              />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <StatCard
                title="Gift Certificates"
                value={stats.totalGiftCertificates}
                subtitle={`${stats.redeemedGiftCertificates} redeemed`}
                icon={Gift}
                iconColor="text-pink-400"
                iconBg="bg-pink-500/20"
              />
              <StatCard
                title="Conversion Rate"
                value={stats.totalReports > 0 ? `${((stats.paidReports / stats.totalReports) * 100).toFixed(1)}%` : '0%'}
                subtitle="Reports → Paid"
                icon={TrendingUp}
                iconColor="text-cyan-400"
                iconBg="bg-cyan-500/20"
              />
              <StatCard
                title="Subscription Rate"
                value={stats.paidReports > 0 ? `${((stats.activeSubscriptions / stats.paidReports) * 100).toFixed(1)}%` : '0%'}
                subtitle="Paid → Subscribed"
                icon={Star}
                iconColor="text-yellow-400"
                iconBg="bg-yellow-500/20"
              />
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Reports */}
              <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Recent Reports</h2>
                {stats.recentReports.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No reports yet</p>
                ) : (
                  <div className="space-y-3">
                    {stats.recentReports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                        <div>
                          <p className="font-medium text-foreground">{report.pet_name}</p>
                          <p className="text-xs text-muted-foreground">{report.email}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            report.payment_status === 'paid'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {report.payment_status || 'pending'}
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(report.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Subscriptions */}
              <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Recent Subscriptions</h2>
                {stats.recentSubscriptions.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No subscriptions yet</p>
                ) : (
                  <div className="space-y-3">
                    {stats.recentSubscriptions.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                        <div>
                          <p className="font-medium text-foreground">{sub.pet_name}</p>
                          <p className="text-xs text-muted-foreground">{sub.email}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            sub.status === 'active'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {sub.status}
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(sub.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
