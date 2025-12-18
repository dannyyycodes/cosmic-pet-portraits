import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatCard } from '@/components/admin/StatCard';
import { CosmicButton } from '@/components/cosmic/CosmicButton';
import { toast } from 'sonner';
import { 
  Mail, 
  RefreshCw, 
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  DollarSign,
  Play
} from 'lucide-react';

interface Subscription {
  id: string;
  email: string;
  pet_name: string;
  status: string;
  stripe_subscription_id: string | null;
  created_at: string;
  next_send_at: string;
  cancelled_at: string | null;
}

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadSubscriptions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('horoscope_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSubscriptions(data || []);
      setFilteredSubscriptions(data || []);
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
      toast.error('Failed to load subscriptions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  useEffect(() => {
    let filtered = subscriptions;

    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.pet_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    setFilteredSubscriptions(filtered);
  }, [searchTerm, statusFilter, subscriptions]);

  const triggerHoroscopes = async () => {
    setIsTriggering(true);
    try {
      const { error } = await supabase.functions.invoke('generate-weekly-horoscopes');
      
      if (error) throw error;
      toast.success('Horoscopes generation triggered!');
      loadSubscriptions();
    } catch (err) {
      console.error('Failed to trigger horoscopes:', err);
      toast.error('Failed to trigger horoscopes');
    } finally {
      setIsTriggering(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const activeCount = subscriptions.filter(s => s.status === 'active').length;
  const cancelledCount = subscriptions.filter(s => s.status === 'cancelled').length;
  const mrr = activeCount * 499; // $4.99 per subscription

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Horoscope Subscriptions</h1>
            <p className="text-muted-foreground">Weekly cosmic forecasts at $4.99/month</p>
          </div>
          <div className="flex gap-3">
            <CosmicButton
              variant="secondary"
              onClick={triggerHoroscopes}
              disabled={isTriggering}
            >
              <Play className={`w-4 h-4 mr-2`} />
              {isTriggering ? 'Triggering...' : 'Send Horoscopes Now'}
            </CosmicButton>
            <CosmicButton
              variant="secondary"
              onClick={loadSubscriptions}
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
            title="Total Subscriptions"
            value={subscriptions.length}
            icon={Mail}
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
            title="Monthly Revenue"
            value={`$${(mrr / 100).toFixed(2)}`}
            subtitle="MRR"
            icon={DollarSign}
            iconColor="text-cosmic-gold"
            iconBg="bg-cosmic-gold/20"
          />
          <StatCard
            title="Cancelled"
            value={cancelledCount}
            icon={XCircle}
            iconColor="text-red-400"
            iconBg="bg-red-500/20"
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
              placeholder="Search by pet name or email..."
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
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Pet</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Next Send</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Subscribed</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Stripe ID</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cosmic-gold" />
                    </td>
                  </tr>
                ) : filteredSubscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      No subscriptions found
                    </td>
                  </tr>
                ) : (
                  filteredSubscriptions.map((sub) => (
                    <tr key={sub.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{sub.pet_name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-foreground truncate max-w-[200px]">{sub.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          sub.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {sub.status === 'active' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {formatDate(sub.next_send_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-sm">
                        {formatDate(sub.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        {sub.stripe_subscription_id ? (
                          <code className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
                            {sub.stripe_subscription_id.slice(0, 20)}...
                          </code>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
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
