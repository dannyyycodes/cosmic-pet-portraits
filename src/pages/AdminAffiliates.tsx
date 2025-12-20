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
  Search,
  Edit2,
  X,
  Check
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
  const [editingCommission, setEditingCommission] = useState<string | null>(null);
  const [editCommissionValue, setEditCommissionValue] = useState('');

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
      toast.error('Failed to load affiliate data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

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
      const { error } = await supabase.functions.invoke('admin-affiliates?action=update-status', {
        headers: { 'X-Admin-Token': adminToken! },
        body: { affiliateId, status },
      });
      if (error) throw error;
      toast.success(`Affiliate ${status === 'active' ? 'approved' : 'updated'}`);
      loadData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const saveCommission = async (affiliateId: string) => {
    const rate = parseFloat(editCommissionValue) / 100;
    if (isNaN(rate) || rate < 0 || rate > 1) {
      toast.error('Commission must be between 0% and 100%');
      return;
    }
    try {
      const { error } = await supabase.functions.invoke('admin-affiliates?action=update-commission', {
        headers: { 'X-Admin-Token': adminToken! },
        body: { affiliateId, commissionRate: rate },
      });
      if (error) throw error;
      toast.success('Commission rate updated!');
      setEditingCommission(null);
      loadData();
    } catch (err) {
      toast.error('Failed to update commission');
    }
  };

  const triggerPayouts = async () => {
    setIsProcessingPayout(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-affiliates?action=trigger-payout', {
        headers: { 'X-Admin-Token': adminToken! }
      });
      if (error) throw error;
      const successful = (data?.payouts || []).filter((p: any) => p.success).length;
      if (successful > 0) toast.success(`${successful} payout(s) processed!`);
      else toast.info('No eligible payouts');
      loadData();
    } catch (err) {
      toast.error('Failed to process payouts');
    } finally {
      setIsProcessingPayout(false);
    }
  };

  const formatCurrency = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  const activeCount = affiliates.filter(a => a.status === 'active').length;
  const totalEarnings = affiliates.reduce((acc, a) => acc + a.total_earnings_cents, 0);
  const pendingPayouts = affiliates.reduce((acc, a) => acc + a.pending_balance_cents, 0);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Affiliates</h1>
            <p className="text-muted-foreground">Manage your affiliate partners</p>
          </div>
          <div className="flex gap-3">
            <CosmicButton onClick={triggerPayouts} disabled={isProcessingPayout || pendingPayouts < 1000}>
              <DollarSign className="w-4 h-4 mr-2" />{isProcessingPayout ? 'Processing...' : 'Process Payouts'}
            </CosmicButton>
            <CosmicButton variant="secondary" onClick={loadData} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />Refresh
            </CosmicButton>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard title="Total Affiliates" value={affiliates.length} icon={Users} iconColor="text-cosmic-purple" iconBg="bg-cosmic-purple/20" />
          <StatCard title="Active" value={activeCount} icon={CheckCircle} iconColor="text-green-400" iconBg="bg-green-500/20" />
          <StatCard title="Total Paid Out" value={formatCurrency(totalEarnings)} icon={TrendingUp} iconColor="text-cosmic-gold" iconBg="bg-cosmic-gold/20" />
          <StatCard title="Pending Payouts" value={formatCurrency(pendingPayouts)} subtitle="Min $10 to payout" icon={Clock} iconColor="text-orange-400" iconBg="bg-orange-500/20" />
        </div>

        <div className="mb-6 p-4 bg-cosmic-purple/10 border border-cosmic-purple/30 rounded-xl">
          <h3 className="font-semibold text-foreground mb-2">💡 Suggested Commission Rates</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-muted-foreground">Standard: <strong className="text-foreground">25%</strong></span>
            <span className="text-muted-foreground">Top Performers: <strong className="text-foreground">35%</strong></span>
            <span className="text-muted-foreground">VIP/Influencers: <strong className="text-foreground">40-50%</strong></span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search..." className="w-full pl-11 pr-4 py-3 bg-card/50 border border-border rounded-xl text-foreground" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-3 bg-card/50 border border-border rounded-xl text-foreground">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="bg-card/50 border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Affiliate</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Code</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Commission</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Referrals</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Earnings</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Actions</th>
            </tr></thead>
            <tbody>
              {isLoading ? <tr><td colSpan={7} className="py-12 text-center"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-cosmic-gold" /></td></tr>
              : filteredAffiliates.map((a) => (
                <tr key={a.id} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="px-4 py-3"><p className="font-medium text-foreground">{a.name}</p><p className="text-sm text-muted-foreground">{a.email}</p></td>
                  <td className="px-4 py-3"><code className="text-sm bg-muted px-2 py-1 rounded text-cosmic-gold">{a.referral_code}</code></td>
                  <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${a.status === 'active' ? 'bg-green-500/20 text-green-400' : a.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>{a.status}</span></td>
                  <td className="px-4 py-3">
                    {editingCommission === a.id ? (
                      <div className="flex items-center gap-1">
                        <input type="number" value={editCommissionValue} onChange={(e) => setEditCommissionValue(e.target.value)} className="w-16 px-2 py-1 bg-background border border-border rounded text-sm" min="0" max="100" />
                        <span className="text-muted-foreground text-sm">%</span>
                        <button onClick={() => saveCommission(a.id)} className="p-1 text-green-400"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingCommission(null)} className="p-1 text-muted-foreground"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-foreground font-medium">{(a.commission_rate * 100).toFixed(0)}%</span>
                        <button onClick={() => { setEditingCommission(a.id); setEditCommissionValue((a.commission_rate * 100).toFixed(0)); }} className="p-1 hover:bg-muted rounded text-muted-foreground"><Edit2 className="w-3 h-3" /></button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-foreground">{a.total_referrals}</td>
                  <td className="px-4 py-3 text-cosmic-gold font-medium">{formatCurrency(a.total_earnings_cents)}</td>
                  <td className="px-4 py-3">
                    {a.status === 'pending' && <button onClick={() => updateStatus(a.id, 'active')} className="text-green-400 text-sm">Approve</button>}
                    {a.status === 'active' && <button onClick={() => updateStatus(a.id, 'inactive')} className="text-red-400 text-sm">Disable</button>}
                    {a.status === 'inactive' && <button onClick={() => updateStatus(a.id, 'active')} className="text-green-400 text-sm">Reactivate</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
