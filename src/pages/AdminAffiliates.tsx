import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { StarfieldBackground } from '@/components/cosmic/StarfieldBackground';
import { CosmicButton } from '@/components/cosmic/CosmicButton';
import { toast } from 'sonner';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  LogOut,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface Affiliate {
  id: string;
  email: string;
  name: string;
  referral_code: string;
  status: string;
  commission_rate: number;
  total_referrals: number;
  total_earnings_cents: number;
  pending_balance_cents: number;
  stripe_account_id: string;
  created_at: string;
  pending_referrals?: number;
  paid_referrals?: number;
}

interface Stats {
  totalAffiliates: number;
  activeAffiliates: number;
  pendingAffiliates: number;
  totalEarnings: number;
  pendingPayouts: number;
  totalReferrals: number;
  totalRevenue: number;
}

export default function AdminAffiliates() {
  const navigate = useNavigate();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);

  const adminToken = sessionStorage.getItem('admin_token');
  const adminEmail = sessionStorage.getItem('admin_email');

  useEffect(() => {
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }
    loadData();
  }, [adminToken, navigate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load affiliates
      const { data: affData, error: affError } = await supabase.functions.invoke(
        'admin-affiliates?action=list',
        { headers: { 'X-Admin-Token': adminToken! } }
      );
      
      if (affError) throw affError;
      setAffiliates(affData?.affiliates || []);

      // Load stats
      const { data: statsData, error: statsError } = await supabase.functions.invoke(
        'admin-affiliates?action=stats',
        { headers: { 'X-Admin-Token': adminToken! } }
      );
      
      if (statsError) throw statsError;
      setStats(statsData?.stats || null);
    } catch (err) {
      console.error('Failed to load data:', err);
      toast.error('Failed to load affiliate data');
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (affiliateId: string, status: string) => {
    try {
      const { error } = await supabase.functions.invoke(
        'admin-affiliates?action=update-status',
        {
          headers: { 'X-Admin-Token': adminToken! },
          body: { affiliateId, status },
        }
      );
      
      if (error) throw error;
      toast.success(`Affiliate ${status === 'active' ? 'approved' : 'updated'}`);
      loadData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const triggerPayouts = async () => {
    setIsProcessingPayout(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'admin-affiliates?action=trigger-payout',
        { headers: { 'X-Admin-Token': adminToken! } }
      );
      
      if (error) throw error;
      
      const payouts = data?.payouts || [];
      const successful = payouts.filter((p: any) => p.success).length;
      
      if (successful > 0) {
        toast.success(`${successful} payout(s) processed successfully!`);
      } else {
        toast.info('No eligible payouts at this time');
      }
      loadData();
    } catch (err) {
      toast.error('Failed to process payouts');
    } finally {
      setIsProcessingPayout(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_email');
    navigate('/admin/login');
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <StarfieldBackground />
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cosmic-gold" />
          <p className="mt-4 text-muted-foreground">Loading affiliate data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <StarfieldBackground />
      
      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Affiliate Dashboard
            </h1>
            <p className="text-muted-foreground">
              Logged in as {adminEmail}
            </p>
          </div>
          <div className="flex gap-3">
            <CosmicButton
              variant="secondary"
              onClick={loadData}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </CosmicButton>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cosmic-purple/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-cosmic-purple" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalAffiliates}</p>
                  <p className="text-xs text-muted-foreground">Total Affiliates</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.activeAffiliates}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cosmic-gold/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-cosmic-gold" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalRevenue)}</p>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.pendingPayouts)}</p>
                  <p className="text-xs text-muted-foreground">Pending Payouts</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payout Button */}
        <div className="mb-6">
          <CosmicButton
            onClick={triggerPayouts}
            disabled={isProcessingPayout || (stats?.pendingPayouts || 0) < 1000}
          >
            <DollarSign className="w-4 h-4 mr-2" />
            {isProcessingPayout ? 'Processing...' : 'Process Payouts'}
          </CosmicButton>
          <p className="text-xs text-muted-foreground mt-2">
            Minimum payout: $10.00 per affiliate
          </p>
        </div>

        {/* Affiliates Table */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Affiliate</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Referral Code</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Commission</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Referrals</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Earnings</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Pending</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {affiliates.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                      No affiliates yet. Share your affiliate signup page!
                    </td>
                  </tr>
                ) : (
                  affiliates.map((affiliate) => (
                    <tr key={affiliate.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{affiliate.name}</p>
                          <p className="text-sm text-muted-foreground">{affiliate.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-sm bg-muted px-2 py-1 rounded text-cosmic-gold">
                          {affiliate.referral_code}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          affiliate.status === 'active' 
                            ? 'bg-green-500/20 text-green-400'
                            : affiliate.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {affiliate.status === 'active' && <CheckCircle className="w-3 h-3" />}
                          {affiliate.status === 'pending' && <Clock className="w-3 h-3" />}
                          {affiliate.status === 'inactive' && <XCircle className="w-3 h-3" />}
                          {affiliate.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {(affiliate.commission_rate * 100).toFixed(0)}%
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {affiliate.total_referrals}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {formatCurrency(affiliate.total_earnings_cents)}
                      </td>
                      <td className="px-4 py-3 text-cosmic-gold font-medium">
                        {formatCurrency(affiliate.pending_balance_cents)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {affiliate.status === 'pending' && (
                            <button
                              onClick={() => updateStatus(affiliate.id, 'active')}
                              className="text-green-400 hover:text-green-300 text-sm"
                            >
                              Approve
                            </button>
                          )}
                          {affiliate.status === 'active' && (
                            <button
                              onClick={() => updateStatus(affiliate.id, 'inactive')}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Disable
                            </button>
                          )}
                          {affiliate.status === 'inactive' && (
                            <button
                              onClick={() => updateStatus(affiliate.id, 'active')}
                              className="text-green-400 hover:text-green-300 text-sm"
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
