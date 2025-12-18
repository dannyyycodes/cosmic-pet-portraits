import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatCard } from '@/components/admin/StatCard';
import { CosmicButton } from '@/components/cosmic/CosmicButton';
import { toast } from 'sonner';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Search
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
}

export default function AdminAffiliates() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [filteredAffiliates, setFilteredAffiliates] = useState<Affiliate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const adminToken = sessionStorage.getItem('admin_token');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: affData, error: affError } = await supabase.functions.invoke(
        'admin-affiliates?action=list',
        { headers: { 'X-Admin-Token': adminToken! } }
      );
      
      if (affError) throw affError;
      setAffiliates(affData?.affiliates || []);
      setFilteredAffiliates(affData?.affiliates || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      toast.error('Failed to load affiliate data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = affiliates;

    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.referral_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => a.status === statusFilter);
    }

    setFilteredAffiliates(filtered);
  }, [searchTerm, statusFilter, affiliates]);

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
      year: 'numeric',
    });
  };

  const activeCount = affiliates.filter(a => a.status === 'active').length;
  const pendingCount = affiliates.filter(a => a.status === 'pending').length;
  const totalEarnings = affiliates.reduce((acc, a) => acc + a.total_earnings_cents, 0);
  const pendingPayouts = affiliates.reduce((acc, a) => acc + a.pending_balance_cents, 0);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Affiliates</h1>
            <p className="text-muted-foreground">Manage your affiliate partners</p>
          </div>
          <div className="flex gap-3">
            <CosmicButton
              onClick={triggerPayouts}
              disabled={isProcessingPayout || pendingPayouts < 1000}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              {isProcessingPayout ? 'Processing...' : 'Process Payouts'}
            </CosmicButton>
            <CosmicButton
              variant="secondary"
              onClick={loadData}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </CosmicButton>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Affiliates"
            value={affiliates.length}
            icon={Users}
            iconColor="text-cosmic-purple"
            iconBg="bg-cosmic-purple/20"
          />
          <StatCard
            title="Active"
            value={activeCount}
            icon={CheckCircle}
            iconColor="text-green-400"
            iconBg="bg-green-500/20"
          />
          <StatCard
            title="Total Paid Out"
            value={formatCurrency(totalEarnings)}
            icon={TrendingUp}
            iconColor="text-cosmic-gold"
            iconBg="bg-cosmic-gold/20"
          />
          <StatCard
            title="Pending Payouts"
            value={formatCurrency(pendingPayouts)}
            subtitle="Min $10 to payout"
            icon={Clock}
            iconColor="text-orange-400"
            iconBg="bg-orange-500/20"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or code..."
              className="w-full pl-11 pr-4 py-3 bg-card/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cosmic-gold/50"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-card/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-cosmic-gold/50"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Table */}
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
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cosmic-gold" />
                    </td>
                  </tr>
                ) : filteredAffiliates.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                      No affiliates found
                    </td>
                  </tr>
                ) : (
                  filteredAffiliates.map((affiliate) => (
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
    </AdminLayout>
  );
}
