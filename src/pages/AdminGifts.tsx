import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatCard } from '@/components/admin/StatCard';
import { CosmicButton } from '@/components/cosmic/CosmicButton';
import { toast } from 'sonner';
import { 
  Gift, 
  RefreshCw, 
  Search,
  CheckCircle,
  Clock,
  DollarSign,
  Copy
} from 'lucide-react';

interface GiftCertificate {
  id: string;
  code: string;
  amount_cents: number;
  purchaser_email: string;
  recipient_email: string | null;
  recipient_name: string | null;
  gift_message: string | null;
  is_redeemed: boolean;
  redeemed_at: string | null;
  created_at: string;
  expires_at: string | null;
}

export default function AdminGifts() {
  const [gifts, setGifts] = useState<GiftCertificate[]>([]);
  const [filteredGifts, setFilteredGifts] = useState<GiftCertificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadGifts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('gift_certificates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setGifts(data || []);
      setFilteredGifts(data || []);
    } catch (err) {
      console.error('Failed to load gifts:', err);
      toast.error('Failed to load gift certificates');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGifts();
  }, []);

  useEffect(() => {
    let filtered = gifts;

    if (searchTerm) {
      filtered = filtered.filter(g =>
        g.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.purchaser_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.recipient_email && g.recipient_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (g.recipient_name && g.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter === 'redeemed') {
      filtered = filtered.filter(g => g.is_redeemed);
    } else if (statusFilter === 'available') {
      filtered = filtered.filter(g => !g.is_redeemed);
    }

    setFilteredGifts(filtered);
  }, [searchTerm, statusFilter, gifts]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied!');
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const redeemedCount = gifts.filter(g => g.is_redeemed).length;
  const availableCount = gifts.filter(g => !g.is_redeemed).length;
  const totalValue = gifts.reduce((acc, g) => acc + g.amount_cents, 0);
  const redeemedValue = gifts.filter(g => g.is_redeemed).reduce((acc, g) => acc + g.amount_cents, 0);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Gift Certificates</h1>
            <p className="text-muted-foreground">Manage cosmic gift vouchers</p>
          </div>
          <CosmicButton
            variant="secondary"
            onClick={loadGifts}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </CosmicButton>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Certificates"
            value={gifts.length}
            icon={Gift}
            iconColor="text-pink-400"
            iconBg="bg-pink-500/20"
          />
          <StatCard
            title="Total Value"
            value={formatCurrency(totalValue)}
            icon={DollarSign}
            iconColor="text-cosmic-gold"
            iconBg="bg-cosmic-gold/20"
          />
          <StatCard
            title="Redeemed"
            value={redeemedCount}
            subtitle={formatCurrency(redeemedValue)}
            icon={CheckCircle}
            iconColor="text-green-400"
            iconBg="bg-green-500/20"
          />
          <StatCard
            title="Available"
            value={availableCount}
            icon={Clock}
            iconColor="text-yellow-400"
            iconBg="bg-yellow-500/20"
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
              placeholder="Search by code, email, or recipient..."
              className="w-full pl-11 pr-4 py-3 bg-card/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cosmic-gold/50"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-card/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-cosmic-gold/50"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="redeemed">Redeemed</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Code</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Purchaser</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Recipient</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Created</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cosmic-gold" />
                    </td>
                  </tr>
                ) : filteredGifts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      No gift certificates found
                    </td>
                  </tr>
                ) : (
                  filteredGifts.map((gift) => (
                    <tr key={gift.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <code className="text-sm bg-muted px-2 py-1 rounded text-cosmic-gold font-mono">
                          {gift.code}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{formatCurrency(gift.amount_cents)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-foreground truncate max-w-[150px]">{gift.purchaser_email}</p>
                      </td>
                      <td className="px-4 py-3">
                        {gift.recipient_name || gift.recipient_email ? (
                          <div>
                            {gift.recipient_name && (
                              <p className="text-sm text-foreground">{gift.recipient_name}</p>
                            )}
                            {gift.recipient_email && (
                              <p className="text-xs text-muted-foreground truncate max-w-[150px]">{gift.recipient_email}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not specified</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          gift.is_redeemed
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {gift.is_redeemed ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Redeemed
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              Available
                            </>
                          )}
                        </span>
                        {gift.redeemed_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(gift.redeemed_at)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-sm">
                        {formatDate(gift.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => copyCode(gift.code)}
                          className="text-cosmic-gold hover:text-cosmic-gold/80 text-sm flex items-center gap-1"
                        >
                          <Copy className="w-4 h-4" />
                          Copy
                        </button>
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
